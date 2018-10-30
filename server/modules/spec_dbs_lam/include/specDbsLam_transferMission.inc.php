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
		
		specDbsLam_lib_procMvt_commit($transferlig_row['mvt_filerecord_id']) ;
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


?>
