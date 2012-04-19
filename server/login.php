<?php
$app_root='..' ;
$server_root='.' ;

include("$server_root/include/config.inc.php");
include("$server_root/include/database/mysql_DB.inc.php");




if( $_POST['_action'] == 'login' )
{
	$userstr = trim($_POST['login_user']) ;
	if( trim($_POST['login_domain']) )
	{
		if( strpos($userstr,'@') === FALSE )
			$userstr = $userstr.'@'.trim($_POST['login_domain']) ;
		else
			$userstr = substr($userstr,0,strpos($userstr,'@')).'@'.trim($_POST['login_domain']) ;
	}
	$arr_tmp = explode('@',$userstr) ;
	if( count($arr_tmp) != 2 )
	{
		$error = "Le login doit être de type :<br>&nbsp;&nbsp;<b>user@domaine</b>&nbsp;<i>(+ <b>.devDB</b>)</i>";
		$__errors = array($error);
		die(json_encode(array('done' => FALSE,'errors'=>$__errors))) ;
	}
	$login_user = $arr_tmp[0] ;
	$arr_tmp = explode('.',$arr_tmp[1]) ;
	switch( count($arr_tmp) )
	{
		case 2 :
		$login_domain = $arr_tmp[0] ;
		$login_domain.= "_";
		$login_domain.= $arr_tmp[1] ;
		$_dev_db = $arr_tmp[1] ;
		break ;
		
		case 1 :
		$login_domain = $arr_tmp[0] ;
		$login_domain.= "_prod" ;
		break ;
		
		default :
		$error = "Le login doit être de type :<br>&nbsp;&nbsp;<b>user@domaine</b>&nbsp;<i>(+ <b>.devDB</b>)</i>";
		$__errors = array($error);
		die(json_encode(array('done' => FALSE,'errors'=>$__errors))) ;
	}

	// TEST DATABASE 
	$mysql_db = $mysql_db_prefix.$login_domain ;
	$connection = @mysql_connect( $mysql_host, $mysql_user, $mysql_pass  );
	if( !$connection)
	{
		$error = "Base de donnée indisponible";
		$__errors = array($error);
		die(json_encode(array('done' => FALSE,'errors'=>$__errors))) ;
	}
	if( !(@mysql_select_db($mysql_db)) )
	{
		$error = "Domaine <b>$login_domain</b> inexistant";
		$__errors = array($error);
		die(json_encode(array('done' => FALSE,'errors'=>$__errors,'mysql_db'=>$mysql_db))) ;
	}
	@mysql_close($connection) ;
	
	
	
	// ***********************
	// Ici on procede au login à proprement parler....
	$_opDB = new mysql_DB( );
	$_opDB->connect_mysql_nocheck( $mysql_host, $mysql_db, $mysql_user, $mysql_pass );
	
	$query = "SELECT * FROM z_user WHERE user_login='$login_user' AND user_password='{$_POST['login_password']}'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 )
	{
		die(json_encode(array('done' => FALSE,'errors'=>array("Invalid username or password for <b>{$userstr}</b>"),'mysql_db'=>$mysql_db))) ;
	}
	//*************************


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
				echo json_encode(array('done' => FALSE)) ;
				return ;
			}
			
			continue ;
		}
		
		session_destroy();
		session_start() ;
		
		$_SESSION['login_data']['session_id'] = $session_name ;
		$_SESSION['login_data']['login_password'] = $_POST['password'] ;
		$_SESSION['login_data']['login_user'] = $login_user ;
		$_SESSION['login_data']['login_soc'] = $login_soc ;
		$_SESSION['login_data']['login_domain'] = $login_domain ;
		$_SESSION['login_data']['userstr'] = strtolower($userstr) ;
		$_SESSION['login_data']['mysql_db'] = $mysql_db ;
		$_SESSION['login_data']['time_access'] = time() ;
		if( $_dev_db != NULL )
			$_SESSION['login_data']['dev_db'] = $_dev_db ;
			
		$_SESSION['login_data']['auth_class'] = 'A' ;
		$_SESSION['login_data']['wallpaper_url'] = 'wallpapers/Blue-Sencha.jpg' ;
		
		
		$_SESSION['next_transaction_id'] = 1 ;
		
		session_write_close() ;
	
		break ;
	}

	$tab['done'] = TRUE ;
	$tab['login_data'] = $_SESSION['login_data'] ;
	
	echo json_encode($tab) ;
	return ;
}








if( $_POST['_action'] == 'logout' )
{
	sleep(0.5) ;

	session_name($_POST['_sessionName']) ;
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