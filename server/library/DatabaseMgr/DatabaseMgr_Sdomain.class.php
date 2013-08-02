<?php
class DatabaseMgr_Sdomain {
	
	private $_opDB ;
	
	private static $dbVersion = 1 ;
	
	public function __construct () {
		$this->_opDB = $GLOBALS['_opDB'] ;
	}
	
	public static function version_getVcode() {
		return self::$versionCode ;
	}
	public static function version_getSchema() {
		return <<<EOF

CREATE TABLE `store_file_CDE_LIG_UVC` (
	`filerecord_id` int(11) NOT NULL,
	`field_PROD_EAN_str` varchar(200) COLLATE utf8_unicode_ci NOT NULL,
	`field_ORDER_QTY_dec` decimal(10,2) NOT NULL,
	`field_SHIP_QTY_dec` decimal(10,2) NOT NULL,
	`field_SPEC_BATCH_str` varchar(200) COLLATE utf8_unicode_ci NOT NULL,
	`field_SPEC_DATE_str` varchar(200) COLLATE utf8_unicode_ci NOT NULL,
	PRIMARY KEY (`filerecord_id`)
	) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

EOF;
	}
	
	private function getSdomainDb( $sdomain_id ) {
		return self::db_getBase().'_'.strtolower($sdomain_id) ;
	}
	
	public function sdomainDb_create( $sdomain_id, $overwrite=FALSE ) {
		$_opDB = $this->_opDB ;
		$sdomain_db = $this->getSdomainDb( $sdomain_id ) ;
		
		$query = "SHOW DATABASES" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			if( $arr[0] == $sdomain_db ) {
				if( !$overwrite ) {
					throw new Exception("SDOMAIN_EXISTS");
				}
				$query = "DROP DATABASE {$sdomain_db}" ;
				$_opDB->query($query) ;
				break ;
			}
		}
		
		$query = "CREATE DATABASE {$sdomain_db}" ;
		$_opDB->query($query) ;
		
		$this->sdomainDb_updateSchema( $sdomain_id ) ;
	}
	public function sdomainDb_delete( $sdomain_id ) {
		$_opDB = $this->_opDB ;
		$sdomain_db = $this->getSdomainDb( $sdomain_id ) ;
		
		$query = "DROP DATABASE IF EXISTS {$sdomain_db}" ;
		$_opDB->query($query) ;
	}
	public function sdomainDb_needUpdate( $sdomain_id ) {
		$_opDB = $this->_opDB ;
		$sdomain_db = $this->getSdomainDb( $sdomain_id ) ;
		
		$query = "SELECT db_version FROM {$sdomain_db}._DB_INFO WHERE zero_id='0'" ;
		$db_version = $opDB->query_uniqueValue($query) ;
		if( $db_version < self::version_getVcode() ) {
			return TRUE ;
		}
		return FALSE ;
	}
	public function sdomainDb_updateSchema( $sdomain_id ) {
		DatabaseMgr_Util::syncSQLschema( $this->getSdomainDb( $sdomain_id ), self::version_getSchema() ) ;
		$this->sdomainDefine_buildAll($sdomain_id) ;
	}
	
	public function sdomainDefine_buildAll($sdomain_id) {
		$_opDB = $this->_opDB ;
		$sdomain_db = $this->getSdomainDb( $sdomain_id ) ;
	
	}
	public function sdomainDefine_buildBible( $sdomain_id , $bible_code ) {
		$_opDB = $this->_opDB ;
		$sdomain_db = $this->getSdomainDb( $sdomain_id ) ;
		
		$this->sdomainDefine_buildBible_tree( $sdomain_id , $bible_code );
		$this->sdomainDefine_buildBible_entry( $sdomain_id , $bible_code );
	}
	public function sdomainDefine_buildBible_tree( $sdomain_id , $bible_code ) {
		$_opDB = $this->_opDB ;
		$sdomain_db = $this->getSdomainDb( $sdomain_id ) ;
	
		//chargement des champs
		$arr_field_type = array() ;
		$query = "SELECT * FROM {$sdomain_db}.define_bible_tree WHERE bible_code='$bible_code' ORDER BY tree_field_index" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
		{
			$arr_field_type[$arr['tree_field_code']] = $arr['tree_field_type'] ;
		}
		
		$db_table = 'store_bible_'.$bible_code.'_tree' ;
		$arrAssoc_dbField_fieldType = array('treenode_key'=>'varchar(100)','treenode_parent_key'=>'varchar(100)') ;
		$arr_model_keys = array() ;
		$arr_model_keys['PRIMARY'] = array('arr_columns'=>array('treenode_key')) ;
		$arr_model_keys['treenode_parent_key'] = array('non_unique'=>'1','arr_columns'=>array('treenode_parent_key')) ;
		$arrAssoc_crmField_dbField = array() ;
		foreach( $arr_field_type as $field_code => $field_type )
		{
			$field_name = 'field_'.$field_code ;
			switch( $field_type )
			{
				case 'string' :
				$field_name.= '_str' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'varchar(200)' ;
				break ;
				
				case 'number' :
				$field_name.= '_dec' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'decimal(10,2)' ;
				break ;
				
				case 'bool' :
				$field_name.= '_int' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'int(11)' ;
				break ;
				
				case 'date' :
				$field_name.= '_dtm' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'datetime' ;
				break ;
				
				case 'link' :
				$field_name.= '_str' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'varchar(500)' ;
				break ;
				
				default :
				continue 2 ;
			}
			$field_crm = 'field_'.$field_code ;
			$arrAssoc_crmField_dbField[$field_crm] = $field_name ;
		}
		
		DatabaseMgr_Util::syncTableStructure( $sdomain_db , $db_table , $arrAssoc_dbField_fieldType , $arr_model_keys ) ;
		
		$view_name = 'view_bible_'.$bible_code.'_tree' ;
		$query = "DROP VIEW IF EXISTS {$sdomain_db}.{$view_name}" ;
		$_opDB->query($query) ;
		
		$query = "CREATE ALGORITHM=MERGE VIEW {$sdomain_db}.{$view_name} AS SELECT mstr.treenode_key, mstr.treenode_parent_key" ;
		foreach( $arrAssoc_crmField_dbField as $field_crm => $field_name ) {
			if( $field_name == 'treenode_key' ) {
				continue ;
			}
			if( $field_name == 'treenode_parent_key' ) {
				continue ;
			}
		
			$query.= ", mstr.{$field_name} AS {$field_crm}" ;
		}
		$query.= " FROM {$sdomain_db}.{$db_table} mstr" ;
		$_opDB->query($query) ;

		return array($db_table , $arrAssoc_dbField_fieldType , $arr_model_keys, $arrAssoc_crmField_dbField) ;
	}
	public function sdomainDefine_buildBible_entry( $sdomain_id , $bible_code ) {
		$_opDB = $this->_opDB ;
		$sdomain_db = $this->getSdomainDb( $sdomain_id ) ;
	
		// chargement gmap
		$arr_gmap_define = array() ;
		$query = "SELECT gmap_is_on FROM {$sdomain_db}.define_bible WHERE bible_code='$bible_code'" ;
		if( $_opDB->query_uniqueValue($query) == 'O' )
		{
			$arr_gmap_define = $_opDB->table_fields($sdomain_db.'.'.'define_gmap') ;
		}
		//chargement des champs
		$arr_field_type = array() ;
		$query = "SELECT * FROM {$sdomain_db}.define_bible_entry WHERE bible_code='$bible_code' ORDER BY entry_field_index" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
		{
			$arr_field_type[$arr['entry_field_code']] = $arr['entry_field_type'] ;
		}
		
		
		$db_table = 'store_bible_'.$bible_code.'_entry' ;
		$arrAssoc_dbField_fieldType = array('entry_key'=>'varchar(100)','treenode_key'=>'varchar(100)') ;
		$arr_model_keys = array() ;
		$arr_model_keys['PRIMARY'] = array('arr_columns'=>array('entry_key')) ;
		$arr_model_keys['treenode_key'] = array('non_unique'=>'1','arr_columns'=>array('treenode_key')) ;
		$arrAssoc_crmField_dbField = array() ;
		foreach( $arr_gmap_define as $gmap_field ) {
			$gmap_field = 'gmap_'.$gmap_field ;
			$arrAssoc_dbField_fieldType[$gmap_field] = 'varchar(500)' ;
			$arrAssoc_crmField_dbField[$gmap_field] = $gmap_field ;
		}
		foreach( $arr_field_type as $field_code => $field_type )
		{
			$field_name = 'field_'.$field_code ;
			switch( $field_type )
			{
				case 'string' :
				$field_name.= '_str' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'varchar(200)' ;
				break ;
				
				case 'number' :
				$field_name.= '_dec' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'decimal(10,2)' ;
				break ;
				
				case 'bool' :
				$field_name.= '_int' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'int(11)' ;
				break ;
				
				case 'date' :
				$field_name.= '_dtm' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'datetime' ;
				break ;
				
				case 'link' :
				$field_name.= '_str' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'varchar(500)' ;
				break ;
				
				default :
				continue 2 ;
			}
			$field_crm = 'field_'.$field_code ;
			$arrAssoc_crmField_dbField[$field_crm] = $field_name ;
		}
		
		DatabaseMgr_Util::syncTableStructure( $sdomain_db , $db_table , $arrAssoc_dbField_fieldType , $arr_model_keys ) ;

		$view_name = 'view_bible_'.$bible_code.'_entry' ;
		$query = "DROP VIEW IF EXISTS {$sdomain_db}.{$view_name}" ;
		$_opDB->query($query) ;
		
		$query = "CREATE ALGORITHM=MERGE VIEW {$sdomain_db}.{$view_name} AS SELECT mstr.entry_key, mstr.treenode_key" ;
		foreach( $arrAssoc_crmField_dbField as $field_crm => $field_name ) {
			if( $field_name == 'entry_key' ) {
				continue ;
			}
			if( $field_name == 'treenode_key' ) {
				continue ;
			}
		
			$query.= ", mstr.{$field_name} AS {$field_crm}" ;
		}
		$query.= " FROM {$sdomain_db}.{$db_table} mstr" ;
		$_opDB->query($query) ;

		return array($db_table , $arrAssoc_dbField_fieldType , $arr_model_keys, $arrAssoc_crmField_dbField) ;
	}
	public function sdomainDefine_buildFile( $sdomain_id , $file_code ) {
		$_opDB = $this->_opDB ;
		$sdomain_db = $this->getSdomainDb( $sdomain_id ) ;
	
		// chargement gmap
		$arr_gmap_define = array() ;
		$query = "SELECT gmap_is_on FROM {$sdomain_db}.define_file WHERE file_code='$file_code'" ;
		if( $_opDB->query_uniqueValue($query) == 'O' )
		{
			$arr_gmap_define = $_opDB->table_fields($sdomain_db.'.'.'define_gmap') ;
		}
		//chargement des champs
		$query = "SELECT file_type FROM {$sdomain_db}.define_file WHERE file_code='$file_code'" ;
		switch( $_opDB->query_uniqueValue($query) )
		{
			case 'media_img' :
			$arr_field_type = array() ;
			// $arr_media_define = array() ;
			$arr_media_define = $_opDB->table_fields($sdomain_db.'.'.'define_media') ;
			break ;
		
			default :
			$arr_field_type = array() ;
			$arr_media_define = array() ;
			$query = "SELECT * FROM {$sdomain_db}.define_file_entry WHERE file_code='$file_code' ORDER BY entry_field_index" ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
			{
				$arr_field_type[$arr['entry_field_code']] = $arr['entry_field_type'] ;
			}
			break ;
		}
		
		
		
		$db_table = 'store_file_'.$file_code ;
		$arrAssoc_dbField_fieldType = array('filerecord_id'=>'int(11)') ;
		$arr_model_keys = array('PRIMARY'=>array('arr_columns'=>array('filerecord_id'))) ;
		$arrAssoc_crmField_dbField = array() ;
		foreach( $arr_gmap_define as $gmap_field ) {
			$gmap_field = 'gmap_'.$gmap_field ;
			$arrAssoc_dbField_fieldType[$gmap_field] = 'varchar(500)' ;
			$arrAssoc_crmField_dbField[$gmap_field] = $gmap_field ;
		}
		foreach( $arr_media_define as $media_field ) {
			$media_field = 'media_'.$media_field ;
			$arrAssoc_dbField_fieldType[$media_field] = 'varchar(100)' ;
			$arrAssoc_crmField_dbField[$media_field] = $media_field ;
		}
		foreach( $arr_field_type as $field_code => $field_type )
		{
			$field_name = 'field_'.$field_code ;
			switch( $field_type )
			{
				case 'string' :
				$field_name.= '_str' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'varchar(200)' ;
				break ;
				
				case 'number' :
				$field_name.= '_dec' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'decimal(10,2)' ;
				break ;
				
				case 'bool' :
				$field_name.= '_int' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'int(11)' ;
				break ;
				
				case 'date' :
				$field_name.= '_dtm' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'datetime' ;
				break ;
				
				case 'link' :
				$field_name.= '_str' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'varchar(500)' ;
				$arr_model_keys[$field_name] = array('non_unique'=>'1','arr_columns'=>array($field_name)) ;
				break ;
				
				default :
				continue 2 ;
			}
			$field_crm = 'field_'.$field_code ;
			$arrAssoc_crmField_dbField[$field_crm] = $field_name ;
		}
		
		DatabaseMgr_Util::syncTableStructure( $sdomain_db , $db_table , $arrAssoc_dbField_fieldType , $arr_model_keys ) ;
		
		$view_name = 'view_file_'.$file_code ;
		$query = "DROP VIEW IF EXISTS {$sdomain_db}.{$view_name}" ;
		$_opDB->query($query) ;
		
		$query = "CREATE ALGORITHM=MERGE VIEW {$sdomain_db}.{$view_name} AS SELECT mstr.filerecord_id, mstr.filerecord_parent_id" ;
		foreach( $arrAssoc_crmField_dbField as $field_crm => $field_name ) {
			if( $field_name == 'filerecord_id' ) {
				continue ;
			}
		
			$query.= ",data.{$field_name} AS {$field_crm}" ;
		}
		$query.= " FROM {$sdomain_db}.store_file mstr" ;
		$query.= " LEFT JOIN {$sdomain_db}.{$db_table} data ON data.filerecord_id = mstr.filerecord_id" ;
		$query.= " WHERE mstr.file_code='{$file_code}' AND mstr.sync_is_deleted<>'O'" ;
		$_opDB->query($query) ;
		
		$query = "DELETE FROM {$sdomain_db}.{$db_table} WHERE filerecord_id NOT IN (SELECT filerecord_id FROM store_file WHERE file_code='$file_code' AND sync_is_deleted<>'O')" ;
		$_opDB->query($query) ;
		
		return array($db_table , $arrAssoc_dbField_fieldType , $arr_model_keys, $arrAssoc_crmField_dbField) ;
	}
	
	public static function db_getBase() {
		$_opDB = $GLOBALS['_opDB'] ;
	
		$current_database = $_opDB->query_uniqueValue("SELECT DATABASE()") ;
		$base_database = $GLOBALS['mysql_db'] ;
		
		if( !(strpos($current_database,$base_database) === 0) ) {
			return NULL ;
		}
		$ttmp = explode('_',$current_database) ;
		switch( count($ttmp) ) {
			case 4 :
			unset( $ttmp[3] ) ;
			return implode('_',$ttmp) ;
			
			case 3 :
			return $current_database ;
			
			default :
			return NULL ;
		}
	}
	public static function sdomain_getCurrent() {
		$_opDB = $GLOBALS['_opDB'] ;
	
		$current_database = $_opDB->query_uniqueValue("SELECT DATABASE()") ;
		$base_database = $GLOBALS['mysql_db'] ;
		
		if( !(strpos($current_database,$base_database) === 0) ) {
			return NULL ;
		}
		$ttmp = explode('_',$current_database) ;
		switch( count($ttmp) ) {
			case 4 :
			return $ttmp[3] ;
			
			case 3 :
			return NULL ;
			
			default :
			return NULL ;
		}
	}
}
?>