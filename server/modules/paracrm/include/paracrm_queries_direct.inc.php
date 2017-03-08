<?php
function paracrm_queries_direct($post_data, $auth_bypass=FALSE) {

	$q_type = $post_data['q_type'] ;
	$q_id   = $post_data['q_id'] ;
	if( $post_data['q_where'] ) {
		$arr_where_conditions = array() ;
		foreach( json_decode($post_data['q_where'],true) as $condition ) {
			$querysrc_targetfield_ssid = $condition['q_targetfield_ssid'] ;
			$arr_where_conditions[$querysrc_targetfield_ssid] = $condition ;
		}
	}
	if( $post_data['q_progress'] ) {
		$arr_progress_conditions = array() ;
		foreach( json_decode($post_data['q_progress'],true) as $condition ) {
			$querysrc_targetfield_ssid = $condition['q_targetfield_ssid'] ;
			$arr_progress_conditions[$querysrc_targetfield_ssid] = $condition ;
		}
	}
	if( $post_data['q_vars'] ) {
		$arr_qvars = json_decode($post_data['q_vars'],true) ;
	}
	
	global $_opDB ;

	switch( $q_type )
	{
		case 'query' :
		if( $q_id && !is_numeric($q_id) ) {
			$q_id = $_opDB->query_uniqueValue("SELECT query_id FROM query WHERE query_name='{$q_id}'") ;
		}
		if( !$q_id ) {
			return array('success'=>false) ;
		}
		$query_id = $q_id ;
		if( !$auth_bypass && !Auth_Manager::getInstance()->auth_query_sdomain_action(
			Auth_Manager::sdomain_getCurrent(),
			'queries',
			array('query_id'=>$query_id),
			$write=false
		)) {
				return Auth_Manager::auth_getDenialResponse() ;
		}
		
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
		if( $q_id && !is_numeric($q_id) ) {
			$q_id = $_opDB->query_uniqueValue("SELECT qmerge_id FROM qmerge WHERE qmerge_name='{$q_id}'") ;
		}
		if( !$q_id ) {
			return array('success'=>false) ;
		}
		$qmerge_id = $q_id ;
		if( !$auth_bypass && !Auth_Manager::getInstance()->auth_query_sdomain_action(
			Auth_Manager::sdomain_getCurrent(),
			'queries',
			array('qmerge_id'=>$qmerge_id),
			$write=false
		)) {
				return Auth_Manager::auth_getDenialResponse() ;
		}
		
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
		if( $q_id && !is_numeric($q_id) ) {
			$q_id = $_opDB->query_uniqueValue("SELECT qsql_id FROM qsql WHERE qsql_name='{$q_id}'") ;
		}
		if( !$q_id ) {
			return array('success'=>false) ;
		}
		$qsql_id = $q_id ;
		if( !$auth_bypass && !Auth_Manager::getInstance()->auth_query_sdomain_action(
			Auth_Manager::sdomain_getCurrent(),
			'queries',
			array('qsql_id'=>$qsql_id),
			$write=false
		)) {
				return Auth_Manager::auth_getDenialResponse() ;
		}
		
		$arr_saisie = array() ;
		paracrm_queries_qsqlTransaction_init( array('qsql_id'=>$qsql_id) , $arr_saisie ) ;
		
		$RES = paracrm_queries_qsql_lib_exec($arr_saisie['sql_querystring'], $is_rw=FALSE, $auth_bypass=TRUE, $arr_qvars) ;
		
		return array('success'=>true,'tabs'=>array_values($RES)) ;
		
		
		
		case 'qweb' :
		if( $q_id && !is_numeric($q_id) ) {
			$q_id = $_opDB->query_uniqueValue("SELECT qweb_id FROM qweb WHERE qweb_name='{$q_id}'") ;
		}
		if( !$q_id ) {
			return array('success'=>false) ;
		}
		$qweb_id = $q_id ;
		if( !$auth_bypass && !Auth_Manager::getInstance()->auth_query_sdomain_action(
			Auth_Manager::sdomain_getCurrent(),
			'queries',
			array('qweb_id'=>$qweb_id),
			$write=false
		)) {
				return Auth_Manager::auth_getDenialResponse() ;
		}
		
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


}
?>
