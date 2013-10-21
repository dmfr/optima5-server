<?php

function paracrm_queries_charts_cfgSave( $q_type, $q_id, $arr_QueryResultChartModel ) {
	global $_opDB ;
	
	sleep(1) ;
	
	$where_clause = "WHERE q_type='$q_type' AND q_id='$q_id'" ;
	$query = "DELETE FROM q_cfgchart {$where_clause}" ;
	$_opDB->query($query) ;
	$query = "DELETE FROM q_chart {$where_clause}" ;
	$_opDB->query($query) ;
	$query = "DELETE FROM q_chart_iterationdot {$where_clause}" ;
	$_opDB->query($query) ;
	$query = "DELETE FROM q_chart_serie {$where_clause}" ;
	$_opDB->query($query) ;
	$query = "DELETE FROM q_chart_serie_pivotdot {$where_clause}" ;
	$_opDB->query($query) ;

	if( !is_array($arr_QueryResultChartModel) ) {
		$arr_ins = array() ;
		$arr_ins['q_type'] = $q_type ;
		$arr_ins['q_id'] = $q_id ;
		$arr_ins['charts_is_enabled'] = 'N' ;
		$_opDB->insert('q_cfgchart',$arr_ins) ;
		return ;
	}
	$arr_ins = array() ;
	$arr_ins['q_type'] = $q_type ;
	$arr_ins['q_id'] = $q_id ;
	$arr_ins['charts_is_enabled'] = 'O' ;
	$_opDB->insert('q_cfgchart',$arr_ins) ;
	
	$chart_index = 0 ;
	foreach( $arr_QueryResultChartModel as $queryResultChartModel ) {
		$arr_ins = array() ;
		$arr_ins['q_type'] = $q_type ;
		$arr_ins['q_id'] = $q_id ;
		$arr_ins['chart_index'] = ++$chart_index ;
		$arr_ins['chart_name'] = $queryResultChartModel['chart_name'] ;
		$arr_ins['chart_type'] = $queryResultChartModel['chart_type'] ;
		$_opDB->insert('q_chart',$arr_ins) ;
		
		$iterationdot_ssid = 0 ;
		foreach( $queryResultChartModel['iteration_groupTags'] as $iteration_dot  ) {
			$arr_ins = array() ;
			$arr_ins['q_type'] = $q_type ;
			$arr_ins['q_id'] = $q_id ;
			$arr_ins['chart_index'] = $chart_index ;
			$arr_ins['iterationdot_ssid'] = ++$iterationdot_ssid ;
			$arr_ins['group_tagid'] = $iteration_dot['group_tagid'] ;
			$_opDB->insert('q_chart_iterationdot',$arr_ins) ;
		}
		
		$serie_ssid = 0 ;
		foreach( $queryResultChartModel['series'] as $serie ) {
			$arr_ins = array() ;
			$arr_ins['q_type'] = $q_type ;
			$arr_ins['q_id'] = $q_id ;
			$arr_ins['chart_index'] = $chart_index ;
			$arr_ins['serie_ssid'] = ++$serie_ssid ;
			$arr_ins['serie_color'] = $serie['serie_color'] ;
			$_opDB->insert('q_chart_serie',$arr_ins) ;
			
			$serie_pivotdot_ssid = 0 ;
			foreach( $serie['serie_pivot'] as $serie_pivotdot ) {
				$arr_ins = array() ;
				$arr_ins['q_type'] = $q_type ;
				$arr_ins['q_id'] = $q_id ;
				$arr_ins['chart_index'] = $chart_index ;
				$arr_ins['serie_ssid'] = $serie_ssid ;
				$arr_ins['serie_pivotdot_ssid'] = ++$serie_pivotdot_ssid ;
				$arr_ins['group_tagid'] = $serie_pivotdot['group_tagid'] ;
				$arr_ins['group_key'] = $serie_pivotdot['group_key'] ;
				$_opDB->insert('q_chart_serie_pivotdot',$arr_ins) ;
			}
		}
	}
	
	return ;
}


function paracrm_queries_charts_cfgLoad( $q_type, $q_id ) {
	global $_opDB ;
	
	$where_clause = "WHERE q_type='$q_type' AND q_id='$q_id'" ;
	$query = "SELECT * FROM q_cfgchart {$where_clause}" ;
	$result = $_opDB->query($query) ;
	$arr = $_opDB->fetch_assoc($result) ;
	if( !$arr || $arr['charts_is_enabled'] != 'O' ) {
		return NULL ;
	}
	
	
	$db_chart = $db_chart_iterationdot = $db_chart_serie = $db_chart_serie_pivotdot = array() ;
	
	$query = "SELECT * FROM q_chart {$where_clause} ORDER BY chart_index" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$chart_index = $arr['chart_index'] ;
		$db_chart[$chart_index] = $arr ;
		$db_chart_iterationdot[$chart_index] = array() ;
		$db_chart_serie[$chart_index] = array() ;
	}
	
	$query = "SELECT * FROM q_chart_iterationdot {$where_clause} ORDER BY chart_index,iterationdot_ssid" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$chart_index = $arr['chart_index'] ;
		$iterationdot_ssid = $arr['iterationdot_ssid'] ;
		$db_chart_iterationdot[$chart_index][$iterationdot_ssid] = $arr ;
	}
	
	$query = "SELECT * FROM q_chart_serie {$where_clause} ORDER BY chart_index,serie_ssid" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$chart_index = $arr['chart_index'] ;
		$serie_ssid = $arr['serie_ssid'] ;
		$db_chart_serie[$chart_index][$serie_ssid] = $arr ;
		$db_chart_serie_pivotdot[$chart_index][$serie_ssid] = array() ;
	}
	
	$query = "SELECT * FROM q_chart_serie_pivotdot {$where_clause} ORDER BY chart_index,serie_ssid,serie_pivotdot_ssid" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$chart_index = $arr['chart_index'] ;
		$serie_ssid = $arr['serie_ssid'] ;
		$serie_pivotdot_ssid = $arr['serie_pivotdot_ssid'] ;
		$db_chart_serie_pivotdot[$chart_index][$serie_ssid][$serie_pivotdot_ssid] = $arr ;
	}
	
	
	$arr_QueryResultChartModel = array() ;
	foreach( $db_chart as $chart_index => $record_chart ) {
		$queryResultChartModel = array() ;
		$queryResultChartModel = $queryResultChartModel + $record_chart ;
		
		$queryResultChartModel['iteration_groupTags'] = array() ;
		foreach( $db_chart_iterationdot[$chart_index] as $iterationdot_ssid => $record_chart_iterationdot ) {
			$queryResultChartModel['iteration_groupTags'][] = $record_chart_iterationdot ;
		}
		
		$queryResultChartModel['series'] = array() ;
		foreach( $db_chart_serie[$chart_index] as $serie_ssid => $record_chart_serie ) {
			$serie = array() ;
			$serie = $serie + $record_chart_serie ;
			$serie['serie_pivot'] = array() ;
			foreach( $db_chart_serie_pivotdot[$chart_index][$serie_ssid] as $record_chart_serie_pivotdot ) {
				$serie['serie_pivot'][] = $record_chart_serie_pivotdot ;
			}
			$queryResultChartModel['series'][] = $serie ;
		}
		
		$arr_QueryResultChartModel[] = $queryResultChartModel ;
	}
	return $arr_QueryResultChartModel ;
}

?>