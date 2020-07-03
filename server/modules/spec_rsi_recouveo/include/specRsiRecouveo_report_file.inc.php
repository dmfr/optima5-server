<?php

function specRsiRecouveo_report_getFileElements( $post_data ) {
	global $_opDB ;
	
	$p_accId = $post_data['acc_id'] ;
	
	if( !$p_accId ) {
		return array('success'=>false) ;
	}
	
	if( !isset($post_data['timerange_months']) ) {
		$d_start = $post_data['timerange_datestart'] ;
		$d_end = $post_data['timerange_dateend'] ;
	} else {
		$p_timerangeMonths = $post_data['timerange_months'] ;
		if( !is_numeric($p_timerangeMonths) || $p_timerangeMonths < 1 ) {
			$p_timerangeMonths = 1 ;
		}
		
		$d = new DateTime();
		$d->modify('last day of -1 month') ;
		$d_end = $d->format('Y-m-d') ;
		
		$d = new DateTime();
		$d->modify( "first day of -{$p_timerangeMonths} months" );
		$d_start = $d->format('Y-m-d') ;
	}
	
	$query = "SELECT DATE(min(fa.field_DATE_ACTUAL))
				FROM view_file_FILE_ACTION fa
				JOIN view_file_FILE f ON f.filerecord_id=fa.filerecord_parent_id
				WHERE f.field_LINK_ACCOUNT='{$p_accId}' AND fa.field_STATUS_IS_OK='1' AND DATE(fa.field_DATE_ACTUAL)<>'0000-00-00'" ;
	$d_begin = $_opDB->query_uniqueValue($query) ;
	
	
	
	$tobj_formSummary = specRsiRecouveo_report_getGrid( array(
		'filters' => json_encode(array(
			'filter_account' => array($p_accId),
			'filter_date' => array(
				'date_start'  =>  $d_begin,
				'date_end'    =>  date('Y-m-d')
			)
		)),
		'reportval_ids' => json_encode(array('actions?aclass=auto','actions?aclass=manual','dso_avg'))
	));
	
	$tobj_chartHistory = specRsiRecouveo_report_getGrid( array(
		'filters' => json_encode(array(
			'filter_account' => array($p_accId),
			'filter_date' => array(
				'date_start'  =>  $d_start,
				'date_end'    =>  $d_end
			)
		)),
		'axes' => json_encode(array(
			'timebreak_is_on' => true,
			'timebreak_group' => "MONTH",
			'groupby_is_on' => true,
			'groupby_key' => "status"
		)),
		'reportval_ids' => json_encode(array("wallet?wvalue=amount"))
	));
	$tobj_chartDso = specRsiRecouveo_report_getGrid( array(
		'filters' => json_encode(array(
			'filter_account' => array($p_accId),
			'filter_date' => array(
				'date_start'  =>  $d_start,
				'date_end'    =>  $d_end
			)
		)),
		'axes' => json_encode(array(
			'timebreak_is_on' => true,
			'timebreak_group' => "MONTH"
		)),
		'reportval_ids' => json_encode(array("dso_avg"))
	));
	
	
	return array(
		'success' => true,
		'data' => array(
			'form_summary' => $tobj_formSummary,
			'chart_history' => $tobj_chartHistory,
			'chart_dso' => $tobj_chartDso
		)
	);
}

?>
