<?php

function specWbMrfoxy_lib_getBibleTree( $bible_code ) {
	global $_opDB ;
	global $specwbmrfoxy_arr_bible_trees ;

	if( !$specwbmrfoxy_arr_bible_trees[$bible_code] ) {
		$query = "SELECT treenode_key, treenode_parent_key FROM store_bible_{$bible_code}_tree ORDER BY treenode_key" ;
		$result = $_opDB->query($query) ;
		$raw_records = array() ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
		{
			$record = array() ;
			$record['treenode_key'] = $arr['treenode_key'] ;
			$record['treenode_parent_key'] = $arr['treenode_parent_key'] ;
			$raw_records[] = $record ;
		}
		
		$tree = new GenericTree("&") ;
		do {
			$nb_pushed_this_pass = 0 ;
			foreach( $raw_records as $mid => $record )
			{
				if( $record['treenode_parent_key'] == '' )
					$record['treenode_parent_key'] = '&' ;
				if( $record['treenode_key'] == '' )
					continue ;
			
				$treenode_parent_key = $record['treenode_parent_key'] ;
				$treenode_key = $record['treenode_key'] ;
				
				if( $tree->getTree( $treenode_parent_key ) != NULL )
				{
					$parent_node = $tree->getTree( $treenode_parent_key ) ;
					$parent_node->addLeaf( $treenode_key ) ;
					unset($raw_records[$mid]) ;
					
					$nb_pushed_this_pass++ ;
					$nb_pushed++ ;
				}
				if( count($raw_records) == 0 )
					break ;
			}
		}
		while( $nb_pushed_this_pass > 0 ) ;
		$specwbmrfoxy_arr_bible_trees[$bible_code] = $tree ;
	}
	
	return $specwbmrfoxy_arr_bible_trees[$bible_code] ;
}

function specWbMrfoxy_promo_getGrid( $post_data ) {
	$forward_post = array() ;
	$forward_post['start'] ;
	$forward_post['limit'] ;
	$forward_post['file_code'] = 'WORK_PROMO' ;
	
	if( isset($post_data['filter']) ) {
		$forward_post['filter'] = array() ;
		foreach( json_decode($post_data['filter'],true) as $filter ) {
			$paracrm_field = NULL ;
			switch( $filter['field'] ) {
				case 'date_start' : $paracrm_field='WORK_PROMO_field_DATE_START' ; break ;
				case 'store_text' : $paracrm_field='WORK_PROMO_field_STORE' ; break ;
				case 'prod_text' : $paracrm_field='WORK_PROMO_field_PROD' ; break ;
				case 'mechanics_text' : $paracrm_field='WORK_PROMO_field_MECH_TYPE' ; break ;
				default : continue 2 ;
			}
			$filter['field'] = $paracrm_field ;
			$forward_post['filter'][] = $filter ;
		}
		$forward_post['filter'] = json_encode($forward_post['filter']) ;
	}
	
	$ttmp = paracrm_data_getFileGrid_data( $forward_post ) ;
	$paracrm_TAB = $ttmp['data'] ;
	
	$TAB = array() ;
	foreach( $paracrm_TAB as $paracrm_row ) {
		if( $post_data['filter_country'] && $post_data['filter_country'] != $paracrm_row['WORK_PROMO_field_COUNTRY'] ) {
			continue ;
		}
	
		$row = array() ;
		$row['_filerecord_id'] = $paracrm_row['filerecord_id'] ;
		$row['promo_id'] = $paracrm_row['WORK_PROMO_field_PROMO_CODE'] ;
		$row['country_code'] = $paracrm_row['WORK_PROMO_field_COUNTRY'] ;
		$row['status_percent'] = $paracrm_row['WORK_PROMO_field_STATUS_entry_PERCENT'] ;
		$row['status_text'] = $paracrm_row['WORK_PROMO_field_STATUS_entry_STATUS_TXT'] ;
		$row['date_start'] = date('Y-m-d',strtotime($paracrm_row['WORK_PROMO_field_DATE_START'])) ;
		$row['date_end'] = date('Y-m-d',strtotime($paracrm_row['WORK_PROMO_field_DATE_END'])) ;
		$row['store_text'] = $paracrm_row['WORK_PROMO_field_STORE_tree_STOREGROUP_TXT'] ;
		$row['prod_text'] = $paracrm_row['WORK_PROMO_field_PROD_tree_PRODGROUPTXT'] ;
		$row['mechanics_code'] = $paracrm_row['WORK_PROMO_field_MECH_TYPE_tree'] ;
		$row['mechanics_text'] = $paracrm_row['WORK_PROMO_field_MECH_TYPE_tree_CLASS_TXT'].' - '.$paracrm_row['WORK_PROMO_field_MECH_DETAIL'] ;
		$row['calc_uplift_vol'] = $paracrm_row['WORK_PROMO_field_CALC_UPLIFT_VOL'] ;
		$row['calc_uplift_per'] = $paracrm_row['WORK_PROMO_field_CALC_UPLIFT_PER'] ;
		$row['calc_roi'] = $paracrm_row['WORK_PROMO_field_CALC_ROI'] ;
		$row['obs_atl'] = $paracrm_row['WORK_PROMO_field_OBS_ATL'] ;
		$row['obs_btl'] = $paracrm_row['WORK_PROMO_field_OBS_BTL'] ;
		$row['obs_comment'] = $paracrm_row['WORK_PROMO_field_OBS_COMMENT'] ;
		
		// nb weeks
		$date2 = strtotime($row['date_end']);
		$date1 = strtotime($row['date_start']);
		$datediff = $date2 - $date1;
		$row['date_length_weeks'] = ceil($datediff/(60*60*24*7));		
		
		// store : enseigne
		$treenode_key = $paracrm_row['WORK_PROMO_field_STORE_tree_STOREGROUP'] ;
		$tree_STORE = specWbMrfoxy_lib_getBibleTree('IRI_STORE') ;
		$node_STORE = $tree_STORE->getTree($treenode_key) ;
		while( $node_STORE->getDepth() > 2 ) {
			$node_STORE = $node_STORE->getParent() ;
		}
		$row['store_node'] = $node_STORE->getHead() ;
		
		$TAB[] = $row ;
	}
	return array('success'=>true, 'data'=>$TAB, 'debug'=>$paracrm_TAB) ;
}

function specWbMrfoxy_promo_getCalendarAccounts( $post_data ) {
	global $_opDB ;
	
	$data = array() ;
	
	$bible_code = 'IRI_STORE' ;
	
	$map_treenode_txt = array() ;
	$query = "SELECT treenode_key, field_STOREGROUP_TXT FROM view_bible_{$bible_code}_tree" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$map_treenode_txt[$arr[0]] = $arr[1] ;
	}
	
	$tree_STORE = specWbMrfoxy_lib_getBibleTree('IRI_STORE') ;
	foreach( $tree_STORE->getAllMembersForDepth(2) as $treenode_key ) {
		if( $post_data['filter_country'] ) {
			$node = $tree_STORE->getTree($treenode_key) ;
			while( $node->getDepth() > 1 ) {
				$node = $node->getParent() ;
			}
			if( $node->getHead() != $post_data['filter_country'] ) {
				continue ;
			}
		}
		
		$row = array() ;
		$row['store_node'] = $treenode_key ;
		$row['store_node_txt'] = $map_treenode_txt[$treenode_key] ;
		$data[] = $row ;
	}
	
	return array('success'=>true,'data'=>$data) ;
}

function specWbMrfoxy_promo_getSideGraph( $post_data ) {
	$src_filerecordId = $post_data['filerecord_id'] ;
	
	$post_test = array() ;
	$post_test['_action'] = 'queries_qbookTransaction' ;
	$post_test['_subaction'] = 'init' ;
	$post_test['qbook_id'] = 1 ;
	$json = paracrm_queries_qbookTransaction( $post_test ) ;
	$transaction_id = $json['transaction_id'] ;
	
	$post_test = array() ;
	$post_test['_action'] = 'queries_qbookTransaction' ;
	$post_test['_transaction_id'] = $transaction_id ;
	$post_test['_subaction'] = 'run' ;
	$post_test['qsrc_filerecord_id'] = $src_filerecordId ;
	$json = paracrm_queries_qbookTransaction( $post_test ) ;
	if( !$json['success'] ) {
		return array('success'=>false) ;
	}

	$post_test = array() ;
	$post_test['_action'] = 'queries_qbookTransaction' ;
	$post_test['_transaction_id'] = $transaction_id ;
	$post_test['_subaction'] = 'res_get' ;
	$post_test['RES_id'] = $json['RES_id'] ;
	$json = paracrm_queries_qbookTransaction( $post_test ) ;
	
	if( $json['tabs'] ) {
		return array('success'=>true, 'RESchart_static'=>$json['tabs'][3]['RESchart_static']) ;
	}
	return array('success'=>false) ;
}

function specWbMrfoxy_promo_formEval( $post_data ) {
	global $_opDB ;
	
	$resp_data = array() ;
	
	$form_data = json_decode($post_data['data'],true) ;
	if( $form_data['store_code'] ) {
		$bible_code = 'IRI_STORE' ;
		$tree_STORE = specWbMrfoxy_lib_getBibleTree($bible_code) ;
		
		$node = $tree_STORE->getTree($form_data['store_code']) ;
		while( $node->getDepth() > 2 ) {
			$node = $node->getParent() ;
		}
		$treenode_key = $node->getHead() ;
		$query = "SELECT field_STOREGROUP_TXT FROM view_bible_{$bible_code}_tree WHERE treenode_key='$treenode_key'" ;
		$resp_data['store_master'] = $_opDB->query_uniqueValue($query) ;
		
		unset($node) ;
		unset($tree_STORE) ;
	} else {
		$resp_data['store_master'] = '' ;
	}
	
	$form_data = json_decode($post_data['data'],true) ;
	if( $form_data['prod_code'] ) {
		$bible_code = 'IRI_PROD' ;
		$tree_PROD = specWbMrfoxy_lib_getBibleTree($bible_code) ;
		
		$node = $tree_PROD->getTree($form_data['prod_code']) ;
		while( $node->getDepth() > 1 ) {
			$node = $node->getParent() ;
		}
		$treenode_key = $node->getHead() ;
		$query = "SELECT field_PRODGROUPTXT FROM view_bible_{$bible_code}_tree WHERE treenode_key='$treenode_key'" ;
		$resp_data['prod_master'] = $_opDB->query_uniqueValue($query) ;
		
		unset($node) ;
		unset($tree_PROD) ;
	} else {
		$resp_data['prod_master'] = '' ;
	}
	
	$ttmp = specWbMrfoxy_promo_getGrid(array()) ;
	$resp_data['gridBenchmark'] = $ttmp['data'];
	
	$resp_data['mechanics_multi'] = array() ;
	$query = "SELECT field_DETAILS_TXT FROM view_bible_PROMO_MECH_entry WHERE treenode_key='MULTI'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$resp_data['mechanics_multi'][] = array('txt'=>$arr[0]) ;
	}

	return array('success'=>true,'data'=>$resp_data) ;
}

function specWbMrfoxy_promo_formSubmit( $post_data ) {
	global $_opDB ;
	
	$form_data = json_decode($post_data['data'],true) ;
	
	$arr_ins = array() ;
	$arr_ins['field_PROMO_CODE'] = 'CODE/TODO' ;
	$arr_ins['field_COUNTRY'] = $form_data['country_code'] ;
	$arr_ins['field_STATUS'] = '10_ENCODED' ;
	$arr_ins['field_BRAND'] = $form_data['brand_code'] ;
	$arr_ins['field_DATE_START'] = $form_data['date_start'] ;
	$arr_ins['field_DATE_END'] = $form_data['date_end'] ;
	$arr_ins['field_STORE'] = $form_data['store_code'] ;
	$arr_ins['field_PROD'] = $form_data['prod_code'] ;
	
	$arr_ins['field_MECH_TYPE'] = $form_data['mechanics_code'] ;
	switch( $form_data['mechanics_code'] ) {
		case 'MULTI' :
			$arr_ins['field_MECH_DETAIL'] = $form_data['mechanics_multi_combo'] ;
			break ;
		case 'MONO' :
			$arr_ins['field_MECH_DETAIL'] = $form_data['mechanics_mono_discount'].' % discount' ;
			break ;
	}
	
	$arr_ins['field_COST_FORECAST'] = $form_data['forecast_cost'] ;
	
	
	
	if( $form_data['_filerecord_id'] ) {
		paracrm_lib_data_insertRecord_file( 'WORK_PROMO',$arr_ins, $form_data['_filerecord_id']) ;
	} else {
		paracrm_lib_data_insertRecord_file( 'WORK_PROMO',0,$arr_ins) ;
	}
	
	
	return array('success'=>true) ;
}


function specWbMrfoxy_promo_delete( $post_data ) {
	$src_filerecordId = $post_data['filerecord_id'] ;
	paracrm_lib_data_deleteRecord_file('WORK_PROMO',$src_filerecordId) ;
	return array('success'=>true) ;
}
?>