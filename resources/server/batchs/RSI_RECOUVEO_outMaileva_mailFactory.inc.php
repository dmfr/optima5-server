<?php

function xmlUtil_parseAdr( $adr_string ) {
	$adr_string = trim($adr_string) ;
	
	$adr_array = array() ;
	foreach( explode("\n",$adr_string) as $adr_line ) {
		$adr_line = trim($adr_line) ;
		$adr_line = str_replace('&','et',$adr_line) ;
		if( !trim($adr_line) ) {
			continue ;
		}
		$adr_array[] = $adr_line ;
	}
	
	$isCpVilleLine = function( $str ) {
		// multiword ? + hasDigits ?
		$words = explode(' ',$str) ;
		if( count($words) <= 1 ) {
			return FALSE ;
		}
		foreach( $words as $word ) {
			if( preg_match('~[0-9]~', $word) ) {
				return TRUE ;
			}
		}
	};
	$isFr = function( &$adr_array ) use($isCpVilleLine)  {
		$cnt = count($adr_array) ;
		$last_idx = $cnt - 1 ;
		$beforelast_idx = $cnt - 2 ;
		$last_line = $adr_array[$last_idx] ;
		$beforelast_line = $adr_array[$beforelast_idx] ;
		if( in_array(strtolower($last_line),array('france','fr')) ) {
			unset($adr_array[$last_idx]) ;
			return TRUE ;
		}
		if( $isCpVilleLine($last_line) ) {
			return TRUE ;
		}
		return FALSE ;
	};
	$sanitizeFrCpVilleLine = function( $line ) {
		$words = explode(' ',$line) ;
		$cp_word = $words[0] ;
		$cp_word = str_pad($cp_word, 5, "0", STR_PAD_LEFT) ;
		$words[0] = $cp_word ;
		return implode(' ',$words) ;
	};
	
	if( $isFr($adr_array) ) {
		$pxml = '' ;
		$pxml.= '<com:AddressLines>' ;
		for( $i=0 ; $i<count($adr_array)-1 ; $i++ ) {
			$adr_line = $adr_array[$i] ;
			$cnt = $i+1 ;
			$pxml.= "<com:AddressLine{$cnt}>{$adr_line}</com:AddressLine{$cnt}>" ;
		}
		$pxml.= "<com:AddressLine6>".$sanitizeFrCpVilleLine(end($adr_array))."</com:AddressLine6>" ;
		$pxml.= '</com:AddressLines>' ;
	} else {
		$country = array_pop($adr_array) ;
		
		$pxml = '' ;
		$pxml.= '<com:AddressLines>' ;
		for( $i=0 ; $i<count($adr_array)-1 ; $i++ ) {
			$adr_line = $adr_array[$i] ;
			$cnt = $i+1 ;
			$pxml.= "<com:AddressLine{$cnt}>{$adr_line}</com:AddressLine{$cnt}>" ;
		}
		$pxml.= "<com:AddressLine6>".end($adr_array)."</com:AddressLine6>" ;
		$pxml.= '</com:AddressLines>' ;
		if( strlen($country) > 2 ) {
			$pxml.= "<com:Country>{$country}</com:Country>" ;
		} else {
			$pxml.= "<com:CountryCode>{$country}</com:CountryCode>" ;
		}
	}
	return $pxml ;
}

function xml_getContents( $env_id, $track_email ) {
	global $_opDB ;
	
	$auth_user = '' ;
	$auth_pass = '' ;

	$randomId = rand( pow(10,5) , pow(10,6)-1 ) ;
	
	$query = "SELECT e.*
		FROM view_file_ENVELOPE e
		WHERE e.filerecord_id='{$env_id}'" ;
	$result = $_opDB->query($query) ;
	$db = $_opDB->fetch_assoc($result) ;
	if( !$db ) {
		return NULL ;
	}
	
	$adr_string = $db['field_PEER_ADR'] ;
	
	
	$map_docIdx_pdfData = array() ;
	$query = "SELECT ed.filerecord_id AS doc_filerecord_id FROM view_file_ENVELOPE_DOC ed
				WHERE filerecord_parent_id='{$env_id}' ORDER BY filerecord_id" ;
	$result = $_opDB->query($query) ;
	$idx = 0 ;
	while( ($arr=$_opDB->fetch_row($result)) != FALSE ) {
		$doc_filerecord_id = $arr[0] ;
		
		$idx++ ;
		$doc_idx = str_pad((string)$idx, 3, "0", STR_PAD_LEFT) ;
		
		media_contextOpen($GLOBALS['_sdomain_id']) ;
		$inv_pdf = media_pdf_getBinary(media_pdf_toolFile_getId('ENVELOPE_DOC',$doc_filerecord_id)) ;
		media_contextClose() ;
		
		$pdf_pageCount = preg_match_all("/\/Page\W/", $inv_pdf, $dummy);
		$pdf_pageCount = ( $pdf_pageCount >= 1 ? $pdf_pageCount : 1 ) ;
		$pdf_size = strlen($inv_pdf) ;
		$pdf_base64 = base64_encode($inv_pdf) ;
		
		$map_docIdx_pdfData[$doc_idx] = array(
			'pdf_pageCount' => $pdf_pageCount,
			'pdf_size' => $pdf_size,
			'pdf_base64' => $pdf_base64
		) ;
	}
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
	$xml.= "<pjs:Request MediaType=\"PAPER\" TrackId=\"{$env_id}\">" ;
	
	$xml.= '<pjs:Recipients>' ;
	$xml.= '<pjs:Internal>' ;
	$xml.= "<pjs:Recipient Id=\"{$randomId}\">" ;
	$xml.= '<com:PaperAddress>' ;
	$xml.= xmlUtil_parseAdr( $db['field_RECEP_ADR'] ) ;
	$xml.= '</com:PaperAddress>' ;
	$xml.= '</pjs:Recipient>' ;
	$xml.= '</pjs:Internal>' ;
	$xml.= '</pjs:Recipients>' ;
	
	$xml.= '<pjs:Senders>' ;
	$xml.= "<pjs:Sender Id=\"01\">" ;
	$xml.= '<com:PaperAddress>' ;
	$xml.= xmlUtil_parseAdr( $db['field_SENDER_ADR'] ) ;
	$xml.= '</com:PaperAddress>' ;
	$xml.= '</pjs:Sender>' ;
	$xml.= '</pjs:Senders>' ;
	
	$xml.= '<pjs:DocumentData>' ;
	$xml.= '<pjs:Documents>' ;
	foreach( $map_docIdx_pdfData as $doc_idx => $pdf_data ) {
		$xml.= "<pjs:Document Name=\"doc{$doc_idx}.pdf\" Id=\"{$doc_idx}\">" ;
		$xml.= "<com:Size>{$pdf_data['pdf_size']}</com:Size>" ;
		$xml.= "<com:Content>" ;
		$xml.= "<com:Value>{$pdf_data['pdf_base64']}</com:Value>" ;
		$xml.= "</com:Content>" ;
		$xml.= "</pjs:Document>" ;
	}
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
	$xml.= '<spec:EnvelopeWindowType>DBL</spec:EnvelopeWindowType>' ;
	$xml.= '<spec:PostageClass>STANDARD</spec:PostageClass>' ;
	$xml.= '<spec:UseFlyLeaf>0</spec:UseFlyLeaf>' ;
	$xml.= '<spec:PrintSenderAddress>0</spec:PrintSenderAddress>' ;
	$xml.= '<spec:PrintRecipTrackId>1</spec:PrintRecipTrackId>' ;
	$xml.= '<spec:DocumentOption>' ;
	$xml.= '<spec:PrintDuplex>1</spec:PrintDuplex>' ;
	$xml.= '</spec:DocumentOption>' ;
	$xml.= '</spec:FoldOption>' ;
	$xml.= '</spec:PaperOption>' ;
	$xml.= '</pjs:RequestOption>' ;
	$xml.= '</pjs:Options>' ;
	
	$xml.= '<pjs:Folds>' ;
	$xml.= "<pjs:Fold Id=\"{$randomId}\" TrackId=\"{$db['field_ENV_REF']}\">" ;
	$xml.= "<pjs:RecipientId>{$randomId}</pjs:RecipientId>" ;
	$xml.= "<pjs:SenderId>01</pjs:SenderId>" ;
	$xml.= '<pjs:Documents>' ;
	foreach( $map_docIdx_pdfData as $doc_idx => $pdf_data ) {
		$xml.= "<pjs:Document DocumentId=\"001\" FirstPage=\"1\" LastPage=\"{$pdf_data['pdf_pageCount']}\">" ;
		$xml.= '</pjs:Document>' ;
	}
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
