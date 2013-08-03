Ext.define('OptimaDesktopCfgShortcutParamModel',{
	extend: 'Ext.data.Model',
	idProperty: 'param_code',
	fields: [
		{name: 'param_code',  type:'string'},
		{name: 'param_value',    type:'string'}
	]
});
Ext.define('OptimaDesktopCfgShortcutModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name: 'module_id',  type:'string'}
	],
	hasMany: [{
		model: 'OptimaDesktopCfgShortcutParamModel',
		name: 'params',
		associationKey: 'params'
	}]
});
Ext.define('OptimaDesktopCfgSdomainModel',{
	extend: 'Ext.data.Model',
	idProperty: 'sdomain_id',
	fields: [
		{name: 'sdomain_id',  type:'string'},
		{name: 'sdomain_name',    type:'string'},
		{name: 'module_id',    type:'string'},
		{name: 'icon_code',    type:'string'},
		{name: 'auth_has_all', type:'boolean'},
		{name: 'auth_arrOpenActions', type:'auto'},
		{name: 'db_needUpdate', type:'boolean'}
	]
});
Ext.define('OptimaDesktopCfgModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name: 'session_id',  type:'string'},
		{name: 'dev_mode',    type:'boolean'},
		{name: 'auth_is_admin',    type:'boolean'},
		{name: 'auth_is_root',    type:'boolean'},
		{name: 'login_str',   type: 'boolean'},
		{name: 'login_userId',   type: 'string'},
		{name: 'login_userName',   type: 'string'},
		{name: 'login_domainName', type: 'string'},
		{name: 'wallpaper_id', type: 'int'},
		{name: 'wallpaper_isStretch', type: 'boolean'}
	],
	hasMany: [{
		model: 'OptimaDesktopCfgSdomainModel',
		name: 'sdomains',
		associationKey: 'sdomains'
	},{
		model: 'OptimaDesktopCfgShortcutModel',
		name: 'shortcuts',
		associationKey: 'shortcuts'
	}]
});


Ext.define('OptimaDesktopShortcutModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name: 'name'},
		{name: 'iconCls'},
		{name: 'execRecord'}
	]
});


Ext.define('Optima5.App',{
	mixins: {
		observable: 'Ext.util.Observable'
	},
	requires: [
		'Ext.ux.desktop.Desktop',
		'Ext.ux.dams.ModelManager',
		'Optima5.Helper',
		'Optima5.Module',
		'Optima5.LoginWindow',
		'Optima5.Desktop'
	],
	
	useQuickTips: true,
	
	desktopSessionId: null,
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
		//console.log('SessionID is: '+sessionId) ;
		win.close() ;
		me.desktopBoot(sessionId) ;
	},
	
	desktopGetBackendUrl: function() {
		return 'server/backend.php' ;
	},
	desktopGetSessionId: function() {
		var me = this ;
		return me.desktopSessionId ;
	},
	desktopGetCfgRecord: function() {
		var me = this ;
		return me.desktopCfgRecord ;
	},
	desktopBoot: function(sessionId) {
		var me = this ;
		
		Ext.getBody().mask('Loading desktop...') ;
		
		/*
		 * Ajax request to retrieve sessionRecord
		 */
		Ext.Ajax.request({
			url: me.desktopGetBackendUrl(),
			params: {
				_sessionId: sessionId,
				_moduleId: 'desktop',
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
				
				me.desktopSessionId = sessionId ;
				me.desktopCfgRecord = Ext.ux.dams.ModelManager.create('OptimaDesktopCfgModel',responseObj.desktop_config) ;
				me.desktopCreate() ;
			},
			scope : me
		});
	},
	desktopBuildCfg: function() {
		var me = this ;
		if( me.desktopCfgRecord == null ) {
			return null ;
		}
		
		var modulesLib = Optima5.Helper.getModulesLib() ;
		var iconsLib = Optima5.Helper.getIconsLib() ;
		var desktopCfgModelRecord = me.desktopCfgRecord ;
		
		var sdomainItems = [] ;
		if( me.desktopCfgRecord.get('auth_is_admin') ) {
			// Ajout de l'applet Admin
			var adminModuleRecord = modulesLib.modulesGetById('admin') ;
			var adminModuleExec = Ext.ux.dams.ModelManager.create('OptimaModuleExecModel',{
				moduleId: adminModuleRecord.get('moduleId'),
				params:[]
			}) ;
			sdomainItems.push({
				text: '<b>'+adminModuleRecord.get('moduleName')+'</b>',
				iconCls: iconsLib.iconGetCls16(adminModuleRecord.get('iconCode')),
				handler : me.onModuleItemClick,
				moduleExecRecord : adminModuleExec,
				scope: me
			}) ;
			sdomainItems.push('-') ;
		}
		if( true ) {
			me.desktopCfgRecord.sdomains().each( function(sdomainRecord) {
				var moduleExec = Ext.ux.dams.ModelManager.create('OptimaModuleExecModel',{
					moduleId: sdomainRecord.get('module_id'),
					params:[{paramCode:'sdomain_id',paramValue:sdomainRecord.get('sdomain_id')}]
				}) ;
				sdomainItems.push({
					text: '<b>'+sdomainRecord.get('sdomain_id').toUpperCase()+'</b>&nbsp;&nbsp;:&nbsp;&nbsp;'+sdomainRecord.get('sdomain_name'),
					iconCls: iconsLib.iconGetCls16(sdomainRecord.get('icon_code')),
					handler : me.onModuleItemClick,
					moduleExecRecord : moduleExec,
					scope: me
				}) ;
			},me) ;
		}
		
		var appletItems = [] ;
		Ext.Array.each( modulesLib.modulesGetAll() , function( moduleDescRecord ) {
			if( moduleDescRecord.get('enabled') && moduleDescRecord.get('moduleType') == 'applet' ) {
				var moduleExec = Ext.ux.dams.ModelManager.create('OptimaModuleExecModel',{
					moduleId: moduleDescRecord.get('moduleId'),
					params:[]
				}) ;
				appletItems.push({
					text: moduleDescRecord.get('moduleName'),
					iconCls: iconsLib.iconGetCls16(moduleDescRecord.get('iconCode')),
					handler : me.onModuleItemClick,
					moduleExecRecord : moduleExec,
					scope: me
				}) ;
			}
		},me);
		if( appletItems.length > 0 ) {
			appletItems.push('-') ;
		}
		appletItems.push({
			text:'Settings',
			iconCls: (modulesLib.modulesGetById('settings') != null)?
				iconsLib.iconGetCls16(modulesLib.modulesGetById('settings').get('iconCode')) : 'settings',
			handler: me.onSettings,
			scope: me,
			hidden: desktopCfgModelRecord.get('auth_is_root')
		}) ;
		appletItems.push({
			text:'Logout',
			iconCls:'op5-desktop-logout',
			handler: me.onLogout,
			scope: me
		}) ;
		
		var shortcutsData = [] ;
		me.desktopCfgRecord.shortcuts().each( function(shortcutRecord) {
			var name, iconCls, execRecord ;
			var moduleDescRecord = modulesLib.modulesGetById(shortcutRecord.get('module_id')) ;
			switch( moduleDescRecord.get('moduleType') ) {
				case 'sdomain' :
					var shortcutParamRecord = shortcutRecord.params().getById('sdomain_id') ;
					if( shortcutParamRecord == null ) {
						return ;
					}
					var sdomainId = shortcutParamRecord.get('param_value') ;
					if( me.desktopCfgRecord.sdomains().getById(sdomainId) == null ) {
						return ;
					}
					iconCls = iconsLib.iconGetCls48(me.desktopCfgRecord.sdomains().getById(sdomainId).get('icon_code')) ;
					name = me.desktopCfgRecord.sdomains().getById(sdomainId).get('sdomain_name') ;
					break ;
					
				default :
					iconCls = iconsLib.iconGetCls48(moduleDescRecord.get('iconCode')) ;
					name = moduleDescRecord.get('moduleName') ;
					break ;
			}
			
			var moduleParams = [] ;
			shortcutRecord.params().each( function(shortcutParamRecord) {
				moduleParams.push({
					paramCode: shortcutParamRecord.get('param_code'),
					paramValue: shortcutParamRecord.get('param_value')
				});
			},me) ;
			execRecord = Ext.ux.dams.ModelManager.create('OptimaModuleExecModel',{
				moduleId: moduleDescRecord.get('moduleId'),
				params:moduleParams
			}) ;
			
			shortcutsData.push({
				name: name,
				iconCls: iconCls,
				execRecord: execRecord
			});
			
		},me);
		
		
		var desktopCfg = {
			app: me,
			taskbarConfig:{
				startConfig: {
					title:desktopCfgModelRecord.get('login_userName')+' <b>@</b> '+desktopCfgModelRecord.get('login_domainName'),
					iconCls: 'op5-desktop-user',
					height: 300,
					menu : sdomainItems,
					toolConfig: {
						width: 100,
						defaults: {
							textAlign:'left'
						},
						items: appletItems
					}
				},
				trayItems: [
					{ xtype: 'trayclock', flex: 1 , timeFormat:'d/m H:i' }
				]
			},
			contextMenuItems: [
				{ text: 'Change Settings', handler: me.onSettings, scope: me, hidden: desktopCfgModelRecord.get('auth_is_root') }
			],
			shortcuts: Ext.create('Ext.data.Store', {
				model: 'OptimaDesktopShortcutModel',
				data: shortcutsData
			}),
			wallpaper: null ,
			wallpaperStretch: false
		};
		
		return desktopCfg ;
	},
	desktopCreate: function() {
		var me = this ;
		
		/*hide the gear*/
		var el = Ext.get("loading");
		el.hide();
		el.remove();
		
		if (me.useQuickTips) {
			Ext.QuickTips.init();
		}
		
		me.moduleInstances = new Ext.util.MixedCollection();
		
		me.desktop = new Optima5.Desktop(me.desktopBuildCfg());
		
		me.viewport = new Ext.container.Viewport({
			layout: 'fit',
			items: [ me.desktop ],
			cls: me.desktopCfgRecord.get('dev_mode') ? 'op5-viewport-devborder':''
		});
		
		me.setWallpaper( me.desktopCfgRecord.get('wallpaper_id') || 0,
			me.desktopCfgRecord.get('wallpaper_id') ? me.desktopCfgRecord.get('wallpaper_isStretch') : true
		) ;
		
		Ext.EventManager.on(window, 'beforeunload', me.onUnload, me);
		
		/*hide mask (if any)*/
		Ext.defer(function(){
			Ext.getBody().unmask() ;
		},500,me);
		
		me.isReady = true;
		me.fireEvent('ready', me);
	},
	getDesktop: function() {
		var me = this ;
		return me.desktop ;
	},
	desktopReloadCfg: function( callback, callbackScope, callbackArguments ) {
		var me = this ;
		/*
		 * Ajax request to retrieve sessionRecord
		 */
		Ext.Ajax.request({
			url: me.desktopGetBackendUrl(),
			params: {
				_sessionId: me.desktopGetSessionId(),
				_moduleId: 'desktop',
				_action: 'config_getRecord'
			},
			success: function(response) {
				var responseObj ;
				
				try {
					responseObj = Ext.decode(response.responseText);
				} catch(e) {
					return ;
				}
				
				if( responseObj.success==null || responseObj.success != true ) {
					return ;
				}
				
				me.desktopCfgRecord = Ext.ux.dams.ModelManager.create('OptimaDesktopCfgModel',responseObj.desktop_config) ;
				if( callback == null ) {
					callback = Ext.emptyFn ;
				}
				callback.call( me, callbackArguments ) ;
			},
			scope : me
		});
	},
	desktopReloadSdomains: function() {
		var me = this ;
		
		me.desktopReloadCfg(function() {
			var newDesktopConfig = me.desktopBuildCfg() ;
			
			// Refresh shortcuts data view
			var shortcutsView = me.desktop.shortcutsView ;
			shortcutsView.getStore().loadData( newDesktopConfig.shortcuts.getRange() ) ;
			shortcutsView.refresh() ;
			
			// Refresh startmenu
			me.desktop.taskbar.startMenu.menu.removeAll() ;
			me.desktop.taskbar.startMenu.menu.add( newDesktopConfig.taskbarConfig.startConfig.menu ) ;
		},me,[]) ;
	},
	desktopReloadWallpaper: function() {
		var me = this ;
		
		me.desktopReloadCfg(function() {
			me.setWallpaper( me.desktopCfgRecord.get('wallpaper_id') || 0,
				me.desktopCfgRecord.get('wallpaper_id') ? me.desktopCfgRecord.get('wallpaper_isStretch') : true
			) ;
		},me,[]) ;
	},
	setWallpaper : function(wallpId, isStretch){
		var me = this ;
		
		if( me.desktopCfgRecord == null ) {
			me.desktop.setWallpaper( '' , false ) ;
		}
		
		var getParams = {
			_sessionId: me.desktopCfgRecord.get('session_id'),
			wallpaper_id: wallpId
		};
		var wallpUrl = 'wallpapers/wallpaper.php?' + Ext.Object.toQueryString(getParams) ;
		
		me.desktop.setWallpaper( wallpUrl , isStretch ) ;
		/*
		 * Background w/ css:
		 * http://stackoverflow.com/questions/1150163/stretch-and-scale-a-css-image-in-the-background-with-css-only
		 */
	},
	forceCloseAllWindows: function() {
		var me = this ;
		
		var nbOpen = 0 ;
		if( zmgr = this.desktop.getDesktopZIndexManager() ) {
			zmgr.eachBottomUp(function(win) {
				if( win.isWindow && !(win instanceof Ext.window.MessageBox) ) {
					nbOpen++ ;
				}
			});
		}
		
		var nbClosed = 0 ;
		me.eachModuleInstance( function(moduleInstance) {
			moduleInstance.eachWindow( function(window) {
				window.destroy() ;
				nbClosed++ ;
			},me);
		},me) ;
		
		if( nbOpen != nbClosed ) {
			Optima5.Helper.logWarning('App:forceCloseAllWindows','NbOpen:'+nbOpen+', NbClosed:'+nbClosed+' : Leaked Window(s)') ;
			return false ;
		}
		return true ;
	},
	alignNewWindow: function(win) {
		var newPosX = curPosX = win.getPosition()[0] ,
			newPosY = curPosY = win.getPosition()[1] ;
		if( win.optimaModule.sdomainId && win.optimaModule.sdomainId != '' && win.isMainWindow ) {
			newPosX = 70 ;
			newPosY = 40 ;
		}
		if( zmgr = this.desktop.getDesktopZIndexManager() ) {
			var tArr ;
			zmgr.eachBottomUp(function(lwin) {
				if( lwin.isWindow && !(lwin instanceof Ext.window.MessageBox) && lwin != win ) {
					tArr = lwin.getPosition(true) ;
					if( tArr[0] == newPosX ) {
						newPosX += 30 ;
					}
					if( tArr[1] == newPosY ) {
						newPosY += 25 ;
					}
				}
			});
		}
		if( newPosX != curPosX || newPosY != curPosY ) {
			win.setPosition(newPosX,newPosY) ;
		}
	},
	onUnload : function(e) {
		console.log('Catching beforeunload') ;
		if (this.fireEvent('beforeunload', this) === false) {
			e.stopEvent();
		}
	},
	
	onModuleItemClick: function( item ) {
		var me = this ,
			moduleExecRecord ;
		
		if( item instanceof OptimaModuleExecModel ) {
			moduleExecRecord = item ;
		} else if( item instanceof Ext.menu.Item
		|| Ext.button.Button
		|| false ) {
			if( typeof item.moduleExecRecord == 'undefined' || !((item.moduleExecRecord) instanceof OptimaModuleExecModel) ) {
				Optima5.Helper.logWarning('App:onModuleItemClick','OptimaModuleExecModel not found in item') ;
				return ;
			} else {
				moduleExecRecord = item.moduleExecRecord
			}
		} else {
			Optima5.Helper.logWarning('App:onModuleItemClick','Invalid exec record / menu item') ;
			console.dir(item) ;
			return ;
		}
		
		var moduleCfg = {
			moduleId: moduleExecRecord.get('moduleId'),
			moduleParams: {}
		}
		Ext.Array.each( moduleExecRecord.params().getRange(), function(moduleParamRecord) {
			moduleCfg.moduleParams[moduleParamRecord.get('paramCode')] = moduleParamRecord.get('paramValue') ;
		}) ;
		
		Ext.menu.Manager.hideAll() ;
		me.moduleLaunch(moduleCfg) ;
	},
	moduleLaunch: function( moduleCfg ) {
		var me = this ;
		if( !moduleCfg.moduleId || Optima5.Helper.getModulesLib().modulesGetById(moduleCfg.moduleId) == null ) {
			Optima5.Helper.logWarning('App:moduleLaunch','Module '+moduleCfg.moduleId+' unknown') ;
			return ;
		}
		
		var moduleRecord = Optima5.Helper.getModulesLib().modulesGetById(moduleCfg.moduleId) ;
		if( !moduleRecord.get('enabled') ) {
			Optima5.Helper.logWarning('App:moduleLaunch','Module '+moduleCfg.moduleId+' disabled') ;
			return ;
		}
		if( moduleRecord.get('moduleType') == 'sdomain' ) {
			var sdomainId = moduleCfg.moduleParams.sdomain_id,
				sdomainRecord = me.desktopCfgRecord.sdomains().getById(sdomainId) ;
			if( sdomainRecord == null ) {
				Optima5.Helper.logWarning('App:moduleLaunch','Sdomain '+sdomainId+' unknown') ;
				return ;
			}
			if( sdomainRecord.get('db_needUpdate') ) {
				Ext.Msg.alert('Error', 'Sdomain ['+ sdomainId.toUpperCase() +'] unavailable. Please upgrade DB schema.') ;
				return ;
			}
		}
		
		
		// same module already started ?
		var rejectLaunch = false,
			runningModuleInstance = null ;
		me.moduleInstances.each( function( moduleInstance ) {
			if( moduleCfg.moduleId != moduleInstance.moduleId ) {
				return true ;
			}
			if( Ext.encode( moduleCfg.moduleParams || {} ) != Ext.encode( moduleInstance.moduleParams ) ) {
				// parametres différents
				return true ;
			}
			if( Ext.encode( moduleCfg.moduleParams || {} ) == Ext.encode( {} ) ) {
				// parametres vides
				if( Optima5.Helper.getModulesLib().modulesGetById(moduleCfg.moduleId).get('allowMultipleInstances') ) {
					return true ;
				}
			}
			rejectLaunch = true ;
			runningModuleInstance = moduleInstance
			return false ;
		},me) ;
		if( rejectLaunch ) {
			// pop main window for moduleInstance
			if( runningModuleInstance != null ) {
				runningModuleInstance.eachWindow( function(win) {
					if( win.isMainWindow ) {
						if( win.minimized ) {
							win.show() ;
						}
						win.focus() ;
					} else {
						if( !win.minimized ) {
							win.focus() ;
						}
					}
				},me) ;
			}
			
			return ;
		}
		
		Ext.apply(moduleCfg,{
			app:me,
			listeners:{
				modulestart:me.onModuleStart,
				modulestop:me.onModuleStop,
				scope:me
			}
		}) ;
		Ext.create(Optima5.Helper.getModulesLib().modulesGetById(moduleCfg.moduleId).get('moduleClass'),moduleCfg) ;
	},
	/*
	getModuleByWindow: function( win ) {
		var me = this ;
		
		if( !(win instanceof Ext.window.Window) ) {
			win = win.up('window') ;
		}
		if( typeof win === 'undefined' ) {
			Optima5.Helper.logWarning('App:getModuleByWindow','undefined') ;
			return null ;
		}
		
		if( win.optimaModule != null && (win.optimaModule) instanceof Optima5.Module ) {
			return win.optimaModule ;
		}
		
		return null ;
	},
	*/
	onModuleStart: function( moduleInstance ) {
		var me = this ;
		me.moduleInstances.add(moduleInstance) ;
		Optima5.Helper.logDebug('App:onModuleStart','Module Started') ;
	},
	onModuleStop: function( moduleInstance ) {
		var me = this ;
		if( me.moduleInstances.remove(moduleInstance) === false ) {
			console.log('App:onModuleStop : module not found ?') ;
		}
		Optima5.Helper.logDebug('App:onModuleStart','Module Stopped') ;
	},
	eachModuleInstance: function(fn, scope){
		this.moduleInstances.each( fn, scope ) ;
	},
	
	
	onSettings: function() {
		var me = this ;
		var moduleCfg = {
			moduleId:'settings',
			moduleParams:[]
		};
		me.moduleLaunch(moduleCfg) ;
	},
	onLogout: function() {
		var me = this ;
		Ext.Msg.confirm('Logout', 'Are you sure you want to logout?', function(btn){
			if( btn == 'yes' ){
				me.doLogout() ;
			}
		},me) ;
	},
	onSessionInvalid: function() {
		var me = this ;
		Ext.Msg.alert('Session closed', 'Your session has been terminated',function(){
			me.endStandby(false) ;
		}) ;
	},
	doLogout: function() {
		var me = this ;
		Ext.Ajax.request({
			url: 'server/login.php',
			params: {
				_action: 'logout',
				_sessionId: me.desktopGetSessionId()
			},
			success: function(response) {
				if( Ext.decode(response.responseText).done != true ) {
					Ext.Msg.alert('End session','Cannot delete session. Timed out ?') ;
				}
				me.endStandby(true);
			},
			scope : me
		});
	},
	endStandby: function(doAnimate) {
		var me = this,
			animDuration = doAnimate? 500 : 0 ;
		
		if( !me.forceCloseAllWindows() ) {
			return ;
		}
		me.viewport.removeCls('op5-viewport-devborder');
		
		me.desktop.animate({
			duration: animDuration,
			to: {
				opacity: 0
			},
			listeners: {
				afteranimate: function() {
					me.desktop.destroy() ;
					me.viewport.destroy() ;
					me.desktop = me.viewport = me.desktopCfgRecord = null ;
				},
				scope:me
			}
		});
		
		var el = Ext.get("standby");
		el.setOpacity(0);
		el.show();
		el.animate({
			duration: animDuration,
			to: {
				opacity: 1
			}
		});
	}
});