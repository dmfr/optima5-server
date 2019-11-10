<?php

function specRsiRecouveo_report_getValuesDesc() {
	/*
	return array(
		array(
			'reportval_id' => 'wallet',
			'reportval_txt' => 'Encours',
			'reportgroup_id' => 'finance',
			'timescale' => 'milestone',
			'subvalues' => array(
				array(
					//'reportval_id' => 'wallet_amount',
					'reportval_id' => 'wallet?wvalue=amount',
					'reportval_txt' => 'Montant',
					'reportval_iconCls' => 'op5-spec-rsiveo-reporttile-main-icon-value-amount',
					'value_suffix' => '€',
					'eval_direction' => 1
				),
				array(
					//'reportval_id' => 'wallet_late',
					'reportval_id' => 'wallet?wvalue=amount&wlate=true',
					'reportval_txt' => 'Retards',
					'reportval_iconCls' => 'op5-spec-rsiveo-reporttile-main-icon-value-count',
					'value_suffix' => '€',
					'eval_direction' => 1
				),

			),
		)
	) ;
	*/

	return array(
		/*
		array(
			'reportval_id' => 'autosent',
			'reportval_txt' => 'Envois auto.',
			'reportgroup_id' => 'counters',
			'timescale' => 'interval',
			'reportval_iconCls' => 'op5-spec-rsiveo-reporttile-main-icon-value-mailout',
			'eval_direction' => 1
		),
		*/

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
					//'reportval_id' => 'wallet_amount',
					'reportval_id' => 'wallet?wvalue=amount',
					'reportval_txt' => 'Montant',
					'reportval_iconCls' => 'op5-spec-rsiveo-reporttile-main-icon-value-amount',
					'value_suffix' => '€',
					'eval_direction' => 1
				),
				array(
					//'reportval_id' => 'wallet_late',
					'reportval_id' => 'wallet?wvalue=amount&wlate=true',
					'reportval_txt' => 'Retards',
					'reportval_iconCls' => 'op5-spec-rsiveo-reporttile-main-icon-value-count',
					'value_suffix' => '€',
					'eval_direction' => 1
				),

			),
		),

		array(
			'reportval_id' => 'agree',
			'reportval_txt' => 'En promesse',
			'reportgroup_id' => 'finance',
			'timescale' => 'milestone',
			'reportval_iconCls' => 'op5-spec-rsiveo-reporttile-main-icon-value-amount',
			'subvalues' => array(
				array(
					//'reportval_id' => 'agree',
					'reportval_id' => 'wallet?wstatus=S2P_PAY&wvalue=amount',
					'reportval_txt' => 'Montant',
					'reportval_iconCls' => 'op5-spec-rsiveo-reporttile-main-icon-value-amount',
					'value_suffix' => '€',
					'eval_direction' => 1
				),
				array(
					//'reportval_id' => 'agree_late',
					'reportval_id' => 'wallet?wstatus=S2P_PAY&wvalue=amount&wlate=true',
					'reportval_txt' => 'Retards',
					'reportval_iconCls' => 'op5-spec-rsiveo-reporttile-main-icon-value-amount',
					'value_suffix' => '€',
					'eval_direction' => 1
				)
			)
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
			//'reportval_id' => 'non_echu',
			'reportval_id' => 'wallet?wstatus=S0_PRE&wvalue=amount',
			'reportval_txt' => 'Non-échus',
			'reportgroup_id' => 'finance',
			'timescale' => 'milestone',
			'value_suffix' => '€',
			'eval_direction' => -1,
			'reportval_iconCls' => 'op5-spec-rsiveo-reporttile-main-icon-value-amount',
		),

		array(
			'reportval_id' => 'act_ext',
			'reportval_txt' => 'Actions externes',
			'reportgroup_id' => 'finance',
			'timescale' => 'milestone',
			'subvalues' => array(
				array(
					//'reportval_id' => 'ext_amount',
					'reportval_id' => 'wallet?wstatus=S2L_LITIG&wvalue=amount',
					'reportval_txt' => 'Montant',
					'reportval_iconCls' => 'op5-spec-rsiveo-reporttile-main-icon-value-amount',
					'value_suffix' => '€',
					'eval_direction' => 1
				),
				array(
					//'reportval_id' => 'ext_late',
					'reportval_id' => 'wallet?wstatus=S2L_LITIG&wvalue=amount&wlate=true',
					'reportval_txt' => 'Retards',
					'reportval_iconCls' => 'op5-spec-rsiveo-reporttile-main-icon-value-count',
					'value_suffix' => '€',
					'eval_direction' => 1
				),

			),
		),
		array(
			'reportval_id' => 'judiciaire',
			'reportval_txt' => 'Judiciaire',
			'reportgroup_id' => 'finance',
			'timescale' => 'milestone',
			'subvalues' => array(
				array(
					//'reportval_id' => 'judi_amount',
					'reportval_id' => 'wallet?wstatus=S2J_JUDIC&wvalue=amount',
					'reportval_txt' => 'Montant',
					'reportval_iconCls' => 'op5-spec-rsiveo-reporttile-main-icon-value-amount',
					'value_suffix' => '€',
					'eval_direction' => 1
				),
				array(
					//'reportval_id' => 'judi_late',
					'reportval_id' => 'wallet?wstatus=S2J_JUDIC&wvalue=amount&wlate=true',
					'reportval_txt' => 'Retards',
					'reportval_iconCls' => 'op5-spec-rsiveo-reporttile-main-icon-value-count',
					'value_suffix' => '€',
					'eval_direction' => 1
				),

			),
		),
		array(
			//'reportval_id' => 'close',
			'reportval_id' => 'wallet?wstatus=SX_CLOSE&wvalue=amount',
			'reportval_txt' => 'Clôturés',
			'reportgroup_id' => 'finance',
			'timescale' => 'milestone',
			'value_suffix' => '€',
			'eval_direction' => 1,
			'reportval_iconCls' => 'op5-spec-rsiveo-reporttile-main-icon-value-amount'
		)


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
			case 'status':
				$text = "Statut" ;
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
			switch($p_axes['timebreak_group']){
				case 'SEM':
					$year = date('Y', strtotime($date_cur)) ;
					$month = date('m', strtotime($date_cur)) ;
					$timeidx = $year.'-S'.(floor($month/6)) ;
					break;
				case 'TRIM' :
					$year = date('Y', strtotime($date_cur)) ;
					$month = date('m', strtotime($date_cur)) ;
					$timeidx = $year.'-T'.ceil($month/3) ;
					break;
				default:
					$timeidx = date($timetag,strtotime($date_cur)) ;
					break ;

			}
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
					$TAB[$key]['reportval_id'] = $tmp['reportval_id'] ;
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
		return array('success'=>true, 'columns'=>$cols, 'data'=>$TAB) ;
		
	} elseif( count($p_vals) > 1 ) {
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
			case 'status':
				$grouper = "STATUS" ;
				break ;
			case 'status_substatus':
				$grouper = "STATUS_SUBSTATUS" ;
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





























function specRsiRecouveo_report_run_getValues( $reportval_id, $dates, $filters, $grouper )
{
	global $_opDB;

	$filter_atr = $filters['filter_atr'];
	$filter_soc = $filters['filter_soc'];
	$filter_user = $filters['filter_user'];
	$ttmp = specRsiRecouveo_cfg_getConfig();
	$cfg_atr = $ttmp['data']['cfg_atr'];

	
	
	
	
	// base SQL variables
	$select_clause = NULL ;
	$join_tables = array() ;
	$join_clause = '' ;
	$where_clause = 'WHERE 1' ;
	
	
	
	
	
	
	
	// build filter on account
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
	if ($filter_user) {
		$join_tables['la'] = TRUE ;
		$where_clause.= " AND la.field_LINK_USER_LOCAL IN " . $_opDB->makeSQLlist($filter_user);
	}
	
	
	
	
	// parse $reportval_id
	switch( count($ttmp=explode('?',$reportval_id)) ) {
		case 1 :
			$reportval_id = $reportval_id ;
			break ;
		case 2 :
			$reportval_id = $ttmp[0] ;
			$reportval_filterMap = array() ;
			foreach( explode('&',$ttmp[1]) as $wcond ) {
				$wtmp = explode('=',$wcond) ;
				if( count($wtmp)!=2 ) {
					continue ;
				}
				$reportval_filterMap[$wtmp[0]] = $wtmp[1] ;
			}
			break ;
		default :
			return array() ; // NOK
 	}
	
	
	
	
	
	
	
	$group_joiner = '' ;
	if ($grouper) {
		$ttmp = explode(':', $grouper);
		$key = $ttmp[0];
		switch ($key) {
			case 'USER' :
				$join_tables['la'] = TRUE ;
				$group_field = 'la.field_LINK_USER_LOCAL';
				break;
			case 'SOC' :
				$join_tables['la'] = TRUE ;
				$group_field = 'la.treenode_key';
				break;
			case 'ATR' :
				$join_tables['la'] = TRUE ;
				$group_field = 'la.field_ATR_A_' . $ttmp[1];
				break;
			case 'STATUS':
				$join_tables['fs'] = TRUE ;
				$group_field = 'fs.treenode_key' ;
				break ;
			case 'STATUS_SUBSTATUS' :
				$join_tables['fs'] = TRUE ;
				$join_tables['fssub'] = TRUE ;
				$group_field = "CONCAT(fs.treenode_key,':',fssub.substatus)" ;
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
			switch ($reportval_id) {
				case 'calls_out' :
					$action_code = 'CALL_OUT';
					break;
				case 'calls_in' :
					$action_code = 'CALL_IN';
					break;
				case 'emails_out' :
					$action_code = 'EMAIL_OUT';
					break;
				case 'emails_in' :
					$action_code = 'EMAIL_IN';
					break;
				case 'mails_out' :
					$action_code = 'MAIL_OUT';
					break;
				case 'mails_in' :
					$action_code = 'MAIL_IN';
					break;
			}
			$select_clause = "'',count(*)";
			if ($group_field) {
				$select_clause = $group_field . ',count(*)';
			}

			$where_action = '';
			switch ($reportvalId_suffix) {
				case 'manual' :
					$where_action .= " AND (te.field_MANUAL_IS_ON IS NULL OR te.field_MANUAL_IS_ON='1')";
					break;
				case 'auto' :
					$where_action .= " AND (te.field_MANUAL_IS_ON IS NOT NULL AND te.field_MANUAL_IS_ON='0')";
					break;
			}
			$query = "SELECT {$select_clause} 
						FROM view_file_FILE_ACTION fa
						JOIN view_file_FILE f ON f.filerecord_id=fa.filerecord_parent_id
						{$fgJoiner}
						LEFT OUTER JOIN view_bible_TPL_entry te ON te.entry_key=fa.field_LINK_TPL
						WHERE fa.field_STATUS_IS_OK='1' AND field_LINK_ACTION='{$action_code}'
						AND (DATE(fa.field_DATE_ACTUAL) BETWEEN '{$dates['date_start']}' AND '{$dates['date_end']}')";
			$query .= $where_account;
			$query .= $where_action;
			if ($group_field) {
				$query .= " GROUP BY {$group_field}";
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
			
			
			
			
			
		case 'wallet' :
			switch( $reportval_filterMap['wvalue'] ) {
				case 'count' :
					$select_word = "count( distinct f.field_LINK_ACCOUNT )" ;
					break ;
				case 'amount' :
					$select_word = "sum( r.field_AMOUNT )" ;
					break ;
				default :
					return array() ;
			}
			$select_clause = "'',{$select_word}" ;
			if( $group_field ) {
				$select_clause = $group_field.",{$select_word}" ;
			}
			
			if( $reportval_filterMap['wlate'] ) {
				$join_tables['filelate'] = TRUE ;
			}
			
			
			foreach( $join_tables as $table => $torf ) {
				if( !$torf ) {
					continue ;
				}
				switch( $table ) {
					case 'la' :
						$join_clause.= ' JOIN view_bible_LIB_ACCOUNT_entry la ON la.entry_key=r.field_LINK_ACCOUNT' ;
						break ;
						
					case 'fs' :
						$join_clause.= ' JOIN view_bible_CFG_STATUS_tree fs ON fs.treenode_key=f.field_STATUS' ;
						break ;
						
					case 'fssub' :
						$join_clause.= " JOIN (
							SELECT f.filerecord_id, 
								CASE f.field_STATUS
									WHEN 'S2L_LITIG' THEN field_LINK_LITIG
									WHEN 'S2J_JUDIC' THEN field_LINK_JUDIC
									WHEN 'SX_CLOSE' THEN field_LINK_CLOSE
									ELSE ''
								END
								as substatus
							FROM op5_veo_prod_veo.view_file_FILE f
							JOIN op5_veo_prod_veo.view_file_FILE_ACTION fa ON fa.filerecord_parent_id=f.filerecord_id
							JOIN (
								SELECT min(filerecord_id) as first_fileaction_filerecord_id
								FROM op5_veo_prod_veo.view_file_FILE_ACTION 
								group by filerecord_id
							) first ON first.first_fileaction_filerecord_id=fa.filerecord_id 
						) fssub ON fssub.filerecord_id=f.filerecord_id" ;
						break ;
						
					case 'filelate' :
						$join_clause.= " JOIN (
							SELECT f.filerecord_id
							FROM view_file_FILE f 
							JOIN view_file_FILE_ACTION fa ON fa.filerecord_parent_id=f.filerecord_id 
							WHERE 
								(DATE(fa.field_DATE_SCHED)<>'0000-00-00' AND DATE(fa.field_DATE_SCHED)<'{$dates['date_end']}')
								AND
								(fa.field_STATUS_IS_OK<>'1' OR DATE(fa.field_DATE_ACTUAL)>'{$dates['date_end']}')
							GROUP BY f.filerecord_id
						) filelate ON filelate.filerecord_id=f.filerecord_id" ;
						break ;
				}
			}
			
			$where_clause.= " AND (DATE(r.field_DATE_RECORD) < '{$dates['date_end']}')" ;
			$where_clause.= " AND ((r.field_LETTER_IS_CONFIRM=1 AND r.field_LETTER_DATE > '{$dates['date_end']}') 
										OR r.field_LETTER_IS_CONFIRM=0)" ;
			if( $reportval_filterMap['wstatus'] ) {
				$where_clause.= " AND f.field_STATUS='{$reportval_filterMap['wstatus']}'" ;
			}
			

			
			$query = "SELECT {$select_clause} 
						FROM view_file_RECORD r
						JOIN view_file_RECORD_LINK rl ON rl.filerecord_parent_id=r.filerecord_id
						JOIN (
							SELECT min(filerecord_id) as min_recordlink_filerecord_id
							FROM view_file_RECORD_LINK
							WHERE 
								DATE(field_DATE_LINK_ON)<='{$dates['date_end']}' 
								AND (DATE(field_DATE_LINK_OFF) > '{$dates['date_end']}' OR field_LINK_IS_ON='1') 
							GROUP BY filerecord_parent_id
						) rl_active ON rl_active.min_recordlink_filerecord_id = rl.filerecord_id
						JOIN op5_veo_prod_veo.view_file_FILE f ON f.filerecord_id=rl.field_LINK_FILE_ID
						{$join_clause}
						{$where_clause}" ;
			if( $group_field ) {
				$query.= " GROUP BY {$group_field}" ;
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
		
		
		
		
		default:
			return array("" => 0 ) ;
	}
}

?>
