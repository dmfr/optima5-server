<?php

function specRsiRecouveo_account_open( $post_data ) {
	/*
	- Load account
	- Load files for account + filter
	- Load records for account + filter
	- Resolve attachments
	- Returns :
	   x account data + available ATRs
	   xx files > active records > links
	           > actions
	   xx records > links
	*/
	
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_action_eta = $ttmp['data']['cfg_action_eta'] ;
	$cfg_atr = $ttmp['data']['cfg_atr'] ;
	//print_r($cfg_atr) ;
	unset($atr_record) ;
	
	global $_opDB ;
	
	$p_accId = $post_data['acc_id'] ;
	$p_atrFilter = ( $post_data['filter_atr'] ? json_decode($post_data['filter_atr'],true) : null ) ;
	
	$query = "SELECT * FROM view_bible_LIB_ACCOUNT_entry WHERE entry_key='{$p_accId}'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return array('success'=>false) ;
	}
	$arr = $_opDB->fetch_assoc($result) ;
	$account_record = array(
		'acc_id' => $arr['field_ACC_ID'],
		'acc_txt' => $arr['field_ACC_NAME'],
		'acc_siret' => $arr['field_ACC_SIRET'],
		'adr_postal' => $arr['field_ADR_POSTAL']
	);
	foreach( $cfg_atr as $atr_record ) {
		$mkey = $atr_record['bible_code'] ;
		$account_record[$mkey] = array() ;
		$query = "SELECT distinct field_{$mkey} FROM view_file_RECORD WHERE field_LINK_ACCOUNT='{$p_accId}'" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$account_record[$mkey][] = $arr[0] ;
		}
	}
	
	$account_record += array(
		'adrbook' => array()
	) ;
	$query = "SELECT adr.* FROM view_file_ADRBOOK adr WHERE adr.field_ACC_ID='{$p_accId}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$account_record['adrbook'][] = array(
			'adrbook_filerecord_id' => $arr['filerecord_id'],
			'adr_entity' => $arr['field_ADR_ENTITY'],
			'adr_type' => $arr['field_ADR_TYPE'],
			'adr_txt' => $arr['field_ADR_TXT'],
			'status_is_confirm' => ($arr['field_STATUS_IS_CONFIRM']==1),
			'status_is_invalid' => ($arr['field_STATUS_IS_INVALID']==1)
		);
	}
	
	
	
	// ************* FILES ****************
	$filter_fileFilerecordId_arr = array() ;
	$query = "SELECT f.filerecord_id FROM view_file_FILE f 
		WHERE field_LINK_ACCOUNT='{$p_accId}'" ;
	if( $p_atrFilter ) {
		foreach( $cfg_atr as $atr_record ) {
			$mkey = $atr_record['bible_code'] ;
			if( $p_atrFilter[$mkey] ) {
				$mvalue = $p_atrFilter[$mkey] ;
				$query.= " AND f.field_{$mkey} = '$mvalue'" ;
			}
		}
	}
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$filter_fileFilerecordId_arr[] = $arr[0] ;
	}
	
	$forward_post = array() ;
	$forward_post['filter_fileFilerecordId_arr'] = json_encode($filter_fileFilerecordId_arr) ;
	$json = specRsiRecouveo_file_getRecords($forward_post) ;
	// print_r($json['data']) ;
	$account_record['files'] = $json['data'] ;
	
	
	
	// ************* RECORDS ****************
	
	
	
	
	return array(
		'success' => true,
		'data' => $account_record
	) ;
}


function specRsiRecouveo_account_setAdrbook( $post_data ) {
	global $_opDB ;
	
	$p_accId = $post_data['acc_id'] ;
	$p_adrbookData = json_decode($post_data['data'],true) ;
	
	$json = specRsiRecouveo_account_open( array('acc_id'=>$p_accId) ) ;
	if( !$json['success'] ) {
		return array('success'=>false) ;
	}
	$account_record = $json['data'] ;
	
	
	$file_code = 'ADRBOOK' ;
	$existing_ids = array() ;
	foreach( $account_record['adrbook'] as $adrbook_record ) {
		$existing_ids[] = $adrbook_record['adrbook_filerecord_id'] ;
	}
	$new_ids = array() ;
	foreach( $p_adrbookData as $adrbook_record ) {
		$arr_ins = array() ;
		$arr_ins['field_ACC_ID'] = $p_accId ;
		$arr_ins['field_ADR_ENTITY'] = $adrbook_record['adr_entity'] ;
		$arr_ins['field_ADR_TYPE'] = $adrbook_record['adr_type'] ;
		$arr_ins['field_ADR_TXT'] = $adrbook_record['adr_txt'] ;
		$arr_ins['field_STATUS_IS_CONFIRM'] = ( $adrbook_record['status_is_confirm'] ? 1 : 0 ) ;
		$arr_ins['field_STATUS_IS_INVALID'] = ( $adrbook_record['status_is_invalid'] ? 1 : 0 ) ;
		if( in_array($adrbook_record['adrbook_filerecord_id'], $existing_ids) ) {
			$new_ids[] = $adrbook_record['adrbook_filerecord_id'] ;
			paracrm_lib_data_updateRecord_file( $file_code, $arr_ins, $adrbook_record['adrbook_filerecord_id']);
		} else {
			$new_ids[] = paracrm_lib_data_insertRecord_file( $file_code, 0, $arr_ins );
		}
	}
	$to_delete = array_diff($existing_ids,$new_ids) ;
	foreach( $to_delete as $filerecord_id ) {
		paracrm_lib_data_deleteRecord_file( $file_code, $filerecord_id );
	}

	return array('success'=>true) ;
}

?>
