<?php
//ob_start() ;
$app_root='..' ;
$server_root='.' ;

include("$server_root/backend_checksession.inc.php") ;

include("$server_root/include/config.inc.php");

include("$server_root/modules/media/include/media.inc.php");

@include_once 'PHPExcel/PHPExcel.php' ;
include( "$server_root/include/database/mysql_DB.inc.php" ) ;
$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, $mysql_db, $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;

$my_module = $_POST['_moduleId'] ;
include("$server_root/modules/$my_module/backend_$my_module.inc.php");

$_opDB->select_db( $mysql_db.'_'.$my_module) ;

$TAB = backend_specific( $_POST ) ;

$_opDB->select_db( $mysql_db ) ;

//ob_end_clean() ;
//header('Content-type: text/html');
die( json_encode($TAB) ) ;
?>