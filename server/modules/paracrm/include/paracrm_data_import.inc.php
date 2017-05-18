<?php

function paracrm_data_importDirect( $post_data ) {
	if( !isset($_FILES['csvsrc_binary']) && !isset($_POST['csvsrc_binary']) ) {
		return array('success'=>false) ;
	}
	
	switch( $post_data['data_type'] ) {
		case 'bible' :
			$store_code = $post_data['bible_code'] ;
			break ;
			
		case 'file' :
			$store_code = $post_data['file_code'] ;
			break ;
			
		case 'table' :
			$store_code = $post_data['table_code'] ;
			break ;
			
		default :
			break ;
	}
	if( !$store_code ) {
		return array('success'=>false) ;
	}
	
	if( isset($_FILES['csvsrc_binary']) ) {
		$handle = fopen($_FILES['csvsrc_binary']['tmp_name'],'rb') ;
	} elseif( $_POST['csvsrc_binary'] ) {
		$handle = tmpfile() ;
		fputs($handle,$_POST['csvsrc_binary']) ;
		rewind($handle);
	} else {
		return array('success'=>false) ;
	}
	if( $_POST['do_preprocess'] ) {
		$handle = paracrm_lib_dataImport_preHandle($handle) ;
		rewind($handle) ;
	}
	paracrm_lib_dataImport_commit_processHandle( $post_data['data_type'],$store_code, $handle ) ;
	fclose($handle) ;
	
	return array('success'=>true) ;
}


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
			case 'table' :
				$arr_saisie['table_code'] = $post_data['table_code'] ;
				$arr_saisie['table_is_new'] = !$post_data['table_code'] ;
				break ;
			default :
				return array('success'=>false) ;
		}
		$arr_saisie['csvsrc_binary'] = NULL ;
		$arr_saisie['csvsrc_params'] = array() ;
		$arr_saisie['cfg_delimiters'] = array('comma'=>',','semicolon'=>';','pipe'=>'|') ;
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
				
			case 'table' :
				if( !Auth_Manager::getInstance()->auth_query_sdomain_action(
						Auth_Manager::sdomain_getCurrent(),
						'tables',
						array('table_code'=>$post_data['table_code']),
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
			case 'do_commit_new' :
				$json = paracrm_data_importTransaction_doCommitNew( $post_data , $arr_saisie ) ;
				break ;
			
			default :
				$json = array('success'=>false) ;
				break ;
		}
		
		if( $post_data['_subaction'] == 'end' )
		{
			unset($_SESSION['transactions'][$transaction_id]) ;
			return array('success'=>true) ;
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
	switch( $arr_saisie['data_type'] ) {
		case 'bible' :
			$store_code = $arr_saisie['bible_code'] ;
			break ;
		case 'file' :
			$store_code = $arr_saisie['file_code'] ;
			break ;
		case 'table' :
			$store_code = $arr_saisie['table_code'] ;
			break ;
		default :
			return array('success'=>false) ;
	}
	if( $arr_saisie['table_is_new'] ) {
	
	} elseif( ($arr_saisie['treefields_root'] = paracrm_lib_dataImport_getTreefieldsRoot( $arr_saisie['data_type'],$store_code )) === FALSE ) {
		return array('success'=>false) ;
	}
	
	return array(
		'success'=>true,
		'_mirror'=>$post_data,
		'transaction_id'=>$post_data['_transaction_id'],
		'treefields_root' => $arr_saisie['treefields_root'],
		'is_new' => $arr_saisie['table_is_new']
	) ;
}
function paracrm_data_importTransaction_upload( $post_data, &$arr_saisie ) {
	global $_opDB ;
	
	$arr_saisie['csvsrc_binary'] = NULL ;
	
	$tmp_csvsrcBinary = file_get_contents($_FILES['csvsrc_binary']['tmp_name']) ;
	
	$fp = fopen("php://temp", 'r+');
	fputs($fp, $tmp_csvsrcBinary);
	
	rewind($fp);
	$fp = paracrm_lib_dataImport_preHandle($fp) ;
	
	$map_delimiter_nbCols = array() ;
	foreach( $arr_saisie['cfg_delimiters'] as $delimiter_code=>$delimiter_symbol ) {
		rewind($fp);
		$map_delimiter_nbCols[$delimiter_code] = count(fgetcsv($fp,0,$delimiter_symbol)) ;
	}
	arsort($map_delimiter_nbCols) ;
	reset($map_delimiter_nbCols) ;
	$tmp_delimiter = key($map_delimiter_nbCols) ;
		
	rewind($fp) ;
	$arr_saisie['csvsrc_binary'] = stream_get_contents($fp) ; ;
	$arr_saisie['csvsrc_params']['delimiter'] = $tmp_delimiter ;
	
	$arr_saisie['_firstUpload'] = TRUE ;
	
	return paracrm_data_importTransaction_getResponse( $arr_saisie ) ;
}
function paracrm_data_importTransaction_setParams( $post_data, &$arr_saisie ) {
	$post_params = json_decode($post_data['csvsrc_params'],true) ;
	
	$csvsrc_params =& $arr_saisie['csvsrc_params'] ;
	$csvsrc_params['firstrow_is_header'] = ($post_params['firstrow_is_header']=='true' || $arr_saisie['table_is_new']) ;
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
		switch( $arr_saisie['data_type'] ) {
			case 'bible' :
				$store_code = $arr_saisie['bible_code'] ;
				break ;
			case 'file' :
				$store_code = $arr_saisie['file_code'] ;
				break ;
			case 'table' :
				$store_code = $arr_saisie['table_code'] ;
				break ;
			default :
				$store_code = NULL ;
				break ;
		}
		if( $importmap_id = paracrm_lib_dataImport_probeMappingId($arr_saisie['data_type'],$store_code, $arr_saisie['csvsrc_arrHeadertxt']) ) {
			$arr_saisie['importmap_id'] = $importmap_id ;
			$data['map_fieldCode_csvsrcIdx'] = paracrm_lib_dataImport_getMapping($importmap_id) ;
			$arr_saisie['csvsrc_params']['firstrow_is_header'] = TRUE ;
			$arr_saisie['csvsrc_params']['truncate_mode'] = paracrm_lib_dataImport_getTruncateMode($importmap_id) ;
		}
		elseif( $importmap_id = paracrm_lib_dataImport_probeMappingId($arr_saisie['data_type'],$store_code, $arr_saisie['csvsrc_arrHeadertxt'], $strict_mode=FALSE) ) {
			$arr_saisie['importmap_id'] = NULL ;
			$data['map_fieldCode_csvsrcIdx'] = paracrm_lib_dataImport_getMapping($importmap_id, $arr_saisie['csvsrc_arrHeadertxt']) ;
			$arr_saisie['csvsrc_params']['firstrow_is_header'] = TRUE ;
			$arr_saisie['csvsrc_params']['truncate_mode'] = paracrm_lib_dataImport_getTruncateMode($importmap_id) ;
		} elseif( $arr_saisie['table_is_new'] ) {
			$arr_saisie['csvsrc_params']['firstrow_is_header'] = TRUE ;
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
	$truncate_mode = $post_data['truncate_mode'] ;
	
	// Validate mapping
	$validation_error = NULL ;
	switch( $arr_saisie['data_type'] ) {
		case 'bible' :
		case 'table' :
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
	if( !$map_fieldCode_csvsrcIdx || count($map_fieldCode_csvsrcIdx) == 0 ) {
		$validation_error = 'Empty mapping !' ;
	}
	if( $validation_error ) {
		return array('success'=>false, 'error'=>$validation_error) ;
	}
	
	// Save mapping
	if( $arr_saisie['csvsrc_params']['firstrow_is_header'] && $truncate_mode!='delete' ) {
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
		$arr_update['target_tablecode'] = ($arr_saisie['data_type']=='table' ? $arr_saisie['table_code'] : '') ;
		$arr_update['truncate_mode'] = $truncate_mode ;
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
	
	paracrm_lib_dataImport_commit_processStream( $arr_saisie['treefields_root'], $map_fieldCode_csvsrcIdx, $fp, $delimiter, $truncate_mode ) ;
	
	return array('success'=>true) ;
}
function paracrm_data_importTransaction_doCommitNew( $post_data, &$arr_saisie ) {
	global $_opDB ;
	
	$define_data = json_decode($post_data['define_data'],true) ;
	$table_code = strtoupper(trim($define_data['store_code'])) ;
	
	
	// Define transaction ?
	$json = paracrm_define_manageTransaction( array(
		'_subaction' => 'init_new',
		'data_type' => 'table'
	)) ;
	$transaction_id = $json['transaction_id'] ;
	$json = paracrm_define_manageTransaction( array(
		'_transaction_id' => $transaction_id,
		'_subaction' => 'ent_set',
		'store_code' => $table_code,
		'store_lib' => $table_code,
		'store_type' => ($define_data['store_type_primarykey'] ? 'table_primarykey' : '')
	)) ;
	$tab_fields = array() ;
	foreach( $define_data['define_fields'] as &$field ) {
		$field['new_field_code'] = strtoupper(trim($field['new_field_code'])) ;
		$tab_fields[] = array(
			'table_field_code' => strtoupper($field['new_field_code']),
			'table_field_type' => ($field['new_field_type']?$field['new_field_type']:'string'),
			'table_field_is_index' => $field['new_field_is_index'],
			'table_field_is_primarykey' => $field['new_field_is_primarykey']
		);
	}
	unset($field) ;
	paracrm_define_manageTransaction( array(
		'_transaction_id' => $transaction_id,
		'_subaction' => 'fields_set',
		'data' => json_encode($tab_fields)
	)) ;
	$json = paracrm_define_manageTransaction( array('_transaction_id' => $transaction_id, '_subaction' => 'save_and_apply') ) ;
	if( !$json['success'] ) {
		return array('success'=>false, 'error'=>'Cannot create new table', 'debug'=>$json) ;
	}
	
	
	// Recup de l'arbre ?
	$arr_saisie['treefields_root'] = paracrm_lib_dataImport_getTreefieldsRoot('table',$table_code) ;
	
	
	// Importation données ?
	$map_fieldCode_csvsrcIdx = array() ;
	$idx=0 ;
	foreach( $define_data['define_fields'] as $field ) {
		$map_fieldCode_csvsrcIdx[$field['new_field_code']] = $idx ;
		$idx++;
	}
	$arr_update = array() ;
	$arr_update['csvsrc_length'] = $arr_saisie['csvsrc_length'] ;
	$arr_update['target_tablecode'] = $table_code ;
	$arr_update['truncate_mode'] = '' ;
	$_opDB->insert('importmap',$arr_update) ;
	$arr_saisie['importmap_id'] = $_opDB->insert_id() ;
	
	
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
	
	
	// Open file pointer
	$delimiter = $arr_saisie['cfg_delimiters'][$arr_saisie['csvsrc_params']['delimiter']] ;
	$fp = fopen("php://temp", 'r+');
	fputs($fp, $arr_saisie['csvsrc_binary']);
	rewind($fp);
	if( $arr_saisie['csvsrc_params']['firstrow_is_header'] ) {
		fgets($fp) ;
	}
	
	paracrm_lib_dataImport_commit_processStream( $arr_saisie['treefields_root'], $map_fieldCode_csvsrcIdx, $fp, $delimiter, $truncate_mode ) ;
	
	return array('success'=>true) ;
}

?>
