<?php
function specDbsEmbralam_queryspec($post_data) {
	switch( $post_data['queryspec_code'] ) {
		case 'atr_mismatch' :
			return array('success'=>true, 'data'=>specDbsEmbralam_queryspec_lib_atrMismatch()) ;
		case 'DLC_expire' :
			return array('success'=>true, 'data'=>specDbsEmbralam_queryspec_lib_dlcExpire()) ;
		default :
			sleep(2) ;
			return array('success'=>true, 'data'=>array()) ;
			return array('success'=>false) ;
	}
}
function specDbsEmbralam_queryspec_lib_atrMismatch() {
	global $_opDB ;
	
	$empty = TRUE ;
	$select_fields = $where_fields = $mismatch_fields = array() ;
	foreach( specDbsEmbralam_lib_stockAttributes_getStockAttributes() as $stockAttribute_obj ) {
		if( !$stockAttribute_obj['cfg_is_mismatch'] ) {
			continue ;
		}
		$empty = FALSE ;
		
		$select_fields[] = "
			substring(adr.{$stockAttribute_obj['STOCK_fieldcode']},3,length(adr.{$stockAttribute_obj['STOCK_fieldcode']})-4) as adr_{$stockAttribute_obj['bible_code']}
			,
			substring(prod.{$stockAttribute_obj['PROD_fieldcode']},3,length(prod.{$stockAttribute_obj['PROD_fieldcode']})-4) as prod_{$stockAttribute_obj['bible_code']}
		" ;
		$where_fields[] = "(adr_{$stockAttribute_obj['bible_code']}<>'' AND adr_{$stockAttribute_obj['bible_code']} <> prod_{$stockAttribute_obj['bible_code']})" ;
		
		$mismatch_fields[] = $stockAttribute_obj['bible_code'] ;
	}
	
	if( $empty ) {
		return array() ;
	}
	
	$query = "" ;
	$query.= "SELECT inv.*" ;
	if( $select_fields ) {
		$query.= "," ;
		$query.= implode(',',$select_fields) ;
	}
	$query.= " FROM view_file_INV inv" ;
	$query.= " LEFT JOIN view_bible_STOCK_entry adr ON adr.entry_key=inv.field_ADR_ID" ;
	$query.= " LEFT JOIN view_bible_PROD_entry prod ON prod.entry_key=inv.field_PROD_ID" ;
	if( $where_fields ) {
		$query.= " HAVING 0"." OR ".implode(' OR ',$where_fields) ;
	}
	
	$result = $_opDB->query($query) ;
	
	$data = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$row = array() ;
		$row['adr_id'] = $arr['field_ADR_ID'] ;
		$row['inv_prod'] = $arr['field_PROD_ID'] ;
		$row['inv_batch'] = $arr['field_BATCH_CODE'] ;
		$row['inv_qty'] = ( $arr['field_PROD_ID'] ? $arr['field_QTY_AVAIL'] : null ) ;
		
		foreach( $mismatch_fields as $mismatch_field ) {
			$mkey = 'atr_'.$mismatch_field ;
			$row[$mkey] = NULL ;
		
			$mkey_PROD = 'prod_'.$mismatch_field ;
			$mkey_STOCK = 'adr_'.$mismatch_field ;
			if( $arr[$mkey_PROD] != $arr[$mkey_STOCK] ) {
				$row[$mkey] = array(
					'prod' => $arr[$mkey_PROD],
					'stock' => $arr[$mkey_STOCK]
				);
			}
		}
		
		$data[] = $row ;
	}
	return $data ;
}
function specDbsEmbralam_queryspec_lib_dlcExpire() {
	global $_opDB ;

	$query = "" ;
	$query.= "SELECT inv.* FROM view_file_INV inv WHERE inv.field_SPEC_DATELC<>'0000-00-00 00:00:00'" ;
	
	$result = $_opDB->query($query) ;
	
	$data = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$row = array() ;
		$row['adr_id'] = $arr['field_ADR_ID'] ;
		$row['inv_prod'] = $arr['field_PROD_ID'] ;
		$row['inv_batch'] = $arr['field_BATCH_CODE'] ;
		$row['inv_qty'] = ( $arr['field_PROD_ID'] ? $arr['field_QTY_AVAIL'] : null ) ;
		$row['inv_datelc'] = date('Y-m-d',strtotime($arr['field_SPEC_DATELC'])) ;
		$data[] = $row ;
	}
	return $data ;

}

?>