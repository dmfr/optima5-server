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
	
	$stats_tat_intervals = array() ;
	$query = "SELECT field_INTERVAL_CODE, field_INTERVAL_VALUE FROM view_bible_STATS_TAT_INTERVAL_entry" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$stats_tat_intervals[$arr[0]] = $arr[1] ;
	}
	asort($stats_tat_intervals) ;
	
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
	
		$row = array() ;
		$row['delivery_id'] = $arr['field_DELIVERY_ID'] ;
		$row['type'] = $arr['field_TYPE'] ;
		$row['flow'] = $arr['field_FLOW'] ;
		$row['step_code'] = $arr['field_STEP_CURRENT'] ;
		$row['step_txt'] = $map_stepCode_stepTxt[$arr['field_STEP_CURRENT']] ;
		$row['priority_code'] = $arr['field_PRIORITY'] ;
		$row['shipto_code'] = $arr['field_SHIPTO_CODE'] ;
		$row['shipto_name'] = $arr['field_SHIPTO_NAME'] ;
		$row['obj_steps'] = array() ;
		
		$TAB[$filerecord_id] = $row ;
	}
	
	$query = "SELECT * FROM view_file_FLOW_PICKING_STEP" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$filerecord_parent_id = $arr['filerecord_parent_id'] ;
		$step_code = $arr['field_STEP'] ;
		$date_sql = $arr['field_DATE'] ;
		
		$TAB[$filerecord_parent_id]['obj_steps'][$step_code] = $date_sql ;
	}
	
	$map_prioCode_spentTimesS = array() ;
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
				$this_milestone['ETA_dateSql'] = date('Y-m-d H:i:s',$ETA_timestamp) ;
				
				if( $row['obj_steps'][$step_milestone] ) {
					$ACTUAL_timestamp = strtotime($row['obj_steps'][$step_milestone]) ;
					$this_milestone['ACTUAL_dateSql'] = date('Y-m-d H:i:s',$ACTUAL_timestamp) ;
					$total_spent_time_s += ($ACTUAL_timestamp - $lastStep_timestamp) ;
					if( $ACTUAL_timestamp > $ETA_timestamp ) {
						$this_milestone['color'] = 'red' ;
					} elseif( $ETA_timestamp - $ACTUAL_timestamp < (15*60) ) {
						$this_milestone['color'] = 'orange' ;
					} else {
						$this_milestone['color'] = 'green' ;
					}
				} else {
					$now_timestamp = time() ;
					$this_milestone['pending'] = true ;
					$this_milestone['pendingMonitored'] = true ;
					if( $now_timestamp > $ETA_timestamp ) {
						$this_milestone['color'] = 'red' ;
						$row['calc_lateness'] = $now_timestamp - $ETA_timestamp ;
					} elseif( $ETA_timestamp - $now_timestamp < (15*60) ) {
						$this_milestone['color'] = 'orange' ;
					} else {
						$this_milestone['color'] = 'green' ;
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
		$row['status_closed'] = !$has_pending ;
		unset($row['obj_steps']) ;
		
		if( $row['status_closed'] ) {
			if( !isset($map_prioCode_spentTimesS[$row['priority_code']]) ) {
				$map_prioCode_spentTimesS[$row['priority_code']] = array() ;
			}
			$map_prioCode_spentTimesS[$row['priority_code']][] = $total_spent_time_s ;
			
			// Cache stats
			$arr_ins = array() ;
			$arr_ins['field_STAT_TAT_H'] = $total_spent_time_s / 3600 ;
			asort($stats_tat_intervals) ;
			foreach( $stats_tat_intervals as $interval_code => $interval_value ) {
				if( $arr_ins['field_STAT_TAT_H'] < $interval_value ) {
					$arr_ins['field_STAT_TAT'] = $interval_code ;
					break ;
				}
			}
			$_opDB->update('view_file_FLOW_PICKING',$arr_ins, array('filerecord_id'=>$filerecord_id)) ;
			//paracrm_lib_data_updateRecord_file( 'FLOW_PICKING', $arr_ins, $filerecord_id ) ;
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
	
	
	
	return array(
		'success' => true,
		'data_grid' => array_values($TAB),
		'data_gauges' => $TAB_gauges
	) ;
}
function specDbsEmbralam_mach_getGridData_sort( $row1, $row2 ) {
	if( $row2['status_closed'] != $row1['status_closed'] ){
		return $row1['status_closed'] - $row2['status_closed'] ;
	}
	return $row2['calc_lateness'] - $row1['calc_lateness'] ;
}


function specDbsEmbralam_mach_uploadSource() {
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
	$handle = fopen($_FILES['photo-filename']['tmp_name'],"rb") ;
	while( !feof($handle) )
	{
		$arr_csv = fgetcsv($handle,0,'|') ;
		if( !$arr_csv ) {
			continue ;
		}
		if( $first ) {
			$first = FALSE ;
			continue ;
		}
		
		if( !$arr_csv[0] ) {
			continue ;
		}
		//print_r($arr_csv) ;
		
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
				'field_DATE' => date('Y-m-d H:i:s',$timestamp)
			);
		}
		
		$filerecord_id = paracrm_lib_data_insertRecord_file($file_code,0,$main_row) ;
		
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

	return array('success'=>true) ;
}


?>