<?php

function paracrm_queries_getToolbarData( $post_data )
{
	global $_opDB ;

	// "File targets" disponibles (pour "Create new Query")
	$query = "SELECT file_code as fileId , file_lib as text , file_iconfile as icon , file_type as store_type , gmap_is_on , file_parent_code
					FROM define_file
					ORDER BY IF(file_parent_code<>'',file_parent_code,file_code),IF(file_parent_code<>'',file_code,'')" ;
	$result = $_opDB->query($query) ;
	$TAB_filetargets = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		unset($arr['store_type']) ;
		unset($arr['gmap_is_on']) ;
	
		$arr['icon'] = 'images/op5img/'.$arr['icon'] ;
		$TAB_filetargets[] = $arr ;
	}
	
	// Queries / Qmerges publiés
	$arr_pub_query = $arr_pub_qmerge = $arr_pub_qweb = $arr_pub_qbook = array() ;
	$query = "SELECT target_query_id , target_qmerge_id , target_qbook_id , target_qweb_id FROM input_query_src" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		if( $arr['target_query_id'] > 0 ) {
			$arr_pub_query[] = $arr['target_query_id'] ;
		} elseif( $arr['target_qmerge_id'] > 0 ) {
			$arr_pub_qmerge[] = $arr['target_qmerge_id'] ;
		} elseif( $arr['target_qbook_id'] > 0 ) {
			$arr_pub_qbook[] = $arr['target_qbook_id'] ;
		} elseif( $arr['target_qweb_id'] > 0 ) {
			$arr_pub_qweb[] = $arr['target_qweb_id'] ;
		}
	}
	// Queries
	$query = "SELECT query_id as queryId, query_name as text
					FROM query
					ORDER BY query_name" ;
	$result = $_opDB->query($query) ;
	$TAB_queries = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$query_id = $arr['queryId'] ;
		
		if( !Auth_Manager::getInstance()->auth_query_sdomain_action(
			Auth_Manager::sdomain_getCurrent(),
			'queries',
			array( 'query_id' => $query_id ),
			$write=false
		)) {
			// Permission denied
			continue ;
		}
		if( !Auth_Manager::getInstance()->auth_query_sdomain_action(
			Auth_Manager::sdomain_getCurrent(),
			'queries',
			array( 'query_id' => $query_id ),
			$write=true
		)) {
			$arr['authReadOnly'] = TRUE ;
		}
		
		if( in_array($query_id,$arr_pub_query) ) {
			$arr['isPublished'] = TRUE ;
		}
		//$arr['icon'] = 'images/op5img/'.'ico_process_16.gif' ;
		$TAB_queries[] = $arr ;
	}
	
	// Queries liées à un qmerge (pour la hiérarchie)
	$_cache_qmergeId_arrQueryId = array() ;
	$query = "SELECT * FROM qmerge_query" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ){
		
		$qmerge_id = $arr['qmerge_id'] ;
		$link_query_id = $arr['link_query_id'] ;
		
		if( !is_array($_cache_qmergeId_arrQueryId[$qmerge_id]) ) {
			$_cache_qmergeId_arrQueryId[$qmerge_id] = array() ;
		}
		$_cache_qmergeId_arrQueryId[$qmerge_id][] = $link_query_id ;
	}
	// Qmerges
	$query = "SELECT qmerge_id as qmergeId, qmerge_name as text
				FROM qmerge" ;
	$result = $_opDB->query($query) ;
	$TAB_qmerges = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$qmerge_id = $arr['qmergeId'] ;
		
		if( !Auth_Manager::getInstance()->auth_query_sdomain_action(
			Auth_Manager::sdomain_getCurrent(),
			'queries',
			array( 'qmerge_id' => $qmerge_id ),
			$write=false
		)) {
			// Permission denied
			continue ;
		}
		if( !Auth_Manager::getInstance()->auth_query_sdomain_action(
			Auth_Manager::sdomain_getCurrent(),
			'queries',
			array( 'qmerge_id' => $qmerge_id ),
			$write=true
		)) {
			$arr['authReadOnly'] = TRUE ;
		}
		
		if( in_array($qmerge_id,$arr_pub_qmerge) ) {
			$arr['isPublished'] = TRUE ;
		}
		
		if( isset($_cache_qmergeId_arrQueryId[$qmerge_id]) )
			$arr['qmerge_queries'] = $_cache_qmergeId_arrQueryId[$qmerge_id] ;
		else
			$arr['qmerge_queries'] = array() ;
	
		$TAB_qmerges[] = $arr ;
	}
	
	// Qwebs
	$query = "SELECT qweb_id as qwebId, qweb_name as text
				FROM qweb" ;
	$result = $_opDB->query($query) ;
	$TAB_qwebs = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$qweb_id = $arr['qwebId'] ;
		
		if( !Auth_Manager::getInstance()->auth_query_sdomain_action(
			Auth_Manager::sdomain_getCurrent(),
			'queries',
			array( 'qweb_id' => $qweb_id ),
			$write=false
		)) {
			// Permission denied
			continue ;
		}
		if( !Auth_Manager::getInstance()->auth_query_sdomain_action(
			Auth_Manager::sdomain_getCurrent(),
			'queries',
			array( 'qweb_id' => $qweb_id ),
			$write=true
		)) {
			$arr['authReadOnly'] = TRUE ;
		}
		
		if( in_array($qweb_id,$arr_pub_qweb) ) {
			$arr['isPublished'] = TRUE ;
		}
		$TAB_qwebs[] = $arr ;
	}
	
	// Qbooks
	$query = "SELECT qbook_id as qbookId, qbook_name as text
				FROM qbook" ;
	$result = $_opDB->query($query) ;
	$TAB_qbooks = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$qbook_id = $arr['qbookId'] ;
		
		if( !Auth_Manager::getInstance()->auth_query_sdomain_action(
			Auth_Manager::sdomain_getCurrent(),
			'queries',
			array( 'qbook_id' => $qbook_id ),
			$write=false
		)) {
			// Permission denied
			continue ;
		}
		if( !Auth_Manager::getInstance()->auth_query_sdomain_action(
			Auth_Manager::sdomain_getCurrent(),
			'queries',
			array( 'qbook_id' => $qbook_id ),
			$write=true
		)) {
			$arr['authReadOnly'] = TRUE ;
		}
		
		if( in_array($qbook_id,$arr_pub_qbook) ) {
			$arr['isPublished'] = TRUE ;
		}
		$TAB_qbooks[] = $arr ;
	}
	
	$arr_auth_status = array(
		'disableAdmin' => !Auth_Manager::getInstance()->auth_query_sdomain_admin( Auth_Manager::sdomain_getCurrent() ),
		'readOnly' => !Auth_Manager::getInstance()->auth_query_sdomain_action(
			Auth_Manager::sdomain_getCurrent(),
			'queries',
			NULL,
			$write=true
		)
	) ;
	
	return array('success'=>true,'auth_status'=>$arr_auth_status,'data_filetargets'=>$TAB_filetargets,'data_queries'=>$TAB_queries,'data_qmerges'=>$TAB_qmerges,'data_qbooks'=>$TAB_qbooks,'data_qwebs'=>$TAB_qwebs) ;
}


function paracrm_queries_gridTemplate( $post_data )
{
	global $_opDB ;
	
	switch( $post_data['_subaction'] )
	{
		case 'load' :
			$query = "SELECT * FROM querygrid_template WHERE query_id='0'" ;
			$result = $_opDB->query($query) ;
			if( $_opDB->num_rows($result) == 0 ) {
				return array('success'=>true , 'data_templatecfg'=>array()) ;
			}
			$arrDB = $_opDB->fetch_assoc($result) ;
			$data_templatecfg = array() ;
			foreach( $arrDB as $mkey => $mvalue )
			{
				switch( $mkey ) 
				{
					case 'query_id' :
					continue 2 ;
					
					case 'template_is_on' :
					case 'data_select_is_bold' :
					case 'data_progress_is_bold' :
					$data_templatecfg[$mkey] = ($mvalue=='O')? true:false ;
					break ;
				
					default :
					$data_templatecfg[$mkey] = $mvalue ;
				}
			}
			return array('success'=>true,'data_templatecfg'=>$data_templatecfg) ;
	
	
		case 'save' :
			sleep(1) ;
			$data_templatecfg = json_decode($post_data['data_templatecfg'],true) ;
			
			$arr_ins = array() ;
			$arr_ins['query_id'] = 0 ;
			$arr_ins['template_is_on'] = $data_templatecfg['template_is_on'] ? 'O':'' ;
			foreach( array('color_key','colorhex_columns','colorhex_row','colorhex_row_alt') as $mkey ) {
				$arr_ins[$mkey] = $data_templatecfg[$mkey] ;
			}
			$arr_ins['data_align'] = $data_templatecfg['data_align'] ;
			foreach( array('data_progress_is_bold','data_select_is_bold') as $mkey ) {
				$arr_ins[$mkey] = $data_templatecfg[$mkey] ? 'O':'' ;
			}
			$query = "DELETE FROM querygrid_template WHERE query_id='O'" ;
			$_opDB->query($query) ;
			$_opDB->insert('querygrid_template',$arr_ins) ;
			
		
			return array('success'=>true) ;
	
	}
}


function paracrm_queries_organizePublish() {
	global $_opDB ;
	
	$query = "SELECT querysrc.querysrc_id , query.query_name, qmerge.qmerge_name
				FROM input_query_src querysrc
				LEFT OUTER JOIN query ON query.query_id = querysrc.target_query_id
				LEFT OUTER JOIN qmerge ON qmerge.qmerge_id = querysrc.target_qmerge_id
				WHERE target_query_id > '0' OR target_qmerge_id > '0'
				ORDER BY IF(target_query_id>'0',query.query_name, qmerge.qmerge_name)" ;
	$result = $_opDB->query($query) ;
	$index = $index_start = 100 ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$querysrc_id = $arr['querysrc_id'] ;
		$index++ ;
		
		$query = "UPDATE input_query_src SET querysrc_index='$index' WHERE querysrc_id='$querysrc_id'" ;
		$_opDB->query($query) ;
	}
}



?>