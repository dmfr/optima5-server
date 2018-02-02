<?php

function specRsiRecouveo_mail_doFetch($post_data) {
	sleep(1) ;
	
	specRsiRecouveo_lib_mail_sync() ;
	
	return array('success'=>true) ;
}

function specRsiRecouveo_mail_getMboxGrid($post_data) {
	global $_opDB ;
	
	if( $post_data['filter_mbox'] ) {
		$filter_mbox = $post_data['filter_mbox'] ;
	}
	if( $post_data['filter_emailAdr_arr'] ) {
		$filter_emailAdr_arr = $_opDB->makeSQLlist( json_decode($post_data['filter_emailAdr_arr'],true) ) ;
	}
	
	$TAB_emaillist = array() ;
	
	$query = "SELECT e.* FROM view_file_EMAIL e" ;
	$query.= " WHERE 1" ;
	if( isset($filter_mbox) ) {
		$query.= " AND e.field_MBOX='{$filter_mbox}'" ;
	}
	if( isset($filter_emailAdr_arr) ) {
		$query.= " AND e.field_EMAIL_LOCAL IN {$filter_emailAdr_arr}" ;
	}
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$record = array(
			'email_filerecord_id' => $arr['filerecord_id'],
			
			'mbox' => $arr['field_MBOX'],
			'email_local' => $arr['field_EMAIL_LOCAL'],
			'email_peer' => $arr['field_EMAIL_PEER'],
			'email_peer_name' => $arr['field_EMAIL_PEER_NAME'],
			'date' => $arr['field_DATE'],
			'subject' => $arr['field_SUBJECT'],
			'has_attachments' => $arr['field_HAS_ATTACHMENTS']
		);
		
		$TAB_emaillist[$arr['filerecord_id']] = $record ;
	}
	return array('success'=>true, 'data'=>array_values($TAB_emaillist)) ;
}

function specRsiRecouveo_mail_getEmailRecord($post_data) {
	global $_opDB ;
	
	$email_filerecord_id = $post_data['email_filerecord_id'] ;
	
	$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
	$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;
	
	$query = "SELECT filerecord_id FROM view_file_EMAIL_SOURCE WHERE filerecord_parent_id='{$email_filerecord_id}'" ;
	$emailsrc_filerecord_id = $_opDB->query_uniqueValue($query) ;
	
	media_contextOpen( $_sdomain_id ) ;
	
	$media_id = media_bin_toolFile_getId('EMAIL_SOURCE',$emailsrc_filerecord_id) ;
	$bin = media_bin_getBinary($media_id) ;
	
	media_contextClose() ;
	
			$obj_mimeParser = PhpMimeMailParser::getInstance() ;
			$obj_mimeParser->setText($bin) ;
			
			$html_content = $obj_mimeParser->getMessageBody('htmlEmbedded') ;
			if( !trim($html_content) ) {
				$html_content = htmlspecialchars( $obj_mimeParser->getMessageBody('text') ) ;
			}
	
	return array('success'=>true, 'subject'=> $obj_mimeParser->getHeader('subject'), 'html'=>$html_content ) ;
}

?>
