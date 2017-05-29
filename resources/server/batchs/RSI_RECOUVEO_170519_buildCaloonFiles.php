<?php
$app_root = dirname($_SERVER['SCRIPT_NAME']).'/../../..' ;
$server_root=$app_root.'/server' ;
$resources_root=$app_root.'/resources' ;
$templates_dir=$resources_root.'/server/templates' ;

include("$server_root/include/config.inc.php");
include("$server_root/include/toolfunctions.inc.php");
include("$server_root/modules/media/include/media.inc.php");

include( "$server_root/include/database/mysql_DB.inc.php" ) ;
$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, $mysql_db, $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;

exit ;

include("$server_root/modules/spec_rsi_recouveo/backend_spec_rsi_recouveo.inc.php");

$codes = array() ;
$codes['2040'] = array('LITIG_START','LITIG_ADV') ;
$codes['2060'] = array('LITIG_START','LITIG_COMPTA') ;
$codes['5092'] = array('LITIG_START','AVOCAT') ;
$codes['5086'] = array('LITIG_START','APPJ') ;
$codes['5093'] = array('LITIG_START','QLEGAL') ;
$codes['2030'] = array('LITIG_START','LITIG_ADV') ;
$codes['4020'] = array('CLOSE_ASK','IRREC_NPAI_NOGO') ;
$codes['5013'] = array('LITIG_START','RECHERCHE') ;


$query = "SELECT filerecord_id, field_LINK_ACCOUNT FROM view_file_FILE where field_STATUS='S1_OPEN'" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$file_filerecord_id = $arr[0] ;
	$acc_id = $arr[1] ;
	$query = "SELECT filerecord_id, field_TXT, field_DATE_SCHED FROM view_file_FILE_ACTION where filerecord_parent_id='{$arr[0]}' ORDER BY filerecord_id DESC LIMIT 1" ;
	$res2 = $_opDB->query($query) ;
	$arr2 = $_opDB->fetch_assoc($res2) ;
	//print_r($arr2) ;
	
	$pos = strpos($arr2['field_TXT'],"\nLibellé: ") ;
	if( $pos !== FALSE ) {
		$txt = substr($arr2['field_TXT'],$pos+strlen("\nLibellé: ")) ;
		$ttmp = explode(" ",$txt,2) ;
		
		
		$code = $ttmp[0] ;
		if( !$codes[$code] ) {
			continue ;
		}
		
		$records_id = array() ;
		$query = "SELECT r.filerecord_id FROM view_file_RECORD r
				JOIN view_file_RECORD_LINK rl ON rl.field_LINK_FILE_ID='{$file_filerecord_id}' AND rl.filerecord_parent_id=r.filerecord_id AND rl.field_LINK_IS_ON='1'" ;
		$res3 = $_opDB->query($query) ;
		while( ($arr=$_opDB->fetch_row($res3)) != FALSE ) {
			$records_id[] = $arr[0] ;
		}
		//print_r($records_id) ;
		
		$post_data = array() ;
		$post_data['acc_id'] = $acc_id ;
		$post_data['arr_recordIds'] = json_encode($records_id,true) ;
		$post_data['new_action_code'] = $codes[$code][0] ;
		switch( $post_data['new_action_code'] ) {
			case 'LITIG_START' :
				$post_data['form_data'] = json_encode(array('litig_code'=>$codes[$code][1],'litig_txt'=>$arr2['field_TXT'],'litig_nextdate'=>$arr2['field_DATE_SCHED'])) ;
				break ;
			case 'CLOSE_ASK' :
				$post_data['form_data'] = json_encode(array('close_code'=>$codes[$code][1],'close_txt'=>$arr2['field_TXT'])) ;
		}
		//print_r($post_data) ;
		specRsiRecouveo_file_createForAction($post_data) ;
	}
}



?>
