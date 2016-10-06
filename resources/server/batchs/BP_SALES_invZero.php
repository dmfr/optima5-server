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



$_arr_peerCodes = array() ;
$query = "SELECT distinct entry_key FROM view_bible_CFG_PEER_entry WHERE treenode_key='INV'" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$_arr_peerCodes[] = $arr[0] ;
}

$arr_invFilerecordIds = array() ;
$query = "SELECT i.filerecord_id FROM view_file_INV i
	LEFT OUTER JOIN view_file_INV_PEER ip ON ip.filerecord_parent_id=i.filerecord_id
	WHERE i.field_STATUS_IS_FINAL='1'
	AND (ip.filerecord_id IS NULL)
	AND ABS(i.field_CALC_AMOUNT_FINAL) = '0'" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$filerecord_id = $arr[0] ;
	$arr_invFilerecordIds[] = $filerecord_id ;
}

foreach( $arr_invFilerecordIds as $inv_filerecord_id ) {
	foreach( $_arr_peerCodes as $peerCode ) {
		if( TRUE ) {
			$arr_ins = array() ;
			$arr_ins['field_PEER_CODE'] = $peerCode ;
			$arr_ins['field_SEND_IS_OK'] = 1 ;
			$arr_ins['field_SEND_REF'] = 'ZERO' ;
			$arr_ins['field_SEND_DATE'] = date('Y-m-d H:i:s') ;
			paracrm_lib_data_insertRecord_file( 'INV_PEER' , $inv_filerecord_id , $arr_ins ) ;
		}
	}
}





$query = "select ipp.inv_filerecord_id, count(*) as nb_peers 
	from (
		select i.filerecord_id as inv_filerecord_id, ip.field_PEER_CODE
		from view_file_INV i
		JOIN view_file_INV_PEER ip 
			ON ip.filerecord_parent_id=i.filerecord_id 
			AND ip.field_PEER_CODE IN ".$_opDB->makeSQLlist($_arr_peerCodes)."
			AND ip.field_SEND_IS_OK='1'
		WHERE i.field_STATUS<>'99_CLOSED'
	) ipp
	GROUP BY inv_filerecord_id
	HAVING nb_peers='3'" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$inv_filerecord_id = $arr[0] ;
	
	specBpSales_inv_lib_close($inv_filerecord_id) ;
}




exit ;
?>
