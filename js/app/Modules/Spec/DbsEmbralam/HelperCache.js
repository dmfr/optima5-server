Ext.define('DbsEmbralamStkAttributeModel', {
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
		{name: 'cfg_is_editable',  type: 'boolean'}
	]
});

Ext.define('Optima5.Modules.Spec.DbsEmbralam.HelperCache',{
	mixins: {
		observable: 'Ext.util.Observable'
	},
	
	singleton:true,
	
	// business logic data
	stockAttributesStore: null,
	
	isReady: false,
	
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
			me.libCount = 1 ;
			
			me.fetchStockAttributes() ;
		},1000,me) ;
	},
	
	fetchStockAttributes: function() {
		// Query Bible
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_moduleId: 'spec_dbs_embralam',
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
			model: 'DbsEmbralamStkAttributeModel',
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
	
	onLibLoad: function() {
		var me = this ;
		me.libCount-- ;
		if( me.libCount == 0 ) {
			me.isReady=true ;
			me.fireEvent('ready') ;
		}
	}
});