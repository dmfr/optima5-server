<?php
include("$server_root/modules/paracrm/include/paracrm.inc.php") ;
include("$server_root/modules/spec_dbs_lam/include/specDbsLam.inc.php") ;


function backend_specific( $post_data )
{
switch( $post_data['_action'] )
{
	case 'cfg_getStockAttributes' :
	return specDbsLam_cfg_getStockAttributes( $post_data ) ;
	case 'cfg_getConfig' :
	return specDbsLam_cfg_getConfig( $post_data ) ;
	case 'cfg_getAuth' :
	return specDbsLam_cfg_getAuth( $post_data ) ;
	case 'cfg_applySoc' :
	return specDbsLam_cfg_applySoc( $post_data ) ;
	case 'cfg_getTree' :
	return specDbsLam_cfg_getTree( $post_data ) ;
	
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
	
	case 'transfer_getTransfer' :
	return specDbsLam_transfer_getTransfer( $post_data ) ;
	case 'transfer_getTransferLig' :
	return specDbsLam_transfer_getTransferLig( $post_data ) ;
	case 'transfer_addStock' :
	return specDbsLam_transfer_addStock( $post_data ) ;
	case 'transfer_removeStock' :
	return specDbsLam_transfer_removeStock( $post_data ) ;
	case 'transfer_printDoc' :
	return specDbsLam_transfer_printDoc( $post_data ) ;
	case 'transfer_createDoc' :
	return specDbsLam_transfer_createDoc( $post_data ) ;
	case 'transfer_deleteDoc' :
	return specDbsLam_transfer_deleteDoc( $post_data ) ;
	
	default :
	return NULL ;
}
}

?>