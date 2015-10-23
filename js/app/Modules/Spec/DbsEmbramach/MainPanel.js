Ext.define('Optima5.Modules.Spec.DbsEmbramach.MainPanel',{
	extend:'Ext.panel.Panel',
	requires:[
		'Optima5.Modules.Spec.DbsEmbramach.HelperCache',
		'Optima5.Modules.Spec.DbsEmbramach.MainMenu',
		'Optima5.Modules.Spec.DbsEmbramach.MachPanel',
		'Optima5.Modules.Spec.DbsEmbramach.MachAdminPanel',
		'Optima5.Modules.Spec.DbsEmbramach.ReportPanel',
		'Optima5.Modules.Spec.DbsEmbramach.QueryPanel'
	],
	
	initComponent: function() {
		var me = this ;
			
		Ext.apply(me,{
			layout:'fit',
			border: false,
			items:[{
				xtype:'box',
				cls:'op5-waiting',
				flex:1
			}]
		});
		
		this.callParent() ;
		
		var helperCache = Optima5.Modules.Spec.DbsEmbramach.HelperCache ;
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
		var mainMenuView = Ext.create('Optima5.Modules.Spec.DbsEmbramach.MainMenu',{
			listeners: {
				actionclick: function( view, actionCode ) {
					me.onActionClick(actionCode) ;
				},
				scope: me
			}
		}) ;
		if( !Optima5.Modules.Spec.DbsEmbramach.HelperCache.authHelperQueryPage('ALL') ) {
			return this.switchToAppPanel('Optima5.Modules.Spec.DbsEmbramach.MachAdminPanel',{flowCode: 'PICKING',_readonlyMode:true},true) ;
		}
		this.removeAll() ;
		this.add( mainMenuView ) ;
	},
	onActionClick: function( actionCode ) {
		var me = this ;
		//console.log("Action: "+actionCode) ;
		
		switch( actionCode ) {
			case 'panel_mach' :
				return me.switchToAppPanel('Optima5.Modules.Spec.DbsEmbramach.MachAdminPanel',{flowCode: 'PICKING'}) ;
			case 'panel_report' :
				return me.switchToAppPanel('Optima5.Modules.Spec.DbsEmbramach.ReportPanel',{}) ;
			case 'panel_query_mb51' :
				return me.switchToAppPanel('Optima5.Modules.Spec.DbsEmbramach.QueryPanel',{qType:'query', queryId:'Report::ZMB51::Synthese'}) ;
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