<?php
include("$server_root/modules/paracrm/include/paracrm.inc.php") ;
include("$server_root/modules/spec_wb_budget/include/specWbBudget.inc.php") ;


function backend_specific( $post_data )
{
switch( $post_data['_action'] )
{
	case 'budgetbuild_getGrid' :
	return specWbBudget_budgetbuild_getGrid( $post_data ) ;
	
	case 'assortbuild_getGrid' :
	return specWbBudget_assortbuild_getGrid( $post_data ) ;
	case 'assortbuild_setRecords' :
	return specWbBudget_assortbuild_setRecords( $post_data ) ;
	
	default :
	return NULL ;
}
}

?>