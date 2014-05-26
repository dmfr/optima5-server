<?php
ini_set( 'memory_limit', '256M');

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


function do_post_request_fp($url, $data, $optional_headers = null)
{
  $params = array('http' => array(
              'method' => 'POST',
              'content' => $data
            ));
  if ($optional_headers !== null) {
    $params['http']['header'] = $optional_headers;
  }
  $ctx = stream_context_create($params);
  $fp = @fopen($url, 'rb', false, $ctx);
  return $fp;
}
function do_post_request($url, $data, $optional_headers = null)
{
  $params = array('http' => array(
              'method' => 'POST',
              'content' => $data
            ));
  if ($optional_headers !== null) {
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
  return $response;
}
function oscario_http_post( $post_data, $fp=FALSE ) {
	$_URL = 'http://10.39.118.2/oscario/edi.php' ;
	$_domain = 'paramountfr' ;
	$_auth_username = 'ediMirAbv04' ;
	$_auth_password = 'paracrm' ;
	
	$post_base = array();
	$post_base['oscario_domain'] = $_domain ;
	$post_base['auth_username'] = $_auth_username ;
	$post_base['auth_password'] = $_auth_password ;
	$post = $post_base + $post_data ;
	
	if( $fp ) {
		return do_post_request_fp($_URL,http_build_query($post)) ;
	} else {
		return do_post_request($_URL,http_build_query($post)) ;
	}
}


$post = array() ;
$post['edi_method'] = 'dump' ;
$post['dump_table'] = 'prod' ;
$handle = oscario_http_post($post, $fp=TRUE) ;


$arr_ean_prods = array() ;
$arr_prod_row = array() ;

$lig = fgets($handle)  ;
$fields = json_decode($lig) ;
while( !feof($handle) ) {
	$lig = fgets($handle)  ;
	$row = json_decode($lig) ;
	
	$remote_row = array_combine($fields,$row) ;
	// print_r($remote_row) ;
	
	$prod_ref = $remote_row['prod_ref'] ;
	
	$arr_prod_row[$prod_ref] = $remote_row ;
	
	$prod_gencod = $remote_row['prod_gencod'] ;
	if( !$prod_gencod ) {
		continue ;
	}
	if( !isset($arr_ean_prods[$prod_gencod]) ) {
		$arr_ean_prods[$prod_gencod] = array() ;
	}
	$arr_ean_prods[$prod_gencod][] = $prod_ref ;
}

//print_r($arr_ean_prods) ;

$arr_ean_prod = array() ;
foreach( $arr_ean_prods as $ean => $prods ) {
	rsort($prods,SORT_STRING) ;
	$arr_ean_prod[$ean] = reset($prods) ;
}

//print_r($arr_ean_prod) ;


$query = "SELECT * FROM view_bible_IRI_PROD_entry" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
	$entry_key = $arr['entry_key'] ;
	
	if( reset(json_decode($arr['field_PROD_BRAND'])) != 'WONDERFUL' ) {
		continue ;
	}
	
	if( isset($arr_ean_prod[$entry_key]) ) {
		$prod_ref = $arr_ean_prod[$entry_key] ;
	} else {
		$prod_ref = $entry_key ;
	}
	if( !isset($arr_prod_row[$prod_ref]) ) {
		echo "!! : ".$entry_key."\n" ;
		continue ;
	}
	$remote_row = $arr_prod_row[$prod_ref] ;
	
	//print_r($remote_row) ;
	$is_box = ($remote_row['pcb_qte_pack']==1 && $remote_row['eq_ut']>1) ;
	
	$arr_update = array() ;
	$arr_update['field_PROD_EAN_str'] = $remote_row['prod_gencod'] ;
	$arr_update['field_PROD_BRANDCODE_str'] = $prod_ref ;
	$arr_update['field_PROD_TXT_str'] = $remote_row['prod_lib'] ;
	$arr_update['field_PROD_VOLUME_dec'] = $remote_row['eq_kg'] ;
	$arr_update['field_PROD_UOM_str'] = ( $is_box ? 'BIN' : 'EA' ) ;
	$arr_update['field_PROD_PCB_dec'] = $remote_row['pcb_qte_pack'] ;
	$arr_update['field_PROD_ISBOX_int'] = ( $is_box ? 1 : 0 ) ;
	
	$arr_cond = array() ;
	$arr_cond['entry_key'] = $entry_key ;
	
	$_opDB->update('store_bible_IRI_PROD_entry',$arr_update,$arr_cond);
}



?>