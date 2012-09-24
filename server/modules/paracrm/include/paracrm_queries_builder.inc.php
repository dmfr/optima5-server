<?php
function paracrm_queries_builderTransaction( $post_data )
{
	if( $post_data['_action'] == 'queries_builderTransaction' && $post_data['_subaction'] == 'init' )
	{
		// ouverture transaction
		$transaction_id = $_SESSION['next_transaction_id']++ ;
		
		$_SESSION['transactions'][$transaction_id] = array() ;
		$_SESSION['transactions'][$transaction_id]['transaction_code'] = 'paracrm_queries_builderTransaction' ;
		
		$arr_saisie = array() ;
		$arr_saisie['target_file_code'] = $post_data['target_file_code'] ;
		$_SESSION['transactions'][$transaction_id]['arr_saisie'] = $arr_saisie ;
		$_SESSION['transactions'][$transaction_id]['arr_RES'] = array() ;
		
		$post_data['_transaction_id'] = $transaction_id ;
	}
	
	
	if( $post_data['_action'] == 'queries_builderTransaction' && $post_data['_transaction_id'] )
	{
		if( !$_SESSION['transactions'][$post_data['_transaction_id']] )
			return NULL ;
		$transaction_id = $post_data['_transaction_id'] ;
		$arr_transaction = $_SESSION['transactions'][$transaction_id] ;
		if( $arr_transaction['transaction_code'] != 'paracrm_queries_builderTransaction' )
			return NULL ;
			
		$arr_saisie = $arr_transaction['arr_saisie'] ;
		
		if( $post_data['_subaction'] == 'init' )
		{
			$json =  paracrm_queries_builderTransaction_init( $post_data , $arr_saisie ) ;
		}
		if( $post_data['_subaction'] == 'run' )
		{
			$json =  paracrm_queries_builderTransaction_runQuery( $post_data , $arr_saisie ) ;
		}
		if( $post_data['_subaction'] == 'submit' )
		{
			$json =  paracrm_queries_builderTransaction_submit( $post_data , $arr_saisie ) ;
		}
		if( $post_data['_subaction'] == 'save' || $post_data['_subaction'] == 'saveas' || $post_data['_subaction'] == 'delete' )
		{
			$json =  paracrm_queries_builderTransaction_save( $post_data , $arr_saisie ) ;
		}
		
		
		
		if( $post_data['_subaction'] == 'res_get' )
		{
			$json =  paracrm_queries_builderTransaction_resGet( $post_data ) ;
		}
		if( $post_data['_subaction'] == 'exportXLS' )
		{
			$json =  paracrm_queries_builderTransaction_exportXLS( $post_data ) ;
		}
		
		
		

		if( is_array($arr_saisie) )
		{
			$_SESSION['transactions'][$transaction_id]['arr_saisie'] = $arr_saisie ;
		}
		else
		{
			unset($_SESSION['transactions'][$transaction_id]) ;
		}
		
		return $json ;
	}
}


function paracrm_queries_builderTransaction_init( $post_data , &$arr_saisie )
{
	global $_opDB ;
	
	/*
	************ INITIALISATION *********
	- structure 'tree' du fichier
	- remplissage des champs
	*******************************
	*/
	if( $post_data['is_new'] == 'true' )
	{
		$arr_saisie['target_file_code'] = $post_data['target_file_code'] ;
		
		$arr_saisie['fields_where'] = array() ;
		$arr_saisie['fields_group'] = array() ;
		$arr_saisie['fields_select'] = array() ;
	}
	elseif( $post_data['query_id'] > 0 )
	{
		$query = "SELECT * FROM query WHERE query_id='{$post_data['query_id']}'" ;
		$result = $_opDB->query($query) ;
		$arr = $_opDB->fetch_assoc($result) ;
		if( !$arr )
		{
			$transaction_id = $post_data['_transaction_id'] ;
			unset($_SESSION['transactions'][$transaction_id]) ;
			return array('success'=>false) ;
		}
		$arr_saisie['query_id'] = $arr['query_id'] ;
		$arr_saisie['query_name'] = $arr['query_name'] ;
		$arr_saisie['target_file_code'] = $arr['target_file_code'] ;
		paracrm_queries_builderTransaction_loadFields( $arr_saisie , $arr_saisie['query_id'] ) ;
	}
	else
	{
		$transaction_id = $post_data['_transaction_id'] ;
		unset($_SESSION['transactions'][$transaction_id]) ;
		return array('success'=>false) ;
	}
	
	
	
	$TAB = paracrm_lib_file_access( $arr_saisie['target_file_code'] ) ;
	$arr_saisie['select_map'] = $TAB['select_map'] ;
	$arr_saisie['treefields_root'] = paracrm_queries_builderTransaction_getTreeFields( $arr_saisie ) ;
	//$treefields = array() ;
	
	
	
	
	


	return array('success'=>true,
					'_mirror'=>$post_data,
					'query_id'=>$arr_saisie['query_id'],
					'query_name'=>$arr_saisie['query_name'],
					'transaction_id'=>$post_data['_transaction_id'],
					'treefields_root' => $arr_saisie['treefields_root'],
					'data_wherefields' => $arr_saisie['fields_where'],
					'data_groupfields' => $arr_saisie['fields_group'],
					'data_selectfields' => $arr_saisie['fields_select']
					) ;
}
function paracrm_queries_builderTransaction_submit( $post_data , &$arr_saisie )
{
	global $_opDB ;
	
	$arr_saisie['fields_where'] = json_decode($post_data['data_wherefields'],TRUE) ;
	$arr_saisie['fields_group'] = json_decode($post_data['data_groupfields'],TRUE) ;
	$arr_saisie['fields_select'] = json_decode($post_data['data_selectfields'],TRUE) ;

	return array('success'=>true,'test'=>json_decode($post_data['data_selectfields'],TRUE)) ;
}
function paracrm_queries_builderTransaction_save( $post_data , &$arr_saisie )
{
	global $_opDB ;
	
	if( $post_data['_subaction'] == 'save' )
	{
		if( !$arr_saisie['query_id'] )
			return array('success'=>false) ;
		
		return paracrm_queries_builderTransaction_saveFields( $arr_saisie, $arr_saisie['query_id'] ) ;
	}

	if( $post_data['_subaction'] == 'saveas' )
	{
		$arr_ins = array() ;
		$arr_ins['query_name'] = $post_data['query_name'] ;
		$arr_ins['target_file_code'] = $arr_saisie['target_file_code'] ;
		$_opDB->insert('query',$arr_ins) ;
		
		$arr_saisie['query_id'] = $_opDB->insert_id() ;
		
		return paracrm_queries_builderTransaction_saveFields( $arr_saisie, $arr_saisie['query_id'] ) ;
	}
	
	
	if( $post_data['_subaction'] == 'delete' )
	{
		if( !$arr_saisie['query_id'] )
			return array('success'=>false) ;
		
		$tables = array() ;
		$tables[] = 'query' ;
		$tables[] = 'query_field_select' ;
		$tables[] = 'query_field_select_symbol' ;
		$tables[] = 'query_field_group' ;
		$tables[] = 'query_field_where' ;
		foreach( $tables as $dbtab )
		{
			$query = "DELETE FROM $dbtab WHERE query_id='{$arr_saisie['query_id']}'" ;
			$_opDB->query($query) ;
		}
		
		$transaction_id = $post_data['_transaction_id'] ;
		unset($_SESSION['transactions'][$transaction_id]) ;
		
		return array('success'=>true) ;
	}

}


function paracrm_queries_builderTransaction_runQuery( $post_data, &$arr_saisie )
{
	usleep(500000) ;
	
	
	$RES = paracrm_queries_process_query($arr_saisie , (isset($post_data['_debug'])&&$post_data['_debug']==TRUE)?true:false ) ;
	if( !$RES )
		return array('success'=>true,'query_status'=>'NOK') ;
		
	$transaction_id = $post_data['_transaction_id'] ;
	if( !is_array($_SESSION['transactions'][$transaction_id]['arr_RES']) )
		return array('success'=>true,'query_status'=>'NO_RES') ;
	
	$new_RES_key = count($_SESSION['transactions'][$transaction_id]['arr_RES']) + 1 ;
	$_SESSION['transactions'][$transaction_id]['arr_RES'][$new_RES_key] = $RES ;
	
	
	return array('success'=>true,'query_status'=>'OK','RES_id'=>$new_RES_key,'debug'=>$RES) ;
}


function paracrm_queries_builderTransaction_resGet( $post_data )
{
	$transaction_id = $post_data['_transaction_id'] ;
	$RES = $_SESSION['transactions'][$transaction_id]['arr_RES'][$post_data['RES_id']] ;
	
	$tabs = array() ;
	foreach( $RES['RES_labels'] as $tab_id => $dummy )
	{
		$tab = array() ;
		$tab['tab_title'] = $dummy['tab_title'] ;
		$tabs[$tab_id] = $tab + paracrm_queries_paginate_getGrid( $RES, $tab_id ) ;
	}
	
	return array('success'=>true,'tabs'=>$tabs) ;
}




function paracrm_queries_builderTransaction_exportXLS( $post_data )
{
	$transaction_id = $post_data['_transaction_id'] ;
	$RES = $_SESSION['transactions'][$transaction_id]['arr_RES'][$post_data['RES_id']] ;
	
	$tabs = array() ;
	foreach( $RES['RES_labels'] as $tab_id => $dummy )
	{
		$tab = array() ;
		$tab['tab_title'] = $dummy['tab_title'] ;
		$tabs[$tab_id] = $tab + paracrm_queries_paginate_getGrid( $RES, $tab_id ) ;
	}
	
	if( !class_exists('PHPExcel') )
		return NULL ;
		

	$objPHPExcel = new PHPExcel();
	$objPHPExcel->getDefaultStyle()->getFont()->setName('Arial');
	$objPHPExcel->getDefaultStyle()->getFont()->setSize( 10 );

	$nul = 0 ;
	foreach( $tabs as $tab )
	{
		if( $nul > 0 )
			$objPHPExcel->createSheet($nul) ;
		$objPHPExcel->setActiveSheetIndex($nul);
		$obj_sheet = $objPHPExcel->getActiveSheet() ;
		$obj_sheet->setTitle($tab['tab_title']) ;
		
		$row = 1 ;
		$cell = 'A' ;
		foreach( $tab['columns'] as $col ) {
		
			$str = $cfg_field['text'] ;
			if( !$str || $str == '_' ) {
				$str = $cfg_field['field'] ;
			}
		
			$obj_sheet->SetCellValue("{$cell}{$row}", $col['text']);
			$obj_sheet->getColumnDimension($cell)->setWidth(20);
			if( $col['text_bold'] )
				$obj_sheet->getStyle("{$cell}{$row}")->getFont()->setBold(TRUE);
			if( $col['text_italic'] )
				$obj_sheet->getStyle("{$cell}{$row}")->getFont()->setItalic(TRUE);
			
			$cell++ ;
		}
		
		foreach( $tab['data'] as $record ) {
			$row++ ;
			$cell = 'A' ;
			foreach( $tab['columns'] as $col ) {
				$value = $record[$col['dataIndex']] ;
				$obj_sheet->SetCellValue("{$cell}{$row}", $value );
				if( $col['is_bold'] )
					$obj_sheet->getStyle("{$cell}{$row}")->getFont()->setBold(TRUE);
				$cell++ ;
			}
		}
		
		$nul++ ;
	}
	//$objPHPExcel->setActiveSheetIndex(0);
	
	$tmpfilename = tempnam( sys_get_temp_dir(), "FOO");
	
	$objWriter = PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel2007');
	$objWriter->save($tmpfilename);
	$objPHPExcel->disconnectWorksheets();
	unset($objPHPExcel) ;
	
	
	
	
	
	
	
	
	

	$filename = 'OP5report_CRM_.'.$post_data['file_code'].'_'.time().'.xlsx' ;
	header("Content-Type: application/force-download; name=\"$filename\""); 
	header("Content-Disposition: attachment; filename=\"$filename\""); 
	readfile($tmpfilename) ;
	unlink($tmpfilename) ;
	die() ;
}





function paracrm_queries_builderTransaction_getTreeFields( &$arr_saisie )
{
	global $_opDB ;

	$TAB_file_fields = array() ;
	$arr_indexed_selectmap = array() ;
	foreach( $arr_saisie['select_map'] as $field )
	{
		$file_code = $field['file_code'] ;
		$file_field = $field['file_field'] ;
		if( !$file_field )
			continue ;
			
		$arr_indexed_selectmap[$field['field']] = $field ;
		
		if( $field['link_bible'] )
		{
			$TAB_file_fields[$file_code][$file_field][] = $field['field'] ;
		}
		else
		{
			$TAB_file_fields[$file_code][$file_field] = $field['field'] ;
		}
	}
	
	$json = array();
	$json['root'] = true ;
	$json['text'] = '.' ;
	$json['expanded'] = true ;
	$json['children'] = array() ;
	foreach( $TAB_file_fields as $file_code => $arr1 )
	{
		$query = "SELECT file_lib FROM define_file WHERE file_code='$file_code'" ;
		$file_lib = $_opDB->query_uniqueValue($query);
	
	
		$json_file = array() ;
		$json_file['field_code'] = $file_code ;
		$json_file['field_text'] = '<b>'.$file_lib.'</b>' ;
		$json_file['field_text_full'] = $json_file['field_text'] ;
		$json_file['field_type'] = 'file' ;
		$json_file['field_type_text'] = 'File '.$file_code ;
		$json_file['file_code'] = $file_code ;
		$json_file['expanded'] = true ;
		$json_file['children'] = array() ;
		foreach( $arr1 as $field_code => $mvalue )
		{
			$query = "SELECT entry_field_lib FROM define_file_entry
						WHERE file_code='$file_code' AND entry_field_code='$field_code'" ;
			$entry_field_lib = $_opDB->query_uniqueValue($query);
		
			if( is_array($mvalue) )
			{
				$query = "SELECT entry_field_linkbible FROM define_file_entry
							WHERE file_code='$file_code' AND entry_field_code='$field_code'" ;
				$linkbible = $_opDB->query_uniqueValue($query);
			
				$json_field_bible = array() ;
				$json_field_bible['field_code'] = $file_code.'_field_'.$field_code ;
				$json_field_bible['field_text'] = $entry_field_lib ;
				$json_field_bible['field_text_full'] = $entry_field_lib ;
				$json_field_bible['field_type'] = 'link' ;
				$json_field_bible['field_type_text'] = 'Link '.$linkbible ;
				$json_field_bible['field_linkbible'] = $linkbible ;
				$json_field_bible['file_code'] = $file_code ;
				$json_field_bible['file_field_code'] = $field_code ;
				$json_field_bible['bible_code'] = $linkbible ;
				$json_field_bible['leaf'] = false ;
				$json_field_bible['expanded'] = true ;
				$json_field_bible['children'] = array() ;
				foreach($mvalue as $bible_field)
				{
					$selectmap = $arr_indexed_selectmap[$bible_field] ;
				
					$field = array() ;
					$field['leaf'] = true ;
					$field['field_code'] = $bible_field ;
					$field['field_text'] = trim(preg_replace('/\s*\([^)]*\)/', '', $selectmap['text'])) ;
					$field['field_text_full'] = $selectmap['text'] ;
					$field['field_type'] = $selectmap['type'] ;
					$field['field_type_text'] = $selectmap['type'] ;
					$field['field_linkbible_type'] = $selectmap['link_bible_type'] ;
					$field['file_code'] = $file_code ;
					$field['file_field_code'] = $field_code ;
					$field['bible_code'] = $linkbible ;
					$field['bible_field_code'] = $selectmap['link_bible_field'] ;
					$json_field_bible['children'][] = $field ;
				}
				
				$json_file['children'][] = $json_field_bible ;
			}
			else
			{
				$selectmap = $arr_indexed_selectmap[$mvalue] ;
			
				$field = array() ;
				$field['leaf'] = true ;
				$field['field_code'] = $mvalue ;
				$field['field_text'] = $selectmap['text'] ;
				$field['field_text_full'] = $selectmap['text'] ;
				$field['field_type'] = $selectmap['type'] ;
				$field['field_type_text'] = $selectmap['type'] ;
				$field['file_code'] = $file_code ;
				$field['file_field_code'] = $field_code ;
				$json_file['children'][] = $field ;
			}
		}
		$json['children'][] = $json_file ;
	}

	


	return $json ;
}

function paracrm_queries_builderTransaction_loadFields( &$arr_saisie , $query_id )
{
	global $_opDB ;

	$arr_saisie['fields_where'] = array() ;
	$query = "SELECT * FROM query_field_where WHERE query_id='$query_id' ORDER BY query_fieldwhere_ssid" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		unset($arr['query_id']) ;
		unset($arr['query_fieldwhere_ssid']) ;
		$arr_saisie['fields_where'][] = $arr ;
	}
	
	$arr_saisie['fields_group'] = array() ;
	$query = "SELECT * FROM query_field_group WHERE query_id='$query_id' ORDER BY query_fieldgroup_ssid" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		unset($arr['query_id']) ;
		unset($arr['query_fieldgroup_ssid']) ;
		$arr_saisie['fields_group'][] = $arr ;
	}
	
	$arr_saisie['fields_select'] = array() ;
	$query = "SELECT * FROM query_field_select WHERE query_id='$query_id' ORDER BY query_fieldselect_ssid" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$arr['math_expression'] = array() ;
		$query = "SELECT * FROM query_field_select_symbol 
					WHERE query_id='$query_id' AND query_fieldselect_ssid='{$arr['query_fieldselect_ssid']}'
					ORDER BY query_fieldselect_symbol_index" ;
		$result2 = $_opDB->query($query) ;
		while( ($arr_symbol = $_opDB->fetch_assoc($result2)) != FALSE )
		{
			unset($arr_symbol['query_id']) ;
			unset($arr_symbol['query_fieldselect_ssid']) ;
			unset($arr_symbol['query_fieldselect_symbol_index']) ;
			$arr['math_expression'][] = $arr_symbol ;
		}
	
	
		unset($arr['query_id']) ;
		unset($arr['query_fieldselect_ssid']) ;
		$arr_saisie['fields_select'][] = $arr ;
	}

	return ;
}
function paracrm_queries_builderTransaction_saveFields( &$arr_saisie , $query_id )
{
	global $_opDB ;
	
	
	$tables = array() ;
	$tables[] = 'query_field_select' ;
	$tables[] = 'query_field_select_symbol' ;
	$tables[] = 'query_field_group' ;
	$tables[] = 'query_field_where' ;
	foreach( $tables as $dbtab )
	{
		$query = "DELETE FROM $dbtab WHERE query_id='$query_id'" ;
		$_opDB->query($query) ;
	}
	
	
	$cnt = 0 ;
	$where = array() ;
	$where[] = 'field_code' ;
	$where[] = 'field_type' ;
	$where[] = 'field_linkbible' ;
	$where[] = 'condition_string' ;
	$where[] = 'condition_date_lt' ;
	$where[] = 'condition_date_gt' ;
	$where[] = 'condition_num_lt' ;
	$where[] = 'condition_num_gt' ;
	$where[] = 'condition_num_eq' ;
	$where[] = 'condition_bible_mode' ;
	$where[] = 'condition_bible_treenodes' ;
	$where[] = 'condition_bible_entries' ;
	foreach( $arr_saisie['fields_where'] as $field_where )
	{
		$cnt++ ;
	
		$arr_ins = array() ;
		$arr_ins['query_id'] = $query_id ;
		$arr_ins['query_fieldwhere_ssid'] = $cnt ;
		foreach( $where as $w )
		{
			$arr_ins[$w] = $field_where[$w] ;
		}
		$_opDB->insert('query_field_where',$arr_ins) ;
	}


	$cnt = 0 ;
	$group = array() ;
	$group[] = 'field_code' ;
	$group[] = 'field_type' ;
	$group[] = 'field_linkbible' ;
	$group[] = 'display_geometry' ;
	$group[] = 'group_bible_type' ;
	$group[] = 'group_bible_tree_depth' ;
	$group[] = 'group_bible_display_treenode' ;
	$group[] = 'group_bible_display_entry' ;
	$group[] = 'group_date_type' ;
	foreach( $arr_saisie['fields_group'] as $field_group )
	{
		$cnt++ ;
	
		$arr_ins = array() ;
		$arr_ins['query_id'] = $query_id ;
		$arr_ins['query_fieldgroup_ssid'] = $cnt ;
		foreach( $group as $w )
		{
			$arr_ins[$w] = $field_group[$w] ;
		}
		$_opDB->insert('query_field_group',$arr_ins) ;
	}
	
	
	$cnt = 0 ;
	$select = array() ;
	$select[] = 'select_lib' ;
	$select[] = 'math_func_group' ;
	foreach( $arr_saisie['fields_select'] as $field_select )
	{
		$cnt++ ;
	
		$arr_ins = array() ;
		$arr_ins['query_id'] = $query_id ;
		$arr_ins['query_fieldselect_ssid'] = $cnt ;
		foreach( $select as $w )
		{
			$arr_ins[$w] = $field_select[$w] ;
		}
		$_opDB->insert('query_field_select',$arr_ins) ;
		
		
		$scnt = 0 ;
		$symbol = array() ;
		$symbol[] = 'math_operation' ;
		$symbol[] = 'math_parenthese_in' ;
		$symbol[] = 'math_fieldoperand' ;
		$symbol[] = 'math_staticvalue' ;
		$symbol[] = 'math_parenthese_out' ;
		foreach( $field_select['math_expression'] as $field_sequence )
		{
			$scnt++ ;
		
			$arr_ins = array() ;
			$arr_ins['query_id'] = $query_id ;
			$arr_ins['query_fieldselect_ssid'] = $cnt ;
			$arr_ins['query_fieldselect_symbol_index'] = $scnt ;
			foreach( $symbol as $s )
			{
				$arr_ins[$s] = $field_sequence[$s] ;
			}
			$_opDB->insert('query_field_select_symbol',$arr_ins) ;
		}
	}

	


	return array('success'=>true,'query_id'=>$query_id) ;
}



?>