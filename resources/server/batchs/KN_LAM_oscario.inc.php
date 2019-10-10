<?php
function do_post_request($url, $data, $optional_headers = null)
{
  $params = array('http' => array(
              'method' => 'POST',
              'content' => $data
            ));
  if ($optional_headers !== null) {
    $params['http']['header'] = $optional_headers;
  }
  $ctx = stream_context_create($params);
  $fp = @fopen($url, 'rb', false, $ctx);
  if (!$fp) {
    throw new Exception("Problem with $url, $php_errormsg");
  }
  $response = @stream_get_contents($fp);
  if ($response === false) {
    throw new Exception("Problem reading data from $url, $php_errormsg");
  }
  return $response;
}
function oscario_http_post( $post_data ) {
	$_URL = 'http://10.39.1.1:8080/oscario/edi_private.php' ;
	$post_base = array();
	$post_base['auth_username'] = 'ediPrivate' ;
	$post_base['auth_password'] = 'ediPrivate' ;
	$post = $post_base + $post_data ;
	return do_post_request($_URL,http_build_query($post)) ;
}
function oscario_http_post_new( $post_data ) {
	$_URL = 'http://10.39.1.1:8080/oscario/edi.php' ;
	$post_base = array();
	$post_base['auth_username'] = 'ediPrivate' ;
	$post_base['auth_password'] = 'ediPrivate' ;
	$post = $post_base + $post_data ;
	return do_post_request($_URL,http_build_query($post)) ;
}


function oscario_interface_do( $_OSCARIO_DOMAIN, $_OSCARIO_MAG, $_OPTIMA_SOC ) {

	global $_opDB ;
	
	try {
		oscario_http_post(array('oscario_domain'=>$_OSCARIO_DOMAIN)) ;
	} catch( Exception $e ) {
		return ;
	}

	switch( $_OPTIMA_SOC )
	{
		case 'EVE' :
		$_PREFIX_REF = 'EVE' ;
		$_PREFIX_CDE = 'EV' ;
		break ;
		
		default :
		echo "Optima Soc not registered !\n" ;
		exit ;
	}


	/*
	**************************************************************
		Importation des nomenclature + Delete des nomenclatures
	****************************************************************
	*/
	$post_params = array() ;
	$post_params['action'] = 'get_refs' ;
	$post_params['oscario_domain'] = $_OSCARIO_DOMAIN ;
	$data = oscario_http_post($post_params) ;
	foreach(preg_split("/((\r?\n)|(\r\n?))/", $data) as $line){
		if( trim($line) == NULL )
			continue ;
		
		//echo $line."\n" ;
		
		$prod_ref = trim(substr($line,0,20)) ;
		if( !$prod_ref ) {
			continue ;
		}
		$prod_gencod = trim(substr($line,86,12)) ;
		//$prod_gencod = 0 ;
		$prod_lib = trim(substr($line,35,40)) ;
		//$prod_unit = trim(substr($line,
		$uc_qte = (int)(trim(substr($line,79,7))) ;
		$uc_qte = $uc_qte / 100 ;
		
		$entry_key = strtoupper($_PREFIX_REF.'_'.$prod_ref) ;
		
		$arr_ins = array() ;
		$arr_ins['field_PROD_ID'] = $entry_key ;
		$arr_ins['field_PROD_TXT'] = $prod_lib ;
		//$arr_ins['field_PROD_GENCOD'] = $prod_gencod ;
		$arr_ins['field_UC_QTY'] = $uc_qte ;
		
		$query = "SELECT count(*) FROM view_bible_PROD_entry WHERE entry_key='$entry_key'" ;
		if( $_opDB->query_uniqueValue($query) > 0 )
		{
			// update 
			paracrm_lib_data_updateRecord_bibleEntry( 'PROD', $entry_key, $arr_ins );
		}
		else
		{
			//echo $entry_key."\n" ;
			$arr_ins['field_ATR_ZONEGEO'] = json_encode(array($_OPTIMA_SOC)) ;
			paracrm_lib_data_insertRecord_bibleEntry( 'PROD', $entry_key, $_OPTIMA_SOC, $arr_ins );
		}
		
		$tab_existing_prods[$entry_key] = TRUE ;
	}


	$query = "SELECT entry_key FROM view_bible_PROD_entry WHERE entry_key LIKE '$_PREFIX_REF\_%'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
	{
		$entry_key = $arr[0] ;
		
		if( !$tab_existing_prods[$entry_key] )
		{
			$query = "SELECT count(*) FROM view_file_MVT WHERE field_PROD_ID='$entry_key'" ;
			if( $_opDB->query_uniqueValue($query) > 0 )
				continue ;
			$query = "SELECT count(*) FROM view_file_STOCK WHERE field_PROD_ID='$entry_key'" ;
			if( $_opDB->query_uniqueValue($query) > 0 )
				continue ;
				
			paracrm_lib_data_deleteRecord_bibleEntry( 'PROD', $entry_key ) ;
		}
	}


	
	
	/*
	**************************************************************
		Importation des nomenclature + Delete des nomenclatures
	****************************************************************
	*/
	setlocale(LC_ALL,'en_US.UTF-8');
	$post_params = array() ;
	$post_params['edi_method'] = 'RAW_prod' ;
	$post_params['oscario_domain'] = $_OSCARIO_DOMAIN ;
	$data = oscario_http_post_new($post_params) ;
	$json = json_decode($data,true) ;
	if( $json && $json['success'] ) {
		foreach( $json['data'] as $prod_row ) {
			$entry_key = strtoupper($_PREFIX_REF.'_'.$prod_row['prod_ref']) ;
			
			$arr_ins = array() ;
			$arr_ins['field_PROD_ID'] = $entry_key ;
			$arr_ins['field_PROD_TXT'] = iconv('UTF-8','ASCII//TRANSLIT',$prod_row['prod_lib']);
			
			paracrm_lib_data_updateRecord_bibleEntry( 'PROD', $entry_key, $arr_ins );
		}
	}
	


	/*
	**************************************************
		Envoi des qtés stocks globales
	********************************************
	*/
	$TAB = array() ;

	foreach( array($_OPTIMA_SOC) as $soc )
	{
		$query_refs = "SELECT entry_key FROM view_bible_PROD_entry WHERE entry_key LIKE '$_PREFIX_REF\_%'" ;
		$result_refs = $_opDB->query($query_refs) ;
		while( ($arr = $_opDB->fetch_assoc($result_refs)) != FALSE )
		{
			$ref = $arr['entry_key'] ;
			
			// $bain = NULL ;
			
			if( !is_array($TAB[$ref]) )
				$TAB[$ref] = 0 ;
		}
		
		
		$query_stk_disp = "SELECT filerecord_id,field_PROD_ID,field_SPEC_BATCH,field_QTY_AVAIL FROM view_file_STOCK
									WHERE field_PROD_ID IN ($query_refs) " ;
		$result = $_opDB->query($query_stk_disp) ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
		{
			$ref = $arr['field_PROD_ID'] ;
			$bain = $arr['field_SPEC_BATCH'] ;
			$qte = (float)$arr['field_QTY_AVAIL'] ;
			
			// $bain = NULL ;
			
			$TAB[$ref] += $qte ;
		}
	}

	$buffer = '' ;
	foreach( $TAB as $ref => $qte )
	{
		if( strpos($ref,$_PREFIX_REF.'_') === 0 )
			$ref = substr($ref,strlen($_PREFIX_REF)+1) ;

		$lig = '' ;
		$lig = substr_mklig( $lig, $ref, 0, 20 ) ;
		$lig = substr_mklig( $lig, int_to_strX($qte*100,10), 20, 10 ) ;
		$lig.= "\r\n" ;
		
		$buffer.= $lig ;
	}
	$post_params = array() ;
	$post_params['oscario_domain'] = $_OSCARIO_DOMAIN ;
	$post_params['oscario_mag'] = $_OSCARIO_MAG ;
	$post_params['action'] = 'put_stock' ;
	$post_params['data'] = $buffer ;
	oscario_http_post($post_params) ;







	// echo $buffer ;

	/*
	**************************************************
		Envoi du stock detail
	********************************************
	*/
	$TAB = array() ;

	foreach( array($_OPTIMA_SOC) as $soc )
	{
		$query_refs = "SELECT entry_key FROM view_bible_PROD_entry WHERE entry_key LIKE '$_PREFIX_REF\_%'" ;
		
		$query_stk_disp_pal = "SELECT field_CONTAINER_REF,field_ADR_ID,field_PROD_ID,field_SPEC_BATCH,field_SPEC_DATELC,field_QTY_AVAIL,field_LAM_DATEUPDATE,''
									FROM view_file_STOCK
									WHERE field_PROD_ID IN ($query_refs) " ;
		$result = $_opDB->query($query_stk_disp_pal) ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE )
		{
			$ref = $arr['field_PROD_ID'] ;
			
			// $bain = NULL ;
			
			$TAB[$ref][] = $arr ;
		}
	}

	// print_r($TAB) ;
	$buffer = '' ;
	foreach( $TAB as $ref => $arr1 )
	{
		foreach( $arr1 as $arr )
		{
			if( strpos($ref,$_PREFIX_REF.'_') === 0 )
				$ref = substr($ref,strlen($_PREFIX_REF)+1) ;
		
			$lig = '' ;
			$lig = substr_mklig( $lig, $arr['field_ADR_ID'], 0, 10 ) ;
			$lig = substr_mklig( $lig, $ref, 10, 20 ) ;
			$lig = substr_mklig( $lig, $arr['field_SPEC_BATCH'], 30, 20 ) ;
			$lig = substr_mklig( $lig, $arr['field_SPEC_DATELC'], 50, 10 ) ;
			$lig = substr_mklig( $lig, int_to_strX($arr['field_QTY_AVAIL']*100,10), 60, 10 ) ;
			$lig = substr_mklig( $lig, $arr['field_CONTAINER_REF'], 70, 20 ) ;
			$lig = substr_mklig( $lig, $arr['field_LAM_DATEUPDATE'], 90, 10 ) ;
			$lig = substr_mklig( $lig, NULL, 100, 30 ) ;
			$lig.= "\r\n" ;
			
			$buffer.= $lig ;
		}
	}
	$post_params = array() ;
	$post_params['oscario_domain'] = $_OSCARIO_DOMAIN ;
	$post_params['oscario_mag'] = $_OSCARIO_MAG ;
	$post_params['action'] = 'put_stock_det' ;
	$post_params['data'] = $buffer ;
	oscario_http_post($post_params) ;

	$post_params = array() ;
	$post_params['oscario_domain'] = $_OSCARIO_DOMAIN ;
	$post_params['oscario_mag'] = $_OSCARIO_MAG ;
	$post_params['action'] = 'put_stock_logistics' ;
	$post_params['data'] = $buffer ;
	oscario_http_post($post_params) ;

	
	
	



	/*
	**************************************************
		RemontÃ©es MVTs
		- receptions : select * from view_file_MVT where field_SRC_WHSE='' AND field_DST_WHSE='RECEP' AND field_SOC_CODE='EVE' ;
		- regul + : select * from view_file_MVT where field_SRC_WHSE='' AND field_DST_WHSE='STOCK' AND field_SOC_CODE='EVE' ;
		- regul - : select * from view_file_MVT where field_SRC_WHSE='STOCK' AND field_DST_WHSE='' AND field_SOC_CODE='EVE' ;
		
	********************************************
	*/
	$_tag_code = 'OSCARIO' ;
	$_tag_date = date('Y-m-d H:i:s') ;
	
	$buffer = '' ;
	$rows = array() ;
	
	// *** Réceptions 
	$query = "SELECT m.*, t.filerecord_id as transfer_id, t.field_TRANSFER_TXT as transfer_txt
				FROM view_file_MVT m
				LEFT OUTER JOIN view_file_TRANSFER_LIG tl ON tl.field_FILE_MVT_ID=m.filerecord_id
				LEFT OUTER JOIN view_file_TRANSFER t ON t.filerecord_id=tl.filerecord_parent_id
				LEFT OUTER JOIN view_file_MVT_TAG mt ON mt.filerecord_parent_id=m.filerecord_id AND mt.field_TAG_CODE='{$_tag_code}'
				WHERE m.field_SRC_WHSE='' AND m.field_DST_WHSE='RECEP' AND m.field_SOC_CODE='EVE' 
				AND m.field_COMMIT_IS_OK='1' AND DATE(m.field_COMMIT_DATE)<DATE(NOW())
				AND mt.filerecord_id IS NULL" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) ) {
		$mvt_filerecord_id = $arr['filerecord_id'] ;
		$arr['type'] = 'RECEP' ;
		$arr['signe'] = '+' ;
		
		$rows[$mvt_filerecord_id] = $arr ;
	}
	ksort($rows) ;
	
	
	$buffer = '' ;
	foreach( $rows as $row ) {
		$ref = $row['field_PROD_ID'] ;
		if( strpos($ref,$_PREFIX_REF.'_') === 0 )
			$ref = substr($ref,strlen($_PREFIX_REF)+1) ;
				
		$lig = '' ;
		$lig = substr_mklig( $lig, $row['type'].'-'.$row['transfer_id'], 0, 10 ) ;
		$lig = substr_mklig( $lig, $row['field_COMMIT_DATE'], 10, 10 ) ;
		$lig = substr_mklig( $lig, $ref, 20, 20 ) ;
		$lig = substr_mklig( $lig, $row['field_SPEC_BATCH'], 40, 20 ) ;
		$lig = substr_mklig( $lig, $row['field_SPEC_DATELC'], 60, 10 ) ;
		$lig = substr_mklig( $lig, $row['signe'].int_to_strX($row['field_QTY_MVT']*100,9), 70, 10 ) ;
		//$lig = substr_mklig( $lig, $arr['no_oa'], 80, 20 ) ; 
		//$lig = substr_mklig( $lig, $mag_exp, 100, 10 ) ; 
		$lig = substr_mklig( $lig, $row['transfer_txt'], 200, 100 ) ; 
		$lig.= "\r\n" ;
		
		$buffer.= $lig ;
		
	}
	foreach( array_keys($rows) as $mvt_filerecord_id ) {
		$arr_ins = array() ;
		$arr_ins['filerecord_parent_id'] = $mvt_filerecord_id ;
		$arr_ins['field_TAG_CODE'] = $_tag_code ;
		$arr_ins['field_TAG_DATE'] = $_tag_date ;
		$_opDB->insert('view_file_MVT_TAG',$arr_ins);
	}
	
	//echo $buffer ;
	
	$post_params = array() ;
	$post_params['oscario_domain'] = $_OSCARIO_DOMAIN ;
	$post_params['oscario_mag'] = $_OSCARIO_MAG ;
	$post_params['action'] = 'put_mvtin' ;
	$post_params['data'] = $buffer ;
	oscario_http_post($post_params) ;





	/*
	************************************
		RemontÃ©e CDEs
	***************************************
	*/
	$buffer = '' ;
	
	//echo "pouet\n" ;
	$arr_cdeFilerecordIds = array() ;
	$query = "SELECT filerecord_id FROM view_file_CDE WHERE field_STATUS='90' AND field_SOC_CODE='{$_OPTIMA_SOC}'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$arr_cdeFilerecordIds[] = $arr[0] ;
	}
	//print_r($arr_cdeFilerecordIds) ;
	
	$json = specDbsLam_cde_getGrid( array(
		'filter_cdeFilerecordId_arr' => json_encode($arr_cdeFilerecordIds),
		'load_extended' => true
	)) ;
	foreach( $json['data'] as $cde_row ) {
		//print_r($cde_row) ;
		foreach( $cde_row['ligs'] as $cdelig_row ) {
			$ref = $cdelig_row['stk_prod'] ;
			if( strpos($ref,$_PREFIX_REF.'_') === 0 )
				$ref = substr($ref,strlen($_PREFIX_REF)+1) ;
			
			$cde_nr = $cde_row['cde_nr'] ;
			$query = "SELECT field_PARENT_CDENR FROM view_file_CDE_LIG WHERE filerecord_id='{$cdelig_row['cdelig_filerecord_id']}'" ;
			$parent_cdenr = $_opDB->query_uniqueValue($query) ;
			if( $parent_cdenr && ($parent_cdenr!=$cde_nr) ) {
				$cde_nr = $parent_cdenr ;
			}
			
			$lig = '' ;
			$lig = substr_mklig( $lig, $cde_nr, 0, 20 ) ;
			$lig = substr_mklig( $lig, date('Y-m-d'), 20, 10 ) ;
			$lig = substr_mklig( $lig, $ref, 30, 20 ) ;
			$lig = substr_mklig( $lig, int_to_strX($cdelig_row['qty_cde']*100,10), 50, 10 ) ;
			$lig = substr_mklig( $lig, '', 60, 20 ) ;
			$lig = substr_mklig( $lig, int_to_strX($cdelig_row['qty_ship']*100,10), 80, 10 ) ;
			$lig.= "\r\n" ;
			
			$buffer.= $lig ;
		
			foreach( $cdelig_row['cdepack_ligs'] as $cdeligpack_row ) {
				$ref = $cdeligpack_row['stk_prod'] ;
				if( strpos($ref,$_PREFIX_REF.'_') === 0 )
					$ref = substr($ref,strlen($_PREFIX_REF)+1) ;
				
				$lig = '' ;
				$lig = substr_mklig( $lig, '++L', 0, 20 ) ;
				$lig = substr_mklig( $lig, '', 20, 10 ) ;
				$lig = substr_mklig( $lig, $ref, 30, 20 ) ;
				$lig = substr_mklig( $lig, '', 50, 10 ) ;
				$lig = substr_mklig( $lig, '', 60, 20 ) ;
				$lig = substr_mklig( $lig, int_to_strX($cdeligpack_row['mvt_qty']*100,10), 80, 10 ) ;
				$lig = substr_mklig( $lig, '', 90, 10 ) ;
				$lig.= "\r\n" ;
				$buffer.= $lig ;
				
				
				
				$lig = '' ;
				$lig = substr_mklig( $lig, '++C', 0, 20 ) ;
				$lig = substr_mklig( $lig, $cdeligpack_row['pack_id_trspt_id'], 20, 30 ) ;
				$lig = substr_mklig( $lig, $cdeligpack_row['pack_id_trspt_id'], 50, 30 ) ;
				$lig = substr_mklig( $lig, int_to_strX($cdeligpack_row['mvt_qty']*100,10), 80, 10 ) ;
				$lig = substr_mklig( $lig, '', 90, 10 ) ;
				$lig = substr_mklig( $lig, $cdeligpack_row['pack_id_sscc'], 100, 50 ) ;
				$lig = substr_mklig( $lig, $cdeligpack_row['pack_id_trspt_code'], 150, 50 ) ;
				$lig = substr_mklig( $lig, $cdeligpack_row['pack_id_trspt_id'], 200, 50 ) ;
				$lig.= "\r\n" ;
				$buffer.= $lig ;
			}
		}
	}
	foreach( $arr_cdeFilerecordIds as $cde_filerecord_id ) {
		$arr_update = array() ;
		$arr_update['field_STATUS'] = '100' ;
		paracrm_lib_data_updateRecord_file( 'CDE', $arr_update, $cde_filerecord_id ) ;
	}
	
	$post_params = array() ;
	$post_params['oscario_domain'] = $_OSCARIO_DOMAIN ;
	$post_params['oscario_mag'] = $_OSCARIO_MAG ;
	$post_params['action'] = 'put_cdes_remontee' ;
	$post_params['data'] = $buffer ;
	oscario_http_post($post_params) ;



	/*
	**********************************
		Descente CDEs
	*********************************
	*/
	$arr_ent = array() ;
	$tab_ent = array() ;
	$tab_ligs = array() ;
	$tab_idata = array() ;
	$kitCopy = array() ;
	$post_params = array() ;
	$post_params['action'] = 'get_cdes_upload' ;
	$post_params['oscario_mag'] = $_OSCARIO_MAG ;
	$post_params['oscario_domain'] = $_OSCARIO_DOMAIN ;
	$data = oscario_http_post($post_params) ;
	foreach(preg_split("/((\r?\n)|(\r\n?))/", $data) as $lig){
		if( $lig == NULL )
			continue ;
			
		$noscde = trim(substr($lig,2,20)) ;
		
		switch( substr($lig,0,1) )
		{
			case '1' :
				$arr_ent[$noscde] = $lig ;
			break ;
			
			case '2' :
				$tab_ligs[$noscde][] = $lig ;
			break ;
			
			case '3' :
				$tab_idata[$noscde][] = $lig ;
			break ;
		}
	}
	
	
	foreach( $arr_ent as $noscde => $lig )
	{
		if( !$tab_idata[$noscde] ) {
			$tab_idata[$noscde] = array() ;
		}
		$map_idata_ivalue = array() ;
		foreach( $tab_idata[$noscde] as $lig_idata )
		{
			$i_field = trim(substr($lig_idata,22,28)) ;
			$i_value = trim(substr($lig_idata,50,150)) ;
			$map_idata_ivalue[$i_field] = $i_value ;
		}
		$query = "SELECT count(*) FROM view_file_CDE WHERE field_CDE_NR='$noscde'" ;
		if( $_opDB->query_uniqueValue($query) > 0 )
			continue ;
			
		$adrliv_nom = trim(substr($lig,60,50)) ;
		$adrliv_rue = trim(substr($lig,110,50)) ;
		$adrliv_localite = trim(substr($lig,160,50)) ;
		$adrliv_ville = trim(substr($lig,210,50)) ;
		$adrliv_countrycode = trim(substr($lig,370,10)) ;
		$adr_txt = '' ;
		if( $adrliv_nom ) {
			$adr_txt.= $adrliv_nom."\n" ;
		}
		if( $adrliv_rue ) {
			$adr_txt.= $adrliv_rue."\n" ;
		}
		if( $adrliv_localite ) {
			$adr_txt.= $adrliv_localite."\n" ;
		}
		if( $adrliv_ville ) {
			$adr_txt.= $adrliv_ville."\n" ;
		}
		if( $adrliv_countrycode ) {
			$adr_txt.= $adrliv_countrycode."\n" ;
		}
		
		
		$arr_ecde = array() ;
		$arr_ecde['field_SOC_CODE'] = $_OPTIMA_SOC ;
		$arr_ecde['field_CDE_NR'] = $noscde ;
		$arr_ecde['field_STATUS'] = '5' ;
		$arr_ecde['field_TRSPT_CODE'] = $map_idata_ivalue['TRSPT_CODE'] ;
		$arr_ecde['field_ATR_CDECLASS'] = $map_idata_ivalue['CDE_CLASS'] ;
		$arr_ecde['field_ATR_CDE_D_EMAIL'] = $map_idata_ivalue['CONTACT_EMAIL'] ;
		$arr_ecde['field_ATR_CDE_D_TEL'] = $map_idata_ivalue['CONTACT_GSM'] ;
		$arr_ecde['field_CDE_REF'] = trim(substr($lig,22,20)) ;
		$arr_ecde['field_DATE_CDE'] = date('Y-m-d') ;
		if( date('Y-m-d',strtotime(trim(substr($lig,260,10)))) == trim(substr($lig,260,10)) )
			$arr_ecde['field_DATE_DUE'] = trim(substr($lig,260,10)) ;
		else
			$arr_ecde['field_DATE_DUE'] = date('Y-m-d') ;
		$arr_ecde['field_CLI_REF'] = trim(substr($lig,42,18)) ;
		$arr_ecde['field_ADR_NAME'] = trim(substr($lig,60,50)) ;
		$arr_ecde['field_ADR_COUNTRY'] = trim(substr($lig,370,10)) ;
		$arr_ecde['field_ADR_FULL'] = $adr_txt ;
		if( !$arr_ecde['field_ADR_COUNTRY'] ) {
			$arr_ecde['field_ADR_COUNTRY'] = 'FR' ;
		}
		$ttmp = explode(' ',trim(substr($lig,210,50))) ;
		$arr_ecde['field_ADR_CP'] = $ttmp[0] ;
		$arr_ecde['filerecord_id'] = paracrm_lib_data_insertRecord_file( 'CDE', 0, $arr_ecde ) ;
		$tab_ent[$noscde] = $arr_ecde ;
		
		
		$arr_ecde_obs = array() ;
		$arr_ecde_obs['noscde'] = $noscde ;
		$arr_ecde_obs['obstxt'] = trim(substr($lig,270,100)) ;
		//$connection->insert('da4ecde_obs',$arr_ecde_obs) ;
		
		if( !$tab_ligs[$noscde] ) {
			$tab_ligs[$noscde] = array() ;
		}
		$c=0 ;
		$nb_um = 0 ;
		foreach( $tab_ligs[$noscde] as $lig )
		{
			$kit_link_noscde = trim(substr($lig,60,20)) ;
			if( $kit_link_noscde ) {
				$kitCopy[] = array(
					'src' => $kit_link_noscde,
					'dst' => $noscde
				) ;
				continue ;
			}
			
			$c++ ;
			$arr_lgcde = array() ;
			$arr_lgcde['field_LIG_ID'] = $c ;
			$arr_lgcde['noscde_lig_n2'] = $noscde.'@'.int_to_strX($c,4) ;
			$arr_lgcde['noscde_lig_n3'] = $noscde.'@'.int_to_strX($c,4) ;
			$arr_lgcde['field_PROD_ID'] = strtoupper($_PREFIX_REF.'_'.trim(substr($lig,22,18))) ;
			$arr_lgcde['field_QTY_COMM'] = (float)(substr($lig,40,10)) / 100 ;
			$arr_lgcde['field_QTY_CDE']  = ($kit_link_noscde ? 0 : $arr_lgcde['field_QTY_COMM']) ;
			paracrm_lib_data_insertRecord_file( 'CDE_LIG', $arr_ecde['filerecord_id'], $arr_lgcde ) ;
			
			$nb_um += $arr_lgcde['field_QTY_CDE'] ;
		}
		
		$arr_update = array() ;
		$arr_update['field_VL_NBUM'] = $nb_um ;
		paracrm_lib_data_updateRecord_file( 'CDE', $arr_update, $arr_ecde['filerecord_id'] ) ;
	}
	
	
	
	foreach( $kitCopy as $copy ) {
		$src_cdenr = $copy['src'] ;
		$dst_cdenr = $copy['dst'] ;
		
		$query = "SELECT filerecord_id FROM view_file_CDE WHERE field_CDE_NR='$src_cdenr'" ;
		$src_filerecordId = $_opDB->query_uniqueValue($query) ;
		$query = "SELECT filerecord_id FROM view_file_CDE WHERE field_CDE_NR='$dst_cdenr'" ;
		$dst_filerecordId = $_opDB->query_uniqueValue($query) ;
		
		$query = "UPDATE view_file_CDE_LIG SET field_PARENT_CDENR='{$src_cdenr}' WHERE filerecord_parent_id='{$src_filerecordId}'" ;
		$_opDB->query($query) ;
		$query = "UPDATE view_file_CDE_LIG SET filerecord_parent_id='{$dst_filerecordId}' WHERE filerecord_parent_id='{$src_filerecordId}'" ;
		$_opDB->query($query) ;
		$query = "DELETE FROM view_file_CDE WHERE filerecord_id='{$src_filerecordId}'" ;
		$_opDB->query($query) ;
		
		$nb_um = $_opDB->query_uniqueValue("SELECT sum(field_QTY_CDE) FROM view_file_CDE_LIG WHERE filerecord_parent_id='{$dst_filerecordId}'") ;
		$query = "UPDATE view_file_CDE SET field_VL_NBUM='{$nb_um}' WHERE filerecord_id='{$dst_filerecordId}'" ;
		$_opDB->query($query) ;
	}
}
?>
