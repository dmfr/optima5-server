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
$_opDB->connect_mysql( $mysql_host, $mysql_db, $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;

include("$server_root/modules/spec_dbs_tracy/backend_spec_dbs_tracy.inc.php");


$query = "select filerecord_parent_id, field_STEP_CODE,count(*) as cnt from view_file_CDE_STEP group by filerecord_parent_id,field_STEP_CODE having cnt>'1'" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$arr[2]-- ;
	
	echo $query = "DELETE FROM view_file_CDE_STEP WHERE filerecord_parent_id='{$arr[0]}' AND field_STEP_CODE='{$arr[1]}'
	ORDER BY field_STATUS_IS_OK ASC LIMIT {$arr[2]}" ;
	$_opDB->query($query) ;
	
	
	echo "\n" ;
}




?>
