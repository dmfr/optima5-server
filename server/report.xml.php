<?php
//ob_start() ;
$app_root='..' ;
$server_root='.' ;

include("$server_root/include/config.inc.php");
include("$server_root/include/toolfunctions.inc.php");

include("$server_root/modules/media/include/media.inc.php");

include( "$server_root/include/database/mysql_DB.inc.php" ) ;

include("$server_root/login.inc.php") ;
if( !isset($_SERVER['PHP_AUTH_USER']) || !($login_result=op5_login_test( $_SERVER['PHP_AUTH_USER'], $_SERVER['PHP_AUTH_PW'] )) || !$login_result['done'] ) {
	header('WWW-Authenticate: Basic realm="OP5"');
	header('HTTP/1.0 401 Unauthorized');
	exit;
}

$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, $login_result['mysql_db'], $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;

$my_module = $_REQUEST['_moduleId'] ;
if( !$my_module ) {
	header("HTTP/1.0 404 Not Found");
	exit ;
}
if( $my_module == 'crmbase' ) {
	$my_module = 'paracrm' ;
}
include("$server_root/modules/$my_module/backend_$my_module.inc.php");

$my_sdomain = $_REQUEST['_sdomainId'] ;
if( $my_sdomain ) {
	$_opDB->select_db( $login_result['mysql_db'].'_'.$my_sdomain) ;
}

$TAB = backend_specific( $_REQUEST ) ;

if( $my_sdomain ) {
	$_opDB->select_db( $login_result['mysql_db'] ) ;
}

if( !$TAB ) {
	header("HTTP/1.0 404 Not Found");
}
if( !$TAB['success'] ) {
	header("HTTP/1.0 500 Internal Server Error");
}

if( $TAB['tabs'] ) {
	$tabs = $TAB['tabs'] ;
} elseif( $TAB['result_tab'] ) {
	$tabs = array($TAB['result_tab']) ;
} else {
	header("HTTP/1.0 404 Not Found");
}

$oXMLWriter = new XMLWriter;
$oXMLWriter->openMemory();
$oXMLWriter->setIndent(true);
$oXMLWriter->startDocument('1.0', 'UTF-8');
$oXMLWriter->startElement("BOOK");
foreach( $tabs as $result_tab ) {
	$oXMLWriter->startElement("TAB");
	foreach( $result_tab['data'] as $data_row ) {
		$oXMLWriter->startElement("ROW");
		foreach( $result_tab['columns'] as $column ) {
			$oXMLWriter->writeElement($column['dataIndex'], $data_row[$column['dataIndex']]);
		}
		$oXMLWriter->endElement() ;
	}
	$oXMLWriter->endElement() ;
}
$oXMLWriter->endElement() ;
$oXMLWriter->endDocument() ;

header('Content-Type: application/xml; charset=utf-8');
print $oXMLWriter->outputMemory();
exit ;

?>