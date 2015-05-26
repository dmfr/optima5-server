<?php
include("$server_root/modules/paracrm/include/paracrm.inc.php") ;
include("$server_root/modules/spec_dbs_embramach/include/specDbsEmbramach.inc.php") ;


function backend_specific( $post_data )
{
switch( $post_data['_action'] )
{
	case 'mach_getGridCfg' :
	return specDbsEmbralam_mach_getGridCfg( $post_data ) ;
	case 'mach_getGridData' :
	return specDbsEmbralam_mach_getGridData( $post_data ) ;
	
	case 'mach_uploadSource' :
	return specDbsEmbralam_mach_uploadSource( $post_data ) ;
	
	default :
	return NULL ;
}
}

?>