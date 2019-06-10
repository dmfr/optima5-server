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

$working_dir = dirname($_SERVER['SCRIPT_NAME']) ;
$dbschema_path = $working_dir."/"."RSI_RECOUVEO_dbschema.json" ;

// get json
if( !is_file($dbschema_path) ) {
	die() ;
}
$raw = file_get_contents($dbschema_path) ;
if( !$raw ) {
	die() ;
}
$json = json_decode($raw,true) ;
if( !$json ) {
	die() ;
}

// update dbSchema
$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() );
$t->sdomainDb_updateSchema( DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ) ;

$arr_bibleCodes = $arr_fileCodes = array() ;
foreach( $json['define_bible'] as $row ) {
	$arr_bibleCodes[] = $row['bible_code'] ;
}
foreach( $json['define_file'] as $row ) {
	$arr_fileCodes[] = $row['file_code'] ;
}

// restore define tables
foreach( $json as $table => $rows ) {
	if( strpos($table,'define_bible') === 0 ) {
		$query = "DELETE FROM {$table} WHERE bible_code IN ".$_opDB->makeSQLlist($arr_bibleCodes) ;
		$_opDB->query($query) ;
	}
	if( strpos($table,'define_file') === 0 ) {
		$query = "DELETE FROM {$table} WHERE file_code IN ".$_opDB->makeSQLlist($arr_fileCodes) ;
		$_opDB->query($query) ;
	}
	
	foreach( $rows as $row ) {
		if( (strpos($table,'define_bible') === 0) && !in_array($row['bible_code'],$arr_bibleCodes) ) {
			continue ;
		}
		if( (strpos($table,'define_file') === 0) && !in_array($row['file_code'],$arr_fileCodes) ) {
			continue ;
		}
		$_opDB->insert($table,$row) ;
	}
}
$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() );
$t->sdomainDefine_buildAll( DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ) ;

// specRsiRecouveo_lib_metafields_build
include("$server_root/modules/spec_rsi_recouveo/backend_spec_rsi_recouveo.inc.php");
specRsiRecouveo_lib_metafields_build() ;

die() ;
?>
