<?php
function paracrm_queries_qwebTransaction( $post_data )
{
	if( $post_data['_action'] == 'queries_qwebTransaction' && $post_data['_subaction'] == 'init' )
	{
		// ouverture transaction
		$transaction_id = $_SESSION['next_transaction_id']++ ;
		
		$_SESSION['transactions'][$transaction_id] = array() ;
		$_SESSION['transactions'][$transaction_id]['transaction_code'] = 'paracrm_queries_qwebTransaction' ;
		
		$arr_saisie = array() ;
		$_SESSION['transactions'][$transaction_id]['arr_saisie'] = $arr_saisie ;
		$_SESSION['transactions'][$transaction_id]['arr_RES'] = array() ;
		
		$post_data['_transaction_id'] = $transaction_id ;
	}
	
	
	if( $post_data['_action'] == 'queries_qwebTransaction' && $post_data['_transaction_id'] )
	{
		if( !$_SESSION['transactions'][$post_data['_transaction_id']] )
			return NULL ;
		$transaction_id = $post_data['_transaction_id'] ;
		$arr_transaction = $_SESSION['transactions'][$transaction_id] ;
		if( $arr_transaction['transaction_code'] != 'paracrm_queries_qwebTransaction' )
			return NULL ;
			
		$arr_saisie = $arr_transaction['arr_saisie'] ;
		
		if( $post_data['_subaction'] == 'init' )
		{
			$json =  paracrm_queries_qwebTransaction_init( $post_data , $arr_saisie ) ;
		}
		if( $post_data['_subaction'] == 'run' )
		{
			$json =  paracrm_queries_qwebTransaction_runQuery( $post_data , $arr_saisie ) ;
		}
		if( $post_data['_subaction'] == 'submit' )
		{
			$json =  paracrm_queries_qwebTransaction_submit( $post_data , $arr_saisie ) ;
		}
		if( $post_data['_subaction'] == 'save' || $post_data['_subaction'] == 'saveas' || $post_data['_subaction'] == 'delete' )
		{
			$json =  paracrm_queries_qwebTransaction_save( $post_data , $arr_saisie ) ;
		}
		if( $post_data['_subaction'] == 'toggle_publish' )
		{
			$json =  paracrm_queries_qwebTransaction_togglePublish( $post_data , $arr_saisie ) ;
			if( $json['success'] ) {
				paracrm_queries_organizePublish() ;
			}
		}
		
		
		
		if( $post_data['_subaction'] == 'res_get' )
		{
			$json =  paracrm_queries_qwebTransaction_resGet( $post_data ) ;
		}
		if( $post_data['_subaction'] == 'exportXLS' )
		{
			$json =  paracrm_queries_qwebTransaction_exportXLS( $post_data, $arr_saisie ) ;
		}
		
		switch( $post_data['_subaction'] ) {
			case 'chart_cfg_load' :
			case 'chart_cfg_save' :
			case 'chart_tab_getSeries' :
				return array('success'=>true) ;
				break ;
		}
		

		if( is_array($arr_saisie) )
		{
			$_SESSION['transactions'][$transaction_id]['arr_saisie'] = $arr_saisie ;
		}
		else
		{
			unset($_SESSION['transactions'][$transaction_id]) ;
		}
		
		return $json ;
	}
}


function paracrm_queries_qwebTransaction_init( $post_data , &$arr_saisie )
{
	global $_opDB ;
	
	/*
	************ INITIALISATION *********
	- structure 'tree' du fichier
	- remplissage des champs
	*******************************
	*/
	if( $post_data['is_new'] == 'true' )
	{
		$arr_saisie['fields_qwhere'] = array() ;
	}
	elseif( $post_data['qweb_id'] > 0 )
	{
		$query = "SELECT * FROM qweb WHERE qweb_id='{$post_data['qweb_id']}'" ;
		$result = $_opDB->query($query) ;
		$arr = $_opDB->fetch_assoc($result) ;
		if( !$arr )
		{
			$transaction_id = $post_data['_transaction_id'] ;
			unset($_SESSION['transactions'][$transaction_id]) ;
			return array('success'=>false) ;
		}
		$arr_saisie['qweb_id'] = $arr['qweb_id'] ;
		$arr_saisie['qweb_name'] = $arr['qweb_name'] ;
		$arr_saisie['target_resource_qweb'] = $arr['target_resource_qweb'] ;
		paracrm_queries_qwebTransaction_loadFields( $arr_saisie , $arr_saisie['qweb_id'] ) ;
	}
	else
	{
		$transaction_id = $post_data['_transaction_id'] ;
		unset($_SESSION['transactions'][$transaction_id]) ;
		return array('success'=>false) ;
	}
	


	return array('success'=>true,
					'_mirror'=>$post_data,
					'qweb_id'=>$arr_saisie['qweb_id'],
					'qweb_name'=>$arr_saisie['qweb_name'],
					'transaction_id'=>$post_data['_transaction_id'],
					'qweb_target_resource' => $arr_saisie['target_resource_qweb'],
					'qweb_qwherefields' => $arr_saisie['fields_qwhere']
					) ;
}
function paracrm_queries_qwebTransaction_submit( $post_data , &$arr_saisie )
{
	global $_opDB ;
	
	$map_client2server = array() ;
	$map_client2server['qweb_target_resource'] = 'target_resource_qweb' ;
	$map_client2server['qweb_qwherefields'] = 'fields_qwhere' ;
	
	if( !$post_data['_qsimple'] ) {
		// controle des champs obligatoires
		foreach( $map_client2server as $mkey_client => $mkey_local ) {
			if( !isset($post_data[$mkey_client]) ) {
				return array('success'=>false) ;
			}
		}
	}
	
	foreach( $map_client2server as $mkey_client => $mkey_local ) {
		if( !isset($post_data[$mkey_client]) ) {
			continue ;
		}
		if( $mkey_client == 'qweb_target_resource' ) {
			// Valeur non JSON !
			$arr_saisie['target_resource_qweb'] = $post_data['qweb_target_resource'] ;
			continue ;
		}
		$arr_saisie[$mkey_local] = json_decode($post_data[$mkey_client],TRUE) ;
	}

	return array('success'=>true) ;
}
function paracrm_queries_qwebTransaction_save( $post_data , &$arr_saisie )
{
	global $_opDB ;
	
	return array('success',false) ;
	
	/*
	if( $post_data['_subaction'] == 'save' )
	{
		if( !$arr_saisie['qweb_id'] )
			return array('success'=>false) ;
		
		return paracrm_queries_qwebTransaction_saveFields( $arr_saisie, $arr_saisie['qweb_id'] ) ;
	}

	if( $post_data['_subaction'] == 'saveas' )
	{
		$arr_ins = array() ;
		$arr_ins['qweb_name'] = $post_data['qweb_name'] ;
		$arr_ins['target_resource_qweb'] = $arr_saisie['target_resource_qweb'] ;
		$_opDB->insert('qweb',$arr_ins) ;
		
		$arr_saisie['qweb_id'] = $_opDB->insert_id() ;
		
		return paracrm_queries_qwebTransaction_saveFields( $arr_saisie, $arr_saisie['qweb_id'] ) ;
	}
	
	
	if( $post_data['_subaction'] == 'delete' )
	{
		if( !$arr_saisie['qweb_id'] )
			return array('success'=>false) ;
		
		$tables = array() ;
		$tables[] = 'qweb' ;
		$tables[] = 'qweb_field_qwhere' ;
		foreach( $tables as $dbtab )
		{
			$query = "DELETE FROM $dbtab WHERE qweb_id='{$arr_saisie['qweb_id']}'" ;
			$_opDB->query($query) ;
		}
		
		$transaction_id = $post_data['_transaction_id'] ;
		unset($_SESSION['transactions'][$transaction_id]) ;
		
		return array('success'=>true) ;
	}
	*/
}
function paracrm_queries_qwebTransaction_togglePublish( $post_data , &$arr_saisie )
{
	global $_opDB ;

	$qweb_id = $arr_saisie['qweb_id'] ;
	$is_published = ($post_data['isPublished']=='true')?true:false ;
	
	$query = "DELETE FROM input_query_src WHERE target_qweb_id='$qweb_id'" ;
	$_opDB->query($query) ;
	
	if( $is_published ) {
		$arr_ins = array() ;
		$arr_ins['target_qweb_id'] = $qweb_id ;
		$_opDB->insert('input_query_src',$arr_ins) ;
	}

	return array('success'=>true) ;
}


function paracrm_queries_qwebTransaction_runQuery( $post_data, &$arr_saisie )
{
	usleep(500000) ;
	
	
	$RES = paracrm_queries_process_qweb($arr_saisie , (isset($post_data['_debug'])&&$post_data['_debug']==TRUE)?true:false ) ;
	if( !$RES )
		return array('success'=>false,'query_status'=>'NOK') ;
		
	$transaction_id = $post_data['_transaction_id'] ;
	if( !is_array($_SESSION['transactions'][$transaction_id]['arr_RES']) )
		return array('success'=>false,'query_status'=>'NO_RES') ;
	
	$new_RES_key = count($_SESSION['transactions'][$transaction_id]['arr_RES']) + 1 ;
	$_SESSION['transactions'][$transaction_id]['arr_RES'][$new_RES_key] = $RES ;
	
	
	return array('success'=>true,'query_status'=>'OK','RES_id'=>$new_RES_key) ;
}


function paracrm_queries_qwebTransaction_resGet( $post_data )
{
	$transaction_id = $post_data['_transaction_id'] ;
	$RES = $_SESSION['transactions'][$transaction_id]['arr_RES'][$post_data['RES_id']] ;
	
	if( is_array($RES['RES_html']) ) {
		$tabs = array() ;
		foreach( $RES['RES_labels'] as $tab_id => $dummy )
		{
			$tab = array() ;
			$tab['tab_title'] = $dummy['tab_title'] ;
			$tabs[$tab_id] = $tab + array('html'=>$RES['RES_html'][$tab_id]) ;
			
			if( !$tabs[$tab_id]['html'] ) {
				unset($tabs[$tab_id]) ;
			}
		}
		return array('success'=>true,'tabs'=>array_values($tabs)) ;
	} else {
		return array('success'=>true,'html'=>$RES['RES_html']) ;
	}
}


function paracrm_queries_qwebTransaction_loadFields( &$arr_saisie , $qweb_id )
{
	global $_opDB ;

	$arr_saisie['fields_qwhere'] = array() ;
	$query = "SELECT * FROM qweb_field_qwhere WHERE qweb_id='$qweb_id' ORDER BY qweb_fieldqwhere_ssid" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		unset($arr['qweb_id']) ;
		unset($arr['qweb_fieldqwhere_ssid']) ;
		/*
		foreach( array('condition_date_lt','condition_date_gt') as $mkey ) {
			if( $arr[$mkey] == '0000-00-00' ) {
				$arr[$mkey]='' ;
			}
		}
		*/
		$arr_saisie['fields_qwhere'][] = $arr ;
	}
	
	return ;
}





function paracrm_queries_process_qweb($arr_saisie, $debug=FALSE)
{
	global $_opDB ;
	global $app_root, $server_root ;
	
	$resource_path = $app_root."/resources/server/qweb/".$arr_saisie['target_resource_qweb'] ;
	if( !is_file($resource_path) ) {
		return NULL ;
	}
	$_QWEB_QWHERE = array() ;
	foreach( $arr_saisie['fields_qwhere'] as $field_qwhere ) {
		if( !$field_qwhere['target_resource_qweb_key'] ) {
			continue ;
		}
		$QKEY = $field_qwhere['target_resource_qweb_key'] ;
		$_QWEB_QWHERE[$QKEY] = $field_qwhere ;
	}
	
	// ******* EXECUTION REQUETE *********
	// -- input : $_QWEB_QWHERE
	include($resource_path) ;
	// -- output : $_QWEB_HTML or $_QWEB_TABS_HTML
	// ***********************************
	
	if( $_QWEB_TABS_HTML ) {
		$RES = array() ;
		$RES['RES_labels'] = array() ;
		$RES['RES_html'] = array() ;
		foreach( $_QWEB_TABS_HTML as $tab_title => $html ) {
			$RES['RES_labels'][] = array('tab_title'=>$tab_title) ;
			$RES['RES_html'][] = $html ;
		}
		return $RES ;
	} elseif( $_QWEB_HTML ) {
		return array('RES_html'=>$_QWEB_HTML) ;
	} else {
		return NULL ;
	}
}


function paracrm_queries_qweb_getQresultObjs( $q_type, $q_id, $arr_where_conditions, $img_options=array('width'=>800,'height'=>220) ) {
	global $_opDB ;
	
	switch( $q_type ) {
		case 'query' :
		if( !is_numeric($q_id) ) {
			$query = "SELECT query_id FROM query WHERE query_name LIKE '{$q_id}'";
			$q_id = $_opDB->query_uniqueValue($query) ;
			if( !$q_id ) {
				return NULL ;
			}
		}
		
		$arr_saisie = array() ;
		paracrm_queries_builderTransaction_init( array('query_id'=>$q_id) , $arr_saisie ) ;
		
		if( $arr_where_conditions ) {
			foreach( $arr_where_conditions as $query_targetfield_ssid => $condition ) {
				$query_fieldwhere_idx = $query_targetfield_ssid - 1 ;
				foreach( $condition as $mkey => $mvalue ) {
					if( strpos($mkey,'condition_') === 0 ) {
						$arr_saisie['fields_where'][$query_fieldwhere_idx][$mkey] = $mvalue ;
					}
				}
			}
		}
		
		$RES = paracrm_queries_process_query($arr_saisie , FALSE ) ;
		
		$tabs = array() ;
		foreach( $RES['RES_labels'] as $tab_id => $dummy )
		{
			$tab = array() ;
			$tab['tab_title'] = $dummy['tab_title'] ;
			$tabs[$tab_id] = $tab + paracrm_queries_paginate_getGrid( $RES, $tab_id ) ;
			
			if( !$tabs[$tab_id]['data'] ) {
				unset($tabs[$tab_id]) ;
			}
		}
		break ;
		
		
		
		case 'qmerge' :
		if( !is_numeric($q_id) ) {
			$query = "SELECT qmerge_id FROM qmerge WHERE qmerge_name LIKE '{$q_id}'";
			$q_id = $_opDB->query_uniqueValue($query) ;
			if( !$q_id ) {
				return NULL ;
			}
		}
		
		$arr_saisie = array() ;
		paracrm_queries_mergerTransaction_init( array('qmerge_id'=>$q_id) , $arr_saisie ) ;
		
		if( $arr_where_conditions ) {
			foreach( $arr_where_conditions as $query_targetfield_ssid => $condition ) {
				$qmerge_fieldmwhere_idx = $query_targetfield_ssid - 1 ;
				foreach( $condition as $mkey => $mvalue ) {
					if( strpos($mkey,'condition_') === 0 ) {
						$arr_saisie['fields_mwhere'][$qmerge_fieldmwhere_idx][$mkey] = $mvalue ;
					}
				}
			}
		}
		
		$RES = paracrm_queries_process_qmerge($arr_saisie , FALSE ) ;
		
		if( $post_data['xls_export'] == 'true' ) {
			return paracrm_android_query_fetchResultXls( $RES, $arrQuery['querysrc_type'] );
		}
		
		$tabs = array() ;
		foreach( $RES['RES_labels'] as $tab_id => $dummy )
		{
			$tab = array() ;
			$tab['tab_title'] = $dummy['tab_title'] ;
			$tabs[$tab_id] = $tab + paracrm_queries_mpaginate_getGrid( $RES, $tab_id ) ;
			
			if( !$tabs[$tab_id]['data'] ) {
				unset($tabs[$tab_id]) ;
			}
		}
		break ;
	}
	
	if( !$tabs ) {
		return NULL ;
	}
	
	$objs = array() ;
	foreach( $tabs as $tab ) {
		$obj = array() ;
		$obj['type'] = 'table' ;
		$obj['title'] = $tab['tab_title'] ;
		$obj['table_html'] = paracrm_queries_qweb_makeTable( $tab['columns'], $tab['data'] ) ;
		$objs[] = $obj ;
	}
	if( !($arr_QueryResultChartModel = paracrm_queries_charts_cfgLoad($q_type,$q_id)) ) {
		return $objs ;
	}
	foreach( $arr_QueryResultChartModel as $queryResultChartModel ) {
		if( !($binary = paracrm_queries_qweb_makeImgChart($RES, $queryResultChartModel, $img_options)) ) {
			continue ;
		}
		
		$obj = array() ;
		$obj['type'] = 'chart' ;
		$obj['title'] = $queryResultChartModel['chart_name'] ;
		$obj['img_base64'] = base64_encode( $binary ) ;
		$objs[] = $obj ;
	}
	return $objs ;
}
function paracrm_queries_qweb_makeTable($columns,$data) {
	$buffer = '' ;
	
	$buffer.= '<table>' ;
	
	$buffer.= '<thead>' ;
		$buffer.= '<tr>' ;
		foreach( $columns as $column ) {
			if( $column['invisible'] ) {
				continue ;
			}
			
			if( $column['is_bold'] ) {
				$tag='th' ;
			} else {
				$tag='td' ;
			}
			$buffer.= "<{$tag}>" ;
			$buffer.= $column['text'] ;
			$buffer.= "</{$tag}>" ;
		}
		$buffer.= '</tr>' ;
	$buffer.= '</thead>' ;
	
	$buffer.= '<tbody>' ;
	foreach( $data as $row_id => $row_data ) {
		$buffer.= '<tr>' ;
		foreach( $columns as $column ) {
			if( $column['invisible'] ) {
				continue ;
			}
			
			$dataIndex = $column['dataIndex'] ;
			if( $column['is_bold'] ) {
				$tag='th' ;
			} else {
				$tag='td' ;
			}
			$buffer.= "<{$tag}>" ;
			$buffer.= $row_data[$dataIndex] ;
			$buffer.= "</{$tag}>" ;
		}
		$buffer.= '</tr>' ;
	}
	$buffer.= '</tbody>' ;
	
	$buffer.= '</table>' ;
	
	return $buffer ;
}
function paracrm_queries_qweb_makeImgChart(&$RES, $queryResultChartModel, $img_options) {
	if( is_dir($pchart_root = $GLOBALS['app_root']."/resources/pChart") ) {
		include_once("$pchart_root/class/pData.class.php");
		include_once("$pchart_root/class/pDraw.class.php");
		include_once("$pchart_root/class/pPie.class.php");
		include_once("$pchart_root/class/pImage.class.php");
	};
	if( !class_exists('pData') ) {
		return NULL ;
	}
	
	if( !($RES_chart = paracrm_queries_charts_getResChart($RES, $queryResultChartModel)) ) {
		return NULL ;
	}
	
	$series = array() ;
	$myPalette = array() ;
	foreach( $RES_chart['stepsSerieValue'] as $ttmp ) {
		foreach( $ttmp as $serie_idx => $point_value ) {
			if( !isset($series[$serie_idx]) ) {
				$series[$serie_idx] = array() ;
			}
			$series[$serie_idx][] = $point_value ;
			
			$myPalette[] = array("R"=>$r,"G"=>$g,"B"=>$b,"Alpha"=>100) ;
		}
	}
	$series_title = array() ;
	foreach( $RES_chart['seriesTitle'] as $ttmp ) {
		$series_title[] = implode($ttmp) ;
	}
	
	$iteration_points = array() ;
	foreach( $RES_chart['stepsLabel'] as $ttmp ) {
		$iteration_points[] = implode(' ',$ttmp) ;
	}
	$iteration_title = implode(' ',$RES_chart['iterationTitle']) ;
	
	if( $do_swap = in_array($queryResultChartModel['chart_type'],array('pieswap')) ) {
		$new_series = array() ;
		foreach( $series as $serie_idx => $serie ) {
			foreach( $serie as $iteration_idx => $value ) {
				if( !isset($new_series[$iteration_idx]) ) {
					$new_series[$iteration_idx] = array() ;
				}
				$new_series[$iteration_idx][] = $value ;
			}
		}
		$new_iteration_points = $series_title ;
		$new_series_title = $iteration_points ;
		
		$series = $new_series ;
		$iteration_points = $new_iteration_points ;
		$series_title = $new_series_title ;
	}
	
	
	
	$img_width = $img_options['width'] ;
	$img_height = $img_options['height'] ;

	
	$MyData = new pData();
	foreach( $series as $serie_idx => $serie_points ) {
		$MyData->addPoints($serie_points,$series_title[$serie_idx]);
		
		$hex_color = $RES_chart['seriesColor'][$serie_idx] ;
		$hex = str_replace("#", "", $hex_color);
		$r = hexdec(substr($hex,0,2));
		$g = hexdec(substr($hex,2,2));
		$b = hexdec(substr($hex,4,2));
		$MyData->setPalette($series_title[$serie_idx],array("R"=>$r,"G"=>$g,"B"=>$b));
	}
	//$MyData->setAxisName(0,"Hits");
	$MyData->addPoints($iteration_points,"name");
	$MyData->setSerieDescription("name",$iteration_title);
	$MyData->setAbscissa("name");
	
	$myPicture = new pImage($img_width,$img_height,$MyData,TRUE);
	$myPicture->setFontProperties(array("FontName"=>"$pchart_root/fonts/verdana.ttf","FontSize"=>8,"R"=>0,"G"=>0,"B"=>0));
	
	switch( $queryResultChartModel['chart_type'] ) {
		case 'areastacked' :
		case 'bar' :
		case 'line' :
			if( $queryResultChartModel['chart_type'] == 'areastacked' ) {
				$PCHART_scale_mode = SCALE_MODE_ADDALL_START0 ;
			} else {
				$PCHART_scale_mode = SCALE_MODE_START0 ;
			}
			$width_minus = ($img_options['legend'] ? 200 : 60) ;
			$myPicture->setGraphArea(50,10,$img_width - $width_minus,$img_height - 20 );
			$myPicture->drawScale(array("Mode"=>$PCHART_scale_mode,"GridR"=>200,"GridG"=>200,"GridB"=>200,"DrawSubTicks"=>TRUE,"CycleBackground"=>TRUE));
			//$myPicture->setShadow(TRUE,array("X"=>1,"Y"=>1,"R"=>0,"G"=>0,"B"=>0,"Alpha"=>10));
			
			switch( $queryResultChartModel['chart_type'] ) {
				case 'areastacked' :
					$myPicture->drawStackedAreaChart(array("DisplayValues"=>TRUE,"DisplayColor"=>DISPLAY_AUTO,"Surrounding"=>20));
					break ;
				case 'bar' :
					$myPicture->drawBarChart(array("DisplayPos"=>LABEL_POS_OUTSIDE,"DisplayValues"=>TRUE,"Rounded"=>TRUE,"Surrounding"=>30));
					break ;
				case 'line' :
					$myPicture->drawLineChart(array("DisplayValues"=>TRUE,"DisplayColor"=>DISPLAY_AUTO));
					break ;
				default :
					break ;
			}
			if( $img_options['legend'] ) {
				$myPicture->drawLegend($img_width - 130,12,array("Style"=>LEGEND_NOBORDER,"Mode"=>LEGEND_VERTICAL)); 
			}
			break ;
		
		case 'pie' :
		case 'pieswap' :
			// Split IMG width for x-Pies + legend
			$t_nbPies = count($series) ;
			$t_availableWidth = $img_width ; 
			if( $img_options['legend'] ) {
				$t_availableWidth -= 130 ; 
			}
			$t_widthPerPie = $t_availableWidth / $t_nbPies ;
			
			$t_radius = ( min($t_widthPerPie,$img_height) - 5 ) / 2 ;
			
			$w_cursor = $t_radius ;
			$h_cursor = $img_height / 2 ;
			foreach( $series as $serie_idx => $serie ) {
				$MyDataPie = new pData();
				$MyDataPie->addPoints($serie,$series_title[$serie_idx]);
				$MyDataPie->addPoints($iteration_points,"name");
				$MyDataPie->setSerieDescription("name",$iteration_title);
				$MyDataPie->setAbscissa("name");
				
				
				/* Create the pPie object */ 
				$PieChart = new pPie($myPicture,$MyDataPie);
				if( $do_swap && count($RES_chart['seriesColor'])==count($serie) ) {
					foreach( $RES_chart['seriesColor'] as $idx=>$hex_color ) {
						$hex = str_replace("#", "", $hex_color);
						$r = hexdec(substr($hex,0,2));
						$g = hexdec(substr($hex,2,2));
						$b = hexdec(substr($hex,4,2));
						$PieChart->setSliceColor($idx,array("R"=>$r,"G"=>$g,"B"=>$b));
					}
				}
				$PieChart->draw2DPie($w_cursor,$h_cursor,array("WriteValues"=>TRUE,"Border"=>TRUE,"Radius"=>$t_radius));
				
				if( $img_options['legend'] ) {
					$myPicture->setFontProperties(array("FontName"=>"$pchart_root/fonts/verdana.ttf","FontSize"=>12,"R"=>0,"G"=>0,"B"=>0));
					$myPicture->drawText($w_cursor,$img_height-5,$series_title[$serie_idx], array("Align"=>TEXT_ALIGN_BOTTOMMIDDLE)) ;
 				}
				
				$w_cursor += $t_widthPerPie ;
			}
			if( $img_options['legend'] ) {
				$myPicture->setFontProperties(array("FontName"=>"$pchart_root/fonts/verdana.ttf","FontSize"=>10,"R"=>0,"G"=>0,"B"=>0));
				$PieChart->drawPieLegend($img_width - 130,12,array("Style"=>LEGEND_NOBORDER,"Mode"=>LEGEND_VERTICAL));
			}
			
			break ;
	
		default :
			return NULL ;
	}
	
	
	$tmpfname = tempnam( sys_get_temp_dir(), "FOO");
	$myPicture->render($tmpfname);
	$buffer = file_get_contents($tmpfname) ;
	unlink($tmpfname) ;
	
	return $buffer ;
}


?>