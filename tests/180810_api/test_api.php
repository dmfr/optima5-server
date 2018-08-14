<?php
$_recouveo_baseurl = "http://rayane_test:tst@localhost/paracrm/server/API.php/record" ;
$url = $_recouveo_baseurl;
$data = file_get_contents("./json_api_test_record.json") ;
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

?>