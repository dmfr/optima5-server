<?php

function specRsiRecouveo_lib_edi_upload($apikey_code, $transaction, $data){
	switch ($transaction){
		case "upload_account":
			$json = specRsiRecouveo_lib_edi_IMPORT_ACCOUNT($data,false, false) ;
			//print_r($json) ;
			$ret_acc = specRsiRecouveo_lib_edi_post( $apikey_code, "account", $json["account"] ) ;
			$ret_adrbook = specRsiRecouveo_lib_edi_post( $apikey_code, "account_adrbookentry", $json["adrbook"] ) ;
			return array("account" => $ret_acc, "adrbook" => $ret_adrbook) ;
		case "upload_record":
			$json = specRsiRecouveo_lib_edi_IMPORT_RECORD($data,false, false) ;
			$ret_rec = specRsiRecouveo_lib_edi_post( $apikey_code, "record", $json["records"] ) ;
			return array("records" => $ret_rec) ;
	}
}

function specRsiRecouveo_lib_edi_IMPORT_ACCOUNT($handle, $doUpload = true, $isXls = true){
	if ($isXls){
		$handle = paracrm_lib_dataImport_preHandle($handle) ;
	}

	$headers = fgetcsv($handle) ;
	//print_r($headers) ;
	$account_headers = array() ;
	foreach ($headers as $head){
		$new_head = null ;
		switch ($head) {
			case "Société":
				$new_head = "IdSoc";
				break;
			case "Numéro client":
				$new_head = "IdCli";
				break;
			case "Langue":
				$new_head = "Meta:LANG" ;
				break ;
			case "Pro/part.":
				$new_head = "Meta:PROPART" ;
				break ;
			case "Raison sociale":
				$new_head = "NameCli" ;
				break ;
			case "SIREN":
				$new_head = "SIRET" ;
				break;
			default:
				$new_head = $head ;
		}
		$account_headers[$j] = $new_head;
		$j++;
	}
	//print_r($account_headers) ;
	$array_csv = array() ;
	$i = 0 ;

	while ($data = fgetcsv($handle)){
		$data = array_combine($account_headers, $data) ;
		$array_csv[$i] = $data ;
		$i++;
	}
	//print_r($array_csv) ;
	$array_json = json_encode($array_csv) ;
	$adrbook_array = specRsiRecouveo_lib_edi_HANDLE_ADRBOOK($array_csv) ;
	$adrbook_json = json_encode($adrbook_array) ;
	//print_r($adrbook_array) ;
	//print_r($array_csv) ;
	//print_r($adrbook_array) ;
	if (!$doUpload){
		return array("account" => $array_json, "adrbook" => $adrbook_json) ;
	}

	$account = specRsiRecouveo_lib_edi_post($_SESSION["login_data"]["userstr"], "account", $array_json) ;
	$adrbook = specRsiRecouveo_lib_edi_post($_SESSION["login_data"]["userstr"], "account_adrbookentry", $adrbook_json) ;
	if (count($account["errors"]) > 0 || count($adrbook["errors"]) > 0){
		return false ;
	}
	return true ;


}

function specRsiRecouveo_lib_edi_HANDLE_ADRBOOK($array_csv){
	// HACK Rayane DEV, format ADR + reindent
	$adrbook_array = array() ;
	$i = 0 ;
	foreach ($array_csv as $row){
		//print_r($row["IdSoc"]) ;
		if ($row["Adresse 1"]){
			$adresse = $row["Adresse 1"]."\n".$row["Code postal"]." ".$row["Ville"]."\n".$row["Pays"] ;
			$adrbook_array[$i]["AdrType"] = "POSTAL";
			$adrbook_array[$i]["IdSoc"] = $row["IdSoc"] ;
			$adrbook_array[$i]["Adr"] = $adresse;
			$adrbook_array[$i]["IdCli"] = $row["IdCli"] ;
			$adrbook_array[$i]["Lib"] = $row["NameCli"] ;
			$i++ ;
		} if ($row["Tél. 1"]){
			$adrbook_array[$i]["AdrType"] = "TEL";
			$adrbook_array[$i]["Adr"] = $row["Tél. 1"];
			$adrbook_array[$i]["IdCli"] = $row["IdCli"] ;
			$adrbook_array[$i]["Lib"] = $row["NameCli"] ;
			$adrbook_array[$i]["IdSoc"] = $row["IdSoc"] ;
			$i++ ;
		} if ($row["Tél. 2"]){
			$adrbook_array[$i]["AdrType"] = "TEL";
			$adrbook_array[$i]["Adr"] = $row["Tél. 2"];
			$adrbook_array[$i]["IdCli"] = $row["IdCli"] ;
			$adrbook_array[$i]["Lib"] = $row["NameCli"] ;
			$adrbook_array[$i]["IdSoc"] = $row["IdSoc"] ;
			$i++ ;
		} if ($row["Mail"]){
			$adrbook_array[$i]["AdrType"] = "EMAIL";
			$adrbook_array[$i]["Adr"] = $row["Mail"];
			$adrbook_array[$i]["IdCli"] = $row["IdCli"] ;
			$adrbook_array[$i]["Lib"] = $row["NameCli"] ;
			$adrbook_array[$i]["IdSoc"] = $row["IdSoc"] ;
			$i++ ;
		}
	}
	return $adrbook_array ;
}

function specRsiRecouveo_lib_edi_IMPORT_RECORD($handle, $doUpload = true, $isXls = true){
	if ($isXls){
		$handle = paracrm_lib_dataImport_preHandle($handle) ;
	}

	$headers = fgetcsv($handle) ;
	$json_headers = array() ;
	$j = 0 ;
	foreach ($headers as $head){
		$new_head = null ;
		switch ($head){
			case "Société":
				$new_head = "IdSoc";
				break ;
			case "Numéro client":
				$new_head = "IdCli" ;
				break ;
			case "Date transmission":
				$new_head = "DateTrans" ;
				break ;
			case "Date facture":
				$new_head = "DateFact" ;
				break ;
			case "Date échéance":
				$new_head = "DateLimite" ;
				break ;
			case "Id facture":
				$new_head = "IdFact" ;
				break ;
			case "Numéro facture":
				$new_head = "NumFact" ;
				break ;
			case "Libellé":
				$new_head = "Lib" ;
				break ;
			case "Montant HT":
				$new_head = "MontantHT" ;
				break ;
			case "Montant TTC":
				$new_head = "MontantTTC" ;
				break ;
			case "Montant TVA":
				$new_head = "MontantTVA" ;
				break ;
			case "Journal":
				$new_head = "Journal" ;
				break ;
			case "Lettrage":
				$new_head = "Letter" ;
				break ;
			default:
				$new_head = $head ;

		}

		$json_headers[$j] = $new_head;
		$j++;
	}
	$array_csv = array() ;
	$i = 0 ;

	while ($data = fgetcsv($handle)){
		$data = array_combine($json_headers, $data) ;
		$array_csv[$i] = $data ;
		$i++;
	}
	//print_r($array_csv) ;
	$array_json = json_encode($array_csv) ;
	if (!$doUpload){
		return array("records" => $array_json) ;
	}
	$records = specRsiRecouveo_lib_edi_post($_SESSION["login_data"]["userstr"], "record", $array_json) ;
	if (count($records["errors"]) > 0){
		//print_r($records) ;
		return false ;
	}
	return true ;
}
function specRsiRecouveo_lib_edi_post($apikey_code, $transaction, $data){ // PUBLIC
	// Tab normalisé de retour
		// - count_success
		// - errors TAB
	
	// normaliser le data => json_array[json_rows]
	$json_rows = json_decode($data,true) ;
	
	// HACK: meta
	foreach( $json_rows as &$json_row ) {
		$todel_tags = array() ;
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
		return false ;
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
		'Adr' => 'field_ADR_TXT'
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

		$query = "SELECT filerecord_id FROM view_file_ADRBOOK_ENTRY WHERE field_ADR_TYPE = '{$json_row["AdrType"]}' AND REGEXP_REPLACE(field_ADR_TXT,'[^A-Za-z0-9 ]','') = REGEXP_REPLACE('{$mysql_Adr}','[^A-Za-z0-9 ]','') " ;
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
		'NonFactType' => 'field_TYPE',
	);
	$count_success = 0;
	$ret_errors = array() ;
	foreach($json_rows as $idx => $json_row){
		if ($json_row['DateTrans'] == null){
			$json_row['DateTrans'] = date("Y-m-d") ;
		}
		else{
			$d = new DateTime($json_row['DateTrans']) ;
			$json_row['DateTrans'] = date_format($d, 'Y-m-d' );
		}
		if ($json_row['DateLimite'] == null){
			$d = new DateTime($json_row['DateFact']) ;
			$json_row['DateLimite'] = date_format($d, 'Y-m-d' );
		}
		else{
			$d = new DateTime($json_row['DateLimite']) ;
			$json_row['DateLimite'] = date_format($d, 'Y-m-d' );
		}
		$d = new DateTime($json_row['DateFact']) ;
		$json_row['DateFact'] = date_format($d, 'Y-m-d' );

		if ($json_row['NumFact'] == null){
			$json_row['NumFact'] = $json_row['IdFact'] ;
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

		$query = "SELECT filerecord_id FROM view_file_RECORD WHERE field_RECORD_ID = '{$arr_ins["field_RECORD_ID"]}' AND field_LINK_ACCOUNT = '{$arr_ins["field_LINK_ACCOUNT"]}'" ;
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
