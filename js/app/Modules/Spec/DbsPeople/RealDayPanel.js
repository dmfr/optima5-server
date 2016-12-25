Ext.define('Optima5.Modules.Spec.DbsPeople.RealDayPanel',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Sch.model.Event',
		'Sch.model.Resource',
		'Sch.preset.Manager',
		'Sch.panel.SchedulerGrid',
		'Sch.data.EventStore',
		'Sch.data.ResourceStore',
		'Sch.plugin.Zones',
		'Sch.model.Range'
	],
	
	dateDay: null,
	dateDayStr: null,
	
	peopledayStore: null,
	
	autoRefreshDelay: (5*60*1000),
	autoRefreshTask: null,
	autoRefreshAfterEdit: false,
	
	modifiedCells: null,
	
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
							this.doLoad(true) ;
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
			}),Ext.create('Optima5.Modules.Spec.DbsPeople.CfgParamTeamButton',{
				itemId: 'btnTeam',
				optimaModule: this.optimaModule,
				listeners: {
					change: {
						fn: function() {
							this.doLoad(true) ;
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
			}),'->',{
				iconCls: 'op5-crmbase-datatoolbar-refresh',
				text: 'Refresh',
				handler: function() {
					this.doLoad() ;
				},
				scope: this
			},{
				icon: 'images/op5img/ico_calendar_16.png',
				text: 'Choix Semaine',
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
				icon: 'images/op5img/ico_info_small.gif',
				text: 'Légende',
				menuAlign: 'tr-br?',
				menu: {
					xtype:'menu',
					items:[{
						xtype:'dataview',
						cls: 'op5-spec-dbspeople-realcolorinfo',
						tpl: new Ext.XTemplate(
							'<tpl for=".">',
								'<div class="op5-spec-dbspeople-realcolorinfo-item">',
									'{text}',
									'<div class="op5-spec-dbspeople-realcolorinfo-item-icon {iconCls}"></div>',
								'</div>',
							'</tpl>'
						),
						itemSelector: 'div.op5-spec-dbspeople-realcolorinfo-item',
						store: {
							fields: ['iconCls', 'text'],
							data:[
								{iconCls: 'op5-spec-dbspeople-realcolor-open', text:'Etat : Ouvert Exploitation'},
								{iconCls: 'op5-spec-dbspeople-realcolor-openrh', text:'Etat : Ouvert RH'},
								{iconCls: '', text:'Etat : clôture'},
								{iconCls: 'op5-spec-dbspeople-realcolor-role', text:'Modif. Rôle'},
								{iconCls: 'op5-spec-dbspeople-realcolor-anomalie', text:'Absence'},
								{iconCls: 'op5-spec-dbspeople-realcolor-whse', text:'Transfert'}
							]
						},
						//frame: true,
						width:200,
						height:200
					}]
				}
			}],
			items:[{
				border: false,
				xtype:'component',
				cls: 'op5-waiting'
			}]
		});
		this.preInit = 2 ;
		this.callParent() ;
		this.on('beforedestroy',this.onBeforeDestroy) ;
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
		
		this.autoRefreshTask = new Ext.util.DelayedTask( function(){
			if( this.isDestroyed ) { // private check
				return ;
			}
			var executed = this.doLoadIf() ;
			if( !executed ) {
				this.autoRefreshAfterEdit = true ;
			}
		},this);
		
		this.tmpResourceName = 'DbsPeopleRealResourceModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpResourceName ) ;
		}) ;
		
		this.tmpEventName = 'DbsPeopleRealEventModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpEventName ) ;
		}) ;
		
		me.onDateSet( new Date() ) ;
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
	
	onDateSet: function( date ) {
		var me = this ;
		
		// configuration GRID
		date = new Date(date.toDateString());
		me.dateDay = date ;
		me.dateDayStr = Ext.Date.format(date,'Y-m-d') ;
		
		me.doGridConfigure() ;
		me.doLoad(true) ;
	},
	
	doGridConfigure: function() {
		var me = this,
			dateDayStart = Ext.clone(me.dateDay),
			dateDayEnd = Sch.util.Date.add(dateDayStart, Sch.util.Date.DAY, 1) ;
			
		
		var pushModelfields = [] ;
		var columns = [{
			locked: true,
			text: 'Entrepôt',
			dataIndex: 'whse_txt',
			width: 180,
			_groupBy: 'whse_code'
		},{
			locked: true,
			text: 'Equipe',
			dataIndex: 'team_txt',
			width: 100,
			_groupBy: 'team_code'
		},{
			locked: true,
			text: 'Contrat',
			dataIndex: 'contract_txt',
			width: 80,
			_groupBy: 'contract_code',
			hideable: true
		},{
			locked: true,
			text: 'RôleStd',
			dataIndex: 'std_role_code',
			width: 60,
			_groupBy: 'std_role_code'
		},{
			locked: true,
			text: '<b>Nom complet</b>',
			dataIndex: 'people_name',
			width: 200,
			renderer: function(v) {
				return '<b>'+v+'</b>' ;
			}
		}] ;
		Ext.Array.each( Optima5.Modules.Spec.DbsPeople.HelperCache.getPeopleFields(), function( peopleField ) {
			var fieldColumn = {
				locked: true,
				text: peopleField.text,
				dataIndex: peopleField.field,
				_groupBy: peopleField.field,
				hideable: true,
				hidden: true,
				width: 100
			} ;
			if( peopleField.type=='link' ) {
				Ext.apply(fieldColumn,{
					renderer: function(v) {
						return v.text ;
					}
				}) ;
			}
			columns.push(fieldColumn) ;
			
			var fieldType ;
			switch( peopleField.type ) {
				case 'link' :
					fieldType='auto' ;
					break ;
				default:
					fieldType='string' ;
					break ;
			}
			pushModelfields.push({
				name: peopleField.field,
				type: fieldType
			});
		}) ;
		
		// Colonne TIMELINE (implicite)
		
		
		Ext.ux.dams.ModelManager.unregister( this.tmpResourceName ) ;
		Ext.define(this.tmpResourceName, {
			extend: 'Sch.model.Resource',
			fields: [].concat(DbsPeopleRealRowModel.getFields()).concat(pushModelfields)
		});
		
		Ext.ux.dams.ModelManager.unregister( this.tmpEventName ) ;
		Ext.define(this.tmpEventName, {
			extend: 'Sch.model.Event',
			fields: [
				
			]
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
			if( !Ext.isEmpty(column['_groupBy']) ) {
				// false groupable to enable columnMenu
				column['groupable'] = true ;
			}
		}) ;
		
		me.removeAll() ;
		me.add(Ext.create('Sch.panel.SchedulerGrid',{
			border: false,
			viewPreset  : 'hourAndDay',
			//zoneStore   : zoneStore,
			startDate   : dateDayStart,
			endDate     : dateDayEnd,
			resourceStore: new Sch.data.ResourceStore({
				model: this.tmpResourceName,
				data: [],
				sorters: [{
					property: 'people_name',
					direction: 'ASC'
				}],
				filters: [{
					property: '_visible',
					value: true
				}],
				proxy:{
					type:'memory'
				},
				listeners: {
					groupchange: me.onGridGroupChange,
					scope: this
				}
			}),
			eventStore: new Sch.data.EventStore({
				model   : this.tmpEventName,
				data    :  [   
						{
							ResourceId      : 'a',
							Name            : 'Some task', 
							StartDate       : '2010-05-22 10:00',
							EndDate         : '2010-05-22 12:00'
						},
						{
							ResourceId      : 'b',
							Name            : 'Some other task', 
							StartDate       : '2010-05-22 13:00',
							EndDate         : '2010-05-22 16:00'
						}
				]
			}),
			//enableLocking: true,
			plugins: [],
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
								case 'whse_code' :
									return values.rows[0].data.whse_txt ;
								case 'team_code' :
									return values.rows[0].data.team_txt ;
								case 'contract_code' :
									return values.rows[0].data.contract_txt ;
								case 'std_role_code' :
									return values.rows[0].data.std_role_txt ;
								default :
									var peopleField = Optima5.Modules.Spec.DbsPeople.HelperCache.getPeopleField(values.groupField) ;
									if( peopleField != null ) {
										var value = values.rows[0].data[peopleField.field],
											returnText ;
										switch( peopleField.type ) {
											case 'link' :
												returnText = value.text ;
												break ;
											default :
												returnText = value ;
												break ;
										}
										if( Ext.isEmpty(returnText) ) {
											return '(Pas de donnée)' ;
										}
										return returnText ;
									}
									return '' ;
							}
						}
					}
				)
			}],
			columns: columns,
			listeners: {
				afterlayout: function( gridpanel ) {
					gridpanel.headerCt.on('menucreate',me.onColumnsMenuCreate,me) ;
					gridpanel.headerCt.on('columnschanged',me.onColumnsChanged,me) ;
				},
				beforeeventadd: this.onBeforeEventAdd,
				scope: me
			},
			viewConfig: {
				preserveScrollOnRefresh: true,
				getRowClass: function(record) {
					return ;
					if( record.get('whse_isAlt') ) {
						return 'op5-spec-dbspeople-realcolor-whse' ;
					}
				}
			}
		})) ;
	},
	onColumnsMenuCreate: function( headerCt, menu ) {
		var me = this;
		if( true ) {
			menu.add({
				itemId: 'grid-groupby',
				icon: 'images/op5img/ico_groupby_16.png',
				text: 'Group By',
				handler: function(menuitem) {
					this.onColumnGroupBy( menuitem.up('menu').activeHeader._groupBy ) ;
				},
				scope: this
			});
			/*
			menu.add({
				icon: 'images/op5img/ico_print_16.png',
				itemId: 'grid-print',
				text: 'Print',
				handler: function(menuitem) {
					this.handlePrintPanel( menuitem.up('menu').activeHeader.dateSqlHead ) ;
				},
				scope: this
			});
			menu.add({
				itemId: 'grid-summary',
				iconCls: 'op5-spec-dbspeople-icon-actionday-summary',
				text: 'Compteurs ETP',
				handler: function(menuitem,e) {
					this.openSummary( menuitem.up('menu').activeHeader.dateSqlHead ) ;
				},
				scope: this
			});
			menu.add({
				itemId: 'real-open',
				iconCls: 'op5-spec-dbspeople-icon-actionday-open',
				text: 'Ouverture Jour',
				handler: function(menuitem) {
					this.handleActionDay( 'open', menuitem.up('menu').activeHeader.dateSqlHead ) ;
				},
				scope: this
			});
			menu.add({
				itemId: 'real-valid-ceq',
				iconCls: 'op5-spec-dbspeople-icon-actionday-validceq' ,
				text: 'Valid Exploitation',
				handler: function(menuitem) {
					this.handleActionDay( 'valid_ceq', menuitem.up('menu').activeHeader.dateSqlHead ) ;
				},
				scope: this
			});
			menu.add({
				itemId: 'real-valid-rh',
				iconCls: 'op5-spec-dbspeople-icon-actionday-validrh' ,
				text: 'Valid RH',
				handler: function(menuitem) {
					this.handleActionDay( 'valid_rh', menuitem.up('menu').activeHeader.dateSqlHead ) ;
				},
				scope: this
			});
			menu.add({
				itemId: 'real-reopen',
				iconCls: 'op5-spec-dbspeople-icon-actionday-reopen' ,
				text: 'Réouverture',
				handler: function(menuitem) {
					this.handleActionDay( 'reopen', menuitem.up('menu').activeHeader.dateSqlHead ) ;
				},
				scope: this
			});
			menu.add({
				itemId: 'real-delete',
				iconCls: 'op5-spec-dbspeople-icon-actionday-delete' ,
				text: 'Supprimer',
				handler: function(menuitem) {
					this.handleActionDay( 'delete', menuitem.up('menu').activeHeader.dateSqlHead ) ;
				},
				scope: this
			});
			menu.add({
				xtype: 'menucheckitem',
				itemId: 'real-checkbox-exceptionday',
				checked: false ,
				text: 'Exception jour',
				handler: Ext.emptyFn,
				listeners: {
					checkchange: function( menuitem, checked ) {
						this.handleExceptionDay( menuitem.up('menu').activeHeader.dateSqlHead, checked ) ;
					},
					scope: this
				}
			});
			*/
		}
		menu.on('beforeshow', me.onColumnsMenuBeforeShow, me);
	},
	onColumnsMenuBeforeShow: function( menu ) {
		var me = this,
			HelperCache = Optima5.Modules.Spec.DbsPeople.HelperCache,
			colCfg = menu.activeHeader.colCfg;
		menu.down('#grid-groupby').setVisible( !Ext.isEmpty(menu.activeHeader._groupBy) ) ;
	},
	onColumnsChanged: function() {
		var grid = this.child('grid'),
			store = grid.getStore() ;
		if( store.getCount() == 0 ) {
			return ;
		}
	},
	onColumnGroupBy: function( groupField ) {
		var grid = this.child('grid'),
			store = grid.getStore() ;
		grid.normalGrid.getPlugin('bufferedRenderer').scrollTo(0) ;
		grid.lockedGrid.getPlugin('bufferedRenderer').scrollTo(0) ;
		store.group( groupField, 'ASC' ) ;
	},
	onGridGroupChange: function( gridStore, grouper ) {
		var grid = this.child('grid'),
			 groupFields = [] ;
		
		if( grouper ) {
			groupFields.push( grouper.getProperty() ) ;
		}
		Ext.Array.each( grid.headerCt.query('[_groupBy]'), function(col) {
			if( col.hideable ) {
				return ;
			}
			if( col._alwaysHidden ) {
				col.hide() ;
			} else if( Ext.Array.contains(groupFields , col._groupBy) ) {
				col.hide() ;
			} else {
				col.show() ;
			}
		}) ;
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
	

	doLoadIf: function() {
		var grid = this.child('grid') ;
		if( this.floatingPanel != null ) {
			// some editing currently
			return false ;
		}
		this.doLoad() ;
		return true ;
	},
	doLoad: function(filterChanged) {
		if( !this.isReady ) {
			return ;
		}
		this.autoRefreshTask.cancel() ;
		this.showLoadmask() ;
		
		var filterSiteBtn = this.down('#btnSite'),
			filterTeamBtn = this.down('#btnTeam') ;
		
		var params = {
			_moduleId: 'spec_dbs_people',
			_action: 'Real_getData'
		};
		Ext.apply( params, {
			date_start: Ext.Date.format( this.dateDay, 'Y-m-d' ),
			date_end: Ext.Date.format( this.dateDay, 'Y-m-d' )
		}) ;
		if( filterSiteBtn.getNode() != null ) {
			params['filter_site_entries'] = Ext.JSON.encode( filterSiteBtn.getLeafNodesKey() ) ;
		}
		if( filterTeamBtn.getNode() != null ) {
			params['filter_team_entries'] = Ext.JSON.encode( filterTeamBtn.getLeafNodesKey() ) ;
		}
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: params,
			success: function(response) {
				this.onLoadResponse(response, filterChanged) ;
			},
			scope: this
		});
	},
	onLoadResponse: function(response, filterChanged) {
		var me = this,
			jsonResponse = Ext.JSON.decode(response.responseText) ;
		
		var grid = me.child('grid'),
			store = grid.getStore(),
			filter_site = me.down('#btnSite').getNode(),
			filter_team = me.down('#btnTeam').getNode() ;
			
		// Cfg columns visibility + groups according to current filters
		grid.headerCt.down('[dataIndex="whse_txt"]')._alwaysHidden = (filter_site && filter_site.leaf_only) ;
		grid.headerCt.down('[dataIndex="team_txt"]')._alwaysHidden = (filter_team && filter_team.leaf_only) ;
		if( filterChanged ) {
			store.removeAll() ; // To avoid sorting/grouping obsolete records
			if( filter_site==null || !filter_site.leaf_only ) {
				store.group( 'whse_code', 'ASC' ) ;
			} else if( filter_team==null || !filter_team.leaf_only ) {
				store.group( 'team_code', 'ASC' ) ;
			} else {
				store.clearGrouping() ;
			}
		}
		
		
		// peopledayStore + adapter (re)init
		this.peopledayStore = Ext.create('Ext.data.Store',{
			model: 'DbsPeoplePeopledayModel',
			proxy:{
				type:'memory',
				reader: {
					type: 'json'
				}
			},
			getById: function(id) { //HACK
				return this.idMap[id];
			},
			listeners:{
				datachanged: function(store) {
					store.idMap = {};
					store.each(function(record) {
						store.idMap[record.getId()] = record;
					});
				}
			}
		}) ;
		this.peopledayStore.loadRawData(jsonResponse.data) ;
		this.gridAdapterInit() ;
		store.group() ;
		
		// Drop loadmask
		this.hideLoadmask();
		
		// Setup autoRefresh task
		this.autoRefreshTask.delay( this.autoRefreshDelay ) ;
	},
	
	gridAdapterInit: function() {
		var grid = this.child('grid'),
			resourceData = {},
			eventData = {} ;
		
		this.peopledayStore.each( function(peopledayRecord) {
			this.gridAdapterPopulateForPeopledayRecord( resourceData, eventData, peopledayRecord ) ;
		},this) ;
		
		resourceData = this.gridAdapterGridFilter(resourceData) ;
		
		grid.getResourceStore().loadRawData( resourceData ) ;
		grid.getEventStore().loadRawData( eventData ) ;
	},
	gridAdapterUpdatePeopledayRecord: function(peopledayRecord) {
		var grid = this.child('grid'),
			 store = grid.getStore(),
			 dateMap = this.gridAdapterGetDateMap() ;
		
		store.suspendEvents(true) ; // HACK: suspendingEvents on bufferedgrid'store is dangerous
		
		// mise à zero de toutes les 'cases' concernées par ce record (people + date)
		var dateSql = peopledayRecord.get('date_sql'),
			dateStr = dateMap[dateSql] ;
		if( dateStr == null ) {
			return ; // hors champ
		}
		var roleKey = 'd_'+dateStr+'_role',
			durationKey = 'd_'+dateStr+'_tmp',
			nullObj = {},
			gridRecordIdsToDelete = [] ;
		nullObj[roleKey] = '' ;
		nullObj[durationKey] = '' ;
		store.data.each( function(gridRec) {
			if( gridRec.get('people_code') != peopledayRecord.get('people_code') ) {
				return ;
			}
			
			gridRec.set(nullObj) ;
			gridRec.commit() ;
			
			// Is gridRow empty ?
			var isGridRowEmpty = true ;
			Ext.Object.each( dateMap, function(dateSql,dateStr) {
				var roleKey = 'd_'+dateStr+'_role',
					durationKey = 'd_'+dateStr+'_tmp' ;
				if( !Ext.isEmpty(gridRec.get(roleKey)) || !Ext.isEmpty(gridRec.get(durationKey)) ) {
					isGridRowEmpty = false ;
				}
			}) ;
			if( isGridRowEmpty && gridRec.get('whse_code') != peopledayRecord.get('std_whse_code') ) {
				gridRecordIdsToDelete[gridRec.getId()] = true ;
			}
		}) ;
		
		// construction d'une grid data partielle
		var gridData = {}
		this.gridAdapterPopulateForPeopledayRecord( gridData, peopledayRecord, dateMap ) ;
		
		gridData = this.gridAdapterGridFilter(gridData) ;
		
		var gridRecordsToAdd = [] ;
		// fusion avec le store existant
		Ext.Array.each( gridData, function( gridDataRow ) {
			var gridDataRowId = gridDataRow.id ;
			// row record exists ?
			var gridRec = store.getById( gridDataRowId ) ;
			if( gridRec != null ) {
				gridRecordIdsToDelete[gridRec.getId()] = false ;
				gridRec.set(gridDataRow) ;
				gridRec.commit() ;
			} else {
				gridRecordsToAdd.push(gridDataRow) ;
			}
		}) ;
		
		store.resumeEvents() ; // HACK: need to resume -BEFORE- add/remove record(s)
		
		if( gridRecordsToAdd.length > 0 ) {
			store.add(gridRecordsToAdd) ;
		}
		var gridRecordsToDelete = [] ;
		Ext.Object.each( gridRecordIdsToDelete, function(gridDataRowId,tOrF) {
			if( tOrF ) {
				var gridRec = store.getById(gridDataRowId) ;
				if( gridRec != null ) {
					gridRecordsToDelete.push(gridRec) ;
				}
			}
		}) ;
		if( gridRecordsToDelete.length > 0 ) {
			store.remove(gridRecordsToDelete) ;
		}
		
		if( gridRecordsToAdd.length > 0 ) { // more than 1 => alt warehouses and possible inserts
			store.filter() ;
		}
	},
	gridAdapterGridFilter: function( resourceData ) {
		var filterBtn_site = this.down('#btnSite'),
			filterBtn_team = this.down('#btnTeam'),
			filter_whses = ( filterBtn_site.getNode()==null ? null : filterBtn_site.getLeafNodesKey() ),
			filter_teams = ( filterBtn_team.getNode()==null ? null : filterBtn_team.getLeafNodesKey() ) ;
		
		var filterFn = function(rec) {
		}
		
		if( Ext.isObject(resourceData) ) {
			var resourceData = Ext.Object.getValues(resourceData) ;
		}
		var gridDataRow, gridDataLn = resourceData.length, visible ;
		for( var i=0 ; i<gridDataLn ; i++ ) {
			gridDataRow = resourceData[i] ;
			
			visible = true ;
			if( filter_whses && !Ext.Array.contains(filter_whses,gridDataRow.whse_code) ) {
				visible = false ;
			}
			if( filter_teams && !Ext.Array.contains(filter_teams,gridDataRow.team_code) ) {
				visible = false ;
			}
			
			gridDataRow._visible = visible ;
		}
		return resourceData ;
	},
	gridAdapterPopulateForPeopledayRecord: function( resourceData, eventData, peopledayRecord ) {
		if( peopledayRecord.get('date_sql') != this.dateDayStr ) {
			console.log('hors champ') ;
			return ; // hors champ
		}
		var dateStr = this.dateDayStr ;
		
		var stdWhseCode = peopledayRecord.data.std_whse_code,
			stdTeamCode = peopledayRecord.data.std_team_code,
			stdRoleCode = peopledayRecord.data.std_role_code,
			stdAbsCode = peopledayRecord.data.std_abs_code,
			stdAbsHalfDay = false,
			stdContractCode = peopledayRecord.data.std_contract_code,
			stdDayLength = peopledayRecord.data.std_daylength,
			stdDayLengthMin = peopledayRecord.data.std_daylength_min,
			stdDayLengthMax = peopledayRecord.data.std_daylength_max,
			peopleCode = peopledayRecord.data.people_code ;
		
		var altWhsesSegments = null,
			workDuration = 0,
			absDuration = 0,
			statusIsVirtual = false,
			statusStr = '',
			segments = {
				roles:[],
				abs:[],
				roles_duration:0
			} ;
		
		if( peopledayRecord.data.status_isVirtual == true ) {
			statusIsVirtual = true ;
			statusStr = 'virtual' ;
		}
		else if( !peopledayRecord.data.status_isValidCeq && !peopledayRecord.data.status_isValidRh ) {
			statusStr = 'open' ;
		}
		else if( !peopledayRecord.data.status_isValidRh ) {
			statusStr = 'openrh' ;
		}
		else {
			statusStr = '' ;
		}
		
		if( stdAbsCode.charAt(0) == '_' ) {
			stdAbsCode = null ;
		} else {
			if( stdAbsCode.split(':')[1] == '2' ) {
				stdAbsHalfDay = true ;
				stdDayLength = stdDayLength / 2 ;
			}
		}
		
		peopledayRecord.works().each( function(workRecord) {
			workDuration += workRecord.data.role_length ;
			if( !Ext.isEmpty(workRecord.data.alt_whse_code) ) {
				var altWhseCode = workRecord.data.alt_whse_code ;
				if( altWhsesSegments == null ) {
					altWhsesSegments = {} ;
				}
				if( !altWhsesSegments.hasOwnProperty(altWhseCode) ) {
					altWhsesSegments[altWhseCode] = {
						roles:[],
						roles_duration:0
					};
				}
				altWhsesSegments[altWhseCode].roles.push(workRecord.data.role_code) ;
				altWhsesSegments[altWhseCode].roles_duration += workRecord.data.role_length ;
				return ;
			}
			segments.roles.push(workRecord.data.role_code) ;
			segments.roles_duration += workRecord.data.role_length ;
		}) ;
		peopledayRecord.abs().each( function(absRecord) {
			absDuration += absRecord.data.abs_length ;
			segments.abs.push(absRecord.data.abs_code) ;
		}) ;
		
		
		var roleKey = 'd_'+dateStr+'_role',
			durationKey = 'd_'+dateStr+'_tmp' ;
			
		var gridDataRowId = stdWhseCode+'%'+stdTeamCode+'%'+peopleCode ;
		if( !resourceData.hasOwnProperty(gridDataRowId) ) {
			resourceData[gridDataRowId] = Ext.apply({
				id: gridDataRowId,
				whse_code: stdWhseCode,
				whse_isAlt: false,
				team_code: stdTeamCode,
				contract_code: stdContractCode,
				std_role_code: stdRoleCode,
				people_code: peopledayRecord.data.people_code,
				people_name: peopledayRecord.data.people_name
			},peopledayRecord.data.fields) ;
		}
		var gridDataRow = resourceData[gridDataRowId] ;
		gridDataRow[roleKey] = {
			statusStr: statusStr,
			statusIsVirtual: statusIsVirtual,
			roles: segments.roles,
			abs: segments.abs,
			stdRole: stdRoleCode,
			stdAbs: stdAbsCode,
			stdEmpty: (stdDayLength == 0),
			hasAlt: (altWhsesSegments != null)
		} ;
		gridDataRow[durationKey] = {
			statusStr: statusStr,
			statusIsVirtual: statusIsVirtual,
			value: segments.roles_duration,
			workValue: workDuration,
			totalValue: (workDuration + absDuration),
			stdValue: ( (stdAbsCode == null || stdAbsHalfDay) ? stdDayLength : 0 ),
			minValue: ( stdAbsCode == null ? stdDayLengthMin : 0 )
		} ;
		if( !statusIsVirtual && segments.roles.length == 1 && segments.abs.length == 0 ) {
			gridDataRow[roleKey]._editable = true ;
			gridDataRow[roleKey]._editorValue = 'ROLE:'+segments.roles[0] ;
			gridDataRow[durationKey]._editable = true ;
			gridDataRow[durationKey]._editorValue = segments.roles_duration ;
			gridDataRow[durationKey]._editorMaxValue = stdDayLengthMax ;
		}
		if( !statusIsVirtual && segments.roles.length == 0 && segments.abs.length == 1 ) {
			gridDataRow[roleKey]._editable = true ;
			gridDataRow[roleKey]._editorValue = 'ABS:'+segments.abs[0] ;
		}
		
		if( altWhsesSegments == null ) {
			return ;
		}
		Ext.Object.each( altWhsesSegments, function( altWhseCode, segments ) {
			var gridDataRowId = '@'+altWhseCode+'%'+stdTeamCode+'%'+peopleCode ;
			if( !resourceData.hasOwnProperty(gridDataRowId) ) {
				resourceData[gridDataRowId] = Ext.apply({
					id: gridDataRowId,
					whse_code: altWhseCode,
					whse_isAlt: true,
					team_code: stdTeamCode,
					contract_code: stdContractCode,
					std_role_code: stdRoleCode,
					people_code: peopledayRecord.data.people_code,
					people_name: peopledayRecord.data.people_name
				},peopledayRecord.data.fields) ;
			}
			var gridDataRow = resourceData[gridDataRowId] ;
			gridDataRow[roleKey] = {
				roles: segments.roles,
				stdRole: stdRoleCode,
				stdEmpty: true
			} ;
			gridDataRow[durationKey] = {
				value: segments.roles_duration
			} ;
		}) ;
	},
	
	
	
	onBeforeEventAdd: function() {
		return false ;
	},
	
	
	
	
	
	
	handleQuit: function() {
		this.destroy() ;
	},
	
	onBeforeDestroy: function(pnl) {
		if( pnl.floatingPanel ) {
			pnl.floatingPanel.destroy() ;
		}
		if( pnl.printFrame ) {
			pnl.printFrame.destroy() ;
		}
	}
}) ;
