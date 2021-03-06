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

include("$server_root/modules/spec_dbs_tracy/backend_spec_dbs_tracy.inc.php");

$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
$_SESSION['login_data']['mysql_db'] = 'op5_'.$_domain_id.'_prod' ;
$_SESSION['login_data']['login_domain'] = $_domain_id.'_prod' ;
$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;

/* connect to gmail */
$hostname = '{mail.mirabel-sil.com:993/imap/ssl/novalidate-cert}INBOX';
$username = 'mbd@mirabel-sil.com';
$password = 'scannertest';

/* try to connect */
$inbox = imap_open($hostname,$username,$password) or die('Cannot connect to Gmail: ' . imap_last_error());



/* grab emails */
$emails = imap_search($inbox, 'UNSEEN');



/* if emails are returned, cycle through each... */
if($emails) {

	/* begin output var */
	$output = '';

	/* put the newest emails on top */
	rsort($emails);




	foreach($emails as $email_number) {
		imap_setflag_full($inbox, $email_number, "\\Seen");

		/* get information specific to this email */
		$overview = imap_fetch_overview($inbox,$email_number,0);
		$message = imap_fetchbody($inbox,$email_number,2);
		$structure = imap_fetchstructure($inbox,$email_number);


		$attachments = array();
		if(isset($structure->parts) && count($structure->parts)) {
			for($i = 0; $i < count($structure->parts); $i++) {
				$attachments[$i] = array(
					'is_attachment' => false,
					'filename' => '',
					'name' => '',
					'attachment' => '');

				if($structure->parts[$i]->ifdparameters) {
					foreach($structure->parts[$i]->dparameters as $object) {
						if(strtolower($object->attribute) == 'filename') {
						$attachments[$i]['is_attachment'] = true;
						$attachments[$i]['filename'] = $object->value;
						}
					}
				}

				if($structure->parts[$i]->ifparameters) {
					foreach($structure->parts[$i]->parameters as $object) {
						if(strtolower($object->attribute) == 'name') {
						$attachments[$i]['is_attachment'] = true;
						$attachments[$i]['name'] = $object->value;
						}
					}
				}

				if($attachments[$i]['is_attachment']) {
					$attachments[$i]['attachment'] = imap_fetchbody($inbox, $email_number, $i+1);
					if($structure->parts[$i]->encoding == 3) { // 3 = BASE64
						$attachments[$i]['attachment'] = base64_decode($attachments[$i]['attachment']);
					}
					elseif($structure->parts[$i]->encoding == 4) { // 4 = QUOTED-PRINTABLE
						$attachments[$i]['attachment'] = quoted_printable_decode($attachments[$i]['attachment']);
					}
				}             
			}
		}




		if(count($attachments)!=0){
			media_contextOpen( $_sdomain_id ) ;
			
			foreach( $attachments as $at ) {
				$email_subject = strtoupper(trim($overview[0]->subject)) ;
				
				
				if($at['is_attachment']==1){
					$tmpfname = tempnam( sys_get_temp_dir(), "FOO") ;
					file_put_contents($tmpfname, $at['attachment']);
					$arr_tmpIds = media_img_processUploaded( $tmpfname, $at['filename'], $all_pages=TRUE ) ;
					foreach( $arr_tmpIds as $tmp_id ) {
						$newrecord = array() ;
						$newrecord['media_date'] = date('Y-m-d H:i:s') ;
						$newrecord['media_mimetype'] = 'image/jpeg' ;
						$newrecord['field_ATTACHMENT_DATE'] = date('Y-m-d') ;
						$newrecord['field_ATTACHMENT_TXT'] = $email_subject ;
						
						$img_filerecordId = paracrm_lib_data_insertRecord_file( 'ATTACH_INBOX', 0, $newrecord ) ;
						media_img_move( $tmp_id , media_img_toolFile_getId('ATTACH_INBOX',$img_filerecordId) ) ;
					}
					unlink($tmpfname) ;
				}
			}
			
			media_contextClose() ;
		}
	}
}


if( TRUE ) {
	media_contextOpen( $_sdomain_id ) ;
	
	$json_order = specDbsTracy_order_getRecords( array() ) ;
	$map_idDn_orderRow = array() ;
	$map_idHat_ordersRow = array() ;
	foreach( $json_order['data'] as $order_row ) {
		$mkey = strtoupper(trim($order_row['id_dn'])) ;
		$map_idDn_orderRow[$mkey] = $order_row ;
		
		$mkey = strtoupper(trim($order_row['ref_invoice'])) ;
		if( !is_array($map_idHat_ordersRow[$mkey]) ) {
			$map_idHat_ordersRow[$mkey] = array() ;
		}
		$map_idHat_ordersRow[$mkey][] = $order_row ;
	}
	
	$query = "SELECT * FROM view_file_ATTACH_INBOX" ;
	$result = $_opDB->query($query) ;
	while( ($arr_media = $_opDB->fetch_assoc($result)) != FALSE ) {
		$attach_filerecordId = $arr_media['filerecord_id'] ;
		
		while( TRUE ) {
			$email_subject = $arr_media['field_ATTACHMENT_TXT'] ;
			$arr_emailSubject = explode('@',$email_subject) ;
			if( count($arr_emailSubject) > 1 ) {
				break ;
			}
			$arr_emailSubject = explode('/',$email_subject) ;
			break ;
		}
		
		
		$mkey = strtoupper(trim($arr_emailSubject[0])) ;
		
		if( $order_row = $map_idDn_orderRow[$mkey] ) {
			$CDE_parent_filerecordId = $order_row['order_filerecord_id'] ;
			
			// Move media
			$arr_media ;
			$img_filerecordId = paracrm_lib_data_insertRecord_file( 'CDE_ATTACH', $CDE_parent_filerecordId, $arr_media ) ;
			media_img_move( media_img_toolFile_getId('ATTACH_INBOX',$attach_filerecordId) , media_img_toolFile_getId('CDE_ATTACH',$img_filerecordId) ) ;
			
			// Update field
			$arr_update = array() ;
			$arr_update['field_REF_INVOICE'] = trim($arr_emailSubject[1]) ;
			paracrm_lib_data_updateRecord_file( 'CDE', $arr_update, $CDE_parent_filerecordId );
			
			// Adv status
			$arr_cond = array() ;
			$arr_cond['filerecord_parent_id'] = $CDE_parent_filerecordId ;
			$arr_cond['field_STEP_CODE'] = '30_DOCS' ;
			$arr_update = array() ;
			$arr_update['field_DATE_ACTUAL'] = date('Y-m-d H:i:s') ;
			$arr_update['field_STATUS_IS_OK'] = 1 ;
			$_opDB->update('view_file_CDE_STEP',$arr_update,$arr_cond) ;
				
			paracrm_lib_data_deleteRecord_file('ATTACH_INBOX',$attach_filerecordId) ;
		} elseif( strtotime($arr_media['media_date']) < strtotime('-48 hours') ) {
			paracrm_lib_data_deleteRecord_file('ATTACH_INBOX',$attach_filerecordId) ;
			media_img_delete(media_img_toolFile_getId('ATTACH_INBOX',$attach_filerecordId)) ;
		} else {
			
		}
	}
	
	$query = "SELECT * FROM view_file_ATTACH_INBOX" ;
	$result = $_opDB->query($query) ;
	while( ($arr_media = $_opDB->fetch_assoc($result)) != FALSE ) {
		$attach_filerecordId = $arr_media['filerecord_id'] ;
		
		$email_DAU = FALSE ;
		$email_subject = $arr_media['field_ATTACHMENT_TXT'] ;
		if( strpos($email_subject,"DOCUMENT : ")===0 ) {
			$email_DAU = TRUE ;
			$mkey = preg_replace("/[^0-9]/", "", $email_subject) ;
			if( !trim($mkey) ) {
				continue ;
			}
		}
		if( strpos($email_subject,"EX C ")===0 ) {
			$email_DAU = TRUE ;
			$arr_emailSubject = explode('-',$email_subject) ;
			if( count($arr_emailSubject) != 4 ) {
				continue  ;
			}
			if( trim($arr_emailSubject[1]) != 'BAE' ) {
				continue  ;
			}
			$mkey = trim($arr_emailSubject[2]) ;
			if( !trim($mkey) ) {
				continue ;
			}
			// HACK bolloré
			if( $map_idDn_orderRow[$mkey] ) {
				$map_idHat_ordersRow[$mkey] = array($map_idDn_orderRow[$mkey]) ;
			}
		}
		if( !$email_DAU ) {
			while( TRUE ) {
				
				$arr_emailSubject = explode(':',$email_subject) ;
				if( count($arr_emailSubject) != 2 ) {
					continue 2 ;
				}
				break ;
			}
			$mkey = strtoupper(trim($arr_emailSubject[1])) ;
		}
		
		
		if( $map_idHat_ordersRow[$mkey] ) {
			foreach( $map_idHat_ordersRow[$mkey] as $order_row ) {
				$CDE_parent_filerecordId = $order_row['order_filerecord_id'] ;
				
				// Copy media
				$arr_media ;
				$img_filerecordId = paracrm_lib_data_insertRecord_file( 'CDE_ATTACH', $CDE_parent_filerecordId, $arr_media ) ;
				media_img_copy( media_img_toolFile_getId('ATTACH_INBOX',$attach_filerecordId) , media_img_toolFile_getId('CDE_ATTACH',$img_filerecordId) ) ;
				
				if( !$email_DAU ) {
					// Update field
					$arr_update = array() ;
					$arr_update['field_REF_INVOICE'] = trim($arr_emailSubject[1]) ;
					paracrm_lib_data_updateRecord_file( 'CDE', $arr_update, $CDE_parent_filerecordId );
					
					// Adv status
					$arr_cond = array() ;
					$arr_cond['filerecord_parent_id'] = $CDE_parent_filerecordId ;
					$arr_cond['field_STEP_CODE'] = '30_DOCS' ;
					$arr_update = array() ;
					$arr_update['field_DATE_ACTUAL'] = date('Y-m-d H:i:s') ;
					$arr_update['field_STATUS_IS_OK'] = 1 ;
					$_opDB->update('view_file_CDE_STEP',$arr_update,$arr_cond) ;
				}
				if( $email_DAU ) {
					$trspt_filerecord_id = $order_row['calc_link_trspt_filerecord_id'] ;
					
					$arr_update = array() ;
					$arr_update['field_CUSTOMS_DATE_CLEARED'] = date('Y-m-d H:i:s') ;
					paracrm_lib_data_updateRecord_file( 'TRSPT', $arr_update, $trspt_filerecord_id );
					
					specDbsTracy_trspt_ackCustomsStatus( array('trspt_filerecord_id'=>$trspt_filerecord_id) );
				}
			}
			
			// Delete media
			media_img_delete( media_img_toolFile_getId('ATTACH_INBOX',$attach_filerecordId) );
			paracrm_lib_data_deleteRecord_file('ATTACH_INBOX',$attach_filerecordId) ;
		}
	}
	
	media_contextClose() ;
}


?>
