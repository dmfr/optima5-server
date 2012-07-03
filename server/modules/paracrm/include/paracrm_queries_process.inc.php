<?php

function paracrm_queries_process_buildTrees() {
	
	global $_opDB ;
	
	global $arr_bible_trees , $arr_bible_entries , $arr_bible_racx_entry , $arr_bible_racx_treenode ;
	

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
		$query = "SELECT treenode_key, treenode_parent_key FROM store_bible_tree
					WHERE bible_code='$bible_code'" ;
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
				
				unset($raw_records[$mid]) ;
				
				if( $tree->getTree( $treenode_parent_key ) != NULL )
				{
					$parent_node = $tree->getTree( $treenode_parent_key ) ;
					$parent_node->addLeaf( $treenode_key ) ;
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
		$query = "SELECT e.entry_key, t.treenode_racx, e.entry_racx FROM store_bible_entry e
						JOIN store_bible_tree t ON t.bible_code=e.bible_code AND t.treenode_key = e.treenode_key
						WHERE e.bible_code='$bible_code' ORDER BY e.treenode_key, e.entry_key" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE )
		{
			$record = array() ;
			$record['entry_key'] = $arr[0] ;
			$record['treenode_racx'] = $arr[1] ;
			$record['entry_racx'] = $arr[2] ;
			$ttmp[] = $record ;
		}
		$arr_bible_entries[$bible_code] = $ttmp ;
		

		$ttmp = array() ;
		$query = "SELECT entry_racx, entry_key FROM store_bible_entry
						WHERE bible_code='$bible_code'" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE )
		{
			$ttmp[$arr[0]] = $arr[1] ;
		}
		$arr_bible_racx_entry[$bible_code] = $ttmp ;
		
		
		$ttmp = array() ;
		$query = "SELECT treenode_racx, treenode_key FROM store_bible_tree
						WHERE bible_code='$bible_code'" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE )
		{
			$ttmp[$arr[0]] = $arr[1] ;
		}
		$arr_bible_racx_treenode[$bible_code] = $ttmp ;
		

	}
	
	
	
	//$mtree = $arr_bible_trees['STORE'] ;
	//print_r( $mtree->getTree('33040')->getAllMembers() ) ;
	

	return ;
}

function paracrm_queries_process_query($arr_saisie) 
{
	global $_opDB, $_groups_hashes ;
	
	global $arr_bible_trees , $arr_bible_entries , $arr_bible_racx_entry , $arr_bible_racx_treenode ;
	
	paracrm_queries_process_buildTrees() ;
	
	// préprocess => select_map
	$arr_indexed_treefields = paracrm_queries_process_linearTreefields($arr_saisie['treefields_root']) ;
	$arr_saisie['define_treefields'] = $arr_indexed_treefields ;
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
		
	$GLOBALS['cache_queryWhereUnique'] = NULL ;
	$_groups_hashes = array() ;
		
		
	$fields_where = $arr_saisie['fields_where'] ;
	// PREMACHAGE DU WHERE
	//  - ficher FILE
	//  - field field_XXXXXX
	//  pour les bibles => field_XXXXXX_trx ou field_XXXXXX_erx
	foreach( $fields_where as &$field_where )
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
			if( $field_where['condition_bible_entries'] )
			{
				$field_where['sql_file_field_code'] = $field_where['sql_file_field_code'].'_erx' ;
				$field_where['sql_arr_select'] = array() ;
				foreach( paracrm_lib_bible_lookupEntryRacx( $arr_indexed_treefields[$tfield]['bible_code'], $field_where['condition_bible_entries'] ) as $erx )
					$field_where['sql_arr_select'][] = $erx ;
			}
			elseif( $field_where['condition_bible_treenodes'] )
			{
				$field_where['sql_file_field_code'] = $field_where['sql_file_field_code'].'_trx' ;
				$field_where['sql_arr_select'] = array() ;
				if( !$arr_bible_trees[$arr_indexed_treefields[$tfield]['bible_code']] )
					continue ;
				$tmp_tree = $arr_bible_trees[$arr_indexed_treefields[$tfield]['bible_code']] ;
				foreach( json_decode($field_where['condition_bible_treenodes'],true) as $trootnode )
				{
					foreach( $tmp_tree->getTree($trootnode)->getAllMembers() as $tnode )
					{
						foreach( paracrm_lib_bible_lookupTreenodeRacx( $arr_indexed_treefields[$tfield]['bible_code'], $tnode ) as $trx )
							$field_where['sql_arr_select'][] = $trx ;
					}
				}
			}
			break ;
		
		}
	}
	$arr_saisie['fields_where'] = $fields_where ;
	// print_r($fields_where) ;
	
	
	
	
	$fields_group = $arr_saisie['fields_group'] ;
	// PREMACHAGE DU WHERE
	//  - ficher FILE
	//  - field field_XXXXXX
	//  pour les bibles => field_XXXXXX_trx ou field_XXXXXX_erx
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
					$field_group['group_bible_display_arrFields'][] = 'field_'.$arr_indexed_treefields[$field]['bible_field_code'] ;
				}
				break ;
				
				case 'TREE' :
				foreach( json_decode($field_group['group_bible_display_treenode'],true) as $field )
				{
					$field_group['group_bible_display_arrFields'][] = 'field_'.$arr_indexed_treefields[$field]['bible_field_code'] ;
				}
				break ;
			
				default : break ;
			}
		}
	}
	$arr_saisie['fields_group'] = $fields_group ;
	
		
		
		
	$field_select = current($arr_saisie['fields_select']) ;
	// analyse !!!
	// COUNT => une opération à la fois
	// VALUES => tout en même temps
	$is_values = $is_counts = FALSE ;
	foreach( $field_select['math_expression'] as $symbol_id => &$symbol )
	{
		if( $symbol['math_staticvalue'] != 0 )
			continue ;
		
	
		// catalogue du field
		$math_operand = $symbol['math_fieldoperand'] ;
		$symbol['sql_file_code'] = $arr_indexed_treefields[$math_operand]['file_code'] ;
		if( $arr_indexed_treefields[$math_operand]['bible_code'] )
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
	
	
	
	if( $is_counts && !$is_values )
		$field_select['iteration_mode'] = 'count' ;
	elseif( $is_values && !$is_counts )
	{
		$field_select['iteration_mode'] = 'value' ;
	}
	else
	{
		return NULL ;
	}
	$arr_saisie['fields_select'][0] = $field_select ;
	
	// 
	$RES_groupKey_value = array() ;
	$RES_groupKey_value = paracrm_queries_process_query_iteration( $arr_saisie ) ;
	
	if( $RES_groupKey_value === NULL )
		return NULL ;
		
	$RES_groupKey_groupDesc = $_groups_hashes ;
	
	$RES_labels = paracrm_queries_process_labels( $arr_saisie , $RES_groupKey_groupDesc ) ;
	
	$RES_titles = array() ;
	$RES_titles['fields_group'] = array() ;
	foreach( $arr_saisie['fields_group'] as $field_id => &$field_group )
	{
		$RES_titles['fields_group'][$field_id] = $arr_indexed_treefields[$field_group['field_code']]['text'] ;
	}
	$RES_titles['fields_select'] = array() ;
	$RES_titles['fields_select'][0] = $field_select['select_lib'] ;
	
	return array('RES_groupKey_groupDesc'=>$RES_groupKey_groupDesc,
					'RES_groupKey_value'=>$RES_groupKey_value,
					'RES_labels'=>$RES_labels,
					'RES_titles'=>$RES_titles) ;
}
function paracrm_queries_process_query_iteration( $arr_saisie )
{
	global $_opDB ;

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
	
	$RES_group_arrValues = paracrm_queries_process_query_iterationDo( $arr_saisie, $arr_chain, 0, array(), NULL, NULL ) ;
	
	
	
	$RES_group_value = array() ;
	foreach( $RES_group_arrValues as $group_key_id => $arr_values )
	{
		switch( $arr_saisie['fields_select'][0]['math_func_group'] )
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
		
		if( is_numeric($val) )
			$RES_group_value[$group_key_id] = round($val,3) ;
		else
			$RES_group_value[$group_key_id] = $val ;
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
			return $RES_group_arrValues = paracrm_queries_process_query_doCount( $arr_saisie, $target_fileCode, $base_row, $parent_fileCode, $parent_filerecordId ) ;
			
			case 'value' :
			return $RES_group_arrValues = paracrm_queries_process_query_doValue( $arr_saisie, $target_fileCode, $base_row, $parent_fileCode, $parent_filerecordId ) ;
		}
	}
	
	
	$RES_group_arrValues = array() ;
	
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
			
		
		$subRes_group_arrValues = paracrm_queries_process_query_iterationDo($arr_saisie,$iteration_chain, $iteration_chain_offset+1,$row,$target_fileCode,$arr['filerecord_id']) ;
		foreach( $subRes_group_arrValues as $group_key_id => $arrValues )
		{
			if( !is_array($RES_group_arrValues[$group_key_id]) )
				$RES_group_arrValues[$group_key_id] = array() ;
			foreach( $arrValues as $value )
				$RES_group_arrValues[$group_key_id][] = $value ;
		}
		// print_r($row) ;
		$c++ ;
	}
	return $RES_group_arrValues ;
}




function paracrm_queries_process_query_doValue( $arr_saisie, $target_fileCode, $base_row, $parent_fileCode, $parent_filerecordId )
{
	global $_opDB ;
	global $arr_bible_trees , $arr_bible_entries , $arr_bible_racx_entry , $arr_bible_racx_treenode ;
	
	$subRes_group_arrValues = array() ;
	
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
			if( $symbol['sql_file_code'] != $target_fileCode )
				return array() ;
			if( $symbol['sql_file_code'] == $target_fileCode && !$symbol['sql_file_field_code'] )
				return array() ;
				
			if( $symbol['math_staticvalue'] != 0 )
				continue ;
				
			
			$file_code = $symbol['sql_file_code'] ;
			$file_field_code = $symbol['sql_file_field_code'] ;
			
		
			$subRES_group_symbol_value[$group_key_id][$symbol_id] = $row_group[$file_code][$file_field_code] ;
		}
		
		
		foreach( $subRES_group_symbol_value as $group_key_id => $subSubRES_symbol_value )
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
					elseif( isset($subSubRES_symbol_value[$symbol_id]) )
						$value = $subSubRES_symbol_value[$symbol_id] ;
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
				$val = current($subSubRES_symbol_value) ;
			}
			
			// *** Pour chaque groupe on ne retourne qu'une seule valeur => principe du comptage sur une itération
			if( !isset($subRes_group_arrValues[$group_key_id]) )
				$subRes_group_arrValues[$group_key_id] = array() ;
			$subRes_group_arrValues[$group_key_id][] = $val ;
		}
	}

	// print_r($subRes_group_arrValues) ;

	return $subRes_group_arrValues ;
}

function paracrm_queries_process_query_doCount( $arr_saisie, $target_fileCode, $base_row, $parent_fileCode, $parent_filerecordId )
{
	global $_opDB ;
	global $arr_bible_trees , $arr_bible_entries , $arr_bible_racx_entry , $arr_bible_racx_treenode ;
	
	
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
				$mkey = $symbol['sql_file_field_code'].'_erx' ;
				$row_pivot[$symbol['sql_file_code']][$mkey] = $bible_record['entry_racx'] ;
				$mkey = $symbol['sql_file_field_code'].'_trx' ;
				$row_pivot[$symbol['sql_file_code']][$mkey] = $bible_record['treenode_racx'] ;
				
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
	
	
	
	// execution de l'operation MATH_EXPRESSION pour chaque groupe
	$subRes_group_arrValues = array() ;
	foreach( $subRES_group_symbol_value as $group_key_id => $subSubRES_symbol_value )
	{
		$eval_string = '' ;
		foreach( $field_select['math_expression'] as $symbol_id => $symbol )
		{
			$eval_string.= $symbol['math_operation'] ;
			
			if( $symbol['math_parenthese_in'] )
				$eval_string.= '(' ;
				
			if( $symbol['math_staticvalue'] != 0 )
				$value = (float)($symbol['math_staticvalue']) ;
			elseif( isset($subSubRES_symbol_value[$symbol_id]) )
				$value = $subSubRES_symbol_value[$symbol_id] ;
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
		
		// *** Pour chaque groupe on ne retourne qu'une seule valeur => principe du comptage sur une itération
		$subRes_group_arrValues[$group_key_id] = array() ;
		$subRes_group_arrValues[$group_key_id][] = $val ;
	}
	
	
	// print_r($subRes_group_arrValues) ;
	
	return $subRes_group_arrValues ;
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
				if( !in_array($eval_value,$field_where['sql_arr_select']) )
					return FALSE ;
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
	
	if( $key_id = array_search($group_hash, $_groups_hashes ) )
	{
		// echo "same : ".$key_id."\n" ;
		return $key_id ;
	}
	
	$new_key_id = count($_groups_hashes)+1 ;
	$_groups_hashes[$new_key_id] = $group_hash ;
	
	
	return $new_key_id ;
}
function paracrm_queries_process_queryHelp_getGroupHash( $record_glob, $fields_group )
{
	global $arr_bible_trees , $arr_bible_entries , $arr_bible_racx_entry , $arr_bible_racx_treenode ;
	
	
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
				$src_field = $field_group['sql_file_field_code'].'_erx' ;
				
				$src_value = $record_glob[$src_code][$src_field] ;
				if( !$src_value )
					continue ;
					
				// echo count($arr_bible_racx_entry) ;
				if( !($group_value = $arr_bible_racx_entry[$field_group['sql_bible_code']][$src_value]) )
					continue ;
				
				$tab[$fieldgroup_id] = $group_value ;
			}
			// déterminer la valeur
			if( $field_group['group_bible_type'] == 'TREE' )
			{
				$src_code = $field_group['sql_file_code'] ;
				$src_field = $field_group['sql_file_field_code'].'_trx' ;
				
				$src_value = $record_glob[$src_code][$src_field] ;
				if( !$src_value )
					continue ;
					
				// echo count($arr_bible_racx_entry) ;
				if( !($group_value_tree = $arr_bible_racx_treenode[$field_group['sql_bible_code']][$src_value]) )
					continue ;
					
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
		}
	}
	
	
	return $tab ;
	
	// return $arr[$group_field] = $value ;
}

function paracrm_queries_process_queryHelp_group( $record_glob, $fields_group )
{
	$group_hash = paracrm_queries_process_queryHelp_getGroupHash( $record_glob, $fields_group ) ;
	// print_r($group_hash) ;
	
	
	
	$group_key_id = paracrm_queries_process_queryHelp_getIdGroup($group_hash) ;
	
	/*
	print_r($group_hash) ;
	echo $group_key_id."\n\n\n" ;
	*/
	
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
				&& $field_where['condition_bible_mode'] == 'SELECT' && $field_where['condition_bible_treenodes'] )
			{
				$tarr = array() ;
				foreach( json_decode($field_where['condition_bible_treenodes'],true) as $treenode_key )
					$tarr[] = $treenode_key ;
				$tabBibleConditions[] = $tarr ;
			}
		}
	foreach( paracrm_queries_process_labelEnum( $group_id, $field_group_tab, $tabBibleConditions ) as $bible_key => $display )
	{
		$subRES_tab = array() ;
		$subRES_tab['select_lib'] = $select_lib ;
		$subRES_tab['group_id'] = $groupId_forTab ;
		$subRES_tab['group_key'] = $bible_key ;
		$subRES_tab['tab_title'] = $display ;
	
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
					&& $field_where['condition_bible_mode'] == 'SELECT' && $field_where['condition_bible_treenodes'] )
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
					&& $field_where['condition_bible_mode'] == 'SELECT' && $field_where['condition_bible_treenodes'] )
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
	$arr = array() ;
	switch( $field_group['field_type'] )
	{
		case 'link' :
		switch( $field_group['group_bible_type'] )
		{
			case 'TREE' :
			foreach( paracrm_queries_process_labelEnumBibleTree( $field_group['sql_bible_code'], '&', $field_group['group_bible_tree_depth'], $bibleConditions ) as $record )
			{
				$ttmp = array() ;
				foreach( $field_group['group_bible_display_arrFields'] as $field )
				{
					$ttmp[] = $record[$field] ;
				}
				
				$treenode_key = $record['treenode_key'] ;
				
				$arr[$treenode_key] = implode(' - ',$ttmp) ;
			}
			break ;
			
			
			case 'ENTRY' :
			foreach( paracrm_queries_process_labelEnumBibleEntries( $field_group['sql_bible_code'], '&', $bibleConditions ) as $record )
			{
				$ttmp = array() ;
				foreach( $field_group['group_bible_display_arrFields'] as $field )
				{
					$ttmp[] = $record[$field] ;
				}
				
				$entry_key = $record['entry_key'] ;
				
				$arr[$entry_key] = implode(' - ',$ttmp) ;
			}
			break ;
		}
		break ;
		
		case 'date' :
		foreach( paracrm_queries_process_labelEnumDate( $group_id, $field_group['group_date_type'] ) as $group_key )
		{
			$arr[$group_key] = $group_key ;
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
	
		$query = "SELECT * FROM $view_name WHERE treenode_key='$treenode_key'" ;
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
				
			$query_treenode.= " AND treenode_key IN ".$_opDB->makeSQLlist($treenodes) ;
		}
	}

	$tab = array() ;
	// ***** foreignLinks ****
	// - conditions sur autre bible => pour la requete
	$view_name = 'view_bible_'.$bible_code.'_entry' ;
	$query = "SELECT * FROM $view_name WHERE 1" ;
	$query.= $query_treenode ;
	$query.= " ORDER BY treenode_key, entry_key" ;
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