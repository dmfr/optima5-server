<?php
$app_root='..' ;
$server_root='.' ;

include("$server_root/include/config.inc.php");
include("$server_root/include/database/mysql_DB.inc.php");




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
		// TODO : support dev_db
		$error = "Requested <u>devDB</u> (= <b>{$arr_tmp[1]}</b> for <b>{$arr_tmp[0]}</b>) not yet supported";
		$__errors = array($error);
		die(json_encode(array('done' => FALSE,'errors'=>$__errors))) ;
		
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
	
	if( count($ttmp=explode(':',$login_user)) == 2 ) {
		// Mode delegate
		$delegate_sdomainId = $ttmp[1] ;
		$delegate_userId = $ttmp[0] ;
		$delegate_pass = $_POST['login_password'] ;
		
		while( TRUE ) {
			$t = new DatabaseMgr_Base() ;
			$domain_id = $t->dbCurrent_getDomainId() ;
			
			// Sdomain ?
			$t = new DatabaseMgr_Sdomain($domain_id) ;
			if( !$t->sdomainDb_exists($delegate_sdomainId) ) {
				break ;
			}
			
			$sdomain_db = DatabaseMgr_Base::getBaseDb( $domain_id ).'_'.strtolower($delegate_sdomainId) ;
			
			// Delegate config ?
			$query = "SELECT * FROM {$sdomain_db}.auth_delegate WHERE zero_id='0'" ;
			$result = $_opDB->query($query) ;
			$arrCfg_delegate = $_opDB->fetch_assoc($result) ;
			
			if( !$arrCfg_delegate || $arrCfg_delegate['authdelegate_is_on'] != 1 ) {
				break ;
			}
			$authdelegate_bible_code = $arrCfg_delegate['authdelegate_bible_code'] ;
			$authdelegate_user_bible_field_code = $arrCfg_delegate['authdelegate_user_bible_field_code'] ;
			$authdelegate_pass_bible_field_code = $arrCfg_delegate['authdelegate_pass_bible_field_code'] ;
			
			// Login OK ?
			$query = "SELECT field_{$authdelegate_pass_bible_field_code}
						FROM {$sdomain_db}.view_bible_{$authdelegate_bible_code}_entry
						WHERE UPPER(field_{$authdelegate_user_bible_field_code}) = UPPER('{$delegate_userId}')" ;
			$candidate_password = $_opDB->query_uniqueValue($query) ;
			if( !$candidate_password || $candidate_password != $delegate_pass ) {
				break ;
			}
		
			$OK = TRUE ;
			break ;
		}
		if( !$OK ) {
			die(json_encode(array('done' => FALSE,'errors'=>array("Login failed for delegate <b>$delegate_sdomainId</b> on <b>$login_domain</b>"),'mysql_db'=>$mysql_db))) ;
		}
		$auth_class = 'U' ;
		
	} elseif( $login_user == 'root' ) {
		if( defined('AUTH_ROOT_PASSWORD_PLAIN') && AUTH_ROOT_PASSWORD_PLAIN != ''
		&& AUTH_ROOT_PASSWORD_PLAIN == $_POST['login_password'] ) {
			
			// OK
		} else {
		
			die(json_encode(array('done' => FALSE,'errors'=>array("Cannot login as root for <b>$login_domain</b>"),'mysql_db'=>$mysql_db))) ;
		}
	} else {
		$password_sha1 = sha1($login_user.AUTH_SHA1_SALT.trim($_POST['login_password'])) ;
		$query = "SELECT * FROM auth_user WHERE user_id='$login_user' AND password_sha1='{$password_sha1}'" ;
		$result = $_opDB->query($query) ;
		if( $_opDB->num_rows($result) != 1 )
		{
			die(json_encode(array('done' => FALSE,'errors'=>array("Invalid username or password for <b>{$userstr}</b>"),'mysql_db'=>$mysql_db))) ;
		}
		else
		{
			$arr = $_opDB->fetch_assoc($result) ;
			if( $arr['auth_is_disabled'] == 'O' ) {
				die(json_encode(array('done' => FALSE,'errors'=>array("Login disabled for <b>{$userstr}</b>"),'mysql_db'=>$mysql_db))) ;
			}
			$auth_class = $arr['auth_class'] ;
		}
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
		$_SESSION['login_data']['login_domain'] = $login_domain ;
		$_SESSION['login_data']['userstr'] = strtolower($userstr) ;
		$_SESSION['login_data']['mysql_db'] = $mysql_db ;
		$_SESSION['login_data']['time_access'] = time() ;
		if( $_dev_db != NULL )
			$_SESSION['login_data']['dev_db'] = $_dev_db ;
			
		$_SESSION['login_data']['auth_class'] = $auth_class ;
		
		
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