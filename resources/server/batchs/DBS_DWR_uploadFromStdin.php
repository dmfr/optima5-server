<?php

/*
Example usage :

time \
PHP_AUTH_USER="admin@dbs" \
PHP_AUTH_PW="password" \
php resources/server/batchs/DBS_DWR_test191023.php SLS_LX03_UPL@dwr < ~/tmp/SLS_LX03_UPLAUTO.csv

*/


$ttmp = explode('@',$argv[1]) ;
if( count($ttmp) != 2 ) {
	die() ;
}
$target_sdomain = $ttmp[1] ;
$target_tablecode = $ttmp[0] ;


$URL = "http://127.0.0.1/paracrm.master/server/report.xml.php" ;
$POST_PARAMS = array(
'PHP_AUTH_USER' => getenv('PHP_AUTH_USER'),
'PHP_AUTH_PW'   => getenv('PHP_AUTH_PW'),
'_moduleId'     => 'crmbase',
'_sdomainId'    => $target_sdomain,
'_action'       => 'data_importDirect',
'data_type'     => 'table',
'table_code'    => $target_tablecode,
'do_preprocess' => '1',
'csvsrc_binary' => file_get_contents("php://stdin")
) ;

// do http post
$params = array(
	'http' => array(
		'method' => 'POST',
		'content' => http_build_query($POST_PARAMS),
		'timeout' => 300
	)
);
$ctx = stream_context_create($params);
$fp = @fopen($URL, 'rb', false, $ctx);
echo 'debug'.' : '.$http_response_header[0]."\n" ;



?>
