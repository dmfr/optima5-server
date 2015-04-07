<?php
function specDbsEmbralam_mach_getGrid( $post_data ) {
	global $_opDB ;
	
	$map_stepCode_stepTxt = array() ;
	$query = "SELECT * FROM view_bible_CDE_MILESTONE_entry" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$map_stepCode_stepTxt[$arr['field_MS_CODE']] = $arr['field_MS_TXT'] ;
	}
	
	$query = "SELECT * FROM view_file_CDE ORDER BY filerecord_id DESC" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$filerecord_id = $arr['filerecord_id'] ;
	
		$row = array() ;
		$row['delivery_id'] = $arr['field_DELIVERY_ID'] ;
		$row['type'] = $arr['field_TYPE'] ;
		$row['flow'] = $arr['field_FLOW'] ;
		$row['step_code'] = $arr['field_STEP_CURRENT'] ;
		$row['step_txt'] = $map_stepCode_stepTxt[$arr['field_STEP_CURRENT']] ;
		$row['priority_code'] = $arr['field_PRIORITY'] ;
		$row['shipto_code'] = $arr['field_SHIPTO_CODE'] ;
		$row['shipto_name'] = $arr['field_SHIPTO_NAME'] ;
		$row['obj_steps'] = array() ;
		
		$TAB[$filerecord_id] = $row ;
	}
	
	$query = "SELECT * FROM view_file_CDE_STEP" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$filerecord_parent_id = $arr['filerecord_parent_id'] ;
		$step_code = $arr['field_STEP'] ;
		$date_sql = $arr['field_DATE'] ;
		
		$TAB[$filerecord_parent_id]['obj_steps'][$step_code] = $date_sql ;
	}
	
	
	foreach( $TAB as &$row ) {
		if( $row['obj_steps']['01_CREATE'] ) {
			$row['step_RLS'] = array('date_sql'=>$row['obj_steps']['01_CREATE']) ;
		}
		if( $row['obj_steps']['03_PICK_START'] ) {
			$start_ts = strtotime($row['obj_steps']['03_PICK_START']) ;
			$warn_ts = $start_ts + (30*60) ;
			$due_ts = $start_ts + (60*60) ;
			$end_ts = strtotime($row['obj_steps']['04_ASM_END']) ;
			if( !$row['obj_steps']['04_ASM_END'] ) {
				$color = '' ;
				$date_sql = date('Y-m-d H:i:s',$due_ts) ;
			} elseif( $end_ts >= $due_ts ) {
				$color = 'red' ;
				$date_sql = date('Y-m-d H:i:s',$end_ts) ;
			} elseif( $end_ts >= $warn_ts ) {
				$color = 'orange' ;
				$date_sql = date('Y-m-d H:i:s',$end_ts) ;
			} else {
				$color = 'green' ;
				$date_sql = date('Y-m-d H:i:s',$end_ts) ;
			}
			
			$row['step_PCK'] = array('date_sql'=>$date_sql, 'color'=>$color) ;
		}
		if( $row['obj_steps']['05_INSPECT_START'] ) {
			$start_ts = strtotime($row['obj_steps']['05_INSPECT_START']) ;
			$end_ts = strtotime($row['obj_steps']['06_INSPECT_END']) ;
			if( !$row['obj_steps']['06_INSPECT_END'] ) {
				$color = '' ;
				$date_sql = date('Y-m-d H:i:s',$start_ts) ;
			} else {
				$color = 'green' ;
				$date_sql = date('Y-m-d H:i:s',$end_ts) ;
			}
			
			$row['step_QI'] = array('date_sql'=>$date_sql, 'color'=>$color) ;
		}
		if( $row['obj_steps']['09_INVOICE'] ) {
			$start_ts = strtotime($row['obj_steps']['01_CREATE']) ;
			
			switch( $row['priority_code'] ) {
				case '1' :
					$due_ts = $start_ts + (2*60*60) ;
					break ;
				case '2' :
					$due_ts = $start_ts + (24*60*60) ;
					break ;
				case '3' :
				default :
					$due_ts = $start_ts + (48*60*60) ;
					break ;
			}
			$warn_ts = $due_ts - (30*60) ;
			
			$end_ts = strtotime($row['obj_steps']['09_INVOICE']) ;
			if( !$row['obj_steps']['04_ASM_END'] ) {
				$color = '' ;
				$date_sql = date('Y-m-d H:i:s',$due_ts) ;
			} elseif( $end_ts >= $due_ts ) {
				$color = 'red' ;
				$date_sql = date('Y-m-d H:i:s',$end_ts) ;
			} elseif( $end_ts >= $warn_ts ) {
				$color = 'orange' ;
				$date_sql = date('Y-m-d H:i:s',$end_ts) ;
			} else {
				$color = 'green' ;
				$date_sql = date('Y-m-d H:i:s',$end_ts) ;
			}
			
			$row['step_INV'] = array('date_sql'=>$date_sql, 'color'=>$color) ;
		}
		if( $row['obj_steps']['10_AWB'] ) {
				$color = 'green' ;
				$date_sql = $row['obj_steps']['10_AWB'] ;
			$row['step_AWB'] = array('date_sql'=>$date_sql, 'color'=>$color) ;
		}
	}
	unset($row) ;
	
	
	
	
	
	
	return array(
		'success' => true,
		'data_grid' => array_values($TAB),
		'data_gauge' => array(
			
		)
	) ;
}




?>