<?php

$ftp_log_storage_local_path = '/var/lib/optima5/ftp_logs' ;

$api_apikey = getenv("API_APIKEY") ;
$api_domain = getenv("API_DOMAIN") ; // TEST%veo
$api_path = getenv("API_PATH"); 
// ftp credentials
$ftp_upload_server = getenv('FTP_HOST') ;
$ftp_upload_user = getenv('FTP_USER') ;
$ftp_upload_password = getenv('FTP_PW') ;


/*
$api_apikey = "86E2F07A94B23A4FECDE177D92BEF0D3" ;
$api_domain = "TEST@veo" ;
$api_path = "10.39.1.3/paracrm.recouveo1611/server/API.php/" ;
// ftp credentials
$ftp_upload_server = "localhost" ;
$ftp_upload_user = "veo" ;
$ftp_upload_password = "password" ;
*/

// exec cmd : FTP_HOST="localhost" FTP_USER="veo" FTP_PW="password" php server/ftp_file_upload.php
$current_date = date("Y-m-d") ;
$current_time = date('H:i:s') ;

$string = $current_time." le ".$current_date."\n" ;
$string .= "\nConnexion ftp sur ".$ftp_upload_server." par ".$ftp_upload_user."\n" ;

$ftp_connect = ftp_connect($ftp_upload_server) ;
if (!$ftp_connect){
	$string .= "Connexion échouée\n" ;
	$string .= "\n---------------------\n\n" ;
	@file_put_contents($ftp_log_storage_local_path."/logs-".$current_date, $string, FILE_APPEND);
	return false ;
}
$string .= "Connexion réussie\n" ;

// test pattern ?
// si non => continue ;
// ftp connect -> d/l binary -> ftpclose
// si binary erreur => continue
// upload via la bonne methode (switch($pattern))

$ftp_login = ftp_login($ftp_connect, $ftp_upload_user, $ftp_upload_password) ;
$remote_filenames = ftp_nlist($ftp_connect, ".") ;
ftp_close($ftp_connect) ;
sleep(1) ;
// Connexion
$list_of_filenames = array() ;
$list_of_files = array() ;
foreach( array('CLT','ENR') as $pattern ) {
	foreach( $remote_filenames as $remote_filename ) {
		if (!stripos($remote_filename, $pattern)) continue ;

		$handle = tmpfile() ;
		$ftp_connect = ftp_connect($ftp_upload_server) ;
		$ftp_login = ftp_login($ftp_connect, $ftp_upload_user, $ftp_upload_password) ;
		ftp_fget($ftp_connect, $handle, $remote_filename,FTP_BINARY) ;
		fseek($handle,0) ;
		$binary = stream_get_contents($handle) ;
		ftp_close($ftp_connect) ;
		fclose($handle) ;
		switch ($pattern){
			case 'CLT':
				$ret = ftp_file_upload_SEND_REQUEST($api_apikey, $api_domain, $api_path, $binary, "upload_account") ;
				$ret = json_decode($ret, true) ;
				$ret_acc = $ret["account"] ;
				$ret_adrbook = $ret["adrbook"] ;
				if (!$ret_acc["count_success"]) $ret_acc["count_success"] = "0" ;
				if (!$ret_adrbook["count_success"]) $ret_adrbook["count_success"] = "0" ;
				$list_of_files[$remote_filename." - Comptes"] = "Success: ".$ret_acc["count_success"]." - Erreurs: ".count($ret_acc["errors"]) ;
				$list_of_files[$remote_filename." - Adrbook"] = "Success: ".$ret_adrbook["count_success"]." - Erreurs: ".count($ret_adrbook["errors"]) ;
				$list_of_filenames[] = $remote_filename;
				break ;
			case 'ENR':
				$ret = ftp_file_upload_SEND_REQUEST($api_apikey, $api_domain, $api_path, $binary, "upload_record") ;
				$ret = json_decode($ret, true) ;
				$ret = $ret["records"] ;
				if (!$ret["count_success"]) $ret["count_success"] = "0" ;
				$list_of_files[$remote_filename." - Factures"] = "Success: ".$ret["count_success"]." - Erreurs: ".count($ret["errors"]) ;
				$list_of_filenames[] = $remote_filename;
				break ;
		}
	}
}
/*
 *
 * Time: XX:XX:XX le XX/XX/XX
 * Connexion ftp sur ftp_upload_server par ftp_upload_user
 * Connexion réussie/échouée
 * Fichiers à traités: list_of_files
 * Fichier (filename): x erreurs
 * Fichier (filename): x erreurs
 * Fichier (filename): x erreurs
 * -----------------------------------
*/

$files = implode(", ", $list_of_filenames) ;
$string .= "Fichiers à traiter: ".$files."\n" ;
//print_r($list_of_files) ;
foreach ($list_of_files as $index => $file){
	$string .= $index."=> ".$file."\n" ;
}
$string .= "\n---------------------\n\n" ;
@file_put_contents($ftp_log_storage_local_path."/logs-".$current_date, $string, FILE_APPEND);

$ftp_connect = ftp_connect($ftp_upload_server) ;
$ftp_login = ftp_login($ftp_connect, $ftp_upload_user, $ftp_upload_password) ;

foreach ($list_of_filenames as $file){
	ftp_rename($ftp_connect, $file, './archives/'.$current_date.'-'.$file);
}

ftp_close($ftp_connect) ;


function ftp_file_upload_SEND_REQUEST($apikey, $domain, $path, $json, $file_model){

	$_recouveo_baseurl = "http://".urlencode($domain).":".$apikey."@".$path.$file_model ;
	$url = $_recouveo_baseurl;
	$data = $json ;
	$params = array('http' => array(
		'timeout' => 2000,
		'method' => 'POST',
		'content' => $data
	));
	$ctx = stream_context_create($params);
	$fp = fopen($url, 'rb', false, $ctx);
	//print_r(apache_response_headers()) ;
	if (!$fp) {
		exit;
	}
	//print_r($_REQUEST) ;
	$response = stream_get_contents($fp);
	if ($response === false) {
		return false ;
	}

	//echo $response ;
	return $response ;
}

?>
