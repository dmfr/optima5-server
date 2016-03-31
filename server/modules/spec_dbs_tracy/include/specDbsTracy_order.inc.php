<?php

function specDbsTracy_order_getRecords( $post_data ) {
	global $_opDB ;
	
	// filter ?
	if( isset($post_data['filter_orderFilerecordId_arr']) ) {
		$filter_orderFilerecordId_list = $_opDB->makeSQLlist( json_decode($post_data['filter_orderFilerecordId_arr'],true) ) ;
	}
	
	$TAB_order = array() ;
	
	$query = "SELECT * FROM view_file_CDE c" ;
	$query = " WHERE 1" ;
	if( isset($filter_orderFilerecordId_list) ) {
		$query = " AND t.filerecord_id IN {$filter_orderFilerecordId_list}" ;
	}
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB_order[$arr['filerecord_id']] = array(
			'order_filerecord_id' => $arr['filerecord_id'],
			'id_soc' => $arr['field_ID_SOC'],
			'id_doc' => $arr['field_ID_DOC'],
			'ref_po' => $arr['field_REF_PO'],
			'atr_priority' => $arr['field_ATR_PRIORITY'],
			'atr_consignee' => $arr['field_ATR_CONSIGNEE'],
			'txt_location' => $arr['field_TXT_LOCATION'],
			'vol_dims' => $arr['field_VOL_DIMS'],
			'vol_count' => $arr['field_VOL_COUNT'],
			
			'steps' => array(),
			'attachments' => array()
		);
	}
	
	$query = "SELECT * FROM view_file_CDE_ATTACH ca" ;
	$query.= " WHERE 1" ;
	if( isset($filter_orderFilerecordId_list) ) {
		$query = " AND ca.filerecord_parent_id IN {$filter_orderFilerecordId_list}" ;
	}
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB_order[$arr['filerecord_parent_id']]['attachments'][] = array(
			'orderattachment_filerecord_id' => $arr['filerecord_id'],
			'attachment_type' => $arr['field_ATTACHMENT_TYPE']
		);
	}
	
	$query = "SELECT * FROM view_file_CDE_STEP cs" ;
	$query.= " WHERE 1" ;
	if( isset($filter_orderFilerecordId_list) ) {
		$query = " AND cs.filerecord_parent_id IN {$filter_orderFilerecordId_list}" ;
	}
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB_order[$arr['filerecord_parent_id']]['orders'][] = array(
			'orderstep_filerecord_id' => $arr['filerecord_id'],
			'step_code' => $arr['field_STEP_CODE'],
			'status_is_ok' => $arr['field_STATUS_IS_OK'],
			'date_actual' => $arr['field_DATE_ACTUAL']
		);
	}
	
	return array('success'=>true, 'data'=>array_values($TAB_order)) ;
}

function specDbsTracy_order_setHeader( $post_data ) {
	global $_opDB ;
	
	$arr_ins = array() ;
	
	
	return array('success'=>false, 'debug'=>$post_data) ;
}

?>
