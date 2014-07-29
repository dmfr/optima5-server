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

include("$server_root/modules/spec_wb_mrfoxy/backend_spec_wb_mrfoxy.inc.php");



$authTable = specWbMrfoxy_auth_lib_getTable(array()) ;
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
		$query = "SELECT field_USER_EMAIL FROM view_bible__USER_entry WHERE entry_key='{$userId}'" ;
		if( ($email = $_opDB->query_uniqueValue($query)) && !in_array($email,$arr_recipients) ) {
			$arr_recipients[] = $email ;
		}
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
	$email_text = "{$body}\r\n\r\n\r\nDo not respond directly to this message.\r\n\r\nMrFoxy access:\r\nhttp://mrfoxy.eu\r\n\r\nShould you have any question or need login ID,\r\nplease contact mrfoxy@wonderfulbrands.com\r\n\r\n" ;
	
	$email = new Email() ;
	$email->set_From( 'noreply@wonderfulbrands.com', "Mr Foxy, Promotion Tool" ) ;
	foreach( $recipients as $to_email ) {
		$email->add_Recipient( $to_email ) ;
	}
	$email->set_Subject( '[MrFoxy] '.$subject ) ;
	$email->set_text_body( $email_text ) ;
	$email->send() ;
}

function runPromoQbook( $src_filerecordId ) {
	global $_opDB ;
	
	$q_id = '1-promo book' ;
	if( !is_numeric($q_id) ) {
		$query = "SELECT qbook_id FROM qbook WHERE qbook_name LIKE '{$q_id}'";
		$q_id = $_opDB->query_uniqueValue($query) ;
		if( !$q_id ) {
			return false ;
		}
	}
	
	$post_test = array() ;
	$post_test['_action'] = 'queries_qbookTransaction' ;
	$post_test['_subaction'] = 'init' ;
	$post_test['qbook_id'] = $q_id ;
	$json = paracrm_queries_qbookTransaction( $post_test ) ;
	$transaction_id = $json['transaction_id'] ;
	
	$post_test = array() ;
	$post_test['_action'] = 'queries_qbookTransaction' ;
	$post_test['_transaction_id'] = $transaction_id ;
	$post_test['_subaction'] = 'run' ;
	$post_test['qsrc_filerecord_id'] = $src_filerecordId ;
	$json = paracrm_queries_qbookTransaction( $post_test ) ;
	if( !$json['success'] ) {
		unset($_SESSION['transactions'][$transaction_id]) ;
		return false ;
	}
	
	unset($_SESSION['transactions'][$transaction_id]) ;
	return true ;
}


function handleStatusNew( $row ) {
	if( in_array($row['status_code'],array('10_ENCODED')) ) {} else return ;
	
	// Adv status
	$filerecord_id = $row['_filerecord_id'] ;
	$arr_update = array() ;
	$arr_update['field_STATUS'] = '20_WAITVALID' ;
	paracrm_lib_data_updateRecord_file( 'WORK_PROMO' , $arr_update, $filerecord_id ) ;
	
	$recipients = findRecipients($row['country_code'], array('DS','DF')) ;
	
	$subject = '# '.$row['promo_id'].' : Validation request' ;
	
	$body = '' ;
	$body.= "Dear Sales Director,\r\n" ;
	$body.= "A new promotion has been encoded.\r\n" ;
	$body.= "Please connect to mr foxy for validation.\r\n" ;
	$body.= "\r\n" ;
	$body.= "Find below details of encoded promotion:\r\n" ;
	$body.= "\r\n" ;
	$body.= getPromoDesc($row) ;
	
	mailFactory( $recipients, $subject, $body ) ;
}
function handleStatusValidation( $row ) {
	if( in_array($row['status_code'],array('20_WAITVALID','25_APPROVED')) ) {} else return ;
	
	if( $row['approv_ds'] && $row['approv_df'] ) {} else return ;
	
	// Adv status
	$filerecord_id = $row['_filerecord_id'] ;
	$arr_update = array() ;
	if( $row['approv_ds_ok'] && $row['approv_df_ok'] ) {
		$arr_update['field_STATUS'] = ( $row['cost_billing__csHold'] ? '25_APPROVED' : '30_SCHED' ) ;
	} else {
		$arr_update['field_STATUS'] = '00_REJECTED' ;
		$arr_update['field_APPROV_DS'] = 0 ;
		$arr_update['field_APPROV_DS_OK'] = 0 ;
		$arr_update['field_APPROV_DF'] = 0 ;
		$arr_update['field_APPROV_DF_OK'] = 0 ;
	}
	if( $arr_update['field_STATUS'] == $row['status_code'] ) {
		return ;
	}
	paracrm_lib_data_updateRecord_file( 'WORK_PROMO' , $arr_update, $filerecord_id ) ;
	
	
	if( TRUE ) {
		$txt = ( $row['approv_ds_ok'] && $row['approv_df_ok'] ? 'validated' : 'refused' ) ;
		
		$recipients = findRecipients($row['country_code'], array('SM')) ;
		
		$subject = '# '.$row['promo_id'].' : Promotion '.$txt ;
		
		$body = '' ;
		$body.= "Dear Sales Manager,\r\n" ;
		$body.= "The promotion # {$row['promo_id']} has been {$txt}.\r\n" ;
		$body.= "\r\n" ;
		$body.= "DS statement : {$row['approv_ds_obs']}\r\n" ;
		$body.= "DF statement : {$row['approv_df_obs']}\r\n" ;
		$body.= "\r\n" ;
		$body.= "Find below details of promotion:\r\n" ;
		$body.= "\r\n" ;
		$body.= getPromoDesc($row) ;
		
		mailFactory( $recipients, $subject, $body ) ;
	}
	
	if( $row['cost_billing__csHold'] ) {
		$recipients = findRecipients($row['country_code'], array('CS')) ;
		
		$subject = '# '.$row['promo_id'].' : Acknowledgment request' ;
		
		$body = '' ;
		$body.= "Dear Customer service,\r\n" ;
		$body.= "The sales director has validated promotion # {$row['promo_id']}\r\n" ;
		$body.= "Please connect to Mr Foxy to indicate that it has been treated.\r\n" ;
		$body.= "\r\n" ;
		$body.= "Find below details of promotion:\r\n" ;
		$body.= "\r\n" ;
		$body.= getPromoDesc($row) ;
		
		mailFactory( $recipients, $subject, $body ) ;
	}
}
function handleStatusBegin( $row ) {
	if( in_array($row['status_code'],array('30_SCHED','40_APPRO')) ) {} else return ;

	if( time() >= strtotime($row['date_start']) ) {} else return ;
	
	// Adv status
	$filerecord_id = $row['_filerecord_id'] ;
	$arr_update = array() ;
	$arr_update['field_STATUS'] = '50_CURRENT' ;
	paracrm_lib_data_updateRecord_file( 'WORK_PROMO' , $arr_update, $filerecord_id ) ;
	
	$recipients = findRecipients($row['country_code'], array('CS','SM')) ;
	
	$subject = '# '.$row['promo_id'].' : Active' ;
	
	$body = '' ;
	$body.= "Notification : Promotion # {$row['promo_id']} has begun.\r\n" ;
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
		case '80_DATA_OK' :
			break ;
		default :
			return ;
	}
	
	if( $has_ORACLE === FALSE ) {
		$time_bound = strtotime('+2 week',strtotime($row['date_end'])) ;
		
		$query = "SELECT max(field_DATE) from view_file_ORACLE_SALES" ;
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
	
	if( $has_ORACLE == TRUE && ( $has_IRI == TRUE || !$row['country__hasIri'] ) ) {
		$new_status = '80_DATA_OK' ;
		if( $row['cost_billing__autoclose'] ) {
			$new_status = '90_END' ;
		}
	} elseif( $has_ORACLE == TRUE ) {
		$new_status = '70_ORACLE' ;
	} elseif( $has_IRI == TRUE ) {
		$new_status = '70_IRI' ;
	} else {
		$new_status = '60_DONE' ;
	}
	
	// Run promobook !
	runPromoQbook( $row['_filerecord_id'] ) ;
	
	if( $new_status == $row['status_code'] ) {
		return ;
	}
	
	// Adv status
	$filerecord_id = $row['_filerecord_id'] ;
	$arr_update = array() ;
	$arr_update['field_STATUS'] = $new_status ;
	paracrm_lib_data_updateRecord_file( 'WORK_PROMO' , $arr_update, $filerecord_id ) ;
}
function handleStatusClose( $row ) {
	if( in_array($row['status_code'],array('90_END')) ) {} else return ;
	
	// Adv status
	$filerecord_id = $row['_filerecord_id'] ;
	$arr_update = array() ;
	$arr_update['field_STATUS'] = '99_CLOSED' ;
	paracrm_lib_data_updateRecord_file( 'WORK_PROMO' , $arr_update, $filerecord_id ) ;
	
	$recipients = findRecipients($row['country_code'], array('TM','SM','DS')) ;
	
	$subject = '# '.$row['promo_id'].' : Analysis available' ;
	
	$body = '' ;
	$body.= "Dear user,\r\n" ;
	$body.= "The analysis and feedback for promotion # {$row['promo_id']} is available.\r\n" ;
	$body.= "\r\n" ;
	$body.= "Find below details of current promotion:\r\n" ;
	$body.= "\r\n" ;
	$body.= getPromoDesc($row) ;
	
	mailFactory( $recipients, $subject, $body ) ;
}



$arr_filerecordId = array() ;
$query = "SELECT filerecord_id FROM view_file_WORK_PROMO WHERE field_STATUS<>'99_CLOSED'" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$arr_filerecordId[] = $arr[0] ;
}

$ttmp = specWbMrfoxy_promo_getGrid( array('filter_id'=>json_encode($arr_filerecordId)) ) ;
foreach( $ttmp['data'] as $row ) {
	handleStatusNew( $row ) ;
	handleStatusValidation( $row ) ;
	handleStatusBegin( $row ) ;
	handleStatusData( $row ) ;
	handleStatusClose( $row ) ;
}

exit ;

// HACK !! Calc all
$query = "SELECT filerecord_id FROM view_file_WORK_PROMO" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	runPromoQbook( $arr[0] ) ;
}

?>