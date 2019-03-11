<?php

function specRsiRecouveo_doc_cfg_getTpl( $post_data ) {
	global $_opDB ;
	$p_tplGroup = $post_data['tpl_group'] ;
	$p_tplBinary = $post_data['load_binary'] ;
	
	$app_root = $GLOBALS['app_root'] ;
	$resources_root=$app_root.'/resources' ;
	$templates_dir=$resources_root.'/server/templates' ;
	
	$data = array() ;
	$query = "SELECT * from view_bible_TPL_entry WHERE 1" ;
	if( $post_data['tpl_id'] ) {
		$query.= " AND entry_key='{$post_data['tpl_id']}'" ;
	} else {
		$query.= " AND treenode_key='{$p_tplGroup}'" ;
	}
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$data[] = array(
			'tpl_id' => $arr['field_TPL_ID'],
			'tpl_name' => $arr['field_TPL_NAME'],
			'manual_is_on' => $arr['field_MANUAL_IS_ON'],
			'html_src_file' => $arr['field_HTML_SRC_FILE'],
			'html_payment_file' => $arr['field_HTML_PAYMENT_FILE'],
			'html_signature_file' => $arr['field_HTML_SIGNATURE_FILE'],
			'html_footer_file' => $arr['field_HTML_FOOTER_FILE'],
			'html_body' => $arr['field_HTML_BODY'],
			'html_title' => $arr['field_HTML_TITLE']
		);
	}
	if( !$p_tplBinary ) {
		return array('success'=>true, 'data'=>$data) ;
	}

	return array('success'=>true, 'data'=>$data) ;
}
function specRsiRecouveo_doc_buildTemplate(&$tplData, $media_type, $lang_code){

	$app_root = $GLOBALS['app_root'] ;
	$resources_root=$app_root.'/resources' ;
	$templates_dir=$resources_root.'/server/templates' ;
	
	$inputFileName = $templates_dir.'/'.$tplData['html_src_file'] ;
	$inputBinary = file_get_contents($inputFileName) ;

	$doc = new DOMDocument();
	@$doc->loadHTML($inputBinary);
	$elements = $doc->getElementsByTagName('qbook-value');
	$i = $elements->length - 1;
	while ($i > -1) {
		$node_qbookValue = $elements->item($i);
		$i--;

		$val = '' ;
		$src_value = $node_qbookValue->attributes->getNamedItem('src_value')->value ;
		switch( $src_value ) {
			case 'body_content' :
			$new_node = $doc->createCDATASection($tplData['html_body']) ;
			$node_qbookValue->parentNode->replaceChild($new_node,$node_qbookValue) ;
			break ;
			
			case 'body_title' :
			$new_node = $doc->createCDATASection($tplData['html_title']) ;
			$node_qbookValue->parentNode->replaceChild($new_node,$node_qbookValue) ;
			break ;
			
			case 'body_signature' :
			$inputFileName = $templates_dir.'/'.$tplData['html_signature_file'] ;
			$inputBinary = file_get_contents($inputFileName) ;
			$new_node = $doc->createCDATASection($inputBinary) ;
			$node_qbookValue->parentNode->replaceChild($new_node,$node_qbookValue) ;
			break ;
			
			case 'body_footer' :
			$inputFileName = $templates_dir.'/'.$tplData['html_footer_file'] ;
			$inputBinary = file_get_contents($inputFileName) ;
			$new_node = $doc->createCDATASection($inputBinary) ;
			$node_qbookValue->parentNode->replaceChild($new_node,$node_qbookValue) ;
			break ;
			
			default :
			break ;
		}
	}
	
	$html = $doc->saveHTML() ;
	
	// Parse new nested nodes
	$doc = new DOMDocument();
	@$doc->loadHTML($html);
	
	specRsiRecouveo_doc_replaceStyle($doc,$media_type) ;
	specRsiRecouveo_doc_replaceLang($doc,$lang_code) ;
	specRsiRecouveo_doc_populateStatic($doc) ;
	
	$elements = $doc->getElementsByTagName('qbook-value');
	$i = $elements->length - 1;
	while ($i > -1) {
		$node_qbookValue = $elements->item($i); 
		$i--; 
		
		$val = '' ;
		$src_value = $node_qbookValue->attributes->getNamedItem('src_value')->value ;
		switch( $src_value ) {
			case 'payment_div' :
			$paymentFileName = $templates_dir.'/'.$tplData['html_payment_file'] ;
			$paymentBinary = file_get_contents($paymentFileName) ;
			$html_payment = specRsiRecouveo_doc_getHtmlPayment($paymentBinary) ;
			$new_node = $doc->createCDATASection($html_payment) ;
			$node_qbookValue->parentNode->replaceChild($new_node,$node_qbookValue) ;
			break ;

			default :
			break ;
		}
	}

	$tplData['tpl_html'] = $doc->saveHTML() ;

	return $tplData['tpl_html'] ;
}

function specRsiRecouveo_doc_replaceStyle( $doc, $style_media ) {
	if( !$style_media ) {
		$style_media = 'POSTAL' ;
	}
	
	$elements = $doc->getElementsByTagName('qbook-condition');
	$i = $elements->length - 1;
	while ($i > -1) {
		$domelem = $elements->item($i);
		$i-- ;
		if( !$domelem->attributes->getNamedItem('media') ) {
			continue ;
		}
		
		$prent = $domelem->parentNode;
		if( $domelem->attributes->getNamedItem('media')->value == $style_media ) {
			$innerHTML= '';
			foreach ($domelem->childNodes as $child) {
				$innerHTML .= $child->ownerDocument->saveXML( $child );
			}
			$frag = $doc->createDocumentFragment() ;
			$frag->appendXML($innerHTML) ;
			//var_dump($frag) ;
			$prent->replaceChild($frag, $domelem);
		
		//var_dump( $doc->saveXML($prent) ) ;
		//var_dump( $prent->textContent ) ;
		} else {
			$prent->removeChild($domelem);
		}
	}
}
function specRsiRecouveo_doc_replaceLang( $doc, $lang_code ) {
	$elements = $doc->getElementsByTagName('qbook-condition');
	$i = $elements->length - 1;
	while ($i > -1) {
		$domelem = $elements->item($i);
		$i-- ;
		if( !$domelem->attributes->getNamedItem('lang') ) {
			continue ;
		}
		
		$prent = $domelem->parentNode;
		if( $domelem->attributes->getNamedItem('lang')->value == $lang_code ) {
			$innerHTML= '';
			foreach ($domelem->childNodes as $child) {
				$innerHTML .= $child->ownerDocument->saveXML( $child );
			}
			$frag = $doc->createDocumentFragment() ;
			$frag->appendXML($innerHTML) ;
			//var_dump($frag) ;
			$prent->replaceChild($frag, $domelem);
		
		//var_dump( $doc->saveXML($prent) ) ;
		//var_dump( $prent->textContent ) ;
		} else {
			$prent->removeChild($domelem);
		}
	}
}

function specRsiRecouveo_doc_populateStatic( $doc ) {
	// Load config
	$json = specRsiRecouveo_config_loadMeta(array()) ;
	$config_map = $json['data'] ;

	// Apply static parameters
	$map_mkey_value = array(
		'static_entity_name' => nl2br($config_map['gen_entity_name']),
		'static_entity_adr' => nl2br($config_map['gen_entity_adr']),

		'static_ext_recouv' => $config_map['gen_ext_recouv'],
		'static_ext_avocat' => $config_map['gen_ext_avocat'],

		'static_mail_footer' => $config_map['gen_mail_footer']
	);

	// Replace
	$elements = $doc->getElementsByTagName('qbook-value');
	$i = $elements->length - 1;
	while ($i > -1) {
		$node_qbookValue = $elements->item($i);
		$i--;

		$val = '' ;
		$src_value = $node_qbookValue->attributes->getNamedItem('src_value')->value ;
		//echo $src_value."\n" ;
		if( $map_mkey_value[$src_value] ) {
			$val = $map_mkey_value[$src_value] ;
		} else {
			continue ;
		}
		
		$new_node = $doc->createCDATASection($val) ;
		$node_qbookValue->parentNode->replaceChild($new_node,$node_qbookValue) ;
	}
	
}
function specRsiRecouveo_doc_getHtmlPayment( $paymentBinary ) {
	$json = specRsiRecouveo_config_loadMeta(array()) ;
	$config_map = $json['data'] ;
	
	$doc = new DOMDocument();
	@$doc->loadHTML('<?xml encoding="UTF-8"><html>'."\r\n".'<div>'.$paymentBinary.'</div></html>');
	foreach( $config_map as $mkey => $mvalue ) {
		if( !(strpos($mkey,'pay_')===0) ) {
			unset($config_map[$mkey]) ;
			continue ;
		}
		if( substr($mkey,-3)=='_on' ) {
			$div_id = 'div_'.substr($mkey,0,-3) ;
			$dom_element = $doc->getElementById( $div_id ) ;
			if( $dom_element && !$mvalue ) {
				$dom_element->setAttribute ( 'style' , 'display:none' ) ;
			}
		}
	}
	$elements = $doc->getElementsByTagName('qbook-value');
	$i = $elements->length - 1;
	while ($i > -1) {
		$node_qbookValue = $elements->item($i); 
		$i--; 
		
		$val = '' ;
		$src_value = $node_qbookValue->attributes->getNamedItem('src_value')->value ;
		if( $config_map[$src_value] ) {
			$val = nl2br($config_map[$src_value]) ;
		} else {
			continue ;
		}
		
		$new_node = $doc->createCDATASection($val) ;
		$node_qbookValue->parentNode->replaceChild($new_node,$node_qbookValue) ;
	}
	
	
	$node = $doc->getElementsByTagName("div")->item(0) ;
	//var_dump($node) ;
	return $doc->saveHTML() ; ;
}
function specRsiRecouveo_doc_getMailOut( $post_data, $real_mode=TRUE, $stopAsHtml=FALSE ) {
	global $_opDB ;
	$p_tplId = $post_data['tpl_id'] ;
	$p_fileFilerecordId = $post_data['file_filerecord_id'] ;
	$p_recordsFilerecordIds = ($post_data['record_filerecord_ids'] ? json_decode($post_data['record_filerecord_ids'],true) : null) ;
	$p_adrType = $post_data['adr_type'] ;
	$p_adrName = $post_data['adr_name'] ;
	$p_adrPostal = $post_data['adr_postal'] ;
	$p_inputFields = ($post_data['input_fields'] ? json_decode($post_data['input_fields'],true) : array()) ;
	
	if( $p_recordsFilerecordIds ) {
		//print_r($p_recordsFilerecordIds) ;
	}	
	
	// ******** Load elements *********
	$ttmp = specRsiRecouveo_file_getRecords( array(
		'filter_fileFilerecordId_arr' => json_encode(array($p_fileFilerecordId))
	)) ;
	$accFile_record = $ttmp['data'][0] ;
	if( $accFile_record['file_filerecord_id'] != $p_fileFilerecordId ) {
		return array('success'=>false) ;
	}
	
	$ttmp = specRsiRecouveo_account_open( array(
		'acc_id' => $accFile_record['acc_id']
	)) ;
	$account_record = $ttmp['data'] ;
	
	
	// ******** Current user *************
	$json = specRsiRecouveo_config_getUsers(array()) ;
	$data_users = $json['data'] ;
	while(TRUE) {
		if( isset($account_record['link_user']) && ($account_record['link_user']!=NULL) ) {
			$search = array_filter(
				$data_users,
				function ($e) use ($account_record) {
					return strtolower($e['user_id']) == strtolower($account_record['link_user']) ;
				}
			);
		}
		if( count($search) > 0 ) {
			break ;
		}
		$search = array_filter(
			$data_users,
			function ($e) {
				return ($e['_default'] == true) ;
			}
		);
		break ;
	}
	$cfg_user = reset($search) ;
	
	
	// ******** Current user *************
	$json = specRsiRecouveo_config_getSocs(array()) ;
	$data_socs = $json['data'] ;
	if( $GLOBALS['_tmp_soc_id'] = $accFile_record['soc_id'] ) {
		$search = array_filter(
			$data_socs,
			function ($e) {
				return $e['soc_id'] == $GLOBALS['_tmp_soc_id'] ;
			}
		);
		$cfg_soc = reset($search) ;
		if( $cfg_soc ) {
			$mapSoc_mkey_value = array() ;
			foreach( $cfg_soc['printfields'] as $printfield ) {
				$mapSoc_mkey_value[$printfield['printfield_code']] = $printfield['printfield_text'] ;
			}
		}
	}
	
	
	// ******** 06/02/2019 : attributs, probe LANG atr *********
	$probe_lang_atrField = NULL ;
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_atr = $ttmp['data']['cfg_atr'] ;
	foreach( $cfg_atr as $atr_record ) {
		$atr_id = $atr_record['atr_id'] ;
		$ttmp = explode('@',$atr_id) ;
		$atr_code = $ttmp[1] ;
		if( $atr_record['atr_type']=='account' && $atr_code=='LANG' ) {
			$probe_lang_atrField = $atr_record['atr_field'] ;
			break ;
		}
	}
	if( $probe_lang_atrField && $account_record ) {
		$_lang_code = $account_record[$probe_lang_atrField] ;
	}
	
	
	
	
	// ********** Reference courrier *****************
	if( $real_mode ) {
		$new_ref_mail = specRsiRecouveo_file_lib_getNextMailNum($p_fileFilerecordId) ;
	}
	
	
	
	
	// *********** DONNEES String *********************
	$map_mkey_value = array() ;
	$map_mkey_value += array(
		'header_barcode_img' => '<img src="data:image/jpeg;base64,'.base64_encode(specRsiRecouveo_lib_getBarcodePng($new_ref_mail,20)).'" />',
		'header_ref_file' => $accFile_record['id_ref'],
		'header_ref_client' => $accFile_record['acc_id'],
		'header_ref_forpayment' => $accFile_record['acc_id'].'EC',
		'header_cr_fullname' => $cfg_user['user_fullname'],
		'header_cr_email' => $cfg_user['user_email'],
		'header_cr_tel' => $cfg_user['user_tel'],
		
		'header_dest_name' => $p_adrName,
		'header_dest_adrpost' => nl2br($p_adrPostal),
		
		'header_ref_mail' => $new_ref_mail
	);
	$map_mkey_value += array(
		'footer_ref_file' => $accFile_record['id_ref'],
		'footer_ref_client' => $accFile_record['acc_id'],
		'footer_ref_forpayment' => $accFile_record['acc_id'].'EC',
		'footer_balance' => number_format($accFile_record['inv_amount_due'],2).'&nbsp;'.'€',
		
		'footer_barcode_img' => '<img src="data:image/jpeg;base64,'.base64_encode(specRsiRecouveo_lib_getBarcodePng($accFile_record['id_ref'],50)).'" />'
	);
	$map_mkey_value += array(
		'body_balance' => number_format($accFile_record['inv_amount_due'],2),
		'body_date_sql' => date('Y-m-d'),
		'body_date' => date('d/m/Y'),
		'body_now' => date('d/m/Y').' à '.date('H:i')
	);
	$map_mkey_value += array(
		'payment_ref_client' => $accFile_record['acc_id'],
		'payment_ref_forpayment' => $accFile_record['acc_id'].'EC'
	);
	$map_mkey_value += array(
		'table_refcli' => $accFile_record['acc_id']
	);
	foreach( $p_inputFields as $k=>$v ) {
		if( !(strpos($k,'input_')===0) ) {
			continue ;
		}
		$map_mkey_value[$k] = nl2br($v) ;
	}
	if( $mapSoc_mkey_value ) {
		$map_mkey_value += $mapSoc_mkey_value ;
	}
	
	// 2018-01-21 : Account ATRs
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_atr = $ttmp['data']['cfg_atr'] ;
	foreach( $cfg_atr as $atr_record ) {
		$atr_id = $atr_record['atr_id'] ;
		$mkey = $atr_record['atr_field'] ;
		$map_mkey_value[$mkey] = $accFile_record[$mkey] ;
	}
	foreach( $map_mkey_value as $mkey => $mvalue ) {
		if( isset($map_mkey_value[$mvalue]) ) {
			$map_mkey_value[$mkey] = nl2br($map_mkey_value[$mvalue]) ;
		}
	}
	
	// ************ DONNEES Tableau ***********************
	$records = array();
	foreach( $account_record['files'] as $accountFile_record ) {
		foreach( $accountFile_record['records'] as $accountFileRecord_record ) {
			$records[] = $accountFileRecord_record ;
		}
	}
	$usort = function($arr1,$arr2)
	{
		return ($arr1['date_record'] < $arr2['date_record']) ;
	};
	usort($records,$usort) ;
	
	$map_columns = array(
		'record_ref' => 'Réf.Pièce',
		'record_txt' => 'Libellé',
		'date_record' => 'Date.Pièce',
		'date_value' => 'Date.Echéa.',
		'amount_tot' => 'Montant'
	);
	if( $cfg_soc && $cfg_soc['soc_xe_currency'] ) {
		$map_columns['xe_currency_amount'] = 'MntDevise' ;
	}
	$table_data = $table_datafoot = array() ;
	foreach( $records as $record_row ) {
		if( $record_row['letter_is_confirm'] ) {
			continue ;
		}
		if( $p_recordsFilerecordIds && !in_array($record_row['record_filerecord_id'],$p_recordsFilerecordIds) ) {
			continue ;
		}
		$row_table = array(
			'record_ref' => $record_row['record_ref'],
			'record_txt' => trim(substr($record_row['record_txt'],0,35)),
			'type_temprec' => $record_row['type_temprec'],
			'txt' => $record_row['txt'],
			'date_load' => date('d/m/Y',strtotime($record_row['date_load'])),
			'date_record' => date('d/m/Y',strtotime($record_row['date_record'])),
			'date_value' => date('d/m/Y',strtotime($record_row['date_value'])),
			'amount_tot' => '<div width="100%" style="text-align:right;">'.number_format($record_row['amount'],2).'</div>',
			'amount_due' => '<b>'.number_format($record_row['amount'],2).'</b>',
			'xe_currency_amount' => '<div width="100%" style="text-align:right;">'.number_format($record_row['xe_currency_amount'],2).'&nbsp;'.$record_row['xe_currency_sign'].'</div>'
		);
		$amount+= $record_row['amount'] ;
		$table_data[] = $row_table ;
	}
	$table_datafoot[] = array(
		'record_ref' => 'Total',
		'amount_tot' => '<div width="100%" style="text-align:right;">'.number_format($amount,2).'</div>',
		'amount_due' => '<b>'.number_format($amount,2).'</b>'
	);
	$has_recordTxt = FALSE ;
	foreach( $table_data as $row_table ) {
		if( trim($row_table['record_txt']) && $row_table['record_txt']!=$row_table['record_ref'] ) {
			$has_recordTxt = TRUE ;
		}
	}
	if( !$has_recordTxt ) {
		unset($map_columns['record_txt']) ;
	}
	$table_columns = array() ;
	foreach( $map_columns as $mkey => $mvalue ) {
		$table_columns[] = array(
			'dataIndex' => $mkey,
			'text' => $mvalue
		);
	}
	
	
	
	// ******** DONNEES promessse ************
	$map_columns = array(
		'date_sched' => 'Date Echéance',
		'agree_amount_txt' => 'Montant'
	) ;
	$agree_columns = array() ;
	foreach( $map_columns as $mkey => $mvalue ) {
		$agree_columns[] = array(
			'dataIndex' => $mkey,
			'text' => $mvalue
		);
	}
	
	$agree_data = array() ;
	foreach( $accFile_record['actions'] as $action_row ) {
		if( $action_row['link_action'] == 'AGREE_FOLLOW' && !$action_row['status_is_ok'] ) {
			$text = explode(':',$action_row['txt']) ;
			$row_table = array(
				'date_sched' => date('d/m/Y',strtotime($action_row['date_sched'])),
				'agree_amount_txt' => trim($text[1])
			);
			$agree_data[] = $row_table ;
		}
	}








	// ************ TEMPLATE ***********************

	$ttmp = specRsiRecouveo_doc_cfg_getTpl( array(
		'tpl_id' => $p_tplId,
		'load_binary' => true
	)) ;
	$tplData = $ttmp['data'][0] ;
	if( $tplData['manual_is_on'] && $p_inputFields ) {
		$tplData['html_body'] = $p_inputFields['input_html'] ;
		$tplData['html_title'] = $p_inputFields['input_title'] ;
	}

	$tplHtml = specRsiRecouveo_doc_buildTemplate($tplData,$p_adrType,$_lang_code) ;

	$inputTitle = $tplData['tpl_name'];
	$inputBinary = $tplHtml;

	$doc = new DOMDocument();
	@$doc->loadHTML($inputBinary);

	$elements = $doc->getElementsByTagName('qbook-value');
	$i = $elements->length - 1;
	while ($i > -1) {
		$node_qbookValue = $elements->item($i);
		$i--;

		$val = '' ;
		$src_value = $node_qbookValue->attributes->getNamedItem('src_value')->value ;
		if( $map_mkey_value[$src_value] ) {
			$val = $map_mkey_value[$src_value] ;
		}

		$new_node = $doc->createCDATASection($val) ;
		$node_qbookValue->parentNode->replaceChild($new_node,$node_qbookValue) ;
	}


	$elements = $doc->getElementsByTagName('qbook-img');
	$i = $elements->length - 1;
	while ($i > -1) {
		$node_qbookValue = $elements->item($i);
		$i--;
		
		$src_value = $node_qbookValue->attributes->getNamedItem('src_img')->value ;
		if( ($img_code=$map_mkey_value[$src_value]) && ($tplImgEntry=paracrm_lib_data_getRecord_bibleEntry('TPL_IMG',$img_code)) ) {
			$img_code = $map_mkey_value[$src_value] ;
			
			$domElement_img = $doc->createElement("img");
			$domElement_img->setAttribute("src",$tplImgEntry['field_IMG_SRC']) ;
			foreach( array('width','height') as $atr ) {
				if( $node_qbookValue->attributes->getNamedItem($atr) ) {
					$domElement_img->setAttribute($atr,$node_qbookValue->attributes->getNamedItem($atr)->value) ;
				}
			}
			$node_qbookValue->parentNode->replaceChild($domElement_img,$node_qbookValue) ;
		}
	}


	$elements = $doc->getElementsByTagName('qbook-table');
	$i = $elements->length - 1;
	while ($i > -1) {
		$node_qbookTable = $elements->item($i);
		$i--;

		switch( $node_qbookTable->attributes->getNamedItem('src_value')->value ) {
			/*
			case 'records' :
			$table_html = paracrm_queries_template_makeTable($table_columns,$table_data,$table_datafoot) ;
			break ;
			*/

			case 'agree' :
			$table_html = paracrm_queries_template_makeTable($agree_columns,$agree_data) ;
			break ;
			
			default :
			continue 2 ;
		}

		//echo $table_html ;
		$dom_table = new DOMDocument();
		$dom_table->loadHTML( '<?xml encoding="UTF-8"><html>'.$table_html.'</html>' ) ;
		$node_table = $dom_table->getElementsByTagName("table")->item(0);

		$table_attr = $dom_table->createAttribute("class") ;
		$table_attr->value = 'invoicewidth tabledonnees' ;
		$node_table->appendChild($table_attr) ;

		$node_table = $doc->importNode($node_table,true) ;

		$node_qbookTable->parentNode->replaceChild($node_table,$node_qbookTable) ;
	}
	
	$elements = $doc->getElementsByTagName('qbook-tablerecords');
	if( $elements->length > 0 && $table_data ) {
		//echo "A" ;
		$records_div = $elements->item(0);
		$records_pagetemplate_binary = '';
		foreach($records_div->childNodes as $node) {
			$records_pagetemplate_binary .= $doc->saveHTML($node);
		}
		
		$dom_pages = array() ;
		
		//echo $records_pagetemplate_binary ;
		$arr_tablesData = array_chunk($table_data , 40) ;
		$arr_tablesData_cnt = count($arr_tablesData) ;
		
		foreach( $arr_tablesData as $idx=>$table_data ) {
			$lastPage = ( $idx+1 == $arr_tablesData_cnt ) ;
			
			// build table tag inside document
			$table_html = paracrm_queries_template_makeTable($table_columns,$table_data,($lastPage?$table_datafoot:null)) ;
			$dom_table = new DOMDocument();
			$dom_table->loadHTML( '<?xml encoding="UTF-8"><html>'.$table_html.'</html>' ) ;
			$node_table = $dom_table->getElementsByTagName("table")->item(0);
			$table_attr = $dom_table->createAttribute("class") ;
			$table_attr->value = 'invoicewidth tabledonnees' ;
			$node_table->appendChild($table_attr) ;

			// build page
			$dom_page = new DOMDocument();
			@$dom_page->loadHTML('<?xml encoding="UTF-8"><html>'.$records_pagetemplate_binary.'</html>');
			$node_qbookTable = $dom_page->getElementsByTagName('qbook-table')->item(0);
			$node_table = $dom_page->importNode($node_table,true) ;
			$node_qbookTable->parentNode->replaceChild($node_table,$node_qbookTable) ;
			//paging
			if( $dom_page->getElementsByTagName('qbook-tablerecords-paging') ) {
				$paging_node = $dom_page->getElementsByTagName('qbook-tablerecords-paging')->item(0) ;
				//var_dump(
				
				$currentPage = $idx+1 ;
				$totalPage = $arr_tablesData_cnt ;
				$text = '('.$currentPage.'/'.$totalPage.')' ;
				
				$new_node = $dom_page->createCDATASection($text) ;
				$paging_node->parentNode->replaceChild($new_node,$paging_node) ;
			}
			
			$dom_pages[] = $dom_page ;
		}
	}
	
	
	if( $records_div && $_appendToMainDoc=($p_adrType=='POSTAL') ) {
		$records_divnew = $doc->createElement("div");
		$records_div->parentNode->replaceChild($records_divnew,$records_div) ;
		
		foreach( $dom_pages as $dom_page ) {
			// insert page into main doc
			$new_node = $doc->createCDATASection($dom_page->saveHTML()) ;
			$records_divnew->appendChild($new_node) ;
		}
	}
	if( $records_div && $_createSeparateDoc=($p_adrType=='EMAIL') ) {
		$records_div->parentNode->removeChild($records_div) ;
		
		$new_doc = new DOMDocument();
		@$new_doc->loadHTML('<?xml encoding="UTF-8"><html></html>');
		// keep style only
		$styleHTML = '' ;
		foreach( $doc->getElementsByTagName('style') as $node_style ) {
			$styleHTML.= $node_style->ownerDocument->saveXML( $node_style );
		}
		$new_doc_html = $new_doc->getElementsByTagName('html')->item(0) ;
		
		$new_doc_head = $new_doc->createElement('head') ;
		$new_doc_styleFrag = $new_doc->createDocumentFragment() ;
		$new_doc_styleFrag->appendXML($styleHTML) ;
		$new_doc_head->appendChild($new_doc_styleFrag) ;
		$new_doc_html->appendChild($new_doc_head) ;
		
		$new_doc_body = $new_doc->createElement('body') ;
		foreach( $dom_pages as $dom_page ) {
			// insert page into main doc
			$new_node = $new_doc->createCDATASection($dom_page->saveHTML()) ;
			$new_doc_body->appendChild($new_node) ;
		}
		$new_doc_html->appendChild($new_doc_body) ;
	}
	
	


	$filename = preg_replace("/[^a-zA-Z0-9]/", "",'PRINT').'.pdf' ;


	if( $real_mode ) {
		//store doc


	}


	$binary_html = $doc->saveHTML() ;
	if( $stopAsHtml ) {
		$htmls = array() ;
		if( $binary_html ) {
			$htmls[] = $binary_html ;
		}
		if( $new_doc ) {
			$htmls[] = $new_doc->saveHTML() ;
		}
		return $htmls ;
	}
	$binary_pdf = specRsiRecouveo_util_htmlToPdf_buffer($binary_html) ;

	media_contextOpen( $_POST['_sdomainId'] ) ;

	$pdf_path = tempnam( sys_get_temp_dir(), "FOO");
	rename($pdf_path,$pdf_path.'.pdf') ;
	$pdf_path.= '.pdf' ;
	file_put_contents($pdf_path,$binary_pdf) ;
	$media_id = media_pdf_processUploaded( $pdf_path, 'PRINT.PDF' ) ;
	unlink($pdf_path) ;


	$json = specRsiRecouveo_config_loadMeta(array()) ;
	$config_map = $json['data'] ;
	//media_pdf_delete($media_id) ;
	$json = array(
		'success'=>true,
		'data'=>array(
			'envdoc_media_id'=>$media_id,
			'doc_desc'=> $inputTitle,
			'doc_pagecount'=>media_pdf_getPageCount($media_id)
		),
		'meta' => array(
			'env_ref' => $new_ref_mail,
			'env_title' => $inputTitle,
			'sender_ref' => 'ENTITY',
			'sender_adr' => $config_map['gen_entity_name']."\n".$config_map['gen_entity_adr'],
			'recep_ref' => $accFile_record['acc_id'],
			'recep_adr' => $p_adrName."\n".$p_adrPostal
		)
	) ;
	
	media_contextClose() ;
	
	return $json ;
}




function specRsiRecouveo_doc_uploadFile($post_data) {
	media_contextOpen( $_POST['_sdomainId'] ) ;
	foreach( $_FILES as $mkey => $dummy ) {
		$src_filename = $_FILES[$mkey]['name'] ;
		$src_path = $_FILES[$mkey]['tmp_name'] ;
		
		if( function_exists('finfo_open') ) {
			$finfo = finfo_open(FILEINFO_MIME_TYPE);
			$mimetype = finfo_file($finfo, $src_path) ;
		} elseif( $src_filename ) {
			$ttmp = explode('.',$src_filename) ;
			$mimetype = end($ttmp) ;
		} else {
			return array('success'=>false, 'error'=>'Upload vide ?') ;
		}

		$pdf_binary = NULL ;
		switch($mimetype) {
			case 'application/pdf':
			case 'pdf':
				break ;
				
			default :
				return array('success'=>false, 'error'=>'Pièces jointes de type PDF uniquement') ;
		}
	
		$media_id = media_pdf_processUploaded( $src_path, $src_filename ) ;
		break ;
	}
	if( !$media_id ) {
		return array('success'=>false) ;
	}
	//media_pdf_delete($media_id) ;
	$json = array(
		'success'=>true,
		'data'=>array(
			'envdoc_media_id'=>$media_id,
			'doc_desc'=> $_POST['doc_desc'],
			'doc_pagecount'=>media_pdf_getPageCount($media_id)
		)
	) ;
	media_contextClose() ;
	return $json ;
}
function specRsiRecouveo_doc_delete($post_data) {
	$p_arrMediaIds = json_decode($post_data['envdoc_media_id']) ;
	foreach( $p_arrMediaIds as $media_id ) {
		media_contextOpen( $_POST['_sdomainId'] ) ;
		media_pdf_delete($media_id) ;
		media_contextClose() ;
	}
	return array('success'=>true) ;
}
function specRsiRecouveo_doc_getPreview($post_data) {
	$p_mediaId = $post_data['envdoc_media_id'] ;
	media_contextOpen( $_POST['_sdomainId'] ) ;
	$arr_binaries = media_pdf_getPreviewsBinary($p_mediaId) ;
	media_contextClose() ;
	
	$TAB = array() ;
	$page_idx = 0 ;
	foreach( $arr_binaries as $jpg_binary ) {
		$page_idx++ ;
		$TAB[] = array(
			'page_idx' => $page_idx,
			'thumb_base64' => base64_encode($jpg_binary)
		);
	}
	return array('success'=>true, 'data'=>$TAB) ;
}
function specRsiRecouveo_doc_getPage($post_data) {
	$p_mediaId = $post_data['envdoc_media_id'] ;
	$p_pageIdx = $post_data['page_idx'] ;
	
	media_contextOpen( $_POST['_sdomainId'] ) ;
	$jpeg_binary = media_pdf_getPageBinary($p_mediaId,$p_pageIdx) ;
	media_contextClose() ;
	
	return array('success'=>true, 'data'=>base64_encode($jpeg_binary)) ;
}
function specRsiRecouveo_doc_downloadPdf( $post_data ) {
	$p_mediaId = $post_data['envdoc_media_id'] ;
	
	media_contextOpen( $_POST['_sdomainId'] ) ;
	$pdf = media_pdf_getBinary($p_mediaId) ;
	echo strlen($pdf) ;
	media_contextClose() ;
	
	$filename_pdf = $p_mediaId.'.pdf' ;
	header("Content-Type: application/force-download; name=\"$filename_pdf\""); 
	header("Content-Disposition: attachment; filename=\"$filename_pdf\""); 
	echo $pdf ;
	die() ;
}





function specRsiRecouveo_doc_buildEnvelope( $file_filerecord_id, $envDocs, $meta=NULL ) {
	$arr_ins = array() ;
	$arr_ins['field_ENV_DATE'] = date('Y-m-d H:i:s') ;
	$arr_ins['field_LINK_FILE_ID'] = $file_filerecord_id ;
	if( $meta ) {
		$arr_ins['field_ENV_REF'] = $meta['env_ref'] ;
		$arr_ins['field_ENV_TITLE'] = $meta['env_title'] ;
		$arr_ins['field_SENDER_REF'] = $meta['sender_ref'] ;
		$arr_ins['field_SENDER_ADR'] = $meta['sender_adr'] ;
		$arr_ins['field_RECEP_REF'] = $meta['recep_ref'] ;
		$arr_ins['field_RECEP_ADR'] = $meta['recep_adr'] ;
	}
	$env_filerecord_id = paracrm_lib_data_insertRecord_file( 'ENVELOPE', 0, $arr_ins );
	
	media_contextOpen( $_POST['_sdomainId'] ) ;
	$envdoc_filecode = 'ENVELOPE_DOC' ;
	foreach( $envDocs as $doc ) {
		$arr_ins = array() ;
		$arr_ins['field_DOC_DESC'] = $doc['doc_desc'] ;
		$arr_ins['field_DOC_PAGECOUNT'] = $doc['doc_pagecount'] ;
		$envdoc_filerecord_id = paracrm_lib_data_insertRecord_file( $envdoc_filecode, $env_filerecord_id, $arr_ins );
		
		media_pdf_move( $doc['envdoc_media_id'],  media_pdf_toolFile_getId($envdoc_filecode,$envdoc_filerecord_id) ) ;
	}
	media_contextClose() ;
	
	return $env_filerecord_id ;
}



function specRsiRecouveo_doc_getEnvGrid( $post_data ) {
	global $_opDB ;
	
	if( $post_data['filter_envFilerecordId_arr'] ) {
		$_load_details = true ;
		$filter_envFilerecordId_list = $_opDB->makeSQLlist( json_decode($post_data['filter_envFilerecordId_arr'],true) ) ;
	}
	
	$TAB_env = array() ;
	
	$query = "SELECT env.*, f.field_FILE_ID FROM view_file_ENVELOPE env" ;
	$query.= " LEFT OUTER JOIN view_file_FILE f ON f.filerecord_id = env.field_LINK_FILE_ID" ;
	$query.= " WHERE 1" ;
	if( isset($filter_envFilerecordId_list) ) {
		$query.= " AND env.filerecord_id IN {$filter_envFilerecordId_list}" ;
	}
	$query.= " ORDER BY env.filerecord_id DESC" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$record = array(
			'env_filerecord_id' => $arr['filerecord_id'],
			
			'env_ref' => $arr['field_ENV_REF'],
			'env_title' => $arr['field_ENV_TITLE'],
			'env_date' => $arr['field_ENV_DATE'],
			
			'file_filerecord_id' => $arr['field_LINK_FILE_ID'],
			'file_id_ref' => $arr['field_FILE_ID'],
			
			'sender_ref' => $arr['field_SENDER_REF'],
			'sender_adr' => $arr['field_SENDER_ADR'],
			
			'recep_ref' => $arr['field_RECEP_REF'],
			'recep_adr' => $arr['field_RECEP_ADR'],
			
			'trpst_status' => $arr['field_TRSPT_STATUS'],
			'trspt_code' => $arr['field_TRSPT_CODE'],
			'trspt_track' => $arr['field_TRSPT_TRACK'],
			
			'stat_count_doc' => 0,
			'stat_count_page' => 0,
			
			'docs' => array()
		);
		
		$TAB_env[$arr['filerecord_id']] = $record ;
	}
	
	$query = "SELECT envdoc.* FROM view_file_ENVELOPE_DOC envdoc" ;
	$query.= " JOIN view_file_ENVELOPE env ON env.filerecord_id=envdoc.filerecord_parent_id" ;
	$query.= " WHERE 1" ;
	if( isset($filter_envFilerecordId_list) ) {
		$query.= " AND env.filerecord_id IN {$filter_envFilerecordId_list}" ;
	}
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		if( !isset($TAB_env[$arr['filerecord_parent_id']]) ) {
			continue ;
		}
		$TAB_env[$arr['filerecord_parent_id']]['docs'][] = array(
			'envdoc_filerecord_id' => $arr['filerecord_id'],
			'envdoc_media_id' => media_pdf_toolFile_getId('ENVELOPE_DOC',$arr['filerecord_id']),
			'doc_desc' => $arr['field_DOC_DESC'],
			'doc_pagecount' => $arr['field_DOC_PAGECOUNT']
		);
		$TAB_env[$arr['filerecord_parent_id']]['stat_count_doc']++ ;
		$TAB_env[$arr['filerecord_parent_id']]['stat_count_page'] += $arr['field_DOC_PAGECOUNT'] ;
	}
	
	return array('success'=>true, 'data'=>array_values($TAB_env)) ;

}



function specRsiRecouveo_doc_getMedias( $post_data ) {
	global $_opDB ;
	
	$p_mediaFileCode = $post_data['media_file_code'] ;
	$p_mediaFilerecordId = $post_data['media_filerecord_id'] ;
	
	switch( $p_mediaFileCode ) {
		case 'IN_POSTAL' :
			$media_file_code = 'IN_POSTAL' ;
			$mediadoc_file_code = 'IN_POSTAL_DOC' ;
			break ;
		default :
			return array('success'=>false) ;
	}
	
	$query = "SELECT mediadoc.* FROM view_file_{$mediadoc_file_code} mediadoc" ;
	$query.= " JOIN view_file_{$media_file_code} media ON media.filerecord_id=mediadoc.filerecord_parent_id" ;
	$query.= " WHERE media.filerecord_id='{$p_mediaFilerecordId}'" ;
	$result = $_opDB->query($query) ;
	$TAB = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB[] = array(
			'mediadoc_file_code' => $mediadoc_file_code,
			'mediadoc_filerecord_id' => $arr['filerecord_id'],
			'mediadoc_media_id' => media_pdf_toolFile_getId($mediadoc_file_code,$arr['filerecord_id']),
			'doc_desc' => $arr['field_DOC_DESC'],
			'doc_pagecount' => $arr['field_DOC_PAGECOUNT']
		);
	}
	
	return array('success'=>true, 'data'=>array_values($TAB)) ;

}





function specRsiRecouveo_doc_postInbox( $post_data ) {
	global $_opDB ;
	usleep(500000) ;
	
	media_contextOpen( $_POST['_sdomainId'] ) ;
	if( $post_data['_has_upload']==1 ) {
		foreach( $_FILES as $mkey => $dummy ) {
			$src_filename = $_FILES[$mkey]['name'] ;
			$src_path = $_FILES[$mkey]['tmp_name'] ;
			
			if( function_exists('finfo_open') ) {
				$finfo = finfo_open(FILEINFO_MIME_TYPE);
				$mimetype = finfo_file($finfo, $src_path) ;
			} elseif( $src_filename ) {
				$ttmp = explode('.',$src_filename) ;
				$mimetype = end($ttmp) ;
			} else {
				return array('success'=>false, 'error'=>'Upload vide ?') ;
			}

			$pdf_binary = NULL ;
			switch($mimetype) {
				case 'application/pdf':
				case 'pdf':
					break ;
					
				default :
					return array('success'=>false, 'error'=>'Document(s) PDF uniquement') ;
			}
		
			$media_id = media_pdf_processUploaded( $src_path, $src_filename ) ;
			break ;
		}
		if( !$media_id ) {
			return array('success'=>false) ;
		}
	}
	
	$arr_ins = array() ;
	$arr_ins['field_OPT_MAILIN'] = $post_data['opt_mailin'] ;
	$arr_ins['field_REF_ACCOUNT'] = $post_data['ref_account'] ;
	$arr_ins['field_REF_MAILOUT'] = $post_data['ref_mailout'] ;
	$arr_ins['field_DATE_RECEP'] = $post_data['date_recep'] ;
	$inpostal_filerecord_id = paracrm_lib_data_insertRecord_file( 'IN_POSTAL', 0, $arr_ins );
	
	if( $media_id ) {
		$arr_ins = array() ;
		$arr_ins['field_DOC_DESC'] = 'Mail Inbox' ;
		$arr_ins['field_DOC_PAGECOUNT'] = media_pdf_getPageCount($media_id) ;
		$inpostaldoc_filerecord_id = paracrm_lib_data_insertRecord_file( 'IN_POSTAL_DOC', $inpostal_filerecord_id, $arr_ins );
		media_pdf_move( $media_id,  media_pdf_toolFile_getId('IN_POSTAL_DOC',$inpostaldoc_filerecord_id) ) ;
	}
	
	media_contextClose() ;
	
	specRsiRecouveo_lib_autorun_processInboxDoc( $inpostal_filerecord_id ) ;
	
	return array('success'=>true) ;
}







function specRsiRecouveo_doc_buildInPostal( $fileaction_filerecord_id, $docs ) {
	global $_opDB ;
	$query = "SELECT f.field_LINK_ACCOUNT FROM view_file_FILE_ACTION fa
			JOIN view_file_FILE f ON f.filerecord_id=fa.filerecord_parent_id
			WHERE fa.filerecord_id='{$fileaction_filerecord_id}'" ;
	$link_account = $_opDB->query_uniqueValue($query) ;
	
	$arr_ins = array() ;
	$arr_ins['field_OPT_MAILIN'] = 'MAIL_OK' ;
	$arr_ins['field_REF_ACCOUNT'] = $link_account ;
	$arr_ins['field_DATE_RECEP'] = date('Y-m-d') ;
	$arr_ins['field_LINK_IS_ON'] = 1 ;
	$arr_ins['field_LINK_FILE_ACTION_ID'] = $fileaction_filerecord_id ;
	$inpostal_filerecord_id = paracrm_lib_data_insertRecord_file( 'IN_POSTAL', 0, $arr_ins );
	
	media_contextOpen( $_POST['_sdomainId'] ) ;
	foreach( $docs as $doc ) {
		$arr_ins = array() ;
		$arr_ins['field_DOC_DESC'] = $doc['doc_desc'] ;
		$arr_ins['field_DOC_PAGECOUNT'] = $doc['doc_pagecount'] ;
		$inpostaldoc_filerecord_id = paracrm_lib_data_insertRecord_file( 'IN_POSTAL_DOC', $inpostal_filerecord_id, $arr_ins );
		
		media_pdf_move( $doc['envdoc_media_id'],  media_pdf_toolFile_getId('IN_POSTAL_DOC',$inpostaldoc_filerecord_id) ) ;
	}
	media_contextClose() ;
	
	return $inpostal_filerecord_id ;
}


?>
