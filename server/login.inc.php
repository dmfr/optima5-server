<?php

function http_digest_parse($txt) {
    // protect against missing data
    $needed_parts = array('nonce'=>1, 'nc'=>1, 'cnonce'=>1, 'qop'=>1, 'username'=>1, 'uri'=>1, 'response'=>1);
    $data = array();
    $keys = implode('|', array_keys($needed_parts));

    preg_match_all('@(' . $keys . ')=(?:([\'"])([^\2]+?)\2|([^\s,]+))@', $txt, $matches, PREG_SET_ORDER);

    foreach ($matches as $m) {
        $data[$m[1]] = $m[3] ? $m[3] : $m[4];
        unset($needed_parts[$m[1]]);
    }

    return $needed_parts ? false : $data;
}

function op5_login_test( $userstr, $password, $http_digest=FALSE, $http_digest_realm=NULL ) {
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
	$connection = @mysqli_connect( $GLOBALS['mysql_host'], $GLOBALS['mysql_user'], $GLOBALS['mysql_pass']  );
	if( !$connection)
	{
		$error = "Base de donnée indisponible";
		$__errors = array($error);
		return array('done' => FALSE,'errors'=>$__errors) ;
	}
	if( !(@mysqli_select_db($connection, $GLOBALS['mysql_db'])) )
	{
		$error = "Domaine <b>$login_domain</b> inexistant";
		$__errors = array($error);
		return array('done' => FALSE,'errors'=>$__errors,'mysql_db'=>$GLOBALS['mysql_db']) ;
	}
	@mysqli_close($connection) ;
	
	
	
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
			if( $http_digest ) {
				$FAIL = 'USERPASS' ;
				break ;
			}
			
			$t = new DatabaseMgr_Base() ;
			$domain_id = $t->dbCurrent_getDomainId() ;
			
			// Sdomain ?
			$t = new DatabaseMgr_Sdomain($domain_id) ;
			if( !$t->sdomainDb_exists($delegate_sdomainId) ) {
				$FAIL = 'SDOMAIN' ;
				break ;
			}
			
			$sdomain_db = DatabaseMgr_Base::getBaseDb( $domain_id ).'_'.strtolower($delegate_sdomainId) ;
			
			// Delegate config ?
			$query = "SELECT * FROM {$sdomain_db}.auth_delegate WHERE zero_id='0'" ;
			$result = $GLOBALS['_opDB']->query($query) ;
			$arrCfg_delegate = $GLOBALS['_opDB']->fetch_assoc($result) ;
			
			if( !$arrCfg_delegate || $arrCfg_delegate['authdelegate_is_on'] != 1 ) {
				$FAIL = 'SDOMAIN' ;
				break ;
			}
			$authdelegate_bible_code = $arrCfg_delegate['authdelegate_bible_code'] ;
			$authdelegate_user_bible_field_code = $arrCfg_delegate['authdelegate_user_bible_field_code'] ;
			$authdelegate_pass_bible_field_code = $arrCfg_delegate['authdelegate_pass_bible_field_code'] ;
			$authdelegate_acl_is_on = ($arrCfg_delegate['authdelegate_acl_is_on']=='O') ;
			$authdelegate_acl_bible_field_code = $arrCfg_delegate['authdelegate_acl_bible_field_code'] ;
			
			// Login OK ?
			$query = "SELECT field_{$authdelegate_pass_bible_field_code}
						FROM {$sdomain_db}.view_bible_{$authdelegate_bible_code}_entry
						WHERE UPPER(field_{$authdelegate_user_bible_field_code}) = UPPER('{$delegate_userId}')" ;
			$candidate_password = $GLOBALS['_opDB']->query_uniqueValue($query) ;
			if( !$candidate_password || $candidate_password != $delegate_pass ) {
				$FAIL = 'USERPASS' ;
				break ;
			}
			
			if( $authdelegate_acl_is_on ) {
				$query = "SELECT field_{$authdelegate_acl_bible_field_code}
							FROM {$sdomain_db}.view_bible_{$authdelegate_bible_code}_tree t, {$sdomain_db}.view_bible_{$authdelegate_bible_code}_entry e
							WHERE t.treenode_key = e.treenode_key AND UPPER(e.field_{$authdelegate_user_bible_field_code}) = UPPER('{$delegate_userId}')" ;
				$list_ips = $GLOBALS['_opDB']->query_uniqueValue($query) ;
				if( $list_ips != NULL ) {
					$ACL_OK = FALSE ;
					foreach( explode(',',$list_ips) as $ip ) {
						$src_ip = ( $_SERVER['HTTP_X_FORWARDED_FOR'] ? $_SERVER['HTTP_X_FORWARDED_FOR'] : $_SERVER['REMOTE_ADDR'] );
						if( fnmatch($ip,$src_ip) ) {
							$ACL_OK = TRUE ;
							break ;
						}
					}
					if( !$ACL_OK ) {
						$FAIL = 'IP' ;
						break ;
					}
				}
			}
			
			$OK = TRUE ;
			break ;
		}
		
		// Log
		$src_ip = ( $_SERVER['HTTP_X_FORWARDED_FOR'] ? $_SERVER['HTTP_X_FORWARDED_FOR'] : $_SERVER['REMOTE_ADDR'] );
		$arr_ins = array() ;
		$arr_ins['authdelegate_log_timestamp'] = time() ;
		$arr_ins['authdelegate_log_user'] = $delegate_userId ;
		$arr_ins['authdelegate_log_ipaddr'] = $src_ip ;
		$arr_ins['authdelegate_log_failcode'] = ( $OK ? '' : $FAIL ) ;
		if( $sdomain_db ) {
			$GLOBALS['_opDB']->insert($sdomain_db.'.'.'auth_delegate_log',$arr_ins) ;
		}
		
		if( !$OK ) {
			$errors = array() ;
			$msg = "Login failed for delegate <b>$delegate_sdomainId</b> on <b>$login_domain</b>" ;
			switch( $FAIL ) {
				case 'IP' :
					$msg.=  "<br>Reason: IP address not authorized" ;
					break ;
					
				case 'SDOMAIN' :
					$msg.=  "<br>Reason: Invalid Sdomain" ;
					break ;
					
				case 'USERPASS' :
					$msg.=  "<br>Reason: Invalid user/password" ;
					break ;
					
				default :
					break ;
			}
			return array('done' => FALSE,'errors'=>array($msg),'mysql_db'=>$GLOBALS['mysql_db']) ;
		}
		$auth_class = 'U' ;
		
	} elseif( $login_user == 'root' ) {
		if( defined('AUTH_ROOT_PASSWORD_PLAIN') && AUTH_ROOT_PASSWORD_PLAIN != ''
		&& AUTH_ROOT_PASSWORD_PLAIN == $password ) {
			
			// OK
		} else {
		
			return array('done' => FALSE,'errors'=>array("Cannot login as root for <b>$login_domain</b>"),'mysql_db'=>$GLOBALS['mysql_db']) ;
		}
	} elseif( $http_digest ) {
		$digest_data = http_digest_parse($password) ;
		
		$query = "SELECT password_plaintext FROM auth_user WHERE user_id='$login_user'" ;
		$secret_password = $GLOBALS['_opDB']->query_uniqueValue($query) ;
	
		$A1 = md5($digest_data['username'] . ':' . $http_digest_realm . ':' . $secret_password);
		$A2 = md5($_SERVER['REQUEST_METHOD'].':'.$digest_data['uri']);
		$valid_response = md5($A1.':'.$digest_data['nonce'].':'.$digest_data['nc'].':'.$digest_data['cnonce'].':'.$digest_data['qop'].':'.$A2);
		
		if ($digest_data['response'] != $valid_response) {
			return array('done' => FALSE,'mysql_db'=>$GLOBALS['mysql_db']) ;
		}
		
		$query = "SELECT * FROM auth_user WHERE user_id='$login_user'" ;
		$result = $GLOBALS['_opDB']->query($query) ;
		$arr = $GLOBALS['_opDB']->fetch_assoc($result) ;
		$auth_class = $arr['auth_class'] ;
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
			if( $arr['auth_is_nologin'] == 'O' ) {
				$auth_is_nologin = TRUE ;
			}
			$auth_class = $arr['auth_class'] ;
			
			$maj_password = $GLOBALS['_opDB']->escape_string($password) ;
			$query = "UPDATE auth_user SET password_plaintext='$maj_password' WHERE user_id='$login_user'" ;
			$GLOBALS['_opDB']->query($query) ;
		}
	}
	
	return array(
		'done' => TRUE,
		'login_data' => array(
			'login_domain' => $login_domain,
			'login_user' => $login_user,
			'login_password' => $password,
			'auth_class' => $auth_class,
			'auth_is_nologin' => $auth_is_nologin,
			'delegate_sdomainId' => $delegate_sdomainId,
			'delegate_userId' => $delegate_userId
		),
		'mysql_db' => $GLOBALS['mysql_db']
	) ;
}

?>
