Ext.define('Optima5.Modules.Spec.BpSales.OrdersGrid',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Optima5.Modules.Spec.DbsTracy.CfgParamButton',
		'Optima5.Modules.Spec.DbsTracy.OrderWarningPanel'
	],
	
	defaultViewMode: 'cde',
	viewMode: null,
	autoRefreshDelay: (5*60*1000),
	
	initComponent: function() {
		Ext.apply(this, {
			layout: {
				type: 'fit'
			},
			tbar:[{
				icon: 'images/op5img/ico_back_16.gif',
				text: '<u>Back</u>',
				handler: function(){
					this.doQuit() ;
				},
				scope: this
			},'->',{
				itemId: 'tbCreate',
				icon: 'images/op5img/ico_new_16.gif',
				text:'Create file...',
				menu: {
					defaults: {
						scope:this
					},
					items: [{
						hidden: true,
						text: 'Order',
						icon: 'images/op5img/ico_new_16.gif',
						handler: function() {
							this.handleNewOrder() ;
						},
						scope: this
					},{
						text: 'Invoice',
						icon: 'images/op5img/ico_new_16.gif',
						handler: function() {
							this.handleNewInvoice() ;
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
						itemId: 'cde',
						text: 'Orders',
						iconCls: 'op5-spec-dbstracy-grid-view-order'
					},{
						itemId: 'inv',
						text: 'Invoices / Refunds',
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
		
		switch( this.viewMode ) {
			case 'cde' :
				this.down('#tbCreate').setVisible(false);
				return this.doConfigureOrder() ;
				
			case 'inv' :
				this.down('#tbCreate').setVisible(true);
				return this.doConfigureInvoice() ;
				
			default:
				return this.doConfigureNull() ;
		}
	},
	doConfigureNull: function() {
		this.removeAll() ;
		this.add({
			xtype:'box',
			cls:'op5-waiting',
			flex:1
		});
	},
	doConfigureOrder: function() {
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
			text: '<b>Order</b>',
			dataIndex: 'cde_ref',
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
			text: 'Customer',
			dataIndex: 'cli_link',
			width:150,
			resizable: true,
			align: 'left',
			filter: {
				type: 'op5crmbasebible',
				optimaModule: this.optimaModule,
				bibleId: 'CDE_STATUS'
			},
			renderer: function(v,m,r) {
				return r.get('cli_link_txt') ;
			}
		},{
			text: 'Invoice#',
			dataIndex: 'link_inv_id_inv',
			width:120,
			tdCls: 'op5-spec-dbstracy-bigcolumn',
			resizable: true,
			align: 'center',
			filter: {
				type: 'string'
			}
		},{
			text: '<b>Status</b>',
			dataIndex: 'status',
			width: 100,
			align: 'center',
			filter: {
				type: 'op5crmbasebible',
				optimaModule: this.optimaModule,
				bibleId: 'CDE_STATUS'
			},
			renderer: function(v,m,record) {
				var tmpProgress = record.get('status_percent') / 100 ;
				var tmpText = record.get('status_txt') ;
					var b = new Ext.ProgressBar({height: 15, cls: 'op5-spec-mrfoxy-promolist-progress'});
					switch( record.get('status_color') ) {
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
		},{
			text: 'Created',
			dataIndex: 'date_order',
			width:90,
			resizable: true,
			align: 'center',
			renderer: Ext.util.Format.dateRenderer('d/m/Y'),
			filter: {
				type: 'date'
			}
		},{
			text: 'Shipped',
			dataIndex: 'date_ship',
			width:90,
			resizable: true,
			align: 'center',
			renderer: Ext.util.Format.dateRenderer('d/m/Y'),
			filter: {
				type: 'date'
			}
		},{
			text: 'Nb UT',
			dataIndex: 'calc_count_ut',
			width:75,
			resizable: true,
			align: 'right',
			filter: {
				type: 'number'
			}
		},{
			text: 'Nb pack',
			dataIndex: 'calc_count_pack',
			width:75,
			resizable: true,
			align: 'right',
			filter: {
				type: 'number'
			}
		},{
			text: 'Weight',
			dataIndex: 'calc_weight_kg',
			width:75,
			resizable: true,
			align: 'right',
			filter: {
				type: 'number'
			},
			renderer: function(v) {
				return '<b>'+v+'</b>&#160;kg' ;
			}
		},{
			text: 'ExclVAT',
			dataIndex: 'link_inv_calc_amount_novat',
			width:75,
			resizable: true,
			align: 'right',
			filter: {
				type: 'number'
			},
			renderer: function(v) {
				if(v) {
				return '<b><font color="#AA0000">'+v+'</font></b>' ;
				}
			}
		},{
			text: 'NetVAT',
			dataIndex: 'link_inv_calc_amount_final',
			width:75,
			resizable: true,
			align: 'right',
			filter: {
				type: 'number'
			},
			renderer: function(v) {
				if(v) {
				return '<b><font color="#AA0000">'+v+'</font></b>' ;
				}
			}
		}] ;
		
		
		this.tmpModelName = 'BpSalesCdeRowModel-' + this.getId() + (++this.tmpModelCnt) ;
		Ext.ux.dams.ModelManager.unregister( this.tmpModelName ) ;
		Ext.define(this.tmpModelName, {
			extend: 'BpSalesCdeModel',
			fields: pushModelfields,
			hasMany: [{
				model: 'BpSalesCdeLigModel',
				name: 'ligs',
				associationKey: 'ligs'
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
		Ext.Array.each( columns, function(column) {
			Ext.applyIf( column, columnDefaults ) ;
		}) ;
		
		var tmpGridCfg = {
			border: false,
			xtype: 'grid',
			itemId: 'pGrid',
			bodyCls: 'op5-spec-dbstracy-files-grid',
			store: {
				autoLoad: false,
				model: this.tmpModelName,
				proxy: this.optimaModule.getConfiguredAjaxProxy({
					extraParams : {
						_moduleId: 'spec_bp_sales',
						_action: 'cde_getRecords'
					},
					reader: {
						type: 'json',
						rootProperty: 'data'
					}
				})
			},
			columns: columns,
			plugins: [{
				ptype: 'uxgridfilters'
			}],
			listeners: {
				render: this.doConfigureOnRender,
				itemclick: this.onOrderItemClick,
				itemcontextmenu: this.onOrderContextMenu,
				scope: this
			},
			viewConfig: {
				getRowClass: function(record) {
					if( record.get('warning_is_on') ) {
						return 'op5-spec-dbstracy-files-warning' ;
					}
				},
				enableTextSelection: true
			}
		} ;
		
		this.removeAll() ;
		this.add(tmpGridCfg);
		
		this.autoRefreshTask = new Ext.util.DelayedTask( function(){
			if( this.isDestroyed ) { // private check
				return ;
			}
			this.doLoad() ;
		},this);
		this.doLoad() ;
	},
	doConfigureInvoice: function() {
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
			text: '<b>Invoice</b>',
			dataIndex: 'id_inv',
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
			text: 'Customer',
			dataIndex: 'cli_link',
			width:150,
			resizable: true,
			align: 'left',
			filter: {
				type: 'op5crmbasebible',
				optimaModule: this.optimaModule,
				bibleId: 'CDE_STATUS'
			},
			renderer: function(v,m,r) {
				return r.get('cli_link_txt') ;
			}
		},{
			text: 'Order#',
			dataIndex: 'id_cde_ref',
			width:120,
			tdCls: 'op5-spec-dbstracy-bigcolumn',
			resizable: true,
			align: 'center',
			filter: {
				type: 'string'
			}
		},{
			text: '<b>Status</b>',
			dataIndex: 'status',
			width: 100,
			align: 'center',
			renderer: function(v,m,record) {
				var tmpProgress, tmpText, tmpColor ;
				if( record.get('status_is_final') ) {
					tmpColor = '' ;
					tmpText = 'Final' ;
					tmpProgress = 100/100 ;
				} else {
					tmpColor = 'red' ;
					tmpText = 'Open' ;
					tmpProgress = 30/100 ;
				}
				var b = new Ext.ProgressBar({height: 15, cls: 'op5-spec-mrfoxy-promolist-progress'});
				switch( tmpColor ) {
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
		},{
			text: 'Created',
			dataIndex: 'date_create',
			width:90,
			resizable: true,
			align: 'center',
			renderer: Ext.util.Format.dateRenderer('d/m/Y'),
			filter: {
				type: 'date'
			}
		},{
			text: 'Value Date',
			dataIndex: 'date_invoice',
			width:90,
			resizable: true,
			align: 'center',
			renderer: Ext.util.Format.dateRenderer('d/m/Y'),
			filter: {
				type: 'date'
			}
		},{
			text: 'ExclVAT',
			dataIndex: 'calc_amount_novat',
			width:75,
			resizable: true,
			align: 'right',
			filter: {
				type: 'number'
			},
			renderer: function(v) {
				if(v) {
				return '<b><font color="#AA0000">'+v+'</font></b>' ;
				}
			}
		},{
			text: 'NetVAT',
			dataIndex: 'calc_amount_final',
			width:75,
			resizable: true,
			align: 'right',
			filter: {
				type: 'number'
			},
			renderer: function(v) {
				if(v) {
				return '<b><font color="#AA0000">'+v+'</font></b>' ;
				}
			}
		}] ;
		
		
		this.tmpModelName = 'BpSalesInvRowModel-' + this.getId() + (++this.tmpModelCnt) ;
		Ext.ux.dams.ModelManager.unregister( this.tmpModelName ) ;
		Ext.define(this.tmpModelName, {
			extend: 'BpSalesInvModel',
			fields: pushModelfields,
			hasMany: [{
				model: 'BpSalesInvLigModel',
				name: 'ligs',
				associationKey: 'ligs'
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
		Ext.Array.each( columns, function(column) {
			Ext.applyIf( column, columnDefaults ) ;
		}) ;
		
		var tmpGridCfg = {
			border: false,
			xtype: 'grid',
			itemId: 'pGrid',
			bodyCls: 'op5-spec-dbstracy-files-grid',
			store: {
				autoLoad: false,
				model: this.tmpModelName,
				proxy: this.optimaModule.getConfiguredAjaxProxy({
					extraParams : {
						_moduleId: 'spec_bp_sales',
						_action: 'inv_getRecords',
						filter_fastMode: 1
					},
					reader: {
						type: 'json',
						rootProperty: 'data'
					}
				})
			},
			columns: columns,
			plugins: [{
				ptype: 'uxgridfilters'
			}],
			listeners: {
				render: this.doConfigureOnRender,
				itemclick: this.onOrderItemClick,
				itemcontextmenu: this.onOrderContextMenu,
				scope: this
			},
			viewConfig: {
				getRowClass: function(record) {
					if( record.get('warning_is_on') ) {
						return 'op5-spec-dbstracy-files-warning' ;
					}
				},
				enableTextSelection: true
			}
		} ;
		
		this.removeAll() ;
		this.add(tmpGridCfg);
		
		this.autoRefreshTask = new Ext.util.DelayedTask( function(){
			if( this.isDestroyed ) { // private check
				return ;
			}
			this.doLoad() ;
		},this);
		this.doLoad() ;
	},
	doConfigureOnRender: function() {
		
	},
	onOrderItemClick: function(view, record, item, index, event) {
		var tmpGridCfg = {
			border: false,
			xtype: 'grid',
			itemId: 'pGrid',
			bodyCls: 'op5-spec-dbstracy-files-grid',
			store: record.ligs(),
			columns: [{
				width: 120,
				text: '<b>Prod.ID</b>',
				dataIndex: 'prod_ref',
				renderer: function(v) {
					return '<b>' + v + '</b>'
				}
			},{
				width: 250,
				text: 'Prod. Desc',
				dataIndex: 'prod_ref_txt'
			},{
				width: 110,
				text: 'Batch',
				dataIndex: 'spec_batch'
			},{
				width: 110,
				text: 'DLC',
				dataIndex: 'spec_dlc',
				renderer: Ext.util.Format.dateRenderer('Y-m-d')
			},{
				width: 100,
				align: 'right',
				text: '<b>Qty Order</b>',
				dataIndex: 'qty_order',
				renderer: function(v,m,r) {
					if( r.get('status_is_ship') ) {
						return v ;
					}
					return '<b>' + v + '</b>'
				}
			},{
				width: 100,
				align: 'right',
				text: '<b>Qty Ship</b>',
				dataIndex: 'qty_ship',
				renderer: function(v,m,r) {
					if( !r.get('status_is_ship') ) {
						return '' ;
					}
					return '<b>' + v + '</b>'
				}
			},{
				width: 250,
				text: 'Comments',
				dataIndex: 'obs_txt'
			}],
			plugins: [{
				ptype: 'uxgridfilters'
			}],
			listeners: {},
			viewConfig: {
				getRowClass: function(record) {
					if( record.get('warning_is_on') ) {
						return 'op5-spec-dbstracy-files-warning' ;
					}
				},
				enableTextSelection: true
			}
		} ;
		
		var pSouth = this.down('#pSouth') ;
		pSouth.setTitle('Order# : '+record.get('cde_ref')) ;
		pSouth.removeAll() ;
		pSouth.add(tmpGridCfg);
		pSouth.expand() ;
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
			text: '<b>'+selRecord.get('cde_filerecord_id')+'/'+selRecord.get('cde_ref')+'</b>'
		},'-');
		if( selRecord.get('status_percent') > 50 ) {
			gridContextMenuItems.push({
				iconCls: 'icon-bible-edit',
				text: 'Open invoice',
				handler : function() {
					this.handleOpenInvoice( selRecord.get('link_inv_filerecord_id') ) ;
				},
				scope : this
			});
		} else if( selRecord.get('status_percent') == 50 ) {
			gridContextMenuItems.push({
				iconCls: 'icon-bible-new',
				text: 'Create invoice',
				handler : function() {
					this.handleCreateInvoice( selRecord.get('cde_filerecord_id'), selRecord.get('cde_ref') ) ;
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
	
	
	doLoad: function(doClearFilters) {
		if( this.autoRefreshTask != null ) {
			this.autoRefreshTask.cancel() ;
		}
		
		var gridPanel = this.down('grid') ;
		gridPanel.getStore().load() ;
		if( this.autoRefreshTask != null ) {
			this.autoRefreshTask.delay(this.autoRefreshDelay) ;
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
	
	handleCreateInvoice: function( cdeFilerecordId, cdeRef ) {
		Ext.Msg.confirm('Confirm?','Create invoice from '+cdeRef,function(btn){
			if( btn=='yes' ) {
				this.doCreateInvoice(cdeFilerecordId) ;
			}
		},this);
	},
	doCreateInvoice: function( cdeFilerecordId ) {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_bp_sales',
				_action: 'inv_createFromOrder',
				cde_filerecord_id: cdeFilerecordId
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.optimaModule.postCrmEvent('datachange',{}) ;
				this.handleOpenInvoice(ajaxResponse.inv_filerecord_id) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	handleOpenInvoice: function( invFilerecordId ) {
		this.optimaModule.postCrmEvent('openinv',{invFilerecordId:invFilerecordId}) ;
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
