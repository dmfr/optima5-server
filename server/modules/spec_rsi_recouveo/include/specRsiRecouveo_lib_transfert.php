<?php

$GLOBALS['specRsiRecouveo_lib_transfert_TRSFRcode'] = 'S2T_TRSFR' ;

function specRsiRecouveo_lib_transfert_extract_mapMethodJson() {
	global $_opDB ;
	
	$json = specRsiRecouveo_config_loadMeta(array()) ;
	$config_meta = $json['data'] ;
	if( !($idSoc=$config_meta['gen_transfert_destsoc']) ) {
		return array() ;
	}
	
	
	$acc_array = array() ;
	$accnotepadbin_array = array() ;
	$adrbook_array =array() ;
	$record_array = array() ;
	
	$query = "SELECT distinct field_LINK_ACCOUNT FROM view_file_FILE WHERE field_STATUS='{$GLOBALS['specRsiRecouveo_lib_transfert_TRSFRcode']}' " ;
	$res = $_opDB->query($query) ;
	while(($arr = $_opDB->fetch_row($res)) != FALSE){
		$acc_id = $arr[0] ;

		$acc_row = specRsiRecouveo_lib_transfert_create_ACCOUNT_row($acc_id, $idSoc) ;
		$acc_array[] = $acc_row ;

		$adrbook_row = specRsiRecouveo_lib_transfert_create_ADRBOOK_row($acc_id, $idSoc) ;
		foreach ($adrbook_row as $adr_row){
			$adrbook_array[] = $adr_row ;
		}

		$record_rows = specRsiRecouveo_lib_transfert_create_RECORD_row($acc_id, $idSoc) ;
		foreach( $record_rows as $row ){
			$record_array[] = $row ;
		}

		if( $acc_notepadbin_row = specRsiRecouveo_lib_transfert_create_ACCOUNTNOTEPADBIN($acc_id, $idSoc) ) {
			$accnotepadbin_array[] = $acc_notepadbin_row ;
		}
	}

	$acc_json = json_encode($acc_array) ;
	$adrbook_json = json_encode($adrbook_array) ;
	$record_json = json_encode($record_array) ;
	$accnotepadbin_json = json_encode($accnotepadbin_array);

	return array("account" => $acc_json, "account_adrbookentry" => $adrbook_json, "record" => $record_json, "account_notepadbin"=>$accnotepadbin_json) ;
}

function specRsiRecouveo_lib_transfert_create_ACCOUNTNOTEPADBIN($acc_id, $idSoc) {
	@include_once 'PHPExcel/PHPExcel.php' ;
	if( !class_exists('PHPExcel') )
		return NULL ;
	
	// extract récap détaillé
 		$workbook = specRsiRecouveo_xls_create_writer($acc_id) ;
		$tmpfilename = tempnam( sys_get_temp_dir(), "FOO");
		$objWriter = PHPExcel_IOFactory::createWriter($workbook, 'Excel2007');
		$objWriter->save($tmpfilename);
		$xls_binary = file_get_contents($tmpfilename) ;
		unlink($tmpfilename) ;
	
	$api_row = array() ;
	$api_row['IdSoc'] = $idSoc ;
	$api_row['IdCli'] = $acc_id ;
	$api_row['BinFilename'] = 'Summary_'.$acc_id.'.xlsx' ;
	$api_row['BinDesc'] = "Summary for {$acc_id} on ".date('d/m/Y') ;
	$api_row['BinBase64'] = base64_encode($xls_binary) ;

	return $api_row ;
}

function specRsiRecouveo_lib_transfert_create_RECORD_row($acc_id, $idSoc) {
	global $_opDB ;
	
	$query = "CREATE TEMPORARY TABLE acc_records (
					record_filerecord_id INT PRIMARY KEY,
					current_status INT,
					letter_is_confirm INT
				)" ;
	$_opDB->query($query) ;
	
	
	$query = "INSERT INTO acc_records(record_filerecord_id)
					SELECT distinct(r.filerecord_id)
					FROM view_file_RECORD r
					JOIN view_file_RECORD_LINK rl ON rl.filerecord_parent_id=r.filerecord_id
					JOIN view_file_FILE f ON f.filerecord_id=rl.field_LINK_FILE_ID
					WHERE r.field_LINK_ACCOUNT='{$acc_id}' AND f.field_STATUS='{$GLOBALS['specRsiRecouveo_lib_transfert_TRSFRcode']}'" ;
	$_opDB->query($query) ;
	
	$query = "UPDATE acc_records ar
					JOIN view_file_RECORD r ON r.filerecord_id = ar.record_filerecord_id
					SET ar.letter_is_confirm = r.field_LETTER_IS_CONFIRM" ;
	$_opDB->query($query) ;
	
	$query = "UPDATE acc_records ar
					JOIN view_file_RECORD_LINK rl ON rl.filerecord_parent_id=ar.record_filerecord_id AND rl.field_LINK_IS_ON='1'
					JOIN view_file_FILE f ON f.filerecord_id = rl.field_LINK_FILE_ID
					SET current_status='1'
					WHERE f.field_STATUS='{$GLOBALS['specRsiRecouveo_lib_transfert_TRSFRcode']}'" ;
	$_opDB->query($query) ;
	
	$query = "SELECT ar.*, r.* FROM acc_records ar
					JOIN view_file_RECORD r ON r.filerecord_id = ar.record_filerecord_id" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$letter_code = '' ;
		if( $arr['letter_is_confirm'] ) {
			$letter_code = 'LETTRE' ;
		} elseif( !$arr['current_status'] ) {
			$letter_code = 'ANNULE' ;
		}
		$letter_confirm = ($letter_code ? TRUE : FALSE) ;
		
		$record_row["IdSoc"] = $idSoc ;
		$record_row["IdCli"] = $arr["field_LINK_ACCOUNT"] ;
		$record_row["IdFact"] = $arr["field_RECORD_ID"] ;
		$record_row["NumFact"] = $arr["field_RECORD_REF"] ;
		$record_row["DateFact"] = $arr["field_DATE_RECORD"] ;
		$record_row["MontantTTC"] = (float)$arr["field_AMOUNT"] ;
		$record_row["LibFact"] = $arr["field_RECORD_TXT"] ;
		$record_row["DateLimite"] = $arr["field_DATE_VALUE"] ;
		$record_row["Letter"] = $letter_code ;
		$record_row["LetterConfirm"] = $letter_confirm ;
		$record_row["NonFactType"] = $arr["field_TYPE"] ;
		$record_array[] = $record_row ;
	}
	
	$query = "DROP TABLE acc_records" ;
	$_opDB->query($query) ;
	
	return $record_array ;
}

function specRsiRecouveo_lib_transfert_create_ACCOUNT_row($acc_id, $idSoc) {
	global $_opDB ;
	$account_query = "SELECT * FROM view_bible_LIB_ACCOUNT_entry WHERE field_ACC_ID = '{$acc_id}'" ;
	$res = $_opDB->query($account_query) ;
	$row = $_opDB->fetch_assoc($res) ;

	$api_row = array() ;
	$api_row['IdSoc'] = $idSoc ;
	$api_row['IdCli'] = $row['field_ACC_ID'] ;
	$api_row['NameCli'] = $row['field_ACC_NAME'] ;
	$api_row['SIRET'] = $row['field_ACC_SIRET'] ;

	return $api_row ;
}

function specRsiRecouveo_lib_transfert_create_ADRBOOK_row($acc_id, $idSoc) {
	global $_opDB ;
	$adrbook_query = "SELECT filerecord_id, field_ADR_ENTITY FROM view_file_ADRBOOK WHERE field_ACC_ID = '{$acc_id}'" ;
	$res = $_opDB->query($adrbook_query) ;

	$adrbook_rows = array() ;
	while($row = $_opDB->fetch_assoc($res)){
		$current_row = array() ;
		$adr_filerecord_id = $row['filerecord_id'] ;
		$current_row["IdSoc"] = $idSoc ;
		$current_row["IdCli"] = $acc_id ;
		$current_row["Lib"] = $row["field_ADR_ENTITY"] ;
		$adrbookentry_query = "SELECT field_ADR_TYPE, field_ADR_TXT FROM view_file_ADRBOOK_ENTRY WHERE filerecord_parent_id = '{$adr_filerecord_id}' " ;
		$adrbookentry_res = $_opDB->query($adrbookentry_query) ;
		while($entry_row = $_opDB->fetch_assoc($adrbookentry_res)){
			$current_row['AdrType'] = $entry_row['field_ADR_TYPE'] ;
			$current_row['Adr'] = $entry_row['field_ADR_TXT'] ;

			$adrbook_rows[] = $current_row ;
		}
	}

	return $adrbook_rows ;
}


?>
