<?php

function paracrm_lib_android_authDb_getList() {
	global $_opDB ;
	
	$_data = array() ;
	
	$query = "SELECT * FROM auth_android ORDER BY ping_timestamp DESC" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$arr['device_is_allowed'] = ($arr['device_is_allowed']=='O')?true:false ;
		$_data[] = $arr ;
	}
	
	return $_data ;
}
function paracrm_lib_android_authDB_updateDevice( $authandroid_id , $arr_device ) {
	global $_opDB ;
	
	$arr_cond = array() ;
	$arr_cond['authandroid_id'] = $authandroid_id ;
	
	$arr_update = array() ;
	foreach( array('device_android_id','device_is_allowed','device_desc') as $mkey ) {
		if( !isset($arr_device[$mkey]) )
			continue ;
		
		switch( $mkey ) {
			case 'device_is_allowed' :
			$arr_update[$mkey] = $arr_device[$mkey] ? 'O':'N' ;
			break ;
			
			default:
			$arr_update[$mkey] = $arr_device[$mkey] ;
			break ;
		}
	}
	
	$_opDB->update('auth_android',$arr_update,$arr_cond) ;
}


function paracrm_lib_android_authDevice_ping( $android_id, $set_timestamp=FALSE, $version_code=NULL ) {
	global $_opDB ;
	
	$android_id = strtoupper($android_id) ;
	
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
		if( $version_code ) {
			$arr_update['ping_version'] = $version_code ;
		}
		$arr_cond = array();
		$arr_cond['authandroid_id'] = $authandroid_id ;
		$_opDB->update('auth_android',$arr_update,$arr_cond) ;
	}
	return $device_is_allowed ;
}




?>