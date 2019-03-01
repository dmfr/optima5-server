<?php

function specDbsLam_transferMission_getTransferSummary( $post_data ) {
	$json = specDbsLam_transferMission_getTransferLig( $post_data ) ;
	
	$map_needTxt_arrDesc = array() ;
	foreach( $json['data'] as $transferlig_row ) {
		$need_txt = $transferlig_row['need_txt'] ;
		if( !isset($map_needTxt_arrDesc[$need_txt]) ) {
			$map_needTxt_arrDesc[$need_txt] = array(
				'need_txt' => $transferlig_row['need_txt'],
				'dst_adr' => $transferlig_row['dst_adr'],
				'count_lig' => 0
			) ;
		}
		$map_needTxt_arrDesc[$need_txt]['count_lig']++ ;
	}
	
	
	return array('success'=>true, 'data'=>array_values($map_needTxt_arrDesc)) ;
}
function specDbsLam_transferMission_getTransferLig($post_data) {
	// jointure : voir specDbsPeople_Real_lib_getActivePeople
	
	global $_opDB ;
	
	$json = specDbsLam_transfer_getTransferLig( array() ) ;
	$arr_transferCdeNeed_filerecordIds = array() ;
	$arr_ligRows = $json['data'] ;
	foreach( $arr_ligRows as $transferlig_row ) {
		if( !$transferlig_row['cdepick_transfercdeneed_filerecord_id'] ) {
			continue ;
		}
		if( $transferlig_row['status_is_ok'] ) {
			continue ;
		}
		$arr_transferCdeNeed_filerecordIds[] = $transferlig_row['cdepick_transfercdeneed_filerecord_id'] ;
	}
	
	$json = specDbsLam_transfer_getTransferCdeNeed( array(
		'filter_transferCdeNeedFilerecordId_arr' => json_encode($arr_transferCdeNeed_filerecordIds)
	));
	$map_transferCdeNeedFilerecordId_needTxt = array() ;
	foreach( $json['data'] as $cdeneed_row ) {
		$map_transferCdeNeedFilerecordId_needTxt[$cdeneed_row['transfercdeneed_filerecord_id']] = $cdeneed_row['need_txt'] ;
	}
	
	$new_ligRows = array() ;
	foreach( $arr_ligRows as $transferlig_row ) {
		if( !$transferlig_row['cdepick_transfercdeneed_filerecord_id'] ) {
			continue ;
		}
		if( !$map_transferCdeNeedFilerecordId_needTxt[$transferlig_row['cdepick_transfercdeneed_filerecord_id']] ) {
			continue ;
		}
		$transferlig_row['need_txt'] = $map_transferCdeNeedFilerecordId_needTxt[$transferlig_row['cdepick_transfercdeneed_filerecord_id']] ;
		$new_ligRows[] = $transferlig_row ;
	}
	
	
	return array('success'=>true, 'data'=>$new_ligRows) ;
}






function specDbsLam_transferPacking_getPrinters($post_data) {
	$json = specDbsLam_cfg_getPrinter() ;
	return array('success'=>true, 'data'=>$json['data']) ;
}
function specDbsLam_transferPacking_getLigs($post_data) {
	global $_opDB ;
	
	$json = specDbsLam_transfer_getTransferLig( array() ) ;
	$arr_transfer_filerecordIds = array() ;
	$arr_transfer_prodIds = array() ;
	$arr_ligRows = $json['data'] ;
	foreach( $arr_ligRows as $transferlig_row ) {
		if( !$transferlig_row['cdepack_transfercdelink_filerecord_id'] ) {
			continue ;
		}
		if( $transferlig_row['status_is_ok'] ) {
			continue ;
		}
		if( !in_array($transferlig_row['transfer_filerecord_id'],$arr_transfer_filerecordIds) ) {
			$arr_transfer_filerecordIds[] = $transferlig_row['transfer_filerecord_id'] ;
		}
		if( $transferlig_row['stk_prod'] && !in_array($transferlig_row['stk_prod'],$arr_transfer_prodIds) ) {
			$arr_transfer_prodIds[] = $transferlig_row['stk_prod'] ;
		}
	}
	
	$map_transferFilerecordId_transferTxt = array() ;
	foreach( $arr_transfer_filerecordIds as $transferFilerecordId ) {
		$formard_post = array(
			'filter_transferFilerecordId' => $transferFilerecordId,
			'filter_fast' => true
		) ;
		$json = specDbsLam_transfer_getTransfer($formard_post) ;
		$transfer_row = reset($json['data']) ;
		$map_transferFilerecordId_transferTxt[$transferFilerecordId] = $transfer_row['transfer_txt'] ;
	}
	
	$map_prodId_row = array() ;
	foreach( $arr_transfer_prodIds as $prod_id ) {
		$formard_post = array(
			'entry_key' => $prod_id
		) ;
		$json = specDbsLam_prods_getGrid($formard_post) ;
		$prod_row = reset($json['data']) ;
		$map_prodId_row[$prod_id] = $prod_row ;
	}
	
	$new_ligRows = array() ;
	foreach( $arr_ligRows as $transferlig_row ) {
		if( !$transferlig_row['cdepack_transfercdelink_filerecord_id'] ) {
			continue ;
		}
		if( $transferlig_row['status_is_ok'] ) {
			continue ;
		}
		if( !$map_transferFilerecordId_transferTxt[$transferlig_row['transfer_filerecord_id']] ) {
			continue ;
		}
		$transferlig_row['transfer_txt'] = $map_transferFilerecordId_transferTxt[$transferlig_row['transfer_filerecord_id']] ;
		$transferlig_row['stk_prod_gencod'] = $map_prodId_row[$transferlig_row['stk_prod']]['prod_gencod'] ;
		$new_ligRows[] = $transferlig_row ;
	}
	
	
	return array('success'=>true, 'data'=>$new_ligRows) ;
}
function specDbsLam_transferPacking_getSummary($post_data) {
	$json = specDbsLam_transferPacking_getLigs( $post_data ) ;
	
	$map_needTxt_arrDesc = array() ;
	foreach( $json['data'] as $transferlig_row ) {
		$need_txt = $transferlig_row['src_adr'] ;
		if( !isset($map_needTxt_arrDesc[$need_txt]) ) {
			$map_needTxt_arrDesc[$need_txt] = array(
				'transfer_txt' => $transferlig_row['transfer_txt'],
				'src_adr' => $transferlig_row['src_adr'],
				'count_lig' => 0
			) ;
		}
		$map_needTxt_arrDesc[$need_txt]['count_lig']++ ;
	}
	
	
	return array('success'=>true, 'data'=>array_values($map_needTxt_arrDesc)) ;
}
function specDbsLam_transferPacking_getSrcPending($post_data) {
	$json = specDbsLam_transferPacking_getLigs( $post_data ) ;
	
	$p_srcAdr = $post_data['filter_srcAdr'] ;
	
	$header = array() ;
	$map_prodId_arrDesc = array() ;
	foreach( $json['data'] as $transferlig_row ) {
		$src_adr = $transferlig_row['src_adr'] ;
		if( $p_srcAdr != $src_adr ) {
			continue ;
		}
		if( !$header ) {
			$header = array(
				'transfer_txt' => $transferlig_row['transfer_txt'],
				'src_adr' => $transferlig_row['src_adr']
			) ;
		}
		$prod_id = $transferlig_row['stk_prod'] ;
		if( !isset($map_prodId_arrDesc[$prod_id]) ) {
			$map_prodId_arrDesc[$prod_id] = array(
				'prod_id' => $transferlig_row['stk_prod'],
				'prod_gencod' => $transferlig_row['stk_prod_gencod'],
				'count_lig' => 0
			) ;
		}
		$map_prodId_arrDesc[$prod_id]['count_lig']++ ;
	}
	
	return array('success'=>true, 'header'=>$header, 'data'=>array_values($map_prodId_arrDesc)) ;
}
function specDbsLam_transferPacking_directCommit($post_data) {
	$p_srcAdr = $post_data['commit_srcAdr'] ;
	$p_prodId = $post_data['commit_prodId'] ;
	
	$json = specDbsLam_transferPacking_getLigs( $post_data ) ;
	foreach( $json['data'] as $transferlig_iter ) {
		$src_adr = $transferlig_iter['src_adr'] ;
		$prod_id = $transferlig_iter['stk_prod'] ;
		if( $p_srcAdr != $src_adr ) {
			continue ;
		}
		if( $p_prodId != $prod_id ) {
			continue ;
		}
		
		$transferlig_row = $transferlig_iter ;
		break ;
	}
	$success=false ;
	if( $transferlig_row ) {
		$success=true ;
		$map_transferCdeLinkFilerecordId_cdeFilerecordId = array() ;
		
		$formard_post = array(
			'filter_transferFilerecordId' => $transferlig_row['transfer_filerecord_id']
		) ;
		$json = specDbsLam_transfer_getTransfer($formard_post) ;
		$transfer_row = reset($json['data']) ;
		foreach( $transfer_row['cde_links'] as $transfercdelink_row ) {
			$transferCdeLink_filerecordId = $transfercdelink_row['transfercdelink_filerecord_id'] ;
			$cde_filerecordId = $transfercdelink_row['cde_filerecord_id'] ;
			$map_transferCdeLinkFilerecordId_cdeFilerecordId[$transferCdeLink_filerecordId] = $cde_filerecordId ;
		}
		
		$transferCdeLink_filerecordId = $transferlig_row['cdepack_transfercdelink_filerecord_id'] ;
		$cde_filerecordId = $map_transferCdeLinkFilerecordId_cdeFilerecordId[$transferCdeLink_filerecordId] ;
		
		$transfer_filerecordId = $transferlig_row['transfer_filerecord_id'] ;
		$transferLig_filerecordId = $transferlig_row['transferlig_filerecord_id'] ;
		
		$success_commit = specDbsLam_lib_procMvt_commit($transferlig_row['mvt_filerecord_id']) ;
		if( !$success_commit ) {
			// TODO : from JS ? select only available pending packing lines with enough stk avail
			return array('success'=>false, 'error'=>'Cannot commit. Picking not complete ?') ;
		}
		$transferCdePack_filerecordId = specDbsLam_lib_procCde_shipPackCreate($transfer_filerecordId,$cde_filerecordId,$reuse=FALSE) ;
		specDbsLam_lib_procCde_shipPackAssociate($transferCdePack_filerecordId,$transferLig_filerecordId) ;
		specDbsLam_lib_procCde_shipPackSync($transfer_filerecordId) ;
		specDbsLam_lib_procCde_shipPackGenerate($transferCdePack_filerecordId) ;
		
		specDbsLam_lib_procCde_syncLinks($transfer_filerecordId) ;
	}
	
	return array('success'=>$success, 'id'=>$transferCdePack_filerecordId) ;
}
function specDbsLam_transferPacking_getPackingRecord($post_data) {
	$p_transferCdePackFilerecordId = $post_data['filter_transferCdePackFilerecordId'] ;
	
	$rowExtended_transferCdePack = NULL ;
	$json = specDbsLam_transfer_getTransferCdePack( array(
		'filter_transferCdePackFilerecordId_arr'=>json_encode(array($p_transferCdePackFilerecordId)),
		'load_extended' => 1
	) ) ;
	$rowExtended_transferCdePack = $json['data'][0] ;
	
	return array('success'=>true, 'record'=>$rowExtended_transferCdePack) ;
}



function specDbsLam_transferInput_setPdaSpec($post_data) {
	$transfer_filerecordId = $post_data['transfer_filerecordId'] ;
	$transferStep_filerecordId = $post_data['transferStep_filerecordId'] ;
	$pdaspec_obj = json_decode($post_data['pdaspec_obj'],true) ;
	
	$arr_update = array(
		'field_PDA_IS_ON' => $pdaspec_obj['pda_is_on'],
		'field_PDASPEC_IS_ON' => $pdaspec_obj['pdaspec_is_on'],
		'field_PDASPEC_CODE' => $pdaspec_obj['pdaspec_code']
	);
	paracrm_lib_data_updateRecord_file('TRANSFER_STEP',$arr_update,$transferStep_filerecordId) ;
	usleep(500*1000) ;
	
	return array('success'=>true, 'debug'=>$pdaspec_obj) ;
}
function specDbsLam_transferInput_getDocuments($post_data) {
	global $_opDB ;
	
	$closed_dateTouch = date('Y-m-d',strtotime('-1 day')) ;
	
	$TAB = array() ;
	$query = "SELECT ts.filerecord_id as transferstep_filerecord_id
				, t.filerecord_id as transfer_filerecord_id
				, t.field_TRANSFER_TXT as transfer_txt
				, ts.field_PDA_IS_ON as pda_is_on
				, ts.field_PDASPEC_IS_ON as pdaspec_is_on
				, IF(ts.field_PDASPEC_IS_ON='1',ts.field_PDASPEC_CODE,'') as pdaspec_code
				, b.field_PDASPEC_TXT as pdaspec_txt
				, b.field_INPUT_JSON as pdaspec_input_json
				, b.field_SQL_PROCESS as pdaspec_sql_process
				FROM view_file_TRANSFER_STEP ts
				JOIN view_file_TRANSFER t ON t.filerecord_id=ts.filerecord_parent_id
				LEFT OUTER JOIN view_bible_CFG_PDASPEC_entry b ON b.entry_key=IF(ts.field_PDASPEC_IS_ON='1',ts.field_PDASPEC_CODE,'')
				WHERE ts.field_PDA_IS_ON='1'
				AND ( (t.field_STATUS_IS_OK='0') OR (DATE(t.field_DATE_TOUCH) > '$closed_dateTouch') )
				ORDER BY t.filerecord_id DESC" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB[] = $arr ;
	}
	
	return array('success'=>true, 'data'=>array_values($TAB)) ;
}
function specDbsLam_transferInput_processSql($post_data) {
	$p_sqlProcess = $post_data['sql_process'] ;
	$p_sqlVars = json_decode($post_data['sql_vars'],true) ;
	
	$forward_post = array(
		'q_type' => 'qsql',
		'q_id' => $p_sqlProcess,
		'q_vars' => json_encode($p_sqlVars)
	);
	$return_json = paracrm_queries_direct($forward_post,$auth_bypass=true) ;
	if( !$return_json['success'] ) {
		return array('success'=>false, 'debug'=>$post_data) ;
	}
	//print_r($return_json['tabs']) ;
	
	// Last tab
	$result = end($return_json['tabs']) ;
	$map_mkey_idx = array() ;
	foreach( $result['columns'] as $col ) {
		$map_mkey_idx[$col['text']] = $col['dataIndex'] ;
	}
	$objs = array() ;
	foreach( $result['data'] as $row ) {
		$obj = array() ;
		foreach( $map_mkey_idx as $mkey => $idx ) {
			$obj[$mkey] = $row[$idx] ;
		}
		$objs[] = $obj ;
	}
	
	return array('success'=>true, 'data'=>$objs) ;
}
function specDbsLam_transferInput_submit($post_data) {
	global $_opDB ;
	
	$p_transferFilerecordId = $post_data['transfer_filerecordId'] ;
	$p_transferStepFilerecordId = $post_data['transferStep_filerecordId'] ;
	$p_stkDataObj = json_decode($post_data['stkData_obj'],true) ;
	
	// TODO : retrieve SOC
	if( $p_stkDataObj['stk_prod'] ) {
		$json = specDbsLam_prods_getGrid( array('entry_key'=>$p_stkDataObj['stk_prod']) ) ;
		$row_prod = $json['data'][0] ;
		
		$p_stkDataObj['soc_code'] = $row_prod['prod_soc'] ;
		$p_stkDataObj['stk_prod'] = $row_prod['id'] ;
	}
	
	// TODO : retrieve WHSE+DEST
	if( TRUE ) {
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
		foreach( $transfer_row['steps'] as $transferstep_iter ) {
			if( $transferstep_iter['transferstep_filerecord_id'] == $p_transferStepFilerecordId ) {
				$transferstep_row = $transferstep_iter ;
			}
		}
		if( !$transferstep_row ) {
			return array('success'=>false) ;
		}
		
		$dst_whse = $transferstep_row['whse_dst'] ;
		$dst_adr = $dst_whse.'_'.'PDA' ;
	}
	
	//HACK !!!
	if( $p_stkDataObj['container_ref'] ) {
		$query = "SELECT count(*) FROM view_file_STOCK WHERE field_CONTAINER_REF='{$p_stkDataObj['container_ref']}'" ;
		if( $_opDB->query_uniqueValue($query) > 0 ) {
			return array('success'=>false,'error'=>'Existing ContainerRef/SSCC') ;
		}
	}
	
	$stk_obj = array(
		'dst_whse' => $dst_whse,
		'dst_adr' => $dst_adr,
		'commit' => true,
		'stkData_obj' => $p_stkDataObj
	) ;
	
	$forward_post = array(
		'stock_objs' => json_encode(array($stk_obj)),
		'transfer_filerecordId' => $p_transferFilerecordId,
		'transferStep_filerecordId' => $p_transferStepFilerecordId
	);
	$json = specDbsLam_transfer_addStock($forward_post) ;
	if( !$json['success'] ) {
		return array('success'=>false) ;
	}
	
	$transferlig_filerecord_id = reset($json['ids']) ;
	
	
	// TODO: has been forwarded ???
	$query = "SELECT filerecord_id FROM view_file_TRANSFER_LIG
				WHERE filerecord_parent_id='{$p_transferFilerecordId}'
				AND field_FILE_MVT_ID IN (
					SELECT filerecord_id FROM view_file_MVT WHERE field_SRC_FILE_STOCK_ID IN (
						SELECT field_DST_FILE_STOCK_ID FROM view_file_MVT WHERE filerecord_id IN (
							SELECT field_FILE_MVT_ID FROM view_file_TRANSFER_LIG WHERE filerecord_id='{$transferlig_filerecord_id}'
						)
					)
				)" ;
	$forward_transferlig_filerecord_id = $_opDB->query_uniqueValue($query) ;
	
	return array('success'=>true, 'forward_transferlig_filerecord_id'=>0) ;
}

?>
