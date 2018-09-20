<?php
$_recouveo_baseurl = "http://ttv%40veo:94B3A2C8C0A15ACD8063075B93C92B27@localhost/paracrm/server/API.php/////////record/pouet/" ;
$url = $_recouveo_baseurl;
$data = '' ;
// "Montant TTC": "34,06",
$params = array('http' => array(
	'method' => 'POST',
	'content' => $data
));
$ctx = stream_context_create($params);
$fp = fopen($url, 'rb', false, $ctx);
if (!$fp) {
	echo 'pas ok' ;
}
$response = stream_get_contents($fp);
if ($response === false) {
	echo 'pas ok response' ;
}
echo $response ;
echo "\n\n\n" ;
?>
