<?php
//ini_set( 'memory_limit', '4096M');
$server_root = dirname($_SERVER['SCRIPT_NAME']).'/..' ;
if( $_SERVER['SCRIPT_NAME'] == '' )
	$server_root = './..' ;

$app_root='..' ;
//$server_root='.' ;

//include("$server_root/backend_checksession.inc.php") ;

include("$server_root/include/config.inc.php");

include("$server_root/modules/media/include/media.inc.php");

@include_once 'PHPExcel/PHPExcel.php' ;
include( "$server_root/include/database/mysql_DB.inc.php" ) ;
$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, $mysql_db, $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;

include("$server_root/modules/paracrm/backend_paracrm.inc.php");

$_opDB->select_db( $mysql_db.'_'.'paracrm') ;


$arr_sheet = array() ;
$arr_sheet['name'] = 'sSIDJ' ;
$arr_sheet['title'] = 'Test Sheet' ;


$query = "SELECT entry_key , field_SALESMAN , field_SALESMANNAME
				FROM view_bible_SALES_entry
				ORDER BY field_SALESMAN" ;
$result = $_opDB->query($query) ;
$arr_bible = array() ;
while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
{
	$arr_bible[$arr['entry_key']] = $arr['field_SALESMAN'].' '.$arr['field_SALESMANNAME'] ;
}
$arr_vsales = $arr_bible ;


$query = "SELECT treenode_key , field_STOREGROUPCODE , field_STOREGROUPNAME
				FROM view_bible_STORE_tree WHERE treenode_parent_key=''
				ORDER BY field_STOREGROUPCODE" ;
$result = $_opDB->query($query) ;
$arr_bible = array() ;
while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
{
	$arr_bible[$arr['treenode_key']] = $arr['field_STOREGROUPCODE'].' '.$arr['field_STOREGROUPNAME'] ;
}
$arr_vstore = $arr_bible ;
$arr_sheet['bible_x'] = $arr_bible ;



$query = "SELECT entry_key , treenode_key , field_TASTE , field_CONDIT
				FROM view_bible_PRODCOM_entry
				ORDER BY treenode_key,entry_key" ;
$result = $_opDB->query($query) ;
$arr_bible = array() ;
while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
{
	$arr_bible[$arr['entry_key']] = $arr['treenode_key'].' '.$arr['field_TASTE'].' '.$arr['field_CONDIT'] ;
}
$arr_prodcom = $arr_bible ;
$arr_sheet['bible_y'] = $arr_bible ;


$query = "SELECT entry_key , treenode_key , field_TASTE , field_CONDIT , field_PCB
				FROM view_bible_PRODLOG_entry
				ORDER BY treenode_key,entry_key" ;
$result = $_opDB->query($query) ;
$arr_bible = array() ;
while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
{
	$arr_bible[$arr['entry_key']] = $arr['treenode_key'].' '.$arr['field_TASTE'].' '.$arr['field_CONDIT'].' '.$arr['field_PCB'] ;
}
$arr_prodlog = $arr_bible ;



$tab_sheets = array() ;



$DATA = array() ;

$query = "SELECT field_VSALES, field_PRODCODE, sum(field_CDEQTE) as cdeqte
				FROM view_file_VISIT , view_file_VISIT_4ORDER
				WHERE view_file_VISIT.filerecord_id = view_file_VISIT_4ORDER.filerecord_parent_id
				AND field_VDATE>='2012-05-14'
				GROUP BY field_VSALES, field_PRODCODE" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
{
	$vprodlog = $arr['field_PRODCODE'] ;
	$vsales = $arr['field_VSALES'] ;
	$DATA[$vsales][$vprodlog] = $arr['cdeqte'] ;
}
$arr_sheet = array() ;
$arr_sheet['name'] = 'VENTES' ;
$arr_sheet['data'] = $DATA ;
$arr_sheet['bible_y'] = $arr_prodlog ;
$arr_sheet['bible_x'] = $arr_vsales ;
$tab_sheets[] = $arr_sheet ;
// print_r($DATA) ;


$DATA = array() ;
$query = "SELECT field_VSALES, field_PRODCODE, avg(field_PRICE) as cdeqte
				FROM view_file_VISIT , view_file_VISIT_1COUNT
				WHERE view_file_VISIT.filerecord_id = view_file_VISIT_1COUNT.filerecord_parent_id
				AND field_VDATE>='2012-05-14' AND field_PRICE>'0'
				GROUP BY field_VSALES, field_PRODCODE" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
{
	$vprodlog = $arr['field_PRODCODE'] ;
	$vsales = $arr['field_VSALES'] ;
	$DATA[$vsales][$vprodlog] = $arr['cdeqte'] ;
}
$arr_sheet = array() ;
$arr_sheet['name'] = 'PRIXMOY' ;
$arr_sheet['data'] = $DATA ;
$arr_sheet['bible_y'] = $arr_prodcom ;
$arr_sheet['bible_x'] = $arr_vsales ;
$tab_sheets[] = $arr_sheet ;
// print_r($DATA) ;




$DATA = array() ;
$query = "SELECT field_VSALES, substring(field_VSTORE,1,5) as enseigne, count(*) as cdeqte
				FROM view_file_VISIT
				WHERE 1
				AND field_VDATE>='2012-05-14'
				GROUP BY field_VSALES, substring(field_VSTORE,1,5)" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
{
	$vstore = $arr['enseigne'] ;
	$vsales = $arr['field_VSALES'] ;
	$DATA[$vstore][$vsales] = $arr['cdeqte'] ;
}
$arr_sheet = array() ;
$arr_sheet['name'] = 'NBVISITES' ;
$arr_sheet['data'] = $DATA ;
$arr_sheet['bible_y'] = $arr_vsales ;
$arr_sheet['bible_x'] = $arr_vstore ;
$tab_sheets[] = $arr_sheet ;






$objPHPExcel = new PHPExcel();
$objPHPExcel->getDefaultStyle()->getFont()->setName('Arial');
$objPHPExcel->getDefaultStyle()->getFont()->setSize( 10 );

$nul=0 ;
foreach( $tab_sheets as $arr_sheet ) {
	if( $nul > 0 )
		$objPHPExcel->createSheet($nul) ;

	$objPHPExcel->setActiveSheetIndex($nul);
	$obj_sheet = $objPHPExcel->getActiveSheet() ;
	$obj_sheet->setTitle($arr_sheet['name']) ;
	
	$row = 4 ;
	$obj_sheet->getColumnDimension('A')->setWidth(30);
	$cell = 'B' ;
	foreach( $arr_sheet['bible_x'] as $xkey => $xvalue ) {
	
		$obj_sheet->SetCellValue("{$cell}{$row}", $xvalue);
		$obj_sheet->getColumnDimension($cell)->setWidth(20);
		$obj_sheet->getStyle("{$cell}{$row}")->getFont()->setBold(TRUE);
		
		$cell++ ;
	}
	$row++ ;
	
	foreach( $arr_sheet['bible_y'] as $ykey => $yvalue ) {
		$cell = 'A' ;
		$obj_sheet->SetCellValue("{$cell}{$row}", $yvalue);
		$obj_sheet->getStyle("{$cell}{$row}")->getFont()->setBold(TRUE);
		$cell = 'B' ;
		foreach( $arr_sheet['bible_x'] as $xkey => $xvalue ) {
		
			$data = $arr_sheet['data'][$xkey][$ykey] ;
			
			$obj_sheet->SetCellValue("{$cell}{$row}", $data);
			
			$cell++ ;
		}
		$row++ ;
	}
	
	
	
	$nul++ ;
}

$objWriter = PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel2007');
$objWriter->save('QTP_120529_queriesFrom20120514.xlsx');
$objPHPExcel->disconnectWorksheets();
unset($objPHPExcel) ;




?>