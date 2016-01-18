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
			'step_code' => $arr['field_STEP_CODE'],
			'whse_src' => $arr['field_WHSE_SRC'],
			'whse_dest' => $arr['field_WHSE_DEST'],
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
	
	$query = "SELECT tl.filerecord_id as transferlig_filerecord_id, tl.filerecord_parent_id as transfer_filerecord_id, tl.*, mvt.*, mvtstep.*
					, sadr.entry_key as src_adr_entry, sadr.treenode_key as src_adr_treenode
					, dadr.entry_key as dest_adr_entry, dadr.treenode_key as dest_adr_treenode
				FROM view_file_TRANSFER_LIG tl
				INNER JOIN view_file_MVT mvt ON mvt.filerecord_id = tl.field_FILE_MVT_ID
				INNER JOIN view_file_MVT_STEP mvtstep ON mvtstep.filerecord_parent_id = mvt.filerecord_id
				LEFT OUTER JOIN view_bible_ADR_entry sadr ON sadr.entry_key = mvtstep.field_SRC_ADR_ID
				LEFT OUTER JOIN view_bible_ADR_entry dadr ON dadr.entry_key = mvtstep.field_DEST_ADR_ID" ;
	if( $post_data['filter_transferFilerecordId'] ) {
		$query.= " WHERE tl.filerecord_parent_id='{$post_data['filter_transferFilerecordId']}'" ;
	}
	$query.= " ORDER BY mvt.filerecord_id DESC, mvtstep.field_STEP_CODE ASC" ;
	$result = $_opDB->query($query) ;
	
	$TAB = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$filerecord_id = $arr['transferlig_filerecord_id'] ;
		if( !isset($TAB[$filerecord_id]) ) {
			$row = array(
				'transfer_filerecord_id' => $arr['transfer_filerecord_id'],
				'transferlig_filerecord_id' => $arr['transferlig_filerecord_id'],
				'stk_prod' => $arr['field_PROD_ID'],
				'stk_batch' => $arr['field_SPEC_BATCH'],
				'stk_sn' => $arr['field_SPEC_SN'],
				'mvt_qty' => $arr['field_QTY_MVT'],
				'src_adr' => NULL,
				'current_adr' => NULL,
				'current_adr_tmp' => NULL,
				'steps' => array(),
				'status_is_reject' => $arr['field_STATUS_IS_REJECT'],
				'reject_arr' => explode(',',$arr['field_REJECT_ARR'])
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
			'step_code' => $arr['field_STEP_CODE'],
			'src_adr_entry' =>  $arr['src_adr_entry'],
			'src_adr_treenode' => $arr['src_adr_treenode'],
			'src_adr_display' =>  $arr['field_SRC_ADR_DISPLAY'],
			'dest_adr_entry' =>  $arr['dest_adr_entry'],
			'dest_adr_treenode' => $arr['dest_adr_treenode'],
			'dest_adr_display' =>  $arr['field_DEST_ADR_DISPLAY'],
			'status_is_ok' =>  $arr['field_STATUS_IS_OK'],
			'commit_date' => $arr['field_COMMIT_DATE'],
			'commit_user' => $arr['field_COMMIT_USER']
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
				$row_transferlig['current_adr_tmp'] = ($row_transferlig_step['src_adr_display']!=$row_transferlig_step['src_adr_entry']) ; ;
				break ;
			}
			if( $row_transferlig_step['status_is_ok'] && ($idx==count($row_transferlig['steps'])-1) ) {
				$row_transferlig['current_adr'] = $row_transferlig_step['dest_adr_display'] ;
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
		paracrm_lib_data_insertRecord_file('TRANSFER_LIG',$transfer_filerecordId,$transfer_row) ;
	}
	
	
	return array('success'=>true) ;
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
	
		$transfer_filerecordId = $post_data['transfer_filerecordId'] ;
	
		$query = "SELECT * FROM view_file_TRANSFER WHERE filerecord_id='{$transfer_filerecordId}'" ;
		$result = $_opDB->query($query) ;
		$row_transfer = $_opDB->fetch_assoc($result) ;
	
		$ttmp = specDbsLam_transfer_getTransferLig( array('filter_transferFilerecordId'=>$transfer_filerecordId) ) ;
		$rows_transferLig = $ttmp['data'] ;
	
	$buffer = '' ;
	$buffer.= "<table border='0' cellspacing='1' cellpadding='1'>" ;
	$buffer.= "<tr><td width='5'/><td width='250'>" ;
		$buffer.= '<div align="center">' ;
		$buffer.= '<img src="data:image/jpeg;base64,'.base64_encode(specDbsLam_lib_getBarcodePng($transfer_filerecordId,75)).'" /><br>' ;
		$buffer.= $transfer_filerecordId.'<br>' ;
		$buffer.= '</div>' ;
	$buffer.= "</td><td valign='middle'>" ;
		$buffer.= "<table cellspacing='0' cellpadding='1'>";
		$buffer.= "<tr><td><span class=\"mybig\">TRANSFER DOCUMENT</span></td></tr>" ;
		//{$data_commande['date_exp']}
		$buffer.= "<tr><td><span class=\"verybig\"><b>{$row_transfer['field_TRANSFER_TXT']}</b></span>&nbsp;&nbsp;-&nbsp;&nbsp;<big>printed on <b>".date('d/m/Y H:i')."</b></big></td></tr>" ;
		$buffer.= "</table>";
	$buffer.= "</td></tr><tr><td height='25'/></tr></table>" ;
			
	$buffer.= "<table class='tabledonnees'>" ;
		$buffer.= '<thead>' ;
			$buffer.= "<tr>";
				$buffer.= "<th>Barcode</th>";
				$buffer.= "<th>Source</th>";
				$buffer.= "<th>PartNumber</th>";
				$buffer.= "<th>Batch</th>";
				$buffer.= "<th>Qty</th>";
				$buffer.= "<th>SN</th>";
			$buffer.= "</tr>" ;
		$buffer.= '</thead>' ;
		foreach( $rows_transferLig as $row_transferLig ) {
			$buffer.= "<tr>" ;
				$buffer.= '<td align="center">' ;
					$buffer.= '<img src="data:image/jpeg;base64,'.base64_encode(specDbsLam_lib_getBarcodePng($row_transferLig['transferlig_filerecord_id'],40)).'" /><br>';
					$buffer.= $row_transferLig['transferlig_filerecord_id'].'<br>';
				$buffer.= '</td>' ;
				$buffer.= "<td><span class=\"\">{$row_transferLig['src_adr']}</span></td>" ;
				$buffer.= "<td><span class=\"mybig\">{$row_transferLig['stk_prod']}</span></td>" ;
				$buffer.= "<td><span class=\"\">{$row_transferLig['stk_batch']}</span></td>" ;
				$buffer.= "<td align='right'><span class=\"mybig\"><b>".(float)$row_transferLig['mvt_qty']."</b></span></td>" ;
				$buffer.= "<td><span class=\"\">{$row_transferLig['stk_sn']}</span></td>" ;
			$buffer.= "</tr>" ;
		}
	$buffer.= "</table>" ;
	
	
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
		'field_STEP_CODE' => $init_mvtflowstep,
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
		paracrm_lib_data_updateRecord_file('TRANSFER_LIG',$arr_update,$transferLigFilerecordId) ;
	}
	
	specDbsLam_transfer_lib_advanceDoc($post_data['transferFilerecordId']) ;
	
	return array('success'=>true, 'debug'=>$post_data) ;
}

function specDbsLam_transfer_lib_cleanAdr() {
	global $_opDB ;

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
	$_opDB->query($query) ;
}
function specDbsLam_transfer_commitAdrTmp($post_data) {
	global $_opDB ;
	$prefix_TMP = 'TMP_' ;
	
	$p_transferFilerecordId = $post_data['transferFilerecordId'] ;
	$p_transferLigFilerecordId_arr = json_decode($post_data['transferLigFilerecordId_arr'],true) ;
	
	
	// **** Vérifs STEP *****
	//  - step <> is_final
	//  - 
	
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
		// search common treenode ?
		$arr_arrTreenodes = array() ;
		foreach( $rows_transferLig as $idx => $row_transferLig ) {
			foreach( $row_transferLig['steps'] as $row_transferLigStep ) {
				if( !$row_transferLigStep['status_is_ok'] ) {
					$arr_treenodes = array($row_transferLigStep['src_adr_treenode']) ;
					$cur_treenode = $row_transferLigStep['src_adr_treenode'] ;
					while(TRUE) {
						$query = "SELECT treenode_parent_key FROM view_bible_ADR_tree WHERE treenode_key='{$cur_treenode}'" ;
						$cur_treenode = $_opDB->query_uniqueValue($query) ;
						if( !$cur_treenode || $cur_treenode == '&' ) {
							break ;
						}
						$arr_treenodes[] = $cur_treenode ;
					}
					$arr_arrTreenodes[] = $arr_treenodes ;
					break ;
				}
			}
		}
		if( count($arr_arrTreenodes) > 1 ) {
			$full=call_user_func_array('array_intersect', $arr_arrTreenodes);
		} else {
			$full = reset($arr_arrTreenodes) ;
		}
		$unique_treenode = reset($full) ;
		
		
		$step_isGroup = $_opDB->query_uniqueValue("SELECT field_IS_ATTACH_PARENT FROM view_bible_CFG_MVTFLOW_entry WHERE entry_key='{$current_step_code}'") ;
		/*
		 * if step = GROUP => attach common treenode (pallet ?) to a primary root treenode (truck ?)
		 * if step NOT GROUP => attach common treenode (pallet ?) to root TMP
		*/
		if( $step_isGroup ) {
			$location_treenodeKey = 'TMP_'.$post_data['location'] ;
			if( !paracrm_lib_data_getRecord_bibleTreenode('ADR',$location_treenodeKey) ) {
				paracrm_lib_data_insertRecord_bibleTreenode('ADR',$location_treenodeKey,'TMP',array('field_ROW_ID'=>$location_treenodeKey)) ;
			}
			paracrm_lib_data_bibleAssignParentTreenode( 'ADR', $unique_treenode, $location_treenodeKey ) ;
		} else {
			$location_treenodeKey = $unique_treenode ;
			paracrm_lib_data_bibleAssignParentTreenode( 'ADR', $unique_treenode, 'TMP' ) ;
		}
	} else {
		// CREATE PARENT LOCATION
		$location_treenodeKey = 'TMP_'.$post_data['location'] ;
		if( !paracrm_lib_data_getRecord_bibleTreenode('ADR',$location_treenodeKey) ) {
			paracrm_lib_data_insertRecord_bibleTreenode('ADR',$location_treenodeKey,'TMP',array('field_ROW_ID'=>$location_treenodeKey)) ;
		} else {
			paracrm_lib_data_bibleAssignParentTreenode( 'ADR', $location_treenodeKey, 'TMP' ) ;
		}
	}
	$location_display = $location_treenodeKey ;
	
	
	
	foreach( $p_transferLigFilerecordId_arr as $transferLig_filerecordId ) {
		$location_entryKey = 'TMP_POS_'.$transferLig_filerecordId ;
		paracrm_lib_data_insertRecord_bibleEntry('ADR',$location_entryKey,$location_treenodeKey,array('field_ADR_ID'=>$location_entryKey)) ;
	
	
		// mvt ID ?
		$query = "SELECT field_FILE_MVT_ID FROM view_file_TRANSFER_LIG WHERE filerecord_id='{$transferLig_filerecordId}'" ;
		$mvt_filerecordId = $_opDB->query_uniqueValue($query) ;
		if( !$mvt_filerecordId ) {
			continue ;
		}
		if( specDbsLam_lib_procMvt_commit($mvt_filerecordId, $location_entryKey, $location_display, $next_step_code ) ) {
			$arr_update = array();
			$arr_update['field_STATUS_IS_REJECT'] = FALSE ;
			$arr_update['field_REJECT_ARR'] = NULL ;
			$arr_update['field_STEP_CODE'] = $next_step_code ;
			paracrm_lib_data_updateRecord_file('TRANSFER_LIG',$arr_update,$transferLig_filerecordId) ;
		}
	}
	
	
	specDbsLam_transfer_lib_advanceDoc($post_data['transferFilerecordId']) ;
	specDbsLam_transfer_lib_cleanAdr() ;
	
	return array('success'=>true, 'debug'=>$post_data) ;
}
function specDbsLam_transfer_commitAdrFinal($post_data) {
	global $_opDB ;
	
	$p_transferFilerecordId = $post_data['transferFilerecordId'] ;
	$p_transferLigFilerecordId_arr = json_decode($post_data['transferLigFilerecordId_arr'],true) ;
	
	// Load cfg attributes
	$ttmp = specDbsLam_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	
	
	
	
	$form_data = array() ;
	$form_data['stockAttributes_obj'] = array() ;
	
	$stockAttributes_obj = json_decode($post_data['stockAttributes_obj'],true) ;
	foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
		if( !$stockAttribute_obj['PROD_fieldcode'] ) {
			continue ;
		}
		$mkey = $stockAttribute_obj['mkey'] ;
		$STOCK_fieldcode = $stockAttribute_obj['STOCK_fieldcode'] ;
		$form_data['stockAttributes_obj'][mkey] = $stockAttributes_obj[$mkey] ;
	}
	
	
	// Load current ligs
	$ttmp = specDbsLam_transfer_getTransferLig( array('filter_transferFilerecordId'=>$p_transferFilerecordId) ) ;
	$rows_transferLig = $ttmp['data'] ;
	foreach( $rows_transferLig as $idx => $row_transferLig ) {
		if( !in_array($row_transferLig['transferlig_filerecord_id'],$p_transferLigFilerecordId_arr) ) {
			unset($rows_transferLig[$idx]) ;
		}
	}
	if( count($rows_transferLig) != 1 ) {
		// count ?
		return array('success'=>false) ;
	}
	$form_data['mvt_obj'] = array() ;
	$form_data['mvt_obj']['prod_id'] = $rows_transferLig[0]['stk_prod'] ;
	$form_data['mvt_obj']['batch'] = $rows_transferLig[0]['stk_batch'] ;
	
	
	
	$adr_obj = specDbsLam_lib_proc_findAdr( $form_data['mvt_obj'], $form_data['stockAttributes_obj'], array() ) ;
	if( !$adr_obj['adr_id'] ) {
		$return = array('success'=>false, 'error'=>'Pas d\'emplacement disponible.') ;
		break ;
	}
	
	
	foreach( $p_transferLigFilerecordId_arr as $transferLig_filerecordId ) {
		// mvt ID ?
		$query = "SELECT field_FILE_MVT_ID FROM view_file_TRANSFER_LIG WHERE filerecord_id='{$transferLig_filerecordId}'" ;
		$mvt_filerecordId = $_opDB->query_uniqueValue($query) ;
		if( !$mvt_filerecordId ) {
			continue ;
		}
		if( specDbsLam_lib_procMvt_commit($mvt_filerecordId, $adr_obj['adr_id'], $adr_obj['adr_id'], NULL ) ) {
			$arr_update = array();
			$arr_update['field_STATUS_IS_REJECT'] = FALSE ;
			$arr_update['field_REJECT_ARR'] = NULL ;
			$arr_update['field_STEP_CODE'] = NULL ;
			paracrm_lib_data_updateRecord_file('TRANSFER_LIG',$arr_update,$transferLigFilerecordId) ;
		}
	}
	
	
	

	specDbsLam_transfer_lib_advanceDoc($post_data['transferFilerecordId']) ;
	specDbsLam_transfer_lib_cleanAdr() ;
	
	return array('success'=>true, 'data'=> $adr_obj) ;
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
		$arr_update['field_STEP_CODE'] = reset($statuses) ;
		$arr_cond = array() ;
		$arr_cond['filerecord_id'] = $transfer_filerecordId ;
		$_opDB->update('view_file_TRANSFER',$arr_update,$arr_cond) ;
	}
	return ;
}

?>