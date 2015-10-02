<?php

function specDbsEmbralam_upload( $post_data ) {
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
	
	$filename = "/var/log/apache2/lamUpload_".$post_data['file_model']."_".time().'.txt' ;
	@file_put_contents($filename, $debug) ;
	
	switch( $post_data['file_model'] ) {
		case 'Z086' :
			specDbsEmbralam_upload_ZLORMM086( $handle ) ;
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
function specDbsEmbralam_upload_ZLORMM086( $handle ) {
	$handle_trad = tmpfile() ;
	specDbsEmbralam_upload_lib_separator( $handle, $handle_trad ) ;
	fseek($handle_trad,0) ;
	
	$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() );
	$t->sdomainDefine_dropFile( DatabaseMgr_Sdomain::dbCurrent_getSdomainId(), 'ZLORMM086' ) ;
	
	paracrm_lib_dataImport_commit_processHandle( 'file','ZLORMM086', $handle_trad ) ;
	
	fclose($handle_trad) ;
	
	
	// Sync prods
	
	// Sync stock
	
}

function specDbsEmbralam_upload_lib_separator( $handle_in, $handle_out, $separator='|' ) {
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