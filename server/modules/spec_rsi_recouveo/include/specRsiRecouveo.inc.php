<?php
include("$server_root/modules/spec_rsi_recouveo/include/specRsiRecouveo_file.inc.php") ;

function specRsiRecouveo_cfg_doInit( $post_data ) {
	global $_opDB ;
	
	if( isset($_SESSION['login_data']['delegate_sdomainId']) ) {
		return array('success'=>true) ;
	}
	//specRsiRecouveo_lib_calc_perf() ;
	return array('success'=>true) ;
}


function specRsiRecouveo_cfg_getAuth( $post_data ) {
	global $_opDB ;
	
	if( !isset($_SESSION['login_data']['delegate_sdomainId']) ) {
		return array('success'=>true) ;
	}
	
	return array(
		'success' => true,
		'authPage' => array()
	) ;
}


function specRsiRecouveo_cfg_getConfig() {
	if( isset($GLOBALS['cache_specRsiRecouveo_cfg']['getConfig']) ) {
		return array(
			'success'=>true,
			'data' => $GLOBALS['cache_specRsiRecouveo_cfg']['getConfig']
		);
	}
	
	global $_opDB ;
	
	
	$GLOBALS['cache_specRsiRecouveo_cfg']['getConfig'] = array();
	
	$TAB_status = array() ;
	$query = "SELECT * FROM view_bible_CFG_STATUS_tree WHERE 1 ORDER BY treenode_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB_status[] = array(
			'status_id' => $arr['field_CODE'],
			'status_txt' => $arr['field_TEXT'],
			'status_code' => $arr['field_TEXT'],
			'status_color' => $arr['field_COLOR']
		) ;
	}
	
	$TAB_list = array() ;
	$json_define = paracrm_define_getMainToolbar( array('data_type'=>'bible') , true ) ;
	foreach( $json_define['data_bible'] as $define_bible ) {
		if( strpos($define_bible['bibleId'],'ATR_')===0 ) {
			$json_define_bible = paracrm_data_getBibleCfg(array('bible_code'=>$define_bible['bibleId'])) ;
			
			$bible_code = $define_bible['bibleId'] ;
			
			$records = array() ;
			$query = "SELECT * FROM view_bible_{$bible_code}_tree ORDER BY treenode_key" ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
				$node = $arr['treenode_key'] ;
				$id = $arr['treenode_key'] ;
				$lib = array() ;
				foreach( $json_define_bible['data']['tree_fields'] as $tree_field ) {
					if( strpos($tree_field['tree_field_code'],'field_')===0 && $tree_field['tree_field_is_header'] ) {
						$lib[] = $arr[$tree_field['tree_field_code']] ;
					}
				}
				$records[] = array('node'=>'', 'id'=>$id, 'text'=>implode(' - ',$lib)) ;
			}
			
			$TAB_list[] = array(
				'bible_code' => $bible_code,
				'atr_code' => substr($bible_code,4),
				'atr_txt' => $define_bible['text'],
				'records' => $records
			) ;
		}
	}
	
	$GLOBALS['cache_specRsiRecouveo_cfg']['getConfig'] = array(
		'cfg_atr' => $TAB_list,
		'cfg_status' => $TAB_status
	);
	
	return array('success'=>true, 'data'=>$GLOBALS['cache_specRsiRecouveo_cfg']['getConfig'])  ;
}







?>
