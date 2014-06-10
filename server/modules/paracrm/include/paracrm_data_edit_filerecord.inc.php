<?php

function paracrm_data_editTransaction_fileRecord( $post_data , &$arr_saisie )
{
	global $_opDB ;

	if( $post_data['_subaction'] == 'init' )
	{
		return paracrm_data_editTransaction_fileRecord_init( $post_data , $arr_saisie ) ;
	}
	if( $post_data['_subaction'] == 'get_layout' )
	{
		// construction du tabpanel
		
	
		return array(
			'success'=>true,
			'data'=>array(
				'form'=>$arr_saisie['file_form'],
				'gmap'=> ($arr_saisie['file_gmap'])?true:false ,
				'subfiles'=> $arr_saisie['file_subfiles']
			)
		) ;
	}
	if( $post_data['_subaction'] == 'form_getValues' )
	{
		$arr_key_value = array() ;
		foreach( $arr_saisie['file_form'] as $field )
		{
			$arr_key_value[$field['name']] = $field['value'] ;
		}
		return array('success'=>true,'data'=>$arr_key_value) ;
	}
	if( $post_data['_subaction'] == 'form_setValues' )
	{
		foreach( $arr_saisie['file_form'] as $mid => $field )
		{
			$mkey = $field['name'] ;
			if( isset( $post_data[$mkey] ) )
				$arr_saisie['file_form'][$mid]['value'] = trim($post_data[$mkey]) ;
		}
		return array('success'=>true) ;
	}
	
	if( $post_data['_subaction'] == 'gmap_get' )
	{
		$ret = array() ;
		foreach( $arr_saisie['file_gmap'] as $mkey => $mvalue )
		{
			$ret[$mkey] = $mvalue ;
		}
		return array('success'=>true,'data'=>$ret) ;
	}
	if( $post_data['_subaction'] == 'gmap_set' )
	{
		// données du formulaire
		$arr_ent = $arr_saisie['file_gmap'] ;
		foreach( $arr_ent as $mkey => $dummy )
		{
			$arr_ent[$mkey] = trim($post_data[$mkey]) ;
		}
		$arr_saisie['file_gmap'] = $arr_ent ;
		
		return array('success'=>true) ;
	}
	
	
	if( $post_data['_subaction'] == 'subfileData_set' )
	{
		foreach( $arr_saisie['file_subfiles'] as &$subfile )
		{
			if( $subfile['file_code'] != $_POST['subfile_code'] )
				continue ;
				
			foreach( $subfile['data'] as $arrId => &$server_record )
			{
				if( $server_record['filerecord_id'] )
					$server_record['_editor_action'] = 'delete' ;
				else
					unset($subfile['data'][$arrId]) ;
			}
			foreach( json_decode($_POST['data'],true) as $remote_record )
			{
				if( $remote_record['filerecord_id'] )
				{
					foreach( $subfile['data'] as &$server_record )
					{
						if( $server_record['filerecord_id'] == $remote_record['filerecord_id'] )
						{
							$server_record = $remote_record ;
							$server_record['_editor_action'] = 'update' ;
							continue 2 ;
						}
					}
				}
				else
				{
					$remote_record['_editor_action'] = 'new' ;
					$subfile['data'][] = $remote_record ;
				}
			}
			return array('success'=>true,'debug'=>$subfile) ;
		}
		return array('success'=>false) ;
	}
	if( $post_data['_subaction'] == 'subfileData_get' && $_POST['subfile_code'] )
	{
		foreach( $arr_saisie['file_subfiles'] as $subfile )
		{
			if( $subfile['file_code'] != $_POST['subfile_code'] )
				continue ;
				
			$tab_data = array() ;
			foreach( $subfile['data'] as $arrId => $record )
			{
				if( $record['_editor_action'] == 'delete' )
					continue ;
				$tab_data[] = $record ;
			}
			return $tab_data ;
		}
		return array() ;
	}
	
	
	
	if( $post_data['_subaction'] == 'subfileGallery_get' )
	{
		foreach( $arr_saisie['file_subfiles'] as $subfile )
		{
			if( $subfile['file_code'] != $_POST['subfile_code'] )
				continue ;
				
			$tab_data = array() ;
			foreach( $subfile['data'] as $arrId => $record )
			{
				if( $record['_editor_action'] == 'delete' )
					continue ;
				$tab_data[] = $record ;
			}
			return array_reverse($tab_data) ;
		}
		return array() ;
	}
	if( $post_data['_subaction'] == 'subfileGallery_delete' )
	{
		foreach( $arr_saisie['file_subfiles'] as &$subfile )
		{
			if( $subfile['file_code'] != $_POST['subfile_code'] )
				continue ;
				
			foreach( $subfile['data'] as $arrId => &$record )
			{
				if( $record['_media_id'] == $_POST['_media_id'] )
				{
					$record['_editor_action'] = 'delete' ;
					return array('success'=>true) ;
				}
			}
			return array('success'=>false) ;
		}
		return array('success'=>false) ;
	}
	if( $post_data['_subaction'] == 'subfileGallery_upload' )
	{
		usleep(500000) ;
		media_contextOpen( $_POST['_sdomainId'] ) ;
		$media_id = media_img_processUploaded( $_FILES['photo-filename']['tmp_name'] ) ;
		media_contextClose() ;
		if( !$media_id ) {
			return array('success'=>false) ;
		}
		
		$newrecord = array() ;
		$newrecord['_media_id'] = $media_id ;
		$newrecord['filerecord_id'] = 0 ;
		$newrecord['media_title'] = $_FILES['photo-filename']['name'] ;
		$newrecord['media_date'] = date('Y-m-d H:i:s') ;
		$newrecord['media_mimetype'] = 'image/jpeg' ;
		$newrecord['_editor_action'] = 'new' ;
		
		foreach( $arr_saisie['file_subfiles'] as &$subfile )
		{
			if( $subfile['file_code'] != $_POST['subfile_code'] )
				continue ;
				
			$subfile['data'][] = $newrecord ;
		}
		
		return array('success'=>true) ;
	}
	

	if( $post_data['_subaction'] == 'subfileData_prettify' )
	{
		$resp = paracrm_data_editTransaction_fileRecord_toolPrettyBible( $_POST['subfile_code'], json_decode($_POST['data_record'],true) ) ;
		
	
		return array('success'=>true,'data_record_add'=>$resp) ;
	}



	if( $post_data['_subaction'] == 'save_and_apply' )
	{
		// OK save
		return paracrm_data_editTransaction_fileRecord_apply($arr_saisie, $apply=TRUE) ;
	}
}


function paracrm_data_editTransaction_fileRecord_init( $post_data , &$arr_saisie )
{
	global $_opDB ;
	
	
	$arr_saisie = array() ;
	$arr_saisie['data_type'] = 'file_record' ;
	$arr_saisie['file_code'] = $post_data['file_code'] ;
	$arr_saisie['is_new'] = ($post_data['is_new']=='true')?true:false ;
	$arr_saisie['filerecord_id'] = $post_data['filerecord_id'] ;
	
	
	// création layout + chargement données
	$file_code = $post_data['file_code'] ;
	
	// *** chargement données existantes
	unset($file_data) ;
	if( !$arr_saisie['is_new'] )
	{
		$file_data = paracrm_lib_data_getRecord( 'file_record', $arr_saisie['file_code'], $arr_saisie['filerecord_id'] ) ;
	}
	
	$ent_file = array() ;
	$query = "SELECT cfgcal.color_filefield FROM define_file f , define_file_cfg_calendar cfgcal
				WHERE f.file_code='$file_code' AND f.file_code=cfgcal.file_code AND cfgcal.color_is_fixed='O'" ;
	$color_field = $_opDB->query_uniqueValue($query) ;
	$query = "SELECT * FROM define_file_entry WHERE file_code='$file_code' ORDER BY entry_field_index" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$field = array() ;
		$field['name'] = 'field_'.$arr['entry_field_code'] ;
		$field['fieldLabel'] = $arr['entry_field_lib'] ;
		switch( $arr['entry_field_type'] )
		{
			case 'string' :
			case 'number' :
			if( $color_field == $arr['entry_field_code'] ) {
				$field['xtype'] = 'colorpickercombo' ;
				break ;
			}
			switch( $arr['entry_field_type'] ) {
				case 'string' :
					$field['xtype'] = 'textfield' ;
					break ;
				case 'number' :
					$field['xtype'] = 'numberfield' ;
					$field['decimalPrecision'] = 3 ;
					break ;
			}
			break ;
			
			case 'bool' :
			$field['xtype'] = 'checkboxfield' ;
			$field['inputValue'] = 1 ;
			$field['uncheckedValue'] = 0 ;
			break ;
			
			case 'date' :
			$field['xtype'] = 'datetimefield' ;
			break ;
			
			case 'link' :
			switch( $arr['entry_field_linktype'] ) {
				case 'treenode' :
					$field['xtype'] = 'op5crmbasebibletreepicker' ;
					$field['selectMode'] = 'single' ;
					$field['bibleId'] = $arr['entry_field_linkbible'] ;
					break ;
					
				case 'entry' :
				default :
					$field['xtype'] = 'op5crmbasebiblepicker' ;
					$field['bibleId'] = $arr['entry_field_linkbible'] ;
					break ;
			}
			break ;
			
			case '_label' :
			$field['xtype'] = 'label' ;
			$field['html'] = '<b>'.$arr['entry_field_lib'].'</b>' ;
			break ;
		}
		if( $arr['entry_field_is_header'] == 'O' )
			$field['allowBlank'] = false ;
		if( $arr['entry_field_is_mandatory'] == 'O' )
			$field['allowBlank'] = false ;
			
		if( isset($file_data) )
			$field['value'] = $file_data[$field['name']] ;
		elseif( $post_data['form_presets'] ) {
			$tmpDecode = json_decode($post_data['form_presets'],true) ;
			if( $tmpDecode[$field['name']] ) {
				$field['value'] = $tmpDecode[$field['name']] ;
			}
		}
		
		$ent_file[] = $field ;
	}
	$arr_saisie['file_form'] = $ent_file ;
	
	$query = "SELECT * FROM define_file WHERE file_code='$file_code'" ;
	$result = $_opDB->query($query) ;
	$arr = $_opDB->fetch_assoc($result) ;
	if( $arr['gmap_is_on'] == 'O' )
	{
		$arr_gmap = array() ;
		foreach( $_opDB->table_fields('define_gmap') as $field )
		{
			$tfield = 'gmap_'.$field ;
			$arr_gmap[$tfield] = NULL ;
			if( isset($file_data) )
				$arr_gmap[$tfield] = $file_data[$tfield] ;
		}
		$arr_saisie['file_gmap'] = $arr_gmap ;
	}
	if( $arr['file_parent_code'] )
	{
		$arr_saisie['file_parent_code'] = $arr['file_parent_code'] ;
		$arr_saisie['filerecord_parent_id'] = $file_data['filerecord_parent_id'] ;
	}
	
	
	// ***** chargement des subfiles *******
	$TAB_subfiles = array() ;
	$query = "SELECT * FROM define_file WHERE file_parent_code='$file_code'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$child_file_code = $arr['file_code'] ;
		
		switch( $arr['file_type'] )
		{
			case 'calendar' :
				break ;
			
			case 'media_img' :
				$cfg_subfile = array() ;
				$cfg_subfile['file_code'] = $child_file_code ;
				$cfg_subfile['file_lib'] = $arr['file_lib'] ;
				$cfg_subfile['file_type'] = 'media_img' ;
				$cfg_subfile['data'] = array() ;
				
				if( !$arr_saisie['is_new'] )
				{
					$cfg_subfile['data'] = array() ;
					foreach( paracrm_lib_data_getRecord( 'file_record', $child_file_code, 0, $parent_key=$arr_saisie['filerecord_id'] ) as $data_record )
					{
						$data_record['_media_id'] = $data_record['filerecord_id'] ;
					
						$cfg_subfile['data'][] = $data_record ;
					}
				}
				
				$TAB_subfiles[] = $cfg_subfile ;
			break ;
		
			default :
				$cfg_subfile = array() ;
				$cfg_subfile['file_code'] = $child_file_code ;
				$cfg_subfile['file_lib'] = $arr['file_lib'] ;
				$cfg_subfile['file_type'] = 'grid' ;
				$cfg_subfile['columns'] = array() ;
				$cfg_subfile['data'] = array() ;
				
				$altfield = array() ;
				$altfield['code'] = 'filerecord_id' ;
				$altfield['lib'] = '' ;
				$altfield['type'] = 'hidden' ;
				$altfield['linkbible'] = '' ;
				$altfield['is_header'] = '' ;
				$altfield['is_highlight'] = '' ;
				$cfg_subfile['columns'][] = $altfield ;
				$queryfile = "SELECT * FROM define_file_entry WHERE file_code='$child_file_code' ORDER BY entry_field_index" ;
				$resultfile = $_opDB->query($queryfile) ;
				while( ($arr_file_field = $_opDB->fetch_assoc($resultfile)) != FALSE )
				{
					$field = array() ;
					$field['code'] = 'field_'.$arr_file_field['entry_field_code'] ;
					$field['lib'] = $arr_file_field['entry_field_lib'] ;
					$field['type'] = $arr_file_field['entry_field_type'] ;
					if( $arr_file_field['entry_field_type'] == 'link' ) {
						$field['linkbible'] = $arr_file_field['entry_field_linkbible'] ;
						$field['linktype'] = $arr_file_field['entry_field_linktype'] ;
					}
					$field['is_header'] = $arr_file_field['entry_field_is_header'] ;
					$field['is_highlight'] = $arr_file_field['entry_field_is_highlight'] ;
					$field['is_mandatory'] = $arr_file_field['entry_field_is_mandatory'] ;
					if( $arr_file_field['entry_field_type'] == 'link' )
					{
						$field['altdisplay'] = 'display_'.$arr_file_field['entry_field_code'] ;
					
						$altfield = array() ;
						$altfield['code'] = 'display_'.$arr_file_field['entry_field_code'] ;
						$altfield['lib'] = '' ;
						$altfield['type'] = 'hidden' ;
						$altfield['linkbible'] = '' ;
						$altfield['is_header'] = '' ;
						$altfield['is_highlight'] = '' ;
						$cfg_subfile['columns'][] = $altfield ;
					}
					$cfg_subfile['columns'][] = $field ;
				}
				
				if( !$arr_saisie['is_new'] )
				{
					$cfg_subfile['data'] = array() ;
					foreach( paracrm_lib_data_getRecord( 'file_record', $child_file_code, 0, $parent_key=$arr_saisie['filerecord_id'] ) as $data_record )
					{
						$cfg_subfile['data'][] = array_merge($data_record, paracrm_data_editTransaction_fileRecord_toolPrettyBible( $child_file_code, $data_record ) ) ;
					}
				}
				
				$TAB_subfiles[] = $cfg_subfile ;
			break ;
		}
	}
	$arr_saisie['file_subfiles'] = $TAB_subfiles ;
	

	return array('success'=>true,'transaction_id'=>$post_data['_transaction_id']) ;
}
function paracrm_data_editTransaction_fileRecord_apply( $arr_saisie, $apply=FALSE)
{
	global $_opDB ;
	
	$file_code = $arr_saisie['file_code'] ;
	
	if( !Auth_Manager::getInstance()->auth_query_sdomain_action(
			Auth_Manager::sdomain_getCurrent(),
			'files',
			array('file_code'=>$file_code),
			$write=true
		)) {
		
		return Auth_Manager::auth_getDenialResponse() ;
	}
	
	// toutes verifications
	$errors_form = array() ;
	$missing_parent = FALSE ;
	if( TRUE )
	{
		// - champs remplis
		// => géré par Ext
	}
	if( $arr_saisie['is_new'] )
	{
		// - parent exist
		if( $arr_saisie['filerecord_parent_id'] > 0 )
		{
			if( !paracrm_lib_data_getRecord('file_record',$arr_saisie['file_parent_code'], $arr_saisie['filerecord_parent_id'] ) )
				$missing_parent = TRUE ;
		}
	}
	else
	{
		// - existe deja pour MaJ ?
		if( !paracrm_lib_data_getRecord('file_record',$file_code, $arr_saisie['filerecord_id'] ) )
			$missing_self = TRUE ;
	}
	
	
	$success = TRUE ;
	if( $errors_form || $missing_parent || $missing_self )
		$success = FALSE ;
		
	$response = array() ;
	$response['success'] = $success ;
	if( $errors_form )
		$response['errors'] = $errors_form ;
	if( $missing_parent )
		$response['msg'] = 'Specified parent missing (deleted ?)' ;
	if( $missing_self )
		$response['msg'] = "Can't find record (deleted ?)" ;
	if( !$apply || !$response['success'] )
		return $response ;
		
	paracrm_lib_data_beginTransaction() ;
	//print_r($arr_saisie['arr_gmap']) ;
	$arr_ent_ins = array() ;
	foreach( $arr_saisie['file_form'] as $field )
	{
		$arr_ent_ins[$field['name']] = $field['value'] ;
	}
	$arr_ent_ins = array_merge( $arr_ent_ins , ($arr_saisie['file_gmap'])?$arr_saisie['file_gmap']:array() ) ;
	//print_r($arr_ent_ins) ;
	if( $arr_saisie['is_new'] )
	{
		$ret = paracrm_lib_data_insertRecord_file( $file_code,
																	$filerecord_parent_id = $arr_saisie['filerecord_parent_id'],
																	$arr_ent_ins ) ;
	}
	else
	{
		$ret = paracrm_lib_data_updateRecord_file( $file_code,
																	$arr_ent_ins ,
																	$filerecord_id = $arr_saisie['filerecord_id'] ) ;
	}
	
	if( $ret <= 0 )
	{
		return array('success'=>false,'msg'=>'Unknown error on DB') ;
	}
		
	$arr_saisie['filerecord_id'] = $ret ;
		
	// ******* save des subfiles ********
	foreach( $arr_saisie['file_subfiles'] as $subfile )
	{
		$file_code = $subfile['file_code'] ;
		foreach( $subfile['data'] as &$data_record )
		{
			// quoi faire ?
			$editor_action = $data_record['_editor_action'] ;
			// unset($data_record['_editor_action']) ;
			switch( $editor_action )
			{
				case 'new'  :
				$ret = paracrm_lib_data_insertRecord_file( $file_code,
																			$filerecord_parent_id = $arr_saisie['filerecord_id'],
																			$data_record ) ;
				$data_record['filerecord_id'] = $ret ;
				break ;
				
				case 'update' :
				$ret = paracrm_lib_data_updateRecord_file( $file_code,
																			$data_record ,
																			$data_record['filerecord_id'] ) ;
				break ;
				
				case 'delete' :
				if( !$data_record['filerecord_id'] )
					break ;
				$ret = paracrm_lib_data_deleteRecord_file( $file_code,
																			$data_record['filerecord_id'] ) ;
				break ;
				
			}
		}
		unset($data_record) ;
		
		if( $subfile['file_type'] == 'media_img' )
		{
			media_contextOpen( $_POST['_sdomainId'] ) ;
			foreach( $subfile['data'] as &$data_record )
			{
				// quoi faire ?
				$editor_action = $data_record['_editor_action'] ;
				// unset($data_record['_editor_action']) ;
				switch( $editor_action )
				{
					case 'new'  :
					media_img_move( $data_record['_media_id'] , $data_record['filerecord_id'] ) ;
					break ;
					
					case 'delete' :
					media_img_delete( $data_record['_media_id'] ) ;
					break ;
				}
			}
			unset($data_record) ;
			media_contextClose() ;
		}
		
		
	}
	paracrm_lib_data_endTransaction(FALSE) ;
	
	
	return array('success'=>true) ;
}

function paracrm_data_editTransaction_fileRecord_toolPrettyBible( $file_code, $data_record )
{
	global $_opDB ;
	
	if( !$GLOBALS['toolPrettyFile'][$file_code] )
	{
		$query = "SELECT entry_field_code, entry_field_linkbible, entry_field_linktype
					FROM define_file_entry
					WHERE file_code='$file_code' AND entry_field_type='link'" ;
		$result = $_opDB->query($query) ;
		$tab = array() ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
		{
			$tab[$arr['entry_field_code']] = array(
				'linkbible' => $arr['entry_field_linkbible'],
				'linktype' => ($arr['entry_field_linktype'] ? $arr['entry_field_linktype'] : 'entry')
			) ;
		}
		$GLOBALS['toolPrettyFile'][$file_code] = $tab ;
	}
	
	// print_r($GLOBALS['toolPrettyFile'][$file_code]) ;
	
	$response = array() ;
	foreach( $GLOBALS['toolPrettyFile'][$file_code] as $entry_field_code => $entry_field_linkdetails )
	{
		$entry_field_linkbible = $entry_field_linkdetails['linkbible'] ;
		$entry_field_linktype = $entry_field_linkdetails['linktype'] ;
	
		if( !$GLOBALS['toolPrettyBible'][$entry_field_linkbible] )
		{
			$GLOBALS['toolPrettyBible'][$entry_field_linkbible] = array() ;
			
			$query = "SELECT tree_field_code
						FROM define_bible_tree
						WHERE bible_code='$entry_field_linkbible' AND tree_field_is_header='O'
						ORDER BY tree_field_index" ;
			$result = $_opDB->query($query) ;
			$tab = array() ;
			while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
			{
				$tab[] = $arr['tree_field_code'] ;
			}
			$GLOBALS['toolPrettyBible'][$entry_field_linkbible]['tree'] = $tab ;
			
			$query = "SELECT entry_field_code
						FROM define_bible_entry
						WHERE bible_code='$entry_field_linkbible' AND entry_field_is_header='O'
						ORDER BY entry_field_index" ;
			$result = $_opDB->query($query) ;
			$tab = array() ;
			while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
			{
				$tab[] = $arr['entry_field_code'] ;
			}
			$GLOBALS['toolPrettyBible'][$entry_field_linkbible]['entry'] = $tab ;
		}
	
		$tfield = 'field_'.$entry_field_code ;
		if( $data_record[$tfield] )
		{
			switch( $entry_field_linktype ) {
				case 'entry' :
					$entry_key = $data_record[$tfield] ;
					$biblerec = paracrm_lib_data_getRecord_bibleEntry( $entry_field_linkbible, $entry_key ) ;
					//echo $data_record[$tfield] ;
					
					$tarr = array() ;
					$tarr[] = '('.$biblerec['treenode_key'].')' ;
					foreach( $GLOBALS['toolPrettyBible'][$entry_field_linkbible]['entry'] as $field )
					{
						$bfield = 'field_'.$field ;
						if( $biblerec[$bfield] == $biblerec['entry_key'] )
							$tarr[] = '<b>'.$biblerec[$bfield].'</b>' ;
						else
							$tarr[] = ''.$biblerec[$bfield].'' ;
					}
					
					$dfield = 'display_'.$entry_field_code ;
					$response[$dfield] = implode(' ',$tarr) ;
					break ;
				case 'treenode' :
					$treenode_key = $data_record[$tfield] ;
					$biblerec = paracrm_lib_data_getRecord_bibleTreenode( $entry_field_linkbible, $treenode_key ) ;
					//echo $data_record[$tfield] ;
					
					$tarr = array() ;
					$tarr[] = '('.$biblerec['treenode_key'].')' ;
					foreach( $GLOBALS['toolPrettyBible'][$entry_field_linkbible]['tree'] as $field )
					{
						$bfield = 'field_'.$field ;
						if( $biblerec[$bfield] == $biblerec['treenode_key'] )
							$tarr[] = '<b>'.$biblerec[$bfield].'</b>' ;
						else
							$tarr[] = ''.$biblerec[$bfield].'' ;
					}
					
					$dfield = 'display_'.$entry_field_code ;
					$response[$dfield] = implode(' ',$tarr) ;
					break ;
			}
		}
	}
	return $response ;
}

?>