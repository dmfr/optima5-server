<?php

function paracrm_auth_delegate_getLog() {
	if( !Auth_Manager::getInstance()->auth_query_sdomain_admin( Auth_Manager::sdomain_getCurrent() ) ) {
		return Auth_Manager::auth_getDenialResponse() ;
	}
	
	global $_opDB ;
	
	$tab_log = array() ;
	$query = "SELECT * FROM auth_delegate_log ORDER BY authdelegate_log_id DESC" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$tab_log[] = $arr ;
	}
	return array('success'=>true, 'data'=>$tab_log) ;
}



function paracrm_auth_delegate_getConfig() {
	if( !Auth_Manager::getInstance()->auth_query_sdomain_admin( Auth_Manager::sdomain_getCurrent() ) ) {
		return Auth_Manager::auth_getDenialResponse() ;
	}
	
	global $_opDB ;
	
	$biblesStore = array() ;
	
	$query = "SELECT bible_code, bible_lib FROM define_bible ORDER BY bible_code" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$bible_code = $arr['bible_code'] ;
		
		$arr['bible_fields'] = array() ;
		$biblesStore[$bible_code] = $arr ;
	}
	
	$query = "SELECT bible_code, entry_field_code AS field_code, entry_field_lib AS field_lib
			FROM define_bible_entry
			WHERE entry_field_type='string'
			ORDER BY bible_code,entry_field_index" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$bible_code = $arr['bible_code'] ;
		
		unset($arr['bible_code']) ;
		$biblesStore[$bible_code]['bible_entry_fields'][] = $arr ;
	}
	
	$query = "SELECT bible_code, tree_field_code AS field_code, tree_field_lib AS field_lib
			FROM define_bible_tree
			WHERE tree_field_type='string'
			ORDER BY bible_code,tree_field_index" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$bible_code = $arr['bible_code'] ;
		
		unset($arr['bible_code']) ;
		$biblesStore[$bible_code]['bible_tree_fields'][] = $arr ;
	}
	
	$query = "INSERT IGNORE INTO auth_delegate (`zero_id`) VALUES ('0')" ;
	$_opDB->query($query) ;
	
	$query = "SELECT * FROM auth_delegate WHERE zero_id='0'" ;
	$result = $_opDB->query($query) ;
	$arrForm = $_opDB->fetch_assoc($result) ;
	$arrForm['authdelegate_acl_is_on'] = ( $arrForm['authdelegate_acl_is_on'] == 'O' ) ;
	unset($arrForm['zero_id']) ;
	
	return array(
		'success'=>true,
		'biblesStore'=>array_values($biblesStore),
		'formData'=>$arrForm
	) ;
}
function paracrm_auth_delegate_setConfig($post_data) {
	if( !Auth_Manager::getInstance()->auth_query_sdomain_admin( Auth_Manager::sdomain_getCurrent() ) ) {
		return Auth_Manager::auth_getDenialResponse() ;
	}
	
	global $_opDB ;
	
	$form_data = json_decode($post_data['formData'],true) ;
	$authdelegate_is_on = ( $form_data['authdelegate_is_on'] == 'on' ) ;
	$authdelegate_bible_code = $form_data['authdelegate_bible_code'] ;
	$authdelegate_user_bible_field_code = $form_data['authdelegate_user_bible_field_code'] ;
	$authdelegate_pass_bible_field_code = $form_data['authdelegate_pass_bible_field_code'] ;
	$authdelegate_acl_is_on = $form_data['authdelegate_acl_is_on'] ;
	$authdelegate_acl_bible_field_code = $form_data['authdelegate_acl_bible_field_code'] ;
	
	if( $authdelegate_is_on ) {
		if( !$authdelegate_bible_code || !$authdelegate_user_bible_field_code || !$authdelegate_pass_bible_field_code ) {
			return array('success'=>false) ;
		}
	}
	
	$arr_update = array() ;
	$arr_update['authdelegate_is_on'] = ($authdelegate_is_on ? '1' : '0') ;
	if( $authdelegate_is_on ) {
		$arr_update['authdelegate_bible_code'] = $authdelegate_bible_code ;
		$arr_update['authdelegate_user_bible_field_code'] = $authdelegate_user_bible_field_code ;
		$arr_update['authdelegate_pass_bible_field_code'] = $authdelegate_pass_bible_field_code ;
		$arr_update['authdelegate_acl_is_on'] = ($authdelegate_acl_is_on ? 'O' : 'N') ;
		$arr_update['authdelegate_acl_bible_field_code'] = ($authdelegate_acl_is_on ? $authdelegate_acl_bible_field_code : '') ;
	} else {
		$arr_update['authdelegate_bible_code'] = $arr_update['authdelegate_user_bible_field_code'] = $arr_update['authdelegate_pass_bible_field_code'] = '' ;
		$arr_update['authdelegate_acl_is_on'] = FALSE ;
		$arr_update['authdelegate_acl_bible_field_code'] = '' ;
	}
	$arr_cond = array() ;
	$arr_cond['zero_id'] = 0 ;
	$_opDB->update('auth_delegate',$arr_update,$arr_cond) ;
	
	return array('success'=>true) ;
}

?>