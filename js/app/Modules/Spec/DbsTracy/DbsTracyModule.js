Ext.define('DbsTracyAttachmentModel',{
	extend: 'Ext.data.Model',
	idProperty: 'attachment_media_id',
	fields: [
		{name: 'attachment_media_id', type:'string'},
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
		{name: 'status_is_void', type:'boolean'},
		{name: 'date_actual', type:'date', dateFormat:'Y-m-d H:i:s'},
		{name: 'log_user', type:'string'}
	]
});

Ext.define('DbsTracyFileOrderEventModel',{
	extend: 'Ext.data.Model',
	idProperty: 'orderevent_filerecord_id',
	fields: [
		{name: 'orderevent_filerecord_id', type:'int'},
		{name: 'event_date', type:'date', dateFormat:'Y-m-d H:i:s'},
		{name: 'event_user', type:'string'}, // null => to convert
		{name: 'event_is_warning', type:'boolean'},
		{name: 'event_code', type:'string'},
		{name: 'event_txt', type:'string'}
	]
});

Ext.define('DbsTracyFileOrderModel',{
	extend: 'Ext.data.Model',
	idProperty: 'order_filerecord_id',
	fields: [
		{name: 'order_filerecord_id', type:'int'},
		{name: 'flow_code', type:'string'},
		{name: 'id_soc', type:'string'},
		{name: 'id_dn', type:'string'},
		{name: 'ref_po', type:'string'},
		{name: 'ref_invoice', type:'string'},
		{name: 'ref_mag', type:'string'},
		{name: 'atr_type', type:'string'},
		{name: 'atr_priority', type:'string'},
		{name: 'atr_incoterm', type:'string'},
		{name: 'atr_consignee', type:'string'},
		{name: 'txt_location_city', type:'string'},
		{name: 'txt_location_full', type:'string'},
		{name: 'adr_json', type:'string'},
		{name: 'desc_txt', type:'string'},
		{name: 'desc_value', type:'number'},
		{name: 'desc_value_currency', type:'string'},
		{name: 'vol_kg', type:'number'},
		{name: 'vol_dims', type:'string'},
		{name: 'vol_count', type:'int'},
		{name: 'date_create', type:'date', dateFormat:'Y-m-d H:i:s'},
		{name: 'date_init', type:'date', dateFormat:'Y-m-d H:i:s'},
		{name: 'date_closed', type:'date', dateFormat:'Y-m-d H:i:s'},
		{name: 'date_crd', type:'date', dateFormat:'Y-m-d H:i:s'},
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
		{name: 'calc_step_warning_edi', type:'boolean'},
		{name: 'calc_link_is_active', type:'boolean'},
		{name: 'calc_link_trspt_filerecord_id', type:'int'},
		{name: 'calc_link_trspt_txt', type:'string'},
		{name: 'calc_hat_is_active', type:'boolean'},
		{name: 'calc_hat_filerecord_id', type:'int'},
		{name: 'calc_hat_txt', type:'string'},
		
		{name: 'warning_is_on', type: 'boolean', allowNull: true},
		{name: 'warning_code', type: 'string'},
		{name: 'warning_txt', type: 'string'},
		
		{name: 'kpi_is_on', type: 'boolean', allowNull: true},
		{name: 'kpi_is_ok_raw', type: 'boolean', allowNull: true},
		{name: 'kpi_is_ok', type: 'boolean', allowNull: true},
		{name: 'kpi_code', type: 'string'},
		{name: 'kpi_txt', type: 'string'},
		{name: 'kpi_calc_step', type:'string'},
		{name: 'kpi_calc_date_target', type:'date', dateFormat:'Y-m-d H:i:s'},
		{name: 'kpi_calc_date_actual', type:'date', dateFormat:'Y-m-d H:i:s'}
	],
	hasMany: [{
		model: 'DbsTracyFileOrderStepModel',
		name: 'steps',
		associationKey: 'steps'
	},{
		model: 'DbsTracyFileOrderEventModel',
		name: 'events',
		associationKey: 'events'
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
		{name: 'event_txt', type:'string'},
		{name: 'spec_tms_on', type:'boolean'},
		{name: 'spec_tms_status', type:'string'},
		{name: 'trsptpick_is_on', type:'boolean'},
		{name: 'trsptpick_filerecord_id', type:'int'},
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
		{name: 'flow_code', type:'string'},
		{name: 'id_soc', type:'string'},
		{name: 'id_doc', type:'string'},
		{name: 'date_create', type:'date', dateFormat:'Y-m-d'},
		{name: 'atr_type', type:'string'},
		{name: 'atr_priority', type:'string'},
		{name: 'atr_incoterm', type:'string'},
		{name: 'atr_consignee', type:'string'},
		{name: 'mvt_carrier', type:'string'},
		{name: 'mvt_carrier_prod', type:'string'},
		{name: 'mvt_carrier_account', type:'string'},
		{name: 'mvt_origin', type:'string'},
		{name: 'mvt_dest', type:'string'},
		{name: 'flight_awb', type:'string'},
		{name: 'flight_date', type: 'date', dateFormat:'Y-m-d'},
		{name: 'flight_code', type:'string'},
		{name: 'print_is_ok', type:'boolean'},
		{name: 'calc_step', type:'string'},
		{name: 'calc_step_warning_edi', type:'boolean'},
		{name: 'calc_customs_is_wait', type:'boolean'},
		{name: 'customs_mode', type:'string'},
		{name: 'customs_mode_auto', type:'string'},
		{name: 'customs_date_request', dateFormat:'Y-m-d H:i:s'},
		{name: 'customs_date_cleared', dateFormat:'Y-m-d H:i:s'},
		{name: 'pod_doc', type:'string'},
		{name: 'spec_tms_status', type:'string'},
		{name: 'trsptpick_filerecord_id', type:'int'},
		{name: 'trsptpick_id', type:'string'},
		
		{name: 'sword_edi_1_warn', type:'boolean'},
		{name: 'sword_edi_1_warn_txt', type:'string'},
		{name: 'sword_edi_1_ready', type:'boolean'},
		{name: 'sword_edi_1_sent', type:'boolean'},
		{name: 'sword_edi_2_awb', type:'boolean'},
		{name: 'sword_edi_3_ready', type:'boolean'},
		{name: 'sword_edi_3_sent', type:'boolean'}
	],
	hasMany: [{
		model: 'DbsTracyFileTrsptOrderModel',
		name: 'orders',
		associationKey: 'orders'
	},{
		model: 'DbsTracyFileHatModel',
		name: 'hats',
		associationKey: 'hats'
	},{
		model: 'DbsTracyFileTrsptEventModel',
		name: 'events',
		associationKey: 'events'
	}]
});

Ext.define('DbsTracyFileHatOrderModel',{
	extend: 'DbsTracyFileOrderModel',
	idProperty: 'hatorder_filerecord_id',
	fields: [
		{name: 'hatorder_filerecord_id', type:'int'},
		{name: 'link_is_cancel', type:'boolean'}
	]
});
Ext.define('DbsTracyFileHatParcelModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name: 'hatparcel_filerecord_id', type:'int'},
		{name: 'vol_count', type:'int'},
		{name: 'vol_kg', type:'number'},
		{name: 'vol_dims', type:'auto'},
		{name: 'spec_barcode', type:'string'},
		{name: 'tms_carrier', type:'string'},
		{name: 'tms_tracking', type:'string'}
	]
});
Ext.define('DbsTracyFileHatParcelEditModel',{
	extend: 'DbsTracyFileHatParcelModel',
	fields: [
		{name:'_phantom', type:'boolean'}
	]
});
Ext.define('DbsTracyFileHatModel',{
	extend: 'Ext.data.Model',
	idProperty: 'hat_filerecord_id',
	fields: [
		{name: 'hat_filerecord_id', type:'int'},
		{name: 'id_soc', type:'string'},
		{name: 'id_hat', type:'string'},
		{name: 'date_create', type:'date', dateFormat:'Y-m-d'}
	],
	hasMany: [{
		model: 'DbsTracyFileHatOrderModel',
		name: 'orders',
		associationKey: 'orders'
	},{
		model: 'DbsTracyFileHatParcelModel',
		name: 'parcels',
		associationKey: 'parcels'
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
			tools: [{
				type: 'restore',
				handler: function() {
					this.postCrmEvent('opengun') ;
				},
				scope: me
			}],
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
			case 'openhat' :
				Ext.apply( eventParams, {
					hatNew: postParams.hatNew,
					hatFilerecordId: postParams.hatFilerecordId,
					hatNew_orderRecords: postParams.hatNew_orderRecords
				}) ;
				break ;
				
			case 'opengun' :
				break ;
			
			default :
				return ;
		}
		me.fireEvent('op5broadcast',crmEvent,eventParams) ;
	}
});
