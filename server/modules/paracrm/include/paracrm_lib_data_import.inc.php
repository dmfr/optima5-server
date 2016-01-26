<?php

function paracrm_lib_dataImport_getTreefieldsRoot( $data_type,$store_code ) {
	global $_opDB ;
	
	switch( $data_type ) {
		case 'file' :
			$file_code = $store_code ;
			$TAB = paracrm_lib_file_access( $file_code ) ;
			return paracrm_queries_builderTransaction_getTreeFields( $TAB ) ;
			
			
		case 'bible' ;
			$bible_code = $store_code ;
			$query = "SELECT bible_lib FROM define_bible WHERE bible_code='$bible_code'" ;
			$bible_lib = $_opDB->query_uniqueValue($query) ;
		
			$treefields_root = array();
			$treefields_root['root'] = true ;
			$treefields_root['text'] = '.' ;
			$treefields_root['expanded'] = true ;
			$treefields_root['children'] = array() ;
			
			$arr_tree_fields = array() ;
			$query = "SELECT * FROM define_bible_tree WHERE bible_code='{$bible_code}' ORDER BY tree_field_index" ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
				$field = array() ;
				$field['field_code'] = $bible_code.'_tree_'.$arr['tree_field_code'] ;
				$field['field_text'] = $arr['tree_field_lib'] ;
				$field['field_text_full'] = $arr['tree_field_lib'] ;
				$field['field_type'] = $arr['tree_field_type'] ;
				$field['field_type_full'] = $arr['tree_field_type'] ;
				$field['bible_code'] = $bible_code ;
				$field['bible_type'] = 'tree' ;
				$field['bible_field_code'] = $arr['tree_field_code'] ;
				$field['bible_field_iskey'] = ($arr['tree_field_is_key']=='O')?true:false ;
				$field['leaf'] = true ;
				$arr_tree_fields[] = $field ;
			}
			$treefields_root['children'][] = array(
				'field_code'=>$bible_code.'_tree',
				'field_text'=>'<b>'.$bible_lib.'</b>(treenodes)',
				'field_text_full'=>'<b>'.$bible_lib.'</b>(treenodes)',
				'bible_code' => $bible_code,
				'bible_type' => 'tree',
				'children'=>$arr_tree_fields,
				'expanded'=>true
			) ;
			
			$arr_entry_fields = array() ;
			$query = "SELECT * FROM define_bible_entry WHERE bible_code='{$bible_code}' ORDER BY entry_field_index" ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
				$field = array() ;
				$field['field_code'] = $bible_code.'_entry_'.$arr['entry_field_code'] ;
				$field['field_text'] = $arr['entry_field_lib'] ;
				$field['field_text_full'] = $arr['entry_field_lib'] ;
				$field['field_type'] = $arr['entry_field_type'] ;
				$field['field_type_full'] = $arr['entry_field_type'] ;
				$field['bible_code'] = $bible_code ;
				$field['bible_type'] = 'entry' ;
				$field['bible_field_code'] = $arr['entry_field_code'] ;
				$field['bible_field_iskey'] = ($arr['entry_field_is_key']=='O')?true:false ;
				$field['leaf'] = true ;
				$arr_entry_fields[] = $field ;
			}
			$treefields_root['children'][] = array(
				'field_code'=>$bible_code.'_entry',
				'field_text'=>'<b>'.$bible_lib.'</b>(entries)',
				'field_text_full'=>'<b>'.$bible_lib.'</b>(entries)',
				'bible_code' => $bible_code,
				'bible_type' => 'entry',
				'children'=>$arr_entry_fields,
				'expanded'=>true
			) ;
			
			return $treefields_root ;
			
			
		default :
			return FALSE ;
	}
}

function paracrm_lib_dataImport_probeMappingId( $data_type,$store_code, $csvsrc_arrHeaderTxt, $strict_mode=TRUE ) {
	global $_opDB ;
	
	// .. probe file format and load mapping
	$csvsrc_length = count($csvsrc_arrHeaderTxt) ;
	$target_biblecode = ($data_type=='bible' ? $store_code : '') ;
	$target_filecode = ($data_type=='file' ? $store_code : '') ;
	
	$query = "SELECT importmap_id FROM importmap
			WHERE csvsrc_length='$csvsrc_length' AND target_biblecode='$target_biblecode' AND target_filecode='$target_filecode'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$importmap_id = $arr[0] ;
		
		$test_arrHeadertxt = $test_arrTargetfieldmapcode = array() ;
		$query = "SELECT csvsrc_headertxt, target_fieldmapcode FROM importmap_column WHERE importmap_id='$importmap_id' ORDER BY importmap_column_ssid" ;
		$res = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($res)) != FALSE ) {
			$test_arrHeadertxt[] = $arr[0] ;
			$test_arrTargetfieldmapcode[] = $arr[1] ;
		}
		
		if( $test_arrHeadertxt === $csvsrc_arrHeaderTxt ) {
			return $importmap_id ;
		}
	}
	
	if( $strict_mode ) {
		return NULL ;
	}
	
	$arrCandidates_importmapId_rank = array() ;
	$query = "SELECT importmap_id FROM importmap
			WHERE target_biblecode='$target_biblecode' AND target_filecode='$target_filecode'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$importmap_id = $arr[0] ;
		
		$test_arrHeadertxt = $test_arrTargetfieldmapcode = array() ;
		$query = "SELECT csvsrc_headertxt, target_fieldmapcode FROM importmap_column WHERE importmap_id='$importmap_id' ORDER BY importmap_column_ssid" ;
		$res = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($res)) != FALSE ) {
			$test_arrHeadertxt[] = $arr[0] ;
			$test_arrTargetfieldmapcode[] = $arr[1] ;
		}
		
		if( count(array_diff($test_arrHeadertxt,$csvsrc_arrHeaderTxt)) == 0 ) {
			$arrCandidates_importmapId_rank[$importmap_id] = abs( count($test_arrHeadertxt)-count($csvsrc_arrHeaderTxt) ) ;
		}
	}
	if( count($arrCandidates_importmapId_rank) > 0 ) {
		asort($arrCandidates_importmapId_rank) ;
		reset($arrCandidates_importmapId_rank) ;
		return key($arrCandidates_importmapId_rank) ;
	}
	return NULL ;
}
function paracrm_lib_dataImport_getMapping( $importmap_id, $csvsrc_arrHeaderTxt=NULL ) {
	global $_opDB ;
	
	$map_csvHeaderTxt_arrTargetfieldmapcode = array() ;
	$query = "SELECT csvsrc_headertxt, target_fieldmapcode FROM importmap_column WHERE importmap_id='$importmap_id' ORDER BY importmap_column_ssid" ;
	$res = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($res)) != FALSE ) {
		$map_csvHeaderTxt_arrTargetfieldmapcode[$arr[0]] = $arr[1] ;
	}
	
	$cur_csvsrcIdx = -1 ;
	$map_fieldCode_csvsrcIdx = array() ;
	foreach( $map_csvHeaderTxt_arrTargetfieldmapcode as $csvHeaderTxt => $arrTargetfieldmapcode ) {
		$cur_csvsrcIdx++ ;
		foreach( json_decode($arrTargetfieldmapcode,true) as $target_fieldmapcode ) {
			if( !isset($map_fieldCode_csvsrcIdx[$target_fieldmapcode]) ) {
				$map_fieldCode_csvsrcIdx[$target_fieldmapcode] = array() ;
			}
			if( is_array($csvsrc_arrHeaderTxt) ) {
				$idx = array_search($csvHeaderTxt,$csvsrc_arrHeaderTxt) ;
				$map_fieldCode_csvsrcIdx[$target_fieldmapcode][] = $idx ;
			} else {
				$map_fieldCode_csvsrcIdx[$target_fieldmapcode][] = $cur_csvsrcIdx ;
			}
		}
	}
	return $map_fieldCode_csvsrcIdx ;
}
function paracrm_lib_dataImport_getTruncateMode( $importmap_id ) {
	global $_opDB ;
	
	$query = "SELECT truncate_mode FROM importmap WHERE importmap_id='$importmap_id'" ;
	return $_opDB->query_uniqueValue($query) ;
}



function paracrm_lib_dataImport_commit_processHandle( $data_type,$store_code, $handle ) {
	$cfg_delimiters = array('comma'=>',','semicolon'=>';') ;
	
	//rewind($handle) ;
	$first_lig = trim(fgets($handle)) ;
	if( !trim($first_lig) ) {
		return TRUE ;
	}
	
	foreach( $cfg_delimiters as $delimiter_code=>$delimiter_symbol ) {
		$map_delimiter_nbCols[$delimiter_code] = count(str_getcsv($first_lig,$delimiter_symbol)) ;
	}
	arsort($map_delimiter_nbCols) ;
	reset($map_delimiter_nbCols) ;
	$delimiter_code = key($map_delimiter_nbCols) ;
	$delimiter = $cfg_delimiters[$delimiter_code] ;
	
	$arr_csv = str_getcsv($first_lig,$delimiter) ;
	$csvsrc_arrHeadertxt = array() ;
	foreach( $arr_csv as $i => $col_value ) {
		$csvsrc_arrHeadertxt[] = trim($col_value) ;
	}
	
	
	if( $importmap_id = paracrm_lib_dataImport_probeMappingId($data_type,$store_code, $csvsrc_arrHeadertxt) ) {
		$map_fieldCode_csvsrcIdx = paracrm_lib_dataImport_getMapping($importmap_id) ;
		$truncate_mode = paracrm_lib_dataImport_getTruncateMode($importmap_id) ;
	} elseif( $importmap_id = paracrm_lib_dataImport_probeMappingId($data_type,$store_code, $csvsrc_arrHeadertxt, $strict_mode=FALSE) ) {
		$map_fieldCode_csvsrcIdx = paracrm_lib_dataImport_getMapping($importmap_id, $csvsrc_arrHeadertxt) ;
		$truncate_mode = paracrm_lib_dataImport_getTruncateMode($importmap_id) ;
	} else {
		return FALSE ;
	}
	
	
	$treefields_root = paracrm_lib_dataImport_getTreefieldsRoot( $data_type,$store_code ) ;
	
	paracrm_lib_dataImport_commit_processStream( $treefields_root, $map_fieldCode_csvsrcIdx, $handle, $delimiter, $truncate_mode ) ;
	
	return TRUE ;
}

function paracrm_lib_dataImport_commit_processStream( $treefields_root, $map_fieldCode_csvsrcIdx, $handle, $handle_delimiter, $truncate_mode ) {
	$GLOBALS['cache_fastImport'] = TRUE ;
	
	$arr_insertedFilerecordId = array() ;
	while( !feof($handle) ){
		$arr_csv = fgetcsv($handle,0,$handle_delimiter) ;
		if( !$arr_csv ) {
			continue ;
		}
		
		$arr_srcLig = array() ;
		foreach( $map_fieldCode_csvsrcIdx as $fieldCode => $arr_sIdx ) {
			if( !is_array($arr_sIdx) ) {
				$arr_sIdx = array($arr_sIdx) ;
			}
			$ttmp = array() ;
			foreach( $arr_sIdx as $sIdx ) {
				$ttmp[] = $arr_csv[$sIdx] ;
			}
			$arr_srcLig[$fieldCode] = implode(' ',$ttmp) ;
		}
		
		paracrm_lib_dataImport_commit_processNode($treefields_root,$arr_srcLig,$truncate_mode, $arr_insertedFilerecordId) ;
	}
	if( $truncate_mode=='truncate' ) {
		global $_opDB ;
		foreach( $treefields_root['children'] as $directChild ) {
			if( isset($directChild['file_code']) ) {
				$arr_existingFilerecordId = array() ;
				$view = 'view_file_'.$directChild['file_code'] ;
				$query = "SELECT filerecord_id FROM {$view}" ;
				$result = $_opDB->query($query) ;
				while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
					$arr_existingFilerecordId[] = $arr[0] ;
				}
				$todelete_filerecordIds = array_diff($arr_existingFilerecordId,$arr_insertedFilerecordId) ;
				foreach( $todelete_filerecordIds as $filerecord_id ) {
					paracrm_lib_data_deleteRecord_file( $directChild['file_code'] , $filerecord_id, $ignore_ifLocked=TRUE ) ;
				}
			}
		}
	}
	
	$GLOBALS['cache_fastImport'] = FALSE ;
}

function paracrm_lib_dataImport_commit_processNode( $treefields_node, $arr_srcLig, $truncate_mode, &$arr_insertedFilerecordId ) {
	if( !$treefields_node['root'] ) {
		return ;
	}
	$filerecord_id = 0 ;
	$treenode_key = '' ;
	foreach( $treefields_node['children'] as $directChild ) {
		if( isset($directChild['file_code']) ) {
			$filerecord_id = paracrm_lib_dataImport_commit_processNode_file( $directChild, $arr_srcLig, $filerecord_id, $truncate_mode );
			$arr_insertedFilerecordId[] = $filerecord_id ;
			continue ;
		}
		if( isset($directChild['bible_code']) ) {
			$arr_return = paracrm_lib_dataImport_commit_processNode_bible( $directChild, $arr_srcLig, $treenode_key );
			if( isset($arr_return['treenode_key']) ) {
				$treenode_key = $arr_return['treenode_key'] ;
			}
			continue ;
		}
		echo "??pN??" ;
	}
}
function paracrm_lib_dataImport_commit_processNode_file( $treefields_node, $arr_srcLig, $filerecord_parent_id, $truncate_mode ) {
	if( $treefields_node['leaf'] ) {
		return NULL ;
	}
	if( !$treefields_node['file_code'] ) {
		return NULL ;
	}
	$file_code = $treefields_node['file_code'] ;
	
	foreach( $treefields_node['children'] as $directChild ) {
		$field = $directChild['field_code'] ;
		$file_field_code = $directChild['file_field_code'] ;
		if( $directChild['field_linktype'] && $directChild['field_linkbible'] ) {
			$arr_return = paracrm_lib_dataImport_commit_processNode_bible( $directChild, $arr_srcLig ) ;
			switch( $directChild['field_linktype'] ) {
				case 'treenode' :
					$value = $arr_return['treenode_key'] ;
					break ;
				case 'entry' :
					$value = $arr_return['entry_key'] ;
					break ;
			}
			$arr_insert_file[$file_field_code] = $value ;
			continue ;
		}
		
		if( !$directChild['leaf'] ) {
			echo "??pN_f??" ;
			continue ;
		}
		
		if( !isset($arr_srcLig[$field]) ) {
			continue ;
		}
		
		switch( $directChild['field_type'] ) {
			case 'date' :
				if( !trim($arr_srcLig[$field]) ) {
					$leaf_value = '' ;
					break ;
				}
				$value = trim($arr_srcLig[$field]) ;
				$ttmp = explode(' ',$value) ;
				// Conversion(s) ?
					// 1 -> Heure numeric => xx:xx:xx
					if( count($ttmp)==2 && is_numeric($ttmp[1]) ) {
						if( !$ttmp[0] ) {
							$leaf_value = '' ;
							break ;
						}
						$strH = (int)$ttmp[1] ;
						$h = (int)($strH/10000) ;
						$strH -= ($h*10000) ;
						$m = (int)($strH/100) ;
						$strH -= ($m*100) ;
						$s = (int)($strH) ;
						
						$ttmp[1] = $h.':'.$m.':'.$s ;
						
						$value = implode(' ',$ttmp) ;
					}
				$leaf_value = date('Y-m-d H:i:s',strtotime($value)) ;
				break ;
				
			case 'number' :
				$leaf_value = $arr_srcLig[$field] ;
				if( !is_numeric($leaf_value) ) {
					$leaf_value = str_replace(',','.',$leaf_value) ;
					if( $leaf_value[0] == '.' ) {
						$leaf_value = '0'.$leaf_value ;
					}
				}
				break ;
				
			default :
				$leaf_value = $arr_srcLig[$field] ;
				break ;	
		}
		$arr_insert_file[$file_field_code] = $leaf_value ;
	}
	
	$arr_ins = array() ;
	foreach( $arr_insert_file as $file_field_code => $value ) {
		$mkey = 'field_'.$file_field_code ;
		$arr_ins[$mkey] = $value ;
	}
	return paracrm_lib_data_insertRecord_file( $file_code , $filerecord_parent_id , $arr_ins, $ignore_ifExists=($truncate_mode=='ignore'), $ignore_ifLocked=TRUE ) ;
}
function paracrm_lib_dataImport_commit_processNode_bible( $treefields_node, $arr_srcLig, $treenode_parent_key='' ) {
	if( $treefields_node['leaf'] ) {
		return NULL ;
	}
	if( !$treefields_node['bible_code'] ) {
		return NULL ;
	}
	$bible_code = $treefields_node['bible_code'] ;
	
	// separation des champs tree - entry
	 // => appel func
	$has_treenode = $has_entry = FALSE ;
	$indexed_fields_tree = array() ;
	$indexed_fields_entry = array() ;
	foreach( $treefields_node['children'] as $directChild ) {
		$field = $directChild['field_code'] ;
		switch( $directChild['bible_type'] ) {
			case 'tree' :
				$indexed_fields_tree[$field] = $directChild ;
				if( isset($arr_srcLig[$field]) ) {
					$has_treenode = TRUE ;
				}
				break ;
			case 'entry' :
				$indexed_fields_entry[$field] = $directChild ;
				if( isset($arr_srcLig[$field]) ) {
					$has_entry = TRUE ;
				}
				break ;
			default :
				echo "??pN_b??" ;
				break ;
		}
	}
	
	$arr_return = array() ;
	if( $has_treenode ) {
		$arr_return['treenode_key'] = paracrm_lib_dataImport_commit_insertBibleTreenode($bible_code, $treenode_parent_key, $indexed_fields_tree,$arr_srcLig) ;
	}
	if( $has_entry ) {
		$treenode_key = ( isset($arr_return['treenode_key']) ? $arr_return['treenode_key'] : $treenode_parent_key ) ;
		$arr_return['entry_key'] = paracrm_lib_dataImport_commit_insertBibleEntry($bible_code, $treenode_key, $indexed_fields_entry, $arr_srcLig) ;
	}
	return $arr_return ;
}
function paracrm_lib_dataImport_commit_insertBibleTreenode( $bible_code, $treenode_parent_key, $indexed_fields, $arr_srcLig ) {
	global $_opDB ;
	
	$key_field = NULL ;
	$key_value = NULL ;
	
	foreach( $indexed_fields as $t_fielddesc ) {
		$field = $t_fielddesc['field_code'] ;
		if( $t_fielddesc['bible_field_iskey'] ) {
			$key_field = $t_fielddesc['bible_field_code'] ;
		}
		if( !isset($arr_srcLig[$field]) ) {
			continue ;
		}
		
		$value = $arr_srcLig[$field] ;
		
		if( $t_fielddesc['bible_field_iskey'] || $t_fielddesc['field_type'] == 'link' ) {
			$value = strtoupper(trim($value)) ;
			if( $t_fielddesc['bible_field_iskey'] ) {
				$value = str_replace(' ','_',$value) ;
				$value = preg_replace("/[^a-zA-Z0-9_\-\/]/", "",$value) ;
			}
		}
		
		$bible_field_code = $t_fielddesc['bible_field_code'] ;
		$arr_insert_bible[$bible_field_code] = $value ;
		if( $t_fielddesc['bible_field_iskey'] ) {
			$key_value = $value ;
		}
		if( $t_fielddesc['field_type'] == 'link' ) {
			$arr_insert_bible[$bible_field_code] = json_encode(array($value)) ;
		}
	}
	
	if( $key_value===NULL ) {
		if( count($arr_insert_bible) == 0 ) {
			return ;
		}
		// Guess key
		$view = 'view_bible_'.$bible_code.'_tree' ;
		$query = "SELECT treenode_key FROM $view WHERE 1" ;
		foreach( $arr_insert_bible as $bible_field_code => $mvalue ) {
			$mvalue = $_opDB->escape_string($mvalue) ;
			$query.= " AND field_{$bible_field_code}='{$mvalue}'" ;
		}
		$treenode_key = $_opDB->query_uniqueValue($query) ;
		if( !$treenode_key ) {
			$treenode_key = md5(implode('+',$arr_insert_bible)) ;
		}
		$arr_insert_bible[$key_field] = $treenode_key ;
	} else {
		$treenode_key = $key_value ;
	}
	
	$arr_ins = array() ;
	foreach( $arr_insert_bible as $bible_field_code => $value ) {
		$mkey = 'field_'.$bible_field_code ;
		$arr_ins[$mkey] = $value ;
	}
	
	if( !$treenode_key ) {
		return NULL ;
	}
	
	if( paracrm_lib_data_getRecord_bibleTreenode( $bible_code, $treenode_key ) ) {
		paracrm_lib_data_updateRecord_bibleTreenode( $bible_code, $treenode_key, $arr_ins );
		if( $treenode_parent_key ) {
			paracrm_lib_data_bibleAssignParentTreenode( $bible_code, $treenode_key, $treenode_parent_key ) ;
		}
	} else {
		paracrm_lib_data_insertRecord_bibleTreenode( $bible_code, $treenode_key, $treenode_parent_key, $arr_ins ) ;
	}
	return $treenode_key ;
}
function paracrm_lib_dataImport_commit_insertBibleEntry( $bible_code, $treenode_key, $indexed_fields, $arr_srcLig ) {
	global $_opDB ;
	
	$key_field = NULL ;
	$key_value = NULL ;
	
	foreach( $indexed_fields as $t_fielddesc ) {
		$field = $t_fielddesc['field_code'] ;
		if( $t_fielddesc['bible_field_iskey'] ) {
			$key_field = $t_fielddesc['bible_field_code'] ;
		}
		if( !isset($arr_srcLig[$field]) ) {
			continue ;
		}
		$value = $arr_srcLig[$field] ;
		
		if( $t_fielddesc['bible_field_iskey'] || $t_fielddesc['field_type'] == 'link' ) {
			$value = strtoupper(trim($value)) ;
			if( $t_fielddesc['bible_field_iskey'] ) {
				$value = str_replace(' ','_',$value) ;
				$value = preg_replace("/[^a-zA-Z0-9_\-\/]/", "",$value) ;
			}
		}
		
		$bible_field_code = $t_fielddesc['bible_field_code'] ;
		$arr_insert_bible[$bible_field_code] = $value ;
		if( $t_fielddesc['bible_field_iskey'] ) {
			$key_value = $value ;
		}
		if( $t_fielddesc['field_type'] == 'link' ) {
			$arr_insert_bible[$bible_field_code] = json_encode(array($value)) ;
		}
	}
	
	if( $key_value===NULL ) {
		if( count($arr_insert_bible) == 0 ) {
			return ;
		}
		// Guess key
		$view = 'view_bible_'.$bible_code.'_entry' ;
		$query = "SELECT entry_key FROM $view WHERE 1" ;
		foreach( $arr_insert_bible as $bible_field_code => $mvalue ) {
			$mvalue = $_opDB->escape_string($mvalue) ;
			$query.= " AND field_{$bible_field_code}='{$mvalue}'" ;
		}
		$entry_key = $_opDB->query_uniqueValue($query) ;
		if( !$entry_key ) {
			$entry_key = md5(implode('+',$arr_insert_bible)) ;
		}
		$arr_insert_bible[$key_field] = $entry_key ;
	} else {
		$entry_key = $key_value ;
	}
	
	$arr_ins = array() ;
	foreach( $arr_insert_bible as $bible_field_code => $value ) {
		$mkey = 'field_'.$bible_field_code ;
		$arr_ins[$mkey] = $value ;
	}
	
	if( !$entry_key ) {
		return NULL ;
	}
	
	if( paracrm_lib_data_getRecord_bibleEntry( $bible_code, $entry_key ) ) {
		paracrm_lib_data_updateRecord_bibleEntry( $bible_code, $entry_key, $arr_ins );
		if( $treenode_key ) {
			paracrm_lib_data_bibleAssignTreenode( $bible_code, $entry_key, $treenode_key ) ;
		}
	} else {
		paracrm_lib_data_insertRecord_bibleEntry( $bible_code, $entry_key, $treenode_key, $arr_ins );
	}
	return $entry_key ;
}


?>