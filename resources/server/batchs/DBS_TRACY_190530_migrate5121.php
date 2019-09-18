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

include("$server_root/modules/spec_dbs_tracy/backend_spec_dbs_tracy.inc.php");

$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
$_SESSION['login_data']['mysql_db'] = 'op5_'.$_domain_id.'_prod' ;
$_SESSION['login_data']['login_domain'] = $_domain_id.'_prod' ;
$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;


$query = "INSERT INTO `store_bible_CFG_ORDERFLOW_entry` VALUES ('51_CREQ','AIR','51_CREQ','BAE requested','51_CREQ','BAE requested',51.000,0,0,0,'',1),('52_CACK','AIR','52_CACK','BAE received','52_CACK','BAE received',52.000,0,0,0,'',1)" ;
$_opDB->query($query) ;


paracrm_queries_direct( array(
	'q_type' => 'qsql',
	'q_id' => 'DM : 19-05-06 recreate steps'
), TRUE, TRUE ) ;


$ttmp = specDbsTracy_trspt_getRecords(array()) ;
$data = $ttmp['data'] ;
foreach( $data as $trspt_row ) {
	$trspt_filerecord_id = $trspt_row['trspt_filerecord_id'] ;
	if( $trspt_row['calc_step'] == '50_ASSOC' ) {
		specDbsTracy_trspt_ackCustomsStatus( array('trspt_filerecord_id'=>$trspt_filerecord_id)) ;
	}
}






?>
