<?php

function specRsiRecouveo_bank_getRecords($post_data) {
	global $_opDB ;
	
	$subtable_recordgroup = "SELECT field_BANK_LINK_FILE_ID, field_RECORDGROUP_ID, field_RECORDGROUP_TYPE
									FROM view_file_RECORD r
									WHERE r.field_BANK_LINK_FILE_ID<>'0' AND r.field_RECORDGROUP_ID<>''
									AND r.field_BANK_LINK_FILE_ID NOT IN (select field_BANK_LINK_FILE_ID FROM view_file_RECORD WHERE field_RECORDGROUP_ID='')
									GROUP BY field_BANK_LINK_FILE_ID
									HAVING count(distinct field_RECORDGROUP_ID)='1'" ;
	
	$subtable_account = "SELECT r.field_BANK_LINK_FILE_ID, r.field_LINK_ACCOUNT, acc.field_ACC_NAME
								FROM view_file_RECORD r
								LEFT OUTER JOIN view_bible_LIB_ACCOUNT_entry acc ON acc.entry_key=r.field_LINK_ACCOUNT
								WHERE r.field_BANK_LINK_FILE_ID<>'0' AND field_BANK_CREATEBYALLOC='1'" ;
	
	$query = "SELECT b.*, rg.field_RECORDGROUP_ID as alloc_link_recordgroup, rg.field_RECORDGROUP_TYPE as alloc_link_recordgroup_type, a.field_LINK_ACCOUNT as alloc_link_account, a.field_ACC_NAME as alloc_link_account_txt";
	$query.= " FROM view_file_BANK b" ;
	$query.= " LEFT OUTER JOIN ($subtable_recordgroup) rg ON rg.field_BANK_LINK_FILE_ID=b.filerecord_id";
	$query.= " LEFT OUTER JOIN ($subtable_account) a ON a.field_BANK_LINK_FILE_ID=b.filerecord_id";
	$query.= " WHERE 1" ;
	$query.= " ORDER BY b.field_BANK_DATE DESC, b.field_BANK_TXT ASC" ;
	$result = $_opDB->query($query) ;
	
	$TAB = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$row = array(
			'bank_filerecord_id' => $arr['filerecord_id'],
			'bank_ref' => $arr['field_BANK_REF'],
			'bank_date' => date('Y-m-d',strtotime($arr['field_BANK_DATE'])),
			'bank_txt' => $arr['field_BANK_TXT'],
			'bank_amount' => (float)$arr['field_BANK_AMOUNT'],
			'alloc_is_ok' => !!$arr['field_ALLOC_TYPE'],
			'alloc_type' => $arr['field_ALLOC_TYPE'],
			'alloc_link_is_on' => ($arr['field_ALLOC_LINK_AMOUNT']>0),
			'alloc_link_recordgroup' => $arr['alloc_link_recordgroup'],
			'alloc_link_recordgroup_type' => $arr['alloc_link_recordgroup_type'],
			'alloc_link_account' => $arr['alloc_link_account'],
			'alloc_link_account_txt' => $arr['alloc_link_account_txt']
		);
		$TAB[] = $row ;
	}
	
	$calc_balance = 0 ;
	foreach( array_reverse($TAB,$preserve_keys=true) as $idx => $row ) {
		$calc_balance+= $row['bank_amount'] ;
		$TAB[$idx]['calc_balance'] = $calc_balance ;
	}
	
	return array('success'=>true, 'data'=>$TAB) ;
}

function specRsiRecouveo_bank_setAlloc($post_data) {
	global $_opDB ;
	$p_bankFilerecordId = $post_data['bank_filerecord_id'] ;
	$p_data = json_decode($post_data['data'],true) ;
	
	$query = "UPDATE view_file_BANK 
					SET field_ALLOC_TYPE='{$p_data['alloc_type']}'
					WHERE filerecord_id='{$p_bankFilerecordId}'" ;
	$_opDB->query($query) ;
	switch( $p_data['_type_allocation'] ) {
		case '_reset' :
			$query = "DELETE FROM view_file_RECORD WHERE field_BANK_LINK_FILE_ID='{$p_bankFilerecordId}' AND field_BANK_CREATEBYALLOC='1'" ;
			$_opDB->query($query) ;
			
			$query = "UPDATE view_file_RECORD SET field_BANK_LINK_FILE_ID='0'
					WHERE field_BANK_LINK_FILE_ID='{$p_bankFilerecordId}' AND field_BANK_CREATEBYALLOC='0'" ;
			$_opDB->query($query) ;
			
			$query = "UPDATE view_file_BANK SET field_ALLOC_LINK_AMOUNT='0'
					WHERE filerecord_id='{$p_bankFilerecordId}'" ;
			$_opDB->query($query) ;
			break ;
			
		case 'account' :
			if( $p_data['alloc_link_account']==NULL ) {
				break ;
			}
			$arr_ins = array(
				'field_RECORD_ID' => $p_data['bank_ref'],
				'field_TXT' => $p_data['bank_ref'],
				'field_LINK_ACCOUNT' => $p_data['alloc_link_account'],
				'field_TYPE' => 'TEMPREC',
				'field_DATE_RECORD' => $p_data['bank_date'],
				'field_DATE_VALUE' => $p_data['bank_date'],
				'field_AMOUNT' => -1 * $p_data['bank_amount'],
				'field_BANK_CREATEBYALLOC' => 1,
				'field_BANK_LINK_FILE_ID' => $p_bankFilerecordId
			);
			paracrm_lib_data_insertRecord_file( 'RECORD', 0, $arr_ins );
			
			$query = "UPDATE view_file_BANK SET field_ALLOC_LINK_AMOUNT=field_BANK_AMOUNT
					WHERE filerecord_id='{$p_bankFilerecordId}'" ;
			$_opDB->query($query) ;
			break ;
			
		case 'recordgroup_input' :
		case 'recordgroup_assoc' :
			if( $p_data['alloc_link_recordgroup']==NULL ) {
				break ;
			}
			$query = "UPDATE view_file_RECORD SET field_BANK_LINK_FILE_ID='{$p_bankFilerecordId}'
					WHERE field_RECORDGROUP_ID='{$p_data['alloc_link_recordgroup']}'" ;
			$_opDB->query($query) ;
					
			$query = "SELECT sum(field_AMOUNT) FROM view_file_RECORD
					WHERE field_RECORDGROUP_ID='{$p_data['alloc_link_recordgroup']}'" ;
			$sum_amount = $_opDB->query_uniqueValue($query) ;
			//$sum_amount = (-1 * $sum_amount) ;
			
			$query = "UPDATE view_file_BANK SET field_ALLOC_LINK_AMOUNT='{$sum_amount}'
					WHERE filerecord_id='{$p_bankFilerecordId}'" ;
			$_opDB->query($query) ;
			break ;
	}
	
	
	return array('success'=>true, 'debug'=>array($p_bankFilerecordId,$p_data)) ;
}

?>
