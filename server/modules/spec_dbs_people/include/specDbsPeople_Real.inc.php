<?php

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
				$row['std_daylength'] = 0 ;
			} else {
				$row['std_daylength'] = $cfg_contract['std_daylength'] ;
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
	
		$work = array(
			'role_code' => $arr['field_ROLE_CODE'],
			'role_length' => $arr['field_ROLE_LENGTH'],
			'alt_whse_code' => $arr['field_ALT_WHSE_CODE']
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
	
		$abs = array(
			'abs_code' => $arr['field_ABS_CODE'],
			'abs_length' => $arr['field_ABS_LENGTH']
		) ;
		$buildTAB[$cur_date][$people_code]['abs'][] = $abs ;
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
			if( !$peopleday_record['status_isVirtual'] && !$peopleday_record['status_isValidCeq'] ) {
				$TAB_columns[$sql_date]['enable_valid_ceq'] = TRUE ;
			}
			if( !$peopleday_record['status_isVirtual'] && !$peopleday_record['status_isValidRh'] ) {
				$TAB_columns[$sql_date]['enable_valid_rh'] = TRUE ;
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
				$std_rowHash = $alt_whse_code.'%'.$peopleday_record['std_team_code'].'%'.$peopleday_record['people_code'] ;
				if( !isset($TAB_rows[$std_rowHash]) ) {
					$row = array() ;
					$row['id'] = $std_rowHash ;
					$row['whse_code'] = $alt_whse_code ;
					$row['whse_isAlt'] = TRUE ;
					$row['team_code'] = $peopleday_record['std_team_code'] ;
					$copy = array('people_code','people_name','people_techid') ;
					foreach( $copy as $mkey ) {
						$row[$mkey] = $peopleday_record[$mkey] ;
					}
					$TAB_rows[$std_rowHash] = $row ;
				}
			}
		}
		if( $TAB_columns[$sql_date]['enable_open'] ) {
			$TAB_columns[$sql_date]['enable_valid_ceq'] = FALSE ;
			$TAB_columns[$sql_date]['enable_valid_rh'] = FALSE ;
		}
	}
	
	// Filter ROWS @TODO: use prefilter on cfgFiles before join
	$has_filters = FALSE ;
	if( $filter_arrSites || $filter_arrTeams ) {
		$has_filters = TRUE ;
	}
	if( $has_filters ) {
		$new_TAB_rows = array() ;
		foreach( $TAB_rows as $idx => $row ) {
			if( $filter_arrSites && !in_array($row['whse_code'],$filter_arrSites) ) {
				continue ;
			}
			if( $filter_arrTeams && !in_array($row['team_code'],$filter_arrTeams) ) {
				continue ;
			}
			$new_TAB_rows[] = $row ;
		}
		$TAB_rows = $new_TAB_rows ;
	}
	
	
	// TODO Filter ROWS, remove orphans (use no-show peopleCode)
	
	
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
	$post_data['date_start'] = $post_data['date_end'] = $post_data['date_toOpen'] ;
	$json = specDbsPeople_Real_getData( $post_data ) ;
	foreach( $json['data'] as $peopleday_record ) {
		// Enforce whse/team filters, in case of mutation ...
		if( isset($filter_arrSites) && !in_array($peopleday_record['std_whse_code'],$filter_arrSites) ) {
			continue ;
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
			switch( $post_data['_subaction'] ) {
				case 'valid_ceq' :
					$method = 'specDbsPeople_Real_actionDay_lib_valid_ceq' ;
					break ;
				case 'valid_rh' :
					$method = 'specDbsPeople_Real_actionDay_lib_valid_rh' ;
					break ;
			}
			foreach( $arr_peopledayRecords as $peopleday_record ) {
				if( !call_user_func($method,$peopleday_record,$test=TRUE) ) {
					return array('success'=>false) ;
				}
			}
			foreach( $arr_peopledayRecords as $peopleday_record ) {
				call_user_func($method,$peopleday_record) ;
			}
			break ;
			
		default :
			return array('success'=>false) ;
	}
	
	
	return array('success'=>true, 'done'=>true) ;
}
function specDbsPeople_Real_actionDay_lib_open( $peopleday_record, $test_mode=FALSE ) {
	if( !$peopleday_record['status_isVirtual'] ) {
		return TRUE ;
	}
	if( $test_mode ) {
		return TRUE ;
	}
	
	$arr_ins = array() ;
	$arr_ins['field_DATE'] = $peopleday_record['date_sql'] ;
	$arr_ins['field_PPL_CODE'] = $peopleday_record['people_code'] ;
	$filerecord_id = paracrm_lib_data_insertRecord_file( 'PEOPLEDAY', 0 , $arr_ins ) ;
	
	if( $peopleday_record['std_abs_code'] != '_' ) {
		$arr_ins = array() ;
		$arr_ins['field_ABS_CODE'] = $peopleday_record['std_abs_code'] ;
		$arr_ins['field_ABS_LENGTH'] = $peopleday_record['std_daylength'] ;
		paracrm_lib_data_insertRecord_file( 'PEOPLEDAY_ABS', $filerecord_id , $arr_ins ) ;
		return TRUE ;
	}
	
	if( $peopleday_record['std_daylength'] == 0 ) {
		return TRUE ;
	}
	
	$arr_ins = array() ;
	$arr_ins['field_ROLE_CODE'] = $peopleday_record['std_role_code'] ;
	$arr_ins['field_ROLE_LENGTH'] = $peopleday_record['std_daylength'] ;
	paracrm_lib_data_insertRecord_file( 'PEOPLEDAY_WORK', $filerecord_id , $arr_ins ) ;
	
	return TRUE ;
}
function specDbsPeople_Real_actionDay_lib_valid_ceq( $peopleday_record, $test_mode=FALSE ) {
	if( $peopleday_record['status_isVirtual'] ) {
		return FALSE ;
	}
	if( $peopleday_record['status_isValidCeq'] ) {
		return TRUE ;
	}
	
	if( $test_mode ) {
		return TRUE ;
	}
	
	$arr_update = array() ;
	$arr_update['field_VALID_CEQ'] = 1 ;
	paracrm_lib_data_updateRecord_file( 'PEOPLEDAY' , $arr_update, $peopleday_record['filerecord_id'] ) ;
	
	return TRUE ;
}
function specDbsPeople_Real_actionDay_lib_valid_rh( $peopleday_record, $test_mode=FALSE ) {
	if( $peopleday_record['status_isVirtual'] ) {
		return FALSE ;
	}
	if( $peopleday_record['status_isValidRh'] ) {
		return TRUE ;
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
	
	if( $test_mode ) {
		return TRUE ;
	}
	
	$arr_update = array() ;
	$arr_update['field_VALID_CEQ'] = 1 ;
	$arr_update['field_VALID_RH'] = 1 ;
	paracrm_lib_data_updateRecord_file( 'PEOPLEDAY' , $arr_update, $peopleday_record['filerecord_id'] ) ;
	
	return TRUE ;
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
		$arr_ins['field_ROLE_CODE'] = $work['role_code'] ;
		$arr_ins['field_ROLE_LENGTH'] = $work['role_length'] ;
		$arr_ins['field_ALT_WHSE_CODE'] = $work['alt_whse_code'] ;
		paracrm_lib_data_insertRecord_file( 'PEOPLEDAY_WORK', $filerecord_id, $arr_ins ) ;
	}
	foreach( $record_data['abs'] as $abs ) {
		$arr_ins = array() ;
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
		$formData = array(
			'rh_abs_is_on' => true,
			'rh_abs_code' => $arr['field_ABS_CODE'],
			'rh_abs_date_start' => date('Y-m-d',strtotime($arr['field_DATE_APPLY'])),
			'rh_abs_date_end' => date('Y-m-d',strtotime($arr['field_TMP_DATE_END']))
		) ;
	} else {
		$formData = array(
			'rh_abs_date_start' => date('Y-m-d',strtotime($date_sql))
		) ;
	}
	
	return array('success'=>true, 'formData'=>$formData) ;
}
function specDbsPeople_Real_RhAbsSave( $post_data ) {
	usleep(500000);
	global $_opDB ;
	
	// Extract data
	$people_code = $post_data['people_code'] ;
	$form_data = json_decode($post_data['formData'],true) ;
	$abs_is_on = ( $form_data['rh_abs_is_on'] == 'on' ) ;
	$abs_code = $form_data['rh_abs_code'] ;
	$abs_date_start = $form_data['rh_abs_date_start'] ;
	$abs_date_end = $form_data['rh_abs_date_end'] ;
	
	if( $abs_is_on ) {
		if( !$abs_code || !$abs_date_start || !$abs_date_end || !(strtotime($abs_date_start) < strtotime($abs_date_end)) ) {
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
	usleep(500000);
	global $_opDB ;
	
	// Extract data
	$people_code = $post_data['people_code'] ;
	$form_data = json_decode($post_data['formData'],true) ;
	$abs_code = $form_data['rh_abs_code'] ;
	$abs_date_start = $form_data['rh_abs_date_start'] ;
	$abs_date_end = $form_data['rh_abs_date_end'] ;
	
	if( !$abs_code || !$abs_date_start || !$abs_date_end || !(strtotime($abs_date_start) < strtotime($abs_date_end)) ) {
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
	
	
	$VALUES = array() ;
	$VALUES['people_name'] = $people_record['people_name'] ;
	$VALUES['whse_txt'] = $std_whse_txt ;
	$VALUES['team_txt'] = $std_team_txt ;
	$VALUES['abs_txt'] = $abs_txt ;
	$VALUES['abs_date_start'] = date('d/m/Y',strtotime($abs_date_start)) ;
	$VALUES['abs_date_end'] = date('d/m/Y',strtotime($abs_date_end)) ;
	
	
	$app_root = $GLOBALS['app_root'] ;
	$resources_root=$app_root.'/resources' ;
	$templates_dir=$resources_root.'/server/templates' ;
	$inputFileName = $templates_dir.'/'.'DBS_PEOPLE_demande_conge.html' ;
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