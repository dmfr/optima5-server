<?php

/**
 * http://stackoverflow.com/questions/4747808/split-mysql-queries-in-array-each-queries-separated-by
 */
class SqlParser {

    public static function split_sql($sql_text) {
		// Return array of ; terminated SQL statements in $sql_text.
		$re = '% # Match an SQL record ending with ";"
		\s*                                     # Discard leading whitespace.
		(                                       # $1: Trimmed non-empty SQL record.
			(?:                                   # Group for content alternatives.
			\'[^\'\\\\]*(?:\\\\.[^\'\\\\]*)*\'  # Either a single quoted string,
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
			return $matches[1];
		}
		return array();
	}


}

//End of class
