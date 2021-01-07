<?php

function specRsiRecouveo_risk_lib_ES_getSearchObj( $acc_id, $mode, $txt ) {
	
	$arr_xml = array() ;
	$rows = array() ;
	
	
	$arr_pings = array() ;
	switch( $mode ) {
		case '_' :
			//TODO
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
			$xml_json = json_encode((array)$xml, JSON_PRETTY_PRINT) ;
			$xml = json_decode($xml_json,true) ;
			
			$establishment_rows = array() ;
			if( $xml['response']['providedHits'] > 1 ) {
				$establishment_rows = $xml['response']['establishment'] ;
			} elseif( $xml['response']['providedHits'] == 1 ) {
				$establishment_rows[] = $xml['response']['establishment'] ;
			}
			
			foreach( $establishment_rows as $establishment_row ) {
				$row = array() ;
				$row['name'] = is_array($ttmp=$establishment_row['name']) ? ($ttmp[0].' ('.$ttmp[1].')') : $ttmp ;
				$row['activity'] = $establishment_row['activity'] ;
				$row['id'] = is_array($ttmp=$establishment_row['id']) ? end($ttmp) : $ttmp ;
				
				$row['adr'] = $establishment_row['address']['addressLine'].', '.$establishment_row['address']['cityCode'].' '.$establishment_row['address']['cityName'] ;
				
				$rows[] = $row ;
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
	switch( $mode ) {
		case 'id_register' : 
			$xml_part = "<id type=\"register-estb\">{$parm1}</id>" ;
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
$xml_array = json_decode(json_encode((array)$xml), TRUE);
//print_r($xml_array);


$dom = new DOMDocument('1.0');
$dom->preserveWhiteSpace = false;
$dom->formatOutput = false;
$dom->loadXML($xml->asXML());
$xml_binary = $dom->saveXML();

//echo $xml_binary ;
//die() ;



				//$binary_zpl = base64_decode($json['labelData']) ;
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
$xml = simplexml_load_string( $xml_response, 'SimpleXMLElement', LIBXML_NOCDATA);
$xml_json = json_encode((array)$xml, JSON_PRETTY_PRINT) ;
		
		
	
	return array($xml_request,$xml_response,$xml) ;
}




?>
