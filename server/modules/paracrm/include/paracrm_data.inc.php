<?php
function paracrm_data_getBibleCfg( $post_data )
{
	global $_opDB ;

	$bible_code = $post_data['bible_code'] ;
	$tree_key_lib = NULL ;
	
	$query = "SELECT bible_lib FROM define_bible WHERE bible_code='$bible_code'" ;
	$bible_lib = $_opDB->query_uniqueValue($query);
	
	$tab_tree_fields = array() ;
	$tab_tree_fields[] = array('tree_field_code'=>'treenode_key','tree_field_type'=>'string','tree_field_lib'=>'NodeKey','tree_field_is_highlight'=>false) ;
	$tab_tree_fields[] = array('tree_field_code'=>'nb_entries','tree_field_type'=>'int','tree_field_lib'=>'Nb Entries','tree_field_is_highlight'=>false) ;
	$tab_tree_fields[] = array('tree_field_code'=>'nb_children','tree_field_type'=>'int','tree_field_lib'=>'Nb Childs','tree_field_is_highlight'=>false) ;
	$query = "SELECT * FROM define_bible_tree WHERE bible_code='$bible_code' ORDER BY tree_field_index" ;
	$result = $_opDB->query($query);
	if( $_opDB->num_rows($result) == 0 )
		return array('success'=>false) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		if( strpos($arr['tree_field_type'],'link_') === 0 )
		{
			$arr['tree_field_link'] = substr($arr['tree_field_type'],5,strlen($arr['tree_field_type'])-5) ;
			$arr['tree_field_type'] = 'link' ;
		}
		$arr['tree_field_is_header'] = ($arr['tree_field_is_header']=='O')? TRUE : FALSE ;
		$arr['tree_field_is_highlight'] = ($arr['tree_field_is_highlight']=='O')? TRUE : FALSE ;
		$arr['tree_field_is_key'] = ($arr['tree_field_is_key']=='O')? TRUE : FALSE ;
		$arr['tree_field_code'] = 'field_'.$arr['tree_field_code'] ;
		$tab_tree_fields[] = $arr ;
		
		if($arr['tree_field_is_key']=='O') {
			$tree_key_lib = $arr['tree_field_lib'] ;
		}
	}
	
	
	$tab_entry_fields = array() ;
	
	$arr_entry = array() ;
	$arr_entry['entry_field_is_header'] = FALSE ;
	$arr_entry['entry_field_is_highlight'] = FALSE ;
	$arr_entry['entry_field_is_key'] = FALSE ;
	$arr_entry['entry_field_code'] = 'entry_key' ;
	$arr_entry['entry_field_lib'] = 'EntryKey' ;
	$arr_entry['entry_field_type'] = 'string' ;
	$tab_entry_fields[] = $arr_entry ;
	
	$arr_treenode = array() ;
	$arr_treenode['entry_field_is_header'] = TRUE ;
	$arr_treenode['entry_field_is_highlight'] = TRUE ;
	$arr_treenode['entry_field_is_key'] = FALSE ;
	$arr_treenode['entry_field_code'] = 'treenode_key' ;
	$arr_treenode['entry_field_lib'] = $tree_key_lib ;
	$arr_treenode['entry_field_type'] = 'string' ;
	$tab_entry_fields[] = $arr_treenode ;
	
	$arr_headerlib = array() ;
	$arr_headerlib['entry_field_is_header'] = FALSE ;
	$arr_headerlib['entry_field_is_highlight'] = FALSE ;
	$arr_headerlib['entry_field_is_key'] = FALSE ;
	$arr_headerlib['entry_field_code'] = 'headerlib' ;
	$arr_headerlib['entry_field_lib'] = 'Header' ;
	$arr_headerlib['entry_field_type'] = 'string' ;
	$tab_entry_fields[] = $arr_headerlib ;
	
	$query = "SELECT gmap_is_on FROM define_bible WHERE bible_code='$bible_code'" ;
	if( $_opDB->query_uniqueValue($query) == 'O' )
	{
		$arr_gmap = array() ;
		foreach( $_opDB->table_fields('define_gmap') as $field )
		{
			$tfield = 'gmap_'.$field ;
			
			$arr = array() ;
			$arr['entry_field_is_header'] = FALSE ;
			$arr['entry_field_is_highlight'] = FALSE ;
			$arr['entry_field_is_key'] = FALSE ;
			$arr['entry_field_code'] = $tfield ;
			$arr['entry_field_lib'] = $tfield ;
			$arr['entry_field_type'] = 'string' ;
			$tab_entry_fields[] = $arr ;
		}
	}
	
	
	$query = "SELECT * FROM define_bible_entry WHERE bible_code='$bible_code' ORDER BY entry_field_index" ;
	$result = $_opDB->query($query);
	if( $_opDB->num_rows($result) == 0 )
		return array('success'=>false) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		if( strpos($arr['entry_field_type'],'link_') === 0 )
		{
			$arr['entry_field_link'] = substr($arr['entry_field_type'],5,strlen($arr['entry_field_type'])-5) ;
			$arr['entry_field_type'] = 'link' ;
		}
		
		$arr['entry_field_is_header'] = ($arr['entry_field_is_header']=='O')? TRUE : FALSE ;
		$arr['entry_field_is_highlight'] = ($arr['entry_field_is_highlight']=='O')? TRUE : FALSE ;
		$arr['entry_field_is_key'] = ($arr['entry_field_is_key']=='O')? TRUE : FALSE ;
		$arr['entry_field_code'] = 'field_'.$arr['entry_field_code'] ;
		$tab_entry_fields[] = $arr ;
	}
	
	
	return array('success'=>true,'data'=>array('bible_lib'=>$bible_lib,'tree_fields'=>$tab_tree_fields,'entry_fields'=>$tab_entry_fields)) ;
}






function paracrm_data_getBibleTree( $post_data )
{
	global $_opDB ;
	
	$bible_code = $post_data['bible_code'] ;
	$view_name = 'view_bible_'.$bible_code.'_tree' ;
	
	$arr_fields = array() ;
	$query = "SELECT * FROM define_bible_tree WHERE bible_code='$bible_code'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$fieldcode = $arr['tree_field_code'] ;
		$fieldtrad = 'field_'.$fieldcode ;
		
		$arr_fields[$fieldtrad] = $fieldcode ;
	}
	
	$tab_parentkey_nodes = array() ;
	$query = "SELECT * FROM $view_name" ;
	$result = $_opDB->query($query);
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$record = $arr ;
		$record['treenode_key'] = $arr['treenode_key'] ;
	
		$tab_parentkey_nodes[$arr['treenode_parent_key']][$arr['treenode_key']] = $record ;
	}
	foreach( $tab_parentkey_nodes as $treenode_parent_key => $arr1 )
	{
		foreach( $arr1 as $treenode_key => $record )
		{
			$record['nb_children'] = count($tab_parentkey_nodes[$treenode_key]) ;
			$tab_parentkey_nodes[$treenode_parent_key][$treenode_key] = $record ;
		}
	}
	
	// print_r($tab_parentkey_nodes) ;
	
	$TAB_json = paracrm_data_getBibleTree_call( $tab_parentkey_nodes, '' ) ;
	//$TAB_json[] = array('field_PRODLINE'=>'POM','field_PRODLINEDESC'=>'Pom Juices','expanded'=>true,'children'=>array(array('field_PRODLINE'=>'POM_C','field_PRODLINEDESC'=>'Pom Cold','leaf'=>true),array('field_PRODLINE'=>'POM_H','field_PRODLINEDESC'=>'Pom Hot','leaf'=>true))) ;
	return array('text'=>'.','children'=>$TAB_json) ;
}
function paracrm_data_getBibleTree_call( $tab_parentkey_nodes, $treenode_parent_key )
{
	global $_opDB ;
	
	$TAB_json = array() ;
	if( !$tab_parentkey_nodes[$treenode_parent_key] )
		return array() ;
	foreach( $tab_parentkey_nodes[$treenode_parent_key] as $treenode_key => $record )
	{
		if( $child_tab = paracrm_data_getBibleTree_call( $tab_parentkey_nodes, $treenode_key ) )
		{
			$record['expanded'] = true ;
			$record['children'] = $child_tab ;
		}
		else
		{
			$record['leaf'] = true ;
		}
		$TAB_json[] = $record ;
	}
	return $TAB_json ;
}



function paracrm_data_getBibleGrid( $post_data )
{
	global $_opDB ;
	
	// sleep(2) ;
	
	$bible_code = $post_data['bible_code'] ;
	$view_name = 'view_bible_'.$bible_code.'_entry' ;
	
	$arr_filters = array() ;
	if( $post_data['filter'] )
	{
	foreach( json_decode($post_data['filter'],TRUE) as $filter )
	{
		switch( $filter['property'] )
		{
			case 'treenode_key' ;
			if( $filter['value'] && $filter['value'] != '&' )
				$arr_filters['treenode_key'] = $filter['value'] ;
			break ;
		
		}
	}
	}
	
	$TAB_json = array() ;
	$query = "SELECT * FROM $view_name" ;
	$result = $_opDB->query($query);
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$TAB_json[] = $arr ;
	}
	
	
	if( $arr_filters['treenode_key'] )
	{
		$TAB_parentNode_arrEntries = array() ;
		foreach( $TAB_json as $arrRecord )
		{
			$entry_key = $arrRecord['entry_key'] ;
			$treenode_key = $arrRecord['treenode_key'] ;
			if( !is_array( $TAB_parentNode_arrEntries[$treenode_key] ) )
				$TAB_parentNode_arrEntries[$treenode_key] = array() ;
			$TAB_parentNode_arrEntries[$treenode_key][] = $arrRecord ;
		}
		
		$view_tree = 'view_bible_'.$bible_code.'_tree' ;
		$query = "SELECT treenode_key, treenode_parent_key FROM $view_tree" ;
		$result = $_opDB->query($query) ;
		$TAB_parentNode_arrNodeCode = array() ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
		{
			$TAB_parentNode_arrNodeCode[$arr['treenode_parent_key']][] = $arr['treenode_key'] ;
		}
		
		$TAB_json = paracrm_data_getBibleGrid_filterNode( $arr_filters['treenode_key'], $TAB_parentNode_arrEntries, $TAB_parentNode_arrNodeCode ) ;
	}
	
	return $TAB_json ;
}
function paracrm_data_getBibleGrid_filterNode( $treenode_key, $TAB_parentNode_arrEntries, $TAB_parentNode_arrNodeCode )
{
	$TAB_json = array() ;
	if( $TAB_parentNode_arrEntries[$treenode_key] )
	{
		$TAB_json = $TAB_parentNode_arrEntries[$treenode_key] ;
		//print_r($TAB_json) ;
	}
	if( $TAB_parentNode_arrNodeCode[$treenode_key] )
	{
	foreach( $TAB_parentNode_arrNodeCode[$treenode_key] as $treenode_child_key )
	{
		if( $TAB_json_child = paracrm_data_getBibleGrid_filterNode( $treenode_child_key, $TAB_parentNode_arrEntries, $TAB_parentNode_arrNodeCode ) )
		{
			$TAB_json = array_merge($TAB_json,$TAB_json_child) ;
		}
	}
	}
	return $TAB_json ;
}


/*
*****************************************************************************


**************************************************************************
*/




function paracrm_data_getFileGrid_config( $post_data )
{
	global $_opDB ;

	$query = "SELECT * FROM define_file WHERE file_code='{$post_data['file_code']}'" ;
	$result = $_opDB->query($query) ;
	$arr_define_file = $_opDB->fetch_assoc($result) ;
	
	$TAB = paracrm_lib_file_access( $file_code = $post_data['file_code'] ) ;
	if( !$TAB['select_map'] )
		return array('success'=>false) ;
	
	return array('success'=>true,'data'=>array('define_file'=>$arr_define_file,'grid_fields'=>$TAB['select_map'])) ;
}
function paracrm_data_getFileGrid_data( $post_data )
{
	global $_opDB ;
	
	// echo "pouet" ;
	$TAB = paracrm_lib_file_access( $file_code = $post_data['file_code'] ) ;
	if( !$TAB['sql_query_base'] )
		return array('success'=>false) ;
	
	$query = $TAB['sql_query_base'] ;
	
	// filters.....
	
	$query.= " ORDER BY filerecord_id DESC" ;
	$result = $_opDB->query($query);
	
	$TAB_json = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$TAB_json[] = $arr ;
	}
	return $TAB_json ;
}






?>