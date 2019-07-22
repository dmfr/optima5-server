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







// ********** Run Query ************

$json = paracrm_queries_direct( array(
	'q_type' => 'qsql',
	'q_id'   => 'SWORD::3.AWB_SetReady'
), $auth_bypass=TRUE, $is_rw=TRUE) ;

$json = paracrm_queries_direct( array(
	'q_type' => 'qsql',
	'q_id'   => 'SWORD::3.Export_AWB'
), $auth_bypass=TRUE, $is_rw=TRUE) ;

//print_r($json) ;

$tab = $json['tabs'][0] ;
unset($tab['SQL_debug']) ;

//print_r($tab['data']) ;
$rows = array() ;
$row = array() ;
foreach( $tab['columns'] as $col ) {
	$row[] = $col['text'] ;
}
$rows[] = $row ;
foreach( $tab['data'] as $row ) {
	$rows[] = $row ;
}

$buffer = '' ;
foreach( $rows as $row ) {
	$arr_csv = array() ;
	foreach( $row as $idx=>$val ) {
		$val = str_replace(array("\r","\n",',',';','"'), ' ', $val) ;
		$arr_csv[] = $val ;
	}
	$lig = implode(';',$arr_csv) ;
	$lig = utf8_decode($lig) ;
	$buffer.= $lig."\r\n" ;
}
if( count($tab['data'])==0 ) {
	$buffer = NULL ;
}

// *********************************

if( $buffer ) {
	$filename = 'SLS_AWB_'.date('Ymd').'_'.date('His').'.csv' ;
	$filepath = $out_dir.'/'.$filename ;
	file_put_contents($filepath,$buffer) ;
}
if( $buffer && false ) {
	$filename = 'SLS_AWB_'.date('Ymd').'_'.date('His').'.csv' ;
	$filepath = '/home/mirabel/SLS_AWB'.'/'.$filename ;
	file_put_contents($filepath,$buffer) ;
}



?>
