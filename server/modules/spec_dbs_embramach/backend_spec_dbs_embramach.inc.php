<?php
include("$server_root/modules/paracrm/include/paracrm.inc.php") ;
include("$server_root/modules/spec_dbs_embramach/include/specDbsEmbramach.inc.php") ;


function backend_specific( $post_data )
{
switch( $post_data['_action'] )
{
	case 'cfg_getAuth' :
	return specDbsEmbramach_cfg_getAuth( $post_data ) ;
	
	case 'mach_getGridCfg' :
	return specDbsEmbramach_mach_getGridCfg( $post_data ) ;
	case 'mach_getGridData' :
	return specDbsEmbramach_mach_getGridData( $post_data ) ;
	case 'mach_saveGridRow' :
	return specDbsEmbramach_mach_saveGridRow( $post_data ) ;
	
	case 'upload' :
	case 'mach_upload' :
	return specDbsEmbramach_upload( $post_data ) ;
	
	case 'stats_getPicking' :
	return specDbsEmbramach_stats_getPicking( $post_data ) ;
	
	default :
	return NULL ;
}
}

?>