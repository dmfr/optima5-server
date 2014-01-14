<?php
include("$server_root/modules/paracrm/include/paracrm.inc.php") ;
include("$server_root/modules/spec_wb_mrfoxy/include/specWbMrfoxy.inc.php") ;


function backend_specific( $post_data )
{
switch( $post_data['_action'] )
{
	case 'promo_getGrid' :
	return specDbsPeople_promo_getGrid( $post_data ) ;
	
	default :
	return NULL ;
}
}

?>