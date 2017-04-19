<?php

function specRsiRecouveo_xls_create($post_data) {
	$json_cfg = $ttmp['data'] ;

	$data = json_decode($post_data['data'],true) ;
	
	$columns = array() ;
	foreach( json_decode($post_data['columns'],true) as $column ) {
		$columns[$column['dataIndex']] = $column['text'] ;
	
	}
	
		$server_root = $GLOBALS['server_root'] ;
		include("$server_root/include/xlsxwriter.class.php");
		
	$header = array() ;
	foreach( $columns as $mkey => $col_title ) {
		$header[$col_title] = 'string' ;
	}
	$writer = new XLSXWriter();
	$writer->writeSheetHeader('Sheet1', $header );//optional
	foreach( $data as $data_row ) {
		$row = array() ;
		foreach( $columns as $mkey => $dummy ) {
				$value = '' ;
				switch( $mkey ) {
					case 'calc_link_trspt_txt' :
						if( $data_row['calc_link_is_active'] ) {
							$value = $data_row['calc_link_trspt_txt'] ;
						}
						break ;
						
					default :
						$value = $data_row[$mkey] ;
						break ;
				}
			$row[] = $value ;
		}
		$writer->writeSheetRow('Sheet1', $row );
	}
	
	$tmpfilename = tempnam( sys_get_temp_dir(), "FOO");
	$writer->writeToFile($tmpfilename);
	
	
	$filename = 'RsiRecouveo_Export'.'_'.time().'.xlsx' ;
	header("Content-Type: application/force-download; name=\"$filename\""); 
	header("Content-Disposition: attachment; filename=\"$filename\""); 
	readfile($tmpfilename) ;
	unlink($tmpfilename) ;
	die() ;
}

?>
