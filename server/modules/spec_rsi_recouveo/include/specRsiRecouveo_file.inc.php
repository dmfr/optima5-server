<?php

function specRsiRecouveo_file_getRecords( $post_data ) {
	global $_opDB ;
	
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_action_eta = $ttmp['data']['cfg_action_eta'] ;
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
	
	if( $post_data['filter_atr'] ) {
		$filter_atr = json_decode($post_data['filter_atr'],true) ;
	}
	if( $post_data['filter_fileFilerecordId_arr'] ) {
		$_load_details = true ;
		$filter_fileFilerecordId_list = $_opDB->makeSQLlist( json_decode($post_data['filter_fileFilerecordId_arr'],true) ) ;
	}
	if( $post_data['filter_archiveIsOn'] ) {
		$filter_archiveIsOn = ( $post_data['filter_archiveIsOn'] ? true : false ) ;
	}
	
	$TAB_files = array() ;
	
	$query = "SELECT f.*, la.field_ACC_NAME, la.field_ACC_SIRET FROM view_file_FILE f" ;
	$query.= " JOIN view_bible_LIB_ACCOUNT_entry la ON la.entry_key = f.field_LINK_ACCOUNT" ;
	$query.= " WHERE 1" ;
	if( isset($filter_fileFilerecordId_list) ) {
		$query.= " AND f.filerecord_id IN {$filter_fileFilerecordId_list}" ;
	} else {
		if( $filter_atr ) {
			foreach( $cfg_atr as $atr_record ) {
				$mkey = $atr_record['bible_code'] ;
				if( $filter_atr[$mkey] ) {
					$mvalue = $filter_atr[$mkey] ;
					$query.= " AND f.field_{$mkey} = '$mvalue'" ;
				}
			}
		}
		if( !$filter_archiveIsOn ) {
			$query.= " AND f.field_STATUS <> ''" ;
		}
	}
	$query.= " ORDER BY f.filerecord_id DESC" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$record = array(
			'file_filerecord_id' => $arr['filerecord_id'],
			
			'id_ref' => $arr['field_FILE_ID'],
			
			'acc_id' => $arr['field_LINK_ACCOUNT'],
			'acc_txt' => $arr['field_ACC_NAME'],
			'acc_siret' => $arr['field_ACC_SIRET'],
			
			'status' => $arr['field_STATUS'],
			'status_closed' => ($arr['field_STATUS_CLOSED']==1),
			
			'date_open' => $arr['field_DATE_OPEN'],
			'date_last' => $arr['field_DATE_LAST'],
			
			'records' => array(),
			'actions' => array()
		);
		foreach( $cfg_atr as $atr_record ) {
			$mkey = $atr_record['bible_code'] ;
			$record[$mkey] = $arr['field_'.$mkey] ;
			$record[$mkey.'_text'] = $atr_record['map_id_text'][$arr['field_'.$mkey]] ;
		}
		
		$TAB_files[$arr['filerecord_id']] = $record ;
	}
	
	
	$query = "SELECT fa.* FROM view_file_FILE_ACTION fa" ;
	$query.= " JOIN view_file_FILE f ON f.filerecord_id=fa.filerecord_parent_id" ;
	$query.= " WHERE 1" ;
	if( isset($filter_fileFilerecordId_list) ) {
		$query.= " AND f.filerecord_id IN {$filter_fileFilerecordId_list}" ;
	} else {
		if( $filter_atr ) {
			foreach( $cfg_atr as $atr_record ) {
				$mkey = $atr_record['bible_code'] ;
				if( $filter_atr[$mkey] ) {
					$mvalue = $filter_atr[$mkey] ;
					$query.= " AND f.field_{$mkey} = '$mvalue'" ;
				}
			}
		}
		if( !$filter_archiveIsOn ) {
			$query.= " AND f.field_STATUS <> ''" ;
		}
	}
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		if( !isset($TAB_files[$arr['filerecord_parent_id']]) ) {
			continue ;
		}
		$TAB_files[$arr['filerecord_parent_id']]['actions'][] = array(
			'fileaction_filerecord_id' => $arr['filerecord_id'],
			'link_status' => $arr['field_LINK_STATUS'],
			'link_action' => $arr['field_LINK_ACTION'],
			'status_is_ok' => ($arr['field_STATUS_IS_OK']==1),
			'date_sched' => (specRsiRecouveo_file_tool_isDateValid($arr['field_DATE_SCHED']) ? $arr['field_DATE_SCHED'] : null),
			'date_actual' => (specRsiRecouveo_file_tool_isDateValid($arr['field_DATE_ACTUAL']) ? $arr['field_DATE_ACTUAL'] : null),
			'txt' => $arr['field_TXT']
		);
	}
	
	
	$query = "SELECT f.filerecord_id AS file_filerecord_id, r.*" ;
	$query.= " FROM view_file_RECORD r, view_file_RECORD_LINK rl, view_file_FILE f" ;
	$query.= " WHERE r.filerecord_id = rl.filerecord_parent_id " ;
	$query.= " AND f.filerecord_id = rl.field_LINK_FILE_ID AND rl.field_LINK_IS_ON='1'" ;
	if( isset($filter_fileFilerecordId_list) ) {
		$query.= " AND f.filerecord_id IN {$filter_fileFilerecordId_list}" ;
	} else {
		if( $filter_atr ) {
			foreach( $cfg_atr as $atr_record ) {
				$mkey = $atr_record['bible_code'] ;
				if( $filter_atr[$mkey] ) {
					$mvalue = $filter_atr[$mkey] ;
					$query.= " AND f.field_{$mkey} = '$mvalue'" ;
				}
			}
		}
		if( !$filter_archiveIsOn ) {
			$query.= " AND f.field_STATUS <> ''" ;
		}
	}
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$file_filerecord_id = $arr['file_filerecord_id'] ;
	
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
			'date_record' => $arr['field_DATE_RECORD'],
			'date_value' => $arr['field_DATE_VALUE'],
			'amount' => $arr['field_AMOUNT'],
			'clear_is_on' => ($arr['field_CLEAR_IS_ON']==1),
			'clear_assign' => $arr['field_CLEAR_ASSIGN']
		);
		
		if( !isset($TAB_files[$file_filerecord_id]) ) {
			continue ;
		}
		$TAB_files[$file_filerecord_id]['records'][] = $record_row ;
	}
	
	$map_etaRange_maxDays = array() ;
	foreach( $cfg_action_eta as $row ) {
		$map_etaRange_maxDays[$row['eta_range']] = $row['upto_days'] ;
	}
	asort($map_etaRange_maxDays) ;
	$obj_datetime_now = new DateTime(date('Y-m-d')) ;
	// Calculs sur dossiers (next_action, inv_total)
	foreach( $TAB_files as &$file_row ) {
		$next_action = NULL ;
		$inv_header = array(
			'inv_nb' => 0,
			'inv_amount_due' => 0,
			'inv_amount_total' => 0
		) ;
		
		foreach( $file_row['actions'] as &$action_row ) {
			if( $action_row['status_is_ok'] || !specRsiRecouveo_file_tool_isDateValid($action_row['date_sched']) ) {
				continue ;
			}
			
			// next action
			if( !$next_action || $action_row['date_sched'] < $next_action['date_sched'] ) {
				$next_action = $action_row ;
			}
		
			// calcul du J+x
			$obj_datetime_sched = new DateTime(substr($action_row['date_sched'],0,10)) ;
			$obj_date_interval = date_diff($obj_datetime_now,$obj_datetime_sched);
			$eta_days = (int)($obj_date_interval->format('%R%a')) ;
				// range
				$eta_range_target = NULL ;
				foreach( $map_etaRange_maxDays as $eta_range => $upto_days ) {
					if( $eta_days < $upto_days ) {
						$eta_range_target = $eta_range ;
						break ;
					}
				}
			$action_row['calc_eta_range'] = $eta_range_target ;
		}
		unset( $action_row ) ;
		
		foreach( $file_row['actions'] as $action_row ) {
			if( $action_row['status_is_ok'] || !specRsiRecouveo_file_tool_isDateValid($action_row['date_sched']) ) {
				continue ;
			}
			if( !$next_action || $action_row['date_sched'] < $next_action['date_sched'] ) {
				$next_action = $action_row ;
			}
		}
		foreach( $file_row['records'] as $record_row ) {
			if( $record_row['clear_is_on'] ) {
				continue ;
			}
			if( $record_row['amount'] > 0 ) {
				$inv_header['inv_nb']++ ;
				$inv_header['inv_amount_total'] += $record_row['amount'] ;
			}
			$inv_header['inv_amount_due'] += $record_row['amount'] ;
		}
		
		
		if( $next_action ) {
			$file_row += array(
				'next_fileaction_filerecord_id' => $next_action['fileaction_filerecord_id'],
				'next_action' => $next_action['link_action'],
				'next_date' => $next_action['date_sched']
			);
		}
		$file_row += $inv_header ;
	}
	unset($file_row) ;
	
	
	return array('success'=>true, 'data'=>array_values($TAB_files)) ;
}

function specRsiRecouveo_file_setHeader( $post_data ) {
	global $_opDB ;
	
	$file_filerecord_id = $post_data['file_filerecord_id'] ;
	$ttmp = specRsiRecouveo_file_getRecords( array(
		'filter_fileFilerecordId_arr' => json_encode(array($file_filerecord_id))
	)) ;
	$file_record = $ttmp['data'][0] ;
	if( $file_record['file_filerecord_id'] != $file_filerecord_id ) {
		return array('success'=>false) ;
	}
	
	$link_account = $file_record['acc_id'] ;
	
	$post_record = json_decode($post_data['data'],true) ;
	
	$file_code = 'ADR_POSTAL' ;
	$existing_ids = array() ;
	foreach( $file_record['adr_postal'] as $adrpostal_record ) {
		$existing_ids[] = $adrpostal_record['adrpostal_filerecord_id'] ;
	}
	$new_ids = array() ;
	foreach( $post_record['adr_postal'] as $adrpostal_record ) {
		$arr_ins = array() ;
		$arr_ins['field_ACC_ID'] = $link_account ;
		$arr_ins['field_ADR_NAME'] = $adrpostal_record['adr_name'] ;
		$arr_ins['field_ADR_POSTAL'] = $adrpostal_record['adr_postal_txt'] ;
		$arr_ins['field_STATUS'] = ( $adrpostal_record['status'] ? 1 : 0 ) ;
		if( in_array($adrpostal_record['adrpostal_filerecord_id'], $existing_ids) ) {
			$new_ids[] = $adrpostal_record['adrpostal_filerecord_id'] ;
			paracrm_lib_data_updateRecord_file( $file_code, $arr_ins, $adrpostal_record['adrpostal_filerecord_id']);
		} else {
			$new_ids[] = paracrm_lib_data_insertRecord_file( $file_code, 0, $arr_ins );
		}
	}
	$to_delete = array_diff($existing_ids,$new_ids) ;
	foreach( $to_delete as $filerecord_id ) {
		paracrm_lib_data_deleteRecord_file( $file_code, $filerecord_id );
	}
	
	$file_code = 'ADR_TEL' ;
	$existing_ids = array() ;
	foreach( $file_record['adr_tel'] as $adrtel_record ) {
		$existing_ids[] = $adrtel_record['adrtel_filerecord_id'] ;
	}
	$new_ids = array() ;
	foreach( $post_record['adr_tel'] as $adrtel_record ) {
		$arr_ins = array() ;
		$arr_ins['field_ACC_ID'] = $link_account ;
		$arr_ins['field_ADR_NAME'] = $adrtel_record['adr_name'] ;
		$arr_ins['field_ADR_TEL'] = $adrtel_record['adr_tel_txt'] ;
		$arr_ins['field_STATUS'] = ( $adrtel_record['status'] ? 1 : 0 ) ;
		if( in_array($adrtel_record['adrtel_filerecord_id'], $existing_ids) ) {
			$new_ids[] = $adrtel_record['adrtel_filerecord_id'] ;
			paracrm_lib_data_updateRecord_file( $file_code, $arr_ins, $adrtel_record['adrtel_filerecord_id']);
		} else {
			$new_ids[] = paracrm_lib_data_insertRecord_file( $file_code, 0, $arr_ins );
		}
	}
	$to_delete = array_diff($existing_ids,$new_ids) ;
	foreach( $to_delete as $filerecord_id ) {
		paracrm_lib_data_deleteRecord_file( $file_code, $filerecord_id );
	}
	

	return array('success'=>true,'id'=>$file_filerecord_id) ;
}

function specRsiRecouveo_file_setAction( $post_data ) {
	global $_opDB ;
	
	$file_filerecord_id = $post_data['file_filerecord_id'] ;
	$ttmp = specRsiRecouveo_file_getRecords( array(
		'filter_fileFilerecordId_arr' => json_encode(array($file_filerecord_id))
	)) ;
	$file_record = $ttmp['data'][0] ;
	if( $file_record['file_filerecord_id'] != $file_filerecord_id ) {
		return array('success'=>false) ;
	}
	
	$post_form = json_decode($post_data['data'],true) ;
	$file_code = 'FILE_ACTION' ;
	
	switch( $post_form['action_id'] ) {
		case 'AGREE_START' :
			if( !$post_form['agree_period'] ) {
				return array('success'=>false) ;
			}
			$txt = array() ;
			$txt[]= 'Promesse réglement '.$post_form['agree_period'] ;
			$txt[]= 'Montant total : '.$post_form['inv_amount_due'].' €' ;
			
			$arr_ins = array() ;
			$arr_ins['field_STATUS_IS_OK'] = 1 ;
			$arr_ins['field_DATE_ACTUAL'] = date('Y-m-d H:i:s') ;
			$arr_ins['field_LINK_STATUS'] = 'S2P_PAY' ;
			$arr_ins['field_LINK_ACTION'] = 'AGREE_START' ;
			$arr_ins['field_TXT'] = trim(implode("\r\n",$txt)) ;
			paracrm_lib_data_insertRecord_file($file_code,$file_filerecord_id,$arr_ins) ;
			
			switch( $post_form['agree_period'] ) {
				case 'MONTH' :
				case 'WEEK' :
					$nb = $post_form['agree_count'] ;
					$date = $post_form['agree_first'] ;
					$amount_each = round($post_form['inv_amount_due'] / $nb,2) ;
					break ;
				case 'SINGLE' :
					$nb = 1 ;
					$date = $post_form['agree_date'] ;
					$amount_each = round($post_form['inv_amount_due'] / $nb,2) ;
					break ;
				default :
					break ;
			}
			for( $i=0 ; $i<$nb ; $i++ ) {
				$arr_ins = array() ;
				$arr_ins['field_STATUS_IS_OK'] = 0 ;
				$arr_ins['field_DATE_SCHED'] = $date ;
				$arr_ins['field_LINK_STATUS'] = 'S2P_PAY' ;
				$arr_ins['field_LINK_ACTION'] = 'AGREE_FOLLOW' ;
				$arr_ins['field_TXT'] = 'Attendu : '.$amount_each.' €' ;
				paracrm_lib_data_insertRecord_file($file_code,$file_filerecord_id,$arr_ins) ;
				
				switch( $post_form['agree_period'] ) {
					case 'MONTH' :
						$date = date('Y-m-d',strtotime('+1 month',strtotime($date))) ;
						break ;
					case 'WEEK' :
						$date = date('Y-m-d',strtotime('+1 month',strtotime($date))) ;
						break ;
				}
			}
			
			break ;
		
	
	
	}
	

	return array('success'=>true,'id'=>$fileaction_filerecord_id) ;
}




function specRsiRecouveo_file_searchSuggest( $post_data ) {
	global $_opDB ;
	/*
	* Recherche
	*  - no client
	*  - nom client
	*  - SIRET
	*  - adresse / no tel
	*/
	$filter_atr = array() ;
	if( $post_data['filter_atr'] ) {
		$filter_atr = json_decode($post_data['filter_atr'],true) ;
	}
	$sub_query = "SELECT filerecord_id FROM view_file_FILE WHERE 1" ;
	foreach( $filter_atr as $mkey => $mvalue ) {
		$sub_query.= " AND f.field_{$mkey} = '$mvalue'" ;
	}
	
	$search_txt = $post_data['search_txt'] ;
	
	$tab_result = array() ;
	
	$query = "SELECT filerecord_id, f.field_FILE_ID FROM view_file_FILE f
				INNER JOIN view_bible_LIB_ACCOUNT_entry la ON la.entry_key=f.field_LINK_ACCOUNT
				WHERE f.filerecord_id IN ({$sub_query})
				AND la.entry_key LIKE '%{$search_txt}%'
				LIMIT 10" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$res_value = $arr[1] ;
		
		$idx_start = strpos($res_value,$search_txt) ;
		$idx_end = $idx_start + strlen($search_txt) ;
		
		$res_value = substr($res_value,0,$idx_start).'<b>'.substr($res_value,$idx_start,$idx_end-$idx_start).'</b>'.substr($res_value,$idx_end) ;
		
		$tab_result[] = array(
			'file_filerecord_id' => $arr[0],
			'id_ref' => $arr[1],
			'result_property' => 'Acheteur',
			'result_value' => $res_value
		);
	}
	
	$query = "SELECT filerecord_id, f.field_FILE_ID, la.field_ACC_NAME FROM view_file_FILE f
				INNER JOIN view_bible_LIB_ACCOUNT_entry la ON la.entry_key=f.field_LINK_ACCOUNT
				WHERE f.filerecord_id IN ({$sub_query})
				AND la.field_ACC_NAME LIKE '%{$search_txt}%'
				LIMIT 10" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$res_value = $arr[2] ;
		
		$idx_start = strpos($res_value,$search_txt) ;
		$idx_end = $idx_start + strlen($search_txt) ;
		
		$res_value = substr($res_value,0,$idx_start).'<b>'.substr($res_value,$idx_start,$idx_end-$idx_start).'</b>'.substr($res_value,$idx_end) ;
		
		$tab_result[] = array(
			'file_filerecord_id' => $arr[0],
			'id_ref' => $arr[1],
			'result_property' => 'Acheteur',
			'result_value' => $res_value
		);
	}
	
	$query = "SELECT filerecord_id, f.field_FILE_ID, la.field_ACC_SIRET FROM view_file_FILE f
				INNER JOIN view_bible_LIB_ACCOUNT_entry la ON la.entry_key=f.field_LINK_ACCOUNT
				WHERE f.filerecord_id IN ({$sub_query})
				AND la.field_ACC_SIRET LIKE '%{$search_txt}%'
				LIMIT 10" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$res_value = $arr[2] ;
		
		$idx_start = strpos($res_value,$search_txt) ;
		$idx_end = $idx_start + strlen($search_txt) ;
		
		$res_value = substr($res_value,0,$idx_start).'<b>'.substr($res_value,$idx_start,$idx_end-$idx_start).'</b>'.substr($res_value,$idx_end) ;
		
		$tab_result[] = array(
			'file_filerecord_id' => $arr[0],
			'id_ref' => $arr[1],
			'result_property' => 'Siret',
			'result_value' => $res_value
		);
	}

	
	$query = "SELECT f.filerecord_id, f.field_FILE_ID, REPLACE(REPLACE(at.field_ADR_TEL,'.',''),' ','') as searchval FROM view_file_FILE f
				INNER JOIN view_file_ADR_TEL at ON at.field_ACC_ID=f.field_LINK_ACCOUNT
				WHERE f.filerecord_id IN ({$sub_query})
				AND REPLACE(REPLACE(at.field_ADR_TEL,'.',''),' ','') LIKE '%{$search_txt}%'
				LIMIT 10" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$res_value = $arr[2] ;
		
		$idx_start = strpos($res_value,$search_txt) ;
		$idx_end = $idx_start + strlen($search_txt) ;
		
		$res_value = substr($res_value,0,$idx_start).'<b>'.substr($res_value,$idx_start,$idx_end-$idx_start).'</b>'.substr($res_value,$idx_end) ;
		
		$tab_result[] = array(
			'file_filerecord_id' => $arr[0],
			'id_ref' => $arr[1],
			'result_property' => 'No Tel',
			'result_value' => $res_value
		);
	}

	return array('success'=>true, 'data'=>$tab_result) ;
}




function specRsiRecouveo_file_tool_isDateValid( $date_sql )
{
	if( $date_sql == '0000-00-00' )
		return FALSE ;
	if( $date_sql == '0000-00-00 00:00:00' )
		return FALSE ;
	if( !$date_sql )
		return FALSE ;
	return TRUE ;
}
?>
