Ext.define('Optima5.Modules.Spec.WbSales.MainPanel',{
	extend:'Ext.panel.Panel',
	requires:[
		'Optima5.Modules.Spec.WbSales.HelperCache',
		'Optima5.Modules.Spec.WbSales.MainMenu',
		'Optima5.Modules.Spec.WbSales.QueryPanel'
	],
	
	initComponent: function() {
		var me = this ;
			
		Ext.apply(me,{
			layout:'fit',
			items:[{
				xtype:'box',
				cls:'op5-spec-wbsales-mainmenu',
				flex:1,
				html: '<div class="op5-spec-wbsales-logo"></span>' 
			}]
		});
		
		this.on('afterrender', function(){
			Ext.defer(this.onEndAnimation, 500, this) ;
		}, me) ;
		
		this.callParent() ;
	},
	startAnimation: function() {
		var logoEl = Ext.get( Ext.DomQuery.selectNode('div.op5-spec-wbsales-logo') );
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
		
		var helperCache = Optima5.Modules.Spec.WbSales.HelperCache ;
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
		var mainMenuView = Ext.create('Optima5.Modules.Spec.WbSales.MainMenu',{
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
			case 'query' :
				return me.switchToAppPanel('Optima5.Modules.Spec.WbSales.QueryPanel',{width: 800}) ;
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
	}
}) ;