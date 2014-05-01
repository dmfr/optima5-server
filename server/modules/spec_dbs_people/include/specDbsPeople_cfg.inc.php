<?php

function specDbsPeople_cfg_getTree( $post_data ) {
	global $_opDB ;
	
	$cfgParam_id = $post_data['cfgParam_id'] ;
	
	switch( strtolower($cfgParam_id) ) {
		case 'whse' :
			$bible_code = 'CFG_WHSE' ;
			$field_txt_treenode = 'field_SITE_TXT' ;
			$field_txt_entry = 'field_WHSE_TXT' ;
			break ;
			
		case 'team' :
			$bible_code = 'CFG_TEAM' ;
			$field_txt_treenode = 'field_TEAM' ;
			$field_txt_entry = 'field_TEAM_TXT' ;
			break ;
			
		default :
			return ;
	}
	
	$view_name_tree = 'view_bible_'.$bible_code.'_tree' ;
	$view_name_entry = 'view_bible_'.$bible_code.'_entry' ;
	
	$tab_parentkey_nodes = array() ;
	$query = "SELECT * FROM $view_name_tree" ;
	$result = $_opDB->query($query);
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$record = array() ;
		$record['nodeId'] = 't_'.$arr['treenode_key'] ;
		$record['nodeType'] = 'treenode' ;
		$record['nodeKey'] = $arr['treenode_key'] ;
		$record['nodeText'] = $arr[$field_txt_treenode] ;
	
		$tab_parentkey_nodes[$arr['treenode_parent_key']][$arr['treenode_key']] = $record ;
	}
	$query = "SELECT * FROM $view_name_entry" ;
	$result = $_opDB->query($query);
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$record = array() ;
		$record['nodeId'] = 'e_'.$arr['entry_key'] ;
		$record['nodeType'] = 'entry' ;
		$record['nodeKey'] = $arr['entry_key'] ;
		$record['nodeText'] = $arr[$field_txt_entry] ;
	
		$tab_parentkey_nodes[$arr['treenode_key']][] = $record ;
	}
	
	/*
	$view_name_entry = 'view_bible_'.$bible_code.'_entry' ;
	$arr_treenode_nbEntries = array() ;
	$query = "select treenode_key, count(*) from $view_name_entry group by treenode_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE )
	{
		$arr_treenode_nbEntries[$arr[0]] = $arr[1] ;
	}
	*/
	
	foreach( $tab_parentkey_nodes as $treenode_parent_key => $arr1 )
	{
		foreach( $arr1 as $treenode_key => $record )
		{
			$tab_parentkey_nodes[$treenode_parent_key][$treenode_key] = $record ;
		}
		ksort($tab_parentkey_nodes[$treenode_parent_key]) ;
	}
	
	// print_r($tab_parentkey_nodes) ;
	
	$TAB_json = specDbsPeople_cfg_getTree_call( $tab_parentkey_nodes, '' ) ;
	//$TAB_json[] = array('field_PRODLINE'=>'POM','field_PRODLINEDESC'=>'Pom Juices','expanded'=>true,'children'=>array(array('field_PRODLINE'=>'POM_C','field_PRODLINEDESC'=>'Pom Cold','leaf'=>true),array('field_PRODLINE'=>'POM_H','field_PRODLINEDESC'=>'Pom Hot','leaf'=>true))) ;
	return array(
		'success'=>true,
		'dataRoot'=>array(
			'nodeId'=>'',
			'nodeKey'=>'',
			'nodeText'=>'<b>Toutes valeurs</b>',
			'expanded'=>true,
			'children'=>$TAB_json
		)
	) ;
}
function specDbsPeople_cfg_getTree_call( $tab_parentkey_nodes, $treenode_parent_key )
{
	global $_opDB ;
	
	$TAB_json = array() ;
	if( !$tab_parentkey_nodes[$treenode_parent_key] )
		return array() ;
	foreach( $tab_parentkey_nodes[$treenode_parent_key] as $treenode_key => $record )
	{
		if( $child_tab = specDbsPeople_cfg_getTree_call( $tab_parentkey_nodes, $treenode_key ) )
		{
			$record['expanded'] = true ;
			$record['children'] = $child_tab ;
		}
		else
		{
			$record['leaf'] = ( $record['nodeType'] == 'entry' ) ;
			$record['children'] = array() ;
		}
		$TAB_json[] = $record ;
	}
	return $TAB_json ;
}





function specDbsPeople_cfg_getCfgBibles() {
	global $_opDB ;
	
	$TAB = array() ;
	
	$query = "SELECT field_CONTRACT_CODE, field_CONTRACT_TXT FROM view_bible_CFG_CONTRACT_entry ORDER BY field_CONTRACT_CODE " ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$TAB['CONTRACT'][] = array('id'=>$arr[0],'text'=>$arr[1]) ;
	}
	
	$query = "SELECT field_ROLE_CODE, field_ROLE_TXT FROM view_bible_CFG_ROLE_entry ORDER BY field_ROLE_CODE " ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$TAB['ROLE'][] = array('id'=>$arr[0],'text'=>$arr[1]) ;
	}
	
	$query = "SELECT field_ABS_CODE, field_ABS_TXT FROM view_bible_CFG_ABS_entry ORDER BY field_ABS_CODE" ;
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

function specDbsPeople_tool_getContracts() {
	global $_opDB ;
	
	$TAB = array() ;
	$query = "SELECT * FROM view_bible_CFG_CONTRACT_entry" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$contract_code = $arr['field_CONTRACT_CODE'] ;
		
		$std_dayson = array() ;
		foreach( json_decode($arr['field_STD_DAYSON'],true) as $ISO8601_day ) {
			$std_dayson[$ISO8601_day] = TRUE ;
		}
		
		$TAB[$contract_code] = array(
			'contract_code' => $contract_code,
			'contract_txt' => $arr['field_CONTRACT_TXT'],
			'std_dayson' => $std_dayson,
			'std_daylength' => $arr['field_STD_DAYLENGTH']
		);
	}
	return $TAB ;
}

?>