<?php
	// ** SHA1 salt : Constant, changing it voids user database !
	define('AUTH_SHA1_SALT','zo5propvkhj6cz4a8tvbudsoeuio') ;
	// ** Root password / Recovery backdoor (should be empty for secure production!) **
	define('AUTH_ROOT_PASSWORD_PLAIN','') ;
	
	$mysql_host = 'localhost' ;
	$mysql_user = 'root' ;
	$mysql_pass = '' ;
	
	$media_storage_local_path = '/var/lib/optima5' ;
	$media_fallback_url =  "" ;
	
	$media_pdf_IMconvert_path = '' ;
	$media_pdf_wkhtmltoimage_path = '' ;
	$media_pdf_wkhtmltopdf_path = '' ;
?>
