<?php
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

include("$server_root/modules/spec_dbs_lam/backend_spec_dbs_lam.inc.php");

setlocale(LC_ALL,'en_US.UTF-8');

$_sep = ';' ;

$handle = fopen('php://stdin','rb') ;
$map_idx_col = fgetcsv($handle,0,$_sep) ;
foreach( $map_idx_col as &$col ) {
	$col = strtoupper($col) ;
	$col = str_replace(' ','_',$col) ;
}
unset($col) ;

$rows = array() ;
while( !feof($handle) ) {
	$arr_csv = fgetcsv($handle,0,$_sep) ;
	if( !is_array($arr_csv) ) {
		continue ;
	}
	if( count($arr_csv) != count($map_idx_col) ) {
		continue ;
	}
	
	$row = array() ;
	foreach( $map_idx_col as $idx => $mkey ) {
		$val = $arr_csv[$idx] ;
		if( $enc = mb_detect_encoding($val,mb_detect_encoding($val,"UTF-8, ISO-8859-1, ISO-8859-15")) ) {
			$val = mb_convert_encoding($val, "UTF-8", $enc);
		} else {
			$val = iconv( 'UTF-8', 'ASCII//IGNORE',$val) ;
		}
		$row[$mkey] = $val ;
	}
	$rows[] = $row ;
}
foreach( $rows as &$row ) {
	if( strlen($row['DEPT']) <= 2 ) {
		$row['DEPT'] = str_pad( $row['DEPT'], 2, '0', STR_PAD_LEFT ) ;
	} elseif( strlen($row['DEPT']) <= 5 ) {
		$row['DEPT'] = str_pad( $row['DEPT'], 5, '0', STR_PAD_LEFT ) ;
	}
	
	$row['CP'] = str_pad( $row['CP'], 5, '0', STR_PAD_LEFT ) ;
	
	$row['CODE_PF'] = str_pad( $row['CODE_PF'], 3, '0', STR_PAD_LEFT ) ;
}
unset($row) ;

if( count($rows) < 1 ) {
	exit ;
}


$col_words = array() ;
foreach( $map_idx_col as $col ) {
	$col_words[] = "`{$col}` VARCHAR(50)" ;
}

$query = "CREATE TABLE IF NOT EXISTS op5tms_lib_trspt.trspt_agd_plan (".implode(',',$col_words).')' ;
$_opDB->query($query) ;


$query = "LOCK TABLES op5tms_lib_trspt.trspt_agd_plan WRITE" ;
$_opDB->query($query) ;

$_opDB->query("DELETE FROM op5tms_lib_trspt.trspt_agd_plan") ;
foreach( $rows as $row ) {
	$_opDB->insert('op5tms_lib_trspt.trspt_agd_plan',$row) ;
}

$query = "UNLOCK TABLES" ;
$_opDB->query($query) ;


?>
