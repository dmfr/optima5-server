<?php

$ftp_log_storage_local_path = '/var/lib/optima5/ftp_logs' ;

$api_apikey = getenv("API_APIKEY") ;
$api_domain = getenv("API_DOMAIN") ; // test@veo
$api_path = getenv("API_URL");
// ftp credentials
$ftp_upload_server = getenv('FTP_HOST') ;
$ftp_upload_user = getenv('FTP_USER') ;
$ftp_upload_password = getenv('FTP_PW') ;
$ftp_upload_path = getenv('FTP_PATH') ;
if( !$ftp_upload_path ) {
	$ftp_upload_path = '/' ;
}
$ftp_archive_path = getenv('FTP_ARCHIVE') ;
if( !$ftp_archive_path ) {
	$ftp_archive_path = sys_get_temp_dir() ;
}


/*
********* Lancement en ligne de commande ***********

Exemple :

# \
> FTP_HOST="10.39.1.3" \
> FTP_USER="veo" \
> FTP_PW="password" \
> API_URL="http://10.39.1.3/paracrm.recouveo1611/server/API.php" \
> API_DOMAIN="hvs@veo" \
> API_APIKEY="94B3A2C8C0A15ACD8063075B93C92B27" \
> /usr/bin/php \
> /var/www/html/paracrm.recouveo1611/resources/server/batchs/RSIVEO_extHavas1901_ftp2api.php


# FTP_HOST="10.39.1.3" FTP_USER="veo" FTP_PW="password" API_URL="http://10.39.1.3/paracrm.recouveo1611/server/API.php" API_DOMAIN="hvs@veo" API_APIKEY="94B3A2C8C0A15ACD8063075B93C92B27" /usr/bin/php /var/www/html/paracrm.recouveo1611/resources/server/batchs/RSIVEO_extHavas1901_ftp2api.php


*****************************************************
*/



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
$remote_filenames = ftp_nlist($ftp_connect, $ftp_upload_path) ;
@ftp_mkdir($ftp_connect,$ftp_upload_path.'/history') ;
//print_r($remote_filenames) ;
ftp_close($ftp_connect) ;
sleep(1) ;


// Connexion
$list_of_filenames = array() ;
$list_of_files = array() ;
foreach( array('CLI','ENR') as $pattern ) {
	//print_r("here") ;
	foreach( $remote_filenames as $remote_filename ) {
		if (stripos($remote_filename, $pattern) === FALSE) continue ;
		$handle = tmpfile() ;
		$ftp_connect = ftp_connect($ftp_upload_server) ;
		$ftp_login = ftp_login($ftp_connect, $ftp_upload_user, $ftp_upload_password) ;
		ftp_chdir($ftp_connect,$ftp_upload_path) ;
		
		ftp_fget($ftp_connect, $handle, $remote_filename,FTP_BINARY) ;
		ftp_rename($ftp_connect,$remote_filename,'./history/'.$remote_filename) ;
		
		fseek($handle,0) ;

		$binary = stream_get_contents($handle) ;

		$binary = mb_convert_encoding($binary, "UTF-8", mb_detect_encoding($binary,"UTF-8, ISO-8859-1, ISO-8859-15"));

		$line = strtok($binary, "\n");
		$line = trim($line) ;

		$mapSepCount = array() ;
		foreach( array(',',';') as $sep ) {
			$mapSepCount[$sep] = count(str_getcsv($line,$sep)) ;
		}
		arsort($mapSepCount) ;
		reset($mapSepCount) ;
		$separator = key($mapSepCount) ;
		unset($mapSepCount) ;



		ftp_close($ftp_connect) ;
		fclose($handle) ;
		switch ($pattern){
			case 'CLI':
				$binary = add_CLT_header($binary,$separator) ;
				file_put_contents('/tmp/myCLI.txt',$binary) ;
				$ret = ftp_file_upload_SEND_REQUEST($binary, "upload_COMPTES") ;
				$ret = json_decode($ret, true) ;
				if (!$ret["count_success"]) $ret["count_success"] = "0" ;
				$list_of_files[$remote_filename." - CLT"] = "Success: ".$ret["count_success"]." - Erreurs: ".count($ret["errors"]) ;
				$list_of_filenames[] = $remote_filename;
				break ;
			case 'ENR':
				$binary = add_ENR_header($binary,$separator) ;
				$ret = ftp_file_upload_SEND_REQUEST($binary, "upload_FACTURES") ;
				$ret = json_decode($ret, true) ;
				if (!$ret["count_success"]) $ret["count_success"] = "0" ;
				$list_of_files[$remote_filename." - ENR"] = "Success: ".$ret["count_success"]." - Erreurs: ".count($ret["errors"]) ;
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


/*
$ftp_connect = ftp_connect($ftp_upload_server) ;
$ftp_login = ftp_login($ftp_connect, $ftp_upload_user, $ftp_upload_password) ;
ftp_chdir($ftp_connect,$ftp_upload_path) ;
foreach ($list_of_filenames as $file){
	$local_path = $ftp_archive_path.'/'.$current_date.'-'.$current_time.'-'.basename($file) ;
	ftp_get($ftp_connect, $local_path, $file, FTP_BINARY) ;
	ftp_delete($ftp_connect, $file) ;

}
ftp_close($ftp_connect) ;
*/



function add_CLT_header($binary,$separator) {
	$tmp_handle_in = tmpfile() ;
	fwrite($tmp_handle_in,$binary) ;
	
	$tmp_handle_out = tmpfile() ;
	
	fseek($tmp_handle_in,0) ;
	while( !feof($tmp_handle_in) ) {
		$arr_csv = fgetcsv($tmp_handle_in,0,$separator) ;
		if( !$arr_csv ) {
			continue ;
		}
		
		foreach( $arr_csv as $idx=>&$val ) {
			$val = trim($val) ;
		}
		unset($val) ;
		
		if( $arr_csv[5][0] != 'C' ) {
			continue ;
		}
		
		$idx = 18 ;
		while( strpos($arr_csv[$idx], '@') !== FALSE ) {
			unset($arr_csv[$idx]) ;
			$arr_csv = array_values($arr_csv) ;
		}
		
		$val_PAYS = $arr_csv[14] ;
		if( !$arr_csv[1] ) {
			if( substr(strtolower($val_PAYS),0,2)=='fr' ) {
				$arr_csv[1] = 'FR' ;
			} else {
				$arr_csv[1] = 'EN' ;
			}
		}
		if( !$arr_csv[3] ) {
			$arr_csv[3] = $val_PAYS ;
		}
		
		fputcsv($tmp_handle_out,$arr_csv,$separator) ;
	}
	
	fseek($tmp_handle_out,0) ;
	$binary = stream_get_contents($tmp_handle_out) ;
	
	fclose($tmp_handle_in) ;
	fclose($tmp_handle_out) ;
	
	
	$header = array("Société","Meta:LANG","Pro/part.","Meta:PAYS","Attribut 2","Numéro client","Raison sociale"," Nom ","Prénom","Coordonnées invalides ?","Adresse 1","Adresse 2","Code postal","Ville","Pays","Tél. 1","Tél. 2","Mail","SIREN","Méta donnée 1","Méta donnée 2","Méta donnée 3","Méta donnée 4","Méta donnée 5") ;

	return implode($separator,$header)."\n".$binary ;
}
function add_ENR_header($binary,$separator) {
	$tmp_handle_in = tmpfile() ;
	fwrite($tmp_handle_in,$binary) ;
	
	$tmp_handle_out = tmpfile() ;
	
	fseek($tmp_handle_in,0) ;
	while( !feof($tmp_handle_in) ) {
		$arr_csv = fgetcsv($tmp_handle_in,0,$separator) ;
		if( !$arr_csv ) {
			continue ;
		}
		
		foreach( $arr_csv as $idx=>&$val ) {
			$val = trim($val) ;
		}
		unset($val) ;
		
		
		foreach( array(8,9,10,15) as $idx ) {
			$val = $arr_csv[$idx] ;
			if( strpos($val,'-+')===0 ) {
				$val = '-'.substr($val,2) ;
				$arr_csv[$idx] = $val ;
			}
		}
		
		
		fputcsv($tmp_handle_out,$arr_csv,$separator) ;
	}
	
	fseek($tmp_handle_out,0) ;
	$binary = stream_get_contents($tmp_handle_out) ;
	
	fclose($tmp_handle_in) ;
	fclose($tmp_handle_out) ;
	
	
	$header = array("Société","Numéro client","Date transmission","Date facture","Date échéance","Id facture","Numéro facture","Libellé","Montant HT","Montant TTC","Montant TVA","Meta:JOURNAL","Lettrage","Lettrage soldé ?","Date lettrage","Montant devise","Code devise") ;
	return implode($separator,$header)."\n".$binary ;
}




function ftp_file_upload_SEND_REQUEST($binary, $api_method){

	// Construction de l'URL
	$arr_url = parse_url(getenv('API_URL')) ;
	if ($arr_url["port"]){
		$str = ":".$arr_url["port"] ;
	} else $str = "" ;
	$auth_url = $arr_url['scheme'].'://'.urlencode(getenv('API_DOMAIN')).':'.urlencode(getenv('API_APIKEY')).'@'.$arr_url['host'].$str.'/'.$arr_url['path'].'/'.$api_method ;
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
