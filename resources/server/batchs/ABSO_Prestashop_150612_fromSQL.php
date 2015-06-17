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


include("$server_root/modules/paracrm/backend_paracrm.inc.php");

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

function do_psabs_query($table,$field,$value) {
	global $_opDB ;
	$query = "SELECT * FROM psabs.{$table} WHERE {$field}='{$value}'" ;
	$result = $_opDB->query($query) ;
	return $_opDB->fetch_assoc($result) ;
}




$order_ids = array() ;
$query = "SELECT id_order FROM psabs.psabs_orders" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$order_ids[] = $arr[0] ;
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
	$row_order = do_psabs_query('psabs_orders','id_order',$order_id) ;
	if( !$row_order['valid'] ) {
		//continue ;
	}
	$row_address = do_psabs_query('psabs_address','id_address',$row_order['id_address_delivery']) ;
	$row_customer = do_psabs_query('psabs_customer','id_customer',$row_order['id_customer']) ;
	
	$firstbuy = FALSE ;
	if( !paracrm_lib_data_getRecord_bibleEntry('CUSTOMER',$row_customer['id_customer']) ) {
		// Customer
		$insert_customer = array() ;
		$insert_customer['field_CUSTOMER_ID'] = $row_customer['id_customer'] ;
		$insert_customer['field_ID_FULLNAME'] = $row_customer['firstname'].' '.$row_customer['lastname'] ;
		$insert_customer['field_ID_BIRTHDAY'] = $row_customer['birthday'] ;
		$insert_customer['field_ID_EMAIL'] = $row_customer['email'] ;
		$insert_customer['field_DATE_CREATE'] = $row_customer['date_add'] ;
		paracrm_lib_data_insertRecord_bibleEntry( 'CUSTOMER', $row_customer['id_customer'], '', $insert_customer ) ;
		$firstbuy = TRUE ;
	}
	
	switch($row_customer['id_gender']) {
		case 1 :
			$gender = 'H' ;
			break ;
		case 2 :
			$gender = 'F' ;
			break ;
		default :
			$gender = '' ;
			break ;
	}
	
	$insert_orders = $insert_order_lines = array() ;
	$insert_orders['field_ORDER_ID'] = $row_order['id_order'] ;
	$insert_orders['field_DATE'] = $row_order['invoice_date'] ;
	$insert_orders['field_CUSTOMER'] = $row_customer['id_customer'] ;
	$insert_orders['field_CUSTOMER_COUNTRY'] = 'FR' ;
	$insert_orders['field_CUSTOMER_DPT'] = substr($row_address['postcode'],0,2) ;
	$insert_orders['field_CUSTOMER_GENDER'] = $gender ;
	$insert_orders['field_CUSTOMER_AGE'] = ( ((int)substr($row_customer['birthday'],0,4)) > 0  ? (int)substr($row_order['invoice_date'],0,4) - (int)substr($row_customer['birthday'],0,4) : '' );
	$insert_orders['field_STATUS_FIRSTBUY'] = $firstbuy ;
	
	$tot_prods_net = $row_order['total_products'] ;
	$tot_prods_std = 0 ;
	$tot_netstore = $row_order['total_paid_real'] - $row_order['total_shipping'] ;
	
	$query = "SELECT * FROM psabs.psabs_order_detail WHERE id_order='{$row_order['id_order']}'" ;
	$result = $_opDB->query($query) ;
	while( ($row_order_detail = $_opDB->fetch_assoc($result)) != FALSE ) {
		$row_product = do_psabs_query('psabs_product','id_product',$row_order_detail['product_id']) ;
		if( !$row_product ) {
		}
		$key_product = ( $row_order_detail['product_reference'] ? $row_order_detail['product_reference'] : $row_order_detail['product_id'] );
		if( !paracrm_lib_data_getRecord_bibleEntry('PRODUCT',$key_product) ) {
			$insert_product = array() ;
			$insert_product['field_PROD_REF'] = $key_product ;
			$insert_product['field_PROD_DESC'] = $row_order_detail['product_name'] ;
			$insert_product['field_DATE_CREATE'] = $row_product['date_add'] ;
			$insert_product['field_DATE_UPDATE'] = $row_product['date_upd'] ;
			paracrm_lib_data_insertRecord_bibleEntry( 'PRODUCT', $key_product, '', $insert_product ) ;
		}
		
		$insert_order_lines[] = array(
			'field_LINE_ID' => $row_order_detail['id_order_detail'],
			'field_PRODUCT' => $key_product,
			'field_PRODUCT_PRICE_STD' => $row_order_detail['product_price'],
			'field_PRODUCT_PRICE_NET' => $row_order_detail['product_price'] * ((100-$row_order_detail['reduction_percent'])/100),
			'field_QTY' => $row_order_detail['product_quantity'],
			'field_AMOUNT' => $row_order_detail['product_price'] * $row_order_detail['product_quantity'] * ((100-$row_order_detail['reduction_percent'])/100)
		) ;
		$tot_prods_std += ($row_order_detail['product_price'] * $row_order_detail['product_quantity']) ;
	}
	
	$insert_orders['field_TOTAL_NETSTORE'] = $tot_netstore ;
	$insert_orders['field_TOTAL_PRODS_NET'] = $tot_prods_net ;
	$insert_orders['field_TOTAL_PRODS_STD'] = $tot_prods_std ;
	$filerecord_id = paracrm_lib_data_insertRecord_file( 'ORDERS' , 0 , $insert_orders, $ignore_ifExists=FALSE ) ;
	foreach( $insert_order_lines as $insert_order_line ) {
		//print_r($insert_order_line) ;
		paracrm_lib_data_insertRecord_file( 'ORDER_LINE' , $filerecord_id , $insert_order_line, $ignore_ifExists=FALSE ) ;
	}
}




?>