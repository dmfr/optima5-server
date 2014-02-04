<?php
function specWbMrfoxy_auth_getTable( $post_data ) {
	global $_opDB ;
	
	$authTable = array() ;
	
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
	
	$query = "SELECT * FROM view_bible_USER_entry" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$user_code = $arr['field_USER_CODE'] ;
		
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
		
		if( isJsonArr($arr['field_LINK_ROLE']) ) {
		foreach( json_decode($arr['field_LINK_ROLE'],true) as $role_code ) {
			foreach( $arr_countries as $country_code ) {
				$authTable[] = $user_code.'@'.$country_code.'@'.$role_code ;
			}
		}
		}
	}
	
	return array('success'=>true,'data'=>$authTable) ;
}

?>