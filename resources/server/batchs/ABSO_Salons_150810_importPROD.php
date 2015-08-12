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

function do_prestashop_request($method, $function_url, $data, $optional_headers = null, $raw=FALSE)
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
	if( $raw ) {
		return $response ;
	}
	
	$xml = simplexml_load_string($response);
	return $xml ;
}

function xml2array ( $xmlObject, $out = array () )
{
	if( count( (array) $xmlObject ) == 0 || (count((array)$xmlObject)==1 && key((array)$xmlObject)=='@attributes') ) {
		return (string)$xmlObject ;
	}
        foreach ( (array) $xmlObject as $index => $node ) {
				$continue_iteration = ( is_object ( $node ) ||   is_array ( $node )) ;
				/*
				if( $continue_iteration ) {
					if( count((array)$xmlObject)==1 ) {
						foreach( (array) $xmlObject as $zindex => $znode ) {
							if( (string)$zindex == '@attributes' ) {
								$continue_iteration = FALSE ;
								echo (string)$node."\n" ;
							}
						}
					}
				}
				*/
            $out[$index] = ( $continue_iteration ? xml2array ( $node ) : $node);
         }

        return $out;
}

function do_psabs_query($table, $id) {
	global $_opDB ;
	
	switch( $table ) {
		case 'orders' :
			$dbtab = 'psabs_orders' ;
			$dbkey = 'id_order' ;
			break ;
		case 'order_details' :
			$dbtab = 'psabs_order_detail' ;
			$dbkey = 'id_order_detail' ;
			break ;
		case 'addresses' :
			$dbtab = 'psabs_address' ;
			$dbkey = 'id_address' ;
			break ;
		case 'customers' :
			$dbtab = 'psabs_customer' ;
			$dbkey = 'id_customer' ;
			break ;
		case 'products' :
			$dbtab = 'psabs_product' ;
			$dbkey = 'id_product' ;
			break ;
		default :
			echo "UNKNOWN!" ;
			exit ;
	}
	
	switch( $GLOBALS['_psabs_mode'] ) {
		case 'DB' :
			$query = "SELECT * FROM psabs.{$dbtab} WHERE {$dbkey}='{$id}'" ;
			$result = $_opDB->query($query) ;
			$row = $_opDB->fetch_assoc($result) ;
			$row['id'] = $row[$dbkey] ;
			return $row ;
		
		case 'API' :
			$xml = do_prestashop_request('GET',"/{$table}/{$id}" ,NULL) ;
			if( count( (array)$xml ) == 1 ) {
				$index = key($xml) ;
				$xml_single = $xml->$index ;
				$return_arr = xml2array($xml_single) ;
				$return_arr[$dbkey] = $return_arr['id'] ;
				return $return_arr ;
			}
			return NULL ;
	
		default :
			return NULL ;
	}
}


$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
$_SESSION['login_data']['mysql_db'] = 'op5_'.$_domain_id.'_prod' ;
$_SESSION['login_data']['login_domain'] = $_domain_id.'_prod' ;
$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;



media_contextOpen( $_sdomain_id ) ;
foreach( media_img_toolBible_list('PROD_SALES','entry') as $row ) {
	$media_id = $row['media_id'] ;
	media_img_delete($media_id) ;
}
media_contextClose() ;

$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() );
$t->sdomainDefine_truncateBible( DatabaseMgr_Sdomain::dbCurrent_getSdomainId(), 'PROD_SALES' ) ;



$GLOBALS['_psabs_mode'] = 'API' ;

$xml = do_prestashop_request('GET','/products',NULL) ;
foreach( $xml->products[0] as $product_node ) {
	$product_ids[] = (int)($product_node->attributes()->id) ;
}
foreach( $product_ids as $product_id ) {
	//do_psabs_query('products',$product_id) ;
	$arr_prod = do_psabs_query('products',$product_id) ;
	
	$key_product = ( $arr_prod['reference'] ? $arr_prod['reference'] : $arr_prod['id'] );
	
	$arr_ins = array() ;
	$arr_ins['field_PROD_REF'] = $key_product ;
	$arr_ins['field_PROD_NAME'] = $arr_prod['name']['language'] ;
	$arr_ins['field_PROD_EAN'] = $arr_prod['ean13'] ;
	$arr_ins['field_PRICE_STORE'] = $arr_prod['price'] ;
	$arr_ins['field_TXT'] = strip_tags($arr_prod['description_short']['language']) ;
	paracrm_lib_data_insertRecord_bibleEntry( 'PROD_SALES', $key_product, '', $arr_ins ) ;
	
	
	media_contextOpen( $_sdomain_id ) ;
	
	$xml = do_prestashop_request('GET',"/images/products/{$product_id}",NULL) ;
	foreach( $xml->image[0] as $image_node ) {
		$image_node = (array)$image_node ;
		foreach( $image_node['@attributes'] as $mkey => $mvalue ){
			$img_binary = do_prestashop_request('GET',"/images/products/{$product_id}/{$mvalue}",NULL,NULL,TRUE) ;
			
			$tmpfilename = tempnam( sys_get_temp_dir(), "FOO").'.jpg' ;
			file_put_contents($tmpfilename,$img_binary) ;
			
			$media_id = media_img_processUploaded( $tmpfilename, $mvalue.'.jpg' ) ;
			media_img_move( $media_id , $new_id = media_img_toolBible_createNewId( 'PROD_SALES', 'entry', $key_product ) ) ;
			
			unlink($tmpfilename) ;
		}
	}
	
	media_contextClose( $_sdomain_id ) ;
}




?>