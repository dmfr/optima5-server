<?php

function specRsiRecouveo_lib_metafields_build() {
	global $_opDB ;
	
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_atr = $ttmp['data']['cfg_atr'] ;
	
	$used_fields_A = array() ;
	$used_fields_R = array() ;
	foreach( $cfg_atr as $atr_definition ) {
		$atr_field = $atr_definition['atr_field'] ;
		$atr_dbfield = 'field_'.$atr_definition['atr_field'] ;
		
		if( $atr_definition['atr_type']=='account' ) {
			$used_fields_A[] = $atr_field ;
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
		
		if( $atr_definition['atr_type']=='record' ) {
			$used_fields_R[] = $atr_field ;
			$arr_ins_base = array() ;
			$arr_ins_base['entry_field_code'] = $atr_field ;
			$arr_ins_base['entry_field_lib'] = 'Atr: '.$attribute['atr_desc'] ;
			$arr_ins_base['entry_field_type'] = 'string' ;
			$arr_ins_base['entry_field_is_header'] = '' ;
			$arr_ins_base['entry_field_is_highlight'] = 'O' ;
			
			foreach( array('FILE','RECORD') as $file_code ) {
				$arr_ins = $arr_ins_base ;
				$arr_ins['file_code'] = $file_code ;
				$query = "SELECT count(*) FROM define_file_entry WHERE file_code='{$file_code}' AND entry_field_code='{$atr_field}'" ;
				if( $_opDB->query_uniqueValue($query) != 1 ) {
					$query = "SELECT max(entry_field_index) FROM define_file_entry WHERE file_code='{$file_code}'" ;
					$max_index = $_opDB->query_uniqueValue($query) ;
					$max_index++ ;
					
					$arr_ins['entry_field_index'] = $max_index ;
					$_opDB->insert('define_file_entry',$arr_ins) ;
				} else {
					$arr_cond = array() ;
					$arr_cond['file_code'] = $file_code ;
					$arr_cond['entry_field_code'] = $atr_field ;
					$_opDB->update('define_file_entry',$arr_ins,$arr_cond) ;
				}
			}
		}
	}
	
	$query = "DELETE FROM define_bible_entry WHERE bible_code='LIB_ACCOUNT' AND entry_field_code LIKE 'ATR\_%'" ;
	foreach( $used_fields_A as $atr_field ) {
		$query.= " AND entry_field_code<>'{$atr_field}'" ;
	}
	$_opDB->query($query) ;
	
	$query = "DELETE FROM define_file_entry WHERE file_code IN ('FILE','RECORD') AND entry_field_code LIKE 'ATR\_%'" ;
	foreach( $used_fields_R as $atr_field ) {
		$query.= " AND entry_field_code<>'{$atr_field}'" ;
	}
	$_opDB->query($query) ;
	
	
	$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() );
	$t->sdomainDefine_buildBible( DatabaseMgr_Sdomain::dbCurrent_getSdomainId(), 'LIB_ACCOUNT' ) ;
	$t->sdomainDefine_buildFile( DatabaseMgr_Sdomain::dbCurrent_getSdomainId(), 'FILE' ) ;
	$t->sdomainDefine_buildFile( DatabaseMgr_Sdomain::dbCurrent_getSdomainId(), 'RECORD' ) ;
}

?>
