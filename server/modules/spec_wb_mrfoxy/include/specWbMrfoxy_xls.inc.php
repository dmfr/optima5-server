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
	
	$objPHPExcel->setActiveSheetIndex(0);
	
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



function specWbMrfoxy_xls_getFinanceDashboard($post_data) {
	$repost_data = array() ;
	$repost_data['filter_country'] = $post_data['filter_country'] ;
	$repost_data['filter_cropYear'] = $post_data['filter_cropYear'] ;
	
	$ttmp = specWbMrfoxy_finance_getGrid($repost_data) ;
	if( !$ttmp['success'] ) {
		die() ;
	}
	$financeGrid_data = $ttmp['data'] ;
	
	$ttmp = specWbMrfoxy_promo_getGrid($repost_data) ;
	if( !$ttmp['success'] ) {
		die() ;
	}
	$promoGrid_data = $ttmp['data'] ;
	
	
	$map_groupKey_operation = array() ;
	foreach( $financeGrid_data['groups'] as $group ) {
		$map_groupKey_operation[$group['group_key']] = $group['operation'] ;
	}
	
	$crop_dateInitial = NULL ;
	foreach( $financeGrid_data['revisions'] as $revision ) {
		if( $revision['is_crop_initial'] ) {
			$crop_dateInitial = $revision['revision_date'] ;
			break ;
		}
	}
	if( !$crop_dateInitial ) {
		die() ;
	}
	
	$cfg_currency = $financeGrid_data['params']['currency_code'] ;
	
	$TAB_data = array() ;
	$date_iteration = date('Y-m-d',strtotime($crop_dateInitial)) ;
	for( $i=0 ; $i<12 ; $i++ ) {
		$date_iteration ;
		$time_iteration = strtotime($date_iteration) ;
		$thisIteration_row = array() ;
		foreach( array('FREE','COMMITTED_FUTURE','COMMITTED_PAST','ACTUAL','BUDGET') as $mkey ) {
			$thisIteration_row[$mkey] = 0 ;
		}
		
		$thisIteration_budget = 0 ;
		// - Recherche budget total lié aux promos
		reset($financeGrid_data['revisions']) ;
		foreach( $financeGrid_data['revisions'] as $revision ) {
			$thisRevision_budget = 0 ;
			if( strtotime($revision['revision_date']) <= $time_iteration ) {
				foreach( $revision['rows'] as $revision_row ) {
					switch( $operation = $map_groupKey_operation[$revision_row['group_key']] ) {
						case '+' :
							$thisRevision_budget += $revision_row['value'] ;
							break ;
							
						case '-' :
							$thisRevision_budget -= $revision_row['value'] ;
							break ;
							
						default : break ;
					}
				}
				$thisIteration_budget = $thisRevision_budget ;
			} else {
				break ;
			}
		}
		
		$thisIteration_committedFuture = $thisIteration_committedPast = $thisIteration_actual = 0 ;
		// - Iteration sur les promos
		reset($promoGrid_data) ;
		foreach( $promoGrid_data as $promo_row ) {
			if( $promo_row['sysdate_closed'] != NULL && strtotime($promo_row['sysdate_closed']) <= $time_iteration ) {
				$thisIteration_actual += $promo_row['cost_real'] ;
			} elseif( $promo_row['sysdate_open'] != NULL && strtotime($promo_row['sysdate_open']) <= $time_iteration ) {
				if( strtotime($promo_row['date_supply_start']) <= $time_iteration ) {
					$thisIteration_committedPast += $promo_row['cost_forecast'] ;
				} else {
					$thisIteration_committedFuture += $promo_row['cost_forecast'] ;
				}
			}
		}
		
		$thisIteration_free = $thisIteration_budget - ($thisIteration_committedFuture + $thisIteration_committedPast + $thisIteration_actual) ;
		
		$thisIteration_row['BUDGET'] = $thisIteration_budget ;
		$thisIteration_row['FREE'] = max($thisIteration_free,0) ;
		$thisIteration_row['COMMITTED_FUTURE'] = $thisIteration_committedFuture ;
		$thisIteration_row['COMMITTED_PAST'] = $thisIteration_committedPast ;
		$thisIteration_row['ACTUAL'] = $thisIteration_actual ;
		$TAB_data[$date_iteration] = $thisIteration_row ;
		
		$date_iteration = date('Y-m-d',strtotime('+1 month',strtotime($date_iteration))) ;
	}
	
	$RES_revenue = specWbMrfoxy_tool_runQuery("RevenueMonth",array('condition_date_gt'=>$crop_dateInitial)) ;
	if( isset($RES_revenue[$post_data['filter_country']]) ) {
		$RES_countryRevenue = $RES_revenue[$post_data['filter_country']] ;
		
		$date_iteration = date('Y-m-d',strtotime($crop_dateInitial)) ;
		for( $i=0 ; $i<12 ; $i++ ) {
			$month_iteration = date('Y-m',strtotime($date_iteration)) ;
			
			if( $month_iteration <= date('Y-m') ) {
				$TAB_data[$date_iteration]['ACTUAL_REV'] = 0 ;
				$TAB_data[$date_iteration]['ACTUAL_REV']+= ( isset($RES_countryRevenue[$month_iteration]) ? $RES_countryRevenue[$month_iteration] : 0 ) ;
				$TAB_data[$date_iteration]['ACTUAL_REV']+= ( isset($TAB_data[$previous_iteration]['ACTUAL_REV']) ? $TAB_data[$previous_iteration]['ACTUAL_REV'] : 0 ) ;
			}
			
			$TAB_data[$date_iteration]['BUDGET_REV'] = 0 ;
			
			if( !isset($TAB_data[$date_iteration]['ACTUAL_REV']) ) {
				$TAB_data[$date_iteration]['PERCENT'] = '' ;
			} elseif( $TAB_data[$date_iteration]['BUDGET_REV'] == 0 ) {
				$TAB_data[$date_iteration]['PERCENT'] = '∞' ;
			} else {
				$TAB_data[$date_iteration]['PERCENT'] = round( ($TAB_data[$date_iteration]['ACTUAL_REV'] / $TAB_data[$date_iteration]['BUDGET_REV']) * 100 ) ;
			}
		
			$previous_iteration = $date_iteration ;
			$date_iteration = date('Y-m-d',strtotime('+1 month',strtotime($date_iteration))) ;
		}
	}
	
	
	
	
	
	
	$style_header = array(                  
		'fill' => array(
			'type' => PHPExcel_Style_Fill::FILL_SOLID,
			'color' => array('rgb'=>'FFFF00'),
		)
	);
	$style_data = array(                  
		'fill' => array(
			'type' => PHPExcel_Style_Fill::FILL_SOLID,
			'color' => array('rgb'=>'DCE6F2'),
		)
	);
	$style_budget = array(                  
		'fill' => array(
			'type' => PHPExcel_Style_Fill::FILL_SOLID,
			'color' => array('rgb'=>'EBF1DE'),
		)
	);
	
	$objPHPExcel = new PHPExcel() ;
	$objPHPExcel->getDefaultStyle()->getFont()->setName('Calibri');
	$objPHPExcel->getDefaultStyle()->getFont()->setSize( 11 );
	
	$objPHPExcel->setActiveSheetIndex(0);
	$obj_sheet = $objPHPExcel->getActiveSheet() ;
	$obj_sheet->setTitle( 'PromoBudget' ) ;
	
	$obj_sheet->getRowDimension(1)->setRowHeight(20);
	$obj_sheet->getColumnDimension('A')->setWidth(15);
	
	$obj_sheet->SetCellValue("A1", 'Promo Budget Follow-up');
	$obj_sheet->getStyle('A1')->getFont()->setSize( 16 );
	
	$obj_sheet->SetCellValue("A2", 'Country');
	$obj_sheet->SetCellValueExplicit("B2", $post_data['filter_country'],PHPExcel_Cell_DataType::TYPE_STRING);
	$obj_sheet->SetCellValue("A3", 'Crop Year');
	$obj_sheet->SetCellValueExplicit("B3", $post_data['filter_cropYear'],PHPExcel_Cell_DataType::TYPE_STRING);
	$obj_sheet->getStyle("A2:B3")->applyFromArray($style_header);
	
	
	$obj_sheet->getColumnDimension('B')->setWidth(20);
	
	$rows = array('_key','ACTUAL','COMMITTED_PAST','COMMITTED_FUTURE','FREE','','BUDGET') ;
	$rows_title = array('','Paid','Past committed','Committed for future','Free','','Total Promo Budget');
	$row = '4' ;
	foreach( $rows as $idx => $row_key ) {
		if( !$row_key ) {
			$obj_sheet->getRowDimension($row)->setRowHeight(5);
			$row++ ;
			continue ;
		}
		
		$col = 'B' ;
		if( $row_title = $rows_title[$idx] ) {
			$obj_sheet->SetCellValue($col.$row, $row_title);
		}
		$col++ ;
	
		$forChart_nbAxis = 0 ;
		foreach( $TAB_data as $date_iteration => $iteration_row ) {
			if( $row_key == '_key' ) {
				$value = date('M-y',strtotime($date_iteration)) ;
				$obj_sheet->SetCellValueExplicit($col.$row, $value, PHPExcel_Cell_DataType::TYPE_STRING);
			} else {
				$value = $iteration_row[$row_key] ;
				if( is_numeric($value) ) {
					$value = round($value) ;
				}
				$obj_sheet->SetCellValue($col.$row, $value);
			}
			
			$last_col = $col ;
			
			$col++ ;
			$forChart_nbAxis++ ;
		}
		
		$startCol = ( $row_title ? 'B' : 'C' ) ;
		if( $row_key != '_key' ) {
			$obj_sheet->getStyle("{$startCol}{$row}:{$last_col}{$row}")->applyFromArray($style_data);
		}
		$obj_sheet->getStyle("{$startCol}{$row}:{$last_col}{$row}")->getBorders()->getAllBorders()->setBorderStyle(PHPExcel_Style_Border::BORDER_THIN);
		
		$row++ ;
	}
	
	$rows = array('_key','BUDGET_REV','ACTUAL_REV','PERCENT') ;
	$rows_title = array('','Budgeted revenue','Actual revenue','% Realization');
	$row = '12' ;
	foreach( $rows as $idx => $row_key ) {
		if( !$row_key ) {
			$obj_sheet->getRowDimension($row)->setRowHeight(5);
			$row++ ;
			continue ;
		}
		
		$col = 'B' ;
		if( $row_title = $rows_title[$idx] ) {
			$obj_sheet->SetCellValue($col.$row, $row_title);
		}
		$col++ ;
	
		$forChart_nbAxis = 0 ;
		foreach( $TAB_data as $date_iteration => $iteration_row ) {
			if( $row_key == '_key' ) {
				$value = date('M-y',strtotime($date_iteration)) ;
				$obj_sheet->SetCellValueExplicit($col.$row, $value, PHPExcel_Cell_DataType::TYPE_STRING);
			} else {
				$value = $iteration_row[$row_key] ;
				$obj_sheet->SetCellValue($col.$row, $value);
			}
			
			$last_col = $col ;
			
			$col++ ;
			$forChart_nbAxis++ ;
		}
		
		$startCol = ( $row_title ? 'B' : 'C' ) ;
		if( $row_key != '_key' ) {
			$obj_sheet->getStyle("{$startCol}{$row}:{$last_col}{$row}")->applyFromArray($style_budget);
		}
		$obj_sheet->getStyle("{$startCol}{$row}:{$last_col}{$row}")->getBorders()->getAllBorders()->setBorderStyle(PHPExcel_Style_Border::BORDER_THIN);
		
		$row++ ;
	}
	
	$forChart_labelCol = 'B' ;
	$forChart_axisRow = 4 ;
	$forChart_nbLabels = 4 ;
	$forChart_nbAxis ;
	$forChart_data_startCol = 'C' ;
	$forChart_data_endCol = $forChart_data_startCol ;
	for( $i=0 ; $i<$forChart_nbAxis-1 ; $i++ ) {
		$forChart_data_endCol++ ;
	}
	$forChart_data_startRow = 5 ;
	$forChart_data_endRow = $forChart_data_startRow ;
	for( $i=0 ; $i<$forChart_nbLabels-1 ; $i++ ) {
		$forChart_data_endRow++ ;
	}
	
	$forChart_total_row = $forChart_data_endRow + 1 + 1 ;
	
	
		$dataseriesLabels = array() ;
		$labelRow = $forChart_data_startRow ;
		for( $i=0 ; $i<$forChart_nbLabels ; $i++ ) {
			$dataseriesLabels[] = new PHPExcel_Chart_DataSeriesValues('String', 'PromoBudget!$'.$forChart_labelCol.'$'.$labelRow, NULL, 1) ;
			$labelRow++ ;
		}
		
		$xAxisTickValues = array(
			new PHPExcel_Chart_DataSeriesValues('String', 'PromoBudget!$'.$forChart_data_startCol.'$'.$forChart_axisRow.':$'.$forChart_data_endCol.'$'.$forChart_axisRow, NULL, $forChart_nbAxis),	//	Q1 to Q4
		);
		
		$dataSeriesValues = array() ;
		$labelRow = $forChart_data_startRow ;
		for( $i=0 ; $i<$forChart_nbLabels ; $i++ ) {
			$dataSeriesValues[] = new PHPExcel_Chart_DataSeriesValues('Number', 'PromoBudget!$'.$forChart_data_startCol.'$'.$labelRow.':$'.$forChart_data_endCol.'$'.$labelRow, NULL, 1) ;
			$labelRow++ ;
		}
		

		//	Build the dataseries
		$series = new PHPExcel_Chart_DataSeries(
			PHPExcel_Chart_DataSeries::TYPE_BARCHART,		// plotType
			PHPExcel_Chart_DataSeries::GROUPING_STACKED,	// plotGrouping
			range(0, count($dataSeriesValues)-1),			// plotOrder
			$dataseriesLabels,								// plotLabel
			$xAxisTickValues,								// plotCategory
			$dataSeriesValues								// plotValues
		);
		//	Set additional dataseries parameters
		//		Make it a horizontal bar rather than a vertical column graph
		$series->setPlotDirection(PHPExcel_Chart_DataSeries::DIRECTION_COL);

		//	Set the series in the plot area
		$plotarea = new PHPExcel_Chart_PlotArea(NULL, array($series));
		//	Set the chart legend
		$legend = new PHPExcel_Chart_Legend(PHPExcel_Chart_Legend::POSITION_RIGHT, NULL, false);

		$yAxisLabel = new PHPExcel_Chart_Title("Value ($cfg_currency)");


		//	Create the chart
		$chart = new PHPExcel_Chart(
			'chart1',		// name
			NULL,			// title
			$legend,		// legend
			$plotarea,		// plotArea
			true,			// plotVisibleOnly
			0,				// displayBlanksAs
			NULL,			// xAxisLabel
			$yAxisLabel		// yAxisLabel
		);

		//	Set the position where the chart should appear in the worksheet
		$chart->setTopLeftPosition("B16");
		$chart->setBottomRightPosition("{$forChart_data_endCol}32");

		//	Add the chart to the worksheet
		$obj_sheet->addChart($chart);
	
	
	$objPHPExcel->setActiveSheetIndex(0);
	
	$tmpfilename = tempnam( sys_get_temp_dir(), "FOO");
	$objWriter = PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel2007');
	$objWriter->setIncludeCharts(TRUE);
	$objWriter->save($tmpfilename);
	$objPHPExcel->disconnectWorksheets();
	unset($objPHPExcel) ;

	$filename = 'WB_MRFOXY_unnamed.xlsx' ;
	if( $post_data['xlsFilename'] ) {
		$filename = $post_data['xlsFilename'] ;
	}
	header("Content-Type: application/force-download; name=\"$filename\""); 
	header("Content-Disposition: attachment; filename=\"$filename\""); 
	readfile($tmpfilename) ;
	unlink($tmpfilename) ;
	die() ;
}

?>