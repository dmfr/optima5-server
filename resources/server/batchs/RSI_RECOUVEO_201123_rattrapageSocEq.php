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


include("$server_root/modules/spec_rsi_recouveo/backend_spec_rsi_recouveo.inc.php");


$query = "SELECT acc_id FROM tmp" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$acc_id = $arr[0] ;
	echo $acc_id."\n" ;
	
	$query = "SELECT filerecord_id, field_SCENARIO FROM view_file_FILE WHERE field_STATUS LIKE 'S1%' AND field_LINK_ACCOUNT='{$acc_id}'" ;
	$res = $_opDB->query($query) ;
	$arr = $_opDB->fetch_assoc($res) ;
	
	$filerecord_id = $arr['filerecord_id'] ;
	$scen_code = $arr['field_SCENARIO'] ;
	
	if( !$scen_code ) {
		continue ;
	}
	
	$json = specRsiRecouveo_file_getScenarioLine( array(
		'file_filerecord_id' => $filerecord_id,
		'force_scenCode' => $scen_code,
		'force_begin' => true	
	));
	
	//print_r($json) ;
	
	$step = $json['data'][0] ;
	if( !$step['is_next'] ) {
		continue ;
	}
	
	//echo 'O' ;
	
	//continue ;
	
					$forward_post = array(
						'file_filerecord_id' => $filerecord_id,
						'data' => json_encode(array(
							'link_action' => 'BUMP',
							'scen_code' => $scen_code,
							'next_action' => $step['link_action'],
							'next_scenstep_code' => $step['scenstep_code'],
							'next_scenstep_tag' => $step['scenstep_tag'],
							'next_date' => '2020-11-24'
						))
					) ;
					$json = specRsiRecouveo_action_doFileAction($forward_post) ;	
					print_r($json) ;
	
	
	
	
	
}






?>
