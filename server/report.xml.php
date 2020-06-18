<?php

session_name('OP5XML') ;
session_start() ;

//ob_start() ;
$app_root='..' ;
$server_root='.' ;

include("$server_root/include/config.inc.php");
include("$server_root/include/toolfunctions.inc.php");

include("$server_root/modules/media/include/media.inc.php");

include( "$server_root/include/database/mysql_DB.inc.php" ) ;

include("$server_root/login.inc.php") ;


if( $_REQUEST['__token'] ) {
	$_opDB = new mysql_DB( );
	$_opDB->connect_mysql( $mysql_host, '', $mysql_user, $mysql_pass );
	$_opDB->query("SET NAMES UTF8") ;
	
	// parse TOKEN_KEY / TOKEN_DOMAIN
	$ttmp = explode('@',trim($_REQUEST['__token'])) ;
	if( count($ttmp)!=2 ) {
		header("HTTP/1.0 500 Internal Server Error");
		exit ;
	}
	$_TOKEN_DOMAIN = strtolower($ttmp[1]) ;
	$_TOKEN_KEY = strtoupper($ttmp[0]) ;
	
	
	// *** Domain selectDB ***
	$domain_base_db = DatabaseMgr_Base::getBaseDb($_TOKEN_DOMAIN) ;
	$result = $_opDB->query("SHOW DATABASES") ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		if( $arr[0] == $domain_base_db ) {
			$_opDB->select_db($domain_base_db) ;
			$GLOBALS['mysql_db'] = $domain_base_db ;
			$do_select = TRUE ;
			break ;
		}
	}
	if( !$do_select ) {
		header("HTTP/1.0 404 Not Found");
		exit ;
	}
	
	
	// ****
	$query = "SELECT * FROM q_token WHERE token_key='{$_TOKEN_KEY}'" ;
	$result = $_opDB->query($query) ;
	$token_target = $_opDB->fetch_assoc($result) ;
	if( !$token_target ) {
		header("HTTP/1.0 404 Not Found");
		exit ;
	}
	
	$_REQUEST['_sdomainId'] = $token_target['target_sdomain_id'] ;
	
	$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() );
	$sdomain_db = $t->getSdomainDb( $_REQUEST['_sdomainId'] ) ;
	$qsql_table = $sdomain_db.'.'.'qsql' ;
	$query = "SELECT token_cfg_json FROM {$qsql_table} WHERE qsql_id='{$token_target['target_qsql_id']}'" ;
	$result = $_opDB->query($query) ;
	$arr = $_opDB->fetch_row($result) ;
	if( !$arr ) {
		header("HTTP/1.0 500 Internal Server Error");
		exit ;
	}
	$token_cfg_json = json_decode($arr[0],true) ;
	if( !is_array($token_cfg_json) ) {
		header("HTTP/1.0 500 Internal Server Error");
		exit ;
	}
	$token_cfg_row = NULL ;
	foreach( $token_cfg_json as $token_cfg_iter ) {
		if( $token_cfg_iter['token_id'] == $token_target['target_token_id'] ) {
			$token_cfg_row = $token_cfg_iter ;
			break ;
		}
	}
	if( !$token_cfg_row ) {
		header("HTTP/1.0 500 Internal Server Error");
		exit ;
	}
	$_REQUEST['_action'] = 'queries_direct' ;
	$_REQUEST['q_type'] = 'qsql' ;
	$_REQUEST['q_id'] = $token_target['target_qsql_id'] ;
	if( $token_cfg_row['token_is_authbypass'] ) {
		$_AUTH_BYPASS = TRUE ;
	}
	if( $token_cfg_row['q_resultmap'] ) {
		$_TOKEN_QRESULTMAP = $token_cfg_row['q_resultmap'] ;
	}
	if( $token_cfg_row['q_vars'] ) {
		foreach( $token_cfg_row['q_vars'] as $qvar_row ) {
			$mkey = 'q_vars'.':'.$qvar_row['qvar_key'] ;
			$_REQUEST[$mkey] = $qvar_row['qvar_value'] ;
		}
	}
	
	$_opDB->disconnect() ;
	//unset($GLOBALS['mysql_db']) ;
}

elseif( $_REQUEST['__qsql'] ) {

	// parse TOKEN_KEY / TOKEN_DOMAIN
	$ttmp = explode('@',trim($_REQUEST['__qsql'])) ;
	if( count($ttmp)!=2 ) {
		header("HTTP/1.0 500 Internal Server Error");
		exit ;
	}
	$_QSQL_SDOMAIN = strtolower($ttmp[1]) ;
	$_QSQL_ID = strtoupper($ttmp[0]) ;

	$_REQUEST['_sdomainId'] = $_QSQL_SDOMAIN;
	$_REQUEST['_action'] = 'queries_direct' ;
	$_REQUEST['q_type'] = 'qsql' ;
	$_REQUEST['q_id'] = $_QSQL_ID ;
}





if( $_AUTH_BYPASS && $_TOKEN_DOMAIN ) {
	// build login result
	$login_result = array(
		'done' => TRUE,
		'login_data' => array(
			'login_domain' => $_TOKEN_DOMAIN,
			'login_user' => '__token',
			'login_password' => '__token',
			'auth_class' => 'A',
			'auth_is_nologin' => true
		),
		'mysql_db' => $GLOBALS['mysql_db']
	) ;
	
} elseif( $_INLINE_PW || ($_REQUEST['PHP_AUTH_USER'] && (!$_SERVER['PHP_AUTH_DIGEST']&&!$_SERVER['PHP_AUTH_USER'])) ) {
	if( ($login_result=op5_login_test( $_REQUEST['PHP_AUTH_USER'], $_REQUEST['PHP_AUTH_PW'] )) && $login_result['done'] ) {
		// OK !
	} else {
		header('HTTP/1.0 403 Forbidden');
		exit ;
	}
} else {
	$scheme = 'http' ;
	if( $_SERVER['HTTPS'] || isset($_SERVER['HTTP_X_FORWARDED_FOR']) ) {
		$scheme = 'https' ;
	}
	switch( $scheme ) {
		case 'http' :
			while(TRUE) {
				$http_digest = TRUE ;
				$http_digest_realm = 'OP5DIGEST';
				if( $_SESSION['login_result'] ) {
					$login_result = $_SESSION['login_result'] ;
					break ;
				} elseif (!empty($_SERVER['PHP_AUTH_DIGEST'])) {
					$digest_data = http_digest_parse($_SERVER['PHP_AUTH_DIGEST']) ;
					$userstr = $digest_data['username'] ;
					$login_result=op5_login_test( $userstr, $_SERVER['PHP_AUTH_DIGEST'], $http_digest, $http_digest_realm ) ;
					if( $login_result && $login_result['done'] ) {
						$_SESSION['login_result'] = $login_result ;
						break ;
					}
				}
				
				header('HTTP/1.1 401 Unauthorized');
				header('WWW-Authenticate: Digest realm="'.$http_digest_realm.
						'",qop="auth",nonce="'.uniqid().'",opaque="'.md5($http_digest_realm).'"');

				die('HTTP Digest Auth required');
				break ;
			}
			break ;
		
		case 'https' :
			while( TRUE ) {
				if( $_SESSION['login_result'] ) {
					$login_result = $_SESSION['login_result'] ;
					break ;
				} elseif( $_SERVER['PHP_AUTH_USER'] && $_SERVER['PHP_AUTH_PW'] ) {
					$userstr = $_SERVER['PHP_AUTH_USER'] ;
					$login_result=op5_login_test( $_SERVER['PHP_AUTH_USER'], $_SERVER['PHP_AUTH_PW'] ) ;
					if( $login_result && $login_result['done'] ) {
						$_SESSION['login_result'] = $login_result ;
						break ;
					}
				}
				
				header('WWW-Authenticate: Basic realm="OP5"');
				header('HTTP/1.0 401 Unauthorized');
				exit;
				break ;
			}
			break ;
			
		default :
			header('HTTP/1.0 403 Forbidden');
			exit ;
	}
}

function doExit() {
	session_write_close() ;
	die() ;
}

$_SESSION['login_data'] = $login_result['login_data'] ;
$_SESSION['login_data']['userstr'] = strtolower($login_result['login_data']['login_user'].'@'.$login_result['login_data']['login_domain']) ;
$GLOBALS['mysql_db'] = $login_result['mysql_db'] ;

$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, $GLOBALS['mysql_db'], $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;

// ************************
if( !$_REQUEST['_moduleId'] ) {
	$query = "SELECT module_id FROM sdomain WHERE sdomain_id='{$_REQUEST['_sdomainId']}'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		//header("HTTP/1.0 404 Not Found");
		doExit() ;
	}
	$arr = $_opDB->fetch_row($result) ;
	$_REQUEST['_moduleId'] = $arr[0] ;
}
// ************************
$my_module = $_REQUEST['_moduleId'] ;
if( !$my_module ) {
	header("HTTP/1.0 404 Not Found");
	doExit() ;
}
if( $my_module == 'crmbase_dsc' ) {
	$my_module = 'crmbase' ;
}
if( $my_module == 'crmbase' ) {
	$my_module = 'paracrm' ;
}
include("$server_root/modules/$my_module/backend_$my_module.inc.php");

$my_sdomain = $_REQUEST['_sdomainId'] ;
if( $my_sdomain ) {
	$_opDB->select_db( $GLOBALS['mysql_db'].'_'.$my_sdomain) ;
}

// ******** Rewrite inner-JSON *************
$pseudo_json = array() ;
foreach( $_REQUEST as $mkey => $mvalue ) {
	$ttmp = explode(':',$mkey) ;
	if( count($ttmp)==2 ) {
		$pseudo_json[$ttmp[0]][$ttmp[1]] = (isJsonArr($mvalue) ? json_decode($mvalue) : $mvalue) ;
	}
}
foreach( $pseudo_json as $form_name => $inner_json ) {
	$_REQUEST[$form_name] = json_encode($inner_json) ;
}
// *****************************************

$TAB = backend_specific( $_REQUEST ) ;

if( $my_sdomain ) {
	$_opDB->select_db( $GLOBALS['mysql_db'] ) ;
}

if( !$TAB ) {
	header("HTTP/1.0 404 Not Found");
	doExit() ;
}
if( !$TAB['success'] ) {
	header( (!$TAB['authDenied'] ? "HTTP/1.0 500 Internal Server Error" : "HTTP/1.0 403 Forbidden") );
	doExit() ;
}

if( strtolower($_SERVER['PATH_INFO'])=='/data' ) {
	$data = $TAB['data'] ;
}elseif( $TAB['tabs'] ) {
	$tabs = $TAB['tabs'] ;
} elseif( $TAB['result_tab'] ) {
	$TAB['result_tab']['tab_title'] = 'querygrid' ;
	$tabs = array($TAB['result_tab']) ;
} else {
	header("HTTP/1.0 202 Accepted");
	doExit() ;
}

if( $_TOKEN_QRESULTMAP ) {
	$new_tabs = array() ;
	foreach( $_TOKEN_QRESULTMAP as $tab_idx => $tab_params ) {
		if( !$tab_params['is_target'] ) {
			continue ;
		}
		$orig_title = $tab_params['tab_title_src'] ;
		$tab_cur = NULL ;
		foreach( $tabs as $tab_iter ) {
			if( $tab_iter['tab_title'] == $orig_title ) {
				$tab_cur = $tab_iter ;
				break ;
			}
		}
		if( !$tab_cur ) {
			continue ;
		}
		$title = $tab_params['tab_title_target'] ;
		$title = preg_replace("/[^a-zA-Z0-9]/", "", $title) ;
		if( !$title ) {
			continue ;
		}
		if( is_numeric($title[0]) ) {
			continue ;
		}
		$tab_cur['tab_title'] = $title ;
		$new_tabs[] = $tab_cur ;
	}
	$tabs = $new_tabs ;
}

switch( strtolower($_SERVER['PATH_INFO']) ) {
	case '/xsd' :
		$oXMLWriter = new XMLWriter;
		$oXMLWriter->openMemory();
		$oXMLWriter->setIndent(true);
		$oXMLWriter->startDocument('1.0', 'UTF-8');
			$oXMLWriter->startElement("xs:schema");
				$oXMLWriter->writeAttribute("xmlns:xs","http://www.w3.org/2001/XMLSchema");
				$oXMLWriter->writeAttribute("elementFormDefault","qualified");
				$oXMLWriter->writeAttribute("attributeFormDefault","unqualified");
				
			$oXMLWriter->startElement("xs:element");
				$oXMLWriter->writeAttribute("name","queryview");
			$oXMLWriter->startElement("xs:complexType");
			$oXMLWriter->startElement("xs:sequence");
			
			foreach( $tabs as $result_tab ) {
				$tab_title = preg_replace("/[^a-zA-Z0-9\s]/", "", $result_tab['tab_title']) ;
				$oXMLWriter->startElement("xs:element");
					$oXMLWriter->writeAttribute("name",$tab_title);
				$oXMLWriter->startElement("xs:complexType");
				$oXMLWriter->startElement("xs:sequence");
				
				$oXMLWriter->startElement("xs:element");
					$oXMLWriter->writeAttribute("name",'row');
					$oXMLWriter->writeAttribute("maxOccurs","unbounded");
				$oXMLWriter->startElement("xs:complexType");
				$oXMLWriter->startElement("xs:sequence");
				foreach( $result_tab['columns'] as $column ) {
					switch( $column['dataType'] ) {
						case 'number' :
							$datatype = 'xs:float' ;
							break ;
							
						case 'date' :
							$datatype = 'xs:date' ;
							break ;
						
						case 'string' :
						default :
							$datatype = 'xs:string' ;
							break ;
					}
					$datacol = $column['dataIndex'] ;
					if( $column['text'] ) {
						$datacol = preg_replace("/[^a-zA-Z0-9_]/", "", str_replace(' ','_',$column['text']));
					}
				
					$oXMLWriter->startElement("xs:element");
						$oXMLWriter->writeAttribute("name",$datacol);
						$oXMLWriter->writeAttribute("type",$datatype);
					$oXMLWriter->endElement();
				}
				$oXMLWriter->endElement();
				$oXMLWriter->endElement();
				$oXMLWriter->endElement();
				
				$oXMLWriter->endElement();
				$oXMLWriter->endElement();
				$oXMLWriter->endElement();
			}
			
			$oXMLWriter->endElement();
			$oXMLWriter->endElement();
			$oXMLWriter->endElement();
			
			$oXMLWriter->endElement();
		$oXMLWriter->endDocument() ;
		break ;
	
	
	case '/xml' :
	case '/' :
	case '' :
		$oXMLWriter = new XMLWriter;
		$oXMLWriter->openMemory();
		$oXMLWriter->setIndent(true);
		$oXMLWriter->startDocument('1.0', 'UTF-8');
		$oXMLWriter->startElement("queryview");
		foreach( $tabs as $result_tab ) {
			$tab_title = preg_replace("/[^a-zA-Z0-9\s]/", "", $result_tab['tab_title']) ;
			$oXMLWriter->startElement($tab_title);
			foreach( $result_tab['data'] as $data_row ) {
				$oXMLWriter->startElement("row");
				foreach( $result_tab['columns'] as $column ) {
					$datacol = $column['dataIndex'] ;
					if( $column['text'] ) {
						$datacol = preg_replace("/[^a-zA-Z0-9_]/", "", str_replace(' ','_',$column['text']));
					}
					
					$oXMLWriter->writeElement($datacol, $data_row[$column['dataIndex']]);
				}
				$oXMLWriter->endElement() ;
			}
			$oXMLWriter->endElement() ;
		}
		$oXMLWriter->endElement() ;
		$oXMLWriter->endDocument() ;
		
		break ;
	
	case '/csv' :
		$handle = tmpfile() ;
		$result_tab = reset($tabs) ;
		$arr_csv = array() ;
		foreach( $result_tab['columns'] as $column ) {
			$arr_csv[] = $column['text'] ;
		}
		fputcsv($handle,$arr_csv) ;
		foreach( $result_tab['data'] as $data_row ) {
			$arr_csv = array() ;
			foreach( $result_tab['columns'] as $column ) {
				$arr_csv[] = $data_row[$column['dataIndex']];
			}
			fputcsv($handle,$arr_csv) ;
		}
		fseek($handle,0) ;
		header('Content-Type: text/csv; charset=utf-8');
		fpassthru($handle);
		fclose($handle) ;
		doExit() ;
		break ;
	
	case '/data' :
		print $data ;
		doExit() ;
		break ;
	
	default :
		header("HTTP/1.0 500 Internal Server Error");
		doExit() ;
}

if( $oXMLWriter ) {
	header('Content-Type: application/xml; charset=utf-8');
	print $oXMLWriter->outputMemory();
	doExit() ;
}

?>
