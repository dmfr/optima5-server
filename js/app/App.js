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


Ext.define('Optima5.Core.App',{
	extend: 'Ext.ux.desktop.App',
	
	requires: [
		'Optima5.Modules',
	],
	
	sessionRecord: null,
	
	moduleInstances: null,
	
	constructor: function() {
		var me = this ;
		
		if( Optima5.Helper.isReady ) {
			me.onReady() ;
		} else {
			Optima5.Helper.on('ready', function() {
				me.onReady() ;
			},this,{single:true});
		}
		
		this.callParent() ;
	},
	
	
	onReady: function() {
		var me = this ;
		me.startLogin() ;
	},
	
	startLogin: function() {
		
	},
	onLoginFailed: function() {
		
	},
	onLoginSuccess: function() {
		
	},
	
	
	bootDesktop: function() {
		me.moduleInstances = new Ext.util.MixedCollection();
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
	
}