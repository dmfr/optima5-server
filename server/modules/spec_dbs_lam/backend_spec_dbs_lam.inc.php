<?php
include("$server_root/modules/paracrm/include/paracrm.inc.php") ;
include("$server_root/modules/spec_dbs_lam/include/specDbsLam.inc.php") ;


function backend_specific( $post_data )
{
switch( $post_data['_action'] )
{
	case 'cfg_getStockAttributes' :
	return specDbsLam_cfg_getStockAttributes( $post_data ) ;
	case 'cfg_getAuth' :
	return specDbsLam_cfg_getAuth( $post_data ) ;
	
	case 'live_goAdr' :
	return specDbsLam_live_goAdr( $post_data ) ;
	case 'live_loadMvt' :
	return specDbsLam_live_loadMvt( $post_data ) ;
	case 'live_deleteMvt' :
	return specDbsLam_live_deleteMvt( $post_data ) ;
	case 'live_getGrid' :
	return specDbsLam_live_getGrid( $post_data ) ;
	case 'live_goRelocate' :
	return specDbsLam_live_goRelocate( $post_data ) ;

	case 'stock_getGrid' :
	return specDbsLam_stock_getGrid( $post_data ) ;
	case 'stock_getMvts' :
	return specDbsLam_stock_getMvts( $post_data ) ;
	case 'stock_setRecord' :
	return specDbsLam_stock_setRecord( $post_data ) ;
	
	case 'prods_getGrid' :
	return specDbsLam_prods_getGrid( $post_data ) ;
	case 'prods_getMvtsGrid' :
	return specDbsLam_prods_getMvtsGrid( $post_data ) ;
	case 'prods_getStockGrid' :
	return specDbsLam_prods_getStockGrid( $post_data ) ;
	case 'prods_setRecord' :
	return specDbsLam_prods_setRecord( $post_data ) ;
	
	case 'upload' :
	return specDbsLam_upload( $post_data ) ;
	
	case 'queryspec' :
	return specDbsLam_queryspec( $post_data ) ;
	
	default :
	return NULL ;
}
}

?>