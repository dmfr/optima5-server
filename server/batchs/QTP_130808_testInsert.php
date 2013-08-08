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

if( !$GLOBALS['__OPTIMA_TEST'] ) {
	fwrite(STDERR, "ABORT, test mode only\n"); 
}

$handle = fopen('php://stdin','rb') ;

$obj_dmgr = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() ) ;
$obj_dmgr->sdomainDump_import( DatabaseMgr_Sdomain::dbCurrent_getSdomainId(), $handle ) ;

fclose($handle) ;

?>