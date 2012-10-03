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



?>