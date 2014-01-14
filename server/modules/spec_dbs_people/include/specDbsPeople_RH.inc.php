<?php

function specDbsPeople_RH_getGrid($post_data) {
	global $_opDB ;
	
	$TAB = array() ;
	$query = "SELECT * FROM view_bible_RH_PEOPLE_tree t, view_bible_RH_PEOPLE_entry e
					WHERE t.treenode_key=e.treenode_key ORDER BY e.field_PPL_FULLNAME" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$row = array() ;
		$row['people_name'] = $arr['field_PPL_FULLNAME'] ;
		$row['people_techid'] = $arr['field_PPL_TECHID'] ;
		if( rand(0,10) < 5 ) {
			$row['whse_txt'] = 'Amiens Nord - Batiment 1' ;
		} else {
			$row['whse_txt'] = 'Amiens Nord - Batiment 2' ;
		}
		$row['role_txt'] = 'Préparateur' ;
		
		$rand = rand(0,10) ;
		if( $rand > 9 ) {
			$row['team_txt'] = 'WE1' ;
		} elseif( $rand > 8 ) {
			$row['team_txt'] = 'WE2' ;
		} elseif( $rand > 4 ) {
			$row['team_txt'] = 'Matin / APM' ;
		} else {
			$row['team_txt'] = 'APM / Matin' ;
		}
		
		$TAB[] = $row ;
	}

	return array('success'=>true, 'data'=>$TAB) ;
}

function specDbsPeople_RH_getCfgData() {
	global $_opDB ;
	
	$TAB = array() ;
	
	$query = "SELECT field_ROLE_CODE, field_ROLE_TXT FROM view_bible_CFG_ROLE_entry WHERE treenode_key='IN' ORDER BY field_ROLE_CODE " ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$TAB['ROLE'][] = array('id'=>$arr[0],'text'=>$arr[1]) ;
	}
	$query = "SELECT field_ROLE_CODE, field_ROLE_TXT FROM view_bible_CFG_ROLE_entry WHERE treenode_key='OUT' ORDER BY field_ROLE_CODE" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$TAB['ABS'][] = array('id'=>$arr[0],'text'=>$arr[1]) ;
	}
	
	$query = "SELECT field_WHSE_CODE, field_WHSE_TXT FROM view_bible_CFG_WHSE_entry ORDER BY field_WHSE_TXT" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$TAB['WHSE'][] = array('id'=>$arr[0],'text'=>$arr[1]) ;
	}
	
	$query = "SELECT field_TEAM_CODE, field_TEAM_TXT FROM view_bible_CFG_TEAM_entry ORDER BY field_TEAM_TXT" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$TAB['TEAM'][] = array('id'=>$arr[0],'text'=>$arr[1]) ;
	}
	
	return array('success'=>true, 'data'=>$TAB) ;
}

?>