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

include("$server_root/modules/paracrm/backend_paracrm.inc.php");

//ini_set( 'memory_limit', '4096M');

include("$server_root/include/GMaps.php" ) ;


$bible_code = 'STOCK' ;

$db_table_tree = 'view_bible_'.$bible_code.'_tree' ;
$db_table_entry = 'view_bible_'.$bible_code.'_entry' ;

$arr_treenodeKey_exists = array() ;
$query = "SELECT treenode_key FROM $db_table_tree" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$arr_treenodeKey_exists[$arr[0]] = TRUE ;
}

$arr_ATR = array() ;

$first = TRUE ;
$handle = fopen("php://stdin","rb") ;
while( !feof($handle) )
{
	$arr_csv = fgetcsv($handle) ;
	if( !$arr_csv ) {
		continue ;
	}
	if( $first ) {
		$first = FALSE ;
		continue ;
	}
	//print_r($arr_csv) ;
	//continue ;
	
	foreach( $arr_csv as $idx => $value ) {
		if( $value == '-' ) {
			$arr_csv[$idx] = '' ;
		}
	}
	
	$zone_id = $arr_csv[4] ;
	$pos_zone = $arr_csv[5] ;
	if( !$arr_treenodeKey_exists[$zone_id] ) {
		$arr_ins = array() ;
		$arr_ins['field_ROW_ID'] = $zone_id ;
		$arr_ins['field_POS_ZONE'] = $pos_zone ;
		$arr_ins['field_POS_ROW'] = '' ;
		paracrm_lib_data_insertRecord_bibleTreenode($bible_code,$zone_id,'',$arr_ins) ;
		$arr_treenodeKey_exists[$zone_id] = TRUE ;
	}
	
	$row_id = $arr_csv[6] ;
	$pos_row = $arr_csv[6] ;
	if( !$arr_treenodeKey_exists[$row_id] ) {
		$arr_ins = array() ;
		$arr_ins['field_ROW_ID'] = $row_id ;
		$arr_ins['field_POS_ZONE'] = $pos_zone ;
		$arr_ins['field_POS_ROW'] = $pos_row ;
		paracrm_lib_data_insertRecord_bibleTreenode($bible_code,$row_id,$zone_id,$arr_ins) ;
		$arr_treenodeKey_exists[$row_id] = TRUE ;
	}
	
	
	
	$adr_id = $arr_csv[0] ;
	$arr_ins = array() ;
	$arr_ins['field_ADR_ID'] = $adr_id ;
	$arr_ins['field_POS_BAY'] = $arr_csv[8] ;
	$arr_ins['field_POS_LEVEL'] = $arr_csv[10] ;
	$arr_ins['field_POS_BIN'] = $arr_csv[11] ;
	
	$arr_ins['field_ATR_TYPE'] = json_encode(array($arr_csv[1])) ;
	$arr_ins['field_ATR_CLASSE'] = json_encode(array($arr_csv[2])) ;
	$arr_ins['field_ATR_BU'] = json_encode(array($arr_csv[3])) ;
	
	paracrm_lib_data_insertRecord_bibleEntry($bible_code,$adr_id,$row_id,$arr_ins) ;
	
	
	
	$query = "INSERT IGNORE INTO {$db_table_entry}
					(entry_key,treenode_key,field_ADR_ID,field_POS_BAY,field_POS_LEVEL,field_POS_BIN)
					VALUES ('$adr_id','$row_id','{$arr_ins['field_ADR_ID']}','{$arr_ins['field_POS_BAY']}','{$arr_ins['field_POS_LEVEL']}','{$arr_ins['field_POS_BIN']}')" ;
	//$_opDB->query($query) ;
	//$cnt++ ;
	
	
	
	
	
	
	$arr_ATR['ATR_TYPE'][$arr_csv[1]] = $arr_csv[1] ;
	$arr_ATR['ATR_CLASSE'][$arr_csv[2]] = $arr_csv[2] ;
	$arr_ATR['ATR_BU'][$arr_csv[3]] = $arr_csv[3] ;
}

foreach( $arr_ATR as $bible_code => $arr1 ) {
	$mkey = substr($bible_code,4).'_CODE';
	
	foreach( $arr1 as $mvalue => $dummy ) {
		if( !$mvalue ) {
			continue ;
		}
		$arr_ins = array() ;
		$arr_ins['field_'.$mkey] = $mvalue ;
		paracrm_lib_data_insertRecord_bibleTreenode($bible_code,$mvalue,'',$arr_ins) ;
	}
}


?>