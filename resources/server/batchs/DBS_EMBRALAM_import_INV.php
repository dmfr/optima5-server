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

include("$server_root/modules/paracrm/backend_paracrm.inc.php");

//ini_set( 'memory_limit', '4096M');

include("$server_root/include/GMaps.php" ) ;


$file_code = 'INV' ;
$db_table = 'store_file_'.$file_code ;

$query = "TRUNCATE TABLE ".$db_table ;
$_opDB->query($query) ;
$query = "DELETE FROM store_file WHERE file_code='{$file_code}'" ;
$_opDB->query($query) ;



$first = TRUE ;
$handle = fopen("php://stdin","rb") ;
while( !feof($handle) )
{
	$arr_csv = fgetcsv($handle) ;
	if( !$arr_csv ) {
		continue ;
	}
	if( $first ) {
		$first = FALSE ;
		continue ;
	}
	
	foreach( $arr_csv as $idx => $value ) {
		if( $value == '-' ) {
			$arr_csv[$idx] = '' ;
		}
	}
	
	//print_r($arr_csv) ;
	
	$arr_ins = array() ;
	$arr_ins['field_ADR_ID'] = $arr_csv[12] ;
	$arr_ins['field_PROD_ID'] = $arr_csv[1] ;
	$arr_ins['field_BATCH_CODE'] = $arr_csv[5] ;
	$arr_ins['field_QTY_AVAIL'] = $arr_csv[9] ;
	paracrm_lib_data_insertRecord_file($file_code,0,$arr_ins) ;
	
	continue ;
}





?>