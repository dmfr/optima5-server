Ext.define('Optima5.Modules.Spec.DbsTracy.FilesGrid',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Ext.ux.CheckColumnNull',
		'Optima5.Modules.Spec.DbsTracy.CfgParamButton',
		'Optima5.Modules.Spec.DbsTracy.CfgParamFilter',
		'Optima5.Modules.Spec.DbsTracy.OrderWarningPanel'
	],
	
	_readonlyMode: false,
	
	defaultViewMode: 'order',
	viewMode: null,
	autoRefreshDelay: (10*60*1000),
	
	initComponent: function() {
		Ext.apply(this, {
			layout: 'border',
			tbar:[{
				hidden: this._readonlyMode,
				icon: 'images/op5img/ico_back_16.gif',
				text: '<u>Back</u>',
				handler: function(){
					this.doQuit() ;
				},
				scope: this
			},'-',Ext.create('Optima5.Modules.Spec.DbsTracy.CfgParamButton',{
				cfgParam_id: 'SOC',
				icon: 'images/op5img/ico_blocs_small.gif',
				text: 'Companies / Customers',
				itemId: 'btnSoc',
				optimaModule: this.optimaModule,
				listeners: {
					change: {
						fn: function() {
							this.onSocSet() ;
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
				itemId: 'btnSearchSeparator',
				xtype: 'tbseparator'
			},{
				icon: 'images/op5img/ico_search_16.gif',
				itemId: 'btnSearchIcon',
				handler: function(btn) {
					btn.up().down('#btnSearch').reset() ;
					this.doLoad(true) ;
				},
				scope: this
			},{
				xtype: 'combobox',
				itemId: 'btnSearch',
				width: 150,
				forceSelection:true,
				allowBlank:false,
				editable:true,
				typeAhead:false,
				queryMode: 'remote',
				displayField: 'search_txt',
				valueField: 'search_txt',
				queryParam: 'filter_searchTxt',
				minChars: 2,
				checkValueOnChange: function() {}, //HACK
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
							var socCode = this.down('#btnSoc').getValue() ;
							if( Ext.isEmpty(socCode) ) {
								return false ;
							}
							
							var params = options.getParams() ;
							Ext.apply(params,{
								filter_socCode: socCode
							}) ;
							options.setParams(params) ;
						},
						scope: this
					}
				},
				listeners: {
					change: function() {
						if( this.autoRefreshTask ) {
							this.autoRefreshTask.cancel() ;
						}
					},
					select: this.onSearchSelect,
					scope: this
				}
			},'->',{
				itemId: 'tbCreate',
				icon: 'images/op5img/ico_new_16.gif',
				text:'Create file...',
				menu: {
					defaults: {
						scope:this
					},
					items: [{
						text: 'Order',
						icon: 'images/op5img/ico_new_16.gif',
						handler: function() {
							this.handleNewOrder() ;
						},
						scope: this
					},{
						text: 'Shipment group',
						iconCls: 'op5-spec-dbstracy-grid-view-ordergroup',
						handler: function() {
							this.handleNewHat() ;
						},
						scope: this
					},{
						text: 'Transport',
						icon: 'images/op5img/ico_new_16.gif',
						handler: function() {
							this.handleNewTrspt() ;
						},
						scope: this
					}]
				}
			},'-',{
				iconCls: 'op5-crmbase-datatoolbar-refresh',
				text: 'Refresh',
				handler: function() {
					this.down('#btnSearch').reset() ;
					this.doLoad(true) ;
				},
				scope: this
			},{
				//iconCls: 'op5-spec-dbsembramach-report-clock',
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
						itemId: 'order',
						text: 'Orders',
						iconCls: 'op5-spec-dbstracy-grid-view-order'
					},{
						itemId: 'order-group-trspt',
						text: 'Orders w/ Transport',
						iconCls: 'op5-spec-dbstracy-grid-view-ordergroup'
					},{
						itemId: 'trspt',
						text: 'Transport Files',
						iconCls: 'op5-spec-dbstracy-grid-view-trspt'
					},{
						xtype: 'menuseparator',
						handler: function() {}
					},{
						itemId: 'tbArchiveIsOn',
						text: 'Show archived',
						handler: function() {},
						checked: false,
						checkHandler : function() { this.doLoad(true) },
						scope: this
					}]
				}
			},'-',{
				hidden: this._readonlyMode,
				iconCls: 'op5-crmbase-datatoolbar-file-export-excel',
				text: 'Export',
				menu: {
					items: [{
						iconCls: 'op5-crmbase-datatoolbar-file-export-excel',
						text: 'Export selection',
						handler: function() {
							this.handleDownload() ;
						},
						scope: this
					},{
						iconCls: 'op5-crmbase-datatoolbar-file-export-excel',
						text: 'Export all',
						handler: function() {
							this.handleDownload(true) ;
						},
						scope: this
					}]
				}
			}],
			items: [{
				region: 'north',
				hidden: true,
				collapsible: true,
				height: 120,
				border: true,
				xtype: 'panel',
				itemId: 'pNorth',
				layout: {
					type: 'hbox',
					align: 'stretch'
				},
				items: []
			},{
				region: 'center',
				flex: 1,
				border: false,
				xtype: 'panel',
				itemId: 'pCenter',
				layout: {
					type: 'fit'
				},
				items: []
			}]
		});
		this.callParent() ;
		this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
		this.on('beforedeactivate', function() {
			// HACK !!!
			return ;
			if( this.down('gridpanel').getStore().loading || this.down('gridpanel').getView().isRefreshing ) {
				return false ;
			}
		},this) ;
		
		this.onViewSet(this.defaultViewMode) ;
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
		this.doLoad() ;
	},
	
	onViewSet: function(viewId) {
		var tbViewmode = this.child('toolbar').getComponent('tbViewmode'),
			tbViewmodeItem = tbViewmode.menu.getComponent(viewId),
			iconCls, text ;
		if( tbViewmodeItem ) {
			this.viewMode = viewId ;
		}
		// View mode
		var tbViewmodeItem = tbViewmode.menu.getComponent(this.viewMode) ;
		if( tbViewmodeItem ) {
			tbViewmode.setText( 'View :'+'&#160;'+'<b>' + tbViewmodeItem.text + '</b>' );
			tbViewmode.setIconCls( tbViewmodeItem.iconCls );
		}
		
		// Create grid ?
		if( this.autoRefreshTask ) {
			this.autoRefreshTask.cancel() ;
		}
		this.autoRefreshTask = new Ext.util.DelayedTask( function(){
			if( this.isDestroyed ) { // private check
				return ;
			}
			this.doLoad() ;
		},this);
		
		this.updateToolbar() ;
		
		var withGrouping ;
		switch( this.viewMode ) {
			case 'order' :
			case 'order-group-trspt' :
				this.doConfigureOrder(withGrouping=(this.viewMode=='order-group-trspt')) ;
				break ;
				
			case 'trspt' :
				this.doConfigureTrspt() ;
				break ;
				
			default:
				return this.doConfigureNull() ;
		}
	},
	updateToolbar: function() {
		var showSearch = true ;
		switch( this.viewMode ) {
			case 'order' :
			case 'order-group-trspt' :
				break ;
				
			default:
				showSearch = false ;
				break ;
		}
		if( Ext.isEmpty(this.down('#btnSoc').getValue()) ) {
			showSearch = false ;
		}
		if( !showSearch ) {
			this.down('#btnSearch').reset() ;
		}
		this.down('#btnSearchSeparator').setVisible(showSearch) ;
		this.down('#btnSearchIcon').setVisible(showSearch) ;
		this.down('#btnSearch').setVisible(showSearch) ;
	},
	doConfigureNull: function() {
		var pCenter = this.down('#pCenter'), pNorth = this.down('#pNorth') ;
		pNorth.setVisible(false) ;
		pNorth.removeAll() ;
		pCenter.removeAll() ;
		pCenter.add({
			xtype:'box',
			cls:'op5-waiting',
			flex:1
		});
	},
	doConfigureTrspt: function(withGrouping) {
		this.doConfigureNull() ;
		
		var prioMap = {} ;
		Ext.Array.each( Optima5.Modules.Spec.DbsTracy.HelperCache.getPriorityAll(), function(prio) {
			prioMap[prio.prio_id] = prio ;
		}) ;
		
		var stepsMap = {} ;
		Ext.Array.each( Optima5.Modules.Spec.DbsTracy.HelperCache.getOrderflowAll(), function(flow) {
			Ext.Array.each( flow.steps, function(step) {
				stepsMap[step.step_code] = step ;
			}) ;
		}) ;
		
		var consigneeMap = {} ;
		Ext.Array.each( Optima5.Modules.Spec.DbsTracy.HelperCache.getListData('LIST_CONSIGNEE'), function(r) {
			consigneeMap[r.id] = r.text ;
		}) ;
		
		var columns = [{
			text: '<b>BU</b>',
			dataIndex: 'id_soc',
			width:50,
			align: 'center'
		},{
			text: 'Type',
			dataIndex: 'atr_type',
			width:50,
			align: 'center',
			filter: {
				type: 'op5crmbasebible',
				optimaModule: this.optimaModule,
				bibleId: 'LIST_TYPE'
			}
		},{
			text: '<b>ID#</b>',
			dataIndex: 'id_doc',
			width:120,
			tdCls: 'op5-spec-dbstracy-bigcolumn',
			resizable: true,
			align: 'center',
			filter: {
				type: 'string'
			},
			renderer: function(v) {
				return '<b>'+v+'</b>';
			}
		},{
			text: 'Priority',
			dataIndex: 'atr_priority',
			width:70,
			align: 'center',
			renderer: function(v,metaData) {
				var prioMap = this._prioMap ;
				if( prioMap.hasOwnProperty(v) ) {
					var prioData = prioMap[v] ;
					return '<font color="' + prioData.prio_color + '">' + prioData.prio_code + '</font>' ;
				}
				return '?' ;
			},
			filter: {
				type: 'op5crmbasebible',
				optimaModule: this.optimaModule,
				bibleId: 'LIST_SERVICE'
			}
		},{
			text: 'Date create',
			dataIndex: 'date_create',
			renderer: function(v) {
				var str = Ext.util.Format.date(v,'d/m/Y') ;
				return str ;
			},
			filter: {
				type: 'date'
			}
		},{
			text: '<b>Current step</b>',
			dataIndex: 'calc_step',
			width: 100,
			align: 'center',
			filter: {
				type: 'op5crmbasebible',
				optimaModule: this.optimaModule,
				bibleId: 'CFG_ORDERFLOW'
			},
			renderer: function(v,m,record) {
				var stepRow = this._stepsMap[v] ;
				if( !stepRow ) {
					return ;
				}
				var tmpProgress = stepRow['status_percent'] / 100 ;
				var tmpText = stepRow['desc_txt'] ;
					var b = new Ext.ProgressBar({height: 15, cls: 'op5-spec-mrfoxy-promolist-progress'});
					if( record.get('calc_step_warning_edi') ) {
						b.addCls('op5-spec-mrfoxy-promolist-progresscolor') ;
						tmpText = 'EDI Warning' ;
						m.tdCls += ' op5-spec-dbstracy-files-ediwarning' ;
					}
					b.updateProgress(tmpProgress,tmpText);
					v = Ext.DomHelper.markup(b.getRenderTree());
					b.destroy() ;
				return v;
			}
		},{
			text: '<b>Consignee</b>',
			dataIndex: 'atr_consignee',
			width:140,
			align: 'left',
			filter: {
				type: 'op5crmbasebible',
				optimaModule: this.optimaModule,
				bibleId: 'LIST_CONSIGNEE'
			},
			renderer: function(v,metaData,record) {
				var str = '' ;
				
				//str+= '<b>' ;
				var consigneeMap = this._consigneeMap ;
				if( consigneeMap.hasOwnProperty(v) ) {
					str+= consigneeMap[v] ;
				} else {
					str+= v ;
				}
				//str+= '</b>' ;
				
				return str ;
			}
		},{
			text: 'Incoterm',
			dataIndex: 'atr_incoterm',
			width:75,
			align: 'left',
			filter: {
				type: 'op5crmbasebible',
				optimaModule: this.optimaModule,
				bibleId: 'LIST_INCOTERM'
			},
			renderer: function(v,metaData,record) {
				var str = '' ;
				
				str+= '<b>' ;
				str+= v ;
				str+= '</b>' ;
				
				return str ;
			}
		},{
			text: 'Transport',
			align: 'center',
			columns:[{
				text: 'Origin',
				dataIndex: 'mvt_origin',
				width: 60
			},{
				text: 'Dest',
				dataIndex: 'mvt_dest',
				width: 60
			},{
				text: 'Carrier',
				dataIndex: 'mvt_carrier',
				width: 120,
				filter: {
					type: 'op5crmbasebible',
					optimaModule: this.optimaModule,
					bibleId: 'LIST_CARRIER'
				}
			}]
		},{
			text: 'Orders',
			align: 'left',
			width: 100,
			renderer: function(v,metaData,record) {
				var arr = [] ;
				record.orders().each(function(orderRecord) {
					arr.push( '<b>'+orderRecord.get('id_dn')+'</b>' ) ;
				})
				return arr.join('<br>') ;
			}
		},{
			text: 'EDI Sword',
			align: 'center',
			hideable: true,
			hidden: true,
			columns:[{
				text: 'EDI Ready',
				align: 'center',
				dataIndex: 'sword_edi_1_ready',
				width: 60,
				renderer: function(v) {
					if(v) { return '<b>'+'X'+'</b>' ; }
				},
				filter: {
					type: 'boolean'
				}
			},{
				text: 'EDI Sent',
				align: 'center',
				dataIndex: 'sword_edi_1_sent',
				width: 60,
				renderer: function(v) {
					if(v) { return '<b>'+'X'+'</b>' ; }
				},
				filter: {
					type: 'boolean'
				}
			}]
		}] ;
		
		
		var columnDefaults = {
			menuDisabled: false,
			draggable: false,
			sortable: true,
			hideable: false,
			resizable: true,
			groupable: false,
			lockable: false
		} ;
		/*
		Ext.Array.each( stepColumns, function(column) {
			Ext.applyIf( column, columnDefaults ) ;
		}) ;
		Ext.Array.each( columns, function(column) {
			Ext.applyIf( column, columnDefaults ) ;
		}) ;
		*/
		
		var tmpGridCfg = {
			border: false,
			xtype: 'grid',
			itemId: 'pGrid',
			bodyCls: 'op5-spec-dbstracy-files-grid',
			store: {
				model: 'DbsTracyFileTrsptModel',
				data: [],
				proxy: {
					type: 'memory',
					reader: {
						type: 'json'
					}
				}
			},
			columns: columns,
			plugins: [{
				ptype: 'uxgridfilters'
			}],
			listeners: {
				itemcontextmenu: this.onTrsptContextMenu,
				scope: this
			},
			viewConfig: {
				getRowClass: function(record) {
					if( record.get('calc_customs_is_wait') ) {
						return 'op5-spec-dbstracy-files-customs' ;
					}
				},
				enableTextSelection: true
			},
			_prioMap: prioMap,
			_consigneeMap: consigneeMap,
			_stepsMap: stepsMap
		} ;
		
		var pCenter = this.down('#pCenter'), pNorth = this.down('#pNorth') ;
		pNorth.setVisible(false) ;
		pNorth.removeAll() ;
		pCenter.removeAll() ;
		pCenter.add(tmpGridCfg);
		
		this.doLoad() ;
	},
	onTrsptContextMenu: function(view, record, item, index, event) {
		var gridContextMenuItems = new Array() ;
		
		var selRecords = view.getSelectionModel().getSelection() ;
		if( selRecords.length != 1 ) {
			return ;
		}
		var selRecord = selRecords[0] ;
		gridContextMenuItems.push({
			disabled: true,
			text: '<b>'+selRecord.get('id_doc')+'</b>'
		},'-',{
			iconCls: 'icon-bible-edit',
			text: 'Edit TrsptFile',
			handler : function() {
				this.handleEditTrspt( selRecord.getId() ) ;
			},
			scope : this
		});
		if( Ext.isEmpty(record.get('calc_step')) && record.orders().getCount()==0 
				&& Optima5.Modules.Spec.DbsTracy.HelperCache.authHelperQueryPage('ADMIN') ) {
			gridContextMenuItems.push({
				iconCls: 'icon-bible-delete',
				text: 'Delete TrsptFile',
				handler : function() {
					this.handleDeleteTrspt( selRecord.getId() ) ;
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
	
	
	
	doConfigureOrder: function() {
		this.doConfigureNull() ;
		
		var prioMap = {} ;
		Ext.Array.each( Optima5.Modules.Spec.DbsTracy.HelperCache.getPriorityAll(), function(prio) {
			prioMap[prio.prio_id] = prio ;
		}) ;
		
		var consigneeMap = {} ;
		Ext.Array.each( Optima5.Modules.Spec.DbsTracy.HelperCache.getListData('LIST_CONSIGNEE'), function(r) {
			consigneeMap[r.id] = r.text ;
		}) ;
		
		var stepsMap = {} ;
		Ext.Array.each( Optima5.Modules.Spec.DbsTracy.HelperCache.getOrderflowAll(), function(flow) {
			Ext.Array.each( flow.steps, function(step) {
				stepsMap[step.step_code] = step ;
			}) ;
		}) ;
		
		
		var dateHrRenderer = function(v) {
			var dateSql ;
			dateSql = Ext.Date.format(v,'d/m/Y H:i') ;
			return dateSql.replace(' ','<br>') ;
		};
		var dateRenderer = function(v) {
			var dateSql ;
			dateSql = Ext.Date.format(v,'d/m/Y') ;
			return dateSql ;
		};
		var stepRenderer = function(vObj,metaData) {
			if( !vObj ) {
				//metaData.tdCls += ' '+'op5-spec-dbstracy-gridcell-gray' ;
				return '&#160;' ;
			}
			if( !vObj.pending && !vObj.ACTUAL_dateSql ) {
				return '&#160;' ;
			}
			var dateSql ;
			if( vObj.pending ) {
				dateSql = vObj.ETA_dateSql ;
			} else {
				dateSql = vObj.ACTUAL_dateSql ;
			}
			switch( vObj.color ) {
				case 'red' :
				case 'orange' :
				case 'green' :
					metaData.tdCls += ' '+'op5-spec-dbstracy-gridcell-'+vObj.color ;
					break ;
			}
			if( !Ext.isEmpty(dateSql) ) {
				metaData.tdCls += ' '+'op5-spec-dbstracy-gridcell-bold' ;
			} else {
				metaData.tdCls += ' '+'op5-spec-dbstracy-gridcell-nobold' ;
			}
			if( Ext.isEmpty(dateSql) ) {
				return '&#160;' ;
			}
			dateSql = Ext.Date.format(Ext.Date.parse(dateSql,'Y-m-d H:i:s'),'d/m/Y H:i') ;
			return dateSql.replace(' ','<br>') ;
		};
		
		var cmpModelfields = [{
			name: '_color',
			type: 'string'
		},{
			name: '_is_selection',
			type: 'boolean',
			allowNull: true
		},
		{name: 'order_filerecord_id', type:'int'},
		{name: 'flow_code', type:'string'},
		{name: 'id_soc', type:'string'},
		{name: 'id_dn', type:'string'},
		{name: 'ref_po', type:'string'},
		{name: 'ref_invoice', type:'string'},
		{name: 'ref_mag', type:'string'},
		{name: 'atr_type', type:'string'},
		{name: 'atr_priority', type:'string'},
		{name: 'atr_incoterm', type:'string'},
		{name: 'atr_consignee', type:'string'},
		{name: 'txt_location_city', type:'string'},
		{name: 'txt_location_full', type:'string'},
		{name: 'adr_json', type:'string'},
		{name: 'desc_txt', type:'string'},
		{name: 'desc_value', type:'number'},
		{name: 'desc_value_currency', type:'string'},
		{name: 'vol_kg', type:'number'},
		{name: 'vol_dims', type:'string'},
		{name: 'vol_count', type:'int'},
		{name: 'date_create', type:'date', dateFormat:'Y-m-d H:i:s'},
		{name: 'date_init', type:'date', dateFormat:'Y-m-d H:i:s'},
		{name: 'date_closed', type:'date', dateFormat:'Y-m-d H:i:s'},
		{name: 'date_crd', type:'date', dateFormat:'Y-m-d H:i:s'},
		{name: 'calc_step', type:'string'},
		{name: 'calc_step_warning_edi', type:'boolean'},
		{name: 'calc_link_is_active', type:'boolean'},
		{name: 'calc_link_trspt_filerecord_id', type:'int'},
		{name: 'calc_link_trspt_txt', type:'string'},
		{name: 'calc_hat_is_active', type:'boolean'},
		{name: 'calc_hat_filerecord_id', type:'int'},
		{name: 'calc_hat_txt', type:'string'},
		
		{name: 'warning_is_on', type: 'boolean', allowNull: true},
		{name: 'warning_code', type: 'string'},
		{name: 'warning_txt', type: 'string'},
		
		{name: 'kpi_is_on', type: 'boolean', allowNull: true},
		{name: 'kpi_is_ok_raw', type: 'boolean', allowNull: true},
		{name: 'kpi_is_ok', type: 'boolean', allowNull: true},
		{name: 'kpi_code', type: 'string'},
		{name: 'kpi_txt', type: 'string'},
		{name: 'kpi_calc_step', type:'string'},
		{name: 'kpi_calc_date_target', type:'date', dateFormat:'Y-m-d H:i:s'},
		{name: 'kpi_calc_date_actual', type:'date', dateFormat:'Y-m-d H:i:s'}
		] ;
		var validBtn = Ext.create('Ext.button.Button',{
			iconCls: 'op5-spec-mrfoxy-financebudget-newrevisionmenu-save'
		});
		var buttonMarkup = Ext.DomHelper.markup(validBtn.getRenderTree());
		validBtn.destroy() ;
		var columns = [{
			hidden: true,
			width: 60,
			xtype: 'uxnullcheckcolumn',
			_is_selection_mode: null,
			sortable: false,
			dataIndex: '_is_selection',
			text: '<b><font color="red">Create</font></b>' + '<div align="center">' + buttonMarkup + '</div>',
			isColumnCreate: true,
			listeners: {
				// attach event listener to buttonMarkup
				afterrender: function(editingColumn) {
					editingColumn.getEl().on( 'click', function(e,t) {
						e.stopEvent() ;
						switch( editingColumn._is_selection_mode ) {
							case 'trspt' :
								return this.handleNewTrsptSelection() ;
							case 'hat' :
								return this.handleNewHatSelection() ;
						}
					},this,{delegate:'.x-btn'}) ;
				},
				scope: this
			}
		},{
			text: '<b>BU</b>',
			dataIndex: 'id_soc',
			width:50,
			align: 'center'
		},{
			text: 'Type',
			dataIndex: 'atr_type',
			width:50,
			align: 'center',
			filter: {
				type: 'op5crmbasebible',
				optimaModule: this.optimaModule,
				bibleId: 'LIST_TYPE'
			}
		},{
			xtype: 'treecolumn',
			text: '<b>DN#</b>',
			dataIndex: 'id_dn',
			width:150,
			tdCls: 'op5-spec-dbstracy-bigcolumn',
			resizable: true,
			align: 'left',
			filter: {
				type: 'string'
			},
			renderer: function(v) {
				return '<b>'+v+'</b>';
			}
		},{
			text: 'Priority',
			dataIndex: 'atr_priority',
			width:70,
			align: 'center',
			renderer: function(v,metaData) {
				if( Ext.isEmpty(v) ) {
					return '' ;
				}
				var prioMap = this._prioMap ;
				if( prioMap.hasOwnProperty(v) ) {
					var prioData = prioMap[v] ;
					return '<font color="' + prioData.prio_color + '">' + prioData.prio_code + '</font>' ;
				}
				return '?' ;
			},
			filter: {
				type: 'op5crmbasebible',
				optimaModule: this.optimaModule,
				bibleId: 'LIST_SERVICE'
			}
		},{
			text: 'PO#',
			dataIndex: 'ref_po',
			width:120,
			tdCls: 'op5-spec-dbstracy-bigcolumn',
			resizable: true,
			hidden: true,
			align: 'center',
			filter: {
				type: 'string'
			}
		},{
			text: 'Invoice#',
			dataIndex: 'ref_invoice',
			width:120,
			tdCls: 'op5-spec-dbstracy-bigcolumn',
			resizable: true,
			align: 'center',
			filter: {
				type: 'string'
			}
		},{
			text: 'Mag#',
			dataIndex: 'ref_mag',
			width:80,
			tdCls: 'op5-spec-dbstracy-bigcolumn',
			resizable: true,
			hidden: true,
			hideable: true,
			align: 'center',
			filter: {
				type: 'string'
			}
		},{
			text: 'Incoterm',
			dataIndex: 'atr_incoterm',
			width:60,
			tdCls: 'op5-spec-dbstracy-bigcolumn',
			resizable: true,
			align: 'center',
			renderer: function(v) {
				return '<b>'+v+'</b>' ;
			},
			filter: {
				type: 'op5crmbasebible',
				optimaModule: this.optimaModule,
				bibleId: 'LIST_INCOTERM'
			}
		},{
			text: '<b>Consignee</b><br>Site location',
			dataIndex: 'atr_consignee',
			width:140,
			align: 'left',
			filter: {
				type: 'op5crmbasebible',
				optimaModule: this.optimaModule,
				bibleId: 'LIST_CONSIGNEE'
			},
			renderer: function(v,metaData,record) {
				var str = '' ;
				
				str+= '<b>' ;
				var consigneeMap = this._consigneeMap ;
				if( consigneeMap.hasOwnProperty(v) ) {
					str+= consigneeMap[v] ;
				} else {
					str+= v ;
				}
				str+= '</b>' ;
				
				if( !Ext.isEmpty( record.get('txt_location_city') ) ) {
					str+= '<br>' ;
					str+= Ext.util.Format.nl2br( Ext.String.htmlEncode( record.get('txt_location_city') ) ) ;
				}
				return str ;
			}
		},{
			text: '<b>Warning</b>',
			dataIndex: 'warning_code',
			width: 120,
			align: 'center',
			filter: {
				type: 'op5specdbstracycfgfilter',
				cfgParam_id: 'WARNINGCODE',
				cfgParam_emptyDisplayText: 'Select...',
				optimaModule: this.optimaModule
			},
			renderer: function(v,metaData,record) {
				if( record.get('warning_is_on')===null ) {
					return ;
				}
				if( !record.get('warning_is_on') ) {
					metaData.tdCls += ' op5-spec-dbstracy-files-nowarning' ;
					return ;
				}
				var txt = '' ;
				txt += '<font color="red"><b>'+record.get('warning_code')+'</b></font>' ;
				txt += '<br>' ;
				txt += Ext.util.Format.nl2br( Ext.String.htmlEncode( record.get('warning_txt') ) )
				return txt ;
			}
		},{
			hidden: true,
			hideable: true,
			text: 'Date Created',
			dataIndex: 'date_create',
			renderer: dateHrRenderer,
			width: 90,
			align: 'center',
			filter: {
				type: 'date',
				dateFormat: 'Y-m-d'
			}
		},{
			hidden: true,
			hideable: true,
			text: 'Date SM',
			dataIndex: 'date_init',
			renderer: dateRenderer,
			width: 90,
			align: 'center',
			filter: {
				type: 'date',
				dateFormat: 'Y-m-d'
			}
		},{
			hidden: true,
			hideable: true,
			text: 'Date Closed',
			dataIndex: 'date_closed',
			renderer: dateHrRenderer,
			width: 90,
			align: 'center',
			filter: {
				type: 'date',
				dateFormat: 'Y-m-d'
			}
		},{
			hidden: true,
			hideable: true,
			text: 'Date CRD',
			dataIndex: 'date_crd',
			renderer: dateRenderer,
			width: 90,
			align: 'center',
			filter: {
				type: 'date',
				dateFormat: 'Y-m-d'
			}
		},{
			hidden: true,
			text: '',
			dataIndex: '_color',
			width: 100,
			align: 'center',
			filter: {
				type: 'string'
			}
		},{
			text: '<b>Current step</b>',
			dataIndex: 'calc_step',
			width: 100,
			align: 'center',
			filter: {
				type: 'op5crmbasebible',
				optimaModule: this.optimaModule,
				bibleId: 'CFG_ORDERFLOW',
				listeners: {
					update: function() {
						this.doOrderSetColorFilter(null) ;
					},
					scope: this
				}
			},
			renderer: function(v,m,record) {
				var stepRow = this._stepsMap[v] ;
				if( !stepRow ) {
					return ;
				}
				var tmpProgress = stepRow['status_percent'] / 100 ;
				var tmpText = stepRow['desc_txt'] ;
					var b = new Ext.ProgressBar({height: 15, cls: 'op5-spec-mrfoxy-promolist-progress'});
					if( record.get('calc_step_warning_edi') ) {
						b.addCls('op5-spec-mrfoxy-promolist-progresscolor') ;
						tmpText = 'EDI Warning' ;
						m.tdCls += ' op5-spec-dbstracy-files-ediwarning' ;
					}
					switch( record.get('_color') ) {
						case 'green' :
							b.addCls('op5-spec-mrfoxy-promolist-progresscolorgreen') ;
							break ;
						case 'red' :
							b.addCls('op5-spec-mrfoxy-promolist-progresscolor') ;
							break ;
						default :
							break ;
					}
					b.updateProgress(tmpProgress,tmpText);
					v = Ext.DomHelper.markup(b.getRenderTree());
					b.destroy() ;
				return v;
			}
		}] ;
		
		var sortTypeFn = function(o1) {
			var v1 = '' ;
			if( o1 ) {
				if( !Ext.isEmpty(o1.ACTUAL_dateSql) ) {
					v1 = o1.ACTUAL_dateSql ;
				} else if( !Ext.isEmpty(o1.ETA_dateSql) ) {
					v1 = o1.ETA_dateSql ;
				} else {
					v1 = '' ;
				}
			}
			return v1 ;
		};
		var stepColumns = [] ;
		Ext.Array.each( Optima5.Modules.Spec.DbsTracy.HelperCache.getOrderflow('AIR').steps, function(step) {
			cmpModelfields.push({
				name: 'step_'+step.desc_code,
				type: 'auto',
				sortType: sortTypeFn
			}) ;
			if( this._readonlyMode && step.is_private ) {
				return ;
			}
			stepColumns.push({
				text: step.desc_txt,
				dataIndex: 'step_'+step.desc_code,
				renderer: stepRenderer,
				width: 90,
				align: 'center',
				filter: {
					type: 'date',
					dateFormat: 'Y-m-d',
					convertDateOnly: function(o1) {
						// HACK : overridding private method
						var v1 ;
						if( Ext.isDate(o1) ) {
							v1 = o1 ;
						} else if( Ext.isObject(o1) ) {
							if( !Ext.isEmpty(o1.ACTUAL_dateSql) ) {
								v1 = o1.ACTUAL_dateSql ;
							} else if( !Ext.isEmpty(o1.ETA_dateSql) ) {
								v1 = o1.ETA_dateSql ;
							} else {
								v1 = null ;
							}
							if( v1 ) {
								v1 = Ext.Date.parse(v1, "Y-m-d H:i:s");
							}
						}
						var result = null;
						if (v1) {
							//var v2 = new Date(v1) ;
							v1.setHours(0,0,0,0) ;
							result = v1.getTime();
						}
						return result;
					}
				}
			});
		},this) ;
		columns.push({
			text: '<b><i>Process steps</i></b>',
			align: 'center',
			columns: stepColumns
		});
		columns.push({
			text: '<b><i>KPI data</i></b>',
			align: 'center',
			hidden: this._readonlyMode,
			columns: [{
				text: '<b>Raw KPI</b>',
				dataIndex: 'kpi_is_ok_raw',
				renderer: function( value, metadata, record ) {
					if( value===true ) {
						metadata.tdCls = 'op5-spec-dbstracy-kpi-ok' ;
						return ;
					}
					if( value===false ) {
						metadata.tdCls = 'op5-spec-dbstracy-kpi-nok' ;
						return ;
					}
				},
				filter: {
					type: 'boolean',
					operator: '==='
				}
			},{
				text: '<b>final KPI</b>',
				dataIndex: 'kpi_code',
				width: 120,
				align: 'center',
				filter: {
					type: 'op5specdbstracycfgfilter',
					cfgParam_id: 'KPICODE',
					cfgParam_emptyDisplayText: 'Select...',
					optimaModule: this.optimaModule
				},
				renderer: function(v,metaData,record) {
					if( !record.get('kpi_is_on') ) {
						return ;
					}
					var color, txtbase ;
					if( record.get('kpi_is_ok') ) {
						color = 'green' ;
						txtbase = 'OK' ;
					} else {
						color = 'red' ;
						txtbase = 'FAIL' ;
					}
					var txt = '' ;
					txt += '<font color="'+color+'"><b>'+txtbase+' '+record.get('kpi_code')+'</b></font>' ;
					txt += '<br>' ;
					txt += Ext.util.Format.nl2br( Ext.String.htmlEncode( record.get('kpi_txt') ) )
					return txt ;
				}
			}]
		});
		
		cmpModelfields.push({
			name: 'hat_filerecord_id',
			type: 'int'
		}) ;
		
		var kpiCodeColumns = [] ;
		Ext.Array.each( Optima5.Modules.Spec.DbsTracy.HelperCache.getKpiCodeAll(), function(kpicode) {
			kpiCodeColumns.push({
				text: kpicode.calc_txt,
				dataIndex: 'kpidata_'+kpicode.calc_code,
				width: 90,
				align: 'center',
				renderer: function( value, metadata, record ) {
					if( value===true ) {
						metadata.tdCls = 'op5-spec-dbstracy-kpi-ok' ;
						return ;
					}
					if( value===false ) {
						metadata.tdCls = 'op5-spec-dbstracy-kpi-nok' ;
						return ;
					}
				},
				filter: {
					type: 'boolean',
					operator: '==='
				}
			});
			cmpModelfields.push({
				name: 'kpidata_'+kpicode.calc_code,
				type: 'bool',
				allowNull: true
			}) ;
		}) ;
		columns.push({
			hidden: true,
			hideable: true,
			text: '<b><i>KPI calculations</i></b>',
			align: 'center',
			columns: kpiCodeColumns
		});
		
			
		this.tmpModelName = ('DbsTracyFileRowModel' + '-' + this.getId()).replace(/[^a-z0-9]/gmi,'') ;
		Ext.ux.dams.ModelManager.unregister( this.tmpModelName ) ;
		Ext.define(this.tmpModelName, {
			extend: 'Ext.data.Model',
			idProperty: 'id',
			fields: cmpModelfields
		});
		
		var columnDefaults = {
			menuDisabled: false,
			draggable: false,
			sortable: true,
			hideable: false,
			resizable: true,
			groupable: false,
			lockable: false
		} ;
		Ext.Array.each( stepColumns, function(column) {
			Ext.applyIf( column, columnDefaults ) ;
		}) ;
		Ext.Array.each( columns, function(column) {
			Ext.applyIf( column, columnDefaults ) ;
		}) ;
		
		var tmpGridCfg = {
			border: false,
			xtype: 'treepanel',
			rootVisible: false,
			itemId: 'pGrid',
			bodyCls: 'op5-spec-dbstracy-files-grid',
			store: {
				clearOnLoad: true,
				model: this.tmpModelName,
				proxy: {
					type: 'memory',
					reader: {
						type: 'json'
					}
				}
			},
			columns: columns,
			plugins: [{
				ptype: 'uxgridfilters'
			}],
			listeners: {
				render: this.doConfigureOrderOnRender,
				itemclick: this.onOrderClick,
				itemcontextmenu: this.onOrderContextMenu,
				added: function(gridpanel) {
					gridpanel.headerCt.on('menucreate',this.onOrderColumnsMenuCreate,this) ;
				},
				scope: this
			},
			viewConfig: {
				plugins: {
					ptype: 'gridviewdragdrop',
					enableDrag: true,
					enableDrop: false,
					ddGroup: 'OrdersDD'+this.optimaModule.sdomainId
				},
				getRowClass: function(record) {
					if( record.get('warning_is_on') ) {
						return 'op5-spec-dbstracy-files-warning' ;
					}
				},
				enableTextSelection: true
			},
			_prioMap: prioMap,
			_consigneeMap: consigneeMap,
			_stepsMap: stepsMap
		} ;
		
		var pCenter = this.down('#pCenter'), pNorth = this.down('#pNorth') ;
		pCenter.removeAll() ;
		pCenter.add(tmpGridCfg);
		
		
		// ********** North panel *************
		var northRenderer = function(value, metaData, record, rowIndex, colIndex) {
			var header = this.headerCt.getHeaderAtIndex(colIndex),
				renderColor = header._renderColor;
			metaData.style += 'background:'+renderColor+'; ' ;
			metaData.tdCls += ' ' + 'op5-spec-dbstracy-bigcolumn';
			return '<b>'+value+'</b' ;
		};

		var pushModelfields=[], stepColumns = [], colorSet = [] ;
		Ext.Array.each( Optima5.Modules.Spec.DbsTracy.HelperCache.getOrderflow('AIR').steps, function(step) {
			pushModelfields.push('step_'+step.desc_code) ;
			stepColumns.push({
				text: step.desc_txt,
				dataIndex: 'step_'+step.desc_code,
				renderer: northRenderer,
				_renderColor: step.chart_color,
				width: 90,
				align: 'center'
			});
			colorSet.push(step.chart_color) ;
		}) ;
		
		pNorth.setVisible(true && !this._readonlyMode) ;
		pNorth.removeAll() ;
		if( !this._readonlyMode ) {
			pNorth.add({
				border: false,
				width: ((90 * stepColumns.length) + 0),
				xtype: 'grid',
				columns: [{
					text: '<b><i>Process steps</i></b>',
					align: 'center',
					columns: stepColumns
				}],
				store: {
					proxy: {
						type: 'memory',
						reader: {
							type: 'json'
						}
					},
					fields: pushModelfields,
					data: []
				}
			},{
				flex: 1,
				xtype:'chart',
					animate: true,
					shadow: true,
					store: {
						proxy: {
							type: 'memory',
							reader: {
								type:'json'
							}
						},
						fields: Ext.Array.merge(['dummy'], pushModelfields),
						data: []
					},
					axes: [{
						type: 'Numeric',
						position: 'bottom',
						fields: pushModelfields,
						title: false,
						grid: true,
						majorTickSteps: 5
					}],
					series: [{
						colorSet: colorSet,
						type: 'bar',
						axis: 'bottom',
						gutter: 80,
						xField: 'dummy',
						yField: pushModelfields,
						stacked: true,
						tips: {
							trackMouse: true,
							width: 160,
							height: 28,
							renderer: function(storeItem, item) {
								this.setTitle("<span style='float:left'>"+ item.yField + ' :</span><span style="float:right">' + String(item.value[1]) + ' rows</span>');
							}
						},
						renderer: function(sprite, record, attributes, index, store) {
							index = index % this.colorSet.length ;
							Ext.apply(attributes,{
								fill: this.colorSet[index],
								stroke: this.colorSet[index]
							}) ;
							return attributes ;
						}
					}]
			}) ;
		}
		
		this.doLoad() ;
	},
	doConfigureOrderOnRender: function() {
		
	},
	onOrderClick: function( view, record, itemNode, index, e ) {
		if( !(record.get('order_filerecord_id') > 0) ) {
			// exclude HAT
			return ;
		}
		
		var cellNode = e.getTarget( view.getCellSelector() ),
			cellColumn = view.getHeaderByCell( cellNode ) ;
		if( cellColumn.dataIndex=='warning_code' ) {
			this.openWarningPanel( record ) ;
			return ;
		}
		if( cellColumn.dataIndex=='kpi_code' ) {
			if( record.get('kpi_is_on') && (!record.get('kpi_is_ok_raw') || !record.get('kpi_is_ok')) ) {
				this.openKpiPanel( record ) ;
				return ;
			}
		}
	},
	onOrderContextMenu: function(view, record, item, index, event) {
		var gridContextMenuItems = new Array() ;
		
		var selRecords = view.getSelectionModel().getSelection() ;
		if( selRecords.length != 1 ) {
			return ;
		}
		var selRecord = selRecords[0] ;
		if( selRecord.get('order_filerecord_id') > 0 ) {
			gridContextMenuItems.push({
				disabled: true,
				text: '<b>'+selRecord.get('id_soc')+'/'+selRecord.get('id_dn')+'</b>'
			},{
				iconCls: 'icon-bible-edit',
				text: 'Edit Order',
				handler : function() {
					this.handleEditOrder( selRecord.get('order_filerecord_id') ) ;
				},
				scope : this
			});
		}
		if( selRecord.get('calc_link_is_active') && !this._readonlyMode ) {
			gridContextMenuItems.push('-',{
				disabled: true,
				text: 'TrsptFile&#160;:&#160;<b>'+selRecord.get('calc_link_trspt_txt')+'</b>'
			},{
				iconCls: 'icon-bible-edit',
				text: 'Edit TrsptFile',
				handler : function() {
					this.handleEditTrspt( selRecord.get('calc_link_trspt_filerecord_id') ) ;
				},
				scope : this
			});
		}
		if( selRecord.get('hat_filerecord_id') > 0 ) {
			gridContextMenuItems.push({
				disabled: true,
				text: '<b>'+selRecord.get('id_soc')+'/'+selRecord.get('id_dn')+'</b>'
			},{
				iconCls: 'icon-bible-edit',
				text: 'Edit ShipGroup',
				handler : function() {
					this.handleEditHat( selRecord.get('hat_filerecord_id') ) ;
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
	onOrderColumnsMenuCreate: function( headerCt, menu ) {
		var me = this;
		if( true ) {
			menu.add({
				xtype: 'menuseparator',
				itemId: 'color-separator'
			},{
				itemId: 'color-menu',
				icon: 'images/op5img/ico_groupby_16.png',
				text: 'Color',
				menu: {
					defaults: {
						handler: function(menuitem) {
							this.doOrderSetColorFilter(menuitem._color) ;
						},
						scope: this
					},
					items: [{
						_color: null,
						text: '<i>All</i>'
					},{
						iconCls: 'op5-spec-mrfoxy-promolist-progressred-legend',
						_color: 'red',
						text: 'Red'
					},{
						iconCls: 'op5-spec-mrfoxy-promolist-progressgreen-legend',
						_color: 'green',
						text: 'Green'
					},{
						iconCls: 'op5-spec-mrfoxy-promolist-progressblue-legend',
						_color: 'blue',
						text: 'Blue'
					}]
				}
			});
		}
		menu.on('beforeshow', me.onOrderColumnsMenuBeforeShow, me);
	},
	onOrderColumnsMenuBeforeShow: function( menu ) {
		var me = this,
			activeHeader = menu.activeHeader,
			doShow = (activeHeader && activeHeader.dataIndex=='calc_step') ;
		menu.down('#color-separator').setVisible( doShow ) ;
		menu.down('#color-menu').setVisible( doShow ) ;
	},
	doOrderSetColorFilter: function( colorStr ) {
		Ext.Array.each( this.down('#pGrid').getColumns(), function(column) {
			if( column.filter && column.dataIndex=='_color' ) {
				if( !Ext.isEmpty(colorStr) ) {
					column.filter.setActive(true) ;
					column.filter.setValue(colorStr) ; // HACK!
				} else {
					column.filter.setActive(false) ;
				}
			}
		}) ;
	},
	
	
	onSocSet: function( socCode ) {
		this.updateToolbar() ;
		this.doLoad() ;
	},
	onSearchSelect: function() {
		this.doLoad(true) ;
	},
	
	doLoad: function(doClearFilters) {
		if( this.autoRefreshTask != null ) {
			this.autoRefreshTask.cancel() ;
		}
		
		switch( this.viewMode ) {
			case 'order' :
			case 'order-group-trspt' :
				return this.doLoadOrder(doClearFilters) ;
				
			case 'trspt' :
				return this.doLoadTrspt(doClearFilters) ;
				
			default:
				return ;
		}
	},
	doLoadOrder: function(doClearFilters) {
		delete this.ajaxDataOrder ;
		delete this.ajaxDataHat ;
		
		var filterParams = {
			filter_socCode: this.down('#btnSoc').getValue(),
			filter_archiveIsOn: (this.down('#tbArchiveIsOn').checked ? 1 : 0 )
		};
		if( !Ext.isEmpty(this.down('#btnSearch').getValue()) ) {
			Ext.apply(filterParams,{
				filter_searchTxt: this.down('#btnSearch').getValue()
			});
		}
		
		this.toggleNewTrspt(false) ;
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: Ext.apply({
				_moduleId: 'spec_dbs_tracy',
				_action: 'order_getRecords'
			},filterParams),
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.onResponseOrder(ajaxResponse.data) ;
				this.onResponse(doClearFilters) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: Ext.apply({
				_moduleId: 'spec_dbs_tracy',
				_action: 'hat_getRecords',
				skip_details : 1
			},filterParams),
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.onResponseHat(ajaxResponse.data) ;
				this.onResponse(doClearFilters) ;
			},
			callback: function() {
				
			},
			scope: this
		}) ;
	},
	onResponseOrder: function(ajaxData) {
		this.ajaxDataOrder = ajaxData ;
	},
	onResponseHat: function(ajaxData) {
		this.ajaxDataHat = ajaxData ;
	},
	onResponse: function(doClearFilters) {
		if( !(this.ajaxDataOrder && this.ajaxDataHat) ) {
			return ;
		}
		var ajaxDataOrder = this.ajaxDataOrder ;
		var ajaxDataHat = this.ajaxDataHat ;
		this.ajaxDataOrder = null ;
		this.ajaxDataHat = null ;
		
		// Setup autoRefresh task
		this.autoRefreshTask.delay( this.autoRefreshDelay ) ;
		
		this.onLoadOrder(ajaxDataOrder, ajaxDataHat, doClearFilters) ;
	},
	onLoadOrder: function(ajaxDataOrder, ajaxDataHat, doClearFilters) {
		//delete this.ajaxDataOrder ;
		//delete this.ajaxDataHat ;
		
		// Trad => stepCode => descCode
		var map_stepCode_descCode = {},
			map_stepDescCodes_count = {} ;
		Ext.Array.each( Optima5.Modules.Spec.DbsTracy.HelperCache.getOrderflowAll(), function(flow) {
			Ext.Array.each(flow.steps, function(step) {
				map_stepCode_descCode[step.step_code] = step.desc_code ;
				if( !map_stepDescCodes_count.hasOwnProperty(step.desc_code) ) {
					map_stepDescCodes_count[step.desc_code] = 0 ;
				}
			});
		}) ;
		
		var map_orderId_orderRow = {} ;
		Ext.Array.each(ajaxDataOrder, function(row) {
			Ext.Array.each( row.steps, function(rowStep) {
				var stepCode = rowStep.step_code,
					rowKey = 'step_'+map_stepCode_descCode[stepCode] ;
				if( rowStep.status_is_ok != 1 ) {
					row[rowKey] = {
						color: ''
					} ;
					return ;
				}
				row[rowKey] = {
					color: 'green',
					ACTUAL_dateSql: rowStep.date_actual
				} ;
			}) ;
			
			var recordTest ;
			if( !row.calc_link_is_active ) {
				recordTest = new DbsTracyFileOrderModel(row) ;
				if( Optima5.Modules.Spec.DbsTracy.HelperCache.checkOrderData(recordTest.getData()) != null ) {
					row['_color'] = 'red' ;
				} else {
					row['_color'] = 'green' ;
				}
			} else {
				row['_color'] = 'blue' ;
			}
			
			var curStepCode = row.calc_step,
				curStepDescCode = map_stepCode_descCode[curStepCode] ;
			if( map_stepDescCodes_count.hasOwnProperty(curStepDescCode) ) {
				map_stepDescCodes_count[curStepDescCode]++ ;
			}
			
			map_orderId_orderRow[row['order_filerecord_id']] = row ;
		}) ;
		
		var map_hatId_hatRow = {}, map_orderId_hatId = {} ;
		Ext.Array.each(ajaxDataHat, function(row) {
			map_hatId_hatRow[row['hat_filerecord_id']] = row ;
			Ext.Array.each(row.orders, function(rowLinkOrder) {
				map_orderId_hatId[rowLinkOrder['order_filerecord_id']] = row['hat_filerecord_id'] ;
			});
		}) ;
		
		var gridData = [] ;
		Ext.Array.each(ajaxDataOrder, function(row) {
			/*
			 * Si hat + map_hatId_hatRow > construction du hat
			 * - delete map_hatId_hatRow 
			 */
			var orderFilerecordId = row['order_filerecord_id'] ;
			if( map_orderId_hatId.hasOwnProperty(orderFilerecordId) ) {
				if( !map_hatId_hatRow.hasOwnProperty(map_orderId_hatId[orderFilerecordId]) ) {
					// hat déja construit
					return ;
				}
				
				var hatData = map_hatId_hatRow[map_orderId_hatId[orderFilerecordId]],
					hatHeader = {} ;
				hatHeader['id_soc'] = hatData.id_soc ;
				hatHeader['id_dn'] = hatData.id_hat ;
				hatHeader['order_filerecord_id'] = null ;
				hatHeader['hat_filerecord_id'] = hatData.hat_filerecord_id ;
				hatHeader['calc_step'] = row.calc_step ;
				hatHeader['_color'] = row._color ;
				Ext.Object.each( row, function(k,v) {
					if( Ext.Array.contains(['txt','atr','ref'],k.split('_')[0]) ) {
						hatHeader[k] = v ;
					}
				}) ;
				
				var hatChildren = [] ;
				Ext.Array.each( hatData.orders, function(rowLinkOrder) {
					var orderRow = map_orderId_orderRow[rowLinkOrder['order_filerecord_id']] ;
					if( !orderRow ) {
						//console.dir(rowLinkOrder['order_filerecord_id']) ;
						return ;
					}
					
					var hatChild = Ext.clone(orderRow) ;
					hatChild['id'] = hatData.hat_filerecord_id+'-'+orderRow['order_filerecord_id'];
					hatChild['leaf'] = true ;
					hatChildren.push(hatChild) ;
				}) ;
				
				hatHeader['leaf'] = false ;
				hatHeader['expanded'] = true ;
				hatHeader['children'] = hatChildren ;
				hatHeader['id'] = hatData.hat_filerecord_id ;
				gridData.push(hatHeader) ;
				
				//delete map_hatId_hatRow 
				delete map_hatId_hatRow[map_orderId_hatId[orderFilerecordId]] ;
				
				return ;
			}
			
			var singleOrderRow = map_orderId_orderRow[row['order_filerecord_id']] ;
			singleOrderRow['leaf'] = true ;
			gridData.push(singleOrderRow) ;
		}) ;
		
		if( doClearFilters ) {
			this.down('#pCenter').down('#pGrid').getStore().clearFilter() ;
			this.down('#pCenter').down('#pGrid').filters.clearFilters() ;
		}
		// To refresh root node : https://www.sencha.com/forum/showthread.php?303359
		this.down('#pCenter').down('#pGrid').getStore().getProxy().setData({root: true, expanded: true, children: gridData}) ;
		this.down('#pCenter').down('#pGrid').getStore().reload() ;
		
		if( !this._readonlyMode ) {
			var northRecord = {
				dummy: ''
			} ;
			Ext.Object.each( map_stepDescCodes_count, function(stepDescCode,count) {
				northRecord['step_'+stepDescCode] = count ;
			});
			this.down('#pNorth').down('grid').getStore().loadData([northRecord]) ;
			this.down('#pNorth').down('chart').getStore().loadData([northRecord]) ;
		}
	},
	
	doLoadTrspt: function(doClearFilters) {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'trspt_getRecords',
				filter_socCode: this.down('#btnSoc').getValue(),
				filter_archiveIsOn: (this.down('#tbArchiveIsOn').checked ? 1 : 0 )
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.onLoadTrspt(ajaxResponse.data, doClearFilters) ;
				// Setup autoRefresh task
				this.autoRefreshTask.delay( this.autoRefreshDelay ) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onLoadTrspt: function(ajaxData, doClearFilters) {
		if( doClearFilters ) {
			this.down('#pCenter').down('#pGrid').getStore().clearFilter() ;
			this.down('#pCenter').down('#pGrid').filters.clearFilters() ;
		}
		this.down('#pCenter').down('#pGrid').getStore().loadRawData(ajaxData) ;
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
	
	toggleNewTrspt: function(torf) {
		if( this.viewMode != 'order' ) {
			return ;
		}
		this.down('toolbar').down('#tbViewmode').setVisible(!torf && !this._readonlyMode) ;
		this.down('toolbar').down('#tbCreate').setVisible(!torf && !this._readonlyMode) ;
		if( !torf ) {
			this.down('#pCenter').down('#pGrid').child('headercontainer').down('checkcolumn').setVisible(false) ;
		}
		if( torf ) {
			this.autoRefreshTask.cancel() ;
			this.down('#pCenter').down('#pGrid').child('headercontainer').down('checkcolumn').setVisible(true) ;
			this.down('#pCenter').down('#pGrid').child('headercontainer').down('checkcolumn')._is_selection_mode = 'trspt' ;
		}
		
		if( this.down('#pCenter').down('#pGrid').getStore() instanceof Ext.data.TreeStore ) {
			this.down('#pCenter').down('#pGrid').getRootNode().cascadeBy( function(node) {
				node.set('_is_selection', ( (torf && node.get('hat_filerecord_id')) ? false : null ) ) ;
				node.commit() ;
			}) ;
		}
	},
	toggleNewHat: function(torf) {
		if( this.viewMode != 'order' ) {
			return ;
		}
		this.down('toolbar').down('#tbViewmode').setVisible(!torf && !this._readonlyMode) ;
		this.down('toolbar').down('#tbCreate').setVisible(!torf && !this._readonlyMode) ;
		if( !torf ) {
			this.down('#pCenter').down('#pGrid').child('headercontainer').down('checkcolumn').setVisible(false) ;
		}
		if( torf ) {
			this.autoRefreshTask.cancel() ;
			this.down('#pCenter').down('#pGrid').child('headercontainer').down('checkcolumn').setVisible(true) ;
			this.down('#pCenter').down('#pGrid').child('headercontainer').down('checkcolumn')._is_selection_mode = 'hat' ;
		}
		
		if( this.down('#pCenter').down('#pGrid').getStore() instanceof Ext.data.TreeStore ) {
			this.down('#pCenter').down('#pGrid').getRootNode().cascadeBy( function(node) {
				node.set('_is_selection', ( (torf && node.isLeaf()) ? false : null ) ) ;
				node.commit() ;
			}) ;
		}
	},
	
	handleNewOrder: function() {
		this.optimaModule.postCrmEvent('openorder',{orderNew:true}) ;
	},
	handleEditOrder: function( orderFilerecordId ) {
		this.optimaModule.postCrmEvent('openorder',{orderFilerecordId:orderFilerecordId}) ;
	},
	handleNewHat: function() {
		this.toggleNewHat(true) ;
	},
	handleEditHat: function( hatFilerecordId ) {
		this.optimaModule.postCrmEvent('openhat',{hatFilerecordId:hatFilerecordId}) ;
	},
	handleNewTrspt: function() {
		this.toggleNewTrspt(true) ;
		//this.optimaModule.postCrmEvent('opentrspt',{trsptNew:true}) ;
	},
	handleEditTrspt: function( trsptFilerecordId ) {
		this.optimaModule.postCrmEvent('opentrspt',{trsptFilerecordId:trsptFilerecordId}) ;
	},
	handleNewTrsptSelection: function() {
		var orderRecords = [];
		this.down('#pCenter').down('#pGrid').getStore().each( function(orderRecord) {
			if( orderRecord.get('_is_selection') ) {
				orderRecords.push( orderRecord ) ;
			}
		}) ;
		if( orderRecords.length == 0 ) {
			return ;
		}
		this.optimaModule.postCrmEvent('opentrspt',{
			trsptNew:true,
			trsptNew_orderRecords: orderRecords
		}) ;
	},
	handleNewHatSelection: function() {
		var orderRecords = [];
		this.down('#pCenter').down('#pGrid').getStore().each( function(orderRecord) {
			if( orderRecord.get('_is_selection') ) {
				orderRecords.push( orderRecord ) ;
			}
		}) ;
		if( orderRecords.length == 0 ) {
			return ;
		}
		this.optimaModule.postCrmEvent('openhat',{
			hatNew:true,
			hatNew_orderRecords: orderRecords
		}) ;
	},
	
	handleDeleteTrspt: function( trsptFilerecordId ) {
		if( !Optima5.Modules.Spec.DbsTracy.HelperCache.authHelperQueryPage('ADMIN') ) {
			Ext.Msg.alert('Auth','Not authorized') ;
			return ;
		}
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'trspt_delete',
				trspt_filerecord_id: trsptFilerecordId
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == true ) {
					this.doLoad() ;
				}
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	
	openWarningPanel: function( orderRecord ) {
		if( this._readonlyMode ) {
			return ;
		}
		var postParams = {} ;
		var orderWarningPanel = Ext.create('Optima5.Modules.Spec.DbsTracy.OrderWarningPanel',{
			optimaModule: this.optimaModule,
			orderRecord: orderRecord,
			width:500, // dummy initial size, for border layout to work
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
			
			title: 'Warning / RedFlag'
		});
		
		orderWarningPanel.on('destroy',function(validConfirmPanel) {
			this.getEl().unmask() ;
			this.floatingPanel = null ;
		},this,{single:true}) ;
		
		this.getEl().mask() ;
		
		orderWarningPanel.show();
		orderWarningPanel.getEl().alignTo(this.getEl(), 'c-c?');
		
		this.floatingPanel = orderWarningPanel ;
	},
	openKpiPanel: function( orderRecord ) {
		if( this._readonlyMode ) {
			return ;
		}
		var postParams = {} ;
		var orderWarningPanel = Ext.create('Optima5.Modules.Spec.DbsTracy.OrderKpiPanel',{
			optimaModule: this.optimaModule,
			orderRecord: orderRecord,
			width:800, // dummy initial size, for border layout to work
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
			
			title: 'KPI tuning'
		});
		
		orderWarningPanel.on('destroy',function(validConfirmPanel) {
			this.getEl().unmask() ;
			this.floatingPanel = null ;
		},this,{single:true}) ;
		
		this.getEl().mask() ;
		
		orderWarningPanel.show();
		orderWarningPanel.getEl().alignTo(this.getEl(), 'c-c?');
		
		this.floatingPanel = orderWarningPanel ;
	},
	
	
	handleDownload: function( everything ) {
		var action, recordIdProperty ;
		switch( this.viewMode ) {
			case 'order' :
			case 'order-group-trspt' :
				action = 'order_download' ;
				recordIdProperty = 'order_filerecord_id' ;
				break ;
				
			case 'trspt' :
				action = 'trspt_download' ;
				recordIdProperty = 'trspt_filerecord_id' ;
				break ;
				
			default:
				return ;
		}
		
		var columns = [] ;
		Ext.Array.each( this.down('#pCenter').down('#pGrid').headerCt.getGridColumns(), function(column) {
			columns.push({
				dataIndex: column.dataIndex,
				text: column.text
			});
		});
		
		if( !everything ) {
			var dataIds = [],
				gridStore = this.down('#pCenter').down('#pGrid').getStore() ;
			if( gridStore instanceof Ext.data.TreeStore ) {
				gridStore.getRootNode().cascadeBy( function(record) {
					if( record.get(recordIdProperty) > 0 ) {
						dataIds.push( record.get(recordIdProperty) ) ;
					}
				}) ;
			} else {
				gridStore.each( function(record) {
					if( record.get(recordIdProperty) > 0 ) {
						dataIds.push( record.get(recordIdProperty) ) ;
					}
				}) ;
			}
		}
		
		var exportParams = this.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(exportParams,{
			_moduleId: 'spec_dbs_tracy',
			_action: action,
			columns: Ext.JSON.encode(columns),
			dataIds: ( everything ? null : Ext.JSON.encode(dataIds) ),
			exportXls: true
		}) ;
		if( !Ext.isEmpty(this.down('#btnSoc').getValue()) ) {
			Ext.apply(exportParams,{
				filter_socCode: this.down('#btnSoc').getValue()
			}) ;
		}
		Ext.create('Ext.ux.dams.FileDownloader',{
			renderTo: Ext.getBody(),
			requestParams: exportParams,
			requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
			requestMethod: 'POST'
		}) ;
	},
	
	
	doQuit: function() {
		this.destroy() ;
	},
	onDestroy: function() {
		if( this.autoRefreshTask ) {
			this.autoRefreshTask.cancel() ;
		}
		Ext.ux.dams.ModelManager.unregister( this.tmpModelName ) ;
	}
});
