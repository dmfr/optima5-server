<?php

include("$server_root/modules/spec_rsi_recouveo/include/specRsiRecouveo_risk_lib_ellisphere.inc.php") ;

function specRsiRecouveo_risk_getAccount( $post_data ) {


}
function specRsiRecouveo_risk_doSearch( $post_data ) {
	$acc_id = $post_data['acc_id'] ;
	$search_data = json_decode($post_data['data'],true) ;
	
	$obj_search = specRsiRecouveo_risk_lib_ES_getSearchObj($acc_id,$search_data['search_mode'],$search_data['search_txt']) ;

	return array('success'=>true, 'data'=>$obj_search, 'debug'=>$post_data, 'debug2'=>$search_data) ;
}


?>
