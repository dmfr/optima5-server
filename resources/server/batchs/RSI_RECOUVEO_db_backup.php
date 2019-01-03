<?php

include("$server_root/include/config.inc.php");
include("$server_root/include/toolfunctions.inc.php");
include("$server_root/modules/media/include/media.inc.php");

include( "$server_root/include/database/mysql_DB.inc.php" ) ;

$ftp_ip = '10.39.56.1' ;
$ftp_username = 'backup' ;
$ftp_password = 'Lognes2018' ;
$ftp_chdir = '/VeoBackups/strange_db' ;

$timestamp = time() ;

function exec_command_to_ftp( $cmdline, $conn_ftp, $ftp_filename )
{
	if( !($conn_ftp) )
		return -1 ;

	$handle = popen( $cmdline, 'r' ) ;

	$upload = ftp_fput( $conn_ftp, $ftp_filename, $handle, FTP_BINARY ) ;
	if( !$upload )
		return -1 ;

	return 0 ;
}
function cmp_strlengths( $a, $b )
{
	$a = strtotime($a,0);
	$b = strtotime($b,0);

	if( $a == $b )
		return 0 ;

	return ($a>$b);
}


$tst = mysql_connect($mysql_host, $mysql_user, $mysql_pass) ;
$show = mysql_query("SHOW DATABASES") ;
$tab = array() ;
while ($row = mysql_fetch_assoc($show)) {
	if (substr($row['Database'], 0, 3) == "op5"){
		$tab[] = $row['Database'] ;
	}
}
//print_r($tab) ;
$JOBS = array() ;
foreach ($tab as $key => $arr){
	$key1 = $key+1;
	$JOBS['JOB'.$key1]['db_name'] = $arr ;
	$JOBS['JOB'.$key1]['filenamebase'] = $arr ;
	$JOBS['JOB'.$key1]['interval'] = "10 min" ;
}
//print_r($JOBS) ;


if(( !($conn_ftp = ftp_connect($ftp_ip)) )
	|| !ftp_login($conn_ftp, $ftp_username, $ftp_password )
	|| !ftp_chdir($conn_ftp, $ftp_chdir) )
{ }
else
{
$arr_allfiles = array() ;
$arr_allfiles = ftp_nlist( $conn_ftp, '.' ) ;

foreach( $JOBS as $jobname => $arr_job )
{
	$length = strlen($arr_job['filenamebase']) ;
	$arr_filesjob = array();
	foreach( $arr_allfiles as $filename )
	{
		if( substr($filename,0,$length) == $arr_job['filenamebase'] )
		{
			$tmp = explode('.',$filename) ;
			reset($tmp);
			$filenamebase = current($tmp) ;
			if( strlen($filenamebase) != $length + 1 + 8 + 1 + 4 )
				continue ;
			$srt_datetime = substr($filenamebase, $length + 1 , 8 ).' '.substr($filenamebase, $length + 1 + 8 + 1 , 2 ).':'.substr($filenamebase, $length + 1 + 8 + 1 + 2 , 2 ) ;
			$file_timestamp = strtotime( $srt_datetime ) ;

			$arr_filesjob[$filename] = $file_timestamp ;
		}
	}
	arsort($arr_filesjob) ;

	// extraction du 1er intervalle <=> fréquence des backups
	$first_interval = $arr_job['interval'] ;

	// faut-il faire un backup à cet instant T
	//  - on examine la date du fichier bak le + recent ( arsort )
	reset($arr_filesjob) ;
	$timestamp_lastone = current($arr_filesjob) ;
	if( $timestamp_lastone == NULL || $timestamp_lastone <= strtotime( '-'.$first_interval, $timestamp ) )
	{
		// run command
		$dest_filename = $arr_job['filenamebase'].'_'.date('Ymd',$timestamp).'_'.date('Hi',$timestamp).'.gz' ;
		exec_command_to_ftp( "mysqldump --user=".$mysql_user." --password=".$mysql_pass."{$arr_job['db_name']} | gzip" , $conn_ftp, $dest_filename ) ;
	}


	foreach( $arr_filesjob as $filename => $file_timestamp )
	{
		if( $first_interval < strtotime( '1 day', 0 )
			&& $file_timestamp < strtotime( '-1 day', $timestamp ) )
		{
			$ref_timestamp = strtotime( date('Y-m-d',$file_timestamp).' 03:00' );
			if( $file_timestamp >= $ref_timestamp
				&& $file_timestamp < strtotime( '+1 hour' ,$ref_timestamp ) )
			{
				continue ;
			}

			ftp_delete( $conn_ftp, $filename ) ;
		}

		if( $first_interval < strtotime( '1 hour', 0 )
			&& $file_timestamp < strtotime( '-1 hour', $timestamp ) )
		{
			$ref_timestamp = strtotime( date('Y-m-d',$file_timestamp).' '.date('H',$file_timestamp).':00' );
			if( $file_timestamp >= $ref_timestamp
				&& $file_timestamp < strtotime( "+".$first_interval ,$ref_timestamp ) )
			{
				continue ;
			}

			ftp_delete( $conn_ftp, $filename ) ;
		}
	}
}
}

@ftp_close($conn_ftp);





?>
