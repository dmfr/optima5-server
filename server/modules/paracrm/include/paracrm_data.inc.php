<?php
function paracrm_data_getBibleCfg( $post_data )
{
	global $_opDB ;

	$bible_code = $post_data['bible_code'] ;
	$tree_key_lib = NULL ;
	
	$query = "SELECT bible_lib FROM define_bible WHERE bible_code='$bible_code'" ;
	$bible_lib = $_opDB->query_uniqueValue($query);
	
	$tab_tree_fields = array() ;
	$tab_tree_fields[] = array('tree_field_code'=>'treenode_key','tree_field_type'=>'string','tree_field_lib'=>'NodeKey','tree_field_is_highlight'=>false) ;
	$tab_tree_fields[] = array('tree_field_code'=>'nb_entries','tree_field_type'=>'int','tree_field_lib'=>'Nb Entries','tree_field_is_highlight'=>false) ;
	$tab_tree_fields[] = array('tree_field_code'=>'nb_children','tree_field_type'=>'int','tree_field_lib'=>'Nb Childs','tree_field_is_highlight'=>false) ;
	$query = "SELECT * FROM define_bible_tree WHERE bible_code='$bible_code' ORDER BY tree_field_index" ;
	$result = $_opDB->query($query);
	if( $_opDB->num_rows($result) == 0 )
		return array('success'=>false) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		if( strpos($arr['tree_field_type'],'link_') === 0 )
		{
			$arr['tree_field_link'] = substr($arr['tree_field_type'],5,strlen($arr['tree_field_type'])-5) ;
			$arr['tree_field_type'] = 'link' ;
		}
		$arr['tree_field_is_header'] = ($arr['tree_field_is_header']=='O')? TRUE : FALSE ;
		$arr['tree_field_is_highlight'] = ($arr['tree_field_is_highlight']=='O')? TRUE : FALSE ;
		$arr['tree_field_is_key'] = ($arr['tree_field_is_key']=='O')? TRUE : FALSE ;
		$arr['tree_field_code'] = 'field_'.$arr['tree_field_code'] ;
		$tab_tree_fields[] = $arr ;
		
		if($arr['tree_field_is_key']=='O') {
			$tree_key_lib = $arr['tree_field_lib'] ;
		}
	}
	
	
	$tab_entry_fields = array() ;
	
	$arr_entry = array() ;
	$arr_entry['entry_field_is_header'] = FALSE ;
	$arr_entry['entry_field_is_highlight'] = FALSE ;
	$arr_entry['entry_field_is_key'] = FALSE ;
	$arr_entry['entry_field_code'] = 'entry_key' ;
	$arr_entry['entry_field_lib'] = 'EntryKey' ;
	$arr_entry['entry_field_type'] = 'string' ;
	$tab_entry_fields[] = $arr_entry ;
	
	$arr_treenode = array() ;
	$arr_treenode['entry_field_is_header'] = TRUE ;
	$arr_treenode['entry_field_is_highlight'] = TRUE ;
	$arr_treenode['entry_field_is_key'] = FALSE ;
	$arr_treenode['entry_field_code'] = 'treenode_key' ;
	$arr_treenode['entry_field_lib'] = $tree_key_lib ;
	$arr_treenode['entry_field_type'] = 'string' ;
	$tab_entry_fields[] = $arr_treenode ;
	
	$arr_headerlib = array() ;
	$arr_headerlib['entry_field_is_header'] = FALSE ;
	$arr_headerlib['entry_field_is_highlight'] = FALSE ;
	$arr_headerlib['entry_field_is_key'] = FALSE ;
	$arr_headerlib['entry_field_code'] = 'headerlib' ;
	$arr_headerlib['entry_field_lib'] = 'Header' ;
	$arr_headerlib['entry_field_type'] = 'string' ;
	$tab_entry_fields[] = $arr_headerlib ;
	
	$query = "SELECT gmap_is_on FROM define_bible WHERE bible_code='$bible_code'" ;
	if( $_opDB->query_uniqueValue($query) == 'O' )
	{
		$arr_gmap = array() ;
		foreach( $_opDB->table_fields('define_gmap') as $field )
		{
			$tfield = 'gmap_'.$field ;
			
			$arr = array() ;
			$arr['entry_field_is_header'] = FALSE ;
			$arr['entry_field_is_highlight'] = FALSE ;
			$arr['entry_field_is_key'] = FALSE ;
			$arr['entry_field_code'] = $tfield ;
			$arr['entry_field_lib'] = $tfield ;
			$arr['entry_field_type'] = 'string' ;
			$tab_entry_fields[] = $arr ;
		}
	}
	
	
	$query = "SELECT * FROM define_bible_entry WHERE bible_code='$bible_code' ORDER BY entry_field_index" ;
	$result = $_opDB->query($query);
	if( $_opDB->num_rows($result) == 0 )
		return array('success'=>false) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		if( strpos($arr['entry_field_type'],'link_') === 0 )
		{
			$arr['entry_field_link'] = substr($arr['entry_field_type'],5,strlen($arr['entry_field_type'])-5) ;
			$arr['entry_field_type'] = 'link' ;
		}
		
		$arr['entry_field_is_header'] = ($arr['entry_field_is_header']=='O')? TRUE : FALSE ;
		$arr['entry_field_is_highlight'] = ($arr['entry_field_is_highlight']=='O')? TRUE : FALSE ;
		$arr['entry_field_is_key'] = ($arr['entry_field_is_key']=='O')? TRUE : FALSE ;
		$arr['entry_field_code'] = 'field_'.$arr['entry_field_code'] ;
		$tab_entry_fields[] = $arr ;
	}
	
	
	return array('success'=>true,'data'=>array('bible_lib'=>$bible_lib,'tree_fields'=>$tab_tree_fields,'entry_fields'=>$tab_entry_fields)) ;
}



function paracrm_data_getBibleTreeOne( $post_data )
{
	return( array('success'=>true,'dataRoot'=>paracrm_lib_dataTool_getBibleTreeRoot( $post_data['bible_code'], NULL )) ) ;
}

function paracrm_data_getBibleTree( $post_data )
{
	global $_opDB ;
	
	$bible_code = $post_data['bible_code'] ;
	$view_name = 'view_bible_'.$bible_code.'_tree' ;
	
	$arr_fields = array() ;
	$query = "SELECT * FROM define_bible_tree WHERE bible_code='$bible_code'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$fieldcode = $arr['tree_field_code'] ;
		$fieldtrad = 'field_'.$fieldcode ;
		
		$arr_fields[$fieldtrad] = $fieldcode ;
	}
	
	$tab_parentkey_nodes = array() ;
	$query = "SELECT * FROM $view_name" ;
	$result = $_opDB->query($query);
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$record = $arr ;
		$record['treenode_key'] = $arr['treenode_key'] ;
	
		$tab_parentkey_nodes[$arr['treenode_parent_key']][$arr['treenode_key']] = $record ;
	}
	
	$arr_treenode_nbEntries = array() ;
	$query = "select treenode_key, count(*) from store_bible_entry where bible_code='$bible_code' group by treenode_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE )
	{
		$arr_treenode_nbEntries[$arr[0]] = $arr[1] ;
	}
	
	foreach( $tab_parentkey_nodes as $treenode_parent_key => $arr1 )
	{
		foreach( $arr1 as $treenode_key => $record )
		{
			$record['nb_children'] = count($tab_parentkey_nodes[$treenode_key]) ;
			$record['nb_entries'] = $arr_treenode_nbEntries[$treenode_key] ;
			$tab_parentkey_nodes[$treenode_parent_key][$treenode_key] = $record ;
		}
	}
	
	// print_r($tab_parentkey_nodes) ;
	
	$TAB_json = paracrm_data_getBibleTree_call( $tab_parentkey_nodes, '' ) ;
	//$TAB_json[] = array('field_PRODLINE'=>'POM','field_PRODLINEDESC'=>'Pom Juices','expanded'=>true,'children'=>array(array('field_PRODLINE'=>'POM_C','field_PRODLINEDESC'=>'Pom Cold','leaf'=>true),array('field_PRODLINE'=>'POM_H','field_PRODLINEDESC'=>'Pom Hot','leaf'=>true))) ;
	return array('text'=>'.','children'=>$TAB_json) ;
}
function paracrm_data_getBibleTree_call( $tab_parentkey_nodes, $treenode_parent_key )
{
	global $_opDB ;
	
	$TAB_json = array() ;
	if( !$tab_parentkey_nodes[$treenode_parent_key] )
		return array() ;
	foreach( $tab_parentkey_nodes[$treenode_parent_key] as $treenode_key => $record )
	{
		if( $child_tab = paracrm_data_getBibleTree_call( $tab_parentkey_nodes, $treenode_key ) )
		{
			$record['expanded'] = true ;
			$record['children'] = $child_tab ;
		}
		else
		{
			//$record['leaf'] = true ;
			$record['children'] = array() ;
		}
		$TAB_json[] = $record ;
	}
	return $TAB_json ;
}

function paracrm_data_getBibleTreeBranch( $bible_code, $treenode_key )
{
	global $_opDB ;
	
	$view_name = 'view_bible_'.$bible_code.'_tree' ;

	$tab_parentkey_nodes = array() ;
	$query = "SELECT * FROM $view_name" ;
	$result = $_opDB->query($query);
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		if( !$tab_parentkey_nodes[$arr['treenode_parent_key']] )
			$tab_parentkey_nodes[$arr['treenode_parent_key']] = array() ;
	
		$tab_parentkey_nodes[$arr['treenode_parent_key']][] = $arr['treenode_key'] ;
	}
	
	return paracrm_data_getBibleTreeBranch_call( $tab_parentkey_nodes, $treenode_key ) ;
}
function paracrm_data_getBibleTreeBranch_call( $tab_parentkey_nodes, $treenode_key )
{
	$arr_treenodes = array() ;
	
	$arr_treenodes[] = $treenode_key ;
	if( $tab_parentkey_nodes[$treenode_key] )
	{
	foreach( $tab_parentkey_nodes[$treenode_key] as $treenode_child_key )
	{
		if( $arr_treenodes_child = paracrm_data_getBibleTreeBranch_call( $tab_parentkey_nodes, $treenode_child_key ) )
		{
			$arr_treenodes = array_merge($arr_treenodes,$arr_treenodes_child) ;
		}
	}
	}
	return $arr_treenodes ;
}



function paracrm_data_getBibleGrid( $post_data )
{
	global $_opDB ;
	
	// sleep(2) ;
	
	$bible_code = $post_data['bible_code'] ;
	$view_name = 'view_bible_'.$bible_code.'_entry' ;
	
	$query = "SELECT SQL_CALC_FOUND_ROWS * FROM $view_name WHERE 1" ;
	if( $post_data['filter'] )
	{
		foreach( json_decode($post_data['filter'],TRUE) as $filter )
		{
			switch( $filter['property'] )
			{
				case 'entry_key' :
				if( is_array($filter['value']) )
				{
					if( $filter['value'] )
					{
						$query.= " AND entry_key IN ".$_opDB->makeSQLlist($filter['value']) ;
					}
					else
					{
						$query.= " AND 0" ;
					}
				}
				elseif( $filter['value'] != '' )
				{
					$query.= " AND entry_key='{$filter['value']}'" ;
				}
				break ;
				
				
				case 'str_search' :
				if( $filter['value'] )
				{
					// dans quels champs chercher ?
					$fields = array() ;
					$fields[] = 'treenode_key' ;
					$query_def = "SELECT entry_field_code FROM define_bible_entry WHERE bible_code='$bible_code' ORDER BY entry_field_index" ;
					$result_def = $_opDB->query($query_def) ;
					while( ($arr = $_opDB->fetch_row($result_def)) != FALSE )
					{
						$fields[] = 'field_'.$arr[0] ;
					}
					
					$ttmp = array() ;
					foreach( $fields as $field )
					{
						$ttmp[] = "{$field} LIKE '%{$filter['value']}%'" ;
					}
					
					$query.= " AND ( ".implode(' OR ',$ttmp).' )' ;
				}
				break ;
			
			
				case 'treenode_key' :
				if( $filter['value'] == '&' )
					break ;
				// recherche de tous les treenodeskeys child of treenode_key
				if( $arr_treenodes = paracrm_data_getBibleTreeBranch( $bible_code, $filter['value'] ) )
				{
					$query.= " AND treenode_key IN ".$_opDB->makeSQLlist($arr_treenodes) ;
				}
				else
				{
					$query.= " AND 0" ;
				}
				break ;
			
			}
		}
	}
	
	if( $post_data['sort'] )
	{
		$sorter = current(json_decode($post_data['sort'],TRUE)) ;
		$query.= " ORDER BY {$sorter['property']} {$sorter['direction']}" ;
	}
	else
	{
		$query.= " ORDER BY entry_key ASC" ;
	}
	
	
	if( isset($post_data['start']) && isset($post_data['limit']) )
		$query.= " LIMIT {$post_data['start']},{$post_data['limit']}" ;
	
	
	
	$result = $_opDB->query($query);
	$TAB_json = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$TAB_json[] = $arr ;
	}
	
	$queryf = "SELECT FOUND_ROWS()" ;
	$nb_rows = $_opDB->query_uniqueValue($queryf);
	
	
	return array('success'=>true,'data'=>$TAB_json,'total'=>$nb_rows,'query'=>$query) ;
}
function paracrm_data_getBibleGrid_filterNode( $treenode_key, $TAB_parentNode_arrEntries, $TAB_parentNode_arrNodeCode )
{
	$TAB_json = array() ;
	if( $TAB_parentNode_arrEntries[$treenode_key] )
	{
		$TAB_json = $TAB_parentNode_arrEntries[$treenode_key] ;
		//print_r($TAB_json) ;
	}
	if( $TAB_parentNode_arrNodeCode[$treenode_key] )
	{
	foreach( $TAB_parentNode_arrNodeCode[$treenode_key] as $treenode_child_key )
	{
		if( $TAB_json_child = paracrm_data_getBibleGrid_filterNode( $treenode_child_key, $TAB_parentNode_arrEntries, $TAB_parentNode_arrNodeCode ) )
		{
			$TAB_json = array_merge($TAB_json,$TAB_json_child) ;
		}
	}
	}
	return $TAB_json ;
}


/*
*****************************************************************************


**************************************************************************
*/




function paracrm_data_getFileGrid_config( $post_data )
{
	global $_opDB ;

	$query = "SELECT * FROM define_file WHERE file_code='{$post_data['file_code']}'" ;
	$result = $_opDB->query($query) ;
	$arr_define_file = $_opDB->fetch_assoc($result) ;
	
	$TAB = paracrm_lib_file_access( $file_code = $post_data['file_code'] ) ;
	if( !$TAB['select_map'] )
		return array('success'=>false) ;
	
	return array('success'=>true,'data'=>array('define_file'=>$arr_define_file,'grid_fields'=>$TAB['select_map'])) ;
}
function paracrm_data_getFileGrid_data( $post_data )
{
	global $_opDB ;
	
	// echo "pouet" ;
	$TAB = paracrm_lib_file_access( $file_code = $post_data['file_code'] ) ;
	if( !$TAB['sql_query_base'] )
		return array('success'=>false) ;
	
	$query = $TAB['sql_query_base'] ;
	
	// filters.....
	if( $post_data['filter'] )
	{
	// table de mapping
	$mapping = array() ;
	foreach( $TAB['sql_selectfields'] as $ttmp )
	{
		$sql_field = $ttmp[0] ;
		$display_field = $ttmp[1] ;
		$mapping[$display_field] = $sql_field ;
	}
	
	foreach( json_decode($post_data['filter'],TRUE) as $filter )
	{
		$sql_field = $mapping[$filter['field']] ;
		if( !$sql_field )
			continue ;
		switch( $filter['type'] )
		{
			case 'list' :
			if( is_array($filter['value']) && $filter['value'] )
			{
				$query.= " AND {$sql_field} IN ".$_opDB->makeSQLlist($filter['value']) ;
			}
			elseif( is_array($filter['value']) )
			{
				$query.= " AND 0" ;
			}
			break ;
			
			case 'date' :
			$sign = '' ;
			switch( $filter['comparison'] )
			{
				case 'eq' : $sign = '=' ; break ;
				case 'lt' : $sign = '<=' ; break ;
				case 'gt' : $sign = '>=' ; break ;
			}
			if( $sign )
			{
				$query.= " AND DATE({$sql_field}) {$sign} '{$filter['value']}'" ;
			}
			break ;
			
			
			case 'numeric' :
			$sign = '' ;
			switch( $filter['comparison'] )
			{
				case 'eq' : $sign = '=' ; break ;
				case 'lt' : $sign = '<' ; break ;
				case 'gt' : $sign = '>' ; break ;
			}
			if( $sign )
			{
				$query.= " AND {$sql_field} {$sign} '{$filter['value']}'" ;
			}
			break ;
			
			
			case 'string' :
			$query.= " AND {$sql_field} LIKE '%{$filter['value']}%'" ;
			break ;
		}
	}
	}
	
	if( $post_data['sort'] )
	{
		$sorter = current(json_decode($post_data['sort'],TRUE)) ;
		$query.= " ORDER BY {$sorter['property']} {$sorter['direction']}" ;
	}
	else
	{
		$query.= " ORDER BY filerecord_id DESC" ;
	}
	
	
	if( isset($post_data['start']) && isset($post_data['limit']) )
		$query.= " LIMIT {$post_data['start']},{$post_data['limit']}" ;
	$result = $_opDB->query($query);
	
	
	$query = "SELECT FOUND_ROWS()" ;
	$nb_rows = $_opDB->query_uniqueValue($query);
	
	
	
	$TAB_json = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$TAB_json[] = $arr ;
	}
	return array('success'=>true,'data'=>$TAB_json,'total'=>$nb_rows) ;
}
function paracrm_data_getFileGrid_raw( $post_data )
{
	global $_opDB ;
	
	// echo "pouet" ;
	
	$view_name = "view_file_".$post_data['file_code'] ;
	$query = "SELECT * FROM $view_name WHERE 1" ;
	
	// filters.....
	if( $post_data['filter'] )
	{
	
	foreach( json_decode($post_data['filter'],TRUE) as $filter )
	{
		$sql_field = $filter['field'] ;

		switch( $filter['type'] )
		{
			case 'list' :
			if( is_array($filter['value']) && $filter['value'] )
			{
				$query.= " AND {$sql_field} IN ".$_opDB->makeSQLlist($filter['value']) ;
			}
			elseif( is_array($filter['value']) )
			{
				$query.= " AND 0" ;
			}
			break ;
			
			case 'date' :
			$sign = '' ;
			switch( $filter['comparison'] )
			{
				case 'eq' : $sign = '=' ; break ;
				case 'lt' : $sign = '<=' ; break ;
				case 'gt' : $sign = '>=' ; break ;
			}
			if( $sign )
			{
				$query.= " AND DATE({$sql_field}) {$sign} '{$filter['value']}'" ;
			}
			break ;
			
			
			case 'numeric' :
			$sign = '' ;
			switch( $filter['comparison'] )
			{
				case 'eq' : $sign = '=' ; break ;
				case 'lt' : $sign = '<' ; break ;
				case 'gt' : $sign = '>' ; break ;
			}
			if( $sign )
			{
				$query.= " AND {$sql_field} {$sign} '{$filter['value']}'" ;
			}
			break ;
			
			
			case 'string' :
			$query.= " AND {$sql_field} LIKE '%{$filter['value']}%'" ;
			break ;
		}
	}
	}
	
	if( $post_data['sort'] )
	{
		$sorter = current(json_decode($post_data['sort'],TRUE)) ;
		$query.= " ORDER BY {$sorter['property']} {$sorter['direction']}" ;
	}
	else
	{
		$query.= " ORDER BY filerecord_id DESC" ;
	}
	
	
	if( isset($post_data['start']) && isset($post_data['limit']) )
		$query.= " LIMIT {$post_data['start']},{$post_data['limit']}" ;
	$result = $_opDB->query($query);
	
	
	$query = "SELECT FOUND_ROWS()" ;
	$nb_rows = $_opDB->query_uniqueValue($query);
	
	
	
	$TAB_json = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$TAB_json[] = $arr ;
	}
	return array('success'=>true,'data'=>$TAB_json,'total'=>$nb_rows) ;
}




function paracrm_data_getFileGrid_exportXLS( $post_data )
{
	if( !class_exists('PHPExcel') )
		return NULL ;
		
	$TAB_cfg = paracrm_data_getFileGrid_config( array('file_code'=>$post_data['file_code']) ) ;
	$TAB_data = paracrm_data_getFileGrid_data( $post_data ) ;

	if( !$TAB_cfg['data']['grid_fields'] )
		return ;

	$objPHPExcel = new PHPExcel();
	$objPHPExcel->getDefaultStyle()->getFont()->setName('Arial');
	$objPHPExcel->getDefaultStyle()->getFont()->setSize( 10 );

	$objPHPExcel->setActiveSheetIndex(0);
	$obj_sheet = $objPHPExcel->getActiveSheet() ;
	$obj_sheet->setTitle($TAB_cfg['data']['define_file']['file_code']) ;
	
	$row = 1 ;
	$cell = 'A' ;
	foreach( $TAB_cfg['data']['grid_fields'] as $cfg_field ) {
	
		$str = $cfg_field['text'] ;
		if( !$str || $str == '_' ) {
			$str = $cfg_field['field'] ;
		}
	
		$obj_sheet->SetCellValue("{$cell}{$row}", $str);
		$obj_sheet->getColumnDimension($cell)->setWidth(20);
		$obj_sheet->getStyle("{$cell}{$row}")->getFont()->setBold(TRUE);
		
		$cell++ ;
	}
	
	foreach( $TAB_data['data'] as $record ) {
		$row++ ;
		$cell = 'A' ;
		foreach( $TAB_cfg['data']['grid_fields'] as $cfg_field ) {
			$field_code = $cfg_field['field'] ;
		
			switch( $cfg_field['type'] ) {
			
				case 'string' :
				$obj_sheet->getCell($cell.$row)->setValueExplicit($record[$field_code],PHPExcel_Cell_DataType::TYPE_STRING);
				break ;
				
				default :
				$obj_sheet->SetCellValue("{$cell}{$row}", $record[$field_code] );
				break ;
			}
			
		
			$cell++ ;
		}
	}
	
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



?>