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









function specRsiRecouveo_config_getUsers($post_data) {
	global $_opDB ;
	
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_atr = $ttmp['data']['cfg_atr'] ;
	
	$bible_code = 'USER' ;
	
	$data = array() ;
	$query = "SELECT * FROM view_bible_USER_entry" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$user_rec = array(
			'_default' => ($arr['treenode_key'] == 'DEFAULT' ? true : false),
			'user_id' => $arr['field_USER_ID'],
			'user_pw' => $arr['field_USER_PW'],
			'user_fullname' => $arr['field_USER_FULLNAME'],
			'user_email' => $arr['field_USER_EMAIL'],
			'user_tel' => $arr['field_USER_TEL'],
			'status_is_ext' => ($arr['field_STATUS_IS_EXT']==1)
		);
		$user_rec['link_SOC'] = json_decode($arr['field_LINK_SOC'],true) ;
		foreach( $cfg_atr as $atr_rec ) {
			$atr_code = $atr_rec['bible_code'] ;
			$user_rec['link_'.$atr_code] = json_decode($arr['field_LINK_'.$atr_code],true) ;
		}
		$data[] = $user_rec ;
	}
	return array('success'=>true, 'data'=>$data) ;
}
function specRsiRecouveo_config_setUser( $post_data ) {
	global $_opDB ;
	
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_atr = $ttmp['data']['cfg_atr'] ;
	
	$user_record = json_decode($post_data['data'],true) ;
	
	if( $user_record['id'] ) {
		paracrm_lib_data_deleteRecord_bibleEntry('USER',$user_record['id']) ;
	}
	
	if( $post_data['do_delete']==1 ) {
		return array('success'=>true) ;
	}
	
	$arr_ins = array() ;
	$arr_ins['field_USER_ID'] = $user_record['user_id'] ;
	$arr_ins['field_USER_PW'] = $user_record['user_pw'] ;
	$arr_ins['field_USER_FULLNAME'] = $user_record['user_fullname'] ;
	$arr_ins['field_USER_EMAIL'] = $user_record['user_email'] ;
	$arr_ins['field_USER_TEL'] = $user_record['user_tel'] ;
	$arr_ins['field_STATUS_IS_EXT'] = ($user_record['status_is_ext'] ? 1 : 0) ;
	
	if( $user_record['link_SOC'] && json_decode($user_record['link_SOC'],true) == array('&') ) {
		$user_record['link_SOC'] = '' ;
	}
	$arr_ins['field_LINK_SOC'] = $user_record['link_SOC'] ;
	
	foreach( $cfg_atr as $atr_record ) {
		$mkey = $atr_record['bible_code'] ;
		if( $user_record['link_'.$mkey] && json_decode($user_record['link_'.$mkey],true) == array('&') ) {
			$user_record['link_'.$mkey] = '' ;
		}
		$arr_ins['field_LINK_'.$mkey] = $user_record['link_'.$mkey] ;
	}
	
	$treenode_key = 'CR' ;
	if( $user_record['status_is_ext'] ) {
		$treenode_key = 'EXT' ;
	}
	
	paracrm_lib_data_insertRecord_bibleEntry( 'USER', $user_record['user_id'], $treenode_key, $arr_ins ) ;
	
	return array('success'=>true) ;
}




function specRsiRecouveo_config_getScenarios($post_data) {
	global $_opDB ;
	
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_atr = $ttmp['data']['cfg_atr'] ;
	
	
	$TAB = array() ;
	
	$query = "SELECT * FROM view_bible_SCENARIO_tree ORDER BY field_SCEN_CODE" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$scen_code = $arr['field_SCEN_CODE'] ;
		
		$record = array(
			'scen_code' => $arr['field_SCEN_CODE'],
			'scen_txt' => $arr['field_SCEN_TXT'],
			'balance_min' => $arr['field_BALANCE_MIN'],
			'balance_max' => $arr['field_BALANCE_MAX'],
			
			'steps' => array()
		) ;
		foreach( $cfg_atr as $atr_record ) {
			$mkey = $atr_record['bible_code'] ;
			$record['link_'.$mkey] = $arr['field_LINK_'.$mkey] ;
		}
		$TAB[$scen_code] = $record ;
	}
	
	$query = "SELECT * FROM view_bible_SCENARIO_entry ORDER BY treenode_key, field_SCHEDULE_IDX" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$scen_code = $arr['treenode_key'] ;
		if( !$TAB[$scen_code] ) {
			continue ;
		}
		
		$record = array(
			'scenstep_code' => $arr['field_SCENSTEP_CODE'],
			'scenstep_tag' => $arr['field_SCENSTEP_TAG'],
			'schedule_idx' => $arr['field_SCHEDULE_IDX'],
			'schedule_daystep' => $arr['field_SCHEDULE_DAYSTEP'],
			'link_action' => $arr['field_LINK_ACTION'],
			'link_tpl' => $arr['field_LINK_TPL'],
			'mail_modes_json' => $arr['field_MAIL_MODES_JSON'],
			'exec_is_auto' => ($arr['field_EXEC_IS_AUTO']==1)
		) ;
		$TAB[$scen_code]['steps'][] = $record ;
	}
	
	return array('success'=>true,'data'=>array_values($TAB)) ;
}
function specRsiRecouveo_config_setScenario( $post_data ) {
	global $_opDB ;
	
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_atr = $ttmp['data']['cfg_atr'] ;
	
	$scenario_record = json_decode($post_data['data'],true) ;
	
	$scen_code = $scenario_record['scen_code'] ;
	$query = "SELECT entry_key FROM view_bible_SCENARIO_entry WHERE treenode_key='$scen_code'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		paracrm_lib_data_deleteRecord_bibleEntry('SCENARIO',$arr[0]) ;
	}
	paracrm_lib_data_deleteRecord_bibleTreenode('SCENARIO',$scen_code) ;
	
	if( $post_data['do_delete']==1 ) {
		return array('success'=>true) ;
	}
	
	$arr_ins = array() ;
	$arr_ins['field_SCEN_CODE'] = $scenario_record['scen_code'] ;
	$arr_ins['field_SCEN_TXT'] = $scenario_record['scen_txt'] ;
	$arr_ins['field_BALANCE_MIN'] = $scenario_record['balance_min'] ;
	$arr_ins['field_BALANCE_MAX'] = $scenario_record['balance_max'] ;
	foreach( $cfg_atr as $atr_record ) {
		$mkey = $atr_record['bible_code'] ;
		$arr_ins['field_LINK_'.$mkey] = $scenario_record['link_'.$mkey] ;
	}
	paracrm_lib_data_insertRecord_bibleTreenode( 'SCENARIO', $scen_code, NULL, $arr_ins ) ;
	
	$cnt = 0 ;
	foreach( $scenario_record['steps'] as $scenstep_record ) {
		$cnt++ ;
		
		$arr_ins = array() ;
		$arr_ins['field_SCENSTEP_CODE'] = $scenario_record['scen_code'].'_'.$scenstep_record['scenstep_tag'] ;
		$arr_ins['field_SCENSTEP_TAG'] = $scenstep_record['scenstep_tag'] ;
		$arr_ins['field_SCHEDULE_IDX'] = $scenstep_record['schedule_idx'] ;
		$arr_ins['field_SCHEDULE_DAYSTEP'] = $scenstep_record['schedule_daystep'] ;
		$arr_ins['field_LINK_ACTION'] = $scenstep_record['link_action'] ;
		$arr_ins['field_LINK_TPL'] = $scenstep_record['link_tpl'] ;
		$arr_ins['field_MAIL_MODES_JSON'] = $scenstep_record['mail_modes_json'] ;
		$arr_ins['field_EXEC_IS_AUTO'] = ($scenstep_record['exec_is_auto'] ? 1 : 0) ;
		paracrm_lib_data_insertRecord_bibleEntry( 'SCENARIO', $arr_ins['field_SCENSTEP_CODE'], $scen_code, $arr_ins ) ;
	}
	return array('success'=>true) ;
}



?>
