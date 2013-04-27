Ext.define('Optima5.Core.ModuleInstance',{
	mixins: {
		observable: 'Ext.util.Observable'
	},
	
	moduleId : '',
	sdomainDb : null,
	moduleParams : null,
	
	windows: null,
	
	constructor: function( config ) {
		var me = this;
		me.addEvents(
			'start',
			'stop'
		);
		me.mixins.observable.constructor.call(this, config);
		
		if( config.moduleId == null ) {
			console.log('ModuleInstance:constructor : no moduleId ?') ;
			return ;
		}
		
		var moduleDescRecord = Optima5.Helper.getModulesLib().modulesGetById(config.moduleId) ;
		if( moduleDescRecord == null ) {
			console.log('ModuleInstance:constructor : unknown moduleId') ;
			return ;
		}
		switch( moduleDescRecord.get('moduleType') ) {
			case 'sdomain' :
				if( moduleParams == null || moduleParams.sdomain_db == null || moduleParams.sdomain_db == '' ) {
					console.log('ModuleInstance:constructor : sdomain_db missing') ;
				} else {
					me.sdomainDb = moduleParams.sdomain_db ;
				}
				break ;
		}
		
		me.moduleId = config.moduleId ;
		if( Ext.isObject(config.moduleParams) ) {
			me.moduleParams = config.moduleParams ;
		}
		
		me.windows = new Ext.util.MixedCollection();
		
		var moduleParams = {} ;
		if( Ext.isObject(config.moduleParams) ) {
			Ext.apply(moduleParams,config.moduleParams) ;
		}
		Ext.apply(moduleParams,{
			moduleInstance: me
		}) ;
		
		var mainClassStr = moduleDesc.get('classPath')+'.'+moduleDesc.get('classMain') ;
		var mainWindow = Ext.create( mainClassStr , me.moduleParams ) ;
		if( mainWindow != null && mainWindow instanceof Ext.window.Window
			&& me.windows.contains(mainWindows)
		) {
			me.fireEvent('start',me) ;
		}
	},
	
	
	createWindow: function(config, cls) {
		var me = this ;
		
		var cfg = Ext.apply( config || {}, {
			isMainWindow: (me.windows.getCount() == 0)
		}) ;
		
		var win = me.app.getDesktop().createWindow(config,cls) ;
		
		me.windows.add(win) ;
		
		win.on({
			beforeclose: Ext.emptyFn,
			destroy: Ext.emptyFn,
			scope: me
		});
	},
	onWindowClose: function( win ) {
		var me = this;
		if( win.isMainWindow ) {
			
			return false ;
		}
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
		me.fireEvent('stop',me) ;
	}
 
});