<?php
function mail_getBinary_attachPdf( $inv_filerecord_id ) { // return String (binarybuffer)
	global $_opDB ;
	
	$json = specBpSales_inv_printDoc( array('inv_filerecord_id'=>$inv_filerecord_id) ) ;
	if( !$json['success'] ) {
		return NULL ;
	}
	$inv_html = $json['html'] ;
	
	$inv_pdf = specBpSales_util_htmlToPdf_buffer( $inv_html ) ;
	return $inv_pdf ;
}

?>
