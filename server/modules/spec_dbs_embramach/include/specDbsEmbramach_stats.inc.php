<?php
function specDbsEmbramach_stats_getPicking() {
	global $_opDB ;
	
	$flow_code = 'PICKING' ;
	specDbsEmbramach_stats_sub_prepareData() ;
	
	$params_date = array() ;
	$cur_date = date('Y-m-d') ;
	while( TRUE ) {
		$params_date[] = array(
			'time_key' => 'd_'.date('Ymd',strtotime($cur_date)),
			'time_title' => $cur_date,
			'date_start' => $cur_date,
			'date_end' => $cur_date
		);
		
		$cur_date = date('Y-m-d',strtotime('-1 day',strtotime($cur_date))) ;
		if( $cur_date < date('Y-m-d',strtotime('-7 days')) ) {
			break ;
		}
	}
	
	$params_priority = array() ;
	$query = "SELECT * FROM view_bible_FLOW_PRIO_entry WHERE treenode_key='$flow_code' ORDER BY field_PRIO_ID" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$params_priority[] = array(
			'prio_id' => $arr['field_PRIO_ID'],
			'prio_txt' => $arr['field_PRIO_TXT'],
			'prio_code' => $arr['field_PRIO_CODE'],
			'prio_color' => $arr['field_PRIO_COLOR'],
			'tat_hour' => (float)$arr['field_TAT_HOUR']
		) ;
	}
	
	$params_stats_tat = array() ;
	$query = "SELECT * FROM view_bible_STATS_PICKING_TAT_entry ORDER BY treenode_key, entry_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$params_stats_tat[] = array(
			'prio_id' => $arr['treenode_key'],
			'tat_code' => $arr['field_TAT_CODE'],
			'tat_name' => $arr['field_TAT_NAME'],
			'color' => $arr['field_COLOR']
		) ;
	}
	
	$params_stats_shift = array() ;
	$query = "SELECT * FROM view_bible_STATS_PICKING_SHIFT_entry ORDER BY entry_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$params_stats_shift[] = array(
			'shift_id' => $arr['field_SHIFT_ID'],
			'shift_txt' => $arr['field_SHIFT_TXT']
		) ;
	}
	
	$map_fieldCode_rowKey = array(
		'STATS_SHIFT' => 'shift_id',
		'STATS_TAT' => 'value_TAT',
		'PRIORITY' => 'prio_id'
	);
	
	$data = array() ;
	// Run queries per date intervals
	foreach( $params_date as $date_interval ) {
		$q_id = 'Report::Picking::KPI' ;
		$where_params = array() ;
		$where_params['condition_date_gt'] = $date_interval['date_start'] ;
		$where_params['condition_date_lt'] = $date_interval['date_end'] ;
		
		$TAB = specDbsEmbramach_stats_sub_runQuery($q_id, $where_params) ;
		
		foreach( $TAB as $query_row ) {
			$row = array() ;
			$row['time_key'] = $date_interval['time_key'] ;
			foreach( $map_fieldCode_rowKey as $fieldCode=>$rowKey ) {
				$row[$rowKey] = $query_row['group'][$fieldCode] ;
			}
			$row['value_count'] = reset($query_row['values']) ;
			$data[] = $row ;
		}
	}
	return array(
		'success'=>true,
		'cfg' => array(
			'date' => $params_date,
			'tat' => $params_stats_tat,
			'shift' => $params_stats_shift,
			'priority' => $params_priority
		),
		'data' => $data
	) ;
}




function specDbsEmbramach_stats_sub_runQuery( $q_id, $where_params=NULL ) {
	global $_opDB ;
	
	if( !is_numeric($q_id) ) {
		$query = "SELECT query_id FROM query WHERE query_name LIKE '{$q_id}'";
		$q_id = $_opDB->query_uniqueValue($query) ;
		if( !$q_id ) {
			return NULL ;
		}
	}
	
	$arr_saisie = array() ;
	paracrm_queries_builderTransaction_init( array('query_id'=>$q_id) , $arr_saisie ) ;
	
	foreach( $arr_saisie['fields_where'] as &$field_where ) {
		foreach( $field_where as $mkey => $mvalue ) {
			if( isset($where_params[$mkey]) ) {
				$field_where[$mkey] = $where_params[$mkey] ;
			}
		}
		unset($field_where) ;
	}
	
	$RES = paracrm_queries_process_query($arr_saisie , FALSE ) ;
	//print_r($RES) ;
	
	$map_groupId_lib = array() ;
	foreach( $RES['RES_titles']['group_tagId'] as $groupId => $groupTag ) {
		$ttmp = explode('_field_',$groupTag) ;
		$ttmp = explode('%',$ttmp[1]) ;
		$map_groupId_lib[$groupId] = $ttmp[0] ;
	}
	$map_selectId_lib = array() ;
	foreach( $RES['RES_titles']['fields_select'] as $selectId => $selectLib ) {
		$map_selectId_lib[$selectId] = $selectLib ;
	}
	
	$TAB = array() ;
	foreach( $RES['RES_groupKey_groupDesc'] as $groupKey => $groupDesc ) {
		$group = array() ;
		foreach( $groupDesc as $groupId=>$key ) {
			$group[$map_groupId_lib[$groupId]] = substr($key,2) ; //strip "t_" / "e_"
		}
		$select = array() ;
		foreach( $RES['RES_groupKey_selectId_value'][$groupKey] as $selectId => $value ) {
			$select[$map_selectId_lib[$selectId]] = $value ;
		}
		$TAB[] = array(
			'group' => $group,
			'values' => $select
		) ;
	}
	return $TAB ;
}



function specDbsEmbramach_stats_sub_prepareData() {
	global $_opDB ;
	/*
	 * HACK TMP : Doit être remplacé par une config requête générique
	 */
	
	
	
	/*
	*** PICKING
	*/
	$flow_code = 'PICKING' ;
	
	$stats_tat_intervals = array() ;
	$query = "SELECT treenode_key, field_TAT_CODE, field_TAT_MAXVALUE FROM view_bible_STATS_PICKING_TAT_entry" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$cfg_map_prioId_tatCode_tatValueMax[$arr[0]][$arr[1]] = $arr[2] ;
		foreach( $cfg_map_prioId_tatCode_tatValueMax as $prio_id => &$arr ) {
			asort($arr,SORT_NUMERIC) ;
		}
		unset($arr) ;
	}
	
	$stats_tat_intervals = array() ;
	$query = "SELECT field_SHIFT_ID, field_SHIFT_TXT FROM view_bible_STATS_PICKING_SHIFT_entry" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$cfg_map_shiftId_shiftTxt[$arr[0]] = $arr[1] ;
	}
	asort($cfg_map_shiftId_shiftTxt) ;
	
	
	$map_filerecordId_dateCreate = array() ;
	$query = "SELECT filerecord_parent_id, field_DATE FROM view_file_FLOW_PICKING_STEP WHERE field_STEP='01_CREATE'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$map_filerecordId_dateCreate[$arr[0]] = $arr[1] ;
	}
	
	$query = "SELECT * FROM view_file_FLOW_PICKING" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$filerecord_id = $arr['filerecord_id'] ;
		$prio_id = $arr['field_PRIORITY'] ;
		
		if( $arr['field_STATUS'] == 'DELETED' ) {
			$arr_ins['field_STATS_TAT'] = '' ;
		}
		elseif( isset($cfg_map_prioId_tatCode_tatValueMax[$prio_id]) ) {
			foreach( $cfg_map_prioId_tatCode_tatValueMax[$prio_id] as $tatCode => $tatMaxValue ) {
				if( $arr['field_STAT_TAT_H'] <= $tatMaxValue ) {
					$arr_ins['field_STATS_TAT'] = $tatCode ;
					break ;
				}
			}
		}
		else {
			$arr_ins['field_STATS_TAT'] = '' ;
		}
		
		if( isset($map_filerecordId_dateCreate[$filerecord_id]) ) {
			$date_sql = $map_filerecordId_dateCreate[$filerecord_id] ;
			$hour = (int)substr($date_sql,11,2) ; // "YYYY-MM-DD HH:MM:SS"
			if( $hour >= 7 && $hour < 15 ) {
				$arr_ins['field_STATS_SHIFT'] = 1 ;
			} elseif( $hour >= 15 && $hour < 23 ) {
				$arr_ins['field_STATS_SHIFT'] = 2 ;
			} else {
				$arr_ins['field_STATS_SHIFT'] = 3 ;
			}
		}
		
		$do_update = FALSE ;
		foreach( $arr_ins as $mkey => $mvalue ) {
			if( $mvalue != $arr[$mkey] ) {
				$do_update = TRUE ;
				break ;
			}
		}
		if( $do_update ) {
			$_opDB->update('view_file_FLOW_PICKING',$arr_ins, array('filerecord_id'=>$filerecord_id)) ;
		}
	}
	
	
	
}
?>