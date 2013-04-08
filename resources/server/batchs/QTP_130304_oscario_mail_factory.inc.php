<?php
function mail_getBinary_ficheNouveauClient( $bible_STORE_entry_key ) { // return String (binarybuffer)
	global $_opDB, $templates_dir ;
	
	$query = "SELECT * FROM view_bible_STORE_entry WHERE entry_key='{$bible_STORE_entry_key}'" ;
	$result = $_opDB->query($query) ;
	$bible_STORE_entry = $_opDB->fetch_assoc($result) ;
	//print_r($bible_STORE_entry) ;
	$query = "SELECT * FROM view_file_STORE_ADRBOOK WHERE field_STORE='{$bible_STORE_entry_key}'" ;
	$result = $_opDB->query($query) ;
	$file_STORE_ADRBOOK = $_opDB->fetch_assoc($result) ;
	//print_r($file_STORE_ADRBOOK) ;
	
	$inputFileType = 'Excel2007';
	$inputFileName = $templates_dir.'/'.'QTP_130304_oscario_ficheNouveauClient.xlsx' ;
	$objReader = PHPExcel_IOFactory::createReader($inputFileType);
	$objPHPExcel = $objReader->load($inputFileName);

	$objPHPExcel->getActiveSheet()->setCellValue('B5', $bible_STORE_entry['field_STORECODE'].' '.$bible_STORE_entry['field_STORENAME']);
	
	if( $file_STORE_ADRBOOK['field_ADRFACT_IS_ON'] ) {
		$objPHPExcel->getActiveSheet()->setCellValueExplicit('B7', $file_STORE_ADRBOOK['field_ADRFACT_ADR'],PHPExcel_Cell_DataType::TYPE_STRING);
		$objPHPExcel->getActiveSheet()->setCellValueExplicit('B8', $file_STORE_ADRBOOK['field_ADRFACT_CP'],PHPExcel_Cell_DataType::TYPE_STRING);
		$objPHPExcel->getActiveSheet()->setCellValueExplicit('B9', $file_STORE_ADRBOOK['field_ADRFACT_VILLE'],PHPExcel_Cell_DataType::TYPE_STRING);
	} else {
		$objPHPExcel->getActiveSheet()->setCellValueExplicit('B7', $bible_STORE_entry['field_STOREADR'],PHPExcel_Cell_DataType::TYPE_STRING);
		$objPHPExcel->getActiveSheet()->setCellValueExplicit('B8', $bible_STORE_entry['field_STORECP'],PHPExcel_Cell_DataType::TYPE_STRING);
		$objPHPExcel->getActiveSheet()->setCellValueExplicit('B9', $bible_STORE_entry['field_STOREVILLE'],PHPExcel_Cell_DataType::TYPE_STRING);
	}
	
	$objPHPExcel->getActiveSheet()->setCellValueExplicit('B14', $bible_STORE_entry['field_STORETEL'],PHPExcel_Cell_DataType::TYPE_STRING);
	$objPHPExcel->getActiveSheet()->setCellValueExplicit('B15', $bible_STORE_entry['field_STOREFAX'],PHPExcel_Cell_DataType::TYPE_STRING);
	
	if( $file_STORE_ADRBOOK['field_ADRFACT_IS_ON'] ) {
		$objPHPExcel->getActiveSheet()->setCellValueExplicit('B18', $file_STORE_ADRBOOK['field_ADRLIV_ADR'],PHPExcel_Cell_DataType::TYPE_STRING);
		$objPHPExcel->getActiveSheet()->setCellValueExplicit('B19', $file_STORE_ADRBOOK['field_ADRLIV_CP'],PHPExcel_Cell_DataType::TYPE_STRING);
		$objPHPExcel->getActiveSheet()->setCellValueExplicit('B20', $file_STORE_ADRBOOK['field_ADRLIV_VILLE'],PHPExcel_Cell_DataType::TYPE_STRING);
	}
	$objPHPExcel->getActiveSheet()->setCellValueExplicit('B23', $file_STORE_ADRBOOK['field_TIMELIV'],PHPExcel_Cell_DataType::TYPE_STRING);
	
	$objPHPExcel->getActiveSheet()->setCellValueExplicit('C26', $file_STORE_ADRBOOK['field_CTCOMM_NOM'],PHPExcel_Cell_DataType::TYPE_STRING);
	$objPHPExcel->getActiveSheet()->setCellValueExplicit('C27', $file_STORE_ADRBOOK['field_CTCOMM_EMAIL'],PHPExcel_Cell_DataType::TYPE_STRING);
	$objPHPExcel->getActiveSheet()->setCellValueExplicit('C28', $file_STORE_ADRBOOK['field_CTCOMM_TEL'],PHPExcel_Cell_DataType::TYPE_STRING);
	
	$objPHPExcel->getActiveSheet()->setCellValueExplicit('C30', $file_STORE_ADRBOOK['field_CTFACT_NOM'],PHPExcel_Cell_DataType::TYPE_STRING);
	$objPHPExcel->getActiveSheet()->setCellValueExplicit('C31', $file_STORE_ADRBOOK['field_CTFACT_EMAIL'],PHPExcel_Cell_DataType::TYPE_STRING);
	$objPHPExcel->getActiveSheet()->setCellValueExplicit('C32', $file_STORE_ADRBOOK['field_CTFACT_TEL'],PHPExcel_Cell_DataType::TYPE_STRING);
	
	$objPHPExcel->getActiveSheet()->setCellValueExplicit('B35', $file_STORE_ADRBOOK['field_REGISTER_TVA'],PHPExcel_Cell_DataType::TYPE_STRING);
	$objPHPExcel->getActiveSheet()->setCellValueExplicit('B37', $file_STORE_ADRBOOK['field_REGISTER_DUN'],PHPExcel_Cell_DataType::TYPE_STRING);
	$objPHPExcel->getActiveSheet()->setCellValueExplicit('B39', $file_STORE_ADRBOOK['field_REGISTER_SIRET'],PHPExcel_Cell_DataType::TYPE_STRING);
	
	
	// Write out as the new file
	$outputFileType = 'Excel2007';
	$outputFileName = tempnam(sys_get_temp_dir(),'iot').'.xlsx' ;
	$objWriter = PHPExcel_IOFactory::createWriter($objPHPExcel, $outputFileType);
	$objWriter->save($outputFileName);	


	$binarybuffer = file_get_contents($outputFileName) ;
	unlink($outputFileName) ;
	
	return $binarybuffer ;
}

function mail_getBody( $filerecord_id, $_errors ) {
	global $_opDB ;
	
	$query = "SELECT * FROM view_file_CDE_SAISIE WHERE filerecord_id='{$filerecord_id}'" ;
	$result = $_opDB->query($query) ;
	$file_CDE_SAISIE = $_opDB->fetch_assoc($result) ;
	$query = "SELECT * FROM view_bible_STORE_entry WHERE entry_key='{$file_CDE_SAISIE['field_CDE_STORE']}'" ;
	$result = $_opDB->query($query) ;
	$bible_STORE_entry = $_opDB->fetch_assoc($result) ;
	$query = "SELECT * FROM view_file_CDE_SAISIE_LIG
				JOIN view_bible_PRODLOG_entry ON view_bible_PRODLOG_entry.entry_key=view_file_CDE_SAISIE_LIG.field_CDE_PROD
				WHERE view_file_CDE_SAISIE_LIG.filerecord_parent_id='{$filerecord_id}'
				ORDER BY view_file_CDE_SAISIE_LIG.filerecord_id" ;
	$result = $_opDB->query($query) ;
	$TABfile_CDE_SAISIE_LIG = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TABfile_CDE_SAISIE_LIG[] = $arr ;
	}
	
	//print_r($file_CDE_SAISIE) ;
	//print_r($bible_STORE_entry) ;
	//print_r($TABfile_CDE_SAISIE_LIG) ;
	$email_text = "" ;
	if( $_errors ) {
		$email_text.= "************** COMMANDE REJETEE **************\r\n" ;
		foreach( $_errors as $error_txt ) {
			$email_text.= "   ".$error_txt."\r\n" ;
		}
		$email_text.= "**********************************************\r\n" ;
		$email_text.= "\r\n" ;
	}
	$email_text.= "Date Commande  : ".date('Y-m-d H:i',strtotime($file_CDE_SAISIE['field_CDE_DATE']))."\r\n" ;
	$email_text.= "Magasin        : ".$file_CDE_SAISIE['field_CDE_STORE'].' / '.$bible_STORE_entry['field_STORENAME']."\r\n" ;
	if( $file_CDE_SAISIE['field_CDE_REFCLI'] ) {
		$email_text.= "No.Cde Magasin : ".$file_CDE_SAISIE['field_CDE_REFCLI']."\r\n" ;
	}
	$email_text.= "No.Cde Oscario : ".$file_CDE_SAISIE['field_CDE_REFOSCAR']."\r\n" ;
	$email_text.= "DATE LIVRAISON : ".date('Y-m-d',strtotime($file_CDE_SAISIE['field_CDE_DATELIV']))."\r\n" ;
	$email_text.= "\r\n" ;
	$email_text.= "  Product    | Description                                |Tariff|  Qte   |Bags/Pds "."\r\n" ;
	$email_text.= "-------------|--------------------------------------------|------|--------|---------"."\r\n" ;
	
	$email_base = "             |                                            |      |        |         " ;
	
	foreach( $TABfile_CDE_SAISIE_LIG as $file_CDE_SAISIE_LIG ) {
		foreach( array('field_CDE_QTE_UC_PAID','field_CDE_QTE_UC_FREE') as $mkey ) {
			$prod_ref = $file_CDE_SAISIE_LIG['field_CDE_PROD'] ;
			$prod_lib = $file_CDE_SAISIE_LIG['field_PROD_LIB'] ;
			$prod_ean = $file_CDE_SAISIE_LIG['field_UVC_EAN'] ;
			$prod_pcb = (float)$file_CDE_SAISIE_LIG['field_UC_PCB'] ;
			$qte_uc = (float)( $file_CDE_SAISIE_LIG[$mkey] ) ;
			$qte_uvc = (float)( $file_CDE_SAISIE_LIG['field_UC_PCB'] * $qte_uc ) ;
			$qte_unit = (float)( $file_CDE_SAISIE_LIG['field_EQ_UNIT'] * $qte_uvc ) ;
			$poids_kg = round( $file_CDE_SAISIE_LIG['field_EQ_KG'] * $qte_uvc , 1 ) ;
			
			if( $qte_uc <= 0 ) {
				continue ;
			}
			
			$lig = $email_base ;
			$lig = substr_mklig($lig,$prod_ref,1,12) ;
			$lig = substr_mklig($lig,$prod_lib,15,42) ;
			if( $mkey == 'field_CDE_QTE_UC_FREE' ) {
				$lig = substr_mklig($lig,'FREE',60,4) ;
			}
			$lig = substr_mklig($lig,$qte_uvc,67,6,true) ;
			$lig = substr_mklig($lig,$qte_unit,76,6,true) ;
			$email_text.= $lig."\r\n" ;
			
			$lig = $email_base ;
			$lig = substr_mklig($lig,"EAN:".$prod_ean,17,30) ;
			$lig = substr_mklig($lig,"PCB:".$prod_pcb,67,6) ;
			$lig = substr_mklig($lig,$poids_kg.' kg',76,8,true) ;
			$email_text.= $lig."\r\n" ;

			$email_text.= $email_base."\r\n" ;
		}
	}

	return $email_text ;
}
?>