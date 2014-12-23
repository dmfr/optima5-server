<?php
function specDbsPeople_stock_getGrid($post_data) {
	global $_opDB ;
	
	$tab_DATA = array() ;
	
	$query = "SELECT * FROM view_bible_STOCK_entry stk
				LEFT OUTER JOIN view_file_INV inv ON inv.field_ADR_ID = stk.entry_key
				ORDER BY stk.entry_key LIMIT 50000" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$row = array() ;
		
		$row['adr_id'] = $arr['entry_key'] ;
		
		$row['pos_zone'] = substr($arr['treenode_key'],0,1) ;
		$row['pos_row'] = $arr['treenode_key'] ;
		$row['pos_bay'] = $arr['field_POS_BAY'] ;
		$row['pos_level'] = $arr['field_POS_LEVEL'] ;
		$row['pos_bin'] = $arr['field_POS_BIN'] ;
		
		$row['atr_type'] = reset(json_decode($arr['field_ATR_TYPE'])) ;
		$row['atr_classe'] = reset(json_decode($arr['field_ATR_CLASSE'])) ;
		$row['atr_bu'] = reset(json_decode($arr['field_ATR_BU'])) ;
		
		$row['inv_prod'] = $arr['field_PROD_ID'] ;
		$row['inv_batch'] = $arr['field_BATCH_CODE'] ;
		$row['inv_qty'] = ( $arr['field_PROD_ID'] ? $arr['field_QTY_AVAIL'] : null ) ;
		
		$row['status'] = ( $row['atr_type'] ? true : false ) ;
		
		$tab_DATA[] = $row ;
	}
	return array('success'=>true, 'data'=>$tab_DATA) ;
}

function specDbsPeople_prods_getGrid($post_data) {
	global $_opDB ;
	
	$tab_DATA = array() ;
	
	$query = "SELECT * FROM view_bible_PROD_entry prod
				ORDER BY prod.entry_key LIMIT 50000" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$row = array() ;
		
		$row['prod_id'] = $arr['entry_key'] ;
		$row['prod_txt'] = $arr['field_PROD_TXT'] ;
		$row['atr_type'] = ($arr['field_ATR_TYPE'] ? reset(json_decode($arr['field_ATR_TYPE'])) : '' ) ;
		$row['atr_classe'] = reset(json_decode($arr['field_ATR_CLASSE'])) ;
		$row['atr_bu'] = reset(json_decode($arr['field_ATR_BU'])) ;
		
		$tab_DATA[] = $row ;
	}
	return array('success'=>true, 'data'=>$tab_DATA) ;
}


?>