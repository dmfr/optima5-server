<?php
function specDbsPeople_Forecast_setCfgWhse( $post_data ) {
	global $_opDB ;
	
	$whse_code = $post_data['whse_code'] ;
	if( !$whse_code ) {
		return array('success'=>false) ;
	}
	
	
	$arr_existing_ids = array() ;
	
	$arr_existing_ids['FCAST_UO'] = array() ;
	$query = "SELECT uo.filerecord_id FROM view_file_FCAST_UO uo WHERE uo.field_WHSE_CODE='{$whse_code}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$arr_existing_ids['FCAST_UO'][] = $arr[0] ;
	}
	
	$arr_existing_ids['FCAST_UO_ROLE'] = array() ;
	$query = "SELECT role.filerecord_id FROM view_file_FCAST_UO uo , view_file_FCAST_UO_ROLE role 
				WHERE uo.filerecord_id = role.filerecord_parent_id
				AND uo.field_WHSE_CODE='{$whse_code}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$arr_existing_ids['FCAST_UO_ROLE'][] = $arr[0] ;
	}
	
	
	$arr_new_ids = array() ;
	$cfg_uo = json_decode($post_data['cfg_uo'],true) ;
	foreach( $cfg_uo as $uo_record ) {
		$arr_ins = array() ;
		$arr_ins['field_WHSE_CODE'] = $whse_code ;
		$arr_ins['field_UO_CODE'] = $uo_record['uo_code'] ;
		$filerecord_parent_id = paracrm_lib_data_insertRecord_file('FCAST_UO',0,$arr_ins) ;
		$arr_new_ids[] = $filerecord_parent_id ;
		
		foreach( $uo_record['roles'] as $role_record ) {
			$arr_ins = array() ;
			$arr_ins['field_ROLE_CODE'] = $role_record['role_code'] ;
			$arr_ins['field_HRATE_DEFINE'] = $role_record['role_hRate'] ;
			$filerecord_id = paracrm_lib_data_insertRecord_file('FCAST_UO_ROLE',$filerecord_parent_id,$arr_ins) ;
			$arr_new_ids[] = $filerecord_id ;
		}
	}
	
	
	$to_delete = array_diff( $arr_existing_ids['FCAST_UO'], $arr_new_ids );
	foreach( $to_delete as $filerecord_id ) {
		paracrm_lib_data_deleteRecord_file('FCAST_UO',$filerecord_id) ;
	}
	
	$to_delete = array_diff( $arr_existing_ids['FCAST_UO_ROLE'], $arr_new_ids );
	foreach( $to_delete as $filerecord_id ) {
		paracrm_lib_data_deleteRecord_file('FCAST_UO_ROLE',$filerecord_id) ;
	}
	
	
	return array('success'=>true, 'debug'=>$arr_new_ids) ;
}

function specDbsPeople_Forecast_buildResources( $post_data ) {

}
function specDbsPeople_Forecast_getWeeks( $post_data ) {
	global $_opDB ;
	
	$whse_code = $post_data['whse_code'] ;
	if( !$whse_code ) {
		return array('success'=>false) ;
	}
	
	// Load config
	$query = "SELECT uo.*, role.* FROM view_file_FCAST_UO uo , view_file_FCAST_UO_ROLE role 
				WHERE uo.filerecord_id = role.filerecord_parent_id
				AND uo.field_WHSE_CODE='{$whse_code}'" ;
	$result = $_opDB->query($query) ;
	$arr_uoRecords = array();
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$uo_code = $arr['field_UO_CODE'] ;
		
		if( !isset($arr_uoRecords[$uo_code]) ) {
			$arr_uoRecords[$uo_code] = array(
				'uo_code' => $uo_code,
				'roles' => array()
			);
		}
		$arr_uoRecords[$uo_code]['roles'][] = array(
			'role_code' => $arr['field_ROLE_CODE'],
			'role_hRate' => $arr['field_HRATE_DEFINE']
		);
	}
	$arr_uoRecords = array_values($arr_uoRecords) ;
	
	
	// Eval weeks
	$arr_weekDate_filerecordId = array() ;
	
	$date_base = $post_data['date_base_sql'] ;
	$date_count = $post_data['date_count'] ;
	if( $date_count > 0 && date('N',strtotime($date_base)) != 1 ) {
		return array('success'=>false) ;
	}
	$date_iteration = $date_base ;
	while( $date_count > 0 ) {
		$arr_weekDate_filerecordId[$date_iteration] = 0 ;
		
		$date_iteration = date('Y-m-d',strtotime('+1 week',strtotime($date_iteration))) ;
		$date_count-- ;
	}
	
	// Load/create weeks
	$query = "SELECT filerecord_id, DATE(field_WEEK_DATE) as date_week FROM view_file_FCAST_WEEK 
				WHERE field_WHSE_CODE='{$whse_code}' AND DATE(field_WEEK_DATE) BETWEEN '$date_base' AND '$date_iteration'";
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$filerecord_id = $arr['filerecord_id'] ;
		$date_week = $arr['date_week'] ;
		if( isset($arr_weekDate_filerecordId[$date_week]) ) {
			$arr_weekDate_filerecordId[$date_week] = $filerecord_id ;
		}
	}
	//print_r($arr_weekDate_filerecordId) ;
	foreach( $arr_weekDate_filerecordId as $date_week => $filerecord_id ) {
		if( !$filerecord_id ) {
			// create view_file_FCAST_WEEK file record 
		}
	}
	
	
	return array(
		'success' => true,
		'data' => array(
			'cfg_uo' => $arr_uoRecords,
			'weeks' => $arr_weekRecords
		)
	);
}

?>