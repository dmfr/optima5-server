<?php
@ini_set('max_execution_time',20*60) ;
//ob_start() ;
$app_root='..' ;
$server_root='.' ;

include("$server_root/include/config.inc.php");
include("$server_root/include/toolfunctions.inc.php");

include("$server_root/modules/media/include/media.inc.php");

if( !isset($_SERVER['PHP_AUTH_USER']) ) {
	header('WWW-Authenticate: Basic realm="Recouveo API"');
	header('HTTP/1.0 401 Unauthorized');
	exit;
}

include("$server_root/modules/spec_rsi_recouveo/backend_spec_rsi_recouveo.inc.php");

// connexion anonyme à la base de données
include( "$server_root/include/database/mysql_DB.inc.php" ) ;
$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, '', $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;

// parse S%SD
$ids = explode("@", $_SERVER['PHP_AUTH_USER']) ;
$my_domainId = $ids[1] ;
$my_sdomainId = $ids[0] ;

// *** Check DATABASES to issue 404 if not found ***
$obj_dmgr_base = new DatabaseMgr_Base() ;
$obj_dmgr_sdomain = new DatabaseMgr_Sdomain( $my_domainId ) ;
if( !$obj_dmgr_base->baseDb_exists($my_domainId) || !$obj_dmgr_sdomain->sdomainDb_exists($my_sdomainId) ) {
	header("HTTP/1.0 404 Not Found");
	die() ;
}

// Select DB
$GLOBALS['mysql_db'] = $obj_dmgr_base->getBaseDb($my_domainId) ;
$_opDB->select_db( $obj_dmgr_base->getBaseDb($my_domainId) ) ;
$_opDB->select_db( $obj_dmgr_sdomain->getSdomainDb($my_sdomainId) ) ;

// Fake context for media
$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;
$_SESSION['login_data']['mysql_db'] = 'op5_'.$_domain_id.'_prod' ;
$_SESSION['login_data']['login_domain'] = $_domain_id.'_prod' ;

// Check debug mode
if( TRUE ) {
	$basedb = $obj_dmgr_base->getBaseDb($my_domainId) ;
	$query = "SELECT count(*) FROM {$basedb}.sdomain WHERE sdomain_id='{$my_sdomainId}' AND overwrite_is_locked<>'O'" ;
	if( $_opDB->query_uniqueValue($query) == 1 ) {
			$GLOBALS['__OPTIMA_APIDEV'] = TRUE ;
	}
}


// Check API Key
$query = "SELECT field_APIKEY_CODE FROM view_file_Z_APIKEYS WHERE field_APIKEY_HEX = '{$_SERVER['PHP_AUTH_PW']}'" ;
$result = $_opDB->query($query) ;
if( $_opDB->num_rows($result) < 1 ) {
	header('WWW-Authenticate: Basic realm="Recouveo API"');
	header('HTTP/1.0 403 Forbidden');
	exit;
}
$arr = $_opDB->fetch_row($result) ;
$apikey_code = $arr[0] ;

$path_info = parse_url($_SERVER['PATH_INFO']) ;
$ttmp = explode('/',$path_info['path']) ;
if( count($ttmp) > 2 ) {
	header("HTTP/1.0 404 Not Found");
	die() ;
}
$api_method = $ttmp[1] ;
switch( $api_method ) {
	case 'test' :
		die( json_encode( array('success'=>true) ) );
	case 'account' :
	case 'account_adrbookentry' :
	case 'account_notepadbin' :
	case 'account_txtaction' :
	case 'record' :
	case 'upload_COMPTES':
	case 'upload_FACTURES':
	case 'account_properties':
		break ;
	case 'DEV_purgeall':
		break ;
	default :
		header("HTTP/1.0 404 Not Found");
		die() ;
}

$handle_in = fopen("php://input","rb") ;
$json_return = specRsiRecouveo_lib_edi_post( $apikey_code, $api_method, $handle_in ) ;


// Logging TODO: clean
$file_path = '/var/lib/optima5.API/' ;
$file_name = time().'_'.$my_domainId.'%'.$my_sdomainId.'_'.$api_method.'.json' ;
@file_put_contents( $file_path.'/'.$file_name, $raw_post ) ;

header('Content-type: application/json');
die( json_encode($json_return) ) ;

?>
