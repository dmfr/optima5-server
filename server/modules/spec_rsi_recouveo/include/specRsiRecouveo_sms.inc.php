<?php

function specRsiRecouveo_sms_getSmsData( $post_data ) {
	$p_smsFilerecordId = $post_data['sms_filerecord_id'] ;
	$sms_row = paracrm_lib_data_getRecord_file('SMS',$p_smsFilerecordId) ;
	if( !$sms_row ) {
		return array('success'=>false) ;
	}
	return array(
		'success' => true,
		'data' => array(
			'sms_date' => date('Y-m-d',strtotime($sms_row['field_SMS_DATE'])),
			'sms_recep_num' => $sms_row['field_SMS_RECEP_NUM'],
			'sms_text' => $sms_row['field_SMS_TEXT']
		)
	) ;
}

?>
