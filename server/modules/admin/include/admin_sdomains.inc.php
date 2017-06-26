<?php

function admin_sdomains_getList($post_data) {
	global $_opDB ;
	
	if( $post_data['size'] ) {
		$tmp_dbengine_sizes = array() ;
		$query = "SELECT table_schema, sum( data_length + index_length ) / 1024 / 1024
					FROM information_schema.TABLES GROUP BY table_schema" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$tmp_dbengine_sizes[$arr[0]] = $arr[1] ;
		}
	}

	$arr_sdomains = array() ;
	$query = "SELECT * FROM sdomain" ;
	if( $post_data['sdomain_id'] ) {
		$query.= " WHERE sdomain_id='{$post_data['sdomain_id']}'" ;
	} else {
		$query.= " ORDER BY sdomain_id" ;
	}
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		//$arr['sdomain_id'] = strtoupper($arr['sdomain_id']) ;
		$arr['overwrite_is_locked'] = $arr['overwrite_is_locked'] == 'O' ? true : false ;
		
		$db_name = $GLOBALS['mysql_db'].'_'.$arr['sdomain_id'] ;
		if( true ) {
			$arr['stat_nbBibles'] = $_opDB->query_uniqueValue("SELECT count(*) FROM {$db_name}.define_bible") ;
			$arr['stat_nbFiles'] = $_opDB->query_uniqueValue("SELECT count(*) FROM {$db_name}.define_file") ;
			$arr['stat_dbSize'] = ($tmp_dbengine_sizes[$db_name] ? round($tmp_dbengine_sizes[$db_name],1).' '.'MB' : '') ;
			
			if( !$dmgr_sdomain ) {
				$dmgr_sdomain = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() ) ;
			}
			if( $dmgr_sdomain->sdomainDb_needUpdate($arr['sdomain_id']) ) {
				$arr['stat_dbSize'] = 'needupdate' ;
			}
		} else {
			$arr['stat_nbBibles'] = 0 ;
			$arr['stat_nbFiles'] = 0 ;
			$arr['stat_dbSize'] = 'null' ;
		}
		
		$arr_sdomains[] = $arr ;
	}

	return array(
		'data'=>$arr_sdomains,
		'success'=>true
	);
}

function admin_sdomains_deleteSdomain($post_data) {
	global $_opDB ;
	
	sleep(1) ;
	
	$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() );
	$t->sdomainDb_delete($post_data['sdomain_id']) ;
	
	$query = "DELETE FROM sdomain WHERE sdomain_id='{$post_data['sdomain_id']}'" ;
	$_opDB->query($query) ;
	
	return array('success'=>true) ;
}
function admin_sdomains_truncateSdomain($post_data) {
	global $_opDB ;
	
	sleep(1) ;
	
	$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() );
	$t->sdomainDb_purgeStore($post_data['sdomain_id']) ;
	
	return array('success'=>true) ;
}
function admin_sdomains_setSdomain($post_data) {
	global $_opDB ;
	
	$arr_update = array() ;
	if( $post_data['_is_new'] ) {
		
		$arr_update['sdomain_id'] = strtolower($post_data['sdomain_id']) ;
		if( $arr_update['sdomain_id'] == '' ) {
			$errors_form['sdomain_id'] = 'sdomain_ID unspecified' ;
		}
		
		$query_test = "SELECT sdomain_id FROM sdomain WHERE sdomain_id='{$arr_update['sdomain_id']}'" ;
		if( $_opDB->num_rows($_opDB->query($query_test)) > 0 ) {
			$errors_form['sdomain_id'] = 'Existing sdomain_ID' ;
		}
		
		$arr_update['module_id'] = $post_data['module_id'] ;
		if( $arr_update['module_id'] == '' ) {
			$errors_form['module_id'] = 'Sdomain module type unspecified' ;
		}
		
	} else {
		$query_test = "SELECT sdomain_id FROM sdomain WHERE sdomain_id='{$post_data['sdomain_id']}'" ;
		if( $_opDB->num_rows($_opDB->query($query_test)) == 0 ) {
			$errors_form['sdomain_id'] = 'Unknown sdomain_ID' ;
		}
	}
	foreach( array('sdomain_name','icon_code') as $mkey ) {
		if( $post_data[$mkey] != '' ) {
			$arr_update[$mkey] = $post_data[$mkey] ;
		} else {
			$errors_form[$mkey] = "Missing $mkey" ;
		}
	}
	foreach( array('overwrite_is_locked') as $mkey ) {
		if( !isset($post_data[$mkey]) ) {
			$errors_form[$mkey] = "Missing $mkey" ;
		} else {
			$arr_update[$mkey] = $post_data[$mkey] ? 'O' : '' ;
		}
	}
	
	$success = TRUE ;
	if( $errors_form )
		$success = FALSE ;
		
	$response = array() ;
	$response['success'] = $success ;
	if( $errors_form )
		$response['errors'] = $errors_form ;
	if( !$response['success'] )
		return $response ;
		
	if( $post_data['_is_new'] ) {
		try {
			$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() );
			$t->sdomainDb_create( $arr_update['sdomain_id'] ) ;
		} catch( Exception $e ) {
			return array('success'=>false) ;
		}
		$_opDB->insert('sdomain',$arr_update) ;
	} else {
		$arr_cond = array() ;
		$arr_cond['sdomain_id'] = $post_data['sdomain_id'] ;
		$_opDB->update('sdomain',$arr_update,$arr_cond) ;
	}
	
	sleep(1) ;
	return $response ;
}
function admin_sdomains_updateSchema( $post_data ) {
	global $_opDB ;
	
	$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() );
	$t->sdomainDb_updateSchema( $post_data['sdomain_id'] ) ;
	
	sleep(1) ;
	return array('success'=>true) ;
}


function admin_sdomains_export( $post_data ) {
	global $_opDB ;
	
	$domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
	$sdomain_id = $post_data['sdomain_id'] ;
	
	$filename_csv = 'op5dump'.'.'.$domain_id.'.'.$sdomain_id.'.'.date('Ymd_Hi').'.csv' ;
	$filename_zip = $filename_csv.'.zip' ;
	$filepath_csv = tempnam(sys_get_temp_dir(),'dmp') ;
	$ttmp = tempnam(sys_get_temp_dir(),'dmp') ;
	$filepath_zip = $ttmp.'.zip' ;
	unlink($ttmp) ;
	$handle = fopen( $filepath_csv , 'wb' ) ;
	
	$t = new DatabaseMgr_Sdomain($domain_id) ;
	$t->sdomainDump_export( $sdomain_id, $handle ) ;
		
	$nothing = FALSE ;
	if( ftell($handle) == 0 )
		$nothing = TRUE ;
	fclose($handle) ;
	
	if( $nothing )
		return array('success'=>true,'empty'=>true) ;
	
	$obj_zip = new ZipArchive() ;
	$obj_zip->open( $filepath_zip , ZIPARCHIVE::CREATE ) ;
	$obj_zip->addFile( $filepath_csv , $filename_csv ) ;
	$obj_zip->close() ;
	
	unlink($filepath_csv) ;
	
	$transaction_id = $_SESSION['next_transaction_id']++ ;
	$_SESSION['transactions'][$transaction_id] = array() ;
	$_SESSION['transactions'][$transaction_id]['transaction_code'] = 'admin_sdomains_export' ;
	$_SESSION['transactions'][$transaction_id]['dmp_export_filepath'] = $filepath_zip ;
	$_SESSION['transactions'][$transaction_id]['dmp_export_filename'] = $filename_zip ;
	return array(
		'success'=>true,
		'transaction_id'=>$transaction_id
	) ;
}
function admin_sdomains_exportDL( $post_data ) {
	if( ($transaction_id=$post_data['transaction_id'])
	&& is_array($_SESSION['transactions'][$transaction_id])
	&& $_SESSION['transactions'][$transaction_id]['transaction_code'] == 'admin_sdomains_export' ) {
		
		$transaction = $_SESSION['transactions'][$transaction_id] ;
		$filename = $transaction['dmp_export_filename'] ;
		$tmpfilepath = $transaction['dmp_export_filepath'] ;
			
		header("Content-Type: application/force-download; name=\"$filename\""); 
		header("Content-Disposition: attachment; filename=\"$filename\""); 
		readfile($tmpfilepath) ;
		unlink($tmpfilepath) ;
		unset($_SESSION['transactions'][$transaction_id]) ;
		die() ;
	}
	die() ;
}
function admin_sdomains_import_upload( $post_data ) {
	global $_opDB ;
	
	$domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
	$sdomain_id = $post_data['sdomain_id'] ;
	
	$query = "SELECT count(*) FROM sdomain WHERE sdomain_id='{$sdomain_id}' AND overwrite_is_locked<>'O'";
	if( $_opDB->query_uniqueValue($query) != 1 ) {
		return array('success'=>false) ;
	}
	
	if( $_FILES['op5file']['error'] || !($_FILES['op5file']['size'] > 0) )
	{
		$_opsync_error = 'Unable to open uploaded file ?' ;
		return array('success'=>false,'error'=>'Unable to open uploaded file ?') ;
	}
	
	$filename_zip = $_FILES['op5file']['name'] ;
	if( count($ttmp=explode('.',$filename_zip)) != 6 
		|| substr($filename_zip,0,8) != 'op5dump.'
		|| substr($filename_zip,strlen($filename_zip)-8,8) != '.csv.zip' )
	{
		return array('success'=>false,'error'=>'Unrecognized file format') ;
	}
	
	$filename_csv = substr($filename_zip,0,strlen($filename_zip)-4) ;
	$obj_zip = new ZipArchive ;
	$obj_zip->open( $_FILES['op5file']['tmp_name'] ) ;
	if( !($handle = $obj_zip->getStream($filename_csv)) )
	{
		return array('success'=>false,'error'=>"Cannot find correct CSV stream in Zip archive") ;
	}
	
	$handle_local = tmpfile() ;
	stream_copy_to_stream( $handle, $handle_local ) ;
	fseek( $handle_local, 0 ) ;
	
	$t = new DatabaseMgr_Sdomain( $domain_id );
	$t->sdomainDump_import( $sdomain_id, $handle_local ) ;
	
	fclose($handle_local) ;
	fclose($handle) ;
	
	return array('success'=>true) ;
}

function admin_sdomains_importLocal( $post_data ) {
	$domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
	$src_sdomain_id = $post_data['src_sdomain_id'] ;
	$dst_sdomain_id = $post_data['dst_sdomain_id'] ;
	
	$t = new DatabaseMgr_Sdomain( $domain_id );
	try {
		$t->sdomainDb_clone( $src_sdomain_id, $dst_sdomain_id ) ;
	} catch( Exception $e ) {
		return array('success'=>false) ;
	}
	
	return array('success'=>true) ;
}

function admin_sdomains_importRemote( $post_data ) {
	$domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
	$sdomain_id = $post_data['sdomain_id'] ;
	
	switch( $post_data['_action'] ) {
		case 'sdomains_importRemote_getSdomains' :
			$values = array() ;
			$values['fetch_url'] = $post_data['fetch_url'] ;
			$values['fetch_login_domain'] = '' ;
			$values['fetch_login_user'] = '' ;
			$values['fetch_login_pass'] = '' ;
			$url = parse_url($values['fetch_url']) ;
			if( $url===FALSE || ( $url['scheme'] && !in_array($url['scheme'],array('http','https')) ) ) {
				return array('success'=>false,'values'=>$values,'errors'=>array('fetch_url'=>TRUE)) ;
			}
			if( !$url['scheme'] ) {
				$values['fetch_url'] = 'http://'.$values['fetch_url'] ;
			}
			
			$private_url = $values['fetch_url'].'/server/db.php' ;
			
			$post_url = array() ;
			$post_url['login_domain'] = strtolower($post_data['fetch_login_domain']) ;
			$post_url['login_user'] = $post_data['fetch_login_user'] ;
			$post_url['login_password'] = $post_data['fetch_login_pass'] ;
			
			try {
				$response = admin_sdomains_importRemote_doPostRequest( $private_url, http_build_query($post_url), 10.0 ) ;
			} catch( Exception $e ) {
				return array('success'=>false,'values'=>$values,'errors'=>array('fetch_url'=>'Url')) ;
			}
			
			$response_json = json_decode($response,true) ;
			if( !$response_json ) {
				return array('success'=>false,'values'=>$values,'errors'=>array('fetch_url'=>'Url')) ;
			}
			
			$values['fetch_login_domain'] = strtolower($post_data['fetch_login_domain']) ;
			
			if( $response_json['success'] == false && $response_json['error'] == 'ERR_DOMAIN' ) {
				return array('success'=>false,'values'=>$values,'errors'=>array('fetch_login_domain'=>'Domain')) ;
			}
			
			$values['fetch_login_user'] = strtolower($post_data['fetch_login_user']) ;
			
			if( $response_json['success'] == false && $response_json['error'] == 'ERR_AUTH' ) {
				return array('success'=>false,'values'=>$values,'errors'=>array('fetch_login_user'=>'Username','fetch_login_pass'=>'Password')) ;
			}
			
			$values['fetch_login_pass'] = $post_data['fetch_login_pass'] ;
			
			if( $response_json['success'] == false ) {
				return array('success'=>false,'values'=>$values) ;
			}
			
			return array('success'=>true,'values'=>$values,'sdomains'=>$response_json['data']) ;
			break ;
		
		
		case 'sdomains_importRemote_do' :
			
			$private_url = $post_data['fetch_url'].'/server/db.php' ;
			$post_url = array() ;
			$post_url['login_domain'] = strtolower($post_data['fetch_login_domain']) ;
			$post_url['login_user'] = $post_data['fetch_login_user'] ;
			$post_url['login_password'] = $post_data['fetch_login_pass'] ;
			$post_url['dump_sdomain'] = $post_data['fetch_src_sdomain'] ;
			
			try {
				$response = admin_sdomains_importRemote_doPostRequest( $private_url, http_build_query($post_url), 120.0 ) ;
			} catch( Exception $e ) {
				return array('success'=>false) ;
			}
			if( $response === FALSE ) {
				return array('success'=>false) ;
			}
			
			$ttmp = tempnam(sys_get_temp_dir(),'dmp') ;
			$filepath_zip = $ttmp.'.zip' ;
			file_put_contents( $filepath_zip, $response ) ;
			
			$obj_zip = new ZipArchive ;
			$obj_zip->open( $filepath_zip ) ;
			if( ($obj_zip->numFiles != 1) || !($handle = $obj_zip->getStream($obj_zip->getNameIndex(0))) )
			{
				return array('success'=>false,'resp'=>$response,'error'=>"Cannot find correct CSV stream in Zip archive") ;
			}
			
			$handle_local = tmpfile() ;
			stream_copy_to_stream( $handle, $handle_local ) ;
			fseek( $handle_local, 0 ) ;
			
			$t = new DatabaseMgr_Sdomain( $domain_id );
			$t->sdomainDump_import( $sdomain_id, $handle_local ) ;
			
			fclose($handle_local) ;
			fclose($handle) ;
			
			$obj_zip->close() ;
			unlink($filepath_zip) ;
			
			return array('success'=>true) ;
			
			break ;
		
		default :
			return array('success'=>false) ;
			break ;
	}
}

function admin_sdomains_importRemote_doPostRequest( $url, $data, $timeout=60.0 )
{
	$params = array('http' => array(
					'method' => 'POST',
					'content' => $data,
					'timeout' => $timeout
					));
	$ctx = stream_context_create($params);
	$fp = @fopen($url, 'rb', false, $ctx);
	if (!$fp) {
		throw new Exception("Problem with $url, $php_errormsg");
	}
	$response = @stream_get_contents($fp);
	if ($response === false) {
		throw new Exception("Problem reading data from $url, $php_errormsg");
	}
	return $response;
}


?>
