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
	
	$adrbook = array() ;
	$query = "SELECT adr.* FROM view_file_ADRBOOK adr WHERE adr.field_ACC_ID='{$p_accId}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$adrbook[$arr['filerecord_id']] = array(
			'adrbook_filerecord_id' => $arr['filerecord_id'],
			'adr_entity' => $arr['field_ADR_ENTITY'],
			'adr_entity_name' => $arr['field_ADR_ENTITY_NAME'],
			'adr_entity_obs' => $arr['field_ADR_ENTITY_OBS'],
			'adrbookentries' => array()
		);
	}
	$query = "SELECT adrent.* FROM view_file_ADRBOOK_ENTRY adrent 
				INNER JOIN view_file_ADRBOOK adr ON adr.filerecord_id=adrent.filerecord_parent_id
				WHERE adr.field_ACC_ID='{$p_accId}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		if( !$adrbook[$arr['filerecord_parent_id']] ) {
			continue ;
		}
		$adrbook[$arr['filerecord_parent_id']]['adrbookentries'][] = array(
			'adrbookentry_filerecord_id' => $arr['filerecord_id'],
			'adr_type' => $arr['field_ADR_TYPE'],
			'adr_txt' => $arr['field_ADR_TXT'],
			'status_is_priority' => ($arr['field_STATUS_IS_PRIORITY']==1),
			'status_is_confirm' => ($arr['field_STATUS_IS_CONFIRM']==1),
			'status_is_invalid' => ($arr['field_STATUS_IS_INVALID']==1)
		);
	}
	$account_record += array(
		'adrbook' => array_values($adrbook)
	) ;
	
	
	
	// ************* FILES ****************
	$filter_fileFilerecordId_arr = array() ;
	$query = "SELECT f.filerecord_id FROM view_file_FILE f 
		WHERE field_LINK_ACCOUNT='{$p_accId}'" ;
	if( $p_atrFilter ) {
		foreach( $cfg_atr as $atr_record ) {
			$mkey = $atr_record['bible_code'] ;
			if( $p_atrFilter[$mkey] ) {
				$mvalue = $p_atrFilter[$mkey] ;
				$query.= " AND f.field_{$mkey} IN ".$_opDB->makeSQLlist($mvalue) ;
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
	
	
	
	// ************* RECORDS (non affectés) ****************
	$unalloc_records = array() ;
	$existing_ids = array() ;
	foreach( $account_record['files'] as $accFile_record ) {
		foreach( $accFile_record['records'] as $accFileRecord_record ) {
			$existing_ids[] = $accFileRecord_record['record_filerecord_id'] ;
		}
	}
	$query = "SELECT * FROM view_file_RECORD r
		WHERE field_LINK_ACCOUNT='{$p_accId}'" ;
	if( $p_atrFilter ) {
		/*
		foreach( $cfg_atr as $atr_record ) {
			$mkey = $atr_record['bible_code'] ;
			if( $p_atrFilter[$mkey] ) {
				$mvalue = $p_atrFilter[$mkey] ;
				$query.= " AND f.field_{$mkey} IN ".$_opDB->makeSQLlist($mvalue) ;
			}
		}
		*/
	}
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		if( in_array($arr['filerecord_id'],$existing_ids) ) {
			continue ;
		}
		
		
		$record_row = array(
			'record_filerecord_id' => $arr['filerecord_id'],
			'acc_id' => $arr['field_LINK_ACCOUNT']
		);
		foreach( $cfg_atr as $atr_record ) {
			$mkey = $atr_record['bible_code'] ;
			$record_row[$mkey] = $arr['field_'.$mkey] ;
		}
		$record_row += array(
			'type' => $arr['field_TYPE'],
			'record_id' => $arr['field_RECORD_ID'],
			'acc_id' => $arr['field_LINK_ACCOUNT'],
			'date_record' => $arr['field_DATE_RECORD'],
			'date_value' => $arr['field_DATE_VALUE'],
			'amount' => $arr['field_AMOUNT'],
			'letter_is_on' => ($arr['field_LETTER_IS_ON']==1),
			'letter_code' => $arr['field_LETTER_CODE'],
			'bank_is_alloc' => ($arr['field_BANK_LINK_FILE_ID']>0)
		);
		
		$unalloc_records[] = $record_row ;
	}
	if( $unalloc_records ) {
		$account_record['files'][] = array(
			'file_filerecord_id' => 0,
			
			'id_ref' => 'Unallocated',
			
			'acc_id' => $p_accId,
			
			'records' => $unalloc_records,
			'actions' => array(),
		);
	}
	
	
	
	
	return array(
		'success' => true,
		'data' => $account_record
	) ;
}


function specRsiRecouveo_account_setAdrbook( $post_data ) {
	global $_opDB ;
	
	$p_accId = $post_data['acc_id'] ;
	$p_adrbookRecordData = json_decode($post_data['data'],true) ;
	
	$json = specRsiRecouveo_account_open( array('acc_id'=>$p_accId) ) ;
	if( !$json['success'] ) {
		return array('success'=>false) ;
	}
	$account_record = $json['data'] ;
	
	$file_code = 'ADRBOOK' ;
	$arr_ins = array() ;
	$arr_ins['field_ACC_ID'] = $p_accId ;
	$arr_ins['field_ADR_ENTITY'] = $p_adrbookRecordData['adr_entity'] ;
	$arr_ins['field_ADR_ENTITY_NAME'] = $p_adrbookRecordData['adr_entity_name'] ;
	$arr_ins['field_ADR_ENTITY_OBS'] = $p_adrbookRecordData['adr_entity_obs'] ;
	if( $p_adrbookRecordData['adrbook_filerecord_id'] ) {
		$adrbook_record = NULL ;
		foreach( $account_record['adrbook'] as $iter_adrbook_record ) {
			if( $iter_adrbook_record['adrbook_filerecord_id'] == $p_adrbookRecordData['adrbook_filerecord_id'] ) {
				$adrbook_record = $iter_adrbook_record ;
				break ;
			}
		}
		if( !$adrbook_record ) {
			return array('success'=>false) ;
		}
		$adrbook_filerecord_id = $adrbook_record['adrbook_filerecord_id'] ;
		paracrm_lib_data_updateRecord_file( $file_code, $arr_ins, $adrbook_filerecord_id);
		
		$existing_ids = array() ;
		foreach( $adrbook_record['adrbookentries'] as $adrbook_entry_record ) {
			$existing_ids[] = $adrbook_entry_record['adrbookentry_filerecord_id'] ;
		}
	} else {
		$adrbook_filerecord_id = paracrm_lib_data_insertRecord_file( $file_code, 0, $arr_ins );
		$existing_ids = array() ;
	}
	
	$file_code = 'ADRBOOK_ENTRY' ;
	$new_ids = array() ;
	foreach( $p_adrbookRecordData['adrbookentries'] as $adrbook_entry_record ) {
		$arr_ins = array() ;
		$arr_ins['field_ADR_TYPE'] = $adrbook_entry_record['adr_type'] ;
		$arr_ins['field_ADR_TXT'] = $adrbook_entry_record['adr_txt'] ;
		$arr_ins['field_STATUS_IS_CONFIRM'] = ( $adrbook_entry_record['status_is_confirm'] ? 1 : 0 ) ;
		$arr_ins['field_STATUS_IS_INVALID'] = ( $adrbook_entry_record['status_is_invalid'] ? 1 : 0 ) ;
		if( in_array($adrbook_entry_record['adrbookentry_filerecord_id'], $existing_ids) ) {
			$new_ids[] = $adrbook_entry_record['adrbookentry_filerecord_id'] ;
			paracrm_lib_data_updateRecord_file( $file_code, $arr_ins, $adrbook_entry_record['adrbookentry_filerecord_id']);
		} else {
			$new_ids[] = paracrm_lib_data_insertRecord_file( $file_code, $adrbook_filerecord_id, $arr_ins );
		}
	}
	$to_delete = array_diff($existing_ids,$new_ids) ;
	foreach( $to_delete as $filerecord_id ) {
		paracrm_lib_data_deleteRecord_file( $file_code, $filerecord_id );
	}

	return array('success'=>true) ;
}

function specRsiRecouveo_account_setAdrbookPriority( $post_data ) {
	global $_opDB ;
	
	$p_accId = $post_data['acc_id'] ;
	$p_adrType = $post_data['adr_type'] ;
	$p_adrbookFilerecordId = $post_data['adrbook_filerecord_id'] ;
	
	$query = "UPDATE view_file_ADRBOOK_ENTRY ae, view_file_ADRBOOK a
				SET ae.field_STATUS_IS_PRIORITY = IF( ae.filerecord_id='{$p_adrbookFilerecordId}', '1','0')
				WHERE ae.filerecord_parent_id=a.filerecord_id AND a.field_ACC_ID='{$p_accId}' AND ae.field_ADR_TYPE='{$p_adrType}'";
	$_opDB->query($query) ;
	
	return array('success'=>true) ;
}

?>
