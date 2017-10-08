<?php

function specRsiRecouveo_lib_metafields_build() {
	global $_opDB ;
	
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_atr = $ttmp['data']['cfg_atr'] ;
	
	foreach( $cfg_atr as $atr_definition ) {
		$atr_field = $atr_definition['atr_field'] ;
		$atr_dbfield = 'field_'.$atr_definition['atr_field'] ;
		$query = "SELECT count(*) FROM define_bible_entry WHERE bible_code='LIB_ACCOUNT' AND entry_field_code='{$atr_field}'" ;
		if( $_opDB->query_uniqueValue($query) != 1 ) {
			$query = "SELECT max(entry_field_index) FROM define_bible_entry WHERE bible_code='LIB_ACCOUNT'" ;
			$max_index = $_opDB->query_uniqueValue($query) ;
			$max_index++ ;
			
			$arr_ins = array() ;
			$arr_ins['bible_code'] = 'LIB_ACCOUNT' ;
			$arr_ins['entry_field_code'] = $atr_field ;
			$arr_ins['entry_field_is_key'] = 'O' ;
			$arr_ins['entry_field_index'] = $max_index ;
			$arr_ins['entry_field_lib'] = 'Atr: '.$atr_definition['atr_desc'] ;
			$arr_ins['entry_field_type'] = 'string' ;
			$arr_ins['entry_field_is_header'] = '' ;
			$arr_ins['entry_field_is_highlight'] = 'O' ;
			$_opDB->insert('define_bible_entry',$arr_ins) ;
		}
	}
	$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() );
	$t->sdomainDefine_buildBible( DatabaseMgr_Sdomain::dbCurrent_getSdomainId(), 'LIB_ACCOUNT' ) ;
}

?>
