<?php
ini_set( 'memory_limit', '1024M');


function ext_WB_ORACLE_xml2csv_TEST( $handle_in ) {
	$xml_root_tag = 'XXWBEFOXYEXPSALES' ;
	
	$tmpfilepath = tempnam(sys_get_temp_dir(),'op5') ;
	$handle_priv = fopen($tmpfilepath,'wb') ;
	stream_copy_to_stream($handle_in,$handle_priv);
	fclose($handle_priv) ;
	
	$reader = new XMLReader();
	$reader->open($tmpfilepath);
	unlink($tmpfilepath) ;
	$reader->read() ;
	if( ($reader->nodeType != XMLReader::ELEMENT) || ($reader->name != $xml_root_tag) ) {
		return TRUE ;
	}
	
	$TAB_desc = array() ;
	
	while($reader->read())
	{
		if($reader->nodeType == XMLReader::ELEMENT && $reader->name == 'G_ONE')
		{
			$doc = new DOMDocument('1.0', 'UTF-8');
			$obj_xmlRow = simplexml_import_dom($doc->importNode($reader->expand(),true));
			
			$QTY_INV = (float)$obj_xmlRow->QTY_INV ;
			$QTY_CRED = (float)$obj_xmlRow->QTY_CRED ;
			$SELL_PRICE = (float)$obj_xmlRow->SELL_PRICE ;
			if( $QTY_INV != 0 ) {
				$qty_value = $QTY_INV ;
				$price_value = $SELL_PRICE ;
			} elseif( $QTY_CRED > 0 ) {
				$qty_value = (-1 * $QTY_CRED) ;
				$price_value = (-1 * $SELL_PRICE) ;
			} elseif( $QTY_CRED < 0 ) {
				$qty_value = $QTY_CRED ;
				$price_value = $SELL_PRICE ;
			} else {
				$qty_value = 0 ;
				$price_value = $SELL_PRICE ;
			}
		}
		
		if( (float)$obj_xmlRow->STD_PRICE < 0 ) {
			$desc = (string)$obj_xmlRow->DESCRIPTION ;
			if( !in_array($desc,$TAB_desc) ) {
				$TAB_desc[] = $desc ;
			}
		}
	}
	
	print_r($TAB_desc) ;
	
	if( $_ERROR ) {
		return FALSE ;
	}
	return TRUE ;
}


$handle_in = fopen("php://stdin",'rb') ;
ext_WB_ORACLE_xml2csv_TEST( $handle_in, $handle_out ) ;
fclose($handle_in) ;

?>