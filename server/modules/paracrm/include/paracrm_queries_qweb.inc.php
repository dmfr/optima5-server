<?php
function paracrm_queries_qwebTransaction( $post_data )
{
	if( $post_data['_action'] == 'queries_qwebTransaction' && $post_data['_subaction'] == 'init' )
	{
		// ouverture transaction
		$transaction_id = $_SESSION['next_transaction_id']++ ;
		
		$_SESSION['transactions'][$transaction_id] = array() ;
		$_SESSION['transactions'][$transaction_id]['transaction_code'] = 'paracrm_queries_qwebTransaction' ;
		
		$arr_saisie = array() ;
		$_SESSION['transactions'][$transaction_id]['arr_saisie'] = $arr_saisie ;
		$_SESSION['transactions'][$transaction_id]['arr_RES'] = array() ;
		
		$post_data['_transaction_id'] = $transaction_id ;
	}
	
	
	if( $post_data['_action'] == 'queries_qwebTransaction' && $post_data['_transaction_id'] )
	{
		if( !$_SESSION['transactions'][$post_data['_transaction_id']] )
			return NULL ;
		$transaction_id = $post_data['_transaction_id'] ;
		$arr_transaction = $_SESSION['transactions'][$transaction_id] ;
		if( $arr_transaction['transaction_code'] != 'paracrm_queries_qwebTransaction' )
			return NULL ;
			
		$arr_saisie = $arr_transaction['arr_saisie'] ;
		
		if( $post_data['_subaction'] == 'init' )
		{
			$json =  paracrm_queries_qwebTransaction_init( $post_data , $arr_saisie ) ;
		}
		if( $post_data['_subaction'] == 'run' )
		{
			$json =  paracrm_queries_qwebTransaction_runQuery( $post_data , $arr_saisie ) ;
		}
		if( $post_data['_subaction'] == 'submit' )
		{
			$json =  paracrm_queries_qwebTransaction_submit( $post_data , $arr_saisie ) ;
		}
		if( $post_data['_subaction'] == 'save' || $post_data['_subaction'] == 'saveas' || $post_data['_subaction'] == 'delete' )
		{
			$json =  paracrm_queries_qwebTransaction_save( $post_data , $arr_saisie ) ;
		}
		if( $post_data['_subaction'] == 'toggle_publish' )
		{
			$json =  paracrm_queries_qwebTransaction_togglePublish( $post_data , $arr_saisie ) ;
			if( $json['success'] ) {
				paracrm_queries_organizePublish() ;
			}
		}
		
		
		
		if( $post_data['_subaction'] == 'res_get' || $post_data['_subaction'] == 'exportXLS' )
		{
			$json =  paracrm_queries_qwebTransaction_resGet( $post_data ) ;
			if( $post_data['_subaction'] == 'exportXLS' ) {
				paracrm_queries_qwebTransaction_exportJson( $json, $arr_saisie ) ;
			}
		}
		
		switch( $post_data['_subaction'] ) {
			case 'chart_cfg_load' :
			case 'chart_cfg_save' :
			case 'chart_tab_getSeries' :
				return array('success'=>true) ;
				break ;
		}
		
		if( $post_data['_subaction'] == 'end' )
		{
			unset($_SESSION['transactions'][$transaction_id]) ;
			return array('success'=>true) ;
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


function paracrm_queries_qwebTransaction_init( $post_data , &$arr_saisie )
{
	global $_opDB ;
	
	if( $post_data['qweb_id'] && !is_numeric($post_data['qweb_id']) ) {
		$query = "SELECT qweb_id FROM qweb WHERE qweb_name='{$post_data['qweb_id']}'" ;
		$post_data['qweb_id'] = $_opDB->query_uniqueValue($query) ;
	}
	
	/*
	************ INITIALISATION *********
	- structure 'tree' du fichier
	- remplissage des champs
	*******************************
	*/
	if( $post_data['is_new'] == 'true' )
	{
		$arr_saisie['fields_qwhere'] = array() ;
	}
	elseif( $post_data['qweb_id'] > 0 )
	{
		$query = "SELECT * FROM qweb WHERE qweb_id='{$post_data['qweb_id']}'" ;
		$result = $_opDB->query($query) ;
		$arr = $_opDB->fetch_assoc($result) ;
		if( !$arr )
		{
			$transaction_id = $post_data['_transaction_id'] ;
			unset($_SESSION['transactions'][$transaction_id]) ;
			return array('success'=>false) ;
		}
		$arr_saisie['qweb_id'] = $arr['qweb_id'] ;
		$arr_saisie['qweb_name'] = $arr['qweb_name'] ;
		$arr_saisie['target_resource_qweb'] = $arr['target_resource_qweb'] ;
		paracrm_queries_qwebTransaction_loadFields( $arr_saisie , $arr_saisie['qweb_id'] ) ;
	}
	else
	{
		$transaction_id = $post_data['_transaction_id'] ;
		unset($_SESSION['transactions'][$transaction_id]) ;
		return array('success'=>false) ;
	}
	


	return array('success'=>true,
					'_mirror'=>$post_data,
					'qweb_id'=>$arr_saisie['qweb_id'],
					'qweb_name'=>$arr_saisie['qweb_name'],
					'transaction_id'=>$post_data['_transaction_id'],
					'qweb_target_resource' => $arr_saisie['target_resource_qweb'],
					'qweb_qwherefields' => $arr_saisie['fields_qwhere']
					) ;
}
function paracrm_queries_qwebTransaction_submit( $post_data , &$arr_saisie )
{
	global $_opDB ;
	
	$map_client2server = array() ;
	$map_client2server['qweb_target_resource'] = 'target_resource_qweb' ;
	$map_client2server['qweb_qwherefields'] = 'fields_qwhere' ;
	
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
		if( $mkey_client == 'qweb_target_resource' ) {
			// Valeur non JSON !
			$arr_saisie['target_resource_qweb'] = $post_data['qweb_target_resource'] ;
			continue ;
		}
		$arr_saisie[$mkey_local] = json_decode($post_data[$mkey_client],TRUE) ;
	}

	return array('success'=>true) ;
}
function paracrm_queries_qwebTransaction_save( $post_data , &$arr_saisie )
{
	global $_opDB ;
	
	return array('success',false) ;
	
	/*
	if( $post_data['_subaction'] == 'save' )
	{
		if( !$arr_saisie['qweb_id'] )
			return array('success'=>false) ;
		
		return paracrm_queries_qwebTransaction_saveFields( $arr_saisie, $arr_saisie['qweb_id'] ) ;
	}

	if( $post_data['_subaction'] == 'saveas' )
	{
		$arr_ins = array() ;
		$arr_ins['qweb_name'] = $post_data['qweb_name'] ;
		$arr_ins['target_resource_qweb'] = $arr_saisie['target_resource_qweb'] ;
		$_opDB->insert('qweb',$arr_ins) ;
		
		$arr_saisie['qweb_id'] = $_opDB->insert_id() ;
		
		return paracrm_queries_qwebTransaction_saveFields( $arr_saisie, $arr_saisie['qweb_id'] ) ;
	}
	
	
	if( $post_data['_subaction'] == 'delete' )
	{
		if( !$arr_saisie['qweb_id'] )
			return array('success'=>false) ;
		
		$tables = array() ;
		$tables[] = 'qweb' ;
		$tables[] = 'qweb_field_qwhere' ;
		foreach( $tables as $dbtab )
		{
			$query = "DELETE FROM $dbtab WHERE qweb_id='{$arr_saisie['qweb_id']}'" ;
			$_opDB->query($query) ;
		}
		
		$transaction_id = $post_data['_transaction_id'] ;
		unset($_SESSION['transactions'][$transaction_id]) ;
		
		return array('success'=>true) ;
	}
	*/
}
function paracrm_queries_qwebTransaction_togglePublish( $post_data , &$arr_saisie )
{
	global $_opDB ;

	$qweb_id = $arr_saisie['qweb_id'] ;
	$is_published = ($post_data['isPublished']=='true')?true:false ;
	
	$query = "DELETE FROM input_query_src WHERE target_qweb_id='$qweb_id'" ;
	$_opDB->query($query) ;
	
	if( $is_published ) {
		$arr_ins = array() ;
		$arr_ins['target_qweb_id'] = $qweb_id ;
		$_opDB->insert('input_query_src',$arr_ins) ;
	}

	return array('success'=>true) ;
}


function paracrm_queries_qwebTransaction_runQuery( $post_data, &$arr_saisie )
{
	usleep(500000) ;
	
	
	$RES = paracrm_queries_process_qweb($arr_saisie , (isset($post_data['_debug'])&&$post_data['_debug']==TRUE)?true:false ) ;
	if( !$RES )
		return array('success'=>false,'query_status'=>'NOK') ;
		
	$transaction_id = $post_data['_transaction_id'] ;
	if( !is_array($_SESSION['transactions'][$transaction_id]['arr_RES']) )
		return array('success'=>false,'query_status'=>'NO_RES') ;
	
	$new_RES_key = count($_SESSION['transactions'][$transaction_id]['arr_RES']) + 1 ;
	$_SESSION['transactions'][$transaction_id]['arr_RES'][$new_RES_key] = $RES ;
	
	
	return array('success'=>true,'query_status'=>'OK','RES_id'=>$new_RES_key) ;
}


function paracrm_queries_qwebTransaction_resGet( $post_data )
{
	$transaction_id = $post_data['_transaction_id'] ;
	$RES = $_SESSION['transactions'][$transaction_id]['arr_RES'][$post_data['RES_id']] ;
	
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
		return array('success'=>true,'tabs'=>array_values($tabs)) ;
	} else {
		return array('success'=>true,'html'=>$RES['RES_html']) ;
	}
}


function paracrm_queries_qwebTransaction_loadFields( &$arr_saisie , $qweb_id )
{
	global $_opDB ;

	$arr_saisie['fields_qwhere'] = array() ;
	$query = "SELECT * FROM qweb_field_qwhere WHERE qweb_id='$qweb_id' ORDER BY qweb_fieldqwhere_ssid" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		unset($arr['qweb_id']) ;
		unset($arr['qweb_fieldqwhere_ssid']) ;
		/*
		foreach( array('condition_date_lt','condition_date_gt') as $mkey ) {
			if( $arr[$mkey] == '0000-00-00' ) {
				$arr[$mkey]='' ;
			}
		}
		*/
		$arr_saisie['fields_qwhere'][] = $arr ;
	}
	
	return ;
}





function paracrm_queries_process_qweb($arr_saisie, $debug=FALSE)
{
	global $_opDB ;
	global $app_root, $server_root ;
	
	$resource_path = $app_root."/resources/server/qweb/".$arr_saisie['target_resource_qweb'] ;
	if( !is_file($resource_path) ) {
		return NULL ;
	}
	$_QWEB_QWHERE = array() ;
	foreach( $arr_saisie['fields_qwhere'] as $field_qwhere ) {
		if( !$field_qwhere['target_resource_qweb_key'] ) {
			continue ;
		}
		$QKEY = $field_qwhere['target_resource_qweb_key'] ;
		$_QWEB_QWHERE[$QKEY] = $field_qwhere ;
	}
	
	// ******* EXECUTION REQUETE *********
	// -- input : $_QWEB_QWHERE
	include($resource_path) ;
	// -- output : $_QWEB_HTML or $_QWEB_TABS_HTML
	// ***********************************
	
	if( $_QWEB_TABS_HTML ) {
		$RES = array() ;
		$RES['RES_labels'] = array() ;
		$RES['RES_html'] = array() ;
		foreach( $_QWEB_TABS_HTML as $tab_title => $html ) {
			$RES['RES_labels'][] = array('tab_title'=>$tab_title) ;
			$RES['RES_html'][] = $html ;
		}
		return $RES ;
	} elseif( $_QWEB_HTML ) {
		return array('RES_html'=>$_QWEB_HTML) ;
	} else {
		return NULL ;
	}
}


function paracrm_queries_qweb_getQresultObjs( $q_type, $q_id, $arr_where_conditions, $img_options=array('width'=>800,'height'=>220) ) {
	global $_opDB ;
	
	switch( $q_type ) {
		case 'query' :
		if( !is_numeric($q_id) ) {
			$query = "SELECT query_id FROM query WHERE query_name LIKE '{$q_id}'";
			$q_id = $_opDB->query_uniqueValue($query) ;
			if( !$q_id ) {
				return NULL ;
			}
		}
		
		$arr_saisie = array() ;
		paracrm_queries_builderTransaction_init( array('query_id'=>$q_id) , $arr_saisie ) ;
		
		if( $arr_where_conditions ) {
			foreach( $arr_where_conditions as $query_targetfield_ssid => $condition ) {
				$query_fieldwhere_idx = $query_targetfield_ssid - 1 ;
				foreach( $condition as $mkey => $mvalue ) {
					if( strpos($mkey,'condition_') === 0 ) {
						$arr_saisie['fields_where'][$query_fieldwhere_idx][$mkey] = $mvalue ;
					}
				}
			}
		}
		
		$RES = paracrm_queries_process_query($arr_saisie , FALSE ) ;
		
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
		break ;
		
		
		
		case 'qmerge' :
		if( !is_numeric($q_id) ) {
			$query = "SELECT qmerge_id FROM qmerge WHERE qmerge_name LIKE '{$q_id}'";
			$q_id = $_opDB->query_uniqueValue($query) ;
			if( !$q_id ) {
				return NULL ;
			}
		}
		
		$arr_saisie = array() ;
		paracrm_queries_mergerTransaction_init( array('qmerge_id'=>$q_id) , $arr_saisie ) ;
		
		if( $arr_where_conditions ) {
			foreach( $arr_where_conditions as $query_targetfield_ssid => $condition ) {
				$qmerge_fieldmwhere_idx = $query_targetfield_ssid - 1 ;
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
		break ;
	}
	
	if( !$tabs ) {
		return NULL ;
	}
	
	$objs = array() ;
	foreach( $tabs as $tab ) {
		$obj = array() ;
		$obj['type'] = 'table' ;
		$obj['title'] = $tab['tab_title'] ;
		$obj['table_html'] = paracrm_queries_template_makeTable( $tab['columns'], $tab['data'] ) ;
		$objs[] = $obj ;
	}
	if( !($arr_QueryResultChartModel = paracrm_queries_charts_cfgLoad($q_type,$q_id)) ) {
		return $objs ;
	}
	foreach( $arr_QueryResultChartModel as $queryResultChartModel ) {
		if( !($binary = paracrm_queries_template_makeImgChart($RES, $queryResultChartModel, $img_options)) ) {
			continue ;
		}
		
		$obj = array() ;
		$obj['type'] = 'chart' ;
		$obj['title'] = $queryResultChartModel['chart_name'] ;
		$obj['img_base64'] = base64_encode( $binary ) ;
		$objs[] = $obj ;
	}
	return $objs ;
}

function paracrm_queries_qwebTransaction_exportJson( $output_json, $arr_saisie=NULL )
{
	if( !$output_json['success'] ) {
		die() ;
	}
	
	$qweb_name = "unnamed" ;
	if( $arr_saisie && $arr_saisie['qweb_name'] ) {
		$qweb_name = $arr_saisie['qweb_name'] ;
	}
	$qweb_name=str_replace(' ','_',preg_replace("/[^a-zA-Z0-9\s]/", "", $qweb_name)) ;
	
	if( $output_json['html'] ) {
		if( $output_pdf = media_pdf_html2pdf($output_json['html']) ) {
			$filename = 'OP5report_Qweb_'.$qweb_name.'_'.time().'.pdf' ;
			header("Content-Type: application/force-download; name=\"$filename\""); 
			header("Content-Disposition: attachment; filename=\"$filename\""); 
			echo $output_pdf ;
			die() ;
		}
		$filename = 'OP5report_Qweb_'.$qweb_name.'_'.time().'.html' ;
		header("Content-Type: application/force-download; name=\"$filename\""); 
		header("Content-Disposition: attachment; filename=\"$filename\""); 
		echo $output_json['html'] ;
		die() ;
	}
	
	die() ;
}

?>