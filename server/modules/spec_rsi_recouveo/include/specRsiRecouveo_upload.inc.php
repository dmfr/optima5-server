<?php
function specRsiRecouveo_upload( $post_data ) {
	global $_opDB ;
	
	$handle = fopen($_FILES['file_upload']['tmp_name'],"rb") ;
	$file_model = $post_data['file_model'] ;
	
	// Specs
	switch( $file_model ) {
		case 'CIC_BANK' :
			$ret = specDbsTracy_upload_CICBANK_tmp($handle) ;
			break ;
			
		case 'IMPORT_ACC' :
		case 'IMPORT_REC' :
		case 'SET_ALLOC' :
			$ret = specRsiRecouveo_upload_EDI_IMPORT($handle,$file_model) ;
			break ;
		
		default :
			return array('success'=>false);
	}
	
	return array('success'=>$ret) ;
}

function specDbsTracy_upload_CICBANK_tmp( $handle ) {
	global $_opDB ;
	
	$str = stream_get_contents($handle) ;
	$str = mb_convert_encoding($str, "UTF-8");
	
	$handle_utf = tmpfile() ;
	fwrite($handle_utf,$str) ;
	fseek($handle_utf,0) ;
	
	$my_sdomain = $_POST['_sdomainId'] ;
	if( $my_sdomain ) {
		$_opDB->select_db( $GLOBALS['mysql_db'].'_'.'edi') ;
	}
	$data_type = 'file' ;
	$store_code = 'IN_CALOON_CASH' ;
	$ret = paracrm_lib_dataImport_commit_processHandle( $data_type, $store_code, $handle_utf ) ;
	if( !$ret ) {
		return FALSE ;
	}
	
	$ret = paracrm_queries_direct( array(
		'q_type' => 'qsql',
		'q_id' => 'Load Caloon Banque'
	), $is_rw=TRUE ) ;
	
	$my_sdomain = $_POST['_sdomainId'] ;
	if( $my_sdomain ) {
		$_opDB->select_db( $GLOBALS['mysql_db'].'_'.$my_sdomain) ;
	}
	
	paracrm_queries_direct( array(
		'q_type' => 'qsql',
		'q_id' => 'Bank : Classif types'
	), $is_rw=true ) ;
	
	fclose($handle_utf) ;
	return TRUE ;
}





function specRsiRecouveo_upload_EDI_IMPORT( $handle, $file_model ) {
	global $_opDB ;
	
	$handle = paracrm_lib_dataImport_preHandle($handle) ;
	
	$my_sdomain = $_POST['_sdomainId'] ;
	if( $my_sdomain ) {
		$_opDB->select_db( $GLOBALS['mysql_db'].'_'.'edi') ;
	}
	$data_type = 'file' ;
	$store_code = $file_model ;
	$ret = paracrm_lib_dataImport_commit_processHandle( $data_type, $store_code, $handle ) ;
	if( !$ret ) {
		return FALSE ;
	}
	
	
	switch( $file_model ) {
		case 'IMPORT_ACC' :
			$q_id = 'IMPORT Comptes' ;
			break ;
		case 'IMPORT_REC' :
			$q_id = 'IMPORT Factures' ;
			break ;
		case 'SET_ALLOC' :
			$q_id = 'IMPORT Set alloc' ;
			break ;
		default :
			$q_id = NULL ;
			break ;
	}
	if( $q_id ) {
		$ret = paracrm_queries_direct( array(
			'q_type' => 'qsql',
			'q_id' => $q_id
		), $is_rw=TRUE ) ;
	}
	
	
	$my_sdomain = $_POST['_sdomainId'] ;
	if( $my_sdomain ) {
		$_opDB->select_db( $GLOBALS['mysql_db'].'_'.$my_sdomain) ;
	}
	// specRsiRecouveo_lib_autorun_closeEnd() ;
	specRsiRecouveo_lib_autorun_open() ;
	specRsiRecouveo_lib_autorun_manageDisabled() ;
	specRsiRecouveo_lib_autorun_adrbook() ;
	if( $file_model=='SET_ALLOC' ) {
		specRsiRecouveo_lib_scenario_attach() ;
	}
	
	
	return TRUE ;
}




?>