<?php

function specRsiRecouveo_sms_doSendAll($_URL, $_email, $_smsapiKey, $_label, $_subType){

	global $_opDB ;

	$arr_sms = array() ;

	$query = "SELECT filerecord_id FROM view_file_sms WHERE field_SENT ='0' ORDER BY filerecord_id" ;
	$result = $_opDB->query($query) ;

	while( (($arr = $_opDB->fetch_row($result)) != FALSE ) ) {
		$arr_sms[] = $arr[0] ;

	}

	if( !$arr_sms ) {
		exit ;
	}

	foreach( $arr_sms as $sms_filerecord_id ) {

			$queryTel = "SELECT field_SMS_RECEP_NUM FROM view_file_SMS WHERE filerecord_id = '{$sms_filerecord_id}' ";
			$resultTel = $_opDB->query($queryTel) ;
			$_telTab = $_opDB->fetch_assoc($resultTel) ;

			$queryMsg = "SELECT field_SMS_CONTENT FROM view_file_SMS WHERE filerecord_id = '{$sms_filerecord_id}' " ;
			$resultMsg = $_opDB->query($queryMsg) ;
			$_msgTab = $_opDB->fetch_assoc($resultMsg) ;

			$_tel = $_telTab[field_SMS_RECEP_NUM];
			$_msg = $_msgTab[field_SMS_CONTENT];

			$_recipient = $_tel ;
			$_msgContent = $_msg ;

			$fields['email']= $_email ;
			$fields['apikey']= $_smsapiKey ;
			$fields['version']='3.0.4';
			$fields['message']['recipients']= $_recipient ;
			$fields['message']['content']= $_msgContent ;
			$fields['message']['subtype']= $_subType ;
			$fields['message']['senderlabel']= $_label ;


			$reponse = specRsiRecouveo_sms_doPostSmsRequest($_URL,http_build_query($fields)) ;

			$reponseDecode = json_decode($reponse,true) ;



			if( $reponseDecode[success] == 1 ) {
				$arr_ins = array() ;
				$arr_ins['field_SENT'] = 1 ;
				paracrm_lib_data_updateRecord_file( 'SMS' , $arr_ins, $sms_filerecord_id ) ;
			}


	}

}

function specRsiRecouveo_sms_doAddStore($post_tel, $post_content) {
	global $_opDB;

  $_numTel = $post_tel;
  $_smsContent = $post_content;

  $rInsert = "INSERT INTO view_file_sms (field_SMS_CONTENT, field_SMS_RECEP_NUM, field_SENT) VALUES ('$_smsContent', '$_numTel', 0)";
  $message = $_opDB->query($rInsert) ;

  $json = array(
    'success'=>true,
    'data'=>array(
      'numTel'=>$_numTel,
      'smsContent'=>$_smsContent,
    )
  ) ;

  return $json;
}

function specRsiRecouveo_sms_doPostSmsRequest($url, $data, $optional_headers = null){
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
