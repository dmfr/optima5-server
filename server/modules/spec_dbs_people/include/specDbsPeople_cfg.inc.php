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
			$record['leaf'] = true ;
			$record['children'] = array() ;
		}
		$TAB_json[] = $record ;
	}
	return $TAB_json ;
}

?>