<?php

function specDbsPeople_lib_calc_tool_runQuery( $q_id, $where_params=NULL, $for_people_code=NULL ) {
	global $_opDB ;
	
	if( $for_people_code && !is_array($for_people_code) ) {
		$for_people_code = array($for_people_code) ;
	}
	if( $for_people_code ) {
		$for_peopleCode_idx = array() ;
		foreach( $for_people_code as $people_code ) {
			$for_peopleCode_idx[$people_code] = TRUE ;
		}
	}
	
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
		if( $for_people_code && ($field_where['field_linkbible']=='RH_PEOPLE') ) {
			$field_where['condition_bible_entries'] = json_encode($for_people_code) ;
		}
		unset($field_where) ;
	}
	
	$RES = paracrm_queries_process_query($arr_saisie , FALSE ) ;
	// mise en cache de la table de l'annuaire $RES_groupKey_groupDesc
	if( !isset($RES['RES_groupHash_groupKey']) ) {
		//echo "begin...";
		$RES_groupHash_groupKey = array() ;
		foreach( $RES['RES_groupKey_groupDesc'] as $key_id => $group_desc )
		{
			ksort($group_desc) ;
			$group_hash = implode('@@',$group_desc) ;
			$RES_groupHash_groupKey[$group_hash] = $key_id ;
		}
		//echo "end  ".count($RES_groupHash_groupKey)." \n" ;
		$RES['RES_groupHash_groupKey'] = $RES_groupHash_groupKey ;
	}
	
	// Isolation du groupe 'PEOPLE'
	$people_groupId = NULL ;
	$people_groupMap = NULL ;
	foreach( $arr_saisie['fields_group'] as $group_id => $field_group ) {
		if( $field_group['field_type'] == 'link' && $field_group['field_linkbible'] == 'RH_PEOPLE' && $field_group['group_bible_type'] == 'ENTRY' ) {
			$people_groupId = $group_id ;
			break ;
		}
	}
	if( $people_groupId===NULL || !isset($RES['RES_labels'][0]['arr_grid-y'][$people_groupId]) ) {
		return NULL ;
	}
	$people_groupMap = array() ;
	foreach( $RES['RES_labels'][0]['arr_grid-y'][$people_groupId] as $mkey => $dummy ) {
		$people_groupMap[$mkey] = substr($mkey,2) ;
	}
	
	if( count($RES['RES_labels'][0]['arr_grid-x']) == 0 ) {
		$date_isOn = FALSE ;
		$date_groupId = NULL ;
		$date_groupMap = NULL ;
	} elseif( count($RES['RES_labels'][0]['arr_grid-x']) == 1 ) {
		$date_isOn = TRUE ;
		$date_groupId = key($RES['RES_labels'][0]['arr_grid-x']) ;
		if( $arr_saisie['fields_group'][$date_groupId]['field_type'] != 'date' ) {
			return NULL ;
		}
		$date_groupMap = array() ;
		foreach( $RES['RES_labels'][0]['arr_grid-x'][$date_groupId] as $mkey => $dummy ) {
			$date_groupMap[$mkey] = $mkey ;
		}
	} else {
		// More than 2 groups ?
		return NULL ;
	}
	
	
	$selectMap = $RES['RES_titles']['fields_select'] ;
	
	$GRID = array() ;
	foreach( $people_groupMap as $group_id_key => $people_code ) {
		if( $for_peopleCode_idx && !$for_peopleCode_idx[$people_code] ) {
			continue ;
		}
		$ROW = array() ;
		if( $date_isOn ) {
			foreach( $date_groupMap as $date => $dummy ) {
				$groupDesc = array() ;
				$groupDesc[$people_groupId] = $group_id_key ;
				$groupDesc[$date_groupId] = $date ;
				ksort($groupDesc) ;
				$groupHash = implode('@@',$groupDesc) ;
				$key_id = $RES['RES_groupHash_groupKey'][$groupHash] ;
				
				$ROW[$date] = ( ($key_id && $RES['RES_groupKey_selectId_value'][$key_id]) ? reset($RES['RES_groupKey_selectId_value'][$key_id]) : reset($RES['RES_selectId_nullValue']) ) ;
			}
		} else {
			$groupHash = $group_id_key ;
			$key_id = $RES['RES_groupHash_groupKey'][$groupHash] ;
			foreach( $selectMap as $select_id => $select_lib ) {
				$ROW[$select_lib] = ( ($key_id && $RES['RES_groupKey_selectId_value'][$key_id]) ? $RES['RES_groupKey_selectId_value'][$key_id][$select_id] : $RES['RES_selectId_nullValue'][$select_id] ) ;
			}
		}
		
		$GRID[$people_code] = $ROW ;
	}
	
	return $GRID ;
}
function specDbsPeople_lib_calc_tool_filterQuota( $people_calc_attribute ) {
	global $_opDB ;
	$query_view = NULL ;
	switch( $people_calc_attribute ) {
		case 'CP' :
			$query_view = 'view_file_QUOTA_CP' ;
			break ;
		case 'MOD' :
			$query_view = 'view_file_QUOTA_MOD' ;
			break ;
		case 'RTT' :
			$query_view = 'view_file_QUOTA_RTT' ;
			break ;
		case 'RC' :
			$query_view = 'view_file_QUOTA_RC' ;
			break ;
		default :
			return NULL ;
	}
	
	$for_people_code = array() ;
	$query = "SELECT distinct field_PPL_CODE from {$query_view}" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$for_people_code[] = $arr[0] ;
	}
	return $for_people_code ;
}

function specDbsPeople_lib_calc_getRealDays() {
	if( $GLOBALS['cache_specDbsPeople_lib_calc']['realDays'] ) {
		return $GLOBALS['cache_specDbsPeople_lib_calc']['realDays'] ;
	}
	return $GLOBALS['cache_specDbsPeople_lib_calc']['realDays'] = specDbsPeople_tool_getRealDays_forPeople() ;
}


function specDbsPeople_lib_calc_getInterimNC( $date_start, $date_end ) {
	$RES_max = specDbsPeople_lib_calc_tool_runQuery( 'ITM_NC:PlanningMax' ) ;
	$durationMax = 0 ;
	foreach( $RES_max as $people_code => $values_max ) {
		foreach( $values_max as $people_max ) {
			if( $people_max > $durationMax ) {
				$durationMax = $people_max ;
			}
		}
	}
	if( $durationMax >= 1 ) {
		$date_start = date('Y-m-d',strtotime('-'.($durationMax - 1).' days',strtotime($date_start))) ;
	}
	
	// Config + autres requêtes
	$where_params = array() ;
	$where_params['condition_date_gt'] = $date_start ;
	$where_params['condition_date_lt'] = $date_end ;
	$RES_planning = specDbsPeople_lib_calc_tool_runQuery( 'ITM_NC:Planning', $where_params ) ;
	$RES_real = specDbsPeople_lib_calc_tool_runQuery( 'ITM_NC:Real', $where_params ) ;
	
	// Walk planning to dispatch 1day=X to Xdays=1
	foreach( $RES_planning as $people_code => &$RES_planning_ROW ) {
		$balance = 0 ;
		foreach( $RES_planning_ROW as $date_sql => &$nb ) {
			if( $nb > 0 ) {
				$delta = min($nb,1) ;
				
				$balance += ($nb - $delta) ;
				$nb = $delta ;
			} elseif( $balance > 0 ) {
				$delta = min($balance,1) ;
				
				$nb += $delta ;
				$balance -= $delta ;
			}
		}
		unset($nb) ;
		
		// Reliquat !
		while( $balance > 0 ) {
			$delta = min($balance,1) ;
		
			$balance -= $delta ;
			$date_sql = date('Y-m-d',strtotime('+1 day',strtotime($date_sql))) ;
			if( !isset($RES_planning_ROW[$date_sql]) ) {
				$RES_planning_ROW[$date_sql] = 0 ;
			}
			$RES_planning_ROW[$date_sql] += $delta ;
		}
	}
	unset($RES_planning_ROW) ;
	
	$TAB_peopleCode_arrDatesNC = array() ;
	
	foreach( $RES_planning as $people_code => $values_planning ) {
		if( !isset($TAB_peopleCode_arrDatesNC[$people_code]) ) {
			$TAB_peopleCode_arrDatesNC[$people_code] = array() ;
		}
		foreach( $values_planning as $date_sql => $nb ) {
			if( !isset($TAB_peopleCode_arrDatesNC[$people_code][$date_sql]) ) {
				$TAB_peopleCode_arrDatesNC[$people_code][$date_sql] = FALSE ;
			}
			if( $nb > 0 ) {
				$TAB_peopleCode_arrDatesNC[$people_code][$date_sql] = TRUE ;
			}
		}
	}
	foreach( $RES_real as $people_code => $values_real ) {
		if( !isset($TAB_peopleCode_arrDatesNC[$people_code]) ) {
			$TAB_peopleCode_arrDatesNC[$people_code] = array() ;
		}
		foreach( $values_real as $date_sql => $nb ) {
			if( !isset($TAB_peopleCode_arrDatesNC[$people_code][$date_sql]) ) {
				$TAB_peopleCode_arrDatesNC[$people_code][$date_sql] = FALSE ;
			}
			if( $nb > 0 ) {
				$TAB_peopleCode_arrDatesNC[$people_code][$date_sql] = TRUE ;
			}
		}
	}
	
	return $TAB_peopleCode_arrDatesNC ;
}



function specDbsPeople_lib_calc_getCalcAttributeRecords( $people_calc_attribute, $at_date_sql=NULL, $people_code=NULL ) {
	if( !$people_code ) {
		$people_code = specDbsPeople_lib_calc_tool_filterQuota($people_calc_attribute) ;
	}
	switch( $people_calc_attribute ) {
		case 'CP' :
			return specDbsPeople_lib_calc_getCalcAttributeRecords_CP($at_date_sql,$people_code) ;
		case 'MOD' :
			return specDbsPeople_lib_calc_getCalcAttributeRecords_MOD($at_date_sql,$people_code) ;
		case 'RTT' :
			return specDbsPeople_lib_calc_getCalcAttributeRecords_RTT($at_date_sql,$people_code) ;
		case 'RC' :
			return specDbsPeople_lib_calc_getCalcAttributeRecords_RC($at_date_sql,$people_code) ;
	}
	return array() ;
}
function specDbsPeople_lib_calc_getCalcAttributeRecords_CP( $at_date_sql, $for_people_code=NULL ) {
	paracrm_lib_file_joinPrivate_buildCache('PEOPLEDAY') ;
	$cfg_contracts = specDbsPeople_tool_getContracts() ;
	$cfg_exceptionDays = specDbsPeople_tool_getExceptionDays() ;
	/*
	array(
		'people_calc_attribute' => $people_calc_attribute,
		'calc_date' => date('Y-m-d'),
		'calc_value' => $calc_value
	);
	*/
	if( $at_date_sql != NULL ) {
		$where_params = array() ;
		$where_params['condition_date_lt'] = $at_date_sql ;
	}
	$RES_quota = specDbsPeople_lib_calc_tool_runQuery( 'CP:Quota', $where_params, $for_people_code ) ;
	
	// recherche de la date MIN dans $RES_quota
	$min_date = NULL ;
	foreach( $RES_quota as $people_code => $values_quota ) {
		if( $min_date===NULL ) {
			$min_date = $values_quota['CP:SetDate'] ;
		} elseif( $values_quota['CP:SetDate'] ) {
			$min_date = min($min_date,$values_quota['CP:SetDate']) ;
		}
	}
	
	// Config + autres requêtes
	$RES_realDays = specDbsPeople_lib_calc_getRealDays() ;
	$where_params = array() ;
	$where_params['condition_date_gt'] = $min_date ;
	$RES_realAbs = specDbsPeople_lib_calc_tool_runQuery( 'CP:RealAbs', $where_params, $for_people_code ) ;
	$RES_planning = specDbsPeople_lib_calc_tool_runQuery( 'CP:Planning', $where_params, $for_people_code ) ;
	
	// Walk planning to dispatch 1day=X to Xdays=1
	foreach( $RES_planning as $people_code => &$RES_planning_ROW ) {
		$balance = 0 ;
		foreach( $RES_planning_ROW as $date_sql => &$nb ) {
			if( $nb > 0 ) {
				$delta = min($nb,1) ;
				
				$balance += ($nb - $delta) ;
				$nb = $delta ;
			} elseif( $balance > 0 ) {
				$delta = min($balance,1) ;
				
				$nb += $delta ;
				$balance -= $delta ;
			}
		}
		unset($nb) ;
		
		// Reliquat !
		while( $balance > 0 ) {
			$delta = min($balance,1) ;
		
			$balance -= $delta ;
			$date_sql = date('Y-m-d',strtotime('+1 day',strtotime($date_sql))) ;
			if( !isset($RES_planning_ROW[$date_sql]) ) {
				$RES_planning_ROW[$date_sql] = 0 ;
			}
			$RES_planning_ROW[$date_sql] += $delta ;
		}
	}
	unset($RES_planning_ROW) ;
	
	$TAB_peopleCode_record = array() ;
	
	foreach( $RES_quota as $people_code => $values_quota ) {
		// Fake JOIN on PEOPLEDAY file to retrieve current attributes
		$fake_row = array() ;
		$fake_row['PEOPLEDAY']['field_DATE'] = date('Y-m-d') ;
		$fake_row['PEOPLEDAY']['field_PPL_CODE'] = $people_code ;
		paracrm_lib_file_joinQueryRecord( 'PEOPLEDAY', $fake_row ) ;
		$contract_code = $fake_row['PEOPLEDAY']['field_STD_CONTRACT'] ;
		$contract_row = $cfg_contracts[$contract_code] ;
		
		$val = $values_quota['CP:SetQuota'] ;
		$min_date = date('Y-m-d', strtotime($values_quota['CP:SetDate'])) ;
		if( $at_date_sql != NULL  ) {
			$max_date = $at_date_sql ;
		}
		
		$arr_log = array() ;
		
		$cur_pivot = NULL ;
		foreach( $RES_realAbs[$people_code] as $date_sql => $nb_abs ) {
			if( $date_sql < $min_date ) {
				continue ;
			}
			if( isset($max_date) && $date_sql > $max_date ) {
				continue ;
			}
			
			if( $nb_abs == 0 ) {
				$cur_pivot = NULL ;
				continue ;
			}
			if( $cur_pivot===NULL ) {
				$cur_pivot = $date_sql ;
			}
			
			$arr_log[$cur_pivot]['real'] += $nb_abs ;
			$val -= $nb_abs ;
		}
		$RES_realDays_row = $RES_realDays[$people_code] ;
		foreach( $RES_planning[$people_code] as $date_sql => $nb_abs ) {
			if( $date_sql < $min_date ) {
				continue ;
			}
			if( isset($max_date) && $date_sql > $max_date ) {
				continue ;
			}
			if( $RES_realDays_row[$date_sql] ) {
				continue ;
			}
			$ISO8601_day = date('N',strtotime($date_sql)) ;
			if( !$contract_row['std_dayson'][$ISO8601_day] ) {
				continue ;
			}
			if( $cfg_exceptionDays[$date_sql] ) {
				continue ;
			}
			
			if( $nb_abs == 0 ) {
				$cur_pivot = NULL ;
				continue ;
			}
			if( $cur_pivot===NULL ) {
				$cur_pivot = $date_sql ;
			}
			
			$arr_log[$cur_pivot]['planning'] += $nb_abs ;
			$val -= $nb_abs ;
		}
		
		$rows = array() ;
		$rows[] = array(
			'row_date' => $min_date,
			'row_text' => 'Solde initialisé',
			'row_value' => $values_quota['CP:SetQuota']
		);
		foreach( $arr_log as $pivot_dateSql => $tarr1 ) {
			foreach( $tarr1 as $cat => $nb ) {
				switch( $cat ) {
					case 'planning' :
						$cat = 'CP planifié ('.$nb.' jours)' ;
						break ;
					case 'real' :
						$cat = 'Congé payé : '.$nb.' jours' ;
						break ;
					default :
						$cat = 'Inconnu ?' ;
						break ;
				}
				$rows[] = array(
					'row_date' => $pivot_dateSql,
					'row_text' => $cat,
					'row_value' => round((-1 * $nb),1)
				);
			}
		}
		
		$TAB_peopleCode_record[$people_code] = array(
			'people_calc_attribute' => 'CP',
			'calc_date' => $at_date_sql,
			'calc_value' => round((float)$val,1),
			'calc_unit_txt' => 'day(s)',
			'calc_unit_short' => 'j',
			'rows' => $rows
		);
	}
	
	return $TAB_peopleCode_record ;
}

function specDbsPeople_lib_calc_getCalcAttributeRecords_RTT( $at_date_sql, $for_people_code=NULL ) {
	paracrm_lib_file_joinPrivate_buildCache('PEOPLEDAY') ;
	$cfg_contracts = specDbsPeople_tool_getContracts() ;
	$cfg_exceptionDays = specDbsPeople_tool_getExceptionDays() ;
	/*
	array(
		'people_calc_attribute' => $people_calc_attribute,
		'calc_date' => date('Y-m-d'),
		'calc_value' => $calc_value
	);
	*/
	if( $at_date_sql != NULL ) {
		$where_params = array() ;
		$where_params['condition_date_lt'] = $at_date_sql ;
	}
	$RES_quota = specDbsPeople_lib_calc_tool_runQuery( 'RTT:Quota', $where_params, $for_people_code ) ;
	
	// recherche de la date MIN dans $RES_quota
	$min_date = NULL ;
	foreach( $RES_quota as $people_code => $values_quota ) {
		if( $min_date===NULL ) {
			$min_date = $values_quota['RTT:SetDate'] ;
		} elseif( $values_quota['RTT:SetDate'] ) {
			$min_date = min($min_date,$values_quota['RTT:SetDate']) ;
		}
	}
	
	// Config + autres requêtes
	$RES_realDays = specDbsPeople_lib_calc_getRealDays() ;
	$where_params = array() ;
	$where_params['condition_date_gt'] = $min_date ;
	$RES_realAbs = specDbsPeople_lib_calc_tool_runQuery( 'RTT:RealAbs', $where_params, $for_people_code ) ;
	$RES_planning = specDbsPeople_lib_calc_tool_runQuery( 'RTT:Planning', $where_params, $for_people_code ) ;
	
	// Walk planning to dispatch 1day=X to Xdays=1
	foreach( $RES_planning as $people_code => &$RES_planning_ROW ) {
		$balance = 0 ;
		foreach( $RES_planning_ROW as $date_sql => &$nb ) {
			if( $nb > 0 ) {
				$delta = min($nb,1) ;
				
				$balance += ($nb - $delta) ;
				$nb = $delta ;
			} elseif( $balance > 0 ) {
				$delta = min($balance,1) ;
				
				$nb += $delta ;
				$balance -= $delta ;
			}
		}
		unset($nb) ;
		
		// Reliquat !
		while( $balance > 0 ) {
			$delta = min($balance,1) ;
		
			$balance -= $delta ;
			$date_sql = date('Y-m-d',strtotime('+1 day',strtotime($date_sql))) ;
			if( !isset($RES_planning_ROW[$date_sql]) ) {
				$RES_planning_ROW[$date_sql] = 0 ;
			}
			$RES_planning_ROW[$date_sql] += $delta ;
		}
	}
	unset($RES_planning_ROW) ;
	
	$TAB_peopleCode_record = array() ;
	
	foreach( $RES_quota as $people_code => $values_quota ) {
		// Fake JOIN on PEOPLEDAY file to retrieve current attributes
		$fake_row = array() ;
		$fake_row['PEOPLEDAY']['field_DATE'] = date('Y-m-d') ;
		$fake_row['PEOPLEDAY']['field_PPL_CODE'] = $people_code ;
		paracrm_lib_file_joinQueryRecord( 'PEOPLEDAY', $fake_row ) ;
		$contract_code = $fake_row['PEOPLEDAY']['field_STD_CONTRACT'] ;
		$contract_row = $cfg_contracts[$contract_code] ;
		
		$val = $values_quota['RTT:SetQuota'] ;
		$min_date = date('Y-m-d', strtotime($values_quota['RTT:SetDate'])) ;
		if( $at_date_sql != NULL  ) {
			$max_date = $at_date_sql ;
		}
		
		$arr_log = array() ;
		
		$cur_pivot = NULL ;
		foreach( $RES_realAbs[$people_code] as $date_sql => $nb_abs ) {
			if( $date_sql < $min_date ) {
				continue ;
			}
			if( isset($max_date) && $date_sql > $max_date ) {
				continue ;
			}
			
			if( $nb_abs == 0 ) {
				$cur_pivot = NULL ;
				continue ;
			}
			if( $cur_pivot===NULL ) {
				$cur_pivot = $date_sql ;
			}
			
			$arr_log[$cur_pivot]['real'] += $nb_abs ;
			$val -= $nb_abs ;
		}
		$RES_realDays_row = $RES_realDays[$people_code] ;
		foreach( $RES_planning[$people_code] as $date_sql => $nb_abs ) {
			if( $date_sql < $min_date ) {
				continue ;
			}
			if( isset($max_date) && $date_sql > $max_date ) {
				continue ;
			}
			if( $RES_realDays_row[$date_sql] ) {
				continue ;
			}
			$ISO8601_day = date('N',strtotime($date_sql)) ;
			if( !$contract_row['std_dayson'][$ISO8601_day] ) {
				continue ;
			}
			if( $cfg_exceptionDays[$date_sql] ) {
				continue ;
			}
			
			if( $nb_abs == 0 ) {
				$cur_pivot = NULL ;
				continue ;
			}
			if( $cur_pivot===NULL ) {
				$cur_pivot = $date_sql ;
			}
			
			$arr_log[$cur_pivot]['planning'] += $nb_abs ;
			$val -= $nb_abs ;
		}
		
		$rows = array() ;
		$rows[] = array(
			'row_date' => $min_date,
			'row_text' => 'Solde initialisé',
			'row_value' => $values_quota['RTT:SetQuota']
		);
		foreach( $arr_log as $pivot_dateSql => $tarr1 ) {
			foreach( $tarr1 as $cat => $nb ) {
				switch( $cat ) {
					case 'planning' :
						$cat = 'RTT planifié ('.$nb.' jours)' ;
						break ;
					case 'real' :
						$cat = 'RTT effectué : '.$nb.' jours' ;
						break ;
					default :
						$cat = 'Inconnu ?' ;
						break ;
				}
				$rows[] = array(
					'row_date' => $pivot_dateSql,
					'row_text' => $cat,
					'row_value' => round((-1 * $nb),1)
				);
			}
		}
		
		$TAB_peopleCode_record[$people_code] = array(
			'people_calc_attribute' => 'RTT',
			'calc_date' => $at_date_sql,
			'calc_value' => round((float)$val,1),
			'calc_unit_txt' => 'day(s)',
			'calc_unit_short' => 'j',
			'rows' => $rows
		);
	}
	
	return $TAB_peopleCode_record ;
}

function specDbsPeople_lib_calc_getCalcAttributeRecords_MOD( $at_date_sql, $for_people_code=NULL ) {
	paracrm_lib_file_joinPrivate_buildCache('PEOPLEDAY') ;
	$cfg_contracts = specDbsPeople_tool_getContracts() ;
	$cfg_exceptionDays = specDbsPeople_tool_getExceptionDays() ;
	/*
	array(
		'people_calc_attribute' => $people_calc_attribute,
		'calc_date' => date('Y-m-d'),
		'calc_value' => $calc_value
	);
	*/
	if( $at_date_sql != NULL ) {
		$where_params = array() ;
		$where_params['condition_date_lt'] = $at_date_sql ;
	}
	$RES_quota = specDbsPeople_lib_calc_tool_runQuery( 'MOD:Quota', $where_params, $for_people_code ) ;
	
	// recherche de la date MIN dans $RES_quota
	$min_date = NULL ;
	foreach( $RES_quota as $people_code => $values_quota ) {
		if( $min_date===NULL ) {
			$min_date = $values_quota['MOD:SetDate'] ;
		} elseif( $values_quota['MOD:SetDate'] ) {
			$min_date = min($min_date,$values_quota['MOD:SetDate']) ;
		}
	}
	
	// Config + autres requêtes
	$RES_realDays = specDbsPeople_lib_calc_getRealDays() ;
	$where_params = array() ;
	$where_params['condition_date_gt'] = $min_date ;
	$RES_realRole = specDbsPeople_lib_calc_tool_runQuery( 'MOD:RealRole', $where_params, $for_people_code ) ;
	$RES_realAbs = specDbsPeople_lib_calc_tool_runQuery( 'MOD:RealAbs', $where_params, $for_people_code ) ;
	$RES_minus = specDbsPeople_lib_calc_tool_runQuery( 'MOD:Minus', $where_params, $for_people_code ) ;
	$RES_planning = specDbsPeople_lib_calc_tool_runQuery( 'MOD:Planning', $where_params, $for_people_code ) ;
	
	$RES_realDuration = array() ;
	foreach( $RES_quota as $people_code => $values_quota ) {
		$RES_realDuration[$people_code] = array() ;
	}
	foreach( $RES_realRole as $people_code => $tarr ) {
		foreach( $tarr as $week_sql => $cnt ) {
			if( !isset($RES_realDuration[$people_code][$week_sql]) ) {
				$RES_realDuration[$people_code][$week_sql] = 0 ;
			}
			$RES_realDuration[$people_code][$week_sql] += $cnt ;
		}
	}
	foreach( $RES_realAbs as $people_code => $tarr ) {
		foreach( $tarr as $week_sql => $cnt ) {
			if( !isset($RES_realDuration[$people_code][$week_sql]) ) {
				$RES_realDuration[$people_code][$week_sql] = 0 ;
			}
			$RES_realDuration[$people_code][$week_sql] += $cnt ;
		}
	}
	
	// Walk planning to dispatch 1day=X to Xdays=1
	foreach( $RES_planning as $people_code => &$RES_planning_ROW ) {
		$balance = 0 ;
		foreach( $RES_planning_ROW as $date_sql => &$nb ) {
			if( $nb > 0 ) {
				$delta = min($nb,1) ;
				
				$balance += ($nb - $delta) ;
				$nb = $delta ;
			} elseif( $balance > 0 ) {
				$delta = min($balance,1) ;
				
				$nb += $delta ;
				$balance -= $delta ;
			}
		}
		unset($nb) ;
		
		// Reliquat !
		while( $balance > 0 ) {
			$delta = min($balance,1) ;
		
			$balance -= $delta ;
			$date_sql = date('Y-m-d',strtotime('+1 day',strtotime($date_sql))) ;
			if( !isset($RES_planning_ROW[$date_sql]) ) {
				$RES_planning_ROW[$date_sql] = 0 ;
			}
			$RES_planning_ROW[$date_sql] += $delta ;
		}
	}
	unset($RES_planning_ROW) ;
	
	$TAB_peopleCode_record = array() ;
	
	foreach( $RES_quota as $people_code => $values_quota ) {
		$val = $values_quota['MOD:SetQuota'] ;
		$min_date = date('Y-m-d', strtotime($values_quota['MOD:SetDate'])) ;
		$min_week = date('o-W', strtotime($values_quota['MOD:SetDate'])) ;
		if( $at_date_sql != NULL ) {
			$max_date = $at_date_sql ;
			
			// Update 2015-02 : on gagne du crédit en -FIN- de semaine
			// 	donc max_week = semaine précédente
			$max_week = date('o-W', strtotime('-7 days',strtotime($at_date_sql))) ;
		}
		
		// Fake JOIN on PEOPLEDAY file to retrieve current attributes
		$fake_row = array() ;
		$fake_row['PEOPLEDAY']['field_DATE'] = date('Y-m-d') ;
		$fake_row['PEOPLEDAY']['field_PPL_CODE'] = $people_code ;
		paracrm_lib_file_joinQueryRecord( 'PEOPLEDAY', $fake_row ) ;
		$contract_code = $fake_row['PEOPLEDAY']['field_STD_CONTRACT'] ;
		$contract_row = $cfg_contracts[$contract_code] ;
		
		
		$arr_log = array() ;
		
		// Inclusion forcée des jours fériés
		foreach( $cfg_exceptionDays as $date_sql => $torf ) {
			if( !$torf ) {
				continue ;
			}
			if( !$RES_realDays[$people_code][$date_sql] ) {
				continue ;
			}
			$week_sql = date('o-W',strtotime($date_sql)) ;
			$ISO8601_day = date('N',strtotime($date_sql)) ;
			if( !$contract_row['std_dayson'][$ISO8601_day] ) {
				continue ;
			}
			$RES_realDuration[$people_code][$week_sql] += $contract_row['std_daylength'] ;
		}
		foreach( $RES_realDuration[$people_code] as $week_sql => $nb_heures_work ) {
			if( $week_sql < $min_week ) {
				continue ;
			}
			if( isset($max_week) && $week_sql > $max_week ) {
				continue ;
			}
			
			$nb_heures_work = min($nb_heures_work,$contract_row['mod_week_max']+$RES_realAbs[$people_code][$week_sql]) ;
			if( $contract_row['mod_week_std'] <= 0 || $nb_heures_work < $contract_row['mod_week_std'] ) {
				$nb_heures = 0 ;
			} else {
				$nb_heures = $nb_heures_work - $contract_row['mod_week_std'] ;
			}
			
			if( $nb_heures == 0 ) {
				continue ;
			}
			
			$arr_log[$week_sql]['plus'] += $nb_heures ;
			$val += $nb_heures ;
		}
		
		foreach( $RES_minus[$people_code] as $date_sql => $nb_heures ) {
			if( $date_sql < $min_date ) {
				continue ;
			}
			if( isset($max_date) && $date_sql > $max_date ) {
				continue ;
			}
			
			if( $nb_heures == 0 ) {
				continue ;
			}
			
			$week_sql = date('o-W', strtotime($date_sql)) ;
			$arr_log[$week_sql]['minus'] -= $nb_heures ;
			$val -= $nb_heures ;
		}
		$RES_realDays_row = $RES_realDays[$people_code] ;
		foreach( $RES_planning[$people_code] as $date_sql => $nb_abs ) {
			if( $date_sql < $min_date ) {
				continue ;
			}
			if( isset($max_date) && $date_sql > $max_date ) {
				continue ;
			}
			
			if( $RES_realDays_row[$date_sql] ) {
				continue ;
			}
			$ISO8601_day = date('N',strtotime($date_sql)) ;
			if( !$contract_row['std_dayson'][$ISO8601_day] ) {
				continue ;
			}
			if( $cfg_exceptionDays[$date_sql] ) {
				continue ;
			}
			
			if( $nb_abs == 0 ) {
				continue ;
			}
			$week_sql = date('o-W', strtotime($date_sql)) ;
			$arr_log[$week_sql]['planning'] -= ($nb_abs * $contract_row['std_daylength']) ;
			$val -= ($nb_abs * $contract_row['std_daylength']) ;
		}
		
		$rows = array() ;
		$rows[] = array(
			'row_date' => $min_date,
			'row_text' => 'Solde initialisé',
			'row_value' => $values_quota['MOD:SetQuota']
		);
		foreach( $arr_log as $pivot_dateSql => $tarr1 ) {
			$ttmp = explode('-',$pivot_dateSql) ;
			$pivot_dateSql_week = $ttmp[0].'W'.$ttmp[1] ;
			$pivot_dateSql_timestampMonday = strtotime($pivot_dateSql_week) ;
			$pivot_dateSql_timestampSunday = strtotime('+6 days',$pivot_dateSql_timestampMonday) ;
			$pivot_dateSql_dateSunday = date('Y-m-d',$pivot_dateSql_timestampSunday) ;
			foreach( $tarr1 as $cat => $nb ) {
				switch( $cat ) {
					case 'plus' :
						$cat = 'Gain modulation' ;
						break ;
					case 'minus' :
						$cat = 'MOD récupéré' ;
						break ;
					case 'planning' :
						$cat = 'MOD prévu' ;
						break ;
					default :
						$cat = 'Inconnu ?' ;
						break ;
				}
				$rows[] = array(
					'row_date' => $pivot_dateSql_dateSunday,
					'row_text' => $cat,
					'row_value' => round($nb,1)
				);
			}
		}
		
		$TAB_peopleCode_record[$people_code] = array(
			'people_calc_attribute' => 'MOD',
			'calc_date' => $at_date_sql,
			'calc_value' => round((float)$val,1),
			'calc_unit_txt' => 'hour(s)',
			'calc_unit_short' => 'h',
			'rows' => $rows
		);
	}
	
	return $TAB_peopleCode_record ;
}

function specDbsPeople_lib_calc_getCalcAttributeRecords_RC( $at_date_sql, $for_people_code=NULL ) {
	paracrm_lib_file_joinPrivate_buildCache('PEOPLEDAY') ;
	$cfg_contracts = specDbsPeople_tool_getContracts() ;
	$cfg_exceptionDays = specDbsPeople_tool_getExceptionDays() ;
	/*
	array(
		'people_calc_attribute' => $people_calc_attribute,
		'calc_date' => date('Y-m-d'),
		'calc_value' => $calc_value
	);
	*/
	if( $at_date_sql != NULL ) {
		$where_params = array() ;
		$where_params['condition_date_lt'] = $at_date_sql ;
	}
	$RES_quota = specDbsPeople_lib_calc_tool_runQuery( 'RC:Quota', $where_params, $for_people_code ) ;
	
	// recherche de la date MIN dans $RES_quota
	$min_date = NULL ;
	foreach( $RES_quota as $people_code => $values_quota ) {
		if( $min_date===NULL ) {
			$min_date = $values_quota['RC:SetDate'] ;
		} elseif( $values_quota['RC:SetDate'] ) {
			$min_date = min($min_date,$values_quota['RC:SetDate']) ;
		}
	}
	
	// Config + autres requêtes
	$RES_realDays = specDbsPeople_lib_calc_getRealDays() ;
	$where_params = array() ;
	$where_params['condition_date_gt'] = $min_date ;
	$RES_realDurationByDay = specDbsPeople_lib_calc_tool_runQuery( 'RC:RealDurationByDay', $where_params, $for_people_code ) ;
	$RES_realDurationByMonth = specDbsPeople_lib_calc_tool_runQuery( 'RC:RealDurationByMonth', $where_params, $for_people_code ) ;
	$RES_realDurationByWeek = specDbsPeople_lib_calc_tool_runQuery( 'RC:RealDurationByWeek', $where_params, $for_people_code ) ;
	$RES_minus = specDbsPeople_lib_calc_tool_runQuery( 'RC:Minus', $where_params, $for_people_code ) ;
	$RES_planning = specDbsPeople_lib_calc_tool_runQuery( 'RC:Planning', $where_params, $for_people_code ) ;
	
	// Walk planning to dispatch 1day=X to Xdays=1
	foreach( $RES_planning as $people_code => &$RES_planning_ROW ) {
		$balance = 0 ;
		foreach( $RES_planning_ROW as $date_sql => &$nb ) {
			if( $nb > 0 ) {
				$delta = min($nb,1) ;
				
				$balance += ($nb - $delta) ;
				$nb = $delta ;
			} elseif( $balance > 0 ) {
				$delta = min($balance,1) ;
				
				$nb += $delta ;
				$balance -= $delta ;
			}
		}
		unset($nb) ;
		
		// Reliquat !
		while( $balance > 0 ) {
			$delta = min($balance,1) ;
		
			$balance -= $delta ;
			$date_sql = date('Y-m-d',strtotime('+1 day',strtotime($date_sql))) ;
			if( !isset($RES_planning_ROW[$date_sql]) ) {
				$RES_planning_ROW[$date_sql] = 0 ;
			}
			$RES_planning_ROW[$date_sql] += $delta ;
		}
	}
	unset($RES_planning_ROW) ;
	
	$TAB_peopleCode_record = array() ;
	
	foreach( $RES_quota as $people_code => $values_quota ) {
		$val = $values_quota['RC:SetQuota'] ;
		$min_date = date('Y-m-d', strtotime($values_quota['RC:SetDate'])) ;
		$min_week = date('o-W', strtotime($values_quota['RC:SetDate'])) ;
		if( $at_date_sql != NULL ) {
			$max_date = $at_date_sql ;
			
			// Update 2015-02 : on gagne du crédit en -FIN- de semaine
			// 	donc max_week = semaine précédente
			$max_week = date('o-W', strtotime('-7 days',strtotime($at_date_sql))) ;
		}
		
		// Fake JOIN on PEOPLEDAY file to retrieve current attributes
		$fake_row = array() ;
		$fake_row['PEOPLEDAY']['field_DATE'] = date('Y-m-d') ;
		$fake_row['PEOPLEDAY']['field_PPL_CODE'] = $people_code ;
		paracrm_lib_file_joinQueryRecord( 'PEOPLEDAY', $fake_row ) ;
		$contract_code = $fake_row['PEOPLEDAY']['field_STD_CONTRACT'] ;
		$contract_row = $cfg_contracts[$contract_code] ;
		
		
		$arr_log = array() ;
		
		// Inclusion forcée des jours fériés
		foreach( $cfg_exceptionDays as $date_sql => $torf ) {
			if( !$torf ) {
				continue ;
			}
			if( !$RES_realDays[$people_code][$date_sql] ) {
				continue ;
			}
			$ISO8601_day = date('N',strtotime($date_sql)) ;
			if( !$contract_row['std_dayson'][$ISO8601_day] ) {
				continue ;
			}
			
			if( $RES_realDurationByDay[$people_code][$date_sql] > 0 ) {
				// Update 2016-10 : pas de réinclusion pour les jours féries travaillés (donc payés HSup)
				continue ;
			}
			
			$week_sql = date('o-W',strtotime($date_sql)) ;
			$RES_realDurationByWeek[$people_code][$week_sql] += $contract_row['std_daylength'] ;
			
			$month_sql = date('Y-m',strtotime($date_sql)) ;
			$RES_realDurationByMonth[$people_code][$month_sql] += $contract_row['std_daylength'] ;
		}
		foreach( $RES_realDurationByMonth[$people_code] as $month_sql => $nb_heures_work ) {
			$date_sql_firstDay = $month_sql.'-01' ;
			$nbDaysOfMonth = date('t',strtotime($date_sql_firstDay)) ;
			$date_sql = $month_sql.'-'.$nbDaysOfMonth ;
			if( $date_sql < $min_date ) {
				continue ;
			}
			if( isset($max_date) && $date_sql >= $max_date ) {
				continue ;
			}
			
			if( $contract_row['rc_month_floor'] <= 0 || $nb_heures_work < $contract_row['rc_month_floor'] ) {
				$nb_heures = 0 ;
			} else {
				$nb_heures = $nb_heures_work * $contract_row['rc_ratio'] ;
			}
			
			if( $nb_heures == 0 ) {
				continue ;
			}
			
			$arr_log[$date_sql]['plus'] += $nb_heures ;
			$val += $nb_heures ;
		}
		foreach( $RES_realDurationByWeek[$people_code] as $week_sql => $nb_heures_work ) {
			if( $week_sql < $min_week ) {
				continue ;
			}
			if( isset($max_week) && $week_sql > $max_week ) {
				continue ;
			}
			
			if( $contract_row['rc_week_floor'] <= 0 || $nb_heures_work < $contract_row['rc_week_floor'] ) {
				$nb_heures = 0 ;
			} else {
				$nb_heures = ($nb_heures_work-$contract_row['rc_week_floor']) * $contract_row['rc_week_ratio_over'] ;
			}
			
			if( $nb_heures == 0 ) {
				continue ;
			}
			
			$ttmp = explode('-',$week_sql) ;
			$date = new DateTime() ;
			$date->setISODate($ttmp[0], $ttmp[1]) ;
			$date_sql = $date->format('Y-m-d') ;
			
			$arr_log[$date_sql]['plus'] += $nb_heures ;
			$val += $nb_heures ;
		}
		
		foreach( $RES_minus[$people_code] as $date_sql => $nb_heures ) {
			if( $date_sql < $min_date ) {
				continue ;
			}
			if( isset($max_date) && $date_sql > $max_date ) {
				continue ;
			}
			
			if( $nb_heures == 0 ) {
				continue ;
			}
			
			$arr_log[$date_sql]['minus'] -= $nb_heures ;
			$val -= $nb_heures ;
		}
		$RES_realDays_row = $RES_realDays[$people_code] ;
		foreach( $RES_planning[$people_code] as $date_sql => $nb_abs ) {
			if( $date_sql < $min_date ) {
				continue ;
			}
			if( isset($max_date) && $date_sql > $max_date ) {
				continue ;
			}
			if( $RES_realDays_row[$date_sql] ) {
				continue ;
			}
			$ISO8601_day = date('N',strtotime($date_sql)) ;
			if( !$contract_row['std_dayson'][$ISO8601_day] ) {
				continue ;
			}
			if( $cfg_exceptionDays[$date_sql] ) {
				continue ;
			}
			
			if( $nb_abs == 0 ) {
				continue ;
			}
			$arr_log[$date_sql]['planning'] -= ($nb_abs * $contract_row['std_daylength']) ;
			$val -= ($nb_abs * $contract_row['std_daylength']) ;
		}
		
		$rows = array() ;
		$rows[] = array(
			'row_date' => $min_date,
			'row_text' => 'Solde initialisé',
			'row_value' => $values_quota['RC:SetQuota']
		);
		foreach( $arr_log as $pivot_dateSql => $tarr1 ) {
			$ttmp = explode('-',$pivot_dateSql) ;
			foreach( $tarr1 as $cat => $nb ) {
				switch( $cat ) {
					case 'plus' :
						$cat = 'Gain RC' ;
						break ;
					case 'minus' :
						$cat = 'RC récupéré' ;
						break ;
					case 'planning' :
						$cat = 'RC prévu' ;
						break ;
					default :
						$cat = 'Inconnu ?' ;
						break ;
				}
				$rows[] = array(
					'row_date' => $pivot_dateSql,
					'row_text' => $cat,
					'row_value' => round($nb,1)
				);
			}
		}
		
		$TAB_peopleCode_record[$people_code] = array(
			'people_calc_attribute' => 'RC',
			'calc_date' => $at_date_sql,
			'calc_value' => round((float)$val,1),
			'calc_unit_txt' => 'hour(s)',
			'calc_unit_short' => 'h',
			'rows' => $rows
		);
	}
	
	return $TAB_peopleCode_record ;
}


?>
