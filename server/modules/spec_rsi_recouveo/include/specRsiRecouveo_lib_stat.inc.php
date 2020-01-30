<?php

function specRsiRecouveo_lib_stat_build() {
	global $_opDB ;
	
	/* 
	* Scope user pour chaque compte
	* type facture (fieldTYPE='') 
	*  - scope IN : première date lien vers un fichier S01_OPEN
	*  - scope OUT : date vie_stat_scope_files
	* type paiemnt (field_TYPE<>'') 
	*  - scope IN : date_RECORD
	*  - scope OUT : date vie_stat_scope_files
	*/
	$query = "DROP TABLE IF EXISTS view_stat_scope_accuser" ;
	$_opDB->query($query) ;
	$query = "CREATE TABLE view_stat_scope_accuser (
					acc_id VARCHAR(50),
					log_user VARCHAR(50),
					nb_actions_account_user INT,
					nb_actions_account INT
				)";
	$_opDB->query($query) ;
	$query = "ALTER TABLE view_stat_scope_accuser ADD PRIMARY KEY( acc_id, log_user )" ;
	$_opDB->query($query) ;
	
	$queryBase_accountActions = "SELECT f.field_LINK_ACCOUNT as acc_id, fa.field_LOG_USER as log_user
		FROM view_file_FILE_ACTION fa
		JOIN view_file_FILE f ON f.filerecord_id=fa.filerecord_parent_id
		WHERE fa.field_LOG_USER<>'' AND fa.field_STATUS_IS_OK='1' AND fa.field_LINK_ACTION<>'BUMP'" ;
	
	$query = "INSERT INTO view_stat_scope_accuser
			SELECT base.acc_id, base.log_user, count(*), '0'
			FROM ($queryBase_accountActions) base
			GROUP BY acc_id, log_user" ;
	$_opDB->query($query) ;
	
	$query = "UPDATE view_stat_scope_accuser JOIN (
		SELECT base.acc_id, count(*) as cnt
		FROM ($queryBase_accountActions) base
		GROUP BY acc_id 
	) nbactions_by_account
	ON nbactions_by_account.acc_id = view_stat_scope_accuser.acc_id
	SET view_stat_scope_accuser.nb_actions_account = nbactions_by_account.cnt" ;
	$_opDB->query($query) ;
	
}



?>
