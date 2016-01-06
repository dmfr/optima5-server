<?php

function specDbsLam_cfg_getStockAttributes() {
	$return_fields = specDbsLam_lib_stockAttributes_getStockAttributes() ;
	if( !is_array($return_fields) ) {
		return array('success'=>false) ;
	}
	return array('success'=>true, 'data'=>$return_fields) ;
}

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
			$authPage = array('ADMIN','STD') ;
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
			'field_SOC_TXT' => $soc_record['soc_txt']
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
	
	return array('success'=>true) ;
}
?>