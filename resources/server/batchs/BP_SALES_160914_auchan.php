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

include("$server_root/modules/paracrm/backend_paracrm.inc.php");

$TAB = array() ;

$handle = fopen('php://stdin','rb') ;
$handle_out = fopen('php://stdout','wb') ;
while( !feof($handle) ) {
	$arr_csv = fgetcsv($handle) ;
	//print_r($arr_csv) ;
	
	if( trim($arr_csv[0]) ) {
		if( $put_csv ) {
			fputcsv($handle_out,$put_csv) ;
		}
	
	
		$ttmp = explode(' ',trim($arr_csv[0]),2) ;
		$code = $ttmp[0] ;
		$ville = $ttmp[1] ;
		
		$query = "SELECT entry_key FROM view_bible_CUSTOMER_entry WHERE LENGTH(entry_key)='13' AND field_CLI_NAME LIKE 'AUCHAN%{$ville}%'" ;
		$entry_key = $_opDB->query_uniqueValue($query) ;
		if( $entry_key ) {
			// echo $entry_key.' : '.$arr_csv[0]."\n" ;
		} else {
			//echo "????? ".$arr_csv[0]."\n" ;
		}
		
		$put_csv = array() ;
		$put_csv[0] = ( $entry_key ? $entry_key : '????' ) ;
		$put_csv[1] = trim($arr_csv[0]) ;
		$put_csv[2] = '' ;
		$put_csv[3] = '' ;
	}
	
	if( !$put_csv ) {
		continue ;
	}
	
	if( trim($arr_csv[1]) ) {
		$put_csv[2].= $arr_csv[1]."\r\n" ;
	}
	if( trim($arr_csv[2]) ) {
		$put_csv[3].= $arr_csv[2]."\r\n" ;
	}
}
if( $put_csv ) {
	fputcsv($handle_out,$put_csv) ;
}

fclose($handle) ;
fclose($handle_out) ;



?>
