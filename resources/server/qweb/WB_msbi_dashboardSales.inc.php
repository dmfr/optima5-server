<?php
ob_start() ;

$ens = array() ;
$ens['FR'] = 'Total France' ;
$ens['FR-GRP-AUCHAN'] = 'Groupe Auchan' ;
$ens['FR-GRP-CARREFOUR'] = 'Groupe Carrefour' ;
$ens['FR-GRP-DIA'] = 'Groupe DIA' ;
$ens['FR-GRP-EMC'] = 'Groupe EMC' ;
$ens['FR-GRP-GALEC'] = 'Groupe Leclerc' ;
$ens['FR-GRP-ITM'] = 'Groupe ITM' ;
$ens['FR-GRP-PROVERA'] = 'Groupe Provera' ;
$ens['FR-GRP-SYSTU'] = 'Système U' ;

$src = array() ;
foreach( $ens as $key => $lib ) {
	$src[$key] = array('lib'=>$lib) ;
}

foreach( paracrm_queries_qweb_getQresultObjs( 'qmerge',2, array() ) as $obj ) {
	if( $obj['type'] == 'chart' ) {
		$src['FR']['vol_base64'] = $obj['img_base64'] ;
	}
}
foreach( paracrm_queries_qweb_getQresultObjs( 'query',6, array() ) as $obj ) {
	if( $obj['type'] == 'chart' ) {
		$src['FR']['displays_base64'] = $obj['img_base64'] ;
	}
}

foreach( paracrm_queries_qweb_getQresultObjs( 'qmerge',1, array() ) as $obj ) {
	if( $obj['type'] == 'chart' ) {
		$key = $obj['title'] ;
		$src[$key]['vol_base64'] = $obj['img_base64'] ;
	}
}
foreach( paracrm_queries_qweb_getQresultObjs( 'query',7, array() ) as $obj ) {
	if( $obj['type'] == 'chart' ) {
		$key = $obj['title'] ;
		$src[$key]['displays_base64'] = $obj['img_base64'] ;
	}
}

ob_end_clean() ;

foreach( $src as $key => $data ) {
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
	
		<table cellspacing='0' cellpadding='0' width='100%' style='background-color:#9D080E' height='80'><tr>
<!-- 			<td style='background-color:#ffffff' width='120'>&nbsp;</td> -->
			<td style='padding:4px ; padding-left:20px'>
				<span class='text-big' style='color:#ffffff'><?php echo $data['lib'];?></span><br>
				<span class='text-med' style='color:#ffffff'>Novembre 2013</span><br>
			</td>
			<td align='right' valign='bottom' style='padding-right:25px'></td>
		</tr></table>
		<br>
		
		<span class='text-small' style='color:#111111'>&nbsp;&nbsp;&nbsp;Volume (kg)</span><br>
		<img src="data:image/jpeg;base64,<?echo $data['vol_base64'];?>" />
		<br>
		<span class='text-small' style='color:#111111'>&nbsp;&nbsp;&nbsp;Displays / Box</span><br>
		<img src="data:image/jpeg;base64,<?echo $data['displays_base64'];?>" />
		<br>
		<br>
		<span class='text-xsmall' style='line-height:16px ; padding:0px 10px'>**&nbsp;<i>Comment</i></span><br>
	</td></tr></table>
	</div>
	</body>
</html>
<?php
unset($_IMG) ;
$_QWEB_TABS_HTML[$key] = ob_get_clean() ;
}
?>