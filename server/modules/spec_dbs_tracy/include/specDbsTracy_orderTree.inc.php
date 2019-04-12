<?php
function specDbsTracy_orderTree_getData( $post_data ) {
	global $_opDB ;
	
	$ttmp = specDbsTracy_cfg_getConfig() ;
	$cfg_orderflow = $ttmp['data']['cfg_orderflow'] ;
	
	$post_data_order = $post_data ;
	$json_order = specDbsTracy_order_getRecords($post_data_order) ;
	$post_data_hat = array('skip_details'=>1, 'skip_dimensions'=>1) + $post_data ;
	$json_hat = specDbsTracy_hat_getRecords($post_data_hat) ;
	
	$map_stepCode_descCode = array() ;
	$map_stepDescCodes_count = array() ;
	foreach( $cfg_orderflow as $row_orderflow ) {
		foreach( $row_orderflow['steps'] as $row_orderflowstep ) {
			$map_stepCode_descCode[$row_orderflowstep['step_code']] = $row_orderflowstep['desc_code'] ;
			if( !isset($map_stepDescCodes_count[$row_orderflowstep['desc_code']]) ) {
				$map_stepDescCodes_count[$row_orderflowstep['desc_code']] = 0 ;
			}
		}
	}
	
	//print_r($map_stepDescCodes_count) ;
	
	$map_orderId_orderRow = array() ;
	foreach( $json_order['data'] as &$order_row ) {
		foreach( $order_row['steps'] as $orderstep_row ) {
			$step_code = $orderstep_row['step_code'] ;
			$row_key = 'step_'.$map_stepCode_descCode[$step_code] ;
			if( !$orderstep_row['status_is_ok'] ) {
				$order_row[$row_key] = array('color'=>'') ;
				continue ;
			}
			$order_row[$row_key] = array(
				'color' => 'green',
				'ACTUAL_dateSql' => $orderstep_row['date_actual']
			) ;
		}
		
		if( !$order_row['calc_link_is_active'] ) {
			if( !specDbsTracy_orderTree_tool_checkOrderData($order_row) ) {
				$order_row['_color'] = 'red' ;
			} else {
				$order_row['_color'] = 'green' ;
			}
		} else {
			$order_row['_color'] = 'blue' ;
		}
		
		$curStepCode = $order_row['calc_step'] ;
		$curStepDescCode = $map_stepCode_descCode[$curStepCode] ;
		if( isset($map_stepDescCodes_count[$curStepDescCode]) ) {
			$map_stepDescCodes_count[$curStepDescCode]++ ;
		}
		
		unset($order_row['adr_json']) ;
		unset($order_row['attachments']) ;
		unset($order_row['events']) ;
		unset($order_row['steps']) ;
		
		$map_orderId_orderRow[$order_row['order_filerecord_id']] = $order_row ;
	}
	unset($order_row) ;
	
	$map_hatId_hatRow = array() ;
	$map_orderId_hatId = array() ;
	foreach($json_hat['data'] as $hat_row ) {
		$map_hatId_hatRow[$hat_row['hat_filerecord_id']] = $hat_row ;
		foreach( $hat_row['orders'] as $hat_rowLinkOrder ) {
			$map_orderId_hatId[$hat_rowLinkOrder['order_filerecord_id']] = $hat_row['hat_filerecord_id'] ;
		}
	}
	
	$gridData = array() ;
	foreach( $json_order['data'] as $order_row ) {
	
		$orderFilerecordId = $order_row['order_filerecord_id'] ;
		if( isset($map_orderId_hatId[$orderFilerecordId]) ) {
			if( !isset($map_hatId_hatRow[$map_orderId_hatId[$orderFilerecordId]]) ) {
				// hat déja construit
				continue ;
			}
			
			$hatData = $map_hatId_hatRow[$map_orderId_hatId[$orderFilerecordId]] ;
			
			$hatHeader = array() ;
			$hatHeader['id_soc'] = $hatData['id_soc'] ;
			$hatHeader['id_hat'] = $hatData['id_hat'] ;
			$hatHeader['id_dn'] = $hatData['id_hat'] ;
			$hatHeader['order_filerecord_id'] = null ;
			$hatHeader['hat_filerecord_id'] = $hatData['hat_filerecord_id'] ;
			$hatHeader['calc_step'] = $order_row['calc_step'] ;
			$hatHeader['calc_link_is_active'] = $order_row['calc_link_is_active'] ;
			$hatHeader['calc_link_trspt_filerecord_id'] = $order_row['calc_link_trspt_filerecord_id'] ;
			$hatHeader['calc_link_trspt_txt'] = $order_row['calc_link_trspt_txt'] ;
			$hatHeader['_color'] = $order_row['_color'];
			foreach( $order_row as $k=>$v ) {
				$ttmp = explode('_',$k) ;
				$kp = $ttmp[0] ;
				if( in_array($kp,array('txt','atr','ref')) ) {
					$hatHeader[$k] = $v ;
				}
			}
			/*
			Ext.Object.each( row, function(k,v) {
				if( Ext.Array.contains(['txt','atr','ref'],k.split('_')[0]) ) {
					hatHeader[k] = v ;
				}
			}) ;
			*/
			
			$hatChildren = array() ;
			foreach( $hatData['orders'] as $hat_rowLinkOrder ) {
				$orderRow = $map_orderId_orderRow[$hat_rowLinkOrder['order_filerecord_id']] ;
				if( !$orderRow ) {
					//console.dir(rowLinkOrder['order_filerecord_id']) ;
					continue ;
				}
				
				$hatChild = $orderRow ;
				$hatChild['id'] = $hatData['hat_filerecord_id'].'-'.$orderRow['order_filerecord_id'];
				$hatChild['leaf'] = true ;
				$hatChildren[] = $hatChild ;
			}
			
			$hatHeader['leaf'] = false ;
			$hatHeader['expanded'] = true ;
			$hatHeader['children'] = $hatChildren ;
			$hatHeader['id'] = $hatData['hat_filerecord_id'] ;
			$gridData[] = $hatHeader ;
			
			//delete map_hatId_hatRow 
			unset($map_hatId_hatRow[$map_orderId_hatId[$orderFilerecordId]]) ;
			
			continue ;
		}
	
		$singleOrderRow = $map_orderId_orderRow[$order_row['order_filerecord_id']] ;
		$singleOrderRow['leaf'] = true ;
		$gridData[] = $singleOrderRow ;
	}
	
	
	$root = array(
		'root' => true,
		'expanded' => true,
		'children' => $gridData
	);
	$map_stepDataIdx_count = array() ;
	$map_stepDataIdx_count['dummy'] = '' ;
	foreach( $map_stepDescCodes_count as $desc_code => $cnt ) {
		$mkey = 'step_'.$desc_code ;
		$map_stepDataIdx_count[$mkey] = $cnt ;
	}
	
	return array('success'=>root, 'dataTree'=>$root, 'dataCount'=>$map_stepDataIdx_count ) ;
}


function specDbsTracy_orderTree_tool_checkOrderData( $row ) {
	$fields = array(
			'id_soc',
			'ref_po',
			'ref_invoice',
			'atr_priority',
			'atr_incoterm',
			'atr_consignee',
			'txt_location_city',
			'txt_location_full'
	);
	foreach( $fields as $field ) {
		if( !$row[$field] ) {
			return FALSE ;
		}
	}
	return TRUE ;
}
?>
