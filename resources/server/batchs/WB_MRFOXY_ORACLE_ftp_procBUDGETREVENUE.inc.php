<?php

function WB_MRFOXY_ORACLE_ftp_procBUDGETREVENUE( $handle_in, $handle_out ) {
	// Map ( CCD => code pays )
	// Map ( code pays => currency )
	$map_CCD_countryCode = array() ;
	$map_countryCode_currencyCode = array() ;
	$ttmp = paracrm_data_getBibleGrid( array('bible_code'=>'_COUNTRY') ) ;
	foreach( $ttmp['data'] as $paracrm_row ) {
		$country_code = $paracrm_row['entry_key'] ;
		$CCD = $paracrm_row['field_ORACLE_CCD'] ;
		$currency_code = ( isJsonArr($paracrm_row['field_COUNTRY_CURRENCY']) ? reset(json_decode($paracrm_row['field_COUNTRY_CURRENCY'],true)) : NULL ) ;
		
		if( !isset($map_CCD_countryCode[$CCD]) ) {
			$map_CCD_countryCode[$CCD] = $country_code ;
		} else {
			$map_CCD_countryCode[$CCD] = NULL ;
		}
		$map_countryCode_currencyCode[$country_code] = $currency_code ;
	}
	// *****************************
	
	// Cfg: currencies
	$map_currencyCode_eqUSD = array() ;
	foreach( specWbMrfoxy_tool_getCurrencies() as $currency_row ) {
		$map_currencyCode_eqUSD[$currency_row['currency_code']] = $currency_row['eq_USD'] ;
	}
	// ******************************
	
	$header = fgetcsv($handle_in) ;
	if( !$header ) {
		return ;
	}
	$CCD_idx = array_search('CCD',$header) ;
	$date_idx = array_search('DATE',$header) ;
	$currency_idx = array_search('CURRENCY',$header) ;
	$amount_idx = array_search('AMOUNT',$header) ;
	fputcsv($handle_out,$header) ;
	
	while( !feof($handle_in) ) {
		$arr_csv = fgetcsv($handle_in) ;
		if( !$arr_csv ) {
			continue ;
		}
		
		$CCD = $arr_csv[$CCD_idx] ;
		if( !($country_code = $map_CCD_countryCode[$CCD]) ) {
			continue ;
		}
		$arr_csv[$CCD_idx] = $country_code ;
		
		$row_date = $arr_csv[$date_idx] ;
		$row_currencyCode = $arr_csv[$currency_idx] ;
		$std_currencyCode = $map_countryCode_currencyCode[$country_code] ;
		if( !$row_currencyCode || !$std_currencyCode ) {
			continue ;
		}
		if( $std_currencyCode != $row_currencyCode ) {
			$std_currency_eqUSD = $map_currencyCode_eqUSD[$std_currencyCode] ;
			$row_currency_eqUSD = $map_currencyCode_eqUSD[$row_currencyCode] ;
			if( !$row_currency_eqUSD || !$std_currency_eqUSD ) {
				continue ;
			}
			$rowCurrency_amount = $arr_csv[$amount_idx] ;
			
			// Convert row => std
			$arr_csv[$currency_idx] = $std_currencyCode ;
			$arr_csv[$amount_idx] = round( $rowCurrency_amount * $row_currency_eqUSD / $std_currency_eqUSD ) ;
		}
		
		fputcsv($handle_out,$arr_csv) ;
	}
}

?>