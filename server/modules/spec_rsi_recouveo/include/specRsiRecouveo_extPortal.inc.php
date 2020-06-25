<?php

function specRsiRecouveo_extPortal_getInfosConfig( $post_data ){
	$app_root = $GLOBALS['app_root'] ;
	$resources_root=$app_root.'/resources' ;
	$datasources_dir=$resources_root.'/server/datasources' ;
	$jsonFileContent = file_get_contents($datasources_dir.'/'."RSI_GEN_extPortalConf.json") ;
	if ($jsonFileContent === false) {
		return array("success" => false) ;
	}
	return array("success" => true, "data" => json_decode($jsonFileContent,true)) ;
}
