<?php
$app_root='..' ;
$server_root='.' ;

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

$TAB = backend_specific( $_REQUEST ) ;

$_opDB->select_db( $mysql_db ) ;

session_destroy() ;

//ob_end_clean() ;
//header('Content-type: text/html');
die( json_encode($TAB) ) ;




?>