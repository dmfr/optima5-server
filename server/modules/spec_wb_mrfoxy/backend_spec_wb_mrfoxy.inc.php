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
	case 'promo_getSideBenchmark' :
	return specWbMrfoxy_promo_getSideBenchmark($post_data);
	
	case 'promo_formEval' :
	return specWbMrfoxy_promo_formEval($post_data);
	case 'promo_formSubmit' :
	return specWbMrfoxy_promo_formSubmit($post_data);
	
	case 'promo_close' :
	return specWbMrfoxy_promo_close($post_data);
	case 'promo_delete' :
	return specWbMrfoxy_promo_delete($post_data);
	case 'promo_getRecord' :
	return specWbMrfoxy_promo_getRecord($post_data);
	case 'promo_assignBenchmark' :
	return specWbMrfoxy_promo_assignBenchmark($post_data);
	case 'promo_fetchBenchmark' :
	return specWbMrfoxy_promo_fetchBenchmark($post_data);
	
	case 'promo_setObsText' :
	return specWbMrfoxy_promo_setObsText($post_data);
	case 'promo_setApproval' :
	return specWbMrfoxy_promo_setApproval($post_data);
	
	
	case 'promo_exportXLS' :
	return specWbMrfoxy_promo_exportXLS($post_data);
	
	
	
	case 'stat_performance_getResult' :
	return specWbMrfoxy_stat_performance_getResult($post_data);
	case 'stat_exportXLS' :
	return specWbMrfoxy_stat_exportXLS($post_data);
	
	
	
	case 'auth_getTable' :
	return specWbMrfoxy_auth_getTable($post_data);
	
	default :
	return NULL ;
}
}

?>