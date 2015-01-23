<?php

function specDbsEmbralam_prods_getGrid($post_data) {
	global $_opDB ;
	
	$tab_DATA = array() ;
	
	$query = "SELECT * FROM view_bible_PROD_entry prod" ;
	if( isset($post_data['entry_key']) ) {
		$query.= " WHERE entry_key = '{$post_data['entry_key']}'" ;
	} elseif ( isset($post_data['filter']) ) {
		$query.= " WHERE entry_key LIKE '{$post_data['filter']}%'" ;
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
		
		$row['prod_id'] = $arr['entry_key'] ;
		$row['prod_txt'] = $arr['field_PROD_TXT'] ;
		
		foreach( specDbsEmbralam_lib_stockAttributes_getStockAttributes() as $stockAttribute_obj ) {
			$mkey = $stockAttribute_obj['mkey'] ;
			$PROD_fieldcode = $stockAttribute_obj['PROD_fieldcode'] ;
			
			$ttmp = ($arr[$PROD_fieldcode] ? json_decode($arr[$PROD_fieldcode]) : array()) ;
			$row[$mkey] = (string)reset($ttmp) ;
		}
		
		$tab_DATA[] = $row ;
	}
	return array('success'=>true, 'data'=>$tab_DATA) ;
}
function specDbsEmbralam_prods_getStockGrid($post_data) {
	$forward_post = array() ;
	$forward_post['start'] ;
	$forward_post['limit'] ;
	$forward_post['file_code'] = 'INV' ;
	$forward_post['filter'] = json_encode(array(
		array(
			'type' => 'list',
			'field' => 'INV_field_PROD_ID',
			'value' => array( $post_data['prod_id'] )
		)
	)) ;
	$ttmp = paracrm_data_getFileGrid_data( $forward_post, $auth_bypass=TRUE ) ;
	$paracrm_TAB = $ttmp['data'] ;
	
	$TAB = array() ;
	foreach( $paracrm_TAB as $paracrm_row ) {
		$row = array() ;
		$row['adr_id'] = $paracrm_row['INV_field_ADR_ID'] ;
		$row['inv_prod'] = $paracrm_row['INV_field_PROD_ID'] ;
		$row['inv_batch'] = $paracrm_row['INV_field_BATCH_CODE'] ;
		$row['inv_qty'] = $paracrm_row['INV_field_QTY_AVAIL'] ;
		$TAB[] = $row ;
	}
	
	return array('success'=>true,'data'=>$TAB,'debug'=>$paracrm_TAB) ;
}
function specDbsEmbralam_prods_getMvtsGrid($post_data) {
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



function specDbsEmbralam_prods_setRecord( $post_data ) {
	global $_opDB ;

	$form_data = json_decode($post_data['data'],true) ;

	$arr_ins = array() ;
	foreach( specDbsEmbralam_lib_stockAttributes_getStockAttributes() as $stockAttribute_obj ) {
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