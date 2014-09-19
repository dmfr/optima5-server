<?php

$GLOBALS['cache_specDbsPeople_lib_peopleFields'] ;

function specDbsPeople_lib_peopleFields_getPeopleFields() {
	if( isset($GLOBALS['cache_specDbsPeople_lib_peopleFields']['peopleFields']) ) {
		return $GLOBALS['cache_specDbsPeople_lib_peopleFields']['peopleFields'] ;
	}
	
	global $_opDB ;
	
	$json_biblePeople_cfg = paracrm_data_getBibleCfg( array('bible_code'=>'RH_PEOPLE') ) ;
	if( !$json_biblePeople_cfg['success'] ) {
		return NULL ;
	}
	
	$return_fields = array() ;
	foreach( $json_biblePeople_cfg['data']['entry_fields'] as $entry_field ) {
		if( in_array($entry_field['entry_field_code'],array('headerlib','entry_key','treenode_key')) ) {
			continue ;
		}
		if( in_array($entry_field['entry_field_code'],array('field_PPL_CODE','field_PPL_FULLNAME')) ) {
			continue ;
		}
		
		if( $entry_field['entry_field_type'] == 'link' ) {
			$bible_code = $entry_field['entry_field_linkbible'] ;
			$json_bibleLink_cfg = paracrm_data_getBibleCfg( array('bible_code'=>$bible_code) ) ;
			switch( $entry_field['entry_field_linktype'] ) {
				case 'treenode' :
					$display_columns = array() ;
					foreach( $json_bibleLink_cfg['data']['tree_fields'] as $link_tree_field ) {
						if( $link_tree_field['tree_field_is_header'] ) {
							$display_columns[] = $link_tree_field['tree_field_code'] ;
						}
					}
					break ;
					
				case 'entry' :
					$display_columns = array() ;
					foreach( $json_bibleLink_cfg['data']['entry_fields'] as $link_entry_field ) {
						if( $link_entry_field['entry_field_is_header'] ) {
							$display_columns[] = $link_entry_field['entry_field_code'] ;
						}
					}
					break ;
					
				default :
					$display_columns = NULL ;
					break ;
			}
		} else {
			$display_columns = NULL ;
		}
		
		$return_fields[] = array(
			'field' => $entry_field['entry_field_code'],
			'text' => $entry_field['entry_field_lib'],
			'type' => $entry_field['entry_field_type'],
			'link_type' => $entry_field['entry_field_linktype'],
			'link_bible' => $entry_field['entry_field_linkbible'],
			'link_displaycolumns' => $display_columns,
			'is_highlight' => $entry_field['entry_field_is_highlight'],
		);
	}
	return $GLOBALS['cache_specDbsPeople_lib_peopleFields']['peopleFields'] = $return_fields ;
}

function specDbsPeople_lib_peopleFields_populateRow( &$js_row, $db_row=NULL ) {
	$arr_peopleFields = specDbsPeople_lib_peopleFields_getPeopleFields() ;
	
	if( !is_array($db_row) ) {
		$people_code = $js_row['people_code'] ;
		$db_row = paracrm_lib_data_getRecord_bibleEntry('RH_PEOPLE',$people_code) ;
	}
	
	foreach( $arr_peopleFields as $peopleField ) {
		$field_code = $peopleField['field'] ;
		switch( $peopleField['type'] ) {
			case 'link' :
				$value = $db_row[$field_code] ;
				if( isJsonArr($value) ) {
					$arr_ids = json_decode($value, true) ;
				} elseif( $value != null ) {
					$arr_ids = array($value) ;
				} else {
					$arr_ids = array() ;
				}
				if( count($arr_ids) == 1 ) {
					$unique_id = reset($arr_ids) ;
					switch( $peopleField['link_type'] ) {
						case 'treenode' :
							$text = specDbsPeople_lib_peopleFields_populateRow_prettifyTreenode($peopleField['link_bible'],$unique_id,$peopleField['link_displaycolumns']) ;
							break ;
						case 'entry' :
							$text = specDbsPeople_lib_peopleFields_populateRow_prettifyEntry($peopleField['link_bible'],$unique_id,$peopleField['link_displaycolumns']) ;
							break ;
						default :
							$text = '???' ;
							break ;
					}
				} else {
					$text = implode(' / ',$arr_ids) ;
				}
				$js_row[$field_code] = array(
					'id' => $db_row[$field_code],
					'text' => $text
				) ;
				break ;
				
			default :
				$js_row[$field_code] = $db_row[$field_code] ;
				break ;
		}
	}
}

function specDbsPeople_lib_peopleFields_populateRow_prettifyTreenode( $bible_code, $treenode_key, $display_columns ) {
	global $_opDB ;
	if( !isset($GLOBALS['cache_specDbsPeople_lib_peopleFields']['bibleTreenodes'][$bible_code]) ) {
		$ttmp = array() ;
		$query = "SELECT *
						FROM view_bible_{$bible_code}_tree e
						ORDER BY e.treenode_key" ;
		$result = $_opDB->query($query) ;
		while( ($record = $_opDB->fetch_assoc($result)) != FALSE )
		{
			$m_treenode_key = $record['treenode_key'] ;
			$ttmp[$m_treenode_key] = $record ;
		}
		$GLOBALS['cache_specDbsPeople_lib_peopleFields']['bibleTreenodes'][$bible_code] = $ttmp ;
	}
	
	$treenode_record = $GLOBALS['cache_specDbsPeople_lib_peopleFields']['bibleTreenodes'][$bible_code][$treenode_key] ;
	$arr_txt = array() ;
	foreach( $display_columns as $col ) {
		$arr_txt[] = $treenode_record[$col] ;
	}
	return implode(' - ',$arr_txt) ;
}
function specDbsPeople_lib_peopleFields_populateRow_prettifyEntry( $bible_code, $entry_key, $display_columns ) {
	global $_opDB ;
	if( !isset($GLOBALS['cache_specDbsPeople_lib_peopleFields']['bibleEntries'][$bible_code]) ) {
		$ttmp = array() ;
		$query = "SELECT *
						FROM view_bible_{$bible_code}_entry e
						ORDER BY e.treenode_key, e.entry_key" ;
		$result = $_opDB->query($query) ;
		while( ($record = $_opDB->fetch_assoc($result)) != FALSE )
		{
			$m_entry_key = $record['entry_key'] ;
			$ttmp[$m_entry_key] = $record ;
		}
		$GLOBALS['cache_specDbsPeople_lib_peopleFields']['bibleEntries'][$bible_code] = $ttmp ;
	}
	
	$entry_record = $GLOBALS['cache_specDbsPeople_lib_peopleFields']['bibleEntries'][$bible_code][$entry_key] ;
	$arr_txt = array() ;
	foreach( $display_columns as $col ) {
		$arr_txt[] = $entry_record[$col] ;
	}
	return implode(' - ',$arr_txt) ;
}
?>