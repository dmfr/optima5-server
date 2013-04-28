Ext.define('OptimaSessionModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name: 'enabled',   type: 'boolean'},
		{name: 'moduleId',   type: 'string'},
		{name: 'moduleName', type: 'string'},
		{name: 'classPath', type: 'string'},
		{name: 'classMain', type: 'string'},
		{name: 'classInitMethod', type: 'string'}
	]
});


Ext.define('Optima5.App',{
	mixins: {
		observable: 'Ext.util.Observable'
	},
	requires: [
		'Optima5.Helper',
		'Optima5.Module',
		'Optima5.LoginWindow'
	],
	
	useQuickTips: true,
	sessionRecord: null,
	moduleInstances: null,
	
	isReady: false,
	
	constructor: function(appCfg) {
		var me = this ;
		
		me.addEvents(
			'ready',
			'beforeunload'
		);
		me.mixins.observable.constructor.call(this, appCfg);

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
		
		console.log('Start login') ;
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
	onLoginFailed: function(win) {
		win.recycle() ;
	},
	onLoginSuccess: function(win) {
		win.close() ;
	},
	
	
	bootDesktop: function() {
		if (me.useQuickTips) {
			Ext.QuickTips.init();
		}
		
		me.moduleInstances = new Ext.util.MixedCollection();
		
		desktopCfg = me.getDesktopConfig();
		me.desktop = new Ext.ux.desktop.Desktop(desktopCfg);

		me.viewport = new Ext.container.Viewport({
			layout: 'fit',
			items: [ me.desktop ]
		});

		Ext.EventManager.on(window, 'beforeunload', me.onUnload, me);

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