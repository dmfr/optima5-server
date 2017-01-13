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
		'acc_siret' => $arr['field_ACC_SIRET']
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
		'adr_postal' => array(),
		'adr_tel' => array()
	) ;
	$query = "SELECT ap.* FROM view_file_ADR_POSTAL ap WHERE ap.field_ACC_ID='{$p_accId}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$account_record['adr_postal'][] = array(
			'adrpostal_filerecord_id' => $arr['filerecord_id'],
			'adr_name' => $arr['field_ADR_NAME'],
			'adr_postal_txt' => $arr['field_ADR_POSTAL'],
			'status' => ($arr['field_STATUS']==1)
		);
	}
	$query = "SELECT at.* FROM view_file_ADR_TEL at WHERE at.field_ACC_ID='{$p_accId}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$account_record['adr_tel'][] = array(
			'adrtel_filerecord_id' => $arr['filerecord_id'],
			'adr_name' => $arr['field_ADR_NAME'],
			'adr_tel_txt' => $arr['field_ADR_TEL'],
			'status' => ($arr['field_STATUS']==1)
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

?>
