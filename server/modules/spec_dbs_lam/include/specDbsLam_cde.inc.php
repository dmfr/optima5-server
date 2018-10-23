<?php

function specDbsLam_cde_getGrid($post_data) {
	global $_opDB ;
	
	// Load cfg attributes
	$ttmp = specDbsLam_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	
	$map_status_txt = array() ;
	$query = "SELECT field_STATUS, field_STATUS_TXT FROM view_bible_STATUS_CDE_entry" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$map_status_txt[$arr[0]] = $arr[1] ;
	}
	
	$TAB = array() ;
	
	$query = "SELECT c.*, t.filerecord_id as link_transfer_filerecord_id, t.field_TRANSFER_TXT as link_transfer_txt FROM view_file_CDE c" ;
	$query.= " LEFT OUTER JOIN view_file_TRANSFER t on t.filerecord_id=c.field_FILE_TRANSFER_ID" ;
	$query.= " WHERE 1" ;
	if( $post_data['filter_cdeFilerecordId_arr'] ) {
		$query.= " AND c.filerecord_id IN ".$_opDB->makeSQLlist(json_decode($post_data['filter_cdeFilerecordId_arr'],true)) ;
	}
	$query.= " ORDER BY c.filerecord_id DESC" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$cde_filerecord_id = $arr['filerecord_id'] ;
		$row = array(
			'cde_filerecord_id' => $cde_filerecord_id,
			'cde_nr' => $arr['field_CDE_NR'],
			'cde_bl' => $arr['field_CDE_BL'],
			'cde_ref' => $arr['field_CDE_REF'],
			'status' => $arr['field_STATUS'],
			'status_txt' => $map_status_txt[$arr['field_STATUS']],
			'date_cde' => substr($arr['field_DATE_CDE'],0,10),
			'date_due' => substr($arr['field_DATE_DUE'],0,10),
			'date_closed' => substr($arr['field_DATE_CLOSED'],0,10),
			'vl_nbum' => (int)$arr['field_VL_NBUM'],
			'vl_kg' => (int)$arr['field_VL_KG'],
			'vl_m3' => (int)$arr['field_VL_M3'],
			'adr_name' => $arr['field_ADR_NAME'],
			'adr_cp' => $arr['field_ADR_CP'],
			'adr_country' => $arr['field_ADR_COUNTRY'],
			'adr_full' => $arr['field_ADR_FULL'],
			'trspt_code' => $arr['field_TRSPT_CODE'],
			'link_transfer_filerecord_id' => $arr['link_transfer_filerecord_id'],
			'link_transfer_txt' => $arr['link_transfer_txt']
		);
		foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
			if( !$stockAttribute_obj['CDE_fieldcode'] ) {
				continue ;
			}
			$db_field = 'field_'.$stockAttribute_obj['mkey'] ;
			$model_field = 'CDE_'.$stockAttribute_obj['mkey'] ;
			$row[$model_field] = $arr[$db_field] ;
		}
		$row['ligs'] = array() ;
		
		$TAB[$cde_filerecord_id] = $row ;
	}
	
	$query = "SELECT cl.*, p.field_PROD_TXT FROM view_file_CDE_LIG cl" ;
	$query.= " LEFT OUTER JOIN view_bible_PROD_entry p ON p.entry_key=cl.field_PROD_ID" ;
	$query.= " WHERE 1" ;
	if( $post_data['filter_cdeFilerecordId_arr'] ) {
		$query.= " AND cl.filerecord_parent_id IN ".$_opDB->makeSQLlist(json_decode($post_data['filter_cdeFilerecordId_arr'],true)) ;
	}
	$query.= " ORDER BY cl.filerecord_id DESC" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$cde_filerecord_id = $arr['filerecord_parent_id'] ;
		$cdelig_filerecord_id = $arr['filerecord_id'] ;
		
		$row = array(
			'cdelig_filerecord_id' => $cdelig_filerecord_id,
			'lig_id' => $arr['field_LIG_ID'],
			'stk_prod' => $arr['field_PROD_ID'],
			'stk_prod_txt' => $arr['field_PROD_TXT'],
			'qty_comm' => (float)$arr['field_QTY_COMM'],
			'qty_cde' => (float)$arr['field_QTY_CDE']
		) ;
		$TAB[$cde_filerecord_id]['ligs'][] = $row ;
	}
	
	return array('success'=>true, 'data'=>array_values($TAB)) ;
}


?>
