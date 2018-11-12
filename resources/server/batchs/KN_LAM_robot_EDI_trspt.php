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




function do_upload_trspt( $buffer, $trspt_code, $soc_code=NULL ) {
	$obj = new stdClass ;
	switch( $trspt_code ) {
		case 'DPDG' :
			$obj = new stdClass ;
			$obj->_cfg_data_mode = 'ftp' ;
		//	$obj->_cfg_mail_subject = 'DEV_EDI_EXAPAQ' ;
		//	$obj->_cfg_mail_dest = 'dm@mirabel-sil.com,olivier-gaudet@lutece-gpfb.com' ;
		//	$obj->_cfg_mail_filename = 'EXAP_'.date('ymdHi').'.txt' ; 
			$obj->_cfg_ftp_ip = 'ftpd.ils-consult.fr' ;
			$obj->_cfg_ftp_port = 21 ;
			$obj->_cfg_ftp_user = 'lutecekn' ;
			$obj->_cfg_ftp_pass = 'Lm9-J#!a1' ;
			$obj->_cfg_ftp_dir = '/in' ;
			$obj->_cfg_ftp_notmp = TRUE ;
			$obj->_cfg_ftp_filename = 'DPDG_'.date('ymdHi').'.txt' ;
			break ;
			
		default :
			return FALSE ;
	}
	if( $GLOBALS['__OPTIMA_TEST'] ) {
		$obj = new stdClass ;
		$obj->_cfg_data_mode = 'ftp' ;
	//	$obj->_cfg_mail_subject = 'DEV_EDI_EXAPAQ' ;
	//	$obj->_cfg_mail_dest = 'dm@mirabel-sil.com,olivier-gaudet@lutece-gpfb.com' ;
	//	$obj->_cfg_mail_filename = 'EXAP_'.date('ymdHi').'.txt' ; 
		$obj->_cfg_ftp_ip = '10.39.56.1' ;
		$obj->_cfg_ftp_port = 21 ;
		$obj->_cfg_ftp_user = 'backup' ;
		$obj->_cfg_ftp_pass = 'Lognes2018' ;
		$obj->_cfg_ftp_dir = '/test' ;
		$obj->_cfg_ftp_notmp = TRUE ;
		$obj->_cfg_ftp_filename = $trspt_code.'_'.date('ymdHi').'.txt' ;
	}
	
	switch( $obj->_cfg_data_mode ) {
		case 'ftp' :
		
			if( !$obj->_cfg_ftp_port )
				$obj->_cfg_ftp_port = 21 ;
			if( !($conn_ftp = ftp_connect( $obj->_cfg_ftp_ip, $obj->_cfg_ftp_port )) ) {
				return FALSE ;
			}
			
			if( !($login_result = ftp_login($conn_ftp, $obj->_cfg_ftp_user, $obj->_cfg_ftp_pass )) ) {
				return FALSE ;
			}
			
			if( $obj->_cfg_ftp_passive ) {
				ftp_pasv($conn_ftp, true);
			}
			
			ftp_cdup($conn_ftp) ;
			ftp_chdir($conn_ftp, $obj->_cfg_ftp_dir) ;
			
			$handle = tmpfile() ;
			fwrite($handle,$buffer) ;
			
			$filename = $obj->_cfg_ftp_filename ;
			
				$top_size = ftp_size( $conn_ftp, $filename ) ;
				if( $top_size <= 0 )
					unset($top_size) ;
				
				fseek($handle,0) ;
				if( $obj->_cfg_ftp_notmp == FALSE )
					$filename_tmp = $filename.'.tmp' ;
				else
					$filename_tmp = $filename ;
				if( !$top_size )
				{
					// transfert en tmp
					$success = ftp_fput( $conn_ftp, $filename_tmp, $handle, FTP_BINARY ) ;
					
					// rename 
					if( $filename_tmp != $filename )
						ftp_rename($conn_ftp, $filename_tmp, $filename) ;
				}
				else
				{
					// rename tmp
					if( $filename_tmp != $filename )
						ftp_rename($conn_ftp, $filename, $filename_tmp);
					
					// append en tmp
					ftp_set_option($conn_ftp, FTP_AUTOSEEK, FALSE);
					$success = ftp_fput( $conn_ftp, $filename_tmp, $handle, FTP_BINARY, $top_size ) ;
					
					// rename 
					if( $filename_tmp != $filename )
						ftp_rename($conn_ftp, $filename_tmp, $filename);
				}
			
			ftp_close($conn_ftp) ;
			if( $success ) {
				echo "Upload $filename\n" ;
			}
			return $success ;
			
			break ;
			
		default :
			return FALSE ;
	}
	
	return TRUE ;
}

$arr_trpsts = array() ;
$query = "SELECT distinct field_ID_TRSPT_CODE FROM view_file_TRANSFER_CDE_PACK
			WHERE field_STATUS_IS_SHIPPED='1' AND field_STATUS_IS_EDI='0' AND field_ID_TRSPT_CODE<>''" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$arr_trpsts[] = $arr[0] ;
}

foreach( $arr_trpsts as $id_trspt_code ) {
	$arr_transferCdePackFilerecordIds = array() ;
	$query = "SELECT filerecord_id FROM view_file_TRANSFER_CDE_PACK 
			WHERE field_STATUS_IS_SHIPPED='1' AND field_STATUS_IS_EDI<>'1' AND field_ID_TRSPT_CODE='{$id_trspt_code}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$arr_transferCdePackFilerecordIds[] = $arr[0] ;
	}


	$json = specDbsLam_transfer_getTransferCdePack( array(
		'filter_transferCdePackFilerecordId_arr'=>json_encode($arr_transferCdePackFilerecordIds),
		'load_extended' => 1
	) ) ;
	$rowsExtended_transferCdePack = $json['data'] ;

	$buffer.= '' ;
	foreach( $rowsExtended_transferCdePack as $rowExtended_transferCdePack ) {
		if( !$rowExtended_transferCdePack['id_trspt_code'] || ($rowExtended_transferCdePack['id_trspt_code']!='DPDG') ) {
			continue ;
		}
		$buffer.= specDbsLam_lib_TMS_DPDG_getEdiPosition(
			$rowExtended_transferCdePack,
			$rowExtended_transferCdePack['id_trspt_id']
		) ;
	}
	
	$success = FALSE ;
	if($buffer) {
		$success = do_upload_trspt($buffer,$id_trspt_code) ;
	}
	if( $success ) {
		$arr_update = array('field_STATUS_IS_EDI'=>1) ;
		foreach( $arr_transferCdePackFilerecordIds as $transferCdePack_filerecordId ) {
			paracrm_lib_data_updateRecord_file('TRANSFER_CDE_PACK',$arr_update,$transferCdePack_filerecordId) ;
		}
	}
}


?>
