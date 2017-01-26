<?php

function specRsiRecouveo_doc_cfg_getTpl( $post_data ) {
	global $_opDB ;
	$p_tplGroup = $post_data['tpl_group'] ;
	$p_tplBinary = $post_data['load_binary'] ;
	
	$data = array() ;
	$query = "SELECT * from view_bible_TPL_entry WHERE treenode_key='{$p_tplGroup}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$data[] = array(
			'tpl_id' => $arr['field_TPL_ID'],
			'tpl_name' => $arr['field_TPL_NAME'],
			'binary_html' => ($p_tplBinary ? $arr['field_BINARY_HTML'] : null)
		);
	}
	return array('success'=>true, 'data'=>$data) ;
}

function specRsiRecouveo_doc_getMailOut( $post_data ) {
	global $_opDB ;
	$p_tplId = $post_data['tpl_id'] ;
	
	$query = "SELECT field_BINARY_HTML from view_bible_TPL_entry WHERE entry_key='{$p_tplId}'" ;
	$inputBinary = $_opDB->query_uniqueValue($query) ;
	
	//echo $inputFileName ;
	$doc = new DOMDocument();
	@$doc->loadHTML($inputBinary);
	
	$elements = $doc->getElementsByTagName('qbook-value');
	$i = $elements->length - 1;
	while ($i > -1) {
		$node_qbookValue = $elements->item($i); 
		$i--; 
		
		$val = '' ;
		$src_value = $node_qbookValue->attributes->getNamedItem('src_value')->value ;
		if( $map_mkey_value[$src_value] ) {
			$val = $map_mkey_value[$src_value] ;
		}
		
		$new_node = $doc->createCDATASection($val) ;
		$node_qbookValue->parentNode->replaceChild($new_node,$node_qbookValue) ;
	}
	
	$elements = $doc->getElementsByTagName('qbook-table');
	$i = $elements->length - 1;
	while ($i > -1) {
		$node_qbookTable = $elements->item($i); 
		$i--; 
		
		$table_html = paracrm_queries_template_makeTable($table_columns,$table_data) ;
		
		//echo $table_html ;
		$dom_table = new DOMDocument();
		$dom_table->loadHTML( '<?xml encoding="UTF-8"><html>'.$table_html.'</html>' ) ;
		$node_table = $dom_table->getElementsByTagName("table")->item(0);
		
		$table_attr = $dom_table->createAttribute("class") ;
		$table_attr->value = 'invoicewidth tabledonnees' ;
		$node_table->appendChild($table_attr) ;
		
		$node_table = $doc->importNode($node_table,true) ;
		
		$node_qbookTable->parentNode->replaceChild($node_table,$node_qbookTable) ;
	}
	
	$filename = preg_replace("/[^a-zA-Z0-9]/", "",'PRINT').'.pdf' ;
	
	return array('success'=>true, 'html'=>$doc->saveHTML(), 'filename'=>$filename ) ;
}

?>
