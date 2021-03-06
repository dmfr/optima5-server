<?php

function specDbsEmbralam_lib_proc_lock_on() {
	global $_opDB ;
	$file_code = 'Z_LOCK' ;
	
	$ttmp = paracrm_data_getFileGrid_raw(array('file_code'=>$file_code),$auth_bypass=TRUE) ;
	if( $ttmp['total'] != 1 ) {
		foreach( $ttmp['data'] as $file_row ) {
			paracrm_lib_data_deleteRecord_file( $file_code, $file_row['filerecord_id'] ) ;
		}
		$lock_id = paracrm_lib_data_insertRecord_file( $file_code , 0 , array() ) ;
	} else {
		$lock_id = $ttmp['data'][0]['filerecord_id'] ;
	}
	
	$timestamp_old = time() - 60 ;
	$query = "UPDATE view_file_{$file_code} SET field_STATUS='0' WHERE filerecord_id='{$lock_id}' AND field_STATUS<='$timestamp_old'" ;
	$_opDB->query($query) ;
	
	$try = 50 ;
	while( $try > 0 ) {
		$timestamp = time() ;
		$query = "UPDATE view_file_{$file_code} SET field_STATUS='{$timestamp}' WHERE filerecord_id='{$lock_id}' AND field_STATUS='0'" ;
		$result = $_opDB->query($query) ;
		if( $_opDB->affected_rows($result) == 1 ) {
			return TRUE ;
		}
		
		usleep( 100 * 1000 ) ;
		$try-- ;
	}
	return FALSE ;
}
function specDbsEmbralam_lib_proc_lock_off() {
	global $_opDB ;
	$file_code = 'Z_LOCK' ;
	
	$ttmp = paracrm_data_getFileGrid_raw(array('file_code'=>$file_code),$auth_bypass=TRUE) ;
	if( $ttmp['total'] != 1 ) {
		return ;
	} else {
		$lock_id = $ttmp['data'][0]['filerecord_id'] ;
	}
	
	$query = "UPDATE view_file_{$file_code} SET field_STATUS='0' WHERE filerecord_id='{$lock_id}'" ;
	$_opDB->query($query) ;
}

function specDbsEmbralam_lib_proc_findAdr( $mvt_obj, $stockAttributes_obj, $excludeAdr_arr ) {
	global $_opDB ;
	
	$adr_id = NULL ;
	while(TRUE) {
		if( $mvt_obj ) {
			// 1er cas : emplacement existant
			$query = "SELECT * FROM view_file_INV WHERE
				field_PROD_ID='{$mvt_obj['prod_id']}' AND field_BATCH_CODE='{$mvt_obj['batch']}'" ;
			$result = $_opDB->query($query) ;
			if( $_opDB->num_rows($result) > 1 ) {
				$status = 'NOK_MULTI' ;
			} elseif( $_opDB->num_rows($result) == 1 ) {
				$status = 'OK_ADD' ;
				
				$arr = $_opDB->fetch_assoc($result) ;
				$adr_id = $arr['field_ADR_ID'] ;
				
				break ;
			}
		}
		
		// 2ème cas : position libre correspondant aux critères
		// 3ème cas : position libre sans les critères facultatifs
		for( $i=1 ; $i>=0 ; $i-- ) {
			$doCheckAttributes = ($i==1) ;
			
			$attributesToCheck = array() ;
			foreach( specDbsEmbralam_lib_stockAttributes_getStockAttributes() as $stockAttribute_obj ) {
				$mkey = $stockAttribute_obj['mkey'] ;
				$STOCK_fieldcode = $stockAttribute_obj['STOCK_fieldcode'] ;
				
				if( ($doCheckAttributes || !$stockAttribute_obj['cfg_is_optional']) && $stockAttributes_obj[$mkey] ) {
					$attributesToCheck[$STOCK_fieldcode] = $stockAttributes_obj[$mkey] ;
				}
			}
			
			$query = "SELECT stk.* FROM view_bible_STOCK_entry stk
						LEFT OUTER JOIN view_file_INV inv ON inv.field_ADR_ID = stk.entry_key
						WHERE inv.filerecord_id IS NULL" ;
			foreach( $attributesToCheck as $STOCK_fieldcode => $neededValue ) {
				$query.= " AND stk.{$STOCK_fieldcode}='".$_opDB->escape_string(json_encode(array($neededValue)))."'" ;
			}
			$query.= " ORDER BY stk.field_PRIO_IDX LIMIT 1" ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
				$status = 'OK_NEW' ;
				$adr_id = $arr['entry_key'] ;
				
				break 3 ;
			}
		}
		
		
	
		break ;
	}
	
	return array(
		'status' => $status,
		'adr_id' => $adr_id
	) ;
}

function specDbsEmbralam_lib_proc_loadMvt( $mvt_id ) {
	$record = paracrm_lib_data_getRecord_file('MVT',$mvt_id) ;
	if( !$record ) {
		return NULL ;
	}
	$mvt_obj = array(
		'prod_id' => $record['field_PROD_ID'],
		'batch' => $record['field_BATCH_CODE'],
		'mvt_qty' => (string)((float)$record['field_QTY'])
	);
	return $mvt_obj ;
}

function specDbsEmbralam_lib_proc_insertMvt( $mvt_obj, $adr_id ) {
	$mvt_obj['prod_id'] ;
	$mvt_obj['batch'] ;
	$mvt_obj['mvt_qty'] ;
	
	global $_opDB ;
	
	$query = "SELECT filerecord_id FROM view_file_INV 
		WHERE field_ADR_ID='{$adr_id}' AND field_PROD_ID='{$mvt_obj['prod_id']}' AND field_BATCH_CODE='{$mvt_obj['batch']}'" ;
	$filerecord_id = $_opDB->query_uniqueValue($query) ;
	
	if( !$filerecord_id ) {
		$arr_ins = array() ;
		$arr_ins['field_ADR_ID'] = $adr_id ;
		$arr_ins['field_PROD_ID'] = $mvt_obj['prod_id'] ;
		$arr_ins['field_BATCH_CODE'] = $mvt_obj['batch'] ;
		$arr_ins['field_LAM_DATEUPDATE'] = date('Y-m-d H:i:s') ;
		$filerecord_id = paracrm_lib_data_insertRecord_file( 'INV' , 0 , $arr_ins ) ;
	}
	$query = "UPDATE view_file_INV SET field_QTY_AVAIL = field_QTY_AVAIL + '{$mvt_obj['mvt_qty']}' WHERE filerecord_id='{$filerecord_id}'" ;
	$_opDB->query($query) ;
	
	
	$arr_ins = array() ;
	$arr_ins['field_DATE'] = date('Y-m-d H:i:s') ;
	$arr_ins['field_INV_ID'] = $filerecord_id ;
	$arr_ins['field_ADR_ID'] = $adr_id ;
	$arr_ins['field_PROD_ID'] = $mvt_obj['prod_id'] ;
	$arr_ins['field_BATCH_CODE'] = $mvt_obj['batch'] ;
	$arr_ins['field_QTY'] = $mvt_obj['mvt_qty'] ;
	$mvt_id = paracrm_lib_data_insertRecord_file( 'MVT' , 0 , $arr_ins ) ;
	
	return $mvt_id ;
}

function specDbsEmbralam_lib_proc_deleteMvt( $mvt_id ) {
	global $_opDB ;
	
	$record = paracrm_lib_data_getRecord_file('MVT',$mvt_id) ;
	if( !$record ) {
		return FALSE ;
	}
	$mvt_obj = array(
		'mvt_id' => $record['filerecord_id'],
		'prod_id' => $record['field_PROD_ID'],
		'batch' => $record['field_BATCH_CODE'],
		'mvt_qty' => $record['field_QTY']
	);
	$adr_id = $record['field_ADR_ID'] ;
	$inv_id = (int)$record['field_INV_ID'] ;
	
	paracrm_lib_data_deleteRecord_file( 'MVT', $mvt_id ) ;
	
	$query = "UPDATE view_file_INV SET field_QTY_AVAIL = field_QTY_AVAIL - '{$mvt_obj['mvt_qty']}' WHERE filerecord_id='{$inv_id}'" ;
	$_opDB->query($query) ;
	$query = "SELECT field_QTY_AVAIL FROM view_file_INV WHERE filerecord_id='{$inv_id}'" ;
	if( $_opDB->query_uniqueValue($query) == 0 ) {
		paracrm_lib_data_deleteRecord_file( 'INV', $inv_id ) ;
	}
	
	return TRUE ;
}

?>
