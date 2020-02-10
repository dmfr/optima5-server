<?php

function specDbsLam_lib_proc_lock_on() {
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
function specDbsLam_lib_proc_lock_off() {
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

function specDbsLam_lib_proc_findAdr_runSql( $sql_qId ) {
	$forward_post = array(
		'q_type' => 'qsql',
		'q_id' => $sql_qId
	);
	$return_json = paracrm_queries_direct($forward_post,$auth_bypass=true,$is_rw=true) ;
	return $return_json['success'] ;
}
function specDbsLam_lib_proc_findAdr( $mvt_obj, $whse_dest, $to_picking=NULL, $to_picking_imp=NULL ) {
	global $_opDB ;
	
	// Load cfg attributes
	$ttmp = specDbsLam_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	
	foreach($json_cfg['cfg_whse'] as $whse) {
		if( ($whse['whse_code']==$whse_dest) ) {
			$sqlrun_pre = $whse['adr_sqlrun_pre'] ;
			$sqlrun_post = $whse['adr_sqlrun_post'] ;
		}
	}
	
	
	/* SQL Run Pre */
	if( $sqlrun_pre ) {
		specDbsLam_lib_proc_findAdr_runSql($sqlrun_pre) ;
	}
	
	
	
	/*
	* --- mvt_obj -----
	*/
	$adr_treenodes = paracrm_data_getBibleTreeBranch( 'ADR', $whse_dest ) ;
	$subQuery_stkWhse = "SELECT s.* FROM view_file_STOCK s
						INNER JOIN view_bible_ADR_entry adr ON adr.entry_key=s.field_ADR_ID
						WHERE adr.treenode_key IN ".$_opDB->makeSQLlist($adr_treenodes) ;
						
	
	if( $mvt_obj['stk_prod'] ) {
		$hasPicking = FALSE ;
		$query = "SELECT inv.field_ADR_ID
					FROM ($subQuery_stkWhse) inv 
					JOIN view_bible_ADR_entry adr ON inv.field_ADR_ID = adr.entry_key
					WHERE inv.field_PROD_ID='{$mvt_obj['stk_prod']}'
					AND adr.field_CONT_IS_ON='1' AND adr.field_CONT_IS_PICKING='1'" ;
		if( $hasPickingAdr = $_opDB->query_uniqueValue($query) ) {
			$hasPicking = TRUE ;
		}
		
		if( $to_picking===NULL && !!$mvt_obj['container_type'] ) { // != FALSE/TRUE
			$to_picking = !$hasPicking ;
		}
		
		// interro prod
		$json = specDbsLam_prods_getGrid( array('entry_key'=>$mvt_obj['stk_prod']) ) ;
		$row_prod = $json['data'][0] ;
		
		// paramétrage picking ?
		// picking existant ? si oui adresse ?
		$pickingIsStatic = $row_prod['picking_is_static'] ;
		$pickingAdrStatic = ($row_prod['picking_is_static'] ? $hasPickingAdr : null) ;
		
		// append des attributs
		foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
			if( !$stockAttribute_obj['ADR_fieldcode'] || !$stockAttribute_obj['PROD_fieldcode'] ) {
				continue ;
			}
			$mkey = $stockAttribute_obj['mkey'] ;
			if( $row_prod[$mkey] ) {
				$mvt_obj[$mkey] = $row_prod[$mkey] ;
			}
		}
		
		
		
		// picking statique
		if( $mvt_obj['container_type'] && $to_picking && $pickingIsStatic ) {
			if( $pickingAdrStatic ) {
				// valid adr libre ?
				$query = "SELECT count(*) FROM ($subQuery_stkWhse) s WHERE s.field_ADR_ID='{$pickingAdrStatic}' AND s.field_PROD_ID<>'{$mvt_obj['stk_prod']}'" ;
				if( $_opDB->query_uniqueValue($query) > 0 ) {
					return NULL ;
				} else {
					specDbsLam_prods_setPickStaticAdr($mvt_obj['stk_prod'],$pickingAdrStatic) ;
					return $pickingAdrStatic ;
				}
			}
		}
		
	}
	
	// Mode aléatoire ensuite
	for( $i=1 ; $i>=0 ; $i-- ) {
		$doCheckAttributes = ($i==1) ;
		
		$attributesToCheck = array() ;
		foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
			if( !$stockAttribute_obj['ADR_fieldcode'] ) {
				continue ;
			}
			$mkey = $stockAttribute_obj['mkey'] ;
			if( ($doCheckAttributes || !$stockAttribute_obj['cfg_is_optional']) && $mvt_obj[$mkey] ) {
				$attributesToCheck[$stockAttribute_obj['ADR_fieldcode']] = $mvt_obj[$mkey] ;
			}
		}
		
		$query = "SELECT adr.* FROM view_bible_ADR_entry adr
					LEFT OUTER JOIN view_file_STOCK inv ON inv.field_ADR_ID = adr.entry_key
					WHERE inv.filerecord_id IS NULL AND adr.field_STATUS_IS_ACTIVE='1'
					AND adr.treenode_key IN ".$_opDB->makeSQLlist($adr_treenodes) ;
		foreach( $attributesToCheck as $STOCK_fieldcode => $neededValue ) {
			$query.= " AND adr.{$STOCK_fieldcode}='".$_opDB->escape_string(json_encode(array($neededValue)))."'" ;
		}
		if( $mvt_obj['container_type'] ) {
			$query.= " AND adr.field_CONT_IS_ON='1' AND adr.field_CONT_TYPES LIKE '%\"{$mvt_obj['container_type']}\"%'" ;
			if( $doCheckAttributes ) {
				$check_val = ($to_picking ? '1' : '0') ;
				$query.= " AND adr.field_CONT_IS_PICKING='{$check_val}'" ;
			}
		} else {
			$query.= " AND adr.field_CONT_IS_ON='0'" ;
		}
		$query.= " ORDER BY adr.field_PRIO_IDX, adr.entry_key LIMIT 1" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
			$adr_id = $arr['entry_key'] ;
			break 2 ;
		}
		if( $to_picking_imp ) {
			break ;
		}
	}
	
	if( $pickingIsStatic && $doCheckAttributes && $to_picking ) {
		// restockage
		specDbsLam_prods_setPickStaticAdr($mvt_obj['stk_prod'],$adr_id) ;
	}
	
	/* SQL Run Post */
	if( $sqlrun_post ) {
		specDbsLam_lib_proc_findAdr_runSql($sqlrun_post) ;
	}
	
	return $adr_id ;
}
function specDbsLam_lib_proc_validateAdr( $mvt_obj, $whse_dest, $adr_id ) {
	global $_opDB ;
	
	// Load cfg attributes
	$ttmp = specDbsLam_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	
	
	$adr_treenodes = paracrm_data_getBibleTreeBranch( 'ADR', $whse_dest ) ;
	$adr_row = paracrm_lib_data_getRecord_bibleEntry( 'ADR', $adr_id ) ;
	if( !$adr_row || !in_array($adr_row['treenode_key'],$adr_treenodes) ) {
		// echo "NON-EXIST" ;
		return NULL ;
	}
	
	if( $mvt_obj['stk_prod'] ) {
		// interro prod
		$json = specDbsLam_prods_getGrid( array('entry_key'=>$mvt_obj['stk_prod']) ) ;
		$row_prod = $json['data'][0] ;
		$pickingIsStatic = $row_prod['picking_is_static'] ;
		
		// append des attributs
		foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
			if( !$stockAttribute_obj['ADR_fieldcode'] || !$stockAttribute_obj['PROD_fieldcode'] ) {
				continue ;
			}
			$mkey = $stockAttribute_obj['mkey'] ;
			if( $row_prod[$mkey] ) {
				$mvt_obj[$mkey] = $row_prod[$mkey] ;
			}
		}
	}
	/*
	--- Checks ----
	 container type
	 attributes
	----
	*/
	$attributesToCheck = array() ;
	foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
		if( !$stockAttribute_obj['ADR_fieldcode'] ) {
			continue ;
		}
		$mkey = $stockAttribute_obj['mkey'] ;
		if( !$stockAttribute_obj['cfg_is_optional'] && $mvt_obj[$mkey] ) {
			$attributesToCheck[$stockAttribute_obj['ADR_fieldcode']] = $mvt_obj[$mkey] ;
		}
	}
	
	
	
	$query = "SELECT adr.entry_key FROM view_bible_ADR_entry adr
				LEFT OUTER JOIN view_file_STOCK inv ON inv.field_ADR_ID = adr.entry_key
				WHERE inv.filerecord_id IS NULL AND adr.field_STATUS_IS_ACTIVE='1'
				AND adr.treenode_key IN ".$_opDB->makeSQLlist($adr_treenodes) ;
	foreach( $attributesToCheck as $STOCK_fieldcode => $neededValue ) {
		$query.= " AND adr.{$STOCK_fieldcode}='".$_opDB->escape_string(json_encode(array($neededValue)))."'" ;
	}
	if( $mvt_obj['container_type'] ) {
		$query.= " AND adr.field_CONT_IS_ON='1' AND adr.field_CONT_TYPES LIKE '%\"{$mvt_obj['container_type']}\"%'" ;
	} else {
		$query.= " AND adr.field_CONT_IS_ON='0'" ;
	}
	$query.= " AND adr.entry_key='{$adr_id}'" ;
	//echo $query ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) == 0 ) {
		// HACK : accept systématique sur adresses non paletier
		$query = "SELECT adr.entry_key FROM view_bible_ADR_entry adr
			WHERE adr.field_CONT_IS_ON='0' AND adr.treenode_key IN ".$_opDB->makeSQLlist($adr_treenodes)." AND adr.entry_key='{$adr_id}'" ;
		$result = $_opDB->query($query) ;
		if( $_opDB->num_rows($result) == 0 ) {
			return NULL ;
		}
	}
	$arr = $_opDB->fetch_row($result) ;
	$adr_id = $arr[0] ;
	
	if( $pickingIsStatic && $mvt_obj['container_type'] ) {
		// restockage si picking
		$query = "SELECT entry_key FROM view_bible_ADR_entry WHERE field_CONT_IS_ON='1' AND field_CONT_IS_PICKING='1' AND entry_key='{$adr_id}'" ;
		$result = $_opDB->query($query) ;
		if( $_opDB->num_rows($result) > 0 ) {
			// restockage
			specDbsLam_prods_setPickStaticAdr($mvt_obj['stk_prod'],$adr_id) ;
		}
	}
	
	return $adr_id ;
}

?>
