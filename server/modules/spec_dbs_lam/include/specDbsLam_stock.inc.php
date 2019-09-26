<?php

function specDbsLam_stock_getGrid($post_data) {
	global $_opDB ;
	
	$ttmp = specDbsLam_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	
	$tab_DATA = array() ;
	
	// ******************** SQL selection ******************
	$selects = array() ;
	foreach( array('adr'=>'view_bible_ADR_entry','stock'=>'view_file_STOCK') as $prefix=>$table ) {
		$query = "SHOW COLUMNS FROM {$table}" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$field = $arr[0] ;
			$mkey = $prefix.'.'.$field ;
			
			$selects[] = $prefix.'.'.$field.' AS '.strtoupper($prefix).'_'.$field ;
		}
	}
	$selects = implode(',',$selects) ;
	
	$query = "SELECT {$selects} FROM view_bible_ADR_entry adr
				LEFT OUTER JOIN view_file_STOCK stock ON stock.field_ADR_ID = adr.entry_key
				WHERE 1" ;
	if( $post_data['filter_stkFilerecordId'] ) {
		if( is_array($arr=json_decode($post_data['filter_stkFilerecordId'],true)) ) {
			$list = $_opDB->makeSQLlist($arr) ;
			$query.= " AND stock.filerecord_id IN {$list}" ;
		} else {
			$query.= " AND stock.filerecord_id='{$post_data['filter_stkFilerecordId']}'" ;
		}
	}
	if( $post_data['filter_entryKey'] ) {
		if( is_array($arr=json_decode($post_data['filter_entryKey'],true)) ) {
			$list = $_opDB->makeSQLlist($arr) ;
			$query.= " AND entry_key IN {$list}" ;
		} else {
			$query.= " AND entry_key='{$post_data['filter_entryKey']}'" ;
		}
	} elseif( $post_data['filter_treenodeKey'] 
			&& ($arr_treenodes = paracrm_data_getBibleTreeBranch( 'ADR', $post_data['filter_treenodeKey'] )) ) {
		$query.= " AND treenode_key IN ".$_opDB->makeSQLlist($arr_treenodes) ;
	}
	if( $post_data['whse_code'] ) {
		if( $arr_treenodes = paracrm_data_getBibleTreeBranch( 'ADR', $post_data['whse_code'] ) ) {
			$query.= " AND treenode_key IN ".$_opDB->makeSQLlist($arr_treenodes) ;
		} else {
			$query.= " AND 0" ;
		}
	}
	$query.= " ORDER BY adr.entry_key LIMIT 10000" ;
	$result = $_opDB->query($query) ;
	// *************************************************************
	
	
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$row = array() ;
		
		if( $arr['STOCK_filerecord_id'] ) {
			$row['id'] = $arr['STOCK_filerecord_id'] ;
			$row['stk_filerecord_id'] = $arr['STOCK_filerecord_id'] ;
		} else {
			$row['id'] = $arr['ADR_entry_key'] ;
		}
		
		$row['ADR_entry_key'] = $arr['ADR_entry_key'] ;
		$row['ADR_treenode_key'] = $arr['ADR_treenode_key'] ;
		
		$row['adr_id'] = $arr['ADR_entry_key'] ;
		
		$row['container_is_on'] = $arr['ADR_field_CONT_IS_ON'] ;
		$row['container_types'] = json_decode($arr['ADR_field_CONT_TYPES'],true) ;
		$row['container_is_picking'] = $arr['ADR_field_CONT_IS_PICKING'] ;
		
		$row['pos_zone'] = substr($arr['ADR_treenode_key'],0,1) ;
		$row['pos_row'] = $arr['ADR_treenode_key'] ;
		$row['pos_bay'] = $arr['ADR_field_POS_BAY'] ;
		$row['pos_level'] = $arr['ADR_field_POS_LEVEL'] ;
		$row['pos_bin'] = $arr['ADR_field_POS_BIN'] ;
		
		$row['status_is_active'] = !!$arr['ADR_field_STATUS_IS_ACTIVE'] ;
		
		$status = TRUE ;
		foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
			if( !$stockAttribute_obj['ADR_fieldcode'] ) {
				continue ;
			}
			$mkey = 'ADR_'.$stockAttribute_obj['mkey'] ;
			$ADR_fieldcode = 'ADR_'.$stockAttribute_obj['ADR_fieldcode'] ;
			
			$ttmp = ($arr[$ADR_fieldcode] ? json_decode($arr[$ADR_fieldcode]) : array()) ;
			$row[$mkey] = (string)reset($ttmp) ;
			if( !$row[$mkey] ) {
				//$status = FALSE ;
			}
		}
		if( !$arr['ADR_field_STATUS_IS_ACTIVE'] && !$arr['STOCK_filerecord_id'] ) {
			$status = FALSE ;
		}
		foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
			if( !$stockAttribute_obj['STOCK_fieldcode'] ) {
				continue ;
			}
			$mkey = 'STOCK_'.$stockAttribute_obj['mkey'] ;
			$STOCK_fieldcode = 'STOCK_'.$stockAttribute_obj['STOCK_fieldcode'] ;
			$row[$mkey] = $arr[$STOCK_fieldcode] ;
		}
		
		$row['inv_id'] = $arr['STOCK_filerecord_id'] ;
		$row['inv_soc'] = $arr['STOCK_field_SOC_CODE'] ;
		$row['inv_prod'] = $arr['STOCK_field_PROD_ID'] ;
		$row['inv_batch'] = $arr['STOCK_field_SPEC_BATCH'] ;
		$row['inv_qty_prein'] = (float)( $arr['STOCK_field_PROD_ID'] ? $arr['STOCK_field_QTY_PREIN'] : null ) ;
		$row['inv_qty'] = (float)( $arr['STOCK_field_PROD_ID'] ? $arr['STOCK_field_QTY_AVAIL'] : null ) ;
		$row['inv_qty_out'] = (float)( $arr['STOCK_field_PROD_ID'] ? $arr['STOCK_field_QTY_OUT'] : null ) ;
		$row['inv_sn'] = $arr['STOCK_field_SPEC_SN'] ;
		$row['inv_container'] = $arr['STOCK_field_CONTAINER_REF'] ;
		
		if( $arr['STOCK_field_CONTAINER_REF'] ) {
			$row['inv_container_ref'] = $arr['STOCK_field_CONTAINER_REF'] ;
			$row['inv_container_type'] = $arr['STOCK_field_CONTAINER_TYPE'] ;
		}
		
		$row['status'] = $status ;
		
		$tab_DATA[] = $row ;
	}
	return array('success'=>true, 'data'=>$tab_DATA) ;
}


function specDbsLam_stock_submitAdrAction( $post_data ) {
	global $_opDB ;
	
	$ttmp = specDbsLam_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	
	$p_formData = json_decode($post_data['form_data'],true) ;
	
	$arr_update = array() ;
	if( $p_formData['status_toggle'] && (($val=trim($p_formData['status_is_active']))!='') ) {
		$arr_update['field_STATUS_IS_ACTIVE'] = (!!((int)$val) ? 1 : 0) ;
	}
	if( $p_formData['container_toggle'] ) {
		$arr_update['field_CONT_IS_ON'] = ($p_formData['container_is_on'] ? 1 : 0) ;
		if( $val=trim($p_formData['container_type']) ) {
			$arr_update['field_CONT_TYPES'] = json_encode(array($val)) ;
		}
		if( ($val=trim($p_formData['container_is_picking']))!='' ) {
			$arr_update['field_CONT_IS_PICKING'] = (!!((int)$val) ? 1 : 0) ;
		}
	}
	if( $p_formData['atr_toggle'] ) {
		foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
			if( !$stockAttribute_obj['ADR_fieldcode'] ) {
				continue ;
			}
			$mkey = $stockAttribute_obj['mkey'] ;
			$mkey_toggle = $mkey.'_toggle' ;
			$mkey_value = $mkey.'_value' ;
			if( $p_formData[$mkey_toggle] ) {
				$arr_update[$stockAttribute_obj['ADR_fieldcode']] = NULL ;
				if( $val = $p_formData[$mkey_value] ) {
					$arr_update[$stockAttribute_obj['ADR_fieldcode']] = json_encode(array($val)) ;
				}
			}
		}
	}
	if( count($arr_update)==0 ) {
		return array('success'=>true) ;
	}
	
	foreach( $p_formData['adrs_list'] as $adr ) {
		$entry_key = $adr ;
		$arr_update['entry_key'] = $entry_key ;
		$arr_update['field_ADR_ID'] = $entry_key ;
		paracrm_lib_data_updateRecord_bibleEntry( 'ADR', $entry_key, $arr_update );
	}
	
	return array('success'=>true, 'debug'=>$arr_update, 'form_data'=>$p_actionCode, 'form_data'=>$p_formData) ;
}


function specDbsLam_stock_submitInvAction( $post_data ) {
	global $_opDB ;
	$p_actionCode = $post_data['form_action'] ;
	$p_formData = json_decode($post_data['form_data'],true) ;
	
	switch( $p_actionCode ) {
		case 'adjust_qty' :
			$json = specDbsLam_stock_getGrid( array('filter_stkFilerecordId'=>$p_formData['stk_filerecord_id']) ) ;
			$stk_row = reset($json['data']) ;
			if( count($json['data']) != 1 || $stk_row['stk_filerecord_id']!=$p_formData['stk_filerecord_id'] ) {
				return array('success'=>false) ;
			}
			$adjust_qty = $p_formData['adjust_qty'] ;
			if( $adjust_qty == 0 ) {
				return array('success'=>false, 'error'=>'Null quantity') ;
			}
			if( $stk_row['inv_qty'] + $adjust_qty != $p_formData['target_qty'] ) {
				return array('success'=>false, 'error'=>'Qty mismatch. Retry.') ;
			}
			sleep(1) ;
			if( !trim($p_formData['adjust_txt']) ) {
				return array('success'=>false, 'error'=>'Please write description') ;
			}
			$res = specDbsLam_lib_procMvt_rawMvt($stk_row['stk_filerecord_id'], $adjust_qty, $p_formData['adjust_txt']);
			return array('success'=>!!$res) ;
			break ;
		
		default :
			return array('success'=>false, 'form_data'=>$p_actionCode, 'form_data'=>$p_formData) ;
	}
	
	return array('success'=>true, 'debug'=>$p_formData) ;
}


function specDbsLam_stock_getLogs($post_data) {
	global $_opDB ;
	
	// Load cfg attributes
	$ttmp = specDbsLam_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	
	// Warehouses
	$arr_stockWhses = array() ;
	foreach( $json_cfg['cfg_whse'] as $whse_row ) {
		if( !$whse_row['is_stock'] ) {
			continue ;
		}
		$arr_stockWhses[] = $whse_row['whse_code'] ;
	}
	
	
	// **************** SQL selection *****************
	$ignores = array() ;
	$selects = array() ;
	foreach( array('tl'=>'view_file_TRANSFER_LIG','mvt'=>'view_file_MVT') as $prefix=>$table ) {
		$query = "SHOW COLUMNS FROM {$table}" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$field = $arr[0] ;
			if( !(strpos($field,'field_')===0) ) {
				continue ;
			}
			$mkey = $prefix.'.'.$field ;
			if( in_array($mkey,$ignores) ) {
				continue ;
			}
			
			$selects[] = $prefix.'.'.$field ;
		}
	}
	$selects = implode(',',$selects) ;
	
	$query = "SELECT mvt.filerecord_id as mvt_filerecord_id, t.filerecord_id as transfer_filerecord_id, t.field_TRANSFER_TXT as transfer_txt
			, {$selects}
			FROM view_file_MVT mvt
			LEFT OUTER JOIN view_file_TRANSFER_LIG tl ON tl.field_FILE_MVT_ID=mvt.filerecord_id
			LEFT OUTER JOIN view_file_TRANSFER t ON t.filerecord_id=tl.filerecord_parent_id
			WHERE 1" ;
	switch( $post_data['log_filter_property'] ) {
		case 'container_ref' :
			$query.= " AND (field_CONTAINER_REF='{$post_data['log_filter_value']}' OR field_CONTAINER_DISPLAY='{$post_data['log_filter_value']}')" ;
			break ;
		case 'prod_id' :
			$query.= " AND (field_PROD_ID='{$post_data['log_filter_value']}')" ;
			break ;
		case 'adrç' :
			$query.= " AND (field_SRC_ADR_ID='{$post_data['log_filter_value']}' OR field_DST_ADR_ID='{$post_data['log_filter_value']}')" ;
			break ;
		default :
			break ;
	}
	$query.= " ORDER BY mvt.filerecord_id DESC" ;
	
	
	$result = $_opDB->query($query) ;
	// *********************************************
	
	$TAB = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		foreach( array(1,-1) as $coef ) {
			$row = array(
				'mvt_filerecord_id' => $arr['mvt_filerecord_id'],
				
				'soc_code' => $arr['field_SOC_CODE'],
				'container_type' => $arr['field_CONTAINER_TYPE'],
				'container_ref' => $arr['field_CONTAINER_REF'],
				'container_ref_display' => $arr['field_CONTAINER_DISPLAY'],
				'stk_prod' => $arr['field_PROD_ID'],
				'stk_batch' => $arr['field_SPEC_BATCH'],
				'stk_datelc' => $arr['field_SPEC_DATELC'],
				'stk_sn' => $arr['field_SPEC_SN'],
				'mvt_qty' => ( (float)$arr['field_QTY_MVT'] * $coef ),
				
				'commit_is_ok' => !!$arr['field_COMMIT_IS_OK'],
				'commit_date' => $arr['field_COMMIT_DATE'],
				
				'transfer_txt' => ($arr['transfer_txt'] ? $arr['transfer_txt'] : $arr['field_MVTDIRECT_TXT'])
			);
			foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
				if( !$stockAttribute_obj['STOCK_fieldcode'] ) {
					continue ;
				}
				$mkey = $stockAttribute_obj['mkey'] ;
				$STOCK_fieldcode = $stockAttribute_obj['STOCK_fieldcode'] ;
				$row[$mkey] = $arr[$STOCK_fieldcode] ;
			}
			if( $coef > 0 ) {
				if( !in_array($arr['field_DST_WHSE'],$arr_stockWhses) ) {
					continue ;
				}
				if( $post_data['log_filter_property']=='adr_id' && $arr['field_DST_ADR_ID']!=$post_data['log_filter_value'] ) {
					continue ;
				}
				$row+= array(
					'stk_filerecord_id' => $arr['field_DST_FILE_STOCK_ID'],
					'adr_whse' => $arr['field_DST_WHSE'],
					'adr_id' => $arr['field_DST_ADR_ID']
				) ;
			}
			if( $coef < 0 ) {
				if( !in_array($arr['field_SRC_WHSE'],$arr_stockWhses) ) {
					continue ;
				}
				if( $post_data['log_filter_property']=='adr_id' && $arr['field_SRC_ADR_ID']!=$post_data['log_filter_value'] ) {
					continue ;
				}
				$row+= array(
					'stk_filerecord_id' => $arr['field_SRC_FILE_STOCK_ID'],
					'adr_whse' => $arr['field_SRC_WHSE'],
					'adr_id' => $arr['field_SRC_ADR_ID']
				) ;
			}
			
			if( $arr['field_PICK_TRSFRCDENEED_ID'] && ($coef==-1) ) {
				$query_link = "SELECT mvt.field_QTY_MVT, mvt.field_SRC_WHSE, mvt.field_SRC_ADR_ID, c.field_CDE_NR
						FROM view_file_MVT mvt
						JOIN view_file_TRANSFER_LIG tl ON tl.field_FILE_MVT_ID=mvt.filerecord_id
						JOIN view_file_TRANSFER_CDE_LINK tcl ON tcl.filerecord_id=tl.field_PACK_TRSFRCDELINK_ID
						JOIN view_file_CDE_LIG cl ON cl.filerecord_id=tcl.field_FILE_CDELIG_ID
						JOIN view_file_CDE c ON c.filerecord_id=cl.filerecord_parent_id
						WHERE tcl.field_FILE_TRSFRCDENEED_ID='{$arr['field_PICK_TRSFRCDENEED_ID']}'" ;
				$res_link = $_opDB->query($query_link) ;
				
				$links = array() ;
				$links_qty = 0 ;
				while( ($arr_link = $_opDB->fetch_assoc($res_link)) != FALSE ) {
					$links[] = array(
						'link' => true,
						'transfer_txt' => $arr_link['field_CDE_NR'],
						'adr_whse' => $arr_link['field_SRC_WHSE'],
						'adr_id' => $arr_link['field_SRC_ADR_ID'],
						'mvt_qty' => ( (float)$arr_link['field_QTY_MVT'] * $coef )
					);
					$links_qty += (float)$arr_link['field_QTY_MVT'] ;
				}
				if( abs($links_qty)>abs($row['mvt_qty']) ) {
					foreach( $links as &$link ) {
						$link['link_partial'] = true ;
					}
					unset($link) ;
				}
				$row['links'] = $links ;
			}
			
			$TAB[] = $row ;
		}
	}
	
	return array('success'=>true, 'data'=>$TAB) ;
}


function specDbsLam_stock_getStkMvts( $post_data ) {
	global $_opDB ;
	
	$p_filerecordId = $post_data['stk_filerecord_id'] ;
	
	// **************** SQL selection *****************
	$ignores = array('tl.field_STEP_CODE') ;
	$selects = array() ;
	foreach( array('t'=>'view_file_TRANSFER','tl'=>'view_file_TRANSFER_LIG','mvt'=>'view_file_MVT','mvtstep'=>'view_file_MVT_STEP') as $prefix=>$table ) {
		$query = "SHOW COLUMNS FROM {$table}" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$field = $arr[0] ;
			if( !(strpos($field,'field_')===0) ) {
				continue ;
			}
			$mkey = $prefix.'.'.$field ;
			if( in_array($mkey,$ignores) ) {
				continue ;
			}
			
			$selects[] = $prefix.'.'.$field ;
		}
	}
	$selects = implode(',',$selects) ;
	
	$TAB = array() ;
	$stk_filerecord_id = $p_filerecordId ;
	while( TRUE ) {
		$query = "SELECT tl.filerecord_id as transferlig_filerecord_id, tl.filerecord_parent_id as transfer_filerecord_id
		, mvt.filerecord_id as mvt_filerecord_id
		, mvtstep.filerecord_id as mvtstep_filerecord_id
		, {$selects}
		FROM view_file_MVT_STEP mvtstep
		INNER JOIN view_file_MVT mvt ON mvt.filerecord_id = mvtstep.filerecord_parent_id
		LEFT OUTER JOIN view_file_TRANSFER_LIG tl ON tl.field_FILE_MVT_ID = mvt.filerecord_id
		LEFT OUTER JOIN view_file_TRANSFER t ON t.filerecord_id = tl.filerecord_parent_id
		WHERE mvtstep.field_COMMIT_FILE_STOCK_ID='{$stk_filerecord_id}'" ;
		
		$result = $_opDB->query($query) ;
		if( $_opDB->num_rows($result) != 1 ) {
			break ;
		}
		
		$arr = $_opDB->fetch_assoc($result) ;
		$TAB[] = array(
			'transfer_txt' => $arr['field_TRANSFER_TXT'],
			'step_code' => $arr['field_STEP_CODE'],
			'file_stock_id' => $arr['field_FILE_STOCK_ID'],
			'src_adr_display' =>  $arr['field_SRC_ADR_DISPLAY'],
			'dest_adr_display' =>  $arr['field_DEST_ADR_DISPLAY'],
			'status_is_ok' =>  $arr['field_STATUS_IS_OK'],
			'commit_date' => $arr['field_COMMIT_DATE'],
			'commit_user' => $arr['field_COMMIT_USER'],
			'commit_file_stock_id' => $arr['field_COMMIT_FILE_STOCK_ID']
		);
		
		$stk_filerecord_id = $arr['field_FILE_STOCK_ID'] ;
		continue ;
	}
	
	return array('success'=>true, 'data'=>$TAB) ;
}

function specDbsLam_stock_printEtiq($post_data) {
	global $_opDB ;
	
	$app_root = $GLOBALS['app_root'] ;
	$resources_root=$app_root.'/resources' ;
	$templates_dir=$resources_root.'/server/templates' ;
	$_IMG['DBS_logo_bw'] = file_get_contents($templates_dir.'/'.'DBS_logo_bw.png') ;
	
	// Load cfg attributes
	$ttmp = specDbsLam_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	
	$p_stock_filerecordIds = json_decode($post_data['stock_filerecordIds'],true) ;
	if( !$p_stock_filerecordIds ) {
		return array('success'=>false) ;
	}
	
	$is_first = TRUE ;
	foreach( $p_stock_filerecordIds as $stk_filerecord_id ) {
		$query = "SELECT * FROM view_file_STOCK WHERE filerecord_id='{$stk_filerecord_id}'" ;
		$result = $_opDB->query($query) ;
		$arr_stk = $_opDB->fetch_assoc($result) ;
		if( !$arr_stk ) {
			continue ;
		}
		
		$adr_txt = $adr ;
		if( $arr_stk['field_CONTAINER_REF'] ) {
			$adr_txt = $arr_stk['field_CONTAINER_REF'] ;
		}
		
		if( $is_first ) {
			$is_first = FALSE ;
		} else {
			$buffer.= '<DIV style="page-break-after:always"></DIV>' ;
		}
		$buffer.= "<table border='0' cellspacing='1' cellpadding='1'>" ;
		$buffer.= "<tr><td width='5'/><td width='200'>" ;
			$buffer.= '<div align="center">' ;
			$buffer.= '<img src="data:image/jpeg;base64,'.base64_encode(specDbsLam_lib_getBarcodePng($adr_txt,75)).'" /><br>' ;
			$buffer.= $adr_txt.'<br>' ;
			$buffer.= '</div>' ;
		$buffer.= "</td><td valign='middle' width='400'>" ;
			$buffer.= "<table cellspacing='0' cellpadding='1'>";
			$buffer.= "<tr><td><span class=\"mybig\">STOCK LABEL</span></td></tr>" ;
			//{$data_commande['date_exp']}
			$buffer.= "<tr><td><span class=\"verybig\"></span>&nbsp;&nbsp;<span class=\"huge\"><b>{$adr_txt}</b></span></td></tr>" ;
			$buffer.= "</table>";
		$buffer.= "</td><td valign='middle' align='center' width='120'>" ;
			//$buffer.= "<img src=\"data:image/jpeg;base64,".base64_encode($_IMG['DBS_logo_bw'])."\" />" ;
		$buffer.= "</td></tr><tr><td height='25'/></tr></table>" ;
		
		
		
		$buffer.= "" ;
		
		$buffer.= "<table border='0' cellspacing='1' cellpadding='10'><tr>" ;
			
		$buffer.= "<td align='left' valign='top' width='50%'>" ;
			
			$buffer.= "<table class='tabledonnees'>" ;
			
				$ttmp = explode('_',$arr_stk['field_PROD_ID'],2) ;
				$soc_code = $ttmp[0] ;
				$prod_txt = $ttmp[1] ;
				
				$query = "SELECT * FROM view_bible_PROD_entry WHERE entry_key='{$arr_stk['field_PROD_ID']}'" ;
				$result = $_opDB->query($query) ;
				$arr_prod = $_opDB->fetch_assoc($result) ;
				
				$buffer.= "<tr>" ;
					$buffer.= "<td width='30%'><span class=\"mybig\">BusinessUnit</span></td>" ;
					$buffer.= '<td align="center" class="mybig">' ;
						$buffer.= '<b>'.$soc_code.'</b><br>';
					$buffer.= '</td>' ;
				$buffer.= "</tr>" ;
			
				$buffer.= "<tr>" ;
					$buffer.= "<td width='30%'><span class=\"mybig\">PartNumber</span></td>" ;
					$buffer.= '<td align="center">' ;
						$buffer.= '<img src="data:image/jpeg;base64,'.base64_encode(specDbsLam_lib_getBarcodePng($prod_txt,50)).'" /><br>';
						$buffer.= "<span class=\"mybig\">".$prod_txt.'<br>';
					$buffer.= '</td>' ;
				$buffer.= "</tr>" ;
			
				$buffer.= "<tr>" ;
					$buffer.= "<td width='30%'><span class=\"mybig\">Quantity</span></td>" ;
					$buffer.= '<td align="center" class="mybig">' ;
						$buffer.= '<b>'.(float)($arr_stk['field_QTY_IN']+$arr_stk['field_QTY_AVAIL']+$arr_stk['field_QTY_OUT']).'</b><br>';
					$buffer.= '</td>' ;
				$buffer.= "</tr>" ;
			
				$buffer.= "<tr>" ;
					$buffer.= "<td width='30%'><span class=\"mybig\">Batch</span></td>" ;
					if( $arr_prod['field_SPEC_IS_BATCH'] ) {
						$buffer.= '<td align="center">' ;
						$buffer.= '<img src="data:image/jpeg;base64,'.base64_encode(specDbsLam_lib_getBarcodePng($arr_stk['field_SPEC_BATCH'],50)).'" /><br>';
						$buffer.= $arr_stk['field_SPEC_BATCH'].'<br>';
						$buffer.= '</td>' ;
					} else {
						$buffer.= '<td class="croix">&nbsp;</td>' ;
					}
				$buffer.= "</tr>" ;
				
				if( $arr_prod['field_SPEC_IS_DLC'] ) {
					$buffer.= "<tr>" ;
						$buffer.= "<td width='30%'><span class=\"mybig\">DLC</span></td>" ;
						if( TRUE ) {
							$buffer.= '<td align="center">' ;
							$buffer.= date('d/m/Y',strtotime($arr_stk['field_SPEC_DATELC'])).'<br>';
							$buffer.= '</td>' ;
						}
					$buffer.= "</tr>" ;
				}
			
				$buffer.= "<tr>" ;
					$buffer.= "<td width='30%'><span class=\"mybig\">SerialNo</span></td>" ;
					if( $arr_prod['field_SPEC_IS_SN'] ) {
						$buffer.= '<td align="center">' ;
						$buffer.= '<img src="data:image/jpeg;base64,'.base64_encode(specDbsLam_lib_getBarcodePng($arr_stk['field_SPEC_SN'],50)).'" /><br>';
						$buffer.= $arr_stk['field_SPEC_SN'].'<br>';
						$buffer.= '</td>' ;
					} else {
						$buffer.= '<td class="croix">&nbsp;</td>' ;
					}
				$buffer.= "</tr>" ;
				
				if( $arr_stk['field_ADR_ID'] && $arr_stk['field_CONTAINER_REF'] ) {
					$buffer.= "<tr>" ;
						$buffer.= "<td width='30%'><span class=\"mybig\">Position</span></td>" ;
						if( $arr_stk['field_ADR_ID'] ) {
							$buffer.= '<td align="center">' ;
							$buffer.= '<img src="data:image/jpeg;base64,'.base64_encode(specDbsLam_lib_getBarcodePng($arr_stk['field_ADR_ID'],50)).'" /><br>';
							$buffer.= "<span class=\"mybig\"><b>".$arr_stk['field_ADR_ID'].'</b><br>';
							$buffer.= '</td>' ;
						} else {
							$buffer.= '<td class="croix">&nbsp;</td>' ;
						}
					$buffer.= "</tr>" ;
				}
			
			
			$buffer.= "</table>" ;
		
		$buffer.= "</td>" ;
		
		$buffer.= "<td align='left' valign='top'  width='50%'>" ;
		
			$buffer.= "<table class='tabledonnees'>" ;
				
			foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
				if( $stockAttribute_obj['STOCK_fieldcode'] ) {} else {
					continue ;
				}
				if( !in_array($soc_code, $stockAttribute_obj['socs']) ) {
					continue ;
				}
				$mkey = $stockAttribute_obj['mkey'] ;
				$STOCK_fieldcode = $stockAttribute_obj['STOCK_fieldcode'] ;
				//
				if( in_array($mkey,array('ATR_STKTYPE','ATR_SW')) ) {
					continue ;
				}
				
				$buffer.= "<tr>" ;
					$buffer.= "<td width='30%'><span class=\"mybig\">{$stockAttribute_obj['atr_txt']}</span></td>" ;
					if( TRUE ) {
						$buffer.= '<td align="center">' ;
						$buffer.= '<img src="data:image/jpeg;base64,'.base64_encode(specDbsLam_lib_getBarcodePng($arr_stk[$STOCK_fieldcode],30)).'" /><br>';
						$buffer.= $arr_stk[$STOCK_fieldcode].'<br>';
						$buffer.= '</td>' ;
					}
				$buffer.= "</tr>" ;
			}
			
			$buffer.= "</table>" ;
		
		$buffer.= "</td>";
		
		$buffer.= "</tr></table>" ;
		
	}
	
	
	
	
	
	$app_root = $GLOBALS['app_root'] ;
	$resources_root=$app_root.'/resources' ;
	$templates_dir=$resources_root.'/server/templates' ;
	$inputFileName = $templates_dir.'/'.'DBS_LAM_blank.html' ;
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
function specDbsLam_stock_printEtiqZpl($post_data) {
	global $_opDB ;
	
	$app_root = $GLOBALS['app_root'] ;
	$resources_root=$app_root.'/resources' ;
	$templates_dir=$resources_root.'/server/templates' ;
	$_IMG['DBS_logo_bw'] = file_get_contents($templates_dir.'/'.'DBS_logo_bw.png') ;
	
	// Load cfg attributes
	$ttmp = specDbsLam_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	
	$p_stock_filerecordIds = json_decode($post_data['stock_filerecordIds'],true) ;
	if( !$p_stock_filerecordIds ) {
		return array('success'=>false) ;
	}
	
	$rows = array() ;
	foreach( $p_stock_filerecordIds as $stk_filerecord_id ) {
		$query = "SELECT * FROM view_file_STOCK WHERE filerecord_id='{$stk_filerecord_id}'" ;
		$result = $_opDB->query($query) ;
		$arr_stk = $_opDB->fetch_assoc($result) ;
		if( !$arr_stk ) {
			continue ;
		}
		
		$adr_txt = $adr ;
		if( $arr_stk['field_CONTAINER_REF'] ) {
			$adr_txt = $arr_stk['field_CONTAINER_REF'] ;
		}
		
				$ttmp = explode('_',$arr_stk['field_PROD_ID'],2) ;
				$soc_code = $ttmp[0] ;
				$prod_txt = $ttmp[1] ;
				$query = "SELECT * FROM view_bible_PROD_entry WHERE entry_key='{$arr_stk['field_PROD_ID']}'" ;
				$result = $_opDB->query($query) ;
				$arr_prod = $_opDB->fetch_assoc($result) ;
				
		
		
		
		$zebra_buffer = '' ;
		$zebra_buffer.= '^XA^POI' ;
		$zebra_buffer.= "^BY3,3.0,10^FS" ;
		
		//echo $str ;
		
		$barcode_w = 50 ;
		$barcode_h = 50 ;
		$str = $adr_txt ;
		$zebra_buffer.= "^FO{$barcode_w},{$barcode_h}^BY2^BCN,100,Y,N^FD".$str."^FS";
		
		
		$legend_w = 400 ;
		$legend_h = 55 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^ASN^FD".'STOCK LABEL'."^FS";
		$legend_h+= 50 ;
		$legend_w+= 20 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^AUN^FD".$str."^FS";
		
		
		$h = 250 ;
		
		$zebra_buffer.= "^FO50,250^GB200,100,2^FS";
		$zebra_buffer.= "^FO250,250^GB500,100,2^FS";
		
			$legend_w = 60 ;
			$legend_h = $h+20 ;
			$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^ARN^FD".'BusinessUnit'."^FS";
		
			$legend_w = 290 ;
			$legend_h = $h+20 ;
			$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^ASN^FD".$soc_code."^FS";
		
		$h+= 100 ;
		
		$zebra_buffer.= "^FO50,{$h}^GB200,200,2^FS";
		$zebra_buffer.= "^FO250,{$h}^GB500,200,2^FS";
		
			$legend_w = 60 ;
			$legend_h = $h+20 ;
			$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^ARN^FD".'PartNumber'."^FS";
			
			$legend_w = 290 ;
			$legend_h = $h+30 ;
			$zebra_buffer.= "^FO{$legend_w},{$legend_h}^BY2^BCN,100,Y,N^FD".$prod_txt."^FS";
		
		$h+= 200 ;
		
		$zebra_buffer.= "^FO50,{$h}^GB200,150,2^FS";
		$zebra_buffer.= "^FO250,{$h}^GB500,150,2^FS";
		
			$legend_w = 60 ;
			$legend_h = $h+20 ;
			$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^ARN^FD".'Description'."^FS";
		
		
			$legend_w = 290 ;
			$legend_h = $h+20 ;
			$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^ASN^FD".$arr_prod['entry_key']."^FS";
			$legend_h = $h+70 ;
			$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^ARN^FD".$arr_prod['field_PROD_TXT']."^FS";
		
		$h+= 150 ;
		
		$zebra_buffer.= "^FO50,{$h}^GB200,100,2^FS";
		$zebra_buffer.= "^FO250,{$h}^GB500,100,2^FS";
		
			$legend_w = 60 ;
			$legend_h = $h+20 ;
			$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^ARN^FD".'Quantity'."^FS";
		
			$legend_w = 290 ;
			$legend_h = $h+20 ;
			$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^ATN^FD".(float)($arr_stk['field_QTY_IN']+$arr_stk['field_QTY_AVAIL']+$arr_stk['field_QTY_OUT'])."^FS";
			
		$h+= 100 ;
		
		$zebra_buffer.= "^FO50,{$h}^GB200,200,2^FS";
		$zebra_buffer.= "^FO250,{$h}^GB500,200,2^FS";
		
			$legend_w = 60 ;
			$legend_h = $h+20 ;
			$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^ARN^FD".'Position'."^FS";
		
			$legend_w = 290 ;
			$legend_h = $h+20 ;
			$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^ASN^FD".$arr_stk['field_ADR_ID']."^FS";
			$legend_h = $h+70 ;
			$zebra_buffer.= "^FO{$legend_w},{$legend_h}^BY2^BCN,80,Y,N^FD".$arr_stk['field_ADR_ID']."^FS";
			
		$h+= 200 ;
		
		$zebra_buffer.= '^XZ' ;
		
		
		$rows[] = array(
			'zpl_is_on' => true,
			'zpl_binary' => $zebra_buffer
		);
	}
	
	
	return array('success'=>true, 'data'=>$rows ) ;
}

?>
