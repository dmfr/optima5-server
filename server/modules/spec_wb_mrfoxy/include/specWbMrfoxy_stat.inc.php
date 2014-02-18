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
	foreach( $arr_saisie['fields_mwhere'] as &$field_mwhere ) {
		//print_r($field_mwhere) ;
		if( $field_mwhere['mfield_type'] == 'link' && $field_mwhere['mfield_linkbible'] == '_COUNTRY' && $form_data['country_code'] ) {
			$field_mwhere['condition_bible_entries'] = $form_data['country_code'] ;
		}
		if( $field_mwhere['mfield_type'] == 'link' && $field_mwhere['mfield_linkbible'] == 'IRI_STORE' && $form_data['store_code'] ) {
			$field_mwhere['condition_bible_treenodes'] = json_encode(array($form_data['store_code'])) ;
		}
		if( $field_mwhere['mfield_type'] == 'link' && $field_mwhere['mfield_linkbible'] == 'IRI_PROD' && $form_data['product_code'] ) {
			$field_mwhere['condition_bible_treenodes'] = json_encode(array($form_data['product_code'])) ;
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
		return array('success'=>true, 'tabs'=>$tabs) ;
	}
	return array('success'=>true) ;
}

?>