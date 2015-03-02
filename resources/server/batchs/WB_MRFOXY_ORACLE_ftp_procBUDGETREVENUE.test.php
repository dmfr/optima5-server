<?php
ini_set( 'memory_limit', '256M');

$app_root = dirname($_SERVER['SCRIPT_NAME']).'/../../..' ;
$server_root=$app_root.'/server' ;
$resources_root=$app_root.'/resources' ;
$templates_dir=$resources_root.'/server/templates' ;

include("$server_root/include/config.inc.php");
include("$server_root/include/toolfunctions.inc.php");
include("$server_root/modules/media/include/media.inc.php");

include( "$server_root/include/database/mysql_DB.inc.php" ) ;
$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, $mysql_db, $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;

include("$server_root/modules/spec_wb_mrfoxy/backend_spec_wb_mrfoxy.inc.php");
include("WB_MRFOXY_ORACLE_ftp_procBUDGETREVENUE.inc.php");

$handle_in = fopen('php://stdin','rb') ;
$handle_out = fopen('php://stdout','wb') ;

WB_MRFOXY_ORACLE_ftp_procBUDGETREVENUE($handle_in,$handle_out) ;

?>