<?php

function apiExt_stream2stream($handle_in,$handle_local,$api_method=NULL) {
	switch( $api_method ) {
		case 'account' :
		case 'record' :
			break ;
		default :
			stream_copy_to_stream($handle_in,$handle_local) ;
			return ;
	}
	
	$json_arr = json_decode(stream_get_contents($handle_in),true) ;
	if( !$json_arr ) {
		return ;
	}
	switch( $api_method ) {
		case 'account' :
			foreach( $json_arr as &$json_obj ) {
				$json_obj['SIRET'] = $json_obj['Siren'] ;
				
				$json_obj['Meta:PROPART'] = $json_obj['Civilite'] ;
				switch( substr(strtoupper($json_obj['Meta:PROPART']),0,1) ) {
					case 'M' :
					$json_obj['Meta:PROPART'] = 'Particulier' ;
					break ;
					
					default :
					break ;
				}
				
				$json_obj['Meta:TVA'] = $json_obj['NumTVA'] ;
				$json_obj['Meta:CPTREGROUP'] = $json_obj['CptRegroup'] ;
				$json_obj['Meta:CPTCOLL'] = $json_obj['CptCollectif'] ;
				$json_obj['Meta:NBJRCRED'] = $json_obj['NbJourCredit'] ;
				$json_obj['Meta:ENCAUTH'] = $json_obj['EncoursAutorise'] ;
				$json_obj['Meta:CONTACT'] = $json_obj['NomContact'] ;
			}
			unset($json_obj) ;
			break ;
		
		case 'record' :
			foreach( $json_arr as &$json_obj ) {
				$json_obj['LetterConfirm'] = (strtolower($json_obj['LetterConfirm'])=='oui') ;
				$json_obj['Meta:JOURNAL'] = $json_obj['CleJournal'] ;
				$json_obj['Meta:AGENCE'] = $json_obj['AgenceCode'] ;
				//$json_obj['Meta:AGENCE_TXT'] = $json_obj['AgenceTxt'] ;
			}
			unset($json_obj) ;
			break ;
	}
	
	$binary = json_encode($json_arr) ;
	fwrite($handle_local,$binary) ;
}


?>
