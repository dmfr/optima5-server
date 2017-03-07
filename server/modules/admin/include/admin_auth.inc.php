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
		
		$arr['auth_has_all'] = ($arr['auth_has_all']=='O') ;
		
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

function admin_auth_uglinks_set($post_data) {
	global $_opDB ;
	
	foreach( json_decode($post_data['data'],true) as $user_id => $arr_link_group_id ) {
		$query = "SELECT user_id FROM auth_user WHERE user_id='$user_id'" ;
		$result = $_opDB->query($query) ;
		if( $_opDB->num_rows($result) != 1 ) {
			continue ;
		}
		$arr = $_opDB->fetch_row($result) ;
		$user_id = $arr[0] ;
		
		$query = "DELETE FROM auth_user_link_group WHERE user_id='$user_id'" ;
		$_opDB->query($query) ;
		
		$user_linkgroup_ssid = 0 ;
		foreach( $arr_link_group_id as $link_group_id ) {
			$user_linkgroup_ssid++ ;
			
			$arr_ins = array() ;
			$arr_ins['user_id'] = $user_id ;
			$arr_ins['user_linkgroup_ssid'] = $user_linkgroup_ssid  ;
			$arr_ins['link_group_id'] = $link_group_id ;
			$_opDB->insert('auth_user_link_group',$arr_ins) ;
		}
	}

	return array('success'=>true) ;
}

function admin_auth_getSdomainActionsTree( $post_data ) {
	global $_opDB ;
	
	$tmp_dbengine_sizes = array() ;
	$query = "SELECT table_schema, sum( data_length + index_length ) / 1024 / 1024
				FROM information_schema.TABLES GROUP BY table_schema" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$tmp_dbengine_sizes[$arr[0]] = $arr[1] ;
	}
	
	$sdomain_id = $post_data['sdomain_id'] ;
	$db_name = $GLOBALS['mysql_db'].'_'.$sdomain_id ;
	if( !isset($tmp_dbengine_sizes[$db_name]) ) {
		return array('success'=>false) ;
	}
	
	
	
	$children = array() ;
	
	
	// interro des bible
	$child_bible = array(
		'text' => '<b>Bible Library</b>',
		'action_code' => 'bible',
		'action_param_is_wildcard' => true,
		'icon' => 'images/op5img/'.'ico_dataadd_16.gif',
		'children' => array()
	) ;
	$query = "SELECT bible_code , bible_lib, bible_iconfile FROM {$db_name}.define_bible ORDER BY bible_code" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$entry = array() ;
		$entry['text'] = $arr['bible_lib'] ;
		$entry['icon'] = 'images/op5img/'.$arr['bible_iconfile'] ;
		$entry['action_code'] = 'bible' ;
		$entry['action_param_is_wildcard'] = false ;
		$entry['action_param_data'] = 'bible_code:'.$arr['bible_code'] ;
		
		$child_bible['children'][] = $entry ;
	}
	$children[] = $child_bible ;
	
	
	// interro des files
	$child_files = array(
		'text' => '<b>Data files</b>',
		'action_code' => 'files',
		'action_param_is_wildcard' => true,
		'icon' => 'images/op5img/'.'ico_filechild_16.gif',
		'children' => array()
	) ;
	$query = "SELECT file_code , file_lib, file_iconfile FROM {$db_name}.define_file
				WHERE file_parent_code='' ORDER BY file_code" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$entry = array() ;
		$entry['text'] = $arr['file_lib'] ;
		$entry['icon'] = 'images/op5img/'.$arr['file_iconfile'] ;
		$entry['action_code'] = 'files' ;
		$entry['action_param_is_wildcard'] = false ;
		$entry['action_param_data'] = 'file_code:'.$arr['file_code'] ;
		
		$child_files['children'][] = $entry ;
	}
	$children[] = $child_files ;
	
	
	// interro des queries
	$child_queries = array(
		'text' => '<b>Queries</b>',
		'action_code' => 'queries',
		'action_param_is_wildcard' => true,
		'icon' => 'images/op5img/'.'ico_blocs_small.gif',
		'children' => array()
	) ;
		
	$arr_nested_query_id = array() ;
	$arr_nested_qmerge_id = array() ;
	$query = "SELECT * FROM {$db_name}.qmerge_query" ;
	$result = $_opDB->query($query);
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		if( $arr['link_query_id'] ) {
			$arr_nested_query_id[] = $arr['link_query_id'] ;
		}
		if( $arr['link_qmerge_id'] ) {
			$arr_nested_qmerge_id[] = $arr['link_query_id'] ;
		}
	}
		
	$query = "SELECT query_id , query_name FROM {$db_name}.query" ;
	$result = $_opDB->query($query);
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		if( in_array($arr['query_id'],$arr_nested_query_id) ) {
			continue ;
		}
		
		$entry = array() ;
		$entry['text'] = $arr['query_name'] ;
		$entry['icon'] = 'images/op5img/'.'ico_process_16.gif' ;
		$entry['action_code'] = 'queries' ;
		$entry['action_param_is_wildcard'] = false ;
		$entry['action_param_data'] = 'query_id:'.$arr['query_id'] ;
		
		$child_queries['children'][] = $entry ;
	}
	
	$query = "SELECT qmerge_id , qmerge_name FROM {$db_name}.qmerge" ;
	$result = $_opDB->query($query);
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		if( in_array($arr['qmerge_id'],$arr_nested_qmerge_id) ) {
			continue ;
		}
		
		$entry = array() ;
		$entry['text'] = $arr['qmerge_name'] ;
		$entry['icon'] = 'images/op5img/'.'ico_filechild_16.gif' ;
		$entry['action_code'] = 'queries' ;
		$entry['action_param_is_wildcard'] = false ;
		$entry['action_param_data'] = 'qmerge_id:'.$arr['qmerge_id'] ;
		
		$child_queries['children'][] = $entry ;
	}
	
	$query = "SELECT qweb_id , qweb_name FROM {$db_name}.qweb" ;
	$result = $_opDB->query($query);
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$entry = array() ;
		$entry['text'] = $arr['qweb_name'] ;
		$entry['icon'] = 'images/op5img/'.'ico_planet_16.png' ;
		$entry['action_code'] = 'queries' ;
		$entry['action_param_is_wildcard'] = false ;
		$entry['action_param_data'] = 'qweb_id:'.$arr['qweb_id'] ;
		
		$child_queries['children'][] = $entry ;
	}
	
	$usort = function($arr1,$arr2)
	{
		return strcasecmp($arr1['text'],$arr2['text']) ;
	};
	usort($child_queries['children'],$usort) ;
	
	$children[] = $child_queries ;
	
	
	return array('success'=>true , 'children'=>$children) ;
}

function admin_auth_setGroup( $post_data ) {
	global $_opDB ;

	$arr_update = array() ;
	if( $post_data['_is_new'] ) {
		
		$arr_update['sdomain_id'] = strtolower($post_data['sdomain_id']) ;
		if( $arr_update['sdomain_id'] == '' ) {
			$missing_sdomain = TRUE ;
		}
		
		$query_test = "SELECT sdomain_id FROM sdomain WHERE sdomain_id='{$arr_update['sdomain_id']}'" ;
		if( $_opDB->num_rows($_opDB->query($query_test)) == 0 ) {
			$missing_sdomain = TRUE ;
		}
	} else {
		$query_test = "SELECT group_id FROM auth_group WHERE group_id='{$post_data['group_id']}'" ;
		if( $_opDB->num_rows($_opDB->query($query_test)) == 0 ) {
			$missing_group = TRUE ;
		}
	}
	foreach( array('group_name') as $mkey ) {
		if( $post_data[$mkey] != '' ) {
			$arr_update[$mkey] = $post_data[$mkey] ;
		} else {
			$errors_form[$mkey] = "Missing $mkey" ;
		}
	}
	foreach( array('auth_has_all') as $mkey ) {
		if( !isset($post_data[$mkey]) ) {
			$errors_form[$mkey] = "Missing $mkey" ;
		} else {
			$arr_update[$mkey] = $post_data[$mkey] ? 'O' : '' ;
		}
	}
	
	$success = TRUE ;
	if( $errors_form || $missing_sdomain || $missing_group )
		$success = FALSE ;
		
	$response = array() ;
	$response['success'] = $success ;
	if( $errors_form )
		$response['errors'] = $errors_form ;
	if( $missing_sdomain )
		$response['msg'] = 'Missing Sdomain (??)' ;
	if( $missing_group )
		$response['msg'] = 'Unknown group (Deleted ?)' ;
	if( !$response['success'] )
		return $response ;
	
	
	if( $post_data['_is_new'] ) {
		$_opDB->insert('auth_group',$arr_update) ;
		$group_id = $_opDB->insert_id();
	} else {
		$arr_cond = array() ;
		$arr_cond['group_id'] = $post_data['group_id'] ;
		$_opDB->update('auth_group',$arr_update,$arr_cond) ;
		$group_id = $arr_cond['group_id'] ;
	}
	
	$query = "DELETE FROM auth_group_action WHERE group_id='{$group_id}'" ;
	$_opDB->query($query) ;
	$group_action_ssid = 0 ;
	foreach( json_decode($post_data['actions'],true) as $action ) {
		$group_action_ssid++ ;
		
		$arr_ins['group_id'] = $group_id ;
		$arr_ins['group_action_ssid'] = $group_action_ssid ;
		$arr_ins['action_code'] = $action['action_code'] ;
		$arr_ins['action_param_is_wildcard'] = ( $action['action_param_is_wildcard'] ? 'O' : '' ) ;
		$arr_ins['action_param_data'] = $action['action_param_data'] ;
		$arr_ins['auth_has_read'] = ( $action['auth_has_read'] ? 'O' : '' ) ;
		$arr_ins['auth_has_write'] = ( $action['auth_has_write'] ? 'O' : '' ) ;
		$_opDB->insert('auth_group_action',$arr_ins) ;
	}
	
	sleep(1) ;
	return $response ;
}

function admin_auth_deleteGroup( $post_data ) {
	global $_opDB ;
	
	$group_id = $post_data['group_id'] ;
	$query = "DELETE FROM auth_group_action WHERE group_id='{$group_id}'" ;
	$_opDB->query($query) ;
	$query = "DELETE FROM auth_group WHERE group_id='{$group_id}'" ;
	$_opDB->query($query) ;
	$query = "DELETE FROM auth_user_link_group WHERE link_group_id='{$group_id}'" ;
	$_opDB->query($query) ;
	return array('success'=>true) ;
}





function admin_auth_setUser( $post_data ) {
	global $_opDB ;

	$arr_update = array() ;
	if( $post_data['_is_new'] ) {
		$arr_update['user_id'] = strtolower(trim($post_data['user_id'])) ;
		if( $arr_update['user_id'] == '' ) {
			$errors_form['user_id'] = 'user_ID unspecified' ;
		}
		
		$query_test = "SELECT user_id FROM auth_user WHERE user_id='{$arr_update['user_id']}'" ;
		if( $_opDB->num_rows($_opDB->query($query_test)) > 0 ) {
			$errors_form['user_id'] = 'Existing user_ID' ;
		}
		$user_id = $arr_update['user_id'];
	} else {
		$query_test = "SELECT user_id FROM auth_user WHERE user_id='{$post_data['user_id']}'" ;
		if( $_opDB->num_rows($_opDB->query($query_test)) == 0 ) {
			$errors_form['user_id'] = 'Unknown user_ID' ;
		}
		$user_id = $post_data['user_id'] ;
	}
	foreach( array('user_fullname','user_email') as $mkey ) {
		if( $post_data[$mkey] != '' ) {
			$arr_update[$mkey] = $post_data[$mkey] ;
		} else {
			$errors_form[$mkey] = "Missing $mkey" ;
		}
	}
	foreach( array('auth_is_disabled') as $mkey ) {
		if( !isset($post_data[$mkey]) ) {
			$errors_form[$mkey] = "Missing $mkey" ;
		} else {
			$arr_update[$mkey] = $post_data[$mkey] ? 'O' : '' ;
		}
	}
	$arr_update['auth_class'] = $post_data['auth_is_admin'] ? 'A' : 'U' ;
	
	if( $post_data['password_do_set'] == TRUE ) {
		if( trim($post_data['password_plain']) == '' ) {
			$errors_form['password_plain'] = "Empty password" ;
		} else {
			$arr_update['password_plaintext'] = $post_data['password_plain'] ;
			$arr_update['password_sha1'] = sha1($user_id.AUTH_SHA1_SALT.trim($post_data['password_plain'])) ;
		}
	}
	
	$success = TRUE ;
	if( $errors_form )
		$success = FALSE ;
		
	$response = array() ;
	$response['success'] = $success ;
	if( $errors_form )
		$response['errors'] = $errors_form ;
	if( !$response['success'] )
		return $response ;
	
	if( $post_data['_is_new'] ) {
		$_opDB->insert('auth_user',$arr_update) ;
	} else {
		$arr_cond = array() ;
		$arr_cond['user_id'] = $post_data['user_id'] ;
		$_opDB->update('auth_user',$arr_update,$arr_cond) ;
	}
	
	sleep(1) ;
	return $response ;
}

function admin_auth_deleteUser( $post_data ) {
	global $_opDB ;
	
	$user_id = $post_data['user_id'] ;
	
	foreach( $_opDB->db_tables() as $db_table ) {
		if( strpos($db_table,'auth_user') === 0 ) {
			$query = "DELETE FROM {$db_table} WHERE user_id='{$user_id}'" ;
			$_opDB->query($query) ;
		}
	}
	
	return array('success'=>true) ;
}

?>
