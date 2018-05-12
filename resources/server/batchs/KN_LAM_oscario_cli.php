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

include("$server_root/modules/spec_dbs_lam/backend_spec_dbs_lam.inc.php");

$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
$_SESSION['login_data']['mysql_db'] = 'op5_'.$_domain_id.'_prod' ;
$_SESSION['login_data']['login_domain'] = $_domain_id.'_prod' ;
$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;



$_OSCARIO_DOMAIN=getenv('OSCARIO_DOMAIN') ;
$_OSCARIO_MAG=getenv('OSCARIO_MAG') ;
$_OPTIMA_SOC=getenv('OPTIMA_SOC') ;
if( !$_OSCARIO_DOMAIN || !$_OSCARIO_MAG || !$_OPTIMA_SOC ) {
	echo "No Oscario Domain / Oscario Mag / Optima Soc !\n" ;
	exit ;
}

include('KN_LAM_oscario.inc.php') ;
oscario_interface_do( $_OSCARIO_DOMAIN, $_OSCARIO_MAG, $_OPTIMA_SOC ) ;


?>
