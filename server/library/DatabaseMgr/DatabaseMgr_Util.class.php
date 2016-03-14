<?php
class DatabaseMgr_Util {
	
	public static function syncSQLschema( $db_name, $create_schema )
	{
		global $_opDB ;
		
		$mysql_db = $db_name ;
		
		$arr_existing_dbs = array() ;
		$query = "SHOW DATABASES" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE )
		{
			$arr_existing_dbs[] = $arr[0] ;
		}
		while( TRUE )
		{
			$tmpdb = 'tmpdb'.rand(1,1000000) ;
			if( in_array($tmpdb,$arr_existing_dbs) )
				continue ;
			break ;
		}
		$query = "CREATE DATABASE $tmpdb" ;
		$_opDB->query($query) ;
		
		$selected_db = $_opDB->query_uniqueValue("SELECT DATABASE()") ;
		$_opDB->select_db( $tmpdb ) ;
		foreach( explode(';',$create_schema) as $sql_statement ) {
			if( !trim($sql_statement) ) {
				continue ;
			}
		
			$sql_statement.= ';'."\r\n" ;
			$_opDB->query($sql_statement) ;
		}
		$_opDB->select_db( $selected_db ) ;
		
		
		
		/*
		**** PARTIE 1 : comparaison des tables *****
		*/
		$arr_model_tables = array() ;
		$query = "SHOW TABLES FROM $tmpdb" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE )
			$arr_model_tables[] = $arr[0] ;
		
		$arr_existing_tables = array() ;
		$query = "SHOW FULL TABLES FROM $mysql_db" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			if( $arr[1] && $arr[1] != 'BASE TABLE' ) {
				continue ;
			}
			$arr_existing_tables[] = $arr[0] ;
		}
			
		foreach( $arr_model_tables as $db_table )
		{
			if( !in_array($db_table,$arr_existing_tables) )
			{
				$query = "CREATE TABLE {$mysql_db}.{$db_table} LIKE {$tmpdb}.{$db_table}" ;
				$_opDB->query($query) ;
			}
		}
		
		
		
		/*
		****** PARTIE 2 : pour chaque table existante, comparaison des champs *****
		*/
		foreach( $arr_existing_tables as $db_table )
		{
			if( !in_array($db_table,$arr_model_tables) )
			{
				continue ;
				//$query = "DROP TABLE {$mysql_db}.{$db_table}" ;
			}
		
			$arr_model_fields = array() ;
			$query = "SHOW COLUMNS FROM {$tmpdb}.{$db_table} " ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_row($result)) != FALSE )
				$arr_model_fields[] = $arr ;
			
			
			
			$arr_existing_fields = array() ;
			$query = "SHOW COLUMNS FROM {$mysql_db}.{$db_table} " ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_row($result)) != FALSE )
				$arr_existing_fields[] = $arr ;
				
				
				
			foreach( $arr_existing_fields as $desc_field_existing )
			{
				$existing_field = $desc_field_existing[0] ;
				foreach( $arr_model_fields as $desc_field_model )
				{
					if( $existing_field == $desc_field_model[0] )
						continue 2 ;
				}
				
				$query = "ALTER TABLE {$mysql_db}.{$db_table} DROP `$existing_field`" ;
				$_opDB->query($query) ;
			}
			
			
			foreach( $arr_model_fields as $field_id => $desc_field_model )
			{
				$desc_field_existing = NULL ;
				foreach( $arr_existing_fields as $cur_field )
				{
					if( $cur_field[0] == $desc_field_model[0] )
					{
						$desc_field_existing = $cur_field ;
						break ;
					}
				}
				if( !$desc_field_existing )
				{
					//after WHAT ?
					$after_field = '' ;
					if( $field_id >= 1 )
					{
						$f = $field_id - 1 ;
						$tmpdesc = $arr_model_fields[$f] ;
						$after_field = $tmpdesc[0] ;
					}
					// ajout du champs
					$query = "ALTER TABLE {$mysql_db}.{$db_table} ADD `{$desc_field_model[0]}` $desc_field_model[1]" ;
					if( strtoupper($desc_field_model[2]) == 'NO' )
					{
						$query.= " NOT NULL" ;
					}
					if( $desc_field_model[4] && $desc_field_model[4] != 'NULL' ) {
						$query.= " DEFAULT '{$desc_field_model[4]}'" ;
					}
					if( $after_field )
					{
						$query.= " AFTER `$after_field`" ;
					}
					else
					{
						$query.= " FIRST" ;
					}
					$_opDB->query($query) ;
					
					//continue 
					continue ;
				}
				if( $desc_field_existing[1] != $desc_field_model[1] || $desc_field_existing[2] != $desc_field_model[2] || $desc_field_existing[5] != $desc_field_model[5] )
				{
					$query = "ALTER TABLE {$mysql_db}.{$db_table} CHANGE `{$desc_field_existing[0]}` `{$desc_field_model[0]}` $desc_field_model[1]" ;
					if( strtoupper($desc_field_model[2]) == 'NO' )
					{
						$query.= " NOT NULL" ;
					}
					else
					{
						$query.= " NULL" ;
					}
					if( $desc_field_model[4] && $desc_field_model[4] != 'NULL' ) {
						$query.= " DEFAULT '{$desc_field_model[4]}'" ;
					}
					if( strtolower($desc_field_model[5]) == 'auto_increment' )
					{
						// petite verif de PRIMARY KEY
						if( $desc_field_existing[3] != 'PRI' )
						{
							$query_primaryKey = "ALTER TABLE {$mysql_db}.{$db_table} ADD PRIMARY KEY (`{$desc_field_existing[0]}`)" ;
							$_opDB->query($query_primaryKey);
						}
					
					
						$query.= " AUTO_INCREMENT" ;
					}
					
					$_opDB->query($query) ;
					
					//continue 
					continue ;
				}
			}
		}
		
		
		
		/*
		****** PARTIE 3 : pour chaque table existante, comparaison des KEYS *****
		*/
		foreach( $arr_existing_tables as $db_table )
		{
			if( !in_array($db_table,$arr_model_tables) )
			{
				continue ;
				//$query = "DROP TABLE {$mysql_db}.{$db_table}" ;
			}
			
			
			$arr_model_keys = array() ;
			$query = "SHOW KEYS FROM {$tmpdb}.{$db_table} " ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_row($result)) != FALSE )
			{
				$key_name = $arr[2] ;
				$non_unique = $arr[1] ;
				$column_name = $arr[4] ;
				$arr_model_keys[$key_name]['non_unique'] = $non_unique ;
				$arr_model_keys[$key_name]['arr_columns'][] = $column_name ;
			}
			
			
			$arr_existing_keys = array() ;
			$query = "SHOW KEYS FROM {$mysql_db}.{$db_table} " ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_row($result)) != FALSE )
			{
				$key_name = $arr[2] ;
				$non_unique = $arr[1] ;
				$column_name = $arr[4] ;
				$arr_existing_keys[$key_name]['non_unique'] = $non_unique ;
				$arr_existing_keys[$key_name]['arr_columns'][] = $column_name ;
			}
			
		
			foreach($arr_existing_keys as $existing_key_name => $existing_key )
			{
				
				if( !$arr_model_keys[$existing_key_name] )
				{
					$query = "ALTER TABLE {$mysql_db}.{$db_table} " ;
					$query.= " DROP" ;
					if( $existing_key_name == 'PRIMARY' )
						$query.= " PRIMARY KEY" ;
					else
						$query.= " INDEX `$existing_key_name`" ;
							
					$_opDB->query($query) ;
				}
			}
		
			foreach($arr_model_keys as $model_key_name => $model_key )
			{
				$_create = $_drop = FALSE ;
				if( !$arr_existing_keys[$model_key_name] )
				{
					// create
					$_create = TRUE ;
				}
				else
				{
				$existing_key = $arr_existing_keys[$model_key_name] ;
				if( $model_key != $existing_key )
				{
					$_create = TRUE ;
					$_drop = TRUE ;
				}
				}
				
				if( $_create )
				{
					$query = "ALTER TABLE {$mysql_db}.{$db_table} " ;
					if( $_drop )
					{
						$query.= " DROP" ;
						if( $model_key_name == 'PRIMARY' )
							$query.= " PRIMARY KEY" ;
						else
							$query.= " INDEX `$model_key_name`" ;
						$query.= "," ;
					}
					$query.= " ADD" ;
					if( $model_key_name == 'PRIMARY' )
						$query.= " PRIMARY KEY" ;
					elseif( $model_key['non_unique'] == '0' )
						$query.= " UNIQUE `$model_key_name`" ;
					else
						$query.= " INDEX `$model_key_name`" ;
					$query.= "(" ;
					$is_first=TRUE ;
					foreach( $model_key['arr_columns'] as $column )
					{
						if( !$is_first )
							$query.= ',' ;
						$query.= '`'.$column.'`' ;
						$is_first = FALSE ;
					}
					$query.= ")" ;
					
					$_opDB->query($query) ;
				}
			}
		
		}
		
		
		
		// ********* Partie X : conversion vers UTF8 **********
		/*
		$query = "ALTER DATABASE {$mysql_db} CHARACTER SET UTF8 COLLATE utf8_unicode_ci" ;
		$_opDB->query($query) ;
		foreach( $arr_existing_tables as $db_table )
		{
			$query = "ALTER TABLE {$mysql_db}.{$db_table} CHARACTER SET UTF8 COLLATE utf8_unicode_ci" ;
			$_opDB->query($query) ;
		
			$query = "ALTER TABLE {$mysql_db}.{$db_table} CONVERT TO CHARACTER SET UTF8 COLLATE utf8_unicode_ci" ;
			$_opDB->query($query) ;
		}
		*/
		// ************************
		
		
		
		$query = "DROP DATABASE $tmpdb" ;
		$_opDB->query($query) ;
	}
	
	
	
	public static function syncTableStructure( $db_name, $db_table , $arrAssoc_field_fieldType , $arr_model_keys, $drop_allowed=FALSE ) {
	
		global $_opDB ;
		
		$mysql_db = $db_name ;

		$arr_existing_tables = array() ;
		$query = "SHOW TABLES FROM $mysql_db" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE )
			$arr_existing_tables[] = $arr[0] ;

		if( !in_array($db_table,$arr_existing_tables) )
		{
			$is_first = TRUE ;
			$query = "CREATE TABLE {$mysql_db}.{$db_table} (" ;
			foreach( $arrAssoc_field_fieldType as $field_name => $field_type ) {
				if( $is_first )
					$is_first = FALSE ;
				else
					$query.= ',' ;
					
				$query.= "`{$field_name}` {$field_type} NOT NULL" ;
			}
			foreach( $arr_model_keys as $key_name => $key_desc ) {
				if( $is_first )
					$is_first = FALSE ;
				else
					$query.= ',' ;
				
				if( $key_name == 'PRIMARY' ) {
					$query.= "PRIMARY KEY " ;
				} elseif( $key_desc['non_unique'] == 'O' ) {
					$query.= "UNIQUE `$key_name`" ;
				} else {
					$query.= "INDEX `$key_name`" ;
				}
				$query.= "(" ;
				$is_first_k=TRUE ;
				foreach( $key_desc['arr_columns'] as $column )
				{
					if( !$is_first_k )
						$query.= ',' ;
					$query.= '`'.$column.'`' ;
					$is_first_k = FALSE ;
				}
				$query.= ")" ;
			}
			$query.= ")" ;
			$_opDB->query($query) ;
		}
		else
		{
			$arr_model_fields = array() ;
			foreach( $arrAssoc_field_fieldType as $field_name => $field_type ) {
				$arr_model_fields[] = array($field_name,$field_type,'NO') ;
			}
		
			$arr_existing_fields = array() ;
			$query = "SHOW COLUMNS FROM {$mysql_db}.{$db_table} " ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
				$arr_existing_fields[] = $arr ;
			}
			foreach( $arr_existing_fields as $desc_field_existing )
			{
				$existing_field = $desc_field_existing[0] ;
				foreach( $arr_model_fields as $desc_field_model )
				{
					if( $existing_field == $desc_field_model[0] )
						continue 2 ;
				}
				if( !$drop_allowed ) {
					continue ;
				}
				
				$query = "ALTER TABLE {$mysql_db}.{$db_table} DROP `$existing_field`" ;
				$_opDB->query($query) ;
			}
			foreach( $arr_model_fields as $field_id => $desc_field_model )
			{
				$desc_field_existing = NULL ;
				foreach( $arr_existing_fields as $cur_field )
				{
					if( $cur_field[0] == $desc_field_model[0] )
					{
						$desc_field_existing = $cur_field ;
						break ;
					}
				}
				if( !$desc_field_existing )
				{
					//after WHAT ?
					$after_field = '' ;
					if( $field_id >= 1 )
					{
						$f = $field_id - 1 ;
						$tmpdesc = $arr_model_fields[$f] ;
						$after_field = $tmpdesc[0] ;
					}
					// ajout du champs
					$query = "ALTER TABLE {$mysql_db}.{$db_table} ADD `{$desc_field_model[0]}` $desc_field_model[1]" ;
					if( strtoupper($desc_field_model[2]) == 'NO' )
					{
						$query.= " NOT NULL" ;
					}
					if( $desc_field_model[4] && $desc_field_model[4] != 'NULL' ) {
						$query.= " DEFAULT '{$desc_field_model[4]}'" ;
					}
					if( $after_field )
					{
						$query.= " AFTER `$after_field`" ;
					}
					else
					{
						$query.= " FIRST" ;
					}
					$_opDB->query($query) ;
					
					//continue 
					continue ;
				}
				if( $desc_field_existing[1] != $desc_field_model[1] || $desc_field_existing[2] != $desc_field_model[2] || $desc_field_existing[5] != $desc_field_model[5] )
				{
					$query = "ALTER TABLE {$mysql_db}.{$db_table} CHANGE `{$desc_field_existing[0]}` `{$desc_field_model[0]}` $desc_field_model[1]" ;
					if( strtoupper($desc_field_model[2]) == 'NO' )
					{
						$query.= " NOT NULL" ;
					}
					else
					{
						$query.= " NULL" ;
					}
					if( $desc_field_model[4] && $desc_field_model[4] != 'NULL' ) {
						$query.= " DEFAULT '{$desc_field_model[4]}'" ;
					}
					
					$_opDB->query($query) ;
					
					//continue 
					continue ;
				}
			
			}
		
		
		
		
		
		
			$arr_existing_keys = array() ;
			$query = "SHOW KEYS FROM {$mysql_db}.{$db_table} " ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_row($result)) != FALSE )
			{
				$key_name = $arr[2] ;
				$non_unique = $arr[1] ;
				$column_name = $arr[4] ;
				$arr_existing_keys[$key_name]['non_unique'] = $non_unique ;
				$arr_existing_keys[$key_name]['arr_columns'][] = $column_name ;
			}
			foreach($arr_existing_keys as $existing_key_name => $existing_key )
			{
				
				if( !$arr_model_keys[$existing_key_name] )
				{
					$query = "ALTER TABLE {$mysql_db}.{$db_table} " ;
					$query.= " DROP" ;
					if( $existing_key_name == 'PRIMARY' )
						$query.= " PRIMARY KEY" ;
					else
						$query.= " INDEX `$existing_key_name`" ;
							
					$_opDB->query($query) ;
				}
			}
		
			foreach($arr_model_keys as $model_key_name => $model_key )
			{
				$_create = $_drop = FALSE ;
				if( !$arr_existing_keys[$model_key_name] )
				{
					// create
					$_create = TRUE ;
				}
				else
				{
				$existing_key = $arr_existing_keys[$model_key_name] ;
				if( $model_key != $existing_key )
				{
					$_create = TRUE ;
					$_drop = TRUE ;
				}
				}
				
				if( $_create )
				{
					$query = "ALTER TABLE {$mysql_db}.{$db_table} " ;
					if( $_drop )
					{
						$query.= " DROP" ;
						if( $model_key_name == 'PRIMARY' )
							$query.= " PRIMARY KEY" ;
						else
							$query.= " INDEX `$model_key_name`" ;
						$query.= "," ;
					}
					$query.= " ADD" ;
					if( $model_key_name == 'PRIMARY' )
						$query.= " PRIMARY KEY" ;
					elseif( $model_key['non_unique'] == '0' )
						$query.= " UNIQUE `$model_key_name`" ;
					else
						$query.= " INDEX `$model_key_name`" ;
					$query.= "(" ;
					$is_first=TRUE ;
					foreach( $model_key['arr_columns'] as $column )
					{
						if( !$is_first )
							$query.= ',' ;
						$query.= '`'.$column.'`' ;
						$is_first = FALSE ;
					}
					$query.= ")" ;
					
					$_opDB->query($query) ;
				}
			}
		}
	}
	
	
	
	
	public static function dump_DB( $handle, $db_name ) {
		global $_opDB ;

		$arr_db_tabs = array() ;
		$query = "SHOW FULL TABLES FROM {$db_name}" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE )
		{
			if( $arr[1] && $arr[1] != 'BASE TABLE' ) {
				continue ;
			}
			$arr_db_tabs[] = $arr[0] ;
		}
		
		foreach( $arr_db_tabs as $db_table )
		{
			self::dump_DBtable( $handle, $db_name, $db_table ) ;
		}
	}
	private static function dump_DBtable( $handle, $db_name, $db_table ) {
		global $_opDB ;
		
		fwrite($handle,"***BEGIN_TABLE**{$db_table}***\r\n") ;
		
		$arr_columns = array() ;
		$query = "SHOW COLUMNS FROM {$db_name}.{$db_table}" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE )
		{
			$arr_columns[] = $arr[0] ;
		}
		fwrite($handle,implode(',',$arr_columns)."\r\n") ;

		$query = "SELECT * FROM {$db_name}.{$db_table}" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE )
		{
			fputcsv( $handle , $arr , ',' ,'"') ;
		}
	}
	
	public static function feed_DB( $handle, $db_name, $skip_store=FALSE ) {
		global $_opDB ;
		$dst_db = $db_name ;
		
		$result = $_opDB->query("SHOW VARIABLES LIKE 'max_allowed_packet'") ;
		$arr = $_opDB->fetch_row($result) ;
		$max_packet_size = $arr[1] ;
		if( !$max_packet_size ) {
			$max_packet_size = (1024 * 1024) ;
		}
		$max_packet_size = $max_packet_size * 0.9 ;
		
		$query = "SHOW FULL TABLES FROM $dst_db " ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE )
		{
			if( $arr[1] && $arr[1] != 'BASE TABLE' ) {
				continue ;
			}
			
			$query = "TRUNCATE TABLE {$dst_db}.{$arr[0]}" ;
			$_opDB->query($query) ;
			
			$arr_dst_tables[] = $arr[0] ;
		}

		// integration du fichier CSV
		while( !feof($handle) )
		{
			$arrcsv = fgetcsv($handle) ;
			if( !$arrcsv )
				continue ;
			
			if( count($arrcsv) == 1 )
			{
				if( $tmpfname ) {
					fclose($handle_infile) ;
					$query = "LOAD DATA LOCAL INFILE '{$tmpfname}' INTO TABLE {$dst_db}.{$current_table} 
						FIELDS TERMINATED BY ','
						OPTIONALLY ENCLOSED BY '\"'
						ESCAPED BY '\\\\'
						LINES TERMINATED BY '\n'" ;
					$_opDB->query($query) ;
					unlink($tmpfname) ;
					$tmpfname = '' ;
				}
			
				$table_str = current($arrcsv) ;
				$table_str = substr($table_str,3,strlen($table_str)-6) ;
				$tarr = explode('**',$table_str) ;
				$current_table = $tarr[1] ;
				
				// plan de la table dans le csv ?
				$map_csv = fgetcsv($handle) ;
				
				
				
				// plan de la table dans la base destination ?
				$map = array() ;
				
				if( !in_array($current_table,$arr_dst_tables) )
					continue ;
					
				$query = "TRUNCATE TABLE {$dst_db}.{$current_table}" ;
				$_opDB->query($query) ;
				
				$query = "SHOW COLUMNS FROM {$dst_db}.{$current_table}" ;
				$result = $_opDB->query($query) ;
				while( ($arr = $_opDB->fetch_row($result)) != FALSE )
				{
					$field_name = $arr[0] ;
					
					reset($map_csv) ;
					foreach( $map_csv as $csv_pos => $csv_field )
					{
						if( $field_name == $csv_field )
						{
							$map[] = $csv_pos ;
							continue 2 ;
						}
					}
					$map[] = -1 ;
				}
				continue ;
			}
			
			// print_r($map) ;
			if( !in_array($current_table,$arr_dst_tables) )
				continue ;
			if( $skip_store && strpos($current_table,'store_')===0 ) {
				continue ;
			}
			
			
			if( !$tmpfname ) {
				$tmpfname = tempnam( sys_get_temp_dir(), "FOO");
				$handle_infile = fopen($tmpfname,'wb') ;
			}
			
			$arrcsv_infile = array() ;
			foreach( $map as $csv_pos ) {
				$arrcsv_infile[] = $arrcsv[$csv_pos] ;
			}
			fputcsv($handle_infile,$arrcsv_infile) ;
		}

		if( $tmpfname ) {
			fclose($handle_infile) ;
			$query = "LOAD DATA LOCAL INFILE '{$tmpfname}' INTO TABLE {$dst_db}.{$current_table} 
				FIELDS TERMINATED BY ','
				OPTIONALLY ENCLOSED BY '\"'
				ESCAPED BY '\\\\'
				LINES TERMINATED BY '\n'" ;
			$_opDB->query($query) ;
			unlink($tmpfname) ;
			$tmpfname = '' ;
		}
	}
	
	
	public static function clone_DB( $src_db, $dst_db, $skip_store=FALSE ) {
		global $_opDB ;
		
		$query = "SHOW FULL TABLES FROM $src_db " ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE )
		{
			if( $arr[1] && $arr[1] != 'BASE TABLE' ) {
				continue ;
			}
			
			$query = "DROP TABLE IF EXISTS {$dst_db}.{$arr[0]}" ;
			$_opDB->query($query) ;
			
			$query = "CREATE TABLE {$dst_db}.{$arr[0]} LIKE {$src_db}.{$arr[0]}" ;
			$_opDB->query($query) ;
			
			$query = "INSERT INTO {$dst_db}.{$arr[0]} SELECT * FROM {$src_db}.{$arr[0]}" ;
			$_opDB->query($query) ;
		}
	}
	
}
?>
