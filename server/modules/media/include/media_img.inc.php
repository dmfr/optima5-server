<?php

function media_img_processUploaded( $tmpfilepath, $src_filename=NULL )
{
	if( !$GLOBALS['_media_context'] )
		return FALSE ;
	$media_path = media_contextGetDirPath() ;
	if( !$media_path )
	{
		return FALSE ;
	}
	
	$path = $media_path.'/tmp' ;
	
	do{
		$tmpid = rand ( 1000000000 , 9999999999 ) ;
	}
	while( glob( $path.'/'.$tmpid.'*') ) ;
	
	if( function_exists('finfo_open') ) {
		$finfo = finfo_open(FILEINFO_MIME_TYPE);
		$mimetype = finfo_file($finfo, $tmpfilepath) ;
	} elseif( $src_filename ) {
		$ttmp = explode('.',$src_filename) ;
		$mimetype = end($ttmp) ;
	} else {
		return FALSE ;
	}
	switch($mimetype) {
		case 'image/jpeg':
		case 'image/jpg':
		case 'jpeg':
		case 'jpg':
			$img_src = imagecreatefromjpeg($tmpfilepath);
			break;
		case 'image/png':
		case 'png':
			$img_src = imagecreatefrompng($tmpfilepath);
			break;
		case 'image/gif':
		case 'gif':
			$img_src = imagecreatefromgif($tmpfilepath);
			break;
		
		case 'application/pdf':
		case 'pdf':
			$pdf = file_get_contents($tmpfilepath) ;
			$jpeg = media_pdf_pdf2jpg( $pdf ) ;
			if( !$jpeg ) {
				return FALSE ;
			}
			file_put_contents( $tmpfilepath, $jpeg ) ;
			
			$img_src = imagecreatefromjpeg($tmpfilepath);
			break ;
		
		case 'application/xhtml+xml' :
		case 'text/html' :
		case 'html' :
		case 'htm' :
			$html = file_get_contents($tmpfilepath) ;
			$jpeg = media_pdf_html2jpg( $html ) ;
			if( !$jpeg ) {
				return FALSE ;
			}
			file_put_contents( $tmpfilepath, $jpeg ) ;
			
			$img_src = imagecreatefromjpeg($tmpfilepath);
			break ;
			
		default :
			return FALSE ;
	}
	
	$orig_w = imagesx($img_src);
	$orig_h = imagesy($img_src);
	if( $ttmp = media_img_getResize( $orig_w, $orig_h, $is_thumb=FALSE ) )
	{
		$dest_w = $ttmp[0];
		$dest_h = $ttmp[1] ;
	
		$img_new = imagecreatetruecolor($dest_w, $dest_h);
		imagecopyresampled($img_new, $img_src, 0, 0, 0, 0, $dest_w, $dest_h, $orig_w, $orig_h);
		imagejpeg($img_new, $path.'/'.$tmpid.'.jpg');
	}
	else
	{
		imagejpeg($img_src, $path.'/'.$tmpid.'.jpg');
	}
	
	if( $ttmp = media_img_getResize( $orig_w, $orig_h, $is_thumb=TRUE ) )
	{
		$dest_w = $ttmp[0];
		$dest_h = $ttmp[1] ;
	
		$img_new = imagecreatetruecolor($dest_w, $dest_h);
		imagecopyresampled($img_new, $img_src, 0, 0, 0, 0, $dest_w, $dest_h, $orig_w, $orig_h);
		imagejpeg($img_new, $path.'/'.$tmpid.'.thumb.jpg',90);
	}
	else
	{
		imagejpeg($img_src, $path.'/'.$tmpid.'.thumb.jpg',90);
	}
	
	
	

	return 'tmp_'.$tmpid ;
}
function media_img_getResize( $orig_w, $orig_h, $is_thumb )
{
	if( $is_thumb )
	{
		$dest_w = '180' ;
		$dest_h = '135' ;
	}
	else
	{
		$dest_w = '1000' ;
		$dest_h = '750' ;
	}
	if( !$is_thumb && ($orig_w<=$dest_w) && ($orig_h<=$dest_h) )
		return NULL ;
	
	if( ($orig_w / $orig_h) >= ($dest_w/$dest_h) )
	{
		// c'est w qui compte !
		$dest_h = ($dest_w * $orig_h) / $orig_w ;
	}
	else
	{
		$dest_w = ($orig_w * $dest_h) / $orig_h ;
	}
	return array($dest_w,$dest_h) ;
}





function media_img_move( $src_id , $dst_id )
{
	if( !$GLOBALS['_media_context'] )
		return FALSE ;
	$media_path = media_contextGetDirPath() ;
	if( !$media_path )
	{
		return FALSE ;
	}
	
	
	if( strpos($src_id,'tmp_') === 0 )
	{
		$ttmp = substr($src_id,4,strlen($src_id)-4) ;
		$src_path = $media_path.'/tmp/'.$ttmp ;
	}
	else
	{
		$src_path = $media_path.'/'.$src_id ;
	}
	if( strpos($dst_id,'tmp_') === 0 )
	{
		$ttmp = substr($dst_id,4,strlen($dst_id)-4) ;
		$dst_path = $media_path.'/tmp/'.$ttmp ;
	}
	else
	{
		$dst_path = $media_path.'/'.$dst_id ;
	}
	
	if( is_file($src_path.'.jpg') )
		rename( $src_path.'.jpg' , $dst_path.'.jpg' ) ;
	if( is_file($src_path.'.thumb.jpg') )
		rename( $src_path.'.thumb.jpg' , $dst_path.'.thumb.jpg' ) ;
	if( is_file($dst_path.'.tmp') )
		unlink( $dst_path.'.tmp' ) ;
	if( is_file($dst_path.'.default') )
		unlink( $dst_path.'.default' ) ;
}
function media_img_delete( $src_id )
{
	if( !$GLOBALS['_media_context'] )
		return FALSE ;
	$media_path = media_contextGetDirPath() ;
	if( !$media_path )
	{
		return FALSE ;
	}

	if( strpos($src_id,'tmp_') === 0 )
	{
		$ttmp = substr($src_id,4,strlen($src_id)-4) ;
		$src_path = $media_path.'/tmp/'.$ttmp ;
	}
	else
	{
		$src_path = $media_path.'/'.$src_id ;
	}
	
	if( is_file($src_path.'.jpg') )
		unlink( $src_path.'.jpg' ) ;
	if( is_file($src_path.'.thumb.jpg') )
		unlink( $src_path.'.thumb.jpg' ) ;
	if( is_file($src_path.'.tmp') )
		unlink( $src_path.'.tmp' ) ;
	
}
function media_img_getPath( $src_id )
{
	if( !$GLOBALS['_media_context'] )
		return FALSE ;
	$media_path = media_contextGetDirPath() ;
	if( !$media_path )
	{
		return FALSE ;
	}

	if( strpos($src_id,'tmp_') === 0 )
	{
		$ttmp = substr($src_id,4,strlen($src_id)-4) ;
		$src_path = $media_path.'/tmp/'.$ttmp ;
	}
	else
	{
		$src_path = $media_path.'/'.$src_id ;
	}
	
	if( is_file($src_path.'.jpg') )
		return $src_path.'.jpg' ;
}
function media_img_getBinary( $src_id )
{
	if( !$GLOBALS['_media_context'] )
		return FALSE ;
	$media_path = media_contextGetDirPath() ;
	if( !$media_path )
	{
		return FALSE ;
	}

	if( strpos($src_id,'tmp_') === 0 )
	{
		$ttmp = substr($src_id,4,strlen($src_id)-4) ;
		$src_path = $media_path.'/tmp/'.$ttmp ;
	}
	else
	{
		$src_path = $media_path.'/'.$src_id ;
	}
	
	if( is_file($src_path.'.jpg') )
		return file_get_contents( $src_path.'.jpg' ) ;
	return NULL ;
}



function media_img_toolBible_getBasename( $bible_code, $data_type, $key ) {
	switch( $data_type ) {
		case 'treenode' :
			$prefix = 't' ;
			break ;
		case 'entry' :
			$prefix = 'e' ;
			break ;
		default :
			return NULL ;
	}
	$basename = $bible_code.'_'.$prefix.'_'.$key ;
	return $basename ;
}
function media_img_toolBible_getIds( $bible_code, $data_type, $key ) {
	if( !$basename = media_img_toolBible_getBasename( $bible_code, $data_type, $key ) ) {
		return NULL ;
	}
	$media_path = media_contextGetDirPath() ;
	$arr_ids = array() ;
	foreach( glob($media_path.'/'.$basename.'*') as $filepath ) {
		$filename = basename($filepath) ;
		$ttmp = explode('.',$filename) ;
		$id = $ttmp[0] ;
		$ttmp = explode('_',$id) ;
		$idx = end($ttmp) ;
		$arr_ids[$id] = $idx ;
	}
	asort($arr_ids) ;
	return array_keys($arr_ids) ;
}
function media_img_toolBible_createNewId( $bible_code, $data_type, $key ) {
	if( !$basename = media_img_toolBible_getBasename( $bible_code, $data_type, $key ) ) {
		return NULL ;
	}
	
	$existing_ids = media_img_toolBible_getIds($bible_code, $data_type, $key) ;
	if( $existing_ids ) {
		$last_id = end($existing_ids) ;
		$ttmp = explode('_',$last_id) ;
		$last_idx = end($ttmp) ;
		$new_idx = (int)$last_idx + 1 ;
	} else {
		$new_idx = 1 ;
	}
	
	$media_path = media_contextGetDirPath() ;
	$filepath = $media_path.'/'.$basename.'_'.$new_idx.'.'.'tmp' ;
	touch($filepath);
	return $basename.'_'.$new_idx ;
}
function media_img_toolBible_getDefault( $bible_code, $data_type, $key, $fallback=FALSE ) {
	if( !$basename = media_img_toolBible_getBasename( $bible_code, $data_type, $key ) ) {
		return NULL ;
	}
	$media_path = media_contextGetDirPath() ;
	if( $tarr = glob($media_path.'/'.$basename.'_*.default') ) {
		$ttmp = basename(reset($tarr)) ;
		$ttmp = explode('.',$ttmp) ;
		return $ttmp[0];
	}
	if( !$fallback ) {
		return NULL ;
	}
	if( $arr_ids = media_img_toolBible_getIds($bible_code, $data_type, $key) ) {
		return end($arr_ids) ;
	}
	return NULL ;
}
function media_img_toolBible_setDefault( $bible_code, $data_type, $key, $media_id ) {
	if( !$basename = media_img_toolBible_getBasename( $bible_code, $data_type, $key ) ) {
		return ;
	}
	if( strpos($media_id,$basename) !== 0 ) {
		return ;
	}
	foreach( media_img_toolBible_getIds($bible_code, $data_type, $key) as $id ) {
		$media_path = media_contextGetDirPath() ;
		$filepath = $media_path.'/'.$id.'.'.'default' ;
		if( is_file($filepath) ) {
			unlink($filepath) ;
		}
	}
	$filepath = $media_path.'/'.$media_id.'.'.'default' ;
	touch($filepath);
}


?>