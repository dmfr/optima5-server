<?php
class PhpMimeMailParser {
	public static function getInstance() {
		$resources_root = $GLOBALS['resources_root'] ;
		if( !@include_once("{$resources_root}/php-mime-mail-parser/src/Autoloader/autoload.php") ) {
			return NULL ;
		}
		$Parser = new PhpMimeMailParser\Parser();
		return $Parser ;
	}
}
?>
