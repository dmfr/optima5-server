<?php
session_start() ;
$_SESSION['next_transaction_id'] = 1 ;

//ini_set( 'memory_limit', '4096M');
$app_root = dirname($_SERVER['SCRIPT_NAME']).'/../../..' ;
$server_root=$app_root.'/server' ;
$resources_root=$app_root.'/resources' ;
$templates_dir=$resources_root.'/server/templates' ;
//$server_root='.' ;


@include_once 'PHPExcel/PHPExcel.php' ;
@include_once 'Mail.php' ;
@include_once 'Mail/mime.php' ;

//include("$server_root/backend_checksession.inc.php") ;

include("$server_root/include/config.inc.php");

include("$server_root/modules/media/include/media.inc.php");

//@include_once 'PHPExcel/PHPExcel.php' ;
include( "$server_root/include/database/mysql_DB.inc.php" ) ;
$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, $mysql_db, $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;

include("$server_root/modules/paracrm/backend_paracrm.inc.php");



$query = "SELECT * FROM view_file_ANIM where field_ANIM_ISSENT='0'" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {

	$query = "SELECT * FROM view_bible_STORE_entry WHERE entry_key='{$arr['field_ANIM_STORE']}'" ;
	$res = $_opDB->query($query) ;
	$arr_STORE = $_opDB->fetch_assoc($res) ;
	
	$query = "SELECT * FROM view_bible_SALES_entry WHERE entry_key='{$arr['field_ANIM_SALES']}'" ;
	$res = $_opDB->query($query) ;
	$arr_SALES = $_opDB->fetch_assoc($res) ;
	$arr_SALES_parents = array() ;
	$SALES_treenode = $arr_SALES['treenode_key'] ;
	while( TRUE ) {
		$query = "SELECT treenode_parent_key , field_SALESZONEMGR FROM view_bible_SALES_tree WHERE treenode_key='$SALES_treenode'" ;
		$res = $_opDB->query($query) ;
		$arrm = $_opDB->fetch_assoc($res) ;
		if( $arrm == FALSE ) {
			break ;
		}
		$arr_SALES_parents[] = $arrm['field_SALESZONEMGR'] ;
		$SALES_treenode = $arrm['treenode_parent_key'] ;
	}
	
	$query = "SELECT * FROM view_bible_ANIM_TYPE_entry WHERE entry_key='{$arr['field_ANIM_LINK']}'" ;
	$res = $_opDB->query($query) ;
	$arr_TYPE = $_opDB->fetch_assoc($res) ;
	
	$thisanim = array() ;
	
	$thisanim['type'] = $arr['field_ANIM_LINK'] ; 
	$thisanim['type_txt'] = $arr_TYPE['field_ANIM_DESC'] ; 
	
	$thisanim['ens'] = $arr['field_ANIM_STORE'] ;
	$thisanim['ent_ENSEIGNE'] = $arr_STORE['field_STORENAME'] ;
	$thisanim['ent_ENSADR'] = $arr_STORE['field_STOREADR'] ;
	$thisanim['ent_ENSCP'] = $arr_STORE['field_STORECP'] ;
	$thisanim['ent_ENSVILLE'] = $arr_STORE['field_STOREVILLE'] ;
	$thisanim['ent_CRNAME'] = $arr['field_ANIM_CRNAME'] ;
	$thisanim['ent_CRTEL'] = $arr['field_ANIM_CRTEL'] ;
	$thisanim['ent_STOREFAX'] = $arr_STORE['field_STOREFAX'] ;
	
	$thisanim['ent_SALESNAME'] = $arr_SALES['field_SALESMANNAME'] ;
	$thisanim['ent_SALESTEL'] = $arr_SALES['field_SALESMANTEL'] ;
	$thisanim['ent_SALESEMAIL'] = $arr_SALES['field_SALESMANEMAIL'] ;
	
	$thisanim['email_ccmail'] = array() ;
	foreach( $arr_SALES_parents as $SALES_parent ) {
	foreach( explode(',',$SALES_parent) as $value ) {
		if( strpos($value,'@') === FALSE ) {
			continue ;
		}
		$thisanim['email_ccmail'][] = $value ;
	}
	}
	
	$thisanim['arr_dates'] = array() ;
	$query = "SELECT * FROM view_file_ANIM_DATE WHERE filerecord_parent_id='{$arr['filerecord_id']}'" ;
	$res = $_opDB->query($query) ;
	while( ($arrDates = $_opDB->fetch_assoc($res)) != FALSE )
	{
		$thisanim['arr_dates'][] = $arrDates['field_ANIMDAY_DATE'] ;
	}
	$thisanim['arr_prods'] = array() ;
	$query = "SELECT * FROM view_file_ANIM_PROD WHERE filerecord_parent_id='{$arr['filerecord_id']}'" ;
	$res = $_opDB->query($query) ;
	while( ($arrProd = $_opDB->fetch_assoc($res)) != FALSE )
	{
		$thisanim['arr_prods'][] = $arrProd['field_ANIMGAM_CODE'] ;
	}

	$thisanim['obs'] = $arr['field_ANIM_OBS'] ;
	$thisanim['date'] = $arr['field_ANIM_DATECDE'] ;
	
	$anims[] = $thisanim ;
	
	$query = "UPDATE store_file_ANIM SET field_ANIM_ISSENT_int='1' WHERE  filerecord_id='{$arr['filerecord_id']}'" ;
	$_opDB->query($query) ;
}

//print_r($anims) ;
if( !$anims ) {
	exit ;
}

foreach( $anims as $thisanim )
{
	$inputFileType = 'Excel5';
	switch( $thisanim['type'] ) {
		case 'ANIM_POM' :
		$inputFileName = $templates_dir.'/'.'QTP_121214_demoDemosthene_POM.xls' ;
		break;
		
		case 'ANIM_WP_BRI' :
		case 'ANIM_WP_SAMP' :
		$inputFileName = $templates_dir.'/'.'QTP_121214_demoDemosthene_WP.xls' ;
		break ;
		
		default :
		continue 2 ;
	}
	$objReader = PHPExcel_IOFactory::createReader($inputFileType);
	$objPHPExcel = $objReader->load($inputFileName);

	$objPHPExcel->getActiveSheet()->setCellValue('E7', $thisanim['ent_ENSEIGNE']);
	$objPHPExcel->getActiveSheet()->setCellValue('E9', $thisanim['ent_ENSADR']);
	$objPHPExcel->getActiveSheet()->setCellValue('E12',$thisanim['ent_ENSCP']);
	$objPHPExcel->getActiveSheet()->setCellValue('E14', $thisanim['ent_ENSVILLE']);
	$objPHPExcel->getActiveSheet()->setCellValue('E17', $thisanim['ent_CRNAME']);
	$objPHPExcel->getActiveSheet()->setCellValue('E19', $thisanim['ent_CRTEL']);
	$objPHPExcel->getActiveSheet()->setCellValue('E21', $thisanim['ent_STOREFAX']);
	
	$objPHPExcel->getActiveSheet()->setCellValue('E26', $thisanim['ent_SALESNAME']);
	$objPHPExcel->getActiveSheet()->setCellValue('E28', $thisanim['ent_SALESEMAIL']);
	$objPHPExcel->getActiveSheet()->setCellValue('E30', $thisanim['ent_SALESTEL']);
	
	switch( $thisanim['type'] ) {
		case 'ANIM_WP_BRI' :
		$objPHPExcel->getActiveSheet()->setCellValue('E35', 'X');
		break ;
		case 'ANIM_WP_SAMP' :
		$objPHPExcel->getActiveSheet()->setCellValue('E36', 'X');
		break ;
		
		default :
		break ;
	}
	
	switch( $thisanim['type'] ) {
		case 'ANIM_POM' :
		$startDate = 36 ;
		break;
		
		case 'ANIM_WP_BRI' :
		case 'ANIM_WP_SAMP' :
		$startDate = 41 ;
		break ;
		
		default :
		continue 2 ;
	}
	$c=0 ;
	reset($thisanim['arr_dates']) ;
	for( $a=0 ; $a<4 ; $a++ )
	{
		$date = current($thisanim['arr_dates']) ;
		if( !$date ) {
		$weekday = '' ;
		$day = '' ;
		$month = '' ;
		$year = '' ;
		}
		else {
		$weekday = date('l',strtotime($date)) ;
		$day = date('d',strtotime($date)) ;
		$month = date('m',strtotime($date)) ;
		$year = date('Y',strtotime($date)) ;
		}
	
		$objPHPExcel->getActiveSheet()->setCellValue('B'.$startDate, $weekday);
		$objPHPExcel->getActiveSheet()->setCellValue('E'.$startDate, $day);
		$objPHPExcel->getActiveSheet()->setCellValue('G'.$startDate, $month);
		$objPHPExcel->getActiveSheet()->setCellValue('I'.$startDate, $year);
		
	
		$startDate += 2 ;
		next($thisanim['arr_dates']) ;
	}
	
	
	switch( $thisanim['type'] ) {
		case 'ANIM_WP_BRI' :
		case 'ANIM_WP_SAMP' :
		$map['PIS_GS'] = 'E52' ;
		$map['PIS_NS'] = 'E53' ;
		$map['PIS_PV'] = 'E54' ;
		$map['fsdfsd'] = 'E55' ;
		$map['sdfsdf'] = 'E56' ;
		$next_offset = 58 ;
		break;
		
		case 'ANIM_POM' :
		$map['POM_G100'] = 'E47' ;
		$map['POM_GMYR'] = 'E48' ;
		$map['POM_GMAN'] = 'E49' ;
		$map['POM_GCRA'] = 'E50' ;
		$next_offset = 54 ;
		break ;
		
		default :
		continue 2 ;
	}
	foreach( $map as $prod=>$cell ) {
		if( in_array($prod,$thisanim['arr_prods']) )
			$objPHPExcel->getActiveSheet()->setCellValue($cell, 'X');
		else
			$objPHPExcel->getActiveSheet()->setCellValue($cell, '');
	}
	
	
	
	
	
	$objPHPExcel->getActiveSheet()->setCellValue('A'.$next_offset, $thisanim['obs']);
	$next_offset+= 4 ;
	$objPHPExcel->getActiveSheet()->setCellValue('H'.$next_offset, date('Y-m-d',strtotime($thisanim['date'])));
	
	
	
	// Write out as the new file
	$outputFileType = 'Excel5';
	$outputFileName = tempnam(sys_get_temp_dir(),'iot').'.xls' ;
	$objWriter = PHPExcel_IOFactory::createWriter($objPHPExcel, $outputFileType);
	$objWriter->save($outputFileName);	


	$binarybuffer = file_get_contents($outputFileName) ;
	unlink($outputFileName) ;


	$email_text = "" ;
	$email_text.= "Societe : "."Wonderful Brands"."\r\n" ;
	$email_text.= "Chef secteur : ".$thisanim['ent_SALESNAME']."\r\n" ;
	$email_text.= "Tel : ".$thisanim['ent_SALESTEL']."\r\n" ;
	$email_text.= "\r\n" ;
	$email_text.= "Type Animation : ".$thisanim['type_txt']."\r\n" ;
	$email_text.= "\r\n" ;
	$email_text.= "Magasin : ".$thisanim['ent_ENSEIGNE']."\r\n" ;
	$email_text.= "Ville : ".$thisanim['ent_ENSCP']." ".$thisanim['ent_ENSVILLE']."\r\n" ;
	$email_text.= "\r\n" ;

	$to = array() ;
	$to[] = 'planning@demosthene-france.fr' ;
	$to[] = 'dm@mirabel-sil.com' ;
	$to[] = $thisanim['ent_SALESEMAIL'] ;
	foreach( $thisanim['email_ccmail'] as $email ) {
		$to[] = $email ;
	}
	

	$headers['From'] = $thisanim['ent_SALESNAME'].' <'.$thisanim['ent_SALESEMAIL'].'>' ;
	$headers['To'] = implode(',',$to) ;
	$headers['Subject'] = '[Wonderful] '.$thisanim['type'].' '.$thisanim['ent_ENSEIGNE'] ;

	$mime = new Mail_mime("\r\n");
	$mime->setTXTBody($email_text);
	$mime->addAttachment($binarybuffer, 'application/vnd.ms-excel', date('ymd',strtotime($thisanim['date'])).'_'.$thisanim['ens'].'.xls', false, 'base64');

	$mimeparams=array();
	$mimeparams['text_encoding']="8bit";
	$mimeparams['text_charset']="UTF-8";
	$mimeparams['html_charset']="UTF-8"; 
	$mimeparams['head_charset']="UTF-8"; 
	$body = $mime->get($mimeparams);
	$headers = $mime->headers($headers);
	$mail_obj =& Mail::factory('smtp', array('host' => '127.0.0.1', 'port' => 25));
	$mail_obj->send($to, $headers, $body) ;
}

?>