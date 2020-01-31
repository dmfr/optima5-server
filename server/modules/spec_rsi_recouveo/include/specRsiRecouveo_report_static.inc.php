<?php

function specRsiRecouveo_report_getFileTopRecords( $post_data ) {
	global $_opDB ;
	
	if( $post_data['filter_soc'] ) {
		$filter_soc = json_decode($post_data['filter_soc'],true) ;
	}
	if( $post_data['filter_limit'] ) {
		$filter_limit = $post_data['filter_limit'] ;
	}
	
	if( !$filter_limit ) {
		return array('success'=>false) ;
	}
	
	$group_map = array() ;
	$query = "SELECT f.field_LINK_ACCOUNT as acc_id, sum(r.field_AMOUNT) as inv_amount_total
				FROM view_file_FILE f
				JOIN view_file_RECORD_LINK rl ON rl.field_LINK_FILE_ID=f.filerecord_id AND rl.field_LINK_IS_ON='1'
				JOIN view_file_RECORD r ON r.filerecord_id=rl.filerecord_parent_id
				JOIN view_bible_LIB_ACCOUNT_entry la ON la.entry_key = f.field_LINK_ACCOUNT
				WHERE r.field_AMOUNT>'0' AND f.field_STATUS_CLOSED_VOID='0' AND field_STATUS_CLOSED_END='0'" ;
	if( $filter_soc ) {
		$query.= " AND la.treenode_key IN ".$_opDB->makeSQLlist($filter_soc) ;
	}
	$query.= " GROUP BY f.field_LINK_ACCOUNT
				ORDER BY inv_amount_total DESC
				LIMIT {$filter_limit}" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$acc_id = $arr['acc_id'] ;
		$inv_amount_total = $arr['inv_amount_total'] ;
		$group_map[$acc_id] = (float)$inv_amount_total ;
	}
	
	$list_accIds = $_opDB->makeSQLlist(array_keys($group_map)) ;
	$filter_fileFilerecordId_list = array() ;
	$query = "SELECT f.filerecord_id FROM view_file_FILE f
				WHERE f.field_STATUS_CLOSED_VOID='0' AND f.field_STATUS_CLOSED_END='0' AND f.field_LINK_ACCOUNT IN {$list_accIds}" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$filter_fileFilerecordId_list[] = $arr[0] ;
	}
	
	$json = specRsiRecouveo_file_getRecords( array(
		'filter_fileFilerecordId_arr' => json_encode($filter_fileFilerecordId_list)
	)) ;
	foreach( $json['data'] as &$row ) {
		$acc_id = $row['acc_id'] ;
		$row['_accInvAmountTotal'] = $group_map[$acc_id] ;
	}
	unset($row) ;
	$usort = function($arr1,$arr2)
	{
		return (-1 * ($arr1['_accInvAmountTotal'] - $arr2['_accInvAmountTotal'])) ;
	};
	usort($json['data'],$usort) ;
	$json['debug'] = $group_map ;
	
	return $json ;
}

function specRsiRecouveo_report_getUsers( $post_data ) {
	global $_opDB ;
	
	$p_filters = json_decode($post_data['filters'],true) ;
	
	
	
	
	
	
	
	
	// filter post parameters
	$filter_atr = $p_filters['filter_atr'];
	$filter_soc = $p_filters['filter_soc'];
	$filter_account = $p_filters['filter_account'];
	$filter_user = $p_filters['filter_user'];
	$filter_date = $p_filters['filter_date'];
	$ttmp = specRsiRecouveo_cfg_getConfig();
	$cfg_atr = $ttmp['data']['cfg_atr'];
	
	// build filter on account
	$where_clause = '' ;
	if ($filter_atr) {
		foreach ($cfg_atr as $atr_record) {
			$atr_id = $atr_record['atr_id'];
			$atr_dbfield = 'field_' . $atr_record['atr_field'];
			switch ($atr_record['atr_type']) {
				case 'account' :
					$atr_dbalias = 'la';
					break;
				default :
					continue 2;
			}
			$join_tables['la'] = TRUE ;
			if ($filter_atr[$atr_id]) {
				$mvalue = $filter_atr[$atr_id];
				$where_clause.= " AND {$atr_dbalias}.{$atr_dbfield} IN " . $_opDB->makeSQLlist($mvalue);
			}
		}
	}
	if ($filter_soc) {
		$join_tables['la'] = TRUE ;
		$where_clause.= " AND la.treenode_key IN " . $_opDB->makeSQLlist($filter_soc);
	}
	if ($filter_account) {
		$join_tables['la'] = TRUE ;
		$where_clause.= " AND la.entry_key IN " . $_opDB->makeSQLlist($filter_account);
	}
	
	
	
	
	
	
	$TAB_userId_row = array() ;
	
	$query = "SELECT entry_key,field_USER_ID, field_USER_FULLNAME
				FROM view_bible_USER_entry
				WHERE 1 AND field_STATUS_IS_EXT<>'1'" ;
	if( $filter_user ) {
		$where_clause.= " AND field_USER_ID IN " . $_opDB->makeSQLlist($filter_user);
	}
	$query.= " ORDER BY entry_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB_userId_row[$arr['entry_key']] = array(
			'user_id' => $arr['field_USER_ID'],
			'user_fullname' => $arr['field_USER_FULLNAME'],
			'inv_balage' => array()
		);
	}
	
	
	
	
	/*
	 * Tables bases
	 */
	$view_file_FILE_ACTION = "SELECT fa.* FROM view_file_FILE_ACTION fa 
						JOIN view_file_FILE f ON f.filerecord_id=fa.filerecord_parent_id
						JOIN view_bible_LIB_ACCOUNT_entry la ON la.entry_key=f.field_LINK_ACCOUNT 
						WHERE 1" ;
	if( $filter_date['date_start'] ) {
		$view_file_FILE_ACTION.= " AND DATE(fa.field_DATE_ACTUAL)>='{$filter_date['date_start']}'" ;
	}
	if( $filter_date['date_end'] ) {
		$view_file_FILE_ACTION.= " AND DATE(fa.field_DATE_ACTUAL)<='{$filter_date['date_end']}'" ;
	}
	$view_file_FILE_ACTION.= $where_clause ;
	
	
	$view_file_RECORD = "SELECT r.* FROM view_file_RECORD r 
						JOIN view_bible_LIB_ACCOUNT_entry la ON la.entry_key=r.field_LINK_ACCOUNT 
						WHERE 1" ;
	if( $filter_date['date_start'] ) {
		$view_file_RECORD.= " AND DATE(r.field_DATE_RECORD)>='{$filter_date['date_start']}'" ;
	}
	if( $filter_date['date_end'] ) {
		$view_file_RECORD.= " AND DATE(r.field_DATE_RECORD)<='{$filter_date['date_end']}'" ;
	}
	$view_file_RECORD.= $where_clause ;
	
	
	
	
	
	/* Compteur actions 
	 * - Appels sortants   : com_mailout
	 * - Courriers manuels : com_callout
	 */ 
	$query = "SELECT fa.field_LOG_USER, count(*)
				FROM ({$view_file_FILE_ACTION}) fa
				JOIN view_file_FILE f ON f.filerecord_id=fa.filerecord_parent_id
				WHERE fa.field_LOG_USER<>'' AND fa.field_LINK_ACTION='CALL_OUT'
				GROUP BY fa.field_LOG_USER" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$user_arr = explode('@',$arr[0]) ;
		$user_id = $user_arr[0] ;
		if( !$TAB_userId_row[$user_id] ) {
			continue ;
		}
		
		$count = $arr[1] ;
		
		if( !isset($TAB_userId_row[$user_id]['com_callout']) ) {
			$TAB_userId_row[$user_id]['com_callout'] = 0 ;
		}
		$TAB_userId_row[$user_id]['com_callout'] += $count ;
	}
	
	$query = "SELECT fa.field_LOG_USER, count(*)
				FROM ({$view_file_FILE_ACTION}) fa
				JOIN view_file_FILE f ON f.filerecord_id=fa.filerecord_parent_id
				JOIN view_bible_LIB_ACCOUNT_entry la ON la.entry_key=f.field_LINK_ACCOUNT
				LEFT OUTER JOIN view_bible_TPL_entry bt ON bt.entry_key=fa.field_LINK_TPL
				WHERE fa.field_LOG_USER<>'' AND fa.field_LINK_ACTION='MAIL_OUT' AND bt.field_MANUAL_IS_ON='1'
				GROUP BY fa.field_LOG_USER" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$user_arr = explode('@',$arr[0]) ;
		$user_id = $user_arr[0] ;
		if( !$TAB_userId_row[$user_id] ) {
			continue ;
		}
		
		$count = $arr[1] ;
		
		if( !isset($TAB_userId_row[$user_id]['com_mailout']) ) {
			$TAB_userId_row[$user_id]['com_mailout'] = 0 ;
		}
		$TAB_userId_row[$user_id]['com_mailout'] += $count ;
	}
	
	
	
	
	
	/* Résolution
	 * 
	 *
	 */
	$_skip_accuser = !in_array( 'view_stat_scope_accuser', $_opDB->db_tables() ) ;
	if( !$_skip_accuser ) {
	$query = "SELECT map.log_user, sum(r.field_AMOUNT * (map.nb_actions_account_user / map.nb_actions_account))
				FROM ({$view_file_RECORD}) r
				JOIN view_stat_scope_accuser map ON map.acc_id=r.field_LINK_ACCOUNT
				WHERE r.field_TYPE IN ('LOCAL','REMOTE')
				GROUP BY map.log_user" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$user_arr = explode('@',$arr[0]) ;
		$user_id = $user_arr[0] ;
		if( !$TAB_userId_row[$user_id] ) {
			continue ;
		}
		
		$amount = $arr[1] ;
		$amount = (-1 * $amount) ;
		
		if( !isset($TAB_userId_row[$user_id]['res_PAY']) ) {
			$TAB_userId_row[$user_id]['res_PAY'] = 0 ;
		}
		$TAB_userId_row[$user_id]['res_PAY'] += $amount ;
	}
	
	$query = "SELECT map.log_user, sum(r.field_AMOUNT * (map.nb_actions_account_user / map.nb_actions_account))
				FROM ({$view_file_RECORD}) r
				JOIN view_stat_scope_accuser map ON map.acc_id=r.field_LINK_ACCOUNT
				WHERE r.field_TYPE IN ('CI','DR','STOP')
				GROUP BY map.log_user" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$user_arr = explode('@',$arr[0]) ;
		$user_id = $user_arr[0] ;
		if( !$TAB_userId_row[$user_id] ) {
			continue ;
		}
		
		$amount = $arr[1] ;
		$amount = (-1 * $amount) ;
		
		if( !isset($TAB_userId_row[$user_id]['res_AVR']) ) {
			$TAB_userId_row[$user_id]['res_AVR'] = 0 ;
		}
		$TAB_userId_row[$user_id]['res_AVR'] += $amount ;
	}
	
	$query = "SELECT map.log_user, sum(r.field_AMOUNT * (map.nb_actions_account_user / map.nb_actions_account))
				FROM ({$view_file_RECORD}) r
				JOIN view_stat_scope_accuser map ON map.acc_id=r.field_LINK_ACCOUNT
				WHERE r.field_TYPE IN (' ') AND r.field_AMOUNT<'0'
				GROUP BY map.log_user" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$user_arr = explode('@',$arr[0]) ;
		$user_id = $user_arr[0] ;
		if( !$TAB_userId_row[$user_id] ) {
			continue ;
		}
		
		$amount = $arr[1] ;
		$amount = (-1 * $amount) ;
		
		if( !isset($TAB_userId_row[$user_id]['res_misc']) ) {
			$TAB_userId_row[$user_id]['res_misc'] = 0 ;
		}
		$TAB_userId_row[$user_id]['res_misc'] += $amount ;
	}
	}
	
	
	/* Retards
	 * 
	 *
	 */
	$query = "SELECT la.field_LINK_USER_LOCAL, f.field_STATUS, count(*)
				FROM view_file_FILE_ACTION fa
				JOIN view_file_FILE f ON f.filerecord_id=fa.filerecord_parent_id
				JOIN view_bible_LIB_ACCOUNT_entry la ON la.entry_key = f.field_LINK_ACCOUNT
				WHERE fa.field_STATUS_IS_OK='0' AND DATE(fa.field_DATE_SCHED)<DATE(NOW())
				AND f.field_STATUS_CLOSED_VOID='0' AND f.field_STATUS_CLOSED_END='0'
				GROUP BY la.field_LINK_USER_LOCAL, f.field_STATUS" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$user_arr = explode('@',$arr[0]) ;
		$user_id = $user_arr[0] ;
		if( !$TAB_userId_row[$user_id] ) {
			continue ;
		}
		
		$status = $arr[1] ;
		
		$count = $arr[2] ;
		
		$mkey = '' ;
		switch( $status ) {
			case 'S1_OPEN' :
			case 'S1_SEARCH' :
				$mkey = 'delay_open' ;
				break ;
				
			case 'S2P_PAY' :
				$mkey = 'delay_pay' ;
				break ;
				
			case 'S2J_JUDIC' :
			case 'S2L_LITIG' :
				$mkey = 'delay_litig' ;
				break ;
				
			default :
				break ;
		}
		
		if( $mkey ) {
			if( !isset($TAB_userId_row[$user_id][$mkey]) ) {
				$TAB_userId_row[$user_id][$mkey] = 0 ;
			}
			$TAB_userId_row[$user_id][$mkey] += $count ;
		}
	}
	
	
	
	/*
	* Balance agée
	*/
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_balage = $ttmp['data']['cfg_balage'] ;
	
	$map_balageSegmt_fromDays = array() ;
	foreach( $cfg_balage as $row ) {
		$map_balageSegmt_fromDays[$row['segmt_id']] = (int)$row['calc_from_days'] ;
	}
	arsort($map_balageSegmt_fromDays) ;
	
	foreach( $TAB_userId_row as $user_id => $dummy ) {
		foreach( $map_balageSegmt_fromDays as $segmt_id => $fromDays ) {
			$TAB_userId_row[$user_id]['inv_balage'][$segmt_id] = 0 ;
		}
	}
	
	$json = specRsiRecouveo_file_getRecords(array()) ;
	foreach( $json['data'] as $accountFile_row ) {
		if( $accountFile_row['status_closed_void'] || $accountFile_row['status_closed_end'] ) {
			continue ;
		}
		$user_id = $accountFile_row['link_user'] ;
		if( !$TAB_userId_row[$user_id] ) {
			continue ;
		}
		if( !$TAB_userId_row[$user_id]['inv_balage'] ) {
			$TAB_userId_row[$user_id]['inv_balage'] = array() ;
		}
		
		foreach( $accountFile_row['inv_balage'] as $mkey=>$mvalue ) {
			if( !$TAB_userId_row[$user_id]['inv_balage'][$mkey] ) {
				$TAB_userId_row[$user_id]['inv_balage'][$mkey] = 0 ;
			}
			$TAB_userId_row[$user_id]['inv_balage'][$mkey] += $mvalue ;
		}
	}
	
	
	
	return array('success'=>true, 'data'=>array_values($TAB_userId_row)) ;
}



function specRsiRecouveo_report_getUserActions( $post_data ) {
	global $_opDB ;
	
	$p_filters = json_decode($post_data['filters'],true) ;
	
	
	
	// filter post parameters
	$filter_atr = $p_filters['filter_atr'];
	$filter_soc = $p_filters['filter_soc'];
	$filter_account = $p_filters['filter_account'];
	$filter_user = $p_filters['filter_user'];
	$filter_date = $p_filters['filter_date'];
	$ttmp = specRsiRecouveo_cfg_getConfig();
	$cfg_atr = $ttmp['data']['cfg_atr'];
	
	// build filter on account
	$where_clause = '' ;
	if ($filter_atr) {
		foreach ($cfg_atr as $atr_record) {
			$atr_id = $atr_record['atr_id'];
			$atr_dbfield = 'field_' . $atr_record['atr_field'];
			switch ($atr_record['atr_type']) {
				case 'account' :
					$atr_dbalias = 'la';
					break;
				default :
					continue 2;
			}
			$join_tables['la'] = TRUE ;
			if ($filter_atr[$atr_id]) {
				$mvalue = $filter_atr[$atr_id];
				$where_clause.= " AND {$atr_dbalias}.{$atr_dbfield} IN " . $_opDB->makeSQLlist($mvalue);
			}
		}
	}
	if ($filter_soc) {
		$join_tables['la'] = TRUE ;
		$where_clause.= " AND la.treenode_key IN " . $_opDB->makeSQLlist($filter_soc);
	}
	if ($filter_account) {
		$join_tables['la'] = TRUE ;
		$where_clause.= " AND la.entry_key IN " . $_opDB->makeSQLlist($filter_account);
	}
	
	
	
	
	
	
	$TAB_userId_row = array() ;
	
	$query = "SELECT entry_key,field_USER_ID, field_USER_FULLNAME
				FROM view_bible_USER_entry
				WHERE 1 AND field_STATUS_IS_EXT<>'1'" ;
	if( $filter_user ) {
		$where_clause.= " AND field_USER_ID IN " . $_opDB->makeSQLlist($filter_user);
	}
	$query.= " ORDER BY entry_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB_userId_row[$arr['entry_key']] = array(
			'user_id' => $arr['field_USER_ID'],
			'user_fullname' => $arr['field_USER_FULLNAME'],
			'inv_balage' => array()
		);
	}
	
	
	
	
	/*
	 * Tables bases
	 */
	$view_file_FILE_ACTION = "SELECT fa.* FROM view_file_FILE_ACTION fa 
						JOIN view_file_FILE f ON f.filerecord_id=fa.filerecord_parent_id
						JOIN view_bible_LIB_ACCOUNT_entry la ON la.entry_key=f.field_LINK_ACCOUNT 
						WHERE 1 AND fa.field_STATUS_IS_OK='1'" ;
	if( $filter_date['date_start'] ) {
		$view_file_FILE_ACTION.= " AND DATE(fa.field_DATE_ACTUAL)>='{$filter_date['date_start']}'" ;
	}
	if( $filter_date['date_end'] ) {
		$view_file_FILE_ACTION.= " AND DATE(fa.field_DATE_ACTUAL)<='{$filter_date['date_end']}'" ;
	}
	$view_file_FILE_ACTION.= $where_clause ;
	/****/
	
	
	
	$lib_actions = array(
		'AGREE_FOLLOW' => 'Suivi promesse',
		'AGREE_START' => 'Création promesse',
		'BUMP' => 'Reprise dossier',
		'CALL_IN' => 'Appel entrant',
		'CALL_OUT' => 'Appel sortant',
		'CLOSE_ASK' => 'Proposition clôture',
		'CLOSE_ACK' => 'Clotûre dossier',
		'EMAIL_IN' => 'Email entrant',
		'EMAIL_OUT' => 'Email sortant',
		'JUDIC_START' => 'Action judiciaire',
		'JUDIC_FOLLOW' => 'Suivi action judiciaire',
		'LITIG_FOLLOW' => 'Suivi action externe',
		'LITIG_START' => 'Action externe',
		'MAIL_IN' => 'Courrier entrant',
		'MAIL_OUT' => 'Courrier sortant',
		'SMS_OUT' => 'SMS'
	);
	$lib_groups = array(
		'S01' => 'En-cours',
		'S2L_LITIG' => 'Act° ext.',
		'SX_CLOSE' => 'Clôture',
		'S2J_JUDIC' => 'Judiciaire',
		'S2P_PAY' => 'Paiement'
	);
	
	$map_status_group = array(
		'S01' => array('S0_PRE','S1_OPEN','S1_SEARCH'),
		'S2L_LITIG' => array('S2L_LITIG'),
		'SX_CLOSE' => array('SX_CLOSE'),
		'S2J_JUDIC' => array('S2J_JUDIC'),
		'S2P_PAY' => array('S2P_PAY')
	);
	$mapReverse_status_group = array() ;
	$tmp_actions = array() ;
	$tmp_status_actions = array() ;
	foreach( $map_status_group as $group_id => $statuses ) {
		$tmp_status_actions[$group_id] = array() ;
		foreach( $statuses as $status_code ) {
			$mapReverse_status_group[$status_code] = $group_id ;
		}
	}
	
	$query = "SELECT fa.field_LOG_USER as user_str
				, f.field_STATUS as status_code
				, fa.field_LINK_ACTION as action_code
				, count(*) as cnt 
				FROM ($view_file_FILE_ACTION) fa
				JOIN view_file_FILE f ON f.filerecord_id=fa.filerecord_parent_id
				WHERE field_LINK_NEW_FILE_ID='0' AND field_STATUS_IS_OK='1' 
				group by fa.field_LOG_USER, f.field_STATUS, fa.field_LINK_ACTION" ;
	$result = $_opDB->query($query) ;
	
	$_opDB->reset_result($result) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$status_code = $arr['status_code'] ;
		$action_code = $arr['action_code'] ;
		
		$group_id = $mapReverse_status_group[$status_code];
		if( !$group_id ) {
			continue ;
		}
		if( !isset($tmp_status_actions[$group_id]) ) {
			$tmp_status_actions[$group_id] = array() ;
		}
		if( !in_array($action_code,$tmp_status_actions[$group_id]) ) {
			$tmp_status_actions[$group_id][] = $action_code ;
		}
		if( !in_array($action_code,$tmp_actions) ) {
			$tmp_actions[] = $action_code ;
		}
	}
	
	
	$columns = array() ;
	foreach( $tmp_status_actions as $group_id => $actions ) {
		sort($actions) ;
		foreach( $actions as $action_code ) {
			$columns[] = array(
				'group_id' => $group_id,
				'group_txt' => $lib_groups[$group_id],
				'col_id' => 'val_'.$group_id.'%'.$action_code,
				'col_txt' => $lib_actions[$action_code]
			);
		}
		$columns[] = array(
			'group_id' => $group_id,
			'group_txt' => $lib_groups[$group_id],
			'group_sum' => true,
			'col_id' => 'val_'.$group_id.'%'.'*',
			'col_txt' => 'Total'.' '.$lib_groups[$group_id]
		);
	}
	sort($tmp_actions) ;
	foreach( $tmp_actions as $action_code ) {
		$columns[] = array(
			'group_id' => '*',
			'group_txt' => 'Tous statuts',
			'col_id' => 'val_'.'*'.'%'.$action_code,
			'col_txt' => $lib_actions[$action_code]
		);
	}
	$columns[] = array(
		'group_id' => '*',
		'group_txt' => 'Tous statuts',
		'group_sum' => true,
		'col_id' => 'val_'.'*'.'%'.'*',
		'col_txt' => 'Total'
	);
	
	
	
	$_opDB->reset_result($result) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$ttmp = explode('@',$arr['user_str']) ;
		$user_id = $ttmp[0] ;
		$status_code = $arr['status_code'] ;
		$action_code = $arr['action_code'] ;
		
		$group_id = $mapReverse_status_group[$status_code];
		if( !$group_id ) {
			continue ;
		}
		
		if( !isset($TAB_userId_row[$user_id]) ) {
			continue ;
		}
		$vals = array(
			'val_'.$group_id.'%'.$action_code,
			'val_'.$group_id.'%'.'*',
			'val_'.'*'.'%'.$action_code,
			'val_'.'*'.'%'.'*'
		) ;
		foreach( $vals as $val ) {
			if( !isset($TAB_userId_row[$user_id][$val]) ) {
				$TAB_userId_row[$user_id][$val] = 0 ;
			}
			$TAB_userId_row[$user_id][$val] += $arr['cnt'] ;
		}
	}
	
	
	return array('success'=>true, 'data'=>array_values($TAB_userId_row), 'columns'=>$columns) ;
}





function specRsiRecouveo_report_getCash( $post_data ) {
	global $_opDB ;
	
	$p_filters = json_decode($post_data['filters'],true) ;
	$p_dateStart = $p_filters['filter_date']['date_start'] ;
	$p_dateEnd = $p_filters['filter_date']['date_end'] ;
	
	if( !$p_dateStart || !$p_dateEnd ) {
		return array('success'=>true, 'data'=>array()) ;
	}
	if( $p_dateStart>$p_dateEnd ) {
		return array('success'=>true, 'data'=>array()) ;
	}
	
	$view_scope = "SELECT la.treenode_key AS field_SOC_ID, r.*
			FROM view_file_RECORD r
			JOIN view_bible_LIB_ACCOUNT_entry la ON la.entry_key=r.field_LINK_ACCOUNT
			WHERE field_STAT_SCOPE_IS_ON='1' OR (DATE(r.field_STAT_SCOPE_START)<='$p_dateEnd' AND DATE(r.field_STAT_SCOPE_END)>='$p_dateStart')" ;
	$view_instant = "SELECT la.treenode_key AS field_SOC_ID, r.*
			FROM view_file_RECORD r
			JOIN view_bible_LIB_ACCOUNT_entry la ON la.entry_key=r.field_LINK_ACCOUNT
			WHERE field_DATE_RECORD BETWEEN '$p_dateStart' AND '$p_dateEnd'" ;
			
	$map_soc_mapDateEc = array() ;
	$date_cur = $p_dateStart ;
	foreach( array($p_dateStart,$p_dateEnd) as $date_cur ) {
		// calcul encours à date
		$query = "SELECT field_SOC_ID, sum(field_AMOUNT)
					FROM ($view_scope) v
					WHERE DATE(field_STAT_SCOPE_START)>'0' AND field_STAT_SCOPE_START<='$date_cur' 
					AND (field_STAT_SCOPE_END>='$date_cur' OR field_STAT_SCOPE_IS_ON='1')
					GROUP BY field_SOC_ID" ;
		$result = $_opDB->query($query) ;
		while(($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$soc_id = $arr[0] ;
			$amount = $arr[1] ;
			$map_soc_mapDateEc[$soc_id][$date_cur] = $amount ;
		}
	}
	
	
	
	$TAB = array() ;
	foreach( $map_soc_mapDateEc as $soc_id => $mapDateEc ) {
		$TAB[$soc_id] = array(
			'group_id' => $soc_id,
			'ec_start' => $mapDateEc[$p_dateStart],
			'ec_end' => $mapDateEc[$p_dateEnd]
			//'ec_max' => max($mapDateEc)
		);
	}
	
		$query = "SELECT field_SOC_ID, sum(field_AMOUNT)
					FROM ($view_scope) v
					WHERE field_TYPE='' AND DATE(field_STAT_SCOPE_START)>'0' AND field_STAT_SCOPE_START<='$p_dateEnd' 
					AND (field_STAT_SCOPE_END>='$p_dateStart' OR field_STAT_SCOPE_IS_ON='1')
					GROUP BY field_SOC_ID" ;
		$result = $_opDB->query($query) ;
		while(($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$soc_id = $arr[0] ;
			$amount = $arr[1] ;
			$TAB[$soc_id]['scope'] = $amount ;
		}
		
		
		$query = "SELECT field_SOC_ID, field_TYPE, sum(field_AMOUNT)
					FROM ($view_instant) v
					WHERE field_TYPE<>''
					GROUP BY field_SOC_ID, field_TYPE" ;
		$result = $_opDB->query($query) ;
		while(($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$soc_id = $arr[0] ;
			$amount = $arr[2] ;
			switch( $arr[1] ) {
				case 'LOCAL' :
					$mkey='paid_LOCAL' ;
					break ;
				case 'REMOTE' :
					$mkey='paid_REMOTE' ;
					break ;
				case 'CI' :
				case 'DR' :
				case 'STOP' :
					$mkey='paid_AVR' ;
					break ;
				default :
					$mkey='paid_misc' ;
					break ;
			}
			if( !$TAB[$soc_id] ) {
				continue ;
			}
			$TAB[$soc_id][$mkey] = (-1*$amount) ;
		}
		
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_soc = $ttmp['data']['cfg_soc'] ;
	$map_socId_socTxt = array() ;
	foreach( $cfg_soc as $row ) {
		$map_socId_socTxt[$row['soc_id']] = $row['soc_name'] ;
	}
	foreach( $TAB as $soc_id => $dummy ) {
		$TAB[$soc_id]['group_txt'] = $map_socId_socTxt[$soc_id] ;
	}
	
	//print_r($map_soc_mapDateEc) ;
	
	
	
	
		$query = "SELECT field_SOC_ID, f.field_STATUS, sum(field_AMOUNT)
					FROM ($view_scope) v
					JOIN view_file_RECORD_LINK rl ON rl.filerecord_parent_id = v.filerecord_id
					JOIN view_file_FILE f ON f.filerecord_id = rl.field_LINK_FILE_ID
					WHERE field_TYPE='' AND DATE(field_STAT_SCOPE_START)>'0' AND field_STAT_SCOPE_START<='$p_dateEnd' 
					AND (field_STAT_SCOPE_END>='$p_dateStart' OR field_STAT_SCOPE_IS_ON='1')
					GROUP BY field_SOC_ID, field_STATUS" ;
		$result = $_opDB->query($query) ;
		while(($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$soc_id = $arr[0] ;
			$amount = $arr[2] ;
			
			$ttmp = explode('_',$arr[1]) ;
			
			switch( $ttmp[0] ) {
				case 'S2P' :
				case 'S2L' :
				case 'SX' :
				case 'S2T' :
					$status = 'status_'.$ttmp[0] ;
					break ;
					
				default : continue 2 ;
			}
			
			$TAB[$soc_id][$status] = $amount ;
		}
	
	
	
	
	
	return array('success'=>true, 'data'=>array_values($TAB) ) ;
}

?>
