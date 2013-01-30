<?php

function paracrm_android_lib_authDb_getList() {
	global $_opDB ;
	
	$_data = array() ;
	
	$query = "SELECT * FROM auth_android ORDER BY ping_timestamp DESC" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$arr['device_is_allowed'] = ($arr['device_is_allowed']=='O')?true:false ;
		$_data[] = $arr ;
	}
	
	return array('success'=>true,'data'=>$_data) ;
}


function paracrm_android_lib_authDevice_ping( $android_id, $set_timestamp=FALSE ) {
	global $_opDB ;
	
	$query = "SELECT authandroid_id , device_is_allowed FROM auth_android WHERE device_android_id='$android_id'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		$arr_ins = array() ;
		$arr_ins['device_android_id'] = $android_id ;
		$arr_ins['device_is_allowed'] = 'N' ;
		$arr_ins['ping_timestamp'] = time() ;
		$_opDB->insert('auth_android',$arr_ins) ;
		return false ;
	}
	$arr = $_opDB->fetch_row($result) ;
	$authandroid_id = $arr[0] ;
	$device_is_allowed = ($arr[1]=='O')?true:false ;
	if( $set_timestamp ) {
		$arr_update = array() ;
		$arr_update['ping_timestamp'] = time() ;
		$arr_cond = array();
		$arr_cond['authandroid_id'] = $authandroid_id ;
		$_opDB->update('auth_android',$arr_update,$arr_cond) ;
	}
	return $device_is_allowed ;
}




?>