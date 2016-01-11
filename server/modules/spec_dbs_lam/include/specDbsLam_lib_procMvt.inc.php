<?php

function specDbsLam_lib_procMvt_addStock($stock_filerecordId, $qte_mvt=0) {
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
		'field_STEP_CODE' => 'T01_INIT',
		'field_FILE_STOCK_ID' => $stock_filerecordId,
		'field_ADR_ID' => $row_stock['field_ADR_ID'],
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
	
	return ;
}


function specDbsLam_lib_procMvt_commit($mvt_filerecordId) {
	// creation lig STOCK
	
	
	// flag MVT
	
	
	// if step=not_final => specDbsLam_lib_procMvt_addStock (chain reaction...)
	
	
	
	return ;
}



?>