Ext.define('Optima5.Helper',{
	mixins: {
		observable: 'Ext.util.Observable'
	},
	singleton:true,
	debug:false,
	requires:[
		'Optima5.Modules',
		'Optima5.Icons'
	],
	
	isReady:false,
	libCount:0,
	libLoaded:0,
	modulesLib: null,
	iconsLib: null,
	
	app: null,
	
	registerApplication: function( op5CoreApp ) {
		var me = this ;
		if( op5CoreApp == null || !(op5CoreApp instanceof Optima5.App) || !(op5CoreApp instanceof Ext.Base) ) {
			console.log('Helper:registerApplication : missing/invalid App reference') ;
			return null ;
		}
		me.app = op5CoreApp ;
	},
	getApplication: function() {
		var me = this ;
		return me.app ;
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
		Ext.Msg.alert('App Error', src+' : '+str) ;
	},
	
	
	constructor: function(config) {
		var me = this ;
		
		me.addEvents('ready') ;
		me.mixins.observable.constructor.call(this, config);
		
		Ext.defer(function() {
			me.loadLibs() ;
		},100,me) ;
   },
	loadLibs: function() {
		var me = this ;
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
	onLibLoad: function() {
		var me = this ;
		me.libLoaded++ ;
		if( me.libLoaded == me.libCount ) {
			me.isReady=true ;
			me.fireEvent('ready') ;
		}
	},
	getModulesLib:function() {
		var me = this ;
		return me.modulesLib ;
	},
	getIconsLib: function() {
		var me = this ;
		return me.iconsLib ;
	},
	
	/*
	getAjaxConnection: function( cmp ) {
		var me = this,
			moduleInstance ;
		if( cmp instanceof Optima5.Module) {
			moduleInstance = cmp ;
		} else {
			moduleInstance = me.app.getModuleByWindow(cmp) ;
		}
		if( moduleInstance != null ) {
			return moduleInstance.getConfiguredAjaxConnection() ;
		}
		me.logError('Helper:getAjaxConnection', 'Cannot lookup parent module (Component not started ?)') ;
		return null;
	},
	getAjaxProxy: function( cmp ) {
		var me = this,
			moduleInstance ;
		if( cmp instanceof Optima5.Module) {
			moduleInstance = cmp ;
		} else {
			moduleInstance = me.app.getModuleByWindow(cmp) ;
		}
		if( moduleInstance != null ) {
			return moduleInstance.getConfiguredAjaxProxy() ;
		}
		me.logError('Helper:getAjaxProxy', 'Cannot lookup parent module (Component not started ?)') ;
		return null;
	}
	*/
	
	floatInsideParent: function( floatingCmp ) {
		if( this.floatInsideParentSet(floatingCmp) && floatingCmp.isComponent ) {
			floatingCmp.on('move',this.floatInsideParentSet) ;
		}
	},
	floatInsideParentSet: function( floatingEl ) {
		var floatingXY, floatingLocalXY, floatingSize, parentSize, offset = [0,0] ;
		
		floatingEl = Ext.get(floatingEl.el || floatingEl);
		if( !floatingEl || !floatingEl.dom ) {
			return false ;
		}
		parentEl = Ext.get( floatingEl.dom.offsetParent ) ;
		if( !parentEl || !parentEl.dom ) {
			return false ;
		}
		
		floatingXY = floatingEl.getXY() ;
		floatingLocalXY = floatingEl.getLocalXY() ;
		floatingSize = [floatingEl.getWidth(),floatingEl.getHeight()] ;
		parentSize = [parentEl.getWidth(),parentEl.getHeight()] ;
		
		offset[0] += ( floatingLocalXY[0] < 0 ? -floatingLocalXY[0] : 0 ) ;
		offset[1] += ( floatingLocalXY[1] < 0 ? -floatingLocalXY[1] : 0 ) ;
		offset[0] += ( floatingLocalXY[0]+floatingSize[0] > parentSize[0] ? parentSize[0] - (floatingLocalXY[0]+floatingSize[0]) : 0 ) ;
		offset[1] += ( floatingLocalXY[1]+floatingSize[1] > parentSize[1] ? parentSize[1] - (floatingLocalXY[1]+floatingSize[1]) : 0 ) ;
		if( offset[0]==0 && offset[1]==0 ) {
			return true ;
		}
		floatingEl.setXY( [floatingXY[0]+offset[0],floatingXY[1]+offset[1]] ) ;
		return true ;
	}
});