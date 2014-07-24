<?php

function specWbMrfoxy_stat_performance_getResult( $post_data ) {
	global $_opDB ;
	$form_data = json_decode($post_data['data'],true) ;
	
	$q_id = 'Stat::Performance' ;
	if( !is_numeric($q_id) ) {
		$query = "SELECT qmerge_id FROM qmerge WHERE qmerge_name LIKE '{$q_id}'";
		$q_id = $_opDB->query_uniqueValue($query) ;
		if( !$q_id ) {
			return array('success'=>false) ;
		}
	}
	
	$arr_saisie = array() ;
	paracrm_queries_mergerTransaction_init( array('qmerge_id'=>$q_id) , $arr_saisie ) ;
	
	// replace conditions
	$fileCondition_idx = NULL ;
	$query_vars = array() ;
	$query_vars['time_mode'] = $form_data['time_mode'] ;
	$query_vars['break_date'] = $form_data['break_date'] ;
	foreach( $arr_saisie['fields_mwhere'] as $idx => &$field_mwhere ) {
		//print_r($field_mwhere) ;
		if( $field_mwhere['mfield_type'] == 'link' && $field_mwhere['mfield_linkbible'] == '_COUNTRY' && $form_data['country_code'] ) {
			$field_mwhere['condition_bible_entries'] = $form_data['country_code'] ;
			$query_vars['country_code'] = $form_data['country_code'] ;
			$query_vars['country_text'] = $_opDB->query_uniqueValue("SELECT field_COUNTRY_NAME FROM view_bible__COUNTRY_entry WHERE entry_key='{$form_data['country_code']}'") ;
		}
		if( $field_mwhere['mfield_type'] == 'link' && $field_mwhere['mfield_linkbible'] == 'IRI_STORE' && $form_data['store_code'] ) {
			$field_mwhere['condition_bible_treenodes'] = json_encode(array($form_data['store_code'])) ;
			$query_vars['store_code'] = $form_data['store_code'] ;
			$query_vars['store_text'] = $_opDB->query_uniqueValue("SELECT field_STOREGROUP_TXT FROM view_bible_IRI_STORE_tree WHERE treenode_key='{$form_data['store_code']}'") ;
		}
		if( $field_mwhere['mfield_type'] == 'link' && $field_mwhere['mfield_linkbible'] == 'IRI_PROD' && $form_data['prod_code'] ) {
			$field_mwhere['condition_bible_treenodes'] = json_encode(array($form_data['prod_code'])) ;
			$query_vars['prod_code'] = $form_data['prod_code'] ;
			$query_vars['prod_text'] = $_opDB->query_uniqueValue("SELECT field_PRODGROUPTXT FROM view_bible_IRI_PROD_tree WHERE treenode_key='{$form_data['prod_code']}'") ;
		}
		if( $field_mwhere['mfield_type'] == 'file' ) {
			$fileCondition_idx = $idx ;
		}
	}
	unset($field_mwhere) ;
	if( $fileCondition_idx !== NULL ) {
		switch( $query_vars['time_mode'] ) {
			case 'TO_DATE' :
			case 'FROM_DATE' :
				// HACK? classif de toutes les promo
				
					// Load every CROP details + "middle date" boundary
					$arr_cropYear_data = array() ;
					$ttmp = paracrm_data_getFileGrid_data( array('file_code'=>'_CFG_CROP'), $auth_bypass=TRUE ) ;
					foreach( $ttmp['data'] as $data_row ) {
						$time_apply = strtotime( $data_row['_CFG_CROP_field_DATE_APPLY'] ) ;
						$target_time = strtotime( date('Y',$time_apply).'-'.date('m',strtotime($query_vars['break_date'])).'-'.date('d',strtotime($query_vars['break_date'])) ) ;
						if( $target_time < $time_apply ) {
							$target_time = strtotime('+1 year',$target_time) ;
						}
						
						$cropYear = $data_row['_CFG_CROP_field_CROP_YEAR'] ;
						$arr_cropYear_data[$cropYear] = array(
							'date_apply' => date('Y-m-d', $time_apply),
							'date_break' => date('Y-m-d', $target_time)
						); 
					}
					
					// Classify all promos
					$arr_TODATE_ids = array() ;
					$arr_FROMDATE_ids = array() ;
					$ttmp = specWbMrfoxy_promo_getGrid( array('filter_isProd'=>true) ) ;
					foreach( $ttmp['data'] as $promo_row ) {
						$cropYear_code = $promo_row['cropYear_code'] ;
						$cropYear_infos = $arr_cropYear_data[$cropYear_code] ;
						if( !$cropYear_infos ) {
							continue ;
						}
						if( $promo_row['date_start'] > $cropYear_infos['date_break'] ) {
							$arr_FROMDATE_ids[] = $promo_row['_filerecord_id'] ;
						}
						if( $promo_row['date_start'] <= $cropYear_infos['date_break'] ) {
							$arr_TODATE_ids[] = $promo_row['_filerecord_id'] ;
						}
					}
					
					switch( $query_vars['time_mode'] ) {
						case 'TO_DATE' :
							$arr_filerecord_ids = $arr_TODATE_ids ;
							break ;
						case 'FROM_DATE' :
							$arr_filerecord_ids = $arr_FROMDATE_ids ;
							break ;
					}
					
				$arr_saisie['fields_mwhere'][$fileCondition_idx]['condition_file_ids'] = json_encode( $arr_filerecord_ids ) ;
				break ;
			
			default :
				unset($arr_saisie['fields_mwhere'][$fileCondition_idx]) ;
				break ;
		}
	}
	
	// Exec requete
	$RES = paracrm_queries_process_qmerge($arr_saisie , FALSE ) ;
	
	$tabs = array() ;
	foreach( $RES['RES_labels'] as $tab_id => $dummy )
	{
		$tab = array() ;
		$tab['tab_title'] = $dummy['tab_title'] ;
		$tab['cfg_doTreeview'] = ($RES['RES_titles']['cfg_doTreeview'] == TRUE) ;
		$tab = $tab + paracrm_queries_mpaginate_getGrid( $RES, $tab_id ) ;
		
		if( !$tab['data'] ) {
			continue ;
		}
		
		if( $tab['cfg_doTreeview'] ) {
			$tab['data_root'] = paracrm_queries_mpaginate_buildTree( $tab['data'] ) ;
		}
		
		$tabs[$tab_id] = $tab ;
	}
	if( $tabs ) {
		return array('success'=>true, 'query_vars'=>$query_vars , 'result_tab'=>$tabs[0]) ;
	}
	return array('success'=>true) ;
}

function specWbMrfoxy_stat_exportXLS( $post_data ) {
	global $_opDB ;
	$data = json_decode($post_data['data'],true) ;
	
	$workbook_tab_grid = array() ;
	foreach( $data as $panel ) {
		$tab = $panel['result_tab'] ;
		$tab['tab_title'] = $panel['title'] ;
		$workbook_tab_grid[] = $tab ;
	}
	
	$objPHPExcel = paracrm_queries_xls_build( $workbook_tab_grid ) ;
	if( !$objPHPExcel ) {
		die() ;
	}
	foreach( $data as $idx => $panel ) {
		$objPHPExcel->setActiveSheetIndex($idx);
		$objWorksheet = $objPHPExcel->getActiveSheet();
		
		
		$queryVars = $panel['query_vars'] ;
		$header_table = array() ;
		if( $queryVars['time_mode'] ) {
			$timeTxt = '' ;
			switch( $queryVars['time_mode'] ) {
				case 'TO_DATE' :
					$timeTxt = 'Crop to Date ' + $queryVars['break_date'] ;
					break ;
				
				case 'FROM_DATE' :
					$timeTxt = 'Crop to Go ' + $queryVars['break_date'] ;
					break ;
				
				default :
					$timeTxt = 'Whole year/crop' ;
					break ;
			}
			$header_table[] = array(
				'fieldLabel' => 'Time mode',
				'fieldValue' => $timeTxt
			) ;
		}
		if( $queryVars['store_text'] ) {
			$header_table[] = array(
				'fieldLabel' => 'Stores',
				'fieldValue' => $queryVars['store_text']
			) ;
		} else if( $queryVars['country_text'] ) {
			$header_table[] = array(
				'fieldLabel' => 'Country',
				'fieldValue' => $queryVars['country_text']
			) ;
		}
		if( $queryVars['prod_text'] ) {
			$header_table[] = array(
				'fieldLabel' => 'Products',
				'fieldValue' => $queryVars['prod_text']
			) ;
		}
		
		$objWorksheet->insertNewRowBefore(1, count($header_table)+1);
		$row = 1 ;
		foreach( $header_table as $header_row ) {
			$objWorksheet->SetCellValue("A{$row}", $header_row['fieldLabel'] );
			$objWorksheet->getStyle("B{$row}")->getFont()->setBold(TRUE);
			$objWorksheet->SetCellValue("B{$row}", $header_row['fieldValue'] );
			$row++ ;
		}
	}
	
	$tmpfilename = tempnam( sys_get_temp_dir(), "FOO");
	$objWriter = PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel2007');
	$objWriter->save($tmpfilename);
	$objPHPExcel->disconnectWorksheets();
	unset($objPHPExcel) ;
	
	$filename = 'MrFoxy_StatPerformance'.'_'.time().'.xlsx' ;
	header("Content-Type: application/force-download; name=\"$filename\""); 
	header("Content-Disposition: attachment; filename=\"$filename\""); 
	readfile($tmpfilename) ;
	unlink($tmpfilename) ;
	die() ;
	
	
}
?>