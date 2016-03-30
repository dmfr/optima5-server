<?php

function specDbsTracy_files_getTrspt( $post_data ) {
	global $_opDB ;
	
	if( isset($post_data['filter_trsptFilerecordId']) && $post_data['filter_trsptFilerecordId']===0 ) {
		// mapping NEW
		
	}
	
	
	
	// filter ?
	if( isset($post_data['filter_trsptFilerecordId_arr']) ) {
		$filter_trsptFilerecordId_list = $_opDB->makeSQLlist( json_decode($post_data['filter_trsptFilerecordId_arr'],true) ) ;
	}
	
	$query = "SELECT * FROM view_file_TRSPT t" ;
	$query = " WHERE 1" ;
	if( isset($post_data['filter_trsptFilerecordId']) ) {
		$query = " AND t.filerecord_id IN {$filter_trsptFilerecordId_list}" ;
	}
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
	
	}
	
	$query = "SELECT * FROM view_file_TRSPT_EVENT te" ;
	$query.= " WHERE 1" ;
	if( isset($post_data['filter_trsptFilerecordId']) ) {
		$query = " AND te.filerecord_parent_id IN {$filter_trsptFilerecordId_list}" ;
	}
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
	
	}
	
	$query = "SELECT * FROM view_file_TRSPT_ORDER to" ;
	$query.= " WHERE 1" ;
	if( isset($post_data['filter_trsptFilerecordId']) ) {
		$query = " AND to.filerecord_parent_id IN {$filter_trsptFilerecordId_list}" ;
	}
	$result = $_opDB->query($query) ;
	$filter_orderFilerecordId_arr = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		
		$filter_orderFilerecordId_arr[] = $arr['field_FILE_ORDER_ID'] ;
	}
	
	
	
	$ttmp = specDbsTracy_files_getOrder( array(
		'filter_orderFilerecordId_arr'=> json_encode($filter_orderFilerecordId_arr)
	) ) ;
	$TAB_orders = array() ;
	foreach( $ttmp['data'] as $row_order ) {
		$TAB_orders[$row_order['order_filerecord_id']] = $row_order ;
	}
	
	foreach( $TAB_trpst as &$row_trspt ) {
		foreach( $row_trspt['orders'] as &$row_trsptorder ) {
			if( !($row_order = $TAB_orders[$row_trsptorder['order_filerecord_id']]) ) {
				continue ;
			}
			$row_trsptorder += $row_order ;
		}
		unset($row_trsptorder) ;
	}
	unset($row_trspt) ;
	
	return array('success'=>true, 'data'=>array_values($TAB_trspt)) ;
}

function specDbsTracy_files_getOrder( $post_data ) {

}

?>
