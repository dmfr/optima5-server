Ext.define('DbsLamStkAttributeModel', {
	extend: 'Ext.data.Model',
	idProperty: 'mkey',
	fields: [
		{name: 'mkey', type: 'string'},
		{name: 'bible_code', type: 'string'},
		{name: 'atr_txt',  type: 'string'},
		{name: 'STOCK_fieldcode',  type: 'string'},
		{name: 'PROD_fieldcode',  type: 'string'},
		{name: 'cfg_is_optional',  type: 'boolean'},
		{name: 'cfg_is_hidden',  type: 'boolean'},
		{name: 'cfg_is_editable',  type: 'boolean'},
		{name: 'cfg_is_mismatch',  type: 'boolean'}
	]
});

Ext.define('Optima5.Modules.Spec.DbsLam.HelperCache',{
	mixins: {
		observable: 'Ext.util.Observable'
	},
	
	singleton:true,
	
	// business logic data
	stockAttributesStore: null,
	
	cfgAttributeStore: null,
	cfgSocStore: null,
	cfgWhseStore: null,
	
	isReady: false,
	
	constructor: function(config) {
		//build store
		var me = this ;
		me.mixins.observable.constructor.call(this, config);
	},
	init: function(optimaModule) {
		var me = this ;
		me.optimaModule = optimaModule ;
		me.isReady = false ;
		
		Ext.defer(function() {
			me.libCount = 2 ;
			
			me.authHelperInit() ;
			me.fetchStockAttributes() ;
			me.fetchConfig() ;
		},1000,me) ;
	},
	
	authHelperInit: function() {
		var me = this ;
		
		me.authPages = {} ; // userId => [pages]
		me.authNodes = [] ; // [userId@whseCode@teamCode]
		
		// Query Bible
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_moduleId: 'spec_dbs_lam',
			_action: 'cfg_getAuth'
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				var ajaxData = Ext.decode(response.responseText) ;
				if( ajaxData.success == false ) {
					Ext.Msg.alert('Failed', 'Unknown error');
				}
				else {
					me.authPage = ajaxData.authPage ;
				}
				
				me.onLibLoad() ;
			},
			scope: me
		});
	},
	authHelperHasAll: function() {
		var me = this ;
		if( me.optimaModule.getSdomainRecord().get('auth_has_all') ) {
			return true ;
		}
		return false ;
	},
	authHelperQueryPage: function( pageCode ) {
		var me = this ;
			
		if( me.optimaModule.getSdomainRecord().get('auth_has_all') ) {
			return true ;
		}
		return ( !Ext.isEmpty(me.authPage) && Ext.Array.contains( me.authPage, pageCode ) ) ;
	},
	
	fetchStockAttributes: function() {
		// Query Bible
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_moduleId: 'spec_dbs_lam',
			_action: 'cfg_getStockAttributes'
		});
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				var ajaxData = Ext.decode(response.responseText) ;
				if( ajaxData.success == false ) {
					Ext.Msg.alert('Failed', 'Unknown error');
				}
				else {
					this.onLoadStockAttributes( ajaxData ) ;
				}
			},
			scope: this
		});
	},
	onLoadStockAttributes: function( ajaxData ) {
		this.stockAttributesStore = Ext.create('Ext.data.Store',{
			model: 'DbsLamStkAttributeModel',
			data : ajaxData.data
		}) ;
		
		this.onLibLoad() ;
	},
	getStockAttributes: function() {
		return Ext.pluck( this.stockAttributesStore.getRange(), 'data' ) ;
	},
	getStockAttribute: function(stockAttributeBibleCode) {
		var stockAttributeRecord = this.stockAttributesStore.getById(stockAttributeBibleCode) ;
		if( stockAttributeRecord ) {
			return stockAttributeRecord.data ;
		}
		return null ;
	},
	
	fetchConfig: function() {
		// Query Bible
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_moduleId: 'spec_dbs_lam',
			_action: 'cfg_getConfig'
		});
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				var ajaxData = Ext.decode(response.responseText) ;
				if( ajaxData.success == false ) {
					Ext.Msg.alert('Failed', 'Unknown error');
				}
				else {
					this.onLoadConfig( ajaxData ) ;
				}
			},
			scope: this
		});
	},
	onLoadConfig: function( ajaxData ) {
		this.cfgAttributeStore = Ext.create('Ext.data.Store',{
			model: 'DbsLamStkAttributeModel',
			data : ajaxData.data.cfg_attribute
		}) ;
		this.cfgSocStore = Ext.create('Ext.data.Store',{
			model: 'DbsLamCfgSocModel',
			data : ajaxData.data.cfg_soc
		}) ;
		this.cfgWhseStore = Ext.create('Ext.data.Store',{
			model: 'DbsLamCfgWhseModel',
			data : ajaxData.data.cfg_whse
		}) ;
		
		this.onLibLoad() ;
	},
	getAttributeAll: function() {
		return Ext.pluck( this.cfgAttributeStore.getRange(), 'data' ) ;
	},
	getAttribute: function(atrCode) {
		return this.cfgAttributeStore.getById(atrCode) ? this.cfgAttributeStore.getById(atrCode).getData(true) : null ;
	},
	getSocAll: function() {
		return Ext.pluck( this.cfgSocStore.getRange(), 'data' ) ;
	},
	getSoc: function(socCode) {
		return this.cfgSocStore.getById(atrCode) ? this.cfgSocStore.getById(atrCode).getData(true) : null ;
	},
	getWhseAll: function() {
		return Ext.pluck( this.cfgWhseStore.getRange(), 'data' ) ;
	},
	getWhse: function( whseCode ) {
		return this.cfgWhseStore.getById(atrCode) ? this.cfgWhseStore.getById(atrCode).getData(true) : null ;
	},
	
	onLibLoad: function() {
		var me = this ;
		me.libCount-- ;
		if( me.libCount == 0 ) {
			me.isReady=true ;
			me.fireEvent('ready',this) ;
		}
	}
});