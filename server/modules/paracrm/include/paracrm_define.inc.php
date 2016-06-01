<?php

function paracrm_define_getMainToolbar($post_data, $auth_bypass=FALSE )
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
		$query = "SELECT bible_code as bibleId , bible_lib as text , bible_iconfile as icon , '' as store_type , gmap_is_on , gallery_is_on , bible_code , bible_lib
						FROM define_bible
						ORDER BY bible_code" ;
		break ;
		
		case 'file' :
		$query = "SELECT file_code as fileId , file_lib as text , file_iconfile as icon , file_type as store_type , gmap_is_on , file_code , file_lib , file_parent_code
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
		if( !$auth_bypass ) {
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
		}
		
		$arr['viewmode_grid'] = true ;
		if( $post_data['data_type']=='file' && $arr['file_parent_code']==NULL )
			$arr['viewmode_editgrid'] = true ;
		if( $arr['gmap_is_on'] == 'O' )
			$arr['viewmode_gmap'] = true ;
		if( $arr['gallery_is_on'] == 'O' )
			$arr['viewmode_gallery'] = true ;
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
	
	$arr_auth_status = array(
		'disableAdmin' => !Auth_Manager::getInstance()->auth_query_sdomain_admin( Auth_Manager::sdomain_getCurrent() )
	) ;
	
	switch( $post_data['data_type'] ) {
		case 'bible' :
			return array('success'=>true,'auth_status'=>$arr_auth_status,'data_bible'=>$TAB) ;
		case 'file' :
			return array('success'=>true,'auth_status'=>$arr_auth_status,'data_files'=>$TAB) ;
		default :
			return array('success'=>false) ;
	}
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


function paracrm_define_truncate( $post_data ) {
	global $_opDB ;
	
	if( !Auth_Manager::getInstance()->auth_query_sdomain_admin( Auth_Manager::sdomain_getCurrent() ) ) {
		return Auth_Manager::auth_getDenialResponse() ;
	}
	
	$data_type = $post_data['data_type'] ;
	$bible_code = $post_data['bible_code'] ;
	$file_code = $post_data['file_code'] ;
	
	switch( $data_type )
	{
		case 'bible' :
		$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() );
		$t->sdomainDefine_truncateBible( DatabaseMgr_Sdomain::dbCurrent_getSdomainId(), $bible_code ) ;
		return array('success'=>true) ;
		break ;
		
		
		case 'file' :
		$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() );
		$query = "SELECT file_code FROM define_file WHERE file_parent_code='{$file_code}' AND file_parent_code<>''" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$child_fileCode = $arr[0] ;
			$t->sdomainDefine_truncateFile( DatabaseMgr_Sdomain::dbCurrent_getSdomainId(), $child_fileCode, paracrm_lib_android_authDb_hasDevices() ) ;
		}
		$t->sdomainDefine_truncateFile( DatabaseMgr_Sdomain::dbCurrent_getSdomainId(), $file_code, paracrm_lib_android_authDb_hasDevices() ) ;
		return array('success'=>true) ;
		break ;
	}
}
function paracrm_define_drop( $post_data ) {
	global $_opDB ;
	
	if( !Auth_Manager::getInstance()->auth_query_sdomain_admin( Auth_Manager::sdomain_getCurrent() ) ) {
		return Auth_Manager::auth_getDenialResponse() ;
	}
	
	$data_type = $post_data['data_type'] ;
	$bible_code = $post_data['bible_code'] ;
	$file_code = $post_data['file_code'] ;
	
	switch( $data_type )
	{
		case 'bible' :
		$query_t = "SELECT count(*) FROM store_bible_{$bible_code}_tree" ;
		$query_e = "SELECT count(*) FROM store_bible_{$bible_code}_entry" ;
		$num_rows = $_opDB->query_uniqueValue($query_t) + $_opDB->query_uniqueValue($query_e) ;
		if( $num_rows > 0 ) {
			return array('success'=>false) ;
		}
		
		$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() );
		$t->sdomainDefine_dropBible( DatabaseMgr_Sdomain::dbCurrent_getSdomainId(), $bible_code ) ;
		
		$query = "DELETE FROM define_bible WHERE bible_code='$bible_code'" ;
		$_opDB->query($query) ;
		$query = "DELETE FROM define_bible_entry WHERE bible_code='$bible_code'" ;
		$_opDB->query($query) ;
		$query = "DELETE FROM define_bible_tree WHERE bible_code='$bible_code'" ;
		$_opDB->query($query) ;
		
		return array('success'=>true) ;
		break ;
		
		
		
		case 'file' :
		$query_e = "SELECT count(*) FROM store_file_{$file_code}" ;
		$num_rows = $_opDB->query_uniqueValue($query_e) ;
		if( $num_rows > 0 ) {
			return array('success'=>false) ;
		}
		
		$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() );
		$t->sdomainDefine_dropFile( DatabaseMgr_Sdomain::dbCurrent_getSdomainId(), $file_code ) ;
		
		$query = "DELETE FROM define_file WHERE file_code='$file_code'" ;
		$_opDB->query($query) ;
		$query = "DELETE FROM define_file_cfg_calendar WHERE file_code='$file_code'" ;
		$_opDB->query($query) ;
		$query = "DELETE FROM define_file_entry WHERE file_code='$file_code'" ;
		$_opDB->query($query) ;
		$query = "DELETE FROM define_file_entry_join WHERE file_code='$file_code'" ;
		$_opDB->query($query) ;
		$query = "DELETE FROM define_file_entry_join_map WHERE file_code='$file_code'" ;
		$_opDB->query($query) ;
		
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
		
		$_SESSION['transactions'][$transaction_id] = array() ;
		$_SESSION['transactions'][$transaction_id]['transaction_code'] = 'paracrm_define_manageTransaction' ;
			$arr_saisie = array() ;
			$arr_saisie['data_type'] = $post_data['data_type'] ;
			switch( $arr_saisie['data_type'] )
			{
				case 'bible' :
				$arr_saisie['tab_treeFields'] = array() ;
				$arr_saisie['tab_entryFields'] = array() ;
				break ;
			
				case 'file' :
				$arr_saisie['tab_entryFields'] = array() ;
				break ;
			}
		$_SESSION['transactions'][$transaction_id]['arr_saisie'] = $arr_saisie ;
		
		$TAB['success'] = true ;
		$TAB['transaction_id'] = $transaction_id ;
		return $TAB ;
	}
	if( $post_data['_subaction'] == 'init_modify' 
		&& ( $post_data['data_type']=='bible' && $post_data['bible_code']
				||$post_data['data_type']=='file' && $post_data['file_code'])
	){
		$transaction_id = $_SESSION['next_transaction_id']++ ;
		
		$_SESSION['transactions'][$transaction_id] = array() ;
		$_SESSION['transactions'][$transaction_id]['transaction_code'] = 'paracrm_define_manageTransaction' ;
		
		
		$arr_saisie = array() ;
		$arr_saisie['data_type'] = $post_data['data_type'] ;
		switch( $arr_saisie['data_type'] )
		{
			case 'bible' :
			$arr_saisie['bible_code'] = $post_data['bible_code'] ;
			$query = "SELECT bible_code as store_code , bible_lib as store_lib , gmap_is_on , gallery_is_on from define_bible WHERE bible_code='{$arr_saisie['bible_code']}'" ;
			break ;
		
			case 'file' :
			$arr_saisie['file_code'] = $post_data['file_code'] ;
			$query = "SELECT file_code as store_code , file_lib as store_lib , file_parent_code as store_parent_code , gmap_is_on , file_type as store_type from define_file WHERE file_code='{$arr_saisie['file_code']}'" ;
			break ;
		}
		$result = $_opDB->query($query) ;
		$arr_saisie['arr_ent'] = $_opDB->fetch_assoc($result) ;
		$arr_saisie['arr_ent']['gmap_is_on'] = ($arr_saisie['arr_ent']['gmap_is_on']=='O')? true:false ;
		$arr_saisie['arr_ent']['gallery_is_on'] = ($arr_saisie['arr_ent']['gallery_is_on']=='O')? true:false ;
		
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
				
				if( $arr['entry_field_type'] == 'link' ) {
					$arr['entry_field_linkbible'] ;
					$arr['entry_field_linktype'] ;
				}
				
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
					
				if( $arr['entry_field_type'] == 'link' ) {
					$arr['entry_field_linkbible'] ;
					$arr['entry_field_linktype'] ;
				}
					
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
					
				if( $arr['entry_field_is_primarykey'] == 'O' )
					$arr['entry_field_is_primarykey'] = true ;
				else
					$arr['entry_field_is_primarykey'] = false ;
					
				if( $arr['entry_field_type'] == 'link' ) {
					$arr['entry_field_linkbible'] ;
					$arr['entry_field_linktype'] ;
				}
				
				if( $arr['entry_field_type'] == 'join' ) {
					// **** Load join parameters ****
					$query = "SELECT * FROM define_file_entry_join WHERE file_code='{$arr['file_code']}' AND entry_field_code='{$arr['entry_field_code']}'" ;
					$res_join = $_opDB->query($query) ;
					$arr_join = $_opDB->fetch_assoc($res_join) ;
					
					$arr['join_target_file_code'] = $arr_join['join_target_file_code'] ;
					$arr['join_select_file_field_code'] = $arr_join['join_select_file_field_code'] ;
					$arr['join_map'] = array() ;
					$query = "SELECT * FROM define_file_entry_join_map 
								WHERE file_code='{$arr['file_code']}' AND entry_field_code='{$arr['entry_field_code']}'
								ORDER BY join_map_ssid" ;
					$res_join_map = $_opDB->query($query) ;
					while( ($arr_join_map = $_opDB->fetch_assoc($res_join_map)) != FALSE ) {
						$arr['join_map'][] = array(
							'join_target_file_field_code'=>$arr_join_map['join_target_file_field_code'],
							'join_local_alt_file_code'=>$arr_join_map['join_local_alt_file_code'],
							'join_local_file_field_code'=>$arr_join_map['join_local_file_field_code'],
						) ;
					}
				}
				
				
					
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
		$parent_files = $links_bible = array() ;
		
		if( $arr_transaction['arr_saisie']['data_type'] == 'bible' )
		{
			$tab = array() ;
			$query = "SELECT bible_code, bible_lib 
							FROM define_bible 
							WHERE bible_code<>'{$arr_saisie['bible_code']}' ORDER BY bible_code" ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
			{
				$link_bibles[] = array('bibleCode'=>$arr['bible_code'] , 'bibleLib'=>$arr['bible_lib']) ;
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
				$link_bibles[] = array('bibleCode'=>$arr['bible_code'] , 'bibleLib'=>$arr['bible_lib']) ;
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
		
		
		return array('success'=>true,'data'=>array('parent_files'=>$parent_files,'link_bibles'=>$link_bibles)) ;
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
		$arr_ent['gallery_is_on'] = ($post_data['gallery_is_on']=='on')? true:false ;
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
	
	if( $arr_transaction && $post_data['_subaction'] == 'tool_getAltFiles' ) {
		$tab = array() ;
		$query = "SELECT * FROM define_file ORDER BY file_code" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
		{
			if( $arr['gmap_is_on'] == 'O' )
				$arr['gmap_is_on'] = true ;
			else
				$arr['gmap_is_on'] = false ;
				
			$tab[] = $arr ;
		}
		return array('success'=>true,'data'=>$tab) ;
	}
	if( $arr_transaction && $post_data['_subaction'] == 'tool_getAltFileFields' ) {
		$tab = array() ;
		$query = "SELECT * FROM define_file_entry WHERE file_code='{$post_data['file_code']}' ORDER BY entry_field_index" ;
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
				
			if( $arr['entry_field_is_primarykey'] == 'O' )
				$arr['entry_field_is_primarykey'] = true ;
			else
				$arr['entry_field_is_primarykey'] = false ;
				
			if( $arr['entry_field_type'] == 'join' ) {
				// **** Load join parameters ****
				$query = "SELECT * FROM define_file_entry_join WHERE file_code='{$arr['file_code']}' AND entry_field_code='{$arr['entry_field_code']}'" ;
				$res_join = $_opDB->query($query) ;
				$arr_join = $_opDB->fetch_assoc($res_join) ;
				
				$arr['join_target_file_code'] = $arr_join['join_target_file_code'] ;
				$arr['join_select_file_field_code'] = $arr_join['join_select_file_field_code'] ;
				$arr['join_map'] = array() ;
				$query = "SELECT * FROM define_file_entry_join_map 
							WHERE file_code='{$arr['file_code']}' AND entry_field_code='{$arr['entry_field_code']}'
							ORDER BY join_map_ssid" ;
				$res_join_map = $_opDB->query($query) ;
				while( ($arr_join_map = $_opDB->fetch_assoc($res_join_map)) != FALSE ) {
					$arr['join_map'][] = array(
						'join_target_file_field_code'=>$arr_join_map['join_target_file_field_code'],
						'join_local_alt_file_code'=>$arr_join_map['join_local_alt_file_code'],
						'join_local_file_field_code'=>$arr_join_map['join_local_file_field_code'],
					) ;
				}
			}
				
			$tab[] = $arr ;
		}
		return array('success'=>true,'data'=>$tab) ;
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
	
	if( $post_data['_subaction'] == 'end' )
	{
		unset($_SESSION['transactions'][$transaction_id]) ;
		return array('success'=>true) ;
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
	$arr_ins['gallery_is_on'] = ($arr_saisie['arr_ent']['gallery_is_on']==TRUE)?'O':'N' ;
	$_opDB->insert('define_bible',$arr_ins) ;
	
	$idx = 1 ;
	foreach( $arr_saisie['tab_treeFields'] as $mfield )
	{
		$arr_ins = array() ;
		$arr_ins['bible_code'] = $bible_code ;
		$arr_ins['tree_field_code'] = $mfield['tree_field_code'] ;
		$arr_ins['tree_field_is_key'] = ($idx==1)? 'O':'' ;
		$arr_ins['tree_field_index'] = $idx++ ;
		$arr_ins['tree_field_lib'] = $mfield['tree_field_lib'] ;
		$arr_ins['tree_field_type'] = ($mfield['tree_field_type'])? $mfield['tree_field_type']:'string' ;
		$arr_ins['tree_field_linktype'] = $mfield['tree_field_linktype'] ;
		$arr_ins['tree_field_linkbible'] = $mfield['tree_field_linkbible'] ;
		$arr_ins['tree_field_is_header'] = ($mfield['tree_field_is_header'])? 'O':'' ;
		$arr_ins['tree_field_is_highlight'] = ($mfield['tree_field_is_highlight'])? 'O':'' ;
		$_opDB->insert('define_bible_tree',$arr_ins) ;
	}
	
	$idx = 1 ;
	foreach( $arr_saisie['tab_entryFields'] as $mfield )
	{
		$arr_ins = array() ;
		$arr_ins['bible_code'] = $bible_code ;
		$arr_ins['entry_field_code'] = $mfield['entry_field_code'] ;
		$arr_ins['entry_field_is_key'] = ($idx==1)? 'O':'' ;
		$arr_ins['entry_field_index'] = $idx++ ;
		$arr_ins['entry_field_lib'] = $mfield['entry_field_lib'] ;
		$arr_ins['entry_field_type'] = ($mfield['entry_field_type'])? $mfield['entry_field_type']:'string' ;
		$arr_ins['entry_field_linktype'] = $mfield['entry_field_linktype'] ;
		$arr_ins['entry_field_linkbible'] = $mfield['entry_field_linkbible'] ;
		$arr_ins['entry_field_is_header'] = ($mfield['entry_field_is_header'])? 'O':'' ;
		$arr_ins['entry_field_is_highlight'] = ($mfield['entry_field_is_highlight'])? 'O':'' ;
		$_opDB->insert('define_bible_entry',$arr_ins) ;
	}
	
	$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() );
	$t->sdomainDefine_buildBible( DatabaseMgr_Sdomain::dbCurrent_getSdomainId(), $bible_code ) ;
	
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
	$file_code = $arr_saisie['arr_ent']['store_code'] ;
	$file_type = $arr_saisie['arr_ent']['store_type'] ;
	
	$empty_definition = FALSE ;
	if( isset($arr_saisie['tab_entryFields']) && count($arr_saisie['tab_entryFields']) == 0 && $file_type != 'media_img' )
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
	
	
	$query = "DELETE FROM define_file WHERE file_code='$file_code'" ;
	$_opDB->query($query) ;
	$query = "DELETE FROM define_file_cfg_calendar WHERE file_code='$file_code'" ;
	$_opDB->query($query) ;
	$query = "DELETE FROM define_file_entry WHERE file_code='$file_code'" ;
	$_opDB->query($query) ;
	$query = "DELETE FROM define_file_entry_join WHERE file_code='$file_code'" ;
	$_opDB->query($query) ;
	$query = "DELETE FROM define_file_entry_join_map WHERE file_code='$file_code'" ;
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
		$arr_ins = array() ;
		$arr_ins['file_code'] = $file_code ;
		$arr_ins['entry_field_code'] = $mfield['entry_field_code'] ;
		$arr_ins['entry_field_index'] = $idx++ ;
		$arr_ins['entry_field_lib'] = $mfield['entry_field_lib'] ;
		$arr_ins['entry_field_type'] = ($mfield['entry_field_type'])? $mfield['entry_field_type']:'string' ;
		$arr_ins['entry_field_linktype'] = $mfield['entry_field_linktype'] ;
		$arr_ins['entry_field_linkbible'] = $mfield['entry_field_linkbible'] ;
		$arr_ins['entry_field_is_header'] = ($mfield['entry_field_is_header'])? 'O':'' ;
		$arr_ins['entry_field_is_highlight'] = ($mfield['entry_field_is_highlight'])? 'O':'' ;
		$arr_ins['entry_field_is_mandatory'] = ($mfield['entry_field_is_mandatory'])? 'O':'' ;
		$arr_ins['entry_field_is_primarykey'] = ($arr_saisie['arr_ent']['store_type']=='file_primarykey' && $mfield['entry_field_is_primarykey'])? 'O':'' ;
		$_opDB->insert('define_file_entry',$arr_ins) ;
		
		if( $mfield['entry_field_type'] == 'join' ) {
			$arr_ins = array() ;
			$arr_ins['file_code'] = $file_code ;
			$arr_ins['entry_field_code'] = $mfield['entry_field_code'] ;
			$arr_ins['join_target_file_code'] = $mfield['join_target_file_code'] ;
			$arr_ins['join_select_file_field_code'] = $mfield['join_select_file_field_code'] ;
			$_opDB->insert('define_file_entry_join',$arr_ins) ;
			
			if( is_array($mfield['join_map']) ) {
				$mIdx = 1 ;
				foreach( $mfield['join_map'] as $map_e ) {
					$arr_ins = array() ;
					$arr_ins['file_code'] = $file_code ;
					$arr_ins['entry_field_code'] = $mfield['entry_field_code'] ;
					$arr_ins['join_map_ssid'] = $mIdx++ ;
					foreach( array('join_target_file_field_code','join_local_alt_file_code','join_local_file_field_code') as $mkey ) {
						$arr_ins[$mkey] = $map_e[$mkey] ;
					}
					$_opDB->insert('define_file_entry_join_map',$arr_ins) ;
				}
			}
		}
	}
	
	$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() );
	$t->sdomainDefine_buildFile( DatabaseMgr_Sdomain::dbCurrent_getSdomainId(), $file_code ) ;
	
	return array('success'=>true) ;
}




function paracrm_define_tool_getEqFieldType( $crm_field_type ) {
	switch( $crm_field_type ) {
		case 'link' :
		case 'string' :
		case 'stringplus' :
		return 'str' ;
		
		case 'number' :
		return 'dec' ;
		
		case 'bool' :
		case 'extid' :
		return 'int' ;
		
		case 'date' ;
		return 'dtm' ;
		
		default :
		return NULL ;
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
