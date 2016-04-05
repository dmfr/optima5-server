Ext.define('Optima5.Modules.Spec.DbsTracy.FilesGrid',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Optima5.Modules.Spec.DbsTracy.CfgParamButton',
		'Optima5.Modules.Spec.DbsTracy.TrsptFilePanel',
		'Optima5.Modules.Spec.DbsTracy.OrderFilePanel'
	],
	
	defaultViewMode: 'order',
	viewMode: null,
	
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
						}
					},{
						text: 'Transport',
						icon: 'images/op5img/ico_new_16.gif',
						handler: function() {
							this.handleNewTrspt() ;
						}
					}]
				}
			},'-',{
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
		
		this.tmpModelName = 'DbsTracyFileRowModel-' + this.getId() + (++this.tmpModelCnt) ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpModelName ) ;
		}) ;
		
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
		Ext.Array.each( Optima5.Modules.Spec.DbsTracy.HelperCache.getOrderflow('AIR').steps, function(step) {
			stepsMap[step.step_code] = step ;
		}) ;
		
		var columns = [{
			text: '<b>BU</b>',
			dataIndex: 'id_soc',
			width:50,
			align: 'center'
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
				var tmpText = stepRow['step_txt'] ;
					var b = new Ext.ProgressBar({height: 15, cls: 'op5-spec-mrfoxy-promolist-progress'});
					b.updateProgress(tmpProgress,tmpText);
					v = Ext.DomHelper.markup(b.getRenderTree());
					b.destroy() ;
				return v;
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
					if( record.get('status_closed') ) {
						return 'op5-spec-dbsembramach-gridcell-done' ;
					}
				},
				enableTextSelection: true
			},
			_prioMap: prioMap,
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
		Ext.Array.each( Optima5.Modules.Spec.DbsTracy.HelperCache.getOrderflow('AIR').steps, function(step) {
			stepsMap[step.step_code] = step ;
		}) ;
		
		
		var stepRenderer = function(vObj,metaData) {
			if( !vObj ) {
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
		
		var pushModelfields = [] ;
		var columns = [{
			text: '<b>BU</b>',
			dataIndex: 'id_soc',
			width:50,
			align: 'center'
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
			align: 'center',
			filter: {
				type: 'string'
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
				if( prioMap.hasOwnProperty(v) ) {
					str+= consigneeMap[v] ;
				} else {
					str+= v ;
				}
				str+= '</b>' ;
				
				if( !Ext.isEmpty( record.get('txt_location') ) ) {
					str+= '<br>' ;
					str+= Ext.util.Format.nl2br( Ext.String.htmlEncode( record.get('txt_location') ) ) ;
				}
				return str ;
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
				var tmpText = stepRow['step_txt'] ;
					var b = new Ext.ProgressBar({height: 15, cls: 'op5-spec-mrfoxy-promolist-progress'});
					if( !record.get('calc_link_is_active') ) {
						b.addCls('op5-spec-mrfoxy-promolist-progresscolor') ;
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
				name: 'step_'+step.step_code,
				type: 'auto',
				sortType: sortTypeFn
			}) ;
			stepColumns.push({
				text: step.step_txt,
				dataIndex: 'step_'+step.step_code,
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
						}
						var result = null;
						if (v1) {
							var v2 = new Date(v1) ;
							v2.setHours(0,0,0,0) ;
							result = v2.getTime();
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
		
		Ext.ux.dams.ModelManager.unregister( this.tmpModelName ) ;
		Ext.define(this.tmpModelName, {
			extend: 'DbsTracyFileOrderModel',
			fields: pushModelfields
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
				itemcontextmenu: this.onOrderContextMenu,
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
					if( record.get('status_closed') ) {
						return 'op5-spec-dbsembramach-gridcell-done' ;
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
	
	onSocSet: function( socCode ) {
		this.doLoad() ;
	},
	
	doLoad: function() {
		switch( this.viewMode ) {
			case 'order' :
			case 'order-group-trspt' :
				return this.doLoadOrder() ;
				
			case 'trspt' :
				return this.doLoadTrspt() ;
				
			default:
				return ;
		}
	},
	doLoadOrder: function() {
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
				this.onLoadOrder(ajaxResponse.data) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onLoadOrder: function(ajaxData) {
		var flowSteps = Optima5.Modules.Spec.DbsTracy.HelperCache.getOrderflow('AIR').steps ; //TODO
		
		var gridData = [] ;
		Ext.Array.each(ajaxData, function(row) {
			Ext.Array.each( row.steps, function(rowStep) {
				var stepCode = rowStep.step_code,
					rowKey = 'step_'+stepCode ;
				if( rowStep.status_is_ok != 1 ) {
					return ;
				}
				row[rowKey] = {
					color: 'green',
					ACTUAL_dateSql: rowStep.date_actual
				} ;
			}) ;
			gridData.push(row) ;
		}) ;
		this.down('#pCenter').down('grid').getStore().loadRawData(gridData) ;
	},
	
	doLoadTrspt: function() {
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
				this.onLoadTrspt(ajaxResponse.data) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onLoadTrspt: function(ajaxData) {
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
	
	handleNewOrder: function() {
		this.optimaModule.postCrmEvent('openorder',{orderNew:true}) ;
	},
	handleEditOrder: function( orderFilerecordId ) {
		this.optimaModule.postCrmEvent('openorder',{orderFilerecordId:orderFilerecordId}) ;
	},
	handleNewTrspt: function() {
		this.optimaModule.postCrmEvent('opentrspt',{trsptNew:true}) ;
	},
	handleEditTrspt: function( trsptFilerecordId ) {
		this.optimaModule.postCrmEvent('opentrspt',{trsptFilerecordId:trsptFilerecordId}) ;
	},
	
	doQuit: function() {
		this.destroy() ;
	}
});
