<?php

function specDbsPeople_query_getLibrary() {
	global $_opDB ;
	
	$TAB = array() ;
	
	$TAB[] = array('querysrc_id'=>'0:RH', 'q_name'=>'RH : Base People', 'params_hidden'=>true ) ;
	$TAB[] = array('querysrc_id'=>'0:CEQ_GRID', 'q_name'=>'CEQ : Vue people/dates') ;
	$TAB[] = array('querysrc_id'=>'0:CEQ_LIST', 'q_name'=>'CEQ : Extract lignes') ;
	$TAB[] = array('querysrc_id'=>'0:ITM_NC', 'q_name'=>'Interim : NC') ;
	
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
	$ttmp = explode(':',$form_data['querysrc_id']) ;
	switch( $ttmp[1] ) {
		case 'RH' :
			return specDbsPeople_query_getTableResult_RH() ;
			break ;
		case 'CEQ_GRID' :
			return specDbsPeople_query_getTableResult_CEQGRID($form_data['date_start'],$form_data['date_end']) ;
			break ;
		case 'CEQ_LIST' :
			return specDbsPeople_query_getTableResult_CEQLIST($form_data['date_start'],$form_data['date_end']) ;
			break ;
		case 'ITM_NC' :
			return specDbsPeople_query_getTableResult_ITMNC($form_data['date_start'],$form_data['date_end']) ;
			break ;
	}
}

function specDbsPeople_query_getTableResult_RH() {
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
	
	$json = specDbsPeople_RH_getGrid( array('_load_calcAttributes'=>true) ) ;
	$data = $json['data'] ;
	
	$cols = array() ;
	$cols[] = 'whse_txt' ;
	$cols[] = 'team_txt' ;
	$cols[] = 'role_txt' ;
	$cols[] = 'contract_txt' ;
	$cols[] = 'people_code' ;
	$cols[] = 'people_name' ;
	$cols[] = 'people_techid' ;
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

	return array(
		'success'=>true,
		'query_vars'=>array('q_name'=>'RH : Base People'),
		'result_tab'=>array('columns'=>$RET_columns,'data'=>$RET_data)
	) ;
}

function specDbsPeople_query_getTableResult_CEQGRID( $date_start, $date_end ) {
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
	
	$json = specDbsPeople_Real_getData( array('date_start'=>$date_start, 'date_end'=>$date_end) ) ;
	
	$cols = array() ;
	$cols[] = 'whse_txt' ;
	$cols[] = 'team_txt' ;
	$cols[] = 'std_role_txt' ;
	$cols[] = 'contract_txt' ;
	$cols[] = 'people_code' ;
	$cols[] = 'people_name' ;
	$cols[] = 'people_techid' ;
	$arr_dates = array() ;
	$cur_date = date('Y-m-d',strtotime($date_start)) ;
	while( strtotime($cur_date) <= strtotime($date_end) ) {
		//$col_key = 'date_'.date('Ymd',strtotime($cur_date)) ;
		$col_key = $cur_date ;
		$cols[] = $col_key.'/Role' ;
		$cols[] = $col_key.'/Durée' ;
		$cur_date = date('Y-m-d',strtotime('+1 day',strtotime($cur_date))) ;
		$arr_dates[$cur_date] = $col_key ;
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

	return array(
		'success'=>true,
		'query_vars'=>array('q_name'=>'CEQ : Vue people/dates'),
		'result_tab'=>array('columns'=>$RET_columns,'data'=>$RET_data)
	) ;
}

function specDbsPeople_query_getTableResult_CEQLIST( $date_start, $date_end ) {
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
	
	$json = specDbsPeople_Real_getData( array('date_start'=>$date_start, 'date_end'=>$date_end) ) ;
	
	$cols = array() ;
	$cols[] = 'date_sql' ;
	$cols[] = 'whse_txt' ;
	$cols[] = 'team_txt' ;
	$cols[] = 'std_role_txt' ;
	$cols[] = 'contract_txt' ;
	$cols[] = 'people_code' ;
	$cols[] = 'people_name' ;
	$cols[] = 'people_techid' ;
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
		$RET_data_row_base['people_techid'] = $record['people_techid'] ;
		
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
			$RET_data_row['ROLE_code'] = $record_work['role_code'] ;
			$RET_data_row['ROLE_length'] = (float)$record_work['role_length'] ;
			if( $record_work['alt_whse_code'] ) {
				$RET_data_row['whse_code'] = $record_work['alt_whse_code'] ;
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
	
	usort($RET_data,'specDbsPeople_query_getTableResult_CEQLIST_sort') ;

	return array(
		'success'=>true,
		'query_vars'=>array('q_name'=>'CEQ : Extract lignes'),
		'result_tab'=>array('columns'=>$RET_columns,'data'=>$RET_data)
	) ;
}
function specDbsPeople_query_getTableResult_CEQLIST_makeRow( &$data_row, $cfg_bibles_idText ) {
	$data_row['whse_txt'] = $cfg_bibles_idText['WHSE'][$data_row['whse_code']] ;
	$data_row['team_txt'] = $cfg_bibles_idText['TEAM'][$data_row['team_code']] ;
	$data_row['std_role_txt'] = $cfg_bibles_idText['ROLE'][$data_row['std_role_code']] ;
	$data_row['contract_txt'] = $cfg_bibles_idText['CONTRACT'][$data_row['contract_code']] ;
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

function specDbsPeople_query_getTableResult_ITMNC( $date_start, $date_end ) {
	$ttmp = specDbsPeople_cfg_getCfgBibles() ;
	$cfg_bibles = $ttmp['data'] ;
	$cfg_bibles_idText = array() ;
	foreach( $cfg_bibles as $bible_code => $cfg_bible ) {
		$cfg_bibles_idText[$bible_code] = array() ;
		foreach( $cfg_bible as $row ) {
			$cfg_bibles_idText[$bible_code][$row['id']] = $row['text'] ;
		}
	}
	
	$json = specDbsPeople_RH_getGrid( array('_load_calcAttributes'=>false) ) ;
	$data = $json['data'] ;
	
	$TAB_peopleCode_arrDatesNC = specDbsPeople_lib_calc_getInterimNC( $date_start, $date_end ) ;
	
	$cols = array() ;
	$cols[] = 'whse_txt' ;
	$cols[] = 'team_txt' ;
	$cols[] = 'role_txt' ;
	$cols[] = 'contract_txt' ;
	$cols[] = 'people_txtitm' ;
	$cols[] = 'people_code' ;
	$cols[] = 'people_name' ;
	$cols[] = 'people_techid' ;
	$arr_dates = array() ;
	$cur_date = date('Y-m-d',strtotime($date_start)) ;
	while( strtotime($cur_date) <= strtotime($date_end) ) {
		//$col_key = 'date_'.date('Ymd',strtotime($cur_date)) ;
		$col_key = $cur_date ;
		$cols[] = $col_key ;
		$cur_date = date('Y-m-d',strtotime('+1 day',strtotime($cur_date))) ;
		$arr_dates[$cur_date] = $col_key ;
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
		
		$data_row['whse_txt'] = $cfg_bibles_idText['WHSE'][$data_row['whse_code']] ;
		$data_row['team_txt'] = $cfg_bibles_idText['TEAM'][$data_row['team_code']] ;
		$data_row['role_txt'] = $cfg_bibles_idText['ROLE'][$data_row['role_code']] ;
		$data_row['contract_txt'] = $cfg_bibles_idText['CONTRACT'][$data_row['contract_code']] ;
		
		foreach( $arr_dates as $date_sql=>$col_key ) {
			$data_row[$col_key] = ( $TAB_peopleCode_arrDatesNC[$people_code][$date_sql] ? 'X' : '' ) ;
		}
		
		$RET_data[] = $data_row ;
	}

	return array(
		'success'=>true,
		'query_vars'=>array('q_name'=>'Interim : NC'),
		'result_tab'=>array('columns'=>$RET_columns,'data'=>$RET_data)
	) ;
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
	foreach( $data as $idx => $panel ) {
		$objPHPExcel->setActiveSheetIndex($idx);
		$objWorksheet = $objPHPExcel->getActiveSheet();
		
		
		$queryVars = $panel['query_vars'] ;
		$header_table = array() ;
			$header_table[] = array(
				'fieldLabel' => 'Titre',
				'fieldValue' => $queryVars['q_name']
			) ;
		if( $queryVars['date_start'] && $queryVars['date_end'] ) {
			$header_table[] = array(
				'fieldLabel' => 'Dates',
				'fieldValue' => $queryVars['date_start'].' >> '.$queryVars['date_end']
			) ;
		}
		
		$objWorksheet->insertNewRowBefore(1, count($header_table)+1);
		$row = 1 ;
		foreach( $header_table as $header_row ) {
			$objWorksheet->SetCellValue("A{$row}", $header_row['fieldLabel'] );
			$objWorksheet->getStyle("B{$row}")->getFont()->setBold(TRUE);
			$objWorksheet->SetCellValue("B{$row}", $header_row['fieldValue'] );
			$row++ ;
		}
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
?>