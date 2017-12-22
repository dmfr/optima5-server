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

NOTE : Env OPTIMA_SWORDIN must be set and must exist


EOF;

	die($str) ;
}


$in_dir = getenv('OPTIMA_SWORDIN') ;
if( !$in_dir || !is_dir($in_dir) ) {
	print_usage() ;
	die() ;
}

foreach( scandir($in_dir) as $filename ) {
	if( strpos($filename,'TRACY')===0 ) {} else {
		continue ;
	}
	
	$filepath = $in_dir.'/'.$filename ;
	
	$handle = fopen($filepath,'rb') ;
	while( !feof($handle) ) {
		$arr_csv = fgetcsv($handle,0,';') ;
		
		$str_dn = $arr_csv[3] ;
		$str_awb = $arr_csv[33] ;
		
		if( $str_dn && $str_awb ) {} else {
			continue ;
		}
		
		$arr_ins = array() ;
		$arr_ins['field_STR_DN'] = $str_dn ;
		$arr_ins['field_STR_AWB'] = $str_awb ;
		paracrm_lib_data_insertRecord_file( 'SWORD_2_AWB', 0, $arr_ins );
	}
	fclose($handle) ;
	
	unlink($filepath) ;
}



?>
