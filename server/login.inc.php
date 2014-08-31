<?php

function op5_login_test( $userstr, $password ) {
	$arr_tmp = explode('@',$userstr) ;
	if( count($arr_tmp) != 2 )
	{
		$error = "Le login doit être de type :<br>&nbsp;&nbsp;<b>user@domaine</b>&nbsp;<i>(+ <b>.devDB</b>)</i>";
		$__errors = array($error);
		return array('done' => FALSE,'errors'=>$__errors) ;
	}
	$login_user = $arr_tmp[0] ;
	$arr_tmp = explode('.',$arr_tmp[1]) ;
	switch( count($arr_tmp) )
	{
		case 2 :
		// TODO : support dev_db
		$error = "Requested <u>devDB</u> (= <b>{$arr_tmp[1]}</b> for <b>{$arr_tmp[0]}</b>) not yet supported";
		$__errors = array($error);
		return array('done' => FALSE,'errors'=>$__errors) ;
		
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
		return array('done' => FALSE,'errors'=>$__errors) ;
	}

	// TEST DATABASE 
	$GLOBALS['mysql_db'] = $GLOBALS['mysql_db_prefix'].$login_domain ;
	$connection = @mysql_connect( $GLOBALS['mysql_host'], $GLOBALS['mysql_user'], $GLOBALS['mysql_pass']  );
	if( !$connection)
	{
		$error = "Base de donnée indisponible";
		$__errors = array($error);
		return array('done' => FALSE,'errors'=>$__errors) ;
	}
	if( !(@mysql_select_db($GLOBALS['mysql_db'])) )
	{
		$error = "Domaine <b>$login_domain</b> inexistant";
		$__errors = array($error);
		return array('done' => FALSE,'errors'=>$__errors,'mysql_db'=>$GLOBALS['mysql_db']) ;
	}
	@mysql_close($connection) ;
	
	
	
	// ***********************
	// Ici on procede au login à proprement parler....
	$GLOBALS['_opDB'] = new mysql_DB( );
	$GLOBALS['_opDB']->connect_mysql_nocheck( $GLOBALS['mysql_host'], $GLOBALS['mysql_db'], $GLOBALS['mysql_user'], $GLOBALS['mysql_pass'] );
	
	if( count($ttmp=explode(':',$login_user)) == 2 ) {
		// Mode delegate
		$delegate_sdomainId = $ttmp[1] ;
		$delegate_userId = $ttmp[0] ;
		$delegate_pass = $password ;
		
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
			$result = $GLOBALS['_opDB']->query($query) ;
			$arrCfg_delegate = $GLOBALS['_opDB']->fetch_assoc($result) ;
			
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
			$candidate_password = $GLOBALS['_opDB']->query_uniqueValue($query) ;
			if( !$candidate_password || $candidate_password != $delegate_pass ) {
				break ;
			}
		
			$OK = TRUE ;
			break ;
		}
		if( !$OK ) {
			return array('done' => FALSE,'errors'=>array("Login failed for delegate <b>$delegate_sdomainId</b> on <b>$login_domain</b>"),'mysql_db'=>$GLOBALS['mysql_db']) ;
		}
		$auth_class = 'U' ;
		
	} elseif( $login_user == 'root' ) {
		if( defined('AUTH_ROOT_PASSWORD_PLAIN') && AUTH_ROOT_PASSWORD_PLAIN != ''
		&& AUTH_ROOT_PASSWORD_PLAIN == $password ) {
			
			// OK
		} else {
		
			return array('done' => FALSE,'errors'=>array("Cannot login as root for <b>$login_domain</b>"),'mysql_db'=>$GLOBALS['mysql_db']) ;
		}
	} else {
		$password_sha1 = sha1($login_user.AUTH_SHA1_SALT.trim($password)) ;
		$query = "SELECT * FROM auth_user WHERE user_id='$login_user' AND password_sha1='{$password_sha1}'" ;
		$result = $GLOBALS['_opDB']->query($query) ;
		if( $GLOBALS['_opDB']->num_rows($result) != 1 )
		{
			return array('done' => FALSE,'errors'=>array("Invalid username or password for <b>{$userstr}</b>"),'mysql_db'=>$GLOBALS['mysql_db']) ;
		}
		else
		{
			$arr = $GLOBALS['_opDB']->fetch_assoc($result) ;
			if( $arr['auth_is_disabled'] == 'O' ) {
				return array('done' => FALSE,'errors'=>array("Login disabled for <b>{$userstr}</b>"),'mysql_db'=>$GLOBALS['mysql_db']) ;
			}
			$auth_class = $arr['auth_class'] ;
		}
	}
	
	return array(
		'done' => TRUE,
		'login_data' => array(
			'login_domain' => $login_domain,
			'login_user' => $login_user,
			'login_password' => $password,
			'auth_class' => $auth_class,
			'delegate_sdomainId' => $delegate_sdomainId,
			'delegate_userId' => $delegate_userId
		),
		'mysql_db' => $GLOBALS['mysql_db']
	) ;
}

?>