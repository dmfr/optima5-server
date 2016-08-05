<?php

class SpreadsheetToCsv {
	public static function toCsvHandle( $filepath, $filename ) {
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
