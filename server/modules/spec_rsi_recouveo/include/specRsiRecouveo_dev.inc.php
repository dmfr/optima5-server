<?php

function specRsiRecouveo_dev_getNotepad($post_data) {
	global $_opDB ;
	
	$TAB = array() ;
	$query = "SELECT * FROM view_file_Z_NOTEPAD ORDER BY filerecord_id" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB[] = array(
			'nt_filerecord_id'=>$arr['filerecord_id'],
			'nt_class'=>$arr['field_NT_CLASS'],
			'nt_date'=>$arr['field_NT_DATE'],
			'nt_text'=>$arr['field_NT_TEXT'],
			'nt_priority'=>$arr['field_NT_PRIORITY'],
			'nt_done_ok'=>($arr['field_NT_DONE_OK']==1),
			'nt_done_text'=>$arr['field_NT_DONE_TEXT']
		);
	}
	
	return array('success'=>true, 'data'=>$TAB) ;
}

function specRsiRecouveo_dev_setNotepadNote($post_data) {
	global $_opDB ;
	
	$p_ntFilerecordId = $post_data['nt_filerecord_id'] ;
	$p_data = json_decode($post_data['data'],true) ;
	
	$arr_ins = array(
		'field_NT_CLASS' => $p_data['nt_class'],
		'field_NT_DATE' => $p_data['nt_date'],
		'field_NT_TEXT' => $p_data['nt_text'],
		'field_NT_PRIORITY' => $p_data['nt_priority'],
		'field_NT_DONE_OK' => ($p_data['nt_done_ok'] ? 1 : 0),
		'field_NT_DONE_TEXT' => $p_data['nt_done_text']
	);
	print_r($arr_ins) ;
	if( $p_ntFilerecordId > 0 ) {
		if( !$p_data ) {
			paracrm_lib_data_deleteRecord_file( 'Z_NOTEPAD', $p_ntFilerecordId);
		} else {
			paracrm_lib_data_updateRecord_file( 'Z_NOTEPAD', $arr_ins, $p_ntFilerecordId);
		}
	} else {
		paracrm_lib_data_insertRecord_file( 'Z_NOTEPAD', 0, $arr_ins );
	}
	
	return array('success'=>true, 'data'=>$TAB) ;
}

function specRsiRecouveo_dev_getNotepadClass($post_data) {
	global $_opDB ;
	
	$TAB = array() ;
	$query = "SELECT distinct field_NT_CLASS FROM view_file_Z_NOTEPAD ORDER BY field_NT_CLASS" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$TAB[] = array(
			'nt_class'=>$arr[0]
		);
	}
	
	return array('success'=>true, 'data'=>$TAB) ;
}
?>
