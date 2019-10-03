<?php

function specDbsLam_cde_getGrid($post_data) {
	global $_opDB ;
	
	$closed_dateTouch = date('Y-m-d',strtotime('-3 days')) ;
	
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
			'soc_code' => $arr['field_SOC_CODE'],
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
		if( $row['date_closed']!='0000-00-00' && ($closed_dateTouch>$row['date_closed']) ) {
			$row['status_is_closed'] = TRUE ;
		}
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
	
	if( !$post_data['load_extended'] ) {
		return array('success'=>true, 'data'=>array_values($TAB)) ;
	}
	
	foreach( $TAB as $cde_filerecord_id => &$row_cde ) {
		foreach( $row_cde['ligs'] as &$row_cdelig ) {
			$row_cdelig['qty_ship'] = 0 ;
			$row_cdelig['cdepack_ligs'] = array() ;
			// tr_cde_need => packing ? packing ?
			
			$query = "SELECT tl.filerecord_id as transferlig_filerecord_id
								, m.filerecord_id as mvt_filerecord_id
								, m.field_PROD_ID as stk_prod
								, m.field_QTY_MVT as mvt_qty
								, tcp.filerecord_id as transfercdepack_filerecord_id
								, tcp.field_ID_SSCC as pack_id_sscc
								, tcp.field_ID_TRSPT_CODE as pack_id_trspt_code
								, tcp.field_ID_TRSPT_ID as pack_id_trspt_id
					FROM view_file_CDE_LIG cl
					INNER JOIN view_file_TRANSFER_CDE_LINK tcl ON tcl.field_FILE_CDELIG_ID=cl.filerecord_id
					INNER JOIN view_file_TRANSFER_LIG tl ON tl.field_PACK_TRSFRCDELINK_ID=tcl.filerecord_id AND tl.field_STATUS_IS_OUT='1'
						INNER JOIN view_file_MVT m ON m.filerecord_id=tl.field_FILE_MVT_ID
					INNER JOIN view_file_TRANSFER_CDE_PACK tcp ON tcp.filerecord_id=tl.field_PACK_TRSFRCDEPACK_ID
					WHERE cl.filerecord_id='{$row_cdelig['cdelig_filerecord_id']}'" ;
			//echo $query ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
				$row_cdelig['qty_ship'] += $arr['mvt_qty'] ;
				
				// cast
				$arr['mvt_qty'] = (float)$arr['mvt_qty'] ;
				$row_cdelig['cdepack_ligs'][] = $arr ;
			}
		}
		unset($row_cdelig) ;
	}
	unset($row_cde) ;
	
	return array('success'=>true, 'data'=>array_values($TAB)) ;
}


function specDbsLam_cde_oscarioCancel( $post_data ) {
	global $_opDB ;
	
	$arr_noscde = explode(',',$post_data['str_noscde']) ;
	$sql_arrNoscde = $_opDB->makeSQLlist($arr_noscde) ;
	
	$query = "SELECT filerecord_id FROM view_file_CDE WHERE field_CDE_NR IN {$sql_arrNoscde} AND field_STATUS<='10'" ;
	$result = $_opDB->query($query) ;
	$cnt = $_opDB->num_rows($result) ;
	if( $cnt!=count($arr_noscde) ) {
		return array('success'=>false) ;
	}
	
	$arr_cdeFilerecordIds = array() ;
	while( ($arr=$_opDB->fetch_row($result)) != FALSE ) {
		$arr_cdeFilerecordIds[] = $arr[0] ;
	}
	foreach( $arr_cdeFilerecordIds as $cde_filerecord_id ) {
		$query = "DELETE FROM view_file_CDE WHERE filerecord_id='{$cde_filerecord_id}'" ;
		$_opDB->query($query) ;
	}
	return array('success'=>true) ;
}

?>
