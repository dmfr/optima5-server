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
	case 'RH_getCalcAttributeSetupFile' :
	session_write_close() ;
	return specDbsPeople_RH_getCalcAttributeSetupFile( $post_data ) ;
	case 'RH_setCalcAttributeSetupFile' :
	session_write_close() ;
	return specDbsPeople_RH_setCalcAttributeSetupFile( $post_data ) ;
	
	
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
	case 'cfg_getLinks' :
	return specDbsPeople_cfg_getLinks( $post_data ) ;
	
	
	case 'query_getLibrary' :
	return specDbsPeople_query_getLibrary( $post_data ) ;
	case 'query_getResult' :
	return specDbsPeople_query_getResult( $post_data ) ;
	case 'query_exportXLS' :
	return specDbsPeople_query_exportXLS( $post_data ) ;
	case 'query_getResultXLS' :
	return specDbsPeople_query_getResultXLS( $post_data ) ;
	
	
	case 'upload_getLibrary' :
	return specDbsPeople_upload_getLibrary( $post_data ) ;
	case 'upload_do' :
	return specDbsPeople_upload_do( $post_data ) ;
	
	
	case 'auth_getTable' :
	return specDbsPeople_auth_getTable( $post_data ) ;
	
	
	case 'Forecast_setCfgWhse' :
	return specDbsPeople_Forecast_setCfgWhse( $post_data ) ;
	case 'Forecast_buildResources' :
	return specDbsPeople_Forecast_buildResources( $post_data ) ;
	case 'Forecast_getWeeks' :
	return specDbsPeople_Forecast_getWeeks( $post_data ) ;
	case 'Forecast_saveWeekRecord' :
	return specDbsPeople_Forecast_saveWeekRecord( $post_data ) ;
	
	default :
	return NULL ;
}
}

?>
