<?php
//ob_start() ;
$app_root='..' ;
$server_root='.' ;

include("$server_root/include/config.inc.php");
include("$server_root/include/toolfunctions.inc.php");

include("$server_root/modules/media/include/media.inc.php");

include("$server_root/modules/spec_rsi_recouveo/backend_spec_rsi_recouveo.inc.php");

//include("$server_root/login.inc.php") ;

if( !isset($_SERVER['PHP_AUTH_USER']) ) {
	header('WWW-Authenticate: Basic realm="Recouveo API"');
	header('HTTP/1.0 401 Unauthorized');
	exit;
}

include( "$server_root/include/database/mysql_DB.inc.php" ) ;
$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, 'op5_veo_prod', $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;

$my_sdomain = 'caloon' ;
$_opDB->select_db( 'op5_veo_prod'.'_'.$my_sdomain) ;

$query = "SELECT COUNT(*) FROM view_file_Z_APIKEYS WHERE field_APIKEY_CODE = '{$_SERVER['PHP_AUTH_USER']}' AND field_APIKEY_HEX = '{$_SERVER['PHP_AUTH_PW']}'" ;
$result = $_opDB->query($query) ;
$row = $_opDB->fetch_row($result) ;

if ($row[0] == 0){

	header('WWW-Authenticate: Basic realm="Recouveo API"');
	header('HTTP/1.0 403 Forbidden');

	exit;
}

//$TAB = backend_specific( $_POST ) ;
switch ($_SERVER['PATH_INFO']){
	case '/account':
		$validation_response = specRsiRecouveo_lib_edi_validate_json('account', file_get_contents("php://input")) ;
		$array_response = json_decode($validation_response, true) ;
		if($array_response["success"]){
			$json_response = pecRsiRecouveo_lib_edi_post_account($array_response["data"]) ;
		}
		break ;
	case '/account_adrbookentry':
		$validation_response = specRsiRecouveo_lib_edi_validate_json('adrbook', file_get_contents("php://input")) ;
		$array_response = json_decode($validation_response, true) ;
		if($array_response["success"]){
			$json_response = specRsiRecouveo_lib_edi_post_adrbook($array_response["data"]) ;
			//echo "done" ;
		}
		break ;
	case '/record':
		$validation_response = specRsiRecouveo_lib_edi_validate_json('record', file_get_contents("php://input")) ;
		$array_response = json_decode($validation_response, true) ;
		if ($array_response["success"]){
			$json_response = specRsiRecouveo_lib_edi_post_record($array_response["data"]) ;
		}
		break ;
	default:
		echo file_get_contents("php://input");
		$json_response = json_encode(array("success" => false, "logs" => "Mauvais url")) ;
 		break ;
}

$response = json_decode($json_response, true) ;

if ($response["success"]){
	// Execution du robot
	//echo "ok" ;
	specRsiRecouveo_lib_edi_insertLogs(json_encode(array("keyName" => $_SERVER['PHP_AUTH_USER'], "method" => "POST", "data" => $response))) ;
	specRsiRecouveo_lib_autorun_open() ;
	specRsiRecouveo_lib_autorun_manageDisabled() ;
	specRsiRecouveo_lib_autorun_adrbook() ;
	return json_encode(array("success" => true, "logs" => $response["logs"])) ;
}
else{
	echo "pas ok" ;
	return json_encode(array("success" => false, "logs" => $response["logs"])) ;
}
