<?php

function specWbMrfoxy_xls_getTableExport( $post_data ) {
	global $_opDB ;
	
	$data = json_decode($post_data['data'],true) ;
	
	$workbook_tab_grid = array() ;
	foreach( $data['xlsSheets'] as $data_sheet ) {
		$tab['tab_title'] = $data_sheet['xlsTitle'] ;
		$tab['columns'] = $data_sheet['xlsColumns'] ;
		$tab['data'] = $data_sheet['xlsData'] ;
		$workbook_tab_grid[] = $tab ;
	}
	
	$objPHPExcel = paracrm_queries_xls_build( $workbook_tab_grid ) ;
	if( !$objPHPExcel ) {
		die() ;
	}
	
	$idx = -1 ;
	foreach( $data['xlsSheets'] as $data_sheet ) {
		$idx++ ;
		$objWorksheet = $objPHPExcel->getSheet($idx);
		if( isset($data_sheet['xlsHeader']) ) {
			$header_table = $data_sheet['xlsHeader'] ;
			$objWorksheet->insertNewRowBefore(1, count($header_table)+1);
			$row = 1 ;
			foreach( $header_table as $header_row ) {
				$objWorksheet->SetCellValue("A{$row}", $header_row['fieldLabel'] );
				$objWorksheet->getStyle("B{$row}")->getFont()->setBold(TRUE);
				$objWorksheet->SetCellValue("B{$row}", $header_row['fieldValue'] );
				$row++ ;
			}
		}
	}
	
	$tmpfilename = tempnam( sys_get_temp_dir(), "FOO");
	$objWriter = PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel2007');
	$objWriter->save($tmpfilename);
	$objPHPExcel->disconnectWorksheets();
	unset($objPHPExcel) ;

	$filename = 'WB_MRFOXY_unnamed.xlsx' ;
	if( $data['xlsFilename'] ) {
		$filename = $data['xlsFilename'] ;
	}
	header("Content-Type: application/force-download; name=\"$filename\""); 
	header("Content-Disposition: attachment; filename=\"$filename\""); 
	readfile($tmpfilename) ;
	unlink($tmpfilename) ;
	die() ;
}


?>