<?php
function specWbMrfoxy_attachments_cfgGetTypes() {
	global $_opDB ;
	$query = "SELECT * FROM view_bible_ATTACH_TYPE_tree ORDER BY field_ATTACHTYPE" ;
	$result = $_opDB->query($query) ;
	$TAB = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB[] = array(
			'attachtype' => $arr['field_ATTACHTYPE'],
			'attachtype_txt' => $arr['field_ATTACHTYPE_TXT'],
			'is_invoice' => $arr['field_IS_INVOICE']
		);
	}
	return array('success'=>true, 'data'=>$TAB) ;
}

function specWbMrfoxy_attachments_getList( $post_data ) {
	$target_filerecordId = $post_data['_filerecord_id'] ;
	$forward_post = array() ;
	$forward_post['start'] ;
	$forward_post['limit'] ;
	$forward_post['file_code'] = 'WORK_ATTACH' ;
	$forward_post['filter'] = json_encode(array(
		array(
			'type' => 'list',
			'field' => 'WORK_PROMO_id',
			'value' => array( $target_filerecordId )
		)
	)) ;
	$ttmp = paracrm_data_getFileGrid_data( $forward_post, $auth_bypass=TRUE ) ;
	$paracrm_TAB = $ttmp['data'] ;
	$TAB = array() ;
	foreach( $paracrm_TAB as $paracrm_row ) {
		$TAB[] = array(
			'filerecord_id'=> $paracrm_row['WORK_ATTACH_id'],
			'country_code' => $paracrm_row['WORK_ATTACH_field_COUNTRY'],
			'doc_date' => date('Y-m-d',strtotime($paracrm_row['WORK_ATTACH_field_DATE'])),
			'doc_type' => $paracrm_row['WORK_ATTACH_field_TYPE'],
			'invoice_txt' => $paracrm_row['WORK_ATTACH_field_INVOICE_TXT'],
			'invoice_amount' => $paracrm_row['WORK_ATTACH_field_INVOICE_AMOUNT']
		) ;
	}
	return array('success'=>true, 'data'=>$TAB) ;
}
function specWbMrfoxy_attachments_upload($post_data) {
	$form_data = json_decode($post_data['data'],true) ;
	
	$newrecord = array() ;
	$newrecord['media_title'] = $_FILES['photo-filename']['name'] ;
	$newrecord['media_date'] = date('Y-m-d H:i:s') ;
	$newrecord['media_mimetype'] = 'image/jpeg' ;
	$newrecord['field_COUNTRY'] = $form_data['country_code'] ;
	$newrecord['field_DATE'] = $form_data['doc_date'] ;
	$newrecord['field_TYPE'] = $form_data['doc_type'] ;
	$newrecord['field_INVOICE_TXT'] = $form_data['invoice_txt'] ;
	$newrecord['field_INVOICE_AMOUNT'] = $form_data['invoice_amount'] ;
	if( $form_data['filerecord_id'] > 0 ) {
		paracrm_lib_data_updateRecord_file( 'WORK_ATTACH', $newrecord, $form_data['filerecord_id'] ) ;
	} else {
		usleep(500000) ;
		
		media_contextOpen( $_POST['_sdomainId'] ) ;
		$media_id = media_img_processUploaded( $_FILES['photo-filename']['tmp_name'] ) ;
		media_contextClose() ;
		if( !$media_id ) {
			return array('success'=>false) ;
		}
		
		$img_filerecordId = paracrm_lib_data_insertRecord_file( 'WORK_ATTACH', 0, $newrecord ) ;
		
		media_contextOpen( $_POST['_sdomainId'] ) ;
		media_img_move( $media_id , $img_filerecordId ) ;
		media_contextClose() ;
	}
	
	
	return array('success'=>true) ;
}
function specWbMrfoxy_attachments_delete($post_data) {
	$attach_filerecordId = $post_data['filerecord_id'] ;
	
	media_contextOpen( $_POST['_sdomainId'] ) ;
	media_img_delete( $attach_filerecordId ) ;
	media_contextClose() ;
	
	paracrm_lib_data_deleteRecord_file('WORK_ATTACH',$attach_filerecordId) ;

	return array('success'=>true) ;
}



?>