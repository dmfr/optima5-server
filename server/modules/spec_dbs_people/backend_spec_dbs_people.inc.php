<?php
include("$server_root/modules/paracrm/include/paracrm.inc.php") ;
include("$server_root/modules/spec_dbs_people/include/specDbsPeople.inc.php") ;


function backend_specific( $post_data )
{
switch( $post_data['_action'] )
{
	case 'RH_getGrid' :
	return specDbsPeople_RH_getGrid( $post_data ) ;
	case 'RH_setPeople' :
	return specDbsPeople_RH_setPeople( $post_data ) ;
	
	case 'Real_getData' :
	return specDbsPeople_Real_getData( $post_data ) ;
	case 'Real_openDay' :
	return specDbsPeople_Real_openDay( $post_data ) ;
	case 'Real_saveRecord' :
	return specDbsPeople_Real_saveRecord( $post_data ) ;
	
	case 'cfg_getTree' :
	return specDbsPeople_cfg_getTree( $post_data ) ;
	case 'cfg_getCfgBibles' :
	return specDbsPeople_cfg_getCfgBibles( $post_data ) ;
	
	
	default :
	return NULL ;
}
}

?>