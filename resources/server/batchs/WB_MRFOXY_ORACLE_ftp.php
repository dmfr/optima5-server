<?php


$app_root = dirname($_SERVER['SCRIPT_NAME']).'/../../..' ;
$server_root=$app_root.'/server' ;
$resources_root=$app_root.'/resources' ;
$templates_dir=$resources_root.'/server/templates' ;

@include_once 'PHPExcel/PHPExcel.php' ;

include("$server_root/include/config.inc.php");
include("$server_root/include/toolfunctions.inc.php");
include("$server_root/modules/media/include/media.inc.php");

include( "$server_root/include/database/mysql_DB.inc.php" ) ;
$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, $mysql_db, $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;

include("$server_root/modules/spec_wb_mrfoxy/backend_spec_wb_mrfoxy.inc.php");
include("WB_MRFOXY_ORACLE_ftp_procPRICES.inc.php");
include("WB_MRFOXY_ORACLE_ftp_procSALES.inc.php");
include("WB_MRFOXY_ORACLE_ftp_procBUDGETREVENUE.inc.php");

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


$map_ftpDir_crmArr = array(
	'ITEMS' => array('bible','IRI_PROD'),
	'SALES' => array('file','ORACLE_SALES_LINE'),
	'PURCHASE' => array('file','ORACLE_PURCHASE'),
	'PRICES' => array('file','_STD_PRICE'),
	'BUDGETREVENUE' => array('file','BUDGET_REVENUE')
);

foreach( $map_ftpDir_crmArr as $ftpDir => $crmArr ) {
	ftp_chdir($_IN_conn_ftp,$_IN_ftp_dir."/".$ftpDir) ;
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
			if( $ftpDir=='PURCHASE' && ftell($handle_in) > 0 ) {
				$_has_PURCHASE = TRUE ;
			}
			fseek($handle_in,0) ;
			if( $ftpDir=='PRICES' ) {
				$handle_out = tmpfile() ;
				WB_MRFOXY_ORACLE_ftp_procPRICES($handle_in,$handle_out) ;
				fclose($handle_in) ;
				fseek($handle_out,0) ;
				$handle_in = $handle_out ;
			}
			if( $ftpDir=='SALES' ) {
				$handle_out = tmpfile() ;
				WB_MRFOXY_ORACLE_ftp_procSALES($handle_in,$handle_out) ;
				fclose($handle_in) ;
				fseek($handle_out,0) ;
				$handle_in = $handle_out ;
			}
			if( $ftpDir=='BUDGETREVENUE' ) {
				$handle_out = tmpfile() ;
				WB_MRFOXY_ORACLE_ftp_procBUDGETREVENUE($handle_in,$handle_out) ;
				fclose($handle_in) ;
				fseek($handle_out,0) ;
				$handle_in = $handle_out ;
			}
			$ret_value = paracrm_lib_dataImport_commit_processHandle( $crmArr[0], $crmArr[1], $handle_in ) ;
			fclose($handle_in) ;
			
			// try to detect timeout ?
			if( ftp_nlist($_IN_conn_ftp,'.') === FALSE ) {
				$_IN_conn_ftp = connect_IN_ftp() ;
				ftp_chdir($_IN_conn_ftp,$_IN_ftp_dir."/".$ftpDir) ;
			}
			
			if( $ret_value ) {
				echo " OK\n" ;
				ftp_rename( $_IN_conn_ftp, $filename, 'history/'.$filename ) ;
			} else {
				echo " failed\n" ;
			}
		}
	}
}


ftp_close($_IN_conn_ftp) ;


?>