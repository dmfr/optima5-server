<?php

function specDbsLam_transfer_getTransfer($post_data) {
	global $_opDB ;
	
	$TAB = array() ;
	
	$query = "SELECT * FROM view_file_TRANSFER" ;
	if( $post_data['filter_transferFilerecordId'] ) {
		$query.= " WHERE filerecord_id='{$post_data['filter_transferFilerecordId']}'" ;
	} else {
		$query.= " ORDER BY filerecord_id DESC" ;
	}
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$filerecord_id = $arr['filerecord_id'] ;
		$TAB[$filerecord_id] = array(
			'transfer_filerecord_id' => $arr['filerecord_id'],
			'transfer_txt' => $arr['field_TRANSFER_TXT'],
			'transfer_tpl' => $arr['field_TRANSFER_TPL'],
			'transfer_tpltxt' => $arr['field_TRANSFER_TPLTXT'],
			'status_is_on' => $arr['field_STATUS_IS_ON'],
			'status_is_ok' => $arr['field_STATUS_IS_OK'],
			'spec_cde' => !!$arr['field_SPEC_CDE'],
			'steps' => array(),
			'cde_links' => array(),
			'cde_needs' => array(),
			'ligs' => array()
		);
		if( $post_data['filter_transferFilerecordId'] && !$post_data['filter_fast'] ) {
			$ttmp = specDbsLam_transfer_getTransferLig($post_data) ;
			$TAB[$filerecord_id]['ligs'] = $ttmp['data'] ;
			
			$ttmp = specDbsLam_transfer_getTransferCdeLink($post_data) ;
			$TAB[$filerecord_id]['cde_links'] = $ttmp['data'] ;
			
			$ttmp = specDbsLam_transfer_getTransferCdeNeed($post_data) ;
			$TAB[$filerecord_id]['cde_needs'] = $ttmp['data'] ;
		}
	}
	if( !$post_data['filter_transferFilerecordId'] || (count($TAB)!=1) ) {
		return array('success'=>true, 'data'=>array_values($TAB)) ;
	}
	
	$TAB_steps = array() ;
	$filerecord_parent_id = $post_data['filter_transferFilerecordId'] ;
	$query = "SELECT * FROM view_file_TRANSFER_STEP
			WHERE filerecord_parent_id='{$filerecord_parent_id}' ORDER BY field_TRANSFERSTEP_IDX" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$filerecord_id = $arr['filerecord_id'] ;
		$TAB_steps[$filerecord_id] = array(
			'transferstep_filerecord_id' => $arr['filerecord_id'],
			'transferstep_idx' => $arr['field_TRANSFERSTEP_IDX'],
			'transferstep_txt' => $arr['field_TRANSFERSTEP_TXT'],
			'transferstep_code' => $arr['field_TRANSFERSTEP_CODE'],
			'spec_input' => !!$arr['field_SPEC_INPUT'],
			'spec_cde_picking' => !!$arr['field_SPEC_CDE_PICKING'],
			'spec_cde_packing' => !!$arr['field_SPEC_CDE_PACKING'],
			'whse_src' => $arr['field_WHSE_SRC'],
			'whse_dst' => $arr['field_WHSE_DST'],
			'forward_is_on' => $arr['field_FORWARD_IS_ON'],
			'forward_to_idx' => $arr['field_FORWARD_TO_IDX'],
			'ligs' => array()
		);
	}
	$map_idx_ligs = array() ;
	foreach( $TAB[$filerecord_parent_id]['ligs'] as $lig ) {
		$idx = $lig['transferstep_idx'] ;
		if( !isset($map_idx_ligs[$idx]) ) {
			$map_idx_ligs[$idx] = array() ;
		}
		$map_idx_ligs[$idx][] = $lig ;
	}
	foreach( $TAB_steps as &$row_step ) {
		$idx = $row_step['transferstep_idx'] ;
		if( isset($map_idx_ligs[$idx]) ) {
			$row_step['ligs'] = $map_idx_ligs[$idx] ;
		}
	}
	unset($row_step) ;
	
	
	$map_cdeNeedFilerecordId_arrCdeLinkFilerecordIds = array() ;
	foreach( $TAB[$filerecord_parent_id]['cde_links'] as $row_cdelink ) {
		$cdeNeedFilerecordId = $row_cdelink['link_transfercdeneed_filerecord_id'] ;
		if( !$cdeNeedFilerecordId ) {
			continue ;
		}
		if( !isset($map_cdeNeedFilerecordId_arrCdeLinkFilerecordIds[$cdeNeedFilerecordId]) ) {
			$map_cdeNeedFilerecordId_arrCdeLinkFilerecordIds[$cdeNeedFilerecordId] = array() ;
		}
		$map_cdeNeedFilerecordId_arrCdeLinkFilerecordIds[$cdeNeedFilerecordId][] = $row_cdelink ;
	}
	foreach( $TAB[$filerecord_parent_id]['cde_needs'] as &$row_cdeneed ) {
		$cdeNeedFilerecordId = $row_cdeneed['transfercdeneed_filerecord_id'] ;
		if( isset($map_cdeNeedFilerecordId_arrCdeLinkFilerecordIds[$cdeNeedFilerecordId]) ) {
			$row_cdeneed['cde_links'] = $map_cdeNeedFilerecordId_arrCdeLinkFilerecordIds[$cdeNeedFilerecordId] ;
		} else {
			$row_cdeneed['cde_links'] = array() ;
		}
	}
	unset($row_cdeneed) ;
	
	
	$TAB[$filerecord_parent_id]['steps'] = array_values($TAB_steps) ;
	unset($TAB[$filerecord_parent_id]['ligs']) ;
	return array('success'=>true, 'data'=>array_values($TAB)) ;
}
function specDbsLam_transfer_getTransferLig($post_data) {
	// jointure : voir specDbsPeople_Real_lib_getActivePeople
	
	global $_opDB ;
	
	// Load cfg attributes
	$ttmp = specDbsLam_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	
	
	// **************** SQL selection *****************
	$ignores = array() ;
	$selects = array() ;
	foreach( array('tl'=>'view_file_TRANSFER_LIG','mvt'=>'view_file_MVT') as $prefix=>$table ) {
		$query = "SHOW COLUMNS FROM {$table}" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$field = $arr[0] ;
			if( !(strpos($field,'field_')===0) ) {
				continue ;
			}
			$mkey = $prefix.'.'.$field ;
			if( in_array($mkey,$ignores) ) {
				continue ;
			}
			
			$selects[] = $prefix.'.'.$field ;
		}
	}
	$selects = implode(',',$selects) ;
	
	$query = "SELECT tl.filerecord_id as transferlig_filerecord_id, ts.filerecord_id as transferstep_filerecord_id, tl.filerecord_parent_id as transfer_filerecord_id
		, mvt.filerecord_id as mvt_filerecord_id
		, {$selects}
		FROM view_file_TRANSFER_LIG tl
		INNER JOIN view_file_TRANSFER_STEP ts ON ts.filerecord_parent_id = tl.filerecord_parent_id AND ts.field_TRANSFERSTEP_IDX = tl.field_TRANSFERSTEP_IDX
		INNER JOIN view_file_MVT mvt ON mvt.filerecord_id = tl.field_FILE_MVT_ID" ;
	$query.= " WHERE 1" ;
	if( $post_data['filter_transferFilerecordId'] ) {
		$query.= " AND tl.filerecord_parent_id='{$post_data['filter_transferFilerecordId']}'" ;
	}
	if( $post_data['filter_transferLigFilerecordId_arr'] ) {
		$query.= " AND tl.filerecord_id IN ".$_opDB->makeSQLlist(json_decode($post_data['filter_transferLigFilerecordId_arr'],true)) ;
	}
	$query.= " ORDER BY mvt.filerecord_id DESC" ;
	$result = $_opDB->query($query) ;
	// *********************************************
	
	
	
	$TAB = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$filerecord_id = $arr['transferlig_filerecord_id'] ;
		if( !isset($TAB[$filerecord_id]) ) {
			$row = array(
				'transfer_filerecord_id' => $arr['transfer_filerecord_id'],
				'transfer_flow_code' => $arr['transfer_flow_code'],
				'transferlig_filerecord_id' => $arr['transferlig_filerecord_id'],
				'transferstep_idx' => $arr['field_TRANSFERSTEP_IDX'],
				'transferstep_filerecord_id' => $arr['transferstep_filerecord_id'],
				'cdepick_transfercdeneed_filerecord_id' => $arr['field_PICK_TRSFRCDENEED_ID'],
				'cdepack_transfercdelink_filerecord_id' => $arr['field_PACK_TRSFRCDELINK_ID'],
				'cdepack_transfercdepack_filerecord_id' => $arr['field_PACK_TRSFRCDEPACK_ID'],
				'mvt_filerecord_id' => $arr['mvt_filerecord_id'],
				'soc_code' => $arr['field_SOC_CODE'],
				'container_type' => $arr['field_CONTAINER_TYPE'],
				'container_ref' => $arr['field_CONTAINER_REF'],
				'container_ref_display' => $arr['field_CONTAINER_DISPLAY'],
				'stk_prod' => $arr['field_PROD_ID'],
				'stk_batch' => $arr['field_SPEC_BATCH'],
				'stk_datelc' => $arr['field_SPEC_DATELC'],
				'stk_sn' => $arr['field_SPEC_SN'],
				'mvt_qty' => $arr['field_QTY_MVT'],
				
				'src_stk_filerecord_id' => $arr['field_SRC_FILE_STOCK_ID'],
				'src_whse' => $arr['field_SRC_WHSE'],
				'src_adr' => $arr['field_SRC_ADR_ID'],
				'dst_stk_filerecord_id' => $arr['field_DST_FILE_STOCK_ID'],
				'dst_whse' => $arr['field_DST_WHSE'],
				'dst_adr' => $arr['field_DST_ADR_ID'],
				
				'status' => null,
				'status_is_ok' => !!$arr['field_COMMIT_IS_OK'],
				
				'status_is_reject' => $arr['field_STATUS_IS_REJECT'],
				'reject_arr' => explode(',',$arr['field_REJECT_ARR']),
				'reject_txt' => $arr['field_REJECT_TXT'],
				'flag_allowgroup' => ($arr['field_FLAG_ALLOWGROUP']==1)
			);
			foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
				if( !$stockAttribute_obj['STOCK_fieldcode'] ) {
					continue ;
				}
				$mkey = $stockAttribute_obj['mkey'] ;
				$STOCK_fieldcode = $stockAttribute_obj['STOCK_fieldcode'] ;
				$row[$mkey] = $arr[$STOCK_fieldcode] ;
			}
			$TAB[$filerecord_id] = $row ;
		}
	}
	
	return array('success'=>true, 'data'=>array_values($TAB)) ;
}
function specDbsLam_transfer_getTransferCdeLink( $post_data ) {
	global $_opDB ;
	
	// **************** SQL selection *****************
	$ignores = array() ;
	$selects = array() ;
	foreach( array('tcl'=>'view_file_TRANSFER_CDE_LINK','cl'=>'view_file_CDE_LIG','c'=>'view_file_CDE') as $prefix=>$table ) {
		$query = "SHOW COLUMNS FROM {$table}" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$field = $arr[0] ;
			if( !(strpos($field,'field_')===0) ) {
				continue ;
			}
			$mkey = $prefix.'.'.$field ;
			if( in_array($mkey,$ignores) ) {
				continue ;
			}
			
			$selects[] = $prefix.'.'.$field ;
		}
	}
	$selects = implode(',',$selects) ;
	
	
	$query = "SELECT tcl.filerecord_id AS transfercdelink_filerecord_id
		, tcl.field_FILE_TRSFRCDENEED_ID as link_transfercdeneed_filerecord_id
		, t.filerecord_id AS transfer_filerecord_id
		, c.filerecord_id AS cde_filerecord_id
		, cl.filerecord_id AS cdelig_filerecord_id
		, {$selects}
		FROM view_file_TRANSFER_CDE_LINK tcl
		INNER JOIN view_file_TRANSFER t ON t.filerecord_id = tcl.filerecord_parent_id
		INNER JOIN view_file_CDE_LIG cl ON cl.filerecord_id = tcl.field_FILE_CDELIG_ID
		INNER JOIN view_file_CDE c ON c.filerecord_id = cl.filerecord_parent_id" ;
	$query.= " WHERE 1" ;
	if( $post_data['filter_transferFilerecordId'] ) {
		$query.= " AND t.filerecord_id='{$post_data['filter_transferFilerecordId']}'" ;
	}
	if( $post_data['filter_transferCdeLinkFilerecordId_arr'] ) {
		$query.= " AND tcl.filerecord_id IN ".$_opDB->makeSQLlist(json_decode($post_data['filter_transferCdeLinkFilerecordId_arr'],true)) ;
	}
	$query.= " ORDER BY transfercdelink_filerecord_id DESC" ;
	$result = $_opDB->query($query) ;
	$TAB = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$row = array(
			'cde_filerecord_id' => $arr['cde_filerecord_id'],
			'cdelig_filerecord_id' => $arr['cdelig_filerecord_id'],
			'transfercdelink_filerecord_id' => $arr['transfercdelink_filerecord_id'],
			'transfer_filerecord_id' => $arr['transfer_filerecord_id'],
			'lig_id' => $arr['field_LIG_ID'],
			'cde_nr' => $arr['field_CDE_NR'],
			'stk_prod' => $arr['field_PROD_ID'],
			'qty_comm' => $arr['field_QTY_COMM'],
			'qty_cde' => $arr['field_QTY_CDE'],
			'link_transfercdeneed_filerecord_id' => $arr['link_transfercdeneed_filerecord_id']
		);
		$TAB[] = $row ;
	}
	
	return array('success'=>true, 'data'=>$TAB) ;
}
function specDbsLam_transfer_getTransferCdeNeed( $post_data ) {
	global $_opDB ;
	
	// **************** SQL selection *****************
	$ignores = array() ;
	$selects = array() ;
	foreach( array('tcn'=>'view_file_TRANSFER_CDE_NEED') as $prefix=>$table ) {
		$query = "SHOW COLUMNS FROM {$table}" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$field = $arr[0] ;
			if( !(strpos($field,'field_')===0) ) {
				continue ;
			}
			$mkey = $prefix.'.'.$field ;
			if( in_array($mkey,$ignores) ) {
				continue ;
			}
			
			$selects[] = $prefix.'.'.$field ;
		}
	}
	$selects = implode(',',$selects) ;
	
	
	$query = "SELECT tcn.filerecord_id AS transfercdeneed_filerecord_id
		, t.filerecord_id AS transfer_filerecord_id
		, {$selects}
		FROM view_file_TRANSFER_CDE_NEED tcn
		INNER JOIN view_file_TRANSFER t ON t.filerecord_id = tcn.filerecord_parent_id" ;
	$query.= " WHERE 1" ;
	if( $post_data['filter_transferFilerecordId'] ) {
		$query.= " AND t.filerecord_id='{$post_data['filter_transferFilerecordId']}'" ;
	}
	if( $post_data['filter_transferCdeNeedFilerecordId_arr'] ) {
		$query.= " AND tcn.filerecord_id IN ".$_opDB->makeSQLlist(json_decode($post_data['filter_transferCdeNeedFilerecordId_arr'],true)) ;
	}
	$query.= " ORDER BY transfercdeneed_filerecord_id DESC" ;
	$result = $_opDB->query($query) ;
	$TAB = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$row = array(
			'transfercdeneed_filerecord_id' => $arr['transfercdeneed_filerecord_id'],
			'transfer_filerecord_id' => $arr['transfer_filerecord_id'],
			'need_txt' => $arr['field_NEED_TXT'],
			'cde_filerecord_id' => $arr['field_FILE_CDE_ID'],
			'stk_prod' => $arr['field_PROD_ID'],
			'qty_need' => (float)$arr['field_QTY_NEED'],
			'qty_alloc' => (float)$arr['field_QTY_ALLOC'],
		);
		$TAB[] = $row ;
	}
	
	return array('success'=>true, 'data'=>$TAB) ;
}
function specDbsLam_transfer_getTransferCdePack( $post_data ) {
	global $_opDB ;
	
	// **************** SQL selection *****************
	$ignores = array() ;
	$selects = array() ;
	foreach( array('tcp'=>'view_file_TRANSFER_CDE_PACK') as $prefix=>$table ) {
		$query = "SHOW COLUMNS FROM {$table}" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$field = $arr[0] ;
			if( !(strpos($field,'field_')===0) ) {
				continue ;
			}
			$mkey = $prefix.'.'.$field ;
			if( in_array($mkey,$ignores) ) {
				continue ;
			}
			
			$selects[] = $prefix.'.'.$field ;
		}
	}
	$selects = implode(',',$selects) ;
	
	
	$query = "SELECT tcp.filerecord_id AS transfercdepack_filerecord_id
		, t.filerecord_id AS transfer_filerecord_id
		, {$selects}
		FROM view_file_TRANSFER_CDE_PACK tcp
		INNER JOIN view_file_TRANSFER t ON t.filerecord_id = tcp.filerecord_parent_id" ;
	$query.= " WHERE 1" ;
	if( $post_data['filter_transferFilerecordId'] ) {
		$query.= " AND t.filerecord_id='{$post_data['filter_transferFilerecordId']}'" ;
	}
	if( $post_data['filter_transferCdePackFilerecordId_arr'] ) {
		$query.= " AND tcp.filerecord_id IN ".$_opDB->makeSQLlist(json_decode($post_data['filter_transferCdePackFilerecordId_arr'],true)) ;
	}
	$query.= " ORDER BY transfercdepack_filerecord_id DESC" ;
	$result = $_opDB->query($query) ;
	$TAB = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$row = array(
			'transfercdepack_filerecord_id' => $arr['transfercdepack_filerecord_id'],
			'transfer_filerecord_id' => $arr['transfer_filerecord_id'],
			'cde_filerecord_id' => $arr['field_FILE_CDE_ID'],
			'id_sscc' => $arr['field_ID_SSCC'],
			'id_trspt_code' => $arr['field_ID_TRSPT_CODE'],
			'id_trspt_id' => $arr['field_ID_TRSPT_ID'],
			'calc_kg' => (float)$arr['field_CALC_KG'],
			'calc_m3' => (float)$arr['field_CALC_M3'],
		);
		$TAB[] = $row ;
	}
	
	return array('success'=>true, 'data'=>$TAB) ;
}




function specDbsLam_transfer_addStock( $post_data ) {
	global $_opDB ;
	
	$transfer_filerecordId = $post_data['transfer_filerecordId'] ;
	$transferStep_filerecordId = $post_data['transferStep_filerecordId'] ;
	$stock_objs = json_decode($post_data['stock_objs'],true) ;
	
	$formard_post = array(
		'filter_transferFilerecordId' => $transfer_filerecordId,
		'filter_fast' => true
	) ;
	$json = specDbsLam_transfer_getTransfer($formard_post) ;
	$transfer_row = reset($json['data']) ;
	$transferstep_row = NULL ;
	if( !$transfer_row ) {
		return array('success'=>false) ;
	}
	foreach( $transfer_row['steps'] as $transferstep_iter ) {
		if( $transferstep_iter['transferstep_filerecord_id'] == $transferStep_filerecordId ) {
			$transferstep_row = $transferstep_iter ;
		}
	}
	if( !$transferstep_row ) {
		return array('success'=>false) ;
	}
	
	
	
	$blacklist_specs = array('spec_cde_picking','spec_cde_packing') ;
	foreach( $blacklist_specs as $blacklist_spec ) {
		if( $transferstep_row[$blacklist_spec] ) {
			return array('success'=>false) ;
		}
	}
	
	foreach( $stock_objs as $stock_obj ) {
		if( $stock_obj['stkData_obj'] ) {
			$stock_obj['stk_filerecord_id'] = specDbsLam_lib_procMvt_createNewStk($stock_obj['stkData_obj']) ;
		}
		
		$mvt_filerecordId = specDbsLam_lib_procMvt_addStock( $transferstep_row['whse_src'], $transferstep_row['whse_dst'], $stock_obj['stk_filerecord_id'], $stock_obj['mvt_qty'] ) ;
		$query = "SELECT * FROM view_file_MVT WHERE filerecord_id='{$mvt_filerecordId}'" ;
		$result = $_opDB->query($query) ;
		$row_mvt = $_opDB->fetch_assoc($result) ;
		
		$transfer_row = array(
			'field_TRANSFERSTEP_IDX' => $transferstep_row['transferstep_idx'],
			'field_FILE_MVT_ID' => $mvt_filerecordId
		);
		$ids[] = paracrm_lib_data_insertRecord_file('TRANSFER_LIG',$transfer_filerecordId,$transfer_row) ;
		
		if( !($stock_obj['dst_whse'] && $stock_obj['dst_adr']) ) {
			continue ;
		}
		// Load warehouse treenodes
		//$adr_treenodes = paracrm_data_getBibleTreeBranch( 'ADR', $stock_obj['dst_whse'] ) ;
		specDbsLam_lib_procMvt_setDstAdr( $mvt_filerecordId, $stock_obj['dst_adr'] ) ;
		if( !$stock_obj['commit'] ) {
			continue ;
		}
		specDbsLam_lib_procMvt_commit( $mvt_filerecordId ) ;
		$has_commit = true ;
	}
	
	if( $has_commit ) {
		specDbsLam_transfer_lib_advanceDoc( $transfer_filerecordId ) ;
	}
	
	return array('success'=>true, 'ids'=>$ids, 'debug'=>$stock_objs) ;
}
function specDbsLam_transfer_removeStock( $post_data ) {
	global $_opDB ;
	
	$transferLig_filerecordIds = json_decode($post_data['transferLig_filerecordIds'],true) ;
	
	//controle $transfer_filerecordId ?
	
	
	foreach( $transferLig_filerecordIds as $transferLig_filerecordId ) {
		// mvt ID ?
		$query = "SELECT field_FILE_MVT_ID FROM view_file_TRANSFER_LIG WHERE filerecord_id='{$transferLig_filerecordId}'" ;
		$mvt_filerecordId = $_opDB->query_uniqueValue($query) ;
		if( !$mvt_filerecordId ) {
			continue ;
		}
		if( specDbsLam_lib_procMvt_delMvt($mvt_filerecordId) ) {
			paracrm_lib_data_deleteRecord_file( 'TRANSFER_LIG' , $transferLig_filerecordId ) ;
		}
	}
	
	
	return array('success'=>true) ;
}
function specDbsLam_transfer_setFlag( $post_data ) {
	global $_opDB ;
	
	$transferLig_filerecordIds = json_decode($post_data['transferLig_filerecordIds'],true) ;
	$p_flagCode = $post_data['flag_code'] ;
	$p_flagValue = $post_data['flag_value'] ;
	
	foreach( $transferLig_filerecordIds as $transferLig_filerecordId ) {
		$arr_update = array() ;
		switch( $p_flagCode ) {
			case 'ALLOWGROUP' ;
				$arr_update['field_FLAG_ALLOWGROUP'] = ($p_flagValue ? 1 : 0) ;
				break ;
			default :
				break ;
		}
		$arr_cond = array() ;
		$arr_cond['filerecord_id'] = $transferLig_filerecordId ;
		$_opDB->update('view_file_TRANSFER_LIG',$arr_update,$arr_cond) ;
	}
	return array('success'=>true) ;
}
function specDbsLam_transfer_rollback( $post_data ) {
	global $_opDB ;
	
	$transfer_filerecordId = $post_data['transfer_filerecordId'] ;
	$transferStep_filerecordId = $post_data['transferStep_filerecordId'] ;
	$transferLig_filerecordIds = json_decode($post_data['transferLig_filerecordIds'],true) ;
	
	//controle $transfer_filerecordId ?
	$formard_post = array(
		'filter_transferFilerecordId' => $transfer_filerecordId,
		'filter_fast' => true
	) ;
	$json = specDbsLam_transfer_getTransfer($formard_post) ;
	$transfer_row = reset($json['data']) ;
	$transferstep_row = NULL ;
	if( !$transfer_row ) {
		return array('success'=>false) ;
	}
	foreach( $transfer_row['steps'] as $transferstep_iter ) {
		if( $transferstep_iter['transferstep_filerecord_id'] == $transferStep_filerecordId ) {
			$transferstep_row = $transferstep_iter ;
		}
	}
	if( !$transferstep_row ) {
		return array('success'=>false) ;
	}
	if( $transferstep_row['forward_is_on'] ) {
		$forwardToIdx = $transferstep_row['forward_to_idx'] ;
	}
	
	
	foreach( $transferLig_filerecordIds as $transferLig_filerecordId ) {
		// mvt ID ?
		$query = "SELECT field_FILE_MVT_ID FROM view_file_TRANSFER_LIG WHERE filerecord_id='{$transferLig_filerecordId}'" ;
		$mvt_filerecordId = $_opDB->query_uniqueValue($query) ;
		if( !$mvt_filerecordId ) {
			continue ;
		}
		
		$query = "SELECT * FROM view_file_MVT WHERE filerecord_id='{$mvt_filerecordId}'" ;
		$result = $_opDB->query($query) ;
		$row_mvt = $_opDB->fetch_assoc($result) ;
		
		$stockSrc_filerecordId = $row_mvt['field_SRC_FILE_STOCK_ID'] ;
		$stockDst_filerecordId = $row_mvt['field_DST_FILE_STOCK_ID'] ;
		
		$test_undoFormard = isset($forwardToIdx) ;
		while(TRUE) {
			$success = specDbsLam_lib_procMvt_commitUndo($mvt_filerecordId) ;
			
			// => si échec
			// if forward_is_on
			//   => tentative de delMvt du forward
			if( !$success && $test_undoFormard ) {
				$query = "SELECT ts.filerecord_id FROM view_file_TRANSFER_STEP ts
						WHERE ts.filerecord_parent_id='{$transfer_filerecordId}' AND ts.field_TRANSFERSTEP_IDX='{$forwardToIdx}'" ;
				$forwardToCancel_transferStepFilerecordId = $_opDB->query_uniqueValue($query) ;
				
				$query = "SELECT tl.filerecord_id FROM view_file_TRANSFER_LIG tl
						JOIN view_file_MVT m ON m.filerecord_id=tl.field_FILE_MVT_ID
						WHERE tl.filerecord_parent_id='{$transfer_filerecordId}' AND tl.field_TRANSFERSTEP_IDX='{$forwardToIdx}'
						AND m.field_SRC_FILE_STOCK_ID='{$stockDst_filerecordId}'" ;
				$forwardToCancel_transferLigFilerecordId = $_opDB->query_uniqueValue($query) ;
				
				$sub_post = array(
					'transfer_filerecordId' => $transfer_filerecordId,
					'transferStep_filerecordId' => $forwardToCancel_transferStepFilerecordId,
					'transferLig_filerecordIds' => json_encode(array($forwardToCancel_transferLigFilerecordId))
				) ;
				specDbsLam_transfer_removeStock($sub_post) ;
			
				$test_undoFormard = FALSE ;
				continue ;
			}
			
			if( $success && $transferstep_row['spec_input'] && $row_mvt['field_SRC_WHSE']==NULL ) { // Spec INPUT
				$sub_post = array(
					'transfer_filerecordId' => $transfer_filerecordId,
					'transferStep_filerecordId' => $transferStep_filerecordId,
					'transferLig_filerecordIds' => json_encode(array($transferLig_filerecordId))
				) ;
				specDbsLam_transfer_removeStock($sub_post) ;
				
				$query = "SELECT filerecord_id FROM view_file_STOCK WHERE filerecord_id='{$stockSrc_filerecordId}' AND field_ADR_ID='TMP_RECEP'" ;
				if( $_opDB->query_uniqueValue($query) == $stockSrc_filerecordId ) {
					paracrm_lib_data_deleteRecord_file( 'STOCK' , $stockSrc_filerecordId ) ;
				}
			}
			
			break ;
		}
	}
	
	
	return array('success'=>$success) ;
}








function specDbsLam_transfer_printDoc( $post_data ) {
	global $_opDB ;
	
	$app_root = $GLOBALS['app_root'] ;
	$resources_root=$app_root.'/resources' ;
	$templates_dir=$resources_root.'/server/templates' ;
	$_IMG['DBS_logo_bw'] = file_get_contents($templates_dir.'/'.'DBS_logo_bw.png') ;
	
		if( $post_data['transfer_filerecordId'] ) {
			$transfer_filerecordId = $post_data['transfer_filerecordId'] ;
			$step_isFinal = FALSE ;
		
			$query = "SELECT * FROM view_file_TRANSFER WHERE filerecord_id='{$transfer_filerecordId}'" ;
			$result = $_opDB->query($query) ;
			$row_transfer = $_opDB->fetch_assoc($result) ;
			
			$whseDest_isWork = $_opDB->query_uniqueValue("SELECT field_IS_WORK FROM view_bible_CFG_WHSE_entry WHERE entry_key='{$row_transfer['whse_dest']}'") ;
			$whseSrc_isWork = $_opDB->query_uniqueValue("SELECT field_IS_WORK FROM view_bible_CFG_WHSE_entry WHERE entry_key='{$row_transfer['whse_src']}'") ;
		
			$query = "UPDATE view_file_TRANSFER set field_STATUS_IS_ON='1' WHERE filerecord_id='{$transfer_filerecordId}'" ;
			$_opDB->query($query) ;
		
			$ttmp = specDbsLam_transfer_getTransferLig( array('filter_transferFilerecordId'=>$transfer_filerecordId) ) ;
			$rows_transferLig = $ttmp['data'] ;
			
			$adr_rowsTransferLig = array() ;
			foreach( $rows_transferLig as $row_transferLig ) {
				$adr = preg_replace("/[^A-Z0-9]/", "", strtoupper($row_transfer['field_TRANSFER_TXT'])) ;
				if( $whseSrc_isWork ) {
					$adr = $row_transferLig['src_adr'] ;
				}
				if( $whseDest_isWork ) {
					$adr = $row_transferLig['next_adr'] ;
				}
				if( !$tab_rowsTransferLig[$adr] ) {
					$tab_rowsTransferLig[$adr] = array(
						'adr' => $adr,
						'arr' => array()
					) ;
				}
				$tab_rowsTransferLig[$adr]['arr'][] = $row_transferLig ;
			}
		}
		if( $post_data['transferFilerecordId'] ) {
			$transfer_filerecordId = $post_data['transferFilerecordId'] ;
			$transferLig_filerecordIds = json_decode($post_data['transferLigFilerecordId_arr'],true) ;
			$transferStepCode = $post_data['transferStepCode'] ;
			
			// ****** Interro step ********
			$step_isFinal = $_opDB->query_uniqueValue("SELECT field_IS_ADR FROM view_bible_CFG_MVTFLOW_entry WHERE entry_key='{$transferStepCode}'") ;
		
			$query = "SELECT * FROM view_file_TRANSFER WHERE filerecord_id='{$transfer_filerecordId}'" ;
			$result = $_opDB->query($query) ;
			$row_transfer = $_opDB->fetch_assoc($result) ;
			
			$ttmp = specDbsLam_transfer_getTransferLig( array(
				'filter_transferFilerecordId'=>$transfer_filerecordId,
				'filter_transferLigFilerecordId_arr'=>json_encode($transferLig_filerecordIds)
			) ) ;
			$rows_transferLig = $ttmp['data'] ;
			
			$tab_rowsTransferLig = array() ;
			foreach( $rows_transferLig as $row_transferLig ) {
				$adr = ( $step_isFinal ? $row_transferLig['current_adr_entryKey'] : $row_transferLig['next_adr'] ) ; ;
				if( $step_isFinal ) {
					$tab_rowsTransferLig[] = array(
						'adr' => $adr,
						'arr' => array($row_transferLig)
					);
					continue ;
				}
				if( !$tab_rowsTransferLig[$adr] ) {
					$tab_rowsTransferLig[$adr] = array(
						'adr' => $adr,
						'arr' => array()
					) ;
				}
				$tab_rowsTransferLig[$adr]['arr'][] = $row_transferLig ;
			}
		}
		$transfer_isCde = $_opDB->query_uniqueValue("SELECT field_IS_CDE FROM view_bible_CFG_MVTFLOW_tree WHERE treenode_key='{$row_transfer['field_FLOW_CODE']}'") ;
		if( $transfer_isCde ) {
			$tab_prod_cde_qty = array() ;
			// query TRANSFER NEEDS
			$query = "SELECT cl.field_PROD_ID as stk_prod, c.field_CDE_NR as cde_nr, sum(field_QTY_CDE) as qty_cde
						FROM view_file_TRANSFER_CDE_NEED tcn
						JOIN view_file_TRANSFER_CDE_LINK tcl ON tcl.field_FILE_TRSFRCDENEED_ID=tcn.filerecord_id
						JOIN view_file_CDE_LIG cl ON cl.filerecord_id = tcl.field_FILE_CDELIG_ID
						JOIN view_file_CDE c ON c.filerecord_id = cl.filerecord_parent_id
						WHERE tcn.filerecord_parent_id='{$transfer_filerecordId}' AND (tcn.field_QTY_NEED=tcn.field_QTY_ALLOC)
						GROUP BY cl.field_PROD_ID, c.field_CDE_NR" ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
				if( !isset($tab_prod_cde_qty[$arr['stk_prod']]) ) {
					$tab_prod_cde_qty[$arr['stk_prod']] = array() ;
				}
				if( !isset($tab_prod_cde_qty[$arr['stk_prod']][$arr['cde_nr']]) ) {
					$tab_prod_cde_qty[$arr['stk_prod']][$arr['cde_nr']] = 0 ;
				}
				$tab_prod_cde_qty[$arr['stk_prod']][$arr['cde_nr']]+= $arr['qty_cde'] ;
			}
			
			//print_r($tab_prod_cde_qty) ;
		}
	
	$title = ( $step_isFinal ? 'MISE EN STOCK' : 'BORDEREAU DE TRANSFERT' );
		
	$buffer = '' ;
	$is_first = TRUE ;
	if( !$step_isFinal && !$post_data['printEtiq'] ) {
		ksort($tab_rowsTransferLig) ;
		$tab_rowsTransferLig = array_values($tab_rowsTransferLig) ;
	} else {
		$arr_stkFilerecordId = array() ;
		foreach( $tab_rowsTransferLig as $ttmp ) {
			$rows_transferLig = $ttmp['arr'] ;
			foreach( $rows_transferLig as $row_transferLig ) {
				foreach( array_reverse($row_transferLig['steps']) as $row_transferLigStepFinal ) {
					if( $row_transferLigStepFinal['commit_file_stock_id'] ) {
						$arr_stkFilerecordId[] = $row_transferLigStepFinal['commit_file_stock_id'] ;
						continue 2 ;
					}
				}
			}
		}
		return specDbsLam_stock_printEtiq( array('stock_filerecordIds'=>json_encode($arr_stkFilerecordId)) ) ;
	}
	
	foreach( $tab_rowsTransferLig as $ttmp ) {
		$adr = $ttmp['adr'] ;
		$rows_transferLig = $ttmp['arr'] ;
	
		$adr_str = $adr ;
		
		if( $is_first ) {
			$is_first = FALSE ;
		} else {
			$buffer.= '<DIV style="page-break-after:always"></DIV>' ;
		}
		$buffer.= '<DIV style="page-break-after:always"></DIV>' ;
		$buffer.= "<table border='0' cellspacing='1' cellpadding='1'>" ;
		$buffer.= "<tr><td width='5'/><td width='200'>" ;
			$buffer.= '<div align="center">' ;
			$buffer.= '<img src="data:image/jpeg;base64,'.base64_encode(specDbsLam_lib_getBarcodePng($adr,75)).'" /><br>' ;
			$buffer.= $adr.'<br>' ;
			$buffer.= '</div>' ;
		$buffer.= "</td><td valign='middle' width='400'>" ;
			$buffer.= "<table cellspacing='0' cellpadding='1'>";
			$buffer.= "<tr><td><span class=\"mybig\">{$title}</span></td></tr>" ;
			//{$data_commande['date_exp']}
			$buffer.= "<tr><td><span class=\"verybig\"><b>{$row_transfer['field_TRANSFER_TXT']}</b></span>&nbsp;&nbsp;<br>&nbsp;&nbsp;<big>printed on <b>".date('d/m/Y H:i')."</b></big></td></tr>" ;
			$buffer.= "<tr><td><span class=\"verybig\">BIN / CONTAINER : <b>{$adr_str}</b></td></tr>" ;
			$buffer.= "</table>";
		$buffer.= "</td><td valign='middle' align='center' width='120'>" ;
			//$buffer.= "<img src=\"data:image/jpeg;base64,".base64_encode($_IMG['DBS_logo_bw'])."\" />" ;
		$buffer.= "</td></tr><tr><td height='25'/></tr></table>" ;
				
		$buffer.= "<table class='tabledonnees'>" ;
			$buffer.= '<thead>' ;
				$buffer.= "<tr>";
					$buffer.= "<th>Barcode</th>";
					$buffer.= "<th>Position</th>";
					$buffer.= "<th>Container</th>";
					$buffer.= "<th>PartNumber</th>";
					//$buffer.= "<th>Batch</th>";
					//$buffer.= "<th>DLC</th>";
					$buffer.= "<th>Qty</th>";
					//$buffer.= "<th>SN</th>";
					$buffer.= "<th>Dest.Pos</th>";
					if( $transfer_isCde ) {
						$buffer.= "<th>OrderNeed</th>";
					}
				$buffer.= "</tr>" ;
			$buffer.= '</thead>' ;
			usort($rows_transferLig, create_function('$a,$b','return strcmp($a[\'current_adr\'],$b[\'current_adr\']) ;'));
			foreach( $rows_transferLig as $row_transferLig ) {
				$current_adr = $row_transferLig['current_adr'] ;
				$next_adr = $row_transferLig['next_adr'] ;
				
				$stk_prod = $row_transferLig['stk_prod'] ;
				$ttmp = explode('_',$stk_prod,2) ;
				$stk_prod_str = $ttmp[1] ;
				
				$query = "SELECT * FROM view_bible_PROD_entry WHERE entry_key='{$stk_prod}'" ;
				$result = $_opDB->query($query) ;
				$arr_prod = $_opDB->fetch_assoc($result) ;
				//print_r($arr_prod) ;
				
				
				$buffer.= "<tr>" ;
					$buffer.= '<td align="center">' ;
						$buffer.= '<img src="data:image/jpeg;base64,'.base64_encode(specDbsLam_lib_getBarcodePng($row_transferLig['transferlig_filerecord_id'],30)).'" /><br>';
						$buffer.= $row_transferLig['transferlig_filerecord_id'].'<br>';
					$buffer.= '</td>' ;
					$buffer.= "<td><span class=\"\">{$current_adr}</span></td>" ;
					$buffer.= "<td><span class=\"mybig\">{$row_transferLig['container_ref']}</span></td>" ;
					$buffer.= "<td><span class=\"mybig\">{$stk_prod_str}</span></td>" ;
					
					/*
					$class = ($arr_prod['field_SPEC_IS_BATCH'] ? '' : 'croix') ;
					$buffer.= "<td class=\"$class\"><span>{$row_transferLig['stk_batch']}</span></td>" ;
					
					$datelc = ($row_transferLig['stk_datelc'] != '0000-00-00 00:00:00' ? substr($row_transferLig['stk_datelc'],0,10) : '') ;
					$class = ($arr_prod['field_SPEC_IS_DLC'] ? '' : 'croix') ;
					$buffer.= "<td class=\"$class\"><span>{$datelc}</span></td>" ;
					*/
					
					$buffer.= "<td align='right'><span class=\"mybig\"><b>".(float)$row_transferLig['mvt_qty']."</b></span></td>" ;
					
					/*
					$class = ($arr_prod['field_SPEC_IS_SN'] ? '' : 'croix') ;
					$buffer.= "<td class=\"$class\"><span class=\"\">{$row_transferLig['stk_sn']}</span></td>" ;
					*/
					
					$buffer.= "<td><span class=\"\"><span class=\"mybig\"><b>{$next_adr}</b></span></td>" ;
					
					if( $transfer_isCde ) {
						$map_cde_qty = array() ;
						$stk_qty = (float)$row_transferLig['mvt_qty'] ;
						if( $tab_prod_cde_qty[$row_transferLig['stk_prod']] ) {
							foreach( $tab_prod_cde_qty[$row_transferLig['stk_prod']] as $cde_nr => $qty ) {
								$qty_transfer = min($qty,$stk_qty) ;
								$tab_prod_cde_qty[$row_transferLig['stk_prod']][$cde_nr] -= $qty_transfer ;
								$stk_qty -= $qty_transfer ;
								$map_cde_qty[$cde_nr] = $qty_transfer ;
							}
						}
						$buffer.= "<td>" ;
							$buffer.= "<table class='tablesilent'>" ;
							foreach( $map_cde_qty as $cde => $qty ) {
								$buffer.= "<tr><td>$cde</td><td>&nbsp;&nbsp;</td><td><b>$qty</b></td></tr>" ;
							}
							$buffer.= "</table>" ;
						$buffer.= "</td>" ;
					}
				$buffer.= "</tr>" ;
			}
		$buffer.= "</table>" ;
		
		if( $step_isFinal && count($rows_transferLig)==1 ) {
			$row_transferLig = reset($rows_transferLig) ;
			
				$query = "SELECT * FROM view_bible_PROD_entry WHERE entry_key='{$row_transferLig['stk_prod']}'" ;
				$result = $_opDB->query($query) ;
				$arr_prod = $_opDB->fetch_assoc($result) ;
			
			$buffer.= "<br><br><br><br>" ;
			
			$buffer.= "<div align='left'>" ;
			
			$buffer.= "<table class='tabledonnees'>" ;
				
				$buffer.= "<tr>" ;
					$buffer.= "<td width='30%'><span class=\"mybig\">PartNumber</span></td>" ;
					$buffer.= '<td align="center">' ;
						$buffer.= '<img src="data:image/jpeg;base64,'.base64_encode(specDbsLam_lib_getBarcodePng($row_transferLig['stk_prod'],50)).'" /><br>';
						$buffer.= $row_transferLig['stk_prod'].'<br>';
					$buffer.= '</td>' ;
				$buffer.= "</tr>" ;
			
				$buffer.= "<tr>" ;
					$buffer.= "<td width='30%'><span class=\"mybig\">Batch</span></td>" ;
					if( $arr_prod['field_SPEC_IS_BATCH'] ) {
						$buffer.= '<td align="center">' ;
						$buffer.= '<img src="data:image/jpeg;base64,'.base64_encode(specDbsLam_lib_getBarcodePng($row_transferLig['stk_batch'],50)).'" /><br>';
						$buffer.= $row_transferLig['stk_batch'].'<br>';
						$buffer.= '</td>' ;
					} else {
						$buffer.= '<td class="croix">&nbsp;</td>' ;
					}
				$buffer.= "</tr>" ;
			
				$buffer.= "<tr>" ;
					$buffer.= "<td width='30%'><span class=\"mybig\">SerialNo</span></td>" ;
					if( $arr_prod['field_SPEC_IS_SN'] ) {
						$buffer.= '<td align="center">' ;
						$buffer.= '<img src="data:image/jpeg;base64,'.base64_encode(specDbsLam_lib_getBarcodePng($row_transferLig['stk_sn'],50)).'" /><br>';
						$buffer.= $row_transferLig['stk_sn'].'<br>';
						$buffer.= '</td>' ;
					} else {
						$buffer.= '<td class="croix">&nbsp;</td>' ;
					}
				$buffer.= "</tr>" ;
			
			
			$buffer.= "</table>" ;
			
			if( $row_transferLig['ATR_NEASA'] ) {
				$buffer.= "<br><br><br><br>" ;
				
				$buffer.= "<table class='tabledonnees'>" ;
					$buffer.= "<tr>" ;
						$buffer.= "<td width='45%'><span class=\"mybig\">EASA #</span></td>" ;

						$buffer.= '<td align="center">' ;
							$buffer.= '<img src="data:image/jpeg;base64,'.base64_encode(specDbsLam_lib_getBarcodePng($row_transferLig['ATR_NEASA'],50)).'" /><br>';
							$buffer.= $row_transferLig['ATR_NEASA'].'<br>';
						$buffer.= '</td>' ;
					$buffer.= "</tr>" ;
				$buffer.= "</table>" ;
			}
			if( $row_transferLig['ATR_SU'] && $row_transferLig['ATR_SU']!='@MBDSU' ) {
				$buffer.= "<br><br>" ;
				
				$buffer.= "<table class='tabledonnees'>" ;
					$buffer.= "<tr>" ;
						$buffer.= "<td width='45%'><span class=\"mybig\">MBD-SU #</span></td>" ;

						$buffer.= '<td align="center">' ;
							$buffer.= '<img src="data:image/jpeg;base64,'.base64_encode(specDbsLam_lib_getBarcodePng($row_transferLig['ATR_SU'],50)).'" /><br>';
							$buffer.= $row_transferLig['ATR_SU'].'<br>';
						$buffer.= '</td>' ;
					$buffer.= "</tr>" ;
				$buffer.= "</table>" ;
			}
			
			$buffer.= "</div>" ;
		}
	}
	
	
	$app_root = $GLOBALS['app_root'] ;
	$resources_root=$app_root.'/resources' ;
	$templates_dir=$resources_root.'/server/templates' ;
	$inputFileName = $templates_dir.'/'.'DBS_LAM_blank.html' ;
	$inputBinary = file_get_contents($inputFileName) ;
	
	
	//echo $inputFileName ;
	$doc = new DOMDocument();
	@$doc->loadHTML($inputBinary);
	
	$elements = $doc->getElementsByTagName('body');
	$i = $elements->length - 1;
	while ($i > -1) {
		$body_element = $elements->item($i); 
		$i--; 
		
		libxml_use_internal_errors(true);

		$tpl = new DOMDocument;
		$tpl->loadHtml('<?xml encoding="UTF-8">'.$buffer);
		libxml_use_internal_errors(false);

		
		$body_element->appendChild($doc->importNode($tpl->documentElement, TRUE)) ;
	}
	
	return array('success'=>true, 'html'=>$doc->saveHTML() ) ;
}


function specDbsLam_transfer_createDoc($post_data) {
	global $_opDB ;
	$form_data = json_decode($post_data['data'],true) ;
	
	$tpltransfer_row = NULL ;
	if( $form_data['transfer_tpl'] ) {
		$ttmp = specDbsLam_cfg_getTplTransfer() ;
		$cfg_tpltransfer = $ttmp['data'] ;
		
		foreach( $cfg_tpltransfer as $row_tpltransfer ) {
			if( $row_tpltransfer['transfer_tpl'] == $form_data['transfer_tpl'] ) {
				$tpltransfer_row = $row_tpltransfer ;
			}
		}
	}
	if( !$tpltransfer_row ) {
		return array('success'=>false) ;
	}
	
	$arr_ins = array(
		'field_TRANSFER_TXT' => $form_data['transfer_txt'] ,
	);
	foreach( $tpltransfer_row as $mkey=>$mvalue ) {
		$dbkey = 'field_'.strtoupper($mkey) ;
		$arr_ins[$dbkey] = $mvalue ;
	}
	$transfer_filerecordId = paracrm_lib_data_insertRecord_file('TRANSFER',0,$arr_ins) ;
	foreach( $tpltransfer_row['steps'] as $tpltransferstep_row ) {
		$arr_ins = array() ;
		foreach( $tpltransferstep_row as $mkey=>$mvalue ) {
			$dbkey = 'field_'.strtoupper($mkey) ;
			$arr_ins[$dbkey] = $mvalue ;
		}
		paracrm_lib_data_insertRecord_file('TRANSFER_STEP',$transfer_filerecordId,$arr_ins) ;
	}
	
	return array('success'=>true, 'debug'=>$form_data) ;
}

function specDbsLam_transfer_deleteDoc($post_data) {
	global $_opDB ;
	
		$transfer_filerecordId = $post_data['transfer_filerecordId'] ;
	
		$query = "SELECT * FROM view_file_TRANSFER WHERE filerecord_id='{$transfer_filerecordId}'" ;
		$result = $_opDB->query($query) ;
		$row_transfer = $_opDB->fetch_assoc($result) ;
	
		$ttmp = specDbsLam_transfer_getTransferLig( array('filter_transferFilerecordId'=>$transfer_filerecordId) ) ;
		$rows_transferLig = $ttmp['data'] ;
		if( $rows_transferLig ) {
			return array('success'=>false) ;
		}
		$ttmp = specDbsLam_transfer_getTransferCdeLink( array('filter_transferFilerecordId'=>$transfer_filerecordId) ) ;
		$rows_transferCdeLink = $ttmp['data'] ;
		if( $rows_transferCdeLink ) {
			return array('success'=>false) ;
		}
		
	paracrm_lib_data_deleteRecord_file('TRANSFER',$transfer_filerecordId) ;
	
	return array('success'=>true) ;
}





function specDbsLam_transfer_lib_cleanAdr() {
	global $_opDB ;
	
	//HACK : BUG ! Must synchronize / use LOCKs
	return ;

	$query = "DELETE view_bible_ADR_entry 
					from view_bible_ADR_entry
					LEFT OUTER JOIN view_file_STOCK ON view_file_STOCK.field_ADR_ID=view_bible_ADR_entry.entry_key
					WHERE view_bible_ADR_entry.entry_key LIKE 'TMP_%' AND view_file_STOCK.field_ADR_ID IS NULL" ;
	$_opDB->query($query) ;
	
	$arr_parentTreenodes = array() ;
	$query = "SELECT distinct treenode_parent_key FROM view_bible_ADR_tree
				WHERE treenode_key LIKE 'TMP_%' AND treenode_parent_key NOT IN ('','&')" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$arr_parentTreenodes[] = $arr[0] ;
	}
	
	$arr_usedTreenodes = array() ;
	$query = "SELECT distinct treenode_key FROM view_bible_ADR_entry
				WHERE treenode_key LIKE 'TMP_%' AND treenode_key NOT IN ('','&')" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$arr_usedTreenodes[] = $arr[0] ;
	}
	
	$arr_tokeepTreenodes = array_merge($arr_parentTreenodes,$arr_usedTreenodes) ;
	$query = "DELETE FROM view_bible_ADR_tree WHERE treenode_key LIKE 'TMP_%'" ;
	if( $arr_tokeepTreenodes ) {
		$query.= " AND treenode_key NOT IN ".$_opDB->makeSQLlist($arr_tokeepTreenodes) ;
	}
	//$_opDB->query($query) ;
	// HACK 25/01/2016 : DO NOT PURGE TREENODES
}



function specDbsLam_transfer_lib_advanceDoc($transfer_filerecordId) {
	global $_opDB ;
	
	$ttmp = specDbsLam_transfer_getTransfer(array('filter_transferFilerecordId'=>$transfer_filerecordId)) ;
	$row_transfer = $ttmp['data'][0] ;
	
	// Gestion des forwards ?
	$map_stepIdx_forwardToIdx = array() ;
	$map_stepIdx_rowTransferStep = array() ;
	$map_stepIdx_arrSrcStockFilerecordIds = array() ;
	$map_stepIdx_arrDstStockFilerecordIds = array() ;
	foreach( $row_transfer['steps'] as $row_transferstep ) {
		$transferStepIdx = $row_transferstep['transferstep_idx'] ;
		if( $row_transferstep['forward_is_on'] ) {
			$map_stepIdx_forwardToIdx[$transferStepIdx] = $row_transferstep['forward_to_idx'] ;
		}
		$map_stepIdx_rowTransferStep[$transferStepIdx] = $row_transferstep ;
		$map_stepIdx_arrSrcStockFilerecordIds[$transferStepIdx] = array() ;
		$map_stepIdx_arrDstStockFilerecordIds[$transferStepIdx] = array() ;
		foreach( $row_transferstep['ligs'] as $row_transferlig ) {
			if( TRUE ) {
				$map_stepIdx_arrSrcStockFilerecordIds[$transferStepIdx][] = $row_transferlig['src_stk_filerecord_id'] ;
			}
			if( $row_transferlig['status_is_ok'] ) {
				$map_stepIdx_arrDstStockFilerecordIds[$transferStepIdx][] = $row_transferlig['dst_stk_filerecord_id'] ;
			}
		}
	}
	
	foreach( $map_stepIdx_forwardToIdx as $transferStepIdx => $forwardStepIdx ) {
		if( !$map_stepIdx_rowTransferStep[$forwardStepIdx] ) {
			continue ;
		}
		$row_transferstep = $map_stepIdx_rowTransferStep[$forwardStepIdx] ;
		$mapToDo_stkFilerecordIds = array_diff($map_stepIdx_arrDstStockFilerecordIds[$transferStepIdx],$map_stepIdx_arrSrcStockFilerecordIds[$forwardStepIdx]) ;
		foreach( $mapToDo_stkFilerecordIds as $stk_filerecord_id ) {
			$mvt_filerecordId = specDbsLam_lib_procMvt_addStock( $row_transferstep['whse_src'], $row_transferstep['whse_dst'], $stk_filerecord_id, null ) ;
			
			$transfer_row_next = array(
				'field_TRANSFERSTEP_IDX' => $row_transferstep['transferstep_idx'],
				'field_FILE_MVT_ID' => $mvt_filerecordId
			);
			paracrm_lib_data_insertRecord_file('TRANSFER_LIG',$transfer_filerecordId,$transfer_row_next) ;
		}
	}
	
	
	// Statut du document closed/...
	
}
































function specDbsLam_transfer_addCdeLink($post_data) {
	global $_opDB ;
	
	$p_transferFilerecordId = $post_data['transfer_filerecordId'] ;
	$p_cdesFilerecordIds = json_decode($post_data['cde_filerecordIds'],true) ;
	
	$query = "SELECT count(*) FROM view_file_TRANSFER_LIG WHERE filerecord_parent_id='{$p_transferFilerecordId}'" ;
	if( ($_opDB->query_uniqueValue($query) != 0) ) {
		return array('success'=>false) ;
	}
	
	foreach( $p_cdesFilerecordIds as $cde_filerecord_id ) {
		// checks
		$query = "SELECT field_STATUS FROM view_file_CDE WHERE filerecord_id='{$cde_filerecord_id}'" ;
		if( $_opDB->query_uniqueValue($query) != '10' ) {
			continue ;
		}
		
		$query = "SELECT count(*) FROM view_file_TRANSFER_CDE_LINK tcl
			INNER JOIN view_file_CDE_LIG cl ON cl.filerecord_id = tcl.field_FILE_CDELIG_ID
			INNER JOIN view_file_CDE c ON c.filerecord_id = cl.filerecord_parent_id
			WHERE c.filerecord_id='{$cde_filerecord_id}'" ;
		if( $_opDB->query_uniqueValue($query) != 0 ) {
			continue ;
		}
		// *****************
			
		$arr_cdeligFilerecordIds = array() ;
		$query = "SELECT filerecord_id FROM view_file_CDE_LIG WHERE filerecord_parent_id='{$cde_filerecord_id}'" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$arr_cdeligFilerecordIds[] = $arr[0] ;
		}
		foreach( $arr_cdeligFilerecordIds as $cdelig_filerecord_id ) {
			$arr_ins = array() ;
			$arr_ins['field_FILE_CDELIG_ID'] = $cdelig_filerecord_id ;
			$transfercdelink_filerecord_id = paracrm_lib_data_insertRecord_file('TRANSFER_CDE_LINK',$p_transferFilerecordId,$arr_ins) ;
		}
		$arr_update = array() ;
		$arr_update['field_STATUS'] = '20' ;
		$arr_update['field_FILE_TRANSFER_ID'] = $p_transferFilerecordId ;
		paracrm_lib_data_updateRecord_file('CDE',$arr_update,$cde_filerecord_id) ;
	}

	specDbsLam_lib_procCde_calcNeeds($p_transferFilerecordId) ;
	return array('success'=>true, 'debug'=>$post_data) ;
}
function specDbsLam_transfer_removeCdeLink($post_data) {
	global $_opDB ;
	
	$p_transferFilerecordId = $post_data['transfer_filerecordId'] ;
	$p_cdesFilerecordIds = json_decode($post_data['cde_filerecordIds'],true) ;

	if( !(count($p_cdesFilerecordIds)>0) ) {
		return array('success'=>false) ;
	}
	$list_cdesFilerecordIds = $_opDB->makeSQLlist($p_cdesFilerecordIds) ;
	
	$query = "SELECT distinct tcl.filerecord_parent_id
				FROM view_file_CDE_LIG cl
				LEFT OUTER JOIN view_file_TRANSFER_CDE_LINK tcl ON tcl.field_FILE_CDELIG_ID=cl.filerecord_id
				WHERE cl.filerecord_parent_id IN {$list_cdesFilerecordIds}" ;
	$result = $_opDB->query($query) ;
	$arr = $_opDB->fetch_row($result) ;
	if( ($_opDB->num_rows($result) != 1) || ($arr[0] != $p_transferFilerecordId) ) {
		return array('success'=>false) ;
	}
	
	$query = "SELECT count(*) FROM view_file_TRANSFER_LIG WHERE filerecord_parent_id='{$p_transferFilerecordId}'" ;
	if( ($_opDB->query_uniqueValue($query) != 0) ) {
		return array('success'=>false) ;
	}
	
	foreach( $p_cdesFilerecordIds as $cde_filerecord_id ) {
		$arr_cdeligFilerecordIds = array() ;
		$query = "SELECT filerecord_id FROM view_file_CDE_LIG WHERE filerecord_parent_id='{$cde_filerecord_id}'" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$arr_cdeligFilerecordIds[] = $arr[0] ;
		}
		
		foreach( $arr_cdeligFilerecordIds as $cdelig_filerecord_id ) {
			$query = "SELECT tcl.filerecord_id
				FROM view_file_CDE_LIG cl
				INNER JOIN view_file_TRANSFER_CDE_LINK tcl ON tcl.field_FILE_CDELIG_ID=cl.filerecord_id
				WHERE cl.filerecord_id='{$cdelig_filerecord_id}'" ;
			$transfercdelink_filerecord_id = $_opDB->query_uniqueValue($query) ;
			paracrm_lib_data_deleteRecord_file( 'TRANSFER_CDE_LINK' , $transfercdelink_filerecord_id ) ;
		}
		
		
		$arr_update = array() ;
		$arr_update['field_STATUS'] = '10' ;
		$arr_update['field_FILE_TRANSFER_ID'] = 0 ;
		paracrm_lib_data_updateRecord_file('CDE',$arr_update,$cde_filerecord_id) ;
	}
	
	specDbsLam_lib_procCde_calcNeeds($p_transferFilerecordId) ;
	return array('success'=>true) ;
}
function specDbsLam_transfer_addCdePickingStock( $post_data, $fast=FALSE ) {
	global $_opDB ;
	
	$ttmp = specDbsLam_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	
	$transfer_filerecordId = $post_data['transfer_filerecordId'] ;
	$transferStep_filerecordId = $post_data['transferStep_filerecordId'] ;
	$stock_objs = json_decode($post_data['stock_objs'],true) ;
	
	$formard_post = array(
		'filter_transferFilerecordId' => $transfer_filerecordId,
		'filter_fast' => true
	) ;
	$json = specDbsLam_transfer_getTransfer($formard_post) ;
	$transfer_row = reset($json['data']) ;
	$transferstep_row = NULL ;
	if( !$transfer_row ) {
		return array('success'=>false) ;
	}
	foreach( $transfer_row['steps'] as $transferstep_iter ) {
		if( $transferstep_iter['transferstep_filerecord_id'] == $transferStep_filerecordId ) {
			$transferstep_row = $transferstep_iter ;
		}
	}
	if( !$transferstep_row ) {
		return array('success'=>false) ;
	}
	
	$whseDestIsWork = FALSE ;
	foreach($json_cfg['cfg_whse'] as $whse) {
		if( ($whse['whse_code']==$transferstep_row['whse_dst']) && $whse['is_work'] ) {
			$whseDestIsWork = TRUE ;
		}
	}
	if( !$whseDestIsWork ) {
		return ;
	}
	
	if( !$transferstep_row['spec_cde_picking'] ) {
		return array('success'=>false) ;
	}
	
	foreach( $stock_objs as $stock_obj ) {
		if( !$stock_obj['target_transfercdeneed_filerecord_id'] ) {
			continue ;
		}
		
		// qte initiale à allouer
		$query = "SELECT tcn.field_QTY_NEED, sum(m.field_QTY_MVT), tcn.field_NEED_TXT
				FROM view_file_TRANSFER_CDE_NEED tcn
				JOIN view_file_TRANSFER_LIG tl ON tl.field_PICK_TRSFRCDENEED_ID = tcn.filerecord_id
				JOIN view_file_MVT m ON m.filerecord_id = tl.field_FILE_MVT_ID
				WHERE tcn.filerecord_id='{$stock_obj['target_transfercdeneed_filerecord_id']}'
				AND tcn.filerecord_parent_id='{$transfer_filerecordId}'" ;
		$result = $_opDB->query($query) ;
		$arr = $_opDB->fetch_row($result) ;
		$qty_need = (float)$arr[0] ;
		$qty_curAlloc = (float)$arr[1] ;
		$needTxt = preg_replace("/[^A-Z0-9]/", "", strtoupper($arr[2])) ;
		$whseDest = $transferstep_row['whse_dst'] ;
		
		// HACK : mode append 18/10/2018
		// TODO : vérif propre de similitude des dst_stk_filerecords (spec batch/DLC , ATRs, ...)
		$query = "SELECT distinct stkdst.filerecord_id
				FROM view_file_TRANSFER_CDE_NEED tcn
				JOIN view_file_TRANSFER_LIG tl ON tl.field_PICK_TRSFRCDENEED_ID = tcn.filerecord_id
				JOIN view_file_MVT m ON m.filerecord_id = tl.field_FILE_MVT_ID
				JOIN view_file_STOCK stkdst ON stkdst.filerecord_id = m.field_DST_FILE_STOCK_ID
				WHERE tcn.filerecord_id='{$stock_obj['target_transfercdeneed_filerecord_id']}'
				AND tcn.filerecord_parent_id='{$transfer_filerecordId}'" ;
		$result = $_opDB->query($query) ;
		if( $_opDB->num_rows($result) > 0 ) {
			$arr = $_opDB->fetch_row($result) ;
			$dst_stk_filerecord_id = $arr[0] ;
		}
		
		$qty_toAlloc = ($qty_need - $qty_curAlloc) ;
		if( $qty_toAlloc<=0 ) {
			return array('success'=>false) ;
		}
	
		$query = "SELECT field_QTY_AVAIL+field_QTY_PREIN FROM view_file_STOCK
				WHERE filerecord_id='{$stock_obj['stk_filerecord_id']}'" ;
		$qty_stock = $_opDB->query_uniqueValue($query) ;
		
		$qty_mvt = min($qty_toAlloc,$qty_stock) ;
		if( $qty_mvt<=0 ) {
			continue ;
		}
		
		$mvt_filerecordId = specDbsLam_lib_procMvt_addStock( $transferstep_row['whse_src'], $transferstep_row['whse_dst'], $stock_obj['stk_filerecord_id'], $qty_mvt, $dst_stk_filerecord_id ) ;
		if( !$mvt_filerecordId ){
			continue ;
		}
		$qty_toAlloc-= $qty_mvt ;
		
		$query = "SELECT * FROM view_file_MVT WHERE filerecord_id='{$mvt_filerecordId}'" ;
		$result = $_opDB->query($query) ;
		$row_mvt = $_opDB->fetch_assoc($result) ;
		
		$transfer_row = array(
			'field_TRANSFERSTEP_IDX' => $transferstep_row['transferstep_idx'],
			'field_FILE_MVT_ID' => $mvt_filerecordId,
			'field_PICK_TRSFRCDENEED_ID' => $stock_obj['target_transfercdeneed_filerecord_id']
		);
		$ids[] = paracrm_lib_data_insertRecord_file('TRANSFER_LIG',$transfer_filerecordId,$transfer_row) ;
		
		if( $whseDestIsWork=TRUE ) {
			$tmp_adr = $whseDest.'_'.$needTxt ;
			specDbsLam_lib_procMvt_setDstAdr($mvt_filerecordId,$tmp_adr,$whseDest) ;
		}
	}
	
	if( !$fast ) {
		specDbsLam_lib_procCde_syncLinks($transfer_filerecordId) ;
		specDbsLam_lib_procCde_forwardPacking($transfer_filerecordId) ;
	}
	return array('success'=>true, 'ids'=>$ids, 'debug'=>$post_data) ;
}
function specDbsLam_transfer_removeCdePickingStock( $post_data, $fast=FALSE ) {
	global $_opDB ;
	
	$ttmp = specDbsLam_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	
	$transfer_filerecordId = $post_data['transfer_filerecordId'] ;
	$transferStep_filerecordId = $post_data['transferStep_filerecordId'] ;
	$transferLig_filerecordIds = json_decode($post_data['transferLig_filerecordIds'],true) ;
	
	$formard_post = array(
		'filter_transferFilerecordId' => $transfer_filerecordId
	) ;
	$json = specDbsLam_transfer_getTransfer($formard_post) ;
	$transfer_row = reset($json['data']) ;
	$transferstep_row = NULL ;
	if( !$transfer_row ) {
		return array('success'=>false) ;
	}
	foreach( $transfer_row['steps'] as $transferstep_iter ) {
		if( $transferstep_iter['transferstep_filerecord_id'] == $transferStep_filerecordId ) {
			$transferstep_row = $transferstep_iter ;
		}
	}
	if( !$transferstep_row ) {
		return array('success'=>false) ;
	}
	
	$map_cdeNeedFilerecordId_arrTranferLigFilerecordIds = array() ;
	foreach( $transferstep_row['ligs'] as $transferlig_row ) {
		$tranferLigFilerecordId = $transferlig_row['transferlig_filerecord_id'] ;
		if( !in_array($tranferLigFilerecordId,$transferLig_filerecordIds) ) {
			continue ;
		}
		$cdeNeedFilerecordId = $transferlig_row['cdepick_transfercdeneed_filerecord_id'] ;
		if( !$cdeNeedFilerecordId ) {
			continue ;
		}
		if( !isset($map_cdeNeedFilerecordId_arrTranferLigFilerecordIds[$cdeNeedFilerecordId]) ) {
			$map_cdeNeedFilerecordId_arrTranferLigFilerecordIds[$cdeNeedFilerecordId] = array() ;
		}
		$map_cdeNeedFilerecordId_arrTranferLigFilerecordIds[$cdeNeedFilerecordId][] = $tranferLigFilerecordId ;
	}
	
	// ** Test release ?
	// specDbsLam_lib_procCde_releasePacking() ;
	foreach( $map_cdeNeedFilerecordId_arrTranferLigFilerecordIds as $cdeNeedFilerecordId => $arrTranferLigFilerecordIds ) {
		if( !specDbsLam_lib_procCde_releasePacking($transfer_filerecordId,$cdeNeedFilerecordId) ) {
			continue ;
		}
		specDbsLam_transfer_removeStock( array(
			'transfer_filerecordId' => $transfer_filerecordId,
			'transferStep_filerecordId' => $transferStep_filerecordId,
			'transferLig_filerecordIds' => json_encode($arrTranferLigFilerecordIds)
		)) ;
	}
	if( !$fast ) {
		specDbsLam_lib_procCde_syncLinks($transfer_filerecordId) ;
	}
	return array('success'=>true) ;
}
function specDbsLam_transfer_cdeStockAlloc( $post_data ) {
	$p_transferFilerecordId = $post_data['transfer_filerecordId'] ;
	specDbsLam_lib_procCde_syncLinks($p_transferFilerecordId) ;
	
	
	// restore doc & steps
	$formard_post = array(
		'filter_transferFilerecordId' => $p_transferFilerecordId,
		'filter_fast' => true
	) ;
	$json = specDbsLam_transfer_getTransfer($formard_post) ;
	$transfer_row = reset($json['data']) ;
	$transferstep_row = NULL ;
	if( !$transfer_row ) {
		return array('success'=>false) ;
	}
	$transferstepPicking_row = $transferstepResupply_row = NULL ;
	foreach( $transfer_row['steps'] as $transferstep_iter ) {
		if( $transferstep_iter['transferstep_code'] == 'RESPL_PICK' ) {
			$transferstepResupply_row = $transferstep_iter ;
		}
		if( $transferstep_iter['spec_cde_picking'] ) {
			$transferstepPicking_row = $transferstep_iter ;
		}
	}
	if( !$transferstepPicking_row ) {
		return array('success'=>false) ;
	}
	
	
	$ttmp = specDbsLam_transfer_getTransferCdeNeed( array('filter_transferFilerecordId'=>$p_transferFilerecordId) ) ;
	$rows_transferNeed = $ttmp['data'] ;
	foreach( $rows_transferNeed as $row_transferNeed ) {
		$need_prod = $row_transferNeed['stk_prod'] ;
		$need_qty = $row_transferNeed['qty_need'] - $row_transferNeed['qty_alloc'] ;
		
		$arr_searchResult = specDbsLam_lib_procCde_searchStock(
			$transferstepPicking_row['whse_src'],
			$need_prod,
			$need_qty,
			$transferstepResupply_row['transferstep_filerecord_id']
		) ;
		if( !$arr_searchResult ) {
			continue ;
		}
		$stock_objs = array() ;
		foreach( $arr_searchResult as $result_row ) {
			$stock_objs[] = array(
				'target_transfercdeneed_filerecord_id' => $row_transferNeed['transfercdeneed_filerecord_id'],
				'stk_filerecord_id' => $result_row['stock_filerecord_id']
			) ;
		}
		$forward_post = array(
			'transfer_filerecordId' => $p_transferFilerecordId,
			'transferStep_filerecordId' => $transferstepPicking_row['transferstep_filerecord_id'],
			'stock_objs' => json_encode($stock_objs)
		) ;
		specDbsLam_transfer_addCdePickingStock($forward_post,$fast=true) ;
	}
	specDbsLam_lib_procCde_syncLinks($p_transferFilerecordId) ;
	specDbsLam_lib_procCde_forwardPacking($p_transferFilerecordId) ;
	return array('success'=>true) ;
}
function specDbsLam_transfer_cdeStockUnalloc( $post_data ) {
	global $_opDB ;
	
	$p_transferFilerecordId = $post_data['transfer_filerecordId'] ;
	specDbsLam_lib_procCde_syncLinks($p_transferFilerecordId) ;
	
	// restore doc & steps
	$formard_post = array(
		'filter_transferFilerecordId' => $p_transferFilerecordId
	) ;
	$json = specDbsLam_transfer_getTransfer($formard_post) ;
	$transfer_row = reset($json['data']) ;
	$transferstep_row = NULL ;
	if( !$transfer_row ) {
		return array('success'=>false) ;
	}
	$transferstepPicking_row = $transferstepResupply_row = NULL ;
	foreach( $transfer_row['steps'] as $transferstep_iter ) {
		if( $transferstep_iter['transferstep_code'] == 'RESPL_PICK' ) {
			$transferstepResupply_row = $transferstep_iter ;
		}
		if( $transferstep_iter['spec_cde_picking'] ) {
			$transferstepPicking_row = $transferstep_iter ;
		}
	}
	if( !$transferstepPicking_row ) {
		return array('success'=>false) ;
	}
	
	$ttmp = specDbsLam_transfer_getTransferLig( array('filter_transferFilerecordId'=>$p_transferFilerecordId) ) ;
	$rows_transferLig = $ttmp['data'] ;
	foreach( $rows_transferLig as $row_transferLig ) {
		$forward_post = array(
			'transfer_filerecordId' => $p_transferFilerecordId,
			'transferStep_filerecordId' => $transferstepPicking_row['transferstep_filerecord_id'],
			'transferLig_filerecordIds' => json_encode(array($row_transferLig['transferlig_filerecord_id'])),
		) ;
		specDbsLam_transfer_removeCdePickingStock($forward_post,$fast=true) ;
	}
	
	// Clean resupplys ?
	if( $transferstepResupply_row ) {
		$todelete_transferLigFilerecordIds = array() ;
		foreach( $transferstepResupply_row['ligs'] as $transferligResupply_row ) {
			$dst_stk_filerecord_id = $transferligResupply_row['dst_stk_filerecord_id'] ;
			$query = "SELECT filerecord_id FROM view_file_STOCK
						WHERE filerecord_id='{$dst_stk_filerecord_id}' AND field_QTY_OUT='0'" ;
			if( $_opDB->query_uniqueValue($query) ) {
				$todelete_transferLigFilerecordIds[] = $transferligResupply_row['transferlig_filerecord_id'] ;
			}
		}
		if( $todelete_transferLigFilerecordIds ) {
			$sub_post = array(
				'transfer_filerecordId' => $p_transferFilerecordId,
				'transferStep_filerecordId' => $transferstepResupply_row['transferstep_filerecord_id'],
				'transferLig_filerecordIds' => json_encode($todelete_transferLigFilerecordIds)
			) ;
			specDbsLam_transfer_removeStock($sub_post) ;
		}
	}
	
	
	specDbsLam_lib_procCde_syncLinks($p_transferFilerecordId) ;
	return array('success'=>true) ;
}




function specDbsLam_transfer_setAdr( $post_data ) {
	global $_opDB ;
	
	$ttmp = specDbsLam_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	
	
	$transfer_filerecordId = $post_data['transfer_filerecordId'] ;
	$transferStep_filerecordId = $post_data['transferStep_filerecordId'] ;
	$adr_objs = json_decode($post_data['adr_objs'],true) ;
	
	$formard_post = array(
		'filter_transferFilerecordId' => $transfer_filerecordId
	) ;
	$json = specDbsLam_transfer_getTransfer($formard_post) ;
	$transfer_row = reset($json['data']) ;
	$transferstep_row = NULL ;
	if( !$transfer_row ) {
		return array('success'=>false) ;
	}
	foreach( $transfer_row['steps'] as $transferstep_iter ) {
		if( $transferstep_iter['transferstep_filerecord_id'] == $transferStep_filerecordId ) {
			$transferstep_row = $transferstep_iter ;
		}
	}
	if( !$transferstep_row ) {
		return array('success'=>false) ;
	}
	
	$whseDestIsWork = FALSE ;
	foreach($json_cfg['cfg_whse'] as $whse) {
		if( ($whse['whse_code']==$transferstep_row['whse_dst']) && $whse['is_work'] ) {
			$whseDestIsWork = TRUE ;
		}
	}
	if( $whseDestIsWork ) {
		return ;
	}
	
	$ids = array() ;
	specDbsLam_lib_proc_lock_on() ;
	foreach( $adr_objs as $adr_obj ) {
		$transferlig_filerecord_id = $adr_obj['transferlig_filerecord_id'] ;
		$transferlig_row = NULL ;
		foreach( $transferstep_row['ligs'] as $transferlig_iter ) {
			if( $transferlig_iter['transferlig_filerecord_id'] == $transferlig_filerecord_id ) {
				$transferlig_row = $transferlig_iter ;
			}
		}
		if( !$transferlig_row || $transferlig_row['status_is_ok'] ) {
			continue ;
		}
		
		$mvt_filerecordId = $transferlig_row['mvt_filerecord_id'] ;
		/*
		$query = "SELECT * FROM view_file_MVT WHERE filerecord_id='{$mvt_filerecordId}'" ;
		$result = $_opDB->query($query) ;
		$row_mvt = $_opDB->fetch_assoc($result) ;
		*/
		
		if( isset($adr_obj['adr_id']) && !$adr_obj['adr_id'] ) {
			// unalloc
			specDbsLam_lib_procMvt_setDstAdr($mvt_filerecordId,null) ;
			$ids[] = $transferlig_filerecord_id ;
		} elseif( $adr_obj['adr_id'] ) {
			if( $adr_id = specDbsLam_lib_proc_validateAdr( $transferlig_row, $transferstep_row['whse_dst'], $adr_obj['adr_id'] ) ) {
				specDbsLam_lib_procMvt_setDstAdr($mvt_filerecordId, $adr_id) ;
				$ids[] = $transferlig_filerecord_id ;
			}
		} elseif( $adr_obj['adr_auto'] && !$transferlig_row['dst_adr'] ) {
			$adr_id = specDbsLam_lib_proc_findAdr( $transferlig_row, $transferstep_row['whse_dst'], $adr_obj['adr_auto_picking'] ) ;
			if( $adr_id ) {
				specDbsLam_lib_procMvt_setDstAdr($mvt_filerecordId, $adr_id) ;
				$ids[] = $transferlig_filerecord_id ;
			}
		}
		
		if( $adr_id && $adr_obj['commit'] ) {
			specDbsLam_lib_procMvt_commit($mvt_filerecordId) ;
		}
	}
	specDbsLam_lib_proc_lock_off() ;
	
	return array('success'=>(count($ids)>0), 'ids'=>$ids) ;
}
function specDbsLam_transfer_setCommit( $post_data ) {
	global $_opDB ;
	
	$ttmp = specDbsLam_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	
	
	$transfer_filerecordId = $post_data['transfer_filerecordId'] ;
	$transferStep_filerecordId = $post_data['transferStep_filerecordId'] ;
	$transferLig_filerecordIds = json_decode($post_data['transferLig_filerecordIds'],true) ;
	
	$formard_post = array(
		'filter_transferFilerecordId' => $transfer_filerecordId
	) ;
	$json = specDbsLam_transfer_getTransfer($formard_post) ;
	$transfer_row = reset($json['data']) ;
	$transferstep_row = NULL ;
	if( !$transfer_row ) {
		return array('success'=>false) ;
	}
	foreach( $transfer_row['steps'] as $transferstep_iter ) {
		if( $transferstep_iter['transferstep_filerecord_id'] == $transferStep_filerecordId ) {
			$transferstep_row = $transferstep_iter ;
		}
	}
	if( !$transferstep_row ) {
		return array('success'=>false) ;
	}
	
	
	$ids = array() ;
	foreach( $transferLig_filerecordIds as $transferlig_filerecord_id ) {
		$transferlig_row = NULL ;
		foreach( $transferstep_row['ligs'] as $transferlig_iter ) {
			if( $transferlig_iter['transferlig_filerecord_id'] == $transferlig_filerecord_id ) {
				$transferlig_row = $transferlig_iter ;
			}
		}
		if( !$transferlig_row || $transferlig_row['status_is_ok'] || !$transferlig_row['dst_adr'] ) {
			continue ;
		}
		
		$mvt_filerecordId = $transferlig_row['mvt_filerecord_id'] ;
		/*
		$query = "SELECT * FROM view_file_MVT WHERE filerecord_id='{$mvt_filerecordId}'" ;
		$result = $_opDB->query($query) ;
		$row_mvt = $_opDB->fetch_assoc($result) ;
		*/
		
		if( specDbsLam_lib_procMvt_commit($mvt_filerecordId) ) {
			$ids[] = $transferlig_filerecord_id ;
		}
	}
	return array('success'=>(count($ids)>0), 'ids'=>$ids) ;
}


?>
