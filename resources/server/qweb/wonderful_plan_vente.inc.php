<?php
ob_start() ;
while( true ) {
$_IMG = array() ;

$mag_code = $_QWEB_QWHERE['PLANVENTE_STORE']['condition_bible_entries'] ;
if( !$mag_code ) {
	unset($_QWEB_HTML) ;
	break ;
}

$enseigne = substr($mag_code,0,5) ;

$query = "SELECT field_STORENAME FROM view_bible_STORE_entry WHERE entry_key='$mag_code'" ;
$mag_name = $_opDB->query_uniqueValue($query) ;

$query = "select sum(view_file_VCA_PROD.field_VCA_PROD_UVC * view_bible_PRODCOM_entry.field_EQ_KG) 
			from view_file_VCA, view_file_VCA_PROD
			JOIN view_bible_PRODCOM_entry ON view_bible_PRODCOM_entry.entry_key=view_file_VCA_PROD.field_VCA_PRODCOM 
			WHERE view_file_VCA_PROD.filerecord_parent_id = view_file_VCA.filerecord_id 
			AND view_file_VCA.field_VCA_STORE ='$mag_code'" ;
$_vol_mag = $_opDB->query_uniqueValue($query) ;

$query = "select sum(view_file_VCA_PROD.field_VCA_PROD_CA)
			from view_file_VCA, view_file_VCA_PROD
			WHERE view_file_VCA_PROD.filerecord_parent_id = view_file_VCA.filerecord_id 
			AND view_file_VCA.field_VCA_STORE ='$mag_code'" ;
$_ca_mag = $_opDB->query_uniqueValue($query) ;

$query = "select field_VCA_RANK_ENS , field_VCA_RANK_WPF
			FROM view_file_VCA
			WHERE view_file_VCA.field_VCA_STORE ='$mag_code'" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$_pos_WPF = $arr[1] ;
	$_pos_ENS = $arr[0] ;
}


$_repartition_mag = array() ;
$query = "select view_bible_PRODCOM_entry.field_TASTE , sum(field_VCA_PROD_UVC * view_bible_PRODCOM_entry.field_EQ_KG) 
			from view_file_VCA, view_file_VCA_PROD JOIN view_bible_PRODCOM_entry ON view_bible_PRODCOM_entry.entry_key=view_file_VCA_PROD.field_VCA_PRODCOM 
			WHERE view_file_VCA_PROD.filerecord_parent_id = view_file_VCA.filerecord_id 
			AND view_file_VCA.field_VCA_STORE = '$mag_code'
			GROUP BY view_bible_PRODCOM_entry.field_TASTE
			ORDER BY view_bible_PRODCOM_entry.field_TASTE" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$key = '' ;
	switch( $arr[0] ) {
		case 'PIS Grillées non Salées' :
		$key = "Sans sel" ;
		break ;
		
		case 'PIS Grillées Salées' :
		$key = "Grillées Salées" ;
		break ;
		
		case 'PIS Poivre & Sel' :
		$key = "Set et Poivre" ;
		break ;
		
		case 'PIS Sweet Chili' :
		$key = "Sweet Chili" ;
		break ;
		
		default :
		continue 2 ;
	}

	$_repartition_mag[$key] = $arr[1] ;
}


$_repartition_ens = array() ;
$query = "select view_bible_PRODCOM_entry.field_TASTE , sum(field_VCA_PROD_UVC * view_bible_PRODCOM_entry.field_EQ_KG) 
			from view_file_VCA, view_file_VCA_PROD JOIN view_bible_PRODCOM_entry ON view_bible_PRODCOM_entry.entry_key=view_file_VCA_PROD.field_VCA_PRODCOM 
			WHERE view_file_VCA_PROD.filerecord_parent_id = view_file_VCA.filerecord_id 
			AND view_file_VCA.field_VCA_STORE LIKE '$enseigne%'
			GROUP BY view_bible_PRODCOM_entry.field_TASTE
			ORDER BY view_bible_PRODCOM_entry.field_TASTE" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$key = '' ;
	switch( $arr[0] ) {
		case 'PIS Grillées non Salées' :
		$key = "Sans sel" ;
		break ;
		
		case 'PIS Grillées Salées' :
		$key = "Grillées Salées" ;
		break ;
		
		case 'PIS Poivre & Sel' :
		$key = "Set et Poivre" ;
		break ;
		
		case 'PIS Sweet Chili' :
		$key = "Sweet Chili" ;
		break ;
		
		default :
		continue 2 ;
	}

	$_repartition_ens[$key] = $arr[1] ;
}




// ******** INVESTISSEMENT *********
$date_1year = date('Y-m-d H:i:s',strtotime('-1 year')) ;
$query = "select sum(view_file_VISIT_6MEANS.field_MEAN_QTE * view_bible_VISIT_MEAN_entry.field_MEAN_VALUE) 
			from view_file_VISIT, view_file_VISIT_6MEANS JOIN view_bible_VISIT_MEAN_entry ON view_bible_VISIT_MEAN_entry.entry_key=view_file_VISIT_6MEANS.field_MEAN_CODE 
			WHERE view_file_VISIT_6MEANS.filerecord_parent_id = view_file_VISIT.filerecord_id 
			AND view_file_VISIT.field_VSTORE='$mag_code' AND view_file_VISIT.field_VDATE>='$date_1year'" ;
$_montant_investi = $_opDB->query_uniqueValue($query) ;


$_taux_investissement = round($_montant_investi / $_ca_mag * 100,2) ;

?>
<?php   
 /* CAT:Pie charts */

 /* pChart library inclusions */
 $pchart_root = $app_root."/resources/pChart" ;
 include("$pchart_root/class/pData.class.php");
 include("$pchart_root/class/pDraw.class.php");
 include("$pchart_root/class/pPie.class.php");
 include("$pchart_root/class/pImage.class.php");

 /* Create and populate the pData object */
 $MyData = new pData();   
 $MyData->addPoints(array_values($_repartition_ens),"ScoreA");  
 $MyData->setSerieDescription("ScoreA","Application A");
 $MyData->addPoints(array_keys($_repartition_ens),"Labels");
 $MyData->setAbscissa("Labels");

 $myPicture = new pImage(300,230,$MyData,TRUE);

 /* Set the default font properties */ 
 $myPicture->setFontProperties(array("FontName"=>"$pchart_root/fonts/verdana.ttf","FontSize"=>10,"R"=>80,"G"=>80,"B"=>80));

 /* Create the pPie object */ 
 $PieChart = new pPie($myPicture,$MyData);
 $PieChart->setSliceColor(0,array("R"=>0,"G"=>178,"B"=>237));
 $PieChart->setSliceColor(1,array("R"=>0,"G"=>174,"B"=>78));
 $PieChart->setSliceColor(2,array("R"=>110,"G"=>47,"B"=>158));
 $PieChart->setSliceColor(3,array("R"=>255,"G"=>0,"B"=>0));
 $PieChart->draw3DPie(120,150,array("WriteValues"=>TRUE,"Border"=>TRUE,"Radius"=>120));
 $myPicture->setShadow(TRUE,array("X"=>3,"Y"=>3,"R"=>0,"G"=>0,"B"=>0,"Alpha"=>10));

 /* Write the legend box */ 
 $myPicture->setFontProperties(array("FontName"=>"$pchart_root/fonts/verdana.ttf","FontSize"=>12,"R"=>0,"G"=>0,"B"=>0));
 $myPicture->drawText(10,30,"Enseigne", array("DrawBox"=>TRUE,"BoxRounded"=>TRUE)) ;
 $myPicture->setFontProperties(array("FontName"=>"$pchart_root/fonts/verdana.ttf","FontSize"=>10,"R"=>0,"G"=>0,"B"=>0));
 $PieChart->drawPieLegend(120,8,array("Style"=>LEGEND_NOBORDER,"Mode"=>LEGEND_VERTICAL));

 /* Render the picture (choose the best way) */
 $tmpfname = tempnam( sys_get_temp_dir(), "FOO");

 $myPicture->render($tmpfname);
 
 $_IMG['piechart_ENS'] = file_get_contents($tmpfname) ;
 unlink($tmpfname) ;
 
 
 
 
 
 
 /* Create and populate the pData object */
 $MyData = new pData();   
 $MyData->addPoints(array_values($_repartition_mag),"ScoreA");  
 $MyData->setSerieDescription("ScoreA","Application A");
 $MyData->addPoints(array_keys($_repartition_mag),"Labels");
 $MyData->setAbscissa("Labels");

 $myPicture = new pImage(250,230,$MyData,TRUE);

 /* Set the default font properties */ 
 $myPicture->setFontProperties(array("FontName"=>"$pchart_root/fonts/verdana.ttf","FontSize"=>10,"R"=>80,"G"=>80,"B"=>80));

 /* Create the pPie object */ 
 $PieChart = new pPie($myPicture,$MyData);
 $PieChart->setSliceColor(0,array("R"=>0,"G"=>178,"B"=>237));
 $PieChart->setSliceColor(1,array("R"=>0,"G"=>174,"B"=>78));
 $PieChart->setSliceColor(2,array("R"=>110,"G"=>47,"B"=>158));
 $PieChart->setSliceColor(3,array("R"=>255,"G"=>0,"B"=>0));
 $PieChart->draw3DPie(120,150,array("WriteValues"=>TRUE,"Border"=>TRUE,"Radius"=>120));
 $myPicture->setShadow(TRUE,array("X"=>3,"Y"=>3,"R"=>0,"G"=>0,"B"=>0,"Alpha"=>10));

 /* Write the legend box */ 
 $myPicture->setFontProperties(array("FontName"=>"$pchart_root/fonts/verdana.ttf","FontSize"=>12,"R"=>0,"G"=>0,"B"=>0));
 $myPicture->drawText(10,30,"Magasin", array("DrawBox"=>TRUE,"BoxRounded"=>TRUE)) ;
 $myPicture->setFontProperties(array("FontName"=>"$pchart_root/fonts/verdana.ttf","FontSize"=>10,"R"=>0,"G"=>0,"B"=>0));
 $PieChart->drawPieLegend(120,8,array("Style"=>LEGEND_NOBORDER,"Mode"=>LEGEND_VERTICAL));

 /* Render the picture (choose the best way) */
 $tmpfname = tempnam( sys_get_temp_dir(), "FOO");

 $myPicture->render($tmpfname);
 
 $_IMG['piechart_MAG'] = file_get_contents($tmpfname) ;
 unlink($tmpfname) ;
 
 
 
 
 
 $_IMG['logo_WPF'] = file_get_contents($app_root."/resources/server/templates/logo_WPF.png") ;
 
?>
<?php
ob_end_clean() ;
ob_start() ;
?>
<html>
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
	</style>
	<body style='background-color:#eeeeee'><div align='center'>
	<table cellpadding='0' cellspacing='0' align='center' style='background-color:#ffffff' width='800' height='600'><tr><td valign='top'>
	
		<table cellspacing='0' width='100%' style='background-color:#00703B' height='120'><tr>
<!-- 			<td style='background-color:#ffffff' width='120'>&nbsp;</td> -->
			<td style='padding:4px ; padding-left:20px'>
				<span class='text-big' style='color:#ffffff'>Bilan d'activité</span><br>
				<span class='text-big' style='color:#ffffff'><?php echo $mag_name; ?></span><br>
			</td>
			<td align='right' style='padding-right:25px'><img src="data:image/jpeg;base64,<?echo base64_encode($_IMG['logo_WPF']);?>" />
		</tr></table>
		
		<br>
		
		<table cellspacing='0' width='100%' height='120'><tr>
			<td>
				<table cellspacing='4'>
				<tr><td><span class='text-med'>Volume :</span></td><td width='200' style='border: 2px solid #87BF53 ; text-align:right ; padding-right:6px'><span class='text-med'><b><?php echo (float)$_vol_mag;?></b>&nbsp;Kg</span></td></tr>
				<tr><td><span class='text-med'>CA :</span></td><td width='200' style='border: 2px solid #87BF53 ; text-align:right ; padding-right:6px'><span class='text-med'><b><?php echo (float)$_ca_mag;?></b>&nbsp;€&nbsp;</span></td></tr>
				</table>
			</td>
			<td>
				<table cellspacing='4'>
				<tr><td><span class='text-med'>Pos. Wonderful / Ens :</span></td><td width='100' style='border: 2px solid #87BF53 ; text-align:right ; padding-right:6px'><span class='text-med'><?php echo (int)$_pos_WPF;?></span></td></tr>
				<tr><td><span class='text-med'>Pos. Mag / Enseigne :</span></td><td width='100' style='border: 2px solid #87BF53 ; text-align:right ; padding-right:6px'><span class='text-med'><?php echo (int)$_pos_ENS;?></span></td></tr>
				</table>
			</td>
		</tr></table>
		
		<br>
	
		<table cellspacing='0' width='100%'><tr>
			<td width='50%' align='center'>
				<img src="data:image/jpeg;base64,<?echo base64_encode($_IMG['piechart_MAG']);?>" />
			</td>
			<td width='50%' align='center'>
				<img src="data:image/jpeg;base64,<?echo base64_encode($_IMG['piechart_ENS']);?>" />
			</td>
		</tr></table>
		
		<div align='center'>
		<table cellspacing='4'>
		<tr><td><span class='text-med' align='center'>Investissement Magasin</span></td><td width='50'>&nbsp;</td><td><span class='text-med'>Taux d'investissement</span></td></tr>
		<tr><td width='200' style='border: 2px solid #87BF53 ; text-align:right ; padding-right:6px'><span class='text-med'><b><?php echo (float)$_montant_investi;?></b>&nbsp;€&nbsp;</span></td><td width='50'>&nbsp;</td><td width='200' style='border: 2px solid #87BF53 ; text-align:right ; padding-right:6px'><span class='text-med'><b><?php echo (float)$_taux_investissement;?></b>&nbsp;%&nbsp;</span></td></tr>
		</table>
		</div>
	
	</td></tr></table>
	</div></body>
</html>
<?
unset($_IMG) ;
$_QWEB_HTML = ob_get_clean() ;
break ;
}
?>