<?php
function paracrm_queries_mpaginate_getGrid( &$RES, $tab_id )
{
	if( !$RES['RES_labels'][$tab_id] )
		return NULL ;

	$RES_labels_tab = $RES['RES_labels'][$tab_id] ;
	
	
	// mise en cache de la table de l'annuaire $RES_groupKey_groupDesc
	if( !isset($RES['RES_groupHash_groupKey']) ) {
		print_r($RES['RES_groupHash_groupKey']) ;
			
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
	

	$ret = array() ;
	$ret['columns'] = paracrm_queries_mpaginate_getGridColumns( $RES, $RES_labels_tab ) ;
	$ret['data'] = paracrm_queries_mpaginate_getGridRows( $RES, $RES_labels_tab, $ret['columns'] ) ;
	return $ret ;
}
function paracrm_queries_mpaginate_getGridColumns( &$RES, $RES_labels_tab )
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
	
	
	$passed_xGroups = array() ;
	$passed_selectIds = array() ;
	$count_RES_selectId = count($RES['RES_selectId_infos']) ;
	for( $select_id=0 ; $select_id<count($RES['RES_selectId_infos']) ; $select_id++ ) {
	
		if( in_array($select_id,$passed_selectIds) )
			continue ;
	
		$RES_infos = $RES['RES_selectId_infos'][$select_id] ;
		
		if( $RES_infos['axis_x_detached'] ) {
			$col = array() ;
			$col['text'] = $RES_infos['select_lib'] ;
			$col['text_italic'] = true ;
			$col['dataIndex'] = 'valueCol_'.$select_id ;
			$col['dataType'] = 'string' ;
			if( $RES_infos['axis_x_setDetached'] ) {
				$col['detachedColumn'] = true ;
			}
			$tab[] = $col ;
			
			$passed_selectIds[] = $select_id ;
			
			continue ;
		}
	
		// on cherche quel groupe-X est concerné
		foreach( $RES_labels_tab['arr_grid-x'] as $x_groupId => $x_grid ) {
			if( in_array($x_groupId,$passed_xGroups) || !in_array($x_groupId,$RES_infos['axis_groups']) ) {
				continue ;
			}
			$passed_xGroups[] = $x_groupId ;
			
			// du coup=> toutes les queries concernées par ce X groupe
			// - d'abord les requêtes attachées x + y
			// - ensuite les requêtes "axis_y_detached" => si on a deja un 'axe' X (des colonnes), on rattache ces requête en pied de page sur les mêmes colonnes
			$inner_selectIds = array() ;
			for( $inner_select_id=0 ; $inner_select_id<count($RES['RES_selectId_infos']) ; $inner_select_id++ ) {
				$inner_RES_infos = $RES['RES_selectId_infos'][$inner_select_id] ;
				if( $inner_RES_infos['axis_y_detached'] ) {
					continue ;
				}
				if( !in_array($x_groupId,$inner_RES_infos['axis_groups']) )
					continue ;
			
				$inner_selectIds[] = $inner_select_id;
			}
			for( $inner_select_id=0 ; $inner_select_id<count($RES['RES_selectId_infos']) ; $inner_select_id++ ) {
				$inner_RES_infos = $RES['RES_selectId_infos'][$inner_select_id] ;
				if( !$inner_RES_infos['axis_y_detached'] ) {
					continue ;
				}
				if( !in_array($x_groupId,$inner_RES_infos['axis_groups']) )
					continue ;
			
				if( count($inner_selectIds) > 0 ) {
					// déja un ensemble de colonnes => pied de page sur le même ensemble
					continue ;
				}
				$inner_selectIds[] = $inner_select_id;
			}
			
			foreach( $x_grid as $x_code => $x_arr_strings ) {
				
				foreach( $inner_selectIds as $inner_select_id ) {
					$col = array() ;
					$col['text'] = implode(' - ',$x_arr_strings) ;
					$col['text_bold'] = true ;
					$col['dataIndex'] = 'valueCol_'.$inner_select_id.'_'.$x_code ;
					$col['dataType'] = 'string' ;
					$tab[] = $col ;
				}
			}
		}
	}
	
	$col = array() ;
	$col['dataIndex'] = 'detachedRow' ;
	$col['invisible'] = TRUE ;
	$tab[] = $col ;
	
	return $tab ;
}
function paracrm_queries_mpaginate_getGridRows( &$RES, $RES_labels_tab, $grid_columns )
{
	$arr_static = array() ;
	if( isset($RES_labels_tab['group_id']) )
		$arr_static[$RES_labels_tab['group_id']] = $RES_labels_tab['group_key'] ;
		
	// $arr_static = constitution d'un hash statique, avec tous les groupes potentiels à %%% (pas de valeur)
	foreach( $RES_labels_tab['arr_grid-y'] as $group_id => $dummy ) {
		if( !$group_id ) {
			continue ;
		}
		$arr_static[$group_id] = '%%%' ;
	}
	foreach( $RES_labels_tab['arr_grid-x'] as $group_id => $dummy ) {
		if( !$group_id ) {
			continue ;
		}
		$arr_static[$group_id] = '%%%' ;
	}
	
	$tab_rows = array() ;
	//if( count($RES_labels_tab['arr_grid-y']) ) // toujours oui car on a au moins le groupe fantome
	foreach( $RES_labels_tab['arr_grid-y'] as $y_groupId => $y_grid )
	{
		foreach( $y_grid as $y_code => $y_arr_strings )
		{
			$arr_y_group_id_key = array() ;
			$arr_y_group_id_key[$y_groupId] = $y_code ;
		
			$tab_rows[] = paracrm_queries_mpaginate_getGridRow( $RES, $arr_static, $RES_labels_tab['arr_grid-x'], $RES_labels_tab['arr_grid-y'], $arr_y_group_id_key ) ;
		}
	}
	// ensuite => requêtes détachées du Y
	reset($grid_columns) ;
	$ttmp = current($grid_columns) ;
	$nullY_titleColumnDataindex = $ttmp['dataIndex'] ;
	foreach( $RES['RES_selectId_infos'] as $select_id=>$RES_infos ) {
		if( !$RES_infos['axis_y_detached'] ) {
			continue ;
		}
		
		$tab_rows[] = paracrm_queries_mpaginate_getGridRow( $RES, $arr_static, $RES_labels_tab['arr_grid-x'], $RES_labels_tab['arr_grid-y'], NULL, $select_id, $nullY_titleColumnDataindex ) ;
	}
	
	
	
	
	return $tab_rows ;
}
function paracrm_queries_mpaginate_getGridRows_iterate( $arr_grid_y, $pos )
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
			foreach( paracrm_queries_mpaginate_getGridRows_iterate( $arr_grid_y, $pos+1 ) as $sub_arr )
			{
				$sub_arr = $arr + $sub_arr ;
				$tab[] = $sub_arr ;
			}
		}
	}
	return $tab ;
}
function paracrm_queries_mpaginate_getGridRow( &$RES, $arr_static, $arr_grid_x, $arr_grid_y, $arr_y_group_id_key, $nullY_selectId=FALSE, $nullY_titleColumnDataindex=FALSE )
{
	reset($arr_grid_x) ;
	$x_group_id = key($arr_grid_x) ;
	$x_grid = current($arr_grid_x) ;
	
	$row = array() ;
	if( $nullY_selectId !== FALSE ) {
		$arr_y_group_id_key = array() ;
		$row['detachedRow'] = TRUE ;
	}
	
	if( $nullY_selectId !== FALSE ) {
		$row[$nullY_titleColumnDataindex] = $RES['RES_selectId_infos'][$nullY_selectId]['select_lib'] ;
	}
	elseif( count($arr_y_group_id_key) == 1 )
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
	
	
	// Parcours de toutes les calculs pour reconstituer une ligne
	$count_RES_selectId = count($RES['RES_selectId_infos']) ;
	for( $select_id=0 ; $select_id<count($RES['RES_selectId_infos']) ; $select_id++ ) {
		
		$RES_infos = $RES['RES_selectId_infos'][$select_id] ;
		
		if( $RES_infos['axis_x_detached'] ) {
			$dataIndex = 'valueCol_'.$select_id ;
			// HERE: on est dans une case de la ligne
			
			$hash = $arr_y_group_id_key + $arr_static  ;
			
			// $group_key = array_search($hash,$RES['RES_groupKey_groupDesc']) ;
			$group_key = paracrm_queries_mpaginate_getGroupKey( $RES, $hash ) ;
			if( $nullY_selectId !== FALSE ) {
				$ref_value = $RES['RES_selectId_groupKey_value'][$nullY_selectId][$group_key] ;
			} else {
				$ref_value = $RES['RES_selectId_groupKey_value'][$select_id][$group_key] ;
			}
			if( is_numeric($ref_value) ) {
				if( $RES_infos['math_round'] > 0 ) {
					$row[$dataIndex] = round($ref_value,$RES_infos['math_round']) ;
				} else {
					$row[$dataIndex] = round($ref_value) ;
				}
			} else {
				$row[$dataIndex] = $ref_value ;
			}
			
			continue ;
		}
		
		
		if( $RES_infos['axis_y_detached'] ) {
			continue ;
		}
		foreach( $arr_grid_x as $x_groupId => $x_grid ) {
			foreach( $x_grid as $x_key => $x_arr_strings ) {
				$dataIndex = 'valueCol_'.$select_id.'_'.$x_key ;
				// HERE: on est dans une case de la ligne
				
				$hash = $arr_y_group_id_key + array($x_groupId=>$x_key) + $arr_static ;
				
				// $group_key = array_search($hash,$RES['RES_groupKey_groupDesc']) ;
				$group_key = paracrm_queries_mpaginate_getGroupKey( $RES, $hash ) ;
				if( $nullY_selectId !== FALSE ) {
					$ref_value = $RES['RES_selectId_groupKey_value'][$nullY_selectId][$group_key] ;
				} else {
					$ref_value = $RES['RES_selectId_groupKey_value'][$select_id][$group_key] ;
				}
				if( is_numeric($ref_value) ) {
					if( $RES_infos['math_round'] > 0 ) {
						$row[$dataIndex] = round($ref_value,$RES_infos['math_round']) ;
					} else {
						$row[$dataIndex] = round($ref_value) ;
					}
				} else {
					$row[$dataIndex] = $ref_value ;
				}
			}
		}
	}
	
	
	
	
	return $row ;
}
function paracrm_queries_mpaginate_getGroupKey( &$RES, $group_desc )
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