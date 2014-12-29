<?php

function specDbsPeople_cfg_getTree( $post_data ) {
	global $_opDB ;
	
	$cfgParam_id = $post_data['cfgParam_id'] ;
	
	switch( strtolower($cfgParam_id) ) {
		case 'whse' :
			$bible_code = 'CFG_WHSE' ;
			$field_txt_treenode = 'field_SITE_TXT' ;
			$field_txt_entry = 'field_WHSE_TXT' ;
			break ;
			
		case 'team' :
			$bible_code = 'CFG_TEAM' ;
			$field_txt_treenode = 'field_TEAM_TXT' ;
			$field_txt_entry = 'field_TEAM_TXT' ;
			break ;
			
		default :
			return ;
	}
	
	$view_name_tree = 'view_bible_'.$bible_code.'_tree' ;
	$view_name_entry = 'view_bible_'.$bible_code.'_entry' ;
	
	$tab_parentkey_nodes = array() ;
	$query = "SELECT * FROM $view_name_tree" ;
	$result = $_opDB->query($query);
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$record = array() ;
		$record['nodeId'] = 't_'.$arr['treenode_key'] ;
		$record['nodeType'] = 'treenode' ;
		$record['nodeKey'] = $arr['treenode_key'] ;
		$record['nodeText'] = $arr[$field_txt_treenode] ;
	
		$tab_parentkey_nodes[$arr['treenode_parent_key']][$arr['treenode_key']] = $record ;
	}
	$query = "SELECT * FROM $view_name_entry" ;
	$result = $_opDB->query($query);
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$record = array() ;
		$record['nodeId'] = 'e_'.$arr['entry_key'] ;
		$record['nodeType'] = 'entry' ;
		$record['nodeKey'] = $arr['entry_key'] ;
		$record['nodeText'] = $arr[$field_txt_entry] ;
	
		$tab_parentkey_nodes[$arr['treenode_key']][] = $record ;
	}
	
	/*
	$view_name_entry = 'view_bible_'.$bible_code.'_entry' ;
	$arr_treenode_nbEntries = array() ;
	$query = "select treenode_key, count(*) from $view_name_entry group by treenode_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE )
	{
		$arr_treenode_nbEntries[$arr[0]] = $arr[1] ;
	}
	*/
	
	foreach( $tab_parentkey_nodes as $treenode_parent_key => $arr1 )
	{
		foreach( $arr1 as $treenode_key => $record )
		{
			$tab_parentkey_nodes[$treenode_parent_key][$treenode_key] = $record ;
		}
		ksort($tab_parentkey_nodes[$treenode_parent_key]) ;
	}
	
	// print_r($tab_parentkey_nodes) ;
	
	$TAB_json = specDbsPeople_cfg_getTree_call( $tab_parentkey_nodes, '' ) ;
	//$TAB_json[] = array('field_PRODLINE'=>'POM','field_PRODLINEDESC'=>'Pom Juices','expanded'=>true,'children'=>array(array('field_PRODLINE'=>'POM_C','field_PRODLINEDESC'=>'Pom Cold','leaf'=>true),array('field_PRODLINE'=>'POM_H','field_PRODLINEDESC'=>'Pom Hot','leaf'=>true))) ;
	return array(
		'success'=>true,
		'dataRoot'=>array(
			'nodeId'=>'',
			'nodeKey'=>'',
			'nodeText'=>'<b>Toutes valeurs</b>',
			'expanded'=>true,
			'children'=>$TAB_json
		)
	) ;
}
function specDbsPeople_cfg_getTree_call( $tab_parentkey_nodes, $treenode_parent_key )
{
	global $_opDB ;
	
	$TAB_json = array() ;
	if( !$tab_parentkey_nodes[$treenode_parent_key] )
		return array() ;
	foreach( $tab_parentkey_nodes[$treenode_parent_key] as $treenode_key => $record )
	{
		if( $child_tab = specDbsPeople_cfg_getTree_call( $tab_parentkey_nodes, $treenode_key ) )
		{
			$leaf_only = TRUE ;
			foreach( $child_tab as $node ) {
				if( !$node['leaf'] ) {
					$leaf_only = FALSE ;
				}
			}
			$record['expanded'] = !$leaf_only ;
			$record['expandable'] = !$leaf_only ;
			$record['leaf_only'] = $leaf_only ;
			$record['icon'] = ($leaf_only ? 'images/op5img/ico_leaf_small.gif' : '') ;
			$record['children'] = $child_tab ;
		}
		else
		{
			$record['leaf'] = ( $record['nodeType'] == 'entry' ) ;
			$record['children'] = array() ;
		}
		$TAB_json[] = $record ;
	}
	return $TAB_json ;
}





function specDbsPeople_cfg_getCfgBibles() {
	global $_opDB ;
	
	$TAB = array() ;
	
	$query = "SELECT field_CONTRACT_CODE, field_CONTRACT_TXT FROM view_bible_CFG_CONTRACT_entry ORDER BY field_CONTRACT_CODE " ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$TAB['CONTRACT'][] = array('id'=>$arr[0],'text'=>$arr[1]) ;
	}
	
	$query = "SELECT field_ROLE_CODE, field_ROLE_TXT, field_IS_VIRTUAL FROM view_bible_CFG_ROLE_entry ORDER BY field_ROLE_CODE " ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$TAB['ROLE'][] = array('id'=>$arr[0],'text'=>$arr[0].' - '.$arr[1],'is_virtual'=>($arr[2]==1)) ;
	}
	
	$halfDay_ABS = array() ;
	$query = "SELECT field_ABS_CODE FROM view_bible_CFG_ABS_entry ORDER BY field_ABS_CODE" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$ttmp = explode(':',$arr[0]) ;
		$abs_code = $ttmp[0] ;
		if( count($ttmp) == 2 && $ttmp[1] == '2' ) {
			$halfDay_ABS[$abs_code] = TRUE ;
		}
	}
	$query = "SELECT field_ABS_CODE, field_ABS_TXT, treenode_key FROM view_bible_CFG_ABS_entry ORDER BY field_ABS_CODE" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$ttmp = explode(':',$arr[0]) ;
		if( count($ttmp) > 1 ) {
			continue ;
		}
		$abs_code = $ttmp[0] ;
		
		$treenode_key = $arr[2] ;
		$auth_class = '' ;
		if( in_array($treenode_key,array('ADMIN','RH','CEQ')) ) {
			$auth_class = $treenode_key ;
		}
		$TAB['ABS'][] = array('id'=>$arr[0],'text'=>$arr[0].' - '.$arr[1],'auth_class'=>$auth_class,'halfDay_open'=>($halfDay_ABS[$abs_code]==TRUE)) ;
	}
	
	$query = "SELECT field_WHSE_CODE, field_WHSE_TXT FROM view_bible_CFG_WHSE_entry ORDER BY field_WHSE_TXT" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$TAB['WHSE'][] = array('id'=>$arr[0],'text'=>$arr[1]) ;
	}
	
	$query = "SELECT field_TEAM_CODE, field_TEAM_TXT FROM view_bible_CFG_TEAM_entry ORDER BY field_TEAM_TXT" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$TAB['TEAM'][] = array('id'=>$arr[0],'text'=>$arr[1]) ;
	}
	
	$query = "SELECT field_CLI_CODE, field_CLI_NAME FROM view_bible_CFG_CLI_tree ORDER BY field_CLI_NAME" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$TAB['CLI'][] = array('id'=>$arr[0],'text'=>$arr[1]) ;
	}
	
	$query = "SELECT field_UO_CODE, field_UO_TXT FROM view_bible_CFG_UO_entry ORDER BY field_UO_TXT" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$TAB['UO'][] = array('id'=>$arr[0],'text'=>$arr[1]) ;
	}
	
	return array('success'=>true, 'data'=>$TAB) ;
}

function specDbsPeople_tool_getContracts() {
	global $_opDB ;
	
	$TAB = array() ;
	$query = "SELECT * FROM view_bible_CFG_CONTRACT_entry" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$contract_code = $arr['field_CONTRACT_CODE'] ;
		
		$std_dayson = array() ;
		if( $arr['field_STD_DAYSON'] ) {
			foreach( json_decode($arr['field_STD_DAYSON'],true) as $ISO8601_day ) {
				$std_dayson[$ISO8601_day] = TRUE ;
			}
		} elseif( $arr['field_STD_DAYLENGTH']==0 && $arr['field_STD_DAYLENGTH_MAX']==0 ) {
			continue ;
		}
		
		$TAB[$contract_code] = array(
			'contract_code' => $contract_code,
			'contract_txt' => $arr['field_CONTRACT_TXT'],
			'std_dayson' => $std_dayson,
			'std_daylength' => $arr['field_STD_DAYLENGTH'],
			'std_daylength_min' => $arr['field_STD_DAYLENGTH_MIN'],
			'std_daylength_max' => $arr['field_STD_DAYLENGTH_MAX'],
			'mod_week_std' => $arr['field_MOD_WEEK_STD'],
			'mod_week_max' => $arr['field_MOD_WEEK_MAX'],
			'rc_month_floor' => $arr['field_RC_MONTH_FLOOR'],
			'rc_ratio' => $arr['field_RC_RATIO']
		);
	}
	return $TAB ;
}

function specDbsPeople_tool_getRealDays_forPeople() {
	global $_opDB ;
	
	$query = "SELECT DATE(field_DATE), field_PPL_CODE FROM view_file_PEOPLEDAY" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$sql_date = $arr[0] ;
		$people_code = $arr[1] ;
		$tab_realDays[$people_code][$sql_date] = TRUE ;
	}
	return $tab_realDays ;
}
function specDbsPeople_tool_getRealDays_forDate() {
	global $_opDB ;
	
	$query = "SELECT DATE(field_DATE), field_PPL_CODE FROM view_file_PEOPLEDAY" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$sql_date = $arr[0] ;
		$people_code = $arr[1] ;
		$tab_realDays[$sql_date][$people_code] = TRUE ;
	}
	return $tab_realDays ;
}
function specDbsPeople_tool_getExceptionDays($sql_dates=NULL) {
	global $_opDB ;
	
	$arr_days = array() ;
	if( is_array($sql_dates) ) {
		foreach( $sql_dates as $sql_date ) {
			$arr_days[$sql_date] = FALSE ;
		}
	}
	
	$query = "SELECT DATE(field_DATE_EXCEPTION) FROM view_file_CFG_EXCEPTION_DAY
			WHERE field_EXCEPTION_IS_ON='1'" ;
	if( is_array($sql_dates) ) {
		$query.= " AND DATE(field_DATE_EXCEPTION) IN ".$_opDB->makeSQLlist($sql_dates) ;
	}
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$sql_date = $arr[0] ;
		$arr_days[$sql_date] = TRUE ;
	}
	return $arr_days ;
}





function specDbsPeople_cfg_getPeopleCalcAttributes() {
	$TAB = array() ;
	
	$TAB[] = array(
		'peopleCalcAttribute' => 'CP',
		'text' => 'Solde CP',
		'calcUnit_day' => true
	);
	
	$TAB[] = array(
		'peopleCalcAttribute' => 'RTT',
		'text' => 'RTT',
		'calcUnit_day' => true
	);
	
	$TAB[] = array(
		'peopleCalcAttribute' => 'MOD',
		'text' => 'Modul.',
		'calcUnit_hour' => true
	);
	
	$TAB[] = array(
		'peopleCalcAttribute' => 'RC',
		'text' => 'ReposComp.',
		'calcUnit_hour' => true
	);
	
	return array('success'=>true, 'data'=>$TAB) ;
}






function specDbsPeople_cfg_getPeopleFields() {
	$return_fields = specDbsPeople_lib_peopleFields_getPeopleFields() ;
	if( !$return_fields ) {
		return array('success'=>false) ;
	}
	return array('success'=>true, 'data'=>$return_fields) ;
}






function specDbsPeople_cfg_getLinks() {
	global $_opDB ;
	
	$obj_whse_arrCliCodes = array() ;
	$obj_whse_defaultCliCode = array() ;
	
	$obj_whse_arrRoleCodes = array() ;
	
	$query = "SELECT entry_key, treenode_key FROM view_bible_CFG_WHSE_entry" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$whse_entryKey = $arr[0] ;
		$whse_treenodeKey = $arr[1] ;
		
		$cli_links = paracrm_lib_bible_queryBible(
			'CFG_CLI',
			array(
				'CFG_WHSE' => array(
					'record_type' => 'treenode',
					'record_key' => $whse_treenodeKey
				)
			),
			$return_treenodes=TRUE
		) ;
		$whse_arrCliCodes = array() ;
		foreach( $cli_links as $cli_linkRow ) {
			$whse_arrCliCodes[] = $cli_linkRow['treenode_key'] ;
			if( $cli_linkRow['field_IS_DEFAULT'] ) {
				$obj_whse_defaultCliCode[$whse_entryKey] = $cli_linkRow['treenode_key'] ;
			}
		}
		$obj_whse_arrCliCodes[$whse_entryKey] = $whse_arrCliCodes ;
		
		$role_links = paracrm_lib_bible_queryBible(
			'CFG_ROLE',
			array(
				'CFG_WHSE' => array(
					'record_type' => 'treenode',
					'record_key' => $whse_treenodeKey
				)
			),
			$return_treenodes=FALSE
		) ;
		$whse_arrRoleCodes = array() ;
		foreach( $role_links as $role_linkRow ) {
			$whse_arrRoleCodes[] = $role_linkRow['entry_key'] ;
		}
		$obj_whse_arrRoleCodes[$whse_entryKey] = $whse_arrRoleCodes ;
	}
	
	
	$obj_whseTreenode_arrCliCodes = array() ;
	$query = "SELECT treenode_key FROM view_bible_CFG_WHSE_tree" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$whse_treenodeKey = $arr[0] ;
		
		$cli_links = paracrm_lib_bible_queryBible(
			'CFG_CLI',
			array(
				'CFG_WHSE' => array(
					'record_type' => 'treenode',
					'record_key' => $whse_treenodeKey
				)
			),
			$return_treenodes=TRUE
		) ;
		$whseTreenode_arrCliCodes = array() ;
		foreach( $cli_links as $cli_linkRow ) {
			$whseTreenode_arrCliCodes[] = $cli_linkRow['treenode_key'] ;
		}
		$obj_whseTreenode_arrCliCodes[$whse_treenodeKey] = $whseTreenode_arrCliCodes ;
	}
	
	$raw_records = array() ;
	$query = "SELECT treenode_key, treenode_parent_key FROM store_bible_CFG_WHSE_tree ORDER BY treenode_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$record = array() ;
		$record['key'] = 'T:'.$arr['treenode_key'] ;
		$record['parent_key'] = 'T:'.$arr['treenode_parent_key'] ;
		$raw_records[] = $record ;
	}
	$query = "SELECT entry_key, treenode_key FROM store_bible_CFG_WHSE_entry ORDER BY entry_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$record = array() ;
		$record['key'] = 'E:'.$arr['entry_key'] ;
		$record['parent_key'] = 'T:'.$arr['treenode_key'] ;
		$raw_records[] = $record ;
	}
	$tree_WHSE = new GenericTree("&") ;
	do {
		$nb_pushed_this_pass = 0 ;
		foreach( $raw_records as $mid => $record )
		{
			if( $record['parent_key'] == 'T:' )
				$record['parent_key'] = '&' ;
			if( $record['key'] == '' )
				continue ;
		
			$parent_key = $record['parent_key'] ;
			$key = $record['key'] ;
			
			if( $tree_WHSE->getTree( $parent_key ) != NULL )
			{
				$parent_node = $tree_WHSE->getTree( $parent_key ) ;
				$parent_node->addLeaf( $key ) ;
				unset($raw_records[$mid]) ;
				
				$nb_pushed_this_pass++ ;
				$nb_pushed++ ;
			}
			if( count($raw_records) == 0 )
				break ;
		}
	}
	while( $nb_pushed_this_pass > 0 ) ;
	
	$obj_whse_arrTransfertWhses = array() ;
	$query = "SELECT entry_key, treenode_key FROM view_bible_CFG_WHSE_entry" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$whse_entryKey = $arr[0] ;
		
		$node = $tree_WHSE->getTree('E:'.$whse_entryKey) ;
		if( $node == NULL ) {
			continue ;
		}
		while( $node->getDepth() > 1 ) {
			$node = $node->getParent() ;
		}
		$arr_leafs = array() ;
		foreach( $node->getAllMembers() as $nodeKey ) {
			if( substr($nodeKey,0,2) == 'E:' ) {
				$arr_leafs[] = substr($nodeKey,2) ;
			}
		}
		$obj_whse_arrTransfertWhses[$whse_entryKey] = $arr_leafs ;
	}
	
	
	
	return array(
		'success' => true,
		'data' => array(
			'obj_whse_arrCliCodes' => $obj_whse_arrCliCodes,
			'obj_whseTreenode_arrCliCodes' => $obj_whseTreenode_arrCliCodes,
			'obj_whse_defaultCliCode' => $obj_whse_defaultCliCode,
			
			'obj_whse_arrRoleCodes' => $obj_whse_arrRoleCodes,
			
			'obj_whse_arrTransfertWhses' => $obj_whse_arrTransfertWhses
		)
	);
}

?>