<?php
class Auth_Manager {
	
	private static $_instance;
	
	private $_opDB ;
	
	/**
	* Empêche la création externe d'instances.
	*/
	private function __construct () {
		$this->_opDB = $GLOBALS['_opDB'] ;
		
		$this->auth_build_cache() ;
	}
	
	/**
	* Empêche la copie externe de l'instance.
	*/
	private function __clone () {}
	
	/**
	* Renvoi de l'instance et initialisation si nécessaire.
	*/
	public static function getInstance () {
		if (!(self::$_instance instanceof self))
				self::$_instance = new self();
		
		return self::$_instance;
	}
	
	/**
	* Méthodes dites métier
	*/
	public function auth_is_admin()
	{
		if( !$_SESSION['login_data'] && getenv('OPTIMA_DB') )
			return TRUE ;
		if( $_SESSION['login_data']['auth_class'] == 'A' )
			return TRUE ;
		return FALSE ;
	}
	
	public function auth_build_cache()
	{
		if( !$_SESSION['login_data'] )
			return ;
		
		$this->auth_cache = array() ;
		
		$mysql_db = $GLOBALS['mysql_db'] ;
		
		$user_id = $_SESSION['login_data']['login_user'] ;
		$query = "SELECT auth_group.sdomain_id , auth_group.auth_has_all ,
						auth_group_action.action_code, auth_group_action.action_param_is_wildcard, auth_group_action.action_param_data, auth_group_action.auth_has_read, auth_group_action.auth_has_write
					FROM {$mysql_db}.auth_user_link_group
					JOIN {$mysql_db}.auth_group ON auth_group.group_id = auth_user_link_group.link_group_id
					LEFT OUTER JOIN {$mysql_db}.auth_group_action ON auth_group_action.group_id = auth_group.group_id
					WHERE auth_user_link_group.user_id='{$user_id}'" ;
		$result = $this->_opDB->query($query) ;
		while( ($arr = $this->_opDB->fetch_assoc($result)) != FALSE ) {
			$sdomain_id = $arr['sdomain_id'] ;
			if( $arr['auth_has_all'] == 'O' ) {
				$this->auth_cache[$sdomain_id]['*']['*']['R'] = TRUE ;
				$this->auth_cache[$sdomain_id]['*']['*']['W'] = TRUE ;
				continue ;
			}
			$action_code = $arr['action_code'] ;
			$action_param_data = ( $arr['action_param_is_wildcard'] == 'O' ? '*' : $arr['action_param_data'] ) ;
			
			$this->auth_cache[$sdomain_id][$action_code][$action_param_data]['R'] = ($arr['auth_has_read']=='O') ;
			$this->auth_cache[$sdomain_id][$action_code][$action_param_data]['W'] = ($arr['auth_has_write']=='O') ;
		}
	}
	
	public function auth_query_sdomain_admin( $sdomain_id ) {
		if( $this->auth_is_admin() )
			return TRUE ;
		if( !is_array($this->auth_cache) ) {
			return FALSE ;
		}
		return ( $this->auth_cache[$sdomain_id]['*']['*']['W'] == TRUE ) ;
	}
	public function auth_query_sdomain_openActions( $sdomain_id ) {
		if( $this->auth_is_admin() ) {
			return '*' ;
		}
		if( $this->auth_query_sdomain_admin($sdomain_id) ) {
			return '*' ;
		}
		if( !isset($this->auth_cache[$sdomain_id]) ) {
			return NULL ;
		}
		$arr_openActions = array() ;
		foreach( $this->auth_cache[$sdomain_id] as $action_code => $dummy ) {
			if( $action_code == '*' ) {
				continue ;
			}
			if( !in_array($action_code,$arr_openActions) ) {
				$arr_openActions[] = $action_code ;
			}
		}
		return $arr_openActions ;
	}
	public function auth_query_sdomain_action( $sdomain_id, $action_code, $kv_action_param, $is_write )
	{
		if( $this->auth_is_admin() )
			return TRUE ;
		if( !is_array($this->auth_cache) ) {
			return FALSE ;
		}
		if( is_array($kv_action_param) && count($kv_action_param) == 1 ) {
			$action_param = key($kv_action_param).':'.current($kv_action_param) ;
		}
		$perm = ( $is_write ? 'W':'R' ) ;
		
		return ( $this->auth_cache[$sdomain_id]['*']['*'][$perm] == TRUE ) 
				|| ( $this->auth_cache[$sdomain_id][$action_code]['*'][$perm] == TRUE )
				|| ( isset($action_param) && ( $this->auth_cache[$sdomain_id][$action_code][$action_param][$perm] == TRUE ) ) ;
	}
	
	// ****************************
	
	public static function sdomain_getCurrent() {
		$_opDB = $GLOBALS['_opDB'] ;
	
		$current_database = $_opDB->query_uniqueValue("SELECT DATABASE()") ;
		$base_database = $GLOBALS['mysql_db'] ;
		
		if( !(strpos($current_database,$base_database) === 0) ) {
			return NULL ;
		}
		return substr($current_database,strlen($base_database)+1) ;
	}
	
	// ******************************
	
	public static function auth_getDenialResponse() {
		return array('authDenied'=>true) ;
	}
}
?>