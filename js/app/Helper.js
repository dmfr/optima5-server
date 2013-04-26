Ext.define('Optima5.Helper',{
	singleton:true,
	requires:[
		'Ext.data.Store',
		'Optima5.Modules'
	],
	
	modulesLib: null,
	
	registerApplication: function( op5CoreApp ) {
		console.dir( op5CoreApp ) ;
	},
			  
	dummyMethod: function(){
		console.log('Dummy was called !') ;
	},
	
	
	constructor: function() {
		var me = this ;
		console.log('Helper is here!') ;
		me.modulesLib = Ext.create('Optima5.Modules',{}) ;
   },
	getModulesLib:function() {
		var me = this ;
		return me.modulesLib ;
	},
	
	
	getAjaxProxy: function( cmp ) {
		
	},
	getAjaxConnection: function( cmp ) {
		
	}
});