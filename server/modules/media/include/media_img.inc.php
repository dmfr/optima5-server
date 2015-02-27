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
		$mimetype = end(explode('.',$src_filename)) ;
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


?>