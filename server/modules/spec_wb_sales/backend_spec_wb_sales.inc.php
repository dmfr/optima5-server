<?php
include("$server_root/modules/paracrm/include/paracrm.inc.php") ;
include("$server_root/modules/spec_wb_sales/include/specWbSales.inc.php") ;


function backend_specific( $post_data )
{
switch( $post_data['_action'] )
{
	case 'query_getResult' :
	return specWbSales_query_getResult( $post_data ) ;
	
	default :
	return NULL ;
}
}

?>