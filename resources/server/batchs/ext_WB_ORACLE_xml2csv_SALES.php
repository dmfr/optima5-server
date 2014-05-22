<?php
ini_set( 'memory_limit', '1024M');

$dir = dirname($_SERVER['SCRIPT_NAME']) ;
include($dir.'/'.'ext_WB_ORACLE_xml2csv.inc.php') ;

$handle_in = fopen("php://stdin",'rb') ;
$handle_out = fopen("php://stdout",'wb') ;
ext_WB_ORACLE_xml2csv_SALES( $handle_in, $handle_out ) ;
fclose($handle_in) ;
fclose($handle_out) ;

?>