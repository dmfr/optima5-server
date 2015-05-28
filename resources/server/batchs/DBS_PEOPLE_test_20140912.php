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


$files = array('RH_CONTRACT','RH_ABS','RH_ROLE','RH_TEAM','RH_WHSE') ;

$query = "SELECT entry_key FROM store_bible_RH_PEOPLE_entry" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$people_code = $arr[0] ;
	
	foreach( $files as $file_code ) {
		$query = "SELECT filerecord_id FROM view_file_{$file_code} WHERE field_PPL_CODE='{$people_code}' ORDER BY field_DATE_APPLY" ;
		$res = $_opDB->query($query) ;
		$idx=-1 ;
		while( ($arr = $_opDB->fetch_row($res)) != FALSE ) {
			$idx++ ;
			$filerecord_id = $arr[0] ;
			if( $idx > 0 ) {
				$query = "DELETE FROM store_file_{$file_code} WHERE filerecord_id='{$filerecord_id}'" ;
				$_opDB->query($query) ;
				$query = "DELETE FROM store_file WHERE filerecord_id='{$filerecord_id}'" ;
				$_opDB->query($query) ;
			}
		}
	}
}


exit ;

$query = "DELETE FROM store_bible_RH_PEOPLE_entry" ;
$_opDB->query($query) ;

$files = array('RH_CONTRACT','RH_ABS','RH_ROLE','RH_TEAM','RH_WHSE','PEOPLEDAY','PEOPLEDAY_ABS','PEOPLEDAY_WORK') ;
foreach( $files as $file_code ) {
	$db_table = 'store_file_'.$file_code ;
	$query = "DELETE FROM store_file WHERE file_code='{$file_code}'" ;
	$_opDB->query($query) ;
	$query = "DELETE FROM {$db_table}" ;
	$_opDB->query($query) ;
}


$handle = fopen('php://stdin','rb') ;
while( !feof($handle) ) {
	$arr_csv = fgetcsv($handle,1024,';') ;
	//print_r($arr_csv) ;
	
	if( $arr_csv[6] == 'out' ) {
		continue ;
	}
	
	$people_code = str_replace(' ','',$arr_csv[5]) ;
	if( !$people_code ) {
		continue ;
	}
	$arr_ins = array() ;
	$arr_ins['field_PPL_CODE'] = $people_code ;
	$arr_ins['field_PPL_FULLNAME'] = trim($arr_csv[5]) ;
	$arr_ins['field_PPL_TECHID'] = trim($arr_csv[4]) ;
	paracrm_lib_data_insertRecord_bibleEntry( 'RH_PEOPLE', $people_code, 'RH_PEOPLE', $arr_ins );
	
	
	
	$arr_ins = array() ;
	$arr_ins['field_DATE_APPLY'] = '2000-01-01' ;
	$arr_ins['field_PPL_CODE'] = $people_code ;
	$arr_ins['field_ABS_CODE'] = '_' ;
	paracrm_lib_data_insertRecord_file( 'RH_ABS', 0, $arr_ins );
	
	
	$contract_txt = utf8_encode(trim($arr_csv[8])) ;
	switch( $contract_txt ) {
		case 'WE_EMP' :
			$contract_txt = 'WEEKEND_EMP' ;
			break ;
		case 'WE_AM' :
			$contract_txt = 'WEEKEND_AM' ;
			break ;
	}
	$arr_ins = array() ;
	$arr_ins['field_DATE_APPLY'] = '2000-01-01' ;
	$arr_ins['field_PPL_CODE'] = $people_code ;
	$arr_ins['field_CONTRACT_CODE'] = $contract_txt ;
	paracrm_lib_data_insertRecord_file( 'RH_CONTRACT', 0, $arr_ins );
	
	
	$role_txt = utf8_encode(trim($arr_csv[2])) ;
	if( $role_txt == 'Cariste Recompil' ) {
		$role_txt = 'Recompil' ;
	}
	$query = "SELECT entry_key FROM view_bible_CFG_ROLE_entry WHERE field_ROLE_TXT='{$role_txt}'" ;
	$role_code = $_opDB->query_uniqueValue($query) ;
	if( $role_code ) {
		$arr_ins = array() ;
		$arr_ins['field_DATE_APPLY'] = '2000-01-01' ;
		$arr_ins['field_PPL_CODE'] = $people_code ;
		$arr_ins['field_ROLE_CODE'] = $role_code ;
		paracrm_lib_data_insertRecord_file( 'RH_ROLE', 0, $arr_ins );
	} else {
		echo $role_txt ;
	}
	
	$team_txt = utf8_encode($arr_csv[1]) ;
	switch( trim($team_txt) ) {
		case 'APM/Matin' :
		case 'RW APM/Matin' :
		case 'PM APM/Matin' :
			$team_txt = 'APM / Matin' ;
			break ;
		case 'Matin/APM' :
		case 'RW Matin/APM' :
		case 'PM Matin/APM' :
			$team_txt = 'Matin / APM' ;
			break ;
		case 'Jour' :
		case 'jour' :
			$team_txt = 'Journée' ;
			break ;
		case 'Nuit' :
		case 'PM Nuit' :
		case 'PM nuit' :
			$team_txt = 'Nuit' ;
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
		//echo "o \n" ;
	} else {
		echo $team_txt." \n" ;
	}
	
	switch( substr(trim($arr_csv[0]),0,1) ) {
		case '1' :
			$whse_code = 'AMN80_BAT1' ;
			if( strpos($arr_csv[1],'PM') === 0 ) {
				$whse_code = 'AMN80_BAT1_PM' ;
			}
			if( strpos($arr_csv[1],'RW') === 0 ) {
				$whse_code = 'AMN80_BAT1_RW' ;
			}
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