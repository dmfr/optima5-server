<?php
function specRsiRecouveo_upload( $post_data ) {
	global $_opDB ;
	
	$handle = fopen($_FILES['file_upload']['tmp_name'],"rb") ;
	$file_model = $post_data['file_model'] ;
	
	// Specs
	switch( $file_model ) {
		case 'CIC_BANK' :
			$ret = specDbsTracy_upload_CICBANK_tmp($handle) ;
			break ;
			
		case 'IMPORT_ACC' :
			$ret = specRsiRecouveo_upload_EDI_IMPORT_ACCOUNT($handle) ;
			break ;

		case 'IMPORT_REC' :
			$ret = specRsiRecouveo_upload_EDI_IMPORT_RECORD($handle) ;
			break ;

		case 'SET_ALLOC' :
			$ret = specRsiRecouveo_upload_EDI_IMPORT($handle,$file_model) ;
			break ;
		
		default :
			return array('success'=>false);
	}
	
	return array('success'=>$ret) ;
}

function specDbsTracy_upload_CICBANK_tmp( $handle ) {
	global $_opDB ;
	
	$str = stream_get_contents($handle) ;
	$str = mb_convert_encoding($str, "UTF-8");
	
	$handle_utf = tmpfile() ;
	fwrite($handle_utf,$str) ;
	fseek($handle_utf,0) ;
	
	$my_sdomain = $_POST['_sdomainId'] ;
	if( $my_sdomain ) {
		$_opDB->select_db( $GLOBALS['mysql_db'].'_'.'edi') ;
	}
	$data_type = 'file' ;
	$store_code = 'IN_CALOON_CASH' ;
	$ret = paracrm_lib_dataImport_commit_processHandle( $data_type, $store_code, $handle_utf ) ;
	if( !$ret ) {
		return FALSE ;
	}
	
	$ret = paracrm_queries_direct( array(
		'q_type' => 'qsql',
		'q_id' => 'Load Caloon Banque'
	), $is_rw=TRUE ) ;
	
	$my_sdomain = $_POST['_sdomainId'] ;
	if( $my_sdomain ) {
		$_opDB->select_db( $GLOBALS['mysql_db'].'_'.$my_sdomain) ;
	}
	
	paracrm_queries_direct( array(
		'q_type' => 'qsql',
		'q_id' => 'Bank : Classif types'
	), $is_rw=true ) ;
	
	fclose($handle_utf) ;
	return TRUE ;
}


function specRsiRecouveo_upload_EDI_IMPORT_ACCOUNT($handle, $doUpload = true, $isXls = true){
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
	$adrbook_array = specRsiRecouveo_upload_API_HANDLE_ADRBOOK($array_csv) ;
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

function specRsiRecouveo_upload_API_HANDLE_ADRBOOK($array_csv){
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

function specRsiRecouveo_upload_EDI_IMPORT_RECORD($handle, $doUpload = true){
	//print_r("début") ;
	$handle = paracrm_lib_dataImport_preHandle($handle) ;
	//print_r("handle") ;
	$headers = fgetcsv($handle) ;
	$json_headers = array() ;
	//print_r($headers) ;
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

function specRsiRecouveo_upload_EDI_IMPORT( $handle, $file_model ) {
	global $_opDB ;
	
	$handle = paracrm_lib_dataImport_preHandle($handle) ;
	
	$my_sdomain = $_POST['_sdomainId'] ;
	if( $my_sdomain ) {
		$_opDB->select_db( $GLOBALS['mysql_db'].'_'.'edi') ;
	}
	$data_type = 'file' ;
	$store_code = $file_model ;
	$ret = paracrm_lib_dataImport_commit_processHandle( $data_type, $store_code, $handle ) ;
	if( !$ret ) {
		return FALSE ;
	}
	
	
	switch( $file_model ) {
		case 'IMPORT_ACC' :
			$q_id = 'IMPORT Comptes' ;
			break ;
		case 'IMPORT_REC' :
			$q_id = 'IMPORT Factures' ;
			break ;
		case 'SET_ALLOC' :
			$q_id = 'IMPORT Set alloc' ;
			break ;
		default :
			$q_id = NULL ;
			break ;
	}
	if( $q_id ) {
		$ret = paracrm_queries_direct( array(
			'q_type' => 'qsql',
			'q_id' => $q_id
		), $is_rw=TRUE ) ;
	}
	
	
	$my_sdomain = $_POST['_sdomainId'] ;
	if( $my_sdomain ) {
		$_opDB->select_db( $GLOBALS['mysql_db'].'_'.$my_sdomain) ;
	}
	// specRsiRecouveo_lib_autorun_closeEnd() ;
	specRsiRecouveo_lib_autorun_open() ;
	specRsiRecouveo_lib_autorun_manageDisabled() ;
	specRsiRecouveo_lib_autorun_adrbook() ;
	if( $file_model=='SET_ALLOC' ) {
		specRsiRecouveo_lib_scenario_attach() ;
	}
	
	
	return TRUE ;
}




?>
