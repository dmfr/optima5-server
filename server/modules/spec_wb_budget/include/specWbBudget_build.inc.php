<?php

function specWbBudget_budgetbuild_getGrid( $post_data ) {
	global $_opDB ;
	
	
	// ********* CROP BOUNDARIES **************
	$filter_cropYear = $post_data['filter_cropYear'] ;
	
	// crop principal
	$query = "SELECT * FROM view_file__CFG_CROP WHERE field_CROP_YEAR='{$filter_cropYear}'" ;
	$result = $_opDB->query($query) ;
	$arr_crop = $_opDB->fetch_assoc($result) ;
	if( $arr_crop == FALSE ) {
		return array('success'=>false) ;
	}
	$down_limit = strtotime($arr_crop['field_DATE_APPLY']) ;
	
	// up_limit
	$query = "SELECT field_DATE_APPLY FROM view_file__CFG_CROP
		WHERE field_DATE_APPLY > '{$arr_crop['field_DATE_APPLY']}'
		ORDER BY field_DATE_APPLY LIMIT 1" ;
	$up_limit = $_opDB->query_uniqueValue($query) ;
	if( $up_limit == NULL ) {
		$up_limit = strtotime('+1 year',strtotime($arr_crop['field_DATE_APPLY'])) ;
	} else {
		$up_limit = strtotime($up_limit) ;
	}
	$up_limit = strtotime('-1 day',$up_limit) ;

	$to_sunday = 7 - date('N',$down_limit) ;
	$cursor = strtotime("+{$to_sunday} day",$down_limit) ;
	$columns = array() ;
	while( $cursor < $up_limit ) {
		$columns[] = array(
			'date_sql' => date('Y-m-d',$cursor),
			'week_text' => date('o/W',$cursor),
			'date_sql_start' => date('Y-m-d',strtotime('-6 days',$cursor)),
			'date_sql_end' => date('Y-m-d',$cursor)
		);
		$cursor = strtotime('+7 days',$cursor) ;
	}

	return array(
		'success'=>true,
		'prod_tree_root' => specWbBudget_tool_getProdsDataroot(),
		'columns' => $columns
	) ;
}







?>
