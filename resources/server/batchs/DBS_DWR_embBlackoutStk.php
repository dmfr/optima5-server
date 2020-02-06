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



/*

http://eparts-api.herokuapp.com/login/eparts-blackout
MMOUADDI      
1988*Boeing

*/




$_tableCode = 'EMB_BLACKOUT_STK' ;

$query = "SELECT * FROM view_table_EMB_BLACKOUT_CFG WHERE TABLE_CODE='{$_tableCode}'" ;
$result = $_opDB->query($query) ;
$arr = $_opDB->fetch_assoc($result) ;
if( !$arr ) {
	die("No config\n") ;
}
$_token = $arr['AUTH_TOKEN'] ;

if( (strtotime($arr['DATE_LAST']) > strtotime('-1 hour')) && !$arr['DATE_FORCE'] ) {
	
	$post_url = 'https://parts-request.herokuapp.com/sap-stock/search-stock' ;
	$params = array('http' => array(
	'method' => 'POST',
	'content' => '{"pageSize":"100","currentPage":1,"filter":{"distributionChannel":"","salesOrganization":{"value":"LBG1,ALL","alias":"All"}}}',
	'timeout' => 600,
	'ignore_errors' => true,
	'header'=>"Authorization: {$_token}\r\n"."accept: application/json\r\n"."Content-Type: application/json\r\n"
	));
	$ctx = stream_context_create($params);
	$fp = fopen($post_url, 'rb', false, $ctx);
	
	die("No update needed\n") ;
}




$post_url = 'https://parts-request.herokuapp.com/sap-stock/search-stock/report' ;
$params = array('http' => array(
'method' => 'POST',
'content' => http_build_query(array(
	'token' => $_token,
	'params' => '{"distributionChannel":"","salesOrganization":{"value":"LBG1,ALL","alias":"All"},"parsedFilter":{"empty":"empty"}}'
)),
'timeout' => 600,
'ignore_errors' => true
));
$ctx = stream_context_create($params);
$fp = fopen($post_url, 'rb', false, $ctx);
if( !$fp ) {
	$resp = stream_get_contents($fp) ;
}

$resp = stream_get_contents($fp) ;

$strlen = strlen($resp) ;
if( $strlen < 200 ) {
	die("Error\n") ;
}

$binary_zip = $resp ;

$filepath_zip = tempnam(sys_get_temp_dir(),'op5').'.zip' ;

file_put_contents($filepath_zip,$binary_zip) ;
$zip = new ZipArchive;
if ($zip->open($filepath_zip) === TRUE) {
    $binary_csv = $zip->getFromIndex(0);
    $zip->close();
} else {
    die("Zip error\n") ;
}
unlink($filepath_zip) ;


$binary_csv ;
$binary_csv = substr( $binary_csv, strpos($binary_csv, "\n")+1 );
$binary_csv = substr( $binary_csv, strpos($binary_csv, "\n")+1 );
$binary_csv = str_replace( '"="','',$binary_csv );
$binary_csv = str_replace( '""','',$binary_csv );

//echo $binary_csv ;

echo "importing STK..." ;
$query = "TRUNCATE TABLE store_table_EMB_BLACKOUT_STK" ;
$_opDB->query($query) ;
$_POST['csvsrc_binary'] = $binary_csv ;
$ret = paracrm_data_importDirect( array(
	'data_type' => 'table',
	'table_code' => $_tableCode
)) ;
echo " OK\n" ;











$post_url = 'https://eparts-api.herokuapp.com/core-blackout/export-csv' ;
$params = array('http' => array(
'method' => 'POST',
'content' => http_build_query(array(
	'token' => $_token,
	'params' => '{"parsedFilter":[]}'
)),
'timeout' => 600,
'ignore_errors' => true
));
$ctx = stream_context_create($params);
$fp = fopen($post_url, 'rb', false, $ctx);
if( !$fp ) {
	$resp = stream_get_contents($fp) ;
}

$resp = stream_get_contents($fp) ;

$strlen = strlen($resp) ;
if( $strlen < 200 ) {
	die("Error\n") ;
}

$binary_zip = $resp ;

$filepath_zip = tempnam(sys_get_temp_dir(),'op5').'.zip' ;

file_put_contents($filepath_zip,$binary_zip) ;
$zip = new ZipArchive;
if ($zip->open($filepath_zip) === TRUE) {
    $binary_csv = $zip->getFromIndex(0);
    $zip->close();
} else {
    die("Zip error\n") ;
}
unlink($filepath_zip) ;


$binary_csv ;
$binary_csv = substr( $binary_csv, strpos($binary_csv, "\n")+1 );
$binary_csv = substr( $binary_csv, strpos($binary_csv, "\n")+1 );
$binary_csv = str_replace( '"="','',$binary_csv );
$binary_csv = str_replace( '""','',$binary_csv );

//echo $binary_csv ;

echo "importing CORE..." ;
$query = "TRUNCATE TABLE store_table_EMB_BLACKOUT_CORE" ;
$_opDB->query($query) ;
$_POST['csvsrc_binary'] = $binary_csv ;
$ret = paracrm_data_importDirect( array(
	'data_type' => 'table',
	'table_code' => 'EMB_BLACKOUT_CORE'
)) ;
echo " OK\n" ;













$post_url = 'https://eparts-api.herokuapp.com/trackings-export' ;
$params = array('http' => array(
'method' => 'POST',
'content' => http_build_query(array(
	'token' => $_token,
	'params' => '{"isBlackoutOrder":true,"supplier":{},"aircraft":{"model":{"id":-1,"name":"All"}},"salesOrganization":{"value":"LBG1,ALL","alias":"All"},"range":{"start":null,"end":null},"parsedFilter":["Sales Organization: All","Blackout Order: Yes","Aircraft Model: All"]}'
)),
'timeout' => 600,
'ignore_errors' => true
));
$ctx = stream_context_create($params);
$fp = fopen($post_url, 'rb', false, $ctx);
if( !$fp ) {
	$resp = stream_get_contents($fp) ;
}

$resp = stream_get_contents($fp) ;

$strlen = strlen($resp) ;
if( $strlen < 200 ) {
	die("Error\n") ;
}

$binary_zip = $resp ;

$filepath_zip = tempnam(sys_get_temp_dir(),'op5').'.zip' ;

file_put_contents($filepath_zip,$binary_zip) ;
$zip = new ZipArchive;
if ($zip->open($filepath_zip) === TRUE) {
    $binary_csv = $zip->getFromIndex(0);
    $zip->close();
} else {
    die("Zip error\n") ;
}
unlink($filepath_zip) ;


$binary_csv ;
$binary_csv = substr( $binary_csv, strpos($binary_csv, "\n")+1 );
$binary_csv = substr( $binary_csv, strpos($binary_csv, "\n")+1 );
$binary_csv = substr( $binary_csv, strpos($binary_csv, "\n")+1 );
$binary_csv = str_replace( '"="','',$binary_csv );
$binary_csv = str_replace( '""','',$binary_csv );
$binary_csv = str_replace( '=','',$binary_csv );


//echo $binary_csv ;

echo "importing EXPED..." ;
$query = "TRUNCATE TABLE store_table_EMB_BLACKOUT_EXPED" ;
$_opDB->query($query) ;
$_POST['csvsrc_binary'] = $binary_csv ;
$ret = paracrm_data_importDirect( array(
	'data_type' => 'table',
	'table_code' => 'EMB_BLACKOUT_EXPED'
)) ;
echo " OK\n" ;










//print_r($ret) ;

$arr_update = array('DATE_LAST'=>date('Y-m-d H:i:s'),'DATE_FORCE'=>0) ;
$arr_cond = array('TABLE_CODE'=>$_tableCode) ;
$_opDB->update("view_table_EMB_BLACKOUT_CFG",$arr_update,$arr_cond) ;

//echo $resp ;

?>
