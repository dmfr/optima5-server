<?php

function specDbsTracy_reportList( $post_data ) {
	global $_opDB ;
	
	$TAB = array() ;
	$TAB[] = array('id'=>'RCL_VL02NPOD','text'=>'RCL_VL02NPOD') ;
	$TAB[] = array('id'=>'RCL_VL02NAWB','text'=>'RCL_VL02NAWB') ;
	
	$query = "SELECT qsql_id, qsql_name 
		FROM qsql JOIN input_query_src ON input_query_src.target_qsql_id = qsql.qsql_id
		ORDER BY qsql_name" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$TAB[] = array('id'=>'QSQL::'.$arr[0],'text'=>'QSQL / '.$arr[1]) ;
	}
	
	return array('success'=>true, 'data'=>$TAB) ;
}


function specDbsTracy_report( $post_data ) {
	$form_data = json_decode($post_data['data'],true) ;
	
	// Specs
	switch( $form_data['file_model'] ) {
		case 'RCL_VL02NPOD' :
			$csv_buffer = specDbsTracy_report_RCL_VL02NPOD_tmp($form_data) ;
			break ;
		case 'RCL_VL02NAWB' :
			$csv_buffer = specDbsTracy_report_RCL_VL02NAWB_tmp($form_data) ;
			break ;
		default :
			if( strpos($form_data['file_model'],'QSQL::')===0 ) {
				$ttmp = explode('::',$form_data['file_model']) ;
				$qsql_id = $ttmp[1] ;
				specDbsTracy_report_qsql($qsql_id,$form_data) ;
				die() ;
			}
			return array('success'=>false);
	}
	
	$filename = 'OP5report_TRACY_.'.$form_data['file_model'].'_'.time().'.'.'csv' ;
	if( $xml_filename ) {
		$filename = $xml_filename ;
	}
	header("Content-Type: application/force-download; name=\"$filename\""); 
	header("Content-Disposition: attachment; filename=\"$filename\""); 
	echo $csv_buffer ;
	die() ;
}
function specDbsTracy_report_qsql( $qsql_id, $form_data ) {
	global $_opDB ;
	
	$query = "SELECT * FROM qsql WHERE qsql_id='{$qsql_id}'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		return array('success'=>false) ;
	}
	$arr = $_opDB->fetch_assoc($result) ;
	$qsql_name = preg_replace("/[^a-zA-Z0-9]/", "", $arr['qsql_name']) ;
	$sql_querystring = $arr['sql_querystring'] ;
	
	$TAB = paracrm_queries_qsql_lib_exec($sql_querystring,$is_rw=FALSE,$auth_bypass=TRUE,$vars=$form_data) ;
	
	$objPHPExcel = paracrm_queries_xls_build( $TAB, NULL ) ;
	if( !$objPHPExcel ) {
		die() ;
	}
	
	$tmpfilename = tempnam( sys_get_temp_dir(), "FOO");
	$objWriter = PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel2007');
	$objWriter->save($tmpfilename);
	$objPHPExcel->disconnectWorksheets();
	unset($objPHPExcel) ;
	
	$filename = 'OP5report_TRACY_.'.$qsql_name.'_'.time().'.'.'xlsx' ;
	header("Content-Type: application/force-download; name=\"$filename\""); 
	header("Content-Disposition: attachment; filename=\"$filename\""); 
	readfile($tmpfilename) ;
	unlink($tmpfilename) ;
	die() ;
}


function specDbsTracy_report_RCL_VL02NPOD_tmp( $form_data, $use_log=FALSE ) {
	global $_opDB ;
	$date_now = date('Y-m-d H:i:s') ;

	$json = specDbsTracy_order_getRecords(array('filter_archiveIsOn'=>1,'filter_socCode'=>'ACL')) ;
	$csv_buffer = '' ;
	foreach( $json['data'] as $rowOrder ) {
		foreach( $rowOrder['steps'] as $rowOrderStep ) {
			if( !$rowOrderStep['status_is_ok'] || $rowOrderStep['step_code']!='90_POD' ) {
				continue ;
			}
			if( $rowOrderStep['date_actual'] >= $form_data['date_start'] 
				&& $rowOrderStep['date_actual'] <= $form_data['date_end'] ) {
				
				if( $use_log ) {
					$query = "SELECT count(*) FROM view_file_Z_ACL180612_LOG WHERE field_QUERY_CODE='POD' AND field_LINK_FILERECORD_ID='{$rowOrder['order_filerecord_id']}'" ;
					if( $_opDB->query_uniqueValue($query) > 0 ) {
						continue ;
					}
					$arr_ins = array() ;
					$arr_ins['field_QUERY_CODE'] = 'POD' ;
					$arr_ins['field_LINK_FILERECORD_ID'] = $rowOrder['order_filerecord_id'] ;
					$arr_ins['field_EXPORT_DATE'] = $date_now ;
					paracrm_lib_data_insertRecord_file( 'Z_ACL180612_LOG' , 0 , $arr_ins ) ;
				}
				
				$csv_buffer.= $rowOrder['id_dn'].';'.date('d.m.Y',strtotime($rowOrderStep['date_actual'])).';'.date('H:i',strtotime($rowOrderStep['date_actual']))."\r\n" ;
			}
		}
		
	}
	return $csv_buffer ;
}
function specDbsTracy_report_RCL_VL02NAWB_tmp( $form_data, $use_log=FALSE ) {
	global $_opDB ;
	$date_now = date('Y-m-d H:i:s') ;

	$csv_buffer = '' ;
	$query = "SELECT c.field_ID_DN, t.field_FLIGHT_AWB, c.filerecord_id
				FROM view_file_CDE c, view_file_TRSPT_CDE tc, view_file_TRSPT t
				WHERE c.filerecord_id = tc.field_FILE_CDE_ID AND tc.field_LINK_IS_CANCEL='0'
				AND tc.filerecord_parent_id = t.filerecord_id
				AND c.field_ID_SOC='ACL' AND t.field_FLIGHT_AWB<>'' AND DATE(t.field_DATE_CREATE) BETWEEN '{$form_data['date_start']}' AND '{$form_data['date_end']}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) !=  FALSE ) {
		$order_filerecord_id = $arr[2] ;
		
		if( $use_log ) {
			$query = "SELECT count(*) FROM view_file_Z_ACL180612_LOG WHERE field_QUERY_CODE='AWB' AND field_LINK_FILERECORD_ID='{$order_filerecord_id}'" ;
			if( $_opDB->query_uniqueValue($query) > 0 ) {
				continue ;
			}
			$arr_ins = array() ;
			$arr_ins['field_QUERY_CODE'] = 'AWB' ;
			$arr_ins['field_LINK_FILERECORD_ID'] = $order_filerecord_id ;
			$arr_ins['field_EXPORT_DATE'] = $date_now ;
			paracrm_lib_data_insertRecord_file( 'Z_ACL180612_LOG' , 0 , $arr_ins ) ;
		}
		
		$csv_buffer.= $arr[0].';'.$arr[1]."\r\n" ;
	}
	
	return $csv_buffer ;
}










function specDbsTracy_upload( $post_data ) {
	global $_opDB ;
	
	$handle = fopen($_FILES['file_upload']['tmp_name'],"rb") ;
	$file_model = $post_data['file_model'] ;
	
	// Specs
	switch( $file_model ) {
		case 'DATAIMPORT_INPUTPODLTA' :
			$ret = specDbsTracy_upload_DATAIMPORT($handle,'INPUT_PODLTA') ;
			break ;
		default :
			return array('success'=>false);
	}
	
	return array('success'=>$ret) ;
}

function specDbsTracy_upload_DATAIMPORT( $handle, $file_code ) {
	rewind($handle) ;
	$handle = paracrm_lib_dataImport_preHandle($handle) ;
	rewind($handle) ;
	paracrm_lib_dataImport_commit_processHandle( 'file', $file_code, $handle ) ;
	return true ;
}






$GLOBALS['__specDbsTracy_tmpClone_URL'] = '' ;

function specDbsTracy_upload_tmpCloneActiveGet($post_data) {
	global $_opDB ;
	
	$handle = tmpfile() ;
	
	$arr_tables = array('store_file_CDE','store_file_HAT','store_file_TRSPT') ;
	foreach( $arr_tables as $table_base ) {
		$arr_db_tabs = array() ;
		$query = "SHOW FULL TABLES LIKE '{$table_base}%'" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE )
		{
			if( $arr[1] && $arr[1] != 'BASE TABLE' ) {
				continue ;
			}
			$arr_db_tabs[] = $arr[0] ;
		}
		
		foreach($arr_db_tabs as $db_tab) {
			fwrite($handle,"***BEGIN_TABLE**{$db_tab}***\r\n") ;
		
			$arr_columns = array() ;
			$query = "SHOW COLUMNS FROM $db_tab" ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_row($result)) != FALSE )
			{
				$arr_columns[] = $arr[0] ;
			}
			fwrite($handle,implode(',',$arr_columns)."\r\n") ;

			if( $db_tab==$table_base ) {
				$query = "SELECT t.* FROM $table_base t
							WHERE t.field_ARCHIVE_IS_ON_int='0'" ;
			} else {
				$query = "SELECT t.* FROM $db_tab t
							JOIN $table_base p ON p.filerecord_id=t.filerecord_parent_id
							WHERE p.field_ARCHIVE_IS_ON_int='0'" ;
			}
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_row($result)) != FALSE )
			{
				DatabaseMgr_Util::my_fputcsv( $handle , $arr , ',' ,'"') ;
			}
		}
	}
	
	fseek($handle,0) ;
	$binary = stream_get_contents($handle) ;
	fclose($handle) ;
	return array('success'=>true,'data'=>$binary) ;
}

function specDbsTracy_upload_tmpCloneActiveFetch($post_data) {
	global $_opDB ;
	if( !$GLOBALS['__OPTIMA_TEST'] ) {
		return array('success'=>false);
	}
	if( !$GLOBALS['__specDbsTracy_tmpClone_URL'] ) {
		return array('success'=>false);
	}
	
	$binary_csv = file_get_contents($GLOBALS['__specDbsTracy_tmpClone_URL']) ;
	if( !$binary_csv ) {
		return array('success'=>false);
	}
	
	
	$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() );
	$current_db = $t->getSdomainDb( DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ) ;
	
	$handle = tmpfile() ;
	fwrite($handle,$binary_csv) ;
	fseek($handle,0) ;
	DatabaseMgr_Util::feed_DB( $handle, $current_db, FALSE, TRUE ) ;  // restauration complete
	fclose($handle) ;
	
	return array('success'=>true);
}

?>
