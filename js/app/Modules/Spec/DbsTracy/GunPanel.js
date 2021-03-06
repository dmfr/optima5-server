Ext.define('DbsTracyGun70selectTrspt',{
	extend: 'Ext.data.Model',
	idProperty: 'mvt_carrier',
	fields: [
		{name: 'mvt_carrier', type:'string'},
		{name: 'mvt_carrier_txt', type:'string'},
		{name: 'is_integrateur', type:'boolean'},
		{name: 'count_trspt', type:'int'},
		{name: 'count_parcel', type:'int'},
		{name: 'count_order', type:'int'},
		{name: 'count_order_final', type:'int'},
		{name: 'has_saved', type:'boolean'}
	]
});
Ext.define('DbsTracyGun70transactionSummary',{
	extend: 'Ext.data.Model',
	idProperty: 'hat_filerecord_id',
	fields: [
		{name: 'trspt_filerecord_id', type:'int'},
		{name: 'id_doc', type:'string'},
		{name: 'hat_filerecord_id', type:'int'},
		{name: 'id_hat', type:'string'},
		{name: 'mvt_carrier', type:'string'},
		{name: 'mvt_carrier_txt', type:'string'},
		{name: 'atr_consignee', type:'string'},
		{name: 'atr_consignee_txt', type:'string'},
		{name: 'count_parcel_scan', type:'int'},
		{name: 'count_parcel_total', type:'int'},
		{name: 'count_parcel_trsptpartial', type:'boolean'},
		{name: 'is_warning', type:'boolean'},
		{name: 'is_warning_code', type:'string'},
	]
});

Ext.define('DbsTracyGun60transactionSummary',{
	extend: 'Ext.data.Model',
	idProperty: 'hat_filerecord_id',
	fields: [
		{name: '_idx', type:'int'},
		{name: 'trspt_filerecord_id', type:'int'},
		{name: 'id_doc', type:'string'},
		{name: 'hat_filerecord_id', type:'int'},
		{name: 'id_hat', type:'string'},
		{name: 'atr_consignee', type:'string'},
		{name: 'count_parcel_scan', type:'int'},
		{name: 'count_parcel_total', type:'int'}
	]
});


Ext.define('Optima5.Modules.Spec.DbsTracy.GunPanel',{
	extend:'Ext.panel.Panel',
	requires:[
		'Optima5.Modules.Spec.DbsTracy.GunHelper',
		
		'Optima5.Modules.Spec.DbsTracy.GunMenu',
		'Optima5.Modules.Spec.DbsTracy.GunTracy70',
		'Optima5.Modules.Spec.DbsTracy.GunTracy60'
	],
	
	initComponent: function() {
		Ext.apply(this,{
			layout:'fit',
			border: false,
			items:[{
				xtype:'box',
				cls:'op5-waiting',
				flex:1
			}]
		});
		this.callParent() ;
		
		var helperCache = Optima5.Modules.Spec.DbsTracy.GunHelper ;
		helperCache.init(this.optimaModule) ;
		if( helperCache.isReady ) {
			this.startComponent() ;
		} else {
			this.mon(helperCache,'ready',function(helperCache) {
				this.switchToMainMenu() ;
			},this,{single:true}) ;
		}
		if( this._registerFocus ) {
			helperCache.setRegisterFocus(true) ;
		}
	},
	switchToMainMenu: function() {
		var me = this ;
		var mainMenuView = Ext.create('Optima5.Modules.Spec.DbsTracy.GunMenu',{
			scrollable: 'vertical',
			listeners: {
				actionclick: function( view, actionCode ) {
					me.onActionClick(actionCode) ;
				},
				scope: me
			}
		}) ;
		this.removeAll() ;
		this.add( mainMenuView ) ;
	},
	onActionClick: function( actionCode ) {
		var me = this ;
		//console.log("Action: "+actionCode) ;
		
		switch( actionCode ) {
			case 'gun_tracy60' :
				return me.switchToAppPanel('Optima5.Modules.Spec.DbsTracy.GunTracy60') ;
			case 'gun_tracy70' :
				return me.switchToAppPanel('Optima5.Modules.Spec.DbsTracy.GunTracy70') ;
			default :
				return ;
		}
	},
	switchToAppPanel: function( className, options, noDestroy ) {
		var me = this ;
		
		options = options || {} ;
		Ext.apply(options,{
			optimaModule: me.optimaModule,
			noDestroy: noDestroy
		}) ;
		
		var panel = Ext.create(className,options) ;
		if( !noDestroy ) {
			panel.on('destroy',function() {
				me.switchToMainMenu() ;
			},this) ;
		}
		
		this.removeAll() ;
		this.add( panel ) ;
	},
	onDestroy: function() {
		//Optima5.Modules.Spec.DbsLam.GunHelper.doQzClose() ;
	}
}) ;
