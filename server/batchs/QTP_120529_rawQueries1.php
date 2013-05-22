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
$arr_sheet['bible_y'] = $arr_bible ;




$DATA = array() ;

$tmp_stores = array() ;

$query = "SELECT filerecord_id, field_VSTORE , field_VSALES FROM view_file_VISIT
				ORDER BY field_VDATE DESC" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
{
	$vstore = $arr['field_VSTORE'] ;
	if( $tmp_stores[$vstore] )
		continue ;
	$tmp_stores[$vstore] = TRUE ;
	
	// enseigne ?
	$vsales = $arr['field_VSALES'] ;
	$enseigne = substr($vstore,0,5) ;
	
	
	$ttmp = array() ;
	$query = "SELECT field_PRODCODE FROM view_file_VISIT_1COUNT WHERE filerecord_parent_id='{$arr['filerecord_id']}' AND field_FACING>'0'" ;
	$res = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($res)) != FALSE )
	{
		$ttmp[$arr[0]] = TRUE ;
	}
	
	foreach( $arr_sheet['bible_y'] as $prodcode => $dummy )
	{
		if( !isset($DATA[$vsales][$enseigne][$prodcode]) )
			$DATA[$vsales][$enseigne][$prodcode] = array() ;
		if( $ttmp[$prodcode] )
			$DATA[$vsales][$enseigne][$prodcode][] = 1 ;
		else
			$DATA[$vsales][$enseigne][$prodcode][] = 0 ;
	}
}

foreach( $DATA as $vsales => $arr1 )
{
	foreach( $arr1 as $enseigne => $arr2 )
	{
		foreach( $arr2 as $prodcode => $arrmoy )
		{
			$DATA[$vsales][$enseigne][$prodcode] = round( array_sum($arrmoy) / count($arrmoy) , 3 ) ;
		}
	}
}

// print_r($DATA) ;


$tab_sheets = array() ;
foreach( $arr_vsales as $skey => $dummy )
{
	// $arr_sheet = array() ;
	$arr_sheet['name'] = $skey ;
	$arr_sheet['data'] = $DATA[$skey] ;

	$tab_sheets[] = $arr_sheet ;
}


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
$objWriter->save('QTP_120529_rawQueries1_DN.xlsx');
$objPHPExcel->disconnectWorksheets();
unset($objPHPExcel) ;




?>