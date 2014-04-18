<?php
ini_set( 'memory_limit', '256M');

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

include("$server_root/modules/paracrm/backend_paracrm.inc.php");



$query = "SELECT * FROM view_bible_RH_PEOPLE_entry" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$entry_key = $arr[0] ;
	
	$arr_ins = array() ;
	$arr_ins['field_DATE_APPLY'] = '2000-01-01' ;
	$arr_ins['field_PPL_CODE'] = $entry_key ;
	$arr_ins['field_CONTRACT_CODE'] = 'SEMAINE_EMP' ;
	paracrm_lib_data_insertRecord_file( 'RH_CONTRACT', 0, $arr_ins );
	
	$arr_ins = array() ;
	$arr_ins['field_DATE_APPLY'] = '2000-01-01' ;
	$arr_ins['field_PPL_CODE'] = $entry_key ;
	$arr_ins['field_ABS_CODE'] = '_IN' ;
	paracrm_lib_data_insertRecord_file( 'RH_ABS', 0, $arr_ins );
}

exit ;

$handle = fopen('php://stdin','rb') ;
while( !feof($handle) ) {
	$arr_csv = fgetcsv($handle,1024,';') ;
	//print_r($arr_csv) ;
	
	$people_code = str_replace(' ','',$arr_csv[5]) ;
	$query = "SELECT * FROM view_bible_RH_PEOPLE_entry WHERE entry_key='{$people_code}'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		continue ;
	}
	$arr_ins = array() ;
	$arr_ins['field_DATE_APPLY'] = '2000-01-01' ;
	$arr_ins['field_PPL_CODE'] = $people_code ;
	$arr_ins['field_CONTRACT_CODE'] = 'SEMAINE_EMP' ;
	paracrm_lib_data_insertRecord_file( 'RH_CONTRACT', 0, $arr_ins );
	
	
	$role_txt = utf8_encode($arr_csv[2]) ;
	$query = "SELECT entry_key FROM view_bible_CFG_ROLE_entry WHERE field_ROLE_TXT='{$role_txt}'" ;
	$role_code = $_opDB->query_uniqueValue($query) ;
	if( $role_code ) {
		$arr_ins = array() ;
		$arr_ins['field_DATE_APPLY'] = '2000-01-01' ;
		$arr_ins['field_PPL_CODE'] = $people_code ;
		$arr_ins['field_ROLE_CODE'] = $role_code ;
		paracrm_lib_data_insertRecord_file( 'RH_ROLE', 0, $arr_ins );
	}
	
	$team_txt = utf8_encode($arr_csv[1]) ;
	switch( $team_txt ) {
		case 'APM/Matin' :
		case 'RW APM/Matin' :
			$team_txt = 'APM / Matin' ;
			break ;
		case 'Matin/APM' :
		case 'RW Matin/APM' :
			$team_txt = 'Matin / APM' ;
			break ;
		case 'Jour' :
		case 'jour' :
			$team_txt = 'Journée' ;
			break ;
		default :
			break ;
	}
	$query = "SELECT entry_key FROM view_bible_CFG_TEAM_entry WHERE field_TEAM_TXT='{$team_txt}'" ;
	$team_code = $_opDB->query_uniqueValue($query) ;
	if( $team_code ) {
		$arr_ins = array() ;
		$arr_ins['field_DATE_APPLY'] = '2000-01-01' ;
		$arr_ins['field_PPL_CODE'] = $people_code ;
		$arr_ins['field_TEAM_CODE'] = $team_code ;
		paracrm_lib_data_insertRecord_file( 'RH_TEAM', 0, $arr_ins );
		echo "o \n" ;
	} else {
		echo $team_txt." \n" ;
	}
	
	switch( $arr_csv[0] ) {
		case '1' :
			$whse_code = 'AMN80_BAT1' ;
			break ;
		case '2' :
			$whse_code = 'AMN80_BAT2' ;
			break ;
		default :
			$whse_code = '' ;
			break;
	}
	if( $whse_code ) {
		$arr_ins = array() ;
		$arr_ins['field_DATE_APPLY'] = '2000-01-01' ;
		$arr_ins['field_PPL_CODE'] = $people_code ;
		$arr_ins['field_WHSE_CODE'] = $whse_code ;
		paracrm_lib_data_insertRecord_file( 'RH_WHSE', 0, $arr_ins );
	}
	
	
}

?> 
