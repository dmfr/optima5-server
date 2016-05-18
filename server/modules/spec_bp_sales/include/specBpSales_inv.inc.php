<?php

function specBpSales_inv_getRecords( $post_data ) {
	global $_opDB ;
	
	$TAB = array() ;
	
	$forward_post = array() ;
	$forward_post['start'] ;
	$forward_post['limit'] ;
	$forward_post['file_code'] = 'INV' ;
	$ttmp = paracrm_data_getFileGrid_data( $forward_post, $auth_bypass=TRUE ) ;
	$paracrm_TAB = $ttmp['data'] ;
	foreach( $paracrm_TAB as $paracrm_row ) {
		$row = array() ;
		$row['inv_filerecord_id'] = $paracrm_row['INV_id'] ;
		$row['id_inv'] = $paracrm_row['INV_field_ID_INV'] ;
		$row['id_cde_ref'] = $paracrm_row['INV_field_ID_CDE_REF'] ;
		$row['cli_link'] = $paracrm_row['INV_field_CLI_LINK'] ;
		$row['cli_link_txt'] = $paracrm_row['INV_field_CLI_LINK_entry_CLI_NAME'] ;
		$row['adr_sendto'] = $paracrm_row['INV_field_ADR_SENDTO'] ;
		$row['adr_invoice'] = $paracrm_row['INV_field_ADR_INVOICE'] ;
		$row['adr_ship'] = $paracrm_row['INV_field_ADR_SHIP'] ;
		$row['date_create'] = substr($paracrm_row['INV_field_DATE_CREATE'],0,10) ;
		$row['date_invoice'] = substr($paracrm_row['INV_field_DATE_INVOICE'],0,10) ;
		$row['calc_amount_novat'] = $paracrm_row['INV_field_CALC_AMOUNT_NOVAT'] ;
		$row['calc_amount_final'] = $paracrm_row['INV_field_CALC_AMOUNT_FINAL'] ;
		
		$row['ligs'] = array() ;
		
		$TAB[$paracrm_row['filerecord_id']] = $row ;
	}
	$debug = $paracrm_TAB ;
	
	
	
	$forward_post = array() ;
	$forward_post['start'] ;
	$forward_post['limit'] ;
	$forward_post['file_code'] = 'INV_LIG' ;
		$sorter = array() ;
		$sorter['property'] = 'INV_LIG_id' ;
		$sorter['direction'] = 'DESC' ;
	$forward_post['sort'] = json_encode(array($sorter)) ;
	$ttmp = paracrm_data_getFileGrid_data( $forward_post, $auth_bypass=TRUE ) ;
	$paracrm_TAB = $ttmp['data'] ;
	foreach( $paracrm_TAB as $paracrm_row ) {
		$filerecord_parent_id = $paracrm_row['INV_id'] ;
		
		$row = array() ;
		$row['invlig_filerecord_id'] = $paracrm_row['INV_LIG_id'] ;
		$row['id_inv_lig'] = $paracrm_row['INV_LIG_field_ID_INV_LIG'] ;
		$row['link_cdelig_filerecord_id'] = $paracrm_row['INV_LIG_field_LINK_CDELIG_FILE_ID'] ;
		$row['mode_inv'] = $paracrm_row['INV_LIG_field_MODE_INV'] ;
		$row['base_prod'] = $paracrm_row['INV_LIG_field_BASE_PROD'] ;
		$row['base_prod_txt'] = $paracrm_row['INV_LIG_field_BASE_PROD_entry_PROD_TXT'] ;
		$row['base_qty'] = $paracrm_row['INV_LIG_field_BASE_QTY'] ;
		$row['static_txt'] = $paracrm_row['INV_LIG_field_STATIC_TXT'] ;
		$row['static_amount'] = $paracrm_row['INV_LIG_field_STATIC_AMOUNT'] ;
		$row['join_price'] = $paracrm_row['INV_LIG_field_JOIN_PRICE'] ;
		$row['join_coef1'] = $paracrm_row['INV_LIG_field_JOIN_COEF1'] ;
		$row['join_coef2'] = $paracrm_row['INV_LIG_field_JOIN_COEF2'] ;
		$row['join_vat'] = $paracrm_row['INV_LIG_field_JOIN_VAT'] ;
		$row['calc_amount_novat'] = $paracrm_row['INV_LIG_field_CALC_AMOUNT_NOVAT'] ;
		$row['calc_amount_final'] = $paracrm_row['INV_LIG_field_CALC_AMOUNT_FINAL'] ;
		
		$TAB[$filerecord_parent_id]['ligs'][] = $row ;
	}
	
	
	if( isset($post_data['filter_invFilerecordId_arr']) ) {
		$filter_invFilerecordId_arr = json_decode($post_data['filter_invFilerecordId_arr']) ;
		
		$new_TAB = array() ;
		foreach( $filter_invFilerecordId_arr as $inv_filerecord_id ) {
			if( !$TAB[$inv_filerecord_id] ) {
				continue ;
			}
			$new_TAB[$inv_filerecord_id] = $TAB[$inv_filerecord_id] ;
		}
		$TAB = $new_TAB ;
	}
	
	return array('success'=>true, 'data'=>array_values($TAB), 'debug'=>$debug) ;
}




function specBpSales_inv_createFromOrder( $post_data ) {
	global $_opDB ;
	
	$row_cde = NULL ;
	$ttmp = specBpSales_cde_getRecords(array()) ;
	foreach( $ttmp['data'] as $row_cde_test ) {
		if( $row_cde_test['cde_filerecord_id'] == $post_data['cde_filerecord_id'] ) {
			$row_cde = $row_cde_test ;
			break ;
		}
	}
	if( !$row_cde ) {
		return array('success'=>false, 'error'=>'Not found') ;
	}
	if( $row_cde['status_percent'] != 50 || $row_cde['link_inv_filerecord_id'] ) {
		return array('success'=>false, 'error'=>'Invalid status') ;
	}
	
	$_opDB->query("LOCK TABLES view_file_Z_ATTRIB WRITE") ;
	$query = "UPDATE view_file_Z_ATTRIB set field_ID=field_ID+'1' WHERE field_FILE_CODE='INV'" ;
	$_opDB->query($query) ;
	$query = "SELECT field_ID FROM view_file_Z_ATTRIB WHERE field_FILE_CODE='INV'" ;
	$id = $_opDB->query_uniqueValue($query) ;
	$_opDB->query("UNLOCK TABLES") ;
	
	$arr_ins = array() ;
	$arr_ins['field_ID_INV'] = 'INV/'.str_pad((float)$id, 6, "0", STR_PAD_LEFT) ;
	$arr_ins['field_ID_CDE_REF'] = $row_cde['cde_ref'] ;
	$arr_ins['field_CLI_LINK'] = $row_cde['cli_link'] ;
	$arr_ins['field_ADR_SENDTO'] = $row_cde['cli_link_txt'] ;
	$arr_ins['field_ADR_INVOICE'] = $row_cde['cli_link_txt'] ;
	$arr_ins['field_ADR_SHIP'] = $row_cde['cli_link_txt'] ;
	$arr_ins['field_DATE_CREATE'] = date('Y-m-d H:i:s') ;
	$arr_ins['field_DATE_INVOICE'] = $row_cde['date_order'] ;
	$inv_filerecord_id = paracrm_lib_data_insertRecord_file( 'INV', 0, $arr_ins );
	
	foreach( $row_cde['ligs'] as $row_cde_lig ) {
		$arr_ins = array() ;
		$arr_ins['field_LINK_CDELIG_FILE_ID'] = $row_cde_lig['cdelig_filerecord_id'] ;
		$arr_ins['field_MODE_INV'] = $row_cde_lig['inv_mode'] ;
		$arr_ins['field_BASE_PROD'] = $row_cde_lig['prod_ref'] ;
		$arr_ins['field_BASE_QTY'] = $row_cde_lig['qty_ship'] ;
		$invlig_filerecord_id = paracrm_lib_data_insertRecord_file( 'INV_LIG', $inv_filerecord_id, $arr_ins );
	}
	
	$arr_update = array() ;
	$arr_update['field_LINK_INV_FILE_ID'] = $inv_filerecord_id ;
	$arr_update['field_STATUS'] = '70_INVCREATE' ;
	paracrm_lib_data_updateRecord_file( 'CDE' , $arr_update, $row_cde['cde_filerecord_id'] ) ;
	
	specBpSales_inv_lib_calc($inv_filerecord_id) ;
	
	return array('success'=>true, 'inv_filerecord_id'=>$inv_filerecord_id) ;
}

function specBpSales_inv_deleteRecord( $post_data ) {


}

function specBpSales_inv_setRecord( $post_data ) {
	global $_opDB ;
	
	$record_data = json_decode($post_data['data'],true) ;
	
	if( !$record_data['inv_filerecord_id'] ) {
		return array('success'=>false) ;
	}
	
	$arr_update = array() ;
	$arr_update['field_DATE_INVOIDE'] = $record_data['date_invoice'] ;
	$arr_update['field_ADR_SENDTO'] = $record_data['adr_sendto'] ;
	$arr_update['field_ADR_INVOICE'] = $record_data['adr_invoice'] ;
	$arr_update['field_ADR_SHIP'] = $record_data['adr_ship'] ;
	paracrm_lib_data_updateRecord_file( 'INV' , $arr_update, $record_data['inv_filerecord_id'] ) ;
	
	$arr_existingIds = array() ;
	$query = "SELECT filerecord_id FROM view_file_INV_LIG WHERE filerecord_parent_id='{$record_data['inv_filerecord_id']}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$arr_existingIds[] = $arr[0] ;
	}
	
	$arr_newIds = array() ;
	foreach( $record_data['ligs'] as $row_lig ) {
		$arr_update = array() ;
		$arr_update['field_MODE_INV'] = $row_lig['mode_inv'] ;
		$arr_update['field_BASE_PROD'] = $row_lig['base_prod'] ;
		$arr_update['field_BASE_QTY'] = $row_lig['base_qty'] ;
		if( !is_numeric($row_lig['invlig_filerecord_id']) ) {
			$arr_newIds[] = paracrm_lib_data_insertRecord_file( 'INV_LIG', $record_data['inv_filerecord_id'], $arr_update );
		} else {
			$arr_newIds[] = paracrm_lib_data_updateRecord_file( 'INV_LIG' , $arr_update, $row_lig['invlig_filerecord_id'] ) ;
		}
	}
	
	$arr_toDelete = array_diff($arr_existingIds,$arr_newIds) ;
	foreach( $arr_toDelete as $invlig_filerecord_id ) {
		paracrm_lib_data_deleteRecord_file( 'INV_LIG', $invlig_filerecord_id ) ;
	}
	
	specBpSales_inv_lib_calc($record_data['inv_filerecord_id']) ;
	
	return array('success'=>true,'debug'=>$record_data) ;
}


function specBpSales_inv_lib_calc( $inv_filerecord_id ) {
	$ttmp = specBpSales_inv_getRecords(array()) ;
	foreach( $ttmp['data'] as $row_inv_test ) {
		if( $row_inv_test['inv_filerecord_id'] == $inv_filerecord_id ) {
			$row_inv = $row_inv_test ;
			break ;
		}
	}
	if( !$row_inv ) {
		return  ;
	}
	
	$tot_amount_novat = $tot_amount_final = 0 ;
	foreach( $row_inv['ligs'] as $row_inv_lig ) {
		$amount_base = $row_inv_lig['join_price'] * $row_inv_lig['base_qty'] ;
		
		$amount_novat = $amount_base * $row_inv_lig['join_coef1'] * $row_inv_lig['join_coef2'] ;
		$amount_final = $amount_novat * $row_inv_lig['join_vat'] ;
		
		$arr_update = array() ;
		$arr_update['field_CALC_AMOUNT_NOVAT'] = $amount_novat ;
		$arr_update['field_CALC_AMOUNT_FINAL'] = $amount_final ;
		paracrm_lib_data_updateRecord_file( 'INV_LIG' , $arr_update, $row_inv_lig['invlig_filerecord_id'] ) ;
		
		$tot_amount_novat += $amount_novat ;
		$tot_amount_final += $amount_final ;
	}
	
	$arr_update['field_CALC_AMOUNT_NOVAT'] = $tot_amount_novat ;
	$arr_update['field_CALC_AMOUNT_FINAL'] = $tot_amount_final ;
	paracrm_lib_data_updateRecord_file( 'INV' , $arr_update, $row_inv['inv_filerecord_id'] ) ;

}

?>
