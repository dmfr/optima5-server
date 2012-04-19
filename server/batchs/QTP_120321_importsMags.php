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


include("$server_root/include/GMaps.php" ) ;

$_opDB->select_db( $mysql_db.'_'.'paracrm') ;

$bible_code = 'STORE' ;

foreach( array('store_bible_tree','store_bible_tree_field','store_bible_entry','store_bible_entry_field') as $dbtab )
{
	$query = "DELETE FROM $dbtab WHERE bible_code='$bible_code'" ;
	$_opDB->query($query) ;
}

$tab_tree = array() ;
$tab_entries = array() ;

$GMap = new GMaps($google_key);

$handle = fopen("php://stdin","rb") ;
while( !feof($handle) )
{
	$arr_csv = fgetcsv($handle) ;
	
	if( !in_array($arr_csv[5],array('PFF03','PFF06')) )
		continue ;
	
	$code_mag = $arr_csv[3] ;
	if( strlen($code_mag) != 11 )
	{
		print_r($arr_csv) ;
		continue ;
	}
	$code_ens = substr($arr_csv[3],0,5) ;
	$code_etb = substr($arr_csv[3],0,8) ;
	
	$arr_mag = array() ;
	$arr_mag['treenode_key'] = $code_etb ;
	$arr_mag['entry_key'] = $code_mag ;
	$arr_mag['field_STORECODE'] = $code_mag ;
	$arr_mag['field_STORENAME'] = $arr_csv[4] ;
	$arr_mag['field_STORELINK'] = json_encode(array($arr_csv[5])) ;
	$arr_mag['field_STORETYPE'] = $arr_csv[1] ;
	$arr_mag['field_STORESURF'] = $arr_csv[2] ;
	$arr_mag['field_STORETEL'] = '+33 '.str_replace(' ',' ',$arr_csv[13]) ;
	$arr_mag['field_STOREFAX'] = '+33 '.str_replace(' ',' ',$arr_csv[14]) ;
	$arr_mag['field_STORESIRET'] = str_replace(' ','',$arr_csv[15]).str_replace(' ','',$arr_csv[16]) ;
	$res = FALSE ;
	$GMap = new GMaps($google_key);
	$res = $GMap->getInfoLocation($arr_csv[10].' , '.$arr_csv[9].' '.$arr_csv[8]) ;
	if( !$res )
		$res = $GMap->getInfoLocation($arr_csv[11].' , '.$arr_csv[9].' '.$arr_csv[8]) ;
	if( $res )
	{
		$tab = array() ;
		$tab['lat'] = $GMap->getLatitude() ;
		$tab['lng'] = $GMap->getLongitude() ;
		$arr_mag['gmap_location'] = json_encode($tab) ;
		$arr_mag['gmap_formattedAddress'] = $GMap->getAddress() ;
		print_r($arr_mag) ;
	}
	$tab_entries[$code_mag] = $arr_mag ;
	
	
	$arr_etb['treenode_key'] = $code_etb ;
	$arr_etb['treenode_parent_key'] = $code_ens ;
	$arr_etb['field_STOREGROUPCODE'] = $code_etb ;
	$arr_etb['field_STOREGROUPNAME'] = $arr_csv[7] ;
	$tab_tree[$code_etb] = $arr_etb ;
	
	$arr_ens['treenode_key'] = $code_ens ;
	$arr_ens['treenode_parent_key'] = '' ;
	$arr_ens['field_STOREGROUPCODE'] = $code_ens ;
	$arr_ens['field_STOREGROUPNAME'] = $arr_csv[6] ;
	$tab_tree[$code_ens] = $arr_ens ;
	
}
fclose($handle) ;


foreach($tab_tree as $arr_tree )
{
	$arr_ins = array() ;
	$arr_ins['bible_code'] = $bible_code ;
	$arr_ins['treenode_key'] = $arr_tree['treenode_key'] ;
	$arr_ins['treenode_parent_key'] = $arr_tree['treenode_parent_key'] ;
	$_opDB->insert('store_bible_tree',$arr_ins) ;
	
	foreach( $arr_tree as $mkey=>$mvalue )
	{
		if( !(strpos($mkey,'field_') === 0) )
			continue ;
			
		$field_code = substr($mkey,6,strlen($mkey)-6) ;
			
		$arr_ins = array() ;
		$arr_ins['bible_code'] = $bible_code ;
		$arr_ins['treenode_key'] = $arr_tree['treenode_key'] ;
		$arr_ins['treenode_field_code'] = $field_code ;
		if( $mkey == 'field_STORELINK' )
			$arr_ins['treenode_field_value_link'] = $mvalue ;
		else
			$arr_ins['treenode_field_value_string'] = $mvalue ;
		$_opDB->insert('store_bible_tree_field',$arr_ins) ;
	}
}



foreach($tab_entries as $arr_entry )
{
	$arr_ins = array() ;
	$arr_ins['bible_code'] = $bible_code ;
	$arr_ins['treenode_key'] = $arr_entry['treenode_key'] ;
	$arr_ins['entry_key'] = $arr_entry['entry_key'] ;
	$_opDB->insert('store_bible_entry',$arr_ins) ;
	
	foreach( $arr_entry as $mkey=>$mvalue )
	{
		if( !(strpos($mkey,'field_') === 0) )
			continue ;
			
		$field_code = substr($mkey,6,strlen($mkey)-6) ;
			
		$arr_ins = array() ;
		$arr_ins['bible_code'] = $bible_code ;
		$arr_ins['entry_key'] = $arr_entry['entry_key'] ;
		$arr_ins['entry_field_code'] = $field_code ;
		if( $mkey == 'field_STORELINK' )
			$arr_ins['entry_field_value_link'] = $mvalue ;
		else
			$arr_ins['entry_field_value_string'] = $mvalue ;
		$_opDB->insert('store_bible_entry_field',$arr_ins) ;
	}
	foreach( $arr_entry as $mkey=>$mvalue )
	{
		if( !(strpos($mkey,'gmap_') === 0) )
			continue ;
			
		$field_code = $mkey ;
			
		$arr_ins = array() ;
		$arr_ins['bible_code'] = $bible_code ;
		$arr_ins['entry_key'] = $arr_entry['entry_key'] ;
		$arr_ins['entry_field_code'] = $field_code ;
		$arr_ins['entry_field_value_link'] = $mvalue ;
		$_opDB->insert('store_bible_entry_field',$arr_ins) ;
	}
}







$_opDB->select_db( $mysql_db ) ;