<?php

function WB_MRFOXY_ORACLE_ftp_procPRICES( $handle_in, $handle_out ) {
	$header = fgetcsv($handle_in) ;
	$ACCOUNT_NUMBER_idx = array_search('ACCOUNT_NUMBER',$header) ;
	$ACCOUNT_NUMBER_treenode_idx = array_search('ACCOUNT_NUMBER_treenode',$header) ;
	$ITEM_NO_idx = array_search('ITEM_NO',$header) ;
	$ORIG_PL_PRICE_idx = array_search('ORIG_PL_PRICE',$header) ;
	$ORIG_PL_UOM_idx = array_search('ORIG_PL_UOM',$header) ;
	fputcsv($handle_out,$header) ;
	
	while( !feof($handle_in) ) {
		$arr_csv = fgetcsv($handle_in) ;
		
		$STORE_entryKey = $arr_csv[$ACCOUNT_NUMBER_idx] ;
		$STORE_entryRecord = paracrm_lib_data_getRecord_bibleEntry('IRI_STORE',$STORE_entryKey) ;
		if( $STORE_entryRecord == NULL ) {
			continue ;
		}
		$STORE_treenodeKey = $STORE_entryRecord['treenode_key'] ;
		if( $STORE_treenodeKey == NULL ) {
			continue ;
		}
		$arr_csv[$ACCOUNT_NUMBER_treenode_idx] = $STORE_treenodeKey ;
		
		if( $arr_csv[$ORIG_PL_UOM_idx] == 'CS' ) {
			$PROD_entryKey = $arr_csv[$ITEM_NO_idx] ;
			$PROD_entryRecord = paracrm_lib_data_getRecord_bibleEntry('IRI_PROD',$PROD_entryKey) ;
			if( $PROD_entryRecord == NULL ) {
				continue ;
			}
			$PROD_pcb = $PROD_entryRecord['field_PROD_PCB'] ;
			if( $PROD_pcb == NULL ) {
				continue ;
			}
			$arr_csv[$ORIG_PL_PRICE_idx] = $arr_csv[$ORIG_PL_PRICE_idx] / $PROD_pcb ;
			$arr_csv[$ORIG_PL_UOM_idx] = 'EA' ;
		}
		
		fputcsv($handle_out,$arr_csv) ;
	}
}

?>