Ext.define('DbsTracyCfgSocModel',{
	extend: 'Ext.data.Model',
	idProperty: 'soc_code',
	fields: [
		{name: 'soc_code', type:'string', useNull:true},
		{name: 'soc_txt', type:'string'}
	]
});

Ext.define('DbsTracyCfgListItemModel',{
	extend: 'Ext.data.Model',
	idProperty: 'id',
	fields: [
		{name: 'id', type:'string'},
		{name: 'text', type:'string'}
	]
});
Ext.define('DbsTracyCfgListModel',{
	extend: 'Ext.data.Model',
	idProperty: 'bible_code',
	fields: [
		{name: 'bible_code', type:'string'}
	],
	hasMany: [{
		model: 'DbsTracyCfgListItemModel',
		name: 'records',
		associationKey: 'records'
	}]
});

Ext.define('DbsTracyCfgOrderStepModel',{
	extend: 'Ext.data.Model',
	idProperty: 'step_code',
	fields: [
		{name: 'step_code', type:'string'},
		{name: 'step_txt', type:'string'},
		{name: 'status_percent', type:'string'}
	]
});
Ext.define('DbsTracyCfgOrderFlowModel',{
	extend: 'Ext.data.Model',
	idProperty: 'flow_code',
	fields: [
		{name: 'flow_code', type:'string'},
		{name: 'flow_txt', type:'string'}
	],
	hasMany: [{
		model: 'DbsTracyCfgOrderStepModel',
		name: 'steps',
		associationKey: 'steps'
	}]
});


Ext.define('Optima5.Modules.Spec.DbsTracy.HelperCache',{
	mixins: {
		observable: 'Ext.util.Observable'
	},
	
	singleton:true,
	
	cfgSocStore: null,
	cfgListStore: null,
	
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
		},200,me) ;
	},
	startLoading: function() {
		var me = this ;
		
		me.nbToLoad = 2 ;
		
		me.authHelperInit() ;
		me.fetchConfig() ;
	},
	onLoad: function() {
		var me = this ;
		me.nbLoaded++ ;
		if( me.nbToLoad <= me.nbLoaded ) {
			me.isReady = true ;
			me.fireEvent('ready') ;
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
			data : ajaxData.data.cfg_orderflow
		}) ;
		
		this.onLoad() ;
	},
	
	authHelperInit: function() {
		var me = this ;
		
		me.authPages = {} ; // userId => [pages]
		me.authNodes = [] ; // [userId@whseCode@teamCode]
		
		// Query Bible
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_moduleId: 'spec_dbs_tracy',
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
				
				me.onLoad() ;
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
	
	getSocAll: function() {
		return Ext.pluck( this.cfgSocStore.getRange(), 'data' ) ;
	},
	getSoc: function(socCode) {
		return this.cfgSocStore.getById(socCode) ? this.cfgSocStore.getById(socCode).getData(true) : null ;
	},
	
	getListData: function(listId) {
		return this.cfgListStore.getById(listId) ? Ext.pluck(this.cfgListStore.getById(listId).records().getRange(), 'data') : null ;
	}
});
