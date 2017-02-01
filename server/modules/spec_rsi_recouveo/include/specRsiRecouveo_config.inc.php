<?php
function specRsiRecouveo_config_loadMeta($post_data) {
	global $_opDB ;
	
	$bible_code = 'META' ;
	
	$data = array() ;
	$query = "SELECT field_META_KEY, field_META_VALUE FROM view_bible_META_entry" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$data[$arr[0]] = $arr[1] ;
	}
	return array('success'=>true, 'data'=>$data) ;
}
function specRsiRecouveo_config_saveMeta( $post_data ) {
	$bible_code = 'META' ;
	
	$ttmp = specRsiRecouveo_config_loadMeta(array()) ;
	$old_data = $ttmp['data'] ;
	
	foreach( json_decode($post_data['data'],true) as $mkey=>$mvalue ) {
		$arr_ins = array() ;
		$arr_ins['field_META_KEY'] = $mkey ;
		$arr_ins['field_META_VALUE'] = $mvalue ;
		if( isset($old_data[$mkey]) ) {
			paracrm_lib_data_deleteRecord_bibleEntry( $bible_code, $mkey ) ;
		}
		paracrm_lib_data_insertRecord_bibleEntry( $bible_code, $mkey, 'GLOBAL', $arr_ins ) ;
	}
	
	return array('success'=>true) ;
}









function specRsiRecouveo_config_loadUser($post_data) {
	global $_opDB ;
	
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_atr = $ttmp['data']['cfg_atr'] ;
	
	$bible_code = 'USER' ;
	
	$data = array() ;
	$query = "SELECT * FROM view_bible_USER_entry" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$user_rec = array(
			'user_id' => $arr['field_USER_ID'],
			'user_pw' => $arr['field_USER_PW'],
			'user_fullname' => $arr['field_USER_FULLNAME'],
			'user_email' => $arr['field_USER_EMAIL']
		);
		foreach( $cfg_atr as $atr_rec ) {
			$atr_code = $atr_rec['bible_code'] ;
			$user_rec['link_'.$atr_code] = json_decode($arr['field_LINK_'.$atr_code],true) ;
		}
		$data[] = $user_rec ;
	}
	return array('success'=>true, 'data'=>$data) ;
}
function specRsiRecouveo_config_saveUser( $post_data ) {
	$bible_code = 'META' ;
	
	$ttmp = specRsiRecouveo_config_loadMeta(array()) ;
	$old_data = $ttmp['data'] ;
	
	foreach( json_decode($post_data['data'],true) as $mkey=>$mvalue ) {
		$arr_ins = array() ;
		$arr_ins['field_META_KEY'] = $mkey ;
		$arr_ins['field_META_VALUE'] = $mvalue ;
		if( isset($old_data[$mkey]) ) {
			paracrm_lib_data_deleteRecord_bibleEntry( $bible_code, $mkey ) ;
		}
		paracrm_lib_data_insertRecord_bibleEntry( $bible_code, $mkey, 'GLOBAL', $arr_ins ) ;
	}
	
	return array('success'=>true) ;
}





?>
