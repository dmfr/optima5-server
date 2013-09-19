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
	$ret['columns'] = paracrm_queries_paginate_getGridColumns( $RES, $RES_labels_tab ) ;
	$ret['data'] = paracrm_queries_paginate_getGridRows( $RES, $RES_labels_tab, $do_treeview ) ;
	return $ret ;
}
function paracrm_queries_paginate_getGridColumns( &$RES, $RES_labels_tab )
{
	$x_grid = current($RES_labels_tab['arr_grid-x']) ;

	$tab = array() ;

	if( count($RES_labels_tab['arr_grid-y']) == 1 )
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
		foreach( $x_grid as $x_code => $x_arr_strings )
		{
			$col = array() ;
			$col['text'] = implode(' - ',$x_arr_strings) ;
			$col['text_bold'] = true ;
			$col['dataIndex'] = 'valueCol_'.$x_code ;
			$col['dataType'] = 'string' ;
			$tab[] = $col ;
			for( $i=0 ; $i<count($RES['RES_progress']) ; $i++ ) {
				$col = array() ;
				$col['dataIndex'] = 'valueCol_'.$x_code.'_prog_'.$i ;
				$col['dataType'] = 'string' ;
				$col['progressColumn'] = true ;
				$tab[] = $col ;
			}
		}
	}
	else
	{
		$col = array() ;
		$col['text'] = $RES_labels_tab['select_lib'] ;
		$col['text_italic'] = true ;
		$col['dataIndex'] = 'valueCol' ;
		$col['dataType'] = 'string' ;
		$tab[] = $col ;
		for( $i=0 ; $i<count($RES['RES_progress']) ; $i++ ) {
			$col = array() ;
			$col['dataIndex'] = 'valueCol'.'_prog_'.$i ;
			$col['dataType'] = 'string' ;
			$col['progressColumn'] = true ;
			$tab[] = $col ;
		}
	}
	
	return $tab ;
}
function paracrm_queries_paginate_getGridRows( &$RES, $RES_labels_tab, $do_treeview=FALSE )
{
	$arr_static = array() ;
	if( isset($RES_labels_tab['group_id']) )
		$arr_static[$RES_labels_tab['group_id']] = $RES_labels_tab['group_key'] ;
	
	$tab_rows = array() ;
	if( count($RES_labels_tab['arr_grid-y']) )
	{
		foreach( paracrm_queries_paginate_getGridRows_iterate($RES_labels_tab['arr_grid-y'],0) as $arr_y_group_id_key )
		{
			$tab_rows[] = paracrm_queries_paginate_getGridRow( $RES, $arr_static, $RES_labels_tab['arr_grid-x'], $RES_labels_tab['arr_grid-y'], $arr_y_group_id_key, $do_treeview ) ;
		}
	}
	else
	{
		$tab_rows[] = paracrm_queries_paginate_getGridRow( $RES, $arr_static, $RES_labels_tab['arr_grid-x'], $RES_labels_tab['arr_grid-y'], array() ) ;
	}
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
function paracrm_queries_paginate_getGridRow( &$RES, $arr_static, $arr_grid_x, $arr_grid_y, $arr_y_group_id_key, $do_treeview=FALSE )
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
	
	if( count($arr_y_group_id_key) == 1 )
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
			$dataIndex = 'valueCol_'.$x_key ;
			
			$hash = $arr_static + $arr_y_group_id_key + array($x_group_id=>$x_key) ;
			
			// $group_key = array_search($hash,$RES['RES_groupKey_groupDesc']) ;
			$group_key = paracrm_queries_paginate_getGroupKey( $RES, $hash ) ;
			if( $group_key === FALSE )
			{
				$row[$dataIndex] = $RES['RES_nullValue'] ;
			}
			elseif( !isset($RES['RES_groupKey_value'][$group_key]) )
			{
				$row[$dataIndex] = $RES['RES_nullValue'] ;
			}
			else
			{
				$ref_value = $RES['RES_groupKey_value'][$group_key] ;
				if( is_numeric($ref_value) ) {
					if( $RES['RES_round'] > 0 ) {
						$row[$dataIndex] = round($ref_value,$RES['RES_round']) ;
					} else {
						$row[$dataIndex] = round($ref_value) ;
					}
				} else {
					$row[$dataIndex] = $ref_value ;
				}
				foreach( $RES['RES_progress'] as $id => $subRES_progress ) {
					$ref_value ;
					$dataIndex_alt = $dataIndex.'_prog_'.$id ;
					if( !isset($subRES_progress[$group_key]) )
						$row[$dataIndex_alt] = NULL ;
					else
					{
						$alt_value = $subRES_progress[$group_key] ;
						$delta = $ref_value - $alt_value ;
						if( $RES['RES_round'] > 0 ) {
							$delta = round($delta,$RES['RES_round']) ;
						} else {
							$delta = round($delta) ;
						}
						$row[$dataIndex_alt] = $delta ;
					}
				}
			}
		}
	}
	else
	{
			$dataIndex = 'valueCol' ;
			
			$hash = $arr_static + $arr_y_group_id_key  ;
			
			// $group_key = array_search($hash,$RES['RES_groupKey_groupDesc']) ;
			$group_key = paracrm_queries_paginate_getGroupKey( $RES, $hash ) ;
			if( $group_key === FALSE )
			{
				$row[$dataIndex] = $RES['RES_nullValue'] ;
			}
			elseif( !isset($RES['RES_groupKey_value'][$group_key]) )
			{
				$row[$dataIndex] = $RES['RES_nullValue'] ;
			}
			else
			{
				$ref_value = $RES['RES_groupKey_value'][$group_key] ;
				if( is_numeric($ref_value) ) {
					if( $RES['RES_round'] > 0 ) {
						$row[$dataIndex] = round($ref_value,$RES['RES_round']) ;
					} else {
						$row[$dataIndex] = round($ref_value) ;
					}
				} else {
					$row[$dataIndex] = $ref_value ;
				}
				foreach( $RES['RES_progress'] as $id => $subRES_progress ) {
					$ref_value ;
					$dataIndex_alt = $dataIndex.'_prog_'.$id ;
					if( !isset($subRES_progress[$group_key]) )
						$row[$dataIndex_alt] = NULL ;
					else
					{
						$alt_value = $subRES_progress[$group_key] ;
						$delta = $ref_value - $alt_value ;
						if( $RES['RES_round'] > 0 ) {
							$delta = round($delta,$RES['RES_round']) ;
						} else {
							$delta = round($delta) ;
						}
						$row[$dataIndex_alt] = $delta ;
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

?>