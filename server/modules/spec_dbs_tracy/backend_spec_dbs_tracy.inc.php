<?php
include("$server_root/modules/paracrm/include/paracrm.inc.php") ;
include("$server_root/modules/spec_dbs_tracy/include/specDbsTracy.inc.php") ;


function backend_specific( $post_data )
{
switch( $post_data['_action'] )
{
	case 'cfg_getAuth' :
	return specDbsTracy_cfg_getAuth( $post_data ) ;
	case 'cfg_getConfig' :
	return specDbsTracy_cfg_getConfig( $post_data ) ;
	
	case 'order_getRecords' :
	return specDbsTracy_order_getRecords( $post_data ) ;
	case 'order_setHeader' :
	return specDbsTracy_order_setHeader( $post_data ) ;
	
	case 'trspt_getRecords' :
	return specDbsTracy_trspt_getRecords( $post_data ) ;
	
	default :
	return NULL ;
}
}

?>
