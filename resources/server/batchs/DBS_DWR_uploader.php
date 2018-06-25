<?php

$URL = "http://10.206.180.82/paracrm/server/report.xml.php" ;

$PARAMS_BASE = array(
'PHP_AUTH_USER' => 'uploader@dbs',
'PHP_AUTH_PW'   => 'uploadtest',
'_moduleId'     => 'crmbase',
'_sdomainId'    => 'dwr',
'_action'       => 'data_importDirect',
'data_type'     => 'table',
'table_code'    => '',
'do_preprocess' => '1',
'csvsrc_binary' => NULL
) ;

$MAP_PREFIX_TO_TABLECODE = array(
'ZCSSTOCK_DCD' => 'SLS_LX03_UPL',
'SLS_ZCS_TRANSFER' => 'SLS_ZCS_TRANSFER_UPL',
'SLS_ZDELIVERY_WH' => 'SLS_ZDELIVERY_WH_UPL'
);



function print_usage() {
	$str = <<<EOF

NOTE : Env OPTIMA_DWR_IN must be set and must exists
       {OPTIMA_DWR_IN}/history must exists

EOF;

	die($str) ;
}

$ts_exec = time();


$in_dir = getenv('OPTIMA_DWR_IN') ;
if( !$in_dir || !is_dir($in_dir) ) {
	print_usage() ;
	die() ;
}
$arch_dir = $in_dir.'/'.'history' ;
if( !is_dir($arch_dir) ) {
	print_usage() ;
	die() ;
}


foreach( scandir($in_dir) as $filename ) {
	$filepath = $in_dir.'/'.$filename ;
	$archpath = $arch_dir.'/'.$ts_exec.'.'.$filename ;
	if( !is_file($filepath) ) {
		continue ;
	}
	$target_table_code = NULL ;
	foreach( $MAP_PREFIX_TO_TABLECODE as $prefix => $table_code ) {
		if( !(strpos($filename,$prefix)===FALSE) ) {
			$target_table_code = $table_code ;
			break ;
		}
	}
	if( !$target_table_code ) {
		// TODO : move to ERR
		continue ;
	}
	
	$post_params = $PARAMS_BASE ;
	$post_params['table_code'] = $target_table_code ;
	$post_params['csvsrc_binary'] = file_get_contents($filepath) ;
	
	// do http post
	$data = http_build_query($post_params) ;
	$params = array('http' => array(
					'method' => 'POST',
					'content' => $data,
					'timeout' => 300
					));
	$ctx = stream_context_create($params);
	$fp = @fopen($URL, 'rb', false, $ctx);
	echo $filepath.' : '.$http_response_header[0]."\n" ;
	
	// move to history
	rename( $filepath, $archpath ) ;
}

?>
