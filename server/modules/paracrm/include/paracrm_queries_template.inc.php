<?php

function paracrm_queries_template_makeTable($columns,$data) {
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
function paracrm_queries_template_makeImgChart(&$RES, $queryResultChartModel, $img_options) {
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
	
	$series_axis = $RES_chart['seriesAxis'] ;
	$series_type = $RES_chart['seriesType'] ;
	
	$iteration_points = array() ;
	foreach( $RES_chart['stepsLabel'] as $ttmp ) {
		$iteration_points[] = implode(' ',$ttmp) ;
	}
	$iteration_title = implode(' ',$RES_chart['iterationTitle']) ;
	
	// Pie/PieSwap / Grid ? 
	$t_types = array_values(array_unique($series_type)) ;
	$graph_mode = NULL ;
	if( count(array_intersect($t_types, array('pie','pieswap'))) > 0 ) {
		if( count($t_types) == 1 ) {
			$graph_mode = current($t_types) ; // pie / pieswap
		} else {
			return NULL ; // error
		}
	} else {
		$graph_mode = 'grid' ;
		if( in_array('areastacked',$t_types) ) {
			$graph_mode = 'grid_areastacked' ;
		}
	}
	
	if( $do_swap = ($graph_mode=='pieswap') ) {
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
		
		switch( $series_axis[$serie_idx] ) {
			case 'left' :
				$graph_hasLeft = TRUE ; 
				$MyData->setSerieOnAxis($series_title[$serie_idx],0);
				break ;
				
			case 'right' :
				$graph_hasRight = TRUE ; 
				$MyData->setSerieOnAxis($series_title[$serie_idx],1);
				break ;
		}
		
		$hex_color = $RES_chart['seriesColor'][$serie_idx] ;
		$hex = str_replace("#", "", $hex_color);
		$r = hexdec(substr($hex,0,2));
		$g = hexdec(substr($hex,2,2));
		$b = hexdec(substr($hex,4,2));
		$MyData->setPalette($series_title[$serie_idx],array("R"=>$r,"G"=>$g,"B"=>$b));
	}
	if( $graph_hasLeft ) {
		$MyData->setAxisPosition(1,AXIS_POSITION_LEFT);
	}
	if( $graph_hasRight ) {
		$MyData->setAxisPosition(1,AXIS_POSITION_RIGHT);
	}
	
	//$MyData->setAxisName(0,"Hits");
	$MyData->addPoints($iteration_points,"name");
	$MyData->setSerieDescription("name",$iteration_title);
	$MyData->setAbscissa("name");
	
	$myPicture = new pImage($img_width,$img_height,$MyData,TRUE);
	$myPicture->setFontProperties(array("FontName"=>"$pchart_root/fonts/verdana.ttf","FontSize"=>8,"R"=>0,"G"=>0,"B"=>0));
	
	switch( $graph_mode ) {
		case 'grid' :
		case 'grid_areastacked' :
			if( $graph_mode == 'grid_areastacked' ) {
				$PCHART_scale_mode = SCALE_MODE_ADDALL_START0 ;
			} else {
				$PCHART_scale_mode = SCALE_MODE_START0 ;
			}
			$width_minus = ($img_options['legend'] ? 200 : 60) ;
			$myPicture->setGraphArea(50,10,$img_width - $width_minus,$img_height - 20 );
			$myPicture->drawScale(array("Mode"=>$PCHART_scale_mode,"GridR"=>200,"GridG"=>200,"GridB"=>200,"DrawSubTicks"=>TRUE,"CycleBackground"=>TRUE));
			//$myPicture->setShadow(TRUE,array("X"=>1,"Y"=>1,"R"=>0,"G"=>0,"B"=>0,"Alpha"=>10));
			
			foreach( array('areastacked','bar','line') as $chart_type ) {
				if( !in_array($chart_type,$series_type) ) {
					continue ;
				}
				
				foreach( $series_type as $serie_idx => $serie_type ) {
					$MyData->setSerieDrawable($series_title[$serie_idx],($serie_type==$chart_type));
				}
				switch( $chart_type ) {
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
				foreach( $series_type as $serie_idx => $serie_type ) {
					$MyData->setSerieDrawable($series_title[$serie_idx],TRUE);
				}
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