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
	
	case 'file_getList' :
	return specDbsTracy_files_getList( $post_data ) ;
	case 'file_getFile' :
	return specDbsTracy_files_getFile( $post_data ) ;
	
	default :
	return NULL ;
}
}

?>
