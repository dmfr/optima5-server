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
	$curDateYMD = date('Y-m-d') ;
	
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_action_eta = $ttmp['data']['cfg_action_eta'] ;
	$cfg_atr = $ttmp['data']['cfg_atr'] ;
	//print_r($cfg_atr) ;
	unset($atr_record) ;
	
	global $_opDB ;
	
	$p_accId = $post_data['acc_id'] ;
	$p_atrFilter = ( $post_data['filter_atr'] ? json_decode($post_data['filter_atr'],true) : null ) ;
	
	$query = "SELECT la.*, lat.field_SOC_ID, lat.field_SOC_NAME" ;
	$query.= " FROM view_bible_LIB_ACCOUNT_entry la" ;
	$query.= " JOIN view_bible_LIB_ACCOUNT_tree lat ON lat.treenode_key = la.treenode_key" ;
	$query.= " WHERE la.entry_key='{$p_accId}'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return array('success'=>false) ;
	}
	$arr = $_opDB->fetch_assoc($result) ;
	$account_record = array(
		'soc_id' => $arr['field_SOC_ID'],
		'soc_txt' => $arr['field_SOC_NAME'],
		'acc_id' => $arr['field_ACC_ID'],
		'acc_ref' => (
			strpos($arr['field_ACC_ID'],$arr['field_SOC_ID'].'-')===0 
			?
			substr($arr['field_ACC_ID'],strlen($arr['field_SOC_ID'].'-'))
			:
			$arr['field_ACC_ID']
		),
		'acc_txt' => $arr['field_ACC_NAME'],
		'acc_siret' => $arr['field_ACC_SIRET'],
		'adr_postal' => $arr['field_ADR_POSTAL'],
		'link_user' => $arr['field_LINK_USER_LOCAL'],
		
		'similar' => array()
	);
	foreach( $cfg_atr as $atr_record ) {
		if( $atr_record['atr_type'] == 'account' ) {
			$mkey = $atr_record['atr_field'] ;
			$account_record[$mkey] = $arr['field_'.$mkey] ;
		}
	}
	
	if( $post_data['_similar'] ) {
		$query = "SELECT la.* FROM view_bible_LIB_ACCOUNT_entry la WHERE la.entry_key LIKE '%\-{$account_record['acc_ref']}' AND la.entry_key<>'{$p_accId}'" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
			$account_record['similar'][] = array(
				'soc_id' => $arr['field_SOC_ID'],
				'soc_txt' => $arr['field_SOC_NAME'],
				'acc_id' => $arr['field_ACC_ID'],
				'acc_ref' => (
					strpos($arr['field_ACC_ID'],$arr['field_SOC_ID'].'-')===0 
					?
					substr($arr['field_ACC_ID'],strlen($arr['field_SOC_ID'].'-'))
					:
					$arr['field_ACC_ID']
				),
				'acc_txt' => $arr['field_ACC_NAME']
			);
		}
	}
	
	$adrbook = array() ;
	$query = "SELECT adr.* FROM view_file_ADRBOOK adr WHERE adr.field_ACC_ID='{$p_accId}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$adrbook[$arr['filerecord_id']] = array(
			'adrbook_filerecord_id' => $arr['filerecord_id'],
			'adr_entity' => $arr['field_ADR_ENTITY'],
			//'adr_entity_name' => $arr['field_ADR_ENTITY_NAME'],
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
	
	
	// ************* Extract default adr ***********
	foreach( $adrbook as $adrbook_row ) {
		foreach( $adrbook_row['adrbookentries'] as $adrbookentry_row ) {
			if( ($adrbookentry_row['adr_type']=='POSTAL') && $adrbookentry_row['status_is_priority'] ) {
				$account_record['adr_postal'] = $adrbookentry_row['adr_txt'] ;
			}
		}
	}
	
	
	// ************* FILES ****************
	$filter_fileFilerecordId_arr = array() ;
	$query = "SELECT f.filerecord_id FROM view_file_FILE f 
		WHERE field_LINK_ACCOUNT='{$p_accId}'" ;
	if( $p_atrFilter ) {
		// TODO : record-level filters
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
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$filter_fileFilerecordId_arr[] = $arr[0] ;
	}
	
	$forward_post = array() ;
	$forward_post['filter_fileFilerecordId_arr'] = json_encode($filter_fileFilerecordId_arr) ;
	if( $post_data['filter_archiveIsOff'] ) {
		$forward_post['filter_archiveIsOff'] = true ;
	}
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
	$query = "SELECT r.* FROM view_file_RECORD r
		LEFT OUTER JOIN view_file_RECORD_LINK rl ON rl.filerecord_parent_id=r.filerecord_id AND rl.field_LINK_IS_ON='1'
		WHERE field_LINK_ACCOUNT='{$p_accId}' AND rl.filerecord_id IS NULL" ;
	if( $p_atrFilter ) {
		// TODO : record-level filters
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
			if( $atr_record['atr_type']=='record' ) {
				$mkey = $atr_record['atr_field'] ;
				$record_row[$mkey] = $arr['field_'.$mkey] ;
			}
		}
		$record_row += array(
			'is_disabled' => $arr['field_IS_DISABLED'],
			'is_pending' => ($curDateYMD < substr($arr['field_DATE_VALUE'],0,10)),
			'type' => $arr['field_TYPE'],
			'type_temprec' => $arr['field_TYPE_TEMPREC'],
			'record_id' => $arr['field_RECORD_ID'],
			'record_ref' => $arr['field_RECORD_REF'],
			'acc_id' => $arr['field_LINK_ACCOUNT'],
			'date_load' => $arr['field_DATE_LOAD'],
			'date_record' => $arr['field_DATE_RECORD'],
			'date_value' => $arr['field_DATE_VALUE'],
			'amount' => $arr['field_AMOUNT'],
			'xe_currency_amount' => $arr['field_XE_CURRENCY_AMOUNT'],
			'xe_currency_sign' => $arr['field_XE_CURRENCY_SIGN'],
			'xe_currency_code' => $arr['field_XE_CURRENCY_CODE'],
			'letter_is_on' => ($arr['field_LETTER_IS_ON']==1),
			'letter_code' => $arr['field_LETTER_CODE'],
			'bank_is_alloc' => ($arr['field_BANK_LINK_FILE_ID']>0),
			'notification_is_on' => false
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
	
	
	
	// ************ Notifications: 28/12/2018 ***************
	$notification_rows = array() ;
	$notification_recordFilerecordIds = array() ;
	$notification_fileactionFilerecordIds = array() ;
	$query = "SELECT n.filerecord_id as notification_filerecord_id, n.field_DATE_NOTIFICATION as date_notification, n.field_TXT_NOTIFICATION as txt_notification
				FROM view_file_NOTIFICATION n
				WHERE field_LINK_ACCOUNT='{$p_accId}' AND field_ACTIVE_IS_ON='1'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$notification_filerecord_id = $arr['notification_filerecord_id'] ;
		if( !$notification_rows[$notification_filerecord_id] ) {
			$notification_rows[$notification_filerecord_id] = array(
				'notification_filerecord_id' => $arr['notification_filerecord_id'],
				'date_notification' => date('Y-m-d',strtotime($arr['date_notification'])),
				'txt_notification' => $arr['txt_notification']
			);
		}
		
		$query = "SELECT field_LINK_RECORD_ID FROM view_file_NOTIFICATION_RECORD WHERE filerecord_parent_id='{$notification_filerecord_id}'" ;
		$res2 = $_opDB->query($query) ;
		while( ($arr2 = $_opDB->fetch_row($res2)) != FALSE ) {
			$notification_recordFilerecordIds[] = $arr2[0] ;
		}
		
		$query = "SELECT field_LINK_FILEACTION_ID FROM view_file_NOTIFICATION_FILEACTION WHERE filerecord_parent_id='{$notification_filerecord_id}'" ;
		$res2 = $_opDB->query($query) ;
		while( ($arr2 = $_opDB->fetch_row($res2)) != FALSE ) {
			$notification_fileactionFilerecordIds[] = $arr2[0] ;
		}
	}
	$account_record['notifications'] = array_values($notification_rows) ;
	
	foreach( $account_record['files'] as &$file_row ) {
		foreach( $file_row['actions'] as &$fileaction_row ) {
			if( in_array($fileaction_row['fileaction_filerecord_id'],$notification_fileactionFilerecordIds) ) {
				$fileaction_row['notification_is_on'] = true ;
			}
		}
		unset($fileaction_row) ;
		foreach( $file_row['records'] as &$record_row ) {
			if( in_array($record_row['record_filerecord_id'],$notification_recordFilerecordIds) ) {
				$record_row['notification_is_on'] = true ;
			}
		}
		unset($record_row) ;
	}
	unset($file_row) ;
	
	
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
	//$arr_ins['field_ADR_ENTITY_NAME'] = $p_adrbookRecordData['adr_entity_name'] ;
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
	
	specRsiRecouveo_account_lib_checkAdrStatus($p_accId) ;

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




function specRsiRecouveo_account_lib_checkAdrStatus( $acc_id ) {
	global $_opDB ;
	
	
	$query = "UPDATE view_file_ADRBOOK_ENTRY ae
			JOIN view_file_ADRBOOK a ON a.filerecord_id=ae.filerecord_parent_id
			SET ae.field_STATUS_IS_PRIORITY='0'
			WHERE a.field_ACC_ID='{$acc_id}' AND ae.field_STATUS_IS_INVALID='1'" ;
	$_opDB->query($query) ;
	
	
	$ttmp = specRsiRecouveo_account_open(array('acc_id'=>$acc_id)) ;
	$account_record = $ttmp['data'] ;
	if( !$account_record ) {
		return ;
	}
	
	$map_adrType_ids = array() ;
	foreach($account_record['adrbook'] as $accAdrbook_record ) {
		foreach( $accAdrbook_record['adrbookentries'] as $accAdrbookEntry_record ) {
			$adr_type = $accAdrbookEntry_record['adr_type'] ;
			if( $map_adrType_ids[$adr_type]===FALSE ) {
				continue ;
			}
			if( $accAdrbookEntry_record['status_is_priority'] ) {
				$map_adrType_ids[$adr_type] = FALSE ;
				continue ;
			}
			if( $accAdrbookEntry_record['status_is_invalid'] ) {
				continue ;
			}
			if( !isset($map_adrType_ids[$adr_type]) ) {
				$map_adrType_ids[$adr_type] = array() ;
			}
			$map_adrType_ids[$adr_type][] = $accAdrbookEntry_record['adrbookentry_filerecord_id'] ;
		}
	}
	$newPrio_adrbookentryFilerecordIds = array() ;
	foreach( $map_adrType_ids as $adr_type => $ids ) {
		if( !is_array($ids) ) {
			continue ;
		}
		rsort($ids) ;
		$adrbookentry_filerecord_id = reset($ids) ;
		$newPrio_adrbookentryFilerecordIds[] = $adrbookentry_filerecord_id ;
		
		$arr_update = array() ;
		$arr_update['field_STATUS_IS_PRIORITY'] = 1 ;
		paracrm_lib_data_updateRecord_file( 'ADRBOOK_ENTRY', $arr_update, $adrbookentry_filerecord_id);
	}
	
	
	// 04/01/2019 : moved from OLD:specRsiRecouveo_lib_autorun_checkAdrStatus 
	
	$required_statuses = array('S1_OPEN','S1_SEARCH') ;
	
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$avail_statuses = array() ;
	foreach( $ttmp['data']['cfg_status'] as $status ) {
		$avail_statuses[] = $status['status_id'] ;
	}
	if( count(array_intersect($avail_statuses,$required_statuses)) != count($required_statuses) ) {
		return ;
	}
	
	$has_priority = FALSE ;
	foreach($account_record['adrbook'] as $accAdrbook_record ) {
		foreach( $accAdrbook_record['adrbookentries'] as $accAdrbookEntry_record ) {
			$adr_type = $accAdrbookEntry_record['adr_type'] ;
			if( !in_array($adr_type,array('POSTAL','TEL')) ) {
				continue ;
			}
			if( $accAdrbookEntry_record['status_is_priority'] || in_array($accAdrbookEntry_record['adrbookentry_filerecord_id'],$newPrio_adrbookentryFilerecordIds) ) {
				$has_priority = TRUE ;
			}
		}
	}
	
	if( !$has_priority ) {
		//mise en recherche
		$src_status = 'S1_OPEN' ;
		$dst_status = 'S1_SEARCH' ;
	}
	if( $has_priority ) {
		//sortie recherche
		$src_status = 'S1_SEARCH' ;
		$dst_status = 'S1_OPEN' ;
	}
	$query = "UPDATE view_file_FILE f SET field_STATUS='{$dst_status}' 
		WHERE f.field_LINK_ACCOUNT='{$acc_id}' AND f.field_STATUS_CLOSED_VOID='0' AND f.field_STATUS_CLOSED_END='0' AND field_STATUS='{$src_status}'" ;
	$_opDB->query($query) ;
	
	if( !$has_priority ) {
		$query = "UPDATE view_file_FILE_ACTION fa
						JOIN view_file_FILE f ON f.filerecord_id=fa.filerecord_parent_id
						SET field_LINK_STATUS='S1_SEARCH'
						, field_LINK_ACTION='BUMP'
						, field_SCENSTEP_TAG=''
						, field_DATE_SCHED=IF( field_DATE_SCHED>DATE(NOW()) , DATE(NOW()) , field_DATE_SCHED )
						, field_LINK_TXT='Recherche coordonnées'
						, field_LINK_TPL=''
						WHERE f.field_LINK_ACCOUNT='{$acc_id}' AND f.field_STATUS_CLOSED_VOID='0' AND f.field_STATUS_CLOSED_END='0' AND f.field_STATUS='S1_SEARCH'
						AND fa.field_STATUS_IS_OK='0'" ;
		$_opDB->query($query) ;
	} 
	if( $has_priority ) {
		$query = "SELECT f.filerecord_id AS file_filerecord_id, fa.filerecord_id AS fileaction_filerecord_id
					FROM view_file_FILE_ACTION fa
					JOIN view_file_FILE f ON f.filerecord_id=fa.filerecord_parent_id
					WHERE f.field_STATUS='S1_OPEN' AND f.field_LINK_ACCOUNT='{$acc_id}' AND f.field_STATUS_CLOSED_VOID='0' AND f.field_STATUS_CLOSED_END='0'
					AND fa.field_LINK_STATUS='S1_SEARCH' AND fa.field_LINK_ACTION='BUMP' AND fa.field_STATUS_IS_OK='0'" ;
		$result = $_opDB->query($query) ;
		$arr = $_opDB->fetch_assoc($result) ;
		if( $arr ) {
			$file_filerecord_id = $arr['file_filerecord_id'] ;
			$fileaction_filerecord_id = $arr['fileaction_filerecord_id'] ;
			
			$forward_post = array() ;
			$forward_post['fileaction_filerecord_id'] = $fileaction_filerecord_id;
			$forward_post['link_status'] = 'S1_OPEN' ;
			$forward_post['link_action'] = 'BUMP' ;
			
			// next action ?
			$json = specRsiRecouveo_file_getScenarioLine( array(
				'file_filerecord_id' => $file_filerecord_id,
				'fileaction_filerecord_id' => $fileaction_filerecord_id
			)) ;
			if( $json['success'] ) {
				foreach( $json['data'] as $scenline_dot ) {
					if( $scenline_dot['is_next'] ) {
						$forward_post['next_action'] = $scenline_dot['link_action'] ;
						$forward_post['next_scenstep_code'] = $scenline_dot['scenstep_code'] ;
						$forward_post['next_scenstep_tag'] = $scenline_dot['scenstep_tag'] ;
						$forward_post['next_date'] = $scenline_dot['date_sched'] ;
					}
				}
				
				$post_data = array(
					'file_filerecord_id' => $file_filerecord_id,
					'data' => json_encode($forward_post)
				);
				specRsiRecouveo_action_doFileAction($post_data) ;
			}
		}
	}
}








function specRsiRecouveo_account_getAllAtrs($post_data) {
	global $_opDB ;
	
	$atr_field = $post_data['atr_field'] ;
	
	$data = array() ;
	$query = "SELECT distinct field_{$atr_field} as atr_value FROM view_bible_LIB_ACCOUNT_entry ORDER BY atr_value" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$data[] = array('atr_value'=>$arr[0]) ;
	}


	return array('success'=>true, 'data'=>$data) ;
}




function specRsiRecouveo_account_saveHeader( $post_data ) {
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_atr = $ttmp['data']['cfg_atr'] ;
	
	$p_accId = $post_data['acc_id'] ;
	$p_data = json_decode($post_data['data'],true) ;
	
	$entry_key = $p_accId ;
	$arr_update = array() ;
	$arr_update['field_ACC_ID'] = $entry_key ;
	$arr_update['field_LINK_USER_LOCAL'] = $p_data['link_user'] ;
	foreach( $cfg_atr as $atr_record ) {
		if( $atr_record['atr_type'] == 'account' ) {
			$mkey = $atr_record['atr_field'] ;
			$arr_update['field_'.$mkey] = $p_data[$mkey] ;
		}
	}
	
	global $_opDB ;
	
	paracrm_lib_data_updateRecord_bibleEntry('LIB_ACCOUNT',$entry_key,$arr_update) ;
	
	return array('success'=>true) ;
}

function specRsiRecouveo_account_clearNotifications($post_data) {
	$p_accId = $post_data['acc_id'] ;
	
	global $_opDB ;
	$query = "UPDATE view_file_NOTIFICATION SET field_ACTIVE_IS_ON='0' WHERE field_LINK_ACCOUNT='{$p_accId}'" ;
	$_opDB->query($query) ;
	
	return array('success'=>true) ;
}
function specRsiRecouveo_account_pushNotificationRecords( $post_data ) {
	global $_opDB ;
	
	$p_accId = $post_data['acc_id'] ;
	$p_txtNotification = $post_data['txt_notification'] ;
	$p_recordFilerecordIds = json_decode($post_data['arr_recordFilerecordIds'],true) ;
	
	// doublon ?
	$new_recordFilerecordIds = array() ;
	foreach( $p_recordFilerecordIds as $record_filerecord_id ) {
		$query = "SELECT filerecord_id FROM view_file_NOTIFICATION_RECORD WHERE field_LINK_RECORD_ID='{$record_filerecord_id}'" ;
		if( $_opDB->query_uniqueValue($query)>0 ) {
			continue ;
		}
		$new_recordFilerecordIds[] = $record_filerecord_id ;
	}
	$p_recordFilerecordIds = $new_recordFilerecordIds ;
	
	$arr_ins = array() ;
	$arr_ins['field_LINK_ACCOUNT'] = $p_accId ;
	$arr_ins['field_DATE_NOTIFICATION'] = date('Y-m-d H:i:s') ;
	$arr_ins['field_TXT_NOTIFICATION'] = $p_txtNotification ;
	$arr_ins['field_ACTIVE_IS_ON'] = 1 ;
	$notification_filerecord_id = paracrm_lib_data_insertRecord_file( 'NOTIFICATION', 0, $arr_ins );
	
	foreach( $p_recordFilerecordIds as $record_filerecord_id ) {
		$arr_ins = array() ;
		$arr_ins['field_LINK_RECORD_ID'] = $record_filerecord_id ;
		paracrm_lib_data_insertRecord_file( 'NOTIFICATION_RECORD', $notification_filerecord_id, $arr_ins );
	}

	return array('success'=>true) ;
}
function specRsiRecouveo_account_pushNotificationFileaction( $post_data ) {
	global $_opDB ;
	
	$p_accId = $post_data['acc_id'] ;
	$p_txtNotification = $post_data['txt_notification'] ;
	$p_fileactionFilerecordId = $post_data['fileactionFilerecordId'] ;
	
	// doublon ?
	$query = "SELECT filerecord_id FROM view_file_NOTIFICATION_FILEACTION WHERE field_LINK_FILEACTION_ID='{$p_fileactionFilerecordId}'" ;
	if( $_opDB->query_uniqueValue($query)>0 ) {
		return array('success'=>true) ;
	}
	
	$arr_ins = array() ;
	$arr_ins['field_LINK_ACCOUNT'] = $p_accId ;
	$arr_ins['field_DATE_NOTIFICATION'] = date('Y-m-d H:i:s') ;
	$arr_ins['field_TXT_NOTIFICATION'] = $p_txtNotification ;
	$arr_ins['field_ACTIVE_IS_ON'] = 1 ;
	$notification_filerecord_id = paracrm_lib_data_insertRecord_file( 'NOTIFICATION', 0, $arr_ins );
	
	$arr_ins = array() ;
	$arr_ins['field_LINK_FILEACTION_ID'] = $p_fileactionFilerecordId ;
	paracrm_lib_data_insertRecord_file( 'NOTIFICATION_FILEACTION', $notification_filerecord_id, $arr_ins );

	return array('success'=>true) ;
}

?>
