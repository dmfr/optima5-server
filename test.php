<?php
print_r( json_decode('["ALM"]') ) ;

$server_root = dirname($_SERVER['SCRIPT_NAME']).'/server' ;
if( $_SERVER['SCRIPT_NAME'] == '' )
	$server_root = './server' ;

include("$server_root/include/config.inc.php");

include( "$server_root/include/database/mysql_DB.inc.php" ) ;
$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, $mysql_db, $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;

$my_module = 'paracrm' ;
include("$server_root/modules/$my_module/backend_$my_module.inc.php");

$_opDB->select_db( $mysql_db.'_'.$my_module) ;

print_r( paracrm_lib_file_access( 'VISIT' ) ) ;




?>
