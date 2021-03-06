<?php

function paracrm_lib_file_access( $file_code, $sql_calc_found_rows=FALSE )
{
	global $_opDB ;

	$TAB = paracrm_lib_file_mapFile( $file_code ) ;
	
	$sql_query = '' ;
	$sql_query.= 'SELECT ' ;
	if( $sql_calc_found_rows ) {
		$sql_query.= "SQL_CALC_FOUND_ROWS " ;
	}
	$sql_query.= ' '.implode(',',array_map(create_function('$a','return implode(" AS ",$a);'),$TAB['sql_selectfields'])) ;
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
	if( $TAB['file_parent_code'] ) {
		$return['file_parent_code'] = $TAB['file_parent_code'] ;
	}
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
		$file_parent_code = $arr['file_parent_code'] ;
		$TAB = paracrm_lib_file_mapFile( $arr['file_parent_code'], $t_is_called=TRUE ) ;
		$sql_selectfields = array_merge($sql_selectfields,$TAB['sql_selectfields']) ;
		$sql_join[] = array( $TAB['sql_from'][0][0], $TAB['sql_from'][0][1], $TAB['sql_from'][0][1].'.filerecord_id' , $sql_from[0][1].'.filerecord_parent_id' ) ;
		$sql_leftjoin = array_merge($sql_leftjoin,$TAB['sql_leftjoin']) ;
		$grid_map = array_merge($grid_map,$TAB['grid_map']) ;
	}
	$file_type = $arr['file_type'] ;
	
	
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
	
	$query = "SELECT cfgcal.color_filefield FROM define_file f , define_file_cfg_calendar cfgcal
				WHERE f.file_code='$file_code' AND f.file_code=cfgcal.file_code AND cfgcal.color_is_fixed='O'" ;
	$color_field = $_opDB->query_uniqueValue($query) ;
	$query = "SELECT * FROM define_file_entry WHERE file_code='$file_code' ORDER BY entry_field_index" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		if( $arr['entry_field_type'] == '_label' ) {
			continue ;
		}
		if( $arr['entry_field_type'] == 'join' ) {
			$jMap = paracrm_lib_file_joinPrivate_getMap( $file_code ) ;
			$jMapNode = $jMap[$arr['entry_field_code']] ;
			if( !$jMapNode ) {
				continue ;
			}
			
			$arr['is_join'] = TRUE ;
			$arr['entry_field_type'] = $jMapNode['join_select_file_field_type'] ;
			if( $arr['entry_field_type'] == 'link' ) {
				$arr['entry_field_linktype'] = $jMapNode['join_select_file_field_linktype'] ;
				$arr['entry_field_linkbible'] = $jMapNode['join_select_file_field_linkbible'] ;
			}
		}
		if( $arr['entry_field_type'] == 'link' ) {
			// Champ link "brut" :
			//  - process join
			//  - EditGrid
			$sql_selectfields[] = array($file_code.'.'.'field_'.$arr['entry_field_code'],$myprefix.'field_'.$arr['entry_field_code']) ;
			$grid_cell = array() ;
			$grid_cell['field'] = $myprefix.'field_'.$arr['entry_field_code'] ;
			$grid_cell['type'] = ( $color_field && ($color_field == $arr['entry_field_code']) ) ? 'color' : $arr['entry_field_type'] ;
			$grid_cell['text'] = $arr['entry_field_lib'] ;
			$grid_cell['file_code'] = $file_code ;
			$grid_cell['file_field'] = $arr['entry_field_code'] ;
			$grid_cell['file_field_lib'] = $arr['entry_field_lib'] ;
			$grid_cell['is_display'] = true ;
			$grid_cell['is_raw_link'] = true ;
			$grid_cell['link_bible'] = $arr['entry_field_linkbible'] ;
			$grid_cell['link_type'] = $arr['entry_field_linktype'] ;
			
			$grid_map[] = $grid_cell ;
		
			switch( $arr['entry_field_linktype'] ) {
				case 'treenode' :
					$TAB = paracrm_lib_file_mapBibleTreenode( 
						$bible_code=$arr['entry_field_linkbible'], 
						$remote_table=$file_code, 
						$remote_field=('field_'.$arr['entry_field_code']), 
						$remote_field_lib=$arr['entry_field_lib']
					) ;
				break ;
				
				case 'entry' :
				default :
					$TAB = paracrm_lib_file_mapBibleEntry( 
						$bible_code=$arr['entry_field_linkbible'], 
						$remote_table=$file_code, 
						$remote_field=('field_'.$arr['entry_field_code']), 
						$remote_field_lib=$arr['entry_field_lib']
					) ;
					break ;
			}
			$sql_selectfields = array_merge($sql_selectfields,$TAB['sql_selectfields']) ;
			$sql_leftjoin = array_merge($sql_leftjoin,$TAB['sql_leftjoin']) ;
			$grid_map = array_merge($grid_map,$TAB['grid_map']) ;
		
			continue ;
		}
		
	
		switch( $arr['entry_field_type'] ) {
			case 'date' :
			case 'string' :
			case 'stringplus' :
			case 'bool' :
			case 'extid' :
			case 'number' :
				break ;
				
			default :
				continue 2 ;
		}
	
		$sql_selectfields[] = array($file_code.'.'.'field_'.$arr['entry_field_code'],$myprefix.'field_'.$arr['entry_field_code']) ;
		$grid_cell = array() ;
		$grid_cell['field'] = $myprefix.'field_'.$arr['entry_field_code'] ;
		$grid_cell['type'] = ( $color_field && ($color_field == $arr['entry_field_code']) ) ? 'color' : $arr['entry_field_type'] ;
		$grid_cell['text'] = $arr['entry_field_lib'] ;
		$grid_cell['file_code'] = $file_code ;
		$grid_cell['file_field'] = $arr['entry_field_code'] ;
		$grid_cell['file_field_lib'] = $arr['entry_field_lib'] ;
		$grid_cell['is_display'] = true ;
		$grid_cell['is_header'] = ( $arr['entry_field_is_header'] == 'O' );
		$grid_cell['is_highlight'] = ( $arr['entry_field_is_highlight'] == 'O' );
		$grid_cell['is_join'] = $arr['is_join'] ;
		$grid_map[] = $grid_cell ;
	}
	
	if( $file_type == 'media_img' ) {
		foreach( $_opDB->table_fields('define_media') as $field )
		{
			$tfield = 'media_'.$field ;
		
			$sql_selectfields[] = array($file_code.'.'.$tfield,$myprefix.$tfield) ;
			$grid_cell = array() ;
			$grid_cell['field'] = $myprefix.$tfield ;
			$grid_cell['type'] = 'string' ;
			$grid_cell['text'] = $myprefix.$tfield ;
			$grid_cell['file_code'] = $file_code ;
			$grid_cell['file_field'] = $tfield ;
			$grid_cell['is_display'] = true ;
			$grid_map[] = $grid_cell ;
		}
	}


	
	
	// => tous les champs du FILE
	// enum de tous les champs, link LEFT OUTER JOIN BIBLE
	
	
	return array(
		'file_code'=>$file_code,
		'file_parent_code'=>$file_parent_code,
		'sql_selectfields'=>$sql_selectfields,
		'sql_from'=>$sql_from,
		'sql_join'=>$sql_join,
		'sql_leftjoin'=>$sql_leftjoin,
		'sql_where'=>$sql_where,
		'grid_map'=>$grid_map
	);
}
function paracrm_lib_file_mapBibleEntry( $bible_code, $remote_table, $remote_field, $remote_field_lib=NULL )
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
		$grid_cell['text'] = '('.$remote_field_lib.')'.' '.$arr['tree_field_lib'] ;
		$grid_cell['file_code'] = $remote_table ;
		$grid_cell['file_field'] = substr($remote_field,6,strlen($remote_field)-6) ;
		$grid_cell['file_field_lib'] = $remote_field_lib ;
		$grid_cell['link_bible'] = $bible_code ;
		$grid_cell['link_bible_type'] = 'tree' ;
		$grid_cell['link_bible_field'] = $arr['tree_field_code'] ;
		$grid_cell['link_bible_is_key'] = ($arr['tree_field_is_key']=='O')?true:false ;
		$grid_cell['link_bible_is_header'] = ($arr['tree_field_is_header']=='O')?true:false ;
		$grid_cell['link_bible_is_highlight'] = ($arr['tree_field_is_highlight']=='O')?true:false ;
		$grid_cell['is_display'] = ($arr['tree_field_is_header']=='O')?true:false ;
		$grid_map[] = $grid_cell ;
	}
	$mytable_entry = 'view_bible_'.$bible_code.'_entry' ;
	$myalias_entry = $remote_table.'_'.$remote_field.'_entry' ;
	$query = "SELECT * FROM define_bible_entry WHERE bible_code='$bible_code' ORDER BY entry_field_index" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		/*
		if( $arr['entry_field_type'] == 'link' )
			continue ;*/
			
		$sql_selectfields[] = array($myalias_entry.'.field_'.$arr['entry_field_code']
										,$remote_table.'_'.$remote_field.'_entry_'.$arr['entry_field_code']) ;
		
		$grid_cell = array() ;
		$grid_cell['field'] = $remote_table.'_'.$remote_field.'_entry_'.$arr['entry_field_code'] ;
		$grid_cell['type'] = $arr['entry_field_type'] ;
		$grid_cell['text'] = '('.$remote_field_lib.')'.' '.$arr['entry_field_lib'] ;
		$grid_cell['file_code'] = $remote_table ;
		$grid_cell['file_field'] = substr($remote_field,6,strlen($remote_field)-6) ;
		$grid_cell['file_field_lib'] = $remote_field_lib ;
		$grid_cell['link_bible'] = $bible_code ;
		$grid_cell['link_bible_type'] = 'entry' ;
		$grid_cell['link_bible_field'] = $arr['entry_field_code'] ;
		$grid_cell['link_bible_is_key'] = ($arr['entry_field_is_key']=='O')?true:false ;
		$grid_cell['link_bible_is_header'] = ($arr['entry_field_is_header']=='O')?true:false ;
		$grid_cell['link_bible_is_highlight'] = ($arr['entry_field_is_highlight']=='O')?true:false ;
		$grid_cell['is_display'] = ($arr['entry_field_type'] != 'link' && $arr['entry_field_is_header']=='O')?true:false ;
		$grid_map[] = $grid_cell ;
	}
	
	
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
	/*
	// ****** 2012-05 METHOD (racx indexes) ********
	$sql_leftjoin[] = array($mytable_entry ,
								$myalias_entry ,
								$myalias_entry.'.'.'entry_racx' ,
								$remote_table.'.'.$remote_field.'_erx' ) ;
	$sql_leftjoin[] = array($mytable_tree ,
								$myalias_tree ,
								$myalias_tree.'.'.'treenode_racx' ,
								$remote_table.'.'.$remote_field.'_trx' ) ;
	// ********************************************
	*/

	return array('sql_selectfields'=>$sql_selectfields,
					'sql_from'=>array(),
					'sql_leftjoin'=>$sql_leftjoin,
					'sql_where'=>array(),
					'grid_map'=>$grid_map
					);
}

function paracrm_lib_file_mapBibleTreenode( $bible_code, $remote_table, $remote_field, $remote_field_lib=NULL )
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
		$grid_cell['text'] = '('.$remote_field_lib.')'.' '.$arr['tree_field_lib'] ;
		$grid_cell['file_code'] = $remote_table ;
		$grid_cell['file_field'] = substr($remote_field,6,strlen($remote_field)-6) ;
		$grid_cell['file_field_lib'] = $remote_field_lib ;
		$grid_cell['link_bible'] = $bible_code ;
		$grid_cell['link_bible_type'] = 'tree' ;
		$grid_cell['link_bible_field'] = $arr['tree_field_code'] ;
		$grid_cell['link_bible_is_key'] = ($arr['tree_field_is_key']=='O')?true:false ;
		$grid_cell['link_bible_is_header'] = ($arr['tree_field_is_header']=='O')?true:false ;
		$grid_cell['link_bible_is_highlight'] = ($arr['tree_field_is_highlight']=='O')?true:false ;
		$grid_cell['is_display'] = ($arr['tree_field_is_header']=='O')?true:false ;
		$grid_map[] = $grid_cell ;
	}
	
	
	// ****** OLD METHOD (no racx indexes) ********
	$sql_leftjoin[] = array($mytable_tree ,
								$myalias_tree ,
								$myalias_tree.'.'.'treenode_key' ,
								$remote_table.'.'.$remote_field ) ;
	// ********************************************
	/*
	// ****** 2012-05 METHOD (racx indexes) ********
	$sql_leftjoin[] = array($mytable_entry ,
								$myalias_entry ,
								$myalias_entry.'.'.'entry_racx' ,
								$remote_table.'.'.$remote_field.'_erx' ) ;
	$sql_leftjoin[] = array($mytable_tree ,
								$myalias_tree ,
								$myalias_tree.'.'.'treenode_racx' ,
								$remote_table.'.'.$remote_field.'_trx' ) ;
	// ********************************************
	*/

	return array('sql_selectfields'=>$sql_selectfields,
					'sql_from'=>array(),
					'sql_leftjoin'=>$sql_leftjoin,
					'sql_where'=>array(),
					'grid_map'=>$grid_map
					);
}





?>
