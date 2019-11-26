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

$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
$_SESSION['login_data']['mysql_db'] = 'op5_'.$_domain_id.'_prod' ;
$_SESSION['login_data']['login_domain'] = $_domain_id.'_prod' ;
$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;


$test_trsptRef = 'MBD/191104050' ;
$query = "SELECT filerecord_id FROM view_file_TRSPT WHERE field_ID_DOC='{$test_trsptRef}'" ;
$test_trsptFilerecordId = $_opDB->query_uniqueValue($query) ;


/*
echo specDbsTracy_lib_TMS_getLabel($test_trsptFilerecordId) ;
die() ;
*/

/*
echo $test_trsptFilerecordId ;

echo "\n" ;
die() ;
*/


//$test_trsptFilerecordId = 1066106 ;

$ttmp = specDbsTracy_trspt_getRecords( array('filter_trsptFilerecordId_arr'=>json_encode(array($test_trsptFilerecordId))) ) ;
//print_r($ttmp) ;
$row_trspt = $ttmp['data'][0] ;
if( $row_trspt['trspt_filerecord_id'] != $test_trsptFilerecordId ) {
	die() ;
}

specDbsTracy_lib_TMS_doLabelCreate($row_trspt) ;


?>
