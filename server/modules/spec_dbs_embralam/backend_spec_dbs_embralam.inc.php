<?php
include("$server_root/modules/paracrm/include/paracrm.inc.php") ;
include("$server_root/modules/spec_dbs_embralam/include/specDbsEmbralam.inc.php") ;


function backend_specific( $post_data )
{
switch( $post_data['_action'] )
{
	case 'cfg_getStockAttributes' :
	return specDbsEmbralam_cfg_getStockAttributes( $post_data ) ;
	
	case 'live_goAdr' :
	return specDbsEmbralam_live_goAdr( $post_data ) ;
	case 'live_loadMvt' :
	return specDbsEmbralam_live_loadMvt( $post_data ) ;
	case 'live_deleteMvt' :
	return specDbsEmbralam_live_deleteMvt( $post_data ) ;
	case 'live_getGrid' :
	return specDbsEmbralam_live_getGrid( $post_data ) ;

	case 'stock_getGrid' :
	return specDbsPeople_stock_getGrid( $post_data ) ;
	case 'prods_getGrid' :
	return specDbsPeople_prods_getGrid( $post_data ) ;
	
	default :
	return NULL ;
}
}

?>