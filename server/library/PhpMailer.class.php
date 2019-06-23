<?php
class PhpMailer {
	public static function getInstance() {
		$resources_root = $GLOBALS['resources_root'] ;
		if( !@include_once("{$resources_root}/php-mailer/src/Autoloader/autoload.php") ) {
			return NULL ;
		}
		$Parser = new PHPMailer\PHPMailer\PHPMailer();
		return $Parser ;
	}
	public static function getSMTP() {
		$resources_root = $GLOBALS['resources_root'] ;
		if( !@include_once("{$resources_root}/php-mailer/src/Autoloader/autoload.php") ) {
			return NULL ;
		}
		$Parser = new PHPMailer\PHPMailer\SMTP();
		return $Parser ;
	}
}
?>
