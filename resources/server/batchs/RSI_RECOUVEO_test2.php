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

include("$server_root/modules/spec_rsi_recouveo/backend_spec_rsi_recouveo.inc.php");

$handle_in = fopen('php://stdin','rb') ;
//fpassthru($handle) ;
		$filename = "test.xlsx" ;
		$tmpfname = tempnam( sys_get_temp_dir(), "FOO").'.xlsx';
		$handle_w = fopen($tmpfname,'wb') ;
		stream_copy_to_stream($handle_in,$handle_w);
		fclose($handle_w) ;
		fclose($handle_in) ;
		
		
		
		$handle_out = SpreadsheetToCsv::toCsvHandle($tmpfname,$filename) ;
fpassthru($handle_out) ;
exit ;

use Box\Spout\Reader\ReaderFactory;
use Box\Spout\Common\Type;

$reader = ReaderFactory::create(Type::XLSX); // for XLSX files
//$reader = ReaderFactory::create(Type::CSV); // for CSV files
//$reader = ReaderFactory::create(Type::ODS); // for ODS files

$reader->open($tmpfname);

foreach ($reader->getSheetIterator() as $sheet) {
    foreach ($sheet->getRowIterator() as $row) {
        // do stuff with the row
        echo "i" ;
    }
}

$reader->close();


?>
