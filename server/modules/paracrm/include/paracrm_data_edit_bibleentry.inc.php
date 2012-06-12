<?php

function paracrm_data_editTransaction_bibleEntry( $post_data , &$arr_saisie )
{
	global $_opDB ;

	if( $post_data['_subaction'] == 'init' )
	{
		if( !$post_data['bible_code'] )
		{
			$arr_saisie = NULL ;
			return array('success'=>false) ;
		}
		elseif( $post_data['is_new'] && $post_data['treenode_key'] )
		{
			if( $post_data['treenode_key'] == '&' )
			{}
			elseif( !paracrm_lib_data_getRecord('bible_treenode',$post_data['bible_code'],$post_data['treenode_key']) )
			{
				$arr_saisie = NULL ;
				return array('success'=>false) ;
			}
			$arr_saisie = array() ;
			$arr_saisie['data_type'] = 'bible_entry' ;
			$arr_saisie['bible_code'] = $post_data['bible_code'] ;
			$arr_saisie['is_new'] = TRUE ;
			$arr_saisie['treenode_key'] = $post_data['treenode_key'] ;
			
			$arr_ent = array() ;
			$query = "SELECT * FROM define_bible_entry WHERE bible_code='{$post_data['bible_code']}' ORDER BY entry_field_index" ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
			{
				$tfield = 'field_'.$arr['entry_field_code'] ;
				$arr_ent[$tfield] = NULL ;
			}
			$arr_saisie['arr_ent'] = $arr_ent ;
			
			$query = "SELECT gmap_is_on FROM define_bible WHERE bible_code='{$post_data['bible_code']}'" ;
			if( $_opDB->query_uniqueValue($query) == 'O' )
			{
				$arr_gmap = array() ;
				foreach( $_opDB->table_fields('define_gmap') as $field )
				{
					$tfield = 'gmap_'.$field ;
					$arr_gmap[$tfield] = NULL ;
				}
				$arr_saisie['arr_gmap'] = $arr_gmap ;
			}
		}
		elseif( $post_data['entry_key'] )
		{
			if( !($record = paracrm_lib_data_getRecord('bible_entry',$post_data['bible_code'],$post_data['entry_key'])) )
			{
				$arr_saisie = NULL ;
				return array('success'=>false) ;
			}
			$arr_saisie = array() ;
			$arr_saisie['data_type'] = 'bible_entry' ;
			$arr_saisie['bible_code'] = $post_data['bible_code'] ;
			$arr_saisie['is_new'] = FALSE ;
			$arr_saisie['entry_key'] = $post_data['entry_key'] ;
			$arr_saisie['treenode_key'] = ($record['treenode_key']=='')? '&':$record['treenode_key'] ;
			$arr_ent = array() ;
			$arr_gmap = array() ;
			foreach( $record as $mkey=>$mvalue )
			{
				if( strpos($mkey,'field_') === 0 )
					$arr_ent[$mkey] = $mvalue ;
				if( strpos($mkey,'gmap_') === 0 )
					$arr_gmap[$mkey] = $mvalue ;
			}
			$arr_saisie['arr_ent'] = $arr_ent ;
			$arr_saisie['arr_gmap'] = $arr_gmap ;
		}
		else
		{
			$arr_saisie = NULL ;
			return array('success'=>false) ;
		}
		
		return array('success'=>true,'transaction_id'=>$post_data['_transaction_id']) ;
	}
	
	if( $post_data['_subaction'] == 'get_layout' )
	{
		$bible_code = $arr_saisie['bible_code'] ;
		
		// LAYOUT ?
		// - formulaire principal
		$layout_form = array() ;
		$form_item = array() ;
		$form_item['fieldLabel'] = '<i>Tree position</i>' ;
		$form_item['xtype'] = 'damsfieldtree' ;
		$form_item['dataRoot'] = paracrm_lib_dataTool_getBibleTreeRoot( $bible_code, $arr_saisie['treenode_key'] ) ;
		$form_item['readOnlyChecked'] = true ;
		$form_item['submitValue'] = false ;
		$layout_form[] = $form_item ;
		
		$query = "SELECT * FROM define_bible_entry WHERE bible_code='{$bible_code}' ORDER BY entry_field_index" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
		{
			$form_item = array() ;
			switch( $arr['entry_field_type'] )
			{
				case 'string' :
				case 'number' :
				$form_item['xtype'] = 'textfield' ;
				$form_item['name'] = 'field_'.$arr['entry_field_code'] ;
				$form_item['fieldLabel'] = $arr['entry_field_lib'] ;
				if( $arr['entry_field_is_key'] == 'O' )
				{
					$form_item['fieldLabel'] = '<b>'.$arr['entry_field_lib'].'</b>' ;
					//$form_item['readOnly'] = !($arr_saisie['is_new']) ;
					$form_item['strToUpper'] = true ;
					$form_item['allowBlank'] = false ;
				}
				elseif( $arr['entry_field_is_header'] == 'O' )
				{
					$form_item['fieldLabel'] = '<u>'.$arr['entry_field_lib'].'</u>' ;
					$form_item['allowBlank'] = false ;
				}
				break ;
				
				case 'link' :
				$form_item['xtype'] = 'damsfieldtree' ;
				$form_item['name'] = 'field_'.$arr['entry_field_code'] ;
				$form_item['fieldLabel'] = $arr['entry_field_lib'] ;
				$form_item['dataRoot'] = paracrm_lib_dataTool_getBibleTreeRoot( $arr['entry_field_linkbible'], NULL ) ;
				$form_item['allowBlank'] = true ;
				break ;
				
				default :
				continue 2 ;
			}
			$layout_form[] = $form_item ;
		}
		
		$gmap_is_on = FALSE ;
		$query = "SELECT gmap_is_on FROM define_bible WHERE bible_code='{$bible_code}'" ;
		if( $_opDB->query_uniqueValue($query) == 'O' )
			$gmap_is_on = TRUE ;
	
		$layout = array() ;
		$layout['form'] = $layout_form ;
		$layout['gmap'] = $gmap_is_on ;
	
		return array('success'=>true,'data'=>$layout) ;
	}
	
	if( $post_data['_subaction'] == 'form_getValues' )
	{
		$ret = array() ;
		foreach( $arr_saisie['arr_ent'] as $mkey => $mvalue )
		{
			if( is_array($mvalue) )
				$ret[$mkey] = json_encode($mvalue) ;
			else
				$ret[$mkey] = $mvalue ;
		}
		return array('success'=>true,'data'=>$ret) ;
	}
	
	if( $post_data['_subaction'] == 'form_setValues' )
	{
		// données du formulaire
		$arr_ent = $arr_saisie['arr_ent'] ;
		foreach( $arr_ent as $mkey => $dummy )
		{
			if( is_array($dummy) )
			{
				$arr_ent[$mkey] = json_decode($post_data[$mkey]) ;
			}
			else
			{
				$arr_ent[$mkey] = trim($post_data[$mkey]) ;
			}
		}
		$arr_saisie['arr_ent'] = $arr_ent ;
		
		return paracrm_data_editTransaction_bibleEntry_apply($arr_saisie, $apply=FALSE) ;
	}
	
	
	
	if( $post_data['_subaction'] == 'gmap_get' )
	{
		$ret = array() ;
		foreach( $arr_saisie['arr_gmap'] as $mkey => $mvalue )
		{
			$ret[$mkey] = $mvalue ;
		}
		return array('success'=>true,'data'=>$ret) ;
	}
	if( $post_data['_subaction'] == 'gmap_set' )
	{
		// données du formulaire
		$arr_ent = $arr_saisie['arr_gmap'] ;
		foreach( $arr_ent as $mkey => $dummy )
		{
			$arr_ent[$mkey] = trim($post_data[$mkey]) ;
		}
		$arr_saisie['arr_gmap'] = $arr_ent ;
		
		return array('success'=>true) ;
	}
	
	
	
	
	
	
	
	
	
	
	if( $post_data['_subaction'] == 'save_and_apply' )
	{
		// OK save
		return paracrm_data_editTransaction_bibleEntry_apply($arr_saisie, $apply=TRUE) ;
	}
	
	
	
	
}
function paracrm_data_editTransaction_bibleEntry_apply($arr_saisie, $apply=FALSE)
{
	global $_opDB ;
	
	$bible_code = $arr_saisie['bible_code'] ;
	
	$query = "SELECT entry_field_code FROM define_bible_entry WHERE bible_code='$bible_code' AND entry_field_is_key='O'" ;
	if( $mval = $_opDB->query_uniqueValue($query) )
		$key_field = 'field_'.$mval ;

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
		if( $arr_saisie['treenode_key'] != '&' )
		{
			if( !paracrm_lib_data_getRecord('bible_treenode',$bible_code, $arr_saisie['treenode_key'] ) )
				$missing_parent = TRUE ;
		}
			
		// - pas de doublon
		if( paracrm_lib_data_getRecord('bible_entry',$bible_code,$arr_saisie['arr_ent'][$key_field]) )
			$errors_form[$key_field] = 'Existing entry. Duplicate !' ;
	}
	else
	{
		if( $arr_saisie['arr_ent'][$key_field] != $arr_saisie['entry_key'] )
		{
			if( FALSE )
			{
				$errors_form[$key_field] = 'Cannot rename key field !' ;
			}
			else
			{
				// - pas de doublon
				if( paracrm_lib_data_getRecord('bible_entry',$bible_code,$arr_saisie['arr_ent'][$key_field]) )
					$errors_form[$key_field] = 'Existing entry. Duplicate !' ;
			}
		}
			
	}
	
	
	$success = TRUE ;
	if( $errors_form || $missing_parent )
		$success = FALSE ;
		
	$response = array() ;
	$response['success'] = $success ;
	if( $errors_form )
		$response['errors'] = $errors_form ;
	if( $missing_parent )
		$response['msg'] = 'Specified parent missing (deleted ?)' ;
	if( !$apply || !$response['success'] )
		return $response ;
		
	//print_r($arr_saisie['arr_gmap']) ;
	paracrm_lib_data_beginTransaction() ;
	$arr_ent_ins = array_merge( $arr_saisie['arr_ent'] , ($arr_saisie['arr_gmap'])?$arr_saisie['arr_gmap']:array() ) ;
	if( $arr_saisie['is_new'] )
	{
		$ret = paracrm_lib_data_insertRecord_bibleEntry( $bible_code,
																	$entry_key = $arr_saisie['arr_ent'][$key_field],
																	$treenode_key = $arr_saisie['treenode_key'] ,
																	$arr_ent_ins ) ;
	}
	else
	{
		$ret = paracrm_lib_data_updateRecord_bibleEntry( $bible_code,
																	$entry_key = $arr_saisie['entry_key'],
																	$arr_ent_ins ) ;
	}
	paracrm_lib_data_endTransaction(FALSE) ;
	
	if( $ret == 0 )
		return array('success'=>true) ;
	else
		return array('success'=>false,'msg'=>'Unknown error on DB') ;
}

?>