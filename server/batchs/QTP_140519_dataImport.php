<?php
//ini_set( 'memory_limit', '4096M');
$server_root = dirname($_SERVER['SCRIPT_NAME']).'/..' ;
if( $_SERVER['SCRIPT_NAME'] == '' )
	$server_root = './..' ;

$app_root='..' ;
//$server_root='.' ;

//include("$server_root/backend_checksession.inc.php") ;

include("$server_root/include/config.inc.php");

include("$server_root/modules/paracrm/include/paracrm.inc.php");
include("$server_root/modules/media/include/media.inc.php");

include( "$server_root/include/database/mysql_DB.inc.php" ) ;
$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, $mysql_db, $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;

if( !getenv('OPTIMA_BIBLE_CODE') && getenv('OPTIMA_FILE_CODE') ) {
	$data_type = 'file' ;
	$store_code = getenv('OPTIMA_FILE_CODE') ;
	echo "FileCode: ".$store_code."\n" ;
} elseif( getenv('OPTIMA_BIBLE_CODE') && !getenv('OPTIMA_FILE_CODE') ) {
	$data_type = 'bible' ;
	$store_code = getenv('OPTIMA_BIBLE_CODE') ;
	echo "BibleCode: ".$store_code."\n" ;
} else {
	exit ;
}

$handle = fopen('php://stdin','rb') ;

paracrm_lib_dataImport_commit_processHandle( $data_type, $store_code, $handle ) ;

fclose($handle) ;


?>