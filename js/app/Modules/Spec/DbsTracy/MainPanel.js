Ext.define('Optima5.Modules.Spec.DbsTracy.MainPanel',{
	extend:'Ext.panel.Panel',
	requires:[
		'Optima5.Modules.Spec.DbsTracy.HelperCache',
		'Optima5.Modules.Spec.DbsTracy.MainMenu',
		'Optima5.Modules.Spec.DbsTracy.TrsptFilesGrid',
		'Optima5.Modules.Spec.DbsTracy.TrsptFilePanel',
		'Optima5.Modules.Spec.DbsTracy.FilesGrid'
	],
	
	initComponent: function() {
		var me = this ;
			
		Ext.apply(me,{
			layout:'fit',
			items:[{
				xtype:'box',
				cls:'op5-spec-dbstracy-mainmenu',
				flex:1,
				html: '<div class="op5-spec-dbstracy-logo"></span>' 
			}]
		});
		
		this.on('afterrender', function(){
			Ext.defer(this.onEndAnimation, 500, this) ;
		}, me) ;
		
		this.callParent() ;
		this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
	},
	startAnimation: function() {
		var logoEl = Ext.get( Ext.DomQuery.selectNode('div.op5-spec-dbstracy-logo') );
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
		
		var helperCache = Optima5.Modules.Spec.DbsTracy.HelperCache ;
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
		var mainMenuView = Ext.create('Optima5.Modules.Spec.DbsTracy.MainMenu',{
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
			case 'trspt_files' :
				return me.switchToAppPanel('Optima5.Modules.Spec.DbsTracy.TrsptFilesGrid',{}) ;
			case 'trspt_create' :
				return me.optimaModule.postCrmEvent('opentrspt',{trsptNew:true}) ;
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
		panel.on('destroy',function(p) {
			me.switchToMainMenu() ;
		},this) ;
		
		this.removeAll() ;
		this.add( panel ) ;
	},
	
	
	onCrmeventBroadcast: function(crmEvent, eventParams) {
		switch( crmEvent ) {
			case 'datachange' :
				break ;
			case 'opentrspt' :
				return this.openTrsptFile( eventParams.trsptNew ? 0 : eventParams.trsptFilerecordId ) ;
			case 'openorder' :
				return this.openOrderFile( eventParams.orderNew ? 0 : eventParams.orderFilerecordId ) ;
			default: break ;
		}
	},
	openTrsptFile: function(trsptFilerecordId) {
		if( trsptFilerecordId === null ) {
			return ;
		}
		// new window
		this.optimaModule.createWindow({
			title: 'Create new shipping',
			width:1150,
			height:600,
			iconCls: 'op5-crmbase-dataformwindow-icon',
			animCollapse:false,
			border: false,
			items: Ext.create('Optima5.Modules.Spec.DbsTracy.TrsptFilePanel',{
				optimaModule: this.optimaModule
			})
		}) ;
	},
	openOrderFile: function(orderFilerecordId) {
		if( orderFilerecordId === null ) {
			return ;
		}
		// new window
		this.optimaModule.createWindow({
			title: 'Create new order',
			width:1150,
			height:600,
			iconCls: 'op5-crmbase-dataformwindow-icon',
			animCollapse:false,
			border: false,
			items: Ext.create('Optima5.Modules.Spec.DbsTracy.OrderFilePanel',{
				optimaModule: this.optimaModule
			})
		}) ;
	},
}) ;
