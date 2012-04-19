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


$TAB = array() ;
$query = "SELECT * FROM `store_bible_entry`" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
{
	$TAB[$arr['bible_code']][$arr['entry_key']] = $arr ;
}
$TAB_d = array() ;
$query = "SELECT * FROM `store_bible_entry_field`" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
{
	$TAB_d[$arr['bible_code']][$arr['entry_key']][$arr['entry_field_code']] = $arr ;
}



$query = "TRUNCATE TABLE store_bible_entry" ;
$_opDB->query($query) ;
$query = "TRUNCATE TABLE store_bible_entry_field" ;
$_opDB->query($query) ;


$querys = array() ;
$querys[] = "ALTER TABLE `store_bible_entry` ENGINE=InnoDB" ;
$querys[] = "ALTER TABLE `store_bible_entry_field` ENGINE=InnoDB" ;
$querys[] = "ALTER TABLE `store_bible_entry` DROP PRIMARY KEY" ;
$querys[] = "ALTER TABLE `store_bible_entry` DROP INDEX `treenode_key`" ;
$querys[] = "ALTER TABLE `store_bible_entry` ADD `entry_racx` INT NOT NULL AUTO_INCREMENT AFTER `bible_code` , ADD PRIMARY KEY ( `entry_racx` )" ;
$querys[] = "ALTER TABLE `store_bible_entry` ADD UNIQUE (`bible_code` , `entry_key` )" ;
$querys[] = "ALTER TABLE `store_bible_entry` ADD INDEX ( `treenode_key` )" ;
$querys[] = "ALTER TABLE `store_bible_entry_field` DROP PRIMARY KEY" ;
$querys[] = "ALTER TABLE `store_bible_entry_field` ADD `entry_racx` INT NOT NULL AFTER `bible_code`" ;
$querys[] = "ALTER TABLE `store_bible_entry_field` ADD PRIMARY KEY ( `entry_racx` , `entry_field_code` )" ;
$querys[] = "ALTER TABLE `store_bible_entry_field` ADD UNIQUE (`bible_code` , `entry_key` , `entry_field_code` )" ;
foreach( $querys as $query)
{
	$_opDB->query($query) ;
}

echo "/" ;
$query = "START TRANSACTION" ;
$_opDB->query($query) ;
foreach( $TAB as $bible_code => $arr1 )
{
	foreach( $arr1 as $entry_key => $arr_ins )
	{
		$_opDB->insert('store_bible_entry',$arr_ins) ;
		$entry_racx = $_opDB->insert_id() ;
		
		foreach( $TAB_d[$bible_code][$entry_key] as $arr_det )
		{
			$arr_det['entry_racx'] = $entry_racx ;
			$_opDB->insert('store_bible_entry_field',$arr_det) ;
		}
	}
}
$query = "COMMIT" ;
$_opDB->query($query) ;
echo "=\n" ;






$TAB = array() ;
$query = "SELECT * FROM store_bible_tree" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
{
	$TAB[$arr['bible_code']][$arr['treenode_key']] = $arr ;
}
$TAB_d = array() ;
$query = "SELECT * FROM store_bible_tree_field" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
{
	$TAB_d[$arr['bible_code']][$arr['treenode_key']][$arr['treenode_field_code']] = $arr ;
}


$query = "TRUNCATE TABLE store_bible_tree" ;
$_opDB->query($query) ;
$query = "TRUNCATE TABLE store_bible_tree_field" ;
$_opDB->query($query) ;


$querys = array() ;
$querys[] = "ALTER TABLE store_bible_tree ENGINE=InnoDB" ;
$querys[] = "ALTER TABLE store_bible_tree_field ENGINE=InnoDB" ;
$querys[] = "ALTER TABLE store_bible_tree DROP PRIMARY KEY" ;
//$querys[] = "ALTER TABLE `store_bible_entry` DROP INDEX `treenode_key`" ;
$querys[] = "ALTER TABLE store_bible_tree ADD `treenode_racx` INT NOT NULL AUTO_INCREMENT AFTER `bible_code` , ADD PRIMARY KEY ( `treenode_racx` )" ;
$querys[] = "ALTER TABLE store_bible_tree ADD UNIQUE (`bible_code` , `treenode_key` )" ;
$querys[] = "ALTER TABLE store_bible_tree ADD INDEX ( `treenode_parent_key` )" ;
$querys[] = "ALTER TABLE store_bible_tree_field DROP PRIMARY KEY" ;
$querys[] = "ALTER TABLE store_bible_tree_field ADD `treenode_racx` INT NOT NULL AFTER `bible_code`" ;
$querys[] = "ALTER TABLE store_bible_tree_field ADD PRIMARY KEY ( `treenode_racx` , `treenode_field_code` )" ;
$querys[] = "ALTER TABLE store_bible_tree_field ADD UNIQUE (`bible_code` , `treenode_key` , `treenode_field_code` )" ;
foreach( $querys as $query)
{
	$_opDB->query($query) ;
}

echo "/" ;
$query = "START TRANSACTION" ;
$_opDB->query($query) ;
foreach( $TAB as $bible_code => $arr1 )
{
	foreach( $arr1 as $treenode_key => $arr_ins )
	{
		$_opDB->insert('store_bible_tree',$arr_ins) ;
		$treenode_racx = $_opDB->insert_id() ;
		
		foreach( $TAB_d[$bible_code][$treenode_key] as $arr_det )
		{
			$arr_det['treenode_racx'] = $treenode_racx ;
			$_opDB->insert('store_bible_tree_field',$arr_det) ;
		}
	}
}
$query = "COMMIT" ;
$_opDB->query($query) ;
echo "=\n" ;










$query = "SELECT bible_code FROM define_bible" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE )
{
	paracrm_define_buildViewBible($arr[0]) ;
}



$_opDB->select_db( $mysql_db ) ;
?>