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

	return array(
		'success'=>true,
		'prod_tree_root' => specWbBudget_budgetbuild_privGetProdsDataroot(),
		'columns' => $columns
	) ;
}





function specWbBudget_budgetbuild_privGetProdsDataroot() {
	global $_opDB ;
	
	$force_db = "op5_wonderful_prod_msbi" ;
	$bible_code = '_PROD_LOG' ;
	$field_txt_treenode = 'field_PRODGROUP_NAME' ;
	$field_txt_entry = 'field_PROD_TXT' ;
	
	$view_name_tree = $force_db.'.'.'view_bible_'.$bible_code.'_tree' ;
	$view_name_entry = $force_db.'.'.'view_bible_'.$bible_code.'_entry' ;
	
	$tab_parentkey_nodes = array() ;
	$query = "SELECT * FROM $view_name_tree" ;
	$result = $_opDB->query($query);
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$record = array() ;
		$record['id'] = 't_'.$arr['treenode_key'] ;
		$record['prod_is_sku'] = FALSE ;
		$record['prod_code'] = $arr['treenode_key'] ;
		$record['prod_text'] = $arr[$field_txt_treenode] ;
	
		$tab_parentkey_nodes[$arr['treenode_parent_key']][$arr['treenode_key']] = $record ;
	}
	$query = "SELECT * FROM $view_name_entry" ;
	$result = $_opDB->query($query);
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$record = array() ;
		$record['id'] = 'e_'.$arr['entry_key'] ;
		$record['prod_is_sku'] = TRUE ;
		$record['prod_code'] = $arr['entry_key'] ;
		$record['prod_text'] = $arr[$field_txt_entry] ;
		
		if( $arr['treenode_key'] == NULL ) {
			continue ;
		}
	
		$tab_parentkey_nodes[$arr['treenode_key']][] = $record ;
	}
	
	foreach( $tab_parentkey_nodes as $treenode_parent_key => $arr1 )
	{
		foreach( $arr1 as $treenode_key => $record )
		{
			$tab_parentkey_nodes[$treenode_parent_key][$treenode_key] = $record ;
		}
		ksort($tab_parentkey_nodes[$treenode_parent_key]) ;
	}
	
	$TAB_json = specWbBudget_budgetbuild_privGetProds_call( $tab_parentkey_nodes, '' ) ;
	return array(
		'id'=>'root',
		'prod_code'=>'&',
		'prod_text'=>'',
		'expanded'=>true,
		'children'=>$TAB_json
	) ;
}
function specWbBudget_budgetbuild_privGetProds_call( $tab_parentkey_nodes, $treenode_parent_key )
{
	global $_opDB ;
	
	$TAB_json = array() ;
	if( !$tab_parentkey_nodes[$treenode_parent_key] )
		return array() ;
	foreach( $tab_parentkey_nodes[$treenode_parent_key] as $treenode_key => $record )
	{
		if( $child_tab = specWbBudget_budgetbuild_privGetProds_call( $tab_parentkey_nodes, $treenode_key ) )
		{
			$record['expanded'] = true ;
			$record['children'] = $child_tab ;
		}
		else
		{
			$record['leaf'] = ( $record['prod_is_sku'] ) ;
			$record['children'] = array() ;
		}
		$TAB_json[] = $record ;
	}
	return $TAB_json ;
}



?>
