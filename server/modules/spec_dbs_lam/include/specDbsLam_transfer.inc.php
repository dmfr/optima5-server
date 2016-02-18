<?php

function specDbsLam_transfer_getTransfer($post_data) {
	global $_opDB ;
	
	$TAB = array() ;
	
	$query = "SELECT * FROM view_file_TRANSFER" ;
	if( $post_data['filter_transferFilerecordId'] ) {
		$query.= " WHERE filerecord_id='{$post_data['filter_transferFilerecordId']}'" ;
	} else {
		$query.= " ORDER BY filerecord_id DESC" ;
	}
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$filerecord_id = $arr['filerecord_id'] ;
		$TAB[$filerecord_id] = array(
			'transfer_filerecord_id' => $arr['filerecord_id'],
			'transfer_txt' => $arr['field_TRANSFER_TXT'],
			'flow_code' => $arr['field_FLOW_CODE'],
			'whse_src' => $arr['field_WHSE_SRC'],
			'whse_dest' => $arr['field_WHSE_DEST'],
			'status_is_on' => $arr['field_STATUS_IS_ON'],
			'status_is_ok' => $arr['field_STATUS_IS_OK'],
			'ligs' => array()
		);
		if( $post_data['filter_transferFilerecordId'] ) {
			$ttmp = specDbsLam_transfer_getTransferLig($post_data) ;
			$TAB[$filerecord_id]['ligs'] = $ttmp['data'] ;
		}
	}
	
	return array('success'=>true, 'data'=>array_values($TAB)) ;
}
function specDbsLam_transfer_getTransferLig($post_data) {
	// jointure : voir specDbsPeople_Real_lib_getActivePeople
	
	global $_opDB ;
	
	// Load cfg attributes
	$ttmp = specDbsLam_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	
	
	// **************** SQL selection *****************
	$ignores = array('tl.field_STEP_CODE') ;
	$selects = array() ;
	foreach( array('tl'=>'view_file_TRANSFER_LIG','mvt'=>'view_file_MVT','mvtstep'=>'view_file_MVT_STEP') as $prefix=>$table ) {
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
	
	$query = "select a.*
		, a.field_SRC_ADR_ID as src_adr_entry, sadr.treenode_key as src_adr_treenode
		, a.field_DEST_ADR_ID as dest_adr_entry, dadr.treenode_key as dest_adr_treenode
		FROM (
		SELECT tl.filerecord_id as transferlig_filerecord_id, tl.filerecord_parent_id as transfer_filerecord_id
		, mvt.filerecord_id as mvt_filerecord_id
		, mvtstep.filerecord_id as mvtstep_filerecord_id
		, {$selects}
		FROM view_file_TRANSFER_LIG tl
		INNER JOIN view_file_MVT mvt ON mvt.filerecord_id = tl.field_FILE_MVT_ID
		INNER JOIN view_file_MVT_STEP mvtstep ON mvtstep.filerecord_parent_id = mvt.filerecord_id
		) a
		LEFT OUTER JOIN view_bible_ADR_entry sadr ON sadr.entry_key = a.field_SRC_ADR_ID
		LEFT OUTER JOIN view_bible_ADR_entry dadr ON dadr.entry_key = a.field_DEST_ADR_ID" ;
	if( $post_data['filter_transferFilerecordId'] ) {
		$query.= " WHERE transfer_filerecord_id='{$post_data['filter_transferFilerecordId']}'" ;
	}
	$query.= " ORDER BY a.mvt_filerecord_id DESC, a.field_STEP_CODE ASC" ;
	$result = $_opDB->query($query) ;
	// *********************************************
	
	
	
	$TAB = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$filerecord_id = $arr['transferlig_filerecord_id'] ;
		if( !isset($TAB[$filerecord_id]) ) {
			$row = array(
				'transfer_filerecord_id' => $arr['transfer_filerecord_id'],
				'transferlig_filerecord_id' => $arr['transferlig_filerecord_id'],
				'mvt_filerecord_id' => $arr['mvt_filerecord_id'],
				'stk_prod' => $arr['field_PROD_ID'],
				'stk_batch' => $arr['field_SPEC_BATCH'],
				'stk_datelc' => $arr['field_SPEC_DATELC'],
				'stk_sn' => $arr['field_SPEC_SN'],
				'mvt_qty' => $arr['field_QTY_MVT'],
				'src_adr' => NULL,
				'current_adr' => NULL,
				'current_adr_entryKey' => NULL,
				'current_adr_treenodeKey' => NULL,
				'current_adr_tmp' => NULL,
				'steps' => array(),
				'status_is_reject' => $arr['field_STATUS_IS_REJECT'],
				'reject_arr' => explode(',',$arr['field_REJECT_ARR']),
				'reject_txt' => $arr['field_REJECT_TXT']
			);
			foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
				if( !$stockAttribute_obj['STOCK_fieldcode'] ) {
					continue ;
				}
				$mkey = $stockAttribute_obj['mkey'] ;
				$STOCK_fieldcode = $stockAttribute_obj['STOCK_fieldcode'] ;
				$row[$mkey] = $arr[$STOCK_fieldcode] ;
			}
			$TAB[$filerecord_id] = $row ;
		}
		
		// inscription steps
		$row_step = array(
			'mvtstep_filerecord_id' => $arr['mvtstep_filerecord_id'],
			'step_code' => $arr['field_STEP_CODE'],
			'file_stock_id' => $arr['field_FILE_STOCK_ID'],
			'src_adr_entry' =>  $arr['src_adr_entry'],
			'src_adr_treenode' => $arr['src_adr_treenode'],
			'src_adr_display' =>  $arr['field_SRC_ADR_DISPLAY'],
			'dest_adr_entry' =>  $arr['dest_adr_entry'],
			'dest_adr_treenode' => $arr['dest_adr_treenode'],
			'dest_adr_display' =>  $arr['field_DEST_ADR_DISPLAY'],
			'status_is_ok' =>  $arr['field_STATUS_IS_OK'],
			'commit_date' => $arr['field_COMMIT_DATE'],
			'commit_user' => $arr['field_COMMIT_USER'],
			'commit_file_stock_id' => $arr['field_COMMIT_FILE_STOCK_ID']
		);
		$TAB[$filerecord_id]['steps'][] = $row_step ;
	}
	// post-process
	foreach( $TAB as $transferlig_filerecord_id => &$row_transferlig ) {
		$step_code = NULL ;
		$is_first = TRUE ;
		foreach( $row_transferlig['steps'] as $idx => $row_transferlig_step ) {
			if( $is_first ) {
				$row_transferlig['src_adr'] = $row_transferlig_step['src_adr_display'] ;
				$is_first = FALSE ;
			}
			if( !$row_transferlig_step['status_is_ok'] ) {
				$row_transferlig['step_code'] = $row_transferlig_step['step_code'] ;
				$row_transferlig['current_adr'] = $row_transferlig_step['src_adr_display'] ;
				$row_transferlig['current_adr_entryKey'] = $row_transferlig_step['src_adr_entry'] ;
				$row_transferlig['current_adr_treenodeKey'] = $row_transferlig_step['src_adr_treenode'] ;
				$row_transferlig['current_adr_tmp'] = ($row_transferlig_step['src_adr_display']!=$row_transferlig_step['src_adr_entry']) ; ;
				break ;
			}
			if( $row_transferlig_step['status_is_ok'] && ($idx==count($row_transferlig['steps'])-1) ) {
				$row_transferlig['current_adr'] = $row_transferlig_step['dest_adr_display'] ;
				$row_transferlig['current_adr_entryKey'] = $row_transferlig_step['dest_adr_entry'] ;
				$row_transferlig['current_adr_treenodeKey'] = $row_transferlig_step['dest_adr_treenode'] ;
				$row_transferlig['status_is_ok'] = TRUE ;
			}
		}
	}
	unset($row_transferlig) ;
	
	return array('success'=>true, 'data'=>array_values($TAB)) ;
}







function specDbsLam_transfer_addStock( $post_data ) {
	global $_opDB ;
	
	$transfer_filerecordId = $post_data['transfer_filerecordId'] ;
	$stock_filerecordIds = json_decode($post_data['stock_filerecordIds'],true) ;
	
	//controle $transfer_filerecordId ?
	$query = "SELECT * FROM view_file_TRANSFER WHERE filerecord_id='{$transfer_filerecordId}'" ;
	$result = $_opDB->query($query) ;
	$row_transfer = $_opDB->fetch_assoc($result) ;
	if( $row_transfer['field_FLOW_CODE'] ) {
		$ttmp = specDbsLam_cfg_getMvtflow() ;
		$cfg_mvtflow = $ttmp['data'] ;
		foreach( $cfg_mvtflow as $row_mvtflow ) {
			if( $row_mvtflow['flow_code'] == $row_transfer['field_FLOW_CODE'] ) {
				$row_mvtflowstep = reset($row_mvtflow['steps']) ;
				$init_mvtflowstep = $row_mvtflowstep['step_code'] ;
			}
		}
	}
	
	$ids = array() ;
	foreach( $stock_filerecordIds as $stock_filerecordId ) {
		$mvt_filerecordId = specDbsLam_lib_procMvt_addStock( $stock_filerecordId, 0, $init_mvtflowstep ) ;
		if( !$mvt_filerecordId ){
			continue ;
		}
		$query = "SELECT * FROM view_file_MVT WHERE filerecord_id='{$mvt_filerecordId}'" ;
		$result = $_opDB->query($query) ;
		$row_mvt = $_opDB->fetch_assoc($result) ;
		
		$transfer_row = array(
			'field_STEP_CODE' => $init_mvtflowstep,
			'field_FILE_MVT_ID' => $mvt_filerecordId
		);
		$ids[] = paracrm_lib_data_insertRecord_file('TRANSFER_LIG',$transfer_filerecordId,$transfer_row) ;
	}
	
	
	return array('success'=>true, 'ids'=>$ids) ;
}
function specDbsLam_transfer_removeStock( $post_data ) {
	global $_opDB ;
	
	$transferLig_filerecordIds = json_decode($post_data['transferLig_filerecordIds'],true) ;
	
	//controle $transfer_filerecordId ?
	
	
	foreach( $transferLig_filerecordIds as $transferLig_filerecordId ) {
		// mvt ID ?
		$query = "SELECT field_FILE_MVT_ID FROM view_file_TRANSFER_LIG WHERE filerecord_id='{$transferLig_filerecordId}'" ;
		$mvt_filerecordId = $_opDB->query_uniqueValue($query) ;
		if( !$mvt_filerecordId ) {
			continue ;
		}
		if( specDbsLam_lib_procMvt_delMvt($mvt_filerecordId) ) {
			paracrm_lib_data_deleteRecord_file( 'TRANSFER_LIG' , $transferLig_filerecordId ) ;
		}
	}
	
	
	return array('success'=>true) ;
}







function specDbsLam_transfer_printDoc( $post_data ) {
	global $_opDB ;
	
	$app_root = $GLOBALS['app_root'] ;
	$resources_root=$app_root.'/resources' ;
	$templates_dir=$resources_root.'/server/templates' ;
	$_IMG['DBS_logo_bw'] = file_get_contents($templates_dir.'/'.'DBS_logo_bw.png') ;
	
		if( $post_data['transfer_filerecordId'] ) {
			$transfer_filerecordId = $post_data['transfer_filerecordId'] ;
			$step_isFinal = FALSE ;
		
			$query = "SELECT * FROM view_file_TRANSFER WHERE filerecord_id='{$transfer_filerecordId}'" ;
			$result = $_opDB->query($query) ;
			$row_transfer = $_opDB->fetch_assoc($result) ;
			
			$query = "UPDATE view_file_TRANSFER set field_STATUS_IS_ON='1' WHERE filerecord_id='{$transfer_filerecordId}'" ;
			$_opDB->query($query) ;
		
			$ttmp = specDbsLam_transfer_getTransferLig( array('filter_transferFilerecordId'=>$transfer_filerecordId) ) ;
			$rows_transferLig = $ttmp['data'] ;
			
			$adr_rowsTransferLig = array() ;
			foreach( $rows_transferLig as $row_transferLig ) {
				$adr = $row_transferLig['src_adr'] ;
				if( !$adr_rowsTransferLig[$adr] ) {
					$adr_rowsTransferLig[$adr] = array() ;
				}
				$adr_rowsTransferLig[$adr][] = $row_transferLig ;
			}
		}
		if( $post_data['transferFilerecordId'] ) {
			$transfer_filerecordId = $post_data['transferFilerecordId'] ;
			$transferLig_filerecordIds = json_decode($post_data['transferLigFilerecordId_arr'],true) ;
			$transferStepCode = $post_data['transferStepCode'] ;
			
			// ****** Interro step ********
			$step_isFinal = $_opDB->query_uniqueValue("SELECT field_IS_ADR FROM view_bible_CFG_MVTFLOW_entry WHERE entry_key='{$transferStepCode}'") ;
		
			$query = "SELECT * FROM view_file_TRANSFER WHERE filerecord_id='{$transfer_filerecordId}'" ;
			$result = $_opDB->query($query) ;
			$row_transfer = $_opDB->fetch_assoc($result) ;
		
			$ttmp = specDbsLam_transfer_getTransferLig( array('filter_transferFilerecordId'=>$transfer_filerecordId) ) ;
			$rows_transferLig = $ttmp['data'] ;
			
			$adr_rowsTransferLig = array() ;
			foreach( $rows_transferLig as $row_transferLig ) {
				if( !in_array($row_transferLig['transferlig_filerecord_id'],$transferLig_filerecordIds) ) {
					continue ;
				}
				$adr = ( $step_isFinal ? $row_transferLig['current_adr_entryKey'] : $row_transferLig['current_adr_treenodeKey'] ) ; ;
				if( !$adr_rowsTransferLig[$adr] ) {
					$adr_rowsTransferLig[$adr] = array() ;
				}
				$adr_rowsTransferLig[$adr][] = $row_transferLig ;
			}
		}
	
	$title = ( $step_isFinal ? 'MISE EN STOCK' : 'BORDEREAU DE TRANSFERT' );
		
	$buffer = '' ;
	$is_first = TRUE ;
	ksort($adr_rowsTransferLig) ;
	foreach( $adr_rowsTransferLig as $adr => $rows_transferLig ) {
		$ttmp = explode('_',$adr,2) ;
		$adr_str = $ttmp[1] ;
		
		if( $is_first ) {
			$is_first = FALSE ;
		} else {
			$buffer.= '<DIV style="page-break-after:always"></DIV>' ;
		}
		$buffer.= '<DIV style="page-break-after:always"></DIV>' ;
		$buffer.= "<table border='0' cellspacing='1' cellpadding='1'>" ;
		$buffer.= "<tr><td width='5'/><td width='200'>" ;
			$buffer.= '<div align="center">' ;
			$buffer.= '<img src="data:image/jpeg;base64,'.base64_encode(specDbsLam_lib_getBarcodePng($adr,75)).'" /><br>' ;
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
				$buffer.= "</tr>" ;
			$buffer.= '</thead>' ;
			foreach( $rows_transferLig as $row_transferLig ) {
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
					
					$class = ($arr_prod['field_SPEC_IS_DLC'] ? '' : 'croix') ;
					$buffer.= "<td class=\"$class\"><span>{$row_transferLig['stk_datelc']}</span></td>" ;
					
					$buffer.= "<td align='right'><span class=\"mybig\"><b>".(float)$row_transferLig['mvt_qty']."</b></span></td>" ;
					
					$class = ($arr_prod['field_SPEC_IS_SN'] ? '' : 'croix') ;
					$buffer.= "<td class=\"$class\"><span class=\"\">{$row_transferLig['stk_sn']}</span></td>" ;
					
					$buffer.= "<td><span class=\"\"><b>".(json_decode($arr_prod['field_ATR_STD'],true)==array('STD')?'Y':'N')."</b></span></td>" ;
					
					$buffer.= "<td><span class=\"\"><i>".($arr_prod['field_UC_QTY']>0 ? (float)$arr_prod['field_UC_QTY']:'')."</i></span></td>" ;
				$buffer.= "</tr>" ;
			}
		$buffer.= "</table>" ;
		
		if( $step_isFinal && count($rows_transferLig)==1 ) {
			$row_transferLig = reset($rows_transferLig) ;
			
				$query = "SELECT * FROM view_bible_PROD_entry WHERE entry_key='{$row_transferLig['stk_prod']}'" ;
				$result = $_opDB->query($query) ;
				$arr_prod = $_opDB->fetch_assoc($result) ;
			
			$buffer.= "<br><br><br><br>" ;
			
			$buffer.= "<div align='left'>" ;
			
			$buffer.= "<table class='tabledonnees'>" ;
				
				$buffer.= "<tr>" ;
					$buffer.= "<td width='30%'><span class=\"mybig\">PartNumber</span></td>" ;
					$buffer.= '<td align="center">' ;
						$buffer.= '<img src="data:image/jpeg;base64,'.base64_encode(specDbsLam_lib_getBarcodePng($row_transferLig['stk_prod'],50)).'" /><br>';
						$buffer.= $row_transferLig['stk_prod'].'<br>';
					$buffer.= '</td>' ;
				$buffer.= "</tr>" ;
			
				$buffer.= "<tr>" ;
					$buffer.= "<td width='30%'><span class=\"mybig\">Batch</span></td>" ;
					if( $arr_prod['field_SPEC_IS_BATCH'] ) {
						$buffer.= '<td align="center">' ;
						$buffer.= '<img src="data:image/jpeg;base64,'.base64_encode(specDbsLam_lib_getBarcodePng($row_transferLig['stk_batch'],50)).'" /><br>';
						$buffer.= $row_transferLig['stk_batch'].'<br>';
						$buffer.= '</td>' ;
					} else {
						$buffer.= '<td class="croix">&nbsp;</td>' ;
					}
				$buffer.= "</tr>" ;
			
				$buffer.= "<tr>" ;
					$buffer.= "<td width='30%'><span class=\"mybig\">DLC</span></td>" ;
					if( $arr_prod['field_SPEC_IS_DLC'] ) {
						$buffer.= '<td align="center">' ;
						$buffer.= '<img src="data:image/jpeg;base64,'.base64_encode(specDbsLam_lib_getBarcodePng($row_transferLig['stk_datelc'],50)).'" /><br>';
						$buffer.= $row_transferLig['stk_datelc'].'<br>';
						$buffer.= '</td>' ;
					} else {
						$buffer.= '<td class="croix">&nbsp;</td>' ;
					}
				$buffer.= "</tr>" ;
			
				$buffer.= "<tr>" ;
					$buffer.= "<td width='30%'><span class=\"mybig\">SerialNo</span></td>" ;
					if( $arr_prod['field_SPEC_IS_SN'] ) {
						$buffer.= '<td align="center">' ;
						$buffer.= '<img src="data:image/jpeg;base64,'.base64_encode(specDbsLam_lib_getBarcodePng($row_transferLig['stk_sn'],50)).'" /><br>';
						$buffer.= $row_transferLig['stk_sn'].'<br>';
						$buffer.= '</td>' ;
					} else {
						$buffer.= '<td class="croix">&nbsp;</td>' ;
					}
				$buffer.= "</tr>" ;
			
			
			$buffer.= "</table>" ;
			
			if( $row_transferLig['ATR_NEASA'] ) {
				$buffer.= "<br><br><br><br>" ;
				
				$buffer.= "<table class='tabledonnees'>" ;
					$buffer.= "<tr>" ;
						$buffer.= "<td width='45%'><span class=\"mybig\">EASA #</span></td>" ;

						$buffer.= '<td align="center">' ;
							$buffer.= '<img src="data:image/jpeg;base64,'.base64_encode(specDbsLam_lib_getBarcodePng($row_transferLig['ATR_NEASA'],50)).'" /><br>';
							$buffer.= $row_transferLig['ATR_NEASA'].'<br>';
						$buffer.= '</td>' ;
					$buffer.= "</tr>" ;
				$buffer.= "</table>" ;
			}
			if( $row_transferLig['ATR_SU'] && $row_transferLig['ATR_SU']!='@MBDSU' ) {
				$buffer.= "<br><br>" ;
				
				$buffer.= "<table class='tabledonnees'>" ;
					$buffer.= "<tr>" ;
						$buffer.= "<td width='45%'><span class=\"mybig\">MBD-SU #</span></td>" ;

						$buffer.= '<td align="center">' ;
							$buffer.= '<img src="data:image/jpeg;base64,'.base64_encode(specDbsLam_lib_getBarcodePng($row_transferLig['ATR_SU'],50)).'" /><br>';
							$buffer.= $row_transferLig['ATR_SU'].'<br>';
						$buffer.= '</td>' ;
					$buffer.= "</tr>" ;
				$buffer.= "</table>" ;
			}
			
			$buffer.= "</div>" ;
		}
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


function specDbsLam_transfer_createDoc($post_data) {
	global $_opDB ;
	$form_data = json_decode($post_data['data'],true) ;
	
	if( $form_data['flow_code'] ) {
		$ttmp = specDbsLam_cfg_getMvtflow() ;
		$cfg_mvtflow = $ttmp['data'] ;
		foreach( $cfg_mvtflow as $row_mvtflow ) {
			if( $row_mvtflow['flow_code'] == $form_data['flow_code'] ) {
				$row_mvtflowstep = reset($row_mvtflow['steps']) ;
				$init_mvtflowstep = $row_mvtflowstep['step_code'] ;
			}
		}
	}
	
	$arr_ins = array(
		'field_WHSE_SRC' => $form_data['whse_src'],
		'field_WHSE_DEST' => $form_data['whse_dest'],
		'field_FLOW_CODE' => $form_data['flow_code'],
		'field_TRANSFER_TXT' => $form_data['transfer_txt'] 
	);
	paracrm_lib_data_insertRecord_file('TRANSFER',0,$arr_ins) ;
	
	return array('success'=>true, 'debug'=>$form_data) ;
}

function specDbsLam_transfer_deleteDoc($post_data) {
	global $_opDB ;
	
		$transfer_filerecordId = $post_data['transfer_filerecordId'] ;
	
		$query = "SELECT * FROM view_file_TRANSFER WHERE filerecord_id='{$transfer_filerecordId}'" ;
		$result = $_opDB->query($query) ;
		$row_transfer = $_opDB->fetch_assoc($result) ;
	
		$ttmp = specDbsLam_transfer_getTransferLig( array('filter_transferFilerecordId'=>$transfer_filerecordId) ) ;
		$rows_transferLig = $ttmp['data'] ;
		if( $rows_transferLig ) {
			return array('success'=>false) ;
		}
		
	paracrm_lib_data_deleteRecord_file('TRANSFER',$transfer_filerecordId) ;
	
	return array('success'=>true) ;
}




function specDbsLam_transfer_saveReject($post_data) {
	global $_opDB ;
	
	foreach( json_decode($post_data['transferLigFilerecordId_arr'],true) as $transferLigFilerecordId ) {
		$arr_update = array();
		$arr_update['field_STATUS_IS_REJECT'] = TRUE ;
		$arr_update['field_REJECT_ARR'] = implode(',',json_decode($post_data['rejectCheckCode_arr'],true)) ;
		$arr_update['field_REJECT_TXT'] = $post_data['rejectTxt'] ;
		paracrm_lib_data_updateRecord_file('TRANSFER_LIG',$arr_update,$transferLigFilerecordId) ;
	}
	
	specDbsLam_transfer_lib_advanceDoc($post_data['transferFilerecordId']) ;
	
	return array('success'=>true, 'debug'=>$post_data) ;
}

function specDbsLam_transfer_lib_cleanAdr() {
	global $_opDB ;
	
	//HACK : BUG ! Must synchronize / use LOCKs
	return ;

	$query = "DELETE view_bible_ADR_entry 
					from view_bible_ADR_entry
					LEFT OUTER JOIN view_file_STOCK ON view_file_STOCK.field_ADR_ID=view_bible_ADR_entry.entry_key
					WHERE view_bible_ADR_entry.entry_key LIKE 'TMP_%' AND view_file_STOCK.field_ADR_ID IS NULL" ;
	$_opDB->query($query) ;
	
	$arr_parentTreenodes = array() ;
	$query = "SELECT distinct treenode_parent_key FROM view_bible_ADR_tree
				WHERE treenode_key LIKE 'TMP_%' AND treenode_parent_key NOT IN ('','&')" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$arr_parentTreenodes[] = $arr[0] ;
	}
	
	$arr_usedTreenodes = array() ;
	$query = "SELECT distinct treenode_key FROM view_bible_ADR_entry
				WHERE treenode_key LIKE 'TMP_%' AND treenode_key NOT IN ('','&')" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$arr_usedTreenodes[] = $arr[0] ;
	}
	
	$arr_tokeepTreenodes = array_merge($arr_parentTreenodes,$arr_usedTreenodes) ;
	$query = "DELETE FROM view_bible_ADR_tree WHERE treenode_key LIKE 'TMP_%'" ;
	if( $arr_tokeepTreenodes ) {
		$query.= " AND treenode_key NOT IN ".$_opDB->makeSQLlist($arr_tokeepTreenodes) ;
	}
	//$_opDB->query($query) ;
	// HACK 25/01/2016 : DO NOT PURGE TREENODES
}
function specDbsLam_transfer_lib_processForeign( &$post_data ) {
	global $_opDB ;
	
	// Load cfg attributes
	$ttmp = specDbsLam_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	
	
	if( json_decode($post_data['transferLigFilerecordId_arr'],true) ) {
		return TRUE ;
	}
	if( !json_decode($post_data['skuData_obj'],true) ) {
		return FALSE ;
	}
		
	$current_step_code = $post_data['transferStepCode'] ;
	$current_flow_code = $_opDB->query_uniqueValue("SELECT treenode_key FROM view_bible_CFG_MVTFLOW_entry WHERE entry_key='{$current_step_code}'");
	$first_step_code = $_opDB->query_uniqueValue("SELECT entry_key FROM view_bible_CFG_MVTFLOW_entry WHERE treenode_key='{$current_flow_code}' ORDER BY entry_key LIMIT 1");
	$flow_isForeign = $_opDB->query_uniqueValue("SELECT field_IS_FOREIGN FROM view_bible_CFG_MVTFLOW_tree WHERE treenode_key='{$current_flow_code}'") ;

	if( $first_step_code != $current_step_code || !$flow_isForeign ) {
		return FALSE ;
	}
	
	//echo "BUILDING LINE" ;
	$skuData = json_decode($post_data['skuData_obj'],true) ;
	//print_r($skuData) ;
	
	
	
	if( !paracrm_lib_data_getRecord_bibleEntry( 'ADR', 'TMP_RECEP' ) ) {
		paracrm_lib_data_insertRecord_bibleEntry('ADR','TMP_RECEP','TMP',array('field_ADR_ID'=>'TMP_RECEP')) ;
	}
	$arr_ins = array() ;
	$arr_ins['field_ADR_ID'] = 'TMP_RECEP' ;
	$arr_ins['field_PROD_ID'] = $skuData['stk_prod'] ;
	$arr_ins['field_SPEC_BATCH'] = $skuData['stk_batch'] ;
	$arr_ins['field_SPEC_DATELC'] = $skuData['stk_datelc'] ;
	$arr_ins['field_SPEC_SN'] = $skuData['stk_sn'] ;
	$arr_ins['field_QTY_AVAIL'] = $skuData['mvt_qty'] ;
	foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
		if( !$stockAttribute_obj['STOCK_fieldcode'] ) {
			continue ;
		}
		$arr_ins[$stockAttribute_obj['STOCK_fieldcode']] = $skuData[$stockAttribute_obj['mkey']] ;
	}
	$stk_filerecord_id = paracrm_lib_data_insertRecord_file('STOCK',0,$arr_ins) ;
	//echo $stk_filerecord_id ;
	
	$ttmp = specDbsLam_transfer_addStock( array(
		'transfer_filerecordId'=>$post_data['transferFilerecordId'],
		'stock_filerecordIds'=>json_encode(array($stk_filerecord_id))
	) ) ;
	if( count($ttmp['ids']) != 1 ) {
		return FALSE ;
	}
	$transferLigFilerecordId = reset($ttmp['ids']) ;
	$post_data['transferLigFilerecordId_arr'] = json_encode(array($transferLigFilerecordId)) ;
	return TRUE ;
}
function specDbsLam_transfer_lib_cleanForeign($post_data) {
	global $_opDB ;
	
	$current_step_code = $post_data['transferStepCode'] ;
	$current_flow_code = $_opDB->query_uniqueValue("SELECT treenode_key FROM view_bible_CFG_MVTFLOW_entry WHERE entry_key='{$current_step_code}'");
	$first_step_code = $_opDB->query_uniqueValue("SELECT entry_key FROM view_bible_CFG_MVTFLOW_entry WHERE treenode_key='{$current_flow_code}' ORDER BY entry_key LIMIT 1");
	$flow_isForeign = $_opDB->query_uniqueValue("SELECT field_IS_FOREIGN FROM view_bible_CFG_MVTFLOW_tree WHERE treenode_key='{$current_flow_code}'") ;

	if( $first_step_code != $current_step_code || !$flow_isForeign ) {
		return ;
	}
	
	if( !($ttmp = json_decode($post_data['transferLigFilerecordId_arr'],true)) ) {
		return ;
	}
	$target_transferLigFilerecordId = reset($ttmp) ;
	
	
	$ttmp = specDbsLam_transfer_getTransferLig( array('filter_transferFilerecordId'=>$post_data['transferFilerecordId']) ) ;
	$rows_transferLig = $ttmp['data'] ;
	$row_transferLig = NULL ;
	foreach( $ttmp['data'] as $row ) {
		if( $row['transferlig_filerecord_id'] == $target_transferLigFilerecordId ) {
			$row_transferLig = $row ;
			break ;
		}
	}
	if( !$row_transferLig['status_is_ok'] && count($row_transferLig['steps'])==1 ) {
		// etat initial d'un direct inbound => suppression
		$row_transferLig_step = reset($row_transferLig['steps']) ;
		$stk_filerecord_id = $row_transferLig_step['file_stock_id'] ;
		
		specDbsLam_transfer_removeStock( array('transferLig_filerecordIds'=>json_encode(array($target_transferLigFilerecordId))) ) ;
		$stk_filerecord_id = paracrm_lib_data_deleteRecord_file('STOCK',$stk_filerecord_id) ;
	}
	return ;
}
function specDbsLam_transfer_commitAdrTmp($post_data,$inner=FALSE) {
	global $_opDB ;
	$prefix_TMP = 'TMP_' ;
	
	if( !$inner ) {
		if( !specDbsLam_transfer_lib_processForeign($post_data) ) {
			return array('success'=>false) ;
		}
		$ret = specDbsLam_transfer_commitAdrTmp($post_data,$inner=TRUE) ;
		specDbsLam_transfer_lib_cleanForeign($post_data) ;
		return $ret ;
	}
	
	$p_transferFilerecordId = $post_data['transferFilerecordId'] ;
	$p_transferLigFilerecordId_arr = json_decode($post_data['transferLigFilerecordId_arr'],true) ;
	$p_transferStepCode = $post_data['transferStepCode'] ;
	$p_transferTargetNode = $post_data['transferTargetNode'] ;
	$p_location = preg_replace("/[^A-Z0-9\-\/]/", "", strtoupper($post_data['location'])) ;
	
	// **** Vérifs STEP *****
	//  - step <> is_final
	//  - 
	$step_isFinal = $_opDB->query_uniqueValue("SELECT field_IS_ADR FROM view_bible_CFG_MVTFLOW_entry WHERE entry_key='{$p_transferStepCode}'") ;
	if( $step_isFinal ) {
		return array('success'=>false) ;
	}
	
	
	// **** Recherche next Step ********
	$current_step_code = $post_data['transferStepCode'] ;
	$current_flow_code = $_opDB->query_uniqueValue("SELECT treenode_key FROM view_bible_CFG_MVTFLOW_entry WHERE entry_key='{$current_step_code}'");
	
	$steps = array() ;
	$query = "SELECT entry_key FROM view_bible_CFG_MVTFLOW_entry WHERE treenode_key='{$current_flow_code}' ORDER BY entry_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$steps[] = $arr[0] ;
	}
	sort($steps) ;
	$currentStep_key = array_search($current_step_code,$steps) ;
	$nextStep_key = $currentStep_key + 1 ;
	if( !($next_step_code = $steps[$nextStep_key]) ) {
		return array('success'=>false) ;
	}
	
	
	// Load current ligs
	$ttmp = specDbsLam_transfer_getTransferLig( array('filter_transferFilerecordId'=>$p_transferFilerecordId) ) ;
	$rows_transferLig = $ttmp['data'] ;
	foreach( $rows_transferLig as $idx => $row_transferLig ) {
		if( !in_array($row_transferLig['transferlig_filerecord_id'],$p_transferLigFilerecordId_arr) ) {
			unset($rows_transferLig[$idx]) ;
			continue ;
		}
		if( $row_transferLig['step_code'] != $p_transferStepCode ) {
			return array('success'=>false, 'reload'=>true, 'error'=>'Invalid status for item(s) != '.$p_transferStepCode) ;
		}
	}
	if( count($rows_transferLig) != count($p_transferLigFilerecordId_arr) ) {
		// count ?
		return array('success'=>false) ;
	}
	unset($srcAdr_isTmp) ;
	foreach( $rows_transferLig as $row_transferLig ) {
		if( !isset($srcAdr_isTmp) ) {
			$srcAdr_isTmp = (int)$row_transferLig['current_adr_tmp'] ;
		} elseif( $srcAdr_isTmp != $row_transferLig['current_adr_tmp'] ) {
			$srcAdr_isTmp = -1 ;
		}
	}
	if( !isset($srcAdr_isTmp) || $srcAdr_isTmp == -1 ) {
		// unique src adr ?
		return array('success'=>false) ;
	}
	
	
	
	// CURRENT LOCATION IS TMP ?
	if( $srcAdr_isTmp ) {
		// CHECK: source location ($p_transferTargetNode) is ADR treenode ?
		$query = "SELECT count(*) from view_bible_ADR_tree WHERE treenode_key='{$p_transferTargetNode}'" ;
		if( $_opDB->query_uniqueValue($query) != 1 ) {
			return array('success'=>false, 'reload'=>true, 'error'=>"CHECK FAIL : Source target {$p_transferTargetNode} invalid for step") ;
		}
		$currentAdrTreenode = $p_transferTargetNode ;
		
		
		// CHECK: source location nb of final items == nb ligs
		$ttmp = specDbsLam_stock_getGrid( array('filter_treenodeKey'=>$currentAdrTreenode) ) ;
		$count_stk = 0 ;
		foreach( $ttmp['data'] as $stk_row ) {
			if( $stk_row['stk_filerecord_id'] ) {
				$count_stk++ ;
			}
		}
		if( $count_stk != count($p_transferLigFilerecordId_arr) ) {
			return array('success'=>false, 'reload'=>true, 'error'=>"CHECK FAIL : Nb items loaded != nb items in location {$currentAdrTreenode}") ;
		}
		
		
		
	
		$step_isGroup = $_opDB->query_uniqueValue("SELECT field_IS_ATTACH_PARENT FROM view_bible_CFG_MVTFLOW_entry WHERE entry_key='{$current_step_code}'") ;
		$step_isDetach = $_opDB->query_uniqueValue("SELECT field_IS_DETACH FROM view_bible_CFG_MVTFLOW_entry WHERE entry_key='{$current_step_code}'") ;
		$step_isPrint = $_opDB->query_uniqueValue("SELECT field_IS_PRINT FROM view_bible_CFG_MVTFLOW_entry WHERE entry_key='{$current_step_code}'") ;
		/*
		 * if step = GROUP => attach common treenode (pallet ?) to a primary root treenode (truck ?)
		 * if step NOT GROUP => attach common treenode (pallet ?) to root TMP
		*/
		if( $step_isPrint ) {
			$location_treenodeKey = $currentAdrTreenode ;
			// controle => l'élément sélectionné est pur parent / ne doit pas avoir de leaf (adresses réelles)
			$query = "SELECT treenode_parent_key from view_bible_ADR_tree WHERE treenode_key='{$location_treenodeKey}'" ;
			if( $_opDB->query_uniqueValue($query) != 'TMP' ) {
				return array('success'=>false, 'error'=>"Target not printable") ;
			}
		}
		if( $step_isGroup ) {
			if( !trim($p_location) ) {
				return array('success'=>false, 'error'=>'Must specify explicit location') ;
			}
			$location_treenodeKey = 'TMP_'.$p_location ;
			if( $location_treenodeKey == $currentAdrTreenode ) {
				return array('success'=>false, 'error'=>'Destination == Source ?') ;
			}
			
			// controle => l'élément sélectionné est pur parent / ne doit pas avoir de leaf (adresses réelles)
			$query = "SELECT count(*) from view_bible_ADR_entry WHERE treenode_key='{$location_treenodeKey}'" ;
			if( $_opDB->query_uniqueValue($query) > 0 ) {
				return array('success'=>false, 'error'=>"Destination has leaf nodes : Incompatible.") ;
			}
			
			if( !paracrm_lib_data_getRecord_bibleTreenode('ADR',$location_treenodeKey) ) {
				paracrm_lib_data_insertRecord_bibleTreenode('ADR',$location_treenodeKey,'TMP',array('field_ROW_ID'=>$location_treenodeKey)) ;
			}
		} elseif( $step_isDetach ) {
			// controle => l'élément sélectionné doit avoir un parent
			$query = "SELECT treenode_parent_key from view_bible_ADR_tree WHERE treenode_key='{$currentAdrTreenode}'" ;
			if( in_array($_opDB->query_uniqueValue($query),array('TMP')) ) {
				return array('success'=>false, 'error'=>"Selected item {$currentAdrTreenode} is not detachable") ;
			}
		
			$location_treenodeKey = $currentAdrTreenode ;
		} else {
			$location_treenodeKey = $currentAdrTreenode ;
		}
	} else {
		if( count($rows_transferLig) != 1 ) {
			return array('success'=>false, 'error'=>'Group locations not accepted') ;
		}
		if( !trim($p_location) ) {
			return array('success'=>false, 'error'=>'Must specify explicit location') ;
		}
		// CREATE PARENT LOCATION
		$location_treenodeKey = 'TMP_'.$p_location ;
		if( !paracrm_lib_data_getRecord_bibleTreenode('ADR',$location_treenodeKey) ) {
			paracrm_lib_data_insertRecord_bibleTreenode('ADR',$location_treenodeKey,'TMP',array('field_ROW_ID'=>$location_treenodeKey)) ;
		}
	}
	$location_display = $location_treenodeKey ;
	
	
	// Controle cohérence : l'élément DEST doit contenir
	// - currentStep OR nextStep + !status_is_ok 
	$ttmp = specDbsLam_stock_getGrid( array('filter_treenodeKey'=>$location_treenodeKey) ) ;
	$arr_mvtFilerecordIds = array() ;
	foreach( $ttmp['data'] as $inv_row ) {
		$stk_filerecordId = $inv_row['inv_id'] ;
		if( !$stk_filerecordId ) {
			continue ;
		}
		$query = "SELECT * from view_file_MVT_STEP WHERE field_FILE_STOCK_ID='$stk_filerecordId'" ;
		$result = $_opDB->query($query) ;
		if( $_opDB->num_rows($result) != 1 ) {
			return array('success'=>false, 'error'=>'CHECK FAIL : Missing MVT_STEP for component') ;
		}
		$arr = $_opDB->fetch_assoc($result) ;
		if( !in_array($arr['field_STEP_CODE'],array($current_step_code,$next_step_code)) ) {
			return array('success'=>false, 'error'=>'CHECK FAIL : Select target '.$location_treenodeKey.' not compatible') ;
		}
		if( !in_array($arr['filerecord_parent_id'],$arr_mvtFilerecordIds) ) {
			$arr_mvtFilerecordIds[] = $arr['filerecord_parent_id'] ;
		}
	}
	$step_isGroup = $_opDB->query_uniqueValue("SELECT field_IS_ATTACH_PARENT FROM view_bible_CFG_MVTFLOW_entry WHERE entry_key='{$current_step_code}'") ;
	// Contrôle cohérence : l'element DEST ne doit PAS contenir d'élément d'une autre vague
	if( $step_isGroup && count($arr_mvtFilerecordIds) > 0 ) {
		$testOk = true ;
		$query = "SELECT distinct filerecord_parent_id FROM view_file_TRANSFER_LIG
				WHERE field_FILE_MVT_ID IN ".$_opDB->makeSQLlist($arr_mvtFilerecordIds) ;
		$result = $_opDB->query($query) ;
		if( $_opDB->num_rows($result) != 1 ) {
			$testOk = FALSE ;
		} else {
			$arr = $_opDB->fetch_row($result) ;
			if( $arr[0] != $p_transferFilerecordId ) {
				$testOk = FALSE ;
			}
		}
		if( !$testOk ) {
			return array('success'=>false, 'error'=>'CHECK FAIL : Select target '.$location_treenodeKey.' has items from foreign transfer doc.') ;
		}
	}
	
	
	if( $srcAdr_isTmp ) {
		// CHECK: source location ($p_transferTargetNode) is ADR treenode ?
		$query = "SELECT count(*) from view_bible_ADR_tree WHERE treenode_key='{$p_transferTargetNode}'" ;
		if( $_opDB->query_uniqueValue($query) != 1 ) {
			return array('success'=>false, 'error'=>"CHECK FAIL : Source target {$p_transferTargetNode} invalid for step") ;
		}
		$currentAdrTreenode = $p_transferTargetNode ;
		
		
		// CHECK: source location nb of final items == nb ligs
		$ttmp = specDbsLam_stock_getGrid( array('filter_treenodeKey'=>$currentAdrTreenode) ) ;
		$count_stk = 0 ;
		foreach( $ttmp['data'] as $stk_row ) {
			if( $stk_row['stk_filerecord_id'] ) {
				$count_stk++ ;
			}
		}
		if( $count_stk != count($p_transferLigFilerecordId_arr) ) {
			return array('success'=>false, 'error'=>"CHECK FAIL : Nb items loaded != nb items in location {$currentAdrTreenode}") ;
		}
		
		
		
	
		$step_isGroup = $_opDB->query_uniqueValue("SELECT field_IS_ATTACH_PARENT FROM view_bible_CFG_MVTFLOW_entry WHERE entry_key='{$current_step_code}'") ;
		$step_isDetach = $_opDB->query_uniqueValue("SELECT field_IS_DETACH FROM view_bible_CFG_MVTFLOW_entry WHERE entry_key='{$current_step_code}'") ;
		$step_isPrint = $_opDB->query_uniqueValue("SELECT field_IS_PRINT FROM view_bible_CFG_MVTFLOW_entry WHERE entry_key='{$current_step_code}'") ;
		/*
		 * if step = GROUP => attach common treenode (pallet ?) to a primary root treenode (truck ?)
		 * if step NOT GROUP => attach common treenode (pallet ?) to root TMP
		*/
		if( $step_isGroup ) {
			if( !trim($p_location) ) {
				return array('success'=>false, 'error'=>'Must specify explicit location') ;
			}
			$location_treenodeKey = 'TMP_'.$p_location ;
			if( $location_treenodeKey == $currentAdrTreenode ) {
				return array('success'=>false, 'error'=>'Destination == Source ?') ;
			}
			
			// controle => l'élément sélectionné est pur parent / ne doit pas avoir de leaf (adresses réelles)
			$query = "SELECT count(*) from view_bible_ADR_entry WHERE treenode_key='{$location_treenodeKey}'" ;
			if( $_opDB->query_uniqueValue($query) > 0 ) {
				return array('success'=>false, 'error'=>"Destination has leaf nodes : Incompatible.") ;
			}
			
			if( !paracrm_lib_data_getRecord_bibleTreenode('ADR',$location_treenodeKey) ) {
				paracrm_lib_data_insertRecord_bibleTreenode('ADR',$location_treenodeKey,'TMP',array('field_ROW_ID'=>$location_treenodeKey)) ;
			}
			paracrm_lib_data_bibleAssignParentTreenode( 'ADR', $currentAdrTreenode, $location_treenodeKey ) ;
		} elseif( $step_isDetach ) {
			// controle => l'élément sélectionné doit avoir un parent
			$query = "SELECT treenode_parent_key from view_bible_ADR_tree WHERE treenode_key='{$currentAdrTreenode}'" ;
			if( in_array($_opDB->query_uniqueValue($query),array('TMP')) ) {
				return array('success'=>false, 'error'=>"Selected item {$currentAdrTreenode} is not detachable") ;
			}
		
			$location_treenodeKey = $currentAdrTreenode ;
			paracrm_lib_data_bibleAssignParentTreenode( 'ADR', $currentAdrTreenode, 'TMP' ) ;
		} else {
			$location_treenodeKey = $currentAdrTreenode ;
		}
	} else {
		if( !trim($p_location) ) {
			return array('success'=>false, 'error'=>'Must specify explicit location') ;
		}
		// CREATE PARENT LOCATION
		$location_treenodeKey = 'TMP_'.$p_location ;
		if( !paracrm_lib_data_getRecord_bibleTreenode('ADR',$location_treenodeKey) ) {
			paracrm_lib_data_insertRecord_bibleTreenode('ADR',$location_treenodeKey,'TMP',array('field_ROW_ID'=>$location_treenodeKey)) ;
		} else {
			paracrm_lib_data_bibleAssignParentTreenode( 'ADR', $location_treenodeKey, 'TMP' ) ;
		}
	}
	$location_display = $location_treenodeKey ;
	
	foreach( $p_transferLigFilerecordId_arr as $transferLig_filerecordId ) {
		$location_entryKey = 'TMP_POS_'.$transferLig_filerecordId ;
		if( !paracrm_lib_data_getRecord_bibleEntry( 'ADR', $location_entryKey ) ) {
			paracrm_lib_data_insertRecord_bibleEntry('ADR',$location_entryKey,$location_treenodeKey,array('field_ADR_ID'=>$location_entryKey)) ;
		} else {
			if( !$srcAdr_isTmp ) {
				paracrm_lib_data_bibleAssignTreenode('ADR', $location_entryKey, $location_treenodeKey ) ;
			}
		}
		
		
		// mvt ID ?
		$query = "SELECT field_FILE_MVT_ID FROM view_file_TRANSFER_LIG WHERE filerecord_id='{$transferLig_filerecordId}'" ;
		$mvt_filerecordId = $_opDB->query_uniqueValue($query) ;
		if( !$mvt_filerecordId ) {
			continue ;
		}
		if( specDbsLam_lib_procMvt_commit($mvt_filerecordId, $location_entryKey, $location_display, $next_step_code ) ) {
			$arr_update = array();
			$arr_update['field_STATUS_IS_REJECT'] = FALSE ;
			$arr_update['field_STEP_CODE'] = $next_step_code ;
			paracrm_lib_data_updateRecord_file('TRANSFER_LIG',$arr_update,$transferLig_filerecordId) ;
		}
	}
	
	
	specDbsLam_transfer_lib_advanceDoc($post_data['transferFilerecordId']) ;
	
	return array('success'=>true, 'debug'=>$post_data, 'ids'=>$p_transferLigFilerecordId_arr) ;
}
function specDbsLam_transfer_commitAdrFinal($post_data,$fast=FALSE,$inner=FALSE) {
	global $_opDB ;
	
	if( !$inner ) {
		if( !specDbsLam_transfer_lib_processForeign($post_data) ) {
			return array('success'=>false) ;
		}
		$ret = specDbsLam_transfer_commitAdrFinal($post_data,$fast,$inner=TRUE) ;
		specDbsLam_transfer_lib_cleanForeign($post_data) ;
		return $ret ;
	}
	
	
	$p_transferFilerecordId = $post_data['transferFilerecordId'] ;
	$p_transferLigFilerecordId_arr = json_decode($post_data['transferLigFilerecordId_arr'],true) ;
	$p_transferStepCode = $post_data['transferStepCode'] ;
	
	// Load cfg attributes
	$ttmp = specDbsLam_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	
	
	// **** Vérifs STEP *****
	//  - step = is_final
	//  - 
	$step_isFinal = $_opDB->query_uniqueValue("SELECT field_IS_ADR FROM view_bible_CFG_MVTFLOW_entry WHERE entry_key='{$p_transferStepCode}'") ;
	if( !$step_isFinal ) {
		return array('success'=>false) ;
	}
	
	
	
	$form_data = array() ;
	if( !$fast ) {
	$form_data['stockAttributes_obj'] = array() ;
	$stockAttributes_obj = json_decode($post_data['stockAttributes_obj'],true) ;
	foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
		if( $stockAttribute_obj['STOCK_fieldcode']
			|| $stockAttribute_obj['PROD_fieldcode'] && $stockAttribute_obj['ADR_fieldcode'] ) {} else {
			
			continue ;
		}
		$mkey = $stockAttribute_obj['mkey'] ;
		$STOCK_fieldcode = $stockAttribute_obj['STOCK_fieldcode'] ;
		$form_data['stockAttributes_obj'][$mkey] = $stockAttributes_obj[$mkey] ;
	}
	foreach( $form_data['stockAttributes_obj'] as $mkey => $mvalue ) {
		if( !$mvalue ) {
			return array('success'=>false, 'error'=>'Stock attributes error !') ;
		}
	}
	}
	
	// Load current doc
	$ttmp = specDbsLam_transfer_getTransfer( array('filter_transferFilerecordId'=>$p_transferFilerecordId) ) ;
	$row_transfer = $ttmp['data'][0] ;
	$whse_dest = $row_transfer['whse_dest'] ;
	if( !$whse_dest ) {
		return array('success'=>false, 'error'=>'Warehouse destination ?') ;
	}
	
	// Load current ligs
	$ttmp = specDbsLam_transfer_getTransferLig( array('filter_transferFilerecordId'=>$p_transferFilerecordId) ) ;
	$rows_transferLig = $ttmp['data'] ;
	foreach( $rows_transferLig as $idx => $row_transferLig ) {
		if( !in_array($row_transferLig['transferlig_filerecord_id'],$p_transferLigFilerecordId_arr) ) {
			unset($rows_transferLig[$idx]) ;
		}
	}
	if( !$fast && count($rows_transferLig) != 1 ) {
		// count ?
		return array('success'=>false) ;
	}
	
	$rows_transferLig = array_values($rows_transferLig) ;
	// Save/generate STOCK fields ?
	$row_transferLig = $rows_transferLig[0] ;
	foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
		if( !$stockAttribute_obj['STOCK_fieldcode'] ) {
			continue ;
		}
		$mkey = $stockAttribute_obj['mkey'] ;
		if( $row_transferLig[$stockAttribute_obj['mkey']] == '' ) {
			$forward_stockAttributes[$mkey] = $form_data['stockAttributes_obj'][$mkey] ;
		} elseif( substr($row_transferLig[$stockAttribute_obj['mkey']],0,1) == '@' ) {
			switch( substr($row_transferLig[$stockAttribute_obj['mkey']],1) ) {
				case 'MBDSU' :
					$value = specDbsLam_spec_get_MBDSU() ;
					break ;
					
				default :
					continue 2 ;
			}
			$forward_stockAttributes[$mkey] = $form_data['stockAttributes_obj'][$mkey] = $value ;
		}
	}
	
	$form_data['mvt_obj'] = array() ;
	$form_data['mvt_obj']['prod_id'] = $row_transferLig['stk_prod'] ;
	$form_data['mvt_obj']['batch'] = $row_transferLig['stk_batch'] ;
	$form_data['mvt_obj']['sn'] = $row_transferLig['stk_sn'] ;
	
	
	// Save PROD fields ?
	if( !$fast ) {
	$prod_stockAttributes = array() ;
	foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
		if( $stockAttribute_obj['PROD_fieldcode'] && $stockAttribute_obj['cfg_is_editable'] ) {
			$mvalue = $form_data['stockAttributes_obj'][$stockAttribute_obj['mkey']] ;
			$prod_stockAttributes[$stockAttribute_obj['PROD_fieldcode']] = $mvalue ;
		}
	}
	if( $prod_stockAttributes ) {
		$arr_update = array() ;
		foreach( $prod_stockAttributes as $field_code => $value ) {
			$arr_update[$field_code] = json_encode(array($value)) ;
		}
		$arr_cond = array() ;
		$arr_cond['entry_key'] = $form_data['mvt_obj']['prod_id'] ;
		$_opDB->update('view_bible_PROD_entry',$arr_update,$arr_cond) ;
	}
	}
	
	specDbsLam_lib_proc_lock_on() ;
	
	if( !$post_data['manAdr_isOn'] ) {
		$adr_obj = specDbsLam_lib_proc_findAdr( $form_data['mvt_obj'], $form_data['stockAttributes_obj'], $whse_dest ) ;
		if( !$adr_obj['adr_id'] ) {
			specDbsLam_lib_proc_lock_off() ;
			return array('success'=>false, 'error'=>'Pas d\'emplacement disponible.', 'error_available'=>true) ;
		}
	} else {
		$adr_treenodes = paracrm_data_getBibleTreeBranch( 'ADR', $whse_dest ) ;
		$query = "SELECT count(*) FROM view_bible_ADR_entry WHERE entry_key='{$post_data['manAdr_adrId']}'
					AND treenode_key IN ".$_opDB->makeSQLlist($adr_treenodes) ;
		if( $_opDB->query_uniqueValue($query) == 1 ) {
			$adr_obj = array('status'=>'OK_MAN','adr_id'=>strtoupper(trim($post_data['manAdr_adrId']))) ;
		} else {
			return array('success'=>false, 'error'=>'Invalid location') ;
		}
	}
	
	
	foreach( $p_transferLigFilerecordId_arr as $transferLig_filerecordId ) {
		// mvt ID ?
		$query = "SELECT field_FILE_MVT_ID FROM view_file_TRANSFER_LIG WHERE filerecord_id='{$transferLig_filerecordId}'" ;
		$mvt_filerecordId = $_opDB->query_uniqueValue($query) ;
		if( !$mvt_filerecordId ) {
			continue ;
		}
		if( specDbsLam_lib_procMvt_commit($mvt_filerecordId, $adr_obj['adr_id'], $adr_obj['adr_id'], NULL, $forward_stockAttributes ) ) {
			$arr_update = array();
			$arr_update['field_STATUS_IS_REJECT'] = FALSE ;
			$arr_update['field_STEP_CODE'] = '' ;
			paracrm_lib_data_updateRecord_file('TRANSFER_LIG',$arr_update,$transferLig_filerecordId) ;
		}
	}
	
	specDbsLam_lib_proc_lock_off() ;
	

	specDbsLam_transfer_lib_advanceDoc($post_data['transferFilerecordId']) ;
	
	if( $row_transferLig['current_adr_tmp'] ) {
		// clean TMP adr 
		$src_adr_id = $row_transferLig['current_adr_entryKey'] ;
		
		$query = "DELETE view_bible_ADR_entry 
						from view_bible_ADR_entry
						LEFT OUTER JOIN view_file_STOCK ON view_file_STOCK.field_ADR_ID=view_bible_ADR_entry.entry_key
						WHERE view_bible_ADR_entry.entry_key='{$src_adr_id}' AND view_file_STOCK.field_ADR_ID IS NULL" ;
		$_opDB->query($query) ;
	}
	
	return array('success'=>true, 'data'=> $adr_obj, 'ids'=>$p_transferLigFilerecordId_arr, 'stockAttributes_obj'=>$form_data['stockAttributes_obj']) ;
}

function specDbsLam_transfer_lib_advanceDoc($transfer_filerecordId) {
	global $_opDB ;
	
	$ttmp = specDbsLam_transfer_getTransfer(array('filter_transferFilerecordId'=>$transfer_filerecordId)) ;
	$data = $ttmp['data'] ;
	
	$step_code = $data[0]['step_code'] ;
	
	
	$statuses = array() ;
	$ttmp = specDbsLam_transfer_getTransferLig(array('filter_transferFilerecordId'=>$transfer_filerecordId)) ;
	foreach($ttmp['data'] as $row_transferLig ) {
		if( $row_transferLig['status_is_reject'] ) {
			continue ;
		}
		
		if( !in_array($row_transferLig['step_code'],$statuses) ) {
			$statuses[] = $row_transferLig['step_code'] ;
		}
	}
	if( count($statuses) == 1 && reset($statuses) != $step_code ) {
		$arr_update = array() ;
		$step_code = reset($statuses) ;
		if( !$step_code ) {
			$arr_update['field_STATUS_IS_OK'] = TRUE ;
		}
		$arr_cond = array() ;
		$arr_cond['filerecord_id'] = $transfer_filerecordId ;
		$_opDB->update('view_file_TRANSFER',$arr_update,$arr_cond) ;
	}
	return ;
}




function specDbsLam_transfer_rollbackStep($post_data) {
	global $_opDB ;
	
	$p_transferFilerecordId = $post_data['transferFilerecordId'] ;
	$p_transferLigFilerecordId_arr = json_decode($post_data['transferLigFilerecordId_arr'],true) ;
	$p_transferStepCode = $post_data['transferStepCode'] ;
	
	// **** Checks *******
	 // toutes lignes => étape courante ?
	 // => étape précédente
	 //     => étape précédente TMP ? => besoin de déplacer des treenodes
	// Load current doc
		$ttmp = specDbsLam_transfer_getTransfer( array('filter_transferFilerecordId'=>$p_transferFilerecordId) ) ;
		$row_transfer = $ttmp['data'][0] ;
		$flow_code = $row_transfer['flow_code'] ;
		
	 
		$ttmp = specDbsLam_cfg_getMvtflow() ;
		$cfg_mvtflow = $ttmp['data'] ;
		foreach( $cfg_mvtflow as $row_mvtflow ) {
			if( $row_mvtflow['flow_code'] == $flow_code ) {
				$steps = array() ;
				foreach( $row_mvtflow['steps'] as $step ) {
					$steps[] = $step['step_code'] ;
				}
				$steps[] = 'OK' ;
			}
		}
		if( !$steps ) {
			return array('success'=>false) ;
		}
		$stepCode_idx = array_search($p_transferStepCode,$steps) ;
		$nextStepCode = $steps[$stepCode_idx+1] ;
		
		
		
		
		$ttmp = specDbsLam_transfer_getTransferLig( array('filter_transferFilerecordId'=>$p_transferFilerecordId) ) ;
		$rows_transferLig_orig = $ttmp['data'] ;
		$rows_transferLig = array() ;
		foreach( $rows_transferLig_orig as $idx => $row_transferLig ) {
			if( !in_array($row_transferLig['transferlig_filerecord_id'],$p_transferLigFilerecordId_arr) ) {
				continue ;
			}
			$rows_transferLig[] = $row_transferLig ;
			if( $row_transferLig['status_is_ok'] ) {
				$row_transferLig['step_code'] = 'OK' ;
			}
			if( $row_transferLig['step_code'] != $nextStepCode ) {
				return array('success'=>false, 'reload'=>true, 'error'=>'Invalid status for item(s) != '.$p_transferStepCode) ;
			}
		}
	
	
	$step_isFinal = $_opDB->query_uniqueValue("SELECT field_IS_ADR FROM view_bible_CFG_MVTFLOW_entry WHERE entry_key='{$p_transferStepCode}'") ;
	
	foreach( $rows_transferLig as $row_transferLig ) {
		$lastStep_log = end($row_transferLig['steps']) ;
		if( $lastStep_log['status_is_ok'] ) {
			$prevStep_log = $lastStep_log ;
			$lastStep_log = array('step_code'=>'OK') ;
		} else {
			$prevStep_log = prev($row_transferLig['steps']) ;
		}
		
		if( $lastStep_log['step_code'] != $nextStepCode ) {
			return array('success'=>false) ;
		}
		if( $prevStep_log['step_code'] != $p_transferStepCode ) {
			return array('success'=>false) ;
		}
		
		// Search STK lines
			// => is_final : recherche qte_avail
			// => !is_final : recherche qte_out
		$query_stk = "SELECT * FROM view_file_STOCK where filerecord_id='{$prevStep_log['commit_file_stock_id']}'" ;
		$res_stk = $_opDB->query($query_stk) ;
		if( !($arr_stk = $_opDB->fetch_assoc($res_stk)) ) {
			return array('success'=>false) ;
		}
		if( $arr_stk['field_ADR_ID'] != $prevStep_log['dest_adr_entry'] ) {
			return array('success'=>false) ;
		}
		
		$qte_ok = ( $step_isFinal ? $row_transferLig['mvt_qty'] == $arr_stk['field_QTY_AVAIL']
										: $row_transferLig['mvt_qty'] == $arr_stk['field_QTY_OUT'] ) ;
		if( !$qte_ok ) {
			return array('success'=>false) ;
		}
		
		if( $prevStep_log['src_adr_display'] != $prevStep_log['src_adr_entry']
			&& $prevStep_log['dest_adr_display'] != $prevStep_log['dest_adr_entry'] ) {
			$_is_TMP = TRUE ;
			$_is_TMP_prevDestAdrDisplay = $prevStep_log['dest_adr_display'] ;
		}
	}
	
	$step_isGroup = $_opDB->query_uniqueValue("SELECT field_IS_ATTACH_PARENT FROM view_bible_CFG_MVTFLOW_entry WHERE entry_key='{$p_transferStepCode}'") ;
	$step_isDetach = $_opDB->query_uniqueValue("SELECT field_IS_DETACH FROM view_bible_CFG_MVTFLOW_entry WHERE entry_key='{$p_transferStepCode}'") ;
	// SI is tmp
	//  => verif autres lignes avec la meme dest_adr_display
	if( $step_isDetach && $prevStep_log['dest_adr_display'] != $prevStep_log['dest_adr_entry'] ) {
		$_is_TMP_prevDestAdrDisplay = $prevStep_log['dest_adr_display'] ;
		$_is_TMP_count = 0 ;
		foreach( $rows_transferLig_orig as $row_transferLig ) {
			$lastStep_log = end($row_transferLig['steps']) ;
			if( $lastStep_log['status_is_ok'] ) {
				$prevStep_log = $lastStep_log ;
			} else {
				$prevStep_log = prev($row_transferLig['steps']) ;
			}
			
			if( $prevStep_log['step_code'] == $p_transferStepCode 
				&& $prevStep_log['dest_adr_display'] == $_is_TMP_prevDestAdrDisplay ) {
				
				$_is_TMP_count++ ;
			}
		}
		if( $_is_TMP_count != count($rows_transferLig) ) {
			return array('success'=>false, 'error'=>'Inconsistant level '.$_is_TMP_count.' '.count($rows_transferLig)) ;
		}
	}
	if( $step_isGroup && $prevStep_log['src_adr_display'] != $prevStep_log['src_adr_entry'] ) {
		$_is_TMP_prevSrcAdrDisplay = $prevStep_log['src_adr_display'] ;
		$_is_TMP_count = 0 ;
		foreach( $rows_transferLig_orig as $row_transferLig ) {
			$lastStep_log = end($row_transferLig['steps']) ;
			if( $lastStep_log['status_is_ok'] ) {
				$prevStep_log = $lastStep_log ;
			} else {
				$prevStep_log = prev($row_transferLig['steps']) ;
			}
			
			if( $prevStep_log['step_code'] == $p_transferStepCode 
				&& $prevStep_log['src_adr_display'] == $_is_TMP_prevSrcAdrDisplay ) {
				
				$_is_TMP_count++ ;
			}
		}
		if( $_is_TMP_count != count($rows_transferLig) ) {
			return array('success'=>false, 'error'=>'Inconsistant level') ;
		}
	}
	if( !$step_isGroup && !$step_isDetach
		&& $prevStep_log['src_adr_display'] != $prevStep_log['src_adr_entry']
		&& $prevStep_log['dest_adr_display'] != $prevStep_log['dest_adr_entry'] ) {
		
		$_is_TMP_prevSrcAdrDisplay = $prevStep_log['src_adr_display'] ;
		$_is_TMP_count = 0 ;
		foreach( $rows_transferLig_orig as $row_transferLig ) {
			$lastStep_log = end($row_transferLig['steps']) ;
			if( $lastStep_log['status_is_ok'] ) {
				$prevStep_log = $lastStep_log ;
			} else {
				$prevStep_log = prev($row_transferLig['steps']) ;
			}
			
			if( $prevStep_log['step_code'] == $p_transferStepCode 
				&& $prevStep_log['src_adr_display'] == $_is_TMP_prevSrcAdrDisplay ) {
				
				$_is_TMP_count++ ;
			}
		}
		if( $_is_TMP_count != count($rows_transferLig) ) {
			return array('success'=>false, 'error'=>'Inconsistant level') ;
		}
	}
	
	
	// verif des treenodes
	
	foreach( $rows_transferLig as $row_transferLig ) {
		$lastStep_log = end($row_transferLig['steps']) ;
		if( $lastStep_log['status_is_ok'] ) {
			$prevStep_log = $lastStep_log ;
		} else {
			$prevStep_log = prev($row_transferLig['steps']) ;
		}
		if( $prevStep_log['src_adr_display'] != $prevStep_log['src_adr_entry'] ) {
			if( !paracrm_lib_data_getRecord_bibleTreenode('ADR',$prevStep_log['src_adr_display']) ) {
				return array('success'=>false, 'error'=>'Missing master treenode') ;
			}
			if( !paracrm_lib_data_getRecord_bibleEntry( 'ADR', $prevStep_log['src_adr_entry'] ) ) {
				paracrm_lib_data_insertRecord_bibleEntry('ADR',$prevStep_log['src_adr_entry'],$prevStep_log['src_adr_display'],array('field_ADR_ID'=>$prevStep_log['src_adr_entry'])) ;
			} else {
				$query = "SELECT treenode_key FROM view_bible_ADR_entry WHERE entry_key='{$prevStep_log['src_adr_entry']}'" ;
				if( $_opDB->query_uniqueValue($query) != $prevStep_log['src_adr_display'] ) {
					//echo "attach ".$_opDB->query_uniqueValue($query)."to {$prevStep_log['src_adr_display']}" ;
					paracrm_lib_data_bibleAssignParentTreenode( 'ADR', $_opDB->query_uniqueValue($query), $prevStep_log['src_adr_display'] ) ;
				} else {
					paracrm_lib_data_bibleAssignParentTreenode( 'ADR', $_opDB->query_uniqueValue($query), 'TMP') ;
				}
			}
		}
		break ;
	}
	
	
	// ************** ROLLBACK ! *******************
	//   - del $lastStep
	//   - update mvtstep $prevStep file_stock_id = $prevStep commit_file_stock_id 
	//   - update stock position originale $prevStep src
	//    * re-création ADR entryKey  source
	//    * 
	//   - update stock > SI isFinal ALORS qte_avail > qte_out
	foreach( $rows_transferLig as $row_transferLig ) {
		$lastStep_log = end($row_transferLig['steps']) ;
		if( $lastStep_log['status_is_ok'] ) {
			if( !$step_isFinal ) {
				return array('success'=>false) ;
			}
			$prevStep_log = $lastStep_log ;
			unset($lastStep_log) ;
		} else {
			$prevStep_log = prev($row_transferLig['steps']) ;
		}
		
		
		if( $lastStep_log ) {
			paracrm_lib_data_deleteRecord_file( 'MVT_STEP' , $lastStep_log['mvtstep_filerecord_id'] ) ;
		}
		
		$arr_update = array() ;
		$arr_update['field_COMMIT_FILE_STOCK_ID'] = 0 ;
		$arr_update['field_COMMIT_DATE'] = '' ;
		$arr_update['field_COMMIT_USER'] = '' ;
		$arr_update['field_FILE_STOCK_ID'] = $prevStep_log['commit_file_stock_id'] ;
		$arr_update['field_STATUS_IS_OK'] = 0 ;
		paracrm_lib_data_updateRecord_file('MVT_STEP',$arr_update,$prevStep_log['mvtstep_filerecord_id']) ;
		
		$query = "UPDATE view_file_MVT_STEP set field_COMMIT_FILE_STOCK_ID='{$prevStep_log['commit_file_stock_id']}'
				WHERE field_COMMIT_FILE_STOCK_ID='{$prevStep_log['file_stock_id']}'" ;
		$_opDB->query($query) ;
		
		$query_stk = "SELECT * FROM view_file_STOCK where filerecord_id='{$prevStep_log['commit_file_stock_id']}'" ;
		$res_stk = $_opDB->query($query_stk) ;
		$arr_stk = $_opDB->fetch_assoc($res_stk) ;
		
		$arr_update = array() ;
		$arr_update['field_ADR_ID'] = $prevStep_log['src_adr_entry'] ;
		$arr_update['field_QTY_OUT'] = ($step_isFinal ? $arr_stk['field_QTY_AVAIL'] : $arr_stk['field_QTY_OUT']) ;
		$arr_update['field_QTY_AVAIL'] = 0 ;
		paracrm_lib_data_updateRecord_file('STOCK',$arr_update,$prevStep_log['commit_file_stock_id']) ;
	}
	
	return array('success'=>true, 'debug'=>$post_data) ;
}


?>