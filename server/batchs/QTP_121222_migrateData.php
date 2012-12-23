<?php
//ini_set( 'memory_limit', '4096M');
$server_root = dirname($_SERVER['SCRIPT_NAME']).'/..' ;
if( $_SERVER['SCRIPT_NAME'] == '' )
	$server_root = './..' ;

$app_root='..' ;
//$server_root='.' ;

//include("$server_root/backend_checksession.inc.php") ;

include("$server_root/include/config.inc.php");

include("$server_root/modules/media/include/media.inc.php");

include( "$server_root/include/database/mysql_DB.inc.php" ) ;
$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, $mysql_db, $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;

include("$server_root/modules/paracrm/backend_paracrm.inc.php");

$_opDB->select_db( $mysql_db.'_'.'paracrm') ;


$selected_db = $_opDB->query_uniqueValue("SELECT DATABASE()") ;
$arr_existing_tables = array() ;
$query = "SHOW TABLES FROM $selected_db" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE )
	$arr_existing_tables[] = $arr[0] ;



if( in_array('store_bible_tree',$arr_existing_tables) && in_array('store_bible_tree_field',$arr_existing_tables) ) {
$query = "SELECT bible_code FROM define_bible" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE )
{
	$bible_code = $arr[0] ;
	
	$ttmp = paracrm_define_buildBibleTree( $bible_code ) ;
	$db_table = $ttmp[0] ;
	
	$copy_columns = array() ;
	foreach( $ttmp[1] as $mkey => $value ) {
		$src = '' ;
		switch( $value ) {
			case 'varchar(500)' :
			$src = 'treenode_field_value_link' ;
			break ;
			
			case 'int(11)' :
			case 'decimal(10,2)' :
			$src = 'treenode_field_value_number' ;
			break ;
			
			case 'datetime' :
			$src = 'treenode_field_value_date' ;
			break ;
			
			case 'varchar(200)' :
			case 'varchar(100)' :
			$src = 'treenode_field_value_string' ;
			break ;
			
			default :
			continue 2 ;
		}
		$copy_columns[$mkey] = $src ;
	}
		
	$query = "TRUNCATE $db_table" ;
	$_opDB->query($query) ;
	
	$query = "SELECT treenode_key, treenode_parent_key FROM store_bible_tree WHERE bible_code='$bible_code'" ;
	$res = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($res)) != FALSE ) {
		$arr_ins = array() ;
		$arr_ins['treenode_key'] = $arr[0] ;
		$arr_ins['treenode_parent_key'] = $arr[1] ;
	
		$query = "SELECT * FROM store_bible_tree_field WHERE treenode_key='{$arr[0]}'" ;
		$res2 = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_assoc($res2)) != FALSE ) {
			$field_code = $arr['treenode_field_code'] ;
			if( strpos($field_code,'gmap_') === FALSE && strpos($field_code,'media_') === FALSE ) {
				$field_code = 'field_'.$field_code ;
			}
		
			$dbkey = $ttmp[3][$field_code] ;
			if( !$dbkey ) {
				continue ;
			}
					
			if( $src = $copy_columns[$dbkey] ) {
				$arr_ins[$dbkey] = $arr[$src] ;
			}
		}
		
		$_opDB->insert($db_table,$arr_ins) ;
	}
}
$query = "DROP TABLE store_bible_tree" ;
$_opDB->query($query) ;
$query = "DROP TABLE store_bible_tree_field" ;
$_opDB->query($query) ;
}
	
	
	
	
	
	
	
	
if( in_array('store_bible_entry',$arr_existing_tables) && in_array('store_bible_entry_field',$arr_existing_tables) ) {
$query = "SELECT bible_code FROM define_bible" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE )
{
	$bible_code = $arr[0] ;
	
	$ttmp = paracrm_define_buildBibleEntry( $bible_code ) ;
	$db_table = $ttmp[0] ;
	
	$copy_columns = array() ;
	foreach( $ttmp[1] as $mkey => $value ) {
		$src = '' ;
		switch( $value ) {
			case 'varchar(500)' :
			$src = 'entry_field_value_link' ;
			break ;
			
			case 'int(11)' :
			case 'decimal(10,2)' :
			$src = 'entry_field_value_number' ;
			break ;
			
			case 'datetime' :
			$src = 'entry_field_value_date' ;
			break ;
			
			case 'varchar(200)' :
			case 'varchar(100)' :
			$src = 'entry_field_value_string' ;
			break ;
			
			default :
			continue 2 ;
		}
		$copy_columns[$mkey] = $src ;
	}
		
	$query = "TRUNCATE $db_table" ;
	$_opDB->query($query) ;
	
	$query = "SELECT entry_key, treenode_key FROM store_bible_entry WHERE bible_code='$bible_code'" ;
	$res = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($res)) != FALSE ) {
		$arr_ins = array() ;
		$arr_ins['entry_key'] = $arr[0] ;
		$arr_ins['treenode_key'] = $arr[1] ;
	
		$query = "SELECT * FROM store_bible_entry_field WHERE entry_key='{$arr[0]}'" ;
		$res2 = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_assoc($res2)) != FALSE ) {
			$field_code = $arr['entry_field_code'] ;
			if( strpos($field_code,'gmap_') === FALSE && strpos($field_code,'media_') === FALSE ) {
				$field_code = 'field_'.$field_code ;
			}
			
			$dbkey = $ttmp[3][$field_code] ;
			if( !$dbkey ) {
				continue ;
			}
			
			if( $src = $copy_columns[$dbkey] ) {
				$arr_ins[$dbkey] = $arr[$src] ;
			}
		}
		
		$_opDB->insert($db_table,$arr_ins) ;
	}
}
$query = "DROP TABLE store_bible_entry" ;
$_opDB->query($query) ;
$query = "DROP TABLE store_bible_entry_field" ;
$_opDB->query($query) ;
}




if( in_array('store_file_field',$arr_existing_tables) ) {
$query = "SELECT file_code FROM define_file" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE )
{
	$file_code = $arr[0] ;
	
	$ttmp = paracrm_define_buildFile( $file_code ) ;
	$db_table = $ttmp[0] ;
	
	
	$copy_columns = array() ;
	foreach( $ttmp[1] as $mkey => $value ) {
		$src = '' ;
		switch( $value ) {
			case 'varchar(500)' :
			$src = 'filerecord_field_value_link' ;
			break ;
			
			case 'int(11)' :
			case 'decimal(10,2)' :
			$src = 'filerecord_field_value_number' ;
			break ;
			
			case 'datetime' :
			$src = 'filerecord_field_value_date' ;
			break ;
			
			case 'varchar(200)' :
			case 'varchar(100)' :
			$src = 'filerecord_field_value_string' ;
			break ;
			
			default :
			continue 2 ;
		}
		$copy_columns[$mkey] = $src ;
	}
	
	// print_r($copy_columns) ;
	
	$query = "TRUNCATE $db_table" ;
	$_opDB->query($query) ;
	
	$query = "SELECT filerecord_id FROM store_file WHERE file_code='$file_code'" ;
	$res = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($res)) != FALSE ) {
		$arr_ins = array() ;
		$arr_ins['filerecord_id'] = $arr[0] ;
	
		$query = "SELECT * FROM store_file_field WHERE filerecord_id='{$arr[0]}'" ;
		$res2 = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_assoc($res2)) != FALSE ) {
			$field_code = $arr['filerecord_field_code'] ;
			if( strpos($field_code,'gmap_') === FALSE && strpos($field_code,'media_') === FALSE ) {
				$field_code = 'field_'.$field_code ;
			}
		
			$dbkey = $ttmp[3][$field_code] ;
			if( !$dbkey ) {
				continue ;
			}
		
			if( $src = $copy_columns[$dbkey] ) {
				$arr_ins[$dbkey] = $arr[$src] ;
			}
		}
		
		$_opDB->insert($db_table,$arr_ins) ;
	}
	
	$query = "DELETE FROM $db_table WHERE filerecord_id NOT IN (SELECT filerecord_id FROM store_file WHERE file_code='$file_code' AND sync_is_deleted<>'O')" ;
	$_opDB->query($query) ;
}
$query = "DROP TABLE store_file_field" ;
$_opDB->query($query) ;
}
$query = "ALTER TABLE store_file ENGINE=MyISAM" ;
$_opDB->query($query) ;


?>