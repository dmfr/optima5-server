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
	
	
	$TAB_userId_row = array() ;
	
	$query = "SELECT entry_key,field_USER_ID, field_USER_FULLNAME
				FROM view_bible_USER_entry
				ORDER BY entry_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB_userId_row[$arr['entry_key']] = array(
			'user_id' => $arr['field_USER_ID'],
			'user_fullname' => $arr['field_USER_FULLNAME'],
			'inv_balage' => array()
		);
	}
	
	// PREP répartition dossier > collab
	// - Nb actions : use action::log_user
	// - Retards : use file:link_user
	// - Resolution : coef calculé sur ensemble compte
	$query = "DROP TABLE IF EXISTS nbactions_by_account_user" ;
	$_opDB->query($query) ;
	$query = "CREATE TABLE nbactions_by_account_user (
					acc_id VARCHAR(50),
					log_user VARCHAR(50),
					nb_actions_account_user INT,
					nb_actions_account INT
				)";
	$_opDB->query($query) ;
	$query = "ALTER TABLE nbactions_by_account_user ADD PRIMARY KEY( acc_id, log_user )" ;
	$_opDB->query($query) ;
	
	$queryBase_accountActions = "SELECT f.field_LINK_ACCOUNT as acc_id, fa.field_LOG_USER as log_user
		FROM view_file_FILE_ACTION fa
		JOIN view_file_FILE f ON f.filerecord_id=fa.filerecord_parent_id
		WHERE fa.field_LOG_USER<>'' AND fa.field_STATUS_IS_OK='1' AND fa.field_LINK_ACTION<>'BUMP'" ;
	
	$query = "INSERT INTO nbactions_by_account_user
			SELECT base.acc_id, base.log_user, count(*), '0'
			FROM ($queryBase_accountActions) base
			GROUP BY acc_id, log_user" ;
	$_opDB->query($query) ;
	
	$query = "UPDATE nbactions_by_account_user JOIN (
		SELECT base.acc_id, count(*) as cnt
		FROM ($queryBase_accountActions) base
		GROUP BY acc_id 
	) nbactions_by_account
	ON nbactions_by_account.acc_id = nbactions_by_account_user.acc_id
	SET nbactions_by_account_user.nb_actions_account = nbactions_by_account.cnt" ;
	$_opDB->query($query) ;
	
	
	
	
	/*
	 * Tables bases
	 */
	$view_file_FILE_ACTION = "SELECT * FROM view_file_FILE_ACTION WHERE 1" ;
	if( $p_filters['date_start'] ) {
		$view_file_FILE_ACTION.= " AND DATE(field_DATE_ACTUAL)>='{$p_filters['date_start']}'" ;
	}
	if( $p_filters['date_end'] ) {
		$view_file_FILE_ACTION.= " AND DATE(field_DATE_ACTUAL)<='{$p_filters['date_end']}'" ;
	}
	
	$view_file_RECORD = "SELECT * FROM view_file_RECORD WHERE 1" ;
	if( $p_filters['date_start'] ) {
		$view_file_RECORD.= " AND DATE(field_DATE_RECORD)>='{$p_filters['date_start']}'" ;
	}
	if( $p_filters['date_end'] ) {
		$view_file_RECORD.= " AND DATE(field_DATE_RECORD)<='{$p_filters['date_end']}'" ;
	}
	
	
	
	
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
	$query = "SELECT map.log_user, sum(r.field_AMOUNT * (map.nb_actions_account_user / map.nb_actions_account))
				FROM ({$view_file_RECORD}) r
				JOIN nbactions_by_account_user map ON map.acc_id=r.field_LINK_ACCOUNT
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
				JOIN nbactions_by_account_user map ON map.acc_id=r.field_LINK_ACCOUNT
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
				JOIN nbactions_by_account_user map ON map.acc_id=r.field_LINK_ACCOUNT
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
	
	
	
	return array('success'=>true, 'debug'=>$TAB_userId_row, 'data'=>array_values($TAB_userId_row)) ;
}

function specRsiRecouveo_report_getCash( $post_data ) {
	global $_opDB ;
	
	$p_filters = json_decode($post_data['filters'],true) ;
	$p_dateStart = $p_filters['date_start'] ;
	$p_dateEnd = $p_filters['date_end'] ;
	
	if( !$p_dateStart || !$p_dateEnd ) {
		return array('success'=>true, 'data'=>array()) ;
	}
	if( $p_dateStart>$p_dateEnd ) {
		return array('success'=>true, 'data'=>array()) ;
	}
	
	$view = "SELECT la.treenode_key AS field_SOC_ID, r.*
			FROM view_file_RECORD r
			JOIN view_bible_LIB_ACCOUNT_entry la ON la.entry_key=r.field_LINK_ACCOUNT
			WHERE field_STAT_SCOPE_IS_ON='1' OR (DATE(r.field_STAT_SCOPE_START)<='$p_dateEnd' AND DATE(r.field_STAT_SCOPE_END)>='$p_dateStart')" ;
			
	$map_soc_mapDateEc = array() ;
	$date_cur = $p_dateStart ;
	while(true) {
		// calcul encours à date
		$query = "SELECT field_SOC_ID, sum(field_AMOUNT)
					FROM ($view) v
					WHERE DATE(field_STAT_SCOPE_START)>'0' AND field_STAT_SCOPE_START<='$date_cur' 
					AND (field_STAT_SCOPE_END>='$date_cur' OR field_STAT_SCOPE_IS_ON='1')
					GROUP BY field_SOC_ID" ;
		$result = $_opDB->query($query) ;
		while(($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$soc_id = $arr[0] ;
			$amount = $arr[1] ;
			$map_soc_mapDateEc[$soc_id][$date_cur] = $amount ;
		}
		
		$date_cur = date('Y-m-d',strtotime('+1 day',strtotime($date_cur))) ;
		if( $date_cur > $p_dateEnd ) {
			break ;
		}
	}
	
	
	
	$TAB = array() ;
	foreach( $map_soc_mapDateEc as $soc_id => $mapDateEc ) {
		$TAB[$soc_id] = array(
			'group_id' => $soc_id,
			'ec_start' => $mapDateEc[$p_dateStart],
			'ec_end' => $mapDateEc[$p_dateEnd],
			'ec_max' => max($mapDateEc)
		);
	}
	
		$query = "SELECT field_SOC_ID, sum(field_AMOUNT)
					FROM ($view) v
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
					FROM ($view) v
					WHERE field_TYPE<>'' AND DATE(field_STAT_SCOPE_START)>'0' AND field_STAT_SCOPE_START<='$p_dateEnd' 
					AND (field_STAT_SCOPE_END>='$p_dateStart' OR field_STAT_SCOPE_IS_ON='1')
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
	
	return array('success'=>true, 'data'=>array_values($TAB) ) ;
}























function specRsiRecouveo_report_getValuesDesc() {
	return array(
		array(
			'reportval_id' => 'calls',
			'reportval_txt' => 'Appels',
			'reportgroup_id' => 'counters',
			'timescale' => 'interval',
			'subvalues' => array(
				array(
					'reportval_id' => 'calls_out',
					'reportval_txt' => 'Appels sortants',
					'reportval_iconCls' => 'op5-spec-rsiveo-reporttile-main-icon-value-callout',
					'eval_direction' => 1
				),
				array(
					'reportval_id' => 'calls_in',
					'reportval_txt' => 'Appels entrants',
					'reportval_iconCls' => 'op5-spec-rsiveo-reporttile-main-icon-value-callin',
					'eval_direction' => 1
				)
			),
			'zoom_type' => NULL 
		),
		array(
			'reportval_id' => 'emails',
			'reportval_txt' => 'Emails',
			'reportgroup_id' => 'counters',
			'timescale' => 'interval',
			'subvalues' => array(
				array(
					'reportval_id' => 'emails_out',
					'reportval_txt' => 'Emails envoyés',
					'reportval_iconCls' => 'op5-spec-rsiveo-reporttile-main-icon-value-mailout',
					'eval_direction' => 1
				),
				array(
					'reportval_id' => 'emails_in',
					'reportval_txt' => 'Emails reçus',
					'reportval_iconCls' => 'op5-spec-rsiveo-reporttile-main-icon-value-mailin',
					'eval_direction' => 1
				)
			),
			'zoom_type' => NULL 
		),
		array(
			'reportval_id' => 'mails',
			'reportval_txt' => 'Courriers',
			'reportgroup_id' => 'counters',
			'timescale' => 'interval',
			'subvalues' => array(
				array(
					'reportval_id' => 'mails_out',
					'reportval_txt' => 'Courriers envoyés',
					'reportval_iconCls' => 'op5-spec-rsiveo-reporttile-main-icon-value-mailout',
					'eval_direction' => 1
				),
				array(
					'reportval_id' => 'mails_in',
					'reportval_txt' => 'Courriers reçus',
					'reportval_iconCls' => 'op5-spec-rsiveo-reporttile-main-icon-value-mailin',
					'eval_direction' => 1
				)
			),
			'zoom_type' => NULL 
		),
		array(
			'reportval_id' => 'wallet',
			'reportval_txt' => 'Encours',
			'reportgroup_id' => 'finance',
			'timescale' => 'milestone',
			'subvalues' => array(
				array(
					'reportval_id' => 'wallet_count',
					'reportval_txt' => 'Comptes actifs',
					'reportval_iconCls' => 'op5-spec-rsiveo-reporttile-main-icon-value-count',
					'eval_direction' => 1
				),
				array(
					'reportval_id' => 'wallet_amount',
					'reportval_txt' => 'Montant en-cours',
					'reportval_iconCls' => 'op5-spec-rsiveo-reporttile-main-icon-value-amount',
					'value_suffix' => '€',
					'eval_direction' => 1
				)
			),
		),
		array(
			'reportval_id' => 'agree',
			'reportval_txt' => 'En promesse',
			'reportgroup_id' => 'finance',
			'timescale' => 'milestone',
			'reportval_iconCls' => 'op5-spec-rsiveo-reporttile-main-icon-value-amount',
			'value_suffix' => '€',
			'eval_direction' => 1
		),
		array(
			'reportval_id' => 'cash',
			'reportval_txt' => 'Encaissements',
			'reportgroup_id' => 'finance',
			'timescale' => 'interval',
			'reportval_iconCls' => 'op5-spec-rsiveo-reporttile-main-icon-value-amount',
			'value_suffix' => '€',
			'eval_direction' => 1
		),
		array(
			'reportval_id' => 'late',
			'reportval_txt' => 'Retards',
			'reportgroup_id' => 'finance',
			'timescale' => 'milestone',
			'subvalues' => array(
				array(
					'reportval_id' => 'late_count',
					'reportval_txt' => 'Actions en retard',
					'reportval_iconCls' => 'op5-spec-rsiveo-reporttile-main-icon-value-count',
					'eval_direction' => -1
				),
				array(
					'reportval_id' => 'late_amount',
					'reportval_txt' => 'Encours en retard',
					'reportval_iconCls' => 'op5-spec-rsiveo-reporttile-main-icon-value-amount',
					'value_suffix' => '€',
					'eval_direction' => -1
				)
			),
		),
		
	
	);
}
function specRsiRecouveo_report_getTiles($post_data) {
	sleep(1) ;
	$p_filters = json_decode($post_data['filters'],true) ;
	
	$dates_main = array(
		'date_start' => $p_filters['filter_date']['date_start'],
		'date_end' => $p_filters['filter_date']['date_end']
	) ;
	$delta = round( (strtotime($dates_main['date_end'])-strtotime($dates_main['date_start'])) / (3600*24) ) ;
	$eval_date_end = date('Y-m-d',strtotime('-1 day',strtotime($dates_main['date_start']))) ;
	$eval_date_start = date('Y-m-d',strtotime("-{$delta} day",strtotime($eval_date_end))) ;
	$dates_eval = array(
		'date_start' => $eval_date_start,
		'date_end' => $eval_date_end
	) ;
	
	foreach( specRsiRecouveo_report_getValuesDesc() as $value_desc ) {
		$row = array(
			'timescale' => $value_desc['timescale'],
			'reportval_id' => $value_desc['reportval_id'],
			'reportval_txt' => $value_desc['reportval_txt'],
			
		
			'components' => array()
		) ;
		if( $value_desc['subvalues'] ) {
			foreach( $value_desc['subvalues'] as $subvalue_desc ) {
				$ttmp = specRsiRecouveo_report_run_getValues( $subvalue_desc['reportval_id'], $dates_main, $p_filters, NULL ) ;
				$value_main = reset($ttmp) ;
				$ttmp = specRsiRecouveo_report_run_getValues( $subvalue_desc['reportval_id'], $dates_eval, $p_filters, NULL ) ;
				$value_eval = reset($ttmp) ;
				
				$row['components'][] = array(
					'caption_txt' => $subvalue_desc['reportval_txt'],
					'reportval_id' => $subvalue_desc['reportval_id'],
					'reportval_txt' => $subvalue_desc['reportval_txt'],
					'main_iconCls' => $subvalue_desc['reportval_iconCls'],
					'main_value' => round($value_main),
					'main_suffix' => $subvalue_desc['value_suffix'],
					'eval_value' => round($value_eval),
					'eval_suffix' => $subvalue_desc['value_suffix'],
					'eval_direction' => specRsiRecouveo_report_toolGetEvalDirection($value_main,$value_eval,$subvalue_desc['eval_direction'])
				);
			}
		} else {
				$ttmp = specRsiRecouveo_report_run_getValues( $value_desc['reportval_id'], $dates_main, $p_filters, NULL ) ;
				$value_main = reset($ttmp) ;
				$ttmp = specRsiRecouveo_report_run_getValues( $value_desc['reportval_id'], $dates_eval, $p_filters, NULL ) ;
				$value_eval = reset($ttmp) ;
			$row['components'][] = array(
				'reportval_id' => $value_desc['reportval_id'],
				'reportval_txt' => $value_desc['reportval_txt'],
				'main_iconCls' => $value_desc['reportval_iconCls'],
				'main_value' => round($value_main),
				'main_suffix' => $value_desc['value_suffix'],
				'eval_value' => round($value_eval),
				'eval_suffix' => $value_desc['value_suffix'],
				'eval_direction' => specRsiRecouveo_report_toolGetEvalDirection($value_main,$value_eval,$value_desc['eval_direction'])
			) ;
		}
		$TAB[] = $row ;
	}
	
	return array('success'=>true, 'data'=>$TAB, 'filters'=>$p_filters) ;
}
function specRsiRecouveo_report_toolGetEvalDirection($cur_value, $eval_value, $eval_direction) {
	if( $cur_value > $eval_value ) {
		if( $eval_direction > 0 ) {
			return 'more-good' ;
		}
		if( $eval_direction < 0 ) {
			return 'more-bad' ;
		}
	}
	if( $cur_value < $eval_value ) {
		if( $eval_direction > 0 ) {
			return 'less-bad' ;
		}
		if( $eval_direction < 0 ) {
			return 'less-good' ;
		}
	}
}

function specRsiRecouveo_report_getGrid($post_data) {
	$p_filters = json_decode($post_data['filters'],true) ;
	$p_axes = json_decode($post_data['axes'],true) ;
	$p_vals = json_decode($post_data['reportval_ids'],true) ;
	
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_soc = $ttmp['data']['cfg_soc'] ;
	$cfg_user = $ttmp['data']['cfg_user'] ;
	$cfg_atr = $ttmp['data']['cfg_atr'] ;
	
	$map_user = array() ;
	foreach( $cfg_user as $user ) {
		$map_user[$user['user_id']] = $user['user_fullname'] ;
	}
	$map_soc = array() ;
	foreach( $cfg_soc as $soc ) {
		$map_soc[$soc['soc_id']] = $soc['soc_name'] ;
	}
	
	
	$map_reportval_text = array() ;
	foreach( specRsiRecouveo_report_getValuesDesc() as $row ) {
		$map_reportval_text[$row['reportval_id']] = $row['reportval_txt'] ;
		if( !$row['subvalues'] ) {
			continue ;
		}
		foreach( $row['subvalues'] as $srow ) {
			$map_reportval_text[$srow['reportval_id']] = $srow['reportval_txt'] ;
		}
	}
	
	// constitution des colonnes
	$cols = array() ;
	if( $p_axes['groupby_is_on'] ) {
		$cols[] = array(
			'hidden' => true,
			'dataIndex' => 'group_id',
			'text' => '' 
		);
		switch( $p_axes['groupby_key'] ) {
			case 'user' :
				$text = 'Affectation' ;
				break ;
			case 'soc' :
				$text = 'Entité' ;
				break ;
			case 'atr' :
				foreach( $cfg_atr as $atr_record ) {
					if( $p_axes['groupby_atr'] == $atr_record['atr_id'] ) {
						$text = $atr_record['atr_desc'] ;
					}
				}
				break ;
		}
		$cols[] = array(
			'dataIndex' => 'group_txt',
			'text' => $text 
		);
	}


	// TODO :
	// - nouveau cas de config : timebreak_is_on==TRUE && count($p_vals) > 1 && groupby_is_on==FALSE
	//  ---> config columsn en mode TIMEBREAK (voir plus bas)
	// -----> créer une "row" par $reportval_id , voir plus bas TODO : si mode TIMEBREAK + MUKTIVALUES

	$new_config = false;
	if ($p_axes['timebreak_is_on'] && count($p_vals) > 1 && !$p_axes['groupby_is_on']){
		$new_config = true;
		$timetag = NULL ;
		switch( $p_axes['timebreak_group'] ) {
			case 'WEEK' :
				$timetag = 'o-W' ;
				break ;
			case 'DAY' :
				$timetag = 'Y-m-d' ;
				break ;
			case 'MONTH' :
				$timetag = 'Y-m' ;
				break ;
			case 'YEAR' :
				$timetag = 'Y' ;
				break ;
		}
		$map_idx_dates = array() ;
		$date_cur = $p_filters['filter_date']['date_start'] ;
		$date_end = $p_filters['filter_date']['date_end'] ;
		while( $date_cur <= $date_end ) {
			$timeidx = date($timetag,strtotime($date_cur)) ;
			if( !$map_idx_dates[$timeidx] ) {
				$map_idx_dates[$timeidx] = array() ;
			}
			$map_idx_dates[$timeidx][] = $date_cur ;

			$date_cur = date('Y-m-d',strtotime('+1 day', strtotime($date_cur))) ;
		}

		$reportval_id = reset($p_vals) ;
		$cols = array() ;
		$cols[0] = array(
			'text' => 'Valeurs',
			'dataIndex' => 'reportval_txt',
		);
		$i = 1;
		foreach( $map_idx_dates as $timeidx => $dates ) {
			$cols[$i] = array(
				'dataIndex' => 'v_'.$timeidx,
				'date_start' => min($dates),
				'date_end' => max($dates),
				//'reportval_id' => $val,
				'text' => $timeidx
			);
			$i++;


		}
		$temp = array() ;

		foreach ($p_vals as $reportval_id){
			$temp[] = array(
				'dataIndex' => 'v_'.$reportval_id,
				'reportval_id' => $reportval_id,
				'reportval_txt' => $map_reportval_text[$reportval_id],
				/*
				'date_start' => $p_filters['filter_date']['date_start'],
				'date_end' => $p_filters['filter_date']['date_end']
				*/
			);
		}

		$TAB = array() ;
		$grouper = null;
		foreach( $cols as $col ) {
			foreach ($temp as $key=>$tmp){
				if ($col['dataIndex'] == 'reportval_txt'){
					$TAB[$key][$col['dataIndex']] = $tmp['reportval_txt'] ;
					continue ;
				}
				if( !$tmp['reportval_id'] ) {
					continue ;
				}
				$dates = array(
					'date_start' => $col['date_start'],
					'date_end' => $col['date_end']
				);
				$map_grouper_val = specRsiRecouveo_report_run_getValues($tmp['reportval_id'],$dates,$p_filters,$grouper) ;
				//print_r($map_grouper_val) ;
				foreach($map_grouper_val as $val ){
					$TAB[$key][$col['dataIndex']] = $val ;
				}
			}
		}
		
		return array('success'=>true, 'columns'=>$cols, 'data'=>$TAB, 'label'=>$labels) ;
	}


	elseif( count($p_vals) > 1 ) {
		foreach( $p_vals as $reportval_id ) {
			$cols[] = array(
				'width' => 150,
				'dataIndex' => 'v_'.$reportval_id,
				'reportval_id' => $reportval_id,
				'text' => $map_reportval_text[$reportval_id],
				'date_start' => $p_filters['filter_date']['date_start'],
				'date_end' => $p_filters['filter_date']['date_end']
			);
		}
	} elseif( $p_axes['timebreak_is_on'] ) {
		$timetag = NULL ;
		switch( $p_axes['timebreak_group'] ) {
			case 'WEEK' :
				$timetag = 'o-W' ;
				break ;
			case 'DAY' :
				$timetag = 'Y-m-d' ;
				break ;
			case 'MONTH' :
				$timetag = 'Y-m' ;
				break ;
			case 'YEAR' :
				$timetag = 'Y' ;
				break ;
		}
		$map_idx_dates = array() ;
		$date_cur = $p_filters['filter_date']['date_start'] ;
		$date_end = $p_filters['filter_date']['date_end'] ;
		while( $date_cur <= $date_end ) {
			$timeidx = date($timetag,strtotime($date_cur)) ;
			if( !$map_idx_dates[$timeidx] ) {
				$map_idx_dates[$timeidx] = array() ;
			}
			$map_idx_dates[$timeidx][] = $date_cur ;
		
			$date_cur = date('Y-m-d',strtotime('+1 day', strtotime($date_cur))) ;
		}
		
		$reportval_id = reset($p_vals) ;
		foreach( $map_idx_dates as $timeidx => $dates ) {
			$cols[] = array(
				'dataIndex' => 'v_'.$timeidx,
				'date_start' => min($dates),
				'date_end' => max($dates),
				'reportval_id' => $reportval_id,
				'text' => $timeidx 
			);
		}
	} else {
		$reportval_id = reset($p_vals) ;
		$cols[] = array(
			'width' => 150,
			'dataIndex' => 'v_'.$reportval_id,
			'reportval_id' => $reportval_id,
			'text' => $map_reportval_text[$reportval_id], 
			'date_start' => $p_filters['filter_date']['date_start'],
			'date_end' => $p_filters['filter_date']['date_end']
		);
	}
	
	$grouper = NULL ;
	if( $p_axes['groupby_is_on'] ) {
		switch( $p_axes['groupby_key'] ) {
			case 'user' :
				$grouper = 'USER' ;
				break ;
			case 'soc' :
				$grouper = 'SOC' ;
				break ;
			case 'atr' :
				$ttmp = explode('@',$p_axes['groupby_atr']) ;
				if( $ttmp[0]=='account' ) {
					$grouper = 'ATR:'.$ttmp[1] ;
				}
				break ;
		}
	}
	
	$TAB = array() ;
	foreach( $cols as $col ) {
		if( !$col['reportval_id'] ) {
			continue ;
		}
		$dates = array(
			'date_start' => $col['date_start'],
			'date_end' => $col['date_end']
		);
		$map_grouper_val = specRsiRecouveo_report_run_getValues($col['reportval_id'],$dates,$p_filters,$grouper) ;
		//print_r($map_grouper_val) ;
		
		foreach($map_grouper_val as $group => $val ){
			$TAB[$group][$col['dataIndex']] = $val ;
		}
	}

	$rows = array() ;
	foreach( $TAB as $group=>$row ) {
		$row['group_id'] = $group ;
		$row['group_txt'] = $group ;
		switch( $p_axes['groupby_key'] ) {
			case 'user' :
				$row['group_txt'] = $map_user[$row['group_id']] ;
				break ;
			case 'soc' :
				$row['group_txt'] = $map_soc[$row['group_id']] ;
				break ;
		}
		$rows[] = $row ;
	}
	
	return array('success'=>true, 'columns'=>$cols, 'data'=>$rows) ;
}

function specRsiRecouveo_report_run_getValues( $reportval_id, $dates, $filters, $grouper ) {
	global $_opDB ;
	
	$filter_atr = $filters['filter_atr'] ;
	$filter_soc = $filters['filter_soc'] ;
	$filter_user = $filters['filter_user'] ;
	
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_atr = $ttmp['data']['cfg_atr'] ;
	
	// build filter on account
	$where_account = '' ;
	if( $filter_atr ) {
		foreach( $cfg_atr as $atr_record ) {
			$atr_id = $atr_record['atr_id'] ;
			$atr_dbfield = 'field_'.$atr_record['atr_field'] ;
			switch( $atr_record['atr_type'] ) {
				case 'account' : $atr_dbalias='la' ; break ;
				default : continue 2 ;
			}
			if( $filter_atr[$atr_id] ) {
				$mvalue = $filter_atr[$atr_id] ;
				$where_account.= " AND {$atr_dbalias}.{$atr_dbfield} IN ".$_opDB->makeSQLlist($mvalue) ;
			}
		}
	}
	if( $filter_soc ) {
		$where_account.= " AND la.treenode_key IN ".$_opDB->makeSQLlist($filter_soc) ;
	}
	if( $filter_user ) {
		$where_account.= " AND la.field_LINK_USER_LOCAL IN ".$_opDB->makeSQLlist($filter_user) ;
	}
	
	
	if( $grouper ) {
		$ttmp = explode(':',$grouper) ;
		$key = $ttmp[0] ;
		switch( $key ) {
			case 'USER' :
				$group_field = 'la.field_LINK_USER_LOCAL' ;
				break ;
			case 'SOC' :
				$group_field = 'la.treenode_key' ;
				break ;
			case 'ATR' :
				$group_field = 'la.field_ATR_A_'.$ttmp[1] ;
				break ;
		}
	}
	
		
	switch( $reportval_id ) {
		case 'calls_out' :
		case 'calls_in' :
		case 'emails_out' :
		case 'emails_in' :
		case 'mails_out' :
		case 'mails_in' :
			switch( $reportval_id ) {
				case 'calls_out' : $action_code='CALL_OUT' ; break ;
				case 'calls_in' : $action_code='CALL_IN' ; break ;
				case 'emails_out' : $action_code='EMAIL_OUT' ; break ;
				case 'emails_in' : $action_code='EMAIL_IN' ; break ;
				case 'mails_out' : $action_code='MAIL_OUT' ; break ;
				case 'mails_in' : $action_code='MAIL_IN' ; break ;
			}
			$select_clause = "'',count(*)" ;
			if( $group_field ) {
				$select_clause = $group_field.',count(*)' ;
			}
			$query = "SELECT {$select_clause} 
						FROM view_file_FILE_ACTION fa
						JOIN view_file_FILE f ON f.filerecord_id=fa.filerecord_parent_id
						JOIN view_bible_LIB_ACCOUNT_entry la ON la.entry_key=f.field_LINK_ACCOUNT
						WHERE fa.field_STATUS_IS_OK='1' AND field_LINK_ACTION='{$action_code}'
						AND (DATE(fa.field_DATE_ACTUAL) BETWEEN '{$dates['date_start']}' AND '{$dates['date_end']}')" ;
			$query.= $where_account ;
			if( $group_field ) {
				$query.= " GROUP BY {$group_field}" ;
			}
			break ;
			
		case 'wallet_count' :
			$select_clause = "'',count( distinct field_LINK_ACCOUNT )" ;
			if( $group_field ) {
				$select_clause = $group_field.',count( distinct field_LINK_ACCOUNT )' ;
			}
			$query = "SELECT {$select_clause} 
						FROM view_file_FILE f
						JOIN view_bible_LIB_ACCOUNT_entry la ON la.entry_key=f.field_LINK_ACCOUNT
						WHERE f.field_STATUS_CLOSED_VOID<>'1' AND f.field_STATUS_CLOSED_END<>'1'" ;
			$query.= $where_account ;
			if( $group_field ) {
				$query.= " GROUP BY {$group_field}" ;
			}
			break ;
		case 'wallet_amount' :
			$select_clause = "'',sum( r.field_AMOUNT )" ;
			if( $group_field ) {
				$select_clause = $group_field.',sum( r.field_AMOUNT )' ;
			}
			$query = "SELECT {$select_clause} 
						FROM view_file_FILE f
						JOIN view_file_RECORD_LINK rl ON rl.field_LINK_FILE_ID=f.filerecord_id AND rl.field_LINK_IS_ON='1'
						JOIN view_file_RECORD r ON r.filerecord_id = rl.filerecord_parent_id
						JOIN view_bible_LIB_ACCOUNT_entry la ON la.entry_key=f.field_LINK_ACCOUNT
						WHERE f.field_STATUS_CLOSED_VOID<>'1' AND f.field_STATUS_CLOSED_END<>'1'" ;
			$query.= $where_account ;
			if( $group_field ) {
				$query.= " GROUP BY {$group_field}" ;
			}
			break ;
		case 'agree' :
			$select_clause = "'',sum( r.field_AMOUNT )" ;
			if( $group_field ) {
				$select_clause = $group_field.',sum( r.field_AMOUNT )' ;
			}
			$query = "SELECT {$select_clause} 
						FROM view_file_FILE f
						JOIN view_file_RECORD_LINK rl ON rl.field_LINK_FILE_ID=f.filerecord_id AND rl.field_LINK_IS_ON='1'
						JOIN view_file_RECORD r ON r.filerecord_id = rl.filerecord_parent_id
						JOIN view_bible_LIB_ACCOUNT_entry la ON la.entry_key=f.field_LINK_ACCOUNT
						WHERE f.field_STATUS_CLOSED_VOID<>'1' AND f.field_STATUS_CLOSED_END<>'1' AND f.field_STATUS='S2P_PAY'" ;
			$query.= $where_account ;
			if( $group_field ) {
				$query.= " GROUP BY {$group_field}" ;
			}
			break ;
		case 'cash' :
			$select_clause = "'',sum( -1 * r.field_AMOUNT )" ;
			if( $group_field ) {
				$select_clause = $group_field.',sum( -1 * r.field_AMOUNT )' ;
			}
			$query = "SELECT {$select_clause} 
						FROM view_file_RECORD r
						JOIN view_bible_LIB_ACCOUNT_entry la ON la.entry_key=r.field_LINK_ACCOUNT
						WHERE r.field_TYPE<>''
						AND (DATE(r.field_DATE_RECORD) BETWEEN '{$dates['date_start']}' AND '{$dates['date_end']}')" ;
			$query.= $where_account ;
			if( $group_field ) {
				$query.= " GROUP BY {$group_field}" ;
			}
			break ;
		case 'late_count' :
			$select_clause = "'',count( distinct field_LINK_ACCOUNT )" ;
			if( $group_field ) {
				$select_clause = $group_field.',count( distinct field_LINK_ACCOUNT )' ;
			}
			$query = "SELECT {$select_clause} 
						FROM view_file_FILE_ACTION fa
						JOIN view_file_FILE f ON f.filerecord_id=fa.filerecord_parent_id
						JOIN view_bible_LIB_ACCOUNT_entry la ON la.entry_key=f.field_LINK_ACCOUNT
						WHERE f.field_STATUS_CLOSED_VOID<>'1' AND f.field_STATUS_CLOSED_END<>'1'
						AND fa.field_STATUS_IS_OK<>'1' AND DATE(field_DATE_SCHED)<DATE(NOW()) AND field_STATUS NOT IN ('SX_CLOSE')" ;
			$query.= $where_account ;
			if( $group_field ) {
				$query.= " GROUP BY {$group_field}" ;
			}
			break ;
		case 'late_amount' :
			$select_clause = "'',sum( r.field_AMOUNT )" ;
			if( $group_field ) {
				$select_clause = $group_field.',sum( r.field_AMOUNT )' ;
			}
			$query = "SELECT {$select_clause} 
						FROM view_file_FILE_ACTION fa
						JOIN view_file_FILE f ON f.filerecord_id=fa.filerecord_parent_id
						JOIN view_file_RECORD_LINK rl ON rl.field_LINK_FILE_ID=f.filerecord_id AND rl.field_LINK_IS_ON='1'
						JOIN view_file_RECORD r ON r.filerecord_id = rl.filerecord_parent_id
						JOIN view_bible_LIB_ACCOUNT_entry la ON la.entry_key=f.field_LINK_ACCOUNT
						WHERE f.field_STATUS_CLOSED_VOID<>'1' AND f.field_STATUS_CLOSED_END<>'1'
						AND fa.field_STATUS_IS_OK<>'1' AND DATE(field_DATE_SCHED)<DATE(NOW()) AND field_STATUS NOT IN ('SX_CLOSE')" ;
			$query.= $where_account ;
			if( $group_field ) {
				$query.= " GROUP BY {$group_field}" ;
			}
			break ;
		
		default :
			break ;
	}
	$result = $_opDB->query($query) ;
	
	$map = array() ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		if( $grouper && !$arr[0] ) {
			continue ;
		}
		$map[$arr[0]] = $arr[1] ;
	}
	
	return $map ;
}

?>
