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

include("$server_root/modules/spec_rsi_recouveo/backend_spec_rsi_recouveo.inc.php");



$cfg_risk = array(
	'risk_on' => '1',
	'risk_provider' => 'ES',
	'risk_es_gatewayUrl' => 'https://services.data-access-gateway.com/1/rest',
	'risk_es_contractId' => '45506',
	'risk_es_userPrefix' => 'GEOCOM',
	'risk_es_userId' => 'NN413267',
	'risk_es_password' => 'RG4TFAJ6FF2S'
);

$json = specRsiRecouveo_config_loadMeta(array()) ;
$config_meta = $json['data'] ;
$config_meta = $cfg_risk + $config_meta ;
specRsiRecouveo_config_saveMeta( array(
	'data' => json_encode($config_meta)
) );



?>
