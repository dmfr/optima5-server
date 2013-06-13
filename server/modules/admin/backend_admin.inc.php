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
	
	default :
	return NULL ;
}
}

?>