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

$db_test='op5_dbs_prod_lam_mbd' ;

return ;

$count = '400000125000' ;

$query = "SELECT * FROM {$db_test}.view_file_MVT m, {$db_test}.view_file_MVT_STEP ms 
		WHERE m.filerecord_id = ms.filerecord_parent_id AND ms.field_STEP_CODE='T06_PUTAWAY' AND ms.field_STATUS_IS_OK='1'
		AND m.filerecord_id IN (select field_FILE_MVT_ID FROM {$db_test}.view_file_TRANSFER_LIG WHERE filerecord_parent_id='14457')" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
	//
	if( $arr['field_ATR_SU'] == '@MBDSU' ) {
		$count++ ;
		$arr['field_ATR_SU'] = $count ;
	}
	
	//print_r($arr) ;
	
	$arr_ins = array() ;
	$arr_ins['field_ADR_ID'] = $arr['field_DEST_ADR_ID'] ;
	$arr_ins['field_PROD_ID'] = $arr['field_PROD_ID'] ;
	$arr_ins['field_QTY_AVAIL'] = $arr['field_QTY_MVT'] ;
	$arr_ins['field_SPEC_BATCH'] = $arr['field_SPEC_BATCH'] ;
	$arr_ins['field_SPEC_DATELC'] = $arr['field_SPEC_DATELC'] ;
	$arr_ins['field_SPEC_SN'] = $arr['field_SPEC_SN'] ;
	foreach( array('field_ATR_DIV','field_ATR_ES','field_ATR_STKTYPE','field_ATR_NEASA','field_ATR_STOTYPE','field_ATR_SU','field_ATR_SW') as $mkey ) {
		$arr_ins[$mkey] = $arr[$mkey] ;
	}
	paracrm_lib_data_insertRecord_file('STOCK',0,$arr_ins) ;
}

?>
