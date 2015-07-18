Ext.define('DbsPeopleForecastCfgUoRole', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'role_code',  type: 'string'},
		{name: 'role_hRate', type: 'int'}
	]
});
Ext.define('DbsPeopleForecastCfgUo', {
	extend: 'Ext.data.Model',
	idProperty: 'uo_code',
	fields: [
		{name: 'uo_code',  type: 'string'}
	],
	hasMany: [{
		model: 'DbsPeopleForecastCfgUoRole',
		name: 'roles',
		associationKey: 'roles'
	}]
});

Ext.define('DbsPeopleForecastDayResourceModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'rsrc_date',  type: 'string'},
		{name: 'rsrc_role_code',  type: 'string'},
		{name: 'rsrc_qty_hour', type: 'float'},
		{name: 'rsrc_qty_people', type: 'int'}
	]
});
Ext.define('DbsPeopleForecastUoVolumeModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'uo_code',  type: 'string'},
		{name: 'uo_qty_unit', type: 'int'}
	]
});
Ext.define('DbsPeopleForecastWeekCoefModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'weekday_date',  type: 'string'},
		{name: 'weekday_coef', type: 'int'}
	]
});
Ext.define('DbsPeopleForecastWeekModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'week_date',  type: 'string'},
		{name: 'whse_code', type: 'string'}
	],
	hasMany: [{
		model: 'DbsPeopleForecastDayResourceModel',
		name: 'day_resources',
		associationKey: 'day_resources'
	},{
		model: 'DbsPeopleForecastUoVolumeModel',
		name: 'week_volumes',
		associationKey: 'week_volumes'
	},{
		model: 'DbsPeopleForecastWeekCoefModel',
		name: 'week_coefs',
		associationKey: 'week_coefs'
	}]
});

Ext.define('DbsPeopleForecastRowModel', {
	extend: 'Ext.data.Model',
	idProperty: 'id',
	fields: [
		{name: 'id',  type: 'string'},
		{name: '_hidden', type:'boolean'},
		{name: '_editable', type:'boolean'},
		{name: 'group_id',  type: 'string'},
		{name: 'role_code',  type: 'string'},
		{
			name: 'role_txt',
			type: 'string',
			convert: function(v, record) {
				v = record.data.role_code ;
				return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("ROLE",v).text ;
			}
		},
		{name: 'uo_code',  type: 'string'},
		{
			name: 'uo_txt',
			type: 'string',
			convert: function(v, record) {
				v = record.data.uo_code ;
				return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("UO",v).text ;
			}
		},
		{name: 'dummy',   type: 'string'}
	]
});

Ext.define('Optima5.Modules.Spec.DbsPeople.ForecastPanel',{
	extend:'Ext.panel.Panel',
	
	requires:[
		'Optima5.Modules.Spec.DbsPeople.ForecastCfgWhsePanel'
	],
	
	whseCode: null,
	dateBase: null,
	dateWeekdetail: null,
	viewMode: 'weeklist',
	weekCount: 25,
	
	forecastCfgUoStore: null,
	forecastWeekStore: null,
	nowTimestamp: 0,
	
	initComponent: function() {
		Ext.apply(this,{
			//frame: true,
			border: false,
			layout:'fit',
			tbar:[{
				icon: 'images/op5img/ico_back_16.gif',
				text: '<u>Retour menu</u>',
				handler: function(){
					this.handleQuit() ;
				},
				scope: this
			},{
				xtype: 'tbseparator'
			},Ext.create('Optima5.Modules.Spec.DbsPeople.CfgParamSiteButton',{
				itemId: 'btnSite',
				optimaModule: this.optimaModule,
				listeners: {
					change: {
						fn: function() {
							this.onSiteSet() ;
						},
						scope: this
					},
					ready: {
						fn: function() {
							this.onPreInit() ;
						},
						scope: this
					}
				}
			}),{
				icon: 'images/op5img/ico_calendar_16.png',
				itemId: 'tbDate',
				menu: Ext.create('Ext.menu.DatePicker',{
					startDay: 1,
					listeners:{
						select: function( datepicker, date ) {
							this.onDateSet(date) ;
							Ext.menu.Manager.hideAll() ;
						},
						scope: this
					}
				})
			},{
				itemId: 'tbViewmode',
				viewConfig: {forceFit: true},
				menu: {
					defaults: {
						handler:function(menuitem) {
							//console.log('ch view '+menuitem.itemId) ;
							this.onViewSet( menuitem.itemId ) ;
						},
						scope:this
					},
					items: [{
						itemId: 'weeklist',
						text: 'Week list',
						iconCls: 'op5-crmbase-datatoolbar-view-grid'
					},{
						itemId: 'weekdetail',
						text: 'Week details',
						iconCls: 'op5-crmbase-datatoolbar-view-calendar'
					}]
				}
				
			},'->',{
				iconCls: 'op5-crmbase-datatoolbar-refresh',
				text: 'Refresh',
				handler: function() {
					this.doLoad() ;
				},
				scope: this
			},{
				itemId: 'tbSettings',
				hidden: true,
				icon: 'images/op5img/ico_config_small.gif',
				viewConfig: {forceFit: true},
				menu: {
					items: [{
						text: 'Importation RealPeople',
						icon: 'images/op5img/ico_dataadd_16.gif',
						handler:function(menuitem) {
							this.sendBuildResources() ;
						},
						scope: this
					},{
						text: 'Config. UO / whse',
						icon: 'images/op5img/ico_blocs_small.gif',
						handler:function(menuitem) {
							this.openCfgWhse() ;
						},
						scope: this
					}]
				}
			}],
			items:[]
		});
		this.preInit = 1 ;
		this.callParent() ;
	},
	onPreInit: function() {
		this.preInit-- ;
		if( this.preInit == 0 ) {
			this.isReady=true ;
			this.startPanel() ;
		}
	},
	startPanel: function() {
		this.tmpModelName = 'DbsPeopleForecastRowModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpModelName ) ;
		}) ;
		
		this.onSiteSet() ;
		this.onDateSet( new Date() ) ;
		this.onViewSet( this.viewMode ) ;
		return ;
	},
	
	helperGetRoleTxt: function( roleCode ) {
		return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("ROLE",roleCode).text ;
	},
	helperGetWhseTxt: function( whseCode ) {
		return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("WHSE",whseCode).text ;
	},
	helperGetTeamTxt: function( teamCode ) {
		return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("TEAM",teamCode).text ;
	},
	helperGetAbsTxt: function( absCode ) {
		return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("ABS",absCode).text ;
	},
	helperGetCliTxt: function( cliCode ) {
		return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("CLI",cliCode).text ;
	},
	
	onSiteSet: function() {
		var filterSiteBtn = this.down('#btnSite') ;
		if( !Ext.isEmpty(filterSiteBtn.getLeafNodesKey()) && filterSiteBtn.getLeafNodesKey().length == 1 ) {
			this.whseCode = filterSiteBtn.getLeafNodesKey()[0] ;
		} else {
			this.whseCode = null ;
		}
		
		this.doLoad() ;
	},
	onDateSet: function( date ) {
		var tbDate = this.child('toolbar').getComponent('tbDate') ;
		
		// configuration GRID
		var first = date.getDate() - ( date.getDay() > 0 ? date.getDay() : 7 ) + 1; // First day is the day of the month - the day of the week
		var last = first + 6; // last day is the first day + 6
		
		var dateToset = new Date(Ext.clone(date).setDate(first));
		switch( this.viewMode ) {
			case 'weeklist' :
				this.dateBase = dateToset ;
				break ;
			case 'weekdetail' :
				this.dateWeekdetail = dateToset ;
				break ;
		}
		
		this.updateToolbar() ;
		this.doLoad() ;
	},
	onViewSet: function( viewId ) {
		var tbViewmode = this.child('toolbar').getComponent('tbViewmode'),
			tbViewmodeItem = tbViewmode.menu.getComponent(viewId),
			iconCls, text,
			disableExport = false ;
		if( tbViewmodeItem ) {
			var oldViewMode = this.viewMode ;
			this.viewMode = viewId ;
			if( this.viewMode == 'weekdetail' && oldViewMode != 'weekdetail' ) {
				this.dateWeekdetail = this.dateBase ;
			}
		}
		
		this.updateToolbar() ;
		this.doLoad() ;
	},
	updateToolbar: function(doActivate) {
		var tbSettings = this.child('toolbar').getComponent('tbSettings'),
			tbDate = this.child('toolbar').getComponent('tbDate'),
			tbViewmode = this.child('toolbar').getComponent('tbViewmode') ;
		
		if( doActivate !== undefined ) {
			tbSettings.setVisible(doActivate) ;
		}
		
		// View mode
		var tbViewmodeItem = tbViewmode.menu.getComponent(this.viewMode) ;
		if( tbViewmodeItem ) {
			tbViewmode.setText( '<b>' + tbViewmodeItem.text + '</b>' );
			tbViewmode.setIconCls( tbViewmodeItem.iconCls );
		}
		
		// Date
		var activeDateWeek = null ;
		switch( this.viewMode ) {
			case 'weeklist' :
				activeDateWeek = this.dateBase ;
				break ;
			case 'weekdetail' :
				activeDateWeek = this.dateWeekdetail ;
				break ;
		}
		if( activeDateWeek ) {
			var weekStr = 'Sem. ' + Ext.Date.format( activeDateWeek, 'W / o' ) ;
			tbDate.setText('<b>' + weekStr + '</b>') ;
		}
	},
	getDateStart: function() {
		var dateCur ;
		switch( this.viewMode ) {
			case 'weeklist' :
				dateCur = Ext.clone(this.dateBase) ;
				dateCur.setDate( dateCur.getDate() - 7 ) ;
				break ;
			case 'weekdetail' :
				dateCur = Ext.clone(this.dateWeekdetail) ;
				break ;
			default :
				break ;
		}
		return dateCur ;
	},
	
	
	
	showLoadmask: function() {
		if( this.rendered ) {
			this.doShowLoadmask() ;
		} else {
			this.on('afterrender',this.doShowLoadmask,this,{single:true}) ;
		}
	},
	doShowLoadmask: function() {
		if( this.loadMask ) {
			return ;
		}
		this.loadMask = Ext.create('Ext.LoadMask',{
			target: this,
			msg:"Please wait..."
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
	},
	
	doLoad: function() {
		if( !this.isReady ) {
			return ;
		}
		
		var filterSiteBtn = this.down('#btnSite') ;
		if( !(this.whseCode && this.dateBase && this.viewMode) ) {
			this.updateToolbar(false) ;
			return this.onLoadEmpty() ;
		}
		
		this.showLoadmask() ;
		this.updateToolbar(true) ;
		
		var params = {
			_moduleId: 'spec_dbs_people',
			_action: 'Forecast_getWeeks'
		};
		Ext.apply( params, {
			whse_code: this.whseCode,
			date_start_sql: Ext.Date.format( this.getDateStart(), 'Y-m-d' ),
			date_count: ( this.viewMode=='weeklist' ? this.weekCount : 1 )
		}) ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: params,
			success: function(response) {
				this.onLoadResponse(response) ;
			},
			scope: this
		});
	},
	onLoadEmpty: function() {
		this.removeAll() ;
		this.add({
			xtype:'box',
			cls:'ux-noframe-bg'
		}) ;
	},
	onLoadResponse: function(response) {
		var jsonResponse = Ext.JSON.decode(response.responseText) ;
		
		// Init stores
		this.forecastCfgUoStore = Ext.create('Ext.data.Store',{
			model: 'DbsPeopleForecastCfgUo',
			data: jsonResponse.data.cfg_uo,
			proxy: {
				type: 'memory' ,
				reader: {
					type: 'json'
				}
			}
		});
		this.forecastWeekStore = Ext.create('Ext.data.Store',{
			model: 'DbsPeopleForecastWeekModel',
			data: jsonResponse.data.weeks,
			proxy: {
				type: 'memory' ,
				reader: {
					type: 'json'
				}
			},
			getById: function(id) { //HACK
				return this.idMap[id];
			},
			listeners:{
				load: function(store,records,successful) {
					store.idMap = {};
					Ext.Array.forEach(records, function(record) {
						store.idMap[record.getId()] = record;
					});
				}
			}
		});
		this.nowTimestamp = jsonResponse.timestamp || (Date.now() / 1000) ; 
		
		// Create grid
		this.doGridConfigure() ;
		
		// Create records
		this.gridAdapterInit() ;
		
		// Drop loadmask
		this.hideLoadmask();
	},
	doGridConfigure: function() {
		var pushModelfields = [] ;
		var columns = [{
			locked: true,
			menuDisabled: true,
			groupable: true,
			hidden: true,
			text: 'Group key',
			dataIndex: 'group_id',
			width: 180
		},{
			locked: true,
			menuDisabled: true,
			text: 'UO / Role',
			width: 180,
			dataIndex: 'uo_code',
			renderer: function(v,metaData,record) {
				switch( record.get('group_id') ) {
					case '0_WEEKCOEFS' :
						return '<i>Coefficient jour</i>' ;
					case '1_FCAST_UO' :
						return record.get('uo_txt') ;
					case '2_FCAST_ROLES_H' :
						return record.get('role_txt') ;
					case '3_CAPACITY_ROLES_H' :
						return record.get('role_txt') ;
					case '4_BALANCE_ROLES_PEOPLE' :
						return record.get('role_txt') ;
				}
			}
		}] ;
		
		switch( this.viewMode ) {
			case 'weeklist' :
				this.doGridConfigurePushWeeklist(pushModelfields,columns) ;
				break ;
			case 'weekdetail' :
				this.doGridConfigurePushWeekdetail(pushModelfields,columns) ;
				break ;
		}
		
		Ext.ux.dams.ModelManager.unregister( this.tmpModelName ) ;
		Ext.define(this.tmpModelName, {
			extend: 'DbsPeopleForecastRowModel',
			fields: pushModelfields
		});
		
		var columnDefaults = {
			menuDisabled: false,
			draggable: false,
			sortable: false,
			hideable: false,
			resizable: false,
			groupable: true, // Dummy groupable, just to prevent menu from being permntly disabled
			lockable: false
		} ;
		Ext.Array.each( columns, function(column) {
			Ext.applyIf( column, columnDefaults ) ;
		}) ;
		
		this.removeAll() ;
		this.add({
			border: false,
			xtype:'grid',
			store: {
				model: this.tmpModelName,
				data: [],
				filters: [{
					property: '_hidden',
					value: false
				}],
				sorters: [{
					property: 'role_code',
					direction: 'ASC'
				},{
					property: 'uo_code',
					direction: 'ASC'
				}],
				grouper: {
					property: 'group_id',
					direction: 'ASC'
				},
				proxy:{
					type:'memory'
				}
			},
			enableLocking: true,
			plugins: [Ext.create('Ext.grid.plugin.CellEditing',{
				pluginId: 'cellediting',
				clicksToEdit: 1,
				listeners: {
					beforeedit: this.onGridBeforeEdit,
					validateedit: this.onGridAfterEdit,
					scope: this
				},
				lockableScope: 'normal'
			})],
			features: [{
				ftype: 'grouping',
				hideGroupedHeader: false,
				enableGroupingMenu: false,
				enableNoGroups: false,
				groupHeaderTpl:Ext.create('Ext.XTemplate',
					'<div>{[this.renderer(values)]}</div>',
					{
						renderer: function(values) {
							if( values.rows.length == 0 ) {
								return '' ;
							}
							switch( values.groupField ) {
								case 'group_id' :
									var groupId = values.rows[0].data.group_id ;
									switch( groupId ) {
										case '0_WEEKCOEFS' :
											return 'Répartition sur semaine' ;
										case '1_FCAST_UO' :
											return 'Forecast (UOs)' ;
										case '2_FCAST_ROLES_H' :
											return 'Forecast - Roles (Heures)' ;
										case '3_CAPACITY_ROLES_H' :
											return 'Capacité - Roles (Heures)' ;
										case '4_BALANCE_ROLES_PEOPLE' :
											return 'Besoins (personnes)' ;
										default :
											return '???' ;
									}
									break ;
								default :
									return '???' ;
							}
						}
					}
				)
			}],
			columns: columns,
			listeners: {
				afterlayout: function( gridpanel ) {
					gridpanel.headerCt.on('menucreate',this.onColumnsMenuCreate,this) ;
				},
				scope: this
			},
			viewConfig: {
				preserveScrollOnRefresh: true,
				getRowClass: function(record) {
					if( record.get('_editable') ) {
						return 'op5-spec-dbspeople-realcolor-open' ;
					}
				}
			}
		}) ;
	},
	gridValueRenderer: function(v,metaData,record) {
		if( Ext.isEmpty(v) ) {
			return ;
		}
		switch( record.get('group_id') ) {
			case '0_WEEKCOEFS' :
				return v.day_coef ;
			
			case '1_FCAST_UO' :
				if( v.uo_qty_unit == null ) {
					return '' ;
				}
				return Math.round(v.uo_qty_unit) ;
			
			case '2_FCAST_ROLES_H' :
				if( v.role_qty_h == null ) {
					return '' ;
				}
				return Math.round(v.role_qty_h) ;
			
			case '3_CAPACITY_ROLES_H' :
				metaData.style += '; font-weight:bold;'
				if( v.role_qty_h == null ) {
					return '' ;
				}
				return Math.round(v.role_qty_h) ;
				
			case '4_BALANCE_ROLES_PEOPLE' :
				if( Ext.isEmpty(v) ) {
					return '' ;
				}
				metaData.style += '; font-weight:bold;'
				if( isNaN(v.role_qty_people) ) {
					return v.role_qty_people ;
				}
				if( v.role_qty_people == 0 ) {
					return '=' ;
				}
				var sign ;
				if( v.role_qty_people > 0 ) {
					metaData.tdCls += ' op5-spec-dbspeople-balance-neg' ;
					sign = '+' ;
				} else {
					metaData.tdCls += ' op5-spec-dbspeople-balance-pos' ;
					sign = '-' ;
				}
				return sign + ' ' + Ext.util.Format.number( Math.abs(v.role_qty_people), '0.00' ) ;
		}
	},
	doGridConfigurePushWeeklist: function(pushModelfields, pushColumns) {
		var dateCur = this.getDateStart() ;
		
		var nowWeek = Ext.Date.format(new Date(this.nowTimestamp*1000),'o-W') ;
		
		for( var idx = 0 ; idx <= this.weekCount ; idx++ ) {
			if( idx > 0 ) {
				dateCur.setDate( dateCur.getDate() + 7 ) ;
			}
			
			var dStr = Ext.Date.format(dateCur,'Ymd'),
				dSql = Ext.Date.format(dateCur,'Y-m-d'),
				weekStr = Ext.Date.format(dateCur,'o-W') ;
				text = 'Sem ' + Ext.Date.format(dateCur,'W / o') ;
			
			pushModelfields.push({
				name:'w_'+dStr,
				type:'auto'
			}) ;
			
			pushColumns.push({
				width: 100,
				align: 'center',
				text: text,
				dateSqlWeek: dSql,
				dateSql: dSql,
				dateStr: dStr,
				dataIndex: 'w_'+dStr,
				dateType: 'week',
				editor: { xtype: 'numberfield', minValue: 0, keyNavEnabled: false },
				renderer: this.gridValueRenderer,
				cls: ( weekStr==nowWeek ? 'op5-spec-dbspeople-forecast-column-now' : '' ),
				tdCls: ( weekStr==nowWeek ? 'op5-spec-dbspeople-forecast-column-now' : weekStr<nowWeek ? 'op5-spec-dbspeople-forecast-column-past' : '' )
			}) ;
		}
	},
	doGridConfigurePushWeekdetail: function(pushModelfields, pushColumns) {
		var dateCur = this.getDateStart() ;
		var dateWeek = this.getDateStart() ;
		var nowDay = Ext.Date.format(new Date(this.nowTimestamp*1000),'Y-m-d') ;
		for( var idx = 0 ; idx < 7 ; idx++ ) {
			if( idx > 0 ) {
				dateCur.setDate( dateCur.getDate() + 1 ) ;
			}
			
			var dStr = Ext.Date.format(dateCur,'Ymd'),
				dSql = Ext.Date.format(dateCur,'Y-m-d'),
				dateSqlWeek = Ext.Date.format(dateWeek,'Y-m-d'),
				text = Optima5.Modules.Spec.DbsPeople.HelperCache.DayNamesIntl.FR[dateCur.getDay()] + ' ' + Ext.Date.format(dateCur,'d/m') ;
			
			pushModelfields.push({
				name:'d_'+dStr,
				type:'auto'
			}) ;
			
			pushColumns.push({
				menuDisabled: true,
				width: 100,
				align: 'center',
				text: text,
				dateSqlWeek: dateSqlWeek,
				dateSql: dSql,
				dateStr: dStr,
				dataIndex: 'd_'+dStr,
				dateType: 'day',
				editor: { xtype: 'numberfield', minValue: 0, keyNavEnabled: false },
				renderer: this.gridValueRenderer,
				cls: ( dSql==nowDay ? 'op5-spec-dbspeople-forecast-column-now' : '' ),
				tdCls: ( dSql==nowDay ? 'op5-spec-dbspeople-forecast-column-now' : dSql<nowDay ? 'op5-spec-dbspeople-forecast-column-past' : '' )
			}) ;
		}
	},
	onColumnsMenuCreate: function( headerCt, menu ) {
		if( true ) {
			menu.add({
				itemId: 'grid-weekdetail',
				iconCls: 'op5-crmbase-datatoolbar-view-calendar',
				text: 'Week details',
				handler: function(menuitem) {
					this.onColumnWeekdetail( menuitem.up('menu').activeHeader.dateSqlWeek ) ;
				},
				scope: this
			});
		}
		menu.on('beforeshow', this.onColumnsMenuBeforeShow, this);
	},
	onColumnsMenuBeforeShow: function( menu ) {
		var HelperCache = Optima5.Modules.Spec.DbsPeople.HelperCache,
			colCfg = menu.activeHeader.colCfg;
		menu.down('#grid-weekdetail').setVisible( (menu.activeHeader.dateType=='week') ) ;
	},
	onColumnWeekdetail: function( dateSqlWeek ) {
		this.dateWeekdetail = Ext.Date.parse(dateSqlWeek,'Y-m-d') ;
		this.viewMode = 'weekdetail' ;
		
		this.updateToolbar() ;
		this.doLoad() ;
	},
	
	gridAdapterInit: function() {
		var grid = this.child('grid'),
			store = grid.getStore() ;
			
		var baseData = [];
		
		baseData.push({
			_hidden: (this.viewMode != 'weekdetail'),
			_editable: (this.viewMode == 'weekdetail'),
			id: '0_WEEKCOEFS',
			group_id: '0_WEEKCOEFS'
		});
		
		// Create base records  1_FCAST_UO / 2_CAPACITY_UO / 3_BALANCE_ROLE
		var availableRoles = [];
		Ext.Array.each( this.forecastCfgUoStore.getRange(), function(uoRecord) {
			baseData.push({
				_editable: (this.viewMode == 'weeklist'),
				id: '1_FCAST_UO+'+uoRecord.get('uo_code'),
				group_id: '1_FCAST_UO',
				uo_code: uoRecord.get('uo_code')
			});
			var roleCode ;
			Ext.Array.each( uoRecord.roles().getRange(), function(roleRecord) {
				roleCode = roleRecord.get('role_code') ;
				if( !Ext.Array.contains(availableRoles,roleCode) ) {
					availableRoles.push(roleCode) ;
				}
			});
		},this) ;
		Ext.Array.sort(availableRoles) ;
		Ext.Array.each(availableRoles, function(roleCode) {
			baseData.push({
				id: '2_FCAST_ROLES_H+'+roleCode,
				group_id: '2_FCAST_ROLES_H',
				role_code: roleCode
			});
			baseData.push({
				id: '3_CAPACITY_ROLES_H+'+roleCode,
				group_id: '3_CAPACITY_ROLES_H',
				role_code: roleCode
			});
			baseData.push({
				id: '4_BALANCE_ROLES_PEOPLE+'+roleCode,
				group_id: '4_BALANCE_ROLES_PEOPLE',
				role_code: roleCode
			});
		});
		
		var gridData = {},
			dateMap = this.gridAdapterGetDateMap() ;
		
		Ext.Array.each( this.forecastWeekStore.getRange(), function(forecastWeekRecord) {
			this.gridAdapterPopulateForForecastWeekRecord(gridData, forecastWeekRecord, dateMap) ;
		},this) ;
		Ext.Array.each( baseData, function(gridRow) {
			var rowId = gridRow.id ;
			if( gridData.hasOwnProperty(rowId) ) {
				Ext.apply( gridRow, gridData[rowId] ) ;
			}
		});
		
		store.loadData(baseData) ;
	},
	gridAdapterUpdateForecastWeekRecord: function(forecastWeekRecord) {
		var grid = this.child('grid'),
			 store = grid.getStore(),
			 dateMap = this.gridAdapterGetDateMap() ;
			 
		var gridData = {} ;
		this.gridAdapterPopulateForForecastWeekRecord(gridData, forecastWeekRecord, dateMap) ;
		
		store.suspendEvents(true) ; // HACK: suspendingEvents on bufferedgrid'store is dangerous
		Ext.Object.each( gridData, function(rowId, rowData) {
			var rowRecord = store.getById(rowId) ;
			if( rowRecord == null ) {
				return ;
			}
			rowRecord.set(rowData) ;
			rowRecord.commit() ;
		});
		
		store.resumeEvents() ; // HACK: need to resume -BEFORE- add/remove record(s)
	},
	gridAdapterPopulateForForecastWeekRecord: function(gridData, forecastWeekRecord, dateMap) {
		switch( this.viewMode ) {
			case 'weeklist' :
				return this.gridAdapterPopulateWeeklistForForecastWeekRecord(gridData, forecastWeekRecord, dateMap) ;
			case 'weekdetail' :
				return this.gridAdapterPopulateWeekdetailForForecastWeekRecord(gridData, forecastWeekRecord, dateMap) ;
			default :
				return ;
		}
	},
	gridAdapterPopulateWeeklistForForecastWeekRecord: function(gridData, forecastWeekRecord, dateMap) {
		if( dateMap == null ) {
			dateMap = this.gridAdapterGetDateMap() ;
		}
		var dateSql = forecastWeekRecord.get('week_date'),
			dateStr = dateMap[dateSql] ;
		if( dateStr == null ) {
			return ;
		}
		var columnKeyWeek = 'w_'+dateStr ;
		
		var balanceByRoleH = {} ;
		
		// X - valeurs par défaut
		Ext.Array.each( this.forecastCfgUoStore.getRange(), function(cfgUoRecord) {
			var uoCode = cfgUoRecord.get('uo_code'),
				rowId = '1_FCAST_UO+'+uoCode ;
			if( !gridData.hasOwnProperty(rowId) ) {
				gridData[rowId] = {} ;
			}
			gridData[rowId][columnKeyWeek] = {
				uo_qty_unit: null,
				_editorValue: 0
			} ;
			
			Ext.Array.each( cfgUoRecord.roles().getRange(), function(cfgUoRoleRecord) {
				var cfgUoRoleCode = cfgUoRoleRecord.get('role_code'),
					rowIds = ['2_FCAST_ROLES_H+'+cfgUoRoleCode,'3_CAPACITY_ROLES_H+'+cfgUoRoleCode,'4_BALANCE_ROLES_PEOPLE+'+cfgUoRoleCode] ;
				Ext.Array.each(rowIds, function(rowId) {
					if( !gridData.hasOwnProperty(rowId) ) {
						gridData[rowId] = {} ;
					}
					var mkey ;
					switch( rowId ) {
						case '2_FCAST_ROLES_H+'+cfgUoRoleCode :
							mkey = 'role_qty_h' ;
							mvalue = null ;
							break ;
						case '3_CAPACITY_ROLES_H+'+cfgUoRoleCode :
							mkey = 'role_qty_h' ;
							mvalue = 0 ;
							break ;
						case '4_BALANCE_ROLES_PEOPLE+'+cfgUoRoleCode :
							mkey = 'role_qty_people' ;
							mvalue = 0 ;
							break ;
					}
					gridData[rowId][columnKeyWeek] = {} ;
					gridData[rowId][columnKeyWeek][mkey] = mvalue ;
				}) ;
				
				if( !balanceByRoleH.hasOwnProperty(cfgUoRoleCode) ) {
					balanceByRoleH[cfgUoRoleCode] = 0 ;
				}
			});
		}) ;
		
		// 1+2 - FORECAST UO + ROLES.H
		var obj_roleCode_qtyHour = {} ;
		Ext.Array.each( forecastWeekRecord.week_volumes().getRange(), function(uoRecord) {
			var uoCode = uoRecord.get('uo_code'),
				qtyUnit = uoRecord.get('uo_qty_unit'),
				rowId = '1_FCAST_UO+'+uoCode ;
			
			if( !gridData.hasOwnProperty(rowId) ) {
				gridData[rowId] = {} ;
			}
			gridData[rowId][columnKeyWeek] = {
				uo_qty_unit: ( qtyUnit <= 0 ? null : qtyUnit ),
				_editorValue: ( qtyUnit <= 0 ? 0 : qtyUnit )
			} ;
			
			Ext.Array.each( this.forecastCfgUoStore.getById(uoCode).roles().getRange(), function(uoRoleRecord) {
				var roleCode = uoRoleRecord.get('role_code'),
					roleHRate = uoRoleRecord.get('role_hRate'),
					qtyHour = qtyUnit / roleHRate ;
				
				if( !obj_roleCode_qtyHour.hasOwnProperty(roleCode) ) {
					obj_roleCode_qtyHour[roleCode] = 0 ;
				}
				obj_roleCode_qtyHour[roleCode] += qtyHour ;
			
				if( balanceByRoleH.hasOwnProperty(roleCode) ) {
					balanceByRoleH[roleCode] -= qtyHour ;
				}
			});
		},this) ;
		Ext.Object.each( obj_roleCode_qtyHour, function(roleCode, qtyHour) {
			rowId = '2_FCAST_ROLES_H+'+roleCode ;
			gridData[rowId][columnKeyWeek] = {
				role_qty_h: qtyHour
			} ;
		}) ;
		
		// 3 - CALC CAPACITY/RSRC HOUR
			// total resources
		var obj_roleCode_qtyHour = {} ;
		Ext.Array.each( forecastWeekRecord.day_resources().getRange(), function(dayrsrcRecord) {
			var roleCode = dayrsrcRecord.get('rsrc_role_code'),
				qtyHour = dayrsrcRecord.get('rsrc_qty_hour') ;
			if( !obj_roleCode_qtyHour.hasOwnProperty(roleCode) ) {
				obj_roleCode_qtyHour[roleCode] = 0 ;
			}
			obj_roleCode_qtyHour[roleCode] += qtyHour ;
			
			if( balanceByRoleH.hasOwnProperty(roleCode) ) {
				balanceByRoleH[roleCode] += qtyHour ;
			}
		}) ;
		Ext.Object.each( obj_roleCode_qtyHour, function(roleCode, qtyHour) {
			rowId = '3_CAPACITY_ROLES_H+'+roleCode ;
			if( !gridData.hasOwnProperty(rowId) ) {
				return ;
			}
			gridData[rowId][columnKeyWeek] = {
				role_qty_h: qtyHour
			} ;
		}) ;
		
		// 4pre - CALC AVG H/week for each role
		var map_roleCode_hoursPerPeople = {} ;
		Ext.Array.each( forecastWeekRecord.day_resources().getRange(), function(dayrsrcRecord) {
			var roleCode = dayrsrcRecord.get('rsrc_role_code'),
				qtyHour = dayrsrcRecord.get('rsrc_qty_hour'),
				qtyPeople = dayrsrcRecord.get('rsrc_qty_people') ;
			
			if( !map_roleCode_hoursPerPeople.hasOwnProperty(roleCode) ) {
				map_roleCode_hoursPerPeople[roleCode] = 0 ;
			}
			map_roleCode_hoursPerPeople[roleCode] += (qtyHour / qtyPeople) ;
		}) ;
		// 4 - BALANCE
		Ext.Object.each( balanceByRoleH , function(roleCode,qtyHour) {
			var rowId = '4_BALANCE_ROLES_PEOPLE+'+roleCode ;
			if( !gridData.hasOwnProperty(rowId) ) {
				gridData[rowId] = {} ;
			}
			if( !map_roleCode_hoursPerPeople.hasOwnProperty(roleCode) ) {
				gridData[rowId][columnKeyWeek] = {
					role_qty_h: qtyHour,
					role_qty_people: '!'
				} ;
				return ;
			}
			gridData[rowId][columnKeyWeek] = {
				role_qty_h: qtyHour,
				role_qty_people: (qtyHour / map_roleCode_hoursPerPeople[roleCode])
			} ;
		});
	},
	gridAdapterPopulateWeekdetailForForecastWeekRecord: function(gridData, forecastWeekRecord, dateMap) {
		Ext.Object.each( dateMap, function(dateSql,dateStr) {
			this.gridAdapterPopulateWeekdetailDayForForecastWeekRecord(gridData, forecastWeekRecord, dateMap, dateSql) ;
		},this);
	},
	gridAdapterPopulateWeekdetailDayForForecastWeekRecord: function(gridData, forecastWeekRecord, dateMap, dateSql) {
		if( dateMap == null ) {
			dateMap = this.gridAdapterGetDateMap() ;
		}
		var dateSql = dateSql,
			dateStr = dateMap[dateSql] ;
		if( dateStr == null ) {
			return ;
		}
		var columnKeyDay = 'd_'+dateStr ;
		
		var balanceByRoleH = {} ;
		
		// X - valeurs par défaut
		Ext.Array.each( this.forecastCfgUoStore.getRange(), function(cfgUoRecord) {
			var uoCode = cfgUoRecord.get('uo_code'),
				rowId = '1_FCAST_UO+'+uoCode ;
			if( !gridData.hasOwnProperty(rowId) ) {
				gridData[rowId] = {} ;
			}
			gridData[rowId][columnKeyDay] = {
				uo_qty_unit: null,
				_editorValue: 0
			} ;
			
			Ext.Array.each( cfgUoRecord.roles().getRange(), function(cfgUoRoleRecord) {
				var cfgUoRoleCode = cfgUoRoleRecord.get('role_code'),
					rowIds = ['2_FCAST_ROLES_H+'+cfgUoRoleCode,'3_CAPACITY_ROLES_H+'+cfgUoRoleCode,'4_BALANCE_ROLES_PEOPLE+'+cfgUoRoleCode] ;
				Ext.Array.each(rowIds, function(rowId) {
					if( !gridData.hasOwnProperty(rowId) ) {
						gridData[rowId] = {} ;
					}
					var mkey ;
					switch( rowId ) {
						case '2_FCAST_ROLES_H+'+cfgUoRoleCode :
							mkey = 'role_qty_h' ;
							mvalue = null ;
							break ;
						case '3_CAPACITY_ROLES_H+'+cfgUoRoleCode :
							mkey = 'role_qty_h' ;
							mvalue = 0 ;
							break ;
						case '4_BALANCE_ROLES_PEOPLE+'+cfgUoRoleCode :
							mkey = 'role_qty_people' ;
							mvalue = 0 ;
							break ;
					}
					gridData[rowId][columnKeyDay] = {} ;
					gridData[rowId][columnKeyDay][mkey] = mvalue ;
				}) ;
				
				if( !balanceByRoleH.hasOwnProperty(cfgUoRoleCode) ) {
					balanceByRoleH[cfgUoRoleCode] = 0 ;
				}
			});
		}) ;
		
		// 0 - COEFS
		var dayCoef, totalCoefs = 0 ;
		Ext.Array.each( forecastWeekRecord.week_coefs().getRange(), function(weekcoefRecord) {
			var iterCoef = weekcoefRecord.get('weekday_coef') ;
			if( Ext.isEmpty(iterCoef) ) {
				iterCoef = 100 ;
			}
			totalCoefs += iterCoef ;
			if( weekcoefRecord.get('weekday_date') == dateSql ) {
				dayCoef = iterCoef ;
			}
		}) ;
		if( Ext.isEmpty(dayCoef) ) {
			dayCoef = 100 ;
		}
		var rowId = '0_WEEKCOEFS' ;
		if( !gridData.hasOwnProperty(rowId) ) {
			gridData[rowId] = {} ;
		}
		gridData[rowId][columnKeyDay] = {
			day_coef: dayCoef,
			_editorValue: dayCoef
		} ;
		
		// 1+2 - FORECAST UO + ROLES.H
		var obj_roleCode_qtyHour = {} ;
		Ext.Array.each( forecastWeekRecord.week_volumes().getRange(), function(uoRecord) {
			var uoCode = uoRecord.get('uo_code'),
				qtyUnit = uoRecord.get('uo_qty_unit'),
				rowId = '1_FCAST_UO+'+uoCode ;
			
			qtyUnit = (qtyUnit * dayCoef / totalCoefs) ;
			
			if( !gridData.hasOwnProperty(rowId) ) {
				gridData[rowId] = {} ;
			}
			gridData[rowId][columnKeyDay] = {
				uo_qty_unit: ( qtyUnit <= 0 ? null : qtyUnit ),
				_editorValue: ( qtyUnit <= 0 ? 0 : qtyUnit )
			} ;
			
			Ext.Array.each( this.forecastCfgUoStore.getById(uoCode).roles().getRange(), function(uoRoleRecord) {
				var roleCode = uoRoleRecord.get('role_code'),
					roleHRate = uoRoleRecord.get('role_hRate'),
					qtyHour = qtyUnit / roleHRate ;
				
				if( !obj_roleCode_qtyHour.hasOwnProperty(roleCode) ) {
					obj_roleCode_qtyHour[roleCode] = 0 ;
				}
				obj_roleCode_qtyHour[roleCode] += qtyHour ;
			
				if( balanceByRoleH.hasOwnProperty(roleCode) ) {
					balanceByRoleH[roleCode] -= qtyHour ;
				}
			});
		},this) ;
		Ext.Object.each( obj_roleCode_qtyHour, function(roleCode, qtyHour) {
			rowId = '2_FCAST_ROLES_H+'+roleCode ;
			gridData[rowId][columnKeyDay] = {
				role_qty_h: qtyHour
			} ;
		}) ;
		
		// 3 - CALC CAPACITY/RSRC HOUR
			// total resources
		var obj_roleCode_qtyHour = {} ;
		Ext.Array.each( forecastWeekRecord.day_resources().getRange(), function(dayrsrcRecord) {
			if( dayrsrcRecord.get('rsrc_date') != dateSql ) {
				return ;
			}
			var roleCode = dayrsrcRecord.get('rsrc_role_code'),
				qtyHour = dayrsrcRecord.get('rsrc_qty_hour') ;
			if( !obj_roleCode_qtyHour.hasOwnProperty(roleCode) ) {
				obj_roleCode_qtyHour[roleCode] = 0 ;
			}
			obj_roleCode_qtyHour[roleCode] += qtyHour ;
			
			if( balanceByRoleH.hasOwnProperty(roleCode) ) {
				balanceByRoleH[roleCode] += qtyHour ;
			}
		}) ;
		Ext.Object.each( obj_roleCode_qtyHour, function(roleCode, qtyHour) {
			rowId = '3_CAPACITY_ROLES_H+'+roleCode ;
			if( !gridData.hasOwnProperty(rowId) ) {
				return ;
			}
			gridData[rowId][columnKeyDay] = {
				role_qty_h: qtyHour
			} ;
		}) ;
		
		// 4pre - CALC AVG H/day for each role
		var map_roleCode_hoursPerPeople = {} ;
		Ext.Array.each( forecastWeekRecord.day_resources().getRange(), function(dayrsrcRecord) {
			if( dayrsrcRecord.get('rsrc_date') != dateSql ) {
				return ;
			}
			var roleCode = dayrsrcRecord.get('rsrc_role_code'),
				qtyHour = dayrsrcRecord.get('rsrc_qty_hour'),
				qtyPeople = dayrsrcRecord.get('rsrc_qty_people') ;
			
			if( !map_roleCode_hoursPerPeople.hasOwnProperty(roleCode) ) {
				map_roleCode_hoursPerPeople[roleCode] = 0 ;
			}
			map_roleCode_hoursPerPeople[roleCode] += (qtyHour / qtyPeople) ;
		}) ;
		// 4 - BALANCE
		Ext.Object.each( balanceByRoleH , function(roleCode,qtyHour) {
			var rowId = '4_BALANCE_ROLES_PEOPLE+'+roleCode ;
			if( !gridData.hasOwnProperty(rowId) ) {
				gridData[rowId] = {} ;
			}
			if( !map_roleCode_hoursPerPeople.hasOwnProperty(roleCode) ) {
				gridData[rowId][columnKeyDay] = {
					role_qty_h: qtyHour,
					role_qty_people: '!'
				} ;
				return ;
			}
			gridData[rowId][columnKeyDay] = {
				role_qty_h: qtyHour,
				role_qty_people: (qtyHour / map_roleCode_hoursPerPeople[roleCode])
			} ;
		});
	},
	gridAdapterGetDateMap: function() {
		var grid = this.child('grid'),
			dateCols = grid.headerCt.query('[dateSql]'),
			dateMap = {} ;
		Ext.Array.each( dateCols, function(dateCol) {
			dateMap[dateCol.dateSql] = dateCol.dateStr ;
		}) ;
		return dateMap ;
	},
	
	onGridBeforeEdit: function( editor, editEvent ) {
		var gridRecord = editEvent.record,
			column = editEvent.column,
			colIdx = editEvent.colIdx,
			valueObj = editEvent.value,
			dateSql = column.dateSql,
			dateSqlWeek = column.dateSqlWeek,
			whseCode = this.whseCode,
			forecastWeekId = dateSqlWeek+'@'+whseCode ;
			forecastWeekRecord = this.forecastWeekStore.getById(forecastWeekId) ;
			
		if( !valueObj.hasOwnProperty('_editorValue') ) {
			return false ;
		}
		
		// Modif 2014-09 : modified cells
		    //this.tagModifiedCell(gridRecord.getId(),colIdx) ;
		
		var editorField = editEvent.column.getEditor() ;
		switch( editorField.getXType() ) {
			case 'numberfield' :
				editorField.on('focus',function(editorField) {
					editorField.setValue(valueObj._editorValue) ;
				},this,{single:true}) ;
				break ;
				
			default :
				return false ;
		}
	},
	onGridAfterEdit: function( editor, editEvent ) {
		var gridRecord = editEvent.record,
			column = editEvent.column,
			colIdx = editEvent.colIdx,
			valueObj = editEvent.originalValue,
			newValue = editEvent.value,
			dateSql = column.dateSql,
			dateSqlWeek = column.dateSqlWeek,
			whseCode = this.whseCode,
			forecastWeekId = dateSqlWeek+'@'+whseCode ;
			forecastWeekRecord = this.forecastWeekStore.getById(forecastWeekId) ;
		if( !valueObj.hasOwnProperty('_editorValue') ) {
			return false ;
		}
		if( valueObj._editorValue == newValue ) {
			// Same value !
			gridRecord.commit() ;
			return false ;
		}
		
		var editorField = editEvent.column.getEditor(),
			editorValue = editorField.getValue() ;
		switch( gridRecord.get('group_id') ) {
			case '0_WEEKCOEFS' :
				var forecastWeekDayCoefRecord = forecastWeekRecord.week_coefs().findRecord('weekday_date',dateSql) ;
				if( forecastWeekDayCoefRecord != null ) {
					forecastWeekDayCoefRecord.set('weekday_coef',editorValue) ;
				}
				break ;
				
			case '1_FCAST_UO' :
				var uoCode = gridRecord.get('uo_code'),
					forecastWeekUoRecord = forecastWeekRecord.week_volumes().findRecord('uo_code',uoCode) ;
				if( forecastWeekUoRecord != null ) {
					forecastWeekUoRecord.set('uo_qty_unit',editorValue) ;
				} else {
					forecastWeekRecord.week_volumes().add({
						uo_code: uoCode,
						uo_qty_unit: editorValue
					}) ;
				}
				break ;
				
			default :
				return false ;
		}
		
		this.gridAdapterUpdateForecastWeekRecord( forecastWeekRecord ) ;
		this.remoteSaveForecastWeekRecord( forecastWeekRecord ) ;
		return false ;
	},
	
	remoteSaveForecastWeekRecord: function( forecastWeekRecord ) {
		var ajaxParams = {
			_moduleId: 'spec_dbs_people',
			_action: 'Forecast_saveWeekRecord',
			data: Ext.JSON.encode( forecastWeekRecord.getData(true) )
		};
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				if( Ext.JSON.decode(response.responseText).success != true ) {
					Ext.MessageBox.alert('Problem','Edit not saved !') ;
				}
				this.onAfterSave() ;
			},
			scope: this
		}) ;
	},
	onAfterSave: function() {
		
	},
	
	openCfgWhse: function() {
		var setSizeFromParent = function( parentPanel, targetPanel ) {
			targetPanel.setSize({
				width: parentPanel.getSize().width - 20,
				height: parentPanel.getSize().height - 60
			}) ;
		};
		
		var cfgWhsePanel = Ext.create('Optima5.Modules.Spec.DbsPeople.ForecastCfgWhsePanel',{
			optimaModule: this.optimaModule,
			whseCode: this.whseCode,
			width:800, // dummy initial size, for border layout to work
			height:600, // ...
			floating: true,
			renderTo: this.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.doQuit();
				}
			}]
		});
		
		cfgWhsePanel.mon(this,'resize', function() {
			setSizeFromParent( this, cfgWhsePanel ) ;
		},this) ;
		
		// Size + position
		setSizeFromParent(this,cfgWhsePanel) ;
		cfgWhsePanel.on('destroy',function() {
			this.getEl().unmask() ;
			this.doLoad() ;
		},this,{single:true}) ;
		this.getEl().mask() ;
		
		cfgWhsePanel.show();
		cfgWhsePanel.getEl().alignTo(this.getEl(), 't-t?',[0,50]);
	},
	sendBuildResources: function() {
		this.showLoadmask() ;
		
		var params = {
			_moduleId: 'spec_dbs_people',
			_action: 'Forecast_buildResources'
		};
		Ext.apply( params, {
			whse_code: this.whseCode,
			date_start_sql: Ext.Date.format( this.getDateStart(), 'Y-m-d' ),
			date_count: ( this.viewMode=='weeklist' ? this.weekCount : 1 )
		}) ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: params,
			success: function(response) {
				this.doLoad() ;
			},
			scope: this,
			timeout: (300 * 1000)
		});
	},
	
	handleQuit: function() {
		this.destroy() ;
	}
});