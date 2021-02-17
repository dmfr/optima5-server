<?php

include("$server_root/modules/spec_rsi_recouveo/include/specRsiRecouveo_risk_lib_ellisphere.inc.php") ;

function specRsiRecouveo_risk_getAccount( $post_data ) {


}
function specRsiRecouveo_risk_doSearch( $post_data ) {
	$acc_id = $post_data['acc_id'] ;
	$search_data = json_decode($post_data['data'],true) ;
	
	$obj_search = specRsiRecouveo_risk_lib_ES_getSearchObj($acc_id,$search_data['search_mode'],$search_data['search_txt']) ;

	return array('success'=>true, 'data'=>$obj_search, 'debug'=>$post_data, 'debug2'=>$search_data) ;
}
function specRsiRecouveo_risk_fetchPdf( $post_data ) {
	$acc_id = $post_data['acc_id'] ;
	$search_data = json_decode($post_data['data'],true) ;
	$risk_register_id = preg_replace("/[^a-zA-Z0-9]/", "", $search_data['id_register']) ;
	if( !$risk_register_id ) {
		return array('success'=>false) ;
	}
	
	$ttmp = specRsiRecouveo_account_open(array('acc_id'=>$acc_id)) ;
	$account_record = $ttmp['data'] ;
	if( !$account_record ) {
		return array('success'=>false) ;
	}
	
	$filename = 'Risk_Report_'.$risk_register_id.'.pdf' ;
	if( !$post_data['confirm'] ) {
		foreach( $account_record['attachments'] as $iter_attachment_row ) {
			if( $iter_attachment_row['bin_filename'] == $filename ) {
				return array('success'=>true, 'confirm'=>true) ;
			}
		}
	}
	
	$pdf_binary = specRsiRecouveo_risk_lib_ES_pingPdf($risk_register_id) ;
	specRsiRecouveo_account_uploadAttachment( array(
		'acc_id' => $acc_id,
		'bin_filename' => $filename,
		'bin_replace' => true,
		'bin_desc' => 'Rapport Ellisphere au '.date('d/m/Y'),
		'bin_base64' => base64_encode($pdf_binary)
	)) ;
	
	return array('success'=>true) ;
}


function specRsiRecouveo_risk_loadResult( $data_data ) {


}


function specRsiRecouveo_risk_fetchResult( $post_data, $do_save=FALSE ) {
	$acc_id = $post_data['acc_id'] ;
	$search_data = json_decode($post_data['data'],true) ;
	$risk_register_id = preg_replace("/[^a-zA-Z0-9]/", "", $search_data['id_register']) ;
	if( !$risk_register_id ) {
		return array('success'=>false) ;
	}
	
	$ttmp = specRsiRecouveo_account_open(array('acc_id'=>$acc_id)) ;
	$account_record = $ttmp['data'] ;
	if( !$account_record ) {
		return array('success'=>false) ;
	}
	
	$result_data = specRsiRecouveo_risk_lib_ES_getResultObj($risk_register_id) ;
	if( !$result_data ) {
		return array('success'=>false) ;
	}
	
	if( $do_save ) {
		$arr_ins = array() ;
		$arr_ins['field_ACC_ID'] = $acc_id ;
		$arr_ins['field_DL_ID'] = $risk_register_id ;
		$arr_ins['field_DL_DATE'] = date('Y-m-d H:i:s') ;
		$arr_ins['field_DL_PROVIDER'] = 'ES' ;
		$arr_ins['field_META_SCORE'] = $result_data['data_obj']['score_int'] ;
		$arr_ins['field_META_SCORE_PROG'] = $result_data['data_obj']['score_prog_int'] ;
		$arr_ins['field_META_PAYRANK'] = $result_data['data_obj']['payrank_int'] ;
		$accrisk_filerecord_id = paracrm_lib_data_insertRecord_file( 'ACC_RISK', 0, $arr_ins );
		
		$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
		$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;
		media_contextOpen( $_sdomain_id ) ;
		$media_id = media_bin_processBuffer($result_data['xml_binary']) ;
		media_bin_move( $media_id,  media_pdf_toolFile_getId('ACC_RISK',$accrisk_filerecord_id) ) ;
		media_contextClose() ;
	}
	
	return array(
		'success'=>true,
		'data' => $result_data
	) ;
}
function specRsiRecouveo_risk_saveResult( $post_data ) {
	return specRsiRecouveo_risk_fetchResult( $post_data, $do_save=true ) ;
}


?>
