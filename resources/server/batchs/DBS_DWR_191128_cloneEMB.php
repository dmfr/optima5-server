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


$prefix_src = $argv[1] ;
$prefix_dst = $argv[2] ;

function migrate_name($src_name) {
	global $prefix_src, $prefix_dst ;
	
	$ttmp = explode('_',$src_name) ;
	if( $ttmp[0] !== $prefix_src ) {
		return NULL ;
	}
	$ttmp[0]=$prefix_dst ;
	return implode('_',$ttmp) ;
}

if( !$prefix_src || !$prefix_dst || ($prefix_src==$prefix_dst) ) {
	die("Invalid parameters\n") ;
}






$maps_tables_src2dst = array() ;

$query = "SELECT * FROM define_table WHERE table_code LIKE '{$prefix_src}\_%'" ;
$result = $_opDB->query($query) ;
while( ($row = $_opDB->fetch_assoc($result)) != FALSE ) {
	$src_table = $row['table_code'] ;
	$dst_table = migrate_name($src_table) ;
	$maps_tables_src2dst[$src_table] = $dst_table ;
	
	$row['table_code'] = $dst_table ;
	$_opDB->replace('define_table',$row) ;
}
$query = "SELECT * FROM define_table_field WHERE table_code LIKE '{$prefix_src}\_%'" ;
$result = $_opDB->query($query) ;
while( ($row = $_opDB->fetch_assoc($result)) != FALSE ) {
	$src_table = $row['table_code'] ;
	$dst_table = migrate_name($src_table) ;
	
	$row['table_code'] = $dst_table ;
	$_opDB->replace('define_table_field',$row) ;
}

$t = new DatabaseMgr_Sdomain($_domain_id) ;
foreach( array_values($maps_tables_src2dst ) as $table_code ) {
	$t->sdomainDefine_buildTable( $_sdomain_id , $table_code ) ;
}

$sortfunc = function($s1,$s2) {
	$s1 = strlen($s1);
	$s2 = strlen($s2);
	if( $s1==$s2 ) {
		return 0 ;
	}
	return ($s1>$s2) ? -1 : 1 ;
};
uasort($maps_tables_src2dst,$sortfunc) ;
//print_r($maps_tables_src2dst) ;



$query = "DELETE FROM importmap WHERE target_tablecode LIKE '{$prefix_dst}\_%'" ;
$_opDB->query($query) ;
$query = "DELETE FROM importmap_column WHERE importmap_id NOT IN (select importmap_id FROM importmap)" ;
$_opDB->query($query) ;

$importmap_ids = array() ;
$query = "SELECT importmap_id FROM importmap WHERE target_tablecode LIKE '{$prefix_src}\_%'" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$importmap_ids[] = $arr[0] ;
}

$map_importmapId_src2dst = array() ;

$query = "SELECT * FROM importmap WHERE importmap_id IN ".$_opDB->makeSQLlist($importmap_ids) ;
$result = $_opDB->query($query) ;
while( ($row = $_opDB->fetch_assoc($result)) != FALSE ) {
	$importmap_id_src = $row['importmap_id'] ;
	unset($row['importmap_id']) ;
	$row['target_tablecode'] = migrate_name($row['target_tablecode']) ;
	if( !$row['target_tablecode'] ) {
		echo "?" ;
		continue ;
	}
	$_opDB->insert('importmap',$row) ;
	$map_importmapId_src2dst[$importmap_id_src] = $_opDB->insert_id() ;
}

$query = "SELECT * FROM importmap_column WHERE importmap_id IN ".$_opDB->makeSQLlist($importmap_ids) ;
$result = $_opDB->query($query) ;
while( ($row = $_opDB->fetch_assoc($result)) != FALSE ) {
	$importmap_id_src = $row['importmap_id'] ;
	$importmap_id_dst = $map_importmapId_src2dst[$importmap_id_src] ;
	if( !$importmap_id_dst ) {
		echo "?" ;
		continue ;
	}
	$row['importmap_id'] = $importmap_id_dst ;
	$_opDB->insert('importmap_column',$row) ;
}







$query = "SELECT * FROM qsql WHERE qsql_name LIKE '{$prefix_src}\_%'" ;
$result = $_opDB->query($query) ;
while( ($row = $_opDB->fetch_assoc($result)) != FALSE ) {
	$qsql_dst = migrate_name($row['qsql_name']) ;
	$query = "DELETE FROM qsql WHERE qsql_name='{$qsql_dst}'" ;
	$_opDB->query($query) ;
	
	$sql_querystring = $row['sql_querystring'] ;
	foreach( $maps_tables_src2dst as $src=>$dst ) {
		$sql_querystring=str_replace($src,$dst,$sql_querystring) ;
	}
	
	$new_row = array() ;
	unset($new_row['qsql_id']) ;
	$new_row['qsql_name'] = $qsql_dst ;
	$new_row['sql_querystring'] = $sql_querystring ;
	$new_row['sql_is_rw'] = $row['sql_is_rw'] ;
	$_opDB->insert('qsql',$new_row) ;
}



?>
