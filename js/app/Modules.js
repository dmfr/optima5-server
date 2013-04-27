Ext.define('OptimaModuleParamDescModel', {
	extend: 'Ext.data.Model',
	idProperty: 'paramCode',
	fields: [
		{name: 'paramCode', type: 'string'},
		{name: 'paramDesc', type: 'string'}
	],
});

Ext.define('OptimaModuleParamValueModel', {
	extend: 'Ext.data.Model',
	idProperty: 'paramCode',
	fields: [
		{name: 'paramCode',  type: 'string'},
		{name: 'paramValue', type: 'string'}
	],
});

Ext.define('OptimaModuleDescModel', {
	extend: 'Ext.data.Model',
	idProperty: 'moduleId',
	fields: [
		{name: 'enabled',   type: 'boolean'},
		{name: 'moduleId',   type: 'string'},
		{name: 'moduleName', type: 'string'},
		{name: 'classPath', type: 'string'},
		{name: 'classMain', type: 'string'},
		{name: 'classInitMethod', type: 'string'}
	],
	hasMany: [{
		model: 'OptimaModuleParamDescModel',
		name: 'params',
		associationKey: 'params'
	}]
});

Ext.define('OptimaModuleExecModel', {
	extend: 'Ext.data.Model',
	idProperty: 'moduleId',
	fields: [
		{name: 'moduleId',   type: 'string'},
	],
	hasMany: [{
		model: 'OptimaModuleParamValueModel',
		name: 'params',
		associationKey: 'params'
	}]
});


Ext.define('Optima5.Modules',{
	mixins: {
		observable: 'Ext.util.Observable'
	},
	
	modulesStore: null,
	
	constructor: function(config) {
		//build store
		var me = this ;
		me.addEvents('ready') ;
		me.mixins.observable.constructor.call(this, config);
		
		me.modulesStore = Ext.create('Ext.data.Store',{
			model:'OptimaModuleDescModel',
			proxy: {
				type: 'ajax',
				url : './js/app/Modules.json',
				reader: {
					type: 'json'
				}
			},
			autoLoad: false
		}) ;
		
		// Dev : requires all dependancies
		me.modulesStore.on('load',function() {
			var requireStr ;
			Ext.Array.each(me.modulesStore.getRange(), function(moduleDesc) {
				if( !moduleDesc.get('enabled') ) {
					return ;
				}
				requireStr = moduleDesc.get('classPath')+'.'+moduleDesc.get('classMain') ;
				Optima5.Helper.logDebug('Modules:constructor','Ext.require: '+requireStr) ;
				Ext.require(requireStr) ;
			},me) ;
			me.modulesReady = true ;
			me.fireEvent('ready') ;
		},me) ;
		
		me.modulesStore.load() ;
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