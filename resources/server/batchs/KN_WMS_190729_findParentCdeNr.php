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


$map_filerecordId_cdeNr = array() ;
$query = "SELECT filerecord_id, field_CDE_NR FROM view_file_CDE WHERE field_ATR_CDECLASS='2MAN' AND filerecord_id NOT IN (select filerecord_parent_id FROM view_file_CDE_LIG where field_PARENT_CDENR<>'')" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$map_filerecordId_cdeNr[$arr[0]] = $arr[1] ;
}

print_r($map_filerecordId_cdeNr) ;
foreach( $map_filerecordId_cdeNr as $filerecord_id => $cde_noscde ) {
	$query = "SELECT cde_id FROM oscar_eve.cde WHERE cde_noscde='{$cde_noscde}'" ;
	$cde_id = $_opDB->query_uniqueValue($query) ;
	if( !$cde_id ) {
		continue ;
	}

	$TAB_oscario = array() ;

	//echo $cde_noscde."\n" ;
	$query = "SELECT c.cde_noscde, cl.prod_ref, cl.qte_cde FROM oscar_eve.cde c JOIN oscar_eve.cde_lig cl ON cl.cde_id=c.cde_id WHERE (c.cde_id='{$cde_id}' OR c.parent_cde_id='{$cde_id}') AND cl.child_cde_id='0'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$hash = 'EVE_'.$arr['prod_ref'].'%%%'.(float)$arr['qte_cde'] ;
		if( !isset($TAB_oscario[$hash]) ) {
			$TAB_oscario[$hash] = array() ;
		}
		$TAB_oscario[$hash][] = $arr ;
	}
	
	
	$query = "SELECT filerecord_id, field_PROD_ID, field_QTY_CDE FROM view_file_CDE_LIG where filerecord_parent_id='{$filerecord_id}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$cdelig_filerecord_id = $arr['filerecord_id'] ;
		$hash = substr($arr['field_PROD_ID'],0).'%%%'.(float)$arr['field_QTY_CDE'] ;
		if( isset($TAB_oscario[$hash]) ) {
			$winner = array_pop($TAB_oscario[$hash]) ;
			if( $winner ) {
				$query = "UPDATE view_file_CDE_LIG SET field_PARENT_CDENR='{$winner['cde_noscde']}' WHERE filerecord_id='{$cdelig_filerecord_id}'" ;
				$_opDB->query($query) ;
			}
		} else {
			echo "?" ;
		}
	}
	
	
	echo "\n\n" ;
}


?>
