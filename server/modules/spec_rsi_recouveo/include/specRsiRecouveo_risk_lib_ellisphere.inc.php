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
		$res = specRsiRecouveo_risk_lib_ES_pingSearch( $ping['mode'], $ping['parm1'], $ping['parm2'] ) ;
		$arr_xml[] = array('type'=>'request','binary'=>$res[0]) ;
		$arr_xml[] = array('type'=>'response','binary'=>$res[1]) ;
		
		if( $res[1] ) {
			$xml = simplexml_load_string( $res[1], 'SimpleXMLElement', LIBXML_NOCDATA);
			$xml_response = $xml->response ;
			
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


$GLOBALS['specRsiRecouveo_risk_lib_ES_contractId'] = '45353' ;
$GLOBALS['specRsiRecouveo_risk_lib_ES_userPrefix'] = 'GEOCOM' ;
$GLOBALS['specRsiRecouveo_risk_lib_ES_userId'] = 'NN411025' ;
$GLOBALS['specRsiRecouveo_risk_lib_ES_password'] = 'OICZ5M45OBMD' ;

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
	
	$xml_request = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
		<svcSearchRequest lang="FR" version="2.1">
			<admin>
				<client>
				<contractId>'.$GLOBALS['specRsiRecouveo_risk_lib_ES_contractId'].'</contractId>
				<userPrefix>'.$GLOBALS['specRsiRecouveo_risk_lib_ES_userPrefix'].'</userPrefix>
				<userId>'.$GLOBALS['specRsiRecouveo_risk_lib_ES_userId'].'</userId>
				<password>'.$GLOBALS['specRsiRecouveo_risk_lib_ES_password'].'</password>
				<privateReference type="order">TEST20210107</privateReference>
				</client>
				<context>
				<appId version="1">WSOM</appId>
				<date>2011-12-13T17:38:15+01:00</date>
				</context>
			</admin>
			<request>
				<searchCriteria>
				'.$xml_part.'
				</searchCriteria>
			</request>
		</svcSearchRequest>' ;
	
	$xml = simplexml_load_string( $xml_request, 'SimpleXMLElement', LIBXML_NOCDATA);
	$dom = new DOMDocument('1.0');
	$dom->preserveWhiteSpace = false;
	$dom->formatOutput = false;
	$dom->loadXML($xml->asXML());
	$xml_binary = $dom->saveXML();

//echo $xml_binary ;
//die() ;



				$post_url = 'https://services.data-access-gateway.com/1/rest/svcSearch' ;
				$params = array('http' => array(
				'method' => 'POST',
				'content' => $xml_binary,
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


	$xml_response = stream_get_contents($fp) ;
	return array($xml_request,$xml_response,$xml) ;
}




?>
