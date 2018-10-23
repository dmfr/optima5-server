<?php

function specDbsLam_lib_procCde_calcNeeds($transfer_filerecord_id) {
	global $_opDB ;
	
	/*
	$query = "SELECT mvtflow.field_IS_CDE, mvtflow.field_CDE_PROCESS FROM view_file_TRANSFER t
				JOIN view_bible_CFG_MVTFLOW_tree mvtflow ON mvtflow.treenode_key=t.field_FLOW_CODE
				WHERE t.filerecord_id='{$transfer_filerecord_id}'" ;
	$result = $_opDB->query($query) ;
	$arr = $_opDB->fetch_row($result) ;
	$cfg_isCde = !(!$arr[0]) ;
	$cfg_cdeProcess = $arr[1] ;
	*/
	$formard_post = array(
		'filter_transferFilerecordId' => $transfer_filerecord_id,
		'filter_fast' => true
	) ;
	$json = specDbsLam_transfer_getTransfer($formard_post) ;
	$transfer_row = reset($json['data']) ;
	if( !$transfer_row || !$transfer_row['spec_cde'] ) {
		return ;
	}
	$stepIdxPicking = $stepIdxPacking = NULL ;
	foreach( $transfer_row['steps'] as $transferstep_row ) {
		if( $transferstep_row['spec_cde_picking'] ) {
			$stepIdxPicking = $transferstep_row['transferstep_idx'] ;
		}
		if( $transferstep_row['spec_cde_packing'] ) {
			$stepIdxPacking = $transferstep_row['transferstep_idx'] ;
		}
	}
	if( !$stepIdxPicking || !$stepIdxPacking ) {
		return ;
	}
	if( $stepIdxPicking<$stepIdxPacking ) {
		$cfg_cdeProcess = 'GROUP_ALL' ;
	}
	if( $stepIdxPicking==$stepIdxPacking ) {
		$cfg_cdeProcess = 'SINGLE' ;
	}
	
	if( !$cfg_cdeProcess ) {
		return ;
	}
	
	$arrGroupBys = NULL ;
	switch( $cfg_cdeProcess ) {
		case 'SINGLE' :
			//$arrGroupBys = array('cde_filerecord_id','cdelig_prod') ;
			$arrGroupBys = array('cde_filerecord_id','cdelig_filerecord_id','cdelig_prod') ;
			break ;
		
		case 'GROUP_ALL' :
			$arrGroupBys = array('cdelig_prod') ;
			break ;
		
		default :
			return ;
	}
	
	
	$map_groupBy_qty = array() ;
	$map_groupBy_fields = array() ;
	$map_groupBy_arrTransfercdelinkFilerecordIds = array() ;
	$query = "SELECT cl.filerecord_parent_id as cde_filerecord_id, cl.filerecord_id as cdelig_filerecord_id
					, tcl.filerecord_id as transfercdelink_filerecord_id
					, cl.field_PROD_ID as cdelig_prod
					, cl.field_QTY_CDE as qty_cde
				FROM view_file_TRANSFER_CDE_LINK tcl
				INNER JOIN view_file_CDE_LIG cl ON cl.filerecord_id=tcl.field_FILE_CDELIG_ID
				WHERE tcl.filerecord_parent_id='{$transfer_filerecord_id}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$groupKey = array() ;
		foreach( $arrGroupBys as $groupBy ) {
			$groupKey[] = $arr[$groupBy] ;
		}
		$groupKey = implode('%%%',$groupKey) ;
		
		if( !isset($map_groupBy_qty[$groupKey]) ) {
			$map_groupBy_qty[$groupKey] = 0 ;
			
			$map_groupBy_fields[$groupKey] = array() ;
			foreach( $arrGroupBys as $groupBy ) {
				$map_groupBy_fields[$groupKey][$groupBy] = $arr[$groupBy] ;
			}
		}
		$map_groupBy_qty[$groupKey] += $arr['qty_cde'] ;
		
		if( !is_array($map_groupBy_arrTransfercdelinkFilerecordIds[$groupKey]) ) {
			$map_groupBy_arrTransfercdelinkFilerecordIds[$groupKey] = array() ;
		}
		$map_groupBy_arrTransfercdelinkFilerecordIds[$groupKey][] = $arr['transfercdelink_filerecord_id'] ;
	}
	
	
	$previous_needFilerecordIds = array() ;
	$query = "SELECT filerecord_id FROM view_file_TRANSFER_CDE_NEED WHERE filerecord_parent_id='{$transfer_filerecord_id}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$previous_needFilerecordIds[] = $arr[0] ;
	}
	
	$current_needFilerecordIds = array() ;
	foreach( $map_groupBy_qty as $groupKey => $qty ) {
		// rech. existing row
		$query = "SELECT filerecord_id FROM view_file_TRANSFER_CDE_NEED 
			WHERE filerecord_parent_id='{$transfer_filerecord_id}'" ;
		$arr_ins = array() ;
		foreach( $map_groupBy_fields[$groupKey] as $groupBy => $mvalue ) {
			$sql_field = NULL ;
			switch( $groupBy ) {
				case 'cde_filerecord_id' :
					$sql_field = "field_FILE_CDE_ID" ;
					break ;
				case 'cdelig_filerecord_id' :
					$sql_field = "field_FILE_CDE_ID" ;
					break ;
				case 'cdelig_prod' :
					$sql_field = "field_PROD_ID" ;
					break ;
			}
			if($sql_field) {
				$query.= " AND {$sql_field}='{$mvalue}'" ;
				$arr_ins[$sql_field] = $mvalue ;
			}
		}
		$transfercdeneed_filerecord_id = $_opDB->query_uniqueValue($query) ;
		
		$arr_ins['field_QTY_NEED'] = $qty ;
		switch( $cfg_cdeProcess ) {
			case 'SINGLE' :
				$query = "SELECT field_CDE_NR FROM view_file_CDE WHERE filerecord_id='{$map_groupBy_fields[$groupKey]['cde_filerecord_id']}'" ;
				$arr_ins['field_NEED_TXT'] = $_opDB->query_uniqueValue($query) ;
				break ;
			
			case 'GROUP_ALL' :
				$query = "SELECT field_TRANSFER_TXT FROM view_file_TRANSFER WHERE filerecord_id='{$transfer_filerecord_id}'" ;
				$arr_ins['field_NEED_TXT'] = $_opDB->query_uniqueValue($query) ;
				break ;
		}
		
		
		if( $transfercdeneed_filerecord_id ) {
			$current_needFilerecordIds[] = $transfercdeneed_filerecord_id ;
			paracrm_lib_data_updateRecord_file('TRANSFER_CDE_NEED',$arr_ins,$transfercdeneed_filerecord_id) ;
		} else {
			$transfercdeneed_filerecord_id = paracrm_lib_data_insertRecord_file('TRANSFER_CDE_NEED',$transfer_filerecord_id,$arr_ins) ;
			$current_needFilerecordIds[] = $transfercdeneed_filerecord_id ;
		}
		
		if( $transfercdeneed_filerecord_id ) {
			foreach( $map_groupBy_arrTransfercdelinkFilerecordIds[$groupKey] as $transfercdelink_filerecord_id ) {
				$arr_update = array() ;
				$arr_update['field_FILE_TRSFRCDENEED_ID'] = $transfercdeneed_filerecord_id ;
				paracrm_lib_data_updateRecord_file('TRANSFER_CDE_LINK',$arr_update,$transfercdelink_filerecord_id) ;
			}
		}
	}
	
	$toDelete_filerecordIds = array_diff($previous_needFilerecordIds,$current_needFilerecordIds) ;
	foreach( $toDelete_filerecordIds as $del_filerecord_id ) {
		paracrm_lib_data_deleteRecord_file('TRANSFER_CDE_NEED',$del_filerecord_id) ;
	}
	return ;
}


function specDbsLam_lib_procCde_forwardPacking( $transfer_filerecord_id, $transfercdeneed_filerecord_id=NULL ) {
	global $_opDB ;
	
	
	$formard_post = array(
		'filter_transferFilerecordId' => $transfer_filerecord_id
	) ;
	$json = specDbsLam_transfer_getTransfer($formard_post) ;
	$transfer_row = reset($json['data']) ;
	if( !$transfer_row || !$transfer_row['spec_cde'] ) {
		return ;
	}
	$stepIdxPicking = $stepIdxPacking = NULL ;
	$transferstepPicking_row = $transferstepPacking_row = NULL ;
	foreach( $transfer_row['steps'] as $transferstep_row ) {
		if( $transferstep_row['spec_cde_picking'] ) {
			$stepIdxPicking = $transferstep_row['transferstep_idx'] ;
			$transferstepPicking_row = $transferstep_row ;
		}
		if( $transferstep_row['spec_cde_packing'] ) {
			$stepIdxPacking = $transferstep_row['transferstep_idx'] ;
			$transferstepPacking_row = $transferstep_row ;
		}
	}
	if( !$stepIdxPicking || !$stepIdxPacking ) {
		return ;
	}
	if( $stepIdxPicking<$stepIdxPacking ) {
		$cfg_cdeProcess = 'GROUP_ALL' ;
	}
	if( $stepIdxPicking==$stepIdxPacking ) {
		$cfg_cdeProcess = 'SINGLE' ;
	}
	
	if( !$cfg_cdeProcess ) {
		return ;
	}
	
	// itération sur les Needs
	foreach( $transfer_row['cde_needs'] as $transferCdeNeed_row ) {
		if( $transfercdeneed_filerecord_id && $transferCdeNeed_row['transfercdeneed_filerecord_id'] != $transfercdeneed_filerecord_id ) {
			continue ;
		}
		if( !($transferCdeNeed_row['qty_alloc']>=$transferCdeNeed_row['qty_need']) ) {
			continue ;
		}
		$transferCdeNeed_filerecordId = $transferCdeNeed_row['transfercdeneed_filerecord_id'] ;
		
		switch( $cfg_cdeProcess ) {
			case 'SINGLE' :
				// Mode SINGLE :
				// - vérif 1 seule cdelink
				// - tag des lignes de picking AS packing
				if( count($transferCdeNeed_row['cde_links']) != 1 ) {
					//echo "ERR!!!" ;
					break ;
				}
				$transferCdeLink_row = reset($transferCdeNeed_row['cde_links']) ;
				$transferCdeLink_filerecordId = $transferCdeLink_row['transfercdelink_filerecord_id'] ;
				foreach( $transferstepPacking_row['ligs'] as $transferstepPackingLig_row ) {
					if( $transferstepPackingLig_row['cdepick_transfercdeneed_filerecord_id'] != $transferCdeNeed_filerecordId ) {
						continue ;
					}
					//print_r($transferstepPackingLig_row) ;
					$transferLig_filerecordId = $transferstepPackingLig_row['transferlig_filerecord_id'] ;
					
					$arr_update = array() ;
					$arr_update['field_PACK_TRSFRCDELINK_ID'] = $transferCdeLink_filerecordId ;
					paracrm_lib_data_updateRecord_file('TRANSFER_LIG',$arr_update,$transferLig_filerecordId) ;
				}
				break ;
			
			case 'GROUP_ALL' :
				// $qtyNeedAvailable 
				$query = "SELECT filerecord_id, (field_QTY_PREIN+field_QTY_AVAIL) FROM view_file_STOCK WHERE filerecord_id IN (
									SELECT field_DST_FILE_STOCK_ID
									FROM view_file_TRANSFER_CDE_NEED tcn
									INNER JOIN view_file_TRANSFER_LIG tl 
										ON tl.filerecord_parent_id=tcn.filerecord_parent_id 
											AND tl.field_PICK_TRSFRCDENEED_ID=tcn.filerecord_id
											AND tl.field_TRANSFERSTEP_IDX = '{$stepIdxPicking}'
									INNER JOIN view_file_MVT m
										ON m.filerecord_id=tl.field_FILE_MVT_ID
									WHERE tcn.filerecord_id='{$transferCdeNeed_filerecordId}' 
										AND tcn.filerecord_parent_id='{$transfer_filerecord_id}'
							)";
				$result = $_opDB->query($query) ;
				$map_stkFilerecordId_qtyNeedAvailable = array() ;
				while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
					$map_stkFilerecordId_qtyNeedAvailable[$arr[0]] = (float)$arr[1] ;
				}
				$qtyNeedAvailable = array_sum($map_stkFilerecordId_qtyNeedAvailable) ;
				//echo $qtyNeedAvailable ;
				//print_r($map_stkFilerecordId_qtyNeedAvailable) ;
				
				foreach( $transferCdeNeed_row['cde_links'] as $transferCdeLink_row ) {
					//print_r($transferCdeLink_row) ;
					$transferCdeLink_filerecordId = $transferCdeLink_row['transfercdelink_filerecord_id'] ;
					$qtyLig = $transferCdeLink_row['qty_cde'] ;
					$qtyLig_toAlloc = $qtyLig ;
					// qté déjà allouée en packing ?
					foreach( $transferstepPacking_row['ligs'] as $transferstepPackingLig_row ) {
						if( $transferstepPackingLig_row['cdepack_transfercdelink_filerecord_id'] == $transferCdeLink_filerecordId ) {
							$qtyLig_toAlloc -= $transferstepPackingLig_row['mvt_qty'] ;
						}
					}
					
					//echo $qtyLig_toAlloc ;
					while( TRUE ) {
						if( $qtyLig_toAlloc <= 0 ) {
							break ;
						}
						if( !count($map_stkFilerecordId_qtyNeedAvailable) ) {
							break ;
						}
						reset($map_stkFilerecordId_qtyNeedAvailable) ;
						list($stk_filerecord_id, $qty_stk) = each($map_stkFilerecordId_qtyNeedAvailable);
						if( $qty_stk <= 0 ) {
							array_shift($map_stkFilerecordId_qtyNeedAvailable) ;
							continue ;
						}
						
						$qty_transaction = min($qtyLig_toAlloc,$qty_stk) ;
						
						
						$mvt_filerecordId = specDbsLam_lib_procMvt_addStock( 
							$transferstepPacking_row['whse_src']
							, $transferstepPacking_row['whse_dst']
							, $stk_filerecord_id
							, $qty_transaction ) ;
						
						if( !$mvt_filerecordId ){
							//echo "ERR" ;
							break ;
						}
						$qtyLig_toAlloc-= $qty_transaction ;
						
						$transfer_row = array(
							'field_TRANSFERSTEP_IDX' => $stepIdxPacking,
							'field_FILE_MVT_ID' => $mvt_filerecordId,
							'field_PACK_TRSFRCDELINK_ID' => $transferCdeLink_filerecordId
						);
						paracrm_lib_data_insertRecord_file('TRANSFER_LIG',$transfer_filerecord_id,$transfer_row) ;
						
						$whseDest = $transferstepPacking_row['whse_dst'] ;
						$needTxt = preg_replace("/[^A-Z0-9]/", "", strtoupper($transferCdeLink_row['cde_nr'] )) ;
						if( $whseDestIsWork=TRUE ) {
							$tmp_adr = $whseDest.'_'.$needTxt ;
							specDbsLam_lib_procMvt_setDstAdr($mvt_filerecordId,$tmp_adr,$whseDest) ;
						}
					}
				}
				break ;
		}
	}
}
function specDbsLam_lib_procCde_releasePacking( $transfer_filerecord_id, $transfercdeneed_filerecord_id ) {
	global $_opDB ;
	
	
	$formard_post = array(
		'filter_transferFilerecordId' => $transfer_filerecord_id
	) ;
	$json = specDbsLam_transfer_getTransfer($formard_post) ;
	$transfer_row = reset($json['data']) ;
	if( !$transfer_row || !$transfer_row['spec_cde'] ) {
		return ;
	}
	$stepIdxPicking = $stepIdxPacking = NULL ;
	$transferstepPicking_row = $transferstepPacking_row = NULL ;
	foreach( $transfer_row['steps'] as $transferstep_row ) {
		if( $transferstep_row['spec_cde_picking'] ) {
			$stepIdxPicking = $transferstep_row['transferstep_idx'] ;
			$transferstepPicking_row = $transferstep_row ;
		}
		if( $transferstep_row['spec_cde_packing'] ) {
			$stepIdxPacking = $transferstep_row['transferstep_idx'] ;
			$transferstepPacking_row = $transferstep_row ;
		}
	}
	if( !$stepIdxPicking || !$stepIdxPacking ) {
		return ;
	}
	if( $stepIdxPicking<$stepIdxPacking ) {
		$cfg_cdeProcess = 'GROUP_ALL' ;
	}
	if( $stepIdxPicking==$stepIdxPacking ) {
		$cfg_cdeProcess = 'SINGLE' ;
	}
	
	if( !$cfg_cdeProcess ) {
		return ;
	}
	
	$toDelete_arrTranferLigFilerecordIds = array() ;
	// itération sur les Needs
	foreach( $transfer_row['cde_needs'] as $transferCdeNeed_row ) {
		if( $transferCdeNeed_row['transfercdeneed_filerecord_id'] != $transfercdeneed_filerecord_id ) {
			continue ;
		}
		
		$arr_cdeLinkFilerecordIds = array() ;
		foreach( $transferCdeNeed_row['cde_links'] as $transferCdeLink_row ) {
			//print_r($transferCdeLink_row) ;
			$transferCdeLink_filerecordId = $transferCdeLink_row['transfercdelink_filerecord_id'] ;
			$arr_cdeLinkFilerecordIds[] = $transferCdeLink_filerecordId ;
		}
		
		$err = FALSE ;
		foreach( $transferstepPacking_row['ligs'] as $transferstepPackingLig_row ) {
			if( !in_array($transferstepPackingLig_row['cdepack_transfercdelink_filerecord_id'],$arr_cdeLinkFilerecordIds) ) {
				continue ;
			}
			if( $transferstepPackingLig_row['status_is_ok'] ) {
				$err = TRUE ;
			}
			$toDelete_arrTranferLigFilerecordIds[] = $transferstepPackingLig_row['transferlig_filerecord_id'] ;
		}
		if( $err ) {
			return FALSE ;
		}
	}
	
	switch( $cfg_cdeProcess ) {
		case 'SINGLE' :
			foreach( $toDelete_arrTranferLigFilerecordIds as $transferlig_filerecord_id ) {
					$arr_update = array() ;
					$arr_update['field_PACK_TRSFRCDELINK_ID'] = 0 ;
					paracrm_lib_data_updateRecord_file('TRANSFER_LIG',$arr_update,$transferlig_filerecord_id) ;
			}
			break ;
			
		case 'GROUP_ALL' :
			specDbsLam_transfer_removeStock( array(
				'transfer_filerecordId' => $transfer_filerecord_id,
				'transferStep_filerecordId' => $transferstepPacking_row['transferstep_filerecord_id'],
				'transferLig_filerecordIds' => json_encode($toDelete_arrTranferLigFilerecordIds)
			)) ;
			break ;
	}
	return TRUE ;
}






function specDbsLam_lib_procCde_syncLinks($transfer_filerecord_id) {
	global $_opDB ;
	
	// for each needs => qty allocated
	// for each need => none / partial / complete
	// -> map_cdelig_status
	// -> advance/rewind cde statuses
	$map_transfercdeneedFilerecordId_status = array() ;
	$query = "SELECT tcn.filerecord_id, tcn.field_QTY_NEED, sum(m.field_QTY_MVT) FROM view_file_TRANSFER_CDE_NEED tcn
			JOIN view_file_TRANSFER t ON t.filerecord_id = tcn.filerecord_parent_id
			LEFT OUTER JOIN view_file_TRANSFER_LIG tl ON tl.field_PICK_TRSFRCDENEED_ID = tcn.filerecord_id
			LEFT OUTER JOIN view_file_MVT m ON m.filerecord_id = tl.field_FILE_MVT_ID
			WHERE t.filerecord_id='{$transfer_filerecord_id}'
			GROUP BY tcn.filerecord_id" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$qty_need = (float)$arr[1] ;
		$qty_alloc = (float)$arr[2] ;
		if( $qty_need <= 0 ) {
			$status = '' ;
		} elseif( $qty_alloc <= 0 ) {
			$status = 'NONE' ;
		} elseif( $qty_alloc==$qty_need ) {
			$status = 'FULL' ;
		} else {
			$status = 'PARTIAL' ;
		}
		
		$transfercdeneedFilerecordId = $arr[0] ;
		
		$map_transfercdeneedFilerecordId_status[$transfercdeneedFilerecordId] = $status ;
		
		$arr_update = array() ;
		$arr_update['field_QTY_ALLOC'] = $qty_alloc ;
		paracrm_lib_data_updateRecord_file('TRANSFER_CDE_NEED',$arr_update,$transfercdeneedFilerecordId) ;
	}
	
	$map_cdeligFilerecordId_status = array() ;
	$query = "SELECT tcl.field_FILE_TRSFRCDENEED_ID, tcl.field_FILE_CDELIG_ID
				FROM view_file_TRANSFER_CDE_LINK tcl
				WHERE tcl.filerecord_parent_id='{$transfer_filerecord_id}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$cdeligFilerecordId = $arr[1] ;
		$transfercdeneedFilerecordId = $arr[0] ;
		
		$map_cdeligFilerecordId_status[$cdeligFilerecordId] = $map_transfercdeneedFilerecordId_status[$transfercdeneedFilerecordId] ;
	}
	
	$map_cdeFilerecordId_arrStatuses = array() ;
	$query = "SELECT cl.filerecord_parent_id, cl.filerecord_id
				FROM view_file_TRANSFER_CDE_LINK tcl
				INNER JOIN view_file_CDE_LIG cl ON cl.filerecord_id=tcl.field_FILE_CDELIG_ID
				WHERE tcl.filerecord_parent_id='{$transfer_filerecord_id}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$cdeligFilerecordId = $arr[1] ;
		$cdeFilerecordId = $arr[0] ;
		
		if( !is_array($map_cdeFilerecordId_arrStatuses[$cdeFilerecordId]) ) {
			$map_cdeFilerecordId_arrStatuses[$cdeFilerecordId] = array() ;
		}
		$status_lig = $map_cdeligFilerecordId_status[$cdeligFilerecordId] ;
		if( !$status_lig ) {
			continue ;
		}
		if( !in_array($status_lig,$map_cdeFilerecordId_arrStatuses[$cdeFilerecordId]) ) {
			$map_cdeFilerecordId_arrStatuses[$cdeFilerecordId][] = $status_lig ;
		}
	}
	
	$map_cdeFilerecordId_status = array() ;
	foreach( $map_cdeFilerecordId_arrStatuses as $cdeFilerecordId => $arrStatuses ) {
		while(TRUE) {
			if( !$arrStatuses ) {
				$status = 'NULL' ;
				break ;
			}
			if( count($arrStatuses)>1 ) {
				$status = 'PARTIAL' ;
				break ;
			}
			$status = reset($arrStatuses) ;
			break ;
		}
		$map_cdeFilerecordId_status[$cdeFilerecordId] = $status ;
	}
	
	foreach( $map_cdeFilerecordId_status as $cdeFilerecordId => $status ) {
		switch($status) {
			case 'FULL' :
				$statuscode = '40' ;
				break ;
			case 'PARTIAL' :
				$statuscode = '30' ;
				break ;
			case 'NONE' :
				$statuscode = '20';
				break ;
			default :
				continue 2 ;
		}
		
		$query = "UPDATE view_file_CDE SET field_STATUS = '{$statuscode}' 
				WHERE filerecord_id='{$cdeFilerecordId}' AND field_STATUS<='40'"  ;
		$_opDB->query($query) ;
	}
	
	
	
	
	$ttmp = specDbsLam_transfer_getTransferLig( array('filter_transferFilerecordId'=>$transfer_filerecord_id) ) ;
	$rows_transferLig = $ttmp['data'] ;
	
	$map_transfercdeneedFilerecordId_arrStatuses = array() ;
	foreach( $rows_transferLig as $row_transferLig ) {
		if( !$row_transferLig['cdepick_transfercdeneed_filerecord_id'] ) {
			continue ;
		}
		
		$status = 'PICK_NONE' ;
		if( $row_transferLig['status_is_ok'] ) {
			$status = 'PICK_OK' ;
		}
		
		$transfercdeneed_filerecord_id = $row_transferLig['cdepick_transfercdeneed_filerecord_id'] ;
		if( !isset($map_transfercdeneedFilerecordId_arrStatuses[$transfercdeneed_filerecord_id]) ) {
			$map_transfercdeneedFilerecordId_arrStatuses[$transfercdeneed_filerecord_id] = array(); 
		}
		if( !in_array($status,$map_transfercdeneedFilerecordId_arrStatuses[$transfercdeneed_filerecord_id]) ) {
			$map_transfercdeneedFilerecordId_arrStatuses[$transfercdeneed_filerecord_id][] = $status ;
		}
	}
	$map_transfercdeneedFilerecordId_status = array() ;
	foreach( $map_transfercdeneedFilerecordId_arrStatuses as $transfercdeneed_filerecord_id => $arrStatuses ) {
		if( count($arrStatuses) > 1 ) {
			$status = 'PICK_CUR' ;
		} else {
			$status = reset($arrStatuses) ;
		}
		$map_transfercdeneedFilerecordId_status[$transfercdeneed_filerecord_id] = $status ;
	}
	
	$map_transfercdelinkFilerecordId_arrStatuses = array() ;
	foreach( $rows_transferLig as $row_transferLig ) {
		if( !$row_transferLig['cdepack_transfercdelink_filerecord_id'] ) {
			continue ;
		}
		
		$status = 'PACK_NONE' ;
		if( $row_transferLig['status_is_ok'] ) {
			$status = 'PACK_OK' ;
		}
		
		$transfercdelink_filerecord_id = $row_transferLig['cdepack_transfercdelink_filerecord_id'] ;
		if( !isset($map_transfercdelinkFilerecordId_arrStatuses[$transfercdelink_filerecord_id]) ) {
			$map_transfercdelinkFilerecordId_arrStatuses[$transfercdelink_filerecord_id] = array(); 
		}
		if( !in_array($status,$map_transfercdelinkFilerecordId_arrStatuses[$transfercdelink_filerecord_id]) ) {
			$map_transfercdelinkFilerecordId_arrStatuses[$transfercdelink_filerecord_id][] = $status ;
		}
	}
	$map_transfercdelinkFilerecordId_status = array() ;
	foreach( $map_transfercdelinkFilerecordId_arrStatuses as $transfercdelink_filerecord_id => $arrStatuses ) {
		if( count($arrStatuses) > 1 ) {
			$status = 'PACK_CUR' ;
		} else {
			$status = reset($arrStatuses) ;
		}
		$map_transfercdelinkFilerecordId_status[$transfercdelink_filerecord_id] = $status ;
	}
	
	$map_transfercdelinkFilerecordId_arrTransfercdepackFilerecordIds = array() ;
	foreach( $rows_transferLig as $row_transferLig ) {
		if( !$row_transferLig['cdepack_transfercdelink_filerecord_id'] ) {
			continue ;
		}
		if( !$row_transferLig['cdepack_transfercdepack_filerecord_id'] ) {
			continue ;
		}
		
		$transfercdelink_filerecord_id = $row_transferLig['cdepack_transfercdelink_filerecord_id'] ;
		$transfercdepack_filerecord_id = $row_transferLig['cdepack_transfercdepack_filerecord_id'] ;
		if( !isset($map_transfercdelinkFilerecordId_arrTransfercdepackFilerecordIds[$transfercdelink_filerecord_id]) ) {
			$map_transfercdelinkFilerecordId_arrTransfercdepackFilerecordIds[$transfercdelink_filerecord_id] = array(); 
		}
		if( !in_array($transfercdepack_filerecord_id,$map_transfercdelinkFilerecordId_arrTransfercdepackFilerecordIds[$transfercdelink_filerecord_id]) ) {
			$map_transfercdelinkFilerecordId_arrTransfercdepackFilerecordIds[$transfercdelink_filerecord_id][] = $transfercdepack_filerecord_id ;
		}
	}
	
	
	
	
	$ttmp = specDbsLam_transfer_getTransferCdePack( array('filter_transferFilerecordId'=>$transfer_filerecord_id) ) ;
	$rows_transferPack = $ttmp['data'] ;
	
	$map_transfercdepackFilerecordId_status = array() ;
	foreach( $rows_transferPack as $rows_transferPack ) {
		$transfercdepack_filerecord_id = $rows_transferPack['transfercdepack_filerecord_id'] ;
		
		$status = 'SHIP_NONE' ;
		if( $rows_transferPack['status_is_out'] ) {
			$status = 'SHIP_OK' ;
		}
		$map_transfercdepackFilerecordId_status[$transfercdepack_filerecord_id] = $status ;
	}
	
	
	
	
	$map_cdeligFilerecordId_arrStatuses = array() ;
	$query = "SELECT tcl.field_FILE_TRSFRCDENEED_ID, tcl.field_FILE_CDELIG_ID, tcl.filerecord_id
				FROM view_file_TRANSFER_CDE_LINK tcl
				WHERE filerecord_parent_id='{$transfer_filerecord_id}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$cdeligFilerecordId = $arr[1] ;
		$transfercdeneedFilerecordId = $arr[0] ;
		$transfercdelinkFilerecordId = $arr[2] ;
		
		if( isset($map_transfercdeneedFilerecordId_status[$transfercdeneedFilerecordId]) ) {
			$map_cdeligFilerecordId_arrStatuses[] = $map_transfercdeneedFilerecordId_status[$transfercdeneedFilerecordId] ;
		}
		if( isset($map_transfercdelinkFilerecordId_status[$transfercdelinkFilerecordId]) ) {
			$map_cdeligFilerecordId_arrStatuses[] = $map_transfercdelinkFilerecordId_status[$transfercdelinkFilerecordId] ;
		}
		if( isset($map_transfercdelinkFilerecordId_arrTransfercdepackFilerecordIds[$transfercdelinkFilerecordId]) ) {
			foreach( $map_transfercdelinkFilerecordId_arrTransfercdepackFilerecordIds[$transfercdelinkFilerecordId] as $transfercdepack_filerecord_id ) {
				$map_cdeligFilerecordId_arrStatuses[] = $map_transfercdepackFilerecordId_status[$transfercdepack_filerecord_id]
			}
		}
	}
	
	$statusesChain = array('PICK_NONE','PICK_CUR','PACK_NONE','PACK_CUR','SHIP_NONE','SHIP_OK') ;
	$map_cdeligFilerecordId_status = array() ;
	foreach( $map_cdeligFilerecordId_arrStatuses as $cdeligFilerecordId => $arrStatuses ) {
		$map_cdeligFilerecordId_status[$cdeligFilerecordId] = '' ;
		foreach( $statusesChain as $statusTest ) {
			if( in_array($statusTest,$arrStatuses) ) {
				$map_cdeligFilerecordId_status[$cdeligFilerecordId] = $statusTest ;
				continue 2 ;
			}
		}
	}
	
	$map_cdeFilerecordId_arrStatuses = array() ;
	$query = "SELECT cl.filerecord_parent_id, cl.filerecord_id
				FROM view_file_TRANSFER_CDE_LINK tcl
				INNER JOIN view_file_CDE_LIG cl ON cl.filerecord_id=tcl.field_FILE_CDELIG_ID
				WHERE tcl.filerecord_parent_id='{$transfer_filerecord_id}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$cdeligFilerecordId = $arr[1] ;
		$cdeFilerecordId = $arr[0] ;
		
		if( !is_array($map_cdeFilerecordId_arrStatuses[$cdeFilerecordId]) ) {
			$map_cdeFilerecordId_arrStatuses[$cdeFilerecordId] = array() ;
		}
		$status_lig = $map_cdeligFilerecordId_status[$cdeligFilerecordId] ;
		if( !$status_lig ) {
			continue ;
		}
		if( !in_array($status_lig,$map_cdeFilerecordId_arrStatuses[$cdeFilerecordId]) ) {
			$map_cdeFilerecordId_arrStatuses[$cdeFilerecordId][] = $status_lig ;
		}
	}
	
	$statusesChain = array('PICK_NONE','PICK_CUR','PACK_NONE','PACK_CUR','SHIP_NONE','SHIP_OK') ;
	$map_cdeFilerecordId_status = array() ;
	foreach( $map_cdeFilerecordId_arrStatuses as $cdeFilerecordId => $arrStatuses ) {
		$map_cdeFilerecordId_status[$cdeFilerecordId] = '' ;
		foreach( $statusesChain as $statusTest ) {
			if( in_array($statusTest,$arrStatuses) ) {
				$map_cdeFilerecordId_status[$cdeFilerecordId] = $statusTest ;
				continue 2 ;
			}
		}
	}
	
	foreach( $map_cdeFilerecordId_status as $cdeFilerecordId => $status ) {
		switch($status) {
			case 'SHIP_OK' :
				$statuscode = '100' ;
				break ;
			case 'SHIP_NONE' :
				$statuscode = '80' ;
				break ;
			case 'PACK_CUR' :
				$statuscode = '70' ;
				break ;
			case 'PACK_NONE' :
				$statuscode = '60' ;
				break ;
			case 'PICK_CUR' :
				$statuscode = '50' ;
				break ;
			case 'PICK_NONE' :
			default :
				//$statuscode = '40' ;
				continue 2 ;
		}
		
		$query = "UPDATE view_file_CDE SET field_STATUS = '{$statuscode}' 
				WHERE filerecord_id='{$cdeFilerecordId}' AND field_STATUS>='40'"  ;
		$_opDB->query($query) ;
	}
	
	
	
	
	
}



function specDbsLam_lib_procCde_searchStock( $whse_src, $stk_prod, $qty_search, $resupply_transferStep_filerecordId=0 ) {
	global $_opDB ;
	
	if( !$resupply_transferStep_filerecordId ) {
		return specDbsLam_lib_procCde_searchStock_doSearch( $whse_src, $stk_prod, $qty_search ) ;
	}
	
	// document pour descente picking ?
	$resupply_transferLigFilerecordIds = array() ;
	while( TRUE ) {
		$resupply_stkIds = array() ;
		$query = "SELECT stkdst.filerecord_id
					FROM view_file_TRANSFER_STEP ts
					JOIN view_file_TRANSFER_LIG tl 
						ON tl.filerecord_parent_id=ts.filerecord_parent_id 
						AND tl.field_TRANSFERSTEP_IDX=ts.field_TRANSFERSTEP_IDX
					JOIN view_file_MVT mvt ON mvt.filerecord_id=tl.field_FILE_MVT_ID
					JOIN view_file_STOCK stkdst ON stkdst.filerecord_id=mvt.field_DST_FILE_STOCK_ID
					WHERE ts.filerecord_id='$resupply_transferStep_filerecordId'" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$resupply_stkIds[] = $arr[0] ;
		}
	
		$qty = $qty_search ;
		$arr_results = specDbsLam_lib_procCde_searchStock_doSearch( $whse_src, $stk_prod, $qty, $from_picking=TRUE, $resupply_stkIds ) ;
		if( $qty<=0 ) {
			return $arr_results ;
		}
		
		// tentative reappro ?
		$tranferligFilerecordId = specDbsLam_lib_procCde_searchStock_doResupply( $whse_src, $stk_prod, $resupply_transferStep_filerecordId ) ;
		if( !$tranferligFilerecordId ) {
			break ;
		}
		$resupply_transferLigFilerecordIds[] = $tranferligFilerecordId ;
		continue ;
	}
	
	if( $echec=TRUE ) {
		// clean reappros
		
	}
	
	return $arr_results ;
}
function specDbsLam_lib_procCde_searchStock_doResupply( $whse_src, $stk_prod, $resupply_transferStep_filerecordId ) {
	global $_opDB ;
	
	// selection du stock
	$adr_treenodes = paracrm_data_getBibleTreeBranch( 'ADR', $whse_src ) ;
	$query = "SELECT stk.* FROM view_file_STOCK stk";
	$query.= " JOIN view_bible_ADR_entry adr ON adr.entry_key=stk.field_ADR_ID" ;
	$query.= " WHERE 1 AND stk.field_PROD_ID='{$stk_prod}'" ;
	$query.= " AND field_QTY_AVAIL>'0' AND field_QTY_PREIN='0' AND field_QTY_OUT='0'" ;
	$query.= " AND adr.treenode_key IN ".$_opDB->makeSQLlist($adr_treenodes) ;
	$query.= " AND (adr.field_CONT_IS_ON='1' AND adr.field_CONT_IS_PICKING='0')" ;
	$query.= " ORDER BY field_LAM_DATEUPDATE ASC" ;
	$query.= " LIMIT 1" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return NULL ;
	}
	$arr = $_opDB->fetch_row($result) ;
	$stk_filerecordId = $arr[0] ;
	
	// DB row 
	$query = "SELECT * FROM view_file_TRANSFER_STEP WHERE filerecord_id='{$resupply_transferStep_filerecordId}'" ;
	$result = $_opDB->query($query) ;
	$transferStep_DB = $_opDB->fetch_assoc($result) ;
	if( !$transferStep_DB ) {
		echo NULL ;
	}
	$transfer_filerecordId = $transferStep_DB['filerecord_parent_id'] ;
	
	// inscription du mvt
	$mvt_filerecordId = specDbsLam_lib_procMvt_addStock( $whse_src, $whse_src, $stk_filerecordId ) ;
	$transfer_row = array(
		'field_TRANSFERSTEP_IDX' => $transferStep_DB['field_TRANSFERSTEP_IDX'],
		'field_FILE_MVT_ID' => $mvt_filerecordId
	);
	$transferLig_filerecordId = paracrm_lib_data_insertRecord_file('TRANSFER_LIG',$transfer_filerecordId,$transfer_row) ;
	
	// fetch transferlig row
	$ttmp = specDbsLam_transfer_getTransferLig( array(
		'filter_transferLigFilerecordId_arr'=>json_encode(array($transferLig_filerecordId))
	) ) ;
	$row_transferLig = reset($ttmp['data']) ;
	
	// search Adr PICKING ?
	$resupply_adrId = specDbsLam_lib_proc_findAdr($row_transferLig,$whse_src,$topicking=TRUE) ;
	if( !$resupply_adrId ) {
		paracrm_lib_data_deleteRecord_file('TRANSFER_LIG',$transferLig_filerecordId) ;
		specDbsLam_lib_procMvt_delMvt($mvt_filerecordId) ;
		return NULL ;
	}
	specDbsLam_lib_procMvt_setDstAdr( $mvt_filerecordId, $resupply_adrId ) ;
	
	return $transferLig_filerecordId ;
}
function specDbsLam_lib_procCde_searchStock_doSearch( $whse_src, $stk_prod, &$qty, $from_picking=false, $resupply_stkIds=array() ) {
	global $_opDB ;
	
	if( $from_picking===false ) {
		$mstr = array() ;
		for( $i=1 ; $i>=0 ; $i-- ) {
			$mstr = array_merge($mstr,specDbsLam_lib_procCde_searchStock_doSearch($whse_src, $stk_prod, $qty, $i)) ;
		}
		if( $qty<=0 ) {
			return $mstr ;
		}
		return array() ;
	}
	
	$adr_treenodes = paracrm_data_getBibleTreeBranch( 'ADR', $whse_src ) ;
	
	$arr_results = array() ;
	$query = "SELECT stk.* FROM view_file_STOCK stk";
	$query.= " JOIN view_bible_ADR_entry adr ON adr.entry_key=stk.field_ADR_ID" ;
	$query.= " WHERE 1 AND stk.field_PROD_ID='{$stk_prod}'" ;
	$query.= " AND adr.treenode_key IN ".$_opDB->makeSQLlist($adr_treenodes) ;
	if( $from_picking ) {
		$query.= " AND (adr.field_CONT_IS_ON='0' OR (adr.field_CONT_IS_ON='1' AND adr.field_CONT_IS_PICKING='1'))" ;
	}
	$query.= " ORDER BY field_LAM_DATEUPDATE ASC" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		if( $qty <= 0 ) {
			break ;
		}
		$qty_stock = $arr['field_QTY_AVAIL'] ;
		if( in_array($arr['filerecord_id'],$resupply_stkIds) ) {
			$qty_stock = $arr['field_QTY_AVAIL']+$arr['field_QTY_PREIN'] ;
		}
		$qty_mvt = min($qty,$qty_stock) ;
		if( $qty_mvt <= 0 ) {
			continue ;
		}
		
		$arr_results[] = array(
			'stock_filerecord_id' => $arr['filerecord_id'],
			'qty_mvt' => $qty_mvt
		);
		$qty -= $qty_mvt ;
	}
	return $arr_results ;
}





function specDbsLam_lib_procCde_shipPackCreate( $transfer_filerecord_id, $cde_filerecord_id=NULL ) {
	$sscc = NULL // proc TMS
}
function specDbsLam_lib_procCde_shipPackAssociate( $transferpack_filerecord_id, $transferlig_filerecord_id ) {

}


?>
