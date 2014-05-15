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
			me.libCount = 2 ;
			
			me.startLoading() ;
			me.authHelperInit() ;
		},1000,me) ;
	},
	
	
	startLoading: function() {
		var me = this ;
		
		// Query CFG
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_moduleId: 'spec_dbs_people',
			_action: 'cfg_getCfgBibles'
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
		
		me.onLibLoad() ;
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
	},
	
	
	authHelperInit: function() {
		var me = this ;
		
		me.authPages = {} ; // userId => [pages]
		me.authNodes = [] ; // [userId@whseCode@teamCode]
		
		// Query Bible
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_moduleId: 'spec_dbs_people',
			_action: 'auth_getTable'
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
					me.authWhse = ajaxData.authWhse ;
					me.authTeam = ajaxData.authTeam ;
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
	authHelperQueryWhse: function( whseCode ) {
		var me = this ;
			
		if( me.optimaModule.getSdomainRecord().get('auth_has_all') ) {
			return true ;
		}
		return ( !Ext.isEmpty(me.authWhse) && Ext.Array.contains( me.authWhse, whseCode ) ) ;
	},
	authHelperQueryTeam: function( teamCode ) {
		var me = this ;
			
		if( me.optimaModule.getSdomainRecord().get('auth_has_all') ) {
			return true ;
		}
		return ( !Ext.isEmpty(me.authTeam) && Ext.Array.contains( me.authTeam, teamCode ) ) ;
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