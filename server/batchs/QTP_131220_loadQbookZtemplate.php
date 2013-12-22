<?php
session_start() ;
$_SESSION['next_transaction_id'] = 1 ;

//ini_set( 'memory_limit', '4096M');
$server_root = dirname($_SERVER['SCRIPT_NAME']).'/..' ;
if( $_SERVER['SCRIPT_NAME'] == '' )
	$server_root = './..' ;

$app_root='..' ;
//$server_root='.' ;

//include("$server_root/backend_checksession.inc.php") ;

include("$server_root/include/config.inc.php");
include("$server_root/include/toolfunctions.inc.php");

include("$server_root/modules/media/include/media.inc.php");

//@include_once 'PHPExcel/PHPExcel.php' ;
include( "$server_root/include/database/mysql_DB.inc.php" ) ;
$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, $mysql_db, $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;

include("$server_root/modules/paracrm/backend_paracrm.inc.php");


$qbook_id = getenv('OPTIMA_QBOOK_ID') ;
$qbook_ztemplate_ssid = getenv('OPTIMA_QBOOK_ZTEMPLATE_SSID') ;

if( !$qbook_id || !$qbook_ztemplate_ssid ) {
	fwrite(STDERR, "ERR: No queryId, ztemplateSsid specified (OPTIMA_QBOOK_ID, OPTIMA_QBOOK_ZTEMPLATE_SSID)"."\n");
	exit ;
}

$query = "SELECT ztemplate_resource_binary FROM qbook_ztemplate WHERE qbook_id='$qbook_id' AND qbook_ztemplate_ssid='$qbook_ztemplate_ssid'" ;
$result = $_opDB->query($query) ;
if( $_opDB->num_rows($result) != 1 ) {
	fwrite(STDERR, "ERR: Non existent ztemplateSsid "."\n");
	exit ;
}

if( $argv[1] && is_file($argv[1]) ){
	// load mode
	$blob = file_get_contents($argv[1]) ;
	$arr_update = array() ;
	$arr_update['ztemplate_resource_binary'] = $blob ;
	$arr_cond = array() ;
	$arr_cond['qbook_id'] = $qbook_id ;
	$arr_cond['qbook_ztemplate_ssid'] = $qbook_ztemplate_ssid ;
	$_opDB->update('qbook_ztemplate',$arr_update,$arr_cond) ;
	fwrite(STDERR, "OK"."\n");
} else {
	$arr = $_opDB->fetch_row($result) ;
	$buffer = $arr[0] ;
	echo $buffer ;
	exit ;
}

?>