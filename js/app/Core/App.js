Ext.define('Optima5.Core.App',{
	extend: 'Ext.ux.desktop.App',
	
	requires: [
		'Optima5.Modules',
	],
	
	moduleInstances: null ;
	
	constructor: function() {
		var me = this ;
		
		
		
		this.callParent() ;
	}
	
	
	
	
	
	
	
	startDesktop: function() {
		me.moduleInstances = new Ext.util.MixedCollection();
	}
	
	getModuleByWindow: function( win ) {
		var me = this ;
		
		if( !win.isXType('window') ) {
			win = win.up('window') ;
		}
		if( typeof win === 'undefined' ) {
			console.log('App:getModuleByWindow : undefined') ;
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
	},
	onModuleStop: function( moduleInstance ) {
		var me = this ;
		if( me.moduleInstances.remove(moduleInstance) === false ) {
			console.log('App:onModuleStop : module not found ?') ;
		}
	}
	
}