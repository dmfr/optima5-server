<?php

include("$server_root/modules/spec_wb_mrfoxy/include/specWbMrfoxy_promo.inc.php") ;
include("$server_root/modules/spec_wb_mrfoxy/include/specWbMrfoxy_auth.inc.php") ;
include("$server_root/modules/spec_wb_mrfoxy/include/specWbMrfoxy_stat.inc.php") ;
include("$server_root/modules/spec_wb_mrfoxy/include/specWbMrfoxy_finance.inc.php") ;

function specWbMrfoxy_tool_getProdLine( $prod_code ) {
	global $_opDB ;
	
	$bible_code = 'IRI_PROD' ;
	$tree_PROD = specWbMrfoxy_lib_getBibleTree($bible_code) ;
	
	$node = $tree_PROD->getTree($prod_code) ;
	if( $node == NULL ) {
		return null ;
	}
	while( $node->getDepth() > 1 ) {
		$node = $node->getParent() ;
		if( $node == NULL ) {
			return null ;
		}
	}
	$treenode_key = $node->getHead() ;
	$query = "SELECT field_PRODGROUPTXT FROM view_bible_{$bible_code}_tree WHERE treenode_key='$treenode_key'" ;
	$return_value = $_opDB->query_uniqueValue($query) ;
	
	unset($node) ;
	unset($tree_PROD) ;
	
	return $return_value ;
}
function specWbMrfoxy_tool_getProdNodes( $prod_code ) {
	global $_opDB ;
	
	$bible_code = 'IRI_PROD' ;
	$tree_PROD = specWbMrfoxy_lib_getBibleTree($bible_code) ;
	
	$node = $tree_PROD->getTree($prod_code) ;
	if( $node == NULL ) {
		return null ;
	}
	return $node->getAllMembers() ;
}
function specWbMrfoxy_tool_getStoreBrand( $store_code ) {
	global $_opDB ;
	
	$bible_code = 'IRI_STORE' ;
	$tree_STORE = specWbMrfoxy_lib_getBibleTree($bible_code) ;
	
	$node = $tree_STORE->getTree($store_code) ;
	if( $node == NULL ) {
		return null ;
	}
	while( $node->getDepth() > 2 ) {
		$node = $node->getParent() ;
		if( $node == NULL ) {
			return null ;
		}
	}
	$treenode_key = $node->getHead() ;
	$query = "SELECT field_STOREGROUP_TXT FROM view_bible_{$bible_code}_tree WHERE treenode_key='$treenode_key'" ;
	$return_value = $_opDB->query_uniqueValue($query) ;
	
	unset($node) ;
	unset($tree_STORE) ;
	
	return $return_value ;
}
function specWbMrfoxy_tool_getStoreNodes( $store_code ) {
	global $_opDB ;
	
	$bible_code = 'IRI_STORE' ;
	$tree_STORE = specWbMrfoxy_lib_getBibleTree($bible_code) ;
	
	$node = $tree_STORE->getTree($store_code) ;
	if( $node == NULL ) {
		return null ;
	}
	return $node->getAllMembers() ;
}


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


?>