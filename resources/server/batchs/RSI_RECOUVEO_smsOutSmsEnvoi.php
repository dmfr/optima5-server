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

$_URL = 'http://www.smsenvoi.com/httpapi/sendsms/' ;
$_email = 'damien.mirand@recouveo-si.com' ;
$_smsapiKey = 'AE8M29NN33WNN4RNZHA6' ;
$_label = 'RECOUVEO' ;
$_subType = 'STANDARD' ;

if( $GLOBALS['__OPTIMA_TEST'] ) {
	return ;
}

specRsiRecouveo_lib_sms_sendSmsEnvoi($_URL, $_email, $_smsapiKey, $_label, $_subType);
