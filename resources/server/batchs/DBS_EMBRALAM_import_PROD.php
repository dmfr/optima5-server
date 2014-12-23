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


$bible_code = 'PROD' ;

$db_table_tree = 'store_bible_'.$bible_code.'_tree' ;
$db_table_entry = 'store_bible_'.$bible_code.'_entry' ;


$arr_types = array() ;
$query = "SELECT treenode_key FROM view_bible_ATR_TYPE_tree" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$arr_types[] = $arr[0] ;
}

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
	
	foreach( $arr_csv as $idx => $value ) {
		if( $value == '-' ) {
			$arr_csv[$idx] = '' ;
		}
	}
	
	$prod_id = $arr_csv[1] ;
	
	$arr_ins = array() ;
	$arr_ins['field_PROD_ID'] = $prod_id ;
	$arr_ins['field_PROD_TXT'] = 'Embraer Desc' ;
	$arr_ins['field_ATR_TYPE'] = ( in_array($arr_csv[13],$arr_types) ? json_encode(array($arr_csv[13])) : '' ) ;
	$arr_ins['field_ATR_CLASSE'] = json_encode(array($arr_csv[7])) ;
	$arr_ins['field_ATR_BU'] = json_encode(array($arr_csv[5])) ;
	paracrm_lib_data_insertRecord_bibleEntry($bible_code,$prod_id,'PROD',$arr_ins) ;
	
	continue ;
}


?>