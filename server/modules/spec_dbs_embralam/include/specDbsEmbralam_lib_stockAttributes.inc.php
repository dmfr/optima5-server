<?php

function specDbsEmbralam_lib_stockAttributes_getStockAttributes() {
	if( isset($GLOBALS['cache_specDbsEmbralam_lib_stockAttributes']['stockAttributes']) ) {
		return $GLOBALS['cache_specDbsEmbralam_lib_stockAttributes']['stockAttributes'] ;
	}
	
	// Model
	$attributes = array(
		'mkey' => '',
		'bible_code'=> '',
		'atr_txt' => '',
		'STOCK_fieldcode' => '',
		'PROD_fieldcode' => '',
		'cfg_is_optional' => NULL,
		'cfg_is_hidden' => NULL,
		'cfg_is_editable' => NULL,
		'cfg_is_mismatch' => NULL
	);
	
	// preload map bibles PROD STOCK
	$ttmp = paracrm_data_getBibleCfg(array('bible_code'=>'STOCK')) ;
	$defineBible_STOCK = $ttmp['data'] ;
	$ttmp = paracrm_data_getBibleCfg(array('bible_code'=>'PROD')) ;
	$defineBible_PROD = $ttmp['data'] ;
	
	$TAB = array() ;
	$ttmp = paracrm_data_getBibleGrid(array('bible_code'=>'ATR')) ;
	foreach( $ttmp['data'] as $ATR_entry ) {
		// Verif existence du champ dans les bibles PROD STOCK 
		unset($PROD_fieldcode,$STOCK_fieldcode) ;
		foreach( $defineBible_PROD['entry_fields'] as $entryField_obj ) {
			if( $entryField_obj['entry_field_type'] == 'link' && $entryField_obj['entry_field_linkbible'] == $ATR_entry['field_BIBLE_CODE'] ) {
				$PROD_fieldcode = $entryField_obj['entry_field_code'] ;
				break ;
			}
		}
		foreach( $defineBible_STOCK['entry_fields'] as $entryField_obj ) {
			if( $entryField_obj['entry_field_type'] == 'link' && $entryField_obj['entry_field_linkbible'] == $ATR_entry['field_BIBLE_CODE'] ) {
				$STOCK_fieldcode = $entryField_obj['entry_field_code'] ;
				break ;
			}
		}
		if( !isset($PROD_fieldcode,$STOCK_fieldcode) ) {
			// BAD FIELD !
			continue ;
		}
		
		$TAB[] = array(
			'_sort' => $ATR_entry['field_ATR_IDX'],
			'mkey' => 'atr_'.$ATR_entry['field_BIBLE_CODE'],
			'bible_code'=> $ATR_entry['field_BIBLE_CODE'],
			'atr_txt' => $ATR_entry['field_ATR_TXT'],
			'STOCK_fieldcode' => $STOCK_fieldcode,
			'PROD_fieldcode' => $PROD_fieldcode,
			'cfg_is_optional' => $ATR_entry['field_CFG_IS_OPTIONAL'],
			'cfg_is_hidden' => $ATR_entry['field_CFG_IS_HIDDEN'],
			'cfg_is_editable' => $ATR_entry['field_CFG_IS_EDITABLE'],
			'cfg_is_mismatch' => $ATR_entry['field_CFG_IS_MISMATCH']
		);
	}
	usort($TAB, create_function('$a,$b','return ($a[\'_sort\'] - $b[\'_sort\']) ;'));
	return ($GLOBALS['cache_specDbsEmbralam_lib_stockAttributes']['stockAttributes'] = $TAB) ;
}

?>