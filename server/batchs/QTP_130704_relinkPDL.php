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

include("$server_root/include/GMaps.php" ) ;


$mapSrc_mag_parentFile = array() ;
$query = "SELECT e.field_VSTORE , l.filerecord_parent_id FROM view_file_VISIT e , view_file_VISIT_5PLD l WHERE e.filerecord_id=l.filerecord_parent_id GROUP BY field_VSTORE, filerecord_parent_id ORDER BY filerecord_parent_id DESC" ; 
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	if( isset($mapSrc_mag_parentFile[$arr[0]]) ) {
		continue ;
	}

	$mapSrc_mag_parentFile[$arr[0]] = $arr[1] ;
}

$mapDest_mag_parentFile = array() ;
$query = "SELECT e.field_VSTORE , e.filerecord_id FROM view_file_VISIT e ORDER BY filerecord_id DESC" ; 
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	if( isset($mapDest_mag_parentFile[$arr[0]]) ) {
		continue ;
	}

	$mapDest_mag_parentFile[$arr[0]] = $arr[1] ;
}

$mapTranslatePDL = array() ;
foreach( $mapSrc_mag_parentFile as $mag => $old_id ) {
	$new_id = $mapDest_mag_parentFile[$mag] ;
	if( !$new_id || $new_id == $old_id ) {
		continue ;
	}
	
	$mapTranslatePDL[] = array('old_id'=>$old_id,'new_id'=>$new_id) ;
}

print_r($mapTranslatePDL) ;
$time = time() ;
foreach( $mapTranslatePDL as $arr ) {

	$new_id = $arr['new_id'] ;
	$old_id = $arr['old_id'] ;

	$query = "UPDATE store_file SET filerecord_parent_id='$new_id' WHERE filerecord_parent_id='$old_id' AND file_code='VISIT_5PLD'" ;
	$_opDB->query($query) ;
	$query = "UPDATE store_file SET sync_timestamp='$time' WHERE filerecord_id='$new_id'" ;
	$_opDB->query($query) ;
}


$_opDB->select_db( $mysql_db ) ;
?>