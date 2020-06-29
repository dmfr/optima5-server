<?php

function specRsiRecouveo_extPortal_getInfosConfig( $post_data ){
	$app_root = $GLOBALS['app_root'] ;
	$resources_root=$app_root.'/resources' ;
	$datasources_dir=$resources_root.'/server/datasources' ;
	$jsonFileContent = file_get_contents($datasources_dir.'/'."RSI_GEN_extPortalConf.json") ;
	if ($jsonFileContent === false) {
		return array("success" => false) ;
	}
	return array("success" => true, "data" => json_decode($jsonFileContent,true)) ;
}

function specRsiRecouveo_extPortal_postForm( $post_data ) {
	$_acc_id = $post_data['acc_id'] ;
	$_action_data = json_decode($post_data["data"],true) ;
	$_form_values = json_decode($post_data["values"],true) ;

	$ttmp = specRsiRecouveo_account_open(array('acc_id'=>$_acc_id)) ;
	if( !$ttmp['success'] ) {
		return array('success'=>false) ;
	}
	$account_record = $ttmp['data'] ;
	$accountFileOn_filerecordId = NULL ;
	foreach( $account_record['files'] as $accountFile_record ) {
		if( $accountFile_record['file_filerecord_id'] === 0 ) {
			continue ;
		}
		if( strpos($accountFile_record['status'],'S1_')===0 ) {
			$accountFileOn_filerecordId = $accountFile_record['file_filerecord_id'] ;
		}
	}
	if( !$accountFileOn_filerecordId ) {
		return array('success'=>false) ;
	}
	
	$forward_post = array(
		'_action' => 'action_doFileAction',
		'file_filerecord_id' => $accountFileOn_filerecordId,
		'data' => json_encode($_action_data),
		'acc_id' => $_acc_id
	);
	$return_json = specRsiRecouveo_action_doFileAction($forward_post) ;
	$fileaction_filerecord_id = $return_json['fileaction_filerecord_id'] ;
	
	if( isset($_form_values) ) {
		$forward_post_autoDataImport = array(
			'acc_id' => $_acc_id,
			'data' => json_encode($_form_values),
			'_action' => 'account_autoSaveExtData'
		) ;
		specRsiRecouveo_account_autoSaveExtData($forward_post_autoDataImport) ;
	}
	
	if( $fileaction_filerecord_id ) {
		// notification
		specRsiRecouveo_account_pushNotificationFileaction( array(
			'acc_id' => $_acc_id,
			'txt_notification' => 'Message tchat',
			'fileactionFilerecordId' => $fileaction_filerecord_id
		)) ;
	}
	
	return array('success'=>true) ;
}

?>
