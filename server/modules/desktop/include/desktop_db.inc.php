<?php

function desktop_db_updateSchema() {
	if( Auth_Manager::getInstance()->auth_is_admin() ) {
		$obj_dmgrbase = new DatabaseMgr_Base() ;
		$obj_dmgrbase->baseDb_updateSchema( DatabaseMgr_Base::dbCurrent_getDomainId() ) ;
		return array('success'=>true) ;
	}
	return array('success'=>false) ;
}

?>