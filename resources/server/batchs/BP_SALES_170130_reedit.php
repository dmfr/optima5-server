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



$query = "SELECT filerecord_id FROM view_file_INV inv
		JOIN view_bible_CUSTOMER_entry c ON c.entry_key=inv.field_CLI_LINK
		ORDER BY filerecord_id" ;
$result = $_opDB->query($query) ;
$arr_invFilerecordIds = array() ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$arr_invFilerecordIds[] = $arr[0] ;
}

$arr_ids = array() ;
$handle = fopen('php://stdin','rb') ;
while( !feof($handle) ) {
	$lig = fgets($handle) ;
	if( !trim($lig) ) {
		continue ;
	}
	$arr_ids[] = trim($lig) ;
}


$htmls = array() ;
foreach( $arr_invFilerecordIds as $inv_filerecord_id ) {
	$query = "SELECT field_ID_INV FROM view_file_INV WHERE filerecord_id='{$inv_filerecord_id}'" ;
	$id_inv = $_opDB->query_uniqueValue($query) ;
	$id_inv = str_replace('/','',$id_inv) ;
	if( !in_array($id_inv,$arr_ids) ) {
		continue ;
	}
	
	$json = specBpSales_inv_printDoc( array('inv_filerecord_id'=>$inv_filerecord_id) ) ;
	if( !$json['success'] ) {
		return NULL ;
	}
	$inv_html = $json['html'] ;
	$htmls[] = $inv_html ;
	
	//remise à zéro MAILEVA
	$query = "UPDATE view_file_INV_PEER SET field_SEND_IS_OK='0' WHERE filerecord_parent_id='{$inv_filerecord_id}' AND field_PEER_CODE='INV_MAILEVA'" ;
	$_opDB->query($query) ;
}
	
$pdf = specBpSales_util_htmlToPdf_buffer( $htmls ) ;

file_put_contents('/tmp/reedit_70130.pdf',$pdf) ;


?>
