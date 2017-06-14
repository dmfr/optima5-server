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
	print_r($file_record) ;
	
	//print_r($file_record) ;
	$query = "SELECT * FROM view_bible_SCENARIO_tree WHERE 1" ;
	foreach( $cfg_atr as $atr_record ) {
		$mkey = $atr_record['bible_code'] ;
		$mvalue = $file_record[$mkey] ;
		$query.= " AND ( field_LINK_{$mkey} LIKE '%\\\"&\\\"%' OR field_LINK_{$mkey} LIKE '%\\\"{$mvalue}\\\"%')" ;
	}
	echo $query ;
	
}

?>
