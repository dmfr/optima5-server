<?php
class DatabaseMgr_Base {
	
	private $_opDB ;
	
	private static $dbVersion = 1 ;
	
	public function __construct () {
		$this->_opDB = $GLOBALS['_opDB'] ;
	}
	
	public static function version_getVcode() {
		return self::$dbVersion ;
	}
	public static function version_getSchema() {
		return <<<EOF

CREATE TABLE `_DB_INFO` (
  `zero_id` int(11) NOT NULL,
  `db_version` int(11) NOT NULL,
  PRIMARY KEY (`zero_id`)
) ;

CREATE TABLE `auth_group` (
  `group_id` int(11) NOT NULL AUTO_INCREMENT,
  `sdomain_id` varchar(20) NOT NULL,
  `group_name` varchar(100) NOT NULL,
  `auth_has_all` varchar(1) NOT NULL,
  PRIMARY KEY (`group_id`),
  KEY `sdomain_id` (`sdomain_id`)
) ;

CREATE TABLE `auth_group_action` (
  `group_id` int(11) NOT NULL,
  `group_action_ssid` int(11) NOT NULL,
  `action_code` varchar(20) NOT NULL,
  `action_param_is_wildcard` varchar(1) NOT NULL,
  `action_param_data` varchar(500) NOT NULL,
  `auth_has_read` varchar(1) NOT NULL,
  `auth_has_write` varchar(1) NOT NULL,
  PRIMARY KEY (`group_id`,`group_action_ssid`)
) ;

CREATE TABLE `auth_user` (
  `user_id` varchar(50) NOT NULL,
  `user_fullname` varchar(100) NOT NULL,
  `user_email` varchar(200) NOT NULL,
  `password_sha1` varchar(40) NOT NULL,
  `auth_class` varchar(1) NOT NULL,
  `auth_is_disabled` varchar(1) NOT NULL,
  PRIMARY KEY (`user_id`)
) ;

CREATE TABLE `auth_user_link_group` (
  `user_id` varchar(50) NOT NULL,
  `user_linkgroup_ssid` int(11) NOT NULL,
  `link_group_id` int(11) NOT NULL,
  PRIMARY KEY (`user_id`,`user_linkgroup_ssid`)
) ;

CREATE TABLE `auth_user_pref_shortcut` (
  `user_id` varchar(50) NOT NULL,
  `shortcut_ssid` int(11) NOT NULL,
  `shortcut_desktop_index` int(11) NOT NULL,
  `module_id` varchar(20) NOT NULL,
  PRIMARY KEY (`user_id`,`shortcut_ssid`)
) ;

CREATE TABLE `auth_user_pref_shortcut_param` (
  `user_id` varchar(50) NOT NULL,
  `shortcut_ssid` int(11) NOT NULL,
  `param_code` varchar(20) NOT NULL,
  `param_value` varchar(100) NOT NULL,
  PRIMARY KEY (`user_id`,`shortcut_ssid`)
) ;

CREATE TABLE `auth_user_pref_wallpaper` (
  `user_id` varchar(50) NOT NULL,
  `wallpaper_id` int(11) NOT NULL,
  `wallpaper_is_stretch` varchar(1) NOT NULL,
  PRIMARY KEY (`user_id`)
) ;

CREATE TABLE `domain` (
  `zero_id` int(11) NOT NULL,
  `domain_name` varchar(100) NOT NULL,
  PRIMARY KEY (`zero_id`)
) ;

CREATE TABLE `sdomain` (
  `sdomain_id` varchar(20) NOT NULL,
  `sdomain_name` varchar(100) NOT NULL,
  `module_id` varchar(20) NOT NULL,
  `icon_code` varchar(20) NOT NULL,
  `overwrite_is_locked` varchar(1) NOT NULL,
  PRIMARY KEY (`sdomain_id`)
) ;

EOF;
	}
	
	public static function getBaseDb( $domain_id, $dev_suffix=NULL ) {
		return 'op5'.'_'.strtolower($domain_id).'_'.( $dev_suffix ? $dev_suffix : 'prod' ) ;
	}
	
	public function baseDb_exists( $domain_id ) {
		$_opDB = $this->_opDB ;
		$base_db = self::getBaseDb( $domain_id ) ;
		
		if( $_opDB->num_rows( $_opDB->query("SHOW DATABASES LIKE '{$base_db}'") ) == 1 ) {
			return TRUE ;
		} else {
			return FALSE ;
		}
	}
	public function baseDb_create( $domain_id ) {
		$_opDB = $this->_opDB ;
		$base_db = self::getBaseDb( $domain_id ) ;
		
		$query = "SHOW DATABASES" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			if( $arr[0] == $base_db ) {
				throw new Exception("DOMAIN_EXISTS");
			}
		}
		
		$query = "CREATE DATABASE {$base_db}" ;
		$_opDB->query($query) ;
		
		$this->baseDb_updateSchema( $domain_id ) ;
	}
	public function baseDb_delete( $domain_id ) {
		$_opDB = $this->_opDB ;
		$base_db = self::getBaseDb( $domain_id ) ;
		
		$query = "DROP DATABASE IF EXISTS {$base_db}" ;
		$_opDB->query($query) ;
	}
	public function baseDb_needUpdate( $domain_id ) {
		$_opDB = $this->_opDB ;
		$base_db = self::getBaseDb( $domain_id ) ;
		
		$query = "SELECT db_version FROM {$base_db}._DB_INFO WHERE zero_id='0'" ;
		$db_version = $_opDB->query_uniqueValue($query) ;
		if( $db_version < self::version_getVcode() ) {
			return TRUE ;
		}
		return FALSE ;
	}
	public function baseDb_updateSchema( $domain_id ) {
		$_opDB = $this->_opDB ;
		$base_db = self::getBaseDb( $domain_id ) ;
		
		DatabaseMgr_Util::syncSQLschema( $base_db, self::version_getSchema() ) ;
		
		$query = "INSERT IGNORE INTO {$base_db}._DB_INFO (`zero_id`) VALUES ('0')" ;
		$_opDB->query($query) ;
		$db_version = self::version_getVcode() ;
		$query = "UPDATE {$base_db}._DB_INFO SET db_version='$db_version' WHERE zero_id='0'" ;
		$_opDB->query($query) ;
	}
	
	
	public static function dbCurrent_getDomainId() {
		$_opDB = $GLOBALS['_opDB'] ;
	
		$current_database = $_opDB->query_uniqueValue("SELECT DATABASE()") ;
		$base_database = $GLOBALS['mysql_db'] ;
		
		if( !(strpos($current_database,$base_database) === 0) ) {
			return NULL ;
		}
		$ttmp = explode('_',$current_database) ;
		switch( count($ttmp) ) {
			case 4 :
			case 3 :
			return $ttmp[1] ;
			
			default :
			return NULL ;
		}
	}
}
?>