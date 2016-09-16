<?php

function do_post_request_fp($url, $data, $optional_headers = null)
{
  $params = array('http' => array(
              'method' => 'POST',
              'content' => $data
            ));
  if ($optional_headers !== null) {
    $params['http']['header'] = $optional_headers;
  }
  $ctx = stream_context_create($params);
  $fp = @fopen($url, 'rb', false, $ctx);
  if( !$fp ) {
    throw new Exception("Problem with $url");
  }
  return $fp;
}
function do_post_request($url, $data, $optional_headers = null)
{
  $params = array('http' => array(
              'method' => 'POST',
              'content' => $data
            ));
  if ($optional_headers !== null) {
    $params['http']['header'] = $optional_headers;
  }
  $ctx = stream_context_create($params);
  $fp = @fopen($url, 'rb', false, $ctx);
  if (!$fp) {
    throw new Exception("Problem with $url, $php_errormsg");
  }
  $response = @stream_get_contents($fp);
  if ($response === false) {
    throw new Exception("Problem reading data from $url, $php_errormsg");
  }
  return $response;
}
function oscario_http_post( $post_data, $fp=FALSE ) {
	$_URL = 'http://10.39.118.2/oscario/edi.php' ;
	$_domain = 'bluephoenix' ;
	$_auth_username = 'ediJaneiro' ;
	$_auth_password = 'paracrm' ;
	
	$post_base = array();
	$post_base['oscario_domain'] = $_domain ;
	$post_base['auth_username'] = $_auth_username ;
	$post_base['auth_password'] = $_auth_password ;
	$post = $post_base + $post_data ;
	
	if( $fp ) {
		return do_post_request_fp($_URL,http_build_query($post)) ;
	} else {
		return do_post_request($_URL,http_build_query($post)) ;
	}
}

session_start() ;
ini_set( 'memory_limit', '512M');

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



$post = array() ;
$post['edi_method'] = 'dump' ;
$post['dump_table'] = 'cdecfg_cdeclass' ;
$handle = oscario_http_post($post, $fp=TRUE) ;

$lig = fgets($handle)  ;
$fields = json_decode($lig) ;

$map_localField_position = array() ;
foreach( $fields as $position => $field ) {
	$localTarget = NULL ;
	switch( $field ) {
		case 'cde_class' : $target = 'field_TREENODE_str' ; break ;
		default : continue 2 ;
	}
	$map_localField_position[$target] = $position ;
}
while( !feof($handle) ) {
	$lig = fgets($handle) ;
        if( !$lig ) {
                continue ;
        }
	$arr = json_decode($lig) ;
	
	$arr_ins = array() ;
	foreach( $map_localField_position as $target => $position ) {
		$mkey = $target ;
		$mvalue = $arr[$position] ;
		$arr_ins[$mkey] = $mvalue ;
	}
	$treenode_key = $arr_ins['field_TREENODE_str'] ;
	$arr_ins['treenode_key'] = $treenode_key ;
	if( !$treenode_key ) {
		continue ;
	}
	
	$query = "SELECT * FROM store_bible_CDE_CLASS_tree WHERE treenode_key='{$treenode_key}'" ;
	if( $_opDB->num_rows($_opDB->query($query)) > 0 ) {
		$arr_cond = array();
		$arr_cond['treenode_key'] = $treenode_key ;
		$_opDB->update('store_bible_CDE_CLASS_tree',$arr_ins,$arr_cond) ;
	} else {
		$_opDB->insert('store_bible_CDE_CLASS_tree',$arr_ins) ;
	}
}
fclose($handle) ;

$post = array() ;
$post['edi_method'] = 'dump' ;
$post['dump_table'] = 'cdecfg_cdeclass' ;
$handle = oscario_http_post($post, $fp=TRUE) ;

$lig = fgets($handle)  ;
$fields = json_decode($lig) ;

$map_localField_position = array() ;
foreach( $fields as $position => $field ) {
	$localTarget = NULL ;
	switch( $field ) {
		case 'cde_class' : $target = 'field_CDECLASS_CODE_str' ; break ;
		case 'cde_class_lib' : $target = 'field_CDECLASS_LIB_str' ; break ;
		
		default : continue 2 ;
	}
	$map_localField_position[$target] = $position ;
}
while( !feof($handle) ) {
	$lig = fgets($handle) ;
        if( !$lig ) {
                continue ;
        }
	$arr = json_decode($lig) ;
	
	$arr_ins = array() ;
	foreach( $map_localField_position as $target => $position ) {
		$mkey = $target ;
		$mvalue = $arr[$position] ;
		$arr_ins[$mkey] = $mvalue ;
	}
	$entry_key = $arr_ins['field_CDECLASS_CODE_str'] ;
	$arr_ins['entry_key'] = $entry_key ;
	$arr_ins['treenode_key'] = $arr_ins['entry_key'] ;
	
	$query = "SELECT * FROM store_bible_CDE_CLASS_entry WHERE entry_key='{$entry_key}'" ;
	if( $_opDB->num_rows($_opDB->query($query)) > 0 ) {
		$arr_cond = array();
		$arr_cond['entry_key'] = $entry_key ;
		unset($arr_ins['treenode_key']) ;
		$_opDB->update('store_bible_CDE_CLASS_entry',$arr_ins,$arr_cond) ;
	} else {
		$_opDB->insert('store_bible_CDE_CLASS_entry',$arr_ins) ;
	}
}
fclose($handle) ;






$post = array() ;
$post['edi_method'] = 'dump' ;
$post['dump_table'] = 'mags' ;
$handle = oscario_http_post($post, $fp=TRUE) ;

$lig = fgets($handle)  ;
$fields = json_decode($lig) ;

$map_localField_position = array() ;
foreach( $fields as $position => $field ) {
	$localTarget = NULL ;
	switch( $field ) {
		case 'mag_code' : $target = 'field_TREENODE_str' ; break ;
		default : continue 2 ;
	}
	$map_localField_position[$target] = $position ;
}
while( !feof($handle) ) {
	$lig = fgets($handle) ;
        if( !$lig ) {
                continue ;
        }
	$arr = json_decode($lig) ;
	
	$arr_ins = array() ;
	foreach( $map_localField_position as $target => $position ) {
		$mkey = $target ;
		$mvalue = $arr[$position] ;
		$arr_ins[$mkey] = $mvalue ;
	}
	$treenode_key = $arr_ins['field_TREENODE_str'] ;
	$arr_ins['treenode_key'] = $treenode_key ;
	if( !$treenode_key ) {
		continue ;
	}
	
	$query = "SELECT * FROM store_bible_CFG_WHSE_tree WHERE treenode_key='{$treenode_key}'" ;
	if( $_opDB->num_rows($_opDB->query($query)) > 0 ) {
		$arr_cond = array();
		$arr_cond['treenode_key'] = $treenode_key ;
		$_opDB->update('store_bible_CFG_WHSE_tree',$arr_ins,$arr_cond) ;
	} else {
		$_opDB->insert('store_bible_CFG_WHSE_tree',$arr_ins) ;
	}
}
fclose($handle) ;

$post = array() ;
$post['edi_method'] = 'dump' ;
$post['dump_table'] = 'mags' ;
$handle = oscario_http_post($post, $fp=TRUE) ;

$lig = fgets($handle)  ;
$fields = json_decode($lig) ;

$map_localField_position = array() ;
foreach( $fields as $position => $field ) {
	$localTarget = NULL ;
	switch( $field ) {
		case 'mag_code' : $target = 'field_MAG_CODE_str' ; break ;
		case 'mag_lib' : $target = 'field_MAG_LIB_str' ; break ;
		
		default : continue 2 ;
	}
	$map_localField_position[$target] = $position ;
}
while( !feof($handle) ) {
	$lig = fgets($handle) ;
        if( !$lig ) {
                continue ;
        }
	$arr = json_decode($lig) ;
	
	$arr_ins = array() ;
	foreach( $map_localField_position as $target => $position ) {
		$mkey = $target ;
		$mvalue = $arr[$position] ;
		$arr_ins[$mkey] = $mvalue ;
	}
	$entry_key = $arr_ins['field_MAG_CODE_str'] ;
	$arr_ins['entry_key'] = $entry_key ;
	$arr_ins['treenode_key'] = $arr_ins['entry_key'] ;
	
	$query = "SELECT * FROM store_bible_CFG_WHSE_entry WHERE entry_key='{$entry_key}'" ;
	if( $_opDB->num_rows($_opDB->query($query)) > 0 ) {
		$arr_cond = array();
		$arr_cond['entry_key'] = $entry_key ;
		unset($arr_ins['treenode_key']) ;
		$_opDB->update('store_bible_CFG_WHSE_entry',$arr_ins,$arr_cond) ;
	} else {
		$_opDB->insert('store_bible_CFG_WHSE_entry',$arr_ins) ;
	}
}
fclose($handle) ;




/*
*****************************
	Partie PRODUITS
*******************************
*/
$arr_existing_treenodes = array() ;

$post = array() ;
$post['edi_method'] = 'dump' ;
$post['dump_table'] = 'prod' ;
$handle = oscario_http_post($post, $fp=TRUE) ;

$lig = fgets($handle)  ;
$fields = json_decode($lig) ;

$map_localField_position = array() ;
foreach( $fields as $position => $field ) {
	$localTarget = NULL ;
	switch( $field ) {
		case 'prod_ref' : $target = 'field_PROD_REF_str' ; break ;
		case 'prod_gencod' : $target = 'field_PROD_SKU_EAN_str' ; break ;
		case 'prod_lib' : $target = 'field_PROD_TXT_str' ; break ;
		case 'pcb_qte_pack' :  $target = 'field_QTE_SKU_dec' ; break ;
		case 'eq_ut' : $target = 'field_EQ_UT_dec' ; break ;
		case 'eq_kg' : $target = 'field_EQ_KG_dec' ; break ;
		//case 'prod_unit' : $target = 'field_UOM_str' ; break ;
		
		case 'prodgroup_code' : $target = '_' ; break ;
		
		default : continue 2 ;
	}
	$map_localField_position[$target] = $position ;
}
while( !feof($handle) ) {
	$lig = fgets($handle) ;
        if( !$lig ) {
                continue ;
        }
	$arr = json_decode($lig) ;
	
	$arr_ins = array() ;
	foreach( $map_localField_position as $target => $position ) {
		$mkey = $target ;
		$mvalue = $arr[$position] ;
		$arr_ins[$mkey] = $mvalue ;
	}
	$entry_key = $arr_ins['field_PROD_REF_str'] ;
	$arr_ins['entry_key'] = $entry_key ;
	$arr_ins['treenode_key'] = $arr_ins['_'] ;
	unset($arr_ins['_']) ;
	
	$query = "SELECT * FROM store_bible_PRODUCT_entry WHERE entry_key='{$entry_key}'" ;
	if( $_opDB->num_rows($res = $_opDB->query($query)) > 0 ) {
		$arrDB = $_opDB->fetch_assoc($res) ;
		$treenode_key = $arrDB['treenode_key'] ;
		$arr_existing_treenodes[$treenode_key] = TRUE ;
		
		$arr_cond = array();
		$arr_cond['entry_key'] = $entry_key ;
		unset($arr_ins['treenode_key']) ;
		$_opDB->update('store_bible_PRODUCT_entry',$arr_ins,$arr_cond) ;
	} else {
		$treenode_key = $arr_ins['treenode_key'] ;
		$arr_existing_treenodes[$treenode_key] = TRUE ;
		
		$_opDB->insert('store_bible_PRODUCT_entry',$arr_ins) ;
	}
}
fclose($handle) ;




$post = array() ;
$post['edi_method'] = 'dump' ;
$post['dump_table'] = 'prod_group' ;
$handle = oscario_http_post($post, $fp=TRUE) ;

$lig = fgets($handle)  ;
$fields = json_decode($lig) ;

$map_localField_position = array() ;
foreach( $fields as $position => $field ) {
	$localTarget = NULL ;
	switch( $field ) {
		case 'prodgroup_code' : $target = 'field_PRODGROUP_CODE_str' ; break ;
		case 'prodgroup_lib' : $target = 'field_PRODGROUP_NAME_str' ; break ;
		default : continue 2 ;
	}
	$map_localField_position[$target] = $position ;
}
while( !feof($handle) ) {
	$lig = fgets($handle) ;
        if( !$lig ) {
                continue ;
        }
	$arr = json_decode($lig) ;
	
	$arr_ins = array() ;
	foreach( $map_localField_position as $target => $position ) {
		$mkey = $target ;
		$mvalue = $arr[$position] ;
		$arr_ins[$mkey] = $mvalue ;
	}
	$treenode_key = $arr_ins['field_PRODGROUP_CODE_str'] ;
	$arr_ins['treenode_key'] = $treenode_key ;
	if( !$treenode_key ) {
		continue ;
	}
	
	if( !$arr_existing_treenodes[$treenode_key] ) {
		continue ;
	}
	
	$query = "SELECT * FROM store_bible_PRODUCT_tree WHERE treenode_key='{$treenode_key}'" ;
	if( $_opDB->num_rows($_opDB->query($query)) > 0 ) {
		$arr_cond = array();
		$arr_cond['treenode_key'] = $treenode_key ;
		$_opDB->update('store_bible_PRODUCT_tree',$arr_ins,$arr_cond) ;
	} else {
		$_opDB->insert('store_bible_PRODUCT_tree',$arr_ins) ;
	}
}
fclose($handle) ;




/*
*****************************
	Partie CLIENTS
*******************************
*/
$arr_existing_treenodes = array() ;

$post = array() ;
$post['edi_method'] = 'dump' ;
$post['dump_table'] = 'cli' ;
$handle = oscario_http_post($post, $fp=TRUE) ;

$lig = fgets($handle)  ;
$fields = json_decode($lig) ;

$map_localField_position = array() ;
$adr_positions = array() ;
foreach( $fields as $position => $field ) {
	$localTarget = NULL ;
	switch( $field ) {
		case 'cli_EAN' : $target = 'field_cli_EAN_str' ; break ;
		case 'cli_lib' : $target = 'field_cli_NAME_str' ; break ;
		
		case 'cligroup_code' : $target = '_' ; break ;
		
		case 'adrfact_nom' :
		case 'adrfact_rue' :
		case 'adrfact_localite' :
		case 'adrfact_ville' :
			$adr_positions[] = $position ;
			continue 2 ;
		
		default : continue 2 ;
	}
	$map_localField_position[$target] = $position ;
}
while( !feof($handle) ) {
	$lig = fgets($handle) ;
        if( !$lig ) {
                continue ;
        }
	$arr = json_decode($lig) ;
	
	$arr_ins = array() ;
	foreach( $map_localField_position as $target => $position ) {
		$mkey = $target ;
		$mvalue = $arr[$position] ;
		$arr_ins[$mkey] = $mvalue ;
	}
	$entry_key = $arr_ins['field_cli_EAN_str'] ;
	$arr_ins['entry_key'] = $entry_key ;
	$arr_ins['treenode_key'] = $arr_ins['_'] ;
	unset($arr_ins['_']) ;
	if( !$entry_key ) {
		continue ;
	}
	
	$adr = '' ;
	foreach( $adr_positions as $pos ) {
		$str = $arr[$pos] ;
		if( $str ) {
			$adr.= $str."\n" ;
		}
	}
	$arr_ins['field_ADR_SHIP_str'] = $adr ;
	$arr_ins['field_ADR_INVOICE_str'] = $adr ; 
	
	
	$query = "SELECT * FROM store_bible_CUSTOMER_entry WHERE entry_key='{$entry_key}'" ;
	if( $_opDB->num_rows($res = $_opDB->query($query)) > 0 ) {
		$arrDB = $_opDB->fetch_assoc($res) ;
		$treenode_key = $arrDB['treenode_key'] ;
		$arr_existing_treenodes[$treenode_key] = TRUE ;
		
		// 14/09/16 : pas d'écrasement ADR facturation
		unset($arr_ins['field_ADR_INVOICE_str']) ;
		
		$arr_cond = array();
		$arr_cond['entry_key'] = $entry_key ;
		unset($arr_ins['treenode_key']) ;
		$_opDB->update('store_bible_CUSTOMER_entry',$arr_ins,$arr_cond) ;
	} else {
		$treenode_key = $arr_ins['treenode_key'] ;
		$arr_existing_treenodes[$treenode_key] = TRUE ;
		
		$_opDB->insert('store_bible_CUSTOMER_entry',$arr_ins) ;
	}
}
fclose($handle) ;


$post = array() ;
$post['edi_method'] = 'dump' ;
$post['dump_table'] = 'cli_group' ;
$handle = oscario_http_post($post, $fp=TRUE) ;

$lig = fgets($handle)  ;
$fields = json_decode($lig) ;

$map_localField_position = array() ;
foreach( $fields as $position => $field ) {
	$localTarget = NULL ;
	switch( $field ) {
		case 'cligroup_code' : $target = 'field_CLIGROUP_CODE_str' ; break ;
		//case 'cligroup_lib' : $target = 'field_CLIGROUP_NAME_str' ; break ;
		default : continue 2 ;
	}
	$map_localField_position[$target] = $position ;
}
while( !feof($handle) ) {
	$lig = fgets($handle) ;
        if( !$lig ) {
                continue ;
        }
	$arr = json_decode($lig) ;
	
	$arr_ins = array() ;
	foreach( $map_localField_position as $target => $position ) {
		$mkey = $target ;
		$mvalue = $arr[$position] ;
		$arr_ins[$mkey] = $mvalue ;
	}
	$treenode_key = $arr_ins['field_CLIGROUP_CODE_str'] ;
	$arr_ins['treenode_key'] = $treenode_key ;
	if( !$treenode_key ) {
		continue ;
	}
	
	if( !$arr_existing_treenodes[$treenode_key] ) {
		continue ;
	}
	
	$query = "SELECT * FROM store_bible_CUSTOMER_tree WHERE treenode_key='{$treenode_key}'" ;
	if( $_opDB->num_rows($_opDB->query($query)) > 0 ) {
		$arr_cond = array();
		$arr_cond['treenode_key'] = $treenode_key ;
		$_opDB->update('store_bible_CUSTOMER_tree',$arr_ins,$arr_cond) ;
	} else {
		$_opDB->insert('store_bible_CUSTOMER_tree',$arr_ins) ;
	}
}
fclose($handle) ;



$map_prefix8_treenodeKey = array() ;
$query = "SELECT treenode_key, field_TMP_AUTONODE_C8 FROM view_bible_CUSTOMER_tree WHERE field_TMP_AUTONODE_C8<>''" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$map_prefix8_treenodeKey[$arr[1]] = $arr[0] ;
}
//print_r($map_prefix8_treenodeKey) ;
foreach( $map_prefix8_treenodeKey as $prefix8 => $treenode_key ) {
	$query = "UPDATE view_bible_CUSTOMER_entry
		SET treenode_key='{$treenode_key}' , field_FACTOR_ID = entry_key
		WHERE entry_key LIKE '{$prefix8}%' AND LENGTH(entry_key)=11" ;
	$_opDB->query($query) ;
}





/*
*******************************
    Partie COMMANDES
******************************
*/

$TAB_cde = array() ;

$post = array() ;
$post['edi_method'] = 'dump' ;
$post['dump_table'] = 'cde' ;
$handle = oscario_http_post($post, $fp=TRUE) ;

$lig = fgets($handle)  ;
$fields = json_decode($lig) ;

$map_localField_position= array() ;
$map_localField_isBool = array() ;
$map_localField_isBool['field_STATUS_IS_SHIP_int'] = TRUE ;
foreach( $fields as $position => $field ) {
	$localTarget = NULL ;
	switch( $field ) {
		case 'cde_id' : $target = 'field_CDE_ID_str' ; break ;
		case 'cde_noscde' : $target = 'field_CDE_NO_str' ; break ;
		case 'mag_code' : $target = 'field_MAG_CODE_str' ; break ;
		case 'cde_class' : $target = 'field_CDE_CLASS_str' ; break ;
		case 'cde_refcli': $target = 'field_CLI_REF_ID_str' ; break ;
		case 'cli_EAN': $target = 'field_CLI_LINK_str' ; break ;
		case 'etat_is_expe_ok' : $target = 'field_STATUS_IS_SHIP_int' ; break ;
		case 'date_create' : $target = 'field_DATE_ORDER_dtm' ; break ;
		case 'date_dpe' : $target = 'field_DATE_DPE_dtm' ; break ;
		case 'date_expe' : $target = 'field_DATE_SHIP_dtm' ; break ;
		default : continue 2 ;
	}
	$map_localField_position[$target] = $position ;
}

while( !feof($handle) ) {
	$lig = fgets($handle) ;
        if( !trim($lig) ) {
                continue ;
        }
	
	$arr = json_decode($lig) ;
	
	$arr_assoc = array() ;
	foreach( $fields as $position => $field ) {
		$arr_assoc[$field] = $arr[$position] ;
	}
	
	$remote_id = $arr[0] ;
	
	$arr_ent = array() ;
	foreach( $map_localField_position as $target => $position ) {
		$mkey = $target ;
		$mvalue = $arr[$position] ;
		if( $map_localField_isBool[$target] ) {
			$mvalue = ($arr[$position]=='O') ? 1 : 0 ;
		}
		$arr_ent[$mkey] = $mvalue ;
	}
	
	// Statut:
	if( $arr_assoc['etat_is_expe_ok'] == 'O' ) {
		$arr_ent['field_STATUS_str'] = '50_SHIPPED' ;
	} elseif( $arr_assoc['etat_is_upload_done'] == 'O' ) {
		$arr_ent['field_STATUS_str'] = '30_LOGISTIC' ;
	} else {
		$arr_ent['field_STATUS_str'] = '10_WAIT' ;
	}
	
	$arr_ent['_CDE_LIG'] = array() ;
	
	
	$TAB_cde[$remote_id] = $arr_ent ;
}
fclose($handle) ;








$post = array() ;
$post['edi_method'] = 'dump' ;
$post['dump_table'] = 'cde_lig' ;
$handle = oscario_http_post($post, $fp=TRUE) ;

$lig = fgets($handle)  ;
$fields = json_decode($lig) ;

$map_localField_position= array() ;
$map_localField_isBool = array() ;
$map_localField_isBool['field_STATUS_IS_SHIP_int'] = TRUE ;
foreach( $fields as $position => $field ) {
	$localTarget = NULL ;
	switch( $field ) {
		case 'prod_ref' : $target = 'field_PROD_REF_str' ; break ;
		case 'qte_cde' : $target = 'field_QTE_ORDER_dec' ; break ;
		case 'qte_prep' : $target = 'field_QTE_SHIP_dec' ; break ;
		case 'spec_lot': $target = 'field_BATCH_CODE_str' ; break ;
		case 'spec_datelc': $target = 'field_DLC_DATE_str' ; break ;
		case 'lig_obstxt' : $target = 'field_OBS_TXT_str' ; break ;
		case 'etat_is_valid' : $target = 'field_STATUS_IS_SHIP_int' ; break ;
		default : continue 2 ;
	}
	$map_localField_position[$target] = $position ;
}

while( !feof($handle) ) {
	$lig = fgets($handle) ;
        if( !trim($lig) ) {
                continue ;
        }
	$arr = json_decode($lig) ;
	
	$arr_assoc = array() ;
	foreach( $fields as $position => $field ) {
		$arr_assoc[$field] = $arr[$position] ;
	}
	
	$remote_id = $arr[0] ;
	
	$arr_lig = array() ;
	foreach( $map_localField_position as $target => $position ) {
		$mkey = $target ;
		$mvalue = $arr[$position] ;
		if( $map_localField_isBool[$target] ) {
			$mvalue = ($arr[$position]=='O') ? 1 : 0 ;
		}
		$arr_lig[$mkey] = $mvalue ;
	}
	$arr_lig['field_INV_MODE_str'] = 'STD' ;
	
	$TAB_cde[$remote_id]['_CDE_LIG'][$arr_assoc['lig_ssid']] = $arr_lig ;
}

fclose($handle) ;





$post = array() ;
$post['edi_method'] = 'dump' ;
$post['dump_table'] = 'cde_lig_edi' ;
$handle = oscario_http_post($post, $fp=TRUE) ;

$lig = fgets($handle)  ;
$fields = json_decode($lig) ;

while( !feof($handle) ) {
	$lig = fgets($handle) ;
        if( !trim($lig) ) {
                continue ;
        }
	$arr = json_decode($lig) ;
	
	$arr_assoc = array() ;
	foreach( $fields as $position => $field ) {
		$arr_assoc[$field] = $arr[$position] ;
	}
	
	$remote_id = $arr[0] ;
	
	$arr_lig = array() ;
	if( $arr_assoc['edi_price_is_set'] == 'O' && $arr_assoc['edi_price_uvc'] == 0 ) {
		$arr_lig['field_INV_MODE_str'] = 'FREE' ;
	}
	
	if( !$TAB_cde[$remote_id]['_CDE_LIG'][$arr_assoc['lig_ssid']] ) {
		continue ;
	}
	$TAB_cde[$remote_id]['_CDE_LIG'][$arr_assoc['lig_ssid']] = $arr_lig + $TAB_cde[$remote_id]['_CDE_LIG'][$arr_assoc['lig_ssid']] ;
}

fclose($handle) ;



$arr_new_filerecordIds = array() ;
$arr_old_filerecordIds = array() ;
$query = "SELECT filerecord_id FROM store_file_CDE" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$arr_old_filerecordIds[] = $arr[0] ;
}

foreach( $TAB_cde as $cde_id => &$arr_ent ) {
	$arr_ent['_CDE_LIG'] = array_values($arr_ent['_CDE_LIG']) ;
	
	// recherche de la cde 
	$query = "SELECT filerecord_id, field_STATUS_str FROM store_file_CDE WHERE field_CDE_ID_str='$cde_id'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) == 1 ) {
		$arr = $_opDB->fetch_row($result) ;
		$filerecord_id = $arr[0] ;
		$status = $arr[1] ;
		
		if( $status > $arr_ent['field_STATUS_str'] ) {
			unset($arr_ent['field_STATUS_str']) ;
		}
			
		$pool_child_filerecordIds = array() ;
		$query = "SELECT filerecord_id FROM store_file_CDE_LIG WHERE filerecord_parent_id='$filerecord_id'" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$pool_child_filerecordIds[] = $arr[0] ;
		}
		
		$arr_update_ent = $arr_ent ;
		unset($arr_update_ent['_CDE_LIG']) ;
		
		$arr_cond = array() ;
		$arr_cond['filerecord_id'] = $filerecord_id ;
		$_opDB->update('store_file_CDE',$arr_update_ent,$arr_cond) ;
		$arr_new_filerecordIds[] = $filerecord_id ;
	} else {
		$pool_child_filerecordIds = array() ;
		
		$arr_ins_ent = $arr_ent ;
		unset($arr_ins_ent['_CDE_LIG']) ;
		$_opDB->insert( 'store_file_CDE', $arr_ins_ent );
		$filerecord_id = $_opDB->insert_id() ;
		$arr_new_filerecordIds[] = $filerecord_id ;
	}
	// echo "o" ;
	
	
	// partie lignes
	foreach( $pool_child_filerecordIds as $child_filerecordId ) {
		$query = "DELETE FROM store_file_CDE_LIG WHERE filerecord_id='$child_filerecordId'" ;
		$_opDB->query($query) ;
	}
	
	for( $i=0 ; $i < count($arr_ent['_CDE_LIG']) ; $i++ ) {
		$arr_lig = $arr_ent['_CDE_LIG'][$i] ;
		if( $reuse_filerecordId = array_shift($pool_child_filerecordIds) ) {
			$arr_lig['filerecord_id'] = $reuse_filerecordId ;
		}
		$arr_lig['filerecord_parent_id'] = $filerecord_id ;
		$_opDB->insert( 'store_file_CDE_LIG', $arr_lig ) ;
		// echo "." ;
	}
	
}
unset($arr_ent) ;

// Clean old records
$arr_toDelete_filerecordIds = array_diff($arr_old_filerecordIds,$arr_new_filerecordIds) ;
foreach( $arr_toDelete_filerecordIds as $filerecord_id ) {
	paracrm_lib_data_deleteRecord_file('CDE',$filerecord_id) ;
}


?>
