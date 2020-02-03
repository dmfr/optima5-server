<?php

function media_pdf_processUploaded( $tmpfilepath, $src_filename=NULL, $all_pages=TRUE )
{
	if( !$GLOBALS['_media_context'] )
		return FALSE ;
	$media_path = media_contextGetDirPath() ;
	if( !$media_path )
	{
		return FALSE ;
	}


	if( function_exists('finfo_open') ) {
		$finfo = finfo_open(FILEINFO_MIME_TYPE);
		$mimetype = finfo_file($finfo, $tmpfilepath) ;
	} elseif( $src_filename ) {
		$ttmp = explode('.',$src_filename) ;
		$mimetype = end($ttmp) ;
	} else {
		return FALSE ;
	}

	$pdf_binary = NULL ;
	switch($mimetype) {
		case 'application/pdf':
		case 'pdf':
			$pdf_binary = file_get_contents($tmpfilepath) ;
			break ;
			
		default :
			return FALSE ;
	}

	// tmp ID
	$path = $media_path.'/tmp' ;
	do{
		$tmpid = rand ( 1000000000 , 9999999999 ) ;
	}
	while( is_file($path.'/'.$tmpid.'.pdf') ) ;
	
	file_put_contents( $path.'/'.$tmpid.'.pdf', $pdf_binary ) ;

	// thumbnails
	$jpegs = media_pdf_pdf2jpgs( $pdf_binary ) ;
	$page = 1 ;
	foreach( $jpegs as $jpeg_binary ) {
		
		$jpg_path = tempnam( sys_get_temp_dir(), "FOO");
		rename($jpg_path,$jpg_path.'.jpg') ;
		file_put_contents( $jpg_path, $jpeg_binary ) ;
		$img_src = imagecreatefromjpeg($jpg_path);
		
		$orig_w = imagesx($img_src);
		$orig_h = imagesy($img_src);
		if( $ttmp = media_img_getResize( $orig_w, $orig_h, $is_thumb=TRUE ) )
		{
			$dest_w = $ttmp[0];
			$dest_h = $ttmp[1] ;
		
			$img_new = imagecreatetruecolor($dest_w, $dest_h);
			imagecopyresampled($img_new, $img_src, 0, 0, 0, 0, $dest_w, $dest_h, $orig_w, $orig_h);
			imagejpeg($img_new, $path.'/'.$tmpid.'.thumb.'.$page.'.jpg',90);
		}
		
		$page++ ;
	}
	//var_dump($jpegs) ;


	return 'tmp_'.$tmpid ;
}
function media_pdf_move( $src_id , $dst_id )
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
	
	$pageCount = media_pdf_getPageCount($src_id) ;
	rename( $src_path.'.pdf' , $dst_path.'.pdf' ) ;
	for( $i=1 ; $i<=$pageCount ; $i++ ) {
		rename( $src_path.".thumb.{$i}.jpg" , $dst_path.".thumb.{$i}.jpg" ) ;
	}
}
function media_pdf_delete( $src_id )
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
	
	$pageCount = media_pdf_getPageCount($src_id) ;
	unlink( $src_path.'.pdf' ) ;
	for( $i=1 ; $i<=$pageCount ; $i++ ) {
		unlink( $src_path.".thumb.{$i}.jpg" ) ;
	}
}
function media_pdf_getPageCount( $src_id )
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
	
	if( $media_pdf_POPPLERpdinfo_path = media_pdf_get_pdfinfo() ) {
		$pdf_path = $src_path.'.pdf' ;
		$out_arr = array() ;
		$stdout = exec( media_pdf_makeExecCmd($media_pdf_POPPLERpdinfo_path)." {$pdf_path}", $out_arr ) ;
		foreach( $out_arr as $out_lig ) {
			$out_lig = trim($out_lig) ;
			$token = 'Pages:' ;
			$cnt = 0 ;
			if( strpos($out_lig,$token) === 0 ) {
				$cnt = trim(substr($out_lig,strlen($token))) ;
				return (int)$cnt ;
			}
		}
		return 0 ;
	}
	
	
	$cnt = 0 ;
	while(true) {
		$cnt++ ;
		$thumb_path = $src_path.'.'.'thumb'.'.'.$cnt.'.jpg' ;
		if( !is_file($thumb_path) ) {
			break ;
		}
	}
	return $cnt - 1 ;
}

function media_pdf_getBinary( $src_id )
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
	
	if( is_file($src_path.'.pdf') )
		return file_get_contents( $src_path.'.pdf' ) ;
	return NULL ;
}
function media_pdf_getPreviewsBinary( $src_id )
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
	
	$pageCount = media_pdf_getPageCount($src_id) ;
	
	$arr_previewBinaries = array() ;
	for( $i=1 ; $i<=$pageCount ; $i++ ) {
		$thumb_path = $src_path.'.'.'thumb'.'.'.$i.'.jpg' ;
		$arr_previewBinaries[] = file_get_contents($thumb_path) ;
	}
	return $arr_previewBinaries ;
}
function media_pdf_getPageBinary( $src_id , $page_idx )
{
	if( !$GLOBALS['_media_context'] )
		return FALSE ;
	
	$pdf_binary = media_pdf_getBinary($src_id) ;
	if( !$pdf_binary ) {
		return FALSE ;
	}
	
	// thumbnails
	$jpegs = media_pdf_pdf2jpgs( $pdf_binary ) ;
	$page = 0 ;
	foreach( $jpegs as $jpeg_binary ) {
		$page++ ;
		if( $page != $page_idx ) {
			continue ;
		}
		
		$jpg_path = tempnam( sys_get_temp_dir(), "FOO");
		rename($jpg_path,$jpg_path.'.jpg') ;
		file_put_contents( $jpg_path, $jpeg_binary ) ;
		$img_src = imagecreatefromjpeg($jpg_path);
		
		$orig_w = imagesx($img_src);
		$orig_h = imagesy($img_src);
		if( $ttmp = media_img_getResize( $orig_w, $orig_h, $is_thumb=FALSE ) )
		{
			$dest_w = $ttmp[0];
			$dest_h = $ttmp[1] ;
		
			$img_new = imagecreatetruecolor($dest_w, $dest_h);
			imagecopyresampled($img_new, $img_src, 0, 0, 0, 0, $dest_w, $dest_h, $orig_w, $orig_h);
			imagejpeg($img_new, $jpg_path,90);
		}
		$jpg_binary = file_get_contents($jpg_path) ;
		unlink($jpg_path) ;
		break ;
	}
	return $jpg_binary ;
}

function media_pdf_toolFile_getId( $file_code, $filerecord_id ) {
	return $file_code.'_'.$filerecord_id ;
}





function media_pdf_makeExecCmd( $executable ) {
	if( !(strpos($executable,' ')===FALSE) ) {
		return '"'.str_replace('\\','\\\\',$executable).'"' ;
	}
	return $executable ;
}

function media_pdf_html2pdf( $htmls, $format=NULL ) {
	$media_pdf_wkhtmltoimage_path = $GLOBALS['media_pdf_wkhtmltoimage_path'] ;
	$media_pdf_wkhtmltopdf_path = $GLOBALS['media_pdf_wkhtmltopdf_path'] ;
	if( !$media_pdf_wkhtmltoimage_path || !is_executable($media_pdf_wkhtmltoimage_path)
		|| !$media_pdf_wkhtmltopdf_path || !is_executable($media_pdf_wkhtmltopdf_path) ) {
		
		return NULL ;
	}
	
	$img_path = tempnam( sys_get_temp_dir(), "FOO");
	rename($img_path,$img_path.'.png') ;
	$img_path.= '.png' ;
	$pdf_path = tempnam( sys_get_temp_dir(), "FOO");
	rename($pdf_path,$pdf_path.'.pdf') ;
	$pdf_path.= '.pdf' ;
	
	if( !is_array($htmls) ) {
		$htmls = array($htmls) ;
	}
	$arr_htmlPaths = array() ;
	foreach( $htmls as $html ) {
		$html_path = tempnam( sys_get_temp_dir(), "FOO");
		rename($html_path,$html_path.'.html') ;
		$html_path.= '.html' ;
		file_put_contents( $html_path, $html ) ;
		
		$arr_htmlPaths[] = $html_path ;
	}
	$html_path = implode(' ',$arr_htmlPaths) ;
	
	
	switch( $format ) {
		case 'A4' :
			exec( media_pdf_makeExecCmd($GLOBALS['media_pdf_wkhtmltopdf_path'])." --page-size A4 {$html_path} {$pdf_path}" ) ;
			break ;
			
		case 'A4L' :
			exec( media_pdf_makeExecCmd($GLOBALS['media_pdf_wkhtmltopdf_path'])." --page-size A4 --orientation landscape {$html_path} {$pdf_path}" ) ;
			break ;
			
		default :
			exec( media_pdf_makeExecCmd($GLOBALS['media_pdf_wkhtmltoimage_path'])." --width 0 --enable-smart-width --format png {$html_path} {$img_path}" ) ;
			
			$img_size = getimagesize( $img_path ) ;
			$img_width = $img_size[0] ;
			$img_height = $img_size[1] ;
			
			$pdf_width = $img_width * (254/1200) * 1.3 ;
			$pdf_height = $img_height * (254/1200) * 1.35 ;
			
			
			exec( media_pdf_makeExecCmd($GLOBALS['media_pdf_wkhtmltopdf_path'])." --page-height $pdf_height --page-width $pdf_width {$html_path} {$pdf_path}" ) ;
			break ;
	}
	
	$pdf = file_get_contents($pdf_path) ;
	
	foreach( $arr_htmlPaths as $html_path ) {
		unlink($html_path) ;
	}
	unlink($img_path) ;
	unlink($pdf_path) ;
	
	return $pdf ;
}


function media_pdf_html2jpg( $html ) {
	$media_pdf_wkhtmltoimage_path = $GLOBALS['media_pdf_wkhtmltoimage_path'] ;
	$media_pdf_wkhtmltopdf_path = $GLOBALS['media_pdf_wkhtmltopdf_path'] ;
	if( !$media_pdf_wkhtmltoimage_path || !is_executable($media_pdf_wkhtmltoimage_path)
		|| !$media_pdf_wkhtmltopdf_path || !is_executable($media_pdf_wkhtmltopdf_path) ) {
		
		return NULL ;
	}
	
	$html_path = tempnam( sys_get_temp_dir(), "FOO");
	rename($html_path,$html_path.'.html') ;
	$html_path.= '.html' ;
	$img_path = tempnam( sys_get_temp_dir(), "FOO");
	rename($img_path,$img_path.'.jpg') ;
	$img_path.= '.jpg' ;
	
	file_put_contents( $html_path, $html ) ;
	
	exec( media_pdf_makeExecCmd($GLOBALS['media_pdf_wkhtmltoimage_path'])." --width 800 --format jpeg {$html_path} {$img_path}" ) ;
	$jpeg = file_get_contents($img_path) ;
	
	unlink($html_path) ;
	unlink($img_path) ;
	
	return $jpeg ;
}


function media_pdf_get_IMconvert() {
	$media_pdf_IMconvert_path = $GLOBALS['media_pdf_IMconvert_path'] ;
	if( !$media_pdf_IMconvert_path || !is_executable($media_pdf_IMconvert_path) ) {
		return NULL ;
	}
	return $media_pdf_IMconvert_path ;
}
function media_pdf_get_pdftoppm() {
	$media_pdf_POPPLERpdftoppm_path = $GLOBALS['media_pdf_POPPLERpdftoppm_path'] ;
	if( !$media_pdf_POPPLERpdftoppm_path || !is_executable($media_pdf_POPPLERpdftoppm_path) ) {
		return NULL ;
	}
	return $media_pdf_POPPLERpdftoppm_path ;
}
function media_pdf_get_pdfinfo() {
	$media_pdf_POPPLERpdftoppm_path = $GLOBALS['media_pdf_POPPLERpdftoppm_path'] ;
	if( !$media_pdf_POPPLERpdftoppm_path || !is_executable($media_pdf_POPPLERpdftoppm_path) ) {
		return NULL ;
	}
	return str_replace('pdftoppm','pdfinfo',$media_pdf_POPPLERpdftoppm_path) ;
}

function media_pdf_pdf2jpg( $pdf ) {
	if( $media_pdf_POPPLERpdftoppm_path = media_pdf_get_pdftoppm() ) {
		$jpegs = media_pdf_pdf2jpgs($pdf) ;
		return $jpegs[0] ;
	}
	
	if( $media_pdf_IMconvert_path = media_pdf_get_IMconvert() ) {
		$img_path = tempnam( sys_get_temp_dir(), "FOO");
		rename($img_path,$img_path.'.jpg') ;
		$img_path.= '.jpg' ;
		$pdf_path = tempnam( sys_get_temp_dir(), "FOO");
		rename($pdf_path,$pdf_path.'.pdf') ;
		$pdf_path.= '.pdf' ;
		
		file_put_contents( $pdf_path, $pdf ) ;
		exec( media_pdf_makeExecCmd($media_pdf_IMconvert_path)." -density 150 {$pdf_path}[0] -quality 100 {$img_path}" ) ;
		$jpeg = file_get_contents($img_path) ;
		
		unlink($img_path) ;
		unlink($pdf_path) ;
		
		return $jpeg ;
	}
	
	return NULL ;
}
function media_pdf_pdf2jpgs( $pdf ) {
	if( $media_pdf_POPPLERpdftoppm_path = media_pdf_get_pdftoppm() ) {
		$img_path_base = tempnam( sys_get_temp_dir(), "FOO");
		unlink($img_path_base) ;
		
		$pdf_path = tempnam( sys_get_temp_dir(), "FOO");
		rename($pdf_path,$pdf_path.'.pdf') ;
		$pdf_path.= '.pdf' ;
		
		file_put_contents( $pdf_path, $pdf ) ;
		exec( media_pdf_makeExecCmd($media_pdf_POPPLERpdftoppm_path)." -jpeg {$pdf_path} {$img_path_base}" ) ;
		
		$jpegs = array() ;
		foreach( glob("$img_path_base"."*") as $img_path ) {
			$jpegs[] = file_get_contents($img_path) ;
			unlink($img_path) ;
		}
		
		unlink($pdf_path) ;
		
		return $jpegs ;
	}

	if( $media_pdf_IMconvert_path = media_pdf_get_IMconvert() ) {
		$img_path_base = tempnam( sys_get_temp_dir(), "FOO");
		unlink($img_path_base) ;
		$img_path = $img_path_base.'_%02d.jpg' ;
		$pdf_path = tempnam( sys_get_temp_dir(), "FOO");
		rename($pdf_path,$pdf_path.'.pdf') ;
		$pdf_path.= '.pdf' ;
		
		file_put_contents( $pdf_path, $pdf ) ;
		exec( media_pdf_makeExecCmd($media_pdf_IMconvert_path)." -density 150 {$pdf_path} -quality 100 {$img_path}" ) ;
		
		$jpegs = array() ;
		foreach( glob("$img_path_base"."*") as $img_path ) {
			$jpegs[] = file_get_contents($img_path) ;
			unlink($img_path) ;
		}
		
		unlink($pdf_path) ;
		
		return $jpegs ;
	}
	
	return NULL ;
}
function media_pdf_jpgs2pdf( $jpegs, $page_format=NULL ) {
	$media_pdf_IMconvert_path = $GLOBALS['media_pdf_IMconvert_path'] ;
	if( !$media_pdf_IMconvert_path || !is_executable($media_pdf_IMconvert_path) ) {
		return NULL ;
	}
	
	$img_paths = array() ;
	foreach( $jpegs as $jpeg ) {
		$img_path = tempnam( sys_get_temp_dir(), "FOO");
		rename($img_path,$img_path.'.jpg') ;
		$img_path.= '.jpg' ;
		
		$img_paths[] = $img_path ;
		file_put_contents( $img_path, $jpeg ) ;
	}
	
	$pdf_path = tempnam( sys_get_temp_dir(), "FOO");
	rename($pdf_path,$pdf_path.'.pdf') ;
	$pdf_path.= '.pdf' ;
	
	$options = '' ;
	switch( $page_format ) {
		case 'A4' :
			$options = '-define pdf:fit-page=A4 -page A4' ;
			break ;
		default :
			$options = '-density 150' ;
			break ;
	}
	exec( media_pdf_makeExecCmd($GLOBALS['media_pdf_IMconvert_path'])." ".implode(' ',$img_paths)." {$options} ".$pdf_path ) ;
	
	$pdf = file_get_contents($pdf_path) ;
	
	foreach( $img_paths as $img_path ) {
		unlink($img_path) ;
	}
	unlink($pdf_path) ;
	
	return $pdf ;
}


?>
