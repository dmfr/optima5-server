<?php
include("$server_root/modules/paracrm/include/paracrm.inc.php") ;
include("$server_root/modules/spec_abso_crm/include/specAbsoCrm.inc.php") ;


function backend_specific( $post_data )
{
switch( $post_data['_action'] )
{
	case 'dashboard_getMonth' :
	return specAbsoCrm_dashboard_getMonth( $post_data ) ;
	
	default :
	return NULL ;
}
}

?>