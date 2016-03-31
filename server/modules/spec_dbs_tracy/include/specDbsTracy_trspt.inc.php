<?php

function specDbsTracy_trspt_getRecords( $post_data ) {
	global $_opDB ;
	
	// filter ?
	if( isset($post_data['filter_trsptFilerecordId_arr']) ) {
		$filter_trsptFilerecordId_list = $_opDB->makeSQLlist( json_decode($post_data['filter_trsptFilerecordId_arr'],true) ) ;
	}
	
	$TAB_trspt = array() ;
	
	$query = "SELECT * FROM view_file_TRSPT t" ;
	$query.= " WHERE 1" ;
	if( isset($filter_trsptFilerecordId_list) ) {
		$query.= " AND t.filerecord_id IN {$filter_trsptFilerecordId_list}" ;
	}
	$query.= " ORDER BY t.filerecord_id DESC" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB_trspt[$arr['filerecord_id']] = array(
			'trspt_filerecord_id' => $arr['filerecord_id'],
			'id_soc' => $arr['field_ID_SOC'],
			'id_doc' => $arr['field_ID_DOC'],
			'date_create' => $arr['field_DATE_CREATE'],
			'atr_priority' => $arr['field_ATR_PRIORITY'],
			'atr_incoterm' => $arr['field_ATR_INCOTERM'],
			'atr_consignee' => $arr['field_ATR_CONSIGNEE'],
			'mvt_carrier' => $arr['field_MVT_CARRIER'],
			'mvt_origin' => $arr['field_MVT_ORIGIN'],
			'mvt_dest' => $arr['field_MVT_DEST'],
			'flight_awb' => $arr['field_FLIGHT_AWB'],
			'flight_date' => $arr['field_FLIGHT_DATE'],
			'flight_code' => $arr['field_FLIGHT_CODE'],
			
			'calc_step' => NULL,
			
			'events' => array(),
			'orders' => array()
		);
	}
	
	$query = "SELECT * FROM view_file_TRSPT_EVENT te" ;
	$query.= " WHERE 1" ;
	if( isset($filter_trsptFilerecordId_list) ) {
		$query.= " AND te.filerecord_parent_id IN {$filter_trsptFilerecordId_list}" ;
	}
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB_trspt[$arr['filerecord_parent_id']]['events'][] = array(
			'trsptevent_filerecord_id' => $arr['filerecord_id'],
			'event_date' => $arr['field_EVENT_DATE'],
			'event_user' => $arr['field_EVENT_USER'],
			'event_txt' => $arr['field_EVENT_TXT']
		);
	}
	
	$query = "SELECT * FROM view_file_TRSPT_CDE to" ;
	$query.= " WHERE 1" ;
	if( isset($filter_trsptFilerecordId_list) ) {
		$query.= " AND to.filerecord_parent_id IN {$filter_trsptFilerecordId_list}" ;
	}
	$result = $_opDB->query($query) ;
	$filter_orderFilerecordId_arr = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB_trspt[$arr['filerecord_parent_id']]['orders'][] = array(
			'trsptorder_filerecord_id' => $arr['filerecord_id'],
			'order_filerecord_id' => $arr['field_FILE_CDE_ID'],
			'link_is_cancel' => $arr['field_LINK_IS_CANCEL']
		);
		
		$filter_orderFilerecordId_arr[] = $arr['field_FILE_CDE_ID'] ;
	}
	
	$ttmp = specDbsTracy_order_getRecords( array(
		'filter_orderFilerecordId_arr'=> json_encode($filter_orderFilerecordId_arr)
	) ) ;
	$TAB_order = array() ;
	foreach( $ttmp['data'] as $row_order ) {
		$TAB_orders[$row_order['order_filerecord_id']] = $row_order ;
	}
	
	foreach( $TAB_trpst as &$row_trspt ) {
		foreach( $row_trspt['orders'] as &$row_trsptorder ) {
			if( !($row_order = $TAB_order[$row_trsptorder['order_filerecord_id']]) ) {
				continue ;
			}
			$row_trsptorder += $row_order ;
		}
		unset($row_trsptorder) ;
	}
	unset($row_trspt) ;
	
	return array('success'=>true, 'data'=>array_values($TAB_trspt)) ;
}

?>
