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

echo "\n" ;

$accIds = array() ;
$query = "SELECT distinct field_LINK_ACCOUNT 
			FROM view_file_FILE f
			JOIN view_bible_CFG_STATUS_tree cs ON cs.treenode_key=f.field_STATUS" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$accIds[] = $arr[0] ;
}



foreach( $accIds as $acc_id ) {
	$arr_EC = $arr_OFF = array() ;
	
	$query = "SELECT filerecord_id, field_STATUS FROM view_file_FILE WHERE field_LINK_ACCOUNT='{$acc_id}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$filerecord_id = $arr[0] ;
		$status = $arr[1] ;
		if( strpos($status,'S0')===0 ) {
			$arr_OFF[] = $filerecord_id ;
		}
		if( strpos($status,'S1')===0 ) {
			$arr_EC[] = $filerecord_id ;
		}
	}
	
	if( (count($arr_OFF) <= 1) && (count($arr_OFF) <= 1) ) {
		continue ;
	}
	
	if( count($arr_OFF) > 1 ) {
		echo $acc_id."\n" ;
	}
	
}




//print_r($accIds) ;








?>
