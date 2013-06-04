Ext.define('Optima5.Module',{
	mixins: {
		observable: 'Ext.util.Observable'
	},
	requires: [
		'Optima5.Ajax.Connection',
		'Optima5.Ajax.Proxy'
	],
	
	app: null,
	
	moduleId : '',
	sdomainId : null,
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
				if( moduleParams == null || moduleParams.sdomain_id == null || moduleParams.sdomain_id == '' ) {
					console.log('Module:constructor : sdomain_id missing') ;
				} else {
					me.sdomainId = moduleParams.sdomain_id ;
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
		
		var iconCls ;
		switch( moduleDescRecord.get('moduleType') ) {
			case 'sdomain' :
				iconCls = Optima5.Helper.getIconsLib().iconGetCls16(me.app.desktopCfgRecord.sdomains().getById(me.sdomainId).get('icon_code')) ;
				break ;
			default :
				iconCls = Optima5.Helper.getIconsLib().iconGetCls16(moduleDescRecord.get('iconCode')) ;
				break ;
		}
		
		if( !config ) {
			config = {} ;
		}
		Ext.apply( config, {
			optimaModule: me,
			isMainWindow: (me.windows.getCount() == 0),
			title: me.getWindowTitle( config.title )
		}) ;
		Ext.applyIf( config,{
			width:800,
			height:600,
			layout: {
				type: 'fit',
				align: 'stretch'
			},
			iconCls: iconCls
		}) ;
		
		var win = me.app.getDesktop().createWindow(config,cls) ;
		win.on('afterrender',function(twin) {
			me.app.alignNewWindow(twin) ;
		},me,{single:true}) ;
		
		var fireStart = false ;
		if( me.windows.getCount() == 0 ) {
			fireStart = true ;
		}
		me.windows.add(win) ;
		if( fireStart ) {
			me.fireEvent('modulestart',me) ;
		}
		win.addEvents('windowattach') ;
		win.fireEvent('windowattach',win) ;
		
		win.on({
			beforeclose: me.onWindowClose,
			destroy: me.onWindowDestroy,
			scope: me
		});
		
		win.show();
		
		return win ;
	},
	getWindowTitle: function( cfgTitle ) {
		var me = this,
			moduleDescRecord = Optima5.Helper.getModulesLib().modulesGetById(me.moduleId) ;
			windowTitle = '' ;
			
		switch( moduleDescRecord.get('moduleType') ) {
			case 'sdomain' :
				var altTitle = me.app.desktopCfgRecord.sdomains().getById(me.sdomainId).get('sdomain_name') ;
				windowTitle = '[' + me.sdomainId.toLowerCase() + ']' + ' ' + (cfgTitle!=null?cfgTitle:altTitle) ;
				break ;
			default :
				windowTitle = (cfgTitle != null)? cfgTitle : moduleDescRecord.get('moduleName') ;
				break ;
		}
		return windowTitle ;
	},
	onWindowClose: function( win ) {
		var me = this;
		if( win.isMainWindow && me.windows.getCount() > 1 ) {
			Ext.Msg.confirm('Close module','Close ['+me.sdomainId+'] module ?',function(btn){
				if( btn == 'yes' ) {
					me.eachWindow(function(cWin){
						if( !cWin.isMainWindow ) {
							cWin.destroy() ;
						}
					},me);
					if( me.windows.getCount() != 1 ) {
						Optima5.Helper.logError('Module:onWindowClose','Leaked window ?') ;
					}
					me.eachWindow(function(cWin){
						cWin.close() ;
					},me) ;
				}
			},me);
			return false ;
		}
		return true ;
	},
	onWindowDestroy: function( win ) {
		var me = this;
		delete win.module ;
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
	eachWindow: function(fn, scope){
		this.windows.each( fn, scope ) ;
	},
	
	
	getConfiguredAjaxParams: function() {
		var me = this ;
		return {
			_sessionId: me.app.desktopGetSessionId(),
			_moduleId: me.moduleId,
			_sdomainId : me.sdomainId || ''
		};
	},
	getConfiguredAjaxConnection: function() {
		var me = this ;
		return Ext.create('Optima5.Ajax.Connection',{
			optUrl: me.app.desktopGetBackendUrl(),
			optParams: me.getConfiguredAjaxParams()
		}) ;
	},
	getConfiguredAjaxProxy: function(config) {
		var me = this ;
		Ext.apply(config,{
			optUrl: me.app.desktopGetBackendUrl(),
			optParams: me.getConfiguredAjaxParams()
		}) ;
		return Ext.create('Optima5.Ajax.Proxy',config) ;
	},
	
	
	selfDestroy: function() {
		var me = this ;
		delete me.app ;
		me.fireEvent('modulestop',me) ;
	}
 
});