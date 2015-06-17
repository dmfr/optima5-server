<?php


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


include("$server_root/modules/paracrm/backend_paracrm.inc.php");

for( $i=1 ; $i<100 ; $i++ ) {
	$value = str_pad($i, 2, "0", STR_PAD_LEFT); 
	
	$arr_ins = array() ;
	$arr_ins['field_DPT_CODE'] = $value ;
	paracrm_lib_data_insertRecord_bibleEntry( 'CFG_DPT', $value, '', $arr_ins ) ;
	
	$arr_ins = array() ;
	$arr_ins['field_AGE'] = $value ;
	paracrm_lib_data_insertRecord_bibleEntry( 'CFG_AGE', $value, '', $arr_ins ) ;
}



?>