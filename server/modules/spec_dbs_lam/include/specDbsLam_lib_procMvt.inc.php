<?php

function specDbsLam_lib_procMvt_createNewStk($stkData_obj) {
	global $_opDB ;
	
	// Load cfg attributes
	$ttmp = specDbsLam_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	
	
	if( !paracrm_lib_data_getRecord_bibleEntry( 'PROD', $stkData_obj['stk_prod'] ) ) {
		return FALSE ;
	}
	
	if( !paracrm_lib_data_getRecord_bibleEntry( 'ADR', 'TMP_RECEP' ) ) {
		paracrm_lib_data_insertRecord_bibleEntry('ADR','TMP_RECEP','TMP',array('field_ADR_ID'=>'TMP_RECEP')) ;
	}
	$arr_ins = array() ;
	$arr_ins['field_ADR_ID'] = 'TMP_RECEP' ;
	$arr_ins['field_SOC_CODE'] = $stkData_obj['soc_code'] ;
	if( !$stkData_obj['container_is_off'] ) {
		$arr_ins['field_CONTAINER_TYPE'] = $stkData_obj['container_type'] ;
		if( !$stkData_obj['container_ref'] ) {
			$stkData_obj['container_ref'] = specDbsLam_spec_get_CONTAINER_REF($stkData_obj['soc_code']) ;
		}
		$arr_ins['field_CONTAINER_REF'] = $stkData_obj['container_ref'] ;
	}
	$arr_ins['field_PROD_ID'] = $stkData_obj['stk_prod'] ;
	$arr_ins['field_SPEC_BATCH'] = $stkData_obj['stk_batch'] ;
	$arr_ins['field_SPEC_DATELC'] = $stkData_obj['stk_datelc'] ;
	$arr_ins['field_SPEC_SN'] = $stkData_obj['stk_sn'] ;
	$arr_ins['field_QTY_AVAIL'] = $stkData_obj['mvt_qty'] ;
	foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
		if( !$stockAttribute_obj['STOCK_fieldcode'] ) {
			continue ;
		}
		$arr_ins[$stockAttribute_obj['STOCK_fieldcode']] = $stkData_obj[$stockAttribute_obj['mkey']] ;
	}
	$arr_ins['field_LAM_DATEUPDATE'] = date('Y-m-d H:i:s') ;
	$stk_filerecord_id = paracrm_lib_data_insertRecord_file('STOCK',0,$arr_ins) ;
	return $stk_filerecord_id ;
}

function specDbsLam_lib_procMvt_addStock($src_whse, $dst_whse, $stock_filerecordId, $qte_mvt=NULL) {
	global $_opDB ;
	
	// Load cfg attributes
	$ttmp = specDbsLam_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	
	// TODO: LOCK !
	
	// controle cohérence QTY_AVAIL > 0
	// creation lig Mvt
	// bascule Stock
	$query = "SELECT * FROM view_file_STOCK WHERE
		filerecord_id='{$stock_filerecordId}'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return 0 ;
	}
	$row_stock = $_opDB->fetch_assoc($result) ;
	$qte_stock = (float)$row_stock['field_QTY_AVAIL'] ;
	if( $qte_mvt > 0 ) {
		if( $qte_mvt > $qte_stock ) {
			return 0 ;
		}
		$qte_mvt_actual = $qte_mvt ;
	} else {
		if( $qte_stock <= 0 ) {
			return 0 ;
		}
		$qte_mvt_actual = $qte_stock ;
	}
	
	$row_mvt = array(
		'field_SOC_CODE' => $row_stock['field_SOC_CODE'],
		'field_CONTAINER_TYPE' => ($qte_mvt ? NULL : $row_stock['field_CONTAINER_TYPE']),
		'field_CONTAINER_REF' => ($qte_mvt ? NULL : $row_stock['field_CONTAINER_REF']),
		'field_PROD_ID' => $row_stock['field_PROD_ID'],
		'field_QTY_MVT' => $qte_mvt_actual,
		'field_SPEC_BATCH' => $row_stock['field_SPEC_BATCH'],
		'field_SPEC_DATELC' => $row_stock['field_SPEC_DATELC'],
		'field_SPEC_SN' => $row_stock['field_SPEC_SN'],
		'field_SRC_FILE_STOCK_ID' => $stock_filerecordId,
		'field_SRC_WHSE' => $src_whse,
		'field_SRC_ADR_ID' => $row_stock['field_ADR_ID']
	);
	foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
		if( !$stockAttribute_obj['STOCK_fieldcode'] ) {
			continue ;
		}
		$mkey = $stockAttribute_obj['mkey'] ;
		$STOCK_fieldcode = $stockAttribute_obj['STOCK_fieldcode'] ;
		
		$row_mvt[$STOCK_fieldcode] = $row_stock[$STOCK_fieldcode] ;
	}
	$mvt_filerecordId = paracrm_lib_data_insertRecord_file('MVT',0,$row_mvt) ;
	
	/*
	$row_mvt_step = array(
		'field_STEP_CODE' => $step_code,
		'field_FILE_STOCK_ID' => $stock_filerecordId,
		'field_SRC_ADR_ID' => $row_stock['field_ADR_ID'],
		'field_SRC_ADR_DISPLAY' => $row_stock['field_ADR_ID'],
		'field_DATE_START' => date('Y-m-d H:i:s')
	) ;
	paracrm_lib_data_insertRecord_file('MVT_STEP',$mvt_filerecordId,$row_mvt_step) ;
	*/
	
	$query = "UPDATE view_file_STOCK 
			SET field_QTY_AVAIL = field_QTY_AVAIL - '{$qte_mvt_actual}', field_QTY_OUT = field_QTY_OUT + '{$qte_mvt_actual}'
			WHERE filerecord_id='{$stock_filerecordId}'" ;
	$_opDB->query($query) ;
	
	$row_stockDst = array(
		'field_WHSE' => $dst_whse,
		'field_ADR_ID' => '',
		'field_SOC_CODE' => $row_stock['field_SOC_CODE'],
		'field_CONTAINER_TYPE' => ($qte_mvt ? NULL : $row_stock['field_CONTAINER_TYPE']),
		'field_CONTAINER_REF' => ($qte_mvt ? NULL : $row_stock['field_CONTAINER_REF']),
		'field_PROD_ID' => $row_stock['field_PROD_ID'],
		'field_QTY_PREIN' => $qte_mvt_actual,
		'field_SPEC_BATCH' => $row_stock['field_SPEC_BATCH'],
		'field_SPEC_DATELC' => $row_stock['field_SPEC_DATELC'],
		'field_SPEC_SN' => $row_stock['field_SPEC_SN'],
		'field_LAM_DATEUPDATE' => $row_stock['field_LAM_DATEUPDATE']
	) ;
	foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
		if( !$stockAttribute_obj['STOCK_fieldcode'] ) {
			continue ;
		}
		$mkey = $stockAttribute_obj['mkey'] ;
		$STOCK_fieldcode = $stockAttribute_obj['STOCK_fieldcode'] ;
		
		$row_stockDst[$STOCK_fieldcode] = $row_stock[$STOCK_fieldcode] ;
	}
	$dstStock_filerecordId = paracrm_lib_data_insertRecord_file('STOCK',0,$row_stockDst) ;
	
	
	$row_mvt = array(
		'field_DST_FILE_STOCK_ID' => $dstStock_filerecordId,
		'field_DST_WHSE' => $dst_whse,
		'field_DST_ADR_ID' => ''
	);
	paracrm_lib_data_updateRecord_file('MVT',$row_mvt,$mvt_filerecordId) ;
	
	return $mvt_filerecordId ;
}
function specDbsLam_lib_procMvt_delMvt($mvt_filerecordId) {
	global $_opDB ;
	
	$query = "SELECT * FROM view_file_MVT WHERE
		filerecord_id='{$mvt_filerecordId}' AND field_COMMIT_IS_OK='0'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return FALSE ;
	}
	$row_mvt = $_opDB->fetch_assoc($result) ;
	$qte_mvt = (float)$row_mvt['field_QTY_MVT'] ;
	$stockSrc_filerecordId = $row_mvt['field_SRC_FILE_STOCK_ID'] ;
	$stockDst_filerecordId = $row_mvt['field_DST_FILE_STOCK_ID'] ;

	$query = "SELECT * FROM view_file_STOCK WHERE filerecord_id='{$stockSrc_filerecordId}'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return FALSE ;
	}
	$query = "SELECT * FROM view_file_STOCK WHERE filerecord_id='{$stockDst_filerecordId}'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return FALSE ;
	}
	
	$query = "UPDATE view_file_STOCK 
			SET field_QTY_AVAIL = field_QTY_AVAIL + '{$qte_mvt}', field_QTY_OUT = field_QTY_OUT - '{$qte_mvt}'
			WHERE filerecord_id='{$stockSrc_filerecordId}'" ;
	$_opDB->query($query) ;
	
	$query = "UPDATE view_file_STOCK 
			SET field_QTY_PREIN = field_QTY_PREIN - '{$qte_mvt}'
			WHERE filerecord_id='{$stockDst_filerecordId}'" ;
	$_opDB->query($query) ;
	$query = "DELETE FROM view_file_STOCK
			WHERE filerecord_id='{$stockDst_filerecordId}'
			AND field_QTY_PREIN='0' AND field_QTY_OUT='0' AND field_QTY_AVAIL='0'" ;
	$_opDB->query($query) ;
	
	paracrm_lib_data_deleteRecord_file( 'MVT' , $mvt_filerecordId ) ;
	
	return TRUE ;
}
function specDbsLam_lib_procMvt_delMvtUnalloc($mvt_filerecordId) {
	global $_opDB ;
	
	$query = "SELECT * FROM view_file_MVT WHERE
		filerecord_id='{$mvt_filerecordId}'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return FALSE ;
	}
	$row_mvt = $_opDB->fetch_assoc($result) ;
	$qte_mvt = (float)$row_mvt['field_QTY_MVT'] ;
	
	$query = "SELECT * FROM view_file_MVT_STEP WHERE
		filerecord_parent_id='{$mvt_filerecordId}' ORDER BY filerecord_id DESC LIMIT 1" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return FALSE ;
	}
	$row_mvt_step = $_opDB->fetch_assoc($result) ;
	
	if( $row_mvt_step['field_DEST_ADR_ID'] && !$row_mvt_step['field_STATUS_IS_OK'] ) {
		// reserv ADR
		$arr_update = array() ;
		$arr_update['field_DEST_ADR_ID'] = '' ;
		$arr_update['field_DEST_ADR_DISPLAY'] = '' ;
		$arr_cond = array() ;
		$arr_cond['filerecord_id'] = $row_mvt_step['filerecord_id'] ;
		$_opDB->update('view_file_MVT_STEP',$arr_update, $arr_cond) ;
		
		$query = "UPDATE view_bible_ADR_entry SET field_STATUS_IS_PREALLOC='0' WHERE entry_key='{$row_mvt_step['field_DEST_ADR_ID']}'
			AND entry_key NOT IN (select field_DEST_ADR_ID FROM view_file_MVT_STEP WHERE field_STATUS_IS_OK='0' AND field_DEST_ADR_ID<>'')" ;
		$_opDB->query($query) ;
		
		return TRUE ;
	}
	
	return FALSE ;
}


function specDbsLam_lib_procMvt_setDstAdr($mvt_filerecordId, $adr_dest) {
	global $_opDB ;
	
	// verifs mvt non commit
	$query = "SELECT * FROM view_file_MVT
		WHERE filerecord_id='{$mvt_filerecordId}' AND field_COMMIT_IS_OK='0'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return FALSE ;
	}
	$row_mvt = $_opDB->fetch_assoc($result) ;
	$stockSrc_filerecordId = $row_mvt['field_SRC_FILE_STOCK_ID'] ;
	$stockDst_filerecordId = $row_mvt['field_DST_FILE_STOCK_ID'] ;
	
	$query = "SELECT * FROM view_file_STOCK WHERE filerecord_id='{$stockDst_filerecordId}' AND field_QTY_AVAIL+field_QTY_OUT='0'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return FALSE ;
	}
	
	// Go ?
	$arr_update = array() ;
	$arr_update['field_DST_ADR_ID'] = $adr_dest ;
	//$_opDB->update('view_file_MVT',$arr_update, array('filerecord_id'=>$mvt_filerecordId)) ;
	
	
	$arr_update = array() ;
	$arr_update['field_ADR_ID'] = $adr_dest ;
	$_opDB->update('view_file_STOCK',$arr_update, array('filerecord_id'=>$stockDst_filerecordId)) ;
	
	
	$query = "UPDATE view_file_MVT SET field_DST_ADR_ID='{$adr_dest}' WHERE field_DST_FILE_STOCK_ID='{$stockDst_filerecordId}' AND field_COMMIT_IS_OK<>'1'" ;
	$_opDB->query($query) ;
	// sync dest adr to next mvts ?
	$query = "UPDATE view_file_MVT SET field_SRC_ADR_ID='{$adr_dest}' WHERE field_SRC_FILE_STOCK_ID='{$stockDst_filerecordId}' AND field_COMMIT_IS_OK<>'1'" ;
	$_opDB->query($query) ;
	
	return TRUE ;
}
function specDbsLam_lib_procMvt_commit($mvt_filerecordId) {
	global $_opDB ;
	
	// verifs mvt non commit
	$query = "SELECT * FROM view_file_MVT
		WHERE filerecord_id='{$mvt_filerecordId}' AND field_COMMIT_IS_OK='0'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return FALSE ;
	}
	$row_mvt = $_opDB->fetch_assoc($result) ;
	$qte_mvt = (float)$row_mvt['field_QTY_MVT'] ;
	$stockSrc_filerecordId = $row_mvt['field_SRC_FILE_STOCK_ID'] ;
	$stockDst_filerecordId = $row_mvt['field_DST_FILE_STOCK_ID'] ;
	
	$query = "SELECT filerecord_id FROM view_file_STOCK
		WHERE filerecord_id IN ('{$stockSrc_filerecordId}','{$stockDst_filerecordId}')" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 2 ) {
		return FALSE ;
	}
	
	$query = "UPDATE view_file_MVT mvt
					JOIN view_file_STOCK src ON src.filerecord_id=mvt.field_SRC_FILE_STOCK_ID
					JOIN view_file_STOCK dst ON dst.filerecord_id=mvt.field_DST_FILE_STOCK_ID
				SET src.field_QTY_OUT=src.field_QTY_OUT-mvt.field_QTY_MVT
				, dst.field_QTY_AVAIL=dst.field_QTY_AVAIL+mvt.field_QTY_MVT
				, dst.field_QTY_PREIN=dst.field_QTY_PREIN-mvt.field_QTY_MVT
				WHERE mvt.filerecord_id='{$mvt_filerecordId}'" ;
	$_opDB->query($query) ;
	
	$arr_update = array() ;
	$arr_update['field_COMMIT_IS_OK'] = 1 ;
	$arr_update['field_COMMIT_DATE'] = date('Y-m-d H:i:s') ;
	paracrm_lib_data_updateRecord_file('MVT',$arr_update,$mvt_filerecordId) ;
	
	
	$query = "SELECT filerecord_id FROM view_file_STOCK
			WHERE filerecord_id='{$stockSrc_filerecordId}'
			AND field_QTY_PREIN='0' AND field_QTY_OUT='0' AND field_QTY_AVAIL='0'" ;
	if( $_opDB->query_uniqueValue($query)==$stockSrc_filerecordId ) {
		paracrm_lib_data_deleteRecord_file( 'STOCK' , $stockSrc_filerecordId ) ;
	}
	
	return TRUE ;
}
function specDbsLam_lib_procMvt_commitUndo($mvt_filerecordId) {
	global $_opDB ;
	
	// verifs mvt non commit
	$query = "SELECT * FROM view_file_MVT
		WHERE filerecord_id='{$mvt_filerecordId}' AND field_COMMIT_IS_OK='1'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return FALSE ;
	}
	$row_mvt = $_opDB->fetch_assoc($result) ;
	$qte_mvt = (float)$row_mvt['field_QTY_MVT'] ;
	$stockSrc_filerecordId = $row_mvt['field_SRC_FILE_STOCK_ID'] ;
	$stockDst_filerecordId = $row_mvt['field_DST_FILE_STOCK_ID'] ;
	
	
	// mvt container ou qté ?
	// if qté => check dest has QTY_AVAIL >= QTY_MVT
	// if container => check dest has QTY_AVAIL = QTY_MVT && QTY_PREIN=QTY_OUT=0
	// 
	$query = "SELECT * FROM view_file_STOCK WHERE filerecord_id='{$stockDst_filerecordId}'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return FALSE ;
	}
	$row_stkDst = $_opDB->fetch_assoc($result) ;
	
	$mvt_isContainer = ($row_mvt['field_CONTAINER_TYPE']&&$row_mvt['field_CONTAINER_REF']) ;
	$test_stkAvailableRollback = FALSE ;
	if( $mvt_isContainer ) {
		$pass = TRUE ;
		if( $row_mvt['field_QTY_MVT'] != $row_stkDst['field_QTY_AVAIL'] ) {
			$pass = FALSE ;
		}
		if( !(($row_stkDst['field_QTY_PREIN']+$row_stkDst['field_QTY_OUT'])==0) ) {
			$pass = FALSE ;
		}
		$test_stkAvailableRollback = $pass ;
	}
	if( !$mvt_isContainer ) {
		$test_stkAvailableRollback = ( $row_stkDst['field_QTY_AVAIL'] >= $row_mvt['field_QTY_MVT'] ) ; 
	}
	
	if( !$test_stkAvailableRollback ) {
		return FALSE ;
	}
	
	
	// restauration du stock orig ?
	if( paracrm_lib_data_recoverRecord_file('STOCK',$stockSrc_filerecordId) != 0 ) {
		return FALSE ;
	}
	
	
	$query = "SELECT filerecord_id FROM view_file_STOCK
		WHERE filerecord_id IN ('{$stockSrc_filerecordId}','{$stockDst_filerecordId}')" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 2 ) {
		return FALSE ;
	}
	
	$query = "UPDATE view_file_MVT mvt
					JOIN view_file_STOCK src ON src.filerecord_id=mvt.field_SRC_FILE_STOCK_ID
					JOIN view_file_STOCK dst ON dst.filerecord_id=mvt.field_DST_FILE_STOCK_ID
				SET src.field_QTY_OUT=src.field_QTY_OUT+mvt.field_QTY_MVT
				, dst.field_QTY_AVAIL=dst.field_QTY_AVAIL-mvt.field_QTY_MVT
				, dst.field_QTY_PREIN=dst.field_QTY_PREIN+mvt.field_QTY_MVT
				WHERE mvt.filerecord_id='{$mvt_filerecordId}'" ;
	$_opDB->query($query) ;
	
	$arr_update = array() ;
	$arr_update['field_COMMIT_IS_OK'] = 0 ;
	$arr_update['field_COMMIT_DATE'] = date('Y-m-d H:i:s') ;
	paracrm_lib_data_updateRecord_file('MVT',$arr_update,$mvt_filerecordId) ;
	
	
	return TRUE ;
}


?>
