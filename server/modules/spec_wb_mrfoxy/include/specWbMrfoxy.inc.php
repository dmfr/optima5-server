<?php

include("$server_root/modules/spec_wb_mrfoxy/include/specWbMrfoxy_promo.inc.php") ;
include("$server_root/modules/spec_wb_mrfoxy/include/specWbMrfoxy_auth.inc.php") ;
include("$server_root/modules/spec_wb_mrfoxy/include/specWbMrfoxy_stat.inc.php") ;
include("$server_root/modules/spec_wb_mrfoxy/include/specWbMrfoxy_finance.inc.php") ;
include("$server_root/modules/spec_wb_mrfoxy/include/specWbMrfoxy_xls.inc.php") ;

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
function specWbMrfoxy_tool_getBrandEntries( $brand_code ) {
	global $_opDB ;
	
	$bible_code = '_BRAND' ;
	$tree_BRAND = specWbMrfoxy_lib_getBibleTree($bible_code) ;
	
	$node = $tree_BRAND->getTree($brand_code) ;
	if( $node == NULL ) {
		return null ;
	}
	$brand_nodes = $node->getAllMembers() ;
	
	$ttmp = paracrm_data_getBibleGrid( array('bible_code'=>'_BRAND') ) ;
	$entries = array() ;
	foreach( $ttmp['data'] as $row ) {
		if( !in_array($row['treenode_key'],$brand_nodes) ) {
			continue ;
		}
		$entries[] = $row['entry_key'] ;
	}
	return $entries ;
}


function specWbMrfoxy_tool_getCropIntervals() {
	global $_opDB ;
	
	$file_code = '_CFG_CROP' ;
	$forward_post = array() ;
	$forward_post['start'] ;
	$forward_post['limit'] ;
	$forward_post['file_code'] = $file_code ;
	$forward_post['sort'] = json_encode(array(array('property'=>'_CFG_CROP_field_CROP_YEAR', 'direction'=>'DESC'))) ;
	$ttmp = paracrm_data_getFileGrid_data( $forward_post, $auth_bypass=TRUE ) ;
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


function specWbMrfoxy_cfg_getBibleCountry() {
	$ttmp = paracrm_data_getBibleGrid( array('bible_code'=>'_COUNTRY') ) ;
	if( !is_array($arr_countries = specWbMrfoxy_auth_lib_getCountries()) ) {
		return $ttmp ;
	}
	
	$data = array() ;
	foreach( $ttmp['data'] as $row ) {
		if( !in_array($row['entry_key'],$arr_countries) ) {
			continue ;
		}
		$data[] = $row ;
	}
	return array('success'=>true, 'data'=>$data) ;
}
function specWbMrfoxy_cfg_getBibleBrand() {
	$ttmp = paracrm_data_getBibleTree( array('bible_code'=>'_BRAND') ) ;
	$data = array() ;
	foreach( $ttmp['children'] as $treenode ) {
		$data[] = $treenode ;
	}
	return array('success'=>true, 'data'=>$data) ;
}

?>