<?php
include("$server_root/modules/spec_dbs_embramach/include/specDbsEmbramach_stats.inc.php") ;
include("$server_root/modules/spec_dbs_embramach/include/specDbsEmbramach_upload.inc.php") ;


function specDbsEmbramach_cfg_getAuth( $post_data ) {
	global $_opDB ;
	
	if( !isset($_SESSION['login_data']['delegate_sdomainId']) ) {
		return array('success'=>true) ;
	}
	$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() ) ;
	if( $_SESSION['login_data']['delegate_sdomainId'] != $t->dbCurrent_getSdomainId() ) {
		return array('success'=>false) ;
	}
	
	$user_id = $_SESSION['login_data']['delegate_userId'] ;
	$query = "SELECT * FROM view_bible_USER_entry WHERE entry_key='{$user_id}'" ;
	$result = $_opDB->query($query) ;
	if( ($arr = $_opDB->fetch_assoc($result)) == FALSE ) {
		return array('success'=>false) ;
	}
	
	$authPage = array() ;
	$user_class = $arr['treenode_key'] ;
	switch( $user_class ) {
		case 'ALL' :
			$authPage = array('ALL') ;
			break ;
		
		default :
			$authPage = array() ;
			break ;
	}
	
	return array(
		'success' => true,
		'authPage' => $authPage
	) ;
}






function specDbsEmbramach_mach_getGridCfg( $post_data ) {
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
			'fields' => specDbsEmbramach_mach_getGridCfg_lib_getFields($flow_code),
			'flow_prio' => array_values($map_priorityId_obj),
			'flow_milestone' => array_values($map_milestoneCode_obj)
		)
	) ;
}
function specDbsEmbramach_mach_getGridCfg_lib_getFields($flow_code) {
	$arr_fields = NULL ;
	switch( $flow_code ) {
		case 'PICKING' :
			$arr_fields = array() ;
			$arr_fields[] = array(
				'dataIndex' => 'delivery_id',
				'text' => 'Picking',
				'width' => 130,
				'widthBig' => true,
				'filter' => array(
					'type' => 'string'
				),
				'source' => array('field_DELIVERY_ID')
			);
			$arr_fields[] = array(
				'dataIndex' => 'linecount',
				'text' => '# lines',
				'width' => 60,
				'type' => 'number',
				'source' => array('field_LINE_COUNT')
			);
			$arr_fields[] = array(
				'dataIndex' => 'priority_code',
				'text' => 'Priority',
				'width' => 60,
				'widthBig' => true,
				'renderer' => 'priority',
				'filter' => array(
					'type' => 'bible',
					'bible_code' => 'FLOW_PRIO'
				),
				'source' => array('field_PRIORITY')
			);
			$arr_fields[] = array(
				'dataIndex' => 'flow',
				'text' => 'Flow',
				'width' => 70,
				'widthBig' => true,
				'filter' => array(
					'type' => 'stringlist'
				),
				'source' => array('field_FLOW')
			);
			$arr_fields[] = array(
				'dataIndex' => 'shipto_txt',
				'text' => 'Customer',
				'width' => 130,
				'filter' => array(
					'type' => 'stringlist'
				),
				'source' => array('field_SHIPTO_NAME','field_SHIPTO_CODE')
			);
			break ;
			
		case 'INBOUND' :
			$arr_fields = array() ;
			$arr_fields[] = array(
				'text' => 'Doc Ref',
				'width' => 130,
				'widthBig' => true,
				'filter' => array(
					'type' => 'string'
				),
				'source' => array('field_D_DOCREF')
			);
			$arr_fields[] = array(
				'text' => 'Type',
				'width' => 80,
				'widthBig' => true,
				'filter' => array(
					'type' => 'stringlist'
				),
				'source' => array('field_D_TYPE')
			);
			$arr_fields[] = array(
				'text' => 'AWB',
				'width' => 150,
				'filter' => array(
					'type' => 'stringlist'
				),
				'source' => array('field_D_AWB')
			);
			$arr_fields[] = array(
				'text' => 'Carrier',
				'width' => 75,
				'filter' => array(
					'type' => 'stringlist'
				),
				'source' => array('field_D_CARRIER')
			);
			$arr_fields[] = array(
				'text' => 'Ecode',
				'width' => 75,
				'filter' => array(
					'type' => 'stringlist'
				),
				'source' => array('field_D_ECODE')
			);
			$arr_fields[] = array(
				'text' => 'Qty',
				'width' => 50,
				'type' => 'number',
				'source' => array('field_D_QTY')
			);
			break ;
			
		default :
			break ;
	}
	return $arr_fields ;
}

function specDbsEmbramach_mach_getGridData( $post_data ) {
	global $_opDB ;
	
	$flow_code = $post_data['flow_code'] ;
	
	// controle
	$ttmp_FLOW = paracrm_define_getMainToolbar(array('data_type'=>'file','file_code'=>"FLOW_{$flow_code}"),$auth_bypass=TRUE) ;
	$ttmp_FLOW_STEP = paracrm_define_getMainToolbar(array('data_type'=>'file','file_code'=>"FLOW_{$flow_code}_STEP"),$auth_bypass=TRUE) ;
	if( !$ttmp_FLOW['data_files'] || !$ttmp_FLOW_STEP['data_files'] ) {
		return array('success'=>false) ;
	}
	$ttmp_FLOW = reset($ttmp_FLOW['data_files']) ;
	$ttmp_FLOW_STEP = reset($ttmp_FLOW_STEP['data_files']) ;
	
	$flow_text = $flow_code ;
	if( strpos($ttmp_FLOW['file_lib'],'Flow : ')===0 ) {
		$flow_text = substr($ttmp_FLOW['file_lib'],strlen('Flow : ')) ;
	}
	
	
	$json_cfg = specDbsEmbramach_mach_getGridCfg( $post_data ) ;
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
	
	// HACK!!
	if( $filters = json_decode($post_data['filters'],true) ) {
		$_filter1 = $filter2 = array() ;
		$query = "SELECT filerecord_id FROM view_file_FLOW_{$flow_code}
					WHERE field_STATS_TAT='{$filters['tat_code']}' AND field_PRIORITY='{$filters['prio_id']}'" ;
		if( $filters['shift_id'] ) {
			$query.= " AND field_STATS_SHIFT='{$filters['shift_id']}'" ;
		}
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$_filter1[] = $arr[0] ;
		}


		$query = "select filerecord_parent_id FROM view_file_FLOW_{$flow_code}_STEP WHERE field_STEP='01_CREATE' AND DATE(field_DATE) BETWEEN '{$filters['date_start']}' AND '{$filters['date_end']}'";
		$result = $_opDB->query($query) ;
                while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
                        $_filter2[] = $arr[0] ;
                }

		$_filter_filerecordIds = array_intersect($_filter1,$_filter2) ;
	}
	
	
	$TAB = array() ;
	
	$query = "SELECT * FROM view_file_FLOW_{$flow_code}" ;
	if( isset($_filter_filerecordIds) ) {
		if( $_filter_filerecordIds ) {
			$query.= " WHERE filerecord_id IN ".$_opDB->makeSQLlist($_filter_filerecordIds) ;
		} else {
			$query.= " WHERE 0" ;
		}
	}
	$query.= " ORDER BY filerecord_id DESC" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$filerecord_id = $arr['filerecord_id'] ;
		
		switch( $arr['field_STATUS'] ) {
			case 'ACTIVE' :
				break ;
			case 'CLOSED' :
				if( !$_filter_filerecordIds && strtotime($arr['field_DATE_CLOSED']) < time() - (3600*24) ) {
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
		$row['date_closed'] = $arr['field_DATE_CLOSED'] ;
		if( $arr['field_STEP_NOT_OT'] ) {
			$row['step_warning'] = TRUE ;
			$row['step_txt'] = 'Absence OT' ;
			$row['step_code'] = '' ;
		} else {
			$row['step_code'] = $arr['field_STEP_CURRENT'] ;
			$row['step_txt'] = $map_stepCode_stepTxt[$arr['field_STEP_CURRENT']] ;
		}
		$row['priority_code'] = $arr['field_PRIORITY'] ;
		$row['feedback_txt'] = $arr['field_FEEDBACK_TXT'] ;
		$row['status_closed'] = ($arr['field_STATUS'] == 'CLOSED') ;
		$row['obj_steps'] = array() ;
		
		$row['calc_lateness'] = 0 ;
		$row['calc_lateness_blank'] = TRUE ;
		
		foreach( $json_cfg['data']['fields'] as $field_idx => $field_cfg ) {
			$dataIndex = 'field_'.$field_idx ;
			
			$value = array() ;
			foreach( $field_cfg['source'] as $field_src ) {
				$value[] = $arr[$field_src] ;
			}
			
			$row[$dataIndex] = implode(' ',$value) ;
		}
		
		$TAB[$filerecord_id] = $row ;
	}
	
	$query = "SELECT * FROM view_file_FLOW_{$flow_code}_STEP" ;
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
					$total_spent_time_s += max(0,($ACTUAL_timestamp - $lastStep_timestamp)) ;
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
					$row['calc_lateness_blank'] = FALSE ;
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
			paracrm_lib_data_updateRecord_file( "FLOW_{$flow_code}", $arr_update, $filerecord_id ) ;
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
			$_opDB->update("view_file_FLOW_{$flow_code}",$arr_ins, array('filerecord_id'=>$filerecord_id)) ;
			//paracrm_lib_data_updateRecord_file( "FLOW_{$flow_code}", $arr_ins, $filerecord_id ) ;
		}
		
		if( !$row['status_closed'] ) {
			if( !isset($map_prioCode_count[$row['priority_code']]) ) {
				$map_prioCode_count[$row['priority_code']] = 0 ;
			}
			$map_prioCode_count[$row['priority_code']]++;
		}
	}
	unset($row) ;
	usort($TAB,'specDbsEmbramach_mach_getGridData_sort') ;
	
	
	$TAB_gauges = array() ;
	foreach( $map_prioCode_spentTimesS as $prio_id => $spentTimesS ) {
		if( !$spentTimesS ) {
			continue ;
		}
		$TAB_gauges[$prio_id] = round( ((array_sum($spentTimesS) / count($spentTimesS)) / 3600), 1 ) ;
	}
	
	
	$query = "SELECT max(field_DATE) FROM view_file_LOG_IMPORT WHERE field_FLOW_CODE='{$flow_code}'" ;
	if( $date_sql = $_opDB->query_uniqueValue($query) ) {
		$maj_date = date('d/m/Y H:i',strtotime($date_sql)) ;
	}
	
	
	return array(
		'success' => true,
		'data_grid' => array_values($TAB),
		'data_gauges' => $TAB_gauges,
		'data_prioCount' => $map_prioCode_count,
		'maj_date' => $maj_date,
		'flow_text' => $flow_text
	) ;
}
function specDbsEmbramach_mach_getGridData_sort( $row1, $row2 ) {
	if( $row1['status_closed'] != $row2['status_closed'] ) {
		return $row1['status_closed'] - $row2['status_closed'] ;
	}
	
	if( $row1['status_closed'] && $row2['status_closed'] ) {
		return strcmp($row2['date_closed'],$row1['date_closed']) ;
	}
	
	if( $row1['priority_code'] != $row2['priority_code'] ) {
		return $row1['priority_code'] - $row2['priority_code'] ;
	}
	if( $row1['calc_lateness_blank'] != $row2['calc_lateness_blank'] ) {
		return $row1['calc_lateness_blank'] - $row2['calc_lateness_blank'] ;
	}
	return $row2['calc_lateness'] - $row1['calc_lateness'] ;
}

function specDbsEmbramach_mach_saveGridRow( $post_data ) {
	global $_opDB ;
	
	$flow_code = $post_data['flow_code'] ;
	
	$record = json_decode($post_data['data'],true) ;
	if( !$record['_filerecord_id'] ) {
		return array('success'=>false) ;
	}
	
	$arr_update = array() ;
	$arr_update['field_FEEDBACK_TXT'] = $record['feedback_txt'] ;
	paracrm_lib_data_updateRecord_file( "FLOW_{$flow_code}", $arr_update, $record['_filerecord_id'] ) ;
	return array('success'=>true) ;
}




?>