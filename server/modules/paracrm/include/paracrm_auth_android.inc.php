<?php

function paracrm_auth_android_getDevicesList() {
	if( !Auth_Manager::getInstance()->auth_query_sdomain_admin( Auth_Manager::sdomain_getCurrent() ) ) {
		return Auth_Manager::auth_getDenialResponse() ;
	}
	return array('success'=>true,'data'=>paracrm_lib_android_authDb_getList()) ;
}
function paracrm_auth_android_setDevice($post_data) {
	if( !Auth_Manager::getInstance()->auth_query_sdomain_admin( Auth_Manager::sdomain_getCurrent() ) ) {
		return Auth_Manager::auth_getDenialResponse() ;
	}
	$arr_device = array() ;
	foreach( $post_data as $mkey=>$mvalue ) {
		switch( $mkey )
		{
			case 'device_desc' :
			case 'device_android_id':
			$arr_device[$mkey] = $mvalue ;
			break ;
			
			case 'device_is_allowed' :
			$arr_device[$mkey] = $mvalue ;
			break ;
			
			default:
			break ;
		}
	}
	
	if( $post_data['authandroid_id'] > 0 ) {
		paracrm_lib_android_authDB_updateDevice($post_data['authandroid_id'],$arr_device) ;
		return array('success'=>true) ;
	}
	return array('success'=>false) ;
}


?>