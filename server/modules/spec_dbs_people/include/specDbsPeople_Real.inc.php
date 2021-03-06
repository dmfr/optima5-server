<?php
function specDbsPeople_Real_tool_returnDateValid( $date_sql )
{
	if( $date_sql == '0000-00-00' )
		return NULL ;
	if( $date_sql == '0000-00-00 00:00:00' )
		return NULL ;
	if( !$date_sql )
		return NULL ;
	return $date_sql ;
}


function specDbsPeople_Real_lib_getActivePeople( $date_start, $date_end ) {
	global $_opDB ;
	$cfg_contracts = specDbsPeople_tool_getContracts() ;
	
	$TAB = array() ;
	
	$query_maxdate = "select field_PPL_CODE AS people_code, max(field_DATE_APPLY) AS max_date
		FROM view_file_RH_CONTRACT 
		WHERE DATE(field_DATE_APPLY) <= '{$date_end}' 
		GROUP BY people_code" ;
	
	$query = "SELECT field_PPL_CODE, DATE(field_DATE_APPLY) as field_DATE_APPLY, field_CONTRACT_CODE
		FROM view_file_RH_CONTRACT t
		INNER JOIN ( $query_maxdate ) a ON a.people_code = t.field_PPL_CODE AND a.max_date = t.field_DATE_APPLY
		ORDER BY field_PPL_CODE" ;
	
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$people_code = $arr['field_PPL_CODE'] ;
		
		if( $arr['field_DATE_APPLY'] < $date_start 
			&& !($cfg_contracts[$arr['field_CONTRACT_CODE']]) ) {
			
			$TAB[$people_code] = FALSE ;
			continue ;
		}
		$TAB[$people_code] = TRUE ;
	}
	return $TAB ;
}
function specDbsPeople_Real_lib_getJoinCache( $date_start, $date_end, $filter_peopleCode=NULL ) {
	global $_opDB ;
	$return_peopleCode_dateSql_fieldCode = array() ;
	
	$sql_dates = array() ;
	$cur_date = date('Y-m-d',strtotime($date_start)) ;
	while( strtotime($cur_date) <= strtotime($date_end) ) {
		$sql_dates[] = $cur_date ;
		$cur_date = date('Y-m-d',strtotime('+1 day',strtotime($cur_date))) ;
	}
	
	$queries_list_fieldCode_dbTabField = array(
		'std_contract_code' => array('RH_CONTRACT','field_CONTRACT_CODE'),
		'std_whse_code' => array('RH_WHSE','field_WHSE_CODE'),
		'std_team_code' => array('RH_TEAM','field_TEAM_CODE'),
		'std_role_code' => array('RH_ROLE','field_ROLE_CODE'),
		'std_abs_code' => array('RH_ABS','field_ABS_CODE')
	) ;
	$queriesMap_field_peopleCode_dateSql_value = array() ;
	foreach( $queries_list_fieldCode_dbTabField as $field_code => $ttmp ) {
		$db_tab = $ttmp[0] ;
		$target_field = $ttmp[1] ;
		$view = 'view_file_'.$db_tab ;
	
		$map_peopleCode_dateSql_value = array() ;
		$query = "SELECT field_PPL_CODE, DATE(field_DATE_APPLY), {$target_field} FROM {$view} 
					WHERE DATE(field_DATE_APPLY) BETWEEN '{$date_start}' AND '{$date_end}'" ;
		if($filter_peopleCode) {
			$query.= " AND field_PPL_CODE='{$filter_peopleCode}'" ;
		}
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$map_peopleCode_dateSql_value[$arr[0]][$arr[1]] = $arr[2] ;
		}
		
		$queriesMap_field_peopleCode_dateSql_value[$field_code] = $map_peopleCode_dateSql_value ;
	}
	
	if( !$filter_peopleCode ) {
		$cacheMap_peopleCode_isActive = specDbsPeople_Real_lib_getActivePeople($date_start,$date_end) ;
	} else {
		$cacheMap_peopleCode_isActive[$filter_peopleCode] = TRUE ;
	}
	
	
	/*
	*** 15/11/2019 : DM, optimize joins using SQL joins cf. view_mirror_PEOPLE_DAY *****
	*/
	$_opDB->query("CREATE TEMPORARY TABLE PEOPLEDAY_TMP_JOIN (
		field_DATE DATE,
		field_PPL_CODE VARCHAR(100),
		
		field_STD_CONTRACT VARCHAR(50),
		field_STD_WHSE VARCHAR(50),
		field_STD_TEAM VARCHAR(50),
		field_STD_ROLE VARCHAR(50),
		field_STD_ABS VARCHAR(50)
	)");
	$_opDB->query("ALTER TABLE PEOPLEDAY_TMP_JOIN ADD PRIMARY KEY (field_DATE,field_PPL_CODE)") ;
	
	$arr_insert = array() ;
	foreach( $cacheMap_peopleCode_isActive as $people_code => $is_active ) {
		if( !$is_active ) {
			continue ;
		}
		$arr_insert[] = "('{$date_start}','{$people_code}')" ;
	}
	$query = "INSERT INTO PEOPLEDAY_TMP_JOIN(field_DATE,field_PPL_CODE) VALUES ".implode(',',$arr_insert) ;
	$_opDB->query($query) ;
	
	$mapJoin_field_target = array(
		'field_STD_CONTRACT' => array('view_file_RH_CONTRACT','field_CONTRACT_CODE'),
		'field_STD_WHSE' => array('view_file_RH_WHSE','field_WHSE_CODE'),
		'field_STD_TEAM' => array('view_file_RH_TEAM','field_TEAM_CODE'),
		'field_STD_ROLE' => array('view_file_RH_ROLE','field_ROLE_CODE'),
		'field_STD_ABS' => array('view_file_RH_ABS','field_ABS_CODE')
	) ;
	foreach( $mapJoin_field_target as $field => $target ) {
		$query = "UPDATE PEOPLEDAY_TMP_JOIN p
						SET {$field} = 
						(SELECT {$target[1]}
						FROM  {$target[0]} j 
						WHERE j.field_DATE_APPLY <= p.field_DATE AND j.field_PPL_CODE = p.field_PPL_CODE
						ORDER BY j.field_DATE_APPLY DESC LIMIT 1)" ;
		$_opDB->query($query) ;
	}
	
	$query = "SELECT * FROM PEOPLEDAY_TMP_JOIN" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$people_code = $arr['field_PPL_CODE'] ;
		$date_start = $arr['field_DATE'] ;
		$return_peopleCode_dateSql_fieldCode[$people_code][$date_start] = array(
			'std_contract_code' => $arr['field_STD_CONTRACT'],
			'std_whse_code' => $arr['field_STD_WHSE'],
			'std_team_code' => $arr['field_STD_TEAM'],
			'std_role_code' => $arr['field_STD_ROLE'],
			'std_abs_code' => $arr['field_STD_ABS']
		) ;
	}
	
	$_opDB->query("DROP TABLE PEOPLEDAY_TMP_JOIN") ;
	
	
	
	
	
	foreach( $cacheMap_peopleCode_isActive as $people_code => $is_active ) {
		if( !$is_active || !$return_peopleCode_dateSql_fieldCode[$people_code] ) {
			continue ;
		}
		
		$last_row = $return_peopleCode_dateSql_fieldCode[$people_code][$date_start] ;
		foreach( $sql_dates as $cur_date ) {
			$cur_row = $last_row ;
			foreach( $queries_list_fieldCode_dbTabField as $field_code => $dummy ) {
				if( ($value = $queriesMap_field_peopleCode_dateSql_value[$field_code][$people_code][$cur_date]) !== NULL ) {
					$cur_row[$field_code] = $value ;
				}
			}
			$return_peopleCode_dateSql_fieldCode[$people_code][$cur_date] = $cur_row ;
			$last_row = $cur_row ;
		}
	}
	return $return_peopleCode_dateSql_fieldCode ;
}

function specDbsPeople_Real_getData( $post_data ) {
	global $_opDB ;
	if( isset($post_data['filter_peopleCode']) ) {
		$filter_peopleCode = $post_data['filter_peopleCode'] ;
	}
	if( isset($post_data['filter_site_entries']) ) {
		$filter_arrSites = json_decode($post_data['filter_site_entries'],true) ;
	}
	if( isset($post_data['filter_team_entries']) ) {
		$filter_arrTeams = json_decode($post_data['filter_team_entries'],true) ;
	}
	
	$sql_dates = array() ;
	$cur_date = date('Y-m-d',strtotime($post_data['date_start'])) ;
	while( strtotime($cur_date) <= strtotime($post_data['date_end']) ) {
		$sql_dates[] = $cur_date ;
		$sql_dates_days[] = date('N',strtotime($cur_date)) ;
		$cur_date = date('Y-m-d',strtotime('+1 day',strtotime($cur_date))) ;
	}
	
	
	$buildTAB = array() ;
	$buildTAB[$date_sql][$people_code] ;
	
	
	/*
	 * On STD BIBLE
	 */
	if( !$filter_peopleCode ) {
		paracrm_lib_file_joinPrivate_buildCache('PEOPLEDAY') ;
	}
	$cfg_contracts = specDbsPeople_tool_getContracts() ;
	$cfg_arrDatesException = specDbsPeople_tool_getExceptionDays($sql_dates) ;
	
	$cacheMap_peopleCode_dateSql_fieldCode = specDbsPeople_Real_lib_getJoinCache($post_data['date_start'],$post_data['date_end']) ;
	
	/*
	 * On STD BIBLE
	 */
	$query = "SELECT * FROM view_bible_RH_PEOPLE_tree t, view_bible_RH_PEOPLE_entry e
					WHERE t.treenode_key=e.treenode_key" ;
	if( $people_code ) {
		$query.= " AND e.entry_key='{$people_code}'" ;
	}
	$query.= " ORDER BY e.field_PPL_FULLNAME" ;
	
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$people_code = $arr['entry_key'] ;
		
		if( !$cacheMap_peopleCode_dateSql_fieldCode[$people_code] ) {
			continue ;
		}
		
		reset($sql_dates_days) ;
		foreach( $sql_dates as $cur_date ) {
			$ISO8601_day = current($sql_dates_days) ;
			next($sql_dates_days) ;
			
			$row = array() ;
			$row['status_isVirtual'] = TRUE ;
			$row['date_sql'] = $cur_date ;
			$row['people_code'] = $arr['entry_key'] ;
			$row['people_name'] = $arr['field_PPL_FULLNAME'] ;
			$row['fields'] = array() ;
			specDbsPeople_lib_peopleFields_populateRow( $row['fields'], $arr ) ;
			
			// 2015-12 : join cache
			$row += $cacheMap_peopleCode_dateSql_fieldCode[$people_code][$cur_date] ;
			
			unset($cfg_contract) ;
			if( $contract_code = $row['std_contract_code'] ) {
				$cfg_contract = $cfg_contracts[$contract_code] ;
			}
			if( !$cfg_contract ) {
				continue ;
			}
			
			$row['std_daylength_contract'] = $cfg_contract['std_daylength'] ;
			$row['std_hour_start'] = $cfg_contract['std_hour_start'] ;
			if( !$cfg_contract['std_dayson'][$ISO8601_day] || $cfg_arrDatesException[$cur_date] ) {
				$row['std_daylength_min'] = 0 ;
				$row['std_daylength'] = 0 ;
				$row['std_daylength_max'] = $cfg_contract['std_daylength_max'] ;
			} else {
				$row['std_daylength_min'] = $cfg_contract['std_daylength_min'] ;
				$row['std_daylength'] = $cfg_contract['std_daylength'] ;
				$row['std_daylength_max'] = $cfg_contract['std_daylength_max'] ;
			}
			
			$buildTAB[$cur_date][$people_code] = $row ;
		}
	}
	
	
	$query = "SELECT pd.* , DATE(pd.field_DATE) AS date_DATE FROM view_file_PEOPLEDAY pd 
				WHERE pd.field_DATE BETWEEN '{$post_data['date_start']}' AND '{$post_data['date_end']}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$cur_date = $arr['date_DATE'] ;
		$people_code = $arr['field_PPL_CODE'] ;
		if( !isset($buildTAB[$cur_date][$people_code]) ) {
			continue ;
		}
		
		$buildTAB[$cur_date][$people_code]['status_isVirtual'] = FALSE ;
		$buildTAB[$cur_date][$people_code]['status_isValidCeq'] = $arr['field_VALID_CEQ'] ;
		$buildTAB[$cur_date][$people_code]['status_isValidRh'] = $arr['field_VALID_RH'] ;
		$buildTAB[$cur_date][$people_code]['real_is_abs'] = $arr['field_REAL_IS_ABS'] ;
		$buildTAB[$cur_date][$people_code]['filerecord_id'] = $arr['filerecord_id'] ;
		
		$buildTAB[$cur_date][$people_code]['works'] = array() ;
		$buildTAB[$cur_date][$people_code]['abs'] = array() ;
	}
	
	$query = "SELECT pd.field_PPL_CODE , DATE(pd.field_DATE) AS date_DATE , pdw.*
				FROM view_file_PEOPLEDAY pd , view_file_PEOPLEDAY_WORK pdw
				WHERE pd.filerecord_id = pdw.filerecord_parent_id
				AND pd.field_DATE BETWEEN '{$post_data['date_start']}' AND '{$post_data['date_end']}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$cur_date = $arr['date_DATE'] ;
		$people_code = $arr['field_PPL_CODE'] ;
		if( !isset($buildTAB[$cur_date][$people_code]) ) {
			continue ;
		}
	
		$work = array(
			'filerecord_id' => $arr['filerecord_id'],
			'cli_code' => $arr['field_CLI_CODE'],
			'role_start' => specDbsPeople_Real_tool_returnDateValid($arr['field_ROLE_START']),
			'role_code' => $arr['field_ROLE_CODE'],
			'role_length' => $arr['field_ROLE_LENGTH'],
			'alt_whse_code' => $arr['field_ALT_WHSE_CODE'],
			'status_isValidCeq' => $arr['field_VALID_CEQ']
		) ;
		$buildTAB[$cur_date][$people_code]['works'][] = $work ;
	}
	
	$query = "SELECT pd.field_PPL_CODE , DATE(pd.field_DATE) AS date_DATE , pda.*
				FROM view_file_PEOPLEDAY pd , view_file_PEOPLEDAY_ABS pda
				WHERE pd.filerecord_id = pda.filerecord_parent_id
				AND pd.field_DATE BETWEEN '{$post_data['date_start']}' AND '{$post_data['date_end']}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$cur_date = $arr['date_DATE'] ;
		$people_code = $arr['field_PPL_CODE'] ;
		if( !isset($buildTAB[$cur_date][$people_code]) ) {
			continue ;
		}
	
		$abs = array(
			'filerecord_id' => $arr['filerecord_id'],
			'abs_start' => specDbsPeople_Real_tool_returnDateValid($arr['field_ABS_START']),
			'abs_code' => $arr['field_ABS_CODE'],
			'abs_length' => $arr['field_ABS_LENGTH']
		) ;
		$buildTAB[$cur_date][$people_code]['abs'][] = $abs ;
	}
	
	
	// Build rows
	$TAB_data = array() ;
	$TAB_rows = array() ;
	foreach( $buildTAB as $sql_date => $arr1 ) {
		foreach( $arr1 as $people_code => $peopleday_record ) {
			$peopleday_record['id'] = $people_code.'@'.$sql_date ;
			$TAB_data[] = $peopleday_record ;
			
			$std_rowHash = $peopleday_record['std_whse_code'].'%'.$peopleday_record['std_team_code'].'%'.$peopleday_record['people_code'] ;
			if( !isset($TAB_rows[$std_rowHash]) ) {
				$row = array() ;
				$row['id'] = $std_rowHash ;
				$row['whse_code'] = $peopleday_record['std_whse_code'] ;
				$row['team_code'] = $peopleday_record['std_team_code'] ;
				$row['contract_code'] = $peopleday_record['std_contract_code'] ;
				$row['std_role_code'] = $peopleday_record['std_role_code'] ;
				$copy = array('people_code','people_name') ;
				foreach( $copy as $mkey ) {
					$row[$mkey] = $peopleday_record[$mkey] ;
				}
				foreach( $peopleday_record['fields'] as $mkey=>$mvalue ) {
					$row[$mkey] = $mvalue ;
				}
				$TAB_rows[$std_rowHash] = $row ;
			}
			
			
			$alt_whse_codes = array() ;
			if( $peopleday_record['works'] ) {
				foreach( $peopleday_record['works'] as $work ) {
					if( $work['alt_whse_code'] && !in_array($work['alt_whse_code'],$alt_whse_codes) ) {
						$alt_whse_codes[] = $work['alt_whse_code'] ;
					}
				}
			}
			foreach( $alt_whse_codes as $alt_whse_code ) {
				$std_rowHash = '@'.$alt_whse_code.'%'.$peopleday_record['std_team_code'].'%'.$peopleday_record['people_code'] ;
				if( !isset($TAB_rows[$std_rowHash]) ) {
					$row = array() ;
					$row['id'] = $std_rowHash ;
					$row['whse_code'] = $alt_whse_code ;
					$row['whse_isAlt'] = TRUE ;
					$row['team_code'] = $peopleday_record['std_team_code'] ;
					$row['contract_code'] = $peopleday_record['std_contract_code'] ;
					$row['std_role_code'] = $peopleday_record['std_role_code'] ;
					$copy = array('people_code','people_name') ;
					foreach( $copy as $mkey ) {
						$row[$mkey] = $peopleday_record[$mkey] ;
					}
					foreach( $peopleday_record['fields'] as $mkey=>$mvalue ) {
						$row[$mkey] = $mvalue ;
					}
					$TAB_rows[$std_rowHash] = $row ;
				}
			}
		}
	}
	
	
	// Build columns
	$TAB_columns = array() ;
	$now = strtotime(date('Y-m-d')) ;
	foreach( $buildTAB as $sql_date => $arr1 ) {
		$TAB_columns[$sql_date] = array(
			'enable_open' => false,
			'enable_valid_ceq' => false,
			'enable_valid_rh' => false,
			'status_virtual' => true,
			'status_exceptionDay' => $cfg_arrDatesException[$sql_date],
			'status_alertDue' => false
		);
		foreach( $arr1 as $people_code => $peopleday_record ) {
			if( is_array($filter_arrSites) && !in_array($peopleday_record['std_whse_code'],$filter_arrSites) ) {
				continue ;
			}
			if( is_array($filter_arrTeams) && !in_array($peopleday_record['std_team_code'],$filter_arrTeams) ) {
				continue ;
			}
			
			if( $peopleday_record['status_isVirtual'] ) {
				$TAB_columns[$sql_date]['enable_open'] = TRUE ;
			} else {
				$TAB_columns[$sql_date]['status_virtual'] = FALSE ;
			}
			if( !$peopleday_record['status_isVirtual'] && !$peopleday_record['status_isValidCeq'] ) {
				$TAB_columns[$sql_date]['enable_valid_ceq'] = TRUE ;
			}
			if( !$peopleday_record['status_isVirtual'] && !$peopleday_record['status_isValidRh'] ) {
				$TAB_columns[$sql_date]['enable_valid_rh'] = TRUE ;
			}
		}
		if( (($now - strtotime($sql_date)) / (3600*24)) > 1 && !$TAB_columns[$sql_date]['status_virtual'] ) {
			if( $TAB_columns[$sql_date]['enable_open'] || $TAB_columns[$sql_date]['enable_valid_ceq'] || $TAB_columns[$sql_date]['enable_valid_rh'] ) {
				$TAB_columns[$sql_date]['status_alertDue'] = TRUE ;
			}
		}
		if( ((strtotime($sql_date) - $now) / (3600*24)) > 1 ) {
			// UPDATE 14-08-08 : lock for > 1 day
			$TAB_columns[$sql_date]['status_earlyLocked'] = TRUE ;
		}
		if( $TAB_columns[$sql_date]['enable_open'] ) {
			$TAB_columns[$sql_date]['enable_valid_ceq'] = FALSE ;
			$TAB_columns[$sql_date]['enable_valid_rh'] = FALSE ;
		}
	}
	
	
	// Process filters
	$has_filters = FALSE ;
	if( is_array($filter_arrSites) || is_array($filter_arrTeams) ) {
		$has_filters = TRUE ;
	}
	if( $has_filters ) {
		// Filter ROWS @TODO(maybe): use prefilter on cfgFiles before join
		$new_TAB_rows = array() ;
		foreach( $TAB_rows as $idx => $row ) {
			if( is_array($filter_arrSites) && !in_array($row['whse_code'],$filter_arrSites) ) {
				continue ;
			}
			if( is_array($filter_arrTeams) && !in_array($row['team_code'],$filter_arrTeams) ) {
				continue ;
			}
			$new_TAB_rows[] = $row ;
		}
		$TAB_rows = $new_TAB_rows ;
		
		// TODO Filter DATA/RECORDS, remove orphans (use no-show peopleCode)
		$new_TAB_data = array() ;
		foreach( $TAB_data as $peopleday_record ) {
			$whses = array($peopleday_record['std_whse_code']) ;
			if( $peopleday_record['works'] ) {
				foreach( $peopleday_record['works'] as $work ) {
					if( $work['alt_whse_code'] && !in_array($work['alt_whse_code'],$whses) ) {
						$whses[] = $work['alt_whse_code'] ;
					}
				}
			}
			$teams = array($peopleday_record['std_team_code']) ;
			
			if( is_array($filter_arrSites) && !array_intersect($whses,$filter_arrSites) ) {
				continue ;
			}
			if( is_array($filter_arrTeams) && !array_intersect($teams,$filter_arrTeams) ) {
				continue ;
			}
			
			$new_TAB_data[] = $peopleday_record ;
		}
		$TAB_data = $new_TAB_data ;
	}
	
	
	return array('success'=>true, 'data'=>$TAB_data, 'rows'=>array_values($TAB_rows), 'columns'=>$TAB_columns) ;
}


function specDbsPeople_Real_actionDay( $post_data ) {
	// Decode filters (to enforce)
	if( isset($post_data['filter_site_entries']) ) {
		$filter_arrSites = json_decode($post_data['filter_site_entries'],true) ;
	}
	if( isset($post_data['filter_team_entries']) ) {
		$filter_arrTeams = json_decode($post_data['filter_team_entries'],true) ;
	}
	
	$arr_peopledayRecords = array() ;
	
	// Day condition
	$post_data['date_start'] = $post_data['date_end'] = $post_data['date_sql'] ;
	$json = specDbsPeople_Real_getData( $post_data ) ;
	foreach( $json['data'] as $peopleday_record ) {
		// Enforce whse/team filters, in case of mutation ...
		if( isset($filter_arrSites) && !in_array($peopleday_record['std_whse_code'],$filter_arrSites) ) {
			if( !in_array($post_data['_subaction'],array('valid_ceq','valid_rh')) ) {
				continue ;
			}
		}
		if( isset($filter_arrTeams) && !in_array($peopleday_record['std_team_code'],$filter_arrTeams) ) {
			continue ;
		}
		// ...done
		
		$arr_peopledayRecords[] = $peopleday_record ;
	}
	
	switch( $post_data['_subaction'] ) {
		case 'open' :
			foreach( $arr_peopledayRecords as $peopleday_record ) {
				specDbsPeople_Real_actionDay_lib_open($peopleday_record) ;
			}
			break ;
		
		case 'valid_ceq' :
		case 'valid_rh' :
			$exception_rows = array() ;
			foreach( $arr_peopledayRecords as $peopleday_record ) {
				switch( $post_data['_subaction'] ) {
					case 'valid_ceq' :
						if( $peopleday_record['status_isValidCeq'] ) {
							continue 2 ;
						}
						break ;
					case 'valid_rh' :
						if( $peopleday_record['status_isValidRh'] ) {
							continue 2 ;
						}
						break ;
				}
				$arr_exceptions = specDbsPeople_Real_actionDay_lib_valid_evalRecord($peopleday_record,$filter_arrSites) ;
				$exception_rows = array_merge($exception_rows,$arr_exceptions) ;
			}
			if( !$post_data['_do_valid'] ) {
				return array(
					'success' => true,
					'people_count' => count($arr_peopledayRecords),
					'exception_rows' => $exception_rows
				);
			}
			switch( $post_data['_subaction'] ) {
				case 'valid_ceq' :
					$method = 'specDbsPeople_Real_actionDay_lib_valid_ceq' ;
					$error_key = 'ceq_error' ;
					break ;
				case 'valid_rh' :
					$method = 'specDbsPeople_Real_actionDay_lib_valid_rh' ;
					$error_key = 'rh_error' ;
					break ;
			}
			foreach( $exception_rows as $exception ) {
				if( $exception[$error_key] ) {
					return array('success'=>false) ;
				}
			}
			foreach( $arr_peopledayRecords as $peopleday_record ) {
				call_user_func($method,$peopleday_record,$filter_arrSites) ;
			}
			break ;
			
		case 'reopen' :
			foreach( $arr_peopledayRecords as $peopleday_record ) {
				specDbsPeople_Real_actionDay_lib_reopen($peopleday_record) ;
			}
			break ;
		
		case 'delete' :
			foreach( $arr_peopledayRecords as $peopleday_record ) {
				specDbsPeople_Real_actionDay_lib_delete($peopleday_record) ;
			}
			break ;
		
		default :
			return array('success'=>false) ;
	}
	
	
	return array('success'=>true, 'done'=>true) ;
}
function specDbsPeople_Real_actionDay_lib_open( $peopleday_record ) {
	if( !$GLOBALS['cache_specDbsPeople_Real_cfgLinks'] ) {
		$ttmp = specDbsPeople_cfg_getLinks() ;
		$GLOBALS['cache_specDbsPeople_Real_cfgLinks'] = $ttmp['data'] ;
	}
	
	$sql_date_start = '' ;
	if( $peopleday_record['std_hour_start'] > 0 ) {
		$hh = floor($peopleday_record['std_hour_start']) ;
		if( $hh < 10 ) {
			$hh = '0'.(string)$hh ;
		} else {
			$hh = (string)$hh ;
		}
		$mm = round(($peopleday_record['std_hour_start'] - floor($peopleday_record['std_hour_start'])) * 60) ;
		if( $mm < 10 ) {
			$mm = '0'.(string)$mm ;
		} else {
			$mm = (string)$mm ;
		}
		$sql_date_start = $peopleday_record['date_sql'].' '.$hh.':'.$mm.':'.'00' ;
	}
	
	
	if( !$peopleday_record['status_isVirtual'] ) {
		return TRUE ;
	}
	$arr_ins = array() ;
	$arr_ins['field_DATE'] = $peopleday_record['date_sql'] ;
	$arr_ins['field_PPL_CODE'] = $peopleday_record['people_code'] ;
	$arr_ins['field_STD_DAYLENGTH'] = $peopleday_record['std_daylength'] ;
	$filerecord_id = paracrm_lib_data_insertRecord_file( 'PEOPLEDAY', 0 , $arr_ins ) ;
	
	if( $peopleday_record['std_daylength'] == 0 ) {
		return TRUE ;
	}
	
	if( $peopleday_record['std_abs_code'] != '_' ) {
		$ttmp = explode(':',$peopleday_record['std_abs_code']) ;
		$abs_code = $ttmp[0] ;
		if( $ttmp[1] == '2' ) {
			$abs_halfDay = TRUE ;
			$peopleday_record['std_daylength'] = $peopleday_record['std_daylength'] / 2 ;
		}
	
		$arr_ins = array() ;
		$arr_ins['field_ABS_START'] = $sql_date_start ;
		$arr_ins['field_ABS_CODE'] = $abs_code ;
		$arr_ins['field_ABS_LENGTH'] = $peopleday_record['std_daylength'] ;
		paracrm_lib_data_insertRecord_file( 'PEOPLEDAY_ABS', $filerecord_id , $arr_ins ) ;
		if( !$abs_halfDay ) {
			return TRUE ;
		}
	}
	
	$default_cliCode = '' ;
	if( $mvalue = $GLOBALS['cache_specDbsPeople_Real_cfgLinks']['obj_team_prefCliCode'][$peopleday_record['std_team_code']] ) {
		$default_cliCode = $mvalue ;
	} elseif( count($ttmp = $GLOBALS['cache_specDbsPeople_Real_cfgLinks']['obj_whse_arrCliCodes'][$peopleday_record['std_whse_code']]) == 1 ) {
		$default_cliCode = reset($ttmp) ;
	} else {
		$default_cliCode = $GLOBALS['cache_specDbsPeople_Real_cfgLinks']['obj_whse_defaultCliCode'][$peopleday_record['std_whse_code']] ;
	}
	$arr_ins = array() ;
	$arr_ins['field_CLI_CODE'] = $default_cliCode ;
	$arr_ins['field_ROLE_START'] = $sql_date_start ;
	$arr_ins['field_ROLE_CODE'] = $peopleday_record['std_role_code'] ;
	$arr_ins['field_ROLE_LENGTH'] = $peopleday_record['std_daylength'] ;
	paracrm_lib_data_insertRecord_file( 'PEOPLEDAY_WORK', $filerecord_id , $arr_ins ) ;
	
	return TRUE ;
}
function specDbsPeople_Real_actionDay_lib_valid_evalRecord( $peopleday_record, $filter_arrSites=NULL ) {
	if( !$GLOBALS['cache_specDbsPeople_Real_virtualRoles'] ) {
		global $_opDB ;
		
		$virtualRoles = array() ;
		
		$query = "SELECT field_ROLE_CODE FROM view_bible_CFG_ROLE_entry WHERE field_IS_VIRTUAL='1'" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$virtualRoles[] = $arr[0] ;
		}
		$GLOBALS['cache_specDbsPeople_Real_virtualRoles'] = $virtualRoles ;
	}
	
	if( is_array($filter_arrSites) && !in_array($peopleday_record['std_whse_code'],$filter_arrSites) ) {
		return array() ;
	}
	
	$_cache_virtualRoles = $GLOBALS['cache_specDbsPeople_Real_virtualRoles'] ;
	
	$exceptions = array() ;
	
	$work_length = $abs_length = $altRole_length = $altWhse_length = 0 ;
	$alt_whses = array() ;
	$alt_roles = array() ;
	$alt_abs = array() ;
	$virtual_roles = array() ;
	foreach( $peopleday_record['works'] as $work ) {
		$work_length += $work['role_length'] ;
		if( in_array($work['role_code'],$_cache_virtualRoles) ) {
			if( !in_array($work['role_code'],$virtual_roles) ) {
				$virtual_roles[] = $work['role_code'] ;
			}
		}
		if( $work['role_code'] != $peopleday_record['std_role_code'] ) {
			if( !in_array($work['role_code'],$alt_roles) ) {
				$alt_roles[] = $work['role_code'] ;
			}
			$altRole_length += $work['role_length'] ;
		}
		if( $work['alt_whse_code'] ) {
			if( !in_array($work['alt_whse_code'],$alt_whses) ) {
				$alt_whses[] = $work['alt_whse_code'] ;
			}
			$altWhse_length += $work['role_length'] ;
		}
	}
	foreach( $peopleday_record['abs'] as $abs ) {
		$abs_length += $abs['abs_length'] ;
		if( substr($peopleday_record['std_abs_code'],0,1) == '_' && !in_array($abs['abs_code'],$alt_abs) ) {
			$alt_abs[] = $abs['abs_code'] ;
		}
	}
	
	if( ($abs_length + $work_length) < $peopleday_record['std_daylength_min'] ) {
		$whole = $peopleday_record['real_is_abs'] ;
		$exceptions[] = array(
			'exception_type' => 'duration_less',
			'people_name' => $peopleday_record['people_name'],
			'exception_txt' => ($whole ? 'Anomalie déclarée' : ($peopleday_record['std_daylength_min'] - ($abs_length + $work_length)).' h manquante(s)') ,
			'ceq_show' => true,
			'ceq_error' => !$whole,
			'rh_show' => true,
			'rh_error' => true
		);
	}
	if( ($abs_length + $work_length) > $peopleday_record['std_daylength'] ) {
		$exceptions[] = array(
			'exception_type' => 'duration_more',
			'people_name' => $peopleday_record['people_name'],
			'exception_txt' => (($abs_length + $work_length) - $peopleday_record['std_daylength']).' h surplus' ,
			'ceq_show' => true,
			'ceq_error' => false,
			'rh_show' => true,
			'rh_error' => false
		);
	}
	if( $alt_abs ) {
		$exceptions[] = array(
			'exception_type' => 'abs',
			'people_name' => $peopleday_record['people_name'],
			'exception_txt' => 'Absences : '.$abs_length.' h ( '.implode('+',$alt_abs).')' ,
			'ceq_show' => true,
			'ceq_error' => false,
			'rh_show' => true,
			'rh_error' => false
		);
	}
	if( $alt_whses ) {
		$exceptions[] = array(
			'exception_type' => 'alt_whse',
			'people_name' => $peopleday_record['people_name'],
			'exception_txt' => 'Mutations : '.$altWhse_length.' h ( '.implode('+',$alt_whses).')' ,
			'ceq_show' => true,
			'ceq_error' => false,
			'rh_show' => false,
			'rh_error' => false
		);
	}
	if( $virtual_roles ) {
		$exceptions[] = array(
			'exception_type' => 'virtual_role',
			'people_name' => $peopleday_record['people_name'],
			'exception_txt' => 'Rôles à changer : '.implode('+',$virtual_roles).'' ,
			'ceq_show' => true,
			'ceq_error' => true,
			'rh_show' => false,
			'rh_error' => false
		);
	}
	if( $alt_roles ) {
		$exceptions[] = array(
			'exception_type' => 'alt_role',
			'people_name' => $peopleday_record['people_name'],
			'exception_txt' => 'Rôles : '.$altRole_length.' h ( '.implode('+',$alt_roles).')' ,
			'ceq_show' => false,
			'ceq_error' => false,
			'rh_show' => false,
			'rh_error' => false
		);
	}
	return $exceptions ;
}
function specDbsPeople_Real_actionDay_lib_valid_ceq( $peopleday_record, $filter_arrSites=NULL ) {
	if( $peopleday_record['status_isVirtual'] ) {
		return FALSE ;
	}
	if( $peopleday_record['status_isValidCeq'] ) {
		return TRUE ;
	}
	
	$all_works_valid = TRUE ;
	if( count($peopleday_record['works']) == 0 ) {
		if( is_array($filter_arrSites) && !in_array($peopleday_record['std_whse_code'],$filter_arrSites) ) {
			$all_works_valid = FALSE ;
		}
	}
	foreach( $peopleday_record['works'] as $slice ) {
		if( $slice['status_isValidCeq'] ) {
			continue ;
		}
		if( is_array($filter_arrSites) ) {
			if( $slice['alt_whse_code'] && !in_array($slice['alt_whse_code'],$filter_arrSites) ) {
				$all_works_valid = FALSE ;
				continue ;
			}
			if( !$slice['alt_whse_code'] && !in_array($peopleday_record['std_whse_code'],$filter_arrSites) ) {
				$all_works_valid = FALSE ;
				continue ;
			}
		}
		$arr_update = array() ;
		$arr_update['field_VALID_CEQ'] = 1 ;
		paracrm_lib_data_updateRecord_file( 'PEOPLEDAY_WORK' , $arr_update, $slice['filerecord_id'] ) ;
	}
	if( !$all_works_valid ) {
		return TRUE ;
	}
	
	$arr_update = array() ;
	$arr_update['field_VALID_CEQ'] = 1 ;
	paracrm_lib_data_updateRecord_file( 'PEOPLEDAY' , $arr_update, $peopleday_record['filerecord_id'] ) ;
	
	return TRUE ;
}
function specDbsPeople_Real_actionDay_lib_valid_rh( $peopleday_record, $filter_arrSites=NULL ) {
	if( $peopleday_record['status_isVirtual'] ) {
		return FALSE ;
	}
	if( $peopleday_record['status_isValidRh'] ) {
		return TRUE ;
	}
	if( is_array($filter_arrSites) && !in_array($peopleday_record['std_whse_code'],$filter_arrSites) ) {
		return ;
	}
	
	$total_duration = 0 ;
	foreach( $peopleday_record['works'] as $slice ) {
		$total_duration += $slice['role_length'] ;
	}
	foreach( $peopleday_record['abs'] as $slice ) {
		$total_duration += $slice['abs_length'] ;
	}
	if( $total_duration < $peopleday_record['std_daylength_min'] ) {
		return FALSE ;
	}
	
	$arr_update = array() ;
	$arr_update['field_VALID_CEQ'] = 1 ;
	$arr_update['field_VALID_RH'] = 1 ;
	paracrm_lib_data_updateRecord_file( 'PEOPLEDAY' , $arr_update, $peopleday_record['filerecord_id'] ) ;
	
	return TRUE ;
}
function specDbsPeople_Real_actionDay_lib_reopen( $peopleday_record ) {
	if( $peopleday_record['status_isVirtual'] ) {
		return FALSE ;
	}
	
	$total_duration = 0 ;
	foreach( $peopleday_record['works'] as $slice ) {
		$total_duration += $slice['role_length'] ;
	}
	foreach( $peopleday_record['abs'] as $slice ) {
		$total_duration += $slice['abs_length'] ;
	}
	if( $total_duration < $peopleday_record['std_daylength'] ) {
		return FALSE ;
	}
	
	$arr_update = array() ;
	$arr_update['field_VALID_CEQ'] = 0 ;
	$arr_update['field_VALID_RH'] = 0 ;
	paracrm_lib_data_updateRecord_file( 'PEOPLEDAY' , $arr_update, $peopleday_record['filerecord_id'] ) ;
	
	return TRUE ;
}
function specDbsPeople_Real_actionDay_lib_delete( $peopleday_record ) {
	if( $peopleday_record['status_isVirtual'] ) {
		return TRUE ;
	}
	
	paracrm_lib_data_deleteRecord_file( 'PEOPLEDAY', $peopleday_record['filerecord_id'] ) ;
	return TRUE ;
}

function specDbsPeople_Real_exceptionDaySet( $post_data ) {
	global $_opDB ;
	$date_sql = $post_data['date_sql'] ;
	
	$query_test = "SELECT count(*) FROM view_file_PEOPLEDAY pd WHERE pd.field_DATE='{$date_sql}'" ;
	if( $_opDB->query_uniqueValue($query_test) > 0 ) {
		return array('success'=>false) ;
	}
				
	$arr_ins = array() ;
	$arr_ins['field_DATE_EXCEPTION'] = $date_sql ;
	$arr_ins['field_EXCEPTION_IS_ON'] = $post_data['exception_is_on'] ;
	paracrm_lib_data_insertRecord_file( 'CFG_EXCEPTION_DAY' , 0, $arr_ins ) ;
	return array('success'=>true) ;
}


function specDbsPeople_Real_saveRecord( $post_data ) {
	global $_opDB ;
	$record_data = json_decode($post_data['data'],true) ;
	
	$people_code = $record_data['people_code'] ;
	$date_sql = $record_data['date_sql'] ;
	$query = "SELECT filerecord_id FROM view_file_PEOPLEDAY
				WHERE field_DATE='{$date_sql}' AND field_PPL_CODE='{$people_code}'" ;
	$filerecord_id = $_opDB->query_uniqueValue($query) ;
	if( !$filerecord_id ) {
		return array('success'=>false) ;
	}
	
	$arr_update = array() ;
	$arr_update['field_REAL_IS_ABS'] = $record_data['real_is_abs'] ;
	paracrm_lib_data_updateRecord_file( 'PEOPLEDAY' , $arr_update, $filerecord_id ) ;
	
	foreach( paracrm_lib_data_getFileChildRecords('PEOPLEDAY_WORK',$filerecord_id) as $child_record ) {
		paracrm_lib_data_deleteRecord_file('PEOPLEDAY_WORK',$child_record['filerecord_id']) ;
	}
	foreach( paracrm_lib_data_getFileChildRecords('PEOPLEDAY_ABS',$filerecord_id) as $child_record ) {
		paracrm_lib_data_deleteRecord_file('PEOPLEDAY_ABS',$child_record['filerecord_id']) ;
	}
	
	foreach( $record_data['works'] as $work ) {
		$arr_ins = array() ;
		$arr_ins['field_CLI_CODE'] = $work['cli_code'] ;
		$arr_ins['field_ROLE_START'] = $work['role_start'] ;
		$arr_ins['field_ROLE_CODE'] = $work['role_code'] ;
		$arr_ins['field_ROLE_LENGTH'] = $work['role_length'] ;
		$arr_ins['field_ALT_WHSE_CODE'] = $work['alt_whse_code'] ;
		paracrm_lib_data_insertRecord_file( 'PEOPLEDAY_WORK', $filerecord_id, $arr_ins ) ;
	}
	foreach( $record_data['abs'] as $abs ) {
		$arr_ins = array() ;
		$arr_ins['field_ABS_START'] = $abs['abs_start'] ;
		$arr_ins['field_ABS_CODE'] = $abs['abs_code'] ;
		$arr_ins['field_ABS_LENGTH'] = $abs['abs_length'] ;
		paracrm_lib_data_insertRecord_file( 'PEOPLEDAY_ABS', $filerecord_id, $arr_ins ) ;
	}
	
	return array('success'=>true) ;
}






function specDbsPeople_Real_RhAbsLoad( $post_data ) {
	usleep(500000);
	global $_opDB ;
	
	$people_code = $post_data['people_code'] ;
	$date_sql = $post_data['date_sql'] ;
	
	$query = "SELECT * FROM view_file_RH_ABS WHERE field_PPL_CODE='$people_code' AND field_TMP_IS_ON='1'
				AND field_DATE_APPLY<='$date_sql' AND field_TMP_DATE_END>='$date_sql'
				LIMIT 1" ;
	$result = $_opDB->query($query) ;
	if( $arr = $_opDB->fetch_assoc($result) ) {
		$ttmp = explode(':',$arr['field_ABS_CODE']) ;
		$abs_code = $ttmp[0] ;
		if( $ttmp[1] == '2' ) {
			$rh_abs_half_day = true ;
		}
		$formData = array(
			'rh_abs_is_on' => true,
			'rh_abs_code' => $abs_code,
			'rh_abs_date_start' => date('Y-m-d',strtotime($arr['field_DATE_APPLY'])),
			'rh_abs_date_end' => date('Y-m-d',strtotime($arr['field_TMP_DATE_END'])),
			'rh_abs_half_day' => $rh_abs_half_day
		) ;
	} else {
		$formData = array(
			'rh_abs_date_start' => date('Y-m-d',strtotime($date_sql))
		) ;
	}
	
	return array('success'=>true, 'formData'=>$formData) ;
}
function specDbsPeople_Real_RhAbsSave( $post_data ) {
	global $_opDB ;
	
	// Extract data
	$people_code = $post_data['people_code'] ;
	$form_data = json_decode($post_data['formData'],true) ;
	$abs_is_on = ( $form_data['rh_abs_is_on'] == 'on' ) ;
	$abs_code = $form_data['rh_abs_code'] ;
	$abs_date_start = $form_data['rh_abs_date_start'] ;
	$abs_date_end = $form_data['rh_abs_date_end'] ;
	if( $form_data['rh_abs_half_day'] == 'on' ) {
		$abs_code.= ':2' ;
	}
	
	if( $abs_is_on ) {
		if( !$abs_code || !$abs_date_start || !$abs_date_end || !(strtotime($abs_date_start) <= strtotime($abs_date_end)) ) {
			return array('success'=>false ) ;
		}
	}
	
	$query = "SELECT filerecord_id FROM view_file_RH_ABS WHERE field_PPL_CODE='$people_code' AND field_TMP_IS_ON='1'
				AND field_DATE_APPLY<='$abs_date_end' AND field_TMP_DATE_END>='$abs_date_start'
				LIMIT 1" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$filerecord_id = $arr[0] ;
		paracrm_lib_data_deleteRecord_file( 'RH_ABS', $filerecord_id ) ;
	}
	
	if( $abs_is_on ) {
		$arr_ins = array();
		$arr_ins['field_PPL_CODE'] = $people_code ;
		$arr_ins['field_DATE_APPLY'] = $abs_date_start ;
		$arr_ins['field_ABS_CODE'] = $abs_code ;
		$arr_ins['field_TMP_IS_ON'] = 1 ;
		$arr_ins['field_TMP_DATE_END'] = $abs_date_end;
		$arr_ins['field_TMP_IS_END'] = 0 ;
		paracrm_lib_data_insertRecord_file( 'RH_ABS', 0, $arr_ins );
	}
	
	specDbsPeople_RH_resyncPeopleEvents($people_code) ;
	
	return array('success'=>true) ;
}
function specDbsPeople_Real_RhAbsDownload( $post_data ) {
	global $_opDB ;
	
	// Extract data
	$people_code = $post_data['people_code'] ;
	$form_data = json_decode($post_data['formData'],true) ;
	$abs_is_on = ( $form_data['rh_abs_is_on'] == 'on' ) ;
	$abs_code = $form_data['rh_abs_code'] ;
	$abs_date_start = $form_data['rh_abs_date_start'] ;
	$abs_date_end = $form_data['rh_abs_date_end'] ;
	
	if( !$abs_is_on ) {
		return array('success'=>false ) ;
	}
	$json_save = specDbsPeople_Real_RhAbsSave( $post_data ) ;
	if( !$json_save['success'] ) {
		return array('success'=>false ) ;
	}
	
	$ttmp = specDbsPeople_RH_getGrid( array('filter_peopleCode'=>$people_code) ) ;
	$people_record = $ttmp['data'][0] ;
	if( !$people_record ) {
		return array('success'=>false) ;
	}
	$std_whse_code = $people_record['whse_code'] ;
	$std_whse_txt = $_opDB->query_uniqueValue("SELECT field_WHSE_TXT FROM view_bible_CFG_WHSE_entry WHERE entry_key='{$std_whse_code}'") ;
	$std_team_code = $people_record['team_code'] ;
	$std_team_txt = $_opDB->query_uniqueValue("SELECT field_TEAM_TXT FROM view_bible_CFG_TEAM_entry WHERE entry_key='{$std_team_code}'") ;
	
	$abs_txt = $_opDB->query_uniqueValue("SELECT field_ABS_TXT FROM view_bible_CFG_ABS_entry WHERE entry_key='{$abs_code}'") ;
	
	$whse_treenode = $_opDB->query_uniqueValue("SELECT treenode_key FROM view_bible_CFG_WHSE_entry WHERE entry_key='{$std_whse_code}'") ;
	$whse_treenode_txt = '' ;
	while( TRUE ) {
		$whse_treenode_parent = $_opDB->query_uniqueValue("SELECT treenode_parent_key FROM view_bible_CFG_WHSE_tree WHERE treenode_key='{$whse_treenode}'") ;
		if( in_array($whse_treenode_parent,array('','&')) ) {
			$whse_treenode_txt = $_opDB->query_uniqueValue("SELECT field_SITE_TXT FROM view_bible_CFG_WHSE_tree WHERE treenode_key='{$whse_treenode}'") ;
			break ;
		}
		$whse_treenode = $whse_treenode_parent ;
	}
	
	switch( $abs_code ) {
		case 'CP' :
			$ttmp = specDbsPeople_lib_calc_getCalcAttributeRecords_CP( date('Y-m-d',strtotime('-1 day',strtotime($abs_date_start))), $people_code ) ;
			$calc_quota_start = $ttmp[$people_code]['calc_value'] ;
			$ttmp = specDbsPeople_lib_calc_getCalcAttributeRecords_CP( date('Y-m-d',strtotime($abs_date_end)), $people_code ) ;
			$calc_quota_end = $ttmp[$people_code]['calc_value'] ;
			$ttmp = specDbsPeople_lib_calc_getCalcAttributeRecords_CP(NULL, $people_code) ;
			$calc_quota_total = $ttmp[$people_code]['calc_value'] ;
			$calc_quota_duration = $calc_quota_end - $calc_quota_start ;
			$calc_unit = $ttmp[$people_code]['calc_unit_short'] ;
			break ;
		case 'RTT' :
			$ttmp = specDbsPeople_lib_calc_getCalcAttributeRecords_RTT( date('Y-m-d',strtotime('-1 day',strtotime($abs_date_start))), $people_code ) ;
			$calc_quota_start = $ttmp[$people_code]['calc_value'] ;
			$ttmp = specDbsPeople_lib_calc_getCalcAttributeRecords_RTT( date('Y-m-d',strtotime($abs_date_end)), $people_code ) ;
			$calc_quota_end = $ttmp[$people_code]['calc_value'] ;
			$ttmp = specDbsPeople_lib_calc_getCalcAttributeRecords_RTT(NULL, $people_code) ;
			$calc_quota_total = $ttmp[$people_code]['calc_value'] ;
			$calc_quota_duration = $calc_quota_end - $calc_quota_start ;
			$calc_unit = $ttmp[$people_code]['calc_unit_short'] ;
			break ;
		case 'RH' :
			$ttmp = specDbsPeople_lib_calc_getCalcAttributeRecords_MOD( date('Y-m-d',strtotime('-1 day',strtotime($abs_date_start))), $people_code ) ;
			$calc_quota_start = $ttmp[$people_code]['calc_value'] ;
			$ttmp = specDbsPeople_lib_calc_getCalcAttributeRecords_MOD( date('Y-m-d',strtotime($abs_date_end)), $people_code ) ;
			$calc_quota_end = $ttmp[$people_code]['calc_value'] ;
			$ttmp = specDbsPeople_lib_calc_getCalcAttributeRecords_MOD(NULL, $people_code) ;
			$calc_quota_total = $ttmp[$people_code]['calc_value'] ;
			$calc_quota_duration = $calc_quota_end - $calc_quota_start ;
			$calc_unit = $ttmp[$people_code]['calc_unit_short'] ;
			break ;
		case 'RC' :
			$ttmp = specDbsPeople_lib_calc_getCalcAttributeRecords_RC( date('Y-m-d',strtotime('-1 day',strtotime($abs_date_start))), $people_code ) ;
			$calc_quota_start = $ttmp[$people_code]['calc_value'] ;
			$ttmp = specDbsPeople_lib_calc_getCalcAttributeRecords_RC( date('Y-m-d',strtotime($abs_date_end)), $people_code ) ;
			$calc_quota_end = $ttmp[$people_code]['calc_value'] ;
			$ttmp = specDbsPeople_lib_calc_getCalcAttributeRecords_RC(NULL, $people_code) ;
			$calc_quota_total = $ttmp[$people_code]['calc_value'] ;
			$calc_quota_duration = $calc_quota_end - $calc_quota_start ;
			$calc_unit = $ttmp[$people_code]['calc_unit_short'] ;
			break ;
		default :
			$calc_unit = '' ;
			break ;
	}
	
	
	$VALUES = array() ;
	$VALUES['site_txt'] = $whse_treenode_txt ;
	$VALUES['people_name'] = $people_record['people_name'] ;
	$VALUES['whse_txt'] = $std_whse_txt ;
	$VALUES['team_txt'] = $std_team_txt ;
	$VALUES['abs_txt'] = $abs_txt ;
	$VALUES['abs_date_start'] = date('d/m/Y',strtotime($abs_date_start)) ;
	$VALUES['abs_date_end'] = date('d/m/Y',strtotime($abs_date_end)) ;
	$VALUES['calc_quota_start'] = '' ;
	$VALUES['calc_quota_proj'] = '' ;
	$VALUES['calc_quota_projEnd'] = '' ;
	if( isset($calc_quota_start) && isset($calc_quota_total) && isset($calc_quota_duration) ) {
		$VALUES['calc_quota_start'] = $calc_quota_start ;
		$VALUES['calc_quota_proj'] = $calc_quota_total - $calc_quota_duration ;
		$VALUES['calc_quota_projEnd'] = $calc_quota_total ;
	}
	$VALUES['calc_unit'] = $calc_unit ;
	
	
	$app_root = $GLOBALS['app_root'] ;
	$resources_root=$app_root.'/resources' ;
	$templates_dir=$resources_root.'/server/templates' ;
	$inputFileName = $templates_dir.'/'.'DBS_PEOPLE_demande_absence.html' ;
	$inputBinary = file_get_contents($inputFileName) ;
	
	//echo $inputFileName ;
	$doc = new DOMDocument();
	@$doc->loadHTML($inputBinary);
	
	$elements = $doc->getElementsByTagName('qbook-value');
	$i = $elements->length - 1;
	while ($i > -1) {
		$node_qbookValue = $elements->item($i); 
		$i--; 
		
		$val = '' ;
		if( $node_qbookValue->attributes->getNamedItem('src_inputvar') ) {
			$src_inputvar = $node_qbookValue->attributes->getNamedItem('src_inputvar')->value ;
			foreach( $VALUES as $mkey => $mvalue ) {
				if( $mkey == $src_inputvar ) {
					$val = $mvalue ;
					break ;
				}
			}
		}
		$new_node = $doc->createTextNode($val) ;
		$node_qbookValue->parentNode->replaceChild($new_node,$node_qbookValue) ;
	}
	
	return array('success'=>true, 'html'=>$doc->saveHTML() ) ;
}

?>
