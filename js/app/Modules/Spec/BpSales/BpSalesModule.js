Ext.define('BpSalesCdeLigModel',{
	extend: 'Ext.data.Model',
	idProperty: 'cdelig_filerecord_id',
	fields: [
		{name: 'cdelig_filerecord_id', type:'int'},
		{name: 'status_is_ship', type:'boolean'},
		{name: 'prod_ref', type:'string'},
		{name: 'prod_ref_txt', type:'string'},
		{name: 'spec_batch', type:'string'},
		{name: 'spec_dlc', type:'date', dateFormat:'Y-m-d'},
		{name: 'qty_order', type:'number'},
		{name: 'qty_ship', type:'number'},
		
		{name: 'inv_mode', type:'string'},
		
		{name: 'calc_count_ut', type:'number'},
		{name: 'calc_count_pack', type:'number'},
		{name: 'calc_weight_kg', type:'number'}
	]
});
Ext.define('BpSalesCdeModel',{
	extend: 'Ext.data.Model',
	idProperty: 'cde_filerecord_id',
	fields: [
		{name: 'cde_filerecord_id', type:'int'},
		{name: 'cde_ref', type:'string'},
		{name: 'cde_class', type:'string'},
		{name: 'mag_link', type:'string'},
		{name: 'mag_link_txt', type:'string'},
		{name: 'cli_link', type:'string'},
		{name: 'cli_link_txt', type:'string'},
		{name: 'cli_ref_id', type:'string'},
		{name: 'status_is_ship', type:'boolean'},
		{name: 'status', type:'string'},
		{name: 'status_txt', type:'string'},
		{name: 'status_percent', type:'int'},
		{name: 'status_color', type:'string'},
		{name: 'date_dpe', type:'date', dateFormat:'Y-m-d'},
		{name: 'date_order', type:'date', dateFormat:'Y-m-d'},
		{name: 'date_ship', type:'date', dateFormat:'Y-m-d'},
		
		{name: 'calc_count_ut', type:'number'},
		{name: 'calc_count_pack', type:'number'},
		{name: 'calc_weight_kg', type:'number'},
		
		{name: 'link_inv_filerecord_id', type:'int'},
		{name: 'link_inv_id_inv', type:'string', allowNull:true},
		{name: 'link_inv_calc_amount_novat', type: 'number', allowNull:true},
		{name: 'link_inv_calc_amount_final', type: 'number', allowNull:true}
	],
	hasMany: [{
		model: 'BpSalesCdeLigModel',
		name: 'ligs',
		associationKey: 'ligs'
	}]
});

Ext.define('BpSalesInvLigModel',{
	extend: 'Ext.data.Model',
	idProperty: 'invlig_filerecord_id',
	fields: [
		{name: 'invlig_filerecord_id', type:'int'},
		{name: 'id_inv_lig', type:'string'},
		{name: 'link_cdelig_filerecord_id', string:'int'},
		{name: 'mode_inv', type:'string'},
		{name: 'mode_inv_is_calc', type:'boolean'},
		{name: 'base_prod', type:'string'},
		{name: 'base_prod_txt', type:'string'},
		{name: 'base_qty', type:'number'},
		{name: 'static_txt', type:'string'},
		{name: 'static_amount', type:'number'},
		{name: 'join_price', type:'number'},
		{name: 'join_coef1', type:'number'},
		{name: 'join_coef2', type:'number'},
		{name: 'join_coef3', type:'number'},
		{name: 'join_vat', type:'number'},
		
		{name: 'calc_amount_novat', type:'number'},
		{name: 'calc_amount_final', type:'number'}
	]
});
Ext.define('BpSalesInvModel',{
	extend: 'Ext.data.Model',
	idProperty: 'inv_filerecord_id',
	fields: [
		{name: 'inv_filerecord_id', type:'int'},
		{name: 'id_inv', type:'string'},
		{name: 'id_cde_ref', type:'string'},
		{name: 'id_coef', type:'int'},
		{name: 'cli_link', type:'string'},
		{name: 'cli_link_txt', type:'string'},
		{name: 'pay_bank', type:'string'},
		{name: 'adr_sendto', type:'string'},
		{name: 'adr_invoice', type:'string'},
		{name: 'adr_ship', type:'string'},
		{name: 'date_create', type:'date', dateFormat:'Y-m-d'},
		{name: 'date_invoice', type:'date', dateFormat:'Y-m-d'},
		
		{name: 'calc_amount_novat', type:'number'},
		{name: 'calc_amount_final', type:'number'},
		
		{name: 'status_is_final', type:'boolean'},
		{name: 'status_is_sent', type:'boolean'}
	],
	hasMany: [{
		model: 'BpSalesInvLigModel',
		name: 'ligs',
		associationKey: 'ligs'
	}]
});


Ext.define('Optima5.Modules.Spec.BpSales.BpSalesModule', {
	extend: 'Optima5.Module',
	requires: [
		'Optima5.Modules.Spec.BpSales.MainPanel'
	],
	
	moduleParams: null,
	
	initModule: function() {
		var me = this ;
		
		me.createWindow({
			width:1100,
			height:600,
			resizable:true,
			maximizable:false,
			layout:'fit',
			items:[Ext.create('Optima5.Modules.Spec.BpSales.MainPanel',{
				optimaModule: me,
				border: false
			})]
		}) ;
	},
	postCrmEvent: function( crmEvent, postParams ) {
		var me = this ;
		if( typeof postParams === 'undefined' ) {
			postParams = {} ;
		}
		
		var eventParams = {} ;
		switch( crmEvent ) {
			case 'datachange' :
				break ;
			case 'openinv' :
				Ext.apply( eventParams, {
					invFilerecordId: postParams.invFilerecordId,
					invNew: postParams.invNew
				}) ;
				break ;
			
			default :
				return ;
		}
		me.fireEvent('op5broadcast',crmEvent,eventParams) ;
	}
});
