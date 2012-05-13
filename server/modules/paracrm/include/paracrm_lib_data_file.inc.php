<?php

function paracrm_lib_buildCacheLinks( $reset_orphans=FALSE, $reset_all=FALSE )
{
	global $_opDB ;

	if( $reset_all )
	{
		$query = "UPDATE store_file_field 
					SET filerecord_field_value_link_treenode_racx='0',filerecord_field_value_link_entry_racx='0'" ;
		$_opDB->query($query) ;
	}
	elseif( $reset_orphans )
	{
		$query = "UPDATE store_file_field 
					SET filerecord_field_value_link_treenode_racx='0'
					WHERE filerecord_field_value_link_treenode_racx NOT IN (select treenode_racx FROM store_bible_tree)" ;
		$_opDB->query($query) ;
		
		$query = "UPDATE store_file_field 
					SET filerecord_field_value_link_entry_racx='0'
					WHERE filerecord_field_value_link_entry_racx NOT IN (select entry_racx FROM store_bible_entry)" ;
		$_opDB->query($query) ;
	}
	
	$cache_entrykey_racxs = array() ;
	
	
	$query = "SELECT sf.filerecord_id , sf.filerecord_field_code , d.entry_field_linkbible , sf.filerecord_field_value_link
				FROM define_file_entry d , store_file s , store_file_field sf
				WHERE d.file_code=s.file_code AND d.entry_field_code=sf.filerecord_field_code
				AND s.filerecord_id = sf.filerecord_id
				AND d.entry_field_type='link'
				AND sf.filerecord_field_value_link <> '' AND (sf.filerecord_field_value_link_treenode_racx='0' OR filerecord_field_value_link_entry_racx='0')" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$filerecord_id = $arr['filerecord_id'] ;
		$filerecord_field_code = $arr['filerecord_field_code'] ;
	
		$bible_code = $arr['entry_field_linkbible'] ;
		$entry_key = $arr['filerecord_field_value_link'] ;
		if( !isset($cache_entrykey_racxs[$entry_key]) )
		{
			$query = "SELECT e.entry_racx, t.treenode_racx
						FROM store_bible_entry e
						LEFT OUTER JOIN store_bible_tree t ON ( e.bible_code=t.bible_code AND t.treenode_key = e.treenode_key )
						WHERE e.bible_code='$bible_code' AND e.entry_key='$entry_key'" ;
			$res = $_opDB->query($query) ;
			$arr_racx = $_opDB->fetch_assoc($res) ;
			
			$cache_entrykey_racxs[$entry_key] = array() ;
			$cache_entrykey_racxs[$entry_key]['treenode_racx'] = $arr_racx['treenode_racx'] ;
			$cache_entrykey_racxs[$entry_key]['entry_racx'] = $arr_racx['entry_racx'] ;
		}
		$treenode_racx = $cache_entrykey_racxs[$entry_key]['treenode_racx'] ;
		$entry_racx = $cache_entrykey_racxs[$entry_key]['entry_racx'] ;
	
		$query = "UPDATE store_file_field
				SET filerecord_field_value_link_treenode_racx='$treenode_racx' , filerecord_field_value_link_entry_racx='$entry_racx'
				WHERE filerecord_id='$filerecord_id' AND filerecord_field_code='$filerecord_field_code'" ;
		$_opDB->query($query) ;
	}
}




function paracrm_lib_file_access( $file_code )
{
	global $_opDB ;

	$TAB = paracrm_lib_file_mapFile( $file_code ) ;
	
	$sql_query = '' ;
	$sql_query.= "SELECT SQL_CALC_FOUND_ROWS ".' '.implode(',',array_map(create_function('$a','return implode(" AS ",$a);'),$TAB['sql_selectfields'])) ;
	$sql_query.= " FROM ".implode(',',array_map(create_function('$a','return implode(" ",$a);'),$TAB['sql_from'])) ;
	foreach( $TAB['sql_join'] as $join_array )
	{
		$sql_query.= " LEFT JOIN {$join_array[0]} {$join_array[1]} ON {$join_array[2]} = {$join_array[3]}" ;
	}
	foreach( $TAB['sql_leftjoin'] as $join_array )
	{
		$sql_query.= " LEFT OUTER JOIN {$join_array[0]} {$join_array[1]} ON {$join_array[2]} = {$join_array[3]}" ;
	}
	$sql_query.= " WHERE 1" ;
	foreach( $TAB['sql_where'] as $where_array )
	{
		$sql_query.= " AND {$where_array[0]} = {$where_array[1]}" ;
	}
	
	
	$return = array() ;
	$return['sql_query_base'] = $sql_query ;
	$return['select_map'] = $TAB['grid_map'] ;
	$return['sql_selectfields'] = $TAB['sql_selectfields'] ;
	return $return ;
}

function paracrm_lib_file_mapFile( $file_code, $is_called=FALSE )
{
	global $_opDB ;
	
	// structure de la réponse
	// ['sql_selectfields']
	// ['sql_from']
	// ['sql_join']
	// ['sql_where']
	// ['grid_map']
	$sql_selectfields = array() ;
	$sql_from = array() ;
	$sql_join = array() ;
	$sql_leftjoin = array() ;
	$sql_where = array() ;
	$grid_map = array() ;
	
	// table en cours
	$myprefix = $file_code.'_' ;
	$mytable = 'view_file_'.$file_code ;
	$sql_from[] = array($mytable,$file_code) ;
	
	if( !$is_called )
	{
		$sql_selectfields[] = array($file_code.'.'.'filerecord_id' , 'filerecord_id') ;
		$grid_cell = array() ;
		$grid_cell['field'] = 'filerecord_id' ;
		$grid_cell['type'] = 'int' ;
		$grid_cell['text'] = '_' ;
		$grid_cell['is_key'] = true ;
		$grid_cell['file_code'] = $file_code ;
		$grid_map[] = $grid_cell ;
	}
	
	
	// if( hasParent ) call paracrm_lib_file_mapFile
	$query = "SELECT * FROM define_file WHERE file_code='$file_code'" ;
	$result = $_opDB->query($query) ;
	$arr = $_opDB->fetch_assoc($result) ;
	if( $arr['file_parent_code'] )
	{
		$TAB = paracrm_lib_file_mapFile( $arr['file_parent_code'], $t_is_called=TRUE ) ;
		$sql_selectfields = array_merge($sql_selectfields,$TAB['sql_selectfields']) ;
		$sql_join[] = array( $TAB['sql_from'][0][0], $TAB['sql_from'][0][1], $TAB['sql_from'][0][1].'.filerecord_id' , $sql_from[0][1].'.filerecord_parent_id' ) ;
		$sql_leftjoin = array_merge($sql_leftjoin,$TAB['sql_leftjoin']) ;
		$grid_map = array_merge($grid_map,$TAB['grid_map']) ;
	}
	
	
	
	$sql_selectfields[] = array($file_code.'.'.'filerecord_id' , $myprefix.'id') ;
	$grid_cell = array() ;
	$grid_cell['field'] = $myprefix.'id' ;
	$grid_cell['type'] = 'int' ;
	$grid_cell['text'] = $myprefix.'id' ;
	$grid_cell['file_code'] = $file_code ;
	$grid_cell['is_display'] = true ;
	$grid_map[] = $grid_cell ;
	
	if( $arr['gmap_is_on'] == 'O' )
	{
		foreach( $_opDB->table_fields('define_gmap') as $field )
		{
			$tfield = 'gmap_'.$field ;
		
			$sql_selectfields[] = array($file_code.'.'.$tfield,$myprefix.$tfield) ;
			$grid_cell = array() ;
			$grid_cell['field'] = $myprefix.$tfield ;
			$grid_cell['type'] = 'string' ;
			$grid_cell['text'] = $myprefix.$tfield ;
			$grid_cell['file_code'] = $file_code ;
			$grid_map[] = $grid_cell ;
		}
	}
	
	switch( $arr['file_type'] )
	{
		case 'media_img' :
		foreach( $_opDB->table_fields('define_media') as $field )
		{
			$tfield = 'media_'.$field ;
		
			$sql_selectfields[] = array($file_code.'.'.$tfield,$myprefix.$tfield) ;
			$grid_cell = array() ;
			$grid_cell['field'] = $myprefix.$tfield ;
			$grid_cell['type'] = 'string' ;
			$grid_cell['text'] = $myprefix.$tfield ;
			$grid_cell['file_code'] = $file_code ;
			$grid_cell['is_display'] = true ;
			$grid_map[] = $grid_cell ;
		}
		break ;
	
	
		default :
		$query = "SELECT * FROM define_file_entry WHERE file_code='$file_code' ORDER BY entry_field_index" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
		{
			if( $arr['entry_field_type'] == 'link' ) {
				$TAB = paracrm_lib_file_mapBible( $bible_code=$arr['entry_field_linkbible'], $remote_table=$file_code, $remote_field=('field_'.$arr['entry_field_code']) ) ;
				
				$sql_selectfields = array_merge($sql_selectfields,$TAB['sql_selectfields']) ;
				$sql_leftjoin = array_merge($sql_leftjoin,$TAB['sql_leftjoin']) ;
				$grid_map = array_merge($grid_map,$TAB['grid_map']) ;
			
				continue ;
			}
		
		
		
			$sql_selectfields[] = array($file_code.'.'.'field_'.$arr['entry_field_code'],$myprefix.'field_'.$arr['entry_field_code']) ;
			$grid_cell = array() ;
			$grid_cell['field'] = $myprefix.'field_'.$arr['entry_field_code'] ;
			$grid_cell['type'] = $arr['entry_field_type'] ;
			$grid_cell['text'] = $arr['entry_field_lib'] ;
			$grid_cell['file_code'] = $file_code ;
			$grid_cell['file_field'] = $arr['entry_field_code'] ;
			$grid_cell['is_display'] = true ;
			$grid_map[] = $grid_cell ;
		}
		break ;
	}


	
	
	// => tous les champs du FILE
	// enum de tous les champs, link LEFT OUTER JOIN BIBLE
	
	
	return array('sql_selectfields'=>$sql_selectfields,
					'sql_from'=>$sql_from,
					'sql_join'=>$sql_join,
					'sql_leftjoin'=>$sql_leftjoin,
					'sql_where'=>$sql_where,
					'grid_map'=>$grid_map
					);
}
function paracrm_lib_file_mapBible( $bible_code, $remote_table, $remote_field )
{
	global $_opDB ;
	
	$sql_selectfields = array() ;
	$sql_leftjoin = array() ;
	$grid_map = array() ;

	$mytable_tree = 'view_bible_'.$bible_code.'_tree' ;
	$myalias_tree = $remote_table.'_'.$remote_field.'_tree' ;
	$query = "SELECT * FROM define_bible_tree WHERE bible_code='$bible_code' ORDER BY tree_field_index" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		if( $arr['tree_field_type'] == 'link' )
			continue ;
			
		$sql_selectfields[] = array($myalias_tree.'.field_'.$arr['tree_field_code']
										,$remote_table.'_'.$remote_field.'_tree_'.$arr['tree_field_code']) ;
		
		$grid_cell = array() ;
		$grid_cell['field'] = $remote_table.'_'.$remote_field.'_tree_'.$arr['tree_field_code'] ;
		$grid_cell['type'] = $arr['tree_field_type'] ;
		$grid_cell['text'] = '('.$bible_code.')'.' '.$arr['tree_field_lib'] ;
		$grid_cell['file_code'] = $remote_table ;
		$grid_cell['file_field'] = substr($remote_field,6,strlen($remote_field)-6) ;
		$grid_cell['link_bible'] = $bible_code ;
		$grid_cell['link_bible_type'] = 'tree' ;
		$grid_cell['link_bible_field'] = $arr['tree_field_code'] ;
		$grid_cell['link_bible_is_key'] = ($arr['tree_field_is_key']=='O')?true:false ;
		$grid_cell['is_display'] = ($arr['tree_field_is_header']=='O')?true:false ;
		$grid_map[] = $grid_cell ;
	}
	$mytable_entry = 'view_bible_'.$bible_code.'_entry' ;
	$myalias_entry = $remote_table.'_'.$remote_field.'_entry' ;
	$query = "SELECT * FROM define_bible_entry WHERE bible_code='$bible_code' ORDER BY entry_field_index" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		if( $arr['entry_field_type'] == 'link' )
			continue ;
	
	
		$sql_selectfields[] = array($myalias_entry.'.field_'.$arr['entry_field_code']
										,$remote_table.'_'.$remote_field.'_entry_'.$arr['entry_field_code']) ;
		
		$grid_cell = array() ;
		$grid_cell['field'] = $remote_table.'_'.$remote_field.'_entry_'.$arr['entry_field_code'] ;
		$grid_cell['type'] = $arr['entry_field_type'] ;
		$grid_cell['text'] = '('.$bible_code.')'.' '.$arr['entry_field_lib'] ;
		$grid_cell['file_code'] = $remote_table ;
		$grid_cell['file_field'] = substr($remote_field,6,strlen($remote_field)-6) ;
		$grid_cell['link_bible'] = $bible_code ;
		$grid_cell['link_bible_type'] = 'entry' ;
		$grid_cell['link_bible_field'] = $arr['entry_field_code'] ;
		$grid_cell['link_bible_is_key'] = ($arr['entry_field_is_key']=='O')?true:false ;
		$grid_cell['is_display'] = ($arr['entry_field_is_header']=='O')?true:false ;
		$grid_map[] = $grid_cell ;
	}
	
	/*
	// ****** OLD METHOD (no racx indexes) ********
	$sql_leftjoin[] = array($mytable_entry ,
								$myalias_entry ,
								$myalias_entry.'.'.'entry_key' ,
								$remote_table.'.'.$remote_field ) ;
	$sql_leftjoin[] = array($mytable_tree ,
								$myalias_tree ,
								$myalias_tree.'.'.'treenode_key' ,
								$myalias_entry.'.'.'treenode_key' ) ;
	// ********************************************
	*/
	$sql_leftjoin[] = array($mytable_entry ,
								$myalias_entry ,
								$myalias_entry.'.'.'entry_racx' ,
								$remote_table.'.'.$remote_field.'_erx' ) ;
	$sql_leftjoin[] = array($mytable_tree ,
								$myalias_tree ,
								$myalias_tree.'.'.'treenode_racx' ,
								$remote_table.'.'.$remote_field.'_trx' ) ;

	return array('sql_selectfields'=>$sql_selectfields,
					'sql_from'=>array(),
					'sql_leftjoin'=>$sql_leftjoin,
					'sql_where'=>array(),
					'grid_map'=>$grid_map
					);
}





?>