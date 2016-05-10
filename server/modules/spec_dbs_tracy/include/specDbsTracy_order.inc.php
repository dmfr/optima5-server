<?php

function specDbsTracy_order_getRecords( $post_data ) {
	global $_opDB ;
	
	// filter ?
	if( isset($post_data['filter_orderFilerecordId_arr']) ) {
		$filter_orderFilerecordId_list = $_opDB->makeSQLlist( json_decode($post_data['filter_orderFilerecordId_arr'],true) ) ;
	}
	if( $post_data['filter_socCode'] ) {
		$filter_socCode = $post_data['filter_socCode'] ;
	}
	
	$TAB_order = array() ;
	
	$query = "SELECT * FROM view_file_CDE c" ;
	$query.= " WHERE 1" ;
	if( isset($filter_orderFilerecordId_list) ) {
		$query.= " AND c.filerecord_id IN {$filter_orderFilerecordId_list}" ;
	}
	if( isset($filter_socCode) ) {
		$query.= " AND c.field_ID_SOC='{$filter_socCode}'" ;
	}
	$query.= " ORDER BY c.filerecord_id DESC" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB_order[$arr['filerecord_id']] = array(
			'order_filerecord_id' => $arr['filerecord_id'],
			'flow_code' => $arr['field_FLOW_CODE'],
			'id_soc' => $arr['field_ID_SOC'],
			'id_dn' => $arr['field_ID_DN'],
			'ref_po' => $arr['field_REF_PO'],
			'ref_invoice' => $arr['field_REF_INVOICE'],
			'atr_type' => $arr['field_ATR_TYPE'],
			'atr_priority' => $arr['field_ATR_PRIORITY'],
			'atr_incoterm' => $arr['field_ATR_INCOTERM'],
			'atr_consignee' => $arr['field_ATR_CONSIGNEE'],
			'txt_location_city' => $arr['field_TXT_LOCATION_CITY'],
			'txt_location_full' => $arr['field_TXT_LOCATION_FULL'],
			'vol_kg' => $arr['field_VOL_KG'],
			'vol_dims' => $arr['field_VOL_DIMS'],
			'vol_count' => $arr['field_VOL_COUNT'],
			
			'warning_is_on' => $arr['field_WARNING_IS_ON'],
			'warning_code' => $arr['field_WARNING_CODE'],
			'warning_txt' => $arr['field_WARNING_TXT'],
			
			'steps' => array(),
			'attachments' => array(),
			
			'calc_step' => '',
			'calc_link_is_active' => null,
			'calc_link_trspt_filerecord_id' => null
		);
	}
	
	$query = "SELECT c.filerecord_id, tc.filerecord_parent_id, t.field_ID_DOC FROM view_file_CDE c" ;
	$query.= " LEFT OUTER JOIN view_file_TRSPT_CDE tc ON tc.field_FILE_CDE_ID=c.filerecord_id AND tc.field_LINK_IS_CANCEL='0'" ;
	$query.= " LEFT OUTER JOIN view_file_TRSPT t ON t.filerecord_id=tc.filerecord_parent_id" ;
	$query.= " WHERE 1" ;
	if( isset($filter_orderFilerecordId_list) ) {
		$query.= " AND c.filerecord_id IN {$filter_orderFilerecordId_list}" ;
	}
	if( isset($filter_socCode) ) {
		$query.= " AND c.field_ID_SOC='{$filter_socCode}'" ;
	}
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$filerecord_id = $arr[0] ;
		$TAB_order[$filerecord_id]['calc_link_is_active'] = ($arr[1]!=NULL) ;
		$TAB_order[$filerecord_id]['calc_link_trspt_filerecord_id'] = $arr[1] ;
		$TAB_order[$filerecord_id]['calc_link_trspt_txt'] = $arr[2] ;
	}
	
	
	$query = "SELECT * FROM view_file_CDE_ATTACH ca" ;
	$query.= " WHERE 1" ;
	if( isset($filter_orderFilerecordId_list) ) {
		$query.= " AND ca.filerecord_parent_id IN {$filter_orderFilerecordId_list}" ;
	}
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		if( !isset($TAB_order[$arr['filerecord_parent_id']]) ) {
			continue ;
		}
		$TAB_order[$arr['filerecord_parent_id']]['attachments'][] = array(
			'attachment_filerecord_id' => $arr['filerecord_id'],
			'parent_file' => 'order',
			'attachment_date' => substr($arr['field_ATTACHMENT_DATE'],0,10),
			'attachment_txt' => $arr['field_ATTACHMENT_TXT']
		);
	}
	
	$query = "SELECT * FROM view_file_CDE_STEP cs" ;
	$query.= " WHERE 1" ;
	if( isset($filter_orderFilerecordId_list) ) {
		$query.= " AND cs.filerecord_parent_id IN {$filter_orderFilerecordId_list}" ;
	}
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		if( !isset($TAB_order[$arr['filerecord_parent_id']]) ) {
			continue ;
		}
		$TAB_order[$arr['filerecord_parent_id']]['steps'][] = array(
			'orderstep_filerecord_id' => $arr['filerecord_id'],
			'step_code' => $arr['field_STEP_CODE'],
			'status_is_ok' => $arr['field_STATUS_IS_OK'],
			'date_actual' => $arr['field_DATE_ACTUAL']
		);
	}
	
	foreach( $TAB_order as &$row_order ) {
		$max_stepCode = array() ;
		foreach( $row_order['steps'] as $row_order_step ) {
			if( $row_order_step['status_is_ok'] ) {
				$max_stepCode[] = $row_order_step['step_code'] ;
			}
		}
		if( $max_stepCode ) {
			$row_order['calc_step'] = max($max_stepCode) ;
		}
	}
	unset($row_order) ;
	
	return array('success'=>true, 'data'=>array_values($TAB_order)) ;
}

function specDbsTracy_order_setHeader( $post_data ) {
	usleep(100*1000);
	global $_opDB ;
	$file_code = 'CDE' ;
	
	$form_data = json_decode($post_data['data'],true) ;
	
	if( $form_data['atr_consignee_create'] ) {
		$entry_key = preg_replace("/[^a-zA-Z0-9]/", "", strtoupper($form_data['atr_consignee'])) ;
	
		$arr_ins = array() ;
		$arr_ins['field_CODE'] = $entry_key ;
		$arr_ins['field_NAME'] = strtoupper($form_data['atr_consignee']) ;
		paracrm_lib_data_insertRecord_bibleEntry( 'LIST_CONSIGNEE', $entry_key, 'UPLOAD', $arr_ins ) ;
		
		$form_data['atr_consignee'] = $entry_key ;
	}
	
	$arr_ins = array() ;
	if( $post_data['_is_new'] ) {
		$arr_ins['field_ID_SOC'] = $form_data['id_soc'] ;
		$arr_ins['field_ID_DN'] = $form_data['id_dn'] ;
		$arr_ins['field_FLOW_CODE'] = $form_data['flow_code'] ;
	}
	$arr_ins['field_REF_PO'] = $form_data['ref_po'] ;
	$arr_ins['field_REF_INVOICE'] = $form_data['ref_invoice'] ;
	$arr_ins['field_ATR_TYPE'] = $form_data['atr_type'] ;
	$arr_ins['field_ATR_PRIORITY'] = $form_data['atr_priority'] ;
	$arr_ins['field_ATR_INCOTERM'] = $form_data['atr_incoterm'] ;
	$arr_ins['field_ATR_CONSIGNEE'] = $form_data['atr_consignee'] ;
	$arr_ins['field_TXT_LOCATION_CITY'] = $form_data['txt_location_city'] ;
	$arr_ins['field_TXT_LOCATION_FULL'] = $form_data['txt_location_full'] ;
	$arr_ins['field_VOL_KG'] = $form_data['vol_kg'] ;
	$arr_ins['field_VOL_DIMS'] = $form_data['vol_dims'] ;
	$arr_ins['field_VOL_COUNT'] = $form_data['vol_count'] ;
	
	if( $post_data['_is_new'] ) {
		$filerecord_id = paracrm_lib_data_insertRecord_file( $file_code, 0, $arr_ins );
	} elseif( $post_data['order_filerecord_id'] ) {
		$filerecord_id = paracrm_lib_data_updateRecord_file( $file_code, $arr_ins, $post_data['order_filerecord_id'] );
	} else {
		return array('success'=>false) ;
	}
	
	if( TRUE ) {
		$file_code = 'CDE_STEP' ;
	
		// TODO : specify order flow
		$orderflow_current = NULL ;
		
		$ttmp = specDbsTracy_cfg_getConfig() ;
		$json_cfg = $ttmp['data'] ;
		foreach( $json_cfg['cfg_orderflow'] as $orderflow ) {
			if( $orderflow['flow_code'] == $form_data['flow_code'] ) {
				$orderflow_current = $orderflow ;
				break ;
			}
		}
		if( $orderflow_current ) {
			foreach( $orderflow_current['steps'] as $orderflow_step ) {
				$arr_ins = array() ;
				$arr_ins['field_STEP_CODE'] = $orderflow_step['step_code'] ;
				paracrm_lib_data_insertRecord_file($file_code,$filerecord_id,$arr_ins,$ignore_ifExists=TRUE) ;
			}
		}
	}
	
	if( $post_data['validateStepCode'] ) {
		specDbsTracy_order_stepValidate( array(
			'order_filerecord_id' => $filerecord_id,
			'step_code' => $post_data['validateStepCode']
		));
	}
	
	return array('success'=>true, 'id'=>$filerecord_id) ;
}
function specDbsTracy_order_setWarning( $post_data ) {
	usleep(100*1000);
	global $_opDB ;
	$file_code = 'CDE' ;
	
	$form_data = json_decode($post_data['data'],true) ;
	
	
	$arr_ins = array() ;
	$arr_ins['field_WARNING_IS_ON'] = ($form_data['warning_is_on'] ? 1:0 ) ;
	$arr_ins['field_WARNING_CODE'] = $form_data['warning_code'] ;
	$arr_ins['field_WARNING_TXT'] = $form_data['warning_txt'] ;
	$filerecord_id = paracrm_lib_data_updateRecord_file( $file_code, $arr_ins, $post_data['order_filerecord_id'] );
	
	return array('success'=>true, 'id'=>$filerecord_id) ;
}

function specDbsTracy_order_setStep( $post_data ) {
	global $_opDB ;
	$file_code = 'CDE_STEP' ;
	
	$form_data = json_decode($post_data['data'],true) ;
	
	if( $post_data['orderstep_filerecord_id'] != $form_data['orderstep_filerecord_id'] ) {
		return array('success'=>false) ;
	}
	$arr_update = array() ;
	$arr_update['field_STATUS_IS_OK'] = ( $form_data['status_is_ok'] ? 1 : 0 ) ;
	$arr_update['field_DATE_ACTUAL'] = ( $form_data['date_actual'] ? $form_data['date_actual'] : '0000-00-00 00:00:00' ) ;
	paracrm_lib_data_updateRecord_file( $file_code, $arr_update, $post_data['orderstep_filerecord_id'] );
	
	return array('success'=>true, 'debug'=>$form_data) ;
}


function specDbsTracy_order_stepValidate( $post_data ) {
	global $_opDB ;
	$file_code = 'CDE_STEP' ;
	
	$p_orderFilerecordId = $post_data['order_filerecord_id'] ;
	$p_stepCode = $post_data['step_code'] ;
	if( isset($post_data['date_actual']) ) {
		$p_dateActual = $post_data['date_actual'] ;
	}
	
	$query = "SELECT filerecord_id FROM view_file_CDE_STEP WHERE filerecord_parent_id='{$p_orderFilerecordId}' AND field_STEP_CODE='{$p_stepCode}'" ;
	$p_orderstepFilerecordId = $_opDB->query_uniqueValue($query) ;
	
	$arr_update = array() ;
	$arr_update['field_STATUS_IS_OK'] = 1 ;
	$arr_update['field_DATE_ACTUAL'] = ($p_dateActual ? $p_dateActual : date('Y-m-d H:i:s')) ;
	$arr_update['field_LOG_USER'] = strtoupper($_SESSION['login_data']['delegate_userId']) ;
	paracrm_lib_data_updateRecord_file( $file_code, $arr_update, $p_orderstepFilerecordId );
	
	return array('success'=>true, 'debug'=>$form_data) ;
}


function specDbsTracy_order_download( $post_data ) {
	$ttmp = specDbsTracy_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;

	$data = json_decode($post_data['data'],true) ;
	$columns = array(
		'id_soc' => 'Shipper',
		'atr_type' => 'Type',
		'id_dn' => 'OrderNo',
		'ref_po' => 'PO #',
		'ref_invoice' => 'Invoice#',
		'atr_type' => 'Type',
		'atr_priority' => 'Priority',
		'atr_incoterm' => 'Incoterm',
		'atr_consignee' => 'Consignee',
		
			'vol_kg' => 'Weight (kg)',
			'vol_dims' => 'Dimensions',
			'vol_count' => 'Count',
		
		'calc_link_trspt_txt' => 'Trspt file'
	);
	foreach( $json_cfg['cfg_orderflow'] as $orderflow ) {
		if( $orderflow['flow_code'] == 'AIR' ) {
			$orderflow_AIR = $orderflow ;
			break ;
		}
	}
	if( $orderflow_AIR ) {
		foreach( $orderflow_AIR['steps'] as $orderflow_step ) {
			$mkey = 'step_'.$orderflow_step['step_code'] ;
			$columns[$mkey] = $orderflow_step['step_code'] ;
		}
	}
	$columns += array(
		'warning_is_on' => 'Warning On',
		'warning_code' => 'Warning code',
		'warning_txt' => 'Warning text'
	);
	
		$server_root = $GLOBALS['server_root'] ;
		include("$server_root/include/xlsxwriter.class.php");
		
	$header = array() ;
	foreach( $columns as $mkey => $col_title ) {
		$header[$col_title] = 'string' ;
	}
	$writer = new XLSXWriter();
	$writer->writeSheetHeader('Sheet1', $header );//optional
	foreach( $data as $data_row ) {
	
		$map_stepCode_date = array() ;
		foreach( $data_row['steps'] as $row_step ) {
			if( $row_step['status_is_ok'] ) {
				$map_stepCode_date[$row_step['step_code']] = date('d/m/Y H:i',strtotime($row_step['date_actual'])) ;
			}
		}
	
	
	
		$row = array() ;
		foreach( $columns as $mkey => $dummy ) {
			if( strpos($mkey,'step_')===0 ) {
				$step_code = substr($mkey,5) ;
				if( $map_stepCode_date[$step_code] ) {
					$value = $map_stepCode_date[$step_code] ;
				} else {
					$value = '' ;
				}
			} else {
				$value = '' ;
				switch( $mkey ) {
					case 'calc_link_trspt_txt' :
						if( $data_row['calc_link_is_active'] ) {
							$value = $data_row['calc_link_trspt_txt'] ;
						}
						break ;
						
					default :
						$value = $data_row[$mkey] ;
						break ;
				}
			}
			$row[] = $value ;
		}
		$writer->writeSheetRow('Sheet1', $row );
	}
	
	$tmpfilename = tempnam( sys_get_temp_dir(), "FOO");
	$writer->writeToFile($tmpfilename);
	
	
	$filename = 'DbsTracy_Order'.'_'.time().'.xlsx' ;
	header("Content-Type: application/force-download; name=\"$filename\""); 
	header("Content-Disposition: attachment; filename=\"$filename\""); 
	readfile($tmpfilename) ;
	unlink($tmpfilename) ;
	die() ;
}

?>