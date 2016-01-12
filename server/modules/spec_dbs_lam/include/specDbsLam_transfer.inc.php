<?php

function specDbsLam_transfer_getTransfer() {
	global $_opDB ;
	
	$TAB = array() ;
	
	$query = "SELECT * FROM view_file_TRANSFER ORDER BY filerecord_id DESC" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB[] = array(
			'transfer_filerecord_id' => $arr['filerecord_id'],
			'transfer_txt' => $arr['field_TRANSFER_TXT'],
			'status_code' => $arr['field_STATUS']
		);
	}
	
	return array('success'=>true, 'data'=>$TAB) ;
}
function specDbsLam_transfer_getTransferLig($post_data) {
	// jointure : voir specDbsPeople_Real_lib_getActivePeople
	
	global $_opDB ;
	
	// Load cfg attributes
	$ttmp = specDbsLam_cfg_getConfig() ;
	$json_cfg = $ttmp['data'] ;
	
	$query_innertable = "SELECT filerecord_parent_id as filerecord_id, min(filerecord_id) as filerecordstep_id FROM view_file_MVT_STEP GROUP BY filerecord_parent_id" ;
	$query = "SELECT tl.filerecord_id as transferlig_filerecord_id, tl.filerecord_parent_id as transfer_filerecord_id, mvt.*, mvtstep.field_ADR_ID as stepfirst_adr 
				FROM view_file_TRANSFER_LIG tl
				INNER JOIN view_file_MVT mvt ON mvt.filerecord_id = tl.field_FILE_MVT_ID
				INNER JOIN ($query_innertable) mvtlink ON mvtlink.filerecord_id = mvt.filerecord_id
				INNER JOIN view_file_MVT_STEP mvtstep ON mvtstep.filerecord_id = mvtlink.filerecordstep_id" ;
	if( $post_data['filter_transferFilerecordId'] ) {
		$query.= " WHERE tl.filerecord_parent_id='{$post_data['filter_transferFilerecordId']}'" ;
	}
	$query.= " ORDER BY mvt.filerecord_id DESC" ;
	$result = $_opDB->query($query) ;
	
	$TAB = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$row = array(
			'transfer_filerecord_id' => $arr['transfer_filerecord_id'],
			'transferlig_filerecord_id' => $arr['transferlig_filerecord_id'],
			'stk_prod' => $arr['field_PROD_ID'],
			'stk_batch' => $arr['field_SPEC_BATCH'],
			'stk_sn' => $arr['field_SPEC_SN'],
			'mvt_qty' => $arr['field_QTY_MVT'],
			'src_adr' => $arr['stepfirst_adr']
		);
		foreach( $json_cfg['cfg_attribute'] as $stockAttribute_obj ) {
			if( !$stockAttribute_obj['STOCK_fieldcode'] ) {
				continue ;
			}
			$mkey = $stockAttribute_obj['mkey'] ;
			$STOCK_fieldcode = $stockAttribute_obj['STOCK_fieldcode'] ;
			$row[$mkey] = $arr[$STOCK_fieldcode] ;
		}
		
		$TAB[] = $row ;
	}
	return array('success'=>true, 'data'=>$TAB) ;
}







function specDbsLam_transfer_addStock( $post_data ) {
	global $_opDB ;
	
	$transfer_filerecordId = $post_data['transfer_filerecordId'] ;
	$stock_filerecordIds = json_decode($post_data['stock_filerecordIds'],true) ;
	
	//controle $transfer_filerecordId ?
	
	
	foreach( $stock_filerecordIds as $stock_filerecordId ) {
		$mvt_filerecordId = specDbsLam_lib_procMvt_addStock( $stock_filerecordId ) ;
		if( !$mvt_filerecordId ){
			continue ;
		}
		$query = "SELECT * FROM view_file_MVT WHERE filerecord_id='{$mvt_filerecordId}'" ;
		$result = $_opDB->query($query) ;
		$row_mvt = $_opDB->fetch_assoc($result) ;
		
		$transfer_row = array(
			'field_STATUS' => 'T01_INIT',
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
function specDbsLam_transfer_commit( $post_data ) {
	global $_opDB ;
	
	$transferLig_filerecordIds = json_decode($post_data['transferLig_filerecordIds'],true) ;
	
	
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
	
	$arr_ins = array(
		'field_STATUS' => 'T01_INIT',
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



?>