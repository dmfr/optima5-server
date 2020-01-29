<?php
$GLOBALS['__specDbsTracy_lib_TMS_URL'] = 'https://services.schenkerfrance.fr/gateway_PPD/rest/ship/v1/label/create' ;
$GLOBALS['__specDbsTracy_lib_TMS_LABELAPI'] = 'http://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/' ;

function specDbsTracy_lib_TMS_doLabelCreateObj( $row_trspt ) {
	// Query LIST_CARRIERPROD
	if( !$row_trspt['mvt_carrier_prod'] ) {
		throw new Exception("TRACY : Not carrier/int.");
	}
	$consignee_record = paracrm_lib_data_getRecord('bible_entry','LIST_CONSIGNEE',$row_trspt['atr_consignee']) ;
	$carrierprod_record = paracrm_lib_data_getRecord('bible_entry','LIST_CARRIERPROD',$row_trspt['mvt_carrier_prod']) ;
	if( !$carrierprod_record ) {
		throw new Exception("TRACY : Carrier/int. parameters missing");
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
				"weight" => ceil($hatparcel_iter['vol_kg']),
				"width" => $hatparcel_iter['vol_dims'][0]
			) ;
		}
	}
	if( !$json_parcels ) {
		throw new Exception("TRACY : No parcels declared");
	}
	
	$json = array(
		"format" => "ZPL",
		//"printer" => "FOO",
		"provider" => $carrierprod_record['field_API_PROVIDER'],
		"shipment" => array(
			"consignee" => array(
				"city" => $dest_adr['TOWN'],
				"divisionCode" => $dest_adr['STATE'],
				"companyName" => $consignee_record ? $consignee_record['field_NAME'] : $row_trspt['atr_consignee'],
				"contactName" => $dest_adr['CONTACT'],
				"countryCode" => $dest_adr['COUNTRY'],
				//"divisionCode" => "string",
				//"fax" => "string",
				//"mail" => "test@mirabel-sil.com",
				"phone" => $dest_adr['PHONE'],
				"postalCode" => $dest_adr['PCODE'],
				"street1" => $dest_adr['ADR1'] ? $dest_adr['ADR1'] : $dest_adr['ADR2'],
				"street2" => $dest_adr['ADR1'] ? $dest_adr['ADR2'] : '',
				//"street3" => "string"
			),
			"customsDeclaration" => array(
				"currencyCode" => $value_currency,
				"declaredValue" => round($value_amount),
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

	return $json ;
}
function specDbsTracy_lib_TMS_doLabelCreate( $row_trspt, $obj_request=NULL ) {
	global $_opDB ;
	$_STORE_DATE = date('Y-m-d H:i:s') ;
	$_STORE_PEER = 'DBS_CREATELABEL' ;
	
	$map_tmsTag_filerecordId = array() ;
	
	$request_filerecordId = NULL ;
	$response_filerecordId = NULL ;
	$response_success = NULL ;
	$preview_filerecordId = NULL ;
	
	// Query EDI parameters
	$edi_record = paracrm_lib_data_getRecord('bible_entry','CFG_EDI','TRSPT_API') ;
	if( !$edi_record ) {
		throw new Exception("TRACY : API token/cfg");
	}
	$edi_params = array() ;
	foreach( explode(';',$edi_record['field_OUT_PARAMS']) as $keyval ) {
		$ttmp = explode('=',$keyval,2) ;
		$mkey = trim($ttmp[0]) ;
		$mval = trim($ttmp[1]) ;
		$edi_params[$mkey] = $mval ;
	}
	if( !$edi_params || !$edi_params['TOKEN'] ) {
		throw new Exception("TRACY : API token/cfg");
	}
	$_token = $edi_params['TOKEN'] ;
	
	if( !$obj_request ) {
		try {
			$obj_request = specDbsTracy_lib_TMS_doLabelCreateObj($row_trspt) ;
		} catch( Exception $e ) {
			throw new Exception($e->getMessage());
		}
	}
	
	$arr_ins = array() ;
	$arr_ins['field_FILE_TRSPT_ID'] = $row_trspt['trspt_filerecord_id'] ;
	$arr_ins['field_STORE_DATE'] = $_STORE_DATE ;
	$arr_ins['field_STORE_PEER'] = $_STORE_PEER ;
	$arr_ins['field_STORE_TAG'] = 'REQUEST' ;
	if( $request_filerecordId = paracrm_lib_data_insertRecord_file( 'TMS_STORE', 0, $arr_ins ) ) {
		$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
		$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;
		media_contextOpen( $_sdomain_id ) ;
		$tmp_media_id = media_bin_processBuffer( json_encode($obj_request,JSON_PRETTY_PRINT) ) ;
		media_bin_move( $tmp_media_id , media_bin_toolFile_getId('TMS_STORE',$request_filerecordId) ) ;
		media_contextClose() ;
	}
	$map_tmsTag_filerecordId[$arr_ins['field_STORE_TAG']] = $request_filerecordId ;
	
	while(TRUE) {
		$post_url = $GLOBALS['__specDbsTracy_lib_TMS_URL'] ;
		$params = array('http' => array(
		'method' => 'POST',
		'content' => json_encode($obj_request),
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
		$arr_ins['field_FILE_TRSPT_ID'] = $row_trspt['trspt_filerecord_id'] ;
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
		$map_tmsTag_filerecordId[$arr_ins['field_STORE_TAG']] = $response_filerecordId ;
		if( !$response_success ) {
			break ;
		}
		
		
		
		// RESULT_PREVIEW ?
		$binary_zpl = base64_decode($json['labelData']) ;
		$post_url = $GLOBALS['__specDbsTracy_lib_TMS_LABELAPI'] ;
		$params = array('http' => array(
		'method' => 'POST',
		'content' => $binary_zpl,
		'timeout' => 600,
		'ignore_errors' => true,
		'header'=>"Accept: image/png\r\n"
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
		
		if( $response_success ) {
			$arr_ins = array() ;
			$arr_ins['field_FILE_TRSPT_ID'] = $row_trspt['trspt_filerecord_id'] ;
			$arr_ins['field_STORE_DATE'] = $_STORE_DATE ;
			$arr_ins['field_STORE_PEER'] = $_STORE_PEER ;
			$arr_ins['field_STORE_TAG'] = 'RESULT_PNG' ;
			$arr_ins['field_STORE_HTTP_STATUS'] = $status ;
			$resultpng_filerecordId = paracrm_lib_data_insertRecord_file( 'TMS_STORE', 0, $arr_ins ) ;
			
			$binary_png = stream_get_contents($fp) ;
			
			$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
			$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;
			media_contextOpen( $_sdomain_id ) ;
			$tmp_media_id = media_bin_processBuffer( $binary_png ) ;
			media_bin_move( $tmp_media_id , media_bin_toolFile_getId('TMS_STORE',$resultpng_filerecordId) ) ;
			media_contextClose() ;
		} else {
			//echo stream_get_contents($fp) ;
		}
		$map_tmsTag_filerecordId[$arr_ins['field_STORE_TAG']] = $resultpng_filerecordId ;
	
		break ;
	}
	
	
	
	
	$event_txt = '' ;
	if( $json['labelData'] && $json['trackingNumber'] ) {
		$event_txt.= "Label create OK\n" ;
		$event_txt.= "Tracking no : {$json['trackingNumber']}\n" ;
	} else {
		$event_txt.= "Label create ERROR\n" ;
		if( is_array($json) ) {
			foreach( $json as $err ) {
				if( $err['code'] && $err['description'] ) {
					$event_txt.= "{$err['code']} : {$err['description']}\n" ;
				}
			}
		} else {
			$event_txt.= "HTTP Status code : {$status}\n" ;
		}
	}
	//print_r($json) ;
	
	$arr_ins = array() ;
	$arr_ins['field_EVENT_DATE'] = date('Y-m-d H:i:s') ;
	$arr_ins['field_EVENT_USER'] = 'TMS' ;
	$arr_ins['field_EVENT_TXT'] = $event_txt ;
	$arr_ins['field_EVENTLINK_FILE'] = 'TMS_STORE' ;
	$arr_ins['field_EVENTLINK_IDS_JSON'] = json_encode($map_tmsTag_filerecordId) ;
	$trsptevent_filerecord_id = paracrm_lib_data_insertRecord_file( 'TRSPT_EVENT', $row_trspt['trspt_filerecord_id'], $arr_ins );
	
	return $trsptevent_filerecord_id ;
}

function specDbsTracy_lib_TMS_getLabelEventId( $trspt_filerecord_id, $force_create=false ) {
	global $_opDB ;
	
	$json = specDbsTracy_trspt_getRecords(array(
		'filter_trsptFilerecordId_arr' => json_encode(array($trspt_filerecord_id))
	)) ;
	if( $json['success'] && (count($json['data'])==1) && ($json['data'][0]['trspt_filerecord_id']==$trspt_filerecord_id) ) {
		$row_trspt = $json['data'][0] ;
	}
	
	try {
		$obj_request = specDbsTracy_lib_TMS_doLabelCreateObj($row_trspt) ;
	} catch( Exception $e ) {
		throw new Exception($e->getMessage());
	}
	$json_request = json_encode($obj_request) ;
	
	while( !$force_create ) {
		$query = "SELECT te.filerecord_id as trsptevent_filerecord_id
				, te.field_EVENTLINK_IDS_JSON as tmsstore_link_json
				FROM view_file_TRSPT_EVENT te
				WHERE filerecord_parent_id='{$trspt_filerecord_id}'
				AND field_EVENTLINK_FILE='TMS_STORE'
				ORDER BY te.filerecord_id DESC LIMIT 1" ;
		$result = $_opDB->query($query) ;
		if( $_opDB->num_rows($result) != 1 ) {
			break ;
		}
		
		$arr = $_opDB->fetch_row($result) ;
		$trsptevent_filerecord_id = $arr[0] ;
		$tmsstore_link_json = json_decode($arr[1],true) ;
			
		$tmsstore_request_filerecord_id = ( $tmsstore_link_json['REQUEST'] ? $tmsstore_link_json['REQUEST'] : reset($tmsstore_link_json) );
		if( !$tmsstore_request_filerecord_id ) {
			break ;
		}
		
		$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
		$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;
		media_contextOpen( $_sdomain_id ) ;
		$binary_json = media_bin_getBinary( media_bin_toolFile_getId('TMS_STORE',$tmsstore_request_filerecord_id) ) ;
		$binary_json = json_encode(json_decode($binary_json,true)) ;
		media_contextClose() ;
		
		if( $binary_json!=json_encode($obj_request) ) {
			break ;
		}
		
		$sql_filerecordIds = $_opDB->makeSQLlist(array_values($tmsstore_link_json)) ;
		$query = "SELECT count(*) FROM view_file_TMS_STORE
					WHERE filerecord_id IN {$sql_filerecordIds}
					AND field_STORE_TAG='RESPONSE_OK'" ;
		if( $_opDB->query_uniqueValue($query) != 1 ) {
			break ;
		}
		
		$reuse_trsptevent_filerecord_id = $trsptevent_filerecord_id ;
		break ;
	}
	if( $reuse_trsptevent_filerecord_id ) {
		return $reuse_trsptevent_filerecord_id ;
	}
	if( !$reuse_trsptevent_filerecord_id ) {
		return specDbsTracy_lib_TMS_doLabelCreate($row_trspt,$obj_request) ;
	}
	
	return NULL ;
}

?>
