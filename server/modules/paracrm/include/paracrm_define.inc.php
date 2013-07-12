<?php

function paracrm_define_getMainToolbar($post_data)
{
	global $_opDB ;
	
	// Cache des bible / files publiés
	$arr_pub_bibles = $arr_pub_files = array() ;
	$query = "SELECT target_bible_code , target_file_code FROM input_store_src" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		if( $arr['target_bible_code'] != '' ) {
			$arr_pub_bibles[] = $arr['target_bible_code'] ;
		} elseif( $arr['target_file_code'] != '' ) {
			$arr_pub_files[] = $arr['target_file_code'] ;
		}
	}
	
	// Cache des "counts"
	$count_bibles = $count_files = array() ;
	$query = "SELECT table_name, TABLE_ROWS 
					FROM INFORMATION_SCHEMA.TABLES 
					WHERE TABLE_SCHEMA = DATABASE()" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$db_table = $arr[0] ;
		$count = $arr[1] ;
		
		if( strpos($db_table,'store_bible_') === 0 && substr($db_table,-6)=='_entry' ) {
			$bible_code = substr( substr($db_table, strlen('store_bible_')) , 0 , -1 * strlen('_entry') );
			$count_bibles[$bible_code] = $count ;
		}
		if( strpos($db_table,'store_file_') === 0 ) {
			$file_code = substr($db_table, strlen('store_file_'));
			$count_files[$file_code] = $count ;
		}
	}
	
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
		if( $post_data['data_type'] == 'bible' && $post_data['bible_code']
			&& $post_data['bible_code'] != $arr['bibleId'] ) {
			
			continue ;
		}
		if( $post_data['data_type'] == 'file' && $post_data['file_code']
			&& $post_data['file_code'] != $arr['fileId'] ) {
			
			continue ;
		}
		
		// ** Authentication **
		switch( $post_data['data_type'] ) {
			case 'bible' :
				if( !Auth_Manager::getInstance()->auth_query_sdomain_action(
					Auth_Manager::sdomain_getCurrent(),
					'bible',
					array('bible_code'=>$arr['bibleId']),
					$write=false
				)) {
					// Permission denied
					continue 2 ;
				}
				break ;
				
			case 'file' :
				if( !Auth_Manager::getInstance()->auth_query_sdomain_action(
					Auth_Manager::sdomain_getCurrent(),
					'files',
					array( 'file_code' => ($arr['file_parent_code']==NULL ? $arr['fileId']:$arr['file_parent_code']) ),
					$write=false
				)) {
					// Permission denied
					continue 2 ;
				}
				break ;
		}
		
		$arr['viewmode_grid'] = true ;
		if( $arr['gmap_is_on'] == 'O' )
			$arr['viewmode_gmap'] = true ;
		if( $arr['store_type'] == 'media_img' )
			$arr['viewmode_gallery'] = true ;
		if( $arr['store_type'] == 'calendar' )
			$arr['viewmode_calendar'] = true ;
			
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
		
		switch( $post_data['data_type'] ) {
			case 'bible' :
			$arr['count'] = $count_bibles[$arr['bibleId']] ;
			break ;
			
			case 'file' :
			$arr['count'] = $count_files[$arr['fileId']] ;
			break ;
		}
		
		if( $post_data['data_type'] == 'bible' && in_array($arr['bibleId'],$arr_pub_bibles) )
			$arr['isPublished'] = true ;
		if( $post_data['data_type'] == 'file' && in_array($arr['fileId'],$arr_pub_files) )
			$arr['isPublished'] = true ;
		
		$TAB[] = $arr ;
	}
	return $TAB ;
}


function paracrm_define_togglePublish( $post_data ) {
	global $_opDB ;
	
	if( !Auth_Manager::getInstance()->auth_query_sdomain_admin( Auth_Manager::sdomain_getCurrent() ) ) {
		return Auth_Manager::auth_getDenialResponse() ;
	}
	
	$data_type = $post_data['data_type'] ;
	$bible_code = $post_data['bible_code'] ;
	$file_code = $post_data['file_code'] ;
	$isPublished = ($post_data['isPublished']=='true')?true:false ;
	
	switch( $data_type )
	{
		case 'bible' :
		$query = "DELETE FROM input_store_src WHERE target_bible_code='$bible_code'" ;
		$_opDB->query($query) ;
		if( $isPublished ) {
			$arr_ins['target_bible_code'] = $bible_code ;
			$_opDB->insert('input_store_src',$arr_ins) ;
		}
		return array('success'=>true) ;
		break ;
	
		case 'file' :
		$query = "DELETE FROM input_store_src WHERE target_file_code='$file_code'" ;
		$_opDB->query($query) ;
		if( $isPublished ) {
			$arr_ins['target_file_code'] = $file_code ;
			$_opDB->insert('input_store_src',$arr_ins) ;
		}
		return array('success'=>true) ;
		break ;
	}
}



function paracrm_define_manageTransaction( $post_data )
{
	global $_opDB ;
	
	if( !Auth_Manager::getInstance()->auth_query_sdomain_admin( Auth_Manager::sdomain_getCurrent() ) ) {
		return Auth_Manager::auth_getDenialResponse() ;
	}
	
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
			$arr_saisie['cfg_calendar']['color_is_fixed'] = ($arr_saisie['cfg_calendar']['color_is_fixed']=='O')? true:false ;
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
				
				if( $arr['entry_field_is_mandatory'] == 'O' )
					$arr['entry_field_is_mandatory'] = true ;
				else
					$arr['entry_field_is_mandatory'] = false ;
					
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
		
		return array('success'=>true) ;
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
		$cfg_calendar['color_is_fixed'] = ($post_data['color_is_fixed']=='on')? true:false ;
		$cfg_calendar['color_filefield'] = $post_data['color_filefield'] ;
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
	
	paracrm_define_buildBibleTree( $bible_code ) ;
	paracrm_define_buildBibleEntry( $bible_code ) ;
	
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
		$arr_ins['color_is_fixed'] = ($arr_saisie['cfg_calendar']['color_is_fixed']==TRUE)? 'O':'N' ;
		$arr_ins['color_filefield'] = $arr_saisie['cfg_calendar']['color_filefield'] ;
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
		$arr_ins['entry_field_is_mandatory'] = ($mfield['entry_field_is_mandatory'])? 'O':'' ;
		$_opDB->insert('define_file_entry',$arr_ins) ;
	}
	
	paracrm_define_buildFile( $file_code ) ;
	
	return array('success'=>true) ;
}





function paracrm_define_buildBibleTree( $bible_code ) {
	global $_opDB ;
	
	
	//chargement des champs
	$arr_field_type = array() ;
	$query = "SELECT * FROM define_bible_tree WHERE bible_code='$bible_code' ORDER BY tree_field_index" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$arr_field_type[$arr['tree_field_code']] = $arr['tree_field_type'] ;
	}
	
	$db_table = 'store_bible_'.$bible_code.'_tree' ;
	$arrAssoc_dbField_fieldType = array('treenode_key'=>'varchar(100)','treenode_parent_key'=>'varchar(100)') ;
	$arr_model_keys = array() ;
	$arr_model_keys['PRIMARY'] = array('arr_columns'=>array('treenode_key')) ;
	$arr_model_keys['treenode_parent_key'] = array('non_unique'=>'1','arr_columns'=>array('treenode_parent_key')) ;
	$arrAssoc_crmField_dbField = array() ;
	foreach( $arr_field_type as $field_code => $field_type )
	{
		$field_name = 'field_'.$field_code ;
		switch( $field_type )
		{
			case 'string' :
			$field_name.= '_str' ;
			$arrAssoc_dbField_fieldType[$field_name] = 'varchar(200)' ;
			break ;
			
			case 'number' :
			$field_name.= '_dec' ;
			$arrAssoc_dbField_fieldType[$field_name] = 'decimal(10,2)' ;
			break ;
			
			case 'bool' :
			$field_name.= '_int' ;
			$arrAssoc_dbField_fieldType[$field_name] = 'int(11)' ;
			break ;
			
			case 'date' :
			$field_name.= '_dtm' ;
			$arrAssoc_dbField_fieldType[$field_name] = 'datetime' ;
			break ;
			
			case 'link' :
			$field_name.= '_str' ;
			$arrAssoc_dbField_fieldType[$field_name] = 'varchar(500)' ;
			break ;
			
			default :
			continue 2 ;
		}
		$field_crm = 'field_'.$field_code ;
		$arrAssoc_crmField_dbField[$field_crm] = $field_name ;
	}
	
	paracrm_define_tool_syncTableStructure( $db_table , $arrAssoc_dbField_fieldType , $arr_model_keys ) ;
	
	$view_name = 'view_bible_'.$bible_code.'_tree' ;
	$query = "DROP VIEW IF EXISTS $view_name" ;
	$_opDB->query($query) ;
	
	$query = "CREATE ALGORITHM=MERGE VIEW $view_name AS SELECT mstr.treenode_key, mstr.treenode_parent_key" ;
	foreach( $arrAssoc_crmField_dbField as $field_crm => $field_name ) {
		if( $field_name == 'treenode_key' ) {
			continue ;
		}
		if( $field_name == 'treenode_parent_key' ) {
			continue ;
		}
	
		$query.= ", mstr.{$field_name} AS {$field_crm}" ;
	}
	$query.= " FROM $db_table mstr" ;
	$_opDB->query($query) ;

	return array($db_table , $arrAssoc_dbField_fieldType , $arr_model_keys, $arrAssoc_crmField_dbField) ;
}
function paracrm_define_buildBibleEntry( $bible_code ) {
	global $_opDB ;
	
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
	
	
	$db_table = 'store_bible_'.$bible_code.'_entry' ;
	$arrAssoc_dbField_fieldType = array('entry_key'=>'varchar(100)','treenode_key'=>'varchar(100)') ;
	$arr_model_keys = array() ;
	$arr_model_keys['PRIMARY'] = array('arr_columns'=>array('entry_key')) ;
	$arr_model_keys['treenode_key'] = array('non_unique'=>'1','arr_columns'=>array('treenode_key')) ;
	$arrAssoc_crmField_dbField = array() ;
	foreach( $arr_gmap_define as $gmap_field ) {
		$gmap_field = 'gmap_'.$gmap_field ;
		$arrAssoc_dbField_fieldType[$gmap_field] = 'varchar(500)' ;
		$arrAssoc_crmField_dbField[$gmap_field] = $gmap_field ;
	}
	foreach( $arr_field_type as $field_code => $field_type )
	{
		$field_name = 'field_'.$field_code ;
		switch( $field_type )
		{
			case 'string' :
			$field_name.= '_str' ;
			$arrAssoc_dbField_fieldType[$field_name] = 'varchar(200)' ;
			break ;
			
			case 'number' :
			$field_name.= '_dec' ;
			$arrAssoc_dbField_fieldType[$field_name] = 'decimal(10,2)' ;
			break ;
			
			case 'bool' :
			$field_name.= '_int' ;
			$arrAssoc_dbField_fieldType[$field_name] = 'int(11)' ;
			break ;
			
			case 'date' :
			$field_name.= '_dtm' ;
			$arrAssoc_dbField_fieldType[$field_name] = 'datetime' ;
			break ;
			
			case 'link' :
			$field_name.= '_str' ;
			$arrAssoc_dbField_fieldType[$field_name] = 'varchar(500)' ;
			break ;
			
			default :
			continue 2 ;
		}
		$field_crm = 'field_'.$field_code ;
		$arrAssoc_crmField_dbField[$field_crm] = $field_name ;
	}
	
	paracrm_define_tool_syncTableStructure( $db_table , $arrAssoc_dbField_fieldType , $arr_model_keys ) ;

	$view_name = 'view_bible_'.$bible_code.'_entry' ;
	$query = "DROP VIEW IF EXISTS $view_name" ;
	$_opDB->query($query) ;
	
	$query = "CREATE ALGORITHM=MERGE VIEW $view_name AS SELECT mstr.entry_key, mstr.treenode_key" ;
	foreach( $arrAssoc_crmField_dbField as $field_crm => $field_name ) {
		if( $field_name == 'entry_key' ) {
			continue ;
		}
		if( $field_name == 'treenode_key' ) {
			continue ;
		}
	
		$query.= ", mstr.{$field_name} AS {$field_crm}" ;
	}
	$query.= " FROM $db_table mstr" ;
	$_opDB->query($query) ;

	return array($db_table , $arrAssoc_dbField_fieldType , $arr_model_keys, $arrAssoc_crmField_dbField) ;
}

function paracrm_define_buildFile( $file_code ) {
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
	
	
	
	$db_table = 'store_file_'.$file_code ;
	$arrAssoc_dbField_fieldType = array('filerecord_id'=>'int(11)') ;
	$arr_model_keys = array('PRIMARY'=>array('arr_columns'=>array('filerecord_id'))) ;
	$arrAssoc_crmField_dbField = array() ;
	foreach( $arr_gmap_define as $gmap_field ) {
		$gmap_field = 'gmap_'.$gmap_field ;
		$arrAssoc_dbField_fieldType[$gmap_field] = 'varchar(500)' ;
		$arrAssoc_crmField_dbField[$gmap_field] = $gmap_field ;
	}
	foreach( $arr_media_define as $media_field ) {
		$media_field = 'media_'.$media_field ;
		$arrAssoc_dbField_fieldType[$media_field] = 'varchar(100)' ;
		$arrAssoc_crmField_dbField[$media_field] = $media_field ;
	}
	foreach( $arr_field_type as $field_code => $field_type )
	{
		$field_name = 'field_'.$field_code ;
		switch( $field_type )
		{
			case 'string' :
			$field_name.= '_str' ;
			$arrAssoc_dbField_fieldType[$field_name] = 'varchar(200)' ;
			break ;
			
			case 'number' :
			$field_name.= '_dec' ;
			$arrAssoc_dbField_fieldType[$field_name] = 'decimal(10,2)' ;
			break ;
			
			case 'bool' :
			$field_name.= '_int' ;
			$arrAssoc_dbField_fieldType[$field_name] = 'int(11)' ;
			break ;
			
			case 'date' :
			$field_name.= '_dtm' ;
			$arrAssoc_dbField_fieldType[$field_name] = 'datetime' ;
			break ;
			
			case 'link' :
			$field_name.= '_str' ;
			$arrAssoc_dbField_fieldType[$field_name] = 'varchar(500)' ;
			$arr_model_keys[$field_name] = array('non_unique'=>'1','arr_columns'=>array($field_name)) ;
			break ;
			
			default :
			continue 2 ;
		}
		$field_crm = 'field_'.$field_code ;
		$arrAssoc_crmField_dbField[$field_crm] = $field_name ;
	}
	
	paracrm_define_tool_syncTableStructure( $db_table , $arrAssoc_dbField_fieldType , $arr_model_keys ) ;
	
	$view_name = 'view_file_'.$file_code ;
	$query = "DROP VIEW IF EXISTS $view_name" ;
	$_opDB->query($query) ;
	
	$query = "CREATE ALGORITHM=MERGE VIEW $view_name AS SELECT mstr.filerecord_id, mstr.filerecord_parent_id" ;
	foreach( $arrAssoc_crmField_dbField as $field_crm => $field_name ) {
		if( $field_name == 'filerecord_id' ) {
			continue ;
		}
	
		$query.= ",data.{$field_name} AS {$field_crm}" ;
	}
	$query.= " FROM store_file mstr" ;
	$query.= " LEFT JOIN {$db_table} data ON data.filerecord_id = mstr.filerecord_id" ;
	$query.= " WHERE mstr.file_code='{$file_code}' AND mstr.sync_is_deleted<>'O'" ;
	$_opDB->query($query) ;
	
	
	return array($db_table , $arrAssoc_dbField_fieldType , $arr_model_keys, $arrAssoc_crmField_dbField) ;
}



function paracrm_define_tool_getEqFieldType( $crm_field_type ) {
	switch( $crm_field_type ) {
		case 'link' :
		case 'string' :
		return 'str' ;
		
		case 'number' :
		return 'dec' ;
		
		case 'bool' :
		return 'int' ;
		
		case 'date' ;
		return 'dtm' ;
		
		default :
		return NULL ;
	}
}
function paracrm_define_tool_syncTableStructure( $db_table , $arrAssoc_field_fieldType , $arr_model_keys, $drop_allowed=FALSE ) {
	
	global $_opDB ;
	
	$mysql_db = $_opDB->query_uniqueValue("SELECT DATABASE()") ;

	$arr_existing_tables = array() ;
	$query = "SHOW TABLES FROM $mysql_db" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE )
		$arr_existing_tables[] = $arr[0] ;

	if( !in_array($db_table,$arr_existing_tables) )
	{
		$is_first = TRUE ;
		$query = "CREATE TABLE {$mysql_db}.{$db_table} (" ;
		foreach( $arrAssoc_field_fieldType as $field_name => $field_type ) {
			if( $is_first )
				$is_first = FALSE ;
			else
				$query.= ',' ;
				
			$query.= "`{$field_name}` {$field_type} NOT NULL" ;
		}
		foreach( $arr_model_keys as $key_name => $key_desc ) {
			if( $is_first )
				$is_first = FALSE ;
			else
				$query.= ',' ;
			
			if( $key_name == 'PRIMARY' ) {
				$query.= "PRIMARY KEY " ;
			} elseif( $key_desc['non_unique'] == 'O' ) {
				$query.= "INDEX " ;
			} else {
				$query.= "INDEX " ;
			}
			$query.= "(" ;
			$is_first_k=TRUE ;
			foreach( $key_desc['arr_columns'] as $column )
			{
				if( !$is_first_k )
					$query.= ',' ;
				$query.= '`'.$column.'`' ;
				$is_first_k = FALSE ;
			}
			$query.= ")" ;
		}
		$query.= ")" ;
		$_opDB->query($query) ;
	}
	else
	{
		$arr_model_fields = array() ;
		foreach( $arrAssoc_field_fieldType as $field_name => $field_type ) {
			$arr_model_fields[] = array($field_name,$field_type,'NO') ;
		}
	
		$arr_existing_fields = array() ;
		$query = "SHOW COLUMNS FROM {$mysql_db}.{$db_table} " ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$arr_existing_fields[] = $arr ;
		}
		foreach( $arr_existing_fields as $desc_field_existing )
		{
			$existing_field = $desc_field_existing[0] ;
			foreach( $arr_model_fields as $desc_field_model )
			{
				if( $existing_field == $desc_field_model[0] )
					continue 2 ;
			}
			if( !$drop_allowed ) {
				continue ;
			}
			
			$query = "ALTER TABLE {$mysql_db}.{$db_table} DROP `$existing_field`" ;
			$_opDB->query($query) ;
		}
		foreach( $arr_model_fields as $field_id => $desc_field_model )
		{
			$desc_field_existing = NULL ;
			foreach( $arr_existing_fields as $cur_field )
			{
				if( $cur_field[0] == $desc_field_model[0] )
				{
					$desc_field_existing = $cur_field ;
					break ;
				}
			}
			if( !$desc_field_existing )
			{
				//after WHAT ?
				$after_field = '' ;
				if( $field_id >= 1 )
				{
					$f = $field_id - 1 ;
					$tmpdesc = $arr_model_fields[$f] ;
					$after_field = $tmpdesc[0] ;
				}
				// ajout du champs
				$query = "ALTER TABLE {$mysql_db}.{$db_table} ADD `{$desc_field_model[0]}` $desc_field_model[1]" ;
				if( strtoupper($desc_field_model[2]) == 'NO' )
				{
					$query.= " NOT NULL" ;
				}
				if( $after_field )
				{
					$query.= " AFTER `$after_field`" ;
				}
				else
				{
					$query.= " FIRST" ;
				}
				$_opDB->query($query) ;
				
				//continue 
				continue ;
			}
			if( $desc_field_existing[1] != $desc_field_model[1] || $desc_field_existing[2] != $desc_field_model[2] || $desc_field_existing[5] != $desc_field_model[5] )
			{
				$query = "ALTER TABLE {$mysql_db}.{$db_table} CHANGE `{$desc_field_existing[0]}` `{$desc_field_model[0]}` $desc_field_model[1]" ;
				if( strtoupper($desc_field_model[2]) == 'NO' )
				{
					$query.= " NOT NULL" ;
				}
				else
				{
					$query.= " NULL" ;
				}
				
				$_opDB->query($query) ;
				
				//continue 
				continue ;
			}
		
		}
	
	
	
	
	
	
		$arr_existing_keys = array() ;
		$query = "SHOW KEYS FROM {$mysql_db}.{$db_table} " ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE )
		{
			$key_name = $arr[2] ;
			$non_unique = $arr[1] ;
			$column_name = $arr[4] ;
			$arr_existing_keys[$key_name]['non_unique'] = $non_unique ;
			$arr_existing_keys[$key_name]['arr_columns'][] = $column_name ;
		}
		foreach($arr_existing_keys as $existing_key_name => $existing_key )
		{
			
			if( !$arr_model_keys[$existing_key_name] )
			{
				$query = "ALTER TABLE {$mysql_db}.{$db_table} " ;
				$query.= " DROP" ;
				if( $existing_key_name == 'PRIMARY' )
					$query.= " PRIMARY KEY" ;
				elseif( $existing_key['non_unique'] == '0' )
					$query.= " INDEX `$existing_key_name`" ;
				else
					$query.= " INDEX `$existing_key_name`" ;
						
				$_opDB->query($query) ;
			}
		}
	
		foreach($arr_model_keys as $model_key_name => $model_key )
		{
			$_create = $_drop = FALSE ;
			if( !$arr_existing_keys[$model_key_name] )
			{
				// create
				$_create = TRUE ;
			}
			else
			{
			$existing_key = $arr_existing_keys[$model_key_name] ;
			if( $model_key != $existing_key )
			{
				$_create = TRUE ;
				$_drop = TRUE ;
			}
			}
			
			if( $_create )
			{
				$query = "ALTER TABLE {$mysql_db}.{$db_table} " ;
				if( $_drop )
				{
					$query.= " DROP" ;
					if( $model_key_name == 'PRIMARY' )
						$query.= " PRIMARY KEY" ;
					elseif( $existing_key['non_unique'] == '0' )
						$query.= " INDEX `$model_key_name`" ;
					else
						$query.= " INDEX `$model_key_name`" ;
					$query.= "," ;
				}
				$query.= " ADD" ;
				if( $model_key_name == 'PRIMARY' )
					$query.= " PRIMARY KEY" ;
				elseif( $model_key['non_unique'] == '0' )
					$query.= " INDEX `$model_key_name`" ;
				else
					$query.= " INDEX `$model_key_name`" ;
				$query.= "(" ;
				$is_first=TRUE ;
				foreach( $model_key['arr_columns'] as $column )
				{
					if( !$is_first )
						$query.= ',' ;
					$query.= '`'.$column.'`' ;
					$is_first = FALSE ;
				}
				$query.= ")" ;
				
				$_opDB->query($query) ;
			}
		}
	}
}
function paracrm_define_tool_fileGetParentCode( $file_code ) {
	global $_opDB ;
	
	while( TRUE ) {
		$query = "SELECT file_parent_code FROM define_file WHERE file_code='{$file_code}'" ;
		$result = $_opDB->query($query) ;
		if( $_opDB->num_rows($result) != 1 ) {
			return NULL ;
		}
		$arr = $_opDB->fetch_row($result) ;
		$parent_file_code = $arr[0] ;
		if( $parent_file_code=='' ) {
			break ;
		}
		$file_code = $parent_file_code ;
	}
	return $file_code ;
}

?>