<?php

function specDbsLam_cfg_getAuth( $post_data ) {
	global $_opDB ;
	
	if( !isset($_SESSION['login_data']['delegate_sdomainId']) ) {
		return array('success'=>true) ;
	}
	$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() ) ;
	if( $_SESSION['login_data']['delegate_sdomainId'] != $t->dbCurrent_getSdomainId() ) {
		return array('success'=>false) ;
	}
	
	$user_id = $_SESSION['login_data']['delegate_userId'] ;
	$query = "SELECT * FROM view_bible_USER_entry WHERE field_USER_ID='{$user_id}'" ;
	$result = $_opDB->query($query) ;
	if( ($arr = $_opDB->fetch_assoc($result)) == FALSE ) {
		return array('success'=>false) ;
	}
	
	$authPage = array() ;
	$user_class = $arr['treenode_key'] ;
	switch( $user_class ) {
		case 'ADMIN' :
			$authPage = array('ADMIN','STD','DESK') ;
			break ;
		
		case 'DESK' :
			$authPage = array('DESK') ;
			break ;
		
		case 'STD' :
			$authPage = array('STD') ;
			break ;
	}
	
	return array(
		'success' => true,
		'authPage' => $authPage
	) ;
}



function specDbsLam_cfg_getConfig() {
	if( isset($GLOBALS['cache_specDbsLam_cfg']['getConfig']) ) {
		return array(
			'success'=>true,
			'data' => $GLOBALS['cache_specDbsLam_cfg']['getConfig']
		);
	}

	$ttmp = specDbsLam_cfg_getSoc() ;
	$cfg_soc = $ttmp['data'] ;
	
	$ttmp = specDbsLam_cfg_getWhse() ;
	$cfg_whse = $ttmp['data'] ;
	
	$ttmp = specDbsLam_cfg_getContainer() ;
	$cfg_container = $ttmp['data'] ;
	
	$ttmp = specDbsLam_cfg_getMvtflow() ;
	$cfg_mvtflow = $ttmp['data'] ;
	
	
	$cfg_attribute = array() ;
	
	// preload map bibles PROD ADR STOCK
	$ttmp = paracrm_data_getBibleCfg(array('bible_code'=>'ADR')) ;
	$defineBible_ADR = $ttmp['data'] ;
	$ttmp = paracrm_data_getBibleCfg(array('bible_code'=>'PROD')) ;
	$defineBible_PROD = $ttmp['data'] ;
	$ttmp = paracrm_data_getFileGrid_config(array('file_code'=>'STOCK'),$auth_bypass=TRUE) ;
	$defineFile_STOCK = $ttmp['data'] ;
	$ttmp = paracrm_data_getFileGrid_config(array('file_code'=>'CDE'),$auth_bypass=TRUE) ;
	$defineFile_CDE = $ttmp['data'] ;
	
	// Model
	$attributes = array(
		'mkey' => '',
		'atr_code'=> '',
		'atr_txt' => '',
		'STOCK_fieldcode' => '',
		'PROD_fieldcode' => '',
		'ADR_fieldcode' => '',
		'CDE_fieldcode' => '',
		'cfg_is_optional' => NULL,
		'cfg_is_hidden' => NULL,
		'cfg_is_editable' => NULL,
		'cfg_is_mismatch' => NULL,
		'socs' => array()
	);
	foreach( $cfg_soc as $soc_record ) {
		foreach( $soc_record['attributes'] as $atr_record ) {
			$atr_code = $atr_record['atr_code'] ;
			
			if( !isset($cfg_attribute[$atr_code]) ) {
				$cfg_attribute[$atr_code] = array(
					'atr_code' => $atr_code,
					'mkey' => 'ATR_'.$atr_code,
					'atr_txt' => $atr_record['atr_txt'],
					'bible_code' => $atr_record['is_bible'] ? 'ATR_'.$atr_code : NULL,
					'cfg_is_editable' => $atr_record['cfg_is_editable'],
					'socs' => array()
				);
			}
			
			if( $atr_record['use_prod'] ) {
				$PROD_fieldcode = NULL ;
				foreach( $defineBible_PROD['entry_fields'] as $entryField_obj ) {
					if( $entryField_obj['entry_field_linkbible'] == $cfg_attribute[$atr_code]['mkey'] ) {
						$PROD_fieldcode = $entryField_obj['entry_field_code'] ;
						break ;
					}
				}
				if( $PROD_fieldcode ) {
					$cfg_attribute[$atr_code]['PROD_fieldcode'] = $PROD_fieldcode ;
				}
			}
			
			if( $atr_record['use_stock'] ) {
				$STOCK_fieldcode = NULL ;
				foreach( $defineFile_STOCK['grid_fields'] as $entryField_obj ) {
					if( $entryField_obj['file_field'] == $cfg_attribute[$atr_code]['mkey'] ) {
						$STOCK_fieldcode = 'field_'.$entryField_obj['file_field'] ;
						break ;
					}
				}
				if( $STOCK_fieldcode ) {
					$cfg_attribute[$atr_code]['STOCK_fieldcode'] = $STOCK_fieldcode ;
				}
			}
			
			if( $atr_record['use_cde'] ) {
				$CDE_fieldcode = NULL ;
				foreach( $defineFile_CDE['grid_fields'] as $entryField_obj ) {
					if( $entryField_obj['file_field'] == $cfg_attribute[$atr_code]['mkey'] ) {
						$CDE_fieldcode = 'field_'.$entryField_obj['file_field'] ;
						break ;
					}
				}
				if( $CDE_fieldcode ) {
					$cfg_attribute[$atr_code]['CDE_fieldcode'] = $CDE_fieldcode ;
				}
			}
			
			if( $atr_record['use_adr'] ) {
				$ADR_fieldcode = NULL ;
				foreach( $defineBible_ADR['entry_fields'] as $entryField_obj ) {
					if( $entryField_obj['entry_field_linkbible'] == $cfg_attribute[$atr_code]['mkey'] ) {
						$ADR_fieldcode = $entryField_obj['entry_field_code'] ;
						break ;
					}
				}
				if( $ADR_fieldcode ) {
					$cfg_attribute[$atr_code]['ADR_fieldcode'] = $ADR_fieldcode ;
				}
			}
			
			$cfg_attribute[$atr_code]['socs'][] = $soc_record['soc_code'] ;
		}
	}
	
	$return_data = array(
		'cfg_whse' => $cfg_whse,
		'cfg_soc' => $cfg_soc,
		'cfg_container' => $cfg_container,
		'cfg_attribute' => array_values($cfg_attribute),
		'cfg_mvtflow' => $cfg_mvtflow
	) ;
	$GLOBALS['cache_specDbsLam_cfg']['getConfig'] = $return_data ;
	
	return array(
		'success'=>true,
		'data' => $return_data
	);
}





function specDbsLam_cfg_getMvtflow() {
	global $_opDB ;
	
	$TAB = array() ;
	
	$query = "SELECT * FROM view_bible_CFG_MVTFLOW_tree WHERE treenode_parent_key IN ('','&') ORDER BY treenode_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$flow_code = $arr['field_FLOW_CODE'] ;
		$record = array(
			'flow_code' => $arr['field_FLOW_CODE'],
			'flow_txt' => $arr['field_FLOW_TXT'],
			'is_foreign' => $arr['field_IS_FOREIGN'],
			'is_cde' => $arr['field_IS_CDE'],
			'cde_process' => $arr['field_CDE_PROCESS'],
			'ack_fastforward' => $arr['field_ACK_FASTFORWARD'],
			'steps' => array(),
			'checks' => array()
		) ;
		
		$TAB[$flow_code] = $record ;
	}
	
	$query = "SELECT * FROM view_bible_CFG_MVTFLOW_entry ORDER BY treenode_key, entry_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$flow_code = $arr['treenode_key'] ;
		if( !$TAB[$flow_code] ) {
			continue ;
		}
		$step_code = $arr['field_STEP_CODE'] ;
		$record = array(
			'step_code' => $arr['field_STEP_CODE'],
			'step_txt' => $arr['field_STEP_TXT'],
			'is_checklist' => $arr['field_IS_CHECKLIST'],
			'is_attach_parent' => $arr['field_IS_ATTACH_PARENT'],
			'is_final' => $arr['field_IS_ADR'],
			'is_print' => $arr['field_IS_PRINT'],
			'is_exit' => $arr['field_IS_EXIT']
		) ;
		
		$TAB[$flow_code]['steps'][] = $record ;
	}
	
	$query = "SELECT * FROM view_bible_CFG_CHECKS_entry ORDER BY treenode_key, entry_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$flow_code = $arr['treenode_key'] ;
		if( !$TAB[$flow_code] ) {
			continue ;
		}
		$check_code = $arr['field_CHECK_CODE'] ;
		$record = array(
			'check_code' => $arr['field_CHECK_CODE'],
			'check_txt' => $arr['field_CHECK_TXT']
		) ;
		
		$TAB[$flow_code]['checks'][] = $record ;
	}
	
	return array('success'=>true, 'data'=>array_values($TAB)) ;
}


function specDbsLam_cfg_getContainer() {
	global $_opDB ;
	
	$TAB = array() ;
	
	$query = "SELECT * FROM view_bible_CFG_CONT_tree ORDER BY field_CONT_TYPE" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$container_type = $arr['field_CONT_TYPE'] ;
		$record = array(
			'container_type' => $arr['field_CONT_TYPE'],
			'container_type_txt' => $arr['field_CONT_TYPE_TXT']
		) ;
		
		$TAB[$container_type] = $record ;
	}
	
	return array('success'=>true, 'data'=>array_values($TAB)) ;
}


function specDbsLam_cfg_getWhse() {
	global $_opDB ;
	
	$TAB = array() ;
	
	$query = "SELECT * FROM view_bible_CFG_WHSE_entry ORDER BY field_WHSE_CODE" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$whse_code = $arr['field_WHSE_CODE'] ;
		$record = array(
			'whse_code' => $arr['field_WHSE_CODE'],
			'whse_txt' => $arr['field_WHSE_TXT'],
			'is_stock' => $arr['field_IS_STOCK'],
			'is_work' => $arr['field_IS_WORK']
		) ;
		
		$TAB[$whse_code] = $record ;
	}
	
	return array('success'=>true, 'data'=>array_values($TAB)) ;
}


function specDbsLam_cfg_getSoc() {
	global $_opDB ;
	
	$TAB = array() ;
	
	$query = "SELECT * FROM view_bible_CFG_SOC_entry ORDER BY field_SOC_CODE" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$soc_code = $arr['field_SOC_CODE'] ;
		$record = array(
			'soc_code' => $arr['field_SOC_CODE'],
			'soc_txt' => $arr['field_SOC_TXT'],
			'location_policy_ifexists' => $arr['field_PLOCATION_IFEXISTS'],
			'attributes' => array()
		) ;
		
		$TAB[$soc_code] = $record ;
	}
	
	$query = "SELECT * FROM view_bible_CFG_ATR_entry ORDER BY treenode_key, field_ATR_CODE" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$soc_code = $arr['treenode_key'] ;
		$atr_code = substr($arr['field_ATR_CODE'],strpos($arr['field_ATR_CODE'],'_')+1) ;
		$record = array(
			'atr_code' => $atr_code,
			'atr_txt' => $arr['field_ATR_TXT'],
			'is_bible' => $arr['field_IS_BIBLE'],
			'use_prod' => $arr['field_USE_PROD'],
			'use_prod_multi' => $arr['field_USE_PROD_MULTI'],
			'use_stock' => $arr['field_USE_STOCK'],
			'use_cde' => $arr['field_USE_CDE'],
			'cfg_is_hidden' => $arr['field_CFG_IS_HIDDEN'],
			'cfg_is_editable' => $arr['field_CFG_IS_EDITABLE'],
			'use_adr' => $arr['field_USE_ADR'],
			'use_adr_multi' => $arr['field_USE_ADR_MULTI'],
			'adr_is_optional' => $arr['field_ADR_IS_OPTIONAL'],
			'adr_is_mismatch' => $arr['field_ADR_IS_MISMATCH']
		) ;
		
		$TAB[$soc_code]['attributes'][] = $record ;
	}
	
	
	return array('success'=>true, 'data'=>array_values($TAB)) ;
}

function specDbsLam_cfg_applySoc($post_data) {
	global $_opDB ;
	
	$data_Soc = json_decode($post_data['data'],true) ;
	
	$query = "LOCK TABLES 
		view_bible_CFG_SOC_tree WRITE,
		view_bible_CFG_SOC_entry WRITE,
		view_bible_CFG_ATR_tree WRITE,
		view_bible_CFG_ATR_entry WRITE" ;
	
	$TAB = array() ;
	$TAB['view_bible_CFG_SOC_tree'] = array();
	$TAB['view_bible_CFG_SOC_entry'] = array();
	$TAB['view_bible_CFG_ATR_tree'] = array();
	$TAB['view_bible_CFG_ATR_entry'] = array();
	
	$TAB['view_bible_CFG_SOC_tree'][] = array(
		'treenode_key' => 'SOC',
		'field_GROUP' => 'SOC'
	);
	foreach( $data_Soc as $soc_record ) {
		$soc_record['soc_code'] = trim(strtoupper($soc_record['soc_code'])) ;
		
		$TAB['view_bible_CFG_SOC_entry'][] = array(
			'entry_key' => $soc_record['soc_code'],
			'treenode_key' => 'SOC',
			'field_SOC_CODE' => $soc_record['soc_code'],
			'field_SOC_TXT' => $soc_record['soc_txt'],
			'field_PLOCATION_IFEXISTS' => $soc_record['location_policy_ifexists']
		);
		$TAB['view_bible_CFG_ATR_tree'][] = array(
			'treenode_key' => $soc_record['soc_code'],
			'field_SOC_CODE' => $soc_record['soc_code']
		);
		foreach( $soc_record['attributes'] as $atr_record ) {
			$atr_record['atr_code'] = trim(strtoupper($atr_record['atr_code'])) ;
			
			$TAB['view_bible_CFG_ATR_entry'][] = array(
				'entry_key' => $soc_record['soc_code'].'_'.$atr_record['atr_code'],
				'treenode_key' => $soc_record['soc_code'],
				'field_ATR_CODE' => $soc_record['soc_code'].'_'.$atr_record['atr_code'],
				'field_ATR_TXT' => $atr_record['atr_txt'],
				'field_IS_BIBLE' => $atr_record['is_bible'],
				'field_USE_PROD' => $atr_record['use_prod'],
				'field_USE_PROD_MULTI' => $atr_record['use_prod_multi'],
				'field_USE_STOCK' => $atr_record['use_stock'],
				'field_USE_CDE' => $atr_record['use_cde'],
				'field_CFG_IS_HIDDEN' => $atr_record['cfg_is_hidden'],
				'field_CFG_IS_EDITABLE' => $atr_record['cfg_is_editable'],
				'field_USE_ADR' => $atr_record['use_adr'],
				'field_USE_ADR_MULTI' => $atr_record['use_adr_multi'],
				'field_ADR_IS_OPTIONAL' => $atr_record['adr_is_optional'],
				'field_ADR_IS_MISMATCH' => $atr_record['adr_is_mismatch']
			);
		}
	}
	
	foreach( $TAB as $db_table => $rows ) {
		$query = "DELETE FROM {$db_table}" ;
		$_opDB->query($query) ;
		
		foreach( $rows as $row ) {
			$_opDB->insert($db_table,$row) ;
		}
	}
	
	specDbsLam_cfg_lib_build() ;
	
	unset($GLOBALS['cache_specDbsLam_cfg']['getConfig']) ;
	
	return array('success'=>true) ;
}


function specDbsLam_cfg_lib_build() {
	global $_opDB ;
	
	$attributes = array() ;
	
	$ttmp = specDbsLam_cfg_getSoc() ;
	foreach( $ttmp['data'] as $soc_record ) {
		foreach( $soc_record['attributes'] as $atr_record ) {
			$atr_code = $atr_record['atr_code'] ;
			if( !$attributes[$atr_code] ) {
				$attributes[$atr_code] = array(
					'atr_code' => $atr_record['atr_code'],
					'atr_txt' => $atr_record['atr_txt']
				);
			}
			if( $atr_record['is_bible'] ) {
				$attributes[$atr_code]['is_bible'] = TRUE ;
			}
			if( $atr_record['use_prod'] ) {
				$attributes[$atr_code]['use_prod'] = TRUE ;
			}
			if( $atr_record['use_stock'] ) {
				$attributes[$atr_code]['use_stock'] = TRUE ;
			}
			if( $atr_record['use_adr'] ) {
				$attributes[$atr_code]['use_adr'] = TRUE ;
			}
			if( $atr_record['use_cde'] ) {
				$attributes[$atr_code]['use_cde'] = TRUE ;
			}
		}	
	}
	
	foreach( $attributes as $attribute ) {
		if( $attribute['is_bible'] ) {
			$bible_code = 'ATR_'.$attribute['atr_code'] ;
			$key = $attribute['atr_code'] ;
			
			$query = "SELECT count(*) FROM define_bible WHERE bible_code='{$bible_code}'" ;
			if( $_opDB->query_uniqueValue($query) != 1 ) {
				$query = "DELETE FROM define_bible WHERE bible_code='{$bible_code}'" ;
				$_opDB->query($query) ;
				$query = "DELETE FROM define_bible_tree WHERE bible_code='{$bible_code}'" ;
				$_opDB->query($query) ;
				$query = "DELETE FROM define_bible_entry WHERE bible_code='{$bible_code}'" ;
				$_opDB->query($query) ;
			
				$arr_ins = array() ;
				$arr_ins['bible_code'] = $bible_code ;
				$arr_ins['bible_lib'] = 'Atr / '.$attribute['atr_txt'] ;
				$arr_ins['bible_iconfile'] = 'ico_dataadd_16.gif' ;
				$_opDB->insert('define_bible',$arr_ins) ;
				
				$arr_ins = array() ;
				$arr_ins['bible_code'] = $bible_code ;
				$arr_ins['tree_field_code'] = $key ;
				$arr_ins['tree_field_is_key'] = 'O' ;
				$arr_ins['tree_field_index'] = 1 ;
				$arr_ins['tree_field_lib'] = $attribute['atr_txt'] ;
				$arr_ins['tree_field_type'] = 'string' ;
				$arr_ins['tree_field_is_header'] = 'O' ;
				$arr_ins['tree_field_is_highlight'] = 'O' ;
				$_opDB->insert('define_bible_tree',$arr_ins) ;
				
				$arr_ins = array() ;
				$arr_ins['bible_code'] = $bible_code ;
				$arr_ins['entry_field_code'] = 'DUMMY' ;
				$arr_ins['entry_field_is_key'] = 'O' ;
				$arr_ins['entry_field_index'] = 1 ;
				$arr_ins['entry_field_lib'] = 'DUMMY' ;
				$arr_ins['entry_field_type'] = 'string' ;
				$arr_ins['entry_field_is_header'] = 'O' ;
				$arr_ins['entry_field_is_highlight'] = 'O' ;
				$_opDB->insert('define_bible_entry',$arr_ins) ;
			}
			$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() );
			$t->sdomainDefine_buildBible( DatabaseMgr_Sdomain::dbCurrent_getSdomainId(), $bible_code ) ;
		}
		
		$field_code = 'ATR_'.$attribute['atr_code'] ;
		$bible_code = 'ATR_'.$attribute['atr_code'] ;
		
		if( $attribute['use_prod'] ) {
			$query = "SELECT count(*) FROM define_bible_entry WHERE bible_code='PROD' AND entry_field_code='{$field_code}'" ;
			if( $_opDB->query_uniqueValue($query) != 1 ) {
				$query = "SELECT max(entry_field_index) FROM define_bible_entry WHERE bible_code='PROD'" ;
				$max_index = $_opDB->query_uniqueValue($query) ;
				$max_index++ ;
				
				$arr_ins = array() ;
				$arr_ins['bible_code'] = 'PROD' ;
				$arr_ins['entry_field_code'] = $field_code ;
				$arr_ins['entry_field_is_key'] = 'O' ;
				$arr_ins['entry_field_index'] = $max_index ;
				$arr_ins['entry_field_lib'] = 'Atr: '.$attribute['atr_txt'] ;
				$arr_ins['entry_field_type'] = 'link' ;
				$arr_ins['entry_field_linktype'] = 'treenode' ;
				$arr_ins['entry_field_linkbible'] = $bible_code ;
				$arr_ins['entry_field_is_header'] = '' ;
				$arr_ins['entry_field_is_highlight'] = 'O' ;
				$_opDB->insert('define_bible_entry',$arr_ins) ;
			}
		}
		if( !$attribute['use_prod'] ) {
			$query = "DELETE FROM define_bible_entry WHERE bible_code='PROD' AND entry_field_code='{$field_code}'" ;
			$_opDB->query($query) ;
		}
		
		
		if( $attribute['use_adr'] ) {
			$query = "SELECT count(*) FROM define_bible_entry WHERE bible_code='ADR' AND entry_field_code='{$field_code}'" ;
			if( $_opDB->query_uniqueValue($query) != 1 ) {
				$query = "SELECT max(entry_field_index) FROM define_bible_entry WHERE bible_code='ADR'" ;
				$max_index = $_opDB->query_uniqueValue($query) ;
				$max_index++ ;
				
				$arr_ins = array() ;
				$arr_ins['bible_code'] = 'ADR' ;
				$arr_ins['entry_field_code'] = $field_code ;
				$arr_ins['entry_field_is_key'] = 'O' ;
				$arr_ins['entry_field_index'] = $max_index ;
				$arr_ins['entry_field_lib'] = 'Atr: '.$attribute['atr_txt'] ;
				$arr_ins['entry_field_type'] = 'link' ;
				$arr_ins['entry_field_linktype'] = 'treenode' ;
				$arr_ins['entry_field_linkbible'] = $bible_code ;
				$arr_ins['entry_field_is_header'] = '' ;
				$arr_ins['entry_field_is_highlight'] = 'O' ;
				$_opDB->insert('define_bible_entry',$arr_ins) ;
			}
		}
		if( !$attribute['use_adr'] ) {
			$query = "DELETE FROM define_bible_entry WHERE bible_code='ADR' AND entry_field_code='{$field_code}'" ;
			$_opDB->query($query) ;
		}
		
		
		if( $attribute['use_cde'] ) {
			$query = "SELECT count(*) FROM define_file_entry WHERE file_code='CDE' AND entry_field_code='{$field_code}'" ;
			if( $_opDB->query_uniqueValue($query) != 1 ) {
				$query = "SELECT max(entry_field_index) FROM define_file_entry WHERE file_code='CDE'" ;
				$max_index = $_opDB->query_uniqueValue($query) ;
				$max_index++ ;
				
				$arr_ins = array() ;
				$arr_ins['file_code'] = 'CDE' ;
				$arr_ins['entry_field_code'] = $field_code ;
				$arr_ins['entry_field_index'] = $max_index ;
				$arr_ins['entry_field_lib'] = 'Atr: '.$attribute['atr_txt'] ;
				$arr_ins['entry_field_type'] = 'string' ;
				$arr_ins['entry_field_is_header'] = '' ;
				$arr_ins['entry_field_is_highlight'] = 'O' ;
				$_opDB->insert('define_file_entry',$arr_ins) ;
			}
		}
		if( !$attribute['use_cde'] ) {
			$query = "DELETE FROM define_file_entry WHERE file_code='CDE' AND entry_field_code='{$field_code}'" ;
			$_opDB->query($query) ;
		}
		
		
		if( $attribute['use_stock'] ) {
			$arr_ins_base = array() ;
			$arr_ins_base['entry_field_code'] = $field_code ;
			$arr_ins_base['entry_field_lib'] = 'Atr: '.$attribute['atr_txt'] ;
			if( $attribute['is_bible'] ) {
				$arr_ins_base['entry_field_type'] = 'link' ;
				$arr_ins_base['entry_field_linktype'] = 'treenode' ;
				$arr_ins_base['entry_field_linkbible'] = $bible_code ;
			} else {
				$arr_ins_base['entry_field_type'] = 'string' ;
			}
			$arr_ins_base['entry_field_is_header'] = '' ;
			$arr_ins_base['entry_field_is_highlight'] = 'O' ;
			
			$arr_ins = $arr_ins_base ;
			$arr_ins['file_code'] = 'STOCK' ;
			$query = "SELECT count(*) FROM define_file_entry WHERE file_code='STOCK' AND entry_field_code='{$field_code}'" ;
			if( $_opDB->query_uniqueValue($query) != 1 ) {
				$query = "SELECT max(entry_field_index) FROM define_file_entry WHERE file_code='STOCK'" ;
				$max_index = $_opDB->query_uniqueValue($query) ;
				$max_index++ ;
				
				$arr_ins['entry_field_index'] = $max_index ;
				$_opDB->insert('define_file_entry',$arr_ins) ;
			} else {
				$arr_cond = array() ;
				$arr_cond['file_code'] = 'STOCK' ;
				$arr_cond['entry_field_code'] = $field_code ;
				$_opDB->update('define_file_entry',$arr_ins,$arr_cond) ;
			}
			
			$arr_ins = $arr_ins_base ;
			$arr_ins['file_code'] = 'MVT' ;
			$query = "SELECT count(*) FROM define_file_entry WHERE file_code='MVT' AND entry_field_code='{$field_code}'" ;
			if( $_opDB->query_uniqueValue($query) != 1 ) {
				$query = "SELECT max(entry_field_index) FROM define_file_entry WHERE file_code='MVT'" ;
				$max_index = $_opDB->query_uniqueValue($query) ;
				$max_index++ ;
				
				$arr_ins['entry_field_index'] = $max_index ;
				$_opDB->insert('define_file_entry',$arr_ins) ;
			} else {
				$arr_cond = array() ;
				$arr_cond['file_code'] = 'MVT' ;
				$arr_cond['entry_field_code'] = $field_code ;
				$_opDB->update('define_file_entry',$arr_ins,$arr_cond) ;
			}
		}
		if( !$attribute['use_stock'] ) {
			$query = "DELETE FROM define_file_entry WHERE file_code='STOCK' AND entry_field_code='{$field_code}'" ;
			$_opDB->query($query) ;
		}
	}
	$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() );
	$t->sdomainDefine_buildBible( DatabaseMgr_Sdomain::dbCurrent_getSdomainId(), 'PROD' ) ;
	$t->sdomainDefine_buildBible( DatabaseMgr_Sdomain::dbCurrent_getSdomainId(), 'ADR' ) ;
	$t->sdomainDefine_buildFile( DatabaseMgr_Sdomain::dbCurrent_getSdomainId(), 'STOCK' ) ;
	$t->sdomainDefine_buildFile( DatabaseMgr_Sdomain::dbCurrent_getSdomainId(), 'MVT' ) ;
	$t->sdomainDefine_buildFile( DatabaseMgr_Sdomain::dbCurrent_getSdomainId(), 'CDE' ) ;
	
}



?>
