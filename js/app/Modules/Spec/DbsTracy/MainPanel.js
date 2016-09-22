Ext.define('Optima5.Modules.Spec.DbsTracy.MainPanel',{
	extend:'Ext.panel.Panel',
	requires:[
		'Optima5.Modules.Spec.DbsTracy.HelperCache',
		'Optima5.Modules.Spec.DbsTracy.MainMenu',
		'Optima5.Modules.Spec.DbsTracy.FilesGrid',
		'Optima5.Modules.Spec.DbsTracy.TrsptFilePanel',
		'Optima5.Modules.Spec.DbsTracy.OrderFilePanel',
		'Optima5.Modules.Spec.DbsTracy.AttachmentsPanel',
		'Optima5.Modules.Spec.DbsTracy.AttachmentViewerWindow',
		'Optima5.Modules.Spec.DbsTracy.UploadForm',
		'Optima5.Modules.Spec.DbsTracy.ReportForm',
		'Optima5.Modules.Spec.DbsTracy.LivePanel'
	],
	
	_readonlyMode: false,
	
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
		this._readonlyMode = Optima5.Modules.Spec.DbsTracy.HelperCache.authHelperIsReadOnly() ;
		
		if( this._readonlyMode ) {
			return this.switchToAppPanel('Optima5.Modules.Spec.DbsTracy.FilesGrid',{}) ;
		}
		
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
			case 'attachments' :
				return me.switchToAppPanel('Optima5.Modules.Spec.DbsTracy.AttachmentsPanel',{}) ;
			case 'files' :
				return me.switchToAppPanel('Optima5.Modules.Spec.DbsTracy.FilesGrid',{}) ;
			case 'trspt_create' :
				return me.optimaModule.postCrmEvent('opentrspt',{trsptNew:true}) ;
			case 'order_create' :
				return me.optimaModule.postCrmEvent('openorder',{orderNew:true}) ;
			case 'form_upload' :
				return me.openUploadPopup() ;
			case 'form_report' :
				return me.openReportPopup() ;
			case 'panel_live' :
				return me.openLivePanel() ;
			default :
				return ;
		}
	},
	
	switchToAppPanel: function( className, options ) {
		var me = this ;
		
		options = options || {} ;
		Ext.apply(options,{
			optimaModule: me.optimaModule,
			_readonlyMode: this._readonlyMode
		}) ;
		
		var panel = Ext.create(className,options) ;
		panel.on('destroy',function(p) {
			if( !this._readonlyMode ) {
				me.switchToMainMenu() ;
			}
		},this) ;
		
		this.removeAll() ;
		this.add( panel ) ;
	},
	
	
	onCrmeventBroadcast: function(crmEvent, eventParams) {
		switch( crmEvent ) {
			case 'datachange' :
				break ;
			case 'opentrspt' :
				return this.openTrsptFile( eventParams.trsptNew ? 0 : eventParams.trsptFilerecordId, eventParams.trsptNew_orderRecords ) ;
			case 'openorder' :
				return this.openOrderFile( eventParams.orderNew ? 0 : eventParams.orderFilerecordId ) ;
			default: break ;
		}
	},
	openTrsptFile: function(trsptFilerecordId, trsptNew_orderRecords) {
		if( trsptFilerecordId === null ) {
			return ;
		}
		
		// recherche d'une fenetre deja ouverte
		var doOpen = true ;
		this.optimaModule.eachWindow(function(win){
			if( !(win instanceof Optima5.Modules.Spec.DbsTracy.TrsptFilePanel) ) {
				return true ;
			}
			if( win._trsptFilerecordId == trsptFilerecordId ) {
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
			title: '',
			width:1150,
			height:600,
			iconCls: 'op5-crmbase-dataformwindow-icon',
			animCollapse:false,
			
				optimaModule: this.optimaModule,
				_readonlyMode: this._readonlyMode,
				_trsptNew: (trsptFilerecordId==0),
				_trsptFilerecordId: trsptFilerecordId,
				_trsptNew_orderRecords: trsptNew_orderRecords,
				listeners: {
					candestroy: function(w) {
						w.close() ;
					}
				}
		},Optima5.Modules.Spec.DbsTracy.TrsptFilePanel) ;
	},
	openOrderFile: function(orderFilerecordId) {
		if( orderFilerecordId === null ) {
			return ;
		}
		
		// recherche d'une fenetre deja ouverte
		var doOpen = true ;
		this.optimaModule.eachWindow(function(win){
			if( !(win instanceof Optima5.Modules.Spec.DbsTracy.OrderFilePanel) ) {
				return true ;
			}
			if( win._orderFilerecordId == orderFilerecordId ) {
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
				_readonlyMode: this._readonlyMode,
				_orderNew: (orderFilerecordId==0),
				_orderFilerecordId: orderFilerecordId,
				listeners: {
					candestroy: function(w) {
						w.close() ;
					}
				}
		},Optima5.Modules.Spec.DbsTracy.OrderFilePanel) ;
	},
	openUploadPopup: function() {
		this.getEl().mask() ;
		// Open panel
		var createPanel = Ext.create('Optima5.Modules.Spec.DbsTracy.UploadForm',{
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
	openReportPopup: function() {
		this.getEl().mask() ;
		// Open panel
		var createPanel = Ext.create('Optima5.Modules.Spec.DbsTracy.ReportForm',{
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
	openLivePanel: function() {
		// recherche d'une fenetre deja ouverte
		var doOpen = true ;
		this.optimaModule.eachWindow(function(win){
			if( win instanceof Optima5.Modules.Spec.DbsTracy.LivePanel ) {
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
			width:450,
			height:500,
			iconCls: 'op5-crmbase-dataformwindow-icon',
			animCollapse:false,
			
				optimaModule: this.optimaModule,
				listeners: {
					candestroy: function(w) {
						w.close() ;
					}
				}
		},Optima5.Modules.Spec.DbsTracy.LivePanel) ;
	}
}) ;
