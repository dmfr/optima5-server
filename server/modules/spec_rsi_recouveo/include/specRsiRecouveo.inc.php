<?php
include("$server_root/modules/spec_rsi_recouveo/include/specRsiRecouveo_file.inc.php") ;
include("$server_root/modules/spec_rsi_recouveo/include/specRsiRecouveo_action.inc.php") ;
include("$server_root/modules/spec_rsi_recouveo/include/specRsiRecouveo_account.inc.php") ;
include("$server_root/modules/spec_rsi_recouveo/include/specRsiRecouveo_doc.inc.php") ;

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
			'status_txt' => $arr['field_TXT'],
			'status_code' => $arr['field_TXT'],
			'status_color' => $arr['field_COLOR'],
			'sched_none' => $arr['field_SCHED_NONE'],
			'sched_lock' => $arr['field_SCHED_LOCK']
		) ;
	}
	
	$TAB_action = array() ;
	$query = "SELECT * FROM view_bible_CFG_ACTION_entry WHERE 1 ORDER BY entry_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB_action[] = array(
			'action_id' => $arr['field_ACTION_CODE'],
			'action_txt' => $arr['field_ACTION_TXT'],
			'action_cls' => $arr['field_ACTION_CLS'],
			'group_id' => $arr['treenode_key'],
			'status_open' => json_decode($arr['field_LINK_STATUS_OPEN'],true),
			'status_next' => json_decode($arr['field_LINK_STATUS_NEXT'],true),
			'is_sched' => $arr['field_IS_SCHED'],
			'is_direct' => $arr['field_IS_DIRECT'],
			'agenda_class' => $arr['field_AGENDA_CLASS']
		) ;
	}
	
	$TAB_action_eta = array() ;
	$query = "SELECT * FROM view_bible_CFG_ACTION_ETA_entry WHERE 1 ORDER BY entry_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB_action_eta[] = array(
			'eta_range' => $arr['field_ETA_RANGE'],
			'eta_txt' => $arr['field_ETA_TXT'],
			'eta_color' => $arr['field_ETA_COLOR'],
			'upto_days' => $arr['field_UPTO_DAYS']
		) ;
	}
	
	$TAB_list_atr = array() ;
	$TAB_list_opt = array() ;
	$json_define = paracrm_define_getMainToolbar( array('data_type'=>'bible') , true ) ;
	foreach( $json_define['data_bible'] as $define_bible ) {
		if( strpos($define_bible['bibleId'],'ATR_')===0 || strpos($define_bible['bibleId'],'OPT_')===0 ) {
			$json_define_bible = paracrm_data_getBibleCfg(array('bible_code'=>$define_bible['bibleId'])) ;
			
			$bible_code = $define_bible['bibleId'] ;
			
			$records = array() ;
			$query = "SELECT * FROM view_bible_{$bible_code}_tree ORDER BY treenode_key" ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
				$parent = $arr['treenode_parent_key'] ;
				$node = $arr['treenode_key'] ;
				$id = $arr['treenode_key'] ;
				$lib = array() ;
				foreach( $json_define_bible['data']['tree_fields'] as $tree_field ) {
					if( strpos($tree_field['tree_field_code'],'field_')===0 && $tree_field['tree_field_is_header'] ) {
						$lib[] = $arr[$tree_field['tree_field_code']] ;
					}
				}
				$records[] = array('node'=>'', 'id'=>$id, 'parent'=>$parent, 'text'=>implode(' - ',$lib)) ;
			}
			
			$new_rec = array(
				'bible_code' => $bible_code,
				'atr_code' => substr($bible_code,4),
				'atr_txt' => $define_bible['text'],
				'records' => $records
			) ;
			
			if( strpos($define_bible['bibleId'],'ATR_')===0 ) {
				$TAB_list_atr[] = $new_rec ;
			}
			if( strpos($define_bible['bibleId'],'OPT_')===0 ) {
				$TAB_list_opt[] = $new_rec ;
			}
		}
	}
	
	$GLOBALS['cache_specRsiRecouveo_cfg']['getConfig'] = array(
		'cfg_atr' => $TAB_list_atr,
		'cfg_opt' => $TAB_list_opt,
		'cfg_status' => $TAB_status,
		'cfg_action' => $TAB_action,
		'cfg_action_eta' => $TAB_action_eta
	);
	
	return array('success'=>true, 'data'=>$GLOBALS['cache_specRsiRecouveo_cfg']['getConfig'])  ;
}






function specRsiRecouveo_util_htmlToPdf( $post_data ) {
	if( $output_pdf = specRsiRecouveo_util_htmlToPdf_buffer(json_decode($post_data['html'],true)) ) {
		$filename = ($post_data['filename'] ? $post_data['filename'] : 'PRINT'.'_'.time().'.pdf') ;
		header("Content-Type: application/force-download; name=\"$filename\""); 
		header("Content-Disposition: attachment; filename=\"$filename\""); 
		echo $output_pdf ;
	}
	die() ;
}
function specRsiRecouveo_util_htmlToPdf_buffer( $input_html ) {
	if( $output_pdf = media_pdf_html2pdf($input_html,'A4') ) {
		return $output_pdf ;
	}
	return NULL ;
}

?>
