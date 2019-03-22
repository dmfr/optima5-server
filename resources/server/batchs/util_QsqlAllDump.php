<?php

$app_root = dirname($_SERVER['SCRIPT_NAME']).'/../../..' ;
$server_root=$app_root.'/server' ;
$resources_root=$app_root.'/resources' ;
$templates_dir=$resources_root.'/server/templates' ;

include("$server_root/include/config.inc.php");
include("$server_root/include/toolfunctions.inc.php");
include("$server_root/modules/media/include/media.inc.php");

include( "$server_root/include/database/mysql_DB.inc.php" ) ;
$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, '', $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;

function print_usage() {
	$str = <<<EOF

NOTE : Env OPTIMA_DB must be set (= op5)
Env variable :
   OUT_DIR            : Output folder, must be writable


EOF;

	die($str) ;
}

$out_dir = getenv('OUT_DIR') ;
if( !$out_dir || !is_dir($out_dir) || !is_writable($out_dir) ) {
	print_usage() ;
}


$arr_databases = array() ;
$query = "SHOW DATABASES" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$arr_databases[] = $arr[0] ;
}
sort($arr_databases) ;


$dir_1 = 'util_QsqlAllDump'.'.'.date('Y-m-d').'_'.date('H:i:s') ;
foreach( $arr_databases as $db ) {
	$dir_2 = $db ;
	$_opDB->select_db($db) ;
	
	$query = "SHOW TABLES FROM {$db} LIKE 'qsql'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) == 0 ) {
		continue ;
	}
	
	$query = "SELECT qsql_name, sql_querystring FROM qsql ORDER BY qsql_name" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		if( !is_dir($out_dir.'/'.$dir_1) ) {
			mkdir( $out_dir.'/'.$dir_1 ) ;
		}
		if( !is_dir($out_dir.'/'.$dir_1.'/'.$dir_2) ) {
			mkdir( $out_dir.'/'.$dir_1.'/'.$dir_2 ) ;
		}
		
		$qsql_name = $arr[0] ;
		$sql_querystring = $arr[1] ;
		
		$filepath = $out_dir.'/'.$dir_1.'/'.$dir_2.'/'.preg_replace("/[^a-zA-Z0-9]/", "_", $qsql_name).'.sql' ;
		file_put_contents($filepath,$sql_querystring) ;
	}
}




?>
