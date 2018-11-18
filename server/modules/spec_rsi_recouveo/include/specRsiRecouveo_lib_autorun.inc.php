<?php

function specRsiRecouveo_lib_autorun_open() {
	global $_opDB ;
	
	$arr_acc = array() ;
	$query = "SELECT distinct field_LINK_ACCOUNT FROM view_file_RECORD r
				LEFT OUTER JOIN view_file_RECORD_LINK rl 
				 ON rl.filerecord_parent_id=r.filerecord_id AND rl.field_LINK_IS_ON='1'
				WHERE rl.filerecord_id IS NULL" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$arr_acc[] = $arr[0] ;
	}
	
	
	foreach( $arr_acc as $acc_id ) {
		$ttmp = specRsiRecouveo_account_open(array('acc_id'=>$acc_id)) ;
		if( !$ttmp['success'] ) {
			continue ;
		}
		$account_record = $ttmp['data'] ;
		$accountFileBlank_record = NULL ;
		foreach( $account_record['files'] as $accountFile_record ) {
			if( $accountFile_record['file_filerecord_id'] === 0 ) {
				$accountFileBlank_record = $accountFile_record ;
				break ;
			}
		}
		
		if( !$accountFileBlank_record ) {
			continue ;
		}
		
		$arr_ins = array() ;
		$arr_ins['field_FILE_ID'] = $account_record['acc_id'].'/'.date('Ymd') ;
		$arr_ins['field_LINK_ACCOUNT'] = $account_record['acc_id'] ;
		$arr_ins['field_STATUS'] = 'S0_PRE' ;
		$arr_ins['field_DATE_OPEN'] = date('Y-m-d H:i:s') ;
		$arr_ins['field_FROM_FILE_ID'] = 0 ;
		$file_filerecord_id = paracrm_lib_data_insertRecord_file( 'FILE', 0, $arr_ins );
		
		$ids = array() ;
		foreach( $accountFileBlank_record['records'] as $accountFileBlankRecord_record ) {
			$arr_ins = array() ;
			$arr_ins['field_LINK_FILE_ID'] = $file_filerecord_id ;
			$arr_ins['field_LINK_IS_ON'] = 1 ;
			$arr_ins['field_DATE_LINK_ON'] = date('Y-m-d') ;
			paracrm_lib_data_insertRecord_file( 'RECORD_LINK', $accountFileBlankRecord_record['record_filerecord_id'], $arr_ins );
			
			if( !$accountFileBlankRecord_record['is_disabled'] ) {
				$ids[] = $accountFileBlankRecord_record['record_filerecord_id'] ;
			}
		}
		
		if( count($ids) > 0 ) {
			$forward_post = array() ;
			$forward_post['acc_id'] = $account_record['acc_id'] ;
			$forward_post['arr_recordIds'] = json_encode($ids) ;
			$forward_post['new_action_code'] = 'BUMP' ;
			$forward_post['form_data'] = json_encode(array()) ;
			$ret = specRsiRecouveo_file_createForAction($forward_post) ;
		}
	}
}
function specRsiRecouveo_lib_autorun_manageDisabled() {
	global $_opDB ;
	
	$arr_acc = array() ;
	$query = "SELECT distinct f.field_LINK_ACCOUNT FROM view_file_RECORD r
				JOIN view_file_RECORD_LINK rl 
				 ON rl.filerecord_parent_id=r.filerecord_id AND rl.field_LINK_IS_ON='1'
				JOIN view_file_FILE f
				 ON f.filerecord_id = rl.field_LINK_FILE_ID
				WHERE ( f.field_STATUS IN ('S1_OPEN','S1_SEARCH') AND r.field_IS_DISABLED='1' )
				OR ( f.field_STATUS IN('S0_PRE') AND r.field_IS_DISABLED='0' )" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$arr_acc[] = $arr[0] ;
	}
	
	foreach( $arr_acc as $acc_id ) {
		$toEnable_recordFilerecordIds = array() ;
		$toDisable_recordFilerecordIds = array() ;
		$targetFile_preFilerecordId = $targetFile_openFilerecordId = NULL ;
		
		$ttmp = specRsiRecouveo_account_open(array('acc_id'=>$acc_id, 'filter_archiveIsOn'=>1)) ;
		$account_record = $ttmp['data'] ;
		foreach( $account_record['files'] as $accountFile_record ) {
			switch( $accountFile_record['status'] ) {
				case 'S0_PRE' :
					$cur_status = 'PRE' ;
					$targetFile_preFilerecordId = $accountFile_record['file_filerecord_id'] ;
					break ;
				case 'S1_OPEN' :
				case 'S1_SEARCH' :
					$cur_status = 'OPEN' ;
					$targetFile_openFilerecordId = $accountFile_record['file_filerecord_id'] ;
					break ;
				default :
					continue 2 ;
			}
			foreach( $accountFile_record['records'] as $accountFileRecord_record ) {
				if( $cur_status=='PRE' && !$accountFileRecord_record['is_disabled'] ) {
					$toEnable_recordFilerecordIds[] = $accountFileRecord_record['record_filerecord_id'] ;
				}
				if( $cur_status=='OPEN' && $accountFileRecord_record['is_disabled'] ) {
					$toDisable_recordFilerecordIds[] = $accountFileRecord_record['record_filerecord_id'] ;
				}
			}
		}
		
		if( count($toEnable_recordFilerecordIds)>0 ) {
			if( $targetFile_openFilerecordId ) {
				specRsiRecouveo_file_allocateRecordTemp( array(
					'file_filerecord_id' => $targetFile_openFilerecordId,
					'arr_recordFilerecordIds' => json_encode($toEnable_recordFilerecordIds)
				)) ;
			} else {
				$forward_post = array() ;
				$forward_post['acc_id'] = $account_record['acc_id'] ;
				$forward_post['arr_recordIds'] = json_encode($toEnable_recordFilerecordIds) ;
				$forward_post['new_action_code'] = 'BUMP' ;
				$forward_post['form_data'] = json_encode(array()) ;
				$ret = specRsiRecouveo_file_createForAction($forward_post) ;
			}
			specRsiRecouveo_file_lib_updateStatus($account_record['acc_id']) ;
		}
		if( count($toDisable_recordFilerecordIds)>0 ) {
			if( $targetFile_preFilerecordId ) {
				specRsiRecouveo_file_allocateRecordTemp( array(
					'file_filerecord_id' => $targetFile_preFilerecordId,
					'arr_recordFilerecordIds' => json_encode($toDisable_recordFilerecordIds)
				)) ;
			} else {
				// TODO
			}
			specRsiRecouveo_file_lib_updateStatus($account_record['acc_id']) ;
		}
	}
}


function specRsiRecouveo_lib_autorun_closeEnd() {
	global $_opDB ;
	$query = "SELECT distinct field_LINK_ACCOUNT FROM view_file_FILE WHERE field_STATUS_CLOSED_END<>'1' AND field_STATUS_CLOSED_VOID<>'1'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$acc_id = $arr[0] ;
		specRsiRecouveo_file_lib_updateStatus($acc_id) ;
	}
}

function specRsiRecouveo_lib_autorun_actions() {
	$json = specRsiRecouveo_config_getScenarios(array()) ;
	$map_scenCode_scenstepCode_step = array() ;
	foreach( $json['data'] as $scenario ) {
		foreach( $scenario['steps'] as $scenstep ) {
			$map_scenCode_scenstepTag_step[$scenario['scen_code']][$scenstep['scenstep_tag']] = $scenstep ;
		}
	}

	global $_opDB ;
	$query = "SELECT distinct f.filerecord_id 
			FROM view_file_FILE f
			INNER JOIN view_file_FILE_ACTION fa ON fa.filerecord_parent_id=f.filerecord_id
			WHERE f.field_STATUS_CLOSED_END<>'1' AND f.field_STATUS_CLOSED_VOID<>'1' AND fa.field_STATUS_IS_OK<>'1'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$file_filerecord_id = $arr[0] ;
		
		$json_file = specRsiRecouveo_file_getRecords( array(
			'filter_fileFilerecordId_arr' => json_encode(array($file_filerecord_id))
		)) ;
		$file = $json_file['data'][0] ;
		$nextaction_filerecord_id = $file['next_fileaction_filerecord_id'] ;
		if( !$nextaction_filerecord_id || $file['next_date'] > date('Y-m-d') ) {
			continue ;
		}
		$next_action = NULL ;
		foreach( $file['actions'] as $action ) {
			if( $action['fileaction_filerecord_id'] == $nextaction_filerecord_id ) {
				$next_action = $action ;
			}
		}
		if( !$next_action ) {
			continue ;
		}
		
		if( $file['inv_amount_due'] < 0 ) {
			continue ;
		}
		
		$scen_code = $file['scen_code'] ;
		$scenstep_tag = $next_action['scenstep_tag'] ;
		if( !$scen_code || !$scenstep_tag ) {
			continue ;
		}
		$scenstep = $map_scenCode_scenstepTag_step[$scen_code][$scenstep_tag] ;
		if( !$scenstep ) {
			continue ;
		}
		
		if( $scenstep['exec_is_auto'] 
		&& $action['link_action']=='MAIL_OUT'
		&& $action['link_action'] == $scenstep['link_action']
		&& $action['link_tpl'] == $scenstep['link_tpl'] ) {
		
			specRsiRecouveo_action_execMailAutoAction( array(
				'file_filerecord_id' => $file_filerecord_id,
				'fileaction_filerecord_id' => $nextaction_filerecord_id
			)) ;
		}
	}
}



function specRsiRecouveo_lib_autorun_adrbook( $acc_id=NULL ) {
	global $_opDB ;
	
	// Comptes sans adr prio
	if( !$acc_id ) {
		$arr_accIds = array() ;
		$query = " SELECT distinct field_ACC_ID
			FROM (
				SELECT distinct a.field_ACC_ID, ae.field_ADR_TYPE
				FROM view_file_ADRBOOK a
				, view_file_ADRBOOK_ENTRY ae
				WHERE a.filerecord_id = ae.filerecord_parent_id
			) contacts
			WHERE (field_ACC_ID, field_ADR_TYPE) NOT IN (
				SELECT distinct a.field_ACC_ID, ae.field_ADR_TYPE
				FROM view_file_ADRBOOK a
				, view_file_ADRBOOK_ENTRY ae
				WHERE a.filerecord_id = ae.filerecord_parent_id
				AND ae.field_STATUS_IS_PRIORITY='1' AND ae.field_STATUS_IS_INVALID='0'
			)" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
			$arr_accIds[] = $arr['field_ACC_ID'] ;
		}
	} else {
		$arr_accIds = array($acc_id) ;
	}
	
	foreach( $arr_accIds as $t_acc_id ) {
		$query = "UPDATE view_file_ADRBOOK_ENTRY ae
				JOIN view_file_ADRBOOK a ON a.filerecord_id=ae.filerecord_parent_id
				SET ae.field_STATUS_IS_PRIORITY='0'
				WHERE a.field_ACC_ID='{$t_acc_id}' AND ae.field_STATUS_IS_INVALID='1'" ;
		$_opDB->query($query) ;
				
		
		$ttmp = specRsiRecouveo_account_open(array('acc_id'=>$t_acc_id)) ;
		$account_record = $ttmp['data'] ;
		
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
		/*
		echo $t_acc_id."\n" ;
		print_r($map_adrType_ids) ;
		echo "\n\n\n" ;
		continue ;
		*/
		
		foreach( $map_adrType_ids as $adr_type => $ids ) {
			if( !is_array($ids) ) {
				continue ;
			}
			rsort($ids) ;
			$adrbookentry_filerecord_id = reset($ids) ;
			
			$arr_update = array() ;
			$arr_update['field_STATUS_IS_PRIORITY'] = 1 ;
			paracrm_lib_data_updateRecord_file( 'ADRBOOK_ENTRY', $arr_update, $adrbookentry_filerecord_id);
		}
	}
	
	
	
	
	
	
	if( !$acc_id ) {
		// Comptes sans adresse de contact
		$arr_searchAccIds = array() ;
		$query = "SELECT distinct field_LINK_ACCOUNT FROM view_file_FILE f
					WHERE f.field_STATUS_CLOSED_VOID='0' AND f.field_STATUS_CLOSED_END='0'
					AND f.field_LINK_ACCOUNT NOT IN (
						SELECT distinct a.field_ACC_ID
						FROM view_file_ADRBOOK a
						, view_file_ADRBOOK_ENTRY ae
						WHERE a.filerecord_id = ae.filerecord_parent_id
						AND ae.field_STATUS_IS_PRIORITY='1' AND ae.field_ADR_TYPE IN ('POSTAL','TEL')
					)" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$arr_searchAccIds[] = $arr[0] ;
		}
		
		foreach($arr_searchAccIds as $t_acc_id) {
			specRsiRecouveo_lib_autorun_checkAdrStatus($t_acc_id) ;
		}
	} else {
		specRsiRecouveo_lib_autorun_checkAdrStatus($acc_id) ;
	}
}

function specRsiRecouveo_lib_autorun_checkAdrStatus( $acc_id ) {
	global $_opDB ;
	
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
	$ttmp = specRsiRecouveo_account_open(array('acc_id'=>$acc_id)) ;
	$account_record = $ttmp['data'] ;
	foreach($account_record['adrbook'] as $accAdrbook_record ) {
		foreach( $accAdrbook_record['adrbookentries'] as $accAdrbookEntry_record ) {
			$adr_type = $accAdrbookEntry_record['adr_type'] ;
			if( !in_array($adr_type,array('POSTAL','TEL')) ) {
				continue ;
			}
			if( $accAdrbookEntry_record['status_is_priority'] ) {
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




function specRsiRecouveo_lib_autorun_processInbox() {
	global $_opDB ;
	
	$query = "SELECT filerecord_id FROM view_file_IN_POSTAL WHERE field_LINK_IS_ON='0'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		specRsiRecouveo_lib_autorun_processInboxDoc($arr[0]) ;
	}
	
	return ;
}
function specRsiRecouveo_lib_autorun_processInboxDoc($inpostal_filerecord_id) {
	global $_opDB ;
	
	$query = "SELECT * FROM view_file_IN_POSTAL WHERE filerecord_id='{$inpostal_filerecord_id}'" ;
	$result = $_opDB->query($query) ;
	$src = $_opDB->fetch_assoc($result) ;
	if( !$src ) {
		return ;
	}
	
	// Load MAILIN param
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_mailin = NULL ;
	foreach( $ttmp['data']['cfg_opt'] as $cfg_opt ) {
		if( $cfg_opt['bible_code'] == 'OPT_MAILIN' ) {
			foreach( $cfg_opt['records'] as $rec ) {
				if( $rec['id'] == $src['field_OPT_MAILIN'] ) {
					$cfg_mailin = $rec ;
					break ;
				}
			}
		}
	}
	if( !$cfg_mailin ) {
		return ;
	}
	if( $cfg_mailin['parent'] == 'NOK' ) {
			// recherche action originale
			$query = "SELECT fa.filerecord_id 
						FROM view_file_ENVELOPE env
						JOIN view_file_FILE_ACTION fa ON fa.field_LINK_ENV_ID=env.filerecord_id
						WHERE env.field_ENV_REF='{$src['field_REF_MAILOUT']}'" ;
			$fileaction_filerecord_id = $_opDB->query_uniqueValue($query) ;
			
			// controle anti-doublon
			$query = "SELECT count(*) FROM view_file_IN_POSTAL WHERE field_LINK_IS_ON='1' AND field_LINK_FILE_ACTION_ID='{$fileaction_filerecord_id}'" ;
			if( $_opDB->query_uniqueValue($query) > 0 ) {
				//break ;
			}
			
			$query = "SELECT * FROM view_file_FILE_ACTION WHERE filerecord_id='{$fileaction_filerecord_id}'" ;
			$result = $_opDB->query($query) ;
			$fileaction_dbrow = $_opDB->fetch_assoc($result) ;
			
			$arr_ins = array() ;
			$arr_ins['field_LINK_MAILIN'] = $src['field_OPT_MAILIN'] ;
			$arr_ins['field_TXT'] = trim($fileaction_dbrow['field_TXT'])."\n".$cfg_mailin['text'].' reçu le '.date('d/m/Y',strtotime($src['field_DATE_RECEP'])) ;
			paracrm_lib_data_updateRecord_file( 'FILE_ACTION', $arr_ins, $fileaction_filerecord_id);
			
			$arr_ins = array() ;
			$arr_ins['field_LINK_IS_ON'] = 1 ;
			$arr_ins['field_LINK_FILE_ACTION_ID'] = $fileaction_filerecord_id ;
			paracrm_lib_data_updateRecord_file( 'IN_POSTAL', $arr_ins, $inpostal_filerecord_id);
			
			//recherche adresse à invalider
			$query = "SELECT env.field_RECEP_ADR
						FROM view_file_ENVELOPE env
						WHERE env.field_ENV_REF='{$src['field_REF_MAILOUT']}'" ;
			$recep_adr = $_opDB->query_uniqueValue($query) ;
			$ttmp = explode("\n",$recep_adr,2) ;
			$adr_txt = mysql_real_escape_string($ttmp[1]) ;
			// strip first line (=name)
			$adr_txt = preg_replace('/^.+\n/', '', $adr_txt);
			// query select
			$query = "SELECT ae.filerecord_id FROM view_file_ADRBOOK_ENTRY ae
					JOIN view_file_ADRBOOK a ON a.filerecord_id=ae.filerecord_parent_id
					WHERE a.field_ACC_ID='{$src['field_REF_ACCOUNT']}'
					AND REGEXP_REPLACE(ae.field_ADR_TXT,'[^A-Za-z0-9 ]','') = REGEXP_REPLACE('{$adr_txt}','[^A-Za-z0-9 ]','')" ;
			$adrbookentry_filerecord_id = $_opDB->query_uniqueValue($query) ;
			
			if( $adrbookentry_filerecord_id ) {
				$arr_update = array() ;
				switch( $cfg_mailin['next'] ) {
					case 'INVALID' :
						$arr_update['field_STATUS_IS_INVALID'] = 1 ;
						$arr_update['field_STATUS_IS_CONFIRM'] = 0 ;
						$arr_update['field_STATUS_IS_PRIORITY'] = 0 ;
						break ;
					case 'CONFIRM' :
						$arr_update['field_STATUS_IS_INVALID'] = 0 ;
						$arr_update['field_STATUS_IS_CONFIRM'] = 1 ;
						break ;
					default :
						break ;
				}
				if( $arr_update ) {
					paracrm_lib_data_updateRecord_file( 'ADRBOOK_ENTRY', $arr_update, $adrbookentry_filerecord_id);
				}
				
				specRsiRecouveo_lib_autorun_checkAdrStatus( $src['field_REF_ACCOUNT'] ) ;
			}
			
	} elseif( $cfg_mailin['id'] == 'MAIL_OK' ) {
			$ttmp = specRsiRecouveo_cfg_getConfig() ;
			$cfg_atr = $ttmp['data']['cfg_atr'] ;
			$cfg_status = $ttmp['data']['cfg_status'] ;
			$map_status = array() ;
			foreach( $cfg_status as $status ) {
				$map_status[$status['status_id']] = $status ;
			}
	
			// Recherche FILE :
				// ouvert + is_schedlock=FALSE
				// ouvert
			$arrFileIds_noSchedlock = array() ;
			$arrFileIds = array() ;
			$ttmp = specRsiRecouveo_account_open(array('acc_id'=>$src['field_REF_ACCOUNT'])) ;
			$account_record = $ttmp['data'] ;
			foreach( $account_record['files'] as $accountFile_record ) {
				if( $accountFile_record['status_closed_void'] || $accountFile_record['status_closed_end'] ) {
					continue ;
				}
				$arrFileIds[] = $accountFile_record['file_filerecord_id'] ;
				if( !$map_status[$accountFile_record['status']]['sched_lock'] ) {
					$arrFileIds_noSchedlock[] = $accountFile_record['file_filerecord_id'] ;
				}
			}
			$target_file_filerecord_id = NULL ;
			if( $arrFileIds_noSchedlock ) {
				$target_file_filerecord_id = reset($arrFileIds_noSchedlock) ;
			} elseif( $arrFileIds ) {
				$target_file_filerecord_id = reset($arrFileIds) ;
			}
			
			
			// Execution d'une action de communication
			if( $target_file_filerecord_id ) {
				foreach( $account_record['files'] as $accountFile_record ) {
					if( $accountFile_record['file_filerecord_id'] == $target_file_filerecord_id ) {
						$target_file_record = $accountFile_record ;
					}
				}
				
				$forward_post = array() ;
				$forward_post['link_status'] = $target_file_record['status'] ;
				$forward_post['link_action'] = 'MAIL_IN' ;
				$forward_post['inpostal_filerecord_id'] = $inpostal_filerecord_id ;
				
				$post_data = array(
					'file_filerecord_id' => $target_file_record['file_filerecord_id'],
					'data' => json_encode($forward_post)
				);
				$json = specRsiRecouveo_action_doFileAction($post_data) ;
				$fileaction_filerecord_id = $json['fileaction_filerecord_id'] ;
				$arr_update = array() ;
				$arr_update['field_DATE_ACTUAL'] = $src['field_DATE_RECEP'] ;
				paracrm_lib_data_updateRecord_file( 'FILE_ACTION', $arr_update, $fileaction_filerecord_id);
				
				
				if( !$map_status[$target_file_record['status']]['sched_lock'] ) {
					$post_data = array(
						'file_filerecord_id' => $target_file_record['file_filerecord_id'],
						'data' => json_encode(array(
							'link_status' => $target_file_record['status'],
							'link_action' => 'BUMP',
							
						))
					);
					$json = specRsiRecouveo_action_doFileAction($post_data) ;
					if( $json['next_fileaction_filerecord_id'] ) {
						$next_fileaction_filerecord_id = $json['next_fileaction_filerecord_id'] ;
						$arr_update = array() ;
						$arr_update['field_LINK_TXT'] = 'Nouveau courrier entrant' ;
						paracrm_lib_data_updateRecord_file( 'FILE_ACTION', $arr_update, $next_fileaction_filerecord_id);
					}
				} else {
					// insertion manuelle
					$arr_update = array() ;
					$arr_update['field_LINK_STATUS'] = $target_file_record['status'] ;
					$arr_update['field_LINK_ACTION'] = 'BUMP' ;
					$arr_update['field_DATE_SCHED'] = date('Y-m-d') ;
					$arr_update['field_LINK_TXT'] = 'Nouveau courrier' ;
					paracrm_lib_data_insertRecord_file( 'FILE_ACTION', $target_file_record['file_filerecord_id'], $arr_update );
				}
				
				
				$arr_ins = array() ;
				$arr_ins['field_LINK_IS_ON'] = 1 ;
				$arr_ins['field_LINK_FILE_ACTION_ID'] = $fileaction_filerecord_id ;
				paracrm_lib_data_updateRecord_file( 'IN_POSTAL', $arr_ins, $inpostal_filerecord_id);
			}
	}
	
	return ;
}


?>
