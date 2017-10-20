<?php

function specRsiRecouveo_lib_scenario_attach( $reassign=FALSE ) {
	global $_opDB ;
	
	$query = "SELECT filerecord_id 
			FROM view_file_FILE f
			JOIN view_bible_CFG_STATUS_tree cs ON cs.treenode_key=f.field_STATUS
			WHERE cs.field_SCHED_LOCK='0' AND cs.field_SCHED_NONE='0' AND f.field_STATUS_CLOSED_VOID<>'1' AND f.field_STATUS_CLOSED_END<>'1'" ;
	if( !$reassign ) {
		$query.= " AND f.field_SCENARIO=''" ;
	}
	//echo $query ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$file_filerecord_id = $arr[0] ;
		specRsiRecouveo_lib_scenario_attachFile( $file_filerecord_id ) ;
	}
}
function specRsiRecouveo_lib_scenario_attachFile( $file_filerecord_id ) {
	global $_opDB ;
	
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_atr = $ttmp['data']['cfg_atr'] ;

	
	/*
	**********************************************************************
	- Recherche scenario(S) approprié , ORDER BY min_balance
	- SI pas de scenario => attrib
	- SI scenario Actuel > 1er résultat => upgrade (scenario supérieur)
	- SI scenario Actuel hors cadre => pas de downgrade
	**************************************************
	*/
	$json = specRsiRecouveo_file_getRecords( array(
		'filter_fileFilerecordId_arr' => json_encode(array($file_filerecord_id))
	)) ;
	$file_record = $json['data'][0] ;
	$assign_scenario = NULL ;
	
	$query = "SELECT * FROM view_bible_SCENARIO_tree WHERE 1" ;
	foreach( $cfg_atr as $atr_record ) {
		// TODO / HACK ! Migrer vers nouveau format scénario
		/*
		$mkey = $atr_record['atr_field'] ;
		$mvalue = $file_record[$mkey] ;
		$query.= " AND ( field_LINK_{$mkey} IN ('','[]') OR field_LINK_{$mkey} LIKE '%\\\"&\\\"%' OR field_LINK_{$mkey} LIKE '%\\\"{$mvalue}\\\"%')" ;
		*/
	}
	$query.= " ORDER BY field_BALANCE_MIN DESC" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		if( $arr['field_BALANCE_MIN'] > $file_record['inv_amount_due'] ) {
			continue ;
		}
		$assign_scenario = $arr['treenode_key'] ;
		break ;
	}
	
	if( $assign_scenario ) {
		$arr_update = array('field_SCENARIO'=>$assign_scenario) ;
		paracrm_lib_data_updateRecord_file( 'FILE', $arr_update, $file_record['file_filerecord_id']);
		
		if( $file_record['next_action']=='BUMP' ) {
			$forward_post = array() ;
			$forward_post['fileaction_filerecord_id'] = $file_record['next_fileaction_filerecord_id'] ;
			$forward_post['link_status'] = $file_record['status'] ;
			$forward_post['link_action'] = $file_record['next_action'] ;
			
			// next action ?
			$json = specRsiRecouveo_file_getScenarioLine( array(
				'file_filerecord_id' => $file_record['file_filerecord_id'],
				'fileaction_filerecord_id' => $file_record['next_fileaction_filerecord_id']
			)) ;
			foreach( $json['data'] as $scenline_dot ) {
				if( $scenline_dot['is_next'] ) {
					$forward_post['next_action'] = $scenline_dot['link_action'] ;
					$forward_post['scen_code'] = $assign_scenario ;
					$forward_post['next_scenstep_code'] = $scenline_dot['scenstep_code'] ;
					$forward_post['next_scenstep_tag'] = $scenline_dot['scenstep_tag'] ;
					$forward_post['next_date'] = $scenline_dot['date_sched'] ;
				}
			}
			
			$post_data = array(
				'file_filerecord_id' => $file_record['file_filerecord_id'],
				'data' => json_encode($forward_post)
			);
			specRsiRecouveo_action_doFileAction($post_data) ;
		}
	}
}

?>
