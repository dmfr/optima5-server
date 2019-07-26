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

include("$server_root/modules/spec_dbs_lam/backend_spec_dbs_lam.inc.php");

$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
$_SESSION['login_data']['mysql_db'] = 'op5_'.$_domain_id.'_prod' ;
$_SESSION['login_data']['login_domain'] = $_domain_id.'_prod' ;
$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;



$query = "SELECT field_CDE_NR, filerecord_id FROM view_file_CDE WHERE field_ADR_FULL=''" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$noscde = $arr[0] ;
	$filerecord_id = $arr[1] ;
	//echo "\n" ;
	
	
	$query = "SELECT * FROM oscar_eve.cde WHERE cde_noscde='$noscde'" ;
	$res = $_opDB->query($query) ;
	$arr_cde = $_opDB->fetch_assoc($res) ;
	//print_r($arr_cde) ;
	
	$adr_txt = '' ;
	$fields = array('adrliv_nom','adrliv_rue','adrliv_localite','adrliv_ville','adrliv_countrycode') ;
	foreach( $fields as $field ) {
		if( $arr_cde[$field] ) {
			$adr_txt.= $arr_cde[$field]."\n" ;
		}
	}
	$adr_txt = trim($adr_txt) ;
	
	
	$arr_update = array() ;
	$arr_update['field_ADR_FULL'] = $adr_txt ;
	$arr_cond = array() ;
	$arr_cond['filerecord_id'] = $filerecord_id ;
	$_opDB->update('view_file_CDE',$arr_update,$arr_cond) ;
	
	echo $adr_txt ;
	echo "\n" ;
	
}





?>
