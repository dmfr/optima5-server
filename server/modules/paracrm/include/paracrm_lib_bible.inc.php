<?php

$GLOBALS['cache_bibleHelper'] = NULL ;

function paracrm_lib_bible_buildCaches()
{
	if( is_array($GLOBALS['cache_bibleHelper']) )
		return ;
	
	global $_opDB ;
	
	
	$GLOBALS['cache_bibleHelper'] = array() ;

	$arr_bibles = array() ;
	$query = "SELECT bible_code FROM define_bible" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$arr_bibles[] = $arr['bible_code'] ;
	
	}
	
	$arr_bible_trees = array() ;
	
	foreach( $arr_bibles as $bible_code )
	{
		// ***************** Liens de chaque bible vers bible étrangère ****************
		$GLOBALS['cache_bibleHelper']['mapForeignLinks'] ;
		$mapForeignLinks = array() ;
		$query = "SELECT * FROM define_bible_tree WHERE bible_code='$bible_code' ORDER BY tree_field_index" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
		{
			if( $arr['tree_field_type'] == 'link' )
			{
				$mkey = 'tree%'.$arr['tree_field_code'] ;
				$mapForeignLinks[$mkey] = $arr['tree_field_linkbible'] ;
			}
		}
		$query = "SELECT * FROM define_bible_entry WHERE bible_code='$bible_code' ORDER BY entry_field_index" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
		{
			if( $arr['entry_field_type'] == 'link' )
			{
				$mkey = 'entry%'.$arr['entry_field_code'] ;
				$mapForeignLinks[$mkey] = $arr['entry_field_linkbible'] ;
			}
		}
		$GLOBALS['cache_bibleHelper']['mapForeignLinks'][$bible_code] = $mapForeignLinks ;
	
	
	
	
	
		// ************** Création des arbres de nomenclature TREE pour la bible ****************
		$view_tree = 'view_bible_'.$bible_code.'_tree' ;
		$query = "SELECT treenode_key, treenode_parent_key FROM $view_tree" ;
		$result = $_opDB->query($query) ;
		$raw_records = array() ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
		{
			$record = array() ;
			$record['treenode_key'] = $arr['treenode_key'] ;
			$record['treenode_parent_key'] = $arr['treenode_parent_key'] ;
			$raw_records[] = $record ;
		}
		$tree = new GenericTree("&") ;
		do {
			$nb_pushed_this_pass = 0 ;
			foreach( $raw_records as $mid => $record )
			{
				if( $record['treenode_parent_key'] == '' )
					$record['treenode_parent_key'] = '&' ;
				if( $record['treenode_key'] == '' )
					continue ;
			
				$treenode_parent_key = $record['treenode_parent_key'] ;
				$treenode_key = $record['treenode_key'] ;
				
				if( $tree->getTree( $treenode_parent_key ) != NULL )
				{
					$parent_node = $tree->getTree( $treenode_parent_key ) ;
					$parent_node->addLeaf( $treenode_key ) ;
					unset($raw_records[$mid]) ;
					
					$nb_pushed_this_pass++ ;
					$nb_pushed++ ;
				}
				if( count($raw_records) == 0 )
					break ;
			}
		}
		while( $nb_pushed_this_pass > 0 ) ;
		$GLOBALS['cache_bibleHelper']['bibleTreemaps'][$bible_code] = $tree ;
		
		
		
		
		
		
		
		
		
	}
}


function paracrm_lib_bible_buildRelationships()
{
	if( isset($GLOBALS['cache_bibleHelper']['relationships_is_built']) )
		return ;

	global $_opDB ;
	paracrm_lib_bible_buildCaches() ;

	$query = "DROP TABLE IF EXISTS cache_bible_tree_field_linkmembers" ;
	$_opDB->query($query) ;
	$query = "DROP TABLE IF EXISTS cache_bible_entry_field_linkmembers" ;
	$_opDB->query($query) ;
	
   $query = "CREATE TEMPORARY TABLE IF NOT EXISTS "
                    . "cache_bible_entry_field_linkmembers" . " ("
                    . "bible_code" . " VARCHAR(50), "
                    . "entry_key" . " VARCHAR(100),"
                    . "entry_field_code" . " VARCHAR(100),"
                    . "entry_field_linkmember_index" . " INTEGER,"
                    . "entry_field_linkmember_treenodekey" . " VARCHAR(100),"
                    . "PRIMARY KEY( bible_code, entry_key,entry_field_code,entry_field_linkmember_index)"
                    . ");";
	$_opDB->query($query) ;
	
   $query = "CREATE TEMPORARY TABLE IF NOT EXISTS "
                    . "cache_bible_tree_field_linkmembers" . " ("
                    . "bible_code" . " VARCHAR(50), "
                    . "treenode_key" . " VARCHAR(100),"
                    . "treenode_field_code" . " VARCHAR(100),"
                    . "treenode_field_linkmember_index" . " INTEGER,"
                    . "treenode_field_linkmember_treenodekey" . " VARCHAR(100),"
                    . "PRIMARY KEY( bible_code, treenode_key,treenode_field_code,treenode_field_linkmember_index)"
                    . ");";
	$_opDB->query($query) ;
	
	
	
	
	foreach( $GLOBALS['cache_bibleHelper']['mapForeignLinks'] as $bible_code => $mapForeignLinks )
	{
		
		// Pour chaque bible, init de la collection initiale + walk de l'arbre
		$mCurrentNodeLinks[$tfield] = array($foreign_treenode_key) ; // exemple
		$mCurrentNodeLinks = array() ;
		foreach( $mapForeignLinks as $tfield => $target_bible )
		{
			$mCurrentNodeLinks[$tfield] = array() ;
			// note : on pourrait prendre '&' (collection complète par défaut )
		}
	
		paracrm_lib_bible_buildRelationships_walkTree( $bible_code, 
																	$curTreeNode = $GLOBALS['cache_bibleHelper']['bibleTreemaps'][$bible_code], 
																	$mCurrentNodeLinks ) ;
																	
		paracrm_lib_bible_buildRelationships_walkEntries( $bible_code ) ;
	}
	
	$GLOBALS['cache_bibleHelper']['relationships_is_built'] = TRUE ;
}
function paracrm_lib_bible_buildRelationships_walkTree( $bible_code, $curTreeNode, $mParentNodeLinks )
{
	global $_opDB ;
	
	$view_tree = 'view_bible_'.$bible_code.'_tree' ;
	
	$cur_treenodeKey = $curTreeNode->getHead() ;
	$mCurrentNodeLinks = array() ;
	
	$mapForeignLinks = $GLOBALS['cache_bibleHelper']['mapForeignLinks'][$bible_code] ;
	foreach( $mapForeignLinks as $tfield => $foreign_bible )
	{
		$ttmp = explode('%',$tfield) ;
		if( $ttmp[0] != 'tree' )
			continue ;
		
		$tree_field_code = $ttmp[1] ;
		
		$query = "SELECT field_{$tree_field_code} FROM $view_tree
					WHERE treenode_key='$cur_treenodeKey'" ;
		$json_foreignNodeLinks = $_opDB->query_uniqueValue($query) ;
		if( $json_foreignNodeLinks == NULL )
		{
			// -- on applique la collection parente
			$mCurrentNodeLinks[$tfield] = $mParentNodeLinks[$tfield] ;
		}
		else
		{
			$foreignTree = $GLOBALS['cache_bibleHelper']['bibleTreemaps'][$foreign_bible] ;
			if( !$foreignTree )
				continue ;
			$mCurrentNodeLinks[$tfield] = array() ;
			foreach( json_decode($json_foreignNodeLinks,true) as $foreignNodeLink )
			{
				$foreignNodeTree = $foreignTree->getTree($foreignNodeLink) ;
				if( $foreignNodeTree === NULL ) {
					continue ; // no bible treenode match for this foreign reference ( deleted ? )
				}
				
				$foreignNodeAllMembers = $foreignNodeTree->getAllMembers() ;
				
				$mCurrentNodeLinks[$tfield] = array_merge($mCurrentNodeLinks[$tfield],$foreignNodeAllMembers) ;
			}
		}
	}
	
	foreach( $mCurrentNodeLinks as $tfield => $arr_foreignNodeLinks )
	{
		$ttmp = explode('%',$tfield) ;
		if( $ttmp[0] != 'tree' )
			continue ;
		$tree_field_code = $ttmp[1] ;
		
		$arr_ins = array() ;
		$arr_ins['bible_code'] = $bible_code ;
		$arr_ins['treenode_key'] = $cur_treenodeKey ;
		$arr_ins['treenode_field_code'] = $tree_field_code ;
		$cnt = 0 ;
		foreach( $arr_foreignNodeLinks as $foreign_treenodeKey )
		{
			$cnt++ ;
			$arr_ins['treenode_field_linkmember_index'] = $cnt ;
			$arr_ins['treenode_field_linkmember_treenodekey'] = $foreign_treenodeKey ;
			$_opDB->insert('cache_bible_tree_field_linkmembers',$arr_ins) ;
		}
	}
	
	foreach( $curTreeNode->getLeafs() as $leafTreeNode )
	{
		paracrm_lib_bible_buildRelationships_walkTree( $bible_code, $leafTreeNode, $mCurrentNodeLinks ) ;
	}

}
function paracrm_lib_bible_buildRelationships_walkEntries( $bible_code )
{
	global $_opDB ;
	
	$view_tree = 'view_bible_'.$bible_code.'_entry' ;
	
	$mapForeignLinks = $GLOBALS['cache_bibleHelper']['mapForeignLinks'][$bible_code] ;
	foreach( $mapForeignLinks as $tfield => $foreign_bible )
	{
		$ttmp = explode('%',$tfield) ;
		if( $ttmp[0] != 'entry' )
			continue ;
		$entry_field_code = $ttmp[1] ;
		$view_field = 'field_'.$entry_field_code ;
		
		$foreignTree = $GLOBALS['cache_bibleHelper']['bibleTreemaps'][$foreign_bible] ;
		if( !$foreignTree )
			continue ;
		
		
		$query = "SELECT entry_key, {$view_field} FROM {$view_tree}" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
		{
			$cur_entryKey = $arr['entry_key'] ;
			$json_foreignNodeLinks = $arr[$view_field] ;
			if( $json_foreignNodeLinks == NULL )
				continue ;
			
				
				
			$arr_ins = array() ;
			$arr_ins['bible_code'] = $bible_code ;
			$arr_ins['entry_key'] = $cur_entryKey ;
			$arr_ins['entry_field_code'] = $entry_field_code ;
			$cnt = 0 ;
			foreach( json_decode($json_foreignNodeLinks,true) as $foreignNodeLink )
			{
				$foreignNodeTree = $foreignTree->getTree($foreignNodeLink) ;
				if( $foreignNodeTree === NULL ) {
					continue ; // no bible treenode match for this foreign reference ( deleted ? )
				}
				
				foreach( $foreignNodeTree->getAllMembers() as $foreign_treenodeKey )
				{
					$cnt++ ;
					$arr_ins['entry_field_linkmember_index'] = $cnt ;
					$arr_ins['entry_field_linkmember_treenodekey'] = $foreign_treenodeKey ;
					$_opDB->insert('cache_bible_entry_field_linkmembers',$arr_ins) ;
				}
			}
		}
	}
}





function paracrm_lib_bible_tree_getDepth( $bible_code, $treenode_key )
{

}
function paracrm_lib_bible_tree_getAllMembers( $bible_code, $treenode_key )
{

}
function paracrm_lib_bible_tree_getParent( $bible_code, $treenode_key )
{

}




function paracrm_lib_bible_queryBible( $bible_code, $mForeignEntries )
{
	paracrm_lib_bible_buildRelationships() ;
	global $_opDB ;
	
	$local_bibleCode = $bible_code ;

	$view_name_t = 'view_bible_'.$bible_code.'_tree' ;
	$view_name_e = 'view_bible_'.$bible_code.'_entry' ;
	$query = "SELECT e.* FROM $view_name_e e , $view_name_t t WHERE t.treenode_key=e.treenode_key" ;
	//$query.= " AND bible_code='$bible_code'" ;
	foreach( $mForeignEntries as $foreign_bibleCode => $foreign_entryKey )
	{
		$foreignBibleView = 'view_bible_'.$foreign_bibleCode.'_entry' ;
		$query_treenode = "SELECT treenode_key FROM {$foreignBibleView} WHERE entry_key='$foreign_entryKey'" ;
		if( $treenode_key = $_opDB->query_uniqueValue($query_treenode) )
		{
			$foreignEntry = array() ;
			$foreignEntry['bible_code'] = $foreign_bibleCode ;
			$foreignEntry['treenode_key'] = $treenode_key ;
			$foreignEntry['entry_key'] = $foreign_entryKey ;
		}
		else
		{
			continue ;
		}
	
	
		// condition locale ?  ex: req STORE (condition SALES)
		if( $tfield = array_search( $foreignEntry['bible_code'], $GLOBALS['cache_bibleHelper']['mapForeignLinks'][$local_bibleCode] ) )
		{
			$ttmp = explode('%',$tfield) ;
			$localTargetField = array() ;
			$localTargetField['record_type'] = $ttmp[0];
			$localTargetField['field_code'] = $ttmp[1];
			$localTargetField['link_bible'] = $foreignEntry['bible_code'] ;
		
			$query.= paracrm_lib_bible_queryBible_getConditionLocal($local_bibleCode,$localTargetField,$foreignEntry) ;
		}
		
		
		// condition étrangère ? ex: req PROD (condition STORE)
		if( $tfield = array_search( $local_bibleCode, $GLOBALS['cache_bibleHelper']['mapForeignLinks'][$foreignEntry['bible_code']] ) )
		{
			$ttmp = explode('%',$tfield) ;
			$foreignTargetField = array() ;
			$foreignTargetField['record_type'] = $ttmp[0];
			$foreignTargetField['field_code'] = $ttmp[1];
			$foreignTargetField['link_bible'] = $local_bibleCode ;
		
			$query.= paracrm_lib_bible_queryBible_getConditionForeign($local_bibleCode,$foreignTargetField,$foreignEntry) ;
		}
	}
	
	$arr_records = array() ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$arr_records[] = $arr ;
	}
	return $arr_records ;
}
function paracrm_lib_bible_queryBible_getConditionLocal($localBibleCode,$localTargetField,$foreignEntry)
{
	if( $localTargetField['link_bible'] != $foreignEntry['bible_code'] )
		return NULL ;
	
	$sb = '' ;
	$sb.= ' AND e.entry_key IN (' ;
		$sb.= "SELECT entry_key FROM" ;
		switch( $localTargetField['record_type'] )
		{
			case 'tree' :
				$sb.= " cache_bible_tree_field_linkmembers" ;
			break ;
			case 'entry' :
				$sb.= " cache_bible_entry_field_linkmembers" ;
			break ;
		}
		$sb.= " WHERE bible_code='$localBibleCode'" ;
		switch( $localTargetField['record_type'] )
		{
			case 'tree' :
				$sb.= " AND treenode_field_code='{$localTargetField['field_code']}'" ;
				$sb.= " AND treenode_field_linkmember_treenodekey='{$foreignEntry['treenode_key']}'" ;
			break ;
			case 'entry' :
				$sb.= " AND entry_field_code='{$localTargetField['field_code']}'" ;
				$sb.= " AND entry_field_linkmember_treenodekey='{$foreignEntry['treenode_key']}'" ;
			break ;
		}
	$sb.= ')' ;
	
	return $sb ;
}
function paracrm_lib_bible_queryBible_getConditionForeign($localBible,$foreignTargetField,$foreignEntry)
{
	if( $foreignTargetField['link_bible'] != $localBible )
		return NULL ;

	$sb.= ' AND e.treenode_key IN (' ;
		switch( $foreignTargetField['record_type'] )
		{
			case 'tree' :
			$sb.= "select treenode_field_linkmember_treenodekey FROM cache_bible_tree_field_linkmembers" ;
			$sb.= " WHERE bible_code='{$foreignEntry['bible_code']}' AND treenode_key='{$foreignEntry['treenode_key']}' AND treenode_field_code='{$foreignTargetField['field_code']}'" ;
			break ;
			case 'entry' :
			$sb.= "select entry_field_linkmember_treenodekey FROM cache_bible_entry_field_linkmembers" ;
			$sb.= " WHERE bible_code='{$foreignEntry['bible_code']}' AND entry_key='{$foreignEntry['entry_key']}' AND treenode_field_code='{$foreignTargetField['field_code']}'" ;
			break ;
		}
	$sb.= ')' ;

	return $sb ;
}






?>