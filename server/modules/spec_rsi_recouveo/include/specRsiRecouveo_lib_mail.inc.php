<?php

$GLOBALS['specRsiRecouveo_lib_mail_sync_boundDays'] = 30 ;

function specRsiRecouveo_lib_mail_sync() {
	global $_opDB ;
	
	$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
	$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;
	
	media_contextOpen( $_sdomain_id ) ;
	
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_email = $ttmp['data']['cfg_email'] ;
	
	$mbox = 'INBOX' ;
	foreach( $cfg_email as $cfg_email_entry ) {
		/* connect to gmail */
		$hostname = '{'.$cfg_email_entry['server_url'].'}'.$mbox ;
		$username = $cfg_email_entry['server_username'];
		$password = $cfg_email_entry['server_passwd'];

		/* try to connect */
		$imap = imap_open($hostname,$username,$password) ;
		if( !$imap ) {
			echo "failed to connect/login {{$hostname}}\n" ;
			continue ;
		}
		$inbox_uids = imap_search($imap, 'ALL', SE_UID);
		if( !$inbox_uids ) {
			continue ;
		}
		
		// query exiting uids in database
		$existing_uids = array() ;
		$query = "SELECT field_SRV_UID FROM view_file_EMAIL WHERE field_MBOX='{$mbox}'" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$existing_uids[] = $arr[0] ;
		}
		
		$toFetch_uids = array_diff($inbox_uids,$existing_uids) ;
		sort($toFetch_uids) ;
		
		
		foreach( $toFetch_uids as $msg_uid ) {
			$msg_src = imap_fetchbody($imap, $msg_uid, NULL, FT_UID | FT_PEEK) ;
			$tmp_id = media_bin_processBuffer( $msg_src ) ;
			
			//echo $msg_src ;
			
			$obj_mimeParser = PhpMimeMailParser::getInstance() ;
			$obj_mimeParser->setText($msg_src) ;
			
			$from = $obj_mimeParser->getHeader('from');             // "test" <test@example.com>
			$addressesFrom = $obj_mimeParser->getAddresses('from');
			$addressFrom = $addressesFrom[0] ;
			$addressTo = $cfg_email_entry['email_adr'] ;
			$subject = $obj_mimeParser->getHeader('subject') ;
			if( $date_obj = DateTime::createFromFormat( 'D, d M Y H:i:s O', trim(preg_replace("/\([^)]+\)/","",$obj_mimeParser->getHeader('date'))) ) ) {
				$date_ts = $date_obj->getTimestamp() ;
				$date = date('Y-m-d H:i:s',$date_ts) ;
			}
			$has_attachments = (count($obj_mimeParser->getAttachments($include_inline=false))>0) ;
			
			
			$arr_ins = array() ;
			$arr_ins['field_MBOX'] = $mbox ;
			$arr_ins['field_EMAIL_LOCAL'] = $addressTo ;
			$arr_ins['field_EMAIL_PEER'] = $addressFrom['address'] ;
			$arr_ins['field_EMAIL_PEER_NAME'] = $addressFrom['display'] ;
			$arr_ins['field_DATE'] = $date ;
			$arr_ins['field_SUBJECT'] = $subject ;
			$arr_ins['field_SRV_IS_SENT'] = true ;
			$arr_ins['field_SRV_UID'] = $msg_uid ;
			$arr_ins['field_HAS_ATTACHMENTS'] = $has_attachments ;
			$email_filerecord_id = paracrm_lib_data_insertRecord_file( 'EMAIL', 0, $arr_ins ) ;
			
			$arr_ins = array() ;
			$arr_ins['field_SRC_SIZE'] = strlen($msg_src) ;
			$arr_ins['field_SRC_MIME'] = true ;
			$emailsrc_filerecord_id = paracrm_lib_data_insertRecord_file( 'EMAIL_SOURCE', $email_filerecord_id, $arr_ins ) ;
			media_bin_move( $tmp_id , media_bin_toolFile_getId('EMAIL_SOURCE',$emailsrc_filerecord_id) ) ;
		}
	}
	
	media_contextClose() ;
	
	return ;
}


function specRsiRecouveo_lib_mail_associateFile( $src_emailFilerecordId, $target_accId, $target_adrbookEntity, $target_fileFilerecordId=NULL ) {
	global $_opDB ;
	
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_status = $ttmp['data']['cfg_status'] ;
	$map_status = array() ;
	foreach( $cfg_status as $status ) {
		$map_status[$status['status_id']] = $status ;
	}
	
	$json = specRsiRecouveo_mail_getEmailRecord( array('email_filerecord_id'=>$src_emailFilerecordId) ) ;
	$email_record = $json['data'] ;
	if( $email_record['link_is_on'] ) {
		return FALSE ;
	}
	$peer_from_address = NULL ;
	foreach( $email_record['header_adrs'] as $emailadr_record ) {
		if( $emailadr_record['header'] == 'from' && !(strpos($emailadr_record['adr_address'],'@')===0) ) {
			$peer_from_address = $emailadr_record['adr_address'] ;
		}
	}
	
	
	$ttmp = specRsiRecouveo_account_open(array('acc_id'=>$target_accId)) ;
	$account_record = $ttmp['data'] ;
	
	while( TRUE ) {
		$target_adrbookFilerecordId = NULL ;
		foreach( $account_record['adrbook'] as $adrbook_record ) {
			if( $adrbook_record['adr_entity'] != $target_adrbookEntity ) {
				continue ;
			}
			$target_adrbookFilerecordId = $adrbook_record['adrbook_filerecord_id'] ;
			foreach( $adrbook_record['adrbookentries'] as $adrbookentry_record ) {
				if( ($adrbookentry_record['adr_type'] == 'EMAIL') && ($adrbookentry_record['adr_txt'] == $peer_from_address) ) {
					$target_adrbookEntryFilerecordId = $adrbookentry_record['adrbookentry_filerecord_id'] ;
				}
			}
		}
		
		
		if( !$target_adrbookFilerecordId ) {
			$arr_ins = array() ;
			$arr_ins['field_ACC_ID'] = $account_record['acc_id'] ;
			$arr_ins['field_ADR_ENTITY'] = $target_adrbookEntity ;
			$arr_ins['field_ADR_ENTITY_NAME'] = $target_adrbookEntity ;
			$target_adrbookFilerecordId = paracrm_lib_data_insertRecord_file( 'ADRBOOK', 0, $arr_ins );
		}
		if( !$target_adrbookEntryFilerecordId ) {
			$arr_ins = array() ;
			$arr_ins['field_ADR_TYPE'] = 'EMAIL' ;
			$arr_ins['field_ADR_TXT'] = $peer_from_address ;
			$target_adrbookEntryFilerecordId = paracrm_lib_data_insertRecord_file( 'ADRBOOK_ENTRY', $target_adrbookFilerecordId, $arr_ins );
		}
		$arr_update = array() ;
		$arr_update['field_STATUS_IS_CONFIRM'] = 1 ;
		paracrm_lib_data_updateRecord_file( 'ADRBOOK_ENTRY', $arr_update, $target_adrbookEntryFilerecordId);
		break ;
	}
	
	if( !$target_fileFilerecordId ) {
			foreach( $account_record['files'] as $accountFile_record ) {
				if( $accountFile_record['status_closed_void'] || $accountFile_record['status_closed_end'] ) {
					continue ;
				}
				$arrFileIds[] = $accountFile_record['file_filerecord_id'] ;
				if( !$map_status[$accountFile_record['status']]['sched_lock'] ) {
					$arrFileIds_noSchedlock[] = $accountFile_record['file_filerecord_id'] ;
				}
			}
			$target_fileFilerecordId = NULL ;
			if( $arrFileIds_noSchedlock ) {
				$target_fileFilerecordId = reset($arrFileIds_noSchedlock) ;
			} elseif( $arrFileIds ) {
				$target_fileFilerecordId = reset($arrFileIds) ;
			}
	}
	
	// Execution d'une action de communication
	if( $target_fileFilerecordId ) {
		foreach( $account_record['files'] as $accountFile_record ) {
			if( $accountFile_record['file_filerecord_id'] == $target_fileFilerecordId ) {
				$target_file_record = $accountFile_record ;
			}
		}
		
		$forward_post = array() ;
		$forward_post['link_status'] = $target_file_record['status'] ;
		$forward_post['link_action'] = 'MAIL_IN' ;
		$forward_post['email_filerecord_id'] = $src_emailFilerecordId ;
		
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
				$arr_update['field_LINK_TXT'] = 'Nouvel email' ;
				paracrm_lib_data_updateRecord_file( 'FILE_ACTION', $arr_update, $next_fileaction_filerecord_id);
			}
		}
		
		
		$arr_ins = array() ;
		$arr_ins['field_LINK_IS_ON'] = 1 ;
		$arr_ins['field_LINK_FILE_ACTION_ID'] = $fileaction_filerecord_id ;
		paracrm_lib_data_updateRecord_file( 'EMAIL', $arr_ins, $src_emailFilerecordId);
	}
	
	return TRUE ;
}

?>
