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
		$arr_ins['tomixed_is_on'] = $queryResultChartModel['tomixed_is_on'] ;
		$arr_ins['tomixed_axis'] = $queryResultChartModel['tomixed_axis'] ;
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
			$arr_ins['data_selectid'] = $serie['data_selectid'] ;
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


function paracrm_queries_charts_getMixed( $arr_QueryResultChartModel ) {
	if( count($arr_QueryResultChartModel) == 1 ) {
		return $queryResultChartModel = current($arr_QueryResultChartModel) ;
	} else {
		unset($mixed_queryResultChartModel) ;
		foreach( $arr_QueryResultChartModel as $queryResultChartModel ) {
			if( !$queryResultChartModel['tomixed_is_on'] ) {
				continue ;
			}
			
			if( !isset($mixed_queryResultChartModel) ) {
				$mixed_queryResultChartModel = array() ;
				$mixed_queryResultChartModel['series'] = array() ;
			}
			
			$iteration_groupTags = array() ;
			foreach( $queryResultChartModel['iteration_groupTags'] as $t_iteration_groupTag ) {
				$iteration_groupTags[] = array('group_tagid'=>$t_iteration_groupTag['group_tagid']) ;
			}
			
			if( !$mixed_queryResultChartModel['iteration_groupTags'] ) {
				$mixed_queryResultChartModel['iteration_groupTags'] = $iteration_groupTags ;
			} elseif( json_encode($mixed_queryResultChartModel['iteration_groupTags']) != json_encode($iteration_groupTags) ) {
				unset($mixed_queryResultChartModel) ;
				break ;
			}
			
			foreach( $queryResultChartModel['series'] as $serie ) {
				$serie['serie_type'] = $queryResultChartModel['chart_type'] ;
				$serie['serie_axis'] = $queryResultChartModel['tomixed_axis'] ;
				$mixed_queryResultChartModel['series'][] = $serie ;
			}
		}
		if( isset($mixed_queryResultChartModel) ) {
			return $mixed_queryResultChartModel ;
		} else {
			return NULL ;
		}
	}
}


function paracrm_queries_charts_getResChart( $RES, $queryResultChartModel ) {
	// Translate iteration groupTags into groupIds
	$chart_iteration_groupTags = $queryResultChartModel['iteration_groupTags'] ;
	$chart_iteration_groupIds = array() ;
	foreach( $chart_iteration_groupTags as $ttmp ) {
		$groupTag = $ttmp['group_tagid'] ;
		if( ($groupId = array_search($groupTag, $RES['RES_titles']['group_tagId'])) === FALSE ) {
			return NULL ;
		}
		$chart_iteration_groupIds[] = $groupId ;
	}
	
	$CHART_labels = array() ;
	// Find axes (x/y) with exact match to iteration
	foreach( $chart_iteration_groupIds as $groupId ) {
		$groupLabels = array() ;
		foreach( $RES['RES_labels'] as $RES_labels_tab ) {
			if( $RES_labels_tab['arr_grid-x'] && isset($RES_labels_tab['arr_grid-x'][$groupId]) ) {
				$groupLabels += $RES_labels_tab['arr_grid-x'][$groupId] ;
			}
			if( $RES_labels_tab['arr_grid-y'] && isset($RES_labels_tab['arr_grid-y'][$groupId]) ) {
				$groupLabels += $RES_labels_tab['arr_grid-y'][$groupId] ;
			}
		}
		ksort($groupLabels) ;
		$CHART_labels[$groupId] = $groupLabels ;
	}
	
	// Iterate arr-grid-y/x to build iteration (tab-wide pagination like)
	$iterationFlat = paracrm_queries_charts_getFlatIteration($CHART_labels,0) ;
	if( !is_array($iterationFlat) ) {
		return NULL ;
	}
	
	
	
	// Translate series into series_arrGroupidGroupkey
	$series_arrGroupidGroupkey = array() ;
	$series_selectId = array() ;
	foreach( $queryResultChartModel['series'] as $queryResultChartModelSerie ) {
		$t_arrGroupidGroupkey = array() ;
		foreach( $queryResultChartModelSerie['serie_pivot'] as $queryResultChartModelSeriePivotDot ) {
			$pivotDot_groupTag = $queryResultChartModelSeriePivotDot['group_tagid'] ; // VISIT_field_VSTORE%TREE%1
			$pivotDot_groupKey = $queryResultChartModelSeriePivotDot['group_key'] ; // t_30310313
			if( ($pivotDot_groupId = array_search($pivotDot_groupTag, $RES['RES_titles']['group_tagId'])) === FALSE ) {
				return NULL ;
			}
			
			$t_arrGroupidGroupkey[$pivotDot_groupId] = $pivotDot_groupKey ;
		}
		$series_arrGroupidGroupkey[] = $t_arrGroupidGroupkey ;
		
		$series_selectId[] = ( $queryResultChartModelSerie['data_selectid'] != '' ? $queryResultChartModelSerie['data_selectid'] : 0 ) ;
	}
	
	
	$RES_seriesColor = array() ;
	foreach( $queryResultChartModel['series'] as $queryResultChartModelSerie ) {
		$RES_seriesColor[] = '#'.$queryResultChartModelSerie['serie_color'] ;
	}
	
	$RES_seriesType = array() ;
	foreach( $queryResultChartModel['series'] as $queryResultChartModelSerie ) {
		$RES_seriesType[] = ($queryResultChartModelSerie['serie_type'] ? $queryResultChartModelSerie['serie_type'] : $queryResultChartModel['chart_type']) ;
	}
	
	$RES_seriesAxis = array() ;
	foreach( $queryResultChartModel['series'] as $queryResultChartModelSerie ) {
		$RES_seriesAxis[] = ($queryResultChartModelSerie['serie_axis'] ? $queryResultChartModelSerie['serie_axis'] : 'left') ;
	}
	
	$RES_seriesTitle = array() ;
	foreach( $series_arrGroupidGroupkey as $idx => $serie_arrGroupidGroupkey ) {
		$serieTitle_arrGroupIdGroupLabel = array() ;
		foreach( $serie_arrGroupidGroupkey as $group_id => $group_key ) {
			if( $group_key=='%%%' ) {
				// Qmerge case : dummy/unactive group
				continue ;
			}
			foreach( $RES['RES_labels'] as $RES_labels_tab ) {
				if( isset($RES_labels_tab['group_id']) && $RES_labels_tab['group_id']==$group_id && $RES_labels_tab['group_key']==$group_key ) {
					$serieTitle_arrGroupIdGroupLabel[$group_id] = $RES_labels_tab['tab_title'] ;
				}
				if( isset($RES_labels_tab['arr_grid-x'][$group_id][$group_key]) ) {
					$serieTitle_arrGroupIdGroupLabel[$group_id] = $RES_labels_tab['arr_grid-x'][$group_id][$group_key] ;
				}
				if( isset($RES_labels_tab['arr_grid-y'][$group_id][$group_key]) ) {
					$serieTitle_arrGroupIdGroupLabel[$group_id] = $RES_labels_tab['arr_grid-y'][$group_id][$group_key] ;
				}
			}
		}
		if( $serieTitle_arrGroupIdGroupLabel ) {
			// "regular" serie : serie defined by group pivot
			foreach( $serieTitle_arrGroupIdGroupLabel as $groupId => &$groupLabel ) {
				if( is_array($groupLabel) ) {
					unset($groupLabel['_id']) ;
					unset($groupLabel['_parent_id']) ;
					$groupLabel = implode(' ',$groupLabel) ;
				}
			}
			unset($groupLabel) ;
		} else {
			$serieTitle_arrGroupIdGroupLabel = array() ;
		}
		
		// "select" serie : serie defined by selectId
		$select_id = $series_selectId[$idx] ;
		$select_lib = NULL ;
		if( $RES['RES_selectId_infos'] ) { // Qmerge
			if( count($RES['RES_selectId_infos']) > 1 ) {
				$select_lib = $RES['RES_selectId_infos'][$select_id]['select_lib'] ;
			}
		} else { // Query
			if( count($RES['RES_titles']['fields_select']) > 1 ) {
				$select_lib = $RES['RES_titles']['fields_select'][$select_id] ;
			}
		}
		
		$serieTitle = array() ;
		if( $select_lib ) {
			$serieTitle[] = $select_lib ;
		}
		$serieTitle = array_merge($serieTitle, $serieTitle_arrGroupIdGroupLabel) ;
		$RES_seriesTitle[] = $serieTitle ;
	}
	// Suppress duplicate substrings in titles
	if( count($RES_seriesTitle) > 1 ) {
		$idxStrs = array() ;
		foreach( $RES_seriesTitle as $serieTitle ) {
			foreach( $serieTitle as $idx => $serieTitleStr ) {
				if( !isset($idxStrs[$idx]) ) {
					$idxStrs[$idx] = array() ;
				}
				if( !in_array($serieTitleStr,$idxStrs[$idx]) ) {
					$idxStrs[$idx][] = $serieTitleStr ;
				}
			}
		}
		foreach( $idxStrs as $idx => $strs ) {
			if( count($strs) == 1 ) {
				foreach( $RES_seriesTitle as &$serieTitle ) {
					unset($serieTitle[$idx]) ;
				}
				unset($serieTitle) ;
			}
		}
		unset($idxStrs) ;
	}
	
	
	$RES_stepsLabel = array() ;
	$RES_stepsSerieValue = array() ;
	foreach( $iterationFlat as $step_arrGroupidGroupkey ) {
		$sRES_stepLabel = array() ;
		foreach( $step_arrGroupidGroupkey as $groupId => $groupKey ) {
			$sRES_stepLabel[$groupId] = $CHART_labels[$groupId][$groupKey] ;
			if( is_array($sRES_stepLabel[$groupId]) ) {
				unset($sRES_stepLabel[$groupId]['_id']) ;
				unset($sRES_stepLabel[$groupId]['_parent_id']) ;
				$sRES_stepLabel[$groupId] = implode("\n",$sRES_stepLabel[$groupId]) ;
			}
		}
		$RES_stepsLabel[] = $sRES_stepLabel ;
		
		
		$sRES_serieValue = array() ;
		foreach( $series_arrGroupidGroupkey as $idx => $serie_arrGroupidGroupkey ) {
			$select_id = $series_selectId[$idx] ;
		
			$group_desc = $step_arrGroupidGroupkey + $serie_arrGroupidGroupkey ;
			$key_id = paracrm_queries_charts_getGroupKey($RES, $group_desc) ;
			
			if( isset($RES['RES_groupKey_selectId_value']) ) { // mode QUERY
				if( $key_id === FALSE ) {
					$value = $RES['RES_selectId_nullValue'][$select_id] ;
				} else {
					$value = $RES['RES_groupKey_selectId_value'][$key_id][$select_id] ;
					$cfg_round = $RES['RES_selectId_round'][$select_id] ;
					if( $cfg_round > 0 ) {
						$value = round($value,$cfg_round) ;
					} else {
						$value = round($value) ;
					}
				}
			}
			
			if( isset($RES['RES_selectId_groupKey_value']) ) { // mode QMERGE
				$value = $RES['RES_selectId_groupKey_value'][$select_id][$key_id] ;
				$cfg_round = $RES['RES_selectId_infos'][$select_id]['math_round'] ;
				if( $cfg_round > 0 ) {
					$value = round($value,$cfg_round) ;
				} else {
					$value = round($value) ;
				}
			}
			
			$sRES_serieValue[] = $value ;
		}
		
		$RES_stepsSerieValue[] = $sRES_serieValue ;
	}
	
	
	
	$RES_iteration_title = array() ;
	foreach( $chart_iteration_groupIds as $groupId ) {
		if( isset($RES['RES_titles']['group_title'][$groupId]) ) {
			$RES_iteration_title[] = $RES['RES_titles']['group_title'][$groupId] ;
		}
	}
	
	
	
	return array(
		'stepsSerieValue' => $RES_stepsSerieValue,
		'stepsLabel'=> $RES_stepsLabel,
		'iterationTitle' => $RES_iteration_title ,
		'seriesTitle' => $RES_seriesTitle,
		'seriesColor' => $RES_seriesColor,
		'seriesType' => $RES_seriesType,
		'seriesAxis' => $RES_seriesAxis
	) ;
}



function paracrm_queries_charts_getFlatIteration( $arr_grid_y, $pos )
{
	if( !$arr_grid_y ) {
		return NULL ;
	}
	reset( $arr_grid_y ) ;
	for( $i=0 ; $i<$pos ; $i++ )
	{
		next( $arr_grid_y ) ;
	}
	
	$group_id = key($arr_grid_y) ;
	
	$tab = array() ;
	foreach( current($arr_grid_y) as $group_key => $dummy )
	{
		$arr = array() ;
		$arr[$group_id] = $group_key ;
		if( $pos + 1 == count($arr_grid_y) )
			$tab[] = $arr ;
		else
		{
			foreach( paracrm_queries_paginate_getGridRows_iterate( $arr_grid_y, $pos+1 ) as $sub_arr )
			{
				$sub_arr = $arr + $sub_arr ;
				$tab[] = $sub_arr ;
			}
		}
	}
	return $tab ;
}
function paracrm_queries_charts_getGroupKey( &$RES, $search_group_desc )
{
	// mise en cache de la table de l'annuaire $RES_groupKey_groupDesc
	if( !isset($RES['RES_groupHash_groupKey']) ) {
		//echo "begin...";
		$RES_groupHash_groupKey = array() ;
		foreach( $RES['RES_groupKey_groupDesc'] as $key_id => $group_desc )
		{
			ksort($group_desc) ;
			$group_hash = implode('@@',$group_desc) ;
			$RES_groupHash_groupKey[$group_hash] = $key_id ;
		}
		//echo "end  ".count($RES_groupHash_groupKey)." \n" ;
		$RES['RES_groupHash_groupKey'] = $RES_groupHash_groupKey ;
	}
	
	ksort($search_group_desc) ;
	if( !isset($RES['RES_groupHash_groupKey']) ) {
		//echo "WARN" ;
	}
	$group_hash = implode('@@',$search_group_desc) ;
	if( !$key_id = $RES['RES_groupHash_groupKey'][$group_hash] ) {
		return FALSE ;
	}
	return $key_id ;
}

?>