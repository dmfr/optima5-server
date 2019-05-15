<?php
function specDbsTracy_trspt_tool_isDateValid( $date_sql )
{
	if( $date_sql == '0000-00-00' )
		return FALSE ;
	if( $date_sql == '0000-00-00 00:00:00' )
		return FALSE ;
	if( !$date_sql )
		return FALSE ;
	return TRUE ;
}

function specDbsTracy_trspt_getRecords( $post_data ) {
	global $_opDB ;
	
	// filter ?
	if( isset($post_data['filter_trsptFilerecordId_arr']) ) {
		$filter_trsptFilerecordId_list = $_opDB->makeSQLlist( json_decode($post_data['filter_trsptFilerecordId_arr'],true) ) ;
	}
	if( $post_data['filter_socCode'] ) {
		$filter_socCode = $post_data['filter_socCode'] ;
	}
	if( $post_data['filter_archiveIsOn'] ) {
		$filter_archiveIsOn = ( $post_data['filter_archiveIsOn'] ? true : false ) ;
	}
	
	$TAB_trspt = array() ;
	
	$query = "SELECT * FROM view_file_TRSPT t" ;
	$query.= " WHERE 1" ;
	if( isset($filter_trsptFilerecordId_list) ) {
		$query.= " AND t.filerecord_id IN {$filter_trsptFilerecordId_list}" ;
	} elseif( !$filter_archiveIsOn ) {
		$query.= " AND t.field_ARCHIVE_IS_ON='0'" ;
	}
	if( isset($filter_socCode) ) {
		$query.= " AND t.field_ID_SOC='{$filter_socCode}'" ;
	}
	$query.= " ORDER BY t.filerecord_id DESC" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB_trspt[$arr['filerecord_id']] = array(
			'trspt_filerecord_id' => $arr['filerecord_id'],
			'flow_code' => $arr['field_FLOW_CODE'],
			'id_soc' => $arr['field_ID_SOC'],
			'id_doc' => $arr['field_ID_DOC'],
			'date_create' => substr($arr['field_DATE_CREATE'],0,10),
			'atr_type' => $arr['field_ATR_TYPE'],
			'atr_priority' => $arr['field_ATR_PRIORITY'],
			'atr_incoterm' => $arr['field_ATR_INCOTERM'],
			'atr_consignee' => $arr['field_ATR_CONSIGNEE'],
			'mvt_carrier' => $arr['field_MVT_CARRIER'],
			'mvt_carrier_prod' => $arr['field_MVT_CARRIER_PROD'],
			'mvt_carrier_account' => $arr['field_MVT_CARRIER_ACCOUNT'],
			'mvt_origin' => $arr['field_MVT_ORIGIN'],
			'mvt_dest' => $arr['field_MVT_DEST'],
			'flight_awb' => $arr['field_FLIGHT_AWB'],
			'flight_date' => substr($arr['field_FLIGHT_DATE'],0,10),
			'flight_code' => $arr['field_FLIGHT_CODE'],
			'customs_mode' => $arr['field_CUSTOMS_MODE'],
			'customs_edi_ready' => ($arr['field_CUSTOMS_EDI_READY'] ? true:false),
			'customs_edi_sent' => ($arr['field_CUSTOMS_EDI_SENT'] ? true:false),
			'customs_date_request' => (specDbsTracy_trspt_tool_isDateValid($arr['field_CUSTOMS_DATE_REQUEST']) ? $arr['field_CUSTOMS_DATE_REQUEST'] : null),
			'customs_date_cleared' => (specDbsTracy_trspt_tool_isDateValid($arr['field_CUSTOMS_DATE_CLEARED']) ? $arr['field_CUSTOMS_DATE_CLEARED'] : null),
			'sword_edi_1_warn' => ($arr['field_SWORD_EDI_1_WARN']?true:false),
			'sword_edi_1_ready' => ($arr['field_SWORD_EDI_1_READY']?true:false),
			'sword_edi_1_sent' => ($arr['field_SWORD_EDI_1_SENT']?true:false),
			'pod_doc' => $arr['field_POD_DOC'],
			'print_is_ok' => $arr['field_PRINT_IS_OK'],
			
			'calc_step' => NULL,
			'calc_step_warning_edi' => FALSE,
			'calc_customs_is_wait' => ( $arr['field_CUSTOMS_IS_ON'] && specDbsTracy_trspt_tool_isDateValid($arr['field_CUSTOMS_DATE_REQUEST']) && !specDbsTracy_trspt_tool_isDateValid($arr['field_CUSTOMS_DATE_CLEARED']) ),
			
			'events' => array(),
			'orders' => array(),
			'hats' => array()
		);
	}
	
	$query = "SELECT * FROM view_file_TRSPT_EVENT te" ;
	$query.= " WHERE 1" ;
	if( isset($filter_trsptFilerecordId_list) ) {
		$query.= " AND te.filerecord_parent_id IN {$filter_trsptFilerecordId_list}" ;
	} elseif( !$filter_archiveIsOn ) {
		$query.= " AND te.filerecord_parent_id IN (SELECT filerecord_id FROM view_file_TRSPT WHERE field_ARCHIVE_IS_ON='0')" ;
	}
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		if( !isset($TAB_trspt[$arr['filerecord_parent_id']]) ) {
			continue ;
		}
		$TAB_trspt[$arr['filerecord_parent_id']]['events'][] = array(
			'trsptevent_filerecord_id' => $arr['filerecord_id'],
			'event_date' => $arr['field_EVENT_DATE'],
			'event_user' => $arr['field_EVENT_USER'],
			'event_txt' => $arr['field_EVENT_TXT']
		);
	}
	
	$query = "SELECT * FROM view_file_TRSPT_CDE tc" ;
	$query.= " WHERE 1" ;
	if( isset($filter_trsptFilerecordId_list) ) {
		$query.= " AND tc.filerecord_parent_id IN {$filter_trsptFilerecordId_list}" ;
	} elseif( !$filter_archiveIsOn ) {
		$query.= " AND tc.filerecord_parent_id IN (SELECT filerecord_id FROM view_file_TRSPT WHERE field_ARCHIVE_IS_ON='0')" ;
	}
	$result = $_opDB->query($query) ;
	$filter_orderFilerecordId_arr = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		if( !isset($TAB_trspt[$arr['filerecord_parent_id']]) ) {
			continue ;
		}
		$TAB_trspt[$arr['filerecord_parent_id']]['orders'][] = array(
			'trsptorder_filerecord_id' => $arr['filerecord_id'],
			'order_filerecord_id' => $arr['field_FILE_CDE_ID'],
			'link_is_cancel' => $arr['field_LINK_IS_CANCEL']
		);
		
		$filter_orderFilerecordId_arr[] = $arr['field_FILE_CDE_ID'] ;
	}
	
	$ttmp = specDbsTracy_order_getRecords( array(
		'filter_socCode' => $filter_socCode,
		'filter_orderFilerecordId_arr'=> json_encode($filter_orderFilerecordId_arr),
		'filter_archiveIsOn' => ( $filter_archiveIsOn ? 1 : 0 ),
		'skip_details' => 1
	) ) ;
	$TAB_order = array() ;
	foreach( $ttmp['data'] as $row_order ) {
		$TAB_order[$row_order['order_filerecord_id']] = $row_order ;
	}
	
	$ttmp = specDbsTracy_hat_getRecords( array(
		'filter_socCode' => $filter_socCode,
		'filter_orderFilerecordId_arr'=> json_encode($filter_orderFilerecordId_arr),
		'filter_archiveIsOn' => ( $filter_archiveIsOn ? 1 : 0 ),
		'skip_details' => 1
	) ) ;
	$TAB_hats = array() ;
	foreach( $ttmp['data'] as $row_hat ) {
		$TAB_hats[$row_hat['hat_filerecord_id']] = $row_hat ;
	}
	
	foreach( $TAB_trspt as &$row_trspt ) {
		$min_stepCode = array() ;
		$arr_hatFilerecordIds = array() ;
		foreach( $row_trspt['orders'] as &$row_trsptorder ) {
			if( !($row_order = $TAB_order[$row_trsptorder['order_filerecord_id']]) ) {
				continue ;
			}
			$row_trsptorder += $row_order ;
			if( $row_order['calc_step'] ) {
				$min_stepCode[] = $row_order['calc_step'] ;
			}
			if( $row_order['calc_hat_is_active'] && !in_array($row_order['calc_hat_filerecord_id'],$arr_hatFilerecordIds) ) {
				$arr_hatFilerecordIds[] = $row_order['calc_hat_filerecord_id'] ;
			}
		}
		unset($row_trsptorder) ;
		
		$row_trspt['hats'] = array() ;
		foreach( $arr_hatFilerecordIds as $hat_filerecord_id ) {
			$row_trspt['hats'][] = $TAB_hats[$hat_filerecord_id] ;
		}
		
		if( $min_stepCode ) {
			$row_trspt['calc_step'] = min($min_stepCode) ;
		}
		
		if( $row_trspt['sword_edi_1_warn'] ) {
			$row_trspt['calc_step_warning_edi'] = TRUE ;
		}
	}
	unset($row_trspt) ;
	
	return array('success'=>true, 'data'=>array_values($TAB_trspt)) ;
}

function specDbsTracy_trspt_setHeader( $post_data ) {
	usleep(100*1000);
	global $_opDB ;
	$file_code = 'TRSPT' ;
	
	$form_data = json_decode($post_data['data'],true) ;
	
	// ID
	if( $post_data['_is_new'] && $form_data['id_soc'] ) {
		$query = "LOCK TABLES view_bible_CFG_SOC_entry WRITE" ;
		$_opDB->query($query) ;
		$query = "UPDATE view_bible_CFG_SOC_entry SET field_ID_NEXT=field_ID_NEXT+1 WHERE entry_key='{$form_data['id_soc']}'" ;
		$_opDB->query($query) ;
		$query = "SELECT field_ID_NEXT FROM view_bible_CFG_SOC_entry WHERE entry_key='{$form_data['id_soc']}'" ;
		$id_next = $_opDB->query_uniqueValue($query) ;
		$query = "UNLOCK TABLES" ;
		$_opDB->query($query) ;
	}
	
	$arr_ins = array() ;
	if( $post_data['_is_new'] ) {
		if( !$form_data['id_soc'] || !$form_data['flow_code'] || !$form_data['atr_type'] ) {
			return array('success'=>false, 'error'=>'Missing ID_DOC / FLOW_CODE / ATR_TYPE') ;
		}
		
		
		$prefix = $form_data['id_soc'].'/'.date('ymd') ;
		$prefix_len = strlen($prefix) ;
		$offset = $prefix_len+1 ;
		$query = "SELECT max(substring(field_ID_DOC,{$offset},3)) FROM view_file_TRSPT WHERE field_ID_DOC LIKE '{$prefix}%'" ;
		$max_idx = $_opDB->query_uniqueValue($query) ;
		
		$max_idx++ ;
	
		$arr_ins['field_ID_SOC'] = $form_data['id_soc'] ;
		$arr_ins['field_ID_DOC'] = $prefix.str_pad((float)$max_idx, 3, "0", STR_PAD_LEFT) ;
		
		$arr_ins['field_FLOW_CODE'] = $form_data['flow_code'] ;
		
		$arr_ins['field_LOG_USER'] = strtoupper($_SESSION['login_data']['delegate_userId']) ;
	}
	$arr_ins['field_DATE_CREATE'] = $form_data['date_create'] ;
	$arr_ins['field_ATR_TYPE'] = $form_data['atr_type'] ;
	$arr_ins['field_ATR_PRIORITY'] = $form_data['atr_priority'] ;
	$arr_ins['field_ATR_INCOTERM'] = $form_data['atr_incoterm'] ;
	$arr_ins['field_ATR_CONSIGNEE'] = $form_data['atr_consignee'] ;
	$arr_ins['field_MVT_CARRIER'] = $form_data['mvt_carrier'] ;
	$arr_ins['field_MVT_CARRIER_PROD'] = $form_data['mvt_carrier_prod'] ;
	$arr_ins['field_MVT_CARRIER_ACCOUNT'] = $form_data['mvt_carrier_account'] ;
	$arr_ins['field_MVT_ORIGIN'] = $form_data['mvt_origin'] ;
	$arr_ins['field_MVT_DEST'] = $form_data['mvt_dest'] ;
	$arr_ins['field_FLIGHT_AWB'] = $form_data['flight_awb'] ;
	$arr_ins['field_FLIGHT_DATE'] = $form_data['flight_date'] ;
	$arr_ins['field_FLIGHT_CODE'] = $form_data['flight_code'] ;
	$arr_ins['field_CUSTOMS_IS_ON'] = ($form_data['customs_mode']=='ON') ;
	$arr_ins['field_CUSTOMS_MODE'] = $form_data['customs_mode'] ;
	if( $form_data['customs_mode']=='MAN' ) {
		$arr_ins['field_CUSTOMS_DATE_REQUEST'] = ($form_data['customs_date_request'] ? $form_data['customs_date_request'] : '') ;
		$arr_ins['field_CUSTOMS_DATE_CLEARED'] = ($form_data['customs_date_cleared'] ? $form_data['customs_date_cleared'] : '') ;
	}
	$arr_ins['field_POD_DOC'] = $form_data['pod_doc'] ;
	
	if( $post_data['_is_new'] ) {
		$filerecord_id = paracrm_lib_data_insertRecord_file( $file_code, 0, $arr_ins );
		if( json_decode($post_data['data_orderFilerecordIds'],true) ) {
			foreach( json_decode($post_data['data_orderFilerecordIds'],true) as $order_filerecord_id ) {
				specDbsTracy_trspt_orderAdd( array(
					'trspt_filerecord_id' => $filerecord_id,
					'order_filerecord_id' => $order_filerecord_id
				));
			}
		}
	} elseif( $post_data['trspt_filerecord_id'] ) {
		$filerecord_id = paracrm_lib_data_updateRecord_file( $file_code, $arr_ins, $post_data['trspt_filerecord_id'] );
	} else {
		return array('success'=>false) ;
	}
	
	specDbsTracy_trspt_ackCustomsStatus( array('trspt_filerecord_id'=>$filerecord_id) ) ;
	
	if( $post_data['validateStepCode'] ) {
		$params = array(
			'trspt_filerecord_id' => $filerecord_id,
			'step_code' => $post_data['validateStepCode']
		) ;
		if( $post_data['validateDoForce'] ) {
			$params += array(
				'step_doForce' => true
			);
		}
		if( $post_data['validateData'] ) {
			$validateData = json_decode($post_data['validateData'],true) ;
			if( $validateData['step_code'] == $post_data['validateStepCode'] ) {
				$params += array(
					'date_actual' => $validateData['date_actual']
				);
			}
		}
		$ttmp = specDbsTracy_trspt_stepValidate( $params );
		if( !$ttmp['success'] && !$post_data['_is_new'] ) {
			return $ttmp ;
		}
	}
	
	
	return array('success'=>true, 'id'=>$filerecord_id) ;
}

function specDbsTracy_trspt_doEdiReset( $post_data ) {
	usleep(50*1000);
	global $_opDB ;
	$file_code = 'TRSPT' ;
	
	switch( $post_data['sword_edi_id'] ) {
		case 1 :
			$field_code = 'field_SWORD_EDI_1_SENT' ;
			break ;
		case 3 :
			$field_code = 'field_SWORD_EDI_3_SENT' ;
			break ;
		
		default :
			return array('success'=>false) ;
			break ;
	}
	
	$p_trsptFilerecordId = $post_data['trspt_filerecord_id'] ;
	$query = "UPDATE view_file_TRSPT SET {$field_code}='0' WHERE filerecord_id='{$p_trsptFilerecordId}'" ;
	$_opDB->query($query) ;
	
	return array('success'=>true) ;
}


function specDbsTracy_trspt_orderAdd( $post_data ) {
	usleep(50*1000);
	global $_opDB ;
	$file_code = 'TRSPT_CDE' ;
	
	$p_trsptFilerecordId = $post_data['trspt_filerecord_id'] ;
	$p_orderFilerecordId = $post_data['order_filerecord_id'] ;
	
	$ttmp = specDbsTracy_order_getRecords(array('filter_orderFilerecordId_arr'=>json_encode(array($p_orderFilerecordId)))) ;
	if( $ttmp['data'][0]['calc_link_is_active'] ) {
		return array('success'=>false,'error'=>"Order {$ttmp['data'][0]['id_dn']} already attached") ;
	}
	foreach( $ttmp['data'][0]['steps'] as $row_order_step ) {
		if( $row_order_step['step_code'] == '30_DOCS' && !$row_order_step['status_is_ok'] ) {
			//return array('success'=>false, 'error'=>"Order {$ttmp['data'][0]['id_dn']} not ready") ;
		}
	}
	
	$arr_ins = array() ;
	$arr_ins['field_FILE_CDE_ID'] = $p_orderFilerecordId ;
	$filerecord_id = paracrm_lib_data_insertRecord_file( $file_code, $p_trsptFilerecordId, $arr_ins );
	
	foreach( $ttmp['data'][0]['steps'] as $row_order_step ) {
		if( $row_order_step['step_code'] == '50_ASSOC' ) {
			$arr_ins = array() ;
			$arr_ins['field_STATUS_IS_OK'] = 1 ;
			$arr_ins['field_DATE_ACTUAL'] = date('Y-m-d H:i:s') ;
			$arr_ins['field_LOG_USER'] = strtoupper($_SESSION['login_data']['delegate_userId']) ;
			paracrm_lib_data_updateRecord_file( 'CDE_STEP', $arr_ins, $row_order_step['orderstep_filerecord_id'] );
		}
	}
	
	return array('success'=>true) ;
}
function specDbsTracy_trspt_orderRemove( $post_data ) {
	usleep(50*1000);
	global $_opDB ;
	$file_code = 'TRSPT_CDE' ;
	
	$p_trsptFilerecordId = $post_data['trspt_filerecord_id'] ;
	$p_orderFilerecordId = $post_data['order_filerecord_id'] ;
	
	$ttmp = specDbsTracy_order_getRecords(array('filter_orderFilerecordId_arr'=>json_encode(array($p_orderFilerecordId)))) ;
	
	$query = "SELECT * FROM view_file_TRSPT_CDE WHERE filerecord_parent_id='{$p_trsptFilerecordId}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		if( $arr['field_FILE_CDE_ID'] == $p_orderFilerecordId ) {
			paracrm_lib_data_deleteRecord_file($file_code,$arr['filerecord_id']) ;
		}
	}
	
	foreach( $ttmp['data'][0]['steps'] as $row_order_step ) {
		if( $row_order_step['step_code'] == '50_ASSOC' ) {
			$arr_ins = array() ;
			$arr_ins['field_STATUS_IS_OK'] = 0 ;
			$arr_ins['field_DATE_ACTUAL'] = '0000-00-00 00:00:00' ;
			paracrm_lib_data_updateRecord_file( 'CDE_STEP', $arr_ins, $row_order_step['orderstep_filerecord_id'] );
		}
	}
	
	return array('success'=>true) ;
}




function specDbsTracy_trspt_eventAdd( $post_data ) {
	usleep(50*1000);
	global $_opDB ;
	$file_code = 'TRSPT_EVENT' ;
	
	$p_trsptFilerecordId = $post_data['trspt_filerecord_id'] ;
	$form_data = json_decode($post_data['data'],true) ;
	
	$arr_ins = array();
	$arr_ins['field_EVENT_DATE'] = date('Y-m-d H:i:s');
	$arr_ins['field_EVENT_USER'] = $form_data['event_user'];
	$arr_ins['field_EVENT_TXT'] = $form_data['event_txt'];
	paracrm_lib_data_insertRecord_file( $file_code, $p_trsptFilerecordId, $arr_ins );

	return array('success'=>true, 'debug'=>$post_data) ;
}




function specDbsTracy_trspt_ackCustomsStatus( $post_data ) {
	global $_opDB ;
	$file_code = 'TRSPT' ;
	
	$p_trsptFilerecordId = $post_data['trspt_filerecord_id'] ;
	$ttmp = specDbsTracy_trspt_getRecords(array('filter_trsptFilerecordId_arr'=>json_encode(array($p_trsptFilerecordId)))) ;
	$trspt_record = $ttmp['data'][0] ;
	if( !$trspt_record ) {
		return array('success'=>false) ;
	}
	
	$target_void = false ;
	$target_51CREQ = NULL ;
	$target_52CACK = NULL ;
	if( $trspt_record['customs_mode']=='OFF' ) {
		$target_void = TRUE ;
	}
	if( in_array($trspt_record['customs_mode'],array('MAN','AUTO')) ) {
		if( $trspt_record['customs_date_request'] ) {
			$target_51CREQ = $trspt_record['customs_date_request'] ;
		}
		if( $trspt_record['customs_date_cleared'] ) {
			$target_52CACK = $trspt_record['customs_date_cleared'] ;
		}
	}
	
	//print_r( $trspt_record ) ;
	foreach( $trspt_record['orders'] as $order_row ) {
		foreach( $order_row['steps'] as $orderStep_row ) {
			if( $orderStep_row['step_code']=='51_CREQ' ) {
				$arr_ins = array() ;
				if( $target_void ) {
					$arr_ins['field_STATUS_IS_OK'] = 1 ;
					$arr_ins['field_STATUS_IS_VOID'] = 1 ;
					$arr_ins['field_DATE_ACTUAL'] = date('Y-m-d H:i:s') ;
				} elseif( $target_51CREQ ) {
					$arr_ins['field_STATUS_IS_OK'] = 1 ;
					$arr_ins['field_STATUS_IS_VOID'] = 0 ;
					$arr_ins['field_DATE_ACTUAL'] = $target_51CREQ ;
				} else {
					$arr_ins['field_STATUS_IS_OK'] = 0 ;
					$arr_ins['field_STATUS_IS_VOID'] = 0 ;
					$arr_ins['field_DATE_ACTUAL'] = '0000-00-00 00:00:00' ;
				}
				paracrm_lib_data_updateRecord_file( 'CDE_STEP', $arr_ins, $orderStep_row['orderstep_filerecord_id'] );
			}
			if( $orderStep_row['step_code']=='52_CACK' ) {
				$arr_ins = array() ;
				if( $target_void ) {
					$arr_ins['field_STATUS_IS_OK'] = 1 ;
					$arr_ins['field_STATUS_IS_VOID'] = 1 ;
					$arr_ins['field_DATE_ACTUAL'] = date('Y-m-d H:i:s') ;
				} elseif( $target_52CACK ) {
					$arr_ins['field_STATUS_IS_OK'] = 1 ;
					$arr_ins['field_STATUS_IS_VOID'] = 0 ;
					$arr_ins['field_DATE_ACTUAL'] = $target_52CACK ;
				} else {
					$arr_ins['field_STATUS_IS_OK'] = 0 ;
					$arr_ins['field_STATUS_IS_VOID'] = 0 ;
					$arr_ins['field_DATE_ACTUAL'] = '0000-00-00 00:00:00' ;
				}
				paracrm_lib_data_updateRecord_file( 'CDE_STEP', $arr_ins, $orderStep_row['orderstep_filerecord_id'] );
			}
		}
	}
	
	
	

}




function specDbsTracy_trspt_stepValidate( $post_data ) {
	global $_opDB ;
	
	$p_trsptFilerecordId = $post_data['trspt_filerecord_id'] ;
	$p_stepCode = $post_data['step_code'] ;
	$p_stepDoForce = !(!$post_data['step_doForce']) ;
	if( isset($post_data['date_actual']) ) {
		$p_dateActual = $post_data['date_actual'] ;
	}
	
	// load trspt
	$ttmp = specDbsTracy_trspt_getRecords(array('filter_trsptFilerecordId_arr'=>json_encode(array($p_trsptFilerecordId)))) ;
	$trspt_record = $ttmp['data'][0] ;
	if( !$trspt_record ) {
		return array('success'=>false) ;
	}
	
	// liste chaine des étapes
	$arr_steps = array() ;
	$ttmp = specDbsTracy_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	foreach( $json_cfg['cfg_orderflow'] as $orderflow ) {
		if( $orderflow['flow_code'] != $trspt_record['flow_code'] ) {
			continue ;
		}
		foreach( $orderflow['steps'] as $step ) {
			$arr_steps[] = $step['step_code'] ;
		}
	}
	sort($arr_steps) ;
	
	if( !$p_stepDoForce ) {
		$steps = array() ;
		foreach( $trspt_record['orders'] as $row_order ) {
			unset($row_order['calc_step']) ;
			$max_stepCode = array() ;
			foreach( $row_order['steps'] as $row_order_step ) {
				if( $row_order_step['status_is_ok'] ) {
					$max_stepCode[] = $row_order_step['step_code'] ;
				}
			}
			if( $max_stepCode ) {
				$row_order['calc_step'] = max($max_stepCode) ;
			}
		
			if( $row_order['calc_step'] && !in_array($row_order['calc_step'],$steps) ) {
				$steps[] = $row_order['calc_step'] ;
			}
		}
		if( count($steps) != 1 ) {
			return array('success'=>false, 'error'=>'Inconsistant steps in current orders', 'error_validate'=>true) ;
		}
		
		$current_stepCode = reset($steps) ;
		$current_stepCode_idx = array_search($current_stepCode,$arr_steps) ;
		if( $current_stepCode_idx===false || $arr_steps[$current_stepCode_idx+1] != $p_stepCode ) {
			return array('success'=>false, 'error'=>'Inconsistant target step : '.$p_stepCode, 'error_validate'=>true) ;
		}
	}
	
	foreach( $trspt_record['orders'] as $row_order ) {
		$params = array(
			'order_filerecord_id' => $row_order['order_filerecord_id'],
			'step_code' => $p_stepCode
		);
		if( $p_dateActual ) {
			$params += array('date_actual'=>$p_dateActual) ;
		}
		specDbsTracy_order_stepValidate( $params );
	}
	
	return array('success'=>true) ;
}

function specDbsTracy_trspt_delete( $post_data ) {
	global $_opDB ;
	
	$p_trsptFilerecordId = $post_data['trspt_filerecord_id'] ;
	
	$ttmp = specDbsTracy_trspt_getRecords( array(
		'filter_trsptFilerecordId_arr' => json_encode( array($p_trsptFilerecordId) )
	) );
	if( count($ttmp['data']) != 1 ) {
		return array('success'=>false) ;
	}
	$trspt_record = $ttmp['data'][0] ;
	if( count($trspt_record['orders'])!=0 ) {
		return array('success'=>false) ;
	}
	
	paracrm_lib_data_deleteRecord_file('TRSPT',$p_trsptFilerecordId) ;
	
	return array('success'=>true) ;
}



function specDbsTracy_trspt_printDoc( $post_data ) {
	global $_opDB ;
	
	$p_trsptFilerecordId = $post_data['trspt_filerecord_id'] ;
	
	$app_root = $GLOBALS['app_root'] ;
	$resources_root=$app_root.'/resources' ;
	$templates_dir=$resources_root.'/server/templates' ;
	$_IMG['DBS_logo_bw'] = file_get_contents($templates_dir.'/'.'DBS_logo_bw.png') ;
	
	$ttmp = specDbsTracy_trspt_getRecords( array(
		'filter_trsptFilerecordId_arr' => json_encode( array($p_trsptFilerecordId) )
	) );
	if( count($ttmp['data']) != 1 ) {
		return array('success'=>false) ;
	}
	
	$trspt_record = $ttmp['data'][0] ;
	
	// 12/11/18 : interro Carrier
	$carrier_entryKey = $trspt_record['mvt_carrier'] ;
	$query = "SELECT field_TYPE FROM view_bible_LIST_CARRIER_entry WHERE entry_key='{$carrier_entryKey}'" ;
	$carrier_type = $_opDB->query_uniqueValue($query) ;
	if( !$post_data['print_type'] ) {
		switch( strtoupper($carrier_type) ) {
			case 'INTEGRATEUR' :
				$post_data['print_type'] = 'integrateur' ;
				break ;
			case 'NAVETTE' :
				$post_data['print_type'] = 'delivery' ;
				break ;
			case 'TRANSITAIRE' :
				$post_data['print_type'] = 'pickup' ;
				break ;
		}
	}
	
	$arr_update = array() ;
	$arr_update['field_PRINT_IS_OK'] = 1 ;
	paracrm_lib_data_updateRecord_file( 'TRSPT', $arr_update, $p_trsptFilerecordId );
	
	//print_r($trspt_record) ;
	switch( $post_data['print_type'] ) {
		case 'integrateur' :
			$title = 'INTEGRATEUR' ;
			$header_adr = 'Integrateur' ;
			break ;
			
		case 'pickup' :
			$title = 'MISE A DISPOSITION' ;
			$header_adr = 'Enlevé par' ;
			break ;
			
		case 'delivery' :
			$title = 'LIVRAISON NAVETTE' ;
			$header_adr = 'Livré à' ;
			break ;
			
		return array('success'=>false) ;
	}
		
		$buffer.= '<DIV></DIV>' ;
		$buffer.= "<table border='0' cellspacing='1' cellpadding='1'>" ;
		$buffer.= "<tr><td width='5'/><td width='200'>" ;
			$buffer.= '<div align="center">' ;
			$buffer.= '<img src="data:image/jpeg;base64,'.base64_encode(specDbsTracy_lib_getBarcodePng($trspt_record['id_doc'],75)).'" /><br>' ;
			$buffer.= $trspt_record['id_doc'].'<br>' ;
			$buffer.= '</div>' ;
		$buffer.= "</td><td align='center' valign='middle' width='400'>" ;
			$buffer.= "<table cellspacing='0' cellpadding='1'>";
			$buffer.= "<tr><td><span class=\"huge\"><b>{$title}</span></td></tr>" ;
			$buffer.= "<tr><td align='center'><span class=\"huge\"><b>SAFRAN</span></td></tr>" ;
			//{$data_commande['date_exp']}
			$buffer.= "</table>";
		$buffer.= "</td><td valign='middle' align='center' width='120'>" ;
			$buffer.= "<img src=\"data:image/jpeg;base64,".base64_encode($_IMG['DBS_logo_bw'])."\" />" ;
		$buffer.= "</td></tr><tr><td height='25'/></tr></table>" ;
		
		
		$query = "SELECT * FROM view_bible_LIST_CARRIER_entry WHERE entry_key='{$trspt_record['mvt_carrier']}'" ;
		$result = $_opDB->query($query) ;
		$row_bible_CARRIER = $_opDB->fetch_assoc($result) ;
		//print_r($row_bible_CARRIER) ;
		
		$buffer.= "<table border='0' cellspacing='5' cellpadding='5' width='800'>" ;
		$buffer.= "<tr>" ;
		$buffer.= "<td width='33%' style='border: 1px solid gray'>" ;
			$buffer.= "<table border='0' cellspacing='4' cellpadding='4'>" ;
				$buffer.= "<tr><td><span class='mybig'>Incoterm</span></td><td><span class='mybig'><b>{$trspt_record['atr_incoterm']}</td></tr>" ;
				$buffer.= "<tr><td><span class='mybig'>Document</span></td><td><span class='mybig'><b>{$trspt_record['id_doc']}</td></tr>" ;
				$buffer.= "<tr><td><span class='mybig'>Date</span></td><td><span class='mybig'><b>".date('d/m/Y')."</td></tr>" ;
			$buffer.= "</table>" ;
		$buffer.= "</td>" ;
		$buffer.= "<td>&nbsp;</td>" ;
		$buffer.= "<td width='33%'  valign='top' style='border: 1px solid gray'>" ;
			$buffer.= "<div style='padding-bottom:6px'><i>Enlevement</i></div>" ;
			$buffer.= '<span class="mybig">' ;
			$buffer.= '<b>'.'DB SCHENKER C/O SAFRAN'.'</b><br>' ;
			$buffer.= ''.'Rue René Cassin'.'<br>' ;
			$buffer.= ''.'ZAC de la Vilette aux Aulnes'.'<br>' ;
			$buffer.= ''.'77290 Mitry Mory'.'<br>' ;
			$buffer.= "</span>" ;
		$buffer.= "</td>" ;
		$buffer.= "<td>&nbsp;</td>" ;
		$buffer.= "<td width='33%' valign='top' style='border: 1px solid gray'>" ;
			$buffer.= "<div style='padding-bottom:6px'><i>{$header_adr}</i></div>" ;
			$buffer.= '<span class="mybig">' ;
			$buffer.= '<b>'.$trspt_record['mvt_carrier'].'</b><br>' ;
			$buffer.= ''.nl2br(htmlentities($row_bible_CARRIER['field_ADDRESS'])).'<br>' ;
			$buffer.= "</span>" ;
		$buffer.= "</td>" ;
		$buffer.= "</tr></table>" ;
		
		$buffer.= "<br>" ;
				
		$buffer.= "<table width='90%' class='tabledonnees' height='600'>" ;
			$buffer.= '<thead>' ;
				$buffer.= "<tr>";
					$buffer.= "<th width='20%'>Ship Group #</th>";
					$buffer.= "<th width='20%'>Delivery ID(s) #</th>";
					$buffer.= "<th width='60%'>Destination</th>";
					$buffer.= "<th width='10%'>Nb Parcels</th>";
					$buffer.= "<th width='10%'>Weight (kg)</th>";
					$buffer.= "<th width='10%'>Dimensions</th>";
				$buffer.= "</tr>" ;
			$buffer.= '</thead>' ;
			$map_orderId_orderRow = array() ;
			foreach( $trspt_record['orders'] as $row_order ) {
				$map_orderId_orderRow[$row_order['order_filerecord_id']] = $row_order ;
			}
			foreach( $trspt_record['hats'] as $row_hat ) {
				$buffer.= "<tr>" ;
					$buffer.= "<td><span class=\"verybig\">{$row_hat['id_hat']}</span></td>" ;
					
					$buffer.= "<td align='center'><span class=\"verybig\">" ;
					foreach( $row_hat['orders'] as $row_hat_order ) {
						$order_filerecord_id = $row_hat_order['order_filerecord_id'] ;
						$row_order = $map_orderId_orderRow[$order_filerecord_id] ;
						$buffer.= $row_order['id_dn'].'<br>' ;
					}
					$buffer.= "</span></td>" ;
					
					$buffer.= "<td class=\"$class\" align='left'><span>".nl2br(htmlentities($row_order['txt_location_full']))."</span></td>" ;
					
					$vol_count = 0 ;
					foreach( $row_hat['parcels'] as $row_hat_parcel ) {
						$vol_count += $row_hat_parcel['vol_count'] ;
					}
					$buffer.= "<td align='center'><span class=\"mybig\"><b>".(float)$vol_count."</b>"."</span></td>" ;
					
					$vol_kg = 0 ;
					foreach( $row_hat['parcels'] as $row_hat_parcel ) {
						$vol_kg += $row_hat_parcel['vol_kg'] ;
					}
					$buffer.= "<td align='center'><span class=\"mybig\"><b>".(float)$vol_kg."</b>&#160;kg"."</span></td>" ;
					
					$buffer.= "<td align='center'><span class=\"\">" ;
					foreach( $row_hat['parcels'] as $row_hat_parcel ) {
						$buffer.= implode(' x ',$row_hat_parcel['vol_dims']).'<br>' ;
					}
					$buffer.= "</span></td>" ;
					
				$buffer.= "</tr>" ;
			}
			foreach( $trspt_record['orders'] as $row_order ) {
				if( $row_order['calc_hat_is_active'] ) {
					continue ;
				}
				$buffer.= "<tr>" ;
					$buffer.= "<td><span class=\"verybig\">&nbsp;</span></td>" ;
					
					$buffer.= "<td><span class=\"verybig\">{$row_order['id_dn']}</span></td>" ;
					
					$buffer.= "<td class=\"$class\" align='left'><span>".nl2br(htmlentities($row_order['txt_location_full']))."</span></td>" ;
					
					$buffer.= "<td colspan='3'>&nbsp;</td>" ;
				$buffer.= "</tr>" ;
			}
		$buffer.= "</table>" ;
		
		$buffer.= "<br>" ;
		
		switch( $post_data['print_type'] ) {
			case 'delivery' :
			$buffer.= "<table border='0' cellspacing='5' cellpadding='5' width='800'>" ;
			$buffer.= "<tr>" ;
			$buffer.= "<td width='50%'  valign='top' style='border: 1px solid gray'>" ;
				$buffer.= '<span class="mybig">' ;
				$buffer.= '<b>'.'ENLEVEMENT NAVETTE :'.'</b><br>' ;
				$buffer.= ''.'DATE :'.'<br>' ;
				$buffer.= ''.'HEURE :'.'<br>' ;
				$buffer.= "</span>" ;
			$buffer.= "</td>" ;
			$buffer.= "<td>&nbsp;</td>" ;
			$buffer.= "<td width='50%'  valign='top' style='border: 1px solid gray'>" ;
				$buffer.= '<span class="mybig">' ;
				$buffer.= '<b>'.'LIVRAISON :'.'</b><br>' ;
				$buffer.= ''.'DATE :'.'<br>' ;
				$buffer.= ''.'HEURE :'.'<br>' ;
				$buffer.= "</span>" ;
			$buffer.= "</td>" ;
			$buffer.= "</tr></table>" ;
			break ;
			
			case 'pickup' :
			$buffer.= "<table border='0' cellspacing='5' cellpadding='5' width='800'>" ;
			$buffer.= "<tr>" ;
			$buffer.= "<td width='50%'  valign='top' style='border: 1px solid gray'>" ;
				$buffer.= '<span class="mybig">' ;
				$buffer.= '<b>'.'ENLEVEMENT TRANSPORTEUR :'.'</b><br>' ;
				$buffer.= ''.'DATE :'.'<br>' ;
				$buffer.= ''.'HEURE :'.'<br>' ;
				$buffer.= ''.'NOM :'.'<br>' ;
				$buffer.= "</span>" ;
			$buffer.= "</td>" ;
			$buffer.= "<td>&nbsp;</td>" ;
			$buffer.= "<td width='50%'  valign='top' style='border: 1px solid gray'>" ;
				$buffer.= "&nbsp;" ;
			$buffer.= "</td>" ;
			$buffer.= "</tr></table>" ;
			break ;
			
			case 'integrateur' :
			$buffer.= "<table border='0' cellspacing='5' cellpadding='5' width='800'>" ;
			$buffer.= "<tr>" ;
			$buffer.= "<td width='50%'  valign='top' style='border: 1px solid gray'>" ;
				$buffer.= '<span class="mybig">' ;
				$buffer.= '<b>'.'INTEGRATEUR :'.'</b><br>' ;
				$buffer.= ''.'DATE :'.'<br>' ;
				$buffer.= ''.'HEURE :'.'<br>' ;
				$buffer.= ''.'NOM :'.'<br>' ;
				$buffer.= "</span>" ;
			$buffer.= "</td>" ;
			$buffer.= "<td>&nbsp;</td>" ;
			$buffer.= "<td width='50%'  valign='top' style='border: 1px solid gray'>" ;
				$buffer.= "&nbsp;" ;
			$buffer.= "</td>" ;
			$buffer.= "</tr></table>" ;
			break ;
		}
		
		$buffer.= "<br>" ;
		
		$buffer.= "<table border='0' cellspacing='5' cellpadding='5' width='800'>" ;
		$buffer.= "<tr>" ;
		$buffer.= "<td width='50%'  valign='top'>" ;
			$buffer.= "&nbsp;" ;
		$buffer.= "</td>" ;
		$buffer.= "<td>&nbsp;</td>" ;
		$buffer.= "<td width='50%' height='75' valign='top' style='border: 1px solid gray'>" ;
			$buffer.= '<span class="mybig">' ;
			$buffer.= '<b>'.'RECU PAR<br>(CACHET/NOM) :'.'</b><br>' ;
			$buffer.= "</span>" ;
		$buffer.= "</td>" ;
		$buffer.= "</tr></table>" ;
	
	
	$app_root = $GLOBALS['app_root'] ;
	$resources_root=$app_root.'/resources' ;
	$templates_dir=$resources_root.'/server/templates' ;
	$inputFileName = $templates_dir.'/'.'DBS_TRACY_blank.html' ;
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

function specDbsTracy_trspt_download( $post_data ) {
	$dataIds = json_decode($post_data['dataIds'],true) ;
	$columns = array(
		'id_soc' => 'Shipper',
		'atr_type' => 'Type',
		'id_doc' => 'Document',
		'date_create' => 'Creation date',
		'atr_type' => 'Type',
		'atr_priority' => 'Priority',
		'atr_consignee' => 'Consignee',
		'atr_incoterm' => 'Incoterm',
		'orders_id' => 'Orders',
		'orders_po' => 'PO',
		'orders_invoice' => 'Invoice',
		'mvt_carrier' => 'Carrier',
		'flight_awb' => 'AWB',
		'date_awb' => 'Date AWB',
		'date_pup' => 'Date PUP',
		'date_pod' => 'Date POD'
	);
	
		$server_root = $GLOBALS['server_root'] ;
		include("$server_root/include/xlsxwriter.class.php");
		
	$json = specDbsTracy_trspt_getRecords(array('filter_archiveIsOn'=>0)) ;
	$map_id_rowTrspt = array() ;
	foreach( $json['data'] as $rowTrspt ) {
		$id = $rowTrspt['trspt_filerecord_id'] ;
		if( isset($post_data['filter_socCode']) && ($rowTrspt['id_soc'] != $post_data['filter_socCode']) ) {
			continue ;
		}
		$map_id_rowTrspt[$id] = $rowTrspt ;
	}
		
	$header = array() ;
	foreach( $columns as $mkey => $col_title ) {
		$header[$col_title] = 'string' ;
	}
	$writer = new XLSXWriter();
	$writer->writeSheetHeader('Sheet1', $header );//optional
	foreach( ( is_array($dataIds) ? $dataIds : array_keys($map_id_rowTrspt) ) as $trspt_filerecord_id ) {
	
		if( !($data_row = $map_id_rowTrspt[$trspt_filerecord_id]) ) {
			continue ;
		}
	
		$map_stepCode_date = array() ;
		if( !is_array($data_row['orders']) ) {
			continue ;
		}
		foreach( $data_row['orders'] as $row_order ) {
			if( !is_array($row_order['steps']) ) {
				continue ;
			}
			foreach( $row_order['steps'] as $row_step ) {
				if( $row_step['status_is_ok'] ) {
					$map_stepCode_date[$row_step['step_code']][] = date('d/m/Y H:i',strtotime($row_step['date_actual'])) ;
				}
			}
		}
		foreach( $map_stepCode_date as $step_code => &$date ) {
			$date = min($date) ;
		}
		unset($date) ;
		
	
	
	
		$row = array() ;
		foreach( $columns as $mkey => $dummy ) {
			switch( $mkey ) {
				case 'date_pup' :
					$value = $map_stepCode_date['70_PICKUP'] ;
					break ;
					
				case 'date_pod' :
					$value = $map_stepCode_date['90_POD'] ;
					break ;
					
				case 'date_awb' :
					$value = $map_stepCode_date['99_LTA'] ;
					break ;
					
				case 'orders_id' :
					$ttmp = array() ;
					foreach( $data_row['orders'] as $row_order ) {
						$ttmp[] = $row_order['id_dn'] ;
					}
					$value = implode("\n",$ttmp) ;
					break ;
					
				case 'orders_po' :
					$ttmp = array() ;
					foreach( $data_row['orders'] as $row_order ) {
						$ttmp[] = $row_order['ref_po'] ;
					}
					$value = implode("\n",$ttmp) ;
					break ;
					
				case 'orders_invoice' :
					$ttmp = array() ;
					foreach( $data_row['orders'] as $row_order ) {
						$ttmp[] = $row_order['ref_invoice'] ;
					}
					$value = implode("\n",$ttmp) ;
					break ;
					
				default :
					$value = $data_row[$mkey] ;
					break ;
			}
			$row[] = $value ;
		}
		$writer->writeSheetRow('Sheet1', $row );
	}
	
	$tmpfilename = tempnam( sys_get_temp_dir(), "FOO");
	$writer->writeToFile($tmpfilename);
	
	
	$filename = 'DbsTracy_Trspt'.'_'.time().'.xlsx' ;
	header("Content-Type: application/force-download; name=\"$filename\""); 
	header("Content-Disposition: attachment; filename=\"$filename\""); 
	readfile($tmpfilename) ;
	unlink($tmpfilename) ;
	die() ;
}
?>
