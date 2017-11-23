<?php

function specRsiRecouveo_lib_autorun_open() {
	global $_opDB ;
	
	$arr_acc = array() ;
	$query = "SELECT distinct field_LINK_ACCOUNT FROM view_file_RECORD r
				LEFT OUTER JOIN view_file_RECORD_LINK rl 
				 ON rl.filerecord_parent_id=r.filerecord_id AND rl.field_LINK_IS_ON='1'
				WHERE r.field_TYPE='' AND rl.filerecord_id IS NULL" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$arr_acc[] = $arr[0] ;
	}
	
	
	foreach( $arr_acc as $acc_id ) {
		$ttmp = specRsiRecouveo_account_open(array('acc_id'=>$acc_id)) ;
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
			
			$ids[] = $accountFileBlankRecord_record['record_filerecord_id'] ;
		}
		
		$forward_post = array() ;
		$forward_post['acc_id'] = $account_record['acc_id'] ;
		$forward_post['arr_recordIds'] = json_encode($ids) ;
		$forward_post['new_action_code'] = 'BUMP' ;
		$forward_post['form_data'] = json_encode(array()) ;
		$ret = specRsiRecouveo_file_createForAction($forward_post) ;
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
			$map_scenCode_scenstepCode_step[$scenario['scen_code']][$scenstep['scenstep_code']] = $scenstep ;
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
		$scenstep_code = $next_action['scenstep_code'] ;
		if( !$scen_code || !$scenstep_code ) {
			continue ;
		}
		$scenstep = $map_scenCode_scenstepCode_step[$scen_code][$scenstep_code] ;
		if( !$scenstep ) {
			continue ;
		}
		
		if( $scenstep['exec_is_auto'] 
		&& $action['link_action']=='MAIL_OUT'
		&& $action['link_action'] == $scenstep['link_action']
		&& $action['link_tpl'] == $scenstep['link_tpl'] ) {
		
			$forward_post = array() ;
			$forward_post['fileaction_filerecord_id'] = $next_action['fileaction_filerecord_id'] ;
			$forward_post['link_status'] = $file['status'] ;
			$forward_post['link_action'] = $action['link_action'] ;
			
			
			// recherche adresse
			$t_adrPost_name = $t_adrPost_txt = NULL ;
			$json = specRsiRecouveo_account_open( array('acc_id'=>$file['acc_id']) ) ;
			$account = $json['data'] ;
			foreach( $account['adrbook'] as $adrbook ) {
				foreach( $adrbook['adrbookentries'] as $adrbookentry ) {
					if( $adrbookentry['adr_type']=='POSTAL' && $adrbookentry['status_is_priority'] ) {
						$t_adrPost_name = ($adrbook['adr_entity_name'] ? $adrbook['adr_entity_name'] : $account['acc_name']) ;
						$t_adrPost_txt = $adrbookentry['adr_txt'] ;
					}
				}
			}
			if( !$t_adrPost_txt ) {
				continue ;
			}
			$forward_post['tpl_id'] = $action['link_tpl'] ;
			$forward_post['adrpost_entity_name'] = $t_adrPost_name ;
			$forward_post['adrpost_txt'] = $t_adrPost_txt ;
			
			
			// next action ?
			$json = specRsiRecouveo_file_getScenarioLine( array(
				'file_filerecord_id' => $file_filerecord_id,
				'fileaction_filerecord_id' => $nextaction_filerecord_id
			)) ;
			foreach( $json['data'] as $scenline_dot ) {
				if( $scenline_dot['is_next'] ) {
					$forward_post['next_action'] = $scenline_dot['link_action'] ;
					$forward_post['scen_code'] = $scen_code ;
					$forward_post['next_scenstep_code'] = $scenline_dot['scenstep_code'] ;
					$forward_post['next_scenstep_tag'] = $scenline_dot['scenstep_tag'] ;
					$forward_post['next_date'] = $scenline_dot['date_sched'] ;
				}
			}
			
			$post_data = array(
				'file_filerecord_id' => $file['file_filerecord_id'],
				'data' => json_encode($forward_post)
			);
			specRsiRecouveo_action_doFileAction($post_data) ;
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
	
	foreach( $arr_accIds as $acc_id ) {
		$query = "UPDATE view_file_ADRBOOK_ENTRY ae
				JOIN view_file_ADRBOOK a ON a.filerecord_id=ae.filerecord_parent_id
				SET ae.field_STATUS_IS_PRIORITY='0'
				WHERE a.field_ACC_ID='{$acc_id}' AND ae.field_STATUS_IS_INVALID='1'" ;
		$_opDB->query($query) ;
				
		
		$ttmp = specRsiRecouveo_account_open(array('acc_id'=>$acc_id)) ;
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
		echo $acc_id."\n" ;
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
	
	foreach($arr_searchAccIds as $acc_id) {
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


?>
