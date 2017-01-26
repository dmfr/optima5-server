<?php
include("$server_root/modules/paracrm/include/paracrm.inc.php") ;
include("$server_root/modules/spec_rsi_recouveo/include/specRsiRecouveo.inc.php") ;


function backend_specific( $post_data )
{
switch( $post_data['_action'] )
{
	case 'cfg_getAuth' :
	return specRsiRecouveo_cfg_getAuth( $post_data ) ;
	case 'cfg_getConfig' :
	return specRsiRecouveo_cfg_getConfig( $post_data ) ;
	case 'cfg_doInit' :
	return specRsiRecouveo_cfg_doInit( $post_data ) ;
	
	case 'file_getRecords' :
	return specRsiRecouveo_file_getRecords( $post_data ) ;
	case 'file_setHeader' :
	return specRsiRecouveo_file_setHeader( $post_data ) ;
	case 'file_createForAction' :
	return specRsiRecouveo_file_createForAction( $post_data ) ;
	
	case 'file_searchSuggest' :
	return specRsiRecouveo_file_searchSuggest( $post_data ) ;
	
	case 'action_doFileAction' :
	return specRsiRecouveo_action_doFileAction( $post_data ) ;
	
	case 'account_open' :
	return specRsiRecouveo_account_open( $post_data ) ;
	case 'account_setAdrbook' :
	return specRsiRecouveo_account_setAdrbook( $post_data ) ;
	
	case 'doc_cfg_getTpl' :
	return specRsiRecouveo_doc_cfg_getTpl($post_data) ;
	case 'doc_getMailOut' :
	return specRsiRecouveo_doc_getMailOut($post_data) ;
	
	case 'util_htmlToPdf' :
		return specRsiRecouveo_util_htmlToPdf( $post_data ) ;
	
	default :
	return NULL ;
}
}

?>
