<?php

function specRsiRecouveo_report_getFileTopRecords( $post_data ) {
	global $_opDB ;
	
	if( $post_data['filter_soc'] ) {
		$filter_soc = json_decode($post_data['filter_soc'],true) ;
	}
	if( $post_data['filter_limit'] ) {
		$filter_limit = $post_data['filter_limit'] ;
	}
	
	if( !$filter_limit ) {
		return array('success'=>false) ;
	}
	
	$group_map = array() ;
	$query = "SELECT f.field_LINK_ACCOUNT as acc_id, sum(r.field_AMOUNT) as inv_amount_total
				FROM view_file_FILE f
				JOIN view_file_RECORD_LINK rl ON rl.field_LINK_FILE_ID=f.filerecord_id AND rl.field_LINK_IS_ON='1'
				JOIN view_file_RECORD r ON r.filerecord_id=rl.filerecord_parent_id
				JOIN view_bible_LIB_ACCOUNT_entry la ON la.entry_key = f.field_LINK_ACCOUNT
				WHERE r.field_AMOUNT>'0' AND f.field_STATUS_CLOSED_VOID='0' AND field_STATUS_CLOSED_END='0'" ;
	if( $filter_soc ) {
		$query.= " AND la.treenode_key IN ".$_opDB->makeSQLlist($filter_soc) ;
	}
	$query.= " GROUP BY f.field_LINK_ACCOUNT
				ORDER BY inv_amount_total DESC
				LIMIT {$filter_limit}" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$acc_id = $arr['acc_id'] ;
		$inv_amount_total = $arr['inv_amount_total'] ;
		$group_map[$acc_id] = (float)$inv_amount_total ;
	}
	
	$list_accIds = $_opDB->makeSQLlist(array_keys($group_map)) ;
	$filter_fileFilerecordId_list = array() ;
	$query = "SELECT f.filerecord_id FROM view_file_FILE f
				WHERE f.field_STATUS_CLOSED_VOID='0' AND f.field_STATUS_CLOSED_END='0' AND f.field_LINK_ACCOUNT IN {$list_accIds}" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$filter_fileFilerecordId_list[] = $arr[0] ;
	}
	
	$json = specRsiRecouveo_file_getRecords( array(
		'filter_fileFilerecordId_arr' => json_encode($filter_fileFilerecordId_list)
	)) ;
	foreach( $json['data'] as &$row ) {
		$acc_id = $row['acc_id'] ;
		$row['_accInvAmountTotal'] = $group_map[$acc_id] ;
	}
	unset($row) ;
	$usort = function($arr1,$arr2)
	{
		return (-1 * ($arr1['_accInvAmountTotal'] - $arr2['_accInvAmountTotal'])) ;
	};
	usort($json['data'],$usort) ;
	$json['debug'] = $group_map ;
	
	return $json ;
}

?>
