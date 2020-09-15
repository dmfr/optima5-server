Ext.define('DbsTracyGunPrinterModel',{
	extend: 'Ext.data.Model',
	idProperty: 'printer_uri',
	fields: [
		{name: 'printer_uri', type:'string'},
		{name: 'printer_type', type:'string'},
		{name: 'printer_spool_ip', type:'string'},
		{name: 'printer_qz_name', type:'string'},
		{name: 'printer_desc', type:'string'}
	]
});


Ext.define('Optima5.Modules.Spec.DbsTracy.GunHelper',{
	mixins: {
		observable: 'Ext.util.Observable'
	},
	
	singleton:true,
	
	// business logic data
	cfgGunPrinterStore: null,
	
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
			me.libCount = 1 ;
			
			this.cfgGunPrinterStore = Ext.create('Ext.data.Store',{
				model: 'DbsTracyGunPrinterModel',
				data : []
			}) ;
			me.fetchConfig() ;
		},500,me) ;
	},
	onLoad: function() {
		var me = this ;
		me.libCount-- ;
		if( me.libCount == 0 ) {
			me.isReady=true ;
			me.fireEvent('ready',this) ;
		}
	},
	
	fetchConfig: function() {
		// Query Bible
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_moduleId: 'spec_dbs_tracy',
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
		this.cfgSocStore = Ext.create('Ext.data.Store',{
			model: 'DbsTracyCfgSocModel',
			data : ajaxData.data.cfg_soc
		}) ;
		this.cfgPriorityStore = Ext.create('Ext.data.Store',{
			model: 'DbsTracyCfgPriorityModel',
			data : ajaxData.data.cfg_priority
		}) ;
		this.cfgKpiCodeStore = Ext.create('Ext.data.Store',{
			model: 'DbsTracyCfgKpiCodeModel',
			data : ajaxData.data.cfg_kpicode
		}) ;
		this.cfgListStore = Ext.create('Ext.data.Store',{
			model: 'DbsTracyCfgListModel',
			data : ajaxData.data.cfg_list,
			proxy: {
				type: 'memory',
				reader: {
					type: 'json'
				}
			}
		}) ;
		this.cfgOrderflowStore = Ext.create('Ext.data.Store',{
			model: 'DbsTracyCfgOrderFlowModel',
			data : ajaxData.data.cfg_orderflow,
			proxy: {
				type: 'memory',
				reader: {
					type: 'json'
				}
			}
		}) ;
		
		this.onLoad() ;
	},
	
	getSocAll: function() {
		return Ext.pluck( this.cfgSocStore.getRange(), 'data' ) ;
	},
	
	setFilters: function(filterValues) {
		this._savedFilterValues = filterValues ;
	},
	getFilters: function() {
		return this._savedFilterValues ;
	}
});
