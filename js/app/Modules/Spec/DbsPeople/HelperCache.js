Ext.define('DbsPeopleFieldModel', {
	extend: 'Ext.data.Model',
	idProperty: 'field',
	fields: [
		{name: 'field', type: 'string'},
		{name: 'text',  type: 'string'},
		{name: 'type',  type: 'string'},
		{name: 'link_type',  type: 'string'},
		{name: 'link_bible',  type: 'string'},
		{name: 'is_highlight',  type: 'boolean'}
	]
});

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
	cfgObj_whse_arrCliCodes: null,
	cfgObj_whseTreenode_arrCliCodes: null,
	cfgObj_whse_defaultCliCode: null,
	cfgObj_whse_arrRoleCodes: null,
	cfgObj_whse_arrTransfertWhses: null,
	cfgObj_team_prefCliCode: null,
	
	authPage: null,
	authWhse: null,
	authTeam: null,
	
	peopleFieldsStore: null,
	
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
			me.libCount = 4 ;
			
			me.startLoading() ;
			me.authHelperInit() ;
			me.fetchPeopleFields() ;
			me.fetchLinks() ;
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
				fields: ['id','text','auth_class','is_virtual','halfDay_open'],
				data : data
			}) ;
		},me) ;
		
		me.onLibLoad() ;
	},
	
	forTypeGetById: function( type, xCode ) {
		var me = this,
			record = me.cfgStores[type].getById(xCode),
			undefinedData = {
				id:'',
				text:'Non défini'
			};
		return ( record==null ? undefinedData : record.data ) ;
	},
	forTypeGetStore: function( type ) {
		var me = this ;
		return me.cfgStores[type] ;
	},
	forTypeGetAll: function( type, authCheck ) {
		var me = this,
			store = me.cfgStores[type] ;
		if( authCheck !== undefined ) {
			store.filterBy( function(rec) {
				if( rec.get('id').charAt(0) == '_' ) {
					return false ;
				}
				if( authCheck == false ) {
					return true ;
				}
				var recAuthClass = rec.get('auth_class') ;
				if( Ext.isEmpty(recAuthClass) ) {
					return true ;
				}
				return Optima5.Modules.Spec.DbsPeople.HelperCache.authHelperQueryPage(recAuthClass) ;
			}) ;
		}
		var returnData = Ext.pluck( me.cfgStores[type].getRange(), 'data' ) ;
		store.clearFilter(true) ;
		return returnData ;
	},
	forTypeGetAll_linkWhse: function( type, whseCode ) {
		var data = this.forTypeGetAll(type,true),
			returnData = [],
			arrCliCodes, arrRoleCodes, arrTransfertWhses ;
		Ext.Array.each( data, function(dataRow) {
			switch( type ) {
				case 'CLI' :
					if( arrCliCodes == null ) {
						arrCliCodes = this.links_cli_getForWhse(whseCode) ;
					}
					if( !Ext.Array.contains( arrCliCodes, dataRow.id ) ) {
						return ;
					}
					break ;
					
				case 'ROLE' :
					if( arrRoleCodes == null ) {
						arrRoleCodes = this.links_role_getForWhse(whseCode) ;
					}
					if( !Ext.Array.contains( arrRoleCodes, dataRow.id ) ) {
						return ;
					}
					break ;
					
				case 'WHSE' :
					if( arrTransfertWhses == null ) {
						arrTransfertWhses = this.links_transfertWhse_getForWhse(whseCode) ;
					}
					if( whseCode==dataRow.id || !Ext.Array.contains( arrTransfertWhses, dataRow.id ) ) {
						return ;
					}
					break ;
					
				default :
					break ;
			}
			returnData.push(dataRow) ;
		},this);
		return returnData ;
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
	
	fetchPeopleFields: function() {
		// Query Bible
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_moduleId: 'spec_dbs_people',
			_action: 'cfg_getPeopleFields'
		});
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				var ajaxData = Ext.decode(response.responseText) ;
				if( ajaxData.success == false ) {
					Ext.Msg.alert('Failed', 'Unknown error');
				}
				else {
					this.onLoadPeopleFields( ajaxData ) ;
				}
			},
			scope: this
		});
	},
	onLoadPeopleFields: function( ajaxData ) {
		this.peopleFieldsStore = Ext.create('Ext.data.Store',{
			model: 'DbsPeopleFieldModel',
			data : ajaxData.data
		}) ;
		
		this.onLibLoad() ;
	},
	getPeopleFields: function() {
		return Ext.pluck( this.peopleFieldsStore.getRange(), 'data' ) ;
	},
	getPeopleField: function(peopleFieldCode) {
		var peopleFieldRecord = this.peopleFieldsStore.getById(peopleFieldCode) ;
		if( peopleFieldRecord ) {
			return peopleFieldRecord.data ;
		}
		return null ;
	},
	
	fetchLinks: function() {
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_moduleId: 'spec_dbs_people',
			_action: 'cfg_getLinks'
		});
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				var ajaxData = Ext.decode(response.responseText) ;
				if( ajaxData.success == false ) {
					Ext.Msg.alert('Failed', 'Unknown error');
				}
				else {
					this.onLoadLinks( ajaxData ) ;
				}
			},
			scope: this
		});
	},
	onLoadLinks: function( ajaxData ) {
		this.cfgObj_whse_arrCliCodes = ajaxData.data.obj_whse_arrCliCodes ;
		this.cfgObj_whseTreenode_arrCliCodes = ajaxData.data.obj_whseTreenode_arrCliCodes ;
		this.cfgObj_whse_defaultCliCode = ajaxData.data.obj_whse_defaultCliCode ;
		
		this.cfgObj_whse_arrRoleCodes = ajaxData.data.obj_whse_arrRoleCodes ;
		
		this.cfgObj_whse_arrTransfertWhses = ajaxData.data.obj_whse_arrTransfertWhses ;
		
		this.cfgObj_team_prefCliCode = ajaxData.data.obj_team_prefCliCode ;
		
		this.onLibLoad() ;
	},
	links_cli_isSilent: function( whseCode ) {
		if( !this.cfgObj_whse_arrCliCodes[whseCode] || this.cfgObj_whse_arrCliCodes[whseCode].length <= 1 ) {
			return true ;
		}
		return false ;
	},
	links_cli_getDefaultForWhse: function( whseCode ) {
		if( Ext.isEmpty(this.cfgObj_whse_arrCliCodes[whseCode]) ) {
			return '' ;
		}
		if( this.cfgObj_whse_arrCliCodes[whseCode].length == 1 ) {
			return this.cfgObj_whse_arrCliCodes[whseCode][0] ;
		}
		if( !Ext.isEmpty(this.cfgObj_whse_defaultCliCode[whseCode]) ) {
			return this.cfgObj_whse_defaultCliCode[whseCode] ;
		}
		return null ;
	},
	links_cli_getForWhse: function( whseCode ) {
		return Ext.clone(this.cfgObj_whse_arrCliCodes[whseCode]) || [] ;
	},
	links_cli_getForWhseTreenode: function( whseTreenodeCode ) {
		return Ext.clone(this.cfgObj_whseTreenode_arrCliCodes[whseTreenodeCode]) || [] ;
	},
	links_role_getForWhse: function( whseCode ) {
		return Ext.clone(this.cfgObj_whse_arrRoleCodes[whseCode]) || [] ;
	},
	links_transfertWhse_getForWhse: function( whseCode ) {
		return Ext.clone(this.cfgObj_whse_arrTransfertWhses[whseCode]) || [] ;
	},
	links_cli_getPrefForTeam: function( teamCode ) {
		if( !Ext.isEmpty(this.cfgObj_team_prefCliCode[teamCode]) ) {
			return this.cfgObj_team_prefCliCode[teamCode] ;
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
