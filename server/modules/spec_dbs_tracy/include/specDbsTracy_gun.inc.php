<?php

define('SPECDBSTRACY_GUN_T60_CODE','specDbsTracy_gun_t60') ;
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
		$arr_trsptFilerecordIds = array() ;
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
			$arr_trsptFilerecordIds[] = $trspt_row['trspt_filerecord_id'] ;
		}
		$data[] = array(
			'mvt_carrier' => $carrier_code,
			'mvt_carrier_txt' => $mapCarrier_code_txt[$carrier_code],
			'is_integrateur' => $mapCarrier_code_isIntegrateur[$carrier_code],
			'count_trspt' => $count_trspt,
			'count_parcel' => $count_parcel,
			'count_order' => $count_order,
			'count_order_final' => $count_order_final,
			'arr_trsptFilerecordIds' => $arr_trsptFilerecordIds
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
	$mapConsignee_code_txt = array() ;
	foreach( $json_cfg['cfg_list'] as $list ) {
		if( $list['bible_code'] == 'LIST_CARRIER' ) {
			foreach( $list['records'] as $carrier_row ) {
				$mapCarrier_code_txt[$carrier_row['id']] = $carrier_row['text'] ;
			}
		}
		if( $list['bible_code'] == 'LIST_CONSIGNEE' ) {
			foreach( $list['records'] as $consignee_row ) {
				$mapConsignee_code_txt[$consignee_row['id']] = $consignee_row['text'] ;
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
	
	$data_grid = array() ;
	foreach( $obj_brt['arr_trsptFilerecordIds'] as $trspt_filerecord_id ) {
		$json = specDbsTracy_trspt_getRecords(array('filter_trsptFilerecordId_arr'=>json_encode(array($trspt_filerecord_id)))) ;
		$trspt_row = $json['data'][0] ;
		
		$has_warning = FALSE ;
		foreach( $trspt_row['orders'] as $order_row ) {
			if( $order_row['warning_is_on'] ) {
				$has_warning = TRUE ;
				$has_warning_code = $order_row['warning_code'] ;
				break ;
			}
		}
		
		foreach( $trspt_row['hats'] as $hat_row ) {
			$hat_filerecord_id = $hat_row['hat_filerecord_id'] ;
		
			$arr_hatparcelFilerecordIds = array() ;
			foreach( $hat_row['parcels'] as $hatparcel_row ) {
				$arr_hatparcelFilerecordIds[] = $hatparcel_row['hatparcel_filerecord_id'] ;
			}
			
			$data_grid[] = array(
				'trspt_filerecord_id' => $trspt_filerecord_id,
				'hat_filerecord_id' => $hat_filerecord_id,
				'id_doc' => $trspt_row['id_doc'],
				'id_hat' => $hat_row['id_hat'],
				'atr_consignee' => $trspt_row['atr_consignee'],
				'atr_consignee_txt' => $mapConsignee_code_txt[$trspt_row['atr_consignee']],
				'count_parcel_scan' => count(array_intersect($arr_hatparcelFilerecordIds,$obj_brt['arr_hatparcelFilerecordIds'])),
				'count_parcel_total' => count($arr_hatparcelFilerecordIds),
				'is_warning' => $has_warning,
				'is_warning_code' => $has_warning_code
			);
		}
		
		
	}
	
	
	$data = array(
		'header' => $data_header,
		'grid' => $data_grid
	);
	return array('success'=>true, 'data'=>$data, 'debug'=>$obj_brt);
}
function specDbsTracy_gun_t70_lib_populateTrspt( &$obj_brt ) {
	$forward_post = array() ;
	foreach( $obj_brt as $mkey => $mvalue ) {
		if( strpos($mkey,'filter_')===0 ) {
			$forward_post[$mkey] = $mvalue ;
		}
	}
	$json = specDbsTracy_gun_t70_getTrsptList($forward_post) ;
	foreach( $json['data'] as $trsptgroup_row ) {
		if( $trsptgroup_row['mvt_carrier'] != $obj_brt['mvt_carrier'] ) {
			continue ;
		}
		if( !$trsptgroup_row['is_integrateur'] ) {
			continue ;
		}
		foreach( $trsptgroup_row['arr_trsptFilerecordIds'] as $trspt_filerecord_id ) {
			if( !in_array($trspt_filerecord_id,$obj_brt['arr_trsptFilerecordIds']) ) {
				$obj_brt['arr_trsptFilerecordIds'][] = $trspt_filerecord_id ;
			}
		}
	}
}
function specDbsTracy_gun_t70_transactionPostAction($post_data, $_recycle=false) {
	global $_opDB ;
	
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
				'arr_hatparcelFilerecordIds' => array()
			) ;
			specDbsTracy_gun_t70_lib_populateTrspt($obj_brt) ;
			
			$transaction_id = $_SESSION['next_transaction_id']++ ;
		
			$_SESSION['transactions'][$transaction_id] = array() ;
			$_SESSION['transactions'][$transaction_id]['transaction_code'] = SPECDBSTRACY_GUN_T70_CODE ;
			$_SESSION['transactions'][$transaction_id]['obj_brt'] = $obj_brt ;
			
			return array('success'=>true, 'transaction_id'=>$transaction_id) ;
		
		case 'eject' :
			$p_hatparcelFilerecordId = $post_data['hatparcel_filerecord_id'] ;
			$obj_brt = $_SESSION['transactions'][$p_transactionId]['obj_brt'] ;
			if( !$obj_brt ) {
				return array('success'=>false) ;
			}
			if( ($idx=array_search($p_hatparcelFilerecordId,$obj_brt['arr_hatparcelFilerecordIds'])) === FALSE ) {
				return array('success'=>false) ;
			}
			unset( $obj_brt['arr_hatparcelFilerecordIds'][$idx] ) ;
			$_SESSION['transactions'][$p_transactionId]['obj_brt'] = $obj_brt ;
			return array('success'=>true) ;
		
		case 'scan' :
			$p_scanval = strtoupper(trim($post_data['scanval'])) ;
			for( $i=0 ; $i<2 ; $i++ ) {
				$do_sanitize = !!$i ;
				if( $do_sanitize ) {
					$p_scanval = preg_replace("/[^0-9\s]/", "", $p_scanval) ;
					$p_scanval = (string)(int)$p_scanval ;
				}
				$forward_post = $post_data ;
				$forward_post['_subaction'] = 'scan_pass' ;
				$forward_post['scanval'] = $p_scanval ;
				$res = specDbsTracy_gun_t70_transactionPostAction( $forward_post ) ;
				if( $res['success'] && $res['data']['header']['result_type']=='fail' ) {
					continue ;
				}
				break ;
			}
			return $res ;
			
		case 'scan_pass' :
			$obj_brt = $_SESSION['transactions'][$p_transactionId]['obj_brt'] ;
			if( !$obj_brt ) {
				return array(
					'success'=>true,
					'data' => array(
						'header'=>array('result_type' => 'fail'),
						'reason' => "Session error\nStart new transaction"
					)
				);
			}
			
			$p_scanval = strtoupper(trim($post_data['scanval'])) ;
			if( !$p_scanval ) {
				return array(
					'success'=>true,
					'data' => array(
						'header'=>array('result_type' => 'fail'),
						'reason' => "Scan value is empty"
					)
				);
			}
			$p_scanval = $_opDB->escape_string($p_scanval) ;
			
			// CFG: liste des socs
			$ttmp = specDbsTracy_cfg_getConfig() ;
			$json_cfg = $ttmp['data'] ;
			$arr_socCodes = array() ;
			foreach( $json_cfg['cfg_soc'] as $soc_row ) {
				$arr_socCodes[] = $soc_row['soc_code'] ;
			}
			
			$scanval_type = 'hat_parcel' ;
			$ttmp = explode('/',$p_scanval) ;
			if( (count($ttmp)==2) && in_array($ttmp[0],$arr_socCodes) ) {
				$scanval_type = 'trspt_id_doc' ;
			}
			
			while( TRUE ) {
				switch( $scanval_type ) {
					case 'hat_parcel' :
						$query = "SELECT hp.filerecord_id FROM view_file_HAT_PARCEL hp
									JOIN view_file_HAT h ON h.filerecord_id=hp.filerecord_parent_id
									WHERE 0
									OR h.field_ID_HAT='{$p_scanval}' 
									OR hp.field_SPEC_BARCODE='{$p_scanval}' 
									OR hp.field_TMS_TRACKING='{$p_scanval}'" ;
						$result = $_opDB->query($query) ;
						if( $_opDB->num_rows($result) != 1 ) {
							break 2 ;
						}
						$arr = $_opDB->fetch_row($result) ;
						$hatparcel_filerecord_id = $arr[0] ;
						
						$query = "SELECT distinct hp.filerecord_id, tc.filerecord_parent_id 
									FROM view_file_HAT_PARCEL hp 
									JOIN view_file_HAT_CDE hc ON hc.filerecord_parent_id=hp.filerecord_parent_id AND hc.field_LINK_IS_CANCEL='0' 
									JOIN view_file_TRSPT_CDE tc ON tc.field_FILE_CDE_ID=hc.field_FILE_CDE_ID AND tc.field_LINK_IS_CANCEL='0' 
									WHERE hp.filerecord_id='{$hatparcel_filerecord_id}'" ;
						$result = $_opDB->query($query) ;
						if( $_opDB->num_rows($result) != 1 ) {
							break 2 ;
						}
						$arr = $_opDB->fetch_row($result) ;
						$trspt_filerecord_id = $arr[1] ;
						
						$primary_key = array(
							'name' => 'hatparcel_filerecord_id',
							'value' => $hatparcel_filerecord_id
						);
						break ;
						
					case 'trspt_id_doc' :
						$query = "SELECT filerecord_id FROM view_file_TRSPT WHERE field_ID_DOC='{$p_scanval}'" ;
						$result = $_opDB->query($query) ;
						if( $_opDB->num_rows($result) != 1 ) {
							break 2 ;
						}
						$arr = $_opDB->fetch_row($result) ;
						$trspt_filerecord_id = $arr[0] ;
						
						$primary_key = array(
							'name' => 'trpst_filerecord_id',
							'value' => $trspt_filerecord_id
						);
						break ;
				}
				break ;
			}
			if( !$trspt_filerecord_id && !$_recycle ) {
				// 22/12/2020 : cas du flash d'un BL => retrieve du parcel
				while( TRUE ) { // mode fallback
					$query = "SELECT filerecord_id FROM view_file_CDE WHERE field_ID_DN='{$p_scanval}'" ;
					$order_filerecord_id = $_opDB->query_uniqueValue($query) ;
					if( !$order_filerecord_id ) {
						break ;
					}
					$query = "SELECT h.field_ID_HAT
								FROM view_file_HAT h
								JOIN view_file_HAT_CDE hc ON hc.filerecord_parent_id=h.filerecord_id
								WHERE hc.field_FILE_CDE_ID='{$order_filerecord_id}'" ;
					$fallback_idHat = $_opDB->query_uniqueValue($query) ;
					if( $fallback_idHat ) {
						$forward_post = $post_data ;
						$forward_post['scanval'] = $fallback_idHat ;
						return specDbsTracy_gun_t70_transactionPostAction( $forward_post, $_recycle=true ) ;
					}
					
					
					break ;
				}
				
				
				return array(
					'success'=>true,
					'data' => array(
						'header'=>array('result_type' => 'fail'),
						'reason' => 'Scanned item not recognized'
					)
				);
			}
			$json = specDbsTracy_trspt_getRecords(array('filter_trsptFilerecordId_arr'=>json_encode(array($trspt_filerecord_id)))) ;
			$trspt_row = $json['data'][0] ;
			
			//print_r($trspt_row) ;
			$fields = array() ;
			$fields[] = array(
				'label' => 'Trspt. Doc',
				'text' => $trspt_row['id_doc']
			);
			$fields[] = array(
				'label' => 'Carrier',
				'text' => $trspt_row['mvt_carrier']
			);
			$fields[] = array(
				'label' => 'Consignee',
				'text' => $trspt_row['atr_consignee']
			);
			if( !$hatparcel_filerecord_id ) {
				$order_ids = array() ;
				foreach( $trspt_row['orders'] as $order_row ) {
					$order_ids[] = $order_row['id_dn'] ;
				}
				$fields[] = array(
					'label' => 'Order(s)',
					'text' => implode(' ',$order_ids)
				);
			}
			if( $hatparcel_filerecord_id ) {
				$hat_row = $hatparcel_row = NULL ;
				foreach( $trspt_row['hats'] as $iter_hat_row ) {
					foreach( $iter_hat_row['parcels'] as $iter_hatparcel_row ) {
						if( $iter_hatparcel_row['hatparcel_filerecord_id'] == $hatparcel_filerecord_id ) {
							$hat_row = $iter_hat_row ;
							$hatparcel_row = $iter_hatparcel_row ;
						}
					}
				}
				$fields[] = array(
					'label' => 'ShipGroup #',
					'text' => $hat_row['id_hat']
				);
				$order_ids = array() ;
				foreach( $hat_row['orders'] as $order_row ) {
					$order_ids[] = $order_row['id_dn'] ;
				}
				$fields[] = array(
					'label' => 'Order(s)',
					'text' => implode(' ',$order_ids)
				);
				if( $hatparcel_row['tms_tracking'] ) {
					$fields[] = array(
						'label' => 'Tracking',
						'text' => $hatparcel_row['tms_tracking']
					);
				}
				$fields[] = array(
					'label' => 'Weight',
					'text' => $hatparcel_row['vol_kg'].' kg'
				);
				
			}
			
			// Conditions :
			// - step_code_next
			// - mvt_carrier
			// - filter_soc ?
			$errors = array() ;
			if( $trspt_row['calc_step_next'] != '70_PICKUP' ) {
				$errors[] = 'Not ready for step 70_PICKUP' ;
			}
			if( $trspt_row['mvt_carrier'] != $obj_brt['mvt_carrier'] ) {
				$errors[] = 'Trspt doc to wrong carrier' ;
			}
			if( $obj_brt['filter_soc'] && ($obj_brt['filter_soc']!=$trspt_row['id_soc']) ) {
				$errors[] = 'Trspt doc to different entity ('.$trspt_row['id_soc'].')' ;
			}
			
			$result_type = ($errors ? 'fail' : 'success');
			if( $errors ) {
				$reason = ''; 
				foreach( $errors as $error ) {
					$reason.= '- '.$error."\n" ;
				}
			}
			
			
			if( $result_type=='success' ) {
				$arr_hatparcelFilerecordIds = array() ;
				if( $hatparcel_filerecord_id ) {
					$arr_hatparcelFilerecordIds[] = $hatparcel_filerecord_id ;
					if( in_array($hatparcel_filerecord_id,$obj_brt['arr_hatparcelFilerecordIds']) ) {
						$result_type = 'repeat' ;
					}
				} else {
					foreach( $trspt_row['hats'] as $iter_hat_row ) {
						foreach( $iter_hat_row['parcels'] as $iter_hatparcel_row ) {
							$arr_hatparcelFilerecordIds[] = $iter_hatparcel_row['hatparcel_filerecord_id'] ;
						}
					}
				}
				
				if( !in_array($trspt_filerecord_id,$obj_brt['arr_trsptFilerecordIds']) ) {
					$obj_brt['arr_trsptFilerecordIds'][] = $trspt_filerecord_id ;
				}
				foreach( $arr_hatparcelFilerecordIds as $hatparcel_filerecord_id ) {
					if( !in_array($hatparcel_filerecord_id,$obj_brt['arr_hatparcelFilerecordIds']) ) {
						$obj_brt['arr_hatparcelFilerecordIds'][] = $hatparcel_filerecord_id ;
					}
				}
				$_SESSION['transactions'][$p_transactionId]['obj_brt'] = $obj_brt ;
			}
			
			
			return array(
				'success'=>true,
				'data' => array(
					'header'=>array('result_type' => $result_type),
					'primary_key' => $primary_key,
					'fields' => $fields,
					'reason' => $reason
				)
			);
			
			
		case 'validate' :
		case 'submit' :
			$obj_brt = $_SESSION['transactions'][$p_transactionId]['obj_brt'] ;
			specDbsTracy_gun_t70_lib_populateTrspt($obj_brt) ;
			$_SESSION['transactions'][$p_transactionId]['obj_brt'] = $obj_brt ;
			
			$json = specDbsTracy_gun_t70_transactionGetSummary( array('_transaction_id'=>$p_transactionId) ) ;
			foreach( $json['data']['grid'] as $trsptsum_row ) {
				if( $trsptsum_row['is_warning'] ) {
					continue ;
				}
				if( $trsptsum_row['count_parcel_scan'] < $trsptsum_row['count_parcel_total'] ) {
					return array('success'=>false, 'error'=>'Missing parcels / Partial take') ;
				}
			}
			foreach( $json['data']['grid'] as $trsptsum_row ) {
				if( $trsptsum_row['is_warning'] && $trsptsum_row['count_parcel_scan'] ) {
					return array('success'=>false, 'error'=>'Parcels on warning') ;
				}
			}
			
			$arr_trsptFilerecordIds = array() ;
			foreach( $obj_brt['arr_trsptFilerecordIds'] as $trspt_filerecord_id ) {
				foreach( $json['data']['grid'] as $trsptsum_row ) {
					if( $trsptsum_row['trspt_filerecord_id'] == $trspt_filerecord_id 
					&& !$trsptsum_row['is_warning'] ) {
						$arr_trsptFilerecordIds[] = $trspt_filerecord_id ;
					}
				}
			}
			
			if( !$arr_trsptFilerecordIds ) {
				return array('success'=>false, 'error'=>'Empty manifest') ;
			}
			
			$weight_kg = $count_parcel = 0 ;
			$json = specDbsTracy_trspt_getRecords(array('filter_trsptFilerecordId_arr'=>json_encode($arr_trsptFilerecordIds))) ;
			foreach( $json['data'] as $trspt_row ) {
				foreach( $trspt_row['hats'] as $hat_row ) {
					foreach( $hat_row['parcels'] as $hatparcel_row ) {
						$weight_kg+= $hatparcel_row['vol_kg'] ;
						$count_parcel++ ;
					}
				}
			}
			
			if( $p_subaction=='validate' ) {
				$fields = array() ;
				// build fieldset summary
				$fields[] = array(
					'label' => 'Carrier',
					'text' => $obj_brt['mvt_carrier']
				);
				$fields[] = array(
					'label' => 'Nb.Parcels',
					'text' => $count_parcel
				);
				$fields[] = array(
					'label' => 'Weight',
					'text' => $weight_kg.' '.'kg'
				);
				return array('success'=>true, 'data'=>array('fields'=>$fields)) ;
			}
			
			$p_data ;
			// - Creation du file TRSPTPICK
			// - Assoc TRSPTPICK_TRSPT
			// - passage 70_PICKUP
			// - genetation du PDF ? //TODO
			// - pour chaque TRPST : creation TRSPT_EVENT
			
			$prefix = 'PICK/' ;
			$prefix_len = strlen($prefix) ;
			$offset = $prefix_len+1 ;
			$query = "SELECT max(substring(field_ID_PICK,{$offset},5)) FROM view_file_TRSPTPICK WHERE field_ID_PICK LIKE '{$prefix}%'" ;
			$max_idx = $_opDB->query_uniqueValue($query) ;
			
			$max_idx++ ;
			
			$arr_ins = array() ;
			$arr_ins['field_ID_PICK'] = $prefix.str_pad((float)$max_idx, 5, "0", STR_PAD_LEFT) ;
			$arr_ins['field_ATR_NAME'] = trim($p_data['atr_name']) ;
			$arr_ins['field_ATR_LPLATE'] = trim($p_data['atr_lplate']) ;
			$arr_ins['field_DATE_CREATE'] = date('Y-m-d H:i:s') ;
			$pick_filerecord_id = paracrm_lib_data_insertRecord_file( 'TRSPTPICK', 0, $arr_ins );
			
			$_id_pick = $arr_ins['field_ID_PICK'] ;
			
			foreach( $arr_trsptFilerecordIds as $trspt_filerecord_id ) {
				$params = array(
					'trspt_filerecord_id' => $trspt_filerecord_id,
					'step_code' => '70_PICKUP'
				) ;
				$ttmp = specDbsTracy_trspt_stepValidate( $params ) ;
				
				$event_txt = "Pickup manifest {$_id_pick}"."\n" ;
				$event_txt.= '- Driver name : '.$arr_ins['field_ATR_NAME']."\n" ;
				$event_txt.= '- License plate : '.$arr_ins['field_ATR_LPLATE']."\n" ;
				
				$arr_ins = array() ;
				$arr_ins['field_EVENT_DATE'] = date('Y-m-d H:i:s') ;
				$arr_ins['field_EVENT_USER'] = 'PICK' ;
				$arr_ins['field_EVENT_TXT'] = $event_txt ;
				$arr_ins['field_EVENTLINK_FILE'] = 'TRSPTPICK' ;
				$arr_ins['field_EVENTLINK_IDS_JSON'] = json_encode(array('PRINT'=>$pick_filerecord_id)) ;
				$trsptevent_filerecord_id = paracrm_lib_data_insertRecord_file( 'TRSPT_EVENT', $trspt_filerecord_id, $arr_ins );
				
				$arr_ins = array() ;
				$arr_ins['field_FILE_TRSPT_ID'] = $trspt_filerecord_id ;
				$arr_ins['field_LINK_IS_CANCEL'] = 0 ;
				$picklink_filerecord_id = paracrm_lib_data_insertRecord_file( 'TRSPTPICK_TRSPT', $pick_filerecord_id, $arr_ins );
			}
			
			// PDF create
			$json_pdf = specDbsTracy_trsptpick_printDoc(array('trsptpick_filerecord_id'=>$pick_filerecord_id)) ;
			if( $json_pdf['pdf_base64'] ) {
				$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
				$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;
				media_contextOpen( $_sdomain_id ) ;
				$tmp_media_id = media_bin_processBuffer( base64_decode($json_pdf['pdf_base64']) ) ;
				media_bin_move( $tmp_media_id , media_bin_toolFile_getId('TRSPTPICK',$pick_filerecord_id) ) ;
				media_contextClose() ;
			}
			
			$fields = array() ;
			// build fieldset summary
			$fields[] = array(
				'label' => 'Carrier',
				'text' => $obj_brt['mvt_carrier']
			);
			$fields[] = array(
				'label' => 'Manifest #',
				'text' => $_id_pick
			);
			$fields[] = array(
				'label' => '<i>Driver name</i>',
				'text' => $p_data['atr_name']
			);
			$fields[] = array(
				'label' => '<i>License plate</i>',
				'text' => $p_data['atr_lplate']
			);
			$fields[] = array(
				'label' => 'Nb.Parcels',
				'text' => $count_parcel
			);
			$fields[] = array(
				'label' => 'Weight',
				'text' => $weight_kg.' '.'kg'
			);
			
			unset( $_SESSION['transactions'][$p_transactionId] ) ;
			return array(
				'success'=>true,
				'data' => array(
					'header'=>array('result_type' => 'final'),
					'fields' => $fields
				)
			) ;
		
		default :
			break ;
	}
	
}

function specDbsTracy_gun_t70_setWarning($post_data) {
	// HACK! force bible entry
	$treenode_key = 'GUN' ;
	$arr_ins = array() ;
	$arr_ins['field_NODE'] = $treenode_key ;
	paracrm_lib_data_insertRecord_bibleTreenode('LIST_WARNINGCODE',$treenode_key,'',$arr_ins) ;
	$entry_key = '999-GUN-T70' ;
	$arr_ins = array() ;
	$arr_ins['field_CODE'] = $entry_key ;
	$arr_ins['field_TXT'] = 'Warning Gun T70' ;
	paracrm_lib_data_insertRecord_bibleEntry('LIST_WARNINGCODE', $entry_key, $treenode_key, $arr_ins ) ;
	
	
	$p_trsptFilerecordId = $post_data['trspt_filerecord_id'] ;
	$p_warningAction = $post_data['warning_action'] ;
	
	switch( $p_warningAction ) {
		case 'set' :
			$form_data = array(
				'warning_is_on' => true,
				'warning_code' => $entry_key,
				'warning_txt' => 'Set on '.date('d/m/Y H:i')
			);
			break ;
			
		case 'unset' :
			$form_data = array(
				'warning_is_on' => false
			);
			break ;
	}
	
	$json = specDbsTracy_trspt_getRecords(array('filter_trsptFilerecordId_arr'=>json_encode(array($p_trsptFilerecordId)))) ;
	$trspt_row = $json['data'][0] ;
	foreach( $trspt_row['orders'] as $order_row ) {
		if( $order_row['warning_is_on'] == $form_data['warning_is_on'] ) {
			continue ;
		}
		
		$forward_post = array(
			'order_filerecord_id' => $order_row['order_filerecord_id'],
			'data' => json_encode($form_data)
		);
		specDbsTracy_order_setWarning($forward_post) ;
	}
	return array('success'=>true) ;
}









function specDbsTracy_gun_t60_transactionGetActiveId($post_data) {
	// TMP: only one active session, using PHP SESSION, (no database)
	$transaction_id = null ;
	if( isset($_SESSION['transactions']) ) {
		foreach( $_SESSION['transactions'] as $iter_transaction_id => $dummy ) {
			if( $_SESSION['transactions'][$iter_transaction_id]['transaction_code'] == SPECDBSTRACY_GUN_T60_CODE ) {
				$transaction_id = $iter_transaction_id ;
			}
		}
	}
	usleep(100*1000) ;
	return array('success'=>true, 'transaction_id'=>$transaction_id) ;
}
function specDbsTracy_gun_t60_lib_stepValidate( $obj_brt ) {
	$json = specDbsTracy_trspt_getRecords(array('filter_trsptFilerecordId_arr'=>json_encode($obj_brt['arr_trsptFilerecordIds']))) ;
	foreach( $json['data'] as $trspt_row ) {
		$trspt_filerecord_id = $trspt_row['trspt_filerecord_id'] ;
	
		// next step = 60_TRSPTREADY
		if( $trspt_row['calc_step_next'] != '60_TRSPTREADY' ) {
			continue ;
		}
		
		// scan complet ?
		$complete = TRUE ;
		$arr_hatparcelFilerecordIds = array() ;
		foreach( $trspt_row['hats'] as $iter_hat_row ) {
			foreach( $iter_hat_row['parcels'] as $iter_hatparcel_row ) {
				$arr_hatparcelFilerecordIds[] = $iter_hatparcel_row['hatparcel_filerecord_id'] ;
			}
		}
		foreach( $arr_hatparcelFilerecordIds as $hatparcel_filerecord_id ) {
			if( !in_array($hatparcel_filerecord_id,$obj_brt['arr_hatparcelFilerecordIds']) ) {
				$complete = FALSE ;
			}
		}
		if( !$complete ) {
			continue ;
		}
		
		$params = array(
			'trspt_filerecord_id' => $trspt_filerecord_id,
			'step_code' => '60_TRSPTREADY'
		) ;
		$ttmp = specDbsTracy_trspt_stepValidate( $params ) ;
	}
}
function specDbsTracy_gun_t60_postAction($post_data) {
	global $_opDB ;
	
	// create, Flash, confirm/abort
	$p_transactionId = $post_data['_transaction_id'] ;
	$p_subaction = $post_data['_subaction'] ;
	$p_data = json_decode($post_data['data'],true) ;
	
	switch( $p_subaction ) {
		case 'close' :
			if( isset($_SESSION['transactions'][$p_transactionId]) 
				&& ($_SESSION['transactions'][$p_transactionId]['transaction_code'] == SPECDBSTRACY_GUN_T60_CODE) ) {
				
				unset($_SESSION['transactions'][$p_transactionId]) ;
			}
			return array('success'=>true) ;
		
		
		case 'open' :
			while( TRUE ) {
				$json = specDbsTracy_gun_t60_transactionGetActiveId(array()) ;
				if( $json['success'] && $json['transaction_id'] ) {
					return array('success'=>true, 'transaction_id'=>$json['transaction_id']) ;
				}
				break ;
			}
			
			$obj_brt = array(
				'date_create' => date('Y-m-d H:i:s'),
				'arr_trsptFilerecordIds' => array(),
				'arr_hatparcelFilerecordIds' => array()
			) ;
			
			$transaction_id = $_SESSION['next_transaction_id']++ ;
		
			$_SESSION['transactions'][$transaction_id] = array() ;
			$_SESSION['transactions'][$transaction_id]['transaction_code'] = SPECDBSTRACY_GUN_T60_CODE ;
			$_SESSION['transactions'][$transaction_id]['obj_brt'] = $obj_brt ;
			
			return array('success'=>true, 'transaction_id'=>$transaction_id) ;
		
		
		case 'scan' :
			$obj_brt = $_SESSION['transactions'][$p_transactionId]['obj_brt'] ;
			if( !$obj_brt ) {
				return array(
					'success'=>true,
					'data' => array(
						'header'=>array('result_type' => 'fail'),
						'reason' => "Session error\nStart new transaction"
					)
				);
			}
			
			$p_scanval = strtoupper(trim($post_data['scanval'])) ;
			if( !$p_scanval ) {
				return array(
					'success'=>true,
					'data' => array(
						'header'=>array('result_type' => 'fail'),
						'reason' => "Scan value is empty"
					)
				);
			}
			$p_scanval = $_opDB->escape_string($p_scanval) ;
			
			// CFG: liste des socs
			$ttmp = specDbsTracy_cfg_getConfig() ;
			$json_cfg = $ttmp['data'] ;
			$arr_socCodes = array() ;
			foreach( $json_cfg['cfg_soc'] as $soc_row ) {
				$arr_socCodes[] = $soc_row['soc_code'] ;
			}
			
			$scanval_type = 'hat_parcel' ;
			$ttmp = explode('/',$p_scanval) ;
			if( (count($ttmp)==2) && in_array($ttmp[0],$arr_socCodes) ) {
				$scanval_type = 'trspt_id_doc' ;
			}
			
			while( TRUE ) {
				switch( $scanval_type ) {
					case 'hat_parcel' :
						$query = "SELECT hp.filerecord_id FROM view_file_HAT_PARCEL hp
									JOIN view_file_HAT h ON h.filerecord_id=hp.filerecord_parent_id
									WHERE 0
									OR h.field_ID_HAT='{$p_scanval}' 
									OR hp.field_SPEC_BARCODE='{$p_scanval}' 
									OR hp.field_TMS_TRACKING='{$p_scanval}'" ;
						$result = $_opDB->query($query) ;
						if( $_opDB->num_rows($result) != 1 ) {
							break 2 ;
						}
						$arr = $_opDB->fetch_row($result) ;
						$hatparcel_filerecord_id = $arr[0] ;
						
						$query = "SELECT distinct hp.filerecord_id, tc.filerecord_parent_id 
									FROM view_file_HAT_PARCEL hp 
									JOIN view_file_HAT_CDE hc ON hc.filerecord_parent_id=hp.filerecord_parent_id AND hc.field_LINK_IS_CANCEL='0' 
									JOIN view_file_TRSPT_CDE tc ON tc.field_FILE_CDE_ID=hc.field_FILE_CDE_ID AND tc.field_LINK_IS_CANCEL='0' 
									WHERE hp.filerecord_id='{$hatparcel_filerecord_id}'" ;
						$result = $_opDB->query($query) ;
						if( $_opDB->num_rows($result) != 1 ) {
							break 2 ;
						}
						$arr = $_opDB->fetch_row($result) ;
						$trspt_filerecord_id = $arr[1] ;
						
						$primary_key = array(
							'name' => 'hatparcel_filerecord_id',
							'value' => $hatparcel_filerecord_id
						);
						break ;
						
					case 'trspt_id_doc' :
						$query = "SELECT filerecord_id FROM view_file_TRSPT WHERE field_ID_DOC='{$p_scanval}'" ;
						$result = $_opDB->query($query) ;
						if( $_opDB->num_rows($result) != 1 ) {
							break 2 ;
						}
						$arr = $_opDB->fetch_row($result) ;
						$trspt_filerecord_id = $arr[0] ;
						
						$primary_key = array(
							'name' => 'trpst_filerecord_id',
							'value' => $trspt_filerecord_id
						);
						break ;
				}
				break ;
			}
			if( !$trspt_filerecord_id ) {
				return array(
					'success'=>true,
					'data' => array(
						'header'=>array('result_type' => 'fail'),
						'reason' => 'Scanned item not recognized'
					)
				);
			}
			$json = specDbsTracy_trspt_getRecords(array('filter_trsptFilerecordId_arr'=>json_encode(array($trspt_filerecord_id)))) ;
			$trspt_row = $json['data'][0] ;
			
			//print_r($trspt_row) ;
			$fields = array() ;
			$fields[] = array(
				'label' => 'Trspt. Doc',
				'text' => $trspt_row['id_doc']
			);
			$fields[] = array(
				'label' => 'Carrier',
				'text' => $trspt_row['mvt_carrier']
			);
			$fields[] = array(
				'label' => 'Consignee',
				'text' => $trspt_row['atr_consignee']
			);
			if( !$hatparcel_filerecord_id ) {
				$order_ids = array() ;
				foreach( $trspt_row['orders'] as $order_row ) {
					$order_ids[] = $order_row['id_dn'] ;
				}
				$fields[] = array(
					'label' => 'Order(s)',
					'text' => implode(' ',$order_ids)
				);
			}
			if( $hatparcel_filerecord_id ) {
				$hat_row = $hatparcel_row = NULL ;
				foreach( $trspt_row['hats'] as $iter_hat_row ) {
					foreach( $iter_hat_row['parcels'] as $iter_hatparcel_row ) {
						if( $iter_hatparcel_row['hatparcel_filerecord_id'] == $hatparcel_filerecord_id ) {
							$hat_row = $iter_hat_row ;
							$hatparcel_row = $iter_hatparcel_row ;
						}
					}
				}
				$fields[] = array(
					'label' => 'ShipGroup #',
					'text' => $hat_row['id_hat']
				);
				$order_ids = array() ;
				foreach( $hat_row['orders'] as $order_row ) {
					$order_ids[] = $order_row['id_dn'] ;
				}
				$fields[] = array(
					'label' => 'Order(s)',
					'text' => implode(' ',$order_ids)
				);
				if( $hatparcel_row['tms_tracking'] ) {
					$fields[] = array(
						'label' => 'Tracking',
						'text' => $hatparcel_row['tms_tracking']
					);
				}
				$fields[] = array(
					'label' => 'Weight',
					'text' => $hatparcel_row['vol_kg'].' kg'
				);
				
			}
			
			// Conditions :
			// - step_code_next
			// - mvt_carrier
			// - filter_soc ?
			// HACK TODO : affichage du statut actuel si erreur
			$errors = array() ;
			if( $trspt_row['calc_step'] == '60_TRSPTREADY' ) {
				$errors[] = 'Already on 60_TRSPTREADY (duplicate)' ;
			} elseif( $trspt_row['calc_step_next'] != '60_TRSPTREADY' ) {
				$errors[] = 'Not ready for step 60_TRSPTREADY' ;
			}
			
			$result_type = ($errors ? 'fail' : 'success');
			if( $errors ) {
				$reason = ''; 
				foreach( $errors as $error ) {
					$reason.= '- '.$error."\n" ;
				}
			}
			
			
			if( $result_type=='success' ) {
				$arr_hatparcelFilerecordIds = array() ;
				if( $hatparcel_filerecord_id ) {
					$arr_hatparcelFilerecordIds[] = $hatparcel_filerecord_id ;
					if( in_array($hatparcel_filerecord_id,$obj_brt['arr_hatparcelFilerecordIds']) ) {
						$result_type = 'success' ;
					}
				}
				
				if( !in_array($trspt_filerecord_id,$obj_brt['arr_trsptFilerecordIds']) ) {
					$obj_brt['arr_trsptFilerecordIds'][] = $trspt_filerecord_id ;
				}
				foreach( $arr_hatparcelFilerecordIds as $hatparcel_filerecord_id ) {
					if( !in_array($hatparcel_filerecord_id,$obj_brt['arr_hatparcelFilerecordIds']) ) {
						$obj_brt['arr_hatparcelFilerecordIds'][] = $hatparcel_filerecord_id ;
					}
				}
				$_SESSION['transactions'][$p_transactionId]['obj_brt'] = $obj_brt ;
			}
			
			specDbsTracy_gun_t60_lib_stepValidate($obj_brt) ;
			
			// TODO HACK : Bouton impression si tms_printable
			
			return array(
				'success'=>true,
				'data' => array(
					'header'=>array('result_type' => $result_type),
					'primary_key' => $primary_key,
					'fields' => $fields,
					'reason' => $reason
				)
			);
			
		default :
			break ;
	}
	
}
function specDbsTracy_gun_t60_getSummary($post_data) {

	// HACK TODO : N'AFFICHER LE RESULTAT QUE DE LA DERNIERE TRANSACTION

	$p_transactionId = $post_data['_transaction_id'] ;
	if( isset($_SESSION['transactions'][$p_transactionId]) 
		&& ($_SESSION['transactions'][$p_transactionId]['transaction_code'] == SPECDBSTRACY_GUN_T60_CODE) ) {
	} else {
		return array('success'=>false) ;
	}
	
	// CFG: liste des carriers
	$ttmp = specDbsTracy_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	$mapCarrier_code_txt = array() ;
	$mapConsignee_code_txt = array() ;
	foreach( $json_cfg['cfg_list'] as $list ) {
		if( $list['bible_code'] == 'LIST_CARRIER' ) {
			foreach( $list['records'] as $carrier_row ) {
				$mapCarrier_code_txt[$carrier_row['id']] = $carrier_row['text'] ;
			}
		}
		if( $list['bible_code'] == 'LIST_CONSIGNEE' ) {
			foreach( $list['records'] as $consignee_row ) {
				$mapConsignee_code_txt[$consignee_row['id']] = $consignee_row['text'] ;
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
	
	$idx = 0 ;
	$data_grid = array() ;
	foreach( $obj_brt['arr_trsptFilerecordIds'] as $trspt_filerecord_id ) {
		$json = specDbsTracy_trspt_getRecords(array('filter_trsptFilerecordId_arr'=>json_encode(array($trspt_filerecord_id)))) ;
		$trspt_row = $json['data'][0] ;
		
		$has_warning = FALSE ;
		foreach( $trspt_row['orders'] as $order_row ) {
			if( $order_row['warning_is_on'] ) {
				$has_warning = TRUE ;
				$has_warning_code = $order_row['warning_code'] ;
				break ;
			}
		}
		
		foreach( $trspt_row['hats'] as $hat_row ) {
			$hat_filerecord_id = $hat_row['hat_filerecord_id'] ;
		
			$arr_hatparcelFilerecordIds = array() ;
			foreach( $hat_row['parcels'] as $hatparcel_row ) {
				$arr_hatparcelFilerecordIds[] = $hatparcel_row['hatparcel_filerecord_id'] ;
			}
			
			$data_grid[] = array(
				'_idx' => ++$idx,
				'trspt_filerecord_id' => $trspt_filerecord_id,
				'hat_filerecord_id' => $hat_filerecord_id,
				'id_doc' => $trspt_row['id_doc'],
				'id_hat' => $hat_row['id_hat'],
				'atr_consignee' => $trspt_row['atr_consignee'],
				'atr_consignee_txt' => $mapConsignee_code_txt[$trspt_row['atr_consignee']],
				'count_parcel_scan' => count(array_intersect($arr_hatparcelFilerecordIds,$obj_brt['arr_hatparcelFilerecordIds'])),
				'count_parcel_total' => count($arr_hatparcelFilerecordIds),
				'is_warning' => $has_warning,
				'is_warning_code' => $has_warning_code
			);
		}
		
		
	}
	
	
	$data = array(
		'header' => $data_header,
		'grid' => $data_grid
	);
	return array('success'=>true, 'data'=>$data, 'debug'=>$obj_brt);
}


?>
