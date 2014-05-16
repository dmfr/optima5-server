<?php

include("$server_root/modules/spec_wb_budget/include/specWbBudget_build.inc.php") ;
include("$server_root/modules/spec_wb_budget/include/specWbBudget_assort.inc.php") ;


function specWbMrfoxy_tool_getCropIntervals() {
	global $_opDB ;
	
	$file_code = '_CFG_CROP' ;
	$forward_post = array() ;
	$forward_post['start'] ;
	$forward_post['limit'] ;
	$forward_post['file_code'] = $file_code ;
	$forward_post['sort'] = json_encode(array(array('property'=>'_CFG_CROP_field_CROP_YEAR', 'direction'=>'DESC'))) ;
	$ttmp = paracrm_data_getFileGrid_data( $forward_post ) ;
	$paracrm_TAB = $ttmp['data'] ;
	
	$TAB = array() ;
	foreach( $paracrm_TAB as $paracrm_row ) {
		$row = array() ;
		$row['crop_year'] = $paracrm_row['_CFG_CROP_field_CROP_YEAR'] ;
		$row['date_apply'] = date('Y-m-d',strtotime($paracrm_row['_CFG_CROP_field_DATE_APPLY'])) ;
		$TAB[] = $row ;
	}
	return $TAB ;
}




function specWbBudget_tool_getProdsDataroot() {
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
	
	$TAB_json = specWbBudget_tool_getProds_call( $tab_parentkey_nodes, '' ) ;
	return array(
		'id'=>'root',
		'prod_code'=>'&',
		'prod_text'=>'',
		'expanded'=>true,
		'children'=>$TAB_json
	) ;
}
function specWbBudget_tool_getProds_call( $tab_parentkey_nodes, $treenode_parent_key )
{
	global $_opDB ;
	
	$TAB_json = array() ;
	if( !$tab_parentkey_nodes[$treenode_parent_key] )
		return array() ;
	foreach( $tab_parentkey_nodes[$treenode_parent_key] as $treenode_key => $record )
	{
		if( $child_tab = specWbBudget_tool_getProds_call( $tab_parentkey_nodes, $treenode_key ) )
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