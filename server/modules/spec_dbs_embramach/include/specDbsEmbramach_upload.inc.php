<?php

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
	
	$filename = "/var/log/apache2/machUpload_".$post_data['file_model']."_".time().'.txt' ;
	@file_put_contents($filename, $debug) ;
	
	$flow_code = '' ;
	switch( $post_data['file_model'] ) {
		case 'VL06F_active' :
			$flow_code = 'PICKING' ;
			specDbsEmbramach_upload_VL06F($handle,FALSE) ;
			break ;
		case 'VL06F_closed' :
			$flow_code = 'PICKING' ;
			specDbsEmbramach_upload_VL06F($handle,TRUE) ;
			break ;
		case 'ZLORSD015' :
			$flow_code = 'PICKING' ;
			specDbsEmbramach_upload_ZLORSD015($handle) ;
			break ;
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
function specDbsEmbramach_upload_ZLORSD015($handle) {
	global $_opDB ;
	//paracrm_define_truncate( array('data_type'=>'file','file_code'=>'FLOW_PICKING') ) ;
	
	$br_time = new DateTimeZone('America/Sao_Paulo');
	$fr_time = new DateTimeZone('Europe/Paris');
	
	$file_code = 'FLOW_PICKING' ;
	$file_code_step = 'FLOW_PICKING_STEP' ;

	$map_steps = array(
		'01_CREATE' => array(12,13),
		'02_GROUP' => array(14,15),
		'03_PICK_START' => array(18,19),
		'04_ASM_END' => array(20,21),
		'05_INSPECT_START' => array(22,23),
		'06_INSPECT_END' => array(24,25),
		'07_PACK_START' => array(26,27),
		'08_PACK_END' => array(28,29),
		'09_INVOICE' => array(30,31),
		'10_AWB' => array(32,33)
	);


	$first = TRUE ;
	while( !feof($handle) )
	{
		$arr_csv = fgetcsv($handle,0,'|') ;
		if( $first && count($arr_csv)==1 && !trim($arr_csv[0],'-') ) {
			return ;
		}
		if( !$arr_csv ) {
			continue ;
		}
		if( $first ) {
			$first = FALSE ;
		}
		
		if( !$arr_csv[0] ) {
			continue ;
		}
		//print_r($arr_csv) ;
		
		$_field_DATE_ISSUE = NULL ;
		
		$main_row = $steps_arrRow = array() ;
		$main_row['field_DELIVERY_ID'] = $arr_csv[0] ;
		$main_row['field_PRIORITY'] = (float)$arr_csv[1] ;
		$main_row['field_TYPE'] = $arr_csv[6] ;
		$main_row['field_FLOW'] = $arr_csv[40] ;
		$main_row['field_SHIPTO_CODE'] = $arr_csv[9] ;
		$main_row['field_SHIPTO_NAME'] = $arr_csv[10] ;
		$main_row['field_LINE_COUNT'] = $arr_csv[11] ;
		foreach( $map_steps as $step_code => $idxs ) {
			$date_txt = substr($arr_csv[$idxs[0]],0,4).'-'.substr($arr_csv[$idxs[0]],4,2).'-'.substr($arr_csv[$idxs[0]],6,2).' '.substr($arr_csv[$idxs[1]],0,2).':'.substr($arr_csv[$idxs[1]],2,2) ;
			$timestamp = strtotime($date_txt) ;
			if( $timestamp <= 0 ) {
				continue ;
			}
			$main_row['field_STEP_CURRENT'] = $step_code ;
			
			// Adjust timezone -4(BR) >> +1(FR)
			$datetime = new DateTime($date_txt,$br_time);
			$datetime->setTimezone($fr_time);
			$date_txt = $datetime->format('Y-m-d H:i:s');			
			
			$steps_arrRow[] = array(
				'field_STEP' => $step_code,
				'field_DATE' => $date_txt
			);
			if( $step_code=='01_CREATE' && date('Y',$timestamp) < 2015 ) {
				continue 2 ;
			}
			if( $step_code=='01_CREATE' ) {
				$_field_DATE_ISSUE = $date_txt ;
			}
			
			if( $step_code=='08_PACK_END' && trim($main_row['field_TYPE'])=='ZLT1' ) {
				$steps_arrRow[] = array(
					'field_STEP' => '09_INVOICE',
					'field_DATE' => $date_txt
				);
			}
		}
		
		// $filerecord_id = paracrm_lib_data_insertRecord_file($file_code,0,$main_row) ;
		$deliveryId = $main_row['field_DELIVERY_ID'] ;
		$deliveryId_numeric = (int)$main_row['field_DELIVERY_ID'] ;
		$query = "SELECT filerecord_id FROM view_file_{$file_code} WHERE field_DELIVERY_ID IN ('$deliveryId','$deliveryId_numeric')" ;
		$result = $_opDB->query($query) ;
		if( $_opDB->num_rows($result) < 1 ) {
			continue ;
		}
		$arr = $_opDB->fetch_row($result) ;
		$filerecord_id = $arr[0] ;
		
		$arr_update = array() ;
		$arr_update['field_STEP_CURRENT'] = $main_row['field_STEP_CURRENT'] ;
		if( $_field_DATE_ISSUE ) {
			$arr_update['field_DATE_ISSUE'] = $_field_DATE_ISSUE ;
		}
		paracrm_lib_data_updateRecord_file( $file_code, $arr_update, $filerecord_id ) ;
		
		$arr_existing_ids = array() ;
		foreach( paracrm_lib_data_getFileChildRecords($file_code_step,$filerecord_id) as $subrow ) {
			$arr_existing_ids[] = $subrow['filerecord_id'] ;
		}
		$arr_new_ids = array() ;
		foreach( $steps_arrRow as $subrow ) {
			$arr_new_ids[] = paracrm_lib_data_insertRecord_file($file_code_step,$filerecord_id,$subrow) ;
		}
		$to_delete = array_diff( $arr_existing_ids, $arr_new_ids );
		foreach( $to_delete as $filerecord_id ) {
			paracrm_lib_data_deleteRecord_file($file_code_step,$filerecord_id) ;
		}
		
		
		
		continue ;
	}
	
	// Après l'importation ZLORSD015
	// => appel de la routine d'affichage / calcul MACH pour mise à jour du statut ACTIVE => CLOSED
	specDbsEmbramach_mach_getGridData( array('flow_code'=>'PICKING') ) ;

	return ;
}




function specDbsEmbramach_upload_VL06F($handle, $VL06F_forceClosed) {
	global $_opDB ;
	
	$file_code = 'FLOW_PICKING' ;
	$file_code_line = 'FLOW_PICKING_LINE' ;
	
	$arr_importedFilerecordIds = array() ;
	$map_pickingID_header = array() ;
	$map_pickingID_arrLigs = array() ;
	
	$first = TRUE ;
	while( !feof($handle) )
	{
		// lecture linéaire du fichier, séparateur = |
		$arr_csv = fgetcsv($handle,0,'|') ;
			if( !$arr_csv ) {
				continue ;
			}
			foreach( $arr_csv as &$value ) {
				$value = trim($value) ;
			}
			unset($value) ;
		if( !$arr_csv[1] || !is_numeric($picking_id=$arr_csv[1]) || strlen($picking_id) < 3 ) {
			continue ;
		}
		
		// extraction des champs utilisés
		$data_header = array() ;
		$data_header['field_DELIVERY_ID'] = $arr_csv[1] ;
		$ttmp = date_create_from_format('d.m.Y', $arr_csv[7]);
		$data_header['field_DATE_TOSHIP'] = date_format($ttmp, 'Y-m-d');
		$data_header['field_PRIORITY'] = $arr_csv[10] ;
		$data_header['field_FLOW'] = $arr_csv[13] ;
		$data_header['field_BUSINESSUNIT'] = $arr_csv[16] ;
		$data_header['field_SHIPTO_CODE'] = $arr_csv[22] ;
		$data_header['field_SHIPTO_NAME'] = $arr_csv[23] ;
		//$data_header['field_FEEDBACK_TXT'] = $arr_csv[40] ; //HACK
			// champs non stockés
			$data_header['field_PRIV_WM'] = $arr_csv[19] ;
			$data_header['field_PRIV_SGP'] = $arr_csv[20] ;
			$data_header['field_PRIV_StatW'] = $arr_csv[21] ;
			$data_header['field_PRIV_TLvr'] = $arr_csv[32] ;
			$data_header['field_PRIV_SM'] = $arr_csv[38] ;
			$data_header['field_PRIV_StatutP'] = $arr_csv[39] ;
		$data_header['field_STEP_NOT_OT'] = ($data_header['field_PRIV_WM']=='A' && $data_header['field_PRIV_SGP']=='A' && $data_header['field_PRIV_StatW']=='A') ;
		$data_header['field_STEP_FINISHED'] = ($VL06F_forceClosed && $data_header['field_PRIV_WM']=='C' && $data_header['field_PRIV_SGP']=='C' && $data_header['field_PRIV_StatW']=='C' && $data_header['field_PRIV_SGP']=='C' && $data_header['field_PRIV_StatW']=='C') ;
		
		$data_lig = array() ;
		$data_lig['field_LINE_ID'] = $arr_csv[2] ;
		$data_lig['field_BATCH_CODE'] = $arr_csv[3] ;
		$data_lig['field_PROD_ID'] = $arr_csv[4] ;
		$data_lig['field_QTY_PICKING'] = $arr_csv[5] ;
		
		
		// Conditions préalables à l'imporation :
		if( !$data_header['field_PRIV_WM']
		|| !$data_header['field_PRIV_SGP']
		|| !$data_header['field_PRIV_StatW']
		|| !$data_header['field_PRIV_SM']
		|| !$data_header['field_PRIV_StatutP'] ) {
			continue ;
		}
		if( in_array($data_header['field_PRIV_TLvr'],array('ZP','CD')) ) {
			continue ;
		}
		
		if( !$map_pickingID_header[$picking_id] ) {
			$map_pickingID_header[$picking_id] = $data_header ;
		}
		
		if( !$map_pickingID_arrLigs[$picking_id] ) {
			$map_pickingID_arrLigs[$picking_id] = array() ;
		}
		$map_pickingID_arrLigs[$picking_id][] = $data_lig ;
	}
	
	// Stockage en base
	foreach( $map_pickingID_header as $picking_id => $data_header ) {
		// Cache du nb de lignes
		$data_header['field_LINE_COUNT'] = ($map_pickingID_arrLigs[$picking_id] ? count($map_pickingID_arrLigs[$picking_id]) : 0 ) ;
		
		// Insert / update
		$filerecord_id = paracrm_lib_data_insertRecord_file($file_code,0,$data_header) ;
		if( $data_header['field_LINE_COUNT'] > 0 ) {
			foreach( $map_pickingID_arrLigs[$picking_id] as $data_lig ) {
				paracrm_lib_data_insertRecord_file($file_code_line,$filerecord_id,$data_lig) ;
			}
		}
		
		// Mémoire de l'ID interne pour transactions ci-dessous
		$arr_importedFilerecordIds[] = $filerecord_id ;
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
	if( !$VL06F_forceClosed ) {
		// Passage en deleted
		// => tous les records ACTIVE non présents dans le fichier ($arr_importedFilerecordIds)
		
		$arr_activeFilerecordIds = array() ;
		$query = "SELECT filerecord_id FROM view_file_{$file_code} WHERE field_STATUS='ACTIVE'" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$arr_activeFilerecordIds[] = $arr[0] ;
		}
		
		$arr_deletedFilerecordIds = array() ;
		$query = "SELECT filerecord_id FROM view_file_{$file_code} WHERE field_STATUS='DELETED'" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$arr_deletedFilerecordIds[] = $arr[0] ;
		}
		
		$to_deleteIds = array_diff($arr_activeFilerecordIds,$arr_importedFilerecordIds) ;
		foreach( $to_deleteIds as $filerecord_id ) {
			$arr_update = array() ;
			$arr_update['field_STATUS'] = 'DELETED' ;
			$arr_update['field_DATE_CLOSED'] = date('Y-m-d H:i:s') ;
			paracrm_lib_data_updateRecord_file( $file_code, $arr_update, $filerecord_id ) ;
		}
		
		$to_reactivateIds = array_intersect($arr_deletedFilerecordIds,$arr_importedFilerecordIds) ;
		foreach( $to_reactivateIds as $filerecord_id ) {
			$arr_update = array() ;
			$arr_update['field_STATUS'] = 'ACTIVE' ;
			$arr_update['field_DATE_CLOSED'] = '' ;
			paracrm_lib_data_updateRecord_file( $file_code, $arr_update, $filerecord_id ) ;
		}
	}
	if( FALSE ) {
		// Passage en closed
		// => tous les records présents dans le fichier ($arr_importedFilerecordIds)
		foreach( $arr_importedFilerecordIds as $filerecord_id ) {
			$arr_update = array() ;
			$arr_update['field_STATUS'] = 'CLOSED' ;
			$arr_update['field_DATE_CLOSED'] = date('Y-m-d H:i:s') ;
			paracrm_lib_data_updateRecord_file( $file_code, $arr_update, $filerecord_id ) ;
		}
	}
	
	return ;
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
		$lig = mb_convert_encoding($lig, "UTF-8");
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