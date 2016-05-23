<?php
include("$server_root/modules/spec_bp_sales/include/specBpSales_cde.inc.php") ;
include("$server_root/modules/spec_bp_sales/include/specBpSales_inv.inc.php") ;


function specBpSales_util_htmlToPdf( $post_data ) {
	if( $output_pdf = media_pdf_html2pdf(json_decode($post_data['html'],true),'A4L') ) {
		$filename = 'PRINT'.'_'.time().'.pdf' ;
		header("Content-Type: application/force-download; name=\"$filename\""); 
		header("Content-Disposition: attachment; filename=\"$filename\""); 
		echo $output_pdf ;
	}
	die() ;
}


?>
