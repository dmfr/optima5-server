Ext.define('DbsTracyAttachmentModel',{
	extend: 'Ext.data.Model',
	idProperty: 'attachment_filerecord_id',
	fields: [
		{name: 'attachment_filerecord_id', type:'int'},
		{name: 'parent_file', type:'string'},
		{name: 'attachment_date', type:'date', dateFormat:'Y-m-d'},
		{name: 'attachment_txt', type:'string'}
	]
});

Ext.define('DbsTracyFileOrderStepModel',{
	extend: 'Ext.data.Model',
	idProperty: 'orderstep_filerecord_id',
	fields: [
		{name: 'orderstep_filerecord_id', type:'int'},
		{name: 'step_code', type:'string'},
		{name: 'step_txt', type:'string'}, // null => to convert
		{name: 'status_is_ok', type:'boolean'},
		{name: 'date_actual', type:'date', dateFormat:'Y-m-d H:i:s'}
	]
});

Ext.define('DbsTracyFileOrderModel',{
	extend: 'Ext.data.Model',
	idProperty: 'order_filerecord_id',
	fields: [
		{name: 'order_filerecord_id', type:'int'},
		{name: 'flow_code', type:'string'}, //TODO ?
		{name: 'id_soc', type:'string'},
		{name: 'id_dn', type:'string'},
		{name: 'ref_po', type:'string'},
		{name: 'ref_invoice', type:'string'},
		{name: 'atr_priority', type:'string'},
		{name: 'atr_incoterm', type:'string'},
		{name: 'atr_consignee', type:'string'},
		{name: 'txt_location_city', type:'string'},
		{name: 'txt_location_full', type:'string'},
		{name: 'vol_kg', type:'number'},
		{name: 'vol_dims', type:'string'},
		{name: 'vol_count', type:'int'},
		{
			name: 'vol_dim_l',
			type: 'int',
			convert: function(v, record) {
				var ttmp = record.get('vol_dims').split('x') ;
				if( !ttmp[0] ) {
					return 0 ;
				}
				return parseInt(ttmp[0].trim()) ;
			}
		},{
			name: 'vol_dim_w',
			type: 'int',
			convert: function(v, record) {
				var ttmp = record.get('vol_dims').split('x') ;
				if( !ttmp[1] ) {
					return 0 ;
				}
				return parseInt(ttmp[1].trim()) ;
			}
		},{
			name: 'vol_dim_h',
			type: 'int',
			convert: function(v, record) {
				var ttmp = record.get('vol_dims').split('x') ;
				if( !ttmp[2] ) {
					return 0 ;
				}
				return parseInt(ttmp[2].trim()) ;
			}
		},
		{name: 'calc_step', type:'string'},
		{name: 'calc_link_is_active', type:'boolean'},
		{name: 'calc_link_trspt_filerecord_id', type:'int'},
		{name: 'calc_link_trspt_txt', type:'string'},
		
		{name: 'warning_is_on', type: 'boolean'},
		{name: 'warning_code', type: 'string'},
		{name: 'warning_txt', type: 'string'}
	],
	hasMany: [{
		model: 'DbsTracyFileOrderStepModel',
		name: 'steps',
		associationKey: 'steps'
	},{
		model: 'DbsTracyAttachmentModel',
		name: 'attachments',
		associationKey: 'attachments'
	}]
});

Ext.define('DbsTracyFileTrsptEventModel',{
	extend: 'Ext.data.Model',
	idProperty: 'trsptevent_filerecord_id',
	fields: [
		{name: 'trsptevent_filerecord_id', type:'int'},
		{name: 'event_user', type:'string'},
		{name: 'event_date', type:'date', dateFormat:'Y-m-d H:i:s'},
		{name: 'event_txt', type:'string'}
	]
});

Ext.define('DbsTracyFileTrsptOrderModel',{
	extend: 'DbsTracyFileOrderModel',
	idProperty: 'trsptorder_filerecord_id',
	fields: [
		{name: 'trsptorder_filerecord_id', type:'int'},
		{name: 'link_is_cancel', type:'boolean'}
	]
});

Ext.define('DbsTracyFileTrsptModel',{
	extend: 'Ext.data.Model',
	idProperty: 'trspt_filerecord_id',
	fields: [
		{name: 'trspt_filerecord_id', type:'int'},
		{name: 'id_soc', type:'string'},
		{name: 'id_doc', type:'string'},
		{name: 'date_create', type:'date', dateFormat:'Y-m-d'},
		{name: 'atr_priority', type:'string'},
		{name: 'atr_incoterm', type:'string'},
		{name: 'atr_consignee', type:'string'},
		{name: 'mvt_carrier', type:'string'},
		{name: 'mvt_origin', type:'string'},
		{name: 'mvt_dest', type:'string'},
		{name: 'flight_awb', type:'string'},
		{name: 'flight_date', type: 'date', dateFormat:'Y-m-d'},
		{name: 'flight_code', type:'string'},
		{name: 'print_is_ok', type:'boolean'},
		{name: 'calc_step', type:'string'},
		{name: 'customs_mode', type:'string'},
		{name: 'customs_date_request', dateFormat:'Y-m-d H:i:s'},
		{name: 'customs_date_cleared', dateFormat:'Y-m-d H:i:s'}
	],
	hasMany: [{
		model: 'DbsTracyFileTrsptOrderModel',
		name: 'orders',
		associationKey: 'orders'
	},{
		model: 'DbsTracyFileTrsptEventModel',
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
			case 'attachmentschange' :
				Ext.apply( eventParams, {
					orderFilerecordId: postParams.orderFilerecordId
				}) ;
				break ;
			case 'opentrspt' :
				Ext.apply( eventParams, {
					trsptNew: postParams.trsptNew,
					trsptFilerecordId: postParams.trsptFilerecordId,
					trsptNew_orderRecords: postParams.trsptNew_orderRecords
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
