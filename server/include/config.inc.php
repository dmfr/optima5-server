<?php
if( !defined('INC_CONFIG_DB') )
{
	include($server_root.'/include/config.DB.inc.php') ;
	
	$mysql_db_prefix = 'op5_' ;
	
	if( isset($_SESSION['login_data']['mysql_db']) )
		$mysql_db = $_SESSION['login_data']['mysql_db'] ;
	elseif( getenv('OPTIMA_DB') != NULL )
	{
		//echo "Base de donnees OPTIMA : ".getenv('OPTIMA_DB')."\n" ;
		if( defined('STDERR') ) {
			fwrite(STDERR, "Base de donnees OPTIMA : ".getenv('OPTIMA_DB')."\n");
		}
	}
	
	if( $_SESSION['login_data']['dev_db'] != NULL )
		$suffixe = $_SESSION['login_data']['dev_db'] ;
	else
		$suffixe = "prod" ;
	
	$suffixe = "( ".$_SESSION['login_data']['userstr']." )" ;
	
	
	// ******** Switch mode DEV ********
	if( $_SESSION['login_data']['dev_db']
		|| getenv('OPTIMA_TEST') != NULL
		|| is_file($app_root.'/DEV') ) {
		
		$GLOBALS['__OPTIMA_TEST'] = TRUE ;
		//echo "OPTIMA test mode : TRUE\n" ;
		if( defined('STDERR') ) {
			fwrite(STDERR, "OPTIMA test mode : TRUE\n");}
		}
	// *********************************
	
	
	define( 'INC_CONFIG_DB', TRUE ) ;
}

if( !defined('INC_CONFIG_INC') )
{
	$limit_per_page = 50 ;



	$body_bgcolor_DEV='#8D8EB0';
	$body_bgcolor_std='#333397';

	if( $_SESSION['login_data']['dev_db'] == NULL )
		$body_bgcolor = $body_bgcolor_std ;
	else
		$body_bgcolor = $body_bgcolor_DEV ;
		


	$color_titre = "#E8E8E8" ;
	$color_a1 = "#93b0f9" ;
	$color_a2 = "#b5ccff" ;
	$color_b1 = "#ff6363" ;
	$color_b2 = "#ff9466" ;

	$color_l1 = "#B2E1FF" ;
	$color_l2 = "#B2FCFF" ;

	$color_v1 = "#88E3AE" ;
	$color_v2 = "#75C396" ;

	$color_m1 = "#DFEDF7" ;
	$color_m2 = "#cbe9fd" ;

	$color_bclair = "#D9F9FF";
	$color_bfonce = "#63B6FF";
	$color_bdark = "#3A6FFF";

	$color_orange = '#FFCE84' ;
	$color_rouge = '#ff9191' ;

	$color_sable_light = "#fff5d0" ;
	$color_sable = '#FFF0BB' ;
	$color_jaune = $color_sable ;
	$color_orange_light = '#FFDC7A' ;

	$color_rouge_light = $color_rouge ;

	$color_vert = "#23F59C" ;
	$color_vertclair = "#9EF578" ;

	// $body_bgcolor = " ;


	/*
	**********************************
		Parametrage du Programme
	**********************************
	*/

	if( is_file($server_root.'/version.inc') )
		include($server_root.'/version.inc') ;

	// include($app_root.'/library/Base/Base_Constants.inc');

	
	function optima__autoload($classname) {
		
		$dir = dirname(str_replace('_', '/', $classname));
		if (strpos($dir, '/') !== false) {
			$dir = dirname($dir)."/".str_replace('/','_',$dir);
		}
		$path = $GLOBALS['server_root'].'/library/'.$dir.'/'.$classname.".class.php";

		// print "Autoload : $classname ($path)\n";
		
		if (file_exists($path)) {
			include($path);
		} else {
			// print "Fichier $path inconnu\n";
		}
	}
	spl_autoload_register("optima__autoload");
	//echo "AUTO" ;

	define( 'INC_CONFIG_INC', TRUE ) ;
}
?>
