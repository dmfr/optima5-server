<?php
$app_root='..' ;
$server_root='.' ;

include("$server_root/include/config.inc.php");

include( "$server_root/include/database/mysql_DB.inc.php" ) ;
$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, '', $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;

// *** Parameters ***
$_domain_id = $_POST['login_domain'] ;
$_login_user = $_POST['login_user'] ;
$_login_pass = $_POST['login_password'] ;
$_sdomain_id = $_POST['dump_sdomain'] ;

// *** Domain selectDB ***
$domain_base_db = DatabaseMgr_Base::getBaseDb($_domain_id) ;
$result = $_opDB->query("SHOW DATABASES") ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	if( $arr[0] == $domain_base_db ) {
		$_opDB->select_db($domain_base_db) ;
		$do_select = TRUE ;
		break ;
	}
}
if( !$do_select ) {
	die( json_encode( array('success'=>false, 'error'=>"ERR_DOMAIN") ) ) ;
}


// *** Authentication ***
$password_sha1 = sha1($_login_user.AUTH_SHA1_SALT.$_login_pass) ;
$query = "SELECT count(*) FROM auth_user WHERE user_id='$_login_user' AND password_sha1='{$password_sha1}' AND auth_class='A' AND auth_is_disabled<>'O'" ;
if( $_opDB->query_uniqueValue($query) != 1 ) {
	die( json_encode( array('success'=>false, 'error'=>"ERR_AUTH") ) ) ;
}


// *** Available Sdomains ***
$obj_dmgr_sdomain = new DatabaseMgr_Sdomain( $_domain_id ) ;
$arr_sdomainId = $obj_dmgr_sdomain->sdomains_getAll() ;

// *** Action ***
if( $_sdomain_id ) {
	if( !in_array($_sdomain_id,$arr_sdomainId) ) {
		return NULL ;
	}
	
	$filename_csv = 'op5dump'.'.'.$_domain_id.'.'.$_sdomain_id.'.'.date('Ymd_Hi').'.csv' ;
	$filename_zip = $filename_csv.'.zip' ;
	$filepath_csv = tempnam(sys_get_temp_dir(),'dmp') ;
	$ttmp = tempnam(sys_get_temp_dir(),'dmp') ;
	$filepath_zip = $ttmp.'.zip' ;
	unlink($ttmp) ;
	$handle = fopen( $filepath_csv , 'wb' ) ;
	
	$obj_dmgr_sdomain->sdomainDump_export( $_sdomain_id, $handle ) ;
		
	$nothing = FALSE ;
	if( ftell($handle) == 0 )
		$nothing = TRUE ;
	fclose($handle) ;
	
	if( $nothing )
		return array('success'=>true,'empty'=>true) ;
	
	$obj_zip = new ZipArchive() ;
	$obj_zip->open( $filepath_zip , ZIPARCHIVE::CREATE ) ;
	$obj_zip->addFile( $filepath_csv , $filename_csv ) ;
	$obj_zip->close() ;
	
	unlink($filepath_csv) ;
	
	
	header("Content-Type: application/force-download; name=\"$filename_zip\""); 
	header("Content-Disposition: attachment; filename=\"$filename_zip\""); 
	readfile($filepath_zip) ;
	unlink($filepath_zip) ;
	
	die() ;
	
} else {
	
	$TAB = array() ;
	
	$query = "SELECT * FROM sdomain ORDER BY sdomain_id" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$list_sdomain_id = $arr['sdomain_id'] ;
		$list_sdomain_name = $arr['sdomain_name'] ;
		
		if( in_array($list_sdomain_id, $arr_sdomainId) ) {
			$TAB[] = array('sdomain_id'=>$list_sdomain_id, 'sdomain_name'=>$list_sdomain_name) ;
		}
	}
	
	die( json_encode( array('success'=>true, 'data'=>$TAB) ) ) ;
}
