<?php

function specRsiRecouveo_doc_cfg_getTpl( $post_data ) {
	global $_opDB ;
	$p_tplGroup = $post_data['tpl_group'] ;
	$p_tplBinary = $post_data['load_binary'] ;
	
	$app_root = $GLOBALS['app_root'] ;
	$resources_root=$app_root.'/resources' ;
	$templates_dir=$resources_root.'/server/templates' ;
	
	$data = array() ;
	$query = "SELECT * from view_bible_TPL_entry WHERE 1" ;
	if( $post_data['tpl_id'] ) {
		$query.= " AND entry_key='{$post_data['tpl_id']}'" ;
	} else {
		$query.= " AND treenode_key='{$p_tplGroup}'" ;
	}
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$data[] = array(
			'tpl_id' => $arr['field_TPL_ID'],
			'tpl_name' => $arr['field_TPL_NAME'],
			'html_src_file' => $arr['field_HTML_SRC_FILE'],
			'html_footer_file' => $arr['field_HTML_FOOTER_FILE'],
			'html_body' => $arr['field_HTML_BODY'],
			'html_title' => $arr['field_HTML_TITLE']
		);
	}
	if( !$p_tplBinary ) {
		return array('success'=>true, 'data'=>$data) ; 
	}
	
	foreach( $data as &$data_row ) {
		$inputFileName = $templates_dir.'/'.$data_row['html_src_file'] ;
		$inputBinary = file_get_contents($inputFileName) ;
		
		$doc = new DOMDocument();
		@$doc->loadHTML($inputBinary);
		$elements = $doc->getElementsByTagName('qbook-value');
		$i = $elements->length - 1;
		while ($i > -1) {
			$node_qbookValue = $elements->item($i); 
			$i--; 
			
			$val = '' ;
			$src_value = $node_qbookValue->attributes->getNamedItem('src_value')->value ;
			switch( $src_value ) {
				case 'body_content' :
				$new_node = $doc->createCDATASection($data_row['html_body']) ;
				$node_qbookValue->parentNode->replaceChild($new_node,$node_qbookValue) ;
				break ;
				
				case 'body_title' :
				$new_node = $doc->createCDATASection($data_row['html_title']) ;
				$node_qbookValue->parentNode->replaceChild($new_node,$node_qbookValue) ;
				break ;
				
				case 'body_footer' :
				$inputFileName = $templates_dir.'/'.$data_row['html_footer_file'] ;
				$inputBinary = file_get_contents($inputFileName) ;
				$new_node = specRsiRecouveo_doc_buildFooter($inputBinary) ;
				$new_node = $doc->importNode($new_node, true);
				$node_qbookValue->parentNode->replaceChild($new_node,$node_qbookValue) ;
				break ;
				
				default :
				break ;
			}
		}
		
		$data_row['tpl_html'] = $doc->saveHTML() ;
	}
	unset($data_row) ;
	return array('success'=>true, 'data'=>$data) ;
}
function specRsiRecouveo_doc_buildFooter( $footerBinary ) {
	$doc = new DOMDocument();
	@$doc->loadHTML('<?xml encoding="UTF-8"><html>'."\r\n".'<div>'.$footerBinary.'</div></html>');
	$node = $doc->getElementsByTagName("div")->item(0) ;
	//var_dump($node) ;
	return $node ;
}
function specRsiRecouveo_doc_getMailOut( $post_data ) {
	global $_opDB ;
	$p_tplId = $post_data['tpl_id'] ;
	
	
	
	// ************ DONNEES ***********************
	$map_columns = array(
		'record_id' => 'Ref Facture',
		'date_record' => 'Date<br>facture',
		'date_value' => 'Date<br>échéance',
		'obs1' => 'Libellé',
		'obs2' => 'Observations',
		'amount_tot' => 'Solde TTC',
		'amount_due' => 'Dont échu'
	);
	$table_columns = array() ;
	foreach( $map_columns as $mkey => $mvalue ) {
		$table_columns[] = array(
			'dataIndex' => $mkey,
			'text' => $mvalue
		);
	}
	
	$table_data = array() ;
	foreach( array() as $record_row ) {
		$table_data[] = $row_table ;
	}
	
	
	
	
	
	
	
	
	// ************ TEMPLATE ***********************	
	$ttmp = specRsiRecouveo_doc_cfg_getTpl( array(
		'tpl_id' => $p_tplId,
		'load_binary' => true
	)) ;
	$data_row = $ttmp['data'][0] ;
	$inputBinary = $data_row['tpl_html'];
		
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
