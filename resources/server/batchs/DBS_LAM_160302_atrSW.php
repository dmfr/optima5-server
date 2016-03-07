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

$soc_code='MBD' ;

$map_mkey_atrSW = array() ;

$handle = fopen("php://stdin",'rb') ;
	$arr_header = fgetcsv($handle) ;
	while( !feof($handle) ) {
		$arr_csv = fgetcsv($handle) ;
		if( !$arr_csv ) {
			continue ;
		}
		
		$row = array_combine($arr_header,$arr_csv) ;
		
		if( !$row['atr_STKTYPE'] ) {
			$row['atr_STKTYPE'] = '-' ;
		}
		$mkey = array(
			$row['atr_DIV'],
			$row['atr_ES'],
			$row['atr_STKTYPE'],
			$row['prod_id'],
			$row['spec_batch']
		);
		$mkey = implode('%%%',$mkey) ;
		
		$map_mkey_atrSW[$mkey] = $row['atr_SW'] ;
	}
fclose($handle) ;

//print_r($map_mkey_atrSW) ;


$query = "select * from view_file_STOCK where field_PROD_ID LIKE 'MBD%' AND field_ATR_SW='TBD'" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
	$mkey = array(
		$arr['field_ATR_DIV'],
		$arr['field_ATR_ES'],
		$arr['field_ATR_STKTYPE'],
		$arr['field_PROD_ID'],
		$arr['field_SPEC_BATCH']
	);
	$mkey = implode('%%%',$mkey) ;
	
	
	if( !$map_mkey_atrSW[$mkey] ) {
		echo $mkey."\n" ;
	}
}


?>
