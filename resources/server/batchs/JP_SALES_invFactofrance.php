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

include("$server_root/modules/paracrm/backend_paracrm.inc.php");


include('JP_SALES_invFactofrance_mailFactory.inc.php') ;




// *********** Get CONSTANTES *******************
$GLOBALS['factor_ref'] = date('ymdHis') ;

$GLOBALS['_cfg_peer_code'] = 'INV_FACTOFRANCE' ;

$query = "SELECT field_MAIL_SENDTO, field_PARAMS FROM view_bible_CFG_PEER_entry
	WHERE entry_key='{$GLOBALS['_cfg_peer_code']}'" ;
$result = $_opDB->query($query) ;
if( $_opDB->num_rows($result) != 1 ) {
	die() ;
}
$arr = $_opDB->fetch_row($result) ;

$field_params = $arr[1] ;
$field_sendto = $arr[0] ;

$GLOBALS['arr_mailinglist'] = array() ;
foreach( explode(',',$field_sendto) as $email ) {
	$GLOBALS['arr_mailinglist'][] = trim($email) ;
}

foreach( explode(',',$field_params) as $param ) {
	$ttmp = explode('=',$param) ;
	if( count($ttmp) != 2 ) {
		continue ;
	}
	$mkey = trim($ttmp[0]) ;
	$mval = trim($ttmp[1]) ;
	switch( $mkey ) {
		case 'V' :
			$GLOBALS['factor_vendeur'] = $mval ;
			break ;
		default :
			break ;
	}
}
// *******************************************

if( FALSE ) {
	// ****** Alerte CLIENT=13 / EDI inconnu factor
	$arr_customerEntryKeys = array() ;
	$query = "SELECT entry_key, field_CLI_NAME
		FROM view_bible_CUSTOMER_entry 
		WHERE (field_FACTOR_ID='' OR field_FACTOR_ID IS NULL) AND entry_key REGEXP '^[0-9]+$' AND entry_key IN (
			SELECT distinct field_CLI_LINK FROM view_file_CDE
		)" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$arr_customerEntryKeys[] = $arr[0] ;
	}

	if( $arr_customerEntryKeys ) {
		$email_text = mailBlocage_getBody( $arr_customerEntryKeys ) ;

		$to = array('finance@justepresse.fr','dm@mirabel-sil.com') ;
		if( $GLOBALS['__OPTIMA_TEST'] ) {
			$to = array() ;
			$to[] = 'dm@mirabel-sil.com' ;
		}

		$email = new Email() ;
		$email->set_From( 'finance@justepresse.fr', 'JustePresse Finance' ) ;
		foreach( $to as $to_email ) {
			$email->add_Recipient( $to_email ) ;
		}
		$email->set_Subject( '[JustePresse] '.'Blocage facturation / Clients inconnus factor' ) ;
		$email->set_text_body( $email_text ) ;
		$email->send() ;
	}
}

// ******************************************

$date_now = date('Y-m-d H:i:s') ;
$arr_invFilerecordIds = array() ;

// ************ Chargement INV **************
$query = "SELECT i.filerecord_id, i.field_CLI_LINK, i.field_FACTOR_LINK, i.field_ADR_INVOICE
	FROM view_file_INV i
	INNER JOIN view_bible_CUSTOMER_entry c ON c.entry_key = i.field_CLI_LINK
	LEFT OUTER JOIN view_file_INV_PEER ip ON ip.filerecord_parent_id=i.filerecord_id
		AND ip.field_PEER_CODE='{$GLOBALS['_cfg_peer_code']}'
	WHERE i.field_STATUS_IS_FINAL='1' and (ip.field_SEND_IS_OK IS NULL OR ip.field_SEND_IS_OK<>'1')
	AND ABS(i.field_CALC_AMOUNT_FINAL) > '0'" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$filerecord_id = $arr[0] ;
	$field_CLI_LINK = $arr[1] ;
	$field_FACTOR_LINK = $arr[2] ;
	$field_ADR_INVOICE = $arr[3] ;
	if( $field_FACTOR_LINK != 'FACTOFR' ) {
		$arr_ins = array() ;
		$arr_ins['field_PEER_CODE'] = $GLOBALS['_cfg_peer_code'] ;
		$arr_ins['field_SEND_IS_OK'] = 1 ;
		$arr_ins['field_SEND_REF'] = 'ZERO' ;
		$arr_ins['field_SEND_DATE'] = $date_now ;
		paracrm_lib_data_insertRecord_file( 'INV_PEER' , $filerecord_id , $arr_ins ) ;
		continue ;
	}
	if( !lookup_factorSiret($field_CLI_LINK) ) {
		continue ;
	}
	if( !parseAdr($field_ADR_INVOICE) ) {
		continue ;
	}
	$arr_invFilerecordIds[] = $filerecord_id ;
}
if( !$arr_invFilerecordIds ) {
	exit ;
}
sort($arr_invFilerecordIds) ;

// ************* Constitution de l'envoi ************
$email_text = mail_getBody( $arr_invFilerecordIds ) ;
$binarybuffer_xlsx = mail_getBinary_remiseTxt( $arr_invFilerecordIds ) ;
$to = $arr_mailinglist ;
if( $GLOBALS['__OPTIMA_TEST'] ) {
	$to = array() ;
	$to[] = 'dm@mirabel-sil.com' ;
}

$email = new Email() ;
$email->set_From( 'finance@justepresse.fr', 'JustePresse Finance' ) ;
foreach( $to as $to_email ) {
	$email->add_Recipient( $to_email ) ;
}
$email->set_Subject( '[JustePresse] '.'Remise factures du'.' '.date('d/m/Y').' '.'à'.' '.date('H:i') ) ;
$email->set_text_body( $email_text ) ;
$email->attach_file( "FAA{$GLOBALS['factor_emetteur']}".'_'.$GLOBALS['factor_ref'].'.txt', $binarybuffer_xlsx, 'plain/text' ) ;
$email->send() ;
// ***************************************************



// ****** Update CRM database ********
foreach( $arr_invFilerecordIds as $inv_filerecord_id ) {
	$arr_ins = array() ;
	$arr_ins['field_PEER_CODE'] = $GLOBALS['_cfg_peer_code'] ;
	$arr_ins['field_SEND_IS_OK'] = 1 ;
	$arr_ins['field_SEND_REF'] = $GLOBALS['factor_ref'] ;
	$arr_ins['field_SEND_DATE'] = $date_now ;
	paracrm_lib_data_insertRecord_file( 'INV_PEER' , $inv_filerecord_id , $arr_ins ) ;
}




?>
