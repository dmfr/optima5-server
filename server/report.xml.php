<?php
//ob_start() ;
$app_root='..' ;
$server_root='.' ;

include("$server_root/include/config.inc.php");
include("$server_root/include/toolfunctions.inc.php");

include("$server_root/modules/media/include/media.inc.php");

include( "$server_root/include/database/mysql_DB.inc.php" ) ;

include("$server_root/login.inc.php") ;

if( isset($_INLINE_PW) ) {
	if( ($login_result=op5_login_test( $_REQUEST['PHP_AUTH_USER'], $_REQUEST['PHP_AUTH_PW'] )) && $login_result['done'] ) {
		// OK !
	} else {
		header('HTTP/1.0 403 Forbidden');
		exit ;
	}
} else {
	while(TRUE) {
		$http_digest = TRUE ;
		$http_digest_realm = 'OP5DIGEST';
		if (!empty($_SERVER['PHP_AUTH_DIGEST'])) {
			$digest_data = http_digest_parse($_SERVER['PHP_AUTH_DIGEST']) ;
			$userstr = $digest_data['username'] ;
			$login_result=op5_login_test( $userstr, $_SERVER['PHP_AUTH_DIGEST'], $http_digest, $http_digest_realm ) ;
			if( $login_result && $login_result['done'] ) {
				break ;
			}
		}
		
		header('HTTP/1.1 401 Unauthorized');
		header('WWW-Authenticate: Digest realm="'.$http_digest_realm.
				'",qop="auth",nonce="'.uniqid().'",opaque="'.md5($http_digest_realm).'"');

		die('HTTP Digest Auth required');
		break ;
	}
}

function doExit() {
	session_destroy() ;
	die() ;
}
$session_name = 'OP'.rand(101,999) ;
session_name($session_name) ;
session_start() ;
$_SESSION['login_data'] = $login_result['login_data'] ;

$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, $login_result['mysql_db'], $mysql_user, $mysql_pass );
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
if( $my_module == 'crmbase' ) {
	$my_module = 'paracrm' ;
}
include("$server_root/modules/$my_module/backend_$my_module.inc.php");

$my_sdomain = $_REQUEST['_sdomainId'] ;
if( $my_sdomain ) {
	$_opDB->select_db( $login_result['mysql_db'].'_'.$my_sdomain) ;
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
	$_opDB->select_db( $login_result['mysql_db'] ) ;
}

if( !$TAB ) {
	header("HTTP/1.0 404 Not Found");
	doExit() ;
}
if( !$TAB['success'] ) {
	header( (!$TAB['authDenied'] ? "HTTP/1.0 500 Internal Server Error" : "HTTP/1.0 403 Forbidden") );
	doExit() ;
}

if( $TAB['tabs'] ) {
	$tabs = $TAB['tabs'] ;
} elseif( $TAB['result_tab'] ) {
	$TAB['result_tab']['tab_title'] = 'querygrid' ;
	$tabs = array($TAB['result_tab']) ;
} else {
	header("HTTP/1.0 202 Accepted");
	doExit() ;
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
	
	
	default :
		header("HTTP/1.0 500 Internal Server Error");
		doExit() ;
}

header('Content-Type: application/xml; charset=utf-8');
print $oXMLWriter->outputMemory();
doExit() ;

?>
