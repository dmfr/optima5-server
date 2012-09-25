<?php

function paracrm_lib_data_getRecord( $data_type, $store_code, $key, $parent_key=0 )
{
	switch( $data_type )
	{
		case 'bible_treenode' :
			$treenode_key = $key ;
			$bible_code = $store_code ;
			return paracrm_lib_data_getRecord_bibleTreenode( $bible_code, $treenode_key ) ;
			
		case 'bible_entry' :
			$entry_key = $key ;
			$bible_code = $store_code ;
			return paracrm_lib_data_getRecord_bibleEntry( $bible_code, $entry_key ) ;
			
		case 'file_record' :
			$filerecord_id = $key ;
			$file_code = $store_code ;
			if( $key==NULL && $parent_key > 0 )
			{
				$filerecord_parent_id = $parent_key ;
				return paracrm_lib_data_getFileChildRecords( $file_code, $filerecord_parent_id ) ;
			}
			return paracrm_lib_data_getRecord_file( $file_code, $filerecord_id ) ;
			
		default :
			return NULL ;
	}
}
function paracrm_lib_data_getRecord_bibleTreenode( $bible_code, $treenode_key )
{
	global $_opDB ;

	$view_name = 'view_bible_'.$bible_code.'_tree' ;
	$query = "SELECT * FROM $view_name WHERE treenode_key='$treenode_key'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 )
		return NULL ;

	return $_opDB->fetch_assoc($result) ;
}
function paracrm_lib_data_getRecord_bibleEntry( $bible_code, $entry_key )
{
	global $_opDB ;

	$view_name = 'view_bible_'.$bible_code.'_entry' ;
	$query = "SELECT * FROM $view_name WHERE entry_key='$entry_key'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 )
		return NULL ;

	return $_opDB->fetch_assoc($result) ;
}
function paracrm_lib_data_getRecord_file( $file_code, $filerecord_id )
{
	global $_opDB ;

	$view_name = 'view_file_'.$file_code ;
	$query = "SELECT * FROM $view_name WHERE filerecord_id='$filerecord_id'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 )
		return NULL ;

	return $_opDB->fetch_assoc($result) ;
}
function paracrm_lib_data_getFileChildRecords( $file_code, $filerecord_parent_id )
{
	global $_opDB ;

	$view_name = 'view_file_'.$file_code ;
	$query = "SELECT * FROM $view_name WHERE filerecord_parent_id='$filerecord_parent_id' ORDER BY filerecord_id" ;
	$result = $_opDB->query($query) ;
	$tab = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		//$filerecord_id = $arr['filerecord_id'] ;
		$tab[] = $arr ;
	}

	return $tab ;
}

function paracrm_lib_dataTool_getBibleTreeRoot( $bible_code, $treenode_key=NULL )
{
	global $_opDB ;

	$view_name = 'view_bible_'.$bible_code.'_tree' ;
	
	// nom de la bible
	$query = "SELECT bible_lib FROM define_bible WHERE bible_code='$bible_code'" ;
	$bible_lib = $_opDB->query_uniqueValue($query);
	
	// definition
	$key_field = NULL ;
	$header_fields = array() ;
	$query = "SELECT * FROM define_bible_tree WHERE bible_code='$bible_code' ORDER BY tree_field_index" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		if( $arr['tree_field_is_header'] == 'O' )
			$header_fields[] = $arr['tree_field_code'] ;
		if( $arr['tree_field_is_key'] == 'O' )
			$key_field = $arr['tree_field_code'] ;
	}
	if( !$header_fields )
		$header_fields[] = $key_field ;

	if( $treenode_key )
	{
		$arr_nodes = array() ;
		while( $treenode_key != '' )
		{
			if( $treenode_key == '&' )
			{
				$node = array() ;
				$node['nodeKey'] = '&' ;
				$node['nodeText'] = '<b>Bible</b>: '.$bible_lib ;
				$arr_nodes[] = $node ;
				break ;
			}
			
			$query = "SELECT *,treenode_parent_key FROM $view_name WHERE treenode_key='$treenode_key'" ;
			$result = $_opDB->query($query) ;
			$arr = $_opDB->fetch_assoc($result) ;
			if( $arr == FALSE )
				break ;
		
			$node = array() ;
			$node['nodeKey'] = $arr['treenode_key'] ;
			$txt = '' ;
			foreach( $header_fields as $field )
			{
				$tfield = 'field_'.$field ;
				if( $txt )
					$txt.= ' - ' ;
				if( $field == $key_field )
					$txt.= '<b>'.$arr[$tfield].'</b>' ;
				else
					$txt.= ''.$arr[$tfield].'' ;
			}
			$node['nodeText'] = $txt ;
			$arr_nodes[] = $node ;
			
			if( $arr['treenode_parent_key'] == '' )
				$treenode_key = '&' ;
			else
				$treenode_key = $arr['treenode_parent_key'] ;
		}
		$c=0 ;
		foreach( $arr_nodes as $node )
		{
			if( $c==0 )
			{
				$node['leaf'] = true ;
				$node['checked'] = true ;
			}
			else
			{
				$node['expanded'] = true ;
			}
			if( $json )
				$node['children'] = $json ;
			$json = $node ;
			$c++ ;
		}
		return $json_root = $json ;
	}
	else
	{
		$tab_parentkey_nodes = array() ;
		$query = "SELECT * FROM $view_name" ;
		$result = $_opDB->query($query);
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
		{
			$txt = '' ;
			foreach( $header_fields as $field )
			{
				$tfield = 'field_'.$field ;
				if( $txt )
					$txt.= ' - ' ;
				if( $field == $key_field )
					$txt.= ''.$arr[$tfield].'' ;
				else
					$txt.= ''.$arr[$tfield].'' ;
			}
		
			$tab_parentkey_nodes[$arr['treenode_parent_key']][$arr['treenode_key']] = $txt ;
		}
		
		
		// print_r($tab_parentkey_nodes) ;
		
		
		$json_root_node = array() ;
		$json_root_node['nodeKey'] = '&' ;
		$json_root_node['nodeText'] = '<b>Bible</b>: '.$bible_lib ;
		$json_root_node['checked'] = false ;
		if( $TAB_json = paracrm_lib_dataTool_getBibleTreeRoot_call( $tab_parentkey_nodes, '' ) )
		{
			$json_root_node['children'] = $TAB_json ;
			$json_root_node['expanded'] = true ;
		}
		else
		{
			$json_root_node['leaf'] = true ;
		}
		return $json_root_node ;
	}

}
function paracrm_lib_dataTool_getBibleTreeRoot_call( $tab_parentkey_nodes, $treenode_parent_key )
{
	global $_opDB ;
	
	$TAB_json = array() ;
	if( !$tab_parentkey_nodes[$treenode_parent_key] )
		return array() ;
	foreach( $tab_parentkey_nodes[$treenode_parent_key] as $treenode_key => $treenode_text )
	{
		$record = array() ;
		$record['nodeKey'] = $treenode_key ;
		$record['nodeText'] = $treenode_text ;
		$record['checked'] = false ;
		if( $child_tab = paracrm_lib_dataTool_getBibleTreeRoot_call( $tab_parentkey_nodes, $treenode_key ) )
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








function paracrm_lib_data_beginTransaction()
{
	global $_opDB ;
	
	$query = "BEGIN" ;
	$_opDB->query($query) ;
}
function paracrm_lib_data_endTransaction($reset_orphans=FALSE)
{
	global $_opDB ;
	
	paracrm_lib_buildCacheLinks($reset_orphans) ;
	
	$query = "COMMIT" ;
	$_opDB->query($query) ;
}

function paracrm_lib_data_insertRecord_bibleTreenode( $bible_code, $treenode_key, $treenode_parent_key, $data )
{
	global $_opDB ;
	
	if( paracrm_lib_data_getRecord_bibleTreenode( $bible_code, $treenode_key ) )
		return -1 ;
	if( $treenode_parent_key && $treenode_parent_key != '&' )
	{
		if( !paracrm_lib_data_getRecord_bibleTreenode( $bible_code, $treenode_parent_key ) )
			return -1 ;
	}
	
	// definition
	$key_field = NULL ;
	$fields = array() ;
	$query = "SELECT * FROM define_bible_tree WHERE bible_code='$bible_code' ORDER BY tree_field_index" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$fields[$arr['tree_field_code']] = $arr['tree_field_type'] ;
		if( $arr['tree_field_is_key'] == 'O' )
			$key_field = $arr['tree_field_code'] ;
	}
	
	$data_key_field = 'field_'.$key_field ;
	if( !($data[$data_key_field] === $treenode_key) )
		return -1 ;
		
	$arr_ins = array() ;
	$arr_ins['bible_code'] = $bible_code ;
	$arr_ins['treenode_key'] = $treenode_key ;
	$arr_ins['treenode_parent_key'] = ($treenode_parent_key=='&')?'':$treenode_parent_key ;
	$_opDB->insert('store_bible_tree',$arr_ins) ;
	$treenode_racx = $_opDB->insert_id() ;
	foreach( $fields as $field_code => $field_type )
	{
		$query = "DELETE FROM store_bible_tree_field WHERE bible_code='$bible_code' AND treenode_key='$treenode_key' AND treenode_field_code='$field_code'" ;
		$_opDB->query($query) ;
			
		$datafield = 'field_'.$field_code ;
		if( isset($data[$datafield]) )
		{
			$arr_ins = array() ;
			$arr_ins['bible_code'] = $bible_code ;
			$arr_ins['treenode_racx'] = $treenode_racx ;
			$arr_ins['treenode_key'] = $treenode_key ;
			$arr_ins['treenode_field_code'] = $field_code ;
			$arr_ins['treenode_field_value_string'] = '' ;
			$arr_ins['treenode_field_value_number'] = 0 ;
			$arr_ins['treenode_field_value_date'] = '0000-00-00' ;
			$arr_ins['treenode_field_value_link'] = '' ;
			switch( $field_type )
			{
				case 'string' :
				case 'number' :
				case 'date' :
				case 'link' :
				$mkey = 'treenode_field_value_'.$field_type ;
				$arr_ins[$mkey] = $data[$datafield] ;
				break ;
				default :
				break ;
			}
			
			$_opDB->insert('store_bible_tree_field',$arr_ins) ;
		}
	}
	return 0 ;
}
function paracrm_lib_data_updateRecord_bibleTreenode( $bible_code, $treenode_key, $data )
{
	global $_opDB ;
	
	if( !($rec = paracrm_lib_data_getRecord_bibleTreenode( $bible_code, $treenode_key )) )
		return -1 ;
	$query = "SELECT treenode_racx FROM store_bible_tree WHERE bible_code='$bible_code' AND treenode_key='$treenode_key'" ;
	if( !($treenode_racx = $_opDB->query_uniqueValue($query)) )
		return -1 ;
	
	
	// definition
	$key_field = NULL ;
	$fields = array() ;
	$query = "SELECT * FROM define_bible_tree WHERE bible_code='$bible_code' ORDER BY tree_field_index" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$fields[$arr['tree_field_code']] = $arr['tree_field_type'] ;
		if( $arr['tree_field_is_key'] == 'O' )
			$key_field = $arr['tree_field_code'] ;
	}
	
	$data_key_field = 'field_'.$key_field ;
	if( !($data[$data_key_field] === $treenode_key) )
	{
		$treenode_key_old = $treenode_key ;
		$treenode_key_new = $data[$data_key_field] ;
		
		$query = "UPDATE store_bible_tree SET treenode_key='$treenode_key_new' WHERE bible_code='$bible_code' AND treenode_key='$treenode_key_old'" ;
		$_opDB->query($query) ;
		
		$query = "UPDATE store_bible_tree SET treenode_parent_key='$treenode_key_new' WHERE bible_code='$bible_code' AND treenode_parent_key='$treenode_key_old'" ;
		$_opDB->query($query) ;
		$query = "UPDATE store_bible_entry SET treenode_key='$treenode_key_new' WHERE bible_code='$bible_code' AND treenode_key='$treenode_key_old'" ;
		$_opDB->query($query) ;
	}
	else
	{
		$treenode_key_old = $treenode_key ;
		$treenode_key_new = $treenode_key ;
	}
		
	foreach( $fields as $field_code => $field_type )
	{
		$datafield = 'field_'.$field_code ;
		if( isset($data[$datafield]) )
		{
			$query = "DELETE FROM store_bible_tree_field WHERE treenode_racx='$treenode_racx' AND treenode_field_code='$field_code'" ;
			$_opDB->query($query) ;
		
			$arr_ins = array() ;
			$arr_ins['bible_code'] = $bible_code ;
			$arr_ins['treenode_racx'] = $treenode_racx ;
			$arr_ins['treenode_key'] = $treenode_key_new ;
			$arr_ins['treenode_field_code'] = $field_code ;
			$arr_ins['treenode_field_value_string'] = '' ;
			$arr_ins['treenode_field_value_number'] = 0 ;
			$arr_ins['treenode_field_value_date'] = '0000-00-00' ;
			$arr_ins['treenode_field_value_link'] = '' ;
			switch( $field_type )
			{
				case 'string' :
				case 'number' :
				case 'date' :
				case 'link' :
				$mkey = 'treenode_field_value_'.$field_type ;
				$arr_ins[$mkey] = $data[$datafield] ;
				break ;
				default :
				break ;
			}
			
			$_opDB->insert('store_bible_tree_field',$arr_ins) ;
		}
	}
	return 0 ;
}

function paracrm_lib_data_deleteRecord_bibleTreenode( $bible_code, $treenode_key )
{
	global $_opDB ;
	$query = "DELETE FROM store_bible_tree_field WHERE bible_code='$bible_code' AND treenode_key='$treenode_key'" ;
	$_opDB->query($query) ;
	$query = "DELETE FROM store_bible_tree WHERE bible_code='$bible_code' AND treenode_key='$treenode_key'" ;
	$_opDB->query($query) ;
	return 0 ;
}















function paracrm_lib_data_insertRecord_bibleEntry( $bible_code, $entry_key, $treenode_key, $data )
{
	global $_opDB ;
	
	if( paracrm_lib_data_getRecord_bibleEntry( $bible_code, $entry_key ) )
		return -1 ;
	if( $treenode_key && $treenode_key != '&' )
	{
		if( !paracrm_lib_data_getRecord_bibleTreenode( $bible_code, $treenode_key ) )
			return -1 ;
	}
	
	// definition
	$key_field = NULL ;
	$fields = array() ;
	$query = "SELECT * FROM define_bible_entry WHERE bible_code='$bible_code' ORDER BY entry_field_index" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$fields[$arr['entry_field_code']] = $arr['entry_field_type'] ;
		if( $arr['entry_field_is_key'] == 'O' )
			$key_field = $arr['entry_field_code'] ;
	}
	$query = "SELECT gmap_is_on FROM define_bible WHERE bible_code='$bible_code'" ;
	if( $_opDB->query_uniqueValue($query) == 'O' )
	{
		$arr_gmap = array() ;
		foreach( $_opDB->table_fields('define_gmap') as $field )
		{
			$tfield = 'gmap_'.$field ;
			$arr_gmap[] = $tfield ;
		}
	}
	
	
	$data_key_field = 'field_'.$key_field ;
	if( !($data[$data_key_field] === $entry_key) )
		return -1 ;
		
	$arr_ins = array() ;
	$arr_ins['bible_code'] = $bible_code ;
	$arr_ins['entry_key'] = $entry_key ;
	$arr_ins['treenode_key'] = ($treenode_key=='&')?'':$treenode_key ;
	$_opDB->insert('store_bible_entry',$arr_ins) ;
	$entry_racx = $_opDB->insert_id() ;
	foreach( $fields as $field_code => $field_type )
	{
		$query = "DELETE FROM store_bible_entry_field WHERE bible_code='$bible_code' AND entry_key='$entry_key' AND entry_field_code='$field_code'" ;
		$_opDB->query($query) ;
			
		$datafield = 'field_'.$field_code ;
		if( isset($data[$datafield]) )
		{
			$arr_ins = array() ;
			$arr_ins['bible_code'] = $bible_code ;
			$arr_ins['entry_racx'] = $entry_racx ;
			$arr_ins['entry_key'] = $entry_key ;
			$arr_ins['entry_field_code'] = $field_code ;
			$arr_ins['entry_field_value_string'] = '' ;
			$arr_ins['entry_field_value_number'] = 0 ;
			$arr_ins['entry_field_value_date'] = '0000-00-00' ;
			$arr_ins['entry_field_value_link'] = '' ;
			switch( $field_type )
			{
				case 'string' :
				case 'number' :
				case 'date' :
				case 'link' :
				$mkey = 'entry_field_value_'.$field_type ;
				$arr_ins[$mkey] = $data[$datafield] ;
				break ;
				default :
				break ;
			}
			
			$_opDB->insert('store_bible_entry_field',$arr_ins) ;
		}
	}
	if( $arr_gmap )
	{
		foreach( $arr_gmap as $tfield )
		{
			$query = "DELETE FROM store_bible_entry_field WHERE bible_code='$bible_code' AND entry_key='$entry_key' AND entry_field_code='$tfield'" ;
			$_opDB->query($query) ;
			
			$arr_ins = array() ;
			$arr_ins['bible_code'] = $bible_code ;
			$arr_ins['entry_racx'] = $entry_racx ;
			$arr_ins['entry_key'] = $entry_key ;
			$arr_ins['entry_field_code'] = $tfield ;
			$arr_ins['entry_field_value_link'] = $data[$tfield] ;
			$_opDB->insert('store_bible_entry_field',$arr_ins) ;
		}
	}
	return 0 ;
}
function paracrm_lib_data_updateRecord_bibleEntry( $bible_code, $entry_key, $data )
{
	global $_opDB ;
	
	if( !($rec=paracrm_lib_data_getRecord_bibleEntry( $bible_code, $entry_key )) )
		return -1 ;
	$query = "SELECT entry_racx FROM store_bible_entry WHERE bible_code='$bible_code' AND entry_key='$entry_key'" ;
	if( !($entry_racx = $_opDB->query_uniqueValue($query)) )
		return -1 ;
	
	// definition
	$key_field = NULL ;
	$fields = array() ;
	$query = "SELECT * FROM define_bible_entry WHERE bible_code='$bible_code' ORDER BY entry_field_index" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$fields[$arr['entry_field_code']] = $arr['entry_field_type'] ;
		if( $arr['entry_field_is_key'] == 'O' )
			$key_field = $arr['entry_field_code'] ;
	}
	$query = "SELECT gmap_is_on FROM define_bible WHERE bible_code='$bible_code'" ;
	if( $_opDB->query_uniqueValue($query) == 'O' )
	{
		$arr_gmap = array() ;
		foreach( $_opDB->table_fields('define_gmap') as $field )
		{
			$tfield = 'gmap_'.$field ;
			$arr_gmap[] = $tfield ;
		}
	}
	
	$data_key_field = 'field_'.$key_field ;
	if( !($data[$data_key_field] === $entry_key) )
	{
		$entry_key_old = $entry_key ;
		$entry_key_new = $data[$data_key_field] ;
		
		$query = "UPDATE store_bible_entry SET entry_key='$entry_key_new' WHERE bible_code='$bible_code' AND entry_key='$entry_key_old'" ;
		$_opDB->query($query) ;
		
		
		// @TODO : update des filerecords !!!!
	}
	else
	{
		$entry_key_old = $entry_key ;
		$entry_key_new = $entry_key ;
	}
		
	foreach( $fields as $field_code => $field_type )
	{
		$datafield = 'field_'.$field_code ;
		if( isset($data[$datafield]) )
		{
			$query = "DELETE FROM store_bible_entry_field WHERE bible_code='$bible_code' AND entry_key='$entry_key_old' AND entry_field_code='$field_code'" ;
			$_opDB->query($query) ;
		
			$arr_ins = array() ;
			$arr_ins['bible_code'] = $bible_code ;
			$arr_ins['entry_racx'] = $entry_racx ;
			$arr_ins['entry_key'] = $entry_key_new ;
			$arr_ins['entry_field_code'] = $field_code ;
			$arr_ins['entry_field_value_string'] = '' ;
			$arr_ins['entry_field_value_number'] = 0 ;
			$arr_ins['entry_field_value_date'] = '0000-00-00' ;
			$arr_ins['entry_field_value_link'] = '' ;
			switch( $field_type )
			{
				case 'string' :
				case 'number' :
				case 'date' :
				case 'link' :
				$mkey = 'entry_field_value_'.$field_type ;
				$arr_ins[$mkey] = $data[$datafield] ;
				break ;
				default :
				break ;
			}
			
			$_opDB->insert('store_bible_entry_field',$arr_ins) ;
		}
	}
	if( $arr_gmap )
	{
		foreach( $arr_gmap as $tfield )
		{
			$query = "DELETE FROM store_bible_entry_field WHERE bible_code='$bible_code' AND entry_key='$entry_key' AND entry_field_code='$tfield'" ;
			$_opDB->query($query) ;
			
			$arr_ins = array() ;
			$arr_ins['bible_code'] = $bible_code ;
			$arr_ins['entry_racx'] = $entry_racx ;
			$arr_ins['entry_key'] = $entry_key ;
			$arr_ins['entry_field_code'] = $tfield ;
			$arr_ins['entry_field_value_link'] = $data[$tfield] ;
			$_opDB->insert('store_bible_entry_field',$arr_ins) ;
		}
	}
	return 0 ;
}
function paracrm_lib_data_deleteRecord_bibleEntry( $bible_code, $entry_key )
{
	global $_opDB ;
	$query = "DELETE FROM store_bible_entry_field WHERE bible_code='$bible_code' AND entry_key='$entry_key'" ;
	$_opDB->query($query) ;
	$query = "DELETE FROM store_bible_entry WHERE bible_code='$bible_code' AND entry_key='$entry_key'" ;
	$_opDB->query($query) ;
	return 0 ;
}









function paracrm_lib_data_bibleAssignTreenode( $bible_code, $entry_key, $new_treenode_key )
{
	global $_opDB ;
	if( !paracrm_lib_data_getRecord_bibleEntry( $bible_code, $entry_key ) )
		return -1 ;
	if( $new_treenode_key && $new_treenode_key != '&' )
	{
		if( !paracrm_lib_data_getRecord_bibleTreenode( $bible_code, $new_treenode_key ) )
			return -1 ;
	}
	
	
	$arr_update['treenode_key'] = ($new_treenode_key=='&')?'':$new_treenode_key ;
	
	$query = "UPDATE store_bible_entry SET treenode_key='{$arr_update['treenode_key']}' WHERE bible_code='$bible_code' AND entry_key='$entry_key'" ;
	$_opDB->query($query) ;
	
		
		
	return 0 ;
}








function paracrm_lib_data_insertRecord_file( $file_code , $filerecord_parent_id , $data )
{
	global $_opDB ;
	
	
	//chargement des champs
	$query = "SELECT file_type FROM define_file WHERE file_code='$file_code'" ;
	switch( $_opDB->query_uniqueValue($query) )
	{
		case 'media_img' :
		$fields = array() ;
		$arr_media = array() ;
		foreach( $_opDB->table_fields('define_media') as $field )
		{
			$tfield = 'media_'.$field ;
			$arr_media[] = $tfield ;
		}
		break ;
	
		default :
		$fields = array() ;
		$arr_media = array() ;
		$query = "SELECT * FROM define_file_entry WHERE file_code='$file_code' ORDER BY entry_field_index" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
		{
			$fields[$arr['entry_field_code']] = $arr['entry_field_type'] ;
		}
		break ;
	}
	
	
	$query = "SELECT * FROM define_file WHERE file_code='$file_code'" ;
	$result = $_opDB->query($query) ;
	$arr = $_opDB->fetch_assoc($result) ;
	if( $arr['gmap_is_on'] == 'O' )
	{
		$arr_gmap = array() ;
		foreach( $_opDB->table_fields('define_gmap') as $field )
		{
			$tfield = 'gmap_'.$field ;
			$arr_gmap[] = $tfield ;
		}
	}
	if( $arr['file_parent_code'] )
	{
		if( !paracrm_lib_data_getRecord_file( $arr['file_parent_code'], $filerecord_parent_id ) )
			return -1 ;
	}
	
	
	$arr_ins = array() ;
	$arr_ins['file_code'] = $file_code ;
	if( $filerecord_parent_id > 0 )
		$arr_ins['filerecord_parent_id'] = $filerecord_parent_id ;
	$_opDB->insert('store_file',$arr_ins) ;
	$new_filerecord_id = $_opDB->insert_id() ;
	foreach( $fields as $field_code => $field_type )
	{
		$query = "DELETE FROM store_file_field WHERE filerecord_id='$new_filerecord_id' AND filerecord_field_code='$field_code'" ;
		$_opDB->query($query) ;
			
		$datafield = 'field_'.$field_code ;
		if( isset($data[$datafield]) )
		{
			$arr_ins = array() ;
			$arr_ins['filerecord_id'] = $new_filerecord_id ;
			$arr_ins['filerecord_field_code'] = $field_code ;
			$arr_ins['filerecord_field_value_string'] = '' ;
			$arr_ins['filerecord_field_value_number'] = 0 ;
			$arr_ins['filerecord_field_value_date'] = '0000-00-00 00:00:00' ;
			$arr_ins['filerecord_field_value_link'] = '' ;
			switch( $field_type )
			{
				case 'string' :
				case 'number' :
				case 'date' :
				case 'link' :
				$mkey = 'filerecord_field_value_'.$field_type ;
				$arr_ins[$mkey] = $data[$datafield] ;
				break ;
				
				case 'bool' :
				$mkey = 'filerecord_field_value_number' ;
				$arr_ins[$mkey] = $data[$datafield] ;
				break ;
				
				default :
				break ;
			}
			
			$_opDB->insert('store_file_field',$arr_ins) ;
		}
	}
	if( $arr_gmap )
	{
		foreach( $arr_gmap as $tfield )
		{
			$query = "DELETE FROM store_file_field WHERE filerecord_id='$new_filerecord_id' AND filerecord_field_code='$tfield'" ;
			$_opDB->query($query) ;
			
			$arr_ins = array() ;
			$arr_ins['filerecord_id'] = $new_filerecord_id ;
			$arr_ins['filerecord_field_code'] = $tfield ;
			$arr_ins['filerecord_field_value_link'] = $data[$tfield] ;
			$_opDB->insert('store_file_field',$arr_ins) ;
		}
	}
	if( $arr_media )
	{
		foreach( $arr_media as $tfield )
		{
			$query = "DELETE FROM store_file_field WHERE filerecord_id='$new_filerecord_id' AND filerecord_field_code='$tfield'" ;
			$_opDB->query($query) ;
			
			$arr_ins = array() ;
			$arr_ins['filerecord_id'] = $new_filerecord_id ;
			$arr_ins['filerecord_field_code'] = $tfield ;
			$arr_ins['filerecord_field_value_string'] = $data[$tfield] ;
			$_opDB->insert('store_file_field',$arr_ins) ;
		}
	}
	return $new_filerecord_id ;
}
function paracrm_lib_data_updateRecord_file( $file_code , $data, $filerecord_id )
{
	global $_opDB ;
	
	//chargement des champs
	$query = "SELECT file_type FROM define_file WHERE file_code='$file_code'" ;
	switch( $_opDB->query_uniqueValue($query) )
	{
		case 'media_img' :
		$fields = array() ;
		// $arr_media_define = array() ;
		$arr_media = array() ;
		foreach( $_opDB->table_fields('define_media') as $field )
		{
			$tfield = 'media_'.$field ;
			$arr_media[] = $tfield ;
		}
		break ;
	
		default :
		$fields = array() ;
		$arr_media = array() ;
		$query = "SELECT * FROM define_file_entry WHERE file_code='$file_code' ORDER BY entry_field_index" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
		{
			$fields[$arr['entry_field_code']] = $arr['entry_field_type'] ;
		}
		break ;
	}
	
	$query = "SELECT * FROM define_file WHERE file_code='$file_code'" ;
	$result = $_opDB->query($query) ;
	$arr = $_opDB->fetch_assoc($result) ;
	if( $arr['gmap_is_on'] == 'O' )
	{
		$arr_gmap = array() ;
		foreach( $_opDB->table_fields('define_gmap') as $field )
		{
			$tfield = 'gmap_'.$field ;
			$arr_gmap[] = $tfield ;
		}
	}
	if( TRUE )
	{
		if( !paracrm_lib_data_getRecord_file( $file_code, $filerecord_id ) )
			return -1 ;
	}
	
	
	$arr_update = array() ;
	$arr_cond = array() ;
	$arr_cond['filerecord_id'] = $filerecord_id ;
	$_opDB->update('store_file',$arr_update,$arr_cond) ;
	foreach( $fields as $field_code => $field_type )
	{	
		$datafield = 'field_'.$field_code ;
		if( isset($data[$datafield]) )
		{
			$query = "DELETE FROM store_file_field WHERE filerecord_id='$filerecord_id' AND filerecord_field_code='$field_code'" ;
			$_opDB->query($query) ;
		
			$arr_ins = array() ;
			$arr_ins['filerecord_id'] = $filerecord_id ;
			$arr_ins['filerecord_field_code'] = $field_code ;
			$arr_ins['filerecord_field_value_string'] = '' ;
			$arr_ins['filerecord_field_value_number'] = 0 ;
			$arr_ins['filerecord_field_value_date'] = '0000-00-00 00:00:00' ;
			$arr_ins['filerecord_field_value_link'] = '' ;
			switch( $field_type )
			{
				case 'string' :
				case 'number' :
				case 'date' :
				case 'link' :
				$mkey = 'filerecord_field_value_'.$field_type ;
				$arr_ins[$mkey] = $data[$datafield] ;
				break ;
				
				case 'bool' :
				$mkey = 'filerecord_field_value_number' ;
				$arr_ins[$mkey] = $data[$datafield] ;
				break ;
				
				default :
				break ;
			}
			
			$_opDB->insert('store_file_field',$arr_ins) ;
		}
	}
	if( $arr_gmap )
	{
		foreach( $arr_gmap as $tfield )
		{
			$query = "DELETE FROM store_file_field WHERE filerecord_id='$filerecord_id' AND filerecord_field_code='$tfield'" ;
			$_opDB->query($query) ;
			
			$arr_ins = array() ;
			$arr_ins['filerecord_id'] = $filerecord_id ;
			$arr_ins['filerecord_field_code'] = $tfield ;
			$arr_ins['filerecord_field_value_link'] = $data[$tfield] ;
			$_opDB->insert('store_file_field',$arr_ins) ;
		}
	}
	if( $arr_media )
	{
		foreach( $arr_media as $tfield )
		{
			$query = "DELETE FROM store_file_field WHERE filerecord_id='$filerecord_id' AND filerecord_field_code='$tfield'" ;
			$_opDB->query($query) ;
			
			$arr_ins = array() ;
			$arr_ins['filerecord_id'] = $filerecord_id ;
			$arr_ins['filerecord_field_code'] = $tfield ;
			$arr_ins['filerecord_field_value_string'] = $data[$tfield] ;
			$_opDB->insert('store_file_field',$arr_ins) ;
		}
	}
	return $filerecord_id ;
}
function paracrm_lib_data_deleteRecord_file( $file_code, $filerecord_id )
{
	global $_opDB ;
	
	if( !paracrm_lib_data_getRecord_file( $file_code, $filerecord_id ) )
		return -1 ;
	
	
	$query = "DELETE FROM det
					USING store_file mstr , store_file_field det
					WHERE mstr.filerecord_id = det.filerecord_id AND mstr.filerecord_parent_id='$filerecord_id'" ;
	$_opDB->query($query) ;
	$query = "DELETE FROM store_file WHERE filerecord_parent_id='$filerecord_id'" ;
	$_opDB->query($query) ;
	
	$query = "DELETE FROM store_file_field WHERE filerecord_id='$entry_key'" ;
	$_opDB->query($query) ;
	$query = "DELETE FROM store_file WHERE filerecord_id='$filerecord_id'" ;
	$_opDB->query($query) ;
	
	return 0 ;
}








?>