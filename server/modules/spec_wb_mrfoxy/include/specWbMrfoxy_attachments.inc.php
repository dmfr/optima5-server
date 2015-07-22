<?php
function specWbMrfoxy_attachments_cfgGetTypes() {
	global $_opDB ;
	$query = "SELECT * FROM view_bible_ATTACH_TYPE_tree ORDER BY field_ATTACHTYPE" ;
	$result = $_opDB->query($query) ;
	$TAB = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB[] = array(
			'attachtype' => $arr['field_ATTACHTYPE'],
			'attachtype_txt' => $arr['field_ATTACHTYPE_TXT'],
			'is_invoice' => $arr['field_IS_INVOICE']
		);
	}
	return array('success'=>true, 'data'=>$TAB) ;
}

function specWbMrfoxy_attachments_getList( $post_data ) {
	$forward_post = array() ;
	$forward_post['start'] ;
	$forward_post['limit'] ;
	$forward_post['file_code'] = 'WORK_ATTACH' ;
	if( $post_data['filter_id'] ) {
		$forward_post['filter'] = json_encode(array(
			array(
				'operator' => 'in',
				'property' => 'WORK_ATTACH_id',
				'value' => json_decode($post_data['filter_id'],true)
			)
		)) ;
	}
	$ttmp = paracrm_data_getFileGrid_data( $forward_post, $auth_bypass=TRUE ) ;
	$paracrm_TAB = $ttmp['data'] ;
	$TAB = array() ;
	foreach( $paracrm_TAB as $paracrm_row ) {
		$TAB[] = array(
			'filerecord_id'=> $paracrm_row['WORK_ATTACH_id'],
			'country_code' => $paracrm_row['WORK_ATTACH_field_COUNTRY'],
			'doc_date' => date('Y-m-d',strtotime($paracrm_row['WORK_ATTACH_field_DATE'])),
			'doc_type' => $paracrm_row['WORK_ATTACH_field_TYPE'],
			'invoice_txt' => $paracrm_row['WORK_ATTACH_field_INVOICE_TXT'],
			'invoice_amount' => $paracrm_row['WORK_ATTACH_field_INVOICE_AMOUNT'],
			'invoice_is_reject' => $paracrm_row['WORK_ATTACH_field_INVOICE_IS_REJECT']
		) ;
	}
	return array('success'=>true, 'data'=>$TAB) ;
}
function specWbMrfoxy_attachments_uploadfile($post_data) {
	media_contextOpen( $_POST['_sdomainId'] ) ;
	foreach( $_FILES as $mkey => $dummy ) {
		$media_id = media_img_processUploaded( $_FILES[$mkey]['tmp_name'], $_FILES[$mkey]['name'] ) ;
		break ;
	}
	media_contextClose() ;
	if( !$media_id ) {
		return array('success'=>false) ;
	}
	return array('success'=>true, 'data'=>array('tmp_id'=>$media_id)) ;
}
function specWbMrfoxy_attachments_setAttachment($post_data) {
	$form_data = json_decode($post_data['data'],true) ;
		usleep(500000) ;
		
	$newrecord = array() ;
	//$newrecord['media_title'] = $_FILES['photo-filename']['name'] ;
	$newrecord['media_date'] = date('Y-m-d H:i:s') ;
	$newrecord['media_mimetype'] = 'image/jpeg' ;
	$newrecord['field_COUNTRY'] = $form_data['country_code'] ;
	$newrecord['field_DATE'] = $form_data['doc_date'] ;
	$newrecord['field_TYPE'] = $form_data['doc_type'] ;
	$newrecord['field_INVOICE_TXT'] = $form_data['invoice_txt'] ;
	$newrecord['field_INVOICE_AMOUNT'] = $form_data['invoice_amount'] ;
	$newrecord['field_INVOICE_IS_REJECT'] = $form_data['invoice_is_reject'] ;
	if( $form_data['filerecord_id'] > 0 ) {
		$img_filerecordId = $form_data['filerecord_id'] ;
		paracrm_lib_data_updateRecord_file( 'WORK_ATTACH', $newrecord, $img_filerecordId ) ;
	} elseif( $form_data['tmp_id'] ) {
		$img_filerecordId = paracrm_lib_data_insertRecord_file( 'WORK_ATTACH', 0, $newrecord ) ;
		
		media_contextOpen( $_POST['_sdomainId'] ) ;
		media_img_move( $form_data['tmp_id'] , $img_filerecordId ) ;
		media_contextClose() ;
	} else {
		return array('success'=>false) ;
	}
	
	return array('success'=>true, 'data'=>array('filerecord_id'=>$img_filerecordId)) ;
}
function specWbMrfoxy_attachments_delete($post_data) {
	$attach_filerecordId = $post_data['filerecord_id'] ;
	
	media_contextOpen( $_POST['_sdomainId'] ) ;
	media_img_delete( $attach_filerecordId ) ;
	media_contextClose() ;
	
	if( is_numeric($attach_filerecordId) ) {
		paracrm_lib_data_deleteRecord_file('WORK_ATTACH',$attach_filerecordId) ;
	}

	return array('success'=>true) ;
}
function specWbMrfoxy_attachments_reject($post_data) {
	$attach_filerecordId = $post_data['filerecord_id'] ;
	
	$record = paracrm_lib_data_getRecord_file('WORK_ATTACH',$attach_filerecordId) ;
	$record['field_INVOICE_IS_REJECT'] = 1 ;
	if( $post_data['invoice_txt_plus'] ) {
		$record['field_INVOICE_TXT'] .= ' '.$post_data['invoice_txt_plus'] ;
	}
	paracrm_lib_data_updateRecord_file( 'WORK_ATTACH', $record, $attach_filerecordId ) ;
	
	if( $doSendEmail=TRUE ) {
		$ttmp = specWbMrfoxy_attachments_getList( array(
			'filter_id'=>json_encode(array($attach_filerecordId))
		) ) ;
		if( count($ttmp['data']) != 1 ) {
			die() ;
		}
		$attachment_row = $ttmp['data'][0] ;
		
		media_contextOpen( $_POST['_sdomainId'] ) ;
		$invoice_jpg_binary = media_img_getBinary( $attach_filerecordId ) ;
		media_contextClose() ;
		
		specWbMrfoxy_attachments_lib_sendInvoiceEmail( $attachment_row, NULL, $invoice_jpg_binary ) ;
	}

	return array('success'=>true) ;
}




function specWbMrfoxy_attachments_lib_sendInvoiceEmail( $attachment_row, $obj_row, $invoice_jpg_binary ) {
	$recipients = specWbMrfoxy_attachments_lib_findRecipients($attachment_row['country_code'], array('SM','TF')) ;
	
	if( $obj_row['promo_id'] ) {
		$subject = 'Invoice for Promo'.', # '.$obj_row['promo_id'] ;
	} elseif( $obj_row['nagreement_id'] ) {
		$subject = 'Invoice for NationalAgr.'.', # '.$obj_row['nagreement_id'] ;
	} elseif( $obj_row == NULL ) {
		$subject = 'Invoice rejected !' ;
	} else {
		$subject = 'Unknown action' ;
	}
	
	if( $obj_row == NULL ) {
		$body = '' ;
		$body.= "Dear Team Finance,\r\n" ;
		$body.= "An incoming invoice has been <b>rejected</b>.\r\n" ;
		$body.= "Please hold payment until further notice.\r\n" ;
		$body.= "\r\n" ;
	} else {
		$body = '' ;
		$body.= "Dear Team Finance,\r\n" ;
		$body.= "A new invoice has been received.\r\n" ;
		$body.= "This is a notification to proceed to payment.\r\n" ;
		$body.= "\r\n" ;
	}
	
	if( $invoice_jpg_binary ) {
		$invoice_filename = 'invoice.jpg' ;
		specWbMrfoxy_attachments_lib_sendHtmlEmail( $recipients, $attachment_row, $obj_row, $subject, $body, $invoice_filename, $invoice_jpg_binary ) ;
	} else {
		specWbMrfoxy_attachments_lib_sendHtmlEmail( $recipients, $attachment_row, $obj_row, $subject, $body ) ;
	}
}

function specWbMrfoxy_attachments_lib_mailFactory( $recipients, $subject, $body, $attach_filename, $attach_binary ) {
	//$email_text = "{$body}\r\n\r\n\r\nDo not respond directly to this message.\r\n\r\nMrFoxy access:\r\nhttp://mrfoxy.eu\r\n\r\nShould you have any question or need login ID,\r\nplease contact mrfoxy@wonderfulbrands.com\r\n\r\n" ;
	
	if( $GLOBALS['__OPTIMA_TEST'] ) {
		$recipients = array($GLOBALS['__OPTIMA_TEST_EMAIL']) ;
	}
	
	$email = new Email() ;
	$email->set_From( 'noreply@wonderfulbrands.com', "Mr Foxy, Promotion Tool" ) ;
	foreach( $recipients as $to_email ) {
		$email->add_Recipient( $to_email ) ;
	}
	$email->set_Subject( $subject ) ;
	$email->set_HTML_body( $body ) ;
	if( $attach_filename && $attach_binary ) {
		$email->attach_binary( $attach_filename, $attach_binary ) ;
	}
	$email->send() ;
}
function specWbMrfoxy_attachments_lib_getHtmlBody_getInnerTable( $rows ) {
	$src = '' ;
	$src.= '<table>' ;
	foreach( $rows as $row ) {
		if( $row===NULL ) {
			$src.= "<tr><td height='5'/></tr>" ;
			continue ;
		}
		$src.= "\r\n" ;
		$src.= "<tr>" ;
			$src.= "<td align='right'>{$row[0]}</td>" ;
			$src.= "<td>&nbsp;&nbsp;</td>" ;
			$src.= "<td align='left'><b>{$row[1]}</b></td>" ;
		$src.= "</tr>" ;
	}
	$src.= '</table>' ;
	return $src ;
}
function specWbMrfoxy_attachments_lib_getHtmlBody( $attachment_row, $obj_row, $body_text ) {
	$templates_dir = $GLOBALS['templates_dir'] ;
	
	$header_src = "\r\n" ;
	$header_src.= "<table><tr>" ;
		$logo_base64 = base64_encode( file_get_contents($templates_dir.'/'.'WB_MRFOXY_email_logo.png') ) ;
		$header_src.= "<td width='128' align='center'>" ;
		$header_src.= "<img src=\"data:image/png;base64,$logo_base64\"/>" ;
		$header_src.= "</td>" ;
		
		$header_src.= "<td>" ;
		$header_src.= "\r\n<span class='text-small' style='color:#000000;'><b><i>".'Mr Foxy, validated INVOICE'."</i></b></span><br>" ;
		$header_src.= "</td>" ;
	$header_src.= "</tr></table>" ;
	
	
	$desc_src = "\r\n" ;
	$desc_src.= '<table>' ;
	$desc_src.= '<tr>' ;
	$desc_src.= '<td>' ;
		$desc_rows = array() ;
		$desc_rows[] = array('Invoice date',date('d/m/Y', strtotime($attachment_row['doc_date']))) ;
		$desc_rows[] = array('Invoice Amount',(float)$attachment_row['invoice_amount'].' '.specWbMrfoxy_tool_getCountryCurrency($attachment_row['country_code'])) ;
		$desc_rows[] = NULL ;
		$desc_rows[] = array('Comment',$attachment_row['invoice_txt']) ;
		$desc_rows[] = NULL ;
		if( $obj_row['promo_id'] ) {
			$desc_rows[] = array('Promo #',$obj_row['promo_id']) ;
		}
		if( $obj_row['nagreement_id'] ) {
			$desc_rows[] = array('National Agreement #',$obj_row['nagreement_id']) ;
		}
		$desc_src.= specWbMrfoxy_attachments_lib_getHtmlBody_getInnerTable( $desc_rows ) ;
	$desc_src.= "</td>" ;
	$desc_src.= "</tr>" ;
	$desc_src.= "</table>" ;
	
	
	$text_src = "\r\n" ;
	$text_src.= '<div class="text-xsmall">' ;
	foreach( preg_split('/$\R?^/m', $body_text) as $line ) {
		$text_src.= "\r\n".$line."<br>" ;
	}
	$text_src.= '</div>' ;
	
	
	$footer_src = "\r\n" ;
	$footer_src.= '<div class="text-xxsmall">' ;
		$footer_src.= 'Do not respond directly to this message.<br>';
		$footer_src.= 'MrFoxy access : <a href="http://mrfoxy.eu">http://mrfoxy.eu</a><br>';
		$footer_src.= 'Should you have any question or need login ID, please contact <b>mrfoxy@wonderfulbrands.com</b><br>';
	$footer_src.= '</div>' ;
	
	
	$body_src = "\r\n" ;
	$body_src.= '<div>' ;
		$body_src.= $header_src ;
		$body_src.= "<hr>" ;
		$body_src.= $text_src ;
		$body_src.= $desc_src ;
		$body_src.= "<hr>" ;
		$body_src.= $footer_src ;
	$body_src.= "</div>" ;
	
	
	$template_resource_binary = file_get_contents($templates_dir.'/'.'WB_MRFOXY_email_template.html') ;
	$doc = new DOMDocument();
	@$doc->loadHTML($template_resource_binary);
	$elements = $doc->getElementsByTagName('email-body');
	$i = $elements->length - 1;
	while ($i > -1) {
		$node_emailBody = $elements->item($i);
		$i--;
		
		$dom_div = new DOMDocument();
		$dom_div->loadHTML( '<?xml encoding="UTF-8"><html>'.$body_src.'</html>' ) ;
		$node_div = $dom_div->getElementsByTagName("div")->item(0);
		
		$node_div = $doc->importNode($node_div,true) ;
		
		$node_emailBody->parentNode->replaceChild($node_div,$node_emailBody) ;
	}
	return $doc->saveHTML() ;
}
function specWbMrfoxy_attachments_lib_sendHtmlEmail( $recipients, $attachment_row, $obj_row, $subject_text, $body_text, $attach_filename=NULL, $attach_binary=NULL ) {
	specWbMrfoxy_attachments_lib_mailFactory( $recipients, $subject_text, specWbMrfoxy_attachments_lib_getHtmlBody($attachment_row,$obj_row,$body_text), $attach_filename, $attach_binary ) ;
}
function specWbMrfoxy_attachments_lib_findRecipients( $country_code, $arr_roleCode ) {
	global $_opDB ;
	$authTable = specWbMrfoxy_auth_lib_getTable(array()) ;
	
	$arr_userId = array() ;
	foreach( $authTable as $str ) {
		$ttmp = explode('@',$str) ;
		if( $ttmp[1] == $country_code && in_array($ttmp[2],$arr_roleCode) ) {
			$arr_userId[] = $ttmp[0] ;
		}
	}
	
	$arr_recipients = array() ;
	foreach( $arr_userId as $userId ) {
		$query = "SELECT field_USER_EMAIL FROM view_bible__USER_entry WHERE entry_key='{$userId}'" ;
		if( ($email = $_opDB->query_uniqueValue($query)) && !in_array($email,$arr_recipients) ) {
			$arr_recipients[] = $email ;
		}
	}
	return $arr_recipients ;
}


?>