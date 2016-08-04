<?php
function mail_getBinary_attachPdf( $arr_invFilerecordIds ) { // return String (binarybuffer)
	global $_opDB ;
	
	$htmls = array() ;
	
	foreach( $arr_invFilerecordIds as $inv_filerecord_id ) {
		$json = specBpSales_inv_printDoc( array('inv_filerecord_id'=>$inv_filerecord_id) ) ;
		if( !$json['success'] ) {
			return NULL ;
		}
		$inv_html = $json['html'] ;
		
		$htmls[] = $inv_html ;
	}
	
	$pdf = specBpSales_util_htmlToPdf_buffer( $htmls ) ;
	return $pdf ;
}

?>
