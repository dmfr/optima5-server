<?php

function specDbsLam_upload( $post_data ) {
	if( $_FILES['file_upload'] ) {
		$debug = file_get_contents($_FILES['file_upload']['tmp_name']) ;
		$handle = fopen($_FILES['file_upload']['tmp_name'],"rb") ;
	} elseif( $post_data['file_contents'] ) {
		$debug = $post_data['file_contents'] ;
		$handle = tmpfile() ;
		fwrite($handle,$post_data['file_contents']) ;
		fseek($handle,0) ;
	} else {
		return array('success'=>false) ;
	}
	
	if( $GLOBALS['httpd_log'] ) {
		$filename = $GLOBALS['httpd_log']."/lamUpload_".$post_data['file_model']."_".time().'.txt' ;
		@file_put_contents($filename, $debug) ;
	}
	
	switch( $post_data['file_model'] ) {
		case 'Z086' :
			specDbsLam_upload_ZLORMM086( $handle ) ;
			break ;
		default :
			return array('success'=>false) ;
	}
	fclose($handle) ;
	
	$arr_ins = array() ;
	$arr_ins['field_DATE'] = date('Y-m-d H:i:s') ;
	$arr_ins['field_FILE_MODEL'] = $post_data['file_model'] ;
	paracrm_lib_data_insertRecord_file('LOG_IMPORT',0,$arr_ins) ;
	
	return array('success'=>true) ;
}
function specDbsLam_upload_ZLORMM086( $handle ) {
	global $_opDB ;
	
	$handle_trad = tmpfile() ;
	specDbsLam_upload_lib_separator( $handle, $handle_trad ) ;
	fseek($handle_trad,0) ;
	
	paracrm_lib_dataImport_commit_processHandle( 'file','ZLORMM086', $handle_trad ) ;

	fclose($handle_trad) ;
	
	
	$raw_ZLORMM086 = paracrm_lib_data_getFileRecords('ZLORMM086') ;
	if( count($raw_ZLORMM086) <= 1 ) {
		return ;
	}
	foreach( $raw_ZLORMM086 as &$raw_record ) {
		$record_row = array() ;
		$record_row['ZLORMM086'] = $raw_record ;
		paracrm_lib_file_joinQueryRecord( 'ZLORMM086', $record_row ) ;
		foreach( $record_row['ZLORMM086'] as $mkey=>$mvalue ) {
			$raw_record[$mkey] = $mvalue ;
		}
	}
	unset($raw_record) ;
	
	
	// Sync prods
	$map_rawTOprod = array(
		'MATERIAL'=>'PROD_ID',
		'LAM_DGR'=>'ATR_HAZMAT',
		'LAM_TC'=>'ATR_ENV'
	);
	$arr_prod_boolean = array() ;
	$handle_prod = tmpfile() ;
	fputcsv($handle_prod,array_values($map_rawTOprod)) ;
	foreach( $raw_ZLORMM086 as $raw_record ) {
		if( $arr_prod_boolean[$raw_record['field_MATERIAL']] ) {
			continue ;
		}
		$arr_prod_boolean[$raw_record['field_MATERIAL']] = TRUE ;
		$arr_csv = array() ;
		foreach( $map_rawTOprod as $msrc => $dest ) {
			$mkey = 'field_'.$msrc ;
			$arr_csv[] = $raw_record[$mkey] ;
		}
		fputcsv($handle_prod,$arr_csv) ;
	}
	fseek($handle_prod,0) ;
	paracrm_lib_dataImport_commit_processHandle('bible','PROD',$handle_prod) ;
	fclose($handle_prod) ;
	
	
	// Sync stock, pre HACK LAM_DATEUPDATE
	$query = "LOCK TABLES store_file WRITE, view_file_INV READ" ;
	$_opDB->query($query) ;
	
	$query = "UPDATE store_file SET dsc_is_locked='' WHERE file_code='INV'" ;
	$_opDB->query($query) ;
	
	$date_3days = date('Y-m-d',strtotime('-3 days')) ;
	$arr_3days_filerecordIds = array() ;
	$query = "SELECT filerecord_id FROM view_file_INV WHERE field_LAM_DATEUPDATE >= '$date_3days'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$arr_3days_filerecordIds[] = $arr[0] ;
	}
	if( $arr_3days_filerecordIds ) {
		$sql_3days_filerecordIds = $_opDB->makeSQLlist($arr_3days_filerecordIds) ;
		$query = "UPDATE store_file SET dsc_is_locked='O' WHERE file_code='INV' AND filerecord_id IN {$sql_3days_filerecordIds}" ;
		$_opDB->query($query) ;
	}
	
	$query = "UNLOCK TABLES" ;
	$_opDB->query($query) ;
	
	
	// Sync stock
	$map_rawTOstock = array(
		'DEP_POSICAO'=>'ADR_ID',
		'MATERIAL'=>'PROD_ID',
		'LOTE'=>'BATCH_CODE',
		'QTY_TOTAL'=>'QTY_AVAIL',
		'VENCIMENTO'=>'SPEC_DATELC',
		''=>'LAM_DATEUPDATE'
	);
	$arr_stock_boolean = array() ;
	$handle_stock = tmpfile() ;
	fputcsv($handle_stock,array_values($map_rawTOstock)) ;
	foreach( $raw_ZLORMM086 as $raw_record ) {
		$adr_id = $raw_record['field_DEP_POSICAO'] ;
		if( !paracrm_lib_data_getRecord_bibleEntry('STOCK',$adr_id) ) {
			continue ;
		}
		
		$arr_csv = array() ;
		foreach( $map_rawTOstock as $msrc => $dest ) {
			if( $dest == 'LAM_DATEUPDATE' ) {
				$arr_csv[] = '' ;
				continue ;
			}
			$mkey = 'field_'.$msrc ;
			$arr_csv[] = $raw_record[$mkey] ;
		}
		fputcsv($handle_stock,$arr_csv) ;
	}
	fseek($handle_stock,0) ;
	paracrm_lib_dataImport_commit_processHandle('file','INV',$handle_stock) ;
	fclose($handle_stock) ;
	
	$query = "UPDATE store_file SET dsc_is_locked='' WHERE file_code='INV'" ;
	$_opDB->query($query) ;
	
	return ;
}

function specDbsLam_upload_lib_separator( $handle_in, $handle_out, $separator='|' ) {
	$handle_priv = tmpfile() ;
	while( !feof($handle_in) ) {
		$lig = fgets($handle_in) ;
		$lig = mb_convert_encoding($lig, "UTF-8");
		fwrite($handle_priv,$lig) ;
	}
	
	fseek($handle_priv,0) ;
	$max_occurences = 0 ;
	while( !feof($handle_priv) ) {
		$arr_csv = fgetcsv($handle_priv,0,$separator) ;
		if( count($arr_csv) > $max_occurences ) {
			$max_occurences = count($arr_csv) ;
		}
	}
	
	fseek($handle_priv,0) ;
	$strip_first = TRUE ;
	$strip_last = TRUE ;
	while( !feof($handle_priv) ) {
		$arr_csv = fgetcsv($handle_priv,0,$separator) ;
		if( count($arr_csv) != $max_occurences ) {
			continue ;
		}
		if( reset($arr_csv) ) {
			$strip_first = FALSE ;
		}
		if( end($arr_csv) ) {
			$strip_last = FALSE ;
		}
	}
	
	$is_first = TRUE ;
	
	fseek($handle_priv,0) ;
	while( !feof($handle_priv) ) {
		$arr_csv = fgetcsv($handle_priv,0,$separator) ;
		if( count($arr_csv) != $max_occurences ) {
			continue ;
		}
		if( $strip_first ) {
			array_shift($arr_csv) ;
		}
		if( $strip_last ) {
			array_pop($arr_csv) ;
		}
		foreach( $arr_csv as &$item ) {
			$item = trim($item) ;
		}
		unset($item) ;
		if( $is_first ) {
			$arr_header = $arr_csv ;
			$is_first = FALSE ;
		} elseif($arr_csv == $arr_header) {
			continue ;
		}
		fputcsv($handle_out,$arr_csv) ;
	}
	
	fclose($handle_priv) ;
}

?>