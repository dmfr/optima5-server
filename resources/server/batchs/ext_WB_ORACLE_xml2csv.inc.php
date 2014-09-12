<?php

function ext_WB_ORACLE_xml2csv_SALES( $handle_in, $handle_out ) {
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
					foreach( array('QTY','PRICE','DESCRIPTION_TAG') as $mkey ) {
						if( !isset($csvMap_key_idx[$mkey]) ) {
							$csvMap_key_idx[$mkey] = count($csvMap_key_idx) ;
						}
					}
				}
				fputcsv( $handle_out, array_keys($csvMap_key_idx) ) ;
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
				$qty_value = 0 ;
				$price_value = $SELL_PRICE ;
			}
			
			
			$csv_row = array() ;
			foreach( $csvMap_key_idx as $mkey => $idx ) {
				
				switch( $mkey ) {
					case 'BRAND' :
						$value = 'WONDERFUL' ;
						break ;
						
					case 'QTY' :
						$value = $qty_value ;
						break ;
					
					case 'PRICE' :
						$value = $price_value ;
						break ;
						
					case 'DESCRIPTION_TAG' :
						$value = '' ;
					
						$desc = html_entity_decode($obj_xmlRow->DESCRIPTION, ENT_COMPAT | ENT_HTML401, "UTF-8" ) ;
						$ttmp = explode('.',$desc) ;
						$desc = $ttmp[0] ;
						$desc_words = explode(' ',$desc) ;
						if( strlen(reset($desc_words)) == 2 && strlen(end($desc_words)) == 10 ) {
							$value = 'PROMO' ;
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

function ext_WB_ORACLE_xml2csv_PURCHASE( $handle_in, $handle_out ) {
	$xml_root_tag = 'WBEFOXYEXPPURCH' ;
	
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
	
	$map_item_pcb = array() ;
	
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
				foreach( array('INVOICE_NUM','LINE_NUMBER','LINE_NUMBER_INDEX') as $mkey ) {
					if( !isset($csvMap_key_idx[$mkey]) ) {
						$csvMap_key_idx[$mkey] = count($csvMap_key_idx) ;
					}
				}
				foreach( $obj_xmlRow as $mkey => $mvalue ) {
					if( !isset($csvMap_key_idx[$mkey]) ) {
						$csvMap_key_idx[$mkey] = count($csvMap_key_idx) ;
					}
				}
				fputcsv( $handle_out, array_keys($csvMap_key_idx) ) ;
			}
			
			// Reglage de l'index
			$row_primaryKey = $obj_xmlRow->INVOICE_NUM.'::'.$obj_xmlRow->LINE_NUMBER ;
			if( !isset($cur_primaryKey) || $cur_primaryKey != $row_primaryKey ) {
				$cur_primaryKey = $row_primaryKey ;
				$cur_primaryKeyIndex = 0 ;
			}
			$cur_primaryKeyIndex++ ;
			
			$csv_row = array() ;
			foreach( $csvMap_key_idx as $mkey => $idx ) {
				switch( $mkey ) {
					case 'BRAND' :
						$value = 'WONDERFUL' ;
						break ;
						
					case 'LINE_NUMBER_INDEX' :
						$value = $cur_primaryKeyIndex ;
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

function ext_WB_ORACLE_xml2csv_ITEMS( $handle_in, $handle_out ) {
	$xml_root_tag = 'XXWBEFOXYEXPITEMS' ;
	
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
	
	$map_item_pcb = array() ;
	
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
				foreach( array('OUT_KG','OUT_UOM','OUT_PCB','OUT_ISBOX') as $mkey ) {
					if( !isset($csvMap_key_idx[$mkey]) ) {
						$csvMap_key_idx[$mkey] = count($csvMap_key_idx) ;
					}
				}
				fputcsv( $handle_out, array_keys($csvMap_key_idx) ) ;
			}
			
			$csv_row = array() ;
			foreach( $csvMap_key_idx as $mkey => $idx ) {
				switch( $mkey ) {
					case 'BRAND' :
						$value = 'WONDERFUL' ;
						break ;
					
					
					case 'OUT_KG' :
						$base_kg = round((float)$obj_xmlRow->KG_PER_EA,3) ;
						$value = ( trim($obj_xmlRow->EAN_DISPLAY) != '' ? ($base_kg * (int)$obj_xmlRow->EA_PER_CS) : $base_kg ) ;
						break ;
						
					case 'OUT_UOM' :
						$value = ( trim($obj_xmlRow->EAN_DISPLAY) != '' ? 'BIN' : 'EA' ) ;
						break ;
						
					case 'OUT_PCB' :
						$value = ( trim($obj_xmlRow->EAN_DISPLAY) != '' ? 1 : (int)$obj_xmlRow->EA_PER_CS ) ;
						break ;
						
					case 'OUT_ISBOX' :
						$value = ( trim($obj_xmlRow->EAN_DISPLAY) != '' ? 1 : 0 ) ;
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

function ext_WB_ORACLE_xml2csv_PRICES( $handle_in, $handle_out ) {
	$xml_root_tag = 'XXWBEFOXYEXPSALESPRICES' ;
	
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
	
	$map_item_pcb = array() ;
	
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
						if( $mkey=='ACCOUNT_NUMBER' ) {
							$csvMap_key_idx['ACCOUNT_NUMBER_treenode'] = count($csvMap_key_idx) ;
						}
					}
				}
				fputcsv( $handle_out, array_keys($csvMap_key_idx) ) ;
			}
			
			$csv_row = array() ;
			foreach( $csvMap_key_idx as $mkey => $idx ) {
				switch( $mkey ) {
					case 'BRAND' :
						$value = 'WONDERFUL' ;
						break ;
					
					case 'START_DATE_ACTIVE' :
						$value = $obj_xmlRow->$mkey ;
						if( $value == '' ) {
							$value = '2000-01-01' ;
						}
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
