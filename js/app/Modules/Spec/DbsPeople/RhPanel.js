Ext.define('DbsPeopleRhPeopleEventModel', {
	extend: 'Ext.data.Model',
	idProperty: 'event_id',
	fields: [
		{name: 'event_id',   type: 'int'},
		{name: 'event_type',   type: 'string'},
		{name: 'x_code',   type: 'string'},
		{name: 'date_start',   type: 'date', dateFormat:'Y-m-d'},
		{name: 'date_end',   type: 'date', dateFormat:'Y-m-d', allowNull:true}
	]
});

Ext.define('DbsPeopleRhPeopleCalcAttributeRowModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'row_date', type: 'string'},
		{name: 'row_text', type: 'string'},
		{name: 'row_value', type: 'number'}
	]
}) ;
Ext.define('DbsPeopleRhPeopleCalcAttributeModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'people_calc_attribute',   type: 'string'},
		{name: 'calc_date',   type: 'string'},
		{name: 'calc_value',   type: 'number'},
		{name: 'calc_unit_txt',   type: 'string'}
	],
	hasMany: [{
		model: 'DbsPeopleRhPeopleCalcAttributeRowModel',
		name: 'rows',
		associationKey: 'rows'
	}]
});

Ext.define('DbsPeopleRhPeopleModel', {
	extend: 'Ext.data.Model',
	idProperty: 'people_code',
	fields: [
		{name: '_is_new',  type: 'boolean'},
		{name: 'status_out',  type: 'boolean'},
		{name: 'status_undefined',  type: 'boolean'},
		{name: 'status_incident',  type: 'boolean'},
		{name: 'contract_code',  type: 'string'},
		{
			name: 'contract_txt',
			type: 'string',
			convert: function(v, record) {
				v = record.data.contract_code ;
				return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("CONTRACT",v).text ;
			}
		},
		{name: 'whse_code',  type: 'string'},
		{
			name: 'whse_txt',
			type: 'string',
			convert: function(v, record) {
				v = record.data.whse_code ;
				return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("WHSE",v).text ;
			}
		},
		{name: 'team_code',  type: 'string'},
		{
			name: 'team_txt',
			type: 'string',
			convert: function(v, record) {
				v = record.data.team_code ;
				return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("TEAM",v).text ;
			}
		},
		{name: 'role_code',  type: 'string'},
		{
			name: 'role_txt',
			type: 'string',
			convert: function(v, record) {
				v = record.data.role_code ;
				return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("ROLE",v).text ;
			}
		},
		{name: 'people_code',   type: 'string'},
		{name: 'people_name',   type: 'string'},
		{name: 'nextEvent_type',   type: 'string'},
		{name: 'nextEvent_dateStart',   type: 'string'},
		{name: 'nextEvent_dateEnd',   type: 'string'},
		{name: 'nextEvent_xCode',   type: 'string'}
	],
	hasMany: [{
		model: 'DbsPeopleRhPeopleEventModel',
		name: 'events',
		associationKey: 'events'
	},{
		model: 'DbsPeopleRhPeopleCalcAttributeModel',
		name: 'calc_attributes',
		associationKey: 'calc_attributes'
	}]
});

Ext.define('Optima5.Modules.Spec.DbsPeople.RhPanel',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Optima5.Modules.Spec.DbsPeople.CfgParamTree',
		'Optima5.Modules.Spec.DbsPeople.RhFormPanel',
		'Optima5.Modules.Spec.DbsPeople.RhCalcAttributesPanel',
		'Optima5.Modules.Spec.DbsPeople.RhAttributesValuesSetupPanel'
	],
	
	cfgPeopleCalcAttributes: [],
	
	initComponent: function() {
		var me = this ;
		
		Ext.apply(me,{
			//frame: true,
			border: false,
			layout:'border',
			tbar:[{
				icon: 'images/op5img/ico_back_16.gif',
				text: '<b>Retour menu</b>',
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
							var filterChanged = true ;
							this.reload(filterChanged) ;
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
							var filterChanged = true ;
							this.reload(filterChanged) ;
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
				icon: 'images/op5img/ico_zoom_16.png',
				textOrig: 'Filtres',
				text: 'Filtres',
				itemId: 'btnFilters',
				menu: {
					layout: 'anchor',
					bodyPadding: 10,
					bodyCls: 'ux-noframe-bg',
					listeners: {
						expand: function(menu) {
							menu.down('textfield').focus() ;
						}
					},
					items: [{
						xtype: 'textfield',
						itemId: 'txtSearch',
						fieldLabel: 'Recherche',
						labelWidth: 80,
						listeners: {
							/*
							change: function() {
								if( this.autoRefreshTask ) {
									this.autoRefreshTask.cancel() ;
								}
							},
							select: this.onSearchSelect,
							*/
							change: {
								fn: function(field) {
									this.applyFilters() ;
								},
								scope: this,
								buffer: 500
							},
							afterrender: function( field ) {
								var triggers = field.getTriggers() ;
								if( triggers.picker ) {
									triggers.picker.hide() ;
								}
							},
							scope: this
						}
				
					},{
						xtype: 'checkbox',
						itemId: 'chkPeopleHidden',
						boxLabel: 'Afficher inactifs',
						listeners: {
							change: function() {
								this.up().down('textfield').suspendEvents(false) ;
								this.up().down('textfield').reset() ;
								this.up().down('textfield').resumeEvents() ;
								//this.applyFilters() ; // Reload instead
								this.reload() ;
							},
							scope: this
						}
					}]
				}
			},'->',{
				icon: 'images/modules/admin-user-16.png',
				text: 'New People',
				handler: function() {
					this.onNewPeople() ;
				},
				scope: this
			},{
				icon: 'images/modules/admin-import-16.png',
				text: 'Réglage solde(s)',
				handler: function() {
					this.openRhAttributesValuesSetupPopup() ;
				},
				scope: this
			},{
				icon: 'images/op5img/ico_download_16.png',
				text: 'Calcul soldes',
				handler: function() {
					this.reload(undefined,true) ;
				},
				scope: this
			}],
			items:[{
				region:'center',
				itemId:'mRhGridContainer',
				flex:1,
				border: false,
				layout: 'fit',
				items:[{
					xtype: 'component',
					cls: 'op5-waiting'
				}]
			},{
				region:'east',
				xtype: 'panel',
				layout:'fit',
				flex: 1,
				itemId:'mRhFormContainer',
				collapsible:true,
				collapsed: true,
				_empty:true,
				listeners:{
					beforeexpand:function(eastpanel) {
						if( eastpanel._empty ) {
							return false;
						}
					},
					scope:me
				}
			}]
		});
		
		this.tmpModelName = 'DbsPeopleRhPeopleModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpModelName ) ;
		}) ;
		
		this.preInit = 3 ;
		this.callParent() ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_people',
				_action: 'cfg_getPeopleCalcAttributes'
			},
			callback: function() {
				this.onPreInit() ;
			},
			success: function( response ) {
				var json = Ext.JSON.decode(response.responseText),
					cfgPeopleCalcAttributes = (json.success ? json.data : []) ;
				this.cfgPeopleCalcAttributes = cfgPeopleCalcAttributes ;
			},
			scope: this
		});
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
		me.doGridConfigure() ;
	},
	doGridConfigure: function() {
		var me = this,
			gridCnt = me.down('#mRhGridContainer') ;
			
		var addModelFields = [] ;
			
		//console.dir(grid.columns) ;
		var columns = [{
			text: 'Entrepôt',
			dataIndex: 'whse_txt',
			width: 100,
			_groupBy: 'whse_code'
		},{
			text: 'Equipe',
			dataIndex: 'team_txt',
			width: 100,
			_groupBy: 'team_code'
		},{
			text: 'Contrat',
			dataIndex: 'contract_txt',
			width: 100,
			_groupBy: 'contract_code'
		},{
			text: 'Rôle',
			dataIndex: 'role_txt',
			width: 100,
			_groupBy: 'role_code'
		},{
			text: '<b>Nom complet</b>',
			dataIndex: 'people_name',
			width: 200,
			renderer: function(v) {
				return '<b>'+v+'</b>' ;
			},
			sortable: true
		}] ;
		
		Ext.Array.each( Optima5.Modules.Spec.DbsPeople.HelperCache.getPeopleFields(), function( peopleField ) {
			var fieldColumn = {
				text: peopleField.text,
				dataIndex: peopleField.field,
				_groupBy: peopleField.field,
				hideable: true,
				hidden: !peopleField.is_highlight,
				width: 100
			} ;
			if( peopleField.type=='link' ) {
				Ext.apply(fieldColumn,{
					renderer: function(v) {
						return v.text ;
					}
				}) ;
			}
			if( peopleField.type=='bool' ) {
				Ext.apply(fieldColumn,{
					align: 'center',
					renderer: function(value) {
						if( value==1 ) {
							return '<b>X</b>' ;
						}
						else {
							return '' ;
						}
					}
				}) ;
			}
			if( peopleField.type=='number' ) {
				Ext.apply(fieldColumn,{
					align: 'center'
				}) ;
			}
			columns.push(fieldColumn) ;
			
			var fieldType ;
			switch( peopleField.type ) {
				case 'link' :
					fieldType='auto' ;
					break ;
				case 'number' :
					fieldType='number' ;
					break ;
				default:
					fieldType='string' ;
					break ;
			}
			addModelFields.push({
				name: peopleField.field,
				type: fieldType
			});
		}) ;
		
		var peopleCalcColumns = [] ;
		var calcAttributeRenderer = function(v,metaData) {
			if( v < 0 ) {
				metaData.tdCls += ' op5-spec-dbspeople-balance-neg' ;
			} else if( v > 0 ) {
				metaData.tdCls += ' op5-spec-dbspeople-balance-pos' ;
			}
			if( v != 0 ) {
				metaData.tdCls += ' op5-spec-dbspeople-balance-big' ;
			}
			return v ;
		} ;
		Ext.Array.each(this.cfgPeopleCalcAttributes, function(peopleCalcAttr) {
			peopleCalcColumns.push({
				_peopleCalcAttribute: peopleCalcAttr.peopleCalcAttribute,
				width: 75,
				align: 'center',
				text: peopleCalcAttr.text,
				dataIndex: 'calc_' + peopleCalcAttr.peopleCalcAttribute,
				renderer: calcAttributeRenderer,
				sortable: true
			});
			addModelFields.push({
				_peopleCalcAttribute: peopleCalcAttr.peopleCalcAttribute,
				name: 'calc_' + peopleCalcAttr.peopleCalcAttribute,
				type: 'number',
				allowNull: true
			});
		}) ;
		if( !Ext.isEmpty(peopleCalcColumns) ) {
			columns.push({
				text: 'People Calc Attributes',
				columns: peopleCalcColumns
			}) ;
		}
		
		Ext.ux.dams.ModelManager.unregister( this.tmpModelName ) ;
		Ext.define(this.tmpModelName,{
			extend: 'DbsPeopleRhPeopleModel',
			fields: addModelFields,
			hasMany: [{
				model: 'DbsPeopleRhPeopleEventModel',
				name: 'events',
				associationKey: 'events'
			},{
				model: 'DbsPeopleRhPeopleCalcAttributeModel',
				name: 'calc_attributes',
				associationKey: 'calc_attributes'
			}]
		});
		
		var columnDefaults = {
			menuDisabled: false,
			draggable: false,
			sortable: false,
			hideable: false,
			resizable: true,
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
		
		var gridCfg = {
			xtype:'grid',
			border: false,
			store: {
				model: this.tmpModelName,
				autoLoad: true,
				_onLoadFilterChanged: true,
				proxy: this.optimaModule.getConfiguredAjaxProxy({
					extraParams : {
						_moduleId: 'spec_dbs_people',
						_action: 'RH_getGrid',
						_load_calcAttributes: 0 // UPDATE 2014-09 : fetch calcAttributes
					},
					reader: {
						type: 'json',
						rootProperty: 'data'
					}
				}),
				sorters: [{
					property: 'people_name',
					direction: 'ASC'
				}],
				listeners: {
					beforeload: me.onBeforeLoad,
					load: me.onLoad,
					groupchange: me.onGridGroupChange,
					scope: me
				}
			},
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
							if( Ext.isEmpty(values.rows[0].data[values.groupField]) ) {
								return 'Non défini' ;
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
				},
				itemclick: this.onItemClick,
				scope: this
			},
			viewConfig: {
				preserveScrollOnRefresh: true,
				getRowClass: function(record) {
					if( record.get('status_undefined') ) {
						return 'op5-spec-dbspeople-rhcolor-undefined' ;
					}
					if( record.get('status_out') ) {
						return 'op5-spec-dbspeople-rhcolor-out' ;
					}
				}
			}
		} ;
		
		gridCnt.removeCls('op5-waiting') ;
		gridCnt.removeAll() ;
		gridCnt.add( gridCfg ) ;
	},
	onColumnsMenuCreate: function( headerCt, menu ) {
		var me = this;
		
		menu.add({
			itemId: 'grid-groupby',
			icon: 'images/op5img/ico_groupby_16.png',
			text: 'Group By',
			handler: function(menuitem) {
				this.onColumnGroupBy( menuitem.up('menu').activeHeader._groupBy ) ;
			},
			scope: this
		},{
			itemId: 'grid-cleargroups',
			icon: 'images/op5img/ico_groupclear_16.png',
			text: 'Clear Groups',
			handler: function(menuitem) {
				this.onColumnGroupBy( null ) ;
			},
			scope: this
		});
		menu.on('beforeshow', me.onColumnsMenuBeforeShow, me);
	},
	onColumnsMenuBeforeShow: function( menu ) {
		var me = this,
			HelperCache = Optima5.Modules.Spec.DbsPeople.HelperCache,
			colCfg = menu.activeHeader.colCfg;
		menu.down('#grid-groupby').setVisible( !Ext.isEmpty(menu.activeHeader._groupBy) ) ;
	},
	
	reloadPeople: function( peopleCode ) {
		this.optimaModule.getConfiguredAjaxConnection().request({
			timeout: (300 * 1000),
			params: {
				_moduleId: 'spec_dbs_people',
				_action: 'RH_getGrid',
				filter_peopleCode: peopleCode
			},
			success: function( response ) {
				var json = Ext.JSON.decode(response.responseText) ;
				if( json.success && json.data && json.data.length==1 ) {
					var peopleRow = json.data[0],
						peopleRecord = Ext.ux.dams.ModelManager.create(this.tmpModelName,peopleRow),
						peopleCode = peopleRecord.getId() ;
					
					var existingRecord = this.down('grid').getStore().getById(peopleCode) ;
					if( existingRecord ) {
						existingRecord.set(peopleRecord.getData()) ;
					} else {
						this.down('grid').getStore().add(peopleRecord) ;
					}
				}
			},
			scope: this
		});
	},
	
	reload: function(filterChanged,doFetchCalc) {
		if( !this.isReady ) {
			return ;
		}
		this.down('grid').getStore()._onLoadFilterChanged = filterChanged ;
		this.down('grid').getStore()._onLoadDoFetchCalc = doFetchCalc ;
		this.down('grid').getStore().load() ;
	},
	onBeforeLoad: function(store,options) {
		if( this.asyncConnectionForCalcAttributes ) {
			this.asyncConnectionForCalcAttributes.abort() ;
		}
		
		var filterSiteBtn = this.down('#btnSite'),
			filterTeamBtn = this.down('#btnTeam') ;
		var chkPeopleHidden = this.down('#btnFilters').down('#chkPeopleHidden'),
			displayPeopleHidden = chkPeopleHidden.getValue() ;
		
		var addParams = {} ;
		if( filterSiteBtn.getNode() != null ) {
			addParams['filter_site_entries'] = Ext.JSON.encode( filterSiteBtn.getLeafNodesKey() ) ;
		}
		if( filterSiteBtn.getNode() != null ) {
			addParams['filter_team_entries'] = Ext.JSON.encode( filterTeamBtn.getLeafNodesKey() ) ;
		}
		if( !displayPeopleHidden ) {
			addParams['filter_peopleOff'] = 1 ;
		}
		options.setParams(addParams) ;
	},
	onLoad: function(store) {
		var grid = this.down('grid') ;
			store = grid.getStore(),
			filter_site = this.down('#btnSite').getNode(),
			filter_team = this.down('#btnTeam').getNode() ;
			
		// Rearrange visibility + groups
		grid.headerCt.down('[dataIndex="whse_txt"]')._alwaysHidden = (filter_site && filter_site.leaf_only) ;
		grid.headerCt.down('[dataIndex="team_txt"]')._alwaysHidden = (filter_team && filter_team.leaf_only) ;
		if( store._onLoadFilterChanged ) {
			if( filter_site==null || !filter_site.leaf_only ) {
				store.group( 'whse_code', 'ASC' ) ;
			} else if( filter_team==null || !filter_team.leaf_only ) {
				store.group( 'team_code', 'ASC' ) ;
			} else {
				store.clearGrouping() ;
			}
		}
		if( store._onLoadDoFetchCalc ) {
			this.fetchCalcAttributes() ;
		}
		store._onLoadFilterChanged = false ;
		store._onLoadDoFetchCalc = false ;
		this.applyFilters() ;
	},
	onColumnGroupBy: function( groupField ) {
		var grid = this.down('grid'),
			store = grid.getStore() ;
		if( groupField == null ) {
			store.clearGrouping() ;
		} else {
			store.group( groupField, 'ASC' ) ;
		}
	},
	onGridGroupChange: function( gridStore, grouper ) {
		var grid = this.down('grid'),
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
	
	applyFilters: function() {
		var gridPanel = this.down('#mRhGridContainer').down('grid') ;
		var gridStore = gridPanel.getStore() ;
		gridStore.clearFilter() ;
		
		var btnFilters = this.down('#btnFilters') ;
		
		var btnSearch = this.down('#btnFilters').down('#txtSearch') ;
		var btnSearchTxt = btnSearch.getValue().toLowerCase() ;
		if( !Ext.isEmpty(btnSearchTxt) ) {
			btnFilters.setText( btnFilters.textOrig + ' : ' + '<b>'+btnSearchTxt+'</b>' ) ;
			
			gridStore.filter({
				property: 'people_name',
				operator: 'like',
				value: btnSearchTxt
			}) ;
			return ;
		}
		
		btnFilters.setText( btnFilters.textOrig ) ;
		var chkPeopleHidden = this.down('#btnFilters').down('#chkPeopleHidden') ;
		if( !chkPeopleHidden.getValue() ) {
			gridStore.filter({
				property: 'status_out',
				value: false
			}) ;
		}
		return ;
	},
	
	fetchCalcAttributes: function() {
		this.asyncConnectionForCalcAttributes = this.optimaModule.getConfiguredAjaxConnection() ;
		this.asyncConnectionForCalcAttributes.request({
			timeout: (300 * 1000),
			params: {
				_moduleId: 'spec_dbs_people',
				_action: 'RH_getGrid',
				_load_calcAttributes: 1
			},
			success: function( response ) {
				var json = Ext.JSON.decode(response.responseText) ;
				if( json.success ) {
					this.onLoadCalcAttributes(json.data) ;
				}
			},
			scope: this
		});
	},
	onLoadCalcAttributes: function(ajaxData) {
		var grid = this.down('grid') ;
			gridStore = grid.getStore() ;
			
		var altStore = Ext.create('Ext.data.Store',{
			model: this.tmpModelName,
			data: ajaxData,
			proxy: {
				type: 'memory'
			}
		}) ;
			
		gridStore.suspendEvents(true);
		var map_peopleCalcAttribute_fieldName = {};
		Ext.Array.each( gridStore.model.getFields(), function(field) {
			if( field._peopleCalcAttribute != null ) {
				map_peopleCalcAttribute_fieldName[field._peopleCalcAttribute] = field.name ;
			}
		}) ;
		gridStore.each( function(record) {
			var recordCalcAttributesStore = record.calc_attributes() ;
			recordCalcAttributesStore.removeAll() ;
			
			// Get altRecord in altStore
			var altRecord = altStore.getById(record.getId()) ;
			if( !altRecord ) {
				return ;
			}
			
			var peopleCalcAttribute, fieldName ;
			for( peopleCalcAttribute in map_peopleCalcAttribute_fieldName ) {
				fieldName = map_peopleCalcAttribute_fieldName[peopleCalcAttribute] ;
				peopleCalcRecord = altRecord.calc_attributes().findRecord('people_calc_attribute',peopleCalcAttribute) ;
				
				if( peopleCalcRecord == null ) {
					continue ;
				}
				record.set(fieldName,peopleCalcRecord.get('calc_value')) ;
				recordCalcAttributesStore.add( peopleCalcRecord ) ;
			}
			record.commit() ;
		});
		gridStore.resumeEvents() ;
	},
	
	onNewPeople: function() {
		var newPeopleRecord = Ext.ux.dams.ModelManager.create('DbsPeopleRhPeopleModel',{_is_new:true}) ;
		this.setFormRecord(newPeopleRecord) ;
	},
	onItemClick: function( view, record, itemNode, index, e ) {
		var cellNode = e.getTarget( view.getCellSelector() ),
			cellColumn = view.getHeaderByCell( cellNode ) ;
		if( !Ext.isEmpty(cellColumn._peopleCalcAttribute) ) {
			this.setCalcDetails( record, cellColumn._peopleCalcAttribute ) ;
			return ;
		}
		
		this.loadFormRecord(record.getId()) ;
	},
	
	loadFormRecord: function( peopleCode ) {
		this.getEl().mask('Loading record...') ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_people',
				_action: 'RH_getGrid',
				_load_events: 1,
				filter_peopleCode: peopleCode
			},
			callback: function() {
				this.getEl().unmask() ;
			},
			success: function( response ) {
				var json = Ext.JSON.decode(response.responseText),
					peopleRecordData = (json.success ? json.data[0] : null) ;
				if( peopleRecordData ) {
					var peopleRecord = Ext.ux.dams.ModelManager.create(this.tmpModelName,peopleRecordData);
					this.setFormRecord( peopleRecord ) ;
				}
			},
			scope: this
		});
	},
	setFormRecord: function(peopleRecord) {
		var me = this,
			eastpanel = me.getComponent('mRhFormContainer') ;
		if( peopleRecord == null ) {
			eastpanel._empty = true ;
			eastpanel.collapse() ;
			eastpanel.removeAll() ;
			return ;
		}
		
		var title ;
		if( peopleRecord.get('_is_new') ) {
			title = 'Création People' ;
		} else {
			title = 'Modification: '+peopleRecord.get('people_name') ;
		}
		
		eastpanel.removeAll();
		eastpanel.add(Ext.create('Optima5.Modules.Spec.DbsPeople.RhFormPanel',{
			border: false,
			optimaModule: me.optimaModule,
			peopleRecord: peopleRecord,
			listeners: {
				saved: function(rhFormPanel,peopleCode) {
					this.setFormRecord(null);
					if( peopleCode ) {
						this.reloadPeople(peopleCode) ;
					}
				},
				scope:me
			}
		}));
		eastpanel._empty = false ;
		eastpanel.setTitle(title) ;
		eastpanel.expand() ;
	},
	
	setCalcDetails: function( peopleRecord, activePeopleCalcAttribute ) {
		var me = this,
			eastpanel = me.getComponent('mRhFormContainer') ;
		if( peopleRecord == null || peopleRecord.calc_attributes().count() == 0 ) {
			eastpanel._empty = true ;
			eastpanel.collapse() ;
			eastpanel.removeAll() ;
			return ;
		}
		
		var title = 'Compteurs' ;
		
		eastpanel.removeAll();
		eastpanel.add(Ext.create('Optima5.Modules.Spec.DbsPeople.RhCalcAttributesPanel',{
			border: false,
			optimaModule: me.optimaModule,
			cfgPeopleCalcAttributes: me.cfgPeopleCalcAttributes,
			peopleRecord: peopleRecord,
			activePeopleCalcAttribute: activePeopleCalcAttribute
		}));
		eastpanel._empty = false ;
		eastpanel.setTitle(title) ;
		eastpanel.expand() ;
	},
	
	handleQuit: function() {
		var eastpanel = this.getComponent('mRhFormContainer'),
			eastpanelItem = eastpanel.items.getAt(0) ;
		if( eastpanel.collapsed || Ext.getClassName(eastpanelItem) != 'Optima5.Modules.Spec.DbsPeople.RhFormPanel' ) {
			this.doQuit() ;
			return ;
		}
		Ext.MessageBox.confirm('Confirmation','Edition profil people non terminée. Quitter ?', function(buttonStr) {
			if( buttonStr!='yes' ) {
				return ;
			}
			this.doQuit() ;
		}, this);
	},
	doQuit: function() {
		this.destroy() ;
	},
	onDestroy: function() {
		if( this.asyncConnectionForCalcAttributes ) {
			this.asyncConnectionForCalcAttributes.abort() ;
		}
	},
	
	
	openRhAttributesValuesSetupPopup: function() {
		var me = this,
			filterBtn_site = this.down('#btnSite'),
			filter_whses = ( filterBtn_site.getNode()==null ? null : filterBtn_site.getLeafNodesKey() ) ;
		
		var rhAttributesValueSetupPanel = Ext.create('Optima5.Modules.Spec.DbsPeople.RhAttributesValuesSetupPanel',{
			width:800, // dummy initial size, for border layout to work
			height:600, // ...
			floating: true,
			draggable: true,
			renderTo: me.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.doQuit();
				},
				scope: this
			}],
			
			optimaModule: me.optimaModule,
			cfgData: {
				filter_site: (filter_whses ? filterBtn_site.getValue() : null)
			}
		});
		
		// Size + position
		rhAttributesValueSetupPanel.setSize({
			width: Math.min(800,me.getWidth()-50),
			height: Math.min(600,me.getHeight()-50)
		}) ;
		rhAttributesValueSetupPanel.on('destroy',function(rhAttributesValueSetupPanel) {
			me.getEl().unmask() ;
			this.floatingPanel = null ;
			
			this.reload() ;
		},me,{single:true}) ;
		me.getEl().mask() ;
		
		rhAttributesValueSetupPanel.show();
		rhAttributesValueSetupPanel.getEl().alignTo(this.getEl(), 'c-c?');
		
		me.floatingPanel = rhAttributesValueSetupPanel ;
	}
});
