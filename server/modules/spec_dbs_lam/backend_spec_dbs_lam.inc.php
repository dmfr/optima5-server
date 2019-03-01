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
	case 'stock_submitAdrAction' :
	return specDbsLam_stock_submitAdrAction( $post_data ) ;
	case 'stock_submitInvAction' :
	return specDbsLam_stock_submitInvAction( $post_data ) ;
	case 'stock_getLogs' :
	return specDbsLam_stock_getLogs( $post_data ) ;
	
	case 'prods_getGrid' :
	return specDbsLam_prods_getGrid( $post_data ) ;
	case 'prods_getIds' :
	return specDbsLam_prods_getIds( $post_data ) ;
	case 'prods_getStockGrid' :
	return specDbsLam_prods_getStockGrid( $post_data ) ;
	case 'prods_doRelocate' :
	return array('success'=>false) ;
	
	case 'queryspec' :
	session_write_close() ;
	return specDbsLam_queryspec( $post_data ) ;
	case 'queryspec_sync' :
	return specDbsLam_queryspecSync( $post_data ) ;
	
	case 'transfer_getTransfer' :
	return specDbsLam_transfer_getTransfer( $post_data ) ;
	case 'transfer_getTransferLig' :
	return specDbsLam_transfer_getTransferLig( $post_data ) ;
	case 'transfer_getTransferCdeLink' :
	return specDbsLam_transfer_getTransferCdeLink( $post_data ) ;
	case 'transfer_getTransferCdeNeed' :
	return specDbsLam_transfer_getTransferCdeNeed( $post_data ) ;
	case 'transfer_getTransferCdePack' :
	return specDbsLam_transfer_getTransferCdePack( $post_data ) ;
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
	case 'transfer_reopenDoc' :
	return specDbsLam_transfer_reopenDoc( $post_data ) ;
	case 'transfer_renameDoc' :
	return specDbsLam_transfer_renameDoc( $post_data ) ;
	case 'transfer_deleteDoc' :
	return specDbsLam_transfer_deleteDoc( $post_data ) ;
	
	case 'transfer_addCdeLink' :
	return specDbsLam_transfer_addCdeLink( $post_data ) ;
	case 'transfer_removeCdeLink' :
	return specDbsLam_transfer_removeCdeLink( $post_data ) ;
	case 'transfer_cdeStockAlloc' :
	return specDbsLam_transfer_cdeStockAlloc( $post_data ) ;
	case 'transfer_cdeStockUnalloc' :
	return specDbsLam_transfer_cdeStockUnalloc( $post_data ) ;
	case 'transfer_cdeAckStep' :
	return specDbsLam_transfer_cdeAckStep( $post_data ) ;
	case 'transfer_addCdePickingStock' :
	return specDbsLam_transfer_addCdePickingStock( $post_data ) ;
	case 'transfer_removeCdePickingStock' :
	return specDbsLam_transfer_removeCdePickingStock( $post_data ) ;
	case 'transfer_cdeShippingOut' :
	return specDbsLam_transfer_cdeShippingOut( $post_data ) ;
	
	case 'transfer_setAdr' :
	return specDbsLam_transfer_setAdr( $post_data ) ;
	case 'transfer_setCommit' :
	return specDbsLam_transfer_setCommit( $post_data ) ;
	case 'transfer_rollback' :
	return specDbsLam_transfer_rollback( $post_data ) ;
	case 'transfer_setOut' :
	return specDbsLam_transfer_setOut( $post_data ) ;
	
	case 'print_getDoc' :
	return specDbsLam_print_getDoc( $post_data ) ;
	
	case 'cde_getGrid' :
	return specDbsLam_cde_getGrid( $post_data ) ;
	
	case 'util_htmlToPdf' :
	return specDbsLam_util_htmlToPdf($post_data) ;
	
	case 'transferMission_getTransferLig' :
	return specDbsLam_transferMission_getTransferLig( $post_data ) ;
	case 'transferMission_getTransferSummary' :
	return specDbsLam_transferMission_getTransferSummary( $post_data ) ;
	
	case 'transferPacking_getPrinters' :
	return specDbsLam_transferPacking_getPrinters( $post_data ) ;
	case 'transferPacking_getSummary' :
	return specDbsLam_transferPacking_getSummary( $post_data ) ;
	case 'transferPacking_getSrcPending' :
	return specDbsLam_transferPacking_getSrcPending( $post_data ) ;
	case 'transferPacking_directCommit' :
	return specDbsLam_transferPacking_directCommit( $post_data ) ;
	case 'transferPacking_getPackingRecord' :
	return specDbsLam_transferPacking_getPackingRecord( $post_data ) ;
	
	case 'transferInput_setPdaSpec' :
	return specDbsLam_transferInput_setPdaSpec( $post_data ) ;
	case 'transferInput_getDocuments' :
	return specDbsLam_transferInput_getDocuments( $post_data ) ;
	case 'transferInput_processSql' :
	return specDbsLam_transferInput_processSql( $post_data ) ;
	case 'transferInput_submit' :
	return specDbsLam_transferInput_submit( $post_data ) ;
	
	case 'transfer_spool_transferCdePack' :
	return specDbsLam_transfer_spool_transferCdePack( $post_data ) ;
	
	case 'transferInputPo_setState' :
	return specDbsLam_transferInputPo_setState( $post_data ) ;
	case 'transferInputPo_getLigs' :
	return specDbsLam_transferInputPo_getLigs( $post_data ) ;
	case 'transferInputPo_setLig' :
	return specDbsLam_transferInputPo_setLig( $post_data ) ;
	
	default :
	return NULL ;
}
}

?>
