<?php

function paracrm_queries_qsqlTransaction( $post_data ) {
	if( $post_data['_action'] == 'queries_qsqlTransaction' && $post_data['_subaction'] == 'init' )
	{
		// ouverture transaction
		$transaction_id = $_SESSION['next_transaction_id']++ ;
		
		$_SESSION['transactions'][$transaction_id] = array() ;
		$_SESSION['transactions'][$transaction_id]['transaction_code'] = 'paracrm_queries_qsqlTransaction' ;
		
		$arr_saisie = array() ;
		$arr_saisie['target_file_code'] = $post_data['target_file_code'] ;
		$_SESSION['transactions'][$transaction_id]['arr_saisie'] = $arr_saisie ;
		$_SESSION['transactions'][$transaction_id]['arr_RES'] = array() ;
		
		$post_data['_transaction_id'] = $transaction_id ;
	}
	
	
	if( $post_data['_action'] == 'queries_qsqlTransaction' && $post_data['_transaction_id'] )
	{
		if( !$_SESSION['transactions'][$post_data['_transaction_id']] )
			return NULL ;
		$transaction_id = $post_data['_transaction_id'] ;
		$arr_transaction = $_SESSION['transactions'][$transaction_id] ;
		if( $arr_transaction['transaction_code'] != 'paracrm_queries_qsqlTransaction' )
			return NULL ;
			
		$arr_saisie = $arr_transaction['arr_saisie'] ;
		
		if( $post_data['_subaction'] == 'init' )
		{
			$json =  paracrm_queries_qsqlTransaction_init( $post_data , $arr_saisie ) ;
		}
		if( $post_data['_subaction'] == 'run' )
		{
			$json =  paracrm_queries_qsqlTransaction_runQuery( $post_data , $arr_saisie ) ;
		}
		if( $post_data['_subaction'] == 'submit' )
		{
			$json =  paracrm_queries_qsqlTransaction_submit( $post_data , $arr_saisie ) ;
		}
		if( $post_data['_subaction'] == 'save' || $post_data['_subaction'] == 'saveas' || $post_data['_subaction'] == 'delete' )
		{
			$json =  paracrm_queries_qsqlTransaction_save( $post_data , $arr_saisie ) ;
		}
		
		if( $post_data['_subaction'] == 'res_get' )
		{
			$json =  paracrm_queries_qsqlTransaction_resGet( $post_data ) ;
		}
		if( $post_data['_subaction'] == 'exportXLS' )
		{
			$json =  paracrm_queries_qsqlTransaction_exportXLS( $post_data, $arr_saisie ) ;
		}
		
		if( $post_data['_subaction'] == 'end' )
		{
			unset($_SESSION['transactions'][$transaction_id]) ;
			return array('success'=>true) ;
		}
		
		if( $post_data['_subaction'] == 'chart_cfg_load' ) {
			return array('success'=>true,'enabled'=>false) ;
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

function paracrm_queries_qsqlTransaction_init( $post_data , &$arr_saisie ) {
	global $_opDB ;
	
	if( $post_data['qsql_id'] && !is_numeric($post_data['qsql_id']) ) {
		$query = "SELECT qsql_id FROM query WHERE qsql_name='{$post_data['qsql_id']}'" ;
		$post_data['qsql_id'] = $_opDB->query_uniqueValue($query) ;
	}
	
	/*
	************ INITIALISATION *********
	- structure 'tree' du fichier
	- remplissage des champs
	*******************************
	*/
	if( $post_data['is_new'] == 'true' )
	{
		$arr_saisie['sql_querystring'] = '' ;
	}
	elseif( $post_data['qsql_id'] > 0 )
	{
		$query = "SELECT * FROM qsql WHERE qsql_id='{$post_data['qsql_id']}'" ;
		$result = $_opDB->query($query) ;
		$arr = $_opDB->fetch_assoc($result) ;
		if( !$arr )
		{
			$transaction_id = $post_data['_transaction_id'] ;
			unset($_SESSION['transactions'][$transaction_id]) ;
			return array('success'=>false) ;
		}
		$arr_saisie['qsql_id'] = $arr['qsql_id'] ;
		$arr_saisie['qsql_name'] = $arr['qsql_name'] ;
		$arr_saisie['sql_querystring'] = $arr['sql_querystring'] ;
	}
	else
	{
		$transaction_id = $post_data['_transaction_id'] ;
		unset($_SESSION['transactions'][$transaction_id]) ;
		return array('success'=>false) ;
	}
	
	return array(
		'success'=>true,
		'transaction_id' => $post_data['_transaction_id'],
		'data' => array(
			'qsql_id' => $arr_saisie['qsql_id'],
			'qsql_name' => $arr_saisie['qsql_name'],
			'data_sqlquerystring' => $arr_saisie['sql_querystring'],
			'db_schema' => paracrm_queries_qsql_lib_getTables()
		)
	) ;
}
function paracrm_queries_qsqlTransaction_submit( $post_data , &$arr_saisie )
{
	global $_opDB ;
	
	$arr_saisie['sql_querystring'] = json_decode($post_data['data_sqlquerystring'],true) ; 

	return array('success'=>true) ;
}
function paracrm_queries_qsqlTransaction_save( $post_data , &$arr_saisie )
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
		if( !$arr_saisie['qsql_id'] )
			return array('success'=>false) ;
		
		$arr_cond = array() ;
		$arr_cond['qsql_id'] = $arr_saisie['qsql_id'] ;
		$arr_update = array() ;
		$arr_update['sql_querystring'] = $arr_saisie['sql_querystring'] ;
		$_opDB->update('qsql',$arr_update,$arr_cond) ;
		return array('success'=>true,'qsql_id'=>$arr_saisie['qsql_id']) ;
	}

	if( $post_data['_subaction'] == 'saveas' )
	{
		$arr_ins = array() ;
		$arr_ins['qsql_name'] = $post_data['qsql_name'] ;
		$_opDB->insert('qsql',$arr_ins) ;
		
		$arr_saisie['qsql_id'] = $_opDB->insert_id() ;
		
		$arr_cond = array() ;
		$arr_cond['qsql_id'] = $arr_saisie['qsql_id'] ;
		$arr_update = array() ;
		$arr_update['sql_querystring'] = $arr_saisie['sql_querystring'] ;
		$_opDB->update('qsql',$arr_update,$arr_cond) ;
		return array('success'=>true,'qsql_id'=>$arr_saisie['qsql_id']) ;
	}
	
	
	if( $post_data['_subaction'] == 'delete' )
	{
		if( !$arr_saisie['qsql_id'] )
			return array('success'=>false) ;
		
		$tables = array() ;
		$tables[] = 'qsql' ;
		foreach( $tables as $dbtab )
		{
			$query = "DELETE FROM $dbtab WHERE qsql_id='{$arr_saisie['qsql_id']}'" ;
			$_opDB->query($query) ;
		}
		
		return array('success'=>true) ;
	}
}


function paracrm_queries_qsqlTransaction_runQuery($post_data, &$arr_saisie ) {
	$RES = paracrm_queries_qsql_lib_exec($arr_saisie['sql_querystring']) ;
	if( $RES===FALSE )
		return array('success'=>false,'query_status'=>'NOK') ;
		
	$transaction_id = $post_data['_transaction_id'] ;
	if( !is_array($_SESSION['transactions'][$transaction_id]['arr_RES']) )
		return array('success'=>false,'query_status'=>'NO_RES') ;
	
	$new_RES_key = count($_SESSION['transactions'][$transaction_id]['arr_RES']) + 1 ;
	$_SESSION['transactions'][$transaction_id]['arr_RES'][$new_RES_key] = $RES ;
	
	return array('success'=>true,'query_status'=>'OK','RES_id'=>$new_RES_key) ;
}

function paracrm_queries_qsqlTransaction_resGet( $post_data )
{
	$transaction_id = $post_data['_transaction_id'] ;
	$RES = $_SESSION['transactions'][$transaction_id]['arr_RES'][$post_data['RES_id']] ;
	
	return array('success'=>true,'tabs'=>array_values($RES)) ;
}


function paracrm_queries_qsql_lib_getTables() {
	global $_opDB ;
	
	$arr_views = array() ;
	
	// use database
	$current_database = $_opDB->query_uniqueValue("SELECT DATABASE()") ;
	
	// use define routines
	$query = "SHOW TABLES LIKE 'view\_%'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$arr_views[] = array(
			'database_name' => $current_database,
			'view_name' => $arr[0],
			'view_fields' => array()
		);
	}
	
	foreach( $arr_views as &$view ) {
		$query = "SHOW COLUMNS FROM {$view['view_name']}" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$view['view_fields'][] = array(
				'field_name' => $arr[0],
				'field_type' => $arr[1]
			);
		}
	}
	unset($view) ;
	
	return $arr_views ;
}

function paracrm_queries_qsql_lib_exec($querystring) {
	global $_opDB ;
	
	
	$query = "LOCK TABLES mysql.user WRITE" ;
	$try = 3 ;
	while($try > 0) {
		$mysql_tmp_user = 'tmp'.rand ( 100000 , 999999 ) ;
		
		$try-- ;
		$query = "SELECT count(*) FROM mysql.user WHERE user='{$mysql_tmp_user}'" ;
		if( $_opDB->query_uniqueValue($query) == 0 ) {
			break ;
		}
		
		unset($mysql_tmp_user) ;
	}
	if( !isset($mysql_tmp_user) ) {
		return NULL ;
	}
	
	$query = "CREATE DATABASE {$mysql_tmp_user}" ;
	$_opDB->query($query) ;
	
	$query = "GRANT ALL PRIVILEGES ON {$mysql_tmp_user}.* To '{$mysql_tmp_user}'@'localhost' IDENTIFIED BY '{$mysql_tmp_user}';" ;
	$_opDB->query($query) ;
	$current_database = $_opDB->query_uniqueValue("SELECT DATABASE()") ;
	$query = "GRANT SELECT ON {$current_database}.* To '{$mysql_tmp_user}'@'localhost'" ;
	$_opDB->query($query) ;
	
	$query = "UNLOCK TABLES" ;
	$_opDB->query($query) ;
	
	
	$TAB = array() ;
	
	$mysqli = new mysqli('localhost', $mysql_tmp_user, $mysql_tmp_user, $mysql_tmp_user);
	$q=0 ;
	// print_r( SqlParser::split_sql($querystring) ) ;
	foreach( SqlParser::split_sql($querystring) as $query ) {
		$q++ ;
		$result = $mysqli->query($query) ;
		if( $result===TRUE ) {
			// INSERT , UPDATE, DELETE, ..... CREATE
			continue ;
		} elseif( !$result ) {
			// Erreur
			$TAB[] = array(
				'tab_title' => 'Q'.$q,
				'columns' => array(),
				'data' => array(),
				'SQL_debug'=>array('sql_query'=>$query, 'sql_error'=>$mysqli->error)
			);
			continue ;
		}
		
		$columns = $data = $mkeys = array() ;
		$c=0 ;
		foreach( $result->fetch_fields() as $sql_column ) {
			$c++ ;
			$mkey = 'col_'.$c ;
			$mkeys[] = $mkey ;
			$column = array(
				'text' => (string)$sql_column->name,
				'dataIndex' => $mkey
			) ;
			switch( (int)$sql_column->type ) {
				case '1' :
				case '2' :
				case '3' :
				case '4' :
				case '5' :
				case '6 ':
				case '7' :
				case '8' :
				case '9' :
				case '246' :
					$column['dataType'] = 'number' ;
					break ;
					
				default :
					$column['dataType'] = 'string' ;
					break ;
			}
			$columns[] = $column ;
		}
		
		while( $sql_row = $result->fetch_row() ) {
			$data[] = array_combine($mkeys,$sql_row) ;
		}
	
		$result->free() ;
		
		$TAB[] = array(
			'tab_title' => 'Q'.$q,
			'columns' => $columns,
			'data' => $data,
			'SQL_debug'=>array('sql_query'=>$query)
		);
	}
	$mysqli->close() ;
	
	
	
	$query = "DROP DATABASE {$mysql_tmp_user}" ;
	$_opDB->query($query) ;
	$query = "drop user '{$mysql_tmp_user}'@'localhost' ;" ;
	$_opDB->query($query) ;
	
	return $TAB ;
}



?>
