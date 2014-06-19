<?php

function media_pdf_html2pdf( $html ) {
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
	rename($img_path,$img_path.'.png') ;
	$img_path.= '.png' ;
	$pdf_path = tempnam( sys_get_temp_dir(), "FOO");
	rename($pdf_path,$pdf_path.'.pdf') ;
	$pdf_path.= '.pdf' ;
	
	file_put_contents( $html_path, $html ) ;
	
	exec( $GLOBALS['media_pdf_wkhtmltoimage_path']." --width 0 --enable-smart-width --format png {$html_path} {$img_path}" ) ;
	
	$img_size = getimagesize( $img_path ) ;
	$img_width = $img_size[0] ;
	$img_height = $img_size[1] ;
	
	$pdf_width = $img_width * (254/1200) * 1.3 ;
	$pdf_height = $img_height * (254/1200) * 1.35 ;
	
	exec( $GLOBALS['media_pdf_wkhtmltopdf_path']." --page-height $pdf_height --page-width $pdf_width {$html_path} {$pdf_path}" ) ;
	$pdf = file_get_contents($pdf_path) ;
	
	unlink($html_path) ;
	unlink($img_path) ;
	unlink($pdf_path) ;
	
	return $pdf ;
}

?>