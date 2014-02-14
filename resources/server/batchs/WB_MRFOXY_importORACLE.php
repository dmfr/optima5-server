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

$obj_xml = simplexml_load_file("php://stdin") ;

$arr_prodKey_prodArr = array() ;
$query = "SELECT * FROM op5_wonderful_prod_msbi.view_bible__PROD_LOG_entry" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
	$entry_key = $arr['entry_key'] ;
	$arr_prodKey_prodArr[$entry_key] = $arr ;
}

//print_r($arr_prodKey_prodArr) ;


$obj_xmlEntries = $obj_xml->LIST_G_ONE->G_ONE ;
for( $i=0 ; $i<$obj_xmlEntries->count() ; $i++ ) {
	$obj_xmlEntry = $obj_xmlEntries[$i] ;
	// var_dump($obj_xmlEntry) ;
	
	$key = (string)($obj_xmlEntry->TRX_NUMBER.'-'.$obj_xmlEntry->LINE_NUMBER) ;
	$date = date('Y-m-d',strtotime($obj_xmlEntry->DOC_DATE)) ;
	$store_code = (string)$obj_xmlEntry->CUST_NUMBER ;
	$store_text = (string)$obj_xmlEntry->CUST_NAME ;
	$item_number = (string)$obj_xmlEntry->ITEM_NUMBER ;
	if( substr($item_number,8,2) == 'PL' ) {
		$item_number = substr($item_number,0,10).'FR' ;
	}
	if( !isset($arr_prodKey_prodArr[$item_number]) ) {
		//echo $item_number."\n"  ;
		continue ;
	} else {
		$prod_ean = $arr_prodKey_prodArr[$item_number]['field_PROD_SKU_EAN'] ;
		$prodArr = $arr_prodKey_prodArr[$item_number] ;
	}
	
	$qty_unit = (int)$obj_xmlEntry->QTY_INV ;
	$price_unit = (float)$obj_xmlEntry->STD_PRICE ;
	$price_currency = (string)$obj_xmlEntry->CURR ;
	
	
	
	
	$query = "SELECT entry_key FROM store_bible_IRI_STORE_entry WHERE field_STORE_ENS_str='$store_code'" ;
	if( $_opDB->query_uniqueValue($query) == NULL ) {
		$arr_ins = array() ;
		$arr_ins['entry_key'] = $store_code ;
		$arr_ins['field_STORE_ENS_str'] = $store_code ;
		$arr_ins['field_STORE_ENS_TXT_str'] = $store_text ;
		$_opDB->insert('store_bible_IRI_STORE_entry',$arr_ins) ;
	}
	
	$query = "SELECT entry_key FROM store_bible_IRI_PROD_entry WHERE field_PROD_EAN_str='$prod_ean'" ;
	if( $_opDB->query_uniqueValue($query) == NULL ) {
		$arr_ins = array() ;
		$arr_ins['entry_key'] = $prod_ean ;
		$arr_ins['field_PROD_EAN_str'] = $prod_ean ;
		$arr_ins['field_PROD_BRAND_str'] = json_encode(array('WONDERFUL')) ;
		$arr_ins['field_PROD_TXT_str'] = $prodArr['field_PROD_TXT'] ;
		$arr_ins['field_PROD_VOLUME_dec'] = $prodArr['field_EQ_KG'] ;
		$_opDB->insert('store_bible_IRI_PROD_entry',$arr_ins) ;
	}
	
	
	$arr_ins = array() ;
	$arr_ins['field_KEY_str'] = $key ;
	$arr_ins['field_DATE_dtm'] = $date ;
	$arr_ins['field_STORE_str'] = $store_code ;
	$arr_ins['field_PROD_str'] = $prod_ean ;
	$arr_ins['field_QTY_dec'] = $qty_unit ;
	$arr_ins['field_PRICE_UNIT_dec'] = $price_unit ;
	$arr_ins['field_PRICE_CURR_str'] = $price_currency ;
	$arr_ins['field_BRAND_str'] = 'WONDERFUL' ;
	
	$query = "SELECT filerecord_id FROM store_file_ORACLE_SHIP 
			WHERE field_KEY_str='$key'" ;
	if( $filerecord_id = $_opDB->query_uniqueValue($query) ) {
		$arr_update = array() ;
		$arr_update['filerecord_id'] = $filerecord_id ;
		$_opDB->update('store_file_ORACLE_SHIP',$arr_ins,$arr_update) ;
	}
	else {
		$arr_rec = array() ;
		$arr_rec['file_code'] = 'ORACLE_SHIP' ;
		$_opDB->insert('store_file',$arr_rec) ;
		$filerecord_id = $_opDB->insert_id() ;
		$arr_ins['filerecord_id'] = $filerecord_id ;
		$_opDB->insert('store_file_ORACLE_SHIP',$arr_ins) ;
	}
}

// print_r($obj_xml->getAttributes());




?>