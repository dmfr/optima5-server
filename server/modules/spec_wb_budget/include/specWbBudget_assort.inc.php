<?php
function specWbBudget_assortbuild_getGrid( $post_data ) {
	global $_opDB ;
	
	// ********* FILTERS **************
	$filter_cropYear = $post_data['filter_cropYear'] ;
	$filter_storeParent = $post_data['filter_country'] ;
	
	$store_nodes = array() ;
	$query = "SELECT * FROM view_bible_IRI_STORE_tree 
			WHERE treenode_parent_key='$filter_storeParent' 
			ORDER BY treenode_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$store_code = $treenode_key ;
		$store_text = $arr['field_STOREGROUP_TXT'] ;
		$store_nodes[] = array(
			'store_code' => $store_code,
			'store_text' => $store_text
		) ;
	}

	return array(
		'success'=>true,
		'prod_tree_root' => specWbBudget_tool_getProdsDataroot(),
		'store_nodes' => $store_nodes
	) ;
}

?>