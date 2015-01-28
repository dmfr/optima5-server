<?php
function specWbMrfoxy_finance_getCfgCrop( $post_data ) {
	$time = time() ;
	$has_current = FALSE ;
	$TAB = specWbMrfoxy_tool_getCropIntervals() ;
	foreach( $TAB as &$row ) {
		if( strtotime($row['date_apply']) > $time ) {
			$row['is_preview'] = true ;
		} elseif( !$has_current ) {
			$row['is_current'] = $has_current = true ;
		}
	}
	unset($row);
	return array('success'=>true, 'data'=>$TAB) ;
}
function specWbMrfoxy_finance_getCfgCurrency( $post_data ) {
	$time = time() ;
	$has_current = FALSE ;
	$TAB = specWbMrfoxy_tool_getCurrencies() ;
	return array('success'=>true, 'data'=>$TAB) ;
}
function specWbMrfoxy_finance_getCfgProdtag( $post_data ) {
	$time = time() ;
	$has_current = FALSE ;
	$TAB = specWbMrfoxy_tool_getProdtags() ;
	return array('success'=>true, 'data'=>$TAB) ;
}

function specWbMrfoxy_finance_getGrid( $post_data ) {
	global $_opDB ;
	
	$filter_country = $post_data['filter_country'] ;
	$filter_cropYear = $post_data['filter_cropYear'] ;
	
	// crop principal
	$query = "SELECT * FROM view_file__CFG_CROP WHERE field_CROP_YEAR='{$filter_cropYear}'" ;
	$result = $_opDB->query($query) ;
	$arr_crop = $_opDB->fetch_assoc($result) ;
	if( $arr_crop == FALSE ) {
		return array('success'=>false) ;
	}
	
	// initial params
	$_in_params = array(
		'crop_year' => $filter_cropYear,
		'country_code' => $filter_country,
		'currency_code' => specWbMrfoxy_tool_getCountryCurrency( $filter_country )
	);
	
	// layout revisions
	$_layout_revisions = array() ;
	// - interval entre crop et suivan => pour extract des revisions
	$query = "SELECT field_DATE_APPLY FROM view_file__CFG_CROP
		WHERE field_DATE_APPLY > '{$arr_crop['field_DATE_APPLY']}'
		ORDER BY field_DATE_APPLY LIMIT 1" ;
	$up_limit =  $_opDB->query_uniqueValue($query) ;
	
	$query = "SELECT * FROM view_file_FINANCE_REVISION WHERE field_COUNTRY='{$filter_country}' AND field_REVISION_DATE>='{$arr_crop['field_DATE_APPLY']}'" ;
	if( $up_limit ) {
		$query.= " AND field_REVISION_DATE < '$up_limit'" ;
	}
	$query.= " ORDER BY field_REVISION_DATE" ;
	$result = $_opDB->query($query) ;
	$is_first = TRUE ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$rows = array() ;
		foreach( paracrm_lib_data_getFileChildRecords('FINANCE_REVISION_ROW',$arr['filerecord_id']) as $record ) {
			$row = array() ;
			$row['group_key'] = $record['field_GROUP_KEY'] ;
			$row['row_key'] = ($row['group_key']=='2_STORES' ? $record['field_ROW_SPEC_STORE'] : $record['field_ROW_KEY']) ;
			$row['row_sub_prodtag'] = $record['field_ROW_SUB_PRODTAG'] ;
			$row['row_sub_txt'] = $record['field_ROW_SUB_TXT'] ;
			$row['value_obj'] = $record['field_VALUE_OBJ'] ;
			$row['value'] = $record['field_VALUE'] ;
			$rows[] = $row ;
		}
		
		$_layout_revisions[] = array(
			'filerecord_id' => $arr['filerecord_id'],
			'revision_id' => date('ymd',strtotime($arr['field_REVISION_DATE'])),
			'is_crop_initial' => $is_first,
			'revision_date' => date('Y-m-d',strtotime($arr['field_REVISION_DATE'])),
			'is_actual' => false,
			'is_editing' => ( $arr['field_EDIT_IS_OPEN'] ? true : false ),
			'rows' => $rows
		);
		$is_first = FALSE ;
	}
	if( count($_layout_revisions) == 0 ) {
		$arr_ins = array() ;
		$arr_ins['field_COUNTRY'] = $filter_country ;
		$arr_ins['field_REVISION_DATE'] = $arr_crop['field_DATE_APPLY'] ;
		$arr_ins['field_EDIT_IS_OPEN'] = 1 ;
		$filerecord_id = paracrm_lib_data_insertRecord_file( 'FINANCE_REVISION', 0, $arr_ins ) ;
		
		$_layout_revisions[] = array(
			'filerecord_id' => $filerecord_id,
			'revision_id' => date('ymd',strtotime($arr_crop['field_DATE_APPLY'])),
			'is_crop_initial' => true,
			'revision_date' => date('Y-m-d',strtotime($arr_crop['field_DATE_APPLY'])),
			'is_actual' => false,
			'is_editing' => true
		);
	}
	$last_idx = count($_layout_revisions) - 1 ;
	while( isset($_layout_revisions[$last_idx]) ) {
		if( !$_layout_revisions[$last_idx]['is_editing'] ) {
			$_layout_revisions[$last_idx]['is_actual'] = true ;
			break ;
		}
		$last_idx-- ;
	}
	
	
	// Stores codes
	$store_rows = array() ;
	$bible_code = 'IRI_STORE' ;
	$map_treenode_txt = array() ;
	$query = "SELECT treenode_key, field_STOREGROUP_TXT FROM view_bible_{$bible_code}_tree" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$map_treenode_txt[$arr[0]] = $arr[1] ;
	}
	$tree_STORE = specWbMrfoxy_lib_getBibleTree('IRI_STORE') ;
	foreach( $tree_STORE->getAllMembersForDepth(2) as $treenode_key ) {
		if( $post_data['filter_country'] ) {
			$node = $tree_STORE->getTree($treenode_key) ;
			while( $node->getDepth() > 1 ) {
				$node = $node->getParent() ;
			}
			if( $node->getHead() != $post_data['filter_country'] ) {
				continue ;
			}
		}
		
		$row = array() ;
		$row['row_key'] = $treenode_key ;
		$row['row_text'] = $map_treenode_txt[$treenode_key] ;
		$store_rows[] = $row ;
	}

	
	// Groups
	$_layout_groups = array() ;
	$_layout_groups[] = array(
		'group_key' => '1_BUDGET',
		'group_text' => 'Gross budget',
		'operation' => '+',
		'rows' => array(
			array(
				'row_key' => 'budget_total',
				'row_text'=> 'Gross budget'
			)
		)
	);
	$_layout_groups[] = array(
		'group_key' => '2_STORES',
		'group_text' => 'National Agreements',
		'operation' => '-',
		'rows' => $store_rows,
		'has_sub_txt' => true,
		'has_total' => true
	);
	$_layout_groups[] = array(
		'group_key' => '3_FREEZE',
		'group_text' => 'Freezes',
		'operation' => '-',
		'rows' => array(
			array(
				'row_key' => 'freeze',
				'row_text'=> 'Freeze Amount'
			)
		)
	);
	$_layout_groups[] = array(
		'group_key' => '4_CALC',
		'group_text' => 'Promo budget',
		'operation' => '',
		'rows' => array(
			array(
				'row_key' => 'promo_total',
				'row_text'=> 'For promotions (total)'
			),
			array(
				'row_key' => 'promo_done',
				'row_text'=> 'Done (Real cost)'
			),
			array(
				'row_key' => 'promo_foreacast',
				'row_text'=> 'Committed (Forecast)'
			),
			array(
				'row_key' => 'promo_available',
				'row_text'=> 'Available'
			)
		)
	);
	
	$json_budgetbar = specWbMrfoxy_finance_getBudgetBar( array(
		'data_countryCode' => $filter_country,
		'data_cropYear' => $filter_cropYear
	) ) ;
	$data_budgetbar = $json_budgetbar['data'] ;
	
	return array(
		'success'=>true,
		'data' => array(
			'params' => $_in_params,
			'revisions' => $_layout_revisions,
			'groups' => $_layout_groups,
			'stats' => array(
				'cost_promo_done' => $data_budgetbar['ACTUAL'],
				'cost_promo_forecast' => $data_budgetbar['COMMIT']
			)
		)
	) ;
}


function specWbMrfoxy_finance_newRevision( $post_data ) {
	global $_opDB ;
	
	$filter_country = $post_data['filter_country'] ;
	$filter_cropYear = $post_data['filter_cropYear'] ;
	
	// crop principal
	$query = "SELECT * FROM view_file__CFG_CROP WHERE field_CROP_YEAR='{$filter_cropYear}'" ;
	$result = $_opDB->query($query) ;
	$arr_crop = $_opDB->fetch_assoc($result) ;
	if( $arr_crop == FALSE ) {
		return array('success'=>false) ;
	}
	// up_limit
	$_layout_revisions = array() ;
	// - interval entre crop et suivan => pour extract des revisions
	$query = "SELECT field_DATE_APPLY FROM view_file__CFG_CROP
		WHERE field_DATE_APPLY > '{$arr_crop['field_DATE_APPLY']}'
		ORDER BY field_DATE_APPLY LIMIT 1" ;
	$up_limit = $_opDB->query_uniqueValue($query) ;
	
	
	$query = "SELECT * FROM view_file_FINANCE_REVISION WHERE field_COUNTRY='{$filter_country}' AND field_REVISION_DATE>='{$arr_crop['field_DATE_APPLY']}'" ;
	if( $up_limit ) {
		$query.= " AND field_REVISION_DATE < '$up_limit'" ;
	}
	$query.= " ORDER BY field_REVISION_DATE DESC LIMIT 1" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return array('success'=>true) ;
	}
	$arr_previousR = $_opDB->fetch_assoc($result) ;
	$down_limit = $arr_previousR['field_REVISION_DATE'] ;
	$previousR_filerecordId = $arr_previousR['filerecord_id'] ;
	
	$form_data = json_decode($post_data['data'],true) ;
	if( $form_data['revision_date']
		&& strtotime($form_data['revision_date']) > strtotime($down_limit)
		&& ( !$up_limit || strtotime($form_data['revision_date']) < strtotime($up_limit) ) 
	) {} else {
		return array('success'=>false) ;
	}
	
	$arr_ins = array() ;
	$arr_ins['field_COUNTRY'] = $filter_country ;
	$arr_ins['field_REVISION_NAME'] = $form_data['revision_name'] ;
	$arr_ins['field_REVISION_DATE'] = $form_data['revision_date'] ;
	$arr_ins['field_EDIT_IS_OPEN'] = 1 ;
	$filerecord_id = paracrm_lib_data_insertRecord_file( 'FINANCE_REVISION', 0, $arr_ins ) ;
	
	// Copy previous
	foreach( paracrm_lib_data_getFileChildRecords('FINANCE_REVISION_ROW',$previousR_filerecordId) as $record ) {
		unset($record['filerecord_id']) ;
		paracrm_lib_data_insertRecord_file('FINANCE_REVISION_ROW',$filerecord_id,$record) ;
	}
	
	return array('success'=>true) ;
}
function specWbMrfoxy_finance_setRevision( $post_data ) {
	$filerecord_parent_id = $post_data['filerecord_parent_id'] ;
	
	if( !($revision_record = paracrm_lib_data_getRecord_file('FINANCE_REVISION',$filerecord_parent_id))
	|| !$revision_record['field_EDIT_IS_OPEN'] ) {
		return array('success'=>false) ;
	}
	
	if( $post_data['rows'] ) {
		$arr_filerecordId = array() ;
		foreach( json_decode($post_data['rows'],true) as $row ) {
			$arr_ins = array() ;
			$arr_ins['field_GROUP_KEY'] = $row['group_key'] ;
			$arr_ins['field_ROW_KEY'] = $row['row_key'] ;
			if( $row['group_key'] == '2_STORES' ) {
				$arr_ins['field_ROW_SPEC_STORE'] = $row['row_key'] ;
			}
			$arr_ins['field_ROW_SUB_PRODTAG'] = ( $row['row_sub_prodtag'] != NULL ? $row['row_sub_prodtag'] : '' );
			$arr_ins['field_ROW_SUB_TXT'] = ( $row['row_sub_txt'] != NULL ? $row['row_sub_txt'] : '' );
			$arr_ins['field_VALUE_OBJ'] = $row['value_obj'] ;
			$arr_ins['field_VALUE'] = $row['value'] ;
			$arr_filerecordId[] = paracrm_lib_data_insertRecord_file( 'FINANCE_REVISION_ROW', $filerecord_parent_id, $arr_ins ) ;
		}
		
		foreach( paracrm_lib_data_getFileChildRecords('FINANCE_REVISION_ROW',$filerecord_parent_id) as $record ) {
			if( in_array($record['filerecord_id'],$arr_filerecordId) ) {
				continue ;
			}
			paracrm_lib_data_deleteRecord_file('FINANCE_REVISION_ROW',$record['filerecord_id']) ;
		}
	}
	
	switch( $post_data['_subaction'] ) {
		case 'commit' :
			$arr_update = array() ;
			$arr_update['field_EDIT_IS_OPEN'] = 0 ;
			paracrm_lib_data_updateRecord_file('FINANCE_REVISION', $arr_update, $filerecord_parent_id) ;
			break ;
		case 'discard' :
			paracrm_lib_data_deleteRecord_file('FINANCE_REVISION', $filerecord_parent_id) ;
			break ;
	}
	
	specWbMrfoxy_finance_buildCache() ;
	return array('success'=>true) ;
}



function specWbMrfoxy_finance_buildCache() {
	global $_opDB ;
	
	$operations = array() ;
	$operations['1_BUDGET'] = '+' ;
	$operations['2_STORES'] = '-' ;
	$operations['3_FREEZE'] = '-' ;
	
	$arr_filerecordId_calcValue = array() ;
	
	$query = "SELECT * FROM view_file_FINANCE_REVISION_ROW" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$filerecord_parent_id = $arr['filerecord_parent_id'] ;
		
		$group_key_field = 'field_GROUP_KEY' ;
		$group_key = $arr[$group_key_field] ;
		$operation = $operations[$group_key] ;
		
		$value_field = 'field_VALUE' ;
		$value = $arr[$value_field] ;
		
		if( !isset($arr_filerecordId_calcValue[$filerecord_parent_id]) ) {
			$arr_filerecordId_calcValue[$filerecord_parent_id] = 0 ;
		}
		switch( $operation ) {
			case '+' :
				$arr_filerecordId_calcValue[$filerecord_parent_id] += $value ;
				break ;
			case '-' :
				$arr_filerecordId_calcValue[$filerecord_parent_id] -= $value ;
				break ;
			default :
				break ;
		}
	}
	
	$query = "SELECT * FROM view_file_FINANCE_REVISION" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$filerecord_id = $arr['filerecord_id'] ;
		if( isset($arr_filerecordId_calcValue[$filerecord_id]) ) {
			$value = $arr_filerecordId_calcValue[$filerecord_id] ;
		} else {
			$value = 0 ;
		}
		
		$arr_update = array() ;
		$arr_update['field_CALC_PROMO_BUDGET'] = $value ;
		paracrm_lib_data_updateRecord_file('FINANCE_REVISION', $arr_update, $filerecord_id) ;
	}
}









function specWbMrfoxy_finance_getBudgetBar( $post_data )  {
	global $_opDB ;
	
	$data_countryCode = $post_data['data_countryCode'] ;
	$data_cropYear = $post_data['data_cropYear'] ;
	
	//sleep(2) ;
	
	if( $data_cropYear == date('Y-m-d',strtotime($data_cropYear)) ) {
		$query = "SELECT field_CROP_YEAR FROM view_file__CFG_CROP WHERE field_DATE_APPLY<='$data_cropYear' ORDER BY field_DATE_APPLY DESC LIMIT 1" ;
		$data_cropYear = $_opDB->query_uniqueValue($query) ;
	}
	if( !paracrm_lib_data_getRecord_bibleEntry('_CROP',$data_cropYear) ) {
		return array('success'=>false) ;
	}
	
	
	
	
	// Init QMerge
	
	$q_id = 'Finance::Budget bars' ;
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
	foreach( $arr_saisie['fields_mwhere'] as &$field_mwhere ) {
		if( $field_mwhere['mfield_type'] == 'link' && $field_mwhere['mfield_linkbible'] == '_COUNTRY' ) {
			$field_mwhere['condition_bible_mode'] = 'SELECT' ;
			$field_mwhere['condition_bible_entries'] = $data_countryCode ;
		}
		if( $field_mwhere['mfield_type'] == 'link' && $field_mwhere['mfield_linkbible'] == '_CROP' ) {
			$field_mwhere['condition_bible_mode'] = 'SELECT' ;
			$field_mwhere['condition_bible_entries'] = $data_cropYear ;
		}
	}
	unset($field_mwhere) ;
	
	// Exec requete
	$RES = paracrm_queries_process_qmerge($arr_saisie , FALSE ) ;
	
	$DATA = array() ;
	foreach( $RES['RES_selectId_groupKey_value'] as $select_id => $arr_groupKey_value ) {
		if( count($arr_groupKey_value) != 1 ) {
			return array('success'=>false) ;
		}
		$DATA[$RES['RES_selectId_infos'][$select_id]['select_lib']] = reset($arr_groupKey_value) ;
	}
	
	
	return array('success'=>true, 'data'=>$DATA) ;
}


function specWbMrfoxy_finance_getNationalAgreements( $post_data ) {
	global $_opDB ;
	
	$date_today = date('Y-m-d') ;
	
	// ******* Currencies ***********
	$TAB_currencies = array() ;
	foreach( specWbMrfoxy_tool_getCurrencies() as $currency_desc ) {
		$currency_code = $currency_desc['currency_code'] ;
		$TAB_currencies[$currency_code] = $currency_desc ;
	}
	
	// ******* Which revisions ? **********
	$TAB = array() ;
	$forward_post = array() ;
	$forward_post['start'] ;
	$forward_post['limit'] ;
	$forward_post['file_code'] = 'FINANCE_REVISION' ;
	$ttmp = paracrm_data_getFileGrid_data( $forward_post, $auth_bypass=TRUE ) ;
	$paracrm_TAB = $ttmp['data'] ;
	foreach( $paracrm_TAB as $paracrm_row ) {
		if( $paracrm_row['FINANCE_REVISION_field_EDIT_IS_OPEN'] ) {
			continue ;
		}
		
		$crop_year = $paracrm_row['FINANCE_REVISION_field_CROP_YEAR'] ;
		$country_code = $paracrm_row['FINANCE_REVISION_field_COUNTRY'] ;
		
		if( !isset($TAB[$country_code][$crop_year]) ) {
			$TAB[$country_code][$crop_year] = array() ;
		}
		$TAB[$country_code][$crop_year][] = $paracrm_row['filerecord_id'] ;
	}
	$filerecord_ids = array() ;
	foreach( $TAB as $country_code => $tarr ) {
		foreach( $tarr as $crop_year => $ttmp ) {
			$filerecord_ids[] = max($ttmp) ;
		}
	}
	
	// **** All crops ********
	$crop_year_dates = array() ;
	$TAB = specWbMrfoxy_tool_getCropIntervals() ;
	foreach($TAB as $crop_desc) {
		$crop_year = $crop_desc['crop_year'] ;
		$date_apply = $crop_desc['date_apply'] ;
		
		$crop_year_dates[$crop_year] = array() ;
		for( $i=0 ; $i<12 ; $i++ ) {
			$crop_year_dates[$crop_year][] = $date_apply ;
			$date_apply = date('Y-m-d',strtotime('+1 month',strtotime($date_apply))) ;
		}
	}
	
	
	
	$forward_post = array() ;
	$forward_post['start'] ;
	$forward_post['limit'] ;
	$forward_post['file_code'] = 'FINANCE_REVISION_ROW' ;
	
	$filters = array() ;
	if( TRUE ) {
		$filter = array() ;
		$filter['field'] = 'FINANCE_REVISION_ROW_field_GROUP_KEY' ;
		$filter['type'] = 'string' ;
		$filter['value'] = '2_STORES' ;
		$filters[] = $filter ;
	}
	if( TRUE ) {
		$filter = array() ;
		$filter['field'] = 'FINANCE_REVISION_id' ;
		$filter['type'] = 'list' ;
		$filter['value'] = $filerecord_ids ;
		$filters[] = $filter ;
	}
	if( $post_data['filter_country'] ) {
		$filter = array() ;
		$filter['field'] = 'FINANCE_REVISION_field_COUNTRY' ;
		$filter['type'] = 'list' ;
		$filter['value'] = array($post_data['filter_country']) ;
		$filters[] = $filter ;
	}
	if( isset($post_data['filter']) ) {
		
		foreach( json_decode($post_data['filter'],true) as $filter ) {
			$paracrm_field = NULL ;
			switch( $filter['field'] ) {
				case 'cropYear_code' : 
					$post_data['filter_cropYear_arr'] = $filter['value'] ;
					continue 2 ;
				
				case 'store_text' : $paracrm_field='FINANCE_REVISION_ROW_field_ROW_SPEC_STORE' ; break ;
				case 'nagreement_prodtag' : $paracrm_field='FINANCE_REVISION_ROW_field_ROW_SUB_PRODTAG' ; break ;
				
				default : continue 2 ;
			}
			$filter['field'] = $paracrm_field ;
			$filters[] = $filter ;
		}
		
	}
	if( $filters ) {
		$forward_post['filter'] = json_encode($filters) ;
	}
	
	$ttmp = paracrm_data_getFileGrid_data( $forward_post, $auth_bypass=TRUE ) ;
	$paracrm_TAB = $ttmp['data'] ;
	
	$auth_arrCountries = specWbMrfoxy_auth_lib_getCountries() ;
	
	$TAB = array() ;
	$nagreement_ids = array() ;
	foreach( $paracrm_TAB as $paracrm_row ) {
		if( is_array($auth_arrCountries) && !in_array($paracrm_row['FINANCE_REVISION_field_COUNTRY'],$auth_arrCountries) ) {
			continue ;
		}
		
		if( $paracrm_row['FINANCE_REVISION_ROW_field_VALUE'] == 0 ) {
			continue ;
		}
		
		$crop_year = $paracrm_row['FINANCE_REVISION_field_CROP_YEAR'] ;
		if( $post_data['filter_cropYear_arr'] && !in_array($crop_year,$post_data['filter_cropYear_arr']) ) {
			continue ;
		}
		$crop_decoupe = $crop_year_dates[$crop_year] ;
		
		if( $arr_currencies = json_decode($paracrm_row['FINANCE_REVISION_field_COUNTRY_entry_COUNTRY_CURRENCY'],true) ) {
			$currency_code = reset($arr_currencies) ;
			
		}
		$currency_desc = $TAB_currencies[$currency_code] ;
		
		$amount_real = 0 ;
		foreach( $crop_decoupe as $date_apply ) {
			if( $date_today >= $date_apply ) {
				$amount_real += ( $paracrm_row['FINANCE_REVISION_ROW_field_VALUE'] / count($crop_decoupe) ) ;
			}
		}
	
		$nagreement_id_base = '' ;
		$nagreement_id_base.= $paracrm_row['FINANCE_REVISION_field_COUNTRY'] ;
		$nagreement_id_base.= ' ' ;
		$nagreement_id_base.= ($paracrm_row['FINANCE_REVISION_ROW_field_ROW_SPEC_STORE_tree_STOREGROUP_MEMO'] ? $paracrm_row['FINANCE_REVISION_ROW_field_ROW_SPEC_STORE_tree_STOREGROUP_MEMO'] : 'XXXX') ;
		$nagreement_id_base.= ' ' ;
		$nagreement_id_base.= ($paracrm_row['FINANCE_REVISION_ROW_field_ROW_SUB_PRODTAG_tree_PRODTAG'] ? $paracrm_row['FINANCE_REVISION_ROW_field_ROW_SUB_PRODTAG_tree_PRODTAG'] : '??') ;
		$nagreement_id_base.= ' ' ;
		$nagreement_id_base.= $paracrm_row['FINANCE_REVISION_field_CROP_YEAR'] ;
		
		$suffix = '' ;
		$nagreement_id = $nagreement_id_base ;
		while(true) {
			if( !in_array($nagreement_id,$nagreement_ids) ) {
				$nagreement_ids[] = $nagreement_id ;
				break ;
			}
			if( $suffix == '' ) {
				$suffix = 'B' ;
			} else {
				$suffix++ ;
			}
			$nagreement_id = $nagreement_id_base.' '.$suffix ;
		}
		
		$row = array() ;
		$row['country_code'] = $paracrm_row['FINANCE_REVISION_field_COUNTRY'] ;
		$row['nagreement_id'] = $nagreement_id ;
		$row['cropYear_code'] = $paracrm_row['FINANCE_REVISION_field_CROP_YEAR'] ;
		$row['currency'] = $currency_code ;
		$row['currency_symbol'] = $currency_desc['currency_sign'] ;
		$row['store_code'] = $paracrm_row['FINANCE_REVISION_ROW_field_ROW_SPEC_STORE_tree_STOREGROUP'] ;
		$row['store_text'] = $paracrm_row['FINANCE_REVISION_ROW_field_ROW_SPEC_STORE_tree_STOREGROUP_TXT'] ;
		$row['nagreement_prodtag'] = $paracrm_row['FINANCE_REVISION_ROW_field_ROW_SUB_PRODTAG_tree_PRODTAG_TXT'] ;
		$row['nagreement_txt'] = $paracrm_row['FINANCE_REVISION_ROW_field_ROW_SUB_TXT'] ;
		$row['amount_forecast'] = $paracrm_row['FINANCE_REVISION_ROW_field_VALUE'];
		$row['amount_real'] = $amount_real ;
		$row['status_isReal'] = ($date_today >= $date_apply) ;
		$TAB[] = $row ;
	}
	return array('success'=>true, 'data'=>$TAB, 'debug'=>$paracrm_TAB) ;
}

?>