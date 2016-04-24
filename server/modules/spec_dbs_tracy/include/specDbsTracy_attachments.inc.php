<?php

function specDbsTracy_attachments_uploadfile($post_data) {
	media_contextOpen( $_POST['_sdomainId'] ) ;
	foreach( $_FILES as $mkey => $dummy ) {
		$media_id = media_img_processUploaded( $_FILES[$mkey]['tmp_name'], $_FILES[$mkey]['name'] ) ;
		break ;
	}
	media_contextClose() ;
	if( !$media_id ) {
		return array('success'=>false) ;
	}
	return array('success'=>true, 'data'=>array('tmp_id'=>$media_id)) ;
}
function specDbsTracy_attachments_setAttachment($post_data) {
	$p_parentFileCode = $post_data['parent_file_code'] ;
	$p_parentFilerecordId = $post_data['parent_filerecord_id'] ;
	$form_data = json_decode($post_data['data'],true) ;
		usleep(500000) ;
		
	$newrecord = array() ;
	//$newrecord['media_title'] = $_FILES['photo-filename']['name'] ;
	$newrecord['media_date'] = date('Y-m-d H:i:s') ;
	$newrecord['media_mimetype'] = 'image/jpeg' ;
	$newrecord['field_ATTACHMENT_DATE'] = $form_data['attachment_date'] ;
	$newrecord['field_ATTACHMENT_TXT'] = $form_data['attachment_txt'] ;
	if( $form_data['filerecord_id'] > 0 ) {
		$img_filerecordId = $form_data['filerecord_id'] ;
		switch( $p_parentFileCode ) {
			case 'order' :
				paracrm_lib_data_updateRecord_file( 'CDE_ATTACH', $newrecord, $img_filerecordId ) ;
				break ;
			default :
				paracrm_lib_data_updateRecord_file( 'ATTACH_INBOX', $newrecord, $img_filerecordId ) ;
				break ;
		}
		
	} elseif( $form_data['tmp_id'] ) {
		switch( $p_parentFileCode ) {
			case 'order' :
				$img_filerecordId = paracrm_lib_data_insertRecord_file( 'CDE_ATTACH', $p_parentFilerecordId, $newrecord ) ;
				break ;
			default :
				$img_filerecordId = paracrm_lib_data_insertRecord_file( 'ATTACH_INBOX', 0, $newrecord ) ;
				break ;
		}
		
		media_contextOpen( $_POST['_sdomainId'] ) ;
		media_img_move( $form_data['tmp_id'] , $img_filerecordId ) ;
		media_contextClose() ;
	} else {
		return array('success'=>false) ;
	}
	
	return array('success'=>true, 'data'=>array('filerecord_id'=>$img_filerecordId)) ;
}
function specDbsTracy_attachments_load($post_data) {
	$p_parentFileCode = $post_data['parent_file_code'] ;
	$p_parentFilerecordId = $post_data['parent_filerecord_id'] ;
	$attach_filerecordId = $post_data['filerecord_id'] ;
	
	switch( $p_parentFileCode ) {
		case 'order' :
			$data = paracrm_lib_data_getRecord_file('CDE_ATTACH',$attach_filerecordId) ;
			break ;
		default :
			$data = paracrm_lib_data_getRecord_file('ATTACH_INBOX',$attach_filerecordId) ;
			break ;
	}

	if( !$data ) {
		return array('success'=>false) ;
	}
	return array(
		'success' => true,
		'data' => array(
			'filerecord_id' => $data['filerecord_id'],
			'attachment_date' => substr($data['field_ATTACHMENT_DATE'],0,10),
			'attachment_txt' => $data['field_ATTACHMENT_TXT']
		)
	);
}
function specDbsTracy_attachments_delete($post_data) {
	$p_parentFileCode = $post_data['parent_file_code'] ;
	$p_parentFilerecordId = $post_data['parent_filerecord_id'] ;
	$attach_filerecordId = $post_data['filerecord_id'] ;
	
	media_contextOpen( $_POST['_sdomainId'] ) ;
	media_img_delete( $attach_filerecordId ) ;
	media_contextClose() ;
	
	if( is_numeric($attach_filerecordId) ) {
		switch( $p_parentFileCode ) {
			case 'order' :
				paracrm_lib_data_deleteRecord_file('CDE_ATTACH',$attach_filerecordId) ;
				break ;
			default :
				paracrm_lib_data_deleteRecord_file('ATTACH_INBOX',$attach_filerecordId) ;
				break ;
		}
	}

	return array('success'=>true) ;
}


function specDbsTracy_attachments_attach($post_data) {
	$p_parentFileCode = $post_data['parent_file_code'] ;
	$p_parentFilerecordId = $post_data['parent_filerecord_id'] ;
	$attach_filerecordId = $post_data['filerecord_id'] ;
	
	switch( $p_parentFileCode ) {
		case 'order' :
			$data = paracrm_lib_data_getRecord_file('ATTACH_INBOX',$attach_filerecordId) ;
			if( !$data ) {
				return array('success'=>false) ;
			}
			
			$arr_ins = array() ;
			$arr_ins['field_ATTACHMENT_DATE'] = $data['field_ATTACHMENT_DATE'] ;
			$arr_ins['field_ATTACHMENT_TXT'] = $data['field_ATTACHMENT_TXT'] ;
			$img_filerecordId = paracrm_lib_data_insertRecord_file( 'CDE_ATTACH', $p_parentFilerecordId, $arr_ins ) ;
			
			media_contextOpen( $_POST['_sdomainId'] ) ;
			media_img_move( $attach_filerecordId , $img_filerecordId ) ;
			media_contextClose() ;

			paracrm_lib_data_deleteRecord_file('ATTACH_INBOX',$attach_filerecordId) ;
			break ;
		default :
			return array('success'=>false) ;
	}

	return array('success'=>true) ;
}
function specDbsTracy_attachments_detach($post_data) {
	$p_parentFileCode = $post_data['parent_file_code'] ;
	$p_parentFilerecordId = $post_data['parent_filerecord_id'] ;
	$attach_filerecordId = $post_data['filerecord_id'] ;
	
	switch( $p_parentFileCode ) {
		case 'order' :
			$data = paracrm_lib_data_getRecord_file('CDE_ATTACH',$attach_filerecordId) ;
			if( !$data ) {
				return array('success'=>false) ;
			}
			
			$arr_ins = array() ;
			$arr_ins['field_ATTACHMENT_DATE'] = $data['field_ATTACHMENT_DATE'] ;
			$arr_ins['field_ATTACHMENT_TXT'] = $data['field_ATTACHMENT_TXT'] ;
			$img_filerecordId = paracrm_lib_data_insertRecord_file( 'ATTACH_INBOX', 0, $arr_ins ) ;
			
			media_contextOpen( $_POST['_sdomainId'] ) ;
			media_img_move( $attach_filerecordId , $img_filerecordId ) ;
			media_contextClose() ;

			paracrm_lib_data_deleteRecord_file('CDE_ATTACH',$attach_filerecordId) ;
			break ;
		default :
			return array('success'=>false) ;
	}

	return array('success'=>true) ;
}





function specDbsTracy_attachments_getInbox($post_data) {
	$forward_post = array() ;
	$forward_post['start'] ;
	$forward_post['limit'] ;
	$forward_post['file_code'] = 'ATTACH_INBOX' ;
	$ttmp = paracrm_data_getFileGrid_data( $forward_post, $auth_bypass=TRUE ) ;
	$paracrm_TAB = $ttmp['data'] ;
	$TAB = array() ;
	foreach( $paracrm_TAB as $paracrm_row ) {
		$TAB[] = array(
			'attachment_filerecord_id'=> $paracrm_row['ATTACH_INBOX_id'],
			'parent_file' => '',
			'attachment_date' => date('Y-m-d',strtotime($paracrm_row['ATTACH_INBOX_field_ATTACHMENT_DATE'])),
			'attachment_txt' => $paracrm_row['ATTACH_INBOX_field_ATTACHMENT_TXT']
		) ;
	}
	return array('success'=>true, 'data'=>$TAB) ;
}


function specDbsTracy_attachments_downloadPdf( $post_data ) {
	global $_opDB ;
	$p_parentFileCode = $post_data['parent_file_code'] ;
	$p_parentFilerecordId = $post_data['parent_filerecord_id'] ;
	
	$arr_ids = array() ;
	switch( $p_parentFileCode ) {
		case 'order' :
			$query = "SELECT field_ID_SOC, field_ID_DN FROM view_file_CDE WHERE filerecord_id='{$p_parentFilerecordId}'" ;
			$result = $_opDB->query($query) ;
			$arr = $_opDB->fetch_row($result) ;
			if( !$arr ) {
				return array('success'=>false) ;
			}
			$title = $arr[0].'_'.$arr[1] ;
			
			$query = "SELECT filerecord_id FROM view_file_CDE_ATTACH WHERE filerecord_parent_id='{$p_parentFilerecordId}' ORDER BY filerecord_id" ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
				$arr_ids[] = $arr[0] ;
			}
			break ;
		default :
			return array('success'=>false) ;
	}
	
	media_contextOpen( $_POST['_sdomainId'] ) ;
	
	$jpegs = array() ;
	foreach( $arr_ids as $media_id ) {
		$src_filepath = media_img_getPath( $media_id ) ;
		$jpegs[] = file_get_contents($src_filepath) ;
	}
	
	$pdf = media_pdf_jpgs2pdf($jpegs,$page_format='A4') ;
	media_contextClose() ;


	$filename_pdf = 'DN_'.$title.'_'.time().'.pdf' ;
	header("Content-Type: application/force-download; name=\"$filename_pdf\""); 
	header("Content-Disposition: attachment; filename=\"$filename_pdf\""); 
	echo $pdf ;
	die() ;
}


?>
