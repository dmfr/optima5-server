Ext.define('Optima5.Modules.Spec.WbMrfoxy.HelperCache',{
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
		me.addEvents('ready') ;
		me.mixins.observable.constructor.call(this, config);
	},
	init: function(optimaModule) {
		var me = this ;
		me.optimaModule = optimaModule ;
		me.isReady = false ;
		
		Ext.defer(function() {
			me.startLoading() ;
		},1000,me) ;
	},
	startLoading: function() {
		var me = this ;
		
		me.nbLoaded = 0 ;
		me.nbToLoad = 3 ;
		
		// Query Bible
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_moduleId: 'spec_wb_mrfoxy',
			_action: 'cfg_getBibleCountry'
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
		
		// Query Bible
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_moduleId: 'spec_wb_mrfoxy',
			_action: 'cfg_getBibleBrand'
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
					me.onBrandLoad( ajaxData ) ;
				}
			},
			scope: me
		});
		
		// Query Auth
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_moduleId: 'spec_wb_mrfoxy',
			_action: 'auth_getRoles'
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				var ajaxData = Ext.decode(response.responseText) ;
				if( ajaxData.success == false ) {
					Ext.Msg.alert('Failed', 'Unknown error');
				}
				else {
					me.authRoles = ajaxData.data ;
					me.onLoad() ;
				}
			},
			scope: me
		});
	},
	onCountryLoad: function(ajaxData) {
		var me = this ;
		
		// Populate store
		var data = [] ;
		Ext.Array.each( ajaxData.data, function(row) {
			data.push({
				id: row['field_COUNTRY_CODE'],
				country_code: row['field_COUNTRY_CODE'],
				country_display: row['field_COUNTRY_CODE'] + ' - ' + row['field_COUNTRY_NAME'],
				country_iconurl : row['field_COUNTRY_ICONURL']
			});
		},me) ;
		me.countryStore = Ext.create('Ext.data.Store',{
			fields: ['id','country_code','country_display','country_iconurl'],
			data : data
		}) ;
		me.onLoad() ;
	},
	onBrandLoad: function(ajaxData) {
		var me = this ;
		
		// Populate store
		var data = [] ;
		Ext.Array.each( ajaxData.data, function(row) {
			data.push({
				id: row['field_BRANDGROUP'],
				brand_code: row['field_BRANDGROUP'],
				brand_display: row['field_BRANDGROUP_TXT']
			});
		},me) ;
		me.brandStore = Ext.create('Ext.data.Store',{
			fields: ['id','brand_code','brand_display'],
			data : data
		}) ;
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
	
	countryGetById: function( countryCode ) {
		var me = this ;
		return me.countryStore.getById(countryCode) ;
	},
	countryGetAll: function() {
		var me = this ;
		return me.countryStore.getRange() ;
	},
	brandGetById: function( brandCode ) {
		var me = this ;
		return me.brandStore.getById(brandCode) ;
	},
	brandGetAll: function() {
		var me = this ;
		return me.brandStore.getRange() ;
	},
	
	authHelperQueryRole: function( roleCode ) {
		var me = this ;
			
		if( me.optimaModule.getSdomainRecord().get('auth_has_all') ) {
			return true ;
		}
		if( Ext.isArray(roleCode) ) {
			var roles = roleCode,
				passed = false ;
			Ext.Array.each(roles, function(roleCode) {
				if( Ext.Array.contains( me.authRoles, roleCode ) ) {
					passed = true ;
				}
			}) ;
			return passed ;
		}
		return Ext.Array.contains( me.authRoles, roleCode ) ;
	}
});