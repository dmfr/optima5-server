Ext.define('Optima5.Modules.Spec.DbsTracy.FilesGrid',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Optima5.Modules.Spec.DbsTracy.CfgParamButton',
		'Optima5.Modules.Spec.DbsTracy.OrderWarningPanel'
	],
	
	defaultViewMode: 'order',
	viewMode: null,
	autoRefreshDelay: (10*60*1000),
	
	initComponent: function() {
		Ext.apply(this, {
			layout: 'fit',
			tbar:[{
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
			}),'->',{
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
					}]
				}
			},'-',{
				iconCls: 'op5-crmbase-datatoolbar-file-export-excel',
				text: 'Export',
				handler: function() {
					this.handleDownload() ;
				},
				scope: this
			}],
			items: [{
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
		
		this.tmpModelCnt = 0 ;
		
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
		
		var withGrouping ;
		switch( this.viewMode ) {
			case 'order' :
			case 'order-group-trspt' :
				return this.doConfigureOrder(withGrouping=(this.viewMode=='order-group-trspt')) ;
				
			case 'trspt' :
				return this.doConfigureTrspt() ;
				
			default:
				return this.doConfigureNull() ;
		}
	},
	doConfigureNull: function() {
		var pCenter = this.down('#pCenter') ;
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
		}] ;
		
		
		var columnDefaults = {
			menuDisabled: (this._popupMode || this._readonlyMode ? true : false),
			draggable: false,
			sortable: (this._readonlyMode ? false : true),
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
		
		var pCenter = this.down('#pCenter') ;
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
		
		
		var stepRenderer = function(vObj,metaData) {
			if( !vObj ) {
				metaData.tdCls += ' '+'op5-spec-dbstracy-gridcell-gray' ;
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
		
		var pushModelfields = [{
			name: '_color',
			type: 'string'
		},{
			name: '_is_selection',
			type: 'boolean'
		}] ;
		var validBtn = Ext.create('Ext.button.Button',{
			iconCls: 'op5-spec-mrfoxy-financebudget-newrevisionmenu-save'
		});
		var buttonMarkup = Ext.DomHelper.markup(validBtn.getRenderTree());
		validBtn.destroy() ;
		var columns = [{
			hidden: true,
			width: 60,
			xtype: 'checkcolumn',
			sortable: false,
			dataIndex: '_is_selection',
			text: '<b><font color="red">Create</font></b>' + '<div align="center">' + buttonMarkup + '</div>',
			isColumnCreate: true,
			listeners: {
				// attach event listener to buttonMarkup
				afterrender: function(editingColumn) {
					editingColumn.getEl().on( 'click', function(e,t) {
						e.stopEvent() ;
						this.handleNewTrsptSelection() ;
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
			text: '<b>DN#</b>',
			dataIndex: 'id_dn',
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
			dataIndex: 'warning_is_on',
			width: 120,
			align: 'center',
			filter: {
				type: 'boolean'
			},
			renderer: function(v,metaData,record) {
				if( !v ) {
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
			pushModelfields.push({
				name: 'step_'+step.desc_code,
				type: 'auto',
				sortType: sortTypeFn
			}) ;
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
		}) ;
		columns.push({
			text: '<b><i>Process steps</i></b>',
			align: 'center',
			columns: stepColumns
		});
		
		this.tmpModelName = 'DbsTracyFileRowModel-' + this.getId() + (++this.tmpModelCnt) ;
		Ext.ux.dams.ModelManager.unregister( this.tmpModelName ) ;
		Ext.define(this.tmpModelName, {
			extend: 'DbsTracyFileOrderModel',
			fields: pushModelfields,
			hasMany: [{
				model: 'DbsTracyFileOrderStepModel',
				name: 'steps',
				associationKey: 'steps'
			}]
		});
		
		var columnDefaults = {
			menuDisabled: (this._popupMode || this._readonlyMode ? true : false),
			draggable: false,
			sortable: (this._readonlyMode ? false : true),
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
			xtype: 'grid',
			itemId: 'pGrid',
			bodyCls: 'op5-spec-dbstracy-files-grid',
			store: {
				model: this.tmpModelName,
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
		
		var pCenter = this.down('#pCenter') ;
		pCenter.removeAll() ;
		pCenter.add(tmpGridCfg);
		
		this.doLoad() ;
	},
	doConfigureOrderOnRender: function() {
		
	},
	onOrderClick: function( view, record, itemNode, index, e ) {
		var cellNode = e.getTarget( view.getCellSelector() ),
			cellColumn = view.getHeaderByCell( cellNode ) ;
		if( cellColumn.dataIndex=='warning_is_on' ) {
			this.openWarningPanel( record ) ;
			return ;
		}
	},
	onOrderContextMenu: function(view, record, item, index, event) {
		var gridContextMenuItems = new Array() ;
		
		var selRecords = view.getSelectionModel().getSelection() ;
		if( selRecords.length != 1 ) {
			return ;
		}
		var selRecord = selRecords[0] ;
		gridContextMenuItems.push({
			disabled: true,
			text: '<b>'+selRecord.get('id_soc')+'/'+selRecord.get('id_dn')+'</b>'
		},{
			iconCls: 'icon-bible-edit',
			text: 'Edit Order',
			handler : function() {
				this.handleEditOrder( selRecord.getId() ) ;
			},
			scope : this
		});
		if( selRecord.get('calc_link_is_active') ) {
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
		this.doLoad() ;
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
		this.toggleNewTrspt(false) ;
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'order_getRecords',
				filter_socCode: this.down('#btnSoc').getValue()
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.onLoadOrder(ajaxResponse.data, doClearFilters) ;
				// Setup autoRefresh task
				this.autoRefreshTask.delay( this.autoRefreshDelay ) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onLoadOrder: function(ajaxData, doClearFilters) {
		// Trad => stepCode => descCode
		var map_stepCode_descCode = {} ;
		Ext.Array.each( Optima5.Modules.Spec.DbsTracy.HelperCache.getOrderflowAll(), function(flow) {
			Ext.Array.each(flow.steps, function(step) {
				map_stepCode_descCode[step.step_code] = step.desc_code ;
			});
		}) ;
		
		var gridData = [] ;
		Ext.Array.each(ajaxData, function(row) {
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
			
			var recordTest = new DbsTracyFileOrderModel(row) ;
			if( !recordTest.get('calc_link_is_active') ) {
				if( Optima5.Modules.Spec.DbsTracy.HelperCache.checkOrderData(recordTest.getData()) != null ) {
					row['_color'] = 'red' ;
				} else {
					row['_color'] = 'green' ;
				}
			} else {
				row['_color'] = 'blue' ;
			}
			
			gridData.push(row) ;
		}) ;
		if( doClearFilters ) {
			this.down('#pCenter').down('grid').getStore().clearFilter() ;
			this.down('#pCenter').down('grid').filters.clearFilters() ;
		}
		this.down('#pCenter').down('grid').getStore().loadRawData(gridData) ;
	},
	
	doLoadTrspt: function(doClearFilters) {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'trspt_getRecords',
				filter_socCode: this.down('#btnSoc').getValue()
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
			this.down('#pCenter').down('grid').getStore().clearFilter() ;
			this.down('#pCenter').down('grid').filters.clearFilters() ;
		}
		this.down('#pCenter').down('grid').getStore().loadRawData(ajaxData) ;
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
		this.down('toolbar').down('#tbViewmode').setVisible(!torf) ;
		this.down('toolbar').down('#tbCreate').setVisible(!torf) ;
		if( !torf ) {
			this.down('grid').child('headercontainer').down('checkcolumn').setVisible(false) ;
			return ;
		}
		if( torf ) {
			this.autoRefreshTask.cancel() ;
			this.down('grid').child('headercontainer').down('checkcolumn').setVisible(true) ;
			return ;
		}
	},
	
	handleNewOrder: function() {
		this.optimaModule.postCrmEvent('openorder',{orderNew:true}) ;
	},
	handleEditOrder: function( orderFilerecordId ) {
		this.optimaModule.postCrmEvent('openorder',{orderFilerecordId:orderFilerecordId}) ;
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
		this.down('grid').getStore().each( function(orderRecord) {
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
	
	
	handleDownload: function() {
		var action ;
		switch( this.viewMode ) {
			case 'order' :
			case 'order-group-trspt' :
				action = 'order_download' ;
				break ;
				
			case 'trspt' :
				action = 'trspt_download' ;
				break ;
				
			default:
				return ;
		}
		
		var columns = [] ;
		Ext.Array.each( this.down('#pCenter').down('grid').headerCt.getGridColumns(), function(column) {
			columns.push({
				dataIndex: column.dataIndex,
				text: column.text
			});
		});
		
		var dataIds = [] ;
		this.down('#pCenter').down('grid').getStore().each( function(record) {
			dataIds.push( record.getId() ) ;
		}) ;
		
		var exportParams = this.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(exportParams,{
			_moduleId: 'spec_dbs_tracy',
			_action: action,
			columns: Ext.JSON.encode(columns),
			dataIds: Ext.JSON.encode(dataIds),
			exportXls: true
		}) ;
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
	}
});
