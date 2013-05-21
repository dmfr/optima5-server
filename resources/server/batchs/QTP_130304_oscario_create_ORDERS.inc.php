<?php
function create_ORDERS_from_crmFile( $filerecord_id ) {
	global $_opDB ;
	
	$query = "SELECT * FROM view_file_CDE_SAISIE WHERE filerecord_id='{$filerecord_id}'" ;
	$result = $_opDB->query($query) ;
	$file_CDE_SAISIE = $_opDB->fetch_assoc($result) ;
	//print_r($file_CDE_SAISIE) ;
	$query = "SELECT * FROM view_bible_CDESAISIE_entry WHERE entry_key='{$file_CDE_SAISIE['field_CDE_TYPE']}'" ;
	$result = $_opDB->query($query) ;
	$bible_CDESAISIE_entry = $_opDB->fetch_assoc($result) ;
	//print_r($bible_CDESAISIE_entry) ;
	$query = "SELECT * FROM view_bible_STORE_entry WHERE entry_key='{$file_CDE_SAISIE['field_CDE_STORE']}'" ;
	$result = $_opDB->query($query) ;
	$bible_STORE_entry = $_opDB->fetch_assoc($result) ;
	//print_r($bible_STORE_entry) ;
	$query = "SELECT * FROM view_file_STORE_ADRBOOK WHERE field_STORE='{$file_CDE_SAISIE['field_CDE_STORE']}'" ;
	$result = $_opDB->query($query) ;
	$file_STORE_ADRBOOK = $_opDB->fetch_assoc($result) ;
	//print_r($file_STORE_ADRBOOK) ;
	$query = "SELECT * FROM view_file_CDE_SAISIE_LIG
				JOIN view_bible_PRODLOG_entry ON view_bible_PRODLOG_entry.entry_key=view_file_CDE_SAISIE_LIG.field_CDE_PROD
				WHERE view_file_CDE_SAISIE_LIG.filerecord_parent_id='{$filerecord_id}'
				ORDER BY view_file_CDE_SAISIE_LIG.filerecord_id" ;
	$result = $_opDB->query($query) ;
	$TABfile_CDE_SAISIE_LIG = array() ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$TABfile_CDE_SAISIE_LIG[] = $arr ;
	}
	//print_r($TABfile_CDE_SAISIE_LIG) ;
	
	
	foreach( $bible_STORE_entry as $mkey => $mvalue ) {
		$bible_STORE_entry[$mkey] = strtoupper(str_replace(array("'",':'),array(' ',' '),$mvalue));
	}
	foreach( $file_STORE_ADRBOOK as $mkey => $mvalue ) {
		$file_STORE_ADRBOOK[$mkey] = strtoupper(str_replace(array("'",':'),array(' ',' '),$mvalue));
	}
	

	$cde_refcli = $file_CDE_SAISIE['field_CDE_REFCLI'] ;
	if( !$cde_refcli ) {
		$cde_refcli = 'CRM'.$filerecord_id ;
	}
	
	$NAD_BY = $file_CDE_SAISIE['field_CDE_STORE'] ;
	$NAD_DP = $file_CDE_SAISIE['field_CDE_STORE'] ;
	
	$adrfact_nom = $bible_STORE_entry['field_STORENAME'] ;
	$adrfact_adr1 = $bible_STORE_entry['field_STOREADR'] ;
	$adrfact_adr2 = '' ;
	$adrfact_cp = $bible_STORE_entry['field_STORECP'] ;
	$adrfact_ville = $bible_STORE_entry['field_STOREVILLE'] ;
	
	if( $file_STORE_ADRBOOK['field_ADRLIV_IS_ON'] ) {
		$adrliv_nom = $bible_STORE_entry['field_STORENAME'] ;
		$adrliv_adr1 = $file_STORE_ADRBOOK['field_ADRLIV_ADR'] ;
		$adrliv_adr2 = '' ;
		$adrliv_cp = $file_STORE_ADRBOOK['field_ADRLIV_CP'] ;
		$adrliv_ville = $file_STORE_ADRBOOK['field_ADRLIV_VILLE'] ;
	} else {
		$adrliv_nom = $bible_STORE_entry['field_STORENAME'] ;
		$adrliv_adr1 = $bible_STORE_entry['field_STOREADR'] ;
		$adrliv_adr2 = '' ;
		$adrliv_cp = $bible_STORE_entry['field_STORECP'] ;
		$adrliv_ville = $bible_STORE_entry['field_STOREVILLE'] ;
	}


	$buffer = array() ;
	$buffer[] = "UNA:+.? '" ;
	$buffer[] = "UNB+UNOA:2+{$bible_CDESAISIE_entry['field_EDI_SRC_GLN']}:14+{$bible_CDESAISIE_entry['field_EDI_DEST_GLN']}:14+".date('ymd').":".date('Hi')."+{$filerecord_id}'" ;
	$buffer[] = "UNH+1+ORDERS:D:96A:UN:EAN008'" ;
	$buffer[] = "BGM+220+{$cde_refcli}+9'" ;
	$buffer[] = "DTM+137:".date('YmdHi',strtotime($file_CDE_SAISIE['field_CDE_DATE'])).":203'" ;
	$buffer[] = "DTM+2:".date('YmdHi',strtotime($file_CDE_SAISIE['field_CDE_DATELIV'])).":203'" ;
	$buffer[] = "FTX+DEL+++".$file_STORE_ADRBOOK['field_TIMELIV']."'" ;
	$buffer[] = "NAD+CLIGROUP+{$bible_CDESAISIE_entry['field_EDI_SRC_GLN']}::9'" ;
	$buffer[] = "NAD+BY+{$NAD_BY}::9++{$adrfact_nom}+{$adrfact_adr1}+{$adrfact_ville}++{$adrfact_cp}+FR'" ;
	$buffer[] = "NAD+DP+{$NAD_DP}::9++{$adrliv_nom}+{$adrliv_adr1}+{$adrliv_ville}++{$adrliv_cp}+FR'" ;
	$cnt=0 ;
	foreach( $TABfile_CDE_SAISIE_LIG as $file_CDE_SAISIE_LIG ) {
		foreach( array('field_CDE_QTE_UC_PAID','field_CDE_QTE_UC_FREE') as $mkey ) {
			$qte_cde_uvc = (float)($file_CDE_SAISIE_LIG['field_UC_PCB'] * $file_CDE_SAISIE_LIG[$mkey]) ;
			$uc_pcb = (float)$file_CDE_SAISIE_LIG['field_UC_PCB'] ;
			
			if( $qte_cde_uvc <= 0 ) {
				continue ;
			}
		
			$cnt++ ;
			$buffer[] = "LIN+{$cnt}++{$file_CDE_SAISIE_LIG['field_UVC_EAN']}:EN::9'" ;
			$buffer[] = "PIA+5+{$file_CDE_SAISIE_LIG['field_PROD_REF']}:SA'" ;
			$buffer[] = "IMD+F++:::{$file_CDE_SAISIE_LIG['field_PROD_LIB']}'" ;
			$buffer[] = "QTY+21:{$qte_cde_uvc}'" ;
			$buffer[] = "QTY+59:{$uc_pcb}'" ;
			if( $mkey == 'field_CDE_QTE_UC_FREE' ) {
				$buffer[] = "PRI+INF:0.00::DPR:1:PCE'" ;
			}
		}
	}
	$buffer[] = "UNS+S'" ;
	$nb_ligs = count($buffer) - 2 + 1 ;
	$buffer[] = "UNT+{$nb_ligs}+1'" ;
	$buffer[] = "UNZ+1+{$filerecord_id}'" ;
	
	$str = '' ;
	foreach( $buffer as $segm ) {
		$str.= $segm."\r\n" ;
	}
	return $str ;
}
?>
