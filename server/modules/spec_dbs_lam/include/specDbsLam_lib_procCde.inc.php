<?php

function specDbsLam_lib_procCde_calcNeeds($transfer_filerecord_id) {
	global $_opDB ;
	
	$query = "SELECT mvtflow.field_IS_CDE, mvtflow.field_CDE_PROCESS FROM view_file_TRANSFER t
				JOIN view_bible_CFG_MVTFLOW_tree mvtflow ON mvtflow.treenode_key=t.field_FLOW_CODE
				WHERE t.filerecord_id='{$transfer_filerecord_id}'" ;
	$result = $_opDB->query($query) ;
	$arr = $_opDB->fetch_row($result) ;
	$cfg_isCde = !(!$arr[0]) ;
	$cfg_cdeProcess = $arr[1] ;
	
	if( !$cfg_isCde ) {
		return ;
	}
	
	$arrGroupBys = NULL ;
	switch( $cfg_cdeProcess ) {
		case 'SINGLE' :
			$arrGroupBys = array('cde_filerecord_id','cde_prod') ;
			break ;
		
		case 'GROUP_ALL' :
			$arrGroupBys = array('cde_prod') ;
			break ;
		
		default :
			return ;
	}
	
	
	$map_groupBy_qty = array() ;
	$map_groupBy_fields = array() ;
	$map_groupBy_arrTransfercdelinkFilerecordIds = array() ;
	$query = "SELECT cl.filerecord_parent_id as cde_filerecord_id, cl.filerecord_id as cdelig_filerecord_id
					, tcl.filerecord_id as transfercdelink_filerecord_id
					, cl.field_PROD_ID as cde_prod
					, cl.field_QTY_CDE as qty_cde
				FROM view_file_CDE_LIG cl
				INNER JOIN view_file_TRANSFER_CDE_LINK tcl ON tcl.filerecord_id=cl.field_FILE_TRSFRCDELINK_ID
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
				case 'cde_prod' :
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

function specDbsLam_lib_procCde_syncLinks($transfer_filerecord_id) {
	global $_opDB ;
	
	// for each needs => qty allocated
	// for each need => none / partial / complete
	// -> map_cdelig_status
	// -> advance/rewind cde statuses
	$map_transfercdeneedFilerecordId_status = array() ;
	$query = "SELECT tcn.filerecord_id, tcn.field_QTY_NEED, sum(m.field_QTY_MVT) FROM view_file_TRANSFER_CDE_NEED tcn
			JOIN view_file_TRANSFER t ON t.filerecord_id = tcn.filerecord_parent_id
			LEFT OUTER JOIN view_file_TRANSFER_LIG tl ON tl.field_FILE_TRSFRCDENEED_ID = tcn.filerecord_id
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
				WHERE filerecord_parent_id='{$transfer_filerecord_id}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$cdeligFilerecordId = $arr[1] ;
		$transfercdeneedFilerecordId = $arr[0] ;
		
		$map_cdeligFilerecordId_status[$cdeligFilerecordId] = $map_transfercdeneedFilerecordId_status[$transfercdeneedFilerecordId] ;
	}
	
	$map_cdeFilerecordId_arrStatuses = array() ;
	$query = "SELECT cl.filerecord_parent_id, cl.filerecord_id
				FROM view_file_CDE_LIG cl
				INNER JOIN view_file_TRANSFER_CDE_LINK tcl ON tcl.filerecord_id=cl.field_FILE_TRSFRCDELINK_ID
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
	
	
	
	
	$map_transfercdeneedFilerecordId_arrStatuses = array() ;
	$ttmp = specDbsLam_transfer_getTransferLig( array('filter_transferFilerecordId'=>$transfer_filerecord_id) ) ;
	$rows_transferLig = $ttmp['data'] ;
	foreach( $rows_transferLig as $row_transferLig ) {
		$status = 'INIT' ;
		if( $row_transferLig['status_is_ok'] ) {
			$status = 'OK' ;
		}
		if( $row_transferLig['current_adr'] && $row_transferLig['src_adr']!=$row_transferLig['current_adr'] ) {
			$status = 'PICK' ;
		}
		
		$transfercdeneed_filerecord_id = $row_transferLig['transfercdeneed_filerecord_id'] ;
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
			$status = 'PICK' ;
		} else {
			$status = reset($arrStatuses) ;
		}
		$map_transfercdeneedFilerecordId_status[$transfercdeneed_filerecord_id] = $status ;
	}
	
	$map_cdeligFilerecordId_status = array() ;
	$query = "SELECT tcl.field_FILE_TRSFRCDENEED_ID, tcl.field_FILE_CDELIG_ID
				FROM view_file_TRANSFER_CDE_LINK tcl
				WHERE filerecord_parent_id='{$transfer_filerecord_id}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$cdeligFilerecordId = $arr[1] ;
		$transfercdeneedFilerecordId = $arr[0] ;
		
		$map_cdeligFilerecordId_status[$cdeligFilerecordId] = $map_transfercdeneedFilerecordId_status[$transfercdeneedFilerecordId] ;
	}
	
	$map_cdeFilerecordId_arrStatuses = array() ;
	$query = "SELECT cl.filerecord_parent_id, cl.filerecord_id
				FROM view_file_CDE_LIG cl
				INNER JOIN view_file_TRANSFER_CDE_LINK tcl ON tcl.filerecord_id=cl.field_FILE_TRSFRCDELINK_ID
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
				$status = '' ;
				break ;
			}
			if( count($arrStatuses)>1 ) {
				$status = 'PICK' ;
				break ;
			}
			$status = reset($arrStatuses) ;
			break ;
		}
		$map_cdeFilerecordId_status[$cdeFilerecordId] = $status ;
	}
	
	foreach( $map_cdeFilerecordId_status as $cdeFilerecordId => $status ) {
		switch($status) {
			case 'OK' :
				$statuscode = '100' ;
				break ;
			case 'PICK' :
				$statuscode = '80' ;
				break ;
			case 'INIT' :
				$statuscode = '40' ;
				break ;
			default :
				continue 2 ;
		}
		
		$query = "UPDATE view_file_CDE SET field_STATUS = '{$statuscode}' 
				WHERE filerecord_id='{$cdeFilerecordId}' AND field_STATUS>='40'"  ;
		$_opDB->query($query) ;
	}
	
	
	
	
	
	
}





function specDbsLam_lib_procCde_searchStock( $stk_prod, &$qty, $from_picking=false) {
	global $_opDB ;
	
	if( $from_picking===false ) {
		$mstr = array() ;
		for( $i=1 ; $i>=0 ; $i-- ) {
			$mstr = array_merge($mstr,specDbsLam_lib_procCde_searchStock($stk_prod, $qty, $i)) ;
		}
		if( $qty<=0 ) {
			return $mstr ;
		}
		return array() ;
	}
	
	$arr_results = array() ;
	$query = "SELECT stk.* FROM view_file_STOCK stk";
	$query.= " JOIN view_bible_ADR_entry adr ON adr.entry_key=stk.field_ADR_ID" ;
	$query.= " WHERE 1 AND stk.field_PROD_ID='{$stk_prod}'" ;
	if( $from_picking ) {
		$query.= " AND (adr.field_CONT_IS_ON='0' OR (adr.field_CONT_IS_ON='1' AND adr.field_CONT_IS_PICKING='1'))" ;
	}
	$query.= " ORDER BY field_LAM_DATEUPDATE ASC" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		if( $qty <= 0 ) {
			break ;
		}
		$qty_mvt = min($qty,$arr['field_QTY_AVAIL']) ;
		
		$arr_results[] = array(
			'stock_filerecord_id' => $arr['filerecord_id'],
			'qty_mvt' => $qty_mvt
		);
		$qty -= $qty_mvt ;
	}
	return $arr_results ;
}
?>
