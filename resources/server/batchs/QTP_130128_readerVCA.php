<?php
session_start() ;
$_SESSION['next_transaction_id'] = 1 ;

//ini_set( 'memory_limit', '4096M');
$app_root = dirname($_SERVER['SCRIPT_NAME']).'/../../..' ;
$server_root=$app_root.'/server' ;
//$server_root='.' ;


@include_once 'PHPExcel/PHPExcel.php' ;
@include_once 'Mail.php' ;
@include_once 'Mail/mime.php' ;

//include("$server_root/backend_checksession.inc.php") ;

include("$server_root/include/config.inc.php");

include("$server_root/modules/media/include/media.inc.php");

//@include_once 'PHPExcel/PHPExcel.php' ;
include( "$server_root/include/database/mysql_DB.inc.php" ) ;
$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, $mysql_db, $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;

include("$server_root/modules/paracrm/backend_paracrm.inc.php");

$_opDB->select_db( $mysql_db.'_'.'paracrm') ;

$data = "" ;
$handle = fopen("php://stdin",'rb') ;
while( !feof($handle) ) {
	$data.= fread($handle,1024*4) ;
}
fclose($handle) ;

$tmpfname = tempnam( sys_get_temp_dir(), "FOO");
file_put_contents($tmpfname,$data) ;
echo $tmpfname."\n" ;


$map = array() ;
$map_prod = array() ;


$map['33010']['field_VCA_RANK_ENS_dec'] = 'AQ' ;
$map['33010']['field_VCA_RANK_WPF_dec'] = 'AP' ;
$map_prod['33010']['0014113911672']['UVC'][] = 'L' ;
$map_prod['33010']['0014113911672']['CA'][] = 'N' ;
$map_prod['33010']['0014113911719']['UVC'][] = 'P' ;
$map_prod['33010']['0014113911719']['CA'][] = 'R' ;
$map_prod['33010']['0014113911702']['UVC'][] = 'T' ;
$map_prod['33010']['0014113911702']['CA'][] = 'V' ;
$map_prod['33010']['0014113912341']['UVC'][] = 'X' ;
$map_prod['33010']['0014113912341']['CA'][] = 'Z' ;
$map_prod['33010']['0014113911665']['UVC'][] = 'AB' ;
$map_prod['33010']['0014113911665']['CA'][] = 'AD' ;
$map_prod['33010']['0014113911658']['UVC'][] = 'AF' ;
$map_prod['33010']['0014113911658']['CA'][] = 'AH' ;
$map_prod['33010']['0014113911832']['UVC'][] = 'AJ' ;
$map_prod['33010']['0014113911832']['CA'][] = 'AL' ;



$map['33030']['field_VCA_RANK_ENS_dec'] = 'AL' ;
$map['33030']['field_VCA_RANK_WPF_dec'] = 'AK' ;
$map_prod['33030']['0014113912273']['CA'][] = 'N' ;
$map_prod['33030']['0014113912273']['UVC'][] = 'O' ;
$map_prod['33030']['0014113911658']['CA'][] = 'P' ;
$map_prod['33030']['0014113911658']['UVC'][] = 'Q' ;
$map_prod['33030']['0014113911672']['CA'][] = 'R' ;
$map_prod['33030']['0014113911672']['UVC'][] = 'S' ;

$map_prod['33030']['0014113911702']['CA'][] = 'T' ;
$map_prod['33030']['0014113911702']['UVC'][] = 'U' ;
$map_prod['33030']['0014113911702']['CA'][] = 'T' ;
$map_prod['33030']['0014113911702']['UVC'][] = 'U' ;

$map_prod['33030']['0014113912273']['CA'][] = 'V' ;
$map_prod['33030']['0014113912273']['UVC'][] = 'W' ;
$map_prod['33030']['0014113912273']['CA'][] = 'V' ;
$map_prod['33030']['0014113912273']['UVC'][] = 'W' ;

$map_prod['33030']['0014113911832']['CA'][] = 'X' ;
$map_prod['33030']['0014113911832']['UVC'][] = 'Y' ;
$map_prod['33030']['0014113911665']['CA'][] = 'X' ;
$map_prod['33030']['0014113911665']['UVC'][] = 'Y' ;

$map_prod['33030']['0014113912341']['CA'][] = 'Z' ;
$map_prod['33030']['0014113912341']['UVC'][] = 'AA' ;
$map_prod['33030']['0014113911832']['CA'][] = 'AB' ;
$map_prod['33030']['0014113911832']['UVC'][] = 'AC' ;
$map_prod['33030']['0014113911665']['CA'][] = 'AD' ;
$map_prod['33030']['0014113911665']['UVC'][] = 'AE' ;
$map_prod['33030']['0014113911702']['CA'][] = 'AF' ;
$map_prod['33030']['0014113911702']['UVC'][] = 'AG' ;
$map_prod['33030']['0014113911719']['CA'][] = 'AH' ;
$map_prod['33030']['0014113911719']['UVC'][] = 'AI' ;


$time = time() ;

$inputFileType = 'Excel2007';
$inputFileName = $tmpfname ;
$objReader = PHPExcel_IOFactory::createReader($inputFileType);
$objPHPExcel = $objReader->load($inputFileName);

$obj_sheet = $objPHPExcel->getActiveSheet();
$row_max = $obj_sheet->getHighestRow();
for( $row=1 ; $row<=$row_max ; $row++ ) {
	
	$mag_code = $obj_sheet->getCell("A{$row}")->getValue() ;
	$mag5 = substr($mag_code,0,5) ;
	if( !$map[$mag5] ) {
		continue ;
	}

	$query = "SELECT * FROM store_bible_STORE_entry WHERE entry_key='$mag_code'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 ) {
		continue ;
	}
	
	$query = "SELECT filerecord_id FROM store_file_VCA WHERE field_VCA_STORE_str='$mag_code'" ;
	if( $filerecord_id = $_opDB->query_uniqueValue($query) ) {
		$query = "DELETE FROM store_file WHERE filerecord_id='$filerecord_id' AND file_code='VCA'" ;
		$_opDB->query($query) ;
		$query = "DELETE FROM store_file WHERE filerecord_parent_id='$filerecord_id' AND file_code='VCA_PROD'" ;
		$_opDB->query($query) ;
	}
	
	$arr_ins = array() ;
	$arr_ins['file_code'] = 'VCA' ;
	$arr_ins['sync_timestamp'] = $time ;
	$_opDB->insert('store_file',$arr_ins) ;
	$filerecord_parent_id = $_opDB->insert_id() ;
	
	$arr_ins = array() ;
	$arr_ins['filerecord_id'] = $filerecord_parent_id ;
	$arr_ins['field_VCA_STORE_str'] = $mag_code ;
	foreach( $map[$mag5] as $mkey => $src_col ) {
		$arr_ins[$mkey] = $obj_sheet->getCell("{$src_col}{$row}")->getValue() ;
	}
	$_opDB->insert('store_file_VCA',$arr_ins) ;

	foreach( $map_prod[$mag5] as $prod => $arr1 ) {
		$arr_ins = array() ;
		$arr_ins['filerecord_parent_id'] = $filerecord_parent_id ;
		$arr_ins['file_code'] = 'VCA_PROD' ;
		$arr_ins['sync_timestamp'] = $time ;
		$_opDB->insert('store_file',$arr_ins) ;
		$filerecord_child_id = $_opDB->insert_id() ;
	
		$arr_ins = array() ;
		$arr_ins['filerecord_id'] = $filerecord_child_id ;
		$arr_ins['field_VCA_PRODCOM_str'] = $prod ;
		foreach( $arr1 as $mkey => $arr_src_col ) {
			$dst_value = 0 ;
			foreach( $arr_src_col as $src_col ) {
				$value = $obj_sheet->getCell("{$src_col}{$row}")->getValue() ;
				if( substr($value,-1,1) == '%' ) {
					$value = ( ((int)(substr($value,0,strlen($value)-1))) / 100 ) ;
				}
				$dst_value += $value ;
			}
			$mkey = 'field_VCA_PROD_'.$mkey.'_dec' ;
			$arr_ins[$mkey] = $dst_value ;
		}
		$_opDB->insert('store_file_VCA_PROD',$arr_ins) ;
	}

}



$query = "DELETE FROM store_file_VCA WHERE filerecord_id NOT IN (select filerecord_id FROM store_file)" ;
$_opDB->query($query) ;
$query = "DELETE FROM store_file_VCA_PROD WHERE filerecord_id NOT IN (select filerecord_id FROM store_file)" ;
$_opDB->query($query) ;



unlink($tmpfname) ;


exit ;


?>