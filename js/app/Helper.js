Ext.define('Optima5.Helper',{
	mixins: {
		observable: 'Ext.util.Observable'
	},
	singleton:true,
	debug:true,
	requires:[
		'Ext.data.Store',
		'Optima5.Modules',
		'Optima5.Icons'
	],
	
	isReady:false,
	libCount:0,
	libLoaded:0,
	modulesLib: null,
	iconsLib: null,
	
	registerApplication: function( op5CoreApp ) {
		console.dir( op5CoreApp ) ;
	},
			  
	dummyMethod: function(){
		console.log('Dummy was called !') ;
	},
	
	logDebug: function(src,str) {
		if( this.debug ) {
			console.log(src+' : '+str) ;
		}
	},
	logWarning: function(src,str) {
		console.warn(src+' : '+str) ;
	},
	logError: function(src,str) {
		console.error(src+' : '+str) ;
	},
	
	
	constructor: function(config) {
		var me = this ;
		
		me.addEvents('ready') ;
		me.mixins.observable.constructor.call(this, config);
		
		me.libCount = 2 ;
		me.modulesLib = Ext.create('Optima5.Modules',{
			listeners: {
				ready: me.onLibLoad,
				scope:me
			}
		}) ;
		me.iconsLib = Ext.create('Optima5.Icons',{
			listeners: {
				ready: me.onLibLoad,
				scope:me
			}
		}) ;
   },
	getModulesLib:function() {
		var me = this ;
		return me.modulesLib ;
	},
	getIconsLib: function() {
		var me = this ;
		return me.iconsLib ;
	},
	onLibLoad: function() {
		var me = this ;
		me.libLoaded++ ;
		if( me.libLoaded == me.libCount ) {
			me.isReady=true ;
			me.fireEvent('ready') ;
		}
	},
	
	
	getAjaxProxy: function( cmp ) {
		
	},
	getAjaxConnection: function( cmp ) {
		
	}
});