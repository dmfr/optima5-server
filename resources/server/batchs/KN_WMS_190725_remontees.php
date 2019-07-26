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

$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
$_SESSION['login_data']['mysql_db'] = 'op5_'.$_domain_id.'_prod' ;
$_SESSION['login_data']['login_domain'] = $_domain_id.'_prod' ;
$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;


$TAB = array() ;
$query = "SELECT cde_noscde FROM oscar_eve.cde WHERE cde_class NOT IN ('2MAN','L') AND mag_code='FR-LMX' and etat_is_expe_ok<>'O'" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$TAB[] = $arr[0] ;
}

print_r($TAB) ;

$list_noscde = $_opDB->makeSQLlist($TAB) ;

$query = "SELECT count(*) FROM view_file_CDE WHERE field_CDE_NR IN {$list_noscde} AND field_STATUS='100'" ;
$nb = $_opDB->query_uniqueValue($query) ;
echo "$nb\n" ;


$query = "UPDATE view_file_CDE SET field_STATUS='90' WHERE field_CDE_NR IN {$list_noscde} AND field_STATUS='100'" ;
$_opDB->query($query) ;

exit ;

?>
