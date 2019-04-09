<?php
function lookup_factorSiret( $customer_entryKey ) {
	//Query customer
	$customer_entry = paracrm_lib_data_getRecord_bibleEntry('CUSTOMER',$customer_entryKey) ;
	return iconv( 'UTF-8', 'ASCII//TRANSLIT//IGNORE', $customer_entry['field_CLI_SIRET'] );
}

function parseAdr( $adr_string ) {
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
	
	$map_adr = array() ;
	$map_adr['nom'] = $adr_array[0] ;
	for( $i=1 ; $i<count($adr_array)-1 ; $i++ ) {
		$adr_line = $adr_array[$i] ;
		$mkey = 'adr'.$i ;
		$map_adr[$mkey] = $adr_line ;
	}
	$last_line = end($adr_array) ;
	$last_lineArr = explode(' ',$last_line,2) ;
	if( strlen($last_lineArr[0]) != 5 ) {
		return NULL ;
	}
	$map_adr['cp'] = $last_lineArr[0] ;
	$map_adr['ville'] = $last_lineArr[1] ;
	
	
	foreach( $map_adr as &$line ) {
		$line = iconv( 'UTF-8', 'ASCII//TRANSLIT//IGNORE', $line );
		$line = strtoupper($line) ;
	}
	unset($line) ;
	
	
	return $map_adr ;
}



function mail_getBinary_remiseTxt( $arr_invFilerecordIds ) { // return String (binarybuffer)
	global $_opDB ;
	
	$prefix = 'FACTOR' ;
	$_opDB->query("LOCK TABLES view_file_Z_ATTRIB WRITE") ;
	$query = "UPDATE view_file_Z_ATTRIB set field_ID=field_ID+'1' WHERE field_FILE_CODE='{$prefix}'" ;
	$_opDB->query($query) ;
	$query = "SELECT field_ID FROM view_file_Z_ATTRIB WHERE field_FILE_CODE='{$prefix}'" ;
	$id = (int)$_opDB->query_uniqueValue($query) ;
	$_opDB->query("UNLOCK TABLES") ;
	
	$date8 = date('Ymd') ;
	
	$FAC_amount = $FAC_nb = $AVO_amount = $AVO_nb = 0 ;
	
	$buffer = '' ;
	
	$lig = '' ;
	$lig = substr_mklig($lig,'100',0,3) ;
	$lig = substr_mklig($lig,$GLOBALS['factor_vendeur'],3,6) ;
	$lig = substr_mklig($lig,'JUSTE PRESSE',9,40) ;
	$lig = substr_mklig($lig,$date8,49,8) ;
	$lig = substr_mklig($lig,'',57,40) ;
	$lig = substr_mklig($lig,'',97,10) ;
	$lig = substr_mklig($lig,'',107,10) ;
	$lig = substr_mklig($lig,'1',117,1) ;
	$lig = substr_mklig($lig,'2',118,1) ;
	$lig = substr_mklig($lig,'',119,16) ;
	$lig = substr_mklig($lig,str_pad($id, 3, "0", STR_PAD_LEFT),135,3) ;
	$lig = substr_mklig($lig,'',138,213) ;
	$lig = substr_mklig($lig,'EUR',351,3) ;
	$lig = substr_mklig($lig,'031998',354,6) ;
	$buffer.= $lig."\r\n" ;
	
	foreach( $arr_invFilerecordIds as $inv_filerecord_id ) {
		$query = "SELECT i.*, c.field_CLI_NAME
			FROM view_file_INV i
			INNER JOIN view_bible_CUSTOMER_entry c ON c.entry_key = i.field_CLI_LINK
			WHERE filerecord_id='{$inv_filerecord_id}'" ;
		$result = $_opDB->query($query) ;
		$arr = $_opDB->fetch_assoc($result) ;
		
		if( $arr['field_ID_COEF'] > 0 ) {
			$code_mode = '+' ;
		} elseif( $arr['field_ID_COEF'] < 0 ) {
			$code_mode = '-' ;
		} else {
			$code_mode = NULL ;
			continue ;
		}
		
		$time_invoice = strtotime($arr['field_DATE_INVOICE']) ;
		$time_due = strtotime('+30 days',$time_invoice) ;
		if( $time_due < strtotime('+10 days') ) {
			$time_due = strtotime('+10 days') ;
			$time_invoice = strtotime('-30 days',$time_due) ;
		}
		
		$map_adr = parseAdr($arr['field_ADR_INVOICE']) ;
		if( !$map_adr ) {
			continue ;
		}
		
		$query = "SELECT * FROM view_file_CDE WHERE field_LINK_INV_FILE_ID='{$arr['filerecord_id']}'" ;
		$result = $_opDB->query($query) ;
		$db_cde = $_opDB->fetch_assoc($result) ;
		
		$lig = '' ;
		$lig = substr_mklig($lig,'',0,3) ;
		switch( $code_mode ) {
			case '+' :
				$lig = substr_mklig($lig,'101',0,3) ;
				break ;
			case '-' :
				$lig = substr_mklig($lig,'102',0,3) ;
				break ;
			default :
				break ;
		}
		$lig = substr_mklig($lig,$date8,3,8) ;
		$lig = substr_mklig($lig,$GLOBALS['factor_vendeur'],11,6) ;
		$lig = substr_mklig($lig,lookup_factorSiret($arr['field_CLI_LINK']),17,14) ;
		$lig = substr_mklig($lig,$map_adr['nom'],31,40) ;
		$lig = substr_mklig($lig,$arr['field_CLI_NAME'],71,40) ;
		$lig = substr_mklig($lig,$map_adr['adr1'],111,40) ;
		$lig = substr_mklig($lig,$map_adr['adr2'],151,40) ;
		$lig = substr_mklig($lig,$map_adr['cp'],191,6) ;
		$lig = substr_mklig($lig,$map_adr['ville'],197,34) ;
		$lig = substr_mklig($lig,'FR',231,3) ;
		$lig = substr_mklig($lig,'',234,10) ;
		$lig = substr_mklig($lig,$arr['field_CLI_LINK'],244,10) ;
		$lig = substr_mklig($lig,date('Ymd',$time_invoice),254,8) ;
		$lig = substr_mklig($lig,preg_replace("/[^a-zA-Z0-9]/", "",$arr['field_ID_INV']),262,15) ;
		$lig = substr_mklig($lig,'EUR',277,3) ;
		switch( $code_mode ) {
			case '+' :
				$FAC_amount += abs((float)$arr['field_CALC_AMOUNT_FINAL']) ;
				$FAC_nb++ ;
				$lig = substr_mklig($lig,'+',280,1) ;
				$lig = substr_mklig($lig,str_pad(round(( abs((float)$arr['field_CALC_AMOUNT_FINAL']) )*100), 15, "0", STR_PAD_LEFT),281,15) ;
				$lig = substr_mklig($lig,'VIR',296,3) ;
				$lig = substr_mklig($lig,date('Ymd',$time_due),299,8) ;
				$lig = substr_mklig($lig,$arr['field_ID_CDE_REF'],307,10) ;
				$lig = substr_mklig($lig,$db_cde['field_CLI_REF_ID'],317,40) ;
				$lig = substr_mklig($lig,'FAC',357,3) ;
				break ;
			case '-' :
				$AVO_amount += abs((float)$arr['field_CALC_AMOUNT_FINAL']) ;
				$AVO_nb++ ;
				$lig = substr_mklig($lig,'-',280,1) ;
				$lig = substr_mklig($lig,str_pad(round(( abs((float)$arr['field_CALC_AMOUNT_FINAL']) )*100), 15, "0", STR_PAD_LEFT),281,15) ;
				$lig = substr_mklig($lig,'',296,11) ;
				$lig = substr_mklig($lig,preg_replace("/[^a-zA-Z0-9]/", "",$arr['field_ID_INV']),307,15) ;
				$lig = substr_mklig($lig,'',322,35) ;
				$lig = substr_mklig($lig,'AVO',357,3) ;
				break ;
			default :
				break ;
		}
		$buffer.= $lig."\r\n" ;
	}
	
	$lig = '' ;
	$lig = substr_mklig($lig,'101',0,3) ;
	$lig = substr_mklig($lig,$GLOBALS['factor_vendeur'],3,6) ;
	$lig = substr_mklig($lig,'JUSTE PRESSE',9,40) ;
	$lig = substr_mklig($lig,$date8,49,8) ;
	$lig = substr_mklig($lig,str_pad($FAC_nb, 4, "0", STR_PAD_LEFT),57,4) ;
	$lig = substr_mklig($lig,str_pad(round(( abs((float)$FAC_amount) )*100), 15, "0", STR_PAD_LEFT),61,15) ;
	$lig = substr_mklig($lig,str_pad($AVO_nb, 4, "0", STR_PAD_LEFT),76,4) ;
	$lig = substr_mklig($lig,str_pad(round(( abs((float)$AVO_amount) )*100), 15, "0", STR_PAD_LEFT),80,15) ;
	$lig = substr_mklig($lig,'',95,38) ;
	$lig = substr_mklig($lig,str_pad(0, 4, "0", STR_PAD_LEFT),133,4) ;
	$lig = substr_mklig($lig,str_pad(0, 15, "0", STR_PAD_LEFT),137,15) ;
	$lig = substr_mklig($lig,'',152,199) ;
	$lig = substr_mklig($lig,'EUR',351,3) ;
	$lig = substr_mklig($lig,'031998',354,6) ;
	$buffer.= $lig."\r\n" ;
	
	return $buffer ;
}

function mail_getBody( $arr_invFilerecordIds ) {
	global $_opDB ;
	
	
	
	//print_r($file_CDE_SAISIE) ;
	//print_r($bible_STORE_entry) ;
	//print_r($TABfile_CDE_SAISIE_LIG) ;
	$email_text = "" ;
	$email_text.= "Société        : ".'Juste Presse'."\r\n" ;
	$email_text.= "Factor         : ".'CA FactoFrance'."\r\n" ;
	$email_text.= "\r\n" ;
	$email_text.= "Date remise    : ".date('Y-m-d')."\r\n" ;
	$email_text.= "Ref  remise    : ".$GLOBALS['factor_ref']."\r\n" ;
	$email_text.= "Devise         : ".'EUR'."\r\n" ;
	$email_text.= "\r\n" ;
	$email_text.= "  Client       |  Date  |  Facture  |  Montant  | Echeance | Ref.cde  "."\r\n" ;
	$email_text.= "---------------|--------|-----------|-----------|----------|----------"."\r\n" ;
	
	$email_base = "               |        |           |           |          |          " ;
	
	foreach( $arr_invFilerecordIds as $inv_filerecord_id ) {
		$query = "SELECT i.*
			FROM view_file_INV i
			INNER JOIN view_bible_CUSTOMER_entry c ON c.entry_key = i.field_CLI_LINK
			WHERE filerecord_id='{$inv_filerecord_id}'" ;
		$result = $_opDB->query($query) ;
		$arr = $_opDB->fetch_assoc($result) ;
		
		$time_invoice = strtotime($arr['field_DATE_INVOICE']) ;
		$time_due = strtotime('+30 days',$time_invoice) ;
		if( $time_due < strtotime('+10 days') ) {
			$time_due = strtotime('+10 days') ;
			$time_invoice = strtotime('-30 days',$time_due) ;
		}
		
		$lig = $email_base ;
		$lig = substr_mklig($lig,$arr['field_CLI_LINK'],0,15) ;
		$lig = substr_mklig($lig,date('d/m/y',$time_invoice),16,8) ;
		$lig = substr_mklig($lig,preg_replace("/[^a-zA-Z0-9]/", "",$arr['field_ID_INV']),25,11) ;
		$lig = substr_mklig($lig,number_format(round($arr['field_CALC_AMOUNT_FINAL'],2),2),37,10,true) ;
		$lig = substr_mklig($lig,date('d/m/y',$time_due),50,8) ;
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
	$email_text.= "Factor         : ".'CA FactoFrance'."\r\n" ;
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
