<?php

function specRsiRecouveo_lib_sms_sendSmsEnvoi($_URL, $_email, $_smsapiKey, $_label, $_subType){

	global $_opDB ;

	$arr_sms = array() ;

	$query = "SELECT filerecord_id FROM view_file_SMS WHERE field_TRSPT_STATUS ='0' ORDER BY filerecord_id" ;
	$result = $_opDB->query($query) ;

	while( (($arr = $_opDB->fetch_row($result)) != FALSE ) ) {
		$arr_sms[] = $arr[0] ;

	}

	if( !$arr_sms ) {
		exit ;
	}

	foreach( $arr_sms as $sms_filerecord_id ) {

			$query = "SELECT * FROM view_file_SMS WHERE filerecord_id = '{$sms_filerecord_id}' ";
			$result = $_opDB->query($query) ;
			$arr = $_opDB->fetch_assoc($result) ;

			$_tel = $arr['field_SMS_RECEP_NUM'];
			$_msg = $arr['field_SMS_TEXT'];

			$_recipient = $_tel ;
			$_msgContent = $_msg ;

			$fields['email']= $_email ;
			$fields['apikey']= $_smsapiKey ;
			$fields['version']='3.0.4';
			$fields['message']['recipients']= $_recipient ;
			$fields['message']['content']= $_msgContent ;
			$fields['message']['subtype']= $_subType ;
			$fields['message']['senderlabel']= $_label ;


			$reponse = specRsiRecouveo_lib_sms_postSmsRequest($_URL,http_build_query($fields)) ;

			$reponseDecode = json_decode($reponse,true) ;

			if( $reponseDecode['success'] == 1 ) {
				$arr_ins = array() ;
				$arr_ins['field_TRSPT_STATUS'] = 1 ;
				$arr_ins['field_TRSPT_CODE'] = 'SMS ENVOI' ;
				$arr_ins['field_TRSPT_TRACK'] = $reponseDecode['message_id'] ;
				paracrm_lib_data_updateRecord_file( 'SMS' , $arr_ins, $sms_filerecord_id ) ;
			}


	}

}

function specRsiRecouveo_lib_sms_createSmsForAction($post_tel, $post_content, $fileaction_filerecord_id, $test_mode=FALSE) {
	global $_opDB;

  $_numTel = $post_tel;
  $_smsContent = $post_content;

	$arr_ins = array() ;
	$arr_ins['field_SMS_DATE'] = date('Y-m-d H:i:s') ;
	$arr_ins['field_SMS_RECEP_NUM'] = $_numTel ;
	$arr_ins['field_SMS_TEXT'] = $_smsContent ;
	$arr_ins['field_TRSPT_STATUS'] = 0 ;
	$arr_ins['field_TRSPT_CODE'] = 'SMS ENVOI' ;
	$arr_ins['field_LINK_IS_ON'] = 1 ;
	$arr_ins['field_LINK_FILE_ACTION_ID'] = $fileaction_filerecord_id ;

	if ( $test_mode ){
		return TRUE ;
	}
	$sms_filerecord_id = paracrm_lib_data_insertRecord_file( 'SMS', 0, $arr_ins ) ;
	return $sms_filerecord_id;

}

function specRsiRecouveo_lib_sms_postSmsRequest($url, $data, $optional_headers = null){
  $params = array('http' => array(
              'method' => 'POST',
              'content' => $data
            ));
  if ($optional_headers !== null) {
    $params['http']['header'] = $optional_headers;
  }
  $ctx = stream_context_create($params);
  $fp = @fopen($url, 'rb', false, $ctx);

  if (!$fp) {
    throw new Exception("Problem with $url, $php_errormsg");
  }
  $response = @stream_get_contents($fp);
  if ($response === false) {
    throw new Exception("Problem reading data from $url, $php_errormsg");
  }
  return $response;
}
?>
