<?php
//ini_set( 'memory_limit', '4096M');
$server_root = dirname($_SERVER['SCRIPT_NAME']).'/..' ;
if( $_SERVER['SCRIPT_NAME'] == '' )
	$server_root = './..' ;

$app_root='..' ;
//$server_root='.' ;

//include("$server_root/backend_checksession.inc.php") ;

include("$server_root/include/config.inc.php");

include( "$server_root/include/database/mysql_DB.inc.php" ) ;
include( "$server_root/modules/media/include/media.inc.php" );


$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, '', $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;



function procedure() {
	global $_opDB ;
	$query = "SHOW FULL PROCESSLIST" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		if( strpos($arr['User'],'tmp')===0 && strpos($arr['db'],'tmp')===0 && $arr['Time'] > 30 ) {
			print_r($arr) ;
			$query = "KILL QUERY {$arr['Id']}" ;
			$_opDB->query($query) ;
		}
	}
}

$ts_start = time() ;
while( time() < $ts_start + 59 ) {
	procedure() ;
	sleep(5) ;
}



?>
