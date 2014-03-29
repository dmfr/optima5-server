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

$handle = tmpfile() ;


$csvMap_key_idx = array() ;
$csv_rows = array() ;

$obj_xmlRows = $obj_xml->LIST_G_ONE->G_ONE ;
for( $i=0 ; $i<$obj_xmlRows->count() ; $i++ ) {
	$obj_xmlRow = $obj_xmlRows[$i] ;
	// var_dump($obj_xmlEntry) ;
	$item_number = (string)$obj_xmlRow->ITEM_NUMBER ;
	if( !isset($arr_prodKey_prodArr[$item_number]) ) {
		//echo $item_number."\n"  ;
		continue ;
	} else {
		$prodArr = $arr_prodKey_prodArr[$item_number] ;
	}
	
	foreach( $obj_xmlRow as $mkey => $mvalue ) {
		if( !isset($csvMap_key_idx[$mkey]) ) {
			$csvMap_key_idx[$mkey] = count($csvMap_key_idx) ;
		}
	}
	foreach( array('PROD_EAN','PROD_BRAND','PROD_TXT','PROD_VOLUME') as $mkey ) {
		if( !isset($csvMap_key_idx[$mkey]) ) {
			$csvMap_key_idx[$mkey] = count($csvMap_key_idx) ;
		}
	}
	foreach( array('RECORD_ID','BRAND') as $mkey ) {
		if( !isset($csvMap_key_idx[$mkey]) ) {
			$csvMap_key_idx[$mkey] = count($csvMap_key_idx) ;
		}
	}
	
	
	$csv_row = array() ;
	foreach( $csvMap_key_idx as $mkey => $idx ) {
		
		switch( $mkey ) {
			case 'PROD_EAN' :
				$value = $prodArr['field_PROD_SKU_EAN'] ;
				break ;
			case 'PROD_BRAND' :
				$value = 'WONDERFUL' ;
				break ;
			case 'PROD_TXT' :
				$value = $prodArr['field_PROD_TXT'] ;
				break ;
			case 'PROD_VOLUME' :
				$value = $prodArr['field_EQ_KG'] ;
				break ;
			
			case 'BRAND' :
				$value = 'WONDERFUL' ;
				break ;
				
			case 'RECORD_ID' :
				$value = (string)$obj_xmlRow->TRX_NUMBER.'-'.(string)$obj_xmlRow->LINE_NUMBER ;
				break ;
				
			default :
				$value = $obj_xmlRow->$mkey ;
				break ;
		}
		
		$csv_row[] = $value ;
	}
	
	
	
	$csv_rows[] = $csv_row ;
}

$handle = tmpfile() ;


fputcsv( $handle, array_keys($csvMap_key_idx) ) ;
foreach( $csv_rows as $csv_row ) {
	fputcsv( $handle, $csv_row ) ;
}

fseek($handle,0) ;
fpassthru($handle) ;




?>