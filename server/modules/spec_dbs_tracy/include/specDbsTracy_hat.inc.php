<?php

function specDbsTracy_hat_searchSuggest($post_data) {
	global $_opDB ;
	$soc_code = trim($post_data['filter_socCode']) ;
	$txt = trim($post_data['filter_searchTxt']) ;
	
	$ret = array() ;
	
	$query = "SELECT field_ID_HAT FROM view_file_HAT h
			WHERE h.field_ID_SOC='{$soc_code}' AND h.field_ID_HAT LIKE '%{$txt}%'
			LIMIT 10" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) > 0 ) {
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$ret[] = array('search_txt'=>$arr[0]) ;
		}
	}
	
	$query = "SELECT field_ID_DN FROM view_file_CDE c
			WHERE c.field_ID_SOC='{$soc_code}' AND c.field_ID_DN LIKE '%{$txt}%'
			LIMIT 10" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) > 0 ) {
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$ret[] = array('search_txt'=>$arr[0]) ;
		}
	}
	
	return array('success'=>true,'data'=>$ret) ;
}
function specDbsTracy_hat_search2hat($soc_code, $txt) {
	global $_opDB ;
	$txt = trim($txt) ;
	
	$query = "SELECT filerecord_id FROM view_file_HAT h
			WHERE h.field_ID_SOC='{$soc_code}' AND h.field_ID_HAT='{$txt}'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) > 0 ) {
		$return = array() ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$return[] = $arr[0] ;
		}
		return $return ;
	}
	
	$query = "SELECT hc.filerecord_parent_id
			FROM view_file_HAT_CDE hc, view_file_CDE c
			WHERE hc.field_FILE_CDE_ID=c.filerecord_id AND hc.field_LINK_IS_CANCEL='0'
			AND c.field_ID_SOC='{$soc_code}' AND c.field_ID_DN='{$txt}'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) > 0 ) {
		$return = array() ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$return[] = $arr[0] ;
		}
		return $return ;
	}
	
	return array() ;
}
function specDbsTracy_hat_search2order($soc_code, $txt) {
	global $_opDB ;
	$txt = trim($txt) ;
	
	$query = "SELECT hc.field_FILE_CDE_ID
			FROM view_file_HAT_CDE hc, view_file_HAT h
			WHERE hc.filerecord_parent_id=h.filerecord_id AND hc.field_LINK_IS_CANCEL='0'
			AND h.field_ID_SOC='{$soc_code}' AND h.field_ID_HAT='{$txt}'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) > 0 ) {
		$return = array() ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$return[] = $arr[0] ;
		}
		return $return ;
	}
	
	$query = "SELECT c.filerecord_id
			FROM view_file_CDE c
			WHERE c.field_ID_SOC='{$soc_code}' AND c.field_ID_DN='{$txt}'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) > 0 ) {
		$return = array() ;
		while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
			$return[] = $arr[0] ;
		}
		return $return ;
	}
	
	return array() ;
}

function specDbsTracy_hat_getRecords( $post_data ) {
	global $_opDB ;
	
	// filter ?
	if( isset($post_data['filter_searchTxt']) ) {
		$filter_hatFilerecordId_list = $_opDB->makeSQLlist( 
			specDbsTracy_hat_search2hat($post_data['filter_socCode'],$post_data['filter_searchTxt'])
		) ;
	} elseif( isset($post_data['filter_hatFilerecordId_arr']) ) {
		$filter_hatFilerecordId_list = $_opDB->makeSQLlist( json_decode($post_data['filter_hatFilerecordId_arr'],true) ) ;
	} elseif( isset($post_data['filter_orderFilerecordId_arr']) ) {
		$filter_orderFilerecordId_list = $_opDB->makeSQLlist( json_decode($post_data['filter_orderFilerecordId_arr'],true) ) ;
	}
	if( $post_data['filter_socCode'] ) {
		$filter_socCode = $post_data['filter_socCode'] ;
	}
	if( $post_data['filter_archiveIsOn'] ) {
		$filter_archiveIsOn = ( $post_data['filter_archiveIsOn'] ? true : false ) ;
	}
	
	$TAB_hat = array() ;
	
	$query = "SELECT * FROM view_file_HAT h" ;
	$query.= " WHERE 1" ;
	if( isset($filter_orderFilerecordId_list) ) {
		$query.= " AND h.filerecord_id IN (select filerecord_parent_id FROM view_file_HAT_CDE WHERE field_FILE_CDE_ID IN {$filter_orderFilerecordId_list})" ;
	} elseif( isset($filter_hatFilerecordId_list) ) {
		$query.= " AND h.filerecord_id IN {$filter_hatFilerecordId_list}" ;
	} elseif( !$filter_archiveIsOn ) {
		$query.= " AND h.field_ARCHIVE_IS_ON='0'" ;
	}
	if( isset($filter_socCode) ) {
		$query.= " AND h.field_ID_SOC='{$filter_socCode}'" ;
	}
	$query.= " ORDER BY h.filerecord_id DESC" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TAB_hat[$arr['filerecord_id']] = array(
			'hat_filerecord_id' => $arr['filerecord_id'],
			'id_soc' => $arr['field_ID_SOC'],
			'id_hat' => $arr['field_ID_HAT'],
			'date_create' => substr($arr['field_DATE_CREATE'],0,10),
			
			'orders' => array(),
			'parcels' => array()
		);
	}
	
	$query = "SELECT * FROM view_file_HAT_CDE hc" ;
	$query.= " WHERE 1" ;
	if( isset($filter_orderFilerecordId_list) ) {
		$query.= " AND hc.filerecord_id IN (select filerecord_id FROM view_file_HAT_CDE WHERE field_FILE_CDE_ID IN {$filter_orderFilerecordId_list})" ;
	} elseif( isset($filter_hatFilerecordId_list) ) {
		$query.= " AND hc.filerecord_parent_id IN {$filter_hatFilerecordId_list}" ;
	} elseif( !$filter_archiveIsOn ) {
		$query.= " AND hc.filerecord_parent_id IN (SELECT filerecord_id FROM view_file_HAT WHERE field_ARCHIVE_IS_ON='0')" ;
	}
	$result = $_opDB->query($query) ;
	$filter_orderFilerecordId_arr = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		if( !isset($TAB_hat[$arr['filerecord_parent_id']]) ) {
			continue ;
		}
		$TAB_hat[$arr['filerecord_parent_id']]['orders'][] = array(
			'hatorder_filerecord_id' => $arr['filerecord_id'],
			'order_filerecord_id' => $arr['field_FILE_CDE_ID'],
			'link_is_cancel' => $arr['field_LINK_IS_CANCEL']
		);
		
		$filter_orderFilerecordId_arr[] = $arr['field_FILE_CDE_ID'] ;
	}
	
	if( !$post_data['skip_dimensions'] ) { // 08/04/19 : Don't load dimensions on FilesGrid
		$query = "SELECT * FROM view_file_HAT_PARCEL hp" ;
		$query.= " WHERE 1" ;
		if( isset($filter_orderFilerecordId_list) ) {
			$query.= " AND hp.filerecord_parent_id IN (select filerecord_parent_id FROM view_file_HAT_CDE WHERE field_FILE_CDE_ID IN {$filter_orderFilerecordId_list})" ;
		} elseif( isset($filter_hatFilerecordId_list) ) {
			$query.= " AND hp.filerecord_parent_id IN {$filter_hatFilerecordId_list}" ;
		} elseif( !$filter_archiveIsOn ) {
			$query.= " AND hp.filerecord_parent_id IN (SELECT filerecord_id FROM view_file_HAT WHERE field_ARCHIVE_IS_ON='0')" ;
		}
		$result = $_opDB->query($query) ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
			if( !isset($TAB_hat[$arr['filerecord_parent_id']]) ) {
				continue ;
			}
			$TAB_hat[$arr['filerecord_parent_id']]['parcels'][] = array(
				'hatparcel_filerecord_id' => $arr['filerecord_id'],
				'vol_count' => (int)$arr['field_VOL_COUNT'],
				'vol_kg' => (float)$arr['field_VOL_KG'],
				'vol_dims' => explode('x',$arr['field_VOL_DIMS'])
			);
		}
	}
	
	if( !$post_data['skip_details'] ) { // 15/11 : Don't (double)load on FilesGrid
		$ttmp = specDbsTracy_order_getRecords( array(
			'filter_socCode' => $filter_socCode,
			'filter_orderFilerecordId_arr'=> json_encode($filter_orderFilerecordId_arr),
			'filter_archiveIsOn' => ( $filter_archiveIsOn ? 1 : 0 )
		) ) ;
		$TAB_order = array() ;
		foreach( $ttmp['data'] as $row_order ) {
			$TAB_order[$row_order['order_filerecord_id']] = $row_order ;
		}
		
		foreach( $TAB_hat as &$row_hat ) {
			foreach( $row_hat['orders'] as &$row_hatorder ) {
				if( !($row_order = $TAB_order[$row_hatorder['order_filerecord_id']]) ) {
					continue ;
				}
				$row_hatorder += $row_order ;
			}
			unset($row_hatorder) ;
		}
		unset($row_hat) ;
	}
	
	return array('success'=>true, 'data'=>array_values($TAB_hat)) ;
}

function specDbsTracy_hat_setHeader( $post_data ) {
	usleep(100*1000);
	global $_opDB ;
	$file_code = 'HAT' ;
	
	$form_data = json_decode($post_data['data'],true) ;
	
	$arr_ins = array() ;
	if( $post_data['_is_new'] ) {
		$arr_ins['field_ID_SOC'] = $form_data['id_soc'] ;
		$arr_ins['field_ID_HAT'] = $form_data['id_hat'] ;
	}
	$arr_ins['field_DATE_CREATE'] = $form_data['date_create'] ;
	
	if( $post_data['_is_new'] ) {
		$filerecord_id = paracrm_lib_data_insertRecord_file( $file_code, 0, $arr_ins );
		if( json_decode($post_data['data_orderFilerecordIds'],true) ) {
			foreach( json_decode($post_data['data_orderFilerecordIds'],true) as $order_filerecord_id ) {
				specDbsTracy_hat_orderAdd( array(
					'hat_filerecord_id' => $filerecord_id,
					'order_filerecord_id' => $order_filerecord_id
				));
			}
		}
	} elseif( $post_data['hat_filerecord_id'] ) {
		$filerecord_id = paracrm_lib_data_updateRecord_file( $file_code, $arr_ins, $post_data['hat_filerecord_id'] );
	} else {
		return array('success'=>false) ;
	}
	
	
	// Parcels
	$existing_filerecordIds = array() ;
	$query = "SELECT filerecord_id FROM view_file_HAT_PARCEL WHERE filerecord_parent_id='{$filerecord_id}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$existing_filerecordIds[] = $arr[0] ;
	}
	$current_filerecordIds = array() ;
	foreach( $form_data['parcels'] as $hat_parcel_row ) {
		$arr_ins = array() ;
		$arr_ins['field_VOL_COUNT'] = $hat_parcel_row['vol_count'] ;
		$arr_ins['field_VOL_KG'] = $hat_parcel_row['vol_kg'] ;
		$arr_ins['field_VOL_DIMS'] = implode('x',$hat_parcel_row['vol_dims']) ;
		if( $hat_parcel_row['hatparcel_filerecord_id'] ) {
			$current_filerecordIds[] = $hat_parcel_row['hatparcel_filerecord_id'] ;
			paracrm_lib_data_updateRecord_file( 'HAT_PARCEL', $arr_ins, $hat_parcel_row['hatparcel_filerecord_id'] );
		} else {
			$current_filerecordIds[] = paracrm_lib_data_insertRecord_file( 'HAT_PARCEL', $filerecord_id, $arr_ins );
		}
	}
	$todelete_filerecordIds = array_diff($existing_filerecordIds,$current_filerecordIds) ;
	foreach( $todelete_filerecordIds as $id ) {
		paracrm_lib_data_deleteRecord_file( 'HAT_PARCEL',$id ) ;
	}
	
	
	return array('success'=>true, 'id'=>$filerecord_id) ;
}


function specDbsTracy_hat_orderAdd( $post_data ) {
	usleep(50*1000);
	global $_opDB ;
	$file_code = 'HAT_CDE' ;
	
	$p_hatFilerecordId = $post_data['hat_filerecord_id'] ;
	$p_orderFilerecordId = $post_data['order_filerecord_id'] ;
	
	$ttmp = specDbsTracy_order_getRecords(array('filter_orderFilerecordId_arr'=>json_encode(array($p_orderFilerecordId)))) ;
	if( $ttmp['data'][0]['calc_hat_is_active'] ) {
		// return array('success'=>false,'error'=>"Order {$ttmp['data'][0]['id_dn']} already attached") ;
		
		// *** NicolasBlum 2017-11 : silent remove
		specDbsTracy_hat_orderRemove( array(
			'hat_filerecord_id' => $ttmp['data'][0]['calc_hat_filerecord_id'],
			'order_filerecord_id' => $p_orderFilerecordId
		));
	}
	
	$arr_ins = array() ;
	$arr_ins['field_FILE_CDE_ID'] = $p_orderFilerecordId ;
	$filerecord_id = paracrm_lib_data_insertRecord_file( $file_code, $p_hatFilerecordId, $arr_ins );
	
	return array('success'=>true) ;
}
function specDbsTracy_hat_orderRemove( $post_data ) {
	usleep(50*1000);
	global $_opDB ;
	$file_code = 'HAT_CDE' ;
	
	$p_hatFilerecordId = $post_data['hat_filerecord_id'] ;
	$p_orderFilerecordId = $post_data['order_filerecord_id'] ;
	
	$ttmp = specDbsTracy_order_getRecords(array('filter_orderFilerecordId_arr'=>json_encode(array($p_orderFilerecordId)))) ;
	
	$query = "SELECT * FROM view_file_HAT_CDE WHERE filerecord_parent_id='{$p_hatFilerecordId}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		if( $arr['field_FILE_CDE_ID'] == $p_orderFilerecordId ) {
			paracrm_lib_data_deleteRecord_file($file_code,$arr['filerecord_id']) ;
		}
	}
	
	return array('success'=>true) ;
}

?>
