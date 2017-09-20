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
		$_SESSION['transactions'][$transaction_id]['arr_RES_idx'] = 0 ;
		
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
		if( $post_data['_subaction'] == 'metadata' )
		{
			$json =  paracrm_queries_qsqlTransaction_metadata( $post_data , $arr_saisie ) ;
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
		if( $post_data['_subaction'] == 'toggle_publish' )
		{
			$json =  paracrm_queries_qsqlTransaction_togglePublish( $post_data , $arr_saisie ) ;
			if( $json['success'] ) {
				paracrm_queries_organizePublish() ;
			}
		}
		if( $post_data['_subaction'] == 'autorun_get' )
		{
			$json =  paracrm_queries_qsqlTransaction_autorunGet( $post_data , $arr_saisie ) ;
		}
		if( $post_data['_subaction'] == 'autorun_set' )
		{
			$json =  paracrm_queries_qsqlTransaction_autorunSet( $post_data , $arr_saisie ) ;
		}
		
		if( $post_data['_subaction'] == 'res_get' )
		{
			$json =  paracrm_queries_qsqlTransaction_resGet( $post_data ) ;
		}
		if( $post_data['_subaction'] == 'res_destroy' )
		{
			$json =  paracrm_queries_qsqlTransaction_resDestroy( $post_data ) ;
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
		$arr_saisie['sql_is_rw'] = ($arr['sql_is_rw']=='O') ;
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
			'data_sqlwrite' => $arr_saisie['sql_is_rw'],
			'auth_readonly' => false,
			'db_schema' => array(),
			'db_sdomains' => array()
		)
	) ;
}
function paracrm_queries_qsqlTransaction_metadata( $post_data , &$arr_saisie ) {
	return array(
		'success'=>true,
		'transaction_id' => $post_data['_transaction_id'],
		'data' => array(
			'db_schema' => paracrm_queries_qsql_lib_getTables(),
			'db_sdomains' => paracrm_queries_qsql_lib_getSdomains()
		)
	) ;
}
function paracrm_queries_qsqlTransaction_submit( $post_data , &$arr_saisie )
{
	global $_opDB ;
	
	$arr_saisie['sql_querystring'] = json_decode($post_data['data_sqlquerystring'],true) ;
	$arr_saisie['sql_is_rw'] = json_decode($post_data['data_sqlwrite'],true) ; 
	$arr_saisie['sql_is_superuser'] = json_decode($post_data['data_sqlsu'],true) ; 

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
		$arr_update['sql_is_rw'] = ($arr_saisie['sql_is_rw']?'O':'') ;
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
		$arr_update['sql_is_rw'] = ($arr_saisie['sql_is_rw']?'O':'') ;
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
function paracrm_queries_qsqlTransaction_togglePublish( $post_data , &$arr_saisie )
{
	global $_opDB ;

	$qsql_id = $arr_saisie['qsql_id'] ;
	$is_published = ($post_data['isPublished']=='true')?true:false ;
	
	$query = "DELETE FROM input_query_src WHERE target_qsql_id='$qsql_id'" ;
	$_opDB->query($query) ;
	
	if( $is_published ) {
		$arr_ins = array() ;
		$arr_ins['target_qsql_id'] = $qsql_id ;
		$_opDB->insert('input_query_src',$arr_ins) ;
	}

	return array('success'=>true) ;
}
function paracrm_queries_qsqlTransaction_toggleAutorun( $post_data , &$arr_saisie )
{
	global $_opDB ;

	$qsql_id = $arr_saisie['qsql_id'] ;
	$is_published = ($post_data['isAutorun']=='true')?true:false ;
	
	$arr_update = array() ;
	$arr_update['autorun_is_on'] = ($is_published ? 'O':'N') ;
	$arr_cond = array() ;
	$arr_cond['qsql_id'] = $qsql_id ;
	$_opDB->update('qsql',$arr_update,$arr_cond) ;

	return array('success'=>true) ;
}
function paracrm_queries_qsqlTransaction_autorunGet( $post_data , &$arr_saisie ) {
	global $_opDB ;
	
	sleep(1) ;
	
	$qsql_id = $arr_saisie['qsql_id'] ;
	
	$query = "SELECT autorun_is_on, autorun_cfg_json FROM qsql where qsql_id='{$qsql_id}'" ;
	$result = $_opDB->query($query) ;
	$arr = $_opDB->fetch_row($result) ;
	
	$data = array() ;
	$data['autorun_is_on'] = ($arr[0]=='O') ;
	$data['autorun_cfg_json'] = json_decode($arr[1],true) ;
	
	return array('success'=>true, 'data'=>$data['autorun_cfg_json']) ;
}
function paracrm_queries_qsqlTransaction_autorunSet( $post_data , &$arr_saisie ) {
	global $_opDB ;
	
	sleep(2) ;
	
	$qsql_id = $arr_saisie['qsql_id'] ;
	$data = json_decode($post_data['data'],true) ;
	
	$arr_update = array() ;
	$arr_update['autorun_is_on'] = ($data['autorun_is_on'] ? 'O':'N') ;
	$arr_update['autorun_cfg_json'] = ($data['autorun_is_on'] ? json_encode($data) : '') ;
	$arr_cond = array() ;
	$arr_cond['qsql_id'] = $qsql_id ;
	$_opDB->update('qsql',$arr_update,$arr_cond) ;

	return array('success'=>true) ;
}


function paracrm_queries_qsqlTransaction_runQuery($post_data, &$arr_saisie ) {
	$RES = paracrm_queries_qsql_lib_exec($arr_saisie['sql_querystring'],$arr_saisie['sql_is_rw'],FALSE,array(),$arr_saisie['sql_is_superuser']) ;
	if( $RES===FALSE )
		return array('success'=>false,'query_status'=>'NOK') ;
		
	$transaction_id = $post_data['_transaction_id'] ;
	if( !is_array($_SESSION['transactions'][$transaction_id]['arr_RES']) )
		return array('success'=>false,'query_status'=>'NO_RES') ;
	
	$_SESSION['transactions'][$transaction_id]['arr_RES_idx']++ ;
	$new_RES_key = $_SESSION['transactions'][$transaction_id]['arr_RES_idx'] ;
	$_SESSION['transactions'][$transaction_id]['arr_RES'][$new_RES_key] = serialize($RES) ;
	
	return array('success'=>true,'query_status'=>'OK','RES_id'=>$new_RES_key) ;
}

function paracrm_queries_qsqlTransaction_resGet( $post_data )
{
	$transaction_id = $post_data['_transaction_id'] ;
	$RES = unserialize($_SESSION['transactions'][$transaction_id]['arr_RES'][$post_data['RES_id']]) ;
	if( !$RES ) {
		return array('success'=>false) ;
	}
	
	return array('success'=>true,'tabs'=>array_values($RES)) ;
}
function paracrm_queries_qsqlTransaction_resDestroy( $post_data )
{
	$transaction_id = $post_data['_transaction_id'] ;
	unset($_SESSION['transactions'][$transaction_id]['arr_RES'][$post_data['RES_id']]) ;
	return array('success'=>true, 'debug'=>count($_SESSION['transactions'][$transaction_id]['arr_RES'])) ;
}


function paracrm_queries_qsql_lib_getSdomains($auth_bypass=FALSE) {
	global $_opDB ;
	
	$arr_sdomains = array() ;
	
	$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() );
	foreach( $t->sdomains_getAll() as $sdomain_id ) {
		if( !$auth_bypass && !Auth_Manager::getInstance()->auth_query_sdomain_admin($sdomain_id) ) {
			continue ;
		}
		$arr_sdomains[] = array(
			'sdomain_id' => $sdomain_id,
			'database_name' => $t->getSdomainDb( $sdomain_id )
		) ;
	}
	
	return $arr_sdomains ;
}
function paracrm_queries_qsql_lib_getTables() {
	global $_opDB ;
	
	$arr_views = array() ;
	
	foreach( paracrm_queries_qsql_lib_getSdomains() as $sdomain ) {
		// use database
		$current_database = $sdomain['database_name'] ;
		
		// use define routines
		$query = "SHOW TABLES FROM {$current_database} LIKE 'view\_%' " ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$arr_views[] = array(
				'database_name' => $current_database,
				'view_name' => $arr[0],
				'view_fields' => array()
			);
		}
	}
	
	foreach( $arr_views as &$view ) {
		$query = "SHOW COLUMNS FROM {$view['database_name']}.{$view['view_name']}" ;
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

function paracrm_queries_qsql_lib_exec($querystring, $is_rw=FALSE, $auth_bypass=FALSE, $vars=array(), $is_superuser=FALSE) {
	global $_opDB ;
	
	$prefix = 'tmp' ;
	if( $is_superuser ) {
		if( !Auth_Manager::getInstance()->auth_is_admin() ) {
			return NULL ;
		}
		$prefix = 'tsu' ;
	}
	
	$query = "LOCK TABLES mysql.user WRITE" ;
	$try = 3 ;
	while($try > 0) {
		$mysql_tmp_user = $prefix.rand ( 100000 , 999999 ) ;
		
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
	
	foreach( paracrm_queries_qsql_lib_getSdomains($auth_bypass) as $row_sdomain ) {
		$current_database = $row_sdomain['database_name'] ;
		if( $is_superuser ) {
			$privileges = 'ALL PRIVILEGES' ;
		} elseif( $is_rw ) {
			$privileges = 'SELECT,UPDATE,INSERT,DELETE,DROP,SHOW VIEW' ;
		} else {
			$privileges = 'SELECT, SHOW VIEW' ;
		}
		$query = "GRANT {$privileges} ON `{$current_database}`.* To '{$mysql_tmp_user}'@'localhost'" ;
		$_opDB->query($query) ;
	}
	
	$query = "UNLOCK TABLES" ;
	$_opDB->query($query) ;
	
	
	$TAB = array() ;
	
	$mysqli = new mysqli('localhost', $mysql_tmp_user, $mysql_tmp_user, $mysql_tmp_user);
	$mysqli->query("SET NAMES UTF8") ;
	$mysqli->query("SET collation_connection = utf8_unicode_ci") ;
	if( $vars ) {
		foreach( $vars as $mkey=>$mvalue ) {
			$mysqli->query("SET @{$mkey} = '{$mvalue}'") ;
		}
	}
	$q=0 ;
	// print_r( SqlParser::split_sql($querystring) ) ;
	@ini_set('pcre.backtrack_limit', PHP_INT_MAX); // HACK
	foreach( SqlParser::split_sql($querystring) as $query ) {
		if( !trim($query) ) {
			continue ;
		}
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
	
	if( $is_superuser ) {
		$query = "SELECT TABLE_SCHEMA,TABLE_NAME  FROM information_schema.VIEWS 
				WHERE DEFINER = '{$mysql_tmp_user}@localhost' 
				AND SECURITY_TYPE = 'DEFINER'" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$db = $arr[0] ;
			$vw = $arr[1] ;
			$query = "DROP VIEW {$db}.{$vw}" ;
			$_opDB->query($query) ;
		}
	}
	
	return $TAB ;
}


function paracrm_queries_qsqlTransaction_exportXLS( $post_data, &$arr_saisie )
{
	if( !class_exists('PHPExcel') )
		return NULL ;
	
	$transaction_id = $post_data['_transaction_id'] ;
	$RES = unserialize($_SESSION['transactions'][$transaction_id]['arr_RES'][$post_data['RES_id']]) ;
	
	$workbook_tab_grid = array() ;
	foreach( $RES as $tab_id => $tab )
	{
		$workbook_tab_grid[$tab_id] = $tab ;
	}
	
	$objPHPExcel = paracrm_queries_xls_build( $workbook_tab_grid, $RES['RES_round'] ) ;
	if( !$objPHPExcel ) {
		die() ;
	}
	
	$tmpfilename = tempnam( sys_get_temp_dir(), "FOO");
	$objWriter = PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel2007');
	$objWriter->save($tmpfilename);
	$objPHPExcel->disconnectWorksheets();
	unset($objPHPExcel) ;
	
	$query_name = "unnamed" ;
	if( $arr_saisie['query_name'] ) {
		$query_name = $arr_saisie['query_name'] ;
	}
	$query_name=str_replace(' ','_',preg_replace("/[^a-zA-Z0-9\s]/", "", $query_name)) ;
	
	$filename = 'OP5report_Query_'.$query_name.'_'.time().'.xlsx' ;
	header("Content-Type: application/force-download; name=\"$filename\""); 
	header("Content-Disposition: attachment; filename=\"$filename\""); 
	readfile($tmpfilename) ;
	unlink($tmpfilename) ;
	die() ;
}








function paracrm_queries_qsqlAutorun_getLogs( $post_data ) {
	
	global $_opDB ;
	
	$idx = 1 ;
	
	$vtable = '' ;
	$vtable.= '(' ;
	$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() );
	$sdomain_current = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;
	foreach( $t->sdomains_getAll() as $sdomain_id ) {
		$sdomain_id ;
		$sdomain_db = $t->getSdomainDb( $sdomain_id ) ;
		$table = $sdomain_db.'.'.'qsql_autorun' ;
		$alias = 't'.$idx ;
		$aliasname = 'tname'.$idx ;
		
		if( $post_data['filter_sdomain'] ) {
			if( $sdomain_id != $sdomain_current ) {
				continue ;
			}
		}
		
		if( $idx>1 ) {
			$vtable.= ' UNION ALL ' ;
		}
		$idx++ ;
		$vtable.= "(SELECT {$alias}.*, '{$sdomain_id}' as sdomain_id, CONCAT('{$sdomain_id}','-',LPAD(qsql_autorun_id, 20, '0')) as id, {$aliasname}.qsql_name FROM {$table} {$alias} LEFT OUTER JOIN {$sdomain_db}.qsql {$aliasname} ON {$aliasname}.qsql_id={$alias}.qsql_id )" ;
	}
	$vtable.= ')' ;
	
	$TAB = array() ;
	$query = "SELECT qsqlautoruns.* FROM {$vtable} qsqlautoruns" ;
	if( $post_data['filter_last'] ) {
		$query.= " JOIN (SELECT max(qsqlautoruns_join.id) as max_id FROM {$vtable} qsqlautoruns_join GROUP BY qsqlautoruns_join.sdomain_id,qsqlautoruns_join.qsql_id) j" ;
		$query.= " ON j.max_id=qsqlautoruns.id" ;
	}
	$query.= " ORDER BY exec_ts DESC" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$arr = array(
			'exec_date' => date('Y-m-d H:i:s',$arr['exec_ts'])
		) + $arr ;
		$TAB[] = $arr ;
	}
	
	return array('success'=>true,'data'=>$TAB ) ;
}

?>
