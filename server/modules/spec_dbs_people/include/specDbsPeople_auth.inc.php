<?php

function specDbsPeople_auth_lib_buildTree( $dbsPeopleAuthTree, $children ) {
	foreach( $children as $child ) {
		$sub_children = $child['children'] ;
		
		unset($child['children']) ;
		$dbsPeopleAuthTree_leaf = $dbsPeopleAuthTree->addLeaf( $child['nodeId'], $child ) ;
		
		if( $sub_children ) {
			specDbsPeople_auth_lib_buildTree( $dbsPeopleAuthTree_leaf, $sub_children ) ;
		}
	}
}

function specDbsPeople_auth_lib_getJsTree( $cfgParam_id ) {
	$ttmp = specDbsPeople_cfg_getTree( array('cfgParam_id'=>$cfgParam_id) ) ;
	return $ttmp['dataRoot'] ;
}

function specDbsPeople_auth_getTable( $post_data ) {
	global $_opDB ;
	
	if( !isset($_SESSION['login_data']['delegate_sdomainId']) ) {
		return array('success'=>true) ;
	}
	$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() ) ;
	if( $_SESSION['login_data']['delegate_sdomainId'] != $t->dbCurrent_getSdomainId() ) {
		return array('success'=>false) ;
	}
	
	$bibleJsTree_whse = specDbsPeople_auth_lib_getJsTree( 'WHSE' ) ;
	$bibleTree_whse = new GenericObjTree('t_&',array()) ;
	specDbsPeople_auth_lib_buildTree( $bibleTree_whse, $bibleJsTree_whse['children'] ) ;
	
	$bibleJsTree_team = specDbsPeople_auth_lib_getJsTree( 'TEAM' ) ;
	$bibleTree_team = new GenericObjTree('t_&',array()) ;
	specDbsPeople_auth_lib_buildTree( $bibleTree_team, $bibleJsTree_team['children'] ) ;
	
	
	$authPages = array() ;
	$authTable = array() ;
	
	$user_id = $_SESSION['login_data']['delegate_userId'] ;
	$query = "SELECT * FROM view_bible_USER_entry WHERE field_USER_ID='{$user_id}'" ;
	$result = $_opDB->query($query) ;
	if( ($arr = $_opDB->fetch_assoc($result)) == FALSE ) {
		return array('success'=>false) ;
	}
	
	$authPage = array() ;
	if( isJsonArr($arr['field_LINK_USERGROUP']) ) {
	foreach( json_decode($arr['field_LINK_USERGROUP'],true) as $auth_treenode ) {
		switch( $auth_treenode ) {
			case 'ADMIN' :
				$newPages = array('ADMIN','RH','CEQ','CEQ_DAY') ;
				break ;
			
			case 'RH' :
				$newPages = array('RH','CEQ','CEQ_DAY') ;
				break ;
			
			case 'CEQ_DAY' :
				$newPages = array('CEQ','CEQ_DAY') ;
				break ;
			
			case 'CEQ' :
				$newPages = array('CEQ') ;
				break ;
			
			default :
				$newPages = array() ;
				break ;
		}
		foreach( $newPages as $page ) {
			if( !in_array($page,$authPage) ) {
				$authPage[] = $page ;
			}
		}
	}
	}
	
	$arr_whse = array() ;
	if( isJsonArr($arr['field_LINK_WHSE']) ) {
	foreach( json_decode($arr['field_LINK_WHSE'],true) as $whse_treenode ) {
		foreach( $bibleTree_whse->getTree('t_'.$whse_treenode)->getAllObjMembers() as $obj ) {
			if( $obj['nodeType']=='entry' ) {
				$arr_whse[] = $obj['nodeKey'] ;
			}
		}
	}
	}
	
	$arr_team = array() ;
	if( isJsonArr($arr['field_LINK_TEAM']) ) {
	foreach( json_decode($arr['field_LINK_TEAM'],true) as $team_treenode ) {
		foreach( $bibleTree_team->getTree('t_'.$team_treenode)->getAllObjMembers() as $obj ) {
			if( $obj['nodeType']=='entry' ) {
				$arr_team[] = $obj['nodeKey'] ;
			}
		}
	}
	}
	
	return array(
		'success' => true,
		'authPage' => $authPage,
		'authWhse' => $arr_whse,
		'authTeam' => $arr_team
	) ;
}

?>
