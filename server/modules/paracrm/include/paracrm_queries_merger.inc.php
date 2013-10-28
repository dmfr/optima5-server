<?php
function paracrm_queries_mergerTransaction( $post_data )
{
	if( $post_data['_action'] == 'queries_mergerTransaction' && $post_data['_subaction'] == 'init' )
	{
		// ouverture transaction
		$transaction_id = $_SESSION['next_transaction_id']++ ;
		
		$_SESSION['transactions'][$transaction_id] = array() ;
		$_SESSION['transactions'][$transaction_id]['transaction_code'] = 'paracrm_queries_mergerTransaction' ;
		
		$arr_saisie = array() ;
		$arr_saisie['target_file_code'] = $post_data['target_file_code'] ;
		$_SESSION['transactions'][$transaction_id]['arr_saisie'] = $arr_saisie ;
		$_SESSION['transactions'][$transaction_id]['arr_RES'] = array() ;
		
		$post_data['_transaction_id'] = $transaction_id ;
	}
	
	
	if( $post_data['_action'] == 'queries_mergerTransaction' && $post_data['_transaction_id'] )
	{
		if( !$_SESSION['transactions'][$post_data['_transaction_id']] )
			return NULL ;
		$transaction_id = $post_data['_transaction_id'] ;
		$arr_transaction = $_SESSION['transactions'][$transaction_id] ;
		if( $arr_transaction['transaction_code'] != 'paracrm_queries_mergerTransaction' )
			return NULL ;
			
		$arr_saisie = $arr_transaction['arr_saisie'] ;
		
		if( $post_data['_subaction'] == 'init' )
		{
			$json =  paracrm_queries_mergerTransaction_init( $post_data , $arr_saisie ) ;
		}
		if( $post_data['_subaction'] == 'run' )
		{
			$json =  paracrm_queries_mergerTransaction_runQuery( $post_data , $arr_saisie ) ;
		}
		if( $post_data['_subaction'] == 'submit' )
		{
			$json =  paracrm_queries_mergerTransaction_submit( $post_data , $arr_saisie ) ;
		}
		if( $post_data['_subaction'] == 'save' || $post_data['_subaction'] == 'saveas' || $post_data['_subaction'] == 'delete' )
		{
			$json =  paracrm_queries_mergerTransaction_save( $post_data , $arr_saisie ) ;
		}
		if( $post_data['_subaction'] == 'toggle_publish' )
		{
			$json =  paracrm_queries_mergerTransaction_togglePublish( $post_data , $arr_saisie ) ;
			if( $json['success'] ) {
				paracrm_queries_organizePublish() ;
			}
		}
		
		
		
		if( $post_data['_subaction'] == 'res_get' )
		{
			$json =  paracrm_queries_mergerTransaction_resGet( $post_data ) ;
		}
		if( $post_data['_subaction'] == 'exportXLS' )
		{
			$json =  paracrm_queries_mergerTransaction_exportXLS( $post_data , $arr_saisie ) ;
		}
		
		switch( $post_data['_subaction'] ) {
			case 'chart_cfg_load' :
				if( !$arr_saisie['qmerge_id'] ) {
					$json = array('success'=>true,'enabled'=>false) ;
					break ;
				}
				$arr_QueryResultChartModel = paracrm_queries_charts_cfgLoad('qmerge',$arr_saisie['qmerge_id']) ;
				if( !is_array($arr_QueryResultChartModel) ) {
					$json = array('success'=>true,'enabled'=>false) ;
					break ;
				}
				$json = array(
					'success'=>true,
					'enabled'=>true,
					'arr_QueryResultChartModel'=>$arr_QueryResultChartModel
				) ;
				break ;
			case 'chart_cfg_save' :
				if( !$arr_saisie['qmerge_id'] ) {
					$json = array('success'=>true) ;
					break ;
				}
				$arr_QueryResultChartModel = json_decode($post_data['arr_QueryResultChartModel'],true) ;
				paracrm_queries_charts_cfgSave('qmerge',$arr_saisie['qmerge_id'],$arr_QueryResultChartModel) ;
				$json = array('success'=>true) ;
				break ;
			case 'chart_tab_getSeries' :
				$transaction_id ;
				$RES_id = $post_data['RES_id'] ;
				$RES = $_SESSION['transactions'][$transaction_id]['arr_RES'][$RES_id] ;
				if( !$RES ) {
					$json = array('success'=>false) ;
					break ;
				}
				
				$queryResultChartModel = json_decode($post_data['queryResultChartModel'],true) ;
				
				$RESchart = paracrm_queries_charts_getResChart($RES,$queryResultChartModel) ;
				$json = array('success'=>true,'RESchart'=>$RESchart) ;
				break ;
		}
		
		

		if( is_array($arr_saisie) )
		{
			$_SESSION['transactions'][$transaction_id]['arr_saisie'] = $arr_saisie ;
		}
		else
		{
			unset($_SESSION['transactions'][$transaction_id]) ;
		}
		
		return $json ;
	}
}

function paracrm_queries_mergerTransaction_init( $post_data , &$arr_saisie )
{
	global $_opDB ;
	
	/*
	************ INITIALISATION *********
	- bible des QUERIES existantes
	- remplissage des champs
	*******************************
	*/
	if( $post_data['is_new'] == 'true' )
	{
		$arr_saisie['arr_query_id'] = array() ;
		$arr_saisie['fields_mwhere'] = array() ;
		$arr_saisie['fields_mselect'] = array() ;
	}
	elseif( $post_data['qmerge_id'] > 0 )
	{
		$query = "SELECT * FROM qmerge WHERE qmerge_id='{$post_data['qmerge_id']}'" ;
		$result = $_opDB->query($query) ;
		$arr = $_opDB->fetch_assoc($result) ;
		if( !$arr )
		{
			$transaction_id = $post_data['_transaction_id'] ;
			unset($_SESSION['transactions'][$transaction_id]) ;
			return array('success'=>false) ;
		}
		$arr_saisie['qmerge_id'] = $arr['qmerge_id'] ;
		$arr_saisie['qmerge_name'] = $arr['qmerge_name'] ;
		paracrm_queries_mergerTransaction_loadFields( $arr_saisie , $arr_saisie['qmerge_id'] ) ;
	}
	else
	{
		$transaction_id = $post_data['_transaction_id'] ;
		unset($_SESSION['transactions'][$transaction_id]) ;
		return array('success'=>false) ;
	}
	
	
	
	$arr_saisie['bible_queries'] = array() ;
	$query = "SELECT * FROM query ORDER BY query_name" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$query_id = $arr['query_id'] ;
		$arr_query = array() ;
		foreach( array('query_id','query_name','target_file_code') as $mkey ) {
			$arr_query[$mkey] = $arr[$mkey] ;
		}
		paracrm_queries_builderTransaction_loadFields( $arr_query , $query_id ) ;
		
		$arr_saisie['bible_queries'][] = $arr_query ;
	}
	
	$arr_saisie['bible_files_treefields'] = array() ;
	$query = "SELECT file_code FROM define_file ORDER BY file_code" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$file_code = $arr[0] ;
	
		$ttmp = paracrm_lib_file_access( $file_code ) ;
		$arr_saisie['bible_files_treefields'][$file_code] = paracrm_queries_builderTransaction_getTreeFields( $ttmp ) ;
	}
	
	
	


	return array('success'=>true,
					'_mirror'=>$post_data,
					'transaction_id' => $post_data['_transaction_id'],
					'qmerge_id' => $arr_saisie['qmerge_id'],
					'qmerge_name' => $arr_saisie['qmerge_name'],
					'bible_queries' => $arr_saisie['bible_queries'],
					'bible_files_treefields' => $arr_saisie['bible_files_treefields'],
					'qmerge_queries' => $arr_saisie['arr_query_id'],
					'qmerge_mwherefields' => $arr_saisie['fields_mwhere'],
					'qmerge_mselectfields' => $arr_saisie['fields_mselect']
					) ;
}

function paracrm_queries_mergerTransaction_submit( $post_data , &$arr_saisie )
{
	global $_opDB ;
	
	$map_client2server = array() ;
	$map_client2server['qmerge_queries'] = 'arr_query_id' ;
	$map_client2server['qmerge_mwherefields'] = 'fields_mwhere' ;
	$map_client2server['qmerge_mselectfields'] = 'fields_mselect' ;
	
	if( !$post_data['_qsimple'] ) {
		// controle des champs obligatoires
		foreach( $map_client2server as $mkey_client => $mkey_local ) {
			if( !isset($post_data[$mkey_client]) ) {
				return array('success'=>false) ;
			}
		}
	}
	
	foreach( $map_client2server as $mkey_client => $mkey_local ) {
		if( !isset($post_data[$mkey_client]) ) {
			continue ;
		}
		$arr_saisie[$mkey_local] = json_decode($post_data[$mkey_client],TRUE) ;
	}

	return array('success'=>true) ;
}
function paracrm_queries_mergerTransaction_togglePublish( $post_data , &$arr_saisie )
{
	global $_opDB ;

	$qmerge_id = $arr_saisie['qmerge_id'] ;
	$is_published = ($post_data['isPublished']=='true')?true:false ;
	
	$query = "DELETE FROM input_query_src WHERE target_qmerge_id='$qmerge_id'" ;
	$_opDB->query($query) ;
	
	if( $is_published ) {
		$arr_ins = array() ;
		$arr_ins['target_qmerge_id'] = $qmerge_id ;
		$_opDB->insert('input_query_src',$arr_ins) ;
	}

	return array('success'=>true) ;
}

function paracrm_queries_mergerTransaction_runQuery( $post_data, &$arr_saisie )
{
	usleep(500000) ;
	$RES = paracrm_queries_process_qmerge($arr_saisie , (isset($post_data['_debug'])&&$post_data['_debug']==TRUE)?true:false ) ;
	if( !$RES )
		return array('success'=>false,'query_status'=>'NOK') ;
		
	$transaction_id = $post_data['_transaction_id'] ;
	if( !is_array($_SESSION['transactions'][$transaction_id]['arr_RES']) )
		return array('success'=>false,'query_status'=>'NO_RES') ;
	
	$new_RES_key = count($_SESSION['transactions'][$transaction_id]['arr_RES']) + 1 ;
	$_SESSION['transactions'][$transaction_id]['arr_RES'][$new_RES_key] = $RES ;
	
	
	return array('success'=>true,'query_status'=>'OK','RES_id'=>$new_RES_key,'debug'=>$RES) ;
}

function paracrm_queries_mergerTransaction_resGet( $post_data )
{
	$transaction_id = $post_data['_transaction_id'] ;
	$RES = $_SESSION['transactions'][$transaction_id]['arr_RES'][$post_data['RES_id']] ;
	
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
	
	return array('success'=>true,'tabs'=>array_values($tabs)) ;
}


function paracrm_queries_mergerTransaction_save( $post_data , &$arr_saisie )
{
	global $_opDB ;
	
	if( !Auth_Manager::getInstance()->auth_query_sdomain_action(
		Auth_Manager::sdomain_getCurrent(),
		'queries',
		NULL,
		$write=true
	)) {
			return Auth_Manager::auth_getDenialResponse() ;
	}
	
	if( $post_data['_subaction'] == 'save' )
	{
		if( !$arr_saisie['qmerge_id'] )
			return array('success'=>false) ;
		
		return paracrm_queries_mergerTransaction_saveFields( $arr_saisie, $arr_saisie['qmerge_id'] ) ;
	}

	if( $post_data['_subaction'] == 'saveas' )
	{
		$arr_ins = array() ;
		$arr_ins['qmerge_name'] = $post_data['qmerge_name'] ;
		$_opDB->insert('qmerge',$arr_ins) ;
		
		$arr_saisie['qmerge_id'] = $_opDB->insert_id() ;
		
		return paracrm_queries_mergerTransaction_saveFields( $arr_saisie, $arr_saisie['qmerge_id'] ) ;
	}
	
	
	if( $post_data['_subaction'] == 'delete' )
	{
		if( !$arr_saisie['qmerge_id'] )
			return array('success'=>false) ;
		
		$tables = array() ;
		$tables[] = 'qmerge' ;
		$tables[] = 'qmerge_query' ;
		$tables[] = 'qmerge_field_mwhere' ;
		$tables[] = 'qmerge_field_mwhere_link' ;
		$tables[] = 'qmerge_field_mselect' ;
		$tables[] = 'qmerge_field_mselect_axisdetach' ;
		$tables[] = 'qmerge_field_mselect_symbol' ;
		foreach( $tables as $dbtab )
		{
			$query = "DELETE FROM $dbtab WHERE qmerge_id='{$arr_saisie['qmerge_id']}'" ;
			$_opDB->query($query) ;
		}
		
		$transaction_id = $post_data['_transaction_id'] ;
		unset($_SESSION['transactions'][$transaction_id]) ;
		
		return array('success'=>true) ;
	}
}





function paracrm_queries_mergerTransaction_loadFields( &$arr_saisie , $qmerge_id )
{
	global $_opDB ;
	
	$arr_saisie['arr_query_id'] = array() ;
	$query = "SELECT * FROM qmerge_query WHERE qmerge_id='$qmerge_id' ORDER BY qmerge_query_ssid" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$arr_saisie['arr_query_id'][] = $arr['link_query_id'] ;
	}

	$arr_saisie['fields_mwhere'] = array() ;
	$query = "SELECT * FROM qmerge_field_mwhere WHERE qmerge_id='$qmerge_id' ORDER BY qmerge_fieldmwhere_ssid" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$arr['query_fields'] = array() ;
		$query = "SELECT * FROM qmerge_field_mwhere_link
					WHERE qmerge_id='$qmerge_id' AND qmerge_fieldmwhere_ssid='{$arr['qmerge_fieldmwhere_ssid']}'" ;
		$result2 = $_opDB->query($query) ;
		while( ($arr_link = $_opDB->fetch_assoc($result2)) != FALSE )
		{
			unset($arr_link['qmerge_id']) ;
			unset($arr_link['qmerge_fieldmwhere_ssid']) ;
			$arr['query_fields'][] = $arr_link ;
		}
	
		unset($arr['qmerge_id']) ;
		unset($arr['qmerge_fieldmwhere_ssid']) ;
		foreach( array('condition_date_lt','condition_date_gt') as $mkey ) {
			if( $arr[$mkey] == '0000-00-00' ) {
				$arr[$mkey]='' ;
			}
		}
		$arr_saisie['fields_mwhere'][] = $arr ;
	}
	
	$arr_saisie['fields_mselect'] = array() ;
	$query = "SELECT * FROM qmerge_field_mselect WHERE qmerge_id='$qmerge_id' ORDER BY qmerge_fieldmselect_ssid" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$arr['axis_detach'] = array() ;
		$query = "SELECT * FROM qmerge_field_mselect_axisdetach 
					WHERE qmerge_id='$qmerge_id' AND qmerge_fieldmselect_ssid='{$arr['qmerge_fieldmselect_ssid']}'" ;
		$result2 = $_opDB->query($query) ;
		while( ($arr_axisdetach = $_opDB->fetch_assoc($result2)) != FALSE )
		{
			unset($arr_axisdetach['qmerge_id']) ;
			unset($arr_axisdetach['qmerge_fieldmselect_ssid']) ;
			$arr['axis_detach'][] = $arr_axisdetach ;
		}
	
		$arr['math_expression'] = array() ;
		$query = "SELECT * FROM qmerge_field_mselect_symbol 
					WHERE qmerge_id='$qmerge_id' AND qmerge_fieldmselect_ssid='{$arr['qmerge_fieldmselect_ssid']}'
					ORDER BY qmerge_fieldmselect_symbol_index" ;
		$result2 = $_opDB->query($query) ;
		while( ($arr_symbol = $_opDB->fetch_assoc($result2)) != FALSE )
		{
			unset($arr_symbol['qmerge_id']) ;
			unset($arr_symbol['qmerge_fieldmselect_ssid']) ;
			unset($arr_symbol['qmerge_fieldmselect_symbol_index']) ;
			$arr['math_expression'][] = $arr_symbol ;
		}
	
		unset($arr['qmerge_id']) ;
		unset($arr['qmerge_fieldmselect_ssid']) ;
		$arr_saisie['fields_mselect'][] = $arr ;
	}
	
	return ;
}
function paracrm_queries_mergerTransaction_saveFields( &$arr_saisie , $qmerge_id )
{
	global $_opDB ;
	
	
	$tables = array() ;
	$tables[] = 'qmerge_query' ;
	$tables[] = 'qmerge_field_mwhere' ;
	$tables[] = 'qmerge_field_mwhere_link' ;
	$tables[] = 'qmerge_field_mselect' ;
	$tables[] = 'qmerge_field_mselect_axisdetach' ;
	$tables[] = 'qmerge_field_mselect_symbol' ;
	foreach( $tables as $dbtab )
	{
		$query = "DELETE FROM $dbtab WHERE qmerge_id='$qmerge_id'" ;
		$_opDB->query($query) ;
	}
	
	
	$cnt = 0 ;
	foreach( $arr_saisie['arr_query_id'] as $link_query_id ) {
		$cnt++ ;
	
		$arr_ins = array() ;
		$arr_ins['qmerge_id'] = $qmerge_id ;
		$arr_ins['qmerge_query_ssid'] = $cnt ;
		$arr_ins['link_query_id'] = $link_query_id ;
		$_opDB->insert('qmerge_query',$arr_ins) ;
	}
	
	
	$cnt = 0 ;
	$mwhere = array() ;
	$mwhere[] = 'mfield_type' ;
	$mwhere[] = 'mfield_linkbible' ;
	$mwhere[] = 'condition_string' ;
	$mwhere[] = 'condition_date_lt' ;
	$mwhere[] = 'condition_date_gt' ;
	$mwhere[] = 'condition_num_lt' ;
	$mwhere[] = 'condition_num_gt' ;
	$mwhere[] = 'condition_num_eq' ;
	$mwhere[] = 'condition_bible_mode' ;
	$mwhere[] = 'condition_bible_treenodes' ;
	$mwhere[] = 'condition_bible_entries' ;
	foreach( $arr_saisie['fields_mwhere'] as $field_mwhere )
	{
		$cnt++ ;
	
		$arr_ins = array() ;
		$arr_ins['qmerge_id'] = $qmerge_id ;
		$arr_ins['qmerge_fieldmwhere_ssid'] = $cnt ;
		foreach( $mwhere as $w )
		{
			$arr_ins[$w] = $field_mwhere[$w] ;
		}
		$_opDB->insert('qmerge_field_mwhere',$arr_ins) ;
		
		
		$scnt = 0 ;
		$link = array() ;
		$link[] = 'query_id' ;
		$link[] = 'query_wherefield_idx' ;
		foreach( $field_mwhere['query_fields'] as $field_link )
		{
			$scnt++ ;
		
			$arr_ins = array() ;
			$arr_ins['qmerge_id'] = $qmerge_id ;
			$arr_ins['qmerge_fieldmwhere_ssid'] = $cnt ;
			foreach( $link as $s )
			{
				$arr_ins[$s] = $field_link[$s] ;
			}
			$_opDB->insert('qmerge_field_mwhere_link',$arr_ins) ;
		}
	}


	$cnt = 0 ;
	$select = array() ;
	$select[] = 'select_lib' ;
	$select[] = 'math_func_mode' ;
	$select[] = 'math_func_group' ;
	$select[] = 'math_round' ;
	foreach( $arr_saisie['fields_mselect'] as $field_mselect )
	{
		$cnt++ ;
	
		$arr_ins = array() ;
		$arr_ins['qmerge_id'] = $qmerge_id ;
		$arr_ins['qmerge_fieldmselect_ssid'] = $cnt ;
		foreach( $select as $w )
		{
			$arr_ins[$w] = $field_mselect[$w] ;
		}
		$_opDB->insert('qmerge_field_mselect',$arr_ins) ;
		
		
		$scnt = 0 ;
		$axis = array() ;
		$axis[] = 'display_geometry' ;
		$axis[] = 'axis_is_detach' ;
		foreach( $field_mselect['axis_detach'] as $field_axis )
		{
			$scnt++ ;
		
			$arr_ins = array() ;
			$arr_ins['qmerge_id'] = $qmerge_id ;
			$arr_ins['qmerge_fieldmselect_ssid'] = $cnt ;
			foreach( $axis as $s )
			{
				$arr_ins[$s] = $field_axis[$s] ;
			}
			$_opDB->insert('qmerge_field_mselect_axisdetach',$arr_ins) ;
		}
		
		
		$scnt = 0 ;
		$symbol = array() ;
		$symbol[] = 'math_operation' ;
		$symbol[] = 'math_parenthese_in' ;
		$symbol[] = 'math_operand_query_id' ;
		$symbol[] = 'math_operand_selectfield_idx' ;
		$symbol[] = 'math_staticvalue' ;
		$symbol[] = 'math_parenthese_out' ;
		foreach( $field_mselect['math_expression'] as $field_sequence )
		{
			$scnt++ ;
		
			$arr_ins = array() ;
			$arr_ins['qmerge_id'] = $qmerge_id ;
			$arr_ins['qmerge_fieldmselect_ssid'] = $cnt ;
			$arr_ins['qmerge_fieldmselect_symbol_index'] = $scnt ;
			foreach( $symbol as $s )
			{
				$arr_ins[$s] = $field_sequence[$s] ;
			}
			$_opDB->insert('qmerge_field_mselect_symbol',$arr_ins) ;
		}
	}


	return array('success'=>true,'qmerge_id'=>$qmerge_id) ;
}

function paracrm_queries_mergerTransaction_exportXLS( $post_data, &$arr_saisie )
{
	if( !class_exists('PHPExcel') )
		return NULL ;
	
	$transaction_id = $post_data['_transaction_id'] ;
	$RES = $_SESSION['transactions'][$transaction_id]['arr_RES'][$post_data['RES_id']] ;
	
	$workbook_tab_grid = array() ;
	foreach( $RES['RES_labels'] as $tab_id => $dummy )
	{
		$tab = array() ;
		$tab['tab_title'] = $dummy['tab_title'] ;
		$workbook_tab_grid[$tab_id] = $tab + paracrm_queries_mpaginate_getGrid( $RES, $tab_id ) ;
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
	
	$qmerge_name = "unnamed" ;
	if( $arr_saisie['qmerge_name'] ) {
		$qmerge_name = $arr_saisie['qmerge_name'] ;
	}
	$qmerge_name=str_replace(' ','_',preg_replace("/[^a-zA-Z0-9\s]/", "", $qmerge_name)) ;
	
	$filename = 'OP5report_Qmerge_'.$qmerge_name.'_'.time().'.xlsx' ;
	header("Content-Type: application/force-download; name=\"$filename\""); 
	header("Content-Disposition: attachment; filename=\"$filename\""); 
	readfile($tmpfilename) ;
	unlink($tmpfilename) ;
	die() ;
}


?>