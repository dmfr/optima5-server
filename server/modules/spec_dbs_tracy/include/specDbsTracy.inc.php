<?php

include("$server_root/modules/spec_dbs_tracy/include/specDbsTracy_order.inc.php") ;
include("$server_root/modules/spec_dbs_tracy/include/specDbsTracy_hat.inc.php") ;
include("$server_root/modules/spec_dbs_tracy/include/specDbsTracy_trspt.inc.php") ;
include("$server_root/modules/spec_dbs_tracy/include/specDbsTracy_attachments.inc.php") ;
include("$server_root/modules/spec_dbs_tracy/include/specDbsTracy_upload.inc.php") ;
include("$server_root/modules/spec_dbs_tracy/include/specDbsTracy_live.inc.php") ;
include("$server_root/modules/spec_dbs_tracy/include/specDbsTracy_orderTree.inc.php") ;

include("$server_root/modules/spec_dbs_tracy/include/specDbsTracy_lib_calc.inc.php") ;

function specDbsTracy_cfg_doInit( $post_data ) {
	global $_opDB ;
	
	if( isset($_SESSION['login_data']['delegate_sdomainId']) ) {
		return array('success'=>true) ;
	}
	//specDbsTracy_lib_calc_perf() ;
	return array('success'=>true) ;
}


function specDbsTracy_cfg_getAuth( $post_data ) {
	global $_opDB ;
	
	if( !isset($_SESSION['login_data']['delegate_sdomainId']) ) {
		return array('success'=>true) ;
	}
	$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() ) ;
	if( $_SESSION['login_data']['delegate_sdomainId'] != $t->dbCurrent_getSdomainId() ) {
		return array('success'=>false) ;
	}
	
	$user_id = $_SESSION['login_data']['delegate_userId'] ;
	$query = "SELECT * FROM view_bible_USERS_entry WHERE field_USER_CODE='{$user_id}'" ;
	$result = $_opDB->query($query) ;
	if( ($arr = $_opDB->fetch_assoc($result)) == FALSE ) {
		return array('success'=>false) ;
	}
	
	$authPage = array() ;
	$user_class = $arr['treenode_key'] ;
	switch( $user_class ) {
		case 'ADMIN' :
			$authPage = array('ADMIN','GOM','STD') ;
			break ;
		
		case 'GOM' :
			$authPage = array('GOM','STD') ;
			break ;
		
		case 'STD' :
			$authPage = array('STD') ;
			break ;
	}
	
	return array(
		'success' => true,
		'authPage' => $authPage
	) ;
}


function specDbsTracy_cfg_getConfig() {
	if( isset($GLOBALS['cache_specDbsTracy_cfg']['getConfig']) ) {
		return array(
			'success'=>true,
			'data' => $GLOBALS['cache_specDbsTracy_cfg']['getConfig']
		);
	}
	
	global $_opDB ;
	
	
	$TAB_soc = array() ;
	$query = "SELECT * FROM view_bible_CFG_SOC_entry ORDER BY field_SOC_CODE" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$soc_code = $arr['field_SOC_CODE'] ;
		$record = array(
			'soc_code' => $arr['field_SOC_CODE'],
			'soc_txt' => $arr['field_SOC_TXT'],
			'cfg_adr' => explode(',',$arr['field_CFG_ADR']),
			'cfg_customs' => json_decode($arr['field_CFG_CUSTOMS_JSON'],true)
		) ;
		
		$TAB_soc[] = $record ;
	}
	
	
	$TAB_priority = array() ;
	$query = "SELECT * FROM view_bible_LIST_SERVICE_entry WHERE 1 ORDER BY entry_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB_priority[] = array(
			'prio_id' => $arr['field_CODE'],
			'prio_txt' => $arr['field_TEXT'],
			'prio_code' => $arr['field_TEXT'],
			'prio_color' => $arr['field_COLOR']
		) ;
	}
	
	
	$TAB_kpicode = array() ;
	$query = "SELECT * FROM view_bible_KPI_CODE_tree WHERE 1 ORDER BY treenode_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB_kpicode[] = array(
			'calc_code' => $arr['field_CALC_CODE'],
			'calc_txt' => $arr['field_CALC_TXT']
		) ;
	}
	
	
	$TAB_orderflow = array() ;
	$query = "SELECT * FROM view_bible_CFG_ORDERFLOW_tree WHERE treenode_parent_key IN ('','&') ORDER BY treenode_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$flow_code = $arr['field_FLOW_CODE'] ;
		$record = array(
			'flow_code' => $arr['field_FLOW_CODE'],
			'flow_txt' => $arr['field_FLOW_TXT']
		) ;
		
		$TAB_orderflow[$flow_code] = $record ;
	}
	$query = "SELECT * FROM view_bible_CFG_ORDERFLOW_entry ORDER BY treenode_key, entry_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$flow_code = $arr['treenode_key'] ;
		if( !$TAB_orderflow[$flow_code] ) {
			continue ;
		}
		$step_code = $arr['field_STEP_CODE'] ;
		$record = array(
			'step_code' => $arr['field_STEP_CODE'],
			'desc_code' => $arr['field_DESC_CODE'],
			'desc_txt' => $arr['field_DESC_TXT'],
			'status_percent' => $arr['field_PERCENT'],
			'prompt_order' => ($arr['field_PROMPT_ORDER']==1),
			'prompt_trspt' => ($arr['field_PROMPT_TRSPT']==1),
			'is_options' => ($arr['field_IS_OPTIONS']==1),
			'chart_color' => $arr['field_CHART_COLOR'],
			'is_private' => ($arr['field_IS_PRIVATE']==1)
		) ;
		
		$TAB_orderflow[$flow_code]['steps'][] = $record ;
	}
	
	
	$TAB_list = array() ;
	$json_define = paracrm_define_getMainToolbar( array('data_type'=>'bible') , true ) ;
	foreach( $json_define['data_bible'] as $define_bible ) {
		if( strpos($define_bible['bibleId'],'LIST_')===0 ) {
			$json_define_bible = paracrm_data_getBibleCfg(array('bible_code'=>$define_bible['bibleId'])) ;
			
			$bible_code = $define_bible['bibleId'] ;
			
			$records = array() ;
			$query = "SELECT * FROM view_bible_{$bible_code}_entry ORDER BY entry_key" ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
				$node = $arr['treenode_key'] ;
				$id = $arr['entry_key'] ;
				$lib = array() ;
				foreach( $json_define_bible['data']['entry_fields'] as $entry_field ) {
					if( strpos($entry_field['entry_field_code'],'field_')===0 && $entry_field['entry_field_is_header'] ) {
						$lib[] = $arr[$entry_field['entry_field_code']] ;
					}
				}
				$records[] = array('node'=>$node, 'id'=>$id, 'text'=>implode(' - ',$lib)) ;
			}
			
			$TAB_list[] = array(
				'bible_code' => $bible_code,
				'records' => $records
			) ;
		}
	}
	
	$GLOBALS['cache_specDbsTracy_cfg']['getConfig'] = array(
		'cfg_soc' => $TAB_soc,
		'cfg_orderflow' => array_values($TAB_orderflow),
		'cfg_priority' => $TAB_priority,
		'cfg_list' => $TAB_list,
		'cfg_kpicode' => $TAB_kpicode
	);

	return array('success'=>true, 'data'=>$GLOBALS['cache_specDbsTracy_cfg']['getConfig'])  ;
}









function specDbsTracy_lib_getBarcodePng( $text=0, $size=20, $orientation='horizontal', $code_type="code128") {
/*
 *  Author:  David S. Tufts
 *  Company: Rocketwood.LLC
 *	  www.rocketwood.com
 *  Date:	05/25/2003
 *  Usage:
 *	  <img src="/barcode.php?text=testing" alt="testing" />
 */
	
	// Get pararameters that are passed in through $_GET or set to the default value
	$code_string = "";

	// Translate the $text into barcode the correct $code_type
	if ( in_array(strtolower($code_type), array("code128", "code128b")) ) {
		$chksum = 104;
		// Must not change order of array elements as the checksum depends on the array's key to validate final code
		$code_array = array(" "=>"212222","!"=>"222122","\""=>"222221","#"=>"121223","$"=>"121322","%"=>"131222","&"=>"122213","'"=>"122312","("=>"132212",")"=>"221213","*"=>"221312","+"=>"231212",","=>"112232","-"=>"122132","."=>"122231","/"=>"113222","0"=>"123122","1"=>"123221","2"=>"223211","3"=>"221132","4"=>"221231","5"=>"213212","6"=>"223112","7"=>"312131","8"=>"311222","9"=>"321122",":"=>"321221",";"=>"312212","<"=>"322112","="=>"322211",">"=>"212123","?"=>"212321","@"=>"232121","A"=>"111323","B"=>"131123","C"=>"131321","D"=>"112313","E"=>"132113","F"=>"132311","G"=>"211313","H"=>"231113","I"=>"231311","J"=>"112133","K"=>"112331","L"=>"132131","M"=>"113123","N"=>"113321","O"=>"133121","P"=>"313121","Q"=>"211331","R"=>"231131","S"=>"213113","T"=>"213311","U"=>"213131","V"=>"311123","W"=>"311321","X"=>"331121","Y"=>"312113","Z"=>"312311","["=>"332111","\\"=>"314111","]"=>"221411","^"=>"431111","_"=>"111224","\`"=>"111422","a"=>"121124","b"=>"121421","c"=>"141122","d"=>"141221","e"=>"112214","f"=>"112412","g"=>"122114","h"=>"122411","i"=>"142112","j"=>"142211","k"=>"241211","l"=>"221114","m"=>"413111","n"=>"241112","o"=>"134111","p"=>"111242","q"=>"121142","r"=>"121241","s"=>"114212","t"=>"124112","u"=>"124211","v"=>"411212","w"=>"421112","x"=>"421211","y"=>"212141","z"=>"214121","{"=>"412121","|"=>"111143","}"=>"111341","~"=>"131141","DEL"=>"114113","FNC 3"=>"114311","FNC 2"=>"411113","SHIFT"=>"411311","CODE C"=>"113141","FNC 4"=>"114131","CODE A"=>"311141","FNC 1"=>"411131","Start A"=>"211412","Start B"=>"211214","Start C"=>"211232","Stop"=>"2331112");
		$code_keys = array_keys($code_array);
		$code_values = array_flip($code_keys);
		for ( $X = 1; $X <= strlen($text); $X++ ) {
			$activeKey = substr( $text, ($X-1), 1);
			$code_string .= $code_array[$activeKey];
			$chksum=($chksum + ($code_values[$activeKey] * $X));
		}
		$code_string .= $code_array[$code_keys[($chksum - (intval($chksum / 103) * 103))]];

		$code_string = "211214" . $code_string . "2331112";
	} elseif ( strtolower($code_type) == "code128a" ) {
		$chksum = 103;
		$text = strtoupper($text); // Code 128A doesn't support lower case
		// Must not change order of array elements as the checksum depends on the array's key to validate final code
		$code_array = array(" "=>"212222","!"=>"222122","\""=>"222221","#"=>"121223","$"=>"121322","%"=>"131222","&"=>"122213","'"=>"122312","("=>"132212",")"=>"221213","*"=>"221312","+"=>"231212",","=>"112232","-"=>"122132","."=>"122231","/"=>"113222","0"=>"123122","1"=>"123221","2"=>"223211","3"=>"221132","4"=>"221231","5"=>"213212","6"=>"223112","7"=>"312131","8"=>"311222","9"=>"321122",":"=>"321221",";"=>"312212","<"=>"322112","="=>"322211",">"=>"212123","?"=>"212321","@"=>"232121","A"=>"111323","B"=>"131123","C"=>"131321","D"=>"112313","E"=>"132113","F"=>"132311","G"=>"211313","H"=>"231113","I"=>"231311","J"=>"112133","K"=>"112331","L"=>"132131","M"=>"113123","N"=>"113321","O"=>"133121","P"=>"313121","Q"=>"211331","R"=>"231131","S"=>"213113","T"=>"213311","U"=>"213131","V"=>"311123","W"=>"311321","X"=>"331121","Y"=>"312113","Z"=>"312311","["=>"332111","\\"=>"314111","]"=>"221411","^"=>"431111","_"=>"111224","NUL"=>"111422","SOH"=>"121124","STX"=>"121421","ETX"=>"141122","EOT"=>"141221","ENQ"=>"112214","ACK"=>"112412","BEL"=>"122114","BS"=>"122411","HT"=>"142112","LF"=>"142211","VT"=>"241211","FF"=>"221114","CR"=>"413111","SO"=>"241112","SI"=>"134111","DLE"=>"111242","DC1"=>"121142","DC2"=>"121241","DC3"=>"114212","DC4"=>"124112","NAK"=>"124211","SYN"=>"411212","ETB"=>"421112","CAN"=>"421211","EM"=>"212141","SUB"=>"214121","ESC"=>"412121","FS"=>"111143","GS"=>"111341","RS"=>"131141","US"=>"114113","FNC 3"=>"114311","FNC 2"=>"411113","SHIFT"=>"411311","CODE C"=>"113141","CODE B"=>"114131","FNC 4"=>"311141","FNC 1"=>"411131","Start A"=>"211412","Start B"=>"211214","Start C"=>"211232","Stop"=>"2331112");
		$code_keys = array_keys($code_array);
		$code_values = array_flip($code_keys);
		for ( $X = 1; $X <= strlen($text); $X++ ) {
			$activeKey = substr( $text, ($X-1), 1);
			$code_string .= $code_array[$activeKey];
			$chksum=($chksum + ($code_values[$activeKey] * $X));
		}
		$code_string .= $code_array[$code_keys[($chksum - (intval($chksum / 103) * 103))]];

		$code_string = "211412" . $code_string . "2331112";
	} elseif ( strtolower($code_type) == "code39" ) {
		$code_array = array("0"=>"111221211","1"=>"211211112","2"=>"112211112","3"=>"212211111","4"=>"111221112","5"=>"211221111","6"=>"112221111","7"=>"111211212","8"=>"211211211","9"=>"112211211","A"=>"211112112","B"=>"112112112","C"=>"212112111","D"=>"111122112","E"=>"211122111","F"=>"112122111","G"=>"111112212","H"=>"211112211","I"=>"112112211","J"=>"111122211","K"=>"211111122","L"=>"112111122","M"=>"212111121","N"=>"111121122","O"=>"211121121","P"=>"112121121","Q"=>"111111222","R"=>"211111221","S"=>"112111221","T"=>"111121221","U"=>"221111112","V"=>"122111112","W"=>"222111111","X"=>"121121112","Y"=>"221121111","Z"=>"122121111","-"=>"121111212","."=>"221111211"," "=>"122111211","$"=>"121212111","/"=>"121211121","+"=>"121112121","%"=>"111212121","*"=>"121121211");

		// Convert to uppercase
		$upper_text = strtoupper($text);

		for ( $X = 1; $X<=strlen($upper_text); $X++ ) {
			$code_string .= $code_array[substr( $upper_text, ($X-1), 1)] . "1";
		}

		$code_string = "1211212111" . $code_string . "121121211";
	} elseif ( strtolower($code_type) == "code25" ) {
		$code_array1 = array("1","2","3","4","5","6","7","8","9","0");
		$code_array2 = array("3-1-1-1-3","1-3-1-1-3","3-3-1-1-1","1-1-3-1-3","3-1-3-1-1","1-3-3-1-1","1-1-1-3-3","3-1-1-3-1","1-3-1-3-1","1-1-3-3-1");

		for ( $X = 1; $X <= strlen($text); $X++ ) {
			for ( $Y = 0; $Y < count($code_array1); $Y++ ) {
				if ( substr($text, ($X-1), 1) == $code_array1[$Y] )
					$temp[$X] = $code_array2[$Y];
			}
		}

		for ( $X=1; $X<=strlen($text); $X+=2 ) {
			if ( isset($temp[$X]) && isset($temp[($X + 1)]) ) {
				$temp1 = explode( "-", $temp[$X] );
				$temp2 = explode( "-", $temp[($X + 1)] );
				for ( $Y = 0; $Y < count($temp1); $Y++ )
					$code_string .= $temp1[$Y] . $temp2[$Y];
			}
		}

		$code_string = "1111" . $code_string . "311";
	} elseif ( strtolower($code_type) == "codabar" ) {
		$code_array1 = array("1","2","3","4","5","6","7","8","9","0","-","$",":","/",".","+","A","B","C","D");
		$code_array2 = array("1111221","1112112","2211111","1121121","2111121","1211112","1211211","1221111","2112111","1111122","1112211","1122111","2111212","2121112","2121211","1121212","1122121","1212112","1112122","1112221");

		// Convert to uppercase
		$upper_text = strtoupper($text);

		for ( $X = 1; $X<=strlen($upper_text); $X++ ) {
			for ( $Y = 0; $Y<count($code_array1); $Y++ ) {
				if ( substr($upper_text, ($X-1), 1) == $code_array1[$Y] )
					$code_string .= $code_array2[$Y] . "1";
			}
		}
		$code_string = "11221211" . $code_string . "1122121";
	}

	// Pad the edges of the barcode
	$code_length = 20;
	for ( $i=1; $i <= strlen($code_string); $i++ )
		$code_length = $code_length + (integer)(substr($code_string,($i-1),1));

	if ( strtolower($orientation) == "horizontal" ) {
		$img_width = $code_length;
		$img_height = $size;
	} else {
		$img_width = $size;
		$img_height = $code_length;
	}

	$image = imagecreate($img_width, $img_height);
	$black = imagecolorallocate ($image, 0, 0, 0);
	$white = imagecolorallocate ($image, 255, 255, 255);

	imagefill( $image, 0, 0, $white );

	$location = 10;
	for ( $position = 1 ; $position <= strlen($code_string); $position++ ) {
		$cur_size = $location + ( substr($code_string, ($position-1), 1) );
		if ( strtolower($orientation) == "horizontal" )
			imagefilledrectangle( $image, $location, 0, $cur_size, $img_height, ($position % 2 == 0 ? $white : $black) );
		else
			imagefilledrectangle( $image, 0, $location, $img_width, $cur_size, ($position % 2 == 0 ? $white : $black) );
		$location = $cur_size;
	}
	
	
	$tmpfname = tempnam( sys_get_temp_dir(), "FOO").'.png';
	
	// Draw barcode to the screen
	imagepng($image, $tmpfname);
	imagedestroy($image);
	
	$binary = file_get_contents($tmpfname) ;
	unlink($tmpfname) ;
	return $binary ;
}

?>
