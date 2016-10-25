<?php

function specRsiRecouveo_cfg_doInit( $post_data ) {
	global $_opDB ;
	
	if( isset($_SESSION['login_data']['delegate_sdomainId']) ) {
		return array('success'=>true) ;
	}
	//specRsiRecouveo_lib_calc_perf() ;
	return array('success'=>true) ;
}


function specRsiRecouveo_cfg_getAuth( $post_data ) {
	global $_opDB ;
	
	if( !isset($_SESSION['login_data']['delegate_sdomainId']) ) {
		return array('success'=>true) ;
	}
	
	return array(
		'success' => true,
		'authPage' => array()
	) ;
}


function specRsiRecouveo_cfg_getConfig() {
	if( isset($GLOBALS['cache_specRsiRecouveo_cfg']['getConfig']) ) {
		return array(
			'success'=>true,
			'data' => $GLOBALS['cache_specRsiRecouveo_cfg']['getConfig']
		);
	}
	
	global $_opDB ;
	
	
	$GLOBALS['cache_specRsiRecouveo_cfg']['getConfig'] = array();

	return array('success'=>true, 'data'=>$GLOBALS['cache_specRsiRecouveo_cfg']['getConfig'])  ;
}







?>
