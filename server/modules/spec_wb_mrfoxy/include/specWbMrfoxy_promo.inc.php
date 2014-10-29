<?php

function specWbMrfoxy_promo_getGrid_getProdColor( $prod_code ) {
	global $_opDB ;
	
	global $_cache_prodCode_prodColor ;
	if( !isset($_cache_prodCode_prodColor[$prod_code]) ) {
		$prod_code_current = $prod_code ;
		while(TRUE) {
			$prod_color = '' ;
			$query = "SELECT field_PRODGROUPCOLOR, treenode_parent_key FROM view_bible_IRI_PROD_tree WHERE treenode_key='$prod_code_current'" ;
			$row = $_opDB->fetch_row($_opDB->query($query)) ;
			if( $row[0] != '' ) {
				$prod_color = $row[0] ;
				$_cache_prodCode_prodColor[$prod_code] = $prod_color ;
				break ;
			}
			if( $row[1] != '' ) {
				$prod_code_current = $row[1] ;
				continue ;
			}
			break ;
		}
	}
	return $_cache_prodCode_prodColor[$prod_code] ;
}
function specWbMrfoxy_promo_getGrid( $post_data ) {
	$forward_post = array() ;
	$forward_post['start'] ;
	$forward_post['limit'] ;
	$forward_post['file_code'] = 'WORK_PROMO' ;
	
	$filters = array() ;
	if( $post_data['filter_country'] ) {
		$filter = array() ;
		$filter['field'] = 'WORK_PROMO_field_COUNTRY' ;
		$filter['type'] = 'list' ;
		$filter['value'] = array($post_data['filter_country']) ;
		$filters[] = $filter ;
	}
	if( isset($post_data['filter_isProd']) ) {
		$filter = array() ;
		$filter['field'] = 'WORK_PROMO_field_IS_PROD' ;
		$filter['type'] = 'numeric' ;
		$filter['comparison'] = 'eq' ;
		$filter['value'] = ( $post_data['filter_isProd'] ? 1 : 0 ) ;
		$filters[] = $filter ;
	}
	if( isset($post_data['filter_isBenchmarkEligible']) && $post_data['filter_isBenchmarkEligible'] ) {
		$filter = array() ;
		$filter['field'] = 'WORK_PROMO_field_STATUS_entry_PERCENT' ;
		$filter['type'] = 'numeric' ;
		$filter['comparison'] = 'gt' ;
		$filter['value'] = 79 ;
		$filters[] = $filter ;
	}
	if( isset($post_data['filter_isDone']) && $post_data['filter_isDone'] ) {
		$filter = array() ;
		$filter['field'] = 'WORK_PROMO_field_STATUS' ;
		$filter['type'] = 'string' ;
		$filter['comparison'] = 'eq' ;
		$filter['value'] = '99_CLOSED' ;
		$filters[] = $filter ;
	}
	if( $post_data['filter_id'] && isJsonArr($post_data['filter_id']) ) {
		$filter = array() ;
		$filter['field'] = 'filerecord_id' ;
		$filter['type'] = 'list' ;
		$filter['value'] = json_decode($post_data['filter_id'],true) ;
		$filters[] = $filter ;
	}
	if( isset($post_data['filter']) ) {
		
		foreach( json_decode($post_data['filter'],true) as $filter ) {
			$paracrm_field = NULL ;
			switch( $filter['field'] ) {
				case 'status_code' : $paracrm_field='WORK_PROMO_field_STATUS' ; break ;
				case 'brand_text' : $paracrm_field='WORK_PROMO_field_BRAND' ; break ;
				case 'date_supply_start' : $paracrm_field='WORK_PROMO_field_DATE_SUPPLY_START' ; break ;
				case 'date_supply_end' : $paracrm_field='WORK_PROMO_field_DATE_SUPPLY_END' ; break ;
				case 'date_start' : $paracrm_field='WORK_PROMO_field_DATE_START' ; break ;
				case 'date_end' : $paracrm_field='WORK_PROMO_field_DATE_END' ; break ;
				case 'store_text' : $paracrm_field='WORK_PROMO_field_STORE' ; break ;
				case 'prod_text' : $paracrm_field='WORK_PROMO_field_PROD' ; break ;
				case 'cost_billing_text' : $paracrm_field='WORK_PROMO_field_COST_BILLING' ; break ;
				case 'mechanics_text' : $paracrm_field='WORK_PROMO_field_MECH_TYPE' ; break ;
				default : continue 2 ;
			}
			if( $post_data['filter_isProd'] && $filter['field']=='brand_text' ) {
				continue ;
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
	foreach( $paracrm_TAB as $paracrm_row ) {
		if( is_array($auth_arrCountries) && !in_array($paracrm_row['WORK_PROMO_field_COUNTRY'],$auth_arrCountries) ) {
			continue ;
		}
		
		$row = array() ;
		$row['_filerecord_id'] = $paracrm_row['filerecord_id'] ;
		$row['promo_id'] = $paracrm_row['WORK_PROMO_field_PROMO_CODE'] ;
		$row['is_prod'] = ($paracrm_row['WORK_PROMO_field_IS_PROD'] ? 'PROD' : '') ;
		$row['brand_code'] = $paracrm_row['WORK_PROMO_field_BRAND'] ;
		$row['brand_text'] = $paracrm_row['WORK_PROMO_field_BRAND_tree_BRANDGROUP_TXT'] ;
		$row['country_code'] = $paracrm_row['WORK_PROMO_field_COUNTRY'] ;
		$row['country_text'] = $paracrm_row['WORK_PROMO_field_COUNTRY_entry_COUNTRY_NAME'] ;
		$row['country__hasIri'] = $paracrm_row['WORK_PROMO_field_COUNTRY_entry_IRI_IS_ON'] ;
		$row['status_code'] = $paracrm_row['WORK_PROMO_field_STATUS'] ;
		$row['status_percent'] = $paracrm_row['WORK_PROMO_field_STATUS_entry_PERCENT'] ;
		$row['status_text'] = $paracrm_row['WORK_PROMO_field_STATUS_entry_STATUS_TXT'] ;
		$row['cropYear_code'] = $paracrm_row['WORK_PROMO_field_DATE_CROP'] ;
		$row['date_supply_start'] = date('Y-m-d',strtotime($paracrm_row['WORK_PROMO_field_DATE_SUPPLY_START'])) ;
		$row['date_supply_end'] = date('Y-m-d',strtotime($paracrm_row['WORK_PROMO_field_DATE_SUPPLY_END'])) ;
		$row['date_start'] = date('Y-m-d',strtotime($paracrm_row['WORK_PROMO_field_DATE_START'])) ;
		$row['date_end'] = date('Y-m-d',strtotime($paracrm_row['WORK_PROMO_field_DATE_END'])) ;
		$row['store_code'] = $paracrm_row['WORK_PROMO_field_STORE'] ;
		$row['store_text'] = $paracrm_row['WORK_PROMO_field_STORE_tree_STOREGROUP_TXT'] ;
		$row['prod_code'] = $paracrm_row['WORK_PROMO_field_PROD'] ;
		$row['prod_text'] = $paracrm_row['WORK_PROMO_field_PROD_tree_PRODGROUPTXT'] ;
		$row['mechanics_code'] = $paracrm_row['WORK_PROMO_field_MECH_TYPE'] ;
		$row['mechanics_detail'] = $paracrm_row['WORK_PROMO_field_MECH_DETAIL'] ;
		$row['mechanics_text'] = $paracrm_row['WORK_PROMO_field_MECH_TYPE_tree_CLASS_TXT'].' - '.$paracrm_row['WORK_PROMO_field_MECH_DETAIL'] ;
		$row['mechanics_rewardcard'] = $paracrm_row['WORK_PROMO_field_MECH_REWARDCARD'] ;
		$row['currency'] = $paracrm_row['WORK_PROMO_field_CURRENCY'] ;
		$row['currency_symbol'] = $paracrm_row['WORK_PROMO_field_CURRENCY_tree_CURRENCY_SIGN'] ;
		$row['cost_billing_code'] = $paracrm_row['WORK_PROMO_field_COST_BILLING'] ;
		$row['cost_billing_text'] = $paracrm_row['WORK_PROMO_field_COST_BILLING_tree_PAYM_TXT'] ;
		$row['cost_billing__csHold'] = $paracrm_row['WORK_PROMO_field_COST_BILLING_tree_CSHOLD_IS_ON'] ;
		$row['cost_billing__autoclose'] = $paracrm_row['WORK_PROMO_field_COST_BILLING_tree_AUTOCLOSE_IS_ON'] ;
		$row['cost_static_billback'] = $paracrm_row['WORK_PROMO_field_COST_STATIC_BB'] ;
		$row['cost_static_discount'] = $paracrm_row['WORK_PROMO_field_COST_STATIC_DIS'] ;
		$row['cost_forecast'] = $paracrm_row['WORK_PROMO_field_COST_FORECAST'] ;
		$row['cost_forecast_var'] = $paracrm_row['WORK_PROMO_field_COST_FORECAST_VAR'] ;
		$row['cost_real'] = $paracrm_row['WORK_PROMO_field_COST_REAL_VALUE'] ;
		$row['cost_real_is_calc'] = ( $paracrm_row['WORK_PROMO_field_STATUS_tree_STATUS_GROUP'] == '99_CLOSED' ) ;
		$row['calc_uplift_vol'] = $paracrm_row['WORK_PROMO_field_CALC_UPLIFT_VOL'] ;
		$row['calc_uplift_per'] = $paracrm_row['WORK_PROMO_field_CALC_UPLIFT_PER'] ;
		$row['calc_roi'] = $paracrm_row['WORK_PROMO_field_CALC_ROI'] ;
		$row['calc_nb_displays'] = $paracrm_row['WORK_PROMO_field_CALC_NB_DISPLAYS'] ;
		$row['obs_atl'] = $paracrm_row['WORK_PROMO_field_OBS_ATL'] ;
		$row['obs_btl'] = $paracrm_row['WORK_PROMO_field_OBS_BTL'] ;
		$row['obs_comment'] = $paracrm_row['WORK_PROMO_field_OBS_COMMENT'] ;
		$row['approv_ds'] = $paracrm_row['WORK_PROMO_field_APPROV_DS'] ;
		$row['approv_ds_ok'] = $paracrm_row['WORK_PROMO_field_APPROV_DS_OK'] ;
		$row['approv_ds_obs'] = $paracrm_row['WORK_PROMO_field_APPROV_DS_OBS'] ;
		$row['approv_df'] = $paracrm_row['WORK_PROMO_field_APPROV_DF'] ;
		$row['approv_df_ok'] = $paracrm_row['WORK_PROMO_field_APPROV_DF_OK'] ;
		$row['approv_df_obs'] = $paracrm_row['WORK_PROMO_field_APPROV_DF_OBS'] ;
		$row['baseline_in_force'] = $paracrm_row['WORK_PROMO_field_BASELINE_IN_FORCE'] ;
		$row['baseline_in_value'] = $paracrm_row['WORK_PROMO_field_BASELINE_IN_VALUE'] ;
		$row['baseline_out_force'] = $paracrm_row['WORK_PROMO_field_BASELINE_OUT_FORCE'] ;
		$row['baseline_out_value'] = $paracrm_row['WORK_PROMO_field_BASELINE_OUT_VALUE'] ;
		$row['benchmark_arr_ids'] = $paracrm_row['WORK_PROMO_field_BENCHMARK_ARR_IDS'] ;
		
		// nb weeks
		$date2 = strtotime($row['date_end']);
		$date1 = strtotime($row['date_start']);
		$datediff = $date2 - $date1;
		$row['date_length_weeks'] = ceil($datediff/(60*60*24*7));
		
		// month
		$row['date_month'] = date('Y-m',strtotime($paracrm_row['WORK_PROMO_field_DATE_START'])) ;
		
		// store : enseigne
		$treenode_key = $paracrm_row['WORK_PROMO_field_STORE_tree_STOREGROUP'] ;
		$tree_STORE = specWbMrfoxy_lib_getBibleTree('IRI_STORE') ;
		$node_STORE = $tree_STORE->getTree($treenode_key) ;
		while( $node_STORE->getDepth() > 2 ) {
			$node_STORE = $node_STORE->getParent() ;
		}
		$row['store_node'] = $node_STORE->getHead() ;
		
		// prod : color
		$prod_code = $paracrm_row['WORK_PROMO_field_PROD'] ;
		$row['prod_colorHex'] = specWbMrfoxy_promo_getGrid_getProdColor($prod_code) ;
	
		// SKUs store
		if( $post_data['_load_details'] ) {
			$ttmp = paracrm_data_getFileGrid_data( array(
				'file_code'=>'WORK_PROMO_SKU',
				'filter'=>json_encode(array(
					array(
						'field'=>'WORK_PROMO_id',
						'type'=>'list',
						'value'=>array($paracrm_row['filerecord_id'])
					)
				))
			), $auth_bypass=TRUE ) ;
			$paracrm_TAB_SKU = $ttmp['data'] ;

			
			$row['promo_sku'] = array() ;
			foreach( $paracrm_TAB_SKU as $paracrm_row_sku ) {
				$row_sku = array() ;
				$row_sku['sku_prodean'] = $paracrm_row_sku['WORK_PROMO_SKU_field_SKU_CODE'] ;
				$row_sku['sku_code'] = $paracrm_row_sku['WORK_PROMO_SKU_field_SKU_CODE_entry_PROD_BRANDCODE'] ;
				$row_sku['sku_desc'] = $paracrm_row_sku['WORK_PROMO_SKU_field_SKU_CODE_entry_PROD_TXT'] ;
				$row_sku['sku_uom'] = $paracrm_row_sku['WORK_PROMO_SKU_field_SKU_CODE_entry_PROD_UOM'] ;
				$row_sku['sku_pcb'] = $paracrm_row_sku['WORK_PROMO_SKU_field_SKU_CODE_entry_PROD_PCB'] ;
				$row_sku['cli_price_unit'] = $paracrm_row_sku['WORK_PROMO_SKU_field_PRICE_UNIT'] ;
				$row_sku['promo_price_cut'] = $paracrm_row_sku['WORK_PROMO_SKU_field_PRICE_UNIT_CUT'] ;
				$row_sku['promo_price_coef'] = $paracrm_row_sku['WORK_PROMO_SKU_field_PRICE_COEF'] ;
				$row_sku['promo_qty_forecast'] = $paracrm_row_sku['WORK_PROMO_SKU_field_QTY_FORECAST'] ;
				$row['promo_sku'][] = $row_sku ;
			}
		}
		
		$TAB[] = $row ;
	}
	return array('success'=>true, 'data'=>$TAB, 'debug'=>$paracrm_TAB) ;
}

function specWbMrfoxy_promo_getCalendarAccounts( $post_data ) {
	global $_opDB ;
	
	$data = array() ;
	
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
		$row['store_node'] = $treenode_key ;
		$row['store_node_txt'] = $map_treenode_txt[$treenode_key] ;
		$data[] = $row ;
	}
	
	return array('success'=>true,'data'=>$data) ;
}

function specWbMrfoxy_promo_getSideGraph( $post_data ) {
	global $_opDB ;
	$src_filerecordId = $post_data['filerecord_id'] ;
	
	$q_id = 'SellOut Idx A+B' ;
	if( !is_numeric($q_id) ) {
		$query = "SELECT qbook_id FROM qbook WHERE qbook_name LIKE '{$q_id}'";
		$q_id = $_opDB->query_uniqueValue($query) ;
		if( !$q_id ) {
			return array('success'=>false) ;
		}
	}
	
	$post_test = array() ;
	$post_test['_action'] = 'queries_qbookTransaction' ;
	$post_test['_subaction'] = 'init' ;
	$post_test['qbook_id'] = $q_id ;
	$json = paracrm_queries_qbookTransaction( $post_test ) ;
	$transaction_id = $json['transaction_id'] ;
	
	$post_test = array() ;
	$post_test['_action'] = 'queries_qbookTransaction' ;
	$post_test['_transaction_id'] = $transaction_id ;
	$post_test['_subaction'] = 'run' ;
	$post_test['qsrc_filerecord_id'] = $src_filerecordId ;
	$json = paracrm_queries_qbookTransaction( $post_test ) ;
	if( !$json['success'] ) {
		unset($_SESSION['transactions'][$transaction_id]) ;
		return array('success'=>false) ;
	}

	$post_test = array() ;
	$post_test['_action'] = 'queries_qbookTransaction' ;
	$post_test['_transaction_id'] = $transaction_id ;
	$post_test['_subaction'] = 'res_get' ;
	$post_test['RES_id'] = $json['RES_id'] ;
	$json = paracrm_queries_qbookTransaction( $post_test ) ;
	
	unset($_SESSION['transactions'][$transaction_id]) ;
	
	if( $json['tabs'][1]['RESchart_static'] ) {
		return array('success'=>true, 'RESchart_static'=>$json['tabs'][1]['RESchart_static']) ;
	}
	return array('success'=>false) ;
}
function specWbMrfoxy_promo_getSideBenchmark( $post_data ) {
	global $_opDB ;
	$src_filerecordId = $post_data['filerecord_id'] ;
	$ttmp = specWbMrfoxy_promo_getGrid( array(
		'_load_details'=>true,
		'filter_id'=>json_encode(array($src_filerecordId))
	) ) ;
	if( count($ttmp['data']) != 1 ) {
		die() ;
	}
	$promo_record = $ttmp['data'][0] ;
	
	
	
	$grid_filter = array() ;
	if( $promo_record['prod_code'] ) {
		$grid_filter[] = array('field'=>'prod_text', 'type'=>'list', 'value'=>specWbMrfoxy_tool_getProdNodes($promo_record['prod_code'])) ;
	}
	if( $promo_record['store_code'] ) {
		$grid_filter[] = array('field'=>'store_text', 'type'=>'list', 'value'=>specWbMrfoxy_tool_getStoreNodes($promo_record['store_code'])) ;
	}
	$json = specWbMrfoxy_promo_getGrid(array('filter_isProd'=>1, 'filter_isBenchmarkEligible'=>1, 'filter_country'=>$promo_record['country_code'],'filter'=>json_encode($grid_filter))) ;
	return $json ;
}
function specWbMrfoxy_promo_getSideBillback( $post_data ) {
	global $_opDB ;
	$src_filerecordId = $post_data['filerecord_id'] ;
	
	$ttmp = specWbMrfoxy_promo_getGrid( array(
		'_load_details'=>true,
		'filter_id'=>json_encode(array($src_filerecordId))
	) ) ;
	if( count($ttmp['data']) != 1 ) {
		die() ;
	}
	$promo_record = $ttmp['data'][0] ;
	
	$forward_post = array() ;
	$forward_post['start'] ;
	$forward_post['limit'] ;
	$forward_post['file_code'] = 'ORACLE_PURCHASE' ;
		$filter = array() ;
		$filter['field'] = 'ORACLE_PURCHASE_field_PROMO_CODE' ;
		$filter['type'] = 'string' ;
		$filter['value'] = $promo_record['promo_id'] ;
		$filters[] = $filter ;
	$forward_post['filter'] = json_encode(array($filter)) ;
		$sorter = array() ;
		$sorter['property'] = 'ORACLE_PURCHASE_field_DATE' ;
		$sorter['direction'] = 'DESC' ;
	$forward_post['sort'] = json_encode(array($sorter)) ;
	
	$ttmp = paracrm_data_getFileGrid_data( $forward_post, $auth_bypass=TRUE ) ;
	$paracrm_TAB = $ttmp['data'] ;
	
	$TAB = array() ;
	foreach( $paracrm_TAB as $paracrm_row ) {
		$row = array() ;
		$row['purchase_id'] = $paracrm_row['ORACLE_PURCHASE_field_ID'].'-'.$paracrm_row['ORACLE_PURCHASE_field_LINE_ID'].'-'.$paracrm_row['ORACLE_PURCHASE_field_LINE_IDX'] ;
		$row['purchase_date'] = date('Y-m-d',strtotime($paracrm_row['ORACLE_PURCHASE_field_DATE'])) ;
		$row['purchase_desc'] = $paracrm_row['ORACLE_PURCHASE_field_DESCRIPTION'] ;
		$row['purchase_amount'] = $paracrm_row['ORACLE_PURCHASE_field_AMOUNT_VALUE'] ;
		$TAB[] = $row ;
	}
	
	return array('success'=>true, 'data'=>$TAB) ;
}


function specWbMrfoxy_promo_formEval( $post_data ) {
	global $_opDB ;
	
	$form_data = json_decode($post_data['data'],true) ;
	$resp_data = array() ;
	
	if( $form_data['store_code'] ) {
		$resp_data['store_master'] = specWbMrfoxy_tool_getStoreBrand( $form_data['store_code'] ) ;
	} else {
		$resp_data['store_master'] = '' ;
	}
	
	if( $form_data['prod_code'] ) {
		$resp_data['prod_master'] = specWbMrfoxy_tool_getProdLine( $form_data['prod_code'] ) ;
	} else {
		$resp_data['prod_master'] = '' ;
	}
	
	if( $form_data['country_code'] ) {
		$resp_data['currency'] = specWbMrfoxy_tool_getCountryCurrency( $form_data['country_code'] ) ;
	}
	
	$grid_filter = array() ;
	if( $form_data['prod_code'] ) {
		$grid_filter[] = array('field'=>'prod_text', 'type'=>'list', 'value'=>specWbMrfoxy_tool_getProdNodes($form_data['prod_code'])) ;
	}
	if( $form_data['store_code'] ) {
		$grid_filter[] = array('field'=>'store_text', 'type'=>'list', 'value'=>specWbMrfoxy_tool_getStoreNodes($form_data['store_code'])) ;
	}
	$ttmp = specWbMrfoxy_promo_getGrid(array('filter_isProd'=>1, 'filter_isBenchmarkEligible'=>1, 'filter_country'=>$form_data['country_code'],'filter'=>json_encode($grid_filter))) ;
	$resp_data['gridBenchmark'] = $ttmp['data'];
	
	$resp_data['mechanics_multi'] = array() ;
	$query = "SELECT field_DETAILS_TXT FROM view_bible_PROMO_MECH_entry WHERE treenode_key='MULTI'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$resp_data['mechanics_multi'][] = array('txt'=>$arr[0]) ;
	}
	
	if( $post_data['doSimuGraph'] ) {
	while(TRUE) {
		
		$q_id = 'SellOut Idx A+B' ;
		if( !is_numeric($q_id) ) {
			$query = "SELECT qbook_id FROM qbook WHERE qbook_name LIKE '{$q_id}'";
			$q_id = $_opDB->query_uniqueValue($query) ;
			if( !$q_id ) {
				break ;
			}
		}
		
		if( $form_data['date_start'] && $form_data['date_end'] 
		&& strtotime($form_data['date_start']) < strtotime($form_data['date_end']) ) {} else {
			break ;
		}
		
		$src_filerecord_row = array() ;
		$src_filerecord_row['WORK_PROMO'] = array() ;
		$src_filerecord_row['WORK_PROMO']['field_BRAND'] = $form_data['brand_code'] ;
		$src_filerecord_row['WORK_PROMO']['field_COUNTRY'] = $form_data['country_code'] ;
		$src_filerecord_row['WORK_PROMO']['field_DATE_START'] = $form_data['date_start'] ;
		$src_filerecord_row['WORK_PROMO']['field_DATE_END'] = $form_data['date_end'] ;
		$src_filerecord_row['WORK_PROMO']['field_STORE'] = ($form_data['store_code'] ? $form_data['store_code'] : $form_data['country_code']) ;
		$src_filerecord_row['WORK_PROMO']['field_PROD'] = ($form_data['prod_code'] ? $form_data['prod_code'] : '&') ;
		
		$post_test = array() ;
		$post_test['_action'] = 'queries_qbookTransaction' ;
		$post_test['_subaction'] = 'init' ;
		$post_test['qbook_id'] = $q_id ;
		$json = paracrm_queries_qbookTransaction( $post_test ) ;
		$transaction_id = $json['transaction_id'] ;
		
		$post_test = array() ;
		$post_test['_action'] = 'queries_qbookTransaction' ;
		$post_test['_transaction_id'] = $transaction_id ;
		$post_test['_subaction'] = 'run' ;
		$post_test['qsrc_filerecord_row'] = $src_filerecord_row ;
		$json = paracrm_queries_qbookTransaction( $post_test ) ;
		if( !$json['success'] ) {
			unset($_SESSION['transactions'][$transaction_id]) ;
			break ;
		}

		$post_test = array() ;
		$post_test['_action'] = 'queries_qbookTransaction' ;
		$post_test['_transaction_id'] = $transaction_id ;
		$post_test['_subaction'] = 'res_get' ;
		$post_test['RES_id'] = $json['RES_id'] ;
		$json = paracrm_queries_qbookTransaction( $post_test ) ;
		
		unset($_SESSION['transactions'][$transaction_id]) ;
		
		if( $json['tabs'] && $json['tabs'][1]['RESchart_static'] ) {
			$resp_data['simu_graph'] = array() ;
			$resp_data['simu_graph']['RESchart_static'] = $json['tabs'][1]['RESchart_static'] ;
		}
		
		break ;
	}
	}
	
	if( $post_data['doSkuList'] && $form_data['prod_code'] ) {
		$resp_data['list_sku'] = array() ;
		
		$arr_prodNodes = specWbMrfoxy_tool_getProdNodes($form_data['prod_code']) ;
		$arr_brandEntries = specWbMrfoxy_tool_getBrandEntries($form_data['brand_code']) ;
		$query = "SELECT * FROM view_bible_IRI_PROD_entry WHERE treenode_key IN ".$_opDB->makeSQLlist($arr_prodNodes) ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
			if( !$arr['field_PROD_BRANDCODE'] ) {
				continue ;
			}
			if( !isJsonArr($arr['field_PROD_BRAND']) || count(array_intersect($arr_brandEntries,json_decode($arr['field_PROD_BRAND'],true))) == 0 ) {
				continue ;
			}
			
			// Proceed to "fake join" to retrieve std prices
			$fake_row = array() ;
			$fake_row['WORK_PROMO']['field_DATE_SUPPLY_START'] = $form_data['date_supply_start'] ;
			$fake_row['WORK_PROMO']['field_STORE'] = $form_data['store_code'] ;
			$fake_row['WORK_PROMO_SKU']['field_SKU_CODE'] = $arr['entry_key'] ;
			paracrm_lib_file_joinQueryRecord( 'WORK_PROMO_SKU', $fake_row ) ;
			$join_priceUnit = $fake_row['WORK_PROMO_SKU']['field_PRICE_UNIT'] ;
			if( $join_priceUnit <= 0 ) {
				continue ;
			}
			
			// assemble
			$row_sku = array() ;
			$row_sku['sku_prodean'] = $arr['entry_key'] ;
			$row_sku['sku_code'] = $arr['field_PROD_BRANDCODE'] ;
			$row_sku['sku_desc'] = $arr['field_PROD_TXT'] ;
			$row_sku['sku_uom'] = $arr['field_PROD_UOM'] ;
			$row_sku['sku_pcb'] = $arr['field_PROD_PCB'] ;
			$row_sku['cli_price_unit'] = $join_priceUnit ;
			$resp_data['list_sku'][] = $row_sku ;
		}
	}

	return array('success'=>true,'data'=>$resp_data) ;
}

function specWbMrfoxy_promo_formSubmit( $post_data ) {
	global $_opDB ;
	
	$form_data = json_decode($post_data['data'],true) ;
	
	$arr_ins = array() ;
	//$arr_ins['field_PROMO_CODE'] = 'CODE/TODO' ;
	$arr_ins['field_COUNTRY'] = $form_data['country_code'] ;
	$arr_ins['field_IS_PROD'] = ($form_data['is_prod']=='PROD') ;
	if( !$form_data['_do_bypass'] ) {
		$arr_ins['field_STATUS'] = ($form_data['_do_submit'] ? '10_ENCODED' : '00_STANDBY');
	}
	$arr_ins['field_BRAND'] = $form_data['brand_code'] ;
	$arr_ins['field_DATE_SUPPLY_START'] = $form_data['date_supply_start'] ;
	$arr_ins['field_DATE_SUPPLY_END'] = $form_data['date_supply_end'] ;
	$arr_ins['field_DATE_START'] = $form_data['date_start'] ;
	$arr_ins['field_DATE_END'] = $form_data['date_end'] ;
	$arr_ins['field_STORE'] = $form_data['store_code'] ;
	$arr_ins['field_PROD'] = $form_data['prod_code'] ;
	
	$arr_ins['field_MECH_TYPE'] = $form_data['mechanics_code'] ;
	switch( $form_data['mechanics_code'] ) {
		case 'MULTI' :
			$arr_ins['field_MECH_DETAIL'] = $form_data['mechanics_multi_combo'] ;
			break ;
		case 'MONO_DIS' :
			$arr_ins['field_MECH_DETAIL'] = $form_data['mechanics_mono_discount'].' % discount' ;
			break ;
		case 'MONO_CUT' :
			$arr_ins['field_MECH_DETAIL'] = $form_data['mechanics_mono_pricecut'].' €/£/$ pricecut' ;
			break ;
		case 'BOGOF' :
			$arr_ins['field_MECH_DETAIL'] = 'BOGOF' ;
			break ;
	}
	
	$arr_ins['field_CURRENCY'] = $form_data['currency'] ;
	$arr_ins['field_COST_BILLING'] = $form_data['cost_billing_code'] ;
	$arr_ins['field_COST_STATIC_BB'] = $form_data['cost_static_billback'] ;
	$arr_ins['field_COST_STATIC_DIS'] = $form_data['cost_static_discount'] ;
	$arr_ins['field_COST_FORECAST'] = $form_data['cost_forecast'] ;
	$arr_ins['field_COST_FORECAST_VAR'] = $form_data['cost_forecast_var'] ;
	
	
	// *** Enregistrement mecanique ***
	if( $form_data['mechanics_code'] == 'MULTI' && $form_data['mechanics_multi_combo'] ) {
		$mechanics_multi = $form_data['mechanics_multi_combo'] ;
		$query = "SELECT count(*) FROM view_bible_PROMO_MECH_entry WHERE treenode_key='MULTI' AND field_DETAILS_TXT='$mechanics_multi'" ;
		if( $_opDB->query_uniqueValue($query) == 0 ) {
			$data = array() ;
			$data['field_DETAILS'] = $entry_key = str_replace(' ','_',strtoupper($mechanics_multi)) ;
			$data['field_DETAILS_TXT'] = $mechanics_multi ;
			paracrm_lib_data_insertRecord_bibleEntry( 'PROMO_MECH', $entry_key, 'MULTI', $data ) ;
		}
	}
	
	
	// *** Création code PROMO ID ****
	$store_memo = '' ;
	$store_code = $form_data['store_code'] ;
	while(TRUE) {
		$query = "SELECT field_STOREGROUP_MEMO, treenode_parent_key FROM view_bible_IRI_STORE_tree WHERE treenode_key='$store_code'" ;
		$row = $_opDB->fetch_row($_opDB->query($query)) ;
		if( $row[0] != '' ) {
			$store_memo = $row[0] ;
			break ;
		}
		if( $row[1] != '' ) {
			$store_code = $row[1] ;
			continue ;
		}
		break ;
	}
	
	$prod_memo = '' ;
	$prod_code = $form_data['prod_code'] ;
	while(TRUE) {
		$query = "SELECT field_PRODGROUPMEMO, treenode_parent_key FROM view_bible_IRI_PROD_tree WHERE treenode_key='$prod_code'" ;
		$row = $_opDB->fetch_row($_opDB->query($query)) ;
		if( $row[0] != '' ) {
			$prod_memo = $row[0] ;
			break ;
		}
		if( $row[1] != '' ) {
			$prod_code = $row[1] ;
			continue ;
		}
		break ;
	}
	
	if( TRUE ) {
		unset($promo_id) ;
		$promo_id_base = '' ;
		$promo_id_base.= $form_data['country_code'] ;
		$promo_id_base.= ' ' ;
		$promo_id_base.= ($store_memo ? $store_memo : 'XXXX') ;
		$promo_id_base.= ' ' ;
		$promo_id_base.= ($prod_memo  ? $prod_memo  : 'XXXX') ;
		$promo_id_base.= ' ' ;
		$promo_id_base.= date('Y-m-W',strtotime($form_data['date_supply_start'])) ;
		$promo_id = $promo_id_base ;
		if( !isset($promo_id) ) {
			return array('success'=>false) ;
		}
		$arr_ins['field_PROMO_CODE'] = $promo_id ;
	}
	
	// Comparable promos
	$grid_filter = array() ;
	if( $form_data['prod_code'] ) {
		$grid_filter[] = array('field'=>'prod_text', 'type'=>'list', 'value'=>specWbMrfoxy_tool_getProdNodes($form_data['prod_code'])) ;
	}
	if( $form_data['store_code'] ) {
		$grid_filter[] = array('field'=>'store_text', 'type'=>'list', 'value'=>specWbMrfoxy_tool_getStoreNodes($form_data['store_code'])) ;
	}
	$ttmp = specWbMrfoxy_promo_getGrid(array('filter_isProd'=>1, 'filter_isBenchmarkEligible'=>1, 'filter_country'=>$form_data['country_code'],'filter'=>json_encode($grid_filter))) ;
	$benchmark_arr_ids = array() ;
	foreach( $ttmp['data'] as $test_row ) {
		$benchmark_arr_ids[] = $test_row['_filerecord_id'] ;
	}
	$arr_ins['field_BENCHMARK_ARR_IDS'] = json_encode($benchmark_arr_ids) ;
	
	
	if( $form_data['_filerecord_id'] ) {
		$filerecord_parent_id = paracrm_lib_data_updateRecord_file( 'WORK_PROMO',$arr_ins, $form_data['_filerecord_id']) ;
	} else {
		$filerecord_parent_id = paracrm_lib_data_insertRecord_file( 'WORK_PROMO',0,$arr_ins) ;
	}
	
	foreach( paracrm_lib_data_getFileChildRecords( 'WORK_PROMO_SKU', $filerecord_parent_id ) as $sku_record ) {
		paracrm_lib_data_deleteRecord_file('WORK_PROMO_SKU',$sku_record['filerecord_id']) ;
	}
	if( $form_data['is_prod']=='PROD' && is_array($form_data['promo_sku']) ) {
		foreach( $form_data['promo_sku'] as $sku_row ) {
			$arr_ins = array() ;
			$arr_ins['field_SKU_CODE'] = $sku_row['sku_prodean'] ;
			$arr_ins['field_QTY_FORECAST'] = $sku_row['promo_qty_forecast'] ;
			$arr_ins['field_PRICE_COEF'] = $sku_row['promo_price_coef'] ;
			$arr_ins['field_PRICE_UNIT_CUT'] = $sku_row['promo_price_cut'] ;
			paracrm_lib_data_insertRecord_file( 'WORK_PROMO_SKU',$filerecord_parent_id,$arr_ins) ;
		}
	}
	
	return array('success'=>true) ;
}


function specWbMrfoxy_promo_delete( $post_data ) {
	$src_filerecordId = $post_data['_filerecord_id'] ;
	paracrm_lib_data_deleteRecord_file('WORK_PROMO',$src_filerecordId) ;
	return array('success'=>true) ;
}
function specWbMrfoxy_promo_close( $post_data ) {
	$target_filerecordId = $post_data['_filerecord_id'] ;
	paracrm_lib_data_updateRecord_file( 'WORK_PROMO' , array('field_STATUS'=>'90_END'), $target_filerecordId ) ;
	return array('success'=>true) ;
}
function specWbMrfoxy_promo_csack( $post_data ) {
	$target_filerecordId = $post_data['_filerecord_id'] ;
	paracrm_lib_data_updateRecord_file( 'WORK_PROMO' , array('field_STATUS'=>'30_SCHED'), $target_filerecordId ) ;
	return array('success'=>true) ;
}
function specWbMrfoxy_promo_getRecord( $post_data ) {
	$target_filerecordId = $post_data['_filerecord_id'] ;
	$ttmp = specWbMrfoxy_promo_getGrid( array('_load_details'=>true,'filter_id'=>json_encode(array($target_filerecordId))) ) ;
	if( count($ttmp['data']) == 1 ) {
		return array('success'=>true, 'record'=>$ttmp['data'][0]) ;
	}
	return array('success'=>false) ;
}
function specWbMrfoxy_promo_assignBenchmark( $post_data ) {
	$target_filerecordId = $post_data['_filerecord_id'] ;
	if( !isset($post_data['benchmark_arr_ids']) ) {
		return array('success'=>false) ;
	}
	paracrm_lib_data_updateRecord_file( 'WORK_PROMO' , array('field_BENCHMARK_ARR_IDS'=>$post_data['benchmark_arr_ids']), $target_filerecordId ) ;
	return array('success'=>true) ;
}
function specWbMrfoxy_promo_fetchBenchmark( $post_data ) {
	global $_opDB ;
	
	$q_id = 'Benchmarking' ;
	if( !is_numeric($q_id) ) {
		$query = "SELECT qmerge_id FROM qmerge WHERE qmerge_name LIKE '{$q_id}'";
		$q_id = $_opDB->query_uniqueValue($query) ;
		if( !$q_id ) {
			return array('success'=>false) ;
		}
	}
	
	$arr_saisie = array() ;
	$json = paracrm_queries_mergerTransaction_init( array('qmerge_id'=>$q_id) , $arr_saisie ) ;
	$transaction_id = $json['transaction_id'] ;
	unset($_SESSION['transactions'][$transaction_id]) ;
	
	// replace conditions
	foreach( $arr_saisie['fields_mwhere'] as &$field_mwhere ) {
		if( $field_mwhere['mfield_type'] == 'file' && isJsonArr($post_data['benchmark_arr_ids']) ) {
			$field_mwhere['condition_file_ids'] = $post_data['benchmark_arr_ids'] ;
		}
	}
	unset($field_mwhere) ;
	
	// Exec requete
	$RES = paracrm_queries_process_qmerge($arr_saisie , FALSE ) ;
	
	// Load charts
	$arr_QueryResultChartModel = paracrm_queries_charts_cfgLoad( 'qmerge', $q_id ) ;
	if( !($mixed_queryResultChartModel = paracrm_queries_charts_getMixed( $arr_QueryResultChartModel )) ) {
		return array('success'=>false) ;
	}
	
	// Fetch chart
	$RES_chart = paracrm_queries_charts_getResChart( $RES, $mixed_queryResultChartModel );
	
	return array('success'=>true, 'RESchart_static'=>$RES_chart) ;
}

function specWbMrfoxy_promo_setObsText( $post_data ) {
	$target_filerecordId = $post_data['_filerecord_id'] ;
	$data = json_decode($post_data['data'],true) ;
	
	$map = array() ;
	$map['obs_atl'] = 'field_OBS_ATL' ;
	$map['obs_btl'] = 'field_OBS_BTL' ;
	$map['obs_comment'] = 'field_OBS_COMMENT' ;
	$arr_update = array() ;
	foreach( $map as $src => $dest ) {
		$arr_update[$dest] = $data[$src] ;
	}
	paracrm_lib_data_updateRecord_file( 'WORK_PROMO' , $arr_update, $target_filerecordId ) ;
	return array('success'=>true) ;
}
function specWbMrfoxy_promo_setApproval( $post_data ) {
	$target_filerecordId = $post_data['_filerecord_id'] ;
	$data = json_decode($post_data['data'],true) ;
	
	$current_row = paracrm_lib_data_getRecord_file('WORK_PROMO',$target_filerecordId) ;
	if( !$current_row ) {
		return array('success'=>false) ;
	}
	
	$map = array() ;
	$map['approv_ds'] = 'field_APPROV_DS' ;
	$map['approv_ds_ok'] = 'field_APPROV_DS_OK' ;
	$map['approv_ds_obs'] = 'field_APPROV_DS_OBS' ;
	$map['approv_df'] = 'field_APPROV_DF' ;
	$map['approv_df_ok'] = 'field_APPROV_DF_OK' ;
	$map['approv_df_obs'] = 'field_APPROV_DF_OBS' ;
	$arr_update = array() ;
	foreach( $map as $src => $dest ) {
		$arr_update[$dest] = $data[$src] ;
	}
	paracrm_lib_data_updateRecord_file( 'WORK_PROMO' , $arr_update, $target_filerecordId ) ;
	
	$summary = array() ;
	if( !$current_row['field_APPROV_DS'] && $arr_update['field_APPROV_DS'] ) {
		$summary['approv_ds'] = $data['approv_ds_ok'] ;
	}
	if( !$current_row['field_APPROV_DF'] && $arr_update['field_APPROV_DF'] ) {
		$summary['approv_df'] = $data['approv_df_ok'] ;
	}
	return array( 'success'=>true, 'summary'=>$summary ) ;
}
function specWbMrfoxy_promo_setBaseline( $post_data ) {
	$target_filerecordId = $post_data['_filerecord_id'] ;
	$data = json_decode($post_data['data'],true) ;
	
	$arr_update = array() ;
	$arr_update['field_BASELINE_IN_FORCE'] = ($data['baseline_in_force'] != NULL) ;
	$arr_update['field_BASELINE_IN_VALUE'] = $data['baseline_in_value'] ;
	$arr_update['field_BASELINE_OUT_FORCE'] = ($data['baseline_out_force'] != NULL) ;
	$arr_update['field_BASELINE_OUT_VALUE'] = $data['baseline_out_value'] ;
	
	paracrm_lib_data_updateRecord_file( 'WORK_PROMO' , $arr_update, $target_filerecordId ) ;
	return array('success'=>true) ;
}


function specWbMrfoxy_promo_exportXLS( $post_data ) {
	global $_opDB ;

	$src_filerecordId = $post_data['_filerecord_id'] ;
	$ttmp = specWbMrfoxy_promo_getGrid( array(
		'_load_details'=>true,
		'filter_id'=>json_encode(array($src_filerecordId))
	) ) ;
	if( count($ttmp['data']) != 1 ) {
		die() ;
	}
	$promo_record = $ttmp['data'][0] ;
	
	
	
	
	
	
	
	$app_root = $GLOBALS['app_root'] ;
	$resources_root=$app_root.'/resources' ;
	$templates_dir=$resources_root.'/server/templates' ;
	$inputFileName = $templates_dir.'/'.'WB_MRFOXY_promo_template.xls' ;
	$objReader = PHPExcel_IOFactory::createReader('Excel5');
	$objPHPExcel = $objReader->load($inputFileName);
	
	
	$objPHPExcel->getActiveSheet()->setCellValue('C2', $promo_record['promo_id']);
	$objPHPExcel->getActiveSheet()->setCellValue('C4', $promo_record['country_code'].' - '.$promo_record['country_text']);
	$objPHPExcel->getActiveSheet()->setCellValue('C6', $promo_record['store_text']);
	$objPHPExcel->getActiveSheet()->setCellValue('C8', $promo_record['prod_text']);
	$objPHPExcel->getActiveSheet()->setCellValue('B11', $promo_record['date_start']);
	$objPHPExcel->getActiveSheet()->setCellValue('C11', $promo_record['date_end']);
	$objPHPExcel->getActiveSheet()->setCellValue('B14', $promo_record['cost_billing_code']);
	$objPHPExcel->getActiveSheet()->setCellValue('C14', $promo_record['cost_billing_text']);
	$objPHPExcel->getActiveSheet()->setCellValue('D14', $promo_record['cost_forecast']);
	
	if( $promo_record['promo_sku'] ) {
	$lig = 17 ;
	foreach( $promo_record['promo_sku'] as $sku_record ) {
		if( $sku_record['promo_qty_forecast'] == 0 ) {
			continue ;
		}
		$discount_per_unit = (1-$sku_record['promo_price_coef'])*$sku_record['cli_price_unit'] + $sku_record['promo_price_cut'] ;
		$objPHPExcel->getActiveSheet()->setCellValue('B'.$lig, $sku_record['sku_code']);
		$objPHPExcel->getActiveSheet()->setCellValue('C'.$lig, $sku_record['sku_desc']);
		$objPHPExcel->getActiveSheet()->setCellValue('D'.$lig, $sku_record['cli_price_unit']);
		$objPHPExcel->getActiveSheet()->setCellValue('E'.$lig, $sku_record['promo_qty_forecast']);
		$objPHPExcel->getActiveSheet()->setCellValue('G'.$lig, (1-$sku_record['promo_price_coef']) );
		$objPHPExcel->getActiveSheet()->setCellValue('H'.$lig, $discount_per_unit);
		$objPHPExcel->getActiveSheet()->setCellValue('I'.$lig, ($discount_per_unit * $sku_record['promo_qty_forecast']) );
		$lig++ ;
		if( $lig > 21 ) {
			break ;
		}
	}
	}
	if( $promo_record['cost_forecast_var'] > 0 ) {
		$lig = 21 ;
		$objPHPExcel->getActiveSheet()->setCellValue('B'.$lig, '');
		$objPHPExcel->getActiveSheet()->setCellValue('C'.$lig, '');
		$objPHPExcel->getActiveSheet()->setCellValue('D'.$lig, '');
		$objPHPExcel->getActiveSheet()->setCellValue('E'.$lig, '');
		$objPHPExcel->getActiveSheet()->setCellValue('G'.$lig, '');
		$objPHPExcel->getActiveSheet()->setCellValue('H'.$lig, '');
		$objPHPExcel->getActiveSheet()->setCellValue('I'.$lig, $promo_record['cost_forecast_var']);
	}
	if( ($cost_static = $promo_record['cost_static_billback']+$promo_record['cost_static_discount']) > 0 ) {
		$lig = 25 ;
		$objPHPExcel->getActiveSheet()->setCellValue('I'.$lig, $cost_static);
	}
	
	
	$tmpfilename = tempnam( sys_get_temp_dir(), "FOO");
	
	$objWriter = PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel5');
	$objWriter->save($tmpfilename);
	$objPHPExcel->disconnectWorksheets();
	unset($objPHPExcel) ;

	$filename = 'MrFoxy_.'.$promo_record['promo_id'].'.xls' ;
	header("Content-Type: application/force-download; name=\"$filename\""); 
	header("Content-Disposition: attachment; filename=\"$filename\""); 
	readfile($tmpfilename) ;
	unlink($tmpfilename) ;
	die() ;
}
?>