<?php
define( 'CRM_AUTORUN_DEFAULT_DELAY_MN', 10 ) ;


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
	
	$query = "SELECT qsql_id, autorun_cfg_json
		FROM {$sql_database}.qsql
		WHERE autorun_is_on='O'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$qsql_id = $arr[0] ;
		$autorun_cfg = json_decode($arr[1],true) ;
		if( !$autorun_cfg ) {
			$autorun_cfg = array(
				'autorun_is_on' => true,
				'autorun_mode' => 'repeat',
				'autorun_repeat_mndelay' => CRM_AUTORUN_DEFAULT_DELAY_MN
			);
		}
		
		$query = "SELECT * FROM {$sql_database}.qsql_autorun WHERE qsql_id='{$qsql_id}' ORDER BY qsql_autorun_id DESC LIMIT 1" ;
		$res = $_opDB->query($query) ;
		$arr_lastRun = $_opDB->fetch_assoc($res) ;
		
		switch( $autorun_cfg['autorun_mode'] ) {
			case 'repeat' :
				$repeat_mndelay = $autorun_cfg['autorun_repeat_mndelay'] ;
				if( !$arr_lastRun['exec_ts'] ) {
					do_autorun_qsql($sql_database,$qsql_id) ;
					break ;
				}
				if( ( time() - $arr_lastRun['exec_ts'] ) >= ($repeat_mndelay*60) ) {
					do_autorun_qsql($sql_database,$qsql_id) ;
					break ;
				}
				break ;
				
			case 'schedule' :
				$day = date('Y-m-d') ;
				while( TRUE ) {
					if( strtotime( $day.' '.$autorun_cfg['autorun_schedule_time'] ) > time() ) {
						$day = date('Y-m-d',strtotime('-1 day',strtotime($day))) ;
						continue ;
					}
					
					$ts_shouldStart = strtotime( $day.' '.$autorun_cfg['autorun_schedule_time'] ) ;
					if( !$ts_shouldStart ) {
						break ;
					}
					if( ( !$arr_lastRun['exec_ts'] || ($ts_shouldStart > $arr_lastRun['exec_ts']) ) &&  ($ts_shouldStart > strtotime('-1 hour')) ) {
						do_autorun_qsql($sql_database,$qsql_id) ;
					}
					
					break ;
				}
				break ;
				
			default :
				break ;
		}
	}
}
function do_autorun_qsql( $sql_database, $qsql_id ) {
	global $_opDB ;
	
	$query = "SELECT sql_querystring, sql_is_rw, qsql_name
		FROM {$sql_database}.qsql
		WHERE qsql_id='{$qsql_id}'" ;
	$result = $_opDB->query($query) ;
	$arr = $_opDB->fetch_row($result) ;
	if( !$arr ) {
		return ;
	}
	
	$sql_querystring = $arr[0] ;
	$sql_is_rw = ($arr[1]=='O') ;
	
	$arr_ins = array() ;
	$arr_ins['qsql_id'] = $qsql_id ;
	$arr_ins['exec_ts'] = time() ;
	$arr_ins['exec_duration'] = 0 ;
	$_opDB->insert($sql_database.'.'.'qsql_autorun',$arr_ins) ;
	$qsql_autorun_id = $_opDB->insert_id() ;
	
	$mt_start = microtime(true) ;
	$ret = paracrm_queries_qsql_lib_exec($sql_querystring,$sql_is_rw) ;
	$mt_duration = microtime(true) - $mt_start ;
	//print_r($ret) ;
	
	$arr_ins = array() ;
	$arr_ins['exec_duration'] = $mt_duration ;
	$arr_cond = array() ;
	$arr_cond['qsql_autorun_id'] = $qsql_autorun_id ;
	$_opDB->update($sql_database.'.'.'qsql_autorun',$arr_ins,$arr_cond) ;
	
	$lig = '' ;
	$lig = substr_mklig($lig,date('Y-m-d H:i:s'),0,30) ;
	$lig = substr_mklig($lig,$sql_database,30,30) ;
	$lig = substr_mklig($lig,$arr[2],60,30) ;
	$lig = substr_mklig($lig,round($mt_duration,1),90,10) ;
	echo $lig."\n" ;
}

if( !getenv('OPTIMA_DB') || count($argv) < 2 ) {
	print_usage() ;
}
for( $i=1 ; $i<count($argv) ; $i++ ) {
	do_autorun($domain_id=$argv[$i]) ;
}

?>
