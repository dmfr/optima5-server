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
	
	
	sleep(1) ;
	return array('success'=>true, 'debug'=>$arr_new_ids) ;
}

function specDbsPeople_Forecast_buildResources( $post_data ) {
	global $_opDB ;
	
	$whse_code = $post_data['whse_code'] ;
	if( !$whse_code ) {
		return array('success'=>false) ;
	}
	
	$date_start = $post_data['date_start_sql'] ;
	$date_count = $post_data['date_count'] ;
	if( $date_count > 0 && date('N',strtotime($date_start)) != 1 ) {
		return array('success'=>false) ;
	}
	$date_iteration = $date_start ;
	while( $date_count > 0 ) {
		$arr_weekDate_filerecordId[$date_iteration] = 0 ;
		
		$date_iteration_end = date('Y-m-d',strtotime('+6 days',strtotime($date_iteration))) ;
		
		$repost = array() ;
		$repost['date_start'] = $date_iteration ;
		$repost['date_end'] = $date_iteration_end ;
		$json_Real_data = specDbsPeople_Real_getData($repost) ;
		
		$query = "SELECT filerecord_id FROM view_file_FCAST_WEEK
					WHERE field_WHSE_CODE='{$whse_code}' AND DATE(field_WEEK_DATE)='{$date_iteration}'" ;
		$filerecord_parent_id = $_opDB->query_uniqueValue($query) ;
		
		$arr_existing_ids = $arr_new_ids = array() ;
		$query = "SELECT filerecord_id FROM view_file_FCAST_WEEK_DAYRSRC
					WHERE filerecord_parent_id='$filerecord_parent_id'" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$arr_existing_ids[] = $arr[0] ;
		}
		$arr_dayrsrc = array() ;
		foreach( $json_Real_data['data'] as $peopleday_record ) {
			if( $peopleday_record['std_whse_code'] != $whse_code ) {
				continue ;
			}
			if( $peopleday_record['std_abs_code'] != '_' ) {
				continue ;
			}
			$arr_dayrsrc[$peopleday_record['date_sql']][$peopleday_record['std_role_code']] += $peopleday_record['std_daylength'] ;
		}
		foreach( $arr_dayrsrc as $date_sql => $arr1 ) {
			foreach( $arr1 as $role_code => $qty_hour ) {
				if( $qty_hour == 0 ) {
					continue ;
				}
				$arr_ins = array() ;
				$arr_ins['field_DAY_DATE'] = $date_sql ;
				$arr_ins['field_ROLE_CODE'] = $role_code ;
				$arr_ins['field_QTY_HOUR'] = $qty_hour ;
				$arr_new_ids[] = paracrm_lib_data_insertRecord_file('FCAST_WEEK_DAYRSRC',$filerecord_parent_id,$arr_ins) ;
			}
		}
		$to_delete = array_diff( $arr_existing_ids, $arr_new_ids );
		foreach( $to_delete as $filerecord_id ) {
			paracrm_lib_data_deleteRecord_file('FCAST_WEEK_DAYRSRC',$filerecord_id) ;
		}
		
		$date_iteration = date('Y-m-d',strtotime('+1 week',strtotime($date_iteration))) ;
		$date_count-- ;
	}
	return array('success'=>true) ;
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
	
	
	
	// Eval weeks
	$arr_weekDate_filerecordId = array() ;
	
	$date_start = $post_data['date_start_sql'] ;
	$date_count = $post_data['date_count'] ;
	if( $date_count > 0 && date('N',strtotime($date_start)) != 1 ) {
		return array('success'=>false) ;
	}
	$date_iteration = $date_start ;
	while( $date_count > 0 ) {
		$arr_weekDate_filerecordId[$date_iteration] = 0 ;
		$date_last = $date_iteration ;
		
		$date_iteration = date('Y-m-d',strtotime('+1 week',strtotime($date_iteration))) ;
		$date_count-- ;
	}
	
	// Load/create weeks
	$query = "SELECT filerecord_id, DATE(field_WEEK_DATE) as date_week FROM view_file_FCAST_WEEK 
				WHERE field_WHSE_CODE='{$whse_code}' AND DATE(field_WEEK_DATE) BETWEEN '$date_start' AND '$date_last'";
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
			$arr_ins = array() ;
			$arr_ins['field_WHSE_CODE'] = $whse_code ;
			$arr_ins['field_WEEK_DATE'] = $date_week ;
			$filerecord_id = paracrm_lib_data_insertRecord_file('FCAST_WEEK',0,$arr_ins) ;
		}
	}
	
	$arr_weekRecords = array() ;
	foreach( $arr_weekDate_filerecordId as $date_week => $filerecord_id ) {
		//TODO : Fake weekday coefs
		$week_coefs = array() ;
		for( $a=0 ; $a<7 ; $a++ ) {
			$week_coefs[] = array(
				'weekday_date' => date('Y-m-d',strtotime('+'.$a.' days',strtotime($date_week))),
				'weekday_coef' => ( $a >= 5 ? 15 : 100 )
			) ;
		}
		$arr_weekRecords[$filerecord_id] = array(
			'id' => $date_week.'@'.$whse_code,
			'whse_code' => $whse_code,
			'week_date' => $date_week,
			'day_resources' => array(),
			'week_volumes' => array(),
			'week_coefs' => $week_coefs
		);
	}
	
	// Load day rsrc
	$query = "SELECT week.filerecord_id as _week_filerecordId, week_dayrsrc.* FROM view_file_FCAST_WEEK week , view_file_FCAST_WEEK_DAYRSRC week_dayrsrc 
				WHERE week.filerecord_id = week_dayrsrc.filerecord_parent_id
				AND week.field_WHSE_CODE='{$whse_code}' AND DATE(week.field_WEEK_DATE) BETWEEN '$date_start' AND '$date_last'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$filerecord_id = $arr['_week_filerecordId'] ;
		$dayrsrcRecord = array(
			'rsrc_date' => date('Y-m-d', strtotime($arr['field_DAY_DATE'])),
			'rsrc_role_code' => $arr['field_ROLE_CODE'],
			'rsrc_qty_hour' => $arr['field_QTY_HOUR']
		) ;
		$arr_weekRecords[$filerecord_id]['day_resources'][] = $dayrsrcRecord ;
	}
	
	// Load UO (volumes)
	$query = "SELECT week.filerecord_id as _week_filerecordId, week_vol.* FROM view_file_FCAST_WEEK week , view_file_FCAST_WEEK_UO week_vol 
				WHERE week.filerecord_id = week_vol.filerecord_parent_id
				AND week.field_WHSE_CODE='{$whse_code}' AND DATE(week.field_WEEK_DATE) BETWEEN '$date_start' AND '$date_last'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$filerecord_id = $arr['_week_filerecordId'] ;
		$uoRecord = array(
			'uo_code' => $arr['field_UO_CODE'],
			'uo_qty_unit' => $arr['field_QTY_UNIT']
		) ;
		$arr_weekRecords[$filerecord_id]['week_volumes'][] = $uoRecord ;
	}
	
	
	return array(
		'success' => true,
		'data' => array(
			'cfg_uo' => array_values($arr_uoRecords),
			'weeks' => array_values($arr_weekRecords)
		)
	);
}

function specDbsPeople_Forecast_saveWeekRecord( $post_data ) {
	global $_opDB ;
	$record_data = json_decode($post_data['data'],true) ;
	
	$whse_code = $record_data['whse_code'] ;
	$date_week = $record_data['week_date'] ;
	$query = "SELECT filerecord_id FROM view_file_FCAST_WEEK
				WHERE field_WHSE_CODE='{$whse_code}' AND field_WEEK_DATE='{$date_week}'" ;
	$filerecord_parent_id = $_opDB->query_uniqueValue($query) ;
	if( !$filerecord_parent_id ) {
		return array('success'=>false) ;
	}
	
	// Save volumes
	$arr_existing_ids = $arr_new_ids = array() ;
	$query = "SELECT filerecord_id FROM view_file_FCAST_WEEK_UO
				WHERE filerecord_parent_id='$filerecord_parent_id'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$arr_existing_ids[] = $arr[0] ;
	}
	foreach( $record_data['week_volumes'] as $uoRecord ) {
		$arr_ins = array() ;
		$arr_ins['field_UO_CODE'] = $uoRecord['uo_code'] ;
		$arr_ins['field_QTY_UNIT'] = $uoRecord['uo_qty_unit'] ;
		$arr_new_ids[] = paracrm_lib_data_insertRecord_file('FCAST_WEEK_UO',$filerecord_parent_id,$arr_ins) ;
	}
	$to_delete = array_diff( $arr_existing_ids, $arr_new_ids );
	foreach( $to_delete as $filerecord_id ) {
		paracrm_lib_data_deleteRecord_file('FCAST_WEEK_UO',$filerecord_id) ;
	}
	
	return array('success'=>true) ;
}

?>