<?php

function specRsiRecouveo_recordgroup_list( $post_data ) {
	global $_opDB ;
	$p_recordgroupCode = $post_data['recordgroup_code'] ;
	
	$TAB = array() ;
	$query = "SELECT field_RECORDGROUP_ID, field_RECORDGROUP_TYPE, field_RECORDGROUP_DATE, sum(field_AMOUNT) as calc_amount_sum, field_BANK_LINK_FILE_ID
					FROM view_file_RECORD r" ;
	$query.= ($p_recordgroupCode ? " WHERE r.field_RECORDGROUP_ID='{$p_recordgroupCode}'" : " WHERE r.field_RECORDGROUP_ID<>''") ;
	$query.= " GROUP BY field_RECORDGROUP_ID
					HAVING count(distinct field_BANK_LINK_FILE_ID)='1'
					ORDER BY field_RECORDGROUP_DATE DESC" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$row = array(
			'recordgroup_id' => $arr['field_RECORDGROUP_ID'],
			'recordgroup_type' => $arr['field_RECORDGROUP_TYPE'],
			'recordgroup_date' => (is_date_valid($arr['field_RECORDGROUP_DATE']) ? date('Y-m-d',strtotime($arr['field_RECORDGROUP_DATE'])) : ''),
			'calc_amount_sum' => $arr['calc_amount_sum'],
			'bank_is_alloc' => ($arr['field_BANK_LINK_FILE_ID']>0)
		);
		$TAB[] = $row ;
	}
	
	return array('success'=>true,'data'=>$TAB);
}






function specRsiRecouveo_recordgroup_input_get( $post_data ) {
	global $_opDB ;
	$p_recordgroupCode = $post_data['recordgroup_code'] ;
	
	
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_action = $ttmp['data']['cfg_action'] ;
	$cfg_action_eta = $ttmp['data']['cfg_action_eta'] ;
	$cfg_balage = $ttmp['data']['cfg_balage'] ;
	$cfg_atr = $ttmp['data']['cfg_atr'] ;
	//print_r($cfg_atr) ;
	foreach( $cfg_atr as &$atr_record ) {
		$map_id_text = array() ;
		foreach( $atr_record['records'] as $rec ) {
			$map_id_text[$rec['id']] = substr($rec['text'],strlen($rec['id'])+2) ;
		}
		$atr_record['map_id_text'] = $map_id_text ;
	}
	unset($atr_record) ;
	
	
	$TAB = array() ;
	$readonly = FALSE ;
	$query = "SELECT r.*, acc.field_ACC_NAME 
				FROM view_file_RECORD r
				LEFT OUTER JOIN view_bible_LIB_ACCOUNT_entry acc ON acc.entry_key=r.field_LINK_ACCOUNT
				WHERE field_RECORDGROUP_ID='{$p_recordgroupCode}' AND field_RECORDGROUP_TYPE='input'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$record_row = array(
			'record_filerecord_id' => $arr['filerecord_id'],
			'acc_id' => $arr['field_LINK_ACCOUNT']
		);
		foreach( $cfg_atr as $atr_record ) {
			$mkey = $atr_record['bible_code'] ;
			$record_row[$mkey] = $arr['field_'.$mkey] ;
		}
		$record_row += array(
			'type' => $arr['field_TYPE'],
			'record_id' => $arr['field_RECORD_ID'],
			'acc_id' => $arr['field_LINK_ACCOUNT'],
			'acc_txt' => $arr['field_ACC_NAME'],
			'date_record' => $arr['field_DATE_RECORD'],
			'date_value' => $arr['field_DATE_VALUE'],
			'amount' => ($arr['field_AMOUNT']*-1),
			'letter_is_on' => ($arr['field_LETTER_IS_ON']==1),
			'letter_code' => $arr['field_LETTER_CODE'],
			'_checked' => true
		);
		if( $arr['field_BANK_LINK_FILE_ID'] > 0 ) {
			$readonly = TRUE ;
		}
		$TAB[] = $record_row ;
	}
	
	if( $p_recordgroupCode ) {
		$json = specRsiRecouveo_recordgroup_list(array('recordgroup_code'=>$p_recordgroupCode)) ;
		$recordgroup_row = $json['data'][0] ;
		$recordgroup_row['records'] = array_values($TAB) ;
	} else {
		$recordgroup_row = array(
			'recordgroup_id' => '',
			'records' => array()
		) ;
	}
	
	
	return array('success'=>true,'data'=>$recordgroup_row,'readonly'=>$readonly) ;
}


function specRsiRecouveo_recordgroup_input_set( $post_data ) {
	global $_opDB ;
	$p_isNew = $post_data['_is_new'] ;
	$p_recordgroupCode = $post_data['recordgroup_code'] ;
	$p_formData = json_decode($post_data['data'],true) ;
	
	if( !$p_isNew ) {
		$recordgroup_code = $p_recordgroupCode ;
	} else {
		while( TRUE ) {
			$query = "SELECT field_META_VALUE FROM view_bible_META_entry WHERE field_META_KEY='RECORDGROUP_INPUTNEXT'" ;
			$next_id = $_opDB->query_uniqueValue($query) ;
			if( !$next_id ) {
				paracrm_lib_data_insertRecord_bibleEntry('META','RECORDGROUP_INPUTNEXT','GLOBAL',array('field_META_KEY'=>'RECORDGROUP_INPUTNEXT','field_META_VALUE'=>1)) ;
				$next_id = 1 ;
			}
			$next_txt = 'remCheq'.''.str_pad((float)$next_id, 4, "0", STR_PAD_LEFT) ;
			$query = "UPDATE view_bible_META_entry SET field_META_VALUE=field_META_VALUE+'1' WHERE field_META_KEY='RECORDGROUP_INPUTNEXT'" ;
			$_opDB->query($query) ;
			$json = specRsiRecouveo_recordgroup_input_get( array('recordgroup_code'=>$next_txt) ) ;
			if( count($json['data']['records']) == 0 ) {
				$recordgroup_code = $next_txt ;
				break ;
			}
		}
	}
	
	$existing_ids = array() ;
	$query = "SELECT filerecord_id FROM view_file_RECORD WHERE field_RECORDGROUP_ID='{$recordgroup_code}' AND field_RECORDGROUP_TYPE='input'" ;
	$result = $_opDB->query($query) ;
	while(($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$existing_ids[] = $arr[0] ;
	}
	
	$new_ids = array() ;
	$c = 0 ;
	foreach( $p_formData['records'] as $record ) {
		$c++ ;
		$arr_ins = array(
			'field_TYPE' => 'LOCAL',
			'field_RECORD_ID' => $recordgroup_code.'-'.$c,
			'field_LINK_ACCOUNT' => $record['acc_id'],
			'field_DATE_RECORD' => substr($p_formData['recordgroup_date'],0,10),
			'field_DATE_VALUE' => substr($p_formData['recordgroup_date'],0,10),
			'field_AMOUNT' => ($record['amount']*-1),
			'field_RECORDGROUP_ID' => $recordgroup_code,
			'field_RECORDGROUP_TYPE' => 'input',
			'field_RECORDGROUP_DATE' => $p_formData['recordgroup_date']
		);
		if( is_numeric($record['record_filerecord_id']) ) {
			paracrm_lib_data_updateRecord_file( 'RECORD', $arr_ins, $record['record_filerecord_id'] );
			$new_ids[] = $record['record_filerecord_id'] ;
		} else {
			$new_ids[] = paracrm_lib_data_insertRecord_file( 'RECORD', 0, $arr_ins );
		}
	}
	
	$to_delete = array_diff($existing_ids,$new_ids) ;
	foreach( $to_delete as $filerecord_id ) {
		paracrm_lib_data_deleteRecord_file( 'RECORD', $filerecord_id );
	}
	
	return array('success'=>true) ;
}






function specRsiRecouveo_recordgroup_assoc_get( $post_data ) {
	global $_opDB ;
	$p_recordgroupCode = $post_data['recordgroup_code'] ;
	
	
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_action = $ttmp['data']['cfg_action'] ;
	$cfg_action_eta = $ttmp['data']['cfg_action_eta'] ;
	$cfg_balage = $ttmp['data']['cfg_balage'] ;
	$cfg_atr = $ttmp['data']['cfg_atr'] ;
	//print_r($cfg_atr) ;
	foreach( $cfg_atr as &$atr_record ) {
		$map_id_text = array() ;
		foreach( $atr_record['records'] as $rec ) {
			$map_id_text[$rec['id']] = substr($rec['text'],strlen($rec['id'])+2) ;
		}
		$atr_record['map_id_text'] = $map_id_text ;
	}
	unset($atr_record) ;
	
	
	$TAB = array() ;
	$readonly = FALSE ;
	$query = "SELECT r.*, acc.field_ACC_NAME 
				FROM view_file_RECORD r
				LEFT OUTER JOIN view_bible_LIB_ACCOUNT_entry acc ON acc.entry_key=r.field_LINK_ACCOUNT
				WHERE field_TYPE='LOCAL' AND field_TYPE_TEMPREC='FILE'
				AND (
					field_RECORDGROUP_ID='{$p_recordgroupCode}' AND field_RECORDGROUP_TYPE='assoc'
					OR
					field_RECORDGROUP_ID='' AND field_BANK_LINK_FILE_ID='0'
				)" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$record_row = array(
			'record_filerecord_id' => $arr['filerecord_id'],
			'acc_id' => $arr['field_LINK_ACCOUNT']
		);
		foreach( $cfg_atr as $atr_record ) {
			$mkey = $atr_record['bible_code'] ;
			$record_row[$mkey] = $arr['field_'.$mkey] ;
		}
		$record_row += array(
			'type' => $arr['field_TYPE'],
			'record_id' => $arr['field_RECORD_ID'],
			'acc_id' => $arr['field_LINK_ACCOUNT'],
			'acc_txt' => $arr['field_ACC_NAME'],
			'date_record' => $arr['field_DATE_RECORD'],
			'date_value' => $arr['field_DATE_VALUE'],
			'amount' => ($arr['field_AMOUNT']*-1),
			'letter_is_on' => ($arr['field_LETTER_IS_ON']==1),
			'letter_code' => $arr['field_LETTER_CODE'],
			'_checked' => ($p_recordgroupCode&&($arr['field_RECORDGROUP_ID']==$p_recordgroupCode))
		);
		if( $arr['field_BANK_LINK_FILE_ID'] > 0 ) {
			$readonly = TRUE ;
		}
		$TAB[] = $record_row ;
	}
	if( $readonly ) {
		foreach( $TAB as $idx => $record_row ) {
			if( !$record_row['_checked'] ) {
				unset($TAB[$idx]) ;
			}
		}
	}
	
	if( $p_recordgroupCode ) {
		$json = specRsiRecouveo_recordgroup_list(array('recordgroup_code'=>$p_recordgroupCode)) ;
		$recordgroup_row = $json['data'][0] ;
		$recordgroup_row['records'] = array_values($TAB) ;
	} else {
		$recordgroup_row = array(
			'recordgroup_id' => '',
			'records' => array_values($TAB)
		) ;
	}
	
	return array('success'=>true,'data'=>$recordgroup_row,'readonly'=>$readonly) ;
}

function specRsiRecouveo_recordgroup_assoc_set( $post_data ) {
	global $_opDB ;
	$p_isNew = $post_data['_is_new'] ;
	$p_recordgroupCode = $post_data['recordgroup_code'] ;
	$p_formData = json_decode($post_data['data'],true) ;
	
	if( !$p_isNew ) {
		$recordgroup_code = $p_recordgroupCode ;
	} else {
		while( TRUE ) {
			$query = "SELECT field_META_VALUE FROM view_bible_META_entry WHERE field_META_KEY='RECORDGROUP_ASSOCNEXT'" ;
			$next_id = $_opDB->query_uniqueValue($query) ;
			if( !$next_id ) {
				paracrm_lib_data_insertRecord_bibleEntry('META','RECORDGROUP_ASSOCNEXT','GLOBAL',array('field_META_KEY'=>'RECORDGROUP_ASSOCNEXT','field_META_VALUE'=>1)) ;
				$next_id = 1 ;
			}
			$next_txt = 'vpcGroup'.''.str_pad((float)$next_id, 4, "0", STR_PAD_LEFT) ;
			$query = "UPDATE view_bible_META_entry SET field_META_VALUE=field_META_VALUE+'1' WHERE field_META_KEY='RECORDGROUP_ASSOCNEXT'" ;
			$_opDB->query($query) ;
			
			// test
			$json = specRsiRecouveo_recordgroup_assoc_get( array('recordgroup_code'=>$next_txt) ) ;
			$cnt = 0 ;
			foreach( $json['data']['records'] as $row ) {
				if( $row['checked'] ) {
					continue 2 ;
				}
			}
			
			$recordgroup_code = $next_txt ;
			break ;
		}
	}
	
	$arr_filerecordIds = array() ;
	foreach( $p_formData['records'] as $record ) {
		$arr_filerecordIds[] = $record['record_filerecord_id'] ;
	}
	
	if( $arr_filerecordIds ) {
		$sqlListIds = $_opDB->makeSQLlist($arr_filerecordIds) ;
	} else {
		$sqlListIds = '(0)' ;
	}
	
	$query = "UPDATE view_file_RECORD SET field_RECORDGROUP_ID='', field_RECORDGROUP_TYPE=''
				WHERE field_RECORDGROUP_ID='{$recordgroup_code}' AND filerecord_id NOT IN {$sqlListIds}" ;
	$_opDB->query($query) ;
	
	$query = "UPDATE view_file_RECORD SET field_RECORDGROUP_ID='{$recordgroup_code}', field_RECORDGROUP_TYPE='assoc', field_RECORDGROUP_DATE='{$p_formData['recordgroup_date']}'
				WHERE filerecord_id IN {$sqlListIds}" ;
	$_opDB->query($query) ;
	
	return array('success'=>true) ;
}

?>
