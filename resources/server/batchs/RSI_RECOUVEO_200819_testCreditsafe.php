<?php
session_start() ;

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


$obj_request = array(
'username' => 'RECOUVEO',
'password' => 'Teteplate13$'
);



		$post_url = 'https://connect.creditsafe.com/v1/authenticate' ;
		$params = array('http' => array(
		'method' => 'POST',
		'content' => json_encode($obj_request),
		'timeout' => 600,
		'ignore_errors' => true,
		//'header'=>"Authorization: {$_token}\r\n"."accept: application/json\r\n"."Content-Type: application/json\r\n"
		'header'=>"accept: application/json\r\n"."Content-Type: application/json\r\n"
		));
		$ctx = stream_context_create($params);
		$fp = fopen($post_url, 'rb', false, $ctx);
		if( !$fp ) {
			
		}
		$status_line = $http_response_header[0] ;
		preg_match('{HTTP\/\S*\s(\d{3})}', $status_line, $match);
		$status = $match[1];

		echo $status_line ;

		//echo  ;
		
		$json = json_decode(stream_get_contents($fp),true) ;
		print_r($json) ;
		
		
		$_token = $json['token'] ;
		
		
		
		
		
		
		
		
		
		$post_url = 'https://connect.creditsafe.com/v1/companies?countries=GB,FR&regNo=77564414900590' ;
		$params = array('http' => array(
		'method' => 'GET',
		//'content' => json_encode($obj_request),
		'timeout' => 600,
		'ignore_errors' => true,
		'header'=>"Authorization: {$_token}\r\n"."accept: application/json\r\n"."Content-Type: application/json\r\n"
		//'header'=>"accept: application/json\r\n"."Content-Type: application/json\r\n"
		));
		$ctx = stream_context_create($params);
		$fp = fopen($post_url, 'rb', false, $ctx);
		if( !$fp ) {
			
		}
		$status_line = $http_response_header[0] ;
		preg_match('{HTTP\/\S*\s(\d{3})}', $status_line, $match);
		$status = $match[1];

		echo $status_line ;

		echo stream_get_contents($fp) ;
		
		
		
		
		
		
		
		
		$post_url = 'https://connect.creditsafe.com/v1/companies/FR-X-77564414900590' ;
		$params = array('http' => array(
		'method' => 'GET',
		//'content' => json_encode($obj_request),
		'timeout' => 600,
		'ignore_errors' => true,
		'header'=>"Authorization: {$_token}\r\n"."accept: application/json\r\n"."Content-Type: application/json\r\n"
		//'header'=>"accept: application/json\r\n"."Content-Type: application/json\r\n"
		));
		$ctx = stream_context_create($params);
		$fp = fopen($post_url, 'rb', false, $ctx);
		if( !$fp ) {
			
		}
		$status_line = $http_response_header[0] ;
		preg_match('{HTTP\/\S*\s(\d{3})}', $status_line, $match);
		$status = $match[1];

		echo $status_line ;

		echo stream_get_contents($fp) ;
		
		
		
		
		
		

?>
