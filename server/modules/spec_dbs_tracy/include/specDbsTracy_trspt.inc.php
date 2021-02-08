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
	
	// CFG: liste chaine des étapes
	$map_flowCode_steps = array() ;
	$ttmp = specDbsTracy_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	foreach( $json_cfg['cfg_orderflow'] as $orderflow ) {
		$flow_code = $orderflow['flow_code'] ;
		$arr_steps = array() ;
		foreach( $orderflow['steps'] as $step ) {
			$arr_steps[] = $step['step_code'] ;
		}
		sort($arr_steps) ;
		$map_flowCode_steps[$flow_code] = $arr_steps ;
	}
	
	// filter ?
	if( isset($post_data['filter_trsptFilerecordId_arr']) ) {
		$filter_trsptFilerecordId_list = $_opDB->makeSQLlist( json_decode($post_data['filter_trsptFilerecordId_arr'],true) ) ;
		$load_details = TRUE ;
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
		$arr['field_CUSTOMS_MODE_arr'] = explode('_',$arr['field_CUSTOMS_MODE']) ;
		
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
			'customs_mode' => $arr['field_CUSTOMS_MODE_arr'][0],
			'customs_mode_auto' => $arr['field_CUSTOMS_MODE_arr'][1],
			'customs_edi_ready' => ($arr['field_CUSTOMS_EDI_READY'] ? true:false),
			'customs_edi_sent' => ($arr['field_CUSTOMS_EDI_SENT'] ? true:false),
			'customs_date_request' => (specDbsTracy_trspt_tool_isDateValid($arr['field_CUSTOMS_DATE_REQUEST']) ? $arr['field_CUSTOMS_DATE_REQUEST'] : null),
			'customs_date_cleared' => (specDbsTracy_trspt_tool_isDateValid($arr['field_CUSTOMS_DATE_CLEARED']) ? $arr['field_CUSTOMS_DATE_CLEARED'] : null),
			'sword_edi_1_warn' => ($arr['field_SWORD_EDI_1_WARN']?true:false),
			'sword_edi_1_ready' => ($arr['field_SWORD_EDI_1_READY']?true:false),
			'sword_edi_1_sent' => ($arr['field_SWORD_EDI_1_SENT']?true:false),
			'pod_doc' => $arr['field_POD_DOC'],
			'print_is_ok' => $arr['field_PRINT_IS_OK'],
			'spec_tms_status' => $arr['field_SPEC_TMS_STATUS'],
			
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
		
		$row_event = array(
			'trsptevent_filerecord_id' => $arr['filerecord_id'],
			'event_date' => $arr['field_EVENT_DATE'],
			'event_user' => $arr['field_EVENT_USER'],
			'event_txt' => $arr['field_EVENT_TXT']
		);
		switch( $arr['field_EVENTLINK_FILE'] ) {
			case 'TRSPTPICK' :
				$map_printIds = json_decode($arr['field_EVENTLINK_IDS_JSON'],true) ;
				if( is_array($map_printIds) ) {
					$row_event['trsptpick_is_on'] = true ;
					$row_event['trsptpick_filerecord_id'] = reset($map_printIds) ;
				}
				break ;
			case 'TMS_STORE' :
				$row_event['spec_tms_on'] = true ;
				if( $load_details ) {
					$map_storeIds = json_decode($arr['field_EVENTLINK_IDS_JSON'],true) ;
					if( is_array($map_storeIds) && in_array('RESPONSE_OK',array_keys($map_storeIds)) ) {
						$row_event['spec_tms_status'] = 'cancel' ;
						$query = "SELECT max(filerecord_id) FROM view_file_TRSPT_EVENT 
							WHERE filerecord_parent_id='{$arr['filerecord_parent_id']}' AND field_EVENTLINK_FILE='TMS_STORE'" ;
						if( $_opDB->query_uniqueValue($query)==$row_event['trsptevent_filerecord_id'] ) {
							$row_event['spec_tms_status'] = 'ok' ;
						}
					} else {
						$row_event['spec_tms_status'] = 'error' ;
					}
				}
				break ;
		}
		$TAB_trspt[$arr['filerecord_parent_id']]['events'][] = $row_event ;
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
	
	$query = "SELECT p.filerecord_id as trsptpick_filerecord_id
					, p.field_ID_PICK as trsptpick_id
					, pt.field_FILE_TRSPT_ID as trspt_filerecord_id
				FROM view_file_TRSPTPICK p
				JOIN view_file_TRSPTPICK_TRSPT pt ON pt.filerecord_parent_id=p.filerecord_id AND pt.field_LINK_IS_CANCEL='0'
				WHERE 1" ;
	if( isset($filter_trsptFilerecordId_list) ) {
		$query.= " AND pt.field_FILE_TRSPT_ID IN {$filter_trsptFilerecordId_list}" ;
	} elseif( !$filter_archiveIsOn ) {
		$query.= " AND pt.field_FILE_TRSPT_ID IN (SELECT filerecord_id FROM view_file_TRSPT WHERE field_ARCHIVE_IS_ON='0')" ;
	}
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		if( !isset($TAB_trspt[$arr['trspt_filerecord_id']]) ) {
			continue ;
		}
		$TAB_trspt[$arr['trspt_filerecord_id']] += array(
			'trsptpick_filerecord_id' => $arr['trsptpick_filerecord_id'],
			'trsptpick_id' => $arr['trsptpick_id']
		);
	}
	
	$ttmp = specDbsTracy_order_getRecords( array(
		'filter_socCode' => $filter_socCode,
		'filter_orderFilerecordId_arr'=> json_encode($filter_orderFilerecordId_arr),
		'filter_archiveIsOn' => ( $filter_archiveIsOn ? 1 : 0 ),
		'skip_details' => ($load_details ? 0 : 1)
	) ) ;
	$TAB_order = array() ;
	foreach( $ttmp['data'] as $row_order ) {
		$TAB_order[$row_order['order_filerecord_id']] = $row_order ;
	}
	
	$ttmp = specDbsTracy_hat_getRecords( array(
		'filter_socCode' => $filter_socCode,
		'filter_orderFilerecordId_arr'=> json_encode($filter_orderFilerecordId_arr),
		'filter_archiveIsOn' => ( $filter_archiveIsOn ? 1 : 0 ),
		'skip_details' => ($load_details ? 0 : 1)
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
		
		
		$steps = array() ;
		foreach( $row_trspt['orders'] as $row_order ) {
			if( !$row_order['steps'] ) {
				continue ;
			}
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
		if( count($steps) == 1 ) {
			$arr_flowSteps = $map_flowCode_steps[$row_trspt['flow_code']] ;
			$current_stepCode = reset($steps) ;
			$current_stepCode_idx = array_search($current_stepCode,$arr_flowSteps) ;
			$next_stepCode_idx = $current_stepCode_idx+1 ;
			if( $arr_flowSteps[$next_stepCode_idx] ) {
				$row_trspt['calc_step_next'] = $arr_flowSteps[$next_stepCode_idx] ;
			}
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
	$field_CUSTOMS_MODE = trim($form_data['customs_mode']) ;
	if( ($form_data['customs_mode']=='AUTO') && trim($form_data['customs_mode_auto']) ) {
		$field_CUSTOMS_MODE.= '_'.trim($form_data['customs_mode_auto']) ;
	}
	$arr_ins['field_CUSTOMS_MODE'] = $field_CUSTOMS_MODE ;
	if( $form_data['customs_mode']=='MAN' ) {
		$arr_ins['field_CUSTOMS_DATE_REQUEST'] = ($form_data['customs_date_request'] ? $form_data['customs_date_request'] : '') ;
		$arr_ins['field_CUSTOMS_DATE_CLEARED'] = ($form_data['customs_date_cleared'] ? $form_data['customs_date_cleared'] : '') ;
	}
	if( $form_data['customs_mode']=='AUTO' ) {
		if( $form_data['customs_date_request_do'] ) {
			$arr_ins['field_CUSTOMS_DATE_REQUEST'] = date('Y-m-d H:i:s') ;
		}
		if( $form_data['customs_date_cleared_do'] ) {
			$arr_ins['field_CUSTOMS_DATE_CLEARED'] = date('Y-m-d H:i:s') ;
		}
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
	
	$err = specDbsTracy_trspt_ackCustomsStatus( array('trspt_filerecord_id'=>$filerecord_id) ) ;
	if( $err ) {
		return array('success'=>false, 'error'=>$err) ;
	}
	
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
	
	if( is_array($ttmp['data'][0]['steps']) ) {
		foreach( $ttmp['data'][0]['steps'] as $row_order_step ) {
			if( $row_order_step['step_code'] == '50_ASSOC' ) {
				$arr_ins = array() ;
				$arr_ins['field_STATUS_IS_OK'] = 0 ;
				$arr_ins['field_DATE_ACTUAL'] = '0000-00-00 00:00:00' ;
				paracrm_lib_data_updateRecord_file( 'CDE_STEP', $arr_ins, $row_order_step['orderstep_filerecord_id'] );
			}
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
	if( in_array($trspt_record['customs_mode'],array('MAN','AUTO')) ) {
		if( !$trspt_record['customs_date_request'] ) {
			$target_51CREQ = '0000-00-00 00:00:00' ;
		}
	}
	
	$errors = array() ;
	$ttmp = specDbsTracy_cfg_getConfig() ;
	if( in_array($trspt_record['customs_mode'],array('AUTO')) ) {
		foreach( $ttmp['data']['cfg_soc'] as $soc_row ) {
			if( $soc_row['soc_code'] == $trspt_record['id_soc'] ) {
				if( !$soc_row['cfg_customs'] || !$soc_row['cfg_customs']['enabled'] ) {
					$errors[] = 'EDI Broker not enabled for BU' ;
				} elseif( !in_array($trspt_record['customs_mode_auto'],$soc_row['cfg_customs']['modes']) ) {
					$errors[] = 'EDI method not valid for BU' ;
				}
			}
		}
		if( count($trspt_record['hats'])>1 ) {
			$errors[] = 'Multiple shipments not allowed' ;
		}
		if( count($trspt_record['hats'][0]['parcels'])==0 ) {
			$errors[] = 'No parcel(s) information' ;
		}
		$val = 0 ;
		foreach( $trspt_record['orders'] as $order_row ) {
			if( $order_row['desc_value_currency'] ) {
				$val += $order_row['desc_value'] ;
			}
		}
		if( $val <= 0 ) {
			$errors[] = 'Total value/currency required' ;
		}
	}
	if( $errors ) {
		$arr_update['field_CUSTOMS_MODE'] = '' ;
		$arr_update['field_CUSTOMS_DATE_REQUEST'] = '' ;
		$arr_update['field_CUSTOMS_DATE_CLEARED'] = '' ;
		paracrm_lib_data_updateRecord_file( 'TRSPT', $arr_update, $p_trsptFilerecordId );
		unset($target_51CREQ) ;
		unset($target_52CACK) ;
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
	
	
	
	return $errors ;
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
	
	if( $post_data['print_type'] == '_trsptpick' ) {
		if( $trspt_record['trsptpick_filerecord_id'] ) {
			return specDbsTracy_trsptpick_printDoc(array('trsptpick_filerecord_id'=>$trspt_record['trsptpick_filerecord_id'])) ;
		}
		return array('success'=>false) ;
	}
	
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
		$row_bible_CARRIER_address = $row_bible_CARRIER['field_ADDRESS'] ;
		$row_bible_CARRIER_address_NEW = '' ;
		foreach( explode("\n",$row_bible_CARRIER_address) as $line ) {
			$line = trim($line) ;
			if( strlen($line) > 35 ) {
				$line = substr($line,0,35) ;
			}
			$row_bible_CARRIER_address_NEW.= $line."\n" ;
		}
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
			$buffer.= '<span class="mybig" style="white-space: nowrap;">' ;
			$buffer.= '<b>'.$trspt_record['mvt_carrier'].'</b><br>' ;
			$buffer.= ''.nl2br(htmlentities($row_bible_CARRIER_address_NEW)).'<br>' ;
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
			$buffer.= "<td width='50%'  valign='top'>" ;
				$cell_style = "style='border: 1px solid gray'" ;
				$buffer.= '<table cellpadding="5" cellspacing="2" border="0" class="mybig" width="100%">' ;
				$buffer.= "<tr><td {$cell_style} align='center' height='32'><b>ENLEVEMENT NAVETTE</b></td></tr>" ;
				$buffer.= "<tr><td {$cell_style}  height='48'>Date :</td></tr>" ;
				$buffer.= "<tr><td {$cell_style}  height='48'>Heure :</td></tr>" ;
				$buffer.= '</table>' ;
				
				$buffer.= '<br>' ;
				
				$cell_style = "style='border: 1px solid gray'" ;
				$buffer.= '<table cellpadding="5" cellspacing="2" border="0" class="mybig" width="100%">' ;
				$buffer.= "<tr><td {$cell_style} align='center' height='32'><b>LIVRAISON</b></td></tr>" ;
				$buffer.= "<tr><td {$cell_style}  height='48'>Date :</td></tr>" ;
				$buffer.= "<tr><td {$cell_style}  height='48'>Heure :</td></tr>" ;
				$buffer.= '</table>' ;
			$buffer.= "</td>" ;
			$buffer.= "<td>&nbsp;</td>" ;
			$buffer.= "<td width='50%'  valign='top'>" ;
				$cell_style = "style='border: 1px solid gray'" ;
				$buffer.= '<table cellpadding="5" cellspacing="2" border="0" class="mybig" width="100%">' ;
				$buffer.= "<tr><td {$cell_style} valign='top' height='144'><b>RECU PAR<br>(CACHET/NOM) :</b></td></tr>" ;
				$buffer.= '</table>' ;
			$buffer.= "</td>" ;
			$buffer.= "</tr></table>" ;
			break ;
			
			case 'pickup' :
			$buffer.= "<table border='0' cellspacing='5' cellpadding='5' width='800'>" ;
			$buffer.= "<tr>" ;
			$buffer.= "<td width='50%'  valign='top'>" ;
				/*
				$buffer.= '<span class="mybig">' ;
				$buffer.= '<b>'.'ENLEVEMENT TRANSPORTEUR :'.'</b><br>' ;
				$buffer.= ''.'DATE :'.'<br>' ;
				$buffer.= ''.'HEURE :'.'<br>' ;
				$buffer.= ''.'NOM :'.'<br>' ;
				$buffer.= "</span>" ;
				*/
				$cell_style = "style='border: 1px solid gray'" ;
				$buffer.= '<table cellpadding="5" cellspacing="2" border="0" class="mybig" width="100%">' ;
				$buffer.= "<tr><td {$cell_style} align='center' height='32'><b>Pickup forwarder</b></td></tr>" ;
				$buffer.= "<tr><td {$cell_style}  height='48'>Date :</td></tr>" ;
				$buffer.= "<tr><td {$cell_style}  height='48'>Pickup hours :</td></tr>" ;
				$buffer.= "<tr><td {$cell_style}  height='48'>Society :</td></tr>" ;
				$buffer.= "<tr><td {$cell_style}  height='48'>Driver's name :</td></tr>" ;
				$buffer.= "<tr><td {$cell_style} valign='top' height='144'>Driver's signature</td></tr>" ;
				$buffer.= '</table>' ;
			$buffer.= "</td>" ;
			$buffer.= "<td>&nbsp;</td>" ;
			$buffer.= "<td width='50%'  valign='top'>" ;
				$cell_style = "style='border: 1px solid gray'" ;
				$buffer.= '<table cellpadding="5" cellspacing="2" border="0" class="mybig" width="100%">' ;
				$buffer.= "<tr><td {$cell_style} valign='top' height='144'><b>RECU PAR<br>(CACHET/NOM) :</b></td></tr>" ;
				$buffer.= '</table>' ;
			$buffer.= "</td>" ;
			$buffer.= "</tr></table>" ;
			break ;
			
			case 'integrateur' :
			$buffer.= "<table border='0' cellspacing='5' cellpadding='5' width='800'>" ;
			$buffer.= "<tr>" ;
			$buffer.= "<td width='50%'  valign='top'>" ;
				$cell_style = "style='border: 1px solid gray'" ;
				$buffer.= '<table cellpadding="5" cellspacing="2" border="0" class="mybig" width="100%">' ;
				$buffer.= "<tr><td {$cell_style} align='center' height='32'><b>INTEGRATEUR</b></td></tr>" ;
				$buffer.= "<tr><td {$cell_style}  height='48'>Date :</td></tr>" ;
				$buffer.= "<tr><td {$cell_style}  height='48'>Heure :</td></tr>" ;
				$buffer.= "<tr><td {$cell_style}  height='48'>Nom :</td></tr>" ;
				$buffer.= '</table>' ;
			$buffer.= "</td>" ;
			$buffer.= "<td>&nbsp;</td>" ;
			$buffer.= "<td width='50%'  valign='top'>" ;
				$cell_style = "style='border: 1px solid gray'" ;
				$buffer.= '<table cellpadding="5" cellspacing="2" border="0" class="mybig" width="100%">' ;
				$buffer.= "<tr><td {$cell_style} valign='top' height='144'><b>RECU PAR<br>(CACHET/NOM) :</b></td></tr>" ;
				$buffer.= '</table>' ;
			$buffer.= "</td>" ;
			$buffer.= "</tr></table>" ;
			break ;
		}
		
		$buffer.= "<br>" ;
		
	
	
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
	
	$html = $doc->saveHTML() ;
	return array('success'=>true, 'html'=>$html, 'pdf_base64'=>base64_encode(media_pdf_html2pdf($html,'A4')) ) ;
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






function specDbsTracy_trspt_createLabelTMS( $post_data ) {
	try {
		$trsptevent_filerecord_id = specDbsTracy_lib_TMS_getLabelEventId( $post_data['trspt_filerecord_id'] ) ;
	} catch( Exception $e ) {
		return array('success'=>false, 'error'=>$e->getMessage()) ;
	}
	$row_trsptevent = paracrm_lib_data_getRecord_file('TRSPT_EVENT',$trsptevent_filerecord_id) ;
	$map_storeIds = json_decode($row_trsptevent['field_EVENTLINK_IDS_JSON'],true) ;
	if( !$map_storeIds ) {
		return array('success'=>false, 'error'=>'System error') ;
	}
	if( !$map_storeIds['RESPONSE_OK'] ) {
		return array('success'=>false,'error'=>$row_trsptevent['field_EVENT_TXT']) ;
	}
	return array('success'=>true,'trsptevent_filerecord_id'=>$trsptevent_filerecord_id) ;
}
function specDbsTracy_trspt_getLabelTMS( $post_data ) {
	global $_opDB ;
	
	$p_trsptFilerecordId = $post_data['trspt_filerecord_id'] ;
	$p_trspteventFilerecordId = $post_data['trsptevent_filerecord_id'] ;
	
		
	//sleep(2) ;
	$row_trsptevent = paracrm_lib_data_getRecord_file('TRSPT_EVENT',$p_trspteventFilerecordId) ;
	if( $row_trsptevent['filerecord_parent_id'] != $p_trsptFilerecordId ) {
		return array('success'=>false) ;
	}
	if( $row_trsptevent['field_EVENTLINK_FILE'] != 'TMS_STORE' ) {
		return array('success'=>false) ;
	}
	$map_storeIds = json_decode($row_trsptevent['field_EVENTLINK_IDS_JSON'],true) ;
	
	$query = "SELECT max(filerecord_id) FROM view_file_TRSPT_EVENT 
			WHERE filerecord_parent_id='{$p_trsptFilerecordId}' AND field_EVENTLINK_FILE='TMS_STORE'" ;
	if( $_opDB->query_uniqueValue($query)== $p_trspteventFilerecordId ) {
		$is_printable = TRUE ;
	}
	
	
	$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
	$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;
	media_contextOpen( $_sdomain_id ) ;
	foreach( $map_storeIds as $mkey => $tmsstore_filerecord_id ) {
		switch( $mkey ) {
			case 'REQUEST' :
				$json_request = media_bin_getBinary( media_bin_toolFile_getId('TMS_STORE',$tmsstore_filerecord_id) ) ;
				$obj_request = json_decode($json_request,true) ;
				$binary_format = $obj_request['format'] ;
				break ;
			case 'RESPONSE_OK' :
			case 'RESPONSE_NOK' :
				$json_response = media_bin_getBinary( media_bin_toolFile_getId('TMS_STORE',$tmsstore_filerecord_id) ) ;
				if( $mkey == 'RESPONSE_OK' ) {
					$obj_response = json_decode($json_response,true) ;
					$label_data = array(
						'trspt_filerecord_id' => $p_trsptFilerecordId,
						'trsptevent_filerecord_id' => $p_trspteventFilerecordId,
						'is_printable' => $is_printable,
						'date_create' => $row_trsptevent['field_EVENT_DATE'],
						'date_print' => null,
						'tracking_no' => $obj_response['trackingNumber']
					);
					$binary_base64 = $obj_response['labelData'] ;
				}
				break ;
			case 'RESULT_PNG' :
				$label_png_binary = media_bin_getBinary( media_bin_toolFile_getId('TMS_STORE',$tmsstore_filerecord_id) ) ;
				$label_png_base64 = base64_encode($label_png_binary) ;
				break ;
		}
	}
	media_contextClose() ;
	
	return array(
		'success' => true,
		'data' => array(
			'json_request' => $json_request,
			'json_response' => $json_response,
			'label_png_base64' => $label_png_base64,
			'label_data' => $label_data,
			'label_binary' => $is_printable ? array(
				'binary_format' => $binary_format,
				'binary_base64' => $binary_base64
			) : null
		)
	) ;
}
function specDbsTracy_trspt_printTMS( $post_data ) {
	sleep(3) ;
	$p_trsptFilerecordId = $post_data['trspt_filerecord_id'] ;
	$p_trspteventFilerecordId = $post_data['trsptevent_filerecord_id'] ;
	
	$p_printerStr = $post_data['printer_str'] ;
	
	$obj_json = specDbsTracy_trspt_getLabelTMS( array(
		'trspt_filerecord_id' => $p_trsptFilerecordId,
		'trsptevent_filerecord_id' => $p_trspteventFilerecordId
	));
	if( !$obj_json['success'] || !$obj_json['data']['label_binary'] ) {
		array('success'=>false, 'error'=>'Not printable') ;
	}
	$label_binary = $obj_json['data']['label_binary'] ;
	try {
		specDbsTracy_lib_TMS_doPrintB64($label_binary['binary_format'],$label_binary['binary_base64'],$p_printerStr) ;
	} catch( Exception $e ) {
		return array('success'=>false, 'error'=>$e->getMessage()) ;
	}
	return array('success'=>true) ;
}















function specDbsTracy_trsptpick_printDoc( $post_data ) {
	global $_opDB ;
	
	$p_trsptpickFilerecordId = $post_data['trsptpick_filerecord_id'] ;
	$_pAddData = json_decode($post_data['data'],true);
	
	$app_root = $GLOBALS['app_root'] ;
	$resources_root=$app_root.'/resources' ;
	$templates_dir=$resources_root.'/server/templates' ;
	$_IMG['DBS_logo_bw'] = file_get_contents($templates_dir.'/'.'DBS_logo_bw.png') ;
	
	$query = "SELECT * FROM view_file_TRSPTPICK WHERE filerecord_id='{$p_trsptpickFilerecordId}'" ;
	$result = $_opDB->query($query) ;
	$arrDB_trsptpick = $_opDB->fetch_assoc($result) ;
	
	$arr_trsptFilerecordIds = array() ;
	$query = "SELECT field_FILE_TRSPT_ID FROM view_file_TRSPTPICK_TRSPT WHERE filerecord_parent_id='{$p_trsptpickFilerecordId}' AND field_LINK_IS_CANCEL='0'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$arr_trsptFilerecordIds[] = $arr[0] ;
	}
	
	$ttmp = specDbsTracy_trspt_getRecords( array(
		'filter_trsptFilerecordId_arr' => json_encode( $arr_trsptFilerecordIds )
	) );
	if( count($ttmp['data']) < 1 ) {
		return array('success'=>false) ;
	}
	
	$trspt_records = $ttmp['data'] ;
	$trspt_record = $ttmp['data'][0] ;
	
	
		$print_date = date('d/m/Y H:i') ;
		
		$buffer.= '<DIV></DIV>' ;
		$buffer.= "<table border='0' cellspacing='1' cellpadding='1'>" ;
		$buffer.= "<tr><td align='center' valign='middle' width='600'>" ;
			$buffer.= "<table cellspacing='1' cellpadding='1'>";
			$buffer.= "<tr><td><span class=\"huge\"><b>{$title}</span></td></tr>" ;
			$buffer.= "<tr><td align='center'><span class=\"huge\"><b>SAFRAN / TRANSPORT MANIFEST</span></td></tr>" ;
			$buffer.= "<tr><td align='center'><span class=\"mybig\">Date : <b>{$print_date}</b></span></td></tr>" ;
			//{$data_commande['date_exp']}
			$buffer.= "</table>";
		$buffer.= "</td><td valign='middle' align='center' width='120'>" ;
			$buffer.= "<img src=\"data:image/jpeg;base64,".base64_encode($_IMG['DBS_logo_bw'])."\" />" ;
		$buffer.= "</td></tr><tr><td height='25'/></tr></table>" ;
		
		
		$query = "SELECT * FROM view_bible_LIST_CARRIER_entry WHERE entry_key='{$trspt_record['mvt_carrier']}'" ;
		$result = $_opDB->query($query) ;
		$row_bible_CARRIER = $_opDB->fetch_assoc($result) ;
		$row_bible_CARRIER_address = $row_bible_CARRIER['field_ADDRESS'] ;
		$row_bible_CARRIER_address_NEW = '' ;
		foreach( explode("\n",$row_bible_CARRIER_address) as $line ) {
			$line = trim($line) ;
			if( strlen($line) > 35 ) {
				$line = substr($line,0,35) ;
			}
			$row_bible_CARRIER_address_NEW.= $line."\n" ;
		}
		//print_r($row_bible_CARRIER) ;
		
		$buffer.= "<table border='0' cellspacing='5' cellpadding='5' width='800'>" ;
		$buffer.= "<tr>" ;
		$buffer.= "<td width='33%' style='border: 1px solid gray'>" ;
			$buffer.= "<table border='0' cellspacing='4' cellpadding='4'>" ;
				$buffer.= "<tr><td><span class='mybig'>Manifest</span></td><td><span class='mybig'><b>{$arrDB_trsptpick['field_ID_PICK']}</td></tr>" ;
				$buffer.= "<tr><td><span class='mybig'>Driver</span></td><td><span class='mybig'><b>{$arrDB_trsptpick['field_ATR_NAME']}</td></tr>" ;
				$buffer.= "<tr><td><span class='mybig'>Plate</span></td><td><span class='mybig'><b>{$arrDB_trsptpick['field_ATR_LPLATE']}</td></tr>" ;
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
			$buffer.= '<span class="mybig" style="white-space: nowrap;">' ;
			$buffer.= '<b>'.$trspt_record['mvt_carrier'].'</b><br>' ;
			$buffer.= ''.nl2br(htmlentities($row_bible_CARRIER_address_NEW)).'<br>' ;
			$buffer.= "</span>" ;
		$buffer.= "</td>" ;
		$buffer.= "</tr></table>" ;
		
		$buffer.= "<br>" ;
				
		$buffer.= "<table width='90%' class='tabledonnees'>" ;
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
			
			$tot_vol_count = 0 ;
			$tot_vol_kg = 0 ;
			$buffer.= "<tbody>" ;
			foreach( $trspt_records as $trspt_record ) {
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
						$tot_vol_count += $vol_count ;
						$buffer.= "<td align='center'><span class=\"mybig\"><b>".(float)$vol_count."</b>"."</span></td>" ;
						
						$vol_kg = 0 ;
						foreach( $row_hat['parcels'] as $row_hat_parcel ) {
							$vol_kg += $row_hat_parcel['vol_kg'] ;
						}
						$tot_vol_kg += $vol_kg ;
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
			}
			$buffer.= "</tbody>" ;
			
			$buffer.= '<tfoot>' ;
				$buffer.= "<tr>";
					$buffer.= "<td>&nbsp;</td>";
					$buffer.= "<td>&nbsp;</td>";
					$buffer.= "<td>&nbsp;</td>";
					$buffer.= "<td align='center'><span class=\"mybig\"><b>".(float)$tot_vol_count."</b>"."</span></td>";
					$buffer.= "<td align='center'><span class=\"mybig\"><b>".(float)$tot_vol_kg."</b>&#160;kg"."</span></td>";
					$buffer.= "<td>&nbsp;</td>";
				$buffer.= "</tr>" ;
			$buffer.= '</tfoot>' ;
			
		$buffer.= "</table>" ;
		
		$buffer.= "<br><br>" ;
		
		if( $_pAddData['sign_base64'] ) {
			$buffer.= "<table style=\"border:2px solid black ; padding:10px\" width='250'><tr><td align='center'>" ; 
			$buffer.= "<span class=\"mybig\">Driver signature</span><br>" ;
			$buffer.= "<img src=\"data:image/jpeg;base64,{$_pAddData['sign_base64']}\"/><br>" ;
			$buffer.= "</td></tr></table>" ;
		}
		
	
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
	
	$html = $doc->saveHTML() ;
	return array('success'=>true, 'html'=>$html, 'pdf_base64'=>base64_encode(media_pdf_html2pdf($html,'A4')) ) ;
}
function specDbsTracy_trsptpick_fetchPdf( $post_data ) {
	global $_opDB ;
	$p_trsptpickFilerecordId = $post_data['trsptpick_filerecord_id'] ;
	
	$query = "SELECT * FROM view_file_TRSPTPICK WHERE filerecord_id='{$p_trsptpickFilerecordId}'" ;
	$result = $_opDB->query($query) ;
	$arrDB_trsptpick = $_opDB->fetch_assoc($result) ;
	
	$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
	$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;
	media_contextOpen( $_sdomain_id ) ;
	$binary_pdf = media_bin_getBinary( media_bin_toolFile_getId('TRSPTPICK',$p_trsptpickFilerecordId) ) ;
	media_contextClose() ;
	
	if( !$binary_pdf ) {
		return array('success'=>false) ;
	}
	return array('success'=>true, 'pdf_title'=>$arrDB_trsptpick['field_ID_PICK'], 'pdf_base64'=>base64_encode($binary_pdf) ) ;
}


?>
