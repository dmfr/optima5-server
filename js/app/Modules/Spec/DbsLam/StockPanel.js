Ext.define('DbsLamStockTreeModel',{
	extend: 'Ext.data.Model',
	idProperty: 'treenode_key',
	fields: [
		{name: 'treenode_key', type:'string'},
		{name: 'field_ROW_ID', type:'string'},
		{name: 'field_POS_ZONE', type:'string'},
		{name: 'field_POS_ROW', type:'string'}
	]
});

Ext.define('DbsLamStockGridModel',{
	extend: 'Ext.data.Model',
	idProperty: 'id',
	fields: [
		{name: 'id', type:'string'},
		{name: 'stk_filerecord_id', type:'int'},
		{name: 'status', type:'boolean'},
		{name: 'adr_id', type:'string', useNull:true},
		{name: 'pos_zone', type:'string'},
		{name: 'pos_row', type:'string'},
		{name: 'pos_bay', type:'string'},
		{name: 'pos_level', type:'string'},
		{name: 'pos_bin', type:'string'},
		{name: 'inv_id', type:'int', useNull:true},
		{name: 'inv_prod', type:'string'},
		{name: 'inv_batch', type:'string'},
		{name: 'inv_datelc', type:'date', dateFormat: 'Y-m-d'},
		{name: 'inv_qty', type:'number', useNull:true},
		{name: 'inv_qty_prein', type:'number', useNull:true},
		{name: 'inv_qty_out', type:'number', useNull:true},
		{name: 'inv_sn', type:'string'},
		{name: 'inv_container', type:'string'},
		{name: 'warn_is_on', type:'boolean'},
		{name: 'warn_is_locked', type:'boolean'},
		{name: 'warn_txt', type:'string'},
		{name: 'container_is_on', type:'boolean'},
		{name: 'container_types', type:'auto'},
		{name: 'container_is_picking', type:'boolean'}
	]
});

Ext.define('Optima5.Modules.Spec.DbsLam.StockPanel',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Optima5.Modules.Spec.DbsLam.CfgParamButton',
		'Optima5.Modules.Spec.DbsLam.StockAdrForm',
		'Optima5.Modules.Spec.DbsLam.StockInvForm'
	],
	
	_popupMode: false,
	_enableDD: false,
	whseCode: null,
	
	initComponent: function() {
		this.tmpGridModelName = 'DbsLamStockGridModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpGridModelName ) ;
		}) ;
		
		Ext.apply(this, {
			layout: 'border',
			items: [{
				flex: 3,
				region: 'center',
				itemId: 'pCenter',
				border: false,
				xtype: 'panel',
				layout: {
					type: 'hbox',
					align: 'stretch'
				},
				tbar:[{
					hidden: this._popupMode,
					icon: 'images/op5img/ico_back_16.gif',
					text: '<u>Back</u>',
					handler: function(){
						this.doQuit() ;
					},
					scope: this
				},'-',Ext.create('Optima5.Modules.Spec.DbsLam.CfgParamButton',{
					cfgParam_id: 'WHSE',
					icon: 'images/op5img/ico_blocs_small.gif',
					text: 'Sites / Warehouses',
					itemId: 'btnWhse',
					btnReadOnly: this._popupMode,
					optimaModule: this.optimaModule,
					listeners: {
						change: {
							fn: function() {
								this.onWhseSet() ;
							},
							scope: this
						},
						ready: {
							fn: function() {
								
							},
							scope: this
						}
					}
				}),{
					xtype: 'tbseparator',
					_visibleIfWhse: true
				},{
					_visibleIfWhse: true,
					//iconCls: 'op5-spec-dbsembramach-report-clock',
					itemId: 'tbViewmode',
					viewConfig: {forceFit: true},
					menu: {
						defaults: {
							handler:function(menuitem) {
								//console.log('ch view '+menuitem.itemId) ;
								this.onViewSelect( menuitem.itemId ) ;
							},
							scope:this
						},
						items: [{
							itemId: 'status_all',
							text: 'All locations',
							iconCls: 'op5-spec-dbslam-stock-status-all'
						},{
							itemId: 'status_active',
							text: 'Active locations',
							iconCls: 'op5-spec-dbslam-stock-status-active'
						},{
							itemId: 'status_stock',
							text: 'Occupied locations',
							iconCls: 'op5-spec-dbslam-stock-status-stock'
						}]
					}
				},{
					xtype: 'tbseparator',
					_visibleIfWhse: true
				},{
					icon: 'images/op5img/ico_loupe_16.png',
					_visibleIfWhse: true
				},{
					_visibleIfWhse: true,
					xtype: 'textfield',
					itemId: 'btnSearch',
					width: 150,
					forceSelection:false,
					allowBlank:true,
					editable:true,
					typeAhead:true,
					queryMode: 'remote',
					displayField: 'search_txt',
					valueField: 'search_txt',
					queryParam: 'filter_searchTxt',
					minChars: 2,
					triggers: {
						clear: {
							cls: Ext.baseCSSPrefix + 'form-clear-trigger',
							handler: function(field) {
								field.reset() ;
							}
						}
					},
					store: {
						fields: ['search_txt'],
						proxy: this.optimaModule.getConfiguredAjaxProxy({
							extraParams : {
								_moduleId: 'spec_dbs_tracy',
								_action: 'hat_searchSuggest',
								limit: 20
							},
							reader: {
								type: 'json',
								rootProperty: 'data'
							}
						}),
						listeners: {
							beforeload: function(store,options) {
								return false ; // HACK to disable remote loading
								
								var params = options.getParams() ;
								Ext.apply(params,{
									filter_socCode: socCode
								}) ;
								options.setParams(params) ;
							},
							scope: this
						}
					},
					enableKeyEvents: true,
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
								this.onSearchChange() ;
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
				}]
			},{
				region: 'east',
				itemId: 'pEast',
				flex: 2,
				xtype: 'panel',
				layout: 'fit',
				hidden: true,
				collapsible:true,
				titleCollapse: false,
				_empty:true,
				tools: [{
					type: 'close',
					handler: function(e, t, p) {
						this.handleEastDestroy() ;
					},
					scope: this
				}],
				listeners:{
					
				}
			}]
		});
		this.callParent() ;
		this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
		this.on('beforedeactivate', function() {
			// HACK !!!
			if( !this.down('#pGrid') ) {
				return ;
			}
			if( this.down('#pGrid').getStore().loading || this.down('#pGrid').getView().isRefreshing ) {
				return false ;
			}
		},this) ;
		
		if( false ) {
			this.down('toolbar').setVisible(false) ;
		}
		
		this.doConfigure() ;
		this.doSetDefaults() ;
	},
	
	doSetDefaults: function() {
		this.onViewSelect('status_active') ;
		
		//search for single "STOCK" warehouse ( != WORK warehouse )
		var stockWhses = [] ;
		Ext.Array.each( Optima5.Modules.Spec.DbsLam.HelperCache.getWhseAll(), function( whseRow ) {
			if( whseRow.is_stock ) {
				stockWhses.push( whseRow.whse_code ) ;
			}
		}) ;
		if( stockWhses.length==1 ) {
			var stockWhseCode = stockWhses[0] ;
			var btnWhse = this.down('toolbar').down('#btnWhse') ;
			btnWhse.setValue(stockWhseCode) ;
		}
	},
	onWhseSet: function() {
		var filterSiteBtn = this.down('#btnWhse') ;
		if( !Ext.isEmpty(filterSiteBtn.getValue()) ) {
			this.whseCode = filterSiteBtn.getValue() ;
		} else {
			this.whseCode = null ;
		}
		
		this.doConfigure() ;
	},
	onViewSelect: function(viewId) {
		var tbViewmode = this.down('#tbViewmode') ;
		if( viewId==null && tbViewmode.tbViewmodeItemId ) {
			viewId = tbViewmode.tbViewmodeItemId ;
		}
			
		var tbViewmode = this.down('#tbViewmode'),
			tbViewmodeItem = tbViewmode.menu.getComponent(viewId),
			iconCls, text ;
		if( !tbViewmodeItem ) {
			return ;
		}
		tbViewmode.tbViewmodeItemId = viewId ;
		// View mode
		var tbViewmodeItem = tbViewmode.menu.getComponent(viewId) ;
		if( tbViewmodeItem ) {
			tbViewmode.setText( '<b>' + tbViewmodeItem.text + '</b>' );
			tbViewmode.setIconCls( tbViewmodeItem.iconCls );
		}
		
		this.applyViewFilter() ;
	},
	applyViewFilter: function() {
		var tbViewmode = this.down('#tbViewmode'),
			viewId ;
		if(tbViewmode.tbViewmodeItemId ) {
			viewId = tbViewmode.tbViewmodeItemId ;
		}
		if( Ext.isEmpty(viewId) ) {
			return ;
		}
		
		// filters ?
		var doFilterActive = Ext.Array.contains(['status_active','status_stock'],viewId),
			doFilterStock = Ext.Array.contains(['status_stock'],viewId),
			onSearchMode = false ;
		if( onSearchMode ) {
			doFilterActive = false ;
			doFilterStock = false ;
		}
		
		if( !this.down('#pGrid') ) {
			// no grid has been initialized yet ! stop
			return ;
		}
		
		// apply filters
		var gridStore = this.down('#pGrid').getStore() ;
		if( doFilterActive ) {
			gridStore.filter({
				property: 'status',
				operator: '!=',
				value: false
			}) ;
		} else {
			gridStore.removeFilter('status') ;
		}
		if( doFilterStock ) {
			gridStore.filter({
				property: 'stk_filerecord_id',
				operator: '>',
				value: 0
			}) ;
		} else {
			gridStore.removeFilter('stk_filerecord_id') ;
		}
		/*
		this.configureToolbar() ;
		this.configureViews() ;
		
		this.doLoad(true) ;
		*/
	},
	onSearchChange: function() {
		var btnSearch = this.down('#btnSearch') ;
		var btnSearchTxt = btnSearch.getValue().toLowerCase() ;
		
		var gridPanel = this.down('#pGrid') ;
		gridPanel.filters.clearFilters() ;
		var gridStore = this.down('#pGrid').getStore() ;
		gridStore.clearFilter() ;
		
		
		if( Ext.isEmpty(btnSearchTxt) ) {
			this.onViewSelect(null) ;
			return ;
		}
		
		// visible fields if the grid header
		var visibleDataIndexes = [] ;
		Ext.Array.each( gridPanel.getVisibleColumns(), function( gridCol ) {
			if( !Ext.isEmpty(gridCol.dataIndex) ) {
				visibleDataIndexes.push( gridCol.dataIndex ) ;
			}
		}) ;
		
		// do filtering with a custom function
		gridStore.filterBy( function(record) {
			// For each record, iterate over the FIELDS, and for each field "string compare" to btnSearchTxt
			var isItAMatch = false ;
			Ext.Array.each( visibleDataIndexes, function( dataIndex ) {
				var recordFieldValue = record.get(dataIndex) ;
				if( !Ext.isString(recordFieldValue) ) {
					return ;
				}
				if( recordFieldValue.toLowerCase().indexOf(btnSearchTxt) != -1 ) {
					// not equal to -1 => found !
					isItAMatch = true ;
				}
			}) ;
			return isItAMatch ;
		}) ;
	},
	
	doConfigure: function() {
		var pCenter = this.down('#pCenter') ;
		
		// Toolbar
		var tb = pCenter.down('toolbar') ;
		var hasWhse = !!this.whseCode ;
		tb.items.each( function(tbItem) {
			if( tbItem._visibleIfWhse ) {
				// hide or show
				tbItem.setVisible( hasWhse ) ;
			}
		}) ;
		
		
		if( !this.whseCode ) {
			pCenter.removeAll() ;
			pCenter.add({xtype:'component',cls: 'ux-noframe-bg', flex:1}) ;
			return ;
		}
		
		
		
		var pushModelfields = [], atrAdrColumns = [], atrStockColumns = [] ;
		Ext.Array.each( Optima5.Modules.Spec.DbsLam.HelperCache.getAttributeAll(), function( attribute ) {
			if( attribute.ADR_fieldcode ) {
				var fieldColumn = {
					locked: true,
					text: attribute.atr_txt,
					dataIndex: 'ADR_'+attribute.mkey,
					width: 75
				} ;
				atrAdrColumns.push(fieldColumn) ;
			}
			if( attribute.STOCK_fieldcode ) {
				var fieldColumn = {
					locked: true,
					text: attribute.atr_txt,
					dataIndex: 'STOCK_'+attribute.mkey,
					width: 75
				} ;
				atrStockColumns.push(fieldColumn) ;
			}
			
			pushModelfields.push({
				name: attribute.mkey,
				type: 'string'
			});
		}) ;
		
		Ext.ux.dams.ModelManager.unregister( this.tmpGridModelName ) ;
		Ext.define(this.tmpGridModelName, {
			extend: 'DbsLamStockGridModel',
			fields: pushModelfields
		});
		
		var treepanelCfg = {
			border: 1,
			width: 240,
			xtype: 'treepanel',
			itemId: 'pTree',
			store: {
				model: 'DbsLamStockTreeModel',
				root:{
					iconCls:'task-folder',
					expanded:true,
					treenode_key:'&',
					field_ROW_ID: 'Warehouse zones'
				},
				proxy: this.optimaModule.getConfiguredAjaxProxy({
					extraParams : {
						_action: 'data_getBibleTree',
						bible_code: 'ADR'
					}
				}),
				listeners: {
					load: function(store) {
						if( store.getNodeById(this.whseCode) ) {
							store.setRootNode( store.getNodeById(this.whseCode).copy(undefined,true) ) ;
						}
					},
					scope: this
				}
			},
			collapsible: false,
			useArrows: false,
			rootVisible: true,
			multiSelect: false,
			singleExpand: false,
			columns: {
				defaults: {
					menuDisabled: true,
					draggable: false,
					sortable: false,
					hideable: false,
					resizable: false,
					groupable: false,
					lockable: false
				},
				items: [{
					xtype:'treecolumn',
					dataIndex: 'field_ROW_ID',
					text: 'ID',
					width: 200,
					renderer: function(v) {
						return '<b>'+v+'</b>';
					}
				},{
					dataIndex: 'field_POS_ZONE',
					text: 'Zone',
					width: 50
				},{
					dataIndex: 'field_POS_ROW',
					text: 'Allée',
					width: 50
				}]
			},
			listeners: {
				selectionchange: function() {
					this.doGridReload();
				},
				scope: this
			}
		};
		
		var gridpanelCfg = {
			border: false,
			flex:1,
			xtype:'gridpanel',
			itemId: 'pGrid',
			store: {
				model: this.tmpGridModelName,
				autoLoad: true,
				proxy: this.optimaModule.getConfiguredAjaxProxy({
					extraParams : {
						_moduleId: 'spec_dbs_lam',
						_action: 'stock_getGrid'
					},
					reader: {
						type: 'json',
						rootProperty: 'data'
					}
				}),
				listeners: {
					beforeload: this.onGridBeforeLoad,
					load: Ext.emptyFn,
					scope: this
				}
			},
			columns: {
				defaults: {
					menuDisabled: true,
					draggable: false,
					sortable: false,
					hideable: false,
					//resizable: false,
					groupable: false,
					lockable: false
				},
				items: [{
					text: '',
					width: 24,
					renderer: function(v,metadata,record) {
						if( Ext.isEmpty(record.get('inv_prod')) ) {
							return '-' ;
						} else {
							if( !record.get('warn_is_on') ) {
								metadata.tdCls = 'op5-spec-dbslam-stock-green' ;
							} else if( !record.get('warn_is_locked') ) {
								metadata.tdCls = 'op5-spec-dbslam-stock-orange' ;
							} else {
								metadata.tdCls = 'op5-spec-dbslam-stock-red' ;
							}
							return '' ;
						}
					}
				},{
					text: 'Location',
					columns: [{
						dataIndex: 'adr_id',
						text: 'ID',
						width: 90,
						renderer: function(v) {
							return '<b>'+v+'</b>';
						}
					},{
						dataIndex: 'container_types',
						text: 'Type(Pickng)',
						width: 90,
						renderer: function(value,metadata,record) {
							if( !record.get('container_is_on') ) {
								value = '-' ;
							}
							if( record.get('status') && record.get('container_is_on') && record.get('container_is_picking') ) {
								metadata.tdCls = 'op5-spec-dbslam-stock-blue'
							}
							if( Ext.isArray(value) ) {
								value = value.join('/') ;
							}
							return value ;
						}
					}]
				},{
					text: 'Position',
					columns: [{
						dataIndex: 'pos_bay',
						text: 'Pos.',
						width: 50
					},{
						dataIndex: 'pos_level',
						text: 'Niv.',
						width: 50
					},{
						dataIndex: 'pos_bin',
						text: 'Case',
						width: 50
					}]
				},{
					text: 'Location Attributes',
					columns: atrAdrColumns
				},{
					text: 'Stock Attributes',
					columns: atrStockColumns
				},{
					text: 'Attributs',
					columns: [{
						dataIndex: 'inv_container',
						text: 'Container',
						width: 100
					},{
						dataIndex: 'inv_prod',
						text: 'P/N',
						width: 100,
						filter: {
							type: 'string'
						}
					},{
						hidden: false,
						dataIndex: 'inv_batch',
						text: 'BatchCode',
						width: 100
					},{
						dataIndex: 'inv_qty_prein',
						text: 'Qty PreIn',
						align: 'right',
						width: 75,
						renderer: function(v) {
							if( v<=0 ) {
								return '&#160;' ;
							}
							return v ;
						}
					},{
						dataIndex: 'inv_qty',
						text: 'Qty disp',
						align: 'right',
						width: 75
					},{
						hidden: !(this._enableDD && this._enablePartialTake),
						itemId: 'takecolumn',
						xtype: 'actioncolumn',
						align: 'center',
						width: 36,
						items: [{
							icon: 'images/op5img/ico_dataadd_16.gif',  // Use a URL in the icon config
							tooltip: 'Take',
							isDisabled: function(view,rowIndex,colIndex,item,record ) {
								if( Ext.isEmpty(record.get('inv_qty')) || record.get('inv_qty') <= 0 ) {
									return true ;
								}
								return false
							},
							handler: function(grid, rowIndex, colIndex) {
								var record = grid.getStore().getAt(rowIndex);
								if( Ext.isEmpty(record.get('inv_qty')) || record.get('inv_qty') <= 0 ) {
									return ;
								}
								this.handlePartialTake( record ) ;
							},
							scope: this
						}]
					},{
						dataIndex: 'inv_qty_out',
						text: 'Qty out',
						align: 'right',
						width: 75,
						renderer: function(v) {
							if( v<=0 ) {
								return '&#160;' ;
							}
							return v ;
						}
					},{
						hidden: false,
						xtype: 'datecolumn',
						format: 'Y-m-d',
						dataIndex: 'inv_datelc',
						text: 'DateLC',
						width: 100
					},{
						hidden: true,
						dataIndex: 'inv_sn',
						text: 'Serial',
						width: 100
					}]
				}]
			},
			plugins: [{
				ptype: 'bufferedrenderer',
				pluginId: 'bufferedRenderer',
				synchronousRender: true
			},{
				ptype: 'uxgridfilters',
				pluginId: 'filters'
			}],
			viewConfig: {
				enableTextSelection: true,
				preserveScrollOnRefresh: true,
				getRowClass: function(record) {
					/*
					var view = this,
						selModel = view.getSelectionModel(),
						selRecords = selModel.getSelection() ;
					var selected = ( selRecords && Ext.Array.contains(selRecords,record) ) ;
					*/
					if( record.get('inv_qty_out') > 0 && record.get('inv_qty') == 0 ) {
						return 'op5-spec-dbslam-stock-out' ;
					}
					if( !record.get('status_is_active') ) {
						return 'op5-spec-dbslam-stock-disabled' ;
					}
				},
				listeners: {
					beforerefresh: function(view) {
						view.isRefreshing = true ;
					},
					refresh: function(view) {
						view.isRefreshing = false ;
					}
				}
			},
			listeners: {
				itemcontextmenu: this.onItemContextMenu,
				scope: this
			}
		};
		if( this._enableDD ) {
			Ext.apply(gridpanelCfg,{
				selModel: {
					mode: 'MULTI'
				}
			});
			Ext.apply(gridpanelCfg.viewConfig,{
				plugins: {
					ddGroup : (Ext.isString(this._enableDD) ? this._enableDD : 'DbsLamStockDD'),
					ptype: 'gridviewdragdrop'
				}
			});
		}
		if( true ) {
			Ext.apply(gridpanelCfg,{
				selModel: {
					mode: 'MULTI'
				}
			});
		}
		
		pCenter.removeAll() ;
		pCenter.add(treepanelCfg,gridpanelCfg) ;
		
		this.applyViewFilter() ;
	},
	
	
	onCrmeventBroadcast: function(crmEvent, eventParams) {
		switch( crmEvent ) {
			case 'datachange' :
				this.onDataChange() ;
				break ;
			default: break ;
		}
	},
	onDataChange: function() {
		if( this.isVisible() ) {
			this.doGridReload() ;
		} else {
			this.on('activate',function(){this.onDataChange();}, this, {single:true}) ;
		}
	},
	
	doGridReload: function() {
		var gridpanel = this.down('#pCenter').down('#pGrid') ;
		gridpanel.getStore().load() ;
	},
	onGridBeforeLoad: function(store,options) {
		var treepanel = this.down('#pCenter').down('#pTree') ;
			selectedNodes = treepanel.getView().getSelectionModel().getSelection() ;
		var params = {} ;
		
		Ext.apply(params,{
			whse_code: this.whseCode
		}) ;
		
		if( selectedNodes.length == 1 && !(selectedNodes[0].isRoot()) ) {
			Ext.apply(params,{
				filter_treenodeKey: selectedNodes[0].getId()
			}) ;
		}
		
		options.setParams(params) ;
	},
	
	
	onItemContextMenu: function(view, record, item, index, event) {
		var selRecords = view.getSelectionModel().getSelection();
		
		var gridContextMenuItems = new Array() ;
		if( selRecords.length==0 ) {
			return ;
		} else if( selRecords.length==1 ) {
			var selRecord = selRecords[0] ;
			
			gridContextMenuItems.push({
				iconCls: 'op5-spec-dbslam-stock-status-all',
				text: 'Modify location <b>'+selRecord.get('adr_id')+'</b>',
				handler : function() {
					this.handleOpenEastAdr( [selRecord.get('adr_id')] ) ;
				},
				scope : this
			});
			
			if( selRecord.get('stk_filerecord_id') > 0 ) {
				var title,
					adrId = selRecord.get('adr_id'),
					stkFilerecordId = selRecord.get('stk_filerecord_id') ;
				if( selRecord.get('stk_filerecord_id') == 0 ) {
					title = 'Append stock to <b>'+adrId+'</b>' ;
				} else {
					title = 'Modify stock at <b>'+adrId+'</b>' ;
				}
				gridContextMenuItems.push({
					iconCls: 'op5-spec-dbslam-stock-status-stock',
					text: title,
					handler : function() {
						this.handleOpenEastInv( adrId, stkFilerecordId||null ) ;
					},
					scope : this
				});
				
				gridContextMenuItems.push({
					icon: 'images/op5img/ico_print_16.png',
					text: 'Print label(s) ZPL',
					itemIdPrintLabels: true,
					handler: function() {
						this.handlePrintStock([stkFilerecordId]) ;
					},
					scope: this
				});
			}
			
			gridContextMenuItems.push('-') ;
			
			
			var logMenuItems = [],
				adrId = selRecord.get('adr_id'),
				invContainer = selRecord.get('inv_container'),
				invProd = selRecord.get('inv_prod') ;
			if( !Ext.isEmpty(invContainer) ) {
				logMenuItems.push({
					_log_filter_property: 'container_ref',
					_log_filter_value: invContainer,
					text: 'container : <b>'+invContainer+'</b>'
				}) ;
			}
			if( !Ext.isEmpty(invProd) ) {
				logMenuItems.push({
					_log_filter_property: 'prod_id',
					_log_filter_value: invProd,
					text: 'P/N : <b>'+invProd+'</b>'
				}) ;
			}
			if( !Ext.isEmpty(adrId) ) {
				logMenuItems.push({
					_log_filter_property: 'adr_id',
					_log_filter_value: adrId,
					text: 'location : <b>'+adrId+'</b>'
				}) ;
			}
			gridContextMenuItems.push({
				iconCls: 'op5-spec-dbslam-stock-logs',
				text: 'Movements log',
				menu: {
					defaults: {
						handler: function(menuitem) {
							this.optimaModule.postCrmEvent('openstocklog',{
								log_filter_property: menuitem._log_filter_property,
								log_filter_value: menuitem._log_filter_value
							}) ;
						},
						scope: this
					},
					items: logMenuItems
				},
				scope : this
			});
		} else {
			var arrAdrIds = [] ;
			Ext.Array.each(selRecords, function(selRecord){arrAdrIds.push(selRecord.get('adr_id'))}) ;
			
			gridContextMenuItems.push({
				icon: 'images/op5img/ico_blocs_small.gif',
				text: 'Modify <b>'+arrAdrIds.length+'</b> locations',
				handler : function() {
					this.handleOpenEastAdr( arrAdrIds ) ;
				},
				scope : this
			});
		}
		
		var gridContextMenu = Ext.create('Ext.menu.Menu',{
			items : gridContextMenuItems,
			listeners: {
				hide: function(menu) {
					Ext.defer(function(){menu.destroy();},10) ;
				}
			}
		}) ;
		
		gridContextMenu.showAt(event.getXY());
	},
	
	
	handlePartialTake: function( gridRecord ) {
		
		var me = this ;
		var popupPanel = Ext.create('Ext.form.Panel',{
			optimaModule: this.optimaModule,
			
			width:400,
			height:300,
			
			cls: 'ux-noframe-bg',
			
			stockFilerecordId: gridRecord.get('stk_filerecord_id'),
			
			floating: true,
			renderTo: me.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				}
			}],
			
			xtype: 'form',
			border: false,
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 8,
			layout:'anchor',
			fieldDefaults: {
				labelWidth: 125,
				anchor: '100%'
			},
			items:[{
				height: 72,
				xtype: 'component',
				tpl: [
					'<div class="op5-spec-embralam-liveadr-relocatebanner">',
						'<span>{text}</span>',
					'</div>'
				],
				data: {text: '<b>Partial allocation</b><br><br>'}
			},{
				xtype: 'displayfield',
				fieldLabel: 'Address',
				value: gridRecord.get('adr_id')
			},{
				xtype: 'displayfield',
				fieldLabel: 'P/N',
				value: gridRecord.get('inv_prod')
			},{
				xtype: 'displayfield',
				fieldLabel: 'Qty avail',
				value: gridRecord.get('inv_qty')
			},{
				xtype: 'numberfield',
				name: 'mvt_qty',
				fieldLabel: '<b>'+'Alloc. qty'+'</b>',
				maxValue: gridRecord.get('inv_qty'),
				minValue: 1,
				allowBlank: false,
				anchor: '',
				width: 200
			}],
			buttons: [{
				xtype: 'button',
				text: 'Submit',
				handler:function(btn){ 
					var formPanel = btn.up('form') ;
					formPanel.doSubmitTake() ;
				},
				scope: this
			}],
			doSubmitTake: function() {
				this.fireEvent('stkalloc',this,{stk_filerecord_id:this.stockFilerecordId, mvt_qty: this.getForm().findField('mvt_qty').getValue()})
				this.destroy();
			}
		});
		
		popupPanel.on('destroy',function() {
			me.getEl().unmask() ;
		},me,{single:true}) ;
		me.getEl().mask() ;
		
		popupPanel.on('stkalloc',function(form,obj) {
			this.fireEvent('stkalloc',this,obj) ;
		},me) ;
		
		popupPanel.show();
		popupPanel.getEl().alignTo(me.getEl(), 'c-c?');
	},
	
	
	onBeforeExpandEast: function( eastpanel ) {
		return ;
	},
	handleOpenEastAdr: function( arrAdrIds ) {
		var formPanel = Ext.create('Optima5.Modules.Spec.DbsLam.StockAdrForm',{
			optimaModule: this.optimaModule,
			_cfg_arrAdrIds: arrAdrIds,
			listeners: {
				destroy: this.handleEastDestroy,
				saved: this.handleEastSaved,
				scope: this
			}
		});
		
		var title ;
		if( Ext.isEmpty(arrAdrIds) ) {
			return ;
		} else if( arrAdrIds.length==1 ) {
			title = 'Edit '+arrAdrIds[0]+' location attributes' ;
		} else {
			title = 'Edit location attributes' + ' ' + '(' + arrAdrIds.length + ')' ;
		}
		
		var pEast = this.down('#pEast') ;
		pEast.removeAll() ;
		pEast.add(formPanel) ;
		pEast.setTitle(title) ;
		pEast.show() ;
		
	},
	handleOpenEastInv: function( adrId, stkFilerecordId ) {
		var formPanel = Ext.create('Optima5.Modules.Spec.DbsLam.StockInvForm',{
			optimaModule: this.optimaModule,
			_cfg_adrId: adrId,
			_cfg_stkFilerecordId: stkFilerecordId,
			listeners: {
				destroy: this.handleEastDestroy,
				saved: this.handleEastSaved,
				scope: this
			}
		});
		
		var title ;
		if( Ext.isEmpty(stkFilerecordId) ) {
			title = 'Append stock to '+adrId ;
		} else {
			title = 'Modify stock at '+adrId ;
		}
		
		var pEast = this.down('#pEast') ;
		pEast.removeAll() ;
		pEast.add(formPanel) ;
		pEast.setTitle(title) ;
		pEast.show() ;
	},
	handleEastSaved: function() {
		this.optimaModule.postCrmEvent('datachange') ;
	},
	handleEastDestroy: function() {
		var pEast = this.down('#pEast') ;
		if( pEast && !pEast.isDestroyed ) {
			pEast.removeAll() ;
			pEast.hide() ;
		}
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
	
	handlePrintStock: function(stkFilerecordIds) {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'stock_printEtiqZpl',
				stock_filerecordIds: Ext.JSON.encode(stkFilerecordIds)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error',ajaxResponse.error) ;
					return ;
				}
				this.openPrintPopup( ajaxResponse.data ) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	openPrintPopup: function( ajaxData ) {
		var cnt_total = cnt_printable = 0 ;
		Ext.Array.each( ajaxData, function(row) {
			cnt_total++ ;
			if( row.zpl_is_on ) {
				cnt_printable++ ;
			}
		}) ;
		
		var me = this ;
		var popupPanel = Ext.create('Ext.form.Panel',{
			optimaModule: this.optimaModule,
			
			_printRows: ajaxData,
			
			width:400,
			height:250,
			
			cls: 'ux-noframe-bg',
			
			floating: true,
			renderTo: me.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				}
			}],
			
			xtype: 'form',
			border: false,
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 8,
			layout:'anchor',
			fieldDefaults: {
				labelWidth: 125,
				anchor: '100%'
			},
			listeners: {
				zplprintqz: function( zplArr, printerName ) {
					this.libZplPrint( zplArr, printerName ) ;
				},
				zplprintsys: function( zplArr, printerIp ) {
					// TODO
				},
				zpldownload: function( zplArr, zplTitle ) {
					var zplBinary = zplArr.join('') ;
					this.libZplDownload( zplBinary, zplTitle, 'text/plain' ) ;
				},
				scope: this,
			},
			items:[{
				height: 72,
				xtype: 'component',
				tpl: [
					'<div class="op5-spec-embralam-liveadr-relocatebanner">',
						'<span>{text}</span>',
					'</div>'
				],
				data: {text: '<b>Print supports</b><br><br>'}
			},{
				xtype: 'displayfield',
				fieldLabel: 'Total supports',
				fieldStyle: 'font-weight:bold',
				value: cnt_total
			},{
				xtype: 'displayfield',
				fieldLabel: 'Printable supports',
				fieldStyle: 'font-weight:bold',
				value: cnt_printable
			}],
			buttons: [{
				xtype: 'button',
				text: 'Download ZPL',
				handler:function(btn){ 
					var formPanel = btn.up('form') ;
					formPanel.doSubmitDownload() ;
				},
				scope: this
			},{
				hidden: true,
				itemId: 'btnPrintQz',
				xtype: 'button',
				text: '<b>Print to QZ</b>',
				menu: {
					defaults: {
						handler:function(btn){ 
							var printerName = btn._printerName ;
							var formPanel = btn.up('form') ;
							formPanel.doSubmitPrintQz(printerName) ;
						},
						scope: this
					},
					items: []
				}
			},{
				hidden: true,
				itemId: 'btnPrintSys',
				xtype: 'button',
				text: '<b>Print</b>',
				menu: {
					defaults: {
						handler:function(btn){ 
							var printerIp = btn._printerIp ;
							var formPanel = btn.up('form') ;
							formPanel.doSubmitPrintSystem(printerIp) ;
						},
						scope: this
					},
					items: []
				}
			}],
			getZplTitle: function() {
				return 'ZPL_'+new Date().getTime()+'.zpl' ;
			},
			getZplBinaryArr: function() {
				var binaryArr = [] ;
				Ext.Array.each( this._printRows, function(row) {
					if( row.zpl_is_on ) {
						binaryArr.push(row.zpl_binary) ;
					}
				},this) ;
				return binaryArr ;
			},
			doSubmitDownload: function() {
				var binaryArr = this.getZplBinaryArr() ;
				if( Ext.isEmpty(binaryArr) ) {
					return ;
				}
				this.fireEvent('zpldownload',binaryArr,this.getZplTitle()) ;
			},
			doSubmitPrintQz: function(printerName) {
				var binaryArr = this.getZplBinaryArr() ;
				if( Ext.isEmpty(binaryArr) ) {
					return ;
				}
				this.fireEvent('zplprintqz',binaryArr, printerName) ;
			},
			doSubmitPrintSystem: function(printerIp) {
				var binaryArr = this.getZplBinaryArr() ;
				if( Ext.isEmpty(binaryArr) ) {
					return ;
				}
				this.fireEvent('zplprintsys',binaryArr, printerIp) ;
			},
			
			queryPrintersQz: function() {
				if( typeof qz == 'undefined' ) {
					//Ext.MessageBox.alert('Error','Print system disabled') ;
					return ;
				}
				var me = this ;
				qz.websocket.disconnect() ;
				qz.websocket.connect().then(function() {
					// Pass the printer name into the next Promise
					qz.printers.find().then(function(data) {
						
						me.populatePrintersQz(data) ;
						qz.websocket.disconnect() ;
					}).catch(function(e) { 
						me.populatePrintersQz(null) ;
						qz.websocket.disconnect() ;
					})
				}).catch(function(e) { me.populatePrintersQz(null) });
			},
			populatePrintersQz: function(arrPrinters) {
				var btnPrint = this.down('#btnPrintQz') ;
				if( !arrPrinters || arrPrinters.length==0 ) {
					btnPrint.setVisible(false) ;
					btnPrint.menu.removeAll() ;
					return ;
				}
				var menuItems = [] ;
				Ext.Array.each(arrPrinters, function(printerName) {
					menuItems.push({
						icon: 'images/op5img/ico_print_16.png',
						text: printerName,
						_printerName: printerName,
					}) ;
				}) ;
				btnPrint.menu.removeAll() ;
				btnPrint.menu.add(menuItems) ;
				btnPrint.setVisible(true) ;
			},
			
			queryPrintersSystem: function() {
				this.populatePrintersSystem()
			},
			populatePrintersSystem: function() {
				var btnPrint = this.down('#btnPrintSys') ;
				var menuItems = [] ;
				Ext.Array.each(Optima5.Modules.Spec.DbsLam.HelperCache.getPrinterAll(), function(printerRow) {
					var text = printerRow.printer_ip ;
					if( printerRow.printer_desc ) {
						text+= ' - ' + printerRow.printer_desc ;
					}
					menuItems.push({
						icon: 'images/op5img/ico_print_16.png',
						text: text,
						_printerIp: printerRow.printer_ip,
					}) ;
				}) ;
				btnPrint.menu.removeAll() ;
				btnPrint.menu.add(menuItems) ;
				btnPrint.setVisible(true) ;
			}
		});
		
		popupPanel.on('destroy',function() {
			me.getEl().unmask() ;
		},me,{single:true}) ;
		me.getEl().mask() ;
		
		popupPanel.show();
		popupPanel.queryPrintersQz() ;
		popupPanel.queryPrintersSystem() ;
		popupPanel.getEl().alignTo(me.getEl(), 'c-c?');
	},
	
	
	
	
	libZplDownload: function(data, strFileName, strMimeType) {
		
		var self = window, // this script is only for browsers anyway...
			u = "application/octet-stream", // this default mime also triggers iframe downloads
			m = strMimeType || u, 
			x = data,
			D = document,
			a = D.createElement("a"),
			z = function(a){return String(a);},
			
			
			B = self.Blob || self.MozBlob || self.WebKitBlob || z,
			BB = self.MSBlobBuilder || self.WebKitBlobBuilder || self.BlobBuilder,
			fn = strFileName || "download",
			blob, 
			b,
			ua,
			fr;

		//if(typeof B.bind === 'function' ){ B=B.bind(self); }
		
		if(String(this)==="true"){ //reverse arguments, allowing download.bind(true, "text/xml", "export.xml") to act as a callback
			x=[x, m];
			m=x[0];
			x=x[1]; 
		}
		
		
		
		//go ahead and download dataURLs right away
		if(String(x).match(/^data\:[\w+\-]+\/[\w+\-]+[,;]/)){
			return navigator.msSaveBlob ?  // IE10 can't do a[download], only Blobs:
				navigator.msSaveBlob(d2b(x), fn) : 
				saver(x) ; // everyone else can save dataURLs un-processed
		}//end if dataURL passed?
		
		try{
		
			blob = x instanceof B ? 
				x : 
				new B([x], {type: m}) ;
		}catch(y){
			if(BB){
				b = new BB();
				b.append([x]);
				blob = b.getBlob(m); // the blob
			}
			
		}
		
		
		
		function d2b(u) {
			var p= u.split(/[:;,]/),
			t= p[1],
			dec= p[2] == "base64" ? atob : decodeURIComponent,
			bin= dec(p.pop()),
			mx= bin.length,
			i= 0,
			uia= new Uint8Array(mx);

			for(i;i<mx;++i) uia[i]= bin.charCodeAt(i);

			return new B([uia], {type: t});
		}
		
		function saver(url, winMode){
			
			
			if ('download' in a) { //html5 A[download] 			
				a.href = url;
				a.setAttribute("download", fn);
				a.innerHTML = "downloading...";
				D.body.appendChild(a);
				setTimeout(function() {
					a.click();
					D.body.removeChild(a);
					if(winMode===true){setTimeout(function(){ self.URL.revokeObjectURL(a.href);}, 250 );}
				}, 66);
				return true;
			}
			
			//do iframe dataURL download (old ch+FF):
			var f = D.createElement("iframe");
			D.body.appendChild(f);
			if(!winMode){ // force a mime that will download:
				url="data:"+url.replace(/^data:([\w\/\-\+]+)/, u);
			}
			
		
			f.src = url;
			setTimeout(function(){ D.body.removeChild(f); }, 333);
			
		}//end saver 
			

		if (navigator.msSaveBlob) { // IE10+ : (has Blob, but not a[download] or URL)
			return navigator.msSaveBlob(blob, fn);
		} 	
		
		if(self.URL){ // simple fast and modern way using Blob and URL:
			saver(self.URL.createObjectURL(blob), true);
		}else{
			// handle non-Blob()+non-URL browsers:
			if(typeof blob === "string" || blob.constructor===z ){
				try{
					return saver( "data:" +  m   + ";base64,"  +  self.btoa(blob)  ); 
				}catch(y){
					return saver( "data:" +  m   + "," + encodeURIComponent(blob)  ); 
				}
			}
			
			// Blob but not URL:
			fr=new FileReader();
			fr.onload=function(e){
				saver(this.result); 
			};
			fr.readAsDataURL(blob);
		}	
		return true;
	},
	libZplPrint: function(dataArr, printerName) {
		//console.log(printerName) ;
		if( typeof qz == 'undefined' ) {
			//Ext.MessageBox.alert('Error','Print system disabled') ;
			return ;
		}
		qz.websocket.connect().then(function() {
			// Pass the printer name into the next Promise
			//console.log(printerName) ;
			return qz.printers.find(printerName);
		}).then(function(printer) {
			// Create a default config for the found printer
			var config = qz.configs.create(printer);

			// Raw ZPL
			//var data = ['^XA^FO50,50^ADN,36,20^FDRAW ZPL EXAMPLE^FS^XZ'];

			qz.print(config, dataArr).then( function() {
				qz.websocket.disconnect() ;
			}) ;
		}).catch(function(e) { 
			qz.websocket.disconnect() ;
			console.error(e); 
			Ext.MessageBox.alert('Error',e) ;
		});
	},
	
	
	
	doQuit: function() {
		this.destroy() ;
	}
});
