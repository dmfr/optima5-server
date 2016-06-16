<?php
$GLOBALS['debug_evalSqlInnerQueries'] = FALSE ;

function paracrm_queries_process_buildTrees() {
	
	global $_opDB ;
	
	global $arr_bible_trees , $arr_bible_entries , $arr_bible_treenodes, $_biblesDone ;
	if( $_biblesDone ) {
		return ;
	}

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
		$query = "SELECT treenode_key, treenode_parent_key FROM store_bible_{$bible_code}_tree ORDER BY treenode_key" ;
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
		$query = "SELECT *
						FROM view_bible_{$bible_code}_entry e
						ORDER BY e.treenode_key, e.entry_key" ;
		$result = $_opDB->query($query) ;
		while( ($record = $_opDB->fetch_assoc($result)) != FALSE )
		{
			$entry_key = $record['entry_key'] ;
			$ttmp[$entry_key] = $record ;
		}
		$arr_bible_entries[$bible_code] = $ttmp ;
		
		
		$ttmp = array() ;
		$query = "SELECT *
						FROM view_bible_{$bible_code}_tree t
						ORDER BY t.treenode_key" ;
		$result = $_opDB->query($query) ;
		while( ($record = $_opDB->fetch_assoc($result)) != FALSE )
		{
			$treenode_key = $record['treenode_key'] ;
			$ttmp[$treenode_key] = $record ;
		}
		$arr_bible_treenodes[$bible_code] = $ttmp ;
	}
	
	
	
	//$mtree = $arr_bible_trees['STORE'] ;
	//print_r( $mtree->getTree('33040')->getAllMembers() ) ;
	
	$_biblesDone = TRUE ;
	return ;
}




function paracrm_queries_process_qbook($arr_saisie, $debug=FALSE, $src_filerecordId=NULL, $src_filerecord_row=NULL )
{
	global $_opDB ;
	
	/* ****************** EXEC d'1 qbook ******************
	
	- Constitution de toutes les variables
	
	- Execution de toutes les queries/qmerges
		* recopie des paramètres
		* stockage du RES

	- Evaluation de toutes les Values
	
	******************************************************** */
	
	if( $debug ) {
		echo "Qmerge 0: checks..." ;
	}
	/*
	unset($arr_saisie['bible_files_treefields']) ;
	unset($arr_saisie['bible_qobjs']) ;
	print_r($arr_saisie) ;
	*/
	if( $arr_saisie['backend_file_code'] && !$src_filerecordId && !$src_filerecord_row ) {
		return NULL ;
	} elseif( !$arr_saisie['backend_file_code'] ) {
		unset($src_filerecordId) ;
	}
	if( is_array($src_filerecord_row) ) {
		$target_fileCode = $arr_saisie['backend_file_code'] ;
		if( !isset($src_filerecord_row[$target_fileCode]) ) {
			return NULL ;
		}
	}elseif( $src_filerecordId && !$src_filerecord_row ) {
		$arr_fileCodes = array() ;
		$target_fileCode = $arr_saisie['backend_file_code'] ;
		$src_filerecord_row = array() ;
		while( TRUE ) {
			$arr_fileCodes[] = $target_fileCode ;
			$view_filecode = 'view_file_'.$target_fileCode ;
			$query = "SELECT * FROM {$view_filecode} WHERE filerecord_id='{$src_filerecordId}'" ;
			$arr = $_opDB->fetch_assoc($_opDB->query($query)) ;
			if( $arr===FALSE ) {
				return NULL ;
			}
			$src_filerecord_row[$target_fileCode] = $arr ;
			if( $arr['filerecord_parent_id'] > 0 ) {
				$target_fileCode = $_opDB->query_uniqueValue("SELECT file_parent_code FROM define_file WHERE file_code='{$target_fileCode}'") ;
				$src_filerecordId = $arr['filerecord_parent_id'] ;
				continue ;
			}
			break ;
		}
		//print_r($src_filerecord_row) ;
		foreach( $arr_fileCodes as $file_code ) {
			paracrm_lib_file_joinQueryRecord($file_code,$src_filerecord_row) ;
		}
	}
	if( $debug ) {
		echo "OK\n" ;
	}
	
	if( $debug ) {
		echo "Qmerge 1: extraction inputvars..." ;
	}
	$RES_inputvar = array() ;
	$RES_inputvar_lib = array() ;
	foreach( $arr_saisie['arr_inputvar'] as $cfg_inputvar ) {
		if( $cfg_inputvar['src_backend_is_on'] ) {
			$target_fileCode = ( $cfg_inputvar['src_backend_file_code'] ? $cfg_inputvar['src_backend_file_code'] : $arr_saisie['backend_file_code'] ) ;
			$target_fileFieldCode = 'field_'.$cfg_inputvar['src_backend_file_field_code'] ;
			if( !isset($src_filerecord_row[$target_fileCode][$target_fileFieldCode]) ) {
				return NULL ;
			} else {
				$val = $src_filerecord_row[$target_fileCode][$target_fileFieldCode] ;
				if( $cfg_inputvar['inputvar_linktype'] && $cfg_inputvar['src_backend_bible_type'] && $cfg_inputvar['src_backend_bible_field_code'] ) {
					switch( $cfg_inputvar['inputvar_linktype'] ) {
						case 'treenode' :
							$val_entryKey = NULL ;
							$val_bibleEntry = NULL ;
							$val_treenodeKey = $val ;
							$val_bibleTreenode = paracrm_lib_data_getRecord_bibleTreenode( $cfg_inputvar['inputvar_linkbible'], $val_treenodeKey ) ;
							break ;
						case 'entry' :
							$val_entryKey = $val ;
							$val_bibleEntry = paracrm_lib_data_getRecord_bibleEntry( $cfg_inputvar['inputvar_linkbible'], $val_entryKey ) ;
							$val_treenodeKey = $val_bibleEntry['treenode_key'] ;
							$val_bibleTreenode = paracrm_lib_data_getRecord_bibleTreenode( $cfg_inputvar['inputvar_linkbible'], $val_treenodeKey ) ;
							break ;
					}
					switch( $cfg_inputvar['src_backend_bible_type'] ) {
						case 'tree' :
							$bible_field_code = 'field_'.$cfg_inputvar['src_backend_bible_field_code'] ;
							if( isset($val_bibleTreenode[$bible_field_code]) ) {
								$val = $val_bibleTreenode[$bible_field_code] ;
							}
							break ;
						case 'entry' :
							$bible_field_code = 'field_'.$cfg_inputvar['src_backend_bible_field_code'] ;
							if( isset($val_bibleEntry[$bible_field_code]) ) {
								$val = $val_bibleEntry[$bible_field_code] ;
							}
							break ;
					}
				}
			}
		} elseif( $cfg_inputvar['inputvar_type'] == 'date' ) {
			$val = date('Y-m-d H:i:s') ;
		}
		
		if( $cfg_inputvar['inputvar_type'] == 'date' ) {
			$val = date('Y-m-d',strtotime($val)) ;
			if( $cfg_inputvar['date_align_is_on'] ) {
				switch( $cfg_inputvar['date_align_segment_type'] ) {
					case 'WEEK' :
						$numericWeekDay = date('N',strtotime($val)) ;
						if( $cfg_inputvar['date_align_direction_end'] ) {
							$targetWeekDay = 7 ;
						} else {
							$targetWeekDay = 1 ;
						}
						$deltaWeekDay = $targetWeekDay - $numericWeekDay ;
						if( $deltaWeekDay == 0 ) {
							break ;
						}
						$deltaWeekDay = ($deltaWeekDay>0 ? '+':'-').abs($deltaWeekDay).' days' ;
						$val = date('Y-m-d',strtotime($deltaWeekDay,strtotime($val))) ;
						break ;
				
					case 'MONTH' :
						if( $cfg_inputvar['date_align_direction_end'] ) {
							$val = date('Y-m-t',strtotime($val)) ;
						} else {
							$val = date('Y-m-01',strtotime($val)) ;
						}
						break ;
						
					case 'YEAR' :
						if( $cfg_inputvar['date_align_direction_end'] ) {
							$val = date('Y-12-31',strtotime($val)) ;
						} else {
							$val = date('Y-01-01',strtotime($val)) ;
						}
						break ;
						
					default :
						break ;
				}
			}
			if( $cfg_inputvar['date_calc_is_on'] && abs($cfg_inputvar['date_calc_segment_count']) > 0 ) {
				$sentence = ($cfg_inputvar['date_calc_segment_count']>0 ? '+':'-').abs($cfg_inputvar['date_calc_segment_count']) ;
				$sentence.= ' ' ;
				switch( $cfg_inputvar['date_calc_segment_type'] ) {
					case 'DAY' :
						$sentence.= 'days' ;
						break ;
					case 'WEEK' :
						$sentence.= 'weeks' ;
						break ;
					case 'MONTH' :
						$sentence.= 'months' ;
						break ;
					case 'YEAR' :
						$sentence.= 'years' ;
						break ;
					default :
						unset($sentence) ;
						break ;
				}
				if( $sentence ) {
					$val = date('Y-m-d',strtotime($sentence,strtotime($val))) ;
				}
				
				if( $cfg_inputvar['date_calc_segment_type'] == 'MONTH'
					&& $cfg_inputvar['date_align_is_on'] && $cfg_inputvar['date_align_direction_end'] && in_array($cfg_inputvar['date_align_segment_type'],array('MONTH','YEAR')) ) {
					
					// 2nd align
					if( date('d',strtotime($val)) > 15 ) {
						$val = date('Y-m-t',strtotime($val)) ;
					} else {
						$val = date('Y-m-t',strtotime('-1 month',strtotime($val))) ;
					}
				}
			}
		}
		
		$RES_inputvar[] = $val ;
		$RES_inputvar_lib[] = $cfg_inputvar['inputvar_lib'] ;
	}
	if( $debug ) {
		echo "OK\n" ;
	}
	
	
	if( $debug ) {
		echo "Qmerge pre3: Values..." ;
	}
	foreach( $arr_saisie['arr_value'] as $cfg_value ) {
		$RES_value[] = NULL ;
		$RES_value_lib[] = $cfg_value['select_lib'] ;
		$RES_value_mathRound[] = $cfg_value['math_round'] ;
	}
	if( $debug ) {
		echo "OK\n" ;
	}
	
	
	if( $debug ) {
		echo "Qmerge 2: Query/Qmerge...\n" ;
	}
	$RES_qobj = array() ;
	$RES_qobj_lib = array() ;
	foreach( $arr_saisie['arr_qobj'] as $cfg_qobj ) {
		// Load de la query / qmerge
		switch( $cfg_qobj['target_q_type'] ) {
			case 'query' :
				$arrSaisieQuery = array() ;
				foreach( $arr_saisie['bible_qobjs'] as $arrSaisieQuery_test ) {
					if( $arrSaisieQuery_test['q_type'] == 'query' && $arrSaisieQuery_test['query_id'] == $cfg_qobj['target_query_id'] ) {
						$arrSaisieQuery = $arrSaisieQuery_test ;
						break ;
					}
				}
				$target_file_code = $arrSaisieQuery['target_file_code'] ;
				$arrSaisieQuery['treefields_root'] = $arr_saisie['bible_files_treefields'][$target_file_code] ;
				
				// replace des valeurs
				foreach( $cfg_qobj['qobj_fields'] as $cfg_field ) {
					$src_inputvar_idx = $cfg_field['src_inputvar_idx'] ;
					$target_query_wherefield_idx = $cfg_field['target_query_wherefield_idx'] ;
					$mvalue = $RES_inputvar[$src_inputvar_idx] ;
					if( $target_query_wherefield_idx != -1 ) {
						switch( $cfg_field['field_type'] ) {
							case 'file' :
							case 'date' :
							case 'string' :
							case 'number' :
							case 'forcevalue' :
								$mkey = $cfg_field['target_subfield'] ;
								break ;
								
							case 'link' :
								// TYPE DE VALEUR 'treenode ? entry ? de inputvar
								switch( $mkey = $cfg_field['target_subfield'] ) {
									case 'condition_bible_treenodes' :
									case 'condition_bible_entries' :
										$mvalue = json_encode(array($mvalue)) ;
										break ;
										
									default :
										break ;
								}
								break ;
								
							default :
								continue 2 ;
						}
						$arrSaisieQuery['fields_where'][$target_query_wherefield_idx][$mkey] = $mvalue ;
					}
				}
				
				$RES_qobj[] = paracrm_queries_process_query($arrSaisieQuery) ;
				$RES_qobj_lib[] = $cfg_qobj['qobj_lib'] ;
				break ;
		
			case 'qmerge' :
				$arrSaisieQmerge = array() ;
				foreach( $arr_saisie['bible_qobjs'] as $arrSaisieQuery_test ) {
					if( $arrSaisieQuery_test['q_type'] == 'qmerge' && $arrSaisieQuery_test['qmerge_id'] == $cfg_qobj['target_qmerge_id'] ) {
						$arrSaisieQmerge = $arrSaisieQuery_test ;
						break ;
					}
				}
				$arrSaisieQmerge['bible_queries'] = $arr_saisie['bible_qobjs'] ;
				$arrSaisieQmerge['bible_files_treefields'] = $arr_saisie['bible_files_treefields'] ;
				
				// replace des valeurs
				foreach( $cfg_qobj['qobj_fields'] as $cfg_field ) {
					$src_inputvar_idx = $cfg_field['src_inputvar_idx'] ;
					$target_qmerge_mwherefield_idx = $cfg_field['target_qmerge_mwherefield_idx'] ;
					$mvalue = $RES_inputvar[$src_inputvar_idx] ;
					if( $target_qmerge_mwherefield_idx != -1 ) {
						switch( $cfg_field['field_type'] ) {
							case 'extrapolate' :
							case 'date' :
							case 'string' :
							case 'number' :
							case 'file' :
							case 'forcevalue' :
								$mkey = $cfg_field['target_subfield'] ;
								break ;
								
							case 'link' :
								// TYPE DE VALEUR 'treenode ? entry ? de inputvar
								switch( $mkey = $cfg_field['target_subfield'] ) {
									case 'condition_bible_treenodes' :
									case 'condition_bible_entries' :
										$mvalue = json_encode(array($mvalue)) ;
										break ;
										
									default :
										break ;
								}
								break ;
								
							default :
								continue 2 ;
						}
						$arrSaisieQmerge['fields_mwhere'][$target_qmerge_mwherefield_idx][$mkey] = $mvalue ;
					}
				}
				
				
				$RES_qobj[] = paracrm_queries_process_qmerge($arrSaisieQmerge) ;
				$RES_qobj_lib[] = $cfg_qobj['qobj_lib'] ;
				break ;
		}
		
		paracrm_queries_process_qbook_doValues( $arr_saisie, $debug, $RES_inputvar, $RES_qobj, $RES_value, $src_filerecord_row ) ;
	}
	if( $debug ) {
		echo "OK\n" ;
	}
	
	
	return array('RES_inputvar'=>$RES_inputvar,
					'RES_inputvar_lib'=>$RES_inputvar_lib,
					'RES_qobj' => $RES_qobj,
					'RES_qobj_lib' => $RES_qobj_lib,
					'RES_value' => $RES_value,
					'RES_value_lib' => $RES_value_lib,
					'RES_value_mathRound' => $RES_value_mathRound ) ;
}
function paracrm_queries_process_qbook_doValues( $arr_saisie, $debug=FALSE, $RES_inputvar, $RES_qobj, &$RES_value, &$src_filerecord_row=NULL ) {
	
	if( $debug ) {
		echo "-- Qmerge 2-3: Values : " ;
	}
	foreach( $arr_saisie['arr_value'] as $value_idx => $cfg_value ) {
		if( !($RES_value[$value_idx]===NULL) ) {
			if( $debug ) {
				echo " " ;
			}
			continue ;
		}
		
		$t_symbolIdx_value = array() ;
		foreach( $cfg_value['math_expression'] as $symbol ) {
			unset($val) ;
			while( TRUE ){
				if( $symbol['math_staticvalue'] != 0 ) {
					$val = $symbol['math_staticvalue'] ;
					break ;
				}
			
				if( $symbol['math_operand_inputvar_idx'] >= 0 ) {
					$val = $RES_inputvar[$symbol['math_operand_inputvar_idx']] ;
					if( !is_numeric($val) ) {
						if( strtotime($val) ) {
							$val = strtotime($val) / (60*60*24) ;
						} else {
							unset($val) ;
						}
					}
					break ;
				}
				
				if( ($idx = $symbol['math_operand_qobj_idx']) >= 0 && isset($RES_qobj[$idx]) ) {
					if( !isset($RES_qobj[$idx]) ) {
						break ;
					}
					$sRES_qobj = $RES_qobj[$idx] ;
					switch( $arr_saisie['arr_qobj'][$idx]['target_q_type'] ) {
						case 'query' :
							$select_id = $symbol['math_operand_selectfield_idx'] ;
							if( count($sRES_qobj['RES_groupKey_selectId_value']) > 1 ) {
								break 2 ;
							}
							$ttmp = current($sRES_qobj['RES_groupKey_selectId_value']) ;
							$val = $ttmp[$select_id] ;
							if( !is_numeric($val) ) {
								$val = $sRES_qobj['RES_selectId_nullValue'][$select_id] ;
							}
							if( !is_numeric($val) ) {
								$val = 0 ;
							}
							break ;
							
						case 'qmerge' :
							$mselect_id = $symbol['math_operand_mselectfield_idx'] ;
							if( count($sRES_qobj['RES_selectId_groupKey_value'][$mselect_id]) > 1 ) {
								break 2 ;
							}
							$val = current($sRES_qobj['RES_selectId_groupKey_value'][$mselect_id]) ;
							if( !is_numeric($val) ) {
								$val = 0 ;
							}
							break ;
						
						default :
							break 2 ;
					}
				}
				break ;
			}
			if( !isset($val) ){
				unset($t_symbolIdx_value) ;
				break ;
			}
			$t_symbolIdx_value[] = $val ;
		}
		if( !isset($t_symbolIdx_value) ) {
			if( $debug ) {
				echo "x" ;
			}
			continue ;
		}
		
		$eval_string = '' ;
		foreach( $cfg_value['math_expression'] as $symbol_id => $symbol )
		{
			$eval_string.= $symbol['math_operation'] ;
			
			if( $symbol['math_parenthese_in'] )
				$eval_string.= '(' ;
				
			$eval_string.= '('.$t_symbolIdx_value[$symbol_id].')' ;
			
			if( $symbol['math_parenthese_out'] )
				$eval_string.= ')' ;
		}
		$Rval = 0 ;
		@eval( '$Rval = ('.$eval_string.') ;' ) ;
		
		$RES_value[$value_idx] = $Rval ;
		if( $debug ) {
			echo "o" ;
		}
		
		// Save TO
		foreach( $cfg_value['saveto'] as $cfg_saveto ) {
			$target_fileCode = $cfg_saveto['target_backend_file_code'] ;
			$target_fileFieldCode = 'field_'.$cfg_saveto['target_backend_file_field_code'] ;
			
			if( !isset($src_filerecord_row[$target_fileCode][$target_fileFieldCode]) ) {
				if( $debug ) {
					echo " oops! " ;
				}
				continue ;
			}
			
			// Memory save
			$src_filerecord_row[$target_fileCode][$target_fileFieldCode] = $Rval ;
			
			// DB Save
			$update_row = array() ;
			$update_row[$target_fileFieldCode] = $Rval ;
			$target_filerecordId = $src_filerecord_row[$target_fileCode]['filerecord_id'] ;
			paracrm_lib_data_updateRecord_file( $target_fileCode , $update_row, $target_filerecordId ) ;
		}
	}
	if( $debug ) {
		echo " : OK\n" ;
	}
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
		echo "Qmerge 1b: merging wheres & groupExtrapolate..." ;
	}
	foreach( $arr_saisie['fields_mwhere'] as $field_mwhere ) {
		foreach( $field_mwhere['query_fields'] as $query_field )
		{
			$target_query_id = $query_field['query_id'] ;
			$target_query_wherefield_idx = $query_field['query_wherefield_idx'] ;
			$target_query_groupfield_idx = $query_field['query_groupfield_idx'] ;
		
			if( $target_query_wherefield_idx != -1 ) {
				foreach( $field_mwhere as $mkey => $mvalue ) {
					if( strpos($mkey,'condition_') === 0 ) {
						$arr_queryId_arrSaisieQuery[$target_query_id]['fields_where'][$target_query_wherefield_idx][$mkey] = $mvalue ;
					}
				}
			}
			if( $target_query_groupfield_idx != -1 ) {
				foreach( $field_mwhere as $mkey => $mvalue ) {
					if( strpos($mkey,'extrapolate_') === 0 ) {
						$arr_queryId_arrSaisieQuery[$target_query_id]['fields_group'][$target_query_groupfield_idx][$mkey] = $mvalue ;
					}
				}
			}
		}
	}
	if( $debug ) {
		echo "OK\n" ;
	}
	
	

	
	
	if( $debug ) {
		echo "Qmerge 2: executing queries..." ;
	}
	$RESqueries = array() ;
	foreach( $arr_queryId_arrSaisieQuery as $query_id => &$arrSaisieQuery ) {
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
	unset($arrSaisieQuery) ;
	// print_r($RESqueries) ;
	if( $debug ) {
		echo "OK\n" ;
	}
	
	
	
	
	
	
	if( $debug ) {
		echo "Qmerge 3: evaluating groups..." ;
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
					case 'TREEVIEW' :
						$grouphash .= '%'.'TREEVIEW' ;
						break ;
					case 'ENTRY' :
						$grouphash .= '%'.'ENTRY' ;
						break ;
					case 'TREE' :
						$grouphash .= '%'.'TREE'.'%'.$field_group['group_bible_tree_depth'] ;
						break ;
				}
				break ;
				
				case 'date' :
				$grouphash.= 'DATE'.'%'.$field_group['group_date_type'] ;
				break ;
				
				case 'file' :
				$grouphash.= 'FILE'.'%'.$field_group['field_code'] ;
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
			$grouphash = key($probeGeoGrouphashArrQueries['tab']) ;
			$RES_titles['group_tagId'][$grouphash] = $grouphash ;
			$RES_labels[$tabidx]['group_id'] = $grouphash ;
			$RES_labels[$tabidx]['group_key'] = $group_key ;
			$RES_labels[$tabidx]['tab_title'] = $tab_title ;
		}
		else {
			$RES_labels[$tabidx]['tab_title'] = preg_replace("/[^a-zA-Z0-9\s]/", "", $arr_saisie['qmerge_name']) ;
			$RES_labels[$tabidx]['tab_title_isDummy'] = true ;
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
			$RES_titles['group_tagId'][$grouphash] = $grouphash ;
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
			$RES_titles['group_tagId'][$grouphash] = $grouphash ;
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
		
		if( count($probeGeoGrouphashArrQueries['grid-y'])==1 ) {
			reset($probeGeoGrouphashArrQueries['grid-y']) ;
			$unique_y_grouphash = key($probeGeoGrouphashArrQueries['grid-y']) ;
			if( strpos($unique_y_grouphash,'BIBLE%')===0 && strstr($unique_y_grouphash,'%TREEVIEW')=='%TREEVIEW' ) {
				$RES_titles['cfg_doTreeview'] = TRUE ;
			}
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
				if( $symbol['math_operand_query_id'] ) {} else continue ;
				
				//initialement, toutes les valeurs recherchées sont inexistantes
				$cellValues[$symbol_id] = FALSE ;
			
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
				
					$cellValues[$symbol_id] = paracrm_queries_process_lookupValue($RESqueries[$query_id], $selectfield_idx, $queryGroupDesc) ; 
					
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
					
					$cellValues[$symbol_id][] = paracrm_queries_process_lookupValue($RESqueries[$query_id], $selectfield_idx, $queryGroupDesc) ;  ;
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
						
						@eval( '$val = ('.$eval_string.') ;' ) ;
						if( $val===FALSE ) {
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

	// Clean des groupes fantomes utilisés pour la création des axes
	foreach( $RES_labels as $tabidx => $dummy ) {
		if( isset($RES_labels[$tabidx]['arr_grid-x']['']) ) {
			unset($RES_labels[$tabidx]['arr_grid-x']['']) ;
		}
		if( isset($RES_labels[$tabidx]['arr_grid-y']['']) ) {
			unset($RES_labels[$tabidx]['arr_grid-y']['']) ;
		}
	}

	return array('RES_groupKey_groupDesc'=>$RES_groupKey_groupDesc,
					'RES_selectId_groupKey_value'=>$RES_selectId_groupKey_value,
					'RES_labels'=>$RES_labels,
					'RES_titles'=>$RES_titles,
					'RES_selectId_infos'=>$RES_selectId_infos) ;
}

function paracrm_queries_process_lookupValue( &$RES, $select_id, $group_desc ) {
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
		return $RES['RES_selectId_nullValue'][$select_id] ;
	}
	elseif( !isset($RES['RES_groupKey_selectId_value'][$key_id][$select_id]) )
	{
		return $RES['RES_selectId_nullValue'][$select_id] ;
	}
	else
	{
		return $RES['RES_groupKey_selectId_value'][$key_id][$select_id] ;
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






function paracrm_queries_process_query(&$arr_saisie, $debug=FALSE) 
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
		if( $arr_indexed_treefields[$tfield]['bible_code'] && $arr_indexed_treefields[$tfield]['bible_field_code'] )
		{
			$field_where['sql_file_field_code'] = 'field_'.$arr_indexed_treefields[$tfield]['file_field_code'] ;
			$field_where['sql_linktype'] = $arr_indexed_treefields[$tfield]['field_linktype'] ;
			$field_where['sql_bible_code'] = $arr_indexed_treefields[$tfield]['bible_code'] ;
			$field_where['sql_bible_field_code'] = 'field_'.$arr_indexed_treefields[$tfield]['bible_field_code'] ;
			$field_where['sql_bible_type'] = $arr_indexed_treefields[$tfield]['bible_type'] ;
		}
		elseif( $arr_indexed_treefields[$tfield]['bible_code'] )
		{
			$field_where['sql_file_field_code'] = 'field_'.$arr_indexed_treefields[$tfield]['file_field_code'] ;
			$field_where['sql_linktype'] = $arr_indexed_treefields[$tfield]['field_linktype'] ;
			$field_where['sql_bible_code'] = $arr_indexed_treefields[$tfield]['bible_code'] ;
		}
		elseif( $arr_indexed_treefields[$tfield]['file_field_code'] )
		{
			$field_where['sql_file_field_code'] = 'field_'.$arr_indexed_treefields[$tfield]['file_field_code'] ;
		}
		
		switch( $field_where['field_type'] )
		{
			case 'file' :
			if( $field_where['condition_file_ids'] ) {
				$field_where['sql_arr_select'] = json_decode($field_where['condition_file_ids'],true) ;
			} else {
				unset($fields_where[$field_id]) ;
			}
			break ;
			
			case 'link' :
			if( $field_where['condition_bible_mode'] != 'SELECT' )
				break ;
			$field_where['sql_bible_code'] = $arr_indexed_treefields[$tfield]['bible_code'] ;
			if( $field_where['condition_bible_entries'] && (!isJsonArr($field_where['condition_bible_entries']) || json_decode($field_where['condition_bible_entries'],true)) )
			{
				$field_where['condition_bible_store'] = 'entry' ;
				$field_where['sql_file_field_code'] = $field_where['sql_file_field_code'] ;
				if( isJsonArr($field_where['condition_bible_entries']) ) {
					$field_where['sql_arr_select'] = json_decode($field_where['condition_bible_entries'],true) ;
				} else {
					$entry_key = $field_where['condition_bible_entries'] ;
					$field_where['sql_arr_select'] = array();
					$field_where['sql_arr_select'][] = $entry_key ;
				}
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
					$tRootTree = $tmp_tree->getTree($trootnode) ;
					if( $tRootTree == NULL ) {
						continue ;
					}
					
					foreach( $tRootTree->getAllMembers() as $tnode )
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
	unset($field_where) ;
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
			if( $field_progress['condition_bible_entries'] && (!isJsonArr($field_progress['condition_bible_entries']) || json_decode($field_progress['condition_bible_entries'],true))  )
			{
				$field_progress['condition_bible_store'] = 'entry' ;
				$field_progress['sql_file_field_code'] = $field_progress['sql_file_field_code'].'_entry' ;
				if( isJsonArr($field_progress['condition_bible_entries']) ) {
					$field_progress['sql_arr_select'] = json_decode($field_progress['condition_bible_entries'],true) ;
				} else {
					$entry_key = $field_progress['condition_bible_entries'] ;
					$field_progress['sql_arr_select'] = array();
					$field_progress['sql_arr_select'][] = $entry_key ;
				}
			}
			elseif( $field_progress['condition_bible_treenodes'] && json_decode($field_progress['condition_bible_treenodes'],true) )
			{
				$field_progress['sql_file_field_code'] = $field_progress['sql_file_field_code'].'_tree' ;
				$field_progress['sql_arr_select'] = array() ;
				if( !$arr_bible_trees[$arr_indexed_treefields[$tfield]['bible_code']] )
					continue ;
				$tmp_tree = $arr_bible_trees[$arr_indexed_treefields[$tfield]['bible_code']] ;
				foreach( json_decode($field_progress['condition_bible_treenodes'],true) as $trootnode )
				{
					$tRootTree = $tmp_tree->getTree($trootnode) ;
					if( $tRootTree == NULL ) {
						continue ;
					}
					
					foreach( $tRootTree->getAllMembers() as $tnode )
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
	unset($field_progress) ;
	}
	$arr_saisie['fields_progress'] = $fields_progress ;
	if( $debug ) {
		echo "OK\n" ;
	}
	//print_r($fields_where) ;
	
	
	
	
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
		$tfield = $field_group['field_code'] ;
		$field_group['sql_file_code'] = $arr_indexed_treefields[$tfield]['file_code'] ;
		$field_group['sql_file_field_code'] = ( $arr_indexed_treefields[$tfield]['file_field_code'] ? 'field_'.$arr_indexed_treefields[$tfield]['file_field_code'] : 'filerecord_id' ) ;
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
		
		$field_group['sql_linktype'] = $arr_indexed_treefields[$tfield]['field_linktype'] ;
		$field_group['sql_bible_code'] = $arr_indexed_treefields[$tfield]['bible_code'] ;
	}
	unset($field_group) ;
	$arr_saisie['fields_group'] = $fields_group ;
	if( $debug ) {
		echo "OK\n" ;
	}
	
	
	if( $debug ) {
		echo "Debug 3b1: factorisation des groupes LINK+geometry" ;
	}
	$fields_group = $arr_saisie['fields_group'] ;
	
	$fields_group_new = array() ;
	
	foreach( $fields_group as $field_id => &$field_group )
	{
		if( $field_group['field_type'] == 'link' ) {
			unset($fields_group[$field_id]) ;

			// identifiant LINK+geometry du groupe factorisé
			$group_target_hash = $field_group['field_code'].'@'.$field_group['display_geometry'] ;
			
			if( !$fields_group_new[$group_target_hash] ) {
				// creation d'un nouveau groupe "entete"
				$new_link_group = array() ;
				$new_link_group['field_code'] = $field_group['field_code'] ;
				$new_link_group['field_type'] = 'link' ;
				$new_link_group['field_linkbible'] = $field_group['field_linkbible'] ;
				$new_link_group['display_geometry'] = $field_group['display_geometry'] ;
				$new_link_group['sql_file_code'] = $field_group['sql_file_code'] ;
				$new_link_group['sql_file_field_code'] = $field_group['sql_file_field_code'] ;
				$new_link_group['sql_linktype'] = $field_group['sql_linktype'] ;
				$new_link_group['sql_bible_code'] = $field_group['sql_bible_code'] ;
				$fields_group_new[$group_target_hash] = $new_link_group ;
			}
			
			// groupage niveau requete au point le plus fin
			if( $field_group['group_bible_type'] == 'TREE' && $field_group['group_bible_tree_depth'] == 0 ) {
				$fields_group_new[$group_target_hash]['tmp_is_useTreeview'] = TRUE ;
			} elseif( $field_group['group_bible_type'] == 'ENTRY' ) {
				$fields_group_new[$group_target_hash]['tmp_is_groupByEntry'] = TRUE ;
			} elseif( $field_group['group_bible_type'] == 'TREE' ) {
				$fields_group_new[$group_target_hash]['tmp_groupByTreelevel'] = TRUE ;
				if( $field_group['group_bible_tree_depth'] > $fields_group_new[$group_target_hash]['tmp_groupByTreelevel_depth'] ) {
					$fields_group_new[$group_target_hash]['tmp_groupByTreelevel_depth'] = $field_group['group_bible_tree_depth'] ;
				}
			} else {
				continue ;
			}
			
			// stockage des parametres d'affichage
			switch( $field_group['group_bible_type'] )
			{
				case 'ENTRY' :
				foreach( json_decode($field_group['group_bible_display_entry'],true) as $field )
				{
					if( $arr_indexed_treefields[$field]['bible_type'] != 'entry' ) {
						continue ;
					}
					
					$display_field_key = 'entry'.'_'.$arr_indexed_treefields[$field]['bible_field_code'] ;
					
					$ttmp = array() ;
					$ttmp['tfield'] = $field ;
					$ttmp['bible_type'] = 'entry' ;
					$ttmp['bible_field_code'] = $arr_indexed_treefields[$field]['bible_field_code'] ;
					
					$fields_group_new[$group_target_hash]['group_bible_display_arrFields'][$display_field_key] = $ttmp ;
				}
				break ;
				
				case 'TREE' :
				$depth = $field_group['group_bible_tree_depth'] ;
				foreach( json_decode($field_group['group_bible_display_treenode'],true) as $field )
				{
					if( $arr_indexed_treefields[$field]['bible_type'] != 'tree' ) {
						continue ;
					}
				
					if( $depth > 0 ) {
						$display_field_key = 'tree'.'_'.$depth.'_'.$arr_indexed_treefields[$field]['bible_field_code'] ;
					} else {
						$display_field_key = 'tree'.'_'.$arr_indexed_treefields[$field]['bible_field_code'] ;
					}
					
					$ttmp = array() ;
					$ttmp['tfield'] = $field ;
					$ttmp['bible_tree_depth'] = $depth ;
					$ttmp['bible_type'] = 'tree' ;
					$ttmp['bible_field_code'] = $arr_indexed_treefields[$field]['bible_field_code'] ;
					
					$fields_group_new[$group_target_hash]['group_bible_display_arrFields'][$display_field_key] = $ttmp ;
				}
				break ;
			
				default : break ;
			}
			
		}
	}
	unset($field_group) ;
	
	foreach( $fields_group_new as $field_group ) {
		if( $field_group['tmp_is_useTreeview'] ) {
			$field_group['group_bible_type'] = 'TREEVIEW' ;
			$field_group['group_do_entries'] = ( $field_group['tmp_is_groupByEntry'] == TRUE ) ;
		} elseif( $field_group['tmp_is_groupByEntry'] ) {
			$field_group['group_bible_type'] = 'ENTRY' ;
		} elseif( $field_group['tmp_groupByTreelevel'] ) {
			$field_group['group_bible_type'] = 'TREE' ;
			$field_group['group_bible_tree_depth'] = $field_group['tmp_groupByTreelevel_depth'] ;
		} else {
			continue ;
		}
		
		$fields_group[] = $field_group ;
	}
	unset($field_group) ;
	
	$arr_saisie['fields_group'] = $fields_group ;
	if( $debug ) {
		echo "OK\n" ;
	}
	
	
	if( $debug ) {
		echo "Debug 3b2: display fields groups FILE" ;
	}
	$fields_group = $arr_saisie['fields_group'] ;
	foreach( $fields_group as $field_id => &$field_group )
	{
		if( $field_group['field_type'] == 'file' ) {
			foreach( json_decode($field_group['group_file_display_record'],true) as $field )
			{
				if( !isset($arr_indexed_treefields[$field]) 
				|| $arr_indexed_treefields[$field]['file_code'] != $field_group['field_code']
				|| !$arr_indexed_treefields[$field]['file_field_code'] ) {
					continue ;
				}
				
				$display_field_key = $arr_indexed_treefields[$field]['file_field_code'] ;
			
				$ttmp = array() ;
				$ttmp['tfield'] = $field ;
				$ttmp['file_code'] = $arr_indexed_treefields[$field]['file_code'] ;
				$ttmp['file_field_code'] = $arr_indexed_treefields[$field]['file_field_code'] ;
				$ttmp['field_type'] = $arr_indexed_treefields[$field]['field_type'] ;
				
				$field_group['group_file_display_arrFields'][$display_field_key] = $ttmp ;
			}
		}
	}
	unset($field_group) ;
	$arr_saisie['fields_group'] = $fields_group ;
	if( $debug ) {
		echo "OK\n" ;
	}
		
		
	if( $debug ) {
		echo "Debug 3c: preprocess SELECT..." ;
	}
	$fields_select = $arr_saisie['fields_select'] ;
	// analyse !!! Mode de requête ? Count / Value
	// --- Si dans les operands on a un titre de fichier ou de bible => mode COUNT
	// --- Sinon mode VALUE
	// Réalisation de la requête :
	//  COUNT => une opération à la fois
	//  VALUES => tout en même temps
	foreach( $fields_select as $select_id => &$field_select ) {
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
				$symbol['sql_linktype'] = $arr_indexed_treefields[$math_operand]['field_linktype'] ;
				$symbol['sql_bible_code'] = $arr_indexed_treefields[$math_operand]['bible_code'] ;
				$symbol['sql_bible_field_code'] = 'field_'.$arr_indexed_treefields[$math_operand]['bible_field_code'] ;
				$symbol['sql_bible_type'] = $arr_indexed_treefields[$math_operand]['bible_type'] ;
			}
			elseif( $arr_indexed_treefields[$math_operand]['bible_code'] )
			{
				$symbol['sql_file_field_code'] = 'field_'.$arr_indexed_treefields[$math_operand]['file_field_code'] ;
				$symbol['sql_linktype'] = $arr_indexed_treefields[$math_operand]['field_linktype'] ;
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
		unset($symbol) ;
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
	}
	unset($field_select) ;
	$arr_saisie['fields_select'] = $fields_select ;
	if( $debug ) {
		echo "OK\n" ;
	}
	
	
	
	if( $debug ) {
		echo "Debug 3d: preprocess for JOINS :" ;
		// Determine if join needed for WHERE , for SELECT
	}
	$arr_saisie['join_for_file'] = array() ;
	
	$arr_saisie['join_for_where'] = FALSE ;
	foreach( $arr_saisie['fields_where'] as $field_where ) {
		$file_code = $field_where['sql_file_code'] ;
		$file_field_code = substr($field_where['sql_file_field_code'],6) ;
		$jMap = paracrm_lib_file_joinPrivate_getMap( $file_code ) ;
		if( isset($jMap[$file_field_code]) ) {
			$arr_saisie['join_for_file'][$file_code] = TRUE ;
			$arr_saisie['join_for_where'] = TRUE ;
		}
	}
	if( $debug ) { echo " Where:".($arr_saisie['join_for_where'] ? 'true' : 'false') ; }
	
	$arr_saisie['join_for_group'] = FALSE ;
	foreach( $arr_saisie['fields_group'] as $field_group ) {
		$file_code = $field_group['sql_file_code'] ;
		$file_field_code = substr($field_group['sql_file_field_code'],6) ;
		$jMap = paracrm_lib_file_joinPrivate_getMap( $file_code ) ;
		if( isset($jMap[$file_field_code]) ) {
			$arr_saisie['join_for_file'][$file_code] = TRUE ;
			$arr_saisie['join_for_group'] = TRUE ;
		}
	}
	if( $debug ) { echo " Group:".($arr_saisie['join_for_group'] ? 'true' : 'false') ; }
	
	$arr_saisie['join_for_select'] = FALSE ;
	foreach( $arr_saisie['fields_select'] as $field_select ) {
		foreach( $field_select['math_expression'] as $symbol_id => $symbol ) {
			$file_code = $symbol['sql_file_code'] ;
			$file_field_code = substr($symbol['sql_file_field_code'],6) ;
			$jMap = paracrm_lib_file_joinPrivate_getMap( $file_code ) ;
			if( isset($jMap[$file_field_code]) ) {
				$arr_saisie['join_for_file'][$file_code] = TRUE ;
				$arr_saisie['join_for_select'] = TRUE ;
			}
		}
	}
	if( $debug ) { echo " Select:".($arr_saisie['join_for_select'] ? 'true' : 'false') ; }
	
	if( $debug ) {
		echo " OK\n" ;
	}
	
	
	
	// CALCUL (pour chaque select_field) de la NULL value
	if( $debug ) {
		echo "Debug 4pre: calcul null value...\n" ;
	}
	foreach( $arr_saisie['fields_select'] as $select_id => &$field_select ) {
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
			
			@eval( '$val = ('.$eval_string.') ;' ) ;
			if( $val===FALSE ) {
				break ;
			}
			$field_select['null_value'] = $val ;
			break ;
		}
		if( $debug ) {
			echo " for {$select_id} is [{$field_select['null_value']}] , OK\n" ;
		}
	}
	unset($field_select) ;
	
	
	// EXECUTION DE LA REQUETE
	// Résultats :
	//   $RES_groupKey_groupDesc(=$_groups_hashes) : annuaire des coordonnées de cellule ( $group_hash => tableau ( $group_id => $valeur etiquette ) )
	//   $RES_groupKey_value : tab.assoc ( $group_hash => $valeur resultat )
	if( $debug ) {
		echo "Debug 4: execution query " ;
	}
	$RES_groupKey_selectId_value = array() ;
	$RES_groupKey_selectId_value = paracrm_queries_process_query_iteration( $arr_saisie ) ;
	paracrm_queries_process_query_debugForceValue( $RES_groupKey_selectId_value, $arr_saisie['fields_where'] ) ;
	
	$RES_progress_groupKey_selectId_value = array() ;
	if( $arr_saisie['fields_progress'] ) {
		foreach( $arr_saisie['fields_progress'] as &$field_progress ) {
			$arr_saisie_copy = $arr_saisie ;
			if( !is_array($arr_saisie_copy['fields_where']) )
				$arr_saisie_copy['fields_where'] = array() ;
			$arr_saisie_copy['fields_where'][] = $field_progress ;
			
			// execution d'une requete alternative
			$RES_alt_progress = paracrm_queries_process_query_iteration( $arr_saisie_copy ) ;
			paracrm_queries_process_query_debugForceValue( $RES_alt_progress, $arr_saisie_copy['fields_where'] ) ;
			$RES_progress_groupKey_selectId_value[] = $RES_alt_progress ;
		}
	}
	
	if( $RES_groupKey_selectId_value === NULL )
		return NULL ;
		
	$RES_groupKey_groupDesc = $_groups_hashes ;
	if( $debug ) {
		echo "OK\n" ;
	}
	
	
	if( $debug ) {
		echo "Debug 5: labels + titles" ;
	}
	$RES_labels = paracrm_queries_process_labels( $arr_saisie ) ;
	
	$tmp_treeviewGroups = $tmp_yGroups = array() ;
	$RES_titles = array() ;
	$RES_titles['fields_group'] = array() ;
	foreach( $arr_saisie['fields_group'] as $field_id => &$field_group )
	{
		// tagId for group : unique identifier for this group inwithin query groups
		$group_tagId = $field_group['field_code'] ;
		if( $field_group['field_type'] == 'link' ) {
			$group_tagId.= '%'.$field_group['group_bible_type'] ;
			if( $field_group['group_bible_type'] == 'TREE' ) {
				$group_tagId.= '%'.$field_group['group_bible_tree_depth'] ;
			}
		}
		$RES_titles['group_tagId'][$field_id] = $group_tagId ;
	
		$RES_titles['group_title'][$field_id] = $arr_indexed_treefields[$field_group['field_code']]['text'] ;
		
		$RES_titles['group_fields'][$field_id] = array() ;
		if( $field_group['group_bible_display_arrFields'] ) {
		foreach( $field_group['group_bible_display_arrFields'] as $display_field_key => $display_field_arrDesc )
		{
			$tfield = $display_field_arrDesc['tfield'] ;
			$depth = $display_field_arrDesc['bible_tree_depth'] ;
			
			$txt = '' ;
			if( $depth ) {
				$txt.= '('."n.".$depth.')' ;
			}
			$txt.= $arr_indexed_treefields[$tfield]['text'] ;
			
			$RES_titles['group_fields'][$field_id][$display_field_key] = $txt ;
		}
		}
		
		if( $field_group['group_bible_type'] == 'TREEVIEW' || $field_group['display_geometry'] == 'grid-y' ) {
			$tmp_yGroups[] = $field_id ;
			if( $field_group['group_bible_type'] == 'TREEVIEW' ) {
				$tmp_treeviewGroups[] = $field_id ;
			}
		}
	}
	if( count($tmp_treeviewGroups) == 1 && count($tmp_yGroups) == 1 ) {
		// Ok for actual treeview
		$RES_titles['cfg_doTreeview'] = TRUE ;
	}
	$RES_selectId_nullValue = array() ;
	$RES_selectId_round = array() ;
	$RES_titles['fields_select'] = array() ;
	foreach( $arr_saisie['fields_select'] as $select_id => &$field_select ) {
		$RES_titles['fields_select'][$select_id] = $field_select['select_lib'] ;
		$RES_selectId_nullValue[$select_id] = $field_select['null_value'] ;
		$RES_selectId_round[$select_id] = $field_select['math_round'] ;
	}
	unset($field_select) ;
	
	if( $debug ) {
		echo "OK\n" ;
	}
	
	
	if( $debug ) {
		echo "Debug 99: tableaux compat selectId=0" ;
	}
	$field_select_0 = $arr_saisie['fields_select'][0] ;
	$RES_select0_groupKey_value = array() ;
	foreach( $RES_groupKey_selectId_value as $groupKey => $ttmp ) {
		$value = $ttmp[0] ;
		$RES_select0_groupKey_value[$groupKey] = $value ;
	}
	$RES_progress_0 = array() ;
	foreach( $RES_progress_groupKey_selectId_value as $ttmp ) {
		$subRes_thisProgress = array() ;
		foreach( $ttmp as $groupKey => $ttmp1 ) {
			$value = $ttmp1[0] ;
			$subRes_thisProgress[$groupKey] = $value ;
		}
		$RES_progress_0[] = $subRes_thisProgress ;
	}
	if( $debug ) {
		echo "OK\n" ;
	}
	
	
	/*
	* Extrapolate : 
	* Send parameters + results(map + values) to extrapolate processing "filter"
	* TODO: cleaner ?
	*/
	$RES_groupKey_isExtrapolate = paracrm_queries_process_extrapolate( $arr_saisie, $RES_groupKey_groupDesc, $RES_groupKey_selectId_value, $RES_selectId_nullValue ) ;
	
	
	return array('RES_groupKey_groupDesc'=>$RES_groupKey_groupDesc,
					'RES_groupKey_selectId_value'=>$RES_groupKey_selectId_value,
					'RES_groupKey_value'=>$RES_select0_groupKey_value,
					'RES_labels'=>$RES_labels,
					'RES_titles'=>$RES_titles,
					'RES_selectId_nullValue'=>$RES_selectId_nullValue,
					'RES_nullValue'=>$field_select_0['null_value'],
					'RES_selectId_round'=>$RES_selectId_round,
					'RES_round'=>$field_select_0['math_round'],
					'RES_progress_groupKey_selectId_value'=>$RES_progress_groupKey_selectId_value,
					'RES_progress'=>$RES_progress_0,
					'RES_groupKey_isExtrapolate'=>$RES_groupKey_isExtrapolate) ;
}
function paracrm_queries_process_query_debugForceValue( &$RES_groupKey_selectId_value, $fields_where ) {
	// 2014-06: queryWhere forcevalue
	$_debug_forceValue = NULL ;
	foreach( $fields_where as $field_where ) {
		if( $field_where['field_type'] == 'forcevalue' && $field_where['condition_forcevalue_isset'] ) {
			$_debug_forceValue = $field_where['condition_forcevalue_value'] ;
		}
	}
	if( !($_debug_forceValue===NULL) ) {
		foreach( $RES_groupKey_selectId_value as &$subRes_selectId_value ) {
			foreach( $subRes_selectId_value as &$value ) {
				$value = $_debug_forceValue ;
			}
			unset($value) ;
		}
		unset($subRes_selectId_value) ;
	}
}
function paracrm_queries_process_query_iteration( $arr_saisie )
{
	global $_opDB ;
	
	// **** IMPORTANT ! *****
	// => remise à zéro du cache WHERE
	$GLOBALS['cache_queryWhereUnique'] = array() ;

	
	// Mode de calcul COUNT / VALUE
	$doCount = $doValue = FALSE ;
	foreach( $arr_saisie['fields_select'] as $select_id => &$dummy ) {
		switch( $arr_saisie['fields_select'][$select_id]['iteration_mode'] ) {
			case 'count' :
				$doCount = TRUE ;
				break ;
			case 'value' :
				$doValue = TRUE ;
				break ;
		}
	}
	
	if( $doValue && !$doCount ) {
		// new 14-05-22 : mode exclusif VALUES
		// - mode linéaire ie. pas de chaine d'itération parent>child
		// => 1 seule requête SQL
		if( $RES_groupKeyId_selectId_value = paracrm_queries_process_query_onePassValuesFast( $arr_saisie ) ) {
			return $RES_groupKeyId_selectId_value ;
		}
		if( $RES_groupKeyId_selectId_value = paracrm_queries_process_query_onePassValues( $arr_saisie ) ) {
			return $RES_groupKeyId_selectId_value ;
		}
	} 
	
	
	
	
	// mode classique 2012
	// - chaine d'iteration parent > child
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
	
	$RES_selectId_group_arr_arrSymbolValue = paracrm_queries_process_query_iterationDo( $arr_saisie, $arr_chain, 0, array(), NULL, NULL ) ;
	
	
	//$RES_group_value = array() ; // return value @OBSOLETE
	$RES_group_selectId_value = array() ;
	
	foreach( $arr_saisie['fields_select'] as $select_id => $field_select ) {
	
		$RES_group_arr_arrSymbolValue = $RES_selectId_group_arr_arrSymbolValue[$select_id] ;
		if( !$RES_group_arr_arrSymbolValue ) {
			continue ;
		}
	
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
						
						@eval( '$val = ('.$eval_string.') ;' ) ;
						if( $val===FALSE ) {
							continue ;
						}
					}
					else
					{
						$val = current($arr_symbolId_value) ;
					}
					
					$RES_group_selectId_value[$group_key_id][$select_id] = $val ;
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
							
							@eval( '$val = ('.$eval_string.') ;' ) ;
							if( $val===FALSE ) {
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
					
					$RES_group_selectId_value[$group_key_id][$select_id] = $val ;
				}
				break ;
		}
	}
	return $RES_group_selectId_value ;
}

function paracrm_queries_process_query_onePassValues( $arr_saisie ) {
	global $_opDB ;
	global $arr_bible_trees , $arr_bible_entries, $arr_bible_treenodes ;
	
	// Prep Tabs resultat vide
	foreach( $arr_saisie['fields_select'] as $select_id => $dummy ) {
		$resOUT_selectId_groupKeyId[$select_id] = array() ;
		$resIN_selectId_groupKeyIds_symbolId[$select_id] = array() ;
	}
	
	// Construction de la requête :
	$target_file_code = $arr_saisie['target_file_code'] ;
	
	$t_sqlView = "view_file_{$target_file_code}" ;
	$t_sqlViewFields = $_opDB->table_fields( $t_sqlView ) ;
	$sqlQ_select = "SELECT t0.*" ;
	$sqlQ_from = "FROM {$t_sqlView} t0" ;
	$sqlQ_orderReverse = array("t0.filerecord_id DESC") ;
	$selectMap = array() ;
	$selectMap[$target_file_code] = array(
		'file_code' => $target_file_code ,
		'select_offset' => 0 ,
		'sql_prefix' => 't0' ,
		'sql_fields' => $t_sqlViewFields
	);
	$next_offset = count($t_sqlViewFields) ;
	$previousIdx = 0 ;
	$previousFilecode = $target_file_code ;
	while(TRUE) {
		$query = "SELECT file_parent_code FROM define_file WHERE file_code='$previousFilecode'" ;
		if( !($parent_fileCode = $_opDB->query_uniqueValue($query)) ) {
			break ;
		}
		$parentIdx = $previousIdx + 1 ;
		
		$t_sqlView = "view_file_{$parent_fileCode}" ;
		$t_sqlViewFields = $_opDB->table_fields( $t_sqlView ) ;
		
		$sqlQ_select.= ",t{$parentIdx}.*" ;
		$sqlQ_from.= " "."JOIN {$t_sqlView} t{$parentIdx} ON t{$parentIdx}.filerecord_id = t{$previousIdx}.filerecord_parent_id" ;
		$sqlQ_orderReverse[] = "t{$parentIdx}.filerecord_id" ;
		$selectMap[$parent_fileCode] = array(
			'file_code' => $parent_fileCode ,
			'select_offset' => $next_offset ,
			'sql_prefix' => "t{$parentIdx}" ,
			'sql_fields' => $t_sqlViewFields
		);
		$next_offset += count($t_sqlViewFields) ;
		
		$previousIdx = $parentIdx ;
		$previousFilecode = $parent_fileCode ;
	}
	
	$arr_fileCodes_reverse = array() ;
	$query = $sqlQ_select." ".$sqlQ_from." WHERE 1" ;
	foreach( $selectMap as $tTable ) {
		$query.= paracrm_queries_process_queryHelp_getWhereSqlPrefilter( $tTable['file_code'], $arr_saisie['fields_where'], $tTable['sql_prefix'] ) ;
		$arr_fileCodes_reverse[] = $tTable['file_code'] ;
	}
	$query.= " ORDER BY ".implode(',',array_reverse($sqlQ_orderReverse)) ;
	$selectMap_onOrder = array_reverse($selectMap,true) ;
	
	
	
	
	$result = $_opDB->query($query) ;
	
	$_map_groupKey_resCount = array() ;
	
	$iter_fileCode_recordId = array() ;
	$iter_fileCode_whereBoolean = array() ;
	$row_group = array() ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		foreach( $selectMap_onOrder as $file_code => $tTable ) {
			$current_filerecordId = $arr[$tTable['select_offset']] ;
			if( $current_filerecordId != $iter_fileCode_recordId[$file_code] ) {
				$subRow = array() ;
				$offset = $tTable['select_offset'] ;
				foreach( $tTable['sql_fields'] as $sql_field ) {
					$subRow[$sql_field] = $arr[$offset] ;
					$offset++ ;
				}
				
				$row_group[$file_code] = $subRow ;
				$iter_fileCode_recordId[$file_code] = $current_filerecordId ;
				
				if( $arr_saisie['join_for_file'][$file_code] ) {
					paracrm_lib_file_joinQueryRecord($file_code,$row_group) ;
				}
				
				// application des conditions
				$base_row = array() ;
				$base_row[$file_code] = $row_group[$file_code] ;
				$iter_fileCode_whereBoolean[$file_code] = paracrm_queries_process_queryHelp_where( $base_row, $arr_saisie['fields_where'] ) ;
			}
			if( !$iter_fileCode_whereBoolean[$file_code] ) {
				continue 2 ;
			}
		}
		
		$arr_groupKeyId = paracrm_queries_process_queryHelp_group( $row_group, $arr_saisie['fields_group'] ) ;
		foreach( $arr_groupKeyId as $group_key_id ) {
			$_map_groupKey_resCount[$group_key_id]++ ;
		}
		
		foreach( $arr_saisie['fields_select'] as $select_id => $field_select ) {
			if( $field_select['iteration_mode'] != 'value' ) {
				continue ;
			}
			
			$subResIN_symbol_value = array() ;
			// iteration sur les symboles
			foreach( $field_select['math_expression'] as $symbol_id => $symbol )
			{
				if( $symbol['math_staticvalue'] != 0 )
					continue ;
			
				$file_code = $symbol['sql_file_code'] ;
				$file_field_code = $symbol['sql_file_field_code'] ;
				
				if( $symbol['sql_bible_code'] && $symbol['sql_bible_field_code'] ) {
					switch( $symbol['sql_linktype'] ) {
						case 'entry' :
						$entry_key = $row_group[$file_code][$file_field_code] ;
						$treenode_key = $arr_bible_entries[$symbol['sql_bible_code']][$entry_key]['treenode_key'] ;
						break ;
						
						case 'treenode' :
						$entry_key = NULL ;
						$treenode_key = $row_group[$file_code][$file_field_code] ;
						break ;
						
						default :
						$entry_key = $treenode_key = NULL ;
						break ;
					}
					// field of bible record
					$eval_value = NULL ;
					switch( $symbol['sql_bible_type'] ) {
						case 'tree' :
							$eval_value = $arr_bible_treenodes[$symbol['sql_bible_code']][$treenode_key][$symbol['sql_bible_field_code']] ;
							break ;
						case 'entry' :
							$eval_value = $arr_bible_entries[$symbol['sql_bible_code']][$entry_key][$symbol['sql_bible_field_code']] ;
							break ;
					}
					$subResIN_symbol_value[$symbol_id] = $eval_value ;
				}
				else {
					// field of cursor file record : standard
					$subResIN_symbol_value[$symbol_id] = $row_group[$file_code][$file_field_code] ;
				}
			}
			
			
			if( $field_select['math_func_mode'] == 'IN' ) {
				foreach( $arr_groupKeyId as $group_key_id ) {
					foreach( $subResIN_symbol_value as $symbol_id => $value ) {
						paracrm_queries_process_queryHelp_bankResValue( 
							$field_select['math_func_group'],
							$resIN_selectId_groupKeyIds_symbolId[$select_id][$group_key_id][$symbol_id],
							$value
						);
					}
				}
			} else {
				$subResOUT_value = paracrm_queries_process_queryHelp_evalMathExpression( $field_select['math_expression'], $subResIN_symbol_value ) ;
				if( $subResOUT_value===FALSE ) {
					continue ;
				}
				
				foreach( $arr_groupKeyId as $group_key_id ) {
					paracrm_queries_process_queryHelp_bankResValue( 
						$field_select['math_func_group'],
						$resOUT_selectId_groupKeyId[$select_id][$group_key_id],
						$subResOUT_value
					);
				}
			}
		}
	}
	
	
	$RES_groupKeyId_selectId_value = array() ;
	foreach( $arr_saisie['fields_select'] as $select_id => $field_select ) {
		if( $field_select['math_func_mode'] == 'IN' ) {
			foreach( $resIN_selectId_groupKeyIds_symbolId[$select_id] as $group_key_id => $subResIN_symbol_value ) {
				if( $field_select['math_func_group'] == 'AVG' ) {
					foreach( $subResIN_symbol_value as $symbol_id => $value ) {
						$subResIN_symbol_value[$symbol_id] = $value / $_map_groupKey_resCount[$group_key_id] ;
					}
				}
				$eval_value = paracrm_queries_process_queryHelp_evalMathExpression( $field_select['math_expression'], $subResIN_symbol_value ) ;
				if( !($eval_value===FALSE) ) {
					$RES_groupKeyId_selectId_value[$group_key_id][$select_id] = $eval_value ;
				}
			}
		} else {
			foreach( $resOUT_selectId_groupKeyId[$select_id] as $group_key_id => $subResOUT_value ) {
				switch( $field_select['math_func_group'] )
				{
					case 'AVG' :
						$RES_groupKeyId_selectId_value[$group_key_id][$select_id] = $subResOUT_value / $_map_groupKey_resCount[$group_key_id] ;
						break ;
					default :
						$RES_groupKeyId_selectId_value[$group_key_id][$select_id] = $subResOUT_value ;
						break ;
				}
			}
		}
	}
	
	return $RES_groupKeyId_selectId_value ;
}

function paracrm_queries_process_query_onePassValuesFast( $arr_saisie ) {
	// ****** Update 2015-10 : factorisation de la requête (SQL groupBy)
	// Conditions :
	//  - Sql prefilter exhaustif
	//  - pas de join
	//  - opération SUM sur un seul champ
	// Actions :
	//  => réécriture de $query
	//  => réécriture de $selectMap (présence des champs GROUP et SELECT uniquement)
	//  => introduction du count (pour $_map_groupKey_resCount)
	// Join map (to skip CRM joined field)
	
	
	foreach( $arr_saisie['join_for_file'] as $file_code => $doJoin ) {
		if( $doJoin ) {
			return FALSE ;
		}
	}
	foreach( $arr_saisie['fields_where'] as $where_id => $field_where ) {
		if( $field_where['sql_bible_code'] && $field_where['sql_bible_field_code'] ) {
			// Condition on linked bible inner-field => can't stat with SQL
			return FALSE ;
		}
		if( $field_where['field_type'] == 'link' && $field_where['condition_bible_mode'] == 'SINGLE' ) {
			// Can't use SQL group
			return FALSE ;
		}
	}
	foreach( $arr_saisie['fields_group'] as $group_id => $field_group ) {
		if( $field_group['field_type'] == 'link' && $field_group['group_bible_type'] != 'ENTRY' ) {
			return FALSE ;
		}
	}
	foreach( $arr_saisie['fields_select'] as $select_id => $field_select ) {
		if( $field_select['iteration_mode'] != 'value' ) {
			return FALSE ;
		}
		if( count($field_select['math_expression']) != 1 ) {
			return FALSE ;
		}
		$symbol = reset($field_select['math_expression']) ;
		if( $symbol['sql_bible_code'] && $symbol['sql_bible_field_code'] ) {
			return FALSE ;
		}
	}
	
	
	
	global $_opDB ;
	global $arr_bible_trees , $arr_bible_entries, $arr_bible_treenodes ;
	
	// Construction de la requête :
	$arr_groupId = $arr_selectId = array() ;
	$select_words = array() ;
	$group_words = array() ;
	foreach( $arr_saisie['fields_group'] as $group_id => $field_group ) {
		$sqlKey = $field_group['sql_file_code'].'.'.$field_group['sql_file_field_code'] ;
		$sqlAlias = 'g'.$group_id ;
		switch( $field_group['field_type'] ) {
			case 'date' :
				switch( $field_group['group_date_type'] ) {
					case 'DAY' :
					$select_words[] = 'DATE('.$sqlKey.') AS '.$sqlAlias ;
					break ;
				
					case 'MONTH' :
					$select_words[] = 'DATE_FORMAT('.$sqlKey.',\'%Y-%m\') AS '.$sqlAlias ;
					break ;
				
					case 'WEEK' :
					$select_words[] = 'DATE_FORMAT('.$sqlKey.',\'%x-%v\') AS '.$sqlAlias ;
					break ;
				
					case 'YEAR' :
					$select_words[] = 'YEAR('.$sqlKey.') AS '.$sqlAlias ;
					break ;
				
					default :
					$select_words[] = $sqlKey.' AS '.$sqlAlias ;
					break ;
				}
				break ;
				
			case 'link' :
				switch( $field_group['group_bible_type'] ) {
					case 'ENTRY' :
						$select_words[] = 'CONCAT(\'e_\','.$sqlKey.') AS '.$sqlAlias ;
						break ;
						
					default :
						return FALSE ;
				}
				break ;
				
			default :
				$select_words[] = $sqlKey.' AS '.$sqlAlias ;
				break ;
		}
		$group_words[] = $sqlAlias ;
		$arr_groupId[] = $group_id ;
	}
	foreach( $arr_saisie['fields_select'] as $select_id => $select_field ) {
		if( $field_select['iteration_mode'] != 'value' ) {
			return FALSE ;
		}
		if( count($field_select['math_expression']) != 1 ) {
			return FALSE ;
		}
		
		$symbol = reset($field_select['math_expression']) ;
		switch( strtoupper($field_select['math_func_group']) ) {
			case 'AGV' :
			case 'SUM' :
			case 'MAX' :
			case 'MIN' :
				$func = strtoupper($field_select['math_func_group']) ;
				break ;
				
			default :
				return FALSE ;			
		}
		
		$sqlKey = $symbol['sql_file_code'].'.'.$symbol['sql_file_field_code'] ;
		$sqlAlias = 's'.$select_id ;
		$select_words[] = $func.'('.$sqlKey.') AS '.$sqlAlias ;
		$arr_selectId[] = $select_id ;
	}
	
	
	$target_file_code = $arr_saisie['target_file_code'] ;
	$arr_fileCode = array();
	
	$t_sqlView = "view_file_{$target_file_code}" ;
	$t_fileCode = $target_file_code ;
	$sqlQ_select = "SELECT ".implode(',',$select_words) ;
	$sqlQ_from = "FROM {$t_sqlView} {$target_file_code}" ;
	while(TRUE) {
		$arr_fileCode[] = $t_fileCode ;
		$query = "SELECT file_parent_code FROM define_file WHERE file_code='$t_fileCode'" ;
		if( !($parent_fileCode = $_opDB->query_uniqueValue($query)) ) {
			break ;
		}
		
		$t_fileCodePrevious = $t_fileCode ;
		$t_sqlViewPrevious = $t_sqlView ;
		$t_fileCode = $parent_fileCode ;
		$t_sqlView = "view_file_{$t_fileCode}" ;
		
		$sqlQ_from.= " "."JOIN {$t_sqlView} {$t_fileCode} ON {$t_fileCode}.filerecord_id = {$t_fileCodePrevious}.filerecord_parent_id" ;
	}
	
	$query = $sqlQ_select." ".$sqlQ_from." WHERE 1" ;
	foreach( $arr_fileCode as $file_code ) {
		$query.= paracrm_queries_process_queryHelp_getWhereSqlPrefilter( $file_code, $arr_saisie['fields_where'], $file_code ) ;
	}
	$query.= " GROUP BY ".implode(',',$group_words) ;
	
	// echo $query ;
	
	$result = $_opDB->query($query) ;
	
	$RES_groupKeyId_selectId_value = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$group_hash = array() ;
		foreach( $arr_groupId as $group_id ) {
			$group_hash[$group_id] = $arr['g'.$group_id] ;
		}
		$group_key_id = paracrm_queries_process_queryHelp_getIdGroup($group_hash) ;
		
		$arr_selectId_value = array() ;
		foreach( $arr_selectId as $select_id ) {
			$arr_selectId_value[$select_id] = $arr['s'.$select_id] ;
		}
		
		$RES_groupKeyId_selectId_value[$group_key_id] = $arr_selectId_value ;
	}
	return $RES_groupKeyId_selectId_value ;
}

function paracrm_queries_process_query_iterationDo( $arr_saisie, $iteration_chain, $iteration_chain_offset, $base_row, $parent_fileCode, $parent_filerecordId )
{
	global $_opDB ;

	if( $iteration_chain_offset >= count($iteration_chain) - 1 )
	{
		$target_fileCode = $iteration_chain[$iteration_chain_offset] ;
		
		$RES_selectId_group_arr_arrSymbolValue = array() ;
		$doCount = $doValue = FALSE ;
		foreach( $arr_saisie['fields_select'] as $select_id => $dummy ) {
			switch( $arr_saisie['fields_select'][$select_id]['iteration_mode'] ) {
				case 'count' :
					$doCount = TRUE ;
					break ;
				case 'value' :
					$doValue = TRUE ;
					break ;
			}
			
			$RES_selectId_group_arr_arrSymbolValue[$select_id] = array() ;
		}
		
		if( $doCount ) {
			$ttmp = paracrm_queries_process_query_doCount( $arr_saisie, $target_fileCode, $base_row, $parent_fileCode, $parent_filerecordId ) ;
			$RES_selectId_group_arr_arrSymbolValue = $ttmp + $RES_selectId_group_arr_arrSymbolValue ;
		}
		if( $doValue ) {
			$ttmp = paracrm_queries_process_query_doValue( $arr_saisie, $target_fileCode, $base_row, $parent_fileCode, $parent_filerecordId ) ;
			$RES_selectId_group_arr_arrSymbolValue = $ttmp + $RES_selectId_group_arr_arrSymbolValue ;
		}
		
		return $RES_selectId_group_arr_arrSymbolValue ;
	}
	
	
	$RES_selectId_group_arr_arrSymbolValue = array() ;
	foreach( $arr_saisie['fields_select'] as $select_id => &$dummy ) {
		$RES_selectId_group_arr_arrSymbolValue[$select_id] = array() ;
	}
	unset($dummy) ;
	
	$target_fileCode = $iteration_chain[$iteration_chain_offset] ;
	$view_filecode = 'view_file_'.$target_fileCode ;
	$query = "SELECT * FROM $view_filecode WHERE 1 ".paracrm_queries_process_queryHelp_getWhereSqlPrefilter($target_fileCode, $arr_saisie['fields_where'])."ORDER BY filerecord_id DESC" ;
	$result = $_opDB->query($query);
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$row = array() ;
		$row[$target_fileCode] = $arr ;
		if( $arr_saisie['join_for_file'][$target_fileCode] ) {
			paracrm_lib_file_joinQueryRecord($target_fileCode,$row) ;
		}
		
		// application des conditions
		if( !paracrm_queries_process_queryHelp_where( $row, $arr_saisie['fields_where'] ) )
			continue ;
			
		$row = $base_row ;
		$row[$target_fileCode] = $arr ;
			

		$subRes_selectId_group_arrSymbolValue = paracrm_queries_process_query_iterationDo($arr_saisie,$iteration_chain, $iteration_chain_offset+1,$row,$target_fileCode,$arr['filerecord_id']) ;
		foreach( $subRes_selectId_group_arrSymbolValue as $select_id => $subRes_group_arrSymbolValue ) {
			if( !is_array($RES_selectId_group_arr_arrSymbolValue[$select_id]) ) {
				$RES_selectId_group_arr_arrSymbolValue[$select_id] = array() ;
			}
			foreach( $subRes_group_arrSymbolValue as $group_key_id => $arr_arrSymbolValue )
			{
				if( !is_array($RES_selectId_group_arr_arrSymbolValue[$select_id][$group_key_id]) )
					$RES_selectId_group_arr_arrSymbolValue[$select_id][$group_key_id] = array() ;
				
				foreach( $arr_arrSymbolValue as $arrSymbolValue ) {
					$RES_selectId_group_arr_arrSymbolValue[$select_id][$group_key_id][] = $arrSymbolValue ;
				}
			}
		}
		// print_r($row) ;
		$c++ ;
	}
	return $RES_selectId_group_arr_arrSymbolValue ;
}




function paracrm_queries_process_query_doValue( $arr_saisie, $target_fileCode, $base_row, $parent_fileCode, $parent_filerecordId )
{
	global $_opDB ;
	global $arr_bible_trees , $arr_bible_entries, $arr_bible_treenodes ;
	
	// $subRes_group_arr_arrSymbolValue = array() ; // return value @OBSOLETE
	$subRes_selectId_group_arr_arrSymbolValue = array() ; // return value
	
	// iteration principale
	$view_filecode = 'view_file_'.$target_fileCode ;
	$query2 = "SELECT * FROM $view_filecode WHERE filerecord_parent_id='{$parent_filerecordId}'".paracrm_queries_process_queryHelp_getWhereSqlPrefilter($target_fileCode, $arr_saisie['fields_where'])." ORDER BY filerecord_id DESC" ;
	$result2 = $_opDB->query($query2);
	while( ($arr2 = $_opDB->fetch_assoc($result2)) != FALSE )
	{
		$row_group = array() ;
		$row_group = $base_row ;
		$row_group[$target_fileCode] = $arr2 ;
		if( $arr_saisie['join_for_file'][$target_fileCode] ) {
			paracrm_lib_file_joinQueryRecord($target_fileCode,$row_group) ;
		}
		
		// application des conditions
		$row_child = array() ;
		$row_child[$target_fileCode] = $row_group[$target_fileCode] ;
		if( !paracrm_queries_process_queryHelp_where( $row_child, $arr_saisie['fields_where'] ) )
			continue ;
		
		$arr_groupKeyId = paracrm_queries_process_queryHelp_group( $row_group, $arr_saisie['fields_group'] ) ;
		
		foreach( $arr_saisie['fields_select'] as $select_id => $field_select ) {
			if( $field_select['iteration_mode'] != 'value' ) {
				continue ;
			}
			
			$subRES_group_symbol_value = array() ;
			// iteration sur les symboles
			foreach( $field_select['math_expression'] as $symbol_id => $symbol )
			{
				if( $symbol['math_staticvalue'] != 0 )
					continue ;
			
				$file_code = $symbol['sql_file_code'] ;
				$file_field_code = $symbol['sql_file_field_code'] ;
				
				if( $symbol['sql_bible_code'] && $symbol['sql_bible_field_code'] ) {
					switch( $symbol['sql_linktype'] ) {
						case 'entry' :
						$entry_key = $row_group[$file_code][$file_field_code] ;
						$treenode_key = $arr_bible_entries[$symbol['sql_bible_code']][$entry_key]['treenode_key'] ;
						break ;
						
						case 'treenode' :
						$entry_key = NULL ;
						$treenode_key = $row_group[$file_code][$file_field_code] ;
						break ;
						
						default :
						$entry_key = $treenode_key = NULL ;
						break ;
					}
					// field of bible record
					$eval_value = NULL ;
					switch( $symbol['sql_bible_type'] ) {
						case 'tree' :
							$eval_value = $arr_bible_treenodes[$symbol['sql_bible_code']][$treenode_key][$symbol['sql_bible_field_code']] ;
							break ;
						case 'entry' :
							$eval_value = $arr_bible_entries[$symbol['sql_bible_code']][$entry_key][$symbol['sql_bible_field_code']] ;
							break ;
					}
					foreach( $arr_groupKeyId as $group_key_id ) {
						$subRES_group_symbol_value[$group_key_id][$symbol_id] = $eval_value ;
					}
				}
				else {
					// field of cursor file record : standard
					foreach( $arr_groupKeyId as $group_key_id ) {
						$subRES_group_symbol_value[$group_key_id][$symbol_id] = $row_group[$file_code][$file_field_code] ;
					}
				}
			}
			
			foreach( $subRES_group_symbol_value as $group_key_id => $subSubRES_symbol_value )
			{
				/* En mode VALUE :
					Pour chaque groupe on retourne plusieurs valeurs (principe de l'empilage valeurs)
					l'opération est effectuée une seule fois par groupe à la fin
				*/
				if( !isset($subRes_selectId_group_arr_arrSymbolValue[$select_id][$group_key_id]) )
					$subRes_selectId_group_arr_arrSymbolValue[$select_id][$group_key_id] = array() ;
				$subRes_selectId_group_arr_arrSymbolValue[$select_id][$group_key_id][] = $subSubRES_symbol_value ;
			}
		}
	}
	
	return $subRes_selectId_group_arr_arrSymbolValue ;
}

function paracrm_queries_process_query_doCount( $arr_saisie, $target_fileCode, $base_row, $parent_fileCode, $parent_filerecordId )
{
	global $_opDB ;
	global $arr_bible_trees , $arr_bible_entries ;
	
	
	// $subRes_group_arr_arrSymbolValue = array() ; // return value @OBSOLETE
	$subRes_selectId_group_arr_arrSymbolValue = array() ; // return value
	
	foreach( $arr_saisie['fields_select'] as $select_id => $field_select ) {
		if( $field_select['iteration_mode'] != 'count' ) {
			continue ;
		}
		
		$subRES_group_symbol_value = array() ;
		// subiteration sur les symboles
		foreach( $field_select['math_expression'] as $symbol_id => $symbol )
		{
			if( $symbol['math_staticvalue'] != 0 )
				continue ;
				
				
				
			if( $symbol['sql_file_code'] == $parent_fileCode )
			{
				$arr_groupKeyId = paracrm_queries_process_queryHelp_group( $base_row, $arr_saisie['fields_group'] ) ;
				foreach( $arr_groupKeyId as $group_key_id ) {
					$subRES_group_symbol_value[$group_key_id][$symbol_id] = 1 ;
				}
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
					
					// application des conditions
					$row_test = array() ;
					$row_test[$symbol['sql_file_code']][$mkey] = $bible_record['entry_key'] ;
					if( !paracrm_queries_process_queryHelp_where( $row_test, $arr_saisie['fields_where'] ) )
						continue ;
					
					$arr_groupKeyId = paracrm_queries_process_queryHelp_group( $row_pivot, $arr_saisie['fields_group'] ) ;
					foreach( $arr_groupKeyId as $group_key_id ) {
						$subRES_group_symbol_value[$group_key_id][$symbol_id]++ ;
					}
				}
				
				continue ;
			}
			
			if( $symbol['sql_file_code'] == $target_fileCode && !$symbol['sql_file_field_code'] )
			{
				// iteration principale
				$view_filecode = 'view_file_'.$target_fileCode ;
				$query2 = "SELECT * FROM $view_filecode WHERE filerecord_parent_id='{$parent_filerecordId}'".paracrm_queries_process_queryHelp_getWhereSqlPrefilter($target_fileCode, $arr_saisie['fields_where'])." ORDER BY filerecord_id DESC" ;
				$result2 = $_opDB->query($query2);
				while( ($arr2 = $_opDB->fetch_assoc($result2)) != FALSE )
				{
					$row_group = array() ;
					$row_group = $base_row ;
					$row_group[$target_fileCode] = $arr2 ;
					if( $arr_saisie['join_for_file'][$target_fileCode] ) {
						paracrm_lib_file_joinQueryRecord($target_fileCode,$row_group) ;
					}
					
					// application des conditions
					$row_child = array() ;
					$row_child[$target_fileCode] = $row_group[$target_fileCode] ;
					if( !paracrm_queries_process_queryHelp_where( $row_child, $arr_saisie['fields_where'] ) )
						continue ;
				
					
					//print_r($row_group) ;
				
					$arr_groupKeyId = paracrm_queries_process_queryHelp_group( $row_group, $arr_saisie['fields_group'] ) ;
					foreach( $arr_groupKeyId as $group_key_id ) {
						$subRES_group_symbol_value[$group_key_id][$symbol_id]++ ;
					}
				}
				continue ;
			}
		}
		
		
		
		$subRes_group_arr_arrSymbolValue = array() ;
		foreach( $subRES_group_symbol_value as $group_key_id => $subSubRES_symbol_value )
		{
			// *** Mode COUNT ****
			// *** Pour chaque groupe on ne retourne qu'un seul map symbole>valeur => principe du comptage sur une itération
			$subRes_group_arr_arrSymbolValue[$group_key_id] = array() ;
			$subRes_group_arr_arrSymbolValue[$group_key_id][] = $subSubRES_symbol_value ;
		}
		
		$subRes_selectId_group_arr_arrSymbolValue[$select_id] = $subRes_group_arr_arrSymbolValue ;
	}
	
	return $subRes_selectId_group_arr_arrSymbolValue ;
}

function paracrm_queries_process_queryHelp_evalMathExpression( $math_expression, $arr_symbolId_value ) {
	if( count($math_expression) == 1 && count($arr_symbolId_value) == 1 ) {
		return reset($arr_symbolId_value) ;
	}
	$eval_expression = '' ;
	foreach( $math_expression as $symbol_id => $symbol )
	{
		$eval_expression.= $symbol['math_operation'] ;
		
		if( $symbol['math_parenthese_in'] )
			$eval_expression.= '(' ;
			
		if( $symbol['math_staticvalue'] != 0 )
			$value = (float)($symbol['math_staticvalue']) ;
		elseif( isset($arr_symbolId_value[$symbol_id]) )
			$value = $arr_symbolId_value[$symbol_id] ;
		else
			$value = 0 ;
		$eval_expression.= $value ;
		
		if( $symbol['math_parenthese_out'] )
			$eval_expression.= ')' ;
	}
	@eval( '$eval_value = ('.$eval_expression.') ;' ) ;
	return $eval_value ;
}
function paracrm_queries_process_queryHelp_bankResValue( $math_func, &$sum_value, $new_value ) {
	switch( $math_func ) {
		case 'AVG' :
		case 'SUM' :
			$sum_value += $new_value ;
			break ;
		
		case 'MIN':
		case 'MAX':
			if( $sum_value === NULL ) {
				$sum_value = $new_value ;
			} else {
				if( $math_func == 'MIN' ) {
					$sum_value = min($sum_value,$new_value) ;
				}
				if( $math_func == 'MAX' ) {
					$sum_value = max($sum_value,$new_value) ;
				}
			}
			break ;
		
		default :
			$sum_value = NULL ;
			break ;
	}
}

function paracrm_queries_process_queryHelp_getWhereSqlPrefilter( $target_fileCode, $fields_where, $sqlTableAlias=NULL ) {
	$sqlPrefix = '' ;
	if( $sqlTableAlias ) {
		$sqlPrefix = $sqlTableAlias."." ;
	}
	
	// Join map (to skip CRM joined field)
	$jMap = paracrm_lib_file_joinPrivate_getMap( $target_fileCode ) ;
	
	$where_clause = "" ;
	foreach( $fields_where as $where_id => $field_where )
	{
		$file_code = $field_where['sql_file_code'] ;
		$file_field_code = substr($field_where['sql_file_field_code'],6) ;
		$sql_file_field_code = $field_where['sql_file_field_code'] ;
		if( $file_code != $target_fileCode ) {
			continue ;
		}
		if( isset($jMap[$file_field_code]) ) {
			// Condition on CRM joined field => can't stat with SQL, will filter later
			continue ;
		}
		if( $field_where['sql_bible_code'] && $field_where['sql_bible_field_code'] ) {
			// Condition on linked bible inner-field => can't stat with SQL
			continue ;
		}
		
		switch( $field_where['field_type'] ) {
			case 'link' :
			if( $field_where['condition_bible_mode'] != 'SELECT' ) {
				break ;
			}
			if( !$field_where['sql_arr_select'] || !$field_where['sql_bible_code'] ) {
				break ;
			}
			$sql_list_select = $GLOBALS['_opDB']->makeSQLlist($field_where['sql_arr_select']) ;
			switch( $field_where['condition_bible_store'] ) {
				case 'tree' :
					switch( $field_where['sql_linktype'] ) {
						case 'treenode' :
							$where_clause.= " AND {$sqlPrefix}{$sql_file_field_code} IN {$sql_list_select}" ;
							break ;
						case 'entry' :
							$t_view_entry = "view_bible_{$field_where['sql_bible_code']}_entry" ;
							$t_inside_query = "SELECT entry_key FROM {$t_view_entry} WHERE treenode_key IN {$sql_list_select}" ;
							if( $GLOBALS['debug_evalSqlInnerQueries'] ) {
								$where_clause.= " AND {$sqlPrefix}{$sql_file_field_code} IN ".$GLOBALS['_opDB']->query_makeSQLlist($t_inside_query) ;
							} else {
								$where_clause.= " AND {$sqlPrefix}{$sql_file_field_code} IN ($t_inside_query)" ;
							}
							break ;
					}
					break ;
				case 'entry' :
					switch( $field_where['sql_linktype'] ) {
						case 'entry' :
							$where_clause.= " AND {$sqlPrefix}{$sql_file_field_code} IN {$sql_list_select}" ;
							break ;
					}
					break ;
				default ;
					break ;
			}
			break ;
		
			case 'date' :
			if( $field_where['condition_date_gt'] != '' )
			{
				$where_clause.= " AND DATE({$sqlPrefix}{$sql_file_field_code}) >= '{$field_where['condition_date_gt']}'" ;
			}
			if( $field_where['condition_date_lt'] != '' )
			{
				$where_clause.= " AND DATE({$sqlPrefix}{$sql_file_field_code}) <= '{$field_where['condition_date_lt']}'" ;
			}
			break ;
			
			case 'bool' :
			switch( $field_where['condition_bool'] ) {
				case 'true' :
					$where_clause.= " AND {$sqlPrefix}{$sql_file_field_code} = '1'" ;
					break ;
				case 'false' :
					$where_clause.= " AND {$sqlPrefix}{$sql_file_field_code} = '0'" ;
					break ;
				default :
					break ;
			}
			break ;
			
			case 'string' :
			if( substr($field_where['condition_string'],0,2) == '!(' && substr($field_where['condition_string'],-1,1)==')' ) {
				// inverse mode
				$arr_values = array() ;
				foreach( explode(',',substr($field_where['condition_string'],2,strlen($field_where['condition_string'])-3)) as $test_string ) {
					$arr_values[] = $GLOBALS['_opDB']->escape_string($test_string) ;
				}
				if( $arr_values ) {
					$where_clause.= " AND {$sqlPrefix}{$sql_file_field_code} NOT IN ".$GLOBALS['_opDB']->makeSQLlist($arr_values) ;
				}
			} else {
				$arr_values = array() ;
				foreach( explode(',',$field_where['condition_string']) as $test_string ) {
					$arr_values[] = $GLOBALS['_opDB']->escape_string($test_string) ;
				}
				if( $arr_values ) {
					$where_clause.= " AND {$sqlPrefix}{$sql_file_field_code} IN ".$GLOBALS['_opDB']->makeSQLlist($arr_values) ;
				}
			}
			break ;
			
			case 'number' :
			if( $field_where['condition_num_gt'] != '' )
			{
				$where_clause.= " AND {$sqlPrefix}{$sql_file_field_code} >= '{$field_where['condition_num_gt']}'" ;
			}

			if( $field_where['condition_num_lt'] != '' )
			{
				$where_clause.= " AND {$sqlPrefix}{$sql_file_field_code} <= '{$field_where['condition_num_lt']}'" ;
			}
			break ;
		}
	}
	return $where_clause ;
}

function paracrm_queries_process_queryHelp_where( $record_file, $fields_where ) // ** les fields where doivent etre prémachés pour les bibles !!!
{
	global $arr_bible_trees , $arr_bible_entries , $arr_bible_treenodes ;
	
	// global 
	if( !is_array($GLOBALS['cache_queryWhereUnique']) )
		$GLOBALS['cache_queryWhereUnique'] = array() ;
	
	$unique_evals = NULL ;
	foreach( $fields_where as $where_id => $field_where )
	{
		$file_code = $field_where['sql_file_code'] ;
		$file_field_code = $field_where['sql_file_field_code'] ;
		
		if( $field_where['field_type'] == 'file' && isset($record_file[$file_code]) ) {
			if( !in_array($record_file[$file_code]['filerecord_id'],$field_where['sql_arr_select']) ) {
				return FALSE ;
			}
		}
		
		if( !isset($record_file[$file_code][$file_field_code]) )
			continue ;
		$eval_value = $record_file[$file_code][$file_field_code] ;
		if( $field_where['sql_bible_code'] && $field_where['sql_bible_field_code'] ) {
			switch( $field_where['sql_linktype'] ) {
				case 'entry' :
				$entry_key = $eval_value ;
				$treenode_key = $arr_bible_entries[$field_where['sql_bible_code']][$eval_value]['treenode_key'] ;
				break ;
				
				case 'treenode' :
				$entry_key = NULL ;
				$treenode_key = $eval_value ;
				break ;
				
				default :
				$entry_key = $treenode_key = NULL ;
				break ;
			}
			switch( $field_where['sql_bible_type'] ) {
				case 'tree' :
					$eval_value = $arr_bible_treenodes[$field_where['sql_bible_code']][$treenode_key][$field_where['sql_bible_field_code']] ;
					break ;
				case 'entry' :
					$eval_value = $arr_bible_entries[$field_where['sql_bible_code']][$entry_key][$field_where['sql_bible_field_code']] ;
					break ;
			}
		}
	
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
					switch( $field_where['sql_linktype'] ) {
						case 'entry' :
						$eval_value_entry = $eval_value ;
						$eval_value_tree = $arr_bible_entries[$field_where['sql_bible_code']][$eval_value_entry]['treenode_key'] ;
						break ;
						
						case 'treenode' :
						$eval_value_entry = NULL ;
						$eval_value_tree = $eval_value ;
						break ;
						
						default :
						$eval_value_entry = $eval_value_tree = NULL ;
						break ;
					}
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
			
			
			case 'string' :
			if( trim($field_where['condition_string']) ) {
				break ;
			}
			if( substr($field_where['condition_string'],0,2) == '!(' && substr($field_where['condition_string'],-1,1)==')' ) {
				// inverse mode
				$passed = TRUE ;
				foreach( explode(',',substr($field_where['condition_string'],2,strlen($field_where['condition_string'])-3)) as $test_string ) {
					if( $test_string == $eval_value ) {
						$passed = FALSE ;
					}
				}
			} else {
				$passed = FALSE ;
				foreach( explode(',',$field_where['condition_string']) as $test_string ) {
					if( $test_string == $eval_value ) {
						$passed = TRUE ;
					}
				}
			}
			if( !$passed ) {
				return FALSE ;
			}
			break ;
			
			
			case 'bool' :
			switch( $field_where['condition_bool'] ) {
				case 'true' :
					if( $eval_value != 1 ) {
						return FALSE ;
					}
					break ;
				case 'false' :
					if( $eval_value != 0 ) {
						return FALSE ;
					}
					break ;
				default :
					break ;
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
			// source value : treenode / entry
			$src_code = $field_group['sql_file_code'] ;
			$src_field = $field_group['sql_file_field_code'] ;
			$bible_code = $field_group['sql_bible_code'] ;
			switch( $field_group['sql_linktype'] ) {
				case 'entry' :
				$src_value_entry = $record_glob[$src_code][$src_field] ;
				$src_value_treenode = $GLOBALS['arr_bible_entries'][$bible_code][$src_value_entry]['treenode_key'] ;
				break ;
				
				case 'treenode' :
				$src_value_entry = NULL ;
				$src_value_treenode = $record_glob[$src_code][$src_field] ;
				break ;
				
				default :
				$src_value_entry = $src_value_treenode = NULL ;
				break ;
			}
			
			// déterminer la valeur
			if( $field_group['group_bible_type'] == 'TREEVIEW' )
			{
				$fieldgroup_values = array() ;
				
				if( $field_group['group_do_entries'] ) {
					$fieldgroup_values[] = 'e_'.$src_value_entry ;
				}
				
				$obj_tree = $arr_bible_trees[$field_group['sql_bible_code']] ;
				$obj_tree = $obj_tree->getTree($src_value_treenode) ;
				while( $obj_tree )
				{
					$fieldgroup_values[] = 't_'.$obj_tree->getHead() ;
					$obj_tree = $obj_tree->getParent() ;
				}
				
				$tab[$fieldgroup_id] = $fieldgroup_values ;
			}
			// déterminer la valeur
			if( $field_group['group_bible_type'] == 'ENTRY' )
			{
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
				
				$tab[$fieldgroup_id] = 'e_'.$group_value ;
			}
			// déterminer la valeur
			if( $field_group['group_bible_type'] == 'TREE' )
			{
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
					$tab[$fieldgroup_id] = 't_'.$group_value ;
				else
					$tab[$fieldgroup_id] = NULL ;
			}
		}
		if( $field_group['field_type'] == 'date' )
		{
			$src_code = $field_group['sql_file_code'] ;
			$src_field = $field_group['sql_file_field_code'] ;
			$date_value = $record_glob[$src_code][$src_field] ;
			if( $date_value=='0000-00-00 00:00:00' ) {
				// ERR : Non-relevant date => no group(s)
				return array() ;
			}
			switch( $field_group['group_date_type'] )
			{
				case 'DAY' :
				$group_value = date('Y-m-d',strtotime($date_value)) ;
				break ;
			
				case 'WEEK' :
				$group_value = date('o-W',strtotime($date_value)) ;
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
		if( $field_group['field_type'] == 'file' ) {
			$src_code = $field_group['sql_file_code'] ;
			$src_field = 'filerecord_id' ;
			$filerecord_id = $record_glob[$src_code][$src_field] ;
			$tab[$fieldgroup_id] = $filerecord_id ;
		}
	}
	
	// *** Multiplication du return_tab
	$return_tab = array() ;
	$return_tab[] = $tab ;
	foreach( $tab as $fieldgroup_id => $group_value ) {
		if( is_array($group_value) ) {
			$new_return_tab = array() ;
			foreach( $return_tab as $tab ) {
				foreach( $group_value as $group_value_single ) {
					$tab[$fieldgroup_id] = $group_value_single ;
					$new_return_tab[] = $tab ;
				}
			}
			$return_tab = $new_return_tab ;
		}
	}
	
	return $return_tab ;
}

function paracrm_queries_process_queryHelp_group( $record_glob, $fields_group )
{
	$arr_groupKeyId = array() ;
	foreach( paracrm_queries_process_queryHelp_getGroupHash( $record_glob, $fields_group ) as $group_hash ) {
		$group_key_id = paracrm_queries_process_queryHelp_getIdGroup($group_hash) ;
		$arr_groupKeyId[] = $group_key_id ;
	}
	return $arr_groupKeyId ;
}


function paracrm_queries_process_linearTreefields( $arr_node )
{
	$tab = array() ;
	
	if( $arr_node['field_code'] )
	{
		$row = array() ;
		$row['text'] = $arr_node['field_text'] ;
		$row['field_type'] = $arr_node['field_type'] ;
		if( isset($arr_node['field_linktype']) && isset($arr_node['field_linkbible']) ) {
			$row['field_linktype'] = $arr_node['field_linktype'] ;
			$row['field_linkbible'] = $arr_node['field_linkbible'] ;
		}
		foreach( array('file_code','file_field_code','bible_code','bible_type','bible_field_code','bible_field_iskey') as $mkey )
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
		
	$map_selectId_lib = array() ;
	foreach( $arr_saisie['fields_select'] as $selectId => $field_select ) {
		$map_selectId_lib[$selectId] = $field_select['select_lib'] ;
	}
		
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
				$tabBibleConditions[] = array('treenodes'=>$tarr) ;
			}
			if( $field_where['field_type'] == 'link'
				&& $field_where['field_code'] == $field_group_tab['field_code']
				&& $field_where['condition_bible_mode'] == 'SELECT' && $field_where['condition_bible_entries']
				&& (!isJsonArr($field_where['condition_bible_entries']) || json_decode($field_where['condition_bible_entries'],true)) )
			{
				if( !isJsonArr($field_where['condition_bible_entries']) ) {
					$entry_key = $field_where['condition_bible_entries'] ;
					$tabBibleConditions[] = array('entries'=>array($entry_key)) ;
				} elseif( count($entries = json_decode($field_where['condition_bible_entries'],true)) > 0 )  {
					$tabBibleConditions[] = array('entries'=>$entries) ;
				}
			}
		}
	foreach( paracrm_queries_process_labelEnum( $groupId_forTab, $field_group_tab, $tabBibleConditions ) as $bible_key => $cells_display )
	{
		$subRES_tab = array() ;
		$subRES_tab['map_selectId_lib'] = $map_selectId_lib ;
		$subRES_tab['group_id'] = $groupId_forTab ;
		$subRES_tab['group_key'] = $bible_key ;
		$subRES_tab['tab_title'] = implode(' - ',$cells_display) ;
	
		$subRES_tab['arr_grid-x'] = array() ;
		$subRES_tab['arr_grid-y'] = array() ;
		
		foreach( $fields_group as $group_id => $field_group )
		{
			if( $group_id == $groupId_forTab )
				continue ;
				
			// avant Enum => intro des foreignLinks
			$foreignLinks = array() ;
			// avant Enum => intro de la condition specifique
			$bibleConditions = array() ;
			$field_groupTab = $field_group_tab ;
			if( $field_groupTab['field_type'] == 'link' && $field_group['field_type'] == 'link' 
				&& $field_groupTab['field_code'] == $field_group['field_code']
				&& $field_groupTab['group_bible_type'] == 'TREE' )
			{
				$bible_key = substr($subRES_tab['group_key'],2) ; // groupKey for bible is <t>_<id>
				
				$tarr = array() ;
				$tarr[] = $bible_key ;
				$bibleConditions[] = array('treenodes'=>$tarr) ;
			
			}
			if( $field_groupTab['field_type'] == 'link' && $field_group['field_type'] == 'link' 
				&& $field_groupTab['field_linkbible'] != $field_group['field_linkbible'] )
			{
				switch( $field_groupTab['group_bible_type'] ) {
					case 'TREE' :
						$record_key = substr($subRES_tab['group_key'],2) ; // groupKey for bible is <t>_<id>
						$foreignLinks[$field_groupTab['field_linkbible']] = array('record_type'=>'treenode', 'record_key'=>$record_key) ;
						break ;
						
					case 'ENTRY' :
						$record_key = substr($subRES_tab['group_key'],2) ; // groupKey for bible is <e>_<id>
						$foreignLinks[$field_groupTab['field_linkbible']] = array('record_type'=>'entry', 'record_key'=>$record_key) ;
						break ;
				}
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
					$bibleConditions[] = array('treenodes'=>$tarr) ;
				}
				if( $field_where['field_type'] == 'link'
					&& $field_where['field_code'] == $field_group['field_code']
					&& $field_where['condition_bible_mode'] == 'SELECT' && $field_where['condition_bible_entries']
					&& (!isJsonArr($field_where['condition_bible_entries']) || json_decode($field_where['condition_bible_entries'],true)) )
				{
					if( !isJsonArr($field_where['condition_bible_entries']) ) {
						$entry_key = $field_where['condition_bible_entries'] ;
						$bibleConditions[] = array('entries'=>array($entry_key)) ;
					} elseif( count($entries = json_decode($field_where['condition_bible_entries'],true)) > 0 )  {
						$bibleConditions[] = array('entries'=>$entries) ;
					}
				}
				
				if( $field_where['field_type'] == 'link' && $field_group['field_type'] == 'link'
					&& $field_where['field_linkbible'] != $field_group['field_linkbible'] 
					&& $field_where['condition_bible_mode'] == 'SELECT' && $field_where['condition_bible_entries'] )
				{
					// TMP: pour la sélection des labels à énumerer, on fait appel aux conditions sur bible (foreignKey)
					// -uniquement- si l'entrée est unitaire
					// Ex : seulement les mags STORE du chef secteur SALES sélectionné
					if( !isJsonArr($field_where['condition_bible_entries']) ) {
						$entry_key = $field_where['condition_bible_entries'] ;
						$foreignLinks[$field_where['field_linkbible']] = array('record_type'=>'entry', 'record_key'=>$entry_key) ;
					} elseif( count($entries = json_decode($field_where['condition_bible_entries'],true)) == 1 )  {
						$foreignLinks[$field_where['field_linkbible']] = array('record_type'=>'entry', 'record_key'=>reset($entries)) ;
					}
				}
			}
			
			
			$subsub = paracrm_queries_process_labelEnum( $group_id, $field_group, $bibleConditions, $foreignLinks ) ;
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
	
		$map_selectId_lib = array() ;
		foreach( $arr_saisie['fields_select'] as $selectId => $field_select ) {
			$map_selectId_lib[$selectId] = $field_select['select_lib'] ;
		}
	
		$subRES_tab = array() ;
		$subRES_tab['map_selectId_lib'] = $map_selectId_lib ;
		
		$subRES_tab['tab_title'] = implode(' + ',array_values($map_selectId_lib)) ;
		$subRES_tab['tab_title_isDummy'] = true ;
	
		$subRES_tab['arr_grid-x'] = array() ;
		$subRES_tab['arr_grid-y'] = array() ;
		
		foreach( $fields_group as $group_id => $field_group )
		{
			// avant Enum => intro de la condition specifique
			$bibleConditions = array() ;
			$foreignLinks = array() ;
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
					$bibleConditions[] = array('treenodes'=>$tarr) ;
				}
				if( $field_where['field_type'] == 'link'
					&& $field_where['field_code'] == $field_group['field_code']
					&& $field_where['condition_bible_mode'] == 'SELECT' && $field_where['condition_bible_entries']
					&& (!isJsonArr($field_where['condition_bible_entries']) || json_decode($field_where['condition_bible_entries'],true)) )
				{
					if( !isJsonArr($field_where['condition_bible_entries']) ) {
						$entry_key = $field_where['condition_bible_entries'] ;
						$bibleConditions[] = array('entries'=>array($entry_key)) ;
					} elseif( count($entries = json_decode($field_where['condition_bible_treenodes'],true)) > 0 )  {
						$bibleConditions[] = array('entries'=>$entries) ;
					}
				}
				
				if( $field_where['field_type'] == 'link' && $field_group['field_type'] == 'link'
					&& $field_where['field_linkbible'] != $field_group['field_linkbible'] 
					&& $field_where['condition_bible_mode'] == 'SELECT' && $field_where['condition_bible_entries'] )
				{
					// TMP: pour la sélection des labels à énumerer, on fait appel aux conditions sur bible (foreignKey)
					// -uniquement- si l'entrée est unitaire
					// Ex : seulement les mags STORE du chef secteur SALES sélectionné
					if( !isJsonArr($field_where['condition_bible_entries']) ) {
						$entry_key = $field_where['condition_bible_entries'] ;
						$foreignLinks[$field_where['field_linkbible']] = array('record_type'=>'entry', 'record_key'=>$entry_key) ;
					} elseif( count($entries = json_decode($field_where['condition_bible_entries'],true)) == 1 )  {
						$foreignLinks[$field_where['field_linkbible']] = array('record_type'=>'entry', 'record_key'=>reset($entries)) ;
					}
				}
			}

			$subsub = paracrm_queries_process_labelEnum( $group_id, $field_group, $bibleConditions, $foreignLinks ) ;
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

function paracrm_queries_process_labelEnum( $group_id, $field_group, $bibleConditions=NULL, $foreignLinks=NULL )
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
		
		$arr = array() ;
		switch( $field_group['group_bible_type'] )
		{
			case 'TREEVIEW' :
			foreach( paracrm_queries_process_labelEnumBible_getTreeviewNodes( $field_group['sql_bible_code'], '&', $field_group['group_do_entries'], $bibleConditions , $foreignLinks ) as $record )
			{
				$ttmp = array() ;
				foreach( $field_group['group_bible_display_arrFields'] as $display_field_key => $display_field_arrDesc )
				{
					if( $record['_type'] != $display_field_arrDesc['bible_type'] ) {
						continue ;
					}
				
					$bible_field_code = $display_field_arrDesc['bible_type'].'_'.$display_field_arrDesc['bible_field_code'] ;
					if( in_array($bible_field_code,$link_field_refs) ) {
						// décodage JSON
						$ttmp[$display_field_key] = implode(' ',json_decode($record[$display_field_key])) ;
					}
					else {
						$ttmp[$display_field_key] = $record[$display_field_key] ;
					}
				}
				// ::Forward node _id and _parent_id for building treeview hierarchy
				$ttmp['_id'] = $record['_id'] ;
				$ttmp['_parent_id'] = $record['_parent_id'] ;
				
				$treeview_node_key = $record['_id'] ;
				
				$arr[$treeview_node_key] = $ttmp ;
			}
			break ;
		
		
			case 'TREE' :
			foreach( paracrm_queries_process_labelEnumBibleTreenodes( $field_group['sql_bible_code'], '&', $field_group['group_bible_tree_depth'], $bibleConditions , $foreignLinks ) as $record )
			{
				$ttmp = array() ;
				foreach( $field_group['group_bible_display_arrFields'] as $display_field_key => $display_field_arrDesc )
				{
					$bible_field_code = $display_field_arrDesc['bible_type'].'_'.$display_field_arrDesc['bible_field_code'] ;
					if( in_array($bible_field_code,$link_field_refs) ) {
						// décodage JSON
						$ttmp[$display_field_key] = implode(' ',json_decode($record[$display_field_key])) ;
					}
					else {
						$ttmp[$display_field_key] = $record[$display_field_key] ;
					}
				}
				
				$treenode_key = 't_'.$record['treenode_key'] ;
				
				$arr[$treenode_key] = $ttmp ;
			}
			break ;
			
			
			case 'ENTRY' :
			foreach( paracrm_queries_process_labelEnumBibleEntries( $field_group['sql_bible_code'], '&', $bibleConditions , $foreignLinks ) as $record )
			{
				$ttmp = array() ;
				foreach( $field_group['group_bible_display_arrFields'] as $display_field_key => $display_field_arrDesc )
				{
					$bible_field_code = $display_field_arrDesc['bible_type'].'_'.$display_field_arrDesc['bible_field_code'] ;
					if( in_array($bible_field_code,$link_field_refs) ) {
						// décodage JSON
						$ttmp[$display_field_key] = implode(' ',json_decode($record[$display_field_key])) ;
					}
					else {
						$ttmp[$display_field_key] = $record[$display_field_key] ;
					}
				}
				
				$entry_key = 'e_'.$record['entry_key'] ;
				
				$arr[$entry_key] = $ttmp ;
			}
			break ;
		}
		break ;
		
		case 'date' :
		$force_values = array() ;
		if( $field_group['extrapolate_is_on'] && paracrm_queries_process_extrapolate_isDateValid($field_group['extrapolate_calc_date_to']) ) {
			$force_values['key_end'] = paracrm_queries_process_extrapolateGroup_outputDate( $field_group['extrapolate_calc_date_to'], $field_group['group_date_type'] );
		}
		foreach( paracrm_queries_process_labelEnumDate( $group_id, $field_group['group_date_type'], $field_group['group_date_is_desc'], $force_values ) as $group_key )
		{
			$arr[$group_key] = array($group_key) ;
		}
		break ;
		
		case 'file' :
		foreach( paracrm_queries_process_labelEnumFile( $group_id, $field_group['sql_file_code'], $field_group['group_file_limit_nb'] ) as $record ) {
			$ttmp = array() ;
			foreach( $field_group['group_file_display_arrFields'] as $display_field_key => $display_field_arrDesc )
			{
				$sql_field_code = 'field_'.$display_field_arrDesc['file_field_code'] ;
				switch( $display_field_arrDesc['field_type'] ) {
					case 'date' :
					$ttmp[$display_field_key] = date('Y-m-d',strtotime($record[$sql_field_code])) ;
					break ;
					default :
					$ttmp[$display_field_key] = $record[$sql_field_code] ;
					break ;
				}
			}
			$filerecord_id = $record['filerecord_id'] ;
			$arr[$filerecord_id] = $ttmp ;
		}
		break ;
	}
	
	return $arr ;
}

function paracrm_queries_process_labelEnumBible_getTreeviewNodes( $bible_code, $root_treenodeKey, $do_entries, $bibleConditions=NULL, $foreignLinks=NULL ) {
	// return flat treeview nodes :
		// $node['_type'] = 'entry' / 'tree'
		// $node['_id'] = t_<treenode_key> / e_<entry_key> ;
		// $node['_parent_id'] ;
	global $_opDB ;
	
	global $arr_bible_trees ; // cache des objets GenericTree pour chaque bible
	
	if( !$arr_bible_trees[$bible_code] )
	{
		return NULL ;
	}
	$root_tree = $arr_bible_trees[$bible_code] ;
	if( !($root_tree = $root_tree->getTree( '&' )) )
	{
		return NULL ;
	}
	
	// ***** foreignLinks ****
	// - conditions sur autre bible => pour la requete
	$arr_treenodes = array() ;
	if( $foreignLinks )
	{
		$treenodes = array() ;
		foreach( paracrm_lib_bible_queryBible( $bible_code, $foreignLinks ) as $arr_row ) {
			$treenode = $arr_row['treenode_key'] ;
			while( TRUE ) {
				$treenodes[$treenode] = TRUE ;
				$query = "SELECT treenode_parent_key FROM view_bible_{$bible_code}_tree WHERE treenode_key='$treenode'" ;
				$parent_treenode = $_opDB->query_uniqueValue($query) ;
				if( !$parent_treenode || $parent_treenode=='&' ) {
					break ;
				}
				$treenode = $parent_treenode ;
			}
		}
		
		$arr_treenodes[] = array_keys($treenodes) ;
	}
	// ****** bibleConditions ******
	// - condition treenode sur meme bible
	if( $bibleConditions && count($bibleConditions)>0 )
	{
		foreach( $bibleConditions as $bibleCondition )
		{
			if( $bibleCondition['treenodes'] ) {
				$treenodes = array() ;
				foreach( $bibleCondition['treenodes'] as $condition_treenode )
				{
					if( $root_tree->getTree($condition_treenode) )
						$treenodes = array_merge($treenodes,$root_tree->getTree($condition_treenode)->getAllMembers()) ;
				}
				$arr_treenodes[] = $treenodes ;
			}
			if( $bibleCondition['entries'] ) {
				$treenodes = array() ;
				foreach( $bibleCondition['entries'] as $condition_entry )
				{
					$query = "SELECT treenode_key FROM ".'view_bible_'.$bible_code.'_entry'." where entry_key={$condition_entry}" ;
					$condition_entry_treenodeKey = $_opDB->query_uniqueValue($query) ;
					$treenodes[] = $condition_entry_treenodeKey ;
				}
				$arr_treenodes[] = $treenodes ;
			}
		}
	}
	
	// ***** Select ALL from view
	$arr_describe_tree = array() ;
	foreach( $_opDB->table_fields('view_bible_'.$bible_code.'_tree') as $db_field )
	{
		if( strpos($db_field,'field_') === 0 )
			$arr_describe_tree[$db_field] = substr($db_field,6,strlen($db_field)-6) ;
	}
	// ***** Select ALL from view
	$tab = array() ;
	$query = "SELECT * FROM ".'view_bible_'.$bible_code.'_tree'.' ORDER BY treenode_key' ;
	$result = $_opDB->query($query) ;
	while( ($treenode_row = $_opDB->fetch_assoc($result)) != FALSE ) {
		$treenode_key = $treenode_row['treenode_key'] ;
		
		if( is_array($arr_treenodes) )
		{
		foreach( $arr_treenodes as $treenodes )
		{
			if( !in_array($treenode_key,$treenodes) )
				continue 2 ;
		}
		}
		
		$node = array() ;
		$node['_type'] = 'tree' ;
		$node['_id'] = 't_'.$treenode_key ;
		$node['_parent_id'] = ( $treenode_row['treenode_parent_key'] != '' ? 't_'.$treenode_row['treenode_parent_key'] : '' ) ;
		foreach( $arr_describe_tree as $db_field=>$field_code ) {
			$target_key = 'tree_'.$field_code ;
			$node[$target_key] = $treenode_row[$db_field] ;
		}
		
		$tab[] = $node ;
	}
	
	if( $do_entries ) {
		foreach( paracrm_queries_process_labelEnumBibleEntries($bible_code, $root_treenodeKey, $bibleConditions, $foreignLinks) as $record ) {
			$entry_key = $record['entry_key'] ;
			$treenode_key = $record['treenode_key'] ;
			
			$node = array() ;
			$node['_type'] = 'entry' ;
			$node['_id'] = 'e_'.$entry_key ;
			$node['_parent_id'] = 't_'.$treenode_key ;
			$node = $node + $record ;
			$tab[] = $node ;
		}
	}
	
	return $tab ;
}



function paracrm_queries_process_labelEnumBible_getNodesChain( $bible_code, $treenode_key ) {
	// returns array(fields) tree_DEPTH_FIELDCODE => value

	global $_opDB ;
	
	global $arr_bible_trees ; // cache des objets GenericTree pour chaque bible
	global $arr_bible_treenodes ;  // cache des records view_bible_X_tree pour chaque bible, index = treenode_key
	
	$arr_describe_tree = array() ;
	foreach( $_opDB->table_fields('view_bible_'.$bible_code.'_tree') as $db_field )
	{
		if( strpos($db_field,'field_') === 0 )
			$arr_describe_tree[$db_field] = substr($db_field,6,strlen($db_field)-6) ;
	}
	
	
	$return_fields = array() ;
	
	$root_tree = $arr_bible_trees[$bible_code] ;
	if( !($root_tree = $root_tree->getTree( '&' )) )
	{
		return $return_fields ;
	}
	
	if( !isset($arr_bible_treenodes[$bible_code]) ) {
		$ttmp = array() ;
		$query = "SELECT * FROM ".'view_bible_'.$bible_code.'_tree' ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
			$ttmp[$arr['treenode_key']] = $arr ;
		}
		$arr_bible_treenodes[$bible_code] = $ttmp ;
	}
	$bible_treenodes = $arr_bible_treenodes[$bible_code] ;
	
	
	$obj_node = $root_tree->getTree($treenode_key) ;
	while( $obj_node && $obj_node->getDepth() > 0 ) {
		$cur_treenode_key = $obj_node->getHead();
		
		$treenode_record = $bible_treenodes[$cur_treenode_key] ;
		foreach( $arr_describe_tree as $db_field=>$field_code ) {
			$target_key = 'tree_'.$obj_node->getDepth().'_'.$field_code ;
			$return_fields[$target_key] = $treenode_record[$db_field] ;
		}
		
		$obj_node = $obj_node->getParent() ;
	}
	return $return_fields ;
}
function paracrm_queries_process_labelEnumBibleTreenodes( $bible_code, $root_treenodeKey, $depth, $bibleConditions=NULL, $foreignLinks=NULL )
{
	global $_opDB ;
	
	global $arr_bible_trees ;
	
	if( !$arr_bible_trees[$bible_code] )
	{
		return NULL ;
	}
	$root_tree = $arr_bible_trees[$bible_code] ;
	if( !($root_tree = $root_tree->getTree( '&' )) )
	{
		return NULL ;
	}
	
	// ***** foreignLinks ****
	// - conditions sur autre bible => pour la requete
	$arr_treenodes = array() ;
	if( $foreignLinks )
	{
		$treenodes = array() ;
		foreach( paracrm_lib_bible_queryBible( $bible_code, $foreignLinks ) as $arr_row ) {
			$treenode = $arr_row['treenode_key'] ;
			while( TRUE ) {
				$treenodes[$treenode] = TRUE ;
				$query = "SELECT treenode_parent_key FROM view_bible_{$bible_code}_tree WHERE treenode_key='$treenode'" ;
				$parent_treenode = $_opDB->query_uniqueValue($query) ;
				if( !$parent_treenode || $parent_treenode=='&' ) {
					break ;
				}
				$treenode = $parent_treenode ;
			}
		}
		
		$arr_treenodes[] = array_keys($treenodes) ;
	}
	// ****** bibleConditions ******
	// - condition treenode sur meme bible
	if( $bibleConditions && count($bibleConditions)>0 )
	{
		foreach( $bibleConditions as $bibleCondition )
		{
			if( $bibleCondition['treenodes'] ) {
				$treenodes = array() ;
				foreach( $bibleCondition['treenodes'] as $condition_treenode )
				{
					if( $root_tree->getTree($condition_treenode) )
						$treenodes = array_merge($treenodes,$root_tree->getTree($condition_treenode)->getAllMembers()) ;
				}
				$arr_treenodes[] = $treenodes ;
			}
			if( $bibleCondition['entries'] ) {
				$treenodes = array() ;
				foreach( $bibleCondition['entries'] as $condition_entry )
				{
					$query = "SELECT treenode_key FROM ".'view_bible_'.$bible_code.'_entry'." where entry_key={$condition_entry}" ;
					$condition_entry_treenodeKey = $_opDB->query_uniqueValue($query) ;
					$treenodes[] = $condition_entry_treenodeKey ;
				}
				$arr_treenodes[] = $treenodes ;
			}
		}
	}
	
	
	$tab = array() ;
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
		
		$record_chain = array('treenode_key'=>$treenode_key) + paracrm_queries_process_labelEnumBible_getNodesChain($bible_code,$treenode_key) ;
		$tab[] = $record_chain ;
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
			if( $bibleCondition['treenodes'] ) {
				$treenodes = array() ;
				foreach( $bibleCondition['treenodes'] as $condition_treenode )
				{
					if( $root_tree->getTree($condition_treenode) )
						$treenodes = array_merge($treenodes,$root_tree->getTree($condition_treenode)->getAllMembers()) ;
				}
				$query_treenode.= " AND t.treenode_key IN ".$_opDB->makeSQLlist($treenodes) ;
			}
		}
	}
	
	// ******* foreignLinks ( + bibleConditions )********
	$query_entries = "" ;
	if( $foreignLinks )
	{
		$entries = array() ;
		foreach( paracrm_lib_bible_queryBible( $bible_code, $foreignLinks ) as $arr_row ) {
			$entries[] = $arr_row['entry_key'] ;
		}
		
		$query_entries = " AND e.entry_key IN ".$_opDB->makeSQLlist($entries) ;
	}
	if( $bibleConditions && count($bibleConditions)>0 )
	{
		foreach( $bibleConditions as $bibleCondition )
		{
			if( $bibleCondition['entries'] ) {
				$query_entries = " AND e.entry_key IN ".$_opDB->makeSQLlist($bibleCondition['entries']) ;
			}
		}
	}
	
	
	$arr_describe_entry = array() ;
	foreach( $_opDB->table_fields('view_bible_'.$bible_code.'_entry') as $db_field )
	{
		if( strpos($db_field,'field_') === 0 )
			$arr_describe_entry[$db_field] = 'entry_'.substr($db_field,6,strlen($db_field)-6) ;
	}
	
	$select_clause_arr = array() ;
	foreach( $arr_describe_entry as $db_field=>$target )
	{
		$select_clause_arr[] = 'e.'.$db_field.' AS '.$target ;
	}
	
	

	$tab = array() ;
	// ***** foreignLinks ****
	// - conditions sur autre bible => pour la requete
	$view_name = 'view_bible_'.$bible_code.'_entry' ;
	$view_name_tree = 'view_bible_'.$bible_code.'_tree' ;
	$query = "SELECT e.entry_key as entry_key,e.treenode_key as treenode_key,".implode(',',$select_clause_arr)." FROM $view_name e JOIN $view_name_tree t ON t.treenode_key=e.treenode_key WHERE 1" ;
	$query.= $query_treenode ;
	$query.= $query_entries ;
	$query.= " ORDER BY e.treenode_key, e.entry_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		if( true ) {
			$arr = $arr + paracrm_queries_process_labelEnumBible_getNodesChain($bible_code,$arr['treenode_key']) ;
		}
		//unset($arr['treenode_key']) ;
		
		$tab[] = $arr ;
	}
	return $tab ;
}


function paracrm_queries_process_labelEnumFile( $group_id, $file_code, $group_file_limit_nb )
{
	global $_opDB ;
	global $_groups_hashes ;
	
	// recherche du MIN + MAX
	$ttmp = array() ;
	foreach( $_groups_hashes as $hash_key => $hash_desc )
	{
		$ttmp[] = $hash_desc[$group_id] ;
	}
	rsort($ttmp) ;
	if( $group_file_limit_nb > 0 ) {
		array_splice($ttmp, $group_file_limit_nb);
	}
	sort($ttmp) ;
	
	$view_name = 'view_file_'.$file_code ;
	$tab = array() ;
	foreach( $ttmp as $filerecord_id ) {
		$query = "SELECT * FROM $view_name WHERE filerecord_id='{$filerecord_id}'" ;
		$result = $_opDB->query($query) ;
		$arr = $_opDB->fetch_assoc($result);
		if( !$arr ) {
			continue ;
		}
		$tab[] = $arr ;
	}
	return $tab ;
}

function paracrm_queries_process_labelEnumDate( $group_id, $group_date_type, $group_date_is_desc=FALSE, $force_values=NULL )
{
	global $_groups_hashes ;
	
	// recherche du MIN + MAX
	$ttmp = array() ;
	foreach( $_groups_hashes as $hash_key => $hash_desc )
	{
		$ttmp[] = $hash_desc[$group_id] ;
	}
	if( !$ttmp ) {
		return array() ;
	}
	
	$keys = array() ;
	$cur_key = min($ttmp);
	$end_key = max($ttmp);
	if( isset($force_values['key_start']) && $force_values['key_start'] < $cur_key ) {
		$cur_key = $force_values['key_start'] ;
	}
	if( isset($force_values['key_end']) && $end_key < $force_values['key_end'] ) {
		$end_key = $force_values['key_end'] ;
	}
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
			$next_key = date('o-W',strtotime('+1 week',strtotime("{$tyear}0104 + ".($tweek-1)." weeks"))) ;
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
	
	if( $group_date_is_desc ) {
		$keys = array_reverse($keys) ;
	}
	return $keys ;
}

function paracrm_queries_process_extrapolate( $arr_saisie, &$RES_groupKey_groupDesc, &$RES_groupKey_selectId_value, $RES_selectId_nullValue ) {
	$extrapolate_batches = array() ;
	foreach( $arr_saisie['fields_group'] as $group_id => $field_group ) {
		if( $field_group['field_type'] == 'date' 
				&& $field_group['extrapolate_is_on'] 
				&& paracrm_queries_process_extrapolate_isDateValid($field_group['extrapolate_src_date_from'])
				&& paracrm_queries_process_extrapolate_isDateValid($field_group['extrapolate_calc_date_from'])
				&& paracrm_queries_process_extrapolate_isDateValid($field_group['extrapolate_calc_date_to']) ) {
			
			$extrapolate_batch = array() ;
			$extrapolate_batch['group_id'] = $group_id ;
			$extrapolate_batch['group_date_type'] = $field_group['group_date_type'] ;
			$extrapolate_batch['extrapolate_src_date_from'] = $field_group['extrapolate_src_date_from'] ;
			$extrapolate_batch['extrapolate_calc_date_from'] = $field_group['extrapolate_calc_date_from'] ;
			$extrapolate_batch['extrapolate_calc_date_to'] = $field_group['extrapolate_calc_date_to'] ;
			$extrapolate_batches[] = $extrapolate_batch ;
			
			// recherche du field conditionnel (where) correspondant
			foreach( $arr_saisie['fields_where'] as $test_fieldWhere ) {
				if( $test_fieldWhere['field_code'] == $field_group['field_code'] ) {
					/*
					$extrapolate_batch['where_date_from'] = paracrm_queries_process_extrapolate_isDateValid($test_fieldWhere['condition_date_gt']) ;
					$extrapolate_batch['where_date_to'] = paracrm_queries_process_extrapolate_isDateValid($test_fieldWhere['condition_date_lt']) ;
					*/
					// REMOVE: LINK to whereField is not used
					break ;
				}
			}
		}
	}
	
	foreach( $extrapolate_batches as &$extrapolate_batch ) {
		/*
		// "probe" data_date_from / data_date_to
		$current_groupId = $extrapolate_batch['group_id'] ;
		if( $extrapolate_batch['data_date_from'] === FALSE ) {
			foreach( $RES_groupKey_groupDesc as $groupDesc ) {
				//print_r($groupDesc) ;
			}
		}
		if( $extrapolate_batch['data_date_to'] === FALSE ) {
			foreach( $RES_groupKey_groupDesc as $groupDesc ) {
				//print_r($groupDesc) ;
			}
		}
		*/
		
		paracrm_queries_process_extrapolateGroup( $extrapolate_batch, $RES_groupKey_groupDesc, $RES_groupKey_selectId_value, $RES_selectId_nullValue ) ;
	}
	unset($extrapolate_batch) ;
}
function paracrm_queries_process_extrapolate_isDateValid( $date_sql )
{
	if( $date_sql == '0000-00-00' )
		return FALSE ;
	if( $date_sql == '0000-00-00 00:00:00' )
		return FALSE ;
	if( !$date_sql )
		return FALSE ;
	if( strtotime( $date_sql ) === FALSE  )
		return FALSE ;
	// echo "NOK" ;
	return $date_sql ;
}


function paracrm_queries_process_extrapolateGroup( $extrapolate_batch, &$RES_groupKey_groupDesc, &$RES_groupKey_selectId_value, $RES_selectId_nullValue ) {
	/*
	$params['group_id']
	$params['group_date_type']
	$params['extrapolate_src_date_from'] ;
	$params['extrapolate_calc_date_from'] ;
	$params['extrapolate_calc_date_to'] ;
	*/
	// **** Conversion en format date spécifié **** 
	$extrapolate_batch['extrapolate_src_date_from'] = paracrm_queries_process_extrapolateGroup_outputDate( $extrapolate_batch['extrapolate_src_date_from'], $extrapolate_batch['group_date_type'] ) ;
	$extrapolate_batch['extrapolate_calc_date_from'] = paracrm_queries_process_extrapolateGroup_outputDate( $extrapolate_batch['extrapolate_calc_date_from'], $extrapolate_batch['group_date_type'] ) ;
	$extrapolate_batch['extrapolate_calc_date_to'] = paracrm_queries_process_extrapolateGroup_outputDate( $extrapolate_batch['extrapolate_calc_date_to'], $extrapolate_batch['group_date_type'] );
	
	// *** Construction de l'iteration global sur le groupId *** 
	// covering real + extrapolate
	$force_values = array() ;
	$force_values['key_end'] = $extrapolate_batch['extrapolate_calc_date_to'] ;
	$ITERATION_dates = paracrm_queries_process_labelEnumDate($extrapolate_batch['group_id'],$extrapolate_batch['group_date_type'],$group_date_is_desc=FALSE,$force_values) ;
	$ITERATION_src_dates = array() ;
	$ITERATION_calc_dates = array() ;
	foreach( $ITERATION_dates as $date_step ) {
		if( $date_step < $extrapolate_batch['extrapolate_src_date_from'] ) {
			// ignore
		} elseif( $date_step >= $extrapolate_batch['extrapolate_src_date_from'] && $extrapolate_batch['extrapolate_calc_date_from'] > $date_step ) {
			$ITERATION_src_dates[] = $date_step ;
		} elseif( $extrapolate_batch['extrapolate_calc_date_to'] >= $date_step ) {
			$ITERATION_calc_dates[] = $date_step ;
		}
	}
	
	
	$current_groupId = $extrapolate_batch['group_id'] ;
	$LOCAL_newKey = 0 ;
	$LOCAL_groupKey_groupDesc = array() ;
	$LOCAL_groupKey_selectId_srcValues = array() ;
	$LOCAL_groupKey_selectId_calcValues = array() ;
	$LOCAL_groupHash_groupKey = array() ;
	// *** Construction des groupes ***
	// - groupDesc ( minus groupId )
	// - list<value+weight>
	foreach( $RES_groupKey_groupDesc as $groupKey => $groupDesc ) {
		$striped_date = $groupDesc[$current_groupId] ;
		$groupDesc[$current_groupId] = '%%%' ;
		$string_hash = implode('@',$groupDesc) ;
		if( !isset($LOCAL_groupHash_groupKey[$string_hash]) ) {
			$LOCAL_newKey++ ;
			$LOCAL_groupHash_groupKey[$string_hash] = $LOCAL_newKey ;
			$LOCAL_groupKey_groupDesc[$LOCAL_newKey] = $groupDesc ;
		}
		$local_groupKey = $LOCAL_groupHash_groupKey[$string_hash] ;
		
		if( !isset($LOCAL_groupKey_selectId_srcValues[$local_groupKey]) ) {
			$LOCAL_groupKey_selectId_srcValues[$local_groupKey] = array() ;
		}
		if( isset($RES_groupKey_selectId_value[$groupKey]) ) {
			foreach( $RES_groupKey_selectId_value[$groupKey] as $select_id => $value ) {
				if( !isset($LOCAL_groupKey_selectId_srcValues[$local_groupKey][$select_id]) ) {
					$LOCAL_groupKey_selectId_srcValues[$local_groupKey][$select_id] = array() ;
					foreach( $ITERATION_src_dates as $date_step ) {
						$LOCAL_groupKey_selectId_srcValues[$local_groupKey][$select_id][$date_step] = $RES_selectId_nullValue[$select_id] ;
					}
				}
				if( in_array($striped_date,$ITERATION_src_dates) ) {
					$LOCAL_groupKey_selectId_srcValues[$local_groupKey][$select_id][$striped_date] = $value ;
				}
			}
		}
	}
	
	// **** Calcul *****
	foreach( $LOCAL_groupKey_selectId_srcValues as $local_groupKey => $t_selectId_srcValues ) {
		foreach( $t_selectId_srcValues as $select_id => $values ) {
			if( count($values) > 0 ) {
				$val = array_sum($values) / count($values) ;
			} else {
				$val = $RES_selectId_nullValue[$select_id] ;
			}
			
			$destValues = array() ;
			foreach( $ITERATION_calc_dates as $date_step ) {
				$destValues[$date_step] = $val ;
			}
			$LOCAL_groupKey_selectId_calcValues[$local_groupKey][$select_id] = $destValues ;
		}
	}
	
	// **** Fusion avec le résultat ****
	$RES_groupKey_isExtrapolate = array() ;
	foreach( $LOCAL_groupKey_selectId_calcValues as $local_groupKey => $t_selectId_dstValues ) {
		$groupDesc = $LOCAL_groupKey_groupDesc[$local_groupKey] ;
		foreach( $t_selectId_dstValues as $select_id => $dstValues ) {
			foreach( $dstValues as $date_step => $val ) {
				$new_groupDesc = $groupDesc ;
				$new_groupDesc[$current_groupId] = $date_step ;
				
				$group_key_id = paracrm_queries_process_queryHelp_getIdGroup($new_groupDesc) ;
				$RES_groupKey_isExtrapolate[$group_key_id] = TRUE ;
				if( !isset($RES_groupKey_groupDesc[$group_key_id]) ) {
					$RES_groupKey_groupDesc[$group_key_id] = $new_groupDesc ;
				}
				$RES_groupKey_selectId_value[$group_key_id][$select_id] = $val ;
			}
		}
	}
	
	// ***** Retour des groupes extrapolés ******
	return $RES_groupKey_isExtrapolate ;
}
function paracrm_queries_process_extrapolateGroup_outputDate( $date_sql, $output_dateType ) {
	switch( $output_dateType )
	{
		case 'YEAR' :
		return date('Y',strtotime($date_sql)) ;
		break ;
		
		case 'MONTH' :
		return date('Y-m',strtotime($date_sql)) ;
		break ;
		
		case 'WEEK' :
		return date('o-W',strtotime($date_sql)) ;
		break ;
		
		case 'DAY' :
		return date('Y-m-d',strtotime($date_sql)) ;
		break ;
	
		default :
		return NULL ;
	}
}

?>
