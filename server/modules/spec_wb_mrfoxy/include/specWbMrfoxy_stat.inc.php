<?php

function specWbMrfoxy_stat_performance_getResult( $post_data ) {
	global $_opDB ;
	$form_data = json_decode($post_data['data'],true) ;
	
	$q_id = 'Stat::Performance' ;
	if( !is_numeric($q_id) ) {
		$query = "SELECT qmerge_id FROM qmerge WHERE qmerge_name LIKE '{$q_id}'";
		$q_id = $_opDB->query_uniqueValue($query) ;
		if( !$q_id ) {
			return array('success'=>false) ;
		}
	}
	
	$arr_saisie = array() ;
	paracrm_queries_mergerTransaction_init( array('qmerge_id'=>$q_id) , $arr_saisie ) ;
	
	// replace conditions
	$query_vars = array() ;
	$query_vars['time_mode'] = $form_data['time_mode'] ;
	$query_vars['break_date'] = $form_data['break_date'] ;
	foreach( $arr_saisie['fields_mwhere'] as &$field_mwhere ) {
		//print_r($field_mwhere) ;
		if( $field_mwhere['mfield_type'] == 'link' && $field_mwhere['mfield_linkbible'] == '_COUNTRY' && $form_data['country_code'] ) {
			$field_mwhere['condition_bible_entries'] = $form_data['country_code'] ;
			$query_vars['country_code'] = $form_data['country_code'] ;
			$query_vars['country_text'] = $_opDB->query_uniqueValue("SELECT field_COUNTRY_NAME FROM view_bible__COUNTRY_entry WHERE entry_key='{$form_data['country_code']}'") ;
		}
		if( $field_mwhere['mfield_type'] == 'link' && $field_mwhere['mfield_linkbible'] == 'IRI_STORE' && $form_data['store_code'] ) {
			$field_mwhere['condition_bible_treenodes'] = json_encode(array($form_data['store_code'])) ;
			$query_vars['store_code'] = $form_data['store_code'] ;
			$query_vars['store_text'] = $_opDB->query_uniqueValue("SELECT field_STOREGROUP_TXT FROM view_bible_IRI_STORE_tree WHERE treenode_key='{$form_data['store_code']}'") ;
		}
		if( $field_mwhere['mfield_type'] == 'link' && $field_mwhere['mfield_linkbible'] == 'IRI_PROD' && $form_data['prod_code'] ) {
			$field_mwhere['condition_bible_treenodes'] = json_encode(array($form_data['prod_code'])) ;
			$query_vars['prod_code'] = $form_data['prod_code'] ;
			$query_vars['prod_text'] = $_opDB->query_uniqueValue("SELECT field_PRODGROUPTXT FROM view_bible_IRI_PROD_tree WHERE treenode_key='{$form_data['prod_code']}'") ;
		}
	}
	unset($field_mwhere) ;
	
	// Exec requete
	$RES = paracrm_queries_process_qmerge($arr_saisie , FALSE ) ;
	
	$tabs = array() ;
	foreach( $RES['RES_labels'] as $tab_id => $dummy )
	{
		$tab = array() ;
		$tab['tab_title'] = $dummy['tab_title'] ;
		$tab['cfg_doTreeview'] = ($RES['RES_titles']['cfg_doTreeview'] == TRUE) ;
		$tab = $tab + paracrm_queries_mpaginate_getGrid( $RES, $tab_id ) ;
		
		if( !$tab['data'] ) {
			continue ;
		}
		
		if( $tab['cfg_doTreeview'] ) {
			$tab['data_root'] = paracrm_queries_mpaginate_buildTree( $tab['data'] ) ;
		}
		
		$tabs[$tab_id] = $tab ;
	}
	if( $tabs ) {
		return array('success'=>true, 'query_vars'=>$query_vars , 'result_tab'=>$tabs[0]) ;
	}
	return array('success'=>true) ;
}

function specWbMrfoxy_stat_exportXLS( $post_data ) {
	global $_opDB ;
	$data = json_decode($post_data['data'],true) ;
	
	$workbook_tab_grid = array() ;
	foreach( $data as $panel ) {
		$tab = $panel['result_tab'] ;
		$tab['tab_title'] = $panel['title'] ;
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
	
	$filename = 'MrFoxy_StatPerformance'.'_'.time().'.xlsx' ;
	header("Content-Type: application/force-download; name=\"$filename\""); 
	header("Content-Disposition: attachment; filename=\"$filename\""); 
	readfile($tmpfilename) ;
	unlink($tmpfilename) ;
	die() ;
	
	
}
?>