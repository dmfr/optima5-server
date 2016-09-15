<?php
//ini_set( 'memory_limit', '4096M');
$server_root = dirname($_SERVER['SCRIPT_NAME']).'/..' ;
if( $_SERVER['SCRIPT_NAME'] == '' )
	$server_root = './..' ;

$app_root='..' ;
//$server_root='.' ;

//include("$server_root/backend_checksession.inc.php") ;

include("$server_root/include/config.inc.php");

include( "$server_root/include/database/mysql_DB.inc.php" ) ;
include( "$server_root/modules/media/include/media.inc.php" );


$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, '', $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;


function print_usage() {
	$str = <<<EOF

Available commands :
   domainadd <domain_id>              : Add new empty domain
   domaindel <domain_id>              : Delete specified domain & data (WARNING!)
   domainupdate <domain_id>           : Update DB schema
   useraddadmin <user_id>@<domain_id> : Add user with admin privileges
   userdel <user_id>@<domain_id>      : Delete user
   passwd <user_id>@<domain_id>       : Change user password


EOF;

	die($str) ;
}


function inputStd( $invite_msg, $silent=FALSE ) {
	echo $invite_msg ;
	return fgets(STDIN) ;
}

function openBaseDb( $domain_id, $do_select=TRUE ) {
	global $_opDB ;
	
	$domain_base_db = DatabaseMgr_Base::getBaseDb($domain_id) ;
	
	$result = $_opDB->query("SHOW DATABASES") ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		if( $arr[0] == $domain_base_db ) {
			if( $do_select ) {
				$_opDB->select_db($domain_base_db) ;
			}
			return ;
		}
	}
	die("ERR: Non existant domain [ $domain_id ]\nAbort.\n") ;
}

function setPasswd( $domain_id, $user_id, $passwd ) {
	global $_opDB ;
	openBaseDb( $domain_id ) ;
	$password_sha1 = sha1($user_id.AUTH_SHA1_SALT.trim($passwd)) ;
	$query = "UPDATE auth_user SET password_sha1='{$password_sha1}' WHERE user_id='{$user_id}'" ;
	$_opDB->query($query) ;
}

function action_passwd( $domain_id, $user_id ) {
	global $_opDB ;
	
	openBaseDb($domain_id) ;
	$query = "SELECT count(*) FROM auth_user WHERE user_id='{$user_id}'" ;
	if( $_opDB->query_uniqueValue($query) != 1 ) {
		die("ERR: Non existant user [ $user_id ] on [ $domain_id ]\nAbort.\n") ;
	}
	
	$newpasswd = trim(inputStd("New password for user {$user_id}@{$domain_id} : ")) ;
	if( !$newpasswd ) {
		echo "Aborted.\n" ;
		exit ;
	}
	$newpasswd_confirm = trim(inputStd("Confirm password : ")) ;
	if( $newpasswd_confirm != $newpasswd ) {
		die("ERR: Passwords don't match\nAbort.\n") ;
	}
	
	setPasswd( $domain_id, $user_id, $newpasswd );
	die("OK: Password changed\n") ;
}
function action_useraddadmin( $domain_id, $user_id ) {
	global $_opDB ;
	
	openBaseDb($domain_id) ;
	$query = "SELECT count(*) FROM auth_user WHERE user_id='{$user_id}'" ;
	if( $_opDB->query_uniqueValue($query) == 1 ) {
		die("ERR: User [ $user_id ] on [ $domain_id ] already exists\nAbort.\n") ;
	}
	$newpasswd = trim(inputStd("Password for user {$user_id}@{$domain_id} : ")) ;
	if( !$newpasswd ) {
		echo "Aborted.\n" ;
		exit ;
	}
	$newpasswd_confirm = trim(inputStd("Confirm password : ")) ;
	if( $newpasswd_confirm != $newpasswd ) {
		die("ERR: Passwords don't match\nAbort.\n") ;
	}
	
	$arr_ins = array() ;
	$arr_ins['user_id'] = $user_id ;
	$arr_ins['auth_class'] = 'A' ;
	$_opDB->insert('auth_user',$arr_ins) ;
	setPasswd( $domain_id, $user_id, $newpasswd );
	die("OK: Superuser [ $user_id ] on [ $domain_id ] has been created\n") ;
}
function action_userdel( $domain_id, $user_id ) {
	global $_opDB ;
	
	openBaseDb($domain_id) ;
	$query = "SELECT count(*) FROM auth_user WHERE user_id='{$user_id}'" ;
	if( $_opDB->query_uniqueValue($query) != 1 ) {
		die("ERR: Non existant user [ $user_id ] on [ $domain_id ]\nAbort.\n") ;
	}
	
	$result = $_opDB->query("SHOW TABLES") ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		if( strpos($arr[0],'auth_user')===0 ) {
			$query = "DELETE FROM {$arr[0]} WHERE user_id='{$user_id}'" ;
			$_opDB->query($query) ;
		}
	}
	
	die("OK: User [ $user_id ] on [ $domain_id ] has been deleted\n") ;
}
function action_domainadd( $domain_id ) {
	global $_opDB ;
	
	$domain_base_db = DatabaseMgr_Base::getBaseDb($domain_id) ;
	
	$result = $_opDB->query("SHOW DATABASES") ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		if( $arr[0] == $domain_base_db ) {
			die("ERR: Domain [ $domain_id ] already exists\nAbort.\n") ;
		}
	}
	if( preg_match('/[^a-z]/', $domain_id) ) {
		die("ERR: Invalid domainID [ $domain_id ]\nAbort.\n") ;
	}
	
	$t = new DatabaseMgr_Base() ;
	$t->baseDb_create( $domain_id ) ;
	die("OK: Domain [ $domain_id ] has been created\n") ;
}
function action_domaindel( $domain_id ) {
	global $_opDB ;
	
	openBaseDb($domain_id,$do_select=FALSE) ;
	
	$confirm_domainId = trim(inputStd("Confirm <domain_id> to delete : ")) ;
	if( $confirm_domainId != $domain_id ) {
		die("ERR: <domain_id> doesn't match\nAbort.\n") ;
	}
	echo "WARNING: domain [ $domain_id ] and all associated data will be permanently deleted !\n" ;
	if( trim(inputStd("Enter \"yes\" to confirm : ")) != 'yes' ) {
		die("Abort.\n") ;
	}
	
	$t = new DatabaseMgr_Sdomain( $domain_id ) ;
	foreach( $t->sdomains_getAll() as $sdomain_id ) {
		$t->sdomainDb_delete( $sdomain_id ) ;
	}
	
	$t = new DatabaseMgr_Base() ;
	$t->baseDb_delete( $domain_id ) ;
	die("OK: Domain [ $domain_id ] has been deleted\n") ;
}
function action_domainupdate( $domain_id ) {
	global $_opDB ;
	
	openBaseDb($domain_id,$do_select=FALSE) ;
	
	$t = new DatabaseMgr_Base() ;
	$t->baseDb_updateSchema( $domain_id ) ;
	
	$t = new DatabaseMgr_Sdomain( $domain_id ) ;
	foreach( $t->sdomains_getAll() as $sdomain_id ) {
		$t->sdomainDb_updateSchema( $sdomain_id ) ;
	}
	
	die("OK.\n") ;
}
function action_domainmigrate1607( $domain_id ) {
	global $_opDB ;
	
	$_SESSION['login_data']['mysql_db'] = 'op5_'.$domain_id.'_prod' ;
	$_SESSION['login_data']['login_domain'] = $domain_id.'_prod' ;
	
	openBaseDb($domain_id,$do_select=FALSE) ;
	
	$t = new DatabaseMgr_Base() ;
	$t->baseDb_updateSchema( $domain_id ) ;
	
	$t = new DatabaseMgr_Sdomain( $domain_id ) ;
	foreach( $t->sdomains_getAll() as $sdomain_id ) {
		//which DB ?
		$sdomain_db = $t->getSdomainDb( $sdomain_id ) ;
		
		$arr_tables = array() ;
		$query = "SHOW TABLES FROM {$sdomain_db} LIKE 'store_file%'" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE )
			$arr_tables[] = $arr[0] ;
			
		if( !in_array('store_file',$arr_tables) ) {
			continue ;
		}
		
		$t->sdomainDb_updateSchema( $sdomain_id ) ;
		
		$map_oldFilerecordId_fileCode = array() ;
		$query = "SELECT filerecord_id, file_code FROM {$sdomain_db}.store_file" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$map_oldFilerecordId_fileCode[$arr[0]] = $arr[1] ;
		}
		
		foreach( $arr_tables as $db_table ) {
			if( $db_table == 'store_file' ) {
				continue ;
			}
			$file_code = substr($db_table,strlen('store_file_')) ;
			
			$query = "UPDATE {$sdomain_db}.{$db_table} sf, {$sdomain_db}.store_file s
						SET 
							sf.filerecord_parent_id = s.filerecord_parent_id,
							sf.sync_vuid = s.sync_vuid,
							sf.sync_is_deleted = s.sync_is_deleted,
							sf.sync_timestamp = s.sync_timestamp
						WHERE sf.filerecord_id = s.filerecord_id AND s.file_code='{$file_code}'" ;
			$_opDB->query($query) ;
			
			$query = "DELETE FROM {$sdomain_db}.store_file WHERE file_code='{$file_code}'" ;
			$_opDB->query($query) ;
			
			$query = "SELECT max(filerecord_id) FROM {$sdomain_db}.{$db_table}" ;
			$max_id = $_opDB->query_uniqueValue($query) ;
			$max_id++ ;
			$query = "ALTER TABLE {$sdomain_db}.{$db_table} AUTO_INCREMENT = {$max_id}" ;
			$_opDB->query($query) ;
		}
		$query = "DROP TABLE {$sdomain_db}.store_file" ;
		$_opDB->query($query) ;
		
		
		// migrate media
		media_contextOpen( $sdomain_id ) ;
		$media_path = media_contextGetDirPath() ;
		foreach( glob($media_path.'/'.'*') as $filepath ) {
			$filename = basename($filepath) ;
			$ttmp = explode('.',$filename) ;
			$id = $ttmp[0] ;
			if( is_numeric($id) && $map_oldFilerecordId_fileCode[$id] ) {
				media_img_move($id,media_img_toolFile_getId($map_oldFilerecordId_fileCode[$id],$id)) ;
			}
		}
		media_contextClose() ;
	}
	
	die("OK.\n") ;
}
function action_domainmigrate1607fix( $domain_id ) {
	global $_opDB ;
	
	$_SESSION['login_data']['mysql_db'] = 'op5_'.$domain_id.'_prod' ;
	$_SESSION['login_data']['login_domain'] = $domain_id.'_prod' ;
	
	openBaseDb($domain_id,$do_select=FALSE) ;
	
	$t = new DatabaseMgr_Base() ;
	$t->baseDb_updateSchema( $domain_id ) ;
	
	$t = new DatabaseMgr_Sdomain( $domain_id ) ;
	foreach( $t->sdomains_getAll() as $sdomain_id ) {
		//which DB ?
		$sdomain_db = $t->getSdomainDb( $sdomain_id ) ;
		
		$arr_tables = array() ;
		$query = "SHOW TABLES FROM {$sdomain_db} LIKE 'store_file%'" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE )
			$arr_tables[] = $arr[0] ;
			
		foreach( $arr_tables as $db_table ) {
			$query = "SELECT max(filerecord_id) FROM {$sdomain_db}.{$db_table}" ;
			$max_id = $_opDB->query_uniqueValue($query) ;
			$max_id++ ;
			$query = "ALTER TABLE {$sdomain_db}.{$db_table} AUTO_INCREMENT = {$max_id}" ;
			$_opDB->query($query) ;
		}
	}
	
	die("OK.\n") ;
}


switch( $action = $argv[1] ) {
	case 'useraddadmin' :
	case 'userdel' :
	case 'passwd' :
		$ttmp = explode('@',strtolower($argv[2])) ;
		$domain_id = $ttmp[1] ;
		$user_id = $ttmp[0] ;
		if( !$user_id || !$domain_id ) {
			print_usage() ;
		}
		switch( $action ) {
			case 'useraddadmin' :
				action_useraddadmin( $domain_id, $user_id );
				break ;
			case 'userdel' :
				action_userdel( $domain_id, $user_id );
				break ;
			case 'passwd' :
				action_passwd( $domain_id, $user_id );
				break ;
		}
		break ;
	
	case 'domainadd' :
	case 'domaindel' :
	case 'domainupdate' :
	case 'domainmigrate1607' ;
	case 'domainmigrate1607fix' ;
		$domain_id = strtolower($argv[2]) ;
		if( !$domain_id ) {
			print_usage() ;
		}
		switch( $action ) {
			case 'domainadd' :
				action_domainadd( $domain_id );
				break ;
			case 'domaindel' :
				action_domaindel( $domain_id );
				break ;
			case 'domainupdate' :
				action_domainupdate( $domain_id );
				break ;
			case 'domainmigrate1607' :
				action_domainmigrate1607( $domain_id );
				break ;
			case 'domainmigrate1607fix' :
				action_domainmigrate1607fix( $domain_id );
				break ;
		}
		break ;
	
	
	default :
	print_usage() ;
}




?>
