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

$arr_stkIds = array() ;

$handle = fopen("php://stdin",'rb') ;

while( !feof($handle) ) {
	$arr_csv = fgetcsv($handle,0) ;
	if( !$arr_csv || !$arr_csv[3] ) {
		continue ;
	}
	//print_r($arr_csv) ;
	
	$query = "SELECT * FROM view_file_STOCK WHERE 1
				AND field_ATR_DIV='{$arr_csv[0]}'
				AND field_ATR_ES='{$arr_csv[1]}'
				AND field_ADR_ID='DAH_{$arr_csv[2]}'
				AND field_PROD_ID='MBD_{$arr_csv[3]}'
				AND field_SPEC_BATCH='{$arr_csv[6]}'
				AND field_SPEC_SN='{$arr_csv[7]}'
				AND field_ATR_STKTYPE='{$arr_csv[9]}'
				" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) == 1 ) {
		//echo "OK\n" ;
		$arr = $_opDB->fetch_assoc($result) ;
		if( $arr['field_QTY_OUT'] > 0 ) {
			continue ;
		}
		$arr_stkIds[] = $arr['filerecord_id'] ;
	} else {
		//echo $query ;
		print_r($arr_csv) ;
	}
}

fclose($handle) ;



specDbsLam_transfer_addStock( array(
		'transfer_filerecordId'=>528685,
		'stock_filerecordIds'=>json_encode($arr_stkIds)
	) ) ;




?>
