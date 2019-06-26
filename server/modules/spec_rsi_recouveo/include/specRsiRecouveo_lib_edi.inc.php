<?php

function specRsiRecouveo_lib_edi_upload_preHandle($handle_in) {
	$lig = fgets($handle_in) ;
	rewind($handle_in) ;
	
	if( strpos($lig,"\x50\x4B\x03\x04")===0 ) {
		// mode XLSX ?
		$filename = "test.xlsx" ;
		$tmpfname = tempnam( sys_get_temp_dir(), "FOO").'.xlsx';
		$handle_w = fopen($tmpfname,'wb') ;
		stream_copy_to_stream($handle_in,$handle_w);
		fclose($handle_w) ;
		fclose($handle_in) ;
		$handle_out = SpreadsheetToCsv::toCsvHandle($tmpfname,$filename) ;
		unlink($tmpfname) ;
		return $handle_out ;
	}
	if( strpos($lig,"\xD0\xCF\x11\xE0")===0 ) {
		// mode XLS ?
		$filename = "test.xls" ;
		$tmpfname = tempnam( sys_get_temp_dir(), "FOO").'.xls';
		$handle_w = fopen($tmpfname,'wb') ;
		stream_copy_to_stream($handle_in,$handle_w);
		fclose($handle_w) ;
		fclose($handle_in) ;
		$handle_out = SpreadsheetToCsv::toCsvHandle($tmpfname,$filename) ;
		unlink($tmpfname) ;
		return $handle_out ;
	}
	
	// CSV tries
	$separatorNbrows = array() ;
	foreach( array(';',',') as $separator ) {
		rewind($handle_in) ;
		$separatorNbrows[$separator] = count(fgetcsv($handle_in,0,$separator)) ;
	}
	rewind($handle_in) ;
	if( $separatorNbrows[';'] > $separatorNbrows[','] ) {
		// mode CSV fr ?
		$filename = "test.csv" ;
		$tmpfname = tempnam( sys_get_temp_dir(), "FOO").'.csv';
		$handle_w = fopen($tmpfname,'wb') ;
		stream_copy_to_stream($handle_in,$handle_w);
		fclose($handle_w) ;
		fclose($handle_in) ;
		$handle_out = SpreadsheetToCsv::toCsvHandle($tmpfname,$filename) ;
		unlink($tmpfname) ;
		return $handle_out ;
	}
	
	rewind($handle_in) ;
	return $handle_in ;
}

function specRsiRecouveo_lib_edi_convert_UPL_ACCPROPERTIES_to_mapMethodJson($handle) {
	if (true){
		$handle = specRsiRecouveo_lib_edi_upload_preHandle($handle) ;
	}

	$headers =fgetcsv($handle) ;
	$map_header_csvIdx = array() ;
	foreach ($headers as $csv_idx => $head){
		switch ($head) {
			case 'Société':
				$head = "IdSoc" ;
				break ;
			case "Numéro client":
				$head = "IdCli" ;
				break ;
			case "Affectation";
				$head = "affectation" ;
				break ;
			case "Scénario":
				$head = "scen" ;
				break ;
			case "Scen Auto":
				$head = "auto" ;
				break ;
		}
		if( trim($head)=='' ) {
			continue ;
		}
		$map_header_csvIdx[$head] = $csv_idx ;
	}
	$account_rows = array() ;
	while ($data = fgetcsv($handle)){
		if( !$data ) {
			continue ;
		}
		$row = array() ;
		foreach( $map_header_csvIdx as $mkey => $idx ) {
			$row[$mkey] = trim($data[$idx]) ;
		}
		$account_rows[] = $row ;
	}
	$accountprop_json = json_encode($account_rows) ;

	return array(
		"account_properties" => $accountprop_json
	) ;
}
function specRsiRecouveo_lib_edi_convert_UPLCOMPTES_to_mapMethodJson( $handle ) {
	if (true){
		$handle = specRsiRecouveo_lib_edi_upload_preHandle($handle) ;
	}

	$headers = fgetcsv($handle) ;
	//print_r($headers) ;
	$map_header_csvIdx = array() ;
	foreach ($headers as $csv_idx => $head){
		switch ($head) {
			case "Société":
				$head = "IdSoc";
				break;
			case "Numéro client":
				$head = "IdCli";
				break;
			case "Langue":
				$head = "Meta:LANG" ;
				break ;
			case "Pro/part.":
				$head = "Meta:PROPART" ;
				break ;
			case "Raison sociale":
				$head = "NameCli" ;
				break ;
			case "SIREN":
				$head = "SIRET" ;
				break;
			default:
				break ;
		}

		if( trim($head)=='' ) {
			continue ;
		}

		$map_header_csvIdx[$head] = $csv_idx ;
	}
	$account_rows = array() ;
	while ($data = fgetcsv($handle)){
		if( !$data ) {
			continue ;
		}
		$row = array() ;
		foreach( $map_header_csvIdx as $mkey => $idx ) {
			$row[$mkey] = trim($data[$idx]) ;
		}
		$account_rows[] = $row ;
	}
	$account_json = json_encode($account_rows) ;
	
	$adrbook_rows = array() ;
	foreach ($account_rows as $row){
		//print_r($row["IdSoc"]) ;
		if ($row["Adresse 1"]){
			$adr_txt = '' ;
			if( $row["Adresse 1"] ) {
				$adr_txt.= $row["Adresse 1"]."\n" ;
			}
			if( $row["Adresse 2"] ) {
				$adr_txt.= $row["Adresse 2"]."\n" ;
			}
			if( $row["Code postal"] || $row["Ville"] ) {
				$adr_txt.= $row["Code postal"]." ".$row["Ville"]."\n" ;
			}
			if( $row["Pays"] ) {
				$adr_txt.= $row["Pays"]."\n" ;
			}
			$adr_txt = trim($adr_txt) ;
			
			$nrow = array() ;
			$nrow["AdrType"] = "POSTAL";
			$nrow["IdSoc"] = $row["IdSoc"] ;
			$nrow["Adr"] = $adr_txt;
			$nrow["IdCli"] = $row["IdCli"] ;
			$nrow["Lib"] = $row["NameCli"] ;
			$adrbook_rows[] = $nrow ;
		} if ($row["Tél. 1"]){
			$nrow = array() ;
			$nrow["AdrType"] = "TEL";
			$nrow["Adr"] = $row["Tél. 1"];
			$nrow["IdCli"] = $row["IdCli"] ;
			$nrow["Lib"] = $row["NameCli"] ;
			$nrow["IdSoc"] = $row["IdSoc"] ;
			$adrbook_rows[] = $nrow ;
		} if ($row["Tél. 2"]){
			$nrow = array() ;
			$nrow["AdrType"] = "TEL";
			$nrow["Adr"] = $row["Tél. 2"];
			$nrow["IdCli"] = $row["IdCli"] ;
			$nrow["Lib"] = $row["NameCli"] ;
			$nrow["IdSoc"] = $row["IdSoc"] ;
			$adrbook_rows[] = $nrow ;
		} if ($row["Mail"]){
			$nrow = array() ;
			$nrow["AdrType"] = "EMAIL";
			$nrow["Adr"] = $row["Mail"];
			$nrow["IdCli"] = $row["IdCli"] ;
			$nrow["Lib"] = $row["NameCli"] ;
			$nrow["IdSoc"] = $row["IdSoc"] ;
			$adrbook_rows[] = $nrow ;
		}
	}
	
	$adrbook_json = json_encode($adrbook_rows) ;
	
	return array(
		"account" => $account_json,
		"account_adrbookentry" => $adrbook_json
	) ;
}
function specRsiRecouveo_lib_edi_convert_UPLFACTURES_to_mapMethodJson( $handle ) {
	if (true){
		$handle = specRsiRecouveo_lib_edi_upload_preHandle($handle) ;
	}
	
	$headers = fgetcsv($handle) ;
	$map_header_csvIdx = array() ;
	foreach ($headers as $csv_idx => $head){
		switch ($head){
			case "Société":
				$head = "IdSoc";
				break ;
			case "Numéro client":
				$head = "IdCli" ;
				break ;
			case "Date transmission":
				$head = "DateTrans" ;
				break ;
			case "Date facture":
				$head = "DateFact" ;
				break ;
			case "Date échéance":
				$head = "DateLimite" ;
				break ;
			case "Id facture":
				$head = "IdFact" ;
				break ;
			case "Numéro facture":
				$head = "NumFact" ;
				break ;
			case "Libellé":
				$head = "LibFact" ;
				break ;
			case "Montant HT":
				$head = "MontantHT" ;
				break ;
			case "Montant TTC":
				$head = "MontantTTC" ;
				break ;
			case "Montant TVA":
				$head = "MontantTVA" ;
				break ;
			case "Journal":
				$head = "Journal" ;
				break ;
			case "Lettrage":
				$head = "Letter" ;
				break ;
			case "Lettrage soldé ?":
				$head = "LetterConfirm" ;
				break ;
			case "Date lettrage":
				$head = "LetterDate" ;
				break ;
			case "Montant devise":
				$head = "XeCurrencyAmount" ;
				break ;
			case "Code devise":
				$head = "XeCurrencyCode" ;
				break ;
			default:
				break ;
		}
		
		if( trim($head)=='' ) {
			continue ;
		}
		
		$map_header_csvIdx[$head] = $csv_idx ;
	}
	
	$record_rows = array() ;
	while ($data = fgetcsv($handle)){
		if( !$data ) {
			continue ;
		}
		$row = array() ;
		foreach( $map_header_csvIdx as $mkey => $idx ) {
			$row[$mkey] = trim($data[$idx]) ;
		}
		$record_rows[] = $row ;
	}
	$record_json = json_encode($record_rows) ;
	
	return array(
		"record" => $record_json
	) ;
}


function specRsiRecouveo_lib_edi_post($apikey_code, $transaction, $handle) {
	$handle_in = tmpfile() ;
	stream_copy_to_stream($handle,$handle_in) ;
	fseek($handle_in,0) ;

	// Tab normalisé de retour
		// - count_success
		// - errors TAB
	$ret = array(
		'count_success' => 0,
		'errors' => array()
	);
	
	switch( $transaction ) {
		case 'account' :
		case 'account_adrbookentry' :
		case 'account_properties' :
		case 'record' :
			$mapMethodJson[$transaction] = stream_get_contents($handle_in) ;
			break ;
			
		case 'upload_COMPTES' :
			$mapMethodJson = specRsiRecouveo_lib_edi_convert_UPLCOMPTES_to_mapMethodJson($handle_in) ;
			break ;
		case 'upload_FACTURES' :
			$mapMethodJson = specRsiRecouveo_lib_edi_convert_UPLFACTURES_to_mapMethodJson($handle_in) ;
			break ;
		case 'upload_ACCOUNT_PROPERTIES':
			$mapMethodJson = specRsiRecouveo_lib_edi_convert_UPL_ACCPROPERTIES_to_mapMethodJson($handle_in) ;
			break ;
		default :
			break ;
	}
	
	//fclose($handle_in) ;
	
	foreach( $mapMethodJson as $method => $json_str ) {
		$sret = specRsiRecouveo_lib_edi_postJson($apikey_code,$method,$json_str) ;
		
		if( isset($sret['count_success']) && isset($sret['errors']) ) {
			$ret['count_success'] += $sret['count_success'] ;
			foreach( $sret['errors'] as $err ) {
				$ret['errors'][] = $err ;
			}
		}
	}





	// creation du log en fonction des params + $ret (success/errors)
	$log = array(
		'field_APILOG_KEYCODE' => $apikey_code,
		'field_APILOG_DATE' => date('Y-m-d H:i:s'),
		'field_APILOG_METHOD' => $transaction,
		'field_APILOG_SUCCESS' => !(count($ret['errors'])>0),
		'field_APILOG_COUNT' => ($ret['count_success'] - count($ret['errors']))
	);
	paracrm_lib_data_insertRecord_file('Z_APILOGS', 0, $log) ;
	
	// calls Recouveo int. API
	specRsiRecouveo_lib_autorun_open() ;
	specRsiRecouveo_lib_scenario_attach() ;
	
	return $ret ;
}
function specRsiRecouveo_lib_edi_postJson($apikey_code, $transaction, $json_str){ // PUBLIC
	// Tab normalisé de retour
		// - count_success
		// - errors TAB
	
	// normaliser le data => json_array[json_rows]
	$json_rows = json_decode($json_str,true) ;
	
	// HACK: meta
	foreach( $json_rows as &$json_row ) {
		$todel_tags = array() ;
		foreach( $json_row as $mkey=>&$mvalue ) {
			$mvalue = trim($mvalue) ;
		}
		unset($mvalue) ;
		foreach( $json_row as $mkey=>$mvalue ) {
			$tag='Meta:' ;
			if( strpos($mkey,$tag)===0 ) {
				if( !isset($json_row['Meta']) ) {
					$json_row['Meta'] = array() ;
				}
				$mkey_meta = substr($mkey,strlen($tag)) ;
				$json_row['Meta'][$mkey_meta] = $mvalue ;
				$todel_tags[] = $mkey ;
			}
		}
		foreach( $todel_tags as $mkey ) {
			unset($json_row[$mkey]) ;
		}
	}
	unset($json_row) ;
	
	switch( $transaction ) {
		case 'account' :
			$ret = specRsiRecouveo_lib_edi_post_account( $json_rows ) ;
			break ;
		case 'record' :
			$ret = specRsiRecouveo_lib_edi_post_record( $json_rows ) ;
			break ;
		case 'account_adrbookentry' :
			$ret = specRsiRecouveo_lib_edi_post_adrbook( $json_rows ) ;
			break ;
		case 'account_properties':
			$ret = specRsiRecouveo_lib_edi_post_acc_properties( $json_rows ) ;
			break ;
	}
	
	return $ret ;
}
function specRsiRecouveo_lib_edi_validateSocCli( $id_soc, $id_cli=NULL, $test_cli_exists=FALSE ) {
	// si id_cli == NULL > verif société existante

	// si id_cli != NULL > calcul du code société normalisé (ex : HMF + 12345 = HMF-12345  || HMF + HMF-12345 = HMF-12345 )
	//     si test_exists = FALSE > retour de cette valeur
	//     si test_exists = true > test existence base LIB_ACCOUNT

	global $_opDB;

	if( !$id_soc ) {
		return false ;
	}

	// test + normalisation du code société
	$query = "SELECT field_SOC_ID FROM view_bible_LIB_ACCOUNT_tree WHERE field_SOC_NAME = '{$id_soc}' OR field_SOC_ID = '{$id_soc}'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) < 1 ) {
		return false ;
	}
	$row = $_opDB->fetch_row($result) ;
	$id_soc = $row[0] ;

	if( !$id_cli ) {
		return $id_soc ;
	}
	
	$orig_id_cli = $id_cli ;
	// normalisation du id_cli (si fourni)
	if( strpos($id_cli,$id_soc."-")===0 ) {
		// code cli déjà préfixé société
	} else {
		$id_cli = $id_soc."-".$id_cli ;
	}

	// test si demandé
	if( !$test_cli_exists ) {
		return $id_cli ;
	}

	$query = "SELECT entry_key FROM view_bible_LIB_ACCOUNT_entry WHERE entry_key='{$id_cli}'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) < 1 ) {
		$query2 = "SELECT entry_key FROM view_bible_LIB_ACCOUNT_entry WHERE entry_key='{$orig_id_cli}'" ;
		$result2 = $_opDB->query($query2) ;
		if( $_opDB->num_rows($result2) < 1 ) {
			return false ;
		} else{
			return $orig_id_cli ;
		}
	}
	return $id_cli ;
}

function specRsiRecouveo_lib_edi_post_adrbook($json_rows){
	global $_opDB;
	
	$mandatory = array('IdSoc', 'IdCli', 'Lib', 'AdrType', 'Adr') ;
	$map_json2adrbook = array (
		'IdCli' => 'field_ACC_ID',
		'Lib' => 'field_ADR_ENTITY'
	) ;
	// adrbookenty filerecord_parent_id = adrbook filerecord_id
	$map_json2adrbookentry = array(
		'AdrType' => 'field_ADR_TYPE',
		'Adr' => 'field_ADR_TXT',
		'AdrConfirm' => 'field_STATUS_IS_CONFIRM'
	);
	$count_success = 0;
	$ret_errors = array() ;

	foreach($json_rows as $idx => $json_row){
		$missing = array() ;
		foreach($mandatory as $field){
			if ( !isset($json_row[$field])){
				$missing[] = $field ;
			}
		}
		if (count($missing) > 0){
			$ret_errors[] = "ERR Idx={$idx} : missing field(s) ".implode(',',$missing) ;
			continue ;
		}
		$txt_IdSoc = $json_row['Idsoc'] ;
		$json_row['IdSoc'] = specRsiRecouveo_lib_edi_validateSocCli($json_row['IdSoc']) ;
		if( !$json_row['IdSoc'] ) {
			$ret_errors[] = "ERR Idx={$idx} : unknown IdSoc={$txt_IdSoc}" ;
			continue ;
		}
		$json_row['IdCli'] = specRsiRecouveo_lib_edi_validateSocCli($json_row['IdSoc'],$json_row['IdCli']) ;

		$arr_ins_adrbook = array() ;
		foreach($map_json2adrbook as $json_field => $db_field){
			if( isset($json_row[$json_field]) ) {
				$arr_ins_adrbook[$db_field] = $json_row[$json_field] ;
			}
		}
		$arr_ins_adrbook_entry = array() ;
		foreach($map_json2adrbookentry as $json_field => $db_field){
			if( isset($json_row[$json_field]) ) {
				$arr_ins_adrbookentry[$db_field] = $json_row[$json_field] ;
			}
		}
		
		// substitutions MySQL
		$mysql_Lib = $_opDB->escape_string($json_row['Lib']) ;
		$mysql_Adr = $_opDB->escape_string($json_row['Adr']) ;

		$query = "SELECT ae.filerecord_id FROM view_file_ADRBOOK_ENTRY ae JOIN view_file_ADRBOOK a ON a.filerecord_id=ae.filerecord_parent_id WHERE a.field_ACC_ID='{$json_row['IdCli']}' AND ae.field_ADR_TYPE = '{$json_row["AdrType"]}' AND REGEXP_REPLACE(ae.field_ADR_TXT,'[^A-Za-z0-9 ]','') = REGEXP_REPLACE('{$mysql_Adr}','[^A-Za-z0-9 ]','') " ;
		$result = $_opDB->query($query) ;
		if ($_opDB->num_rows($result) < 1 ){
			$query = "SELECT filerecord_id FROM view_file_ADRBOOK WHERE field_ACC_ID = '{$json_row['IdCli']}' AND field_ADR_ENTITY = '{$mysql_Lib}'" ;
			$adrbook_filerecordId = $_opDB->query_uniqueValue($query) ;
			if( !$adrbook_filerecordId ) {
				$adrbook_filerecordId = paracrm_lib_data_insertRecord_file('ADRBOOK' , 0, $arr_ins_adrbook ) ;
			}
			paracrm_lib_data_insertRecord_file('ADRBOOK_ENTRY', $adrbook_filerecordId, $arr_ins_adrbookentry) ;
			$count_success++ ;
		}
		else{
			//$count_success++ ;
			continue;
		}
	}
	return array("count_success" => $count_success, "errors" => $ret_errors) ;
}

function specRsiRecouveo_lib_edi_post_acc_properties($json_rows){
	global $_opDB;

	$mandatory = array('IdSoc','IdCli', 'affectation', 'auto') ;
	$map_entryKey = 'IdCli' ;
	$map_json2file = array(
		'scen' => 'field_SCENARIO',
		'auto' => 'field_SCENARIO_IS_AUTO'
	) ;
	$map_json2acc = array(
		'IdCli' => "field_ACC_ID",
		'affectation' => "field_LINK_USER_LOCAL",
	) ;


	$count_success = 0 ;
	$ret_errors = array() ;
	foreach( $json_rows as $idx => $json_row ) {
		$missing = array() ;
		foreach( $mandatory as $field ) {
			if( !isset($json_row[$field]) ) {
				$missing[] = $field ;
			}
		}
		if( count($missing) > 0 ) {
			$ret_errors[] = "ERR Idx={$idx} : missing field(s) ".implode(',',$missing) ;
			continue ;
		}

		$txt_IdSoc = $json_row['IdSoc'] ;
		$json_row['IdSoc'] = specRsiRecouveo_lib_edi_validateSocCli($json_row['IdSoc']) ;
		if( !$json_row['IdSoc'] ) {
			$ret_errors[] = "ERR Idx={$idx} : unknown IdSoc={$txt_IdSoc}" ;
			continue ;
		}

		$json_row['IdCli'] = specRsiRecouveo_lib_edi_validateSocCli($json_row['IdSoc'],$json_row['IdCli'], true) ;

		$arr_ins_file = array() ;
		foreach( $map_json2file as $json_field => $db_field ) {
			if( isset($json_row[$json_field]) ) {
				$arr_ins_file[$db_field] = $json_row[$json_field] ;
			}
		}

		$arr_ins_acc = array() ;
		foreach( $map_json2acc as $json_field => $db_field ) {
			if( isset($json_row[$json_field]) ) {
				$arr_ins_acc[$db_field] = $json_row[$json_field] ;
			}
		}
		$entry_key = $json_row['IdCli'] ;
		//print_r($entry_key) ;
		$acc_open = specRsiRecouveo_account_open(array("acc_id" => $entry_key)) ;
		if (!$acc_open["success"]){
			$ret_errors[] = "ERR Idx={$idx} : unknown Idcli={$entry_key}" ;
			continue ;
		}
		$curr_files = $acc_open["data"] ;
		foreach ($curr_files["files"] as $file){
			//print_r($file) ;
			if (!$file["status_is_schednone"] && !$file["status_is_schedlock"]){
				//print_r($arr_ins_file) ;
				$filerecord_id = $file['file_filerecord_id'] ;
				paracrm_lib_data_updateRecord_file('FILE', $arr_ins_file, $filerecord_id) ;
				$count_success++;
			}

		}
		paracrm_lib_data_updateRecord_bibleEntry("LIB_ACCOUNT", $entry_key, $arr_ins_acc) ;
	}
	
	return array("count_success" => $count_success, "errors" => $ret_errors) ;
}

function specRsiRecouveo_lib_edi_post_record( $json_rows) {
	global $_opDB;
	
	$mandatory = array('IdSoc', 'IdCli', 'IdFact', 'DateFact', 'MontantTTC') ; // Lib = record_txt
	$map_json2db = array(
		'IdCli' => 'field_LINK_ACCOUNT',
		'IdFact' => 'field_RECORD_ID',
		'NumFact' => 'field_RECORD_REF',
		'DateFact' => 'field_DATE_RECORD',
		'MontantTTC' => 'field_AMOUNT',
		'LibFact' => 'field_RECORD_TXT',
		'DateTrans' => 'field_DATE_LOAD',
		'DateLimite' => 'field_DATE_VALUE',
		'Letter' => 'field_LETTER_CODE',
		'LetterConfirm' => 'field_LETTER_IS_CONFIRM',
		'LetterDate' => 'field_LETTER_DATE',
		'NonFactType' => 'field_TYPE',
		'XeCurrencyAmount' => 'field_XE_CURRENCY_AMOUNT',
		'XeCurrencyCode' => 'field_XE_CURRENCY_CODE'
	);
	$count_success = 0;
	$ret_errors = array() ;
	foreach($json_rows as $idx => $json_row){
		if ($json_row['DateTrans'] == null){
			$json_row['DateTrans'] = date("Y-m-d") ;
		} else {
			$json_row['DateTrans'] = date('Y-m-d',strtotime($json_row['DateTrans'])) ;
		}
		
		if ($json_row['DateLimite'] == null){
			$json_row['DateLimite'] = date('Y-m-d',strtotime($json_row['DateFact'])) ;
		} else {
			$json_row['DateLimite'] = date('Y-m-d',strtotime($json_row['DateLimite'])) ;
		}
		
		$json_row['LetterConfirm'] = !!$json_row['LetterConfirm'] ;
		if( $json_row['LetterConfirm'] ) {
			if( $json_row['LetterDate'] && ($tmld=strtotime($json_row['LetterDate'])) ) {
				$json_row['LetterDate'] = date('Y-m-d',$tmld) ;
			} else {
				$json_row['LetterDate'] = date('Y-m-d') ;
			}
		}
		
		$json_row['DateFact'] = date('Y-m-d',strtotime($json_row['DateFact'])) ;

		if ($json_row['NumFact'] == null){
			$json_row['NumFact'] = $json_row['IdFact'] ;
		}
		
		if( is_string($json_row['MontantTTC']) ) {
			$json_row['MontantTTC'] = str_replace(',','.',$json_row['MontantTTC']) ;
		}
		if( is_string($json_row['XeCurrencyAmount']) ) {
			$json_row['XeCurrencyAmount'] = str_replace(',','.',$json_row['XeCurrencyAmount']) ;
		}
		
		$missing = array() ;
		foreach($mandatory as $field){
			if ( !isset($json_row[$field])){
				$missing[] = $field ;
			}
		}
		if (count($missing) > 0){
			$ret_errors[] = "ERR Idx={$idx} : missing field(s) ".implode(',',$missing) ;
			continue ;
		}

		$txt_IdSoc = $json_row['Idsoc'] ;
		$json_row['IdSoc'] = specRsiRecouveo_lib_edi_validateSocCli($json_row['IdSoc']) ;
		if( !$json_row['IdSoc'] ) {
			$ret_errors[] = "ERR Idx={$idx} : unknown IdSoc={$txt_IdSoc}" ;
			continue ;
		}
		$json_row['IdCli'] = specRsiRecouveo_lib_edi_validateSocCli($json_row['IdSoc'],$json_row['IdCli']) ;

		$arr_ins = array() ;
		foreach($map_json2db as $json_field => $db_field){
			if( isset($json_row[$json_field]) ) {
				$arr_ins[$db_field] = $json_row[$json_field] ;
			}
		}
		if( is_array($json_row['Meta']) ) {
			foreach( $json_row['Meta'] as $mkey=>$mvalue ) {
				$dbkey = 'field_ATR_R_'.$mkey ;
				$arr_ins[$dbkey] = $mvalue ;
			}
		}

		$query_accId = $_opDB->escape_string($arr_ins["field_LINK_ACCOUNT"]) ;
		$query_recordId = $_opDB->escape_string($arr_ins["field_RECORD_ID"]) ;
		$query = "SELECT filerecord_id FROM view_file_RECORD WHERE field_RECORD_ID = '{$query_recordId}' AND field_LINK_ACCOUNT = '{$query_accId}'" ;
		$result = $_opDB->query($query) ;
		if ($_opDB->num_rows($result) < 1 ){
			paracrm_lib_data_insertRecord_file( 'RECORD' , 0, $arr_ins ) ;
			$count_success++;
		}
		else{
			$arr = $_opDB->fetch_row($result) ;
			$filerecord_id = $arr[0] ;
			paracrm_lib_data_updateRecord_file('RECORD', $arr_ins, $filerecord_id) ;
			$count_success++;
		}
	}
	return array("count_success" => $count_success, "errors" => $ret_errors) ;
}
function specRsiRecouveo_lib_edi_post_account( $json_rows ) {
	global $_opDB;
	
	$mandatory = array('IdSoc','IdCli','NameCli') ;
	$map_entryKey = 'IdCli' ;
	$map_json2db = array(
		'IdCli' => 'field_ACC_ID',
		'NameCli' => 'field_ACC_NAME',
		'SIRET' => 'field_ACC_SIRET'
	) ;
	
	$count_success = 0 ;
	$ret_errors = array() ;
	foreach( $json_rows as $idx => $json_row ) {
		$missing = array() ;
		foreach( $mandatory as $field ) {
			if( !isset($json_row[$field]) ) {
				$missing[] = $field ;
			}
		}
		if( count($missing) > 0 ) {
			$ret_errors[] = "ERR Idx={$idx} : missing field(s) ".implode(',',$missing) ;
			continue ;
		}
		
		$txt_IdSoc = $json_row['IdSoc'] ;
		$json_row['IdSoc'] = specRsiRecouveo_lib_edi_validateSocCli($json_row['IdSoc']) ;
		if( !$json_row['IdSoc'] ) {
			$ret_errors[] = "ERR Idx={$idx} : unknown IdSoc={$txt_IdSoc}" ;
			continue ;
		}
		
		$json_row['IdCli'] = specRsiRecouveo_lib_edi_validateSocCli($json_row['IdSoc'],$json_row['IdCli']) ;
		
		// mapping vers base
		$arr_ins = array() ;
		foreach( $map_json2db as $json_field => $db_field ) {
			if( isset($json_row[$json_field]) ) {
				$arr_ins[$db_field] = $json_row[$json_field] ;
			}
		}
		if( is_array($json_row['Meta']) ) {
			foreach( $json_row['Meta'] as $mkey=>$mvalue ) {
				$dbkey = 'field_ATR_A_'.$mkey ;
				$arr_ins[$dbkey] = $mvalue ;
			}
		}
		
		
		$entry_key = $json_row['IdCli'] ;
		$query = "SELECT entry_key FROM view_bible_LIB_ACCOUNT_entry WHERE entry_key = '{$entry_key}'" ;
		$result = $_opDB->query($query) ;
		if( $_opDB->num_rows($result) < 1 ) {
			paracrm_lib_data_insertRecord_bibleEntry("LIB_ACCOUNT", $entry_key, $json_row['IdSoc'] , $arr_ins) ;
			$count_success++ ;
		}
		else{
			paracrm_lib_data_updateRecord_bibleEntry("LIB_ACCOUNT", $entry_key, $arr_ins) ;
			$count_success++ ;
		}
		// existant ou MaJ ?



	}

	return array("count_success" => $count_success, "errors" => $ret_errors) ;
}

?>
