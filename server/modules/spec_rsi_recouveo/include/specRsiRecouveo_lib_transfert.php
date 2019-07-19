<?php

function specRsiRecouveo_lib_transfert_extract_files(){
	global $_opDB ;
	$query = "SELECT filerecord_id, field_FILE_ID, field_LINK_ACCOUNT FROM view_file_FILE WHERE field_STATUS='S2T_TRSFR' " ;
	$res = $_opDB->query($query) ;
	$acc_array = array() ;
	$adrbook_array =array() ;
	while($row = $_opDB->fetch_assoc($res)){

		$acc_row = array() ;
		$acc_id = $row['field_LINK_ACCOUNT'] ;

		$idSoc_query = "SELECT treenode_key FROM view_bible_LIB_ACCOUNT_entry WHERE field_ACC_ID = '{$acc_id}'" ;
		$soc_res = $_opDB->query($idSoc_query) ;
		$soc_row = $_opDB->fetch_row($soc_res) ;
		$idSoc = $soc_row[0] ;

		$acc_row = specRsiRecouveo_lib_transfert_create_ACCOUNT_row($acc_id) ;
		$acc_array[] = $acc_row ;

		$adrbook_row = specRsiRecouveo_lib_transfert_create_ADRBOOK_row($acc_id, $idSoc) ;
		foreach ($adrbook_row as $adr_row){
			$adrbook_array[] = $adr_row ;
		}

		$record_row = specRsiRecouveo_lib_transfert_create_RECORD_row($row['filerecord_id'], $idSoc) ;
		if (!$record_row){
			continue ;
		}
		$record_array[] = $record_row ;
	}

	$acc_json = json_encode($acc_array) ;
	$adrbook_json = json_encode($adrbook_array) ;
	$record_json = json_encode($record_array) ;

	return array("account" => $acc_json, "account_adrbookentry" => $adrbook_json, "record" => $record_json) ;
}

function specRsiRecouveo_lib_transfert_create_RECORD_row($file_filerecord_id, $idSoc) {
	$ttmp = specRsiRecouveo_file_getRecords( array(
		'filter_fileFilerecordId_arr' => json_encode(array($file_filerecord_id))
	)) ;
	$data = $ttmp['data'][0] ;
	if (!$data["records"]){
		return ;
	}


	$acc_id = $data["acc_id"] ;

	$record_array = array() ;
	$record_row["IdCli"] = $acc_id ;
	$record_row["IdSoc"] = $idSoc ;

	foreach ($data["records"] as $rec){
		$record_row["IdFact"] = $rec["record_id"] ;
		$record_row["NumFact"] = $rec["record_ref"] ;
		$record_row["DateFact"] = $rec["date_record"] ;
		$record_row["MontantTTC"] = $rec["amount"] ;
		$record_row["LibFact"] = $rec["record_txt"] ;
		$record_row["DateTrans"] = $rec["date_load"] ;
		$record_row["DateLimite"] = $rec["date_value"] ;
		$record_row["Letter"] = $rec["letter_code"] ;
		$record_row["NonFactType"] = $rec["type"] ;
		$record_array[] = $record_row ;
	}

	return $record_row ;
}

function specRsiRecouveo_lib_transfert_create_ACCOUNT_row($acc_id) {
	global $_opDB ;
	$account_query = "SELECT * FROM view_bible_LIB_ACCOUNT_entry WHERE field_ACC_ID = '{$acc_id}'" ;
	$res = $_opDB->query($account_query) ;
	$row = $_opDB->fetch_assoc($res) ;

	$api_row = array() ;
	$api_row['IdCli'] = $row['field_ACC_ID'] ;
	$api_row['NameCli'] = $row['field_ACC_NAME'] ;
	$api_row['SIRET'] = $row['field_ACC_SIRET'] ;
	$api_row['IdSoc'] = $row['treenode_key'] ;

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