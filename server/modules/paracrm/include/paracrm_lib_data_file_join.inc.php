<?php

$GLOBALS['debug_disableJoin'] = FALSE ;

$GLOBALS['cache_joinMap'] = array() ;
$GLOBALS['cache_joinMap'][$file_code][$field_code] ;

$GLOBALS['cache_joinRes'] = array() ;
$GLOBALS['cache_joinRes'][$file_code][$field_code][$jSrcValues_hash] ;

$GLOBALS['cache_joinToBible'] = array() ;
$GLOBALS['cache_joinToBible'][$file_code][$field_code][$jRes] ;


function paracrm_lib_file_joinGridRecord( $file_code, &$record_row ) {
	global $_opDB ;
	$jMap = paracrm_lib_file_joinPrivate_getMap( $file_code ) ;
	
	foreach( $jMap as $entry_field_code => $jMapNode ) {
		$mkey = $file_code.'_field_'.$entry_field_code ;
		if( $GLOBALS['debug_disableJoin'] ) {
			$record_row[$mkey] = '@JOIN@@' ;
			return ;
		}
		
		$jSrcValues = array() ;
		foreach( $jMapNode['join_map'] as $joinCondition ) {
			$src_fileCode = ( $joinCondition['join_local_alt_file_code'] != NULL ? $joinCondition['join_local_alt_file_code'] : $file_code ) ;
			$src_fileFieldCode = $joinCondition['join_local_file_field_code'] ;
			
			$src_mkey = $src_fileCode.'_field_'.$src_fileFieldCode ;
			$jSrcValues[] = $record_row[$src_mkey] ;
		}
		if( $GLOBALS['cache_joinPrebuilt'][$file_code][$entry_field_code] ) {
			$jRes = paracrm_lib_file_joinPrivate_doForCache( $file_code, $entry_field_code, $jSrcValues ) ;
		} else {
			$jRes = paracrm_lib_file_joinPrivate_do( $file_code, $entry_field_code, $jSrcValues ) ;
		}
		$record_row[$mkey] = $jRes ;
		
		// Expand to bible fields @TODO:really expensive, find cleaner...
		if( $jMapNode['join_select_file_field_type'] == 'link' ) {
			
			// Lookup cache ? build
			if( !isset($GLOBALS['cache_joinToBible'][$file_code][$entry_field_code][$jRes]) ) {
				$record_row_bible = array() ;
				
				$bible_code = $jMapNode['join_select_file_field_linkbible'] ;
				
				if( $jMapNode['join_select_file_field_linktype'] == 'entry' ) {
					$entry_key = $jRes ;
					$entry_record = paracrm_lib_data_getRecord_bibleEntry( $bible_code, $entry_key ) ;
					if( $entry_record ) {
					foreach( $entry_record as $bkey => $bvalue ) {
						if( strpos($bkey,'field_') === 0 ) {
							$mkey_b = $mkey.'_entry_'.substr($bkey,6) ;
							$record_row_bible[$mkey_b] = $bvalue ;
						}
					}
					}
					$treenode_key = $entry_record['treenode_key'] ;
				} else {
					$treenode_key = $jRes ;
				}
				
				if( true ) { //tree
					$tree_record = paracrm_lib_data_getRecord_bibleTreenode( $bible_code, $treenode_key ) ;
					if( $tree_record ) {
					foreach( $tree_record as $bkey => $bvalue ) {
						if( strpos($bkey,'field_') === 0 ) {
							$mkey_b = $mkey.'_tree_'.substr($bkey,6) ;
							$record_row_bible[$mkey_b] = $bvalue ;
						}
					}
					}
				}
				
				// store in cache
				$GLOBALS['cache_joinToBible'][$file_code][$entry_field_code][$jRes] = $record_row_bible ;
			} else {
				// find in cache
				$record_row_bible = $GLOBALS['cache_joinToBible'][$file_code][$entry_field_code][$jRes] ;
			}
			
			foreach( $record_row_bible as $mkey_b => $bvalue ) {
				$record_row[$mkey_b] = $bvalue ;
			}
		}
	}
}
function paracrm_lib_file_joinQueryRecord( $file_code, &$record_row ) {
	global $_opDB ;
	$jMap = paracrm_lib_file_joinPrivate_getMap( $file_code ) ;
	
	foreach( $jMap as $entry_field_code => $jMapNode ) {
		$mkey_file = $file_code ;
		$mkey_field = 'field_'.$entry_field_code ;
		if( $GLOBALS['debug_disableJoin'] ) {
			$record_row[$mkey_file][$mkey_field] = '@JOIN@@' ;
			return ;
		}
		
		$jSrcValues = array() ;
		foreach( $jMapNode['join_map'] as $joinCondition ) {
			$src_fileCode = ( $joinCondition['join_local_alt_file_code'] != NULL ? $joinCondition['join_local_alt_file_code'] : $file_code ) ;
			$src_fileFieldCode = $joinCondition['join_local_file_field_code'] ;
			
			$src_mkey_file = $src_fileCode ;
			$src_mkey_field = 'field_'.$src_fileFieldCode ;
			$jSrcValues[] = $record_row[$src_mkey_file][$src_mkey_field] ;
		}
		if( $GLOBALS['cache_joinPrebuilt'][$file_code][$entry_field_code] ) {
			$jRes = paracrm_lib_file_joinPrivate_doForCache( $file_code, $entry_field_code, $jSrcValues ) ;
		} else {
			$jRes = paracrm_lib_file_joinPrivate_do( $file_code, $entry_field_code, $jSrcValues ) ;
		}
		if( $jRes === NULL ) {
			continue ;
		}
		$record_row[$mkey_file][$mkey_field] = $jRes ;
	}
}


function paracrm_lib_file_joinPrivate_buildCache_combineIdxNotedValues( $src_indexed, $pos=0 ) {
	reset( $src_indexed ) ;
	for( $i=0 ; $i<$pos ; $i++ )
	{
		next( $src_indexed ) ;
	}
	$idx = key($src_indexed) ;
	
	$tab = array() ;
	foreach( current($src_indexed) as $ttmp )
	{
		list($val,$note) = $ttmp ;
		$arr = array() ;
		$arr[$idx] = $val ;
		if( $pos + 1 == count($src_indexed) )
			$tab[] = array($arr,$note) ;
		else
		{
			foreach( paracrm_lib_file_joinPrivate_buildCache_combineIdxNotedValues( $src_indexed, $pos+1 ) as $ttmp )
			{
				list($sub_arr,$sub_note) = $ttmp ;
				$sub_arr = $arr + $sub_arr ;
				$tab[] = array($sub_arr,$sub_note+$note) ;
			}
		}
	}
	return $tab ;
}
function paracrm_lib_file_joinPrivate_buildCache( $file_code, $entry_field_code=NULL ) {
	global $_opDB ;
	
	$jMap = paracrm_lib_file_joinPrivate_getMap($file_code) ;
	if( $entry_field_code === NULL ) {
		foreach( $jMap as $entry_field_code => $jMapNode ) {
			paracrm_lib_file_joinPrivate_buildCache( $file_code, $entry_field_code ) ;
		}
		return ;
	}
	$jMapNode = $jMap[$entry_field_code] ;
	
	// quel fichier de destination ?
	//    quel champ de destination ?
	$target_view = 'view_file_'.$jMapNode['join_target_file_code'] ;
	$select_field = 'field_'.$jMapNode['join_select_file_field_code'] ;
	$jMapConditions = $jMapNode['join_map'] ;
	
	$TAB_hash_results = array() ;
	
	$query = "SELECT * FROM {$target_view}" ;
	$result = $_opDB->query($query) ;
	while( ($arrDB = $_opDB->fetch_assoc($result)) != FALSE ) {
		$jSelect_result = $arrDB[$select_field] ;
	
		$jSrc_idx_notedValues = array() ; 
		foreach( $jMapConditions as $idx => $joinCondition ) {
			$target_field = 'field_'.$joinCondition['join_target_file_field_code'] ;
			$jSrcValue = $arrDB[$target_field] ;
			
			$jSrcCondition_notedValues = array() ;
			switch( $joinCondition['join_field_type'] ) {
				case 'date' :
					$timestamp = strtotime($jSrcValue) ;
					if( $timestamp === FALSE ) {
						$timestamp = -1 ;
					}
					$jSrcCondition_notedValues[] = array($timestamp,'0') ;
					break ;
				case 'link' :
					switch( $joinCondition['join_field_linktype'] ) {
						case 'entry' :
							$jSrcCondition_notedValues[] = array($jSrcValue,'0') ;
							break ;
						default : // @TODO: other linktypes not yet supported (should use GenericTree and place notes
							return ;
					}
					break ;
				default :
					$jSrcCondition_notedValues[] = array($jSrcValue,'0') ;
			}
			$jSrc_idx_notedValues[] = $jSrcCondition_notedValues ;
		}
		
		// Array combination
		$jSrc_notedIdxvalues = paracrm_lib_file_joinPrivate_buildCache_combineIdxNotedValues($jSrc_idx_notedValues) ;
		$jSrc_notedHashes = array() ;
		foreach( $jSrc_notedIdxvalues as $jSrc_notedIdxvalue ) {
			list($jSrc_idxvalue,$note) = $jSrc_notedIdxvalue ;
			$jSrc_notedHashes[] = array( implode('@@',$jSrc_idxvalue), $note ) ;
		}
		
		foreach( $jSrc_notedHashes as $jSrc_notedHash ) {
			list($jSrc_hash,$note) = $jSrc_notedHash ;
			if( !isset($TAB_hash_results[$jSrc_hash]) ) {
				$TAB_hash_results[$jSrc_hash] = array() ;
			}
			$TAB_hash_results[$jSrc_hash][] = array('value'=>$jSelect_result,'note'=>$note) ;
		}
	}
	
	$sort_func = create_function('$a,$b','return ($a[\'note\'] - $b[\'note\']) ;') ;
	foreach( $TAB_hash_results as $jSrc_hash => $arr_notedValues ) {
		uasort($arr_notedValues,$sort_func) ;
		$winner = reset($arr_notedValues) ;
		$jVal = $winner['value'] ;
		$GLOBALS['cache_joinRes'][$file_code][$entry_field_code][$jSrc_hash] = $jVal ;
	}
	
	//print_r($GLOBALS['cache_joinRes'][$file_code][$entry_field_code]) ;
	
	$GLOBALS['cache_joinPrebuilt'][$file_code][$entry_field_code] = TRUE ;
}



function paracrm_lib_file_joinPrivate_doForCache_combineIdxValues( $src_indexed, $pos=0 ) {
	reset( $src_indexed ) ;
	for( $i=0 ; $i<$pos ; $i++ )
	{
		next( $src_indexed ) ;
	}
	$idx = key($src_indexed) ;
	
	$tab = array() ;
	foreach( current($src_indexed) as $val )
	{
		$arr = array() ;
		$arr[$idx] = $val ;
		if( $pos + 1 == count($src_indexed) )
			$tab[] = $arr ;
		else
		{
			foreach( paracrm_lib_file_joinPrivate_doForCache_combineIdxValues( $src_indexed, $pos+1 ) as $sub_arr )
			{
				$sub_arr = $arr + $sub_arr ;
				$tab[] = $sub_arr ;
			}
		}
	}
	return $tab ;
}
function paracrm_lib_file_joinPrivate_doForCache( $file_code, $entry_field_code, $jSrcValues ) {
	$jMap = paracrm_lib_file_joinPrivate_getMap($file_code) ;
	$jMapNode = $jMap[$entry_field_code] ;
	//foreach( $jMap['join_map'] as $joinSequence )
	
	if( count($jSrcValues) != count($jMapNode['join_map']) ) {
		return NULL ;
	}
	
	$jSrcValues_arrHash = array() ;
	foreach( $jMapNode['join_map'] as $idx => $joinCondition ) {
		$jSrcValue = $jSrcValues[$idx] ;
		switch( $joinCondition['join_field_type'] ) {
			case 'date' :
				$jSrcValues_arrHash[] = paracrm_lib_file_joinTool_findInfLevels( strtotime($jSrcValue), $joinCondition['join_field_arrLevels'] ) ;
				break ;
			default :
				$jSrcValues_arrHash[] = array($jSrcValue) ;
				break ;
		}
	}
	foreach( paracrm_lib_file_joinPrivate_doForCache_combineIdxValues($jSrcValues_arrHash) as $jSrcValues_arrHash ) {
		$jSrcValues_hash = implode('@@',$jSrcValues_arrHash) ;
		$jVal = $GLOBALS['cache_joinRes'][$file_code][$entry_field_code][$jSrcValues_hash] ;
		if( isset($jVal) ) {
			return $jVal ;
		}
	}
	return NULL ;
}
function paracrm_lib_file_joinPrivate_do( $file_code, $entry_field_code, $jSrcValues ) {
	global $_opDB ;

	$jMap = paracrm_lib_file_joinPrivate_getMap($file_code) ;
	$jMapNode = $jMap[$entry_field_code] ;
	//foreach( $jMap['join_map'] as $joinSequence )
	
	if( count($jSrcValues) != count($jMapNode['join_map']) ) {
		return NULL ;
	}
	
	$jSrcValues_arrHash = array() ;
	foreach( $jMapNode['join_map'] as $idx => $joinCondition ) {
		$jSrcValue = $jSrcValues[$idx] ;
		switch( $joinCondition['join_field_type'] ) {
			case 'date' :
				$jSrcValues_arrHash[] = paracrm_lib_file_joinTool_findInfLevel( strtotime($jSrcValue), $joinCondition['join_field_arrLevels'] ) ;
				break ;
			default :
				$jSrcValues_arrHash[] = $jSrcValue ;
				break ;
		}
	}
	$jSrcValues_hash = implode('@@',$jSrcValues_arrHash) ;
	
	$jVal = $GLOBALS['cache_joinRes'][$file_code][$entry_field_code][$jSrcValues_hash] ;
	if( isset($jVal) ) {
		//echo "cache! for ".$jSrcValues_hash."\n" ;
		return $jVal ;
	}
	unset($jVal) ;
	
	// foreach joinConditions
	//   - link bible : entry  => valeur exacte ou valeur null (+1)
	//   - link bible : tree => valeurs tree récursive (n+1) ou valeur nulle (+x) 
	//   - link date : date <= valeur ORDER BY date DESC
	
	// Réalisation manuelle du JOIN
	//  requete SQL:
	//   SELECT joinCondition valeur + cible
	//   FROM target table
	//   WHERE joinCondition
	$jSchema = array() ;
	$jSchemaCondition['_field_target'] ;
	$jSchemaCondition['_field_type'] ;
	$jSchemaCondition['date_lastValue'] ;
	$jSchemaCondition['date_max'] ;
	$jSchemaCondition['eq_value'] ;
	$jSchemaCondition['link_values'] ; // $value => $weight
	foreach( $jMapNode['join_map'] as $idx => $joinCondition ) {
		$jSrcValue = $jSrcValues[$idx] ;
		
		$jSchemaCondition = array() ;
		$jSchemaCondition['_field_target'] = $joinCondition['join_target_file_field_code'] ;
		switch( $joinCondition['join_field_type'] ) {
			case 'link' :
				$jSchemaCondition['_field_type'] = 'link' ;
				
				$t_view_bible_tree = 'view_bible_'.$joinCondition['join_field_linkbible'].'_tree' ;
				$t_view_bible_entry = 'view_bible_'.$joinCondition['join_field_linkbible'].'_entry' ;
				
				switch( $joinCondition['join_field_linktype'] ) {
					case 'entry_to_treenode' :
					case 'treenode' :
						$jSchemaCondition['link_values'] = array() ;
						
						switch( $joinCondition['join_field_linktype'] ) {
							case 'entry_to_treenode' :
							$treenode_key = $_opDB->query_uniqueValue("SELECT treenode_key FROM {$t_view_bible_entry} WHERE entry_key='{$jSrcValue}'") ;
							break ;
							
							case 'treenode' :
							default :
							$treenode_key = $jSrcValue ;
							break ;
						}
						
						$tidx = 0 ;
						while( TRUE ) {
							$tidx++ ;
							$jSchemaCondition['link_values'][$treenode_key] = $tidx ;
							
							$query = "SELECT treenode_parent_key FROM {$t_view_bible_tree} WHERE treenode_key='{$treenode_key}'" ;
							$treenode_parent_key = $_opDB->query_uniqueValue($query) ;
							if( $treenode_parent_key == NULL || $treenode_parent_key == '&' ) {
								break ;
							}
							$treenode_key = $treenode_parent_key ;
						}
						$jSchemaCondition['link_values']['&'] = ($tidx + 1) ;
						$jSchemaCondition['link_values'][''] = ($tidx + 10) ;
						break ;
						
					case 'entry' :
					default :
						$jSchemaCondition['link_values'] = array() ;
						$jSchemaCondition['link_values'][$jSrcValue] = 1 ;
						$jSchemaCondition['link_values'][''] = (1 + 10) ;
						break ;
				}
				break ;
			
			case 'date' :
				$jSchemaCondition['_field_type'] = 'date' ;
				$jSchemaCondition['date_max'] = $jSrcValue ;
				$jSchemaCondition['date_lastValue'] = NULL ;
				break ;
			default :
				$jSchemaCondition['_field_type'] = 'eq' ;
				$jSchemaCondition['eq_value'] = $jSrcValue ;
				break ;
		}
		
		$mkey = 'field_'.$jSchemaCondition['_field_target'] ;
		$jSchema[$mkey] = $jSchemaCondition ;
	}
	
	//print_r($jSchema) ;
	
	// Ecriture de la requête
	$select_fields = array() ;
	$select_fields[] = 'field_'.$jMapNode['join_select_file_field_code'] ;
	$from_view = 'view_file_'.$jMapNode['join_target_file_code'] ;
	$where_words = array() ;
	$orderBy_words = array() ;
	foreach( $jSchema as &$jSchemaCondition ) {
		$select_fields[] = 'field_'.$jSchemaCondition['_field_target'] ;
		
		switch( $jSchemaCondition['_field_type'] ) {
			case 'link' :
				$where_words[] = 'field_'.$jSchemaCondition['_field_target'].' IN '.$_opDB->makeSQLlist(array_keys($jSchemaCondition['link_values'])) ;
				break ;
				
			case 'date' :
				$where_words[] = 'field_'.$jSchemaCondition['_field_target']." <= '".$jSchemaCondition['date_max']."'" ;
				$orderBy_words[] = 'field_'.$jSchemaCondition['_field_target'].' DESC' ;
				break ;
				
			case 'eq' :
				$where_words[] = 'field_'.$jSchemaCondition['_field_target']."='".$jSchemaCondition['eq_value']."'" ;
				break ;
		}
	}
	
	$query = "SELECT ".implode(',',$select_fields)." FROM ".$from_view." WHERE ".implode(' AND ',$where_words) ;
	if( $orderBy_words ) {
		$query.= " ORDER BY ".implode(',',$orderBy_words) ;
	}
	
	
	//echo $query ;
	
	
	// Analyse et notation des résultats
	$result = $_opDB->query($query) ;
	$_stopFetch = FALSE ;
	$TAB_results = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$value_key = 'field_'.$jMapNode['join_select_file_field_code'] ;
		$value = $arr[$value_key] ;
		
		$note = 0 ;
		foreach( $jSchema as &$jSchemaCondition ) {
			$condValue_key = 'field_'.$jSchemaCondition['_field_target'] ;
			$condValue = $arr[$condValue_key] ;
			
			switch( $jSchemaCondition['_field_type'] ) {
				case 'link' :
					$note += $jSchemaCondition['link_values'][$condValue] ;
					break ;
					
				case 'date' :
					if( $jSchemaCondition['date_lastValue'] == NULL ) {
						$jSchemaCondition['date_lastValue'] = $condValue ;
					} elseif( $jSchemaCondition['date_lastValue'] == $condValue ) {
						// rien
					} else {
						$_stopFetch = true ; 
					}
					break ;
					
				default : break ;
			}
		}
		if( $_stopFetch ) {
			break ;
		}
		$TAB_results[] = array('value'=>$value,'note'=>$note) ;
	}
	
	//print_r($TAB_results) ;
	if( count($TAB_results) > 0 ) {
		
		// Classement des résultats
		$sort_func = create_function('$a,$b','return ($a[\'note\'] - $b[\'note\']) ;') ;
		uasort($TAB_results,$sort_func) ;
		
		// Renvoi
		$winner = reset($TAB_results) ;
		//print_r($winner) ;
		
		$jVal = $winner['value'] ;
	} else {
		$jVal = NULL ;
	}
	
	$GLOBALS['cache_joinRes'][$file_code][$entry_field_code][$jSrcValues_hash] = $jVal ;
	return $jVal ;
}

function paracrm_lib_file_joinPrivate_getMap( $file_code ) {
	global $_opDB ;
	
	if( is_array($tmp = $GLOBALS['cache_joinMap'][$file_code]) ) {
		return $tmp ;
	}
	
	$GLOBALS['cache_joinMap'][$file_code] = array() ;
	
	$query = "SELECT entry_field_code FROM define_file_entry WHERE file_code='$file_code' AND entry_field_type='join'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$entry_field_code = $arr[0] ;
		
		$GLOBALS['cache_joinMap'][$file_code][$entry_field_code] = array() ;
		
		// cache hash=>result
		$GLOBALS['cache_joinRes'][$file_code][$entry_field_code] = array() ;
	}
	
	$query = "SELECT * FROM define_file_entry_join WHERE file_code='$file_code'
				ORDER BY file_code, entry_field_code" ;
	$result = $_opDB->query($query) ;
	while( ($arrJoin = $_opDB->fetch_assoc($result)) != FALSE ) {
		$entry_field_code = $arrJoin['entry_field_code'] ;
		if( !isset($GLOBALS['cache_joinMap'][$file_code][$entry_field_code]) ) {
			continue ;
		}
		unset($arrJoin['file_code']) ;
		unset($arrJoin['entry_field_code']) ;
		$arrJoin['join_map'] = array() ;
		
		$target_fileCode = $arrJoin['join_target_file_code'] ;
		$select_fileFieldCode = $arrJoin['join_select_file_field_code'] ;
		$query = "SELECT * FROM define_file_entry WHERE file_code='$target_fileCode' AND entry_field_code='$select_fileFieldCode'" ;
		$res_select = $_opDB->query($query) ;
		$arr_defineSelect = $_opDB->fetch_assoc($res_select) ;
		$arrJoin['join_select_file_field_type'] = $arr_defineSelect['entry_field_type'] ;
		if( $arr_defineSelect['entry_field_type'] == 'link' ) {
			$arrJoin['join_select_file_field_linktype'] = $arr_defineSelect['entry_field_linktype'] ;
			$arrJoin['join_select_file_field_linkbible'] = $arr_defineSelect['entry_field_linkbible'] ;
		}
		
		$GLOBALS['cache_joinMap'][$file_code][$entry_field_code] = $arrJoin ;
	}
	
	$query = "SELECT * FROM define_file_entry_join_map WHERE file_code='$file_code'
				ORDER BY file_code, entry_field_code, join_map_ssid" ;
	$result = $_opDB->query($query) ;
	while( ($arrJoinCondition = $_opDB->fetch_assoc($result)) != FALSE ) {
		$entry_field_code = $arrJoinCondition['entry_field_code'] ;
		if( !is_array($GLOBALS['cache_joinMap'][$file_code][$entry_field_code]['join_map']) ) {
			continue ;
		}
		$arrJoin = $GLOBALS['cache_joinMap'][$file_code][$entry_field_code] ;
		
		unset($arrJoinCondition['file_code']) ;
		unset($arrJoinCondition['entry_field_code']) ;
		unset($arrJoinCondition['join_map_ssid']) ;
		
		$target_fileCode = $arrJoin['join_target_file_code'] ;
		$target_fileFieldCode = $arrJoinCondition['join_target_file_field_code'] ;
		$query = "SELECT * FROM define_file_entry WHERE file_code='$target_fileCode' AND entry_field_code='$target_fileFieldCode'" ;
		$res_target = $_opDB->query($query) ;
		$arr_defineTarget = $_opDB->fetch_assoc($res_target) ;
		
		$arrJoinCondition['join_field_type'] = $arr_defineTarget['entry_field_type'] ;
		if( $arr_defineTarget['entry_field_type'] == 'link' ) {
			// Interro du field local => local linktype
			$src_fileCode = ( $arrJoinCondition['join_local_alt_file_code'] != NULL ? $arrJoinCondition['join_local_alt_file_code'] : $file_code ) ;
			$src_fileFieldCode = $arrJoinCondition['join_local_file_field_code'] ;
			$query = "SELECT * FROM define_file_entry WHERE file_code='$src_fileCode' AND entry_field_code='$src_fileFieldCode'" ;
			$res_local = $_opDB->query($query) ;
			$arr_defineLocal = $_opDB->fetch_assoc($res_local) ;
		
			$arrJoinCondition['join_field_linkbible'] = $arr_defineTarget['entry_field_linkbible'] ;
			switch( $arr_defineTarget['entry_field_linktype'] ) {
				case 'treenode' :
					switch( $arr_defineLocal['entry_field_linktype'] ) {
						case 'entry' :
						$arrJoinCondition['join_field_linktype'] = 'entry_to_treenode' ;
						break ;
						
						case 'treenode' :
						default :
						$arrJoinCondition['join_field_linktype'] = 'treenode' ;
						break ;
					}
					break ;
					
				case 'entry' :
				default :
					$arrJoinCondition['join_field_linktype'] = 'entry' ;
					break ;
			}
		}
		if( $arr_defineTarget['entry_field_type'] == 'date' ) {
			$arr_levels = array() ;
			
			$db_view = "view_file_".$target_fileCode ;
			$db_field = 'field_'.$target_fileFieldCode ;
			$query_dateLevels = "SELECT distinct {$db_field} FROM {$db_view} ORDER BY {$db_field} ASC" ;
			$res_dateLevels = $_opDB->query($query_dateLevels) ;
			while( ($tRow = $_opDB->fetch_row($res_dateLevels)) != FALSE ) {
				$tVal = $tRow[0] ;
				if( $tVal == NULL || $tVal == '0000-00-00' || $tVal == '0000-00-00 00:00:00' ) {
					continue ;
				}
				$arr_levels[] = strtotime($tVal) ;
			}
			
			$arrJoinCondition['join_field_arrLevels'] = $arr_levels ;
		}
		
		$GLOBALS['cache_joinMap'][$file_code][$entry_field_code]['join_map'][] = $arrJoinCondition ;
	}
	
	return $GLOBALS['cache_joinMap'][$file_code] ;
}




function paracrm_lib_file_joinTool_findInfLevel( $value, $arr_levels ) {
	$idx_min = 0 ;
	$idx_max = count($arr_levels) - 1 ;
	if( $idx_max < 0 ) {
		return -1 ;
	}
	
	if( $value >= $arr_levels[$idx_max] ) {
		return $arr_levels[$idx_max] ;
	}
	if( $value < $arr_levels[$idx_min] ) {
		return 0 ;
	}

	while( $idx_max - $idx_min > 1 ) {
		$idx_middle = floor( ($idx_max + $idx_min)/2 ) ;
		
		if( $value < $arr_levels[$idx_middle] ) {
			$idx_max = $idx_middle ;
		}
		elseif( $value > $arr_levels[$idx_middle] ) {
			$idx_min = $idx_middle ;
		}
		else { // $value == $arr_levels[$idx_middle]
			return $value ;	
		}
	}
	
	return $arr_levels[$idx_min] ;
}
function paracrm_lib_file_joinTool_findInfLevels( $value, $arr_levels ) {
	$inf_levels = array() ;
	$inf_levels[] = -1 ;
	foreach( $arr_levels as $level ) {
		if( $level > $value ) {
			break ;
		}
		$inf_levels[] = $level ;
	}
	return array_reverse($inf_levels) ;
}

?>