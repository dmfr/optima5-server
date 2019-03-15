<?php
$app_root='..' ;
$server_root='.' ;

include("$server_root/include/config.inc.php");
include("$server_root/include/database/mysql_DB.inc.php");

include("$server_root/login.inc.php") ;


if( $_POST['_action'] == 'login' )
{
	usleep(500*1000) ;
	$userstr = strtolower(trim($_POST['login_user'])) ;
	if( trim($_POST['login_domain']) )
	{
		if( strpos($userstr,'@') === FALSE )
			$userstr = $userstr.'@'.trim($_POST['login_domain']) ;
		else
			$userstr = substr($userstr,0,strpos($userstr,'@')).'@'.trim($_POST['login_domain']) ;
	}
	
	// *************************
	
	$login_result = op5_login_test( $userstr, $_POST['login_password'] ) ;
	if( !$login_result['done'] ) {
		die(json_encode($login_result)) ;
	}
	if( $login_result['login_data']['auth_is_nologin'] ) {
		die(json_encode(array('done' => FALSE,'errors'=>array("No UI login for <b>{$userstr}</b>"),'mysql_db'=>$GLOBALS['mysql_db']))) ;
	}
	
	// **********************
	
	while( TRUE )
	{
		$session_name = 'OP'.rand(101,999) ;
		session_name($session_name) ;
		//session_set_cookie_params(60*60*24*200) ;
		session_start() ;
		
		
		if( isset($_SESSION['login_data']) && $_SESSION['login_data']['time_access'] >= strtotime( '-24 hours' ) )
		{
			$c++ ;
			if( $c >= 5 )
			{
				die( json_encode(array('done' => FALSE)) ) ;
			}
			
			continue ;
		}
		
		session_destroy();
		session_start() ;
		
		$_SESSION['login_data']['session_id'] = $session_name ;
		$_SESSION['login_data']['login_domain'] = $login_result['login_data']['login_domain'] ;
		$_SESSION['login_data']['login_user'] = $login_result['login_data']['login_user'] ;
		if( $login_result['login_data']['delegate_sdomainId'] && $login_result['login_data']['delegate_userId'] ) {
			$_SESSION['login_data']['delegate_sdomainId'] = $login_result['login_data']['delegate_sdomainId'] ;
			$_SESSION['login_data']['delegate_userId'] = $login_result['login_data']['delegate_userId'] ;
		}
		$_SESSION['login_data']['userstr'] = strtolower($userstr) ;
		$_SESSION['login_data']['mysql_db'] = $login_result['mysql_db'] ;
		$_SESSION['login_data']['time_access'] = time() ;
			
		$_SESSION['login_data']['auth_class'] = $login_result['login_data']['auth_class'] ;
		
		
		$_SESSION['next_transaction_id'] = 1 ;
		
		session_write_close() ;
	
		break ;
	}

	$tab['done'] = TRUE ;
	$tab['login_data'] = $_SESSION['login_data'] ;
	
	die( json_encode($tab) ) ;
}








if( $_POST['_action'] == 'logout' )
{
	sleep(0.5) ;

	session_name($_POST['_sessionId']) ;
	session_start() ;
	if( isset($_SESSION['login_data']) )
	{
		session_destroy() ;
		die( json_encode(array('done' => TRUE)) ) ;
	}
	else
	{
		die( json_encode(array('done' => FALSE)) ) ;
	}
}

?>
