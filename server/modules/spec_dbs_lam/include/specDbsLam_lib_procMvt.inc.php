<?php

function specDbsLam_lib_procMvt_addStock($stock_filerecordId, $qte_mvt=0, $step_code=NULL) {
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
	} else {
		if( $qte_stock <= 0 ) {
			return 0 ;
		}
		$qte_mvt = $qte_stock ;
	}
	
	$row_mvt = array(
		'field_PROD_ID' => $row_stock['field_PROD_ID'],
		'field_QTY_MVT' => $qte_mvt,
		'field_SPEC_BATCH' => $row_stock['field_SPEC_BATCH'],
		'field_SPEC_DLC' => $row_stock['field_SPEC_DLC'],
		'field_SPEC_SN' => $row_stock['field_SPEC_SN']
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
	
	$row_mvt_step = array(
		'field_STEP_CODE' => $step_code,
		'field_FILE_STOCK_ID' => $stock_filerecordId,
		'field_SRC_ADR_ID' => $row_stock['field_ADR_ID'],
		'field_SRC_ADR_DISPLAY' => $row_stock['field_ADR_ID'],
		'field_DATE_START' => date('Y-m-d H:i:s')
	) ;
	paracrm_lib_data_insertRecord_file('MVT_STEP',$mvt_filerecordId,$row_mvt_step) ;
	
	
	$query = "UPDATE view_file_STOCK 
			SET field_QTY_AVAIL = field_QTY_AVAIL - '{$qte_mvt}', field_QTY_OUT = field_QTY_OUT + '{$qte_mvt}'
			WHERE filerecord_id='{$stock_filerecordId}'" ;
	$_opDB->query($query) ;
	
	
	return $mvt_filerecordId ;
}
function specDbsLam_lib_procMvt_delMvt($mvt_filerecordId) {
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
		filerecord_parent_id='{$mvt_filerecordId}'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return FALSE ;
	}
	$row_mvt_step = $_opDB->fetch_assoc($result) ;
	
	$stock_filerecordId = $row_mvt_step['field_FILE_STOCK_ID'] ;

	$query = "SELECT * FROM view_file_STOCK WHERE filerecord_id='{$stock_filerecordId}'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return FALSE ;
	}
	$row_stock = $_opDB->fetch_assoc($result) ;
	
	$query = "UPDATE view_file_STOCK 
			SET field_QTY_AVAIL = field_QTY_AVAIL + '{$qte_mvt}', field_QTY_OUT = field_QTY_OUT - '{$qte_mvt}'
			WHERE filerecord_id='{$stock_filerecordId}'" ;
	$_opDB->query($query) ;
	
	paracrm_lib_data_deleteRecord_file( 'MVT' , $mvt_filerecordId ) ;
	
	return TRUE ;
}


function specDbsLam_lib_procMvt_commit($mvt_filerecordId, $adr_dest, $adr_dest_display, $next_step_code) {
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
		filerecord_parent_id='{$mvt_filerecordId}' AND field_STATUS_IS_OK='0'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return FALSE ;
	}
	$row_mvt_step = $_opDB->fetch_assoc($result) ;
	
	$stock_filerecordId = $row_mvt_step['field_FILE_STOCK_ID'] ;
	
	$query = "SELECT * FROM view_file_STOCK WHERE filerecord_id='{$stock_filerecordId}'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return FALSE ;
	}
	$row_stock = $_opDB->fetch_assoc($result) ;
	$row_stock['field_ADR_ID'] = $adr_dest ;
	$row_stock['field_QTY_AVAIL'] = $row_stock['field_QTY_OUT'] ;
	$row_stock['field_QTY_OUT'] = 0 ;
	paracrm_lib_data_deleteRecord_file( 'STOCK' , $stock_filerecordId ) ;
	$stock_filerecordId = paracrm_lib_data_insertRecord_file('STOCK',0,$row_stock) ;
	
	
	// creation lig STOCK
	
	
	
	// flag MVT
	$arr_update = array() ;
	$arr_update['field_DEST_ADR_ID'] =  $adr_dest ;
	$arr_update['field_DEST_ADR_DISPLAY'] = $adr_dest_display ;
	$arr_update['field_STATUS_IS_OK'] = 1 ;
	$arr_update['field_COMMIT_DATE'] = date('Y-m-d H:i:s') ;
	$arr_update['field_COMMIT_USER'] = strtoupper($_SESSION['login_data']['delegate_userId']) ;
	$arr_update['field_COMMIT_FILE_STOCK_ID'] = $stock_filerecordId ;
	$arr_cond = array() ;
	$arr_cond['filerecord_id'] = $row_mvt_step['filerecord_id'] ;
	$_opDB->update('view_file_MVT_STEP',$arr_update, $arr_cond) ;
	
	
	// if step=not_final => specDbsLam_lib_procMvt_addStock (chain reaction...)
	if( $next_step_code ) {
		$row_mvt_step = array(
			'field_STEP_CODE' => $next_step_code,
			'field_FILE_STOCK_ID' => $stock_filerecordId,
			'field_SRC_ADR_ID' => $row_stock['field_ADR_ID'],
			'field_SRC_ADR_DISPLAY' => $adr_dest_display,
			'field_DATE_START' => date('Y-m-d H:i:s')
		) ;
		paracrm_lib_data_insertRecord_file('MVT_STEP',$mvt_filerecordId,$row_mvt_step) ;
		
		
		$query = "UPDATE view_file_STOCK 
				SET field_QTY_AVAIL = field_QTY_AVAIL - '{$qte_mvt}', field_QTY_OUT = field_QTY_OUT + '{$qte_mvt}'
				WHERE filerecord_id='{$stock_filerecordId}'" ;
		$_opDB->query($query) ;
	}
	
	
	return TRUE ;
}



?>