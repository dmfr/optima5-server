<?php
include("$server_root/modules/paracrm/include/paracrm.inc.php") ;


function backend_specific( $post_data )
{
switch( $post_data['_action'] )
{
	case 'define_getMainToolbar' :
	return paracrm_define_getMainToolbar( $post_data ) ;
	
	case 'define_manageTransaction' :
	return paracrm_define_manageTransaction( $post_data );
	
	case 'data_getBibleCfg' :
	return paracrm_data_getBibleCfg( $post_data );
	
	case 'data_getBibleTree' :
	return paracrm_data_getBibleTree( $post_data );
	case 'data_getBibleGrid' :
	//session_write_close() ;
	return paracrm_data_getBibleGrid( $post_data );
	
	case 'data_editTransaction' :
	return paracrm_data_editTransaction( $post_data ) ;
	
	case 'data_deleteRecord' :
	return paracrm_data_deleteRecord( $post_data ) ;
	
	
	
	
	case 'data_getFileGrid_config' :
	return paracrm_data_getFileGrid_config( $post_data );
	case 'data_getFileGrid_data' :
	return paracrm_data_getFileGrid_data( $post_data );
	
	
	
	default :
	return NULL ;
}
}

?>