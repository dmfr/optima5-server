<?php
//ini_set( 'memory_limit', '4096M');
$server_root = dirname($_SERVER['SCRIPT_NAME']).'/..' ;
if( $_SERVER['SCRIPT_NAME'] == '' )
	$server_root = './..' ;

$app_root='..' ;
//$server_root='.' ;

//include("$server_root/backend_checksession.inc.php") ;

include("$server_root/include/config.inc.php");

include("$server_root/modules/media/include/media.inc.php");

include( "$server_root/include/database/mysql_DB.inc.php" ) ;
$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, $mysql_db, $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;

include("$server_root/modules/paracrm/backend_paracrm.inc.php");

$_opDB->select_db( $mysql_db.'_'.'paracrm') ;

/*
$post_data = array() ;
$post_data['file_code'] = 'VISIT' ;
$post_data['sync_timestamp'] = '123112312' ;
$post_data['filter'] = json_encode(array(array('condition_value'=>'PFF06','condition_sign'=>'eq','entry_field_code'=>'VSALES'))) ;
$post_data['limit'] = 50 ;


$post_data = array() ;
$post_data['file_code'] = 'VISIT' ;
$post_data['limit'] = 125 ;

paracrm_android_syncPull( $post_data ) ; 
*/
//paracrm_android_query_buildTables() ;
paracrm_android_getDbImage(array()) ;

?>