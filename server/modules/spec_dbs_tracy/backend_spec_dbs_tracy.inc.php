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
	case 'cfg_doInit' :
	return specDbsTracy_cfg_doInit( $post_data ) ;
	
	case 'order_getRecords' :
	session_write_close() ;
	return specDbsTracy_order_getRecords( $post_data ) ;
	case 'order_setHeader' :
	return specDbsTracy_order_setHeader( $post_data ) ;
	case 'order_setWarning' :
	return specDbsTracy_order_setWarning( $post_data ) ;
	case 'order_setKpi' :
	return specDbsTracy_order_setKpi( $post_data ) ;
	case 'order_setStep' :
	return specDbsTracy_order_setStep( $post_data ) ;
	case 'order_stepValidate' :
	return specDbsTracy_order_stepValidate( $post_data ) ;
	case 'order_delete' :
	return specDbsTracy_order_delete( $post_data ) ;
	case 'order_download' :
	session_write_close() ;
	return specDbsTracy_order_download( $post_data ) ;
	
	case 'trspt_getRecords' :
	session_write_close() ;
	return specDbsTracy_trspt_getRecords( $post_data ) ;
	case 'trspt_setHeader' :
	return specDbsTracy_trspt_setHeader( $post_data ) ;
	case 'trspt_orderAdd' :
	return specDbsTracy_trspt_orderAdd( $post_data ) ;
	case 'trspt_orderRemove' :
	return specDbsTracy_trspt_orderRemove( $post_data ) ;
	case 'trspt_eventAdd' :
	return specDbsTracy_trspt_eventAdd( $post_data ) ;
	case 'trspt_stepValidate' :
	return specDbsTracy_trspt_stepValidate( $post_data ) ;
	case 'trspt_delete' :
	return specDbsTracy_trspt_delete( $post_data ) ;
	case 'trspt_printDoc' :
	return specDbsTracy_trspt_printDoc( $post_data ) ;
	case 'trspt_download' :
	session_write_close() ;
	return specDbsTracy_trspt_download( $post_data ) ;
	
	case 'live_stepValidate' :
	return specDbsTracy_live_stepValidate( $post_data ) ;
	
	case 'attachments_uploadfile' :
	return specDbsTracy_attachments_uploadfile( $post_data ) ;
	case 'attachments_setAttachment' :
	return specDbsTracy_attachments_setAttachment( $post_data ) ;
	case 'attachments_load' :
	return specDbsTracy_attachments_load( $post_data ) ;
	case 'attachments_delete' :
	return specDbsTracy_attachments_delete( $post_data ) ;
	case 'attachments_attach' :
	return specDbsTracy_attachments_attach( $post_data ) ;
	case 'attachments_detach' :
	return specDbsTracy_attachments_detach( $post_data ) ;
	case 'attachments_downloadPdf' :
	return specDbsTracy_attachments_downloadPdf( $post_data ) ;
	
	case 'attachments_getInbox' :
	return specDbsTracy_attachments_getInbox( $post_data ) ;
	
	case 'upload' :
	return specDbsTracy_upload($post_data) ;
	case 'reportList' :
	return specDbsTracy_reportList($post_data) ;
	case 'report' :
	return specDbsTracy_report($post_data) ;
	
	default :
	return NULL ;
}
}

?>
