<?php
$_REQUEST['_sdomainId'] = 'people' ;
$_REQUEST['_action'] = 'query_getResult' ;

foreach( $_REQUEST as $mkey=>$mvalue ) {
	switch( $mkey ) {
		case 'q' :
			$_REQUEST['data:querysrc_id'] = $mvalue ;
			break ;
		case 'ds' :
			$_REQUEST['data:date_start'] = $mvalue ;
			break ;
		case 'de' :
			$_REQUEST['data:date_end'] = $mvalue ;
			break ;
		case 'fst' :
			$_REQUEST['data:filter_site_treenodes'] = json_encode(array($mvalue)) ;
			break ;
	
		default:
			continue 2 ;
	}
	unset($_REQUEST[$mkey]) ;
}
include('report.xml.php');
?>
