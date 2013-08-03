<?php

function desktop_config_getRecord($post_data) {
	global $_opDB ;
	
	if( !isset($_SESSION['login_data']) ) {
		return array('success'=>false) ;
	}
	
	$session_id = $_SESSION['login_data']['session_id'] ;
	$user_id = $_SESSION['login_data']['login_user'] ;
	
	$login_userName = $_opDB->query_uniqueValue("SELECT user_fullname FROM auth_user WHERE user_id='$user_id'") ;
	$login_domainName = $_opDB->query_uniqueValue("SELECT domain_name FROM domain WHERE zero_id='0'") ;
	
	// *** Annonces des Sdomains ouverts ***
	$arr_sdomains = array() ;
	$query = "SELECT * FROM sdomain" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$sdomain_id = $arr['sdomain_id'] ;
		
		$t = new DatabaseMgr_Sdomain ;
		if( $t->sdomainDb_needUpdate($sdomain_id) ) {
			$arr['db_needUpdate'] = TRUE ;
		}
		
		if( Auth_Manager::getInstance()->auth_query_sdomain_admin($sdomain_id) ) {
			$arr['auth_has_all'] = TRUE ;
		} elseif( $arr_openActions = Auth_Manager::getInstance()->auth_query_sdomain_openActions($sdomain_id) ) {
			$arr['auth_has_all'] = FALSE ;
			$arr['auth_arrOpenActions'] = $arr_openActions ;
		} else {
			continue ;
		}
		
		$arr_sdomains[] = $arr ;
	}
	
	// *** Load shortcuts ***
	$arr_shortcuts = array() ;
	$query = "SELECT shortcut_ssid , module_id FROM auth_user_pref_shortcut WHERE user_id='$user_id' ORDER BY shortcut_desktop_index" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$shortcut_ssid = $arr[0] ;
		$module_id = $arr[1] ;
		
		$record = array() ;
		$record['module_id'] = $module_id ;
		$record['params'] = array() ;
	
		$arr_shortcuts[$shortcut_ssid] = $record ;
	}
	$query = "SELECT shortcut_ssid , param_code , param_value FROM auth_user_pref_shortcut_param WHERE user_id='$user_id'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$shortcut_ssid = $arr['shortcut_ssid'] ;
		
		$record = array() ;
		$record['param_code'] = $arr['param_code'] ;
		$record['param_value'] = $arr['param_value'] ;
	
		$arr_shortcuts[$shortcut_ssid]['params'][] = $record ;
	}
	$arr_shortcuts = array_values($arr_shortcuts) ;
	
	// *** Load wallpaper ***
	$query = "SELECT wallpaper_id, wallpaper_is_stretch FROM auth_user_pref_wallpaper WHERE user_id='$user_id'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) == 1 ) {
		$arr = $_opDB->fetch_row($result) ;
		$wallpaper_id = $arr[0] ;
		$wallpaper_isStretch = ($arr[1]=='O') ;
	} else {
		$wallpaper_id = 0 ;
		$wallpaper_isStretch = false ;
	}
	
	return array(
		'desktop_config'=>array(
			'session_id' => $_SESSION['login_data']['session_id'],
			'dev_mode' => $GLOBALS['__OPTIMA_TEST'],
			'auth_is_admin' => ($_SESSION['login_data']['auth_class']=='A'),
			'auth_is_root' => ($user_id=='root'),
			'login_str' => $_SESSION['login_data']['userstr'],
			'login_userId' => $_SESSION['login_data']['login_user'],
			'login_userName' => $login_userName,
			'login_domainName' => $login_domainName,
			
			'sdomains' => $arr_sdomains,
			
			'shortcuts' => $arr_shortcuts,
			
			'wallpaper_id' => $wallpaper_id,
			'wallpaper_isStretch' => $wallpaper_isStretch
		),
		'success'=>true
	);
}

?>