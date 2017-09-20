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
	case 'define_togglePublish' :
	return paracrm_define_togglePublish( $post_data );
	case 'define_truncate' :
	return paracrm_define_truncate( $post_data );
	case 'define_drop' :
	return paracrm_define_drop( $post_data );
	
	case 'data_getBibleCfg' :
	return paracrm_data_getBibleCfg( $post_data );
	
	case 'data_getBibleTree' :
	return paracrm_data_getBibleTree( $post_data );
	case 'data_getBibleTreeOne' :
	return paracrm_data_getBibleTreeOne( $post_data );
	case 'data_getBibleGrid' :
	//session_write_close() ;
	return paracrm_data_getBibleGrid( $post_data );
	case 'data_getBibleGrid_export' :
	session_write_close() ;
	return paracrm_data_getBibleGrid_export( $post_data );
	
	case 'data_editTransaction' :
	return paracrm_data_editTransaction( $post_data ) ;
	
	case 'data_deleteRecord' :
	return paracrm_data_deleteRecord( $post_data ) ;
	
	case 'data_bibleAssignTreenode' :
	return paracrm_data_bibleAssignTreenode( $post_data ) ;
	case 'data_bibleAssignParentTreenode' :
	return paracrm_data_bibleAssignParentTreenode( $post_data ) ;
	
	
	case 'data_getFileGrid_config' :
	return paracrm_data_getFileGrid_config( $post_data );
	case 'data_getFileGrid_data' :
	return paracrm_data_getFileGrid_data( $post_data );
	case 'data_getFileGrid_exportFile' :
	session_write_close() ;
	return paracrm_data_getFileGrid_exportFile( $post_data );
	case 'data_getFileGrid_exportGallery' :
	session_write_close() ;
	return paracrm_data_getFileGrid_exportGallery( $post_data );
	case 'data_setFileGrid_raw' :
	return paracrm_data_setFileGrid_raw( $post_data );
	
	
	case 'data_getTableGrid_config' :
	return paracrm_data_getTableGrid_config( $post_data );
	case 'data_getTableGrid_data' :
	return paracrm_data_getTableGrid_data( $post_data );
	case 'data_getTableGrid_export' :
	return paracrm_data_getTableGrid_export( $post_data );
	case 'data_editTableGrid_new' :
	return paracrm_data_editTableGrid_new( $post_data );
	case 'data_editTableGrid_modify' :
	return paracrm_data_editTableGrid_modify( $post_data );
	case 'data_editTableGrid_delete' :
	return paracrm_data_editTableGrid_delete( $post_data );
	
	
	case 'data_importTransaction' :
	return paracrm_data_importTransaction( $post_data ) ;
	case 'data_importDirect' :
	return paracrm_data_importDirect( $post_data ) ;
	
	
	case 'queries_getToolbarData' :
	return paracrm_queries_getToolbarData( $post_data ) ;
	case 'queries_builderTransaction' :
	return paracrm_queries_builderTransaction( $post_data ) ;
	case 'queries_mergerTransaction' :
	return paracrm_queries_mergerTransaction( $post_data ) ;
	case 'queries_qwebTransaction' :
	return paracrm_queries_qwebTransaction( $post_data ) ;
	case 'queries_qbookTransaction' :
	return paracrm_queries_qbookTransaction( $post_data ) ;
	case 'queries_qsqlTransaction' :
	if( $post_data['_subaction']=='metadata' ) {
		session_write_close() ;
	}
	return paracrm_queries_qsqlTransaction( $post_data ) ;
	case 'queries_gridTemplate' :
	return paracrm_queries_gridTemplate( $post_data );
	case 'queries_qsqlAutorun_getLogs' :
	return paracrm_queries_qsqlAutorun_getLogs( $post_data );
	
	case 'queries_direct' :
	return paracrm_queries_direct( $post_data );
	case 'queries_direct_getLogs' :
	return paracrm_queries_direct_getLogs( $post_data );
	
	
	case 'auth_android_getDevicesList' :
	return paracrm_auth_android_getDevicesList( $post_data ) ;
	case 'auth_android_setDevice' :
	return paracrm_auth_android_setDevice( $post_data ) ;
	
	case 'auth_delegate_getConfig' :
	return paracrm_auth_delegate_getConfig( $post_data ) ;
	case 'auth_delegate_setConfig' :
	return paracrm_auth_delegate_setConfig( $post_data ) ;
	case 'auth_delegate_getLog' :
	return paracrm_auth_delegate_getLog( $post_data ) ;
	
	
	
	
	case 'android_getDbImage' :
	case 'android_getDbImageTab' :
	return paracrm_android_getDbImage( $post_data );
	case 'android_getDbImageTimestamp' :
	return paracrm_android_getDbImageTimestamp( $post_data );
	
	case 'android_syncPush' :
	return paracrm_android_syncPush( $post_data );
	case 'android_syncPull' :
	return paracrm_android_syncPull( $post_data );
	
	case 'android_postBinary' :
	return paracrm_android_postBinary( $post_data );
	
	case 'android_getFileGrid_data' :
	return paracrm_android_getFileGrid_data( $post_data );
	
	case 'android_imgPull' :
	session_write_close() ;
	return paracrm_android_imgPull( $post_data );
	
	case 'android_query_fetchResult' :
	return paracrm_android_query_fetchResult( $post_data );
	
	
	
	default :
	return NULL ;
}
}

?>
