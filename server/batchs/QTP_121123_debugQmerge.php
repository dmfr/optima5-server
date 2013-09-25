<?php
session_start() ;
$_SESSION['next_transaction_id'] = 1 ;

//ini_set( 'memory_limit', '4096M');
$server_root = dirname($_SERVER['SCRIPT_NAME']).'/..' ;
if( $_SERVER['SCRIPT_NAME'] == '' )
	$server_root = './..' ;

$app_root='..' ;
//$server_root='.' ;

//include("$server_root/backend_checksession.inc.php") ;

include("$server_root/include/config.inc.php");

include("$server_root/modules/media/include/media.inc.php");

//@include_once 'PHPExcel/PHPExcel.php' ;
include( "$server_root/include/database/mysql_DB.inc.php" ) ;
$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, $mysql_db, $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;

include("$server_root/modules/paracrm/backend_paracrm.inc.php");


$qmerge_id = getenv('OPTIMA_QMERGE_ID') ;
if( !$qmerge_id ) {
	fwrite(STDERR, "ERR: No queryId specified (OPTIMA_QMERGE_ID)"."\n");
	exit ;
}

echo "Qmerge init :\n\n" ;
$post_test = array() ;
$post_test['_action'] = 'queries_mergerTransaction' ;
$post_test['_subaction'] = 'init' ;
$post_test['qmerge_id'] = $qmerge_id ;
$json = backend_specific( $post_test ) ;
//print_r($json) ;
echo "Transaction ID : {$json['transaction_id']}\n" ;
echo "\n\n" ;

$transaction_id = $json['transaction_id'] ;

// print_r($_SESSION) ;

echo "Run query !!\n\n" ;
$post_test = array() ;
$post_test['_action'] = 'queries_mergerTransaction' ;
$post_test['_transaction_id'] = $json['transaction_id'] ;
$post_test['_subaction'] = 'run' ;
$post_test['_debug'] = TRUE ;
$json = backend_specific( $post_test ) ;
// print_r($json) ;
echo "\n\n" ;




echo "Get results...\n\n" ;
$post_test = array() ;
$post_test['_action'] = 'queries_mergerTransaction' ;
$post_test['_transaction_id'] = $transaction_id ;
$post_test['_subaction'] = 'res_get' ;
$post_test['RES_id'] = $json['RES_id'] ;
$post_test['_debug'] = TRUE ;
$json = backend_specific( $post_test ) ;
// print_r($json) ;
echo "\n\n" ;

?>