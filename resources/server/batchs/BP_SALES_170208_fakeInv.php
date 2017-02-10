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

$prods = array('BPJ05RVEG001','BPJ05GVEG001','BPJ05OVEG001','BPJ10CP001','BPJ10JPP001','BPJ10OMP001','BPJ10JOSP001','BPJ10JOP001','BPJ10P001');

$mags = array() ;
$query = "SELECT entry_key FROM view_bible_CUSTOMER_entry WHERE field_CLI_NAME LIKE 'CARREFOUR%'" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	if( !is_numeric($arr[0]) ) {
		continue ;
	}
	$mags[] = $arr[0] ;
}
print_r($mags) ;


$ids = array() ;
$query = "SELECT field_ID_INV FROM view_file_INV" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$ids[] = $arr[0] ;
}
for( $i=6 ; $i<=900 ; $i++ ) {
	$id_inv = 'INV/'.str_pad((float)$i, 6, "0", STR_PAD_LEFT) ;
	if( in_array($id_inv,$ids) ) {
		continue ;
	}
	
	echo $id_inv."\n" ;
	$idx = rand(0,count($mags)-1) ;
	echo $mags[$idx]."\n" ;
	echo "\n" ;
	
	
	$arr_ins = array() ;
	$arr_ins['field_ID_INV'] = $id_inv ;
	$arr_ins['field_ID_COEF'] = 1 ;
	$arr_ins['field_ID_CDE_REF'] = rand('90000000','99999999') ;
	$arr_ins['field_CLI_LINK'] = $mags[$idx] ;
	$arr_ins['field_DATE_CREATE'] = date('Y-m-d',strtotime('+ '.rand(150,300).' days',strtotime('2016-01-01'))) ;
	$arr_ins['field_DATE_INVOICE'] = $arr_ins['field_DATE_CREATE'] ;
	$arr_ins['field_STATUS'] = '70_INVCREATE' ;
	$filerecord_id = $_opDB->insert('view_file_INV',$arr_ins) ;
	$filerecord_id = $_opDB->insert_id() ;
	
	$c = 0 ;
	foreach( $prods as $prod ) {
		$c++ ;
		$arr_ins = array() ;
		$arr_ins['filerecord_parent_id'] = $filerecord_id ;
		$arr_ins['field_ID_INV_LIG_str'] = $c ;
		$arr_ins['field_MODE_INV_str'] = 'FREE' ;
		$arr_ins['field_BASE_PROD_str'] = $prod ;
		//$arr_ins['field_BASE_QTY'] = 0 ;
		$_opDB->insert('store_file_INV_LIG',$arr_ins) ;
	}
}


?>
