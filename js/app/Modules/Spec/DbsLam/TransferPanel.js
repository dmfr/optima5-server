Ext.define('DbsLamTransferTreeModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name: 'display_txt', string: 'string'},
		{name: 'type', type:'string'},
		{name: 'transfer_filerecord_id', type:'int'},
		{name: 'status_code', type:'string'}
	]
});

Ext.define('DbsLamTransferGridModel',{
	extend: 'Ext.data.Model',
	idProperty: 'transferlig_filerecord_id',
	fields: [
		{name: 'transfer_filerecord_id', type:'int'},
		{name: 'transferlig_filerecord_id', type:'int'},
		{name: 'status', type:'boolean'},
		{name: 'src_adr', type:'string'},
		{name: 'desc_adr', type:'string'},
		{name: 'stk_prod', type:'string'},
		{name: 'stk_batch', type:'string'},
		{name: 'stk_sn', type:'string'},
		{name: 'mvt_qty', type:'number'}
	]
});


Ext.define('Optima5.Modules.Spec.DbsLam.TransferPanel',{
	extend:'Ext.panel.Panel',
	
	requires: ['Optima5.Modules.Spec.DbsLam.TransferCreateForm'],
	
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
					icon: 'images/op5img/ico_back_16.gif',
					text: '<u>Back</u>',
					handler: function(){
						this.doQuit() ;
					},
					scope: this
				},'-',Ext.create('Optima5.Modules.Spec.DbsLam.CfgParamButton',{
					cfgParam_id: 'WHSE',
					icon: 'images/op5img/ico_blocs_small.gif',
					text: '<i>Origin</i>',
					itemId: 'btnWhseSrc',
					optimaModule: this.optimaModule
				}),{
					icon: 'images/op5img/ico_arrow-double_16.png',
					disabled: true,
					style: {opacity: 1}
				},Ext.create('Optima5.Modules.Spec.DbsLam.CfgParamButton',{
					cfgParam_id: 'WHSE',
					icon: 'images/op5img/ico_blocs_small.gif',
					text: '<i>Destination</i>',
					itemId: 'btnWhseDest',
					optimaModule: this.optimaModule
				}),'-',{
					itemId: 'tbCreate',
					icon: 'images/op5img/ico_new_16.gif',
					text: '<b>New doc.</b>',
					handler: function() {
						this.openCreatePopup() ;
					},
					scope: this
				},'-',{
					hidden:true,
					itemId: 'tbAdd',
					iconCls: 'op5-spec-dbslam-transfer-add',
					text: '<b>Build/Pick</b>',
					handler: function() {
						this.openStockPopup() ;
					},
					scope: this
				},{
					hidden:true,
					itemId: 'tbPrint',
					icon: 'images/op5img/ico_print_16.png',
					text: '<b>Print</b>',
					handler: function() {
						this.openPrintPopup() ;
					},
					scope: this
				}],
				items: [{xtype:'component',cls: 'ux-noframe-bg', flex:1}]
			},{
				region: 'east',
				flex: 2,
				xtype: 'panel',
				layout: 'fit',
				itemId:'mStockFormContainer',
				collapsible:true,
				collapsed: true,
				_empty:true,
				listeners:{
					beforeexpand:function(eastpanel) {
						if( eastpanel._empty ) {
							return false;
						}
					},
					scope:this
				}
			}]
		});
		this.callParent() ;
		this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
		
		this.updateToolbar() ;
		this.doConfigure() ;
	},
	updateToolbar: function() {
		if( this.down('#pCenter').down('#pTree') ) {
			var treepanel = this.down('#pCenter').down('#pTree'),
				selectedNodes = treepanel.getView().getSelectionModel().getSelection(),
				isDocSelected = (selectedNodes.length==1 && selectedNodes[0].get('type')=='transfer') ;
			this.down('toolbar').down('#tbAdd').setVisible(isDocSelected) ;
			this.down('toolbar').down('#tbPrint').setVisible(isDocSelected) ;
		}
	},
	doConfigure: function() {
		var pCenter = this.down('#pCenter') ;
		
		
		var pushModelfields = [], atrAdrColumns = [], atrStockColumns = [] ;
		Ext.Array.each( Optima5.Modules.Spec.DbsLam.HelperCache.getAttributeAll(), function( attribute ) {
			var fieldColumn = {
				locked: true,
				text: attribute.atr_txt,
				dataIndex: attribute.mkey,
				width: 75
			} ;
			if( attribute.ADR_fieldcode ) {
				atrAdrColumns.push(fieldColumn) ;
			}
			if( attribute.STOCK_fieldcode ) {
				atrStockColumns.push(fieldColumn) ;
			}
			
			pushModelfields.push({
				name: attribute.mkey,
				type: 'string'
			});
		}) ;
		
		Ext.ux.dams.ModelManager.unregister( this.tmpGridModelName ) ;
		Ext.define(this.tmpGridModelName, {
			extend: 'DbsLamTransferGridModel',
			fields: pushModelfields
		});
		
		pCenter.removeAll() ;
		pCenter.add({
			border: 1,
			width: 240,
			xtype: 'treepanel',
			itemId: 'pTree',
			store: {
				model: 'DbsLamTransferTreeModel',
				root:{},
				proxy: {
					type: 'memory',
					reader: {
						type: 'json'
					}
				}
			},
			collapsible: false,
			useArrows: false,
			rootVisible: true,
			multiSelect: false,
			singleExpand: false,
			columns: {
				defaults: {
					menuDisabled: false,
					draggable: false,
					sortable: false,
					hideable: false,
					resizable: false,
					groupable: false,
					lockable: false
				},
				items: [{
					xtype:'treecolumn',
					dataIndex: 'display_txt',
					text: 'Document ID',
					width: 120
				},{
					dataIndex: 'status_code',
					text: '<b>Status</b>',
					width: 70,
					renderer: function(v) {
						return '<b>'+v+'</b>' ;
					}
				}]
			},
			listeners: {
				itemcontextmenu: this.onTreeContextMenu,
				selectionchange: function() {
					this.updateToolbar()  ;
					this.doGridReload();
				},
				scope: this
			}
		},{
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
						_action: 'transfer_getTransferLig'
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
			selModel: {
				mode: 'MULTI'
			},
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
					text: '',
					width: 24,
					renderer: function(v,metadata,record) {
						if( Ext.isEmpty(record.get('inv_prod')) ) {
							metadata.tdCls = 'op5-spec-dbslam-stock-avail'
						} else {
							metadata.tdCls = 'op5-spec-dbslam-stock-notavail'
						}
					}
				},{
					text: '<b>Status</b>',
					dataIndex: 'dest_adr',
					width: 70
				},{
					text: '<b>Source Location</b>',
					dataIndex: 'src_adr',
					renderer: function(v) {
						return '<b>'+v+'</b>' ;
					}
				},{
					text: 'Stock Attributes',
					columns: atrStockColumns
				},{
					text: '<b>SKU details</b>',
					columns: [{
						dataIndex: 'stk_prod',
						text: 'Article',
						width: 100
					},{
						dataIndex: 'stk_batch',
						text: 'BatchCode',
						width: 100
					},{
						dataIndex: 'mvt_qty',
						text: 'Qty disp',
						align: 'right',
						width: 75
					},{
						dataIndex: 'stk_sn',
						text: 'Serial',
						width: 100
					}]
				},{
					text: '<b>Dest Location</b>',
					dataIndex: 'dest_adr'
				}]
			},
			plugins: [{
				ptype: 'bufferedrenderer',
				pluginId: 'bufferedRenderer',
				synchronousRender: true
			}],
			listeners: {
				render: this.doConfigureOnGridRender,
				itemcontextmenu: this.onGridContextMenu,
				scope: this
			},
			viewConfig: {
				preserveScrollOnRefresh: true,
				getRowClass: function(record) {
				},
				listeners: {
					beforerefresh: function(view) {
						view.isRefreshing = true ;
					},
					refresh: function(view) {
						view.isRefreshing = false ;
					}
				}
			}
		}) ;
		
		// Build tree
		this.doTreeLoad() ;
	},
	doConfigureOnGridRender: function(grid) {
		var me = this ;
		
		var gridPanelDropTargetEl =  grid.body.dom;

		var gridPanelDropTarget = Ext.create('Ext.dd.DropTarget', gridPanelDropTargetEl, {
			ddGroup: 'DbsLamStockDD',
			notifyEnter: function(ddSource, e, data) {
					//Add some flare to invite drop.
					grid.body.stopAnimation();
					grid.body.highlight();
			},
			notifyDrop: function(ddSource, e, data){
					var srcStockFilerecordIds = [] ;
					Ext.Array.each( ddSource.dragData.records, function(selectedRecord) {
						if( selectedRecord.get('inv_id') ) {
							srcStockFilerecordIds.push( selectedRecord.get('inv_id') ) ; 
						}
					});
					if( srcStockFilerecordIds.length > 0 ) {
						me.handleDropStock(srcStockFilerecordIds) ;
					}
			}
		});
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
	onTreeContextMenu: function(view, record, item, index, event) {
		var gridContextMenuItems = new Array() ;
		
		var selRecords = view.getSelectionModel().getSelection() ;
		if( selRecords.length != 1 || selRecords[0].get('type') != 'transfer' ) {
			return ;
		}
		var selRecord = selRecords[0];
		
		gridContextMenuItems.push({
			iconCls: 'icon-bible-delete',
			text: 'Delete <b>'+selRecord.get('display_txt')+'</b> doc',
			handler : function() {
				this.handleDeleteDoc( selRecord.get('transfer_filerecord_id') ) ;
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
	onGridContextMenu: function(view, record, item, index, event) {
		var gridContextMenuItems = new Array() ;
		
		var selRecords = view.getSelectionModel().getSelection() ;
		
		var entryKeys = [] ;
		for( var recIdx=0 ; recIdx<selRecords.length ; recIdx++ ) {
			entryKeys.push( selRecords[recIdx].get('transferlig_filerecord_id') ) ;
		}
		gridContextMenuItems.push({
			iconCls: 'icon-bible-delete',
			text: 'Remove <b>'+selRecords.length+'</b> rows',
			handler : function() {
				this.handleRemoveLigs( entryKeys ) ;
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
	
	
	
	doTreeLoad: function() {
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_getTransfer'
		} ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				
				var transferChildren = [] ;
				Ext.Array.each( ajaxResponse.data, function(transferDoc) {
					transferChildren.push({
						leaf: true,
						type: 'transfer',
						display_txt: transferDoc.transfer_txt,
						transfer_filerecord_id: transferDoc.transfer_filerecord_id,
						status_code: transferDoc.status_code
					}) ;
				}) ;
				
				var treepanel = this.down('#pCenter').down('#pTree') ;
				treepanel.getStore().setRootNode({
					root: true,
					iconCls:'task-folder',
					expanded:true,
					display_txt: '<b>Transfers</b>',
					children: transferChildren
				}) ;
			},
			scope: this
		}) ;
	},
	
	doGridReload: function() {
		var gridpanel = this.down('#pCenter').down('#pGrid') ;
		gridpanel.getStore().load() ;
	},
	onGridBeforeLoad: function(store,options) {
		var treepanel = this.down('#pCenter').down('#pTree'),
			selectedNodes = treepanel.getView().getSelectionModel().getSelection() ;
		var params = {} ;
		
		Ext.apply(params,{
			//whse_code: this.whseCode
		}) ;
		
		if( selectedNodes.length == 1 && !(selectedNodes[0].isRoot()) ) {
			Ext.apply(params,{
				filter_transferFilerecordId: selectedNodes[0].get('transfer_filerecord_id')
			}) ;
		}
		
		options.setParams(params) ;
	},
	
	openCreatePopup: function() {
		this.getEl().mask() ;
		// Open panel
		var createPanel = Ext.create('Optima5.Modules.Spec.DbsLam.TransferCreateForm',{
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
			}]
		});
		createPanel.on('saved', function(p) {
			this.doTreeLoad() ;
		},this,{single:true}) ;
		createPanel.on('destroy',function(p) {
			this.getEl().unmask() ;
			this.floatingPanel = null ;
		},this,{single:true}) ;
		
		createPanel.show();
		createPanel.getEl().alignTo(this.getEl(), 'c-c?');
	},
	
	openStockPopup: function() {
		this.optimaModule.createWindow({
			width:1100,
			height:600,
			resizable:true,
			layout:'fit',
			border: false,
			items:[Ext.create('Optima5.Modules.Spec.DbsLam.StockPanel',{
				optimaModule: this.optimaModule,
				_popupMode: true,
				_enableDD: true,
				whseCode: 'SDV'
			})]
		}) ;
	},
	
	openPrintPopup: function() {
		var pTreeSelection = this.down('#pCenter').down('#pTree').getSelectionModel().getSelection() ;
		if( pTreeSelection.length != 1 || pTreeSelection[0].get('type') != 'transfer' ) {
			Ext.MessageBox.alert('Error','No suitable doc selected.') ;
			return ;
		}
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'transfer_printDoc',
				transfer_filerecordId: pTreeSelection[0].get('transfer_filerecord_id') 
			},
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success == true ) {
					this.openPrintPopupDo( 'Transfer doc : '+pTreeSelection[0].get('display_txt'), jsonResponse.html ) ;
				} else {
					Ext.MessageBox.alert('Error','Print system disabled') ;
				}
			},
			callback: function() {
				
			},
			scope: this
		}) ;
	},
	openPrintPopupDo: function(pageTitle, pageHtml) {
		this.optimaModule.createWindow({
			width:850,
			height:700,
			iconCls: 'op5-crmbase-qresultwindow-icon',
			animCollapse:false,
			border: false,
			layout:'fit',
			title: pageTitle,
			items:[Ext.create('Ext.ux.dams.IFrameContent',{
				itemId: 'uxIFrame',
				content:pageHtml
			})],
			tbar:[{
				icon: 'images/op5img/ico_print_16.png',
				text: 'Print',
				handler: function(btn) {
					var uxIFrame = btn.up('window').down('#uxIFrame'),
						uxIFrameWindows = uxIFrame.getWin() ;
					if( uxIFrameWindows == null ) {
						Ext.MessageBox.alert('Problem','Printing disabled !') ;
						return ;
					}
					uxIFrameWindows.print() ;
				},
				scope: this
			}]
		}); 
	},
	
	handleDropStock: function(srcStockFilerecordIds) {
		var pTreeSelection = this.down('#pCenter').down('#pTree').getSelectionModel().getSelection() ;
		if( pTreeSelection.length != 1 || pTreeSelection[0].get('type') != 'transfer' ) {
			Ext.MessageBox.alert('Error','No suitable doc selected.') ;
			return ;
		}
		
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_addStock',
			stock_filerecordIds: Ext.JSON.encode(srcStockFilerecordIds),
			transfer_filerecordId: pTreeSelection[0].get('transfer_filerecord_id') 
		} ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.optimaModule.postCrmEvent('datachange') ;
			},
			scope: this
		}) ;
	},
	handleRemoveLigs: function(transferLigIds) {
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_removeStock',
			transferLig_filerecordIds: Ext.JSON.encode(transferLigIds) 
		} ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.optimaModule.postCrmEvent('datachange') ;
			},
			scope: this
		}) ;
	},
	handleDeleteDoc: function(transferFilerecordId) {
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_deleteDoc',
			transfer_filerecordId: transferFilerecordId
		} ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Document not empty !') ;
					return ;
				}
				this.doTreeLoad() ;
			},
			scope: this
		}) ;
	},
	
	doQuit: function() {
		this.destroy() ;
	}
}) ;