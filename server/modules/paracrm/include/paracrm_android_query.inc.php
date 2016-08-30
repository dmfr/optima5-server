<?php

function paracrm_android_query_buildTables() {

	global $_opDB ;
	global $tmplinearfields ;

	// Reconstitution des treefields (pour les libellés)
	$tmptreefields = array() ;
	$query = "SELECT file_code FROM define_file ORDER BY file_code" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$file_code = $arr[0] ;
	
		$ttmp = paracrm_lib_file_access( $file_code ) ;
		$tmptreefields[$file_code] = paracrm_queries_builderTransaction_getTreeFields( $ttmp ) ;
	}
	$tmplinearfields = array() ;
	foreach( $tmptreefields as $file_code => $tree ) {
		$tmplinearfields[$file_code] = paracrm_queries_process_linearTreefields($tree) ;
	}
	
	
	// Création des tables
	$query = "DROP TABLE IF EXISTS tmp_input_query" ;
	$_opDB->query($query) ;
	$query = "DROP TABLE IF EXISTS tmp_input_query_where" ;
	$_opDB->query($query) ;
	$query = "CREATE TEMPORARY TABLE IF NOT EXISTS tmp_input_query LIKE input_query_tpl" ;
	$_opDB->query($query) ;
	$query = "CREATE TEMPORARY TABLE IF NOT EXISTS tmp_input_query_where LIKE input_query_tpl_where" ;
	$_opDB->query($query) ;
	$query = "CREATE TEMPORARY TABLE IF NOT EXISTS tmp_input_query_progress LIKE input_query_tpl_progress" ;
	$_opDB->query($query) ;
	
	
	// print_r($tmplinearfields) ;

	$query = "SELECT * FROM input_query_src" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$querysrc_id = $arr['querysrc_id'] ;
		$querysrc_index = $arr['querysrc_index'] ;
		
		if( $arr['target_query_id'] ) {
			paracrm_android_query_buildTables_forQuery($arr['target_query_id'] , $querysrc_id, $querysrc_index) ;
		}
		elseif( $arr['target_qmerge_id'] ) {
			paracrm_android_query_buildTables_forQmerge($arr['target_qmerge_id'] , $querysrc_id, $querysrc_index) ;
		}
		elseif( $arr['target_qweb_id'] ) {
			paracrm_android_query_buildTables_forQweb($arr['target_qweb_id'] , $querysrc_id, $querysrc_index) ;
		}
		elseif( $arr['target_qsql_id'] ) {
			paracrm_android_query_buildTables_forQsql($arr['target_qsql_id'] , $querysrc_id, $querysrc_index) ;
		}
	}
}
function paracrm_android_query_buildTables_forQuery( $query_id , $dest_querysrc_id , $dest_querysrc_index ) {

	global $_opDB ;
	global $tmplinearfields ;

	$query = "SELECT * FROM query WHERE query_id='$query_id'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return ;
	}
	$arr = $_opDB->fetch_assoc($result) ;
	
	$arr_ins = array() ;
	$arr_ins['querysrc_id'] = $dest_querysrc_id ;
	$arr_ins['querysrc_index'] = $dest_querysrc_index ;
	$arr_ins['querysrc_type'] = 'query' ;
	$arr_ins['querysrc_name'] = $arr['query_name'] ;
	$_opDB->insert('tmp_input_query',$arr_ins) ;
	
	$target_file_code = $arr['target_file_code'] ;
	
	
	$query = "SELECT * FROM query_field_where WHERE query_id='$query_id'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
	
		$query_fieldwhere_ssid = $arr['query_fieldwhere_ssid'] ;
		
		// on ne propose sur Android que les where fields "NOT SET"
		if( paracrm_android_query_buildTables_toolIsWhereSet($arr) ) {
			continue ;
		}
		
		$arr_ins = array() ;
		$arr_ins['querysrc_id'] = $dest_querysrc_id ;
		$arr_ins['querysrc_targetfield_ssid'] = $query_fieldwhere_ssid ;
		$arr_ins['field_type'] = $arr['field_type'] ;
		$arr_ins['field_linkbible'] = $arr['field_linkbible'] ;
		$arr_ins['field_lib'] = $tmplinearfields[$target_file_code][$arr['field_code']]['text'] ;
		$_opDB->insert('tmp_input_query_where',$arr_ins) ;
	}
	
	$query = "SELECT * FROM query_field_progress WHERE query_id='$query_id'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
	
		$query_fieldprogress_ssid = $arr['query_fieldprogress_ssid'] ;
		
		// on ne propose sur Android que les progress fields "NOT SET"
		if( paracrm_android_query_buildTables_toolIsWhereSet($arr) ) {
			continue ;
		}
		
		$arr_ins = array() ;
		$arr_ins['querysrc_id'] = $dest_querysrc_id ;
		$arr_ins['querysrc_targetfield_ssid'] = $query_fieldprogress_ssid ;
		$arr_ins['field_is_optional'] = 'O' ;
		$arr_ins['field_type'] = $arr['field_type'] ;
		$arr_ins['field_linkbible'] = $arr['field_linkbible'] ;
		$arr_ins['field_lib'] = $tmplinearfields[$target_file_code][$arr['field_code']]['text'] ;
		$_opDB->insert('tmp_input_query_progress',$arr_ins) ;
	}
}
function paracrm_android_query_buildTables_forQmerge( $qmerge_id , $dest_querysrc_id , $dest_querysrc_index ) {

	global $_opDB ;
	global $tmplinearfields ;

	$query = "SELECT * FROM qmerge WHERE qmerge_id='$qmerge_id'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return ;
	}
	$arr = $_opDB->fetch_assoc($result) ;
	
	$arr_ins = array() ;
	$arr_ins['querysrc_id'] = $dest_querysrc_id ;
	$arr_ins['querysrc_index'] = $dest_querysrc_index ;
	$arr_ins['querysrc_type'] = 'qmerge' ;
	$arr_ins['querysrc_name'] = $arr['qmerge_name'] ;
	$_opDB->insert('tmp_input_query',$arr_ins) ;
	
	
	
	$query = "SELECT * FROM qmerge_field_mwhere WHERE qmerge_id='$qmerge_id'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
	
		$qmerge_fieldmwhere_ssid = $arr['qmerge_fieldmwhere_ssid'] ;
		
		// on ne propose sur Android que les where fields "NOT SET" (pour les Qmerge on propose quand même!)
		/*
		if( paracrm_android_query_buildTables_toolIsWhereSet($arr) ) {
			continue ;
		}
		*/
		
		$arr_ins = array() ;
		$arr_ins['querysrc_id'] = $dest_querysrc_id ;
		$arr_ins['querysrc_targetfield_ssid'] = $qmerge_fieldmwhere_ssid ;
		$arr_ins['field_type'] = $arr['mfield_type'] ;
		$arr_ins['field_linkbible'] = $arr['mfield_linkbible'] ;
		
		// Pour les libellés
		switch( $arr_ins['field_type'] )
		{
			case 'date' :
			$arr_ins['field_lib'] = 'Date range' ;
			break ;
		
			case 'link' :
			$query = "SELECT bible_lib FROM define_bible WHERE bible_code='{$arr_ins['field_linkbible']}'" ;
			$arr_ins['field_lib'] = 'Bible <'.$_opDB->query_uniqueValue($query).'>' ;
			break ;
		
			default :
			break ;
		}
		
		$_opDB->insert('tmp_input_query_where',$arr_ins) ;
	}
}
function paracrm_android_query_buildTables_forQweb( $qweb_id , $dest_querysrc_id , $dest_querysrc_index ) {

	global $_opDB ;
	global $tmplinearfields ;

	$query = "SELECT * FROM qweb WHERE qweb_id='$qweb_id'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return ;
	}
	$arr = $_opDB->fetch_assoc($result) ;
	
	$arr_ins = array() ;
	$arr_ins['querysrc_id'] = $dest_querysrc_id ;
	$arr_ins['querysrc_index'] = $dest_querysrc_index ;
	$arr_ins['querysrc_type'] = 'qweb' ;
	$arr_ins['querysrc_name'] = $arr['qweb_name'] ;
	$_opDB->insert('tmp_input_query',$arr_ins) ;
	
	
	
	$query = "SELECT * FROM qweb_field_qwhere WHERE qweb_id='$qweb_id'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
	
		$qweb_fieldqwhere_ssid = $arr['qweb_fieldqwhere_ssid'] ;
		
		// Pour les Qweb on propose tous les fields
		/*
		if( paracrm_android_query_buildTables_toolIsWhereSet($arr) ) {
			continue ;
		}
		*/
		
		$arr_ins = array() ;
		$arr_ins['querysrc_id'] = $dest_querysrc_id ;
		$arr_ins['querysrc_targetfield_ssid'] = $qweb_fieldqwhere_ssid ;
		$arr_ins['field_is_optional'] = ($arr['qfield_is_optional']=='O')?'O':'' ;
		$arr_ins['field_type'] = $arr['qfield_type'] ;
		$arr_ins['field_linkbible'] = $arr['qfield_linkbible'] ;
		
		// Pour les libellés
		if( $arr['qweb_fieldqwhere_desc'] != '' ) {
			$arr_ins['field_lib'] = $arr['qweb_fieldqwhere_desc'] ;
		} else {
			switch( $arr_ins['field_type'] )
			{
				case 'date' :
				$arr_ins['field_lib'] = 'Date range' ;
				break ;
			
				case 'link' :
				$query = "SELECT bible_lib FROM define_bible WHERE bible_code='{$arr_ins['field_linkbible']}'" ;
				$arr_ins['field_lib'] = 'Bible <'.$_opDB->query_uniqueValue($query).'>' ;
				break ;
			
				default :
				break ;
			}
		}
		
		$_opDB->insert('tmp_input_query_where',$arr_ins) ;
	}
}
function paracrm_android_query_buildTables_forQsql( $qsql_id , $dest_querysrc_id , $dest_querysrc_index ) {

	global $_opDB ;
	global $tmplinearfields ;

	$query = "SELECT * FROM qsql WHERE qsql_id='$qsql_id'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return ;
	}
	$arr = $_opDB->fetch_assoc($result) ;
	
	$arr_ins = array() ;
	$arr_ins['querysrc_id'] = $dest_querysrc_id ;
	$arr_ins['querysrc_index'] = $dest_querysrc_index ;
	$arr_ins['querysrc_type'] = 'qsql' ;
	$arr_ins['querysrc_name'] = $arr['qsql_name'] ;
	$_opDB->insert('tmp_input_query',$arr_ins) ;
}
function paracrm_android_query_buildTables_toolIsWhereSet( $arrDB_where ) {
	switch( $arrDB_where['field_type'] ) {
		case 'link' :
		if( $arrDB_where['condition_bible_mode'] == 'SELECT' ) {
			if( ( $arrDB_where['condition_bible_treenodes'] && json_decode($arrDB_where['condition_bible_treenodes'],true) ) || $arrDB_where['condition_bible_entries'] ) {
				return true ;
			}
		}
		if( $arrDB_where['condition_bible_mode'] == 'SINGLE' ) {
			return true ;
		}
		break ;
		
		case 'date' :
		if( paracrm_android_query_buildTables_toolIsWhereSet_isDateValid($arrDB_where['condition_date_lt']) 
				|| paracrm_android_query_buildTables_toolIsWhereSet_isDateValid($arrDB_where['condition_date_gt']) ) {
			return true ;
		}
		break ;
		
		default :
			return true ;
		break ;
	}
	return false ;
}
function paracrm_android_query_buildTables_toolIsWhereSet_isDateValid( $date_sql )
{
	if( $date_sql == '0000-00-00' )
		return FALSE ;
	if( $date_sql == '0000-00-00 00:00:00' )
		return FALSE ;
	if( !$date_sql )
		return FALSE ;
	if( strtotime( $date_sql ) > 0 )
		return TRUE ;
	// echo "NOK" ;
	return FALSE ;
}





function paracrm_android_query_fetchResult( $post_data ) {

	$querysrc_id=$post_data['querysrc_id'] ;
	if( $post_data['querysrc_where'] ) {
		$arr_where_conditions = array() ;
		foreach( json_decode($post_data['querysrc_where'],true) as $condition ) {
			$querysrc_targetfield_ssid = $condition['querysrc_targetfield_ssid'] ;
			$arr_where_conditions[$querysrc_targetfield_ssid] = $condition ;
		}
	}
	if( $post_data['querysrc_progress'] ) {
		$arr_progress_conditions = array() ;
		foreach( json_decode($post_data['querysrc_progress'],true) as $condition ) {
			$querysrc_targetfield_ssid = $condition['querysrc_targetfield_ssid'] ;
			$arr_progress_conditions[$querysrc_targetfield_ssid] = $condition ;
		}
	}

	global $_opDB ;
	
	paracrm_android_query_buildTables() ;

	$query = "SELECT * FROM tmp_input_query WHERE querysrc_id='$querysrc_id'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return array('success'=>false) ;
	}
	$arrQuery = $_opDB->fetch_assoc($result) ;
	$query = "SELECT * FROM tmp_input_query_where WHERE querysrc_id='$querysrc_id'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$querysrc_targetfield_ssid = $arr['querysrc_targetfield_ssid'] ;
		if( !isset($arr_where_conditions[$querysrc_targetfield_ssid]) ) {
			//return array('success'=>false) ;
		}
	}
	$query = "SELECT * FROM tmp_input_query_progress WHERE querysrc_id='$querysrc_id'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$querysrc_targetfield_ssid = $arr['querysrc_targetfield_ssid'] ;
		if( !isset($arr_progress_conditions[$querysrc_targetfield_ssid]) ) {
			//return array('success'=>false) ;
		}
	}
	
	//sleep(6) ;
	
	switch( $arrQuery['querysrc_type'] )
	{
		case 'query' :
		$query_id = $_opDB->query_uniqueValue("SELECT target_query_id FROM input_query_src WHERE querysrc_id='$querysrc_id'") ;
		//ror_log('Qmerge_id :'.$qmerge_id) ;
		
		$arr_saisie = array() ;
		paracrm_queries_builderTransaction_init( array('query_id'=>$query_id) , $arr_saisie ) ;
		
		if( $arr_where_conditions ) {
			foreach( $arr_where_conditions as $querysrc_targetfield_ssid => $condition ) {
				$query_fieldwhere_idx = $querysrc_targetfield_ssid - 1 ;
				foreach( $condition as $mkey => $mvalue ) {
					if( strpos($mkey,'condition_') === 0 ) {
						$arr_saisie['fields_where'][$query_fieldwhere_idx][$mkey] = $mvalue ;
					}
				}
			}
		}
		if( $arr_progress_conditions ) {
			foreach( $arr_progress_conditions as $querysrc_targetfield_ssid => $condition ) {
				$query_fieldprogress_idx = $querysrc_targetfield_ssid - 1 ;
				foreach( $condition as $mkey => $mvalue ) {
					if( strpos($mkey,'condition_') === 0 ) {
						$arr_saisie['fields_progress'][$query_fieldprogress_idx][$mkey] = $mvalue ;
					}
				}
			}
		}
		
		$RES = paracrm_queries_process_query($arr_saisie , FALSE ) ;
		
		if( $post_data['xls_export'] == 'true' ) {
			return paracrm_android_query_fetchResultXls( $RES, $arrQuery['querysrc_type'] );
		}
		
		$tabs = array() ;
		foreach( $RES['RES_labels'] as $tab_id => $dummy )
		{
			$tab = array() ;
			$tab['tab_title'] = $dummy['tab_title'] ;
			$tabs[$tab_id] = $tab + paracrm_queries_paginate_getGrid( $RES, $tab_id ) ;
			
			if( !$tabs[$tab_id]['data'] ) {
				unset($tabs[$tab_id]) ;
			}
		}
		return array('success'=>true,'tabs'=>array_values($tabs)) ;
		
		
		
		case 'qmerge' :
		$qmerge_id = $_opDB->query_uniqueValue("SELECT target_qmerge_id FROM input_query_src WHERE querysrc_id='$querysrc_id'") ;
		//error_log('Qmerge_id :'.$qmerge_id) ;
		
		$arr_saisie = array() ;
		paracrm_queries_mergerTransaction_init( array('qmerge_id'=>$qmerge_id) , $arr_saisie ) ;
		
		if( $arr_where_conditions ) {
			foreach( $arr_where_conditions as $querysrc_targetfield_ssid => $condition ) {
				$qmerge_fieldmwhere_idx = $querysrc_targetfield_ssid - 1 ;
				foreach( $condition as $mkey => $mvalue ) {
					if( strpos($mkey,'condition_') === 0 ) {
						$arr_saisie['fields_mwhere'][$qmerge_fieldmwhere_idx][$mkey] = $mvalue ;
					}
				}
			}
		}
		
		$RES = paracrm_queries_process_qmerge($arr_saisie , FALSE ) ;
		
		if( $post_data['xls_export'] == 'true' ) {
			return paracrm_android_query_fetchResultXls( $RES, $arrQuery['querysrc_type'] );
		}
		
		$tabs = array() ;
		foreach( $RES['RES_labels'] as $tab_id => $dummy )
		{
			$tab = array() ;
			$tab['tab_title'] = $dummy['tab_title'] ;
			$tabs[$tab_id] = $tab + paracrm_queries_mpaginate_getGrid( $RES, $tab_id ) ;
			
			if( !$tabs[$tab_id]['data'] ) {
				unset($tabs[$tab_id]) ;
			}
		}
		return array('success'=>true,'tabs'=>array_values($tabs)) ;
		
		
		
		case 'qsql' :
		$qsql_id = $_opDB->query_uniqueValue("SELECT target_qsql_id FROM input_query_src WHERE querysrc_id='$querysrc_id'") ;
		//error_log('Qmerge_id :'.$qmerge_id) ;
		
		$arr_saisie = array() ;
		paracrm_queries_qsqlTransaction_init( array('qsql_id'=>$qsql_id) , $arr_saisie ) ;
		
		$RES = paracrm_queries_qsql_lib_exec($arr_saisie['sql_querystring']) ;
		
		if( $post_data['xls_export'] == 'true' ) {
			return paracrm_android_query_fetchResultXls( $RES, $arrQuery['querysrc_type'] );
		}
		
		return array('success'=>true,'tabs'=>array_values($RES)) ;
		
		
		
		case 'qweb' :
		$qweb_id = $_opDB->query_uniqueValue("SELECT target_qweb_id FROM input_query_src WHERE querysrc_id='$querysrc_id'") ;
		
		
		$arr_saisie = array() ;
		paracrm_queries_qwebTransaction_init( array('qweb_id'=>$qweb_id) , $arr_saisie ) ;
		
		if( $arr_where_conditions ) {
			foreach( $arr_where_conditions as $querysrc_targetfield_ssid => $condition ) {
				$qweb_fieldqwhere_idx = $querysrc_targetfield_ssid - 1 ;
				foreach( $condition as $mkey => $mvalue ) {
					if( strpos($mkey,'condition_') === 0 ) {
						$arr_saisie['fields_qwhere'][$qweb_fieldqwhere_idx][$mkey] = $mvalue ;
					}
				}
			}
		}
		
		$RES = paracrm_queries_process_qweb($arr_saisie , FALSE ) ;
		if( !$RES ) {
			return array('success'=>false) ;
		}
		
		if( is_array($RES['RES_html']) ) {
			$tabs = array() ;
			foreach( $RES['RES_labels'] as $tab_id => $dummy )
			{
				$tab = array() ;
				$tab['tab_title'] = $dummy['tab_title'] ;
				$tabs[$tab_id] = $tab + array('html'=>$RES['RES_html'][$tab_id]) ;
				
				if( !$tabs[$tab_id]['html'] ) {
					unset($tabs[$tab_id]) ;
				}
			}
			$json = array() ;
			$json['success'] = true ;
			$json['tabs'] = array_values($tabs) ;
			return $json ;
		} else {
			$json = array() ;
			$json['success'] = true ;
			$json['html'] = $RES['RES_html'] ;
			return $json ;
		}
	}
	
	return array('success'=>true) ;
}


function paracrm_android_query_fetchResultXls( $RES , $query_type ) {

	@include_once 'PHPExcel/PHPExcel.php' ;

	switch( $query_type )
	{
		case 'query' :
		$workbook_tab_grid = array() ;
		foreach( $RES['RES_labels'] as $tab_id => $dummy )
		{
			$tab = array() ;
			$tab['tab_title'] = $dummy['tab_title'] ;
			$workbook_tab_grid[$tab_id] = $tab + paracrm_queries_paginate_getGrid( $RES, $tab_id ) ;
		}
		break ;
		
		case 'qmerge' :
		$workbook_tab_grid = array() ;
		foreach( $RES['RES_labels'] as $tab_id => $dummy )
		{
			$tab = array() ;
			$tab['tab_title'] = $dummy['tab_title'] ;
			$workbook_tab_grid[$tab_id] = $tab + paracrm_queries_mpaginate_getGrid( $RES, $tab_id ) ;
		}
		break ;
		
		case 'qsql' :
		$workbook_tab_grid = $RES ;
		break ;
		
		default :
		return array('success'=>false) ;
	}

	$objPHPExcel = paracrm_queries_xls_build( $workbook_tab_grid, $RES['RES_round'] ) ;
	if( !$objPHPExcel ) {
		return array('success'=>false) ;
	}


	$tmpfilename = tempnam( sys_get_temp_dir(), "FOO");
	$objWriter = PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel2007');
	$objWriter->save($tmpfilename);
	$objPHPExcel->disconnectWorksheets();
	unset($objPHPExcel) ;
	
	$binary = file_get_contents($tmpfilename) ;
	unlink($tmpfilename) ;

	$json = array() ;
	$json['success'] = true ;
	$json['xlsx_base64'] = base64_encode($binary);
	return $json ;
}

?>
