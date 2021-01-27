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



function specRsiRecouveo_risk_fetchXml( $post_data ) {
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
	
	$xml_binary = specRsiRecouveo_risk_lib_ES_pingXml($risk_register_id) ;
	
	return array(
		'success'=>true,
		'data' => array(
			'xml_binary' => $xml_binary,
			'data_obj' => array()
		)
	) ;
}


?>
