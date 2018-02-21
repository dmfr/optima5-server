<?php

function specRsiRecouveo_lib_stat_build_record_scope() {
	global $_opDB ;
	
	// Table cache : date de fermeture du dossier
	
	$_opDB->query("DROP TABLE IF EXISTS view_stat_scope_files") ;
	$query = "CREATE TABLE view_stat_scope_files (
		file_filerecord_id INT,
		file_account VARCHAR(100),
		file_ref VARCHAR(100),
		file_active INT,
		records_count INT,
		records_amount DECIMAL(10,3),
		records_maxdate DATE
	)" ;
	$_opDB->query($query) ;
	$_opDB->query("ALTER TABLE view_stat_scope_files ADD PRIMARY KEY(file_filerecord_id)") ;
	
	$query = "INSERT INTO view_stat_scope_files(file_filerecord_id,file_account,file_ref,file_active)
				SELECT f.filerecord_id,field_LINK_ACCOUNT,field_FILE_ID
				, IF( (field_STATUS_CLOSED_VOID='1' OR field_STATUS_CLOSED_END='1'), 0, 1 )
				FROM view_file_FILE f
				WHERE f.field_STATUS_CLOSED_VOID<>'1'" ;
	$_opDB->query($query) ;
				
	$query = "UPDATE view_stat_scope_files v
			JOIN (SELECT f.filerecord_id as file_filerecord_id , count(r.filerecord_id) as cnt
				FROM view_file_FILE f
				JOIN view_file_RECORD_LINK rl ON rl.field_LINK_FILE_ID=f.filerecord_id AND rl.field_LINK_IS_ON='1'
				JOIN view_file_RECORD r ON r.filerecord_id=rl.filerecord_parent_id
				WHERE field_TYPE=''
				GROUP BY f.filerecord_id
			) tab ON tab.file_filerecord_id=v.file_filerecord_id
			SET v.records_count=tab.cnt" ;
	$_opDB->query($query) ;
	
	$query = "UPDATE view_stat_scope_files v
			JOIN (SELECT f.filerecord_id as file_filerecord_id , sum(r.field_AMOUNT) as amount
				FROM view_file_FILE f
				JOIN view_file_RECORD_LINK rl ON rl.field_LINK_FILE_ID=f.filerecord_id AND rl.field_LINK_IS_ON='1'
				JOIN view_file_RECORD r ON r.filerecord_id=rl.filerecord_parent_id
				WHERE 1
				GROUP BY f.filerecord_id
			) tab ON tab.file_filerecord_id=v.file_filerecord_id
			SET v.records_amount=tab.amount" ;
	$_opDB->query($query) ;
	
	$query = "UPDATE view_stat_scope_files v
			JOIN (SELECT f.filerecord_id as file_filerecord_id , max(r.field_DATE_RECORD) as max_date
				FROM view_file_FILE f
				JOIN view_file_RECORD_LINK rl ON rl.field_LINK_FILE_ID=f.filerecord_id AND rl.field_LINK_IS_ON='1'
				JOIN view_file_RECORD r ON r.filerecord_id=rl.filerecord_parent_id
				WHERE 1
				GROUP BY f.filerecord_id
			) tab ON tab.file_filerecord_id=v.file_filerecord_id
			SET v.records_maxdate=tab.max_date" ;
	$_opDB->query($query) ;
	
	$query = "UPDATE view_stat_scope_files SET file_active='0' WHERE records_amount='0'" ;
	$_opDB->query($query) ;

	
	
	
	
	$_opDB->query("DROP TABLE IF EXISTS view_stat_scope_records") ;
	$query = "CREATE TABLE view_stat_scope_records (
		record_filerecord_id INT,
		record_account VARCHAR(100),
		record_ref VARCHAR(100),
		file_filerecord_id INT,
		status_active INT,
		status_payment INT,
		date_first DATE,
		date_record DATE
	)" ;
	$_opDB->query($query) ;
	$_opDB->query("ALTER TABLE view_stat_scope_records ADD PRIMARY KEY(record_filerecord_id)") ;
	
	
	$query = "INSERT INTO view_stat_scope_records(record_filerecord_id,record_account,record_ref,date_record,status_payment)
				SELECT filerecord_id,field_LINK_ACCOUNT,field_RECORD_ID, field_DATE_RECORD, IF(field_TYPE<>'',1,0)
				FROM view_file_RECORD" ;
	$_opDB->query($query) ;
	
	
	$query = "UPDATE view_stat_scope_records v
			JOIN (SELECT r.filerecord_id as record_filerecord_id, MIN(field_DATE_LINK_ON) as date_first
				FROM view_file_RECORD r
				JOIN view_file_RECORD_LINK rl ON rl.filerecord_parent_id=r.filerecord_id
				JOIN view_file_FILE f ON f.filerecord_id=rl.field_LINK_FILE_ID
				WHERE field_STATUS<>'S0_PRE'
				GROUP BY r.filerecord_id
			) tab ON tab.record_filerecord_id=v.record_filerecord_id
			SET v.date_first = tab.date_first" ;
	$_opDB->query($query) ;

	$query = "UPDATE view_stat_scope_records v
			JOIN (SELECT r.filerecord_id as record_filerecord_id, f.filerecord_id as file_filerecord_id, IF( (f.field_STATUS_CLOSED_VOID='1' OR f.field_STATUS_CLOSED_END='1'),'0','1') as status_active
				FROM view_file_RECORD r
				JOIN view_file_RECORD_LINK rl ON rl.filerecord_parent_id=r.filerecord_id AND rl.field_LINK_IS_ON='1'
				JOIN view_file_FILE f ON f.filerecord_id=rl.field_LINK_FILE_ID
			) tab ON tab.record_filerecord_id=v.record_filerecord_id
			SET v.status_active = tab.status_active , v.file_filerecord_id = tab.file_filerecord_id" ;
	$_opDB->query($query) ;
	
	
	/* 
	* Scope pour chaque record
	* type facture (fieldTYPE='') 
	*  - scope IN : première date lien vers un fichier S01_OPEN
	*  - scope OUT : date vie_stat_scope_files
	* type paiemnt (field_TYPE<>'') 
	*  - scope IN : date_RECORD
	*  - scope OUT : date vie_stat_scope_files
	*/
	$query = "UPDATE view_file_RECORD r
				JOIN view_stat_scope_records vr ON vr.record_filerecord_id=r.filerecord_id
				JOIN view_stat_scope_files vf ON vf.file_filerecord_id=vr.file_filerecord_id
				SET field_STAT_SCOPE_IS_ON = vr.status_active
				, field_STAT_SCOPE_START = IF( vr.status_payment='1', vr.date_record, vr.date_first )
				, field_STAT_SCOPE_END   = IF( vf.file_active, '0000-00-00', vf.records_maxdate )" ;
	$_opDB->query($query) ;
}



?>
