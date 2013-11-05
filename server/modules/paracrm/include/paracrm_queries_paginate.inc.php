<?php
function paracrm_queries_paginate_getGrid( &$RES, $tab_id )
{
	if( !$RES['RES_labels'][$tab_id] )
		return NULL ;

	$RES_labels_tab = $RES['RES_labels'][$tab_id] ;
	
	
	// mise en cache de la table de l'annuaire $RES_groupKey_groupDesc
	if( !isset($RES['RES_groupHash_groupKey']) ) {
		//echo "begin...";
		$RES_groupHash_groupKey = array() ;
		foreach( $RES['RES_groupKey_groupDesc'] as $key_id => $group_desc )
		{
			ksort($group_desc) ;
			$group_hash = implode('@@',$group_desc) ;
			$RES_groupHash_groupKey[$group_hash] = $key_id ;
		}
		//echo "end  ".count($RES_groupHash_groupKey)." \n" ;
		$RES['RES_groupHash_groupKey'] = $RES_groupHash_groupKey ;
	}
	
	// preparation d'un treeview
	$do_treeview = $RES['RES_titles']['cfg_doTreeview'] ;

	$ret = array() ;
	$ret['MAP_groups'] = array(
		'col_iterations'=>array(),
		'col_pivotMap'  =>array(),
		'row_iterations'=>array(),
		'row_pivotMap'  =>array()
	) ;
	$ret['columns'] = paracrm_queries_paginate_getGridColumns( $RES, $RES_labels_tab, $ret['MAP_groups']['col_iterations'], $ret['MAP_groups']['col_pivotMap'] ) ;
	$ret['data'] = paracrm_queries_paginate_getGridRows( $RES, $RES_labels_tab, $do_treeview, $ret['MAP_groups']['row_iterations'], $ret['MAP_groups']['row_pivotMap'] ) ;
	return $ret ;
}
function paracrm_queries_paginate_getGridColumns( &$RES, $RES_labels_tab, &$logIterations_arr_arr_GroupTagId=array(), &$logMap_colId_arr_GroupTagId_value=array() )
{
	$x_grid = current($RES_labels_tab['arr_grid-x']) ;
	if( $x_grid ) {
		$x_groupId = key($RES_labels_tab['arr_grid-x']) ;
		$x_groupTagId = $RES['RES_titles']['group_tagId'][$x_groupId] ;
	}
	
	$map_groupTagId_value_baseTab = array() ;
	if( isset($RES_labels_tab['group_id']) ) {
		$tab_groupId = $RES_labels_tab['group_id'] ;
		$tab_groupTagId = $RES['RES_titles']['group_tagId'][$tab_groupId] ;
		$map_groupTagId_value_baseTab[$tab_groupTagId] = $RES_labels_tab['group_key'] ;
	}
	

	$tab = array() ;

	if( count($RES_labels_tab['arr_grid-y']) == 1 && $RES['RES_titles']['group_fields'][key($RES_labels_tab['arr_grid-y'])] )
	{
		// Si critère Y unique
		// => on développe en colonnes le critère Y
		$group_id = key($RES_labels_tab['arr_grid-y']) ;
		
		foreach( $RES['RES_titles']['group_fields'][$group_id] as $group_display_ref=>$group_display_text )
		{
			$col = array() ;
			$col['text'] = $RES['RES_titles']['group_title'][$group_id].' - '.$group_display_text ;
			$col['text_italic'] = true ;
			$col['dataIndex'] = 'groupCol_'.$group_id.'_'.$group_display_ref ;
			$col['dataType'] = 'string' ;
			$col['is_bold'] = true ;
			$tab[] = $col ;
		}
	}
	else
	{
		// Sinon => 1 colonne par groupe Y
		foreach( $RES_labels_tab['arr_grid-y'] as $group_id => $dummy )
		{
			$col = array() ;
			$col['text'] = $RES['RES_titles']['group_title'][$group_id] ;
			$col['text_italic'] = true ;
			$col['dataIndex'] = 'groupCol_'.$group_id ;
			$col['dataType'] = 'string' ;
			$col['is_bold'] = true ;
			$tab[] = $col ;
		}
	}
	
	if( $x_grid )
	{
		$logIterations_arr_arr_GroupTagId[] = array($x_groupTagId) ;
		foreach( $x_grid as $x_code => $x_arr_strings )
		{
			$map_groupTagId_value = $map_groupTagId_value_baseTab ;
			$map_groupTagId_value[$x_groupTagId] = $x_code ;
			foreach( $RES_labels_tab['map_selectId_lib'] as $select_id => $select_lib ) {
				$col = array() ;
				$col['text'] = ( $select_id == 0 ? implode(' - ',$x_arr_strings) : '' ) ;
				$col['text_bold'] = true ;
				$col['dataIndex'] = 'valueCol_'.$x_code.'_sId_'.$select_id ;
				$col['dataType'] = 'string' ;
				$tab[] = $col ;
				$logMap_colId_arr_GroupTagId_value[$col['dataIndex']] = $map_groupTagId_value + array('='=>array($select_id)) ;
				for( $i=0 ; $i<count($RES['RES_progress']) ; $i++ ) {
					$col = array() ;
					$col['dataIndex'] = 'valueCol_'.$x_code.'_sId_'.$select_id.'_prog_'.$i ;
					$col['dataType'] = 'string' ;
					$col['progressColumn'] = true ;
					$tab[] = $col ;
					$logMap_colId_arr_GroupTagId_value[$col['dataIndex']] = $map_groupTagId_value ;
				}
			}
		}
	}
	else
	{
		$map_groupTagId_value = $map_groupTagId_value_baseTab ; 
		$map_groupTagId_value ; // no pivotage on X
		foreach( $RES_labels_tab['map_selectId_lib'] as $select_id => $select_lib ) {
			$col = array() ;
			$col['text'] = $select_lib ;
			$col['text_italic'] = true ;
			$col['dataIndex'] = 'valueCol'.'_sId_'.$select_id ;
			$col['dataType'] = 'string' ;
			$tab[] = $col ;
			$logMap_colId_arr_GroupTagId_value[$col['dataIndex']] = $map_groupTagId_value + array('='=>array($select_id)) ;
			for( $i=0 ; $i<count($RES['RES_progress']) ; $i++ ) {
				$col = array() ;
				$col['dataIndex'] = 'valueCol'.'_sId_'.$select_id.'_prog_'.$i ;
				$col['dataType'] = 'string' ;
				$col['progressColumn'] = true ;
				$tab[] = $col ;
				$logMap_colId_arr_GroupTagId_value[$col['dataIndex']] = $map_groupTagId_value ;
			}
		}
	}
	
	return $tab ;
}
function paracrm_queries_paginate_getGridRows( &$RES, $RES_labels_tab, $do_treeview=FALSE, &$logIterations_arr_arr_GroupTagId=array(), &$logMap_rowIdx_arr_GroupTagId_value=array() )
{
	$arr_static = array() ;
	$map_groupTagId_value_baseTab = array() ;
	if( isset($RES_labels_tab['group_id']) ) {
		$arr_static[$RES_labels_tab['group_id']] = $RES_labels_tab['group_key'] ;
		
		$tab_groupId = $RES_labels_tab['group_id'] ;
		$tab_groupTagId = $RES['RES_titles']['group_tagId'][$tab_groupId] ;
		$map_groupTagId_value_baseTab[$tab_groupTagId] = $RES_labels_tab['group_key'] ;
	}
	$map_groupTagId_value_baseTab += array('='=>array_keys($RES_labels_tab['map_selectId_lib'])) ;
	
	$tab_rows = array() ;
	if( count($RES_labels_tab['arr_grid-y']) )
	{
		$unique_y_iteration = array() ; // mode Query : 1 seule iteration sur chaque axe
		foreach( $RES_labels_tab['arr_grid-y'] as $y_groupId => $dummy ) {
			$group_tagId = $RES['RES_titles']['group_tagId'][$y_groupId] ;
			$unique_y_iteration[] = $group_tagId ;
		}
		$logIterations_arr_arr_GroupTagId[] = $unique_y_iteration ;
		foreach( paracrm_queries_paginate_getGridRows_iterate($RES_labels_tab['arr_grid-y'],0) as $arr_y_group_id_key )
		{
			$map_groupTagId_value = $map_groupTagId_value_baseTab ;
			foreach( $arr_y_group_id_key as $y_groupId => $y_groupKey ) {
				$group_tagId = $RES['RES_titles']['group_tagId'][$y_groupId] ;
				$map_groupTagId_value[$group_tagId] = $y_groupKey ;
			}
			$logMap_rowIdx_arr_GroupTagId_value[] = $map_groupTagId_value ;
			$tab_rows[] = paracrm_queries_paginate_getGridRow( $RES, $RES_labels_tab, $arr_static, $RES_labels_tab['arr_grid-x'], $RES_labels_tab['arr_grid-y'], $arr_y_group_id_key, $do_treeview ) ;
		}
	}
	else
	{
		$map_groupTagId_value = $map_groupTagId_value_baseTab ;
		$map_groupTagId_value ; // no pivotage on Y
		$logMap_rowIdx_arr_GroupTagId_value[] = $map_groupTagId_value ;
		$tab_rows[] = paracrm_queries_paginate_getGridRow( $RES, $RES_labels_tab, $arr_static, $RES_labels_tab['arr_grid-x'], $RES_labels_tab['arr_grid-y'], array() ) ;
	}
	
	$row_idx = 0 ;
	foreach( $tab_rows as &$row ) {
		$row['_rowIdx'] = $row_idx++ ;
	}
	unset($row);
	
	return $tab_rows ;
}
function paracrm_queries_paginate_getGridRows_iterate( $arr_grid_y, $pos )
{
	reset( $arr_grid_y ) ;
	for( $i=0 ; $i<$pos ; $i++ )
	{
		next( $arr_grid_y ) ;
	}
	
	$group_id = key($arr_grid_y) ;
	
	$tab = array() ;
	foreach( current($arr_grid_y) as $group_key => $dummy )
	{
		$arr = array() ;
		$arr[$group_id] = $group_key ;
		if( $pos + 1 == count($arr_grid_y) )
			$tab[] = $arr ;
		else
		{
			foreach( paracrm_queries_paginate_getGridRows_iterate( $arr_grid_y, $pos+1 ) as $sub_arr )
			{
				$sub_arr = $arr + $sub_arr ;
				$tab[] = $sub_arr ;
			}
		}
	}
	return $tab ;
}
function paracrm_queries_paginate_getGridRow( &$RES, $RES_labels_tab, $arr_static, $arr_grid_x, $arr_grid_y, $arr_y_group_id_key, $do_treeview=FALSE )
{
	reset($arr_grid_x) ;
	$x_group_id = key($arr_grid_x) ;
	$x_grid = current($arr_grid_x) ;
	
	$row = array() ;
	
	if( $do_treeview && count($arr_y_group_id_key) == 1 ) {
		// do_treeview = TRUE 
		// => on ajoute les champs necessaires a la construction du TV
		$group_id = key($arr_y_group_id_key) ;
		$group_key = current($arr_y_group_id_key) ;
		
		$row['_id'] = $arr_grid_y[$group_id][$group_key]['_id'] ;
		$row['_parent_id'] = $arr_grid_y[$group_id][$group_key]['_parent_id'] ;
	}
	
	if( count($arr_y_group_id_key) == 1 && $RES['RES_titles']['group_fields'][key($arr_y_group_id_key)] )
	{
		// Si critère Y unique
		// => on développe en colonnes le critère Y
		$group_id = key($arr_y_group_id_key) ;
		$group_key = current($arr_y_group_id_key) ;
		
		foreach( $RES['RES_titles']['group_fields'][$group_id] as $group_display_ref=>$group_display_text )
		{
			$dataIndex = 'groupCol_'.$group_id.'_'.$group_display_ref ;
			$row[$dataIndex] = $arr_grid_y[$group_id][$group_key][$group_display_ref] ;
		}
	}
	else
	{
		// Sinon => 1 colonne par groupe Y
		foreach( $arr_y_group_id_key as $group_id => $group_key )
		{
			$dataIndex = 'groupCol_'.$group_id ;
			$row[$dataIndex] = implode(' - ',$arr_grid_y[$group_id][$group_key]) ;
		}
	}
	
	if( $x_grid )
	{
		foreach( $x_grid as $x_key => $x_string )
		{
			$dataIndex_base = 'valueCol_'.$x_key ;
			
			$hash = $arr_static + $arr_y_group_id_key + array($x_group_id=>$x_key) ;
			
			// $group_key = array_search($hash,$RES['RES_groupKey_groupDesc']) ;
			$group_key = paracrm_queries_paginate_getGroupKey( $RES, $hash ) ;
			
			foreach( $RES_labels_tab['map_selectId_lib'] as $select_id => $select_lib ) {
				$dataIndex = $dataIndex_base.'_sId_'.$select_id ;
				if( $group_key === FALSE )
				{
					$row[$dataIndex] = $RES['RES_selectId_nullValue'][$select_id] ;
				}
				elseif( !isset($RES['RES_groupKey_selectId_value'][$group_key]) )
				{
					$row[$dataIndex] = $RES['RES_selectId_nullValue'][$select_id] ;
				}
				else
				{
					$ref_value = $RES['RES_groupKey_selectId_value'][$group_key][$select_id] ;
					if( is_numeric($ref_value) ) {
						if( $RES['RES_selectId_round'] > 0 ) {
							$row[$dataIndex] = round($ref_value,$RES['RES_selectId_round'][$select_id]) ;
						} else {
							$row[$dataIndex] = round($ref_value) ;
						}
					} else {
						$row[$dataIndex] = $ref_value ;
					}
					foreach( $RES['RES_progress_groupKey_selectId_value'] as $id => $subRES_progress ) {
						$ref_value ;
						$dataIndex_alt = $dataIndex.'_prog_'.$id ;
						if( !isset($subRES_progress[$group_key][$select_id]) )
							$row[$dataIndex_alt] = NULL ;
						else
						{
							$alt_value = $subRES_progress[$group_key][$select_id] ;
							$delta = $ref_value - $alt_value ;
							if( $RES['RES_selectId_round'][$select_id] > 0 ) {
								$delta = round($delta,$RES['RES_selectId_round'][$select_id]) ;
							} else {
								$delta = round($delta) ;
							}
							$row[$dataIndex_alt] = $delta ;
						}
					}
				}
			}
		}
	}
	else
	{
		$dataIndex_base = 'valueCol' ;
		
		$hash = $arr_static + $arr_y_group_id_key  ;
		
		// $group_key = array_search($hash,$RES['RES_groupKey_groupDesc']) ;
		$group_key = paracrm_queries_paginate_getGroupKey( $RES, $hash ) ;
		foreach( $RES_labels_tab['map_selectId_lib'] as $select_id => $select_lib ) {
			$dataIndex = $dataIndex_base.'_sId_'.$select_id ;
			if( $group_key === FALSE )
			{
				$row[$dataIndex] = $RES['RES_selectId_nullValue'][$select_id] ;
			}
			elseif( !isset($RES['RES_groupKey_selectId_value'][$group_key]) )
			{
				$row[$dataIndex] = $RES['RES_selectId_nullValue'][$select_id] ;
			}
			else
			{
				$ref_value = $RES['RES_groupKey_selectId_value'][$group_key][$select_id] ;
				if( is_numeric($ref_value) ) {
					if( $RES['RES_selectId_round'][$select_id] > 0 ) {
						$row[$dataIndex] = round($ref_value,$RES['RES_selectId_round'][$select_id]) ;
					} else {
						$row[$dataIndex] = round($ref_value) ;
					}
				} else {
					$row[$dataIndex] = $ref_value ;
				}
				foreach( $RES['RES_progress_groupKey_selectId_value'] as $id => $subRES_progress ) {
					$ref_value ;
					$dataIndex_alt = $dataIndex.'_prog_'.$id ;
					if( !isset($subRES_progress[$group_key][$select_id]) )
						$row[$dataIndex_alt] = NULL ;
					else
					{
						$alt_value = $subRES_progress[$group_key][$select_id] ;
						$delta = $ref_value - $alt_value ;
						if( $RES['RES_selectId_round'][$select_id] > 0 ) {
							$delta = round($delta,$RES['RES_selectId_round'][$select_id]) ;
						} else {
							$delta = round($delta) ;
						}
						$row[$dataIndex_alt] = $delta ;
					}
				}
			}
		}
	}
	return $row ;
}
function paracrm_queries_paginate_getGroupKey( &$RES, $group_desc )
{
	ksort($group_desc) ;
	if( !isset($RES['RES_groupHash_groupKey']) ) {
		//echo "WARN" ;
	}
	$group_hash = implode('@@',$group_desc) ;
	if( !$key_id = $RES['RES_groupHash_groupKey'][$group_hash] ) {
		return FALSE ;
	}
	return $key_id ;
}







function paracrm_queries_paginate_buildTree( $grid_data ) {
	// sort/index all nodes per parent
	$arr_parentId_nodes = array() ;
	foreach( $grid_data as $grid_row ) {
		$row_parent_id = $grid_row['_parent_id'] ;
		if( !isset($arr_parentId_nodes[$row_parent_id]) ) {
			$arr_parentId_nodes[$row_parent_id] = array() ;
		}
		$arr_parentId_nodes[$row_parent_id][] = $grid_row ;
	}

	return array('expanded'=>TRUE,'children'=>paracrm_queries_paginate_buildTree_call($arr_parentId_nodes,'')) ;
}
function paracrm_queries_paginate_buildTree_call( $arr_parentId_nodes, $parent_id ) {
	$arr = array() ;
	foreach( $arr_parentId_nodes[$parent_id] as $grid_row ) {
		$row_id = $grid_row['_id'] ;
		
		if( $arr_parentId_nodes[$row_id] ) {
			$grid_row['children'] = paracrm_queries_paginate_buildTree_call($arr_parentId_nodes,$row_id) ;
			$grid_row['expanded'] = TRUE ;
		} else {
			$grid_row['leaf'] = TRUE ;
		}
		
		$arr[] = $grid_row ;
	}
	return $arr ;
}

?>