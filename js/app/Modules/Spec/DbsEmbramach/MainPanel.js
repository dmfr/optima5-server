Ext.define('Optima5.Modules.Spec.DbsEmbramach.MainPanel',{
	extend:'Ext.panel.Panel',
	requires:[
		'Optima5.Modules.Spec.DbsEmbramach.HelperCache',
		'Optima5.Modules.Spec.DbsEmbramach.MainMenu',
		'Optima5.Modules.Spec.DbsEmbramach.MachPanel',
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
		this.removeAll() ;
		this.add( mainMenuView ) ;
	},
	onActionClick: function( actionCode ) {
		var me = this ;
		//console.log("Action: "+actionCode) ;
		
		var _readonlyMode = !( Optima5.Modules.Spec.DbsEmbramach.HelperCache.authHelperQueryPage('ALL') ) ;
		
		switch( actionCode ) {
			case 'panel_mach_picking' :
				return me.switchToAppPanel('Optima5.Modules.Spec.DbsEmbramach.MachPanel',{flowCode: 'PICKING', _readonlyMode:_readonlyMode}) ;
			case 'panel_report' :
				return me.switchToAppPanel('Optima5.Modules.Spec.DbsEmbramach.ReportPanel',{_readonlyMode:_readonlyMode}) ;
			case 'panel_mach_inbound' :
				if( _readonlyMode ) {
					Ext.Msg.alert('MachPanel Inbound', 'Not published, work in progress');
					return ;
				}
				return me.switchToAppPanel('Optima5.Modules.Spec.DbsEmbramach.MachPanel',{flowCode: 'INBOUND', _readonlyMode:_readonlyMode}) ;
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