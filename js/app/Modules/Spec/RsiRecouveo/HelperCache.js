Ext.define('RsiRecouveoCfgAtrItemModel',{
	extend: 'Ext.data.Model',
	idProperty: 'id',
	fields: [
		{name: 'node', type:'string'},
		{name: 'id', type:'string'},
		{name: 'text', type:'string'}
	]
});
Ext.define('RsiRecouveoCfgAtrModel',{
	extend: 'Ext.data.Model',
	idProperty: 'bible_code',
	fields: [
		{name: 'bible_code', type:'string'},
		{name: 'atr_code', type:'string'},
		{name: 'atr_txt', type:'string'}
	],
	hasMany: [{
		model: 'RsiRecouveoCfgAtrItemModel',
		name: 'records',
		associationKey: 'records'
	}]
});
Ext.define('RsiRecouveoCfgStatusModel',{
	extend: 'Ext.data.Model',
	idProperty: 'status_id',
	fields: [
		{name: 'status_id', type:'string'},
		{name: 'status_txt', type:'string'},
		{name: 'status_code', type:'string'},
		{name: 'status_color', type:'string'}
	]
});
Ext.define('RsiRecouveoCfgActionModel',{
	extend: 'Ext.data.Model',
	idProperty: 'action_id',
	fields: [
		{name: 'action_id', type:'string'},
		{name: 'action_txt', type:'string'},
		{name: 'group_id', type:'string'},
		{name: 'status_open', type:'auto'},
		{name: 'status_next', type:'auto'},
		{name: 'agenda_class', type:'string'}
	]
});
Ext.define('RsiRecouveoCfgActionEtaModel',{
	extend: 'Ext.data.Model',
	idProperty: 'eta_range',
	fields: [
		{name: 'eta_range', type:'string'},
		{name: 'eta_txt', type:'string'},
		{name: 'eta_color', type:'string'},
		{name: 'upto_days', type:'int'}
	]
});


Ext.define('Optima5.Modules.Spec.RsiRecouveo.HelperCache',{
	mixins: {
		observable: 'Ext.util.Observable'
	},
	
	singleton:true,
	
	isReady: false,
	nbLoaded: 0,
	nbToLoad: 0,
	
	constructor: function(config) {
		//build store
		var me = this ;
		me.mixins.observable.constructor.call(this, config);
	},
	init: function(optimaModule, cmpId) {
		var me = this ;
		me.optimaModule = optimaModule ;
		me.cmpId = cmpId ;
		me.isReady = false ;
		
		Ext.defer(function() {
			me.startLoading() ;
		},1000,me) ;
	},
	startLoading: function() {
		var me = this ;
		
		me.nbToLoad = 1 ;
		
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
			_moduleId: 'spec_rsi_recouveo',
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
		this.cfgAtrStore = Ext.create('Ext.data.Store',{
			model: 'RsiRecouveoCfgAtrModel',
			data : ajaxData.data.cfg_atr,
			proxy: {
				type: 'memory',
				reader: {
					type: 'json'
				}
			}
		}) ;
		this.cfgStatusStore = Ext.create('Ext.data.Store',{
			model: 'RsiRecouveoCfgStatusModel',
			data : ajaxData.data.cfg_status
		}) ;
		this.cfgActionStore = Ext.create('Ext.data.Store',{
			model: 'RsiRecouveoCfgActionModel',
			data : ajaxData.data.cfg_action
		}) ;
		this.cfgActionEtaStore = Ext.create('Ext.data.Store',{
			model: 'RsiRecouveoCfgActionEtaModel',
			data : ajaxData.data.cfg_action_eta
		}) ;
		
		var cmpId = this.cmpId ;
		
		var pushModelFields = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
			pushModelFields.push({
				name: atrId,
				type: 'string'
			}) ;
		}) ;
		Ext.ux.dams.ModelManager.unregister( 'RsiRecouveoRecordModel'+'-'+cmpId ) ;
		Ext.define('RsiRecouveoRecordModel'+'-'+cmpId,{
			extend: 'RsiRecouveoRecordTplModel',
			idProperty: 'record_filerecord_id',
			fields: pushModelFields
		}) ;
		Ext.ux.dams.ModelManager.unregister( 'RsiRecouveoFileModel'+'-'+cmpId ) ;
		Ext.define('RsiRecouveoFileModel'+'-'+cmpId,{
			extend: 'RsiRecouveoFileTplModel',
			idProperty: 'file_filerecord_id',
			fields: pushModelFields,
			hasMany: [{
				model: 'RsiRecouveoFileActionModel',
				name: 'actions',
				associationKey: 'actions'
			},{
				model: 'RsiRecouveoRecordModel'+'-'+cmpId,
				name: 'records',
				associationKey: 'records'
			},{
				model: 'RsiRecouveoAdrPostalModel',
				name: 'adr_postal',
				associationKey: 'adr_postal'
			},{
				model: 'RsiRecouveoAdrTelModel',
				name: 'adr_tel',
				associationKey: 'adr_tel'
			}]
		}) ;
		
		this.onLoad() ;
	},
	getFileModel: function() {
		return 'RsiRecouveoFileModel'+'-'+this.cmpId ;
	},
	getRecordModel: function() {
		return 'RsiRecouveoRecordModel'+'-'+this.cmpId ;
	},
	
	getAllAtrIds: function() {
		var atrIds = [] ;
		this.cfgAtrStore.each( function(atrRecord) {
			atrIds.push( atrRecord.getId()) ;
		}) ;
		return atrIds ;
	},
	getAtrHeader: function(atrId) {
		return this.cfgAtrStore.getById(atrId).getData() ;
	},
	getAtrData: function(atrId) {
		return this.cfgAtrStore.getById(atrId) ? Ext.pluck(this.cfgAtrStore.getById(atrId).records().getRange(), 'data') : null ;
	},
	
	getStatusAll: function() {
		return Ext.pluck( this.cfgStatusStore.getRange(), 'data' ) ;
	},
	
	getActionAll: function() {
		return Ext.pluck( this.cfgActionStore.getRange(), 'data' ) ;
	},
	
	getActionEtaAll: function() {
		return Ext.pluck( this.cfgActionEtaStore.getRange(), 'data' ) ;
	},
	
	authHelperHasAll: function() {
		var me = this ;
		if( me.optimaModule.getSdomainRecord().get('auth_has_all') ) {
			return true ;
		}
		return false ;
	}
});
