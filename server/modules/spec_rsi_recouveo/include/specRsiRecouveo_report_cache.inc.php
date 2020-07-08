<?php

function specRsiRecouveo_cache_isActive() {
	global $_opDB ;
	if( in_array('view_file_Z_CACHE',$_opDB->db_tables()) ) {
		return TRUE ;
	}
	return FALSE ;
}

function specRsiRecouveo_cache_buildQuery($post_data) {
	$del_mkeys = array() ;
	foreach( $post_data as $mkey=>$dummy ) {
		if( ($mkey[0]=='_') && ($mkey!='_action') ) {
			$del_mkeys[] = $mkey ;
		}
	}
	foreach( $del_mkeys as $mkey ) {
		unset($post_data[$mkey]) ;
	}
	return http_build_query($post_data) ;
}

function specRsiRecouveo_cache_get($post_data) {
	global $_opDB ;
	if( !specRsiRecouveo_cache_isActive() ) {
		return NULL ;
	}
	
	$query = "SELECT field_RETURN FROM view_file_Z_CACHE 
			WHERE field_QUERY='".$_opDB->escape_string(specRsiRecouveo_cache_buildQuery($post_data))."'" ;
	$return = $_opDB->query_uniqueValue( $query ) ;
	if( $return ) {
		return json_decode($return,true) ;
	}
	return NULL ;
}

function specRsiRecouveo_cache_set($post_data, $json) {
	if( !specRsiRecouveo_cache_isActive() ) {
		return NULL ;
	}
	
	global $_opDB ;
	$arr_ins = array() ;
	$arr_ins['field_DATE'] = date('Y-m-d H:i:s') ;
	$arr_ins['field_QUERY'] = specRsiRecouveo_cache_buildQuery($post_data) ;
	$arr_ins['field_RETURN'] = json_encode($json) ;
	$_opDB->insert('view_file_Z_CACHE',$arr_ins) ;
}

?>
