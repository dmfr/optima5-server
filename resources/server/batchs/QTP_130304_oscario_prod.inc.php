<?php

function update_CDELIG_from_salesDb( $db_name ) {
	global $_opDB ;
	
	$map_srcId_dstId = array() ;
	$map_cdeId_dstIds = array() ;
	$query = "SELECT filerecord_id, field_CDE_ID FROM view_file_CDE_LOG" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		if( !$map_cdeId_srcIds[$arr[1]] ) {
			$map_cdeId_dstIds[$arr[1]] = array() ;
		}
		$map_cdeId_dstIds[$arr[1]][] = $arr[0] ;
	}
	
	$query = "SELECT cde.*
		, bs.field_STATUS_TXT
		, inv.field_CALC_AMOUNT_NOVAT as field_INV_AMOUNT_NOVAT, inv.field_CALC_AMOUNT_FINAL as field_INV_AMOUNT_FINAL
				FROM {$db_name}.view_file_CDE cde
				INNER JOIN {$db_name}.view_bible_CUSTOMER_entry bc ON bc.entry_key = cde.field_CLI_LINK
				LEFT OUTER JOIN {$db_name}.view_bible_CDE_STATUS_entry bs ON bs.entry_key = cde.field_STATUS
				LEFT OUTER JOIN {$db_name}.view_file_INV inv ON inv.filerecord_id = cde.field_LINK_INV_FILE_ID" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$cde_id = $arr['field_CDE_ID'] ;
		$dst_filerecord_id = ( $map_cdeId_dstIds[$cde_id] ? array_shift($map_cdeId_dstIds[$cde_id]) : NULL ) ;
		
		$arr_ins = $arr ;
		unset($arr_ins['filerecord_id']) ;
		if( $dst_filerecord_id ) {
			paracrm_lib_data_updateRecord_file( 'CDE_LOG' , $arr_ins, $dst_filerecord_id ) ;
		} else {
			$dst_filerecord_id = paracrm_lib_data_insertRecord_file( 'CDE_LOG' , 0, $arr_ins ) ;
		}
		$map_srcId_dstId[$arr['filerecord_id']] = $dst_filerecord_id ;
	}
	
	$query = "SELECT cdelig.filerecord_parent_id
			,sum( IF(cdelig.field_STATUS_IS_SHIP='1',cdelig.field_QTE_SHIP,cdelig.field_QTE_ORDER) / prod.field_QTE_SKU )
				as field_CALC_COUNT_UC
			,sum( IF(cdelig.field_STATUS_IS_SHIP='1',cdelig.field_QTE_SHIP,cdelig.field_QTE_ORDER) / prod.field_EQ_KG )
				as field_CALC_KG
				FROM {$db_name}.view_file_CDE_LIG cdelig
				INNER JOIN {$db_name}.view_bible_PRODUCT_entry prod ON prod.entry_key = cdelig.field_PROD_REF
				GROUP BY cdelig.filerecord_parent_id" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$src_filerecord_id = $arr['filerecord_parent_id'] ;
		$dst_filerecord_id = $map_srcId_dstId[$src_filerecord_id] ;
		if( !$dst_filerecord_id ) {
			continue ;
		}
		
		$arr_ins = $arr ;
		unset($arr_ins['filerecord_parent_id']) ;
		
		paracrm_lib_data_updateRecord_file( 'CDE_LOG' , $arr_ins, $dst_filerecord_id ) ;
	}
	
	
	$map_dstId_ligIds = array() ;
	
	$query = "SELECT filerecord_parent_id, filerecord_id FROM view_file_CDE_LOG_LIG" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		if( !isset($map_dstId_ligIds[$arr[0]]) ) {
			$map_dstId_ligIds[$arr[0]] = array() ;
		}
		$map_dstId_ligIds[$arr[0]][] = $arr[1] ;
	}
	
	$query = "SELECT cdelig.*
				FROM {$db_name}.view_file_CDE_LIG cdelig" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$src_filerecord_id = $arr['filerecord_parent_id'] ;
		$dst_filerecord_id = $map_srcId_dstId[$src_filerecord_id] ;
		if( !$dst_filerecord_id ) {
			continue ;
		}
		
		$pool_ligIds =& $map_dstId_ligIds[$dst_filerecord_id] ;
		if( !is_array($pool_ligIds) ) {
			$pool_ligIds = array() ;
		}
		
		$arr_ins = $arr ;
		if( count($pool_ligIds) > 0 ) {
			$reuse_ligId = array_shift($pool_ligIds) ;
			paracrm_lib_data_updateRecord_file( 'CDE_LOG_LIG' , $arr_ins, $reuse_ligId ) ;
		} else {
			$dst_filerecord_id = paracrm_lib_data_insertRecord_file( 'CDE_LOG_LIG' , $dst_filerecord_id, $arr_ins ) ;
		}
		
		unset($pool_ligIds) ;
	}
	foreach( $map_dstId_ligIds as $ligIds ) {
		foreach( $ligIds as $orphan_ligId ) {
			paracrm_lib_data_deleteRecord_file( 'CDE_LOG_LIG' , $orphan_ligId ) ;
		}
	}
	
	return NULL ;
}
function update_CLILOG_from_salesDb( $db_name ) {
	global $_opDB ;
	
	$query = "SELECT entry_key, field_FACTOR_ID
				FROM {$db_name}.view_bible_CUSTOMER_entry" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$cli_EAN = $arr['entry_key'] ;
		
		$arr_insert = array() ;
		$arr_insert['field_RACX_ID'] = ($arr['field_FACTOR_ID']?$arr['field_FACTOR_ID']:$arr['entry_key']) ;
		if( TRUE ) {
			$arr_cond = array() ;
			$arr_cond['entry_key'] = $cli_EAN ;
			$_opDB->update('view_bible_CLI_LOG_entry',$arr_insert,$arr_cond) ;
		}
	}
	
	
	$query = "select cde.filerecord_id, cli.field_FORCE_PFF, s1.field_STORELINK, cde.field_CLI_LINK, s1.entry_key
from  `op5_bluephoenix_prod_fdv`.`view_file_CDE_LOG` cde 
 join  `op5_bluephoenix_prod_fdv`.`view_bible_CLI_LOG_entry` cli ON cli.entry_key = cde.field_CLI_LINK
left outer join  `op5_bluephoenix_prod_fdv`.`view_bible_STORE_entry` s1 ON s1.entry_key = cli.field_RACX_ID" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$cde_filerecordId = $arr[0] ;
		$force_PFF = $arr[1] ;
		$cli_PFF = $arr[2] ;
		$cli_link = $arr[3] ;
		$store_entryKey = $arr[4] ;
		
		$PFF = NULL ;
		if( $force_PFF ) {
			$PFF = $force_PFF ;
		} elseif( $cli_PFF ) {
			$PFF = $cli_PFF ;
		}
		
		$PFF = preg_replace("/[^a-zA-Z0-9]/", "", $PFF) ;
		
		if( $PFF ) {
			$json_PFF = json_encode(array($PFF)) ;
			$query = "UPDATE view_bible_CLI_LOG_entry set field_LINK_PFF='{$json_PFF}' WHERE entry_key='{$cli_link}'" ;
			$_opDB->query($query) ;
			
			$query = "UPDATE view_file_CDE_LOG set field_LINK_PFF='{$PFF}' WHERE filerecord_id='{$cde_filerecordId}'" ;
			$_opDB->query($query) ;
		}
		if( $store_entryKey ) {
			$query = "UPDATE view_file_CDE_LOG set field_LINK_STORE='{$store_entryKey}' WHERE filerecord_id='{$cde_filerecordId}'" ;
			$_opDB->query($query) ;
		}
	}
}


function update_PRODLOG_from_oscario_prod( $TAB ) {
	global $_opDB ;
	
	if( !is_array($TAB) ) {
		return ;
	}
	
	$query = "LOCK TABLES view_bible_PRODLOG_tree WRITE,view_bible_PRODLOG_entry WRITE" ;
	$_opDB->query($query) ;
	
	$arr_crm_prodgroup = array() ;
	$query = "SELECT distinct treenode_key FROM view_bible_PRODLOG_tree WHERE treenode_key<>'Z_OFF'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$arr_crm_prodgroup[] = $arr[0] ;
	}
	
	$arr_crm_prodgroup_lib = array() ;
	$query = "SELECT distinct field_PRODLINEDESC FROM view_bible_PRODLOG_tree WHERE treenode_parent_key=''" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$arr_crm_prodgroup_lib[] = $arr[0] ;
	}

	$arr_crm_prodref = array() ;
	$query = "SELECT entry_key FROM view_bible_PRODLOG_entry" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$arr_crm_prodref[] = $arr[0] ;
	}

	$arr_oscario_prodref = array();
	foreach( $TAB as $arr ) {
		$prod_ref = $arr['prod_ref'] ;
		$arr_oscario_prodref[] = $prod_ref ;
		
		if( $arr['prodcycle_is_off']!='O' && in_array($arr['prodgroup_code'],$arr_crm_prodgroup) ) {
			$arr_ins = array() ;
			$arr_ins['treenode_key'] = $arr['prod_ref'] ;
			$arr_ins['treenode_parent_key'] = $arr['prodgroup_code'] ;
			$arr_ins['field_PRODLINE'] = $arr['prod_ref'] ;
			$arr_ins['field_PRODLINEDESC'] = str_replace($arr_crm_prodgroup_lib,'',$arr['prod_lib']) ;
			if( !in_array($arr['prod_ref'],$arr_crm_prodgroup) ) {
				$_opDB->insert('view_bible_PRODLOG_tree',$arr_ins) ;
				$arr_crm_prodgroup[] = $arr['prod_ref'] ;
			} else {
				$arr_cond = array() ;
				$arr_cond['treenode_key'] = $prod_ref ;
				$_opDB->update('view_bible_PRODLOG_tree',$arr_ins,$arr_cond) ;
			}
		}
		
		$arr_insert = array() ;
		$arr_insert['entry_key'] = $arr['prod_ref'] ;
		$arr_insert['treenode_key'] = (in_array($arr['prod_ref'],$arr_crm_prodgroup) && $arr['prodcycle_is_off']!='O') ? $arr['prod_ref'] : 'Z_OFF' ;
		$arr_insert['field_PROD_REF'] = $arr['prod_ref'] ;
		$arr_insert['field_PROD_LIB'] = $arr['prod_lib'] ;
		$arr_insert['field_UVC_EAN'] = $arr['prod_gencod'] ;
		$arr_insert['field_UC_EAN'] = $arr['pcb_gencod'] ;
		$arr_insert['field_UC_PCB'] = $arr['pcb_qte_pack'] ;
		$arr_insert['field_EQ_UNIT'] = $arr['eq_ut'] ;
		$arr_insert['field_EQ_KG'] = $arr['eq_kg'] ;
		if( in_array($prod_ref,$arr_crm_prodref) ) {
			$arr_cond = array() ;
			$arr_cond['entry_key'] = $prod_ref ;
			$_opDB->update('view_bible_PRODLOG_entry',$arr_insert,$arr_cond) ;
		} else {
			$_opDB->insert('view_bible_PRODLOG_entry',$arr_insert) ;
		}
	}

	$query = "UPDATE view_bible_PRODLOG_entry SET treenode_key='Z_OFF' WHERE entry_key IN ".$_opDB->makeSQLlist(array_diff($arr_crm_prodref,$arr_oscario_prodref)) ;
	$_opDB->query($query) ;
	
	$query = "UNLOCK TABLES" ;
	$_opDB->query($query) ;
}

function update_CLILOG_from_oscario_cli( $TAB ) {
	global $_opDB ;
	
	if( !is_array($TAB) ) {
		return ;
	}
	
	$query = "LOCK TABLES view_bible_CLI_LOG_tree WRITE,view_bible_CLI_LOG_entry WRITE" ;
	$_opDB->query($query) ;
	
	$arr_crm_cligroup = array() ;
	$query = "SELECT distinct treenode_key FROM view_bible_CLI_LOG_tree WHERE treenode_key<>'Z_OFF'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$arr_crm_cligroup[] = $arr[0] ;
	}
	
	$arr_crm_cli = array() ;
	$query = "SELECT entry_key FROM view_bible_CLI_LOG_entry" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$arr_crm_cli[] = $arr[0] ;
	}

	$arr_oscario_cli = array();
	foreach( $TAB as $arr ) {
		$cli_EAN = $arr['cli_EAN'] ;
		if( !$cli_EAN ) {
			continue ;
		}
		$arr_oscario_cli[] = $cli_EAN ;
		
		if( trim($arr['cligroup_code']) && !in_array($arr['cligroup_code'],$arr_crm_cligroup) ) {
			$arr_ins = array() ;
			$arr_ins['treenode_key'] = $arr['cligroup_code'] ;
			$arr_ins['treenode_parent_key'] = '' ;
			$arr_ins['field_CLIGROUP'] = $arr['cligroup_code'] ;
			$_opDB->insert('view_bible_CLI_LOG_tree',$arr_ins) ;
			$arr_crm_cligroup[] = $arr['cligroup_code'] ;
		}
		
		$arr_insert = array() ;
		$arr_insert['entry_key'] = $arr['cli_EAN'] ;
		//$arr_insert['treenode_key'] = $arr['cligroup_code'] ;
		$arr_insert['field_CLI_ID'] = ($arr['cli_FACTOR_ID']?$arr['cli_EAN']:$arr['cli_EAN']) ;
		$arr_insert['field_CLI_TXT'] = $arr['cli_lib'] ;
		if( in_array($cli_EAN,$arr_crm_cli) ) {
			$arr_cond = array() ;
			$arr_cond['entry_key'] = $cli_EAN ;
			$_opDB->update('view_bible_CLI_LOG_entry',$arr_insert,$arr_cond) ;
		} else {
			$_opDB->insert('view_bible_CLI_LOG_entry',$arr_insert) ;
		}
		
		$query = "UPDATE view_bible_CLI_LOG_entry SET treenode_key='{$arr['cligroup_code']}' WHERE entry_key='{$arr['cli_EAN']}' AND treenode_key=''" ;
		$_opDB->query($query) ;
	}

	$query = "UNLOCK TABLES" ;
	$_opDB->query($query) ;
}



?>
