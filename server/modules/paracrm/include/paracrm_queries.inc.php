<?php

function paracrm_queries_getToolbarData( $post_data )
{
	global $_opDB ;

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
	
	$query = "SELECT query_id as queryId, query_name as text
					FROM query
					ORDER BY query_name" ;
	$result = $_opDB->query($query) ;
	$TAB_queries = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$arr['icon'] = 'images/op5img/'.'ico_process_16.gif' ;
		$TAB_queries[] = $arr ;
	}
	
	


	return array('success'=>true,'data_filetargets'=>$TAB_filetargets,'data_queries'=>$TAB_queries) ;
}


?>