<?php

function specDbsLam_prods_getGrid($post_data) {
	global $_opDB ;
	
	$tab_DATA = array() ;
	
	$query = "SELECT * FROM view_bible_PROD_entry prod" ;
	if( isset($post_data['entry_key']) ) {
		$query.= " WHERE entry_key = '{$post_data['entry_key']}'" ;
	} elseif ( isset($post_data['filter']) ) {
		$query.= " WHERE entry_key LIKE '{$post_data['soc_code']}_{$post_data['filter']}%'" ;
	} else {
		$query.= " WHERE 1" ;
	}
	if( $post_data['soc_code'] ) {
		if( $arr_treenodes = paracrm_data_getBibleTreeBranch( 'PROD', $post_data['soc_code'] ) ) {
			$query.= " AND treenode_key IN ".$_opDB->makeSQLlist($arr_treenodes) ;
		} else {
			$query.= " AND 0" ;
		}
	}
	$query.= " ORDER BY prod.entry_key" ;
	if( !isset($post_data['filter']) ) {
		$query.= "" ;
	} else {
		$query.= " LIMIT 100" ;
	}
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$row = array() ;
		$row['id'] = $arr['entry_key'] ;
		$ttmp = explode('_',$arr['entry_key'],2) ;
		$row['prod_id'] = $ttmp[1] ;
		$row['prod_txt'] = $arr['field_PROD_TXT'] ;
		$row['spec_is_batch'] = $arr['field_SPEC_IS_BATCH'] ;
		$row['spec_is_dlc'] = $arr['field_SPEC_IS_DLC'] ;
		$row['spec_is_sn'] = $arr['field_SPEC_IS_SN'] ;
		
		foreach( specDbsLam_lib_stockAttributes_getStockAttributes() as $stockAttribute_obj ) {
			$mkey = $stockAttribute_obj['mkey'] ;
			$PROD_fieldcode = $stockAttribute_obj['PROD_fieldcode'] ;
			
			$ttmp = ($arr[$PROD_fieldcode] ? json_decode($arr[$PROD_fieldcode]) : array()) ;
			$row[$mkey] = (string)reset($ttmp) ;
		}
		
		$tab_DATA[] = $row ;
	}
	return array('success'=>true, 'data'=>$tab_DATA) ;
}
function specDbsLam_prods_getStockGrid($post_data) {
	global $_opDB ;
	
	// Load cfg attributes
	$ttmp = specDbsLam_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	

	$forward_post = array() ;
	$forward_post['start'] ;
	$forward_post['limit'] ;
	$forward_post['file_code'] = 'STOCK' ;
	$forward_post['filter'] = json_encode(array(
		array(
			'operator' => 'in',
			'property' => 'STOCK_field_PROD_ID',
			'value' => array( $post_data['filter_id'] )
		)
	)) ;
	$ttmp = paracrm_data_getFileGrid_data( $forward_post, $auth_bypass=TRUE ) ;
	$paracrm_TAB = $ttmp['data'] ;
	
	$TAB = array() ;
	foreach( $paracrm_TAB as $paracrm_row ) {
		$row = array() ;
		$row['current_adr_entryKey'] = $paracrm_row['STOCK_field_ADR_ID'] ;
		$row['stk_prod'] = $paracrm_row['STOCK_field_PROD_ID'] ;
		$row['stk_batch'] = $paracrm_row['STOCK_field_SPEC_BATCH'] ;
		$row['stk_sn'] = $paracrm_row['STOCK_field_SPEC_SN'] ;
		$row['mvt_qty'] = ($paracrm_row['STOCK_field_QTY_AVAIL'] + $paracrm_row['STOCK_field_QTY_OUT']) ;
		
		$filerecord_id = $paracrm_row['filerecord_id'] ;
		$query = "SELECT field_STEP_CODE FROM view_file_MVT_STEP WHERE field_FILE_STOCK_ID='{$filerecord_id}'" ;
		$row['step_code'] = $_opDB->query_uniqueValue($query) ;
		
		foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
			if( !$stockAttribute_obj['STOCK_fieldcode'] ) {
				continue ;
			}
			$mkey = $stockAttribute_obj['mkey'] ;
			$STOCK_fieldcode = $stockAttribute_obj['STOCK_fieldcode'] ;
			$row[$mkey] = $paracrm_row['STOCK_'.$STOCK_fieldcode] ;
		}
		
		$query = "SELECT treenode_key FROM view_bible_ADR_entry WHERE entry_key='{$row['current_adr_entryKey']}'" ;
		$row['current_adr_treenodeKey'] = $_opDB->query_uniqueValue($query) ;
		$row['current_adr'] = $row['current_adr_entryKey'] ;
		$row['current_adr_tmp'] = (strpos($row['current_adr_entryKey'],'TMP')===0) ;
		if( $row['current_adr_tmp'] ) {
			$row['current_adr'] = $row['current_adr_treenodeKey'] ;
		}
		
		$TAB[] = $row ;
	}
	
	return array('success'=>true,'data'=>$TAB,'debug'=>$paracrm_TAB) ;
}
function specDbsLam_prods_getMvtsGrid($post_data) {
	$forward_post = array() ;
	$forward_post['start'] ;
	$forward_post['limit'] ;
	$forward_post['file_code'] = 'MVT' ;
	$forward_post['filter'] = json_encode(array(
		array(
			'type' => 'list',
			'field' => 'MVT_field_PROD_ID',
			'value' => array( $post_data['prod_id'] )
		)
	)) ;
	$ttmp = paracrm_data_getFileGrid_data( $forward_post, $auth_bypass=TRUE ) ;
	$paracrm_TAB = $ttmp['data'] ;
	
	$TAB = array() ;
	foreach( $paracrm_TAB as $paracrm_row ) {
		$row = array() ;
		$row['mvt_id'] = $paracrm_row['filerecord_id'] ;
		$row['mvt_date'] = $paracrm_row['MVT_field_DATE'] ;
		$row['adr_id'] = $paracrm_row['MVT_field_ADR_ID'] ;
		$row['prod_id'] = $paracrm_row['MVT_field_PROD_ID'] ;
		$row['batch'] = $paracrm_row['MVT_field_BATCH_CODE'] ;
		$row['mvt_qty'] = $paracrm_row['MVT_field_QTY'] ;
		$TAB[] = $row ;
	}
	
	return array('success'=>true,'data'=>$TAB,'debug'=>$paracrm_TAB) ;
}



function specDbsLam_prods_setRecord( $post_data ) {
	global $_opDB ;

	$form_data = json_decode($post_data['data'],true) ;

	$arr_ins = array() ;
	foreach( specDbsLam_lib_stockAttributes_getStockAttributes() as $stockAttribute_obj ) {
		$mkey = $stockAttribute_obj['mkey'] ;
		$PROD_fieldcode = $stockAttribute_obj['PROD_fieldcode'] ;
		
		$arr_ins[$PROD_fieldcode] = '' ;
		if( $atr_value = $form_data[$mkey] ) {
			$arr_ins[$PROD_fieldcode] = json_encode(array($atr_value)) ;
		}
	}
	if( $post_data['_is_new'] ) {
		$arr_ins['field_PROD_ID'] = $form_data['prod_id'] ;
		$arr_ins['field_PROD_TXT'] = $form_data['prod_txt'] ;
		$entry_key = $arr_ins['field_PROD_ID'] ;
		
		$treenode_key = 'PROD' ;
		
		if( paracrm_lib_data_getRecord_bibleEntry('PROD',$entry_key) ) {
			return array('success'=>false, 'error'=>'Article déjà existant !') ;
		}
		$ret = paracrm_lib_data_insertRecord_bibleEntry( 'PROD', $entry_key, $treenode_key, $arr_ins ) ;
	} else {
		$arr_ins['field_PROD_ID'] = $post_data['prod_id'] ;
		$arr_ins['field_PROD_TXT'] = $form_data['prod_txt'] ;
		$entry_key = $arr_ins['field_PROD_ID'] ;
		
		$ret = paracrm_lib_data_updateRecord_bibleEntry( 'PROD', $entry_key, $arr_ins ) ;
	}
	if( $ret != 0 ) {
		return array('success'=>false) ;
	}
	return array('success'=>true) ;
}

?>