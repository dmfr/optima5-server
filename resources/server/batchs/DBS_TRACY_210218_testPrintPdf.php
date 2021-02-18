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

include("$server_root/modules/spec_dbs_tracy/backend_spec_dbs_tracy.inc.php");

$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
$_SESSION['login_data']['mysql_db'] = 'op5_'.$_domain_id.'_prod' ;
$_SESSION['login_data']['login_domain'] = $_domain_id.'_prod' ;
$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;


$test_trsptRef = 'PICK/00001' ;
$query = "SELECT field_FILE_TRSPT_ID FROM view_file_TRSPTPICK_TRSPT WHERE filerecord_parent_id IN (select filerecord_id FROM view_file_TRSPTPICK WHERE field_ID_PICK='PICK/00001') ORDER BY field_FILE_TRSPT_ID ASC LIMIT 1" ;
$test_trsptFilerecordId = $_opDB->query_uniqueValue($query) ;


/*
echo specDbsTracy_lib_TMS_getLabel($test_trsptFilerecordId) ;
die() ;
*/

/*
echo $test_trsptFilerecordId ;

echo "\n" ;
die() ;
*/

//$test_trsptFilerecordId = 1066106 ;

$ttmp = specDbsTracy_trspt_getRecords( array('filter_trsptFilerecordId_arr'=>json_encode(array($test_trsptFilerecordId))) ) ;
//print_r($ttmp) ;
$row_trspt = $ttmp['data'][0] ;
if( $row_trspt['trspt_filerecord_id'] != $test_trsptFilerecordId ) {
	die() ;
}
	
print_r($row_trspt) ;

$ttmp = specDbsTracy_trsptpick_fetchPdf( array('trsptpick_filerecord_id'=>$row_trspt['trsptpick_filerecord_id']) ) ;
echo $ttmp['pdf_base64'] ;

$GLOBALS['__specDbsTracy_lib_TMS_PRINTURL'] = 'https://services.schenkerfrance.fr/gateway-fat/rest/ship/v1/print' ;

$_token = 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzYWZyYW5zbHMiLCJpc3MiOiJFWFQiLCJpYXQiOjE2MDA4NzEyODgsImF1ZCI6ImFwaWdhdGV3YXkvcmVzdC9zaGlwL3YxIiwianRpIjoiNWVlOWIzZGEtOTBkOC00YTYyLTg5NmItNmRhMTZlNGIyYzcyIn0.IiuPnA1KkFxLBcZutUo1iSZCfQo0pxRAKstlt_zJ-Gs' ;

	$post_url = $GLOBALS['__specDbsTracy_lib_TMS_PRINTURL'].'?'.http_build_query(array(
		'documentName' => 'TracyLabel',
		'format' => 'PDF',
		'host' => '10.204.204.58'
	)) ;
	$params = array('http' => array(
		'method' => 'POST',
		'content' => base64_decode($ttmp['pdf_base64']),
		'timeout' => 600,
		'ignore_errors' => true,
		'header'=>"Authorization: {$_token}\r\n".""."Content-Type: application/octet-stream\r\n"
	));
	//print_r($params) ;
	$ctx = stream_context_create($params);
	$fp = fopen($post_url, 'rb', false, $ctx);
	if( !$fp ) {
		
	}
	$status_line = $http_response_header[0] ;
	$resp = stream_get_contents($fp) ;
	preg_match('{HTTP\/\S*\s(\d{3})}', $status_line, $match);
	$status = $match[1];
	$response_success = (($status == 200) || ($status == 404)) ;
	echo $status ;
	echo $resp ;
	if( !$response_success ) {
		//echo $resp ;
		//throw new Exception("TMS : Print error code=$status");
	}


?>
