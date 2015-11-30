Ext.define('Optima5.Modules.Spec.DbsInconso.MainPanel',{
	extend:'Ext.panel.Panel',
	requires:[
		'Optima5.Modules.Spec.DbsInconso.HelperCache',
		
		'Optima5.Modules.Spec.DbsInconso.MainMenu'
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
		
		var helperCache = Optima5.Modules.Spec.DbsInconso.HelperCache ;
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
		var mainMenuView = Ext.create('Optima5.Modules.Spec.DbsInconso.MainMenu',{
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
			case 'panel_stock' :
				return me.switchToAppPanel('Optima5.Modules.Spec.DbsInconso.StockPanel',{}) ;
			case 'panel_products' :
				return me.switchToAppPanel('Optima5.Modules.Spec.DbsInconso.ProductsPanel',{}) ;
			case 'panel_live' :
				return me.switchToAppPanel('Optima5.Modules.Spec.DbsInconso.LivePanel',{}) ;
			case 'panel_queryspec' :
				return me.switchToAppPanel('Optima5.Modules.Spec.DbsInconso.QueryspecPanel',{}) ;
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
	}
}) ;