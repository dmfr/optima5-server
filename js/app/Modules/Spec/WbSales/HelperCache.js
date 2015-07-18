Ext.define('Optima5.Modules.Spec.WbSales.HelperCache',{
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
		
		me.nbToLoad = 1 ;
		
		// Query Bible
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_action: 'data_getBibleTree',
			bible_code: 'COUNTRY'
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				var ajaxData = Ext.decode(response.responseText) ;
				if( ajaxData.success == false ) {
					Ext.Msg.alert('Failed', 'Unknown error');
				}
				else {
					// do something to open window
					me.onCountryLoad( ajaxData ) ;
				}
			},
			scope: me
		});
		
		//me.authHelperInit();
	},
	onCountryLoad: function(ajaxData) {
		var me = this ;
		
		// Populate store
		var data = [] ;
		me.countryRoot = ajaxData ;
		me.onLoad() ;
	},
	onLoad: function() {
		var me = this ;
		me.nbLoaded++ ;
		if( me.nbToLoad == me.nbLoaded ) {
			me.isReady = true ;
			me.fireEvent('ready') ;
		}
	},
	
	countryGetRoot: function() {
		var me = this ;
		return me.countryRoot ;
	}
});