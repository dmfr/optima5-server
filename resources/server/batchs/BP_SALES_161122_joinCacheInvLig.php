<?php
session_start() ;
ini_set( 'memory_limit', '1024M');

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


include("$server_root/modules/spec_bp_sales/backend_spec_bp_sales.inc.php");

$forward_post = array() ;
$forward_post['start'] ;
$forward_post['limit'] ;
$forward_post['file_code'] = 'INV_LIG' ;
	$sorter = array() ;
	$sorter['property'] = 'INV_LIG_id' ;
	$sorter['direction'] = 'DESC' ;
$forward_post['sort'] = json_encode(array($sorter)) ;
$json = paracrm_data_getFileGrid_data( $forward_post, $auth_bypass=TRUE ) ;
foreach( $json['data'] as $paracrm_row ) {
	echo "." ;
		
		$row = array() ;
		$row['field_JC_PRICE'] = $paracrm_row['INV_LIG_field_JOIN_PRICE'] ;
		$row['field_JC_COEF1'] = $paracrm_row['INV_LIG_field_JOIN_COEF1'] ;
		$row['field_JC_COEF2'] = $paracrm_row['INV_LIG_field_JOIN_COEF2'] ;
		$row['field_JC_COEF3'] = $paracrm_row['INV_LIG_field_JOIN_COEF3'] ;
		$row['field_JC_VAT'] = $paracrm_row['INV_LIG_field_JOIN_VAT'] ;
		if( $row['INV_LIG_field_MOD_IS_ON'] ) {
			$row['field_LOG_PRICE'] = $paracrm_row['INV_LIG_field_MOD_PRICE'] ;
			$row['field_LOG_COEF1'] = $paracrm_row['INV_LIG_field_MOD_COEF1'] ;
			$row['field_LOG_COEF2'] = $paracrm_row['INV_LIG_field_MOD_COEF2'] ;
			$row['field_LOG_COEF3'] = $paracrm_row['INV_LIG_field_MOD_COEF3'] ;
			$row['field_LOG_VAT'] = $paracrm_row['INV_LIG_field_MOD_VAT'] ;
		} else {
			$row['field_LOG_PRICE'] = $paracrm_row['INV_LIG_field_JOIN_PRICE'] ;
			$row['field_LOG_COEF1'] = $paracrm_row['INV_LIG_field_JOIN_COEF1'] ;
			$row['field_LOG_COEF2'] = $paracrm_row['INV_LIG_field_JOIN_COEF2'] ;
			$row['field_LOG_COEF3'] = $paracrm_row['INV_LIG_field_JOIN_COEF3'] ;
			$row['field_LOG_VAT'] = $paracrm_row['INV_LIG_field_JOIN_VAT'] ;
		}
			
	$_opDB->update('view_file_INV_LIG',$row,array('filerecord_id'=>$paracrm_row['INV_LIG_id'])) ;
}
		
		
		



?>
