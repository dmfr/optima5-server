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
		
		if( !$_opDB->select_db( $tmpdb ) )
		{
			echo "ERROR selecting $tmpdb\n" ;
			return FALSE ;
		}
		
		$buf = '' ;
		while(TRUE)
		{
			if( feof($handle) )
				break ;
			$str = fgets($handle) ;
			if( substr($str,0,2) == '--' )
				continue ;
			if( trim($str) == '' )
				continue ;
				
			if( strpos($str,';') )
			{
				$tarr = explode(';',$str) ;
				$buf.= $tarr[0] ;
				$buf.= ';'."\r\n" ;
				//echo $buf ;
				$_opDB->query($buf) ;
				
				$buf = '' ;
				continue ;
			}
			
			
			$buf.= trim($str,"\r\n") ;
		}
		
		if( !$_opDB->select_db( $mysql_db ) )
		{
			echo "ERROR selecting mysql\n" ;
			return FALSE ;
		}
		
		
		
		/*
		**** PARTIE 1 : comparaison des tables *****
		*/
		$arr_model_tables = array() ;
		$query = "SHOW TABLES FROM $tmpdb" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE )
			$arr_model_tables[] = $arr[0] ;
		
		$arr_existing_tables = array() ;
		$query = "SHOW TABLES FROM $mysql_db" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE )
			$arr_existing_tables[] = $arr[0] ;
			
		foreach( $arr_model_tables as $db_table )
		{
			if( !in_array($db_table,$arr_existing_tables) )
			{
				$query = "CREATE TABLE {$mysql_db}.{$db_table} LIKE {$tmpdb}.{$db_table}" ;
				$_opDB->query($query) ;
			}
		}
		
		
		// ********* Partie X : conversion vers UTF8 **********
		$query = "ALTER DATABASE CHARACTER SET UTF8 COLLATE utf8_unicode_ci" ;
		$_opDB->query($query) ;
		
		
		foreach( $arr_existing_tables as $db_table )
		{
			$query = "ALTER TABLE $db_table CHARACTER SET UTF8 COLLATE utf8_unicode_ci" ;
			$_opDB->query($query) ;
		
			$query = "ALTER TABLE $db_table CONVERT TO CHARACTER SET UTF8 COLLATE utf8_unicode_ci" ;
			$_opDB->query($query) ;
		}
		// ************************
		
		
		
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
					elseif( $existing_key['non_unique'] == '0' )
						$query.= " INDEX `$existing_key_name`" ;
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
						elseif( $existing_key['non_unique'] == '0' )
							$query.= " INDEX `$model_key_name`" ;
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
					$query.= "INDEX " ;
				} else {
					$query.= "INDEX " ;
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
					elseif( $existing_key['non_unique'] == '0' )
						$query.= " INDEX `$existing_key_name`" ;
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
						elseif( $existing_key['non_unique'] == '0' )
							$query.= " INDEX `$model_key_name`" ;
						else
							$query.= " INDEX `$model_key_name`" ;
						$query.= "," ;
					}
					$query.= " ADD" ;
					if( $model_key_name == 'PRIMARY' )
						$query.= " PRIMARY KEY" ;
					elseif( $model_key['non_unique'] == '0' )
						$query.= " INDEX `$model_key_name`" ;
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
	
}
?>