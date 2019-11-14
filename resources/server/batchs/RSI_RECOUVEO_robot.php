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

$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
$_SESSION['login_data']['mysql_db'] = $mysql_db = 'op5_'.$_domain_id.'_prod' ;
$_SESSION['login_data']['login_domain'] = $_domain_id.'_prod' ;
$_SESSION['login_data']['auth_class'] = 'A' ;
$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;
//unset($_SESSION['login_data']) ;

$_POST['_sdomainId'] = $_sdomain_id ;


//include("$server_root/modules/paracrm/backend_paracrm.inc.php");
include("$server_root/modules/spec_rsi_recouveo/backend_spec_rsi_recouveo.inc.php");

echo "Fix: LINK_DATE_OFF..." ;
$query = "SELECT filerecord_id, filerecord_parent_id
			FROM view_file_RECORD_LINK
			WHERE field_LINK_IS_ON='0' AND DATE(field_DATE_LINK_OFF)='0000-00-00'" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$filerecord_id = $arr[0] ;
	$filerecord_parent_id = $arr[1] ;
	
	$query = "SELECT min(field_DATE_LINK_ON) 
					FROM  view_file_RECORD_LINK
					WHERE filerecord_parent_id='{$filerecord_parent_id}'
					AND filerecord_id>'{$filerecord_id}'" ;
	$date_min = $_opDB->query_uniqueValue($query) ;
	
	$query = "UPDATE view_file_RECORD_LINK SET field_DATE_LINK_OFF='{$date_min}' WHERE filerecord_id='{$filerecord_id}'" ;
	$_opDB->query($query) ;
}
echo "OK\n" ;

echo "Closing 'zero' files..." ;
specRsiRecouveo_lib_autorun_closeEnd() ;
echo "OK\n" ;

echo "Opening new files..." ;
specRsiRecouveo_lib_autorun_open() ;
echo "OK\n" ;

echo "Activating records (dates)..." ;
specRsiRecouveo_lib_autorun_manageActivate() ;
echo "OK\n" ;

echo "Processing INBOX..." ;
specRsiRecouveo_lib_autorun_processInbox() ;
echo "OK\n" ;

echo "Checking addressbook..." ;
specRsiRecouveo_lib_autorun_adrbook() ;
echo "OK\n" ;

echo "Link to scenarios..." ;
specRsiRecouveo_lib_scenario_attach() ;
echo "OK\n" ;

echo "Doing auto/mail actions..." ;
specRsiRecouveo_lib_autorun_actions() ;
echo "OK\n" ;

echo "Build cache for stats..." ;
specRsiRecouveo_lib_stat_build_record_scope() ;
echo "OK\n" ;

?>
