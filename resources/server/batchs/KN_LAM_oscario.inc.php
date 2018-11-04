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
		$arr_ins['field_PROD_GENCOD'] = $prod_gencod ;
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
	********************************************
	*/
	$buffer = '' ;
	
	$post_params = array() ;
	$post_params['oscario_domain'] = $_OSCARIO_DOMAIN ;
	$post_params['oscario_mag'] = $_OSCARIO_MAG ;
	$post_params['action'] = 'put_mvtin' ;
	$post_params['data'] = $buffer ;
	//oscario_http_post($poscario_http_postost_params) ;





	/*
	************************************
		RemontÃ©e CDEs
	***************************************
	*/
	$buffer = '' ;

	
	// *****************************************
	//  Circuit EVE MATTRESS
	//  - remontee commandes KT
	if( $_OPTIMA_SOC=='E' ) {
		$obj_trsptman = new TransporteurManager ;
		
		$obj_cdeman = new CommandeManager ;
		$arr_select['cmad'] = 'REMONTEE_READY' ;
		$arr_select['code_soc'] = $_OPTIMA_SOC ;
		$obj_cdeman->interroCriteres( $arr_select, -1 ) ;
		while( ($obj_cde = $obj_cdeman->getNextCommande()) != FALSE )
		{
			// Dispatch des infos tracking
			$noscde = $obj_cde->getNoscde() ;
			$query = "UPDATE da4colis ldst
					JOIN da4colis lsrc ON SUBSTRING_INDEX(lsrc.noscde_lig_n2,'@',1)=SUBSTRING_INDEX(ldst.noscde_lig_n2,'@',1) AND lsrc.no_carton_exp=ldst.no_carton_exp AND lsrc.etiq_exp<>''
					SET ldst.id_colis_transporteur=lsrc.id_colis_transporteur , ldst.id_colis_sscc=lsrc.id_colis_sscc
					WHERE SUBSTRING_INDEX(ldst.noscde_lig_n2,'@',1) = '{$noscde}' AND ldst.no_carton_exp<>''" ;
			$connection->query($query) ;
		
		
			$noscde = $obj_cde->getNoscde() ;
			$query = "SELECT noscde_lig_n2, kit_link_noscde FROM da4lgcde WHERE noscde='{$noscde}' AND kit_link_noscde<>'' AND imp_prep<>'KT'" ;
			$result = $connection->query($query) ;
			while( ($arr = $connection->fetch_assoc($result)) != FALSE ) {
				$ttmp_kit = explode('@',$arr['kit_link_noscde'],2) ;
				if( count($ttmp_kit) != 2 ) {
					continue ;
				}
				//print_r($arr) ;
				
				// kit_link_noscde = LIG
				// => déplacement de la ligne + colis vers commande originale
				$ttmp_lig = explode('@',$arr['noscde_lig_n2'],2) ;
				$ttmp_kit = explode('@',$arr['kit_link_noscde'],2) ;
				$dst_noscde = $ttmp_kit[0] ;
				$dst_noscdelign3 = $arr['kit_link_noscde'] ;
				$dst_noscdelign2 = $ttmp_kit[0].'@'.$ttmp_lig[1] ;
				$src_noscdelign2 = $arr['noscde_lig_n2'] ;
				
				$query = "UPDATE da4lgcde 
						SET noscde='{$dst_noscde}', noscde_lig_n2='{$dst_noscdelign2}', noscde_lig_n3='{$dst_noscdelign3}', kit_link_noscde=''
						WHERE noscde_lig_n2='{$src_noscdelign2}'" ;
				$connection->query($query) ;
				
				$query = "UPDATE da4colis
						SET noscde_lig_n2='{$dst_noscdelign2}'
						WHERE noscde_lig_n2='{$src_noscdelign2}'" ;
				$connection->query($query) ;
				
				// update CMAD+no_bl+no_brt ?
				$arr_update = array() ;
				$arr_update['no_bl'] = $obj_cde->getNoBl() ;
				$arr_update['no_brt'] = $obj_cde->getNoBrt() ;
				$arr_update['cmad'] = $obj_cde->getCMAD() ;
				$arr_cond = array() ;
				$arr_cond['noscde'] = $dst_noscde ;
				$connection->update('da4ecde',$arr_update,$arr_cond) ;
			}
			
			$query = "SELECT noscde_lig_n3, kit_link_noscde FROM da4lgcde WHERE noscde='{$noscde}' AND kit_link_noscde<>'' AND imp_prep='KT'" ;
			$result = $connection->query($query) ;
			while( ($arr = $connection->fetch_assoc($result)) != FALSE ) {
				// kit_link_noscde = ENT
				$noscde_lig_n3 = $arr['noscde_lig_n3'] ;
				$kit_noscde = $arr['kit_link_noscde'] ;
				
				// checks ?
				$query = "SELECT sum(qte_cde-qte_prep) FROM da4lgcde WHERE noscde='{$kit_noscde}'" ;
				if( $connection->query_uniqueValue($query) > 0 ) {
					// erreur de qte ?
					continue ;
				}
				
				$obj_lig = new LigneCommande ;
				$obj_lig->load($noscde_lig_n3) ;
				
				
				// interro ?
				// - id_colis_sscc
				// - id_colis_transporteur
				$query = "SELECT c.no_carton_exp, c.id_colis_transporteur, c.id_colis_sscc
							FROM da4colis c
							JOIN da4lgcde l ON l.noscde_lig_n2=c.noscde_lig_n2
							WHERE l.noscde='{$kit_noscde}' AND c.id_colis_transporteur<>''" ;
				$res2 = $connection->query($query) ;
				$infos_tracking = $connection->fetch_assoc($res2) ;
				$obj_lig->acquitter_qte_kitting($infos_tracking) ;
			}
		}
	}
	
	
	/*
	$obj_cdeman = new CommandeManager ;
	$arr_select['cmad'] = 'REMONTEE_READY' ;
	$arr_select['code_soc'] = $_OPTIMA_SOC ;
	$obj_cdeman->interroCriteres( $arr_select, -1 ) ;
	while( ($obj_cde = $obj_cdeman->getNextCommande()) != FALSE )
	{
		$noscde = $obj_cde->getNoscde() ;
		$date_expe = $obj_cde->getDateExp() ;
		$db_arr = $obj_cde->getDBarr() ;
		
		$obj_cde->loadLignes() ;
		$obj_cde->createGroupes() ;
		while (($my_groupe = $obj_cde->getNextGroupe()) != FALSE )
		{
			$artrefdist = $my_groupe->getArtrefdist() ;
			
			$spec_lot = $my_groupe->getBainUnique() ;
			
			$qte_cde = $my_groupe->getQteCdeTotale() ;
			$qte_prep = $my_groupe->getQteRemonteeTotale() ;

			$ref = $artrefdist ;
			if( strpos($ref,$_PREFIX.'_') === 0 )
				$ref = substr($ref,3,strlen($ref)-3) ;

			$lig = '' ;
			$lig = substr_mklig( $lig, $noscde, 0, 20 ) ;
			$lig = substr_mklig( $lig, $date_expe, 20, 10 ) ;
			$lig = substr_mklig( $lig, $ref, 30, 20 ) ;
			$lig = substr_mklig( $lig, int_to_strX($qte_cde*100,10), 50, 10 ) ;
			$lig = substr_mklig( $lig, $spec_lot, 60, 20 ) ;
			$lig = substr_mklig( $lig, int_to_strX($qte_prep*100,10), 80, 10 ) ;
			$lig.= "\r\n" ;
			
			$buffer.= $lig ;
			
			
			$my_groupe->debutLignes() ;
			while( ($obj_lig = $my_groupe->getNextLigne()) != FALSE )
			{
				$artrefdist = $obj_lig->getArtrefdist() ;
				$ref = $artrefdist ;
				if( strpos($ref,$_PREFIX.'_') === 0 )
					$ref = substr($ref,3,strlen($ref)-3) ;
				$spec_lot = $obj_lig->getBain() ;
				$datelc = $obj_lig->getDateLC() ;
				$qte_prep = $obj_lig->getQtePreparee() ;
				
				$lig = '' ;
				$lig = substr_mklig( $lig, '++L', 0, 20 ) ;
				$lig = substr_mklig( $lig, '', 20, 10 ) ;
				$lig = substr_mklig( $lig, $ref, 30, 20 ) ;
				$lig = substr_mklig( $lig, '', 50, 10 ) ;
				$lig = substr_mklig( $lig, $spec_lot, 60, 20 ) ;
				$lig = substr_mklig( $lig, int_to_strX($qte_prep*100,10), 80, 10 ) ;
				$lig = substr_mklig( $lig, $datelc, 90, 10 ) ;
				$lig.= "\r\n" ;
				$buffer.= $lig ;
				
				
				if( $obj_cde->getClasseCde() == 'L' ) {
					$arr_ref_pal_qte = array() ;
					$obj_lig->loadColis() ;
					$obj_lig->debutColis() ;
					while( ($obj_colis = $obj_lig->getNextColis()) != FALSE )
					{
						$qte_colis = $obj_colis->getQteColis() ;
						$sscc_colis = $obj_trsptman->get_SSCC_colis( $obj_colis ) ;
						$no_pal = $obj_colis->getNoContainerExp() ;
					
						$arr_ref_pal_qte[$no_pal][$sscc_colis] = $qte_colis ;
					}
					// print_r($arr_ref_pal_qte) ;
					foreach( $arr_ref_pal_qte as $no_pal => $arr1 )
					{
						$obj_contpal = new ContainerPalette ;
						$obj_contpal->load( $no_pal ) ;
						$sscc_pal = $obj_trsptman->get_SSCC_container( $obj_contpal ) ;
						foreach( $arr1 as $sscc_colis => $qte )
						{
							$lig = '' ;
							$lig = substr_mklig( $lig, '++C', 0, 20 ) ;
							$lig = substr_mklig( $lig, $sscc_pal, 20, 30 ) ;
							$lig = substr_mklig( $lig, $sscc_colis, 50, 30 ) ;
							$lig = substr_mklig( $lig, int_to_strX($qte*100,10), 80, 10 ) ;
							$lig.= "\r\n" ;
							$buffer.= $lig ;
						}
					}
				}
				if( $obj_cde->getClasseCde() == 'DT' ) {
					
					$obj_lig->loadColis() ;
					$obj_lig->debutColis() ;
					while( ($obj_colis = $obj_lig->getNextColis()) != FALSE )
					{
						$qte = $obj_colis->getQteColis() ;
						$id_colis_transporteur = $obj_colis->fetch_id_colis_transporteur() ;
						
							$lig = '' ;
							$lig = substr_mklig( $lig, '++C', 0, 20 ) ;
							$lig = substr_mklig( $lig, $id_colis_transporteur, 20, 30 ) ;
							$lig = substr_mklig( $lig, $id_colis_transporteur, 50, 30 ) ;
							$lig = substr_mklig( $lig, int_to_strX($qte*100,10), 80, 10 ) ;
							$lig.= "\r\n" ;
							$buffer.= $lig ;
					}
				}
			}
		}
		$obj_cde->majCMAD_30() ;
	}
	*/
	
	
	$post_params = array() ;
	$post_params['oscario_domain'] = $_OSCARIO_DOMAIN ;
	$post_params['oscario_mag'] = $_OSCARIO_MAG ;
	$post_params['action'] = 'put_cdes_remontee' ;
	$post_params['data'] = $buffer ;
	//oscario_http_post($post_params) ;




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
		$arr_ecde['field_STATUS'] = '10' ;
		$arr_ecde['field_ATR_CDECLASS'] = $map_idata_ivalue['SERVICE_CODE'] ;
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
