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
			$ret = specRsiRecouveo_lib_edi_post($_SESSION["login_data"]["userstr"],'upload_COMPTES',$handle) ;
			break ;

		case 'IMPORT_ACC_ADRBOOK' :
			$ret = specRsiRecouveo_lib_edi_post($_SESSION["login_data"]["userstr"],'upload_COMPTES_ADRBOOK',$handle) ;
			break ;

		case 'IMPORT_TXTACTION' :
			$ret = specRsiRecouveo_lib_edi_post($_SESSION["login_data"]["userstr"],'upload_ACCOUNT_TXTACTION',$handle) ;
			break ;

		case 'IMPORT_REC' :
			$ret = specRsiRecouveo_lib_edi_post($_SESSION["login_data"]["userstr"],'upload_FACTURES',$handle) ;
			break ;

		case 'IMPORT_ALLOC' :
			$ret = specRsiRecouveo_lib_edi_post($_SESSION["login_data"]["userstr"],'upload_ACCOUNT_PROPERTIES',$handle) ;
			break ;
		
		case 'IMPORT_ACTION' :
			$ret = specRsiRecouveo_lib_edi_post($_SESSION["login_data"]["userstr"],'upload_ACTION',$handle) ;
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
	
	specRsiRecouveo_lib_autorun_open() ;
	if( $file_model=='SET_ALLOC' ) {
		specRsiRecouveo_lib_scenario_attach() ;
	}
	
	
	return TRUE ;
}








function specRsiRecouveo_copydemo() {
	global $_opDB ;
	
	$domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
	$src_sdomain_id = 'src' ;
	$dst_sdomain_id = 'demo' ;
	
	$current_db = $_opDB->query_uniqueValue("SELECT DATABASE()") ;
	$_opDB->select_db(DatabaseMgr_Base::getBaseDb($domain_id)) ;
	$t = new DatabaseMgr_Sdomain( $domain_id );
	$dst_db = $t->getSdomainDb($dst_sdomain_id) ;
	$_opDB->query("DROP DATABASE {$dst_db}") ;
	$_opDB->query("CREATE DATABASE {$dst_db}") ;
	try {
		$handle = tmpfile() ;
		$t->sdomainDump_export( $src_sdomain_id, $handle ) ;
		fseek($handle,0) ;
		$t->sdomainDump_import( $dst_sdomain_id, $handle ) ;
		fclose($handle) ;
	} catch( Exception $e ) {
		return array('success'=>false) ;
	}
	$_opDB->select_db($current_db) ;
	
	
	$TAB_shifts = array(
		'view_file_FILE' => array('field_DATE_OPEN','field_DATE_LAST'),
		'view_file_FILE_ACTION' => array('field_DATE_SCHED','field_DATE_ACTUAL'),
		'view_file_NOTIFICATION' => array('field_DATE_NOTIFICATION'),
		'view_file_RECORD' => array('field_DATE_LOAD','field_DATE_RECORD','field_DATE_VALUE','field_LETTER_DATE'),
		'view_file_RECORD_LINK' => array('field_DATE_LINK_ON','field_DATE_LINK_OFF')
	);
	
	$query = "SELECT max(DATE(field_DATE_ACTUAL)) FROM view_file_FILE_ACTION" ;
	$max_dateActual = $_opDB->query_uniqueValue($query) ;
	
	$obj_datetime_now = new DateTime(date('Y-m-d')) ;
	$obj_datetime_max = new DateTime($max_dateActual) ;
	$obj_date_interval = date_diff($obj_datetime_now,$obj_datetime_max);
	$days_toShift = (int)$obj_date_interval->format('%a') ;
	
	
	foreach( $TAB_shifts as $tableCode=>$fields ){
		foreach( $fields as $fieldCode ) {
			$query = "UPDATE {$tableCode} 
					SET {$fieldCode} = DATE_ADD({$fieldCode}, INTERVAL {$days_toShift} DAY)
					WHERE DATE({$fieldCode})<>'0000-00-00'" ;
			$_opDB->query($query) ;
		}
	}
	return array('success'=>true) ;
}

?>
