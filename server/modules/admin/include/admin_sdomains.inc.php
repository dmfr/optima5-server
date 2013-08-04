<?php

function admin_sdomains_getList($post_data) {
	global $_opDB ;
	
	$tmp_dbengine_sizes = array() ;
	$query = "SELECT table_schema, sum( data_length + index_length ) / 1024 / 1024
				FROM information_schema.TABLES GROUP BY table_schema" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$tmp_dbengine_sizes[$arr[0]] = $arr[1] ;
	}

	$arr_sdomains = array() ;
	$query = "SELECT * FROM sdomain" ;
	if( $post_data['sdomain_id'] ) {
		$query.= " WHERE sdomain_id='{$post_data['sdomain_id']}'" ;
	} else {
		$query.= " ORDER BY sdomain_id" ;
	}
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		//$arr['sdomain_id'] = strtoupper($arr['sdomain_id']) ;
		$arr['overwrite_is_locked'] = $arr['overwrite_is_locked'] == 'O' ? true : false ;
		
		$db_name = $GLOBALS['mysql_db'].'_'.$arr['sdomain_id'] ;
		if( isset($tmp_dbengine_sizes[$db_name]) ) {
			$arr['stat_nbBibles'] = $_opDB->query_uniqueValue("SELECT count(*) FROM {$db_name}.define_bible") ;
			$arr['stat_nbFiles'] = $_opDB->query_uniqueValue("SELECT count(*) FROM {$db_name}.define_file") ;
			$arr['stat_dbSize'] = round($tmp_dbengine_sizes[$db_name],1).' '.'MB' ;
			
			if( !$dmgr_sdomain ) {
				$dmgr_sdomain = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() ) ;
			}
			if( $dmgr_sdomain->sdomainDb_needUpdate($arr['sdomain_id']) ) {
				$arr['stat_dbSize'] = 'needupdate' ;
			}
		} else {
			$arr['stat_nbBibles'] = 0 ;
			$arr['stat_nbFiles'] = 0 ;
			$arr['stat_dbSize'] = 'null' ;
		}
		
		$arr_sdomains[] = $arr ;
	}

	return array(
		'data'=>$arr_sdomains,
		'success'=>true
	);
}

function admin_sdomains_deleteSdomain($post_data) {
	global $_opDB ;
	
	sleep(1) ;
	
	$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() );
	$t->sdomainDb_delete($post_data['sdomain_id']) ;
	
	$query = "DELETE FROM sdomain WHERE sdomain_id='{$post_data['sdomain_id']}'" ;
	$_opDB->query($query) ;
	
	return array('success'=>true) ;
}
function admin_sdomains_setSdomain($post_data) {
	global $_opDB ;
	
	$arr_update = array() ;
	if( $post_data['_is_new'] ) {
		
		$arr_update['sdomain_id'] = strtolower($post_data['sdomain_id']) ;
		if( $arr_update['sdomain_id'] == '' ) {
			$errors_form['sdomain_id'] = 'sdomain_ID unspecified' ;
		}
		
		$query_test = "SELECT sdomain_id FROM sdomain WHERE sdomain_id='{$arr_update['sdomain_id']}'" ;
		if( $_opDB->num_rows($_opDB->query($query_test)) > 0 ) {
			$errors_form['sdomain_id'] = 'Existing sdomain_ID' ;
		}
		
		$arr_update['module_id'] = $post_data['module_id'] ;
		if( $arr_update['module_id'] == '' ) {
			$errors_form['module_id'] = 'Sdomain module type unspecified' ;
		}
		
	} else {
		$query_test = "SELECT sdomain_id FROM sdomain WHERE sdomain_id='{$post_data['sdomain_id']}'" ;
		if( $_opDB->num_rows($_opDB->query($query_test)) == 0 ) {
			$errors_form['sdomain_id'] = 'Unknown sdomain_ID' ;
		}
	}
	foreach( array('sdomain_name','icon_code') as $mkey ) {
		if( $post_data[$mkey] != '' ) {
			$arr_update[$mkey] = $post_data[$mkey] ;
		} else {
			$errors_form[$mkey] = "Missing $mkey" ;
		}
	}
	foreach( array('overwrite_is_locked') as $mkey ) {
		if( !isset($post_data[$mkey]) ) {
			$errors_form[$mkey] = "Missing $mkey" ;
		} else {
			$arr_update[$mkey] = $post_data[$mkey] ? 'O' : '' ;
		}
	}
	
	$success = TRUE ;
	if( $errors_form )
		$success = FALSE ;
		
	$response = array() ;
	$response['success'] = $success ;
	if( $errors_form )
		$response['errors'] = $errors_form ;
	if( !$response['success'] )
		return $response ;
		
	if( $post_data['_is_new'] ) {
		try {
			$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() );
			$t->sdomainDb_create( $arr_update['sdomain_id'] ) ;
		} catch( Exception $e ) {
			return array('success'=>false) ;
		}
		$_opDB->insert('sdomain',$arr_update) ;
	} else {
		$arr_cond = array() ;
		$arr_cond['sdomain_id'] = $post_data['sdomain_id'] ;
		$_opDB->update('sdomain',$arr_update,$arr_cond) ;
	}
	
	sleep(1) ;
	return $response ;
}
function admin_sdomains_updateSchema( $post_data ) {
	global $_opDB ;
	
	$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() );
	$t->sdomainDb_updateSchema( $post_data['sdomain_id'] ) ;
	
	sleep(1) ;
	return array('success'=>true) ;
}

?>