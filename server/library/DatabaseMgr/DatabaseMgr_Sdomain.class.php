<?php
class DatabaseMgr_Sdomain {
	
	private $_opDB ;
	private $domain_id ;
	
	private static $dbVersion = 41 ;
	
	public function __construct( $domain_id ) {
		$this->_opDB = $GLOBALS['_opDB'] ;
		$this->domain_id = $domain_id ;
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

CREATE TABLE `auth_android` (
  `authandroid_id` int(11) NOT NULL AUTO_INCREMENT,
  `device_android_id` varchar(100) NOT NULL,
  `device_is_allowed` varchar(1) NOT NULL,
  `device_desc` varchar(100) NOT NULL,
  `ping_timestamp` int(11) NOT NULL,
  `ping_version` int(11) NOT NULL,
  PRIMARY KEY (`authandroid_id`),
  UNIQUE KEY `device_android_id` (`device_android_id`)
) ;

CREATE TABLE `auth_delegate` (
  `zero_id` int(11) NOT NULL,
  `authdelegate_is_on` varchar(1) NOT NULL,
  `authdelegate_bible_code` varchar(100) NOT NULL,
  `authdelegate_user_bible_field_code` varchar(100) NOT NULL,
  `authdelegate_pass_bible_field_code` varchar(100) NOT NULL,
  `authdelegate_acl_is_on` varchar(1) NOT NULL,
  `authdelegate_acl_bible_field_code` varchar(100) NOT NULL,
  PRIMARY KEY (`zero_id`)
) ;

CREATE TABLE `auth_delegate_log` (
  `authdelegate_log_id` int(11) NOT NULL AUTO_INCREMENT,
  `authdelegate_log_timestamp` int(11) NOT NULL,
  `authdelegate_log_user` varchar(100) NOT NULL,
  `authdelegate_log_ipaddr` varchar(100) NOT NULL,
  `authdelegate_log_failcode` varchar(100) NOT NULL,
  PRIMARY KEY (`authdelegate_log_id`)
) ;

CREATE TABLE `define_bible` (
  `bible_code` varchar(50) NOT NULL,
  `bible_lib` varchar(100) NOT NULL,
  `bible_iconfile` varchar(50) NOT NULL,
  `bible_specdata` varchar(10) NOT NULL,
  `gmap_is_on` varchar(1) NOT NULL,
  `gallery_is_on` varchar(1) NOT NULL,
  PRIMARY KEY (`bible_code`)
) ;

CREATE TABLE `define_bible_entry` (
  `bible_code` varchar(50) NOT NULL,
  `entry_field_code` varchar(20) NOT NULL,
  `entry_field_is_key` varchar(1) NOT NULL,
  `entry_field_index` int(11) NOT NULL,
  `entry_field_lib` varchar(100) NOT NULL,
  `entry_field_type` varchar(10) NOT NULL,
  `entry_field_linktype` varchar(10) NOT NULL,
  `entry_field_linkbible` varchar(50) NOT NULL,
  `entry_field_is_header` varchar(1) NOT NULL,
  `entry_field_is_highlight` varchar(1) NOT NULL,
  PRIMARY KEY (`bible_code`,`entry_field_code`)
) ;

CREATE TABLE `define_bible_tree` (
  `bible_code` varchar(50) NOT NULL,
  `tree_field_code` varchar(20) NOT NULL,
  `tree_field_is_key` varchar(1) NOT NULL,
  `tree_field_index` int(11) NOT NULL,
  `tree_field_lib` varchar(100) NOT NULL,
  `tree_field_type` varchar(10) NOT NULL,
  `tree_field_linktype` varchar(10) NOT NULL,
  `tree_field_linkbible` varchar(50) NOT NULL,
  `tree_field_is_header` varchar(1) NOT NULL,
  `tree_field_is_highlight` varchar(1) NOT NULL,
  PRIMARY KEY (`bible_code`,`tree_field_code`)
) ;

CREATE TABLE `define_file` (
  `file_code` varchar(50) NOT NULL,
  `file_parent_code` varchar(50) NOT NULL,
  `file_iconfile` varchar(50) NOT NULL,
  `file_lib` varchar(100) NOT NULL,
  `file_tags` varchar(500) NOT NULL,
  `file_type` varchar(50) NOT NULL,
  `file_specdata` varchar(10) NOT NULL,
  `gmap_is_on` varchar(1) NOT NULL,
  PRIMARY KEY (`file_code`)
) ;

CREATE TABLE `define_file_cfg_calendar` (
  `file_code` varchar(50) NOT NULL,
  `eventstart_filefield` varchar(20) NOT NULL,
  `eventend_filefield` varchar(20) NOT NULL,
  `eventstatus_filefield` varchar(20) NOT NULL,
  `account_is_on` varchar(1) NOT NULL,
  `account_filefield` varchar(20) NOT NULL,
  `account_boolean_is_on` varchar(1) NOT NULL,
  `account_boolean_biblefield` varchar(20) NOT NULL,
  `duration_is_fixed` varchar(1) NOT NULL,
  `duration_src_filefield` varchar(20) NOT NULL,
  `duration_src_biblefield` varchar(20) NOT NULL,
  `color_is_fixed` varchar(1) NOT NULL,
  `color_filefield` varchar(20) NOT NULL,
  PRIMARY KEY (`file_code`)
) ;

CREATE TABLE `define_file_entry` (
  `file_code` varchar(50) NOT NULL,
  `entry_field_code` varchar(20) NOT NULL,
  `entry_field_index` int(11) NOT NULL,
  `entry_field_lib` varchar(100) NOT NULL,
  `entry_field_type` varchar(10) NOT NULL,
  `entry_field_linktype` varchar(10) NOT NULL,
  `entry_field_linkbible` varchar(50) NOT NULL,
  `entry_field_is_header` varchar(1) NOT NULL,
  `entry_field_is_highlight` varchar(1) NOT NULL,
  `entry_field_is_mandatory` varchar(1) NOT NULL,
  `entry_field_is_primarykey` varchar(1) NOT NULL,
  PRIMARY KEY (`file_code`,`entry_field_code`)
) ;

CREATE TABLE `define_file_entry_join` (
  `file_code` varchar(50) NOT NULL,
  `entry_field_code` varchar(20) NOT NULL,
  `join_target_file_code` varchar(50) NOT NULL,
  `join_select_file_field_code` varchar(20) NOT NULL,
  PRIMARY KEY (`file_code`,`entry_field_code`)
) ;

CREATE TABLE `define_file_entry_join_map` (
  `file_code` varchar(50) NOT NULL,
  `entry_field_code` varchar(20) NOT NULL,
  `join_map_ssid` int(11) NOT NULL,
  `join_target_file_field_code` varchar(20) NOT NULL,
  `join_local_alt_file_code` varchar(50) NOT NULL,
  `join_local_file_field_code` varchar(20) NOT NULL,
  PRIMARY KEY (`file_code`,`entry_field_code`,`join_map_ssid`)
) ;

CREATE TABLE `define_table` (
  `table_code` varchar(50) NOT NULL,
  `table_iconfile` varchar(50) NOT NULL,
  `table_type` varchar(50) NOT NULL,
  `table_specdata` varchar(10) NOT NULL,
  `gmap_is_on` varchar(1) NOT NULL,
  PRIMARY KEY (`table_code`)
) ;

CREATE TABLE `define_table_field` (
  `table_code` varchar(50) NOT NULL,
  `table_field_code` varchar(20) NOT NULL,
  `table_field_index` int(11) NOT NULL,
  `table_field_type` varchar(10) NOT NULL,
  `table_field_is_primarykey` varchar(1) NOT NULL,
  `table_field_is_index` varchar(1) NOT NULL,
  PRIMARY KEY (`table_code`,`table_field_code`)
) ;

CREATE TABLE `define_gmap` (
  `location` varchar(1) NOT NULL,
  `formattedAddress` varchar(1) NOT NULL
) ;

CREATE TABLE `define_media` (
  `title` int(11) NOT NULL,
  `date` datetime NOT NULL,
  `mimetype` varchar(100) NOT NULL
) ;

CREATE TABLE `input_calendar` (
  `calendar_id` int(11) NOT NULL AUTO_INCREMENT,
  `calendar_name` varchar(100) NOT NULL,
  `target_filecode` varchar(100) NOT NULL,
  `is_readonly` varchar(1) NOT NULL,
  `linkscen_is_on` varchar(1) NOT NULL,
  `linkscen_scen_id` int(11) NOT NULL,
  `linkscen_autoforward_is_on` varchar(1) NOT NULL,
  `setdone_is_locked` varchar(1) NOT NULL,
  PRIMARY KEY (`calendar_id`)
) ;

CREATE TABLE `input_explorer_cfg` (
  `explorercfg_id` int(11) NOT NULL,
  `account_is_on` varchar(1) NOT NULL,
  `account_linkbible` varchar(100) NOT NULL,
  `account_boolean_is_on` varchar(1) NOT NULL,
  `account_boolean_biblefield` varchar(20) NOT NULL,
  PRIMARY KEY (`explorercfg_id`)
) ;

CREATE TABLE `input_query_src` (
  `querysrc_id` int(11) NOT NULL AUTO_INCREMENT,
  `querysrc_index` int(11) NOT NULL,
  `target_query_id` int(11) NOT NULL,
  `target_qmerge_id` int(11) NOT NULL,
  `target_qbook_id` int(11) NOT NULL,
  `target_qweb_id` int(11) NOT NULL,
  `target_qsql_id` int(11) NOT NULL,
  PRIMARY KEY (`querysrc_id`)
) ;

CREATE TABLE `input_query_tpl` (
  `querysrc_id` int(11) NOT NULL,
  `querysrc_index` int(11) NOT NULL,
  `querysrc_type` varchar(10) NOT NULL,
  `querysrc_name` varchar(100) NOT NULL,
  PRIMARY KEY (`querysrc_id`)
) ;

CREATE TABLE `input_query_tpl_progress` (
  `querysrc_id` int(11) NOT NULL,
  `querysrc_targetfield_ssid` int(11) NOT NULL,
  `field_is_optional` varchar(1) NOT NULL,
  `field_type` varchar(10) NOT NULL,
  `field_linkbible` varchar(100) NOT NULL,
  `field_lib` varchar(100) NOT NULL,
  PRIMARY KEY (`querysrc_id`,`querysrc_targetfield_ssid`)
) ;

CREATE TABLE `input_query_tpl_where` (
  `querysrc_id` int(11) NOT NULL,
  `querysrc_targetfield_ssid` int(11) NOT NULL,
  `field_is_optional` varchar(1) NOT NULL,
  `field_type` varchar(10) NOT NULL,
  `field_linkbible` varchar(100) NOT NULL,
  `field_lib` varchar(100) NOT NULL,
  PRIMARY KEY (`querysrc_id`,`querysrc_targetfield_ssid`)
) ;

CREATE TABLE `input_scen` (
  `scen_id` int(11) NOT NULL AUTO_INCREMENT,
  `scen_name` varchar(100) NOT NULL,
  `scen_is_hidden` varchar(1) NOT NULL,
  `target_filecode` varchar(100) NOT NULL,
  PRIMARY KEY (`scen_id`)
) ;

CREATE TABLE `input_scen_page` (
  `scen_id` int(11) NOT NULL,
  `scen_page_index` int(11) NOT NULL,
  `scen_page_parent_index` int(11) NOT NULL,
  `scen_page_name` varchar(100) NOT NULL,
  `target_filecode` varchar(100) NOT NULL,
  `page_type` varchar(100) NOT NULL,
  `page_table_type` varchar(100) NOT NULL,
  `autocomplete_is_on` varchar(1) NOT NULL,
  `autocomplete_filter_is_on` varchar(1) NOT NULL,
  `autocomplete_filter_src` varchar(100) NOT NULL,
  PRIMARY KEY (`scen_id`,`scen_page_index`)
) ;

CREATE TABLE `input_scen_page_field` (
  `scen_id` int(11) NOT NULL,
  `scen_page_index` int(11) NOT NULL,
  `scen_page_field_index` int(11) NOT NULL,
  `target_filecode` varchar(100) NOT NULL,
  `target_filefield` varchar(100) NOT NULL,
  `input_cfg_json` varchar(500) NOT NULL,
  `field_autovalue_is_on` varchar(1) NOT NULL,
  `field_autovalue_src` varchar(100) NOT NULL,
  `field_is_pivot` varchar(1) NOT NULL,
  `search_is_condition` varchar(1) NOT NULL,
  `linkfile_is_on` varchar(1) NOT NULL,
  `linkfile_xpressfile_id` int(11) NOT NULL,
  PRIMARY KEY (`scen_id`,`scen_page_index`,`scen_page_field_index`)
) ;

CREATE TABLE `input_scen_pagepivot` (
  `scen_id` int(11) NOT NULL,
  `scen_page_index` int(11) NOT NULL,
  `pivot_type` varchar(100) NOT NULL,
  `target_bible_code` varchar(50) NOT NULL,
  `target_page_index` int(11) NOT NULL,
  `target_page_field_index` int(11) NOT NULL,
  `condition_is_on` varchar(1) NOT NULL,
  `condition_json` varchar(500) NOT NULL,
  `foreignsrc_is_on` varchar(1) NOT NULL,
  `foreignsrc_page_index` int(11) NOT NULL,
  `foreignsrc_page_field_index` int(11) NOT NULL,
  `repeat_foreignsrc_is_on` varchar(1) NOT NULL,
  `repeat_foreignsrc_page_field_index` int(11) NOT NULL,
  PRIMARY KEY (`scen_id`,`scen_page_index`,`pivot_type`)
) ;

CREATE TABLE `input_scen_pagepivot_copymap` (
  `scen_id` int(11) NOT NULL,
  `scen_page_index` int(11) NOT NULL,
  `copydst_page_field_index` int(11) NOT NULL,
  `copysrc_page_field_index` int(11) NOT NULL,
  PRIMARY KEY (`scen_id`,`scen_page_index`,`copydst_page_field_index`)
) ;

CREATE TABLE `input_store_src` (
  `storesrc_id` int(11) NOT NULL AUTO_INCREMENT,
  `target_bible_code` varchar(100) NOT NULL,
  `target_file_code` varchar(100) NOT NULL,
  PRIMARY KEY (`storesrc_id`)
) ;

CREATE TABLE `input_xpressfile` (
  `xpressfile_id` int(11) NOT NULL AUTO_INCREMENT,
  `xpressfile_is_hidden` varchar(1) NOT NULL,
  `target_filecode` varchar(100) NOT NULL,
  `target_primarykey_fieldcode` varchar(100) NOT NULL,
  PRIMARY KEY (`xpressfile_id`)
) ;

CREATE TABLE `qbook` (
  `qbook_id` int(11) NOT NULL AUTO_INCREMENT,
  `qbook_name` varchar(100) NOT NULL,
  `backend_file_code` varchar(100) NOT NULL,
  PRIMARY KEY (`qbook_id`)
) ;

CREATE TABLE `qbook_inputvar` (
  `qbook_id` int(11) NOT NULL,
  `qbook_inputvar_ssid` int(11) NOT NULL,
  `inputvar_lib` varchar(100) NOT NULL,
  `inputvar_type` varchar(100) NOT NULL,
  `inputvar_linktype` varchar(100) NOT NULL,
  `inputvar_linkbible` varchar(100) NOT NULL,
  `src_backend_is_on` varchar(1) NOT NULL,
  `src_backend_file_code` varchar(100) NOT NULL,
  `src_backend_file_field_code` varchar(100) NOT NULL,
  `src_backend_bible_type` varchar(100) NOT NULL,
  `src_backend_bible_field_code` varchar(100) NOT NULL,
  PRIMARY KEY (`qbook_id`,`qbook_inputvar_ssid`)
) ;

CREATE TABLE `qbook_inputvar_date` (
  `qbook_id` int(11) NOT NULL,
  `qbook_inputvar_ssid` int(11) NOT NULL,
  `date_align_is_on` varchar(1) NOT NULL,
  `date_align_segment_type` varchar(50) NOT NULL,
  `date_align_direction_end` varchar(1) NOT NULL,
  `date_calc_is_on` varchar(1) NOT NULL,
  `date_calc_segment_type` varchar(50) NOT NULL,
  `date_calc_segment_count` int(11) NOT NULL,
  PRIMARY KEY (`qbook_id`,`qbook_inputvar_ssid`)
) ;

CREATE TABLE `qbook_qobj` (
  `qbook_id` int(11) NOT NULL,
  `qbook_qobj_ssid` int(11) NOT NULL,
  `qobj_lib` varchar(100) NOT NULL,
  `target_q_type` varchar(50) NOT NULL,
  `target_query_id` int(11) NOT NULL,
  `target_qmerge_id` int(11) NOT NULL,
  PRIMARY KEY (`qbook_id`,`qbook_qobj_ssid`)
) ;

CREATE TABLE `qbook_qobj_field` (
  `qbook_id` int(11) NOT NULL,
  `qbook_qobj_ssid` int(11) NOT NULL,
  `target_query_wherefield_idx` int(11) NOT NULL DEFAULT '-1',
  `target_qmerge_mwherefield_idx` int(11) NOT NULL DEFAULT '-1',
  `target_subfield` varchar(100) NOT NULL,
  `field_type` varchar(100) NOT NULL,
  `field_linkbible` varchar(100) NOT NULL,
  `src_inputvar_idx` int(11) NOT NULL DEFAULT '-1',
  PRIMARY KEY (`qbook_id`,`qbook_qobj_ssid`,`target_query_wherefield_idx`,`target_qmerge_mwherefield_idx`,`target_subfield`)
) ;

CREATE TABLE `qbook_value` (
  `qbook_id` int(11) NOT NULL,
  `qbook_value_ssid` int(11) NOT NULL,
  `select_lib` varchar(100) NOT NULL,
  `math_round` int(11) NOT NULL,
  PRIMARY KEY (`qbook_id`,`qbook_value_ssid`)
) ;

CREATE TABLE `qbook_value_symbol` (
  `qbook_id` int(11) NOT NULL,
  `qbook_value_ssid` int(11) NOT NULL,
  `qbook_value_symbol_index` int(11) NOT NULL,
  `sequence` int(11) NOT NULL,
  `math_operation` varchar(50) NOT NULL,
  `math_parenthese_in` varchar(1) NOT NULL,
  `math_operand_inputvar_idx` int(11) NOT NULL DEFAULT '-1',
  `math_operand_qobj_idx` int(11) NOT NULL DEFAULT '-1',
  `math_operand_selectfield_idx` int(11) NOT NULL DEFAULT '-1',
  `math_operand_mselectfield_idx` int(11) NOT NULL DEFAULT '-1',
  `math_staticvalue` decimal(10,3) NOT NULL,
  `math_parenthese_out` varchar(1) NOT NULL,
  PRIMARY KEY (`qbook_id`,`qbook_value_ssid`,`qbook_value_symbol_index`)
) ;

CREATE TABLE `qbook_value_saveto` (
  `qbook_id` int(11) NOT NULL,
  `qbook_value_ssid` int(11) NOT NULL,
  `qbook_value_saveto_index` int(11) NOT NULL,
  `target_backend_file_code` varchar(100) NOT NULL,
  `target_backend_file_field_code` varchar(100) NOT NULL,
  PRIMARY KEY (`qbook_id`,`qbook_value_ssid`,`qbook_value_saveto_index`)
) ;

CREATE TABLE `qbook_ztemplate` (
  `qbook_id` int(11) NOT NULL,
  `qbook_ztemplate_ssid` int(11) NOT NULL,
  `ztemplate_name` varchar(100) NOT NULL,
  `ztemplate_metadata_filename` varchar(100) NOT NULL,
  `ztemplate_metadata_date` datetime NOT NULL,
  `ztemplate_resource_binary` longblob NOT NULL,
  PRIMARY KEY (`qbook_id`,`qbook_ztemplate_ssid`)
) ;


CREATE TABLE `qmerge` (
  `qmerge_id` int(11) NOT NULL AUTO_INCREMENT,
  `qmerge_name` varchar(100) NOT NULL,
  PRIMARY KEY (`qmerge_id`)
) ;

CREATE TABLE `qmerge_field_mselect` (
  `qmerge_id` int(11) NOT NULL,
  `qmerge_fieldmselect_ssid` int(11) NOT NULL,
  `select_lib` varchar(100) NOT NULL,
  `math_func_mode` varchar(10) NOT NULL,
  `math_func_group` varchar(10) NOT NULL,
  `math_round` int(11) NOT NULL,
  PRIMARY KEY (`qmerge_id`,`qmerge_fieldmselect_ssid`)
) ;

CREATE TABLE `qmerge_field_mselect_axisdetach` (
  `qmerge_id` int(11) NOT NULL,
  `qmerge_fieldmselect_ssid` int(11) NOT NULL,
  `display_geometry` varchar(20) NOT NULL,
  `axis_is_detach` varchar(1) NOT NULL,
  PRIMARY KEY (`qmerge_id`,`qmerge_fieldmselect_ssid`,`display_geometry`)
) ;

CREATE TABLE `qmerge_field_mselect_symbol` (
  `qmerge_id` int(11) NOT NULL,
  `qmerge_fieldmselect_ssid` int(11) NOT NULL,
  `qmerge_fieldmselect_symbol_index` int(11) NOT NULL,
  `sequence` int(11) NOT NULL,
  `math_operation` varchar(50) NOT NULL,
  `math_parenthese_in` varchar(1) NOT NULL,
  `math_operand_query_id` int(11) NOT NULL,
  `math_operand_selectfield_idx` int(11) NOT NULL,
  `math_staticvalue` decimal(10,3) NOT NULL,
  `math_parenthese_out` varchar(1) NOT NULL,
  PRIMARY KEY (`qmerge_id`,`qmerge_fieldmselect_ssid`,`qmerge_fieldmselect_symbol_index`)
) ;

CREATE TABLE `qmerge_field_mwhere` (
  `qmerge_id` int(11) NOT NULL,
  `qmerge_fieldmwhere_ssid` int(11) NOT NULL,
  `mfield_type` varchar(100) NOT NULL,
  `mfield_linkbible` varchar(100) NOT NULL,
  `condition_forcevalue_isset` varchar(1) NOT NULL,
  `condition_forcevalue_value` decimal(10,3) NOT NULL,
  `condition_bool` varchar(100) NOT NULL,
  `condition_string` varchar(100) NOT NULL,
  `condition_date_lt` date NOT NULL,
  `condition_date_gt` date NOT NULL,
  `condition_num_lt` decimal(10,3) NOT NULL,
  `condition_num_gt` decimal(10,3) NOT NULL,
  `condition_num_eq` decimal(10,3) NOT NULL,
  `condition_bible_mode` varchar(50) NOT NULL,
  `condition_bible_treenodes` varchar(500) NOT NULL,
  `condition_bible_entries` varchar(500) NOT NULL,
  `extrapolate_src_date_from` date NOT NULL,
  `extrapolate_calc_date_from` date NOT NULL,
  `extrapolate_calc_date_to` date NOT NULL,
  PRIMARY KEY (`qmerge_id`,`qmerge_fieldmwhere_ssid`)
) ;

CREATE TABLE `qmerge_field_mwhere_link` (
  `qmerge_id` int(11) NOT NULL,
  `qmerge_fieldmwhere_ssid` int(11) NOT NULL,
  `query_id` int(11) NOT NULL,
  `query_wherefield_idx` int(11) NOT NULL DEFAULT '-1',
  `query_groupfield_idx` int(11) NOT NULL DEFAULT '-1',
  PRIMARY KEY (`qmerge_id`,`qmerge_fieldmwhere_ssid`,`query_id`,`query_wherefield_idx`,`query_groupfield_idx`)
) ;

CREATE TABLE `qmerge_query` (
  `qmerge_id` int(11) NOT NULL,
  `qmerge_query_ssid` int(11) NOT NULL,
  `link_query_id` int(11) NOT NULL,
  PRIMARY KEY (`qmerge_id`,`qmerge_query_ssid`)
) ;

CREATE TABLE `query` (
  `query_id` int(11) NOT NULL AUTO_INCREMENT,
  `query_name` varchar(100) NOT NULL,
  `target_file_code` varchar(100) NOT NULL,
  PRIMARY KEY (`query_id`)
) ;

CREATE TABLE `query_field_group` (
  `query_id` int(11) NOT NULL,
  `query_fieldgroup_ssid` int(11) NOT NULL,
  `field_code` varchar(100) NOT NULL,
  `field_type` varchar(100) NOT NULL,
  `field_linkbible` varchar(100) NOT NULL,
  `display_geometry` varchar(50) NOT NULL,
  `group_file_limit_nb` int(11) NOT NULL,
  `group_file_display_record` varchar(500) NOT NULL,
  `group_bible_type` varchar(50) NOT NULL,
  `group_bible_tree_depth` int(11) NOT NULL,
  `group_bible_display_treenode` varchar(500) NOT NULL,
  `group_bible_display_entry` varchar(500) NOT NULL,
  `group_date_type` varchar(50) NOT NULL,
  `group_date_is_desc` varchar(1) NOT NULL,
  `extrapolate_is_on` varchar(1) NOT NULL,
  `extrapolate_src_date_from` date NOT NULL,
  `extrapolate_calc_date_from` date NOT NULL,
  `extrapolate_calc_date_to` date NOT NULL,
  PRIMARY KEY (`query_id`,`query_fieldgroup_ssid`)
) ;

CREATE TABLE `query_field_progress` (
  `query_id` int(11) NOT NULL,
  `query_fieldprogress_ssid` int(11) NOT NULL,
  `field_code` varchar(100) NOT NULL,
  `field_type` varchar(100) NOT NULL,
  `field_linkbible` varchar(100) NOT NULL,
  `condition_forcevalue_isset` varchar(1) NOT NULL,
  `condition_forcevalue_value` decimal(10,3) NOT NULL,
  `condition_bool` varchar(100) NOT NULL,
  `condition_string` varchar(100) NOT NULL,
  `condition_date_lt` date NOT NULL,
  `condition_date_gt` date NOT NULL,
  `condition_num_lt` decimal(10,3) NOT NULL,
  `condition_num_gt` decimal(10,3) NOT NULL,
  `condition_num_eq` decimal(10,3) NOT NULL,
  `condition_bible_mode` varchar(50) NOT NULL,
  `condition_bible_treenodes` varchar(500) NOT NULL,
  `condition_bible_entries` varchar(500) NOT NULL,
  PRIMARY KEY (`query_id`,`query_fieldprogress_ssid`)
) ;

CREATE TABLE `query_field_select` (
  `query_id` int(11) NOT NULL,
  `query_fieldselect_ssid` int(11) NOT NULL,
  `select_lib` varchar(100) NOT NULL,
  `math_func_mode` varchar(10) NOT NULL,
  `math_func_group` varchar(10) NOT NULL,
  `math_round` int(11) NOT NULL,
  PRIMARY KEY (`query_id`,`query_fieldselect_ssid`)
) ;

CREATE TABLE `query_field_select_symbol` (
  `query_id` int(11) NOT NULL,
  `query_fieldselect_ssid` int(11) NOT NULL,
  `query_fieldselect_symbol_index` int(11) NOT NULL,
  `sequence` int(11) NOT NULL,
  `math_operation` varchar(50) NOT NULL,
  `math_parenthese_in` varchar(1) NOT NULL,
  `math_fieldoperand` varchar(100) NOT NULL,
  `math_staticvalue` decimal(10,3) NOT NULL,
  `math_parenthese_out` varchar(1) NOT NULL,
  PRIMARY KEY (`query_id`,`query_fieldselect_ssid`,`query_fieldselect_symbol_index`)
) ;

CREATE TABLE `query_field_where` (
  `query_id` int(11) NOT NULL,
  `query_fieldwhere_ssid` int(11) NOT NULL,
  `field_code` varchar(100) NOT NULL,
  `field_type` varchar(100) NOT NULL,
  `field_linkbible` varchar(100) NOT NULL,
  `condition_forcevalue_isset` varchar(1) NOT NULL,
  `condition_forcevalue_value` decimal(10,3) NOT NULL,
  `condition_bool` varchar(100) NOT NULL,
  `condition_string` varchar(100) NOT NULL,
  `condition_date_lt` date NOT NULL,
  `condition_date_gt` date NOT NULL,
  `condition_num_lt` decimal(10,3) NOT NULL,
  `condition_num_gt` decimal(10,3) NOT NULL,
  `condition_num_eq` decimal(10,3) NOT NULL,
  `condition_bible_mode` varchar(50) NOT NULL,
  `condition_bible_treenodes` varchar(500) NOT NULL,
  `condition_bible_entries` varchar(500) NOT NULL,
  PRIMARY KEY (`query_id`,`query_fieldwhere_ssid`)
) ;

CREATE TABLE `querygrid_template` (
  `query_id` int(11) NOT NULL,
  `template_is_on` varchar(1) NOT NULL,
  `color_key` varchar(20) NOT NULL,
  `colorhex_columns` varchar(10) NOT NULL,
  `colorhex_row` varchar(10) NOT NULL,
  `colorhex_row_alt` varchar(10) NOT NULL,
  `data_align` varchar(10) NOT NULL,
  `data_select_is_bold` varchar(1) NOT NULL,
  `data_progress_is_bold` varchar(1) NOT NULL,
  PRIMARY KEY (`query_id`)
) ;

CREATE TABLE `qweb` (
  `qweb_id` int(11) NOT NULL AUTO_INCREMENT,
  `qweb_name` varchar(100) NOT NULL,
  `target_resource_qweb` varchar(100) NOT NULL,
  PRIMARY KEY (`qweb_id`)
) ;

CREATE TABLE `qweb_field_qwhere` (
  `qweb_id` int(11) NOT NULL,
  `qweb_fieldqwhere_ssid` int(11) NOT NULL,
  `qweb_fieldqwhere_desc` varchar(100) NOT NULL,
  `target_resource_qweb_key` varchar(100) NOT NULL,
  `qfield_is_optional` varchar(1) NOT NULL,
  `qfield_type` varchar(100) NOT NULL,
  `qfield_linkbible` varchar(100) NOT NULL,
  PRIMARY KEY (`qweb_id`,`qweb_fieldqwhere_ssid`)
) ;

CREATE TABLE `qsql` (
  `qsql_id` int(11) NOT NULL AUTO_INCREMENT,
  `qsql_name` varchar(100) NOT NULL,
  `qsql_tags` varchar(500) NOT NULL,
  `sql_querystring` text NOT NULL,
  `sql_is_rw` varchar(1) NOT NULL,
  `autorun_is_on` varchar(1) NOT NULL,
  `autorun_cfg_json` varchar(200) NOT NULL,
  `token_is_on` varchar(1) NOT NULL,
  `token_cfg_json` text NOT NULL,
  PRIMARY KEY (`qsql_id`)
) ;

CREATE TABLE `qsql_autorun` (
  `qsql_autorun_id` int(11) NOT NULL AUTO_INCREMENT,
  `qsql_id` varchar(100) NOT NULL,
  `exec_ts` int(11) NOT NULL,
  `exec_duration` float NOT NULL,
  PRIMARY KEY (`qsql_autorun_id`),
  INDEX ( `qsql_id` )
) ;

CREATE TABLE `q_cfgchart` (
  `q_type` varchar(20) NOT NULL,
  `q_id` int(11) NOT NULL,
  `charts_is_enabled` varchar(1) NOT NULL,
  PRIMARY KEY (`q_type`,`q_id`)
) ;

CREATE TABLE `q_chart` (
  `q_type` varchar(20) NOT NULL,
  `q_id` int(11) NOT NULL,
  `chart_index` int(11) NOT NULL,
  `chart_name` varchar(100) NOT NULL,
  `chart_type` varchar(20) NOT NULL,
  `tomixed_is_on` varchar(1) NOT NULL,
  `tomixed_axis` varchar(20) NOT NULL,
  PRIMARY KEY (`q_type`,`q_id`,`chart_index`)
) ;

CREATE TABLE `q_chart_iterationdot` (
  `q_type` varchar(20) NOT NULL,
  `q_id` int(11) NOT NULL,
  `chart_index` int(11) NOT NULL,
  `iterationdot_ssid` int(11) NOT NULL,
  `group_tagid` varchar(100) NOT NULL,
  PRIMARY KEY (`q_type`,`q_id`,`chart_index`,`iterationdot_ssid`)
) ;

CREATE TABLE `q_chart_serie` (
  `q_type` varchar(20) NOT NULL,
  `q_id` int(11) NOT NULL,
  `chart_index` int(11) NOT NULL,
  `serie_ssid` int(11) NOT NULL,
  `serie_color` varchar(10) NOT NULL,
  `data_selectid` varchar(100) NOT NULL,
  PRIMARY KEY (`q_type`,`q_id`,`chart_index`,`serie_ssid`)
) ;

CREATE TABLE `q_chart_serie_pivotdot` (
  `q_type` varchar(20) NOT NULL,
  `q_id` int(11) NOT NULL,
  `chart_index` int(11) NOT NULL,
  `serie_ssid` int(11) NOT NULL,
  `serie_pivotdot_ssid` int(11) NOT NULL,
  `group_tagid` varchar(100) NOT NULL,
  `group_key` varchar(100) NOT NULL,
  PRIMARY KEY (`q_type`,`q_id`,`chart_index`,`serie_ssid`,`serie_pivotdot_ssid`)
) ;

CREATE TABLE `importmap` (
  `importmap_id` int(11) NOT NULL AUTO_INCREMENT,
  `csvsrc_length` int(11) NOT NULL,
  `target_biblecode` varchar(100) NOT NULL,
  `target_filecode` varchar(100) NOT NULL,
  `target_tablecode` varchar(100) NOT NULL,
  `truncate_mode` varchar(100) NOT NULL,
  PRIMARY KEY (`importmap_id`)
) ;

CREATE TABLE `importmap_column` (
  `importmap_id` int(11) NOT NULL,
  `importmap_column_ssid` int(11) NOT NULL,
  `csvsrc_headertxt` varchar(100) NOT NULL,
  `target_fieldmapcode` varchar(500) NOT NULL,
  PRIMARY KEY (`importmap_id`,`importmap_column_ssid`)
) ;

CREATE TABLE `import_log` (
  `importlog_id` int(11) NOT NULL AUTO_INCREMENT,
  `request_ts` int(11) NOT NULL,
  `request_user` varchar(500) NOT NULL,
  `request_ip` varchar(500) NOT NULL,
  `request_size` int(11) NOT NULL,
  `store_type` varchar(500) NOT NULL,
  `store_code` varchar(500) NOT NULL,
  `importmap_id` int(11) NOT NULL,
  `log_success` varchar(1) NOT NULL,
  `log_duration` float NOT NULL,
  PRIMARY KEY (`importlog_id`)
) ;

CREATE TABLE `q_log` (
  `qlog_id` int(11) NOT NULL AUTO_INCREMENT,
  `request_ts` int(11) NOT NULL,
  `request_user` varchar(500) NOT NULL,
  `request_ip` varchar(500) NOT NULL,
  `q_type` varchar(500) NOT NULL,
  `q_id` int(11) NOT NULL,
  `q_name` varchar(500) NOT NULL,
  `log_success` varchar(1) NOT NULL,
  `log_duration` float NOT NULL,
  PRIMARY KEY (`qlog_id`)
) ;


EOF;
	}
	
	public function getSdomainDb( $sdomain_id ) {
		return DatabaseMgr_Base::getBaseDb( $this->domain_id ).'_'.strtolower($sdomain_id) ;
	}
	
	public function sdomains_getAll() {
		$_opDB = $this->_opDB ;
		$base_db = DatabaseMgr_Base::getBaseDb( $this->domain_id ) ;
		
		$arr_sdomainId = array() ;
		
		$result = $_opDB->query("SHOW DATABASES") ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$db = $arr[0] ;
			if( strpos($db,$base_db.'_') === 0 ) {
				$arr_sdomainId[] = substr($db,strlen($base_db.'_')) ;
			}
		}
		
		return $arr_sdomainId ;
	}
	
	public function sdomainDb_exists( $sdomain_id ) {
		$_opDB = $this->_opDB ;
		$sdomain_db = $this->getSdomainDb( $sdomain_id ) ;
		
		if( $_opDB->num_rows( $_opDB->query("SHOW DATABASES LIKE '{$sdomain_db}'") ) == 1 ) {
			return TRUE ;
		} else {
			return FALSE ;
		}
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
		$db_version = $_opDB->query_uniqueValue($query) ;
		if( $db_version < self::version_getVcode() ) {
			return TRUE ;
		}
		return FALSE ;
	}
	public function sdomainDb_updateSchema( $sdomain_id, $fast=FALSE ) {
		$_opDB = $this->_opDB ;
		$sdomain_db = $this->getSdomainDb( $sdomain_id ) ;
		
		DatabaseMgr_Util::syncSQLschema( $this->getSdomainDb( $sdomain_id ), self::version_getSchema() ) ;
		if( !$fast ) {
			$this->sdomainDefine_buildAll($sdomain_id) ;
		}
		
		$query = "INSERT IGNORE INTO {$sdomain_db}._DB_INFO (`zero_id`) VALUES ('0')" ;
		$_opDB->query($query) ;
		$db_version = self::version_getVcode() ;
		$query = "UPDATE {$sdomain_db}._DB_INFO SET db_version='$db_version' WHERE zero_id='0'" ;
		$_opDB->query($query) ;
	}
	
	public function sdomainDb_purgeStore( $sdomain_id ) {
		$_opDB = $this->_opDB ;
		$sdomain_db = $this->getSdomainDb( $sdomain_id ) ;
		
		$this->sdomainDefine_buildAll( $sdomain_id ) ;
		
		$query = "SELECT bible_code FROM {$sdomain_db}.define_bible" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$bible_code = $arr[0] ;
			
			$query = "TRUNCATE TABLE {$sdomain_db}.store_bible_{$bible_code}_tree" ;
			$_opDB->query($query) ;
			$query = "TRUNCATE TABLE {$sdomain_db}.store_bible_{$bible_code}_entry" ;
			$_opDB->query($query) ;
		}
		
		$query = "SELECT file_code FROM {$sdomain_db}.define_file" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$file_code = $arr[0] ;
			
			$query = "TRUNCATE TABLE {$sdomain_db}.store_file_{$file_code}" ;
			$_opDB->query($query) ;
		}
		
		$query = "SELECT table_code FROM {$sdomain_db}.define_table" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$table_code = $arr[0] ;
			
			$query = "TRUNCATE TABLE {$sdomain_db}.store_table_{$table_code}" ;
			$_opDB->query($query) ;
		}
	}
	
	public function sdomainDb_clone( $src_sdomain_id, $dst_sdomain_id ) {
		$_opDB = $this->_opDB ;
		$src_sdomain_db = $this->getSdomainDb( $src_sdomain_id ) ;
		
		if( $this->sdomainDb_needUpdate( $src_sdomain_id ) ) {
			throw new Exception("SDOMAIN_NEEDUPDATE");
		}
		
		$query = "SHOW DATABASES" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			if( $arr[0] == $src_sdomain_db ) {
				$found = TRUE ;
			}
		}
		if( !$found ) {
			throw new Exception("SDOMAIN_NOTFOUND");
		}
		
		$dst_sdomain_db = $this->getSdomainDb( $dst_sdomain_id ) ;
		$this->sdomainDb_delete( $dst_sdomain_id ) ;
		$query = "CREATE DATABASE $dst_sdomain_db" ;
		$_opDB->query($query) ;
		DatabaseMgr_Util::clone_DB( $src_sdomain_db, $dst_sdomain_db ) ;
		$this->sdomainDefine_buildAll($dst_sdomain_id) ;
	}
	
	
	
	
	public function sdomainDefine_buildAll($sdomain_id) {
		$_opDB = $this->_opDB ;
		$sdomain_db = $this->getSdomainDb( $sdomain_id ) ;
		
		$query = "SELECT bible_code FROM {$sdomain_db}.define_bible" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$bible_code = $arr[0] ;
			$this->sdomainDefine_buildBible( $sdomain_id , $bible_code ) ;
		}
		
		$query = "SELECT file_code FROM {$sdomain_db}.define_file" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$file_code = $arr[0] ;
			$this->sdomainDefine_buildFilePrivate( $sdomain_id , $file_code ) ;
		}
		$this->sdomainDefine_buildFilesVuid( $sdomain_id ) ;
		
		$query = "SELECT table_code FROM {$sdomain_db}.define_table" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$table_code = $arr[0] ;
			$this->sdomainDefine_buildTable( $sdomain_id , $table_code ) ;
		}
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
				$arrAssoc_dbField_fieldType[$field_name] = 'varchar(500)' ;
				break ;
				
				case 'stringplus' :
				$field_name.= '_str' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'text' ;
				break ;
				
				case 'number' :
				$field_name.= '_dec' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'decimal(10,3)' ;
				break ;
				
				case 'bool' :
				$field_name.= '_int' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'int(11)' ;
				break ;
				
				case 'extid' :
				$field_name.= '_int' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'bigint(20)' ;
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
				$arrAssoc_dbField_fieldType[$field_name] = 'varchar(500)' ;
				break ;
				
				case 'stringplus' :
				$field_name.= '_str' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'text' ;
				break ;
				
				case 'number' :
				$field_name.= '_dec' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'decimal(10,3)' ;
				break ;
				
				case 'bool' :
				$field_name.= '_int' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'int(11)' ;
				break ;
				
				case 'extid' :
				$field_name.= '_int' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'bigint(20)' ;
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
		$return = $this->sdomainDefine_buildFilePrivate( $sdomain_id , $file_code ) ;
		$this->sdomainDefine_buildFilesVuid( $sdomain_id ) ;
		return $return ;
	}
	private function sdomainDefine_buildFilePrivate( $sdomain_id , $file_code ) {
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
		$file_type = $_opDB->query_uniqueValue($query) ;
		switch( $file_type )
		{
			case 'file_primarykey' :
			$_mode_primaryKey = TRUE ;
			$arr_field_isPrimaryKey = array() ;
			$primaryKey_arrColumns = array() ;
			default :
			$arr_field_type = array() ;
			$arr_field_isIndex = array() ;
			$arr_media_define = array() ;
			$query = "SELECT * FROM {$sdomain_db}.define_file_entry WHERE file_code='$file_code' ORDER BY entry_field_index" ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
			{
				$arr_field_type[$arr['entry_field_code']] = $arr['entry_field_type'] ;
				$arr_field_isIndex[$arr['entry_field_code']] = ($arr['entry_field_is_header'] == 'O') ;
				if( $_mode_primaryKey ) {
					$arr_field_isPrimaryKey[$arr['entry_field_code']] = ($arr['entry_field_is_primarykey'] == 'O') ;
				}
			}
			break ;
		}
		if( $file_type == 'media_img' ) {
			$arr_media_define = $_opDB->table_fields($sdomain_db.'.'.'define_media') ;
		}
		
		
		
		$db_table = 'store_file_'.$file_code ;
		$arrAssoc_dbField_fieldType = array(
			'filerecord_id'=>'int(11)',
			'filerecord_parent_id' => 'int(11)',
			'sync_vuid' => 'varchar(100)',
			'sync_is_deleted' => 'varchar(1)',
			'sync_timestamp' => 'int(11)',
			'dsc_is_locked' => 'varchar(1)'
		) ;
		$arr_model_keys = array(
			'PRIMARY'=>array('arr_columns'=>array('filerecord_id')),
			'filerecord_parent_id' => array('non_unique'=>'1','arr_columns'=>array('filerecord_parent_id')),
			'sync_vuid' => array('non_unique'=>'1','arr_columns'=>array('sync_vuid'))
		) ;
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
				$arrAssoc_dbField_fieldType[$field_name] = 'varchar(500)' ;
				if( $field_type!='stringplus' && $arr_field_isIndex[$field_code] ) {
					$arr_model_keys[$field_name] = array('non_unique'=>'1','arr_columns'=>array($field_name)) ;
				}
				if( $field_type!='stringplus' && $_mode_primaryKey && $arr_field_isPrimaryKey[$field_code] ) {
					$arrAssoc_dbField_fieldType[$field_name] = 'varchar(50)' ;
				}
				break ;
				
				case 'stringplus' :
				$field_name.= '_str' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'text' ;
				break ;
				
				case 'number' :
				$field_name.= '_dec' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'decimal(10,3)' ;
				if( $_mode_primaryKey && $arr_field_isPrimaryKey[$field_code] ) {
					$arrAssoc_dbField_fieldType[$field_name] = 'int(11)' ;
				}
				break ;
				
				case 'bool' :
				$field_name.= '_int' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'int(11)' ;
				break ;
				
				case 'extid' :
				$field_name.= '_int' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'bigint(20)' ;
				$arr_model_keys[$field_name] = array('non_unique'=>'1','arr_columns'=>array($field_name)) ;
				break ;
				
				case 'date' :
				$field_name.= '_dtm' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'datetime' ;
				if( $arr_field_isIndex[$field_code] ) {
					$arr_model_keys[$field_name] = array('non_unique'=>'1','arr_columns'=>array($field_name)) ;
				}
				break ;
				
				case 'link' :
				$field_name.= '_str' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'varchar(50)' ;
				if( TRUE ) {
					$arr_model_keys[$field_name] = array('non_unique'=>'1','arr_columns'=>array($field_name)) ;
				}
				break ;
				
				case 'join' :
				$field_name = NULL ;
				break ;
				
				default :
				continue 2 ;
			}
			$field_crm = 'field_'.$field_code ;
			$arrAssoc_crmField_dbField[$field_crm] = $field_name ;
			
			if( $_mode_primaryKey && $arr_field_isPrimaryKey[$field_code] && is_array($primaryKey_arrColumns) ) {
				$primaryKey_arrColumns[] = $field_name ;
			}
		}
		if( $_mode_primaryKey && is_array($primaryKey_arrColumns) && count($primaryKey_arrColumns) > 0 ) {
			//$arr_model_keys['CRM_PRIMARY'] = array('non_unique'=>'1','arr_columns'=>$primaryKey_arrColumns) ;
		}
		
		DatabaseMgr_Util::syncTableStructure( $sdomain_db , $db_table , $arrAssoc_dbField_fieldType , $arr_model_keys ) ;
		$query = "ALTER TABLE {$sdomain_db}.{$db_table} MODIFY filerecord_id int(11) NOT NULL AUTO_INCREMENT" ;
		$_opDB->query($query) ;
		
		$view_name = 'view_file_'.$file_code ;
		$query = "DROP VIEW IF EXISTS {$sdomain_db}.{$view_name}" ;
		$_opDB->query($query) ;
		
		$query = "CREATE ALGORITHM=MERGE VIEW {$sdomain_db}.{$view_name} AS SELECT data.filerecord_id, data.filerecord_parent_id, data.dsc_is_locked" ;
		foreach( $arrAssoc_crmField_dbField as $field_crm => $field_name ) {
			if( $field_name == 'filerecord_id' ) {
				continue ;
			}
			if( $field_name == NULL ) {
				$query.= ",'@JOIN' AS {$field_crm}" ;
				continue ;
			}
		
			$query.= ",data.{$field_name} AS {$field_crm}" ;
		}
		$query.= " FROM {$sdomain_db}.{$db_table} data" ;
		$query.= " WHERE data.sync_is_deleted<>'O'" ;
		$query.= " " ;
		$_opDB->query($query) ;
		
		return array($db_table , $arrAssoc_dbField_fieldType , $arr_model_keys, $arrAssoc_crmField_dbField) ;
	}
	private function sdomainDefine_buildFilesVuid( $sdomain_id ) {
		$_opDB = $this->_opDB ;
		$sdomain_db = $this->getSdomainDb( $sdomain_id ) ;
		$view_name = 'view_files_syncvuid' ;
		
		$query = "DROP VIEW IF EXISTS {$sdomain_db}.{$view_name}" ;
		$_opDB->query($query) ;
		
		$arr_fileCodes = array() ;
		$query = "SELECT file_code FROM {$sdomain_db}.define_file ORDER BY file_code" ;
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$arr_fileCodes[] = $arr[0] ;
		}
		if( !$arr_fileCodes ) {
			return ;
		}
		
		$union_queries = array() ;
		foreach( $arr_fileCodes as $file_code ) {
			$union_queries[] = "SELECT '{$file_code}' as file_code , filerecord_id, sync_vuid 
				FROM {$sdomain_db}.store_file_{$file_code}" ;
		}
		
		$query = "CREATE ALGORITHM=MERGE VIEW {$sdomain_db}.{$view_name} AS ".implode(' UNION ALL ',$union_queries) ;
		$_opDB->query($query) ;
	}
	public function sdomainDefine_buildTable( $sdomain_id , $table_code ) {
		$_opDB = $this->_opDB ;
		$sdomain_db = $this->getSdomainDb( $sdomain_id ) ;
	
		//chargement des champs
		$query = "SELECT table_type FROM {$sdomain_db}.define_table WHERE table_code='$table_code'" ;
		$file_type = $_opDB->query_uniqueValue($query) ;
		switch( $file_type )
		{
			case 'table_primarykey' :
			case 'table_primarykey_binary' :
			$_mode_primaryKey = TRUE ;
			$arr_field_isPrimaryKey = array() ;
			$primaryKey_arrColumns = array() ;
			default :
			$arr_field_type = array() ;
			$arr_field_isIndex = array() ;
			$arr_media_define = array() ;
			$query = "SELECT * FROM {$sdomain_db}.define_table_field WHERE table_code='$table_code' ORDER BY table_field_index" ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
			{
				$arr_field_type[$arr['table_field_code']] = $arr['table_field_type'] ;
				$arr_field_isIndex[$arr['table_field_code']] = ($arr['table_field_is_index'] == 'O') ;
				if( $_mode_primaryKey && ($arr['table_field_is_primarykey'] == 'O') ) {
					$arr_field_isPrimaryKey[$arr['table_field_code']] = TRUE ;
				}
			}
			break ;
		}
		if( $file_type == 'table_primarykey_binary' ) {
			$arr_media_define = $_opDB->table_fields($sdomain_db.'.'.'define_media') ;
		}
		
		
		
		$db_table = 'store_table_'.$table_code ;
		$arrAssoc_dbField_fieldType = array() ;
		$arrAssoc_crmField_dbField = array() ;
		$arr_model_keys = array() ;
		foreach( $arr_field_type as $field_code => $field_type )
		{
			$field_name = ''.$field_code ;
			switch( $field_type )
			{
				case 'string' :
				$field_name.= '_str' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'varchar(500)' ;
				if( count($arr_field_type) > 50 ) {
					$arrAssoc_dbField_fieldType[$field_name] = 'varchar(200)' ;
				}
				if( $field_type!='stringplus' && $arr_field_isIndex[$field_code] ) {
					$arr_model_keys[$field_name] = array('non_unique'=>'1','arr_columns'=>array($field_name)) ;
				}
				if( $field_type!='stringplus' && $_mode_primaryKey && $arr_field_isPrimaryKey[$field_code] ) {
					$arrAssoc_dbField_fieldType[$field_name] = 'varchar(50)' ;
				}
				break ;
				
				case 'stringplus' :
				$field_name.= '_str' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'text' ;
				break ;
				
				case 'number' :
				$field_name.= '_dec' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'decimal(10,3)' ;
				if( $_mode_primaryKey && $arr_field_isPrimaryKey[$field_code] ) {
					$arrAssoc_dbField_fieldType[$field_name] = 'int(11)' ;
				}
				break ;
				
				case 'bool' :
				$field_name.= '_int' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'int(11)' ;
				break ;
				
				case 'extid' :
				$field_name.= '_int' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'bigint(20)' ;
				$arr_model_keys[$field_name] = array('non_unique'=>'1','arr_columns'=>array($field_name)) ;
				break ;
				
				case 'date' :
				$field_name.= '_dtm' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'datetime' ;
				if( $arr_field_isIndex[$field_code] ) {
					$arr_model_keys[$field_name] = array('non_unique'=>'1','arr_columns'=>array($field_name)) ;
				}
				break ;
				
				case 'link' :
				$field_name.= '_str' ;
				$arrAssoc_dbField_fieldType[$field_name] = 'varchar(50)' ;
				if( TRUE ) {
					$arr_model_keys[$field_name] = array('non_unique'=>'1','arr_columns'=>array($field_name)) ;
				}
				break ;
				
				case 'join' :
				$field_name = NULL ;
				break ;
				
				default :
				continue 2 ;
			}
			$field_crm = ''.$field_code ;
			$arrAssoc_crmField_dbField[$field_crm] = $field_name ;
			
			if( $_mode_primaryKey && $arr_field_isPrimaryKey[$field_code] && is_array($primaryKey_arrColumns) ) {
				$primaryKey_arrColumns[] = $field_name ;
			}
		}
		foreach( $arr_media_define as $media_field ) {
			$media_field = 'media_'.$media_field ;
			$arrAssoc_dbField_fieldType[$media_field] = 'varchar(100)' ;
			$arrAssoc_crmField_dbField[$media_field] = $media_field ;
		}
		if( $_mode_primaryKey && is_array($primaryKey_arrColumns) && count($primaryKey_arrColumns) > 0 ) {
			$arr_model_keys['PRIMARY'] = array('arr_columns'=>$primaryKey_arrColumns) ;
		}
		
		DatabaseMgr_Util::syncTableStructure( $sdomain_db , $db_table , $arrAssoc_dbField_fieldType , $arr_model_keys, $drop_allowed=TRUE ) ;
		
		$view_name = 'view_table_'.$table_code ;
		$query = "DROP VIEW IF EXISTS {$sdomain_db}.{$view_name}" ;
		$_opDB->query($query) ;
		
		$query = "CREATE ALGORITHM=MERGE VIEW {$sdomain_db}.{$view_name} AS SELECT" ;
		$fields = array() ;
		foreach( $arrAssoc_crmField_dbField as $field_crm => $field_name ) {
			$fields[]= "data.{$field_name} AS {$field_crm}" ;
		}
		$query.= ' '.implode(',',$fields) ;
		$query.= " FROM {$sdomain_db}.{$db_table} data" ;
		$query.= " " ;
		$_opDB->query($query) ;
		
		return array($db_table , $arrAssoc_dbField_fieldType , $arr_model_keys, $arrAssoc_crmField_dbField) ;
	}
	public function sdomainDefine_truncateBible( $sdomain_id , $bible_code ) {
		$_opDB = $this->_opDB ;
		$sdomain_db = $this->getSdomainDb( $sdomain_id ) ;
		
		$table_name = 'store_bible_'.$bible_code.'_entry' ;
		$query = "TRUNCATE TABLE {$sdomain_db}.{$table_name}" ;
		$_opDB->query($query) ;
		$table_name = 'store_bible_'.$bible_code.'_tree' ;
		$query = "TRUNCATE TABLE {$sdomain_db}.{$table_name}" ;
		$_opDB->query($query) ;
	}
	public function sdomainDefine_truncateFile( $sdomain_id , $file_code, $do_preserveSync=TRUE ) {
		$_opDB = $this->_opDB ;
		$sdomain_db = $this->getSdomainDb( $sdomain_id ) ;
		
		$table_name = 'store_file_'.$file_code ;
		
		if( $do_preserveSync ) {
			$query = "UPDATE {$sdomain_db}.{$table_name} SET sync_is_deleted='O',sync_timestamp='0'" ;
			$_opDB->query($query) ;
		} else {
			$query = "TRUNCATE TABLE {$sdomain_db}.{$table_name}" ;
			$_opDB->query($query) ;
		}
	}
	public function sdomainDefine_truncateTable( $sdomain_id , $table_code ) {
		$_opDB = $this->_opDB ;
		$sdomain_db = $this->getSdomainDb( $sdomain_id ) ;
		
		$table_name = 'store_table_'.$table_code ;
		$query = "TRUNCATE TABLE {$sdomain_db}.{$table_name}" ;
		$_opDB->query($query) ;
	}
	public function sdomainDefine_dropBible( $sdomain_id , $bible_code ) {
		$_opDB = $this->_opDB ;
		$sdomain_db = $this->getSdomainDb( $sdomain_id ) ;
		
		$view_name = 'view_bible_'.$file_code.'_entry' ;
		$query = "DROP VIEW IF EXISTS {$sdomain_db}.{$view_name}" ;
		$_opDB->query($query) ;
		$view_name = 'view_bible_'.$file_code.'_tree' ;
		$query = "DROP VIEW IF EXISTS {$sdomain_db}.{$view_name}" ;
		$_opDB->query($query) ;
		
		$table_name = 'store_bible_'.$file_code.'_entry' ;
		$query = "DROP TABLE IF EXISTS {$sdomain_db}.{$table_name}" ;
		$_opDB->query($query) ;
		$table_name = 'store_bible_'.$file_code.'_tree' ;
		$query = "DROP TABLE IF EXISTS {$sdomain_db}.{$table_name}" ;
		$_opDB->query($query) ;
	}
	public function sdomainDefine_dropFile( $sdomain_id , $file_code ) {
		$_opDB = $this->_opDB ;
		$sdomain_db = $this->getSdomainDb( $sdomain_id ) ;
		
		$view_name = 'view_file_'.$file_code ;
		$query = "DROP VIEW IF EXISTS {$sdomain_db}.{$view_name}" ;
		$_opDB->query($query) ;
		
		$table_name = 'store_file_'.$file_code ;
		$query = "DROP TABLE IF EXISTS {$sdomain_db}.{$table_name}" ;
		$_opDB->query($query) ;
		
		$this->sdomainDefine_buildFilesVuid( $sdomain_id ) ;
	}
	public function sdomainDefine_dropTable( $sdomain_id , $table_code ) {
		$_opDB = $this->_opDB ;
		$sdomain_db = $this->getSdomainDb( $sdomain_id ) ;
		
		$view_name = 'view_table_'.$table_code ;
		$query = "DROP VIEW IF EXISTS {$sdomain_db}.{$view_name}" ;
		$_opDB->query($query) ;
		
		$table_name = 'store_table_'.$table_code ;
		$query = "DROP TABLE IF EXISTS {$sdomain_db}.{$table_name}" ;
		$_opDB->query($query) ;
	}
	
	public function sdomainDump_export( $sdomain_id, $handle_out ) {
		$_opDB = $this->_opDB ;
		$sdomain_db = $this->getSdomainDb( $sdomain_id ) ;
		
		DatabaseMgr_Util::dump_DB( $handle_out, $sdomain_db ) ;
	}
	public function sdomainDump_import( $sdomain_id, $handle_in ) {
		$_opDB = $this->_opDB ;
		
		$this->sdomainDb_create( $sdomain_id, $overwrite=TRUE ) ;  // del + recréation base + structure
		fseek($handle_in,0) ;
		DatabaseMgr_Util::feed_DB( $handle_in, $this->getSdomainDb( $sdomain_id ), $skip_store=TRUE ) ;  // feed define
		$this->sdomainDefine_buildAll( $sdomain_id ) ; // structure données
		fseek($handle_in,0) ;
		DatabaseMgr_Util::feed_DB( $handle_in, $this->getSdomainDb( $sdomain_id ) ) ;  // restauration complete
		
		$sdomain_db = $this->getSdomainDb( $sdomain_id ) ;
		$query = "INSERT IGNORE INTO {$sdomain_db}._DB_INFO (`zero_id`) VALUES ('0')" ;
		$_opDB->query($query) ;
		$db_version = self::version_getVcode() ;
		$query = "UPDATE {$sdomain_db}._DB_INFO SET db_version='$db_version' WHERE zero_id='0'" ;
		$_opDB->query($query) ;
	}
	
	
	public static function dbCurrent_getSdomainId() {
		$_opDB = $GLOBALS['_opDB'] ;
	
		$current_database = $_opDB->query_uniqueValue("SELECT DATABASE()") ;
		$base_database = $GLOBALS['mysql_db'] ;
		
		if( !(strpos($current_database,$base_database) === 0) ) {
			return NULL ;
		}
		$ttmp = explode('_',$current_database,4) ;
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
