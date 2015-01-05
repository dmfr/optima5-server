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



if( $GLOBALS['__OPTIMA_TEST'] && !getenv('OPTIMA_TEST_EMAIL') ) {
	fwrite(STDERR, "OPTIMA test mode : Should specify OPTIMA_TEST_EMAIL\n");
	exit ;
} else {
	$GLOBALS['__OPTIMA_TEST_EMAIL'] = getenv('OPTIMA_TEST_EMAIL') ;
}



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



function mailFactory( $recipients, $subject, $body ) {
	//$email_text = "{$body}\r\n\r\n\r\nDo not respond directly to this message.\r\n\r\nMrFoxy access:\r\nhttp://mrfoxy.eu\r\n\r\nShould you have any question or need login ID,\r\nplease contact mrfoxy@wonderfulbrands.com\r\n\r\n" ;
	
	if( $GLOBALS['__OPTIMA_TEST'] ) {
		$recipients = array($GLOBALS['__OPTIMA_TEST_EMAIL']) ;
	}
	
	$email = new Email() ;
	$email->set_From( 'noreply@wonderfulbrands.com', "Mr Foxy, Promotion Tool" ) ;
	foreach( $recipients as $to_email ) {
		$email->add_Recipient( $to_email ) ;
	}
	$email->set_Subject( $subject ) ;
	$email->set_HTML_body( $body ) ;
	$email->send() ;
}
function getHtmlBody_getInnerTable( $rows ) {
	$src = '' ;
	$src.= '<table>' ;
	foreach( $rows as $row ) {
		if( $row===NULL ) {
			$src.= "<tr><td height='5'/></tr>" ;
			continue ;
		}
		$src.= "\r\n" ;
		$src.= "<tr>" ;
			$src.= "<td align='right'>{$row[0]}</td>" ;
			$src.= "<td>&nbsp;&nbsp;</td>" ;
			$src.= "<td align='left'><b>{$row[1]}</b></td>" ;
		$src.= "</tr>" ;
	}
	$src.= '</table>' ;
	return $src ;
}
function getHtmlBody( $promo_row, $body_text ) {
	$templates_dir = $GLOBALS['templates_dir'] ;
	
	$header_src = "\r\n" ;
	$header_src.= "<table><tr>" ;
		$logo_base64 = base64_encode( file_get_contents($templates_dir.'/'.'WB_MRFOXY_email_logo.png') ) ;
		$header_src.= "<td width='128' align='center'>" ;
		$header_src.= "<img src=\"data:image/png;base64,$logo_base64\"/>" ;
		$header_src.= "</td>" ;
		
		$header_src.= "<td>" ;
		$header_src.= "\r\n<span class='text-small' style='color:#000000;'><b><i>".'Mr Foxy email notice for :'."</i></b></span><br>" ;
		$header_src.= "\r\n<span class='text-mid' style='color:#550000; padding:0px 10px;'><b>".$promo_row['promo_id']."</b></span><br>" ;
		$header_src.= "</td>" ;
	$header_src.= "</tr></table>" ;
	
	
	$desc_src = "\r\n" ;
	$desc_src.= '<table>' ;
	$desc_src.= '<tr>' ;
	$desc_src.= '<td>' ;
		$desc_rows = array() ;
		$desc_rows[] = array('Supply starts',date('d/m/Y', strtotime($promo_row['date_supply_start']))) ;
		$desc_rows[] = array('ends',date('d/m/Y', strtotime($promo_row['date_supply_end']))) ;
		$desc_rows[] = NULL ;
		$desc_rows[] = array('In-store starts',date('d/m/Y', strtotime($promo_row['date_start']))) ;
		$desc_rows[] = array('ends',date('d/m/Y', strtotime($promo_row['date_end']))) ;
		$desc_rows[] = array('length',$promo_row['date_length_weeks']." week(s)") ;
		$desc_rows[] = NULL ;
		$desc_rows[] = NULL ;
		$desc_rows[] = array('Billing',$promo_row['cost_billing_text']) ;
		$desc_rows[] = array('Cost(Estimate)',(float)$promo_row['cost_forecast']." ".$promo_row['currency']) ;
		$desc_src.= getHtmlBody_getInnerTable( $desc_rows ) ;
	$desc_src.= "</td>" ;
	$desc_src.= "<td>&nbsp;&nbsp;</td>" ;
	$desc_src.= "<td>" ;
		$desc_rows = array() ;
		$desc_rows[] = array('Mechanics',$promo_row['mechanics_text']) ;
		$desc_rows[] = NULL ;
		$desc_rows[] = array('Products',$promo_row['prod_text']) ;
		$desc_rows[] = array('Product Line',specWbMrfoxy_tool_getProdLine($promo_row['prod_code'])) ;
		$desc_rows[] = NULL ;
		$desc_rows[] = array('Stores',$promo_row['store_text']) ;
		$desc_rows[] = array('Store Brand',specWbMrfoxy_tool_getStoreBrand($promo_row['store_code'])) ;
		$desc_src.= getHtmlBody_getInnerTable( $desc_rows ) ;
	$desc_src.= "</td>" ;
	$desc_src.= "</tr>" ;
	if( trim($promo_row['obs_comment']) != '' ) {
		$obs_comment = '' ;
		foreach( preg_split('/$\R?^/m', $promo_row['obs_comment']) as $line ) {
			$obs_comment.= $line."<br>" ;
		}
		
		
		$desc_src.= '<tr><td colspan="3">' ;
			$desc_rows = array() ;
			$desc_rows[] = array('Comments',trim($obs_comment)) ;
			$desc_src.= getHtmlBody_getInnerTable( $desc_rows ) ;
		$desc_src.= "</td></tr>" ;
	}
	$desc_src.= "</table>" ;
	
	
	$text_src = "\r\n" ;
	$text_src.= '<div class="text-xsmall">' ;
	foreach( preg_split('/$\R?^/m', $body_text) as $line ) {
		$text_src.= "\r\n".$line."<br>" ;
	}
	$text_src.= '</div>' ;
	
	
	$footer_src = "\r\n" ;
	$footer_src.= '<div class="text-xxsmall">' ;
		$footer_src.= 'Do not respond directly to this message.<br>';
		$footer_src.= 'MrFoxy access : <a href="http://mrfoxy.eu">http://mrfoxy.eu</a><br>';
		$footer_src.= 'Should you have any question or need login ID, please contact <b>mrfoxy@wonderfulbrands.com</b><br>';
	$footer_src.= '</div>' ;
	
	
	$body_src = "\r\n" ;
	$body_src.= '<div>' ;
		$body_src.= $header_src ;
		$body_src.= "<hr>" ;
		$body_src.= $text_src ;
		$body_src.= $desc_src ;
		$body_src.= "<hr>" ;
		$body_src.= $footer_src ;
	$body_src.= "</div>" ;
	
	
	$template_resource_binary = file_get_contents($templates_dir.'/'.'WB_MRFOXY_email_template.html') ;
	$doc = new DOMDocument();
	@$doc->loadHTML($template_resource_binary);
	$elements = $doc->getElementsByTagName('email-body');
	$i = $elements->length - 1;
	while ($i > -1) {
		$node_emailBody = $elements->item($i);
		$i--;
		
		$dom_div = new DOMDocument();
		$dom_div->loadHTML( '<?xml encoding="UTF-8"><html>'.$body_src.'</html>' ) ;
		$node_div = $dom_div->getElementsByTagName("div")->item(0);
		
		$node_div = $doc->importNode($node_div,true) ;
		
		$node_emailBody->parentNode->replaceChild($node_div,$node_emailBody) ;
	}
	return $doc->saveHTML() ;
}
function sendHtmlEmail( $recipients, $promo_row, $subject_text, $body_text ) {
	mailFactory( $recipients, $subject_text, getHtmlBody($promo_row,$body_text) ) ;
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
	
	$subject = 'Validation request'.', # '.$row['promo_id'] ;
	
	$body = '' ;
	$body.= "Dear Sales Director,\r\n" ;
	$body.= "A new promotion has been encoded.\r\n" ;
	$body.= "Please connect to mr foxy for validation.\r\n" ;
	$body.= "\r\n" ;
	
	sendHtmlEmail( $recipients, $row, $subject, $body ) ;
}
function handleStatusValidation( $row ) {
	if( in_array($row['status_code'],array('20_WAITVALID','25_APPROVED')) ) {} else return ;
	
	if( $row['approv_ds'] && $row['approv_df'] ) {} else return ;
	
	// Adv status
	$filerecord_id = $row['_filerecord_id'] ;
	$arr_update = array() ;
	if( $row['approv_ds_ok'] && $row['approv_df_ok'] ) {
		$arr_update['field_STATUS'] = ( $row['cost_billing__csHold'] ? '25_APPROVED' : '30_SCHED' ) ;
		$arr_update['field_SYSDATE_OPEN'] = date('Y-m-d') ;
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
		
		$subject = "Promotion {$txt}".', # '.$row['promo_id'] ;
		
		$body = '' ;
		$body.= "Dear Sales Manager,\r\n" ;
		$body.= "The promotion # {$row['promo_id']} has been {$txt}.\r\n" ;
		$body.= "\r\n" ;
		if( $row['approv_ds_obs'] ) {
			$body.= "DS statement : {$row['approv_ds_obs']}\r\n" ;
		}
		if( $row['approv_df_obs'] ) {
			$body.= "DF statement : {$row['approv_df_obs']}\r\n" ;
		}
		$body.= "\r\n" ;
		
		sendHtmlEmail( $recipients, $row, $subject, $body ) ;
	}
	
	if( $row['cost_billing__csHold'] ) {
		$recipients = findRecipients($row['country_code'], array('CS')) ;
		
		$subject = '# '.$row['promo_id'].' : Acknowledgment request' ;
		
		$body = '' ;
		$body.= "Dear Customer service,\r\n" ;
		$body.= "The sales director has validated promotion # {$row['promo_id']}\r\n" ;
		$body.= "Please connect to Mr Foxy to indicate that it has been treated.\r\n" ;
		$body.= "\r\n" ;
		
		sendHtmlEmail( $recipients, $row, $subject, $body ) ;
	}
}
function handleStatusAppro( $row ) {
	if( in_array($row['status_code'],array('30_SCHED')) ) {} else return ;

	if( time() >= strtotime($row['date_supply_start']) ) {} else return ;
	
	// Adv status
	$filerecord_id = $row['_filerecord_id'] ;
	$arr_update = array() ;
	$arr_update['field_STATUS'] = '40_APPRO' ;
	paracrm_lib_data_updateRecord_file( 'WORK_PROMO' , $arr_update, $filerecord_id ) ;
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
	
	$subject = 'Promo begins'.', # '.$row['promo_id'] ;
	
	$body = '' ;
	$body.= "Notification : Promotion # {$row['promo_id']} has begun.\r\n" ;
	$body.= "\r\n" ;
	
	sendHtmlEmail( $recipients, $row, $subject, $body ) ;
}
function handleStatusEnd( $row ) {
	if( in_array($row['status_code'],array('50_CURRENT')) ) {} else return ;

	if( time() > strtotime($row['date_end']) ) {} else return ;
	
	// Adv status
	$filerecord_id = $row['_filerecord_id'] ;
	$arr_update = array() ;
	$arr_update['field_STATUS'] = '60_DONE' ;
	paracrm_lib_data_updateRecord_file( 'WORK_PROMO' , $arr_update, $filerecord_id ) ;
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
	$arr_update['field_SYSDATE_CLOSED'] = date('Y-m-d') ;
	paracrm_lib_data_updateRecord_file( 'WORK_PROMO' , $arr_update, $filerecord_id ) ;
	
	$recipients = findRecipients($row['country_code'], array('TM','SM','DS')) ;
	
	$subject = 'Analysis available'.', # '.$row['promo_id'] ;
	
	$body = '' ;
	$body.= "Dear user,\r\n" ;
	$body.= "The analysis and feedback for promotion # {$row['promo_id']} is available.\r\n" ;
	$body.= "\r\n" ;
	
	sendHtmlEmail( $recipients, $row, $subject, $body ) ;
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
	handleStatusAppro( $row ) ;
	handleStatusBegin( $row ) ;
	handleStatusEnd( $row ) ;
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