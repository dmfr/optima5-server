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

?>
