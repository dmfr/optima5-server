Ext.define('Optima5.Modules.Spec.RsiRecouveo.HelperCache',{
	mixins: {
		observable: 'Ext.util.Observable'
	},
	
	singleton:true,
	
	countryStore: null,
	brandStore: null,
	
	isReady: false,
	nbLoaded: 0,
	nbToLoad: 0,
	
	constructor: function(config) {
		//build store
		var me = this ;
		me.mixins.observable.constructor.call(this, config);
	},
	init: function(optimaModule) {
		var me = this ;
		me.optimaModule = optimaModule ;
		
		Ext.defer(function() {
			me.startLoading() ;
		},1000,me) ;
	},
	startLoading: function() {
		var me = this ;
		
		me.nbToLoad = 0 ;
		
		me.onLoad() ;
	},
	onLoad: function() {
		var me = this ;
		me.nbLoaded++ ;
		if( me.nbToLoad <= me.nbLoaded ) {
			me.isReady = true ;
			me.fireEvent('ready') ;
		}
	},
	
	countryGetRoot: function() {
		var me = this ;
		return me.countryRoot ;
	}
});
