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

$handle = fopen("php://stdin","rb") ;
while( !feof($handle) ) {
	$arr_csv = fgetcsv($handle,4096,";") ;
	if( !$arr_csv ) {
		continue ;
	}
	
	$brand = $arr_csv[9] ;
	$brand_code = str_replace(array(' ',"'"),array('_',''),$brand) ;
	
	$store_name = $arr_csv[0] ;
	
	$prod_ean = $arr_csv[6] ;
	$prod_txt = $arr_csv[1] ;
	
	$qte_vol = $arr_csv[3] ;
	$qte_uvc = $arr_csv[4] ;
	$dv_totale = $arr_csv[5] ;
	
	if( !$store_name || !$prod_ean || $qte_vol==0 || $qte_uvc==0 ) {
		continue ;
	}
	
	
	$query = "SELECT treenode_key FROM store_bible__BRAND_tree WHERE field_BRANDGROUP_str='$brand_code'" ;
	if( $_opDB->query_uniqueValue($query) == NULL ) {
		$arr_ins = array() ;
		$arr_ins['treenode_key'] = $brand_code ;
		$arr_ins['field_BRANDGROUP_str'] = $brand_code ;
		$_opDB->insert('store_bible__BRAND_tree',$arr_ins) ;
		
		$arr_ins = array() ;
		$arr_ins['entry_key'] = $brand_code ;
		$arr_ins['treenode_key'] = $brand_code ;
		$arr_ins['field_BRAND_CODE_str'] = $brand_code ;
		$arr_ins['field_BRAND_TXT_str'] = $brand ;
		$_opDB->insert('store_bible__BRAND_entry',$arr_ins) ;
	}
	
	$query = "SELECT entry_key FROM store_bible_IRI_STORE_entry WHERE field_STORE_ENS_TXT_str='$store_name'" ;
	if( $_opDB->query_uniqueValue($query) == NULL ) {
		$arr_ins = array() ;
		$arr_ins['entry_key'] = md5($store_name) ;
		$arr_ins['field_STORE_ENS_str'] = md5($store_name) ;
		$arr_ins['field_STORE_ENS_TXT_str'] = $store_name ;
		$_opDB->insert('store_bible_IRI_STORE_entry',$arr_ins) ;
	}
	
	$query = "SELECT entry_key FROM store_bible_IRI_PROD_entry WHERE field_PROD_EAN_str='$prod_ean'" ;
	if( $_opDB->query_uniqueValue($query) == NULL ) {
		$arr_ins = array() ;
		$arr_ins['entry_key'] = $prod_ean ;
		$arr_ins['field_PROD_EAN_str'] = $prod_ean ;
		$arr_ins['field_PROD_BRAND_str'] = json_encode(array($brand_code)) ;
		$arr_ins['field_PROD_TXT_str'] = $prod_txt ;
		$arr_ins['field_PROD_VOLUME_dec'] = $qte_vol/$qte_uvc ;
		$_opDB->insert('store_bible_IRI_PROD_entry',$arr_ins) ;
	}
	
	
	$date = date('Y-m-d',strtotime($arr_csv[11])) ;
	$store_code = md5($store_name) ;
	
	
	$arr_ins = array() ;
	$arr_ins['field_V_DATE_dtm'] = $date ;
	$arr_ins['field_V_STORE_str'] = $store_code ;
	$arr_ins['field_V_PROD_str'] = $prod_ean ;
	$arr_ins['field_V_QTY_dec'] = $qte_uvc ;
	$arr_ins['field_V_DISTRI_dec'] = $dv_totale ;
	$arr_ins['field_BRAND_str'] = $brand_code ;
	
	$query = "SELECT filerecord_id FROM store_file_IRI_SALES 
			WHERE field_V_DATE_dtm='$date' AND field_V_STORE_str='$store_code' AND field_V_PROD_str='$prod_ean'" ;
	if( $filerecord_id = $_opDB->query_uniqueValue($query) ) {
		$arr_update = array() ;
		$arr_update['filerecord_id'] = $filerecord_id ;
		$_opDB->update('store_file_IRI_SALES',$arr_ins,$arr_update) ;
	}
	else {
		$arr_rec = array() ;
		$arr_rec['file_code'] = 'IRI_SALES' ;
		$_opDB->insert('store_file',$arr_rec) ;
		$filerecord_id = $_opDB->insert_id() ;
		$arr_ins['filerecord_id'] = $filerecord_id ;
		$_opDB->insert('store_file_IRI_SALES',$arr_ins) ;
	}
}
fclose($handle) ;

?>