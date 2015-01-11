<?php

function specDbsEmbralam_cfg_getStockAttributes() {
	$return_fields = specDbsEmbralam_lib_stockAttributes_getStockAttributes() ;
	if( !is_array($return_fields) ) {
		return array('success'=>false) ;
	}
	return array('success'=>true, 'data'=>$return_fields) ;
}

?>