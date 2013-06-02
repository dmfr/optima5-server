<?php
$app_root='..' ;
$server_root='.' ;

include("$server_root/backend_checksession.inc.php") ;

include("$server_root/include/config.inc.php");
include("$server_root/include/toolfunctions.inc.php");

include("$server_root/modules/media/include/media.inc.php");


$domain = $_SESSION['login_data']['login_domain'] ;
$sdomain_id = $_GET['_sdomainId'] ;

if( !$domain || !$sdomain_id || !$_GET['media_id'] )
	die() ;

function do_fallback() {
	if( !$GLOBALS['media_fallback_url'] ) {
		die() ;
	}
	
	$thumb_get = "false" ;
	if( $_GET['thumb'] === true || $_GET['thumb'] == 'true' ) {
		$thumb_get = "true" ;
	}
	
	$getUrl = $GLOBALS['media_fallback_url']."?".http_build_query($_GET) ;
	
	if( $_GET['download'] === true || $_GET['download'] == 'true' )
	{
		$filename = 'OP5.'.rand ( 1000000000 , 9999999999 ).'.jpg' ;
		header("Content-Type: application/force-download; name=\"$filename\""); 
		header("Content-Disposition: attachment; filename=\"$filename\""); 
	}
	elseif( $_GET['getsize'] === true || $_GET['getsize'] == 'true' ) {
		//
	} else {
		header('Content-type: image/jpeg');
	}
	readfile($getUrl) ;
	die() ;
}

$media_path = $GLOBALS['media_storage_local_path'].'/'.$domain.'/'.$sdomain_id ;
if( !is_dir($media_path) )
{
	do_fallback() ;
}
	
$src_id = $_GET['media_id'] ;
if( strpos($src_id,'tmp_') === 0 )
{
	$ttmp = substr($src_id,4,strlen($src_id)-4) ;
	$src_path = $media_path.'/tmp/'.$ttmp ;
}
else
{
	$src_path = $media_path.'/'.$src_id ;
}
if( $_GET['thumb'] === true || $_GET['thumb'] == 'true' )
{
	$src_path.= '.thumb.jpg' ;
}
else
{
	$src_path.= '.jpg' ;
}

if( !is_file($src_path) ) {
	do_fallback() ;
}

if( $_GET['getsize'] === true || $_GET['getsize'] == 'true' )
{
	$img_src = imagecreatefromjpeg($src_path);
	if( $img_src )
	{
		$orig_w = imagesx($img_src);
		$orig_h = imagesy($img_src);
		die( json_encode( array('success'=>true,'width'=>$orig_w,'height'=>$orig_h) ) );
	}
	die( json_encode( array('success'=>false) ) );
}

if( $_GET['download'] === true || $_GET['download'] == 'true' )
{
	$filename = 'OP5.'.rand ( 1000000000 , 9999999999 ).'.jpg' ;
	header("Content-Type: application/force-download; name=\"$filename\""); 
	header("Content-Disposition: attachment; filename=\"$filename\""); 
}
else
{
	header('Content-type: image/jpeg');
}
readfile($src_path) ;
die() ;
?>