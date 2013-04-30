<?php

function desktop_config_getRecord($post_data) {
	global $_opDB ;
	
	if( !isset($_SESSION['login_data']) ) {
		return array('success'=>false) ;
	}
	
	$session_id = $_SESSION['login_data']['session_id'] ;
	$user_code = $_SESSION['login_data']['user_code'] ;

	
	
	return array(
		'success'=>true
		);
}

?>