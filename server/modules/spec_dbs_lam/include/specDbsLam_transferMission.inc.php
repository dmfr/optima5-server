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



?>
