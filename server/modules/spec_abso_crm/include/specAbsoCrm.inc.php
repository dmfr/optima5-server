<?php
function specAbsoCrm_dashboard_getMonth( $post_data ) {
	$TAB = specAbsoCrm_tool_runQuery('crm:dashboard:month') ;
	
	$time = time() ;
	
	$rows = array(
		'current' => date('Y',strtotime('-1 year',$time)).' - '.date('Y',$time),
		'previous' => date('Y',strtotime('-2 year',$time)).' - '.date('Y',strtotime('-1 year',$time))
	) ;
	
	$columns = array('current'=>array(),'previous'=>array()) ;
	for( $i=11 ; $i>=0 ; $i-- ) {
		$columns['current'][] = array(
			'key' => date('Y-m',strtotime('-'.$i.' month',$time)),
			'text_full' => date('M y',strtotime('-'.$i.' month',$time)),
			'text_short' => date('M',strtotime('-'.$i.' month',$time))
		);
	}
	for( $i=23 ; $i>=12 ; $i-- ) {
		$columns['previous'][] = array(
			'key' => date('Y-m',strtotime('-'.$i.' month',$time)),
			'text_full' => date('M y',strtotime('-'.$i.' month',$time)),
			'text_short' => date('M',strtotime('-'.$i.' month',$time))
		);
	}
	
	return array('success'=>true, 'columns'=>$columns, 'rows'=>$rows, 'data'=>$TAB) ;
}

function specAbsoCrm_tool_runQuery( $q_id, $where_params=NULL ) {
	global $_opDB ;
	
	if( !is_numeric($q_id) ) {
		$query = "SELECT query_id FROM query WHERE query_name LIKE '{$q_id}'";
		$q_id = $_opDB->query_uniqueValue($query) ;
		if( !$q_id ) {
			return NULL ;
		}
	}
	
	$arr_saisie = array() ;
	paracrm_queries_builderTransaction_init( array('query_id'=>$q_id) , $arr_saisie ) ;
	
	foreach( $arr_saisie['fields_where'] as &$field_where ) {
		foreach( $field_where as $mkey => $mvalue ) {
			if( isset($where_params[$mkey]) ) {
				$field_where[$mkey] = $where_params[$mkey] ;
			}
		}
		unset($field_where) ;
	}
	
	$RES = paracrm_queries_process_query($arr_saisie , FALSE ) ;
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
	
	// Isolation du groupe 'PEOPLE'
	if( count($RES['RES_labels'][0]['arr_grid-y']) == 0 ) {
		$date_isOn = FALSE ;
		$date_groupId = NULL ;
		$date_groupMap = NULL ;
	} elseif( count($RES['RES_labels'][0]['arr_grid-y']) == 1 ) {
		$date_isOn = TRUE ;
		$date_groupId = key($RES['RES_labels'][0]['arr_grid-y']) ;
		if( $arr_saisie['fields_group'][$date_groupId]['field_type'] != 'date' ) {
			return NULL ;
		}
		$date_groupMap = array() ;
		foreach( $RES['RES_labels'][0]['arr_grid-y'][$date_groupId] as $mkey => $dummy ) {
			$date_groupMap[$mkey] = $mkey ;
		}
	} else {
		// More than 2 groups ?
		return NULL ;
	}
	
	
	$selectMap = $RES['RES_titles']['fields_select'] ;
	
	$ROW = array() ;
	if( $date_isOn ) {
		foreach( $date_groupMap as $date => $dummy ) {
			$groupDesc = array() ;
			$groupDesc[$date_groupId] = $date ;
			ksort($groupDesc) ;
			$groupHash = implode('@@',$groupDesc) ;
			$key_id = $RES['RES_groupHash_groupKey'][$groupHash] ;
			
			$ROW[$date] = array() ;
			foreach( $selectMap as $select_id => $select_lib ) {
				$ROW[$date][$select_lib] = ( ($key_id && $RES['RES_groupKey_selectId_value'][$key_id]) ? $RES['RES_groupKey_selectId_value'][$key_id][$select_id] : $RES['RES_selectId_nullValue'][$select_id] ) ;
			}
		}
	}
	
	return $ROW ;
}

?>