<?php

function specDbsPeople_Real_getData( $post_data ) {
	global $_opDB ;
	if( isset($post_data['filter_peopleCode']) ) {
		$filter_peopleCode = $post_data['filter_peopleCode'] ;
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
		$people_code = $arr['field_PPL_CODE'] ;
		
		reset($sql_dates_days) ;
		foreach( $sql_dates as $cur_date ) {
			$ISO8601_day = current($sql_dates_days) ;
			next($sql_dates_days) ;
			
			$row = array() ;
			$row['status_isVirtual'] = TRUE ;
			$row['date_sql'] = $cur_date ;
			$row['people_code'] = $arr['entry_key'] ;
			$row['people_name'] = $arr['field_PPL_FULLNAME'] ;
			$row['people_techid'] = $arr['field_PPL_TECHID'] ;
			
			// Fake JOIN on PEOPLEDAY file to retrieve current attributes
			$fake_row = array() ;
			$fake_row['PEOPLEDAY']['field_DATE'] = $cur_date ;
			$fake_row['PEOPLEDAY']['field_PPL_CODE'] = $arr['entry_key'] ;
			paracrm_lib_file_joinQueryRecord( 'PEOPLEDAY', $fake_row ) ;
			
			$join_map = array() ;
			$join_map['field_STD_CONTRACT'] = 'std_contract_code' ;
			$join_map['field_STD_WHSE'] = 'std_whse_code' ;
			$join_map['field_STD_TEAM'] = 'std_team_code' ;
			$join_map['field_STD_ROLE'] = 'std_role_code' ;
			$join_map['field_STD_ABS'] = 'std_abs_code' ;
			foreach( $join_map as $src => $dest ) {
				$row[$dest] = $fake_row['PEOPLEDAY'][$src] ;
				if( !$row[$dest] ) {
					continue 2 ;
				}
			}
			
			unset($cfg_contract) ;
			if( $contract_code = $row['std_contract_code'] ) {
				$cfg_contract = $cfg_contracts[$contract_code] ;
			}
			if( !$cfg_contract ) {
				continue ;
			}
			
			if( !$cfg_contract['std_dayson'][$ISO8601_day] ) {
				continue ;
			}
			$row['std_daylength'] = $cfg_contract['std_daylength'] ;
			
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
	
		$work = array(
			'role_code' => $arr['field_ROLE_CODE'],
			'role_length' => $arr['field_ROLE_LENGTH'],
			'alt_whse_code' => $arr['field_ALT_WHSE_CODE']
		) ;
		$buildTAB[$cur_date][$people_code]['works'][] = $work ;
	}
	
	
	$TAB_data = array() ;
	$TAB_rows = array() ;
	$TAB_columns = array() ;
	foreach( $buildTAB as $sql_date => $arr1 ) {
		$TAB_columns[$sql_date] = array(
			'enable_open' => false,
			'enable_valid_ceq' => false,
			'enable_valid_rh' => false
		);
		foreach( $arr1 as $people_code => $peopleday_record ) {
			$peopleday_record['id'] = $people_code.'@'.$sql_date ;
			$TAB_data[] = $peopleday_record ;
			
			$std_rowHash = $peopleday_record['std_whse_code'].'%'.$peopleday_record['std_team_code'].'%'.$peopleday_record['people_code'] ;
			if( !isset($TAB_rows[$std_rowHash]) ) {
				$row = array() ;
				$row['id'] = $std_rowHash ;
				$row['whse_code'] = $peopleday_record['std_whse_code'] ;
				$row['team_code'] = $peopleday_record['std_team_code'] ;
				$copy = array('people_code','people_name','people_techid') ;
				foreach( $copy as $mkey ) {
					$row[$mkey] = $peopleday_record[$mkey] ;
				}
				$TAB_rows[$std_rowHash] = $row ;
			}
			
			if( $peopleday_record['status_isVirtual'] ) {
				$TAB_columns[$sql_date]['enable_open'] = TRUE ;
			}
			if( !$peopleday_record['status_isValidCeq'] ) {
				$TAB_columns[$sql_date]['enable_valid_ceq'] = TRUE ;
			}
			if( !$peopleday_record['status_isValidRh'] ) {
				$TAB_columns[$sql_date]['enable_valid_rh'] = TRUE ;
			}
		}
		if( $TAB_columns[$sql_date]['enable_open'] ) {
			$TAB_columns[$sql_date]['enable_valid_ceq'] = FALSE ;
			$TAB_columns[$sql_date]['enable_valid_rh'] = FALSE ;
		}
	}

	return array('success'=>true, 'data'=>$TAB_data, 'rows'=>array_values($TAB_rows), 'columns'=>$TAB_columns) ;
}


function specDbsPeople_Real_openDay( $post_data ) {
	$post_data['date_start'] = $post_data['date_end'] = $post_data['date_toOpen'] ;
	$json = specDbsPeople_Real_getData( $post_data ) ;
	foreach( $json['data'] as $peopleday_record ) {
		if( !$peopleday_record['status_isVirtual'] ) {
			continue ;
		}
		
		$arr_ins = array() ;
		$arr_ins['field_DATE'] = $peopleday_record['date_sql'] ;
		$arr_ins['field_PPL_CODE'] = $peopleday_record['people_code'] ;
		$filerecord_id = paracrm_lib_data_insertRecord_file( 'PEOPLEDAY', 0 , $arr_ins ) ;
		
		if( $peopleday_record['std_abs_code'] != '_IN' ) {
			$arr_ins = array() ;
			$arr_ins['field_ABS_CODE'] = $peopleday_record['std_abs_code'] ;
			$arr_ins['field_ABS_LENGTH'] = $peopleday_record['std_daylength'] ;
			paracrm_lib_data_insertRecord_file( 'PEOPLEDAY_ABS', $filerecord_id , $arr_ins ) ;
			continue ;
		}
		
		$arr_ins = array() ;
		$arr_ins['field_ROLE_CODE'] = $peopleday_record['std_role_code'] ;
		$arr_ins['field_ROLE_LENGTH'] = $peopleday_record['std_daylength'] ;
		paracrm_lib_data_insertRecord_file( 'PEOPLEDAY_WORK', $filerecord_id , $arr_ins ) ;
	}
	return array('success'=>true) ;
}

?>