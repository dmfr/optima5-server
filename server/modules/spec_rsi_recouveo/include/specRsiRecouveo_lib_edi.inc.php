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
function specRsiRecouveo_lib_edi_convert_UPL_ACCTXTACTION_to_mapMethodJson($handle) {
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
			case "Titre";
				$head = "TxtTitle" ;
				break ;
			case "Texte":
				$head = "Txt" ;
				break ;
		}
		if( trim($head)=='' ) {
			continue ;
		}
		$map_header_csvIdx[$head] = $csv_idx ;
	}
	$action_rows = array() ;
	while ($data = fgetcsv($handle)){
		if( !$data ) {
			continue ;
		}
		$row = array() ;
		foreach( $map_header_csvIdx as $mkey => $idx ) {
			$row[$mkey] = trim($data[$idx]) ;
		}
		$action_rows[] = $row ;
	}
	$actions_json = json_encode($action_rows) ;

	return array(
		"account_txtaction" => $actions_json
	) ;
}
function specRsiRecouveo_lib_edi_convert_UPL_ACTION_to_mapMethodJson($handle) {
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
			case "Id facture";
				$head = "IdRecord" ;
				break ;
			
			// ....................
		}
		if( trim($head)=='' ) {
			continue ;
		}
		$map_header_csvIdx[$head] = $csv_idx ;
	}
	$action_rows = array() ;
	while ($data = fgetcsv($handle)){
		if( !$data ) {
			continue ;
		}
		$row = array() ;
		foreach( $map_header_csvIdx as $mkey => $idx ) {
			$row[$mkey] = trim($data[$idx]) ;
		}
		$action_rows[] = $row ;
	}
	$actions_json = json_encode($action_rows) ;

	return array(
		"action" => $actions_json
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
function specRsiRecouveo_lib_edi_convert_UPLCOMPTESADRBOOK_to_mapMethodJson( $handle ) {
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
			case "Titre":
				$head = "Lib" ;
				break ;
			case "Type":
				$head = "AdrType" ;
				break ;
			case "Contenu":
				$head = "Adr" ;
				break ;
			default:
				break ;
		}

		if( trim($head)=='' ) {
			continue ;
		}

		$map_header_csvIdx[$head] = $csv_idx ;
	}
	$adrbook_rows = array() ;
	while ($data = fgetcsv($handle)){
		if( !$data ) {
			continue ;
		}
		$row = array() ;
		foreach( $map_header_csvIdx as $mkey => $idx ) {
			$row[$mkey] = trim($data[$idx]) ;
		}
		$adrbook_rows[] = $row ;
	}
	$adrbook_json = json_encode($adrbook_rows) ;
	
	return array(
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
	$GLOBALS['_cache_specRsiRecouveo_lib_edi_mapSocStrToId'] = array() ;

	$handle_in = tmpfile() ;
	stream_copy_to_stream($handle,$handle_in) ;
	fseek($handle_in,0) ;

	// Tab normalisé de retour
		// - count_success
		// - errors TAB
	$ret = array(
		'count_success' => 0,
		'idx_new' => array(),
		'errors' => array()
	);
	
	switch( $transaction ) {
		case 'account' :
		case 'account_adrbookentry' :
		case 'account_notepadbin' :
		case 'account_txtaction' :
		case 'account_properties' :
		case 'record' :
		case 'record_lettermissing' :
		case 'notification' :
		case 'action' :
		case 'DEV_purgeall' :
			$mapMethodJson = array($transaction => stream_get_contents($handle_in)) ;
			break ;
			
		case 'upload_COMPTES' :
			$mapMethodJson = specRsiRecouveo_lib_edi_convert_UPLCOMPTES_to_mapMethodJson($handle_in) ;
			break ;
		case 'upload_COMPTES_ADRBOOK' :
			$mapMethodJson = specRsiRecouveo_lib_edi_convert_UPLCOMPTESADRBOOK_to_mapMethodJson($handle_in) ;
			break ;
		case 'upload_FACTURES' :
			$mapMethodJson = specRsiRecouveo_lib_edi_convert_UPLFACTURES_to_mapMethodJson($handle_in) ;
			break ;
		case 'upload_ACCOUNT_PROPERTIES':
			$mapMethodJson = specRsiRecouveo_lib_edi_convert_UPL_ACCPROPERTIES_to_mapMethodJson($handle_in) ;
			break ;
		case 'upload_ACCOUNT_TXTACTION':
			$mapMethodJson = specRsiRecouveo_lib_edi_convert_UPL_ACCTXTACTION_to_mapMethodJson($handle_in) ;
			break ;
		case 'upload_ACTION':
			$mapMethodJson = specRsiRecouveo_lib_edi_convert_UPL_ACTION_to_mapMethodJson($handle_in) ;
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
			if( $sret['idx_new'] ) {
				foreach( $sret['idx_new'] as $idx ) {
					$ret['idx_new'][] = $idx ;
				}
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
	if( !$json_rows ) {
			$json_rows = array() ;
	}
	
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
		case 'account_txtaction' :
			$ret = specRsiRecouveo_lib_edi_post_account_txtaction( $json_rows ) ;
			break ;
		case 'record' :
			$ret = specRsiRecouveo_lib_edi_post_record( $json_rows ) ;
			break ;
		case 'record_lettermissing' :
			$ret = specRsiRecouveo_lib_edi_post_recordLetterMissing( $json_rows ) ;
			break ;
		case 'account_adrbookentry' :
			$ret = specRsiRecouveo_lib_edi_post_adrbook( $json_rows ) ;
			break ;
		case 'account_notepadbin' :
			$ret = specRsiRecouveo_lib_edi_post_acc_notepadbin( $json_rows ) ;
			break ;
		case 'account_properties':
			$ret = specRsiRecouveo_lib_edi_post_acc_properties( $json_rows ) ;
			break ;
		case 'notification':
			$ret = specRsiRecouveo_lib_edi_post_notification( $json_rows ) ;
			break ;
		case 'action':
			$ret = specRsiRecouveo_lib_edi_post_action( $json_rows ) ;
			break ;
		case 'DEV_purgeall':
			$ret = specRsiRecouveo_lib_edi_post_devpurge( $json_rows ) ;
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
	
	if( $val=$GLOBALS['_cache_specRsiRecouveo_lib_edi_mapSocStrToId'][$id_soc] ) {
		$id_soc = $val ;
	} else {
		// test + normalisation du code société
		$query = "SELECT field_SOC_ID FROM view_bible_LIB_ACCOUNT_tree WHERE field_SOC_NAME = '{$id_soc}' OR field_SOC_ID = '{$id_soc}'" ;
		$result = $_opDB->query($query) ;
		if( $_opDB->num_rows($result) < 1 ) {
			return false ;
		}
		$row = $_opDB->fetch_row($result) ;
		$GLOBALS['_cache_specRsiRecouveo_lib_edi_mapSocStrToId'][$id_soc] = $row[0] ;
		$id_soc = $row[0] ;
	}

	if( !$id_cli ) {
		return $id_soc ;
	}
	
	// HACK! France cars 06/12/2019
	$id_cli = str_replace("'",'',$id_cli) ;
	
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
function specRsiRecouveo_lib_edi_validateCliRecord( $id_cli, $id_record ) {
	global $_opDB;
	if( !$id_cli ) {
		return NULL ;
	}
	$query_base = "SELECT filerecord_id FROM view_file_RECORD WHERE field_LINK_ACCOUNT='{$id_cli}'" ;
	
	if( is_numeric($id_record) ) {
		$query = $query_base." AND filerecord_id='{$id_record}'" ;
		$result = $_opDB->query($query) ;
		if( $_opDB->num_rows($result) == 1 ) {
			$arr = $_opDB->fetch_row($result) ;
			return $arr[0] ;
		}
	}
	
	if( TRUE ) {
		$query = $query_base." AND field_RECORD_ID='{$id_record}'" ;
		$result = $_opDB->query($query) ;
		if( $_opDB->num_rows($result) == 1 ) {
			$arr = $_opDB->fetch_row($result) ;
			return $arr[0] ;
		}
	}
	
	if( TRUE ) {
		$query = $query_base." AND field_RECORD_REF='{$id_record}'" ;
		$result = $_opDB->query($query) ;
		if( $_opDB->num_rows($result) == 1 ) {
			$arr = $_opDB->fetch_row($result) ;
			return $arr[0] ;
		}
	}
	
	return NULL ;
}

function specRsiRecouveo_lib_edi_post_adrbook($json_rows){
	global $_opDB;
	
	$mandatory = array('IdSoc', 'IdCli', 'AdrType', 'Adr') ;
	$skip_ifempty = array('Adr') ;
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
		$missing = $empties = array() ;
		foreach($mandatory as $field){
			if ( !isset($json_row[$field])){
				$missing[] = $field ;
			}
		}
		foreach( $skip_ifempty as $field ) {
			if( !trim($json_row[$field]) ) {
				$empties[] = $field ;
			}
		}
		if (count($missing) > 0){
			$ret_errors[] = "ERR Idx={$idx} : missing field(s) ".implode(',',$missing) ;
			continue ;
		}
		if (count($empties) > 0){
			continue ;
		}
		$txt_IdSoc = $json_row['Idsoc'] ;
		$json_row['IdSoc'] = specRsiRecouveo_lib_edi_validateSocCli($json_row['IdSoc']) ;
		if( !$json_row['IdSoc'] ) {
			$ret_errors[] = "ERR Idx={$idx} : unknown IdSoc={$txt_IdSoc}" ;
			continue ;
		}
		$json_row['IdCli'] = specRsiRecouveo_lib_edi_validateSocCli($json_row['IdSoc'],$json_row['IdCli']) ;
		if( !$json_row['Lib'] ) {
			$query = "SELECT field_ACC_NAME FROM view_bible_LIB_ACCOUNT_entry WHERE entry_key='{$json_row['IdCli']}'" ;
			$json_row['Lib'] = $_opDB->query_uniqueValue($query) ;
		}

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

function specRsiRecouveo_lib_edi_post_acc_notepadbin($json_rows){
	global $_opDB;

	$mandatory = array('IdSoc','IdCli', 'BinFilename', 'BinDesc', 'BinBase64') ;
	
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
		
		$forward_post = array(
			'acc_id' => $json_row['IdCli'],
			'bin_desc' => $json_row['BinDesc'],
			'bin_filename' => $json_row['BinFilename'],
			'bin_base64' => $json_row['BinBase64'],
			'bin_replace' => 1
		);
		//print_r($forward_post) ;
		specRsiRecouveo_account_uploadAttachment($forward_post) ;
		$count_success++ ;
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
		'XeCurrencyCode' => 'field_XE_CURRENCY_CODE',
		'XeCurrencySign' => 'field_XE_CURRENCY_SIGN',
		
		// 02/2019 : update to Wiki
		'IdRecord' => 'field_RECORD_ID',
		'NumRecord' => 'field_RECORD_REF',
		'LibRecord' => 'field_RECORD_TXT',
		'DateRecord' => 'field_DATE_RECORD',
		'DateExpire' => 'field_DATE_VALUE'
	);
	$count_success = 0;
	$count_new = array() ;
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
		if( is_string($json_row['XeCurrencyCode']) && !$json_row['XeCurrencySign'] ) {
			$json_row['XeCurrencySign'] = $json_row['XeCurrencyCode'] ;
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
			$count_new[] = $idx ;
		}
		else{
			$arr = $_opDB->fetch_row($result) ;
			$filerecord_id = $arr[0] ;
			unset($arr_ins['field_DATE_LOAD']) ; // 24/06/2020
			paracrm_lib_data_updateRecord_file('RECORD', $arr_ins, $filerecord_id) ;
			$count_success++;
		}
	}
	return array("count_success" => $count_success, "idx_new" => $count_new, "errors" => $ret_errors) ;
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
	$count_new = array() ;
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
			$count_new[] = $idx ;
		}
		else{
			paracrm_lib_data_updateRecord_bibleEntry("LIB_ACCOUNT", $entry_key, $arr_ins) ;
			$count_success++ ;
		}
		// existant ou MaJ ?



	}

	return array("count_success" => $count_success, "idx_new" => $count_new, "errors" => $ret_errors) ;
}

function specRsiRecouveo_lib_edi_post_account_txtaction( $json_rows ) {
	global $_opDB;
	
	$mandatory = array('IdSoc','IdCli','TxtTitle','Txt') ;
	
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
		
		$query = "SELECT filerecord_id FROM view_file_FILE 
			WHERE field_LINK_ACCOUNT='{$json_row['IdCli']}'
			AND field_STATUS LIKE 'S1\_%'" ;
		$file_filerecord_id = $_opDB->query_uniqueValue($query) ;
		
		$forward_post = array(
			'file_filerecord_id' => $file_filerecord_id,
			'data' => json_encode(array(
				'link_action' => 'BUMP',
				'link_txt' => $json_row['TxtTitle'],
				'txt' => $json_row['Txt'],
				'next_action_save' => TRUE
			))
		);
		specRsiRecouveo_action_doFileAction($forward_post) ;
		$count_success++ ;
	}

	return array("count_success" => $count_success, "errors" => $ret_errors) ;
}
function specRsiRecouveo_lib_edi_post_notification($json_rows) {
	global $_opDB;
	
	$mandatory = array('IdSoc','IdCli','Txt') ;
	
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
		
		specRsiRecouveo_account_pushNotificationRecords( array(
			'acc_id' => $json_row['IdCli'],
			'txt_notification' => $json_row['Txt'],
			'arr_recordFilerecordIds' => json_encode(array())
		));
		
		$count_success++ ;
	}

	return array("count_success" => $count_success, "errors" => $ret_errors) ;
}
function specRsiRecouveo_lib_edi_post_action($json_rows) {
	global $_opDB;
	
	$search_actions = function($action_mode, $action_param, $acc_id) use (&$TAB_actions) {
		foreach( $TAB_actions as $action_idx => $action_row ) {
			if( ($action_row['action_mode']==$action_mode)
					&& ($action_row['action_param']==$action_param)
					&& ($action_row['acc_id']==$acc_id) ) {
				return $action_idx ;
			}
		}
		return FALSE ;
	};
	
	$TAB_actions = array() ;
	
	$mandatory = array('IdSoc','IdCli','IdRecord') ;
	
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
		
		// MANDATORY : IdCli
		$txt_IdSoc = $json_row['IdSoc'] ;
		$json_row['IdSoc'] = specRsiRecouveo_lib_edi_validateSocCli($json_row['IdSoc']) ;
		if( !$json_row['IdSoc'] ) {
			$ret_errors[] = "ERR Idx={$idx} : unknown IdSoc={$txt_IdSoc}" ;
			continue ;
		}
		$json_row['IdCli'] = specRsiRecouveo_lib_edi_validateSocCli($json_row['IdSoc'],$json_row['IdCli']) ;
		
		
		// MANDATORY : IdRecord
		$txt_IdRecord = $json_row['IdRecord'] ;
		$json_row['IdRecord'] = specRsiRecouveo_lib_edi_validateCliRecord($json_row['IdCli'],$json_row['IdRecord']) ;
		if( !$json_row['IdRecord'] ) {
			$ret_errors[] = "ERR Idx={$idx} : unknown IdRecord={$txt_IdRecord}" ;
			continue ;
		}
		
		// ACTION_MODE
		if( $json_row['StatusPrimary'] ) {
			$json_row['ActionMode'] = 'status' ;
			
			$query = "SELECT field_SCHED_LOCK, field_CODE FROM view_bible_CFG_STATUS_tree 
					WHERE field_CODE='{$json_row['StatusPrimary']}' OR field_TXT='{$json_row['StatusPrimary']}'" ;
			$result = $_opDB->query($query) ;
			if( $_opDB->num_rows($result) == 1 ) {
				$arr = $_opDB->fetch_row($result) ;
				if( $arr[0] ) { // schedlock
					$json_row['ActionParam'] = $arr[1] ;
				} else { // encours
					$json_row['ActionParam'] = '_' ;
				}
			}
			if( $json_row['StatusSub'] ) {
				$bible_code = NULL ;
				switch( $json_row['ActionParam'] ) {
					case 'S2P_PAY' :
						//echo $json_row['StatusSub'] ;
						//echo strtotime($json_row['StatusSub']) ;
						if( strtotime($json_row['StatusSub']) ) {
							$json_row['ActionParam'].= ':'.date('Y-m-d',strtotime($json_row['StatusSub'])) ;
						} else {
							$json_row['ActionParam'].= ':'.date('Y-m-d') ;
						}
						break ;
					case 'S2J_JUDIC' :
						$bible_code = 'OPT_JUDIC' ;
						break ;
					case 'S2L_LITIG' :
						$bible_code = 'OPT_LITIG' ;
						break ;
					case 'SX_CLOSE' :
						$bible_code = 'OPT_CLOSEASK' ;
						break ;
				}
				if( $bible_code ) {
					$query = "SELECT treenode_key FROM view_bible_{$bible_code}_tree 
							WHERE field_OPT_ID='{$json_row['StatusSub']}' OR field_OPT_TXT='{$json_row['StatusSub']}'" ;
					if( $sub_param = $_opDB->query_uniqueValue($query) ) {
						$json_row['ActionParam'].= ':'.$sub_param ;
					}
				}
			}
			if( !$json_row['ActionMode'] || !$json_row['ActionParam'] ) {
				$ret_errors[] = "ERR Idx={$idx} : no action specified / unsupported" ;
				continue ;
			}
			
			// stockage de l'action
			$action_idx = $search_actions($json_row['ActionMode'],$json_row['ActionParam'],$json_row['IdCli']) ;
			if( $action_idx===FALSE ) {
				$TAB_actions[] = array(
					'action_mode' => $json_row['ActionMode'],
					'action_param' => $json_row['ActionParam'],
					'acc_id' => $json_row['IdCli']
				);
				$action_idx = (count($TAB_actions) - 1) ;
			}
			if( !$json_row['IdRecord'] ) {
				$TAB_actions[$action_idx]['arr_recordFilerecordIds'] = NULL ;
			}
			if( $json_row['IdRecord'] ) {
				if( !isset($TAB_actions[$action_idx]['arr_recordFilerecordIds']) ) {
					$TAB_actions[$action_idx]['arr_recordFilerecordIds'] = array() ;
				}
				if( is_array($TAB_actions[$action_idx]['arr_recordFilerecordIds']) ) {
					$TAB_actions[$action_idx]['arr_recordFilerecordIds'][] = $json_row['IdRecord'] ;
				}
			}
		}
		
		if( $json_row['RecordTxt'] ) {
			$TAB_actions[] = array(
				'action_mode' => 'record_txt',
				'action_param' => trim($json_row['RecordTxt']),
				'record_filerecord_id' => $json_row['IdRecord']
			);
		}
		
		$count_success++ ;
	}
	
	// PROCESS : action_mode=status
	foreach( $TAB_actions as $row_action ) {
		if( $row_action['action_mode'] != 'status' ) {
			continue ;
		}
		
		$acc_id = $row_action['acc_id'] ;
		// account_open
		$json = specRsiRecouveo_account_open( array('acc_id'=>$acc_id) ) ;
		if( !$json['success'] ) {
			continue ;
		}
		$account_row = $json['data'] ;
		//print_r($account_row) ;
		
		// 
		
		// statut actuel
		$map_recordFilerecordId_status = array() ;
		$map_recordFilerecordId_amount = array() ;
		$targetFile_openFilerecordId = NULL ;
		foreach( $account_row['files'] as $file_row ) {
			switch( $accountFile_record['status'] ) {
				case 'S1_OPEN' :
				case 'S1_SEARCH' :
					$targetFile_openFilerecordId = $accountFile_record['file_filerecord_id'] ;
					break ;
			}
			
			$file_status = ($file_row['status_is_schedlock'] ? $file_row['status'] : '_' ) ;
			if( strpos($file_row['status_substatus'],$file_row['status'])===0 ) {
				$file_status = $file_row['status_substatus'] ;
			}
			if( $file_row['status']=='S2P_PAY' ) {
				$file_status.= ':'.date('Y-m-d',strtotime($file_row['next_date'])) ;
			}
			
			foreach( $file_row['records'] as $record_row ) {
				$map_recordFilerecordId_status[$record_row['record_filerecord_id']] = $file_status ;
				$map_recordFilerecordId_amount[$record_row['record_filerecord_id']] = $record_row['amount'] ;
			}
		}
		//print_r($map_recordFilerecordId_status) ;
		
		// HACK : si pas de pièces spécifiées => mutation globale
		if( !isset($row_action['arr_recordFilerecordIds']) ) {
			// TMP : abort
			continue ;
			$row_action['arr_recordFilerecordIds'] = array_values($map_recordFilerecordId_status) ;
		}
		
		
		if( $row_action['action_mode'] == 'status' ) {
			$target_status = $row_action['action_param'] ;
			$transaction_recordFilerecordIds = array() ;
			foreach( $row_action['arr_recordFilerecordIds'] as $record_filerecord_id ) {
				// if status_src = status_dst : rien à faire 
				if( $map_recordFilerecordId_status[$record_filerecord_id] == $target_status ) {
					continue ;
				}
				$transaction_recordFilerecordIds[] = $record_filerecord_id ;
			}
			
			// if status_src != _
			// => move to encours $targetFile_openFilerecordId
			$moveback_recordFilerecordIds = array() ;
			foreach( $transaction_recordFilerecordIds as $record_filerecord_id ) {
				if( $map_recordFilerecordId_status[$record_filerecord_id] != '_' ) {
					$moveback_recordFilerecordIds[] = $record_filerecord_id ;
				}
			}
			if( $moveback_recordFilerecordIds ) {
				specRsiRecouveo_file_allocateRecordTemp( array(
					'file_filerecord_id' => $targetFile_openFilerecordId,
					'arr_recordFilerecordIds' => json_encode($moveback_recordFilerecordIds)
				)) ;
			}
			
			
			// if status_dst != _
			// => specRsiRecouveo_file_createForAction
			if( ($target_status != '_') && $transaction_recordFilerecordIds ) {
				$ttmp = explode(':',$target_status) ;
				$target_status_base = $ttmp[0] ;
				$target_status_suffix = $ttmp[1] ;
				
				$forward_post = NULL ;
				switch( $target_status_base ) {
					case 'S2P_PAY' :
						$agree_amount = 0 ;
						foreach( $transaction_recordFilerecordIds as $record_filerecord_id ) {
							$agree_amount += $map_recordFilerecordId_amount[$record_filerecord_id] ;
						}
						$forward_post = array(
							'acc_id' => $acc_id,
							'arr_recordIds' => json_encode($transaction_recordFilerecordIds),
							'new_action_code' => 'AGREE_START',
							'form_data' => json_encode(array(
								'new_action_id' => 'AGREE_START',
								'agree_period' => 'SINGLE',
								'agree_date' => $target_status_suffix,
								'agree_amount' => $agree_amount
							))
						);
						break ;
						
					case 'S2L_LITIG' :
						$forward_post = array(
							'acc_id' => $acc_id,
							'arr_recordIds' => json_encode($transaction_recordFilerecordIds),
							'new_action_code' => 'LITIG_START',
							'form_data' => json_encode(array(
								'new_action_id' => 'LITIG_START',
								'litig_code' => $target_status_suffix,
								'litig_nextdate' => date('Y-m-d',strtotime('+7 days')),
								'litig_txt' => 'Modification en masse'
							))
						);
						break ;
						
					case 'S2J_JUDIC' :
						$forward_post = array(
							'acc_id' => $acc_id,
							'arr_recordIds' => json_encode($transaction_recordFilerecordIds),
							'new_action_code' => 'JUDIC_START',
							'form_data' => json_encode(array(
								'new_action_id' => 'JUDIC_START',
								'judic_code' => $target_status_suffix,
								'judic_nextdate' => date('Y-m-d',strtotime('+7 days')),
								'judic_txt' => 'Modification en masse'
							))
						);
						break ;
						
					case 'SX_CLOSE' :
						$forward_post = array(
							'acc_id' => $acc_id,
							'arr_recordIds' => json_encode($transaction_recordFilerecordIds),
							'new_action_code' => 'CLOSE_ASK',
							'form_data' => json_encode(array(
								'new_action_id' => 'CLOSE_ASK',
								'close_code' => $target_status_suffix,
								'close_txt' => 'Modification en masse'
							))
						);
						break ;
				
					default :
						break ;
				}
				if( $forward_post ) {
					specRsiRecouveo_file_createForAction($forward_post) ;
				}
			}
		}
		
		specRsiRecouveo_file_lib_updateStatus($acc_id) ;
		specRsiRecouveo_file_lib_manageActivate($acc_id) ;
	}
	
	// PROCESS : action_mode=record_txt
	foreach( $TAB_actions as $row_action ) {
		if( $row_action['action_mode'] != 'record_txt' ) {
			continue ;
		}
		
		$record_filerecord_id = $row_action['record_filerecord_id'] ;
		
		$sql_recordTxt = $_opDB->escape_string($row_action['action_param']) ;
		$query = "SELECT filerecord_id FROM view_file_RECORD_TXT 
				WHERE filerecord_parent_id='{$record_filerecord_id}' AND field_TXT_CONTENT='{$sql_recordTxt}'" ;
		if( $_opDB->query_uniqueValue($query) > 0 ) {
			continue ;
		}
		
		$arr_ins = array() ;
		$arr_ins['field_TXT_DATE'] = date('Y-m-d H:i:s') ;
		$arr_ins['field_TXT_CONTENT'] = $row_action['action_param'] ;
		paracrm_lib_data_insertRecord_file( 'RECORD_TXT', $record_filerecord_id, $arr_ins );
	}

	return array("count_success" => $count_success, "errors" => $ret_errors) ;
}

function specRsiRecouveo_lib_edi_post_devpurge() {
	global $_opDB;
	
	if( !$GLOBALS['__OPTIMA_APIDEV'] ) {
		return array("count_success" => 0, "errors" => array('Overwrite locked')) ;
	}
	
	$queries = array() ;
	$queries[] = "TRUNCATE TABLE store_bible_LIB_ACCOUNT_entry" ;
	$queries[] = "TRUNCATE TABLE store_file_ADRBOOK" ;
	$queries[] = "TRUNCATE TABLE store_file_ADRBOOK_ENTRY" ;
	$queries[] = "TRUNCATE TABLE store_file_FILE" ;
	$queries[] = "TRUNCATE TABLE store_file_FILE_ACTION" ;
	$queries[] = "TRUNCATE TABLE store_file_RECORD" ;
	$queries[] = "TRUNCATE TABLE store_file_RECORD_LINK" ;
	
	foreach( $queries as $query ) {
		$_opDB->query($query) ;
	}
	return array("count_success" => 0, "errors" => array()) ;
}




function specRsiRecouveo_lib_edi_post_recordLetterMissing( $json_rows) {
	global $_opDB;
	
	$mandatory = array('IdSoc', 'IdCli', 'IdFact') ; // Lib = record_txt
	$map_json2db = array(
		'IdCli' => 'field_LINK_ACCOUNT',
		'IdFact' => 'field_RECORD_ID'
	);
	$map_soc_filerecordIds = array() ;
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
		
		$arr_ins = array() ;
		foreach($map_json2db as $json_field => $db_field){
			if( isset($json_row[$json_field]) ) {
				$arr_ins[$db_field] = $json_row[$json_field] ;
			}
		}

		if( !$map_soc_filerecordIds[$json_row['IdSoc']] ) {
			$map_soc_filerecordIds[$json_row['IdSoc']] = array() ;
		}
		
		$query_accId = $_opDB->escape_string($arr_ins["field_LINK_ACCOUNT"]) ;
		$query_recordId = $_opDB->escape_string($arr_ins["field_RECORD_ID"]) ;
		$query = "SELECT filerecord_id FROM view_file_RECORD WHERE field_RECORD_ID = '{$query_recordId}' AND field_LINK_ACCOUNT = '{$query_accId}'" ;
		$filerecord_id = $_opDB->query_uniqueValue($query) ;
		if( $filerecord_id ){
			$map_soc_filerecordIds[$json_row['IdSoc']][] = $filerecord_id ;
			$count_success++;
		}
	}
	
	foreach( $map_soc_filerecordIds as $soc => $toKeep_filerecordIds ) {
		$existing_filerecordIds = array() ;
		$query = "SELECT r.filerecord_id FROM view_file_RECORD r
					INNER JOIN view_bible_LIB_ACCOUNT_entry lae ON lae.entry_key=r.field_LINK_ACCOUNT
					WHERE lae.treenode_key='{$soc}' AND r.field_LETTER_IS_CONFIRM='0'" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$existing_filerecordIds[] = $arr[0] ;
		}
		$toDelete_filerecordIds = array_diff($existing_filerecordIds,$toKeep_filerecordIds) ;
		foreach( $toDelete_filerecordIds as $filerecord_id ) {
			$arr_update = array(
				'field_LETTER_IS_CONFIRM' => 1,
				'field_LETTER_CODE' => 'ediDelete',
				'field_LETTER_DATE' => date('Y-m-d')
			) ;
			$arr_cond = array('filerecord_id'=>$filerecord_id) ;
			$_opDB->update('view_file_RECORD',$arr_update,$arr_cond) ;
		}
	}
	//print_r($map_soc_filerecordIds) ;
	return array("count_success" => $count_success, "errors" => $ret_errors) ;
}

?>
