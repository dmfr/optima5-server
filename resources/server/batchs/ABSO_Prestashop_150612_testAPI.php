<?php


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




function do_prestashop_request($method, $function_url, $data, $optional_headers = null)
{
	$_shopify_apikey = "COGGKQI5ATYLTC9W04WXBO303UGC64YW" ;

	$_shopify_baseurl = "http://{$_shopify_apikey}@www.absoluliss.fr/api" ;
	
	$url = $_shopify_baseurl.$function_url ;
	
	$params = array('http' => array(
					'method' => $method,
					'content' => $data
					));
	if($optional_headers !== null) {
		$params['http']['header'] = $optional_headers;
	}
	$ctx = stream_context_create($params);
	$fp = @fopen($url, 'rb', false, $ctx);
	if (!$fp) {
		throw new Exception("Problem with $url, $php_errormsg");
	}
	$response = @stream_get_contents($fp);
	if ($response === false) {
		throw new Exception("Problem reading data from $url, $php_errormsg");
	}
	
	$xml = simplexml_load_string($response);
	return $xml ;
}
function xml2array ( $xmlObject, $out = array () )
{
	if( count( (array) $xmlObject ) == 0 ) {
		return (string)$xmlObject ;
	}
        foreach ( (array) $xmlObject as $index => $node ) 
            $out[$index] = ( is_object ( $node ) ||  is_array ( $node ) ) ? xml2array ( $node ) : $node;

        return $out;
}

$order_ids = array() ;
$xml = do_prestashop_request('GET','/orders',NULL) ;
foreach( $xml->orders[0] as $order_node ) {
	$order_ids[] = (int)($order_node->attributes()->id) ;
}
sort($order_ids) ;

$existing_ids = array() ;
$query = "SELECT field_ORDER_ID FROM view_file_ORDERS" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$existing_ids[] = $arr[0] ;
}

$toRetrieve_ids = array_diff($order_ids, $existing_ids) ;



foreach( $toRetrieve_ids as $order_id ) {
	$xml = do_prestashop_request('GET',"/orders/{$order_id}" ,NULL) ;
	if( count( (array)$xml ) == 1 ) {
		$index = key($xml) ;
	}
	$xml_order = $xml->$index ;

   print_r( xml2array($xml_order) );
}




?>