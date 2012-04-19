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




function paracrm_android_postDbData( $post_data )
{
	global $_opDB ;

	$arr_tmpid_fileid = array() ;
	
	$tab_definefile = array() ;
	$query = "SELECT * FROM define_file" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$tab_definefile[$arr['file_code']] = $arr ;
	}
	
	$data = json_decode($post_data['data'],TRUE) ;
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

?>