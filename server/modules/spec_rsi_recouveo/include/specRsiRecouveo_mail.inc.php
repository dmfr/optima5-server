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
	
	try {
		$obj_mimeParser = PhpMimeMailParser::getInstance() ;
		$obj_mimeParser->setText($bin) ;
	} catch( Exception $e ) {
		return array('success'=>false) ;
	}
	
	// Build RsiRecouveoEmailModel
	if( $date_obj = DateTime::createFromFormat( 'D, d M Y H:i:s O', trim(preg_replace("/\([^)]+\)/","",$obj_mimeParser->getHeader('date')))) ) {
		$date_ts = $date_obj->getTimestamp() ;
		$date = date('Y-m-d H:i:s',$date_ts) ;
	}
	$model = array(
		'email_filerecord_id' => $email_filerecord_id,
		'subject' => $obj_mimeParser->getHeader('subject'),
		'date_raw' => $obj_mimeParser->getHeader('date'),
		'date' => $date,
		'body_text' => $obj_mimeParser->getMessageBody('text'),
		'body_html' => $obj_mimeParser->getMessageBody('htmlEmbedded'),
		
		'header_adrs' => array(),
		'attachments' => array()
	);
	foreach( array('from','to','cc') as $mkey ) {
		foreach( $obj_mimeParser->getAddresses($mkey) as $adr ) {
			$model['header_adrs'][] = array(
				'header' => $mkey,
				'adr_address' => $adr['address'],
				'adr_display' => $adr['display']
			);
		}
	}
	foreach( $obj_mimeParser->getAttachments($include_inline=false) as $attach_idx => $objAttach ) {
		$model['attachments'][] = array(
			'attachment_idx' => $attach_idx,
			'filename' => $objAttach->getFilename(),
			'filetype' => $objAttach->getContentType()
		);
	}
	
	return array('success'=>true, 'data'=>$model, 'subject'=> $obj_mimeParser->getHeader('subject'), 'html'=>$html_content, 'debug'=>$obj_mimeParser->getHeaders() ) ;
}
function specRsiRecouveo_mail_tool_getHtmlFromRaw($plaintext) {
	$str = $plaintext ;
	$str = htmlspecialchars($str) ;
	$str = nl2br($str) ;
	$str = '<font face="Monospace">'.$str.'</font>' ;
	return $str ;
}

function specRsiRecouveo_mail_downloadEmailAttachment($post_data) {
	global $_opDB ;
	
	$email_filerecord_id = $post_data['email_filerecord_id'] ;
	$email_attachment_idx = $post_data['email_attachment_idx'] ;
	
	$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
	$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;
	
	$query = "SELECT filerecord_id FROM view_file_EMAIL_SOURCE WHERE filerecord_parent_id='{$email_filerecord_id}'" ;
	$emailsrc_filerecord_id = $_opDB->query_uniqueValue($query) ;
	
	media_contextOpen( $_sdomain_id ) ;
	$media_id = media_bin_toolFile_getId('EMAIL_SOURCE',$emailsrc_filerecord_id) ;
	$bin = media_bin_getBinary($media_id) ;
	media_contextClose() ;
	
	try {
		$obj_mimeParser = PhpMimeMailParser::getInstance() ;
		$obj_mimeParser->setText($bin) ;
	} catch( Exception $e ) {
		return die() ;
	}

	foreach( $obj_mimeParser->getAttachments($include_inline=false) as $attach_idx => $objAttach ) {
		if( $attach_idx != $email_attachment_idx ) {
			continue ;
		}
		$desc = array(
			'attachment_idx' => $attach_idx,
			'filename' => $objAttach->getFilename(),
			'filetype' => $objAttach->getContentType()
		);
		$stream = $objAttach->getStream() ;
		break ;
	}
	if( !$desc ) {
		die() ;
	}
	
	$filename = $desc['filename'] ;
	header("Content-Type: {$desc['filetype']}; name=\"$filename\""); 
	header("Content-Disposition: attachment; filename=\"$filename\""); 
	fpassthru($stream) ;
	//unlink($tmpfilename) ;
	die() ;
}


?>
