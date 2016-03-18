<?php
include("$server_root/modules/paracrm/include/paracrm.inc.php") ;
include("$server_root/modules/spec_bp_sales/include/specBpSales.inc.php") ;


function backend_specific( $post_data )
{
switch( $post_data['_action'] )
{
	default :
	return NULL ;
}
}

?>
