<?php

function paracrm_data_importTransaction( $post_data )
{
	if( $post_data['_action'] == 'data_importTransaction' && $post_data['_subaction'] == 'init' )
	{
		// ouverture transaction
		$transaction_id = $_SESSION['next_transaction_id']++ ;
		
		$_SESSION['transactions'][$transaction_id] = array() ;
		$_SESSION['transactions'][$transaction_id]['transaction_code'] = 'paracrm_data_importTransaction' ;
		
		$arr_saisie = array() ;
		$arr_saisie['_new'] = TRUE ;
		$arr_saisie['data_type'] = $post_data['data_type'] ;
		switch( $arr_saisie['data_type'] ) {
			case 'bible' :
				$arr_saisie['bible_code'] = $post_data['bible_code'] ;
				break ;
			case 'file' :
				$arr_saisie['file_code'] = $post_data['file_code'] ;
				break ;
			default :
				return array('success'=>false) ;
		}
		$arr_saisie['csvsrc_binary'] = NULL ;
		$arr_saisie['csvsrc_params'] = array() ;
		$arr_saisie['cfg_delimiters'] = array('comma'=>',','semicolon'=>';') ;
		$_SESSION['transactions'][$transaction_id]['arr_saisie'] = $arr_saisie ;
		
		$post_data['_transaction_id'] = $transaction_id ;
		
		
		// ******* Auth *******
		switch( $post_data['data_type'] ) {
			case 'bible' :
				if( !Auth_Manager::getInstance()->auth_query_sdomain_action(
						Auth_Manager::sdomain_getCurrent(),
						'bible',
						array('bible_code'=>$post_data['bible_code']),
						$write=true
					)
				) {
					return array('success'=>false, 'denied'=>true) ;
				}
				break ;
				
			case 'file' :
				if( !Auth_Manager::getInstance()->auth_query_sdomain_action(
						Auth_Manager::sdomain_getCurrent(),
						'files',
						array('file_code'=>$post_data['file_code']),
						$write=true
					)
				) {
					return array('success'=>false, 'denied'=>true) ;
				}	
				break ;
		}
	}
	
	
	if( $post_data['_action'] == 'data_importTransaction' && $post_data['_transaction_id'] )
	{
		if( !$_SESSION['transactions'][$post_data['_transaction_id']] )
			return NULL ;
		$transaction_id = $post_data['_transaction_id'] ;
		$arr_transaction = $_SESSION['transactions'][$transaction_id] ;
		if( $arr_transaction['transaction_code'] != 'paracrm_data_importTransaction' )
			return NULL ;
			
		$arr_saisie = $arr_transaction['arr_saisie'] ;
		
		// print_r($arr_saisie) ;
		switch( $_POST['_subaction'] ) {
			case 'init' :
				$json = paracrm_data_importTransaction_init( $post_data , $arr_saisie ) ;
				break ;
				
			case 'csvsrc_upload' :
				$json = paracrm_data_importTransaction_upload( $post_data , $arr_saisie ) ;
				break ;
			case 'params_set' :
				$json = paracrm_data_importTransaction_setParams( $post_data , $arr_saisie ) ;
				break ;
			
			case 'do_commit' :
				$json = paracrm_data_importTransaction_doCommit( $post_data , $arr_saisie ) ;
				break ;
			
			default :
				$json = array('success'=>false) ;
				break ;
		}
		
		if( is_array($arr_saisie) )
		{
			$_SESSION['transactions'][$transaction_id]['arr_saisie'] = $arr_saisie ;
		}
		else
		{
			unset($_SESSION['transactions'][$transaction_id]) ;
		}
		
		if( $arr_auth_status ) {
			$json['auth_status'] = $arr_auth_status ;
		}
		return $json ;
	}
}

function paracrm_data_importTransaction_init( $post_data, &$arr_saisie ) {
	global $_opDB ;
	
	switch( $arr_saisie['data_type'] ) {
		case 'file' :
			$TAB = paracrm_lib_file_access( $arr_saisie['file_code'] ) ;
			$arr_saisie['select_map'] = $TAB['select_map'] ;
			$arr_saisie['treefields_root'] = paracrm_queries_builderTransaction_getTreeFields( $arr_saisie ) ;
			break ;
			
			
		case 'bible' ;
			$bible_code = $arr_saisie['bible_code'] ;
			$query = "SELECT bible_lib FROM define_bible WHERE bible_code='$bible_code'" ;
			$bible_lib = $_opDB->query_uniqueValue($query) ;
		
			$treefields_root = array();
			$treefields_root['root'] = true ;
			$treefields_root['text'] = '.' ;
			$treefields_root['expanded'] = true ;
			$treefields_root['children'] = array() ;
			
			$arr_tree_fields = array() ;
			$query = "SELECT * FROM define_bible_tree WHERE bible_code='{$arr_saisie['bible_code']}' ORDER BY tree_field_index" ;
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
				$field['bible_field_iskey'] = ($arr['entry_field_is_key']=='O')?true:false ;
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
			$query = "SELECT * FROM define_bible_entry WHERE bible_code='{$arr_saisie['bible_code']}' ORDER BY entry_field_index" ;
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
			
			$arr_saisie['treefields_root'] = $treefields_root ;
			break ;
			
			
		default :
			return array('success'=>false) ;
	}
	
	return array(
		'success'=>true,
		'_mirror'=>$post_data,
		'transaction_id'=>$post_data['_transaction_id'],
		'treefields_root' => $arr_saisie['treefields_root']
	) ;
}
function paracrm_data_importTransaction_upload( $post_data, &$arr_saisie ) {
	global $_opDB ;
	
	$arr_saisie['csvsrc_binary'] = NULL ;
	
	if( $obj_xml = @simplexml_load_file($_FILES['csvsrc_binary']['tmp_name']) ) {
		var_dump( count(paracrm_data_importTransaction_upload_searchXML( $obj_xml )) ) ;
		
		$tmp_csvsrcBinary ;
	} else {
		$tmp_csvsrcBinary = file_get_contents($_FILES['csvsrc_binary']['tmp_name']) ;
	}
	
	$fp = fopen("php://temp", 'r+');
	fputs($fp, $tmp_csvsrcBinary);
	$map_delimiter_nbCols = array() ;
	foreach( $arr_saisie['cfg_delimiters'] as $delimiter_code=>$delimiter_symbol ) {
		rewind($fp);
		$map_delimiter_nbCols[$delimiter_code] = count(fgetcsv($fp,0,$delimiter_symbol)) ;
	}
	arsort($map_delimiter_nbCols) ;
	reset($map_delimiter_nbCols) ;
	$tmp_delimiter = key($map_delimiter_nbCols) ;
		
	$arr_saisie['csvsrc_binary'] = $tmp_csvsrcBinary ;
	$arr_saisie['csvsrc_params']['delimiter'] = $tmp_delimiter ;
	
	$arr_saisie['_firstUpload'] = TRUE ;
	
	return paracrm_data_importTransaction_getResponse( $arr_saisie ) ;
}
function paracrm_data_importTransaction_upload_searchXML( $obj_xml ) {
	echo "foreaching!" ;
	foreach( $obj_xml as $mkey => $mvalue ) {
		if( $mkey == 'G_ONE' ) {
			echo "dumping!" ;
			var_dump($mvalue) ;
		}
		if( is_array($mvalue) ) {
			return $mvalue ;
		} elseif( $ret = paracrm_data_importTransaction_upload_searchXML( $mvalue ) ) {
			return $ret ;
		}
	}
	return NULL ;
}
function paracrm_data_importTransaction_setParams( $post_data, &$arr_saisie ) {
	$post_params = json_decode($post_data['csvsrc_params'],true) ;
	
	$csvsrc_params =& $arr_saisie['csvsrc_params'] ;
	$csvsrc_params['firstrow_is_header'] = ($post_params['firstrow_is_header']=='true') ;
	$csvsrc_params['delimiter'] = $post_params['delimiter'] ;
	
	//print_r($arr_saisie['csvsrc_params']) ;
	
	return paracrm_data_importTransaction_getResponse( $arr_saisie ) ;
}

function paracrm_data_importTransaction_getResponse( &$arr_saisie ) {
	global $_opDB ;
	
	$data = array() ;
	
	$nb_ligs = 0 ;
	if( !$arr_saisie['csvsrc_binary'] ) {
		array('success'=>false) ;
	}
		
	// delimiter
	$delimiter = $arr_saisie['cfg_delimiters'][$arr_saisie['csvsrc_params']['delimiter']] ;
		
	// Open file pointer
	$fp = fopen("php://temp", 'r+');
	fputs($fp, $arr_saisie['csvsrc_binary']);
	
	// Store useful values
	rewind($fp);
	$arr_csv = fgetcsv($fp,0,$delimiter) ;
	$arr_saisie['csvsrc_length'] = count($arr_csv) ;
	$arr_saisie['csvsrc_arrHeadertxt'] = array() ;
	foreach( $arr_csv as $i => $col_value ) {
		$arr_saisie['csvsrc_arrHeadertxt'][] = trim($col_value) ;
	}
	
	// If first upload...
	if( $arr_saisie['_firstUpload'] ) {
		$arr_saisie['_firstUpload'] = FALSE ;
		
		// .. probe file format and load mapping
		$csvsrc_length = $arr_saisie['csvsrc_length'] ;
		$target_biblecode = ($arr_saisie['data_type']=='bible' ? $arr_saisie['bible_code'] : '') ;
		$target_filecode = ($arr_saisie['data_type']=='file' ? $arr_saisie['file_code'] : '') ;
		
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
			
			if( $test_arrHeadertxt === $arr_saisie['csvsrc_arrHeadertxt'] ) {
				$arr_saisie['importmap_id'] = $importmap_id ;
				$map_fieldCode_csvsrcIdx = array() ;
				foreach( $test_arrTargetfieldmapcode as $i => $arrTargetfieldmapcode ) {
					foreach( json_decode($arrTargetfieldmapcode,true) as $target_fieldmapcode ) {
						$map_fieldCode_csvsrcIdx[$target_fieldmapcode] = $i ;
					}
				}
				$data['map_fieldCode_csvsrcIdx'] = $map_fieldCode_csvsrcIdx ;
				$arr_saisie['csvsrc_params']['firstrow_is_header'] = TRUE ;
				break ;
			}
		}
	}
	
	// ****** Paginate *******
	$grid_columns = NULL ;
	$grid_data = array() ;
	rewind($fp);
	while( !feof($fp) ){
		if( $nb_ligs > 25 ) {
			if( fgets($fp,4096) ) {
				$nb_ligs++ ;
			}
			continue ;
		}
		
		$arr_csv = fgetcsv($fp,0,$delimiter) ;
		if( !$arr_csv ) {
			continue ;
		}
		
		if( !is_array($grid_columns) ) {
			$grid_columns = array() ;
			if( $arr_saisie['csvsrc_params']['firstrow_is_header'] ) {
				foreach( $arr_csv as $i => $col_value ) {
					$col_key = 'idx_'.$i ;
					$col_value = trim($col_value) ;
					$grid_columns[] = array('dataIndex'=>$col_key, 'text'=>$col_value) ;
				}
				continue ;
			} else {
				for( $i=0 ; $i<count($arr_csv) ; $i++ ) {
					$col_key = 'idx_'.$i ;
					$col_value = 'Col #'.$i;
					$grid_columns[] = array('dataIndex'=>$col_key, 'text'=>$col_value) ;
				}
			}
		}
		
		$nb_ligs++ ;
		$row = array() ;
		foreach( $arr_csv as $i => $value ) {
			$col_key = 'idx_'.$i ;
			$row[$col_key] = $value ;
		}
		$grid_data[] = $row ;
	}
	$data['grid_columns'] = $grid_columns ;
	$data['grid_data'] = $grid_data ;
	
	// Send back parameters
	$data['csvsrc_params'] = $arr_saisie['csvsrc_params'] + array('display_nbrecords'=>$nb_ligs) ;
	
	// Close FP
	fclose($fp);
	
	return array(
		'success'=>true,
		'data'=>$data
	) ;
}


function paracrm_data_importTransaction_doCommit( $post_data, &$arr_saisie ) {
	global $_opDB ;
	$arr_indexed_treefields = paracrm_queries_process_linearTreefields($arr_saisie['treefields_root']) ;
	
	// Get mapping
	$map_fieldCode_csvsrcIdx = json_decode($post_data['map_fieldCode_csvsrcIdx'],true) ;
	
	// Validate mapping
	$validation_error = NULL ;
	switch( $arr_saisie['data_type'] ) {
		case 'bible' :
			break ;
			
		case 'file' :
			// Si lien bible renseigné, au moins un champ sur le bible_type=entry
			$tarr_bibleCode_tOrF = array() ;
			foreach( $map_fieldCode_csvsrcIdx as $fieldmapcode => $csvsrc_idx ) {
				$field_dico = $arr_indexed_treefields[$fieldmapcode] ;
				if( $bible_code = $field_dico['bible_code'] ) {
					if( !isset($tarr_bibleCode_tOrF[$bible_code]) ) {
						$tarr_bibleCode_tOrF[$bible_code] = FALSE ;
					}
					if( $field_dico['bible_type'] == 'entry' && $field_dico['field_linktype'] == 'entry' ) {
						$tarr_bibleCode_tOrF[$bible_code] = TRUE ;
					}
					if( $field_dico['bible_type'] == 'tree' && $field_dico['field_linktype'] == 'treenode' ) {
						$tarr_bibleCode_tOrF[$bible_code] = TRUE ;
					}
				}
			}
			foreach( $tarr_bibleCode_tOrF as $torf ) {
				if( !$torf ) {
					$validation_error = 'Inconsistent fields linking to bible(s)' ;
				}
			}
			break ;
			
		default :
			return array('success'=>true) ;
	}
	if( $validation_error ) {
		return array('success'=>false, 'error'=>$validation_error) ;
	}
	
	// Save mapping
	if( $arr_saisie['csvsrc_params']['firstrow_is_header'] ) {
		if( !$arr_saisie['importmap_id'] ) {
			$arr_ins = array() ;
			$_opDB->insert('importmap',$arr_ins) ;
			$arr_saisie['importmap_id'] = $_opDB->insert_id() ;
		}
		$arr_cond = array() ;
		$arr_cond['importmap_id'] = $arr_saisie['importmap_id'] ;
		$arr_update = array() ;
		$arr_update['csvsrc_length'] = $arr_saisie['csvsrc_length'] ;
		$arr_update['target_biblecode'] = ($arr_saisie['data_type']=='bible' ? $arr_saisie['bible_code'] : '') ;
		$arr_update['target_filecode'] = ($arr_saisie['data_type']=='file' ? $arr_saisie['file_code'] : '') ;
		$_opDB->update('importmap',$arr_update,$arr_cond) ;
		
		$query = "DELETE FROM importmap_column WHERE importmap_id='{$arr_saisie['importmap_id']}'" ;
		$_opDB->query($query) ;
		$ssid = $col_idx = 0 ;
		foreach( $arr_saisie['csvsrc_arrHeadertxt'] as $col_value ) {
			$ssid++ ;
			
			$arr_ins = array() ;
			$arr_ins['importmap_id'] = $arr_saisie['importmap_id'] ;
			$arr_ins['importmap_column_ssid'] = $ssid ;
			$arr_ins['csvsrc_headertxt'] = $col_value ;
			$arr_ins['target_fieldmapcode'] = json_encode(array_keys($map_fieldCode_csvsrcIdx,$col_idx)) ;
			$_opDB->insert('importmap_column',$arr_ins) ;
			
			$col_idx++ ;
		}
	}
	
	// Open file pointer
	$delimiter = $arr_saisie['cfg_delimiters'][$arr_saisie['csvsrc_params']['delimiter']] ;
	$fp = fopen("php://temp", 'r+');
	fputs($fp, $arr_saisie['csvsrc_binary']);
	rewind($fp);
	if( $arr_saisie['csvsrc_params']['firstrow_is_header'] ) {
		fgets($fp) ;
	}
	while( !feof($fp) ){
		$arr_csv = fgetcsv($fp,0,$delimiter) ;
		
		$arr_srcLig = array() ;
		foreach( $map_fieldCode_csvsrcIdx as $fieldCode => $sIdx ) {
			$arr_srcLig[$fieldCode] = $arr_csv[$sIdx] ;
		}
		
		paracrm_data_importTransaction_doCommit_processNode($arr_saisie['treefields_root'],$arr_srcLig) ;
	}
	fclose($fp) ;
	
	return array('success'=>true) ;
}


function paracrm_data_importTransaction_doCommit_processNode( $treefields_node, $arr_srcLig ) {
	if( !$treefields_node['root'] ) {
		return ;
	}
	$filerecord_id = 0 ;
	$treenode_key = '' ;
	foreach( $treefields_node['children'] as $directChild ) {
		if( isset($directChild['file_code']) ) {
			$filerecord_id = paracrm_data_importTransaction_doCommit_processNode_file( $directChild, $arr_srcLig, $filerecord_id );
			continue ;
		}
		if( isset($directChild['bible_code']) ) {
			$arr_return = paracrm_data_importTransaction_doCommit_processNode_bible( $directChild, $arr_srcLig, $treenode_key );
			if( isset($arr_return['treenode_key']) ) {
				$treenode_key = $arr_return['treenode_key'] ;
			}
			continue ;
		}
		echo "??pN??" ;
	}
}
function paracrm_data_importTransaction_doCommit_processNode_file( $treefields_node, $arr_srcLig, $filerecord_parent_id=0 ) {
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
			$arr_return = paracrm_data_importTransaction_doCommit_processNode_bible( $directChild, $arr_srcLig ) ;
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
		
		switch( $directChild['field_type'] ) {
			case 'date' :
				$leaf_value = date('Y-m-d H:i:s',strtotime($arr_srcLig[$field])) ;
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
	return paracrm_lib_data_insertRecord_file( $file_code , $filerecord_parent_id , $arr_ins ) ;
}
function paracrm_data_importTransaction_doCommit_processNode_bible( $treefields_node, $arr_srcLig, $treenode_parent_key='' ) {
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
		$arr_return['treenode_key'] = paracrm_data_importTransaction_doCommit_insertBibleTreenode($bible_code, $treenode_parent_key, $indexed_fields_tree,$arr_srcLig) ;
	}
	if( $has_entry ) {
		$treenode_key = ( isset($arr_return['treenode_key']) ? $arr_return['treenode_key'] : $treenode_parent_key ) ;
		$arr_return['entry_key'] = paracrm_data_importTransaction_doCommit_insertBibleEntry($bible_code, $treenode_key, $indexed_fields_entry, $arr_srcLig) ;
	}
	return $arr_return ;
}
function paracrm_data_importTransaction_doCommit_insertBibleTreenode( $bible_code, $treenode_parent_key, $indexed_fields, $arr_srcLig ) {
	$key_field = NULL ;
	$key_value = NULL ;
	
	foreach( $indexed_fields as $t_fielddesc ) {
		$field = $t_fielddesc['field_code'] ;
		if( $t_fielddesc['bible_field_iskey'] ) {
			$key_field = $t_fielddesc['bible_field_code'] ;
		}
		if( !$arr_srcLig[$field] ) {
			continue ;
		}
		if( $t_fielddesc['bible_field_iskey'] ) {
			$key_value = $arr_srcLig[$field] ;
		}
		
		$bible_field_code = $t_fielddesc['bible_field_code'] ;
		$arr_insert_bible[$bible_field_code] = $arr_srcLig[$field] ;
	}
	
	if( $key_value===NULL ) {
		if( count($arr_insert_bible) == 0 ) {
			return ;
		}
		// Guess key
		$view = 'view_bible_'.$bible_code.'_tree' ;
		$query = "SELECT treenode_key FROM $view WHERE 1" ;
		foreach( $arr_insert_bible as $bible_field_code => $mvalue ) {
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
function paracrm_data_importTransaction_doCommit_insertBibleEntry( $bible_code, $treenode_key, $indexed_fields, $arr_srcLig ) {
	$key_field = NULL ;
	$key_value = NULL ;
	
	foreach( $indexed_fields as $t_fielddesc ) {
		$field = $t_fielddesc['field_code'] ;
		if( $t_fielddesc['bible_field_iskey'] ) {
			$key_field = $t_fielddesc['bible_field_code'] ;
		}
		if( !$arr_srcLig[$field] ) {
			continue ;
		}
		if( $t_fielddesc['bible_field_iskey'] ) {
			$key_value = $arr_srcLig[$field] ;
		}
		
		$bible_field_code = $t_fielddesc['bible_field_code'] ;
		$arr_insert_bible[$bible_field_code] = $arr_srcLig[$field] ;
	}
	
	if( $key_value===NULL ) {
		if( count($arr_insert_bible) == 0 ) {
			return ;
		}
		// Guess key
		$view = 'view_bible_'.$bible_code.'_entry' ;
		$query = "SELECT entry_key FROM $view WHERE 1" ;
		foreach( $arr_insert_bible as $bible_field_code => $mvalue ) {
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