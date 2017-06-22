<?php
if ( !class_exists('MySQL_DB') )
{

/*
function getmicrotime()
 { 
    list($usec, $sec) = explode(" ", microtime());
    return ((float)$usec + (float)$sec);
 }
 */

class MySQL_DB {

	var $type_de_base ;
	var $connection ;
	var $db_name ;
	
	var $is_quiet = FALSE ;

	var $results = array();

	var $nb_queries = 0 ;


	function connect_mysql( $host, $db, $user, $pass ) {
		$this->connection = @mysql_connect( $host, $user, $pass, TRUE ) or die( "impossible d'ouvrir la base de donn�es\n" ); 
		if( $db != NULL )
			@mysql_select_db( $db, $this->connection ) or die( "impossible d'ouvrir la base de donn�es\n" );
		$this->type_de_base = "MySQL" ;
		$this->db_name = $db ;
		
		// echo "CONNECT !!!" ;
		//mysql_query( "SET storage_engine=MYISAM", $this->connection ) ;
		
		if( $db ) {
			foreach( $this->db_tables(NULL) as $dbtab )
			{
				$query = "SELECT count(*) FROM $dbtab" ;
				if( !$this->query($query) )
				{
					die("DB corruption !!! Contact support.<br>\n") ;
				}
			}
		}
		$this->nb_queries = 0 ;
	}
	function connect_mysql_nocheck( $host, $db, $user, $pass ) {
		$this->connection = @mysql_connect( $host, $user, $pass, TRUE ) or die( "impossible d'ouvrir la base de donn�es\n" ); 
		if( $db != NULL )
			@mysql_select_db( $db, $this->connection ) or die( "impossible d'ouvrir la base de donn�es\n" );
		$this->type_de_base = "MySQL" ;
		$this->db_name = $db ;
		
		//mysql_query( "SET storage_engine=MYISAM", $this->connection ) ;
	}

	function connect_pgsql( $host, $db, $user, $pass ) {
		$this->connection = pg_connect( $host, $db, $user, $pass );
		$this->type_de_base = "PostgreSQL" ;
		$this->db_name = $db ;
	}

	function disconnect() {
		switch ($this->type_de_base) {
			case "MySQL" :
			mysql_close( $this->connection );
			break;

			case "PostgreSQL" :
			pg_close( $this->connection );
			break;
		}
	}
	
	function select_db( $db_name )
	{
		if( @mysql_select_db( $db_name, $this->connection ) )
			return TRUE ;
		return FALSE ;
	}
	
	function no_query_errors_ON() {
		$this->is_quiet = TRUE ;
	}
	function no_query_errors_OFF() {
		$this->is_quiet = FALSE ;
	}

	function query( $query ) {
		$this->nb_queries++ ;
		switch ($this->type_de_base) {
			case "MySQL" :
			// echo $query."<br>" ;
			$result = mysql_query( $query, $this->connection ) ;
			if ( !$result && $this->is_quiet == FALSE )
			{
				echo("<b>ERROR&nbsp;</b>$query<br>\n");
				echo '<b>'.$this->last_error_no().'</b> '.$this->last_error()."<br>\n" ;
			}
			/*
			if( $this->last_error_no() == 145 )
				$this->disconnect() ;
			*/
			return $result ;
			break;

			case "PostgreSQL" :
			return pg_query( $this->connection, $query );
			break ;
		}
	}
	function escape_string( $query ) {
		switch ($this->type_de_base) {
			case "MySQL" :
			return mysql_real_escape_string( $query, $this->connection ) ;
			break;

			case "PostgreSQL" :
			return $query ;
			break ;
		}
	}
	function query_unbuf( $query ) {
		$query."<br>" ;
		$this->nb_queries++ ;
		switch ($this->type_de_base) {
			case "MySQL" :
			//echo $query."<br>" ;
			$result = mysql_unbuffered_query( $query, $this->connection ) ;
			if ( !$result && $this->is_quiet == FALSE )
			{
				echo("<b>ERROR&nbsp;</b>$query<br>\n");
				echo $this->last_error()."<br>\n" ;
			}
			return $result ;
			break;

			case "PostgreSQL" :
			return pg_query( $this->connection, $query );
			break ;
		}
	}

	function query_nextval( $sequence_name ) {
		switch ($this->type_de_base) {
			case "MySQL" :
			$query = "UPDATE sequences SET nextval=nextval+1 WHERE sequence='$sequence_name' " ;
			$this->query( $query) ;
			$query = "SELECT nextval FROM sequences WHERE sequence='$sequence_name' " ;
			return $this->query( $query ) ;
			break ;

			case "PostgreSQL" :
			$query = "SELECT nextval( '$sequenceName' )" ;
			return $this->query( $query );
			break;
		}
	}

	function query_uniqueValue( $query ) {
		switch ($this->type_de_base) {
			case "MySQL" :
			$result = $this->query( $query );
			if( !$result )
				return NULL ;
			$arr = $this->fetch_row( $result );
			return $arr[0] ;
			break ;
		}
	}


	function query_makeWhereClause( $arr_src, $alias ) {
		foreach( $arr_src as $key => $value )
			if( substr( $key, 0,1 ) != '_' && !( in_array($value, array('', '%'))) )
				$arr[$key] = $value ;

		// cas tableau vide
		if( count($arr) == 0 || gettype( $arr ) != 'array' )
			return '' ;

		if ( ($alias=trim($alias)) != '' )
			$alias.= '.' ;
		foreach( $arr as $key => $value )
		{
			$value = addslashes( $value );
			if( $key[0] == '!' )
			{
				$key = substr( $key,1,strlen($key) );
				$where.= $alias."$key NOT LIKE '$value' AND ";
			}
			else
				$where.= $alias."$key LIKE '$value' AND ";
		}
		if ($where != '')
			$where = substr_replace( $where, '', -4 ) ;

		return "WHERE ".$where ;
	}


	function query_makeWhereClause_multi( $arr_src, $alias ) {
		foreach( $arr_src as $key => $value )
			if( substr( $key, 0,1 ) != '_' && !( in_array($value, array('', '%'))) )
				$arr[$key] = $value ;

		// cas tableau vide
		if( count($arr) == 0 || gettype( $arr ) != 'array' )
			return '' ;

		if ( ($alias=trim($alias)) != '' )
			$alias.= '.' ;
		foreach( $arr as $key => $values )
		{
			$arr_value = explode( '|',$values );

			switch( count($arr_value) )
			{
				case 1 :
				$value = current( $arr_value ) ;
				if( $key[0] == '!' )
				{
					$key = substr( $key,1,strlen($key) );
					$value = addslashes( $value );
					$where.= $alias."$key NOT LIKE '$value' AND ";
				}
				else
				{
					$value = addslashes( $value );
					$where.= $alias."$key LIKE '$value' AND ";
				}
				break ;

				default :
				$where.= '(' ;
				foreach( $arr_value as $value )
				{
					if( $key[0] == '!' )
					{
						$key = substr( $key,1,strlen($key) );
						$where.= $alias."$key NOT LIKE '$value' OR ";
					}
					else
						$where.= $alias."$key LIKE '$value' OR ";
				}
				$where = substr_replace( $where, '', -3 ) ;
				$where.= ') AND ' ;
				break ;
			}
		}
		if ($where != '')
			$where = substr_replace( $where, '', -4 ) ;

		return "WHERE ".$where ;
	}



	function query_makeSQLlist( $query ) {
		/*
		$result = $this->query( $query);
		$list = "(";
		while( ($arr = $this->fetch_row( $result )) != FALSE )
			$list.= "'".$arr[0]."'," ;
		$list = $this->rm_last( $list );
		$list.= ")" ;
		return $list;
		*/

		return $this->makeSQLlist( $this->query_makeArray( $query )) ;

	}

	function makeSQLlist( $arr ) {
		if( !is_array($arr) || count($arr) == 0 )
			return "(NULL)" ;

		reset( $arr );
		$list = "(";
		while( ($each = each($arr)) != FALSE )
			$list.= "'".$each['value']."'," ;
		$list = $this->rm_last( $list );
		$list.= ")" ;
		return $list;
	}

	function query_makeArray( $query ) {
		$result = $this->query( $query );
		$my_arr = array();
		while( ($arr = $this->fetch_row( $result )) != FALSE )
			array_push( $my_arr, $arr[0] );
		return $my_arr ;
	}

	function fetch_assoc( $result ) {
		switch ($this->type_de_base) {
			case "MySQL" :
			$arr = mysql_fetch_assoc( $result );
			/*
			if( $arr != FALSE )
			{
				foreach( $arr as $key => $value )
					$arr[$key] = stripslashes( $value ) ;
			}
			*/
			return $arr ;
			break ;

			case "PostgreSQL" :
			return pg_fetch_assoc( $result );
			break;
		}
	}
	
	function fetch_row( $result ) {
		switch ($this->type_de_base) {
			case "MySQL" :
			return mysql_fetch_row( $result );
			break ;

			case "PostgreSQL" :
			return pg_fetch_row( $result );
			break;
		}
	}

	function reset_result( $result ) {
		switch ($this->type_de_base) {
			case "MySQL" :
			if( mysql_num_rows( $result ) > 0 )
				mysql_data_seek( $result, 0 ) ;
			break ;
		}
	}


	function num_rows( $result ) {
		switch ($this->type_de_base) {
			case "MySQL" :
			return mysql_num_rows( $result );
			break ;

			case "PostgreSQL" :
			return pg_num_rows( $result );
			break;
		}
	}


	function affected_rows( $result ) {
		switch ($this->type_de_base) {
			case "MySQL" :
			return mysql_affected_rows( $this->connection );
			break ;

			case "PostgreSQL" :
			return pg_affected_rows( $result );
			break ;
		}
	}


	function last_error() {
		switch ($this->type_de_base) {
			case "MySQL" :
			return mysql_error( $this->connection );
			break ;

			case "PostgreSQL" :
			return pg_last_error( $this->connection );
			break;
		}
	}
	function last_error_no() {
		switch ($this->type_de_base) {
			case "MySQL" :
			return mysql_errno( $this->connection );
			break ;

			case "PostgreSQL" :
			return NULL ;
			break;
		}
	}


	function rm_last($string){
		$num = strlen($string);
		// $string = substr_replace($string,"",($num-1),($num+1));
		$string = substr($string,0,$num-1) ;
		return $string;
	}


	function table_fields( $table ) {
		switch ($this->type_de_base) {
			case "MySQL" :
			/*
			if( $db_name == '' )
				$db_name= $this->db_name ;
			*/
			$query = "SHOW COLUMNS FROM $table" ;
			$result = mysql_query($query, $this->connection) ;
if (!$result) {
    echo 'Could not run query: ' . mysql_error();
    }
 			$arr_fields = array() ;
			while ($row = mysql_fetch_assoc($result)) {
				$arr_fields[] = $row['Field'] ;
			}
			return $arr_fields ;
			
			
			
			// $fields = mysql_list_fields( NULL , $table, $this->connection ) ;
			$nb_fields = mysql_num_fields( $fields ) ;
			$arr_fields = array();
			for( $i=0 ; $i < $nb_fields ; $i++ )
				array_push( $arr_fields, mysql_field_name( $fields, $i ) );
		
			return $arr_fields ;
			break ;

			case "PostgreSQL" :
			$query = "SELECT a.attname
					FROM pg_catalog.pg_attribute a
					JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
					WHERE c.relname = '$table' AND a.attnum > 0 AND NOT a.attisdropped
					ORDER by a.attnum" ;
			$result = pg_query( $connection, $query) ;
			if ( !$result) {
				echo ("Table inexistante !");
				exit;
			}
			$table_fields = array() ;
			while ( ($arr = pg_fetch_array($result)) != FALSE )
				array_push( $table_fields, $arr[0] );
			return $table_fields ;
			break ;
		}
	}
	
	function db_tables( $db_name=NULL )
	{
		switch ($this->type_de_base) {
			case "PostgreSQL" :
			return array() ;
			break ;

			case "MySQL" :
			$query = "SHOW TABLES" ;
			if( $db_name != '' )
				$query.= " FROM ".$db_name ;
			$tables = mysql_query($query, $this->connection) ;
			$arr_tables = array() ;
			while( $table = mysql_fetch_row($tables) )
				array_push( $arr_tables, $table[0] ) ;
			@mysql_select_db( $this->db_name, $this->connection ) ;
			return $arr_tables ;
		}
	}

	function mysql_dbs()
	{
		switch ($this->type_de_base) {
			case "PostgreSQL" :
			return array() ;
			break ;

			case "MySQL" :
			$res = mysql_list_dbs ( $this->connection ) ;
			$arr_dbs = array() ;
			while( $arr = mysql_fetch_row($res) )
				array_push( $arr_dbs, $arr[0] ) ;
			return $arr_dbs ;
		}
	}


	function insert( $table, $arr) {
		switch ($this->type_de_base) {
			case "MySQL" :
    			$table = trim($table);
    			$keys = join(',', array_keys($arr));
    			$values = array();
    			foreach(array_values($arr) as $value) {
    			    $values[] = "'".mysql_real_escape_string( $value, $this->connection)."'";
    			}
    			$values = join(',',$values);
    			$sql="INSERT INTO $table ($keys) VALUES ($values)";
        		return $this->query_unbuf($sql);
			break ;

			case "PostgreSQL" :
    			pg_insert( $table, $arr );
	    		break;
		}
	}
	function replace( $table, $arr) {
		switch ($this->type_de_base) {
			case "MySQL" :
    			$table = trim($table);
    			$keys = join(',', array_keys($arr));
    			$values = array();
    			foreach(array_values($arr) as $value) {
    			    $values[] = "'".mysql_real_escape_string( $value, $this->connection)."'";
    			}
    			$values = join(',',$values);
    			$sql="REPLACE INTO $table ($keys) VALUES ($values)";
        		return $this->query_unbuf($sql);
			break ;

			case "PostgreSQL" :
    			pg_insert( $table, $arr );
	    		break;
		}
	}
	function insert_id()
	{
		switch ($this->type_de_base) {
			case "MySQL" :
			return mysql_insert_id( $this->connection ) ;
			break ;



			case "PostgreSQL" :
			return 0 ;
			break;
		}
	}


	function update( $table, $arr, $arr_condition ) {
		switch ($this->type_de_base) {
			case "MySQL" :
			if ( count($arr) < 1  )
				return -1 ;

			$table = trim( $table );

            $update = '';
			foreach ( $arr as $key => $value ) {
				$update.= $key.' = "'.mysql_real_escape_string($value, $this->connection).'",' ;
		    }
			$update = $this->rm_last($update) ;

			if( $arr_condition != NULL && count( $arr_condition ) > 0 )
			{
			    $condition = '';
				foreach ( $arr_condition as $key => $value ) {
					$condition .= $key.' = "'.mysql_real_escape_string($value, $this->connection).'" AND ' ;
				}
				$condition = $this->rm_last($condition) ;
				$condition = $this->rm_last($condition) ;
				$condition = $this->rm_last($condition) ;
				$condition = $this->rm_last($condition) ;

				$where_condition = " WHERE $condition" ;
			}
			else
				$where_condition = "" ;

			$sql = "UPDATE $table SET $update $where_condition" ;
			return $this->query_unbuf( $sql );
			break ;


			case "PostgreSQL" :
			pg_update( $table, $arr, $arr_update );
			break;
		}
	}

	function delete( $table, $arr_condition ) {
		switch ($this->type_de_base) {
			case "MySQL" :
			if ( !$arr_condition || count($arr_condition) < 1 )
				return -1 ;

			$table = trim( $table );
			
			if( $arr_condition != NULL && count( $arr_condition ) > 0 )
			{
			    $condition = '';
				foreach ( $arr_condition as $key => $value ) {
					$condition .= $key.' = "'.mysql_real_escape_string($value, $this->connection).'" AND ' ;
				}
				$condition = $this->rm_last($condition) ;
				$condition = $this->rm_last($condition) ;
				$condition = $this->rm_last($condition) ;
				$condition = $this->rm_last($condition) ;

				$where_condition = " WHERE $condition" ;
			}
			
			$sql = "DELETE from $table  $where_condition" ;
			return $this->query( $sql );
			break ;
		}
	}
	
	function getNbQueries()
	{
		return $this->nb_queries ;
	}
	
	
	
	
	
	
	function multi_insert( $table, $TAB )
	{
		switch( $this->type_de_base )
		{
			case "MySQL" :
				$query = "SHOW VARIABLES LIKE 'max_allowed_packet'" ;
				$result = $this->query($query) ;
				$arr =  $this->fetch_row($result) ;
				$max_length = $arr[1] ;
				
				reset($TAB) ;
				while(TRUE)
				{
					$length = 0 ;
					
					$str = 'INSERT INTO '.$table.' VALUES ' ;
					$length+= strlen($str) ;
					
					$first1=TRUE ;
					while( TRUE )
					{
						
						if( !$stri )
						{
							$arr = current($TAB) ;
							if( $arr === FALSE )
							{
								$_END = TRUE ;
								break ;
							}
							next($TAB) ;
							
							$stri = "(" ;
							$first2 = TRUE ;
							foreach( $arr as $value )
							{
								if( !$first2 )
									$stri.= ',' ;
								$first2 = FALSE ;
								$stri.= "'".$value."'" ;
							}
							$stri.= ")" ;
						}
						
						
						if( strlen($stri)+$length < $max_length )
						{
							if( !$first1 )
							{
								$str.= ',' ;
								$length++ ;
							}
							$first1 = FALSE ;
							
							$length += strlen($stri) ;
							$str.= $stri ;
							$stri = '' ;
						}
						else
						{
							break ;
						}
					}
				
					if( !$first1 )
						$this->query($str) ;
					
					//echo $str."\n\n\n" ;
					/*
					if( !$_END )
					{
						echo "length=$length\n\n\n" ;
						sleep(5) ;
					}
					*/
					
					if( $_END )
						break ;
				}
				
				
			break ;
			
			
		
		}
	}



}

}
?>
