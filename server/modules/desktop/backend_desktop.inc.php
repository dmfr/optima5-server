<?php
include("$server_root/modules/desktop/include/desktop.inc.php") ;


function backend_specific( $post_data )
{
switch( $post_data['_action'] )
{
	case 'config_getRecord' :
	return desktop_config_getRecord( $post_data ) ;
	
	case 'db_updateSchema' :
	return desktop_db_updateSchema( $post_data ) ;
	
	default :
	return NULL ;
}
}

?>