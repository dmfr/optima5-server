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

//include("$server_root/modules/paracrm/backend_paracrm.inc.php");
include("$server_root/modules/spec_bp_sales/backend_spec_bp_sales.inc.php");

$zip = new ZipArchive;
$zip->open('/tmp/BP_SALES_invDumpAll.zip',ZipArchive::CREATE) ;

$query = "SELECT filerecord_id, field_ID_INV FROM view_file_INV ORDER BY filerecord_id" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
	$inv_filerecord_id = $arr['filerecord_id'] ;
	$field_ID_INV = $arr['field_ID_INV'] ;
	$field_ID_INV = preg_replace("/[^a-zA-Z0-9\s]/", "", $field_ID_INV) ;
	echo $field_ID_INV."\n" ;
	
	
	$json = specBpSales_inv_printDoc( array('inv_filerecord_id'=>$inv_filerecord_id) ) ;
	if( !$json['success'] ) {
		return NULL ;
	}
	$inv_html = $json['html'] ;
	$inv_pdf = specBpSales_util_htmlToPdf_buffer( $inv_html ) ;
	
	$zip->addFromString( $field_ID_INV.'.pdf' , $inv_pdf ) ;
}
$zip->close() ;


?>
