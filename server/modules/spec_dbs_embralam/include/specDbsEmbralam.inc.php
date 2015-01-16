<?php
include("$server_root/modules/spec_dbs_embralam/include/specDbsEmbralam_lib_stockAttributes.inc.php") ;
include("$server_root/modules/spec_dbs_embralam/include/specDbsEmbralam_lib_proc.inc.php") ;

include("$server_root/modules/spec_dbs_embralam/include/specDbsEmbralam_cfg.inc.php") ;
include("$server_root/modules/spec_dbs_embralam/include/specDbsEmbralam_live.inc.php") ;


function specDbsPeople_stock_getGrid($post_data) {
	global $_opDB ;
	
	$tab_DATA = array() ;
	
	$query = "SELECT * FROM view_bible_STOCK_entry stk
				LEFT OUTER JOIN view_file_INV inv ON inv.field_ADR_ID = stk.entry_key
				ORDER BY stk.entry_key LIMIT 10000" ;
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

function specDbsPeople_prods_getGrid($post_data) {
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
		$query.= " LIMIT 10000" ;
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


?>
