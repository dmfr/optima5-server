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

include("$server_root/modules/paracrm/backend_paracrm.inc.php");

//ini_set( 'memory_limit', '4096M');

include("$server_root/include/GMaps.php" ) ;


$bible_code = 'STORE' ;

$db_table_tree = 'store_bible_'.$bible_code.'_tree' ;
$db_table_entry = 'store_bible_'.$bible_code.'_entry' ;

$TMP_cache_STOREGROUPPRODS = array() ;
$query = "select treenode_key,field_STOREGROUPPRODS_str from $db_table_tree" ;
$res = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_assoc($res)) != FALSE )
{
	$TMP_cache_STOREGROUPPRODS[$arr['treenode_key']] = $arr['field_STOREGROUPPRODS_str'] ;
}


$query = "DELETE FROM $db_table_tree" ;
$_opDB->query($query) ;
$query = "DELETE FROM $db_table_entry" ;
$_opDB->query($query) ;


$tab_tree = array() ;
$tab_entries = array() ;

$GMap = new GMaps($google_key);

$handle = fopen("php://stdin","rb") ;
while( !feof($handle) )
{
	$arr_csv = fgetcsv($handle) ;

	/*	
	if( !in_array($arr_csv[5],array('PFF03','PFF06','PFF14','PFF15','PFF17')) )
		continue ;
	*/
	if( stripos($arr_csv[5],'PFF') === FALSE && $arr_csv[5] != 'Vaccant' )
		continue ;
	if( $arr_csv[5] == 'Vaccant' ) {
		$arr_csv[5] = 'VACANT' ;
	} else {
		$ttmp = explode(" ",$arr_csv[5]) ;
		foreach( $ttmp as $mvalue ){
			if( !(stripos($mvalue,'PFF') === FALSE) ) {
				$arr_csv[5] = $mvalue ;
				break ;
			}
		}
	}
	
	$code_mag = $arr_csv[0] ;
	if( strlen($code_mag) != 11 )
	{
		print_r($arr_csv) ;
		continue ;
	}
	$code_ens = substr($arr_csv[0],0,5) ;
	$code_etb = substr($arr_csv[0],0,8) ;
	
	$arr_mag = array() ;
	$arr_mag['treenode_key'] = $code_etb ;
	$arr_mag['entry_key'] = $code_mag ;
	$arr_mag['field_STORECODE'] = $code_mag ;
	$arr_mag['field_STORENAME'] = $arr_csv[4] ;
	$arr_mag['field_STORELINK'] = json_encode(array($arr_csv[5])) ;
	$arr_mag['field_STORETYPE'] = $arr_csv[2] ;
	$arr_mag['field_STORESURF'] = $arr_csv[3] ;
	$arr_mag['field_STORETEL'] = '+33 '.str_replace(' ',' ',$arr_csv[13]) ;
	$arr_mag['field_STOREFAX'] = '+33 '.str_replace(' ',' ',$arr_csv[14]) ;
	$arr_mag['field_STORESIRET'] = str_replace(' ','',$arr_csv[15]).str_replace(' ','',$arr_csv[16]) ;
	$arr_mag['field_STOREADR'] = $arr_csv[10] ;
	$arr_mag['field_STORECP'] = $arr_csv[9] ;
	$arr_mag['field_STOREVILLE'] = $arr_csv[8] ;
	/*
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
	*/
	$tab_entries[$code_mag] = $arr_mag ;
	
	$arr_etb = array() ;
	$arr_etb['treenode_key'] = $code_etb ;
	$arr_etb['treenode_parent_key'] = $code_ens ;
	$arr_etb['field_STOREGROUPCODE'] = $code_etb ;
	$arr_etb['field_STOREGROUPNAME'] = $arr_csv[7] ;
	if( $TMP_cache_STOREGROUPPRODS[$code_etb] )
	{
		$arr_etb['field_STOREGROUPPRODS'] = $TMP_cache_STOREGROUPPRODS[$code_etb] ;
	}
	if( !$tab_tree[$code_etb] )
		$tab_tree[$code_etb] = $arr_etb ;
	
	$arr_ens = array() ;
	$arr_ens['treenode_key'] = $code_ens ;
	$arr_ens['treenode_parent_key'] = '' ;
	$arr_ens['field_STOREGROUPCODE'] = $code_ens ;
	$arr_ens['field_STOREGROUPNAME'] = $arr_csv[6] ;
	if( $TMP_cache_STOREGROUPPRODS[$code_ens] )
	{
		$arr_ens['field_STOREGROUPPRODS'] = $TMP_cache_STOREGROUPPRODS[$code_ens] ;
	}
	if( !$tab_tree[$code_ens] )
		$tab_tree[$code_ens] = $arr_ens ;
	
}
fclose($handle) ;






foreach($tab_tree as $arr_tree )
{
	$arr_ins = array() ;
	$arr_ins['treenode_key'] = $arr_tree['treenode_key'] ;
	$arr_ins['treenode_parent_key'] = $arr_tree['treenode_parent_key'] ;
	foreach( $arr_tree as $mkey=>$mvalue )
	{
		if( !(strpos($mkey,'field_') === 0) )
			continue ;
		$mkey.= '_str' ; 
		$arr_ins[$mkey] = $mvalue ;
	}
	$_opDB->insert($db_table_tree,$arr_ins) ;
}



foreach($tab_entries as $arr_entry )
{
	$arr_ins = array() ;
	$arr_ins['treenode_key'] = $arr_entry['treenode_key'] ;
	$arr_ins['entry_key'] = $arr_entry['entry_key'] ;
	foreach( $arr_entry as $mkey=>$mvalue )
	{
		if( !(strpos($mkey,'field_') === 0) )
			continue ;
		$mkey.= '_str' ; 
		$arr_ins[$mkey] = $mvalue ;
	}
	foreach( $arr_entry as $mkey=>$mvalue )
	{
		if( !(strpos($mkey,'gmap_') === 0) )
			continue ;
		$arr_ins[$mkey] = $mvalue ;
	}
	$_opDB->insert($db_table_entry,$arr_ins) ;
}






$_opDB->select_db( $mysql_db ) ;
?>