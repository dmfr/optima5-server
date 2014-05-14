Ext.define('OptimaModuleParamDescModel', {
	extend: 'Ext.data.Model',
	idProperty: 'paramCode',
	fields: [
		{name: 'paramCode', type: 'string'},
		{name: 'paramDesc', type: 'string'}
	]
});

Ext.define('OptimaModuleParamValueModel', {
	extend: 'Ext.data.Model',
	idProperty: 'paramCode',
	fields: [
		{name: 'paramCode',  type: 'string'},
		{name: 'paramValue', type: 'string'}
	]
});

Ext.define('OptimaModuleDescModel', {
	extend: 'Ext.data.Model',
	idProperty: 'moduleId',
	fields: [
		{name: 'enabled',   type: 'boolean'},
		{name: 'moduleId',   type: 'string'},
		{name: 'backendModuleId',   type: 'string'},
		{name: 'parentModuleId',   type: 'string'},
		{name: 'moduleName', type: 'string'},
		{name: 'moduleType', type: 'string'},
		{name: 'moduleClass', type: 'string'},
		{name: 'moduleCssSrc', type: 'string'},
		{name: 'iconCode', type: 'string'},
		{name: 'allowMultipleInstances', type: 'boolean'}
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
		{name: 'moduleHeadId',   type: 'string'}
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
	modulesNbLoaded: 0,
	modulesNbEnabled: 0,
	
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
		
		/*
		* For IE11 : http://www.sencha.com/forum/showthread.php?281297-Ext.util.CSS.createStyleSheet-fails-in-IE11.
		*/
		Ext.util.CSS.createStyleSheet = function (cssText, id) {
			var CSS = this,
				doc = document;
			var ss,
				head = doc.getElementsByTagName("head")[0],
				styleEl = doc.createElement("style");
			styleEl.setAttribute("type", "text/css");
			if (id) {
				styleEl.setAttribute("id", id);
			}
			if (Ext.isIE10m) {
				head.appendChild(styleEl);
				ss = styleEl.styleSheet;
				ss.cssText = cssText;
			} else {
				try {
					styleEl.appendChild(doc.createTextNode(cssText));
				} catch (e) {
					styleEl.cssText = cssText;
				}
				head.appendChild(styleEl);
				ss = styleEl.styleSheet ? styleEl.styleSheet : (styleEl.sheet || doc.styleSheets[doc.styleSheets.length - 1]);
			}
			CSS.cacheStyleSheet(ss);
			return ss;
		}
		// Dev : requires all dependancies
		me.modulesStore.on('load',function() {
			Ext.Array.each(me.modulesStore.getRange(), function(moduleDesc) {
				if( !moduleDesc.get('enabled') ) {
					return ;
				}
				me.modulesNbEnabled++ ;
				
				// Load Js classes
				Optima5.Helper.logDebug('Modules:constructor','Ext.require: '+moduleDesc.get('moduleClass')) ;
				Ext.require(moduleDesc.get('moduleClass'),me.onModuleLoad,me) ;
				
				// Load optional CSS
				if( moduleDesc.get('moduleCssSrc') != '' ) {
					var cssId = 'isCssM'+moduleDesc.get('moduleId') ;
					var cssSrc = 'css/'+moduleDesc.get('moduleCssSrc') ;
					cssSrc = Ext.urlAppend(cssSrc, '_dc' + '=' + (new Date().getTime()));
					Ext.util.CSS.createStyleSheet('', cssId);
					Ext.util.CSS.swapStyleSheet(cssId, cssSrc);
				}
			},me) ;
			
			if( me.modulesNbEnabled == 0 ) {
				me.modulesReady = true ;
				me.fireEvent('ready') ;
				return ;
			}
		},me) ;
		
		me.modulesStore.load() ;
	},
	onModuleLoad: function() {
		var me = this ;
		me.modulesNbLoaded++ ;
		if( me.modulesNbLoaded == me.modulesNbEnabled ) {
			me.modulesReady = true ;
			me.fireEvent('ready') ;
		}
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