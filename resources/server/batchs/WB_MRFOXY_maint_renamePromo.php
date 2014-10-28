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

include("$server_root/modules/spec_wb_mrfoxy/backend_spec_wb_mrfoxy.inc.php");



$ttmp = specWbMrfoxy_promo_getGrid( array() ) ;
foreach( $ttmp['data'] as $data_row ) {
	//print_r($ttmp) ;
	// *** Création code PROMO ID ****
	$store_memo = '' ;
	$store_code = $data_row['store_code'] ;
	while(TRUE) {
		$query = "SELECT field_STOREGROUP_MEMO, treenode_parent_key FROM view_bible_IRI_STORE_tree WHERE treenode_key='$store_code'" ;
		$row = $_opDB->fetch_row($_opDB->query($query)) ;
		if( $row[0] != '' ) {
			$store_memo = $row[0] ;
			break ;
		}
		if( $row[1] != '' ) {
			$store_code = $row[1] ;
			continue ;
		}
		break ;
	}
	
	$prod_memo = '' ;
	$prod_code = $data_row['prod_code'] ;
	while(TRUE) {
		$query = "SELECT field_PRODGROUPMEMO, treenode_parent_key FROM view_bible_IRI_PROD_tree WHERE treenode_key='$prod_code'" ;
		$row = $_opDB->fetch_row($_opDB->query($query)) ;
		if( $row[0] != '' ) {
			$prod_memo = $row[0] ;
			break ;
		}
		if( $row[1] != '' ) {
			$prod_code = $row[1] ;
			continue ;
		}
		break ;
	}
	
	if( strtotime($data_row['date_supply_start']) > 0 ) {
		$date = $data_row['date_supply_start'] ;
	} else {
		$date = $data_row['date_start'] ;
	}
	
	
	$promo_id_base = '' ;
		$promo_id_base.= $data_row['country_code'] ;
		$promo_id_base.= ' ' ;
		$promo_id_base.= ($store_memo ? $store_memo : 'XXXX') ;
		$promo_id_base.= ' ' ;
		$promo_id_base.= ($prod_memo  ? $prod_memo  : 'XXXX') ;
		$promo_id_base.= ' ' ;
		$promo_id_base.= date('Y-m-W',strtotime($date)) ;
		$promo_id = $promo_id_base ;
	
	$query = "UPDATE view_file_WORK_PROMO SET field_PROMO_CODE='$promo_id' WHERE filerecord_id='{$data_row['_filerecord_id']}'" ;
	$_opDB->query($query) ;
}

?>