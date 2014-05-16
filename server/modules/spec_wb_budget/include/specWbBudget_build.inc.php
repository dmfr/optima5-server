<?php

function specWbBudget_budgetbuild_getGrid( $post_data ) {
	global $_opDB ;
	
	
	// ********* CROP BOUNDARIES **************
	$filter_cropYear = $post_data['filter_cropYear'] ;
	
	// crop principal
	$query = "SELECT * FROM view_file__CFG_CROP WHERE field_CROP_YEAR='{$filter_cropYear}'" ;
	$result = $_opDB->query($query) ;
	$arr_crop = $_opDB->fetch_assoc($result) ;
	if( $arr_crop == FALSE ) {
		return array('success'=>false) ;
	}
	$down_limit = strtotime($arr_crop['field_DATE_APPLY']) ;
	
	// up_limit
	$query = "SELECT field_DATE_APPLY FROM view_file__CFG_CROP
		WHERE field_DATE_APPLY > '{$arr_crop['field_DATE_APPLY']}'
		ORDER BY field_DATE_APPLY LIMIT 1" ;
	$up_limit = $_opDB->query_uniqueValue($query) ;
	if( $up_limit == NULL ) {
		$up_limit = strtotime('+1 year',strtotime($arr_crop['field_DATE_APPLY'])) ;
	} else {
		$up_limit = strtotime($up_limit) ;
	}
	$up_limit = strtotime('-1 day',$up_limit) ;

	$to_sunday = 7 - date('N',$down_limit) ;
	$cursor = strtotime("+{$to_sunday} day",$down_limit) ;
	$columns = array() ;
	while( $cursor < $up_limit ) {
		$columns[] = array(
			'date_sql' => date('Y-m-d',$cursor),
			'week_text' => date('o/W',$cursor),
			'date_sql_start' => date('Y-m-d',strtotime('-6 days',$cursor)),
			'date_sql_end' => date('Y-m-d',$cursor)
		);
		$cursor = strtotime('+7 days',$cursor) ;
	}
	
	
	
	
	// ********* FILTERS **************
	$filter_storeParent = $post_data['filter_country'] ;
	
	$store_nodes = array() ;
	$storeNode_codes = array() ;
	$query = "SELECT * FROM view_bible_IRI_STORE_tree 
			WHERE treenode_parent_key='$filter_storeParent' 
			ORDER BY treenode_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$store_code = $arr['treenode_key'] ;
		$storeNode_codes[] = $store_code ;
	}
	
	
	$filter_store = $post_data['filter_stores'] ;
	$parent_store = $filter_store ;
	while( true ) {
		if( in_array($parent_store,$storeNode_codes) ) {
			break ;
		}
		$query = "SELECT treenode_parent_key FROM view_bible_IRI_STORE_tree WHERE treenode_key='{$parent_store}'";
		$parent_store = $_opDB->query_uniqueValue($query) ;
		if( $parent_store == NULL ) {
			break ;
		}
	}
	if( $parent_store == NULL ) {
		return array('success'=>false) ;
	}
	
	$assort_prods = array() ;
	$query = "SELECT ap.* FROM view_file_ASSORT_PROD ap
			JOIN view_file_ASSORT a ON a.filerecord_id = ap.filerecord_parent_id
		WHERE a.field_CROP_YEAR='{$filter_cropYear}' AND a.field_STOREGROUP_CODE='{$parent_store}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		if( $arr['field_ASSORT_IS_ON'] ) {
			$assort_prods[] = $arr['field_PROD_CODE'] ;
		}
	}
	
	
	

	return array(
		'success'=>true,
		'prod_tree_root' => specWbBudget_tool_getProdsDataroot(),
		'assort_prods' => $assort_prods,
		'columns' => $columns
	) ;
}







?>
