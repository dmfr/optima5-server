<?php

function specDbsTracy_lib_edi_robot() {
	global $_opDB ;
	
	$maps_ediCode_params = array() ;
	$query = "SELECT * FROM view_bible_CFG_EDI_entry" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$edi_code = $arr['entry_key'] ;
		$params = $arr['field_OUT_PARAMS'] ;
		$arr_params = array() ;
		foreach( explode(';',$params) as $keyval ) {
			$ttmp = explode('=',$keyval,2) ;
			$mkey = trim($ttmp[0]) ;
			$mval = trim($ttmp[1]) ;
			$arr_params[$mkey] = $mval ;
		}
		$maps_ediCode_params[$edi_code] = $arr_params ;
	}
	if( $GLOBALS['__OPTIMA_TEST'] ) {
		$maps_ediCode_params['TRSPT_CUSTOMS_XML']['LOCAL_PATH'] = '/tmp' ;
		
		$maps_ediCode_params['TRSPT_CUSTOMS_EMAIL']['SMTP'] = '127.0.0.1' ;
		$maps_ediCode_params['TRSPT_CUSTOMS_EMAIL']['EMAIL_TO'] = 'dm@mirabel-sil.com' ;
	}
	
	$query = "SELECT filerecord_id as trsptedi_filerecord_id
				, filerecord_parent_id as trspt_filerecord_id
				, field_EDI_CODE as edi_code 
				FROM view_file_TRSPT_EDI WHERE field_EXEC_STATUS='0'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$edi_code = $arr['edi_code'] ;
		if( !isset($maps_ediCode_params[$edi_code]) ) {
			continue ;
		}
		switch( $arr['edi_code'] ) {
			case 'TRSPT_CUSTOMS_EMAIL' :
				$ret = specDbsTracy_lib_edi_flow_TRSPTCUSTOMSEMAIL($arr['trspt_filerecord_id'],$maps_ediCode_params[$edi_code]) ;
				break ;
			case 'TRSPT_CUSTOMS_XML' :
				$ret = specDbsTracy_lib_edi_flow_TRSPTCUSTOMSXML($arr['trspt_filerecord_id'],$maps_ediCode_params[$edi_code]) ;
				break ;
			default :
				$ret = FALSE ;
				break ;
		}
		switch( $arr['edi_code'] ) {
			case 'TRSPT_CUSTOMS_EMAIL' :
			case 'TRSPT_CUSTOMS_XML' :
				if( $ret ) {
					$arr_update = array() ;
					$arr_update['field_CUSTOMS_DATE_REQUEST'] = date('Y-m-d H:i:s') ;
					paracrm_lib_data_updateRecord_file( 'TRSPT', $arr_update, $arr['trspt_filerecord_id'] );
				
					specDbsTracy_trspt_ackCustomsStatus( array('trspt_filerecord_id'=>$arr['trspt_filerecord_id']) ) ;
				}
				break ;
			default :
				break ;
		}
		if( $ret ) {
			$arr_ins = array() ;
			$arr_ins['field_EXEC_STATUS'] = 1 ;
			$arr_ins['field_EXEC_DATE'] = date('Y-m-d H:i:s') ;
			paracrm_lib_data_updateRecord_file( 'TRSPT_EDI', $arr_ins, $arr['trsptedi_filerecord_id'] );
		}
	}
}

function specDbsTracy_lib_edi_flow_TRSPTCUSTOMSEMAIL( $trspt_filerecord_id, $arr_params ) {
	global $_opDB ;
	
	$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
	$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;
	
	
	if( !$arr_params['EMAIL_TO'] ) {
		return FALSE ;
	}
	
	$ttmp = specDbsTracy_trspt_getRecords(array('filter_trsptFilerecordId_arr'=>json_encode(array($trspt_filerecord_id)))) ;
	$trspt_record = $ttmp['data'][0] ;
	if( !$trspt_record ) {
		return FALSE ;
	}
	
	
	//print_r($trspt_record) ;
	$hat_record = reset($trspt_record['hats']) ;
	$order_record = reset($trspt_record['orders']) ;
	
	$arr_orderIds = array() ;
	$arr_invIds = array() ;
	foreach( $trspt_record['orders'] as $order_record ) {
		if( !in_array($order_record['ref_invoice'],$arr_invIds) ) {
			$arr_invIds[] = $order_record['ref_invoice'] ;
		}
		if( !in_array($order_record['id_dn'],$arr_orderIds) ) {
			$arr_orderIds[] = $order_record['id_dn'] ;
		}
	}
	$order_record = reset($trspt_record['orders']) ;
	
	
	$txt_buffer = '' ;
	
	$txt_buffer.= "\r\n" ;
	$txt_buffer.= 'Bonjour,'."\r\n" ;
	$txt_buffer.= "\r\n" ;
	$txt_buffer.= "\r\n" ;
	$txt_buffer.= 'Merci de bien vouloir trouver ci-dessous les détails d’une nouvelle expédition export :'."\r\n" ;
	$txt_buffer.= "\r\n" ;
	
	$inv_no = $order_record['ref_invoice'] ;
	$inv_txt = implode(' ',$arr_invIds) ;
	$txt_buffer.= "Référence facture(s) : {$inv_txt}\r\n" ;
	$txt_buffer.= "\r\n" ;
	
	$carrier_code = $trspt_record['mvt_carrier'] ;
	$ttmp = paracrm_lib_data_getRecord('bible_entry','LIST_CARRIER',$carrier_code) ;
	$carrier_txt = $ttmp['field_NAME'] ;
	$txt_buffer.= "Transporteur : {$carrier_txt}\r\n" ;
	$txt_buffer.= "\r\n" ;
	
	$tot_count = 0 ;
	$tot_kg = 0 ;
	foreach( $hat_record['parcels'] as $parcel ) {
		$tot_count += $parcel['vol_count'] ;
		$tot_kg += $parcel['vol_kg'] ;
	}
	$tot_kg = round($tot_kg,3) ;
	$txt_buffer.= "Nombre de colis : {$tot_count}\r\n" ;
	$txt_buffer.= "\r\n" ;
	$txt_buffer.= "Poids total : {$tot_kg} KG\r\n" ;
	$txt_buffer.= "\r\n" ;
	
	$static_office = 'FR00677A' ;
	$txt_buffer.= "Bureau de sortie : {$static_office}\r\n" ;
	$txt_buffer.= "\r\n" ;
	
	$value_currency = '' ;
	$value_amount = 0 ;
	foreach( $trspt_record['orders'] as $order_iter ) {
		if( $order_iter['desc_value'] && $order_iter['desc_value_currency'] ) {
			$value_currency = $order_iter['desc_value_currency'] ;
			$value_amount += $order_iter['desc_value'] ;
			break ;
		}
	}
	$txt_buffer.= "Valeur totale facture : {$value_amount} {$value_currency}\r\n" ;
	$txt_buffer.= "\r\n" ;
	
	$static_location = 'MITRY MORY' ;
	$txt_buffer.= "Localisation : {$static_location}\r\n" ;
	$txt_buffer.= "\r\n" ;
	
	$txt_buffer.= "\r\n" ;
	
	$txt_buffer.= 'Vous trouverez ci-joint l’ensemble des documents nécessaires à la déclaration.'."\r\n" ;
	$txt_buffer.= "\r\n" ;
	$txt_buffer.= 'Dans l’attente du retour du BAE.'."\r\n" ;
	$txt_buffer.= "\r\n" ;
	$txt_buffer.= 'Bien cordialement,'."\r\n" ;
	$txt_buffer.= "\r\n" ;
	$txt_buffer.= "\r\n" ;
	
	$attachments = array() ;
	foreach( $trspt_record['orders'] as $order_record ) {
		if( !$order_record['attachments'] ) {
			continue ;
		}
		foreach( $order_record['attachments'] as $attachment_iter ) {
			if( true ) {
				$attachments[] = $attachment_iter ;
			}
		}
	}
	if( $attachments ) {
		$arr_ids = array() ;
		foreach($attachments as $attachment_iter) {
			$arr_ids[] = $attachment_iter['attachment_media_id'] ;
		}
		
		
		media_contextOpen( $_sdomain_id ) ;
		
		$jpegs = array() ;
		foreach( $arr_ids as $media_id ) {
			$src_filepath = media_img_getPath( $media_id ) ;
			if( $src_filepath && ($bin=file_get_contents($src_filepath)) ) {
				$jpegs[] = $bin ;
			}
		}
		if( count($jpegs)>0 ) {
			$pdf = media_pdf_jpgs2pdf($jpegs,$page_format='A4') ;
		}
		media_contextClose() ;
		
		$binary_pdf = $pdf ;
		$binary_filename = 'DN_'.$order_record['id_soc'].'_'.$order_record['id_dn'].'_'.time().'.pdf' ;
	}
	
	$wid = $trspt_record['id_doc'] ;
	$wid_txt = preg_replace("/[^a-zA-Z0-9]/", "", $wid) ;
	
	$prio_code = $trspt_record['atr_priority'] ;
	$ttmp = paracrm_lib_data_getRecord('bible_entry','LIST_SERVICE',$prio_code) ;
	$prio_txt = $ttmp['field_TEXT'] ;
	
	$email_subject = $prio_txt.' / '.$inv_no.' / '.$wid_txt ;
	if( $trspt_record['id_soc']=='ACL' ) {
		$order_txt = implode('-',$arr_orderIds) ;
		$email_subject = "SAFRAN NACELLE / {$prio_txt} / {$order_txt} / {$wid}" ;
	}
	
	
	$mail = PhpMailer::getInstance() ;
	if( !$mail ) {
		return FALSE ;
	}

	try {
		$mail->isSMTP();
		$mail->Host = $arr_params['SMTP'] ;
		
		$mail->CharSet = "utf-8";
		$mail->setFrom('tracy@dbschenker.com');
		foreach( explode(',',$arr_params['EMAIL_TO']) as $email_to ) {
			$mail->addAddress($email_to) ;
		}
		$mail->Subject  = $email_subject ;
		$mail->Body = $txt_buffer ;
		$mail->addStringAttachment($binary_pdf, $binary_filename) ;
		$mail->send() ;
	
	} catch (Exception $e) {
		echo "Message could not be sent. Mailer Error: {$mail->ErrorInfo}";
		return false ;
	}
	//$buffer = $mail->getSentMIMEMessage();

	return true ;
}
function specDbsTracy_lib_edi_flow_TRSPTCUSTOMSXML( $trspt_filerecord_id, $arr_params ) {
	global $_opDB ;
		
	$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
	$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;
	
	
	if( !$arr_params['LOCAL_PATH'] ) {
		return FALSE ;
	}
	
	$ttmp = specDbsTracy_trspt_getRecords(array('filter_trsptFilerecordId_arr'=>json_encode(array($trspt_filerecord_id)))) ;
	$trspt_record = $ttmp['data'][0] ;
	if( !$trspt_record ) {
		return FALSE ;
	}
	$hat_record = reset($trspt_record['hats']) ;
	$order_record = reset($trspt_record['orders']) ;

	
	
	$xml_buffer = '' ;
	$xml_buffer.= '<?xml version="1.0" encoding="utf-8"?>' ;
	$xml_buffer.= '<RequestToBroker>' ;
	$xml_buffer.= '<RequestDate>'.date('Ymd').'</RequestDate>' ;
	
	$static_office = 'FR00677A' ;
	$xml_buffer.= "<ShippingOffice>{$static_office}</ShippingOffice>" ;
	
	$static_location = 'MITRY MORY' ;
	$xml_buffer.= "<ShippingLocation>{$static_location}</ShippingLocation>" ;
	
	$wid = $trspt_record['id_doc'] ;
	$xml_buffer.= "<WID>{$wid}</WID>" ;
	
	$prio_code = $trspt_record['atr_priority'] ;
	$ttmp = paracrm_lib_data_getRecord('bible_entry','LIST_SERVICE',$prio_code) ;
	$prio_txt = $ttmp['field_TEXT'] ;
	$xml_buffer.= "<Priority>{$prio_txt}</Priority>" ;
	
	$carrier_code = $trspt_record['mvt_carrier'] ;
	$ttmp = paracrm_lib_data_getRecord('bible_entry','LIST_CARRIER',$carrier_code) ;
	$carrier_txt = $ttmp['field_NAME'] ;
	$xml_buffer.= "<Carrier>{$carrier_txt}</Carrier>" ;
	
	$inv_no = $order_record['ref_invoice'] ;
	$xml_buffer.= "<InvoiceNo>{$inv_no}</InvoiceNo>" ;
	
	/*
	$xml_buffer.= "<Deliveries>" ;
	foreach( $trspt_record['orders'] as $order_iter ) {
		$xml_buffer.= "<DeliveryNo>{$order_iter['id_dn']}</DeliveryNo>" ;
	}
	$xml_buffer.= "</Deliveries>" ;
	*/
	
	$value_currency = '' ;
	$value_amount = 0 ;
	foreach( $trspt_record['orders'] as $order_iter ) {
		if( $order_iter['desc_value'] && $order_iter['desc_value_currency'] ) {
			$value_currency = $order_iter['desc_value_currency'] ;
			$value_amount += $order_iter['desc_value'] ;
			break ;
		}
	}
	$xml_buffer.= "<Value>" ;
		$xml_buffer.= "<ValueAmount>{$value_amount}</ValueAmount>" ;
		$xml_buffer.= "<ValueCurrency>{$value_currency}</ValueCurrency>" ;
	$xml_buffer.= "</Value>" ;
	
	/*
	$xml_buffer.= "<Packagings>" ;
	foreach( $hat_record['parcels'] as $parcel ) {
		$xml_buffer.= "<Packaging>" ;
		$xml_buffer.= "<Count>{$parcel['vol_count']}</Count>" ;
		$xml_buffer.= "<Weight>{$parcel['vol_kg']}</Weight>" ;
		
		$xml_buffer.= "<Dimensions>" ;
			$xml_buffer.= "<Length>{$parcel['vol_dims'][0]}</Length>" ;
			$xml_buffer.= "<Width>{$parcel['vol_dims'][1]}</Width>" ;
			$xml_buffer.= "<Height>{$parcel['vol_dims'][2]}</Height>" ;
		$xml_buffer.= "</Dimensions>" ;
		
		$xml_buffer.= "</Packaging>" ;
	}
	$xml_buffer.= "</Packagings>" ;
	*/
	$tot_count = 0 ;
	$tot_kg = 0 ;
	foreach( $hat_record['parcels'] as $parcel ) {
		$tot_count += $parcel['vol_count'] ;
		$tot_kg += $parcel['vol_kg'] ;
	}
	$tot_kg = round($tot_kg,3) ;
	$xml_buffer.= "<ParcelCount>{$tot_count}</ParcelCount>" ;
	$xml_buffer.= "<Weight>{$tot_kg}</Weight>" ;
	
	$attachments = array() ;
	foreach( $trspt_record['orders'] as $order_record ) {
		if( !$order_record['attachments'] ) {
			continue ;
		}
		foreach( $order_record['attachments'] as $attachment_iter ) {
			if( !(strpos($attachment_iter['attachment_txt'],'INVOICE')===FALSE) ) {
				$attachments[] = $attachment_iter ;
			}
		}
	}
	if( $attachments ) {
		$arr_ids = array() ;
		foreach($attachments as $attachment_iter) {
			$arr_ids[] = $attachment_iter['attachment_media_id'] ;
		}
		
		
		media_contextOpen( $_sdomain_id ) ;
		
		$jpegs = array() ;
		foreach( $arr_ids as $media_id ) {
			$src_filepath = media_img_getPath( $media_id ) ;
			if( $src_filepath && ($bin=file_get_contents($src_filepath)) ) {
				$jpegs[] = $bin ;
			}
		}
		if( count($jpegs)>0 ) {
			$pdf = media_pdf_jpgs2pdf($jpegs,$page_format='A4') ;
		}
		media_contextClose() ;
		
		$xml_buffer.= "<DocumentExport>" ;
		$xml_buffer.= "<BinaryFormat>".'PDF'."</BinaryFormat>" ;
		$xml_buffer.= "<BinarySize>".strlen($pdf)."</BinarySize>" ;
		$xml_buffer.= "<BinaryBase64>".base64_encode($pdf)."</BinaryBase64>" ;
		$xml_buffer.= "</DocumentExport>" ;
	}
	
	
	$xml_buffer.= '</RequestToBroker>' ;

	$xml_buffer ;
	
	// File write
	$filename = $inv_no.'_'.date('Ymd').'_'.date('His').'.xml' ;
	if( $arr_params['FILENAME_PREFIX'] ) {
		$filename = $arr_params['FILENAME_PREFIX'].'_'.$filename ;
	}
	$filepath = $arr_params['LOCAL_PATH'].'/'.$filename ;
	file_put_contents($filepath,$xml_buffer) ;
	
	return TRUE ;
}

?>
