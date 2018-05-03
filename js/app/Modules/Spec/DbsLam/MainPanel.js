Ext.define('Optima5.Modules.Spec.DbsLam.MainPanel',{
	extend:'Ext.panel.Panel',
	requires:[
		'Optima5.Modules.Spec.DbsLam.HelperCache',
		
		'Optima5.Modules.Spec.DbsLam.MainMenu',
		'Optima5.Modules.Spec.DbsLam.LivePanel',
		'Optima5.Modules.Spec.DbsLam.StockPanel',
		'Optima5.Modules.Spec.DbsLam.ProductsPanel',
		'Optima5.Modules.Spec.DbsLam.QueryspecPanel',
		'Optima5.Modules.Spec.DbsLam.CfgPanel',
		'Optima5.Modules.Spec.DbsLam.TransferPanel',
		'Optima5.Modules.Spec.DbsLam.UploadForm',
		
		'Optima5.Modules.Spec.DbsLam.GunPanel',
		
		'Optima5.Modules.Spec.DbsLam.CdePanel'
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
		
		var helperCache = Optima5.Modules.Spec.DbsLam.HelperCache ;
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
		var mainMenuView = Ext.create('Optima5.Modules.Spec.DbsLam.MainMenu',{
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
			case 'panel_stock' :
				return me.switchToAppPanel('Optima5.Modules.Spec.DbsLam.StockPanel',{}) ;
			case 'panel_products' :
				return me.switchToAppPanel('Optima5.Modules.Spec.DbsLam.ProductsPanel',{}) ;
			case 'panel_live' :
				return me.switchToAppPanel('Optima5.Modules.Spec.DbsLam.LivePanel',{}) ;
			case 'panel_queryspec' :
				return me.switchToAppPanel('Optima5.Modules.Spec.DbsLam.QueryspecPanel',{}) ;
			case 'panel_cfg' :
				return me.switchToAppPanel('Optima5.Modules.Spec.DbsLam.CfgPanel',{}) ;
			case 'panel_transfer' :
				return me.switchToAppPanel('Optima5.Modules.Spec.DbsLam.TransferPanel',{}) ;
			case 'panel_cde' :
				return me.openCdeWindow() ;
			case 'form_upload' :
				return me.openUploadPopup() ;
			case 'window_gun' :
				return me.openGunWindow() ;
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
	
	openUploadPopup: function() {
		this.getEl().mask() ;
		// Open panel
		var createPanel = Ext.create('Optima5.Modules.Spec.DbsLam.UploadForm',{
			optimaModule: this.optimaModule,
			width:400, // dummy initial size, for border layout to work
			height:null, // ...
			floating: true,
			draggable: true,
			resizable: true,
			renderTo: this.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				},
				scope: this
			}]
		});
		createPanel.on('saved', function(p) {
			this.doTreeLoad() ;
		},this,{single:true}) ;
		createPanel.on('destroy',function(p) {
			this.getEl().unmask() ;
			this.floatingPanel = null ;
		},this,{single:true}) ;
		
		createPanel.show();
		createPanel.getEl().alignTo(this.getEl(), 'c-c?');
	},
	openGunWindow: function() {
		// recherche d'une fenetre deja ouverte
		var doOpen = true ;
		this.optimaModule.eachWindow(function(win){
			if( win.itemId == 'windowGun' ) {
				win.show() ;
				win.focus() ;
				doOpen = false ;
				return false ;
			}
		},this) ;
		if( !doOpen ) {
			return ;
		}
		
		// new window
		this.optimaModule.createWindow({
			title: 'Live Trspt Validation',
			itemId: 'windowGun',
			width:375,
			height:440,
			iconCls: 'op5-crmbase-dataformwindow-icon',
			animCollapse:false,
			layout: 'fit',
			items:[Ext.create('Optima5.Modules.Spec.DbsLam.GunPanel',{
				border: false,
				optimaModule: this.optimaModule,
				listeners: {
					candestroy: function(w) {
						w.close() ;
					}
				}
			})]
		}) ;
	},
	openCdeWindow: function() {
		// recherche d'une fenetre deja ouverte
		var doOpen = true ;
		this.optimaModule.eachWindow(function(win){
			if( win.itemId == 'windowCde' ) {
				win.show() ;
				win.focus() ;
				doOpen = false ;
				return false ;
			}
		},this) ;
		if( !doOpen ) {
			return ;
		}
		
		// new window
		this.optimaModule.createWindow({
			title: 'Orders',
			itemId: 'windowCde',
			width:1050,
			height:600,
			iconCls: 'op5-crmbase-dataformwindow-icon',
			animCollapse:false,
			layout: 'fit',
			items:[Ext.create('Optima5.Modules.Spec.DbsLam.CdePanel',{
				border: false,
				optimaModule: this.optimaModule,
				listeners: {
					candestroy: function(w) {
						w.close() ;
					}
				}
			})]
		}) ;
	}
}) ;
