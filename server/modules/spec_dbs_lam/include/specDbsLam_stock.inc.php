<?php

function specDbsLam_stock_getGrid($post_data) {
	global $_opDB ;
	
	$ttmp = specDbsLam_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	
	$tab_DATA = array() ;
	
	$query = "SELECT * FROM view_bible_ADR_entry adr
				LEFT OUTER JOIN view_file_STOCK stock ON stock.field_ADR_ID = adr.entry_key
				WHERE 1" ;
	if( $post_data['filter_treenodeKey'] && ($arr_treenodes = paracrm_data_getBibleTreeBranch( 'ADR', $post_data['filter_treenodeKey'] )) ) {
		$query.= " AND treenode_key IN ".$_opDB->makeSQLlist($arr_treenodes) ;
	}
	if( $post_data['whse_code'] ) {
		if( $arr_treenodes = paracrm_data_getBibleTreeBranch( 'ADR', $post_data['whse_code'] ) ) {
			$query.= " AND treenode_key IN ".$_opDB->makeSQLlist($arr_treenodes) ;
		} else {
			$query.= " AND 0" ;
		}
	}
	$query.= " ORDER BY adr.entry_key LIMIT 10000" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$row = array() ;
		
		if( $arr['field_ADR_ID'] ) {
			$row['id'] = $arr['field_ADR_ID'].'+'.$arr['field_PROD_ID'].'+'.$arr['field_BATCH_CODE'] ;
		} else {
			$row['id'] = $arr['entry_key'] ;
		}
		
		$ttmp = explode('_',$arr['entry_key'],2) ;
		if( $ttmp[1] ) {
			$row['adr_id'] = $ttmp[1] ;
		} else {
			$row['adr_id'] = '-' ;
		}
		
		$row['pos_zone'] = substr($arr['treenode_key'],0,1) ;
		$row['pos_row'] = $arr['treenode_key'] ;
		$row['pos_bay'] = $arr['field_POS_BAY'] ;
		$row['pos_level'] = $arr['field_POS_LEVEL'] ;
		$row['pos_bin'] = $arr['field_POS_BIN'] ;
		
		$status = TRUE ;
		foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
			if( !$stockAttribute_obj['ADR_fieldcode'] ) {
				continue ;
			}
			$mkey = $stockAttribute_obj['mkey'] ;
			$ADR_fieldcode = $stockAttribute_obj['ADR_fieldcode'] ;
			
			$ttmp = ($arr[$ADR_fieldcode] ? json_decode($arr[$ADR_fieldcode]) : array()) ;
			$row[$mkey] = (string)reset($ttmp) ;
			if( !$row[$mkey] ) {
				$status = FALSE ;
			}
		}
		foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
			if( !$stockAttribute_obj['STOCK_fieldcode'] ) {
				continue ;
			}
			$mkey = $stockAttribute_obj['mkey'] ;
			$STOCK_fieldcode = $stockAttribute_obj['STOCK_fieldcode'] ;
			$row[$mkey] = $arr[$STOCK_fieldcode] ;
		}
		
		$row['inv_id'] = $arr['filerecord_id'] ;
		$row['inv_prod'] = $arr['field_PROD_ID'] ;
		$row['inv_batch'] = $arr['field_SPEC_BATCH'] ;
		$row['inv_qty'] = ( $arr['field_PROD_ID'] ? $arr['field_QTY_AVAIL'] : null ) ;
		$row['inv_sn'] = $arr['field_SPEC_SN'] ;
		
		$row['status'] = $status ;
		
		$tab_DATA[] = $row ;
	}
	return array('success'=>true, 'data'=>$tab_DATA) ;
}
function specDbsLam_stock_getMvts($post_data) {
	$forward_post = array() ;
	$forward_post['start'] = 0 ;
	$forward_post['limit'] = 50 ;
	$forward_post['file_code'] = 'MVT' ;
	$forward_post['filter'] = json_encode(array(
		array(
			'operator' => 'in',
			'property' => 'MVT_field_ADR_ID',
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


function specDbsLam_stock_setRecord( $post_data ) {
	global $_opDB ;

	$form_data = json_decode($post_data['data'],true) ;
	foreach( $form_data as $mkey => &$mvalue ) {
		$mvalue = trim($mvalue) ;
	}
	unset($mvalue) ;

	$arr_ins = array() ;
	foreach( specDbsLam_lib_stockAttributes_getStockAttributes() as $stockAttribute_obj ) {
		$mkey = $stockAttribute_obj['mkey'] ;
		$STOCK_fieldcode = $stockAttribute_obj['STOCK_fieldcode'] ;
		
		$arr_ins[$STOCK_fieldcode] = '' ;
		if( $atr_value = $form_data[$mkey] ) {
			$arr_ins[$STOCK_fieldcode] = json_encode(array($atr_value)) ;
		}
	}
	if( $post_data['_is_new'] ) {
		$check = array('pos_row'=>3,'pos_bay'=>1,'pos_level'=>2,'pos_depth'=>1) ;
		$errors = array() ;
		foreach( $check as $mkey => $length ) {
			if( strlen($form_data[$mkey]) != $length || (is_numeric($form_data[$mkey]) != ($length > 1)) ) {
				$errors[$mkey] = 'Position manquante' ;
			}
		}
		if( $errors ) {
			return array('success'=>false, 'formErrors'=>$errors) ;
		}
		
		$concat = array('pos_row','pos_bay','pos_level','pos_depth','pos_bin') ;
		$str = '' ;
		foreach( $concat as $mkey ) {
			$str.= $form_data[$mkey] ;
		}
		if( $str != $form_data['adr_id'] ) {
			return array('success'=>false, 'formErrors'=>array('adr_id'=>'Structure incohérente')) ;
		}
	
		$treenode_key = $form_data['pos_row'] ;
		if( !paracrm_lib_data_getRecord_bibleTreenode('STOCK',$treenode_key) ) {
			return array('success'=>false, 'error'=>'Allée non définie') ;
		}
		
		$arr_ins['field_POS_BAY'] = $form_data['pos_bay'] ;
		$arr_ins['field_POS_LEVEL'] = $form_data['pos_level'] ;
		$arr_ins['field_POS_BIN'] = $form_data['pos_bin'] ;
		
		$arr_ins['field_ADR_ID'] = $form_data['adr_id'] ;
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
		if( $post_data['inv_id'] ) {
			$query = "SELECT field_ADR_ID FROM view_file_INV WHERE filerecord_id='{$post_data['inv_id']}'" ;
			if( $_opDB->query_uniqueValue($query) ==  $adr_id ) {
				paracrm_lib_data_deleteRecord_file('INV',$post_data['inv_id']) ;
			}
		}
	} else {
		$arr_ins = array() ;
		$arr_ins['field_ADR_ID'] = $adr_id ;
		$arr_ins['field_PROD_ID'] = $form_data['inv_prod'] ;
		$arr_ins['field_BATCH_CODE'] = $form_data['inv_batch'] ;
		$arr_ins['field_QTY_AVAIL'] = $form_data['inv_qty'] ;
		if( !$post_data['inv_id'] ) {
			paracrm_lib_data_insertRecord_file( 'INV' , 0 , $arr_ins ) ;
		} else {
			$query = "SELECT field_ADR_ID FROM view_file_INV WHERE filerecord_id='{$post_data['inv_id']}'" ;
			if( $_opDB->query_uniqueValue($query) ==  $adr_id ) {
				paracrm_lib_data_updateRecord_file( 'INV' , $arr_ins, $post_data['inv_id'] ) ;
			}
		}
	}
	
	return array('success'=>true) ;
}


?>