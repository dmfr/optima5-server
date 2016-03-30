Ext.define('DbsTracyFileOrderStepModel',{
	extend: 'Ext.data.Model',
	idProperty: 'orderstep_filerecord_id',
	fields: [
		{name: 'orderstep_filerecord_id', type:'int'},
		{name: 'step_code', type:'string'},
		{name: 'status_is_ok', type:'int'},
		{name: 'status_date_actual', type:'string'}
	]
});

Ext.define('DbsTracyFileOrderAttachmentModel',{
	extend: 'Ext.data.Model',
	idProperty: 'orderattachment_filerecord_id',
	fields: [
		{name: 'orderattachment_filerecord_id', type:'int'},
		{name: 'doc_type', type:'string'}
	]
});

Ext.define('DbsTracyFileOrderModel',{
	extend: 'Ext.data.Model',
	idProperty: 'order_filerecord_id',
	fields: [
		{name: 'order_filerecord_id', type:'int'}
	],
	hasMany: [{
		model: 'DbsTracyFileOrderStepModel',
		name: 'steps',
		associationKey: 'steps'
	},{
		model: 'DbsTracyFileOrderAttachmentModel',
		name: 'attachments',
		associationKey: 'attachments'
	}]
});

Ext.define('DbsTracyFileTrpstEventModel',{
	extend: 'Ext.data.Model',
	idProperty: 'trsptevent_filerecord_id',
	fields: [
		{name: 'trsptevent_filerecord_id', type:'int'},
		{name: 'event_user', type:'string'},
		{name: 'event_date', type:'string'},
		{name: 'event_txt', type:'string'}
	]
});

Ext.define('DbsTracyFileTrpstOrderModel',{
	extend: 'DbsTracyFileOrderModel',
	idProperty: 'trsptorder_filerecord_id',
	fields: [
		{name: 'trsptorder_filerecord_id', type:'int'},
		{name: 'link_is_cancel', type:'boolean'}
	]
});

Ext.define('DbsTracyFileTrpstModel',{
	extend: 'Ext.data.Model',
	idProperty: 'trspt_filerecord_id',
	fields: [
		{name: 'trspt_filerecord_id', type:'int'},
		{name: 'id_soc', type:'string'},
		{name: 'id_doc', type:'string'},
		{name: 'date_create', type:'string'},
		{name: 'atr_priority', type:'string'},
		{name: 'atr_incoterm', type:'string'},
		{name: 'atr_consignee', type:'string'},
		{name: 'mvt_carrier', type:'boolean'},
		{name: 'mvt_origin', type:'string'},
		{name: 'mvt_dest', type:'string'},
		{name: 'flight_awb', type:'string'},
		{name: 'flight_date', type: 'string'},
		{name: 'flight_code', type:'string'},
		{name: 'calc_step', type:'string'}
	],
	hasMany: [{
		model: 'DbsTracyFileTrsptOrderModel',
		name: 'orders',
		associationKey: 'orders'
	},{
		model: 'DbsTracyFileTrpstEventModel',
		name: 'events',
		associationKey: 'events'
	}]
});



Ext.define('Optima5.Modules.Spec.DbsTracy.DbsTracyModule', {
	extend: 'Optima5.Module',
	requires: [
		'Optima5.Modules.Spec.DbsTracy.MainPanel'
	],
	
	moduleParams: null,
	
	initModule: function() {
		var me = this ;
		
		me.createWindow({
			width:1100,
			height:600,
			resizable:true,
			layout:'fit',
			items:[Ext.create('Optima5.Modules.Spec.DbsTracy.MainPanel',{
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
			case 'opentrspt' :
				Ext.apply( eventParams, {
					trsptNew: postParams.trsptNew,
					trsptFilerecordId: postParams.trsptFilerecordId
				}) ;
				break ;
			case 'openorder' :
				Ext.apply( eventParams, {
					orderNew: postParams.orderNew,
					orderFilerecordId: postParams.orderFilerecordId
				}) ;
				break ;
			
			default :
				return ;
		}
		me.fireEvent('op5broadcast',crmEvent,eventParams) ;
	}
});
