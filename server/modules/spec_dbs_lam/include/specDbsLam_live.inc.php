<?php

function specDbsLam_live_goAdr( $post_data ) {
	$form_data = json_decode($post_data['form_data'],true) ;
	
	foreach( $form_data['mvt_obj'] as $mkey => &$mvalue ) {
		$mvalue = strtoupper(trim($mvalue)) ;
	}
	unset($mvalue) ;
	
	// Evaluate stockAttributes_obj
	if( $form_data['stockAttributes_obj'] != null ) {
		// Complet ?
		foreach( specDbsLam_lib_stockAttributes_getStockAttributes() as $stockAttribute ) {
			$mkey = $stockAttribute['mkey'] ;
			if( !$form_data['stockAttributes_obj'][$mkey] ) {
				return array('success'=>false, 'error'=>"Missing stock attributes !") ;
			}
		}
	} else {
		// If and only if PROD doesn't exists
		if( !paracrm_lib_data_getRecord_bibleEntry('PROD',$form_data['mvt_obj']['prod_id']) ) {
			return array(
				'success' => true,
				'data' => specDbsLam_live_buildResponse('PROD_TOSET',$form_data['mvt_obj'],NULL)
			) ;
		} else {
			return array('success'=>false, 'error'=>'No Stock Attributes ? Inconsistant !!') ;
		}
	}
	
	if( $form_data['mvt_id'] != null ) {
		$previousMvt_obj = specDbsLam_lib_proc_loadMvt( $form_data['mvt_id'] ) ;
		if( json_encode($previousMvt_obj) != json_encode($form_data['mvt_obj']) ) {
			return array('success'=>false, 'error'=>'Previous MVT mismatch', 'a'=>$previousMvt_obj, 'b'=>$form_data['mvt_obj']) ;
		}
		specDbsLam_lib_proc_deleteMvt( $form_data['mvt_id'] ) ;
	}
	
	// Article (création ?)
	if( !paracrm_lib_data_getRecord_bibleEntry('PROD',$form_data['mvt_obj']['prod_id']) ) {
		$arr_ins = array() ;
		$arr_ins['field_PROD_ID'] = $form_data['mvt_obj']['prod_id'] ;
		$arr_ins['field_PROD_TXT'] = 'ELAM '.date('Y-m-d') ;
		foreach( specDbsLam_lib_stockAttributes_getStockAttributes() as $stockAttribute ) {
			$mkey = $stockAttribute['mkey'] ;
			$PROD_fieldkey = $stockAttribute['PROD_fieldcode'] ;
			$arr_ins[$PROD_fieldkey] = json_encode( array($form_data['stockAttributes_obj'][$mkey]) ) ;
		}
		paracrm_lib_data_insertRecord_bibleEntry( 'PROD', $form_data['mvt_obj']['prod_id'], '', $arr_ins ) ;
	}
	
	if( !specDbsLam_lib_proc_lock_on() ) {
		return array('success'=>false, 'error'=>'Cannot set lock. Please try again.') ;
	}
	while(TRUE) {
		$adr_obj = specDbsLam_lib_proc_findAdr( $form_data['mvt_obj'], $form_data['stockAttributes_obj'], array() ) ;
		if( !$adr_obj['adr_id'] ) {
			$return = array('success'=>false, 'error'=>'Pas d\'emplacement disponible.') ;
			break ;
		}
		$mvt_id = specDbsLam_lib_proc_insertMvt( $form_data['mvt_obj'], $adr_obj['adr_id'] ) ;
		$form_data['mvt_obj']['mvt_id'] = $mvt_id ;
		$return = array('success'=>true, 'data'=>specDbsLam_live_buildResponse($adr_obj['status'], $form_data['mvt_obj'], $adr_obj['adr_id'], $form_data['stockAttributes_obj'])) ;
		break ;
	}
	specDbsLam_lib_proc_lock_off() ;
	
	return $return ;
}

function specDbsLam_live_loadMvt( $post_data ) {
	$record = paracrm_lib_data_getRecord_file('MVT',$post_data['mvt_id']) ;
	if( !$record ) {
		return array('success'=>false) ;
	}
	$mvt_obj = array(
		'mvt_id' => $record['filerecord_id'],
		'prod_id' => $record['field_PROD_ID'],
		'batch' => $record['field_BATCH_CODE'],
		'mvt_qty' => $record['field_QTY']
	);
	$adr_id = $record['field_ADR_ID'] ;
	
	$stockAttributes_obj = array() ;
	$record_adr = paracrm_lib_data_getRecord_bibleEntry('STOCK',$adr_id) ;
	foreach( specDbsLam_lib_stockAttributes_getStockAttributes() as $stockAttribute_obj ) {
		$mkey = $stockAttribute_obj['mkey'] ;
		$STOCK_fieldcode = $stockAttribute_obj['STOCK_fieldcode'] ;
		
		$stockAttributes_obj[$mkey] = '' ;
		if( $ttmp = json_decode($record_adr[$STOCK_fieldcode],true) ) {
			$stockAttributes_obj[$mkey] = reset($ttmp) ;
		}
	}
	
	return array(
		'success' => true,
		'data' => specDbsLam_live_buildResponse('RELOAD',$mvt_obj,$adr_id,$stockAttributes_obj)
	) ;
}

function specDbsLam_live_deleteMvt( $post_data ) {
	$record = paracrm_lib_data_getRecord_file('MVT',$post_data['mvt_id']) ;
	if( !$record ) {
		return array('success'=>false) ;
	}
	specDbsLam_lib_proc_deleteMvt( $post_data['mvt_id'] ) ;
	return array('success'=>true) ;
}

function specDbsLam_live_buildResponse($status, $mvt_obj, $adr_id, $stockAttributes_obj=NULL) {
	$return = array(
		'status' => $status, // OK_NEW, OK_ADD, RELOAD, PROD_TOSET
		'mvt_obj' => $mvt_obj,
		'adr_id' => $adr_id
	);
	if( $stockAttributes_obj ) {
		$return['stockAttributes_obj'] = $stockAttributes_obj ;
	}
	return $return ;
}

function specDbsLam_live_goRelocate( $post_data ) {
	$form_data = json_decode($post_data['form_data'],true) ;
	foreach( $form_data['relocate_obj'] as $mkey => &$mvalue ) {
		$mvalue = strtoupper(trim($mvalue)) ;
	}
	unset($mvalue) ;
	
	// checks
	$mvt_record = paracrm_lib_data_getRecord_file('MVT',$form_data['mvt_id']) ;
	$inv_record = paracrm_lib_data_getRecord_file('INV',$mvt_record['field_INV_ID']) ;
	if( !$mvt_record || !$inv_record 
		|| $inv_record['field_ADR_ID'] != $form_data['relocate_obj']['check_adr'] 
		|| $inv_record['field_QTY_AVAIL'] != $form_data['relocate_obj']['check_qty']
	){
		return array('success'=>false, 'debug'=>$previousMvt_obj, 'error'=>'Paramètres de vérification invalides') ;
	}
	
	if( !specDbsLam_lib_proc_lock_on() ) {
		return array('success'=>false, 'error'=>'Cannot set lock. Contact Admin.') ;
	}
	
	while(TRUE) {
		// rech ADR
		$adr_obj = specDbsLam_lib_proc_findAdr(NULL, $form_data['stockAttributes_obj'], array() ) ;
		if( !$adr_obj['adr_id'] ) {
			$return = array('success'=>false, 'error'=>'Pas d\'emplacement disponible.') ;
			break ;
		}
		
		// annul MVT
		$previousMvt_obj = specDbsLam_lib_proc_loadMvt( $form_data['mvt_id'] ) ;
		specDbsLam_lib_proc_deleteMvt( $form_data['mvt_id'] ) ;
		
		// déplacement STK
		$query = "UPDATE view_file_INV SET field_ADR_ID='{$adr_obj['adr_id']}' WHERE filerecord_id='{$inv_record['filerecord_id']}'" ;
		$GLOBALS['_opDB']->query($query) ;
		
		// recreate du MVT
		$mvt_id = specDbsLam_lib_proc_insertMvt( $previousMvt_obj, $adr_obj['adr_id'] ) ;
		$previousMvt_obj['mvt_id'] = $mvt_id ;
		$return = array('success'=>true, 'data'=>specDbsLam_live_buildResponse($adr_obj['status'], $previousMvt_obj, $adr_obj['adr_id'], $form_data['stockAttributes_obj'])) ;
		
		break ;
	}
	
	specDbsLam_lib_proc_lock_off() ;
	
	return $return ;
}




function specDbsLam_live_getGrid($post_data) {
	$forward_post = array() ;
	$forward_post['start'] = 0 ;
	$forward_post['limit'] = 50 ;
	$forward_post['file_code'] = 'MVT' ;
	$forward_post['sort'] = json_encode(array(array('property'=>'filerecord_id','direction'=>'DESC'))) ;
	if( $post_data['filter_prod'] ) {
		$forward_post['filter'] = json_encode(array(
			array(
				'operator' => 'in',
				'property' => 'MVT_field_PROD_ID',
				'value' => array( $post_data['filter_prod'] )
			),
		)) ;
	}
	$ttmp = paracrm_data_getFileGrid_data( $forward_post, $auth_bypass=TRUE ) ;
	$paracrm_TAB = $ttmp['data'] ;
	
	$TAB = array() ;
	foreach( $paracrm_TAB as $paracrm_row ) {
		$row = array() ;
		$row['mvt_id'] = $paracrm_row['filerecord_id'] ;
		$row['mvt_date'] = $paracrm_row['MVT_field_DATE'] ;
		$row['adr_id'] = $paracrm_row['MVT_field_ADR_ID'] ;
		$row['prod_id'] = $paracrm_row['MVT_field_PROD_ID'] ;
		$row['batch'] = $paracrm_row['MVT_field_BATCH_CODE'] ;
		$row['mvt_qty'] = $paracrm_row['MVT_field_QTY'] ;
		$TAB[] = $row ;
	}
	
	
	return array('success'=>true,'data'=>$TAB,'debug'=>$paracrm_TAB) ;
}


?>