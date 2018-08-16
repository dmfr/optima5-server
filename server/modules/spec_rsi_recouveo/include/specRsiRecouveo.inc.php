<?php
include("$server_root/modules/spec_rsi_recouveo/include/specRsiRecouveo_file.inc.php") ;
include("$server_root/modules/spec_rsi_recouveo/include/specRsiRecouveo_action.inc.php") ;
include("$server_root/modules/spec_rsi_recouveo/include/specRsiRecouveo_account.inc.php") ;
include("$server_root/modules/spec_rsi_recouveo/include/specRsiRecouveo_doc.inc.php") ;
include("$server_root/modules/spec_rsi_recouveo/include/specRsiRecouveo_config.inc.php") ;
include("$server_root/modules/spec_rsi_recouveo/include/specRsiRecouveo_recordgroup.inc.php") ;
include("$server_root/modules/spec_rsi_recouveo/include/specRsiRecouveo_bank.inc.php") ;
include("$server_root/modules/spec_rsi_recouveo/include/specRsiRecouveo_report.inc.php") ;
include("$server_root/modules/spec_rsi_recouveo/include/specRsiRecouveo_mail.inc.php") ;
include("$server_root/modules/spec_rsi_recouveo/include/specRsiRecouveo_lib_sms.inc.php") ;
include("$server_root/modules/spec_rsi_recouveo/include/specRsiRecouveo_xls.inc.php") ;

include("$server_root/modules/spec_rsi_recouveo/include/specRsiRecouveo_dev.inc.php") ;
include("$server_root/modules/spec_rsi_recouveo/include/specRsiRecouveo_upload.inc.php") ;

include("$server_root/modules/spec_rsi_recouveo/include/specRsiRecouveo_lib_scenario.inc.php") ;
include("$server_root/modules/spec_rsi_recouveo/include/specRsiRecouveo_lib_autorun.inc.php") ;
include("$server_root/modules/spec_rsi_recouveo/include/specRsiRecouveo_lib_metafields.inc.php") ;
include("$server_root/modules/spec_rsi_recouveo/include/specRsiRecouveo_lib_mail.inc.php") ;
include("$server_root/modules/spec_rsi_recouveo/include/specRsiRecouveo_lib_stat.inc.php") ;
include("$server_root/modules/spec_rsi_recouveo/include/specRsiRecouveo_lib_edi.inc.php") ;
function specRsiRecouveo_cfg_doInit( $post_data ) {
	global $_opDB ;
	
	if( isset($_SESSION['login_data']['delegate_sdomainId']) ) {
		return array('success'=>true) ;
	}
	//specRsiRecouveo_lib_calc_perf() ;
	return array('success'=>true) ;
}


function specRsiRecouveo_cfg_getAuth( $post_data ) {
	global $_opDB ;
	
	// **** Load data ****
	$SOC_parentkey_arrKeys = array() ;
	$query = "SELECT * FROM view_bible_LIB_ACCOUNT_tree" ;
	$result = $_opDB->query($query);
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$parent_key = $arr['treenode_parent_key'] ;
		$key = $arr['treenode_key'] ;
		
		if( !is_array($SOC_parentkey_arrKeys[$parent_key]) ) {
			$SOC_parentkey_arrKeys[$parent_key] = array() ;
		}
		$SOC_parentkey_arrKeys[$parent_key][] = $key ;
	}
	$bibleTree_soc = new GenericObjTree('&',array()) ;
	while( true ) {
		$done = array() ;
		foreach( $SOC_parentkey_arrKeys as $parent_key => $keys ) {
			$tparent_key = $parent_key ;
			if( !$tparent_key ) {
				$tparent_key = '&' ;
			}
			$parent_tree = $bibleTree_soc->getTree($tparent_key) ;
			if( !$parent_tree ) {
				continue ;
			}
			foreach( $keys as $key ) {
				$parent_tree->addLeaf( $key, $key ) ;
			}
			
			$done[] = $parent_key ;
		}
		
		if( count($done) == 0 ) {
			break ;
		}
		foreach( $done as $parent_key ) {
			unset($SOC_parentkey_arrKeys[$parent_key]) ;
		}
	}
	// *********
	
	// **************
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_atr = $ttmp['data']['cfg_atr'] ;
	// ***************
	
	
	if( !isset($_SESSION['login_data']['delegate_sdomainId']) ) {
		return array('success'=>true) ;
	}
	
	$t = new DatabaseMgr_Sdomain( DatabaseMgr_Base::dbCurrent_getDomainId() ) ;
	if( $_SESSION['login_data']['delegate_sdomainId'] != $t->dbCurrent_getSdomainId() ) {
		return array('success'=>false) ;
	}
	
	
	
	
	
	$user_id = $_SESSION['login_data']['delegate_userId'] ;
	$query = "SELECT * FROM view_bible_USER_entry WHERE field_USER_ID='{$user_id}'" ;
	$result = $_opDB->query($query) ;
	if( ($arr = $_opDB->fetch_assoc($result)) == FALSE ) {
		return array('success'=>false) ;
	}
	
	$authSoc = array() ;
	if( $arr['field_LINK_SOC'] && json_decode($arr['field_LINK_SOC'],true) ) {
		foreach( json_decode($arr['field_LINK_SOC'],true) as $soc_key ) {
			if( $soc_tree = $bibleTree_soc->getTree($soc_key) ) {
				foreach( $soc_tree->getAllMembers() as $soc_key ) {
					$authSoc[] = $soc_key ;
				}
			}
		}
	}
	
	$authMapAtr = array() ;
	foreach( $cfg_atr as $atr_record ) {
		// TODO / HACK ! Migrer vers nouveau format scénario
		/*
		$mkey = $atr_record['atr_field'] ;
		$authMapAtr[$mkey] = null ;
		if( $arr['field_LINK_'.$mkey] && json_decode($arr['field_LINK_'.$mkey],true) ) {
			$authMapAtr[$mkey] = array() ;
			foreach( json_decode($arr['field_LINK_'.$mkey],true) as $atr_key ) {
				$authMapAtr[$mkey][] = $atr_key ;
			}
		}
		*/
	}
	
	$authIsExt = ($arr['field_STATUS_IS_EXT']==1 ? $arr['field_USER_ID'] : null) ;
	
	return array(
		'success' => true,
		'authSoc' => $authSoc,
		'authMapAtr' => $authMapAtr,
		'authIsExt' => $authIsExt
	) ;
}


function specRsiRecouveo_cfg_getConfig() {
	if( isset($GLOBALS['cache_specRsiRecouveo_cfg']['getConfig']) ) {
		return array(
			'success'=>true,
			'data' => $GLOBALS['cache_specRsiRecouveo_cfg']['getConfig']
		);
	}
	
	global $_opDB ;
	
	
	$GLOBALS['cache_specRsiRecouveo_cfg']['getConfig'] = array();
	
	$TAB_status = array() ;
	$query = "SELECT * FROM view_bible_CFG_STATUS_tree WHERE 1 ORDER BY treenode_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB_status[] = array(
			'status_id' => $arr['field_CODE'],
			'status_txt' => $arr['field_TXT'],
			'status_code' => $arr['field_TXT'],
			'status_color' => $arr['field_COLOR'],
			'sched_none' => $arr['field_SCHED_NONE'],
			'sched_lock' => $arr['field_SCHED_LOCK'],
			'sched_prefix' => $arr['field_SCHED_PREFIX']
		) ;
	}
	
	$TAB_action = array() ;
	$query = "SELECT * FROM view_bible_CFG_ACTION_entry WHERE 1 ORDER BY entry_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB_action[] = array(
			'action_id' => $arr['field_ACTION_CODE'],
			'action_txt' => $arr['field_ACTION_TXT'],
			'action_cls' => $arr['field_ACTION_CLS'],
			'group_id' => $arr['treenode_key'],
			'status_open' => json_decode($arr['field_LINK_STATUS_OPEN'],true),
			'status_next' => json_decode($arr['field_LINK_STATUS_NEXT'],true),
			'is_next' => $arr['field_IS_NEXT'],
			'is_next_sched' => $arr['field_IS_NEXT_SCHED'],
			'agenda_class' => $arr['field_AGENDA_CLASS']
		) ;
	}
	
	$TAB_action_eta = array() ;
	$query = "SELECT * FROM view_bible_CFG_ACTION_ETA_entry WHERE 1 ORDER BY entry_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB_action_eta[] = array(
			'eta_range' => $arr['field_ETA_RANGE'],
			'eta_txt' => $arr['field_ETA_TXT'],
			'eta_color' => $arr['field_ETA_COLOR'],
			'upto_days' => $arr['field_UPTO_DAYS']
		) ;
	}
	
	$TAB_tpl = array() ;
	$query = "SELECT * FROM view_bible_TPL_entry WHERE 1 ORDER BY entry_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB_tpl[] = array(
			'tpl_id' => $arr['field_TPL_ID'],
			'tpl_name' => $arr['field_TPL_NAME'],
			'tpl_group' => $arr['treenode_key'],
			'manual_is_on' => $arr['field_MANUAL_IS_ON'],
			'input_fields_json' => $arr['field_INPUT_FIELDS'],
			'html_body' => $arr['field_HTML_BODY'],
			'html_title' => $arr['field_HTML_TITLE']
		) ;
	}

	$TAB_list_atr = array() ;
	$TAB_list_opt = array() ;
	$TAB_soc = NULL ;
	$json_define = paracrm_define_getMainToolbar( array('data_type'=>'bible') , true ) ;
	foreach( $json_define['data_bible'] as $define_bible ) {
		if( strpos($define_bible['bibleId'],'OPT_')===0 || $define_bible['bibleId']=='LIB_ACCOUNT' ) {
			$json_define_bible = paracrm_data_getBibleCfg(array('bible_code'=>$define_bible['bibleId'])) ;
			
			$bible_code = $define_bible['bibleId'] ;
			$bible_desc = $define_bible['text'] ;
			if( strpos($bible_code,'OPT_')===0 && strpos($bible_desc,'Option : ')===0 ) {
				$bible_desc = substr($bible_desc,strlen('Option : ')) ;
			}
			
			$records = array() ;
			$query = "SELECT * FROM view_bible_{$bible_code}_tree ORDER BY treenode_key" ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
				$parent = $arr['treenode_parent_key'] ;
				$node = $arr['treenode_key'] ;
				$id = $arr['treenode_key'] ;
				$lib = array() ;
				foreach( $json_define_bible['data']['tree_fields'] as $tree_field ) {
					if( strpos($tree_field['tree_field_code'],'field_')===0 && $tree_field['tree_field_is_header'] ) {
						$lib[] = $arr[$tree_field['tree_field_code']] ;
					}
				}
				$next = $arr['field_LINK_NEXT'] ;
				$records[] = array('node'=>'', 'id'=>$id, 'parent'=>$parent, 'text'=>implode(' - ',$lib), 'next'=>$next) ;
			}
			
			$new_rec = array(
				'bible_code' => $bible_code,
				'atr_code' => substr($bible_code,4),
				'atr_txt' => $bible_desc,
				'records' => $records
			) ;
			
			if( strpos($define_bible['bibleId'],'OPT_')===0 ) {
				$TAB_list_opt[] = $new_rec ;
			}
			if( $define_bible['bibleId']=='LIB_ACCOUNT' ) {
				$TAB_soc = array() ;
				foreach( $records as $rec ) {
					$TAB_soc[] = array(
						'soc_id' => $rec['id'],
						'soc_parent_id' => $rec['parent'],
						'soc_name' => $rec['text']
					);
				}
			}
		}
	}
	
	$TAB_balage = array() ;
	$query = "SELECT * FROM view_bible_CFG_BALAGE_tree WHERE 1 ORDER BY treenode_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB_balage[] = array(
			'segmt_id' => $arr['field_SEGMT_ID'],
			'segmt_txt' => $arr['field_SEGMT_TXT'],
			'calc_from_days' => $arr['field_CALC_FROM_J']
		) ;
	}
	
	$TAB_user = array() ;
	$query = "SELECT * FROM view_bible_USER_entry WHERE 1 ORDER BY entry_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB_user[] = array(
			'user_id' => $arr['field_USER_ID'],
			'user_pw' => $arr['field_USER_PW'],
			'user_short' => $arr['field_USER_SHORT'],
			'user_fullname' => $arr['field_USER_FULLNAME'],
			'user_email' => $arr['field_USER_EMAIL'],
			'user_tel' => $arr['field_USER_TEL'],
			'status_is_ext' => ($arr['field_STATUS_IS_EXT']==1)
		) ;
	}
	
	$TAB_email = array() ;
	$query = "SELECT * FROM view_bible_EMAIL_entry WHERE 1 ORDER BY entry_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB_email[] = array(
			'email_adr' => strtolower($arr['field_EMAIL_ADR']),
			'email_name' => $arr['field_EMAIL_NAME'],
			'email_signature' => $arr['field_EMAIL_SIGNATURE'],
			'server_url' => $arr['field_SERVER_URL'],
			'server_username' => $arr['field_SERVER_USERNAME'],
			'server_passwd' => $arr['field_SERVER_PASSWD'],
			'dkim_json' => $arr['field_DKIM_JSON'],
			'link_is_default' => ($arr['field_LINK_IS_DEFAULT']==1),
			'link_SOC' => json_decode($arr['field_LINK_SOC'],true)
		) ;
	}
	
	$TAB_atr = $TAB_soc = array() ;
	$query = "SELECT * FROM view_bible_LIB_ACCOUNT_tree ORDER BY treenode_key" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$soc_id = $arr['treenode_key'];
		$TAB_soc[$soc_id] = array(
			'soc_id' => $arr['field_SOC_ID'],
			'soc_parent_id' => $arr['treenode_parent_key'],
			'soc_name' => $arr['field_SOC_NAME'],
			'soc_xe_currency' => $arr['field_SOC_XE_CURRENCY'],
			'atr_ids' => array()
		);
		
		if( !$arr['field_SOC_METAFIELDS_JSON'] ) {
			continue ;
		}
		foreach( json_decode($arr['field_SOC_METAFIELDS_JSON'], true) as $metafield ) {
			$atr_id = $metafield['metafield_assoc'].'@'.$metafield['metafield_code'] ;
			if( !$TAB_atr[$atr_id] ) {
				switch( $metafield['metafield_assoc'] ) {
					case 'account' :
						$mcode = 'A' ;
						break ;
					case 'record' :
						$mcode = 'R' ;
						break ;
					default :
						continue 2 ;
				}
				$TAB_atr[$atr_id] = array(
					'atr_id' => $atr_id,
					'atr_desc' => $metafield['metafield_desc'],
					'atr_field' => 'ATR'.'_'.$mcode.'_'.$metafield['metafield_code'],
					'atr_type' => $metafield['metafield_assoc'],
					'is_filter' => $metafield['is_filter'],
					'is_globalfilter' => $metafield['is_globalfilter'],
					'is_editable' => $metafield['is_editable']
				);
			}
			$TAB_soc[$soc_id]['atr_ids'][] = $atr_id ;
		}
	}
	$TAB_soc = array_values($TAB_soc) ;
	$TAB_atr = array_values($TAB_atr) ;
	foreach( $TAB_atr as &$atr ) {
		if( $atr['is_filter'] && $atr['atr_type']=='account' ) {
			$atr['filter_values'] = array() ;
			$query = "SELECT distinct field_{$atr['atr_field']} FROM view_bible_LIB_ACCOUNT_entry" ;
			$result = $_opDB->query($query) ;
			while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
				if( !$arr[0] ) {
					continue ;
				}
				$atr['filter_values'][] = $arr[0] ;
			}
		}
	}
	unset($atr) ;
	
	$GLOBALS['cache_specRsiRecouveo_cfg']['getConfig'] = array(
		'cfg_atr' => $TAB_atr,
		'cfg_opt' => $TAB_list_opt,
		'cfg_status' => $TAB_status,
		'cfg_action' => $TAB_action,
		'cfg_action_eta' => $TAB_action_eta,
		'cfg_balage' => $TAB_balage,
		'cfg_template' => $TAB_tpl,
		'cfg_soc' => $TAB_soc,
		'cfg_user' => $TAB_user,
		'cfg_email' => $TAB_email,
		'cfg_reportval' => specRsiRecouveo_report_getValuesDesc()
	);
	
	
	$TAB_action_next = array() ;
	foreach( $TAB_action as $action_record ) {
		$TAB_action_next[] = array(
			'id' => $action_record['action_id'],
			'parent' => '',
			'text' => $action_record['action_txt']
		);
	}
	foreach( $TAB_list_opt as $opt_record ) {
		switch( $opt_record['bible_code'] ) {
			case 'OPT_JUDIC' :
				$action_prefix = 'JUDIC_FOLLOW' ;
				break ;
			case 'OPT_LITIG' :
				$action_prefix = 'LITIG_FOLLOW' ;
				break ;
			case 'OPT_CLOSEASK' :
				$action_prefix = 'CLOSE_ACK' ;
				break ;
			default :
				continue 2 ;
		}
		foreach( $opt_record['records'] as $rec ) {
			$TAB_action_next[] = array(
				'id' => $action_prefix.'_'.$rec['id'],
				'parent' => $action_prefix,
				'text' => $rec['text']
			);
		}
	}
	foreach( $TAB_tpl as $tpl ) {
		$action_prefix = 'MAIL_OUT' ;
		$TAB_action_next[] = array(
			'id' => $action_prefix.'_'.$tpl['tpl_id'],
			'parent' => $action_prefix,
			'text' => $tpl['tpl_name']
		);
	}
	$GLOBALS['cache_specRsiRecouveo_cfg']['getConfig']['cfg_actionnext'] = $TAB_action_next ;
	
	
	
	return array('success'=>true, 'data'=>$GLOBALS['cache_specRsiRecouveo_cfg']['getConfig'])  ;
}




function specRsiRecouveo_util_getLogUser() {
	$user_id = strtoupper($_SESSION['login_data']['delegate_userId']) ;
	if( !$user_id ) {
		return NULL ;
	}
	
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_user = $ttmp['data']['cfg_user'] ;
	$map_user = array() ;
	foreach( $cfg_user as $user ) {
		$map_user[$user['user_id']] = $user ;
	}
	
	if( $map_user[$user_id] && $map_user[$user_id]['user_short'] ) {
		return $user_id.'@'.$map_user[$user_id]['user_short'] ;
	}
	return $user_id ;
}






function specRsiRecouveo_util_htmlToPdf( $post_data ) {
	if( $output_pdf = specRsiRecouveo_util_htmlToPdf_buffer(json_decode($post_data['html'],true)) ) {
		$filename = ($post_data['filename'] ? $post_data['filename'] : 'PRINT'.'_'.time().'.pdf') ;
		header("Content-Type: application/force-download; name=\"$filename\""); 
		header("Content-Disposition: attachment; filename=\"$filename\""); 
		echo $output_pdf ;
	}
	die() ;
}
function specRsiRecouveo_util_htmlToPdf_buffer( $input_html ) {
	if( $output_pdf = media_pdf_html2pdf($input_html,'A4') ) {
		return $output_pdf ;
	}
	return NULL ;
}










function specRsiRecouveo_lib_getBarcodePng( $text=0, $size=20, $orientation='horizontal', $code_type="code128") {
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
