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

?>
