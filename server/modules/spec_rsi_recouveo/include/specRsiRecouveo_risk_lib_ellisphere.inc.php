<?php
function specRsiRecouveo_risk_lib_ES_utilParseAdr( $account_row ) {
	$fn_parseAdr = function( $acc_txt, $adr_string ) {
		$return_obj = array(
			'adr_nom' => $acc_txt
		) ;
		
		$adr_string = trim($adr_string) ;
		
		$adr_array = array() ;
		foreach( explode("\n",$adr_string) as $adr_line ) {
			$adr_line = trim($adr_line) ;
			$adr_line = str_replace('&','et',$adr_line) ;
			$adr_line = preg_replace('/[\x00-\x1F\x7F]/u', '', $adr_line);
			if( !trim($adr_line) ) {
				continue ;
			}
			$adr_array[] = $adr_line ;
		}
		
		$isCpVilleLine = function( $str ) {
			// multiword ? + hasDigits ?
			$words = explode(' ',$str) ;
			if( count($words) <= 1 ) {
				return FALSE ;
			}
			foreach( $words as $word ) {
				if( preg_match('~[0-9]~', $word) ) {
					return TRUE ;
				}
			}
		};
		$isFr = function( &$adr_array ) use($isCpVilleLine)  {
			$cnt = count($adr_array) ;
			$last_idx = $cnt - 1 ;
			$beforelast_idx = $cnt - 2 ;
			$last_line = $adr_array[$last_idx] ;
			$beforelast_line = $adr_array[$beforelast_idx] ;
			foreach( explode(' ',$last_line) as $lastline_word ) {
				if( in_array(strtolower($lastline_word),array('france','fr')) ) {
					unset($adr_array[$last_idx]) ;
					return TRUE ;
				}
			}
			if( $isCpVilleLine($last_line) ) {
				return TRUE ;
			}
			return FALSE ;
		};
		$sanitizeFrCpVilleLine = function( $line ) {
			$words = explode(' ',$line,2) ;
			$cp_word = $words[0] ;
			$cp_word = str_pad($cp_word, 5, "0", STR_PAD_LEFT) ;
			$ville_word = $words[1] ;
			return array(
				'adr_cp' => $cp_word,
				'adr_ville' => $ville_word,
				'adr_pays' => 'FR'
			);
		};
		
		if( !$isFr($adr_array) ) {
			$return_obj += array(
				'adr_pays' => 'FR'
			);
			return $return_obj ;
		}
		
		for( $i=0 ; $i<count($adr_array)-1 ; $i++ ) {
			if( $i > 1 ) {
				break ;
			}
			$mkey = 'adr_adr'.($i+1) ;
			$adr_line = $adr_array[$i] ;
			
			$return_obj[$mkey] = $adr_line ;
		}
		$return_obj += $sanitizeFrCpVilleLine(end($adr_array)) ;
		
		return $return_obj ;
	};
	
	$mapAdr_type_txt = array() ;
	foreach( $account_row['adrbook'] as $adrbook_row ) {
		foreach( $adrbook_row['adrbookentries'] as $adrbookentry_row ) {
			if( $adrbookentry_row['status_is_priority'] && !$adrbookentry_row['status_is_invalid'] ) {
				$mapAdr_type_txt[$adrbookentry_row['adr_type']] = $adrbookentry_row['adr_txt'] ;
			}
		}
	}
	return $fn_parseAdr($account_row['acc_txt'],$mapAdr_type_txt['POSTAL']) ;
}

function specRsiRecouveo_risk_lib_ES_getSearchObj( $acc_id, $mode, $txt ) {
	$ttmp = specRsiRecouveo_account_open(array('acc_id'=>$acc_id)) ;
	$account_record = $ttmp['data'] ;
	if( !$account_record ) {
		return NULL ;
	}

	
	$arr_xml = array() ;
	$rows = array() ;
	
	$arr_pings = array() ;
	switch( $mode ) {
		case '_' :
			$account_record['acc_txt'] = preg_replace('/\s+/', ' ',$account_record['acc_txt']);
			if($account_record['acc_siret']) {
				$arr_pings[] = array(
					'mode' => 'id_register',
					'parm1' => $account_record['acc_siret']
				) ;
			}
			if( ($arr_adr = specRsiRecouveo_risk_lib_ES_utilParseAdr($account_record)) && ($arr_adr['adr_pays']=='FR') ) {
				$arr_pings[] = array(
					'mode' => 'name_city',
					'parm1' => $account_record['acc_txt'],
					'parm2' => $arr_adr['adr_cp']
				) ;
				$arr_pings[] = array(
					'mode' => 'name_city',
					'parm1' => $account_record['acc_txt'],
					'parm2' => $arr_adr['adr_ville']
				) ;
				if( count($ttmp=explode(' ',$account_record['acc_txt'])) > 2 ) {
					$txt = $ttmp[0].' '.$ttmp[1] ;
					$arr_pings[] = array(
						'mode' => 'name_city',
						'parm1' => $txt,
						'parm2' => $arr_adr['adr_cp']
					) ;
					$arr_pings[] = array(
						'mode' => 'name_city',
						'parm1' => $txt,
						'parm2' => $arr_adr['adr_ville']
					) ;
				}
			}
			$arr_pings[] = array(
				'mode' => 'name_city',
				'parm1' => $account_record['acc_txt']
			) ;
			break ;
		case 'ID' :
			$arr_pings[] = array(
				'mode' => 'id_register',
				'parm1' => $txt
			) ;
			$arr_pings[] = array(
				'mode' => 'id_vat',
				'parm1' => $txt
			) ;
			break ;
		case 'NAME_CITY' :
			$ttmp = explode(',',$txt,2) ;
			$arr_pings[] = array(
				'mode' => 'name_city',
				'parm1' => trim($ttmp[0]),
				'parm2' => trim($ttmp[1])
			) ;
			break ;
		case 'MANAGER' :
			$ttmp = explode(',',$txt,2) ;
			$arr_pings[] = array(
				'mode' => 'manager',
				'parm1' => trim($ttmp[0]),
				'parm2' => trim($ttmp[1])
			) ;
			break ;
	}
	
	foreach( $arr_pings as $ping ) {
		list($xml_request, $xml_response) = specRsiRecouveo_risk_lib_ES_pingSearch( $ping['mode'], $ping['parm1'], $ping['parm2'] ) ;
		if( $xml_request ) {
			$arr_xml[] = array('type'=>'request','binary'=>$xml_request->asXML()) ;
		}
		if( $xml_response ) {
			$arr_xml[] = array('type'=>'response','binary'=>$xml_response->asXML()) ;
		}
		
		if( $xml_response ) {
			$xml_response = $xml_response->response ;
			
			if( isset($xml_response->establishment) ) {
			foreach( $xml_response->establishment as $xml_r_e ) {
				$row = array() ;
				$row['name'] = $xml_r_e->name->count() > 1 ? 
									''.$xml_r_e->name[0].' ('.$xml_r_e->name[1].')' : ''.$xml_r_e->name[0] ;
				
				$row['activity'] = $xml_r_e->activity->count() > 0 ? ''.$xml_r_e->activity[0] : '' ;
				
				$row['id'] = is_array($ttmp=$establishment_row['id']) ? 
								end($ttmp) : $ttmp ;
				$tmapIds_type_value = array() ;
				foreach( $xml_r_e->id as $xml_r_e_id ) {
					//var_dump($xml_r_e_id) ;
					if( $xml_r_e_id->attributes()->orderable == 'true' ) {
						$mkey = 'id' ;
					} else {
						$mkey = ''.$xml_r_e_id->attributes()->idName ;
						
					}
					$tmapIds_type_value[$mkey] = ''.$xml_r_e_id ;
				}
				$row['id'] = $tmapIds_type_value['id'] ;
				$row['register'] = $tmapIds_type_value['SIRET'] ? $tmapIds_type_value['SIRET'] : $tmapIds_type_value['SIREN'] ;
				
				$xml_r_e_adr = $xml_r_e->address ;
				$row['adr'] = ''.$xml_r_e_adr->addressLine.', '.$xml_r_e_adr->cityCode.' '.$xml_r_e_adr->cityName ;
				
				$rows[] = $row ;
			}
			break ;
			}
		}
	}
	
	
	return $obj_search = array(
		'rows' => $rows,
		'arr_xml' => $arr_xml
	);
	// rows :
	// arr_xml
		// type (request/response)
		// binary
}



function specRsiRecouveo_risk_lib_ES_ping( $xml_request ) {
	if( !is_object($xml_request) || !(get_class($xml_request)=='SimpleXMLElement') ) {
		return array(null,null) ;
	}
	
	$cfg_risk = specRsiRecouveo_risk_lib_getConfig() ;
	if( !$cfg_risk['risk_on'] || !$cfg_risk['risk_es_gatewayUrl'] ) {
		return array(null,null) ;
	}
	
	$date_iso8601 = date(DateTime::ISO8601) ;
	$date_iso8601 = substr($date_iso8601,0,strlen($date_iso8601)-2).':00' ;
	$xmlstr_request_admin = '
		<admin>
			<client>
			<contractId>'.$cfg_risk['risk_es_contractId'].'</contractId>
			<userPrefix>'.$cfg_risk['risk_es_userPrefix'].'</userPrefix>
			<userId>'.$cfg_risk['risk_es_userId'].'</userId>
			<password>'.$cfg_risk['risk_es_password'].'</password>
			</client>
			<context>
			<appId version="1">WSOM</appId>
			<date>'.$date_iso8601.'</date>
			</context>
		</admin>' ;
	$xml_request_admin = simplexml_load_string( $xmlstr_request_admin, 'SimpleXMLElement', LIBXML_NOCDATA);
	
	/*
	$xml = simplexml_load_string( $xml_request, 'SimpleXMLElement', LIBXML_NOCDATA);
	$dom = new DOMDocument('1.0');
	$dom->preserveWhiteSpace = false;
	$dom->formatOutput = false;
	$dom->loadXML($xml->asXML());
	$xml_binary = $dom->saveXML();
	*/
	//$xml = simplexml_load_string( $xml_request, 'SimpleXMLElement', LIBXML_NOCDATA);
	
	$sxml_append = function(SimpleXMLElement $to, SimpleXMLElement $from) {
		$toDom = dom_import_simplexml($to);
		$fromDom = dom_import_simplexml($from);
		$toDom->appendChild($toDom->ownerDocument->importNode($fromDom, true));
	};
	$sxml_append($xml_request,$xml_request_admin) ;
	
	// parse code & delivery
	$output_format = 'XML' ;
	if( ($xml_rd = $xml_request->request->deliveryOptions) && ($xml_rdo = $xml_rd->outputMethod) ) {
		if( (string)$xml_rdo == 'content' ) {
			$output_format = 'BIN' ;
		}
	}
	if( strpos($xml_request->getName(),'Request') !== (strlen($xml_request->getName())-strlen('Request')) ) {
		return array($xml_request,null) ;
	}
	$svcCode = substr($xml_request->getName(),0,(strlen($xml_request->getName())-strlen('Request'))) ;
	
	$post_url = "{$cfg_risk['risk_es_gatewayUrl']}/{$svcCode}" ;
	$params = array('http' => array(
		'method' => 'POST',
		'content' => $xml_request->asXML(),
		'timeout' => 600,
		'ignore_errors' => true,
		'header'=> "Content-type: application/xml\r\n"
	));
	$ctx = stream_context_create($params);
	$fp = fopen($post_url, 'rb', false, $ctx);
	if( !$fp ) {
		//break 2 ;
	}
	$status_line = $http_response_header[0] ;
	preg_match('{HTTP\/\S*\s(\d{3})}', $status_line, $match);
	$status = $match[1];
	$response_success = ($status == 200) ;

	if( $xmlStr_response = stream_get_contents($fp) ) {
		switch( $output_format ) {
			case 'XML' :
				$xml_response = simplexml_load_string( $xmlStr_response, 'SimpleXMLElement', LIBXML_NOCDATA);
				return array($xml_request,$xml_response) ;
			case 'BIN' :
				return array($xml_request,$xmlStr_response) ;
		}
	}
	return array($xml_request,null) ;
}

function specRsiRecouveo_risk_lib_ES_pingSearch( $mode, $parm1, $parm2=NULL ) {
	$parm1 = htmlspecialchars(trim($parm1)) ;
	if( $parm2 ) {
		$parm2 = htmlspecialchars(trim($parm2)) ;
	}
	
	switch( $mode ) {
		case 'id_register' : 
			switch( strlen($parm1) ) {
				case 14 :
					$xml_part = "<id type=\"register-estb\">{$parm1}</id>" ;
					break ;
				default :
					$xml_part = "<id type=\"register\">{$parm1}</id>" ;
					break ;
			}
			break ;
		case 'id_vat' :
			$xml_part = "<id type=\"vat\">{$parm1}</id>" ;
			break ;
		case 'name_city' :
			$xml_part = '' ;
			$xml_part.= "<name>{$parm1}</name>" ;
			if( $parm2 ) {
				$xml_part.= "<address>" ;
				if( is_numeric($parm2) ) {
					if( strlen($parm2)==2 ) {
						$xml_part.= "<countrySubdivision type=\"department\" code=\"{$parm2}\"/>" ;
					}
					if( strlen($parm2)==5 ) {
						$xml_part.= "<cityCode type=\"postalcode\">{$parm2}</cityCode>" ;
					}
				} else {
					$xml_part.= "<cityName>{$parm2}</cityName>" ;
				}
				$xml_part.= "</address>" ;
			}
			break ;
		case 'manager' :
			$xml_part = '' ;
			$xml_part.= "<manager>" ;
			if( $parm2 ) {
				$xml_part.= "<firstName>{$parm2}</firstName>" ;
			}
			if( $parm1 ) {
				$xml_part.= "<lastName>{$parm1}</lastName>" ;
			}
			$xml_part.= "</manager>" ;
			break ;
	}
	
	$xmlStr_request = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
		<svcSearchRequest lang="FR" version="2.1">
			
			<request>
				<searchCriteria>
				'.$xml_part.'
				</searchCriteria>
			</request>
		</svcSearchRequest>' ;
	$xml_request = simplexml_load_string( $xmlStr_request, 'SimpleXMLElement', LIBXML_NOCDATA);
	
	list($xml_request, $xml_response) = specRsiRecouveo_risk_lib_ES_ping($xml_request) ;

	return array($xml_request,$xml_response) ;
}


function specRsiRecouveo_risk_lib_ES_pingPdf( $id_register ) {
	
	$xmlStr_request = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
		<svcOnlineOrderRequest lang="FR" version="2.1">
			<request>
				<id type="register" idName="SIREN">'.$id_register.'</id>
				<product range="101003" version="10" />
				<deliveryOptions>
					<outputMethod>content</outputMethod>
					<format>PDF</format>
				</deliveryOptions>
			</request>
		</svcOnlineOrderRequest>' ;
	$xml_request = simplexml_load_string( $xmlStr_request, 'SimpleXMLElement', LIBXML_NOCDATA);
	
	list($xml_request, $pdf_binary) = specRsiRecouveo_risk_lib_ES_ping($xml_request) ;
	
	return $pdf_binary ;
}

function specRsiRecouveo_risk_lib_ES_getResultObj( $id_register ) {
	
	$xmlStr_request = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
		<svcOnlineOrderRequest lang="FR" version="2.1">
			<request>
				<id type="register" idName="SIREN">'.$id_register.'</id>
				<product range="101003" version="10" />
				<deliveryOptions>
					<outputMethod>raw</outputMethod>
					<format>XML</format>
				</deliveryOptions>
			</request>
		</svcOnlineOrderRequest>' ;
	$xml_request = simplexml_load_string( $xmlStr_request, 'SimpleXMLElement', LIBXML_NOCDATA);
	
	list($xml_request, $xml_response) = specRsiRecouveo_risk_lib_ES_ping($xml_request) ;
	
	// DECODE XML
	$obj_result = specRsiRecouveo_risk_lib_ES_getResultObjDecode($xml_response->asXML()) ;
	return  array(
		'data_obj' => $obj_result,
		'xml_binary' => $xml_response->asXML()
	); ;
}
function specRsiRecouveo_risk_lib_ES_getResultObjDecode($xml_binary) {
	$xml = simplexml_load_string( $xml_binary, 'SimpleXMLElement', LIBXML_NOCDATA);
	$xml_rr = $xml->response ? $xml->response->report : null ;
	if( !$xml_rr ) {
		return  NULL;
	}
	
	if( $xml_rri = $xml_rr->identityModule ) {
		$obj_result['status'] = (string)$xml_rri->companyStatus ; // INA / ACT
		
		$obj_result['identity_rows'] = array() ;
		if( ($xml_rrih = $xml_rri->headEstablishment) && ($xml_rriha = $xml_rrih->address) ) {
			$item = array('label'=>'Adresse','values'=>array(),'add_invite'=>true) ;
			if( $str = (string)$xml_rriha->attributes()['deliveryAddress'] ) {
				$item['values'][] = $str ;
			}
			if( $str = (string)$xml_rriha->attributes()['addressComplement'] ) {
				$item['values'][] = $str ;
			}
			if( $str = (string)$xml_rriha->attributes()['postalDelivery'] ) {
				$item['values'][] = $str ;
			}
			$obj_result['identity_rows'][] = $item ;
			
			if( $str = (string)$xml_rrih->phoneNumber ) {
				$obj_result['identity_rows'][] = array('label'=>'Téléphone','values'=>array($str),'add_invite'=>true) ;
			}
			
			if( $str = (string)$xml_rrih->email ) {
				$obj_result['identity_rows'][] = array('label'=>'Email','values'=>array($str),'add_invite'=>true) ;
			}
			
			if( $str = (string)$xml_rrih->website ) {
				$obj_result['identity_rows'][] = array('label'=>'Site internet','values'=>array($str),'add_invite'=>false) ;
			}
		}
		if( $str = (string)$xml_rri->companyId ) {
			$str = (string)$xml_rri->companyId.(string)$xml_rri->nic ;
			$obj_result['identity_rows'][] = array('label'=>'SIREN','values'=>array($str),'add_invite'=>true) ;
		}
		if( $str = (string)$xml_rri->vat ) {
			$obj_result['identity_rows'][] = array('label'=>'TVA','values'=>array($str)) ;
		}
		if( ($count = (int)(string)$xml_rri->branchesCount) && $count > 1 ) {
			$obj_result['identity_rows'][] = array('label'=>'Nb établissements','values'=>array((string)$count)) ;
		}
		
		if( $xml_rr->ultimateParentsModule ) {
			$item = array('label'=>'Société(s) parente(s)', 'values'=>array()) ;
			foreach( $xml_rr->ultimateParentsModule->ultimateParents->children() as $xml_up ) {
				$item['values'][] = (string)$xml_up->officialCompanyName.' - '.(string)$xml_up->companyId ;
			}
			$obj_result['identity_rows'][] = $item ;
		}
	}
	
	//var_dump( $xml_rr->scoreModule ) ;
	
	$fnGetScoreColor = function($score) {
		if( $score >= 6 ) {
			return '#90bc29' ;
		} elseif( $score >= 4 ) {
			return '#f7b200' ;
		} elseif( $score >= 2 ) {
			return '#ff7b01' ;
		} elseif( $score > 0 ) {
			return '#ee1c01' ;
		} else {
			return '#000000' ;
		}
	};
	$funGetScoreProg = function( $score_int, $score_rows ) {
		if( count($score_rows) == 0 ) {
			return 0 ;
		}
		$score_avg = 0 ;
		foreach( $score_rows as $score_row ) {
			$score_avg+= $score_row['score'] ;
		}
		$score_avg = $score_avg / count($score_rows) ;
		return $score_int - $score_avg ;
	};
	if( ($xml_rrs = $xml_rr->scoreModule) && is_numeric((string)$xml_rrs->actualScore->score) ) {
		$obj_result['score_int'] = (int)(string)$xml_rrs->actualScore->score ;
		$obj_result['score_color'] = $fnGetScoreColor($obj_result['score_int']) ;
		
		$obj_result['score_rows'] = array() ;
		foreach( $xml_rrs->children() as $mkey => $xml_rrs_child ) {
			//echo $mkey."\n" ;
			//echo $xml_rrs_child->getName() ;
			//var_dump($val) ;
			if( !(strpos($xml_rrs_child->getName(),'historicalScore')===0) ) {
				continue ;
			}
			//var_dump($xml_rrs_child) ;
			if( !is_numeric((string)$xml_rrs_child->score) ) {
				continue ;
			}
			$score = (int)(string)$xml_rrs_child->score ;
			$date = date_format(date_create_from_format('Ymd',(string)$xml_rrs_child->update),'Y-m-d') ;
			$obj_result['score_rows'][] = array(
				'date_sql' => $date,
				'date_txt' => date('d/m/Y',strtotime($date)),
				'date_txt_short' => date('m/Y',strtotime($date)),
				'score' => $score,
				'color' => $fnGetScoreColor($score)
			);
		}
		
		$obj_result['score_prog_int'] = $funGetScoreProg($obj_result['score_int'],$obj_result['score_rows']) ;
	}
	if( ($xml_rr_payranks = $xml_rr->paymentAnalysisModule) 
			&& ($xml_rr_payranks = $xml_rr_payranks->paymentBehaviour)
			&& ($xml_rr_payranks = $xml_rr_payranks->payRanks) ) {
			
		$map_date_rank = array() ;
		foreach( $xml_rr_payranks->children() as $mkey => $xml_rrs_payrank ) {
			if( !$xml_rrs_payrank->calculationDate || !$xml_rrs_payrank->indicator ) {
				continue ;
			}
			$date = (string)$xml_rrs_payrank->calculationDate ;
			$value = (string)($xml_rrs_payrank->indicator->attributes()['value']) ;
			if( is_numeric($value) ) {
				$map_date_rank[$date] = (int)$value ;
			}
		}
		if( $map_date_rank ) {
			krsort($map_date_rank) ;
			$obj_result['payrank_int'] = reset($map_date_rank) ;
			$obj_result['payrank_color'] = $fnGetScoreColor($obj_result['payrank_int']) ;
		}
	}
	
	$obj_result['keyfigures_rows'] = array() ;
	if( $xml_rr->keyFiguresModule && ($xml_rrk = $xml_rr->keyFiguresModule->keyFigures) ) {
		$obj_result['keyfigures_rows'] = array() ;
		foreach( $xml_rrk->children() as $mkey => $xml_rrk_child ) {
			if( !(strpos($xml_rrk_child->getName(),'financialYearN')===0) ) {
				continue ;
			}
			if( !is_numeric( (string)$xml_rrk_child->turnover ) ) {
				continue ;
			}
			$row = array(
				'k_date' => date_format(date_create_from_format('Ymd',(string)$xml_rrk_child->financialYearDate),'Y-m-d'),
				'v_length_i' => (int)(string)$xml_rrk_child->financialYearDuration,
				'v_turnover' => (int)(string)$xml_rrk_child->turnover,
				'v_netResult' => (int)(string)$xml_rrk_child->netResult,
				'v_shareholdersFunds' => (int)(string)$xml_rrk_child->shareholdersFunds,
				'v_debts' => (int)(string)$xml_rrk_child->debts,
				'v_purchases' => (int)(string)$xml_rrk_child->purchases,
				'v_customerCredit_i' => (int)(string)$xml_rrk_child->customerCredit,
				'v_supplierCredit_i' => (int)(string)$xml_rrk_child->supplierCredit,
				'v_employees_i' => (int)(string)$xml_rrk_child->employees,
			);
			$obj_result['keyfigures_rows'][] = $row ;
		}
	}
	if( count($obj_result['keyfigures_rows']) == 0 ) {
		unset($obj_result['keyfigures_rows']) ;
	} else {
		$obj_result['keyfigures_labels'] = array(
			'v_length_i' => 'Durée (mois)',
			'v_turnover' => 'C.A.',
			'v_netResult' => 'Résultat net',
			'v_shareholdersFunds' => 'Fonds propres',
			'v_debts' => 'Endettement',
			'v_purchases' => 'Achats',
			'v_customerCredit_i' => 'Cr.clients(j)',
			'v_supplierCredit_i' => 'Cr.fourn.(j)',
			'v_employees_i' => 'Nb.Employés'
		);
	}
	
	$obj_result['directors_rows'] = array() ;
	if( ($xml_rr_directors = $xml_rr->directorsModule)
		&& ($xml_rr_directors = $xml_rr_directors->statutoryDirectors) ) {
		
		foreach( $xml_rr_directors->children() as $xml_rr_director ) {
			//var_dump($xml_rr_director) ;
			$row = array(
				'type' => (string)$xml_rr_director->type,
				'appointmentDate' => $xml_rr_director->appointmentDate ? date_format(date_create_from_format('Ymd',(string)$xml_rr_director->appointmentDate),'Y-m-d') : '',
				'function' => (string)$xml_rr_director->function
			);
			switch( $row['type'] ) {
				case 'PP' :
					$row += array(
						'pp_civility' => (string)$xml_rr_director->naturalPerson->attributes()['civility'],
						'pp_name' => (string)$xml_rr_director->naturalPerson->attributes()['name'],
						'pp_firstName' => (string)$xml_rr_director->naturalPerson->attributes()['firstName'],
						
						'pp_birthPlace' => (string)$xml_rr_director->naturalPerson->birthPlace,
						'pp_birthDate' => $xml_rr_director->naturalPerson->birthDate ? date_format(date_create_from_format('Ymd',(string)$xml_rr_director->naturalPerson->birthDate),'Y-m-d') : ''
					);
					break ;
			
				case 'PM' :
					$row += array(
						'pm_name' => (string)$xml_rr_director->legalPerson->attributes()['name'],
						'pm_siren' => (string)$xml_rr_director->legalPerson->companyId
					);
					break ;
			}
			
			$obj_result['directors_rows'][] = $row ;
		}
	}
	if( count($obj_result['directors_rows']) == 0 ) {
		unset($obj_result['directors_rows']) ;
	}
	
	return  $obj_result ;
}

?>
