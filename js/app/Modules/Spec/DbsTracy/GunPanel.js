Ext.define('DbsTracyGunTracyPrinter',{
	extend: 'Ext.data.Model',
	idProperty: 'printer_uri',
	fields: [
		{name: 'printer_uri', type:'string'},
		{name: 'printer_type', type:'string'},
		{name: 'printer_spool_ip', type:'string'},
		{name: 'printer_qz_name', type:'string'},
		{name: 'printer_desc', type:'string'}
	]
});
Ext.define('DbsTracyGunTracySelectTrspt',{
	extend: 'Ext.data.Model',
	idProperty: 'mvt_carrier',
	fields: [
		{name: 'mvt_carrier', type:'string'},
		{name: 'mvt_carrier_txt', type:'string'},
		{name: 'is_integrateur', type:'boolean'},
		{name: 'count_trspt', type:'int'},
		{name: 'count_parcel', type:'int'},
		{name: 'count_order', type:'int'},
		{name: 'count_order_final', type:'int'}
	]
});


Ext.define('Optima5.Modules.Spec.DbsTracy.GunPanel',{
	extend:'Ext.panel.Panel',
	requires:[
		'Optima5.Modules.Spec.DbsTracy.GunHelper',
		
		'Optima5.Modules.Spec.DbsTracy.GunMenu',
		'Optima5.Modules.Spec.DbsTracy.GunTracy70'
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
