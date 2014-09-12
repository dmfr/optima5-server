<?php

function WB_MRFOXY_ORACLE_ftp_procSALES( $handle_in, $handle_out ) {
	$header = fgetcsv($handle_in) ;
	if( !$header ) {
		return ;
	}
	$ITEM_NUMBER_idx = array_search('ITEM_NUMBER',$header) ;
	$UOM_idx = array_search('UOM',$header) ;
	$QTY_idx = array_search('QTY',$header) ;
	$PRICE_idx = array_search('PRICE',$header) ;
	fputcsv($handle_out,$header) ;
	
	while( !feof($handle_in) ) {
		$arr_csv = fgetcsv($handle_in) ;
		if( !$arr_csv ) {
			continue ;
		}
		
		if( $arr_csv[$UOM_idx] == 'CS' ) {
			$PROD_entryKey = $arr_csv[$ITEM_NUMBER_idx] ;
			$PROD_entryRecord = paracrm_lib_data_getRecord_bibleEntry('IRI_PROD',$PROD_entryKey) ;
			if( $PROD_entryRecord == NULL ) {
				continue ;
			}
			$PROD_pcb = $PROD_entryRecord['field_PROD_PCB'] ;
			if( $PROD_pcb == NULL ) {
				continue ;
			}
			$arr_csv[$PRICE_idx] = $arr_csv[$PRICE_idx] / $PROD_pcb ;
			$arr_csv[$QTY_idx] = $arr_csv[$QTY_idx] * $PROD_pcb ;
			$arr_csv[$UOM_idx] = 'EA' ;
		}
		
		fputcsv($handle_out,$arr_csv) ;
	}
}

?>