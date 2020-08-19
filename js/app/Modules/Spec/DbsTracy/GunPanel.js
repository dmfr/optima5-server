Ext.define('Optima5.Modules.Spec.DbsTracy.GunPanel',{
	extend:'Ext.panel.Panel',
	requires:[
		//'Optima5.Modules.Spec.DbsTracy.GunHelper',
		
		'Optima5.Modules.Spec.DbsTracy.GunMenu'
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
		
		/*
		var helperCache = Optima5.Modules.Spec.DbsTracy.GunHelper ;
		helperCache.init(this.optimaModule) ;
		if( helperCache.isReady ) {
			this.startComponent() ;
		} else {
			this.mon(helperCache,'ready',function(helperCache) {
				this.switchToMainMenu() ;
			},this,{single:true}) ;
		}
		*/
		Ext.defer(function() {
			this.switchToMainMenu() ;
		},1000,this) ;
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
