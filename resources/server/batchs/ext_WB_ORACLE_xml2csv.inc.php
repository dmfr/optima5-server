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

function ext_WB_ORACLE_xml2csv_BUDGETREVENUE( $handle_in, $handle_out ) {
	$xml_root_tag = 'PFEBUDGETREVENUE' ;
	
	$tmpfilepath = tempnam(sys_get_temp_dir(),'op5') ;
	$handle_priv = fopen($tmpfilepath,'wb') ;
	stream_copy_to_stream($handle_in,$handle_priv);
	fclose($handle_priv) ;
	
	$reader = new XMLReader();
	$reader->open($tmpfilepath);
	unlink($tmpfilepath) ;
	$reader->read() ;
	while( ($reader->nodeType != XMLReader::ELEMENT) ) {
		$reader->read() ;
	}
	if( ($reader->nodeType != XMLReader::ELEMENT) || ($reader->name != $xml_root_tag) ) {
		return TRUE ;
	}
	
	$DATA_CCD_dateSql_currencyCode_amount = array() ;
	while($reader->read())
	{
		if($reader->nodeType == XMLReader::ELEMENT && $reader->name == 'G_CO')
		{
			$doc = new DOMDocument('1.0', 'UTF-8');
			$obj_xmlRow = simplexml_import_dom($doc->importNode($reader->expand(),true));
			
			$thisRow_year = NULL ;
			$thisRow_CCD = NULL ;
			$thisRow_currencyCode = NULL ;
			$thisRow_month_amount = array() ;
			foreach( $obj_xmlRow as $mkey => $mvalue ) {
				if( substr($mkey,0,1)=='A' && substr($mkey,-1,1)=='_' ) {
					$month = substr($mkey,1,strlen($mkey)-2) ;
					$amount = $mvalue ;
					$thisRow_month_amount[$month] = $amount ;
					continue ;
				}
				switch( $mkey ) {
					case 'CCD' :
						$thisRow_CCD = (string)$mvalue ;
						break ;
					case 'PERIOD_YEAR' :
						$thisRow_year = (string)$mvalue ;
						break ;
					case 'CURRENCY_CODE' :
						$thisRow_currencyCode = (string)$mvalue ;
						break ;
				}
			}
			if( !$thisRow_year || !$thisRow_CCD || !$thisRow_currencyCode ) {
				continue ;
			}
			
			foreach( $thisRow_month_amount as $month => $amount ) {
				$month_sql = $thisRow_year.'-'.str_pad($month, 2, "0", STR_PAD_LEFT); ;
				$date_sql_firstDay = $month_sql.'-01' ;
				$nbDaysOfMonth = date('t',strtotime($date_sql_firstDay)) ;
				$date_sql = $month_sql.'-'.$nbDaysOfMonth ;
			
				$DATA_CCD_dateSql_currencyCode_amount[$thisRow_CCD][$date_sql][$thisRow_currencyCode] += $amount ;
			}
		}
	}
	
	
	$csvMap_key_idx = array() ;
	foreach( array('CCD','DATE','AMOUNT','CURRENCY') as $mkey ) {
		if( !isset($csvMap_key_idx[$mkey]) ) {
			$csvMap_key_idx[$mkey] = count($csvMap_key_idx) ;
		}
	}
	fputcsv( $handle_out, array_keys($csvMap_key_idx) ) ;
	
	foreach( $DATA_CCD_dateSql_currencyCode_amount as $CCD => $ttmp1 ) {
		foreach( $ttmp1 as $date_sql => $ttmp2 ) {
			if( count($ttmp2) != 1 ) {
				continue ;
			}
			foreach( $ttmp2 as $currencyCode => $amount ) {
				$arr_csv = array() ;
				foreach( $csvMap_key_idx as $mkey => $idx ) {
					switch( $mkey ) {
						case 'CCD' :
							$arr_csv[] = $CCD ;
							break ;
						case 'DATE' :
							$arr_csv[] = $date_sql ;
							break ;
						case 'AMOUNT' :
							$arr_csv[] = $amount ;
							break ;
						case 'CURRENCY' :
							$arr_csv[] = $currencyCode ;
							break ;
					}
				}
				fputcsv( $handle_out, $arr_csv ) ;
			}
		}
	}
	
	
	if( $_ERROR ) {
		return FALSE ;
	}
	return TRUE ;
}

?>
