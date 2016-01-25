<?php

function paracrm_queries_xls_build( $workbook_tab_grid , $numberFormat_round=FALSE )
{
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


	if( !$workbook_tab_grid ) {
		return FALSE ;
	}
	
	
	if( !class_exists('PHPExcel') )
		return FALSE ;
		
		
	$objPHPExcel = new PHPExcel() ;
	$objPHPExcel->getDefaultStyle()->getFont()->setName('Arial');
	$objPHPExcel->getDefaultStyle()->getFont()->setSize( 10 );

	$nul = 0 ;
	foreach( $workbook_tab_grid as $tab )
	{
		if( $nul > 0 )
			$objPHPExcel->createSheet($nul) ;
		$objPHPExcel->setActiveSheetIndex($nul);
		$obj_sheet = $objPHPExcel->getActiveSheet() ;
		$obj_sheet->setTitle( preg_replace("/[^a-zA-Z0-9\s]/", "", $tab['tab_title']) ) ;
		
		
		// -------- Eval groups ----------------
		$group_dataIndex = $group_currentValue = NULL ;
		$group_count = 0 ;
		foreach( $tab['columns'] as $col ) {
			if( $col['isGroup'] ) {
				if( $group_dataIndex === NULL ) {
					$group_dataIndex = $col['dataIndex'] ;
				}
				continue ;
			}
		}
		foreach( $tab['data'] as $record ) {
			if( $group_dataIndex && $group_currentValue != $record[$group_dataIndex] ) {
				$group_count++ ;
				
				$group_currentValue = $record[$group_dataIndex] ;
			}
		}
		$group_currentValue = NULL ;
		// -----------------------------
		
		$row_data_min = 2 ;
		$row_data_max = count($tab['data']) + $group_count + 1 ;
		
		$row = 1 ;
		$cell_min = $cell = 'A' ;
		
		foreach( $tab['columns'] as $col ) {
			if( $col['isGroup'] ) {
				if( $group_dataIndex === NULL ) {
					$group_dataIndex = $col['dataIndex'] ;
				}
				continue ;
			}
			
			if( $col['invisible'] ) {
				continue ;
			}
		
			$str = $cfg_field['text'] ;
			if( !$str || $str == '_' ) {
				$str = $cfg_field['field'] ;
			}
		
			$obj_sheet->SetCellValue("{$cell}{$row}", $col['text']);
			$obj_sheet->getColumnDimension($cell)->setWidth(20);
			if( $col['text_bold'] )
				$obj_sheet->getStyle("{$cell}{$row}")->getFont()->setBold(TRUE);
			if( $col['text_italic'] )
				$obj_sheet->getStyle("{$cell}{$row}")->getFont()->setItalic(TRUE);
				
			if( $template_cfg && $col['progressColumn'] && $numberFormat_round !== FALSE ) {
				$number_format = '' ;
				$number_format.= "+0" ;
				if( $numberFormat_round > 0 ) {
					$number_format.= ".";
					for( $i=0 ; $i<$numberFormat_round ; $i++ )
						$number_format.= "0" ;
				}
				$number_format.= ";" ;
				$number_format.= "-0" ;
				if( $numberFormat_round > 0 ) {
					$number_format.= ".";
					for( $i=0 ; $i<$numberFormat_round ; $i++ )
						$number_format.= "0" ;
				}
				$obj_sheet->getStyle("{$cell}{$row_data_min}:{$cell}{$row_data_max}")->getNumberFormat()->setFormatCode($number_format);
			}
			if( $template_cfg && $template_cfg['data_select_is_bold'] && !($col['progressColumn']||$col['detachedColumn']) ) {
				$obj_sheet->getStyle("{$cell}{$row_data_min}:{$cell}{$row_data_max}")->getFont()->setBold(TRUE);
			}
			if( $template_cfg && $template_cfg['data_progress_is_bold'] && ($col['progressColumn']||$col['detachedColumn']) ) {
				$obj_sheet->getStyle("{$cell}{$row_data_min}:{$cell}{$row_data_max}")->getFont()->setBold(TRUE);
			}
			if( $template_cfg && $col['progressColumn'] ) {
				$obj_sheet->getStyle("{$cell}{$row_data_min}:{$cell}{$row_data_max}")->getAlignment()->setHorizontal(PHPExcel_Style_Alignment::HORIZONTAL_LEFT);
			}
			if( $template_cfg && !$col['progressColumn'] ) {
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
		
		$FontColor_Red = new PHPExcel_Style_Color();
		$FontColor_Red->setRGB("FF0000");
		$FontColor_Green = new PHPExcel_Style_Color();
		$FontColor_Green->setRGB("008000");
		
		
		foreach( $tab['data'] as $record ) {
			if( $group_dataIndex && $group_currentValue != $record[$group_dataIndex] ) {
				$row++ ;
				$cell = 'A' ;
				
				$group_currentValue = $record[$group_dataIndex] ;
				$obj_sheet->SetCellValue("{$cell}{$row}", $group_currentValue );
				$obj_sheet->getStyle("{$cell_min}{$row}:{$cell_max}{$row}")->applyFromArray( $style_group );
			}
			
			$row++ ;
			$cell = 'A' ;
			foreach( $tab['columns'] as $col ) {
				if( $col['isGroup'] ) {
					continue ;
				}
				if( $col['invisible'] ) {
					continue ;
				}
				
				$value = $record[$col['dataIndex']] ;
				switch( $col['dataType'] ) {
					case 'string' :
						$obj_sheet->setCellValueExplicit("{$cell}{$row}", $value,PHPExcel_Cell_DataType::TYPE_STRING);
						break ;
					default :
						$obj_sheet->SetCellValue("{$cell}{$row}", $value );
						break ;
				}
				if( $col['is_bold'] )
					$obj_sheet->getStyle("{$cell}{$row}")->getFont()->setBold(TRUE);
					
				if( $template_cfg && $template_cfg['data_progress_is_bold'] && !$col['is_bold'] && $record['detachedRow'] ) {
					$obj_sheet->getStyle("{$cell}{$row}")->getFont()->setBold(TRUE);
				}
				
					
				if( $template_cfg && $col['progressColumn'] ) {
					$style_toapply = NULL ;
					if( $value > 0 ) {
						$obj_sheet->getStyle("{$cell}{$row}")->getFont()->setColor($FontColor_Green);
					}
					if( $value < 0 ) {
						$obj_sheet->getStyle("{$cell}{$row}")->getFont()->setColor($FontColor_Red);
					}
				}
				
				$cell++ ;
			}
			
			if( $style_row && $style_rowalt ) {
				$style_toapply = ($row%2 == 0 )?$style_row:$style_rowalt ;
				$obj_sheet->getStyle("{$cell_min}{$row}:{$cell_max}{$row}")->applyFromArray( $style_toapply );
			}
		}
		
		$nul++ ;
	}
	//$objPHPExcel->setActiveSheetIndex(0);
	
	return $objPHPExcel ;
}
