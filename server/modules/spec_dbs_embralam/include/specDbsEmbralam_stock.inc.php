<?php

function specDbsEmbralam_stock_getGrid($post_data) {
	global $_opDB ;
	
	$tab_DATA = array() ;
	
	$query = "SELECT * FROM view_bible_STOCK_entry stk
				LEFT OUTER JOIN view_file_INV inv ON inv.field_ADR_ID = stk.entry_key
				WHERE 1" ;
	if( $post_data['filter_treenodeKey'] && ($arr_treenodes = paracrm_data_getBibleTreeBranch( 'STOCK', $post_data['filter_treenodeKey'] )) ) {
		$query.= " AND treenode_key IN ".$_opDB->makeSQLlist($arr_treenodes) ;
	}
	$query.= " ORDER BY stk.entry_key LIMIT 10000" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$row = array() ;
		
		$row['adr_id'] = $arr['entry_key'] ;
		
		$row['pos_zone'] = substr($arr['treenode_key'],0,1) ;
		$row['pos_row'] = $arr['treenode_key'] ;
		$row['pos_bay'] = $arr['field_POS_BAY'] ;
		$row['pos_level'] = $arr['field_POS_LEVEL'] ;
		$row['pos_bin'] = $arr['field_POS_BIN'] ;
		
		$status = TRUE ;
		foreach( specDbsEmbralam_lib_stockAttributes_getStockAttributes() as $stockAttribute_obj ) {
			$mkey = $stockAttribute_obj['mkey'] ;
			$STOCK_fieldcode = $stockAttribute_obj['STOCK_fieldcode'] ;
			
			$ttmp = ($arr[$STOCK_fieldcode] ? json_decode($arr[$STOCK_fieldcode]) : array()) ;
			$row[$mkey] = (string)reset($ttmp) ;
			if( !$row[$mkey] ) {
				$status = FALSE ;
			}
		}
		
		$row['inv_prod'] = $arr['field_PROD_ID'] ;
		$row['inv_batch'] = $arr['field_BATCH_CODE'] ;
		$row['inv_qty'] = ( $arr['field_PROD_ID'] ? $arr['field_QTY_AVAIL'] : null ) ;
		
		$row['status'] = $status ;
		
		$tab_DATA[] = $row ;
	}
	return array('success'=>true, 'data'=>$tab_DATA) ;
}
function specDbsEmbralam_stock_getMvts($post_data) {
	$forward_post = array() ;
	$forward_post['start'] = 0 ;
	$forward_post['limit'] = 50 ;
	$forward_post['file_code'] = 'MVT' ;
	$forward_post['filter'] = json_encode(array(
		array(
			'type' => 'list',
			'field' => 'MVT_field_ADR_ID',
			'value' => array( $post_data['adr_id'] )
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


function specDbsEmbralam_stock_setRecord( $post_data ) {
	global $_opDB ;

	$form_data = json_decode($post_data['data'],true) ;

	$arr_ins = array() ;
	foreach( specDbsEmbralam_lib_stockAttributes_getStockAttributes() as $stockAttribute_obj ) {
		$mkey = $stockAttribute_obj['mkey'] ;
		$STOCK_fieldcode = $stockAttribute_obj['STOCK_fieldcode'] ;
		
		$arr_ins[$STOCK_fieldcode] = '' ;
		if( $atr_value = $form_data[$mkey] ) {
			$arr_ins[$STOCK_fieldcode] = json_encode(array($atr_value)) ;
		}
	}
	if( $post_data['is_new'] ) {
		$treenode_key ;
		if( !paracrm_lib_data_getRecord_bibleTreenode('STOCK',$treenode_key) ) {
			
		}
		
		$arr_ins['field_POS_BAY'] ;
		$arr_ins['field_POS_LEVEL'] ;
		$arr_ins['field_POS_BIN'] ;
		
		$arr_ins['field_ADR_ID'] ;
		$entry_key = $arr_ins['field_ADR_ID'] ;
		
		if( paracrm_lib_data_getRecord_bibleEntry('STOCK',$entry_key) ) {
			return array('success'=>false, 'error'=>'Emplacement déjà existant !') ;
		}
		$ret = paracrm_lib_data_insertRecord_bibleEntry( 'STOCK', $entry_key, $treenode_key, $arr_ins ) ;
	} else {
		$arr_ins['field_ADR_ID'] = $post_data['adr_id'] ;
		$entry_key = $arr_ins['field_ADR_ID'] ;
		
		$ret = paracrm_lib_data_updateRecord_bibleEntry( 'STOCK', $entry_key, $arr_ins ) ;
	}
	if( $ret != 0 ) {
		return array('success'=>false) ;
	}
	$adr_id = $entry_key ;
	
	// MaJ du stock
	if( !$form_data['inv_prod'] ) {
		$query = "SELECT filerecord_id FROM view_file_INV WHERE field_ADR_ID='{$adr_id}'" ;
		$filerecord_id = $_opDB->query_uniqueValue($query) ;
		if( $filerecord_id > 0 ) {
			paracrm_lib_data_deleteRecord_file('INV',$filerecord_id) ;
		}
	} else {
		$arr_ins = array() ;
		$arr_ins['field_ADR_ID'] = $adr_id ;
		$arr_ins['field_PROD_ID'] = $form_data['inv_prod'] ;
		$arr_ins['field_BATCH_CODE'] = $form_data['inv_batch'] ;
		$arr_ins['field_QTY_AVAIL'] = $form_data['inv_qty'] ;
		paracrm_lib_data_insertRecord_file( 'INV' , 0 , $arr_ins ) ;
	}
	
	return array('success'=>true) ;
}


?>