<?php
function specBpSales_inv_getCfg( $post_data ) {
	global $_opDB ;
	
	usleep(500*1000);
	$TAB = array() ;
	
	$TAB['peers'] = array() ;
	$query = "SELECT entry_key FROM view_bible_CFG_PEER_entry WHERE treenode_key='INV'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$peer_code = $arr[0] ;
		$ttmp = explode('_',$peer_code,2) ;
		$peer_short = $ttmp[1] ;
		$TAB['peers'][] = array(
			'peer_code' => $peer_code,
			'peer_short' => $peer_short,
			'peer_mkey' => 'invpeer_'.$peer_code
		);
	}
	
	return array('success'=>true,'data'=>$TAB) ;
}
function specBpSales_inv_getRecords( $post_data ) {
	global $_opDB ;
	
	$TAB = array() ;
	
	$forward_post = array() ;
	$forward_post['start'] ;
	$forward_post['limit'] ;
	$forward_post['file_code'] = 'INV' ;
	if( isset($post_data['filter_invFilerecordId_arr']) ) {
		$forward_post['filter'] = json_encode(array(
			array(
				'operator' => 'in',
				'property' => 'INV_id',
				'value' => json_decode($post_data['filter_invFilerecordId_arr'],true)
			)
		)) ;
	}
	$ttmp = paracrm_data_getFileGrid_data( $forward_post, $auth_bypass=TRUE ) ;
	$paracrm_TAB = $ttmp['data'] ;
	foreach( $paracrm_TAB as $paracrm_row ) {
		$row = array() ;
		$row['inv_filerecord_id'] = $paracrm_row['INV_id'] ;
		$row['id_inv'] = $paracrm_row['INV_field_ID_INV'] ;
		$row['id_cde_ref'] = $paracrm_row['INV_field_ID_CDE_REF'] ;
		$row['id_coef'] = (float)$paracrm_row['INV_field_ID_COEF'] ;
		$row['cli_link'] = $paracrm_row['INV_field_CLI_LINK'] ;
		$row['cli_link_txt'] = $paracrm_row['INV_field_CLI_LINK_entry_CLI_NAME'] ;
		$row['cli_linktree'] = $paracrm_row['INV_field_CLI_LINK_tree_CLIGROUP_CODE'] ;
		$row['cli_linktree_txt'] = $paracrm_row['INV_field_CLI_LINK_tree_CLIGROUP_CODE'] ;
		$row['cli_siret'] = $paracrm_row['INV_field_CLI_LINK_entry_CLI_SIRET'] ;
		$row['factor_link'] = $paracrm_row['INV_field_FACTOR_LINK'] ;
		$row['factor_paybank'] = $paracrm_row['INV_field_FACTOR_LINK_entry_ATR_PAYBANK'] ;
		$row['factor_invtxt'] = $paracrm_row['INV_field_FACTOR_LINK_entry_ATR_INVTXT'] ;
		$row['adr_sendto'] = $paracrm_row['INV_field_ADR_SENDTO'] ;
		$row['adr_invoice'] = $paracrm_row['INV_field_ADR_INVOICE'] ;
		$row['adr_ship'] = $paracrm_row['INV_field_ADR_SHIP'] ;
		$row['date_create'] = substr($paracrm_row['INV_field_DATE_CREATE'],0,10) ;
		$row['date_invoice'] = substr($paracrm_row['INV_field_DATE_INVOICE'],0,10) ;
		$row['calc_amount_novat'] = $paracrm_row['INV_field_CALC_AMOUNT_NOVAT'] ;
		$row['calc_amount_final'] = $paracrm_row['INV_field_CALC_AMOUNT_FINAL'] ;
		
		$row['status_is_final'] = $paracrm_row['INV_field_STATUS_IS_FINAL'] ;
		$row['status'] = $paracrm_row['INV_field_STATUS'] ;
		$row['status_txt'] = $paracrm_row['INV_field_STATUS_entry_STATUS_TXT'] ;
		$row['status_percent'] = $paracrm_row['INV_field_STATUS_entry_PERCENT'] ;
		
		if( $row['status_percent'] > 85 ) {
			$row['status_color'] = '' ;
		} elseif( $row['status_percent'] == 85 ) {
			$row['status_color'] = 'green' ;
		} else {
			$row['status_color'] = 'red' ;
		}
		
		$row['ligs'] = array() ;
		//$row['peers'] = array() ;
		
		$TAB[$paracrm_row['filerecord_id']] = $row ;
	}
	
	if( TRUE ) {
		$query = "SELECT ip.* FROM view_file_INV_PEER ip WHERE 1" ;
		if( isset($post_data['filter_invFilerecordId_arr']) ) {
			$arr_invFilerecordIds = json_decode($post_data['filter_invFilerecordId_arr'],true) ;
			if( $arr_invFilerecordIds ) {
				$sqlList_invFilerecordIds = $_opDB->makeSQLlist($arr_invFilerecordIds) ;
				$query.= " AND ip.filerecord_parent_id IN {$sqlList_invFilerecordIds}" ;
			}
		}
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
			$inv_filerecord_id = $arr['filerecord_parent_id'] ;
			if( !isset($TAB[$inv_filerecord_id]) ) {
				continue ;
			}
			$mkey = 'invpeer_'.$arr['field_PEER_CODE'] ;
			$value = ($arr['field_SEND_IS_OK'] && ($arr['field_SEND_REF']!='ZERO')) ;
			$TAB[$inv_filerecord_id][$mkey] = $value ;
		}
	}
	
	
	if( !$post_data['filter_fastMode'] ) {
		$forward_post = array() ;
		$forward_post['start'] ;
		$forward_post['limit'] ;
		$forward_post['file_code'] = 'INV_LIG' ;
			$sorter = array() ;
			$sorter['property'] = 'INV_LIG_id' ;
			$sorter['direction'] = 'DESC' ;
		$forward_post['sort'] = json_encode(array($sorter)) ;
		if( isset($post_data['filter_invFilerecordId_arr']) ) {
			$forward_post['filter'] = json_encode(array(
				array(
					'operator' => 'in',
					'property' => 'INV_id',
					'value' => json_decode($post_data['filter_invFilerecordId_arr'],true)
				)
			)) ;
		}
		$ttmp = paracrm_data_getFileGrid_data( $forward_post, $auth_bypass=TRUE ) ;
		$paracrm_TAB = $ttmp['data'] ;
		foreach( $paracrm_TAB as $paracrm_row ) {
			$filerecord_parent_id = $paracrm_row['INV_id'] ;
			
			$row = array() ;
			$row['invlig_filerecord_id'] = $paracrm_row['INV_LIG_id'] ;
			$row['id_inv_lig'] = $paracrm_row['INV_LIG_field_ID_INV_LIG'] ;
			$row['link_cdelig_filerecord_id'] = $paracrm_row['INV_LIG_field_LINK_CDELIG_FILE_ID'] ;
			$row['mode_inv'] = $paracrm_row['INV_LIG_field_MODE_INV'] ;
			$row['mode_inv_is_calc'] = ($paracrm_row['INV_LIG_field_MODE_INV_tree_INVMODE_GROUP']=='CALC') ;
			$row['base_prod'] = $paracrm_row['INV_LIG_field_BASE_PROD'] ;
			$row['base_prod_txt'] = $paracrm_row['INV_LIG_field_BASE_PROD_entry_PROD_TXT'] ;
			$row['base_prod_ean'] = $paracrm_row['INV_LIG_field_BASE_PROD_entry_PROD_SKU_EAN'] ;
			$row['base_prod_pcb'] = $paracrm_row['INV_LIG_field_BASE_PROD_entry_QTE_SKU'] ;
			$row['base_qty'] = $paracrm_row['INV_LIG_field_BASE_QTY'] ;
			$row['static_txt'] = $paracrm_row['INV_LIG_field_STATIC_TXT'] ;
			$row['static_amount'] = $paracrm_row['INV_LIG_field_STATIC_AMOUNT'] ;
			$row['join_price'] = $paracrm_row['INV_LIG_field_JOIN_PRICE'] ;
			$row['join_coef1'] = $paracrm_row['INV_LIG_field_JOIN_COEF1'] ;
			$row['join_coef2'] = $paracrm_row['INV_LIG_field_JOIN_COEF2'] ;
			$row['join_coef3'] = $paracrm_row['INV_LIG_field_JOIN_COEF3'] ;
			$row['join_vat'] = $paracrm_row['INV_LIG_field_JOIN_VAT'] ;
			$row['mod_is_on'] = ($paracrm_row['INV_LIG_field_MOD_IS_ON']==1) ;
			$row['mod_price'] = $paracrm_row['INV_LIG_field_MOD_PRICE'] ;
			$row['mod_coef1'] = $paracrm_row['INV_LIG_field_MOD_COEF1'] ;
			$row['mod_coef2'] = $paracrm_row['INV_LIG_field_MOD_COEF2'] ;
			$row['mod_coef3'] = $paracrm_row['INV_LIG_field_MOD_COEF3'] ;
			$row['mod_vat'] = $paracrm_row['INV_LIG_field_MOD_VAT'] ;
			$row['calc_amount_novat'] = $paracrm_row['INV_LIG_field_CALC_AMOUNT_NOVAT'] ;
			$row['calc_amount_final'] = $paracrm_row['INV_LIG_field_CALC_AMOUNT_FINAL'] ;
			
			$TAB[$filerecord_parent_id]['ligs'][] = $row ;
		}
		$debug = $paracrm_TAB ;
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




function specBpSales_inv_createFromBlank( $post_data ) {
	global $_opDB ;
	
	switch( $post_data['inv_prefix'] ) {
		case 'INV' :
			$prefix = 'INV' ;
			$coef = 1 ;
			break ;
			
		case 'REF' :
			$prefix = 'REF' ;
			$coef = -1 ;
			break ;
		
		default :
			return array('success'=>false) ;
	}
	
	$arr_ins = array() ;
	$arr_ins['field_ID_INV'] = 'draft' ;
	$arr_ins['field_ID_COEF'] = $coef ;
	$arr_ins['field_DATE_CREATE'] = date('Y-m-d H:i:s') ;
	$arr_ins['field_DATE_INVOICE'] = date('Y-m-d') ;
	$arr_ins['field_STATUS'] = '70_INVCREATE' ;
	$inv_filerecord_id = paracrm_lib_data_insertRecord_file( 'INV', 0, $arr_ins );
	
	specBpSales_inv_lib_calc($inv_filerecord_id) ;
	
	return array('success'=>true, 'inv_filerecord_id'=>$inv_filerecord_id) ;
}
function specBpSales_inv_createFromOrder( $post_data ) {
	global $_opDB ;
	
	$row_cde = NULL ;
	$ttmp = specBpSales_cde_getRecords(
		array(
			'filter_cdeFilerecordId_arr'=>json_encode(array($post_data['cde_filerecord_id']))
		)
	) ;
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
	
	//Query customer
	$customer_entry = paracrm_lib_data_getRecord_bibleEntry('CUSTOMER',$row_cde['cli_link']) ;
	$customer_treenode = paracrm_lib_data_getRecord_bibleTreenode('CUSTOMER',$customer_entry['treenode_key'],$ascend_on_empty=TRUE) ;
	
	$arr_ins = array() ;
	$arr_ins['field_ID_INV'] = 'draft' ;
	$arr_ins['field_ID_CDE_REF'] = $row_cde['cde_ref'] ;
	$arr_ins['field_ID_COEF'] = 1 ;
	$arr_ins['field_CLI_LINK'] = $row_cde['cli_link'] ;
	$arr_ins['field_ADR_SENDTO'] = $customer_entry['field_ADR_SENDTO'] ;
	$arr_ins['field_ADR_INVOICE'] = $customer_entry['field_ADR_INVOICE'] ;
	$arr_ins['field_ADR_SHIP'] = $customer_entry['field_ADR_SHIP'] ;
	$arr_ins['field_FACTOR_LINK'] = $customer_treenode['field_LINK_FACTOR'] ;
	$arr_ins['field_DATE_CREATE'] = date('Y-m-d H:i:s') ;
	$arr_ins['field_DATE_INVOICE'] = $row_cde['date_ship'] ;
	$arr_ins['field_STATUS'] = '70_INVCREATE' ;
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
function specBpSales_inv_createFromInvoiceRefund( $post_data ) {
	global $_opDB ;
	
	$row_inv = NULL ;
	$ttmp = specBpSales_inv_getRecords(
		array(
			'filter_invFilerecordId_arr'=>json_encode(array($post_data['inv_filerecord_id']))
		)
	) ;
	foreach( $ttmp['data'] as $row_inv_test ) {
		if( $row_inv_test['inv_filerecord_id'] == $post_data['inv_filerecord_id'] ) {
			$row_inv = $row_inv_test ;
			break ;
		}
	}
	if( !$row_inv ) {
		return array('success'=>false, 'error'=>'Not found') ;
	}
	
	$arr_ins = array() ;
	$arr_ins['field_ID_INV'] = 'draft' ;
	$arr_ins['field_ID_CDE_REF'] = $row_inv['id_cde_ref'] ;
	$arr_ins['field_ID_COEF'] = -1 ; 
	$arr_ins['field_CLI_LINK'] = $row_inv['cli_link'] ;
	$arr_ins['field_ADR_SENDTO'] = $row_inv['adr_sendto'] ;
	$arr_ins['field_ADR_INVOICE'] = $row_inv['adr_invoice'] ;
	$arr_ins['field_ADR_SHIP'] = $row_inv['adr_ship'] ;
	$arr_ins['field_FACTOR_LINK'] = $row_inv['factor_link'] ;
	$arr_ins['field_DATE_CREATE'] = date('Y-m-d H:i:s') ;
	$arr_ins['field_DATE_INVOICE'] = $row_inv['date_invoice'] ;
	$inv_filerecord_id = paracrm_lib_data_insertRecord_file( 'INV', 0, $arr_ins );
	
	foreach( $row_inv['ligs'] as $row_inv_lig ) {
		$arr_ins = array() ;
		$arr_ins['field_LINK_CDELIG_FILE_ID'] = $row_inv_lig['link_cdelig_filerecord_id'] ;
		$arr_ins['field_MODE_INV'] = $row_inv_lig['mode_inv'] ;
		$arr_ins['field_BASE_PROD'] = $row_inv_lig['base_prod'] ;
		$arr_ins['field_BASE_QTY'] = $row_inv_lig['base_qty'] ;
		$arr_ins['field_STATIC_TXT'] = $row_inv_lig['static_txt'] ;
		$arr_ins['field_STATIC_AMOUNT'] = $row_inv_lig['static_amount'] ;
		$invlig_filerecord_id = paracrm_lib_data_insertRecord_file( 'INV_LIG', $inv_filerecord_id, $arr_ins );
	}
	
	specBpSales_inv_lib_calc($inv_filerecord_id) ;
	
	return array('success'=>true, 'inv_filerecord_id'=>$inv_filerecord_id) ;
}
function specBpSales_inv_queryCustomer( $post_data ) {
	//Query customer
	$customer_entry = paracrm_lib_data_getRecord_bibleEntry('CUSTOMER',$post_data['cli_link']) ;
	$customer_treenode = paracrm_lib_data_getRecord_bibleTreenode('CUSTOMER',$customer_entry['treenode_key'],$ascend_on_empty=TRUE) ;
	
	
	
	$arr_ins['adr_sendto'] = $customer_entry['field_ADR_SENDTO'] ;
	$arr_ins['adr_invoice'] = $customer_entry['field_ADR_INVOICE'] ;
	$arr_ins['adr_ship'] = $customer_entry['field_ADR_SHIP'] ;
	$arr_ins['factor_link'] = $customer_treenode['field_LINK_FACTOR'] ;
	$arr_ins['cli_siret'] = $customer_entry['field_CLI_SIRET'] ;
	
	return array('success'=>true, 'data'=>$arr_ins) ;
}

function specBpSales_inv_deleteRecord( $post_data ) {
	global $_opDB ;
	$ttmp = specBpSales_inv_getRecords(
		array(
			'filter_invFilerecordId_arr'=> json_encode(array($post_data['inv_filerecord_id']))
		)
	) ;
	$inv_record = $ttmp['data'][0] ;
	if( !$inv_record || $inv_record['inv_filerecord_id']!=$post_data['inv_filerecord_id'] ) {
		return array('success'=>false) ;
	}
	if( $inv_record['status_is_final'] ) {
		return array('success'=>false) ;
	}
	
	
	$arr_cdeFilerecordIds = array() ;
	$query = "SELECT filerecord_id FROM view_file_CDE WHERE field_LINK_INV_FILE_ID='{$inv_record['inv_filerecord_id']}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$arr_cdeFilerecordIds[] = $arr[0] ;
	}
	
	$ttmp = specBpSales_cde_getRecords(
		array(
			'filter_cdeFilerecordId_arr'=> json_encode($arr_cdeFilerecordIds)
		)
	) ;
	$cde_records = $ttmp['data'] ;
	foreach( $cde_records as $row_cde ) {
		$arr_update = array() ;
		$arr_update['field_LINK_INV_FILE_ID'] = 0 ;
		$arr_update['field_STATUS'] = '50_SHIPPED' ;
		paracrm_lib_data_updateRecord_file( 'CDE' , $arr_update, $row_cde['cde_filerecord_id'] ) ;
	}
	
	paracrm_lib_data_deleteRecord_file( 'INV', $post_data['inv_filerecord_id'] ) ;
	
	return array('success'=>true) ;
}

function specBpSales_inv_setRecord( $post_data ) {
	global $_opDB ;
	
	$record_data = json_decode($post_data['data'],true) ;
	
	if( !$record_data['inv_filerecord_id'] ) {
		return array('success'=>false) ;
	}
	
	if( $record_data['cli_link'] ) {
		$arr_update = array() ;
		$arr_update['field_CLI_EAN'] = $record_data['cli_link'] ;
		$arr_update['field_CLI_SIRET'] = trim($record_data['cli_siret']) ;
		paracrm_lib_data_updateRecord_bibleEntry('CUSTOMER',$record_data['cli_link'],$arr_update) ;
	}
	
	$arr_update = array() ;
	$arr_update['field_ID_CDE_REF'] = $record_data['id_cde_ref'] ;
	$arr_update['field_CLI_LINK'] = $record_data['cli_link'] ;
	$arr_update['field_DATE_INVOICE'] = $record_data['date_invoice'] ;
	$arr_update['field_DATE_INVOICE'] = $record_data['date_invoice'] ;
	$arr_update['field_FACTOR_LINK'] = $record_data['factor_link'] ;
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
		$arr_update['field_STATIC_AMOUNT'] = $row_lig['static_amount'] ;
		$arr_update['field_STATIC_TXT'] = $row_lig['static_txt'] ;
		$arr_update['field_MOD_IS_ON'] = ($row_lig['mod_is_on'] ? 1 : 0) ;
		$arr_update['field_MOD_PRICE'] = $row_lig['mod_price'] ;
		$arr_update['field_MOD_COEF1'] = $row_lig['mod_coef1'] ;
		$arr_update['field_MOD_COEF2'] = $row_lig['mod_coef2'] ;
		$arr_update['field_MOD_COEF3'] = $row_lig['mod_coef3'] ;
		$arr_update['field_MOD_VAT'] = $row_lig['mod_vat'] ;
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
	
	if( $post_data['validate'] == 1 ) {
		$arr_cdeFilerecordIds = array() ;
		$query = "SELECT filerecord_id FROM view_file_CDE WHERE field_LINK_INV_FILE_ID='{$record_data['inv_filerecord_id']}'" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$arr_cdeFilerecordIds[] = $arr[0] ;
		}
		
		$ttmp = specBpSales_inv_getRecords(
			array(
				'filter_invFilerecordId_arr'=> json_encode(array($record_data['inv_filerecord_id']))
			)
		) ;
		$inv_record = $ttmp['data'][0] ;
		$coef = $inv_record['id_coef'] ;
		$prefix = 'BLK' ;
		if( $coef > 0 ) {
			$prefix = 'INV' ;
		}
		if( $coef < 0 ) {
			$prefix = 'AVR' ;
		}
		
		$_opDB->query("LOCK TABLES view_file_Z_ATTRIB WRITE") ;
		$query = "UPDATE view_file_Z_ATTRIB set field_ID=field_ID+'1' WHERE field_FILE_CODE='{$prefix}'" ;
		$_opDB->query($query) ;
		$query = "SELECT field_ID FROM view_file_Z_ATTRIB WHERE field_FILE_CODE='{$prefix}'" ;
		$id = $_opDB->query_uniqueValue($query) ;
		$_opDB->query("UNLOCK TABLES") ;
		
		
		$ttmp = specBpSales_cde_getRecords(
			array(
				'filter_cdeFilerecordId_arr'=> json_encode($arr_cdeFilerecordIds)
			)
		) ;
		$cde_records = $ttmp['data'] ;
		foreach( $cde_records as $row_cde ) {
			if( $row_cde['status_percent'] < 85 ) {
				$arr_update = array() ;
				$arr_update['field_STATUS'] = '85_INVOK' ;
				paracrm_lib_data_updateRecord_file( 'CDE' , $arr_update, $row_cde['cde_filerecord_id'] ) ;
			}
		}
		$arr_update = array() ;
		$arr_update['field_ID_INV'] = $prefix.'/'.str_pad((float)$id, 6, "0", STR_PAD_LEFT) ;
		$arr_update['field_STATUS_IS_FINAL'] = 1 ;
		$arr_update['field_STATUS'] = '85_INVOK' ;
		paracrm_lib_data_updateRecord_file( 'INV' , $arr_update, $record_data['inv_filerecord_id'] ) ;
	}
	
	return array('success'=>true,'debug'=>$record_data) ;
}
function specBpSales_inv_reopenRecord( $post_data ) {
	global $_opDB ;
	
	$ttmp = specBpSales_inv_getRecords(
		array(
			'filter_invFilerecordId_arr'=> json_encode(array($post_data['inv_filerecord_id']))
		)
	) ;
	$inv_record = $ttmp['data'][0] ;
	if( !$inv_record || $inv_record['inv_filerecord_id']!=$post_data['inv_filerecord_id'] ) {
		return array('success'=>false) ;
	}
	
	if( $inv_record['status_percent'] <= 70 && !$inv_record['status_is_final'] ) {
		return array('success'=>true) ;
	}
	
	
	// test ?
	$query = "SELECT count(*) FROM view_file_INV_PEER 
		WHERE filerecord_parent_id='{$inv_record['inv_filerecord_id']}' AND field_SEND_IS_OK='1'" ;
	if( $_opDB->query_uniqueValue($query) > 0 ) {
		return array('success'=>false, 'error'=>'Some peers already sent') ;
	}
	
	
	$arr_cdeFilerecordIds = array() ;
	$query = "SELECT filerecord_id FROM view_file_CDE WHERE field_LINK_INV_FILE_ID='{$inv_record['inv_filerecord_id']}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$arr_cdeFilerecordIds[] = $arr[0] ;
	}
	
	$ttmp = specBpSales_cde_getRecords(
		array(
			'filter_cdeFilerecordId_arr'=> json_encode($arr_cdeFilerecordIds)
		)
	) ;
	$cde_records = $ttmp['data'] ;
	foreach( $cde_records as $row_cde ) {
		$arr_update = array() ;
		$arr_update['field_STATUS'] = '70_INVCREATE' ;
		paracrm_lib_data_updateRecord_file( 'CDE' , $arr_update, $row_cde['cde_filerecord_id'] ) ;
	}
	$arr_update = array() ;
	$arr_update['field_ID_INV'] = 'draft' ;
	$arr_update['field_STATUS_IS_FINAL'] = 0 ;
	$arr_update['field_STATUS'] = '70_INVCREATE' ;
	paracrm_lib_data_updateRecord_file( 'INV' , $arr_update, $inv_record['inv_filerecord_id'] ) ;
	
	return array('success'=>true) ;
}

function specBpSales_inv_lib_calc( $inv_filerecord_id ) {
	$ttmp = specBpSales_inv_getRecords(
		array(
			'filter_invFilerecordId_arr'=>json_encode(array($inv_filerecord_id))
		)
	) ;
	foreach( $ttmp['data'] as $row_inv_test ) {
		if( $row_inv_test['inv_filerecord_id'] == $inv_filerecord_id ) {
			$row_inv = $row_inv_test ;
			break ;
		}
	}
	if( !$row_inv ) {
		return  ;
	}
	$coef = $row_inv['id_coef'] ;
	
	$tot_amount_novat = $tot_amount_final = 0 ;
	foreach( $row_inv['ligs'] as $row_inv_lig ) {
		$amount_base = $row_inv_lig['join_price'] * $row_inv_lig['base_qty'] ;
		
		$amount_novat = 0 ;
		$amount_novat+= $amount_base * $row_inv_lig['join_coef1'] * $row_inv_lig['join_coef2'] * $row_inv_lig['join_coef3'] ;
		$amount_novat+= $row_inv_lig['static_amount'] ;
		$amount_final = $amount_novat * $row_inv_lig['join_vat'] ;
		
		if( $row_inv_lig['mod_is_on'] ) {
			$amount_base = $row_inv_lig['mod_price'] * $row_inv_lig['base_qty'] ;
			$amount_novat = 0 ;
			$amount_novat+= $amount_base * $row_inv_lig['mod_coef1'] * $row_inv_lig['mod_coef2'] * $row_inv_lig['mod_coef3'] ;
			$amount_novat+= $row_inv_lig['static_amount'] ;
			$amount_final = $amount_novat * $row_inv_lig['mod_vat'] ;
		}
		
		
		$arr_update = array() ;
		
		$arr_update['field_JC_PRICE'] = $row_inv_lig['join_price'] ;
		$arr_update['field_JC_COEF1'] = $row_inv_lig['join_coef1'] ;
		$arr_update['field_JC_COEF2'] = $row_inv_lig['join_coef2'] ;
		$arr_update['field_JC_COEF3'] = $row_inv_lig['join_coef3'] ;
		$arr_update['field_JC_VAT'] = $row_inv_lig['join_vat'] ;
		if( $row_inv_lig['mod_is_on'] ) {
			$arr_update['field_LOG_PRICE'] = $row_inv_lig['mod_price'] ;
			$arr_update['field_LOG_COEF1'] = $row_inv_lig['mod_coef1'] ;
			$arr_update['field_LOG_COEF2'] = $row_inv_lig['mod_coef2'] ;
			$arr_update['field_LOG_COEF3'] = $row_inv_lig['mod_coef3'] ;
			$arr_update['field_LOG_VAT'] = $row_inv_lig['mod_vat'] ;
		} else {
			$arr_update['field_LOG_PRICE'] = $row_inv_lig['join_price'] ;
			$arr_update['field_LOG_COEF1'] = $row_inv_lig['join_coef1'] ;
			$arr_update['field_LOG_COEF2'] = $row_inv_lig['join_coef2'] ;
			$arr_update['field_LOG_COEF3'] = $row_inv_lig['join_coef3'] ;
			$arr_update['field_LOG_VAT'] = $row_inv_lig['join_vat'] ;
		}
		
		$arr_update['field_CALC_AMOUNT_NOVAT'] = $coef * $amount_novat ;
		$arr_update['field_CALC_AMOUNT_FINAL'] = $coef * $amount_final ;
		paracrm_lib_data_updateRecord_file( 'INV_LIG' , $arr_update, $row_inv_lig['invlig_filerecord_id'] ) ;
		
		$tot_amount_novat += $amount_novat ;
		$tot_amount_final += $amount_final ;
	}
	
	$arr_update['field_CALC_AMOUNT_NOVAT'] = $tot_amount_novat * $coef ;
	$arr_update['field_CALC_AMOUNT_FINAL'] = $tot_amount_final * $coef ;
	paracrm_lib_data_updateRecord_file( 'INV' , $arr_update, $row_inv['inv_filerecord_id'] ) ;

}
function specBpSales_inv_lib_close( $inv_filerecord_id ) {
	global $_opDB ;
	
	$ttmp = specBpSales_inv_getRecords(
		array(
			'filter_invFilerecordId_arr'=>json_encode(array($inv_filerecord_id))
		)
	) ;
	foreach( $ttmp['data'] as $row_inv_test ) {
		if( $row_inv_test['inv_filerecord_id'] == $inv_filerecord_id ) {
			$row_inv = $row_inv_test ;
			break ;
		}
	}
	if( !$row_inv || !$row_inv['status_is_final'] ) {
		return  ;
	}
	
	$arr_cdeFilerecordIds = array() ;
	$query = "SELECT filerecord_id FROM view_file_CDE WHERE field_LINK_INV_FILE_ID='{$row_inv['inv_filerecord_id']}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$arr_cdeFilerecordIds[] = $arr[0] ;
	}
	
	$ttmp = specBpSales_cde_getRecords(
		array(
			'filter_cdeFilerecordId_arr'=> json_encode($arr_cdeFilerecordIds)
		)
	) ;
	$cde_records = $ttmp['data'] ;
	foreach( $cde_records as $row_cde ) {
		if( $row_cde['status_percent'] < 99 ) {
			$arr_update = array() ;
			$arr_update['field_STATUS'] = '99_CLOSED' ;
			paracrm_lib_data_updateRecord_file( 'CDE' , $arr_update, $row_cde['cde_filerecord_id'] ) ;
		}
	}
	$arr_update = array() ;
	$arr_update['field_STATUS'] = '99_CLOSED' ;
	paracrm_lib_data_updateRecord_file( 'INV' , $arr_update, $row_inv['inv_filerecord_id'] ) ;
}







function specBpSales_inv_printDoc( $post_data ) {
	global $_opDB ;
	
	$p_invFilerecordId = $post_data['inv_filerecord_id'] ;
	
	$app_root = $GLOBALS['app_root'] ;
	$resources_root=$app_root.'/resources' ;
	$templates_dir=$resources_root.'/server/templates' ;
	$_IMG['DBS_logo_bw'] = file_get_contents($templates_dir.'/'.'DBS_logo_bw.png') ;
	
	$ttmp = specBpSales_inv_getRecords( array(
		'filter_invFilerecordId_arr' => json_encode( array($p_invFilerecordId) )
	) );
	if( count($ttmp['data']) != 1 ) {
		return array('success'=>false) ;
	}
	$inv_record = $ttmp['data'][0] ;
	
	
	$query = "SELECT filerecord_id FROM view_file_CDE WHERE field_LINK_INV_FILE_ID='{$inv_record['inv_filerecord_id']}'" ;
	$cde_filerecord_id = $_opDB->query_uniqueValue($query) ;
	if( !$cde_filerecord_id && $inv_record['id_cde_ref'] ) {
		$query = "SELECT filerecord_id FROM view_file_CDE WHERE field_CDE_NO='{$inv_record['id_cde_ref']}'" ;
		$cde_filerecord_id = $_opDB->query_uniqueValue($query) ;
	}
	
	$ttmp = specBpSales_cde_getRecords( array(
		'filter_cdeFilerecordId_arr' => json_encode( array($cde_filerecord_id) )
	) );
	if( count($ttmp['data']) == 1 ) {
		$cde_record = $ttmp['data'][0] ;
	}
	
	
	if( $cde_record ) {
		$map_mkey_value = array(
			'id_inv' => $inv_record['id_inv'],
			'cli_link' => $inv_record['cli_link'],
			'cde_no' => $cde_record['cde_ref'],
			'cli_ref_id' => $cde_record['cli_ref_id'],
			'date_order' => date('d/m/Y',strtotime($cde_record['date_order'])),
			'date_ship' => date('d/m/Y',strtotime($cde_record['date_ship'])),
			
			'adr_sendto' => nl2br($inv_record['adr_sendto']),
			'adr_invoice' => nl2br($inv_record['adr_invoice']),
			'adr_ship' => nl2br($inv_record['adr_ship']),
			
			'factor_paybank' => nl2br($inv_record['factor_paybank']),
			'factor_invtxt' => nl2br($inv_record['factor_invtxt']),
			
			'calc_amount_novat' => number_format($inv_record['calc_amount_novat'],2),
			'calc_amount_final' => number_format($inv_record['calc_amount_final'],2),
			'calc_vat' => number_format($inv_record['calc_amount_final']-$inv_record['calc_amount_novat'],2),
			
			'date_invoice' => date('d/m/Y',strtotime($inv_record['date_invoice'])),
			'date_due' => date('d/m/Y',strtotime('+30 days',strtotime($inv_record['date_invoice'])))
		);
	} else {
		$map_mkey_value = array(
			'id_inv' => $inv_record['id_inv'],
			'cli_link' => $inv_record['cli_link'],
			'cde_no' => $inv_record['id_cde_ref'],
			//'cli_ref_id' => $cde_record['cli_ref_id'],
			//'date_order' => date('d/m/Y',strtotime($inv_record['date_invoice'])),
			//'date_ship' => date('d/m/Y',strtotime($inv_record['date_invoice'])),
			
			'adr_sendto' => nl2br($inv_record['adr_sendto']),
			'adr_invoice' => nl2br($inv_record['adr_invoice']),
			'adr_ship' => nl2br($inv_record['adr_ship']),
			
			'factor_paybank' => nl2br($inv_record['factor_paybank']),
			'factor_invtxt' => nl2br($inv_record['factor_invtxt']),
			
			'calc_amount_novat' => number_format($inv_record['calc_amount_novat'],2),
			'calc_amount_final' => number_format($inv_record['calc_amount_final'],2),
			'calc_vat' => number_format($inv_record['calc_amount_final']-$inv_record['calc_amount_novat'],2),
			
			'date_invoice' => date('d/m/Y',strtotime($inv_record['date_invoice'])),
			'date_due' => date('d/m/Y',strtotime('+30 days',strtotime($inv_record['date_invoice'])))
		);
	}
	
	if( $inv_record['calc_amount_final'] < 0 ) {
		$map_mkey_value['date_due'] = NULL ;
	}
	
	
	$map_columns = array(
		'prod_ref_ean' => 'EAN Produit',
		'prod_ref' => 'Code produit',
		'txt' => 'Designation',
		'qty_ship_uc' => 'Nb cartons',
		'prod_ref_pcb' => 'SKU/carton',
		'qty_ship' => 'Quantité SKU',
		'join_price' => 'Prix tarif HT',
		'join_coef1' => 'Remise 1',
		'join_coef2' => 'Remise 2',
		'join_coef3' => 'Promo',
		'calc_price_unit' => 'Prix unitaire HT',
		'join_vat' => 'TVA',
		'calc_amount_novat' => 'Montant HT'
	);
	$table_columns = array() ;
	foreach( $map_columns as $mkey => $mvalue ) {
		$table_columns[] = array(
			'dataIndex' => $mkey,
			'text' => $mvalue
		);
	}
	
	$table_data = array() ;
	foreach( array_reverse($inv_record['ligs']) as $invlig_record ) {
		if( $invlig_record['mod_is_on'] ) {
			$invlig_record['join_price'] = $invlig_record['mod_price'] ;
			$invlig_record['join_coef1'] = $invlig_record['mod_coef1'] ;
			$invlig_record['join_coef2'] = $invlig_record['mod_coef2'] ;
			$invlig_record['join_coef3'] = $invlig_record['mod_coef3'] ;
			$invlig_record['join_vat'] = $invlig_record['mod_vat'] ;
		}
		
		$row_table = array(
			'join_vat' => (($invlig_record['join_vat'] * 100) - 100).' %',
			'calc_amount_novat' => number_format($invlig_record['calc_amount_novat'],2)
		);
		if( $invlig_record['base_prod'] ) {
			$row_table+= array(
				'prod_ref_ean' => $invlig_record['base_prod_ean'],
				'prod_ref' => $invlig_record['base_prod'],
				'prod_ref_pcb' => (float)$invlig_record['base_prod_pcb'],
				'txt' => htmlentities($invlig_record['base_prod_txt']),
				'qty_ship' => (float)$invlig_record['base_qty'],
				'qty_ship_uc' => (float)($invlig_record['base_qty']/$invlig_record['base_prod_pcb']),
				'join_price' => $invlig_record['join_price'],
				'join_coef1' => (100 - ($invlig_record['join_coef1'] * 100)).' %',
				'join_coef2' => (100 - ($invlig_record['join_coef2'] * 100)).' %',
				'join_coef3' => (100 - ($invlig_record['join_coef3'] * 100)).' %',
				'calc_price_unit' => number_format($invlig_record['join_price']*$invlig_record['join_coef1']*$invlig_record['join_coef2']*$invlig_record['join_coef3'],2),
				'calc_price_novat' => number_format($invlig_record['calc_amount_novat'],2)
			);
		}
		if( $invlig_record['static_txt'] ) {
			$row_table+= array(
				'txt' => htmlentities($invlig_record['static_txt']),
				'calc_price_novat' => $invlig_record['calc_amount_novat']
			);
		}
		$table_data[] = $row_table ;
	}
	
	
	
	$app_root = $GLOBALS['app_root'] ;
	$resources_root=$app_root.'/resources' ;
	$templates_dir=$resources_root.'/server/templates' ;
	switch( strtolower(DatabaseMgr_Base::dbCurrent_getDomainId()) ) {
		case 'bluephoenix' :
			$inputFileName = $templates_dir.'/'.'BP_SALES_invoice.html' ;
			break ;
		case 'jp' :
			$inputFileName = $templates_dir.'/'.'JP_SALES_invoice.html' ;
			break ;
		default :
			return array('success'=>false) ;
			break ;
	}	
	$inputBinary = file_get_contents($inputFileName) ;
		
	//echo $inputFileName ;
	$doc = new DOMDocument();
	@$doc->loadHTML($inputBinary);
	
	$elements = $doc->getElementsByTagName('qbook-value');
	$i = $elements->length - 1;
	while ($i > -1) {
		$node_qbookValue = $elements->item($i); 
		$i--; 
		
		$val = '' ;
		$src_value = $node_qbookValue->attributes->getNamedItem('src_value')->value ;
		if( $map_mkey_value[$src_value] ) {
			$val = $map_mkey_value[$src_value] ;
		}
		
		$new_node = $doc->createCDATASection($val) ;
		$node_qbookValue->parentNode->replaceChild($new_node,$node_qbookValue) ;
	}
	
	$elements = $doc->getElementsByTagName('qbook-table');
	$i = $elements->length - 1;
	while ($i > -1) {
		$node_qbookTable = $elements->item($i); 
		$i--; 
		
		$table_html = paracrm_queries_template_makeTable($table_columns,$table_data) ;
		
		//echo $table_html ;
		$dom_table = new DOMDocument();
		$dom_table->loadHTML( '<?xml encoding="UTF-8"><html>'.$table_html.'</html>' ) ;
		$node_table = $dom_table->getElementsByTagName("table")->item(0);
		
		$table_attr = $dom_table->createAttribute("class") ;
		$table_attr->value = 'invoicewidth tabledonnees' ;
		$node_table->appendChild($table_attr) ;
		
		$node_table = $doc->importNode($node_table,true) ;
		
		$node_qbookTable->parentNode->replaceChild($node_table,$node_qbookTable) ;
	}
	
	$filename = preg_replace("/[^a-zA-Z0-9]/", "",$inv_record['id_inv']).'.pdf' ;
	
	return array('success'=>true, 'html'=>$doc->saveHTML(), 'filename'=>$filename ) ;
}

?>
