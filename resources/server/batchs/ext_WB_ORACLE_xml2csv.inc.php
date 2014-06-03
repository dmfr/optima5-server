<?php

function ext_WB_ORACLE_xml2csv_SALES( $handle_in, $handle_out ) {
	return ext_WB_ORACLE_xml2csv( array('XXWBEFOXYEXPSALES'), $handle_in, $handle_out ) ;
}

function ext_WB_ORACLE_xml2csv_PURCHASE( $handle_in, $handle_out ) {
	return ext_WB_ORACLE_xml2csv( array('WBEFOXYEXPPURCH'), $handle_in, $handle_out ) ;
}

function ext_WB_ORACLE_xml2csv( $xml_root_tags, $handle_in, $handle_out ) {
	
	$tmpfilepath = tempnam(sys_get_temp_dir(),'op5') ;
	$handle_priv = fopen($tmpfilepath,'wb') ;
	stream_copy_to_stream($handle_in,$handle_priv);
	fclose($handle_priv) ;
	
	$reader = new XMLReader();
	$reader->open($tmpfilepath);
	unlink($tmpfilepath) ;
	$reader->read() ;
	if( $reader->nodeType != XMLReader::ELEMENT || !in_array($reader->name,$xml_root_tags) ) {
		return TRUE ;
	}
	
	while($reader->read())
	{
		if($reader->nodeType == XMLReader::ELEMENT && $reader->name == 'G_ONE')
		{
			$doc = new DOMDocument('1.0', 'UTF-8');
			$obj_xmlRow = simplexml_import_dom($doc->importNode($reader->expand(),true));
			
			if( !isset($csvMap_key_idx) ) {
				$csvMap_key_idx = array() ;
				foreach( array('BRAND') as $mkey ) {
					if( !isset($csvMap_key_idx[$mkey]) ) {
						$csvMap_key_idx[$mkey] = count($csvMap_key_idx) ;
					}
				}
				foreach( $obj_xmlRow as $mkey => $mvalue ) {
					if( !isset($csvMap_key_idx[$mkey]) ) {
						$csvMap_key_idx[$mkey] = count($csvMap_key_idx) ;
					}
				}
				if( isset($csvMap_key_idx['QTY_INV']) || isset($csvMap_key_idx['QTY_CRED']) ) {
					foreach( array('QTY','PRICE') as $mkey ) {
						if( !isset($csvMap_key_idx[$mkey]) ) {
							$csvMap_key_idx[$mkey] = count($csvMap_key_idx) ;
						}
					}
				}
				fputcsv( $handle_out, array_keys($csvMap_key_idx) ) ;
			}
			
			// Probe PCB
			$item_number = (string)$obj_xmlRow->ITEM_NUMBER ;
			$item_desc = (string)$obj_xmlRow->DESCRIPTION ;
			if( strpos($item_desc,'pk') !== FALSE ) {
				$start_char = strpos($item_desc,'pk') ;
				$length = 0 ;
				while( is_numeric(substr($item_desc,$start_char-1,1)) ) {
					$start_char-- ;
					$length++ ;
				}
				if( $length == 0 ) {
					continue ;
				}
				$pcb = substr($item_desc,$start_char,$length) ;
				$map_item_pcb[$item_number] = $pcb ;
			} elseif( strpos($item_desc,'*') !== FALSE ) {
				$length = strpos($item_desc,'*') ;
				$pcb = substr($item_desc,0,$length) ;
				if( is_numeric($pcb) ) {
					$map_item_pcb[$item_number] = $pcb ;
				}
			} elseif( strpos($item_desc,'/') !== FALSE ) {
				$length = strpos($item_desc,'/') ;
				$pcb = substr($item_desc,0,$length) ;
				if( is_numeric($pcb) ) {
					$map_item_pcb[$item_number] = $pcb ;
				}
			}
			
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
				continue ;
			}
			
			
			$csv_row = array() ;
			foreach( $csvMap_key_idx as $mkey => $idx ) {
				
				switch( $mkey ) {
					case 'BRAND' :
						$value = 'WONDERFUL' ;
						break ;
						
					case 'QTY' :
						switch( $obj_xmlRow->UOM ) {
							case 'CS' :
								$item_key = (string)$obj_xmlRow->ITEM_NUMBER ;
								if( !($pcb = $map_item_pcb[$item_key]) ) {
									// echo "!PCB errr! $item_key + ".(string)$obj_xmlRow->DESCRIPTION."\n" ;
									//$_ERROR = TRUE ;
									continue 4 ;
								}
								$value = $qty_value * $pcb ;
								break ;
							default : 
								$value = $qty_value ;
								break ;
						}
						break ;
					
					case 'PRICE' :
						switch( $obj_xmlRow->UOM ) {
							case 'CS' :
								$item_key = (string)$obj_xmlRow->ITEM_NUMBER ;
								if( !($pcb = $map_item_pcb[$item_key]) ) {
									// echo "!PCB errr! $item_key + ".(string)$obj_xmlRow->DESCRIPTION."\n" ;
									//$_ERROR = TRUE ;
									continue 4 ;
								}
								$value = $price_value / $pcb ;
								break ;
							default : 
								$value = $price_value ;
								break ;
						}
						break ;
					
					case 'UOM' :
						switch( $obj_xmlRow->UOM ) {
							case 'CS' :
								$value = 'EA' ;
								break ;
							default :
								$value = $obj_xmlRow->$mkey ;
						}
						break ;
						
					case 'CUST_NAME' :
					case 'DESCRIPTION' :
						$value = html_entity_decode($obj_xmlRow->$mkey, ENT_COMPAT | ENT_HTML401, "UTF-8" ) ;
						break ;
						
					default :
						$value = $obj_xmlRow->$mkey ;
						break ;
				}
				
				$csv_row[] = $value ;
			}
			
			fputcsv( $handle_out, $csv_row ) ;
		}
	}
	
	if( $_ERROR ) {
		return FALSE ;
	}
	return TRUE ;
}


?>