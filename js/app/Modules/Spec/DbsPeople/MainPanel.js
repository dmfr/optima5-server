Ext.define('Optima5.Modules.Spec.DbsPeople.MainPanel',{
	extend:'Ext.panel.Panel',
	requires:[
		'Optima5.Modules.Spec.DbsPeople.HelperCache',
		'Optima5.Modules.Spec.DbsPeople.MainMenu',
		'Optima5.Modules.Spec.DbsPeople.RhPanel',
		'Optima5.Modules.Spec.DbsPeople.RealPanel'
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
		
		var helperCache = Optima5.Modules.Spec.DbsPeople.HelperCache ;
		helperCache.init(me.optimaModule) ;
		if( helperCache.isReady ) {
			this.switchToMainMenu() ;
		} else {
			helperCache.on('ready',function() {
				this.switchToMainMenu() ;
			},me) ;
		}
	},
	switchToMainMenu: function() {
		var me = this ;
		var mainMenuView = Ext.create('Optima5.Modules.Spec.DbsPeople.MainMenu',{
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
		console.log("Action: "+actionCode) ;
		
		switch( actionCode ) {
			case 'panel_rh' :
				return me.switchToAppPanel('Optima5.Modules.Spec.DbsPeople.RhPanel') ;
			case 'panel_real' :
				return me.switchToAppPanel('Optima5.Modules.Spec.DbsPeople.RealPanel') ;
			default :
				return ;
		}
	},
	switchToAppPanel: function( className ) {
		var me = this ;
		var panel = Ext.create(className,{
			optimaModule: me.optimaModule,
			listeners: {
				backtomenu: function( panel ) {
					console.log('back to main menu') ;
				},
				scope: me
			}
		}) ;
		
		panel.on('destroy',function() {
			me.switchToMainMenu() ;
		},this) ;
		
		this.removeAll() ;
		this.add( panel ) ;
	}
}) ;