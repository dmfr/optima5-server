<?php
ob_start() ;
while( true ) {
$_IMG = array() ;

$mag_code = $_QWEB_QWHERE['POM_STORE']['condition_bible_entries'] ;
if( !$mag_code ) {
	unset($_QWEB_HTML) ;
	break ;
}
$alt_mag_code = $_QWEB_QWHERE['POM_STORE_REF']['condition_bible_entries'] ;

$enseigne = substr($mag_code,0,5) ;

$query = "SELECT field_STORENAME FROM view_bible_STORE_entry WHERE entry_key='$mag_code'" ;
$mag_name = $_opDB->query_uniqueValue($query) ;

// Groupe du magasin concerné ?
$query_groupclass = "SELECT field_VCA_GROUP FROM view_file_VCAPOM WHERE view_file_VCAPOM.field_VCA_STORE ='$mag_code'" ;
$group = $_opDB->query_uniqueValue($query) ;


$tab_data = array() ;

// Données de tous les magasins du groupe (sauf DN / Facing plus bas)
$query = "SELECT view_file_VCAPOM.* 
		, view_bible_STORE_entry.field_STORECODE
		, view_bible_STORE_entry.field_STORENAME
		FROM view_file_VCAPOM 
		JOIN view_bible_STORE_entry ON view_bible_STORE_entry.entry_key = view_file_VCAPOM.field_VCA_STORE
		WHERE ( 
			view_file_VCAPOM.field_VCA_GROUP IN ($query_groupclass)
			OR
			view_file_VCAPOM.field_VCA_STORE IN ('$mag_code','$alt_mag_code')
		)" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
	$mag = array() ;
	$mag['STORE_CODE'] = $arr['field_STORECODE'] ;
	$mag['STORE_NAME'] = str_replace('CARREFOUR ',"Carrefour\n",$arr['field_STORENAME']) ;
	$mag['VCA_RANK_ENS'] = $arr['field_VCA_RANK_ENS'] ;
	$mag['VCA_RANK_POM'] = $arr['field_VCA_RANK_POM'] ;
	$mag['POM_COOLIO'] = $arr['field_POM_COOLIO'] ;
	$mag['POM_QTE_TOT'] = (int)$arr['field_POM_QTE_TOT'] ;
	$mag['POM_DN'] = 0 ;
	$mag['POM_FACING'] = 0 ;
	
	$tab_data[$mag['STORE_CODE']] = $mag ;
}

$mags = array_keys($tab_data) ;


?>
<?php

// Requete DN
$arr_query = array() ;
paracrm_queries_builderTransaction_init( array('is_new'=>true,'target_file_code'=>'VISIT_1COUNT') , $arr_query ) ;
$arr_query = array(
	'fields_where'=>array(
		array(
			'field_code' => 'VISIT_field_VSTORE',
			'field_type' => 'link',
			'field_linkbible' => 'STORE',
			'condition_bible_mode' => 'SINGLE'
		),
		array(
			'field_code' => 'VISIT_field_VSTORE',
			'field_type' => 'link',
			'field_linkbible' => 'STORE',
			'condition_bible_mode' => 'SELECT',
			'condition_bible_entries' => json_encode($mags)
		),
		array(
			'field_code' => 'VISIT_1COUNT_field_PRODCODE',
			'field_type' => 'link',
			'field_linkbible' => 'PRODCOM',
			'condition_bible_mode' => 'SELECT',
			'condition_bible_treenodes' => '["POM"]'
		)
	),
	'fields_group'=>array(
		array(
			'field_code' => 'VISIT_field_VSTORE',
			'field_type' => 'link',
			'field_linkbible' => 'STORE',
			'display_geometry' => 'grid-y',
			'group_bible_type' => 'ENTRY',
			//[group_bible_tree_depth] => 2
			'group_bible_display_treenode' => '[]',
			'group_bible_display_entry' => '[]'
			//[group_date_type] => 		
		)
	),
	'fields_select'=>array(
		array(
			'select_lib' => 'DN',
			'math_func_mode' => NULL,
			'math_func_group' => 'AVG',
			'math_round' => 0,
			'math_expression' => array(
				array(
					'sequence' => 0,
					'math_operation' => NULL,
					'math_parenthese_in' => NULL,
					'math_fieldoperand' => 'VISIT_1COUNT',
					'math_parenthese_out' => NULL
				),
				array(
					'sequence' => 0,
					'math_operation' => '/',
					'math_parenthese_in' => NULL,
					'math_fieldoperand' => 'VISIT_1COUNT_field_PRODCODE',
					'math_parenthese_out' => NULL
				),
				array(
					'sequence' => 0,
					'math_operation' => '*',
					'math_parenthese_in' => NULL,
					'math_fieldoperand' => NULL,
					'math_staticvalue' => 100,
					'math_parenthese_out' => NULL
				)
			)
		)
	),
	'fields_progress'=>array()
) + $arr_query ;


$arr_query_DN = array(
	'fields_select'=>array(
		array(
			'select_lib' => 'DN',
			'math_func_mode' => NULL,
			'math_func_group' => 'AVG',
			'math_round' => 0,
			'math_expression' => array(
				array(
					'sequence' => 0,
					'math_operation' => NULL,
					'math_parenthese_in' => NULL,
					'math_fieldoperand' => 'VISIT_1COUNT',
					'math_parenthese_out' => NULL
				),
				array(
					'sequence' => 0,
					'math_operation' => '/',
					'math_parenthese_in' => NULL,
					'math_fieldoperand' => 'VISIT_1COUNT_field_PRODCODE',
					'math_parenthese_out' => NULL
				),
				array(
					'sequence' => 0,
					'math_operation' => '*',
					'math_parenthese_in' => NULL,
					'math_fieldoperand' => NULL,
					'math_staticvalue' => 100,
					'math_parenthese_out' => NULL
				)
			)
		)
	)
) + $arr_query ;
$RES_DN = paracrm_queries_process_query($arr_query_DN , FALSE ) ;
foreach( $RES_DN['RES_groupKey_groupDesc'] as $id => $group_keys ) {
	$tmag_code = $group_keys[0] ;
	$DN = $RES_DN['RES_groupKey_value'][$id] ;
	
	$tab_data[$tmag_code]['POM_DN'] = $DN ;
}


$arr_query_Facing = array(
	'fields_select'=>array(
		array(
			'select_lib' => 'Facing',
			'math_func_mode' => NULL,
			'math_func_group' => 'SUM',
			'math_round' => 0,
			'math_expression' => array(
				array(
					'sequence' => 0,
					'math_operation' => NULL,
					'math_parenthese_in' => NULL,
					'math_fieldoperand' => 'VISIT_1COUNT_field_FACING',
					'math_parenthese_out' => NULL
				)
			)
		)
	)
) + $arr_query ;
$RES_Facing = paracrm_queries_process_query($arr_query_Facing , FALSE ) ;
foreach( $RES_Facing['RES_groupKey_groupDesc'] as $id => $group_keys ) {
	$tmag_code = $group_keys[0] ;
	$FACING = $RES_Facing['RES_groupKey_value'][$id] ;
	
	$tab_data[$tmag_code]['POM_FACING'] = $FACING ;
}

 
$_IMG['banner_POM'] = file_get_contents($app_root."/resources/server/templates/banner_POM.png") ;
$_IMG['logo_POM'] = file_get_contents($app_root."/resources/server/templates/logo_POM.png") ;

$data_mag = $tab_data[$mag_code] ;
if( $alt_mag_code ) {
	$compare_mag_code = $alt_mag_code ;
} else {
	foreach( $tab_data as $test_mag_code => $test_mag_alt ) {
		if( $test_mag_alt['POM_QTE_TOT'] > $data_mag['POM_QTE_TOT'] 
			&& $test_mag_alt['POM_QTE_TOT'] > $data_mag_alt['POM_QTE_TOT']
			&& $test_mag_alt['POM_FACING'] > $data_mag['POM_FACING'] ) {
			$compare_mag_code = $test_mag_code ;
		}
	}
}

// Choix des magasins à afficher
$arr_alt_mag_code = array() ;
if( $alt_mag_code ) {
	$arr_alt_mag_code[] = $alt_mag_code ;
} else {
	foreach( $tab_data as $test_mag_code => $test_mag_alt ) {
		if( $test_mag_code == $mag_code ) {
			continue ;
		}
		$arr_alt_mag_code[] = $test_mag_code ;
	}
}
 
?>
<?php
 /* pChart library inclusions */
 $pchart_root = $app_root."/resources/pChart" ;
 include("$pchart_root/class/pData.class.php");
 include("$pchart_root/class/pDraw.class.php");
 include("$pchart_root/class/pPie.class.php");
 include("$pchart_root/class/pImage.class.php");
 
 $Palette = array("0"=>array("R"=>155,"G"=>10,"B"=>58,"Alpha"=>100),
                 "1"=>array("R"=>224,"G"=>100,"B"=>46,"Alpha"=>100));
 
 foreach( $arr_alt_mag_code as $alt_mag_code ) {
 
	$data_mag_alt = $tab_data[$alt_mag_code] ;
 
	$MyData = new pData();
	$MyData->addPoints(array($data_mag['POM_FACING'],$data_mag_alt['POM_FACING']),"Facing");
	$MyData->setSerieOnAxis("Facing",0);
	$MyData->setAxisName(0,"Facing");
	$MyData->setAxisPosition(1,AXIS_POSITION_RIGHT);
	
	$MyData->addPoints(array($data_mag['STORE_NAME'],$data_mag_alt['STORE_NAME']),"Mags");
	$MyData->setAbscissa("Mags");
	
	$myPicture = new pImage(250,300,$MyData,TRUE);
	$myPicture->setFontProperties(array("FontName"=>"$pchart_root/fonts/verdana.ttf","FontSize"=>8,"R"=>0,"G"=>0,"B"=>0));
	
	$myPicture->setGraphArea(50,10,250,260);
	$myPicture->drawScale(array("Mode"=>SCALE_MODE_START0));
	//$myPicture->setShadow(TRUE,array("X"=>1,"Y"=>1,"R"=>0,"G"=>0,"B"=>0,"Alpha"=>10));
	
	$myPicture->drawBarChart(array("DisplayPos"=>LABEL_POS_OUTSIDE,"DisplayValues"=>TRUE,"Rounded"=>TRUE,"Surrounding"=>30,"OverrideColors"=>$Palette));
	$tmpfname = tempnam( sys_get_temp_dir(), "FOO");

	$myPicture->render($tmpfname);
	
	$_IMG[$alt_mag_code]['barchart_POM_FACING'] = file_get_contents($tmpfname) ;
	unlink($tmpfname) ;
	
	
	
	$MyData = new pData();
	$MyData->addPoints(array($data_mag['POM_QTE_TOT'],$data_mag_alt['POM_QTE_TOT']),"Qte");
	$MyData->setSerieOnAxis("Qte",0);
	$MyData->setAxisName(0,"Qte Totale POM (**)");
	
	$MyData->addPoints(array($data_mag['STORE_NAME'],$data_mag_alt['STORE_NAME']),"Mags");
	$MyData->setAbscissa("Mags");
	
	$myPicture = new pImage(250,300,$MyData,TRUE);
	$myPicture->setFontProperties(array("FontName"=>"$pchart_root/fonts/verdana.ttf","FontSize"=>8,"R"=>0,"G"=>0,"B"=>0));
	
	$myPicture->setGraphArea(50,10,250,260);
	$myPicture->drawScale(array("Mode"=>SCALE_MODE_START0));
	//$myPicture->setShadow(TRUE,array("X"=>1,"Y"=>1,"R"=>0,"G"=>0,"B"=>0,"Alpha"=>10));
	
	$myPicture->drawBarChart(array("DisplayPos"=>LABEL_POS_OUTSIDE,"DisplayValues"=>TRUE,"Rounded"=>TRUE,"OverrideColors"=>$Palette));
	$tmpfname = tempnam( sys_get_temp_dir(), "FOO");

	$myPicture->render($tmpfname);
	
	$_IMG[$alt_mag_code]['barchart_POM_QTE'] = file_get_contents($tmpfname) ;
	unlink($tmpfname) ;
	
 }
?>
<?php
ob_end_clean() ;
ob_start() ;
?>
<html>
<head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
</head>
	<script>
	function setMagVisibility( selector ) {
		var options = selector.options,
			magId ;
		for( var i=0 ; i<options.length ; i++ ) {
			magId = options[i].value ;
			document.getElementById( 'data_mag_'+magId ).style.display = ( options[i].selected ? '' : 'none' ) ;
			document.getElementById( 'img_mag_'+magId ).style.display = ( options[i].selected ? '' : 'none' ) ;
		}
	}
	</script>
	<style type="text/css">
		body {  font-family: Arial, Helvetica, sans-serif; font-size:smaller ;  margin:4px; display:block }
		.text-big {
			font-family: Verdana, Geneva, Arial, Helvetica, sans-serif;
			font-size: 24pt;
			/*color: navy;*/
			padding-top: 12px;
			padding-bottom: 3px;
		}
		.text-med {
			font-family: Verdana, Geneva, Arial, Helvetica, sans-serif;
			font-size: 16pt;
			/*color: navy;*/
			padding-top: 12px;
			padding-bottom: 3px;
		}
		.text-small {
			font-family: Verdana, Geneva, Arial, Helvetica, sans-serif;
			font-size: 12pt;
			/*color: navy;*/
			padding-top: 12px;
			padding-bottom: 3px;
		}
		.text-xsmall {
			font-family: Verdana, Geneva, Arial, Helvetica, sans-serif;
			font-size: 8pt;
			/*color: navy;*/
			padding-top: 12px;
			padding-bottom: 3px;
		}
		.select-med {
			font-family: Verdana, Geneva, Arial, Helvetica, sans-serif;
			font-size: 14pt;
			/*color: navy;*/
			padding-top: 3px;
			padding-bottom: 3px;
		}
	</style>
	<body style='background-color:#eeeeee'><div align='center'>
	<table cellpadding='0' cellspacing='0' align='center' style='background-color:#ffffff' width='800' height='600'><tr><td valign='top'>
	
		<table cellspacing='0' cellpadding='0' width='100%' style='background-color:#9D080E' height='120'><tr>
<!-- 			<td style='background-color:#ffffff' width='120'>&nbsp;</td> -->
			<td style='padding:4px ; padding-left:20px'>
				<span class='text-big' style='color:#ffffff'>Plan de vente POM</span><br>
				<span class='text-big' style='color:#ffffff'><?php echo $mag_name; ?></span><br>
			</td>
			<td align='right' valign='bottom' style='padding-right:25px'><img src="data:image/jpeg;base64,<?echo base64_encode($_IMG['banner_POM']);?>" />
		</tr></table>
		
		<br>
		
		<?php
		if( count($arr_alt_mag_code) > 0 ) {
			echo "<div align='right'>" ;
				echo "<select id='alt_mag_select' class='select-med' onchange='setMagVisibility(this)'>" ;
				foreach( $arr_alt_mag_code as $alt_mag_code ) {
					$sel = '' ;
					if( $alt_mag_code == $compare_mag_code ) {
						$sel = 'selected' ;
					}
				
					echo "<option $sel value='$alt_mag_code'>".$tab_data[$alt_mag_code]['STORE_NAME']."</option>" ;
				}
				echo "</select>" ;
			echo "</div>" ;
		}
		?>
		
		<table cellspacing='0' width='100%' height='120'><tr>
			<td>
				<table cellspacing='4'>
				<tr><td><span class='text-med'>DN :</span></td><td width='100' style='border: 2px solid #9D080E ; text-align:right ; padding-right:6px'><span class='text-med'><b><?php echo (int)$data_mag['POM_DN'];?></b>&nbsp;%&nbsp;</span></td></tr>
				<tr><td><span class='text-med'>Pos. POM / Ens :</span></td><td width='100' style='border: 2px solid #9D080E ; text-align:right ; padding-right:6px'><span class='text-med'><?php echo (int)$data_mag['VCA_RANK_POM'];?></span></td></tr>
				<tr><td><span class='text-med'>Pos. Mag / Ens :</span></td><td width='100' style='border: 2px solid #9D080E ; text-align:right ; padding-right:6px'><span class='text-med'><?php echo (int)$data_mag['VCA_RANK_ENS'];?></span></td></tr>
				</table>
			</td>
			<td>
			<?php
			if( $arr_alt_mag_code ) {
			foreach( $arr_alt_mag_code as $alt_mag_code ) {
				$data_mag_alt = $tab_data[$alt_mag_code] ;
				echo "<div id='data_mag_{$alt_mag_code}' style='display:none'>" ;
				?>
				<table cellspacing='4'>
				<tr><td style='text-align:right'><span class='text-small'><i>DN</i> :</span></td><td width='100' style='border: 2px solid #9D080E ; text-align:right ; padding-right:6px'><span class='text-med'><b><?php echo (int)$data_mag_alt['POM_DN'];?></b>&nbsp;%&nbsp;</span></td></tr>
				<tr><td style='text-align:right'><span class='text-small'><i>Pos. POM / Ens</i> :</span></td><td width='100' style='border: 2px solid #9D080E ; text-align:right ; padding-right:6px'><span class='text-med'><?php echo (int)$data_mag_alt['VCA_RANK_POM'];?></span></td></tr>
				<tr><td style='text-align:right'><span class='text-small'><i>Pos. Mag / Ens</i> :</span></td><td width='100' style='border: 2px solid #9D080E ; text-align:right ; padding-right:6px'><span class='text-med'><?php echo (int)$data_mag_alt['VCA_RANK_ENS'];?></span></td></tr>
				</table>
				<?php
				echo "</div>" ;
			}
			}
			?>
			</td>
		</tr></table>
		
		<br>
		<?php
		if( $arr_alt_mag_code ) {
		foreach( $arr_alt_mag_code as $alt_mag_code ) {
			echo "<div id='img_mag_{$alt_mag_code}' style='display:none'>" ;
			?>
			<table cellspacing='0' width='100%'><tr>
				<td align='center'>
					<img src="data:image/jpeg;base64,<?echo base64_encode($_IMG[$alt_mag_code]['barchart_POM_FACING']);?>" />
				</td>
				<td align='center'>
					<img src="data:image/jpeg;base64,<?echo base64_encode($_IMG[$alt_mag_code]['barchart_POM_QTE']);?>" />
				</td>
				<td align='center'>
					<img src="data:image/jpeg;base64,<?echo base64_encode($_IMG['logo_POM']);?>" />
				</td>
			</tr></table>
			<?php
			echo "</div>" ;
		}
		}
		?>
		<span class='text-xsmall' style='line-height:16px ; padding:0px 10px'>**&nbsp;<i>Les données <u>Qte Totale POM</u> sont exprimées du <b>01/07/2012</b> au <b>31/12/2012</b></i></span><br>
		
	</td></tr></table>
	</div>
	<script>
	setMagVisibility( document.getElementById('alt_mag_select') ) ;
	</script>
	</body>
</html>
<?
unset($_IMG) ;
$_QWEB_HTML = ob_get_clean() ;
break ;
}
?>
