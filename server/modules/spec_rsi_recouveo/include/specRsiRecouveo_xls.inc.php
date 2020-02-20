<?php

function specRsiRecouveo_xls_create($post_data) {
	$json_cfg = $ttmp['data'] ;

	$data = json_decode($post_data['data'],true) ;
	$columns = json_decode($post_data['columns'],true) ;
	
	
	
	
	if( !class_exists('PHPExcel') )
		return FALSE ;
	
	
	// ******* Load du template ********
	$ttmp = paracrm_queries_gridTemplate( array('_subaction'=>'load') ) ;
	$template_cfg = $ttmp['data_templatecfg'] ;
	if( !$template_cfg || !$template_cfg['template_is_on'] )
		unset($template_cfg) ;
	if( $template_cfg ) {
		$style_header = array(                  
			'fill' => array(
				'type' => PHPExcel_Style_Fill::FILL_SOLID,
				'color' => array('rgb'=>substr($template_cfg['colorhex_columns'],1,6)),
			)
		);
		$style_row = array(                  
			'fill' => array(
				'type' => PHPExcel_Style_Fill::FILL_SOLID,
				'color' => array('rgb'=>substr($template_cfg['colorhex_row'],1,6)),
			)
		);
		$style_rowalt = array(                  
			'fill' => array(
				'type' => PHPExcel_Style_Fill::FILL_SOLID,
				'color' => array('rgb'=>substr($template_cfg['colorhex_row_alt'],1,6)),
			)
		);

		$style_group = array(                  
			'fill' => array(
				'type' => PHPExcel_Style_Fill::FILL_SOLID,
				'color' => array('rgb'=>substr('#00D563',1,6)),
			)
		);
	}
	// ***********************************
	
	
	$objPHPExcel = new PHPExcel() ;
	$objPHPExcel->getDefaultStyle()->getFont()->setName('Arial');
	$objPHPExcel->getDefaultStyle()->getFont()->setSize( 10 );

	$objPHPExcel->setActiveSheetIndex(0);
	$obj_sheet = $objPHPExcel->getActiveSheet() ;
	
	$row_data_min = 2 ;
	$row_data_max = count($data) + $group_count + 1 ;
	
	$row = 1 ;
	$cell_min = $cell = 'A' ;
	
	foreach( $columns as $col ) {
		$obj_sheet->SetCellValue("{$cell}{$row}", $col['text']);
		$obj_sheet->getColumnDimension($cell)->setWidth(20);
		$obj_sheet->getStyle("{$cell}{$row}")->getFont()->setBold(TRUE);
		if( $template_cfg ) {
			$phpexcelalign = "" ;
			switch( $template_cfg['data_align'] ) {
				case 'left' : $phpexcelalign=PHPExcel_Style_Alignment::HORIZONTAL_LEFT ; break ;
				case 'center' : $phpexcelalign=PHPExcel_Style_Alignment::HORIZONTAL_CENTER ; break ;
				case 'right' : $phpexcelalign=PHPExcel_Style_Alignment::HORIZONTAL_RIGHT ; break ;
			}
			$obj_sheet->getStyle("{$cell}1:{$cell}{$row_data_max}")->getAlignment()->setHorizontal($phpexcelalign);
		}
		$cell_max = $cell ;
		$cell++ ;
	}
	if( $style_header ) {
		$obj_sheet->getStyle("{$cell_min}{$row}:{$cell_max}{$row}")->applyFromArray( $style_header );
	}

	foreach( $data as $record ) {
		if( $group_dataIndex && $group_currentValue != $record[$group_dataIndex] ) {
			$row++ ;
			$cell = 'A' ;
			
			$group_currentValue = $record[$group_dataIndex] ;
			$obj_sheet->SetCellValue("{$cell}{$row}", $group_currentValue );
			$obj_sheet->getStyle("{$cell_min}{$row}:{$cell_max}{$row}")->applyFromArray( $style_group );
		}
		
		$row++ ;
		$cell = 'A' ;
		foreach( $columns as $col ) {
			$value = $record[$col['dataIndex']] ;
			if( $col['dataIndexString'] ) {
				$obj_sheet->setCellValueExplicit("{$cell}{$row}", $value,PHPExcel_Cell_DataType::TYPE_STRING);
			} else {
				if( is_numeric($value) && $value != ceil($value) ) {
					$value = round($value,2) ;
				}
				$obj_sheet->SetCellValue("{$cell}{$row}", $value );
			}
			$cell++ ;
		}
		
		if( $style_row && $style_rowalt ) {
			$style_toapply = ($row%2 == 0 )?$style_row:$style_rowalt ;
			$obj_sheet->getStyle("{$cell_min}{$row}:{$cell_max}{$row}")->applyFromArray( $style_toapply );
		}
	}


	$tmpfilename = tempnam( sys_get_temp_dir(), "FOO");
	$objWriter = PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel2007');
	$objWriter->save($tmpfilename);
	$objPHPExcel->disconnectWorksheets();
	unset($objPHPExcel) ;
	//$objPHPExcel->setActiveSheetIndex(0);

	$filename = 'RsiRecouveo_Export'.'_'.time().'.xlsx' ;
	header("Content-Type: application/force-download; name=\"$filename\"");
	header("Content-Disposition: attachment; filename=\"$filename\"");
	readfile($tmpfilename) ;
	unlink($tmpfilename) ;
	die() ;
}

function specRsiRecouveo_xls_createDetailPanel($post_data){
	$acc_id = $post_data["acc_id"] ;
	$workbook = specRsiRecouveo_xls_create_writer($acc_id) ;
	$tmpfilename = tempnam( sys_get_temp_dir(), "FOO");

	$objWriter = PHPExcel_IOFactory::createWriter($workbook, 'Excel2007');
	$objWriter->save($tmpfilename);
	$workbook->disconnectWorksheets();
	unset($workbook) ;
	$filename = 'RsiRecouveo_Export'.'_'.$acc_id.'.xlsx' ;
	header("Content-Type: application/force-download; name=\"$filename\"");
	header("Content-Disposition: attachment; filename=\"$filename\"");
	readfile($tmpfilename) ;
	//unlink($tmpfilename) ;
	die() ;

}

function specRsiRecouveo_xls_create_writer($accId){
	global $_opDB ;
	if( !class_exists('PHPExcel') )
		return FALSE ;
	
	$request = "SELECT field_ACC_ID, field_ACC_NAME, field_LINK_USER_LOCAL, treenode_key FROM view_bible_LIB_ACCOUNT_entry WHERE field_ACC_ID ='{$accId}'" ;
	$result = $_opDB->query($request) ;
	$contact = $_opDB->fetch_assoc($result) ;

	$entity = $contact['treenode_key'] ;
	$request = "SELECT field_SOC_NAME FROM view_bible_LIB_ACCOUNT_tree WHERE treenode_key = '{$entity}' " ;
	$result = $_opDB->query($request) ;
	$contactEntity = $_opDB->fetch_assoc($result) ;

	$ttmp = specRsiRecouveo_account_open(array('acc_id'=>$accId)) ;
	$config = specRsiRecouveo_cfg_getConfig() ;
	$files = $ttmp['data']['files'] ;
	$adrbooks = $ttmp['data']['adrbook']	 ;

	$coord = [] ;
	$adr_entity = [] ;
	foreach ($adrbooks as $cle => $adrbook) {
		$adr_entity[$cle] = $adrbook['adr_entity'] ;
		$adrbookentries = $adrbook['adrbookentries'] ;

		foreach ($adrbookentries as $key => $adrbookentry) {
			if ($adrbookentry['status_is_invalid'] == false){
				$coord[$key]['Valeur'] = $adrbookentry['adr_txt'] ;
				$coord[$key]['Entite'] = $adrbook['adr_entity'] ;
				if ($adrbookentry['adr_type'] == 'TEL'){
					$coord[$key]['Type'] = 'Numéro de téléphone: ' ;
				}
				if ($adrbookentry['adr_type'] == 'POSTAL'){
					$coord[$key]['Type'] = 'Adresse postale: ' ;
				}
				if ($adrbookentry['adr_type'] == 'EMAIL'){
					$coord[$key]['Type'] = 'Adresse email: ' ;
				}
			}
		}
	}

	$cfg_soc = $config['data']['cfg_soc'] ;
	$metaIds = [] ;
	foreach ($cfg_soc as $atrIds) {
		if ($atrIds['soc_id'] == $entity){
			$metaIds = $atrIds['atr_ids'] ;
		}
	}
	$metaAcc = [] ;
	$cfg_atr = $config['data']['cfg_atr'] ;
	$i = 0 ;
	foreach($cfg_atr as $atr){
		if ($atr['atr_type'] == 'account'){
			$temp_atr = $atr['atr_id'] ;
			foreach($metaIds as $metaId){
				if ($temp_atr == $metaId){
					$metaAcc[$i]['Desc'] = $atr['atr_desc'] ;
					$metaAcc[$i]['Field'] = $atr['atr_field'] ;
					$i += 1 ;
				}
			}
		}
	}

	$i = 0 ;
	$coord2 = [] ;
	foreach ($files as $file) {
		$numDossier = $file['id_ref'] ;
		foreach ($files as $keyRec => $record) {
			foreach ($metaAcc as $key => $value) {
				$coord2[$key]['Valeur'] = $record[$value['Field']] ;
				$coord2[$key]['Type'] = $value['Desc'] ;
			}

		}
	}

	$count = count($coord);

	/* OBTENTION DES FACTURES
	$request = "SELECT * FROM view_file_RECORD WHERE field_LINK_ACCOUNT = '{$accId}' " ;
	$result = $_opDB->query($request) ;
	$factures = $_opDB->fetch_assoc($result) ;
	*/
	$cfg_soc = $config['data']['cfg_soc'] ;
	$metaIds = [] ;
	foreach ($cfg_soc as $atrIds) {
		if ($atrIds['soc_id'] == $entity){
			$metaXeCurrency = $atrIds['soc_xe_currency'] ;
			$metaIds = $atrIds['atr_ids'] ;
		}

	}
	$cfg_atr = $config['data']['cfg_atr'] ;
	$metaDesc = [] ;
	$i = 0 ;
	foreach($cfg_atr as $atr){
		if ($atr['atr_type'] == 'record'){
			$temp_atr = $atr['atr_id'] ;
			foreach($metaIds as $metaId){
				if ($temp_atr == $metaId){
					$metaDesc[$i]['Desc'] = $atr['atr_desc'] ;
					$metaDesc[$i]['Field'] = $atr['atr_field'] ;
					$i += 1 ;
				}
			}
		}
	}
	$files = $ttmp['data']['files'] ;

	$factures = [] ;
	$i = 0 ;
	$countFact = count($metaDesc) + 9 ;

	foreach ($files as $file) {
		$numDossier = $file['id_ref'] ;
		$statut = $file['status_txt'] ;
		$dateOpen = $file['date_open'] ;
		foreach ($file['records'] as $keyRec => $record) {
			$factures[$i]['Dossier'] = $numDossier ;
			$factures[$i]['Statut'] = $statut ;
			$factures[$i]['Date d\'ouverture'] = $dateOpen ;
			$factures[$i]['Référence Facture'] = $record['record_ref'] ;
			$factures[$i]['ID Facture'] = $record['record_id'] ;
			$factures[$i]['Libelle Facture'] = $record['record_txt'] ;
			$factures[$i]['Date Facture'] = $record['date_record'] ;
			$factures[$i]['Date Echeance'] = $record['date_value'] ;
			$factures[$i]['Montant'] = $record['amount'] ;
			$factures[$i]['Integr'] = $record['date_load'] ;
			$factures[$i]['MntDevise'] = ($record['xe_currency_code'] ? $record['xe_currency_amount'] : '') ;
			$factures[$i]['CodDevise'] = $record['xe_currency_code'] ;
			foreach ($metaDesc as $value) {
				$factures[$i][$value['Desc']] = $record[$value['Field']] ;
			}
			$i += 1 ;
		}
	}
	$actions = [] ;

	$i = 0 ;
	foreach ($files as $file) {
		$numDossier = $file['id_ref'] ;
		$statut = $file['status_txt'] ;
		foreach ($file['actions'] as $keyRec => $action) {
			$actions[$i]['Dossier'] = $numDossier ;
			$actions[$i]['Statut'] = $statut ;
			$actions[$i]['Date'] = $action['date_actual'] ;
			if ($action['log_user'] == NULL){
				$actions[$i]['Affectation'] = 'Pas d\'affectation' ;
			}
			else {
				$actions[$i]['Affectation'] = substr($action['log_user'], -2) ;
			}
			$link_action = $action['link_action'] ;
			$query = "SELECT field_ACTION_TXT from view_bible_CFG_ACTION_entry WHERE field_ACTION_CODE = '{$link_action}' " ;
			$result = $_opDB->query($query) ;
			$action_txt = $_opDB->fetch_assoc($result) ;
			$actions[$i]['Action'] = $action_txt['field_ACTION_TXT'] ;
			$actions[$i]['Résumé'] = strip_tags($action['txt_short']) ;
			$actions[$i]['Compte-Rendu'] = $action['txt'] ;
			$i += 1 ;
		}
	}
	$countActions = $i ;
	//return $actions ;

	$workbook = new PHPExcel() ;

	$sheet = $workbook->getActiveSheet();
	$sheet->setTitle('Informations') ;
	$sheet->setCellValue('A1','Affectation: ');
	$sheet->setCellValue('A2','Entité: ');
	$sheet->setCellValue('A3','# Acheteur: ');
	$sheet->setCellValue('A4','Nom / Société: ');

	// A REFAIRE \\
	$sheet->setCellValue('B1',$contact['field_LINK_USER_LOCAL']);
	$sheet->setCellValue('B2',$contactEntity['field_SOC_NAME']);
	$sheet->setCellValue('B3', $contact['field_ACC_ID']);
	$sheet->setCellValue('B4', $contact['field_ACC_NAME']);

	$cellValueA = 'A' ;
	$sheet->getColumnDimension('A')->setAutoSize(true);
	$sheet->getColumnDimension('B')->setAutoSize(true);
	for ($i = 1; $i < 7; $i++){
		$cellValue = $cellValueA.$i ;
		$styleA = $sheet->getStyle($cellValue) ;
		$styleFont = $styleA->getFont() ;
		$styleFont->setBold(true) ;
	}
	$countHead = count($coord2) ;

	$cellValueB = 'B' ;
	$cellCount = 5 ;
	for ($i = 0; $i <= $countHead; $i++){
		$cellValue = $cellValueA.$cellCount ;
		$sheet->setCellValue($cellValue, $coord2[$i]['Type'] ) ;

		$styleA = $sheet->getStyle($cellValue) ;
		$styleFont = $styleA->getFont() ;
		$styleFont->setBold(true) ;
		$cellValue2 = $cellValueB.$cellCount ;
		$sheet->setCellValue($cellValue2, $coord2[$i]['Valeur'] ) ;
		$cellCount += 1 ;
	}

	$sheet2 =$workbook->createSheet() ;
	$sheet2->setTitle('Coordonnées') ;

	$cellValueA = 'A' ;
	$cellValueB = 'B' ;

	$cellCount = 1 ;

	$entityCount = count($adr_entity) ;
	for ($j = 0; $j <= $entityCount; $j++){
		$cellValue = $cellValueA.$cellCount ;
		$cellValue2 = $cellValueB.$cellCount ;
		$sheet2->setCellValue($cellValue, $adr_entity[$j]) ;
		$sheet2->mergeCells($cellValue.":".$cellValue2);

		$style =array(
			'alignment'=>array(
				'horizontal'=>PHPExcel_Style_Alignment::HORIZONTAL_CENTER));
		$sheet2->getStyle($cellValue)->applyFromArray($style) ;
		$sheet2->getStyle($cellValue)->getFont()->setBold(true) ;
		$cellCount += 1;
		$cellValue = $cellValueA.$cellCount ;
		$cellValue2 = $cellValueB.$cellCount ;
		for ($i = 0; $i <= $count; $i++){
			if ($adr_entity[$j] == $coord[$i]['Entite']){
				$sheet2->setCellValue($cellValue, $coord[$i]['Type'] ) ;
				$str = explode("\n", $coord[$i]['Valeur']) ;
				$str = implode("\r", $str) ;
				$sheet2->getStyle($cellValue2)->getAlignment()->setWrapText(true) ;
				$sheet2->setCellValue($cellValue2,$str) ;
				$cellCount += 1;
				$cellValue = $cellValueA.$cellCount ;
				$cellValue2 = $cellValueB.$cellCount ;
			}

		}

	}
	/*
		for ($i = 0; $i <= $count; $i++){
			$cellValue = $cellValueA.$i ;
			$sheet2->setCellValue($cellValue, $adr_entity ) ;
			$sheet2->setCellValue($cellValue, $coord[$i]['Type'] ) ;
			$styleA = $sheet2->getStyle($cellValue) ;
			$styleFont = $styleA->getFont() ;
			$styleFont->setBold(true) ;
			$str = explode("\n", $coord[$i]['Valeur']) ;
			$str = implode("\r", $str) ;
			$cellValue2 = $cellValueB.$i ;
			$sheet2->getStyle($cellValue2)->getAlignment()->setWrapText(true) ;
			$sheet2->setCellValue($cellValue2,$str) ;
		}*/

	$sheet2->getColumnDimension('A')->setAutoSize(true);
	$sheet2->getColumnDimension('B')->setAutoSize(true);

	$sheet3 =$workbook->createSheet() ;
	$sheet3->setTitle('Factures') ;

	$sheet3->setCellValue('A1','Dossier: ');
	$sheet3->setCellValue('B1','Statut: ');
	$sheet3->setCellValue('C1','Date d\'ouverture: ');
	$sheet3->setCellValue('D1','Référence Facture: ');
	$sheet3->setCellValue('E1','ID Facture: ');
	$sheet3->setCellValue('F1','Libelle Facture: ');
	$sheet3->setCellValue('G1','Date: ');
	$sheet3->setCellValue('H1','Echeance: ');
	$sheet3->setCellValue('I1','Montant: ');
	$sheet3->setCellValue('J1','Integr: ');
	if( $metaXeCurrency ) {
		$sheet3->setCellValue('K1','MntDevise: ');
		$sheet3->setCellValue('L1','CodDevise: ');
	}

	foreach($factures as $key => $facture){
		$newKey = $key+2;
		$sheet3->setCellValue('A'.$newKey, $facture['Dossier']) ;
		$sheet3->setCellValue('B'.$newKey, $facture['Statut']) ;
		$sheet3->setCellValue('C'.$newKey, $facture['Date d\'ouverture']) ;
		$sheet3->setCellValue('D'.$newKey, $facture['Référence Facture']) ;
		$sheet3->setCellValue('E'.$newKey, $facture['ID Facture']) ;
		$sheet3->setCellValue('F'.$newKey, $facture['Libelle Facture']) ;
		$sheet3->setCellValue('G'.$newKey, $facture['Date Facture']) ;
		$sheet3->setCellValue('H'.$newKey, $facture['Date Echeance']) ;
		$sheet3->setCellValue('I'.$newKey, $facture['Montant']) ;
		$sheet3->setCellValue('J'.$newKey, $facture['Integr']) ;
		if( $metaXeCurrency ) {
			$sheet3->setCellValue('K'.$newKey, $facture['MntDevise']) ;
			$sheet3->setCellValue('L'.$newKey, $facture['CodDevise']) ;
		}
	}
	$columnValue = ( $metaXeCurrency ? 'M' : 'K' ) ;
	foreach($metaDesc as $meta){
		$col = $columnValue.'1' ;
		$sheet3->setCellValue($col, $meta['Desc']) ;
		foreach($factures as $key => $facture){
			$newKey = $key+2;
			$sheet3->setCellValue($columnValue.$newKey, $facture[$meta['Desc']]) ;
		}

		$columnValue++ ;
	}
	$columnValue = 'A' ;
	for ($i=0;$i<$countFact;$i++){
		$sheet3->getColumnDimension($columnValue)->setAutoSize(true);
		$columnValue++ ;
	}
	$sheet3->getStyle('A1:Z1')->getFont()->setBold(true) ;

	$sheet4 =$workbook->createSheet() ;
	$sheet4->setTitle('Actions') ;
	$sheet4->setCellValue('A1','Dossier: ');
	$sheet4->setCellValue('B1','Statut: ');
	$sheet4->setCellValue('C1','Date: ');
	$sheet4->setCellValue('D1','Affectation: ');
	$sheet4->setCellValue('E1','Action: ');
	$sheet4->setCellValue('F1','Résumé: ');
	$sheet4->setCellValue('G1','Compte-Rendu: ');


	foreach($actions as $key => $action){
		$newKey = $key+2;
		$sheet4->setCellValue('A'.$newKey, $action['Dossier']) ;
		$sheet4->setCellValue('B'.$newKey, $action['Statut']) ;
		$sheet4->setCellValue('C'.$newKey, $action['Date']) ;
		$sheet4->setCellValue('D'.$newKey, $action['Affectation']) ;
		$sheet4->setCellValue('E'.$newKey, $action['Action']) ;
		$sheet4->setCellValue('F'.$newKey, $action['Résumé']) ;
		$str = explode("\n", $action['Compte-Rendu']) ;
		$str = implode("\r", $str) ;
		$sheet4->getStyle('G'.$newKey)->getAlignment()->setWrapText(true) ;
		$sheet4->setCellValue('G'.$newKey, $str) ;
	}
	$columnValue = 'A' ;
	for ($i=0;$i<8;$i++){
		$sheet4->getColumnDimension($columnValue)->setAutoSize(true);
		$columnValue++ ;
	}
	$sheet4->getStyle('A1:Z1')->getFont()->setBold(true) ;


	return $workbook ;
}

function specRsiRecouveo_xls_grp_export($post_data){
	$p_fileFilerecordIds = json_decode($post_data['select_fileFilerecordIds']) ;
	$json = specRsiRecouveo_file_getRecords( array(
		'filter_fileFilerecordId_arr' => json_encode($p_fileFilerecordIds)
	)) ;
	$zip = new ZipArchive();
	$filename = tempnam( sys_get_temp_dir(), "FOO").'zip';
	if ($zip->open($filename, ZipArchive::CREATE)!==TRUE) {
		exit("Impossible d'ouvrir le fichier <$filename>\n");
	}
	$arr_fileRecords = $json['data'] ;
	$arr_accIds = array() ;
	foreach( $arr_fileRecords as $file_record ) {
		$acc_id = $file_record['acc_id'] ;
		if( !in_array($acc_id,$arr_accIds) ) {
			$arr_accIds[] = $acc_id ;
		}
	}
  	foreach( $arr_accIds as $acc_id ) {
 		$workbook = specRsiRecouveo_xls_create_writer($acc_id) ;
		$tmpfilename = tempnam( sys_get_temp_dir(), "FOO");
		$objWriter = PHPExcel_IOFactory::createWriter($workbook, 'Excel2007');
		$objWriter->save($tmpfilename);
		$zip->addFile($tmpfilename, 'RsiRecouveo_Export'.'_'.$acc_id.'.xlsx') ;
		$workbook->disconnectWorksheets();
		unset($workbook) ;
	}
	$zip->close();

 	$name = 'RsiRecouveo_Group_Export'.'_'.time().'.zip' ;
	header("Content-Type: application/force-download; name=\"$name\"");
	header("Content-Disposition: attachment; filename=\"$name\"");
	readfile("$filename");

	die() ;
}
?>
