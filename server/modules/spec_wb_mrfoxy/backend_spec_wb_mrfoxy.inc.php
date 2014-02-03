<?php
include("$server_root/modules/paracrm/include/paracrm.inc.php") ;
include("$server_root/modules/spec_wb_mrfoxy/include/specWbMrfoxy.inc.php") ;


function backend_specific( $post_data )
{
switch( $post_data['_action'] )
{
	case 'promo_getGrid' :
	return specWbMrfoxy_promo_getGrid( $post_data ) ;
	
	case 'promo_getCalendarAccounts' :
	return specWbMrfoxy_promo_getCalendarAccounts( $post_data ) ;
	
	case 'promo_getSideGraph' :
	return specWbMrfoxy_promo_getSideGraph($post_data);
	
	case 'promo_formEval' :
	return specWbMrfoxy_promo_formEval($post_data);
	case 'promo_formSubmit' :
	return specWbMrfoxy_promo_formSubmit($post_data);
	
	case 'promo_delete' :
	return specWbMrfoxy_promo_delete($post_data);
	case 'promo_assignBenchmark' :
	return specWbMrfoxy_promo_assignBenchmark($post_data);
	case 'promo_fetchBenchmark' :
	return specWbMrfoxy_promo_fetchBenchmark($post_data);
	
	default :
	return NULL ;
}
}

?>