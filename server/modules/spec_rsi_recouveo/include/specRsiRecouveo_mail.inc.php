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
	if( $post_data['filter_includeLink']=='true' ) {
		$filter_includeLink = TRUE ;
	}
	
	$TAB_emaillist = array() ;
	
	$query = "SELECT e.*
				, la.field_ACC_ID as link_account, la.field_ACC_NAME as link_account_txt, lat.field_SOC_ID as link_soc, lat.field_SOC_NAME as link_soc_txt
				, f.filerecord_id as link_file_filerecord_id, f.field_FILE_ID as link_file_ref
				, fa.filerecord_id as link_fileaction_filerecord_id
				FROM view_file_EMAIL e" ;
	$query.= " LEFT OUTER JOIN view_file_FILE_ACTION fa ON fa.filerecord_id=e.field_LINK_FILE_ACTION_ID" ;
	$query.= " LEFT OUTER JOIN view_file_FILE f ON f.filerecord_id=fa.filerecord_parent_id" ;
	$query.= " LEFT OUTER JOIN view_bible_LIB_ACCOUNT_entry la ON la.entry_key=f.field_LINK_ACCOUNT" ;
	$query.= " LEFT OUTER JOIN view_bible_LIB_ACCOUNT_tree lat ON lat.treenode_key=la.treenode_key" ;
	$query.= " WHERE 1" ;
	if( isset($filter_mbox) ) {
		$query.= " AND e.field_MBOX='{$filter_mbox}'" ;
	}
	if( isset($filter_emailAdr_arr) ) {
		$query.= " AND e.field_EMAIL_LOCAL IN {$filter_emailAdr_arr}" ;
	}
	if( !$filter_includeLink ) {
		$query.= " AND e.field_LINK_IS_ON='0'" ;
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
			'has_attachments' => $arr['field_HAS_ATTACHMENTS'],
			
			'link_is_on' => false
		);
		if( $arr['field_LINK_IS_ON'] ) {
			$record['link_is_on'] = true ;
			$record += array(
				'link_soc' => $arr['link_soc'],
				'link_soc_txt' => $arr['link_soc_txt'],
				'link_account' => $arr['link_account'],
				'link_account_txt' => $arr['link_account_txt'],
				'link_file_filerecord_id' => $arr['link_file_filerecord_id'],
				'link_file_ref' => $arr['link_file_ref'],
				'link_fileaction_filerecord_id' => $arr['link_fileaction_filerecord_id']
			);
		}
		
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
		'attachments' => array(),
		
		'link_is_on' => false
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
			'multipart_attachment_idx' => $attach_idx,
			'filename' => $objAttach->getFilename(),
			'filetype' => $objAttach->getContentType()
		);
	}
	
	// Link ?
	$query = "SELECT field_LINK_IS_ON, field_LINK_FILE_ACTION_ID FROM view_file_EMAIL WHERE filerecord_id='{$email_filerecord_id}'" ;
	$result = $_opDB->query($query) ;
	$arr = $_opDB->fetch_row($result) ;
	if( $arr[0] ) {
		$fileaction_filerecord_id = $arr[1] ;
		$query = "SELECT la.field_ACC_ID as link_account, la.field_ACC_NAME as link_account_txt, lat.field_SOC_ID as link_soc, lat.field_SOC_NAME as link_soc_txt
							, f.filerecord_id as link_file_filerecord_id, f.field_FILE_ID as link_file_ref
							, fa.filerecord_id as link_fileaction_filerecord_id
					FROM view_file_FILE_ACTION fa
					JOIN view_file_FILE f ON f.filerecord_id=fa.filerecord_parent_id
					JOIN view_bible_LIB_ACCOUNT_entry la ON la.entry_key=f.field_LINK_ACCOUNT
					JOIN view_bible_LIB_ACCOUNT_tree lat ON lat.treenode_key=la.treenode_key
					WHERE fa.filerecord_id='{$fileaction_filerecord_id}'" ;
		$result = $_opDB->query($query) ;
		$model['link_is_on'] = true ;
		$model += $_opDB->fetch_assoc($result) ;
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
	$multipart_attachment_idx = $post_data['multipart_attachment_idx'] ;
	
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
		if( $attach_idx != $multipart_attachment_idx ) {
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


function specRsiRecouveo_mail_associateFile($post_data) {
	sleep(1) ;
	$data = json_decode($post_data['data'],true) ;
	specRsiRecouveo_lib_mail_associateFile( $post_data['email_filerecord_id'], $data['ref_account'], $data['adrbook_entity_select'], $data['file_select'] ) ;
	
	return array('success'=>true, 'error'=>'Test') ;
}
function specRsiRecouveo_mail_associateCancel($post_data) {
	sleep(1) ;
	specRsiRecouveo_lib_mail_associateCancel( $post_data['email_filerecord_id'] ) ;
	
	return array('success'=>true, 'error'=>'Test') ;
}




function specRsiRecouveo_mail_uploadEmailAttachment($post_data){

	media_contextOpen( $_POST['_sdomainId'] ) ;
	
	foreach( $_FILES as $mkey => $dummy ) {
		$src_filename = $_FILES[$mkey]['name'] ;
		$src_path = $_FILES[$mkey]['tmp_name'] ;
		
		if( function_exists('finfo_open') ) {
			$finfo = finfo_open(FILEINFO_MIME_TYPE);
			$mimetype = finfo_file($finfo, $src_path) ;
		} elseif( $src_filename ) {
			$ttmp = explode('.',$src_filename) ;
			$mimetype = end($ttmp) ;
		} else {
			return array('success'=>false, 'error'=>'Upload vide ?') ;
		}

		$media_id = media_bin_processUploaded( $src_path ) ;
		break;
	}
	if( !$media_id ) {
		return array('success'=>false, 'error'=>'Pas de media id') ;
	}

	$media_size = /*round(((filesize($src_path)*9.77)/10000),1)*/ filesize($src_path);
	$json = array(
		'success'=>true,
		'data'=>array(
			'media_id'=>$media_id,
			'filename'=>$src_filename,
			'size'=>$media_size,
			'path'=>$src_path
		)
	) ;

	media_contextClose() ;
	return $json ;	

}
function specRsiRecouveo_mail_deleteTmpMedias( $post_data ) {
	$p_arrMediaIds = json_decode($post_data['arr_media_id']) ;
	foreach( $p_arrMediaIds as $media_id ) {
		media_contextOpen( $_POST['_sdomainId'] ) ;
		media_pdf_delete($media_id) ;
		media_contextClose() ;
	}
	return array('success'=>true) ;
}


?>
