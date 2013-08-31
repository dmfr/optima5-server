<?php

$GLOBALS['cache_joinMap'] = array() ;
$GLOBALS['cache_joinMap'][$file_code][$field_code] ;

$GLOBALS['cache_joinRes'] = array() ;
$GLOBALS['cache_joinRes'][$file_code][$field_code][$jSrcValues_hash] ;


function paracrm_lib_file_joinGridRecord( $file_code, &$record_row ) {
	global $_opDB ;
	$jMap = paracrm_lib_file_joinPrivate_getMap( $file_code ) ;
	
	foreach( $jMap as $entry_field_code => $dummy ) {
		$mkey = $file_code.'_field_'.$entry_field_code ;
		
		$record_row[$mkey] = '@JOIN@@' ;
		$record_row[$mkey] = 2 ;
	}
}
function paracrm_lib_file_joinQueryRecord( $file_code, &$record_row ) {
	global $_opDB ;
	$jMap = paracrm_lib_file_joinPrivate_getMap( $file_code ) ;
	
	foreach( $jMap as $entry_field_code => $jMapNode ) {
		$jSrcValues = array() ;
		foreach( $jMapNode['join_map'] as $joinCondition ) {
			$src_fileCode = ( $joinCondition['join_local_alt_file_code'] != NULL ? $joinCondition['join_local_alt_file_code'] : $file_code ) ;
			$src_fileFieldCode = $joinCondition['join_local_file_field_code'] ;
			
			$mkey_file = $src_fileCode ;
			$mkey_field = 'field_'.$src_fileFieldCode ;
			$jSrcValues[] = $record_row[$mkey_file][$mkey_field] ;
		}
		$jRes = paracrm_lib_file_joinPrivate_do( $file_code, $entry_field_code, $jSrcValues ) ;
		
		$mkey_file = $file_code ;
		$mkey_field = 'field_'.$entry_field_code ;
		//$record_row[$mkey_file][$mkey_field] = '@JOIN@@' ;
		$record_row[$mkey_file][$mkey_field] = $jRes ;
	}
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
				$jSrcValues_arrHash[] = paracrm_lib_file_joinTool_findInfLevel( $jSrcValue, $joinCondition['join_field_arrLevels'] ) ;
				break ;
			default :
				$jSrcValues_arrHash[] = $jSrcValue ;
				break ;
		}
	}
	$jSrcValues_hash = implode('@@',$jSrcValues_arrHash) ;
	if( isset($GLOBALS['cache_joinRes'][$file_code][$entry_field_code][$jSrcValues_hash]) ) {
		return $GLOBALS['cache_joinRes'][$file_code][$entry_field_code][$jSrcValues_hash] ;
	}
	
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
					case 'treenode' :
						$jSchemaCondition['link_values'] = array() ;
						
						$treenode_key = $_opDB->query_uniqueValue("SELECT treenode_key FROM {$t_view_bible_entry} WHERE entry_key='{$jSrcValue}'") ;
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
				$jSchemaCondition['_field_type'] = 'link' ;
				$jSchemaCondition['date_max'] = $jSrcValue ;
				$jSchemaCondition['date_lastValue'] = NULL ;
				break ;
			default :
				$jSchemaCondition['_field_type'] = 'eq' ;
				$jSchemaCondition['eq_value'] = $jSrcValue ;
				break ;
		}
		
		$jSchema[] = $jSchemaCondition ;
	}
	
	print_r($jSchema) ;
	
	// Ecriture de la requête
	
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
			$arrJoinCondition['join_field_linkbible'] = $arr_defineTarget['entry_field_linkbible'] ;
			switch( $arr_defineTarget['entry_field_linktype'] ) {
				case 'treenode' :
					$arrJoinCondition['join_field_linktype'] = 'treenode' ;
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

?>