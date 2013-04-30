Ext.define('OptimaDesktopCfgModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name: 'session_id',  type:'string'},
		{name: 'login_str',   type: 'boolean'},
		{name: 'login_userName',   type: 'string'},
		{name: 'login_domainName', type: 'string'},
		{name: 'wallpaper_id', type: 'int'}
	]
});


Ext.define('Optima5.App',{
	mixins: {
		observable: 'Ext.util.Observable'
	},
	requires: [
		'Ext.ux.desktop.Desktop',
		'Ext.ux.desktop.ShortcutModel',
		'Optima5.Helper',
		'Optima5.Module',
		'Optima5.LoginWindow'
	],
	
	useQuickTips: true,
	desktopCfgRecord: null,
	moduleInstances: null,
	
	isReady: false,
	
	constructor: function(appCfg) {
		var me = this ;
		
		me.addEvents(
			'ready',
			'beforeunload'
		);
		me.mixins.observable.constructor.call(this, appCfg);
		
		Optima5.Helper.registerApplication(this) ;
		
		if( Optima5.Helper.isReady ) {
			me.onReady() ;
		} else {
			Optima5.Helper.on('ready', function() {
				me.onReady() ;
			},me,{single:true});
		}
		
		return me ;
	},
	
	
	onReady: function() {
		var me = this ;
		Ext.defer(me.startLogin,100,me) ;
	},
	
	startLogin: function() {
		var me = this ;
		
		var existingWin = Ext.getCmp('op5-login-window') ;
		if( existingWin != null ) {
			existingWin.destroy() ;
		}
		
		var loginWindow = Ext.create('Optima5.LoginWindow',{
			id:'op5-login-window'
		}) ;
		loginWindow.on({
			loginfailed: me.onLoginFailed,
			loginsuccess: me.onLoginSuccess,
			scope:me
		}) ;
		loginWindow.show() ;
	},
	onLoginFailed: function(win, errMsg) {
		var me = this ;
		Ext.Msg.alert('Initialization error', errMsg,function(){
			win.recycle() ;
		},me) ;
	},
	onLoginSuccess: function(win, sessionId) {
		var me = this ;
		console.log('SessionID is: '+sessionId) ;
		win.close() ;
		me.desktopBoot(sessionId) ;
	},
	
	
	desktopBoot: function(sessionId) {
		var me = this ;
		
		if( me.loadMask != null ) {
			Ext.destroy(me.loadMask) ;
		}
		me.loadMask = new Ext.LoadMask(Ext.getBody(), {msg:'Loading desktop...'});
		me.loadMask.show() ;
		
		/*
		 * Ajax request to retrieve sessionRecord
		 */
		Ext.Ajax.request({
			url: 'server/backend.php',
			params: {
				_sessionName: sessionId,
				_moduleName: 'desktop',
				_action: 'config_getRecord'
			},
			success: function(response) {
				var errorFn = function() {
					Ext.defer(function(){
						Ext.Msg.alert('Initialization error', 'Cannot boot desktop.\nPlease contact support.', function(){
							window.location.reload() ;
						}) ;
					},500);
					return ;
				}
				var responseObj ;
				
				try {
					responseObj = Ext.decode(response.responseText);
				} catch(e) {
					return errorFn() ;
				}
				
				if( responseObj.success==null || responseObj.success != true ) {
					return errorFn() ;
				}
				
				me.desktopCfgRecord = Ext.create('OptimaDesktopCfgModel',responseObj.desktop_config) ;
				me.desktopBuild() ;
			},
			scope : me
		});
	},
	desktopBuild: function() {
		var me = this ;
		
		/*hide the gear*/
		var el = Ext.get("loading");
		el.hide();
		el.remove();
		
		if (me.useQuickTips) {
			Ext.QuickTips.init();
		}
		
		me.moduleInstances = new Ext.util.MixedCollection();
		
		var modulesLib = Optima5.Helper.getModulesLib() ;
		var iconsLib = Optima5.Helper.getIconsLib() ;
		
		var desktopCfgModelRecord = me.desktopCfgRecord ;
		var desktopCfg = {
			app: me,
			taskbarConfig:{
				startConfig: {
					title:'Damien Mirand',
					iconCls: 'op5-desktop-user',
					height: 300,
					toolConfig: {
						width: 100,
						items: [{
							text:'Settings',
							iconCls: (modulesLib.modulesGetById('settings') != null)?
								iconsLib.iconGetCls16(modulesLib.modulesGetById('settings').get('iconCode')) : 'settings',
							handler: me.onSettings,
							scope: me,
							hidden: desktopCfgModelRecord.get('isAdmin')
						},{
							text:'Logout',
							iconCls:'logout',
							handler: me.onLogout,
							scope: me
						}]
					}
				},
				trayItems: [
					{ xtype: 'trayclock', flex: 1 , timeFormat:'d/m H:i' }
				]
			},
			contextMenuItems: [
				{ text: 'Change Settings', handler: me.onSettings, scope: me, hidden: desktopCfgModelRecord.get('isAdmin') }
			],
			shortcuts: Ext.create('Ext.data.Store', {
				model: 'Ext.ux.desktop.ShortcutModel',
				data: []
			}),
			wallpaper: null ,
			wallpaperStretch: false
		};
		me.desktop = new Ext.ux.desktop.Desktop(desktopCfg);
		
		me.viewport = new Ext.container.Viewport({
			layout: 'fit',
			items: [ me.desktop ]
		});

		Ext.EventManager.on(window, 'beforeunload', me.onUnload, me);
		
		/*hide loadmask (if any)*/
		if( me.loadMask ) {
			Ext.defer(function(){
				Ext.destroy(me.loadMask) ;
			},500,me);
		}
		
		me.isReady = true;
		me.fireEvent('ready', me);
	},
	onUnload : function(e) {
		console.log('Catching beforeunload') ;
		if (this.fireEvent('beforeunload', this) === false) {
			e.stopEvent();
		}
	},
	
	
	moduleLaunch: function( moduleCfg ) {
		if( !moduleCfg.moduleId || Optima5.Helper.getModulesLib().modulesGetById(moduleCfg.moduleId) == null ) {
			Optima5.Helper.logWarning('App:moduleLaunch','Module unknown') ;
			return ;
		}
		
		// same module already started ?
		me.moduleInstances.each( function( moduleInstance ) {
			if( moduleCfg.moduleId == moduleInstance.moduleId
				&& Ext.encode( moduleCfg.moduleParams || {} ) == Ext.encode( moduleInstance.moduleParams )
			) {
				console.log('Same already running !') ;
				// TODO : pop main window for moduleInstance
				return ;
			}
		},me) ;
		
	},
	getModuleByWindow: function( win ) {
		var me = this ;
		
		if( !win.isXType('window') ) {
			win = win.up('window') ;
		}
		if( typeof win === 'undefined' ) {
			Optima5.Helper.logWarning('App:getModuleByWindow','undefined') ;
			return null ;
		}
		
		var parentModule = null 
		me.moduleInstances.each( function( moduleInstance ) {
			if( moduleInstance.hasWindow(win) ) {
				parentModule = moduleInstance ;
				return true ;
			}
		},me) ;
		return parentModule ;
	},
	onModuleStart: function( moduleInstance ) {
		var me = this ;
		me.moduleInstances.add(moduleInstance) ;
		Optima5.Helper.logDebug('App:onModuleStart','Module Started') ;
		Optima5.Helper.logDebug('App:onModuleStart',moduleInstance) ;
	},
	onModuleStop: function( moduleInstance ) {
		var me = this ;
		if( me.moduleInstances.remove(moduleInstance) === false ) {
			console.log('App:onModuleStop : module not found ?') ;
		}
		Optima5.Helper.logDebug('App:onModuleStart','Module Stopped') ;
		Optima5.Helper.logDebug('App:onModuleStart',moduleInstance) ;
	}
	
});