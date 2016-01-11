<?php

function specDbsLam_transfer_getTransfer() {
	global $_opDB ;
	
	$TAB = array() ;
	
	$query = "SELECT * FROM view_file_TRANSFER ORDER BY filerecord_id DESC" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB[] = array(
			'transfer_filerecord_id' => $arr['filerecord_id'],
			'transfer_txt' => $arr['field_TRANSFER_TXT'],
			'status_code' => $arr['field_STATUS']
		);
	}
	
	return array('success'=>true, 'data'=>$TAB) ;
}
function specDbsLam_transfer_getTransferLig($post_data) {
	// jointure : voir specDbsPeople_Real_lib_getActivePeople
	
	global $_opDB ;
	
	// Load cfg attributes
	$ttmp = specDbsLam_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	
	
	$query = "SELECT tl.filerecord_id as transferlig_filerecord_id, tl.filerecord_parent_id as transfer_filerecord_id , mvt.* 
				FROM view_file_TRANSFER_LIG tl
				INNER JOIN view_file_MVT mvt ON mvt.filerecord_id = tl.field_FILE_MVT_ID" ;
	if( $post_data['filter_transferFilerecordId'] ) {
		$query.= " WHERE tl.filerecord_parent_id='{$post_data['filter_transferFilerecordId']}'" ;
	}
	$query.= " ORDER BY mvt.filerecord_id DESC" ;
	$result = $_opDB->query($query) ;
	
	$TAB = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$row = array(
			'transfer_filerecord_id' => $arr['transfer_filerecord_id'],
			'transferlig_filerecord_id' => $arr['transferlig_filerecord_id'],
			'stk_prod' => $arr['field_PROD_ID'],
			'stk_batch' => $arr['field_SPEC_BATCH'],
			'stk_sn' => $arr['field_SPEC_SN'],
			'mvt_qty' => $arr['field_QTY_MVT']
		);
		foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
			if( !$stockAttribute_obj['STOCK_fieldcode'] ) {
				continue ;
			}
			$mkey = $stockAttribute_obj['mkey'] ;
			$STOCK_fieldcode = $stockAttribute_obj['STOCK_fieldcode'] ;
			$row[$mkey] = $arr[$STOCK_fieldcode] ;
		}
		
		$TAB[] = $row ;
	}
	return array('success'=>true, 'data'=>$TAB) ;
}







function specDbsLam_transfer_addStock( $post_data ) {
	global $_opDB ;
	
	$transfer_filerecordId = $post_data['transfer_filerecordId'] ;
	$stock_filerecordIds = json_decode($post_data['stock_filerecordIds'],true) ;
	
	//controle $transfer_filerecordId ?
	
	
	foreach( $stock_filerecordIds as $stock_filerecordId ) {
		$mvt_filerecordId = specDbsLam_lib_procMvt_addStock( $stock_filerecordId ) ;
		if( !$mvt_filerecordId ){
			continue ;
		}
		$query = "SELECT * FROM view_file_MVT WHERE filerecord_id='{$mvt_filerecordId}'" ;
		$result = $_opDB->query($query) ;
		$row_mvt = $_opDB->fetch_assoc($result) ;
		
		$transfer_row = array(
			'field_STATUS' => 'T01_INIT',
			'field_FILE_MVT_ID' => $mvt_filerecordId
		);
		paracrm_lib_data_insertRecord_file('TRANSFER_LIG',$transfer_filerecordId,$transfer_row) ;
	}
	
	
	return array('success'=>true) ;
}
function specDbsLam_transfer_removeStock( $post_data ) {
	global $_opDB ;
	
	$transferLig_filerecordIds = json_decode($post_data['transferLig_filerecordIds'],true) ;
	
	//controle $transfer_filerecordId ?
	
	
	foreach( $transferLig_filerecordIds as $transferLig_filerecordId ) {
		// mvt ID ?
		
	}
	
	
	return array('success'=>true) ;
}



?>