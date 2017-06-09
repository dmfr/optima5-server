<?php

if ( !defined('__TOOLFUNCTIONS') )
{
function utf8_substr_replace($original, $replacement, $position, $length)
{
	$startString = mb_substr($original, 0, $position, "UTF-8");
	$endString = mb_substr($original, $position + $length, mb_strlen($original), "UTF-8");

	$out = $startString . $replacement . $endString;

	return $out;
}

function substr_mklig( $ligne, $text, $offset, $length, $right_align=FALSE )
{
	//longueur du texte
	$faketext = "" ;
	for( $i = strlen($faketext) ; $i < $length ; $i++ )
		$faketext.= ' ' ;
	if( mb_strlen($text,"UTF-8") > $length )
	{
		$text = mb_substr( $text, 0, $length, "UTF-8" );
	}

	// test de la longueur de la ligne acturellement
	$besoin_strlen = $offset + mb_strlen($text,"UTF-8") ;
	if( mb_strlen($ligne,"UTF-8") < $besoin_strlen )
	{
		for( $i = mb_strlen($ligne,"UTF-8") ; $i < $besoin_strlen ; $i++ )
			$ligne.= ' ' ;
	}

	// copier coller du texte à la position voulue
	$ligne = utf8_substr_replace( $ligne, $faketext, $offset, mb_strlen($faketext,"UTF-8") ) ;
	if( $right_align ) {
		$ligne = utf8_substr_replace( $ligne, $text, $offset + $length - mb_strlen($text,"UTF-8") , mb_strlen($text,"UTF-8") ) ;
	} else {
		$ligne = utf8_substr_replace( $ligne, $text, $offset, mb_strlen($text,"UTF-8") ) ;
	}

	// renvoi de la ligne
	return $ligne ;
}

// *****************************

function isJsonArr($string) {
	if( !is_array(json_decode($string,true)) ) {
		return false ;
	}
	return (json_last_error() == JSON_ERROR_NONE);
}

// *****************************

function epuration_char($my_str)
{
	$forbidden = array( '^', '`', "'", '"', "²", "°", "³"," ","-" );
	$my_str = str_replace($forbidden, "", $my_str) ;
	
	$forbidden = array( 'é', 'è', "ê", "ë" );
	$my_str = str_replace($forbidden, "e", $my_str) ;
	
	$forbidden = array( 'a', 'à', "â", "ä" );
	$my_str = str_replace($forbidden, "a", $my_str) ;
	
	
	return $my_str ;
}

// *****************************

function int_to_strX ($i, $X) {
	$i = (int)$i ;
	$str = "" ;
	if ( $i >= pow(10,$X) || !(isset( $i )) )
		$i = 0  ;
	while ( $X > 1 )
	{
		$X-- ;
		if ( $i < pow(10,$X) )
			$str = $str."0" ;
	}
	$str = $str.$i ;
	return $str ;
}

function is_date_valid( $date_sql )
{
	if( $date_sql == '0000-00-00' )
		return FALSE ;
	if( $date_sql == '0000-00-00 00:00:00' )
		return FALSE ;
	if( !$date_sql )
		return FALSE ;
	return TRUE ;
}


/*
function format_date_short( $date_sql )
{
	return date( 'd/m/y', strtotime( $date_sql ) ) ;
}
function format_dateheure_short( $date_sql )
{
	return date( 'd/m H:i', strtotime( $date_sql ) ) ;
}

function format_date_local( $date_sql )
{
	if( strlen($date_sql) > 10 )
		return date( 'd/m/Y H:i', strtotime( $date_sql ) ) ;
	return date( 'd/m/Y', strtotime( $date_sql ) ) ;
}

function process_date_saisie( $my_date )
{
	if( strlen($my_date) > 10 )
		$my_date = substr($my_date,0,10) ;

	switch( strlen($my_date) )
	{
		case 10 :
		if( substr($my_date,4,1) == '-' && substr($my_date,7,1) == '-' )
		{
			$year = substr( $my_date, 0,4 ) ;
			$month = substr( $my_date, 5,2 ) ;
			$day = substr( $my_date, 8,2 ) ;
		}
		elseif( substr($my_date,2,1) == '/' && substr($my_date,5,1) == '/' )
		{
			$year = substr( $my_date, 6,4 ) ;
			$month = substr( $my_date, 3,2 ) ;
			$day = substr( $my_date, 0,2 ) ;
		}
		else
			return NULL ;
		break ;
		
		case 8 :
		$year = substr( $my_date, 0,4 ) ;
		$month = substr( $my_date, 4,2 ) ;
		$day = substr( $my_date, 6,2 ) ;
		break ;
		
		case 6 :
		$year2 = substr( $my_date, 4,2 ) ;
		if( $year2 < 70 && $year2 > 0 )
			$year = "20".$year2 ;
		elseif( $year2 >= 70 && $year2 <= 99 )
			$year = "19".$year2 ;
		else
			return NULL ;
		$month = substr( $my_date, 2,2 ) ;
		$day = substr( $my_date, 0,2 ) ;
		break ;

		default:
		return NULL ;
	}
	
	if( !is_numeric($day) || $day < 1 || $day > 31 )
		return NULL ;
	if( !is_numeric($month) || $month < 1 || $month > 12 )
		return NULL ;
	if( !is_numeric($year) )
		return NULL ;
		
	$arr['date_sql'] = $year.'-'.$month.'-'.$day ;
	$arr['date_fr'] = format_date_local($arr['date_sql']) ;
	
	return $arr ;
}
*/
define( '__TOOLFUNCTIONS', TRUE ) ;


}
?>
