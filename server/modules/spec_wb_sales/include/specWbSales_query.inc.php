<?php

function specWbSales_query_getResult( $post_data ) {
	global $_opDB ;
	
	global $_opDB ;
	$form_data = json_decode($post_data['data'],true) ;
	
	$q_id = 'QUERY' ;
	if( !is_numeric($q_id) ) {
		$query = "SELECT query_id FROM query WHERE query_name LIKE '{$q_id}'";
		$q_id = $_opDB->query_uniqueValue($query) ;
		if( !$q_id ) {
			return array('success'=>false) ;
		}
	}
	
	$arr_saisie = array() ;
	paracrm_queries_builderTransaction_init( array('query_id'=>$q_id) , $arr_saisie ) ;
	
	
	// eval params
	$query_vars = array() ;
	switch( $query_vars['time_mode'] = $form_data['time_mode'] ) {
		case 'MONTH' :
			$query_vars['date_start'] = '2014-05-01' ;
			$query_vars['date_end'] = '2014-05-31' ;
			break ;
			
		case 'CROP' :
			$query_vars['date_start'] = '2013-09-01' ;
			$query_vars['date_end'] = '2014-05-31' ;
			break ;
			
		case 'DATES' :
			$query_vars['date_start'] = $form_data['date_start'] ;
			$query_vars['date_end'] = $form_data['date_end'] ;
			break ;
	}
	if( $form_data['custgroup_code'] ) {
		$query_vars['customer_code'] = $form_data['custgroup_code'] ;
		$query_vars['customer_text'] = $_opDB->query_uniqueValue("SELECT field_CUSTGROUP_NAME FROM view_bible_CUSTOMER_tree WHERE treenode_key='{$form_data['custgroup_code']}'") ;
	} elseif( $form_data['country_code'] ) {
		$query_vars['customer_code'] = $form_data['country_code'] ;
		$query_vars['customer_text'] = $_opDB->query_uniqueValue("SELECT field_CUSTGROUP_NAME FROM view_bible_CUSTOMER_tree WHERE treenode_key='{$form_data['country_code']}'") ;
	} else {
	
	}
	
	$query_vars['treeview_mode'] = $form_data['treeview_mode'] ;
	switch( $form_data['treeview_mode'] ) {
		case 'CUSTOMER' :
			$query_vars['treeview_text'] = 'Customers' ;
			break ;
		case 'PRODUCT' :
			$query_vars['treeview_text'] = 'Products' ;
			$form_data['has_x'] = FALSE ;
			break ;
	}
	
	
	
	// replace conditions
	foreach( $arr_saisie['fields_where'] as &$field_where ) {
		//print_r($field_mwhere) ;
		if( $field_where['field_type'] == 'date' ) {
			$field_where['condition_date_lt'] = $query_vars['date_end'] ;
			$field_where['condition_date_gt'] = $query_vars['date_start'] ;
		}
		if( $field_where['field_type'] == 'link' && $field_where['field_linkbible'] == 'CUSTOMER' && $query_vars['customer_code'] ) {
			$field_where['condition_bible_treenodes'] = json_encode(array($query_vars['customer_code'])) ;
		}
	}
	unset($field_where) ;
	foreach( $arr_saisie['fields_group'] as $idx => &$field_group ) {
		//print_r($field_mwhere) ;
		if( $field_group['display_geometry'] == 'grid-y' && $field_group['field_type'] == 'link' && $field_group['field_linkbible'] != $form_data['treeview_mode'] ) {
			unset($arr_saisie['fields_group'][$idx]) ;
		}
		if( $field_group['display_geometry'] == 'grid-x' && !$form_data['has_x'] ) {
			unset($arr_saisie['fields_group'][$idx]) ;
		}
	}
	unset($field_group) ;
	$new_select = array() ;
	foreach( $arr_saisie['fields_select'] as $idx => $field_select ) {
		//print_r($field_mwhere) ;
		if( $form_data['has_x'] && $field_select['select_lib'] != $form_data['select_value'] ) {
			continue ;
		}
		$new_select[] = $field_select ;
	}
	$arr_saisie['fields_select'] = $new_select ;
	
	
	
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

?>
