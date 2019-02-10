<?php

$api_apikey = getenv("API_APIKEY") ;
$api_domain = getenv("API_DOMAIN") ; // test@veo
$api_path = getenv("API_URL"); 

$handle = fopen('php://stdin','rb') ;
$rows = array() ;
$row = array() ;
while( !feof($handle) ) {
	$arr_csv = fgetcsv($handle) ;
	//print_r($arr_csv) ;
	
	foreach( array('M01','M04') as $soc ) {
		$row['IdSoc'] = $soc ;
		if( $arr_csv[1] ) {
			$row['IdCli'] = trim($arr_csv[1]) ;
		}
		if( $arr_csv[2] || $arr_csv[3] ) {
			$row['Lib'] = array() ;
			if( $arr_csv[3] ) {
				$row['Lib'][] = trim($arr_csv[3]) ; 
			}
			if( $arr_csv[2] ) {
				$row['Lib'][] = trim($arr_csv[2]) ;
			}
			$row['Lib'] = implode(' - ',$row['Lib']) ;
		}
		if( $arr_csv[4] ) {
			$row['AdrConfirm'] = true ;
			$row['AdrType'] = 'TEL' ;
			$row['Adr'] = trim($arr_csv[4]) ;
			$rows[] = $row ;
		}
		if( $arr_csv[5] ) {
			$row['AdrConfirm'] = true ;
			$row['AdrType'] = 'EMAIL' ;
			$row['Adr'] = trim($arr_csv[5]) ;
			$rows[] = $row ;
		}
	}
}
fclose($handle) ;

$json = json_encode($rows,JSON_PRETTY_PRINT) ;

echo $json ;

function ftp_file_upload_SEND_REQUEST($binary, $api_method){

	// Construction de l'URL
	$arr_url = parse_url(getenv('API_URL')) ;
	$auth_url = $arr_url['scheme'].'://'.urlencode(getenv('API_DOMAIN')).':'.urlencode(getenv('API_APIKEY')).'@'.$arr_url['host'].'/'.$arr_url['path'].'/'.$api_method ;

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

ftp_file_upload_SEND_REQUEST($json,'account_adrbookentry') ;




?>
