<?php

function specDbsLam_lib_TMS_getValueStatic( $value_key ) {
	global $_opDB ;
	
	$query = "SELECT field_VAL_STRING FROM view_file_TMS_VALUE WHERE field_VAL_KEY='{$value_key}'" ;
	$value = $_opDB->query_uniqueValue($query) ;
	
	return $value ;
}
function specDbsLam_lib_TMS_getValueIncrement( $value_key, $value_max=NULL ) {
	global $_opDB ;
	
	$query = "LOCK TABLES view_file_TMS_VALUE WRITE" ;
	$_opDB->query($query) ;
	
	$query = "UPDATE view_file_TMS_VALUE SET field_VAL_STRING=LPAD((field_VAL_STRING+1),LENGTH(field_VAL_STRING),'0') WHERE field_VAL_KEY='{$value_key}'" ;
	$_opDB->query($query) ;
	
	$query = "SELECT field_VAL_STRING FROM view_file_TMS_VALUE WHERE field_VAL_KEY='{$value_key}'" ;
	$value = $_opDB->query_uniqueValue($query) ;
	
	$query = "UNLOCK TABLES" ;
	$_opDB->query($query) ;
	
	return $value ;
}

function specDbsLam_lib_TMS_getNOCOLIS() {
	return specDbsLam_lib_TMS_getValueIncrement('WHSE_NOCOLIS') ;
}
function specDbsLam_lib_TMS_getSSCC() {
	$prefix_9 = specDbsLam_lib_TMS_getValueStatic('SSCC_PREFIX9') ;
	$nocolis_7 = specDbsLam_lib_TMS_getValueIncrement('SSCC_COUNTER_VAL',specDbsLam_lib_TMS_getValueStatic('SSCC_COUNTER_MAX')) ;
	
	$str = '0'.$prefix_9.$nocolis_7 ;

	$eansum = 0 ;
	for( $i=0 ; $i<strlen($str) ; $i++ )
	{
		$mchar = $str[$i] ;
		if( $i % 2 == 0 )
			$eansum += $mchar * 3 ;
		else
			$eansum += $mchar * 1 ;
	}
	$reste = ($eansum % 10) ;
	if ($reste == 0)
		$checkdigit = 0 ;
	else
		$checkdigit = 10 - $reste ;
	
	$sscc = $str.$checkdigit ;
	return $sscc ;
}










function specDbsLam_lib_TMS_OPTIMA_getZplBuffer( $rowExtended_transferCdePack, $h_offset=1270 ){
		$buffer = '' ;
		$buffer.= "^FO30,{$h_offset}^GB785,300,5^FS";
		
		$row_transferLig = $rowExtended_transferCdePack['ligs'][0] ;
		
		$zone_regroup = $row_transferLig['dst_adr'] ;
		if( !$zone_regroup ) {
			$zone_regroup = 'XXXXXX' ;
		}
		
		/*
		if ($obj_lig->IsBainImperatif())
			$bain_imp = 'bain imp' ;
		else 
			$bain_imp = " " ;
		*/
		$h_zone = $h_offset + 15 ;
		$buffer.= "^FO360,{$h_zone}^ASN^FD".$zone_regroup."^FS";
		
		$no_colis = $rowExtended_transferCdePack['id_nocolis'] ;
		$barcode_piste = $no_colis ;		
		$h_barcode = $h_offset + 260 ;
		$buffer.= "^FT60,{$h_barcode}^B2N,200^FD{$barcode_piste}^FS";
		
		$w_infos = 410 ;
		$h = $h_offset + 20 ;
		
		$h+= 50 ;
		$h+= 40 ;
		$buffer.= "^FO{$w_infos},{$h}^ATN^FD"."Bal: {$rowExtended_transferCdePack['transfer_filerecord_id']}"."^FS";
		$h+= 50 ;
		$buffer.= "^FO{$w_infos},{$h}^ASN^FD"."Ref : {$row_transferLig['stk_prod']}"."^FS";
		// $h+= 40 ;
		//$buffer.= "^FO{$w_infos},{$h}^ARN^FD"."Lot : {$data_lgcde['bain']} $bain_imp "."^FS";
		$h+= 40 ;
		$buffer.= "^FO{$w_infos},{$h}^ASN^FD"."Qte : {$row_transferLig['mvt_qty']}"."^FS";
		$h+= 50 ;
		$buffer.= "^FO{$w_infos},{$h}^ARN^FD"."Cde : {$rowExtended_transferCdePack['cde']['cde_nr']}"."^FS";
		
		return $buffer ;
}




function specDbsLam_lib_TMS_getTrsptId($rowExtended_transferCdePack, $pack_id_trspt_code) {
	switch( $pack_id_trspt_code ) {
		case 'MRPASHA' :
			$cdelig_ligId = NULL ;
			if( count($rowExtended_transferCdePack['ligs'])==1 ) {
				$transferlig_row = reset($rowExtended_transferCdePack['ligs']) ;
				$cdepack_transfercdelink_filerecord_id = $transferlig_row['cdepack_transfercdelink_filerecord_id'] ;
				foreach( $rowExtended_transferCdePack['cde']['ligs'] as $cdelig_row ) {
					if( $cdelig_row['link_transfercdelink_filerecord_id'] == $cdepack_transfercdelink_filerecord_id ) {
						$cdelig_ligId = $cdelig_row['lig_id'] ;
					}
				}
			}
			$str = '167-'.$rowExtended_transferCdePack['cde']['cde_ref'] ;
			if( $cdelig_ligId ) {
				$str.= '-'.$cdelig_ligId ;
			}
			return $str ;
			
		case 'GAC' :
			return 'GAC-'.$rowExtended_transferCdePack['id_nocolis'] ;
		
		case 'AGD' :
			return specDbsLam_lib_TMS_AGD_getId($rowExtended_transferCdePack) ;
		
		case 'DPDG' :
			return specDbsLam_lib_TMS_DPDG_getId($rowExtended_transferCdePack['cde']['soc_code']) ;
		
		case 'UPS' :
			if( $arr_elements=specDbsLam_lib_TMS_UPS_getElements($rowExtended_transferCdePack,$do_force=TRUE) ) {
				return $arr_elements['tracking_id'] ;
			}
			return null ;
		
		default :
			return null ;
	}
}
function specDbsLam_lib_TMS_getTrsptZplBuffer($rowExtended_transferCdePack, $pack_id_trspt_code, $pack_id_trspt_id) {
	$zebra_buffer = '' ;
	$zebra_buffer.= '^XA^POI' ;
	$zebra_buffer.= "^BY3,3.0,10^FS" ;
	switch( $pack_id_trspt_code ) {
		case 'MRPASHA' :
			$zebra_buffer.= specDbsLam_lib_TMS_MRP_getZplBuffer($rowExtended_transferCdePack) ;
			break ;
			
		case 'GAC' :
			$zebra_buffer.= specDbsLam_lib_TMS_GAC_getZplBuffer($rowExtended_transferCdePack) ;
			break ;
			
		case 'AGD' :
			$zebra_buffer.= specDbsLam_lib_TMS_AGD_getZplBuffer($rowExtended_transferCdePack,$pack_id_trspt_id) ;
			break ;
			
		case 'DPDG' :
			$zebra_buffer.= specDbsLam_lib_TMS_DPDG_getZplBuffer($rowExtended_transferCdePack,$pack_id_trspt_id) ;
			break ;
			
		case 'UPS' :
			if( $arr_elements=specDbsLam_lib_TMS_UPS_getElements($rowExtended_transferCdePack) ) {
				$zebra_buffer.= $arr_elements['label_zpl_part'] ;
				break ;
			}
			return null ;
			
		default :
			return null ;
	}
	$zebra_buffer.= specDbsLam_lib_TMS_OPTIMA_getZplBuffer($rowExtended_transferCdePack) ;
	$zebra_buffer.= '^XZ' ;
	return $zebra_buffer ;
}










function specDbsLam_lib_TMS_DPDG_getId( $soc_code ) {
	/* Retour du barcode de base sans les clés */
	$key_trspt = 'DPDG_'.$soc_code.'_TRSPT' ;
	$key_plageIdx = 'DPDG_'.$soc_code.'_PLAGE_IDX' ;
	$key_plageMax = 'DPDG_'.$soc_code.'_PLAGE_MAX' ;
	
	
	$id_trspt = specDbsLam_lib_TMS_getValueStatic( $key_trspt ) ;
	$id_plage = specDbsLam_lib_TMS_getValueIncrement( $key_plageIdx, specDbsLam_lib_TMS_getValueStatic($key_plageMax) ) ;
	
	$barcode_base = $id_trspt.$id_plage ;
	
	/* Retour du barcode printable */
	$barcode = $barcode_base ;
	
	$cle_tmp = (98-((($barcode % 97)*3) % 97 )) % 97  ;
	$cle1 = str_pad( $cle_tmp, 2, '0', STR_PAD_LEFT ) ;

	
	$barcode.= $cle1 ;


	$eansum = 0 ;
	$eansump = 0 ;
	$eansumi= 0 ;
	for( $i=0 ; $i<strlen($barcode) ; $i++ )
	{
		$mchar = $barcode[$i] ;
		if( $i % 2 == 0 )
			$eansumi += $mchar * 3 ;
		else 
			$eansump += $mchar * 1;
	}
	$eansum = $eansump + $eansumi ;
	$dizsup = ceil($eansum/10) * 10 ;
	$cle2 = (($dizsup - $eansum) + 1) % 10 ;


	$barcode.= $cle2 ;
	
	return $barcode ;
}





	function specDbsLam_lib_TMS_DPDG_getZplBuffer( $rowExtended_transferCdePack,$pack_id_trspt_id ) {
		setlocale(LC_ALL,'en_US.UTF-8');
		
		
		$buffer = '' ;
		
		$buffer.= "~DGPREDIC.GRF,1435,7, 00000000000000
00000000000000
00000000000000
00000000000000
007FFFFFFFFE00
007FFFFFFFFE00
00000000000600
00000000000600
00000000000600
00000000000600
00000000000600
00000000000600
00000600000600
00000600000600
00000600000600
00000600000600
00000600000600
00000600000600
00000600000600
00000600000600
00000600000600
00000600000600
00000600000600
00000600000600
00000300000600
00000300000C00
00000380000C00
000001C0001C00
000000C0003800
000000F0007000
0000007C01E000
0000001FFFC000
0000000FFF0000
00000000000000
00000000000000
00000000000000
00000000000000
00000000000000
00000000000000
00000000000000
00000000000000
007FFFFFFC0000
003FFFFFFC0000
00000003800000
00000000C00000
00000000300000
00000000180000
00000000080000
000000000C0000
000000000C0000
00000000060000
00000000060000
00000000060000
00000000060000
00000000060000
000000000C0000
000000000C0000
00000000180000
00000000000000
00000000000000
00000000000000
00003FF0000000
0000FFFE000000
0003E18F000000
00070101C00000
000E0100E00000
001C0100700000
00380100380000
00300100180000
006001000C0000
006001000C0000
00400100040000
00C00100060000
00C00100060000
00C00100060000
00C00100060000
00C00100060000
00C00100060000
00C00100060000
00C00100060000
00C00100060000
00C001000C0000
006001000C0000
006001001C0000
00600100180000
00300100300000
00300180E00000
001801FFC00000
000801FF000000
00000030000000
00000000000000
00000000000000
00000000000000
00000000000000
00000000000000
00000000000000
00007FFC000000
0001FFFF000000
0003C007800000
00070001E00000
000E0000F00000
001C0000300000
00380000180000
003000001C0000
006000000C0000
006000000C0000
006000000C0000
00C00000060000
00C00000060000
00C00000060000
00C00000060000
00C00000060000
00C00000060000
00400000040000
004000000C0000
006000000C0000
00200000080000
00300000180000
00100000100000
00080000200000
000C0000600000
007FFFFFFFFF80
007FFFFFFFFF80
00000000000000
00000000000000
00000000000000
00000000000000
00000000000000
00000000000000
00000000000000
00000000000000
00000000000000
00000000000100
007FFFFFFC0380
007FFFFFFC0380
00000000000300
00000000000000
00000000000000
00000000000000
00000000000000
00000000000000
00000000000000
00000000000000
00001FF0000000
0000FFFE000000
0001F01F000000
00038003C00000
000F0000E00000
000C0000700000
00180000300000
00380000180000
003000001C0000
006000000C0000
006000000C0000
00C00000060000
00C00000060000
00C00000060000
00C00000060000
00C00000060000
00C00000060000
00C00000060000
00C00000060000
00C00000060000
00400000060000
006000000C0000
006000000C0000
00300000180000
00300000180000
00180000300000
00000000000000
00000000000000
00000000000000
00000000000000
00000000000000
00000000040000
00000000040000
00000000040000
00000000040000
00000000040000
000000000C0000
0003FFFFFFF800
001FFFFFFFF800
003E00000E0000
00700000040000
00600000040000
00E00000040000
00C00000040000
00C00000040000
00C00000040000
00C00000040000
00C00000040000
00400000040000
00600000040000
00600000040000
00200000040000
00300000000000
00100000000000
00000000000000
00000000000000
00000000000000
00000000000000
00000000000000
00000000000000
00000000000000
00000000000000" ;
		
		
		
		$buffer.= "~DGLOGO.GRF,1890,10, 00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
000003FFFFFFF0000000
000007FFFFFFF0000000
00000FFFFFFFF0000000
00000FFFFFFFF0200000
00001FFFFFFFE0300000
00003FFFFFFFE0780000
00003FFFFFFFC0780000
00003FFFFFFFC0FC0000
00007FFFFFFF81FC0000
00007FFFFFFF01FC0000
0000FFFFFFFF03FE0000
0001FFFFFFFE03FE0000
0001FFFFFFFE07FF0000
0003FFFFFFFC0FFF0000
0003FFFFFFF81FFF8000
0007FFFFFFF81FFF8000
000FFFFFFFF03FFFC000
000FFFFFFFF03FFFE000
001FFFFFFFE03FFFF000
001FFFFFFFE07FFFF000
003FFFFFFFC07FFFF800
007FFFFFFF80FFFFF800
007FFFFFFF81FFFFFC00
00FFFFFFFF01FFFFFC00
01FFFFFFFF03FFFFFE00
01FFFFFFFE03FFFFFE00
03FFFFFFFC07FFFFFF00
03FFFFFFF80FFFFFFF00
07FC0000000FFFFFFF80
0FF80000001FFFFFFFC0
0FF00000001FFFFFFFE0
0FF00000003FFFFFFFC0
07F80000003FFFFFFF80
07FFFFFFFFFFFFFFFF80
03FFFFFFFFFFFFFFFF00
03FFFFFFFFFFFFFFFF00
01FFFFFFFFFFFFFFFF00
00FFFFFFFFFFFFFFFE00
00FFFFFFFFFFFFFFFE00
00FFFFFFFFFFFFFFFC00
007FFFFFFFF0FFFFFC00
007FFFFFFFE0FFFFF800
003FFFFFFFE07FFFF000
000FFFFFFFE07FFFF000
000FFFFFFFF03FFFE000
000FFFFFFFF81FFFC000
0007FFFFFFF81FFFC000
0007FFFFFFFC0FFF8000
0003FFFFFFFC0FFF8000
0001FFFFFFFC07FF0000
0001FFFFFFFE03FF0000
0000FFFFFFFE03FE0000
0000FFFFFFFF01FC0000
00007FFFFFFF80FC0000
00007FFFFFFF80F80000
00003FFFFFFFC0780000
00001FFFFFFFC0700000
00001FFFFFFFE0300000
00000FFFFFFFF0000000
00000FFFFFFFF0000000
000003FFFFFFF0000000
000001FFFFFFF0000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000001FE0000000000
0000000FFF8000000000
0000001FFFE000000000
0000007FFFF000000000
0000007FFFF800000000
000000FFFFFC00000000
000001FF8FFC00000000
000003FC01FE00000000
000003F800FE00000000
000003F0007E00000000
000007F0007E00000000
000007F0003E00000000
000007F0003F00000000
000007E0003F00000000
000007E0003F00000000
000007E0003E00000000
000007E0003E00000000
000007F0007E00000000
000007FFFFFFFFE00000
000007FFFFFFFFE00000
000007FFFFFFFFE00000
000003FFFFFFFFE00000
000003FFFFFFFFE00000
000003FFFFFFFFE00000
000001FFFFFFFFE00000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
000FFFFFFFFC00000000
000FFFFFFFFC00000000
000FFFFFFFFE00000000
000FFFFFFFFE00000000
000FFFFFFFFE00000000
000FFFFFFFFE00000000
000FFFFFFFFE00000000
00000000003E00000000
00000000003E00000000
00000000003F00000000
00000000003F00000000
000007F0003F00000000
000007F0003F00000000
000007F0003E00000000
000007F0007E00000000
000003F8007E00000000
000003FC01FE00000000
000003FF87FC00000000
000001FFFFFC00000000
000000FFFFF800000000
0000007FFFF800000000
0000007FFFF000000000
0000001FFFE000000000
0000000FFFC000000000
00000001FC0000000000
00000000000000000000
00000000000000000000
00000001FC0000000000
0000000FFFC000000000
0000001FFFE000000000
0000007FFFF000000000
0000007FFFF800000000
000000FFFFFC00000000
000001FFFFFC00000000
000003FF87FC00000000
000003FC00FE00000000
000003F8007E00000000
000007F0007E00000000
000007F0003F00000000
000007F0003F00000000
000007E0003F00000000
000007E0003F00000000
000007E0003E00000000
000007E0003E00000000
000007E0007E00000000
000007FFFFFFFFE00000
000007FFFFFFFFE00000
000007FFFFFFFFE00000
000003FFFFFFFFE00000
000003FFFFFFFFE00000
000003FFFFFFFFE00000
000003FFFFFFFFE00000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000
00000000000000000000" ;

		
/*		$buffer.= "^FO20,10^GB805,0,10^FS";
			$buffer.= "^FO360,10^GB0,140,80^FS";
			$buffer.= "^FO600,10^GB215,0,140^FS";*/
			$buffer.= "^CI28" ;
		

			
			/*
			$obj_lig = $obj_Colis->get_objLigneCommande() ;
			$obj_cde = $obj_lig->get_objCommande() ;
			$date = $obj_cde->getDateDpe() ;
			$db_arr_climag = $obj_cde->getDBarr_climag() ;
			$db_arr_societe = $obj_cde->getDBarr_societe() ;
			$db_arr_trspt = $obj_cde->getDBarr_transporteur() ;
			$data_colis = $obj_Colis->getDBarr() ;
			$data_lgcde = $obj_lig->getDBarr() ;
			$data_ecde = $obj_cde->getDBarr() ;
			$arr_ecde_idata = $obj_cde->idata_getTab() ;
			$no_colis = $obj_Colis->getNoColis() ;
			*/
			
			$no_carton_exp = $rowExtended_transferCdePack['calc_folio_idx'] ;
			$tot_carton = $rowExtended_transferCdePack['calc_folio_sum'] ;
			
			$code_pays = $data_ecde['pays'] ;
		
			// TODO $db_arr_entrepot = $obj_trsptman->static_getSelfAdresse() ;
			
			$soc_code = $rowExtended_transferCdePack['cde']['soc_code'] ;
			$key_trspt = 'DPDG_'.$soc_code.'_TRSPT' ;
			$id_trspt = specDbsLam_lib_TMS_getValueStatic( $key_trspt ) ;
			$id_trspt_constante = substr($id_trspt,0,3) ;
			$id_trspt_agence = substr($id_trspt,3,3) ;
			
			
			$adr_full = trim($rowExtended_transferCdePack['cde']['adr_full']) ;
			$arr_adr = explode("\n",$adr_full) ;
			array_pop($arr_adr) ;
			$last_lig = array_pop($arr_adr) ;
			$ttmp = explode(' ',$last_lig,2) ;
			$destination['nom'] = trim($arr_adr[0]);
			$destination['adr1'] = substr(trim($arr_adr[1]), 0,35 );
			$destination['adr2'] = substr(trim($arr_adr[2]), 0,35 );
			$destination['cp'] = $rowExtended_transferCdePack['cde']['adr_cp'] ;
			$destination['ville'] = substr($ttmp[1], 0,35 );
			foreach( $destination as &$str ) {
				$str=iconv('UTF-8','ASCII//TRANSLIT',$str);
			}
			unset($str) ;


			
			$height_exp = 120 ;
			$width_exp = 770 ;	
			$h = $height_exp ;
			$w = $width_exp  ;			
			$buffer.= "^FT{$w},{$h},0^A0R,20,20^FD"."DPD SAS Etablissement 095"."^FS";
			$w = $width_exp - 20 ;
			$buffer.= "^FT{$w},{$h},0^A0R,20,20^FD"."ZA Les Portes de Vemars"."^FS";
			$w = $width_exp - 40 ;
			$buffer.= "^FT{$w},{$h},0^A0R,20,20^FD"."7 rue de la Tour"."^FS";
			$w = $width_exp - 60 ;
			$buffer.= "^FT{$w},{$h},0^A0R,20,20^FD"."F - 95470 VEMARS"."^FS";
			$w = $width_exp - 80 ;
			$buffer.= "^FT{$w},{$h},0^A0R,20,20^FD"."09 70 80 85 66"."^FS";
				
			
			
			
			
			
			
			// ********** ZONE DE ROUTAGE EXAPAQ ***************
			
			$row_plan2 = specDbsLam_lib_TMS_DPDG_getRowPlan2( $id_trspt_agence, $rowExtended_transferCdePack['cde']['adr_country'], $rowExtended_transferCdePack['cde']['adr_cp'] ) ;
			
			$poids_kg = $rowExtended_transferCdePack['calc_vl_kg'] ;
			$_ROUTAGE_ZONES = array() ;
			$_ROUTAGE_ZONES['1'] = ( $poids_kg < 1 ) ;
			$_ROUTAGE_ZONES['2'] = $row_plan2['TRI1'] ;
			$_ROUTAGE_ZONES['3'] = $row_plan2['LIGNE1'] ;
			$_ROUTAGE_ZONES['2a'] = $row_plan2['TRI2'] ;
			$_ROUTAGE_ZONES['3a'] = $row_plan2['LIGNE2'] ;
			$_ROUTAGE_ZONES['4'] = ($row_plan2['PRETRI'] == 'BOX') ;
			$_ROUTAGE_ZONES['6'] = $row_plan2['TOUR'] ;
			$_ROUTAGE_ZONES['10'] = $row_plan2['TOURPRINT'] ;
			$_ROUTAGE_ZONES['7'] = $row_plan2['ACPRINT'] ;
			$_ROUTAGE_ZONES['8'] = $row_plan2['CBTRI'] ;
			$_ROUTAGE_ZONES['11'] = str_pad( number_format($poids_kg, 2, '.', ''), 5, '0', STR_PAD_LEFT ).' kg' ;
			$_ROUTAGE_ZONES['9'] = date('d/m/Y') ;
			
			//print_r($_ROUTAGE_ZONES) ;
			
			$width_exp = 100 ;
			$height_exp = 320 ;
			$h = $height_exp ;
			$w = $width_exp  ;
			$buffer.= "^FO{$w},{$h}^GB475,380,2,B^FS";
			$width_exp = 575 ;
			$w = $width_exp  ;
			$buffer.= "^FO{$w},{$h}^GB75,380,2,B^FS";
			
			
			$w_init = 100 + 475 ;
			$h_init = 320 ;
			
			if( $_ROUTAGE_ZONES['1'] == TRUE ) {
				$w = $w_init + 10 ;
				$h = $h_init + 330 ;
				$buffer.= "^FT{$w},{$h},0^AVR,25,25^FD".'P'."^FS";
			}
			
			if( $_ROUTAGE_ZONES['6'] ) {
				$w = $w_init + 10 ;
				$h = $h_init + 140 ;
				$buffer.= "^FT{$w},{$h},0^AVR,25,25^FD".$_ROUTAGE_ZONES['6']."^FS";
			}
			if( $_ROUTAGE_ZONES['10'] ) {
				$w = $w_init + 10 ;
				$h = $h_init + 5 ;
				$buffer.= "^FT{$w},{$h},0^AVR,25,25^FD".$_ROUTAGE_ZONES['10']."^FS";
			}
			
			if( TRUE ) {
				$w = $w_init - 60 ;
				$h = $h_init + 80 ;
				$buffer.= "^FT{$w},{$h},0^AVR,25,25^FD".$_ROUTAGE_ZONES['2']."^FS";
				$w = $w_init - 110 ;
				$h = $h_init + 80 ;
				$buffer.= "^FT{$w},{$h},0^AUR,25,25^FD".$_ROUTAGE_ZONES['3']."^FS";
				$w = $w_init - 60 ;
				$h = $h_init + 270 ;
				$buffer.= "^FT{$w},{$h},0^AVR,25,25^FD^FD".$_ROUTAGE_ZONES['2a']."^FS";
				$w = $w_init - 110 ;
				$h = $h_init + 280 ;
				$buffer.= "^FT{$w},{$h},0^AUR,25,25^FD^FD".$_ROUTAGE_ZONES['3a']."^FS";
			}
			
			$w = $w_init - 190 ;
			$h = $h_init + 140 ;
			$buffer.= "^FT{$w},{$h},0^AVR,25,25^FD".$_ROUTAGE_ZONES['7']."^FS";
			
			if( $_ROUTAGE_ZONES['4'] ) {
				$w = $w_init - 180 ;
				$h = $h_init + 10 ;
				$buffer.= "^FO{$w},{$h}^GB40,0,40^FS";
				
				$w = $w_init - 180 ;
				$h = $h_init + 380 - 10 - 40 ;
				$buffer.= "^FO{$w},{$h}^GB40,0,40^FS";
			}
			
			
			$w_init = 100 ;
			$h_init = 320 ;
			
			$w = $w_init + 50 ;
			$h = $h_init + 100 ;
			$barcode_print = '>;'.$_ROUTAGE_ZONES['8'] ;
			$buffer.= "^FO{$w},{$h}^BCR,215,N,N^FD{$barcode_print}^FS";
			
			$line_str = '      ' .$_ROUTAGE_ZONES['11'].'  '.$_ROUTAGE_ZONES['9'] ;
			$w = $w_init + 10 ;
			$h = $h_init + 25 ;
			$buffer.= "^FT{$w},{$h},0^ADR^FD".$line_str."^FS";
			
			
			// ********* FIN ZONE DE ROUTAGE ********
			
			//Mentions légales
			$buffer.= "^FO80,30^A0N,20,20^FD"."Soumis aux conditions generales de ventes DPD consultables sur www.dpd.fr."."^FS";
			$buffer.= "^FO80,45^A0N,20,20^FD"."DPD France SAS 18 500 000 euros de capital social Siege social : 9 rue Maurice Mallet "."^FS";
			$buffer.= "^FO80,60^A0N,20,20^FD"."92130 Issy-les-Moulineaux 444 420 830 RCS NANTERRE No TVA : FR 24 444 420 830"."^FS";
			
			//**************************
			
			
			// Logo DPD
			$buffer.= "^FO25,105^XGLOGO.GRF,1,1^FS" ;
			//*********
			
			// Logo PREDIC
			$buffer.= "^FO720,395^XGPREDIC.GRF,1,1^FS" ;
			//*********
			
			
			
			$height_exp = 720 ;
			$width_exp = 500 ;
			$h = $height_exp ;
			$w = $width_exp  ;
			$buffer.= "^FO{$w},{$h}^GB280,480,2,B^FS";
			
			$width_exp = 760 ;			
			$h = $height_exp + 15 ;
			$w = $width_exp - 15 ;
			$buffer.= "^FT{$w},{$h},0^A0R,25,25^FD{$destination['nom']}^FS";
			$w = $width_exp - 40 ;
			$buffer.= "^FT{$w},{$h},0^A0R,25,25^FD{$destination['adr1']}^FS";
			$w = $width_exp - 80 ;
			$buffer.= "^FT{$w},{$h},0^A0R,25,25^FD{$destination['adr2']}^FS";
			$w = $width_exp - 120 ;
			$buffer.= "^FT{$w},{$h},0^A0R,25,25^FD{$destination['adr3']}^FS";
			$w = $width_exp - 160 ;
			$buffer.= "^FT{$w},{$h},0^AUR,25,25^FDF - {$destination['cp']}^FS";
			$w = $width_exp - 200 ;
			if( strlen($destination['ville']) > 17 ) {
				$buffer.= "^FT{$w},{$h},0^ATR,25,25^FD{$destination['ville']}^FS";
			} else {
				$buffer.= "^FT{$w},{$h},0^ATR,25,25^FD{$destination['ville']}^FS";
			}  
			$w = $width_exp - 240 ;
			$buffer.= "^FT{$w},{$h},0^A0R,30,30^FD".'Tel : '.$rowExtended_transferCdePack['cde']['CDE_ATR_CDE_D_TEL'] ."^FS";
			
			$height_exp = 720 ;
			$width_exp = 335 ;
			$h = $height_exp ;
			$w = $width_exp  ;
			$buffer.= "^FO{$w},{$h}^GB160,480,2,B^FS";
			
			
			$width_exp = 475 ;			
			$h = $height_exp + 15 ;
			$w = $width_exp - 15 ;
			
			$soc_code = $rowExtended_transferCdePack['cde']['soc_code'] ;
			$buffer.= "^FT{$w},{$h},0^A0R,25,25^FD".specDbsLam_lib_TMS_getValueStatic( 'SOC_'.$soc_code.'_NOM' )."^FS";
			$w = $width_exp - 40 ;
			$buffer.= "^FT{$w},{$h},0^A0R,25,25^FD".specDbsLam_lib_TMS_getValueStatic( 'WHSE_NOM' )."^FS";
			$w = $width_exp - 65 ;
			$buffer.= "^FT{$w},{$h},0^A0R,25,25^FD".specDbsLam_lib_TMS_getValueStatic( 'WHSE_RUE' )."^FS";
			$w = $width_exp - 90 ;
			$buffer.= "^FT{$w},{$h},0^A0R,25,25^FD".specDbsLam_lib_TMS_getValueStatic( 'WHSE_LOCALITE' )."^FS";
			$w = $width_exp - 115 ;
			$buffer.= "^FT{$w},{$h},0^A0R,25,25^FD".specDbsLam_lib_TMS_getValueStatic( 'WHSE_VILLE' )."^FS";
			
			$width_exp = 220 ;
			$height_exp = 720 ;
			$h = $height_exp ;
			$w = $width_exp  ;
			$buffer.= "^FO{$w},{$h}^GB120,480,2,B^FS";
			
			
			$ref_cde_cli = $rowExtended_transferCdePack['cde']['cde_ref'] ;
			if( !$ref_cde_cli ) {
				$ref_cde_cli = $rowExtended_transferCdePack['cde']['cde_nr'] ;
			}
			$width_exp = 300 ;
			$h = $height_exp + 15 ;
			$w = $width_exp  ;
			$buffer.= "^FT{$w},{$h},0^ADR^FD"."Nb Colis : {$no_carton_exp} / {$tot_carton}"."^FS";
			$w = $width_exp -30 ;
			$buffer.= "^FT{$w},{$h},0^ADR^FD"."Ref : {$ref_cde_cli}"."^FS";
			
			
			$width_exp = 100 ;
			$height_exp = 720 ;
			$h = $height_exp ;
			$w = $width_exp  ;
			$buffer.= "^FO{$w},{$h}^GB120,480,2,B^FS";
			
			$width_exp = 200 ;
			$h = $height_exp + 15 ;
			$w = $width_exp  ;
			$buffer.= "^FT{$w},{$h},0^A0R,25,25^FDNo Cde  : ".$rowExtended_transferCdePack['cde']['cde_nr']."^FS";
			$w = $width_exp - 20 ;
			$buffer.= "^FT{$w},{$h},0^A0R,25,25^FDRef Cli : ".$rowExtended_transferCdePack['cde']['cde_ref']."^FS";
			$w = $width_exp - 40 ;
			$buffer.= "^FT{$w},{$h},0^A0R,25,25^FDCtr Mq  : ".''."^FS";
			$w = $width_exp - 60 ;
			$buffer.= "^FT{$w},{$h},0^A0R,25,25^FDInstruc Liv : ".''."^FS";
			$w = $width_exp - 80 ;
			$buffer.= "^FT{$w},{$h},0^A0R,25,25^FD".''."^FS" ;
		
			
			$barcode_legend = specDbsLam_lib_TMS_DPDG_getBarcodeLegend($pack_id_trspt_id) ;
			$barcode_print = specDbsLam_lib_TMS_DPDG_getBarcodePrint($pack_id_trspt_id) ;
			
			
			$barcode_w = 125 ;
			$barcode_h = 100 ;
			$buffer.= "^BY3,2.5,10^FS" ;
			$buffer.= "^FO{$barcode_w},{$barcode_h}^B2N,170,N,N^FD".$barcode_print."^FS";
			$line_h = $barcode_h ;
			$buffer.= "^FO{$barcode_w},{$line_h}^GB450,0,5^FS";
			$line_h+= 170 ;
			$buffer.= "^FO{$barcode_w},{$line_h}^GB450,0,5^FS";
			
			
			
			$width_exp = 230 ;
			$height_exp = 720 ;
			$h = $height_exp +15;
			$w = $width_exp  ;
			//$buffer.= "^FT{$w},{$h},0^ASR^FDEXA PASS : ".$barcode_print."^FS";
			$w = 120 ;
			$h = 350 ;
			$buffer.= "^FT{$w},{$h},0^ASN^FD".$barcode_legend."^FS";
			
			// Barcode de mise en livraison
			$str = substr($destination['nom'],0,12) ;
			$barcode_w = 150 ;
			$barcode_h = 1200 ;
			$buffer.= "^BY3,2.5,10^FS" ;
			$buffer.= "^FO{$barcode_w},{$barcode_h}^BCN,30,N,N^FD".$str."^FS";
			
			
		return $buffer ;
	}
	
	function specDbsLam_lib_TMS_DPDG_getBarcodeLegend( $pack_id_trspt_id ) {
		$barcode_base = substr($pack_id_trspt_id,0,15) ;
	
		$eansum = 0 ;
		for( $i=0 ; $i<strlen($barcode_base) ; $i++ )
		{
			$mchar = $barcode_base[$i] ;
			if( $i % 2 == 0 )
				$eansum += $mchar * 3;
			else
				$eansum += $mchar * 1 ;
		}
		$dizsup = ceil($eansum/10) * 10 ;
		$cle = $dizsup - $eansum ;
		
		$barcode_legend= substr($barcode_base,3).$cle ;
		
		return $barcode_legend ;
	}
	function specDbsLam_lib_TMS_DPDG_getBarcodePrint( $pack_id_trspt_id ) {
		return $pack_id_trspt_id ;
	}
	function specDbsLam_lib_TMS_DPDG_getRowPlan2( $id_agence, $code_pays, $code_postal ) {
		global $_opDB ;
		
		$query = "SELECT * FROM op5tms_lib_trspt.trspt_exap_plan2 WHERE ISO='$code_pays' 
					AND ( ('$code_postal' BETWEEN CPDEB AND CPFIN) OR CPDEB='' )" ;
		$result = $_opDB->query($query) ;
		$plan2_row = NULL ;
		while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
			$identifiants = explode(',',$arr['IDENTIFIANT']) ;
			if( in_array($id_agence,$identifiants) ) {
				$plan2_row = $arr ;
				break ;
			}
			if( in_array('',$identifiants) ) {
				$plan2_default = $arr ;
			}
		}
		if( !$plan2_row ) {
			$plan2_row = $plan2_default ;
		}
		if( !$plan2_row ) {
			return array() ;
		}
		
		return $plan2_row ;
	}
	
	
	
	
	function specDbsLam_lib_TMS_DPDG_getEdiPosition( $rowExtended_transferCdePack,$pack_id_trspt_id ) {
		global $_opDB ;
		
		$timestamp = time() ;
		
		$arr_zone_length = array();
		
		$arr_zone_length['H_1'] = 18 ;
		$arr_zone_length['H_2'] = 9 ;
		$arr_zone_length['H_3'] = 35 ;
		$arr_zone_length['H_4'] = 35 ;
		$arr_zone_length['H_5'] = 35 ;
		$arr_zone_length['H_6'] = 15 ;
		$arr_zone_length['H_7'] = 12 ;
		$arr_zone_length['H_8'] = 10 ;
		$arr_zone_length['H_9'] = 8 ;
		$arr_zone_length['H_10'] = 6 ;
		$arr_zone_length['H_11'] = 3 ;
		$arr_zone_length['H_12'] = 3 ;
		$arr_zone_length['H_13'] = 9 ;
		
		$arr_zone_length['D_14'] = 35 ;
		$arr_zone_length['D_15'] = 35 ;
		$arr_zone_length['D_16'] = 35 ;
		$arr_zone_length['D_17'] = 35 ;
		$arr_zone_length['D_18'] = 35 ;
		$arr_zone_length['D_19'] = 35 ;
		$arr_zone_length['D_20'] = 35 ;
		$arr_zone_length['D_21'] = 10 ;
		$arr_zone_length['D_22'] = 35 ;
		$arr_zone_length['D_23'] = 3 ;
		$arr_zone_length['D_24'] = 30 ;
		
		$arr_zone_length['E_25'] = 35 ;
		$arr_zone_length['E_26'] = 35 ;
		$arr_zone_length['E_27'] = 35 ;
		$arr_zone_length['E_28'] = 35 ;
		$arr_zone_length['E_29'] = 35 ;
		$arr_zone_length['E_30'] = 10 ;
		$arr_zone_length['E_31'] = 35 ;
		$arr_zone_length['E_32'] = 2 ;
		$arr_zone_length['E_33'] = 30 ;
		
		$arr_zone_length['S_34'] = 80 ;
		$arr_zone_length['S_35'] = 35 ;
		$arr_zone_length['S_36'] = 80 ;
		$arr_zone_length['S_37'] = 35 ;
		$arr_zone_length['S_38'] = 3 ;
		$arr_zone_length['S_39'] = 6 ;
		$arr_zone_length['S_40'] = 3 ;
		$arr_zone_length['S_41'] = 3 ;
		$arr_zone_length['S_42'] = 3 ;
		$arr_zone_length['S_43'] = 6 ;
		$arr_zone_length['S_44'] = 30 ;
		$arr_zone_length['S_45'] = 20 ;
		$arr_zone_length['S_46'] = 20 ;
		$arr_zone_length['S_47'] = 50 ;
		$arr_zone_length['S_48'] = 40 ;
		$arr_zone_length['S_49'] = 40 ;
		$arr_zone_length['S_50'] = 40 ;
		$arr_zone_length['S_51'] = 5 ;
		$arr_zone_length['S_52'] = 30 ;
		$arr_zone_length['S_53'] = 2 ;
		$arr_zone_length['S_54'] = 20 ;
		$arr_zone_length['S_55'] = 3 ;
		$arr_zone_length['S_56'] = 35 ;
		$arr_zone_length['S_57'] = 10 ;
		$arr_zone_length['S_58'] = 10 ;
		$arr_zone_length['S_59'] = 10 ;
		$arr_zone_length['S_60'] = 35 ;
		$arr_zone_length['S_61'] = 35 ;
		$arr_zone_length['S_62'] = 35 ;
		$arr_zone_length['S_63'] = 35 ;
		$arr_zone_length['S_64'] = 3 ;
		
		
		$soc_code = $rowExtended_transferCdePack['cde']['soc_code'] ;
		$key_trspt = 'DPDG_'.$soc_code.'_TRSPT' ;
		$id_trspt = specDbsLam_lib_TMS_getValueStatic( $key_trspt ) ;
		$id_trspt_constante = substr($id_trspt,0,3) ;
		$id_trspt_agence = substr($id_trspt,3,3) ;
				
		$soc_code = $rowExtended_transferCdePack['cde']['soc_code'] ;
		$key_chargeur = 'DPDG_'.$soc_code.'_CHARGEUR' ;
		$id_chargeur = specDbsLam_lib_TMS_getValueStatic( $key_chargeur ) ;
				
		$row_plan2 = specDbsLam_lib_TMS_DPDG_getRowPlan2( $id_trspt_agence, $rowExtended_transferCdePack['cde']['adr_country'], $rowExtended_transferCdePack['cde']['adr_cp'] ) ;
		
		$poids_kg = $rowExtended_transferCdePack['calc_vl_kg'] ;
		
		$barcode_print = specDbsLam_lib_TMS_DPDG_getBarcodePrint($pack_id_trspt_id) ;
							
			$adr_full = trim($rowExtended_transferCdePack['cde']['adr_full']) ;
			$arr_adr = explode("\n",$adr_full) ;
			array_pop($arr_adr) ;
			$last_lig = array_pop($arr_adr) ;
			$ttmp = explode(' ',$last_lig,2) ;
			$destination['nom'] = trim($arr_adr[0]);
			$destination['adr1'] = substr(trim($arr_adr[1]), 0,35 );
			$destination['adr2'] = substr(trim($arr_adr[2]), 0,35 );
			$destination['cp'] = $rowExtended_transferCdePack['cde']['adr_cp'] ;
			$destination['ville'] = substr($ttmp[1], 0,35 );
			
						
						// *****************************
						$arr_data = array() ;
						$arr_data['H_1'] = $barcode_print ;
						$arr_data['H_2'] = str_pad( number_format($poids_kg, 2, '.', ''), 9, '0', STR_PAD_LEFT );
						$arr_data['H_3'] = $rowExtended_transferCdePack['cde']['cde_nr'] ;
						$arr_data['H_5'] = $rowExtended_transferCdePack['cde']['cde_ref'] ;
						$arr_data['H_7'] = specDbsLam_lib_TMS_getValueStatic( 'SOC_'.$soc_code.'_NOM' ) ;
						$arr_data['H_8'] = date('d.m.Y',$timestamp) ;
						$arr_data['H_9'] = date('H:i:s',$timestamp) ;
						$arr_data['H_10'] = $id_trspt ;
						$arr_data['H_11'] = $row_plan2['AC'] ;
						$arr_data['H_12'] = $row_plan2['TOUR'] ;
						$arr_data['D_14'] = $destination['nom'] ;
						$arr_data['D_15'] = $destination['adr1'] ;
						$arr_data['D_16'] = $destination['adr2'] ;
						$arr_data['D_21'] = $destination['cp'] ;
						$arr_data['D_22'] = $destination['ville'] ;
						$arr_data['D_23'] = $row_plan2['LPFX'] ;
						$arr_data['E_25'] = specDbsLam_lib_TMS_getValueStatic( 'SOC_'.$soc_code.'_NOM' ) ;
						$arr_data['E_26'] = specDbsLam_lib_TMS_getValueStatic( 'WHSE_RUE' ) ;
						$arr_data['E_27'] = specDbsLam_lib_TMS_getValueStatic( 'WHSE_LOCALITE' ) ;
						$arr_data['E_30'] = substr(specDbsLam_lib_TMS_getValueStatic( 'WHSE_VILLE' ),0,5) ;
						$arr_data['E_31'] = substr(specDbsLam_lib_TMS_getValueStatic( 'WHSE_VILLE' ),6) ;
						$arr_data['E_32'] = 'FR' ;
						$arr_data['S_36'] = $rowExtended_transferCdePack['cde']['field_ATR_CDE_D_EMAIL'] ;
						$arr_data['S_37'] = $rowExtended_transferCdePack['cde']['CDE_ATR_CDE_D_TEL'] ;
						$arr_data['S_42'] = '003' ;
						$arr_data['S_43'] = str_pad($id_chargeur, 6, '0', STR_PAD_LEFT) ;
						$arr_data['S_54'] = specDbsLam_lib_TMS_getValueStatic( 'SOC_'.$soc_code.'_NOM' ) ;
		
						$arr_str = array() ;
						foreach( $arr_zone_length as $code_zone => $length ) {
							$val = '' ;
							if( isset($arr_data[$code_zone]) ) {
								$val = $arr_data[$code_zone] ;
							}
							if( strlen($val) > $length ) {
								$val = substr($val,0,$length) ;
							}
							$arr_str[] = str_replace('|','',$val) ;
						}
						$lig = implode('|',$arr_str) ;
						
		return $lig."\r\n" ;
	}



function specDbsLam_lib_TMS_UPS_getElements( $rowExtended_transferCdePack, $do_force=FALSE ) {
	if( $do_force ) {
		specDbsLam_lib_TMS_UPS_doRequest($rowExtended_transferCdePack) ;
	}
	
	global $_opDB ;
	
	$transfercdepack_filerecordId = $rowExtended_transferCdePack['transfercdepack_filerecord_id'] ;
	$query = "SELECT filerecord_id FROM view_file_TMS_STORE
				WHERE field_FILE_TRSFRCDEPACK_ID='{$transfercdepack_filerecordId}' AND field_STORE_PEER='UPS_API' AND field_STORE_TAG='response'
				ORDER BY filerecord_id DESC LIMIT 1" ;
	$response_filerecordId = $_opDB->query_uniqueValue( $query ) ;
	if( !$response_filerecordId && !$do_force ) {
		return specDbsLam_lib_TMS_UPS_getElements($rowExtended_transferCdePack,TRUE) ;
	}
	
	$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
	$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;
	media_contextOpen( $_sdomain_id ) ;
	$json = media_bin_getBinary(media_bin_toolFile_getId('TMS_STORE',$response_filerecordId)) ;
	media_contextClose() ;
	if( !$json || !($json_obj=json_decode($json,true)) ) {
		return NULL ;
	}
	
	$elements = array();
	$elements['tracking_id'] = $json_obj['ShipmentResponse']['ShipmentResults']['PackageResults']['TrackingNumber'] ;
	$elements['label_zpl'] = base64_decode($json_obj['ShipmentResponse']['ShipmentResults']['PackageResults']['ShippingLabel']['GraphicImage']) ;
	
	$label_zpl_part = $elements['label_zpl'] ;
	$label_zpl_part = str_replace('^XA','',$label_zpl_part) ;
	$label_zpl_part = str_replace('^XZ','',$label_zpl_part) ;
	$elements['label_zpl_part'] = $label_zpl_part ;
	
	return $elements ;
}

function specDbsLam_lib_TMS_UPS_doRequest( $rowExtended_transferCdePack ) {
	setlocale(LC_ALL,'en_US.UTF-8');
	
	
	// Pack variables
	$soc_code = $rowExtended_transferCdePack['cde']['soc_code'] ;
	
	// UPS constantes
	$key_upsUrlProd = 'UPS_URL_PROD' ;
	$key_upsUrlDev = 'UPS_URL_DEV' ;
	
	// UPS variables
	$key_upsAccId = 'UPS_'.$soc_code.'_ACC_ID' ;
	$key_upsAccPw = 'UPS_'.$soc_code.'_ACC_PW' ;
	$key_upsKey = 'UPS_'.$soc_code.'_KEY' ;
	$key_upsAccount = 'UPS_'.$soc_code.'_ACCOUNT' ;

	// shipper
	$shipper['nom'] = specDbsLam_lib_TMS_getValueStatic( 'SOC_'.$soc_code.'_NOM' );
	$shipper['adr1'] = specDbsLam_lib_TMS_getValueStatic( 'WHSE_RUE' );
	$shipper['adr2'] = specDbsLam_lib_TMS_getValueStatic( 'WHSE_NOM' );
	$shipper['cp'] = substr(specDbsLam_lib_TMS_getValueStatic( 'WHSE_VILLE' ),0,5) ;
	$shipper['ville'] = substr(specDbsLam_lib_TMS_getValueStatic( 'WHSE_VILLE' ),6);
	$shipper['tel'] = specDbsLam_lib_TMS_getValueStatic( 'WHSE_TEL' );
	foreach( $shipper as &$str ) {
		$str=iconv('UTF-8','ASCII//TRANSLIT',$str);
	}
	unset($str) ;

	// deliv adr
	$adr_full = trim($rowExtended_transferCdePack['cde']['adr_full']) ;
	$arr_adr = explode("\n",$adr_full) ;
	array_pop($arr_adr) ;
	$last_lig = array_pop($arr_adr) ;
	$ttmp = explode(' ',$last_lig,2) ;
	$destination['nom'] = trim($arr_adr[0]);
	$destination['adr1'] = substr(trim($arr_adr[1]), 0,35 );
	$destination['adr2'] = substr(trim($arr_adr[2]), 0,35 );
	$destination['cp'] = $rowExtended_transferCdePack['cde']['adr_cp'] ;
	$destination['ville'] = substr($ttmp[1], 0,35 );
	foreach( $destination as &$str ) {
		$str=iconv('UTF-8','ASCII//TRANSLIT',$str);
	}
	unset($str) ;
	
	
	$json_request = array(
		'UPSSecurity' => array(
			'UsernameToken' => array(
				'Username' => specDbsLam_lib_TMS_getValueStatic($key_upsAccId),
				'Password' => specDbsLam_lib_TMS_getValueStatic($key_upsAccPw)
			),
			'ServiceAccessToken' => array(
				'AccessLicenseNumber' => specDbsLam_lib_TMS_getValueStatic($key_upsKey)
			)
		),
		
		'ShipmentRequest' => array(
			'Request' => array(
				"RequestOption" => 'validate',
				"TransactionReference" => array(
					"CustomerContext" => $rowExtended_transferCdePack['id_nocolis']
				)
			),
			
			"Shipment" => array(
				"Shipper" => array(
					"Name" => $shipper['nom'],
					"ShipperNumber" => specDbsLam_lib_TMS_getValueStatic($key_upsAccount),
                                        "Phone" => array(
                                                "Number" => $shipper['tel']
                                        ),
					"Address" => array(
						"AddressLine" => array($shipper['adr1'],$shipper['adr2']),
						"City" => $shipper['ville'],
						//"StateProvinceCode" => "StateProvinceCode",
						"PostalCode" => $shipper['cp'],
						"CountryCode" => 'FR'
					)
				),
				"ShipTo" => array(
					"Name" => $destination['nom'],
					//"AttentionName" => "Ship To Attn Name",
					"EMailAddress" => $rowExtended_transferCdePack['cde']['CDE_ATR_CDE_D_EMAIL'],
					"Phone" => array(
						"Number" => $rowExtended_transferCdePack['cde']['CDE_ATR_CDE_D_TEL']
					),
					"Address" => array(
						"AddressLine" => array($destination['adr1'],$destination['adr2']),
						"City" => $destination['ville'],
						//"StateProvinceCode" => "StateProvinceCode",
						"PostalCode" => $rowExtended_transferCdePack['cde']['adr_cp'],
						"CountryCode" => $rowExtended_transferCdePack['cde']['adr_country']
					)
				),
				/*
				"ShipFrom" => array(
				
				),
				*/
				"PaymentInformation" => array(
					"ShipmentCharge" => array(
						"Type" => "01",
						"BillShipper" => array(
							"AccountNumber" => specDbsLam_lib_TMS_getValueStatic($key_upsAccount)
						)
					)
				),
				"Service" => array(
					"Code" => "11",
					"Description" => "UPS Standard"
				),
				"ShipmentRatingOptions" => array(
					"NegotiatedRatesIndicator" => "0"
				),
				
				"Package" => array(
					"Packaging" => array(
						"Code" => "02",
						"Description" => "Customer Supplied Package"
					),
					/*"Dimensions" => array(
						"UnitOfMeasurement" => array(
							"Code" => "IN",
							"Description" => "Inches"
						),
						"Length" => "7",
						"Width" => "5",
						"Height" => "2"
					),*/
					"PackageWeight" => array(
						"UnitOfMeasurement" => array(
							"Code" => "KGS"
						),
						"Weight" => (string)$rowExtended_transferCdePack['calc_vl_kg']
					)
				)
			),
			"LabelSpecification" => array(
				"LabelImageFormat" => array(
					"Code" => "ZPL"
				),
				"LabelStockSize" => array(
					"Height" => "6",
					"Width" => "4"
				)
				//"HTTPUserAgent" => "Mozilla/4.5"
			)
		)
	);
	//HACK
	if( $json_request['ShipmentRequest']['Shipment']['ShipTo']['Address']['CountryCode']!='FR' ) {
		$json_request['ShipmentRequest']['Shipment']['ShipTo']['AttentionName'] = $json_request['ShipmentRequest']['Shipment']['ShipTo']['Name'] ;
		$json_request['ShipmentRequest']['Shipment']['Shipper']['AttentionName'] = $json_request['ShipmentRequest']['Shipment']['Shipper']['Name'] ;
	}
	
	
	
	$json_txt = json_encode($json_request,JSON_PRETTY_PRINT) ;
	
	$arr_ins = array() ;
	$arr_ins['field_FILE_TRSFRCDEPACK_ID'] = $rowExtended_transferCdePack['transfercdepack_filerecord_id'] ;
	$arr_ins['field_STORE_PEER'] = 'UPS_API' ;
	$arr_ins['field_STORE_DATE'] = date('Y-m-d H:i:s') ;
	$arr_ins['field_STORE_TAG'] = 'request' ;
	$request_filerecordId = paracrm_lib_data_insertRecord_file('TMS_STORE',0,$arr_ins) ;
	
	$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
	$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;
	media_contextOpen( $_sdomain_id ) ;
	$tmp_media_id = media_bin_processBuffer( $json_txt ) ;
	media_bin_move( $tmp_media_id , media_bin_toolFile_getId('TMS_STORE',$request_filerecordId) ) ;
	media_contextClose() ;
	
	
	
	// Construction de l'URL
	$post_url = specDbsLam_lib_TMS_getValueStatic($key_upsUrlProd) ;
	if( $GLOBALS['__OPTIMA_TEST'] ) {
		$post_url = specDbsLam_lib_TMS_getValueStatic($key_upsUrlDev) ;
	}
	
	$params = array('http' => array(
	'method' => 'POST',
	'content' => json_encode($json_request),
	'timeout' => 600
	));
	$ctx = stream_context_create($params);
	$fp = @fopen($post_url, 'rb', false, $ctx);
	if( !$fp ) {
		return FALSE ;
	}
	
	$response = stream_get_contents($fp) ;
	$json_txt = json_encode(json_decode($response,true),JSON_PRETTY_PRINT) ;
	
	$json_obj = json_decode($response,true) ;
	$tag = 'response_NOK' ;
	if( $json_obj['ShipmentResponse']['ShipmentResults']['PackageResults']['TrackingNumber'] ) {
		$tag = 'response' ;
	}
	
	$arr_ins = array() ;
	$arr_ins['field_FILE_TRSFRCDEPACK_ID'] = $rowExtended_transferCdePack['transfercdepack_filerecord_id'] ;
	$arr_ins['field_STORE_PEER'] = 'UPS_API' ;
	$arr_ins['field_STORE_DATE'] = date('Y-m-d H:i:s') ;
	$arr_ins['field_STORE_TAG'] = $tag ;
	$response_filerecordId = paracrm_lib_data_insertRecord_file('TMS_STORE',0,$arr_ins) ;
	
	$_domain_id = DatabaseMgr_Base::dbCurrent_getDomainId() ;
	$_sdomain_id = DatabaseMgr_Sdomain::dbCurrent_getSdomainId() ;
	media_contextOpen( $_sdomain_id ) ;
	$tmp_media_id = media_bin_processBuffer( $json_txt ) ;
	media_bin_move( $tmp_media_id , media_bin_toolFile_getId('TMS_STORE',$response_filerecordId) ) ;
	media_contextClose() ;
	
	return TRUE ;
}



function specDbsLam_lib_TMS_MRP_getZplBuffer( $rowExtended_transferCdePack ) {
	$buffer = '' ;
	$shipping_ref = '167'.'-'.$rowExtended_transferCdePack['cde']['cde_ref'] ;
	
	$w_data = 100 ;
	$h = 150 ;
	
	$buffer.= "^FO{$w_data},{$h}^AUN^FD"."Shipping Ref"."^FS";
	$h += 75 ;
	$buffer.= "^FO{$w_data},{$h}^AVN^FD".$shipping_ref."^FS";
	$h += 150 ;
	
	$buffer.= "^FO{$w_data},{$h}^AUN^FD"."Customer Name"."^FS";
	$h += 75 ;
	$buffer.= "^FO{$w_data},{$h}^AVN^FD".$rowExtended_transferCdePack['cde']['adr_name']."^FS";
	$h += 150 ;
	
	$buffer.= "^FO{$w_data},{$h}^AUN^FD"."Postcode"."^FS";
	$h += 75 ;
	$buffer.= "^FO{$w_data},{$h}^AVN^FD".$rowExtended_transferCdePack['cde']['adr_country'].' - '.$rowExtended_transferCdePack['cde']['adr_cp']."^FS";
	$h += 150 ;
	
	$h += 75 ;
	$buffer.= "^FO{$w_data},{$h}^BCN,100,Y,N,N^FD{$shipping_ref}^FS" ;
	$h += 150 ;
	
	
	
	
	
	
	return $buffer ;
}

function specDbsLam_lib_TMS_GAC_getZplBuffer( $rowExtended_transferCdePack ) {
	$buffer = '' ;
	
	$w_data = 100 ;
	$h = 250 ;
	
	$buffer.= "^FO{$w_data},{$h}^AUN^FD"."Customer Name"."^FS";
	$h += 75 ;
	$buffer.= "^FO{$w_data},{$h}^AVN^FD".$rowExtended_transferCdePack['cde']['adr_name']."^FS";
	$h += 150 ;
	
	$buffer.= "^FO{$w_data},{$h}^AUN^FD"."Postcode"."^FS";
	$h += 75 ;
	$buffer.= "^FO{$w_data},{$h}^AVN^FD".$rowExtended_transferCdePack['cde']['adr_country'].' - '.$rowExtended_transferCdePack['cde']['adr_cp']."^FS";
	$h += 150 ;
	
	$buffer.= "^FO{$w_data},{$h}^AUN^FD"."Order Number"."^FS";
	$h += 75 ;
	$buffer.= "^FO{$w_data},{$h}^AVN^FD".$rowExtended_transferCdePack['cde']['cde_ref']."^FS";
	$h += 150 ;
	
	return $buffer ;
}

function specDbsLam_lib_TMS_AGD_getId( $rowExtended_transferCdePack ) {
	$ttmp = explode(' ',specDbsLam_lib_TMS_getValueStatic( 'WHSE_VILLE' )) ;
	$whse_cp = $ttmp[0] ;
	
	$barcode = '' ;
	$barcode.= '1141' ;
	$barcode.= '01264' ;
	$barcode.= $whse_cp.str_pad( (string)$rowExtended_transferCdePack['cde']['cde_filerecord_id'], 16-strlen($whse_cp), '0', STR_PAD_LEFT ) ;
	$barcode.= str_pad($rowExtended_transferCdePack['calc_folio_idx'],3,'0',STR_PAD_LEFT) ;
	
	return $barcode ;
}
function specDbsLam_lib_TMS_AGD_getPlanRow( $rowExtended_transferCdePack ) {
	global $_opDB ;
	
	$cp = $rowExtended_transferCdePack['cde']['adr_cp'] ;
	if( strlen($cp)<5 ) {
		$cp = str_pad( $cp, 5, '0', STR_PAD_LEFT ) ;
	}
	
	$query = "select * from trspt_agd_plan where DEPT <= '{$cp}' ORDER BY DEPT DESC LIMIT 1" ;
	$result = $_opDB->query($query) ;
	$arr = $_opDB->fetch_assoc($result) ;
	return $arr ;
}
function specDbsLam_lib_TMS_AGD_getZplBuffer( $rowExtended_transferCdePack,$pack_id_trspt_id ) {
	$soc_code = $rowExtended_transferCdePack['cde']['soc_code'] ;
	
	$adr_full = trim($rowExtended_transferCdePack['cde']['adr_full']) ;
	$arr_adr = explode("\n",$adr_full) ;
	array_pop($arr_adr) ;
	$last_lig = array_pop($arr_adr) ;
	$ttmp = explode(' ',$last_lig,2) ;
	$destination['nom'] = trim($arr_adr[0]);
	$destination['adr1'] = substr(trim($arr_adr[1]), 0,35 );
	$destination['adr2'] = substr(trim($arr_adr[2]), 0,35 );
	$destination['cp'] = $rowExtended_transferCdePack['cde']['adr_cp'] ;
	$destination['ville'] = substr($ttmp[1], 0,35 );
	foreach( $destination as &$str ) {
		$str=iconv('UTF-8','ASCII//TRANSLIT',$str);
	}
	unset($str) ;
	
	$agdPlan_row = specDbsLam_lib_TMS_AGD_getPlanRow($rowExtended_transferCdePack) ;
	if( !$agdPlan_row ) {
		return NULL ;
	}
	
	
	
	
	$print_no_bl = $whse_cp.str_pad( (string)$rowExtended_transferCdePack['cde']['cde_filerecord_id'], 16-strlen($whse_cp), '0', STR_PAD_LEFT ) ;
	$print_no_cde = $rowExtended_transferCdePack['cde']['cde_ref'] ;
	
	
	
	
	
	//print_r($rowExtended_transferCdePack) ;
	
	$mvt_lig = reset($rowExtended_transferCdePack['ligs']) ;
	$stk_prod = $mvt_lig['stk_prod'] ;
	$print_prod = $stk_prod ;
	if( strpos($print_prod,$mvt_lig['soc_code'].'_')===0 ) {
		$print_prod = substr($print_prod,strlen($mvt_lig['soc_code'])+1) ;
	}
	
	$map_prodId_prodTxt = array() ;
	foreach( $rowExtended_transferCdePack['cde']['ligs'] as $cde_lig ) {
		$map_prodId_prodTxt[$cde_lig['stk_prod']] = $cde_lig['stk_prod_txt'] ;
	}
	$print_prodTxt = $map_prodId_prodTxt[$stk_prod] ;
	
	$print_date = date('d/m/Y') ;

	
	
	
	$print_routage = $rowExtended_transferCdePack['cde']['adr_country'].' '.'441' ;
	
	
	
	
	
	
	
	
	$h = 125 ;
	
	$h_block = 200 ;
	$zebra_buffer.= "^FO50,{$h}^GB350,{$h_block},2^FS";
	$zebra_buffer.= "^FO398,{$h}^GB350,{$h_block},2^FS";
	$zebra_buffer.= "^FO630,{$h}^GB0,{$h_block},2^FS";
		
		
		$legend_w = 60 ;
		$legend_h = $h+20 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^APN^FD".'EXPEDITEUR'."^FS";
		
		$legend_h+=35 ;
		
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^AQN^FD".specDbsLam_lib_TMS_getValueStatic( 'SOC_'.$soc_code.'_NOM' )."^FS";
		$legend_h+=22 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^AQN^FD".specDbsLam_lib_TMS_getValueStatic( 'WHSE_NOM' )."^FS";
		$legend_h+=22 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^AQN^FD".specDbsLam_lib_TMS_getValueStatic( 'WHSE_RUE' )."^FS";
		$legend_h+=22 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^AQN^FD".specDbsLam_lib_TMS_getValueStatic( 'WHSE_LOCALITE' )."^FS";
		$legend_h+=22 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^AQN^FD".specDbsLam_lib_TMS_getValueStatic( 'WHSE_VILLE' )."^FS";
		
		
		
	
		$legend_w = 410 ;
		$legend_h = $h+20 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^APN^FD".'LIVRAISON PLATEFORME'."^FS";
		
		$legend_h+=35 ;
		
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^AQN^FD".specDbsLam_lib_TMS_getValueStatic( 'SOC_'.$soc_code.'_NOM' )."^FS";
		$legend_h+=22 ;
		
		
		
		
		$legend_w = 640 ;
		$legend_h = $h+20 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^APN^FD".'ACTIVITE'."^FS";
		
		$legend_w = 640 ;
		$legend_h = $h+60 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^AUN^FD".'ABC'."^FS";
		
	
	$h+= $h_block ;
	
	
	$h_block = 200 ;
	$zebra_buffer.= "^FO50,{$h}^GB350,{$h_block},2^FS";
	$zebra_buffer.= "^FO398,{$h}^GB350,{$h_block},2^FS";
	
	
		$legend_w = 60 ;
		$legend_h = $h+60 ;
		
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^APN^FD".'Date'."^FS";
		$legend_h+=35 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^APN^FD".'Article'."^FS";
		$legend_h+=35 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^APN^FD".'Desc.'."^FS";
		
		$legend_w = 120 ;
		$legend_h = $h+56 ;
		
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^AQN^FD".$print_date."^FS";
		$legend_h+=35 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^AQN^FD".$print_prod."^FS";
		$legend_h+=35 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^APN^FD".substr($print_prodTxt,0,35)."^FS";
		
		
		
		
		
		
		$legend_w = 410 ;
		$legend_h = $h+20 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^APN^FD".'DESTINATAIRE FINAL'."^FS";
		
		$legend_h+=30 ;
		
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^AQN^FD".$destination['nom']."^FS";
		$legend_h+=22 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^AQN^FD".$destination['adr1']."^FS";
		$legend_h+=22 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^AQN^FD".$destination['adr2']."^FS";
		$legend_h+=22 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^AQN^FD".$destination['cp'].' '.$destination['ville']."^FS";
		$legend_h+=25 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^ARN^FD".$rowExtended_transferCdePack['cde']['CDE_ATR_CDE_D_TEL']."^FS";
		
	
	$h+= $h_block ;
	
	
	
	
	
	$h_block = 350 ;
	$zebra_buffer.= "^FO50,{$h}^GB350,{$h_block},2^FS";
	$zebra_buffer.= "^FO398,{$h}^GB350,{$h_block},2^FS";
	
	
		$legend_w = 60 ;
		$legend_h = $h+60 ;
		
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^APN^FD".'No BL'."^FS";
		$legend_h+=35 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^APN^FD".'No Commande'."^FS";
		$legend_h+=70 ;
		$legend_w = 90 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^APN^FD".'No de colis / Nb total de colis.'."^FS";
		
		$legend_w = 190 ;
		$legend_h = $h+56 ;
		
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^AQN^FD".$print_no_bl."^FS";
		$legend_h+=35 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^AQN^FD".$print_no_cde."^FS";
		$legend_h+=120 ;
		$legend_w = 145 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^AUN^FD".$rowExtended_transferCdePack['calc_folio_idx'].' / '.$rowExtended_transferCdePack['calc_folio_sum']."^FS";
		
	
	
	
		$legend_w = 450 ;
		$legend_h = $h+100 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^AVN^FD".$print_routage."^FS";
	
	
	
	
	
	
	$h+= $h_block ;
	
	
	
	
	
	$h_block = 200 ;
	$zebra_buffer.= "^FO50,{$h}^GB700,{$h_block},2^FS";
	
		$barcode_print = '>;'.$pack_id_trspt_id ;
		$legend_w = 120 ;
		$legend_h = $h+40 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h}^BY3^BCN,100,Y,N^FD".$barcode_print."^FS";
	
	$h+= $h_block ;
	
		
	
	
	
	
	
	return $zebra_buffer ;
	
	$zebra_buffer.= "^FO50,{$h}^GB200,200,2^FS";
	$zebra_buffer.= "^FO250,{$h}^GB500,200,2^FS";
	
		$legend_w = 60 ;
		$legend_h = $h+20 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^ARN^FD".'PartNumber'."^FS";
		
		$legend_w = 290 ;
		$legend_h = $h+30 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h}^BY2^BCN,100,Y,N^FD".$prod_txt."^FS";
	
	$h+= 200 ;
	
	$zebra_buffer.= "^FO50,{$h}^GB200,150,2^FS";
	$zebra_buffer.= "^FO250,{$h}^GB500,150,2^FS";
	
		$legend_w = 60 ;
		$legend_h = $h+20 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^ARN^FD".'Description'."^FS";
	
	
		$legend_w = 290 ;
		$legend_h = $h+20 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^ASN^FD".$arr_prod['entry_key']."^FS";
		$legend_h = $h+70 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^ARN^FD".$arr_prod['field_PROD_TXT']."^FS";
	
	$h+= 150 ;
	
	$zebra_buffer.= "^FO50,{$h}^GB200,100,2^FS";
	$zebra_buffer.= "^FO250,{$h}^GB500,100,2^FS";
	
	if( $soc_row['prodspec_is_batch'] ) {
		$legend_w = 60 ;
		$legend_h = $h+20 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^ARN^FD".'Batch code'."^FS";
	
		$legend_w = 290 ;
		$legend_h = $h+20 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^ATN^FD".strtoupper($arr_stk['field_SPEC_BATCH'])."^FS";
	}
	$h+= 100 ;
	
	$zebra_buffer.= "^FO50,{$h}^GB200,100,2^FS";
	$zebra_buffer.= "^FO250,{$h}^GB500,100,2^FS";
	
		$legend_w = 60 ;
		$legend_h = $h+20 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^ARN^FD".'Quantity'."^FS";
	
		$legend_w = 290 ;
		$legend_h = $h+20 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^ATN^FD".(float)($arr_stk['field_QTY_IN']+$arr_stk['field_QTY_AVAIL']+$arr_stk['field_QTY_OUT'])."^FS";
		
	$h+= 100 ;
	
	$zebra_buffer.= "^FO50,{$h}^GB200,250,2^FS";
	$zebra_buffer.= "^FO250,{$h}^GB500,250,2^FS";
	
		$legend_w = 60 ;
		$legend_h = $h+20 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^ARN^FD".'Position'."^FS";
	
		$legend_w = 290 ;
		$legend_h = $h+30 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h},0^AUN^FD".$arr_stk['field_ADR_ID']."^FS";
		$legend_h = $h+120 ;
		$zebra_buffer.= "^FO{$legend_w},{$legend_h}^BY2^BCN,80,Y,N^FD".$arr_stk['field_ADR_ID']."^FS";
		
	$h+= 200 ;


	return $zebra_buffer ;
}

?>
