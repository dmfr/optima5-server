<?php
session_start() ;

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

include("$server_root/modules/spec_wb_mrfoxy/backend_spec_wb_mrfoxy.inc.php");



$ttmp = specWbMrfoxy_promo_getGrid( array() ) ;
foreach( $ttmp['data'] as $data_row ) {
	
	// Comparable promos
	$grid_filter = array() ;
	if( $data_row['prod_code'] ) {
		$grid_filter[] = array('field'=>'prod_text', 'type'=>'list', 'value'=>specWbMrfoxy_tool_getProdNodes($data_row['prod_code'])) ;
	}
	if( $data_row['store_code'] ) {
		$grid_filter[] = array('field'=>'store_text', 'type'=>'list', 'value'=>specWbMrfoxy_tool_getStoreNodes($data_row['store_code'])) ;
	}
	$ttmp = specWbMrfoxy_promo_getGrid(array('filter_isProd'=>1, 'filter_isBenchmarkEligible'=>1, 'filter_country'=>$data_row['country_code'],'filter'=>json_encode($grid_filter))) ;
	$benchmark_arr_ids = array() ;
	foreach( $ttmp['data'] as $test_row ) {
		if( $test_row['_filerecord_id'] == $data_row['_filerecord_id'] ) {
			continue ;
		}
		$benchmark_arr_ids[] = $test_row['_filerecord_id'] ;
	}
	$arr_ins['field_BENCHMARK_ARR_IDS'] = json_encode($benchmark_arr_ids) ;
	
	$query = "UPDATE view_file_WORK_PROMO SET field_BENCHMARK_ARR_IDS='{$arr_ins['field_BENCHMARK_ARR_IDS']}' WHERE filerecord_id='{$data_row['_filerecord_id']}'" ;
	$_opDB->query($query) ;
}

?>