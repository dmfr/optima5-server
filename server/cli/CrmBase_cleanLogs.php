<?php
define( 'CRM_CLEANLOGS_MAX', 100000 ) ;


//ini_set( 'memory_limit', '4096M');
$server_root = dirname($_SERVER['SCRIPT_NAME']).'/..' ;
if( $_SERVER['SCRIPT_NAME'] == '' )
	$server_root = './..' ;

$app_root='..' ;
//$server_root='.' ;

//include("$server_root/backend_checksession.inc.php") ;

include("$server_root/include/config.inc.php");
include("$server_root/include/toolfunctions.inc.php");

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

function do_clean( $domain_id ) {
	global $_opDB ;
	
	openBaseDb($domain_id,$do_select=TRUE) ;
	
	$t = new DatabaseMgr_Sdomain( $domain_id ) ;
	foreach( $t->sdomains_getAll() as $sdomain_id ) {
		do_clean_sdomain( $t->getSdomainDb($sdomain_id) ) ;
	}
}
function do_clean_sdomain( $sql_database ) {
	global $_opDB ;
	
	$query = "SELECT count(*) FROM {$sql_database}.import_log" ;
	$cnt = $_opDB->query_uniqueValue($query) ;
	$max_clean = $cnt - CRM_CLEANLOGS_MAX ;
	if( $max_clean > 0 ) {
		$query = "DELETE FROM {$sql_database}.import_log ORDER BY importlog_id ASC LIMIT {$max_clean}" ;
		$_opDB->query($query) ;
	}
	
	$query = "SELECT count(*) FROM {$sql_database}.qsql_autorun" ;
	$cnt = $_opDB->query_uniqueValue($query) ;
	$max_clean = $cnt - CRM_CLEANLOGS_MAX ;
	if( $max_clean > 0 ) {
		$query = "DELETE FROM {$sql_database}.qsql_autorun ORDER BY qsql_autorun_id ASC LIMIT {$max_clean}" ;
		$_opDB->query($query) ;
	}
	
	$query = "SELECT count(*) FROM {$sql_database}.q_log" ;
	$cnt = $_opDB->query_uniqueValue($query) ;
	$max_clean = $cnt - CRM_CLEANLOGS_MAX ;
	if( $max_clean > 0 ) {
		$query = "DELETE FROM {$sql_database}.q_log ORDER BY qlog_id ASC LIMIT {$max_clean}" ;
		$_opDB->query($query) ;
	}
}


if( !getenv('OPTIMA_DB') ) {
	print_usage() ;
}
for( $i=1 ; $i<count($argv) ; $i++ ) {
	do_clean($domain_id=$argv[$i]) ;
}

?>
