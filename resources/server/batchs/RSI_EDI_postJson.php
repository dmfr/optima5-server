<?php
session_start() ;

$app_root = dirname($_SERVER['SCRIPT_NAME']).'/../../..' ;
$server_root=$app_root.'/server' ;
$resources_root=$app_root.'/resources' ;
$templates_dir=$resources_root.'/server/templates' ;

include("$server_root/include/config.inc.php");
include("$server_root/include/toolfunctions.inc.php");
include("$server_root/modules/media/include/media.inc.php");

include( "$server_root/include/database/mysql_DB.inc.php" ) ;
$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, $mysql_db, $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;

function print_usage() {
	$str = <<<EOF

NOTE : Env OPTIMA_DB must be set.

Env variables :
   OPTIMA_DB : Local DB for `view_table_Z_JSON`
   API_URL   : Remote API target URL


EOF;

	die($str) ;
}

if( !getenv('OPTIMA_DB') ) {
	print_usage() ;
}
if( !in_array('view_table_Z_JSON',$_opDB->db_tables()) ) {
	print_usage() ;
}
if( !getenv('API_URL') ) {
	print_usage() ;
}

$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
$_SESSION['login_data']['mysql_db'] = 'op5_'.$_domain_id.'_prod' ;
$_SESSION['login_data']['login_domain'] = $_domain_id.'_prod' ;
$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;




$query = "SELECT * FROM view_table_Z_JSON WHERE LOG_SENT='0' ORDER BY LOG_DATE,OUT_METHOD" ;
$result = $_opDB->query($query) ;
while(($arr=$_opDB->fetch_assoc($result)) != NULL) {
	$done = FALSE ;
	
	// Construction de l'URL
	$arr_url = parse_url(getenv('API_URL')) ;
	$auth_url = $arr_url['scheme'].'://'.urlencode($arr["OUT_AUTH_USER"]).':'.urlencode($arr["OUT_AUTH_PASS"]).'@'.$arr_url['host'].'/'.$arr_url['path'].'/'.$arr["OUT_METHOD"] ;
	
	echo $auth_url."\n" ;
	$params = array('http' => array(
	'method' => 'POST',
	'content' => $arr["OUT_JSON"],
	'timeout' => 600
	));
	$ctx = stream_context_create($params);
	$fp = @fopen($auth_url, 'rb', false, $ctx);
	echo $http_response_header[0]."\n" ;
	if( $fp ) {
		echo stream_get_contents($fp);
		echo "\n" ;
		$done = TRUE ;
	}
	echo "\n" ;
	
	if( $done ) {
		$arr_cond = array() ;
		$arr_cond['LOG_DATE'] = $arr['LOG_DATE'] ;
		$arr_cond['OUT_AUTH_USER'] = $arr['OUT_AUTH_USER'] ;
		$arr_cond['OUT_METHOD'] = $arr['OUT_METHOD'] ;
		
		$arr_update = array() ;
		$arr_update['LOG_SENT'] = 1 ;
		
		$_opDB->update('view_table_Z_JSON',$arr_update,$arr_cond) ;
	}
}



?>
