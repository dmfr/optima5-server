<?php
$app_root='..' ;
$server_root='.' ;
if( is_file($app_root.'/DEV') ) {
	if( $_POST )
	{
		$data = print_r($_POST,TRUE) ;
		$filename = "/var/log/apache2/android_".time().'_'.strlen($data).'.txt' ;
		@file_put_contents($filename,$data) ;
	}
	else
	{
		$filename = "/var/log/apache2/android_".time().'_0.txt' ;
		@file_put_contents($filename,"No data") ;
	}
}

if( $_SERVER['PATH_INFO'] && strlen($_SERVER['PATH_INFO']) > 1 ) {
	$_PATH_INFO = explode('/',$_SERVER['PATH_INFO']) ;
	if( count($_PATH_INFO) != 3 ) {
		header("HTTP/1.0 404 Not Found");
		die() ;
	}
	
	$_POST['_domainId'] = $_PATH_INFO[1] ;
	$_POST['_sdomainId'] = $_PATH_INFO[2] ;
	
}

$domain = $_POST['_domainId'].'_prod' ;
$sdomain_id = $_POST['_sdomainId'] ;
if( !$domain || !$sdomain_id )
	die() ;


session_start() ;

$_SESSION['login_data']['mysql_db'] = 'op5_'.$domain ;
$_SESSION['login_data']['login_domain'] = $domain ;

include("$server_root/include/config.inc.php");
include("$server_root/include/toolfunctions.inc.php");

include("$server_root/modules/media/include/media.inc.php");





include( "$server_root/include/database/mysql_DB.inc.php" ) ;
$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, '', $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;

// *** Check DATABASES to issue 404 if not found ***
$obj_dmgr_base = new DatabaseMgr_Base() ;
$obj_dmgr_sdomain = new DatabaseMgr_Sdomain( $_POST['_domainId'] ) ;
if( !$obj_dmgr_base->baseDb_exists($_POST['_domainId']) || !$obj_dmgr_sdomain->sdomainDb_exists($_POST['_sdomainId']) ) {
	header("HTTP/1.0 404 Not Found");
	die() ;
}

// ************************

$_opDB->select_db( $mysql_db ) ;

// ************************
if( !$_POST['_moduleId'] ) {
	$_POST['_moduleId'] = 'crmbase' ;
}
// ************************

$my_module = $_POST['_moduleId'] ;
if( $my_module == 'crmbase' ) {
	$my_module = 'paracrm' ;
}
include("$server_root/modules/$my_module/backend_$my_module.inc.php");

$my_sdomain = $_POST['_sdomainId'] ;
if( $my_sdomain ) {
	$domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
	$obj_dmgr_base = new DatabaseMgr_Base() ;
	$obj_dmgr_sdomain = new DatabaseMgr_Sdomain( $domain_id ) ;
	if( $obj_dmgr_base->baseDb_needUpdate( $domain_id ) || $obj_dmgr_sdomain->sdomainDb_needUpdate( $my_sdomain ) ) {
		header('HTTP/1.1 503 Service Temporarily Unavailable');
		die() ;
	}
	
	$_opDB->select_db( $mysql_db.'_'.$my_sdomain ) ;
}

switch( $my_module ) {
	case 'paracrm' :
	switch( $_POST['_action'] ) {
		// Pour les actions suivantes, on laisse le traitement de l'authentification au backend
		case 'android_getDbImage' :
		case 'android_getDbImageTab' :
		case 'android_getDbImageTimestamp' :
		break ;
		
		default:
		if( !$_POST['__ANDROID_ID'] || !paracrm_lib_android_authDevice_ping($_POST['__ANDROID_ID'],$ping=false) ) {
			header("HTTP/1.0 403 Forbidden");
			die() ;
		}
		break ;
	}
	$TAB = backend_specific( $_POST ) ;
	break ;

	default :
	header("HTTP/1.0 404 Not Found");
	die() ;
	break ;
}

$_opDB->select_db( $mysql_db ) ;

session_destroy() ;

//ob_end_clean() ;
//header('Content-type: text/html');
die( json_encode($TAB) ) ;




?>
