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


$query = "SELECT filerecord_id, field_LINK_TPL, field_LINK_MEDIA_FILECODE,field_LINK_MEDIA_FILEID
			FROM view_file_FILE_ACTION
			WHERE field_LINK_MEDIA_FILECODE='EMAIL'" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
	//print_r($arr) ;

	$query = "SELECT * FROM view_file_EMAIL WHERE filerecord_id='{$arr['field_LINK_MEDIA_FILEID']}'" ;
	$res = $_opDB->query($query) ;
	$arr_email = $_opDB->fetch_assoc($res) ;
	//print_r($arr_email) ;
	
	
	$str = '' ;
	switch( $arr_email['field_MBOX'] ) {
		case 'OUTBOX':
			$str.= '<b>A</b>: ' ;
			break ;
		case 'INBOX' :
			$str.= '<b>De</b>: ' ;
			break ;
	}
	$str.= $arr_email['field_EMAIL_PEER_NAME'] ;
	
	if( $arr['field_LINK_TPL']!='' ) {
		$str='' ;
	}
	
	$arr_update = array('field_LINK_TXT'=>$str) ;
	$arr_cond = array('filerecord_id'=>$arr['filerecord_id']) ;
	$_opDB->update('view_file_FILE_ACTION',$arr_update,$arr_cond) ;
}



?>
