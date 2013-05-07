<?php
$app_root='..' ;
$server_root=$app_root.'/server' ;

include("$server_root/backend_checksession.inc.php") ;

include("$server_root/include/config.inc.php");

include("$server_root/modules/media/include/media.inc.php");


$domain = $_SESSION['login_data']['login_domain'] ;

if( !$domain )
	die() ;

$media_path = $GLOBALS['media_storage_local_path'].'/'.$domain.'/'.'_wallpapers' ;
if( is_dir($media_path) && ($src_id = $_GET['wallpaper_id']) )
{
	$src_path = $media_path.'/'.$src_id ;
	$src_path.= '.jpg' ;
}
else
{
	$src_path = $app_root.'/wallpapers/default.jpg' ;
}

if( !is_file($src_path) ) {
	die() ;
}

header('Content-type: image/jpeg');
readfile($src_path) ;
die();
?>