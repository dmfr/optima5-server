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

include("$server_root/modules/spec_dbs_lam/backend_spec_dbs_lam.inc.php");

$db_test='op5_kn_prod_wms1808' ;

$tab = array() ;
$query = "SELECT * FROM {$db_test}.view_file_CDE WHERE field_ADR_COUNTRY='FR'" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
	$tab[] = $arr ;
}



$query = "SELECT filerecord_id FROM {$db_test}.view_file_CDE WHERE field_STATUS BETWEEN '11' AND '99'" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$filerecord_id = $arr[0] ;
	echo $filerecord_id."\n" ;
	
	//random ?
	$idx = rand( 0, count($tab)-1 ) ;
	
	$fields = array('field_ADR_NAME','field_ADR_COUNTRY','field_ADR_CP','field_ADR_FULL') ;
	$arr_update = array() ;
	foreach( $fields as $f ) {
		$arr_update[$f] = $tab[$idx][$f] ;
	}
	$_opDB->update("{$db_test}.view_file_CDE",$arr_update,array('filerecord_id'=>$filerecord_id)) ;
}

return ;


?>
