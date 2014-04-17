<?php

function specDbsPeople_RH_getGrid($post_data) {
	global $_opDB ;
	if( isset($post_data['filter_peopleCode']) ) {
		$people_code = $post_data['filter_peopleCode'] ;
	}
	
	if( !$people_code ) {
		paracrm_lib_file_joinPrivate_buildCache('PEOPLEDAY') ;
	}
	
	$TAB = array() ;
	$query = "SELECT * FROM view_bible_RH_PEOPLE_tree t, view_bible_RH_PEOPLE_entry e
					WHERE t.treenode_key=e.treenode_key" ;
	if( $people_code ) {
		$query.= " AND e.entry_key='{$people_code}'" ;
	}
	$query.= " ORDER BY e.field_PPL_FULLNAME" ;
	
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$row = array() ;
		$row['people_code'] = $arr['entry_key'] ;
		$row['people_name'] = $arr['field_PPL_FULLNAME'] ;
		$row['people_techid'] = $arr['field_PPL_TECHID'] ;
		
		// Fake JOIN on PEOPLEDAY file to retrieve current attributes
		$fake_row = array() ;
		$fake_row['PEOPLEDAY']['field_DATE'] = date('Y-m-d') ;
		$fake_row['PEOPLEDAY']['field_PPL_CODE'] = $arr['entry_key'] ;
		paracrm_lib_file_joinQueryRecord( 'PEOPLEDAY', $fake_row ) ;
		
		$join_map = array() ;
		$join_map['field_STD_WHSE'] = 'whse_code' ;
		$join_map['field_STD_TEAM'] = 'team_code' ;
		$join_map['field_STD_ROLE'] = 'role_code' ;
		foreach( $join_map as $src => $dest ) {
			$val = $fake_row['PEOPLEDAY'][$src] ;
			$row[$dest] = ( $val != NULL ? $val : '_' ) ;
		}
		
		// Next events
		
		
		$TAB[] = $row ;
	}

	return array('success'=>true, 'data'=>$TAB) ;
}

function specDbsPeople_RH_getEventTypesMap() {
	$ttmp = array('ROLE','WHSE','TEAM','ABS') ;
	
	$map_file_field = array() ;
	foreach( $ttmp as $mkey ) {
		$map_file_field[$mkey] = array(
			'type' => $mkey,
			'file_code' => 'RH_'.$mkey,
			'file_field_code' => 'field_'.$mkey.'_CODE'
		);
	}
	return $map_file_field ;
}
function specDbsPeople_RH_getPeopleEvents($post_data) {
	global $_opDB ;
	$map_file_field = specDbsPeople_RH_getEventTypesMap() ;
	
	$TAB = array() ;
	
	$people_code = $post_data['people_code'] ;
	foreach( $map_file_field as $type => $type_desc ) {
		$view_file = 'view_file_'.$type_desc['file_code'] ;
		$query = "SELECT * FROM {$view_file} WHERE field_PPL_CODE='{$people_code}'" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
			if( $arr['field_TMP_IS_END'] ) {
				continue ;
			}
			
			$TAB[] = array(
				'event_id' => $arr['filerecord_id'],
				'event_type' => $type,
				'x_code' => $arr[$type_desc['file_field_code']],
				'date_start' => $arr['field_DATE_APPLY'],
				'date_end' => ( $arr['field_TMP_IS_ON'] ? $arr['field_TMP_DATE_END'] : null )
			);
		}
	}
	
	return array('success'=>true, 'data'=>$TAB) ;
}
function specDbsPeople_RH_editPeopleEvent( $post_data ) {
	switch( $post_data['_subaction'] ) {
		case 'new' :
			$filerecord_id = specDbsPeople_RH_editPeopleEvent_new( $post_data['people_code'], json_decode($post_data['data'],true) ) ;
			$success = ($filerecord_id >0) ;
			break ;
			
		case 'delete' :
			$success = specDbsPeople_RH_editPeopleEvent_delete( $post_data['people_code'], $post_data['event_id'] ) ;
			break ;
			
		default :
			$success = false ;
			break ;
	}
	if( $success ) {
		specDbsPeople_RH_resyncPeopleEvents($post_data['people_code']) ;
	}
	return array('success'=>$success) ;
}
function specDbsPeople_RH_editPeopleEvent_new( $people_code, $data ) {
	global $_opDB ;
	$map_file_field = specDbsPeople_RH_getEventTypesMap() ;
	
	$event_type = $data['event_type'] ;
	if( !isset($map_file_field[$event_type]) ) {
		return 0 ;
	}
	$type_desc = $map_file_field[$event_type] ;
	$file_code = $type_desc['file_code'] ;
	$file_field_code = $type_desc['file_field_code'] ;
	if( !paracrm_lib_data_getRecord_bibleEntry('RH_PEOPLE',$people_code) ) {
		return 0 ;
	}
	
	$arr_ins = array() ;
	$arr_ins['field_PPL_CODE'] = $people_code ;
	$arr_ins['field_DATE_APPLY'] = $data['date_start'] ;
	$arr_ins[$file_field_code] = $data['x_code'] ;
	$arr_ins['field_TMP_IS_ON'] = ($data['date_end'] != '') ;
	$arr_ins['field_TMP_DATE_END'] = $data['date_end'];
	$arr_ins['field_TMP_IS_END'] = 0 ;
	$filerecord_id = paracrm_lib_data_insertRecord_file( $file_code, 0, $arr_ins );
	
	return $filerecord_id ;
}
function specDbsPeople_RH_editPeopleEvent_delete( $people_code, $event_id ) {
	global $_opDB ;
	$map_file_field = specDbsPeople_RH_getEventTypesMap() ;
	
	$done = FALSE ;
	foreach( $map_file_field as $type => $type_desc ) {
		$file_code = $type_desc['file_code'] ;
		if( !($file_record = paracrm_lib_data_getRecord_file( $file_code, $event_id )) ) {
			continue ;
		}
		if( $file_record['field_PPL_CODE'] != $people_code ) {
			break ;
		}
		paracrm_lib_data_deleteRecord_file( $file_code, $event_id ) ;
		$done = TRUE ;
		break ;
	}
	return $done ;
}


function specDbsPeople_RH_resyncPeopleEvents( $people_code ) {
	global $_opDB ;
	$map_file_field = specDbsPeople_RH_getEventTypesMap() ;
	
	foreach( $map_file_field as $type => $type_desc ) {
		$file_code = $type_desc['file_code'] ;
		$file_field_code = $type_desc['file_field_code'] ;
		
		$to_sync = array() ;
		$to_delete = array() ;
		
		$view_file = 'view_file_'.$type_desc['file_code'] ;
		$query = "SELECT * FROM {$view_file} WHERE field_PPL_CODE='{$people_code}' AND field_TMP_IS_ON='1'" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
			$filerecord_id = $arr['filerecord_id'] ;
			if( $arr['field_TMP_IS_END'] == 1 ) {
				$to_delete[$filerecord_id] = TRUE ;
				continue ;
			}
			$to_sync[$filerecord_id] = array($arr['field_DATE_APPLY'],$arr['field_TMP_DATE_END']) ;
		}
		
		foreach( $to_delete as $filerecord_id => $dummy ) {
			paracrm_lib_data_deleteRecord_file( $file_code, $filerecord_id ) ;
		}
		foreach( $to_sync as $filerecord_id => $ttmp ) {
			list($date_start,$date_end) = $ttmp ;
			$query = "SELECT {$file_field_code} FROM {$view_file} 
					WHERE field_PPL_CODE='{$people_code}' AND field_DATE_APPLY<'$date_start'
					AND ( field_TMP_IS_ON='0' OR field_TMP_DATE_END>'$date_end' )
					ORDER BY field_DATE_APPLY DESC LIMIT 1" ;
			$xCode = $_opDB->query_uniqueValue($query) ;
			
			$arr_ins = array() ;
			$arr_ins['field_PPL_CODE'] = $people_code ;
			$arr_ins['field_DATE_APPLY'] = date('Y-m-d',strtotime('+1 day',strtotime($date_end))) ;
			$arr_ins[$file_field_code] = $xCode ;
			$arr_ins['field_TMP_IS_ON'] = 1 ;
			$arr_ins['field_TMP_IS_END'] = 1 ;
			paracrm_lib_data_insertRecord_file( $file_code, 0, $arr_ins );
		}
	}
}




?>