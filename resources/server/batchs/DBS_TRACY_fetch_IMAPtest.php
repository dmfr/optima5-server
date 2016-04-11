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
$username = 'scannertest@mirabel-sil.com';
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
				if($at[is_attachment]==1){
					$tmpfname = tempnam( sys_get_temp_dir(), "FOO") ;
					file_put_contents($tmpfname, $at[attachment]);
					$tmp_id = media_img_processUploaded( $tmpfname, $at[filename] ) ;
					unlink($tmpfname) ;
					
					
					$newrecord = array() ;
					$newrecord['media_date'] = date('Y-m-d H:i:s') ;
					$newrecord['media_mimetype'] = 'image/jpeg' ;
					$newrecord['field_ATTACHMENT_DATE'] = date('Y-m-d') ;
					$newrecord['field_ATTACHMENT_TXT'] = $email_subject ;
					
					$query = "SELECT filerecord_id FROM view_file_CDE WHERE UPPER(field_ID_DN)='{$email_subject}'" ;
					$CDE_parent_filerecordId = $_opDB->query_uniqueValue($query) ;
					
					if( $CDE_parent_filerecordId ) {
						$img_filerecordId = paracrm_lib_data_insertRecord_file( 'CDE_ATTACH', $CDE_parent_filerecordId, $newrecord ) ;
					} else {
						$img_filerecordId = paracrm_lib_data_insertRecord_file( 'ATTACH_INBOX', 0, $newrecord ) ;
					}
					
					media_img_move( $tmp_id , $img_filerecordId ) ;
				}
			}
			
			media_contextClose() ;
		}
	}
} 

?>
