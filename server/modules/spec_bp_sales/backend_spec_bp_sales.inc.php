<?php
include("$server_root/modules/paracrm/include/paracrm.inc.php") ;
include("$server_root/modules/spec_bp_sales/include/specBpSales.inc.php") ;


function backend_specific( $post_data )
{
switch( $post_data['_action'] )
{
	case 'cde_getRecords' :
		return specBpSales_cde_getRecords($post_data) ;
		
	case 'inv_getRecords' :
		return specBpSales_inv_getRecords($post_data) ;
	case 'inv_createFromBlank' :
		return specBpSales_inv_createFromBlank($post_data) ;
	case 'inv_createFromOrder' :
		return specBpSales_inv_createFromOrder($post_data) ;
	case 'inv_createFromInvoiceRefund' :
		return specBpSales_inv_createFromInvoiceRefund($post_data) ;
	case 'inv_deleteRecord' :
		return specBpSales_inv_deleteRecord($post_data) ;
	case 'inv_setRecord' :
		return specBpSales_inv_setRecord($post_data) ;
	case 'inv_queryCustomer' :
		return specBpSales_inv_queryCustomer($post_data) ;
	case 'inv_reopenRecord' :
		return specBpSales_inv_reopenRecord($post_data) ;

	case 'inv_printDoc' :
		return specBpSales_inv_printDoc($post_data) ;
		
	case 'util_htmlToPdf' :
		return specBpSales_util_htmlToPdf( $post_data ) ;

	default :
	return NULL ;
}
}

?>
