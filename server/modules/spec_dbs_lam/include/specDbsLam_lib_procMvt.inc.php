<?php

function specDbsLam_lib_procMvt_createNewStk($stkData_obj) {
	global $_opDB ;
	
	// Load cfg attributes
	$ttmp = specDbsLam_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	
	
	if( !paracrm_lib_data_getRecord_bibleEntry( 'PROD', $stkData_obj['stk_prod'] ) ) {
		return FALSE ;
	}
	$json = specDbsLam_prods_getGrid( array('entry_key'=>$stkData_obj['stk_prod']) ) ;
	$row_prod = $json['data'][0] ;
	$stkData_obj['soc_code'] = $row_prod['prod_soc'] ;
	
	if( !paracrm_lib_data_getRecord_bibleEntry( 'ADR', 'TMP_RECEP' ) ) {
		paracrm_lib_data_insertRecord_bibleEntry('ADR','TMP_RECEP','TMP',array('field_ADR_ID'=>'TMP_RECEP')) ;
	}
	$arr_ins = array() ;
	$arr_ins['field_ADR_ID'] = 'TMP_RECEP' ;
	$arr_ins['field_SOC_CODE'] = $stkData_obj['soc_code'] ;
	if( !$stkData_obj['container_is_off'] ) {
		$arr_ins['field_CONTAINER_TYPE'] = $stkData_obj['container_type'] ;
		if( !$stkData_obj['container_ref'] ) {
			$stkData_obj['container_ref'] = specDbsLam_spec_get_CONTAINER_REF($stkData_obj['soc_code']) ;
		}
		$arr_ins['field_CONTAINER_REF'] = $stkData_obj['container_ref'] ;
	}
	if( $stkData_obj['inputstack_ref'] && ($stkData_obj['inputstack_level']>0) ) {
		$arr_ins['field_INPUTSTACK_REF'] = $stkData_obj['inputstack_ref'] ;
		$arr_ins['field_INPUTSTACK_LEVEL'] = $stkData_obj['inputstack_level'] ;
	}
	$arr_ins['field_PROD_ID'] = $stkData_obj['stk_prod'] ;
	$arr_ins['field_SPEC_BATCH'] = $stkData_obj['stk_batch'] ;
	$arr_ins['field_SPEC_DATELC'] = $stkData_obj['stk_datelc'] ;
	$arr_ins['field_SPEC_SN'] = $stkData_obj['stk_sn'] ;
	$arr_ins['field_QTY_AVAIL'] = $stkData_obj['mvt_qty'] ;
	foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
		if( !$stockAttribute_obj['STOCK_fieldcode'] ) {
			continue ;
		}
		$arr_ins[$stockAttribute_obj['STOCK_fieldcode']] = $stkData_obj[$stockAttribute_obj['mkey']] ;
	}
	$arr_ins['field_LAM_DATEUPDATE'] = date('Y-m-d H:i:s') ;
	$stk_filerecord_id = paracrm_lib_data_insertRecord_file('STOCK',0,$arr_ins) ;
	return $stk_filerecord_id ;
}

function specDbsLam_lib_procMvt_addStock($src_whse, $dst_whse, $stock_filerecordId, $qte_mvt=NULL, $append_dstStkFilerecordId=NULL) {
	global $_opDB ;
	
	// Load cfg attributes
	$ttmp = specDbsLam_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	
	// TODO: LOCK !
	
	// controle cohérence QTY_AVAIL > 0
	// creation lig Mvt
	// bascule Stock
	$query = "SELECT * FROM view_file_STOCK WHERE
		filerecord_id='{$stock_filerecordId}'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return 0 ;
	}
	$row_stock = $_opDB->fetch_assoc($result) ;
	$qte_stock = ( (float)$row_stock['field_QTY_AVAIL'] + (float)$row_stock['field_QTY_PREIN'] ) ;
	if( $qte_mvt > 0 ) {
		if( $qte_mvt > $qte_stock ) {
			return 0 ;
		}
		$qte_mvt_actual = $qte_mvt ;
	} else {
		if( $qte_stock <= 0 ) {
			return 0 ;
		}
		$qte_mvt_actual = $qte_stock ;
	}
	
	$row_mvt = array(
		'field_SOC_CODE' => $row_stock['field_SOC_CODE'],
		'field_INPUTSTACK_REF' => $row_stock['field_INPUTSTACK_REF'],
		'field_INPUTSTACK_LEVEL' => $row_stock['field_INPUTSTACK_LEVEL'],
		'field_CONTAINER_TYPE' => ($qte_mvt ? NULL : $row_stock['field_CONTAINER_TYPE']),
		'field_CONTAINER_REF' => ($qte_mvt ? NULL : $row_stock['field_CONTAINER_REF']),
		'field_CONTAINER_DISPLAY' => $row_stock['field_CONTAINER_REF'],
		'field_PROD_ID' => $row_stock['field_PROD_ID'],
		'field_QTY_MVT' => $qte_mvt_actual,
		'field_SPEC_BATCH' => $row_stock['field_SPEC_BATCH'],
		'field_SPEC_DATELC' => $row_stock['field_SPEC_DATELC'],
		'field_SPEC_SN' => $row_stock['field_SPEC_SN'],
		'field_SRC_FILE_STOCK_ID' => $stock_filerecordId,
		'field_SRC_WHSE' => $src_whse,
		'field_SRC_ADR_ID' => $row_stock['field_ADR_ID']
	);
	foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
		if( !$stockAttribute_obj['STOCK_fieldcode'] ) {
			continue ;
		}
		$mkey = $stockAttribute_obj['mkey'] ;
		$STOCK_fieldcode = $stockAttribute_obj['STOCK_fieldcode'] ;
		
		$row_mvt[$STOCK_fieldcode] = $row_stock[$STOCK_fieldcode] ;
	}
	$mvt_filerecordId = paracrm_lib_data_insertRecord_file('MVT',0,$row_mvt) ;
	
	/*
	$row_mvt_step = array(
		'field_STEP_CODE' => $step_code,
		'field_FILE_STOCK_ID' => $stock_filerecordId,
		'field_SRC_ADR_ID' => $row_stock['field_ADR_ID'],
		'field_SRC_ADR_DISPLAY' => $row_stock['field_ADR_ID'],
		'field_DATE_START' => date('Y-m-d H:i:s')
	) ;
	paracrm_lib_data_insertRecord_file('MVT_STEP',$mvt_filerecordId,$row_mvt_step) ;
	*/
	
	$query = "UPDATE view_file_STOCK 
			SET field_QTY_AVAIL = field_QTY_AVAIL - '{$qte_mvt_actual}', field_QTY_OUT = field_QTY_OUT + '{$qte_mvt_actual}'
			WHERE filerecord_id='{$stock_filerecordId}'" ;
	$_opDB->query($query) ;
	
	if( !$append_dstStkFilerecordId ) {
		$row_stockDst = array(
			'field_WHSE' => $dst_whse,
			'field_ADR_ID' => '',
			'field_SOC_CODE' => $row_stock['field_SOC_CODE'],
			'field_INPUTSTACK_REF' => $row_stock['field_INPUTSTACK_REF'],
			'field_INPUTSTACK_LEVEL' => $row_stock['field_INPUTSTACK_LEVEL'],
			'field_CONTAINER_TYPE' => ($qte_mvt ? NULL : $row_stock['field_CONTAINER_TYPE']),
			'field_CONTAINER_REF' => ($qte_mvt ? NULL : $row_stock['field_CONTAINER_REF']),
			'field_PROD_ID' => $row_stock['field_PROD_ID'],
			'field_QTY_PREIN' => $qte_mvt_actual,
			'field_SPEC_BATCH' => $row_stock['field_SPEC_BATCH'],
			'field_SPEC_DATELC' => $row_stock['field_SPEC_DATELC'],
			'field_SPEC_SN' => $row_stock['field_SPEC_SN'],
			'field_LAM_DATEUPDATE' => $row_stock['field_LAM_DATEUPDATE']
		) ;
		foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
			if( !$stockAttribute_obj['STOCK_fieldcode'] ) {
				continue ;
			}
			$mkey = $stockAttribute_obj['mkey'] ;
			$STOCK_fieldcode = $stockAttribute_obj['STOCK_fieldcode'] ;
			
			$row_stockDst[$STOCK_fieldcode] = $row_stock[$STOCK_fieldcode] ;
		}
		$dstStock_filerecordId = paracrm_lib_data_insertRecord_file('STOCK',0,$row_stockDst) ;
	} else {
		$query = "SELECT * FROM view_file_STOCK WHERE filerecord_id='{$append_dstStkFilerecordId}'" ;
		$result = $_opDB->query($query) ;
		$row_stockDst = $_opDB->fetch_assoc($result) ;
		
		//TODO : controles ??
		if( !$row_stockDst ) {
			return NULL ;
		}
		
		$dstStock_filerecordId = $row_stockDst['filerecord_id'] ;
		$append_dstAdrId = $row_stockDst['field_ADR_ID'] ;
		$query = "UPDATE view_file_STOCK SET field_QTY_PREIN = field_QTY_PREIN + '{$qte_mvt_actual}' WHERE filerecord_id='{$dstStock_filerecordId}'" ;
		$_opDB->query($query) ;
	}
	
	$row_mvt = array(
		'field_DST_FILE_STOCK_ID' => $dstStock_filerecordId,
		'field_DST_WHSE' => $dst_whse,
		'field_DST_ADR_ID' => ($append_dstStkFilerecordId ? $append_dstAdrId : '')
	);
	paracrm_lib_data_updateRecord_file('MVT',$row_mvt,$mvt_filerecordId) ;
	
	return $mvt_filerecordId ;
}
function specDbsLam_lib_procMvt_delMvt($mvt_filerecordId) {
	global $_opDB ;
	
	$query = "SELECT * FROM view_file_MVT WHERE
		filerecord_id='{$mvt_filerecordId}' AND field_COMMIT_IS_OK='0'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return FALSE ;
	}
	$row_mvt = $_opDB->fetch_assoc($result) ;
	$qte_mvt = (float)$row_mvt['field_QTY_MVT'] ;
	$mvt_isContainer = ($row_mvt['field_CONTAINER_TYPE']&&$row_mvt['field_CONTAINER_REF']) ;
	$stockSrc_filerecordId = $row_mvt['field_SRC_FILE_STOCK_ID'] ;
	$stockDst_filerecordId = $row_mvt['field_DST_FILE_STOCK_ID'] ;

	$query = "SELECT * FROM view_file_STOCK WHERE filerecord_id='{$stockSrc_filerecordId}'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return FALSE ;
	}
	$query = "SELECT * FROM view_file_STOCK WHERE filerecord_id='{$stockDst_filerecordId}'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return FALSE ;
	}
	$row_stkDst = $_opDB->fetch_assoc($result) ;
	
	// CHECK qte suffisante ?
	// - cas container
	// - cas qte libre
	$qtePreinStk = ( $row_stkDst['field_QTY_AVAIL'] + $row_stkDst['field_QTY_PREIN'] ) ;
	$validForDelete = ( $mvt_isContainer ? $qtePreinStk==$qte_mvt : $qtePreinStk >= $qte_mvt ) ;
	if( !$validForDelete ) {
		return FALSE ;
	}
	
	
	$query = "UPDATE view_file_STOCK 
			SET field_QTY_AVAIL = field_QTY_AVAIL + '{$qte_mvt}', field_QTY_OUT = field_QTY_OUT - '{$qte_mvt}'
			WHERE filerecord_id='{$stockSrc_filerecordId}'" ;
	$_opDB->query($query) ;
	
	$query = "UPDATE view_file_STOCK 
			SET field_QTY_PREIN = field_QTY_PREIN - '{$qte_mvt}'
			WHERE filerecord_id='{$stockDst_filerecordId}'" ;
	$_opDB->query($query) ;
	$query = "DELETE FROM view_file_STOCK
			WHERE filerecord_id='{$stockDst_filerecordId}'
			AND field_QTY_PREIN='0' AND field_QTY_OUT='0' AND field_QTY_AVAIL='0'" ;
	$_opDB->query($query) ;
	
	paracrm_lib_data_deleteRecord_file( 'MVT' , $mvt_filerecordId ) ;
	
	return TRUE ;
}


function specDbsLam_lib_procMvt_setDstAdr($mvt_filerecordId, $adr_dest, $whse_work=NULL) {
	global $_opDB ;
	
	if( is_array($mvt_filerecordId) ) {
		$mvts_filerecordIds = $mvt_filerecordId ;
		foreach($mvts_filerecordIds as $mvt_filerecordId) {
			specDbsLam_lib_procMvt_setDstAdr($mvt_filerecordId, $adr_dest, $whse_work) ;
		}
		return ;
	}
	
	// verifs mvt non commit
	$query = "SELECT * FROM view_file_MVT
		WHERE filerecord_id='{$mvt_filerecordId}' AND field_COMMIT_IS_OK='0'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return FALSE ;
	}
	$row_mvt = $_opDB->fetch_assoc($result) ;
	$stockSrc_filerecordId = $row_mvt['field_SRC_FILE_STOCK_ID'] ;
	$stockDst_filerecordId = $row_mvt['field_DST_FILE_STOCK_ID'] ;
	
	$query = "SELECT * FROM view_file_STOCK WHERE filerecord_id='{$stockDst_filerecordId}' AND field_QTY_AVAIL+field_QTY_OUT='0'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return FALSE ;
	}
	
	if( $whse_work ) {
		$arr_ins = array() ;
		$arr_ins['field_ADR_ID'] = $adr_dest ;
		paracrm_lib_data_insertRecord_bibleEntry( 'ADR' , $adr_dest, $whse_work, $arr_ins ) ;
	}
	
	// Go ?
	$arr_update = array() ;
	$arr_update['field_DST_ADR_ID'] = $adr_dest ;
	//$_opDB->update('view_file_MVT',$arr_update, array('filerecord_id'=>$mvt_filerecordId)) ;
	
	
	$arr_update = array() ;
	$arr_update['field_ADR_ID'] = $adr_dest ;
	$_opDB->update('view_file_STOCK',$arr_update, array('filerecord_id'=>$stockDst_filerecordId)) ;
	
	
	$query = "UPDATE view_file_MVT SET field_DST_ADR_ID='{$adr_dest}' WHERE field_DST_FILE_STOCK_ID='{$stockDst_filerecordId}' AND field_COMMIT_IS_OK<>'1'" ;
	$_opDB->query($query) ;
	// sync dest adr to next mvts ?
	$query = "UPDATE view_file_MVT SET field_SRC_ADR_ID='{$adr_dest}' WHERE field_SRC_FILE_STOCK_ID='{$stockDst_filerecordId}' AND field_COMMIT_IS_OK<>'1'" ;
	$_opDB->query($query) ;
	
	return TRUE ;
}
function specDbsLam_lib_procMvt_commit($mvt_filerecordId) {
	global $_opDB ;
	
	if( is_array($mvt_filerecordId) ) {
		$done = false ;
		if( count($mvt_filerecordId) > 0 ) {
			$done = true ;
		}
		$mvts_filerecordIds = $mvt_filerecordId ;
		foreach($mvts_filerecordIds as $mvt_filerecordId) {
			$ret = specDbsLam_lib_procMvt_commit($mvt_filerecordId) ;
			if( !$ret ) {
				$done = false ;
			}
		}
		return $done ;
	}
	
	// verifs mvt non commit
	$query = "SELECT * FROM view_file_MVT
		WHERE filerecord_id='{$mvt_filerecordId}' AND field_COMMIT_IS_OK='0'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return FALSE ;
	}
	$row_mvt = $_opDB->fetch_assoc($result) ;
	$qte_mvt = (float)$row_mvt['field_QTY_MVT'] ;
	$stockSrc_filerecordId = $row_mvt['field_SRC_FILE_STOCK_ID'] ;
	$stockDst_filerecordId = $row_mvt['field_DST_FILE_STOCK_ID'] ;
	
	$query = "SELECT filerecord_id FROM view_file_STOCK
		WHERE filerecord_id IN ('{$stockSrc_filerecordId}','{$stockDst_filerecordId}')" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 2 ) {
		return FALSE ;
	}
	
	$query = "SELECT field_QTY_AVAIL+field_QTY_OUT
					FROM view_file_STOCK
					WHERE filerecord_id='{$stockSrc_filerecordId}'" ;
	$qty_phys = (float)$_opDB->query_uniqueValue($query) ;
	if( $qty_phys<$qte_mvt ) {
		return FALSE ;
	}
	
	$query = "UPDATE view_file_MVT mvt
					JOIN view_file_STOCK src ON src.filerecord_id=mvt.field_SRC_FILE_STOCK_ID
					JOIN view_file_STOCK dst ON dst.filerecord_id=mvt.field_DST_FILE_STOCK_ID
				SET src.field_QTY_OUT=src.field_QTY_OUT-mvt.field_QTY_MVT
				, dst.field_QTY_AVAIL=dst.field_QTY_AVAIL+mvt.field_QTY_MVT
				, dst.field_QTY_PREIN=dst.field_QTY_PREIN-mvt.field_QTY_MVT
				WHERE mvt.filerecord_id='{$mvt_filerecordId}'" ;
	$_opDB->query($query) ;
	
	$arr_update = array() ;
	$arr_update['field_COMMIT_IS_OK'] = 1 ;
	$arr_update['field_COMMIT_DATE'] = date('Y-m-d H:i:s') ;
	paracrm_lib_data_updateRecord_file('MVT',$arr_update,$mvt_filerecordId) ;
	
	
	$query = "SELECT filerecord_id FROM view_file_STOCK
			WHERE filerecord_id='{$stockSrc_filerecordId}'
			AND field_QTY_PREIN='0' AND field_QTY_OUT='0' AND field_QTY_AVAIL='0'" ;
	if( $_opDB->query_uniqueValue($query)==$stockSrc_filerecordId ) {
		$do_delete = TRUE ;
	
		// verif picking statique ?
		$query = "SELECT filerecord_id, prod.entry_key, adr.entry_key, prod.field_PICK_ADR_ID FROM view_file_STOCK stk
					INNER JOIN view_bible_ADR_entry adr ON adr.entry_key=stk.field_ADR_ID
					INNER JOIN view_bible_PROD_entry prod ON prod.entry_key=stk.field_PROD_ID
					WHERE stk.filerecord_id='{$stockSrc_filerecordId}' 
						AND prod.field_PICK_IS_STATIC='1' 
						AND adr.field_CONT_IS_PICKING='1' AND adr.field_CONT_IS_ON='1'" ;
		$result = $_opDB->query($query) ;
		if( $_opDB->num_rows($result) > 0 ) {
			$arr = $_opDB->fetch_row($result) ;
			$prodIdStatic = $arr[1] ;
			$adrIdStatic = $arr[2] ;
			$prodAdrStatic = $arr[3] ;
			if( $prodAdrStatic && $adrIdStatic && ($prodAdrStatic==$adrIdStatic) ) {
				$do_delete = FALSE ;
			}
			if( $prodIdStatic && $adrIdStatic ) {
				// TODO 18/12 : no delete en attendant le test complet du field_PICK_ADR_ID
				$do_delete = FALSE ;
				
				// HACK ! Delete des pickings plus anciens : meme adr / meme ref / qtes = 0 
				$query = "SELECT filerecord_id FROM view_file_STOCK stk
							INNER JOIN view_bible_ADR_entry adr ON adr.entry_key=stk.field_ADR_ID
							INNER JOIN view_bible_PROD_entry prod ON prod.entry_key=stk.field_PROD_ID
							WHERE stk.filerecord_id<>'{$stockSrc_filerecordId}'
								AND prod.entry_key='{$prodIdStatic}'
								AND adr.entry_key='{$adrIdStatic}'
								AND field_QTY_PREIN='0' AND field_QTY_OUT='0' AND field_QTY_AVAIL='0'" ;
				$result = $_opDB->query($query) ;
				while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
					$stockOtherPicking_filerecordId = $arr[0] ;
					paracrm_lib_data_deleteRecord_file( 'STOCK' , $stockOtherPicking_filerecordId ) ;
				}
			}
		}
	
		if( $do_delete ) {
			paracrm_lib_data_deleteRecord_file( 'STOCK' , $stockSrc_filerecordId ) ;
		}
	}
	
	return TRUE ;
}
function specDbsLam_lib_procMvt_commitUndo($mvt_filerecordId) {
	global $_opDB ;
	
	// verifs mvt non commit
	$query = "SELECT * FROM view_file_MVT
		WHERE filerecord_id='{$mvt_filerecordId}' AND field_COMMIT_IS_OK='1'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		throw new Exception('Mvt error');
	}
	
	// verifs mvt non commit
	$query_test = "SELECT * FROM view_file_MVT_TAG
		WHERE filerecord_parent_id='{$mvt_filerecordId}'" ;
	if( $_opDB->query_uniqueValue($query_test) > 0 ) {
		throw new Exception('Mvt tag(s) already sent');
	}
	
	$row_mvt = $_opDB->fetch_assoc($result) ;
	$qte_mvt = (float)$row_mvt['field_QTY_MVT'] ;
	$stockSrc_filerecordId = $row_mvt['field_SRC_FILE_STOCK_ID'] ;
	$stockDst_filerecordId = $row_mvt['field_DST_FILE_STOCK_ID'] ;
	
	
	// mvt container ou qté ?
	// if qté => check dest has QTY_AVAIL >= QTY_MVT
	// if container => check dest has QTY_AVAIL = QTY_MVT && QTY_PREIN=QTY_OUT=0
	// 
	$query = "SELECT * FROM view_file_STOCK WHERE filerecord_id='{$stockDst_filerecordId}'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		throw new Exception('Target stock entry missing');
	}
	$row_stkDst = $_opDB->fetch_assoc($result) ;
	
	$mvt_isContainer = ($row_mvt['field_CONTAINER_TYPE']&&$row_mvt['field_CONTAINER_REF']) ;
	$test_stkAvailableRollback = FALSE ;
	if( $mvt_isContainer ) {
		$pass = TRUE ;
		if( $row_mvt['field_QTY_MVT'] != $row_stkDst['field_QTY_AVAIL'] ) {
			$pass = FALSE ;
		}
		if( !(($row_stkDst['field_QTY_PREIN']+$row_stkDst['field_QTY_OUT'])==0) ) {
			$pass = FALSE ;
		}
		$test_stkAvailableRollback = $pass ;
	}
	if( !$mvt_isContainer ) {
		$test_stkAvailableRollback = ( $row_stkDst['field_QTY_AVAIL'] >= $row_mvt['field_QTY_MVT'] ) ; 
	}
	
	if( !$test_stkAvailableRollback ) {
		throw new Exception('Target stock entry altered/reserved');
	}
	
	
	// restauration du stock orig ?
	if( paracrm_lib_data_recoverRecord_file('STOCK',$stockSrc_filerecordId) != 0 ) {
		throw new Exception('Cannot recover source stock entry');
	}
	
	
	$query = "SELECT filerecord_id FROM view_file_STOCK
		WHERE filerecord_id IN ('{$stockSrc_filerecordId}','{$stockDst_filerecordId}')" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 2 ) {
		throw new Exception('Stk error');
	}
	
	$query = "UPDATE view_file_MVT mvt
					JOIN view_file_STOCK src ON src.filerecord_id=mvt.field_SRC_FILE_STOCK_ID
					JOIN view_file_STOCK dst ON dst.filerecord_id=mvt.field_DST_FILE_STOCK_ID
				SET src.field_QTY_OUT=src.field_QTY_OUT+mvt.field_QTY_MVT
				, dst.field_QTY_AVAIL=dst.field_QTY_AVAIL-mvt.field_QTY_MVT
				, dst.field_QTY_PREIN=dst.field_QTY_PREIN+mvt.field_QTY_MVT
				WHERE mvt.filerecord_id='{$mvt_filerecordId}'" ;
	$_opDB->query($query) ;
	
	$arr_update = array() ;
	$arr_update['field_COMMIT_IS_OK'] = 0 ;
	$arr_update['field_COMMIT_DATE'] = date('Y-m-d H:i:s') ;
	paracrm_lib_data_updateRecord_file('MVT',$arr_update,$mvt_filerecordId) ;
	
	
	return TRUE ;
}
function specDbsLam_lib_procMvt_out($stockDst_filerecordId,$stockOut_qty) {
	global $_opDB ;
	
	$query = "SELECT filerecord_id FROM view_file_STOCK
		WHERE filerecord_id IN ('{$stockDst_filerecordId}')" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return FALSE ;
	}
	
	$query = "SELECT field_QTY_AVAIL
					FROM view_file_STOCK
					WHERE filerecord_id='{$stockDst_filerecordId}'" ;
	$qty_phys = (float)$_opDB->query_uniqueValue($query) ;
	if( $qty_phys<$qte_mvt ) {
		return FALSE ;
	}
	
	$query = "UPDATE view_file_STOCK dst
				SET dst.field_QTY_AVAIL=dst.field_QTY_AVAIL-'{$stockOut_qty}'
				WHERE dst.filerecord_id='{$stockDst_filerecordId}'" ;
	$_opDB->query($query) ;
	
	$query = "SELECT filerecord_id FROM view_file_STOCK
			WHERE filerecord_id='{$stockDst_filerecordId}'
			AND field_QTY_PREIN='0' AND field_QTY_OUT='0' AND field_QTY_AVAIL='0'" ;
	if( $_opDB->query_uniqueValue($query)==$stockDst_filerecordId ) {
		paracrm_lib_data_deleteRecord_file( 'STOCK' , $stockDst_filerecordId ) ;
	}
	
	return TRUE ;
}



function specDbsLam_lib_procMvt_rawChange($stock_filerecordId, $adjust_stk_obj, $adjust_txt) {
	global $_opDB ;
	
	// Load cfg attributes
	$ttmp = specDbsLam_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	
	// TODO: fetch whseCode !
	$map_adrTreenodeKey_whseCode = array() ;
	foreach( $json_cfg['cfg_whse'] as $whse_row ) {
		$whse_code = $whse_row['whse_code'] ;
		foreach( paracrm_data_getBibleTreeBranch( 'ADR', $whse_code ) as $adrTreenodeKey ) {
			$map_adrTreenodeKey_whseCode[$adrTreenodeKey] = $whse_code ;
		}
	}
	
	
	$query = "SELECT * FROM view_file_STOCK WHERE
		filerecord_id='{$stock_filerecordId}'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return 0 ;
	}
	$row_stock = $_opDB->fetch_assoc($result) ;
	
	$query = "SELECT treenode_key FROM view_bible_ADR_entry
				WHERE entry_key='{$row_stock['field_ADR_ID']}'" ;
	$adr_treenodeKey = $_opDB->query_uniqueValue($query) ;
	$whse_code = $map_adrTreenodeKey_whseCode[$adr_treenodeKey] ;
	if( !$whse_code ) {
		return NULL ;
	}
	
	$row_mvt_base = array(
		'field_SOC_CODE' => $row_stock['field_SOC_CODE'],
		'field_INPUTSTACK_REF' => $row_stock['field_INPUTSTACK_REF'],
		'field_INPUTSTACK_LEVEL' => $row_stock['field_INPUTSTACK_LEVEL'],
		'field_CONTAINER_TYPE' => ($qte_mvt ? NULL : $row_stock['field_CONTAINER_TYPE']),
		'field_CONTAINER_REF' => ($qte_mvt ? NULL : $row_stock['field_CONTAINER_REF']),
		'field_CONTAINER_DISPLAY' => $row_stock['field_CONTAINER_REF'],
		'field_PROD_ID' => $row_stock['field_PROD_ID'],
		'field_QTY_MVT_abs' => $row_stock['field_QTY_AVAIL'],
		'field_SPEC_BATCH' => $row_stock['field_SPEC_BATCH'],
		'field_SPEC_DATELC' => $row_stock['field_SPEC_DATELC'],
		'field_SPEC_SN' => $row_stock['field_SPEC_SN'],
		'field_MVTDIRECT_TXT' => $adjust_txt
	);
	foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
		if( !$stockAttribute_obj['STOCK_fieldcode'] ) {
			continue ;
		}
		$mkey = $stockAttribute_obj['mkey'] ;
		$STOCK_fieldcode = $stockAttribute_obj['STOCK_fieldcode'] ;
		
		$row_mvt_base[$STOCK_fieldcode] = $row_stock[$STOCK_fieldcode] ;
	}
	$row_mvt_base += array(
		'field_COMMIT_IS_OK' => 1,
		'field_COMMIT_DATE' => date('Y-m-d H:i:s')
	);
	
	
	$map_objToDb = array(
		'inv_soc' => 'field_SOC_CODE',
		'inv_prod' => 'field_PROD_ID',
		'inv_batch' => 'field_SPEC_BATCH',
		'inv_datelc' => 'field_SPEC_DATELC',
		'inv_sn' => 'field_SPEC_SN',
		'inv_container_type' => 'field_CONTAINER_TYPE',
		'inv_container_ref' => 'field_CONTAINER_REF'
	);
	foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
		if( !$stockAttribute_obj['STOCK_fieldcode'] ) {
			continue ;
		}
		$mkey = $stockAttribute_obj['mkey'] ;
		$STOCK_fieldcode = $stockAttribute_obj['STOCK_fieldcode'] ;
		
		$map_objToDb[$mkey] = $STOCK_fieldcode ;
	}
	
	
	if( ($row_stock['field_QTY_PREIN'] > 0) || ($row_stock['field_QTY_OUT'] > 0) ) {
		return NULL ;
	}
	
	
	$arr_update = array() ;
	foreach( $adjust_stk_obj as $obj_mkey => $values ) {
		$db_field = $map_objToDb[$obj_mkey] ;
		if( !$db_field ) {
			continue ;
		}
		if( $row_stock[$db_field] != $values['old_value'] ) {
			continue ;
		}
		$arr_update[$db_field] = $values['new_value'] ;
	}
	if( count($arr_update) != count($adjust_stk_obj) ) {
		return NULL ;
	}
	
	
	
	$mvt_filerecordIds = array() ;
	
	//register mvt ORIG
	$row_mvt = $row_mvt_base ;
	$row_mvt += array(
		'field_QTY_MVT' => $row_mvt_base['field_QTY_MVT_abs'],
		'field_SRC_FILE_STOCK_ID' => $stock_filerecordId,
		'field_SRC_WHSE' => $whse_code,
		'field_SRC_ADR_ID' => $row_stock['field_ADR_ID']
	);
	$mvt_filerecordIds[] = paracrm_lib_data_insertRecord_file('MVT',0,$row_mvt) ;
	
	// update
	paracrm_lib_data_updateRecord_file('STOCK',$arr_update,$stock_filerecordId) ;
	foreach( $arr_update as $mkey => $mvalue ) {
		$row_mvt_base[$mkey] = $mvalue ;
	}
	
	//register mvt NEW
	$row_mvt = $row_mvt_base ;
	$row_mvt += array(
		'field_QTY_MVT' => $row_mvt_base['field_QTY_MVT_abs'],
		'field_DST_FILE_STOCK_ID' => $stock_filerecordId,
		'field_DST_WHSE' => $whse_code,
		'field_DST_ADR_ID' => $row_stock['field_ADR_ID']
	);
	$mvt_filerecordIds[] = paracrm_lib_data_insertRecord_file('MVT',0,$row_mvt) ;
	
	$row_stock = paracrm_lib_data_getRecord_file('STOCK',$stock_filerecordId) ;
	if( !$row_stock['field_PROD_ID']
	&& ($row_stock['field_QTY_PREIN']==0 && $row_stock['field_QTY_AVAIL']==0 && $row_stock['field_QTY_OUT']==0 ) ) {
		
		paracrm_lib_data_deleteRecord_file('STOCK',$stock_filerecordId) ;
	}
	
	return $mvt_filerecordIds ;
}

function specDbsLam_lib_procMvt_rawMvt($stock_filerecordId, $adjust_qty, $adjust_txt) {
	global $_opDB ;
	
	// Load cfg attributes
	$ttmp = specDbsLam_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	
	// TODO: fetch whseCode !
	$map_adrTreenodeKey_whseCode = array() ;
	foreach( $json_cfg['cfg_whse'] as $whse_row ) {
		$whse_code = $whse_row['whse_code'] ;
		foreach( paracrm_data_getBibleTreeBranch( 'ADR', $whse_code ) as $adrTreenodeKey ) {
			$map_adrTreenodeKey_whseCode[$adrTreenodeKey] = $whse_code ;
		}
	}
	
	
	$query = "SELECT * FROM view_file_STOCK WHERE
		filerecord_id='{$stock_filerecordId}'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return 0 ;
	}
	$row_stock = $_opDB->fetch_assoc($result) ;
	
	$query = "SELECT treenode_key FROM view_bible_ADR_entry
				WHERE entry_key='{$row_stock['field_ADR_ID']}'" ;
	$adr_treenodeKey = $_opDB->query_uniqueValue($query) ;
	$whse_code = $map_adrTreenodeKey_whseCode[$adr_treenodeKey] ;
	if( !$whse_code ) {
		return 0 ;
	}
	
	$row_mvt = array(
		'field_SOC_CODE' => $row_stock['field_SOC_CODE'],
		'field_INPUTSTACK_REF' => $row_stock['field_INPUTSTACK_REF'],
		'field_INPUTSTACK_LEVEL' => $row_stock['field_INPUTSTACK_LEVEL'],
		'field_CONTAINER_TYPE' => ($qte_mvt ? NULL : $row_stock['field_CONTAINER_TYPE']),
		'field_CONTAINER_REF' => ($qte_mvt ? NULL : $row_stock['field_CONTAINER_REF']),
		'field_CONTAINER_DISPLAY' => $row_stock['field_CONTAINER_REF'],
		'field_PROD_ID' => $row_stock['field_PROD_ID'],
		'field_QTY_MVT' => abs($adjust_qty),
		'field_SPEC_BATCH' => $row_stock['field_SPEC_BATCH'],
		'field_SPEC_DATELC' => $row_stock['field_SPEC_DATELC'],
		'field_SPEC_SN' => $row_stock['field_SPEC_SN'],
		'field_MVTDIRECT_TXT' => $adjust_txt
	);
	if( $adjust_qty < 0 ) {
		$row_mvt += array(
			'field_SRC_FILE_STOCK_ID' => $stock_filerecordId,
			'field_SRC_WHSE' => $whse_code,
			'field_SRC_ADR_ID' => $row_stock['field_ADR_ID']
		);
	}
	if( $adjust_qty > 0 ) {
		$row_mvt += array(
			'field_DST_FILE_STOCK_ID' => $stock_filerecordId,
			'field_DST_WHSE' => $whse_code,
			'field_DST_ADR_ID' => $row_stock['field_ADR_ID']
		);
	}
	foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
		if( !$stockAttribute_obj['STOCK_fieldcode'] ) {
			continue ;
		}
		$mkey = $stockAttribute_obj['mkey'] ;
		$STOCK_fieldcode = $stockAttribute_obj['STOCK_fieldcode'] ;
		
		$row_mvt[$STOCK_fieldcode] = $row_stock[$STOCK_fieldcode] ;
	}
	$mvt_filerecordId = paracrm_lib_data_insertRecord_file('MVT',0,$row_mvt) ;
	
	
	$query = "UPDATE view_file_STOCK 
			SET field_QTY_AVAIL = field_QTY_AVAIL + '{$adjust_qty}'
			WHERE filerecord_id='{$stock_filerecordId}'" ;
	$_opDB->query($query) ;
	
	
	$row_mvt = array(
		'field_COMMIT_IS_OK' => 1,
		'field_COMMIT_DATE' => date('Y-m-d H:i:s')
	);
	paracrm_lib_data_updateRecord_file('MVT',$row_mvt,$mvt_filerecordId) ;
	
	return $mvt_filerecordId ;
}



?>
