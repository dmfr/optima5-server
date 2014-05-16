<?php
function specWbBudget_assortbuild_getGrid( $post_data ) {
	global $_opDB ;
	
	// ********* FILTERS **************
	$filter_cropYear = $post_data['filter_cropYear'] ;
	$filter_storeParent = $post_data['filter_country'] ;
	
	$store_nodes = array() ;
	$storeNode_codes = array() ;
	$query = "SELECT * FROM view_bible_IRI_STORE_tree 
			WHERE treenode_parent_key='$filter_storeParent' 
			ORDER BY treenode_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$store_code = $arr['treenode_key'] ;
		$store_text = $arr['field_STOREGROUP_TXT'] ;
		$store_nodes[] = array(
			'store_code' => $store_code,
			'store_text' => $store_text
		) ;
		
		$storeNode_codes[] = $store_code ;
	}
	
	
	$records = array() ;
	
	$assort_file = 'ASSORT' ;
	$assort_file_prods = 'ASSORT_PROD' ;
	$query = "SELECT a.* FROM view_file_{$assort_file} a
		WHERE a.field_CROP_YEAR='{$filter_cropYear}' AND a.field_STOREGROUP_CODE IN ".$_opDB->makeSQLlist($storeNode_codes) ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$filerecord_id = $arr['filerecord_id'] ;
		
		$records[$filerecord_id] = array(
			'crop_year' => $arr['field_CROP_YEAR'],
			'store_code' => $arr['field_STOREGROUP_CODE'],
			'prods' => array()
		) ;
	}
	$query = "SELECT ap.* FROM view_file_{$assort_file_prods} ap
			JOIN view_file_{$assort_file} a ON a.filerecord_id = ap.filerecord_parent_id
		WHERE a.field_CROP_YEAR='{$filter_cropYear}' AND a.field_STOREGROUP_CODE IN ".$_opDB->makeSQLlist($storeNode_codes) ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$filerecord_parent_id = $arr['filerecord_parent_id'] ;
		
		if( !$records[$filerecord_parent_id] ) {
			continue ;
		}
		$records[$filerecord_parent_id]['prods'][] = array(
			'prod_code' => $arr['field_PROD_CODE'],
			'assort_is_on' => $arr['field_ASSORT_IS_ON']
		) ;
	}

				

	return array(
		'success'=>true,
		'prod_tree_root' => specWbBudget_tool_getProdsDataroot(),
		'store_nodes' => $store_nodes,
		'records' => array_values($records)
	) ;
}


function specWbBudget_assortbuild_setRecords( $post_data ) {
	$records = json_decode($post_data['records'],true) ;
	foreach( $records as $assortRecord ) {
		$arr_ins = array() ;
		$arr_ins['field_CROP_YEAR'] = $assortRecord['crop_year'] ;
		$arr_ins['field_STOREGROUP_CODE'] = $assortRecord['store_code'] ;
		$filerecord_id = paracrm_lib_data_insertRecord_file( 'ASSORT', 0, $arr_ins ) ;
	
		foreach( $assortRecord['prods'] as $assortProdRecord ) {
			$arr_ins = array() ;
			$arr_ins['field_PROD_CODE'] = $assortProdRecord['prod_code'] ;
			$arr_ins['field_ASSORT_IS_ON'] = ( $assortProdRecord['assort_is_on'] ? 1 : 0 ) ;
			paracrm_lib_data_insertRecord_file( 'ASSORT_PROD', $filerecord_id, $arr_ins ) ;
		}
	}
	return array('success'=>true) ;
}

?>