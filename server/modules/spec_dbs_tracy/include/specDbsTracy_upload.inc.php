<?php
function specDbsTracy_upload( $post_data ) {
	global $_opDB ;
	
	$handle = fopen($_FILES['file_upload']['tmp_name'],"rb") ;
	$file_model = $post_data['file_model'] ;
	
	// Specs
	switch( $file_model ) {
		case 'VL06F' :
			$ret = specDbsTracy_upload_VL06F_tmp($handle) ;
			break ;
		default :
			return array('success'=>false);
	}
	
	return array('success'=>$ret) ;
}

function specDbsTracy_upload_VL06F_tmp( $handle ) {
	global $_opDB ;
	
	$handle_priv = tmpfile();
	specDbsTracy_upload_lib_separator($handle,$handle_priv) ;
	fseek($handle_priv,0) ;
	
	$map_idSoc_idDn_torf = array() ;
	$query = "SELECT field_ID_SOC, field_ID_DN FROM view_file_CDE" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$map_idSoc_idDn_torf[$arr[0]][$arr[1]] = true ;
	}
	
	fgets($handle_priv) ;
	while( !feof($handle_priv) ) {
		$arr_csv = fgetcsv($handle_priv) ;
		if( !$arr_csv ) {
			continue ;
		}
		foreach( $arr_csv as &$tvalue ) {
			$tvalue = trim($tvalue) ;
		}
		unset($tvalue) ;
		
		
		$form_data = array() ;
		switch( substr($arr_csv[1],0,1) ) {
			case 'M':
				$form_data['id_soc'] = 'MBD' ;
				break ;
			case 'R':
			case 'A':
				$form_data['id_soc'] = 'ACL' ;
				break ;
			default :
				continue 2 ;
		}
		$form_data['id_dn'] = $arr_csv[0] ;
		
		if( $map_idSoc_idDn_torf[$form_data['id_soc']][$form_data['id_dn']] ) {
			continue ;
		}
		
		// Create CONSIGNEE ?
		$query = "SELECT entry_key FROM view_bible_LIST_CONSIGNEE_entry WHERE field_NAME='{$arr_csv[6]}'" ;
		$atr_consignee = $_opDB->query_uniqueValue($query) ;
		if( !$atr_consignee ) {
			$entry_key = preg_replace("/[^a-zA-Z0-9]/", "", strtoupper($arr_csv[6])) ;
		
			$arr_ins = array() ;
			$arr_ins['field_CODE'] = $entry_key ;
			$arr_ins['field_NAME'] = $arr_csv[6] ;
			paracrm_lib_data_insertRecord_bibleEntry( 'LIST_CONSIGNEE', $entry_key, 'UPLOAD', $arr_ins ) ;
			
			$atr_consignee = $entry_key ;
		}
		$form_data['atr_consignee'] = $atr_consignee ;
		
		// Fetch UPLOAD_RECEP ?
		$query = "SELECT * FROM view_bible_UPLOAD_RECEP_entry WHERE treenode_key='{$form_data['id_soc']}' AND entry_key='{$arr_csv[5]}'" ;
		$result = $_opDB->query($query) ;
		if( $_opDB->num_rows($result) == 1 ) {
			$arr_recep = $_opDB->fetch_assoc($result) ;
			
			$txt_location=array() ;
			foreach( array('field_ADR_NAME1','field_ADR_NAME2','field_ADR_STREET','field_ADR_CITY','field_ADR_COUNTRY') as $mkey ) {
				if( $arr_recep[$mkey] ) {
					$txt_location[] = $arr_recep[$mkey] ;
				}
			}
			$form_data['txt_location'] = implode("\n",$txt_location) ;
		} else {
			$form_data['txt_location'] = $arr_csv[6]."\n".$arr_csv[10] ;
		}
		
		// VL ?
		if( $arr_csv[3] ) {
			$form_data['vol_count'] = (int)$arr_csv[3] ;
		}
		if( $arr_csv[9] == 'KG' ) {
			$vol_kg = $arr_csv[8] ;
			$vol_kg = str_replace('-','',$vol_kg) ;
			$vol_kg = str_replace(' ','',$vol_kg) ;
			$vol_kg = str_replace('.','',$vol_kg) ;
			$vol_kg = str_replace(',','.',$vol_kg) ;
			$form_data['vol_kg'] = $vol_kg ;
		}
		
		
		$json_return = specDbsTracy_order_setHeader(array(
			'_is_new' => true,
			'data' => json_encode($form_data)
		));
		$filerecord_id = $json_return['id'] ;
		
		$p_dateRaw = $arr_csv[7] ;
		$p_dateRelease = substr($p_dateRaw,6,4).'-'.substr($p_dateRaw,3,2).'-'.substr($p_dateRaw,0,2) ;
		
		$arr_cond = array() ;
		$arr_cond['filerecord_parent_id'] = $filerecord_id ;
		$arr_cond['field_STEP_CODE'] = '10_RLS' ;
		$arr_update['field_DATE_ACTUAL'] = $p_dateRelease ;
		$arr_update['field_STATUS_IS_OK'] = 1 ;
		$_opDB->update('view_file_CDE_STEP',$arr_update,$arr_cond) ;
	}
	
	fclose($handle_priv) ;
	
	return true ;
}


function specDbsTracy_upload_lib_separator( $handle_in, $handle_out, $separator='|' ) {
	$handle_priv = tmpfile() ;
	while( !feof($handle_in) ) {
		$lig = fgets($handle_in) ;
		$lig = mb_convert_encoding($lig, "UTF-8");
		fwrite($handle_priv,$lig) ;
	}
	
	fseek($handle_priv,0) ;
	$max_occurences = 0 ;
	while( !feof($handle_priv) ) {
		$arr_csv = fgetcsv($handle_priv,0,$separator) ;
		if( count($arr_csv) > $max_occurences ) {
			$max_occurences = count($arr_csv) ;
		}
	}
	
	fseek($handle_priv,0) ;
	$strip_first = TRUE ;
	$strip_last = TRUE ;
	while( !feof($handle_priv) ) {
		$arr_csv = fgetcsv($handle_priv,0,$separator) ;
		if( count($arr_csv) != $max_occurences ) {
			continue ;
		}
		if( reset($arr_csv) ) {
			$strip_first = FALSE ;
		}
		if( end($arr_csv) ) {
			$strip_last = FALSE ;
		}
	}
	
	$is_first = TRUE ;
	
	fseek($handle_priv,0) ;
	while( !feof($handle_priv) ) {
		$arr_csv = fgetcsv($handle_priv,0,$separator) ;
		if( count($arr_csv) != $max_occurences ) {
			continue ;
		}
		if( $strip_first ) {
			array_shift($arr_csv) ;
		}
		if( $strip_last ) {
			array_pop($arr_csv) ;
		}
		foreach( $arr_csv as &$item ) {
			$item = trim($item) ;
		}
		unset($item) ;
		if( $is_first ) {
			$arr_header = $arr_csv ;
			$is_first = FALSE ;
		} elseif($arr_csv == $arr_header) {
			continue ;
		}
		fputcsv($handle_out,$arr_csv) ;
	}
	
	fclose($handle_priv) ;
}

?>
