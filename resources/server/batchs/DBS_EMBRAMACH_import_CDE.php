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


$file_code = 'CDE' ;
$file_code_step = 'CDE_STEP' ;

$map_steps = array(
	'01_CREATE' => array(41,42),
	'02_GROUP' => array(43,44),
	'03_PICK_START' => array(47,48),
	'04_ASM_END' => array(49,50),
	'05_INSPECT_START' => array(51,52),
	'06_INSPECT_END' => array(53,54),
	'07_PACK_START' => array(55,56),
	'08_PACK_END' => array(57,58),
	'09_INVOICE' => array(59,60),
	'10_AWB' => array(61,62)
);


$first = TRUE ;
$handle = fopen("php://stdin","rb") ;
while( !feof($handle) )
{
	$arr_csv = fgetcsv($handle,0,';') ;
	if( !$arr_csv ) {
		continue ;
	}
	if( $first ) {
		$first = FALSE ;
		continue ;
	}
	
	if( !$arr_csv[0] ) {
		continue ;
	}
	//print_r($arr_csv) ;
	
	$main_row = $steps_arrRow = array() ;
	$main_row['field_DELIVERY_ID'] = $arr_csv[0] ;
	$main_row['field_PRIORITY'] = $arr_csv[1] ;
	$main_row['field_TYPE'] = $arr_csv[6] ;
	$main_row['field_FLOW'] = $arr_csv[40] ;
	$main_row['field_SHIPTO_CODE'] = $arr_csv[9] ;
	$main_row['field_SHIPTO_NAME'] = $arr_csv[10] ;
	$main_row['field_LINE_COUNT'] = $arr_csv[11] ;
	foreach( $map_steps as $step_code => $idxs ) {
		$date_txt = substr($arr_csv[$idxs[0]],6,4).'-'.substr($arr_csv[$idxs[0]],3,2).'-'.substr($arr_csv[$idxs[0]],0,2).' '.$arr_csv[$idxs[1]] ;
		$timestamp = strtotime($date_txt) ;
		if( $timestamp <= 0 ) {
			continue ;
		}
		$main_row['field_STEP_CURRENT'] = $step_code ;
		
		$steps_arrRow[] = array(
			'field_STEP' => $step_code,
			'field_DATE' => date('Y-m-d H:i:s',$timestamp)
		);
	}
	
	$filerecord_id = paracrm_lib_data_insertRecord_file($file_code,0,$main_row) ;
	
	$arr_existing_ids = array() ;
	foreach( paracrm_lib_data_getFileChildRecords($file_code_step,$filerecord_id) as $subrow ) {
		$arr_existing_ids[] = $subrow['filerecord_id'] ;
	}
	$arr_new_ids = array() ;
	foreach( $steps_arrRow as $subrow ) {
		$arr_new_ids[] = paracrm_lib_data_insertRecord_file($file_code_step,$filerecord_id,$subrow) ;
	}
	$to_delete = array_diff( $arr_existing_ids, $arr_new_ids );
	foreach( $to_delete as $filerecord_id ) {
		paracrm_lib_data_deleteRecord_file($file_code_step,$filerecord_id) ;
	}
	
	
	
	continue ;
}


?>