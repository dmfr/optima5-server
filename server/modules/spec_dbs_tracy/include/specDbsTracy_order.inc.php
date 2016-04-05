<?php

function specDbsTracy_order_getRecords( $post_data ) {
	global $_opDB ;
	
	// filter ?
	if( isset($post_data['filter_orderFilerecordId_arr']) ) {
		$filter_orderFilerecordId_list = $_opDB->makeSQLlist( json_decode($post_data['filter_orderFilerecordId_arr'],true) ) ;
	}
	if( $post_data['filter_socCode'] ) {
		$filter_socCode = $post_data['filter_socCode'] ;
	}
	
	$TAB_order = array() ;
	
	$query = "SELECT * FROM view_file_CDE c" ;
	$query.= " WHERE 1" ;
	if( isset($filter_orderFilerecordId_list) ) {
		$query.= " AND c.filerecord_id IN {$filter_orderFilerecordId_list}" ;
	}
	if( isset($filter_socCode) ) {
		$query.= " AND c.field_ID_SOC='{$filter_socCode}'" ;
	}
	$query.= " ORDER BY c.filerecord_id DESC" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB_order[$arr['filerecord_id']] = array(
			'order_filerecord_id' => $arr['filerecord_id'],
			'id_soc' => $arr['field_ID_SOC'],
			'id_dn' => $arr['field_ID_DN'],
			'ref_po' => $arr['field_REF_PO'],
			'atr_priority' => $arr['field_ATR_PRIORITY'],
			'atr_consignee' => $arr['field_ATR_CONSIGNEE'],
			'txt_location' => $arr['field_TXT_LOCATION'],
			'vol_dims' => $arr['field_VOL_DIMS'],
			'vol_count' => $arr['field_VOL_COUNT'],
			
			'steps' => array(),
			'attachments' => array(),
			
			'calc_step' => '',
			'calc_link_is_active' => null,
			'calc_link_trspt_filerecord_id' => null
		);
	}
	
	$query = "SELECT c.filerecord_id, tc.filerecord_parent_id, t.field_ID_DOC FROM view_file_CDE c" ;
	$query.= " LEFT OUTER JOIN view_file_TRSPT_CDE tc ON tc.field_FILE_CDE_ID=c.filerecord_id AND tc.field_LINK_IS_CANCEL='0'" ;
	$query.= " LEFT OUTER JOIN view_file_TRSPT t ON t.filerecord_id=tc.filerecord_parent_id" ;
	$query.= " WHERE 1" ;
	if( isset($filter_orderFilerecordId_list) ) {
		$query.= " AND c.filerecord_id IN {$filter_orderFilerecordId_list}" ;
	}
	if( isset($filter_socCode) ) {
		$query.= " AND c.field_ID_SOC='{$filter_socCode}'" ;
	}
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$filerecord_id = $arr[0] ;
		$TAB_order[$filerecord_id]['calc_link_is_active'] = ($arr[1]!=NULL) ;
		$TAB_order[$filerecord_id]['calc_link_trspt_filerecord_id'] = $arr[1] ;
		$TAB_order[$filerecord_id]['calc_link_trspt_txt'] = $arr[2] ;
	}
	
	
	$query = "SELECT * FROM view_file_CDE_ATTACH ca" ;
	$query.= " WHERE 1" ;
	if( isset($filter_orderFilerecordId_list) ) {
		$query.= " AND ca.filerecord_parent_id IN {$filter_orderFilerecordId_list}" ;
	}
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		if( !isset($TAB_order[$arr['filerecord_parent_id']]) ) {
			continue ;
		}
		$TAB_order[$arr['filerecord_parent_id']]['attachments'][] = array(
			'attachment_filerecord_id' => $arr['filerecord_id'],
			'parent_file' => 'order',
			'attachment_date' => substr($arr['field_ATTACHMENT_DATE'],0,10),
			'attachment_txt' => $arr['field_ATTACHMENT_TXT']
		);
	}
	
	$query = "SELECT * FROM view_file_CDE_STEP cs" ;
	$query.= " WHERE 1" ;
	if( isset($filter_orderFilerecordId_list) ) {
		$query.= " AND cs.filerecord_parent_id IN {$filter_orderFilerecordId_list}" ;
	}
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		if( !isset($TAB_order[$arr['filerecord_parent_id']]) ) {
			continue ;
		}
		$TAB_order[$arr['filerecord_parent_id']]['steps'][] = array(
			'orderstep_filerecord_id' => $arr['filerecord_id'],
			'step_code' => $arr['field_STEP_CODE'],
			'status_is_ok' => $arr['field_STATUS_IS_OK'],
			'date_actual' => $arr['field_DATE_ACTUAL']
		);
	}
	
	foreach( $TAB_order as &$row_order ) {
		$max_stepCode = array() ;
		foreach( $row_order['steps'] as $row_order_step ) {
			if( $row_order_step['status_is_ok'] ) {
				$max_stepCode[] = $row_order_step['step_code'] ;
			}
		}
		if( $max_stepCode ) {
			$row_order['calc_step'] = max($max_stepCode) ;
		}
	}
	unset($row_order) ;
	
	return array('success'=>true, 'data'=>array_values($TAB_order)) ;
}

function specDbsTracy_order_setHeader( $post_data ) {
	usleep(100*1000);
	global $_opDB ;
	$file_code = 'CDE' ;
	
	$form_data = json_decode($post_data['data'],true) ;
	
	$arr_ins = array() ;
	if( $post_data['_is_new'] ) {
		$arr_ins['field_ID_SOC'] = $form_data['id_soc'] ;
		$arr_ins['field_ID_DN'] = $form_data['id_dn'] ;
	}
	$arr_ins['field_REF_PO'] = $form_data['ref_po'] ;
	$arr_ins['field_ATR_PRIORITY'] = $form_data['atr_priority'] ;
	$arr_ins['field_ATR_CONSIGNEE'] = $form_data['atr_consignee'] ;
	$arr_ins['field_TXT_LOCATION'] = $form_data['txt_location'] ;
	$arr_ins['field_VOL_DIMS'] = $form_data['vol_dims'] ;
	$arr_ins['field_VOL_COUNT'] = $form_data['vol_count'] ;
	
	if( $post_data['_is_new'] ) {
		$filerecord_id = paracrm_lib_data_insertRecord_file( $file_code, 0, $arr_ins );
	} elseif( $post_data['order_filerecord_id'] ) {
		$filerecord_id = paracrm_lib_data_updateRecord_file( $file_code, $arr_ins, $post_data['order_filerecord_id'] );
	} else {
		return array('success'=>false) ;
	}
	
	if( TRUE ) {
		$file_code = 'CDE_STEP' ;
	
		// TODO : specify order flow
		$orderflow_AIR = NULL ;
		
		$ttmp = specDbsTracy_cfg_getConfig() ;
		$json_cfg = $ttmp['data'] ;
		foreach( $json_cfg['cfg_orderflow'] as $orderflow ) {
			if( $orderflow['flow_code'] == 'AIR' ) {
				$orderflow_AIR = $orderflow ;
				break ;
			}
		}
		if( $orderflow_AIR ) {
			foreach( $orderflow_AIR['steps'] as $orderflow_step ) {
				$arr_ins = array() ;
				$arr_ins['field_STEP_CODE'] = $orderflow_step['step_code'] ;
				paracrm_lib_data_insertRecord_file($file_code,$filerecord_id,$arr_ins,$ignore_ifExists=TRUE) ;
			}
		}
	}
	
	return array('success'=>true, 'id'=>$filerecord_id) ;
}

function specDbsTracy_order_setStep( $post_data ) {
	global $_opDB ;
	$file_code = 'CDE_STEP' ;
	
	$form_data = json_decode($post_data['data'],true) ;
	
	if( $post_data['orderstep_filerecord_id'] != $form_data['orderstep_filerecord_id'] ) {
		return array('success'=>false) ;
	}
	$arr_update = array() ;
	$arr_update['field_STATUS_IS_OK'] = ( $form_data['status_is_ok'] ? 1 : 0 ) ;
	$arr_update['field_DATE_ACTUAL'] = ( $form_data['date_actual'] ? $form_data['date_actual'] : '0000-00-00 00:00:00' ) ;
	paracrm_lib_data_updateRecord_file( $file_code, $arr_update, $post_data['orderstep_filerecord_id'] );
	
	return array('success'=>true, 'debug'=>$form_data) ;
}


function specDbsTracy_order_stepValidate( $post_data ) {
	global $_opDB ;
	$file_code = 'CDE_STEP' ;
	
	$p_orderFilerecordId = $post_data['order_filerecord_id'] ;
	$p_stepCode = $post_data['step_code'] ;
	
	$query = "SELECT filerecord_id FROM view_file_CDE_STEP WHERE filerecord_parent_id='{$p_orderFilerecordId}' AND field_STEP_CODE='{$p_stepCode}'" ;
	$p_orderstepFilerecordId = $_opDB->query_uniqueValue($query) ;
	
	$arr_update = array() ;
	$arr_update['field_STATUS_IS_OK'] = 1 ;
	$arr_update['field_DATE_ACTUAL'] = date('Y-m-d H:i:s') ;
	paracrm_lib_data_updateRecord_file( $file_code, $arr_update, $p_orderstepFilerecordId );
	
	return array('success'=>true, 'debug'=>$form_data) ;
}



?>
