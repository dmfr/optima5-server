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



$token = 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0YXBpZ2F0ZXdheSIsImlhdCI6MTU1NjI4ODU4MSwianRpIjoiMmVmNTc1OWUtYzk2MS00MTZjLTk0YWEtYjU0NDI1YjcyMGQwIiwiZXhwIjoxNTU2Mjg5NDgxfQ.UKuUO_6XzIeLuMXguAkZ5pTz3y4enxWoODfndA3rHxA' ;

$json = array(
	"format" => "ZPL",
	//"printer" => "FOO",
	"provider" => "UPS_TEST_FR_ARNAUD_ACCOUNT",
	"shipment" => array(
		"consignee" => array(
			"city" => "SINGAPORE",
			"companyName" => "SERVICES ASIA PTE LTD",
			"contactName" => "Damien Mirand",
			"countryCode" => "SG",
			//"divisionCode" => "string",
			//"fax" => "string",
			//"mail" => "dm@mirabel-sil.com",
			"phone" => "+33683820121",
			"postalCode" => "498756",
			"street1" => "26 Changi North Rise",
			//"street2" => "string",
			//"street3" => "string"
		),
		"customsDeclaration" => array(
			"currencyCode" => "EUR",
			"declaredValue" => 1000,
			//"termsOfTrade" => "string"
		),
		"distanceUnit" => "CM",
		"parcels" => array(array(
			"customReference" => "PACK1234",
			"depth" => 20,
			"description" => "Materiel",
			"height" => 30,
			//"hsCode" => "string",
			//"originCountryCode" => "string",
			"weight" => 4,
			"width" => 35
		)),
		"payor" => "SHIPPER",
		"payorAccountNumber" => "A88E42",
		"service" => "UPS_65",
		"shipper" => array(
			"city" => "MITRY MORY",
			"companyName" => "DB SCHENKER",
			"contactName" => "Damien Mirand",
			"countryCode" => "FR",
			//"divisionCode" => "string",
			//"fax" => "string",
			"mail" => "test@mirabel-sil.com",
			"phone" => "+33683820121",
			"postalCode" => "77290",
			"street1" => "RUE RENE CASSIN",
			//"street2" => "string",
			//"street3" => "string"
		),
		"weightUnit" => "KG"
	),
	"size" => "SIZE_8_4"
) ;

//echo json_encode($json) ;
//die() ;

	$post_url = 'https://services.schenkerfrance.fr/gateway_PPD/rest/ship/v1/label/create' ;
	$params = array('http' => array(
	'method' => 'POST',
	'content' => json_encode($json),
	'timeout' => 600,
	'ignore_errors' => true,
	'header'=>"Authorization: {$token}\r\n"."accept: application/json\r\n"."Content-Type: application/json\r\n"
	));
	$ctx = stream_context_create($params);
	$fp = fopen($post_url, 'rb', false, $ctx);
	if( !$fp ) {
		return FALSE ;
	}
	
	$response = stream_get_contents($fp) ;
	echo $response ;




?>
