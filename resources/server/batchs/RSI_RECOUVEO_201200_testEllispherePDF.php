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


$obj_request = array(
'username' => 'RECOUVEO',
'password' => 'Teteplate13$'
);

/*
        <product range="101003" version="10" />
        <product range="101001" version="6" />
*/


$xml_request = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<svcOnlineOrderRequest lang="FR" version="2.1">
    <admin>
        <client>
        <contractId>45353</contractId>
		<userPrefix>GEOCOM</userPrefix>
		<userId>NN411025</userId>
		<password>OICZ5M45OBMD</password>
        <privateReference type="order">AE1296544</privateReference>
        </client>
        <context>
        <appId version="1">WSOM</appId>
        <date>2011-12-13T17:38:15+01:00</date>
        </context>
    </admin>
    <request>
        <id type="register" idName="SIREN">794409433</id>
        <product range="101003" version="10" />
        <deliveryOptions>
               <outputMethod>content</outputMethod>
               <format>PDF</format>
        </deliveryOptions>
    </request>
</svcOnlineOrderRequest>' ;

//echo $xml_request ;

/*
	$tmpfilepath = tempnam(sys_get_temp_dir(),'op5') ;
	$handle_priv = fopen($tmpfilepath,'wb') ;
	fwrite($handle_priv,$xml_request);
	fclose($handle_priv) ;
*/


$xml = simplexml_load_string( $xml_request, 'SimpleXMLElement', LIBXML_NOCDATA);
$xml_array = json_decode(json_encode((array)$xml), TRUE);
//print_r($xml_array);


$dom = new DOMDocument('1.0');
$dom->preserveWhiteSpace = false;
$dom->formatOutput = false;
$dom->loadXML($xml->asXML());
$xml_binary = $dom->saveXML();

//echo $xml_binary ;
//die() ;



				//$binary_zpl = base64_decode($json['labelData']) ;
				$post_url = 'https://services.data-access-gateway.com/1/rest/svcOnlineOrder' ;
				$params = array('http' => array(
				'method' => 'POST',
				'content' => $xml_binary,
				'timeout' => 600,
				'ignore_errors' => true,
				'header'=> "Content-type: application/xml\r\n"
				));
				$ctx = stream_context_create($params);
				$fp = fopen($post_url, 'rb', false, $ctx);
				if( !$fp ) {
					//break 2 ;
				}
				$status_line = $http_response_header[0] ;
				preg_match('{HTTP\/\S*\s(\d{3})}', $status_line, $match);
				$status = $match[1];
				$response_success = ($status == 200) ;


$xml_response = stream_get_contents($fp) ;
//$xml = simplexml_load_string( $xml_response, 'SimpleXMLElement', LIBXML_NOCDATA);
//$xml_json = json_encode((array)$xml, JSON_PRETTY_PRINT) ;


echo $xml_response ;




?>
