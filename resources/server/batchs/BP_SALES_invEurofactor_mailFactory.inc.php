<?php
function mail_getBinary_remiseTxt( $arr_invFilerecordIds ) { // return String (binarybuffer)
	global $_opDB ;
	
	$buffer = '' ;
	foreach( $arr_invFilerecordIds as $inv_filerecord_id ) {
		$query = "SELECT i.*, c.field_FACTOR_ID as field_CUSTOMER_FACTOR_ID
			FROM view_file_INV i
			INNER JOIN view_bible_CUSTOMER_entry c ON c.entry_key = i.field_CLI_LINK
			WHERE filerecord_id='{$inv_filerecord_id}'" ;
		$result = $_opDB->query($query) ;
		$arr = $_opDB->fetch_assoc($result) ;
		
		$lig = '' ;
		$lig = substr_mklig($lig,$GLOBALS['factor_emetteur'],0,5) ;
		$lig = substr_mklig($lig,';',5,1) ;
		$lig = substr_mklig($lig,$GLOBALS['factor_client'],6,5) ;
		$lig = substr_mklig($lig,';',11,1) ;
		$lig = substr_mklig($lig,date('Ymd'),12,8) ;
		$lig = substr_mklig($lig,';',20,1) ;
		$lig = substr_mklig($lig,'D',21,1) ;
		$lig = substr_mklig($lig,';',22,1) ;
		$lig = substr_mklig($lig,$GLOBALS['factor_AFC'],23,3) ;
		$lig = substr_mklig($lig,';',26,1) ;
		$lig = substr_mklig($lig,'F',27,1) ;
		$lig = substr_mklig($lig,';',28,1) ;
		$lig = substr_mklig($lig,'EUR',29,3) ;
		$lig = substr_mklig($lig,';',32,1) ;
		$lig = substr_mklig($lig,'0000000',33,7) ;
		$lig = substr_mklig($lig,';',40,1) ;
		$lig = substr_mklig($lig,$arr['field_CUSTOMER_FACTOR_ID'],41,15) ;
		$lig = substr_mklig($lig,';',56,1) ;
		$lig = substr_mklig($lig,'',57,23) ;
		$lig = substr_mklig($lig,';',80,1) ;
		$lig = substr_mklig($lig,preg_replace("/[^a-zA-Z0-9]/", "",$arr['field_ID_INV']),81,14) ;
		$lig = substr_mklig($lig,';',95,1) ;
		$lig = substr_mklig($lig,str_pad(round(((float)$arr['field_CALC_AMOUNT_FINAL'])*100), 15, "0", STR_PAD_LEFT),96,15) ;
		$lig = substr_mklig($lig,';',111,1) ;
		$lig = substr_mklig($lig,date('Ymd',strtotime($arr['field_DATE_INVOICE'])),112,8) ;
		$lig = substr_mklig($lig,';',120,1) ;
		$lig = substr_mklig($lig,date('Ymd',strtotime('+30 days',strtotime($arr['field_DATE_INVOICE']))),121,8) ;
		$lig = substr_mklig($lig,';',129,1) ;
		$lig = substr_mklig($lig,'A',130,1) ;
		$lig = substr_mklig($lig,';',131,1) ;
		$lig = substr_mklig($lig,$arr['field_ID_CDE_REF'],132,10) ;
		$lig = substr_mklig($lig,';',142,1) ;
		$lig = substr_mklig($lig,'',143,25) ;
		$lig = substr_mklig($lig,';',168,1) ;
		$lig = substr_mklig($lig,'',169,14) ;
		$lig = substr_mklig($lig,';',183,1) ;
		$lig = substr_mklig($lig,'',184,51) ;
		$lig = substr_mklig($lig,';',235,1) ;
		$lig = substr_mklig($lig,'',236,3) ;
		$lig = substr_mklig($lig,';',239,1) ;
		$buffer.= $lig."\r\n" ;
	}
	return $buffer ;
}

function mail_getBody( $arr_invFilerecordIds ) {
	global $_opDB ;
	
	
	
	//print_r($file_CDE_SAISIE) ;
	//print_r($bible_STORE_entry) ;
	//print_r($TABfile_CDE_SAISIE_LIG) ;
	$email_text = "" ;
	$email_text.= "Société        : ".'Blue Phoenix, 1 cité Paradis, 75010 PARIS'."\r\n" ;
	$email_text.= "Factor         : ".'CA Eurofactor'."\r\n" ;
	$email_text.= "\r\n" ;
	$email_text.= "Date remise    : ".date('Y-m-d')."\r\n" ;
	$email_text.= "Ref  remise    : ".$GLOBALS['factor_ref']."\r\n" ;
	$email_text.= "Devise         : ".'EUR'."\r\n" ;
	$email_text.= "\r\n" ;
	$email_text.= "  Client       |  Date  |  Facture  |  Montant  | Echeance | Ref.cde  "."\r\n" ;
	$email_text.= "---------------|--------|-----------|-----------|----------|----------"."\r\n" ;
	
	$email_base = "               |        |           |           |          |          " ;
	
	foreach( $arr_invFilerecordIds as $inv_filerecord_id ) {
		$query = "SELECT i.*, c.field_FACTOR_ID as field_CUSTOMER_FACTOR_ID
			FROM view_file_INV i
			INNER JOIN view_bible_CUSTOMER_entry c ON c.entry_key = i.field_CLI_LINK
			WHERE filerecord_id='{$inv_filerecord_id}'" ;
		$result = $_opDB->query($query) ;
		$arr = $_opDB->fetch_assoc($result) ;
		
		$lig = $email_base ;
		$lig = substr_mklig($lig,$arr['field_CUSTOMER_FACTOR_ID'],0,15) ;
		$lig = substr_mklig($lig,date('d/m/y',strtotime($arr['field_DATE_INVOICE'])),16,8) ;
		$lig = substr_mklig($lig,preg_replace("/[^a-zA-Z0-9]/", "",$arr['field_ID_INV']),25,11) ;
		$lig = substr_mklig($lig,number_format(round($arr['field_CALC_AMOUNT_FINAL'],2),2),37,10,true) ;
		$lig = substr_mklig($lig,date('d/m/y',strtotime('+30 days',strtotime($arr['field_DATE_INVOICE']))),50,8) ;
		$lig = substr_mklig($lig,$arr['field_ID_CDE_REF'],60,10) ;
		$email_text.= $lig."\r\n" ;
		
		$total += round($arr['field_CALC_AMOUNT_FINAL'],2) ;
	}
	$email_text.= $email_base."\r\n" ;
	
	$email_text.= "\r\n" ;
	
	$lig = "Total remise TTC :" ;
	$lig = substr_mklig($lig,number_format($total,2),37,10,true) ;
	$email_text.= $lig."\r\n" ;
	
	$email_text.= "\r\n" ;
	
	return $email_text ;
}

function mailBlocage_getBody( $arr_customerEntryKeys ) {
	global $_opDB ;
	
	
	
	//print_r($file_CDE_SAISIE) ;
	//print_r($bible_STORE_entry) ;
	//print_r($TABfile_CDE_SAISIE_LIG) ;
	$email_text = "" ;
	$email_text.= "Factor         : ".'CA Eurofactor'."\r\n" ;
	$email_text.= "\r\n" ;
	$email_text.= "Date alerte    : ".date('Y-m-d')."\r\n" ;
	$email_text.= "\r\n" ;
	$email_text.= "  Customer      | Libellé client                          | FactorID  "."\r\n" ;
	$email_text.= "----------------|-----------------------------------------|-----------"."\r\n" ;
	
	$email_base = "                |                                         |           " ;
	
	foreach( $arr_customerEntryKeys as $customer_entryKey ) {
		$query = "SELECT *
			FROM view_bible_CUSTOMER_entry
			WHERE entry_key='{$customer_entryKey}'" ;
		$result = $_opDB->query($query) ;
		$arr = $_opDB->fetch_assoc($result) ;
		
		$lig = $email_base ;
		$lig = substr_mklig($lig,$arr['field_CLI_EAN'],0,15) ;
		$lig = substr_mklig($lig,$arr['field_CLI_NAME'],18,35) ;
		$email_text.= $lig."\r\n" ;
	}
	$email_text.= $email_base."\r\n" ;
	
	$email_text.= "\r\n" ;
	
	return $email_text ;
}
?>
