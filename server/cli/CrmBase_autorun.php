<?php
//ini_set( 'memory_limit', '4096M');
$server_root = dirname($_SERVER['SCRIPT_NAME']).'/..' ;
if( $_SERVER['SCRIPT_NAME'] == '' )
	$server_root = './..' ;

$app_root='..' ;
//$server_root='.' ;

//include("$server_root/backend_checksession.inc.php") ;

include("$server_root/include/config.inc.php");

include( "$server_root/include/database/mysql_DB.inc.php" ) ;
$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, '', $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;

include("$server_root/modules/paracrm/backend_paracrm.inc.php");

function print_usage() {
	$str = <<<EOF

NOTE : Env OPTIMA_DB must be set.
Usage :
   <domain_id>...            : Do QSQL autorun for domain(s)


EOF;

	die($str) ;
}


function inputStd( $invite_msg, $silent=FALSE ) {
	echo $invite_msg ;
	return fgets(STDIN) ;
}

function openBaseDb( $domain_id, $do_select=TRUE ) {
	global $_opDB ;
	
	$domain_base_db = DatabaseMgr_Base::getBaseDb($domain_id) ;
	
	$result = $_opDB->query("SHOW DATABASES") ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		if( $arr[0] == $domain_base_db ) {
			if( $do_select ) {
				$_opDB->select_db($domain_base_db) ;
			}
			return ;
		}
	}
	die("ERR: Non existant domain [ $domain_id ]\nAbort.\n") ;
}

function do_autorun( $domain_id ) {
	global $_opDB ;
	
	openBaseDb($domain_id,$do_select=TRUE) ;
	
	$t = new DatabaseMgr_Sdomain( $domain_id ) ;
	foreach( $t->sdomains_getAll() as $sdomain_id ) {
		do_autorun_sdomain( $t->getSdomainDb($sdomain_id) ) ;
	}
}
function do_autorun_sdomain( $sql_database ) {
	global $_opDB ;
	
	$query = "SELECT sql_querystring, sql_is_rw
		FROM {$sql_database}.qsql
		WHERE autorun_is_on='O'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$sql_querystring = $arr[0] ;
		$sql_is_rw = ($arr[1]=='O') ;
		$ret = paracrm_queries_qsql_lib_exec($sql_querystring,$sql_is_rw) ;
		//print_r($ret) ;
	}
}

if( !getenv('OPTIMA_DB') || count($argv) < 2 ) {
	print_usage() ;
}
for( $i=1 ; $i<count($argv) ; $i++ ) {
	do_autorun($domain_id=$argv[$i]) ;
}

?>
