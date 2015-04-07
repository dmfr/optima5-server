<?php
include("$server_root/modules/paracrm/include/paracrm.inc.php") ;
include("$server_root/modules/spec_dbs_embramach/include/specDbsEmbramach.inc.php") ;


function backend_specific( $post_data )
{
switch( $post_data['_action'] )
{
	case 'mach_getGrid' :
	return specDbsEmbralam_mach_getGrid( $post_data ) ;
	
	default :
	return NULL ;
}
}

?>