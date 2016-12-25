Ext.define('Optima5.Modules.Spec.DbsPeople.MainPanel',{
	extend:'Ext.panel.Panel',
	requires:[
		'Optima5.Modules.Spec.DbsPeople.HelperCache',
		'Optima5.Modules.Spec.DbsPeople.MainMenu',
		'Optima5.Modules.Spec.DbsPeople.RhPanel',
		'Optima5.Modules.Spec.DbsPeople.RealPanel',
		'Optima5.Modules.Spec.DbsPeople.RealDayPanel',
		'Optima5.Modules.Spec.DbsPeople.QueryPanel',
		'Optima5.Modules.Spec.DbsPeople.ForecastPanel',
		'Optima5.Modules.Spec.DbsPeople.UploadForm'
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
			this.mon(helperCache,'ready',function() {
				this.switchToMainMenu() ;
			},me,{single:true}) ;
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
		//console.log("Action: "+actionCode) ;
		
		switch( actionCode ) {
			case 'panel_rh' :
				return me.switchToAppPanel('Optima5.Modules.Spec.DbsPeople.RhPanel') ;
			case 'panel_real' :
				return me.switchToAppPanel('Optima5.Modules.Spec.DbsPeople.RealPanel') ;
			case 'panel_realday' :
				return me.switchToAppPanel('Optima5.Modules.Spec.DbsPeople.RealDayPanel') ;
			case 'panel_query' :
				return me.switchToAppPanel('Optima5.Modules.Spec.DbsPeople.QueryPanel',{width: 996}) ;
			case 'panel_upload' :
				return me.openUploadPopup() ;
			case 'panel_forecast' :
				return me.switchToAppPanel('Optima5.Modules.Spec.DbsPeople.ForecastPanel') ;
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
	
	openUploadPopup: function() {
		this.getEl().mask() ;
		// Open panel
		var createPanel = Ext.create('Optima5.Modules.Spec.DbsPeople.UploadForm',{
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
	}
}) ;
