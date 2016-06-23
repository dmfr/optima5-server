<?php
include("$server_root/modules/spec_bp_sales/include/specBpSales_cde.inc.php") ;
include("$server_root/modules/spec_bp_sales/include/specBpSales_inv.inc.php") ;


function specBpSales_util_htmlToPdf( $post_data ) {
	if( $output_pdf = specBpSales_util_htmlToPdf_buffer(json_decode($post_data['html'],true)) ) {
		$filename = ($post_data['filename'] ? $post_data['filename'] : 'PRINT'.'_'.time().'.pdf') ;
		header("Content-Type: application/force-download; name=\"$filename\""); 
		header("Content-Disposition: attachment; filename=\"$filename\""); 
		echo $output_pdf ;
	}
	die() ;
}
function specBpSales_util_htmlToPdf_buffer( $input_html ) {
	if( $output_pdf = media_pdf_html2pdf($input_html,'A4L') ) {
		return $output_pdf ;
	}
	return NULL ;
}


?>
