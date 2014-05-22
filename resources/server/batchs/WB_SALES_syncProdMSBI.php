<?php
ini_set( 'memory_limit', '256M');

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

$arr_prodEan_prodKey = array() ;
$arr_prodKey_arrDb = array() ;
$query = "SELECT * FROM op5_wonderful_prod_msbi.view_bible__PROD_LOG_entry" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
	
	if( $arr_prod['field_EQ_UT'] > 1 ) {
		$arr['field_UOM'] = 'BIN' ;
	} else {
		$arr['field_UOM'] = 'BAG' ;
	}
	
	$arr_prodRef_arrDb[$arr['field_PROD_REF']] = $arr ;
}

foreach( $arr_prodRef_arrDb as $prod_ref => $arr_prod ) {
	$arr_update = array() ;
	$arr_update['field_PROD_TXT_str'] = $arr_prod['field_PROD_TXT'] ;
	$arr_update['field_PROD_SKU_EAN_str'] = $arr_prod['field_PROD_SKU_EAN'] ;
	$arr_update['field_UOM_str'] = $arr_prod['field_UOM'] ;
	$arr_update['field_UC_QTY_dec'] = $arr_prod['field_QTE_SKU'] ;
	$arr_update['field_EQ_UT_dec'] = $arr_prod['field_EQ_UT'] ;
	$arr_update['field_EQ_KG_dec'] = $arr_prod['field_EQ_KG'] ;
	
	$arr_cond = array() ;
	$arr_cond['entry_key'] = $prod_ref ;
	
	$_opDB->update('store_bible_PRODUCT_entry',$arr_update,$arr_cond) ;
}


?>