<?php

function specDbsPeople_promo_getGrid( $post_data ) {
	$forward_post = array() ;
	$forward_post['start'] ;
	$forward_post['limit'] ;
	$forward_post['file_code'] = 'WORK_PROMO' ;
	
	$ttmp = paracrm_data_getFileGrid_data( $forward_post ) ;
	$paracrm_TAB = $ttmp['data'] ;
	
	$TAB = array() ;
	foreach( $paracrm_TAB as $paracrm_row ) {
		$row = array() ;
		$row['promo_id'] = $paracrm_row['WORK_PROMO_field_PROMO_CODE'] ;
		$row['country_code'] = $paracrm_row['WORK_PROMO_field_COUNTRY'] ;
		$row['status_percent'] = $paracrm_row['WORK_PROMO_field_STATUS_entry_PERCENT'] ;
		$row['status_text'] = $paracrm_row['WORK_PROMO_field_STATUS_entry_STATUS_TXT'] ;
		$row['date_start'] = date('Y-m-d',strtotime($paracrm_row['WORK_PROMO_field_DATE_START'])) ;
		$row['date_end'] = date('Y-m-d',strtotime($paracrm_row['WORK_PROMO_field_DATE_END'])) ;
		$row['store_text'] = $paracrm_row['WORK_PROMO_field_STORE_tree_STOREGROUP_TXT'] ;
		$row['prod_text'] = $paracrm_row['WORK_PROMO_field_PROD_tree_PRODGROUPTXT'] ;
		$row['calc_uplift_vol'] = $paracrm_row['WORK_PROMO_field_CALC_UPLIFT_VOL'] ;
		$row['calc_uplift_per'] = $paracrm_row['WORK_PROMO_field_CALC_UPLIFT_PER'] ;
		$row['calc_roi'] = $paracrm_row['WORK_PROMO_field_CALC_ROI'] ;
		
		$TAB[] = $row ;
		$TAB[] = $row ;
	}
	return array('success'=>true, 'data'=>$TAB, 'debug'=>$paracrm_TAB) ;
}

?>