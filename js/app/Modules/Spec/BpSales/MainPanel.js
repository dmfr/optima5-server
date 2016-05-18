Ext.define('Optima5.Modules.Spec.BpSales.MainPanel',{
	extend:'Ext.panel.Panel',
	requires:[
		'Optima5.Modules.Spec.BpSales.HelperCache',
		'Optima5.Modules.Spec.BpSales.MainMenu',
		'Optima5.Modules.Spec.BpSales.OrdersGrid',
		'Optima5.Modules.Spec.BpSales.InvoicePanel'
	],
	
	initComponent: function() {
		var me = this ;
			
		Ext.apply(me,{
			layout:'fit',
			items:[{
				xtype:'box',
				cls:'op5-spec-bpsales-mainmenu',
				flex:1,
				html: '<div class="op5-spec-bpsales-logo"></span>' 
			}]
		});
		
		this.on('afterrender', function(){
			Ext.defer(this.onEndAnimation, 500, this) ;
		}, me) ;
		
		this.callParent() ;
		this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
	},
	startAnimation: function() {
		var logoEl = Ext.get( Ext.DomQuery.selectNode('div.op5-spec-bpsales-logo') );
		logoEl.animate({
			duration: 1000,
			to: {
				opacity: 1
			}
		});
		Ext.defer( this.onEndAnimation, 2000, this) ;
	},
	onEndAnimation: function() {
		var me = this ;
		
		var helperCache = Optima5.Modules.Spec.BpSales.HelperCache ;
		helperCache.init(me.optimaModule) ;
		if( helperCache.isReady ) {
			this.switchToMainMenu() ;
		} else {
			this.mon(helperCache,'ready',function() {
				this.switchToMainMenu() ;
			},me,{single:true}) ;
		}
	},
	switchToMainMenu: function() {
		var me = this ;
		var mainMenuView = Ext.create('Optima5.Modules.Spec.BpSales.MainMenu',{
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
			case 'orders' :
				return me.switchToAppPanel('Optima5.Modules.Spec.BpSales.OrdersGrid',{}) ;
			default :
				return ;
		}
	},
	
	switchToAppPanel: function( className, options ) {
		var me = this ;
		
		options = options || {} ;
		Ext.apply(options,{
			optimaModule: me.optimaModule
		}) ;
		
		var panel = Ext.create(className,options) ;
		panel.on('destroy',function() {
			me.switchToMainMenu() ;
		},this) ;
		
		this.removeAll() ;
		this.add( panel ) ;
	},
	
	onCrmeventBroadcast: function(crmEvent, eventParams) {
		switch( crmEvent ) {
			case 'datachange' :
				break ;
			case 'openinv' :
				return this.openInvFile( eventParams.invFilerecordId ) ;
			default: break ;
		}
	},
	openInvFile: function(invFilerecordId) {
		if( invFilerecordId === null ) {
			return ;
		}
		
		// recherche d'une fenetre deja ouverte
		var doOpen = true ;
		this.optimaModule.eachWindow(function(win){
			if( !(win instanceof Optima5.Modules.Spec.BpSales.InvoicePanel) ) {
				return true ;
			}
			if( win._invFilerecordId == invFilerecordId ) {
				win.show() ;
				win.focus() ;
				doOpen = false ;
				return false ;
			}
		},this) ;
		if( !doOpen ) {
			return ;
		}
		
		//title
		
		
		// new window
		this.optimaModule.createWindow({
			title: '',
			width:1150,
			height:600,
			iconCls: 'op5-crmbase-dataformwindow-icon',
			animCollapse:false,
			
				optimaModule: this.optimaModule,
				_invFilerecordId: invFilerecordId,
				listeners: {
					candestroy: function(w) {
						w.close() ;
					}
				}
		},Optima5.Modules.Spec.BpSales.InvoicePanel) ;
	}
}) ;
