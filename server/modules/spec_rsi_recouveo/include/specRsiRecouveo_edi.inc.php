<?php

function specRsiRecouveo_edi_getApiKeys( $post_data ) {
    global $_opDB ;

	//TODO : use php/mysql request similar to specRsiRecouveo_config_getUsers
	// to read table named view_file_
    $data = array() ;
    $query = "SELECT * FROM view_file_Z_APIKEYS ORDER BY field_APIKEY_DATE DESC" ;
    $result = $_opDB->query($query) ;
    while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {

        $data[] = array(
        	'apikey_code' => $arr['field_APIKEY_CODE'],
            'apikey_date' => $arr['field_APIKEY_DATE'],
            'apikey_hex' => $arr['field_APIKEY_HEX']
		) ;
    }
    return array('success'=>true, 'data'=>$data) ;

//	return array('success'=>true, 'data'=> array(array('apikey_code'=>'TEST'))) ;
}


function  specRsiRecouveo_edi_getApiLogResult($post_data){
    global $_opDB ;

    $data = array() ;
    $query = "SELECT * FROM view_file_Z_APILOGS" ;
    $result = $_opDB->query($query) ;
    while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {

        $data[] = array(
            'apilog_keycode' => $arr['field_APILOG_KEYCODE'],
            'apilog_date' => $arr['field_APILOG_DATE'],
            'apilog_method' => $arr['field_APILOG_METHOD'],
            'apilog_success' => $arr['field_APILOG_SUCCESS'],
            'apilog_count' => $arr['field_APILOG_COUNT']
        ) ;
    }
    return array('success'=>true, 'data'=>$data) ;

}

function  specRsiRecouveo_edi_createApiKey($post_data){
    global $_opDB ;
    
    $form_data = json_decode($post_data['data'],true) ;
    $form_data['apikey_code'] = strtoupper(trim($form_data['apikey_code'])) ;
    
    $query_test = "SELECT filerecord_id FROM view_file_Z_APIKEYS WHERE field_APIKEY_CODE='{$form_data['apikey_code']}' OR field_APIKEY_HEX='{$form_data['apikey_hex']}'" ;
    $exist_filerecordId = $_opDB->query_uniqueValue($query_test) ;
	if( $form_data['_delete'] ) {
		if( !$exist_filerecordId ) {
			return array('success'=>false) ;
		}
		paracrm_lib_data_deleteRecord_file( 'Z_APIKEYS', $exist_filerecordId ) ;
		return array('success'=>true) ;
	}
	
	
	
	if( $exist_filerecordId ) {
		return array('success'=>false, 'error'=>'Nom de clé ou Clé hexa déjà existant(e)') ;
	}
    
    
    //print_r($post_data['_keyName']) ;
    $arr_ins = array() ;
    $arr_ins['field_APIKEY_CODE'] = $form_data['apikey_code'] ;
    $arr_ins['field_APIKEY_DATE'] = date('Y-m-d H:i:s') ;
    $arr_ins['field_APIKEY_HEX'] = $form_data['apikey_hex'] ;
    paracrm_lib_data_insertRecord_file( 'Z_APIKEYS', 0, $arr_ins );



    return array('success'=>true) ;

}

?>
