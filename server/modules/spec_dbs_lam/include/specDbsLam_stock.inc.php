<?php

function specDbsLam_stock_getGrid($post_data) {
	global $_opDB ;
	
	$ttmp = specDbsLam_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	
	$tab_DATA = array() ;
	
	// ******************** SQL selection ******************
	$selects = array() ;
	foreach( array('adr'=>'view_bible_ADR_entry','stock'=>'view_file_STOCK') as $prefix=>$table ) {
		$query = "SHOW COLUMNS FROM {$table}" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$field = $arr[0] ;
			$mkey = $prefix.'.'.$field ;
			
			$selects[] = $prefix.'.'.$field.' AS '.strtoupper($prefix).'_'.$field ;
		}
	}
	$selects = implode(',',$selects) ;
	
	$query = "SELECT {$selects} FROM view_bible_ADR_entry adr
				LEFT OUTER JOIN view_file_STOCK stock ON stock.field_ADR_ID = adr.entry_key
				WHERE 1" ;
	if( $post_data['filter_entryKey'] ) {
		$query.= " AND entry_key='{$post_data['filter_entryKey']}'" ;
	} elseif( $post_data['filter_treenodeKey'] 
			&& ($arr_treenodes = paracrm_data_getBibleTreeBranch( 'ADR', $post_data['filter_treenodeKey'] )) ) {
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
	// *************************************************************
	
	
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$row = array() ;
		
		if( $arr['STOCK_filerecord_id'] ) {
			$row['id'] = $arr['STOCK_filerecord_id'] ;
			$row['stk_filerecord_id'] = $arr['STOCK_filerecord_id'] ;
		} else {
			$row['id'] = $arr['ADR_entry_key'] ;
		}
		
		$row['ADR_entry_key'] = $arr['ADR_entry_key'] ;
		
		$ttmp = explode('_',$arr['ADR_entry_key'],2) ;
		if( $ttmp[1] ) {
			$row['adr_id'] = $ttmp[1] ;
		} else {
			$row['adr_id'] = '-' ;
		}
		
		$row['pos_zone'] = substr($arr['ADR_treenode_key'],0,1) ;
		$row['pos_row'] = $arr['ADR_treenode_key'] ;
		$row['pos_bay'] = $arr['ADR_field_POS_BAY'] ;
		$row['pos_level'] = $arr['ADR_field_POS_LEVEL'] ;
		$row['pos_bin'] = $arr['ADR_field_POS_BIN'] ;
		
		$status = TRUE ;
		foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
			if( !$stockAttribute_obj['ADR_fieldcode'] ) {
				continue ;
			}
			$mkey = 'ADR_'.$stockAttribute_obj['mkey'] ;
			$ADR_fieldcode = 'ADR_'.$stockAttribute_obj['ADR_fieldcode'] ;
			
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
			$mkey = 'STOCK_'.$stockAttribute_obj['mkey'] ;
			$STOCK_fieldcode = 'STOCK_'.$stockAttribute_obj['STOCK_fieldcode'] ;
			$row[$mkey] = $arr[$STOCK_fieldcode] ;
		}
		
		$row['inv_id'] = $arr['STOCK_filerecord_id'] ;
		$row['inv_prod'] = $arr['STOCK_field_PROD_ID'] ;
		$row['inv_batch'] = $arr['STOCK_field_SPEC_BATCH'] ;
		$row['inv_qty'] = ( $arr['STOCK_field_PROD_ID'] ? $arr['STOCK_field_QTY_AVAIL'] : null ) ;
		$row['inv_qty_out'] = ( $arr['STOCK_field_PROD_ID'] ? $arr['STOCK_field_QTY_OUT'] : null ) ;
		$row['inv_sn'] = $arr['STOCK_field_SPEC_SN'] ;
		
		$row['status'] = $status ;
		
		$tab_DATA[] = $row ;
	}
	return array('success'=>true, 'data'=>$tab_DATA) ;
}


?>
