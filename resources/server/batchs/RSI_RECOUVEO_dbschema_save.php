<?php
session_start() ;

$app_root = dirname($_SERVER['SCRIPT_NAME']).'/../../..' ;
$server_root=$app_root.'/server' ;
$resources_root=$app_root.'/resources' ;
$templates_dir=$resources_root.'/server/templates' ;

@include_once 'PHPExcel/PHPExcel.php' ;

include("$server_root/include/config.inc.php");
include("$server_root/include/toolfunctions.inc.php");
include("$server_root/modules/media/include/media.inc.php");

include( "$server_root/include/database/mysql_DB.inc.php" ) ;
$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, $mysql_db, $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;

$working_dir = dirname($_SERVER['SCRIPT_NAME']) ;
$dbschema_path = $working_dir."/"."RSI_RECOUVEO_dbschema.json" ;

$define_tables = array('define_bible','define_bible_tree','define_bible_entry','define_file','define_file_entry') ;
$json = array() ;
foreach( $define_tables as $table ) {
	$json[$table] = array() ;
	$query = "SELECT * FROM {$table}" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$mkey_fieldCode = 'entry_field_code' ;
		if( isset($arr[$mkey_fieldCode]) && strpos($arr[$mkey_fieldCode],'ATR_')===0 ) {
			continue ;
		}
	
		$json[$table][] = $arr ;
	}
}
file_put_contents($dbschema_path,json_encode($json,JSON_PRETTY_PRINT)) ;
die() ;
?>
