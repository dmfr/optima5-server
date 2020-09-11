<?php

function specDbsTracy_gun_getTrsptRecords($post_data) {
	global $_opDB ;
	
	$p_nextStep = $post_data['query_step_next'] ;
	
	if( $post_data['filter_soc'] ) {
		$filter_socCode = $post_data['filter_soc'] ;
	}
	if( $post_data['filter_carrier'] ) {
		$filter_carrierCode = $post_data['filter_carrier'] ;
	}
	
	$forward_post = array() ;
	if( $filter_socCode ) {
		$forward_post['filter_socCode'] = $filter_socCode ;
	}
	$json = specDbsTracy_trspt_getRecords($forward_post) ;
	$return_data = array() ;
	foreach( $json['data'] as $trspt_row ) {
		if( $trspt_row['calc_step_next'] != $p_nextStep ) {
			continue ;
		}
		if( $filter_socCode && ($trspt_row['id_soc']!=$filter_socCode) ) {
			continue ;
		}
		if( $filter_carrierCode && ($trspt_row['id_soc']!=$filter_carrierCode) ) {
			continue ;
		}
		$return_data[] = $trspt_row ;
	}
	
	return array('success'=>true, 'data'=>$return_data) ;
}




function specDbsTracy_gun_t70_getTrsptList($post_data) {
	$forward_post = $post_data ;
	$forward_post['query_step_next'] = '70_PICKUP' ;
	$json = specDbsTracy_gun_getTrsptRecords( $forward_post ) ;
	if( !$json['success'] ) {
		return array('success'=>false) ;
	}
	$trspt_rows = $json['data'] ;
	
	// CFG: liste des carriers
	$ttmp = specDbsTracy_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	$mapCarrier_code_txt = array() ;
	foreach( $json_cfg['cfg_list'] as $list ) {
		if( $list['bible_code'] == 'LIST_CARRIER' ) {
			foreach( $list['records'] as $carrier_row ) {
				$mapCarrier_code_txt[$carrier_row['id']] = $carrier_row['text'] ;
			}
		}
	}
	
	$map_carrierCode_arrTrpstRows = array() ;
	foreach( $trspt_rows as $trspt_row ) {
		$carrier_code = $trspt_row['mvt_carrier'] ;
		if( !isset($map_carrierCode_arrTrpstRows[$carrier_code]) ) {
			$map_carrierCode_arrTrpstRows[$carrier_code] = array() ;
		}
		$map_carrierCode_arrTrpstRows[$carrier_code][] = $trspt_row ;
	}
	
	$data = array() ;
	foreach( $map_carrierCode_arrTrpstRows as $carrier_code => $trspt_rows ) {
		$data[] = array(
			'mvt_carrier' => $carrier_code,
			'mvt_carrier_txt' => $mapCarrier_code_txt[$carrier_code],
			'count_trspt' => count($trspt_rows)
		);
	}
	return array('success'=>true, 'data'=>$data) ;
}

function specDbsTracy_gun_t70_transactionGetActiveId($post_data) {
	// TMP: only one active session, using PHP SESSION, (no database)
	$transaction_id = null ;
	if( isset($_SESSION['transactions']) ) {
		foreach( $_SESSION['transactions'] as $iter_transaction_id => $dummy ) {
			if( $_SESSION['transactions'][$iter_transaction_id]['transaction_code'] == 'specDbsTracy_gun_t70' ) {
				$transaction_id = $iter_transaction_id ;
			}
		}
	}
	sleep(1) ;
	return array('success'=>true, 'transaction_id'=>$transaction_id) ;
}

function specDbsTracy_gun_t70_transactionGetSummary($post_data) {
	$p_transactionId = $post_data['_transaction_id'] ;
	if( isset($_SESSION['transactions'][$p_transactionId]) 
		&& ($_SESSION['transactions'][$p_transactionId]['transaction_code'] == 'specDbsTracy_gun_t70') ) {
		
		return array('success'=>true, 'data'=> $_SESSION['transactions'][$p_transactionId]) ;
	}
	return array('success'=>false) ;
}
function specDbsTracy_gun_t70_transactionPostAction($post_data) {
	// create, Flash, confirm/abort
	$p_transactionId = $post_data['_transaction_id'] ;
	$p_subaction = $post_data['_subaction'] ;
	
	switch( $p_subaction ) {
		case 'abort' :
			if( isset($_SESSION['transactions'][$p_transactionId]) 
				&& ($_SESSION['transactions'][$p_transactionId]['transaction_code'] == 'specDbsTracy_gun_t70') ) {
				
				unset($_SESSION['transactions'][$p_transactionId]) ;
			}
			return array('success'=>true) ;
			break ;
			
		case 'create' :
			
			break ;
			
		default :
			break ;
	}
	
}


?>
