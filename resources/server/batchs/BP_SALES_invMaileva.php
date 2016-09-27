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

//include("$server_root/modules/paracrm/backend_paracrm.inc.php");
include("$server_root/modules/spec_bp_sales/backend_spec_bp_sales.inc.php");


include('BP_SALES_invMaileva_mailFactory.inc.php') ;
include('BP_SALES_invEurofactor_mailFactory.inc.php') ;



// *********** Get CONSTANTES *******************
$GLOBALS['factor_ref'] = date('ymdHis') ;

$GLOBALS['_cfg_peer_code'] = 'INV_MAILEVA' ;
$GLOBALS['_cfg_peer_code_parent'] = 'INV_EUROFACTOR' ;

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
		case 'URL' :
			$GLOBALS['maileva_URL'] = $mval ;
			break ;
		case 'USER' :
			$GLOBALS['maileva_USER'] = $mval ;
			break ;
		case 'PASS' :
			$GLOBALS['maileva_PASS'] = $mval ;
			break ;
		default :
			break ;
	}
}
// *******************************************
if( $GLOBALS['__OPTIMA_TEST'] ) {
	$GLOBALS['maileva_URL'] = 'https://webservices.recette.maileva.com/java/public/connector/ConnectorWebService?wsdl' ;
	$GLOBALS['maileva_USER'] = 'testclient' ;
	$GLOBALS['maileva_PASS'] = 'testclient' ;
}



$map_factorRef_invFilerecordIds = array() ;

// ************ Chargement INV **************
$query = "SELECT ipp.field_SEND_REF, i.filerecord_id FROM view_file_INV i
	LEFT OUTER JOIN view_file_INV_PEER ip ON ip.filerecord_parent_id=i.filerecord_id
		AND ip.field_PEER_CODE='{$GLOBALS['_cfg_peer_code']}'
	LEFT OUTER JOIN view_file_INV_PEER ipp ON ipp.filerecord_parent_id=i.filerecord_id
		AND ipp.field_PEER_CODE='{$GLOBALS['_cfg_peer_code_parent']}'
	WHERE i.field_STATUS_IS_FINAL='1'
	AND (ip.field_SEND_IS_OK IS NULL OR ip.field_SEND_IS_OK<>'1')
	AND (ipp.field_SEND_IS_OK='1')
	AND ABS(i.field_CALC_AMOUNT_FINAL) > '0'" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$factor_SEND_REF = $arr[0] ;
	$filerecord_id = $arr[1] ;
	if( !$map_factorRef_invFilerecordIds ) {
		$map_factorRef_invFilerecordIds[$factor_SEND_REF] = array() ;
	}
	$map_factorRef_invFilerecordIds[$factor_SEND_REF][] = $filerecord_id ;
}
if( !$map_factorRef_invFilerecordIds ) {
	exit ;
}

foreach( $map_factorRef_invFilerecordIds as $factor_SEND_REF => $arr_invFilerecordIds ) {
	foreach( $arr_invFilerecordIds as $inv_filerecord_id ) {
		$xml = xml_getContents($inv_filerecord_id, $track_email=$field_sendto) ;
		//echo $xml ;
		
		$url = $GLOBALS['maileva_URL'] ;
		$params = array(
			'soap_version'   => SOAP_1_1,
			'trace' => false,
			'login' => $GLOBALS['maileva_USER'],
			'password' => $GLOBALS['maileva_PASS']
		) ;
		$client = new SoapClient($url,$params);
		
		$track_id = NULL ;
		try {
			$args = new SoapVar($xml, XSD_ANYXML);    
			
			$res  = $client->__soapCall('submit', array($args));
			
			if( $res ) {
				$track_id = $res->return ;
				//var_dump($track_id) ;
			}
			echo $inv_filerecord_id.':'.$track_id."\n" ;
		} catch( Exception $e ) {
			echo "Exception ".$e ;
			echo "\n\n" ;
		}
		
		//file_put_contents('/var/log/apache2/maileva.xml',$client->__getLastRequest()) ;
		
		//die() ;
		
		if( $track_id ) {
			$arr_ins = array() ;
			$arr_ins['field_PEER_CODE'] = $GLOBALS['_cfg_peer_code'] ;
			$arr_ins['field_SEND_IS_OK'] = 1 ;
			$arr_ins['field_SEND_REF'] = $track_id ;
			$arr_ins['field_SEND_DATE'] = date('Y-m-d H:i:s') ;
			paracrm_lib_data_insertRecord_file( 'INV_PEER' , $inv_filerecord_id , $arr_ins ) ;
		}
	}
}

exit ;
?>
