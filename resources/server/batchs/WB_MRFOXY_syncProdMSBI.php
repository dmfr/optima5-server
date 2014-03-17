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
	$prod_ean = $arr['field_PROD_SKU_EAN'] ;
	if( $prod_ean=='' || substr($arr['field_PROD_REF'],0,1) != 'W' ) {
		continue ;
	}
	if( !isset($arr_prodEan_arrProdKey[$prod_ean]) ) {
		$arr_prodEan_arrProdKey[$prod_ean] = array() ;
	}
	$arr_prodEan_arrProdKey[$prod_ean][] = $arr['field_PROD_REF'] ;
	
	$arr_prodKey_arrDb[$arr['field_PROD_REF']] = $arr ;
}

foreach( $arr_prodEan_arrProdKey as $prod_ean => $arrProdKey ) {
	if( count($arrProdKey) != 1 ) {
		continue ;
	}
	$prod_key = reset($arrProdKey) ;
	
	$arr_update = array() ;
	$arr_update['field_PROD_BRANDCODE_str'] = $prod_key ;
	$arr_update['field_PROD_TXT_str'] = $arr_prodKey_arrDb[$prod_key]['field_PROD_TXT'] ;
	$arr_update['field_PROD_UOM_str'] = $arr_prodKey_arrDb[$prod_key]['field_UOM'] ;
	
	$arr_cond = array() ;
	$arr_cond['entry_key'] = $prod_ean ;
	
	$_opDB->update('store_bible_IRI_PROD_entry',$arr_update,$arr_cond) ;
}


?>