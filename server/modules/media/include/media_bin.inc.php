<?php
function media_bin_processUploaded( $tmpfilepath )
{
	if( !$GLOBALS['_media_context'] )
		return FALSE ;
	$media_path = media_contextGetDirPath() ;
	if( !$media_path )
	{
		return FALSE ;
	}

	$binary = file_get_contents($tmpfilepath) ;

	// tmp ID
	$path = $media_path.'/tmp' ;
	do{
		$tmpid = rand ( 1000000000 , 9999999999 ) ;
	}
	while( glob( $path.'/'.$tmpid.'*') ) ;
	
	file_put_contents( $path.'/'.$tmpid.'.bin', $binary ) ;
	
	
	return 'tmp_'.$tmpid ;
}
function media_bin_processBuffer( $binary )
{
	if( !$GLOBALS['_media_context'] )
		return FALSE ;
	$media_path = media_contextGetDirPath() ;
	if( !$media_path )
	{
		return FALSE ;
	}

	$binary ;

	// tmp ID
	$path = $media_path.'/tmp' ;
	do{
		$tmpid = rand ( 1000000000 , 9999999999 ) ;
	}
	while( glob( $path.'/'.$tmpid.'*') ) ;
	
	file_put_contents( $path.'/'.$tmpid.'.bin', $binary ) ;
	
	
	return 'tmp_'.$tmpid ;
}
function media_bin_move( $src_id , $dst_id )
{
	if( !$GLOBALS['_media_context'] )
		return FALSE ;
	$media_path = media_contextGetDirPath() ;
	if( !$media_path )
	{
		return FALSE ;
	}
	
	if( !trim($src_id) ) {
		return ;
	}
	if( strpos($src_id,'tmp_') === 0 )
	{
		$ttmp = substr($src_id,4,strlen($src_id)-4) ;
		$src_path = $media_path.'/tmp/'.$ttmp ;
	}
	else
	{
		$src_path = $media_path.'/'.$src_id ;
	}
	if( strpos($dst_id,'tmp_') === 0 )
	{
		$ttmp = substr($dst_id,4,strlen($dst_id)-4) ;
		$dst_path = $media_path.'/tmp/'.$ttmp ;
	}
	else
	{
		$dst_path = $media_path.'/'.$dst_id ;
	}
	
	foreach( glob($src_path.'*') as $path ) {
		$ttmp = explode('.',basename($path),2) ;
		$suffix = $ttmp[1] ;
		rename( $src_path.'.'.$suffix , $dst_path.'.'.$suffix ) ;
	}
}
function media_bin_delete( $src_id )
{
	if( !$GLOBALS['_media_context'] )
		return FALSE ;
	$media_path = media_contextGetDirPath() ;
	if( !$media_path )
	{
		return FALSE ;
	}

	if( !trim($src_id) ) {
		return ;
	}
	if( strpos($src_id,'tmp_') === 0 )
	{
		$ttmp = substr($src_id,4,strlen($src_id)-4) ;
		$src_path = $media_path.'/tmp/'.$ttmp ;
	}
	else
	{
		$src_path = $media_path.'/'.$src_id ;
	}
	
	foreach( glob($src_path.'*') as $path ) {
		unlink($path) ;
	}
}

function media_bin_getBinary( $src_id )
{
	if( !$GLOBALS['_media_context'] )
		return FALSE ;
	$media_path = media_contextGetDirPath() ;
	if( !$media_path )
	{
		return FALSE ;
	}

	if( strpos($src_id,'tmp_') === 0 )
	{
		$ttmp = substr($src_id,4,strlen($src_id)-4) ;
		$src_path = $media_path.'/tmp/'.$ttmp ;
	}
	else
	{
		$src_path = $media_path.'/'.$src_id ;
	}
	
	if( is_file($src_path.'.bin') )
		return file_get_contents( $src_path.'.bin' ) ;
	return NULL ;
}

function media_bin_toolFile_getId( $file_code, $filerecord_id ) {
	return $file_code.'_'.$filerecord_id ;
}

?>
