<?php
function specRsiRecouveo_action_execMailAutoPreview( $post_data ) {
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_email = $ttmp['data']['cfg_email'] ;
	$cfg_template = $ttmp['data']['cfg_template'] ;
	
	$p_fileFilerecordId = $post_data['file_filerecord_id'] ;
	$p_filesubFilerecordId = $post_data['filesub_filerecord_id'] ;
	$p_tplId = $post_data['tpl_id'] ;
	
	$json_file = specRsiRecouveo_file_getRecords( array(
		'filter_fileFilerecordId_arr' => json_encode(array($p_fileFilerecordId))
	)) ;
	$file = $json_file['data'][0] ;
	if( $file['file_filerecord_id'] != $p_fileFilerecordId ) {
		return array('success'=>false) ;
	}
	if( $p_filesubFilerecordId ) {
		//return array('success'=>false, 'error'=>'FileSub not supported') ;
	}
	if( $p_filesubFilerecordId ) {
		$filter_recordsFilerecordIds = array() ;
		foreach( $file['records'] as $fileRecord_row ) {
			$cur_filesub_filerecord_id = $fileRecord_row['link_filesub_filerecord_id'] ;
			if( !$cur_filesub_filerecord_id || ($cur_filesub_filerecord_id!=$p_filesubFilerecordId) ) {
				continue ;
			}
			$filter_recordsFilerecordIds[] = $fileRecord_row['record_filerecord_id'] ;
		}
	}
	
	switch( $post_data['adr_type'] ) {
		case 'POSTAL' :
			// recherche adresse
			$t_adrPost_name = $t_adrPost_txt = NULL ;
			$json = specRsiRecouveo_account_open( array('acc_id'=>$file['acc_id']) ) ;
			$account = $json['data'] ;
			foreach( $account['adrbook'] as $adrbook ) {
				foreach( $adrbook['adrbookentries'] as $adrbookentry ) {
					if( $adrbookentry['adr_type']=='POSTAL' && $adrbookentry['status_is_priority'] && !$adrbookentry['status_is_invalid'] ) {
						$t_adrPost_name = $adrbook['adr_entity'] ;
						$t_adrPost_txt = $adrbookentry['adr_txt'] ;
					}
				}
			}
			if( !$t_adrPost_txt ) {
				return array('success'=>false, 'error'=>'Adresse manquante') ;
			}
			$forward_post['tpl_id'] = $p_tplId ;
			$forward_post['adrpost_entity_name'] = $t_adrPost_name ;
			$forward_post['adrpost_txt'] = $t_adrPost_txt ;
			
			
			
			$json = specRsiRecouveo_doc_getMailOut(array(
				'tpl_id' => $p_tplId,
				'file_filerecord_id' => $p_fileFilerecordId,
				'record_filerecord_ids' => ($filter_recordsFilerecordIds ? json_encode($filter_recordsFilerecordIds) : null ),
				'adr_type' => $post_data['adr_type'],
				'adr_name' => $t_adrPost_name,
				'adr_postal' => $t_adrPost_txt,
				'input_fields' => json_encode(array())
			)) ;
			return $json ;
			
		case 'EMAIL' :
			$t_adrEmail_dest = $t_adrEmail_src = NULL ;
			$json = specRsiRecouveo_account_open( array('acc_id'=>$file['acc_id']) ) ;
			$account = $json['data'] ;
			
			// recherche adresse DEST
			foreach( $account['adrbook'] as $adrbook ) {
				foreach( $adrbook['adrbookentries'] as $adrbookentry ) {
					if( $adrbookentry['adr_type']=='EMAIL' && $adrbookentry['status_is_priority'] && !$adrbookentry['status_is_invalid'] ) {
						$t_adrEmail_dest = $adrbookentry['adr_txt'] ;
					}
				}
			}
			
			// recherche adresse SRC
			$soc_id = $account['soc_id'] ;
			foreach( $cfg_email as $row_email ) {
				if( in_array($soc_id,$row_email['link_SOC']) && $row_email['link_is_default'] ) {
					$t_adrEmail_src = $row_email['email_adr'] ;
					break ;
				}
			}
			
			// no adrs ?
			if( !$t_adrEmail_src || !$t_adrEmail_dest ) {
				return array('success'=>false, 'error'=>'Expéditeur/destinataire manquant(s)') ;
			}
			
			$htmls = specRsiRecouveo_doc_getMailOut(array(
				'tpl_id' => $p_tplId,
				'file_filerecord_id' => $p_fileFilerecordId,
				'record_filerecord_ids' => ($filter_recordsFilerecordIds ? json_encode($filter_recordsFilerecordIds) : null ),
				'adr_type' => $post_data['adr_type'],
				'input_fields' => json_encode(array())
			),$real=FALSE,$htmlraw=TRUE) ;
			
			$html_body = $htmls[0] ;
			
			$attachments = array() ;
			for( $i=1 ; $i<count($htmls) ; $i++ ) {
				$binary_html = $htmls[$i] ;
				$binary_pdf = specRsiRecouveo_util_htmlToPdf_buffer($binary_html) ;
				
				$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
				$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;
				
				media_contextOpen( $_sdomain_id ) ;
				$attachments[] = array(
					'filename' => preg_replace("/[^a-zA-Z0-9]/", "", $file['acc_id']).'_'.date('Ymd').'.pdf',
					'outmodel_tmp_media_id' => media_bin_processBuffer( $binary_pdf )
				);
				media_contextClose() ;
			}
			
			// subject ?
			foreach( $cfg_template as $tpl_row ) {
				if( $tpl_row['tpl_id'] == $p_tplId ) {
					$subject = $tpl_row['html_title'] ;
					break ;
				}
			}
				// ******** 06/02/2019 : attributs, probe LANG atr *********
				$probe_lang_atrField = NULL ;
				$ttmp = specRsiRecouveo_cfg_getConfig() ;
				$cfg_atr = $ttmp['data']['cfg_atr'] ;
				foreach( $cfg_atr as $atr_record ) {
					$atr_id = $atr_record['atr_id'] ;
					$ttmp = explode('@',$atr_id) ;
					$atr_code = $ttmp[1] ;
					if( $atr_record['atr_type']=='account' && $atr_code=='LANG' ) {
						$probe_lang_atrField = $atr_record['atr_field'] ;
						break ;
					}
				}
				if( $probe_lang_atrField && $account ) {
					$_lang_code = $account[$probe_lang_atrField] ;
				}
				if( $_lang_code ) {
					$doc = new DOMDocument();
					@$doc->loadHTML('<?xml encoding="UTF-8"><html>'.$subject.'</html>');
					specRsiRecouveo_doc_replaceLang($doc,$_lang_code) ;
					$subject = strip_tags($doc->saveHTML()) ;
				}
			
			//build email record
			$email_record = array(
				'subject' => $subject,
				'outmodel_preprocess_subject' => true,
				'outmodel_file_filerecord_id' => $p_fileFilerecordId,
				'body_html' => $html_body,
				'attachments' => $attachments,
				'header_adrs' => array(
					array(
						'header' => 'from',
						'adr_address' => $t_adrEmail_src
					),
					array(
						'header' => 'to',
						'adr_address' => $t_adrEmail_dest
					)
				)
			);
			
			$json = specRsiRecouveo_mail_buildEmail(array(
				'data' => json_encode($email_record)
			)) ;
			return $json ;
			
		default :
			break ;
	}

	return array('success'=>false) ;
}

function specRsiRecouveo_action_execMailAutoAction( $post_data ) {
	$file_code = 'FILE_ACTION' ;
	$p_fileFilerecordId = $post_data['file_filerecord_id'] ;
	$p_fileActionFilerecordId = $post_data['fileaction_filerecord_id'] ;
	$p_isNoSched = $post_data['is_no_sched'] ;
	
	global $_opDB ;
	
	if( !$p_isNoSched ) {
		$json = specRsiRecouveo_config_getScenarios(array()) ;
		$map_scenCode_scenstepCode_step = array() ;
		$map_scenCode_prestepCode_step = array() ;
		foreach( $json['data'] as $scenario ) {
			foreach( $scenario['steps'] as $scenstep ) {
				$map_scenCode_scenstepTag_step[$scenario['scen_code']][$scenstep['scenstep_tag']] = $scenstep ;
			}
			foreach( $scenario['presteps'] as $prestep ) {
				$map_scenCode_prestepTab_step[$scenario['scen_code']][$prestep['prestep_tag']] = $prestep ;
			}
		}
		
		$json_file = specRsiRecouveo_file_getRecords( array(
			'filter_fileFilerecordId_arr' => json_encode(array($p_fileFilerecordId))
		)) ;
		$file = $json_file['data'][0] ;
		if( $file['file_filerecord_id'] != $p_fileFilerecordId ) {
			return array('success'=>false) ;
		}
		if( !$file['status_is_schednone'] ) {
			$nextaction_filerecord_id = $file['next_fileaction_filerecord_id'] ;
			if( $nextaction_filerecord_id != $p_fileActionFilerecordId ) {
				return array('success'=>false) ;
			}

			$next_action = NULL ;
			foreach( $file['actions'] as $action ) {
				if( $action['fileaction_filerecord_id'] == $nextaction_filerecord_id ) {
					$next_action = $action ;
				}
			}
			if( !$next_action ) {
				return array('success'=>false) ;
			}
			
			$scen_code = $file['scen_code'] ;
			$scenstep_tag = $next_action['scenstep_tag'] ;
			if( !$scen_code || !$scenstep_tag ) {
				continue ;
			}
			$scenstep = $map_scenCode_scenstepTag_step[$scen_code][$scenstep_tag] ;
			if( !$scenstep ) {
				continue ;
			}
			
			if( $scenstep['exec_is_auto'] 
			&& $next_action['link_action']=='MAIL_OUT'
			&& $next_action['link_action'] == $scenstep['link_action']
			&& $next_action['link_tpl'] == $scenstep['link_tpl'] ) {
			
				// OK
			} else {
				return array('success'=>false) ;
			}
			
			
			// ** Scénario : médias envoi ?
			//print_r($scenstep) ;
			$modes = json_decode($scenstep['mail_modes_json'],true) ;
			if( !$modes ) {
				$modes = array('postal_std') ;
			}
		}
		if( $file['status_is_schednone'] ) {
			$next_action = NULL ;
			foreach( $file['actions'] as $action ) {
				if( $action['fileaction_filerecord_id'] == $p_fileActionFilerecordId ) {
					$next_action = $action ;
				}
			}
			if( !$next_action || $next_action['status_is_ok'] ) {
				return array('success'=>false) ;
			}
			
			$filesub_filerecord_id = $next_action['link_filesub_filerecord_id'] ;
			if( !$filesub_filerecord_id ) {
				return array('success'=>false) ;
			}
			
			$scen_code = $file['scen_code'] ;
			$prestep_tag = $next_action['scenstep_tag'] ;
			if( !$scen_code || !$prestep_tag ) {
				continue ;
			}
			$prestep = $map_scenCode_prestepTab_step[$scen_code][$prestep_tag] ;
			if( !$prestep ) {
				continue ;
			}
			
			if( $prestep['exec_is_auto'] 
			&& $next_action['link_action']=='MAIL_OUT'
			&& $next_action['link_action'] == $prestep['link_action']
			&& $next_action['link_tpl'] == $prestep['link_tpl'] ) {
			
				// OK
			} else {
				return array('success'=>false) ;
			}
			
			
			// ** Scénario : médias envoi ?
			//print_r($prestep) ;
			$modes = json_decode($prestep['mail_modes_json'],true) ;
			if( !$modes ) {
				$modes = array('postal_std') ;
			}
		}
	}
	if( $p_isNoSched ) {
		$modes = array('postal_std','email') ;
		
		$json_file = specRsiRecouveo_file_getRecords( array(
			'filter_fileFilerecordId_arr' => json_encode(array($p_fileFilerecordId))
		)) ;
		$file = $json_file['data'][0] ;
		if( $file['file_filerecord_id'] != $p_fileFilerecordId ) {
			return array('success'=>false) ;
		}
		$next_action = NULL ;
		foreach( $file['actions'] as $action ) {
			if( $action['fileaction_filerecord_id'] == $p_fileActionFilerecordId ) {
				$next_action = $action ;
			}
		}
		if( !$next_action ) {
			return array('success'=>false) ;
		}
	}
	
	
	// ***** Action en cours *********
	$arr_ins_base = array() ;
	$arr_ins_base['field_LOG_USER'] = specRsiRecouveo_util_getLogUser() ;
	$arr_ins_base['field_STATUS_IS_OK'] = 1 ;
	$arr_ins_base['field_DATE_ACTUAL'] = date('Y-m-d H:i:s') ;
	if( $filesub_filerecord_id ) {
		$arr_ins_base['field_LINK_FILESUB_ID'] = $filesub_filerecord_id ;
	}
	$arr_ins_base['field_LINK_STATUS'] = $next_action['link_status'] ;
	$arr_ins_base['field_LINK_TPL'] = $next_action['link_tpl'] ;
	$arr_ins_base['field_SCENSTEP_CODE'] = $next_action['scenstep_code'] ;
	$arr_ins_base['field_SCENSTEP_TAG'] = $next_action['scenstep_tag'] ;
	if( $next_action['link_tpl'] ) {
		$json = specRsiRecouveo_doc_cfg_getTpl( array('tpl_id'=>$next_action['link_tpl']) ) ;
		$txt.= "Modèle envoi : ".$json['data'][0]['tpl_name']."\r\n" ;
	}
	$arr_ins_base['field_TXT'] = $txt ;
	//$arr_ins['field_LINK_ACTION'] = $post_form['link_action'] ;
	
	
	
	if( array_intersect($modes,array('postal_std','postal_rar')) ) {
		// génération action envoi POSTAL
		$json = specRsiRecouveo_action_execMailAutoPreview( array(
			'file_filerecord_id' => $p_fileFilerecordId,
			'filesub_filerecord_id' => $filesub_filerecord_id,
			'tpl_id' => $next_action['link_tpl'],
			'adr_type' => 'POSTAL'
		));
		if( $json['success'] ) {
			$envDocs = array($json['data']) ;
			$meta_data = $json['meta'] ;
			
			$arr_ins = $arr_ins_base ;
			$arr_ins['field_LINK_ACTION'] = 'MAIL_OUT' ;
			$fileaction_filerecord_id = paracrm_lib_data_insertRecord_file( $file_code, $p_fileFilerecordId, $arr_ins );
			$action_sent = TRUE ;
			
			if( $envDocs ) {
				$env_filerecord_id = specRsiRecouveo_doc_buildEnvelope( $p_fileFilerecordId, $envDocs, $meta_data ) ;
				
				$arr_ins = array() ;
				$arr_ins['field_LINK_ENV_ID'] = $env_filerecord_id ;
				paracrm_lib_data_updateRecord_file( 'FILE_ACTION', $arr_ins, $fileaction_filerecord_id);
			}
		}
	}
	if( array_intersect($modes,array('email')) ) {
		// génération action envoi EMAIL
		$json = specRsiRecouveo_action_execMailAutoPreview( array(
			'file_filerecord_id' => $p_fileFilerecordId,
			'filesub_filerecord_id' => $filesub_filerecord_id,
			'tpl_id' => $next_action['link_tpl'],
			'adr_type' => 'EMAIL'
		));
		if( $json['success'] ) {
			$tmp_media_id = $json['tmp_media_id'] ;
			
			$arr_ins = $arr_ins_base ;
			$arr_ins['field_LINK_ACTION'] = 'EMAIL_OUT' ;
			$fileaction_filerecord_id = paracrm_lib_data_insertRecord_file( $file_code, $p_fileFilerecordId, $arr_ins );
			$action_sent = TRUE ;
			
			$email_filerecord_id = specRsiRecouveo_lib_mail_createEmailForAction($tmp_media_id,$fileaction_filerecord_id) ;
			if( $email_filerecord_id ) {
				$arr_ins = array() ;
				$arr_ins['field_LINK_MEDIA_FILECODE'] = 'EMAIL' ;
				$arr_ins['field_LINK_MEDIA_FILEID'] = $email_filerecord_id ;
				paracrm_lib_data_updateRecord_file( 'FILE_ACTION', $arr_ins, $fileaction_filerecord_id);
			}
		}
	}
	
	if( !$action_sent || $p_isNoSched ) {
		// pas d'envoi
		return array('success'=>true) ;
	}
	
	if( !$file['status_is_schednone'] ) {
		// next action ?
		$status_next = $next_action['link_status'] ;
		$json = specRsiRecouveo_file_getScenarioLine( array(
			'file_filerecord_id' => $p_fileFilerecordId,
			'fileaction_filerecord_id' => $nextaction_filerecord_id
		)) ;
		foreach( $json['data'] as $scenline_dot ) {
			if( $scenline_dot['is_next'] ) {
				$forward_post['next_action'] = $scenline_dot['link_action'] ;
				$forward_post['next_action_txt'] = $scenline_dot['link_txt'] ;
				$forward_post['scen_code'] = $scen_code ;
				$forward_post['next_scenstep_code'] = $scenline_dot['scenstep_code'] ;
				$forward_post['next_scenstep_tag'] = $scenline_dot['scenstep_tag'] ;
				$forward_post['next_date'] = $scenline_dot['date_sched'] ;
			}
		}
		$link_tpl_id = NULL ;
		$ttmp = specRsiRecouveo_config_getScenarios(array()) ;
		foreach( $ttmp['data'] as $t_row_scen ) {
			foreach( $t_row_scen['steps'] as $t_row_scenstep ) {
				if( $t_row_scenstep['scenstep_code'] == $forward_post['next_scenstep_code'] ) {
					$link_tpl_id = $t_row_scenstep['link_tpl'] ;
				}
			}
		}
		if( $forward_post['next_action'] ) {
			$arr_ins = array() ;
			$arr_ins['field_LINK_STATUS'] = $status_next ;
			$arr_ins['field_LINK_ACTION'] = $forward_post['next_action'] ;
			$arr_ins['field_LINK_SCENARIO'] = $forward_post['next_scenstep_code'] ;
			$arr_ins['field_SCENSTEP_TAG'] = $forward_post['next_scenstep_tag'] ;
			$arr_ins['field_DATE_SCHED'] = $forward_post['next_date'] ;
			if( $link_tpl_id ) {
				$arr_ins['field_LINK_TPL'] = $link_tpl_id ;
			}
			if( $forward_post['next_action_txt'] ) {
				$arr_ins['field_LINK_TXT'] = $forward_post['next_action_txt'] ;
			}
			$next_fileaction_filerecord_id = paracrm_lib_data_insertRecord_file( $file_code, $p_fileFilerecordId, $arr_ins );
		}
	}
	// delete cur action ?
	paracrm_lib_data_deleteRecord_file($file_code,$p_fileActionFilerecordId) ;
	
	
	return array('success'=>true) ;
}







function specRsiRecouveo_action_doFileAction( $post_data ) {
	global $_opDB ;
	
	$ttmp = specRsiRecouveo_cfg_getConfig() ;
	$cfg_status = $ttmp['data']['cfg_status'] ;
	$map_status = array() ;
	foreach( $cfg_status as $status ) {
		$map_status[$status['status_id']] = $status ;
	}
	$cfg_action = $ttmp['data']['cfg_action'] ;
	$map_action = array() ;
	foreach( $cfg_action as $action ) {
		$map_action[$action['action_id']] = $action ;
	}
	$map_optmailin = array() ;
	foreach( $ttmp['data']['cfg_opt'] as $cfg_opt ) {
		if( $cfg_opt['bible_code'] == 'OPT_MAILIN' ) {
			foreach( $cfg_opt['records'] as $rec ) {
				$map_optmailin[$rec['id']] = $rec['text'] ;
			}
		}
	}
	$map_optcallout = array() ;
	foreach( $ttmp['data']['cfg_opt'] as $cfg_opt ) {
		if( $cfg_opt['bible_code'] == 'OPT_CALLOUT' ) {
			foreach( $cfg_opt['records'] as $rec ) {
				$map_optcallout[$rec['id']] = $rec['text'] ;
			}
		}
	}
	
	$file_filerecord_id = $post_data['file_filerecord_id'] ;
	$ttmp = specRsiRecouveo_file_getRecords( array(
		'filter_fileFilerecordId_arr' => json_encode(array($file_filerecord_id))
	)) ;
	$file_record = $ttmp['data'][0] ;
	if( $file_record['file_filerecord_id'] != $file_filerecord_id ) {
		return array('success'=>false) ;
	}
	$acc_id = $file_record['acc_id'] ;
	$json = specRsiRecouveo_account_open( array('acc_id'=>$acc_id) ) ;
	if( !$json['success'] ) {
		return array('success'=>false) ;
	}
	$account_record = $json['data'] ;
	
	
	$is_sched_none = $file_record['status_is_schednone'] ;
	$is_sched_lock = $map_status[$file_record['status']]['sched_lock'] ;
	
	
	$post_form = json_decode($post_data['data'],true) ;
	$post_form['link_status'] = $file_record['status'] ;
	$file_code = 'FILE_ACTION' ;
	
	//print_r($post_form) ;
	
	
	
	// ******* Gestion des adresses *******
	$acc_id = $file_record['acc_id'] ;
	if( $post_form['adrpost_txt'] ) {
		if( $post_form['adrpost_filerecord_id'] && $post_form['adrpost_status'] ) {
			$arr_update = array() ;
			switch( $post_form['adrpost_status'] ) {
				case 'CONFIRM' :
					$arr_update['field_STATUS_IS_CONFIRM'] = 1 ;
					$arr_update['field_STATUS_IS_INVALID'] = 0 ;
					break ;
				case 'INVALID' :
					$arr_update['field_STATUS_IS_CONFIRM'] = 0 ;
					$arr_update['field_STATUS_IS_INVALID'] = 1 ;
					break ;
			}
			paracrm_lib_data_updateRecord_file( 'ADRBOOK_ENTRY', $arr_update, $post_form['adrpost_filerecord_id']);
		}
		if( $post_form['adrpost_new'] ) {
			$default_adrEntity = $post_form['adrpost_entity_name'] ;
			
			$query = "SELECT filerecord_id FROM view_file_ADRBOOK
						WHERE field_ACC_ID='{$acc_id}' AND field_ADR_ENTITY='{$default_adrEntity}'" ;
			$adrbook_filerecord_id = $_opDB->query_uniqueValue($query) ;
			if( !$adrbook_filerecord_id ) {
				$arr_ins = array() ;
				$arr_ins['field_ACC_ID'] = $acc_id ;
				$arr_ins['field_ADR_ENTITY'] = $default_adrEntity ;
				//$arr_ins['field_ADR_ENTITY_NAME'] = $post_form['adrpost_entity_name'] ;
				$adrbook_filerecord_id = paracrm_lib_data_insertRecord_file( 'ADRBOOK', 0, $arr_ins );
			}
			$arr_ins = array() ;
			$arr_ins['field_ADR_TYPE'] = 'POSTAL' ;
			$arr_ins['field_ADR_TXT'] = $post_form['adrpost_txt'] ;
			$arr_ins['field_STATUS_IS_CONFIRM'] = 1 ;
			paracrm_lib_data_insertRecord_file( 'ADRBOOK_ENTRY', $adrbook_filerecord_id, $arr_ins );
		}
	}
	if( $post_form['adrtel_txt'] ) {
		if( $post_form['adrtel_filerecord_id'] && $post_form['adrtel_status'] ) {
			$arr_update = array() ;
			switch( $post_form['adrtel_status'] ) {
				case 'CONFIRM' :
					$arr_update['field_STATUS_IS_CONFIRM'] = 1 ;
					$arr_update['field_STATUS_IS_INVALID'] = 0 ;
					break ;
				case 'INVALID' :
					$arr_update['field_STATUS_IS_CONFIRM'] = 0 ;
					$arr_update['field_STATUS_IS_INVALID'] = 1 ;
					break ;
			}
			paracrm_lib_data_updateRecord_file( 'ADRBOOK_ENTRY', $arr_update, $post_form['adrtel_filerecord_id']);
		}
		if( $post_form['adrtel_new'] ) {
			$default_adrEntity = $post_form['adrtel_entity_name'] ;
			
			$query = "SELECT filerecord_id FROM view_file_ADRBOOK
						WHERE field_ACC_ID='{$acc_id}' AND field_ADR_ENTITY='{$default_adrEntity}'" ;
			$adrbook_filerecord_id = $_opDB->query_uniqueValue($query) ;
			if( !$adrbook_filerecord_id ) {
				$arr_ins = array() ;
				$arr_ins['field_ACC_ID'] = $acc_id ;
				$arr_ins['field_ADR_ENTITY'] = $default_adrEntity ;
				//$arr_ins['field_ADR_ENTITY_NAME'] = $post_form['adrtel_entity_name'] ;
				$adrbook_filerecord_id = paracrm_lib_data_insertRecord_file( 'ADRBOOK', 0, $arr_ins );
			}
			$arr_ins = array() ;
			$arr_ins['field_ADR_TYPE'] = 'TEL' ;
			$arr_ins['field_ADR_TXT'] = $post_form['adrtel_txt'] ;
			$arr_ins['field_STATUS_IS_CONFIRM'] = 1 ;
			paracrm_lib_data_insertRecord_file( 'ADRBOOK_ENTRY', $adrbook_filerecord_id, $arr_ins );
		}
	}
	if( $post_form['adrmail_txt'] ) {
		if( $post_form['adrmail_filerecord_id'] && $post_form['adrmail_status'] ) {
			$arr_update = array() ;
			switch( $post_form['adrmail_status'] ) {
				case 'CONFIRM' :
					$arr_update['field_STATUS_IS_CONFIRM'] = 1 ;
					$arr_update['field_STATUS_IS_INVALID'] = 0 ;
					break ;
				case 'INVALID' :
					$arr_update['field_STATUS_IS_CONFIRM'] = 0 ;
					$arr_update['field_STATUS_IS_INVALID'] = 1 ;
					break ;
			}
			paracrm_lib_data_updateRecord_file( 'ADRBOOK_ENTRY', $arr_update, $post_form['adrmail_filerecord_id']);
		}
		if( $post_form['adrmail_new'] ) {
			$default_adrEntity = $post_form['adrmail_entity_name'] ;
			
			$query = "SELECT filerecord_id FROM view_file_ADRBOOK
						WHERE field_ACC_ID='{$acc_id}' AND field_ADR_ENTITY='{$default_adrEntity}'" ;
			$adrbook_filerecord_id = $_opDB->query_uniqueValue($query) ;
			if( !$adrbook_filerecord_id ) {
				$arr_ins = array() ;
				$arr_ins['field_ACC_ID'] = $acc_id ;
				$arr_ins['field_ADR_ENTITY'] = $default_adrEntity ;
				//$arr_ins['field_ADR_ENTITY_NAME'] = $post_form['adrmail_entity_name'] ;
				$adrbook_filerecord_id = paracrm_lib_data_insertRecord_file( 'ADRBOOK', 0, $arr_ins );
			}
			$arr_ins = array() ;
			$arr_ins['field_ADR_TYPE'] = 'EMAIL' ;
			$arr_ins['field_ADR_TXT'] = $post_form['adrmail_txt'] ;
			$arr_ins['field_STATUS_IS_CONFIRM'] = 1 ;
			paracrm_lib_data_insertRecord_file( 'ADRBOOK_ENTRY', $adrbook_filerecord_id, $arr_ins );
		}
	}
	
	
	
	// ***** Action en cours *********
	$arr_ins = array() ;
	$arr_ins['field_LOG_USER'] = specRsiRecouveo_util_getLogUser() ;
	$arr_ins['field_STATUS_IS_OK'] = 1 ;
	$arr_ins['field_DATE_ACTUAL'] = date('Y-m-d H:i:s') ;
	$arr_ins['field_LINK_STATUS'] = $post_form['link_status'] ;
	$arr_ins['field_LINK_ACTION'] = $post_form['link_action'] ;
	
	if( $post_form['fileaction_filerecord_id'] > 0 ) {
		$file_action_record = NULL ;
		foreach( $file_record['actions'] as $file_action_record_test ) {
			if( $file_action_record_test['fileaction_filerecord_id'] == $post_form['fileaction_filerecord_id'] ) {
				$file_action_record = $file_action_record_test ;
			}
		}
		if( !$file_action_record 
			|| $file_action_record['status_is_ok']
			|| $file_action_record['link_action'] != $post_form['link_action'] ) {
			return array('success'=>false) ;
		}
	}
	
	switch( $post_form['link_action'] ) {
		case 'CALL_RDV' :
		case 'CALL_IN' :
		case 'CALL_OUT' :
			$txt = '' ;
			$txt.= "Numéro d'appel : ".$post_form['adrtel_txt']."\r\n" ;
			if( $post_form['txt'] ) {
				$txt.= $post_form['txt']."\r\n" ;
			}
			$arr_ins['field_TXT'] = $txt ;
			
			$link_txt = '' ;
			if( $post_form['adrtel_entity_name'] ) {
				$link_txt.= $post_form['adrtel_entity_name']."\r\n" ;
			}
			if( $post_form['adrtel_result'] ) {
				$id = $post_form['adrtel_result'] ;
				$lib = $map_optcallout[$id] ;
				if( $lib ) {
					$link_txt.= $lib."\r\n" ;
				}
			}
			$arr_ins['field_LINK_TXT'] = $link_txt ;
			break ;
			
		case 'MAIL_IN' :
			$arr_ins['field_TXT'] = $post_form['txt'] ;
			
			$link_txt = '' ;
			if( $post_form['adrpost_entity_name'] ) {
				$link_txt.= $post_form['adrpost_entity_name']."\r\n" ;
			}
			if( $post_form['adrpost_result'] ) {
				$id = $post_form['adrpost_result'] ;
				$lib = $map_optmailin[$id] ;
				if( $lib ) {
					$link_txt.= $lib."\r\n" ;
				}
			}
			$arr_ins['field_LINK_TXT'] = $link_txt ;
			break ;
			
		case 'MAIL_OUT' :
			$txt = '' ;
			if( $post_form['tpl_id'] ) {
				$json = specRsiRecouveo_doc_cfg_getTpl( array('tpl_id'=>$post_form['tpl_id']) ) ;
				$txt.= "Modèle envoi : ".$json['data'][0]['tpl_name']."\r\n" ;
			}
			$arr_ins['field_LINK_TPL'] = $post_form['tpl_id'] ;
			$arr_ins['field_TXT'] = $txt ;
			break ;
			
		case 'MAIL_AUTO' :
			if( !$post_form['tpl_id'] ) {
				return array('success'=>false, 'error'=>'Modèle non spécifié') ;
			}
			$arr_ins['field_LINK_TXT'] = 'Envoi hors scénario' ;
			$arr_ins['field_LINK_TPL'] = $post_form['tpl_id'] ;
			break ;



		case 'SMS_OUT' :
			if( !specRsiRecouveo_lib_sms_createSmsForAction($post_tel, $post_content, $sms_filerecord_id, $test_mode=true) ) {
				return array('success'=>false) ;
			}

			$txt = '' ;
			if( $post_form['adrtel_entity_name'] ) {
				$txt.= "Nom : ".$post_form['adrtel_entity_name']."\r\n" ;
			}

			if ( $post_form['adrtel_txt'] ) {
				$txt.="Numéro: ".$post_form['adrtel_txt']."\r\n" ;
			}

			if ( $post_form['sms_content'] ) {
				$txt.="Contenu: ".$post_form['sms_content']."\r\n" ;
			}

			$arr_ins['field_TXT'] = $txt ;
			break ;

		case 'EMAIL_OUT' :
			if( !specRsiRecouveo_lib_mail_buildEmail($post_form['email_record'], $test_mode=true) ) {
				return array('success'=>false) ;
			}
			$txt = '' ;
			if( $post_form['email_subject'] ) {
				$txt.= "Sujet : ".$post_form['email_subject']."\r\n" ;
			}
			$arr_ins['field_TXT'] = $txt ;
			break ;
			
		case 'BUMP' :
			if( trim($post_form['link_txt']) || trim($post_form['txt']) ) {
				$arr_ins['field_LINK_TXT'] = trim($post_form['link_txt']) ;
				$arr_ins['field_TXT'] = trim($post_form['txt']) ;
			} else {
				$_do_delete_currentAction = TRUE ;
			}
			break ;
			
		case 'AGREE_FOLLOW' :
			switch( $post_form['schedlock_next'] ) {
				case 'resched' :
					unset($arr_ins['field_DATE_ACTUAL']) ;
					unset($arr_ins['field_STATUS_IS_OK']) ;
					$arr_ins['field_DATE_SCHED'] = $post_form['schedlock_resched_date'] ;
					break ;
					
				case 'confirm' :
					// DONE 170529
					// Link selected records
					if( $post_form['schedlock_confirm_ids'] && is_array(json_decode($post_form['schedlock_confirm_ids'],true)) ) {
						$forward_post = array(
							'file_filerecord_id' => $file_filerecord_id,
							'arr_recordFilerecordIds' => $post_form['schedlock_confirm_ids']
						) ;
						specRsiRecouveo_file_allocateRecordTemp($forward_post) ;
					}
					
					$txt = '' ;
					$txt.= "Promesse validée, paiement : ".$post_form['schedlock_confirm_txt']."\r\n" ;
					$arr_ins['field_LINK_TXT'] = 'Encaissé : '.$post_form['schedlock_confirm_amount'].' €' ;
					$arr_ins['field_TXT'] = $txt ;
					break ;
				
				case 'end' :
					$txt = '' ;
					$txt.= "Echéance annulée"."\r\n" ;
					$arr_ins['field_LINK_TXT'] = trim($txt) ;
					$arr_ins['field_TXT'] = $txt ;
					$arr_ins['field_LINK_AGREE_JSON'] = json_encode(array(
						'milestone_amount' => 0,
						'milestone_cancel' => true
					)) ;
					break ;
					
				case 'agree_summary' :
					// DONE 180329 : agreesummary detail
					$agree_milestone_cur = NULL ;
					foreach( $post_form['agree_summary'] as $row ) {
						if( $row['milestone_status'] == 'CUR' ) {
							$agree_milestone_cur = $row ;
						}
					}
					if( !$agree_milestone_cur || $agree_milestone_cur['milestone_fileaction_filerecord_id']!=$post_form['fileaction_filerecord_id'] ) {
						return array('success'=>false) ;
					}
					
					$map_recordId_amount = array() ;
					foreach( $agree_milestone_cur['milestone_commit_record_ids'] as $record_filerecord_id ) {
						foreach( $account_record['files'] as $iter_file_row ) {
							if( $iter_file_row['status_is_schedlock'] ) {
								continue ;
							}
							foreach( $iter_file_row['records'] as $iter_record_row ) {
								if( $iter_record_row['record_filerecord_id'] == $record_filerecord_id ) {
									$map_recordId_amount[$record_filerecord_id] = ((-1) * $iter_record_row['amount']) ;
									$txt_records[] = $iter_record_row['record_ref'] ;
								}
							}
						}
					}
					
					if( $agree_milestone_cur['milestone_date_sched_previous'] != $agree_milestone_cur['milestone_date_sched'] ) {
						$milestone_date_resched = $agree_milestone_cur['milestone_date_sched'] ;
					}
					
					if( array_sum($map_recordId_amount) == 0 ) {
						// aucun paiement
						if( !$milestone_date_resched ) {
							return array('success'=>false) ;
						}
						// resched
						$txt = '' ;
						$txt.= "Echéance reportée"."\r\n" ;
						$arr_ins['field_LINK_TXT'] = "Echéance reportée" ;
						$arr_ins['field_TXT'] = $txt ;
						$arr_ins['field_LINK_AGREE_JSON'] = json_encode(array(
							'milestone_amount' => 0,
							'linkrecord_arr_recordFilerecordIds' => array()
						)) ;
					} else {
						$txt = '' ;
						$txt.= "Echéance validée, attendu : {$agree_milestone_cur['milestone_amount']} , perçu : ".array_sum($map_recordId_amount)."\r\n" ;
						$txt.= "Paiements : ".implode(', ',$txt_records)."\r\n" ;
						$arr_ins['field_LINK_TXT'] = 'Encaissé : '.array_sum($map_recordId_amount).'' ;
						$arr_ins['field_TXT'] = $txt ;
						$arr_ins['field_LINK_AGREE_JSON'] = json_encode(array(
							'milestone_amount' => array_sum($map_recordId_amount),
							'linkrecord_arr_recordFilerecordIds' => array_keys($map_recordId_amount)
						)) ;
						
						$forward_post = array(
							'file_filerecord_id' => $file_filerecord_id,
							'arr_recordFilerecordIds' => json_encode(array_keys($map_recordId_amount))
						) ;
						specRsiRecouveo_file_allocateRecordTemp($forward_post) ;
					}
					break ;
			
				default :
					return array('success'=>false) ;
			}
			break ;
		
		case 'JUDIC_FOLLOW' :
			switch( $post_form['schedlock_next'] ) {
				case 'schednew' :
					$txt = '' ;
					$txt.= "Suite action judiciaire"."\r\n" ;
					if( $post_form['txt'] ) {
						$txt.= $post_form['txt']."\r\n" ;
					}
					$arr_ins['field_TXT'] = $txt ;
					break ;
				
				case 'end' :
					$txt = '' ;
					$txt.= "Action terminée"."\r\n" ;
					if( $post_form['txt'] ) {
						$txt.= $post_form['txt']."\r\n" ;
					}
					$arr_ins['field_TXT'] = $txt ;
					break ;
			
				default :
					return array('success'=>false) ;
			}
			break ;
		
		case 'LITIG_FOLLOW' :
			switch( $post_form['schedlock_next'] ) {
				case 'schednew' :
					$txt = '' ;
					$txt.= "Litige relancé"."\r\n" ;
					if( $post_form['txt'] ) {
						$txt.= $post_form['txt']."\r\n" ;
					}
					$arr_ins['field_TXT'] = $txt ;
					break ;
				
				case 'end' :
					$txt = '' ;
					$txt.= "Litige terminé"."\r\n" ;
					if( $post_form['txt'] ) {
						$txt.= $post_form['txt']."\r\n" ;
					}
					$arr_ins['field_TXT'] = $txt ;
					break ;
			
				default :
					return array('success'=>false) ;
			}
			break ;
		
		case 'CLOSE_ACK' :
			switch( $post_form['schedlock_next'] ) {
				case 'end' :
					$txt = '' ;
					$txt.= "Relance dossier"."\r\n" ;
					if( $post_form['txt'] ) {
						$txt.= $post_form['txt']."\r\n" ;
					}
					$arr_ins['field_TXT'] = $txt ;
					break ;
				
				case 'close' :
					$txt = '' ;
					$txt.= "Clôture acceptée"."\r\n" ;
					$txt.= $post_form['close_txt']."\r\n" ;
					if( $post_form['txt'] ) {
						$txt.= $post_form['txt']."\r\n" ;
					}
					$arr_ins['field_TXT'] = $txt ;
					break ;
			
				default :
					return array('success'=>false) ;
			}
			break ;
	}
	if( $post_form['fileaction_filerecord_id'] > 0 ) {
		$fileaction_filerecord_id = $post_form['fileaction_filerecord_id'] ;
		if( $_do_delete_currentAction ) {
			paracrm_lib_data_deleteRecord_file( $file_code, $post_form['fileaction_filerecord_id']);
		} else {
			paracrm_lib_data_updateRecord_file( $file_code, $arr_ins, $post_form['fileaction_filerecord_id']);
		}
	} else {
		if( !$_do_delete_currentAction ) {
			$fileaction_filerecord_id = paracrm_lib_data_insertRecord_file( $file_code, $file_filerecord_id, $arr_ins );
		}
	}
	$ttmp = specRsiRecouveo_file_getRecords( array(
		'filter_fileFilerecordId_arr' => json_encode(array($file_filerecord_id))
	)) ;
	$file_record = $ttmp['data'][0] ;
	
	
	// ****** HACK : Forward to specRsiRecouveo_action_execMailAutoAction ************
	if( $post_form['link_action']=='MAIL_AUTO') {
		$forward_post = array(
			'file_filerecord_id' => $file_filerecord_id,
			'fileaction_filerecord_id' => $fileaction_filerecord_id,
			'is_no_sched' => true
		);
		specRsiRecouveo_action_execMailAutoAction($forward_post) ;
	}

	
	// File status change + next actions
	$do_clean_next_actions = TRUE ;
	if( $post_form['next_action_save'] ) {
		$do_clean_next_actions = FALSE ;
	}
	if( $is_sched_none ) {
		$do_clean_next_actions = FALSE ;
	}
	if( $is_sched_lock ) {
		$do_clean_next_actions = FALSE ;
		switch( $post_form['schedlock_next'] ) {
			case 'end' :
			case 'close' :
				$do_clean_next_actions = TRUE ;
				$is_sched_lock_endBack = TRUE ;
				break ;
				
			case 'agree_summary' :
				// si reliquat action en cours
				// reliquat + date_sched != date_sched previous
				// OU
				// pas d'action en attente
				//   => creation nvlle action
					// DONE 180329 : agreesummary detail
				$agree_milestone_cur = NULL ;
				foreach( $post_form['agree_summary'] as $row ) {
					if( $row['milestone_status'] == 'CUR' ) {
						$agree_milestone_cur = $row ;
					}
				}
				$map_recordId_amount = array() ;
				foreach( $agree_milestone_cur['milestone_commit_record_ids'] as $record_filerecord_id ) {
					foreach( $account_record['files'] as $iter_file_row ) {
						if( $iter_file_row['file_filerecord_id']==0 ) {
							foreach( $iter_file_row['records'] as $iter_record_row ) {
								if( $iter_record_row['record_filerecord_id'] == $record_filerecord_id ) {
									$map_recordId_amount[$record_filerecord_id] = ((-1) * $iter_record_row['amount']) ;
								}
							}
						}
					}
				}
				if( $agree_milestone_cur['milestone_date_sched_previous'] != $agree_milestone_cur['milestone_date_sched'] ) {
					$milestone_date_resched = $agree_milestone_cur['milestone_date_sched'] ;
				}
				
				// Tableau des échéances à venir
				$reste_amount = $agree_milestone_cur['milestone_amount'] - array_sum($map_recordId_amount) ;
				$tab_pendingMilestones = array() ;
				$toReuseIds = array() ;
				if( $milestone_date_resched && $reste_amount > 0 ) {
					$tab_pendingMilestones[] = array(
						'milestone_date_sched' => $milestone_date_resched,
						'milestone_amount' => $reste_amount
					);
					$reste_amount = 0 ;
				}
				foreach( $post_form['agree_summary'] as $row ) {
					if( $row['milestone_status'] ) {
						continue ;
					}
					$tab_pendingMilestones[] = array(
						'milestone_date_sched' => $row['milestone_date_sched'],
						'milestone_amount' => $row['milestone_amount']
					);
				}
				$usort = function($arr1,$arr2)
				{
					return ($arr1['milestone_date_sched'] > $arr2['milestone_date_sched']) ;
				};
				usort($tab_pendingMilestones,$usort) ;
				
				if( $reste_amount != 0 ) {
					foreach( $tab_pendingMilestones as &$tmp_milestone ) {
						if( $reste_amount == 0 ) {
							break ;
						}
						if( $reste_amount < ($tmp_milestone['milestone_amount'] * -1) ) {
							$reste_amount += $tmp_milestone['milestone_amount'] ;
							$tmp_milestone['milestone_amount'] = 0 ;
							continue ;
						}
						$tmp_milestone['milestone_amount'] += $reste_amount ;
						$reste_amount = 0 ;
					}
					unset($tmp_milestone) ;
				}
				if( $reste_amount > 0 ) {
					$tab_pendingMilestones[] = array(
						'milestone_date_sched' => date('Y-m-d',strtotime('+1 day')),
						'milestone_amount' => $reste_amount
					);
				}
				
				$toReuseIds = array() ;
				$idx = 0 ;
				foreach( $file_record['actions'] as $fileaction_row ) {
					if( $fileaction_row['link_action']!='AGREE_FOLLOW' ) {
						continue ;
					}
					if( $fileaction_row['status_is_ok'] ) {
						if( $fileaction_row['link_agree']['milestone_amount'] > 0 ) {
							$idx++ ;
						}
						continue ;
					}
					$toReuseIds[] = $fileaction_row['fileaction_filerecord_id'] ;
				}
				
				$total = $idx ;
				foreach( $tab_pendingMilestones as $milestone ) {
					if( $milestone['milestone_amount'] == 0 ) {
						continue ;
					}
					$total++ ;
				}
				foreach( $tab_pendingMilestones as $milestone ) {
					if( $milestone['milestone_amount'] == 0 ) {
						continue ;
					}
					
					$idx++ ;
					
					$arr_ins = array() ;
					$arr_ins['field_STATUS_IS_OK'] = 0 ;
					$arr_ins['field_DATE_SCHED'] = $milestone['milestone_date_sched'] ;
					$arr_ins['field_LINK_STATUS'] = $post_form['link_status'] ;
					$arr_ins['field_LINK_ACTION'] = 'AGREE_FOLLOW' ;
					$arr_ins['field_LINK_TXT'] = "Echéance ".($idx)." / ".$total ;
					$arr_ins['field_TXT'] = 'Attendu : '.$milestone['milestone_amount'] ;
					$arr_ins['field_LINK_AGREE_JSON'] = json_encode(array(
						'milestone_amount' => $milestone['milestone_amount']
					)) ;
					
					
					if( $toReuseIds ) {
						$toReuseId = array_shift($toReuseIds) ;
						paracrm_lib_data_updateRecord_file( $file_code, $arr_ins, $toReuseId);
					} else {
						paracrm_lib_data_insertRecord_file($file_code,$file_filerecord_id,$arr_ins) ;
					}
				}
				
				foreach( $toReuseIds as $toDelete_fileactionFilerecordId ) {
					paracrm_lib_data_deleteRecord_file($file_code,$toDelete_fileactionFilerecordId) ;
				}
				
				break ;
		
			case 'schednew' :
				// création nouvelle action
				$arr_ins = array() ;
				$arr_ins['field_LINK_STATUS'] = $post_form['link_status'] ;
				$arr_ins['field_LINK_ACTION'] = $post_form['link_action'] ;
				$arr_ins['field_DATE_SCHED'] = $post_form['schedlock_schednew_date'] ;
				switch( $post_form['link_action'] ) {
					case 'LITIG_FOLLOW' :
						$arr_ins['field_LINK_LITIG'] = $file_action_record['link_litig'] ;
						break ;
					case 'JUDIC_FOLLOW' :
						$arr_ins['field_LINK_JUDIC'] = $post_form['schedlock_schednew_code'] ;
						break ;
				}
				paracrm_lib_data_insertRecord_file( $file_code, $file_filerecord_id, $arr_ins );
				break ;
		
			case 'confirm' :
				// verif suite ?
				$nb_sched = 0 ;
				foreach( $file_record['actions'] as $file_action_record_test ) {
					if( !$file_action_record_test['status_is_ok'] 
						&& $file_action_record_test['link_status']==$post_form['link_status'] ) {
						
						$nb_sched++ ;
					}
				}
				if( $nb_sched==0 ) {
					// DOING 170529 : verif amount
					if( $file_record['inv_amount_due'] <= 0 ) {
						$is_sched_lock_endClose = TRUE ;
					} else {
						// force create new action
						$arr_ins = array() ;
						$arr_ins['field_LINK_STATUS'] = $post_form['link_status'] ;
						$arr_ins['field_LINK_ACTION'] = $post_form['link_action'] ;
						$arr_ins['field_DATE_SCHED'] = date('Y-m-d') ;
						$arr_ins['field_LINK_TXT'] = 'Promesse terminée, reliquat ?' ;
						paracrm_lib_data_insertRecord_file( $file_code, $file_filerecord_id, $arr_ins );
					}
				}
				break ;
			
			case '' :
				if( $post_form['link_action'] == 'BUMP' ) {
					$nexts = array() ;
					foreach( $file_record['actions'] as $file_action_record_test ) {
						if( !$file_action_record_test['status_is_ok'] ) {
							$nexts[] = $file_action_record_test['fileaction_filerecord_id'] ;
						}
					}
					if( count($nexts) == 0 ) {
						$is_sched_lock_endBack = TRUE ;
					}
				}
				break ;
			
			default :
				break ;
		}
	}
	
	
	if( $do_clean_next_actions ) {
		$to_delete = array() ;
		foreach( $file_record['actions'] as $file_action_record_test ) {
			if( !$file_action_record_test['status_is_ok'] ) {
				switch( $post_form['link_action'] ) {
					case 'AGREE_FOLLOW' :
						$txt = '' ;
						$txt.= "Echéance annulée"."\r\n" ;
						$arr_ins['field_LINK_TXT'] = "Echéance annulée" ;
						$arr_ins['field_TXT'] = $txt ;
						$arr_ins['field_LINK_AGREE_JSON'] = json_encode(array(
							'milestone_amount' => 0,
							'milestone_cancel' => true
						)) ;
						paracrm_lib_data_updateRecord_file( $file_code, $arr_ins, $file_action_record_test['fileaction_filerecord_id']);
						break ;
				
					default :
						$to_delete[] = $file_action_record_test['fileaction_filerecord_id'] ;
						break ;
				}
			}
		}
		foreach( $to_delete as $id ) {
			paracrm_lib_data_deleteRecord_file( $file_code, $id );
		}
	}
	
	
	$status_change = NULL ;
	if( !$is_sched_none && !$is_sched_lock && !$post_form['next_action_save'] ) {
		if( !$post_form['next_action'] ) {
			$post_form['next_action'] = 'BUMP' ;
		}
		
		if( $post_form['scen_code'] && ($post_form['scen_code'] != $file_record['scen_code']) ) {
			$arr_update = array() ;
			$arr_update['field_SCENARIO'] = $post_form['scen_code'] ;
			paracrm_lib_data_updateRecord_file( 'FILE', $arr_update, $file_filerecord_id);
			$file_record['scen_code'] = $post_form['scen_code'] ;
		}
		elseif( $post_form['scen_code_blank'] ) {
			$arr_update = array() ;
			$arr_update['field_SCENARIO'] = '' ;
			paracrm_lib_data_updateRecord_file( 'FILE', $arr_update, $file_filerecord_id);
			$file_record['scen_code'] = $post_form['scen_code'] ;
		}
		
		if( $map_action[$post_form['next_action']]['status_next'] ) {
			$status_change = reset($map_action[$post_form['next_action']]['status_next']) ;
		}
		
		$status_next = ($status_change ? $status_change : $post_form['link_status']) ;
		
		if( $post_form['next_scenstep_code'] ) {
			// 2017-04 : lookup TPL_ID
			$link_tpl_id = NULL ;
			$ttmp = specRsiRecouveo_config_getScenarios(array()) ;
			foreach( $ttmp['data'] as $t_row_scen ) {
				foreach( $t_row_scen['steps'] as $t_row_scenstep ) {
					if( $t_row_scenstep['scenstep_code'] == $post_form['next_scenstep_code'] ) {
						$link_tpl_id = $t_row_scenstep['link_tpl'] ;
					}
				}
			}
		}
		
		switch( $post_form['next_action'] ) {
			default : // BUMP, CALL, MAIL...
				$arr_ins = array() ;
				$arr_ins['field_LINK_STATUS'] = $status_next ;
				$arr_ins['field_LINK_ACTION'] = $post_form['next_action'] ;
				$arr_ins['field_LINK_SCENARIO'] = $post_form['next_scenstep_code'] ;
				$arr_ins['field_SCENSTEP_TAG'] = $post_form['next_scenstep_tag'] ;
				$arr_ins['field_DATE_SCHED'] = ($post_form['next_date'] ? $post_form['next_date'] : date('Y-m-d')) ;
				if( $link_tpl_id ) {
					$arr_ins['field_LINK_TPL'] = $link_tpl_id ;
				}
				if( $post_form['next_action_txt'] ) {
					$arr_ins['field_LINK_TXT'] = $post_form['next_action_txt'] ;
				}
				$next_fileaction_filerecord_id = paracrm_lib_data_insertRecord_file( $file_code, $file_filerecord_id, $arr_ins );
				break ;
		}
	}
	
	/*
	if( $status_change ) {
		$arr_update = array() ;
		$arr_update['field_STATUS'] = $status_change ;
		paracrm_lib_data_updateRecord_file( 'FILE', $arr_update, $file_filerecord_id);
	}
	if( $post_form['schedlock_next'] == 'close' ) {
		$arr_update = array() ;
		$arr_update['field_STATUS'] = 1 ;
		$arr_update['field_STATUS_CLOSED'] = 1 ;
		paracrm_lib_data_updateRecord_file( 'FILE', $arr_update, $file_filerecord_id);
	}
	*/
	
	if( $is_sched_lock_endBack ) {
		$file_filerecord_id = specRsiRecouveo_file_lib_closeBack($file_filerecord_id) ;
	}
	
	
	
	if( $post_form['link_action']=='EMAIL_OUT') {
		// ****** Création email ************
		$post_form['email_record'] ;
		
		$email_record = $post_form['email_record'] ;
		$fileaction_filerecord_id ;
		$email_filerecord_id = specRsiRecouveo_lib_mail_createEmailForAction($email_record,$fileaction_filerecord_id) ;
		if( $email_filerecord_id ) {
			$arr_ins = array() ;
			$arr_ins['field_LINK_MEDIA_FILECODE'] = 'EMAIL' ;
			$arr_ins['field_LINK_MEDIA_FILEID'] = $email_filerecord_id ;
			paracrm_lib_data_updateRecord_file( 'FILE_ACTION', $arr_ins, $fileaction_filerecord_id);
		}
	}

	if( $post_form['link_action']=='SMS_OUT') {
		// ****** Création sms ************
		$_tel = $post_form['adrtel_txt'] ;
		$_smsContent = $post_form['sms_content'] ;
		$fileaction_filerecord_id ;
		$sms_filerecord_id = specRsiRecouveo_lib_sms_createSmsForAction($_tel, $_smsContent, $fileaction_filerecord_id) ;
		if ($sms_filerecord_id) {
			$arr_ins = array() ;
			$arr_ins['field_LINK_MEDIA_FILECODE'] = 'SMS_OUT' ;
			$arr_ins['field_LINK_MEDIA_FILEID'] = $sms_filerecord_id ;

			paracrm_lib_data_updateRecord_file( 'FILE_ACTION', $arr_ins, $fileaction_filerecord_id);
		}
	}

	if( $post_form['link_action']=='MAIL_OUT' ) {
		// ******** Création enveloppe ? **********
		$envDocs = array() ;
		$meta_data = NULL ;
		if( $post_form['tpl_id'] ) {
			// input fields
			$input_fields = array() ;
			foreach( $post_form as $mkey => $mvalue ) {
				if( strpos($mkey,'input_')===0 ) {
					$input_fields[$mkey] = $mvalue ;
				}
			}
			$input_fields['input_attachments'] = '' ;
			if( $post_form['attachments'] ) {
				foreach( json_decode($post_form['attachments'],true) as $doc ) {
					$input_fields['input_attachments'].= '- '.$doc['doc_desc']."\r\n" ;
				}
			}
			
			// Modif 18/05/2017 : Nom du contact (vérif non vide)
			if( !trim($post_form['adrpost_entity_name']) ) {
				$post_form['adrpost_entity_name'] = $file_record['acc_txt'] ;
			}
		
			$json = specRsiRecouveo_doc_getMailOut( array(
				'tpl_id' => $post_form['tpl_id'],
				'file_filerecord_id' => $post_data['file_filerecord_id'],
				'adr_type' => 'POSTAL',
				'adr_name' => $post_form['adrpost_entity_name'],
				'adr_postal' => $post_form['adrpost_txt'],
				'input_fields' => json_encode($input_fields)
			)) ;
			$envDocs[] = $json['data'] ;
			
			$meta_data = $json['meta'] ;
		}
		if( $post_form['attachments'] ) {
			foreach( json_decode($post_form['attachments'],true) as $doc ) {
				$envDocs[] = $doc ;
			}
		}
		if( $envDocs ) {
			$env_filerecord_id = specRsiRecouveo_doc_buildEnvelope( $post_data['file_filerecord_id'], $envDocs, $meta_data ) ;
			
			$arr_ins = array() ;
			$arr_ins['field_LINK_ENV_ID'] = $env_filerecord_id ;
			paracrm_lib_data_updateRecord_file( 'FILE_ACTION', $arr_ins, $fileaction_filerecord_id);
		}
	}
	if( in_array($post_form['link_action'], array('MAIL_IN','LITIG_FOLLOW')) ) {
		if( $post_form['attachments'] && !$post_form['inpostal_filerecord_id'] ) {
			$docs = array() ;
			foreach( json_decode($post_form['attachments'],true) as $doc ) {
				$docs[] = $doc ;
			}
			if( count($docs)>0 ) {
				$post_form['inpostal_filerecord_id'] = specRsiRecouveo_doc_buildInPostal( $fileaction_filerecord_id, $docs ) ;
			}
		}
		if( $post_form['inpostal_filerecord_id'] ) {
			$arr_ins = array() ;
			$arr_ins['field_LINK_MEDIA_FILECODE'] = 'IN_POSTAL' ;
			$arr_ins['field_LINK_MEDIA_FILEID'] = $post_form['inpostal_filerecord_id'] ;
			paracrm_lib_data_updateRecord_file( 'FILE_ACTION', $arr_ins, $fileaction_filerecord_id);
		}
	}
	if( in_array($post_form['link_action'], array('EMAIL_IN','LITIG_FOLLOW')) ) {
		if( $post_form['email_filerecord_id'] ) {
			$arr_ins = array() ;
			$arr_ins['field_LINK_MEDIA_FILECODE'] = 'EMAIL' ;
			$arr_ins['field_LINK_MEDIA_FILEID'] = $post_form['email_filerecord_id'] ;
			paracrm_lib_data_updateRecord_file( 'FILE_ACTION', $arr_ins, $fileaction_filerecord_id);
		}
	}
	
	
	
	return array(
		'success'=>true,
		'file_filerecord_id'=>$file_filerecord_id,
		'fileaction_filerecord_id'=>$fileaction_filerecord_id,
		'next_fileaction_filerecord_id'=>$next_fileaction_filerecord_id
	) ;
}
?>
