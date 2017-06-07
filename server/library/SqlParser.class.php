<?php

/**
 * http://stackoverflow.com/questions/4747808/split-mysql-queries-in-array-each-queries-separated-by
 */
class SqlParser {

	/*
	Alternative : http://stackoverflow.com/questions/24423260/split-sql-statements-in-php-on-semicolons-but-not-inside-quotes
	$splits = preg_split('~\([^)]*\)(*SKIP)(*F)|;~', $sql);
	*/

    public static function split_sql($sql_text) {
		// Extract procedures
		preg_match_all('/<procedure id=\"(.+?)\">(.+?)<\/procedure>/is', $sql_text, $matches) ;
		$keys = $matches[1] ;
		$values = $matches[2] ;
		$my_procedures = array_combine($keys,$values) ;
		$sql_text = preg_replace('/<procedure id=\"(.+?)\">(.+?)<\/procedure>/is', "", $sql_text);
		
		$sql_text = preg_replace_callback(
			'/<exec id=\"(.+?)\"\s?\/>/is',
			function($matches) use ($my_procedures) {
				$proc_id = $matches[1] ;
				return $my_procedures[$proc_id] ;
			},
			$sql_text
		);
		
		
		
		// Extract escaped statements
		preg_match_all("/<query>(.+?)<\/query>/is", $sql_text, $matches) ;
		$escaped_statements = $matches[1] ;
		
		// Replace escaped st.
		$sql_text = preg_replace("/<query>(.+?)<\/query>/is", "<query/>;", $sql_text);
		
		// Return array of ; terminated SQL statements in $sql_text.
		$re = '% # Match an SQL record ending with ";"
		\s*                                     # Discard leading whitespace.
		(                                       # $1: Trimmed non-empty SQL record.
			(?:                                   # Group for content alternatives.
			\'[^\'\\\\]*(?:\\\\.[^\'\\\\]*)*\'    # Either a single quoted string,
			| "[^"\\\\]*(?:\\\\.[^"\\\\]*)*"      # or a double quoted string,
			| /*[^*]*\*+([^*/][^*]*\*+)*/         # or a multi-line comment,
			| \#.*                                # or a # single line comment,
			| --.*                                # or a -- single line comment,
			| [^"\';#]                            # or one non-["\';#-]
			)+                                    # One or more content alternatives
			(?:;|$)                               # Record end is a ; or string end.
		)                                       # End $1: Trimmed SQL record.
		%x';
		if (preg_match_all($re, $sql_text, $matches)) {
			$statements = $matches[1] ;
			foreach( $statements as &$statement ) {
				if( $statement=='<query/>;' ) {
					$statement = array_shift($escaped_statements) ;
				}
			}
			unset($statement) ;
			return $statements;
		}
		return array();
	}
}

//End of class
?>
