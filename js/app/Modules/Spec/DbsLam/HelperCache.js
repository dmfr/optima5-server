Ext.define('DbsLamStkAttributeModel', {
	extend: 'Ext.data.Model',
	idProperty: 'mkey',
	fields: [
		{name: 'mkey', type: 'string'},
		{name: 'bible_code', type: 'string', allowNull:true},
		{name: 'atr_txt',  type: 'string'},
		{name: 'is_bible',  type: 'boolean'},
		{name: 'STOCK_fieldcode',  type: 'string'},
		{name: 'PROD_fieldcode',  type: 'string'},
		{name: 'ADR_fieldcode',  type: 'string'},
		{name: 'cfg_is_optional',  type: 'boolean'},
		{name: 'cfg_is_hidden',  type: 'boolean'},
		{name: 'cfg_is_editable',  type: 'boolean'},
		{name: 'cfg_is_mismatch',  type: 'boolean'},
		
		{name: 'socs', type: 'auto'}
	]
});

Ext.define('Optima5.Modules.Spec.DbsLam.HelperCache',{
	mixins: {
		observable: 'Ext.util.Observable'
	},
	
	singleton:true,
	
	// business logic data
	cfgAttributeStore: null,
	cfgSocStore: null,
	cfgWhseStore: null,
	cfgMvtflowStore: null,
	
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
		this.cfgContainerTypeStore = Ext.create('Ext.data.Store',{
			model: 'DbsLamCfgContainerTypeModel',
			data : ajaxData.data.cfg_container
		}) ;
		this.cfgMvtflowStore = Ext.create('Ext.data.Store',{
			model: 'DbsLamCfgMvtFlowModel',
			data : ajaxData.data.cfg_mvtflow
		}) ;
		this.cfgTplTransferStore = Ext.create('Ext.data.Store',{
			model: 'DbsLamCfgTplTransferModel',
			data : ajaxData.data.tpl_transfer
		}) ;
		this.cfgPrinterStore = Ext.create('Ext.data.Store',{
			model: 'DbsLamCfgPrinterModel',
			data : ajaxData.data.cfg_printer
		}) ;
		
		this.onLibLoad() ;
	},
	getAttributeAll: function() {
		return Ext.pluck( this.cfgAttributeStore.getRange(), 'data' ) ;
	},
	getAttribute: function(atrCode) {
		return this.cfgAttributeStore.getById(atrCode) ? this.cfgAttributeStore.getById(atrCode).getData(true) : null ;
	},
	getContainerTypeAll: function() {
		return Ext.pluck( this.cfgContainerTypeStore.getRange(), 'data' ) ;
	},
	getContainerType: function(containerType) {
		return this.cfgContainerTypeStore.getById(containerType) ? this.cfgSocStore.getById(containerType).getData(true) : null ;
	},
	getSocAll: function() {
		return Ext.pluck( this.cfgSocStore.getRange(), 'data' ) ;
	},
	getSoc: function(socCode) {
		return this.cfgSocStore.getById(socCode) ? this.cfgSocStore.getById(socCode).getData(true) : null ;
	},
	getWhseAll: function() {
		return Ext.pluck( this.cfgWhseStore.getRange(), 'data' ) ;
	},
	getWhse: function( whseCode ) {
		return this.cfgWhseStore.getById(whseCode) ? this.cfgWhseStore.getById(whseCode).getData(true) : null ;
	},
	getWhseAll: function() {
		return Ext.pluck( this.cfgWhseStore.getRange(), 'data' ) ;
	},
	getPrinter: function( printerIp ) {
		return this.cfgPrinterStore.getById(printerIp) ? this.cfgPrinterStore.getById(printerIp).getData(true) : null ;
	},
	getPrinterAll: function() {
		return Ext.pluck( this.cfgPrinterStore.getRange(), 'data' ) ;
	},
	getMvtflow: function( flowCode ) {
		return this.cfgMvtflowStore.getById(flowCode) ? this.cfgMvtflowStore.getById(flowCode).getData(true) : null ;
	},
	getMvtflowAll: function() {
		var data = [] ;
		this.cfgMvtflowStore.each( function(record) {
			data.push( record.getData(true) ) ;
		}) ;
		return data ;
	},
	getTplTransfer: function( transferTpl ) {
		return this.cfgTplTransferStore.getById(transferTpl) ? this.cfgTplTransferStore.getById(transferTpl).getData(true) : null ;
	},
	getTplTransferAll: function() {
		var data = [] ;
		this.cfgTplTransferStore.each( function(record) {
			data.push( record.getData(true) ) ;
		}) ;
		return data ;
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
