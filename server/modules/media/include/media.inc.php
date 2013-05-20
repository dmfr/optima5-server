<?php

include("$server_root/modules/media/include/media_img.inc.php") ;

function media_contextOpen( $module_name )
{
	unset($GLOBALS['_media_context']) ;
	
	if( !$module_name )
	{
		return ;
	}
	
	$GLOBALS['_media_context'] = array() ;
	$GLOBALS['_media_context']['sdomain_id'] = $module_name ;
}
function media_contextGetDirPath()
{
	global $_media_context ;
	
	if( !($GLOBALS['_media_context']) )
		return NULL ;

	if( !$GLOBALS['media_storage_local_path'] )
		return NULL ;
		
	$domain = $_SESSION['login_data']['login_domain'] ;
	
	$dir_domain = $GLOBALS['media_storage_local_path'].'/'.$domain ;
	if( is_dir($dir_domain) ) {}
	elseif( file_exists($dir_domain) )
		return NULL ;
	elseif( !mkdir($dir_domain) )
		return NULL ;
		
	$dir_moduleacc = $GLOBALS['media_storage_local_path'].'/'.$domain.'/'.$GLOBALS['_media_context']['sdomain_id'] ;
	if( is_dir($dir_moduleacc) ) {}
	elseif( file_exists($dir_moduleacc) )
		return NULL ;
	elseif( !mkdir($dir_moduleacc) )
		return NULL ;
		
	// echo $dir_moduleacc ;
		
	$dir_moduleacc_tmp = $dir_moduleacc.'/'.'tmp' ;
	if( is_dir($dir_moduleacc_tmp) ) {}
	elseif( file_exists($dir_moduleacc_tmp) )
		return NULL ;
	elseif( !mkdir($dir_moduleacc_tmp) )
		return NULL ;
	
		
		
	return $dir_moduleacc ;
}
function media_contextClose()
{
	unset($GLOBALS['_media_context']) ;
}


?>