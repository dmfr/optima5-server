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

	$query = "SELECT * FROM view_file_STOCK" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		if( !(strpos($arr['field_PROD_ID'],$soc_code.'_') === 0) ) {
			continue ;
		}
		if( !$arr['field_ATR_STKTYPE'] ) {
			$arr['field_ATR_STKTYPE']='-' ;
		}
			
		$ttmp = explode('_',$arr['field_ADR_ID'],2) ;
		$whse_code = $ttmp[0] ;
		
		$mkey = array(
			$whse_code,
			$arr['field_ATR_DIV'],
			$arr['field_ATR_ES'],
			$arr['field_ATR_STKTYPE'],
			$arr['field_PROD_ID'],
			$arr['field_SPEC_BATCH'],
			$arr['field_SPEC_SN'],
			$arr['field_ATR_SU']
		) ;
		$mkey = implode('%%%',$mkey) ;
		if( $mapStock_mkey_id[$mkey] ) {
			echo "exists!!!\n" ;
			print_r($mkey) ;
			echo "\n\n\n" ;
			$mapStock_mkey_isLocked[$mkey] = TRUE ;
		} else {
			$mapStock_mkey_id[$mkey] = $arr['filerecord_id'] ;
			$mapStock_mkey_whseCode[$mkey] = $whse_code ;
		}
		if( $arr['field_QTY_OUT'] > 0 ) {
			$mapStock_mkey_isLocked[$mkey] = TRUE ;
		}
	}


?>
