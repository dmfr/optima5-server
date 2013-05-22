<?php
//ini_set( 'memory_limit', '4096M');
$server_root = dirname($_SERVER['SCRIPT_NAME']).'/..' ;
if( $_SERVER['SCRIPT_NAME'] == '' )
	$server_root = './..' ;

$app_root='..' ;

include("$server_root/include/config.inc.php");
include("$server_root/include/toolfunctions.inc.php");
include("$server_root/modules/media/include/media.inc.php");

include( "$server_root/include/database/mysql_DB.inc.php" ) ;
$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, $mysql_db, $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;

include("$server_root/modules/paracrm/backend_paracrm.inc.php");


$scen_id = $argv[1] ;
$scen_page_index = $argv[2] ;

if( !$scen_id || !isset($argv[2]) ) {
	echo "Bad arguments\n" ;
	exit ;
}

$query = "UPDATE input_scen_page 
				SET scen_page_index = scen_page_index + 1
				WHERE scen_id='$scen_id' AND scen_page_index >= '$scen_page_index'
				ORDER BY scen_page_index DESC" ;
$_opDB->query($query) ;

$query = "UPDATE input_scen_page_field 
				SET scen_page_index = scen_page_index + 1
				WHERE scen_id='$scen_id' AND scen_page_index >= '$scen_page_index'
				ORDER BY scen_page_index DESC" ;
$_opDB->query($query) ;
$query = "UPDATE input_scen_page_field 
				SET scen_page_parent_index = scen_page_parent_index + 1
				WHERE scen_id='$scen_id' AND scen_page_parent_index<>'0' AND scen_page_parent_index >= '$scen_page_index'
				ORDER BY scen_page_parent_index DESC" ;
$_opDB->query($query) ;

$query = "UPDATE input_scen_pagepivot 
				SET scen_page_index = scen_page_index + 1
				WHERE scen_id='$scen_id' AND scen_page_index >= '$scen_page_index'
				ORDER BY scen_page_index DESC" ;
$_opDB->query($query) ;
$query = "UPDATE input_scen_pagepivot 
				SET target_page_index = target_page_index + 1
				WHERE scen_id='$scen_id' AND target_page_index >= '$scen_page_index'
				ORDER BY target_page_index DESC" ;
$_opDB->query($query) ;
$query = "UPDATE input_scen_pagepivot 
				SET foreignsrc_page_index = foreignsrc_page_index + 1
				WHERE scen_id='$scen_id' AND foreignsrc_is_on='O' AND foreignsrc_page_index >= '$scen_page_index'
				ORDER BY foreignsrc_page_index DESC" ;
$_opDB->query($query) ;

$query = "UPDATE input_scen_pagepivot_copymap 
				SET scen_page_index = scen_page_index + 1
				WHERE scen_id='$scen_id' AND scen_page_index >= '$scen_page_index'
				ORDER BY scen_page_index DESC" ;
$_opDB->query($query) ;





?>