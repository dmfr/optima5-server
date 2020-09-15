<?php

define('SPECDBSTRACY_GUN_T70_CODE','specDbsTracy_gun_t70') ;

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
	global $_opDB ;
	
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
	$mapCarrier_code_isIntegrateur = array() ;
	foreach( $json_cfg['cfg_list'] as $list ) {
		if( $list['bible_code'] == 'LIST_CARRIER' ) {
			foreach( $list['records'] as $carrier_row ) {
				$mapCarrier_code_txt[$carrier_row['id']] = $carrier_row['text'] ;
			}
		}
	}
	$query = "SELECT entry_key,field_IS_INTEGRATEUR FROM view_bible_LIST_CARRIER_entry" ;
	$result = $_opDB->query($query);
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$mapCarrier_code_isIntegrateur[$arr[0]] = !!$arr[1] ;
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
		$count_trspt = $count_parcel = $count_order = $count_order_final = 0 ;
		foreach( $trspt_rows as $trspt_row ) {
			if( !$trspt_row['orders'] ) {
				continue ;
			}
			$count_order_final += count($trspt_row['orders']) ;
			foreach( $trspt_row['hats'] as $hat_row ) {
				$count_order++ ;
				$count_parcel+= count($hat_row['parcels']) ;
			}
			$count_trspt++ ;
		}
		$data[] = array(
			'mvt_carrier' => $carrier_code,
			'mvt_carrier_txt' => $mapCarrier_code_txt[$carrier_code],
			'is_integrateur' => $mapCarrier_code_isIntegrateur[$carrier_code],
			'count_trspt' => $count_trspt,
			'count_parcel' => $count_parcel,
			'count_order' => $count_order,
			'count_order_final' => $count_order_final
		);
	}
	return array('success'=>true, 'data'=>$data) ;
}

function specDbsTracy_gun_t70_transactionGetActiveId($post_data) {
	// TMP: only one active session, using PHP SESSION, (no database)
	$transaction_id = null ;
	if( isset($_SESSION['transactions']) ) {
		foreach( $_SESSION['transactions'] as $iter_transaction_id => $dummy ) {
			if( $_SESSION['transactions'][$iter_transaction_id]['transaction_code'] == SPECDBSTRACY_GUN_T70_CODE ) {
				$transaction_id = $iter_transaction_id ;
			}
		}
	}
	usleep(100*1000) ;
	return array('success'=>true, 'transaction_id'=>$transaction_id) ;
}

function specDbsTracy_gun_t70_transactionGetSummary($post_data) {
	$p_transactionId = $post_data['_transaction_id'] ;
	if( isset($_SESSION['transactions'][$p_transactionId]) 
		&& ($_SESSION['transactions'][$p_transactionId]['transaction_code'] == SPECDBSTRACY_GUN_T70_CODE) ) {
	} else {
		return array('success'=>false) ;
	}
	
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
	
	$obj_brt = $_SESSION['transactions'][$p_transactionId]['obj_brt'] ;
	$data_header = array() ;
	$data_header['mvt_carrier_txt'] = $mapCarrier_code_txt[$obj_brt['mvt_carrier']] ;
	if( $obj_brt['filter_soc'] ) {
		$data_header['mvt_carrier_txt'].= ' '.'('.$obj_brt['filter_soc'].')' ;
	}
	$data_header['date_create_txt'] = date('d/m/y H:i',strtotime($obj_brt['date_create'])) ;
	
	
	
	$data = array(
		'header' => $data_header,
		'grid' => $data_grid
	);
	return array('success'=>true, 'data'=>$data, 'debug'=>$obj_brt);
}
function specDbsTracy_gun_t70_transactionPostAction($post_data) {
	// create, Flash, confirm/abort
	$p_transactionId = $post_data['_transaction_id'] ;
	$p_subaction = $post_data['_subaction'] ;
	$p_data = json_decode($post_data['data'],true) ;
	
	switch( $p_subaction ) {
		case 'abort' :
			if( isset($_SESSION['transactions'][$p_transactionId]) 
				&& ($_SESSION['transactions'][$p_transactionId]['transaction_code'] == SPECDBSTRACY_GUN_T70_CODE) ) {
				
				unset($_SESSION['transactions'][$p_transactionId]) ;
			}
			return array('success'=>true) ;
			
		case 'create' :
			while( TRUE ) {
				$json = specDbsTracy_gun_t70_transactionGetActiveId(array()) ;
				if( !$json['success'] || !$json['transaction_id'] ) {
					break ;
				}
				specDbsTracy_gun_t70_transactionPostAction( array(
					'_subaction' => 'abort',
					'_transaction_id' => $json['transaction_id']
				)) ;
			}
			
			$obj_brt = array(
				'date_create' => date('Y-m-d H:i:s'),
				'mvt_carrier' => $p_data['mvt_carrier'],
				'filter_soc' => $p_data['filter_soc'],
				'arr_trsptFilerecordIds' => array(),
				'arr_parcelFilerecordIds' => array()
			) ;
			
			$transaction_id = $_SESSION['next_transaction_id']++ ;
		
			$_SESSION['transactions'][$transaction_id] = array() ;
			$_SESSION['transactions'][$transaction_id]['transaction_code'] = SPECDBSTRACY_GUN_T70_CODE ;
			$_SESSION['transactions'][$transaction_id]['obj_brt'] = $obj_brt ;
			
			return array('success'=>true, 'transaction_id'=>$transaction_id) ;
			
		default :
			break ;
	}
	
}


?>
