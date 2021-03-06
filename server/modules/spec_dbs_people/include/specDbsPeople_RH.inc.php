<?php

function specDbsPeople_RH_getGrid($post_data) {
	global $_opDB ;
	$cfg_contracts = specDbsPeople_tool_getContracts() ;
	
	if( isset($post_data['filter_peopleCode']) ) {
		$filter_peopleCode = $post_data['filter_peopleCode'] ;
	}
	if( isset($post_data['filter_site_entries']) ) {
		$filter_arrSites = json_decode($post_data['filter_site_entries'],true) ;
	}
	if( isset($post_data['filter_team_entries']) ) {
		$filter_arrTeams = json_decode($post_data['filter_team_entries'],true) ;
	}
	if( $post_data['filter_peopleOff'] ) {
		$filter_peopleOff = true ;
	}
	
	if( !$filter_peopleCode ) {
		paracrm_lib_file_joinPrivate_buildCache('PEOPLEDAY') ;
		
		$arr_type_definedPeople = array() ;
		$map_file_field = specDbsPeople_RH_getEventTypesMap() ;
		foreach( $map_file_field as $type => $type_desc ) {
			$arr_type_definedPeople[$type] = array() ;
			
			$view_file = 'view_file_'.$type_desc['file_code'] ;
			$query = "SELECT distinct field_PPL_CODE FROM {$view_file}" ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
				$people_code = $arr[0] ;
				$arr_type_definedPeople[$type][$people_code] = TRUE ;
			}
		}
	}
	
	if( !$filter_peopleCode ) {
		$cacheMap_peopleCode_dateSql_fieldCode = specDbsPeople_Real_lib_getJoinCache(date('Y-m-d'),date('Y-m-d')) ;
	}
	if( $filter_peopleCode ) {
		$cacheMap_peopleCode_dateSql_fieldCode = specDbsPeople_Real_lib_getJoinCache(date('Y-m-d'),date('Y-m-d'),$filter_peopleCode) ;
	}
	if( !$filter_peopleCode && $filter_peopleOff ) {
		$arr_peopleOn = array_keys($cacheMap_peopleCode_dateSql_fieldCode) ;
		$sqlList_peopleOn = $_opDB->makeSQLlist($arr_peopleOn) ;
	}
	
	
	$TAB = array() ;
	$query = "SELECT * FROM view_bible_RH_PEOPLE_tree t, view_bible_RH_PEOPLE_entry e
					WHERE t.treenode_key=e.treenode_key" ;
	if( $filter_peopleCode ) {
		$query.= " AND e.entry_key='{$filter_peopleCode}'" ;
	} elseif( $sqlList_peopleOn ) {
		$query.= " AND e.entry_key IN {$sqlList_peopleOn}" ;
	}
	$query.= " ORDER BY e.field_PPL_FULLNAME" ;
	
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$people_code = $arr['entry_key'] ;
		
		$row = array() ;
		$row['people_code'] = $arr['entry_key'] ;
		$row['people_name'] = $arr['field_PPL_FULLNAME'] ;
		specDbsPeople_lib_peopleFields_populateRow( $row, $arr ) ;
		
		// Fake JOIN on PEOPLEDAY file to retrieve current attributes
		if( $cacheMap_peopleCode_dateSql_fieldCode[$people_code] ) {
			$fake_row = reset($cacheMap_peopleCode_dateSql_fieldCode[$people_code]) ;
			//print_r($fake_row) ;
			$trim_prefix = 'std_' ;
			foreach( $fake_row as $mkey => $mvalue ) {
				if( strpos($mkey,$trim_prefix)===0 ) {
					$mkey = substr($mkey,strlen($trim_prefix)) ;
					$row[$mkey] = ( $mvalue != NULL ? $mvalue : '_' ) ;
				}
			}
		} elseif( !$filter_peopleOff || $filter_peopleCode ) {
			$fake_row = array() ;
			$fake_row['PEOPLEDAY']['field_DATE'] = date('Y-m-d') ;
			$fake_row['PEOPLEDAY']['field_PPL_CODE'] = $arr['entry_key'] ;
			paracrm_lib_file_joinQueryRecord( 'PEOPLEDAY', $fake_row ) ;
			
			$join_map = array() ;
			$join_map['field_STD_CONTRACT'] = 'contract_code' ;
			$join_map['field_STD_WHSE'] = 'whse_code' ;
			$join_map['field_STD_TEAM'] = 'team_code' ;
			$join_map['field_STD_ROLE'] = 'role_code' ;
			foreach( $join_map as $src => $dest ) {
				$val = $fake_row['PEOPLEDAY'][$src] ;
				$row[$dest] = ( $val != NULL ? $val : '_' ) ;
			}
		}
		
		// Next event
		
		// Status:Undefined
		foreach( specDbsPeople_RH_getEventTypesMap() as $type => $dummy ) {
			if( isset($arr_type_definedPeople[$type]) && !$arr_type_definedPeople[$type][$people_code] ) {
				$row['status_undefined'] = TRUE ;
			}
		}
		
		// Status:Out
		if( $row['contract_code'] && !isset($cfg_contracts[$row['contract_code']]) ) {
			$row['status_out'] = TRUE ;
		}
		if( !$row['contract_code'] ) {
			$row['status_out'] = TRUE ;
		}
		
		// All events ?
		if( $post_data['_load_events'] ) {
			$json = specDbsPeople_RH_getPeopleEvents( array('people_code'=>$arr['entry_key']) ) ;
			$row['events'] = $json['data'] ;
		}
		
		// calc attributes placeholder
		$row['calc_attributes'] = array() ;
		$row['_no_calc_attribute'] = TRUE ;
		
		$TAB[$people_code] = $row ;
	}
	
	// Filter ROWS
	$has_filters = FALSE ;
	if( is_array($filter_arrSites) || is_array($filter_arrTeams) ) {
		$has_filters = TRUE ;
	}
	if( $has_filters && !$filter_peopleCode ) {
		$new_TAB = array() ;
		foreach( $TAB as $idx => $row ) {
			if( is_array($filter_arrSites) && !in_array($row['whse_code'],$filter_arrSites) ) {
				continue ;
			}
			if( is_array($filter_arrTeams) && !in_array($row['team_code'],$filter_arrTeams) ) {
				continue ;
			}
			$new_TAB[$idx] = $row ;
		}
		$TAB = $new_TAB ;
	}
	
	// Load calc attributes
	if( $post_data['_load_calcAttributes'] ) {
		$ttmp = specDbsPeople_cfg_getPeopleCalcAttributes() ;
		foreach( $ttmp['data'] as $peopleCalcAttribute_definition ) {
			if( !isset($post_data['_load_calcAttributes_atDateSql']) ) {
				$at_date_sql = NULL ;
			} else {
				$at_date_sql = $post_data['_load_calcAttributes_atDateSql'] ;
			}
			$peopleCalcAttribute = $peopleCalcAttribute_definition['peopleCalcAttribute'] ;
			$peopleCalcAttribute_TAB = specDbsPeople_lib_calc_getCalcAttributeRecords( $peopleCalcAttribute, $at_date_sql ) ;
			foreach( $peopleCalcAttribute_TAB as $people_code => $peopleCalcAttribute_record ) {
				if( isset($TAB[$people_code]) ) {
					$TAB[$people_code]['_no_calc_attribute'] = FALSE ;
					$TAB[$people_code]['calc_attributes'][] = $peopleCalcAttribute_record ;
				}
			}
		}
	}
	
	return array('success'=>true, 'data'=>array_values($TAB)) ;
}

function specDbsPeople_RH_getEventTypesMap() {
	$ttmp = array('ROLE','WHSE','TEAM','ABS','CONTRACT') ;
	
	$map_file_field = array() ;
	foreach( $ttmp as $mkey ) {
		$map_file_field[$mkey] = array(
			'type' => $mkey,
			'file_code' => 'RH_'.$mkey,
			'file_field_code' => 'field_'.$mkey.'_CODE'
		);
	}
	return $map_file_field ;
}
function specDbsPeople_RH_getPeopleEvents($post_data) {
	global $_opDB ;
	$map_file_field = specDbsPeople_RH_getEventTypesMap() ;
	
	$TAB = array() ;
	
	$people_code = $post_data['people_code'] ;
	foreach( $map_file_field as $type => $type_desc ) {
		$view_file = 'view_file_'.$type_desc['file_code'] ;
		$query = "SELECT * FROM {$view_file} WHERE field_PPL_CODE='{$people_code}'" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
			if( $arr['field_TMP_IS_END'] ) {
				continue ;
			}
			
			$TAB[] = array(
				'event_id' => $arr['filerecord_id'],
				'event_type' => $type,
				'x_code' => $arr[$type_desc['file_field_code']],
				'date_start' => date('Y-m-d',strtotime($arr['field_DATE_APPLY'])),
				'date_end' => ( $arr['field_TMP_IS_ON'] ? date('Y-m-d',strtotime($arr['field_TMP_DATE_END'])) : null )
			);
		}
	}
	
	return array('success'=>true, 'data'=>$TAB) ;
}



function specDbsPeople_RH_setPeople( $post_data ) {
	global $_opDB ;
	$map_file_field = specDbsPeople_RH_getEventTypesMap() ;
	
	$event_data = json_decode($post_data['data'],true) ;
	$people_code = ( !$post_data['_is_new'] ? $post_data['people_code'] : preg_replace("/[^A-Z0-9]/", "", strtoupper($event_data['people_name'])) ) ;
	
	$treenode_key = ( (trim($event_data['field_PPL_INTERIM'])==NULL || json_decode($event_data['field_PPL_INTERIM'],true)==NULL) ? 'RH_PEOPLE' : 'RH_INTERIM' ) ;
	
	$arr_ins = array() ;
	$arr_ins['field_PPL_CODE'] = $people_code ;
	$arr_ins['field_PPL_FULLNAME'] = $event_data['people_name'] ;
	foreach( specDbsPeople_lib_peopleFields_getPeopleFields() as $peopleField ) {
		$mkey = $peopleField['field'] ;
		$value = $event_data[$mkey] ;
		if( $peopleField['type'] == 'link' && $peopleField['link_type'] == 'treenode' ) {
			if( $value != '' && !isJsonArr($value) ) {
				$value = json_encode(array($value)) ;
			}
		}
		$arr_ins[$mkey] = $value ;
	}
	if( $post_data['_is_new'] ) {
		$ret = paracrm_lib_data_insertRecord_bibleEntry( 'RH_PEOPLE', $people_code, $treenode_key, $arr_ins ) ;
	} else {
		$ret = paracrm_lib_data_updateRecord_bibleEntry( 'RH_PEOPLE', $people_code, $arr_ins ) ;
		paracrm_lib_data_bibleAssignTreenode( 'RH_PEOPLE', $people_code, $treenode_key ) ;
	}
	if( $ret != 0 ) {
		return array('success'=>false) ;
	}
	
	if( !$post_data['_is_new'] ) {
		// suppr. events
		$existing_events_ids = array() ;
		foreach( $event_data['events'] as $event ) {
			if( $event['event_id'] > 0 ) {
				$existing_events_ids[] = $event['event_id'] ;
			}
		}
	
		$json = specDbsPeople_RH_getPeopleEvents( array('people_code'=>$people_code) ) ;
		foreach( $json['data'] as $event ) {
			$event_id = $event['event_id'] ;
			$event_type = $event['event_type'] ;
			if( !in_array($event_id,$existing_events_ids) ) {
				$file_code = $map_file_field[$event_type]['file_code'] ;
				if( $file_code ) {
					paracrm_lib_data_deleteRecord_file( $file_code, $event_id ) ;
				}
			}
		}
	}
	foreach( $event_data['events'] as $event ) {
		if( $event['event_id'] > 0 ) {
			continue ;
		}
		
		$event_type = $event['event_type'] ;
		$type_desc = $map_file_field[$event_type] ;
		if( !$type_desc ) {
			continue ;
		}
		$file_code = $type_desc['file_code'] ;
		$file_field_code = $type_desc['file_field_code'] ;
		
		$arr_ins = array() ;
		$arr_ins['field_PPL_CODE'] = $people_code ;
		$arr_ins['field_DATE_APPLY'] = $event['date_start'] ;
		$arr_ins[$file_field_code] = $event['x_code'] ;
		$arr_ins['field_TMP_IS_ON'] = ($event['date_end'] != '') ;
		$arr_ins['field_TMP_DATE_END'] = $event['date_end'];
		$arr_ins['field_TMP_IS_END'] = 0 ;
		
		if( $event['event_id'] > 0 ) {
			// paracrm_lib_data_updateRecord_file( $file_code, $arr_ins, $event_id['event_id'] );
		} else {
			paracrm_lib_data_insertRecord_file( $file_code, 0, $arr_ins );
		}
	}
	specDbsPeople_RH_resyncPeopleEvents($people_code) ;
	
	return array('success'=>true, 'people_code'=>$people_code) ;
}

function specDbsPeople_RH_resyncPeopleEvents( $people_code ) {
	global $_opDB ;
	$map_file_field = specDbsPeople_RH_getEventTypesMap() ;
	
	foreach( $map_file_field as $type => $type_desc ) {
		$file_code = $type_desc['file_code'] ;
		$file_field_code = $type_desc['file_field_code'] ;
		
		$to_sync = array() ;
		$to_delete = array() ;
		
		$view_file = 'view_file_'.$type_desc['file_code'] ;
		
		$query = "SELECT * FROM {$view_file} WHERE field_PPL_CODE='{$people_code}' AND field_TMP_IS_ON='1'" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
			$filerecord_id = $arr['filerecord_id'] ;
			if( $arr['field_TMP_IS_END'] == 1 ) {
				$to_delete[$filerecord_id] = TRUE ;
				continue ;
			}
			if( $arr['field_TMP_DATE_END'] < $arr['field_DATE_APPLY'] ) {
				$to_delete[$filerecord_id] = TRUE ;
				continue ;
			}
			$to_sync[$filerecord_id] = array($arr['field_DATE_APPLY'],$arr['field_TMP_DATE_END']) ;
		}
		
		foreach( $to_delete as $filerecord_id => $dummy ) {
			paracrm_lib_data_deleteRecord_file( $file_code, $filerecord_id ) ;
		}
		
		$query = "UPDATE {$view_file}
					SET field_DATE_DURATION=IF(field_TMP_IS_ON='1',DATEDIFF(field_TMP_DATE_END,field_DATE_APPLY)+1,0)
					WHERE field_PPL_CODE='{$people_code}' AND field_TMP_IS_END='0'" ;
		$_opDB->query($query) ;
		
		// Half day
		$query = "UPDATE {$view_file}
					SET field_DATE_DURATION = field_DATE_DURATION / '2'
					WHERE field_PPL_CODE='{$people_code}' AND SUBSTR($file_field_code,-2)=':2'" ;
		$_opDB->query($query) ;
		
		foreach( $to_sync as $filerecord_id => $ttmp ) {
			list($date_start,$date_end) = $ttmp ;
			
			// Fix 2014-06-21 : if an event begins the same day this one ends => no need to set a "tmp-rollback"
			$tmp_date_apply_forEnd = date('Y-m-d',strtotime('+1 day',strtotime($date_end))) ;
			$query_test = "SELECT filerecord_id FROM {$view_file} WHERE field_PPL_CODE='{$people_code}' AND field_DATE_APPLY='{$tmp_date_apply_forEnd}'" ;
			$result_test = $_opDB->query($query_test) ;
			if( $_opDB->num_rows($result_test) == 1 ) {
				continue ;
			}
			
			$query = "SELECT {$file_field_code} FROM {$view_file} 
					WHERE field_PPL_CODE='{$people_code}' AND field_DATE_APPLY<'$date_start'
					AND ( field_TMP_IS_ON='0' OR field_TMP_DATE_END>'$date_end' )
					ORDER BY field_DATE_APPLY DESC LIMIT 1" ;
			$xCode = $_opDB->query_uniqueValue($query) ;
			
			$arr_ins = array() ;
			$arr_ins['field_PPL_CODE'] = $people_code ;
			$arr_ins['field_DATE_APPLY'] = $tmp_date_apply_forEnd ;
			$arr_ins[$file_field_code] = $xCode ;
			$arr_ins['field_TMP_IS_ON'] = 1 ;
			$arr_ins['field_TMP_IS_END'] = 1 ;
			paracrm_lib_data_insertRecord_file( $file_code, 0, $arr_ins );
		}
	}
}





function specDbsPeople_RH_getCalcAttributeSetupFile( $post_data ) {
	global $_opDB ;
	
	$peopleCalcAttribute = $post_data['people_calc_attribute'] ;
	
	$file_code = 'QUOTA_'.$peopleCalcAttribute ;
	$map_dbField_returnField = array(
		'field_PPL_CODE' => 'people_code',
		'field_DATE_APPLY' => 'date_apply',
		'field_QUOTA_'.$peopleCalcAttribute => 'value'
	);
	
	$TAB_db = paracrm_lib_data_getFileRecords($file_code) ;
	$row_db = current($TAB_db) ;
	foreach( $map_dbField_returnField as $dbField => $returnField ) {
		if( !isset($row_db[$dbField]) ) {
			return array('success'=>false) ;
		}
	}
	
	$TAB_return = array() ;
	foreach( $TAB_db as $row_db ) {
		$row = array() ;
		foreach( $map_dbField_returnField as $dbField => $returnField ) {
			switch( $returnField ) {
				case 'value' :
					$value = (float)$row_db[$dbField] ;
					break ;
				case 'date_apply' :
					$value = substr($row_db[$dbField],0,10) ;
					break ;
				default :
					$value = $row_db[$dbField] ;
					break ;
			}
			$row[$returnField] = $value ;
		}
		$TAB_return[] = $row ;
	}
	return array(
		'success' => true,
		'data' => $TAB_return
	) ;
}
function specDbsPeople_RH_setCalcAttributeSetupFile( $post_data ) {
	global $_opDB ;
	
	$peopleCalcAttribute = $post_data['people_calc_attribute'] ;
	
	$file_code = 'QUOTA_'.$peopleCalcAttribute ;
	$map_dbField_returnField = array(
		'field_PPL_CODE' => 'people_code',
		'field_DATE_APPLY' => 'date_apply',
		'field_QUOTA_'.$peopleCalcAttribute => 'value'
	);
	
	foreach( json_decode($post_data['data'],true) as $row ) {
		$arr_ins = array() ;
		foreach( $map_dbField_returnField as $dbField => $returnField ) {
			if( $returnField=='value' && !is_numeric($row[$returnField]) ) {
				$arr_ins['_DELETE'] = TRUE ;
			}
			$arr_ins[$dbField] = $row[$returnField] ;
		}
		paracrm_lib_data_insertRecord_file( $file_code, 0, $arr_ins ) ;
	}

	return array('success'=>true) ;
}

?>
