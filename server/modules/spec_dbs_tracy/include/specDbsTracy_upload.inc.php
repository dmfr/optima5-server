<?php

function specDbsTracy_reportList( $post_data ) {
	global $_opDB ;
	
	$TAB = array() ;
	$TAB[] = array('id'=>'RCL_VL02NPOD','text'=>'RCL_VL02NPOD') ;
	$TAB[] = array('id'=>'RCL_VL02NAWB','text'=>'RCL_VL02NAWB') ;
	
	$query = "SELECT qsql_id, qsql_name 
		FROM qsql JOIN input_query_src ON input_query_src.target_qsql_id = qsql.qsql_id
		ORDER BY qsql_name" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$TAB[] = array('id'=>'QSQL::'.$arr[0],'text'=>'QSQL / '.$arr[1]) ;
	}
	
	return array('success'=>true, 'data'=>$TAB) ;
}


function specDbsTracy_report( $post_data ) {
	$form_data = json_decode($post_data['data'],true) ;
	
	// Specs
	switch( $form_data['file_model'] ) {
		case 'RCL_VL02NPOD' :
			$csv_buffer = specDbsTracy_report_RCL_VL02NPOD_tmp($form_data) ;
			break ;
		case 'RCL_VL02NAWB' :
			$csv_buffer = specDbsTracy_report_RCL_VL02NAWB_tmp($form_data) ;
			break ;
		case '190304BrokerXML' :
			$csv_buffer = specDbsTracy_report_190304BrokerXML($form_data['trspt_filerecord_id']) ;
			$xml_filename = 'Broker190304_'.$form_data['trspt_filerecord_id'].'_'.time().'.xml' ;
			break ;
		default :
			if( strpos($form_data['file_model'],'QSQL::')===0 ) {
				$ttmp = explode('::',$form_data['file_model']) ;
				$qsql_id = $ttmp[1] ;
				specDbsTracy_report_qsql($qsql_id,$form_data) ;
				die() ;
			}
			return array('success'=>false);
	}
	
	$filename = 'OP5report_TRACY_.'.$form_data['file_model'].'_'.time().'.'.'csv' ;
	if( $xml_filename ) {
		$filename = $xml_filename ;
	}
	header("Content-Type: application/force-download; name=\"$filename\""); 
	header("Content-Disposition: attachment; filename=\"$filename\""); 
	echo $csv_buffer ;
	die() ;
}
function specDbsTracy_report_qsql( $qsql_id, $form_data ) {
	global $_opDB ;
	
	$query = "SELECT * FROM qsql WHERE qsql_id='{$qsql_id}'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return array('success'=>false) ;
	}
	$arr = $_opDB->fetch_assoc($result) ;
	$qsql_name = preg_replace("/[^a-zA-Z0-9]/", "", $arr['qsql_name']) ;
	$sql_querystring = $arr['sql_querystring'] ;
	
	$TAB = paracrm_queries_qsql_lib_exec($sql_querystring,$is_rw=FALSE,$auth_bypass=TRUE,$vars=$form_data) ;
	
	$objPHPExcel = paracrm_queries_xls_build( $TAB, NULL ) ;
	if( !$objPHPExcel ) {
		die() ;
	}
	
	$tmpfilename = tempnam( sys_get_temp_dir(), "FOO");
	$objWriter = PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel2007');
	$objWriter->save($tmpfilename);
	$objPHPExcel->disconnectWorksheets();
	unset($objPHPExcel) ;
	
	$filename = 'OP5report_TRACY_.'.$qsql_name.'_'.time().'.'.'xlsx' ;
	header("Content-Type: application/force-download; name=\"$filename\""); 
	header("Content-Disposition: attachment; filename=\"$filename\""); 
	readfile($tmpfilename) ;
	unlink($tmpfilename) ;
	die() ;
}


function specDbsTracy_report_RCL_VL02NPOD_tmp( $form_data, $use_log=FALSE ) {
	global $_opDB ;
	$date_now = date('Y-m-d H:i:s') ;

	$json = specDbsTracy_order_getRecords(array('filter_archiveIsOn'=>1,'filter_socCode'=>'ACL')) ;
	$csv_buffer = '' ;
	foreach( $json['data'] as $rowOrder ) {
		foreach( $rowOrder['steps'] as $rowOrderStep ) {
			if( !$rowOrderStep['status_is_ok'] || $rowOrderStep['step_code']!='90_POD' ) {
				continue ;
			}
			if( $rowOrderStep['date_actual'] >= $form_data['date_start'] 
				&& $rowOrderStep['date_actual'] <= $form_data['date_end'] ) {
				
				if( $use_log ) {
					$query = "SELECT count(*) FROM view_file_Z_ACL180612_LOG WHERE field_QUERY_CODE='POD' AND field_LINK_FILERECORD_ID='{$rowOrder['order_filerecord_id']}'" ;
					if( $_opDB->query_uniqueValue($query) > 0 ) {
						continue ;
					}
					$arr_ins = array() ;
					$arr_ins['field_QUERY_CODE'] = 'POD' ;
					$arr_ins['field_LINK_FILERECORD_ID'] = $rowOrder['order_filerecord_id'] ;
					$arr_ins['field_EXPORT_DATE'] = $date_now ;
					paracrm_lib_data_insertRecord_file( 'Z_ACL180612_LOG' , 0 , $arr_ins ) ;
				}
				
				$csv_buffer.= $rowOrder['id_dn'].';'.date('d.m.Y',strtotime($rowOrderStep['date_actual'])).';'.date('H:i',strtotime($rowOrderStep['date_actual']))."\r\n" ;
			}
		}
		
	}
	return $csv_buffer ;
}
function specDbsTracy_report_RCL_VL02NAWB_tmp( $form_data, $use_log=FALSE ) {
	global $_opDB ;
	$date_now = date('Y-m-d H:i:s') ;

	$csv_buffer = '' ;
	$query = "SELECT c.field_ID_DN, t.field_FLIGHT_AWB, c.filerecord_id
				FROM view_file_CDE c, view_file_TRSPT_CDE tc, view_file_TRSPT t
				WHERE c.filerecord_id = tc.field_FILE_CDE_ID AND tc.field_LINK_IS_CANCEL='0'
				AND tc.filerecord_parent_id = t.filerecord_id
				AND c.field_ID_SOC='ACL' AND t.field_FLIGHT_AWB<>'' AND DATE(t.field_DATE_CREATE) BETWEEN '{$form_data['date_start']}' AND '{$form_data['date_end']}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) !=  FALSE ) {
		$order_filerecord_id = $arr[2] ;
		
		if( $use_log ) {
			$query = "SELECT count(*) FROM view_file_Z_ACL180612_LOG WHERE field_QUERY_CODE='AWB' AND field_LINK_FILERECORD_ID='{$order_filerecord_id}'" ;
			if( $_opDB->query_uniqueValue($query) > 0 ) {
				continue ;
			}
			$arr_ins = array() ;
			$arr_ins['field_QUERY_CODE'] = 'AWB' ;
			$arr_ins['field_LINK_FILERECORD_ID'] = $order_filerecord_id ;
			$arr_ins['field_EXPORT_DATE'] = $date_now ;
			paracrm_lib_data_insertRecord_file( 'Z_ACL180612_LOG' , 0 , $arr_ins ) ;
		}
		
		$csv_buffer.= $arr[0].';'.$arr[1]."\r\n" ;
	}
	
	return $csv_buffer ;
}
function specDbsTracy_report_190304BrokerXML( $trspt_filerecord_id ) {
	global $_opDB ;
	
	$ttmp = specDbsTracy_trspt_getRecords(array('filter_trsptFilerecordId_arr'=>json_encode(array($trspt_filerecord_id)))) ;
	$trspt_record = $ttmp['data'][0] ;
	if( !$trspt_record ) {
		return array('success'=>false) ;
	}
	
	
	//print_r($trspt_record) ;
	$hat_record = reset($trspt_record['hats']) ;
	$order_record = reset($trspt_record['orders']) ;
	
	
	$xml_buffer = '' ;
	$xml_buffer.= '<?xml version="1.0" encoding="utf-8"?>' ;
	$xml_buffer.= '<RequestToBroker>' ;
	$xml_buffer.= '<RequestDate>'.date('Ymd').'</RequestDate>' ;
	
	$inv_no = $order_record['ref_invoice'] ;
	$xml_buffer.= "<InvoiceNo>{$inv_no}</InvoiceNo>" ;
	
	$xml_buffer.= "<Deliveries>" ;
	foreach( $trspt_record['orders'] as $order_iter ) {
		$xml_buffer.= "<DeliveryNo>{$order_iter['id_dn']}</DeliveryNo>" ;
	}
	$xml_buffer.= "</Deliveries>" ;
	
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
	
	$attachments = array() ;
	foreach( $order_record['attachments'] as $attachment_iter ) {
		if( !(strpos($attachment_iter['attachment_txt'],'INVOICE')===FALSE) ) {
			$attachments[] = $attachment_iter ;
		}
	}
	if( $attachments ) {
		$arr_ids = array() ;
		foreach($attachments as $attachment_iter) {
			$arr_ids[] = $attachment_iter['attachment_media_id'] ;
		}
		
		
		media_contextOpen( $_POST['_sdomainId'] ) ;
		
		$jpegs = array() ;
		foreach( $arr_ids as $media_id ) {
			$src_filepath = media_img_getPath( $media_id ) ;
			$jpegs[] = file_get_contents($src_filepath) ;
		}
		
		$pdf = media_pdf_jpgs2pdf($jpegs,$page_format='A4') ;
		media_contextClose() ;
		
		$xml_buffer.= "<DocumentExport>" ;
		$xml_buffer.= "<BinaryFormat>".'PDF'."</BinaryFormat>" ;
		$xml_buffer.= "<BinarySize>".strlen($pdf)."</BinarySize>" ;
		$xml_buffer.= "<BinaryBase64>".base64_encode($pdf)."</BinaryBase64>" ;
		$xml_buffer.= "</DocumentExport>" ;
	}
	
	
	$xml_buffer.= '</RequestToBroker>' ;

	return $xml_buffer ;
}











function specDbsTracy_upload( $post_data ) {
	global $_opDB ;
	
	$handle = fopen($_FILES['file_upload']['tmp_name'],"rb") ;
	$file_model = $post_data['file_model'] ;
	
	// Specs
	switch( $file_model ) {
		case 'DATAIMPORT_INPUTPODLTA' :
			$ret = specDbsTracy_upload_DATAIMPORT($handle,'INPUT_PODLTA') ;
			break ;
		default :
			return array('success'=>false);
	}
	
	return array('success'=>$ret) ;
}

function specDbsTracy_upload_DATAIMPORT( $handle, $file_code ) {
	rewind($handle) ;
	$handle = paracrm_lib_dataImport_preHandle($handle) ;
	rewind($handle) ;
	paracrm_lib_dataImport_commit_processHandle( 'file', $file_code, $handle ) ;
	return true ;
}

?>
