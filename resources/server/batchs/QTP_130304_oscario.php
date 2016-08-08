<?php

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
function oscario_http_post( $post_data ) {
	$_URL = 'http://10.39.118.2/oscario/edi.php' ;
	$_domain = 'bluephoenix' ;
	$_auth_username = 'ediJaneiro' ;
	$_auth_password = 'paracrm' ;
	if( $GLOBALS['__OPTIMA_TEST'] ) {
		$_domain = 'test' ;
	}
	
	$post_base = array();
	$post_base['oscario_domain'] = $_domain ;
	$post_base['auth_username'] = $_auth_username ;
	$post_base['auth_password'] = $_auth_password ;
	$post = $post_base + $post_data ;
	
	return do_post_request($_URL,http_build_query($post)) ;
}

session_start() ;

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

include("$server_root/modules/paracrm/backend_paracrm.inc.php");



// ************** PARTIE REFERENCE *************
include('QTP_130304_oscario_prod.inc.php') ;
$post = array() ;
$post['edi_method'] = 'RAW_prod' ;
$json = json_decode(oscario_http_post($post),true) ;
if( $json['success'] == true ) {
	update_PRODLOG_from_oscario_prod( $json['data'] ) ;
}
$post = array() ;
$post['edi_method'] = 'RAW_cli' ;
$json = json_decode(oscario_http_post($post),true) ;
if( $json['success'] == true ) {
	update_CLILOG_from_oscario_cli( $json['data'] ) ;
}

if( $db_sales = getenv('OPTIMA_DB_SALES') ) {
	update_CLILOG_from_salesDb( $db_sales ) ;
	update_CDELIG_from_salesDb( $db_sales ) ;
}


// ************ PARTIE COMMANDES **************
include('QTP_130304_oscario_create_ORDERS.inc.php') ;
include('QTP_130304_oscario_mail_factory.inc.php') ;
$query = "SELECT filerecord_id FROM view_file_CDE_SAISIE WHERE field_CDE_IS_SENT='0' AND field_CDE_IS_DENIED='0'" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$filerecord_id = $arr[0] ;
	$arr_filerecord_id[] = $filerecord_id ;
}
foreach( $arr_filerecord_id as $filerecord_id ) {
	// ******* Chragement des tables *************
	$query = "SELECT * FROM view_file_CDE_SAISIE WHERE filerecord_id='{$filerecord_id}'" ;
	$result = $_opDB->query($query) ;
	$file_CDE_SAISIE = $_opDB->fetch_assoc($result) ;
	$query = "SELECT * FROM view_bible_CDESAISIE_entry WHERE entry_key='{$file_CDE_SAISIE['field_CDE_TYPE']}'" ;
	$result = $_opDB->query($query) ;
	$bible_CDESAISIE_entry = $_opDB->fetch_assoc($result) ;
	$query = "SELECT * FROM view_bible_SALES_entry WHERE entry_key='{$file_CDE_SAISIE['field_CDE_SALES']}'" ;
	$result = $_opDB->query($query) ;
	$bible_SALES_entry = $_opDB->fetch_assoc($result) ;
	$query = "SELECT * FROM view_bible_STORE_entry WHERE entry_key='{$file_CDE_SAISIE['field_CDE_STORE']}'" ;
	$result = $_opDB->query($query) ;
	$bible_STORE_entry = $_opDB->fetch_assoc($result) ;
	$query = "SELECT * FROM view_file_CDE_SAISIE_LIG
				JOIN view_bible_PRODLOG_entry ON view_bible_PRODLOG_entry.entry_key=view_file_CDE_SAISIE_LIG.field_CDE_PROD
				WHERE view_file_CDE_SAISIE_LIG.filerecord_parent_id='{$filerecord_id}'
				ORDER BY view_file_CDE_SAISIE_LIG.filerecord_id" ;
	$result = $_opDB->query($query) ;
	$TABfile_CDE_SAISIE_LIG = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TABfile_CDE_SAISIE_LIG[] = $arr ;
	}
	// *****************************************
	$arr_mailinglist = array() ;
	$arr_mailinglist[] = $bible_SALES_entry['field_SALESMANEMAIL'] ;
	$SALES_treenode = $bible_SALES_entry['treenode_key'] ;
	while( TRUE ) {
		$query = "SELECT treenode_parent_key , field_SALESZONEMGR FROM view_bible_SALES_tree WHERE treenode_key='$SALES_treenode'" ;
		$res = $_opDB->query($query) ;
		$arrm = $_opDB->fetch_assoc($res) ;
		if( $arrm == FALSE ) {
			break ;
		}
		$arr_mailinglist[] = $arrm['field_SALESZONEMGR'] ;
		$SALES_treenode = $arrm['treenode_parent_key'] ;
	}
	$CDESAISIE_treenode = $bible_CDESAISIE_entry['treenode_key'] ;
	while( TRUE ) {
		$query = "SELECT treenode_parent_key , field_EMAIL_LIST FROM view_bible_CDESAISIE_tree WHERE treenode_key='$CDESAISIE_treenode'" ;
		$res = $_opDB->query($query) ;
		$arrm = $_opDB->fetch_assoc($res) ;
		if( $arrm == FALSE ) {
			break ;
		}
		$arr_mailinglist[] = $arrm['field_EMAIL_LIST'] ;
		$CDESAISIE_treenode = $arrm['treenode_parent_key'] ;
	}
	// *****************************************
	
	
	// ************* Check validity ****************
	$_errors = NULL ;
	if( !$file_CDE_SAISIE['field_CDE_IS_FORCE'] ) {
	
		// Informations
		$poids_tot_free = $poids_tot_paid = 0 ;
		foreach( $TABfile_CDE_SAISIE_LIG as $file_CDE_SAISIE_LIG ) {
			$poids_tot_free += $file_CDE_SAISIE_LIG['field_CDE_QTE_UC_FREE'] * $file_CDE_SAISIE_LIG['field_UC_PCB'] * $file_CDE_SAISIE_LIG['field_EQ_KG'] ;
			$poids_tot_paid += $file_CDE_SAISIE_LIG['field_CDE_QTE_UC_PAID'] * $file_CDE_SAISIE_LIG['field_UC_PCB'] * $file_CDE_SAISIE_LIG['field_EQ_KG'] ;
		}
	
		// Vérification gratuitéc
		if( $bible_CDESAISIE_entry['field_VALID_FREERATIO'] > 0 ) {
			if( ($poids_tot_free / $poids_tot_paid) > (1 / $bible_CDESAISIE_entry['field_VALID_FREERATIO']) ) {
				$_errors['VALID_FREERATIO'] = "Ratio gratuité dépassé" ;
			}
		}
	
		// Vérification poids
		if( $bible_CDESAISIE_entry['field_VALID_MINWEIGHT'] ) {
			if( ($poids_tot_paid + $poids_tot_free) <  $bible_CDESAISIE_entry['field_VALID_MINWEIGHT'] ) {
				$_errors['VALID_MINWEIGHT'] = "Poids tot = ".(float)($poids_tot_paid + $poids_tot_free)." <  Poids autorisé" ;
			}
		}
	}
	
	
	// ******* EDI message + Post through EDI *********
	if( !$_errors ) {
		$EDIFACT_ORDERS = create_ORDERS_from_crmFile( $filerecord_id ) ;
		if( $GLOBALS['__OPTIMA_TEST'] ) {
			echo $EDIFACT_ORDERS ;
		}
	
		$post = array() ;
		$post['edi_method'] = 'EDIFACT_ORDERS' ;
		$post['data_EDIFACT'] = $EDIFACT_ORDERS ;
		$json = json_decode(oscario_http_post($post),true) ;
		if( !$json['success'] ) {
			continue ;
		}
	}
	// *************************************
	
	
	// ****** Update CRM database **************
	$arr_update = array() ;
	if( $_errors ) {
		$arr_update['field_CDE_IS_DENIED'] = 1 ;
	} else {
		$arr_update['field_CDE_IS_SENT'] = 1 ;
	}
	if( $json['arr_cderef'] ) {
		$arr_update['field_CDE_REFOSCAR'] = current($json['arr_cderef']) ;
	}
	$arr_cond = array() ;
	$arr_cond['filerecord_id'] = $filerecord_id ;
	$_opDB->update('view_file_CDE_SAISIE',$arr_update,$arr_cond) ;
	foreach( $arr_update as $mkey=>$mvalue ) {
		$file_CDE_SAISIE[$mkey] = $mvalue ;
	}
	
	$arr_update = array() ;
	$arr_update['sync_timestamp'] = 0 ;
	$arr_cond = array() ;
	$arr_cond['filerecord_id'] = $filerecord_id ;
	$_opDB->update('store_file',$arr_update,$arr_cond) ;
	// ****************************************
	
	
	
	
	$email_text = mail_getBody($filerecord_id, $_errors) ;
	$binarybuffer_xlsx = mail_getBinary_ficheNouveauClient( $bible_STORE_entry['entry_key'] ) ;
	$to = array() ;
	foreach( $arr_mailinglist as $mailinglist_entry ) {
	foreach( explode(',',$mailinglist_entry) as $value ) {
		if( strpos($value,'@') === FALSE ) {
			continue ;
		}
		$to[] = $value ;
	}
	}
	if( $GLOBALS['__OPTIMA_TEST'] ) {
		print_r($to) ;
		$to = array() ;
		$to[] = 'dm@mirabel-sil.com' ;
	}
	
	$email = new Email() ;
	$email->set_From( $bible_SALES_entry['field_SALESMANEMAIL'], $bible_SALES_entry['field_SALESMANNAME'] ) ;
	foreach( $to as $to_email ) {
		$email->add_Recipient( $to_email ) ;
	}
	$email->set_Subject( '[BluePhoenix] '.$file_CDE_SAISIE['field_CDE_REFOSCAR'].' '.$bible_STORE_entry['field_STORENAME'] ) ;
	if( $_errors ) {
		$email->set_Subject( '[BluePhoenix] '.'!!! CDE REJETEE !!!'.' '.$bible_STORE_entry['field_STORENAME'] ) ;
	}
	$email->set_text_body( $email_text ) ;
	$email->attach_file( 'NouveauClient'.'_'.$bible_STORE_entry['entry_key'].'.xlsx', $binarybuffer_xlsx, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ) ;
	$email->send() ;
}




?>
