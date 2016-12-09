<?php

function specRsiRecouveo_file_getRecords( $post_data ) {
	global $_opDB ;
	
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_atr = $ttmp['data']['cfg_atr'] ;
	//print_r($cfg_atr) ;
	
	if( $post_data['filter_atr'] ) {
		$filter_atr = json_decode($post_data['filter_atr'],true) ;
	}
	if( $post_data['filter_fileFilerecordId_arr'] ) {
		$_load_details = true ;
		$filter_fileFilerecordId_list = $_opDB->makeSQLlist( json_decode($post_data['filter_fileFilerecordId_arr'],true) ) ;
	}
	
	$TAB_files = array() ;
	
	$query = "SELECT f.* FROM view_file_FILE f" ;
	$query.= " JOIN view_bible_LIB_ACCOUNT_entry la ON la.entry_key = f.field_LINK_ACCOUNT" ;
	$query.= " WHERE 1" ;
	if( isset($filter_fileFilerecordId_list) ) {
		$query.= " AND f.filerecord_id IN {$filter_fileFilerecordId_list}" ;
	} elseif( $filter_atr ) {
		foreach( $cfg_atr as $atr_record ) {
			$mkey = $atr_record['bible_code'] ;
			if( $filter_atr[$mkey] ) {
				$mvalue = $filter_atr[$mkey] ;
				$query.= " AND f.field_{$mkey} = '$mvalue'" ;
			}
		}
	}
	$query.= " ORDER BY f.filerecord_id DESC" ;
	//echo $query ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$record = array(
			'file_filerecord_id' => $arr['filerecord_id'],
			
			'records' => array(),
			'actions' => array()
		);
		foreach( $cfg_atr as $atr_record ) {
			$mkey = $atr_record['bible_code'] ;
			$record[$mkey] = $arr['field_'.$mkey] ;
		}
		
		$TAB_files[$arr['filerecord_id']] = $record ;
	}
	
	/*
	$query = "SELECT * FROM view_file_TRSPT_EVENT te" ;
	$query.= " WHERE 1" ;
	if( isset($filter_trsptFilerecordId_list) ) {
		$query.= " AND te.filerecord_parent_id IN {$filter_trsptFilerecordId_list}" ;
	} elseif( !$filter_archiveIsOn ) {
		$query.= " AND te.filerecord_parent_id IN (SELECT filerecord_id FROM view_file_TRSPT WHERE field_ARCHIVE_IS_ON='0')" ;
	}
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		if( !isset($TAB_files[$arr['filerecord_parent_id']]) ) {
			continue ;
		}
		$TAB_files[$arr['filerecord_parent_id']]['events'][] = array(
			'trsptevent_filerecord_id' => $arr['filerecord_id'],
			'event_date' => $arr['field_EVENT_DATE'],
			'event_user' => $arr['field_EVENT_USER'],
			'event_txt' => $arr['field_EVENT_TXT']
		);
	}
	*/

	return array('success'=>true, 'data'=>array_values($TAB_files)) ;
}

?>
