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
include("$server_root/modules/spec_rsi_recouveo/backend_spec_rsi_recouveo.inc.php");


include('RSI_RECOUVEO_outMaileva_mailFactory.inc.php') ;

$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
$_SESSION['login_data']['mysql_db'] = 'op5_'.$_domain_id.'_prod' ;
$_SESSION['login_data']['login_domain'] = $_domain_id.'_prod' ;
$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;
	

$json = specRsiRecouveo_config_loadMeta(array()) ;
$config_meta = $json['data'] ;
foreach( array('gen_maileva_urlprod','gen_maileva_authuser','gen_maileva_authpass','gen_maileva_trackprefix','gen_maileva_trackemail') as $mkey ) {
	
	if( !$config_meta[$mkey] ) {
		$err[] = $mkey ;
	}
}
if( $err ) {
	echo "Maileva // Paramètres manquants :\n" ;
	foreach( $err as $mkey ) {
		echo "  - {$mkey}\n" ;
	}
	die() ;
}

// *******************************************
if( TRUE ) {
	$GLOBALS['maileva_URL'] = $config_meta['gen_maileva_urlprod'] ;
	$GLOBALS['maileva_USER'] = $config_meta['gen_maileva_authuser'] ;
	$GLOBALS['maileva_PASS'] = $config_meta['gen_maileva_authpass'] ;
	
	$GLOBALS['maileva_TRACKEMAIL'] = $config_meta['gen_maileva_trackemail'] ;
	$GLOBALS['maileva_TRACKPREFIX'] = $config_meta['gen_maileva_trackprefix'] ;
}
if( $GLOBALS['__OPTIMA_TEST'] ) {
	$GLOBALS['maileva_URL'] = 'https://webservices.recette.maileva.com/java/public/connector/ConnectorWebService?wsdl' ;
	$GLOBALS['maileva_USER'] = 'testclient' ;
	$GLOBALS['maileva_PASS'] = 'testclient' ;
}


$arr_envs = array() ;

// ************ Chargement INV **************
$query = "SELECT filerecord_id FROM view_file_ENVELOPE WHERE field_TRSPT_STATUS='0' ORDER BY filerecord_id" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$arr_envs[] = $arr[0] ;
}
if( !$arr_envs ) {
	exit ;
}

foreach( $arr_envs as $env_filerecord_id ) {
		$xml = xml_getContents($env_filerecord_id, $track_email=$GLOBALS['maileva_TRACKEMAIL']) ;
		//echo $xml ;
		//continue ;
		
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
			echo $env_filerecord_id.':'.$track_id."\n" ;
		} catch( Exception $e ) {
			echo "Exception ".$e ;
			echo "\n\n" ;
		}
		
		//file_put_contents('/var/log/apache2/maileva.xml',$client->__getLastRequest()) ;
		
		//die() ;
		
		if( $track_id ) {
			$arr_ins = array() ;
			$arr_ins['field_TRSPT_STATUS'] = 1 ;
			$arr_ins['field_TRSPT_CODE'] = 'MAILEVA' ;
			$arr_ins['field_TRSPT_TRACK'] = date('YmdHis').'_'.$track_id ;
			paracrm_lib_data_updateRecord_file( 'ENVELOPE' , $arr_ins, $env_filerecord_id ) ;
		}
}

exit ;
?>
