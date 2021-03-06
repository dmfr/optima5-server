<?php

function paracrm_data_editTransaction( $post_data )
{
	if( $post_data['_action'] == 'data_editTransaction' && $post_data['_subaction'] == 'init' )
	{
		// ouverture transaction
		$transaction_id = $_SESSION['next_transaction_id']++ ;
		
		$_SESSION['transactions'][$transaction_id] = array() ;
		$_SESSION['transactions'][$transaction_id]['transaction_code'] = 'paracrm_data_editTransaction' ;
		
		$arr_saisie = array() ;
		$arr_saisie['data_type'] = $post_data['data_type'] ;
		$_SESSION['transactions'][$transaction_id]['arr_saisie'] = $arr_saisie ;
		
		$post_data['_transaction_id'] = $transaction_id ;
		
		
		// ******* Auth *******
		switch( $post_data['data_type'] ) {
			case 'bible_treenode' :
			case 'bible_entry' :
				$arr_auth_status = array(
					'readOnly' => !Auth_Manager::getInstance()->auth_query_sdomain_action(
						Auth_Manager::sdomain_getCurrent(),
						'bible',
						array('bible_code'=>$post_data['bible_code']),
						$write=true
					)
				) ;
				break ;
				
			case 'file_record' :
				$arr_auth_status = array(
					'readOnly' => !Auth_Manager::getInstance()->auth_query_sdomain_action(
						Auth_Manager::sdomain_getCurrent(),
						'files',
						array('file_code'=>$post_data['file_code']),
						$write=true
					)
				) ;
				break ;
		}
	}
	
	
	if( $post_data['_action'] == 'data_editTransaction' && $post_data['_transaction_id'] )
	{
		if( !$_SESSION['transactions'][$post_data['_transaction_id']] )
			return NULL ;
		$transaction_id = $post_data['_transaction_id'] ;
		$arr_transaction = $_SESSION['transactions'][$transaction_id] ;
		if( $arr_transaction['transaction_code'] != 'paracrm_data_editTransaction' )
			return NULL ;
			
		$arr_saisie = $arr_transaction['arr_saisie'] ;
		
		/*
		if( $_POST['_subaction'] == 'get_layout' )
			print_r($arr_saisie) ;*/
	
		switch( $arr_saisie['data_type'] )
		{
			case 'bible_treenode' :
			$json = paracrm_data_editTransaction_bibleTree( $post_data , $arr_saisie ) ;
			break ;
			
			case 'bible_entry' :
			$json = paracrm_data_editTransaction_bibleEntry( $post_data , $arr_saisie ) ;
			break ;
			
			case 'file_record' :
			$json = paracrm_data_editTransaction_fileRecord( $post_data , $arr_saisie ) ;
			break ;
			
			default :
			$arr_saisie = NULL ;
			break ;
		}
		
		// print_r($arr_saisie) ;
		
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


function paracrm_data_deleteRecord( $post_data )
{
	// ******* Auth *******
	switch( $post_data['data_type'] ) {
		case 'bible_treenode' :
		case 'bible_entry' :
			if( !Auth_Manager::getInstance()->auth_query_sdomain_action(
					Auth_Manager::sdomain_getCurrent(),
					'bible',
					array('bible_code'=>$post_data['bible_code']),
					$write=true
				)) {
				
				return Auth_Manager::auth_getDenialResponse() ;
			}
			break ;
			
		case 'file_record' :
			if( !Auth_Manager::getInstance()->auth_query_sdomain_action(
					Auth_Manager::sdomain_getCurrent(),
					'files',
					array('file_code'=>$post_data['file_code']),
					$write=true
				)) {
				
				return Auth_Manager::auth_getDenialResponse() ;
			}
			break ;
	}
	
	switch( $post_data['data_type'] )
	{
		case 'bible_treenode' :
		paracrm_lib_data_beginTransaction() ;
		$ret = paracrm_lib_data_deleteRecord_bibleTreenode( $post_data['bible_code'], $post_data['treenode_key'] ) ;
		paracrm_lib_data_endTransaction(TRUE) ;
		break ;
	
		case 'bible_entry' :
		if( isset($post_data['entry_keys']) ) {
			$entry_keys = json_decode($post_data['entry_keys'],true) ;
		} elseif( isset($post_data['entry_key']) ) {
			$entry_keys = array($post_data['entry_key']) ;
		} else {
			return array('success'=>false) ;
		}
		paracrm_lib_data_beginTransaction() ;
		foreach( $entry_keys as $entry_key ) {
			$ret = paracrm_lib_data_deleteRecord_bibleEntry( $post_data['bible_code'], $entry_key ) ;
			if( $ret != 0 ) {
				break ;
			}
		}
		paracrm_lib_data_endTransaction(TRUE) ;
		break ;
	
		case 'file_record' :
		paracrm_lib_data_beginTransaction() ;
		$ret = paracrm_lib_data_deleteRecord_file( $post_data['file_code'], $post_data['filerecord_id'] ) ;
		paracrm_lib_data_endTransaction(FALSE) ;
		break ;
	
		default :
		return array('success'=>false) ;
	}
	
	if( $ret == 0 )
		return array('success'=>true) ;
	else
		return array('success'=>false) ;
}




function paracrm_data_bibleAssignTreenode( $post_data )
{
	$bible_code = $post_data['bible_code'] ;
	if( isset($post_data['entry_keys']) ) {
		$entry_keys = json_decode($post_data['entry_keys'],true) ;
	} elseif( isset($post_data['entry_key']) ) {
		$entry_keys = array($post_data['entry_key']) ;
	} else {
		return array('success'=>false) ;
	}
	$target_treenode_key = $post_data['target_treenode_key'] ;

	paracrm_lib_data_beginTransaction() ;
	foreach( $entry_keys as $entry_key ) {
		$ret = paracrm_lib_data_bibleAssignTreenode( $bible_code, $entry_key, $target_treenode_key ) ;
		if( $ret != 0 ) {
			break ;
		}
	}
	paracrm_lib_data_endTransaction(FALSE) ;
	
	if( $ret == 0 )
		return array('success'=>true) ;
	else
		return array('success'=>false) ;
}
function paracrm_data_bibleAssignParentTreenode( $post_data )
{
	$bible_code = $post_data['bible_code'] ;
	$treenode_key = $post_data['treenode_key'] ;
	$target_treenode_key = $post_data['target_treenode_key'] ;

	paracrm_lib_data_beginTransaction() ;
	$ret = paracrm_lib_data_bibleAssignParentTreenode( $bible_code, $treenode_key, $target_treenode_key ) ;
	paracrm_lib_data_endTransaction(FALSE) ;
	
	if( $ret == 0 )
		return array('success'=>true) ;
	else
		return array('success'=>false) ;
}


?>