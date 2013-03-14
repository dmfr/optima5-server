<?php

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



?>