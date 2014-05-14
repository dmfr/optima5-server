<?php
function specWbMrfoxy_auth_getRoles() {
	global $_opDB ;
	
	if( !isset($_SESSION['login_data']['delegate_sdomainId']) ) {
		return array('success'=>true) ;
	}
	$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() ) ;
	if( $_SESSION['login_data']['delegate_sdomainId'] != $t->dbCurrent_getSdomainId() ) {
		return array('success'=>false) ;
	}
	
	$user_id = $_SESSION['login_data']['delegate_userId'] ;
	$query = "SELECT * FROM view_bible__USER_entry WHERE field_USER_ID='{$user_id}'" ;
	$result = $_opDB->query($query) ;
	if( ($arr = $_opDB->fetch_assoc($result)) == FALSE ) {
		return array('success'=>false) ;
	}
	
	$arr_roles = array() ;
	if( isJsonArr($arr['field_LINK_ROLE']) ) {
	foreach( json_decode($arr['field_LINK_ROLE'],true) as $role_code ) {
		$arr_roles[] = $role_code ;
	}
	}
	
	return array('success'=>true,'data'=>$arr_roles) ;
}

function specWbMrfoxy_auth_lib_getCountries() {
	global $_opDB ;
	
	if( !isset($_SESSION['login_data']['delegate_sdomainId']) ) {
		return NULL ;
	}
	$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() ) ;
	if( $_SESSION['login_data']['delegate_sdomainId'] != $t->dbCurrent_getSdomainId() ) {
		return array() ;
	}
	
	$bibleTree_user = specWbMrfoxy_lib_getBibleTree( '_COUNTRY' ) ;
	$bible_treenode_countries = array() ;
	$query = "SELECT * FROM view_bible__COUNTRY_entry" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$treenode_key = $arr['treenode_key'] ;
		$country_code = $arr['entry_key'] ;
		
		if( !isset($bible_treenode_countries[$treenode_key]) ) {
			$bible_treenode_countries[$treenode_key] = array() ;
		}
		$bible_treenode_countries[$treenode_key][] = $country_code ;
	}
	
	
	$user_id = $_SESSION['login_data']['delegate_userId'] ;
	$query = "SELECT * FROM view_bible__USER_entry WHERE field_USER_ID='{$user_id}'" ;
	$result = $_opDB->query($query) ;
	if( ($arr = $_opDB->fetch_assoc($result)) == FALSE ) {
		return array('success'=>false) ;
	}
	
	$arr_countries = array() ;
	if( isJsonArr($arr['field_LINK_COUNTRY']) ) {
	foreach( json_decode($arr['field_LINK_COUNTRY'],true) as $country_treenode ) {
		foreach( $bibleTree_user->getTree($country_treenode)->getAllMembers() as $treenode_key ) {
			if( isset($bible_treenode_countries[$treenode_key]) ) {
				$arr_countries = array_merge($arr_countries,$bible_treenode_countries[$treenode_key]) ;
			}
		}
	}
	}
	
	return $arr_countries ;
}


?>