<?php

function specBpSales_cde_getRecords( $post_data ) {
	global $_opDB ;
	
	$TAB = array() ;
	
	$forward_post = array() ;
	$forward_post['start'] ;
	$forward_post['limit'] ;
	$forward_post['file_code'] = 'CDE' ;
	if( isset($post_data['filter_cdeFilerecordId_arr']) ) {
		$forward_post['filter'] = json_encode(array(
			array(
				'operator' => 'in',
				'property' => 'CDE_id',
				'value' => json_decode($post_data['filter_cdeFilerecordId_arr'],true)
			)
		)) ;
	}
	$ttmp = paracrm_data_getFileGrid_data( $forward_post, $auth_bypass=TRUE ) ;
	$paracrm_TAB = $ttmp['data'] ;
	foreach( $paracrm_TAB as $paracrm_row ) {
		$row = array() ;
		$row['cde_filerecord_id'] = $paracrm_row['CDE_id'] ;
		$row['cde_ref'] = $paracrm_row['CDE_field_CDE_NO'] ;
		$row['cde_class'] = $paracrm_row['CDE_field_CDE_CLASS'] ;
		$row['mag_link'] = $paracrm_row['CDE_field_MAG_CODE'] ;
		$row['mag_link_txt'] = $paracrm_row['CDE_field_MAG_CODE_entry_MAG_LIB'] ;
		$row['cli_link'] = $paracrm_row['CDE_field_CLI_LINK'] ;
		$row['cli_link_txt'] = $paracrm_row['CDE_field_CLI_LINK_entry_CLI_NAME'] ;
		$row['cli_linktree'] = $paracrm_row['CDE_field_CLI_LINK_tree_CLIGROUP_CODE'] ;
		$row['cli_linktree_txt'] = $paracrm_row['CDE_field_CLI_LINK_tree_CLIGROUP_CODE'] ;
		$row['cli_ref_id'] = $paracrm_row['CDE_field_CLI_REF_ID'] ;
		$row['status_is_ship'] = $paracrm_row['CDE_field_STATUS_IS_SHIP'] ;
		$row['status'] = $paracrm_row['CDE_field_STATUS'] ;
		$row['status_txt'] = $paracrm_row['CDE_field_STATUS_entry_STATUS_TXT'] ;
		$row['status_percent'] = $paracrm_row['CDE_field_STATUS_entry_PERCENT'] ;
		$row['date_dpe'] = substr($paracrm_row['CDE_field_DATE_DPE'],0,10) ;
		$row['date_order'] = substr($paracrm_row['CDE_field_DATE_ORDER'],0,10) ;
		$row['date_ship'] = substr($paracrm_row['CDE_field_DATE_SHIP'],0,10) ;
		
		if( $row['status_percent'] > 50 ) {
			$row['status_color'] = '' ;
		} elseif( $row['status_percent'] == 50 ) {
			$row['status_color'] = 'green' ;
		} else {
			$row['status_color'] = 'red' ;
		}
		
		$row['link_inv_filerecord_id'] = $paracrm_row['CDE_field_LINK_INV_FILE_ID'] ;
		
		$row['ligs'] = array() ;
		
		$TAB[$paracrm_row['filerecord_id']] = $row ;
	}
	$debug = $paracrm_TAB ;
	
	
	
	$forward_post = array() ;
	$forward_post['start'] ;
	$forward_post['limit'] ;
	$forward_post['file_code'] = 'CDE_LIG' ;
	if( isset($post_data['filter_cdeFilerecordId_arr']) ) {
		$forward_post['filter'] = json_encode(array(
			array(
				'operator' => 'in',
				'property' => 'CDE_id',
				'value' => json_decode($post_data['filter_cdeFilerecordId_arr'],true)
			)
		)) ;
	}
	$ttmp = paracrm_data_getFileGrid_data( $forward_post, $auth_bypass=TRUE ) ;
	$paracrm_TAB = $ttmp['data'] ;
	foreach( $paracrm_TAB as $paracrm_row ) {
		$filerecord_parent_id = $paracrm_row['CDE_id'] ;
		
		$row = array() ;
		$row['cdelig_filerecord_id'] = $paracrm_row['CDE_LIG_id'] ;
		$row['status_is_ship'] = $paracrm_row['CDE_field_STATUS_IS_SHIP'] ;
		$row['prod_ref'] = $paracrm_row['CDE_LIG_field_PROD_REF'] ;
		$row['prod_ref_ean'] = $paracrm_row['CDE_LIG_field_PROD_REF_entry_PROD_SKU_EAN'] ;
		$row['prod_ref_txt'] = $paracrm_row['CDE_LIG_field_PROD_REF_entry_PROD_TXT'] ;
		$row['prod_ref_pcb'] = $paracrm_row['CDE_LIG_field_PROD_REF_entry_QTE_SKU'] ;
		$row['spec_batch'] = $paracrm_row['CDE_LIG_field_BATCH_CODE'] ;
		$row['spec_dlc'] = $paracrm_row['CDE_LIG_field_DLC_DATE'] ;
		$row['qty_order'] = $paracrm_row['CDE_LIG_field_QTE_ORDER'] ;
		$row['qty_ship'] = $paracrm_row['CDE_LIG_field_QTE_SHIP'] ;
		$row['obs_txt'] = $paracrm_row['CDE_LIG_field_OBS_TXT'] ;
		$row['inv_mode'] = $paracrm_row['CDE_LIG_field_INV_MODE'] ;
		
		$qte = ( $row['status_is_ship'] ? $row['qty_ship'] : $row['qty_order'] );
		$pcb_pack = $paracrm_row['CDE_LIG_field_PROD_REF_entry_QTE_SKU'] ;
		$eq_ut = $paracrm_row['CDE_LIG_field_PROD_REF_entry_EQ_UT'] ;
		$eq_kg = $paracrm_row['CDE_LIG_field_PROD_REF_entry_EQ_KG'] ;
		$row['calc_count_ut'] = $eq_ut * $qte ;
		$row['calc_count_pack'] = ($pcb_pack > 0 ? $qte / $pcb_pack : 0) ;
		$row['calc_weight_kg'] = $eq_kg * $qte ;
		
		$TAB[$filerecord_parent_id]['ligs'][] = $row ;
	}
	
	foreach( $TAB as $cde_filerecord_id => &$row ) {
		$row['calc_count_ut'] = $row['calc_count_pack'] = $row['calc_weight_kg'] = 0 ;
		foreach( $row['ligs'] as $row_lig ) {
			$row['calc_count_ut'] += $row_lig['calc_count_ut'] ;
			$row['calc_count_pack'] += $row_lig['calc_count_pack'] ;
			$row['calc_weight_kg'] += $row_lig['calc_weight_kg'] ;
		}
	}
	unset($row) ;
	
	
	if( isset($post_data['filter_cdeFilerecordId_arr']) ) {
		$filter_cdeFilerecordId_arr = json_decode($post_data['filter_cdeFilerecordId_arr']) ;
		
		$new_TAB = array() ;
		foreach( $filter_cdeFilerecordId_arr as $cde_filerecord_id ) {
			if( !$TAB[$cde_filerecord_id] ) {
				continue ;
			}
			$new_TAB[$cde_filerecord_id] = $TAB[$cde_filerecord_id] ;
		}
		$TAB = $new_TAB ;
	}
	
	
	$query = "SELECT cde.filerecord_id, inv.field_ID_INV, inv.field_CALC_AMOUNT_NOVAT, inv.field_CALC_AMOUNT_FINAL
				FROM view_file_CDE as cde
				LEFT OUTER JOIN view_file_INV inv ON inv.filerecord_id = cde.field_LINK_INV_FILE_ID
				WHERE inv.filerecord_id IS NOT NULL" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$cde_filerecord_id = $arr[0] ;
		if( !$TAB[$cde_filerecord_id] ) {
			continue ;
		}
		
		$id_inv = $arr[1] ;
		$amount_novat = $arr[2] ;
		$amount_final = $arr[3] ;
		
		$TAB[$cde_filerecord_id]['link_inv_id_inv'] = $id_inv ;
		$TAB[$cde_filerecord_id]['link_inv_calc_amount_novat'] = $amount_novat ;
		$TAB[$cde_filerecord_id]['link_inv_calc_amount_final'] = $amount_final ;
	}
	
	return array('success'=>true, 'data'=>array_values($TAB), 'debug'=>$debug) ;
}

?>
