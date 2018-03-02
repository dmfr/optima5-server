<?php

@include_once 'PHPMailer/PHPMailerAutoload.php';

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
		$imap = @imap_open($hostname,$username,$password) ;
		if( !$imap ) {
			//echo "failed to connect/login {{$hostname}}\n" ;
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
	
	specRsiRecouveo_lib_mail_probeInboxEmail() ;
	
	
	$mbox = 'OUTBOX' ;
	$arr_emailFilerecordIds = array() ;
	$query = "LOCK TABLES view_file_EMAIL WRITE" ;
	$_opDB->query($query) ;
	$query = "SELECT filerecord_id FROM view_file_EMAIL WHERE field_MBOX='{$mbox}' AND field_SRV_IS_SENT<>'1'" ;
	$result = $_opDB->query( $query ) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$arr_emailFilerecordIds[] = $arr[0] ;
		$query = "UPDATE view_file_EMAIL SET field_SRV_IS_SENT='1' WHERE filerecord_id='{$arr[0]}'" ;
		$_opDB->query( $query ) ;
	}
	$query = "UNLOCK TABLES" ;
	$_opDB->query($query) ;
	
	foreach( $arr_emailFilerecordIds as $email_filerecord_id ) {
		specRsiRecouveo_lib_mail_doSend($email_filerecord_id) ;
	}
	
	
	return ;
}
function specRsiRecouveo_lib_mail_probeInboxEmail( $email_filerecord_id=NULL ) {
	global $_opDB ;
	$mbox = 'INBOX' ;
	
	if( !$email_filerecord_id ) {
		$arr_emailFilerecordIds = array() ;
		$query = "SELECT filerecord_id FROM view_file_EMAIL WHERE field_MBOX='{$mbox}' AND field_LINK_IS_ON<>'1'" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$arr_emailFilerecordIds[] = $arr[0] ;
		}
		foreach( $arr_emailFilerecordIds as $email_filerecord_id ) {
			specRsiRecouveo_lib_mail_probeInboxEmail($email_filerecord_id) ;
		}
	}
	
	/*
	Règles d'analyse
	- sujet du mail : match 1-1
	- expéditeur: en contact privilégié
	- unique dans un seul contact
	*/
	$query = "SELECT * FROM view_file_EMAIL WHERE filerecord_id='{$email_filerecord_id}'" ;
	$result = $_opDB->query($query) ;
	$email_db = $_opDB->fetch_assoc($result) ;
	if( !$email_db || ($email_db['field_MBOX']!=$mbox) || ($email_db['field_LINK_IS_ON']) ) {
		return FALSE ;
	}
	$fromSubject = $email_db['field_SUBJECT'] ;
	$fromAdr = strtolower($email_db['field_EMAIL_PEER']) ;
	
	if( $file_filerecord_id = specRsiRecouveo_lib_mail_decodeSubject($fromSubject) ) {
		$ttmp = specRsiRecouveo_file_getRecords( array(
			'filter_fileFilerecordId_arr' => json_encode(array($file_filerecord_id))
		)) ;
		if( count($ttmp['data'])==1 ) {
			$file_record = $ttmp['data'][0] ;
			$acc_id = $file_record['acc_id'] ;
			specRsiRecouveo_lib_mail_associateFile( $email_filerecord_id, $acc_id, NULL, $file_filerecord_id ) ;
			return TRUE ;
		}
	}
	
	foreach( array(1,0) as $check_priority ) {
		$query = "SELECT distinct a.field_ACC_ID
					FROM view_file_ADRBOOK a
					JOIN view_file_ADRBOOK_ENTRY ae ON ae.filerecord_parent_id=a.filerecord_id
					WHERE field_ADR_TYPE='EMAIL' AND LOWER(field_ADR_TXT)='$fromAdr'
					AND field_STATUS_IS_INVALID<>'1'";
		if( $check_priority ) {
			$query.= " AND field_STATUS_IS_PRIORITY='1'" ;
		}
		$result = $_opDB->query($query) ;
		if( $_opDB->num_rows($result)==1 ) {
			$arr = $_opDB->fetch_row($result) ;
			$acc_id = $arr[0] ;
			specRsiRecouveo_lib_mail_associateFile( $email_filerecord_id, $acc_id, NULL, NULL ) ;
			return TRUE ;
		}
	}
	
	return FALSE ;
}
function specRsiRecouveo_lib_mail_doSend($email_filerecord_id) {
	global $_opDB ;
	
	$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
	$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;
	
	media_contextOpen( $_sdomain_id ) ;
	
	while( TRUE ) {
		$query = "SELECT * FROM view_file_EMAIL WHERE filerecord_id='{$email_filerecord_id}'" ;
		$result = $_opDB->query($query) ;
		$email_row = $_opDB->fetch_assoc($result) ;
		
		$query = "SELECT filerecord_id FROM view_file_EMAIL_SOURCE WHERE filerecord_parent_id='{$email_filerecord_id}'" ;
		$emailsrc_filerecord_id = $_opDB->query_uniqueValue($query) ;
		
		if( $email_row && $emailsrc_filerecord_id ) {} else {
			break ;
		}
		
		$media_id = media_bin_toolFile_getId('EMAIL_SOURCE',$emailsrc_filerecord_id) ;
		$email_bin = media_bin_getBinary($media_id) ;
		
		$success = Email::sendMail($email_bin) ;
		break ;
	}
	
	if( $success ) {
		$msg_uid = -1 ;
		$ttmp = specRsiRecouveo_cfg_getConfig() ;
		$cfg_email = $ttmp['data']['cfg_email'] ;
		foreach( $cfg_email as $cfg_email_entry ) {
			if( $email_row['field_EMAIL_LOCAL']==$cfg_email_entry['email_adr'] ) {
				$hostname = '{'.$cfg_email_entry['server_url'].'}'.'INBOX' ;
				$username = $cfg_email_entry['server_username'];
				$password = $cfg_email_entry['server_passwd'];
				if( $imap = @imap_open($hostname,$username,$password) ) {
					$mboxes = imap_list($imap,'{'.$cfg_email_entry['server_url'].'}','*') ;
					$target_mbox = NULL ;
					foreach( $mboxes as $mbox_test ) {
						if( substr($mbox_test,-4) == 'Sent' ) {
							$target_mbox = $mbox_test ;
						}
					}
					imap_reopen( $imap , $target_mbox ) ;
					$target_uids_before = imap_search($imap, 'ALL', SE_UID);
					if( !is_array($target_uids_before) ) {
						$target_uids_before = array() ;
					}
					imap_append($imap, $target_mbox,$email_bin, "\\Seen");
					$target_uids_after = imap_search($imap, 'ALL', SE_UID);
					if( !is_array($target_uids_after) ) {
						$target_uids_after = array() ;
					}
					imap_close($imap) ;
					$new_uids = array_diff($target_uids_after,$target_uids_before) ;
					if( count($new_uids)==1 ) {
						$msg_uid = reset($new_uids) ;
					}
				}
			}
		}
		
		$msg_uid ;
		$query = "UPDATE view_file_EMAIL SET field_SRV_IS_SENT='1', field_SRV_UID='{$msg_uid}' WHERE filerecord_id='$email_filerecord_id'" ;
		$_opDB->query( $query ) ;
	} else {
		$query = "UPDATE view_file_EMAIL SET field_SRV_IS_SENT='0' WHERE filerecord_id='$email_filerecord_id'" ;
		$_opDB->query( $query ) ;
	}
	
	media_contextClose() ;
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
		if( !$target_adrbookEntity ) {
			break ;
		}
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
	
	if( $target_fileFilerecordId ) {
		foreach( $account_record['files'] as $accountFile_record ) {
			if( $accountFile_record['file_filerecord_id'] == $target_fileFilerecordId ) {
				$target_file_record = $accountFile_record ;
				if( $accountFile_record['status_closed_void'] || $accountFile_record['status_closed_end'] ) {
					unset($target_fileFilerecordId) ;
				}
			}
		}
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
		$forward_post['link_action'] = 'EMAIL_IN' ;
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

function specRsiRecouveo_lib_mail_associateCancel( $src_emailFilerecordId ) {
	global $_opDB ;
	
	$json = specRsiRecouveo_mail_getEmailRecord( array('email_filerecord_id'=>$src_emailFilerecordId) ) ;
	$email_record = $json['data'] ;
	if( !$email_record['link_is_on'] ) {
		return FALSE ;
	}
	
	$peer_from_address = NULL ;
	foreach( $email_record['header_adrs'] as $emailadr_record ) {
		if( $emailadr_record['header'] == 'from' && !(strpos($emailadr_record['adr_address'],'@')===0) ) {
			$peer_from_address = $emailadr_record['adr_address'] ;
		}
	}
	
	$target_accId = $email_record['link_account'] ;
	$ttmp = specRsiRecouveo_account_open(array('acc_id'=>$target_accId)) ;
	$account_record = $ttmp['data'] ;
	
	
	$toDelete_adrbookFilerecordId ;
	$toDelete_adrbookEntryFilerecordId ;
	foreach( $account_record['adrbook'] as $adrbook_record ) {
		foreach( $adrbook_record['adrbookentries'] as $adrbookentry_record ) {
			if( ($adrbookentry_record['adr_type'] == 'EMAIL') && ($adrbookentry_record['adr_txt'] == $peer_from_address) ) {
				$toDelete_adrbookEntryFilerecordId = $adrbookentry_record['adrbookentry_filerecord_id'] ;
				if( count($adrbook_record['adrbookentries']) == 1 ) {
					$toDelete_adrbookFilerecordId = $adrbook_record['adrbook_filerecord_id'] ;
				}
			}
		}
	}
	if( $toDelete_adrbookEntryFilerecordId ) {
		paracrm_lib_data_deleteRecord_file( 'ADRBOOK_ENTRY', $toDelete_adrbookEntryFilerecordId);
	}
	if( $toDelete_adrbookFilerecordId ) {
		paracrm_lib_data_deleteRecord_file( 'ADRBOOK', $toDelete_adrbookFilerecordId);
	}
	
	
	if( $email_record['link_fileaction_filerecord_id'] ) {
		paracrm_lib_data_deleteRecord_file( 'FILE_ACTION', $email_record['link_fileaction_filerecord_id']);
		
		$arr_ins = array() ;
		$arr_ins['field_LINK_IS_ON'] = 0 ;
		$arr_ins['field_LINK_FILE_ACTION_ID'] = 0 ;
		paracrm_lib_data_updateRecord_file( 'EMAIL', $arr_ins, $src_emailFilerecordId);
	}
	
	return TRUE ;
}


function specRsiRecouveo_lib_mail_buildEmail( $email_record, $test_mode=FALSE ) {
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_email = $ttmp['data']['cfg_email'] ;
	if( !class_exists('PHPMailer') ) {
		return NULL ;
	}
	
	$subject = trim($email_record['subject']) ;
	if( $email_record['outmodel_preprocess_subject'] && $email_record['outmodel_file_filerecord_id'] ) {
		$subject = specRsiRecouveo_lib_mail_processSubject( $subject, $email_record['outmodel_file_filerecord_id'] ) ;
	}
	
	if( true ) {
		if( !trim($email_record['body_html']) ) {
			$email_record['body_html'] = '&#160;' ;
		}
		// reassemble
		// = [banner] + blockwrite + [signature] + blockquote
		$doc = new DOMDocument();
		@$doc->loadHTML('<?xml encoding="UTF-8"><html>'.$email_record['body_html'].'</html>');
		
		$getDepth = function($node) {
			$depth = -1;
			// Increase depth until we reach the root (root has depth 0)
			while ($node != null)
			{
				$depth++;
				// Move to parent node
				$node = $node->parentNode;
			}
			return $depth;
		};
		$extractOuterBlockquote = function($domnode) use ( &$extractOuterBlockquote ) {
			if( !$domnode->childNodes ) {
				return NULL ;
			}
			foreach( $domnode->childNodes as $childNode ) {
				if( $childNode->nodeName == 'blockquote' ) {
					//$childNode->parentNoded = $domnode ;
					return $childNode ;
				}
				if( $ret = $extractOuterBlockquote($childNode) ) {
					return $ret ;
				}
			}
		};
		
		if( ($outerBlockQuote = $extractOuterBlockquote($doc)) ) {
			// blockquote / body / html = 3
			while( $getDepth($outerBlockQuote)>3 ) {
				$outerBlockQuote = $outerBlockQuote->parentNode ;
			}
		} else {
			unset( $outerBlockQuote ) ;
		}
		
		$elements = $doc->getElementsByTagName('body');
		$i = $elements->length - 1;
		while ($i > -1) {
			$node = $elements->item($i); 
			if( $getDepth($node) == 2 ) {
				// body / html = 2
				$bodyNode = $node ;
				break ;
			}
		}
		
		if( $email_record['outmodel_preprocess_signature'] ) {
			while(TRUE) {
				$fromAddress = NULL ;
				foreach( $email_record['header_adrs'] as $row ) {
					if( $row['header'] == 'from' ) {
						$fromAddress = $row['adr_address'] ;
						break ;
					}
				}
				if( !$fromAddress ) {
					break ;
				}
				
				foreach( $cfg_email as $row ) {
					if( $row['email_adr']==$fromAddress ) {
						$html_signature = trim($row['email_signature']) ;
						break ;
					}
				}
				if( !$html_signature ) {
					break ;
				}
				
				$html_signature = '<br>'.$html_signature.'<br>' ;
				$new_node = $doc->createCDATASection($html_signature) ;
				if( $outerBlockQuote ) {
					$bodyNode->insertBefore($new_node,$outerBlockQuote) ;
				} else {
					$bodyNode->appendChild($new_node) ;
				}
				break ;
			}
		}
		if( $email_record['outmodel_preprocess_banner'] && ($html_banner=specRsiRecouveo_lib_mail_getBanner($email_record['outmodel_file_filerecord_id'])) ) {
			$new_node = $doc->createCDATASection($html_banner) ;
			
			if( $firstChild = $bodyNode->firstChild ) {
				$bodyNode->insertBefore($new_node,$firstChild) ;
			} else {
				$bodyNode->appendChild($new_node) ;
			}
		}
		
		$email_record['body_html'] =  $doc->saveHTML() ;
	}
	
	
	$mail = new PHPMailer;
	$mail->CharSet = "utf-8";
	foreach( $email_record['header_adrs'] as $row ) {
		switch( $row['header'] ) {
			case 'from' :
			$mail->setFrom($row['adr_address'], $row['adr_display']);
			break ;
			
			case 'to' :
			$mail->addAddress($row['adr_address']) ;
			break ;
			
			case 'cc' :
			$mail->addCC($row['adr_address']) ;
			break ;
		}
	}
	$mail->Subject  = $subject ;
	if( $email_record['body_html'] ) {
		$mail->isHTML(true);
		$mail->Body = $email_record['body_html'];
		$mail->AltBody = strip_tags($email_record['body_html']) ;
	} elseif( $email_record['body_text'] ) {
		$mail->Body = $email_record['body_text'];
	} else {
		return NULL ;
	}
	
	$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
	$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;
	foreach( $email_record['attachments'] as $row ) {
		$filename = $row['filename'] ;
		$filetmpmediaid = $row['outmodel_tmp_media_id'] ;
		
		media_contextOpen( $_sdomain_id ) ;
		$bin = media_bin_getBinary($filetmpmediaid) ;
		media_contextClose() ;
		
		$mail->addStringAttachment($bin, $filename) ;
	}
	
	if (!$mail->preSend()) {
		// Return the error in the Browser's console
		//echo $mail->ErrorInfo;
		return NULL ;
	}
	
	$buffer = $mail->getSentMIMEMessage();
	
	if( $test_mode ) {
		return TRUE ;
	}
	media_contextOpen( $_sdomain_id ) ;
	$tmp_media_id = media_bin_processBuffer( $buffer ) ;
	media_contextClose() ;
	
	return $tmp_media_id ;
}


function specRsiRecouveo_lib_mail_processSubject( $subject, $file_filerecord_id ) {
	$subject = preg_replace("/\[[^)]+\]/","",$subject) ;
	
	$ctrlchar = md5((string)$file_filerecord_id)[0] ;
	$tag = "[#{$file_filerecord_id}{$ctrlchar}]" ;
	
	return $tag.' '.trim($subject) ;
}
function specRsiRecouveo_lib_mail_decodeSubject( $subject ) {
//preg_match('@^(?:http://)?([^/]+)@i',"http://www.php.net/index.html", $matches);
	preg_match("/\[\#(.+?)\]/",$subject,$match) ;
	if( !$match ) {
		return NULL ;
	}
	$ttmp = $match[1] ;
	$file_filerecord_id = substr($ttmp,0,strlen($ttmp)-1) ;
	if( md5((string)$file_filerecord_id)[0] == substr($ttmp,-1) ) {
		return $file_filerecord_id ;
	}
	return NULL ;
}

function specRsiRecouveo_lib_mail_getBanner( $file_filerecord_id ) {
	$templates_dir = $GLOBALS['templates_dir'] ;
	
	$file_filerecord_id ;
	$ttmp = specRsiRecouveo_file_getRecords( array(
		'filter_fileFilerecordId_arr' => json_encode(array($file_filerecord_id))
	)) ;
	$file_record = $ttmp['data'][0] ;
	
	$acc_id = $file_record['acc_id'] ;
	$ttmp = specRsiRecouveo_account_open(array('acc_id'=>$acc_id)) ;
	$account_record = $ttmp['data'] ;
	
	$txt_account = $account_record['soc_txt'] ;
	$txt_ref = $account_record['acc_id'] ;
	$tencours = 0 ;
	foreach( $account_record['files'] as $file_record ) {
		$tencours+= $file_record['inv_amount_due'] ;
	}
	$txt_encours = number_format($tencours,0,',','.').' €' ;
	
	$header_src = "\r\n" ;
	$header_src.= "<table><tr>" ;
		$logo_base64 = base64_encode( file_get_contents($templates_dir.'/'.'RSI_RECOUVEO_email_logo.jpg') ) ;
		$header_src.= "<td align='center'>" ;
		$header_src.= "<img src=\"data:image/jpeg;base64,$logo_base64\"/>" ;
		$header_src.= "</td>" ;
		
		$header_src.= "<td>" ;
			$table_style = 'color:#000000;font-family:Arial; font-size:12px; padding-left:6px; padding-right:6px' ;
			$header_src.= "<table style='margin-left:16px'>" ;
				$header_src.= "<tr>" ;
				$header_src.= "<td align='right' style='$table_style'><b>Votre créancier</b></td>" ;
				$header_src.= "<td style='$table_style'>{$txt_account}</td>" ;
				$header_src.= "</tr>" ;
				$header_src.= "<tr>" ;
				$header_src.= "<td align='right' style='$table_style'><b>Référence client</b></td>" ;
				$header_src.= "<td style='$table_style'>{$txt_ref}</td>" ;
				$header_src.= "</tr>" ;
				$header_src.= "<tr>" ;
				$header_src.= "<td align='right' style='$table_style'><b>Encours</b></td>" ;
				$header_src.= "<td style='$table_style'>{$txt_encours}</td>" ;
				$header_src.= "</tr>" ;
			$header_src.= "</table>" ;
		$header_src.= "</td>" ;
	$header_src.= "</tr></table>" ;
	$header_src.= "<hr>" ;

	return $header_src ;
}



function specRsiRecouveo_lib_mail_createEmailForAction( $email_record, $fileaction_filerecord_id ) {
	global $_opDB ;
	$mbox = 'OUTBOX' ;
	
	$tmp_media_id = specRsiRecouveo_lib_mail_buildEmail($email_record) ;
	
	foreach( $email_record['header_adrs'] as $row ) {
		if( $row['header']=='from' && !$addressFrom ) {
			$addressFrom = $row['adr_address'] ;
		}
		if( $row['header']=='to' && !$addressTo ) {
			$addressTo = array() ;
			$addressTo['address'] = $row['adr_address'] ;
			$addressTo['display'] = $row['adr_display'] ;
		}
	}
	
	$arr_ins = array() ;
	$arr_ins['field_MBOX'] = $mbox ;
	$arr_ins['field_EMAIL_LOCAL'] = $addressFrom ;
	$arr_ins['field_EMAIL_PEER'] = $addressTo['address'] ;
	$arr_ins['field_EMAIL_PEER_NAME'] = $addressTo['display'] ;
	$arr_ins['field_DATE'] = date('Y-m-d H:i:s') ;
	$arr_ins['field_SUBJECT'] = $email_record['subject'] ;
	$arr_ins['field_SRV_IS_SENT'] = false ;
	$arr_ins['field_SRV_UID'] = NULL ;
	$arr_ins['field_HAS_ATTACHMENTS'] = (count($email_record['attachments'])>0) ;
	$arr_ins['field_LINK_IS_ON'] = 1 ;
	$arr_ins['field_LINK_FILE_ACTION_ID'] = $fileaction_filerecord_id ;
	$email_filerecord_id = paracrm_lib_data_insertRecord_file( 'EMAIL', 0, $arr_ins ) ;
	
	$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
	$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;
	
	$arr_ins = array() ;
	$arr_ins['field_SRC_SIZE'] = strlen($msg_src) ;
	$arr_ins['field_SRC_MIME'] = true ;
	$emailsrc_filerecord_id = paracrm_lib_data_insertRecord_file( 'EMAIL_SOURCE', $email_filerecord_id, $arr_ins ) ;
	media_contextOpen( $_sdomain_id ) ;
	media_bin_move( $tmp_media_id , media_bin_toolFile_getId('EMAIL_SOURCE',$emailsrc_filerecord_id) ) ;
	media_contextClose() ;
	
	specRsiRecouveo_lib_mail_doSend($email_filerecord_id) ;
	
	return $email_filerecord_id ;
}
?>
