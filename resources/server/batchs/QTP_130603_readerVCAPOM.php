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
$map['33010']['field_VCA_RANK_ENS_dec'] = 'G' ;
$map['33010']['field_VCA_RANK_POM_dec'] = 'H' ;
$map['33010']['field_VCA_GROUP_str'] = 'D' ;
$map['33010']['field_POM_COOLIO_int'] = 'I' ;
$map['33010']['field_POM_QTE_TOT_dec'] = 'J' ;


$time = time() ;

$inputFileType = 'Excel2007';
$inputFileName = $tmpfname ;
$objReader = PHPExcel_IOFactory::createReader($inputFileType);
$objPHPExcel = $objReader->load($inputFileName);

$obj_sheet = $objPHPExcel->getActiveSheet();
$row_max = $obj_sheet->getHighestRow();
if( $row_max > 0 ) {
	$query = "DELETE FROM store_file WHERE file_code='VCAPOM'" ;
	$_opDB->query($query) ;
	$query = "DELETE FROM store_file_VCAPOM" ;
	$_opDB->query($query) ;
}
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
	
	$arr_ins = array() ;
	$arr_ins['file_code'] = 'VCAPOM' ;
	$arr_ins['sync_timestamp'] = $time ;
	$_opDB->insert('store_file',$arr_ins) ;
	$filerecord_parent_id = $_opDB->insert_id() ;
	
	$arr_ins = array() ;
	$arr_ins['filerecord_id'] = $filerecord_parent_id ;
	$arr_ins['field_VCA_STORE_str'] = $mag_code ;
	foreach( $map[$mag5] as $mkey => $src_col ) {
		$val = $obj_sheet->getCell("{$src_col}{$row}")->getValue() ;
		if( substr($mkey,-3,3) == 'int' ) {
			$arr_ins[$mkey] = ($val=='OUI')? 1 : 0 ;
		} else {
			$arr_ins[$mkey] = $val ;
		}
	}
	$_opDB->insert('store_file_VCAPOM',$arr_ins) ;
}

unlink($tmpfname) ;

exit ;

?>