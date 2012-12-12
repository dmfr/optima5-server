<?php

function paracrm_android_getDbImage()
{
	global $_opDB ;

	$TAB = array() ;
	
	$tables = array() ;
	$tables[] = 'define_bible' ;
	$tables[] = 'define_bible_entry' ;
	$tables[] = 'define_bible_tree' ;
	$tables[] = 'define_file' ;
	$tables[] = 'define_file_entry' ;
	$tables[] = 'input_scen' ;
	$tables[] = 'input_scen_page' ;
	$tables[] = 'input_scen_page_field' ;
	$tables[] = 'store_bible_entry' ;
	$tables[] = 'store_bible_entry_field' ;
	$tables[] = 'store_bible_tree' ;
	$tables[] = 'store_bible_tree_field' ;
	// $tables[] = 'define_gmap' ;

	foreach( $tables as $table )
	{
		$data = array() ;
		$query = "SELECT * FROM $table" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
		{
			$data[] = $arr ;
		}
	
		$TAB[$table] = $data ;
	}



	return array('success'=>true,'data'=>$TAB) ;
}
function paracrm_android_getDbImageTimestamp()
{
	return array('success'=>true,'timestamp'=>strtotime(date('Y-m-d'))) ;
}
function paracrm_android_getDbImageStream()
{
	global $_opDB ;
	
	$tables = array() ;
	$tables[] = 'define_bible' ;
	$tables[] = 'define_bible_entry' ;
	$tables[] = 'define_bible_tree' ;
	$tables[] = 'define_file' ;
	$tables[] = 'define_file_entry' ;
	$tables[] = 'input_scen' ;
	$tables[] = 'input_scen_page' ;
	$tables[] = 'input_scen_page_field' ;
	$tables[] = 'store_bible_entry' ;
	$tables[] = 'store_bible_entry_field' ;
	$tables[] = 'store_bible_tree' ;
	$tables[] = 'store_bible_tree_field' ;
	
	$first = paracrm_android_getDbImageTimestamp() ;
	$first['nb_tables'] = 0 ;
	$first['nb_rows'] = 0 ;
	foreach( $tables as $table )
	{
		$query = "SELECT count(*) FROM $table" ;
		$first['nb_tables']++;
		$first['nb_rows'] += $_opDB->query_uniqueValue($query) ;
	}
	echo json_encode($first) ;
	echo "\r\n" ;
	
	foreach( $tables as $table )
	{
		$query = "SELECT * FROM $table" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
		{
			echo json_encode(array('table_name'=>$table,'data'=>$arr)) ;
			echo "\r\n" ;
		}
	}
	
	die() ;
}
function paracrm_android_getDbImageTab($post_data)
{
	global $_opDB ;
	
	$tables = array() ;
	$tables[] = 'define_bible' ;
	$tables[] = 'define_bible_entry' ;
	$tables[] = 'define_bible_tree' ;
	$tables[] = 'define_file' ;
	$tables[] = 'define_file_cfg_calendar' ;
	$tables[] = 'define_file_entry' ;
	$tables[] = 'input_calendar' ;
	$tables[] = 'input_scen' ;
	$tables[] = 'input_scen_page' ;
	$tables[] = 'input_scen_pagepivot' ;
	$tables[] = 'input_scen_pagepivot_copymap' ;
	$tables[] = 'input_scen_page_field' ;
	$tables[] = 'store_bible_entry' ;
	$tables[] = 'store_bible_entry_field' ;
	$tables[] = 'store_bible_tree' ;
	$tables[] = 'store_bible_tree_field' ;
	
	
	$first = paracrm_android_getDbImageTimestamp() ;
	$first['nb_tables'] = 0 ;
	$first['nb_rows'] = 0 ;
	foreach( $tables as $table )
	{
		$query = "SELECT count(*) FROM $table" ;
		$first['nb_tables']++;
		$first['nb_rows'] += $_opDB->query_uniqueValue($query) ;
	}
	echo json_encode($first) ;
	echo "\r\n" ;
	
	foreach( $tables as $table )
	{
		echo json_encode(array($table)) ;
		echo "\r\n" ;
	
		echo json_encode($_opDB->table_fields($table)) ;
		echo "\r\n" ;
	
		$query = "SELECT * FROM $table" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE )
		{
			echo json_encode($arr) ;
			echo "\r\n" ;
		}
		
		echo json_encode(array()) ;
		echo "\r\n" ;
	}
	
	die() ;
}


function paracrm_android_postDbData_prepareJson( $input )
{
	//This will convert ASCII/ISO-8859-1 to UTF-8.
	//Be careful with the third parameter (encoding detect list), because
	//if set wrong, some input encodings will get garbled (including UTF-8!)
	$input = mb_convert_encoding($input, 'UTF-8', 'ASCII,UTF-8,ISO-8859-1');

	//Remove UTF-8 BOM if present, json_decode() does not like it.
	if(substr($input, 0, 3) == pack("CCC", 0xEF, 0xBB, 0xBF)) $input = substr($input, 3);

	return $input;
}

function paracrm_android_syncPull( $post_data )
{
	global $_opDB ;
	
	$file_code = $post_data['file_code'] ;
	$sync_timestamp = $post_data['sync_timestamp'] ;
	
	$query_test = "select count(*) from store_file where file_code='$file_code' AND ( sync_vuid='' OR sync_timestamp='0' )" ;
	if( $_opDB->query_uniqueValue($query_test) > 0 ) {
		// ***** PREPARATION DES DONNEES ******
		$query = "LOCK TABLES store_file WRITE, store_file_field WRITE" ;
		$_opDB->query($query) ;
		
		$ref_prefix = "PHPSERVER" ;
		$ref_timestamp = time() ;
		$query = "UPDATE store_file SET sync_vuid=CONCAT('$ref_prefix','-','$ref_timestamp','-',filerecord_id) WHERE file_code='$file_code' AND sync_vuid=''" ;
		$_opDB->query($query) ;
		
		$now_timestamp = time() ;
		$query = "UPDATE store_file SET sync_timestamp='$now_timestamp' WHERE file_code='$file_code' AND sync_timestamp='0'" ;
		$_opDB->query($query) ;
		
		$query = "UNLOCK TABLES" ;
		$_opDB->query($query) ;
		// *************************************
	}
	
	$arr_table_query = array() ;
	$arr_table_query['store_file'] = "SELECT * FROM store_file WHERE file_code='$file_code' AND sync_timestamp>'$sync_timestamp' AND sync_vuid<>''" ;
	$arr_table_query['store_file_field'] = "SELECT filefield.* FROM store_file file , store_file_field filefield 
															WHERE file.filerecord_id = filefield.filerecord_id 
															AND file.file_code='$file_code' AND file.sync_timestamp>'$sync_timestamp'" ;
															
	$first = array('success'=>true,'timestamp'=>time()) ;
	echo json_encode($first) ;
	echo "\r\n" ;
	
	foreach( $arr_table_query as $table => $query )
	{
		echo json_encode(array($table)) ;
		echo "\r\n" ;
	
		echo json_encode($_opDB->table_fields($table)) ;
		echo "\r\n" ;
	
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE )
		{
			echo json_encode($arr) ;
			echo "\r\n" ;
		}
		
		echo json_encode(array()) ;
		echo "\r\n" ;
	}
	
	die() ;
}
function paracrm_android_syncPush( $post_data )
{
	global $_opDB ;
	
	$timestamp = time() ;

	$arr_tmpid_fileid = array() ;
	$arr_upload_slots  = array() ;
	
	$tab_definefile = array() ;
	$query = "SELECT * FROM define_file" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$tab_definefile[$arr['file_code']] = $arr ;
	}
	
	$data = json_decode(paracrm_android_postDbData_prepareJson($post_data['data']),TRUE) ;
	if( !$data['store_file'] ) {
		return array('success'=>true) ;
	}
	paracrm_lib_data_beginTransaction() ;
	foreach( $data['store_file'] as $file_entry )
	{
		$sync_vuid = $file_entry['sync_vuid'] ;
		if( !$sync_vuid )
		{
			continue ;
		}
		$query = "DELETE FROM store_file WHERE sync_vuid='$sync_vuid'" ;
		$_opDB->query($query) ;
	}
	foreach( $data['store_file'] as $file_entry )
	{
		if( $file_entry['filerecord_parent_id'] != 0 )
			continue ;
		$arr_ins = $file_entry ;
		unset($arr_ins['sync_is_synced']) ;
		$arr_ins['filerecord_id'] = 0 ;
		$arr_ins['sync_timestamp'] = $timestamp ;
		$_opDB->insert('store_file',$arr_ins) ;
		
		
		$arr_tmpid_fileid[$file_entry['filerecord_id']] = $_opDB->insert_id() ;
		if( strpos($tab_definefile[$file_entry['file_code']]['file_type'],'media_') === 0 )
			$arr_upload_slots[] = $arr_tmpid_fileid[$file_entry['filerecord_id']] ;
	}
	foreach( $data['store_file'] as $file_entry )
	{
		if( $file_entry['filerecord_parent_id'] == 0 || !$arr_tmpid_fileid[$file_entry['filerecord_parent_id']])
			continue ;
			
		$arr_ins = $file_entry ;
		unset($arr_ins['sync_is_synced']) ;
		$arr_ins['filerecord_id'] = 0 ;
		$arr_ins['filerecord_parent_id'] = $arr_tmpid_fileid[$file_entry['filerecord_parent_id']] ;
		$arr_ins['sync_timestamp'] = $timestamp ;
		$_opDB->insert('store_file',$arr_ins) ;
		
		$arr_tmpid_fileid[$file_entry['filerecord_id']] = $_opDB->insert_id() ;
		if( strpos($tab_definefile[$file_entry['file_code']]['file_type'],'media_') === 0 )
			$arr_upload_slots[] = $arr_tmpid_fileid[$file_entry['filerecord_id']] ;
	}
	foreach( $data['store_file_field'] as $field_entry )
	{
		if( !$arr_tmpid_fileid[$file_entry['filerecord_id']])
			continue ;
		
		$arr_ins = $field_entry ;
		$arr_ins['filerecord_id'] = $arr_tmpid_fileid[$field_entry['filerecord_id']] ;
		$_opDB->insert('store_file_field',$arr_ins) ;
	}
	paracrm_lib_data_endTransaction(FALSE) ;
	
	
	


	return array('success'=>true,'map_tmpid_fileid'=>$arr_tmpid_fileid,'upload_slots'=>$arr_upload_slots) ;
}


function paracrm_android_postDbData( $post_data )
{
	global $_opDB ;

	$arr_tmpid_fileid = array() ;
	$arr_upload_slots  = array() ;
	
	$tab_definefile = array() ;
	$query = "SELECT * FROM define_file" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$tab_definefile[$arr['file_code']] = $arr ;
	}
	
	$data = json_decode(paracrm_android_postDbData_prepareJson($post_data['data']),TRUE) ;
	paracrm_lib_data_beginTransaction() ;
	foreach( $data['store_file'] as $file_entry )
	{
		if( $file_entry['filerecord_parent_id'] != 0 )
			continue ;
		$arr_ins = $file_entry ;
		$arr_ins['filerecord_id'] = 0 ;
		$_opDB->insert('store_file',$arr_ins) ;
		
		
		$arr_tmpid_fileid[$file_entry['filerecord_id']] = $_opDB->insert_id() ;
		if( strpos($tab_definefile[$file_entry['file_code']]['file_type'],'media_') === 0 )
			$arr_upload_slots[] = $arr_tmpid_fileid[$file_entry['filerecord_id']] ;
	}
	foreach( $data['store_file'] as $file_entry )
	{
		if( $file_entry['filerecord_parent_id'] == 0 || !$arr_tmpid_fileid[$file_entry['filerecord_parent_id']])
			continue ;
			
		$arr_ins = $file_entry ;
		$arr_ins['filerecord_id'] = 0 ;
		$arr_ins['filerecord_parent_id'] = $arr_tmpid_fileid[$file_entry['filerecord_parent_id']] ;
		$_opDB->insert('store_file',$arr_ins) ;
		
		$arr_tmpid_fileid[$file_entry['filerecord_id']] = $_opDB->insert_id() ;
		if( strpos($tab_definefile[$file_entry['file_code']]['file_type'],'media_') === 0 )
			$arr_upload_slots[] = $arr_tmpid_fileid[$file_entry['filerecord_id']] ;
	}
	foreach( $data['store_file_field'] as $field_entry )
	{
		if( !$arr_tmpid_fileid[$file_entry['filerecord_id']])
			continue ;
		
		$arr_ins = $field_entry ;
		$arr_ins['filerecord_id'] = $arr_tmpid_fileid[$field_entry['filerecord_id']] ;
		$_opDB->insert('store_file_field',$arr_ins) ;
	}
	paracrm_lib_data_endTransaction(FALSE) ;
	
	
	


	return array('success'=>true,'map_tmpid_fileid'=>$arr_tmpid_fileid,'upload_slots'=>$arr_upload_slots) ;
}



function paracrm_android_postBinary( $post_data )
{
	media_contextOpen( 'paracrm', '' ) ;

	$base=$post_data['base64_binary'];
   $binary=base64_decode($base);
   $tmpfilename = tempnam( sys_get_temp_dir(), "FOO");
   $res = file_put_contents( $tmpfilename , $binary ) ;
   
   $tmp_id = media_img_processUploaded( $tmpfilename ) ;
   media_img_move( $tmp_id , $post_data['filerecord_id'] ) ;
   unlink($tmpfilename) ;
   
   media_contextClose() ;
   
   return array('success'=>true) ;
}



function paracrm_android_getFileGrid_data( $post_data )
{	
	return paracrm_data_getFileGrid_raw( $post_data ) ;
}

?>