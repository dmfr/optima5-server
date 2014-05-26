<?php
ini_set( 'memory_limit', '256M');

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

include("$server_root/modules/paracrm/backend_paracrm.inc.php");

$_IN_ftp_ip = getenv('FTP_IP') ;
$_IN_ftp_user = getenv('FTP_USER') ;
$_IN_ftp_pass = getenv('FTP_PASS') ;
$_IN_ftp_dir = getenv('FTP_DIR') ;

function connect_IN_ftp() {
	global $_IN_ftp_ip, $_IN_ftp_user, $_IN_ftp_pass ;
	$_IN_conn_ftp = ftp_connect($_IN_ftp_ip) ;
	$login_result = ftp_login($_IN_conn_ftp, $_IN_ftp_user, $_IN_ftp_pass ) ;
	if( $_IN_conn_ftp && $login_result ) {
		return $_IN_conn_ftp ;
	}
	return FALSE ;
}

$_IN_conn_ftp = connect_IN_ftp() ;
if( $_IN_conn_ftp ) {
	echo "In FTP : connexion etablie.\n" ;
} else {
	echo "In FTP : failed to connect !\n" ;
	exit ;
}


ftp_chdir($_IN_conn_ftp,$_IN_ftp_dir."/SALES") ;
if( $tlist = ftp_nlist($_IN_conn_ftp,'.') ) {
	if( !in_array('history',$tlist) ) {
		ftp_mkdir($_IN_conn_ftp,'history') ;
	}
	foreach( $tlist as $filename )
	{
		if( ftp_size($_IN_conn_ftp, $filename) < 0 || in_array($filename,array('.','..','history')) )
			continue ;
			
		echo " Proc: ".$filename." ..." ;
		
		$handle_in = tmpfile() ;
		ftp_fget( $_IN_conn_ftp, $handle_in, $filename, FTP_BINARY );
		fseek($handle_in,0) ;
		$ret_value = paracrm_lib_dataImport_commit_processHandle( 'file', 'ORACLE_SALES_LINE', $handle_in ) ;
		fclose($handle_in) ;
		
		// try to detect timeout ?
		if( ftp_nlist($_IN_conn_ftp,'.') === FALSE ) {
			$_IN_conn_ftp = connect_IN_ftp() ;
			ftp_chdir($_IN_conn_ftp,$_IN_ftp_dir."/SALES") ;
		}
		
		if( $ret_value ) {
			echo " OK\n" ;
			ftp_rename( $_IN_conn_ftp, $filename, 'history/'.$filename ) ;
		} else {
			echo " failed\n" ;
		}
	}
}
ftp_close($_IN_conn_ftp) ;


?>