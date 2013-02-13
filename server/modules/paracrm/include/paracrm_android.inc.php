<?php

function paracrm_android_getDbImageTimestamp($post_data=NULL)
{
	if( $post_data && ( !$post_data['__ANDROID_ID'] || !paracrm_lib_android_authDevice_ping($post_data['__ANDROID_ID'],$ping=true) ) ) {
		// disable MODE !
		return array('success'=>true,'timestamp'=>time()) ;
	}

	return array('success'=>true,'timestamp'=>strtotime(date('Y-m-d'))) ;
}
function paracrm_android_getDbImage($post_data)
{
	global $_opDB ;
	
	$_DISABLE_MODE = FALSE ;
	if( !$post_data['__ANDROID_ID'] || !paracrm_lib_android_authDevice_ping($post_data['__ANDROID_ID'],$ping=false) ) {
		$_DISABLE_MODE = TRUE ;
	}
	
	// ********* Tables temporaires *************
	// DROP + CREATE
	$query = "DROP TABLE IF EXISTS tmp_store_bible_tree" ;
	$_opDB->query($query) ;
	$query = "DROP TABLE IF EXISTS tmp_store_bible_tree_field" ;
	$_opDB->query($query) ;
	$query = "DROP TABLE IF EXISTS tmp_store_bible_entry" ;
	$_opDB->query($query) ;
	$query = "DROP TABLE IF EXISTS tmp_store_bible_entry_field" ;
	$_opDB->query($query) ;
	
	$query = "CREATE TEMPORARY TABLE IF NOT EXISTS "
                    . "tmp_store_bible_entry" . " ("
                    . "bible_code" . " VARCHAR(50), "
                    . "entry_key" . " VARCHAR(100),"
                    . "treenode_key" . " VARCHAR(100),"
                    . "PRIMARY KEY( bible_code, entry_key)"
                    . ");";
	$_opDB->query($query) ;
	$query = "CREATE TEMPORARY TABLE IF NOT EXISTS "
                    . "tmp_store_bible_entry_field" . " ("
                    . "bible_code" . " VARCHAR(50), "
                    . "entry_key" . " VARCHAR(100),"
                    . "entry_field_code" . " VARCHAR(100),"
                    . "entry_field_value_number" . " DECIMAL(10,2),"
                    . "entry_field_value_string" . " VARCHAR(100),"
                    . "entry_field_value_date" . " DATE,"
                    . "entry_field_value_link" . " VARCHAR(500),"
                    . "PRIMARY KEY( bible_code, entry_key,entry_field_code)"
                    . ");";
	$_opDB->query($query) ;
	$query = "CREATE TEMPORARY TABLE IF NOT EXISTS "
                    . "tmp_store_bible_tree" . " ("
                    . "bible_code" . " VARCHAR(50), "
                    . "treenode_key" . " VARCHAR(100),"
                    . "treenode_parent_key" . " VARCHAR(100),"
                    . "PRIMARY KEY( bible_code, treenode_key)"
                    . ");";
	$_opDB->query($query) ;
	$query = "CREATE TEMPORARY TABLE IF NOT EXISTS "
                    . "tmp_store_bible_tree_field" . " ("
                    . "bible_code" . " VARCHAR(50), "
                    . "treenode_key" . " VARCHAR(100),"
                    . "treenode_field_code" . " VARCHAR(100),"
                    . "treenode_field_value_number" . " DECIMAL(10,2),"
                    . "treenode_field_value_string" . " VARCHAR(100),"
                    . "treenode_field_value_date" . " DATE,"
                    . "treenode_field_value_link" . " VARCHAR(500),"
                    . "PRIMARY KEY( bible_code, treenode_key,treenode_field_code)"
                    . ");";
	$_opDB->query($query) ;
	
	
	// foreach( define bible )
	//    store_bible_X_tree => tmp_store_bible_tree + tmp_store_bible_tree_field
	//    store_bible_X_entry => tmp_store_bible_entry + tmp_store_bible_entry_field
	$bibles = array() ;
	$query = "SELECT bible_code FROM define_bible ORDER BY bible_code" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$bibles[] = $arr[0] ;
	}
	foreach( $bibles as $bible_code ) {
	
		$map_tree = array() ;
		$query = "SELECT tree_field_code,tree_field_type FROM define_bible_tree WHERE bible_code='$bible_code' ORDER BY tree_field_index" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$field_code = $arr[0] ;
			$field_type = $arr[1] ;
			
			$map = array() ;
			$map['field_code'] = $field_code ;
			$map['src_db_field'] = 'field_'.$field_code.'_'.paracrm_define_tool_getEqFieldType($field_type) ;
			switch( $field_type = $arr[1] ) {
				case 'string' :
					$map['dest_db_field'] = 'treenode_field_value_string' ;
					break ;
				case 'number' :
					$map['dest_db_field'] = 'treenode_field_value_number' ;
					break ;
				case 'bool' :
					$map['dest_db_field'] = 'treenode_field_value_number' ;
					break ;
				case 'date' :
					$map['dest_db_field'] = 'treenode_field_value_date' ;
					break ;
				case 'link' :
					$map['dest_db_field'] = 'treenode_field_value_link' ;
					break ;
			}
			
			$map_tree[] = $map ;
		}
		
		$map_entry = array() ;
		$query = "SELECT * FROM define_bible WHERE bible_code='$bible_code'" ;
		$result = $_opDB->query($query) ;
		$arr = $_opDB->fetch_assoc($result) ;
		if( $arr['gmap_is_on'] == 'O' ) {
			foreach( $_opDB->table_fields('define_gmap') as $field )
			{
				$tfield = 'gmap_'.$field ;
				
				$map = array() ;
				$map['field_code'] = $tfield ;
				$map['src_db_field'] = $tfield ;
				$map['dest_db_field'] = 'entry_field_value_link' ;
				$map_entry[] = $map ;
			}
		}
		$query = "SELECT entry_field_code,entry_field_type FROM define_bible_entry WHERE bible_code='$bible_code' ORDER BY entry_field_index" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$field_code = $arr[0] ;
			$field_type = $arr[1] ;
			
			$map = array() ;
			$map['field_code'] = $field_code ;
			$map['src_db_field'] = 'field_'.$field_code.'_'.paracrm_define_tool_getEqFieldType($field_type) ;
			switch( $field_type = $arr[1] ) {
				case 'string' :
					$map['dest_db_field'] = 'entry_field_value_string' ;
					break ;
				case 'number' :
					$map['dest_db_field'] = 'entry_field_value_number' ;
					break ;
				case 'bool' :
					$map['dest_db_field'] = 'entry_field_value_number' ;
					break ;
				case 'date' :
					$map['dest_db_field'] = 'entry_field_value_date' ;
					break ;
				case 'link' :
					$map['dest_db_field'] = 'entry_field_value_link' ;
					break ;
			}
			
			$map_entry[] = $map ;
		}
		
		$query = "SELECT * FROM store_bible_{$bible_code}_tree ORDER BY treenode_key" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
			$arr_ins = array() ;
			$arr_ins['bible_code'] = $bible_code ;
			$arr_ins['treenode_key'] = $arr['treenode_key'] ;
			$arr_ins['treenode_parent_key'] = $arr['treenode_parent_key'] ;
			$_opDB->insert('tmp_store_bible_tree',$arr_ins) ;
		
			foreach( $map_tree as $map ) {
				$src = $map['src_db_field'] ;
				if( !isset($arr[$src]) ) {
					continue ;
				}
			
				$arr_ins = array() ;
				$arr_ins['bible_code'] = $bible_code ;
				$arr_ins['treenode_key'] = $arr['treenode_key'] ;
				$arr_ins['treenode_field_code'] = $map['field_code'] ;
				$arr_ins['treenode_field_value_string'] = '' ;
				$arr_ins['treenode_field_value_number'] = 0 ;
				$arr_ins['treenode_field_value_date'] = '0000-00-00' ;
				$arr_ins['treenode_field_value_link'] = '' ;
				$arr_ins[$map['dest_db_field']] = $arr[$src] ;
				$_opDB->insert('tmp_store_bible_tree_field',$arr_ins) ;
			}
		}
	
		$query = "SELECT * FROM store_bible_{$bible_code}_entry ORDER BY entry_key" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
			$arr_ins = array() ;
			$arr_ins['bible_code'] = $bible_code ;
			$arr_ins['entry_key'] = $arr['entry_key'] ;
			$arr_ins['treenode_key'] = $arr['treenode_key'] ;
			$_opDB->insert('tmp_store_bible_entry',$arr_ins) ;
		
			foreach( $map_entry as $map ) {
				$src = $map['src_db_field'] ;
				if( !isset($arr[$src]) ) {
					continue ;
				}
			
				$arr_ins = array() ;
				$arr_ins['bible_code'] = $bible_code ;
				$arr_ins['entry_key'] = $arr['entry_key'] ;
				$arr_ins['entry_field_code'] = $map['field_code'] ;
				$arr_ins['entry_field_value_string'] = '' ;
				$arr_ins['entry_field_value_number'] = 0 ;
				$arr_ins['entry_field_value_date'] = '0000-00-00' ;
				$arr_ins['entry_field_value_link'] = '' ;
				$arr_ins[$map['dest_db_field']] = $arr[$src] ;
				$_opDB->insert('tmp_store_bible_entry_field',$arr_ins) ;
			}
		}
	}
	// *******************************************
	
	// ******* Création des tables QUERIES ***************
	paracrm_android_query_buildTables() ;
	// *************************************************
	
	$tables = array() ;
	$tables['define_bible'] = 'define_bible' ;
	$tables['define_bible_entry'] = 'define_bible_entry' ;
	$tables['define_bible_tree'] = 'define_bible_tree' ;
	$tables['define_file'] = 'define_file' ;
	$tables['define_file_cfg_calendar'] = 'define_file_cfg_calendar' ;
	$tables['define_file_entry'] = 'define_file_entry' ;
	$tables['input_calendar'] = 'input_calendar' ;
	$tables['input_explorer_cfg'] = 'input_explorer_cfg' ;
	$tables['input_scen'] = 'input_scen' ;
	$tables['input_scen_page'] = 'input_scen_page' ;
	$tables['input_scen_pagepivot'] = 'input_scen_pagepivot' ;
	$tables['input_scen_pagepivot_copymap'] = 'input_scen_pagepivot_copymap' ;
	$tables['input_scen_page_field'] = 'input_scen_page_field' ;
	$tables['input_store_src'] = 'input_store_src' ;
	$tables['querygrid_template'] = 'querygrid_template' ;
	$tables['store_bible_entry'] = 'tmp_store_bible_entry' ;
	$tables['store_bible_entry_field'] = 'tmp_store_bible_entry_field' ;
	$tables['store_bible_tree'] = 'tmp_store_bible_tree' ;
	$tables['store_bible_tree_field'] = 'tmp_store_bible_tree_field' ;
	$tables['input_query'] = 'tmp_input_query' ;
	$tables['input_query_where'] = 'tmp_input_query_where' ;
	$tables['input_query_progress'] = 'tmp_input_query_progress' ;
	
	
	$first = paracrm_android_getDbImageTimestamp() ;
	$first['nb_tables'] = 0 ;
	$first['nb_rows'] = 0 ;
	foreach( $tables as $local_table )
	{
		$query = "SELECT count(*) FROM $local_table" ;
		$first['nb_tables']++;
		$first['nb_rows'] += $_opDB->query_uniqueValue($query) ;
	}
	if( $_DISABLE_MODE ) {
		$first['nb_rows'] = 0 ;
		$first['timestamp'] = 1 ;
		$first['denied'] = true ;
	}
	echo json_encode($first) ;
	echo "\r\n" ;
	
	foreach( $tables as $remote_table => $local_table )
	{
		echo json_encode(array($remote_table)) ;
		echo "\r\n" ;
	
		echo json_encode($_opDB->table_fields($local_table)) ;
		echo "\r\n" ;
	
		if( !$_DISABLE_MODE ) {
			$query = "SELECT * FROM $local_table" ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_row($result)) != FALSE )
			{
				echo json_encode($arr) ;
				echo "\r\n" ;
			}
		}
		
		echo json_encode(array()) ;
		echo "\r\n" ;
	}
	
	die() ;
}


function paracrm_android_postDbData_prepareJson( $input )
{
	//This will convert ASCII/ISO-8859-1 to UTF-8.
	//Be careful with the third parameter (encoding detect list), because
	//if set wrong, some input encodings will get garbled (including UTF-8!)
	$input = mb_convert_encoding($input, 'UTF-8', 'ASCII,UTF-8,ISO-8859-1');

	//Remove UTF-8 BOM if present, json_decode() does not like it.
	if(substr($input, 0, 3) == pack("CCC", 0xEF, 0xBB, 0xBF)) $input = substr($input, 3);

	return $input;
}

function paracrm_android_syncPull( $post_data )
{
	global $_opDB ;
	
	$file_code = $post_data['file_code'] ;
	$sync_timestamp = $post_data['sync_timestamp'] ;
	$filter = $post_data['filter'] ;
	$limit = $post_data['limit'] ;
	
	// Remote WHAT-I-HAVE : recup des données meme si hors scope sur le serveur, pour update forcée
	if( $post_data['local_sync_hashmap'] ) {
		$arrRemote_syncVuid_syncTime = json_decode($post_data['local_sync_hashmap'],true) ;
	}
	
	
	$query_test = "select count(*) from store_file where ( sync_vuid='' OR sync_timestamp='0' )" ;
	if( $_opDB->query_uniqueValue($query_test) > 0 ) {
		// ***** PREPARATION DES DONNEES ******
		$query = "LOCK TABLES store_file WRITE" ;
		$_opDB->query($query) ;
		
		$ref_prefix = "PHPSERVER" ;
		$ref_timestamp = time() ;
		$query = "UPDATE store_file SET sync_vuid=CONCAT('$ref_prefix','-','$ref_timestamp','-',filerecord_id) WHERE sync_vuid=''" ;
		$_opDB->query($query) ;
		
		$now_timestamp = time() ;
		$query = "UPDATE store_file SET sync_timestamp='$now_timestamp' WHERE sync_timestamp='0'" ;
		$_opDB->query($query) ;
		
		$query = "UNLOCK TABLES" ;
		$_opDB->query($query) ;
		// *************************************
	}
	
	
	// *** Construction de la requête de sélection ****
	$query = "SELECT file.filerecord_id FROM store_file file , store_file_{$file_code} filefield 
					WHERE file.filerecord_id = filefield.filerecord_id 
					AND file.file_code='$file_code'" ;
	if( $sync_timestamp ) {
		$query.= " AND file.sync_timestamp>'$sync_timestamp'" ;
	}
	if( $filter ) {
		$arr_fields = array() ;
		$query_test = "SELECT distinct entry_field_code, entry_field_type FROM define_file_entry WHERE file_code='$file_code'" ;
		$result_test = $_opDB->query($query_test) ;
		while( ($arr = $_opDB->fetch_row($result_test)) != FALSE ) {
			$arr_fields[$arr[0]] = 'field_'.$arr[0].'_'.paracrm_define_tool_getEqFieldType($arr[1]) ;
		}
	
	
		foreach( json_decode($filter,true) as $filter ) {
			if( !$arr_fields[$filter['entry_field_code']] ) {
				continue ;
			}
			$dbfield = $arr_fields[$filter['entry_field_code']] ;
		
			$query.= " AND filefield.{$dbfield}" ;
			switch( $filter['condition_sign'] ) {
				case 'in' :
					$query.= " IN " ;
					break ;
				case 'eq' :
				case '=' :
					$query.= "=" ;
					break ;
				case 'lt' :
				case '<=' :
				case '<' :
					$query.= "<=" ;
					break ;
				case 'gt' :
				case '>=' :
				case '>' :
					$query.= ">=" ;
					break ;
					
				default :
					$query.= "=" ;
					break ;
			}
			if( $filter['condition_sign'] == 'in' ) {
				$query.=$_opDB->makeSQLlist($filter['condition_value']) ;
			} else {
				$query.="'{$filter['condition_value']}'" ;
			}
		}
	}
	if( $limit ) {
		$query.= " ORDER BY sync_timestamp DESC, filerecord_id DESC LIMIT {$limit}" ;
	}
	
	// Note : on inclut dans la "master_query" les records présents sur le terminal Android
	//        même s'il ne font pas partie du scope évalué plus haut
	if( $arrRemote_syncVuid_syncTime ) {
		$query = "(".$query.")" ;
		$query.= " UNION ( SELECT filerecord_id FROM store_file WHERE sync_vuid IN ".$_opDB->makeSQLlist(array_keys($arrRemote_syncVuid_syncTime))." )" ;
	}
	
	$master_query = $query ;
	
	$query = "DROP TABLE IF EXISTS tmp_filerecord_ids" ;
	$_opDB->query($query) ;
	$query = "CREATE TEMPORARY TABLE IF NOT EXISTS "
                    . "tmp_filerecord_ids" . " ("
                    . "filerecord_id" . " INTEGER,"
                    . "PRIMARY KEY( filerecord_id )"
                    . ");";
	$_opDB->query($query) ;
	$query = "INSERT INTO tmp_filerecord_ids {$master_query}" ;
	$_opDB->query($query) ;
	
	$master_query = "SELECT filerecord_id FROM tmp_filerecord_ids" ;
	
	//error_log($query) ;
	
	
	
	$buffer_remote_storeFile = array() ;
	$buffer_remote_storeFileField = array() ;
	
	$ttmp = paracrm_android_syncPull_dumpFile( $file_code, $master_query ) ;
	$buffer_remote_storeFile = array_merge($buffer_remote_storeFile,$ttmp[0]) ;
	$buffer_remote_storeFileField = array_merge($buffer_remote_storeFileField,$ttmp[1]) ;
	
	$query = "SELECT file_code FROM define_file WHERE file_parent_code='$file_code'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$child_file_code = $arr[0] ;
		
		$sub_query = "SELECT child.filerecord_id FROM store_file child JOIN ($master_query) parent ON parent.filerecord_id=child.filerecord_parent_id WHERE child.file_code='$child_file_code'" ;
		
		$ttmp = paracrm_android_syncPull_dumpFile( $child_file_code, $sub_query ) ;
		$buffer_remote_storeFile = array_merge($buffer_remote_storeFile,$ttmp[0]) ;
		$buffer_remote_storeFileField = array_merge($buffer_remote_storeFileField,$ttmp[1]) ;
	}
	
	
	$first = array('success'=>true,'timestamp'=>time()) ;
	echo json_encode($first) ;
	echo "\r\n" ;
	
	// Tmp : mapping de la table "store_file"
	$storeFile_tableMap = $_opDB->table_fields('store_file') ;
	$storeFile_tableMap = array_flip($storeFile_tableMap) ;
	
	$idx_filerecordId = $storeFile_tableMap['filerecord_id'] ;
	$idx_filerecordParentId = $storeFile_tableMap['filerecord_parent_id'] ;
	$idx_syncVuid = $storeFile_tableMap['sync_vuid'] ;
	$idx_syncTimestamp = $storeFile_tableMap['sync_timestamp'] ;
	
	
	// Note : Si $arrRemote_syncVuid_syncTime est fourni:
	//        - si on trouve le syncVuid ET que sync_timestamp est égal => le record existe déja sur Android et n'a pas changé
	//        - on envoie tout de même l'entete "store_file" pour MaJ de pull_timestamp
	//        - mais on skip le detail "store_file_field"
	// ATTENTION FEINTE !!! : Si on est en "limit" (=list mode sur Android) on ne renvoie même pas l'entete
	//                        => le pull_timestamp ne sera pas mis à jour mais on gagne en performance
	//                        TODO : Trouver un autre système
	$arr_skipDet_filerecordIds = array() ;
	
	// ******* FILE **********
	echo json_encode(array('store_file')) ;
	echo "\r\n" ;
	echo json_encode($_opDB->table_fields('store_file')) ;
	echo "\r\n" ;
	foreach( $buffer_remote_storeFile as $arr )
	{
		$filerecord_id = $arr[$idx_filerecordId] ;
		$filerecord_parent_id = $arr[$idx_filerecordParentId] ;
		$sync_timestamp = $arr[$idx_syncTimestamp] ;
		$sync_vuid = $arr[$idx_syncVuid] ;
		
		if( $arrRemote_syncVuid_syncTime 
			&& $arrRemote_syncVuid_syncTime[$sync_vuid]
			&& $arrRemote_syncVuid_syncTime[$sync_vuid] == $sync_timestamp ) {
			
			$arr_skipDet_filerecordIds[$filerecord_id] = TRUE ;
			
			if( $limit ) { // FEINTE : voir plus haut
				continue ;
			}
		}
		elseif( $arr_skipDet_filerecordIds[$filerecord_parent_id] ) {
			// Safe to do this => les parents sont récupéré avant les fichiers child
		
			$arr_skipDet_filerecordIds[$filerecord_id] = TRUE ;
			
			if( $limit ) { // FEINTE : voir plus haut
				continue ;
			}
		}
	
		echo json_encode($arr) ;
		echo "\r\n" ;
	}
	echo json_encode(array()) ;
	echo "\r\n" ;
	
	// ******* FILE_FIELD **********
	echo json_encode(array('store_file_field')) ;
	echo "\r\n" ;
	echo json_encode(array('filerecord_id','filerecord_field_code','filerecord_field_value_number','filerecord_field_value_string','filerecord_field_value_date','filerecord_field_value_link')) ;
	echo "\r\n" ;
	foreach( $buffer_remote_storeFileField as $arr )
	{
		$filerecord_id = $arr[0] ;
		if( $arr_skipDet_filerecordIds[$filerecord_id] ) {
			continue ;
		}
	
		echo json_encode($arr) ;
		echo "\r\n" ;
	}
	echo json_encode(array()) ;
	echo "\r\n" ;
	
	$query = "DROP TABLE IF EXISTS tmp_filerecord_ids" ;
	$_opDB->query($query) ;
	// sleep(1) ;
	
	die() ;
}


function paracrm_android_syncPull_dumpFile( $file_code, $master_query )
{
	global $_opDB ;
	
	$map_file = array() ;
	$query = "SELECT * FROM define_file WHERE file_code='$file_code'" ;
	$result = $_opDB->query($query) ;
	$arr = $_opDB->fetch_assoc($result) ;
	if( strpos($arr['file_type'],'media_')===0 ) {
		foreach( $_opDB->table_fields('define_media') as $field )
		{
			$tfield = 'media_'.$field ;
			
			$map = array() ;
			$map['field_code'] = $tfield ;
			$map['src_db_field'] = $tfield ;
			$map['dest_db_field'] = 'filerecord_field_value_string' ;
			$map_file[] = $map ;
		}
	}
	if( $arr['gmap_is_on'] == 'O' ) {
		foreach( $_opDB->table_fields('define_gmap') as $field )
		{
			$tfield = 'gmap_'.$field ;
			
			$map = array() ;
			$map['field_code'] = $tfield ;
			$map['src_db_field'] = $tfield ;
			$map['dest_db_field'] = 'filerecord_field_value_link' ;
			$map_file[] = $map ;
		}
	}
	$query = "SELECT entry_field_code,entry_field_type FROM define_file_entry WHERE file_code='$file_code' ORDER BY entry_field_index" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$field_code = $arr[0] ;
		$field_type = $arr[1] ;
		
		$map = array() ;
		$map['field_code'] = $field_code ;
		$map['src_db_field'] = 'field_'.$field_code.'_'.paracrm_define_tool_getEqFieldType($field_type) ;
		switch( $field_type = $arr[1] ) {
			case 'string' :
				$map['dest_db_field'] = 'filerecord_field_value_string' ;
				break ;
			case 'number' :
				$map['dest_db_field'] = 'filerecord_field_value_number' ;
				break ;
			case 'bool' :
				$map['dest_db_field'] = 'filerecord_field_value_number' ;
				break ;
			case 'date' :
				$map['dest_db_field'] = 'filerecord_field_value_date' ;
				break ;
			case 'link' :
				$map['dest_db_field'] = 'filerecord_field_value_link' ;
				break ;
		}
		
		$map_file[] = $map ;
	}
	
	
	$arr_table_query = array() ;
	$arr_table_query['store_file'] = "SELECT dumptab.* FROM store_file dumptab JOIN ($master_query) master ON dumptab.filerecord_id=master.filerecord_id ORDER BY dumptab.filerecord_id DESC" ;
	$arr_table_query['store_file_field'] = "SELECT dumptab.* FROM store_file_{$file_code} dumptab JOIN ($master_query) master ON dumptab.filerecord_id=master.filerecord_id" ;
	
	//error_log( $arr_table_query['store_file_field'] ) ;
	
	// ******* FILE **********
	$buffer_remote_storeFile = array() ;
	$result = $_opDB->query($arr_table_query['store_file']) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE )
	{
		$buffer_remote_storeFile[] = $arr ;
	}
	
	// ******* FILE_FIELD **********
	array('filerecord_id','filerecord_field_code','filerecord_field_value_number','filerecord_field_value_string','filerecord_field_value_date','filerecord_field_value_link') ;
	$buffer_remote_storeFileField = array() ;
	$result = $_opDB->query($arr_table_query['store_file_field']) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		foreach( $map_file as $map ) {
			$src = $map['src_db_field'] ;
			if( !isset($arr[$src]) ) {
				continue ;
			}
		
			$arr_ins = array() ;
			$arr_ins['filerecord_id'] = $arr['filerecord_id'] ;
			$arr_ins['filerecord_field_code'] = $map['field_code'] ;
			$arr_ins['filerecord_field_value_number'] = 0 ;
			$arr_ins['filerecord_field_value_string'] = '' ;
			$arr_ins['filerecord_field_value_date'] = '0000-00-00' ;
			$arr_ins['filerecord_field_value_link'] = '' ;
			$arr_ins[$map['dest_db_field']] = $arr[$src] ;
			
			$buffer_remote_storeFileField[] = array_values($arr_ins) ;
		}
	}
	
	return array($buffer_remote_storeFile,$buffer_remote_storeFileField) ;
}
function paracrm_android_syncPush( $post_data )
{
	global $_opDB ;
	
	$timestamp = time() ;

	$arr_tmpid_fileid = array() ;
	$arr_upload_slots  = array() ;
	
	$tab_definefile = array() ;
	$query = "SELECT * FROM define_file" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$tab_definefile[$arr['file_code']] = $arr ;
	}
	
	$data = json_decode(paracrm_android_postDbData_prepareJson($post_data['data']),TRUE) ;
	if( !$data['store_file'] ) {
		return array('success'=>true) ;
	}
	paracrm_lib_data_beginTransaction() ;
	foreach( $data['store_file'] as $file_entry )
	{
		$sync_vuid = $file_entry['sync_vuid'] ;
		if( !$sync_vuid )
		{
			continue ;
		}
		$query = "DELETE FROM store_file WHERE sync_vuid='$sync_vuid'" ;
		$_opDB->query($query) ;
	}
	foreach( $data['store_file'] as $file_entry )
	{
		if( $file_entry['filerecord_parent_id'] != 0 )
			continue ;
		$arr_ins = $file_entry ;
		unset($arr_ins['sync_is_synced']) ;
		unset($arr_ins['pull_timestamp']) ;
		$arr_ins['filerecord_id'] = 0 ;
		$arr_ins['sync_timestamp'] = $timestamp ;
		$_opDB->insert('store_file',$arr_ins) ;
		
		
		$arr_tmpid_fileid[$file_entry['filerecord_id']] = $_opDB->insert_id() ;
		if( strpos($tab_definefile[$file_entry['file_code']]['file_type'],'media_') === 0 )
			$arr_upload_slots[] = $arr_tmpid_fileid[$file_entry['filerecord_id']] ;
	}
	foreach( $data['store_file'] as $file_entry )
	{
		if( $file_entry['filerecord_parent_id'] == 0 || !$arr_tmpid_fileid[$file_entry['filerecord_parent_id']])
			continue ;
			
		$arr_ins = $file_entry ;
		unset($arr_ins['sync_is_synced']) ;
		unset($arr_ins['pull_timestamp']) ;
		$arr_ins['filerecord_id'] = 0 ;
		$arr_ins['filerecord_parent_id'] = $arr_tmpid_fileid[$file_entry['filerecord_parent_id']] ;
		$arr_ins['sync_timestamp'] = $timestamp ;
		$_opDB->insert('store_file',$arr_ins) ;
		
		$arr_tmpid_fileid[$file_entry['filerecord_id']] = $_opDB->insert_id() ;
		if( strpos($tab_definefile[$file_entry['file_code']]['file_type'],'media_') === 0 )
			$arr_upload_slots[] = $arr_tmpid_fileid[$file_entry['filerecord_id']] ;
	}
	
	// buffer inserts store_file_X
	$TAB_inserts = array() ;
	$TAB_inserts[$file_code][$filerecord_id] ;
	
	// pour chaque remoteId => filecode
	$arr_tmpid_filecode = array() ;
	
	$map_files = array() ;
	foreach( $data['store_file'] as $file_entry ) {
		if( !$arr_tmpid_fileid[$file_entry['filerecord_id']])
			continue ;
		$local_filerecord_id = $arr_tmpid_fileid[$file_entry['filerecord_id']] ;
		$file_code = $file_entry['file_code'] ;
		
		$arr_tmpid_filecode[$file_entry['filerecord_id']] = $file_code ;
		
		
		if( !isset($map_files[$file_code]) ) {
			$query = "SELECT * FROM define_file WHERE file_code='$file_code'" ;
			$result = $_opDB->query($query) ;
			$arr = $_opDB->fetch_assoc($result) ;
			$has_media = $has_media = FALSE ;
			if( strpos($arr['file_type'],'media_')===0 ) {
				$has_media = TRUE ;
			}
			if( $arr['gmap_is_on'] == 'O' ) {
				$has_gmap = TRUE ;
			}
		
		
			$map_file = array() ;
			$query = "SELECT entry_field_code,entry_field_type FROM define_file_entry WHERE file_code='$file_code' ORDER BY entry_field_index" ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
				$field_code = $arr[0] ;
				$field_type = $arr[1] ;
				
				$map = array() ;
				$map['field_code'] = $field_code ;
				$map['dest_db_field'] = 'field_'.$field_code.'_'.paracrm_define_tool_getEqFieldType($field_type) ;
				switch( $field_type = $arr[1] ) {
					case 'string' :
						$map['src_db_field'] = 'filerecord_field_value_string' ;
						break ;
					case 'number' :
						$map['src_db_field'] = 'filerecord_field_value_number' ;
						break ;
					case 'bool' :
						$map['src_db_field'] = 'filerecord_field_value_number' ;
						break ;
					case 'date' :
						$map['src_db_field'] = 'filerecord_field_value_date' ;
						break ;
					case 'link' :
						$map['src_db_field'] = 'filerecord_field_value_link' ;
						break ;
				}
				
				$map_file[$field_code] = $map ;
			}
			if( $has_gmap ) {
			foreach( $_opDB->table_fields('define_gmap') as $field )
			{
				$tfield = 'gmap_'.$field ;
				
				$map = array() ;
				$map['field_code'] = $tfield ;
				$map['dest_db_field'] = $tfield ;
				$map['src_db_field'] = 'filerecord_field_value_link' ;
				$map_file[$tfield] = $map ;
			}}
			if( $has_media ) {
			foreach( $_opDB->table_fields('define_media') as $field )
			{
				$tfield = 'media_'.$field ;
				
				$map = array() ;
				$map['field_code'] = $tfield ;
				$map['dest_db_field'] = $tfield ;
				$map['src_db_field'] = 'filerecord_field_value_string' ;
				$map_file[$tfield] = $map ;
			}}
			$map_files[$file_code] = $map_file ;
			
			// Case vide pour inserts
			$TAB_inserts[$file_code] = array() ;
		}
		$TAB_inserts[$file_code][$local_filerecord_id] = array('filerecord_id'=>$local_filerecord_id) ;
	}
	
	foreach( $data['store_file_field'] as $field_entry )
	{
		if( !($local_filerecord_id = $arr_tmpid_fileid[$field_entry['filerecord_id']]) )
			continue ;
		if( !($file_code = $arr_tmpid_filecode[$field_entry['filerecord_id']]) )
			continue ;
			
		if( !($map_node = $map_files[$file_code][$field_entry['filerecord_field_code']]) )
			continue ;
			
		$src_db_field = $map_node['src_db_field'] ;
		$dest_db_field = $map_node['dest_db_field'] ;
		
		$TAB_inserts[$file_code][$local_filerecord_id][$dest_db_field] = $field_entry[$src_db_field] ;
	}
	
	foreach( $TAB_inserts as $file_code => $arrArr_ins ) {
		$target_dbTable = 'store_file_'.$file_code ;
		
		$query = "DELETE FROM $target_dbTable WHERE filerecord_id NOT IN (SELECT filerecord_id FROM store_file WHERE file_code='$file_code' AND sync_is_deleted<>'O')" ;
		$_opDB->query($query) ;
		
		foreach( $arrArr_ins as $arr_ins ) {
			$_opDB->insert($target_dbTable,$arr_ins) ;
		}
	}
	
	paracrm_lib_data_endTransaction(FALSE) ;
	
	
	


	return array('success'=>true,'map_tmpid_fileid'=>$arr_tmpid_fileid,'upload_slots'=>$arr_upload_slots) ;
}



function paracrm_android_postBinary( $post_data )
{
	media_contextOpen( 'paracrm', '' ) ;

	$base=$post_data['base64_binary'];
   $binary=base64_decode($base);
   $tmpfilename = tempnam( sys_get_temp_dir(), "FOO");
   $res = file_put_contents( $tmpfilename , $binary ) ;
   
   $tmp_id = media_img_processUploaded( $tmpfilename ) ;
   media_img_move( $tmp_id , $post_data['filerecord_id'] ) ;
   unlink($tmpfilename) ;
   
   media_contextClose() ;
   
   return array('success'=>true) ;
}



function paracrm_android_getFileGrid_data( $post_data )
{	
	return paracrm_data_getFileGrid_raw( $post_data ) ;
}


function paracrm_android_imgPull( $post_data )
{
	global $_opDB ;
	
	$query = "SELECT filerecord_id FROM store_file WHERE sync_vuid='{$post_data['sync_vuid']}'" ;
	$filerecord_id = $_opDB->query_uniqueValue($query) ;
	
	$domain = $_SESSION['login_data']['login_domain'] ;
	$module_name = $post_data['_moduleName'] ;
	$module_account = $post_data['_moduleAccount'] ;
	if( !$module_account )
		$module_account = 'generic' ;	
	
	$media_path = $GLOBALS['media_storage_local_path'].'/'.$domain.'/'.$module_name.'/'.$module_account ;
	error_log($media_path);
	if( !is_dir($media_path) ) {
		// die() ;
		paracrm_android_imgPullFallback( $post_data ) ;
	}
	$src_path = $media_path.'/'.$filerecord_id ;
	if( $post_data['thumbnail'] == 'O' )
	{
		$src_path.= '.thumb.jpg' ;
	}
	else
	{
		$src_path.= '.jpg' ;
	}
	if( !is_file($src_path) ) {
		// die() ;
		paracrm_android_imgPullFallback( $post_data ) ;
	}
	header('Content-type: image/jpeg');
	readfile($src_path) ;
	die() ;
}
function paracrm_android_imgPullFallback( $post_data )
{
	if( !$GLOBALS['media_fallback_url'] ) {
		die() ;
	}
	
	global $_opDB ;

	$thumb_get = "false" ;
	if( $post_data['thumbnail'] == 'O' ) {
		$thumb_get = "true" ;
	}
	
	$query = "SELECT filerecord_id FROM store_file WHERE sync_vuid='{$post_data['sync_vuid']}'" ;
	$filerecord_id = $_opDB->query_uniqueValue($query) ;
	
	header('Content-type: image/jpeg');
	$getUrl = "{$GLOBALS['media_fallback_url']}?_domain={$post_data['_domain']}&_moduleName={$post_data['_moduleName']}&_moduleAccount={$post_data['_moduleAccount']}&media_id={$filerecord_id}&thumb={$thumb_get}" ;
	readfile($getUrl) ;
	die() ;
}
?>
