<?

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
			break ;
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
		default :
			if( $post_data['queryspec_code'] ) {
				return array('success'=>false) ;
			}
			sleep(1) ;
			break ;
	}
	
	$TAB = array(
		array('queryspec_code'=>'SAFRAN_TRANSFERFLOW', 'queryspec_title'=>'Safran Transfer Flow')
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
			'atr_SW' => '',
			'atr_STOTYPE' => '',
			'adr_id_parent' => $whse_bin,
			'adr_id_sub' => '',
			'atr_BINTYPE' => ( substr($arr['field_ADR_ID'],0,3) == 'MIT' ? 'EC2/X' : '' ),
			'stk_prod' => substr($arr['field_PROD_ID'],4),
			'stk_prod_desc' => $arr_prod['field_PROD_TXT'],
			'stk_spec_batch' => $arr['field_SPEC_BATCH'],
			'stk_spec_sn' => $arr['field_SPEC_SN'],
			'stk_spec_sn' => $arr['field_SPEC_SN'],
			'stk_spec_dlc' => '',
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
			$row['mvt_step'] = 'T06_DONE' ;
			
			$query = "SELECT mvtstep.*, mvt.* FROM view_file_MVT_STEP mvtstep 
					INNER JOIN view_file_MVT mvt ON mvt.filerecord_id = mvtstep.filerecord_parent_id
					WHERE mvtstep.field_DEST_ADR_ID='{$arr['field_ADR_ID']}' AND field_STATUS_IS_OK='1'" ;
			$res_mvt = $_opDB->query($query) ;
			$arr_mvt = $_opDB->fetch_assoc($res_mvt) ;
			$row['mvt_commit_date'] = $arr_mvt['field_COMMIT_DATE'] ;
		} else {
			$query = "SELECT mvtstep.*, mvt.*, mvt.filerecord_id AS mvt_filerecord_id FROM view_file_MVT_STEP mvtstep 
					INNER JOIN view_file_MVT mvt ON mvt.filerecord_id = mvtstep.filerecord_parent_id
					WHERE mvtstep.field_FILE_STOCK_ID='{$arr['filerecord_id']}' AND field_STATUS_IS_OK<>'1'" ;
			$res_mvt = $_opDB->query($query) ;
			$arr_mvt = $_opDB->fetch_assoc($res_mvt) ;
			if( $arr_mvt ) {
				$row['mvt_step'] = $arr_mvt['field_STEP_CODE'] ;
				
				$query = "SELECT * FROM view_file_TRANSFER_LIG WHERE field_FILE_MVT_ID='{$arr_mvt['mvt_filerecord_id']}'" ;
				$res_tl = $_opDB->query($query) ;
				$arr_tl = $_opDB->fetch_assoc($res_tl) ;
				if( $arr_tl['field_STATUS_IS_REJECT'] == 1 ) {
					$row['mvt_reject_is_on'] = 'Y' ;
					$row['mvt_reject_codes'] = $arr_tl['field_REJECT_ARR'] ;
				}
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
		array('dataIndex' => 'stk_spec_dlc', 'text' => 'Shelf Life (Date)'),
		array('dataIndex' => 'stk_prod_uc', 'text' => '(SPQ) Taille de lot de vente'),
		array('dataIndex' => 'atr_STKTYPE', 'text' => 'Stock Type (S/Q)'),
		array('dataIndex' => 'stk_qty', 'text' => 'Quantity','dataType'=>'int'),
		array('dataIndex' => 'static_n', 'text' => 'Temoin de supression (Y/N)'),
		array('dataIndex' => 'atr_CLASS', 'text' => 'ABC class'),
		array('dataIndex' => '', 'text' => 'Status / Comments'),
		array('dataIndex' => 'mvt_step', 'text' => 'Step'),
		array('dataIndex' => 'mvt_commit_date', 'text' => 'Commit (LAM) Date'),
		array('dataIndex' => 'mvt_reject_is_on', 'text' => 'Rejected'),
		array('dataIndex' => 'mvt_reject_codes', 'text' => 'Reject reason')
	);
	
	return array('columns'=>$columns, 'data'=>$data) ;
}

?>
