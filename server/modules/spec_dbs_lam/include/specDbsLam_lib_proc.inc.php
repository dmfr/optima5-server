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

function specDbsLam_lib_proc_findAdr( $mvt_obj, $whse_dest, $to_picking ) {
	/*
	* --- mvt_obj -----
	*  soc_code
	*  prod_id
	* 
	*/
	
	if( $mvt_obj['stk_prod'] ) {
		// paramétrage picking ?
		// picking existant ? si oui adresse ?
		$pickingIsStatic = false ;
		$pickingAdrCurrent = false ;
		$pickingAdrStatic = false ;
		
		if( ($mvt_obj['container_type'] && $to_picking) && $pickingIsStatic && (($pickingAdrCurrent==$pickingAdrStatic)||!$pickingAdrCurrent) ) {
			return $pickingAdrStatic ;
		}
	}
	
	
	
}
function specDbsLam_lib_proc_validateAdr( $mvt_obj, $whse_dest, $adr_id ) {
	//
	$adr_treenodes = paracrm_data_getBibleTreeBranch( 'ADR', $whse_dest ) ;
	$adr_row = paracrm_lib_data_getRecord_bibleEntry( 'ADR', $adr_id ) ;
	if( !$adr_row || !in_array($adr_row['treenode_key'],$adr_treenodes) ) {
		// echo "NON-EXIST" ;
		return FALSE ;
	}
	/*
	--- Checks ----
	 container type
	 attributes
	----
	*/
	
}






function specDbsLam_lib_proc_findAdrOld( $mvt_obj, $stockAttributes_obj, $whse_dest, $suggest_adrId=NULL ) {
	global $_opDB ;
	
	// Load cfg attributes
	$ttmp = specDbsLam_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	
	// Load warehouse treenodes
	$adr_treenodes = paracrm_data_getBibleTreeBranch( 'ADR', $whse_dest ) ;
	
	
	$adr_id = NULL ;
	while(TRUE) {
		while( TRUE ) {
			if( !$mvt_obj ) {
				break ;
			}
			
			$ttmp = explode('_',$mvt_obj['prod_id'],2) ;
			$soc_code = $ttmp[0] ;
			foreach( $json_cfg['cfg_soc'] as $socCfg_obj ) {
				if( $socCfg_obj['soc_code'] == $soc_code ) {
					break ;
				}
				unset($socCfg_obj) ;
			}
			switch( $socCfg_obj['location_policy_ifexists'] ) {
				case 'PN' :
				case 'PN_BATCH' :
					break ;
					
				default : break 2 ;
			}
			if( $suggest_adrId ) {
				break ;
			}
			
			// 1er cas : emplacement existant POS_ID
			$attributesToCheck = array() ;
			foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
				if( !in_array($soc_code, $stockAttribute_obj['socs']) ) {
					continue ;
				}
				
				if( !$stockAttribute_obj['ADR_fieldcode'] ) {
					continue ;
				}
				if( !$stockAttribute_obj['STOCK_fieldcode'] ) {
					continue ;
				}
				$mkey = $stockAttribute_obj['mkey'] ;
				if( $stockAttributes_obj[$mkey] && !$stockAttribute_obj['cfg_is_optional'] ) {
					$attributesToCheck[$stockAttribute_obj['ADR_fieldcode']] = $stockAttributes_obj[$mkey] ;
				}
			}
			
			$query = "SELECT adr.field_ADR_ID as adr_id, adr.field_POS_ID as pos_id FROM view_file_STOCK stk
				INNER JOIN view_bible_ADR_entry adr ON adr.field_ADR_ID = stk.field_ADR_ID
				WHERE 1 AND adr.field_STATUS_IS_ACTIVE='1'" ;
			switch( $socCfg_obj['location_policy_ifexists'] ) {
				case 'PN' :
					$query.= " AND field_PROD_ID='{$mvt_obj['prod_id']}'" ;
					break ;
					
				case 'PN_BATCH' :
					$query.= " AND field_PROD_ID='{$mvt_obj['prod_id']}' AND field_SPEC_BATCH='{$mvt_obj['batch']}'" ;
					break ;
			}
			$query.= " AND (stk.field_QTY_AVAIL+stk.field_QTY_OUT) > '0'
				AND adr.treenode_key IN ".$_opDB->makeSQLlist($adr_treenodes) ;
			foreach( $attributesToCheck as $STOCK_fieldcode => $neededValue ) {
				$query.= " AND adr.{$STOCK_fieldcode}='".mysql_real_escape_string(json_encode(array($neededValue)))."'" ;
				$query.= " AND stk.{$STOCK_fieldcode}='".mysql_real_escape_string($neededValue)."'" ;
			}
			$result = $_opDB->query($query) ;
			if( $_opDB->num_rows($result) >= 1 ) {
				$arr = $_opDB->fetch_assoc($result) ;
			
				$status = 'OK_ADD' ;
				$adr_id = $arr['adr_id'] ;
				
				break 2 ;
			}
			break ;
		}
		
		// 2ème cas : position libre correspondant aux critères
		// 3ème cas : position libre sans les critères facultatifs
		
		// pre : has picking ?
		if( $mvt_obj['container_type'] ) {
			$has_picking = FALSE ;
			
			$query = "SELECT count(*)
						FROM view_file_STOCK inv 
						JOIN view_bible_ADR_entry adr ON inv.field_ADR_ID = adr.entry_key
						WHERE inv.field_PROD_ID='{$mvt_obj['prod_id']}'
						AND adr.field_CONT_IS_ON='1' AND adr.field_CONT_IS_PICKING='1'" ;
			if( $_opDB->query_uniqueValue($query) > 0 ) {
				$has_picking = TRUE ;
			}
			
			$query = "SELECT count(*)
						FROM view_file_MVT mvt
						JOIN view_file_MVT_STEP mvtstep ON mvtstep.filerecord_parent_id = mvt.filerecord_id
						JOIN view_bible_ADR_entry adr ON mvtstep.field_DEST_ADR_ID = adr.entry_key
						WHERE mvtstep.field_STATUS_IS_OK='0' AND mvt.field_PROD_ID='{$mvt_obj['prod_id']}'
						AND adr.field_STATUS_IS_PREALLOC='1' AND adr.field_CONT_IS_ON='1' AND adr.field_CONT_IS_PICKING='1'" ;
			if( $_opDB->query_uniqueValue($query) > 0 ) {
				$has_picking = TRUE ;
			}
		}
		
		
		for( $i=1 ; $i>=0 ; $i-- ) {
			$doCheckAttributes = ($i==1) ;
			
			$attributesToCheck = array() ;
			foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
				if( !$stockAttribute_obj['ADR_fieldcode'] ) {
					continue ;
				}
				$mkey = $stockAttribute_obj['mkey'] ;
				if( ($doCheckAttributes || !$stockAttribute_obj['cfg_is_optional']) && $stockAttributes_obj[$mkey] ) {
					$attributesToCheck[$stockAttribute_obj['ADR_fieldcode']] = $stockAttributes_obj[$mkey] ;
				}
			}
			
			$query = "SELECT adr.* FROM view_bible_ADR_entry adr
						LEFT OUTER JOIN view_file_STOCK inv ON inv.field_ADR_ID = adr.entry_key
						WHERE inv.filerecord_id IS NULL AND adr.field_STATUS_IS_ACTIVE='1' AND adr.field_STATUS_IS_PREALLOC='0'
						AND adr.treenode_key IN ".$_opDB->makeSQLlist($adr_treenodes) ;
			foreach( $attributesToCheck as $STOCK_fieldcode => $neededValue ) {
				$query.= " AND adr.{$STOCK_fieldcode}='".mysql_real_escape_string(json_encode(array($neededValue)))."'" ;
			}
			if( $mvt_obj['container_type'] ) {
				$query.= " AND adr.field_CONT_IS_ON='1' AND adr.field_CONT_TYPES LIKE '%\"{$mvt_obj['container_type']}\"%'" ;
				if( $doCheckAttributes ) {
					$check_val = ($has_picking ? '0' : '1') ;
					$query.= " AND adr.field_CONT_IS_PICKING='{$check_val}'" ;
				}
			} else {
				$query.= " AND adr.field_CONT_IS_ON='0'" ;
			}
			if( $suggest_adrId ) {
				$query.= " AND adr.field_ADR_ID='{$suggest_adrId}'" ;
			}
			$query.= " ORDER BY adr.field_PRIO_IDX, adr.entry_key LIMIT 1" ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
				$status = 'OK_NEW' ;
				if( $suggest_adrId ) {
					$status = 'OK_MAN' ;
				}
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

?>
