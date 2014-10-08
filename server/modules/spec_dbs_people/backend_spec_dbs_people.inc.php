<?php
include("$server_root/modules/paracrm/include/paracrm.inc.php") ;
include("$server_root/modules/spec_dbs_people/include/specDbsPeople.inc.php") ;


function backend_specific( $post_data )
{
switch( $post_data['_action'] )
{
	case 'RH_getGrid' :
	session_write_close() ;
	return specDbsPeople_RH_getGrid( $post_data ) ;
	case 'RH_setPeople' :
	return specDbsPeople_RH_setPeople( $post_data ) ;
	
	
	case 'Real_getData' :
	return specDbsPeople_Real_getData( $post_data ) ;
	case 'Real_actionDay' :
	return specDbsPeople_Real_actionDay( $post_data ) ;
	case 'Real_exceptionDaySet' :
	return specDbsPeople_Real_exceptionDaySet( $post_data ) ;
	case 'Real_saveRecord' :
	return specDbsPeople_Real_saveRecord( $post_data ) ;
	
	case 'Real_RhAbsLoad' :
	return specDbsPeople_Real_RhAbsLoad( $post_data ) ;
	case 'Real_RhAbsSave' :
	return specDbsPeople_Real_RhAbsSave( $post_data ) ;
	case 'Real_RhAbsDownload' :
	return specDbsPeople_Real_RhAbsDownload( $post_data ) ;
	
	
	case 'cfg_getTree' :
	return specDbsPeople_cfg_getTree( $post_data ) ;
	case 'cfg_getCfgBibles' :
	return specDbsPeople_cfg_getCfgBibles( $post_data ) ;
	case 'cfg_getPeopleFields' :
	return specDbsPeople_cfg_getPeopleFields( $post_data ) ;
	case 'cfg_getPeopleCalcAttributes' :
	return specDbsPeople_cfg_getPeopleCalcAttributes( $post_data ) ;
	
	
	case 'query_getLibrary' :
	return specDbsPeople_query_getLibrary( $post_data ) ;
	case 'query_getResult' :
	return specDbsPeople_query_getResult( $post_data ) ;
	case 'query_exportXLS' :
	return specDbsPeople_query_exportXLS( $post_data ) ;
	case 'query_getResultXLS' :
	return specDbsPeople_query_getResultXLS( $post_data ) ;
	
	
	case 'auth_getTable' :
	return specDbsPeople_auth_getTable( $post_data ) ;
	
	
	default :
	return NULL ;
}
}

?>