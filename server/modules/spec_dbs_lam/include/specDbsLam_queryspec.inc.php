<?php

function specDbsLam_queryspec($post_data) {
	global $_opDB ;
	
	if( isset($post_data['exportXls']) ) {
		unset($post_data['exportXls']) ;
		$ttmp = specDbsLam_queryspec($post_data) ;
		
		
		$worksheet = $ttmp['data'] ;
		
		
		$server_root = $GLOBALS['server_root'] ;
		include("$server_root/include/xlsxwriter.class.php");
		$header = array() ;
		foreach( $worksheet['columns'] as $column ) {
			switch( $col['dataType'] ) {
				case 'int' :
					$header[$column['text']] = 'int' ;
					break ;
				default :
					$header[$column['text']] = 'string' ;
					break ;
			}
		}
		$writer = new XLSXWriter();
		$writer->writeSheetHeader('Sheet1', $header );//optional
		foreach( $worksheet['data'] as $record ) {
			$row = array() ;
			foreach( $worksheet['columns'] as $column ) {
				$value = $record[$column['dataIndex']] ;
				$row[] = $value ;
			}
			$writer->writeSheetRow('Sheet1', $row );
		}
		$tmpfilename = tempnam( sys_get_temp_dir(), "FOO");
		$writer->writeToFile($tmpfilename);
		
		
		
		
		$filename = 'DbsLam_Query'.'_'.time().'.xlsx' ;
		header("Content-Type: application/force-download; name=\"$filename\""); 
		header("Content-Disposition: attachment; filename=\"$filename\""); 
		readfile($tmpfilename) ;
		unlink($tmpfilename) ;
		die() ;
	}
	
	switch( $post_data['queryspec_code'] ) {
		case 'SAFRAN_TRANSFERFLOW' :
			return array('success'=>true, 'data'=>specDbsLam_queryspec_lib_SAFRAN_TRANSFERFLOW()) ;
		case 'SAFRAN_MBD_OT' :
			return array('success'=>true, 'data'=>specDbsLam_queryspec_lib_SAFRAN_MBD_OT()) ;
		default :
			if( $post_data['queryspec_code'] ) {
				return array('success'=>false) ;
			}
			sleep(1) ;
			break ;
	}
	
	$TAB = array(
		array('queryspec_code'=>'SAFRAN_TRANSFERFLOW', 'queryspec_title'=>'Safran Transfer Flow'),
		array('queryspec_code'=>'SAFRAN_MBD_OT', 'queryspec_title'=>'MBD OT Model')
	) ;
	return array('success'=>true,'data'=>$TAB) ;
}

function specDbsLam_queryspec_lib_SAFRAN_TRANSFERFLOW() {
	global $_opDB ;
	
	$data = array() ;

	$query = "SELECT * FROM view_file_STOCK" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		//print_r($arr) ;
		//continue ;
		$whse_code = substr($arr['field_ADR_ID'],0,3) ;
		switch( $whse_code ) {
			case 'TMP' :
				$treenode_key = $_opDB->query_uniqueValue("SELECT treenode_key FROM view_bible_ADR_entry WHERE entry_key='{$arr['field_ADR_ID']}'") ;
				while( $treenode_key != 'TMP' && $treenode_parent_key != 'TMP' ) {
					$treenode_parent_key = $_opDB->query_uniqueValue("SELECT treenode_parent_key FROM view_bible_ADR_tree WHERE treenode_key='{$treenode_key}'");
					if( $treenode_parent_key == 'TMP' ) {
						break ;
					}
					$treenode_key = $treenode_parent_key ;
				}
				$whse_bin = substr($treenode_key,4) ;
				break ;
				
			default :
				$whse_bin = substr($arr['field_ADR_ID'],4) ;
				break ;
		}
		
		$query = "SELECT * FROM view_bible_PROD_entry WHERE entry_key='{$arr['field_PROD_ID']}'" ;
		$res_prod = $_opDB->query($query) ;
		$arr_prod = $_opDB->fetch_assoc($res_prod) ;
		
		$row = array(
			'soc_code' => substr($arr['field_PROD_ID'],0,3),
			'whse_code' => substr($arr['field_ADR_ID'],0,3),
			'atr_DIV' => $arr['field_ATR_DIV'],
			'atr_ES' => $arr['field_ATR_ES'],
			'atr_STKTYPE' => $arr['field_ATR_STKTYPE'],
			'atr_SW' => $arr['field_ATR_SW'],
			'atr_STOTYPE' => $arr['field_ATR_STOTYPE'],
			'adr_id_parent' => $whse_bin,
			'adr_id_sub' => '',
			'atr_BINTYPE' => ( substr($arr['field_ADR_ID'],0,3) == 'MIT' ? 'EC2/X' : '' ),
			'stk_prod' => substr($arr['field_PROD_ID'],4),
			'stk_prod_desc' => $arr_prod['field_PROD_TXT'],
			'stk_spec_batch' => $arr['field_SPEC_BATCH'],
			'stk_spec_sn' => $arr['field_SPEC_SN'],
			'stk_spec_datelc' => ($arr['field_SPEC_DATELC'] && $arr['field_SPEC_DATELC']!='0000-00-00 00:00:00' ?substr($arr['field_SPEC_DATELC'],0,10) : ''),
			'stk_qty' => (float)($arr['field_QTY_AVAIL']+$arr['field_QTY_OUT'])
		) ;
		
		if( $arr_prod['field_SPEC_IS_SN'] == 1 ) {
			$row['stk_prod_spec'] = 'SN' ;
		} elseif( $arr_prod['field_SPEC_IS_BATCH'] == 1 ) {
			$row['stk_prod_spec'] = 'BATCH' ;
		} else {
			$row['stk_prod_spec'] = 'BANAL' ;
		}
		
		if( substr($arr['field_ADR_ID'],0,3) == 'MIT' ) {
			unset($arr_mvt) ;
			$stk_filerecord_id = $arr['filerecord_id'] ;
			while( TRUE ) {
				$query = "SELECT mvtstep.*, mvt.*, mvt.filerecord_id AS mvt_filerecord_id FROM view_file_MVT_STEP mvtstep 
						INNER JOIN view_file_MVT mvt ON mvt.filerecord_id = mvtstep.filerecord_parent_id
						WHERE mvtstep.field_COMMIT_FILE_STOCK_ID='{$stk_filerecord_id}' AND field_STATUS_IS_OK='1'" ;
				$res_mvt = $_opDB->query($query) ;
				$arr_mvt = $_opDB->fetch_assoc($res_mvt) ;
				if( !$arr_mvt || substr($arr_mvt['field_STEP_CODE'],0,1)=='T' ) {
					break ;
				}
				$stk_filerecord_id = $arr_mvt['field_FILE_STOCK_ID'] ;
				unset($arr_mvt) ;
				continue ;
			}
			if( $arr_mvt ) {
				$row['mvt_step'] = 'T07_DONE' ;
				$row['mvt_commit_date'] = $arr_mvt['field_COMMIT_DATE'] ;
				
				$query = "SELECT * FROM view_file_TRANSFER_LIG tl JOIN view_file_TRANSFER t ON t.filerecord_id=tl.filerecord_parent_id WHERE field_FILE_MVT_ID='{$arr_mvt['mvt_filerecord_id']}'" ;
				$res_tl = $_opDB->query($query) ;
				$arr_tl = $_opDB->fetch_assoc($res_tl) ;
				$row['mvt_doc'] = $arr_tl['field_TRANSFER_TXT'] ;
			}
		} else {
			$query = "SELECT mvtstep.*, mvt.*, mvt.filerecord_id AS mvt_filerecord_id FROM view_file_MVT_STEP mvtstep 
					INNER JOIN view_file_MVT mvt ON mvt.filerecord_id = mvtstep.filerecord_parent_id
					WHERE mvtstep.field_FILE_STOCK_ID='{$arr['filerecord_id']}' AND field_STATUS_IS_OK<>'1'" ;
			$res_mvt = $_opDB->query($query) ;
			$arr_mvt = $_opDB->fetch_assoc($res_mvt) ;
			if( $arr_mvt ) {
				$row['mvt_step'] = $arr_mvt['field_STEP_CODE'] ;
				
				$query = "SELECT * FROM view_file_TRANSFER_LIG tl JOIN view_file_TRANSFER t ON t.filerecord_id=tl.filerecord_parent_id WHERE field_FILE_MVT_ID='{$arr_mvt['mvt_filerecord_id']}'" ;
				$res_tl = $_opDB->query($query) ;
				$arr_tl = $_opDB->fetch_assoc($res_tl) ;
				if( $arr_tl['field_STATUS_IS_REJECT'] == 1 ) {
					$row['mvt_reject_is_on'] = 'Y' ;
					$row['mvt_reject_codes'] = $arr_tl['field_REJECT_ARR'] ;
				}
				$row['mvt_doc'] = $arr_tl['field_TRANSFER_TXT'] ;
			} else {
				$row['mvt_step'] = 'T00_TODO' ;
			}
		}
		
		$row['static_n'] = 'N' ;
		
		$data[] = $row ;
	}


	// Colonnes
	$columns = array(
		array('dataIndex' => 'soc_code', 'text' => 'B.U.'),
		array('dataIndex' => 'whse_code', 'text' => 'DC Location'),
		array('dataIndex' => 'atr_DIV', 'text' => 'Plant','dataType'=>'string'),
		array('dataIndex' => 'atr_ES', 'text' => 'Storage location','dataType'=>'string'),
		array('dataIndex' => 'atr_SW', 'text' => 'Warehouse','dataType'=>'string'),
		array('dataIndex' => 'atr_STOTYPE', 'text' => 'Storage Type','dataType'=>'string'),
		array('dataIndex' => 'adr_id_parent', 'text' => 'Bin location','dataType'=>'string'),
		array('dataIndex' => 'adr_id_sub', 'text' => '"Boite fille"'),
		array('dataIndex' => 'atr_BINTYPE', 'text' => 'Bin type'),
		array('dataIndex' => 'stk_prod', 'text' => 'Part Number','dataType'=>'string'),
		array('dataIndex' => 'stk_prod_desc', 'text' => 'Part Description'),
		array('dataIndex' => 'stk_prod_uom', 'text' => 'UoM'),
		array('dataIndex' => 'stk_prod_std', 'text' => 'Standard (Y/N)'),
		array('dataIndex' => '', 'text' => 'Traceability Level 1 (EASA/CoC)'),
		array('dataIndex' => '', 'text' => 'N# EASA or CoC'),
		array('dataIndex' => '', 'text' => '(Paper / Electronic) EASA or CoC'),
		array('dataIndex' => 'stk_prod_spec', 'text' => 'Traceability Level 2 (BATCH/SN/BANAL)'),
		array('dataIndex' => 'stk_spec_batch', 'text' => 'Batch #','dataType'=>'string'),
		array('dataIndex' => 'stk_spec_sn', 'text' => 'Serial Number','dataType'=>'string'),
		array('dataIndex' => '', 'text' => 'Shelf Life (Y/N)'),
		array('dataIndex' => 'stk_spec_datelc', 'text' => 'Shelf Life (Date)'),
		array('dataIndex' => 'stk_prod_uc', 'text' => '(SPQ) Taille de lot de vente'),
		array('dataIndex' => 'atr_STKTYPE', 'text' => 'Stock Type (S/Q)'),
		array('dataIndex' => 'stk_qty', 'text' => 'Quantity','dataType'=>'int'),
		array('dataIndex' => 'static_n', 'text' => 'Temoin de supression (Y/N)'),
		array('dataIndex' => 'atr_CLASS', 'text' => 'ABC class'),
		array('dataIndex' => '', 'text' => 'Status / Comments'),
		array('dataIndex' => 'mvt_doc', 'text' => 'TransferDoc'),
		array('dataIndex' => 'mvt_step', 'text' => 'Step'),
		array('dataIndex' => 'mvt_commit_date', 'text' => 'Commit (LAM) Date'),
		array('dataIndex' => 'mvt_reject_is_on', 'text' => 'Rejected'),
		array('dataIndex' => 'mvt_reject_codes', 'text' => 'Reject reason')
	);
	
	return array('columns'=>$columns, 'data'=>$data) ;
}
function specDbsLam_queryspec_lib_SAFRAN_MBD_OT() {
	global $_opDB ;
	
	$data = array() ;

	$query = "SELECT * FROM view_file_STOCK WHERE field_PROD_ID LIKE 'MBD%'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		//print_r($arr) ;
		//continue ;
		$whse_code = substr($arr['field_ADR_ID'],0,3) ;
		switch( $whse_code ) {
			case 'TMP' :
				$treenode_key = $_opDB->query_uniqueValue("SELECT treenode_key FROM view_bible_ADR_entry WHERE entry_key='{$arr['field_ADR_ID']}'") ;
				while( $treenode_key != 'TMP' && $treenode_parent_key != 'TMP' ) {
					$treenode_parent_key = $_opDB->query_uniqueValue("SELECT treenode_parent_key FROM view_bible_ADR_tree WHERE treenode_key='{$treenode_key}'");
					if( $treenode_parent_key == 'TMP' ) {
						break ;
					}
					$treenode_key = $treenode_parent_key ;
				}
				$whse_bin = substr($treenode_key,4) ;
				break ;
				
			default :
				$whse_bin = substr($arr['field_ADR_ID'],4) ;
				break ;
		}
		
		$query = "SELECT * FROM view_bible_PROD_entry WHERE entry_key='{$arr['field_PROD_ID']}'" ;
		$res_prod = $_opDB->query($query) ;
		$arr_prod = $_opDB->fetch_assoc($res_prod) ;
		
		$row = array(
			'soc_code' => substr($arr['field_PROD_ID'],0,3),
			'whse_code' => substr($arr['field_ADR_ID'],0,3),
			'atr_DIV' => $arr['field_ATR_DIV'],
			'atr_ES' => $arr['field_ATR_ES'],
			'atr_STKTYPE' => $arr['field_ATR_STKTYPE'],
			'atr_SW' => $arr['field_ATR_SW'],
			'atr_STOTYPE' => $arr['field_ATR_STOTYPE'],
			'atr_SU' => $arr['field_ATR_SU'],
			'atr_NEASA' => $arr['field_ATR_NEASA'],
			'adr_id_parent' => $whse_bin,
			'adr_id_sub' => '',
			'atr_BINTYPE' => ( substr($arr['field_ADR_ID'],0,3) == 'MIT' ? 'EC2/X' : '' ),
			'stk_prod' => substr($arr['field_PROD_ID'],4),
			'stk_prod_desc' => $arr_prod['field_PROD_TXT'],
			'stk_spec_batch' => $arr['field_SPEC_BATCH'],
			'stk_spec_sn' => $arr['field_SPEC_SN'],
			'stk_spec_datelc' => ($arr['field_SPEC_DATELC'] && $arr['field_SPEC_DATELC']!='0000-00-00 00:00:00' ?substr($arr['field_SPEC_DATELC'],0,10) : ''),
			'stk_qty' => (float)($arr['field_QTY_AVAIL']+$arr['field_QTY_OUT'])
		) ;
		
		if( $arr_prod['field_SPEC_IS_SN'] == 1 ) {
			$row['stk_prod_spec'] = 'SN' ;
		} elseif( $arr_prod['field_SPEC_IS_BATCH'] == 1 ) {
			$row['stk_prod_spec'] = 'BATCH' ;
		} else {
			$row['stk_prod_spec'] = 'BANAL' ;
		}
		
		if( substr($arr['field_ADR_ID'],0,3) == 'MIT' ) {
			unset($arr_mvt) ;
			$stk_filerecord_id = $arr['filerecord_id'] ;
			while( TRUE ) {
				$query = "SELECT mvtstep.*, mvt.*, mvt.filerecord_id AS mvt_filerecord_id FROM view_file_MVT_STEP mvtstep 
						INNER JOIN view_file_MVT mvt ON mvt.filerecord_id = mvtstep.filerecord_parent_id
						WHERE mvtstep.field_COMMIT_FILE_STOCK_ID='{$stk_filerecord_id}' AND field_STATUS_IS_OK='1'" ;
				$res_mvt = $_opDB->query($query) ;
				$arr_mvt = $_opDB->fetch_assoc($res_mvt) ;
				if( !$arr_mvt ) {
					$row['src_adr_id'] = substr($src_adr_id,4) ;
					break ;
				}
				$stk_filerecord_id = $arr_mvt['field_FILE_STOCK_ID'] ;
				$src_adr_id = $arr_mvt['field_SRC_ADR_ID'] ;
				unset($arr_mvt) ;
				continue ;
			}
		} else {
			continue ;
		}
		
		$row['static_n'] = 'N' ;
		
		$data[] = $row ;
	}


	// Colonnes
	$columns = array(
		array('dataIndex' => 'atr_DIV', 'text' => 'PLANT','dataType'=>'string'),
		array('dataIndex' => 'atr_ES', 'text' => 'STORAGE_LOCATION','dataType'=>'string'),
		array('dataIndex' => 'atr_SW', 'text' => 'WAREHOUSE_NUMBER','dataType'=>'string'),
		array('dataIndex' => 'atr_STOTYPE', 'text' => 'FROM_STORAGE_TYPE','dataType'=>'string'),
		array('dataIndex' => 'stk_prod', 'text' => 'MATERIAL','dataType'=>'string'),
		array('dataIndex' => 'stk_qty', 'text' => 'QUANTITY','dataType'=>'int'),
		array('dataIndex' => 'atr_STKTYPE', 'text' => 'STOCK_CATEGORY','dataType'=>'string'),
		array('dataIndex' => 'src_adr_id', 'text' => 'FROM_STORAGE_BIN','dataType'=>'string'),
		array('dataIndex' => 'adr_id_parent', 'text' => 'TO_STORAGE_BIN','dataType'=>'string'),
		array('dataIndex' => 'atr_SU', 'text' => 'TO_STORAGE_UNIT','dataType'=>'string'),
		array('dataIndex' => 'stk_spec_batch', 'text' => 'BATCH','dataType'=>'string'),
		array('dataIndex' => 'atr_NEASA', 'text' => 'EASA','dataType'=>'string'),
		array('dataIndex' => 'stk_spec_sn', 'text' => 'SN_NUMBER','dataType'=>'string'),
	);
	
	return array('columns'=>$columns, 'data'=>$data) ;
}



function specDbsLam_queryspecSync( $post_data ) {
	global $_opDB ;
	
	$handle = fopen($_FILES['file_upload']['tmp_name'],"rb") ;
	$soc_code = $post_data['soc_code'] ;
	
	$ret = specDbsLam_queryspec_lib_sync( $handle, $soc_code ) ;
	
	// Specs
	switch( $soc_code ) {
		case 'MBD' :
			$query = "UPDATE view_file_STOCK SET field_ATR_SU='@MBDSU' WHERE field_ATR_SU='' AND field_PROD_ID LIKE 'MBD%'" ;
			$_opDB->query($query) ;
			break ;
		case 'ACL' :
			break ;
		default :
			break ;
	}
	
	return array('success'=>$ret) ;
}

function specDbsLam_queryspec_lib_sync( $handle, $soc_code ) {
	global $_opDB ;
	
	$mapStock_mkey_id = array() ;
	$mapStock_mkey_isLocked = array() ;
	$mapStock_mkey_whseCode = array() ;

	$query = "SELECT * FROM view_file_STOCK" ;
	if( $soc_code == 'MBD' ) {
		$query.= " WHERE (field_ADR_ID LIKE 'DAH%' OR field_ADR_ID LIKE 'TMP%')" ;
	}
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		if( !(strpos($arr['field_PROD_ID'],$soc_code.'_') === 0) ) {
			continue ;
		}
		if( !$arr['field_ATR_STKTYPE'] ) {
			$arr['field_ATR_STKTYPE']='-' ;
		}
		if( substr($arr['field_ATR_SU'],0,1)=='@' ) {
			$arr['field_ATR_SU'] = '' ;
		}
			
		$ttmp = explode('_',$arr['field_ADR_ID'],2) ;
		$whse_code = $ttmp[0] ;
		
		$mkey = array(
			$arr['field_ATR_DIV'],
			$arr['field_ATR_ES'],
			$arr['field_ATR_STKTYPE'],
			$arr['field_PROD_ID'],
			$arr['field_SPEC_BATCH'],
			$arr['field_SPEC_SN'],
			$arr['field_ATR_SU']
		) ;
		$mkey = implode('%%%',$mkey) ;
		if( $mapStock_mkey_id[$mkey] ) {
			//echo "exists!!!\n" ;
			//print_r($mkey) ;
			//echo "\n\n\n" ;
			$mapStock_mkey_isLocked[$mkey] = TRUE ;
		} else {
			$mapStock_mkey_id[$mkey] = $arr['filerecord_id'] ;
			$mapStock_mkey_whseCode[$mkey] = $whse_code ;
		}
		if( $arr['field_QTY_OUT'] > 0 ) {
			$mapStock_mkey_isLocked[$mkey] = TRUE ;
		}
	}
	
	$bible_PROD_tree = array() ;
	$bible_PROD_entry = array() ;
	$bible_ADR_tree = array() ;
	$bible_ADR_entry = array() ;
	$file_STOCK = array() ;
	
	$arr_header = fgetcsv($handle) ;
	while( !feof($handle) ) {
		$arr_csv = fgetcsv($handle) ;
		if( !$arr_csv ) {
			continue ;
		}
		
		$row = array_combine($arr_header,$arr_csv) ;
		
		if( !$row['atr_STKTYPE'] ) {
			$row['atr_STKTYPE']='-' ;
		}
		if( !(strpos($row['prod_id'],$soc_code.'_') === 0) ) {
			continue ;
		}
		
		$ttmp = explode('_',$row['adr'],2) ;
		$whse_code = $ttmp[0] ;
		
		if( $row['prod_key'] ) {
			$bible_PROD_tree[$row['prod_key']] = array(
				'treenode_parent_key' => '',
				'field_PRODGROUP_CODE' => $row['prod_key']
			);
		}
		$bible_PROD_entry[$row['prod_id']] = array(
			'treenode_key' => ($row['prod_key'] ? $row['prod_key']:NULL),
			'field_PROD_ID' => $row['prod_id'],
			'field_PROD_TXT' => $row['desc'],
			'field_SPEC_IS_BATCH' => $row['prod_is_batch'],
			'field_SPEC_IS_DLC' => $row['prod_is_dlc'],
			'field_SPEC_IS_SN' => $row['prod_is_sn']
		);
		if( $row['adr_key'] ) {
			$bible_ADR_tree[$row['adr_key']] = array(
				'treenode_parent_key' => $whse_code,
				'field_ROW_ID' => $row['adr_key'],
				'field_POS_ZONE' => $row['adr_row']
			);
		}
		$bible_ADR_entry[$row['adr']] = array(
			'treenode_key' => ($row['adr_key'] ? $row['adr_key']:NULL),
			'field_ADR_ID' => $row['adr']
		);
		
		$mkey = array(
			$row['atr_DIV'],
			$row['atr_ES'],
			$row['atr_STKTYPE'],
			$row['prod_id'],
			$row['spec_batch'],
			$row['spec_sn'],
			$row['atr_SU']
		);
		$mkey = implode('%%%',$mkey) ;
		if( $mapStock_mkey_isLocked[$mkey] || ($soc_code=='MBD' && $whse_code=='MIT') ) {
			if( $mapStock_mkey_id[$mkey] ) {
				$cnt['ignore']++ ;
				$file_STOCK[] = array(
					'filerecord_id' => $mapStock_mkey_id[$mkey]
				);
			}
			continue ;
		}
		if( !$mapStock_mkey_id[$mkey] ) {
			//echo $mkey."\n" ;
			//print_r($row) ;
			//echo "\n" ;
		}
		$row_STOCK = array(
			'filerecord_id' => $mapStock_mkey_id[$mkey],
			'field_ATR_DIV' => $row['atr_DIV'],
			'field_ATR_ES' => $row['atr_ES'],
			'field_ATR_STOTYPE' => $row['atr_STOTYPE'],
			'field_ATR_SW' => $row['atr_SW'],
			'field_ATR_STKTYPE' => $row['atr_STKTYPE'],
			'field_PROD_ID' => $row['prod_id'],
			'field_ADR_ID' => $row['adr'],
			'field_QTY_AVAIL' => $row['qty'],
			'field_SPEC_BATCH' => $row['spec_batch'],
			'field_SPEC_DATELC' => $row['spec_dlc'],
			'field_SPEC_SN' => $row['spec_sn']
		);
		if( isset($mapStock_mkey_whseCode[$mkey]) && $mapStock_mkey_whseCode[$mkey] != $whse_code ) {
			unset($row_STOCK['field_ADR_ID']) ;
		}
		$file_STOCK[] = $row_STOCK ;
	}
	
	if( count($file_STOCK)==0 ) {
		return false ;
	}
	
	
	//BIBLE
	foreach( $bible_PROD_tree as $treenode_key => $arr_ins ) {
		$bible_code = 'PROD' ;
		$treenode_parent_key = $arr_ins['treenode_parent_key'] ;
		if( paracrm_lib_data_getRecord_bibleTreenode( $bible_code, $treenode_key ) ) {
			paracrm_lib_data_updateRecord_bibleTreenode( $bible_code, $treenode_key, $arr_ins );
			if( $treenode_parent_key ) {
				paracrm_lib_data_bibleAssignParentTreenode( $bible_code, $treenode_key, $treenode_parent_key ) ;
			}
		} else {
			paracrm_lib_data_insertRecord_bibleTreenode( $bible_code, $treenode_key, $treenode_parent_key, $arr_ins ) ;
		}
	}
	foreach( $bible_PROD_entry as $entry_key => $arr_ins ) {
		$bible_code = 'PROD' ;
		$treenode_key = $arr_ins['treenode_key'] ;
		if( paracrm_lib_data_getRecord_bibleEntry( $bible_code, $entry_key ) ) {
			paracrm_lib_data_updateRecord_bibleEntry( $bible_code, $entry_key, $arr_ins );
			if( $treenode_key ) {
				paracrm_lib_data_bibleAssignTreenode( $bible_code, $entry_key, $treenode_key ) ;
			}
		} else {
			paracrm_lib_data_insertRecord_bibleEntry( $bible_code, $entry_key, $treenode_key, $arr_ins );
		}
	}
	
	foreach( $bible_ADR_tree as $treenode_key => $arr_ins ) {
		$bible_code = 'ADR' ;
		$treenode_parent_key = $arr_ins['treenode_parent_key'] ;
		if( paracrm_lib_data_getRecord_bibleTreenode( $bible_code, $treenode_key ) ) {
			paracrm_lib_data_updateRecord_bibleTreenode( $bible_code, $treenode_key, $arr_ins );
			if( $treenode_parent_key ) {
				paracrm_lib_data_bibleAssignParentTreenode( $bible_code, $treenode_key, $treenode_parent_key ) ;
			}
		} else {
			paracrm_lib_data_insertRecord_bibleTreenode( $bible_code, $treenode_key, $treenode_parent_key, $arr_ins ) ;
		}
	}
	foreach( $bible_ADR_entry as $entry_key => $arr_ins ) {
		$bible_code = 'ADR' ;
		$treenode_key = $arr_ins['treenode_key'] ;
		if( paracrm_lib_data_getRecord_bibleEntry( $bible_code, $entry_key ) ) {
			paracrm_lib_data_updateRecord_bibleEntry( $bible_code, $entry_key, $arr_ins );
			if( $treenode_key ) {
				paracrm_lib_data_bibleAssignTreenode( $bible_code, $entry_key, $treenode_key ) ;
			}
		} else {
			paracrm_lib_data_insertRecord_bibleEntry( $bible_code, $entry_key, $treenode_key, $arr_ins );
		}
	}
	
	
	// UPDATE
	$arr_new_filerecordIds = array() ;
	foreach( $file_STOCK as $row_STOCK ) {
		if( $row_STOCK['filerecord_id'] ) {
			if( count($row_STOCK) > 1 ) {
				$cnt['update']++ ;
				paracrm_lib_data_updateRecord_file( 'STOCK', $row_STOCK, $row_STOCK['filerecord_id'] ) ;
			}
			$arr_new_filerecordIds[] = $row_STOCK['filerecord_id'] ;
		} else {
			$cnt['insert']++ ;
			$arr_new_filerecordIds[] = paracrm_lib_data_insertRecord_file( 'STOCK', 0, $row_STOCK ) ;
		}
	}
	
	// CLEAN
	$arr_previous_filerecordIds = array() ;
	foreach( $mapStock_mkey_id as $mkey => $filerecord_id ) {
		if( $mapStock_mkey_isLocked[$mkey] ) {
			continue ;
		}
		$arr_previous_filerecordIds[] = $filerecord_id ;
	}
	$arr_toDelete_filerecordIds = array_diff($arr_previous_filerecordIds,$arr_new_filerecordIds) ;
	foreach( $arr_toDelete_filerecordIds as $filerecord_id ) {
		$cnt['delete']++ ;
		paracrm_lib_data_deleteRecord_file('STOCK',$filerecord_id) ;
	}
	
	//print_r($cnt) ;
	return true ;
}

?>
