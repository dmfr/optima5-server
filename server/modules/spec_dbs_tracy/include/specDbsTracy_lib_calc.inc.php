<?php

function specDbsTracy_lib_calc_perf() {
	// Params
	global $_opDB ;
	$cfg = specDbsTracy_lib_calc_perf_getCfg() ;
	$map_priority = $cfg['map_priority'] ;
	
	$todo = array() ;
	$query = "SELECT filerecord_id FROM view_file_CDE WHERE field_CALC_PERF_IS_OK<>'1'" ;
	$query = "SELECT filerecord_id FROM view_file_CDE WHERE 1" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$todo[$arr[0]] = TRUE ;
	}
	
	$json = specDbsTracy_order_getRecords( array() ) ;
	foreach( $json['data'] as $row_order ) {
		if( !$todo[$row_order['order_filerecord_id']] || !($row_order['calc_step'] >= '70_PICKUP') ) {
			continue ;
		}
		if( !($params = $map_priority[$row_order['atr_priority']]) ) {
			continue ;
		}
		
		$steps = array() ;
		foreach( $row_order['steps'] as $row_order_step ) {
			if( $row_order_step['status_is_ok'] ) {
				$steps[$row_order_step['step_code']] = strtotime($row_order_step['date_actual']) ;
			}
		}
		
		$ts_RLS = $steps['10_RLS'] ;
		$ts_PICKED = $steps['70_PICKUP'] ;
		if( !$ts_RLS || !$ts_PICKED ) {
			continue ;
		}
		
		$tat_days = $params['CALC_PERF_TAT_DAYS'] ;
		if( $params['CALC_PERF_BEFORE_H'] > 0 && date('H',$ts_RLS) >= $params['CALC_PERF_BEFORE_H'] ) {
			$tat_days++ ;
		}
		
		$ts_calc_DUE = $ts_RLS ;
		while( $tat_days > 0 ) {
			$ts_calc_DUE = strtotime('+1 day',$ts_calc_DUE) ;
			if( date('N',$ts_calc_DUE) <= 5 ) {
				$tat_days-- ;
			}
		}
		
		//set to 17h
		$ts_calc_DUE -= date('H',$ts_calc_DUE)*60*60 + date('i',$ts_calc_DUE)*60 + date('s',$ts_calc_DUE)*1 ;
		$ts_calc_DUE += $params['CALC_PERF_DUE_H']*60*60 ;
		
		/*
		echo "\n\n" ;
		echo 'RLS = '.$row_order['atr_priority']."\n" ;
		echo 'RLS = '.date('Y-m-d H:i:s',$ts_RLS)."\n" ;
		echo 'DUE = '.date('Y-m-d H:i:s',$ts_calc_DUE)."\n" ;
		echo "\n\n" ;
		*/
		
		$arr_update = array() ;
		$arr_update['field_CALC_PERF_IS_OK'] = 1 ;
		$arr_update['field_CALC_PERF_DATERLS'] = date('Y-m-d H:i:s',$ts_RLS) ;
		$arr_update['field_CALC_PERF_BALANCE'] = $ts_calc_DUE - $ts_PICKED ;
		$arr_cond = array() ;
		$arr_cond['filerecord_id'] = $row_order['order_filerecord_id'] ;
		$_opDB->update('view_file_CDE',$arr_update,$arr_cond) ;
	}
}
function specDbsTracy_lib_calc_perf_getCfg() {
	// Params
	if( isset($GLOBALS['cache_specDbsTracy_cfgPerf']) ) {
		return array(
			'success'=>true,
			'data' => $GLOBALS['cache_specDbsTracy_cfgPerf']
		);
	}
	
	global $_opDB ;
	
	$map_priority = array() ;
	$query = "SELECT * FROM view_bible_LIST_SERVICE_entry WHERE 1 ORDER BY entry_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$map_priority[$arr['field_CODE']] = array(
			'CALC_PERF_BEFORE_H' => $arr['field_CALC_PERF_BEFORE_H'],
			'CALC_PERF_TAT_DAYS' => $arr['field_CALC_PERF_TAT_DAYS'],
			'CALC_PERF_DUE_H' => $arr['field_CALC_PERF_DUE_H']
		) ;
	}
	
	$GLOBALS['cache_specDbsTracy_cfgPerf'] = array(
		'map_priority' => $map_priority
	);

	return $GLOBALS['cache_specDbsTracy_cfgPerf'] ;
}

?>
