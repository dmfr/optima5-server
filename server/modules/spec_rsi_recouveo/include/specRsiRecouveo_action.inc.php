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
	
	// ***** Action en cours *********
	$arr_ins = array() ;
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
			break ;
			
		case 'MAIL_IN' :
			$arr_ins['field_TXT'] = $post_form['txt'] ;
			break ;
			
		case 'MAIL_OUT' :
			$txt = '' ;
			$txt.= "Modèle envoi : ".$post_form['mail_model']."\r\n" ;
			$arr_ins['field_TXT'] = $txt ;
			
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
					$arr_ins['field_TXT'] = $txt ;
					break ;
			
				default :
					return array('success'=>false) ;
			}
			break ;
	}
	if( $post_form['fileaction_filerecord_id'] > 0 ) {
		paracrm_lib_data_updateRecord_file( $file_code, $arr_ins, $post_form['fileaction_filerecord_id']);
	} else {
		paracrm_lib_data_insertRecord_file( $file_code, $file_filerecord_id, $arr_ins );
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
				$is_sched_lock = FALSE ;
				$do_clean_next_actions = TRUE ;
				break ;
		
			case 'schednew' :
				// création nouvelle action
				$arr_ins = array() ;
				$arr_ins['field_LINK_STATUS'] = $post_form['link_status'] ;
				$arr_ins['field_LINK_ACTION'] = $post_form['link_action'] ;
				$arr_ins['field_DATE_SCHED'] = $post_form['schedlock_schednew_date'] ;
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
					$is_sched_lock = FALSE ;
					$do_clean_next_actions = TRUE ;
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
		
		if( $map_action[$post_form['next_action']]['status_next'] ) {
			$status_change = reset($map_action[$post_form['next_action']]['status_next']) ;
		}
		
		$status_next = ($status_change ? $status_change : $post_form['link_status']) ;
		
		switch( $post_form['next_action'] ) {
			case 'LITIG_START' :
				// LITIG_START ok + LITIG_FOLLOW sched
				$arr_ins = array() ;
				$arr_ins['field_LINK_STATUS'] = $status_next ;
				$arr_ins['field_LINK_ACTION'] = 'LITIG_START' ;
				$arr_ins['field_STATUS_IS_OK'] = 1 ;
				$arr_ins['field_DATE_ACTUAL'] = date('Y-m-d H:i:s') ;
				$arr_ins['field_TXT'] = $post_form['litig_txt'] ;
				paracrm_lib_data_insertRecord_file( $file_code, $file_filerecord_id, $arr_ins );
				
				$arr_ins = array() ;
				$arr_ins['field_LINK_STATUS'] = $status_next ;
				$arr_ins['field_LINK_ACTION'] = 'LITIG_FOLLOW' ;
				$arr_ins['field_DATE_SCHED'] = $post_form['litig_nextdate'] ;
				paracrm_lib_data_insertRecord_file( $file_code, $file_filerecord_id, $arr_ins );
				
				break ;
			
			case 'CLOSE_ASK' :
				// CLOSE_ASK ok + CLOSE_ACK sched
				$arr_ins = array() ;
				$arr_ins['field_LINK_STATUS'] = $status_next ;
				$arr_ins['field_LINK_ACTION'] = 'CLOSE_ASK' ;
				$arr_ins['field_STATUS_IS_OK'] = 1 ;
				$arr_ins['field_DATE_ACTUAL'] = date('Y-m-d H:i:s') ;
				$arr_ins['field_TXT'] = $post_form['close_txt'] ;
				paracrm_lib_data_insertRecord_file( $file_code, $file_filerecord_id, $arr_ins );
				
				$arr_ins = array() ;
				$arr_ins['field_LINK_STATUS'] = $status_next ;
				$arr_ins['field_LINK_ACTION'] = 'CLOSE_ACK' ;
				$arr_ins['field_DATE_SCHED'] = date('Y-m-d',strtotime('+1 day')) ;
				paracrm_lib_data_insertRecord_file( $file_code, $file_filerecord_id, $arr_ins );
				
				break ;
			
			case 'AGREE_START' :
				// AGREE_START ok + AGREE_FOLLOW sched
				$txt = array() ;
				$txt[]= 'Promesse réglement '.$post_form['agree_period'] ;
				$txt[]= 'Montant total : '.$post_form['agree_amount'].' €' ;
				
				$arr_ins = array() ;
				$arr_ins['field_LINK_STATUS'] = $status_next ;
				$arr_ins['field_LINK_ACTION'] = 'AGREE_START' ;
				$arr_ins['field_STATUS_IS_OK'] = 1 ;
				$arr_ins['field_DATE_ACTUAL'] = date('Y-m-d H:i:s') ;
				$arr_ins['field_TXT'] = $txt ;
				paracrm_lib_data_insertRecord_file( $file_code, $file_filerecord_id, $arr_ins );
				
				switch( $post_form['agree_period'] ) {
					case 'MONTH' :
					case 'WEEK' :
						$nb = $post_form['agree_count'] ;
						$date = $post_form['agree_datefirst'] ;
						$amount_each = round($post_form['agree_amount'] / $nb,2) ;
						break ;
					case 'SINGLE' :
						$nb = 1 ;
						$date = $post_form['agree_date'] ;
						$amount_each = round($post_form['agree_amount'] / $nb,2) ;
						break ;
					default :
						break ;
				}
				for( $i=0 ; $i<$nb ; $i++ ) {
					$arr_ins = array() ;
					$arr_ins['field_STATUS_IS_OK'] = 0 ;
					$arr_ins['field_DATE_SCHED'] = $date ;
					$arr_ins['field_LINK_STATUS'] = $status_next ;
					$arr_ins['field_LINK_ACTION'] = 'AGREE_FOLLOW' ;
					$arr_ins['field_TXT'] = 'Attendu : '.$amount_each.' €' ;
					paracrm_lib_data_insertRecord_file($file_code,$file_filerecord_id,$arr_ins) ;
					
					switch( $post_form['agree_period'] ) {
						case 'MONTH' :
							$date = date('Y-m-d',strtotime('+1 month',strtotime($date))) ;
							break ;
						case 'WEEK' :
							$date = date('Y-m-d',strtotime('+1 week',strtotime($date))) ;
							break ;
					}
				}
				
				break ;
			
			default : // BUMP, CALL, MAIL...
				$arr_ins = array() ;
				$arr_ins['field_LINK_STATUS'] = $status_next ;
				$arr_ins['field_LINK_ACTION'] = $post_form['next_action'] ;
				$arr_ins['field_DATE_SCHED'] = ($post_form['next_date'] ? $post_form['next_date'] : date('Y-m-d')) ;
				paracrm_lib_data_insertRecord_file( $file_code, $file_filerecord_id, $arr_ins );
				break ;
		}
	}
	
	if( $status_change ) {
		$arr_update = array() ;
		$arr_update['field_STATUS'] = $status_change ;
		paracrm_lib_data_updateRecord_file( 'FILE', $arr_update, $file_filerecord_id);
	}
	if( $post_form['schedlock_next'] == 'close' ) {
		$arr_update = array() ;
		$arr_update['field_STATUS_CLOSED'] = 1 ;
		paracrm_lib_data_updateRecord_file( 'FILE', $arr_update, $file_filerecord_id);
	}
	
	
	return array('success'=>true, 'id'=>$fileaction_filerecord_id) ;
}
?>
