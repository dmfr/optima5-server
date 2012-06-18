<?php
function paracrm_queries_paginate_getGrid( $RES, $tab_id )
{
	if( !$RES['RES_labels'][$tab_id] )
		return NULL ;

	$RES_labels_tab = $RES['RES_labels'][$tab_id] ;

	$ret = array() ;
	$ret['columns'] = paracrm_queries_paginate_getGridColumns( $RES, $RES_labels_tab ) ;
	$ret['data'] = paracrm_queries_paginate_getGridRows( $RES, $RES_labels_tab ) ;
	return $ret ;
}
function paracrm_queries_paginate_getGridColumns( $RES, $RES_labels_tab )
{
	$x_grid = current($RES_labels_tab['arr_grid-x']) ;

	$tab = array() ;

	foreach( $RES_labels_tab['arr_grid-y'] as $group_id => $dummy )
	{
		$col = array() ;
		$col['text'] = $RES['RES_titles']['fields_group'][$group_id] ;
		$col['text_italic'] = true ;
		$col['dataIndex'] = 'groupCol_'.$group_id ;
		$col['dataType'] = 'string' ;
		$col['is_bold'] = true ;
		$tab[] = $col ;
	}
	
	if( $x_grid )
	{
		foreach( $x_grid as $x_code => $x_string )
		{
			$col = array() ;
			$col['text'] = $x_string ;
			$col['text_bold'] = true ;
			$col['dataIndex'] = 'valueCol_'.$x_code ;
			$col['dataType'] = 'number' ;
			$tab[] = $col ;
		}
	}
	else
	{
		$col = array() ;
		$col['text'] = $RES_labels_tab['select_lib'] ;
		$col['text_italic'] = true ;
		$col['dataIndex'] = 'valueCol' ;
		$col['dataType'] = 'number' ;
		$tab[] = $col ;
	}
	
	return $tab ;
}
function paracrm_queries_paginate_getGridRows( $RES, $RES_labels_tab )
{
	$arr_static = array() ;
	if( isset($RES_labels_tab['group_id']) )
		$arr_static[$RES_labels_tab['group_id']] = $RES_labels_tab['group_key'] ;
	
	$tab_rows = array() ;
	if( count($RES_labels_tab['arr_grid-y']) )
	{
		foreach( paracrm_queries_paginate_getGridRows_iterate($RES_labels_tab['arr_grid-y'],0) as $arr_y_group_id_key )
		{
			$tab_rows[] = paracrm_queries_paginate_getGridRow( $RES, $arr_static, $RES_labels_tab['arr_grid-x'], $RES_labels_tab['arr_grid-y'], $arr_y_group_id_key ) ;
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
function paracrm_queries_paginate_getGridRow( $RES, $arr_static, $arr_grid_x, $arr_grid_y, $arr_y_group_id_key )
{
	reset($arr_grid_x) ;
	$x_group_id = key($arr_grid_x) ;
	$x_grid = current($arr_grid_x) ;
	
	$row = array() ;
	
	foreach( $arr_y_group_id_key as $group_id => $group_key )
	{
		$dataIndex = 'groupCol_'.$group_id ;
		$row[$dataIndex] = $arr_grid_y[$group_id][$group_key] ;
	}	
	
	if( $x_grid )
	{
		foreach( $x_grid as $x_key => $x_string )
		{
			$dataIndex = 'valueCol_'.$x_key ;
			
			$hash = $arr_static + $arr_y_group_id_key + array($x_group_id=>$x_key) ;
			
			$group_key = array_search($hash,$RES['RES_groupKey_groupDesc']) ;
			if( $group_key === FALSE )
			{
				$row[$dataIndex] = '' ;
			}
			else
			{
				$row[$dataIndex] = $RES['RES_groupKey_value'][$group_key] ;
			}
		}
	}
	else
	{
			$dataIndex = 'valueCol' ;
			
			$hash = $arr_static + $arr_y_group_id_key  ;
			
			$group_key = array_search($hash,$RES['RES_groupKey_groupDesc']) ;
			if( $group_key === FALSE )
			{
				$row[$dataIndex] = '' ;
			}
			else
			{
				$row[$dataIndex] = $RES['RES_groupKey_value'][$group_key] ;
			}
	}
	return $row ;
}


?>