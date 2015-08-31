<?php
function specDbsEmbralam_mach_getGridCfg( $post_data ) {
	global $_opDB ;
	
	$flow_code = $post_data['flow_code'] ;
	
	$map_priorityId_obj = array() ;
	$query = "SELECT * FROM view_bible_FLOW_PRIO_entry WHERE treenode_key='$flow_code' ORDER BY field_PRIO_ID" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$map_priorityId_obj[$arr['entry_key']] = array(
			'prio_id' => $arr['field_PRIO_ID'],
			'prio_txt' => $arr['field_PRIO_TXT'],
			'prio_code' => $arr['field_PRIO_CODE'],
			'prio_color' => $arr['field_PRIO_COLOR'],
			'tat_hour' => (float)$arr['field_TAT_HOUR']
		) ;
	}
	
	$map_milestoneCode_obj = array() ;
	$query = "SELECT * FROM view_bible_FLOW_MILESTONE_entry WHERE treenode_key='$flow_code' ORDER BY field_MILESTONE_CODE" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$map_milestoneCode_obj[$arr['entry_key']] = array(
			'milestone_code' => $arr['field_MILESTONE_CODE'],
			'milestone_txt' => $arr['field_MILESTONE_TXT'],
			'step_end' => $arr['field_STEP_END'],
			'monitor_is_on' => $arr['field_MONITOR_IS_ON'],
			'monitor_tat_ratio' => (float)$arr['field_MONITOR_TAT_RATIO']
		) ;
	}
	
	
	return array(
		'success'=>true,
		'data' => array(
			'flow_prio' => array_values($map_priorityId_obj),
			'flow_milestone' => array_values($map_milestoneCode_obj)
		)
	) ;
}

function specDbsEmbralam_mach_getGridData( $post_data ) {
	global $_opDB ;
	
	$json_cfg = specDbsEmbralam_mach_getGridCfg( $post_data ) ;
	$json_cfg_prio = array() ;
	foreach( $json_cfg['data']['flow_prio'] as $prio_desc ) {
		$json_cfg_prio[$prio_desc['prio_id']] = $prio_desc ;
	}
	
	$map_stepCode_stepTxt = array() ;
	$query = "SELECT * FROM view_bible_FLOW_STEP_entry" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$map_stepCode_stepTxt[$arr['field_STEP_CODE']] = $arr['field_STEP_TXT'] ;
	}
	
	
	$TAB = array() ;
	
	$query = "SELECT * FROM view_file_FLOW_PICKING ORDER BY filerecord_id DESC" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$filerecord_id = $arr['filerecord_id'] ;
		
		switch( $arr['field_STATUS'] ) {
			case 'ACTIVE' :
				break ;
			case 'CLOSED' :
				if( strtotime($arr['field_DATE_CLOSED']) < time() - (3600*24) ) {
					continue 2 ;
				}
				break ;
			case 'DELETED' :
				continue 2 ;
			default :
				continue 2 ;
		}
	
		$row = array() ;
		$row['_filerecord_id'] = $filerecord_id ;
		$row['delivery_id'] = $arr['field_DELIVERY_ID'] ;
		$row['date_issue'] = $arr['field_DATE_ISSUE'] ;
		$row['date_closed'] = $arr['field_DATE_CLOSED'] ;
		$row['date_toship'] = $arr['field_DATE_TOSHIP'] ;
		$row['type'] = $arr['field_TYPE'] ;
		$row['flow'] = $arr['field_FLOW'] ;
		if( $arr['field_STEP_NOT_OT'] ) {
			$row['step_warning'] = TRUE ;
			$row['step_txt'] = 'Absence OT' ;
			$row['step_code'] = '' ;
		} else {
			$row['step_code'] = $arr['field_STEP_CURRENT'] ;
			$row['step_txt'] = $map_stepCode_stepTxt[$arr['field_STEP_CURRENT']] ;
		}
		$row['priority_code'] = $arr['field_PRIORITY'] ;
		$row['shipto_code'] = $arr['field_SHIPTO_CODE'] ;
		$row['shipto_name'] = $arr['field_SHIPTO_NAME'] ;
		$row['shipto_txt'] = $arr['field_SHIPTO_NAME'].' '.$arr['field_SHIPTO_CODE'] ;
		$row['feedback_txt'] = $arr['field_FEEDBACK_TXT'] ;
		$row['linecount'] = $arr['field_LINE_COUNT'] ;
		$row['status_closed'] = ($arr['field_STATUS'] == 'CLOSED') ;
		$row['obj_steps'] = array() ;
		
		$row['calc_lateness'] = 0 ;
		
		$TAB[$filerecord_id] = $row ;
	}
	
	$query = "SELECT * FROM view_file_FLOW_PICKING_STEP" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$filerecord_parent_id = $arr['filerecord_parent_id'] ;
		$step_code = $arr['field_STEP'] ;
		$date_sql = $arr['field_DATE'] ;
		
		if( !$TAB[$filerecord_parent_id] ) {
			continue ;
		}
		$TAB[$filerecord_parent_id]['obj_steps'][$step_code] = $date_sql ;
	}
	
	$map_prioCode_spentTimesS = array() ;
	$map_prioCode_count = array() ;
	foreach( $TAB as $filerecord_id => &$row ) {
		// priorité : temps de base
		$thisRow_baseTAT_s = ( $json_cfg_prio[$row['priority_code']]['tat_hour'] * 3600 ) ;
		
		// passage en revue de toutes les étapes
		$this_milestones = array() ;
		$first_step = TRUE ;
		$total_allowed_time_s = 0 ;
		$total_spent_time_s = 0 ;
		unset($lastStep_timestamp) ;
		foreach( $json_cfg['data']['flow_milestone'] as $milestone_desc ) {
			$milestone_code = $milestone_desc['milestone_code'] ;
			$this_milestone = array() ;
			$this_milestone['milestone_code'] = $milestone_code ;
			if( $first_step ) {
			
			}
			$step_milestone = $milestone_desc['step_end'] ;
			if( $milestone_desc['monitor_is_on'] ) {
				$total_allowed_time_s += $thisRow_baseTAT_s * $milestone_desc['monitor_tat_ratio'] ;
				
				$available_time_s = $total_allowed_time_s - $total_spent_time_s ;
				$ETA_timestamp = $lastStep_timestamp + $available_time_s ;
				$this_milestone['ETA_timestamp'] = $ETA_timestamp ;
				$this_milestone['ETA_dateSql'] = date('Y-m-d H:i:s',$ETA_timestamp) ;
				
				if( $row['obj_steps'][$step_milestone] ) {
					$ACTUAL_timestamp = strtotime($row['obj_steps'][$step_milestone]) ;
					$this_milestone['ACTUAL_timestamp'] = $ACTUAL_timestamp ;
					$this_milestone['ACTUAL_dateSql'] = date('Y-m-d H:i:s',$ACTUAL_timestamp) ;
					$total_spent_time_s += ($ACTUAL_timestamp - $lastStep_timestamp) ;
					if( $ACTUAL_timestamp > $ETA_timestamp ) {
						$this_milestone['color'] = 'red' ;
					} elseif( $ETA_timestamp - $ACTUAL_timestamp < (15*60) ) {
						$this_milestone['color'] = 'green' ;
					} else {
						$this_milestone['color'] = 'green' ;
					}
				} else {
					$now_timestamp = time() ;
					$this_milestone['pending'] = true ;
					$this_milestone['pendingMonitored'] = true ;
					if( !$lastStep_timestamp ) {
						$this_milestone['ETA_timestamp'] = NULL ;
						$this_milestone['ETA_dateSql'] = '' ;
					} else {
						if( $now_timestamp > $ETA_timestamp ) {
							$this_milestone['color'] = 'red' ;
						} elseif( $ETA_timestamp - $now_timestamp < (15*60) ) {
							$this_milestone['color'] = 'orange' ;
						} else {
							$this_milestone['color'] = 'green' ;
						}
					}
				}
			} else {
				if( $row['obj_steps'][$step_milestone] ) {
					$ACTUAL_timestamp = strtotime($row['obj_steps'][$step_milestone]) ;
					$this_milestone['ACTUAL_dateSql'] = date('Y-m-d H:i:s',$ACTUAL_timestamp) ;
					$this_milestone['color'] = 'green' ;
				} else {
					$this_milestone['pending'] = TRUE ;
				}
			}
			
			if( $this_milestone['pending'] ) {
				$has_previous_pending = FALSE ;
				foreach( $this_milestones as &$previous_milestone ) {
					if( $previous_milestone['pendingMonitored'] ) {
						$has_previous_pending = TRUE ;
					}
				}
				unset($previous_milestone) ;
				if( $has_previous_pending ) {
					continue ;
				}
				if( $this_milestone['pendingMonitored'] && $this_milestone['ETA_timestamp'] ) {
					$now_timestamp = time() ;
					$row['calc_lateness'] = $now_timestamp - $this_milestone['ETA_timestamp'] ;
				}
			}
			
			if( !$this_milestone['pending'] ) {
				// cache du dernier temps pour pivot sur l'etape suivante
				$lastStep_timestamp = strtotime($row['obj_steps'][$step_milestone]) ;
				
				// clear de tous les flags pending 
				foreach( $this_milestones as &$previous_milestone ) {
					$previous_milestone['pending'] = FALSE ;
					$previous_milestone['pendingMonitored'] = FALSE ;
				}
				unset($previous_milestone) ;
			}
			if( $first_step ) {
				$this_milestone['color'] = '' ;
				$first_step = FALSE ;
			}
			$this_milestones[$milestone_code] = $this_milestone ;
		}
		
		$has_pending = FALSE ;
		foreach( $this_milestones as $milestone_code => $this_milestone ) {
			if( $this_milestone['pendingMonitored'] ) {
				$has_pending = TRUE ;
			}
			$mkey = 'milestone_'.$milestone_code ;
			$row[$mkey] = $this_milestone ;
		}
		if( !$has_pending && !$row['status_closed'] ) {
			$row['status_closed'] = !$has_pending ;
			$row['date_closed'] = date('Y-m-d H:i:s') ;
			
			$arr_update = array() ;
			$arr_update['field_STATUS'] = 'CLOSED' ;
			$arr_update['field_DATE_CLOSED'] = date('Y-m-d H:i:s') ;
			paracrm_lib_data_updateRecord_file( 'FLOW_PICKING', $arr_update, $filerecord_id ) ;
		}
		
		unset($row['obj_steps']) ;
		
		if( $row['status_closed'] ) {
			if( !isset($map_prioCode_spentTimesS[$row['priority_code']]) ) {
				$map_prioCode_spentTimesS[$row['priority_code']] = array() ;
			}
			$map_prioCode_spentTimesS[$row['priority_code']][] = $total_spent_time_s ;
			
			// Cache stats
			$arr_ins = array() ;
			$arr_ins['field_STAT_TAT_H'] = $total_spent_time_s / 3600 ;
			$_opDB->update('view_file_FLOW_PICKING',$arr_ins, array('filerecord_id'=>$filerecord_id)) ;
			//paracrm_lib_data_updateRecord_file( 'FLOW_PICKING', $arr_ins, $filerecord_id ) ;
		}
		
		if( !$row['status_closed'] ) {
			if( !isset($map_prioCode_count[$row['priority_code']]) ) {
				$map_prioCode_count[$row['priority_code']] = 0 ;
			}
			$map_prioCode_count[$row['priority_code']]++;
		}
	}
	unset($row) ;
	usort($TAB,'specDbsEmbralam_mach_getGridData_sort') ;
	
	
	$TAB_gauges = array() ;
	foreach( $map_prioCode_spentTimesS as $prio_id => $spentTimesS ) {
		if( !$spentTimesS ) {
			continue ;
		}
		$TAB_gauges[$prio_id] = round( ((array_sum($spentTimesS) / count($spentTimesS)) / 3600), 1 ) ;
	}
	
	
	$query = "SELECT max(field_DATE) FROM view_file_LOG_IMPORT WHERE field_FLOW_CODE='PICKING'" ;
	if( $date_sql = $_opDB->query_uniqueValue($query) ) {
		$maj_date = date('d/m/Y H:i',strtotime($date_sql)) ;
	}
	
	
	return array(
		'success' => true,
		'data_grid' => array_values($TAB),
		'data_gauges' => $TAB_gauges,
		'data_prioCount' => $map_prioCode_count,
		'maj_date' => $maj_date
	) ;
}
function specDbsEmbralam_mach_getGridData_sort( $row1, $row2 ) {
	if( $row1['status_closed'] != $row2['status_closed'] ) {
		return $row1['status_closed'] - $row2['status_closed'] ;
	}
	
	if( $row1['status_closed'] && $row2['status_closed'] ) {
		return strcmp($row2['date_closed'],$row1['date_closed']) ;
	}
	
	if( $row1['priority_code'] != $row2['priority_code'] ) {
		return $row1['priority_code'] - $row2['priority_code'] ;
	}
	return $row2['calc_lateness'] - $row1['calc_lateness'] ;
}

function specDbsEmbralam_mach_saveGridRow( $post_data ) {
	global $_opDB ;
	
	$record = json_decode($post_data['data'],true) ;
	if( !$record['_filerecord_id'] ) {
		return array('success'=>false) ;
	}
	
	$arr_update = array() ;
	$arr_update['field_FEEDBACK_TXT'] = $record['feedback_txt'] ;
	paracrm_lib_data_updateRecord_file( 'FLOW_PICKING', $arr_update, $record['_filerecord_id'] ) ;
	return array('success'=>true) ;
}


function specDbsEmbralam_mach_upload( $post_data ) {
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
	
	$filename = "/var/log/apache2/machUpload_".time().'.txt' ;
	@file_put_contents($filename, $debug) ;
	
	switch( $post_data['file_model'] ) {
		case 'VL06F_active' :
			specDbsEmbralam_mach_upload_VL06F($handle,FALSE) ;
			break ;
		case 'VL06F_closed' :
			specDbsEmbralam_mach_upload_VL06F($handle,TRUE) ;
			break ;
		case 'ZLORSD015' :
			specDbsEmbralam_mach_upload_ZLORSD015($handle) ;
			break ;
		default :
			return array('success'=>false) ;
	}
	fclose($handle) ;
	
	$arr_ins = array() ;
	$arr_ins['field_DATE'] = date('Y-m-d H:i:s') ;
	$arr_ins['field_FLOW_CODE'] = 'PICKING' ;
	$arr_ins['field_FILE_MODEL'] = $post_data['file_model'] ;
	paracrm_lib_data_insertRecord_file('LOG_IMPORT',0,$arr_ins) ;
	
	return array('success'=>true) ;
}
function specDbsEmbralam_mach_upload_ZLORSD015($handle) {
	global $_opDB ;
	//paracrm_define_truncate( array('data_type'=>'file','file_code'=>'FLOW_PICKING') ) ;
	
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
			
			$steps_arrRow[] = array(
				'field_STEP' => $step_code,
				'field_DATE' => date('Y-m-d H:i:s',$timestamp + (5*60*60))
			);
			if( $step_code=='01_CREATE' && date('Y',$timestamp) < 2015 ) {
				continue 2 ;
			}
			if( $step_code=='01_CREATE' ) {
				$_field_DATE_ISSUE = date('Y-m-d H:i:s',$timestamp + (5*60*60)) ;
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
	specDbsEmbralam_mach_getGridData( array('flow_code'=>'PICKING') ) ;

	return ;
}




function specDbsEmbralam_mach_upload_VL06F($handle, $VL06F_forceClosed) {
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
		$data_header['field_FEEDBACK_TXT'] = $arr_csv[40] ;
			// champs non stockés
			$data_header['field_PRIV_WM'] = $arr_csv[19] ;
			$data_header['field_PRIV_SGP'] = $arr_csv[20] ;
			$data_header['field_PRIV_StatW'] = $arr_csv[21] ;
			$data_header['field_PRIV_TLvr'] = $arr_csv[32] ;
			$data_header['field_PRIV_SM'] = $arr_csv[38] ;
			$data_header['field_PRIV_StatutP'] = $arr_csv[39] ;
		$data_header['field_STEP_NOT_OT'] = ($data_header['field_PRIV_WM']=='A' && $data_header['field_PRIV_SGP']=='A' && $data_header['field_PRIV_StatW']=='A') ;
		
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




?>