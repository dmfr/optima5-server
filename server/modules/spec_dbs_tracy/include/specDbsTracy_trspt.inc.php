<?php

function specDbsTracy_trspt_getRecords( $post_data ) {
	global $_opDB ;
	
	// filter ?
	if( isset($post_data['filter_trsptFilerecordId_arr']) ) {
		$filter_trsptFilerecordId_list = $_opDB->makeSQLlist( json_decode($post_data['filter_trsptFilerecordId_arr'],true) ) ;
	}
	if( $post_data['filter_socCode'] ) {
		$filter_socCode = $post_data['filter_socCode'] ;
	}
	
	$TAB_trspt = array() ;
	
	$query = "SELECT * FROM view_file_TRSPT t" ;
	$query.= " WHERE 1" ;
	if( isset($filter_trsptFilerecordId_list) ) {
		$query.= " AND t.filerecord_id IN {$filter_trsptFilerecordId_list}" ;
	}
	if( isset($filter_socCode) ) {
		$query.= " AND t.field_ID_SOC='{$filter_socCode}'" ;
	}
	$query.= " ORDER BY t.filerecord_id DESC" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB_trspt[$arr['filerecord_id']] = array(
			'trspt_filerecord_id' => $arr['filerecord_id'],
			'id_soc' => $arr['field_ID_SOC'],
			'id_doc' => $arr['field_ID_DOC'],
			'date_create' => substr($arr['field_DATE_CREATE'],0,10),
			'atr_priority' => $arr['field_ATR_PRIORITY'],
			'atr_incoterm' => $arr['field_ATR_INCOTERM'],
			'atr_consignee' => $arr['field_ATR_CONSIGNEE'],
			'mvt_carrier' => $arr['field_MVT_CARRIER'],
			'mvt_origin' => $arr['field_MVT_ORIGIN'],
			'mvt_dest' => $arr['field_MVT_DEST'],
			'flight_awb' => $arr['field_FLIGHT_AWB'],
			'flight_date' => $arr['field_FLIGHT_DATE'],
			'flight_code' => $arr['field_FLIGHT_CODE'],
			
			'calc_step' => NULL,
			
			'events' => array(),
			'orders' => array()
		);
	}
	
	$query = "SELECT * FROM view_file_TRSPT_EVENT te" ;
	$query.= " WHERE 1" ;
	if( isset($filter_trsptFilerecordId_list) ) {
		$query.= " AND te.filerecord_parent_id IN {$filter_trsptFilerecordId_list}" ;
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
		'filter_orderFilerecordId_arr'=> json_encode($filter_orderFilerecordId_arr)
	) ) ;
	$TAB_order = array() ;
	foreach( $ttmp['data'] as $row_order ) {
		$TAB_order[$row_order['order_filerecord_id']] = $row_order ;
	}
	
	foreach( $TAB_trspt as &$row_trspt ) {
		$max_stepCode = array() ;
		foreach( $row_trspt['orders'] as &$row_trsptorder ) {
			if( !($row_order = $TAB_order[$row_trsptorder['order_filerecord_id']]) ) {
				continue ;
			}
			$row_trsptorder += $row_order ;
			if( $row_order['calc_step'] ) {
				$max_stepCode[] = $row_order['calc_step'] ;
			}
		}
		unset($row_trsptorder) ;
		if( $max_stepCode ) {
			$row_trspt['calc_step'] = max($max_stepCode) ;
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
		$arr_ins['field_ID_SOC'] = $form_data['id_soc'] ;
		$arr_ins['field_ID_DOC'] = $form_data['id_soc'].'/'.str_pad((float)$id_next, 7, "0", STR_PAD_LEFT) ;
	}
	$arr_ins['field_DATE_CREATE'] = $form_data['date_create'] ;
	$arr_ins['field_ATR_PRIORITY'] = $form_data['atr_priority'] ;
	$arr_ins['field_ATR_INCOTERM'] = $form_data['atr_incoterm'] ;
	$arr_ins['field_ATR_CONSIGNEE'] = $form_data['atr_consignee'] ;
	$arr_ins['field_MVT_CARRIER'] = $form_data['mvt_carrier'] ;
	$arr_ins['field_MVT_ORIGIN'] = $form_data['mvt_origin'] ;
	$arr_ins['field_MVT_DEST'] = $form_data['mvt_dest'] ;
	$arr_ins['field_FLIGHT_AWB'] = $form_data['flight_awb'] ;
	$arr_ins['field_FLIGHT_DATE'] = substr($form_data['flight_date'],0,10) ;
	$arr_ins['field_FLIGHT_CODE'] = $form_data['flight_code'] ;
	
	if( $post_data['_is_new'] ) {
		$filerecord_id = paracrm_lib_data_insertRecord_file( $file_code, 0, $arr_ins );
	} elseif( $post_data['trspt_filerecord_id'] ) {
		$filerecord_id = paracrm_lib_data_updateRecord_file( $file_code, $arr_ins, $post_data['trspt_filerecord_id'] );
	} else {
		return array('success'=>false) ;
	}
	
	return array('success'=>true, 'id'=>$filerecord_id) ;
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
			return array('success'=>false, 'error'=>"Order {$ttmp['data'][0]['id_dn']} not ready") ;
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



function specDbsTracy_trspt_stepValidate( $post_data ) {
	global $_opDB ;
	
	$p_trsptFilerecordId = $post_data['trspt_filerecord_id'] ;
	$p_stepCode = $post_data['step_code'] ;
	
	// liste chaine des étapes
	$arr_steps = array() ;
	$ttmp = specDbsTracy_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	foreach( $json_cfg['cfg_orderflow'] as $orderflow ) {
		if( $orderflow['flow_code'] != 'AIR' ) {
			continue ;
		}
		foreach( $orderflow['steps'] as $step ) {
			$arr_steps[] = $step['step_code'] ;
		}
	}
	sort($arr_steps) ;
	
	$ttmp = specDbsTracy_trspt_getRecords(array('filter_trsptFilerecordId_arr'=>json_encode(array($p_trsptFilerecordId)))) ;
	$trspt_record = $ttmp['data'][0] ;
	if( !$trspt_record ) {
		return array('success'=>false) ;
	}
	$steps = array() ;
	foreach( $trspt_record['orders'] as $row_order ) {
		if( $row_order['calc_step'] && !in_array($row_order['calc_step'],$steps) ) {
			$steps[] = $row_order['calc_step'] ;
		}
	}
	if( count($steps) != 1 ) {
		return array('success'=>false, 'error'=>'Inconsistant steps in current orders') ;
	}
	
	if( FALSE ) {
		$current_stepCode = reset($steps) ;
		$current_stepCode_idx = array_search($current_stepCode,$arr_steps) ;
		if( $current_stepCode_idx===false || $arr_steps[$current_stepCode_idx+1] != $p_stepCode ) {
			return array('success'=>false, 'error'=>'Inconsistant target step : '+$p_stepCode) ;
		}
	}
	
	foreach( $trspt_record['orders'] as $row_order ) {
		specDbsTracy_order_stepValidate( array(
			'order_filerecord_id' => $row_order['order_filerecord_id'],
			'step_code' => $p_stepCode
		) );
	}
	
	return array('success'=>true) ;
}




function specDbsTracy_trspt_printDoc( $post_data ) {
	global $_opDB ;
	
	$app_root = $GLOBALS['app_root'] ;
	$resources_root=$app_root.'/resources' ;
	$templates_dir=$resources_root.'/server/templates' ;
	$_IMG['DBS_logo_bw'] = file_get_contents($templates_dir.'/'.'DBS_logo_bw.png') ;
	
	
	$title = ( $step_isFinal ? 'MISE EN STOCK' : 'LIVRAISON NAVETTE SAFRAN' );
		
		$buffer.= '<DIV style="page-break-after:always"></DIV>' ;
		$buffer.= "<table border='0' cellspacing='1' cellpadding='1'>" ;
		$buffer.= "<tr><td width='5'/><td width='200'>" ;
			$buffer.= '<div align="center">' ;
			$buffer.= '<img src="data:image/jpeg;base64,'.base64_encode(specDbsTracy_lib_getBarcodePng($adr,75)).'" /><br>' ;
			$buffer.= $adr.'<br>' ;
			$buffer.= '</div>' ;
		$buffer.= "</td><td valign='middle' width='400'>" ;
			$buffer.= "<table cellspacing='0' cellpadding='1'>";
			$buffer.= "<tr><td><span class=\"mybig\">{$title}</span></td></tr>" ;
			//{$data_commande['date_exp']}
			$buffer.= "<tr><td><span class=\"verybig\"><b>{$row_transfer['field_TRANSFER_TXT']}</b></span>&nbsp;&nbsp;<br>&nbsp;&nbsp;<big>printed on <b>".date('d/m/Y H:i')."</b></big></td></tr>" ;
			$buffer.= "<tr><td><span class=\"verybig\">BIN / CONTAINER : <b>{$adr_str}</b></td></tr>" ;
			$buffer.= "</table>";
		$buffer.= "</td><td valign='middle' align='center' width='120'>" ;
			$buffer.= "<img src=\"data:image/jpeg;base64,".base64_encode($_IMG['DBS_logo_bw'])."\" />" ;
		$buffer.= "</td></tr><tr><td height='25'/></tr></table>" ;
				
		$buffer.= "<table class='tabledonnees'>" ;
			$buffer.= '<thead>' ;
				$buffer.= "<tr>";
					$buffer.= "<th>Barcode</th>";
					$buffer.= "<th>Source</th>";
					$buffer.= "<th>PartNumber</th>";
					$buffer.= "<th>Batch</th>";
					$buffer.= "<th>DLC</th>";
					$buffer.= "<th>Qty</th>";
					$buffer.= "<th>SN</th>";
					$buffer.= "<th>Std ?</th>";
					$buffer.= "<th>SPQ</th>";
					$buffer.= "<th>StkType</th>";
				$buffer.= "</tr>" ;
			$buffer.= '</thead>' ;
			foreach( array() as $row_transferLig ) {
				$src_adr = $row_transferLig['src_adr'] ;
				$ttmp = explode('_',$src_adr,2) ;
				$src_adr_str = $ttmp[1] ;
				
				$stk_prod = $row_transferLig['stk_prod'] ;
				$ttmp = explode('_',$stk_prod,2) ;
				$stk_prod_str = $ttmp[1] ;
				
				$query = "SELECT * FROM view_bible_PROD_entry WHERE entry_key='{$stk_prod}'" ;
				$result = $_opDB->query($query) ;
				$arr_prod = $_opDB->fetch_assoc($result) ;
				//print_r($arr_prod) ;
				
				
				$buffer.= "<tr>" ;
					$buffer.= '<td align="center">' ;
						$buffer.= '<img src="data:image/jpeg;base64,'.base64_encode(specDbsLam_lib_getBarcodePng($row_transferLig['transferlig_filerecord_id'],30)).'" /><br>';
						$buffer.= $row_transferLig['transferlig_filerecord_id'].'<br>';
					$buffer.= '</td>' ;
					$buffer.= "<td><span class=\"\">{$src_adr_str}</span></td>" ;
					$buffer.= "<td><span class=\"mybig\">{$stk_prod_str}</span></td>" ;
					
					$class = ($arr_prod['field_SPEC_IS_BATCH'] ? '' : 'croix') ;
					$buffer.= "<td class=\"$class\"><span>{$row_transferLig['stk_batch']}</span></td>" ;
					
					$datelc = ($row_transferLig['stk_datelc'] != '0000-00-00 00:00:00' ? substr($row_transferLig['stk_datelc'],0,10) : '') ;
					$class = ($arr_prod['field_SPEC_IS_DLC'] ? '' : 'croix') ;
					$buffer.= "<td class=\"$class\"><span>{$datelc}</span></td>" ;
					
					$buffer.= "<td align='right'><span class=\"mybig\"><b>".(float)$row_transferLig['mvt_qty']."</b></span></td>" ;
					
					$class = ($arr_prod['field_SPEC_IS_SN'] ? '' : 'croix') ;
					$buffer.= "<td class=\"$class\"><span class=\"\">{$row_transferLig['stk_sn']}</span></td>" ;
					
					$buffer.= "<td><span class=\"\"><b>".(json_decode($arr_prod['field_ATR_STD'],true)==array('STD')?'Y':'N')."</b></span></td>" ;
					
					$buffer.= "<td><span class=\"\"><i>".($arr_prod['field_UC_QTY']>0 ? (float)$arr_prod['field_UC_QTY']:'')."</i></span></td>" ;
					
					$buffer.= "<td><span class=\"\"><span class=\"mybig\">{$row_transferLig['ATR_STKTYPE']}</span></td>" ;
				$buffer.= "</tr>" ;
			}
		$buffer.= "</table>" ;
		

	
	
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



?>
