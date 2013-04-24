Ext.define('OptimaModuleModel', {
	extend: 'Ext.data.Model',
	idProperty: 'moduleId',
	fields: [
		{name: 'moduleId',  type: 'string'},
		{name: 'moduleName', type:'string'}
	]
});


Ext.define('Optima5.Helper',{
	singleton:true,
	requires:['Ext.data.Store'],
	
	modulesStore: null,
	
	registerApplication: function( op5CoreApp ) {
		console.dir( op5CoreApp ) ;
	},
			  
	dummyMethod: function(){
		console.log('Dummy was called !') ;
	},
	
	
	constructor: function() {
		var me = this ;
        console.log('Helper is here!') ;
		  me.modulesInit() ;
   },
	
	modulesInit: function() {
		//build store
		var me = this ;
		me.modulesStore = Ext.create('Ext.data.Store',{
			model:'OptimaModuleModel',
			proxy: {
				type: 'ajax',
				url : './js/app/Modules.json',
				reader: {
					type: 'json'
				}
			},
			autoLoad: true
		}) ;
	},
	modulesGetById: function( moduleId ) {
		var me = this ;
		return me.modulesStore.getById(moduleId) ;
	},
	modulesGetAll: function() {
		var me = this ;
		return me.modulesStore.getRange() ;
	}
});
