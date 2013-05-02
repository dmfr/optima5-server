<?php

function desktop_config_getRecord($post_data) {
	global $_opDB ;
	
	if( !isset($_SESSION['login_data']) ) {
		return array('success'=>false) ;
	}
	
	$session_id = $_SESSION['login_data']['session_id'] ;
	$user_code = $_SESSION['login_data']['login_user'] ;
	
	$login_userName = $_opDB->query_uniqueValue("SELECT user_fullname FROM auth_user WHERE user_code='$user_code'") ;
	$login_domainName = $_opDB->query_uniqueValue("SELECT domain_name FROM domain WHERE zero_id='0'") ;
	
	return array(
		'desktop_config'=>array(
			'session_id' => $_SESSION['login_data']['session_id'],
			'dev_mode' => $GLOBALS['__OPTIMA_TEST'],
			'auth_is_admin' => ($_SESSION['login_data']['auth_class']=='A'),
			'auth_is_root' => ($user_code=='root'),
			'login_str' => $_SESSION['login_data']['userstr'],
			'login_userName' => $login_userName,
			'login_domainName' => $login_domainName
		),
		'success'=>true
	);
}

?>