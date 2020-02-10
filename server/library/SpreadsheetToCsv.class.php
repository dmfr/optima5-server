<?php

class SpreadsheetToCsv {
	public static function toCsvHandle( $filepath, $filename ) {
		$Extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
		switch( $Extension ) {
			case 'xlsx':
			case 'xltx': // XLSX template
			case 'xlsm': // Macro-enabled XLSX
			case 'xltm': // Macro-enabled XLSX template
				$app_root = $GLOBALS['app_root'] ;
				$resources_root=$app_root.'/resources' ;
				if( !@include_once("{$resources_root}/spout/src/Spout/Autoloader/autoload.php") ) {
					//echo "?" ;
					break ;
				}
				
				//use Box\Spout\Reader\ReaderFactory;
				//use Box\Spout\Common\Type;

				$reader = Box\Spout\Reader\ReaderFactory::create(Box\Spout\Common\Type::XLSX); // for XLSX files
				//$reader = ReaderFactory::create(Type::CSV); // for CSV files
				//$reader = ReaderFactory::create(Type::ODS); // for ODS files


				$reader->open($filepath);
				$handle = tmpfile() ;
				foreach ($reader->getSheetIterator() as $sheet) {
					if( !$sheet->isActive() ) {
						continue ;
					}
					foreach ($sheet->getRowIterator() as $row) {
						foreach( $row as &$val ) {
							if( $val instanceof DateTime ) {
								$val = $val->format('Y-m-d H:i:s') ;
							}
						}
						unset($val) ;
						fputcsv($handle,$row) ;
					}
				}

				$reader->close();
				
				fseek($handle,0) ;
				return $handle ;
			default :
				break ;
		}
		
		try {
			$obj_ssReader = new SpreadsheetReader($filepath,$filename) ;
			
			$handle = tmpfile() ;
			$obj_ssReader->ChangeSheet(0);
			foreach($obj_ssReader as $key => $row ) {
				fputcsv($handle,$row) ;
			}
			
			fseek($handle,0) ;
			return $handle ;
		} catch( Exception $e ) {
			return NULL ;
		}
	}
}
