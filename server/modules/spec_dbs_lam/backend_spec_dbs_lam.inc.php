<?php
include("$server_root/modules/paracrm/include/paracrm.inc.php") ;
include("$server_root/modules/spec_dbs_lam/include/specDbsLam.inc.php") ;


function backend_specific( $post_data )
{
switch( $post_data['_action'] )
{
	case 'cfg_getConfig' :
	return specDbsLam_cfg_getConfig( $post_data ) ;
	case 'cfg_getAuth' :
	return specDbsLam_cfg_getAuth( $post_data ) ;
	case 'cfg_applySoc' :
	return specDbsLam_cfg_applySoc( $post_data ) ;

	case 'stock_getGrid' :
	return specDbsLam_stock_getGrid( $post_data ) ;
	case 'stock_getStkMvts' :
	return specDbsLam_stock_getStkMvts( $post_data ) ;
	case 'stock_printEtiq' :
	return specDbsLam_stock_printEtiq( $post_data ) ;
	
	case 'prods_getGrid' :
	return specDbsLam_prods_getGrid( $post_data ) ;
	case 'prods_getStockGrid' :
	return specDbsLam_prods_getStockGrid( $post_data ) ;
	case 'prods_doRelocate' :
	return specDbsLam_prods_doRelocate( $post_data ) ;
	
	case 'queryspec' :
	session_write_close() ;
	return specDbsLam_queryspec( $post_data ) ;
	case 'queryspec_sync' :
	return specDbsLam_queryspecSync( $post_data ) ;
	
	case 'transfer_getTransfer' :
	return specDbsLam_transfer_getTransfer( $post_data ) ;
	case 'transfer_getTransferLig' :
	return specDbsLam_transfer_getTransferLig( $post_data ) ;
	case 'transfer_addStock' :
	return specDbsLam_transfer_addStock( $post_data ) ;
	case 'transfer_removeStock' :
	return specDbsLam_transfer_removeStock( $post_data ) ;
	case 'transfer_setFlag' :
	return specDbsLam_transfer_setFlag( $post_data ) ;
	case 'transfer_printDoc' :
	return specDbsLam_transfer_printDoc( $post_data ) ;
	case 'transfer_createDoc' :
	return specDbsLam_transfer_createDoc( $post_data ) ;
	case 'transfer_deleteDoc' :
	return specDbsLam_transfer_deleteDoc( $post_data ) ;
	case 'transfer_rollbackStep' :
	return specDbsLam_transfer_rollbackStep( $post_data ) ;
	
	case 'transfer_saveReject' :
	return specDbsLam_transfer_saveReject( $post_data ) ;
	case 'transfer_commitAdrTmp' :
	return specDbsLam_transfer_commitAdrTmp( $post_data ) ;
	case 'transfer_commitAdrFinal' :
	return specDbsLam_transfer_commitAdrFinal( $post_data ) ;
	case 'transfer_commitAdrFinalForwardSplit' :
	return specDbsLam_transfer_commitAdrFinalForwardSplit( $post_data ) ;
	case 'transfer_allocAdrFinal' :
	return specDbsLam_transfer_allocAdrFinal( $post_data ) ;
	case 'transfer_unallocAdrFinal' :
	return specDbsLam_transfer_unallocAdrFinal( $post_data ) ;
	
	case 'util_htmlToPdf' :
	return specDbsLam_util_htmlToPdf($post_data) ;
	
	default :
	return NULL ;
}
}

?>
