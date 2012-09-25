<?php

function paracrm_define_getMainToolbar($post_data)
{
	global $_opDB ;

	switch( $post_data['data_type'] )
	{
		case 'bible' :
		$query = "SELECT bible_code as bibleId , bible_lib as text , bible_iconfile as icon , '' as store_type , gmap_is_on
						FROM define_bible
						ORDER BY bible_code" ;
		break ;
		
		case 'file' :
		$query = "SELECT file_code as fileId , file_lib as text , file_iconfile as icon , file_type as store_type , gmap_is_on , file_parent_code
						FROM define_file
						ORDER BY IF(file_parent_code<>'',file_parent_code,file_code),IF(file_parent_code<>'',file_code,'')" ;
		break ;
		
		default :
		return $TAB ;
	}
	$result = $_opDB->query($query) ;
	$TAB = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$arr['viewmode_grid'] = true ;
		if( $arr['gmap_is_on'] == 'O' )
			$arr['viewmode_gmap'] = true ;
		if( $arr['store_type'] == 'media_img' )
			$arr['viewmode_gallery'] = true ;
			
		if( $post_data['data_type'] == 'file' )
		{
			if( $arr['file_parent_code'] != '' )
			{
				$arr['text'] = '&nbsp;&nbsp;'.$arr['text'] ;
			}
			else
			{
				$arr['text'] = '<b>'.$arr['text'].'</b>' ;
			}
		}
			
		unset($arr['store_type']) ;
		unset($arr['gmap_is_on']) ;
	
		$arr['icon'] = 'images/op5img/'.$arr['icon'] ;
		$TAB[] = $arr ;
	}
	return $TAB ;
}

function paracrm_define_manageTransaction( $post_data )
{
	global $_opDB ;

	if( $post_data['_subaction'] == 'init_new' && $post_data['data_type'] )
	{
		$transaction_id = $_SESSION['next_transaction_id']++ ;
		
		$_SESSION[$transaction_id] = array() ;
		$_SESSION[$transaction_id]['transaction_code'] = 'paracrm_define_manageTransaction' ;
		$_SESSION[$transaction_id]['arr_saisie'] = array() ;
		
		$TAB['success'] = true ;
		$TAB['transaction_id'] = $transaction_id ;
		return $TAB ;
	}
	if( $post_data['_subaction'] == 'init_modify' 
		&& ( $post_data['data_type']=='bible' && $post_data['bible_code']
				||$post_data['data_type']=='file' && $post_data['file_code'])
	){
		$transaction_id = $_SESSION['next_transaction_id']++ ;
		
		$_SESSION['pouet'] = 'okok' ;
	
		$_SESSION['transactions'][$transaction_id] = array() ;
		$_SESSION['transactions'][$transaction_id]['transaction_code'] = 'paracrm_define_manageTransaction' ;
		
		
		$arr_saisie = array() ;
		$arr_saisie['data_type'] = $post_data['data_type'] ;
		switch( $arr_saisie['data_type'] )
		{
			case 'bible' :
			$arr_saisie['bible_code'] = $post_data['bible_code'] ;
			$query = "SELECT bible_code as store_code , bible_lib as store_lib , gmap_is_on from define_bible WHERE bible_code='{$arr_saisie['bible_code']}'" ;
			break ;
		
			case 'file' :
			$arr_saisie['file_code'] = $post_data['file_code'] ;
			$query = "SELECT file_code as store_code , file_lib as store_lib , file_parent_code as store_parent_code , gmap_is_on , file_type as store_type from define_file WHERE file_code='{$arr_saisie['file_code']}'" ;
			break ;
		}
		$result = $_opDB->query($query) ;
		$arr_saisie['arr_ent'] = $_opDB->fetch_assoc($result) ;
		$arr_saisie['arr_ent']['gmap_is_on'] = ($arr_saisie['arr_ent']['gmap_is_on']=='O')? true:false ;
		
		$arr_saisie['cfg_calendar'] = NULL ;
		if( $arr_saisie['data_type'] == 'file' && $arr_saisie['arr_ent']['store_type'] == 'calendar' )
		{
			$query = "SELECT * FROM define_file_cfg_calendar WHERE file_code='{$arr_saisie['file_code']}'" ;
			$result = $_opDB->query($query) ;
			$arr_saisie['cfg_calendar'] = $_opDB->fetch_assoc($result) ;
			$arr_saisie['cfg_calendar']['account_is_on'] = ($arr_saisie['cfg_calendar']['account_is_on']=='O')? true:false ;
			$arr_saisie['cfg_calendar']['duration_is_fixed'] = ($arr_saisie['cfg_calendar']['duration_is_fixed']=='O')? true:false ;
		}
		
		$arr_saisie['tab_treeFields'] = NULL ;
		if( $arr_saisie['data_type'] == 'bible' )
		{
			$tab = array() ;
			$query = "SELECT * FROM define_bible_tree WHERE bible_code='{$arr_saisie['bible_code']}' ORDER BY tree_field_index" ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
			{
				unset( $arr['tree_field_index'] ) ;
				if( $arr['tree_field_is_highlight'] == 'O' )
					$arr['tree_field_is_highlight'] = true ;
				else
					$arr['tree_field_is_highlight'] = false ;
				if( $arr['tree_field_is_header'] == 'O' )
					$arr['tree_field_is_header'] = true ;
				else
					$arr['tree_field_is_header'] = false ;
				if( $arr['tree_field_type'] == 'link' )
					$arr['tree_field_type'] = $arr['tree_field_type'].'_'.$arr['tree_field_linkbible'] ;
				$tab[] = $arr ;
			}
			$arr_saisie['tab_treeFields'] = $tab ;
			
			$tab = array() ;
			$query = "SELECT * FROM define_bible_entry WHERE bible_code='{$arr_saisie['bible_code']}' ORDER BY entry_field_index" ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
			{
				unset( $arr['entry_field_index'] ) ;
				
				if( $arr['entry_field_is_highlight'] == 'O' )
					$arr['entry_field_is_highlight'] = true ;
				else
					$arr['entry_field_is_highlight'] = false ;
					
				if( $arr['entry_field_is_header'] == 'O' )
					$arr['entry_field_is_header'] = true ;
				else
					$arr['entry_field_is_header'] = false ;
					
				if( $arr['entry_field_type'] == 'link' )
					$arr['entry_field_type'] = $arr['entry_field_type'].'_'.$arr['entry_field_linkbible'] ;
					
				$tab[] = $arr ;
			}
			$arr_saisie['tab_entryFields'] = $tab ;
		}
		if( $arr_saisie['data_type'] == 'file' )
		{
			$tab = array() ;
			$query = "SELECT * FROM define_file_entry WHERE file_code='{$arr_saisie['file_code']}' ORDER BY entry_field_index" ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
			{
				unset( $arr['entry_field_index'] ) ;
				
				if( $arr['entry_field_is_highlight'] == 'O' )
					$arr['entry_field_is_highlight'] = true ;
				else
					$arr['entry_field_is_highlight'] = false ;
					
				if( $arr['entry_field_is_header'] == 'O' )
					$arr['entry_field_is_header'] = true ;
				else
					$arr['entry_field_is_header'] = false ;
					
				if( $arr['entry_field_type'] == 'link' )
					$arr['entry_field_type'] = $arr['entry_field_type'].'_'.$arr['entry_field_linkbible'] ;
					
				$tab[] = $arr ;
			}
			$arr_saisie['tab_entryFields'] = $tab ;
		}
		
		$_SESSION['transactions'][$transaction_id]['arr_saisie'] = $arr_saisie ;
		
		$TAB['success'] = true ;
		$TAB['transaction_id'] = $transaction_id ;
		return $TAB ;
	}
	
	if( $post_data['_transaction_id'] )
	{
		if( !$_SESSION['transactions'][$post_data['_transaction_id']] )
			return NULL ;
		$transaction_id = $post_data['_transaction_id'] ;
		$arr_transaction = $_SESSION['transactions'][$post_data['_transaction_id']] ;
		if( $arr_transaction['transaction_code'] != 'paracrm_define_manageTransaction' )
			return NULL ;
	}
	
	
	if( $arr_transaction && $post_data['_subaction'] == 'tool_getLinks' )
	{
		$arr_saisie = $arr_transaction['arr_saisie'] ;
		$links_tree = $links_entry = $parent_files = array() ;
		
		if( $arr_transaction['arr_saisie']['data_type'] == 'bible' )
		{
			$tab = array() ;
			$query = "SELECT bible_code, bible_lib 
							FROM define_bible 
							WHERE bible_code<>'{$arr_saisie['bible_code']}' ORDER BY bible_code" ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
			{
				$links_tree[] = array('dataType'=>'link_'.$arr['bible_code'],'dataTypeLib'=>'<b>Link</b>: '.$arr['bible_lib']) ;
				$links_entry[] = array('dataType'=>'link_'.$arr['bible_code'],'dataTypeLib'=>'<b>Link</b>: '.$arr['bible_lib']) ;
			}
		}
		if( $arr_transaction['arr_saisie']['data_type'] == 'file' )
		{
			$tab = array() ;
			$query = "SELECT bible_code, bible_lib 
							FROM define_bible 
							WHERE 1 ORDER BY bible_code" ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
			{
				$links_entry[] = array('dataType'=>'link_'.$arr['bible_code'],'dataTypeLib'=>'<b>Link</b>: '.$arr['bible_lib']) ;
			}
			
			$query = "SELECT file_code, file_lib 
							FROM define_file 
							WHERE file_code<>'{$arr_saisie['file_code']}' AND file_parent_code='' ORDER BY file_code" ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
			{
				$parent_files[] = array('fileCode'=>$arr['file_code'],'fileLib'=>$arr['file_code'].' : '.$arr['file_lib']) ;
			}
		}
		
		
		return array('success'=>true,'data'=>array('links_tree'=>$links_tree,'links_entry'=>$links_entry,'parent_files'=>$parent_files)) ;
	}
	
	
	
	if( $arr_transaction && $post_data['_subaction'] == 'ent_get' )
	{
		$data = $arr_transaction['arr_saisie']['arr_ent'] ;
		return array('success'=>true,'data'=>$data) ;
	}
	if( $arr_transaction && $post_data['_subaction'] == 'ent_set' )
	{
		$arr_saisie = $arr_transaction['arr_saisie'] ;
	
		// données du formulaire
		$arr_ent = $arr_saisie['arr_ent'] ;
		if( !$arr_saisie['bible_code'] && !$arr_saisie['file_code'] )
			$arr_ent['store_code'] = trim(strtoupper($post_data['store_code'])) ;
		$arr_ent['store_lib'] = trim($post_data['store_lib']) ;
		$arr_ent['store_type'] = trim($post_data['store_type']) ;
		$arr_ent['store_parent_code'] = $post_data['store_parent_code'] ;
		$arr_ent['gmap_is_on'] = ($post_data['gmap_is_on']=='on')? true:false ;
		$arr_saisie['arr_ent'] = $arr_ent ;
		$_SESSION['transactions'][$transaction_id]['arr_saisie'] = $arr_saisie ;
		
		$errors_form = array() ;
		foreach( array('store_code','store_lib') as $field )
		{
			if( !$arr_saisie['arr_ent'][$field] )
				$errors_form[$field] = 'Invalid' ;
		}
		
		return paracrm_define_manageTransaction_apply($arr_saisie, $apply=FALSE) ;
	}
	
	
	
	
	if( $arr_transaction && $post_data['_subaction'] == 'calendarCfg_get' )
	{
		$data = $arr_transaction['arr_saisie']['cfg_calendar'] ;
		return array('success'=>true,'data'=>$data) ;
	}
	if( $arr_transaction && $post_data['_subaction'] == 'calendarCfg_set' )
	{
		$arr_saisie = $arr_transaction['arr_saisie'] ;
		
		$cfg_calendar = array() ;
		$cfg_calendar['eventstart_filefield'] = $post_data['eventstart_filefield'] ;
		$cfg_calendar['eventend_filefield'] = $post_data['eventend_filefield'] ;
		$cfg_calendar['eventstatus_filefield'] = $post_data['eventstatus_filefield'] ;
		$cfg_calendar['account_is_on'] = ($post_data['account_is_on']=='on')? true:false ;
		$cfg_calendar['account_filefield'] = $post_data['account_filefield'] ;
		$cfg_calendar['duration_is_fixed'] = ($post_data['duration_is_fixed']=='on')? true:false ;
		$cfg_calendar['duration_src_filefield'] = $post_data['duration_src_filefield'] ;
		$cfg_calendar['duration_src_biblefield'] = $post_data['duration_src_biblefield'] ;		
		$arr_saisie['cfg_calendar'] = $cfg_calendar ;
		$_SESSION['transactions'][$transaction_id]['arr_saisie'] = $arr_saisie ;
		
		return array('success'=>true) ;
	}
	
	
	

	if( $arr_transaction && $post_data['_subaction'] == 'treeFields_get' )
	{
		if( $arr_transaction['arr_saisie']['data_type'] == 'bible' )
		{
			$data = $arr_transaction['arr_saisie']['tab_treeFields'] ;
			return array('success'=>true,'data'=>$data) ;
		}
		else
			return array('success'=>false) ;
	}
	if( $arr_transaction && $post_data['_subaction'] == 'treeFields_set' )
	{
		$data = json_decode($post_data['data'],TRUE) ;
		$arr_transaction['arr_saisie']['tab_treeFields'] = $data ;
		$_SESSION['transactions'][$transaction_id] = $arr_transaction ;
		return array('success'=>true) ;
	}

	if( $arr_transaction && $post_data['_subaction'] == 'entryFields_get' )
	{
		$data = $arr_transaction['arr_saisie']['tab_entryFields'] ;
		return array('success'=>true,'data'=>$data) ;
	}
	if( $arr_transaction && $post_data['_subaction'] == 'entryFields_set' )
	{
		$data = json_decode($post_data['data'],TRUE) ;
		$arr_transaction['arr_saisie']['tab_entryFields'] = $data ;
		$_SESSION['transactions'][$transaction_id] = $arr_transaction ;
	
		return array('success'=>true) ;
	}
	
	
	if( $arr_transaction && $post_data['_subaction'] == 'save_and_apply' )
	{
		$arr_saisie = $arr_transaction['arr_saisie'] ;
	
		// OK save
		return paracrm_define_manageTransaction_apply($arr_saisie, $apply=TRUE) ;
	}
}
function paracrm_define_manageTransaction_apply($arr_saisie, $apply=FALSE)
{
	switch( $arr_saisie['data_type'] )
	{
		case 'bible' :
		return paracrm_define_manageTransaction_applyBible($arr_saisie, $apply) ;
		
		case 'file' :
		return paracrm_define_manageTransaction_applyFile($arr_saisie, $apply) ;
		
		
		default :
		return array('success'=>false) ;
	}

}
function paracrm_define_manageTransaction_applyBible($arr_saisie, $apply)
{
	global $_opDB ;
	
	$errors_form = array() ;
	foreach( array('store_code','store_lib') as $field )
	{
		if( !$arr_saisie['arr_ent'][$field] )
			$errors_form[$field] = 'Invalid' ;
	}
	
	$empty_definition = FALSE ;
	if( isset($arr_saisie['tab_treeFields']) && count($arr_saisie['tab_treeFields']) == 0 )
		$empty_definition = TRUE ;
	if( isset($arr_saisie['tab_entryFields']) && count($arr_saisie['tab_entryFields']) == 0 )
		$empty_definition = TRUE ;
		
	$key_conflict = FALSE ;
	if( $arr_saisie['bible_code'] )
	{
		$query = "SELECT tree_field_code FROM define_bible_tree 
					WHERE bible_code='{$arr_saisie['bible_code']}' AND tree_field_is_key='O'" ;
		$tree_primarykey_old = $_opDB->query_uniqueValue($query) ;
		
		reset($arr_saisie['tab_treeFields']) ;
		$ttmp = current($arr_saisie['tab_treeFields']) ;
		$tree_primarykey_new = $ttmp['tree_field_code'] ;
		
		if( $tree_primarykey_old && ($tree_primarykey_old != $tree_primarykey_new) )
			$key_conflict = TRUE ;
			
			
		$query = "SELECT entry_field_code FROM define_bible_entry 
					WHERE bible_code='{$arr_saisie['bible_code']}' AND entry_field_is_key='O'" ;
		$entry_primarykey_old = $_opDB->query_uniqueValue($query) ;
		
		reset($arr_saisie['tab_entryFields']) ;
		$ttmp = current($arr_saisie['tab_entryFields']) ;
		$entry_primarykey_new = $ttmp['entry_field_code'] ;
		
		if( $entry_primarykey_old && ($entry_primarykey_old != $entry_primarykey_new) )
			$key_conflict = TRUE ;
	}
		
	$success = TRUE ;
	if( $errors_form || $empty_definition || $key_conflict )
		$success = FALSE ;
		
	$response = array() ;
	$response['success'] = $success ;
	if( $errors_form )
		$response['errors'] = $errors_form ;
	if( $empty_definition )
		$response['msg'] = 'Cannot define store with empty fieldset(s)' ;
	elseif( $key_conflict )
		$response['msg'] = 'Primary keys doesnt match' ;
	if( !$apply || !$response['success'] )
		return $response ;
	
	
	$bible_code = $arr_saisie['arr_ent']['store_code'] ;
	
	$query = "DELETE FROM define_bible WHERE bible_code='$bible_code'" ;
	$_opDB->query($query) ;
	$query = "DELETE FROM define_bible_entry WHERE bible_code='$bible_code'" ;
	$_opDB->query($query) ;
	$query = "DELETE FROM define_bible_tree WHERE bible_code='$bible_code'" ;
	$_opDB->query($query) ;
	
	$arr_ins = array() ;
	$arr_ins['bible_code'] = $arr_saisie['arr_ent']['store_code'] ;
	$arr_ins['bible_lib'] = $arr_saisie['arr_ent']['store_lib'] ;
	$arr_ins['bible_iconfile'] = 'ico_dataadd_16.gif' ;
	$arr_ins['gmap_is_on'] = ($arr_saisie['arr_ent']['gmap_is_on']==TRUE)?'O':'N' ;
	$_opDB->insert('define_bible',$arr_ins) ;
	
	$idx = 1 ;
	foreach( $arr_saisie['tab_treeFields'] as $mfield )
	{
		if( strpos($mfield['tree_field_type'],'link_') === 0 )
		{
			$mfield['tree_field_linkbible'] = substr($mfield['tree_field_type'],5,strlen($mfield['tree_field_type'])-5) ;
			$mfield['tree_field_type'] = 'link' ;
		}
		else
		{
			$mfield['tree_field_linkbible'] = '' ;
		}
	
		$arr_ins = array() ;
		$arr_ins['bible_code'] = $bible_code ;
		$arr_ins['tree_field_code'] = $mfield['tree_field_code'] ;
		$arr_ins['tree_field_is_key'] = ($idx==1)? 'O':'' ;
		$arr_ins['tree_field_index'] = $idx++ ;
		$arr_ins['tree_field_lib'] = $mfield['tree_field_lib'] ;
		$arr_ins['tree_field_type'] = ($mfield['tree_field_type'])? $mfield['tree_field_type']:'string' ;
		$arr_ins['tree_field_linkbible'] = $mfield['tree_field_linkbible'] ;
		$arr_ins['tree_field_is_header'] = ($mfield['tree_field_is_header'])? 'O':'' ;
		$arr_ins['tree_field_is_highlight'] = ($mfield['tree_field_is_highlight'])? 'O':'' ;
		$_opDB->insert('define_bible_tree',$arr_ins) ;
	}
	
	$idx = 1 ;
	foreach( $arr_saisie['tab_entryFields'] as $mfield )
	{
		if( strpos($mfield['entry_field_type'],'link_') === 0 )
		{
			$mfield['entry_field_linkbible'] = substr($mfield['entry_field_type'],5,strlen($mfield['entry_field_type'])-5) ;
			$mfield['entry_field_type'] = 'link' ;
		}
		else
		{
			$mfield['entry_field_linkbible'] = '' ;
		}
	
		$arr_ins = array() ;
		$arr_ins['bible_code'] = $bible_code ;
		$arr_ins['entry_field_code'] = $mfield['entry_field_code'] ;
		$arr_ins['entry_field_is_key'] = ($idx==1)? 'O':'' ;
		$arr_ins['entry_field_index'] = $idx++ ;
		$arr_ins['entry_field_lib'] = $mfield['entry_field_lib'] ;
		$arr_ins['entry_field_type'] = ($mfield['entry_field_type'])? $mfield['entry_field_type']:'string' ;
		$arr_ins['entry_field_linkbible'] = $mfield['entry_field_linkbible'] ;
		$arr_ins['entry_field_is_header'] = ($mfield['entry_field_is_header'])? 'O':'' ;
		$arr_ins['entry_field_is_highlight'] = ($mfield['entry_field_is_highlight'])? 'O':'' ;
		$_opDB->insert('define_bible_entry',$arr_ins) ;
	}
	
	paracrm_define_buildViewBible( $bible_code ) ;
	
	return array('success'=>true) ;
}

function paracrm_define_manageTransaction_applyFile($arr_saisie, $apply)
{
	global $_opDB ;
	
	$errors_form = array() ;
	foreach( array('store_code','store_lib') as $field )
	{
		if( !$arr_saisie['arr_ent'][$field] )
			$errors_form[$field] = 'Invalid' ;
	}
	
	$empty_definition = FALSE ;
	if( isset($arr_saisie['tab_entryFields']) && count($arr_saisie['tab_entryFields']) == 0 )
		$empty_definition = TRUE ;
		
	$key_conflict = FALSE ;
		
	$success = TRUE ;
	if( $errors_form || $empty_definition || $key_conflict )
		$success = FALSE ;
		
	$response = array() ;
	$response['success'] = $success ;
	if( $errors_form )
		$response['errors'] = $errors_form ;
	if( $empty_definition )
		$response['msg'] = 'Cannot define store with empty fieldset(s)' ;
	elseif( $key_conflict )
		$response['msg'] = 'Primary keys doesnt match' ;
	if( !$apply || !$response['success'] )
		return $response ;
	
	
	$file_code = $arr_saisie['arr_ent']['store_code'] ;
	
	$query = "DELETE FROM define_file WHERE file_code='$file_code'" ;
	$_opDB->query($query) ;
	$query = "DELETE FROM define_file_cfg_calendar WHERE file_code='$file_code'" ;
	$_opDB->query($query) ;
	$query = "DELETE FROM define_file_entry WHERE file_code='$file_code'" ;
	$_opDB->query($query) ;
	
	$arr_ins = array() ;
	$arr_ins['file_code'] = $arr_saisie['arr_ent']['store_code'] ;
	$arr_ins['file_lib'] = $arr_saisie['arr_ent']['store_lib'] ;
	$arr_ins['file_parent_code'] = $arr_saisie['arr_ent']['store_parent_code'] ;
	$arr_ins['file_type'] = $arr_saisie['arr_ent']['store_type'] ;
	$arr_ins['file_iconfile'] = ($arr_saisie['arr_ent']['store_parent_code']) ? 'ico_filechild_16.gif':'ico_showref_listall.gif' ;
	$arr_ins['gmap_is_on'] = ($arr_saisie['arr_ent']['gmap_is_on']==TRUE)?'O':'N' ;
	$_opDB->insert('define_file',$arr_ins) ;
	
	
	if( $arr_saisie['arr_ent']['store_type'] == 'calendar' && is_array($arr_saisie['cfg_calendar']) )
	{
		$arr_ins = array() ;
		$arr_ins['file_code'] = $file_code ;
		$arr_ins['eventstart_filefield'] = $arr_saisie['cfg_calendar']['eventstart_filefield'] ;
		$arr_ins['eventend_filefield'] = $arr_saisie['cfg_calendar']['eventend_filefield'] ;
		$arr_ins['eventstatus_filefield'] = $arr_saisie['cfg_calendar']['eventstatus_filefield'] ;
		$arr_ins['account_is_on'] = ($arr_saisie['cfg_calendar']['account_is_on']==TRUE)?'O':'N' ;
		$arr_ins['account_filefield'] = $arr_saisie['cfg_calendar']['account_filefield'] ;
		$arr_ins['duration_is_fixed'] = ($arr_saisie['cfg_calendar']['duration_is_fixed']==TRUE)?'O':'N' ;
		$arr_ins['duration_src_filefield'] = $arr_saisie['cfg_calendar']['duration_src_filefield'] ;
		$arr_ins['duration_src_biblefield'] = $arr_saisie['cfg_calendar']['duration_src_biblefield'] ;
		$_opDB->insert('define_file_cfg_calendar',$arr_ins) ;
	}
	
	
	
	$idx = 1 ;
	foreach( $arr_saisie['tab_entryFields'] as $mfield )
	{
		if( strpos($mfield['entry_field_type'],'link_') === 0 )
		{
			$mfield['entry_field_linkbible'] = substr($mfield['entry_field_type'],5,strlen($mfield['entry_field_type'])-5) ;
			$mfield['entry_field_type'] = 'link' ;
		}
		else
		{
			$mfield['entry_field_linkbible'] = '' ;
		}
	
		$arr_ins = array() ;
		$arr_ins['file_code'] = $file_code ;
		$arr_ins['entry_field_code'] = $mfield['entry_field_code'] ;
		$arr_ins['entry_field_index'] = $idx++ ;
		$arr_ins['entry_field_lib'] = $mfield['entry_field_lib'] ;
		$arr_ins['entry_field_type'] = ($mfield['entry_field_type'])? $mfield['entry_field_type']:'string' ;
		$arr_ins['entry_field_linkbible'] = $mfield['entry_field_linkbible'] ;
		$arr_ins['entry_field_is_header'] = ($mfield['entry_field_is_header'])? 'O':'' ;
		$arr_ins['entry_field_is_highlight'] = ($mfield['entry_field_is_highlight'])? 'O':'' ;
		$_opDB->insert('define_file_entry',$arr_ins) ;
	}
	
	paracrm_define_buildViewFile( $file_code ) ;
	
	return array('success'=>true) ;
}





function paracrm_define_buildViewBible( $bible_code )
{
	global $_opDB ;
	
	
	//chargement des champs
	$arr_field_type = array() ;
	$query = "SELECT * FROM define_bible_tree WHERE bible_code='$bible_code' ORDER BY tree_field_index" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$arr_field_type[$arr['tree_field_code']] = $arr['tree_field_type'] ;
	}


	$view_name = 'view_bible_'.$bible_code.'_tree' ;
	$query = "DROP VIEW IF EXISTS $view_name" ;
	$_opDB->query($query) ;
	
	$query = "CREATE ALGORITHM=MERGE VIEW $view_name AS SELECT mstr.treenode_racx, mstr.treenode_key, mstr.treenode_parent_key" ;
	foreach( $arr_field_type as $field_code => $field_type )
	{
		$query.=','.'t_'.$field_code.'.' ;
		switch( $field_type )
		{
			case 'string' :
			$query.='treenode_field_value_string' ;
			break ;
			
			case 'number' :
			$query.='treenode_field_value_number' ;
			break ;
			
			case 'date' :
			$query.='treenode_field_value_date' ;
			break ;
			
			case 'link' :
			$query.='treenode_field_value_link' ;
			break ;
		}
		$query.= " AS field_".$field_code ;
	}
	$query.= " FROM store_bible_tree mstr" ;
	foreach( $arr_field_type as $field_code => $field_type )
	{
		$query.= " LEFT OUTER JOIN store_bible_tree_field t_{$field_code} 
						ON t_{$field_code}.treenode_racx = mstr.treenode_racx 
							AND t_{$field_code}.treenode_field_code='$field_code'" ;
	}
	$query.= " WHERE mstr.bible_code='$bible_code'" ;
	$_opDB->query($query) ;
	
	
	
	
	
	// chargement gmap
	$arr_gmap_define = array() ;
	$query = "SELECT gmap_is_on FROM define_bible WHERE bible_code='$bible_code'" ;
	if( $_opDB->query_uniqueValue($query) == 'O' )
	{
		$arr_gmap_define = $_opDB->table_fields('define_gmap') ;
	}
	//chargement des champs
	$arr_field_type = array() ;
	$query = "SELECT * FROM define_bible_entry WHERE bible_code='$bible_code' ORDER BY entry_field_index" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$arr_field_type[$arr['entry_field_code']] = $arr['entry_field_type'] ;
	}
	
	$view_name = 'view_bible_'.$bible_code.'_entry' ;
	$query = "DROP VIEW IF EXISTS $view_name" ;
	$_opDB->query($query) ;
	
	$query = "CREATE ALGORITHM=MERGE VIEW $view_name AS SELECT mstr.entry_racx, mstr.entry_key, mstr.treenode_key" ;
	foreach( $arr_gmap_define as $gmap_field )
	{
		$gmap_field = 'gmap_'.$gmap_field ;
		$query.=','.'t_'.$gmap_field.'.'.'entry_field_value_link'." AS ".$gmap_field ;
	}
	foreach( $arr_field_type as $field_code => $field_type )
	{
		$query.=','.'t_'.$field_code.'.' ;
		switch( $field_type )
		{
			case 'string' :
			$query.='entry_field_value_string' ;
			break ;
			
			case 'number' :
			$query.='entry_field_value_number' ;
			break ;
			
			case 'date' :
			$query.='entry_field_value_date' ;
			break ;
			
			case 'link' :
			$query.='entry_field_value_link' ;
			break ;
		}
		$query.= " AS field_".$field_code ;
	}
	$query.= " FROM store_bible_entry mstr" ;
	foreach( $arr_field_type as $field_code => $field_type )
	{
		$query.= " LEFT OUTER JOIN store_bible_entry_field t_{$field_code} 
						ON t_{$field_code}.entry_racx=mstr.entry_racx 
							AND t_{$field_code}.entry_field_code='$field_code'" ;
	}
	foreach( $arr_gmap_define as $gmap_field )
	{
		$gmap_field = 'gmap_'.$gmap_field ;
		$query.= " LEFT OUTER JOIN store_bible_entry_field t_{$gmap_field} 
						ON t_{$gmap_field}.entry_racx=mstr.entry_racx 
							AND t_{$gmap_field}.entry_field_code='$gmap_field'" ;
	}
	$query.= " WHERE mstr.bible_code='$bible_code'" ;
	$_opDB->query($query) ;
	
	
	
	

	sleep(1) ;
}
function paracrm_define_buildViewFile( $file_code )
{
	global $_opDB ;
	
	
	// chargement gmap
	$arr_gmap_define = array() ;
	$query = "SELECT gmap_is_on FROM define_file WHERE file_code='$file_code'" ;
	if( $_opDB->query_uniqueValue($query) == 'O' )
	{
		$arr_gmap_define = $_opDB->table_fields('define_gmap') ;
	}
	//chargement des champs
	$query = "SELECT file_type FROM define_file WHERE file_code='$file_code'" ;
	switch( $_opDB->query_uniqueValue($query) )
	{
		case 'media_img' :
		$arr_field_type = array() ;
		// $arr_media_define = array() ;
		$arr_media_define = $_opDB->table_fields('define_media') ;
		break ;
	
		default :
		$arr_field_type = array() ;
		$arr_media_define = array() ;
		$query = "SELECT * FROM define_file_entry WHERE file_code='$file_code' ORDER BY entry_field_index" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
		{
			$arr_field_type[$arr['entry_field_code']] = $arr['entry_field_type'] ;
		}
		break ;
	}
	
	$view_name = 'view_file_'.$file_code ;
	$query = "DROP VIEW IF EXISTS $view_name" ;
	$_opDB->query($query) ;
	
	$query = "CREATE VIEW $view_name AS SELECT mstr.filerecord_id, mstr.filerecord_parent_id" ;
	foreach( $arr_gmap_define as $gmap_field )
	{
		$gmap_field = 'gmap_'.$gmap_field ;
		$query.=','.'t_'.$gmap_field.'.'.'filerecord_field_value_link'." AS ".$gmap_field ;
	}
	foreach( $arr_media_define as $media_field )
	{
		$media_field = 'media_'.$media_field ;
		$query.=','.'t_'.$media_field.'.'.'filerecord_field_value_string'." AS ".$media_field ;
	}
	foreach( $arr_field_type as $field_code => $field_type )
	{
		switch( $field_type )
		{
			case 'string' :
			$query.=','.'t_'.$field_code.'.' ;
			$query.='filerecord_field_value_string'." AS field_".$field_code ;
			break ;
			
			case 'number' :
			case 'bool' :
			$query.=','.'t_'.$field_code.'.' ;
			$query.='filerecord_field_value_number'." AS field_".$field_code ;
			break ;
			
			case 'date' :
			$query.=','.'t_'.$field_code.'.' ;
			$query.='filerecord_field_value_date'." AS field_".$field_code ;
			break ;
			
			case 'link' :
			$query.=','.'t_'.$field_code.'.' ;
			$query.='filerecord_field_value_link'." AS field_".$field_code ;
			$query.=','.'t_'.$field_code.'.' ;
			$query.='filerecord_field_value_link_treenode_racx'." AS field_".$field_code.'_trx' ;
			$query.=','.'t_'.$field_code.'.' ;
			$query.='filerecord_field_value_link_entry_racx'." AS field_".$field_code.'_erx' ;
			break ;
		}
	}
	$query.= " FROM store_file mstr" ;
	foreach( $arr_field_type as $field_code => $field_type )
	{
		$query.= " LEFT OUTER JOIN store_file_field t_{$field_code} 
						ON t_{$field_code}.filerecord_id = mstr.filerecord_id
						AND t_{$field_code}.filerecord_field_code='$field_code'" ;
	}
	foreach( $arr_gmap_define as $gmap_field )
	{
		$gmap_field = 'gmap_'.$gmap_field ;
		$query.= " LEFT OUTER JOIN store_file_field t_{$gmap_field} 
						ON t_{$gmap_field}.filerecord_id = mstr.filerecord_id 
							AND t_{$gmap_field}.filerecord_field_code='$gmap_field'" ;
	}
	foreach( $arr_media_define as $media_field )
	{
		$media_field = 'media_'.$media_field ;
		$query.= " LEFT OUTER JOIN store_file_field t_{$media_field} 
						ON t_{$media_field}.filerecord_id = mstr.filerecord_id 
							AND t_{$media_field}.filerecord_field_code='$media_field'" ;
	}
	$query.= " WHERE mstr.file_code='$file_code'" ;
	$_opDB->query($query) ;
	
	sleep(1) ;
}

?>