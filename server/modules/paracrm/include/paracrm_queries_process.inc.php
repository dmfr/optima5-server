<?php

function paracrm_queries_process_buildTrees() {
	
	global $_opDB ;
	
	global $arr_bible_trees , $arr_bible_entries ;
	

	$arr_bibles = array() ;
	$query = "SELECT bible_code FROM define_bible" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$arr_bibles[] = $arr['bible_code'] ;
	
	}
	
	$arr_bible_trees = array() ;
	
	foreach( $arr_bibles as $bible_code )
	{
		$query = "SELECT treenode_key, treenode_parent_key FROM store_bible_{$bible_code}_tree" ;
		$result = $_opDB->query($query) ;
		$raw_records = array() ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
		{
			$record = array() ;
			$record['treenode_key'] = $arr['treenode_key'] ;
			$record['treenode_parent_key'] = $arr['treenode_parent_key'] ;
			$raw_records[] = $record ;
		}
		
		$tree = new GenericTree("&") ;
		do {
			$nb_pushed_this_pass = 0 ;
			foreach( $raw_records as $mid => $record )
			{
				if( $record['treenode_parent_key'] == '' )
					$record['treenode_parent_key'] = '&' ;
				if( $record['treenode_key'] == '' )
					continue ;
			
				$treenode_parent_key = $record['treenode_parent_key'] ;
				$treenode_key = $record['treenode_key'] ;
				
				if( $tree->getTree( $treenode_parent_key ) != NULL )
				{
					$parent_node = $tree->getTree( $treenode_parent_key ) ;
					$parent_node->addLeaf( $treenode_key ) ;
					unset($raw_records[$mid]) ;
					
					$nb_pushed_this_pass++ ;
					$nb_pushed++ ;
				}
				if( count($raw_records) == 0 )
					break ;
			}
		}
		while( $nb_pushed_this_pass > 0 ) ;
		$arr_bible_trees[$bible_code] = $tree ;
		
		
		
		$ttmp = array() ;
		$query = "SELECT e.entry_key, e.treenode_key
						FROM store_bible_{$bible_code}_entry e
						ORDER BY e.treenode_key, e.entry_key" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE )
		{
			$record = array() ;
			$record['entry_key'] = $arr[0] ;
			$record['treenode_key'] = $arr[1] ;
			$ttmp[$arr[0]] = $record ;
		}
		$arr_bible_entries[$bible_code] = $ttmp ;
	}
	
	
	
	//$mtree = $arr_bible_trees['STORE'] ;
	//print_r( $mtree->getTree('33040')->getAllMembers() ) ;
	

	return ;
}




function paracrm_queries_process_qmerge($arr_saisie, $debug=FALSE)
{
	global $_opDB ;

	/* ****************** EXEC d'1 qmerge ******************
	
	- Chargement de toutes les queries
	
	- Evaluation de la compatibilité des groupes
	$TAB[geometry][grouphash] = array( query_id+query_group_idx )

	- Exec de toutes les requetes
	
	- 2 + 3 : constitution des labels du Qmerge
	
	- Pour chaque calcul du Qmerge,
	
	******************************************************** */
	
	if( $debug ) {
		echo "Qmerge 1: loading queries..." ;
	}
	$arr_queryId_arrSaisieQuery = array() ;
	foreach( $arr_saisie['arr_query_id'] as $query_id ) {
		
		$arrSaisieQuery = array() ;
		foreach( $arr_saisie['bible_queries'] as $arrSaisieQuery_test ) {
			if( $arrSaisieQuery_test['query_id'] == $query_id ) {
				$arrSaisieQuery = $arrSaisieQuery_test ;
			}
		}
		
		$target_file_code = $arrSaisieQuery['target_file_code'] ;
		$arrSaisieQuery['treefields_root'] = $arr_saisie['bible_files_treefields'][$target_file_code] ;
		
		$arr_queryId_arrSaisieQuery[$query_id] = $arrSaisieQuery ;
	}
	//print_r($arr_queryId_arrSaisieQuery) ;
	if( $debug ) {
		echo "OK\n" ;
	}
	
	
	if( $debug ) {
		echo "Qmerge 1b: merging wheres..." ;
	}
	foreach( $arr_saisie['fields_mwhere'] as $field_mwhere ) {
		foreach( $field_mwhere['query_fields'] as $query_field )
		{
			$target_query_id = $query_field['query_id'] ;
			$target_query_wherefield_idx = $query_field['query_wherefield_idx'] ;
			
		
			foreach( $field_mwhere as $mkey => $mvalue ) {
				if( strpos($mkey,'condition_') === 0 ) {
					$arr_queryId_arrSaisieQuery[$target_query_id]['fields_where'][$target_query_wherefield_idx][$mkey] = $mvalue ;
				}
			}
		}
	}
	if( $debug ) {
		echo "OK\n" ;
	}
	
	
	
	
	if( $debug ) {
		echo "Qmerge 2: evaluating groups..." ;
	}
	$probeGeoGrouphashArrQueries = array(
		'tab' => array(),
		'grid-x'=>array(),
		'grid-y'=>array()
	) ;
	foreach( $arr_saisie['arr_query_id'] as $query_id ) {
	
		$arrSaisieQuery = $arr_queryId_arrSaisieQuery[$query_id] ;
		foreach( $arrSaisieQuery['fields_group'] as $idx => $field_group ) {
			switch( $field_group['display_geometry'] ) {
				case 'tab' :
				case 'grid-x' :
				case 'grid-y' :
				$geometry = $field_group['display_geometry'] ;
				break ;
				
				default :
				$geometry = 'undefined' ;
				break ;
			}
			
			$grouphash = '' ;
			switch( $field_group['field_type'] ) {
				case 'link' :
				$grouphash.= 'BIBLE'.'%'.$field_group['field_linkbible'] ;
				switch( $field_group['group_bible_type'] ) {
					case 'ENTRY' :
						$grouphash .= '%'.'ENTRY' ;
						break ;
					case 'TREE' :
						$grouphash .= '%'.'TREE'.'%'.$field_group['group_bible_tree_depth'] ;
				}
				break ;
				
				case 'date' :
				$grouphash.= 'DATE'.'%'.$field_group['group_date_type'] ;
				break ;
				
				default :
				$grouphash.= 'UNKNOWN' ;
				break ;
			}
			
			if( !is_array($probeGeoGrouphashArrQueries[$geometry][$grouphash]) )
				$probeGeoGrouphashArrQueries[$geometry][$grouphash] = array() ;
				
			$probeGeoGrouphashArrQueries[$geometry][$grouphash][] = array('query_id'=>$query_id,'query_fieldgroup_idx'=>$idx) ;
		}
	}
	
	$map_grouphash_queryGroupId = array() ;
	foreach( $probeGeoGrouphashArrQueries as $geometry => $t1 )
	{
		foreach( $t1 as $grouphash => $t2 )
		{
			foreach( $t2 as $target_infos )
			{
				$query_id = $target_infos['query_id'] ;
				$idx = $target_infos['query_fieldgroup_idx'] ;
			
				$map_grouphash_queryGroupId[$query_id][$grouphash] = $idx ;
			}
		}
	}
	
	if( $debug ) {
		echo "OK\n" ;
	}
	
	
	
	
	if( $debug ) {
		echo "Qmerge 3: executing queries..." ;
	}
	$RESqueries = array() ;
	foreach( $arr_queryId_arrSaisieQuery as $query_id => $arrSaisieQuery ) {
		$RESquery = paracrm_queries_process_query($arrSaisieQuery , FALSE ) ;
		$RESquery_groupHash_groupKey = array() ;
		foreach( $RESquery['RES_groupKey_groupDesc'] as $key_id => $group_desc )
		{
			ksort($group_desc) ;
			$group_hash = implode('@@',$group_desc) ;
			$RESquery_groupHash_groupKey[$group_hash] = $key_id ;
		}
		//echo "end  ".count($RES_groupHash_groupKey)." \n" ;
		$RESquery['RES_groupHash_groupKey'] = $RESquery_groupHash_groupKey ;
		
		$RESqueries[$query_id] = $RESquery ;
	}
	// print_r($RESqueries) ;
	if( $debug ) {
		echo "OK\n" ;
	}
	
	
	
	
	
	
	
	if( $debug ) {
		echo "Qmerge 4: building labels (for each tab)..." ;
	}
	$arr_nbTabs = array() ;
	foreach( $RESqueries as $RESquery ) {
		if( !in_array(count($RESquery['RES_labels']),$arr_nbTabs) )
			$arr_nbTabs[] = count($RESquery['RES_labels']) ;
	}
	if( count($arr_nbTabs) != 1 ) {
		return NULL ;
	}
	$nbTabs = current($arr_nbTabs) ;
	$RES_labels = array() ;
	$RES_titles = array() ;
	for( $tabidx=0 ; $tabidx<$nbTabs ; $tabidx++ )
	{
		$group_key = NULL ;
		foreach( $RESqueries as $RESquery ) {
			if( !isset($RESquery['RES_labels'][$tabidx]['group_key']) ) 
				continue ;
			if( $group_key === NULL ) {
				$group_key = $RESquery['RES_labels'][$tabidx]['group_key'] ;
				$tab_title = $RESquery['RES_labels'][$tabidx]['tab_title'] ;
			}
			elseif( $RESquery['RES_labels'][$tabidx]['group_key'] !== $group_key ) {
				return NULL ;
			}
		}
		if( $group_key != NULL ) {
			$RES_labels[$tabidx]['group_id'] = key($probeGeoGrouphashArrQueries['tab']) ;
			$RES_labels[$tabidx]['group_key'] = $group_key ;
			$RES_labels[$tabidx]['tab_title'] = $tab_title ;
		}
		else {
			$RES_labels[$tabidx]['tab_title'] = preg_replace("/[^a-zA-Z0-9\s]/", "", $arr_saisie['qmerge_name']) ;
		}
		
		
		$RES_labels[$tabidx]['arr_grid-x'] = array() ;
		$RES_labels[$tabidx]['arr_grid-y'] = array() ;
		foreach( $probeGeoGrouphashArrQueries['grid-x'] as $grouphash => $arr_group_targets ) {
			$grid = array() ;
			foreach( $arr_group_targets as $group_target ) {
				$target_queryId = $group_target['query_id'] ;
				$target_query_fieldgroup_idx = $group_target['query_fieldgroup_idx'] ;
				
				
				$grid_candidate = $RESqueries[$target_queryId]['RES_labels'][$tabidx]['arr_grid-x'][$target_query_fieldgroup_idx] ;
				if( count($grid_candidate) > count($grid) ) {
					$grid = $grid_candidate ;
				}
			}
			$RES_labels[$tabidx]['arr_grid-x'][$grouphash] = $grid ;
			$RES_titles['group_fields'][$grouphash] = $RESqueries[$target_queryId]['RES_titles']['group_fields'][$target_query_fieldgroup_idx] ;
			$RES_titles['group_title'][$grouphash] = $RESqueries[$target_queryId]['RES_titles']['group_title'][$target_query_fieldgroup_idx] ;
		}
		foreach( $probeGeoGrouphashArrQueries['grid-y'] as $grouphash => $arr_group_targets ) {
			$grid = array() ;
			foreach( $arr_group_targets as $group_target ) {
				$target_queryId = $group_target['query_id'] ;
				$target_query_fieldgroup_idx = $group_target['query_fieldgroup_idx'] ;
				
				
				$grid_candidate = $RESqueries[$target_queryId]['RES_labels'][$tabidx]['arr_grid-y'][$target_query_fieldgroup_idx] ;
				if( count($grid_candidate) > count($grid) ) {
					$grid = $grid_candidate ;
				}
			}
			$RES_labels[$tabidx]['arr_grid-y'][$grouphash] = $grid ;
			$RES_titles['group_fields'][$grouphash] = $RESqueries[$target_queryId]['RES_titles']['group_fields'][$target_query_fieldgroup_idx] ;
			$RES_titles['group_title'][$grouphash] = $RESqueries[$target_queryId]['RES_titles']['group_title'][$target_query_fieldgroup_idx] ;
		}
		
		// ** Création d'un axe fantome dans le cas d'une requete 1D (pour le fonctionnement du reste)
		// -> cet axe sera ignoré pour la pagination et la constitution des attach/detach groups
		if( !$RES_labels[$tabidx]['arr_grid-x'] ) {
			$RES_labels[$tabidx]['arr_grid-x'][''] = array() ;
		}
		if( !$RES_labels[$tabidx]['arr_grid-y'] ) {
			$RES_labels[$tabidx]['arr_grid-y'][''] = array() ;
		}
		
	}
	
	if( $debug ) {
		echo "OK\n" ;
	}
	
	
	
	
	

	
	if( $debug ) {
		echo 'Qmerge 5: building $_mgroups_hashes...' ;
	}
	// Constitution des $_mgroups_hashes => toutes les possibilités en prenant la possibilité d'un détachement pour chaque group (%%%)
	$groupTargets = array() ;     // mgroup_hashes
	$groupTargets[] = array() ;   // enregistrement "blanc" pour éviter l'index 0
	$defaultTarget = array() ;    // defaultTarget : tous les groupes à %%%
	foreach( $RES_labels as $tabidx => $RES_labels_tab ) {
		$tab_groupTargets_base = array( array() ) ;
		
		if( $RES_labels_tab['group_id'] ) {
			$tab_groupTargets_base = paracrm_queries_process_toolArrayMultiply($tab_groupTargets_base,$RES_labels_tab['group_id'],array($RES_labels_tab['group_key'])) ;
			$defaultTarget[$RES_labels_tab['group_id']] = '%%%' ;
		}
	
		foreach( $RES_labels_tab['arr_grid-x'] as $group_id => $t1 )
		{
			if( !$group_id )
				continue ;
			
			$tab_groupTargets_base = paracrm_queries_process_toolArrayMultiply($tab_groupTargets_base,$group_id,array('%%%')) ;
			$defaultTarget[$group_id] = '%%%' ;
		}
		foreach( $RES_labels_tab['arr_grid-y'] as $group_id => $t1 )
		{
			if( !$group_id )
				continue ;
			
			$tab_groupTargets_base = paracrm_queries_process_toolArrayMultiply($tab_groupTargets_base,$group_id,array('%%%')) ;
			$defaultTarget[$group_id] = '%%%' ;
		}
		
		//// ON NE FONCTIONNE PAS EN COMBINATOIRE RECURSIF POUR LES QMERGES
		//    => toutes combinaisons linéaires simple entre 1 SEUL X ET 1 SEUL Y
		foreach( $RES_labels_tab['arr_grid-x'] as $group_x_id => $tx )
		{
			foreach( $RES_labels_tab['arr_grid-y'] as $group_y_id => $ty )
			{
				$tab_groupTargets = $tab_groupTargets_base ;
				
				$defaultStr = '%%%' ;
			
				if( $group_x_id ) {
					$group_keys = array_keys($tx) ;
					$group_keys[] = $defaultStr ;
					$tab_groupTargets = paracrm_queries_process_toolArrayMultiply($tab_groupTargets,$group_x_id,$group_keys) ;
				}
			
				if( $group_y_id ) {
					$group_keys = array_keys($ty) ;
					$group_keys[] = $defaultStr ;
					$tab_groupTargets = paracrm_queries_process_toolArrayMultiply($tab_groupTargets,$group_y_id,$group_keys) ;
				}
				
				$groupTargets = array_merge($groupTargets,$tab_groupTargets) ;
			}
		}
		
		/*
		
		foreach( $RES_labels_tab['arr_grid-x'] as $group_id => $t1 )
		{
			$defaultStr = '%%%' ;
		
			$group_keys = array_keys($t1) ;
			$group_keys[] = $defaultStr ;
			$tab_groupTargets = paracrm_queries_process_toolArrayMultiply($tab_groupTargets,$group_id,$group_keys) ;
			$defaultTarget[$group_id] = $defaultStr ;
		}
		foreach( $RES_labels_tab['arr_grid-y'] as $group_id => $t1 )
		{
			$defaultStr = '%%%' ;
		
			$group_keys = array_keys($t1) ;
			$group_keys[] = $defaultStr ;
			$tab_groupTargets = paracrm_queries_process_toolArrayMultiply($tab_groupTargets,$group_id,$group_keys) ;
			$defaultTarget[$group_id] = $defaultStr ;
		}
		$groupTargets = array_merge($groupTargets,$tab_groupTargets) ;
		*/
		
		
		
		
	}

	$indexed_groupTargets = array() ;
	foreach( $groupTargets as $group_id => $group_desc )
	{
		ksort($group_desc) ;
		$group_hash = implode('@@',$group_desc) ;
		$indexed_groupTargets[$group_hash] = $group_id ;
	}
	
	$RES_groupKey_groupDesc = $groupTargets ;
	
	if( $debug ) {
		echo "OK\n" ;
	}
	
	
	
	
	
	
	
	if( $debug ) {
		echo 'Qmerge 6: entering calc' ;
	}
	$RES_selectId_groupKey_value = array() ;
	$RES_selectId_infos = array() ;
	foreach( $arr_saisie['fields_mselect'] as $mselect_field_idx => $mselect_field ) {

		$x_detached = $y_detached = FALSE ;
		foreach( $mselect_field['axis_detach'] as $axisdetach ) {
			if( $axisdetach['axis_is_detach'] != TRUE ) {
				continue ;
			}
			
			switch( $axisdetach['display_geometry'] ){
				case 'grid-x' :
				$x_detached = TRUE ;
				break ;
				
				case 'grid-y' :
				$y_detached = TRUE ;
				break ;
			}
		}
		
		$RES_selectId_infos[$mselect_field_idx] = array() ;
		$RES_selectId_infos[$mselect_field_idx]['axis_x_setDetached'] = $x_detached ;
		$RES_selectId_infos[$mselect_field_idx]['axis_y_setDetached'] = $y_detached ;
		$RES_selectId_infos[$mselect_field_idx]['axis_x_detached'] = $x_detached ;
		$RES_selectId_infos[$mselect_field_idx]['axis_y_detached'] = $y_detached ;
		$RES_selectId_infos[$mselect_field_idx]['math_round'] = $mselect_field['math_round'] ;
		$RES_selectId_infos[$mselect_field_idx]['select_lib'] = $mselect_field['select_lib'] ;
	
		
		// tous les groupTargets de l'opération QMerge
		$attached_groupTargets = array() ;
		$detached_groupTargets = array() ;
		foreach( $RES_labels as $tabidx => $RES_labels_tab ) {
		
			// Pour chaque tab, constitution des sousGroupTargets par multiplication (groupKey)
			$tab_attached_groupTargets_base = array( array() ) ;
			$tab_detached_groupTargets_base = array( array() ) ;
			if( $RES_labels_tab['group_id'] )
				$tab_attached_groupTargets_base = paracrm_queries_process_toolArrayMultiply($tab_attached_groupTargets_base,$RES_labels_tab['group_id'],array($RES_labels_tab['group_key'])) ;
			
			
			
			foreach( $RES_labels_tab['arr_grid-x'] as $group_x_id => $tx )
			{
				foreach( $RES_labels_tab['arr_grid-y'] as $group_y_id => $ty )
				{
					$tab_detached_groupTargets = $tab_detached_groupTargets_base ;
					$tab_attached_groupTargets = $tab_attached_groupTargets_base ;
					
					if( $group_x_id ) {
						$group_keys = array_keys($tx) ;
						if( $x_detached )
							$tab_detached_groupTargets = paracrm_queries_process_toolArrayMultiply($tab_detached_groupTargets,$group_x_id,$group_keys) ;
						else
							$tab_attached_groupTargets = paracrm_queries_process_toolArrayMultiply($tab_attached_groupTargets,$group_x_id,$group_keys) ;
					}
					if( $group_y_id ) {
						$group_keys = array_keys($ty) ;
						if( $y_detached )
							$tab_detached_groupTargets = paracrm_queries_process_toolArrayMultiply($tab_detached_groupTargets,$group_y_id,$group_keys) ;
						else
							$tab_attached_groupTargets = paracrm_queries_process_toolArrayMultiply($tab_attached_groupTargets,$group_y_id,$group_keys) ;
					}
						
					$attached_groupTargets = array_merge($attached_groupTargets,$tab_attached_groupTargets) ;
					$detached_groupTargets = array_merge($detached_groupTargets,$tab_detached_groupTargets) ;
				}
			}
		}
		
		
		/*
		echo "\n****************RESULT*************\n\n\n" ;
		echo "\n****************ATTACHED*************\n\n\n" ;
		print_r($attached_groupTargets) ;
		echo "\n****************DETACHED*************\n\n\n" ;
		print_r($detached_groupTargets) ;
		echo "\n**********************\n\n" ;
		*/
		
		// ***** Identification des queries déja detachées ******
		
		
		// Tableau confirmedGroups
		// - examen de $attachGroupTarget pour trouver les groupes X / Y concernés par ce résultat => pour pagination
		$confirmed_groups = array() ;
		
		$RES_selectId_groupKey_value[$mselect_field_idx] = array() ;
		foreach( $attached_groupTargets as $attachGroupTarget )
		{
			// ******** On est dans une cellule ********
			// --- determiner le qgroup_id => lookup dans $groupTargets
			$searchGroupTarget = $attachGroupTarget + $defaultTarget ;
			ksort($searchGroupTarget) ;
			$searchHash = implode('@@',$searchGroupTarget) ;
			if( !isset($indexed_groupTargets[$searchHash]) ) {
				echo "CRITICAL" ;
				print_r($searchGroupTarget) ;
			}
			$qgroup_id = $indexed_groupTargets[$searchHash] ;
		
		
		
		
			$cellValues = array() ;
			foreach( $mselect_field['math_expression'] as $symbol_id => $symbol )
			{
				//initialement, toutes les valeurs recherchées sont inexistantes
				$cellValues[$symbol_id] = FALSE ;
			
				if( $symbol['math_operand_query_id'] ) {} else continue ;
				
				$query_id = $symbol['math_operand_query_id'] ;
				$selectfield_idx = $symbol['math_operand_selectfield_idx'] ;
				
				
				// Pour cette query, tous les champs sont-ils attachés ?
				// -- Valeur unique
				if( count($map_grouphash_queryGroupId[$query_id]) == count($attachGroupTarget) )
				{
					$queryGroupDesc = array() ;
					foreach( $attachGroupTarget as $grouphash => $group_key )
					{
						if( isset($map_grouphash_queryGroupId[$query_id][$grouphash]) ) {
							$query_group_id = $map_grouphash_queryGroupId[$query_id][$grouphash] ;
							$queryGroupDesc[$query_group_id] = $group_key ;
						}
						else {
							// echo "impossible" ; => on a essayé de taper une combinaison groupTarget attached+detached qui n'est pas cohérente avec la query
							continue 2 ;
						}
					}
				
					$cellValues[$symbol_id] = paracrm_queries_process_lookupValue($RESqueries[$query_id],$queryGroupDesc) ; 
					
					continue ;
				}
				
				$cellValues[$symbol_id] = array() ;
				// ******** Appel des valeurs *********
				foreach( $detached_groupTargets as $detachGroupTarget ) {
					$groupTarget = $attachGroupTarget + $detachGroupTarget ;
					
					// *** Appel de la valeur => recherche dans $RESqueries[$query_id]['RES_groupKey_groupDesc'] ****
					// -- on constitue un groupDesc relatif a cette query
					$queryGroupDesc = array() ;
					foreach( $groupTarget as $grouphash => $group_key )
					{
						if( isset($map_grouphash_queryGroupId[$query_id][$grouphash]) ) {
							$query_group_id = $map_grouphash_queryGroupId[$query_id][$grouphash] ;
							$queryGroupDesc[$query_group_id] = $group_key ;
						}
						else {
							// echo "impossible" ; => on a essayé de taper une combinaison groupTarget attached+detached qui n'est pas cohérente avec la query
							continue 3 ;
						}
					}
					
					$cellValues[$symbol_id][] = paracrm_queries_process_lookupValue($RESqueries[$query_id],$queryGroupDesc) ;  ;
				}
			}
			
			// **** Verif de la possibilité de calculer *****
			foreach( $cellValues as $val ) {
				if( $val === FALSE ) {
					continue 2 ; // impossible de calculer pour cette cellule, on passe à la suivante ( next $attachGroupTarget )
				}
			}
			
			
			// *** Calcul de la valeur ****
			$val = NULL ;
			switch( $mselect_field['math_func_mode'] ) {
			
				case 'IN' :
				default :
					// pour chaque symbole/operand => execution de la fonction operatoire en intra
					foreach( $cellValues as $symbol_id => $arrValues )
					{
						if( !is_array($arrValues) )
							continue ;
					
						switch( $mselect_field['math_func_group'] )
						{
							case 'AVG' :
							$val = array_sum($arrValues) / count($arrValues) ;
							break ;
							
							case 'SUM' :
							$val = array_sum($arrValues) ;
							break ;
							
							case 'MIN':
							$val = min($arrValues) ;
							break ;
							
							case 'MAX' :
							$val = max($arrValues) ;
							break ;
							
							default :
							$val = '' ;
							break ;
						}
						$cellValues[$symbol_id] = $val ;
					}
				
					if( count($mselect_field['math_expression']) > 1 )
					{
						$eval_string = '' ;
						foreach( $mselect_field['math_expression'] as $symbol_id => $symbol )
						{
							$eval_string.= $symbol['math_operation'] ;
							
							if( $symbol['math_parenthese_in'] )
								$eval_string.= '(' ;
								
							if( $symbol['math_staticvalue'] != 0 )
								$value = (float)($symbol['math_staticvalue']) ;
							elseif( isset($cellValues[$symbol_id]) )
								$value = $cellValues[$symbol_id] ;
							else
								$value = 0 ;
							$eval_string.= $value ;
							
							if( $symbol['math_parenthese_out'] )
								$eval_string.= ')' ;
						}
						
						$evalmath = new EvalMath ;
						$evalmath->suppress_errors = TRUE ;
						if( ($val = $evalmath->evaluate($eval_string)) === FALSE )
						{
							continue ;
						}
					}
					else
					{
						reset($cellValues) ;
						$val = current($cellValues) ;
					}
					break ;
			}
			$RES_selectId_groupKey_value[$mselect_field_idx][$qgroup_id] = $val ;
			
			// 
			// - examen de $attachGroupTarget pour trouver les groupes X / Y concernés par ce résultat => pour pagination
			foreach( array_keys($attachGroupTarget) as $confirmedGroup ){
				$confirmed_groups[$confirmedGroup] = TRUE ;
			}
		}
		// stockage des groupes confirmés par le résultat
		$RES_selectId_infos[$mselect_field_idx]['axis_groups'] = array_keys($confirmed_groups) ;
		
		// auto-detach si aucun groupe pour un axe (pagination)
		if( !array_intersect(array_keys($confirmed_groups),array_keys($RES_labels_tab['arr_grid-x'])) )
			$RES_selectId_infos[$mselect_field_idx]['axis_x_detached'] = true ;
		if( !array_intersect(array_keys($confirmed_groups),array_keys($RES_labels_tab['arr_grid-y'])) )
			$RES_selectId_infos[$mselect_field_idx]['axis_y_detached'] = true ;
	}
	if( $debug ) {
		echo "OK\n" ;
	}

	// return array('RES_groupKey_groupDesc',$RES_groupKey_groupDesc) ;

	return array('RES_groupKey_groupDesc'=>$RES_groupKey_groupDesc,
					'RES_selectId_groupKey_value'=>$RES_selectId_groupKey_value,
					'RES_labels'=>$RES_labels,
					'RES_titles'=>$RES_titles,
					'RES_selectId_infos'=>$RES_selectId_infos) ;
}

function paracrm_queries_process_lookupValue( &$RES, $group_desc ) {
	ksort($group_desc) ;
	if( !isset($RES['RES_groupHash_groupKey']) ) {
		echo "WARN" ;
	}
	$group_hash = implode('@@',$group_desc) ;
	if( !$key_id = $RES['RES_groupHash_groupKey'][$group_hash] ) {
		$key_id = FALSE ;
	}
	
	if( $key_id === FALSE )
	{
		return $RES['RES_nullValue'] ;
	}
	elseif( !isset($RES['RES_groupKey_value'][$key_id]) )
	{
		return $RES['RES_nullValue'] ;
	}
	else
	{
		return $RES['RES_groupKey_value'][$key_id] ;
	}
}

function paracrm_queries_process_toolArrayMultiply( $tab, $mkey, $arr_mvalues ) {
	$result = array() ;
	foreach( $tab as $entry ) {
		foreach( $arr_mvalues as $mvalue ) {
			$entry[$mkey] = $mvalue ;
			$result[] = $entry ;
		}
	}
	return $result ;
}






function paracrm_queries_process_query($arr_saisie, $debug=FALSE) 
{
	global $_opDB ;
	
	global $_groups_hashes, $_groups_hashes_indexed, $_groups_hashes_newkey ;
	
	global $arr_bible_trees , $arr_bible_entries ;
	
	
	// préprocess => BibleTrees sous forme d'arbres en mode objet
	if( $debug ) {
		echo "Debug 1: build bible trees..." ;
	}
	paracrm_queries_process_buildTrees() ;
	if( $debug ) {
		echo "OK\n" ;
	}
	
	// préprocess => treefields_root : on linearise les descriptions des champs (files,(sub)bibles) pour accès immédiat dans les traitements
	if( $debug ) {
		echo "Debug 2: linear treefields..." ;
	}
	$arr_indexed_treefields = paracrm_queries_process_linearTreefields($arr_saisie['treefields_root']) ;
	$arr_saisie['define_treefields'] = $arr_indexed_treefields ;
	if( $debug ) {
		echo "OK\n" ;
	}
	// print_r($arr_indexed_treefields) ;
	
	
	$target_file_code = $arr_saisie['target_file_code'] ;
	$parent_target_file_code = $_opDB->query_uniqueValue( "SELECT file_parent_code FROM define_file WHERE file_code='$target_file_code'" ) ;
	
	$target_bibles = array() ;
	$query = "SELECT entry_field_code, entry_field_linkbible FROM define_file_entry
					WHERE file_code='$target_file_code' AND entry_field_type='link'" ;
	$res = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($res)) != FALSE )
	{
		$target_bibles[$arr[0]] = $arr[1] ;
	}
	
	
	if( count($arr_saisie['fields_select']) != 1 )
		return NULL ;
		
	
	// On initialise les variables "globales" dans le cadre de la requête
	//  - tableau des ensembles "unique / last occurence" déjà rencontrés
	$GLOBALS['cache_queryWhereUnique'] = NULL ;
	// - group hashes ( ie. case du tableau de résultat )
	$_groups_hashes = array() ;
	$_groups_hashes_indexed = array() ;
	$_groups_hashes_newkey = 0 ;
		
	
	
	if( $debug ) {
		echo "Debug 3a: preprocess WHERE..." ;
	}
	$fields_where = $arr_saisie['fields_where'] ;
	// PREMACHAGE DU WHERE
	//  - ficher FILE
	//  - field field_XXXXXX
	//  pour les bibles => field_XXXXXX"_tree" ou field_XXXXXX"_entry" , on explicite les entries/treenodes qu'on doit chercher
	//      - pour les entries : simple ( entry_key )
	//      - pour les treenodes : utilisation de l'arbre objet et pour chaque subnode ( treenode_key )
	foreach( $fields_where as $field_id => &$field_where )
	{
		//print_r($field_where) ;
	
		$tfield = $field_where['field_code'] ;
		$field_where['sql_file_code'] = $arr_indexed_treefields[$tfield]['file_code'] ;
		$field_where['sql_file_field_code'] = 'field_'.$arr_indexed_treefields[$tfield]['file_field_code'] ;
		switch( $field_where['field_type'] )
		{
			case 'link' :
			if( $field_where['condition_bible_mode'] != 'SELECT' )
				break ;
			$field_where['sql_bible_code'] = $arr_indexed_treefields[$tfield]['bible_code'] ;
			if( $field_where['condition_bible_entries'] )
			{
				$field_where['condition_bible_store'] = 'entry' ;
				$field_where['sql_file_field_code'] = $field_where['sql_file_field_code'] ;
				$field_where['sql_arr_select'] = array() ;
				foreach( array($field_where['condition_bible_entries']) as $entry_key )
					$field_where['sql_arr_select'][] = $entry_key ;
			}
			elseif( $field_where['condition_bible_treenodes'] && json_decode($field_where['condition_bible_treenodes'],true) )
			{
				$field_where['condition_bible_store'] = 'tree' ;
				$field_where['sql_file_field_code'] = $field_where['sql_file_field_code'] ;
				$field_where['sql_arr_select'] = array() ;
				if( !$arr_bible_trees[$arr_indexed_treefields[$tfield]['bible_code']] )
					continue ;
				$tmp_tree = $arr_bible_trees[$arr_indexed_treefields[$tfield]['bible_code']] ;
				foreach( json_decode($field_where['condition_bible_treenodes'],true) as $trootnode )
				{
					foreach( $tmp_tree->getTree($trootnode)->getAllMembers() as $tnode )
					{
						$field_where['sql_arr_select'][] = $tnode ;
					}
				}
			}
			else
			{
				unset($fields_where[$field_id]) ;
			}
			break ;
		
		}
	}
	$arr_saisie['fields_where'] = $fields_where ;

	$fields_progress = $arr_saisie['fields_progress'] ;
	if( $fields_progress ) {
	foreach( $fields_progress as $field_id => &$field_progress )
	{
		//print_r($field_where) ;
	
		$tfield = $field_progress['field_code'] ;
		$field_progress['sql_file_code'] = $arr_indexed_treefields[$tfield]['file_code'] ;
		$field_progress['sql_file_field_code'] = 'field_'.$arr_indexed_treefields[$tfield]['file_field_code'] ;
		switch( $field_progress['field_type'] )
		{
			case 'link' :
			if( $field_progress['condition_bible_mode'] != 'SELECT' )
				break ;
			if( $field_progress['condition_bible_entries'] )
			{
				$field_progress['condition_bible_store'] = 'entry' ;
				$field_progress['sql_file_field_code'] = $field_progress['sql_file_field_code'].'_entry' ;
				$field_progress['sql_arr_select'] = array() ;
				foreach( array($field_where['condition_bible_entries']) as $entry_key )
					$field_progress['sql_arr_select'][] = $entry_key ;
			}
			elseif( $field_progress['condition_bible_treenodes'] )
			{
				$field_progress['sql_file_field_code'] = $field_progress['sql_file_field_code'].'_tree' ;
				$field_progress['sql_arr_select'] = array() ;
				if( !$arr_bible_trees[$arr_indexed_treefields[$tfield]['bible_code']] )
					continue ;
				$tmp_tree = $arr_bible_trees[$arr_indexed_treefields[$tfield]['bible_code']] ;
				foreach( json_decode($field_progress['condition_bible_treenodes'],true) as $trootnode )
				{
					foreach( $tmp_tree->getTree($trootnode)->getAllMembers() as $tnode )
					{
						$field_progress['sql_arr_select'][] = $tnode ;
					}
				}
			}
			else
			{
				unset($fields_progress[$field_id]) ;
			}
			break ;
		
		
			case 'date' :
			if( !$field_progress['condition_date_lt'] && !$field_progress['condition_date_gt'] ) {
				unset($fields_progress[$field_id]) ;
			}
			break ;
		}
	}
	}
	$arr_saisie['fields_progress'] = $fields_progress ;
	if( $debug ) {
		echo "OK\n" ;
	}
	// print_r($fields_where) ;
	
	
	
	
	if( $debug ) {
		echo "Debug 3b: preprocess GROUP..." ;
	}
	$fields_group = $arr_saisie['fields_group'] ;
	// PREMACHAGE DU GROUP
	//  - ficher FILE
	//  - field field_XXXXXX
	//  pour les bibles => $field_group['sql_bible_code'] = $field_group['field_linkbible']
	foreach( $fields_group as $field_id => &$field_group )
	{
		//print_r($field_where) ;
	
		$tfield = $field_group['field_code'] ;
		$field_group['sql_file_code'] = $arr_indexed_treefields[$tfield]['file_code'] ;
		$field_group['sql_file_field_code'] = 'field_'.$arr_indexed_treefields[$tfield]['file_field_code'] ;
		if( $field_group['field_linkbible'] && $field_group['field_type'] != 'link' )
		{
			// pour le moment on ne supporte pas les group fields non link (bible principale)
			unset($fields_group[$field_id]) ;
		}
		if( $field_group['field_linkbible'] != $arr_indexed_treefields[$tfield]['bible_code'] )
		{
			echo "????" ;
			unset($fields_group[$field_id]) ;
		}
		
		
		$field_group['sql_bible_code'] = $arr_indexed_treefields[$tfield]['bible_code'] ;
		
		
		// **** display **** 
		if( $field_group['field_type'] == 'link' )
		{
			$field_group['group_bible_display_arrFields'] = array() ;
			$bible_code = $field_group['sql_bible_code'] ;
			switch( $field_group['group_bible_type'] )
			{
				case 'ENTRY' :
				foreach( json_decode($field_group['group_bible_display_entry'],true) as $field )
				{
					$field_group['group_bible_display_arrFields'][$field] = $arr_indexed_treefields[$field]['bible_type'].'_'.$arr_indexed_treefields[$field]['bible_field_code'] ;
				}
				break ;
				
				case 'TREE' :
				foreach( json_decode($field_group['group_bible_display_treenode'],true) as $field )
				{
					$field_group['group_bible_display_arrFields'][$field] = $arr_indexed_treefields[$field]['bible_type'].'_'.$arr_indexed_treefields[$field]['bible_field_code'] ;
				}
				break ;
			
				default : break ;
			}
		}
	}
	$arr_saisie['fields_group'] = $fields_group ;
	if( $debug ) {
		echo "OK\n" ;
	}
	
		
		
		
	if( $debug ) {
		echo "Debug 3c: preprocess SELECT..." ;
	}
	$field_select = $arr_saisie['fields_select'][0] ;
	// analyse !!! Mode de requête ? Count / Value
	// --- Si dans les operands on a un titre de fichier ou de bible => mode COUNT
	// --- Sinon mode VALUE
	// Réalisation de la requête :
	//  COUNT => une opération à la fois
	//  VALUES => tout en même temps
	$is_values = $is_counts = FALSE ;
	foreach( $field_select['math_expression'] as $symbol_id => &$symbol )
	{
		if( $symbol['math_staticvalue'] != 0 )
			continue ;
		
	
		// catalogue du field
		$math_operand = $symbol['math_fieldoperand'] ;
		$symbol['sql_file_code'] = $arr_indexed_treefields[$math_operand]['file_code'] ;
		if( $arr_indexed_treefields[$math_operand]['bible_code'] && $arr_indexed_treefields[$math_operand]['bible_field_code'] )
		{
			$symbol['sql_file_field_code'] = 'field_'.$arr_indexed_treefields[$math_operand]['file_field_code'] ;
			$symbol['sql_bible_code'] = $arr_indexed_treefields[$math_operand]['bible_code'] ;
			$symbol['sql_bible_field_code'] = 'field_'.$arr_indexed_treefields[$math_operand]['bible_field_code'] ;
		}
		elseif( $arr_indexed_treefields[$math_operand]['bible_code'] )
		{
			$symbol['sql_file_field_code'] = 'field_'.$arr_indexed_treefields[$math_operand]['file_field_code'] ;
			$symbol['sql_bible_code'] = $arr_indexed_treefields[$math_operand]['bible_code'] ;
		}
		elseif( $arr_indexed_treefields[$math_operand]['file_field_code'] )
		{
			$symbol['sql_file_field_code'] = 'field_'.$arr_indexed_treefields[$math_operand]['file_field_code'] ;
		}
	
		// FICHIERS ?
		if( $math_operand && in_array($math_operand,array($target_file_code,$parent_target_file_code)) )
		{
			$is_counts = TRUE ;
			continue ;
		}

		// BIBLES DU FICHIER TARGET ?
		foreach( $target_bibles as $field_code => $target_bible )
		{
			if( $target_file_code.'_'.'field'.'_'.$field_code == $math_operand )
			{
				$is_counts = TRUE ;
				continue 2 ;
			}
		}
		
		$is_values = TRUE ;
		continue ;
		
		return NULL ;
	}
	if( $is_counts && !$is_values ) {
		$field_select['iteration_mode'] = 'count' ;
	}
	elseif( $is_values && !$is_counts )
	{
		$field_select['iteration_mode'] = 'value' ;
	}
	else
	{
		return NULL ;
	}
	$arr_saisie['fields_select'][0] = $field_select ;
	if( $debug ) {
		echo "OK\n" ;
	}
	
	
	
	// CALCUL (pour chaque select_field) de la NULL value
	if( $debug ) {
		echo "Debug 4pre: calcul null value " ;
	}
	$field_select = $arr_saisie['fields_select'][0] ;
	while(TRUE) {
		
		// Mode VALUE + operand non numérique => valeur NULL
		if( $field_select['iteration_mode'] == 'value' )
		{
			foreach( $field_select['math_expression'] as $symbol_id => &$symbol )
			{
				if( $symbol['math_staticvalue'] != 0 )
					continue ;
				$math_operand = $symbol['math_fieldoperand'] ;
				if( $arr_indexed_treefields[$math_operand]['field_type'] != 'number' )
				{
					$field_select['null_value'] = NULL ;
					break 2 ;
				}
			}
		}
		
		// Quelle est la fonction opératoire ? AVG / MIN / MAX => valeur NULL
		switch( $field_select['math_func_group'] )
		{
			case 'AVG' :
			case 'MIN':
			case 'MAX' :
			$field_select['null_value'] = NULL ;
			break 2 ;
			
			case 'SUM' :
			default :
			break ;
		}
		
		// Sinon : simu de l'operation avec valeurs nulles
		foreach( $field_select['math_expression'] as $symbol_id => &$symbol )
		{
			$eval_string.= $symbol['math_operation'] ;
			
			if( $symbol['math_parenthese_in'] )
				$eval_string.= '(' ;
				
			if( $symbol['math_staticvalue'] != 0 )
				$value = (float)($symbol['math_staticvalue']) ;
			else
				$value = 0 ;
			$eval_string.= $value ;
			
			if( $symbol['math_parenthese_out'] )
				$eval_string.= ')' ;
		}
		
		
		$evalmath = new EvalMath ;
		$evalmath->suppress_errors = TRUE ;
		if( ($val = $evalmath->evaluate($eval_string)) === FALSE )
		{
			$field_select['null_value'] = NULL ;
			break ; ;
		}
		$field_select['null_value'] = $val ;
		break ;
	}
	$arr_saisie['fields_select'][0] = $field_select ;
	if( $debug ) {
		echo " is [{$field_select['null_value']}] , OK\n" ;
	}
	
	
	// EXECUTION DE LA REQUETE
	// Résultats :
	//   $RES_groupKey_groupDesc(=$_groups_hashes) : annuaire des coordonnées de cellule ( $group_hash => tableau ( $group_id => $valeur etiquette ) )
	//   $RES_groupKey_value : tab.assoc ( $group_hash => $valeur resultat )
	if( $debug ) {
		echo "Debug 4: execution query " ;
	}
	$RES_groupKey_value = array() ;
	$RES_groupKey_value = paracrm_queries_process_query_iteration( $arr_saisie ) ;
	
	$RES_progress = array() ;
	if( $arr_saisie['fields_progress'] ) {
		foreach( $arr_saisie['fields_progress'] as &$field_progress ) {
			$arr_saisie_copy = $arr_saisie ;
			if( !is_array($arr_saisie_copy['fields_where']) )
				$arr_saisie_copy['fields_where'] = array() ;
			$arr_saisie_copy['fields_where'][] = $field_progress ;
			
			// execution d'une requete alternative
			$RES_alt_progress = paracrm_queries_process_query_iteration( $arr_saisie_copy ) ;
			$RES_progress[] = $RES_alt_progress ;
		}
	}
	
	if( $RES_groupKey_value === NULL )
		return NULL ;
		
	$RES_groupKey_groupDesc = $_groups_hashes ;
	if( $debug ) {
		echo "OK\n" ;
	}
	
	
	if( $debug ) {
		echo "Debug 5: labels + titles" ;
	}
	$RES_labels = paracrm_queries_process_labels( $arr_saisie ) ;
	
	$RES_titles = array() ;
	$RES_titles['fields_group'] = array() ;
	foreach( $arr_saisie['fields_group'] as $field_id => &$field_group )
	{
		$RES_titles['group_title'][$field_id] = $arr_indexed_treefields[$field_group['field_code']]['text'] ;
		
		$RES_titles['group_fields'][$field_id] = array() ;
		if( $field_group['group_bible_display_arrFields'] ) {
		foreach( $field_group['group_bible_display_arrFields'] as $display_field_code => $display_field_ref )
		{
			$RES_titles['group_fields'][$field_id][$display_field_ref] = $arr_indexed_treefields[$display_field_code]['text'] ;
		}
		}
	}
	$RES_titles['fields_select'] = array() ;
	$RES_titles['fields_select'][0] = $field_select['select_lib'] ;
	if( $debug ) {
		echo "OK\n" ;
	}
	
	return array('RES_groupKey_groupDesc'=>$RES_groupKey_groupDesc,
					'RES_groupKey_value'=>$RES_groupKey_value,
					'RES_labels'=>$RES_labels,
					'RES_titles'=>$RES_titles,
					'RES_nullValue'=>$field_select['null_value'],
					'RES_round'=>$field_select['math_round'],
					'RES_progress'=>$RES_progress) ;
}
function paracrm_queries_process_query_iteration( $arr_saisie )
{
	global $_opDB ;
	
	// **** IMPORTANT ! *****
	// => remise à zéro du cache WHERE
	$GLOBALS['cache_queryWhereUnique'] = array() ;

	// trouver la chaine d'iteration
	$arr_chain = array() ;
	$cur_target = $arr_saisie['target_file_code'] ;
	while(TRUE)
	{
		$arr_chain[] = $cur_target ;
		
		$query = "SELECT file_parent_code FROM define_file WHERE file_code='$cur_target'" ;
		$tmp = $_opDB->query_uniqueValue($query);
		if( !$tmp )
		{
			break ;
		}
		$cur_target = $tmp ;
		continue ;
	}
	$arr_chain = array_reverse($arr_chain) ;
	
	$field_select = $arr_saisie['fields_select'][0] ;
	
	$RES_group_arr_arrSymbolValue = paracrm_queries_process_query_iterationDo( $arr_saisie, $arr_chain, 0, array(), NULL, NULL ) ;
	
	$RES_group_value = array() ;
	switch( $field_select['math_func_mode'] ) {
	
		case 'IN' :
			$RES_group_arrSymbolValue = array() ;
			
			// Application intra symboles de l'operation SUM/MAX/AVG....
			foreach( $RES_group_arr_arrSymbolValue as $group_key_id => $arr_arrSymbolValue )
			{
				$subGroup_symbol_arrValues = array() ;
				foreach( $arr_arrSymbolValue as $arr_symbolId_value )
				{
					foreach( $arr_symbolId_value as $symbol_id => $value )
					{
						if( !is_array($subGroup_symbol_arrValues[$symbol_id]) )
							$subGroup_symbol_arrValues[$symbol_id] = array() ;
						$subGroup_symbol_arrValues[$symbol_id][] = $value ;
					}
				}
				
				// pour chaque symbole/operand => execution de la fonction operatoire en intra
				foreach( $subGroup_symbol_arrValues as $symbol_id => $arrValues )
				{
					switch( $field_select['math_func_group'] )
					{
						case 'AVG' :
						$val = array_sum($arrValues) / count($arrValues) ;
						break ;
						
						case 'SUM' :
						$val = array_sum($arrValues) ;
						break ;
						
						case 'MIN':
						$val = min($arrValues) ;
						break ;
						
						case 'MAX' :
						$val = max($arrValues) ;
						break ;
						
						default :
						$val = '' ;
						break ;
					}
					$RES_group_arrSymbolValue[$group_key_id][$symbol_id] = $val ;
				}
			}
		
			// Puis, résolution de l'expression de calcul une seule fois (par groupe)
			foreach( $RES_group_arrSymbolValue as $group_key_id => $arr_symbolId_value )
			{
				if( count($field_select['math_expression']) > 1 )
				{
					$eval_string = '' ;
					foreach( $field_select['math_expression'] as $symbol_id => $symbol )
					{
						$eval_string.= $symbol['math_operation'] ;
						
						if( $symbol['math_parenthese_in'] )
							$eval_string.= '(' ;
							
						if( $symbol['math_staticvalue'] != 0 )
							$value = (float)($symbol['math_staticvalue']) ;
						elseif( isset($arr_symbolId_value[$symbol_id]) )
							$value = $arr_symbolId_value[$symbol_id] ;
						else
							$value = 0 ;
						$eval_string.= $value ;
						
						if( $symbol['math_parenthese_out'] )
							$eval_string.= ')' ;
					}
					
					$evalmath = new EvalMath ;
					$evalmath->suppress_errors = TRUE ;
					if( ($val = $evalmath->evaluate($eval_string)) === FALSE )
					{
						continue ;
					}
				}
				else
				{
					$val = current($arr_symbolId_value) ;
				}
				
				$RES_group_value[$group_key_id] = $val ;
			}
			break ;
		
		
		
		case 'OUT' :
		default :
			$RES_group_arrValues = array() ;
			// *** Resolution des expressions opératoires en premier  ****
			foreach( $RES_group_arr_arrSymbolValue as $group_key_id => $arr_arrSymbolValue )
			{
				foreach( $arr_arrSymbolValue as $arr_symbolId_value )
				{
					if( count($field_select['math_expression']) > 1 )
					{
						$eval_string = '' ;
						foreach( $field_select['math_expression'] as $symbol_id => $symbol )
						{
							$eval_string.= $symbol['math_operation'] ;
							
							if( $symbol['math_parenthese_in'] )
								$eval_string.= '(' ;
								
							if( $symbol['math_staticvalue'] != 0 )
								$value = (float)($symbol['math_staticvalue']) ;
							elseif( isset($arr_symbolId_value[$symbol_id]) )
								$value = $arr_symbolId_value[$symbol_id] ;
							else
								$value = 0 ;
							$eval_string.= $value ;
							
							if( $symbol['math_parenthese_out'] )
								$eval_string.= ')' ;
						}
						
						$evalmath = new EvalMath ;
						$evalmath->suppress_errors = TRUE ;
						if( ($val = $evalmath->evaluate($eval_string)) === FALSE )
						{
							continue ;
						}
					}
					else
					{
						$val = current($arr_symbolId_value) ;
					}
					if( !is_array($RES_group_arrValues[$group_key_id]) )
						$RES_group_arrValues[$group_key_id] = array() ;
					$RES_group_arrValues[$group_key_id][] = $val ;
				}
			}
			
			foreach( $RES_group_arrValues as $group_key_id => $arr_values )
			{
				switch( $field_select['math_func_group'] )
				{
					case 'AVG' :
					$val = array_sum($arr_values) / count($arr_values) ;
					break ;
					
					case 'SUM' :
					$val = array_sum($arr_values) ;
					break ;
					
					case 'MIN':
					$val = min($arr_values) ;
					break ;
					
					case 'MAX' :
					$val = max($arr_values) ;
					break ;
					
					default :
					$val = '' ;
					break ;
				}
				
				$RES_group_value[$group_key_id] = $val ;
			}
			break ;
	}
	return $RES_group_value ;
}
function paracrm_queries_process_query_iterationDo( $arr_saisie, $iteration_chain, $iteration_chain_offset, $base_row, $parent_fileCode, $parent_filerecordId )
{
	global $_opDB ;

	if( $iteration_chain_offset >= count($iteration_chain) - 1 )
	{
		$target_fileCode = $iteration_chain[$iteration_chain_offset] ;
		
		switch( $arr_saisie['fields_select'][0]['iteration_mode'] )
		{
			case 'count' :
			return $RES_group_arr_arrSymbolValue = paracrm_queries_process_query_doCount( $arr_saisie, $target_fileCode, $base_row, $parent_fileCode, $parent_filerecordId ) ;
			
			case 'value' :
			return $RES_group_arr_arrSymbolValue = paracrm_queries_process_query_doValue( $arr_saisie, $target_fileCode, $base_row, $parent_fileCode, $parent_filerecordId ) ;
		}
	}
	
	
	$RES_group_arr_arrSymbolValue = array() ;
	
	$target_fileCode = $iteration_chain[$iteration_chain_offset] ;
	$view_filecode = 'view_file_'.$target_fileCode ;
	$query = "SELECT * FROM $view_filecode ORDER BY filerecord_id DESC" ;
	$result = $_opDB->query($query);
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$row = array() ;
		$row[$target_fileCode] = $arr ;
		// application des conditions
		if( !paracrm_queries_process_queryHelp_where( $row, $arr_saisie['fields_where'] ) )
			continue ;
			
		$row = $base_row ;
		$row[$target_fileCode] = $arr ;
			

		$subRes_group_arrSymbolValue = paracrm_queries_process_query_iterationDo($arr_saisie,$iteration_chain, $iteration_chain_offset+1,$row,$target_fileCode,$arr['filerecord_id']) ;
		foreach( $subRes_group_arrSymbolValue as $group_key_id => $arr_arrSymbolValue )
		{
			if( !is_array($RES_group_arr_arrSymbolValue[$group_key_id]) )
				$RES_group_arr_arrSymbolValue[$group_key_id] = array() ;
			
			$RES_group_arr_arrSymbolValue[$group_key_id] = array_merge( $RES_group_arr_arrSymbolValue[$group_key_id], $arr_arrSymbolValue ) ;
		}
		// print_r($row) ;
		$c++ ;
	}
	return $RES_group_arr_arrSymbolValue ;
}




function paracrm_queries_process_query_doValue( $arr_saisie, $target_fileCode, $base_row, $parent_fileCode, $parent_filerecordId )
{
	global $_opDB ;
	global $arr_bible_trees , $arr_bible_entries ;
	
	$subRes_group_arr_arrSymbolValue = array() ;
	
	$field_select = current($arr_saisie['fields_select']) ;
	
	// iteration principale
	$view_filecode = 'view_file_'.$target_fileCode ;
	$query2 = "SELECT * FROM $view_filecode WHERE filerecord_parent_id='{$parent_filerecordId}'" ;
	$result2 = $_opDB->query($query2);
	while( ($arr2 = $_opDB->fetch_assoc($result2)) != FALSE )
	{
		$row_child = array() ;
		$row_child[$target_fileCode] = $arr2 ;
		// application des conditions
		if( !paracrm_queries_process_queryHelp_where( $row_child, $arr_saisie['fields_where'] ) )
			continue ;
	
		$row_group = array() ;
		$row_group = $base_row ;
		$row_group[$target_fileCode] = $arr2 ;
		$group_key_id = paracrm_queries_process_queryHelp_group( $row_group, $arr_saisie['fields_group'] ) ;
		
	
		$subRES_group_symbol_value = array() ;
		// iteration sur les symboles
		foreach( $field_select['math_expression'] as $symbol_id => $symbol )
		{
			if( $symbol['math_staticvalue'] != 0 )
				continue ;
		
			if( $symbol['sql_file_code'] != $target_fileCode )
				return array() ;
			if( !$symbol['sql_file_field_code'] )
				return array() ;
			if( $symbol['sql_bible_code'] && !$symbol['sql_bible_field_code'] )
				return array() ;
				
			$file_code = $symbol['sql_file_code'] ;
			$file_field_code = $symbol['sql_file_field_code'] ;
			
			if( $symbol['sql_bible_code'] && $symbol['sql_bible_field_code'] ) {
			
				// field of bible record
				$bible_field_code = $symbol['sql_bible_field_code'] ;
				$bible_record = paracrm_lib_data_getRecord_bibleEntry($symbol['sql_bible_code'], $row_group[$file_code][$file_field_code]) ;
				$subRES_group_symbol_value[$group_key_id][$symbol_id] = $bible_record[$bible_field_code] ;
			}
			else {
			
				// field of cursor file record : standard
				$subRES_group_symbol_value[$group_key_id][$symbol_id] = $row_group[$file_code][$file_field_code] ;
			}
		}
		
		
		foreach( $subRES_group_symbol_value as $group_key_id => $subSubRES_symbol_value )
		{
			/* En mode VALUE :
				Pour chaque groupe on retourne plusieurs valeurs (principe de l'empilage valeurs)
				l'opération est effectuée une seule fois par groupe à la fin
			*/
			if( !isset($subRes_group_arr_arrSymbolValue[$group_key_id]) )
				$subRes_group_arr_arrSymbolValue[$group_key_id] = array() ;
			$subRes_group_arr_arrSymbolValue[$group_key_id][] = $subSubRES_symbol_value ;
		}
	}

	// print_r($subRes_group_arrValues) ;

	return $subRes_group_arr_arrSymbolValue ;
}

function paracrm_queries_process_query_doCount( $arr_saisie, $target_fileCode, $base_row, $parent_fileCode, $parent_filerecordId )
{
	global $_opDB ;
	global $arr_bible_trees , $arr_bible_entries ;
	
	
	// subiteration sur les symboles
	$results_symbols = array() ;
	$subRES_group_symbol_value = array() ;
	$field_select = current($arr_saisie['fields_select']) ;
	foreach( $field_select['math_expression'] as $symbol_id => $symbol )
	{
		if( $symbol['math_staticvalue'] != 0 )
			continue ;
			
			
			
		if( $symbol['sql_file_code'] == $parent_fileCode )
		{
			$group_key_id = paracrm_queries_process_queryHelp_group( $base_row, $arr_saisie['fields_group'] ) ;
			
			$subRES_group_symbol_value[$group_key_id][$symbol_id] = 1 ;
			continue ;
		}
		
		if( $symbol['sql_file_code'] != $target_fileCode )
		{
			return NULL ;
		}
		
		
		if( $symbol['sql_bible_code'] )
		{
			// quels sont les conditions étrangères (autre bible) déjà présentes
			$bible_foreignConstraints = array() ;
			foreach( $arr_saisie['define_treefields'] as $define_field )
			{
				if( $define_field['field_type'] != 'link' ) {
					continue ;
				}
				
				$file_code = $define_field['file_code'] ;
				$file_field_code = 'field_'.$define_field['file_field_code'] ;
				
				if( !isset($base_row[$file_code][$file_field_code]) ) {
					continue ;
				}
				
				// print_r($define_field) ;
				$bible_foreignConstraints[$define_field['bible_code']] = $base_row[$file_code][$file_field_code] ;
			}
		
			// iteration sur la bible !!!!!
			foreach( paracrm_lib_bible_queryBible( $symbol['sql_bible_code'], $bible_foreignConstraints ) as $bible_record )
			{
				$row_pivot = $base_row ;
				$mkey = $symbol['sql_file_field_code'] ;
				$row_pivot[$symbol['sql_file_code']][$mkey] = $bible_record['entry_key'] ;
				
				$group_key_id = paracrm_queries_process_queryHelp_group( $row_pivot, $arr_saisie['fields_group'] ) ;
			
				$subRES_group_symbol_value[$group_key_id][$symbol_id]++ ;
			}
			
			continue ;
		}
		
		if( $symbol['sql_file_code'] == $target_fileCode && !$symbol['sql_file_field_code'] )
		{
			// iteration principale
			$view_filecode = 'view_file_'.$target_fileCode ;
			$query2 = "SELECT * FROM $view_filecode WHERE filerecord_parent_id='{$parent_filerecordId}'" ;
			$result2 = $_opDB->query($query2);
			while( ($arr2 = $_opDB->fetch_assoc($result2)) != FALSE )
			{
				$row_child = array() ;
				$row_child[$target_fileCode] = $arr2 ;
				// application des conditions
				if( !paracrm_queries_process_queryHelp_where( $row_child, $arr_saisie['fields_where'] ) )
					continue ;
			
				$row_group = array() ;
				$row_group = $base_row ;
				$row_group[$target_fileCode] = $arr2 ;
				
				//print_r($row_group) ;
			
				$group_key_id = paracrm_queries_process_queryHelp_group( $row_group, $arr_saisie['fields_group'] ) ;
				$subRES_group_symbol_value[$group_key_id][$symbol_id]++ ;
			}
			continue ;
		}
		
		
		
		
		
	
	}
	// print_r($subRES_group_symbol_value) ;
	
	
	
	$subRes_group_arr_arrSymbolValue = array() ;
	foreach( $subRES_group_symbol_value as $group_key_id => $subSubRES_symbol_value )
	{
		// *** Mode COUNT ****
		// *** Pour chaque groupe on ne retourne qu'un seul map symbole>valeur => principe du comptage sur une itération
		$subRes_group_arr_arrSymbolValue[$group_key_id] = array() ;
		$subRes_group_arr_arrSymbolValue[$group_key_id][] = $subSubRES_symbol_value ;
	}
	
	
	// print_r($subRes_group_arrValues) ;
	
	return $subRes_group_arr_arrSymbolValue ;
}

function paracrm_queries_process_queryHelp_where( $record_file, $fields_where ) // ** les fields where doivent etre prémachés pour les bibles !!!
{
	// global 
	if( !is_array($GLOBALS['cache_queryWhereUnique']) )
		$GLOBALS['cache_queryWhereUnique'] = array() ;
	
	$unique_evals = NULL ;
	foreach( $fields_where as $where_id => $field_where )
	{
		$file_code = $field_where['sql_file_code'] ;
		$file_field_code = $field_where['sql_file_field_code'] ;
		
		if( !isset($record_file[$file_code][$file_field_code]) )
			continue ;
		$eval_value = $record_file[$file_code][$file_field_code] ;
	
		// echo "eval" ;
		switch( $field_where['field_type'] )
		{
			case 'link' :
			switch( $field_where['condition_bible_mode'] )
			{
				case 'SELECT' :
				$bible_code = $field_where['sql_bible_code'] ;
				switch( $field_where['condition_bible_store'] ) {
					case 'entry' :
					$eval_value_entry = $eval_value ;
					if( !in_array($eval_value_entry,$field_where['sql_arr_select']) )
						return FALSE ;
					break ;
					
					case 'tree' :
					// recherche du treenode associé
					$eval_value_entry = $eval_value ;
					$eval_value_tree = $GLOBALS['arr_bible_entries'][$bible_code][$eval_value_entry]['treenode_key'] ;
					if( !in_array($eval_value_tree,$field_where['sql_arr_select']) )
						return FALSE ;
					break ;
				}
				break ;
				
				
				case 'SINGLE' :
				if( !is_array($unique_evals) )
				{
					$unique_evals = array() ;
				}
				$unique_evals[$where_id] = $eval_value ;
				break ;
			}
			break ;
		
		
			case 'date' :
			if( $field_where['condition_date_gt'] != '' )
			{
				if( strtotime($eval_value) < strtotime($field_where['condition_date_gt']) )
					return FALSE ;
			}
			if( $field_where['condition_date_lt'] != '' )
			{
				if( strtotime($eval_value) >= strtotime('+1 day',strtotime($field_where['condition_date_lt'])) )
					return FALSE ;
			}
			break ;
			
			
			case 'number' :
			if( $field_where['condition_num_lt'] == 0 && $field_where['condition_num_gt'] == 0 ) {
			}
			elseif( $eval_value >= $field_where['condition_num_gt'] && $eval_value <= $field_where['condition_num_lt'] ) {
			}
			else {
				return FALSE ;
			}
			break ;
		}
	}
	
	
	if( $unique_evals )
	{
		if( array_search($unique_evals,$GLOBALS['cache_queryWhereUnique']) === FALSE )
		{
			$GLOBALS['cache_queryWhereUnique'][] = $unique_evals ;
		}
		else
		{
			return FALSE ;
		}
	}
	
	
	return TRUE ;
}

function paracrm_queries_process_queryHelp_getIdGroup( $group_hash )
{
	global $_groups_hashes ;
	global $_groups_hashes_indexed ;
	
	global $_groups_hashes_newkey ;
	
	$string_hash = implode('@',$group_hash) ;
	if( $key_id = $_groups_hashes_indexed[$string_hash] )
	{
		// echo "already found:$key_id\n" ;
		// echo "double verif : ".array_search($group_hash, $_groups_hashes )."\n" ;
		return $key_id ;
	}
	else
	{
		// echo "creating\n" ;
	}
	
	$_groups_hashes_newkey++ ;
	$_groups_hashes[$_groups_hashes_newkey] = $group_hash ;
	$_groups_hashes_indexed[$string_hash] = $_groups_hashes_newkey ;
	
	return $_groups_hashes_newkey ;
}
function paracrm_queries_process_queryHelp_getGroupHash( $record_glob, $fields_group )
{
	global $arr_bible_trees , $arr_bible_entries ;
	
	
	$tab = array() ;
	
	
	foreach( $fields_group as $fieldgroup_id => $field_group )
	{
		// print_r($field_group) ;
		
		// ---- recherche du field -----
		if( $field_group['field_type'] == 'link' )
		{
			// déterminer la valeur
			if( $field_group['group_bible_type'] == 'ENTRY' )
			{
				$src_code = $field_group['sql_file_code'] ;
				$src_field = $field_group['sql_file_field_code'] ;
				
				$src_value_entry = $record_glob[$src_code][$src_field] ;
				if( !$src_value_entry )
				{
					$tab[$fieldgroup_id] = NULL ;
					continue ;
				}
				if( !($group_value = $src_value_entry) )
				{
					$tab[$fieldgroup_id] = NULL ;
					continue ;
				}
				
				$tab[$fieldgroup_id] = $group_value ;
			}
			// déterminer la valeur
			if( $field_group['group_bible_type'] == 'TREE' )
			{
				$src_code = $field_group['sql_file_code'] ;
				$src_field = $field_group['sql_file_field_code'] ;
				$bible_code = $field_group['sql_bible_code'] ;
				
				$src_value_entry = $record_glob[$src_code][$src_field] ;
				if( !$src_value_entry )
				{
					$tab[$fieldgroup_id] = NULL ;
					continue ;
				}
				$src_value_treenode = $GLOBALS['arr_bible_entries'][$bible_code][$src_value_entry]['treenode_key'] ;
				if( !($group_value_tree = $src_value_treenode) )
				{
					$tab[$fieldgroup_id] = NULL ;
					continue ;
				}
					
				$obj_tree = $arr_bible_trees[$field_group['sql_bible_code']] ;
				$obj_tree = $obj_tree->getTree($group_value_tree) ;
				$group_value = NULL ;
				while( TRUE )
				{
					if( !$obj_tree )
						break ;
					if( $obj_tree->getDepth() > $field_group['group_bible_tree_depth'] )
					{
						$obj_tree = $obj_tree->getParent() ;
						continue ;
					}
					$group_value = $obj_tree->getHead() ;
					break ;
				}
				
				if( $group_value )
					$tab[$fieldgroup_id] = $group_value ;
				else
					$tab[$fieldgroup_id] = NULL ;
			}
		}
		if( $field_group['field_type'] == 'date' )
		{
			$src_code = $field_group['sql_file_code'] ;
			$src_field = $field_group['sql_file_field_code'] ;
			$date_value = $record_glob[$src_code][$src_field] ;
			switch( $field_group['group_date_type'] )
			{
				case 'DAY' :
				$group_value = date('Y-m-d',strtotime($date_value)) ;
				break ;
			
				case 'WEEK' :
				$group_value = date('Y-W',strtotime($date_value)) ;
				break ;
			
				case 'MONTH' :
				$group_value = date('Y-m',strtotime($date_value)) ;
				break ;
			
				case 'YEAR' :
				$group_value = date('Y',strtotime($date_value)) ;
				break ;
			
				default :
				$group_value = $date_value ;
				break ;
			}
			
			if( $group_value )
				$tab[$fieldgroup_id] = $group_value ;
			else
				$tab[$fieldgroup_id] = NULL ;
		}
	}
	
	
	return $tab ;
	
	// return $arr[$group_field] = $value ;
}

function paracrm_queries_process_queryHelp_group( $record_glob, $fields_group )
{
	$group_hash = paracrm_queries_process_queryHelp_getGroupHash( $record_glob, $fields_group ) ;
	$group_key_id = paracrm_queries_process_queryHelp_getIdGroup($group_hash) ;
	return $group_key_id ;
}


function paracrm_queries_process_linearTreefields( $arr_node )
{
	$tab = array() ;
	
	if( $arr_node['field_code'] )
	{
		$row = array() ;
		$row['text'] = $arr_node['field_text'] ;
		$row['field_type'] = $arr_node['field_type'] ;
		foreach( array('file_code','file_field_code','bible_code','bible_field_code') as $mkey )
			$row[$mkey] = $arr_node[$mkey] ;
		$row['bible_type'] = $arr_node['field_linkbible_type'] ;
		$tab[$arr_node['field_code']] = $row ;
	}
	
	if( !$arr_node['children'] )
		return $tab ;
	
	foreach( $arr_node['children'] as $arr_subnode )
	{
		$tab = array_merge($tab,paracrm_queries_process_linearTreefields($arr_subnode)) ;
	}

	return $tab ;
}


function paracrm_queries_process_labels( $arr_saisie )
{
	$fields_group = $arr_saisie['fields_group'] ;
	$RES_tab_labels = array() ;
	
	// recherche du TAB
	foreach( $fields_group as $group_id => $field_group )
	{
		if( $field_group['display_geometry'] == 'tab' )
		{
			return paracrm_queries_process_labels_withTabs( $arr_saisie, $group_id ) ;
		}
	}
	
	return paracrm_queries_process_labels_noTab( $arr_saisie ) ;
}
function paracrm_queries_process_labels_withTabs( $arr_saisie, $groupId_forTab )
{
	$fields_group = $arr_saisie['fields_group'] ;
	$field_group_tab = $fields_group[$groupId_forTab] ;
	if( $field_group_tab['display_geometry'] != 'tab' )
		return NULL ;
		
	$field_select = current($arr_saisie['fields_select']) ;
	$select_lib = $field_select['select_lib'] ;
		
	$RES_tab_labels = array() ;
		$tabBibleConditions = array() ;
		foreach( $arr_saisie['fields_where'] as $field_where )
		{
			if( $field_where['field_type'] == 'link'
				&& $field_where['field_code'] == $field_group_tab['field_code']
				&& $field_where['condition_bible_mode'] == 'SELECT' && $field_where['condition_bible_treenodes']
				&& json_decode($field_where['condition_bible_treenodes'],true) )
			{
				$tarr = array() ;
				foreach( json_decode($field_where['condition_bible_treenodes'],true) as $treenode_key )
					$tarr[] = $treenode_key ;
				$tabBibleConditions[] = $tarr ;
			}
		}
	foreach( paracrm_queries_process_labelEnum( $group_id, $field_group_tab, $tabBibleConditions ) as $bible_key => $cells_display )
	{
		$subRES_tab = array() ;
		$subRES_tab['select_lib'] = $select_lib ;
		$subRES_tab['group_id'] = $groupId_forTab ;
		$subRES_tab['group_key'] = $bible_key ;
		$subRES_tab['tab_title'] = implode(' - ',$cells_display) ;
	
		$subRES_tab['arr_grid-x'] = array() ;
		$subRES_tab['arr_grid-y'] = array() ;
		
		foreach( $fields_group as $group_id => $field_group )
		{
			if( $group_id == $groupId_forTab )
				continue ;
				
			// avant Enum => intro de la condition specifique
			$bibleConditions = array() ;
			$field_groupTab = $field_group_tab ;
			if( $field_groupTab['field_type'] == 'link' && $field_group['field_type'] == 'link' 
				&& $field_groupTab['field_code'] == $field_group['field_code']
				&& $field_groupTab['group_bible_type'] == 'TREE' )
			{
				$tarr = array() ;
				$tarr[] = $bible_key ;
				$bibleConditions[] = $tarr ;
			
			}
			foreach( $arr_saisie['fields_where'] as $field_where )
			{
				if( $field_where['field_type'] == 'link'
					&& $field_where['field_code'] == $field_group['field_code']
					&& $field_where['condition_bible_mode'] == 'SELECT' && $field_where['condition_bible_treenodes']
					&& json_decode($field_where['condition_bible_treenodes'],true) )
				{
					$tarr = array() ;
					foreach( json_decode($field_where['condition_bible_treenodes'],true) as $treenode_key )
						$tarr[] = $treenode_key ;
					$bibleConditions[] = $tarr ;
				}
			}
			
			
			$subsub = paracrm_queries_process_labelEnum( $group_id, $field_group, $bibleConditions ) ;
			switch( $field_group['display_geometry'] )
			{
				case 'grid-x' :
				$subRES_tab['arr_grid-x'][$group_id] = $subsub ;
				break ;
				
				case 'grid-y' :
				$subRES_tab['arr_grid-y'][$group_id] = $subsub ;
				break ;
			
				default :
				return NULL ;
			}
		}
		
		$RES_tab_labels[] = $subRES_tab ;
	}
	
	return $RES_tab_labels ;
}
function paracrm_queries_process_labels_noTab( $arr_saisie )
{
	$fields_group = $arr_saisie['fields_group'] ;
	$RES_tab_labels = array() ;
	
		$field_select = current($arr_saisie['fields_select']) ;
		$select_lib = $field_select['select_lib'] ;
	
		$subRES_tab = array() ;
		$subRES_tab['select_lib'] = $select_lib ;
		
		$subRES_tab['tab_title'] = $select_lib ;
	
		$subRES_tab['arr_grid-x'] = array() ;
		$subRES_tab['arr_grid-y'] = array() ;
		
		foreach( $fields_group as $group_id => $field_group )
		{
			// avant Enum => intro de la condition specifique
			$bibleConditions = array() ;
			foreach( $arr_saisie['fields_where'] as $field_where )
			{
				if( $field_where['field_type'] == 'link'
					&& $field_where['field_code'] == $field_group['field_code']
					&& $field_where['condition_bible_mode'] == 'SELECT' && $field_where['condition_bible_treenodes']
					&& json_decode($field_where['condition_bible_treenodes'],true) )
				{
					$tarr = array() ;
					foreach( json_decode($field_where['condition_bible_treenodes'],true) as $treenode_key )
						$tarr[] = $treenode_key ;
					$bibleConditions[] = $tarr ;
				}
			}

			$subsub = paracrm_queries_process_labelEnum( $group_id, $field_group, $bibleConditions ) ;
			switch( $field_group['display_geometry'] )
			{
				case 'grid-x' :
				$subRES_tab['arr_grid-x'][$group_id] = $subsub ;
				break ;
				
				case 'grid-y' :
				$subRES_tab['arr_grid-y'][$group_id] = $subsub ;
				break ;
			
				default :
				return NULL ;
			}
		}
		
		$RES_tab_labels[] = $subRES_tab ;
	
	return $RES_tab_labels ;
}

function paracrm_queries_process_labelEnum( $group_id, $field_group, $bibleConditions=NULL )
{
	global $_opDB ;

	// ***** Cette fonction crée les "labels" pour chaque groupe, à partir de la liste de champs à afficher $field_group['group_bible_display_arrFields']
	// ** PREPROCESS : repère dans le define des champs 'link' à dé-JSONer


	$arr = array() ;
	switch( $field_group['field_type'] )
	{
		case 'link' :
		
		// PREPROCESS : quels sont les champs de type "link" pour cette $field_group['sql_bible_code']
		$link_field_refs = array() ;
		$query = "SELECT tree_field_code FROM define_bible_tree WHERE bible_code='{$field_group['sql_bible_code']}' AND tree_field_type='link'" ;
		$res = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($res)) != FALSE ) {
			$link_field_refs[] = 'tree_'.$arr[0] ;
		}
		$query = "SELECT entry_field_code FROM define_bible_entry WHERE bible_code='{$field_group['sql_bible_code']}' AND entry_field_type='link'" ;
		$res = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($res)) != FALSE ) {
			$link_field_refs[] = 'entry_'.$arr[0] ;
		}
		
		
		switch( $field_group['group_bible_type'] )
		{
			case 'TREE' :
			foreach( paracrm_queries_process_labelEnumBibleTree( $field_group['sql_bible_code'], '&', $field_group['group_bible_tree_depth'], $bibleConditions ) as $record )
			{
				$ttmp = array() ;
				foreach( $field_group['group_bible_display_arrFields'] as $display_field_ref )
				{
					if( in_array($display_field_ref,$link_field_refs) ) {
						// décodage JSON
						$ttmp[$display_field_ref] = implode(' ',json_decode($record[$display_field_ref])) ;
					}
					else {
						$ttmp[$display_field_ref] = $record[$display_field_ref] ;
					}
				}
				
				$treenode_key = $record['treenode_key'] ;
				
				$arr[$treenode_key] = $ttmp ;
			}
			break ;
			
			
			case 'ENTRY' :
			foreach( paracrm_queries_process_labelEnumBibleEntries( $field_group['sql_bible_code'], '&', $bibleConditions ) as $record )
			{
				$ttmp = array() ;
				foreach( $field_group['group_bible_display_arrFields'] as $display_field_ref )
				{
					if( in_array($display_field_ref,$link_field_refs) ) {
						// décodage JSON
						$ttmp[$display_field_ref] = implode(' ',json_decode($record[$display_field_ref])) ;
					}
					else {
						$ttmp[$display_field_ref] = $record[$display_field_ref] ;
					}
				}
				
				$entry_key = $record['entry_key'] ;
				
				$arr[$entry_key] = $ttmp ;
			}
			break ;
		}
		break ;
		
		case 'date' :
		foreach( paracrm_queries_process_labelEnumDate( $group_id, $field_group['group_date_type'] ) as $group_key )
		{
			$arr[$group_key] = array($group_key) ;
		}
		break ;
	}
	
	return $arr ;
}
function paracrm_queries_process_labelEnumBibleTree( $bible_code, $root_treenodeKey, $depth, $bibleConditions=NULL, $foreignLinks=NULL )
{
	global $_opDB ;
	
	global $arr_bible_trees ;
	
	// ***** foreignLinks ****
	// - conditions sur autre bible => pour la requete
	if( !$arr_bible_trees[$bible_code] )
	{
		return NULL ;
	}
	$root_tree = $arr_bible_trees[$bible_code] ;
	if( !($root_tree = $root_tree->getTree( '&' )) )
	{
		return NULL ;
	}
	
	
	if( $bibleConditions && count($bibleConditions)>0 )
	{
		$arr_treenodes = array() ;
		foreach( $bibleConditions as $bibleCondition )
		{
			$treenodes = array() ;
			foreach( $bibleCondition as $condition_treenode )
			{
				if( $root_tree->getTree($condition_treenode) )
					$treenodes = array_merge($treenodes,$root_tree->getTree($condition_treenode)->getAllMembers()) ;
			}
				
			$arr_treenodes[] = $treenodes ;
		}
	}
	
	
	$arr_describe_tree = array() ;
	foreach( $_opDB->table_fields('view_bible_'.$bible_code.'_tree') as $db_field )
	{
		if( strpos($db_field,'field_') === 0 )
			$arr_describe_tree[$db_field] = 'tree_'.substr($db_field,6,strlen($db_field)-6) ;
	}
	$arr_describe_entry = array() ;
	foreach( $_opDB->table_fields('view_bible_'.$bible_code.'_entry') as $db_field )
	{
		if( strpos($db_field,'field_') === 0 )
			$arr_describe_entry[$db_field] = 'entry_'.substr($db_field,6,strlen($db_field)-6) ;
	}
	
	$select_clause_arr = array() ;
	foreach( $arr_describe_tree as $db_field=>$target )
	{
		$select_clause_arr[] = 't.'.$db_field.' AS '.$target ;
	}
	
	
	
	$tab = array() ;
	$view_name = 'view_bible_'.$bible_code.'_tree' ;
	foreach( $root_tree->getAllMembersForDepth( $depth ) as $treenode_key )
	{
		if( is_array($arr_treenodes) )
		{
		foreach( $arr_treenodes as $treenodes )
		{
			if( !in_array($treenode_key,$treenodes) )
				continue 2 ;
		}
		}
	
		$query = "SELECT t.treenode_key as treenode_key,".implode(',',$select_clause_arr)." FROM $view_name t WHERE t.treenode_key='$treenode_key'" ;
		$res = $_opDB->query($query) ;
		$tab[] = $_opDB->fetch_assoc($res) ;
	}

	return $tab ;
}
function paracrm_queries_process_labelEnumBibleEntries( $bible_code, $root_treenodeKey, $bibleConditions=NULL, $foreignLinks=NULL )
{
	global $_opDB ;

	global $arr_bible_trees ;

	if( $bibleConditions && count($bibleConditions)>0 )
	{
		$query_treenode = '' ;
		if( !$arr_bible_trees[$bible_code] )
		{
			return NULL ;
		}
		$root_tree = $arr_bible_trees[$bible_code] ;
		if( !($root_tree = $root_tree->getTree( '&' )) )
		{
			return NULL ;
		}
		
		foreach( $bibleConditions as $bibleCondition )
		{
			$treenodes = array() ;
			foreach( $bibleCondition as $condition_treenode )
			{
				if( $root_tree->getTree($condition_treenode) )
					$treenodes = array_merge($treenodes,$root_tree->getTree($condition_treenode)->getAllMembers()) ;
			}
				
			$query_treenode.= " AND t.treenode_key IN ".$_opDB->makeSQLlist($treenodes) ;
		}
	}
	
	
	
	$arr_describe_tree = array() ;
	foreach( $_opDB->table_fields('view_bible_'.$bible_code.'_tree') as $db_field )
	{
		if( strpos($db_field,'field_') === 0 )
			$arr_describe_tree[$db_field] = 'tree_'.substr($db_field,6,strlen($db_field)-6) ;
	}
	$arr_describe_entry = array() ;
	foreach( $_opDB->table_fields('view_bible_'.$bible_code.'_entry') as $db_field )
	{
		if( strpos($db_field,'field_') === 0 )
			$arr_describe_entry[$db_field] = 'entry_'.substr($db_field,6,strlen($db_field)-6) ;
	}
	
	$select_clause_arr = array() ;
	foreach( $arr_describe_tree as $db_field=>$target )
	{
		$select_clause_arr[] = 't.'.$db_field.' AS '.$target ;
	}
	foreach( $arr_describe_entry as $db_field=>$target )
	{
		$select_clause_arr[] = 'e.'.$db_field.' AS '.$target ;
	}
	
	

	$tab = array() ;
	// ***** foreignLinks ****
	// - conditions sur autre bible => pour la requete
	$view_name = 'view_bible_'.$bible_code.'_entry' ;
	$view_name_tree = 'view_bible_'.$bible_code.'_tree' ;
	$query = "SELECT e.entry_key as entry_key,".implode(',',$select_clause_arr)." FROM $view_name e JOIN $view_name_tree t ON t.treenode_key=e.treenode_key WHERE 1" ;
	$query.= $query_treenode ;
	$query.= " ORDER BY e.treenode_key, e.entry_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$tab[] = $arr ;
	}
	return $tab ;
}
function paracrm_queries_process_labelEnumDate( $group_id, $group_date_type )
{
	global $_groups_hashes ;
	
	// recherche du MIN + MAX
	$ttmp = array() ;
	foreach( $_groups_hashes as $hash_key => $hash_desc )
	{
		$ttmp[] = $hash_desc[$group_id] ;
	}
	
	$keys = array() ;
	$cur_key = min($ttmp);
	$end_key = max($ttmp);
	while( TRUE )
	{
		$keys[] = $cur_key ;
		
		switch( $group_date_type )
		{
			case 'YEAR' :
			$next_key = date('Y',strtotime('+1 year',strtotime($cur_key.'-01-01'))) ;
			break ;
			
			case 'MONTH' :
			$next_key = date('Y-m',strtotime('+1 month',strtotime($cur_key.'-01'))) ;
			break ;
			
			case 'WEEK' :
			$ttmp = explode('-',$cur_key) ;
			$tyear = $ttmp[0] ;
			$tweek = $ttmp[1] ;
			$next_key = date('Y-W',strtotime('+1 week',strtotime("{$tyear}0104 + ".($tweek-1)." weeks"))) ;
			break ;
			
			case 'DAY' :
			$next_key = date('Y-m-d',strtotime('+1 day',strtotime($cur_key))) ;
			break ;
		
			default :
			break 2 ;
		}
		
		if( $next_key == $cur_key )
		{
			break ;
		}
		
		if( $next_key > $end_key )
		{
			break ;
		}
		
		$cur_key = $next_key ;
		continue ;
	}
	
	return $keys ;
}

?>