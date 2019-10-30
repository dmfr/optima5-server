<?php
function specDbsLam_transferInputPo_getLigs( $post_data ) {
	$p_transferFilerecordId = $post_data['transfer_filerecordId'] ;
	$p_transferStepFilerecordId = $post_data['transferStep_filerecordId'] ;
	
	global $_opDB ;
	
	$query = "SELECT tip.*, tip.filerecord_id as transferinputpo_filerecord_id, ts.filerecord_id as transferstep_filerecord_id
				FROM view_file_TRANSFER_INPUT_PO tip
				JOIN view_file_TRANSFER_STEP ts 
					ON ts.filerecord_parent_id=tip.filerecord_parent_id AND ts.field_TRANSFERSTEP_IDX=tip.field_TRANSFERSTEP_IDX
				JOIN view_file_TRANSFER t
					ON t.filerecord_id = ts.filerecord_parent_id
				WHERE ts.filerecord_id='{$p_transferStepFilerecordId}' AND t.filerecord_id='{$p_transferFilerecordId}'
				ORDER BY tip.filerecord_id DESC" ;
	$result = $_opDB->query($query) ;
	
	$TAB = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$prod_id = $arr['field_PROD_ID'] ;
		
		if( isset($TAB[$prod_id]) ) {
			$TAB[$prod_id]['qty_po'] += (float)$arr['field_QTY_PO'] ;
			
			$transferinputpo_filerecord_id = $arr['transferinputpo_filerecord_id'] ;
			paracrm_lib_data_deleteRecord_file( 'TRANSFER_INPUT_PO' , $transferinputpo_filerecord_id ) ;
			
			continue ;
		}
		
		$TAB[$prod_id] = array(
			'transferinputpo_filerecord_id' => $arr['transferinputpo_filerecord_id'],
			'transferstep_filerecord_id' => $arr['transferstep_filerecord_id'],
			'po_txt' => $arr['field_PO_TXT'],
			'stk_prod' => $arr['field_PROD_ID'],
			'qty_po' => (float)$arr['field_QTY_PO'],
			'qty_input' => 0,
			'alert_is_off' => !!$arr['field_ALERT_IS_OFF']
		);
	}
	
	
	// interro lignes
	$query = "SELECT mvt.field_PROD_ID as prod_id, sum(field_QTY_MVT) as qty_input
				FROM view_file_TRANSFER_LIG tl
				JOIN view_file_MVT mvt
					ON mvt.filerecord_id = tl.field_FILE_MVT_ID
				JOIN view_file_TRANSFER_STEP ts 
					ON ts.filerecord_parent_id=tl.filerecord_parent_id AND ts.field_TRANSFERSTEP_IDX=tl.field_TRANSFERSTEP_IDX
				JOIN view_file_TRANSFER t
					ON t.filerecord_id = ts.filerecord_parent_id
				WHERE ts.filerecord_id='{$p_transferStepFilerecordId}' AND t.filerecord_id='{$p_transferFilerecordId}'
				GROUP BY mvt.field_PROD_ID" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$prod_id = $arr['prod_id'] ;
		if( isset($TAB[$prod_id]) ) {
			$TAB[$prod_id]['qty_input'] += (float)$arr['qty_input'] ;
		} else {
			$TAB[$prod_id] = array(
				'transferinputpo_filerecord_id' => null,
				'transferstep_filerecord_id' => $p_transferStepFilerecordId,
				'po_txt' => '',
				'stk_prod' => $arr['prod_id'],
				'qty_po' => null,
				'qty_input' => (float)$arr['qty_input']
			);
		}
	}
	
	return array('success'=>true, 'data'=>array_values($TAB)) ;
}
function specDbsLam_transferInputPo_setLig( $post_data ) {
	global $_opDB ;
	$p_transferFilerecordId = $post_data['transfer_filerecordId'] ;
	$p_transferStepFilerecordId = $post_data['transferStep_filerecordId'] ;
	$form_data = json_decode($post_data['data'],true) ;
	
	$json = specDbsLam_transferInputPo_getLigs($post_data) ;
	if( !$json['success'] ) {
		return array('success'=>false) ;
	}
	$ligs = $json['data'] ;
	foreach( $ligs as $lig ) {
		if( $lig['transferinputpo_filerecord_id'] && !$form_data['transferinputpo_filerecord_id'] && ($lig['stk_prod']==$form_data['stk_prod']) ) {
			return array('success'=>false) ;
		}
	}
	
	$query = "SELECT ts.field_TRANSFERSTEP_IDX FROM view_file_TRANSFER_STEP ts
				JOIN view_file_TRANSFER t
					ON t.filerecord_id = ts.filerecord_parent_id
				WHERE ts.filerecord_id='{$p_transferStepFilerecordId}' AND t.filerecord_id='{$p_transferFilerecordId}'" ;
	$transferstep_idx = $_opDB->query_uniqueValue($query) ;
	if( !$transferstep_idx ) {
		return array('success'=>false) ;
	}
			
	
	$arr_update = array(
		'field_TRANSFERSTEP_IDX' => $transferstep_idx,
		'field_PROD_ID' => $form_data['stk_prod'],
		'field_PO_TXT' => $form_data['po_txt'],
		'field_QTY_PO' => $form_data['qty_po'],
		'field_ALERT_IS_OFF' => ($form_data['alert_is_off'] ? 1 : 0)
	);
	if( $form_data['_delete'] ) {
		paracrm_lib_data_deleteRecord_file('TRANSFER_INPUT_PO',$form_data['transferinputpo_filerecord_id']) ;
	} elseif( $form_data['transferinputpo_filerecord_id'] ) {
		paracrm_lib_data_updateRecord_file('TRANSFER_INPUT_PO',$arr_update,$form_data['transferinputpo_filerecord_id']) ;
	} else {
		paracrm_lib_data_insertRecord_file('TRANSFER_INPUT_PO',$p_transferFilerecordId,$arr_update) ;
	}
	
	return array('success'=>true, 'debug'=>$form_data) ;
}

function specDbsLam_transferInputPo_setState($post_data) {
	$transfer_filerecordId = $post_data['transfer_filerecordId'] ;
	$transferStep_filerecordId = $post_data['transferStep_filerecordId'] ;
	$inputlist_obj = json_decode($post_data['inputlist_obj'],true) ;
	
	$arr_update = array() ;
	if( isset($inputlist_obj['inputlist_is_on']) ) {
		$arr_update += array(
			'field_INPUTLIST_IS_ON' => $inputlist_obj['inputlist_is_on'],
		);
	}
	paracrm_lib_data_updateRecord_file('TRANSFER_STEP',$arr_update,$transferStep_filerecordId) ;
	usleep(500*1000) ;
	
	return array('success'=>true) ;
}


?>
