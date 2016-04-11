<?php

function specDbsTracy_live_stepValidate( $post_data ) {
	global $_opDB ;

	$p_socCode = $post_data['soc_code'] ;
	$p_trpstFileId = strtoupper(trim($post_data['trspt_file_id'])) ;
	$p_stepCode = $post_data['step_code'] ;
	
	$query = "SELECT filerecord_id FROM view_file_TRSPT WHERE field_ID_SOC='{$p_socCode}' AND field_ID_DOC='{$p_trpstFileId}'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return array('success'=>false, 'error'=>'File ID not found') ;
	}
	$arr = $_opDB->fetch_row($result) ;
	$p_trsptFilerecordId = $arr[0] ;
	
	$json = specDbsTracy_trspt_stepValidate( array(
		'step_code' => $p_stepCode,
		'trspt_filerecord_id' => $p_trsptFilerecordId
	));
	return $json ;
}

?>
