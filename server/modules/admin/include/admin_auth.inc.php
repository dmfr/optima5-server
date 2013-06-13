<?php

function admin_auth_users_getList($post_data) {
	global $_opDB ;
	
	$arr_users_linkgroups = array() ;
	$query = "SELECT * FROM auth_user_link_group ORDER BY user_id, user_linkgroup_ssid" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$user_id = $arr['user_id'] ;
		unset($arr['user_id']) ;
		unset($arr['user_linkgroup_ssid']) ;
		
		if( !isset($arr_users_linkgroups[$user_id]) ) {
			$arr_users_linkgroups[$user_id] = array() ;
		}
		$arr_users_linkgroups[$user_id][] = $arr ;
	}
	
	$arr_users = array() ;
	$query = "SELECT * FROM auth_user ORDER BY user_id" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$user_id = $arr['user_id'] ;
		unset($arr['password_sha1']) ;
		
		if( $arr['auth_class'] == 'A' ) {
			$arr['auth_is_admin'] = TRUE ;
		} else {
			$arr['auth_is_admin'] = FALSE ;
		}
		unset($arr['auth_class']) ;
		
		$arr['auth_is_disabled'] = ($arr['auth_is_disabled']=='O') ;
		
		if( !isset($arr_users_linkgroups[$user_id]) ) {
			$arr_users_linkgroups[$user_id] = array() ;
		}
		$arr['link_groups'] = $arr_users_linkgroups[$user_id] ;
		
		$arr_users[] = $arr ;
	}

	return array(
		'data'=>$arr_users,
		'success'=>true
	);
}

function admin_auth_groups_getList($post_data) {
	global $_opDB ;
	
	$arr_groups_actions = array() ;
	$query = "SELECT * FROM auth_group_action ORDER BY group_id, group_action_ssid" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$group_id = $arr['group_id'] ;
		unset($arr['group_id']) ;
		unset($arr['group_action_ssid']) ;
		
		$bool_fields = array() ;
		$bool_fields[] = 'action_param_is_wildcard' ;
		$bool_fields[] = 'auth_has_read' ;
		$bool_fields[] = 'auth_has_write' ;
		foreach( $bool_fields as $mkey ) {
			$arr[$mkey] = ($arr[$mkey]=='O') ;
		}
	
		if( !isset($arr_groups_actions[$group_id]) ) {
			$arr_groups_actions[$group_id] = array() ;
		}
		$arr_groups_actions[$group_id][] = $arr ;
	}
	
	$arr_groups = array() ;
	$query = "SELECT * FROM auth_group ORDER BY group_id" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$group_id = $arr['group_id'] ;
		
		if( !isset($arr_groups_actions[$group_id]) ) {
			$arr_groups_actions[$group_id] = array() ;
		}
		$arr['actions'] = $arr_groups_actions[$group_id] ;
		
		$arr_groups[] = $arr ;
	}

	return array(
		'data'=>$arr_groups,
		'success'=>true
	);
}

?>