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



$arr_transferCdePackFilerecordIds = array() ;
$query = "SELECT filerecord_id FROM view_file_TRANSFER_CDE_PACK WHERE field_STATUS_IS_SHIPPED='1' AND field_STATUS_IS_EDI<>'1'" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$arr_transferCdePackFilerecordIds[] = $arr[0] ;
}


$json = specDbsLam_transfer_getTransferCdePack( array(
	'filter_transferCdePackFilerecordId_arr'=>json_encode($arr_transferCdePackFilerecordIds),
	'load_extended' => 1
) ) ;
$rowsExtended_transferCdePack = $json['data'] ;

$buffer.= '' ;
foreach( $rowsExtended_transferCdePack as $rowExtended_transferCdePack ) {
	if( !$rowExtended_transferCdePack['id_trspt_code'] || ($rowExtended_transferCdePack['id_trspt_code']!='DPDG') ) {
		continue ;
	}
	$buffer.= specDbsLam_lib_TMS_DPDG_getEdiPosition(
		$rowExtended_transferCdePack,
		$rowExtended_transferCdePack['id_trspt_id']
	) ;
}

echo $buffer ;
exit ;

?>
