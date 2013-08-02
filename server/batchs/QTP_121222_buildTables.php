<?php
//ini_set( 'memory_limit', '4096M');
$server_root = dirname($_SERVER['SCRIPT_NAME']).'/..' ;
if( $_SERVER['SCRIPT_NAME'] == '' )
	$server_root = './..' ;

$app_root='..' ;
//$server_root='.' ;

//include("$server_root/backend_checksession.inc.php") ;

include("$server_root/include/config.inc.php");

include("$server_root/modules/media/include/media.inc.php");

include( "$server_root/include/database/mysql_DB.inc.php" ) ;
$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, $mysql_db, $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;

include("$server_root/modules/paracrm/backend_paracrm.inc.php");




$query = "SELECT bible_code FROM define_bible" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE )
{
	$bible_code = $arr[0] ;
	
	$t = new DatabaseMgr_Sdomain();
	$t->sdomainDefine_buildBible( DatabaseMgr_Sdomain::sdomain_getCurrent(), $bible_code ) ;
}


$query = "SELECT file_code FROM define_file" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE )
{
	$file_code = $arr[0] ;
	
	$t = new DatabaseMgr_Sdomain();
	$t->sdomainDefine_buildFile( DatabaseMgr_Sdomain::sdomain_getCurrent(), $file_code ) ;
}


?>