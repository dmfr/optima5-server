<?php

function specDbsPeople_query_getLibrary() {
	global $_opDB ;
	
	$TAB = array() ;
	
	$TAB[] = array('querysrc_id'=>'0:RH', 'q_name'=>'RH : Base People') ;
	
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