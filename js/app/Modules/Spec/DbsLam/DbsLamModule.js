Ext.define('DbsLamCfgMvtStepModel',{
	extend: 'Ext.data.Model',
	idProperty: 'step_code',
	fields: [
		{name: 'step_code', type:'string'},
		{name: 'step_txt', type:'string'},
		{name: 'is_checklist', type: 'boolean'},
		{name: 'is_attach_parent', type:'boolean'},
		{name: 'is_final', type:'boolean'},
		{name: 'is_print', type:'boolean'}
	]
});
Ext.define('DbsLamCfgChecklistModel',{
	extend: 'Ext.data.Model',
	idProperty: 'check_code',
	fields: [
		{name: 'check_code', type:'string'},
		{name: 'check_txt', type:'string'}
	]
});
Ext.define('DbsLamCfgMvtFlowModel',{
	extend: 'Ext.data.Model',
	idProperty: 'flow_code',
	fields: [
		{name: 'flow_code', type:'string'},
		{name: 'flow_txt', type:'string'},
		{name: 'is_foreign', type:'boolean'}
	],
	hasMany: [{
		model: 'DbsLamCfgMvtStepModel',
		name: 'steps',
		associationKey: 'steps'
	},{
		model: 'DbsLamCfgChecklistModel',
		name: 'checks',
		associationKey: 'checks'
	}]
});


Ext.define('DbsLamCfgSocAttributeModel',{
	extend: 'Ext.data.Model',
	idProperty: 'atr_code',
	fields: [
		{name: 'atr_code', type:'string', useNull:true},
		{name: 'atr_txt', type:'string'},
		{name: 'is_bible', type:'boolean'},
		{name: 'use_prod', type:'boolean'},
		{name: 'use_prod_multi', type:'boolean'},
		{name: 'use_stock', type:'boolean'},
		{name: 'cfg_is_hidden', type:'boolean'},
		{name: 'cfg_is_editable', type:'boolean'},
		{name: 'use_adr', type:'boolean'},
		{name: 'use_adr_multi', type:'boolean'},
		{name: 'adr_is_optional', type:'boolean'},
		{name: 'adr_is_mismatch', type:'boolean'}
	]
});
Ext.define('DbsLamCfgSocModel',{
	extend: 'Ext.data.Model',
	idProperty: 'soc_code',
	fields: [
		{name: 'soc_code', type:'string', useNull:true},
		{name: 'soc_txt', type:'string'},
		{name: 'location_policy_ifexists', type:'string'}
	],
	hasMany: [{
		model: 'DbsLamCfgSocAttributeModel',
		name: 'attributes',
		associationKey: 'attributes'
	}]
});

Ext.define('DbsLamCfgWhseModel',{
	extend: 'Ext.data.Model',
	idProperty: 'whse_code',
	fields: [
		{name: 'whse_code', type:'string', useNull:true},
		{name: 'whse_code', type:'string'}
	]
});

Ext.define('DbsLamCfgContainerTypeModel',{
	extend: 'Ext.data.Model',
	idProperty: 'container_type',
	fields: [
		{name: 'container_type', type:'string', useNull:true},
		{name: 'container_type_txt', type:'string'}
	]
});

Ext.define('Optima5.Modules.Spec.DbsLam.DbsLamModule', {
	extend: 'Optima5.Module',
	requires: [
		'Optima5.Modules.Spec.DbsLam.MainPanel'
	],
	
	moduleParams: null,
	
	initModule: function() {
		var me = this ;
		
		me.createWindow({
			width:1100,
			height:600,
			resizable:true,
			layout:'fit',
			border: false,
			items:[Ext.create('Optima5.Modules.Spec.DbsLam.MainPanel',{
				optimaModule: me
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
			
			default :
				return ;
		}
		me.fireEvent('op5broadcast',crmEvent,eventParams) ;
	}
});
