Ext.define('Optima5.Modules.Spec.RsiRecouveo.MainPanel',{
	extend:'Ext.tab.Panel',
	requires:[
		'Optima5.Modules.Spec.RsiRecouveo.HelperCache',
		'Optima5.Modules.Spec.RsiRecouveo.MainMenu',
		'Optima5.Modules.Spec.RsiRecouveo.FilesPanel',
		'Optima5.Modules.Spec.RsiRecouveo.FileDetailPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ConfigPanel',
		'Optima5.Modules.Spec.RsiRecouveo.DevNotepad',
		
		'Optima5.Modules.Spec.RsiRecouveo.EnvPreviewPanel',
		'Optima5.Modules.Spec.RsiRecouveo.EnvDocPreviewPanel',
		'Optima5.Modules.Spec.RsiRecouveo.EnvBrowserPanel',
		
		'Optima5.Modules.Spec.RsiRecouveo.BankPanel',
		
		'Optima5.Modules.Spec.RsiRecouveo.UploadForm'
	],
	
	initComponent: function() {
		var me = this ;
			
		Ext.apply(me,{
			layout:'fit',
			items:[{
				xtype:'box',
				cls:'op5-spec-rsiveo-mainmenu',
				flex:1,
				html: '<div class="op5-spec-rsiveo-logo"></span>' 
			}]
		});
		
		this.on('afterrender', function(){
			Ext.defer(this.onEndAnimation, 500, this) ;
		}, me) ;
		
		this.callParent() ;
		this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
	},
	startAnimation: function() {
		var logoEl = Ext.get( Ext.DomQuery.selectNode('div.op5-spec-rsiveo-logo') );
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
		
		var helperCache = Optima5.Modules.Spec.RsiRecouveo.HelperCache ;
		helperCache.init(me.optimaModule, this.getId()) ;
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
		var mainMenuView = Ext.create('Optima5.Modules.Spec.RsiRecouveo.MainMenu',{
			listeners: {
				actionclick: function( view, actionCode ) {
					me.onActionClick(actionCode) ;
				},
				scope: me
			}
		}) ;
		
		this.removeAll() ;
		this.add( {
			_mainTab: true,
			xtype: 'panel',
			title: 'Menu',
			layout: 'fit',
			cls:'op5-spec-rsiveo-mainmenu',
			items: [mainMenuView],
			closable: true,
			listeners: {
				beforeclose: this.onBeforeCloseMain,
				destroy: this.onCloseMain,
				scope: this
			}
		}) ;
		this.setActiveTab(0) ;
	},
	onActionClick: function( actionCode ) {
		var me = this ;
		//console.log("Action: "+actionCode) ;
		
		switch( actionCode ) {
			case 'files' :
				return me.openFiles() ;
			case 'bank' :
				return me.openBank() ;
			case 'cfg' :
				return me.openConfig() ;
			case 'envbrowser' :
				return me.openEnvelopeBrowser() ;
			case 'notepad' :
				return me.openNotepad() ;
			case 'form_upload' :
				return me.openUploadPopup() ;
			default :
				return ;
		}
	},
	
	openConfig: function() {
		// recherche d'une fenetre deja ouverte
		var doOpen = true ;
		this.optimaModule.eachWindow(function(win){
			if( !(win instanceof Optima5.Modules.Spec.RsiRecouveo.ConfigPanel) ) {
				return true ;
			}
			win.show() ;
			win.focus() ;
			doOpen = false ;
			return false ;
		},this) ;
		if( !doOpen ) {
			return ;
		}
		
		this.optimaModule.createWindow({
			title: 'Recouveo : Configuration',
			width:1300,
			height:520,
			iconCls: 'op5-spec-rsiveo-datatoolbar-edit',
			animCollapse:false,
			
			optimaModule: this.optimaModule
		},Optima5.Modules.Spec.RsiRecouveo.ConfigPanel) ;
	},
	
	
	
	onCrmeventBroadcast: function(crmEvent, eventParams) {
		switch( crmEvent ) {
			case 'datachange' :
				break ;
			case 'openaccount' :
				return this.openFileDetail( eventParams.accId, eventParams.filterAtr, eventParams.focusFileFilerecordId, eventParams.showClosed ) ;
			default: break ;
		}
	},
	
	openFiles: function() {
		// recherche d'une fenetre deja ouverte
		var doOpen = true ;
		this.eachPanel(function(pnl){
			if( !(pnl instanceof Optima5.Modules.Spec.RsiRecouveo.FilesPanel) ) {
				return true ;
			}
			this.focusPanel(pnl) ;
			doOpen = false ;
			return false ;
		},this) ;
		if( !doOpen ) {
			return ;
		}
		
		//open
		var pnl = Ext.create('Optima5.Modules.Spec.RsiRecouveo.FilesPanel',{
			optimaModule: this.optimaModule,
			
			title: 'Dossiers',
			closable: true
		}) ;
		this.addPanel(pnl) ;
		this.focusPanel(pnl) ;
	},
	openFileDetail: function(accId, filterAtr, focusFileFilerecordId, showClosed) {
		if( accId === null ) {
			return ;
		}
		
		// recherche d'une fenetre deja ouverte
		var doOpen = true ;
		this.eachPanel(function(pnl){
			if( !(pnl instanceof Optima5.Modules.Spec.RsiRecouveo.FileDetailPanel) ) {
				return true ;
			}
			if( pnl._accId == accId ) {
				this.focusPanel(pnl) ;
				doOpen = false ;
				return false ;
			}
		},this) ;
		if( !doOpen ) {
			return ;
		}
		
		//open
		var pnl = Ext.create('Optima5.Modules.Spec.RsiRecouveo.FileDetailPanel',{
			optimaModule: this.optimaModule,
			_accId: accId,
			_filterAtr: filterAtr,
			_focusFileFilerecordId: focusFileFilerecordId,
			_showClosed: showClosed,
			
			title: accId,
			closable: true
		}) ;
		this.addPanel(pnl) ;
		this.focusPanel(pnl) ;
	},
	openBank: function() {
		// recherche d'une fenetre deja ouverte
		var doOpen = true ;
		this.eachPanel(function(pnl){
			if( !(pnl instanceof Optima5.Modules.Spec.RsiRecouveo.BankPanel) ) {
				return true ;
			}
			this.focusPanel(pnl) ;
			doOpen = false ;
			return false ;
		},this) ;
		if( !doOpen ) {
			return ;
		}
		
		//open
		var pnl = Ext.create('Optima5.Modules.Spec.RsiRecouveo.BankPanel',{
			optimaModule: this.optimaModule,
			
			title: 'Banque',
			closable: true
		}) ;
		this.addPanel(pnl) ;
		this.focusPanel(pnl) ;
	},
	openEnvelopeBrowser: function() {
		// recherche d'une fenetre deja ouverte
		var doOpen = true ;
		this.eachPanel(function(pnl){
			if( !(pnl instanceof Optima5.Modules.Spec.RsiRecouveo.EnvBrowserPanel) ) {
				return true ;
			}
			this.focusPanel(pnl) ;
			doOpen = false ;
			return false ;
		},this) ;
		if( !doOpen ) {
			return ;
		}
		
		//open
		var pnl = Ext.create('Optima5.Modules.Spec.RsiRecouveo.EnvBrowserPanel',{
			optimaModule: this.optimaModule,
			
			title: 'Enveloppes',
			closable: true
		}) ;
		this.addPanel(pnl) ;
		this.focusPanel(pnl) ;
	},
	openNotepad: function() {
		// recherche d'une fenetre deja ouverte
		var doOpen = true ;
		this.eachPanel(function(pnl){
			if( !(pnl instanceof Optima5.Modules.Spec.RsiRecouveo.DevNotepad) ) {
				return true ;
			}
			this.focusPanel(pnl) ;
			doOpen = false ;
			return false ;
		},this) ;
		if( !doOpen ) {
			return ;
		}
		
		//open
		var pnl = Ext.create('Optima5.Modules.Spec.RsiRecouveo.DevNotepad',{
			optimaModule: this.optimaModule,
			
			title: 'Bloc-notes',
			closable: true
		}) ;
		this.addPanel(pnl) ;
		this.focusPanel(pnl) ;
	},
	
	openUploadPopup: function() {
		this.getEl().mask() ;
		// Open panel
		var createPanel = Ext.create('Optima5.Modules.Spec.RsiRecouveo.UploadForm',{
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
	
	
	eachPanel: function(fn,scope) {
		this.items.each(fn,scope) ;
	},
	focusPanel: function(pnl) {
		this.setActiveItem(pnl) ;
	},
	addPanel: function(panel) {
		this.add(panel) ;
	},
	closeActive: function() {
		if( this.getActiveTab().closable ) {
			this.getActiveTab().close() ;	
		}
	},
	onBeforeCloseMain: function(tab) {
		if( this.allowClose ) {
			return true ;
		}
		var nbOpen = this.items.getCount() ;
		if( nbOpen > 1 ) {
			return false ;
		}
		Ext.Msg.confirm('Fermeture', 'Quitter l\'application ?', function(btn){
			if( btn == 'yes' ){
				this.allowClose = true ;
				tab.close() ;
			}
		},this) ;
		return false ;
	},
	onCloseMain: function() {
		this.destroy() ;
	}
}) ;
