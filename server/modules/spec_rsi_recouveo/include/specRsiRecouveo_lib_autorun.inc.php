<?php

function specRsiRecouveo_lib_autorun_closeEnd() {
	global $_opDB ;
	$query = "SELECT distinct field_LINK_ACCOUNT FROM view_file_FILE WHERE field_STATUS_CLOSED_END<>'1' AND field_STATUS_CLOSED_VOID<>'1'" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_row($result)) != FALSE ) {
		$acc_id = $arr[0] ;
		specRsiRecouveo_file_lib_updateStatus($acc_id) ;
	}
}



?>
