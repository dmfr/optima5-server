<?php

include("$server_root/modules/spec_dbs_tracy/include/specDbsTracy_order.inc.php") ;
include("$server_root/modules/spec_dbs_tracy/include/specDbsTracy_trspt.inc.php") ;
include("$server_root/modules/spec_dbs_tracy/include/specDbsTracy_attachments.inc.php") ;

function specDbsTracy_cfg_getAuth( $post_data ) {
	global $_opDB ;
	
	if( !isset($_SESSION['login_data']['delegate_sdomainId']) ) {
		return array('success'=>true) ;
	}
	$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() ) ;
	if( $_SESSION['login_data']['delegate_sdomainId'] != $t->dbCurrent_getSdomainId() ) {
		return array('success'=>false) ;
	}
	
	return array('success'=>true, 'authPage'=>array()) ;
}

function specDbsTracy_cfg_getConfig() {
	if( isset($GLOBALS['cache_specDbsLam_cfg']['getConfig']) ) {
		return array(
			'success'=>true,
			'data' => $GLOBALS['cache_specDbsLam_cfg']['getConfig']
		);
	}
	
	global $_opDB ;
	
	
	$TAB_soc = array() ;
	$query = "SELECT * FROM view_bible_CFG_SOC_entry ORDER BY field_SOC_CODE" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$soc_code = $arr['field_SOC_CODE'] ;
		$record = array(
			'soc_code' => $arr['field_SOC_CODE'],
			'soc_txt' => $arr['field_SOC_TXT']
		) ;
		
		$TAB_soc[] = $record ;
	}
	
	
	$TAB_priority = array() ;
	$query = "SELECT * FROM view_bible_LIST_SERVICE_entry WHERE 1 ORDER BY entry_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB_priority[] = array(
			'prio_id' => $arr['field_CODE'],
			'prio_txt' => $arr['field_TEXT'],
			'prio_code' => $arr['field_TEXT'],
			'prio_color' => $arr['field_COLOR']
		) ;
	}
	
	
	$TAB_orderflow = array() ;
	$query = "SELECT * FROM view_bible_CFG_ORDERFLOW_tree WHERE treenode_parent_key IN ('','&') ORDER BY treenode_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$flow_code = $arr['field_FLOW_CODE'] ;
		$record = array(
			'flow_code' => $arr['field_FLOW_CODE'],
			'flow_txt' => $arr['field_FLOW_TXT']
		) ;
		
		$TAB_orderflow[$flow_code] = $record ;
	}
	$query = "SELECT * FROM view_bible_CFG_ORDERFLOW_entry ORDER BY treenode_key, entry_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$flow_code = $arr['treenode_key'] ;
		if( !$TAB_orderflow[$flow_code] ) {
			continue ;
		}
		$step_code = $arr['field_STEP_CODE'] ;
		$record = array(
			'step_code' => $arr['field_STEP_CODE'],
			'step_txt' => $arr['field_STEP_TXT'],
			'status_percent' => $arr['field_PERCENT']
		) ;
		
		$TAB_orderflow[$flow_code]['steps'][] = $record ;
	}
	
	
	$TAB_list = array() ;
	$json_define = paracrm_define_getMainToolbar( array('data_type'=>'bible') , true ) ;
	foreach( $json_define['data_bible'] as $define_bible ) {
		if( strpos($define_bible['bibleId'],'LIST_')===0 ) {
			$json_define_bible = paracrm_data_getBibleCfg(array('bible_code'=>$define_bible['bibleId'])) ;
			
			$bible_code = $define_bible['bibleId'] ;
			
			$records = array() ;
			$query = "SELECT * FROM view_bible_{$bible_code}_entry ORDER BY entry_key" ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
				$id = $arr['entry_key'] ;
				$lib = array() ;
				foreach( $json_define_bible['data']['entry_fields'] as $entry_field ) {
					if( strpos($entry_field['entry_field_code'],'field_')===0 && $entry_field['entry_field_is_header'] ) {
						$lib[] = $arr[$entry_field['entry_field_code']] ;
					}
				}
				$records[] = array('id'=>$id, 'text'=>implode(' - ',$lib)) ;
			}
			
			$TAB_list[] = array(
				'bible_code' => $bible_code,
				'records' => $records
			) ;
		}
	}

	return array('success'=>true, 'data'=>array(
		'cfg_soc' => $TAB_soc,
		'cfg_orderflow' => array_values($TAB_orderflow),
		'cfg_priority' => $TAB_priority,
		'cfg_list' => $TAB_list
	))  ;
}
?>
