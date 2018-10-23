<?php

function specDbsLam_lib_TMS_getValueStatic( $value_key ) {
	global $_opDB ;
	
	$query = "SELECT field_VAL_STRING FROM view_file_TMS_VALUE WHERE field_VAL_KEY='{$value_key}'" ;
	$value = $_opDB->query_uniqueValue($query) ;
	
	return $value ;
}
function specDbsLam_lib_TMS_getValueIncrement( $value_key, $value_max=NULL ) {
	global $_opDB ;
	
	$query = "LOCK TABLES view_file_TMS_VALUE WRITE" ;
	$_opDB->query($query) ;
	
	$query = "UPDATE view_file_TMS_VALUE SET field_VAL_STRING=LPAD((field_VAL_STRING+1),LENGTH(field_VAL_STRING),'0') WHERE field_VAL_KEY='{$value_key}'" ;
	$_opDB->query($query) ;
	
	$query = "SELECT field_VAL_STRING FROM view_file_TMS_VALUE WHERE field_VAL_KEY='{$value_key}'" ;
	$value = $_opDB->query_uniqueValue($query) ;
	
	$query = "UNLOCK TABLES" ;
	$_opDB->query($query) ;
	
	return $value ;
}

function specDbsLam_lib_TMS_getNOCOLIS() {
	return specDbsLam_lib_TMS_getValueIncrement('WHSE_NOCOLIS') ;
}
function specDbsLam_lib_TMS_getSSCC() {
	$prefix_9 = specDbsLam_lib_TMS_getValueStatic('SSCC_PREFIX9') ;
	$nocolis_7 = specDbsLam_lib_TMS_getValueIncrement('SSCC_COUNTER_VAL',specDbsLam_lib_TMS_getValueStatic('SSCC_COUNTER_MAX')) ;
	
	$str = '0'.$prefix_9.$nocolis_7 ;

	$eansum = 0 ;
	for( $i=0 ; $i<strlen($str) ; $i++ )
	{
		$mchar = $str[$i] ;
		if( $i % 2 == 0 )
			$eansum += $mchar * 3 ;
		else
			$eansum += $mchar * 1 ;
	}
	$reste = ($eansum % 10) ;
	if ($reste == 0)
		$checkdigit = 0 ;
	else
		$checkdigit = 10 - $reste ;
	
	$sscc = $str.$checkdigit ;
	return $sscc ;
}



?>
