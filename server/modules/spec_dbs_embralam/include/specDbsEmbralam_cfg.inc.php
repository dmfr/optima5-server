<?php

function specDbsEmbralam_cfg_getStockAttributes() {
	$return_fields = specDbsEmbralam_lib_stockAttributes_getStockAttributes() ;
	if( !is_array($return_fields) ) {
		return array('success'=>false) ;
	}
	return array('success'=>true, 'data'=>$return_fields) ;
}

function specDbsEmbralam_cfg_getAuth( $post_data ) {
	global $_opDB ;
	
	if( !isset($_SESSION['login_data']['delegate_sdomainId']) ) {
		return array('success'=>true) ;
	}
	$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() ) ;
	if( $_SESSION['login_data']['delegate_sdomainId'] != $t->dbCurrent_getSdomainId() ) {
		return array('success'=>false) ;
	}
	
	$user_id = $_SESSION['login_data']['delegate_userId'] ;
	$query = "SELECT * FROM view_bible_USER_entry WHERE field_USER_ID='{$user_id}'" ;
	$result = $_opDB->query($query) ;
	if( ($arr = $_opDB->fetch_assoc($result)) == FALSE ) {
		return array('success'=>false) ;
	}
	
	$authPage = array() ;
	$user_class = $arr['treenode_key'] ;
	switch( $user_class ) {
		case 'ADMIN' :
			$authPage = array('ADMIN','STD') ;
			break ;
		
		case 'STD' :
			$authPage = array('STD') ;
			break ;
	}
	
	return array(
		'success' => true,
		'authPage' => $authPage
	) ;
}

?>