Ext.define('Optima5.Modules.Spec.RsiRecouveo.MainPanel',{
	extend:'Ext.panel.Panel',
	requires:[
		'Optima5.Modules.Spec.RsiRecouveo.HelperCache',
		'Optima5.Modules.Spec.RsiRecouveo.MainMenu',
		'Optima5.Modules.Spec.RsiRecouveo.FilesPanel',
		'Optima5.Modules.Spec.RsiRecouveo.FileDetailPanel',
		'Optima5.Modules.Spec.RsiRecouveo.CfgPanel'
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
		this.add( mainMenuView ) ;
	},
	onActionClick: function( actionCode ) {
		var me = this ;
		//console.log("Action: "+actionCode) ;
		
		switch( actionCode ) {
			case 'files' :
				return me.switchToAppPanel('Optima5.Modules.Spec.RsiRecouveo.FilesPanel',{}) ;
			case 'cfg' :
				return me.switchToAppPanel('Optima5.Modules.Spec.RsiRecouveo.CfgPanel',{}) ;
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
			case 'openfile' :
				return this.openFileDetail( eventParams.fileNew ? 0 : eventParams.fileFilerecordId ) ;
			case 'openaccount' :
				return this.openFileDetail( eventParams.accId, eventParams.filterAtr, eventParams.focusFileFilerecordId ) ;
			default: break ;
		}
	},
	openFileDetail: function(accId, filterAtr, focusFileFilerecordId) {
		if( accId === null ) {
			return ;
		}
		
		// recherche d'une fenetre deja ouverte
		var doOpen = true ;
		this.optimaModule.eachWindow(function(win){
			if( !(win instanceof Optima5.Modules.Spec.RsiRecouveo.FileDetailPanel) ) {
				return true ;
			}
			if( win._accId == accId ) {
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
			width:1310,
			height:700,
			iconCls: 'op5-crmbase-dataformwindow-icon',
			animCollapse:false,
			
				optimaModule: this.optimaModule,
				_accId: accId,
				_filterAtr: filterAtr,
				_focusFileFilerecordId: focusFileFilerecordId,
				listeners: {
					candestroy: function(w) {
						w.close() ;
					}
				}
		},Optima5.Modules.Spec.RsiRecouveo.FileDetailPanel) ;
	}
}) ;
