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


function print_usage() {
	$str = <<<EOF

NOTE : Env OPTIMA_SWORDOUT must be set and must exist


EOF;

	die($str) ;
}


$out_dir = getenv('OPTIMA_SWORDOUT') ;
if( !$out_dir || !is_dir($out_dir) ) {
	print_usage() ;
	die() ;
}







// *********************************
$form_data = array(
	'date_start' => date('Y-m-d',strtotime('-30 days')),
	'date_end' => date('Y-m-d')
);

if( $buffer=specDbsTracy_report_RCL_VL02NPOD_tmp($form_data, TRUE) ) {
	$filename = 'OP5report_TRACY_.RCL_VL02NPOD_'.time().'.csv' ;
	$filepath = $out_dir.'/'.$filename ;
	file_put_contents($filepath,$buffer) ;
}
if( $buffer=specDbsTracy_report_RCL_VL02NAWB_tmp($form_data, TRUE) ) {
	$filename = 'OP5report_TRACY_.RCL_VL02NAWB_'.time().'.csv' ;
	$filepath = $out_dir.'/'.$filename ;
	file_put_contents($filepath,$buffer) ;
}




?>
