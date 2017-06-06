<?php

function specRsiRecouveo_file_getRecords( $post_data ) {
	global $_opDB ;
	
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_action = $ttmp['data']['cfg_action'] ;
	$cfg_action_eta = $ttmp['data']['cfg_action_eta'] ;
	$cfg_balage = $ttmp['data']['cfg_balage'] ;
	$cfg_atr = $ttmp['data']['cfg_atr'] ;
	//print_r($cfg_atr) ;
	foreach( $cfg_atr as &$atr_record ) {
		$map_id_text = array() ;
		foreach( $atr_record['records'] as $rec ) {
			$map_id_text[$rec['id']] = substr($rec['text'],strlen($rec['id'])+2) ;
		}
		$atr_record['map_id_text'] = $map_id_text ;
	}
	unset($atr_record) ;
	
	$map_action = array() ;
	foreach( $cfg_action as $action ) {
		$map_action[$action['action_id']] = $action ;
	}
	
	if( $post_data['filter_atr'] ) {
		$filter_atr = json_decode($post_data['filter_atr'],true) ;
	}
	if( $post_data['filter_fileFilerecordId_arr'] ) {
		$_load_details = true ;
		$filter_fileFilerecordId_list = $_opDB->makeSQLlist( json_decode($post_data['filter_fileFilerecordId_arr'],true) ) ;
	}
	if( $post_data['filter_archiveIsOn'] ) {
		$filter_archiveIsOn = ( $post_data['filter_archiveIsOn'] ? true : false ) ;
	}
	
	$TAB_files = array() ;
	
	$query = "SELECT f.*, la.field_ACC_NAME, la.field_ACC_SIRET FROM view_file_FILE f" ;
	$query.= " JOIN view_bible_LIB_ACCOUNT_entry la ON la.entry_key = f.field_LINK_ACCOUNT" ;
	$query.= " WHERE 1" ;
	if( isset($filter_fileFilerecordId_list) ) {
		$query.= " AND f.filerecord_id IN {$filter_fileFilerecordId_list}" ;
	} else {
		if( $filter_atr ) {
			foreach( $cfg_atr as $atr_record ) {
				$mkey = $atr_record['bible_code'] ;
				if( $filter_atr[$mkey] ) {
					$mvalue = $filter_atr[$mkey] ;
					$query.= " AND f.field_{$mkey} IN ".$_opDB->makeSQLlist($mvalue) ;
				}
			}
		}
		if( !$filter_archiveIsOn ) {
			$query.= " AND f.field_STATUS_CLOSED='0'" ;
		}
	}
	$query.= " ORDER BY f.filerecord_id DESC" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$record = array(
			'file_filerecord_id' => $arr['filerecord_id'],
			
			'id_ref' => $arr['field_FILE_ID'],
			
			'acc_id' => $arr['field_LINK_ACCOUNT'],
			'acc_txt' => $arr['field_ACC_NAME'],
			'acc_siret' => $arr['field_ACC_SIRET'],
			
			'status' => $arr['field_STATUS'],
			'status_closed' => ($arr['field_STATUS_CLOSED']==1),
			
			'date_open' => $arr['field_DATE_OPEN'],
			'date_last' => $arr['field_DATE_LAST'],
			
			'scen_code' => $arr['field_SCENARIO'],
			
			'records' => array(),
			'actions' => array(),
			
			'from_file_filerecord_id' => $arr['field_FROM_FILE_ID']
		);
		foreach( $cfg_atr as $atr_record ) {
			$mkey = $atr_record['bible_code'] ;
			$record[$mkey] = $arr['field_'.$mkey] ;
			$record[$mkey.'_text'] = $atr_record['map_id_text'][$arr['field_'.$mkey]] ;
		}
		
		$TAB_files[$arr['filerecord_id']] = $record ;
	}
	
	
	$query = "SELECT fa.* FROM view_file_FILE_ACTION fa" ;
	$query.= " JOIN view_file_FILE f ON f.filerecord_id=fa.filerecord_parent_id" ;
	$query.= " WHERE 1" ;
	if( isset($filter_fileFilerecordId_list) ) {
		$query.= " AND f.filerecord_id IN {$filter_fileFilerecordId_list}" ;
	} else {
		if( $filter_atr ) {
			foreach( $cfg_atr as $atr_record ) {
				$mkey = $atr_record['bible_code'] ;
				if( $filter_atr[$mkey] ) {
					$mvalue = $filter_atr[$mkey] ;
					$query.= " AND f.field_{$mkey} IN ".$_opDB->makeSQLlist($mvalue) ;
				}
			}
		}
		if( !$filter_archiveIsOn ) {
			$query.= " AND f.field_STATUS_CLOSED='0'" ;
		}
	}
	$query. " ORDER BY fa.filerecord_id ASC" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		if( !isset($TAB_files[$arr['filerecord_parent_id']]) ) {
			continue ;
		}
		$TAB_files[$arr['filerecord_parent_id']]['actions'][] = array(
			'fileaction_filerecord_id' => $arr['filerecord_id'],
			'link_status' => $arr['field_LINK_STATUS'],
			'link_action' => $arr['field_LINK_ACTION'],
			'status_is_ok' => ($arr['field_STATUS_IS_OK']==1),
			'date_sched' => (specRsiRecouveo_file_tool_isDateValid($arr['field_DATE_SCHED']) ? $arr['field_DATE_SCHED'] : null),
			'date_actual' => (specRsiRecouveo_file_tool_isDateValid($arr['field_DATE_ACTUAL']) ? $arr['field_DATE_ACTUAL'] : null),
			'txt' => $arr['field_TXT'],
			
			'scenstep_code' => $arr['field_LINK_SCENARIO'],
			'scenstep_tag' => $arr['field_SCENSTEP_TAG'],
			
			'link_newfile_filerecord_id' => ($arr['field_LINK_NEW_FILE_ID'] > 0 ? $arr['field_LINK_NEW_FILE_ID'] : null),
			'link_env_filerecord_id' => ($arr['field_LINK_ENV_ID'] > 0 ? $arr['field_LINK_ENV_ID'] : null),
			
			'link_tpl' => $arr['field_LINK_TPL'],
			'link_litig' => $arr['field_LINK_LITIG'],
			'link_close' => $arr['field_LINK_CLOSE']
		);
	}
	
	
	$query = "SELECT f.filerecord_id AS file_filerecord_id, r.*" ;
	$query.= " FROM view_file_FILE f" ;
	$query.= " JOIN view_file_RECORD_LINK rl ON rl.field_LINK_FILE_ID=f.filerecord_id AND rl.field_LINK_IS_ON='1'" ;
	$query.= " JOIN view_file_RECORD r ON r.filerecord_id=rl.filerecord_parent_id" ;
	if( isset($filter_fileFilerecordId_list) ) {
		$query.= " AND f.filerecord_id IN {$filter_fileFilerecordId_list}" ;
	} else {
		if( $filter_atr ) {
			foreach( $cfg_atr as $atr_record ) {
				$mkey = $atr_record['bible_code'] ;
				if( $filter_atr[$mkey] ) {
					$mvalue = $filter_atr[$mkey] ;
					$query.= " AND f.field_{$mkey} IN ".$_opDB->makeSQLlist($mvalue) ;
				}
			}
		}
		if( !$filter_archiveIsOn ) {
			$query.= " AND f.field_STATUS_CLOSED='0'" ;
		}
	}
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$file_filerecord_id = $arr['file_filerecord_id'] ;
	
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
			'type_temprec' => $arr['field_TYPE_TEMPREC'],
			'record_id' => $arr['field_RECORD_ID'],
			'acc_id' => $arr['field_LINK_ACCOUNT'],
			'date_record' => $arr['field_DATE_RECORD'],
			'date_value' => $arr['field_DATE_VALUE'],
			'amount' => $arr['field_AMOUNT'],
			'letter_is_on' => ($arr['field_LETTER_IS_ON']==1),
			'letter_code' => $arr['field_LETTER_CODE']
		);
		
		if( !isset($TAB_files[$file_filerecord_id]) ) {
			continue ;
		}
		$TAB_files[$file_filerecord_id]['records'][] = $record_row ;
	}
	
	$map_etaRange_maxDays = array() ;
	foreach( $cfg_action_eta as $row ) {
		$map_etaRange_maxDays[$row['eta_range']] = $row['upto_days'] ;
	}
	asort($map_etaRange_maxDays) ;
	$map_balageSegmt_fromDays = array() ;
	foreach( $cfg_balage as $row ) {
		$map_balageSegmt_fromDays[$row['segmt_id']] = (int)$row['calc_from_days'] ;
	}
	arsort($map_balageSegmt_fromDays) ;
	
	$obj_datetime_now = new DateTime(date('Y-m-d')) ;
	// Calculs sur dossiers (next_action, inv_total)
	foreach( $TAB_files as &$file_row ) {
		$next_action = NULL ;
		$inv_header = array(
			'inv_nb' => 0,
			'inv_amount_due' => 0,
			'inv_amount_total' => 0,
			'inv_balage' => null
		) ;
		
		foreach( $file_row['actions'] as &$action_row ) {
			if( $action_row['status_is_ok'] || !specRsiRecouveo_file_tool_isDateValid($action_row['date_sched']) ) {
				continue ;
			}
			
			// calcul du J+x
			$obj_datetime_sched = new DateTime(substr($action_row['date_sched'],0,10)) ;
			$obj_date_interval = date_diff($obj_datetime_now,$obj_datetime_sched);
			$eta_days = (int)($obj_date_interval->format('%R%a')) ;
				// range
				$eta_range_target = NULL ;
				foreach( $map_etaRange_maxDays as $eta_range => $upto_days ) {
					if( $eta_days < $upto_days ) {
						$eta_range_target = $eta_range ;
						break ;
					}
				}
			$action_row['calc_eta_range'] = $eta_range_target ;
			$action_row['link_action_class'] = $map_action[$action_row['link_action']]['agenda_class'] ;
		}
		unset( $action_row ) ;
		
		foreach( $file_row['actions'] as $action_row ) {
			if( $action_row['status_is_ok'] || !specRsiRecouveo_file_tool_isDateValid($action_row['date_sched']) ) {
				continue ;
			}
			if( !$next_action || $action_row['date_sched'] < $next_action['date_sched'] ) {
				$next_action = $action_row ;
			}
		}
		foreach( $file_row['records'] as $record_row ) {
			if( $record_row['clear_is_on'] ) {
				continue ;
			}
			if( $record_row['amount'] > 0 ) {
				$inv_header['inv_nb']++ ;
				$inv_header['inv_amount_total'] += $record_row['amount'] ;
			}
			$inv_header['inv_amount_due'] += $record_row['amount'] ;
		}
		
		$inv_balage = array() ;
		foreach( $map_balageSegmt_fromDays as $segmt_id => $fromDays ) {
			$inv_balage[$segmt_id] = 0 ;
		}
		foreach( $file_row['records'] as &$record_row ) {
			// calcul du J+x
			$obj_datetime_sched = new DateTime(substr($record_row['date_value'],0,10)) ;
			$obj_date_interval = date_diff($obj_datetime_sched,$obj_datetime_now);
			$eta_days = (int)($obj_date_interval->format('%R%a')) ;
				// range
				$segmt_target = NULL ;
				foreach( $map_balageSegmt_fromDays as $segmt_id => $fromDays ) {
					if( $eta_days >= $fromDays ) {
						$segmt_target = $segmt_id ;
						break ;
					}
				}
			$inv_balage[$segmt_target] += $record_row['amount'] ;
			$record_row['calc_balage_segmt_id'] = $segmt_target ;
		}
		unset($record_row) ;
		$inv_header['inv_balage'] = $inv_balage ;
		
		
		if( $next_action ) {
			switch( $next_action['link_action'] ) {
				case 'MAIL_OUT' :
					$next_action_suffix = $next_action['link_action'].'_'.$next_action['link_tpl'] ;
					break ;
				case 'LITIG_FOLLOW' :
					$next_action_suffix = $next_action['link_action'].'_'.$next_action['link_litig'] ;
					break ;
				case 'CLOSE_ACK' :
					$next_action_suffix = $next_action['link_action'].'_'.$next_action['link_close'] ;
					break ;
				default :
					$next_action_suffix = $next_action['link_action'] ;
					break ;
			}
			$file_row += array(
				'next_fileaction_filerecord_id' => $next_action['fileaction_filerecord_id'],
				'next_action' => $next_action['link_action'],
				'next_action_suffix' => $next_action_suffix,
				'next_date' => $next_action['date_sched'],
				'next_eta_range' => $next_action['calc_eta_range'],
				'next_agenda_class' => $next_action['link_action_class']
			);
		}
		$file_row += $inv_header ;
	}
	unset($file_row) ;
	
	
	return array('success'=>true, 'data'=>array_values($TAB_files)) ;
}



function specRsiRecouveo_file_searchSuggest( $post_data ) {
	global $_opDB ;
	/*
	* Recherche
	*  - no client
	*  - nom client
	*  - SIRET
	*  - adresse / no tel
	*/
	$filter_atr = array() ;
	if( $post_data['filter_atr'] ) {
		$filter_atr = json_decode($post_data['filter_atr'],true) ;
	}
	
	$sub_query_acc = "SELECT distinct field_LINK_ACCOUNT FROM view_file_FILE WHERE 1" ;
	$sub_query_acc.= " AND field_STATUS_CLOSED='0'" ;
	foreach( $filter_atr as $mkey => $mvalue ) {
		$sub_query_acc.= " AND field_{$mkey} IN ".$_opDB->makeSQLlist($mvalue) ;
	}
	
	$sub_query_files = "SELECT filerecord_id FROM view_file_FILE WHERE 1" ;
	$sub_query_files.= " AND field_STATUS_CLOSED='0'" ;
	foreach( $filter_atr as $mkey => $mvalue ) {
		$sub_query_files.= " AND field_{$mkey} IN ".$_opDB->makeSQLlist($mvalue) ;
	}
	
	$search_txt = $post_data['search_txt'] ;
	if( !trim($search_txt) ) {
		return array('success'=>true, 'data'=>array()) ;
	}
	
	$tab_result = array() ;
	
	$query = "SELECT acc.entry_key FROM view_bible_LIB_ACCOUNT_entry acc
				WHERE acc.entry_key IN ({$sub_query_acc})
				AND acc.entry_key LIKE '%{$search_txt}%'
				LIMIT 10" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$res_value = $arr[0] ;
		
		$idx_start = strpos($res_value,$search_txt) ;
		$idx_end = $idx_start + strlen($search_txt) ;
		
		$res_value = substr($res_value,0,$idx_start).'<b>'.substr($res_value,$idx_start,$idx_end-$idx_start).'</b>'.substr($res_value,$idx_end) ;
		
		$tab_result[] = array(
			'acc_id' => $arr[0],
			'file_filerecord_id' => null,
			'id_ref' => $arr[0],
			'result_property' => 'Acheteur',
			'result_value' => $res_value
		);
	}
	
	$query = "SELECT acc.entry_key, acc.field_ACC_NAME FROM view_bible_LIB_ACCOUNT_entry acc
				WHERE acc.entry_key IN ({$sub_query_acc})
				AND acc.field_ACC_NAME LIKE '%{$search_txt}%'
				LIMIT 10" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$res_value = $arr[1] ;
		
		$idx_start = strpos($res_value,$search_txt) ;
		$idx_end = $idx_start + strlen($search_txt) ;
		
		$res_value = substr($res_value,0,$idx_start).'<b>'.substr($res_value,$idx_start,$idx_end-$idx_start).'</b>'.substr($res_value,$idx_end) ;
		
		$tab_result[] = array(
			'acc_id' => $arr[0],
			'file_filerecord_id' => null,
			'id_ref' => $arr[0],
			'result_property' => 'Acheteur',
			'result_value' => $res_value
		);
	}
	
	$query = "SELECT acc.entry_key, acc.field_ACC_SIRET FROM view_bible_LIB_ACCOUNT_entry acc
				WHERE acc.entry_key IN ({$sub_query_acc})
				AND acc.field_ACC_SIRET LIKE '%{$search_txt}%'
				LIMIT 10" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$res_value = $arr[1] ;
		
		$idx_start = strpos($res_value,$search_txt) ;
		$idx_end = $idx_start + strlen($search_txt) ;
		
		$res_value = substr($res_value,0,$idx_start).'<b>'.substr($res_value,$idx_start,$idx_end-$idx_start).'</b>'.substr($res_value,$idx_end) ;
		
		$tab_result[] = array(
			'acc_id' => $arr[0],
			'file_filerecord_id' => null,
			'id_ref' => $arr[0],
			'result_property' => 'Siret',
			'result_value' => $res_value
		);
	}
	
	$query = "SELECT acc.entry_key, adre.field_ADR_TYPE as adrtype
					, REPLACE(REPLACE(adre.field_ADR_TXT,'.',''),' ','') as searchval 
				FROM view_bible_LIB_ACCOUNT_entry acc
				INNER JOIN view_file_ADRBOOK adr ON adr.field_ACC_ID=acc.entry_key
				INNER JOIN view_file_ADRBOOK_ENTRY adre 
					ON adre.filerecord_parent_id=adr.filerecord_id AND adre.field_STATUS_IS_INVALID='0'
				WHERE acc.entry_key IN ({$sub_query_acc})
				AND REPLACE(REPLACE(adre.field_ADR_TXT,'.',''),' ','') LIKE '%{$search_txt}%'
				LIMIT 10" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$res_value = $arr[2] ;
		
		$idx_start = strpos($res_value,$search_txt) ;
		$idx_end = $idx_start + strlen($search_txt) ;
		
		$res_value = substr($res_value,0,$idx_start).'<b>'.substr($res_value,$idx_start,$idx_end-$idx_start).'</b>'.substr($res_value,$idx_end) ;
		
		switch( $arr[1] ) {
			case 'POSTAL' :
				$adr_type = 'Adresse' ;
				break ;
			case 'TEL' :
				$adr_type = 'Tel' ;
				break ;
			case 'EMAIL' :
				$adr_type = 'Email' ;
				break ;
		}
		
		$tab_result[] = array(
			'acc_id' => $arr[0],
			'file_filerecord_id' => null,
			'id_ref' => $arr[0],
			'result_property' => $adr_type,
			'result_value' => $res_value
		);
	}
	
	$query = "SELECT f.field_LINK_ACCOUNT, f.filerecord_id, f.field_FILE_ID, r.field_RECORD_ID
				FROM view_file_RECORD r, view_file_RECORD_LINK rl, view_file_FILE f
				WHERE r.filerecord_id = rl.filerecord_parent_id
				AND f.filerecord_id = rl.field_LINK_FILE_ID AND rl.field_LINK_IS_ON='1'
				AND f.filerecord_id IN ({$sub_query_files})
				AND r.field_RECORD_ID LIKE '%{$search_txt}%'
				LIMIT 10" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$res_value = $arr[3] ;
		
		$idx_start = strpos($res_value,$search_txt) ;
		$idx_end = $idx_start + strlen($search_txt) ;
		
		$res_value = substr($res_value,0,$idx_start).'<b>'.substr($res_value,$idx_start,$idx_end-$idx_start).'</b>'.substr($res_value,$idx_end) ;
		
		$tab_result[] = array(
			'acc_id' => $arr[0],
			'file_filerecord_id' => $arr[1],
			'id_ref' => $arr[2],
			'result_property' => 'Facture',
			'result_value' => $res_value
		);
	}
	
	return array('success'=>true, 'data'=>$tab_result) ;
}








function specRsiRecouveo_file_createForAction( $post_data ) {
	global $_opDB ;
	
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_atr = $ttmp['data']['cfg_atr'] ;
	$cfg_status = $ttmp['data']['cfg_status'] ;
	$map_status = array() ;
	foreach( $cfg_status as $status ) {
		$map_status[$status['status_id']] = $status ;
	}
	$cfg_action = $ttmp['data']['cfg_action'] ;
	$map_action = array() ;
	foreach( $cfg_action as $action ) {
		$map_action[$action['action_id']] = $action ;
	}
	
	$p_accId = $post_data['acc_id'] ;
	$p_arr_recordIds = json_decode($post_data['arr_recordIds'],true) ;
	$p_newActionCode = $post_data['new_action_code'] ;
	$_formData = json_decode($post_data['form_data'],true) ;
	
	$json = specRsiRecouveo_account_open( array('acc_id'=>$p_accId) ) ;
	if( !$json['success'] ) {
		return array('success'=>false) ;
	}
	$account_record = $json['data'] ;
	
	
	// Statut existant
	$current_status = array() ;
	foreach( $account_record['files'] as $accFile_record ) {
		foreach( $accFile_record['records'] as $accFileRecord_record ) {
			if( in_array($accFileRecord_record['record_filerecord_id'],$p_arr_recordIds)
					&& !in_array($accFile_record['status'],$current_status) ) {
				$current_status[] = $accFile_record['status'] ;
				$current_fileFilerecordId = $accFile_record['file_filerecord_id'] ;
			}
		}
	}
	if( count($current_status) != 1 ) {
		return array('success'=>false, 'error'=>'Cannot find current status') ;
	}
	$current_status = reset($current_status) ;
	if( $map_status[$current_status]['sched_lock'] ) {
		return array('success'=>false, 'error'=>'Locked file (Current status)') ;
	}
	
	// Statut cible
	$ttmp = $map_action[$p_newActionCode]['status_next'] ;
	$new_status = reset($ttmp) ;
	
	if( $current_status == $new_status ) {
		return array('success'=>false, 'error'=>'Identical status') ;
	}
	
	
	// Current filename
	$filename_current = array() ;
	foreach( $account_record['files'] as $accFile_record ) {
		foreach( $accFile_record['records'] as $accFileRecord_record ) {
			if( in_array($accFileRecord_record['record_filerecord_id'],$p_arr_recordIds) ) {
				$filename_current[] = $accFile_record['id_ref'] ;
				break ;
			}
		}
	}
	if( count($filename_current) != 1 ) {
		return array('success'=>false, 'error'=>'Cannot find unique filename') ;
	}
	$filename_current = reset($filename_current) ;
	
	
	// *********** Generate target file name ************************
	$filename_words = explode('/',$filename_current) ;
	$fn_lastIdx = count($filename_words)-1 ;
	if( $filename_words[$fn_lastIdx] == $map_status[$current_status]['sched_prefix'] ) {
		unset($filename_words[$fn_lastIdx]) ;
	}
	if( $map_status[$new_status]['sched_prefix'] ) {
		$filename_words[] = $map_status[$new_status]['sched_prefix'] ;
	}
	if( !$map_status[$new_status]['sched_lock'] ) {
		$filename_target = implode('/',$filename_words) ;
	} else {
		$i = 1 ;
		while( $i < 100 ) {
			$filename_prefix = implode('/',$filename_words).'/' ;
			$filename_test = $filename_prefix.str_pad((int)$i, 2, "0", STR_PAD_LEFT) ;
			$query = "SELECT count(*) FROM view_file_FILE WHERE field_FILE_ID='{$filename_test}'" ;
			if( $_opDB->query_uniqueValue($query) == 0 ) {
				$filename_target = $filename_test ;
				break ;
			}
			$i++ ;
			continue ;
		}
		if( !$filename_target ) {
			return array('success'=>false, 'error'=>'Cannot create locked(action) filename') ;
		}
	}
	
	
	// Si statut cible = schedlock
	// => recherche fichier existant du meme nom
	if( !$map_status[$new_status]['sched_lock'] ) {
		$query = "SELECT filerecord_id FROM view_file_FILE 
				WHERE field_FILE_ID='{$filename_target}' AND field_STATUS='{$new_status}'" ;
		if( !($file_filerecord_id = $_opDB->query_uniqueValue($query)) ) {
			unset($file_filerecord_id) ;
		}
	}
	
	
	// Create new file
	if( !$file_filerecord_id ) {
		$arr_ins = array() ;
		$arr_ins['field_FILE_ID'] = $filename_target ;
		$arr_ins['field_LINK_ACCOUNT'] = $account_record['acc_id'] ;
			// ATRs
			$map_atr_values = array() ;
			foreach( $cfg_atr as $atr_record ) {
				$mkey = $atr_record['bible_code'] ;
				$map_atr_values[$mkey] = array() ;
			}
			foreach( $account_record['files'] as $accFile_record ) {
				foreach( $accFile_record['records'] as $accFileRecord_record ) {
					if( !in_array($accFileRecord_record['record_filerecord_id'],$p_arr_recordIds) ) {
						continue ;
					}
					foreach( $cfg_atr as $atr_record ) {
						$mkey = $atr_record['bible_code'] ;
						if( !in_array($accFile_record[$mkey], $map_atr_values[$mkey]) ) {
							$map_atr_values[$mkey][] = $accFileRecord_record[$mkey] ;
						}
					}
				}
			}
		foreach( $map_atr_values as $mkey => $values ) {
			if( count($values) != 1 ) {
				return array('success'=>false, 'error'=>'Cannot find unique '.$mkey) ;
			}
			$arr_ins['field_'.$mkey] = reset($values) ;
		}
		$arr_ins['field_STATUS'] = $new_status ;
		$arr_ins['field_DATE_OPEN'] = date('Y-m-d H:i:s') ;
		$arr_ins['field_FROM_FILE_ID'] = $current_fileFilerecordId ;
		$file_filerecord_id = paracrm_lib_data_insertRecord_file( 'FILE', 0, $arr_ins );
	}
	
	
	// Action mutation
	$arr_recordsTxt = array() ;
	$sum_recordsAmount = 0 ;
	foreach( $account_record['files'] as $accFile_record ) {
		$arr_recordsTxtFile = array() ;
		foreach( $accFile_record['records'] as $accFileRecord_record ) {
			if( !in_array($accFileRecord_record['record_filerecord_id'],$p_arr_recordIds) ) {
				continue ;
			}
			
			// Ids de facture
			$arr_recordsTxt[] = $accFileRecord_record['record_id'] ;
			$arr_recordsTxtFile[] = $accFileRecord_record['record_id'] ;
			$sum_recordsAmount += $accFileRecord_record['amount'] ;
			
			// Terminaison du lien
			$query = "SELECT filerecord_id FROM view_file_RECORD_LINK 
				WHERE filerecord_parent_id='{$accFileRecord_record['record_filerecord_id']}' AND field_LINK_IS_ON='1'" ;
			$recordlink_filerecord_id = $_opDB->query_uniqueValue($query) ;
			$arr_update = array() ;
			$arr_update['field_LINK_IS_ON'] = 0 ;
			$arr_udpate['field_DATE_LINK_OFF'] = date('Y-m-d H:i:s') ;
			paracrm_lib_data_updateRecord_file( 'RECORD_LINK', $arr_update, $recordlink_filerecord_id);
			
			// Nouveau lien
			$arr_ins = array() ;
			$arr_ins['field_LINK_FILE_ID'] = $file_filerecord_id ;
			$arr_ins['field_LINK_IS_ON'] = 1 ;
			$arr_ins['field_DATE_LINK_ON'] = date('Y-m-d H:i:s') ;
			paracrm_lib_data_insertRecord_file( 'RECORD_LINK', $accFileRecord_record['record_filerecord_id'], $arr_ins );
		}
		
		if( count($arr_recordsTxtFile) == 0 ) {
			continue ;
		}
		
		$txt = '' ;
		$txt.= $map_action[$p_newActionCode]['action_txt']."\r\n" ;
		$txt.= 'Factures : '.implode(',',$arr_recordsTxtFile)."\r\n" ;
		
		$arr_ins = array() ;
		$arr_ins['field_LINK_STATUS'] = $new_status ;
		$arr_ins['field_LINK_ACTION'] = $p_newActionCode ;
		$arr_ins['field_STATUS_IS_OK'] = 1 ;
		$arr_ins['field_DATE_ACTUAL'] = date('Y-m-d H:i:s') ;
		$arr_ins['field_TXT'] = $txt ;
		$arr_ins['field_LINK_NEW_FILE_ID'] = $file_filerecord_id ;
		paracrm_lib_data_insertRecord_file( 'FILE_ACTION', $accFile_record['file_filerecord_id'], $arr_ins );
	}
	
	// New action(s) on new file
	$file_code = 'FILE_ACTION' ;
	$status_next = $new_status ;
	switch( $p_newActionCode ) {
		case 'LITIG_START' :
			// LITIG_START ok + LITIG_FOLLOW sched
			$arr_ins = array() ;
			$arr_ins['field_LINK_STATUS'] = $status_next ;
			$arr_ins['field_LINK_ACTION'] = 'LITIG_START' ;
			$arr_ins['field_STATUS_IS_OK'] = 1 ;
			$arr_ins['field_DATE_ACTUAL'] = date('Y-m-d H:i:s') ;
			$arr_ins['field_LINK_LITIG'] = $_formData['litig_code'] ;
			$arr_ins['field_TXT'] = $_formData['litig_txt'] ;
			paracrm_lib_data_insertRecord_file( $file_code, $file_filerecord_id, $arr_ins );
			
			$arr_ins = array() ;
			$arr_ins['field_LINK_STATUS'] = $status_next ;
			$arr_ins['field_LINK_ACTION'] = 'LITIG_FOLLOW' ;
			$arr_ins['field_LINK_LITIG'] = $_formData['litig_code'] ;
			$arr_ins['field_DATE_SCHED'] = $_formData['litig_nextdate'] ;
			paracrm_lib_data_insertRecord_file( $file_code, $file_filerecord_id, $arr_ins );
			
			break ;
		
		case 'CLOSE_ASK' :
			// CLOSE_ASK ok + CLOSE_ACK sched
			$arr_ins = array() ;
			$arr_ins['field_LINK_STATUS'] = $status_next ;
			$arr_ins['field_LINK_ACTION'] = 'CLOSE_ASK' ;
			$arr_ins['field_STATUS_IS_OK'] = 1 ;
			$arr_ins['field_DATE_ACTUAL'] = date('Y-m-d H:i:s') ;
			$arr_ins['field_LINK_CLOSE'] = $_formData['close_code'] ;
			$arr_ins['field_TXT'] = $_formData['close_txt'] ;
			paracrm_lib_data_insertRecord_file( $file_code, $file_filerecord_id, $arr_ins );
			
			$arr_ins = array() ;
			$arr_ins['field_LINK_STATUS'] = $status_next ;
			$arr_ins['field_LINK_ACTION'] = 'CLOSE_ACK' ;
			$arr_ins['field_LINK_CLOSE'] = $_formData['close_code'] ;
			$arr_ins['field_DATE_SCHED'] = date('Y-m-d',strtotime('+1 day')) ;
			paracrm_lib_data_insertRecord_file( $file_code, $file_filerecord_id, $arr_ins );
			
			break ;
		
		case 'AGREE_START' :
			// AGREE_START ok + AGREE_FOLLOW sched
			$txt = array() ;
			$txt[]= 'Promesse réglement '.$_formData['agree_period'] ;
			$txt[]= 'Montant total : '.$_formData['agree_amount'].' €' ;
			
			$arr_ins = array() ;
			$arr_ins['field_LINK_STATUS'] = $status_next ;
			$arr_ins['field_LINK_ACTION'] = 'AGREE_START' ;
			$arr_ins['field_STATUS_IS_OK'] = 1 ;
			$arr_ins['field_DATE_ACTUAL'] = date('Y-m-d H:i:s') ;
			$arr_ins['field_TXT'] = implode("\r\n",$txt) ;
			paracrm_lib_data_insertRecord_file( $file_code, $file_filerecord_id, $arr_ins );
			
			switch( $_formData['agree_period'] ) {
				case 'MONTH' :
				case 'WEEK' :
					$nb = $_formData['agree_count'] ;
					$nbcalc = $nb ;
					$date = $_formData['agree_datefirst'] ;
					if( $_formData['agree_amountfirst_do'] ) {
						$_formData['agree_amount'] -= $_formData['agree_amountfirst'] ;
						$nbcalc-- ;
						$amount_first = $_formData['agree_amountfirst'] ;
					}
					$amount_each = round($_formData['agree_amount'] / $nbcalc,2) ;
					break ;
				case 'SINGLE' :
					$nb = 1 ;
					$date = $_formData['agree_date'] ;
					$amount_each = round($_formData['agree_amount'] / $nb,2) ;
					break ;
				default :
					break ;
			}
			for( $i=0 ; $i<$nb ; $i++ ) {
				$arr_ins = array() ;
				$arr_ins['field_STATUS_IS_OK'] = 0 ;
				$arr_ins['field_DATE_SCHED'] = $date ;
				$arr_ins['field_LINK_STATUS'] = $status_next ;
				$arr_ins['field_LINK_ACTION'] = 'AGREE_FOLLOW' ;
				$arr_ins['field_TXT'] = 'Attendu : '.(($i==0&&$amount_first) ? $amount_first : $amount_each).' €' ;
				paracrm_lib_data_insertRecord_file($file_code,$file_filerecord_id,$arr_ins) ;
				
				switch( $_formData['agree_period'] ) {
					case 'MONTH' :
						$date = date('Y-m-d',strtotime('+1 month',strtotime($date))) ;
						break ;
					case 'WEEK' :
						$date = date('Y-m-d',strtotime('+1 week',strtotime($date))) ;
						break ;
				}
			}
			if( $nb==0 && $_formData['agree_period']=='NOW' ) {
				// DONE 170529 : paiement immédiat
				// création TEMPREC
				$forward_post = array(
					'acc_id' => $p_accId,
					'data' => json_encode(array(
						'recordTemp_id' => 'Paiement VPC le '.date('d/m/Y'),
						'recordTemp_amount' => (-1 * $sum_recordsAmount)
					))
				);
				$json = specRsiRecouveo_file_createRecordTemp( $forward_post ) ;
				
				// assoc TEMPRC
				$forward_post = array(
					'file_filerecord_id' => $file_filerecord_id,
					'arr_recordFilerecordIds' => json_encode(array($json['record_filerecord_id']))
				) ;
				specRsiRecouveo_file_allocateRecordTemp($forward_post) ;
			}
			
			break ;
		
		default :
			// au moins une action en attente => sinon BUMP
			$query = "SELECT count(*) FROM view_file_FILE_ACTION
						WHERE filerecord_parent_id='{$file_filerecord_id}' AND field_STATUS_IS_OK='0'" ;
			if( $_opDB->query_uniqueValue($query) == 0 ) {
				$arr_ins = array() ;
				$arr_ins['field_LINK_STATUS'] = $new_status ;
				$arr_ins['field_LINK_ACTION'] = 'BUMP' ;
				$arr_ins['field_STATUS_IS_OK'] = 0 ;
				$arr_ins['field_DATE_SCHED'] = date('Y-m-d') ;
				paracrm_lib_data_insertRecord_file( $file_code, $file_filerecord_id, $arr_ins );
			}
			break ;
	}
	
	specRsiRecouveo_file_lib_updateStatus($account_record['acc_id']) ;
	return array('success'=>true,'file_filerecord_id'=>$file_filerecord_id) ;
}








function specRsiRecouveo_file_lib_createForAction( $file_row, $action_id ) {

	// fichier(s) origine => close if empty
}
function specRsiRecouveo_file_lib_closeBack( $file_filerecord_id ) {
	global $_opDB ;
	
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_atr = $ttmp['data']['cfg_atr'] ;
	$cfg_status = $ttmp['data']['cfg_status'] ;
	$map_status = array() ;
	foreach( $cfg_status as $status ) {
		$map_status[$status['status_id']] = $status ;
	}
	$cfg_action = $ttmp['data']['cfg_action'] ;
	$map_action = array() ;
	foreach( $cfg_action as $action ) {
		$map_action[$action['action_id']] = $action ;
	}
	
	$ttmp = specRsiRecouveo_file_getRecords( array(
		'filter_fileFilerecordId_arr' => json_encode(array($file_filerecord_id))
	)) ;
	$accFile_record = $ttmp['data'][0] ;
	if( $accFile_record['file_filerecord_id'] != $file_filerecord_id ) {
		return array('success'=>false) ;
	}
	
	// schedLock only
	if( !$map_status[$accFile_record['status']]['sched_lock'] ) {
		echo "ERRRRRRROR" ;
		return ;
	}
	
	// reintégration dans ficher origine (+reouverture)
	$map_fileFilerecordId_arrRecordsTxt = array() ;
	foreach( $accFile_record['records'] as $accFileRecord_record ) {
		$query = "SELECT field_LINK_FILE_ID FROM view_file_RECORD_LINK
				WHERE filerecord_parent_id='{$accFileRecord_record['record_filerecord_id']}' AND field_LINK_IS_ON='0'
				ORDER BY filerecord_id DESC LIMIT 1" ;
		$dst_file_filerecord_id = $_opDB->query_uniqueValue($query) ;
		
		if( !$map_fileFilerecordId_arrRecordsTxt[$dst_file_filerecord_id] ) {
			$map_fileFilerecordId_arrRecordsTxt[$dst_file_filerecord_id] = array() ;
		}
		$map_fileFilerecordId_arrRecordsTxt[$dst_file_filerecord_id][] = $accFileRecord_record['record_id'] ;
		
		// terminaison du lien
		$query = "SELECT filerecord_id FROM view_file_RECORD_LINK 
			WHERE filerecord_parent_id='{$accFileRecord_record['record_filerecord_id']}' AND field_LINK_IS_ON='1'" ;
		$recordlink_filerecord_id = $_opDB->query_uniqueValue($query) ;
		$arr_update = array() ;
		$arr_update['field_LINK_IS_ON'] = 0 ;
		$arr_udpate['field_DATE_LINK_OFF'] = date('Y-m-d H:i:s') ;
		paracrm_lib_data_updateRecord_file( 'RECORD_LINK', $arr_update, $recordlink_filerecord_id);
		
		// Nouveau lien
		$arr_ins = array() ;
		$arr_ins['field_LINK_FILE_ID'] = $dst_file_filerecord_id ;
		$arr_ins['field_LINK_IS_ON'] = 1 ;
		$arr_ins['field_DATE_LINK_ON'] = date('Y-m-d H:i:s') ;
		paracrm_lib_data_insertRecord_file( 'RECORD_LINK', $accFileRecord_record['record_filerecord_id'], $arr_ins );
	}
	
	// new action done sur fichiers dest
	foreach( $map_fileFilerecordId_arrRecordsTxt as $dst_file_filerecord_id => $arr_recordsTxtFile ) {
		$txt = '' ;
		$txt.= "Dossier {$accFile_record['id_ref']} fermé/refusé"."\r\n" ;
		$txt.= 'Factures : '.implode(',',$arr_recordsTxtFile)."\r\n" ;
		
		$arr_ins = array() ;
		$arr_ins['field_LINK_STATUS'] = $accFile_record['status'] ;
		$arr_ins['field_LINK_ACTION'] = 'BUMP' ;
		$arr_ins['field_STATUS_IS_OK'] = 1 ;
		$arr_ins['field_DATE_ACTUAL'] = date('Y-m-d H:i:s') ;
		$arr_ins['field_TXT'] = $txt ;
		paracrm_lib_data_insertRecord_file( 'FILE_ACTION', $dst_file_filerecord_id, $arr_ins );
		
		$query = "SELECT count(*) FROM view_file_FILE_ACTION
					WHERE filerecord_parent_id='{$dst_file_filerecord_id}' AND field_STATUS_IS_OK='0'" ;
		if( $_opDB->query_uniqueValue($query) == 0 ) {
			$arr_ins = array() ;
			$arr_ins['field_LINK_STATUS'] = $new_status ;
			$arr_ins['field_LINK_ACTION'] = 'BUMP' ;
			$arr_ins['field_STATUS_IS_OK'] = 0 ;
			$arr_ins['field_DATE_SCHED'] = date('Y-m-d') ;
			paracrm_lib_data_insertRecord_file( 'FILE_ACTION', $dst_file_filerecord_id, $arr_ins );
		}
	}
	
	
	specRsiRecouveo_file_lib_updateStatus( $accFile_record['acc_id'] ) ;
	return $dst_file_filerecord_id ;
}



function specRsiRecouveo_file_lib_updateStatus( $acc_id ) {
	$json = specRsiRecouveo_account_open( array('acc_id'=>$acc_id) ) ;
	if( !$json['success'] ) {
		return array('success'=>false) ;
	}
	$account_record = $json['data'] ;
	
	foreach( $account_record['files'] as $accFile_record ) {
		$arr_update = array() ;
		$arr_update['field_STATUS_CLOSED'] = !(count($accFile_record['records'])>0) ;
		paracrm_lib_data_updateRecord_file( 'FILE', $arr_update, $accFile_record['file_filerecord_id']);
	}
}


function specRsiRecouveo_file_lib_getNextMailNum( $file_filerecord_id ) {
	global $_opDB ;
	
	$query = "UPDATE view_file_FILE SET field_NEXT_MAIL_NUM = field_NEXT_MAIL_NUM + '1'
			WHERE filerecord_id='{$file_filerecord_id}'" ;
	$_opDB->query($query) ;
	
	
	$query = "SELECT field_FILE_ID, field_NEXT_MAIL_NUM FROM view_file_FILE
			WHERE filerecord_id='{$file_filerecord_id}'" ;
	$result = $_opDB->query($query) ;
	$arr = $_opDB->fetch_row($result) ;
	if( !$arr ) {
		return NULL ;
	}
	return $arr[0].'/'.str_pad((int)$arr[1], 2, "0", STR_PAD_LEFT) ;
}





function specRsiRecouveo_file_getScenarioLine( $post_data ) {
	global $_opDB ;
	
	$p_fileFilerecordId = $post_data['file_filerecord_id'] ;
	$p_forceScenCode = $post_data['force_scenCode'] ;
	$json = specRsiRecouveo_file_getRecords( array(
		'filter_fileFilerecordId_arr' => json_encode(array($p_fileFilerecordId))
	)) ;
	$accFile_record = $json['data'][0] ;
	
	$json = specRsiRecouveo_config_getScenarios(array()) ;
	$data_scenarios = $json['data'] ;
	
	$scen_code = ($p_forceScenCode ? $p_forceScenCode : $accFile_record['scen_code']) ;
	if( !$scen_code ) {
		return array('success'=>false) ;
	}
	
	$row_scenario = NULL ;
	foreach( $data_scenarios as $t_row_scenario ) {
		if( $t_row_scenario['scen_code'] == $scen_code ) {
			$row_scenario = $t_row_scenario ;
			break ;
		}
	}
	if( !$row_scenario ) {
		return array('success'=>false) ;
	}
	
	$tags = array() ;
	foreach( $row_scenario['steps'] as $row_scenario_step ) {
		$tags[] = $row_scenario_step['scenstep_tag'] ;
	}
	//print_r($tags) ;
	
	
	$TAB = array() ;
	foreach( $row_scenario['steps'] as $row_scenario_step ) {
		//$row_scenario_step['is_before'] = TRUE ;
		$scenstep_tag = $row_scenario_step['scenstep_tag'] ;
		
		$TAB[$scenstep_tag] = $row_scenario_step ;
	}
	$TAB['BUMP'] = array(
		'link_action' => 'BUMP'
	);
	
	/*
	*************************************
	 - Tag de la dernière action
	 - Statut/date des tags inférieurs
	 - Tag next action ?
	 - Tag next action auto ?
	*************************************
	*/
	foreach( array_reverse($accFile_record['actions']) as $row_file_action ) {
		//print_r($row_file_action) ;
		if( !$row_file_action['scenstep_tag'] ) {
			continue ;
		}
		$this_tag_idx = array_search( $row_file_action['scenstep_tag'], $tags ) ;
		if( $this_tag_idx === FALSE ) {
			continue ;
		}
		$this_tag = $tags[$this_tag_idx] ;
		
		
		if( !$row_file_action['status_is_ok'] ) {
			if( $row_file_action['fileaction_filerecord_id'] == $post_data['fileaction_filerecord_id'] ) {
				$lastdone_tag_idx = $this_tag_idx ;
				$lastdone_date = date('Y-m-d') ;
				$TAB[$this_tag]['is_current'] = TRUE ; // is current
			} else {
				//$lastdone_tag_idx = $this_tag_idx -1 ; // HACK
				$TAB[$this_tag]['is_selected'] = TRUE ; // is selected
				$TAB[$this_tag]['date_sched'] = date('Y-m-d',strtotime($row_file_action['date_sched'])) ;
			}
		}
		
		if( $row_file_action['status_is_ok'] ) {
			if( !isset($lastdone_tag_idx) ) {
				$lastdone_tag_idx = $this_tag_idx ;
				$lastdone_date = date('Y-m-d',strtotime($row_file_action['date_actual'])) ;
			} elseif( $this_tag_idx > $lastdone_tag_idx ) {
				continue ;
			}
			$TAB[$this_tag]['is_before_done'] = TRUE ; // is before
			$TAB[$this_tag]['date_actual'] = date('Y-m-d',strtotime($row_file_action['date_actual'])) ;
		}
		
	}
	// ** Déterminer les next 
	if( !isset($lastdone_tag_idx) ) {
		$lastdone_tag_idx = -1 ;
	}
	// ** Déterminer date de référence
	if( !$lastdone_date ) {
		//date d echeance
		$dates = array() ;
		foreach( $accFile_record['records'] as $accFileRecord_record ) {
			$dates[] = date('Y-m-d',strtotime($accFileRecord_record['date_value'])) ;
		}
		$lastdone_date = max($dates) ;
	}
	$tag_idx = -1 ;
	foreach( $TAB as $tag => &$row_scenario_step ) {
		$tag_idx++ ;
		if( ($tag_idx < $lastdone_tag_idx) && !$row_scenario_step['is_before'] ) {
			$row_scenario_step['is_before_skipped'] = TRUE ;
		}
	}
	unset($row_scenario_step) ;

	$next_tag_idx = $lastdone_tag_idx + 1 ;
	if( $next_tag_idx >= count($tags) ) {
		$next_tag = 'BUMP' ;
	} else {
		$next_tag = $tags[$next_tag_idx] ;
	}
	$TAB[$next_tag]['is_next'] = TRUE ;
	$to_add_days = (int)$TAB[$next_tag]['schedule_daystep'] ;
	$to_add_str = ($to_add_days >= 0 ? '+':'-').abs($to_add_days).' days' ;
	$TAB[$next_tag]['date_sched'] = date('Y-m-d',strtotime($to_add_str,strtotime($lastdone_date))) ;
	
	while( $next_tag_idx < count($tags) ) {
		// is auto ?
		if( $row_scenario['steps'][$next_tag_idx]['exec_is_auto'] ) {
			$next_tag = $tags[$next_tag_idx] ;
			$TAB[$next_tag]['is_next_auto'] = TRUE ;
			$to_add_days = (int)$TAB[$next_tag]['schedule_daystep'] ;
			$to_add_str = ($to_add_days >= 0 ? '+':'-').abs($to_add_days).' days' ;
			$TAB[$next_tag]['date_sched'] = date('Y-m-d',strtotime($to_add_str,strtotime($lastdone_date))) ;
			break ;
		}
		
		$next_tag_idx++ ;
	}
	
	
	
	//print_r($accFile_record) ;
	
	return array('success'=>true, 'data'=>array_values($TAB)) ;
}




function specRsiRecouveo_file_createRecordTemp( $post_data ) {
	global $_opDB ;
	
	$p_accId = $post_data['acc_id'] ;
	$p_formData = json_decode($post_data['data'],true) ;
	$json = specRsiRecouveo_account_open( array(
		'acc_id' => $p_accId
	)) ;
	if( !$json['success'] ) {
		return array('success'=>false) ;
	}
	
	$arr_ins = array() ;
	$arr_ins['field_TYPE'] = 'TEMPREC' ;
	$arr_ins['field_TYPE_TEMPREC'] = 'FILE' ;
	$arr_ins['field_RECORD_ID'] = trim($p_formData['recordTemp_id']) ;
	$arr_ins['field_LINK_ACCOUNT'] = $p_accId ;
	$arr_ins['field_DATE_RECORD'] = $arr_ins['field_DATE_VALUE'] = date('Y-m-d') ;
	$arr_ins['field_AMOUNT'] = $p_formData['recordTemp_amount'] ;
	$arr_ins['field_LETTER_IS_ON'] = 0 ;
	$record_filerecord_id = paracrm_lib_data_insertRecord_file( 'RECORD', 0, $arr_ins );
	
	return array('success'=>true, 'record_filerecord_id'=>$record_filerecord_id) ;
}
function specRsiRecouveo_file_allocateRecordTemp( $post_data ) {
	global $_opDB ;
	
	$p_fileFilerecordId = $post_data['file_filerecord_id'] ;
	$p_arrRecordFilerecordIds = json_decode($post_data['arr_recordFilerecordIds'],true) ;
	
	foreach( $p_arrRecordFilerecordIds as $record_filerecord_id ) {
		if( $p_fileFilerecordId==='' ) {
			paracrm_lib_data_deleteRecord_file( 'RECORD', $record_filerecord_id );
		}
		$query = "UPDATE view_file_RECORD r, view_file_RECORD_LINK rl
					SET rl.field_LINK_IS_ON='0'
					WHERE r.filerecord_id = rl.filerecord_parent_id
					AND r.filerecord_id='{$record_filerecord_id}'" ;
		$_opDB->query($query) ;
		
		if( $p_fileFilerecordId > 0 ) {
			$arr_ins = array() ;
			$arr_ins['field_LINK_FILE_ID'] = $p_fileFilerecordId ;
			$arr_ins['field_LINK_IS_ON'] = 1 ;
			$arr_ins['field_DATE_LINK_ON'] = date('Y-m-d H:i:s') ;
			paracrm_lib_data_insertRecord_file( 'RECORD_LINK', $record_filerecord_id, $arr_ins );
		}
	}
	
	if( $p_fileFilerecordId > 0 ) {
		return array('success'=>true, 'file_filerecord_id'=>$p_fileFilerecordId) ;
	}
	return array('success'=>true) ;
}




function specRsiRecouveo_file_tool_isDateValid( $date_sql )
{
	if( $date_sql == '0000-00-00' )
		return FALSE ;
	if( $date_sql == '0000-00-00 00:00:00' )
		return FALSE ;
	if( !$date_sql )
		return FALSE ;
	return TRUE ;
}
?>
