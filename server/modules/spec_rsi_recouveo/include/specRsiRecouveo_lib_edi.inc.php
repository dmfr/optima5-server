<?php
function specRsiRecouveo_lib_edi_validate_json($transaction, $data){
	global $_opDB ;
	$errors = array() ;
	$fields = array() ;
	$array_data = json_decode($data, true) ;
	$tst = specRsiRecouveo_cfg_getConfig();
	switch ($transaction){
		case 'account':
			$fields[] = "Numéro client" ;
			$fields[] = "Raison sociale" ;
			//$fields[5] = "SIREN" ;
			break ;
		case 'record':
			$fields[] = "Numéro client" ;
			$fields[] = "Date facture" ;
			$fields[] = "Id facture" ;
			$fields[] = "Montant TTC" ;
			$fields[] = "Numéro facture" ;
			break ;
		case 'adrbook':
			$fields[] = "Numéro client" ;
			$fields[] = "Libellé" ;
			$fields[] = "Type d'adresse" ;
			$fields[] = "Adresse" ;
		default:
			break ;
	}
	$request = "SELECT COUNT(*) FROM view_bible_LIB_ACCOUNT_tree" ;
	$result = $_opDB->query($request) ;
	$count = $_opDB->fetch_row($result) ;

	$request = "SELECT field_SOC_ID FROM view_bible_LIB_ACCOUNT_tree" ;
	$result = $_opDB->query($request) ;
	$row = $_opDB->fetch_assoc($result) ;
	//print_r($row) ;

	//print_r($array_data) ;
	foreach ($array_data as $key => $arr){
		//print_r($arr["Code société"]) ;
		if (!isset($arr["Société"]) || $arr["Société"] == null){
			//print_r($arr["Code société"]) ;
			if (!isset($arr["Code société"]) || $arr["Code société"] == null){
				$tmp = $key+1;
				$errors[] = "Il faut préciser le code société ou le nom de la société pour l'enregistrement ".$tmp;
			}
		}
		if (!isset($arr["Code société"]) || $arr["Code société"] == null){
			//print_r($arr["Société"]) ;
			if (!isset($arr["Société"]) || $arr["Société"] == null){
				$tmp = $key+1;
				$errors[] = "Il faut préciser le code société ou le nom de la société pour l'enregistrement ".$tmp;
			}
		}
		foreach ($fields as $field){
			if (isset($arr[$field]) && $arr[$field] != null){

				continue;
			}
			else{
				$tmp = $key+1;
				$errors[] = "Le champ '".$field."' est manquant pour l'enregistrement ".$tmp;
				//return false;
			}
		}
		foreach ($tst["data"]["cfg_soc"] as $soc){
			//print_r($soc["atr_ids"]);
			if ($soc["soc_id"] == $arr["Code société"] || $soc["soc_name"] == $arr["Société"]){
				$soc_name = $soc["soc_name"] ;
				$soc_id = $soc["soc_id"] ;
				break;
			}
		}
		if (!$soc){
			$tmp = $key+1;
			$errors[] = "La société n'est pas reconnue dans l'enregistrement ".$tmp ;
		}
		if ($arr["Meta"]){
			foreach (array_keys($arr["Meta"]) as $meta){
				$founded = 0;
				foreach ($tst["data"]["cfg_soc"] as $temporary){
					if ($temporary["soc_name"] == $soc_name){
						foreach ($temporary["atr_ids"] as $soc_meta){
							$metadata = explode("@", $soc_meta) ;
							//print_r($metadata[1]) ;
							if (strtoupper($meta) == $metadata[1]){
								$founded = 1;
								break ;
							}
						}
						break ;
					}
					else{
						continue ;
					}
				}
				if ($founded == 0){
					$tmp = $key+1;
					$errors[] = "La métadonnée ".$meta." n'est pas reconnue pour la société ".$soc." dans l'enregistrement ".$tmp ;
				}
			}
		}


		$exlode_arr = explode("-", $arr["Numéro client"]) ;
		//print_r($exlode_arr) ;
		$prefix = $exlode_arr[0] ;
		$founded = 0;
		if ($prefix == $arr["Numéro client"]){
			$array_data[$key]["Numéro client"] = $soc_id."-".$arr["Numéro client"];
			$prefix = $soc_id;
		}
		if ($prefix != $soc_id){
			while ($row != null){
				if ($row["field_SOC_ID"] == $prefix){
					$founded = 1;
					break ;
				}
				$row = $_opDB->fetch_assoc($result) ;
			}
			if ($founded == 0){
				$array_data[$key]["Numéro client"] = $soc_id."-".$arr["Numéro client"];
			}
			else{
				$tmp = $key+1;
				$errors[] = "Le préfixe ".$prefix." dans l'enregistrement ".$tmp." n'est pas bon" ;
			}
		}
		if ($transaction == "record"){
			$request = "SELECT * FROM view_bible_LIB_ACCOUNT_entry WHERE field_ACC_ID = '{$array_data[$key]["Numéro client"]}'" ;
			$result = $_opDB->query($request) ;
			$row = $_opDB->fetch_assoc($result) ;
			if ($row == null){
				$id = explode("-", $array_data[$key]["Numéro client"]) ;
				$errors[] = "Le numéro de compte ".$arr['Numéro client']." n'existe pas dans l'enregistrement ".($key+1) ;
			}
			//print_r($row) ;
		}




	}
//	print_r($errors) ;
	if (!empty($errors)){
		$return_array = array("success" => false, "logs" => $errors) ;
		print_r($return_array) ;
		return json_encode($return_array) ;
	}
	$array_json = json_encode($array_data) ;
	return json_encode(array("success" => true, "data" => $array_json)) ;
}

function specRsiRecouveo_lib_edi_insertLogs($data){
	global $_opDB;
	$array_data = json_decode($data, true) ;

	$query = "SELECT MAX(filerecord_id) FROM view_file_Z_LOGRESULT" ;
	$result = $_opDB->query($query) ;
	$row = $_opDB->fetch_row($result) ;
	$max_filerecord_id = $row[0]+1 ;
	$current_date = date("Y-m-d") ;
	$query = "INSERT INTO view_file_Z_LOGRESULT (filerecord_id, field_APIKEY_NAME, field_APIKEY_METHOD, 
	field_APIKEY_WEBRECORDS, field_APIKEY_SUCCESS, field_APIKEY_DATE)
	VALUES ('{$max_filerecord_id}', '{$array_data['keyName']}', '{$array_data['method']}', '{$array_data['data']['logs']}',
	 '{$array_data['data']['success']}', '{$current_date}')" ;
	$_opDB->query($query) ;

}

function specRsiRecouveo_lib_edi_post_adrbook($POST_DATA){
	global $_opDB;
	$array_ins = array() ;
	$cmp = 0;
	$query = "CREATE TEMPORARY TABLE adrbook_temporary(field_ACC_ID VARCHAR(100), field_ADR_ENTITY	VARCHAR (100), 
	field_ADR_ENTITY_NAME VARCHAR (100),field_ADR_TYPE VARCHAR (1000), field_ADR_TXT VARCHAR (100)) " ;
	$result = $_opDB->query($query) ;
	$array_data = json_decode($POST_DATA, true) ;
	foreach ($array_data as $key => $arr){
		$soc = null;
		if ($arr["Code société"] == null){
			$request = "SELECT field_SOC_ID FROM view_bible_LIB_ACCOUNT_tree WHERE '{$arr['Société']}' = field_SOC_NAME" ;
			$result = $_opDB->query($request) ;
			$row = $_opDB->fetch_row($result) ;
			$soc = $row[0] ;
			//print_r($row) ;
		}
		else{
			$soc = $arr['Code société'] ;
		}
		// Vérification si l'adresse existe déjà
		$query = "SELECT filerecord_id FROM view_file_ADRBOOK WHERE field_ACC_ID = '{$arr["Numéro client"]}' AND field_ADR_ENTITY = '{$arr["Libellé"]}'" ;
		$result = $_opDB->query($query) ;
		$id = $_opDB->fetch_row($result) ;

		$query = "SELECT * FROM view_file_ADRBOOK_ENTRY WHERE filerecord_parent_id = '{$id[0]}'" ;
		$result = $_opDB->query($query) ;
		$row = $_opDB->fetch_assoc($result) ;
		while($row != null){
			if ($row["field_ADR_TXT"] == $arr["Adresse"]){
				$exist = 1;
			}
			else{
				$exist = 0;
			}
			$row = $_opDB->fetch_assoc($result) ;
		}
		/*
		if ($arr["Nom destinataire"] == null){
			echo "null" ;
			$dest = '';
		}
		else{
			$dest = $arr["Nom destinataire"] ;
		}
		*/

 		if ($exist == 0){
			$query = "INSERT INTO adrbook_temporary VALUES('{$arr["Numéro client"]}', '{$arr["Libellé"]}', '{$dest}', '{$arr["Type d'adresse"]}', '{$arr["Adresse"]}')" ;
			$result = $_opDB->query($query) ;
			$array_ins["adrbook_filerecord_id"] = 0;
			$array_ins["adr_entity"] = $arr["Libellé"] ;
			$array_ins["adr_entity_name"] = $arr["Nom destinataire"] ;
			$array_ins["adrbookentries"][0]["is_new"] = true;
			$array_ins["adrbookentries"][0]["adr_type"] = $arr["Type d'adresse"] ;
			$array_ins["adrbookentries"][0]["adr_txt"] = $arr["Adresse"] ;
			$array_ins["adrbookentries"][0]["adrbookentry_filerecord_id"] = null;
			$array_ins["adrbookentries"][0]["status_is_priority"] = false;
			$array_ins["adrbookentries"][0]["status_is_confirm"] = false;
			$array_ins["adrbookentries"][0]["status_is_invald"] = false;
			$array_ins["adrbookentries"][0]["is_deleted"] = false;

			$array2 = array("acc_id" => $arr["Numéro client"], "data" => json_encode($array_ins)) ;
			specRsiRecouveo_account_setAdrbook($array2) ;
			$cmp++;
 		}


	}
	//print_r($array_ins) ;


	$request = "SELECT COUNT(*) FROM adrbook_temporary" ;
	$result = $_opDB->query($request) ;
	$count = $_opDB->fetch_row($result) ;

//print_r($count[0]) ;
	$request = "SELECT * FROM adrbook_temporary" ;

	$result = $_opDB->query($request) ;

	for ($i = 0; $i < $count[0]; $i++) {
		$row = $_opDB->fetch_assoc($result);
		//print_r($row);
		//specRsiRecouveo_account_setAdrbook(json_encode($array_ins)) ;
	}

	return json_encode(array("success" => true, "logs" => $cmp." enregistrements ont été ajoutés")) ;

}

function specRsiRecouveo_lib_edi_post_record($POST_DATA){
	global $_opDB;

	$query = "CREATE TEMPORARY TABLE record_temporary(field_RECORD_ID VARCHAR(100), field_RECORD_REF VARCHAR(10), field_RECORD_TXT VARCHAR(100),
	field_IS_DISABLED INT(11), field_LETTER_IS_ON INT(11), field_LETTER_IS_PART INT(11), field_AMOUNT VARCHAR(100), 
	field_LINK_ACCOUNT VARCHAR(100), field_DATE_LOAD datetime, field_DATE_RECORD datetime, field_LETTER_CODE VARCHAR(100),
	field_DATE_VALUE datetime)" ;
	$result = $_opDB->query($query) ;
	$array_data = json_decode($POST_DATA, true) ;
	//print_r($array_data) ;
	foreach ($array_data as $arr){
		$soc = null;
		$date_trans = null;
		$date_value = null;
		if ($arr["Code société"] == null){
			$request = "SELECT field_SOC_ID FROM view_bible_LIB_ACCOUNT_tree WHERE '{$arr['Société']}' = field_SOC_NAME" ;
			$result = $_opDB->query($request) ;
			$row = $_opDB->fetch_row($result) ;
			$soc = $row[0] ;
			//print_r($row) ;
		}
		else{
			$soc = $arr['Code société'] ;
		}
		if ($arr['Date transmission'] == null){
			$date_trans = date("Y-m-d") ;
		}
		else{
			$d = new DateTime($arr['Date transmission']) ;
			$date_trans = date_format($d, 'Y-m-d' );
		}
		if ($arr['Date échéance'] == null){
			$d = new DateTime($arr['Date facture']) ;
			$date_value = date_format($d, 'Y-m-d' );
		}
		else{
			$d = new DateTime($arr['Date échéance']) ;
			$date_value = date_format($d, 'Y-m-d' );
		}
		$d = new DateTime($arr['Date facture']) ;
		$date_facture = date_format($d, 'Y-m-d' );
		$request = "INSERT INTO record_temporary (field_RECORD_ID, field_RECORD_REF, field_RECORD_TXT, field_IS_DISABLED, 
		field_LINK_ACCOUNT, field_DATE_LOAD, field_DATE_RECORD, field_DATE_VALUE, field_AMOUNT)
		 VALUES('{$arr['Id facture']}','{$arr['Numéro facture']}', '{$arr['Libellé']}',	'{$arr['Inactif']}', 
		 '{$arr['Numéro client']}', '{$date_trans}', '{$date_facture}', '{$date_value}', '{$arr['Montant TTC']}')" ;
		$result = $_opDB->query($request) ;
		$array_keys = array_keys($arr['Meta']) ;
		//print_r($array_keys) ;
		foreach ($array_keys as $tst){
			$tst = str_replace(' ', '_', $tst) ;
			$tmp = 'field_ATR_R_'.strtoupper($tst) ;
			$exist = false;
			$request = "SHOW COLUMNS FROM record_temporary" ;
			$result = $_opDB->query($request) ;
			$row = $_opDB->fetch_assoc($result) ;
			while ($row != null){
				$row = $_opDB->fetch_assoc($result) ;
				//print_r($row) ;
				if ($row['Field'] == $tmp){
					//echo "pas ok" ;
					$exist = true ;
				}
			}

			if ($exist == false){
				$request = "ALTER TABLE record_temporary ADD {$tmp} VARCHAR(100)" ;
				$result = $_opDB->query($request) ;
			}
			//print_r($arr['Id facture']) ;
			//echo "\n" ;
			$tmp = 'field_ATR_R_'.strtoupper($tst) ;
			$request = "UPDATE record_temporary SET {$tmp} = '{$arr['Meta'][$tst]}' WHERE field_RECORD_ID = '{$arr['Id facture']}' " ;
			$result = $_opDB->query($request) ;
			//print_r($tst) ;
		}
	}
	$request = "SELECT COUNT(*) FROM record_temporary" ;
	$result = $_opDB->query($request) ;
	$count = $_opDB->fetch_row($result) ;

	//print_r($count[0]) ;
	$request = "SELECT * FROM record_temporary" ;

	$result = $_opDB->query($request) ;
	$cmp = 0;
	for ($i = 0; $i < $count[0]; $i++){
		$row = $_opDB->fetch_assoc($result) ;
		//print_r($row) ;

		$request2 = "SELECT filerecord_id FROM view_file_RECORD WHERE field_RECORD_ID = '{$row['field_RECORD_ID']}'";
		$result2 = $_opDB->query($request2) ;
		$row2 = $_opDB->fetch_assoc($result2) ;
		if ($row2 == null){
			paracrm_lib_data_insertRecord_file( 'RECORD' , 0, $row ) ;
			$cmp ++;
		}
		else{
			paracrm_lib_data_updateRecord_file("RECORD", $row, $row2["filerecord_id"]) ;
			$cmp ++;
		}

	}

	return json_encode(array("success" => true, "logs" => $cmp." enregistrements ont été ajoutés/modifiés avec succès")) ;
}





function specRsiRecouveo_lib_edi_post_account($POST_DATA){
	//print_r($GLOBALS) ;
	global $_opDB;



	//Création de la table temporaire avec les données du json
	$query = "CREATE TEMPORARY TABLE account_temporary(entry_key VARCHAR(100), treenode_key VARCHAR(10), 
	field_ACC_ID VARCHAR(100), field_ACC_NAME VARCHAR(100), field_ACC_SIRET VARCHAR(100))" ;
	$result = $_opDB->query($query) ;
	$array_data = json_decode($POST_DATA, true) ;
	//print_r($array_data) ;

	foreach ($array_data as $arr){
		//print_r($arr['Meta']) ;
		$soc = null;
		if ($arr["Code société"] == null){
			$request = "SELECT field_SOC_ID FROM view_bible_LIB_ACCOUNT_tree WHERE '{$arr['Société']}' = field_SOC_NAME" ;
			$result = $_opDB->query($request) ;
			$row = $_opDB->fetch_row($result) ;
			$soc = $row[0] ;
			//print_r($row) ;
		}
		else{
			$soc = $arr['Code société'] ;
		}


		$request = "INSERT INTO account_temporary (entry_key, treenode_key, field_ACC_ID, field_ACC_NAME) VALUES('{$arr['Numéro client']}','{$soc}','{$arr['Numéro client']}','{$arr['Raison sociale']}')" ;
		$result = $_opDB->query($request) ;
		$array_keys = array_keys($arr['Meta']) ;
		//print_r($array_keys) ;
		foreach ($array_keys as $tst){
			$tmp = 'field_ATR_A_'.strtoupper($tst) ;
			$exist = false;
			$request = "SHOW COLUMNS FROM account_temporary" ;
			$result = $_opDB->query($request) ;
			$row = $_opDB->fetch_assoc($result) ;
			while ($row != null){
				$row = $_opDB->fetch_assoc($result) ;
				//print_r($row) ;
				if ($row['Field'] == $tmp){
					//echo "pas ok" ;
					$exist = true ;
				}
			}

			if ($exist == false){
				$request = "ALTER TABLE account_temporary ADD {$tmp} VARCHAR(100)" ;
				$result = $_opDB->query($request) ;
			}
			$tmp = 'field_ATR_A_'.strtoupper($tst) ;
			$request = "UPDATE account_temporary SET {$tmp} = '{$arr['Meta'][$tst]}' WHERE field_ACC_ID = '{$arr['Numéro client']}' " ;
			$result = $_opDB->query($request) ;
			//print_r($tst) ;
 		}

		//print_r($test) ;

	}
	// Préparation de l'ajout de la table temporaire dans la table définitive: On vérifie d'abord si tout les field_ACC_ID sont uniques, sinon on arrête tout


	$request = "SELECT COUNT(*) FROM account_temporary" ;
	$result = $_opDB->query($request) ;
	$count = $_opDB->fetch_row($result) ;

	//print_r($count[0]) ;
	$request = "SELECT * FROM account_temporary" ;

	$result = $_opDB->query($request) ;
	$cmp = 0;
	for ($i = 0; $i < $count[0]; $i++){
		$row = $_opDB->fetch_assoc($result) ;
		//print_r($row) ;
		$request2 = "SELECT field_ACC_ID FROM view_bible_LIB_ACCOUNT_entry WHERE field_ACC_ID = '{$row['field_ACC_ID']}'";
		$result2 = $_opDB->query($request2) ;
		$row2 = $_opDB->fetch_assoc($result2) ;
		if ($row2 == null){
			$cmp++;
			paracrm_lib_data_insertRecord_bibleEntry("LIB_ACCOUNT", $row["entry_key"], $row["treenode_key"], $row) ;
		}
		else{
			$cmp++;
			paracrm_lib_data_updateRecord_bibleEntry("LIB_ACCOUNT", $row["entry_key"], $row) ;
		}

	}

	return json_encode(array("success" => true, "logs" => $cmp." enregistrements ont été ajoutés/modifiés avec succès") );


}
?>
