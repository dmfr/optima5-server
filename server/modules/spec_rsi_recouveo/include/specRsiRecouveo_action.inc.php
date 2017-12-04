<?php

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
	
	
	$is_sched_lock = $map_status[$file_record['status']]['sched_lock'] ;
	
	
	$post_form = json_decode($post_data['data'],true) ;
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
			$default_adrEntity = $post_form['adrpost_new_entity'] ;
			
			$arr_ins = array() ;
			$arr_ins['field_ACC_ID'] = $acc_id ;
			$arr_ins['field_ADR_ENTITY'] = $default_adrEntity ;
			$arr_ins['field_ADR_ENTITY_NAME'] = $post_form['adrpost_entity_name'] ;
			$adrbook_filerecord_id = paracrm_lib_data_insertRecord_file( 'ADRBOOK', 0, $arr_ins );
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
			$default_adrEntity = $post_form['adrtel_new_entity'] ;
			
			$arr_ins = array() ;
			$arr_ins['field_ACC_ID'] = $acc_id ;
			$arr_ins['field_ADR_ENTITY'] = $default_adrEntity ;
			$arr_ins['field_ADR_ENTITY_NAME'] = $post_form['adrtel_entity_name'] ;
			$adrbook_filerecord_id = paracrm_lib_data_insertRecord_file( 'ADRBOOK', 0, $arr_ins );
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
			$default_adrEntity = $post_form['adrmail_new_entity'] ;
			
			$arr_ins = array() ;
			$arr_ins['field_ACC_ID'] = $acc_id ;
			$arr_ins['field_ADR_ENTITY'] = $default_adrEntity ;
			$arr_ins['field_ADR_ENTITY_NAME'] = $post_form['adrmail_entity_name'] ;
			$adrbook_filerecord_id = paracrm_lib_data_insertRecord_file( 'ADRBOOK', 0, $arr_ins );
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
			
		case 'BUMP' :
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
					$arr_ins['field_TXT'] = $txt ;
					break ;
				
				case 'end' :
					$txt = '' ;
					$txt.= "Annulation Promesse"."\r\n" ;
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
		paracrm_lib_data_updateRecord_file( $file_code, $arr_ins, $post_form['fileaction_filerecord_id']);
	} else {
		$fileaction_filerecord_id = paracrm_lib_data_insertRecord_file( $file_code, $file_filerecord_id, $arr_ins );
	}
	$ttmp = specRsiRecouveo_file_getRecords( array(
		'filter_fileFilerecordId_arr' => json_encode(array($file_filerecord_id))
	)) ;
	$file_record = $ttmp['data'][0] ;
	
	
	
	// File status change + next actions
	$do_clean_next_actions = TRUE ;
	if( $is_sched_lock ) {
		$do_clean_next_actions = FALSE ;
		switch( $post_form['schedlock_next'] ) {
			case 'end' :
			case 'close' :
				$do_clean_next_actions = TRUE ;
				$is_sched_lock_endBack = TRUE ;
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
						paracrm_lib_data_insertRecord_file( $file_code, $file_filerecord_id, $arr_ins );
					}
				}
				break ;
		}
	}
	
	
	if( $do_clean_next_actions ) {
		$to_delete = array() ;
		foreach( $file_record['actions'] as $file_action_record_test ) {
			if( !$file_action_record_test['status_is_ok'] ) {
				$to_delete[] = $file_action_record_test['fileaction_filerecord_id'] ;
			}
		}
		foreach( $to_delete as $id ) {
			paracrm_lib_data_deleteRecord_file( $file_code, $id );
		}
	}
	
	
	$status_change = NULL ;
	if( !$is_sched_lock ) {
		if( !$post_form['next_action'] ) {
			$post_form['next_action'] = 'BUMP' ;
		}
		
		if( $post_form['scen_code'] && ($post_form['scen_code'] != $file_record['scen_code']) ) {
			$arr_update = array() ;
			$arr_update['field_SCENARIO'] = $post_form['scen_code'] ;
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
				paracrm_lib_data_insertRecord_file( $file_code, $file_filerecord_id, $arr_ins );
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
			
			// Modif 18/05/2017 : Nom du contact (vérif non vide)
			if( !trim($post_form['adrpost_entity_name']) ) {
				$post_form['adrpost_entity_name'] = $file_record['acc_txt'] ;
			}
		
			$json = specRsiRecouveo_doc_getMailOut( array(
				'tpl_id' => $post_form['tpl_id'],
				'file_filerecord_id' => $post_data['file_filerecord_id'],
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
	if( $post_form['link_action']=='MAIL_IN' ) {
		if( $post_form['attachments'] && !$post_form['inpostal_filerecord_id'] ) {
			$docs = array() ;
			foreach( json_decode($post_form['attachments'],true) as $doc ) {
				$docs[] = $doc ;
			}
			$post_form['inpostal_filerecord_id'] = specRsiRecouveo_doc_buildInPostal( $fileaction_filerecord_id, $docs ) ;
		}
		if( $post_form['inpostal_filerecord_id'] ) {
			$arr_ins = array() ;
			$arr_ins['field_LINK_MEDIA_FILECODE'] = 'IN_POSTAL' ;
			$arr_ins['field_LINK_MEDIA_FILEID'] = $post_form['inpostal_filerecord_id'] ;
			paracrm_lib_data_updateRecord_file( 'FILE_ACTION', $arr_ins, $fileaction_filerecord_id);
		}
	}
	
	
	
	return array(
		'success'=>true,
		'file_filerecord_id'=>$file_filerecord_id,
		'fileaction_filerecord_id'=>$fileaction_filerecord_id
	) ;
}
?>
