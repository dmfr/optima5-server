<?php

include("$server_root/modules/spec_rsi_recouveo/include/specRsiRecouveo_risk_lib_ellisphere.inc.php") ;

function specRsiRecouveo_risk_lib_getConfig() {
	$fields = [
		'risk_on',
		'risk_provider',
		'risk_es_gatewayUrl',
		'risk_es_contractId',
		'risk_es_userPrefix',
		'risk_es_userId',
		'risk_es_password'	
	];
	
	$config_risk = array() ;
	
	$json = specRsiRecouveo_config_loadMeta(array()) ;
	$config_meta = $json['data'] ;
	foreach( $fields as $field ) {
		if( !isset($config_meta[$field]) ) {
			$config_meta[$field] = '' ;
			$_do_save = TRUE ;
		}
		$config_risk[$field] = $config_meta[$field] ;
	}
	if( $_do_save ) {
		specRsiRecouveo_config_saveMeta( array(
			'data' => json_encode($config_meta)
		) );
	}
	return $config_risk ;
}








function specRsiRecouveo_risk_autoAccount( $post_data ) {
	//global $_opDB ;
	
	$acc_id = $post_data['acc_id'] ;
	$force_search  = $post_data['force_search'] ;
	
	if( !$force_search ) {
		// tentative de load ?
		$json_loadResult = specRsiRecouveo_risk_loadResult(array('acc_id'=>$acc_id)) ;
		//print_r($json_loadResult) ;
		if( $json_loadResult['data'] && $json_loadResult['data']['risk_register_id'] ) {
			specRsiRecouveo_risk_saveResult(array(
				'acc_id' => $acc_id,
				'data' => json_encode(array('id_register'=>$json_loadResult['data']['risk_register_id']))
			)) ;
			return ;
		}
	}
	
	// recherche 
	// - si une seule réponse => saveResult
	// - si plusieurs, recherche nom exact, si un seul => saveResult
	$json_doSearch = specRsiRecouveo_risk_doSearch(array(
		'acc_id' => $acc_id,
		'data' => json_encode(array('search_mode'=>'_','search_txt'=>''))
	));
	$risk_register_id = NULL ;
	while( TRUE ) {
		$obj_search = $json_doSearch['data'] ;
		if( !$obj_search ) {
			break ;
		}
		$search_rows = $obj_search['rows'] ;
		//print_r($search_rows) ;
		if( !$search_rows ) {
			break ;
		}
		if( count($search_rows) == 1 ) {
			$risk_register_id = $search_rows[0]['id'] ;
			break ;
		}
		
		$acc_row = paracrm_lib_data_getRecord('bible_entry','LIB_ACCOUNT',$acc_id) ;
		
		$arr_exactName_registers = array() ;
		foreach( $search_rows as $search_row ) {
			if( $search_row['name'] == $acc_row['field_ACC_NAME'] ) {
				$arr_exactName_registers[] = $search_row['id'] ;
			}
		}
		if( count($arr_exactName_registers) == 1 ) {
			$risk_register_id = reset($arr_exactName_registers) ;
		}
	
		break ;
	}
	if( $risk_register_id ) {
		specRsiRecouveo_risk_saveResult(array(
			'acc_id' => $acc_id,
			'data' => json_encode(array('id_register'=>$risk_register_id))
		)) ;
	}
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
		$arr_ins['field_META_SCORE'] = isset($result_data['data_obj']['score_int']) ? $result_data['data_obj']['score_int'] : -1 ;
		$arr_ins['field_META_SCORE_PROG'] = isset($result_data['data_obj']['score_prog_int']) ? $result_data['data_obj']['score_prog_int'] : 0 ;
		$arr_ins['field_META_PAYRANK'] = isset($result_data['data_obj']['payrank_int']) ? $result_data['data_obj']['payrank_int'] : -1 ;
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
		'data' => $result_data + array(
			'risk_register_id' => $risk_register_id,
			'accrisk_filerecord_id' => $accrisk_filerecord_id,
		)
	) ;
}
function specRsiRecouveo_risk_saveResult( $post_data ) {
	return specRsiRecouveo_risk_fetchResult( $post_data, $do_save=true ) ;
}
function specRsiRecouveo_risk_loadResult( $post_data ) {
	global $_opDB ;
	
	$acc_id = $post_data['acc_id'] ;
	$query = "SELECT * FROM view_file_ACC_RISK WHERE field_ACC_ID='{$acc_id}' ORDER BY filerecord_id DESC LIMIT 1" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result)==0 ) {
		return array('success'=>true, 'data'=>null) ;
	}
	$arr = $_opDB->fetch_assoc($result) ;
	$accrisk_filerecord_id = $arr['filerecord_id'] ;
	
	
	$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
	$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;
	media_contextOpen( $_sdomain_id ) ;
	$media_id = media_bin_toolFile_getId('ACC_RISK',$accrisk_filerecord_id) ;
	$xml_binary = media_bin_getBinary($media_id) ;
	media_contextClose() ;
	
	if( !$xml_binary ) {
		return array('success'=>true, 'data'=>null) ;
	}
	
	return array(
		'success'=>true,
		'data' => array(
			'risk_register_id' => $arr['field_DL_ID'],
			'accrisk_filerecord_id' => $accrisk_filerecord_id,
			'xml_binary' => $xml_binary,
			'data_obj' => specRsiRecouveo_risk_lib_ES_getResultObjDecode($xml_binary)
		)
	) ;
}


?>
