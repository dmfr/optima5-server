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

$soc_code='MBD' ;

$map_mkey_atrSW = array() ;

	if( !paracrm_lib_data_getRecord_bibleEntry( 'ADR', 'MIT_0FINAL' ) ) {
		paracrm_lib_data_insertRecord_bibleEntry('ADR', 'MIT_0FINAL','MIT',array('field_ADR_ID'=>'MIT_0FINAL')) ;
	}
	
$handle = fopen("php://stdin",'rb') ;
	$arr_header = fgetcsv($handle) ;
	while( !feof($handle) ) {
		$arr_csv = fgetcsv($handle) ;
		if( !$arr_csv ) {
			continue ;
		}
		
		
		$query = "SELECT filerecord_id FROM view_file_MVT where 1
				AND field_ATR_DIV='{$arr_csv[2]}'
				AND field_ATR_ES='{$arr_csv[3]}'
				AND field_PROD_ID LIKE '%{$arr_csv[9]}%'
				AND field_SPEC_BATCH LIKE '%{$arr_csv[17]}%'
				AND field_SPEC_SN LIKE '%{$arr_csv[18]}%'" ;
		$result = $_opDB->query($query) ;
		if( $_opDB->num_rows($result) != 1 ) {
			print_r($arr_csv) ;
			continue ;
		}
		$mvt_filerecord_id = $_opDB->query_uniqueValue($query) ;
		
		$query = "SELECT field_STEP_CODE from view_file_MVT_STEP where filerecord_parent_id='{$mvt_filerecord_id}' AND field_STATUS_IS_OK='0'" ;
		$status_code = $_opDB->query_uniqueValue($query) ;
		if( !$status_code ) {
			continue ;
		}
		if( $status_code != 'T06_PUTAWAY' ) {
			$query = "UPDATE view_file_MVT_STEP set field_STEP_CODE='T06_PUTAWAY' where filerecord_parent_id='{$mvt_filerecord_id}' AND field_STATUS_IS_OK='0'" ;
			$_opDB->query($query) ;
		}
		
		$query = "SELECT filerecord_id, filerecord_parent_id FROM view_file_TRANSFER_LIG where field_FILE_MVT_ID='{$mvt_filerecord_id}'" ;
		$result = $_opDB->query($query) ;
		$arr = $_opDB->fetch_row($result) ;
		
		$transfer_filerecordId = $arr[1] ;
		$transferLig_filerecordId = $arr[0] ;
		
			$ttmp = specDbsLam_transfer_commitAdrFinal( array(
				'transferFilerecordId' =>  $transfer_filerecordId,
				'transferLigFilerecordId_arr' => json_encode(array($transferLig_filerecordId)),
				'transferStepCode' => 'T06_PUTAWAY',
				'manAdr_isOn' => 1,
				'manAdr_adrId' => 'MIT_0FINAL'
			), $fast=TRUE) ;
	}
fclose($handle) ;



?>
