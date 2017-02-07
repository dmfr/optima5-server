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
		'Sch.model.Range',
		'Optima5.Modules.Spec.DbsPeople.RealDayEditor'
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
				text: '&#160;',
				itemId: 'day-picker',
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
				icon: 'images/op5img/ico_config_small.gif',
				text: 'Actions Jour',
				itemId: 'actions-menu',
				menu: [{
					icon: 'images/op5img/ico_print_16.png',
					itemId: 'grid-print',
					text: 'Print',
					handler: function(menuitem) {
						// this.handlePrintPanel( this.dateDayStr ) ;
					},
					scope: this
				},{
					itemId: 'grid-summary',
					iconCls: 'op5-spec-dbspeople-icon-actionday-summary',
					text: 'Compteurs ETP',
					handler: function(menuitem,e) {
						this.openSummary( this.dateDayStr ) ;
					},
					scope: this
				},{
					itemId: 'real-open',
					iconCls: 'op5-spec-dbspeople-icon-actionday-open',
					text: 'Ouverture Jour',
					handler: function(menuitem) {
						this.handleActionDay( 'open', this.dateDayStr ) ;
					},
					scope: this
				},{
					itemId: 'real-valid-ceq',
					iconCls: 'op5-spec-dbspeople-icon-actionday-validceq' ,
					text: 'Valid Exploitation',
					handler: function(menuitem) {
						this.handleActionDay( 'valid_ceq', this.dateDayStr ) ;
					},
					scope: this
				},{
					itemId: 'real-valid-rh',
					iconCls: 'op5-spec-dbspeople-icon-actionday-validrh' ,
					text: 'Valid RH',
					handler: function(menuitem) {
						this.handleActionDay( 'valid_rh', this.dateDayStr ) ;
					},
					scope: this
				},{
					itemId: 'real-reopen',
					iconCls: 'op5-spec-dbspeople-icon-actionday-reopen' ,
					text: 'Réouverture',
					handler: function(menuitem) {
						this.handleActionDay( 'reopen', this.dateDayStr ) ;
					},
					scope: this
				},{
					itemId: 'real-delete',
					iconCls: 'op5-spec-dbspeople-icon-actionday-delete' ,
					text: 'Supprimer',
					handler: function(menuitem) {
						this.handleActionDay( 'delete', this.dateDayStr ) ;
					},
					scope: this
				},{
					xtype: 'menucheckitem',
					itemId: 'real-checkbox-exceptionday',
					checked: false ,
					text: 'Exception jour',
					handler: Ext.emptyFn,
					listeners: {
						checkchange: function( menuitem, checked ) {
							this.handleExceptionDay( this.dateDayStr, checked ) ;
						},
						scope: this
					}
				}]
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
		
		me.down('toolbar').down('#day-picker').setText('<b>'+Ext.Date.format(date,'D d/m/Y')+'</b>') ;
		
		me.doGridConfigure() ;
		me.doLoad(true) ;
	},
	
	doGridConfigure: function() {
		var me = this,
			dateDayStart = Ext.clone(me.dateDay),
			dateDayEnd = Sch.util.Date.add(dateDayStart, Sch.util.Date.HOUR, 36) ;
			
		
		var pushModelfields = [] ;
		var columns = [{
			text: 'Entrepôt',
			dataIndex: 'whse_txt',
			width: 180,
			_groupBy: 'whse_code'
		},{
			text: 'Equipe',
			dataIndex: 'team_txt',
			width: 100,
			_groupBy: 'team_code'
		},{
			text: 'Contrat',
			dataIndex: 'contract_txt',
			width: 80,
			_groupBy: 'contract_code',
			hideable: true
		},{
			text: 'RôleStd',
			dataIndex: 'std_role_code',
			width: 60,
			_groupBy: 'std_role_code'
		},{
			text: '<b>Nom complet</b>',
			dataIndex: 'people_name',
			width: 200,
			renderer: function(v) {
				return '<b>'+v+'</b>' ;
			}
		},{
			align: 'center',
			text: '<b>Total<br>Heures</b>',
			dataIndex: 'total_duration',
			width: 60,
			renderer: function(value,metaData,record) {
				if( record.get('status_str') == 'virtual' ) {
					metaData.tdCls += ' op5-spec-dbspeople-realcell-virtual' ;
				}
				if( record.get('whse_isAlt') || value.stdValue==0 ) {
					return '' ;
				}
				
				value.totalValue = 0 ;
				value.workValue = 0 ;
				
				Ext.Array.each( record.getEvents(), function(schEvent) {
					var v = ( (schEvent.getEndDate() - schEvent.getStartDate()) / (1000*3600) ) ;
					value.totalValue += v ;
					if( !schEvent.get('is_abs') ) {
						value.workValue += v ;
					}
				}) ;
				
				if( value.totalValue < value.minValue ) {
					metaData.tdCls += ' op5-spec-dbspeople-realcolor-anomalie' ;
				} else if( value.workValue < value.stdValue ) {
					metaData.tdCls += ' op5-spec-dbspeople-balance-neg' ;
				} else if( value.workValue > value.stdValue ) {
					metaData.tdCls += ' op5-spec-dbspeople-balance-pos' ;
				}
				return '<b>'+value.totalValue+'</b>' ;
			},
			menuDisabled: true
		}] ;
		Ext.Array.each( Optima5.Modules.Spec.DbsPeople.HelperCache.getPeopleFields(), function( peopleField ) {
			var fieldColumn = {
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
			fields: [].concat(DbsPeopleRealRowModel.getFields()).concat(pushModelfields).concat({
				name: 'status_str',
				type: 'string'
			},{
				name: 'total_duration',
				type: 'auto'
			})
		});
		
		Ext.ux.dams.ModelManager.unregister( this.tmpEventName ) ;
		Ext.define(this.tmpEventName, {
			extend: 'Sch.model.Event',
			fields: [{
				name: 'is_new',
				type: 'boolean'
			},{
				name: 'is_delete',
				type: 'boolean'
			},{
				name: 'cli_code',
				type: 'string'
			},{
				name: 'role_code',
				type: 'string'
			},{
				name: 'alt_whse_code',
				type: 'string'
			},{
				name: 'is_abs',
				type: 'boolean'
			},{
				name: 'abs_code',
				type: 'string'
			}]
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
		
		Sch.preset.Manager.registerPreset('realDayPanelPreset',{
			timeColumnWidth: 60,
			rowHeight: 24,
			resourceColumnWidth: 100,
			displayDateFormat: "G:i",
			shiftIncrement: 1,
			shiftUnit: "DAY",
			defaultSpan: 24,
			timeResolution: {
					unit: "MINUTE",
					increment: 15
			},
			headerConfig: {
				middle: {
					unit: "HOUR",
					align: "center",
					dateFormat: "G:i",
					renderer: function (startDate, endDate, headerConfig, i) {
						var intHours = parseInt(Ext.Date.format(startDate, 'G')) ;
						return '<b>'+intHours+'</b>&#160;>&#160;<b>'+(intHours+1)+'</b>' ;
					}
				},
				top: {
					unit: "DAY",
					align: "center",
					dateFormat: "D d/m/Y",
					renderer: function (startDate, endDate, headerConfig, i) {
						return '<b>'+Ext.Date.format(startDate, 'D d/m/Y')+'</b>';
					}
				}
			}
		}) ;
		
		me.removeAll() ;
		me.add(Ext.create('Sch.panel.SchedulerGrid',{
			border: false,
			viewPreset  : 'realDayPanelPreset',
			allowOverlap: false,
			constrainDragToResource: true,
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
				data    :  []
			}),
			eventRenderer: function( eventRec, resourceRec, templateData ) {
				var str ;
				if( resourceRec.get('status_str') == 'virtual' ) {
					if( eventRec.get('is_abs') ) {
						str = eventRec.get('abs_code') ;
						templateData.cls = 'op5-spec-dbspeople-realsch-virtual-abs' ;
					} else {
						str = eventRec.get('role_code') ;
						templateData.cls = 'op5-spec-dbspeople-realsch-virtual-role' ;
					}
					return str ;
				}
				if( !Ext.isEmpty(eventRec.get('alt_whse_code')) ) {
					str = '@'+'&#160:'+eventRec.get('alt_whse_code') ;
					templateData.cls = 'op5-spec-dbspeople-realsch-whse' ;
					return str ;
				}
				
				if( eventRec.get('is_abs') ) {
					str = eventRec.get('abs_code') ;
					templateData.cls = 'op5-spec-dbspeople-realsch-abs' ;
				} else {
					str = eventRec.get('role_code') ;
					if( eventRec.get('role_code') != resourceRec.get('std_role_code') ) {
						templateData.cls = 'op5-spec-dbspeople-realsch-rolediff' ;
					} else {
						templateData.cls = 'op5-spec-dbspeople-realsch-role' ;
					}
				}
				return str ;
			},
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
				afterrender: function( gridpanel ) {
					Ext.defer( function() {
						var nowDate = Ext.clone(this.dateDay) ;
						nowDate.setHours(8) ;
						gridpanel.scrollToDate( nowDate, false ) ;
					},200,this) ;
				},
				beforeeventadd: this.onBeforeEventAdd,
				dragcreateend: this.onAfterEventAdd,
				eventcontextmenu: this.onEventClick,
				eventdblclick: this.onEventClick,
				eventresizeend: this.onEventResize,
				scope: me
			},
			viewConfig: {
				preserveScrollOnRefresh: true,
				getRowClass: function(record) {
					if( record.get('whse_isAlt') ) {
						return 'op5-spec-dbspeople-realcolor-whse' ;
					}
					
					var cls = '' ;
					if( me.colCfg && me.colCfg.status_exceptionDay ) {
						cls += ' op5-spec-dbspeople-realcolor-exceptionday' ;
					}
					switch( record.get('status_str') ) {
						case 'openrh' :
						case 'open' :
							cls += ' op5-spec-dbspeople-realcolor-' + record.get('status_str') ;
							break ;
					}
					return cls ;
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
			
		grid.getSchedulingView().scrollVerticallyTo(0,false) ;
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
		
		if( jsonResponse.columns.hasOwnProperty(this.dateDayStr) ) {
			this.colCfg = jsonResponse.columns[this.dateDayStr] ;
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
		//this.autoRefreshTask.delay( this.autoRefreshDelay ) ;
		
		// Configure menu
		var HelperCache = Optima5.Modules.Spec.DbsPeople.HelperCache,
			colCfg = this.colCfg ;
		var menu = this.down('toolbar').down('#actions-menu') ;
		menu.down('#grid-print').setVisible( colCfg ) ;
		menu.down('#grid-summary').setVisible( colCfg ) ;
		menu.down('#real-open').setVisible( colCfg && colCfg.enable_open && !colCfg.status_earlyLocked && HelperCache.authHelperQueryPage('CEQ') ) ;
		menu.down('#real-valid-ceq').setVisible( colCfg && colCfg.enable_valid_ceq && HelperCache.authHelperQueryPage('CEQ') ) ;
		menu.down('#real-valid-rh').setVisible( colCfg && colCfg.enable_valid_rh && HelperCache.authHelperQueryPage('RH') ) ;
		menu.down('#real-reopen').setVisible( colCfg && !colCfg.enable_open && !colCfg.enable_valid_ceq && !colCfg.enable_valid_rh && HelperCache.authHelperQueryPage('ADMIN') ) ;
		menu.down('#real-delete').setVisible( colCfg && HelperCache.authHelperQueryPage('ADMIN') ) ;
		menu.down('#real-checkbox-exceptionday').setVisible( colCfg && colCfg.status_virtual && HelperCache.authHelperQueryPage('RH') ) ;
		menu.down('#real-checkbox-exceptionday').setChecked( colCfg && colCfg.status_exceptionDay, true ) ;
	},
	
	gridAdapterInit: function() {
		var grid = this.child('grid'),
			resourceData = {},
			eventData = [] ;
		
		this.peopledayStore.each( function(peopledayRecord) {
			this.gridAdapterPopulateForPeopledayRecord( resourceData, eventData, peopledayRecord ) ;
		},this) ;
		
		resourceData = this.gridAdapterGridFilter(resourceData) ;
		
		grid.getResourceStore().loadRawData( resourceData ) ;
		grid.getEventStore().loadRawData( eventData ) ;
	},
	gridAdapterUpdatePeopledayRecord: function(peopledayRecord) {
		var grid = this.child('grid'),
			resourceStore = grid.getResourceStore(),
			eventStore = grid.getEventStore() ;
		
		resourceStore.suspendEvents(true) ; // HACK: suspendingEvents on bufferedgrid'store is dangerous
		eventStore.suspendEvents(true) ; // HACK: suspendingEvents on bufferedgrid'store is dangerous
		
		// suppr de tous les events concernés par ce record
		if( peopledayRecord.get('date_sql') != this.dateDayStr ) {
			return ; // hors champ
		}
		var resourceRecordIdsToDelete = [] ;
		resourceStore.data.each( function(resourceRecord) {
			if( resourceRecord.get('people_code') != peopledayRecord.get('people_code') ) {
				return ;
			}
			
			Ext.Array.each( resourceRecord.getEvents(), function(eventRecord) {
				eventStore.remove(eventRecord) ;
			}) ;
			
			if( resourceRecord.get('whse_isAlt') ) {
				resourceRecordIdsToDelete[resourceRecord.getId()] = true ;
			}
		}) ;
		
		// construction d'une grid data partielle
		var resourceData = {},
			eventData = [] ;
		this.gridAdapterPopulateForPeopledayRecord( resourceData, eventData, peopledayRecord ) ;
		
		resourceData = this.gridAdapterGridFilter(resourceData) ;
		
		var resourceRecordsToAdd = [] ;
		// fusion avec le store existant
		Ext.Array.each( resourceData, function( resourceDataRow ) {
			var resourceDataRowId = resourceDataRow.Id ;
			// row record exists ?
			var resourceRecord = resourceStore.getById( resourceDataRowId ) ;
			if( resourceRecord != null ) {
				resourceRecordIdsToDelete[resourceRecord.getId()] = false ;
			} else {
				resourceRecordsToAdd.push(resourceDataRow) ;
			}
		}) ;
		
		resourceStore.resumeEvents() ; // HACK: need to resume -BEFORE- add/remove record(s)
		eventStore.resumeEvents() ; // HACK: need to resume -BEFORE- add/remove record(s)
		
		if( resourceRecordsToAdd.length > 0 ) {
			resourceStore.add(resourceRecordsToAdd) ;
		}
		var resourceRecordsToDelete = [] ;
		Ext.Object.each( resourceRecordIdsToDelete, function(resourceDataRowId,tOrF) {
			if( tOrF ) {
				var resourceRecord = resourceStore.getById(resourceDataRowId) ;
				if( resourceRecord != null ) {
					resourceRecordsToDelete.push(resourceRecord) ;
				}
			}
		}) ;
		if( resourceRecordsToDelete.length > 0 ) {
			resourceStore.remove(resourceRecordsToDelete) ;
		}
		
		eventStore.add(eventData) ;
		
		if( resourceRecordsToAdd.length > 0 ) { // more than 1 => alt warehouses and possible inserts
			resourceStore.filter() ;
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
	gridAdapterISOfactory: function( intHours ) {
		return this.gridAdapterDateAdd( Ext.Date.parse(this.dateDayStr,'Y-m-d'), intHours ) ;
	},
	gridAdapterDateAdd: function( objDate, intHours ) {
		var decMins = intHours - Math.floor(intHours),
			intMins = Math.floor(decMins * 60) ;
		intHours = Math.floor(intHours) ;
		
		objDate = Ext.Date.add( objDate, Ext.Date.HOUR, intHours ) ;
		objDate = Ext.Date.add( objDate, Ext.Date.MINUTE, intMins ) ;
		return objDate ;
	},
	gridAdapterPopulateForPeopledayRecord: function( resourceData, eventData, peopledayRecord ) {
		if( peopledayRecord.get('date_sql') != this.dateDayStr ) {
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
		
		var stdEvents = [],
			altWhsesSegments = null,
			workDuration = 0,
			absDuration = 0,
			statusIsVirtual = false,
			statusIsOpen = false,
			statusIsValidCeq = false,
			statusIsValidRh = false,
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
			statusIsOpen = true ;
			statusStr = 'open' ;
		}
		else if( !peopledayRecord.data.status_isValidRh ) {
			statusIsOpen = true ;
			statusIsValidCeq = true ;
			statusStr = 'openrh' ;
		}
		else {
			statusIsOpen = true ;
			statusIsValidCeq = true ;
			statusIsValidRh = true ;
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
		
		var notimeStdStartHour = 9 ;
		
		// ***** Création ligne standard ***********
		var gridDataRowId = stdWhseCode+'%'+stdTeamCode+'%'+peopleCode ;
		if( !resourceData.hasOwnProperty(gridDataRowId) ) {
			resourceData[gridDataRowId] = Ext.apply({
				Id: gridDataRowId,
				whse_code: stdWhseCode,
				whse_isAlt: false,
				team_code: stdTeamCode,
				contract_code: stdContractCode,
				std_role_code: stdRoleCode,
				people_code: peopledayRecord.data.people_code,
				people_name: peopledayRecord.data.people_name,
				status_str: statusStr,
				total_duration: {
					stdValue: ( (stdAbsCode == null || stdAbsHalfDay) ? stdDayLength : 0 ),
					minValue: ( stdAbsCode == null ? stdDayLengthMin : 0 )
				}
				
			},peopledayRecord.data.fields) ;
		}
		
		if( statusIsVirtual ) {
			if( stdDayLength == 0 ) {
				return ;
			}
			if( peopledayRecord.data.std_hour_start > 0 ) {
				console.dir( peopledayRecord.data.std_hour_start ) ;
				notimeStdStartHour = peopledayRecord.data.std_hour_start ;
			}
			if( !stdAbsCode || stdAbsHalfDay ) {
				eventData.push({
					Id: 'virtualrole-'+gridDataRowId,
					ResourceId: gridDataRowId,
					StartDate: this.gridAdapterISOfactory(notimeStdStartHour),
					EndDate: this.gridAdapterISOfactory(notimeStdStartHour+stdDayLength),
					Draggable: false,
					Resizable: false,
					
					role_code: stdRoleCode
				});
				notimeStdStartHour += stdDayLength ;
			}
			if( stdAbsCode ) {
				eventData.push({
					Id: 'virtualabs-'+gridDataRowId,
					ResourceId: gridDataRowId,
					StartDate: this.gridAdapterISOfactory(notimeStdStartHour),
					EndDate: this.gridAdapterISOfactory(notimeStdStartHour+stdDayLength),
					Draggable: false,
					Resizable: false,
					
					is_abs: true,
					abs_code: stdAbsCode
				});
				notimeStdStartHour += stdDayLength ;
			}
			return ;
		}
		
		
		var notimeStdStartHour = 9 ;
		var startDate, endDate ;
		peopledayRecord.works().each( function(workRecord) {
			startDate = ( workRecord.data.role_start || this.gridAdapterISOfactory(notimeStdStartHour) ) ;
			endDate = this.gridAdapterDateAdd(startDate,workRecord.data.role_length) ;
			notimeStdStartHour = parseInt(Ext.Date.format(endDate,'H')) + (parseInt(Ext.Date.format(endDate,'i'))/60) ;
			
			var altWhseCode = workRecord.data.alt_whse_code ;
			
			if( !Ext.isEmpty(workRecord.data.alt_whse_code) ) {
				eventData.push({
					Id: 'altwhse-'+workRecord.getId(),
					ResourceId: gridDataRowId,
					StartDate: startDate,
					EndDate: endDate,
					Draggable: true,
					Resizable: true,
					
					alt_whse_code: altWhseCode
				});
				
				var altGridDataRowId = '@'+altWhseCode+'%'+stdTeamCode+'%'+peopleCode ;
				if( !resourceData.hasOwnProperty(altGridDataRowId) ) {
					resourceData[altGridDataRowId] = Ext.apply({
						Id: altGridDataRowId,
						whse_code: altWhseCode,
						whse_isAlt: true,
						team_code: stdTeamCode,
						contract_code: stdContractCode,
						std_role_code: stdRoleCode,
						people_code: peopledayRecord.data.people_code,
						people_name: peopledayRecord.data.people_name,
						status_str: 'alt_whse'
					},peopledayRecord.data.fields) ;
				}
				eventData.push({
					Id: 'role-'+workRecord.getId(),
					ResourceId: altGridDataRowId,
					StartDate: startDate,
					EndDate: endDate,
					Draggable: false,
					Resizable: false,
					
					cli_code: workRecord.data.cli_code,
					role_code: workRecord.data.role_code
				});
				
				return ;
			}
			
			eventData.push({
				Id: 'role-'+workRecord.getId(),
				ResourceId: gridDataRowId,
				StartDate: startDate,
				EndDate: endDate,
				Draggable: true,
				Resizable: true,
				
				cli_code: workRecord.data.cli_code,
				role_code: workRecord.data.role_code
			});
		},this) ;
		peopledayRecord.abs().each( function(absRecord) {
			startDate = (absRecord.data.abs_start || this.gridAdapterISOfactory(notimeStdStartHour)) ;
			endDate = this.gridAdapterDateAdd(startDate,absRecord.data.abs_length) ;
			notimeStdStartHour = parseInt(Ext.Date.format(endDate,'H')) + (parseInt(Ext.Date.format(endDate,'i'))/60) ;
			
			eventData.push({
				Id: 'abs-'+absRecord.getId(),
				ResourceId: gridDataRowId,
				StartDate: startDate,
				EndDate: endDate,
				Draggable: true,
				Resizable: true,
				
				is_abs: true,
				abs_code: absRecord.data.abs_code
			});
		},this) ;
	},
	
	
	
	onBeforeEventAdd: function(schedulerView,eventRecord) {
		var grid = this.down('grid') ;
			resourceRecord = grid.getResourceStore().getById(eventRecord.get('ResourceId')) ;
		
		if( resourceRecord.get('status_str') == 'virtual' ) {
			return false ;
		}
		eventRecord.set('is_new',true) ;
	},
	onAfterEventAdd: function(schedulerView,eventRecord) {
		if( !eventRecord ) {
			return ;
		}
		Ext.defer( function() {
			this.openPopup(schedulerView,eventRecord) ; //HACK
		},100,this) ;
	},
	onEventClick: function(schedulerView, eventRecord, e, eOpts) {
		var resourceRecord = eventRecord.getResource() ;
		if( resourceRecord.get('status_str') == 'virtual' ) {
			return ;
		}
		this.openPopup(schedulerView,eventRecord) ;
	},
	onEventResize: function(schedulerView, eventRecord) {
		var peopleCode = eventRecord.getResource().get('people_code') ;
		this.gridAdapterRebuildPeopledayRecord( peopleCode ) ;
	},
	openPopup: function(schedulerView, eventRecord) {
		var me = this ;
		var htmlNode = schedulerView.getElementsFromEventRecord(eventRecord)[0] ;
		if( !htmlNode ) {
			return ;
		}
		
		var realAdvancedPanel = Ext.create('Optima5.Modules.Spec.DbsPeople.RealDayEditor',{
			eventRecord: eventRecord,
			//gridRecord: gridRecord,
			//peopledayRecord: peopledayRecord,
			width:800, // dummy initial size, for border layout to work
			height:600, // ...
			floating: true,
			draggable: true,
			renderTo: me.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.handleDelete();
				},
				scope: this
			},{
				type: 'save',
				handler: function(e, t, p) {
					p.ownerCt.handleSave();
				},
				scope: this
			}]
		});
		
		// Size + position
		realAdvancedPanel.setSize({
			width: 300,
			height: 150
		}) ;
		realAdvancedPanel.on('destroy',function(realAdvancedPanel) {
			var eventRecord = realAdvancedPanel.eventRecord,
				peopleCode = eventRecord.getResource().get('people_code') ;
			if( eventRecord.get('is_delete') ) {
				this.down('grid').getEventStore().remove(eventRecord) ;
			}
			this.gridAdapterRebuildPeopledayRecord( peopleCode ) ;
			
			me.getEl().unmask() ;
			this.floatingPanel = null ;
		},me,{single:true}) ;
		me.getEl().mask() ;
		
		realAdvancedPanel.show();
		
		realAdvancedPanel.getEl().alignTo(htmlNode, "bl");
		//Optima5.Helper.floatInsideParent( realAdvancedPanel ) ;
		
		me.floatingPanel = realAdvancedPanel ;
	},
	
	
	
	gridAdapterRebuildPeopledayRecord: function( peopleCode ) {
		var grid = this.down('grid'),
			resourceStore = grid.getResourceStore(),
			eventStore = grid.getEventStore() ;
		
		// **** Existing peopleday record *****
		var peopledayRecordId = peopleCode + '@' + this.dateDayStr,
			peopledayRecord = this.peopledayStore.getById(peopledayRecordId) ;
		if( !peopledayRecord ) {
			return ;
		}
		
		var stdWhseCode = peopledayRecord.get('std_whse_code'),
			stdTeamCode = peopledayRecord.get('std_team_code'),
			gridDataRowId = stdWhseCode+'%'+stdTeamCode+'%'+peopleCode,
			stdResourceRecord = resourceStore.getById(gridDataRowId) ;
		if( !stdResourceRecord ) {
			return ;
		}
		
		var stdEventsData = [] ;
		Ext.Array.each( stdResourceRecord.getEvents(), function( eventRecord ) {
			stdEventsData.push( eventRecord.getData() ) ;
		}) ;
		Ext.Array.sort( stdEventsData, function(o1,o2) {
			return o1.StartDate - o2.StartDate ;
		}) ;
		
		
		var workSlices = [], absSlices = [], eventStartDate, nextStartDate, sliceDuration ;
		var dontUpdateLoop = true ;
		Ext.Array.each( stdEventsData, function(eventData) {
			eventStartDate = Ext.clone(eventData.StartDate) ;
			if( nextStartDate && nextStartDate > eventStartDate ) {
				eventStartDate = Ext.clone(nextStartDate) ;
			}
			nextStartDate = Ext.clone(eventData.EndDate) ;
			sliceDuration = ((nextStartDate - eventStartDate) / (1000*3600)) ;
			
			if( eventData.is_abs ) {
				absSlices.push({
					abs_code: eventData.abs_code,
					abs_start: Ext.Date.format(eventStartDate,'Y-m-d H:i:s'),
					abs_length: sliceDuration
				});
				return ;
			}
			if( !Ext.isEmpty(eventData.alt_whse_code) ) {
				dontUpdateLoop = false ;
				
				var altRoleCode = stdResourceRecord.get('std_role_code'),
					altCliCode = Optima5.Modules.Spec.DbsPeople.HelperCache.links_cli_getDefaultForWhse( eventData.alt_whse_code ) ;
				
				// recherche d'un event parallèle
				var altGridDataRowId = '@'+eventData.alt_whse_code+'%'+stdTeamCode+'%'+peopleCode,
					altResourceRecord = resourceStore.getById(altGridDataRowId) ;
				if( altResourceRecord ) {
					Ext.Array.each( altResourceRecord.getEvents(), function( altEventRecord ) {
						if( altEventRecord.get('StartDate') == eventData.StartDate ) {
							altCliCode = altEventRecord.get('cli_code') ;
							altRoleCode = altEventRecord.get('role_code') ;
						}
					}) ;
				}
				
				workSlices.push({
					alt_whse_code: eventData.alt_whse_code,
					cli_code: altCliCode,
					role_code: altRoleCode,
					role_start: Ext.Date.format(eventStartDate,'Y-m-d H:i:s'),
					role_length: sliceDuration
				});
				return ;
			}
			workSlices.push({
				cli_code: eventData.cli_code,
				role_code: eventData.role_code,
				role_start: Ext.Date.format(eventStartDate,'Y-m-d H:i:s'),
				role_length: sliceDuration
			});
			return ;
		}) ;
		
		
		// **** Store back into peopledayRecord ******
		peopledayRecord.works().loadRawData(workSlices) ;
		peopledayRecord.abs().loadRawData(absSlices) ;
		
		// **** Update adapter ********
		if( dontUpdateLoop ) {
			// FAST mode : no alt whse, one resource per peopledayRecord, already up-to-date from screen manipulation
		} else {
			this.gridAdapterUpdatePeopledayRecord( peopledayRecord ) ;
		}
		this.remoteSavePeopledayRecord(peopledayRecord) ;
	},
	
	
	
	remoteSavePeopledayRecord: function( peopledayRecord ) {
		if( peopledayRecord.get('status_isVirtual') ) {
			this.onAfterSave() ;
			return ;
		}
		
		var ajaxParams = {
			_moduleId: 'spec_dbs_people',
			_action: 'Real_saveRecord',
			data: Ext.JSON.encode( peopledayRecord.getData(true) )
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
		if( this.autoRefreshAfterEdit ) {
			this.autoRefreshAfterEdit = false ;
			this.doLoad() ;
		}
	},
	
	openSummary: function( dSql ) {
		// ***** Clone records ******
		var peopledayRecordsData = [] ;
		this.peopledayStore.each( function(peopledayRecord) {
			peopledayRecordsData.push(peopledayRecord.getData(true)) ;
		}) ;
		
		this.getEl().mask() ;
		
		// Filtres en cours
		var filterBtn_site = this.down('#btnSite'),
			filterBtn_team = this.down('#btnTeam'),
			filter_whses = ( filterBtn_site.getNode()==null ? null : filterBtn_site.getLeafNodesKey() ),
			filter_teams = ( filterBtn_team.getNode()==null ? null : filterBtn_team.getLeafNodesKey() ) ;
		
		// Open panel
		var summaryPanel = Ext.create('Optima5.Modules.Spec.DbsPeople.RealSummaryPanel',{
			optimaModule: this.optimaModule,
			width:400, // dummy initial size, for border layout to work
			height:null, // ...
			floating: true,
			draggable: true,
			resizable: true,
			renderTo: this.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				},
				scope: this
			}],
			cfgData: {
				date_sql: dSql,
				filter_site: (filter_whses ? filterBtn_site.getValue() : null),
				filter_team: (filter_teams ? filterBtn_team.getValue() : null),
				peopledayRecordsData: peopledayRecordsData
			}
		});
		
		summaryPanel.on('destroy',function(summaryPanel) {
			this.getEl().unmask() ;
			this.floatingPanel = null ;
		},this,{single:true}) ;
		
		summaryPanel.show();
		summaryPanel.getEl().alignTo(this.getEl(), 'c-c?');
		
		this.floatingPanel = summaryPanel ;
	},
	
	
	handleActionDay: function( actionDay, dSql ) {
		var txt ;
		switch( actionDay ) {
			case 'open' :
				txt = 'Ouverture' ;
				break ;
			case 'valid_ceq':
			case 'valid_rh' :
				txt = null ;
				break ;
			case 'reopen' :
				txt = 'Reprendre la saisie pour' ;
				break ;
			case 'delete' :
				txt = 'ATTENTION ! Supprimer toutes données pour' ;
				break ;
			default: 
				break ;
		}
		if( txt==null ) {
			this.doActionDay(actionDay,dSql) ;
			return ;
		}
		Ext.MessageBox.confirm('Day Action', txt + ' jour '+dSql+' ?', function(buttonStr) {
			if( buttonStr!='yes' ) {
				return ;
			}
			this.doActionDay(actionDay,dSql) ;
		},this) ;
	},
	doActionDay: function( actionDay, dSql ) {
		this.showLoadmask() ;
		
		var filterSiteBtn = this.down('#btnSite'),
			filterTeamBtn = this.down('#btnTeam') ;
		
		var ajaxParams = {
			_moduleId: 'spec_dbs_people',
			_action: 'Real_actionDay',
			_subaction: actionDay,
			date_sql: dSql
		};
		if( filterSiteBtn.getNode() != null ) {
			ajaxParams['filter_site_entries'] = Ext.JSON.encode( filterSiteBtn.getLeafNodesKey() ) ;
		}
		ajaxParams['filter_site_txt'] = filterSiteBtn.getText() ;
		if( filterTeamBtn.getNode() != null ) {
			ajaxParams['filter_team_entries'] = Ext.JSON.encode( filterTeamBtn.getLeafNodesKey() ) ;
		}
		ajaxParams['filter_team_txt'] = filterTeamBtn.getText() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				this.hideLoadmask() ;
				if( Ext.JSON.decode(response.responseText).success != true ) {
					Ext.MessageBox.alert('Erreur','Impossible de valider le statut.') ;
					return ;
				}
				switch( actionDay ) {
					case 'valid_ceq':
					case 'valid_rh' :
						this.openValidConfirm(ajaxParams, Ext.JSON.decode(response.responseText)) ;
						break ;
					default :
						this.doLoad() ;
						break ;
				}
			},
			scope: this
		}) ;
	},
	openValidConfirm: function( postParams, jsonResponse ) {
		
		var validConfirmPanel = Ext.create('Optima5.Modules.Spec.DbsPeople.RealConfirmPanel',{
			parentRealPanel: this,
			width:600, // dummy initial size, for border layout to work
			height:null, // ...
			floating: true,
			draggable: true,
			resizable: true,
			renderTo: this.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				},
				scope: this
			}],
			cfgData: {
				actionDay: postParams._subaction,
				date_sql: postParams.date_sql,
				filter_site_txt: postParams.filter_site_txt,
				filter_team_txt: postParams.filter_team_txt,
				people_count: jsonResponse.people_count,
				exception_rows: jsonResponse.exception_rows
			}
		});
		
		validConfirmPanel.on('destroy',function(validConfirmPanel) {
			this.getEl().unmask() ;
			this.floatingPanel = null ;
		},this,{single:true}) ;
		
		validConfirmPanel.on('submit',function(validConfirmPanel) {
			validConfirmPanel.getEl().mask('Validating...') ;
			this.optimaModule.getConfiguredAjaxConnection().request({
				params: Ext.merge(postParams,{
					_do_valid: 1
				}),
				callback: function() {
					validConfirmPanel.getEl().unmask() ;
				},
				success: function(response) {
					if( Ext.JSON.decode(response.responseText).success != true ) {
						Ext.MessageBox.alert('Problem','Impossible de valider le statut, veuillez vérifier les anomalies.') ;
						return ;
					}
					validConfirmPanel.destroy() ;
					this.doLoad() ;
				},
				scope: this
			}) ;
		},this) ;
		
		this.getEl().mask() ;
		
		validConfirmPanel.show();
		validConfirmPanel.getEl().alignTo(this.getEl(), 'c-c?');
		
		this.floatingPanel = validConfirmPanel ;
	},
	handleExceptionDay: function( dSql, trueOrFalse ) {
		this.showLoadmask() ;
		
		var ajaxParams = {
			_moduleId: 'spec_dbs_people',
			_action: 'Real_exceptionDaySet',
			exception_is_on: ( trueOrFalse ? 1:0 ),
			date_sql: dSql
		};
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				this.hideLoadmask() ;
				if( Ext.JSON.decode(response.responseText).success != true ) {
					Ext.MessageBox.alert('Problem','Impossible de changer le statut.') ;
					return ;
				}
				this.doLoad() ;
			},
			scope: this
		}) ;
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
