<?php
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


function media_pdf_pdf2jpg( $pdf ) {
	$media_pdf_IMconvert_path = $GLOBALS['media_pdf_IMconvert_path'] ;
	if( !$media_pdf_IMconvert_path || !is_executable($media_pdf_IMconvert_path) ) {
		return NULL ;
	}
	
	$img_path = tempnam( sys_get_temp_dir(), "FOO");
	rename($img_path,$img_path.'.jpg') ;
	$img_path.= '.jpg' ;
	$pdf_path = tempnam( sys_get_temp_dir(), "FOO");
	rename($pdf_path,$pdf_path.'.pdf') ;
	$pdf_path.= '.pdf' ;
	
	file_put_contents( $pdf_path, $pdf ) ;
	exec( media_pdf_makeExecCmd($GLOBALS['media_pdf_IMconvert_path'])." -density 150 {$pdf_path}[0] -quality 100 {$img_path}" ) ;
	$jpeg = file_get_contents($img_path) ;
	
	unlink($img_path) ;
	unlink($pdf_path) ;
	
	return $jpeg ;
}
function media_pdf_pdf2jpgs( $pdf ) {
	$media_pdf_IMconvert_path = $GLOBALS['media_pdf_IMconvert_path'] ;
	if( !$media_pdf_IMconvert_path || !is_executable($media_pdf_IMconvert_path) ) {
		return NULL ;
	}
	
	$img_path_base = tempnam( sys_get_temp_dir(), "FOO");
	unlink($img_path_base) ;
	$img_path = $img_path_base.'_%02d.jpg' ;
	$pdf_path = tempnam( sys_get_temp_dir(), "FOO");
	rename($pdf_path,$pdf_path.'.pdf') ;
	$pdf_path.= '.pdf' ;
	
	file_put_contents( $pdf_path, $pdf ) ;
	exec( media_pdf_makeExecCmd($GLOBALS['media_pdf_IMconvert_path'])." -density 150 {$pdf_path} -quality 100 {$img_path}" ) ;
	
	$jpegs = array() ;
	foreach( glob("$img_path_base"."*") as $img_path ) {
		$jpegs[] = file_get_contents($img_path) ;
		unlink($img_path) ;
	}
	
	unlink($pdf_path) ;
	
	return $jpegs ;
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
