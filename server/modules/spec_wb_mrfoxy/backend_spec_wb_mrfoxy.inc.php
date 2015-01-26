<?php
include("$server_root/modules/paracrm/include/paracrm.inc.php") ;
include("$server_root/modules/spec_wb_mrfoxy/include/specWbMrfoxy.inc.php") ;


function backend_specific( $post_data )
{
switch( $post_data['_action'] )
{
	case 'cfg_getBibleBrand' :
	return specWbMrfoxy_cfg_getBibleBrand() ;
	case 'cfg_getBibleCountry' :
	return specWbMrfoxy_cfg_getBibleCountry() ;
	
	
	case 'promo_getGrid' :
	return specWbMrfoxy_promo_getGrid( $post_data ) ;
	
	case 'promo_getCalendarAccounts' :
	return specWbMrfoxy_promo_getCalendarAccounts( $post_data ) ;
	
	case 'promo_getSideGraph' :
	return specWbMrfoxy_promo_getSideGraph($post_data);
	case 'promo_getSideBenchmark' :
	return specWbMrfoxy_promo_getSideBenchmark($post_data);
	case 'promo_getSideBillback' :
	return specWbMrfoxy_promo_getSideBillback($post_data);
	
	case 'promo_formEval' :
	return specWbMrfoxy_promo_formEval($post_data);
	case 'promo_formSubmit' :
	return specWbMrfoxy_promo_formSubmit($post_data);
	
	case 'promo_close' :
	return specWbMrfoxy_promo_close($post_data);
	case 'promo_csack' :
	return specWbMrfoxy_promo_csack($post_data);
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
	case 'promo_setBaseline' :
	return specWbMrfoxy_promo_setBaseline($post_data);
	
	case 'promo_getAttachments' :
	return specWbMrfoxy_promo_getAttachments($post_data);
	case 'promo_uploadAttachment' :
	return specWbMrfoxy_promo_uploadAttachment($post_data);
	case 'promo_deleteAttachment' :
	return specWbMrfoxy_promo_deleteAttachment($post_data);
	
	
	case 'promo_exportXLS' :
	return specWbMrfoxy_promo_exportXLS($post_data);
	
	
	
	case 'stat_performance_getResult' :
	return specWbMrfoxy_stat_performance_getResult($post_data);
	case 'stat_exportXLS' :
	return specWbMrfoxy_stat_exportXLS($post_data);
	
	
	
	
	
	
	case 'finance_getCfgCrop' :
	return specWbMrfoxy_finance_getCfgCrop($post_data) ;
	case 'finance_getCfgCurrency' :
	return specWbMrfoxy_finance_getCfgCurrency($post_data) ;
	case 'finance_getCfgProdtag' :
	return specWbMrfoxy_finance_getCfgProdtag($post_data) ;
	case 'finance_getGrid' :
	return specWbMrfoxy_finance_getGrid($post_data) ;
	case 'finance_newRevision' :
	return specWbMrfoxy_finance_newRevision($post_data) ;
	case 'finance_setRevision' :
	return specWbMrfoxy_finance_setRevision($post_data) ;
	
	case 'finance_getBudgetBar' :
	return specWbMrfoxy_finance_getBudgetBar($post_data) ;
	
	case 'finance_getNationalAgreements' :
	return specWbMrfoxy_finance_getNationalAgreements($post_data) ;
	
	
	
	case 'auth_getRoles' :
	return specWbMrfoxy_auth_getRoles();
	
	
	
	case 'xls_getTableExport' :
	return specWbMrfoxy_xls_getTableExport($post_data);
	case 'xls_getFinanceDashboard' :
	return specWbMrfoxy_xls_getFinanceDashboard($post_data);
	
	default :
	return NULL ;
}
}

?>