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

include("$server_root/modules/spec_rsi_recouveo/backend_spec_rsi_recouveo.inc.php");


$json = specRsiRecouveo_config_loadMeta(array()) ;
$config_meta = $json['data'] ;
$transfert_url = $config_meta["gen_transfert_url"] ;
$transfert_apikey = $config_meta["gen_transfert_apikey"] ;
$transfert_domain = $config_meta["gen_transfert_domain"] ;

$mapMethodJson = specRsiRecouveo_lib_transfert_extract_mapMethodJson() ;
foreach ($mapMethodJson as $method => $json){
	specRsiRecouveo_transfert_SEND_DISTANT_REQUEST($json, $method, $transfert_url, $transfert_apikey, $transfert_domain);
}

function specRsiRecouveo_transfert_SEND_DISTANT_REQUEST($binary, $method, $distant_url, $distant_apikey, $distant_domain){
	//print_r($binary) ;
	// Construction de l'URL
	$arr_url = parse_url($distant_url) ;
	$auth_url = $arr_url['scheme'].'://'.urlencode($distant_domain).':'.urlencode($distant_apikey).'@'.$arr_url['host'].":".$arr_url["port"].'/'.$arr_url['path'].'/'.$method ;

	echo $auth_url."\n" ;
	$params = array('http' => array(
		'method' => 'POST',
		'content' => $binary,
		'timeout' => (30*60)
	));
	$ctx = stream_context_create($params);
	$fp = @fopen($auth_url, 'rb', false, $ctx);
	echo $http_response_header[0]."\n" ;
	if( $fp ) {
		$ret = stream_get_contents($fp) ;
		echo $ret;
		echo "\n" ;
		$done = TRUE ;
	}
	echo "\n" ;
	return $ret ;
}
?>
