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

$_SESSION['login_data']['login_domain'] = 'veo_prod' ;
include("$server_root/modules/spec_rsi_recouveo/backend_spec_rsi_recouveo.inc.php");


$query = "SELECT * FROM view_file_FILE_ACTION where field_LOG_USER = 'OUIAM.EL-HAMDANI@OEH' AND field_LINK_ACTION='EMAIL_OUT' ORDER BY filerecord_id ASC" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
	echo "-------------------------------------------------------------------\n" ;
	print_r($arr) ;
	echo "\n" ;

	$query = "SELECT * FROM view_file_EMAIL WHERE filerecord_id='{$arr['field_LINK_MEDIA_FILEID']}'" ;
	$res = $_opDB->query($query) ;
	$arr_email = $_opDB->fetch_assoc($res) ;
	print_r($arr_email) ;
	echo "\n" ;
	
	$json = specRsiRecouveo_mail_getEmailRecord(array('email_filerecord_id'=>$arr['field_LINK_MEDIA_FILEID'])) ;
	echo $json['data']['body_text'] ;
	echo "\n\n\n\n" ;
}

?>
