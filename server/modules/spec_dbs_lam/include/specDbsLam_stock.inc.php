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
	if( $post_data['filter_entryKey'] ) {
		$query.= " AND entry_key='{$post_data['filter_entryKey']}'" ;
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
		
		$row['adr_id'] = $arr['ADR_entry_key'] ;
		
		$row['container_is_on'] = $arr['ADR_field_CONT_IS_ON'] ;
		$row['container_types'] = json_decode($arr['ADR_field_CONT_TYPES'],true) ;
		$row['container_is_picking'] = $arr['ADR_field_CONT_IS_PICKING'] ;
		
		$row['pos_zone'] = substr($arr['ADR_treenode_key'],0,1) ;
		$row['pos_row'] = $arr['ADR_treenode_key'] ;
		$row['pos_bay'] = $arr['ADR_field_POS_BAY'] ;
		$row['pos_level'] = $arr['ADR_field_POS_LEVEL'] ;
		$row['pos_bin'] = $arr['ADR_field_POS_BIN'] ;
		
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
				$status = FALSE ;
			}
		}
		if( !$arr['ADR_field_STATUS_IS_ACTIVE'] ) {
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
		$row['inv_prod'] = $arr['STOCK_field_PROD_ID'] ;
		$row['inv_batch'] = $arr['STOCK_field_SPEC_BATCH'] ;
		$row['inv_qty_prein'] = ( $arr['STOCK_field_PROD_ID'] ? $arr['STOCK_field_QTY_PREIN'] : null ) ;
		$row['inv_qty'] = ( $arr['STOCK_field_PROD_ID'] ? $arr['STOCK_field_QTY_AVAIL'] : null ) ;
		$row['inv_qty_out'] = ( $arr['STOCK_field_PROD_ID'] ? $arr['STOCK_field_QTY_OUT'] : null ) ;
		$row['inv_sn'] = $arr['STOCK_field_SPEC_SN'] ;
		$row['inv_container'] = $arr['STOCK_field_CONTAINER_REF'] ;
		
		$row['status'] = $status ;
		$row['prealloc'] = $arr['ADR_field_STATUS_IS_PREALLOC'] ;
		
		$tab_DATA[] = $row ;
	}
	return array('success'=>true, 'data'=>$tab_DATA) ;
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

?>
