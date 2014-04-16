Ext.define('Optima5.Modules.Spec.DbsPeople.HelperCache',{
	mixins: {
		observable: 'Ext.util.Observable'
	},
	
	DayNamesIntl: {
		EN: Ext.Date.dayNames,
		FR: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi']
	},
	
	singleton:true,
	
	cfgStores: null,
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
		
		Ext.defer(function() {
			me.startLoading() ;
		},1000,me) ;
	},
	startLoading: function() {
		var me = this ;
		
		// Query CFG
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_moduleId: 'spec_dbs_people',
			_action: 'cfg_getCfgBibles',
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
					me.onLoad( ajaxData ) ;
				}
			},
			scope: me
		});
	},
	onLoad: function(ajaxData) {
		var me = this ;
		
		me.cfgStores = {} ;
		// Populate stores
		Ext.Object.each( ajaxData.data, function(type,data) {
			me.cfgStores[type] = Ext.create('Ext.data.Store',{
				fields: ['id','text'],
				data : data
			}) ;
		},me) ;
		
		me.isReady = true ;
		me.fireEvent('ready') ;
	},
	
	forTypeGetById: function( type, xCode ) {
		var me = this,
			record = me.cfgStores[type].getById(xCode),
			undefinedData = {
				id:'_',
				text:'Non défini'
			};
		return ( record==null ? undefinedData : record.data ) ;
	},
	forTypeGetStore: function( type ) {
		var me = this ;
		return me.cfgStores[type] ;
	},
	forTypeGetAll: function( type ) {
		var me = this ;
		return Ext.pluck( me.cfgStores[type].getRange(), 'data' ) ;
	}
});