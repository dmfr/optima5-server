<?php
function paracrm_queries_qbookTransaction( $post_data )
{
	global $_opDB ;
	
	if( $post_data['_action'] == 'queries_qbookTransaction' && $post_data['_subaction'] == 'init' )
	{
		// ouverture transaction
		$transaction_id = $_SESSION['next_transaction_id']++ ;
		
		$_SESSION['transactions'][$transaction_id] = array() ;
		$_SESSION['transactions'][$transaction_id]['transaction_code'] = 'paracrm_queries_qbookTransaction' ;
		
		$arr_saisie = array() ;
		$_SESSION['transactions'][$transaction_id]['arr_saisie'] = $arr_saisie ;
		$_SESSION['transactions'][$transaction_id]['arr_RES'] = array() ;
		
		$_SESSION['transactions'][$transaction_id]['tmp_ztemplateResourceBinary'] = NULL ;
		
		$post_data['_transaction_id'] = $transaction_id ;
	}
	
	
	if( $post_data['_action'] == 'queries_qbookTransaction' && $post_data['_transaction_id'] )
	{
		if( !$_SESSION['transactions'][$post_data['_transaction_id']] )
			return NULL ;
		$transaction_id = $post_data['_transaction_id'] ;
		$arr_transaction = $_SESSION['transactions'][$transaction_id] ;
		if( $arr_transaction['transaction_code'] != 'paracrm_queries_qbookTransaction' )
			return NULL ;
			
		$arr_saisie = $arr_transaction['arr_saisie'] ;
		
		if( $post_data['_subaction'] == 'init' )
		{
			$json =  paracrm_queries_qbookTransaction_init( $post_data , $arr_saisie ) ;
		}
		if( $post_data['_subaction'] == 'run' )
		{
			if( isset($post_data['qsrc_filerecord_id']) ) {
				$qsrc_filerecordId = $post_data['qsrc_filerecord_id'] ;
			}
			if( isset($post_data['qsrc_filerecord_row']) ) {
				$qsrc_filerecord_row = $post_data['qsrc_filerecord_row'] ;
			}
			$json =  paracrm_queries_qbookTransaction_runQuery( $post_data , $arr_saisie, $qsrc_filerecordId, $qsrc_filerecord_row ) ;
		}
		if( $post_data['_subaction'] == 'submit' )
		{
			$json =  paracrm_queries_qbookTransaction_submit( $post_data , $arr_saisie ) ;
		}
		if( $post_data['_subaction'] == 'save' || $post_data['_subaction'] == 'saveas' || $post_data['_subaction'] == 'delete' )
		{
			$json =  paracrm_queries_qbookTransaction_save( $post_data , $arr_saisie ) ;
		}
		if( $post_data['_subaction'] == 'toggle_publish' )
		{
			$post_data['isPublished'] = 'false' ; //TODO : handle qbook publication
			$json =  paracrm_queries_qbookTransaction_togglePublish( $post_data , $arr_saisie ) ;
			if( $json['success'] ) {
				paracrm_queries_organizePublish() ;
			}
		}
		
		
		switch( $post_data['_subaction'] ) {
			case 'ztplman_getZtemplatesList' :
				$qbook_id = $arr_saisie['qbook_id'] ;
				$query = "SELECT * FROM qbook_ztemplate
							WHERE qbook_id='{$qbook_id}' ORDER BY ztemplate_name" ;
				$result = $_opDB->query($query) ;
				$tab_data = array() ;
				while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
					unset($arr['qbook_id']) ;
					unset($arr['ztemplate_resource_binary']) ;
					$tab_data[] = $arr ;
				}
				$json = array(
					'success'=>true,
					'data'=>$tab_data
				) ;
				break ;
			
			case 'ztplman_dlZtemplateResource' :
				$qbook_id = $arr_saisie['qbook_id'] ;
				$qbook_ztemplate_ssid = $post_data['qbook_ztemplate_ssid'] ;
				$query = "SELECT ztemplate_metadata_filename, ztemplate_resource_binary FROM qbook_ztemplate
							WHERE qbook_id='{$qbook_id}' AND qbook_ztemplate_ssid='{$qbook_ztemplate_ssid}'" ;
				$result = $_opDB->query($query) ;
				$arr = $_opDB->fetch_assoc($result) ;
				
				$ztemplate_resource_binary = $arr['ztemplate_resource_binary'] ;
				$filename = $arr['ztemplate_metadata_filename'] ;
				
				header("Content-Type: application/force-download; name=\"$filename\""); 
				header("Content-Disposition: attachment; filename=\"$filename\""); 
				echo $ztemplate_resource_binary ;
				die() ;
				break ;
			
			case 'ztplman_setZtemplate' :
				$form_values = json_decode($post_data['form_values'],true) ;
				$arr_update = array() ;
				$arr_update['ztemplate_name'] = $form_values['ztemplate_name']  ;
				if( $form_values['ztemplate_resource_upload'] == 'true' && $_SESSION['transactions'][$transaction_id]['tmp_ztemplateResourceBinary'] ) {
					$arr_update['ztemplate_metadata_filename'] = $form_values['ztemplate_metadata_filename']  ;
					$arr_update['ztemplate_metadata_date'] = $form_values['ztemplate_metadata_date']  ;
					$arr_update['ztemplate_resource_binary'] = $_SESSION['transactions'][$transaction_id]['tmp_ztemplateResourceBinary']  ;
					$has_upload = TRUE ;
				}
				switch( $post_data['edit_action'] ) {
					case 'new' :
						if( !$has_upload ) {
							$json = array('success'=>false) ;
							break 2 ;
						}
						$query = "SELECT max(qbook_ztemplate_ssid) FROM qbook_ztemplate WHERE qbook_id='{$arr_saisie['qbook_id']}'";
						$arr_insert = array() ;
						$arr_insert['qbook_id'] = $arr_saisie['qbook_id'] ;
						$arr_insert['qbook_ztemplate_ssid'] = ($_opDB->query_uniqueValue($query) + 1) ;
						$arr_insert += $arr_update ;
						$_opDB->insert('qbook_ztemplate',$arr_insert) ;
						break ;
						
					case 'edit' :
						if( !$post_data['qbook_ztemplate_ssid'] ) {
							$json = array('success'=>false) ;
							break 2 ;
						}
						$arr_cond = array() ;
						$arr_cond['qbook_id'] = $arr_saisie['qbook_id'] ;
						$arr_cond['qbook_ztemplate_ssid'] = $post_data['qbook_ztemplate_ssid'] ;
						$_opDB->update('qbook_ztemplate',$arr_update,$arr_cond) ;
						break ;
						
					case 'delete' :
						if( !$post_data['qbook_ztemplate_ssid'] ) {
							$json = array('success'=>false) ;
							break 2 ;
						}
						$query = "DELETE FROM qbook_ztemplate WHERE qbook_id='{$arr_saisie['qbook_id']}' AND qbook_ztemplate_ssid='{$post_data['qbook_ztemplate_ssid']}'";
						$_opDB->query($query) ;
						break ;
						
					default :
						$json = array('success'=>false) ;
						break 2 ;
				}
				
				$json = array('success'=>true) ;
				break ;
			
			case 'ztplman_uploadTmpResource' :
				if( !$_FILES['ztemplate_resource_binary'] || !$_FILES['ztemplate_resource_binary']['tmp_name'] ) {
					$json = array('success'=>false,'failure'=>"Failed to parse upload") ;
					break ;
				}
				if( $_FILES['ztemplate_resource_binary']['type'] != 'text/html' ) {
					$json = array('success'=>false,'failure'=>"Invalid file type ({$_FILES['ztemplate_resource_binary']['type']})") ;
					break ;
				}
				$_SESSION['transactions'][$transaction_id]['tmp_ztemplateResourceBinary'] = file_get_contents($_FILES['ztemplate_resource_binary']['tmp_name']) ;
				
				$data = array() ;
				$data['ztemplate_metadata_filename'] = $_FILES['ztemplate_resource_binary']['name'] ;
				$data['ztemplate_metadata_date'] = date('Y-m-d H:i:s') ;
				$json = array('success'=>true,'data'=>$data) ;
				break ;
		}
		
		
		if( $post_data['_subaction'] == 'res_get' || $post_data['_subaction'] == 'exportXLS' )
		{
			if( $post_data['qbook_ztemplate_ssid'] ) {
				$json =  paracrm_queries_qbookTransaction_resGetZtemplate( $post_data, $arr_saisie ) ;
			} else {
				$json =  paracrm_queries_qbookTransaction_resGet( $post_data, $arr_saisie ) ;
			}
			if( $post_data['_subaction'] == 'exportXLS' ) {
				paracrm_queries_qbookTransaction_exportJson( $json, $arr_saisie ) ;
			}
		}
		
		if( $post_data['_subaction'] == 'end' )
		{
			unset($_SESSION['transactions'][$transaction_id]) ;
			return array('success'=>true) ;
		}
		
		if( is_array($arr_saisie) )
		{
			$_SESSION['transactions'][$transaction_id]['arr_saisie'] = $arr_saisie ;
		}
		else
		{
			unset($_SESSION['transactions'][$transaction_id]) ;
		}
		
		return $json ;
	}
}

function paracrm_queries_qbookTransaction_init( $post_data , &$arr_saisie )
{
	global $_opDB ;
	
	/*
	************ INITIALISATION *********
	- bible des QUERIES existantes
	- remplissage des champs
	*******************************
	*/
	if( $post_data['is_new'] == 'true' )
	{
		$arr_saisie['arr_inputvar'] = array() ;
		$arr_saisie['arr_qobj'] = array() ;
		$arr_saisie['arr_value'] = array() ;
	}
	elseif( $post_data['qbook_id'] > 0 )
	{
		$query = "SELECT * FROM qbook WHERE qbook_id='{$post_data['qbook_id']}'" ;
		$result = $_opDB->query($query) ;
		$arr = $_opDB->fetch_assoc($result) ;
		if( !$arr )
		{
			$transaction_id = $post_data['_transaction_id'] ;
			unset($_SESSION['transactions'][$transaction_id]) ;
			return array('success'=>false) ;
		}
		$arr_saisie['qbook_id'] = $arr['qbook_id'] ;
		$arr_saisie['qbook_name'] = $arr['qbook_name'] ;
		$arr_saisie['backend_file_code'] = $arr['backend_file_code'] ;
		paracrm_queries_qbookTransaction_loadFields( $arr_saisie , $arr_saisie['qbook_id'] ) ;
	}
	else
	{
		$transaction_id = $post_data['_transaction_id'] ;
		unset($_SESSION['transactions'][$transaction_id]) ;
		return array('success'=>false) ;
	}
	
	
	
	$arr_saisie['bible_qobjs'] = array() ;
	$query = "SELECT * FROM query" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$query_id = $arr['query_id'] ;
		$arr_query = array() ;
		$arr_query['_sort_me'] = $arr['query_name'] ;
		$arr_query['q_type'] = 'query' ;
		foreach( array('query_id','query_name','target_file_code') as $mkey ) {
			$arr_query[$mkey] = $arr[$mkey] ;
		}
		paracrm_queries_builderTransaction_loadFields( $arr_query , $query_id ) ;
		
		$arr_saisie['bible_qobjs'][] = $arr_query ;
	}
	$query = "SELECT * FROM qmerge" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$qmerge_id = $arr['qmerge_id'] ;
		$arr_qmerge = array() ;
		$arr_qmerge['_sort_me'] = $arr['qmerge_name'] ;
		$arr_qmerge['q_type'] = 'qmerge' ;
		foreach( array('qmerge_id','qmerge_name') as $mkey ) {
			$arr_qmerge[$mkey] = $arr[$mkey] ;
		}
		paracrm_queries_mergerTransaction_loadFields( $arr_qmerge , $qmerge_id ) ;
		
		$arr_saisie['bible_qobjs'][] = $arr_qmerge ;
	}
	usort($arr_saisie['bible_qobjs'],create_function('$a,$b','return strcasecmp($a[\'_sort_me\'],$b[\'_sort_me\']);') ) ;
	
	$arr_saisie['bible_files_treefields'] = array() ;
	$query = "SELECT file_code FROM define_file ORDER BY file_code" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$file_code = $arr[0] ;
	
		$ttmp = paracrm_lib_file_access( $file_code ) ;
		$arr_saisie['bible_files_treefields'][$file_code] = paracrm_queries_builderTransaction_getTreeFields( $ttmp ) ;
	}
	
	
	


	return array('success'=>true,
					'_mirror'=>$post_data,
					'transaction_id' => $post_data['_transaction_id'],
					'qbook_id' => $arr_saisie['qbook_id'],
					'qbook_name' => $arr_saisie['qbook_name'],
					'bible_qobjs' => $arr_saisie['bible_qobjs'],
					'bible_files_treefields' => $arr_saisie['bible_files_treefields'],
					'backend_file_code' => $arr_saisie['backend_file_code'],
					'qbook_arr_inputvar' => $arr_saisie['arr_inputvar'],
					'qbook_arr_qobj' => $arr_saisie['arr_qobj'],
					'qbook_arr_value' => $arr_saisie['arr_value']
					) ;
}

function paracrm_queries_qbookTransaction_submit( $post_data , &$arr_saisie )
{
	global $_opDB ;
	
	$arr_saisie['backend_file_code'] = $post_data['backend_file_code'] ;
	
	$map_client2server = array() ;
	$map_client2server['qbook_arr_inputvar'] = 'arr_inputvar' ;
	$map_client2server['qbook_arr_qobj'] = 'arr_qobj' ;
	$map_client2server['qbook_arr_value'] = 'arr_value' ;
	foreach( $map_client2server as $mkey_client => $mkey_local ) {
		if( !isset($post_data[$mkey_client]) ) {
			continue ;
		}
		$arr_saisie[$mkey_local] = json_decode($post_data[$mkey_client],TRUE) ;
	}

	return array('success'=>true) ;
}
function paracrm_queries_qbookTransaction_togglePublish( $post_data , &$arr_saisie )
{
	global $_opDB ;

	$qbook_id = $arr_saisie['qbook_id'] ;
	$is_published = ($post_data['isPublished']=='true')?true:false ;
	
	$query = "DELETE FROM input_query_src WHERE target_qbook_id='$qbook_id'" ;
	$_opDB->query($query) ;
	
	if( $is_published ) {
		$arr_ins = array() ;
		$arr_ins['target_qbook_id'] = $qbook_id ;
		$_opDB->insert('input_query_src',$arr_ins) ;
	}

	return array('success'=>true) ;
}

function paracrm_queries_qbookTransaction_runQuery( $post_data, &$arr_saisie, $qsrc_filerecordId=0, $src_filerecord_row=NULL )
{
	$RES = paracrm_queries_process_qbook($arr_saisie , (isset($post_data['_debug'])&&$post_data['_debug']==TRUE)?true:false, $qsrc_filerecordId, $src_filerecord_row ) ;
	if( !$RES )
		return array('success'=>false,'query_status'=>'NOK') ;
		
	$transaction_id = $post_data['_transaction_id'] ;
	if( !is_array($_SESSION['transactions'][$transaction_id]['arr_RES']) )
		return array('success'=>false,'query_status'=>'NO_RES') ;
	
	$new_RES_key = count($_SESSION['transactions'][$transaction_id]['arr_RES']) + 1 ;
	$_SESSION['transactions'][$transaction_id]['arr_RES'][$new_RES_key] = $RES ;
	
	
	return array('success'=>true,'query_status'=>'OK','RES_id'=>$new_RES_key,'debug'=>$RES) ;
}

function paracrm_queries_qbookTransaction_resGetZtemplate( $post_data, &$arr_saisie )
{
	global $_opDB ;
	global $app_root, $server_root ;
	
	$transaction_id = $post_data['_transaction_id'] ;
	$RES = $_SESSION['transactions'][$transaction_id]['arr_RES'][$post_data['RES_id']] ;
	
	$query = "SELECT ztemplate_resource_binary FROM qbook_ztemplate 
				WHERE qbook_id='{$arr_saisie['qbook_id']}' AND qbook_ztemplate_ssid='{$post_data['qbook_ztemplate_ssid']}'" ;
	$ztemplate_resource_binary = $_opDB->query_uniqueValue($query) ;
	if( !$ztemplate_resource_binary ) {
		return array('success'=>false) ;
	}
	
	
	$doc = new DOMDocument();
	@$doc->loadHTML($ztemplate_resource_binary);
	
	$elements = $doc->getElementsByTagName('qbook-chart');
	$i = $elements->length - 1;
	while ($i > -1) {
		$node_qbookChart = $elements->item($i); 
		$i--; 
		
		if( !$node_qbookChart->attributes->getNamedItem('src_qobj') ) {
			continue ;
		}
		$src_qobj = $node_qbookChart->attributes->getNamedItem('src_qobj')->value ;
		if( $node_qbookChart->attributes->getNamedItem('out_width') && $node_qbookChart->attributes->getNamedItem('out_height') ) {
			$out_width = $node_qbookChart->attributes->getNamedItem('out_width')->value ;
			$out_height = $node_qbookChart->attributes->getNamedItem('out_height')->value ;
		} else {
			continue ;
		}
		
		$RES_q = $t_chartCfg = NULL ;
		foreach( $RES['RES_qobj'] as $qobj_idx => $dummy ) {
			if( $arr_saisie['arr_qobj'][$qobj_idx]['qobj_lib'] == $src_qobj ) {
				$RES_q = $RES['RES_qobj'][$qobj_idx];
				switch( $arr_saisie['arr_qobj'][$qobj_idx]['target_q_type'] ) {
					case 'query' :
						$t_chartCfg = paracrm_queries_charts_cfgLoad('query',$arr_saisie['arr_qobj'][$qobj_idx]['target_query_id']) ;
						break ;
						
					case 'qmerge' :
						$t_chartCfg = paracrm_queries_charts_cfgLoad('qmerge',$arr_saisie['arr_qobj'][$qobj_idx]['target_qmerge_id']) ;
						break ;
				}
			}
		}
		if( !$RES_q || !$t_chartCfg ) {
			continue ;
		}
		
		if( $mixed_queryResultChartModel = paracrm_queries_charts_getMixed( $t_chartCfg ) ) {
			$img_options = array();
			$img_options['width'] = $out_width ;
			$img_options['height'] = $out_height ;
			$img_options['legend'] = ($node_qbookChart->attributes->getNamedItem('out_legend') != NULL && strtolower($node_qbookChart->attributes->getNamedItem('out_legend')->value) == 'true' ) ;
			
			$buffer_png = paracrm_queries_template_makeImgChart($RES_q, $mixed_queryResultChartModel, $img_options) ;
			$buffer_png_base64 = base64_encode($buffer_png) ;
			
			$new_node = $doc->createElement('img') ;
			$new_node->setAttribute('src', 'data:image/jpeg;base64,'.$buffer_png_base64);
			
			$node_qbookChart->parentNode->replaceChild($new_node,$node_qbookChart) ;
		}
	}
	
	
	$elements = $doc->getElementsByTagName('qbook-table');
	$i = $elements->length - 1;
	while ($i > -1) {
		$node_qbookTable = $elements->item($i); 
		$i--; 
		
		if( !$node_qbookTable->attributes->getNamedItem('src_qobj') ) {
			continue ;
		}
		$src_qobj = $node_qbookTable->attributes->getNamedItem('src_qobj')->value ;
		
		$RES_q = NULL ;
		foreach( $RES['RES_qobj'] as $qobj_idx => $dummy ) {
			if( $arr_saisie['arr_qobj'][$qobj_idx]['qobj_lib'] == $src_qobj ) {
				$RES_q = $RES['RES_qobj'][$qobj_idx];
				break ;
			}
		}
		if( !$RES_q ) {
			continue ;
		}
		
		switch( $arr_saisie['arr_qobj'][$qobj_idx]['target_q_type'] ) {
			case 'query' :
				$tab = paracrm_queries_paginate_getGrid( $RES_q, 0 ) ;
				break ;
				
			case 'qmerge' :
				$tab = paracrm_queries_mpaginate_getGrid( $RES_q, 0 ) ;
				break ;
		}
		
		$html_table = paracrm_queries_template_makeTable( $tab['columns'], $tab['data'] ) ;
		$dom_table = new DOMDocument();
		$dom_table->loadHTML( '<?xml encoding="UTF-8"><html>'.$html_table.'</html>' ) ;
		$node_table = $dom_table->getElementsByTagName("table")->item(0);
		
		$node_table = $doc->importNode($node_table,true) ;
		
		$node_qbookTable->parentNode->replaceChild($node_table,$node_qbookTable) ;
	}
	
	$elements = $doc->getElementsByTagName('qbook-value');
	$i = $elements->length - 1;
	while ($i > -1) {
		$node_qbookValue = $elements->item($i); 
		$i--; 
		
		$val = '' ;
		if( $node_qbookValue->attributes->getNamedItem('src_inputvar') ) {
			$src_inputvar = $node_qbookValue->attributes->getNamedItem('src_inputvar')->value ;
			foreach( $RES['RES_inputvar'] as $inputvar_idx => $inputvar ) {
				if( $RES['RES_inputvar_lib'][$inputvar_idx] == $src_inputvar ) {
					$val = $inputvar ;
					break ;
				}
			}
		} elseif( $node_qbookValue->attributes->getNamedItem('src_value') ) {
			$src_value = $node_qbookValue->attributes->getNamedItem('src_value')->value ;
			foreach( $RES['RES_value'] as $value_idx => $value ) {
				if( $RES['RES_value_lib'][$value_idx] == $src_value ) {
					if( $RES['RES_value_mathRound'][$value_idx] > 0 ) {
						$value = round($value,$RES['RES_value_mathRound'][$value_idx]) ;
					} else {
						$value = round($value) ;
					}
					$val = $value ;
					break ;
				}
			}
		}
		$new_node = $doc->createTextNode($val) ;
		$node_qbookValue->parentNode->replaceChild($new_node,$node_qbookValue) ;
	}
	
	
	return array('success'=>true, 'disable_charts'=>true, 'html'=>$doc->saveHTML() ) ;
}
function paracrm_queries_qbookTransaction_resGet( $post_data, &$arr_saisie )
{
	$transaction_id = $post_data['_transaction_id'] ;
	$RES = $_SESSION['transactions'][$transaction_id]['arr_RES'][$post_data['RES_id']] ;
	
	$tabs = array() ;
	if( count($RES['RES_inputvar']) > 0 ) {
		$data = array() ;
		foreach( $RES['RES_inputvar'] as $inputvar_idx => $inputvar ) {
			$data[] = array('lib'=>$RES['RES_inputvar_lib'][$inputvar_idx],'value'=>$inputvar) ;
		}
		$tab = array() ;
		$tab['tab_title'] = '_Input_Vars_' ;
		$tab['columns'] = array() ;
		$tab['columns'][] = array('dataIndex'=>'lib','dataType'=>'string','text'=>'Var name','is_bold'=>true) ;
		$tab['columns'][] = array('dataIndex'=>'value','dataType'=>'string','text'=>'Eval') ;
		$tab['data'] = $data ;
		$tabs[] = $tab ;
	}
	foreach( $RES['RES_qobj'] as $qobj_idx => $RES_q ) {
		if( count($RES_q['RES_labels']) != 1 ) {
			continue ;
		}
		$tab = array() ;
		$tab['tab_title'] =  $arr_saisie['arr_qobj'][$qobj_idx]['qobj_lib'] ;
		$tab['cfg_doTreeview'] = ($RES['RES_titles']['cfg_doTreeview'] == TRUE) ;
		switch( $arr_saisie['arr_qobj'][$qobj_idx]['target_q_type'] ) {
			case 'query' :
				$tab = $tab + paracrm_queries_paginate_getGrid( $RES_q, 0 ) ;
				if( !$tab['data'] ) {
					continue 2 ;
				}
				if( $tab['cfg_doTreeview'] ) {
					$tab['data_root'] = paracrm_queries_paginate_buildTree( $tab['data'] ) ;
				}
				$t_chartCfg = paracrm_queries_charts_cfgLoad('query',$arr_saisie['arr_qobj'][$qobj_idx]['target_query_id']) ;
				break ;
				
			case 'qmerge' :
				$tab = $tab + paracrm_queries_mpaginate_getGrid( $RES_q, 0 ) ;
				if( !$tab['data'] ) {
					continue 2 ;
				}
				if( $tab['cfg_doTreeview'] ) {
					$tab['data_root'] = paracrm_queries_mpaginate_buildTree( $tab['data'] ) ;
				}
				$t_chartCfg = paracrm_queries_charts_cfgLoad('qmerge',$arr_saisie['arr_qobj'][$qobj_idx]['target_qmerge_id']) ;
				break ;
		}
		if( $t_chartCfg ) {
			if( $mixed_queryResultChartModel = paracrm_queries_charts_getMixed($t_chartCfg) ) {
				$tab['RESchart_static'] = paracrm_queries_charts_getResChart( $RES_q, $mixed_queryResultChartModel ) ;
			}
		}
		$tabs[] = $tab ;
	}
	if( count($RES['RES_value']) > 0 ) {
		$data = array() ;
		foreach( $RES['RES_value'] as $value_idx => $value ) {
			if( $RES['RES_value_mathRound'][$value_idx] > 0 ) {
				$value = round($value,$RES['RES_value_mathRound'][$value_idx]) ;
			} else {
				$value = round($value) ;
			}
			$data[] = array('lib'=>$RES['RES_value_lib'][$value_idx],'value'=>$value) ;
		}
		$tab = array() ;
		$tab['tab_title'] = '_Out_Values_' ;
		$tab['columns'] = array() ;
		$tab['columns'][] = array('dataIndex'=>'lib','dataType'=>'string','text'=>'Value name','is_bold'=>true) ;
		$tab['columns'][] = array('dataIndex'=>'value','dataType'=>'string','text'=>'Eval') ;
		$tab['data'] = $data ;
		$tabs[] = $tab ;
	}
	return array('success'=>true,'disable_charts'=>true,'tabs'=>$tabs) ;
}


function paracrm_queries_qbookTransaction_save( $post_data , &$arr_saisie )
{
	global $_opDB ;
	
	if( !Auth_Manager::getInstance()->auth_query_sdomain_action(
		Auth_Manager::sdomain_getCurrent(),
		'queries',
		NULL,
		$write=true
	)) {
			return Auth_Manager::auth_getDenialResponse() ;
	}
	
	if( $post_data['_subaction'] == 'save' )
	{
		if( !$arr_saisie['qbook_id'] )
			return array('success'=>false) ;
		
		return paracrm_queries_qbookTransaction_saveFields( $arr_saisie, $arr_saisie['qbook_id'] ) ;
	}

	if( $post_data['_subaction'] == 'saveas' )
	{
		$arr_ins = array() ;
		$arr_ins['qbook_name'] = $post_data['qbook_name'] ;
		$_opDB->insert('qbook',$arr_ins) ;
		
		$arr_saisie['qbook_id'] = $_opDB->insert_id() ;
		
		return paracrm_queries_qbookTransaction_saveFields( $arr_saisie, $arr_saisie['qbook_id'] ) ;
	}
	
	
	if( $post_data['_subaction'] == 'delete' )
	{
		if( !$arr_saisie['qbook_id'] )
			return array('success'=>false) ;
		
		$tables = array() ;
		$tables[] = 'qbook' ;
		$tables[] = 'qbook_inputvar' ;
		$tables[] = 'qbook_inputvar_date' ;
		$tables[] = 'qbook_qobj' ;
		$tables[] = 'qbook_qobj_field' ;
		$tables[] = 'qbook_value' ;
		$tables[] = 'qbook_value_symbol' ;
		$tables[] = 'qbook_value_saveto' ;
		foreach( $tables as $dbtab )
		{
			$query = "DELETE FROM $dbtab WHERE qbook_id='{$arr_saisie['qbook_id']}'" ;
			$_opDB->query($query) ;
		}
		
		return array('success'=>true) ;
	}
}





function paracrm_queries_qbookTransaction_loadFields( &$arr_saisie , $qbook_id )
{
	global $_opDB ;
	
	$arr_saisie['arr_inputvar'] = array() ;
	$query = "SELECT * FROM qbook_inputvar WHERE qbook_id='$qbook_id' ORDER BY qbook_inputvar_ssid" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$query = "SELECT * FROM qbook_inputvar_date
					WHERE qbook_id='$qbook_id' AND qbook_inputvar_ssid='{$arr['qbook_inputvar_ssid']}'" ;
		$result2 = $_opDB->query($query) ;
		if( ($arr_date = $_opDB->fetch_assoc($result2)) != FALSE )
		{
			unset($arr_date['qbook_id']) ;
			unset($arr_date['qbook_inputvar_ssid']) ;
			$arr += $arr_date ;
		}
	
		unset($arr['qbook_id']) ;
		unset($arr['qbook_inputvar_ssid']) ;
		$arr_saisie['arr_inputvar'][] = $arr ;
	}
	
	$arr_saisie['arr_qobj'] = array() ;
	$query = "SELECT * FROM qbook_qobj WHERE qbook_id='$qbook_id' ORDER BY qbook_qobj_ssid" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$arr['qobj_fields'] = array() ;
		$query = "SELECT * FROM qbook_qobj_field 
					WHERE qbook_id='$qbook_id' AND qbook_qobj_ssid='{$arr['qbook_qobj_ssid']}' ORDER BY qbook_qobj_ssid" ;
		$result2 = $_opDB->query($query) ;
		while( ($arr_field = $_opDB->fetch_assoc($result2)) != FALSE )
		{
			unset($arr_field['qbook_id']) ;
			unset($arr_field['qbook_qobj_ssid']) ;
			$arr['qobj_fields'][] = $arr_field ;
		}
	
		unset($arr['qbook_id']) ;
		unset($arr['qbook_qobj_ssid']) ;
		$arr_saisie['arr_qobj'][] = $arr ;
	}
	
	$arr_saisie['arr_value'] = array() ;
	$query = "SELECT * FROM qbook_value WHERE qbook_id='$qbook_id' ORDER BY qbook_value_ssid" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$arr['math_expression'] = array() ;
		$query = "SELECT * FROM qbook_value_symbol 
					WHERE qbook_id='$qbook_id' AND qbook_value_ssid='{$arr['qbook_value_ssid']}'
					ORDER BY qbook_value_symbol_index" ;
		$result2 = $_opDB->query($query) ;
		while( ($arr_symbol = $_opDB->fetch_assoc($result2)) != FALSE )
		{
			unset($arr_symbol['qbook_id']) ;
			unset($arr_symbol['qbook_value_ssid']) ;
			unset($arr_symbol['qbook_value_symbol_index']) ;
			$arr['math_expression'][] = $arr_symbol ;
		}
	
		$arr['saveto'] = array() ;
		$query = "SELECT * FROM qbook_value_saveto 
					WHERE qbook_id='$qbook_id' AND qbook_value_ssid='{$arr['qbook_value_ssid']}'
					ORDER BY qbook_value_saveto_index" ;
		$result2 = $_opDB->query($query) ;
		while( ($arr_saveto = $_opDB->fetch_assoc($result2)) != FALSE )
		{
			unset($arr_saveto['qbook_id']) ;
			unset($arr_saveto['qbook_value_ssid']) ;
			unset($arr_saveto['qbook_value_saveto_index']) ;
			$arr['saveto'][] = $arr_saveto ;
		}
	
		unset($arr['qbook_id']) ;
		unset($arr['qbook_value_ssid']) ;
		$arr_saisie['arr_value'][] = $arr ;
	}
	
	return ;
}
function paracrm_queries_qbookTransaction_saveFields( &$arr_saisie , $qbook_id )
{
	global $_opDB ;
	
	
	$arr_update = array() ;
	$arr_update['backend_file_code'] = $arr_saisie['backend_file_code'] ;
	$arr_cond = array() ;
	$arr_cond['qbook_id'] = $arr_saisie['qbook_id'] ;
	$_opDB->update('qbook',$arr_update,$arr_cond) ;
	
	
	$tables = array() ;
	$tables[] = 'qbook_inputvar' ;
	$tables[] = 'qbook_inputvar_date' ;
	$tables[] = 'qbook_qobj' ;
	$tables[] = 'qbook_qobj_field' ;
	$tables[] = 'qbook_value' ;
	$tables[] = 'qbook_value_symbol' ;
	$tables[] = 'qbook_value_saveto' ;
	foreach( $tables as $dbtab )
	{
		$query = "DELETE FROM $dbtab WHERE qbook_id='$qbook_id'" ;
		$_opDB->query($query) ;
	}
	
	
	$cnt = 0 ;
	$inputvar = array() ;
	$inputvar[] = 'inputvar_lib' ;
	$inputvar[] = 'inputvar_type' ;
	$inputvar[] = 'inputvar_linktype' ;
	$inputvar[] = 'inputvar_linkbible' ;
	$inputvar[] = 'src_backend_is_on' ;
	$inputvar[] = 'src_backend_file_code' ;
	$inputvar[] = 'src_backend_file_field_code' ;
	$inputvar_date = array() ;
	$inputvar_date[] = 'date_align_is_on' ;
	$inputvar_date[] = 'date_align_segment_type' ;
	$inputvar_date[] = 'date_align_direction_end' ;
	$inputvar_date[] = 'date_calc_is_on' ;
	$inputvar_date[] = 'date_calc_segment_type' ;
	$inputvar_date[] = 'date_calc_segment_count' ;
	foreach( $arr_saisie['arr_inputvar'] as $field_inputvar ) {
		$cnt++ ;
	
		$arr_ins = array() ;
		$arr_ins['qbook_id'] = $qbook_id ;
		$arr_ins['qbook_inputvar_ssid'] = $cnt ;
		foreach( $inputvar as $w )
		{
			$arr_ins[$w] = $field_inputvar[$w] ;
		}
		$_opDB->insert('qbook_inputvar',$arr_ins) ;
		
		if( $field_inputvar['inputvar_type'] == 'date' ) {
			$arr_ins = array() ;
			$arr_ins['qbook_id'] = $qbook_id ;
			$arr_ins['qbook_inputvar_ssid'] = $cnt ;
			foreach( $inputvar_date as $w )
			{
				$arr_ins[$w] = $field_inputvar[$w] ;
			}
			$_opDB->insert('qbook_inputvar_date',$arr_ins) ;
		}
	}
	
	
	$cnt = 0 ;
	$qobj = array() ;
	$qobj[] = 'qobj_lib' ;
	$qobj[] = 'target_q_type' ;
	$qobj[] = 'target_query_id' ;
	$qobj[] = 'target_qmerge_id' ;
	foreach( $arr_saisie['arr_qobj'] as $field_qobj )
	{
		$cnt++ ;
	
		$arr_ins = array() ;
		$arr_ins['qbook_id'] = $qbook_id ;
		$arr_ins['qbook_qobj_ssid'] = $cnt ;
		foreach( $qobj as $w )
		{
			$arr_ins[$w] = $field_qobj[$w] ;
		}
		$_opDB->insert('qbook_qobj',$arr_ins) ;
		
		
		$scnt = 0 ;
		$qobj_field = array() ;
		$qobj_field[] = 'target_query_wherefield_idx' ;
		$qobj_field[] = 'target_qmerge_mwherefield_idx' ;
		$qobj_field[] = 'target_subfield' ;
		$qobj_field[] = 'field_type' ;
		$qobj_field[] = 'field_linkbible' ;
		$qobj_field[] = 'src_inputvar_idx' ;
		foreach( $field_qobj['qobj_fields'] as $field_qobj_field )
		{
			$scnt++ ;
		
			$arr_ins = array() ;
			$arr_ins['qbook_id'] = $qbook_id ;
			$arr_ins['qbook_qobj_ssid'] = $cnt ;
			foreach( $qobj_field as $s )
			{
				$arr_ins[$s] = $field_qobj_field[$s] ;
			}
			$_opDB->insert('qbook_qobj_field',$arr_ins) ;
		}
	}


	$cnt = 0 ;
	$value = array() ;
	$value[] = 'select_lib' ;
	$value[] = 'math_round' ;
	foreach( $arr_saisie['arr_value'] as $field_value )
	{
		$cnt++ ;
	
		$arr_ins = array() ;
		$arr_ins['qbook_id'] = $qbook_id ;
		$arr_ins['qbook_value_ssid'] = $cnt ;
		foreach( $value as $w )
		{
			$arr_ins[$w] = $field_value[$w] ;
		}
		$_opDB->insert('qbook_value',$arr_ins) ;
		
		
		$scnt = 0 ;
		$symbol = array() ;
		$symbol[] = 'math_operation' ;
		$symbol[] = 'math_parenthese_in' ;
		$symbol[] = 'math_operand_inputvar_idx' ;
		$symbol[] = 'math_operand_qobj_idx' ;
		$symbol[] = 'math_operand_selectfield_idx' ;
		$symbol[] = 'math_operand_mselectfield_idx' ;
		$symbol[] = 'math_staticvalue' ;
		$symbol[] = 'math_parenthese_out' ;
		foreach( $field_value['math_expression'] as $field_sequence )
		{
			$scnt++ ;
		
			$arr_ins = array() ;
			$arr_ins['qbook_id'] = $qbook_id ;
			$arr_ins['qbook_value_ssid'] = $cnt ;
			$arr_ins['qbook_value_symbol_index'] = $scnt ;
			foreach( $symbol as $s )
			{
				$arr_ins[$s] = $field_sequence[$s] ;
			}
			$_opDB->insert('qbook_value_symbol',$arr_ins) ;
		}
		
		
		$scnt = 0 ;
		$saveto = array() ;
		$saveto[] = 'target_backend_file_code' ;
		$saveto[] = 'target_backend_file_field_code' ;
		foreach( $field_value['saveto'] as $field_saveto )
		{
			$scnt++ ;
		
			$arr_ins = array() ;
			$arr_ins['qbook_id'] = $qbook_id ;
			$arr_ins['qbook_value_ssid'] = $cnt ;
			$arr_ins['qbook_value_saveto_index'] = $scnt ;
			foreach( $saveto as $s )
			{
				$arr_ins[$s] = $field_saveto[$s] ;
			}
			$_opDB->insert('qbook_value_saveto',$arr_ins) ;
		}
	}


	return array('success'=>true,'qbook_id'=>$qbook_id) ;
}

function paracrm_queries_qbookTransaction_exportJson( $output_json, $arr_saisie=NULL )
{
	if( !$output_json['success'] ) {
		die() ;
	}
	
	$qbook_name = "unnamed" ;
	if( $arr_saisie && $arr_saisie['qbook_name'] ) {
		$qbook_name = $arr_saisie['qbook_name'] ;
	}
	$qbook_name=str_replace(' ','_',preg_replace("/[^a-zA-Z0-9\s]/", "", $qbook_name)) ;
	
	if( $output_json['html'] ) {
		if( $output_pdf = media_pdf_html2pdf($output_json['html']) ) {
			$filename = 'OP5report_Qbook_'.$qbook_name.'_'.time().'.pdf' ;
			header("Content-Type: application/force-download; name=\"$filename\""); 
			header("Content-Disposition: attachment; filename=\"$filename\""); 
			echo $output_pdf ;
			die() ;
		}
		$filename = 'OP5report_Qbook_'.$qbook_name.'_'.time().'.html' ;
		header("Content-Type: application/force-download; name=\"$filename\""); 
		header("Content-Disposition: attachment; filename=\"$filename\""); 
		echo $output_json['html'] ;
		die() ;
	}
	
	if( $output_json['tabs'] ) {
		$objPHPExcel = paracrm_queries_xls_build( $output_json['tabs'] ) ;
		if( !$objPHPExcel ) {
			die() ;
		}
		
		$tmpfilename = tempnam( sys_get_temp_dir(), "FOO");
		$objWriter = PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel2007');
		$objWriter->save($tmpfilename);
		$objPHPExcel->disconnectWorksheets();
		unset($objPHPExcel) ;
		
		$filename = 'OP5report_Qbook_'.$qbook_name.'_'.time().'.xlsx' ;
		header("Content-Type: application/force-download; name=\"$filename\""); 
		header("Content-Disposition: attachment; filename=\"$filename\""); 
		readfile($tmpfilename) ;
		unlink($tmpfilename) ;
		die() ;
	}
	
	die() ;
}


?>