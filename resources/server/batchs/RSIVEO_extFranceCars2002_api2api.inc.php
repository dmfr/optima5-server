<?php

function apiExt_stream2stream($handle_in,$handle_local,$api_method=NULL) {
	switch( $api_method ) {
		case 'record' :
			break ;
		default :
			stream_copy_to_stream($handle_in,$handle_local) ;
			return ;
	}

	$json_arr = json_decode(stream_get_contents($handle_in),true) ;
	switch( $api_method ) {
		case 'record' :
			foreach( $json_arr as &$json_obj ) {
				$json_obj['LetterConfirm'] = (strtolower($json_obj['LetterConfirm'])=='oui') ;
				$json_obj['Meta:JOURNAL'] = $json_obj['CleJournal'] ;
				$json_obj['Meta:AGENCE'] = $json_obj['AgenceCode'] ;
				$json_obj['Meta:AGENCE_TXT'] = $json_obj['AgenceTxt'] ;
			}
			unset($json_obj) ;
			break ;
	}
	
	$binary = json_encode($json_arr) ;
	fwrite($handle_local,$binary) ;
}


?>
