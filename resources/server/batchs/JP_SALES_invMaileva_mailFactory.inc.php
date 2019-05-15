<?php

function xmlUtil_parseAdr( $adr_string ) {
	$adr_string = trim($adr_string) ;
	$pxml = '' ;
	
	$adr_array = array() ;
	foreach( explode("\n",$adr_string) as $adr_line ) {
		$adr_line = trim($adr_line) ;
		if( !$adr_line ) {
			continue ;
		}
		$adr_array[] = $adr_line ;
	}
	
	$pxml.= '<com:AddressLines>' ;
	for( $i=0 ; $i<count($adr_array)-1 ; $i++ ) {
		$adr_line = $adr_array[$i] ;
		$cnt = $i+1 ;
		$pxml.= "<com:AddressLine{$cnt}>{$adr_line}</com:AddressLine{$cnt}>" ;
	}
	$pxml.= "<com:AddressLine6>".end($adr_array)."</com:AddressLine6>" ;
	$pxml.= '</com:AddressLines>' ;
	return $pxml ;
}

function xml_getContents( $inv_filerecord_id, $track_email ) {
	global $_opDB ;
	
	$track_id = 'JP-INV-'.$inv_filerecord_id ;
	
	$auth_user = '' ;
	$auth_pass = '' ;

	$randomId = rand( pow(10,5) , pow(10,6)-1 ) ;
	
	$query = "SELECT i.*
		FROM view_file_INV i
		INNER JOIN view_bible_CUSTOMER_entry c ON c.entry_key = i.field_CLI_LINK
		WHERE filerecord_id='{$inv_filerecord_id}'" ;
	$result = $_opDB->query($query) ;
	$arr = $_opDB->fetch_assoc($result) ;
	if( !$arr ) {
		return NULL ;
	}
	
	if( trim($arr['field_ADR_SENDTO']) ) {
		$adr_string = $arr['field_ADR_SENDTO'] ;
	} elseif( trim($arr['field_ADR_INVOICE']) ) {
		$adr_string = $arr['field_ADR_INVOICE'] ;
	} else {
		$adr_string = $arr['field_ADR_SHIP'] ;
	}
	
	$json = specBpSales_inv_printDoc( array('inv_filerecord_id'=>$inv_filerecord_id) ) ;
	if( !$json['success'] ) {
		return NULL ;
	}
	$inv_html = $json['html'] ;
	$inv_pdf = specBpSales_util_htmlToPdf_buffer( $inv_html ) ;
	$pdf_pageCount = preg_match_all("/\/Page\W/", $inv_pdf, $dummy);
	$pdf_pageCount = ( $pdf_pageCount >= 1 ? $pdf_pageCount : 1 ) ;
	$pdf_size = strlen($inv_pdf) ;
	$pdf_base64 = base64_encode($inv_pdf) ;
	//$pdf_base64 = NULL ;
	
	$xml = '' ;
	
	$xml.= '<con:submit xmlns:con="http://connector.services.siclv2.maileva.fr/">' ;
	
	$xml.= '<campaign Version="1.1" TrackId="mon exemple" Application="mailing app" xmlns:com="http://www.maileva.fr/CommonSchema" xmlns:pjs="http://www.maileva.fr/MailevaPJSSchema" xmlns:spec="http://www.maileva.fr/MailevaSpecificSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' ;
	
	/*
	$xml.= '<pjs:User AuthType="PLAINTEXT">' ;
	$xml.= '<pjs:Login>testclient</pjs:Login>' ;
	$xml.= '<pjs:Password>testclient</pjs:Password>' ;
	$xml.= '</pjs:User>' ;
	*/
	
	$xml.= '<pjs:Requests>' ;
	$xml.= "<pjs:Request MediaType=\"PAPER\" TrackId=\"{$track_id}\">" ;
	
	$xml.= '<pjs:Recipients>' ;
	$xml.= '<pjs:Internal>' ;
	$xml.= "<pjs:Recipient Id=\"{$randomId}\">" ;
	$xml.= '<com:PaperAddress>' ;
	$xml.= xmlUtil_parseAdr( $adr_string ) ;
	$xml.= '</com:PaperAddress>' ;
	$xml.= '</pjs:Recipient>' ;
	$xml.= '</pjs:Internal>' ;
	$xml.= '</pjs:Recipients>' ;
	
	$xml.= '<pjs:DocumentData>' ;
	$xml.= '<pjs:Documents>' ;
	$xml.= "<pjs:Document Name=\"flux.pdf\" Id=\"001\">" ;
	$xml.= "<com:Size>{$pdf_size}</com:Size>" ;
	$xml.= "<com:Content>" ;
	$xml.= "<com:Value>{$pdf_base64}</com:Value>" ;
	$xml.= "</com:Content>" ;
	$xml.= "</pjs:Document>" ;
	$xml.= "</pjs:Documents>" ;
	$xml.= "</pjs:DocumentData>" ;
	
	$xml.= '<pjs:Options>' ;
	$xml.= '<pjs:RequestOption>' ;
	$xml.= '<spec:PaperOption>' ;
	$xml.= '<spec:FoldOption>' ;
	$xml.= '<spec:DocumentOption>' ;
	$xml.= '<spec:PrintDuplex>1</spec:PrintDuplex>' ;
	$xml.= '<spec:PageOption>' ;
	$xml.= '<spec:PrintColor>1</spec:PrintColor>' ;
	$xml.= '</spec:PageOption>' ;
	$xml.= '</spec:DocumentOption>' ;
	$xml.= '<spec:EnvelopeType>C6</spec:EnvelopeType>' ;
	$xml.= '<spec:PostageClass>STANDARD</spec:PostageClass>' ;
	$xml.= '<spec:UseFlyLeaf>1</spec:UseFlyLeaf>' ;
	$xml.= '<spec:DocumentOption>' ;
	$xml.= '<spec:PrintDuplex>0</spec:PrintDuplex>' ;
	$xml.= '</spec:DocumentOption>' ;
	$xml.= '</spec:FoldOption>' ;
	$xml.= '</spec:PaperOption>' ;
	$xml.= '</pjs:RequestOption>' ;
	$xml.= '</pjs:Options>' ;
	
	$xml.= '<pjs:Folds>' ;
	$xml.= "<pjs:Fold Id=\"{$randomId}\">" ;
	$xml.= "<pjs:RecipientId>{$randomId}</pjs:RecipientId>" ;
	$xml.= '<pjs:Documents>' ;
	$xml.= "<pjs:Document DocumentId=\"001\" FirstPage=\"1\" LastPage=\"{$pdf_pageCount}\">" ;
	$xml.= '</pjs:Document>' ;
	$xml.= '</pjs:Documents>' ;
	$xml.= '</pjs:Fold>' ;
	$xml.= '</pjs:Folds>' ;
	
	
	$xml.= '<pjs:Notifications>' ;
	$xml.= '<pjs:Notification Type="GENERAL">' ;
	$xml.= '<spec:Format>XML</spec:Format>' ;
	$xml.= '<spec:Protocols>' ;
		$xml.= '<spec:Protocol>' ;
			$xml.= "<spec:Ws />" ;
		$xml.= '</spec:Protocol>' ;
		$xml.= '<spec:Protocol>' ;
			$xml.= "<spec:Email>{$track_email}</spec:Email>" ;
		$xml.= '</spec:Protocol>' ;
	$xml.= '</spec:Protocols>' ;
	$xml.= '</pjs:Notification>' ;
	$xml.= '</pjs:Notifications>' ;

	
	$xml.= '</pjs:Request>' ;
	$xml.= '</pjs:Requests>' ;
	
	$xml.= '</campaign>' ;
	
	$xml.= '</con:submit>' ;
	
	return $xml ;
}

?>
