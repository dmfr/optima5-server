<?php
$GLOBALS['__specDbsTracy_lib_TMS_URL'] = 'https://services.schenkerfrance.fr/gateway_PPD/rest/ship/v1/label/create' ;

function specDbsTracy_lib_TMS_doLabelCreate( $row_trspt ) {
	global $_opDB ;
	$_STORE_DATE = date('Y-m-d H:i:s') ;
	$_STORE_PEER = 'DBS_CREATELABEL' ;
	
	$request_filerecordId = NULL ;
	$response_filerecordId = NULL ;
	$response_success = NULL ;
	$preview_filerecordId = NULL ;
	
	// Query EDI parameters
	$edi_record = paracrm_lib_data_getRecord('bible_entry','CFG_EDI','TRSPT_API') ;
	if( !$edi_record ) {
		return array(
			'success'=>false,
			'error_cls' => 'TRACY',
			'error_txt' => 'API token/cfg'
		) ;
	}
	$edi_params = array() ;
	foreach( explode(';',$edi_record['field_OUT_PARAMS']) as $keyval ) {
		$ttmp = explode('=',$keyval,2) ;
		$mkey = trim($ttmp[0]) ;
		$mval = trim($ttmp[1]) ;
		$edi_params[$mkey] = $mval ;
	}
	if( !$edi_params || !$edi_params['TOKEN'] ) {
		return array(
			'success'=>false,
			'error_cls' => 'TRACY',
			'error_txt' => 'API token/cfg'
		) ;
	}
	$_token = $edi_params['TOKEN'] ;
	
	// Query LIST_CARRIERPROD
	if( !$row_trspt['mvt_carrier_prod'] ) {
		return array(
			'success'=>false,
			'error_cls' => 'TRACY',
			'error_txt' => 'Not carrier/int.'
		) ;
	}
	$carrierprod_record = paracrm_lib_data_getRecord('bible_entry','LIST_CARRIERPROD',$row_trspt['mvt_carrier_prod']) ;
	if( !$carrierprod_record ) {
		return array(
			'success'=>false,
			'error_cls' => 'TRACY',
			'error_txt' => 'Carrier/int. parameters missing'
		) ;
	}
	
	// Query CFG_SOC
	$cfgsoc_record = paracrm_lib_data_getRecord('bible_entry','CFG_SOC',$row_trspt['id_soc']) ;
	$cfgsoc_adr = json_decode($cfgsoc_record['field_TRSPT_ADR_ORIG'],true) ;
	//print_r($cfgsoc_adr) ;
	
	// CALC : Valeur
	$value_currency = '' ;
	$value_amount = 0 ;
	foreach( $row_trspt['orders'] as $order_iter ) {
		if( $order_iter['desc_value'] && $order_iter['desc_value_currency'] ) {
			$value_currency = $order_iter['desc_value_currency'] ;
			$value_amount += $order_iter['desc_value'] ;
			break ;
		}
	}
	$desc_txt = NULL ;
	foreach( $row_trspt['orders'] as $order_iter ) {
		if( $order_iter['desc_txt'] ) {
			$desc_txt = $order_iter['desc_txt'] ;
			break ;
		}
	}
	
	$dest_adr = NULL ;
	foreach( $row_trspt['orders'] as $order_iter ) {
		if( $order_iter['adr_json'] ) {
			$dest_adr = json_decode($order_iter['adr_json'],true) ;
			break ;
		}
	}
	
	$json_parcels = array() ;
	foreach( $row_trspt['hats'] as $hat_iter ) {
		foreach( $hat_iter['parcels'] as $hatparcel_iter ) {
			$json_parcels[] = array(
				"customReference" => $hatparcel_iter['hatparcel_filerecord_id'],
				"depth" => $hatparcel_iter['vol_dims'][2],
				"description" => $desc_txt,
				"height" => $hatparcel_iter['vol_dims'][1],
				//"hsCode" => "string",
				//"originCountryCode" => "string",
				"weight" => $hatparcel_iter['vol_kg'],
				"width" => $hatparcel_iter['vol_dims'][0]
			) ;
		}
	}
	if( !$json_parcels ) {
		return array(
			'success'=>false,
			'error_cls' => 'TRACY',
			'error_txt' => 'No parcels declared'
		) ;
	}
	
	$json = array(
		"format" => "ZPL",
		//"printer" => "FOO",
		"provider" => $carrierprod_record['field_API_PROVIDER'],
		"shipment" => array(
			"consignee" => array(
				"city" => $dest_adr['TOWN'],
				"companyName" => $row_trspt['atr_consignee'],
				"contactName" => $dest_adr['CONTACT'],
				"countryCode" => $dest_adr['COUNTRY'],
				//"divisionCode" => "string",
				//"fax" => "string",
				//"mail" => "test@mirabel-sil.com",
				"phone" => $dest_adr['PHONE'],
				"postalCode" => $dest_adr['PCODE'],
				"street1" => $dest_adr['ADR1'],
				"street2" => $dest_adr['ADR2'],
				//"street3" => "string"
			),
			"customsDeclaration" => array(
				"currencyCode" => $value_currency,
				"declaredValue" => $value_amount,
				//"termsOfTrade" => "string"
			),
			"distanceUnit" => "CM",
			"parcels" => $json_parcels,
			"payor" => "SHIPPER",
			"payorAccountNumber" => $row_trspt['mvt_carrier_account'],
			"service" => $carrierprod_record['field_API_SERVICE'],
			"shipper" => array(
				"city" => $cfgsoc_adr['TOWN'],
				"companyName" => $cfgsoc_adr['NAME'],
				"contactName" => $cfgsoc_adr['CONTACT'],
				"countryCode" => $cfgsoc_adr['COUNTRY'],
				//"divisionCode" => "string",
				//"fax" => "string",
				//"mail" => "test@mirabel-sil.com",
				"phone" => $cfgsoc_adr['PHONE'],
				"postalCode" => $cfgsoc_adr['PCODE'],
				"street1" => $cfgsoc_adr['ADR1'],
				"street2" => $cfgsoc_adr['ADR2'],
				//"street3" => "string"
			),
			"weightUnit" => "KG"
		),
		"size" => "SIZE_8_4"
	) ;
	
	$arr_ins = array() ;
	$arr_ins['field_TRSPT_ID'] = $row_trspt['trspt_filerecord_id'] ;
	$arr_ins['field_STORE_DATE'] = $_STORE_DATE ;
	$arr_ins['field_STORE_PEER'] = $_STORE_PEER ;
	$arr_ins['field_STORE_TAG'] = 'REQUEST' ;
	if( $request_filerecordId = paracrm_lib_data_insertRecord_file( 'TMS_STORE', 0, $arr_ins ) ) {
		$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
		$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;
		media_contextOpen( $_sdomain_id ) ;
		$tmp_media_id = media_bin_processBuffer( json_encode($json,JSON_PRETTY_PRINT) ) ;
		media_bin_move( $tmp_media_id , media_bin_toolFile_getId('TMS_STORE',$request_filerecordId) ) ;
		media_contextClose() ;
	}
	
	while(TRUE) {
		$post_url = $GLOBALS['__specDbsTracy_lib_TMS_URL'] ;
		$params = array('http' => array(
		'method' => 'POST',
		'content' => json_encode($json),
		'timeout' => 600,
		'ignore_errors' => true,
		'header'=>"Authorization: {$_token}\r\n"."accept: application/json\r\n"."Content-Type: application/json\r\n"
		));
		$ctx = stream_context_create($params);
		$fp = fopen($post_url, 'rb', false, $ctx);
		if( !$fp ) {
			break ;
		}
		$status_line = $http_response_header[0] ;
		preg_match('{HTTP\/\S*\s(\d{3})}', $status_line, $match);
		$status = $match[1];
		$response_success = ($status == 200) ;
		
		$arr_ins = array() ;
		$arr_ins['field_TRSPT_ID'] = $row_trspt['trspt_filerecord_id'] ;
		$arr_ins['field_STORE_DATE'] = $_STORE_DATE ;
		$arr_ins['field_STORE_PEER'] = $_STORE_PEER ;
		$arr_ins['field_STORE_TAG'] = ($response_success ? 'RESPONSE_OK' : 'RESPONSE_NOK') ;
		$arr_ins['field_STORE_HTTP_STATUS'] = $status ;
		$resp = stream_get_contents($fp) ;
		$response_filerecordId = paracrm_lib_data_insertRecord_file( 'TMS_STORE', 0, $arr_ins ) ;
		if( $json = @json_decode($resp,true) ) {
			$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
			$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;
			media_contextOpen( $_sdomain_id ) ;
			$tmp_media_id = media_bin_processBuffer( json_encode($json,JSON_PRETTY_PRINT) ) ;
			media_bin_move( $tmp_media_id , media_bin_toolFile_getId('TMS_STORE',$response_filerecordId) ) ;
			media_contextClose() ;
		}
		if( !$response_success ) {
			break ;
		}
		
		print_r($json) ;
	
		break ;
	}
}

function specDbsTracy_lib_TMS_getLabel( $trspt_filerecord_id, $trsptevent_filerecord_id=null, $force_create=false ) {
	
	
}

/*
function specDbsTracy_lib_TMS_getTransactions( $trspt_filerecord_id ) {

}
*/


?>
