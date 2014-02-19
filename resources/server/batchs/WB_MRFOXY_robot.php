<?php
session_start() ;

$app_root = dirname($_SERVER['SCRIPT_NAME']).'/../../..' ;
$server_root=$app_root.'/server' ;
$resources_root=$app_root.'/resources' ;
$templates_dir=$resources_root.'/server/templates' ;

@include_once 'PHPExcel/PHPExcel.php' ;
@include_once 'Mail.php' ;
@include_once 'Mail/mime.php' ;

include("$server_root/include/config.inc.php");
include("$server_root/include/toolfunctions.inc.php");
include("$server_root/modules/media/include/media.inc.php");

include( "$server_root/include/database/mysql_DB.inc.php" ) ;
$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, $mysql_db, $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;

include("$server_root/modules/spec_wb_mrfoxy/backend_spec_wb_mrfoxy.inc.php");



$ttmp = specWbMrfoxy_auth_getTable(array()) ;
$authTable = $ttmp['data'] ;
function findRecipients( $country_code, $arr_roleCode ) {
	global $_opDB ;
	global $authTable ;
	
	$arr_userId = array() ;
	foreach( $authTable as $str ) {
		$ttmp = explode('@',$str) ;
		if( $ttmp[1] == $country_code && in_array($ttmp[2],$arr_roleCode) ) {
			$arr_userId[] = $ttmp[0] ;
		}
	}
	
	$arr_recipients = array() ;
	foreach( $arr_userId as $userId ) {
		$query = "SELECT field_USER_EMAIL FROM view_bible_USER_entry WHERE entry_key='{$userId}'" ;
		$arr_recipients[] = $_opDB->query_uniqueValue($query) ;
	}
	return $arr_recipients ;
}


function getPromoDesc( $row, $include_finance=FALSE ) {
	global $_opDB ;
	
	$txt = '' ;
	$txt.= "Promotion # : ".$row['promo_id']."\r\n" ;
	$txt.= "\r\n" ;
	$txt.= " Start date : ".date('d/m/Y', strtotime($row['date_start']))."\r\n" ;
	$txt.= "  -   ends  : ".date('d/m/Y', strtotime($row['date_end']))."\r\n" ;
	$txt.= "  - length  : ".$row['date_length_weeks']." week(s)\r\n" ;
	$txt.= "\r\n" ;
	$txt.= " Mechanics  : ".$row['mechanics_text']."\r\n" ;
	$txt.= "\r\n" ;
	$txt.= " Products   : ".$row['prod_text']."\r\n" ;
	$txt.= " Prod. Line : ".specWbMrfoxy_tool_getProdLine($row['prod_code'])."\r\n" ;
	$txt.= "\r\n" ;
	$txt.= " Stores     : ".$row['store_text']."\r\n" ;
	$txt.= " StoreBrand : ".specWbMrfoxy_tool_getStoreBrand($row['store_code'])."\r\n" ;
	if( $include_finance ) {
		$txt.= "\r\n" ;
		$txt.= " Cost(Estm) : ".$row['cost_forecast']." ".$row['cost_currency']."\r\n" ;
	}
	$txt.= "\r\n" ;
	$obs_comment = '' ;
	foreach( preg_split('/$\R?^/m', $row['obs_comment']) as $line ) {
		$obs_comment.= $line."\r\n              " ;
	}
	$txt.= " Comments   : ".trim($obs_comment)."\r\n" ;
	
	return $txt ;
}

function mailFactory( $recipients, $subject, $body ) {
	$headers['From'] = '"Mr Foxy, Promotion Tool" <noreply@wonderfulbrands.com>' ;
	$headers['To'] = implode(',',$recipients) ;
	$headers['Subject'] = '[MrFoxy] '.$subject ;
	$mime = new Mail_mime("\r\n");
	
	$email_text = "Hi,\r\nThis is an automated email from Mr.Foxy\r\n{$body}\r\n\r\n\r\nDo not respond directly to this message.\r\n\r\nMrFoxy access:\r\nhttp://paracrm.kn-abbeville.fr\r\n\r\nShould you have any question or need login ID,\r\nplease contact mrfoxy@wonderfulbrands.com\r\n\r\n" ;
	
	$mime->setTXTBody($email_text);
	$mimeparams=array();
	$mimeparams['text_encoding']="8bit";
	$mimeparams['text_charset']="UTF-8";
	$mimeparams['html_charset']="UTF-8"; 
	$mimeparams['head_charset']="UTF-8"; 
	$body = $mime->get($mimeparams);
	$headers = $mime->headers($headers);
	$mail_obj =& Mail::factory('smtp', array('host' => '127.0.0.1', 'port' => 25));
	$mail_obj->send($recipients, $headers, $body) ;
}


function handleStatusNew( $row ) {
	if( in_array($row['status_code'],array('10_ENCODED')) ) {} else return ;
	
	// Adv status
	$filerecord_id = $row['_filerecord_id'] ;
	$arr_update = array() ;
	$arr_update['field_STATUS'] = '20_WAITVALID' ;
	paracrm_lib_data_updateRecord_file( 'WORK_PROMO' , $arr_update, $filerecord_id ) ;
	
	$recipients = findRecipients($row['country_code'], array('PM','DM','DF')) ;
	
	$subject = '# '.$row['promo_id'].' : Validation required' ;
	
	$body.= "Action required : Approval from Finance & Marketing directors\r\n" ;
	$body.= "\r\n" ;
	$body.= "Find below details of encoded promotion:\r\n" ;
	$body.= "\r\n" ;
	$body.= getPromoDesc($row) ;
	
	mailFactory( $recipients, $subject, $body ) ;
}
function handleStatusValidation( $row ) {
	if( in_array($row['status_code'],array('20_WAITVALID')) ) {} else return ;
	
	if( $row['approv_dm'] && $row['approv_df'] ) {} else return ;
	
	// Adv status
	$filerecord_id = $row['_filerecord_id'] ;
	$arr_update = array() ;
	$arr_update['field_STATUS'] = '40_SCHED' ;
	paracrm_lib_data_updateRecord_file( 'WORK_PROMO' , $arr_update, $filerecord_id ) ;
	
	$recipients = findRecipients($row['country_code'], array('CS','PM')) ;
	
	$subject = '# '.$row['promo_id'].' : Scheduled' ;
	
	$body.= "Notification : Promotion # {$row['promo_id']} approved\r\n" ;
	$body.= "\r\n" ;
	$body.= "Find below details of scheduled promotion:\r\n" ;
	$body.= "\r\n" ;
	$body.= getPromoDesc($row) ;
	
	mailFactory( $recipients, $subject, $body ) ;
}
function handleStatusBegin( $row ) {
	if( in_array($row['status_code'],array('40_SCHED')) ) {} else return ;

	if( time() >= strtotime($row['date_start']) ) {} else return ;
	
	// Adv status
	$filerecord_id = $row['_filerecord_id'] ;
	$arr_update = array() ;
	$arr_update['field_STATUS'] = '50_CURRENT' ;
	paracrm_lib_data_updateRecord_file( 'WORK_PROMO' , $arr_update, $filerecord_id ) ;
	
	$recipients = findRecipients($row['country_code'], array('CS','PM')) ;
	
	$subject = '# '.$row['promo_id'].' : Active' ;
	
	$body.= "Notification : Promotion # {$row['promo_id']} begins\r\n" ;
	$body.= "\r\n" ;
	$body.= "Find below details of current promotion:\r\n" ;
	$body.= "\r\n" ;
	$body.= getPromoDesc($row) ;
	
	mailFactory( $recipients, $subject, $body ) ;
}
function handleStatusEnd( $row ) {
	if( in_array($row['status_code'],array('50_CURRENT')) ) {} else return ;

	if( time() > strtotime($row['date_end']) ) {} else return ;
	
	// Adv status
	$filerecord_id = $row['_filerecord_id'] ;
	$arr_update = array() ;
	$arr_update['field_STATUS'] = '60_DONE' ;
	paracrm_lib_data_updateRecord_file( 'WORK_PROMO' , $arr_update, $filerecord_id ) ;
	
	$recipients = findRecipients($row['country_code'], array('CS','PM')) ;
	
	$subject = '# '.$row['promo_id'].' : Finished' ;
	
	$body.= "Notification : Promotion # {$row['promo_id']} has finished\r\n" ;
	$body.= "\r\n" ;
	$body.= "Find below details of current promotion:\r\n" ;
	$body.= "\r\n" ;
	$body.= getPromoDesc($row) ;
	
	mailFactory( $recipients, $subject, $body ) ;
}
function handleStatusData( $row ) {
	global $_opDB ;
	
	switch( $row['status_code'] ) {
		case '60_DONE' :
			$has_ORACLE = FALSE ;
			$has_IRI = FALSE ;
			break ;
		case '70_IRI' :
			$has_ORACLE = FALSE ;
			break ;
		case '70_ORACLE' :
			$has_IRI = FALSE ;
			break ;
		default :
			return ;
	}
	
	if( $has_ORACLE === FALSE ) {
		$time_bound = strtotime('+2 week',strtotime($row['date_end'])) ;
		
		$query = "SELECT max(field_DATE) from view_file_ORACLE_SHIP" ;
		$date_cmp = $_opDB->query_uniqueValue($query) ;
		$time_cmp = strtotime($date_cmp) ;
		
		if( $time_cmp >= $time_bound ) {
			$has_ORACLE = TRUE ;
		}
	} else {
		$has_ORACLE = TRUE ;
	}
	
	if( $has_IRI === FALSE ) {
		$time_bound = strtotime('+2 week',strtotime($row['date_end'])) ;
		
		$query = "SELECT max(field_V_DATE) from view_file_IRI_SALES" ;
		$date_cmp = $_opDB->query_uniqueValue($query) ;
		$time_cmp = strtotime($date_cmp) ;
		
		if( $time_cmp >= $time_bound ) {
			$has_IRI = TRUE ;
		}
	} else {
		$has_IRI = TRUE ;
	}
	
	if( $has_ORACLE == TRUE && $has_IRI == TRUE ) {
		$new_status = '80_DATA_OK' ;
	} elseif( $has_ORACLE == TRUE ) {
		$new_status = '70_ORACLE' ;
	} elseif( $has_IRI == TRUE ) {
		$new_status = '70_IRI' ;
	} else {
		$new_status = '60_DONE' ;
	}
	
	if( $new_status == $row['status_code'] ) {
		return ;
	}
	
	// Adv status
	$filerecord_id = $row['_filerecord_id'] ;
	$arr_update = array() ;
	$arr_update['field_STATUS'] = $new_status ;
	paracrm_lib_data_updateRecord_file( 'WORK_PROMO' , $arr_update, $filerecord_id ) ;
	
	$recipients = findRecipients($row['country_code'], array('PM')) ;
	
	$subject = '# '.$row['promo_id'].' : Data available' ;
	
	$body.= "Notification : Promotion # {$row['promo_id']} analysis data available, ".($new_status=='80_DATA_OK'?'complete':'partial').".\r\n" ;
	$body.= "\r\n" ;
	$body.= "Find below details of current promotion:\r\n" ;
	$body.= "\r\n" ;
	$body.= getPromoDesc($row) ;
	
	mailFactory( $recipients, $subject, $body ) ;
}



$arr_filerecordId = array() ;
$query = "SELECT filerecord_id FROM view_file_WORK_PROMO WHERE field_STATUS<>'99_DONE'" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$arr_filerecordId[] = $arr[0] ;
}

$ttmp = specWbMrfoxy_promo_getGrid( array('filter_id'=>json_encode($arr_filerecordId)) ) ;
foreach( $ttmp['data'] as $row ) {
	handleStatusNew( $row ) ;
	handleStatusValidation( $row ) ;
	handleStatusBegin( $row ) ;
	handleStatusEnd( $row ) ;
	handleStatusData( $row ) ;
}


?>