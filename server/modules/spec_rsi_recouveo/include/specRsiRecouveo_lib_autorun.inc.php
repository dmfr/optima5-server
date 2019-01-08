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
		$arr_ins['field_FILE_ID'] = $account_record['acc_id'].'/'.'OFF' ;
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
		}
		
		specRsiRecouveo_file_lib_manageActivate($account_record['acc_id']) ;
		specRsiRecouveo_file_lib_updateStatus($account_record['acc_id']) ;
		specRsiRecouveo_account_lib_checkAdrStatus($account_record['acc_id']) ;
	}
}
function specRsiRecouveo_lib_autorun_manageActivate() {
	global $_opDB ;
	
	$arr_acc = array() ;
	$query = "SELECT distinct f.field_LINK_ACCOUNT FROM view_file_RECORD r
				JOIN view_file_RECORD_LINK rl 
				 ON rl.filerecord_parent_id=r.filerecord_id AND rl.field_LINK_IS_ON='1'
				JOIN view_file_FILE f
				 ON f.filerecord_id = rl.field_LINK_FILE_ID
				WHERE f.field_STATUS IN ('S0_PRE','S1_OPEN','S1_SEARCH') 
				AND f.field_STATUS_CLOSED_END='0' AND f.field_STATUS_CLOSED_VOID='0'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$arr_acc[] = $arr[0] ;
	}
	
	foreach( $arr_acc as $acc_id ) {
		specRsiRecouveo_file_lib_manageActivate($acc_id) ;
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
		&& $next_action['link_action']=='MAIL_OUT'
		&& $next_action['link_action'] == $scenstep['link_action']
		&& $next_action['link_tpl'] == $scenstep['link_tpl'] ) {
		
			specRsiRecouveo_action_execMailAutoAction( array(
				'file_filerecord_id' => $file_filerecord_id,
				'fileaction_filerecord_id' => $nextaction_filerecord_id
			)) ;
		}
	}
}



function specRsiRecouveo_lib_autorun_adrbook() {
	global $_opDB ;
	
	// Comptes sans adr prio
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
	
	foreach( $arr_accIds as $t_acc_id ) {
		specRsiRecouveo_account_lib_checkAdrStatus($t_acc_id) ;
	}
	
	
	
	
	
	
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
		specRsiRecouveo_account_lib_checkAdrStatus($t_acc_id) ;
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
				
				specRsiRecouveo_account_lib_checkAdrStatus( $src['field_REF_ACCOUNT'] ) ;
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
				$forward_post['next_action_save'] = true ;
				
				$post_data = array(
					'file_filerecord_id' => $target_file_record['file_filerecord_id'],
					'data' => json_encode($forward_post)
				);
				$json = specRsiRecouveo_action_doFileAction($post_data) ;
				$fileaction_filerecord_id = $json['fileaction_filerecord_id'] ;
				$arr_update = array() ;
				$arr_update['field_DATE_ACTUAL'] = $src['field_DATE_RECEP'] ;
				paracrm_lib_data_updateRecord_file( 'FILE_ACTION', $arr_update, $fileaction_filerecord_id);
				
				$arr_ins = array() ;
				$arr_ins['field_LINK_IS_ON'] = 1 ;
				$arr_ins['field_LINK_FILE_ACTION_ID'] = $fileaction_filerecord_id ;
				paracrm_lib_data_updateRecord_file( 'IN_POSTAL', $arr_ins, $inpostal_filerecord_id);
				
				
				specRsiRecouveo_account_pushNotificationFileaction( array(
					'acc_id' => $account_record['acc_id'],
					'txt_notification' => 'Nouveau courrier entrant',
					'fileactionFilerecordId' => $fileaction_filerecord_id
				));
			}
	}
	
	return ;
}


?>
