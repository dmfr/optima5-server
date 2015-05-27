<?php

$buffers = array() ;

$handle = fopen("php://stdin",'rb') ;
while( !feof($handle) ) {
	$line = fgets($handle) ;
	
	if( strpos(trim($line),'Ext.define') === 0 ) {
		$first = strpos($line,'"') ;
		$last = strpos($line,'"',$first+1) ;
		//echo $line ;
		//echo $first."\n" ;
		//echo $last."\n" ;
		$class = substr($line,$first+1,$last-$first-1)."\n" ;
		if( strpos($class,'Sch.') !== 0 ) {
			echo "ERR!!"."\n" ;
			continue ;
		}
		
		$filepath = trim(str_replace('.','/',substr($class,4))) ;
		$filepath.= '.js' ;
	}
	if( !$line || !$filepath ) {
		continue ;
	}
	if( !$buffers[$filepath] ) {
		$buffers[$filepath] = '' ;
	}
	$buffers[$filepath] .= $line ;
}
fclose($handle) ;


foreach( $buffers as $filepath => $binary ) {
		$dir = dirname($filepath) ;
		if( !$dir ) {
			continue ;
		}
		@mkdir($dir,0777,true) ;
	
	file_put_contents($filepath,$binary) ;
}



?>