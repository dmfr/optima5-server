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
	case 'file_createForAction' :
	return specRsiRecouveo_file_createForAction( $post_data ) ;
	case 'file_getScenarioLine' :
	return specRsiRecouveo_file_getScenarioLine( $post_data ) ;
	case 'file_createRecordTemp' :
	return specRsiRecouveo_file_createRecordTemp( $post_data ) ;
	case 'file_allocateRecordTemp' :
	return specRsiRecouveo_file_allocateRecordTemp( $post_data ) ;
	
	case 'file_searchSuggest' :
	return specRsiRecouveo_file_searchSuggest( $post_data ) ;
	
	case 'action_doFileAction' :
	return specRsiRecouveo_action_doFileAction( $post_data ) ;
	
	case 'account_open' :
	return specRsiRecouveo_account_open( $post_data ) ;
	case 'account_setAdrbook' :
	return specRsiRecouveo_account_setAdrbook( $post_data ) ;
	case 'account_setAdrbookPriority' :
	return specRsiRecouveo_account_setAdrbookPriority( $post_data ) ;
	
	case 'doc_cfg_getTpl' :
	return specRsiRecouveo_doc_cfg_getTpl($post_data) ;
	case 'doc_getMailOut' :
	return specRsiRecouveo_doc_getMailOut($post_data) ;
	case 'doc_uploadFile' :
	return specRsiRecouveo_doc_uploadFile($post_data) ;
	case 'doc_delete' :
	return specRsiRecouveo_doc_delete($post_data) ;
	case 'doc_getPreview' :
	return specRsiRecouveo_doc_getPreview($post_data) ;
	case 'doc_getPage' :
	return specRsiRecouveo_doc_getPage($post_data) ;
	case 'doc_getEnvGrid' :
	return specRsiRecouveo_doc_getEnvGrid($post_data) ;
	
	case 'util_htmlToPdf' :
		return specRsiRecouveo_util_htmlToPdf( $post_data ) ;
		
	case 'config_loadMeta' :
		return specRsiRecouveo_config_loadMeta( $post_data ) ;
	case 'config_saveMeta' :
		return specRsiRecouveo_config_saveMeta( $post_data ) ;
	case 'config_getUsers' :
		return specRsiRecouveo_config_getUsers( $post_data ) ;
	case 'config_setUser' :
		return specRsiRecouveo_config_setUser( $post_data ) ;
	case 'config_getScenarios' :
		return specRsiRecouveo_config_getScenarios( $post_data ) ;
	case 'config_setScenario' :
		return specRsiRecouveo_config_setScenario( $post_data ) ;
	case 'config_getSocs' :
		return specRsiRecouveo_config_getSocs( $post_data ) ;
	case 'config_setSoc' :
		return specRsiRecouveo_config_setSoc( $post_data ) ;
	
	case 'xls_create' :
		return specRsiRecouveo_xls_create( $post_data ) ;
		
	case 'recordgroup_list' :
		return specRsiRecouveo_recordgroup_list( $post_data ) ;
	case 'recordgroup_input_get' :
		return specRsiRecouveo_recordgroup_input_get( $post_data ) ;
	case 'recordgroup_input_set' :
		return specRsiRecouveo_recordgroup_input_set( $post_data ) ;
	case 'recordgroup_assoc_get' :
		return specRsiRecouveo_recordgroup_assoc_get( $post_data ) ;
	case 'recordgroup_assoc_set' :
		return specRsiRecouveo_recordgroup_assoc_set( $post_data ) ;
		
	case 'dev_getNotepad' :
		return specRsiRecouveo_dev_getNotepad( $post_data ) ;
	case 'dev_setNotepadNote' :
		return specRsiRecouveo_dev_setNotepadNote( $post_data ) ;
	case 'dev_getNotepadClass' :
		return specRsiRecouveo_dev_getNotepadClass( $post_data ) ;
	
	case 'bank_getRecords' :
		return specRsiRecouveo_bank_getRecords( $post_data ) ;
	case 'bank_setAlloc' :
		return specRsiRecouveo_bank_setAlloc( $post_data ) ;
		
	case 'upload' :
		return specRsiRecouveo_upload( $post_data ) ;
	
	default :
	return NULL ;
}
}

?>
