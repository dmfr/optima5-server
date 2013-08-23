<?php

$GLOBALS['cache_joinMap'] = array() ;
$GLOBALS['cache_joinMap'][$file_code][$field_code] ;

function paracrm_lib_file_joinGridRecord( $file_code, &$record_row ) {
	global $_opDB ;
	$jMap = paracrm_lib_file_joinPrivate_getMap( $file_code ) ;
	
	foreach( $jMap as $entry_field_code => $dummy ) {
		$mkey = $file_code.'_field_'.$entry_field_code ;
		
		$record_row[$mkey] = '@JOIN@@' ;
	}
}
function paracrm_lib_file_joinQueryRecord( $file_code, &$record_row ) {
	global $_opDB ;
	
	foreach( $jMap as $entry_field_code => $dummy ) {
		$mkey_file = $file_code ;
		$mkey_field = 'field_'.$entry_field_code ;
		
		$record_row[$mkey_file][$mkey_field] = '@JOIN@@' ;
	}
}

function paracrm_lib_file_joinPrivate_getMap( $file_code ) {
	global $_opDB ;
	
	if( is_array($tmp = $GLOBALS['cache_joinMap'][$file_code]) ) {
		return $tmp ;
	}
	
	$GLOBALS['cache_joinMap'][$file_code] = array() ;
	
	$query = "SELECT entry_field_code FROM define_file_entry WHERE file_code='$file_code' AND entry_field_type='join'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$entry_field_code = $arr[0] ;
		
		$GLOBALS['cache_joinMap'][$file_code][$entry_field_code] = array() ;
	}
	return $GLOBALS['cache_joinMap'][$file_code] ;
}

?>