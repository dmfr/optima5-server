Ext.define('DbsPeopleForecastCfgUoRole', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'role_code',  type: 'string'},
		{name: 'role_hRate', type: 'int'}
	]
});
Ext.define('DbsPeopleForecastCfgUo', {
	extend: 'Ext.data.Model',
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
		{name: 'rsrc_qty_hour', type: 'float'}
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
	viewMode: 'weeklist',
	weekCount: 25,
	
	forecastCfgUoStore: null,
	forecastWeekStore: null,
	
	initComponent: function() {
		var me = this ;
		
		Ext.apply(me,{
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
							me.onSiteSet() ;
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
							me.onViewSet( menuitem.itemId ) ;
						},
						scope:me
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
		var me = this ;
		me.preInit-- ;
		if( me.preInit == 0 ) {
			me.isReady=true ;
			me.startPanel() ;
		}
	},
	startPanel: function() {
		var me = this ;
		
		this.tmpModelName = 'DbsPeopleForecastRowModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpModelName ) ;
		}) ;
		
		me.onSiteSet() ;
		me.onDateSet( new Date() ) ;
		me.onViewSet( me.viewMode ) ;
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
		var me = this,
			tbDate = me.child('toolbar').getComponent('tbDate') ;
		
		// configuration GRID
		var first = date.getDate() - ( date.getDay() > 0 ? date.getDay() : 7 ) + 1; // First day is the day of the month - the day of the week
		var last = first + 6; // last day is the first day + 6
		
		me.dateBase = new Date(Ext.clone(date).setDate(first));
		//me.dateEnd = new Date(Ext.clone(date).setDate(last));
		
		var weekStr = 'Sem. ' + Ext.Date.format( me.dateBase, 'W / o' ) ;
		tbDate.setText('<b>' + weekStr + '</b>') ;
		
		me.doLoad() ;
	},
	onViewSet: function( viewId ) {
		var me = this,
			tbViewmode = me.child('toolbar').getComponent('tbViewmode'),
			tbViewmodeItem = tbViewmode.menu.getComponent(viewId),
			iconCls, text,
			disableExport = false ;
		if( tbViewmodeItem ) {
			me.viewMode = viewId ;
			tbViewmode.setText( '<b>' + tbViewmodeItem.text + '</b>' );
			tbViewmode.setIconCls( tbViewmodeItem.iconCls );
		}
		
		this.doLoad() ;
	},
	updateToolbar: function(doActivate) {
		var tbSettings = this.child('toolbar').getComponent('tbSettings') ;
		tbSettings.setVisible(doActivate) ;
		
	},
	getDateStart: function() {
		var dateCur = Ext.clone(this.dateBase) ;
		switch( this.viewMode ) {
			case 'weeklist' :
				dateCur.setDate( dateCur.getDate() - 7 ) ;
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
		var me = this,
			jsonResponse = Ext.JSON.decode(response.responseText) ;
		
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
		
		// Create grid
		this.doGridConfigure() ;
		
		// Create records
		this.gridAdapterInit() ;
		
		// Drop loadmask
		this.hideLoadmask();
	},
	doGridConfigure: function() {
		var me = this ;
		
		var pushModelfields = [] ;
		var columns = [{
			locked: true,
			groupable: true,
			hidden: true,
			text: 'Group key',
			dataIndex: 'group_id',
			width: 180
		},{
			locked: true,
			text: 'UO / Role',
			width: 180,
			dataIndex: 'uo_code',
			renderer: function(v,metaData,record) {
				switch( record.get('group_id') ) {
					case '0_WEEKCOEFS' :
						return '<i>Coefficient jour</i>' ;
					case '1_FCAST_UO' :
					case '2_CAPACITY_UO' :
						return record.get('uo_txt') ;
					case '3_BALANCE_ROLES' :
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
			groupable: false,
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
				groupers: [{
					property: 'group_id',
					direction: 'ASC'
				}],
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
										case '2_CAPACITY_UO' :
											return 'Capacité (UOs)' ;
										case '3_BALANCE_ROLES' :
											return 'Balance / Besoins' ;
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
		switch( record.get('group_id') ) {
			case '0_WEEKCOEFS' :
				return v.day_coef ;
			
			case '1_FCAST_UO' :
				if( v.uo_qty_unit == null ) {
					return '' ;
				}
				return Math.round(v.uo_qty_unit)
			case '2_CAPACITY_UO' :
				metaData.style += '; font-weight:bold;'
				if( v.uo_qty_unit == null ) {
					return '' ;
				}
				return Math.round(v.uo_qty_unit) ;
				
			case '3_BALANCE_ROLES' :
				if( Ext.isEmpty(v) ) {
					return '' ;
				}
				metaData.style += '; font-weight:bold;'
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
		
		for( var idx = 0 ; idx <= this.weekCount ; idx++ ) {
			if( idx > 0 ) {
				dateCur.setDate( dateCur.getDate() + 7 ) ;
			}
			
			var dStr = Ext.Date.format(dateCur,'Ymd'),
				dSql = Ext.Date.format(dateCur,'Y-m-d'),
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
				editor: { xtype: 'numberfield', minValue: 0, keyNavEnabled: false },
				renderer: this.gridValueRenderer
			}) ;
		}
	},
	doGridConfigurePushWeekdetail: function(pushModelfields, pushColumns) {
		var dateCur = this.getDateStart() ;
		var dateWeek = this.getDateStart() ;
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
				width: 100,
				align: 'center',
				text: text,
				dateSqlWeek: dateSqlWeek,
				dateSql: dSql,
				dateStr: dStr,
				dataIndex: 'd_'+dStr,
				editor: { xtype: 'numberfield', minValue: 0, keyNavEnabled: false },
				renderer: this.gridValueRenderer
			}) ;
		}
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
			baseData.push({
				id: '2_CAPACITY_UO+'+uoRecord.get('uo_code'),
				group_id: '2_CAPACITY_UO',
				uo_code: uoRecord.get('uo_code')
			});
			var roleCode ;
			Ext.Array.each( uoRecord.roles().getRange(), function(roleRecord) {
				roleCode = roleRecord.get('role_code') ;
				if( !Ext.Array.contains(availableRoles,roleCode) ) {
					availableRoles.push(roleCode) ;
				}
			});
			Ext.Array.sort(availableRoles) ;
			Ext.Array.each(availableRoles, function(roleCode) {
				baseData.push({
					id: '3_BALANCE_ROLES+'+roleCode,
					group_id: '3_BALANCE_ROLES',
					role_code: roleCode
				});
			});
		},this) ;
		
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
		
		store.suspendEvents() ; // HACK: suspendingEvents on bufferedgrid'store is dangerous
		Ext.Object.each( gridData, function(rowId, rowData) {
			var rowRecord = store.getById(rowId) ;
			if( rowRecord == null ) {
				return ;
			}
			rowRecord.set(rowData) ;
			rowRecord.commit() ;
		});
		
		store.resumeEvents() ; // HACK: need to resume -BEFORE- add/remove record(s)
		grid.getView().refresh() ; //HACK
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
		
		var balanceByUo = {} ;
		
		// 1 - FORECAST UO
		Ext.Array.each( this.forecastCfgUoStore.getRange(), function(uoRecord) {
			var uoCode = uoRecord.get('uo_code'),
				rowId = '1_FCAST_UO+'+uoCode ;
				
			if( !gridData.hasOwnProperty(rowId) ) {
				gridData[rowId] = {} ;
			}
			gridData[rowId][columnKeyWeek] = {
				uo_qty_unit: null,
				_editorValue: 0
			} ;
		}) ;
		Ext.Array.each( forecastWeekRecord.week_volumes().getRange(), function(uoRecord) {
			var uoCode = uoRecord.get('uo_code'),
				qtyUnit = uoRecord.get('uo_qty_unit'),
				rowId = '1_FCAST_UO+'+uoCode ;
			
			if( !gridData.hasOwnProperty(rowId) ) {
				gridData[rowId] = {} ;
			}
			gridData[rowId][columnKeyWeek] = {
				uo_qty_unit: ( qtyUnit <= 0 ? null : qtyUnit ),
				_editorValue: ( qtyUnit <= 0 ? 0 : qtyUnit ),
			} ;
			
			
			if( !balanceByUo.hasOwnProperty(uoCode) ) {
				balanceByUo[uoCode] = 0 ;
			}
			balanceByUo[uoCode] -= qtyUnit ;
		}) ;
		
		// 2 - CALC CAPACITY
			// total resources
			var obj_roleCode_qtyHour = {} ;
			Ext.Array.each( forecastWeekRecord.day_resources().getRange(), function(dayrsrcRecord) {
				var roleCode = dayrsrcRecord.get('rsrc_role_code'),
					qtyHour = dayrsrcRecord.get('rsrc_qty_hour') ;
				if( !obj_roleCode_qtyHour.hasOwnProperty(roleCode) ) {
					obj_roleCode_qtyHour[roleCode] = 0 ;
				}
				obj_roleCode_qtyHour[roleCode] += qtyHour ;
			}) ;
		Ext.Array.each( this.forecastCfgUoStore.getRange(), function(uoRecord) {
			var uoCode = uoRecord.get('uo_code'),
				rowId = '2_CAPACITY_UO+'+uoCode ;
				
			var available = [], capacityUnit = 0 ;
			Ext.Array.each( uoRecord.roles().getRange(), function(uoRoleRecord) {
				var roleCode = uoRoleRecord.get('role_code'),
					roleHRate = uoRoleRecord.get('role_hRate') ;
				if( !obj_roleCode_qtyHour.hasOwnProperty(roleCode) ) {
					available = null ;
					return false ;
				}
				available.push( roleHRate * obj_roleCode_qtyHour[roleCode] ) ;
			}) ;
			if( available == null ) {
				capacityUnit = 0 ;
			} else {
				capacityUnit = Ext.Array.min(available) ;
			}
			if( !gridData.hasOwnProperty(rowId) ) {
				gridData[rowId] = {} ;
			}
			gridData[rowId][columnKeyWeek] = {
				uo_qty_unit: capacityUnit
			} ;
			
			if( !balanceByUo.hasOwnProperty(uoCode) ) {
				balanceByUo[uoCode] = 0 ;
			}
			balanceByUo[uoCode] += capacityUnit ;
		}) ;
		
		// 3 - BALANCE
		var balanceByRole = {} ;
		Ext.Array.each( this.forecastCfgUoStore.getRange(), function(uoRecord) {
			var uoCode = uoRecord.get('uo_code'),
				balanceQtyUnit = balanceByUo[uoCode] ;
			
			Ext.Array.each( uoRecord.roles().getRange(), function(uoRoleRecord) {
				var roleCode = uoRoleRecord.get('role_code'),
					roleHRate = uoRoleRecord.get('role_hRate') ;
				if( !balanceByRole.hasOwnProperty(roleCode) ) {
					balanceByRole[roleCode] = 0 ;
				}
				balanceByRole[roleCode] += balanceQtyUnit / roleHRate ;
			}) ;
		}) ;
		Ext.Object.each( balanceByRole , function(roleCode,qtyHour) {
			var rowId = '3_BALANCE_ROLES+'+roleCode ;
			if( !gridData.hasOwnProperty(rowId) ) {
				gridData[rowId] = {} ;
			}
			gridData[rowId][columnKeyWeek] = {
				role_qty_hour: qtyHour,
				role_qty_people: qtyHour / 35
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
		
		var balanceByUo = {} ;
		
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
		
		// 1 - FORECAST UO
		Ext.Array.each( this.forecastCfgUoStore.getRange(), function(uoRecord) {
			var uoCode = uoRecord.get('uo_code'),
				rowId = '1_FCAST_UO+'+uoCode ;
				
			if( !gridData.hasOwnProperty(rowId) ) {
				gridData[rowId] = {} ;
			}
			gridData[rowId][columnKeyDay] = {
				uo_qty_unit: null
			} ;
		}) ;
		Ext.Array.each( forecastWeekRecord.week_volumes().getRange(), function(uoRecord) {
			var uoCode = uoRecord.get('uo_code'),
				qtyUnit = uoRecord.get('uo_qty_unit'),
				rowId = '1_FCAST_UO+'+uoCode ;
				
			qtyUnit = (qtyUnit * dayCoef / totalCoefs) ;
			
			if( !gridData.hasOwnProperty(rowId) ) {
				gridData[rowId] = {} ;
			}
			gridData[rowId][columnKeyDay] = {
				uo_qty_unit: ( qtyUnit <= 0 ? null : qtyUnit )
			} ;
			
			
			if( !balanceByUo.hasOwnProperty(uoCode) ) {
				balanceByUo[uoCode] = 0 ;
			}
			balanceByUo[uoCode] -= qtyUnit ;
		}) ;
		
		// 2 - CALC CAPACITY
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
			}) ;
		Ext.Array.each( this.forecastCfgUoStore.getRange(), function(uoRecord) {
			var uoCode = uoRecord.get('uo_code'),
				rowId = '2_CAPACITY_UO+'+uoCode ;
				
			var available = [], capacityUnit = 0 ;
			Ext.Array.each( uoRecord.roles().getRange(), function(uoRoleRecord) {
				var roleCode = uoRoleRecord.get('role_code'),
					roleHRate = uoRoleRecord.get('role_hRate') ;
				if( !obj_roleCode_qtyHour.hasOwnProperty(roleCode) ) {
					available = null ;
					return false ;
				}
				available.push( roleHRate * obj_roleCode_qtyHour[roleCode] ) ;
			}) ;
			if( available == null ) {
				capacityUnit = 0 ;
			} else {
				capacityUnit = Ext.Array.min(available) ;
			}
			if( !gridData.hasOwnProperty(rowId) ) {
				gridData[rowId] = {} ;
			}
			gridData[rowId][columnKeyDay] = {
				uo_qty_unit: capacityUnit
			} ;
			
			if( !balanceByUo.hasOwnProperty(uoCode) ) {
				balanceByUo[uoCode] = 0 ;
			}
			balanceByUo[uoCode] += capacityUnit ;
		}) ;
		
		// 3 - BALANCE
		var balanceByRole = {} ;
		Ext.Array.each( this.forecastCfgUoStore.getRange(), function(uoRecord) {
			var uoCode = uoRecord.get('uo_code'),
				balanceQtyUnit = balanceByUo[uoCode] ;
			
			Ext.Array.each( uoRecord.roles().getRange(), function(uoRoleRecord) {
				var roleCode = uoRoleRecord.get('role_code'),
					roleHRate = uoRoleRecord.get('role_hRate') ;
				if( !balanceByRole.hasOwnProperty(roleCode) ) {
					balanceByRole[roleCode] = 0 ;
				}
				balanceByRole[roleCode] += balanceQtyUnit / roleHRate ;
			}) ;
		}) ;
		Ext.Object.each( balanceByRole , function(roleCode,qtyHour) {
			var rowId = '3_BALANCE_ROLES+'+roleCode ;
			if( !gridData.hasOwnProperty(rowId) ) {
				gridData[rowId] = {} ;
			}
			gridData[rowId][columnKeyDay] = {
				role_qty_hour: qtyHour,
				role_qty_people: qtyHour / 7
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
		
		console.log(dateSqlWeek) ;
		
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
		var me = this ;
		
		var setSizeFromParent = function( parentPanel, targetPanel ) {
			targetPanel.setSize({
				width: parentPanel.getSize().width - 20,
				height: parentPanel.getSize().height - 60
			}) ;
		};
		
		var cfgWhsePanel = Ext.create('Optima5.Modules.Spec.DbsPeople.ForecastCfgWhsePanel',{
			optimaModule: me.optimaModule,
			whseCode: me.whseCode,
			width:800, // dummy initial size, for border layout to work
			height:600, // ...
			floating: true,
			renderTo: me.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				}
			}]
		});
		
		cfgWhsePanel.mon(me,'resize', function() {
			setSizeFromParent( me, cfgWhsePanel ) ;
		},me) ;
		
		// Size + position
		setSizeFromParent(me,cfgWhsePanel) ;
		cfgWhsePanel.on('destroy',function() {
			me.getEl().unmask() ;
			me.doLoad() ;
		},me,{single:true}) ;
		me.getEl().mask() ;
		
		cfgWhsePanel.show();
		cfgWhsePanel.getEl().alignTo(me.getEl(), 't-t?',[0,50]);
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