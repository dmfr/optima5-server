<?php
include("$server_root/modules/settings/include/settings.inc.php") ;


function backend_specific( $post_data )
{
switch( $post_data['_action'] )
{
	case 'password_change' :
		return settings_password_change( $post_data ) ;
}
}

?>