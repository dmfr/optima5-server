<?php

function specDbsLam_print_getDoc( $post_data ) {
	switch( $post_data['print_doc'] ) {
		case 'transfer_cdebrt' :
		return specDbsLam_print_getDoc_Brt($post_data) ;
		
		default :
		return array('success'=>false) ;
	}
}
function specDbsLam_print_getDoc_Brt( $post_data ) {
	global $_opDB ;
	
	$app_root = $GLOBALS['app_root'] ;
	$resources_root=$app_root.'/resources' ;
	$templates_dir=$resources_root.'/server/templates' ;
	$_IMG['DBS_logo_bw'] = file_get_contents($templates_dir.'/'.'DBS_logo_bw.png') ;
	
		$rows_cde = array() ;
		if( $post_data['transfer_filerecordId'] ) {
			$ttmp = specDbsLam_transfer_getTransfer( array(
				'filter_transferFilerecordId'=>$post_data['transfer_filerecordId']
			) ) ;
			$row_transfer = $ttmp['data'][0] ;
			
			$ttmp = specDbsLam_transfer_getTransferCdeLink( array(
				'filter_transferFilerecordId'=>$post_data['transfer_filerecordId']
			) ) ;
			$rows_transferCdeLink = $ttmp['data'] ;
			
			$arr_cdeIds = array() ;
			foreach( $rows_transferCdeLink as $row ) {
				$cde_filerecord_id = $row['cde_filerecord_id'] ;
				if( !in_array($cde_filerecord_id,$arr_cdeIds) ) {
					$arr_cdeIds[] = $cde_filerecord_id ;
				}
			}
			
			$ttmp = specDbsLam_cde_getGrid( array(
				'filter_cdeFilerecordId_arr'=>json_encode($arr_cdeIds)
			) ) ;
			$rows_cde = $ttmp['data'] ;
			foreach( $rows_cde as &$row_cde ) {
				$row_cde['calc_vl_nbum'] = 0 ;
				foreach( $row_cde['ligs'] as $lig ) {
					$row_cde['calc_vl_nbum'] += $lig['qty_cde'] ;
				}
			}
			unset($row_cde) ;
			//print_r($rows_cde) ;
		}
	
	$title = 'ACCOMPAGNEMENT EXPEDITION' ;
		
	$buffer = '' ;
	
		$adr = $ttmp['adr'] ;
		$rows_transferLig = $ttmp['arr'] ;
	
		$adr_str = $adr ;
		
		if( $is_first ) {
			$is_first = FALSE ;
		} else {
			$buffer.= '<DIV style="page-break-after:always"></DIV>' ;
		}
		$buffer.= '<DIV style="page-break-after:always"></DIV>' ;
		$buffer.= "<table border='0' cellspacing='1' cellpadding='1'>" ;
		$buffer.= "<tr><td width='5'/><td width='200'>" ;
		$buffer.= "</td><td valign='middle' width='400'>" ;
			$buffer.= "<table cellspacing='0' cellpadding='1'>";
			$buffer.= "<tr><td><span class=\"verybig\"><b>{$title}</b></span>&nbsp;&nbsp;<br>&nbsp;&nbsp;<big>printed on <b>".date('d/m/Y H:i')."</b></big></td></tr>" ;
			$buffer.= "<tr><td><span class=\"verybig\"><b>{$row_transfer['transfer_txt']}</b></span>&nbsp;&nbsp;<br></td></tr>" ;
			$buffer.= "</table>";
		$buffer.= "</td><td valign='middle' align='center' width='120'>" ;
			//$buffer.= "<img src=\"data:image/jpeg;base64,".base64_encode($_IMG['DBS_logo_bw'])."\" />" ;
		$buffer.= "</td></tr><tr><td height='25'/></tr></table>" ;
				
		$buffer.= "<table class='tabledonnees'>" ;
			$buffer.= '<thead>' ;
				$buffer.= "<tr>";
					$buffer.= "<th>Barcode</th>";
					$buffer.= "<th>Order</th>";
					$buffer.= "<th>Destination</th>";
					$buffer.= "<th>Nb UoM</th>";
					$buffer.= "<th>Weight(kg)</th>";
				$buffer.= "</tr>" ;
			$buffer.= '</thead>' ;
			foreach( $rows_cde as $row_cde ) {
				
				
				$buffer.= "<tr>" ;
					$buffer.= '<td align="center">' ;
						$buffer.= '<img src="data:image/jpeg;base64,'.base64_encode(specDbsLam_lib_getBarcodePng($row_transferLig['cde_filerecord_id'],30)).'" /><br>';
						$buffer.= $row_cde['cde_filerecord_id'].'<br>';
					$buffer.= '</td>' ;
					$buffer.= "<td><span class=\"mybig\">{$row_cde['cde_ref']}</span></td>" ;
					$buffer.= "<td><span class=\"mybig\">{$row_cde['adr_name']}<br>{$row_cde['adr_cp']}<br>{$row_cde['adr_country']}</span></td>" ;
					$buffer.= "<td><span class=\"mybig\">{$row_cde['calc_vl_nbum']}</span></td>" ;
					$buffer.= "<td><span class=\"mybig\">&nbsp;</span></td>" ;
					
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


?>
