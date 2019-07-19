<?php
$app_root = dirname($_SERVER['SCRIPT_NAME']).'/../../..' ;
$server_root=$app_root.'/server' ;
$resources_root=$app_root.'/resources' ;
$templates_dir=$resources_root.'/server/templates' ;

include("$server_root/include/config.inc.php");
include("$server_root/include/toolfunctions.inc.php");
include("$server_root/modules/media/include/media.inc.php");

include( "$server_root/include/database/mysql_DB.inc.php" ) ;
$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, $mysql_db, $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;

include("$server_root/modules/spec_rsi_recouveo/backend_spec_rsi_recouveo.inc.php");

// Access to recouvéo server

$bible_code = 'META' ;

$data = array() ;
$query = "SELECT field_META_KEY, field_META_VALUE FROM view_bible_META_entry" ;
$result = $_opDB->query($query) ;
while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
	$data[$arr[0]] = $arr[1] ;
}

$gen_meta = $data ;
if (!$gen_meta){
	return ;
}

$transfert_url = $gen_meta["gen_transfert_url"] ;
$transfert_apikey = $gen_meta["gen_transfert_apikey"] ;
$transfert_domain = $gen_meta["gen_transfert_domain"] ;

// Get files
$current_date = date("Y-m-d") ;
$current_time = date('H:i:s') ;


$transfert_files = specRsiRecouveo_lib_transfert_extract_files() ;
foreach ($transfert_files as $key=> $files){
	$filename = $transfert_archive_storage_local_path.'/transfert-archive-'.$key.'-'.$current_date.'-'.$current_time.'.json' ;
	//print_r($filename) ;
	$handle = fopen($filename, 'w+') ;
	fwrite($handle, $files) ;
	echo "\n" ;

	specRsiRecouveo_transfert_SEND_DISTANT_REQUEST($files, $key, $transfert_url, $transfert_apikey, $transfert_domain);
	//fopen()
}

//fopen($transfert_archive_storage_local_path.'archive')


//print_r(rsiRecouveo_transfert_SEND_DISTANT_REQUEST(null, 'account_adrbookentry', $transfert_url, $transfert_apikey, $transfert_domain)) ;
/*
	Todo:
x	- Créer une interface dasn "Configuration" dans le menu principal qui permettra d'enregistrer un url distant & un nom de domaine/sous domaine dans un seul champ
	( dans notre cas, on créera un domaine de test pour effectuer le post)
x	- Rajouter l'url dans la base
x	- Récuperer dans ce script l'url, et le parser afin d'obtenir les bons noms de domaines/sous domaine et l'url vers l'api
x	- Faire une fonction de post vers l'api avec un url encodé correctemnt (cf dév ftp)
	- Appeler la fonction specRsiRecouveo specRsiRecouveo_transfert_extract_files et stocker le résultat dans une variable
	- Créer 3 fichiers json dans un dossier /var/lib/optima5/transfertToVeoTest
	- Vérifier que les fichiers sont bien crées et vérifier leur contenu (json validator ?)
	- Faire un appel a la fonction de post et vérifier que tout est bien crée dans le domaine test
	- Refaire un appel pour tester les updates
	- Refaire un appel avec des enregistrements partiels / faux pour tester la gestion d'erreur
	
	Todo2: Réfléchir a une vraie implémentation poru le systeme de post et d'extraction.
*/

function specRsiRecouveo_transfert_SEND_DISTANT_REQUEST($binary, $method, $distant_url, $distant_apikey, $distant_domain){
	//print_r($binary) ;
	// Construction de l'URL
	$arr_url = parse_url($distant_url) ;
	$auth_url = $arr_url['scheme'].'://'.urlencode($distant_domain).':'.urlencode($distant_apikey).'@'.$arr_url['host'].'/'.$arr_url['path'].'/'.$method ;

	echo $auth_url."\n" ;
	$params = array('http' => array(
		'method' => 'POST',
		'content' => $binary,
		'timeout' => (30*60)
	));
	$ctx = stream_context_create($params);
	$fp = @fopen($auth_url, 'rb', false, $ctx);
	echo $http_response_header[0]."\n" ;
	if( $fp ) {
		$ret = stream_get_contents($fp) ;
		echo $ret;
		echo "\n" ;
		$done = TRUE ;
	}
	echo "\n" ;
	return $ret ;
}


?>