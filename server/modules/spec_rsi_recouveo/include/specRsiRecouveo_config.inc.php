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
			'user_short' => $arr['field_USER_SHORT'],
			'user_fullname' => $arr['field_USER_FULLNAME'],
			'user_email' => $arr['field_USER_EMAIL'],
			'user_tel' => $arr['field_USER_TEL'],
			'status_is_ext' => ($arr['field_STATUS_IS_EXT']==1)
		);
		$user_rec['link_SOC'] = json_decode($arr['field_LINK_SOC'],true) ;
		foreach( $cfg_atr as $atr_rec ) {
			// TODO / HACK ! Migrer vers nouveau format scénario
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
	$arr_ins['field_USER_SHORT'] = $user_record['user_short'] ;
	$arr_ins['field_USER_FULLNAME'] = $user_record['user_fullname'] ;
	$arr_ins['field_USER_EMAIL'] = $user_record['user_email'] ;
	$arr_ins['field_USER_TEL'] = $user_record['user_tel'] ;
	$arr_ins['field_STATUS_IS_EXT'] = ($user_record['status_is_ext'] ? 1 : 0) ;
	
	if( $user_record['link_SOC'] && json_decode($user_record['link_SOC'],true) == array('&') ) {
		$user_record['link_SOC'] = '' ;
	}
	$arr_ins['field_LINK_SOC'] = $user_record['link_SOC'] ;
	
	foreach( $cfg_atr as $atr_record ) {
		// TODO : HACK ! Migrer vers nouveau format scénario
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
			'assoc_is_auto' => $arr['field_ASSOC_IS_AUTO'],
			'link_soc' => $arr['field_LINK_SOC'],
			'balance_min' => $arr['field_BALANCE_MIN'],
			'balance_max' => $arr['field_BALANCE_MAX'],
			
			'steps' => array()
		) ;
		foreach( $cfg_atr as $atr_record ) {
			// TODO : HACK ! Migrer vers nouveau format scénario
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
	
	$arr_linkSoc = json_decode($scenario_record['link_soc'],true) ;
	if( !$arr_linkSoc || reset($arr_linkSoc)=='&' ) {
		$scenario_record['link_soc'] = NULL ;
	}
	$arr_ins = array() ;
	$arr_ins['field_SCEN_CODE'] = $scenario_record['scen_code'] ;
	$arr_ins['field_SCEN_TXT'] = $scenario_record['scen_txt'] ;
	$arr_ins['field_ASSOC_IS_AUTO'] = $scenario_record['assoc_is_auto'] ;
	$arr_ins['field_LINK_SOC'] = $scenario_record['link_soc'] ;
	$arr_ins['field_BALANCE_MIN'] = $scenario_record['balance_min'] ;
	$arr_ins['field_BALANCE_MAX'] = $scenario_record['balance_max'] ;
	foreach( $cfg_atr as $atr_record ) {
		// TODO : HACK ! Migrer vers nouveau format scénario
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







function specRsiRecouveo_config_getSocs($post_data) {
	global $_opDB ;
	
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_atr = $ttmp['data']['cfg_atr'] ;
	
	
	$TAB = array() ;
	
	$query = "SELECT * FROM view_bible_LIB_ACCOUNT_tree ORDER BY field_SOC_ID" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$soc_id = $arr['field_SOC_ID'] ;
		
		$record = array(
			'soc_id' => $arr['field_SOC_ID'],
			'soc_name' => $arr['field_SOC_NAME'],
			
			'metafields' => array(),
			'printfields' => array()
		) ;
		$json_metafields = json_decode($arr['field_SOC_METAFIELDS_JSON'],true) ;
		if( is_array($json_metafields) ) {
			foreach( $json_metafields as $json_metafield ) {
				$record['metafields'][] = array(
					'metafield_code' => $json_metafield['metafield_code'],
					'metafield_desc' => $json_metafield['metafield_desc'],
					'metafield_assoc' => $json_metafield['metafield_assoc'],
					'is_filter' => $json_metafield['is_filter'],
					'is_globalfilter' => $json_metafield['is_globalfilter'],
					'is_editable' => $json_metafield['is_editable']
				);
			}
		}
		$json_printfields = json_decode($arr['field_SOC_PRINTFIELDS_JSON'],true) ;
		if( is_array($json_printfields) ) {
			foreach( $json_printfields as $json_printfield ) {
				$record['printfields'][] = array(
					'printfield_code' => $json_printfield['printfield_code'],
					'printfield_text' => $json_printfield['printfield_text']
				);
			}
		}
		$TAB[$soc_id] = $record ;
	}
	
	return array('success'=>true,'data'=>array_values($TAB)) ;
}
function specRsiRecouveo_config_setSoc( $post_data ) {
	global $_opDB ;
	
	$soc_record = json_decode($post_data['data'],true) ;
	$soc_id = $soc_record['soc_id'] ;
	
	$arr_update = array() ;
	$arr_update['field_SOC_ID'] = $soc_record['soc_id'] ;
	$arr_update['field_SOC_NAME'] = $soc_record['soc_name'] ;
	$metafields = array() ;
	foreach( $soc_record['metafields'] as $metafield ) {
		$metafields[] = array(
			'metafield_code' => $metafield['metafield_code'],
			'metafield_desc' => $metafield['metafield_desc'],
			'metafield_assoc' => $metafield['metafield_assoc'],
			'is_filter' => $metafield['is_filter'],
			'is_globalfilter' => $metafield['is_globalfilter'],
			'is_editable' => $metafield['is_editable']
		);
	}
	$arr_update['field_SOC_METAFIELDS_JSON'] = json_encode($metafields) ;
	$printfields = array() ;
	foreach( $soc_record['printfields'] as $printfield ) {
		$printfields[] = array(
			'printfield_code' => $printfield['printfield_code'],
			'printfield_text' => $printfield['printfield_text']
		);
	}
	$arr_update['field_SOC_PRINTFIELDS_JSON'] = json_encode($printfields) ;
	paracrm_lib_data_updateRecord_bibleTreenode( 'LIB_ACCOUNT', $soc_id, $arr_update ) ;
	
	specRsiRecouveo_lib_metafields_build() ;
	
	return array('success'=>true) ;
}


?>
