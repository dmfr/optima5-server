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
				$field['leaf'] = true ;
				$arr_tree_fields[] = $field ;
			}
			$treefields_root['children'][] = array(
				'field_code'=>$bible_code.'_tree',
				'field_text'=>'<b>'.$bible_lib.'</b>(treenodes)',
				'field_text_full'=>'<b>'.$bible_lib.'</b>(treenodes)',
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
				$field['leaf'] = true ;
				$arr_entry_fields[] = $field ;
			}
			$treefields_root['children'][] = array(
				'field_code'=>$bible_code.'_entry',
				'field_text'=>'<b>'.$bible_lib.'</b>(entries)',
				'field_text_full'=>'<b>'.$bible_lib.'</b>(entries)',
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
	$tmp_csvsrcBinary = file_get_contents($_FILES['csvsrc_binary']['tmp_name']) ;
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
	
	if( $arr_saisie['_empty'] ) {
		// Probe file format and load mapping
	}
	
	
	return paracrm_data_importTransaction_getResponse( $arr_saisie ) ;
	return array('success'=>true,'FILES'=>$_FILES) ;
}
function paracrm_data_importTransaction_setParams( $post_data, &$arr_saisie ) {
	$post_params = json_decode($post_data['csvsrc_params'],true) ;
	
	$csvsrc_params =& $arr_saisie['csvsrc_params'] ;
	$csvsrc_params['firstrow_is_header'] = ($post_params['firstrow_is_header']=='true') ;
	$csvsrc_params['delimiter'] = $post_params['delimiter'] ;
	
	//print_r($arr_saisie['csvsrc_params']) ;
	
	return paracrm_data_importTransaction_getResponse( $arr_saisie ) ;
}

function paracrm_data_importTransaction_getResponse( $arr_saisie ) {
	$data = array() ;
	
	$nb_ligs = 0 ;
	if( $arr_saisie['csvsrc_binary'] ) {
		$grid_columns = NULL ;
		$grid_data = array() ;
		
		// delimiter
		$delimiter = $arr_saisie['cfg_delimiters'][$arr_saisie['csvsrc_params']['delimiter']] ;
		
		// Paginate
		$fp = fopen("php://temp", 'r+');
		fputs($fp, $arr_saisie['csvsrc_binary']);
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
		fclose($fp);
		
		
		$data['grid_columns'] = $grid_columns ;
		$data['grid_data'] = $grid_data ;
	}
	
	$data['csvsrc_params'] = $arr_saisie['csvsrc_params'] + array('display_nbrecords'=>$nb_ligs) ;
	
	return array(
		'success'=>true,
		'data'=>$data
	) ;
}


function paracrm_data_importTransaction_doCommit( $post_data, &$arr_saisie ) {
	sleep(3) ;
	return array('success'=>true) ;
}

?>