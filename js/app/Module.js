Ext.define('Optima5.Module',{
	mixins: {
		observable: 'Ext.util.Observable'
	},
	
	app: null,
	
	moduleId : '',
	sdomainDb : null,
	moduleParams : null,
	
	windows: null,
	
	constructor: function( moduleCfg ) {
		var me = this;
		me.addEvents(
			'modulestart',
			'modulestop'
		);
		me.mixins.observable.constructor.call(this, moduleCfg);
		
		if( moduleCfg.app == null || !(moduleCfg.app instanceof Optima5.App) ) {
			console.log('Module:constructor : missing/invalid App reference') ;
			return null ;
		}
		
		if( moduleCfg.moduleId == null ) {
			console.log('Module:constructor : no moduleId ?') ;
			return null ;
		}
		var moduleDescRecord = Optima5.Helper.getModulesLib().modulesGetById(moduleCfg.moduleId) ;
		if( moduleDescRecord == null ) {
			console.log('Module:constructor : unknown moduleId') ;
			return null ;
		}
		
		var moduleParams = moduleCfg.moduleParams || {} ;
		switch( moduleDescRecord.get('moduleType') ) {
			case 'sdomain' :
				if( moduleParams == null || moduleParams.sdomain_db == null || moduleParams.sdomain_db == '' ) {
					console.log('Module:constructor : sdomain_db missing') ;
				} else {
					me.sdomainDb = moduleParams.sdomain_db ;
				}
				break ;
		}
		
		me.app = moduleCfg.app ;
		me.moduleId = moduleCfg.moduleId ;
		me.moduleParams = moduleParams ;
		
		me.windows = new Ext.util.MixedCollection();
		
		me.initModule( moduleCfg ) ;
		
		return me ;
	},
	initModule: function() {
		// To override
	},
	
	createWindow: function(config, cls) {
		var me = this ;
		var moduleDescRecord = Optima5.Helper.getModulesLib().modulesGetById(me.moduleId) ;
		
		var windowTitle = '' ;
		switch( moduleDescRecord.get('moduleType') ) {
			case 'sdomain' :
				windowTitle = '[' + me.sdomainDb + ']' + ' ' + config.title||'' ;
				break ;
			default :
				windowTitle = config.title||moduleDescRecord.get('moduleName') ;
				break ;
		}
		
		var cfg = Ext.apply( config || {}, {
			isMainWindow: (me.windows.getCount() == 0),
			title:windowTitle,
			iconCls: Optima5.Helper.getIconsLib().iconGetCls16(moduleDescRecord.get('iconCode')),
		}) ;
		
		var win = me.app.getDesktop().createWindow(config,cls) ;
		
		var fireStart = false ;
		if( me.windows.getCount() == 0 ) {
			fireStart = true ;
		}
		me.windows.add(win) ;
		if( fireStart ) {
			me.fireEvent('modulestart',me) ;
		}
		
		win.on({
			beforeclose: me.onWindowClose,
			destroy: me.onWindowDestroy,
			scope: me
		});
		
		return win ;
	},
	onWindowClose: function( win ) {
		var me = this;
		if( win.isMainWindow && me.windows.getCount() > 1 ) {
			
			return false ;
		}
		return true ;
	},
	onWindowDestroy: function( win ) {
		var me = this;
		me.windows.remove(win);
		if( me.windows.getCount() == 0 ) {
			me.selfDestroy() ;
		}
	},
	hasWindow: function( win ) {
		var me = this ;
		if( me.windows.contains(win) ) {
			return true ;
		}
		return false ;
	},
	
	selfDestroy: function() {
		var me = this ;
		me.app = null ;
		me.fireEvent('modulestop',me) ;
	}
 
});