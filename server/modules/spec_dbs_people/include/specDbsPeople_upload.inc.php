<?php

function specDbsPeople_upload_getLibrary($post_data) {
	global $_opDB ;
	
	$TAB = array() ;
	$TAB[] = array('upload_id'=>'RH_BASE', 'upload_name'=>'RH : Base People (longueur=12, model Fabio 29/06/16)') ;
	
	return array('success'=>true,'data'=>$TAB) ;
}

function specDbsPeople_upload_do($post_data) {
	global $_opDB ;
	
	$error = NULL ;
	
	$handle_src = SpreadsheetToCsv::toCsvHandle($_FILES['file_upload']['tmp_name'],$_FILES['file_upload']['name']) ;
	$handle_dst = tmpfile() ;
	while( TRUE ) {
		$arr_modelHeader = array(
			'rh_group',
			'people_code',
			'people_txt',
			'date_apply',
			'entrepot_code',
			'contrat_code',
			'contrat_txt',
			'equipe_code',
			'equipe_txt',
			'role_code',
			'role_txt',
			'absence_code'
		) ;
		$arr_header = fgetcsv($handle_src) ;
		if( count($arr_header) != count($arr_modelHeader) ) {
			$error = 'Model header mismatch' ;
			break ;
		}
		
		$arr_biblesMap = array(
			'entrepot_code' => 'CFG_WHSE',
			'contrat_code' => 'CFG_CONTRACT',
			'equipe_code' => 'CFG_TEAM',
			'role_code' => 'CFG_ROLE',
			'absence_code' => 'CFG_ABS',
		) ;
		$arr_bibleKeys = array() ;
		foreach( $arr_biblesMap as $header => $bible_code ) {
			$arr_bibleKeys[$header] = array() ;
		}
		
		fputcsv($handle_dst,$arr_modelHeader) ;
		while( !feof($handle_src) ) {
			$arr_csv = fgetcsv($handle_src) ;
			if( !$arr_csv ) {
				continue ;
			}
			$row = array_combine($arr_modelHeader,$arr_csv);
			
			foreach( $arr_bibleKeys as $header => &$keys ) {
				$val = $row[$header] ;
				if( !in_array($val,$keys) ) {
					$keys[] = $val ;
				}
			}
			unset($keys) ;
			
			fputcsv($handle_dst,$arr_csv) ;
		}
		
		$arr_missingKeys = array() ;
		foreach( $arr_bibleKeys as $header => $keys ) {
			$bible_code = $arr_biblesMap[$header] ;
			
			$arr_bibleKeys = array() ;
			$query = "SELECT entry_key from view_bible_{$bible_code}_entry" ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
				$arr_bibleKeys[] = $arr[0] ;
			}
			$missingKeys = array_diff($keys,$arr_bibleKeys) ;
			
			if( count($missingKeys) > 0 ) {
				$arr_missingKeys[$bible_code] = $missingKeys ;
			}
		}
		if( count($arr_missingKeys) > 0 ) {
			$error = 'Missing bible keys :<br>' ;
			foreach($arr_missingKeys as $bible_code => $missingKeys ) {
				$error.= $bible_code." : ".implode(',',$missingKeys).'<br>' ;
			}
			break ;
		}
		
		
		$toStores = array(
			array('data_type'=>'bible','store_code'=>'RH_PEOPLE'),
			array('data_type'=>'file','store_code'=>'RH_WHSE'),
			array('data_type'=>'file','store_code'=>'RH_CONTRACT'),
			array('data_type'=>'file','store_code'=>'RH_TEAM'),
			array('data_type'=>'file','store_code'=>'RH_ROLE'),
			array('data_type'=>'file','store_code'=>'RH_ABS')
		) ;
		
		// Test for mappings
		$arr_missingMappings = array() ;
		foreach( $toStores as $toStore ) {
			if( !paracrm_lib_dataImport_probeMappingId($toStore['data_type'],$toStore['store_code'],$arr_modelHeader) ) {
				$arr_missingMappings[] = $toStore['store_code'] ;
			}
		}
		if( count($arr_missingMappings) > 0 ) {
			$error = 'Missing mappings : '.implode(',',$arr_missingMappings).'<br>' ;
			break ;
		}
		
		// GO !
		foreach( $toStores as $toStore ) {
			fseek($handle_dst,0) ;
			paracrm_lib_dataImport_commit_processHandle($toStore['data_type'],$toStore['store_code'],$handle_dst) ;
		}
		break ;
	}
	fclose($handle_src) ;
	fclose($handle_dst) ;
	
	
	if( $error ) {
		return array('success'=>false,'error'=>$error) ;
	}
	return array('success'=>true) ;
}

?>
