<?php

$app_root = dirname($_SERVER['SCRIPT_NAME']).'/../../..' ;
$server_root=$app_root.'/server' ;
$resources_root=$app_root.'/resources' ;
$templates_dir=$resources_root.'/server/templates' ;

include("$server_root/include/config.inc.php");
include("$server_root/include/toolfunctions.inc.php");
include("$server_root/modules/media/include/media.inc.php");

include( "$server_root/include/database/mysql_DB.inc.php" ) ;
$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, $mysql_db, $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;

include("$server_root/modules/spec_dbs_people/backend_spec_dbs_people.inc.php");


		$ttmp = specDbsPeople_cfg_getPeopleCalcAttributes() ;
		foreach( $ttmp['data'] as $peopleCalcAttribute_definition ) {
			if( !isset($post_data['_load_calcAttributes_atDateSql']) ) {
				$at_date_sql = NULL ;
			} else {
				$at_date_sql = $post_data['_load_calcAttributes_atDateSql'] ;
			}
			$peopleCalcAttribute = $peopleCalcAttribute_definition['peopleCalcAttribute'] ;
			$peopleCalcAttribute_TAB = specDbsPeople_lib_calc_getCalcAttributeRecords( $peopleCalcAttribute, $at_date_sql ) ;
			foreach( $peopleCalcAttribute_TAB as $people_code => $peopleCalcAttribute_record ) {
				if( isset($TAB[$people_code]) ) {
					$TAB[$people_code]['calc_attributes'][] = $peopleCalcAttribute_record ;
				}
			}
		}

?>
