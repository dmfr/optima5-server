<?php

function specDbsEmbramach_postprocEvent_SMTP( $flowpickingevent_filerecord_id, $arr_params_SMTP ) {
	global $_opDB ;
	$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
	$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;
	
	
	$query = "SELECT * FROM view_file_FLOW_PICKING_EVENT WHERE filerecord_id='{$flowpickingevent_filerecord_id}'" ;
	$result = $_opDB->query($query) ;
	$arrDB_event = $_opDB->fetch_assoc($result) ;
	
	$query = "SELECT * FROM view_file_FLOW_PICKING WHERE filerecord_id='{$arrDB_event['filerecord_parent_id']}'" ;
	$result = $_opDB->query($query) ;
	$arrDB_picking = $_opDB->fetch_assoc($result) ;
	
	$query = "SELECT * FROM view_bible_LIST_WARNINGCODE_entry WHERE entry_key='{$arrDB_event['field_EVENT_CODE']}'" ;
	$result = $_opDB->query($query) ;
	$arrDB_warning = $_opDB->fetch_assoc($result) ;
	
	
	
	if( $arrDB_event['field_EVENT_JSONDATA'] ) {
		foreach( json_decode($arrDB_event['field_EVENT_JSONDATA'],true) as $row ) {
			if( $row['name']=='file_upload' ) {
				$attach_name = $row['value'] ;
				
				$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
				$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;
				media_contextOpen( $_sdomain_id ) ;
				$attach_binary = media_bin_getBinary( media_bin_toolFile_getId('FLOW_PICKING_EVENT',$flowpickingevent_filerecord_id) ) ;
				media_contextClose() ;
			}
		}
	}
	
	print_r($arr_params_SMTP) ;
	print_r($arrDB_picking) ;
	print_r($arrDB_event) ;
	
	
	$txt_buffer = '' ;
	
	$txt_buffer.= "\r\n" ;
	$txt_buffer.= 'Hello,'."\r\n" ;
	$txt_buffer.= "\r\n" ;
	$txt_buffer.= 'Special status has been applied over MACH picking.'."\r\n" ;
	$txt_buffer.= 'Find details below :'."\r\n" ;
	
	$txt_buffer.= "\r\n" ;
	
	$txt_buffer.= "Company : {$arrDB_picking['field_SOC_ID']}\r\n" ;
	$txt_buffer.= "Picking reference : {$arrDB_picking['field_DELIVERY_ID']}\r\n" ;
	$txt_buffer.= "Consignee code : {$arrDB_picking['field_SHIPTO_CODE']}\r\n" ;
	$txt_buffer.= "Consignee name : {$arrDB_picking['field_SHIPTO_NAME']}\r\n" ;
	
	$txt_buffer.= "\r\n" ;
	
	$txt_buffer.= "Event date : {$arrDB_event['field_EVENT_DATE']}\r\n" ;
	$txt_buffer.= "Event code : {$arrDB_event['field_EVENT_CODE']} - {$arrDB_warning['field_TXT']}\r\n" ;
	$txt_buffer.= "Description : {$arrDB_event['field_EVENT_TXT']}\r\n" ;
	$txt_buffer.= "Attachment name : {$attach_name}\r\n" ;
	$txt_buffer.= "\r\n" ;
	
	$static_location = 'MITRY MORY' ;
	$txt_buffer.= "Localisation : {$static_location}\r\n" ;
	
	$txt_buffer.= "\r\n" ;
	
	$txt_buffer.= 'This is an automated email from DB Schenker. Do not reply to this message'."\r\n" ;
	$txt_buffer.= "\r\n" ;
	$txt_buffer.= 'Best regards.'."\r\n" ;
	$txt_buffer.= "\r\n" ;
	$txt_buffer.= "\r\n" ;
	
	

	
	
	
	$email_subject = "[MACH] Picking {$arrDB_picking['field_SOC_ID']}/{$arrDB_picking['field_DELIVERY_ID']} - Event {$arrDB_event['field_EVENT_CODE']}" ;
	
	$mail = PhpMailer::getInstance() ;
	if( !$mail ) {
		return FALSE ;
	}
	try {
		$mail->isSMTP();
		$mail->Host = $arr_params_SMTP['SMTP'] ;
		$mail->SMTPOptions = array(
			'ssl' => array(
				'verify_peer' => false,
				'verify_peer_name' => false,
				'allow_self_signed' => true
			)
		);
		
		$mail->CharSet = "utf-8";
		$mail->setFrom($arr_params_SMTP['EMAIL_FROM']);
		foreach( explode(',',$arr_params_SMTP['EMAIL_TO']) as $email_to ) {
			$mail->addAddress($email_to) ;
		}
		$mail->Subject  = $email_subject ;
		$mail->Body = $txt_buffer ;
		if( $attach_binary ) {
			$mail->addStringAttachment($attach_binary, $attach_name) ;
		}
		$mail->send() ;
		
		
		//echo $mail->ErrorInfo ;
	
	} catch (Exception $e) {
		echo "Message could not be sent. Mailer Error: {$mail->ErrorInfo}";
		return false ;
	}

	return true ;
	
}

function specDbsEmbramach_reportList( $post_data ) {
	global $_opDB ;
	
	$TAB = array() ;
	
	$query = "SELECT qsql_id, qsql_name 
		FROM qsql JOIN input_query_src ON input_query_src.target_qsql_id = qsql.qsql_id
		ORDER BY qsql_name" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$TAB[] = array('id'=>'QSQL::'.$arr[0],'text'=>'QSQL / '.$arr[1]) ;
	}
	
	return array('success'=>true, 'data'=>$TAB) ;
}


function specDbsEmbramach_report( $post_data ) {
	$form_data = json_decode($post_data['data'],true) ;
	
	// Specs
	switch( $form_data['file_model'] ) {
		default :
			if( strpos($form_data['file_model'],'QSQL::')===0 ) {
				$ttmp = explode('::',$form_data['file_model']) ;
				$qsql_id = $ttmp[1] ;
				specDbsEmbramach_report_qsql($qsql_id,$form_data) ;
				die() ;
			}
			return array('success'=>false);
	}
	
	$filename = 'OP5report_TRACY_.'.$form_data['file_model'].'_'.time().'.'.'csv' ;
	header("Content-Type: application/force-download; name=\"$filename\""); 
	header("Content-Disposition: attachment; filename=\"$filename\""); 
	echo $csv_buffer ;
	die() ;
}
function specDbsEmbramach_report_qsql( $qsql_id, $form_data ) {
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
	
	$filename = 'OP5report_MACH_.'.$qsql_name.'_'.time().'.'.'xlsx' ;
	header("Content-Type: application/force-download; name=\"$filename\""); 
	header("Content-Disposition: attachment; filename=\"$filename\""); 
	readfile($tmpfilename) ;
	unlink($tmpfilename) ;
	die() ;
}



function specDbsEmbramach_upload( $post_data ) {
	if( $_FILES['file_upload'] ) {
		$debug = file_get_contents($_FILES['file_upload']['tmp_name']) ;
		$handle = fopen($_FILES['file_upload']['tmp_name'],"rb") ;
	} elseif( $post_data['file_contents'] ) {
		$debug = $post_data['file_contents'] ;
		$handle = tmpfile() ;
		fwrite($handle,$post_data['file_contents']) ;
		fseek($handle,0) ;
	} else {
		return array('success'=>false) ;
	}
	
	if( $GLOBALS['httpd_log'] ) {
		$filename = $GLOBALS['httpd_log']."/machUpload_".$post_data['file_model']."_".time().'.txt' ;
		@file_put_contents($filename, $debug) ;
	}
	
	$flow_code = '' ;
	switch( $post_data['file_model'] ) {
		case 'MB51' :
			specDbsEmbramach_upload_ZMB51($handle) ;
			break ;
		case 'Z080P' :
		case 'Z080L' :
			$flow_code = 'INBOUND' ;
			specDbsEmbramach_upload_Z080($handle) ;
			break ;
		default :
			return array('success'=>false) ;
	}
	fclose($handle) ;
	
	$arr_ins = array() ;
	$arr_ins['field_DATE'] = date('Y-m-d H:i:s') ;
	$arr_ins['field_FLOW_CODE'] = $flow_code ;
	$arr_ins['field_FILE_MODEL'] = $post_data['file_model'] ;
	paracrm_lib_data_insertRecord_file('LOG_IMPORT',0,$arr_ins) ;
	
	return array('success'=>true) ;
}
function specDbsEmbramach_upload_ZMB51($handle) {
	$handle_trad = tmpfile() ;
	specDbsEmbramach_upload_lib_separator( $handle, $handle_trad ) ;
	fseek($handle_trad,0) ;
	
	paracrm_lib_dataImport_commit_processHandle( 'file','ZMB51', $handle_trad ) ;
	
	// Done 2016-03: reattach priorities
	$query = "UPDATE view_file_ZMB51 z 
				JOIN view_file_FLOW_PICKING pk ON pk.field_DELIVERY_ID=TRIM(LEADING '0' FROM z.field_REFERENCE) 
				SET z.field_MACH_PK_PRIO=pk.field_PRIORITY" ;
	$GLOBALS['_opDB']->query($query) ;
	
	fclose($handle_trad) ;
}
function specDbsEmbramach_upload_Z080($handle) {
	$handle_trad = tmpfile() ;
	specDbsEmbramach_upload_lib_separator( $handle, $handle_trad ) ;
	fseek($handle_trad,0) ;
	
	paracrm_lib_dataImport_commit_processHandle( 'file','Z080', $handle_trad ) ;
	
	// Spec COPY, TODO: use DataSourceCenter
	specDbsEmbramach_upload_sync_FLOW_INBOUND() ;

	fclose($handle_trad) ;
}









function specDbsEmbramach_upload_sync_FLOW_INBOUND() {
	global $_opDB ;
	
	$file_code = 'FLOW_INBOUND' ;
	$file_code_step = 'FLOW_INBOUND_STEP' ;
	
	$raw_Z080 = paracrm_lib_data_getFileRecords('Z080') ;
	if( count($raw_Z080) <= 1 ) {
		return ;
	}
	foreach( $raw_Z080 as &$raw_record ) {
		$record_row = array() ;
		$record_row['Z080'] = $raw_record ;
		paracrm_lib_file_joinQueryRecord( 'Z080', $record_row ) ;
		foreach( $record_row['Z080'] as $mkey=>$mvalue ) {
			$raw_record[$mkey] = $mvalue ;
		}
	}
	unset($raw_record) ;
	
	$map_stepCode_arrFields = array(
		'IN_01_DOCK' => array('field_DATE_P_V1_DOCK'),
		'IN_02_RECEIPT' => array('field_DATE_P_V2_RECEIPT','field_DATE_L_END@EN'),
		'IN_04_PUTAWAY' => array('field_DATE_P_V4_PUTAWAY')
	);
	
	$arr_insertedFilerecordId = array() ;
	foreach( $raw_Z080 as &$raw_record ) {
		$arr_ins = array() ;
		$arr_ins['field_PRIORITY'] = 'IN_1' ;
		$arr_ins['field_D_AWB'] = $raw_record['field_AWB'] ;
		$arr_ins['field_D_CART'] = $raw_record['field_TYPE_CART'] ;
		$arr_ins['field_D_CARRIER'] = $raw_record['field_CARRIER'] ;
		$arr_ins['field_D_XDOCK'] = $raw_record['field_XDOCK'] ;
		$arr_ins['field_D_TYPE'] = $raw_record['field_TYPE'] ;
		$arr_ins['field_D_DOCREF'] = $raw_record['field_DOC_REF'] ;
		$arr_ins['field_D_ECODE'] = $raw_record['field_ECODE'] ;
		$arr_ins['field_D_QTY'] = $raw_record['field_QTY'] ;
		$filerecord_id = paracrm_lib_data_insertRecord_file($file_code,0,$arr_ins) ;
		
		$current_step = NULL ;
		foreach( $map_stepCode_arrFields as $step_code => $arr_fields ) {
			foreach( $arr_fields as $src_field ) {
				$ttmp = explode('@',$src_field) ;
				if( count($ttmp) > 1 ) {
					//echo $src_field ;
					$convert = $ttmp[1] ;
					$src_field = $ttmp[0] ;
				} else {
					$convert = NULL ;
				}
				//paracrm_lib_data_insertRecord_file($file_code_step,$filerecord_id,$subrow) ;
				
				$value = $raw_record[$src_field] ;
				if( $convert == 'US' ) {
					//echo $value.'->' ;
					$ttmp = explode('/',$value) ;
					$value = $ttmp[2].'-'.$ttmp[0].'-'.$ttmp[1] ;
					//echo $value."\n" ;
				}
				if( $convert == 'EN' ) {
					//echo $value.'->' ;
					$ttmp = explode('.',$value) ;
					$value = $ttmp[2].'-'.$ttmp[1].'-'.$ttmp[0] ;
					//echo $value."\n" ;
				}
				if( strtotime($value) > 0 ) {
					$subrow = array() ;
					$subrow['field_STEP'] = $step_code ;
					$subrow['field_DATE'] = $value ;
					paracrm_lib_data_insertRecord_file($file_code_step,$filerecord_id,$subrow) ;
					
					$current_step = $step_code ;
					break ;
				}
			}
		}
		
		if( $current_step ) {
			$arr_update = array() ;
			$arr_update['field_STEP_CURRENT'] = $current_step ;
			if( $_field_DATE_ISSUE ) {
				$arr_update['field_DATE_ISSUE'] = $_field_DATE_ISSUE ;
			}
			paracrm_lib_data_updateRecord_file( $file_code, $arr_update, $filerecord_id ) ;
		}
		
		$arr_insertedFilerecordId[] = $filerecord_id ;
	}

	$view = 'view_file_'.$file_code ;
	$query = "SELECT filerecord_id FROM {$view}" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$arr_existingFilerecordId[] = $arr[0] ;
	}
	$todelete_filerecordIds = array_diff($arr_existingFilerecordId,$arr_insertedFilerecordId) ;
	foreach( $todelete_filerecordIds as $filerecord_id ) {
		paracrm_lib_data_deleteRecord_file( $file_code , $filerecord_id ) ;
	}
	
	
	
	if( TRUE ) {
		// Passage en active
		// => tous les records sans STATUS
		
		$arr_newFilerecordIds = array() ;
		$query = "SELECT filerecord_id FROM view_file_{$file_code} WHERE field_STATUS=''" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$arr_newFilerecordIds[] = $arr[0] ;
		}
		
		foreach( $arr_newFilerecordIds as $filerecord_id ) {
			$arr_update = array() ;
			$arr_update['field_STATUS'] = 'ACTIVE' ;
			paracrm_lib_data_updateRecord_file( $file_code, $arr_update, $filerecord_id ) ;
		}
	}
}






function specDbsEmbramach_upload_lib_separator( $handle_in, $handle_out, $separator='|' ) {
	$handle_priv = tmpfile() ;
	while( !feof($handle_in) ) {
		$lig = fgets($handle_in) ;
		$lig = mb_convert_encoding($lig, "UTF-8", mb_detect_encoding($lig));
		fwrite($handle_priv,$lig) ;
	}
	
	fseek($handle_priv,0) ;
	$max_occurences = 0 ;
	while( !feof($handle_priv) ) {
		$arr_csv = fgetcsv($handle_priv,0,$separator) ;
		if( count($arr_csv) > $max_occurences ) {
			$max_occurences = count($arr_csv) ;
		}
	}
	
	fseek($handle_priv,0) ;
	$strip_first = TRUE ;
	$strip_last = TRUE ;
	while( !feof($handle_priv) ) {
		$arr_csv = fgetcsv($handle_priv,0,$separator) ;
		if( count($arr_csv) != $max_occurences ) {
			continue ;
		}
		if( reset($arr_csv) ) {
			$strip_first = FALSE ;
		}
		if( end($arr_csv) ) {
			$strip_last = FALSE ;
		}
	}
	
	$is_first = TRUE ;
	
	fseek($handle_priv,0) ;
	while( !feof($handle_priv) ) {
		$arr_csv = fgetcsv($handle_priv,0,$separator) ;
		if( count($arr_csv) != $max_occurences ) {
			continue ;
		}
		if( $strip_first ) {
			array_shift($arr_csv) ;
		}
		if( $strip_last ) {
			array_pop($arr_csv) ;
		}
		foreach( $arr_csv as &$item ) {
			$item = trim($item) ;
		}
		unset($item) ;
		if( $is_first ) {
			$arr_header = $arr_csv ;
			$is_first = FALSE ;
			
			// Réécriture du header :
			$map_field_nbOcc = array() ;
			foreach( $arr_csv as $idx => $field ) {
				$map_field_nbOcc[$field]++ ;
				if( $map_field_nbOcc[$field] > 1 ) {
					$arr_csv[$idx].= '-'.$map_field_nbOcc[$field] ;
				}
			}
		} elseif($arr_csv == $arr_header) {
			continue ;
		}
		fputcsv($handle_out,$arr_csv) ;
	}
	
	fclose($handle_priv) ;
}

?>
