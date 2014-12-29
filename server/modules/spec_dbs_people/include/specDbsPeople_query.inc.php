<?php

function specDbsPeople_query_getLibrary() {
	global $_opDB ;
	
	$TAB = array() ;
	
	$TAB[] = array('querysrc_id'=>'0:RH', 'q_name'=>'RH : Base People') ;
	$TAB[] = array('querysrc_id'=>'0:RH_CNT_SUM', 'q_name'=>'RH : Compteurs à date', 'enable_date_at'=>true ) ;
	$TAB[] = array('querysrc_id'=>'0:RH_CNT_PROJ', 'q_name'=>'RH : Compteurs date + projection', 'enable_date_at'=>true ) ;
	$TAB[] = array('querysrc_id'=>'0:RH_CNT_DET', 'q_name'=>'RH : Détail compteurs', 'enable_date_at'=>true ) ;
	$TAB[] = array('querysrc_id'=>'0:CEQ_GRID', 'q_name'=>'CEQ : Vue people/dates', 'enable_date_interval'=>true ) ;
	$TAB[] = array('querysrc_id'=>'0:CEQ_OLD', 'q_name'=>'CEQ : Extract (1ère version)', 'enable_date_interval'=>true ) ;
	$TAB[] = array('querysrc_id'=>'0:CEQ_LIST', 'q_name'=>'CEQ : Extract lignes', 'enable_date_interval'=>true ) ;
	$TAB[] = array('querysrc_id'=>'0:ITM_NC', 'q_name'=>'Interim : NC', 'enable_date_interval'=>true ) ;
	foreach( $TAB as &$querydesc ) {
		$querydesc['enable_filters'] = TRUE ;
		if( $querydesc['querysrc_id'] == '0:CEQ_LIST' ) {
			$querydesc['enable_filters_cli'] = TRUE ;
		}
	}
	unset($querydesc) ;
	
	$query = "SELECT input_query_src.querysrc_id , query.query_name AS q_name  FROM input_query_src 
				JOIN query ON query.query_id = input_query_src.target_query_id" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB[] = $arr ;
	}
	return array('success'=>true,'data'=>$TAB) ;
}


function specDbsPeople_query_getResult( $post_data ) {
	$form_data = json_decode($post_data['data'],true) ;
	$ttmp = explode(':',$form_data['querysrc_id']) ;
	if( count($ttmp) == 2 && $ttmp[0] == '0' ) {
		return specDbsPeople_query_getTableResult($post_data) ;
	}
	return specDbsPeople_query_getQueryResult($post_data) ;
}

function specDbsPeople_query_getTableResult( $post_data ) {
	$form_data = json_decode($post_data['data'],true) ;
	
	// filters
	$filters = array() ;
	if( $form_data['filter_site'] ) {
		$filters['filter_site_entries'] = json_encode($form_data['filter_site']) ;
	}
	if( $form_data['filter_site_entries'] ) {
		$filters['filter_site_entries'] = json_encode($form_data['filter_site_entries']) ;
	}
	if( $form_data['filter_team'] ) {
		$filters['filter_team_entries'] = json_encode($form_data['filter_team']) ;
	}
	if( $form_data['filter_team_entries'] ) {
		$filters['filter_team_entries'] = json_encode($form_data['filter_team_entries']) ;
	}
	if( $form_data['filter_cli'] ) {
		$filters['filter_cli_code'] = $form_data['filter_cli'] ;
	}
	if( $form_data['filter_cli_code'] ) {
		$filters['filter_cli_code'] = $form_data['filter_cli_code'] ;
	}
	
	$ttmp = explode(':',$form_data['querysrc_id']) ;
	switch( $ttmp[1] ) {
		case 'RH' :
			$result_tab = specDbsPeople_query_getTableResult_RH($filters) ;
			break ;
		case 'RH_CNT_SUM' :
			$result_tab = specDbsPeople_query_getTableResult_RHCNTSUM($form_data['date_at'],$filters) ;
			break ;
		case 'RH_CNT_PROJ' :
			$result_tab = specDbsPeople_query_getTableResult_RHCNTPROJ($form_data['date_at'],$filters) ;
			break ;
		case 'RH_CNT_DET' :
			$result_tab = specDbsPeople_query_getTableResult_RHCNTDET($form_data['date_at'],$filters) ;
			break ;
		case 'CEQ_GRID' :
			$result_tab = specDbsPeople_query_getTableResult_CEQGRID($form_data['date_start'],$form_data['date_end'],$filters) ;
			break ;
		case 'CEQ_OLD' :
			$result_tab = specDbsPeople_query_getTableResult_CEQOLD($form_data['date_start'],$form_data['date_end'],$filters) ;
			break ;
		case 'CEQ_LIST' :
			$result_tab = specDbsPeople_query_getTableResult_CEQLIST($form_data['date_start'],$form_data['date_end'],$filters) ;
			break ;
		case 'ITM_NC' :
			$result_tab = specDbsPeople_query_getTableResult_ITMNC($form_data['date_start'],$form_data['date_end'],$filters) ;
			break ;
		default :
			return array('success'=>false) ;
	}
	
	$json = specDbsPeople_query_getLibrary() ;
	$query_desc = $query_vars = NULL ;
	foreach( $json['data'] as $iter_queryDesc ) {
		if( $form_data['querysrc_id'] == $iter_queryDesc['querysrc_id'] ) {
			$query_desc = $iter_queryDesc ;
		}
	}
	if( $query_desc ) {
		$query_vars = array() ;
		$query_vars['q_name'] = $query_desc['q_name'] ;
		if( $query_desc['enable_date_at'] ) {
			$query_vars['date_at'] = $form_data['date_at'] ;
		} else {
			unset($form_data['date_at']) ;
		}
		if( $query_desc['enable_date_interval'] ) {
			$query_vars['date_start'] = $form_data['date_start'] ;
			$query_vars['date_end'] = $form_data['date_end'] ;
		} else {
			unset($form_data['date_start']) ;
			unset($form_data['date_end']) ;
		}
		//$query_vars['q_urldata'] = json_encode($form_data) ;
		
		$request = array() ;
		foreach( $post_data as $mkey => $mvalue ) {
			if( in_array($mkey,array('_moduleId','_sessionId','data')) ) {
				continue ;
			}
			if( is_array(json_decode($mvalue,true)) ) {
				continue ;
			}
			$request[$mkey] = $mvalue ;
		}
		foreach( $form_data as $json_mkey => $json_mvalue ) {
			$mkey = 'data' ;
			if( !$json_mvalue ) {
					continue ;
				}
			$request[$mkey.':'.$json_mkey] = ( is_array($json_mvalue) ? json_encode($json_mvalue) : $json_mvalue ) ;
		}
		$q_urldata = '' ;
		foreach( $request as $mkey => $mvalue ) {
			if( $q_urldata ) {
				$q_urldata.= '&' ;
			}
			$q_urldata.= $mkey.'='.$mvalue ;
		}
		$query_vars['q_urldata'] = $q_urldata ;
	}
	return array(
		'success' => true,
		'query_vars' => $query_vars,
		'result_tab' => $result_tab
	) ;
}

function specDbsPeople_query_getTableResult_RH($filters=NULL) {
	$ttmp = specDbsPeople_cfg_getCfgBibles() ;
	$cfg_bibles = $ttmp['data'] ;
	$cfg_bibles_idText = array() ;
	foreach( $cfg_bibles as $bible_code => $cfg_bible ) {
		$cfg_bibles_idText[$bible_code] = array() ;
		foreach( $cfg_bible as $row ) {
			$cfg_bibles_idText[$bible_code][$row['id']] = $row['text'] ;
		}
	}
	
	$json = specDbsPeople_RH_getGrid( ($filters ? $filters : array()) ) ;
	$data = $json['data'] ;
	
	$cols = $cols_toDecode = array() ;
	$cols[] = 'whse_txt' ;
	$cols[] = 'team_txt' ;
	$cols[] = 'role_txt' ;
	$cols[] = 'contract_txt' ;
	$cols[] = 'people_code' ;
	$cols[] = 'people_name' ;
	foreach( specDbsPeople_lib_peopleFields_getPeopleFields() as $peopleField ) {
		$cols[] = $peopleField['field'] ;
		if( $peopleField['type'] == 'link' ) {
			$cols_toDecode[] = $peopleField['field'] ;
		}
	}
	foreach( $data as &$row ) {
		foreach( $cols_toDecode as $col ) {
			if( is_array($row[$col]) ) {
				$row[$col] = $row[$col]['text'] ;
			}
		}
	}
	
	$RET_columns = array() ;
	foreach( $cols as $col ) {
		$RET_columns[] = array('dataIndex'=>$col,'dataType'=>'string','text'=>$col) ;
	}
	
	$RET_data = array() ;
	foreach( $data as $data_row ) {
		$data_row['whse_txt'] = $cfg_bibles_idText['WHSE'][$data_row['whse_code']] ;
		$data_row['team_txt'] = $cfg_bibles_idText['TEAM'][$data_row['team_code']] ;
		$data_row['role_txt'] = $cfg_bibles_idText['ROLE'][$data_row['role_code']] ;
		$data_row['contract_txt'] = $cfg_bibles_idText['CONTRACT'][$data_row['contract_code']] ;
		$RET_data[] = $data_row ;
	}

	return array('columns'=>$RET_columns,'data'=>$RET_data) ;
}

function specDbsPeople_query_getTableResult_RHCNTSUM($at_date_sql, $filters=NULL) {
	$ttmp = specDbsPeople_cfg_getCfgBibles() ;
	$cfg_bibles = $ttmp['data'] ;
	$cfg_bibles_idText = array() ;
	foreach( $cfg_bibles as $bible_code => $cfg_bible ) {
		$cfg_bibles_idText[$bible_code] = array() ;
		foreach( $cfg_bible as $row ) {
			$cfg_bibles_idText[$bible_code][$row['id']] = $row['text'] ;
		}
	}
	
	$ttmp = specDbsPeople_cfg_getPeopleCalcAttributes() ;
	$cfg_calcAttributes = $ttmp['data'] ;
	
	$post_data = array() ;
	$post_data['_load_calcAttributes'] = true ;
	$post_data['_load_calcAttributes_atDateSql'] = $at_date_sql ;
	if( $filters ) {
		$post_data += $filters ;
	}
	$json = specDbsPeople_RH_getGrid( $post_data ) ;
	$data = $json['data'] ;
	
	$cols = $cols_toDecode = array() ;
	$cols[] = 'whse_txt' ;
	$cols[] = 'team_txt' ;
	$cols[] = 'role_txt' ;
	$cols[] = 'contract_txt' ;
	$cols[] = 'people_code' ;
	$cols[] = 'people_name' ;
	foreach( specDbsPeople_lib_peopleFields_getPeopleFields() as $peopleField ) {
		$cols[] = $peopleField['field'] ;
		if( $peopleField['type'] == 'link' ) {
			$cols_toDecode[] = $peopleField['field'] ;
		}
	}
	foreach( $cfg_calcAttributes as $peopleCalcAttribute_definition ) {
		$peopleCalcAttribute = $peopleCalcAttribute_definition['peopleCalcAttribute'] ;
		$cols[] = 'calc_'.$peopleCalcAttribute ;
	}
	
	$RET_columns = array() ;
	foreach( $cols as $col ) {
		$RET_columns[] = array('dataIndex'=>$col,'dataType'=>'string','text'=>$col) ;
	}
	
	$RET_data = array() ;
	foreach( $data as $data_row ) {
		foreach( $cols_toDecode as $col ) {
			if( is_array($data_row[$col]) ) {
				$data_row[$col] = $data_row[$col]['text'] ;
			}
		}
		$data_row['whse_txt'] = $cfg_bibles_idText['WHSE'][$data_row['whse_code']] ;
		$data_row['team_txt'] = $cfg_bibles_idText['TEAM'][$data_row['team_code']] ;
		$data_row['role_txt'] = $cfg_bibles_idText['ROLE'][$data_row['role_code']] ;
		$data_row['contract_txt'] = $cfg_bibles_idText['CONTRACT'][$data_row['contract_code']] ;
		
		foreach( $data_row['calc_attributes'] as $peopleCalcAttributeRecord ) {
			$peopleCalcAttribute = $peopleCalcAttributeRecord['people_calc_attribute'] ;
			$calc_value = $peopleCalcAttributeRecord['calc_value'] ;
			$mkey = 'calc_'.$peopleCalcAttribute ;
			
			$data_row[$mkey] = $calc_value ;
		}
		$RET_data[] = $data_row ;
	}

	return array('columns'=>$RET_columns,'data'=>$RET_data) ;
}

function specDbsPeople_query_getTableResult_RHCNTDET($at_date_sql, $filters=NULL) {
	$ttmp = specDbsPeople_cfg_getCfgBibles() ;
	$cfg_bibles = $ttmp['data'] ;
	$cfg_bibles_idText = array() ;
	foreach( $cfg_bibles as $bible_code => $cfg_bible ) {
		$cfg_bibles_idText[$bible_code] = array() ;
		foreach( $cfg_bible as $row ) {
			$cfg_bibles_idText[$bible_code][$row['id']] = $row['text'] ;
		}
	}
	
	$ttmp = specDbsPeople_cfg_getPeopleCalcAttributes() ;
	$cfg_calcAttributes = $ttmp['data'] ;
	
	$post_data = array() ;
	$post_data['_load_calcAttributes'] = true ;
	$post_data['_load_calcAttributes_atDateSql'] = $at_date_sql ;
	if( $filters ) {
		$post_data += $filters ;
	}
	$json = specDbsPeople_RH_getGrid( $post_data ) ;
	$data = $json['data'] ;
	
	$cols = $cols_toDecode = array() ;
	$cols[] = 'whse_txt' ;
	$cols[] = 'team_txt' ;
	$cols[] = 'role_txt' ;
	$cols[] = 'contract_txt' ;
	$cols[] = 'people_code' ;
	$cols[] = 'people_name' ;
	foreach( specDbsPeople_lib_peopleFields_getPeopleFields() as $peopleField ) {
		$cols[] = $peopleField['field'] ;
		if( $peopleField['type'] == 'link' ) {
			$cols_toDecode[] = $peopleField['field'] ;
		}
	}
	$cols[] = 'cnt_type' ;
	$cols[] = 'cnt_date' ;
	$cols[] = 'cnt_operation' ;
	$cols[] = 'cnt_value' ;
	
	$RET_columns = array() ;
	foreach( $cols as $col ) {
		$RET_columns[] = array('dataIndex'=>$col,'dataType'=>'string','text'=>$col) ;
	}
	
	$RET_data = array() ;
	foreach( $data as $base_row ) {
		foreach( $cols_toDecode as $col ) {
			if( is_array($base_row[$col]) ) {
				$base_row[$col] = $base_row[$col]['text'] ;
			}
		}
		$base_row['whse_txt'] = $cfg_bibles_idText['WHSE'][$base_row['whse_code']] ;
		$base_row['team_txt'] = $cfg_bibles_idText['TEAM'][$base_row['team_code']] ;
		$base_row['role_txt'] = $cfg_bibles_idText['ROLE'][$base_row['role_code']] ;
		$base_row['contract_txt'] = $cfg_bibles_idText['CONTRACT'][$base_row['contract_code']] ;
		
		foreach( $base_row['calc_attributes'] as $peopleCalcAttributeRecord ) {
			foreach( array_reverse($peopleCalcAttributeRecord['rows']) as $peopleCalcAttributeRecord_row ) {
				$data_row = $base_row ;
				
				$data_row['cnt_type'] = $peopleCalcAttributeRecord['people_calc_attribute'] ;
				$data_row['cnt_date'] = $peopleCalcAttributeRecord_row['row_date'] ;
				$data_row['cnt_operation'] = $peopleCalcAttributeRecord_row['row_text'] ;
				$data_row['cnt_value'] = $peopleCalcAttributeRecord_row['row_value'] ;
				
				$RET_data[] = $data_row ;
			}
		}
	}

	return array('columns'=>$RET_columns,'data'=>$RET_data) ;
}

function specDbsPeople_query_getTableResult_RHCNTPROJ($at_date_sql, $filters=NULL) {
	$ttmp = specDbsPeople_cfg_getCfgBibles() ;
	$cfg_bibles = $ttmp['data'] ;
	$cfg_bibles_idText = array() ;
	foreach( $cfg_bibles as $bible_code => $cfg_bible ) {
		$cfg_bibles_idText[$bible_code] = array() ;
		foreach( $cfg_bible as $row ) {
			$cfg_bibles_idText[$bible_code][$row['id']] = $row['text'] ;
		}
	}
	
	$ttmp = specDbsPeople_cfg_getPeopleCalcAttributes() ;
	$cfg_calcAttributes = $ttmp['data'] ;
	$CALC_atDate = $CALC_noDate = array() ;
	foreach( $cfg_calcAttributes as $peopleCalcAttribute_definition ) {
		if( !$peopleCalcAttribute_definition['calcUnit_day'] ) {
			continue ;
		}
		$peopleCalcAttribute = $peopleCalcAttribute_definition['peopleCalcAttribute'] ;
		
		$CALC_atDate[$peopleCalcAttribute] = specDbsPeople_lib_calc_getCalcAttributeRecords( $peopleCalcAttribute, $at_date_sql ) ;
		$CALC_noDate[$peopleCalcAttribute] = specDbsPeople_lib_calc_getCalcAttributeRecords( $peopleCalcAttribute ) ;
	}
	
	$post_data = array() ;
	$post_data['_load_calcAttributes'] = false ;
	if( $filters ) {
		$post_data += $filters ;
	}
	$json = specDbsPeople_RH_getGrid( $post_data ) ;
	$data = $json['data'] ;
	
	$cols = $cols_toDecode = array() ;
	$cols[] = 'whse_txt' ;
	$cols[] = 'team_txt' ;
	$cols[] = 'role_txt' ;
	$cols[] = 'contract_txt' ;
	$cols[] = 'people_code' ;
	$cols[] = 'people_name' ;
	foreach( specDbsPeople_lib_peopleFields_getPeopleFields() as $peopleField ) {
		$cols[] = $peopleField['field'] ;
		if( $peopleField['type'] == 'link' ) {
			$cols_toDecode[] = $peopleField['field'] ;
		}
	}
	$cols[] = 'cnt_type' ;
	$cols[] = 'cnt_valeur_'.$at_date_sql ;
	$cols[] = 'cnt_next' ;
	$cols[] = 'cnt_valeur_PROJ' ;
	
	$RET_columns = array() ;
	foreach( $cols as $col ) {
		$RET_columns[] = array('dataIndex'=>$col,'dataType'=>'string','text'=>$col) ;
	}
	
	$RET_data = array() ;
	foreach( $data as $base_row ) {
		$people_code = $base_row['people_code'] ;
		
		foreach( $cols_toDecode as $col ) {
			if( is_array($base_row[$col]) ) {
				$base_row[$col] = $base_row[$col]['text'] ;
			}
		}
		$base_row['whse_txt'] = $cfg_bibles_idText['WHSE'][$base_row['whse_code']] ;
		$base_row['team_txt'] = $cfg_bibles_idText['TEAM'][$base_row['team_code']] ;
		$base_row['role_txt'] = $cfg_bibles_idText['ROLE'][$base_row['role_code']] ;
		$base_row['contract_txt'] = $cfg_bibles_idText['CONTRACT'][$base_row['contract_code']] ;
		
		foreach( $cfg_calcAttributes as $peopleCalcAttribute_definition ) {
			$peopleCalcAttribute = $peopleCalcAttribute_definition['peopleCalcAttribute'] ;
			if( !isset($CALC_atDate[$peopleCalcAttribute]) || !isset($CALC_noDate[$peopleCalcAttribute]) ) {
				continue ;
			}
			$peopleValue_atDate = ( isset($CALC_atDate[$peopleCalcAttribute][$people_code]) ? $CALC_atDate[$peopleCalcAttribute][$people_code]['calc_value'] : 0 ) ;
			$peopleValue_noDate = ( isset($CALC_noDate[$peopleCalcAttribute][$people_code]) ? $CALC_noDate[$peopleCalcAttribute][$people_code]['calc_value'] : 0 ) ;
			
			$data_row = $base_row ;
			$data_row['cnt_type'] = $peopleCalcAttribute ;
			$data_row['cnt_valeur_'.$at_date_sql] = $peopleValue_atDate ;
			$data_row['cnt_next'] = $peopleValue_atDate - $peopleValue_noDate ;
			$data_row['cnt_valeur_PROJ'] = $peopleValue_noDate ;
			$RET_data[] = $data_row ;
		}
	}

	return array('columns'=>$RET_columns,'data'=>$RET_data) ;
}

function specDbsPeople_query_getTableResult_CEQGRID( $date_start, $date_end, $filters=NULL ) {
	$ttmp = specDbsPeople_cfg_getCfgBibles() ;
	$cfg_bibles = $ttmp['data'] ;
	$cfg_bibles_idText = array() ;
	foreach( $cfg_bibles as $bible_code => $cfg_bible ) {
		$cfg_bibles_idText[$bible_code] = array() ;
		foreach( $cfg_bible as $row ) {
			$cfg_bibles_idText[$bible_code][$row['id']] = $row['text'] ;
		}
	}
	
	$ttmp = specDbsPeople_cfg_getPeopleCalcAttributes() ;
	$cfg_calcAttributes = $ttmp['data'] ;
	
	$post_data = array() ;
	$post_data['date_start'] = $date_start ;
	$post_data['date_end'] = $date_end ;
	if( $filters ) {
		$post_data += $filters ;
	}
	$json = specDbsPeople_Real_getData( $post_data ) ;
	
	$cols = $cols_toDecode = array() ;
	$cols[] = 'whse_txt' ;
	$cols[] = 'team_txt' ;
	$cols[] = 'std_role_txt' ;
	$cols[] = 'contract_txt' ;
	$cols[] = 'people_code' ;
	$cols[] = 'people_name' ;
	foreach( specDbsPeople_lib_peopleFields_getPeopleFields() as $peopleField ) {
		$cols[] = $peopleField['field'] ;
		if( $peopleField['type'] == 'link' ) {
			$cols_toDecode[] = $peopleField['field'] ;
		}
	}
	$arr_dates = array() ;
	$cur_date = date('Y-m-d',strtotime($date_start)) ;
	while( strtotime($cur_date) <= strtotime($date_end) ) {
		//$col_key = 'date_'.date('Ymd',strtotime($cur_date)) ;
		$col_key = $cur_date ;
		$cols[] = $col_key.'/Role' ;
		$cols[] = $col_key.'/Durée' ;
		$arr_dates[$cur_date] = $col_key ;
		$cur_date = date('Y-m-d',strtotime('+1 day',strtotime($cur_date))) ;
	}
	
	$STORE_data = array() ;
	foreach( $json['data'] as $record ) {
		$STORE_data[$record['id']] = $record ;
	}
	
	$RET_columns = array() ;
	foreach( $cols as $col ) {
		$RET_columns[] = array('dataIndex'=>$col,'dataType'=>'string','text'=>$col) ;
	}
	
	$RET_data = array() ;
	usort($json['rows'],create_function('$r1,$r2','return strcmp($r1["people_name"],$r2["people_name"]);')) ;
	foreach( $json['rows'] as $data_row ) {
		foreach( $cols_toDecode as $col ) {
			if( is_array($data_row[$col]) ) {
				$data_row[$col] = $data_row[$col]['text'] ;
			}
		}
	
		$data_row['whse_txt'] = $cfg_bibles_idText['WHSE'][$data_row['whse_code']] ;
		$data_row['team_txt'] = $cfg_bibles_idText['TEAM'][$data_row['team_code']] ;
		$data_row['std_role_txt'] = $data_row['std_role_code'] ;
		$data_row['contract_txt'] = $cfg_bibles_idText['CONTRACT'][$data_row['contract_code']] ;
		
		foreach( $arr_dates as $date_sql ) {
			// retrieve record
			$id = $data_row['people_code'].'@'.$date_sql ;
			$record = $STORE_data[$id] ;
			if( !$record ) {
				continue ;
			}
			//print_r($record) ;
			
			$role_key = $date_sql.'/Role' ;
			$duration_key = $date_sql.'/Durée' ;
			
			$data_row[$role_key] = NULL ;
			$data_row[$duration_key] = 0 ;
			
			if( $record['status_isVirtual'] ) {
				if( $record['std_abs_code'][0] == '_' ) {
					$data_row[$role_key] = $record['std_role_code'] ;
					$data_row[$duration_key] += $record['std_daylength'] ;
				} else {
					$data_row[$role_key] = $record['std_abs_code'] ;
					$data_row[$duration_key] = '' ;
				}
				continue ;
			}
			
			$data_row[$role_key] = array() ;
			if( $record['std_whse_code'] != $data_row['whse_code'] ) {
				// mode ALT whse
				foreach( $record['works'] as $work ) {
					if( $work['alt_whse_code'] == $data_row['whse_code'] ) {
						$data_row[$role_key][] = $work['role_code'] ;
						$data_row[$duration_key] += $work['role_length'] ;
					}
				}
				if( $data_row[$duration_key] == 0 ) {
					$data_row[$duration_key] = '' ;
				}
			} else {
				// mode std
				foreach( $record['works'] as $work ) {
					if( $work['alt_whse_code'] ) {
						if( !in_array('@',$data_row[$role_key]) ) {
							$data_row[$role_key][] = '@' ;
						}
						continue ;
					}
					$data_row[$role_key][] = $work['role_code'] ;
					$data_row[$duration_key] += $work['role_length'] ;
				}
				foreach( $record['abs'] as $abs ) {
					$data_row[$role_key][] = $abs['abs_code'] ;
				}
				if( $record['std_abs_code'][0] != '_' && $data_row[$duration_key] == 0 ) {
					$data_row[$duration_key] = '' ;
				}
			}
			$data_row[$role_key] = implode('+',$data_row[$role_key]) ;
		}
		
		$RET_data[] = $data_row ;
	}

	return array('columns'=>$RET_columns,'data'=>$RET_data) ;
}

function specDbsPeople_query_getTableResult_CEQOLD( $date_start, $date_end, $filters=NULL ) {
	$ttmp = specDbsPeople_cfg_getCfgBibles() ;
	$cfg_bibles = $ttmp['data'] ;
	$cfg_bibles_idText = array() ;
	foreach( $cfg_bibles as $bible_code => $cfg_bible ) {
		$cfg_bibles_idText[$bible_code] = array() ;
		foreach( $cfg_bible as $row ) {
			$cfg_bibles_idText[$bible_code][$row['id']] = $row['text'] ;
		}
	}
	
	$ttmp = specDbsPeople_cfg_getPeopleCalcAttributes() ;
	$cfg_calcAttributes = $ttmp['data'] ;
	
	$post_data = array() ;
	$post_data['date_start'] = $date_start ;
	$post_data['date_end'] = $date_end ;
	if( $filters ) {
		$post_data += $filters ;
	}
	$json = specDbsPeople_Real_getData( $post_data ) ;
	
	$cols = array() ;
	$cols[] = 'date_sql' ;
	$cols[] = 'whse_txt' ;
	$cols[] = 'team_txt' ;
	$cols[] = 'std_role_txt' ;
	$cols[] = 'contract_txt' ;
	$cols[] = 'people_code' ;
	$cols[] = 'people_name' ;
	$cols[] = 'is_real' ;
	$cols[] = 'ROLE_code' ;
	$cols[] = 'ROLE_length' ;
	$cols[] = 'ABS_code' ;
	$cols[] = 'ABS_length' ;
	$RET_columns = array() ;
	foreach( $cols as $col ) {
		$RET_columns[] = array('dataIndex'=>$col,'dataType'=>'string','text'=>$col) ;
	}
	
	$RET_data = array() ;
	foreach( $json['data'] as $record ) {
		$RET_data_row_base = array() ;
		$RET_data_row_base['date_sql'] = $record['date_sql'] ;
		$RET_data_row_base['whse_code'] = $record['std_whse_code'] ;
		$RET_data_row_base['team_code'] = $record['std_team_code'] ;
		$RET_data_row_base['std_role_code'] = $record['std_role_code'] ;
		$RET_data_row_base['contract_code'] = $record['std_contract_code'] ;
		$RET_data_row_base['people_code'] = $record['people_code'] ;
		$RET_data_row_base['people_name'] = $record['people_name'] ;
		
		if( $record['status_isVirtual'] ) {
			if( $record['std_daylength'] == 0 ) {
				continue ;
			}
			
			$RET_data_row = $RET_data_row_base ;
			$RET_data_row['is_real'] = '' ;
			if( $record['std_abs_code'][0] == '_' ) {
				$RET_data_row['ROLE_code'] = $record['std_role_code'] ;
				$RET_data_row['ROLE_length'] = (float)$record['std_daylength'] ;
			} else {
				$RET_data_row['ABS_code'] = $record['std_abs_code'] ;
				$RET_data_row['ABS_length'] = (float)$record['std_daylength'] ;
			}
			specDbsPeople_query_getTableResult_CEQOLD_makeRow($RET_data_row,$cfg_bibles_idText) ;
			$RET_data[] = $RET_data_row ;
			continue ;
		}
		
		$RET_data_row_base['is_real'] = 'X' ;
		foreach( $record['works'] as $record_work ) {
			$RET_data_row = $RET_data_row_base ;
			$RET_data_row['ROLE_code'] = $record_work['role_code'] ;
			$RET_data_row['ROLE_length'] = (float)$record_work['role_length'] ;
			if( $record_work['alt_whse_code'] ) {
				$RET_data_row['whse_code'] = $record_work['alt_whse_code'] ;
			}
			specDbsPeople_query_getTableResult_CEQOLD_makeRow($RET_data_row,$cfg_bibles_idText) ;
			$RET_data[] = $RET_data_row ;
		}
		foreach( $record['abs'] as $record_abs ) {
			$RET_data_row = $RET_data_row_base ;
			$RET_data_row['ABS_code'] = $record_abs['abs_code'] ;
			$RET_data_row['ABS_length'] = (float)$record_abs['abs_length'] ;
			specDbsPeople_query_getTableResult_CEQOLD_makeRow($RET_data_row,$cfg_bibles_idText) ;
			$RET_data[] = $RET_data_row ;
		}
	}
	
	usort($RET_data,'specDbsPeople_query_getTableResult_CEQLIST_sort') ;

	return array('columns'=>$RET_columns,'data'=>$RET_data) ;
}
function specDbsPeople_query_getTableResult_CEQOLD_makeRow( &$data_row, $cfg_bibles_idText ) {
	$data_row['whse_txt'] = $cfg_bibles_idText['WHSE'][$data_row['whse_code']] ;
	$data_row['team_txt'] = $cfg_bibles_idText['TEAM'][$data_row['team_code']] ;
	$data_row['std_role_txt'] = $cfg_bibles_idText['ROLE'][$data_row['std_role_code']] ;
	$data_row['contract_txt'] = $cfg_bibles_idText['CONTRACT'][$data_row['contract_code']] ;
}
function specDbsPeople_query_getTableResult_CEQLIST( $date_start, $date_end, $filters=NULL ) {
	$ttmp = specDbsPeople_cfg_getCfgBibles() ;
	$cfg_bibles = $ttmp['data'] ;
	$cfg_bibles_idText = array() ;
	foreach( $cfg_bibles as $bible_code => $cfg_bible ) {
		$cfg_bibles_idText[$bible_code] = array() ;
		foreach( $cfg_bible as $row ) {
			$cfg_bibles_idText[$bible_code][$row['id']] = $row['text'] ;
		}
	}
	
	$ttmp = specDbsPeople_cfg_getPeopleCalcAttributes() ;
	$cfg_calcAttributes = $ttmp['data'] ;
	
	$post_data = array() ;
	$post_data['date_start'] = $date_start ;
	$post_data['date_end'] = $date_end ;
	if( $filters ) {
		$post_data += $filters ;
	}
	$json = specDbsPeople_Real_getData( $post_data ) ;
	
	$cols = $cols_toCopy = $cols_toDecode = array() ;
	$cols[] = 'date_sql' ;
	$cols[] = 'std_whse_code' ;
	$cols[] = 'std_whse_txt' ;
	$cols[] = 'std_team_code' ;
	$cols[] = 'std_team_txt' ;
	$cols[] = 'std_role_code' ;
	$cols[] = 'std_role_txt' ;
	$cols[] = 'std_contract_code' ;
	$cols[] = 'std_contract_txt' ;
	$cols[] = 'people_code' ;
	$cols[] = 'people_name' ;
	foreach( specDbsPeople_lib_peopleFields_getPeopleFields() as $peopleField ) {
		$cols[] = $peopleField['field'] ;
		if( $peopleField['type'] == 'link' ) {
			$cols_toDecode[] = $peopleField['field'] ;
		} else {
			$cols_toCopy[] = $peopleField['field'] ;
		}
	}
	$cols[] = 'std_daylength_min' ;
	$cols[] = 'std_daylength' ;
	$cols[] = 'std_daylength_max' ;
	$cols[] = 'is_real' ;
	$cols[] = 'ROLE_alt_whse_code' ;
	$cols[] = 'ROLE_alt_whse_txt' ;
	$cols[] = 'ROLE_CLI_code' ;
	$cols[] = 'ROLE_CLI_txt' ;
	$cols[] = 'ROLE_code' ;
	$cols[] = 'ROLE_txt' ;
	$cols[] = 'ROLE_length' ;
	$cols[] = 'ABS_code' ;
	$cols[] = 'ABS_txt' ;
	$cols[] = 'ABS_length' ;
	$RET_columns = array() ;
	foreach( $cols as $col ) {
		switch( $col ) {
			case 'date_sql' :
				$dataType = 'date' ;
				break ;
				
			case 'std_daylength_min' :
			case 'std_daylength' :
			case 'std_daylength_max' :
			case 'ROLE_length' :
			case 'ABS_length' :
				$dataType = 'number' ;
				break ;
				
			default :
				$dataType = 'string' ;
				break ;
		}
		$RET_columns[] = array('dataIndex'=>$col,'dataType'=>$dataType,'text'=>$col) ;
	}
	
	$RET_data = array() ;
	foreach( $json['data'] as $record ) {
		$RET_data_row_base = array() ;
		$RET_data_row_base['date_sql'] = $record['date_sql'] ;
		$RET_data_row_base['std_whse_code'] = $record['std_whse_code'] ;
		$RET_data_row_base['std_team_code'] = $record['std_team_code'] ;
		$RET_data_row_base['std_role_code'] = $record['std_role_code'] ;
		$RET_data_row_base['std_contract_code'] = $record['std_contract_code'] ;
		$RET_data_row_base['people_code'] = $record['people_code'] ;
		$RET_data_row_base['people_name'] = $record['people_name'] ;
		foreach( $cols_toCopy as $col ) {
			if( isset($record['fields'][$col]) ) {
				$RET_data_row_base[$col] = $record['fields'][$col] ;
			}
		}
		foreach( $cols_toDecode as $col ) {
			if( is_array($record['fields'][$col]) ) {
				$RET_data_row_base[$col] = $record['fields'][$col]['text'] ;
			}
		}
		$RET_data_row_base['std_daylength_min'] = (float)$record['std_daylength_min'] ;
		$RET_data_row_base['std_daylength'] = (float)$record['std_daylength'] ;
		$RET_data_row_base['std_daylength_max'] = (float)$record['std_daylength_max'] ;
		
		if( $record['status_isVirtual'] ) {
			if( $record['std_daylength'] == 0 ) {
				continue ;
			}
			
			$RET_data_row = $RET_data_row_base ;
			$RET_data_row['is_real'] = '' ;
			if( $record['std_abs_code'][0] == '_' ) {
				$RET_data_row['ROLE_code'] = $record['std_role_code'] ;
				$RET_data_row['ROLE_length'] = (float)$record['std_daylength'] ;
			} else {
				$RET_data_row['ABS_code'] = $record['std_abs_code'] ;
				$RET_data_row['ABS_length'] = (float)$record['std_daylength'] ;
			}
			specDbsPeople_query_getTableResult_CEQLIST_makeRow($RET_data_row,$cfg_bibles_idText) ;
			$RET_data[] = $RET_data_row ;
			continue ;
		}
		
		$RET_data_row_base['is_real'] = 'X' ;
		foreach( $record['works'] as $record_work ) {
			$RET_data_row = $RET_data_row_base ;
			$RET_data_row['ROLE_CLI_code'] = $record_work['cli_code'] ;
			$RET_data_row['ROLE_code'] = $record_work['role_code'] ;
			$RET_data_row['ROLE_length'] = (float)$record_work['role_length'] ;
			if( $record_work['alt_whse_code'] ) {
				$RET_data_row['ROLE_alt_whse_code'] = $record_work['alt_whse_code'] ;
			}
			specDbsPeople_query_getTableResult_CEQLIST_makeRow($RET_data_row,$cfg_bibles_idText) ;
			$RET_data[] = $RET_data_row ;
		}
		foreach( $record['abs'] as $record_abs ) {
			$RET_data_row = $RET_data_row_base ;
			$RET_data_row['ABS_code'] = $record_abs['abs_code'] ;
			$RET_data_row['ABS_length'] = (float)$record_abs['abs_length'] ;
			specDbsPeople_query_getTableResult_CEQLIST_makeRow($RET_data_row,$cfg_bibles_idText) ;
			$RET_data[] = $RET_data_row ;
		}
	}
	
	if( $filters['filter_cli_code'] != NULL ) {
		$filter_cli_code = $filters['filter_cli_code'] ;
		$RET_data_new = array() ;
		foreach( $RET_data as $RET_data_row ) {
			if( $filter_cli_code != $RET_data_row['ROLE_CLI_code'] ) {
				continue ;
			}
			$RET_data_new[] = $RET_data_row ;
		}
		$RET_data = $RET_data_new ;
	}
	
	usort($RET_data,'specDbsPeople_query_getTableResult_CEQLIST_sort') ;

	return array('columns'=>$RET_columns,'data'=>$RET_data) ;
}
function specDbsPeople_query_getTableResult_CEQLIST_makeRow( &$data_row, $cfg_bibles_idText ) {
	$data_row['std_whse_txt'] = $cfg_bibles_idText['WHSE'][$data_row['std_whse_code']] ;
	$data_row['std_team_txt'] = $cfg_bibles_idText['TEAM'][$data_row['std_team_code']] ;
	$data_row['std_role_txt'] = ( $data_row['std_role_code'] ? substr($cfg_bibles_idText['ROLE'][$data_row['std_role_code']],strlen($data_row['std_role_code'])+3) : '' ) ;
	$data_row['std_contract_txt'] = $cfg_bibles_idText['CONTRACT'][$data_row['std_contract_code']] ;
	$data_row['ROLE_alt_whse_txt'] = $cfg_bibles_idText['WHSE'][$data_row['ROLE_alt_whse_code']] ;
	$data_row['ROLE_CLI_txt'] = ( $data_row['ROLE_CLI_code'] ? $cfg_bibles_idText['CLI'][$data_row['ROLE_CLI_code']] : '' ) ;
	$data_row['ROLE_txt'] = ( $data_row['ROLE_code'] ? substr($cfg_bibles_idText['ROLE'][$data_row['ROLE_code']],strlen($data_row['ROLE_code'])+3) : '' ) ;
	$data_row['ABS_txt'] = ( $data_row['ABS_code'] ? substr($cfg_bibles_idText['ABS'][$data_row['ABS_code']],strlen($data_row['ABS_code'])+3) : '' ) ;
}
function specDbsPeople_query_getTableResult_CEQLIST_sort( $dataRow_1, $dataRow_2 ) {
	$cmp = strcmp($dataRow_1['date_sql'],$dataRow_2['date_sql']) ;
	if( $cmp != 0 ) {
		return $cmp ;
	}
	
	$cmp = strcmp($dataRow_1['people_name'],$dataRow_2['people_name']) ;
	if( $cmp != 0 ) {
		return $cmp ;
	}
	
	return 0 ;
}

function specDbsPeople_query_getTableResult_ITMNC( $date_start, $date_end, $filters=NULL ) {
	$ttmp = specDbsPeople_cfg_getCfgBibles() ;
	$cfg_bibles = $ttmp['data'] ;
	$cfg_bibles_idText = array() ;
	foreach( $cfg_bibles as $bible_code => $cfg_bible ) {
		$cfg_bibles_idText[$bible_code] = array() ;
		foreach( $cfg_bible as $row ) {
			$cfg_bibles_idText[$bible_code][$row['id']] = $row['text'] ;
		}
	}
	
	$post_data = array() ;
	$post_data['_load_calcAttributes'] = false ;
	if( $filters ) {
		$post_data += $filters ;
	}
	$json = specDbsPeople_RH_getGrid( $post_data ) ;
	$data = $json['data'] ;
	
	$TAB_peopleCode_arrDatesNC = specDbsPeople_lib_calc_getInterimNC( $date_start, $date_end ) ;
	
	$cols = $cols_toDecode = array() ;
	$cols[] = 'whse_txt' ;
	$cols[] = 'team_txt' ;
	$cols[] = 'role_txt' ;
	$cols[] = 'contract_txt' ;
	$cols[] = 'people_code' ;
	$cols[] = 'people_name' ;
	foreach( specDbsPeople_lib_peopleFields_getPeopleFields() as $peopleField ) {
		$cols[] = $peopleField['field'] ;
		if( $peopleField['type'] == 'link' ) {
			$cols_toDecode[] = $peopleField['field'] ;
		}
	}
	$arr_dates = array() ;
	$cur_date = date('Y-m-d',strtotime($date_start)) ;
	while( strtotime($cur_date) <= strtotime($date_end) ) {
		//$col_key = 'date_'.date('Ymd',strtotime($cur_date)) ;
		$col_key = $cur_date ;
		$cols[] = $col_key ;
		$arr_dates[$cur_date] = $col_key ;
		$cur_date = date('Y-m-d',strtotime('+1 day',strtotime($cur_date))) ;
	}
	
	$RET_columns = array() ;
	foreach( $cols as $col ) {
		$RET_columns[] = array('dataIndex'=>$col,'dataType'=>'string','text'=>$col) ;
	}
	
	$RET_data = array() ;
	foreach( $data as $data_row ) {
		$people_code = $data_row['people_code'] ;
		if( !isset($TAB_peopleCode_arrDatesNC[$people_code]) ) {
			continue ;
		}
		
		foreach( $cols_toDecode as $col ) {
			if( is_array($data_row[$col]) ) {
				$data_row[$col] = $data_row[$col]['text'] ;
			}
		}
		
		$data_row['whse_txt'] = $cfg_bibles_idText['WHSE'][$data_row['whse_code']] ;
		$data_row['team_txt'] = $cfg_bibles_idText['TEAM'][$data_row['team_code']] ;
		$data_row['role_txt'] = $cfg_bibles_idText['ROLE'][$data_row['role_code']] ;
		$data_row['contract_txt'] = $cfg_bibles_idText['CONTRACT'][$data_row['contract_code']] ;
		
		foreach( $arr_dates as $date_sql=>$col_key ) {
			$data_row[$col_key] = ( $TAB_peopleCode_arrDatesNC[$people_code][$date_sql] ? 'X' : '' ) ;
		}
		
		$RET_data[] = $data_row ;
	}

	return array('columns'=>$RET_columns,'data'=>$RET_data) ;
}





function specDbsPeople_query_getQueryResult( $post_data ) {
	global $_opDB ;
	
	$form_data = json_decode($post_data['data'],true) ;
	
	$querysrc_id = $form_data['querysrc_id'] ;
		$query = "SELECT query_id FROM query WHERE query_id IN (SELECT target_query_id FROM input_query_src WHERE querysrc_id LIKE '{$querysrc_id}')";
		$q_id = $_opDB->query_uniqueValue($query) ;
		if( !$q_id ) {
			return array('success'=>false) ;
		}
	
	$arr_saisie = array() ;
	paracrm_queries_builderTransaction_init( array('query_id'=>$q_id) , $arr_saisie ) ;
	
	
	// eval params
	$query_vars = array() ;
	$query_vars['date_start'] = $form_data['date_start'] ;
	$query_vars['date_end'] = $form_data['date_end'] ;
	$query_vars['q_name'] = $_opDB->query_uniqueValue("SELECT query_name FROM query WHERE query_id='{$q_id}'") ;
	
	
	// replace conditions
	foreach( $arr_saisie['fields_where'] as &$field_where ) {
		//print_r($field_mwhere) ;
		if( $field_where['field_type'] == 'date' ) {
			$field_where['condition_date_lt'] = $query_vars['date_end'] ;
			$field_where['condition_date_gt'] = $query_vars['date_start'] ;
		}
	}
	unset($field_where) ;
	
	
	//print_r($arr_saisie['fields_where']) ;
	// Exec requete
	$RES = paracrm_queries_process_query($arr_saisie , FALSE ) ;
	//print_r($RES) ;
	
	$tabs = array() ;
	foreach( $RES['RES_labels'] as $tab_id => $dummy )
	{
		$tab = array() ;
		$tab['tab_title'] = $dummy['tab_title'] ;
		$tab['cfg_doTreeview'] = ($RES['RES_titles']['cfg_doTreeview'] == TRUE) ;
		$tab = $tab + paracrm_queries_paginate_getGrid( $RES, $tab_id ) ;
		
		if( !$tab['data'] ) {
			continue ;
		}
		
		if( $tab['cfg_doTreeview'] ) {
			$tab['data_root'] = paracrm_queries_paginate_buildTree( $tab['data'] ) ;
		}
		
		$tabs[$tab_id] = $tab ;
	}
	if( $tabs ) {
		return array('success'=>true, 'query_vars'=>$query_vars , 'result_tab'=>$tabs[0]) ;
	}
	return array('success'=>true) ;
}


function specDbsPeople_query_exportXLS( $post_data ) {
	global $_opDB ;
	$data = json_decode($post_data['data'],true) ;
	
	$workbook_tab_grid = array() ;
	foreach( $data as $panel ) {
		$tab = $panel['result_tab'] ;
		$tab['tab_title'] = str_replace(' ','_',preg_replace("/[^a-zA-Z0-9\s]/", "", $panel['query_vars']['q_name'])) ;
		$workbook_tab_grid[] = $tab ;
	}
	
	$objPHPExcel = paracrm_queries_xls_build( $workbook_tab_grid ) ;
	if( !$objPHPExcel ) {
		die() ;
	}
	
	$tmpfilename = tempnam( sys_get_temp_dir(), "FOO");
	$objWriter = PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel2007');
	$objWriter->save($tmpfilename);
	$objPHPExcel->disconnectWorksheets();
	unset($objPHPExcel) ;
	
	$filename = 'DbsPeople_Query'.'_'.time().'.xlsx' ;
	header("Content-Type: application/force-download; name=\"$filename\""); 
	header("Content-Disposition: attachment; filename=\"$filename\""); 
	readfile($tmpfilename) ;
	unlink($tmpfilename) ;
	die() ;
}


function specDbsPeople_query_getResultXLS( $post_data ) {
	specDbsPeople_query_exportXLS( array('data'=>json_encode(array( specDbsPeople_query_getResult($post_data) ))) ) ;
}
?>