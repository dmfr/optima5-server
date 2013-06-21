<?php
include("$server_root/modules/admin/include/admin.inc.php") ;


function backend_specific( $post_data )
{
switch( $post_data['_action'] )
{
	case 'sdomains_getList' :
		return admin_sdomains_getList( $post_data ) ;
	case 'sdomains_setSdomain' :
		return admin_sdomains_setSdomain( $post_data ) ;
	case 'sdomains_deleteSdomain' :
		return admin_sdomains_deleteSdomain( $post_data ) ;
	
	case 'auth_users_getList' :
		return admin_auth_users_getList( $post_data ) ;
	case 'auth_groups_getList' :
		return admin_auth_groups_getList( $post_data ) ;
	case 'auth_uglinks_set' :
		return admin_auth_uglinks_set( $post_data ) ;
		
	case 'auth_getSdomainActionsTree' :
		return admin_auth_getSdomainActionsTree( $post_data ) ;
	case 'auth_setGroup' :
		return admin_auth_setGroup( $post_data ) ;
	case 'auth_deleteGroup' :
		return admin_auth_deleteGroup( $post_data ) ;
	
	case 'auth_setUser' :
		return admin_auth_setUser( $post_data ) ;
	case 'auth_deleteUser' :
		return admin_auth_deleteUser( $post_data ) ;
	
	default :
	return NULL ;
}
}

?>