<?php
function paracrm_queries_mergerTransaction( $post_data )
{
	if( $post_data['_action'] == 'queries_mergerTransaction' && $post_data['_subaction'] == 'init' )
	{
		// ouverture transaction
		$transaction_id = $_SESSION['next_transaction_id']++ ;
		
		$_SESSION['transactions'][$transaction_id] = array() ;
		$_SESSION['transactions'][$transaction_id]['transaction_code'] = 'paracrm_queries_mergerTransaction' ;
		
		$arr_saisie = array() ;
		$arr_saisie['target_file_code'] = $post_data['target_file_code'] ;
		$_SESSION['transactions'][$transaction_id]['arr_saisie'] = $arr_saisie ;
		$_SESSION['transactions'][$transaction_id]['arr_RES'] = array() ;
		
		$post_data['_transaction_id'] = $transaction_id ;
	}
	
	
	if( $post_data['_action'] == 'queries_mergerTransaction' && $post_data['_transaction_id'] )
	{
		if( !$_SESSION['transactions'][$post_data['_transaction_id']] )
			return NULL ;
		$transaction_id = $post_data['_transaction_id'] ;
		$arr_transaction = $_SESSION['transactions'][$transaction_id] ;
		if( $arr_transaction['transaction_code'] != 'paracrm_queries_mergerTransaction' )
			return NULL ;
			
		$arr_saisie = $arr_transaction['arr_saisie'] ;
		
		if( $post_data['_subaction'] == 'init' )
		{
			$json =  paracrm_queries_mergerTransaction_init( $post_data , $arr_saisie ) ;
		}
		if( $post_data['_subaction'] == 'run' )
		{
			$json =  paracrm_queries_mergerTransaction_runQuery( $post_data , $arr_saisie ) ;
		}
		if( $post_data['_subaction'] == 'submit' )
		{
			$json =  paracrm_queries_mergerTransaction_submit( $post_data , $arr_saisie ) ;
		}
		if( $post_data['_subaction'] == 'save' || $post_data['_subaction'] == 'saveas' || $post_data['_subaction'] == 'delete' )
		{
			$json =  paracrm_queries_mergerTransaction_save( $post_data , $arr_saisie ) ;
		}
		
		
		
		if( $post_data['_subaction'] == 'res_get' )
		{
			$json =  paracrm_queries_mergerTransaction_resGet( $post_data ) ;
		}
		if( $post_data['_subaction'] == 'exportXLS' )
		{
			$json =  paracrm_queries_mergerTransaction_exportXLS( $post_data ) ;
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

function paracrm_queries_mergerTransaction_init( $post_data , &$arr_saisie )
{
	global $_opDB ;
	
	/*
	************ INITIALISATION *********
	- bible des QUERIES existantes
	- remplissage des champs
	*******************************
	*/
	if( $post_data['is_new'] == 'true' )
	{
		$arr_saisie['arr_query_id'] = array() ;
		$arr_saisie['fields_mwhere'] = array() ;
		$arr_saisie['fields_mselect'] = array() ;
	}
	elseif( $post_data['qmerge_id'] > 0 )
	{

	}
	else
	{
		$transaction_id = $post_data['_transaction_id'] ;
		unset($_SESSION['transactions'][$transaction_id]) ;
		return array('success'=>false) ;
	}
	
	
	
	$arr_saisie['bible_queries'] = array() ;
	$query = "SELECT * FROM query ORDER BY query_name" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$query_id = $arr['query_id'] ;
		$arr_query = array() ;
		foreach( array('query_id','query_name','target_file_code') as $mkey ) {
			$arr_query[$mkey] = $arr[$mkey] ;
		}
		paracrm_queries_builderTransaction_loadFields( $arr_query , $query_id ) ;
		
		$arr_saisie['bible_queries'][] = $arr_query ;
	}
	
	$arr_saisie['bible_files_treefields'] = array() ;
	$query = "SELECT file_code FROM define_file ORDER BY file_code" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$file_code = $arr[0] ;
	
		$ttmp = paracrm_lib_file_access( $file_code ) ;
		$arr_saisie['bible_files_treefields'][$file_code] = paracrm_queries_builderTransaction_getTreeFields( $ttmp ) ;
	}
	
	
	


	return array('success'=>true,
					'_mirror'=>$post_data,
					'transaction_id' => $post_data['_transaction_id'],
					'bible_queries' => $arr_saisie['bible_queries'],
					'bible_files_treefields' => $arr_saisie['bible_files_treefields'],
					'qmerge_queries' => $arr_saisie['arr_query_id'],
					'qmerge_mwherefields' => $arr_saisie['fields_mwhere'],
					'qmerge_mselectfields' => $arr_saisie['fields_mselect']
					) ;
}

function paracrm_queries_mergerTransaction_submit( $post_data , &$arr_saisie )
{

}



?>