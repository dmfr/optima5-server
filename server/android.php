<?php
$app_root='..' ;
$server_root='.' ;

if( $_POST )
{
	$data = print_r($_POST,TRUE) ;
	$filename = "/var/log/apache2/android_".time().'_'.strlen($data).'.txt' ;
	file_put_contents($filename,$data) ;
}
else
{
	$filename = "/var/log/apache2/android_".time().'_0.txt' ;
	file_put_contents($filename,"No data") ;
}

if(TRUE)
{
	$_POST['_domain'] = 'paramount' ;
	$_POST['_moduleName'] = 'paracrm' ;
	$_POST['_moduleAccount'] = 'generic' ;
}

$domain = $_POST['_domain'] ;
$module_name = $_POST['_moduleName'] ;
$module_account = $_POST['_moduleAccount'] ;

if( !$domain || !$module_name )
	die() ;
elseif( !$module_account )
	$module_account = 'generic' ;


session_start() ;

$_SESSION['login_data']['mysql_db'] = 'op5_'.$domain.'_prod' ;
$_SESSION['login_data']['login_domain'] = $domain."_prod" ;

include("$server_root/include/config.inc.php");

include("$server_root/modules/media/include/media.inc.php");





include( "$server_root/include/database/mysql_DB.inc.php" ) ;
$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, $mysql_db, $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;





$my_module = $_POST['_moduleName'] ;
include("$server_root/modules/$my_module/backend_$my_module.inc.php");

$_opDB->select_db( $mysql_db.'_'.$my_module) ;

switch( $my_module ) {
	case 'paracrm' :
	switch( $_REQUEST['_action'] ) {
		// Pour les actions suivantes, on laisse le traitement de l'authentification au backend
		case 'android_getDbImage' :
		case 'android_getDbImageTab' :
		case 'android_getDbImageTimestamp' :
		break ;
		
		default:
		if( !$_REQUEST['__ANDROID_ID'] || !paracrm_lib_android_authDevice_ping($_REQUEST['__ANDROID_ID'],$ping=false) ) {
			header("HTTP/1.0 403 Forbidden");
			die() ;
		}
		break ;
	}
	$TAB = backend_specific( $_REQUEST ) ;
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